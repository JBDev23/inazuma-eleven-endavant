import type { BraceletData } from '@inazuma/shared';
import { parseBraceletPayload } from '@inazuma/shared';

const BRACELET_MIME = 'application/vnd.inazuma.bracelet+json';

export type BraceletWriteFormat = 'plain-string' | 'text' | 'json-mime' | 'bracelet-mime';

export interface BraceletReadResult {
  bracelet: BraceletData;
  writeFormat: BraceletWriteFormat;
}

export type NfcAvailability =
  | { available: true }
  | { available: false; reason: string; tips: string[] };

export function getNfcAvailability(): NfcAvailability {
  if (typeof window === 'undefined') {
    return {
      available: false,
      reason: 'Entorno no compatible.',
      tips: [],
    };
  }

  if (!window.isSecureContext) {
    return {
      available: false,
      reason:
        'Estás en HTTP por IP de red local. Web NFC solo funciona con HTTPS o localhost.',
      tips: [
        'Opción A (recomendada): conecta el móvil por USB, activa depuración USB y ejecuta: adb reverse tcp:3000 tcp:3000 && adb reverse tcp:4000 tcp:4000 — luego abre http://localhost:3000/nfc en Chrome Android.',
        'Opción B: expón la app con HTTPS (ngrok, Cloudflare Tunnel, mkcert…).',
      ],
    };
  }

  if (!('NDEFReader' in window)) {
    return {
      available: false,
      reason: 'Este navegador no expone la API Web NFC.',
      tips: [
        'Usa Chrome en Android (iOS y PC no soportan Web NFC).',
        'Comprueba que NFC está activado en Ajustes del móvil.',
      ],
    };
  }

  return { available: true };
}

export function isNfcSupported(): boolean {
  return getNfcAvailability().available;
}

function decodeRecordPayload(
  record: NDEFRecord,
): { text: string; writeFormat: BraceletWriteFormat } | null {
  if (record.recordType === 'text' && record.data) {
    return {
      text: new TextDecoder(record.encoding ?? 'utf-8').decode(record.data),
      writeFormat: 'text',
    };
  }

  if (record.recordType === 'mime' && record.data) {
    const text = new TextDecoder().decode(record.data);
    if (record.mediaType === BRACELET_MIME) {
      return { text, writeFormat: 'bracelet-mime' };
    }
    if (record.mediaType === 'application/json' || record.mediaType === 'text/plain') {
      return { text, writeFormat: 'json-mime' };
    }
    // Cualquier otro MIME: intentar parsear como JSON de pulsera.
    return { text, writeFormat: 'json-mime' };
  }

  if (record.data) {
    try {
      return {
        text: new TextDecoder().decode(record.data),
        writeFormat: 'plain-string',
      };
    } catch {
      return null;
    }
  }

  return null;
}

function extractBraceletFromRecords(records: NDEFRecord[]): BraceletReadResult {
  for (const record of records) {
    const decoded = decodeRecordPayload(record);
    if (!decoded) continue;

    try {
      return {
        bracelet: parseBraceletPayload(decoded.text),
        writeFormat: decoded.writeFormat,
      };
    } catch {
      // Intentar con el siguiente registro.
    }
  }

  throw new Error('No se pudo leer la información de la pulsera.');
}

function buildWriteMessage(data: BraceletData, format: BraceletWriteFormat) {
  const payload = JSON.stringify(data);

  switch (format) {
    case 'text':
      return {
        message: { records: [{ recordType: 'text', data: payload }] },
      };
    case 'json-mime':
      return {
        message: {
          records: [
            {
              recordType: 'mime',
              mediaType: 'application/json',
              data: new TextEncoder().encode(payload),
            },
          ],
        },
      };
    case 'bracelet-mime':
      return {
        message: {
          records: [
            {
              recordType: 'mime',
              mediaType: BRACELET_MIME,
              data: new TextEncoder().encode(payload),
            },
          ],
        },
      };
    case 'plain-string':
    default:
      return { message: payload };
  }
}

const WRITE_FORMAT_FALLBACKS: BraceletWriteFormat[] = [
  'plain-string',
  'text',
  'json-mime',
  'bracelet-mime',
];

function formatUserNfcError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('not ndef') || lower.includes('io error')) {
    return (
      'No se pudo escribir en la pulsera: el chip no es compatible con NDEF o no está formateado. ' +
      'Las monedas ya están en tu cuenta; reinicia la pulsera manualmente en el sistema externo.'
    );
  }

  if (lower.includes('read-only') || lower.includes('not writable')) {
    return (
      'La pulsera es de solo lectura. Las monedas ya están sincronizadas, pero no se pudo reiniciar el chip.'
    );
  }

  return message || 'Error al escribir en la pulsera.';
}

async function writeWithFallbacks(
  reader: NDEFReader,
  data: BraceletData,
  preferredFormat: BraceletWriteFormat,
): Promise<BraceletWriteFormat> {
  const formats = [
    preferredFormat,
    ...WRITE_FORMAT_FALLBACKS.filter((f) => f !== preferredFormat),
  ];

  let lastError: unknown;

  for (const format of formats) {
    const { message } = buildWriteMessage(data, format);
    try {
      await reader.write(message, { overwrite: true });
      return format;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('No se pudo escribir en la pulsera.');
}

/**
 * Espera un tap NFC y escribe usando el mismo reader dentro del evento `reading`
 * (patrón recomendado por la spec Web NFC).
 */
export async function writeBraceletToTag(
  data: BraceletData,
  preferredFormat: BraceletWriteFormat = 'plain-string',
): Promise<void> {
  if (!isNfcSupported()) {
    throw new Error('Tu navegador no soporta escritura NFC.');
  }

  const reader = new NDEFReader();
  await reader.scan();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Tiempo de espera agotado. Acerca la pulsera al lector.'));
    }, 30_000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      reader.removeEventListener('reading', onReading);
      reader.removeEventListener('readingerror', onError);
    };

    const onReading = async () => {
      cleanup();
      try {
        await writeWithFallbacks(reader, data, preferredFormat);
        resolve();
      } catch (error) {
        reject(new Error(formatUserNfcError(error)));
      }
    };

    const onError = () => {
      cleanup();
      reject(new Error('Error de lectura NFC al preparar la escritura.'));
    };

    reader.addEventListener('reading', onReading, { once: true });
    reader.addEventListener('readingerror', onError, { once: true });
  });
}

export async function readBraceletFromTag(): Promise<BraceletReadResult> {
  if (!isNfcSupported()) {
    throw new Error('Tu navegador no soporta lectura NFC.');
  }

  const reader = new NDEFReader();
  await reader.scan();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Tiempo de espera agotado. Acerca la pulsera al lector.'));
    }, 30_000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      reader.removeEventListener('reading', onReading);
      reader.removeEventListener('readingerror', onError);
    };

    const onReading = (event: NDEFReadingEvent) => {
      cleanup();
      try {
        resolve(extractBraceletFromRecords([...event.message.records]));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Error al leer la pulsera.'));
      }
    };

    const onError = () => {
      cleanup();
      reject(new Error('Error de lectura NFC. Vuelve a intentarlo.'));
    };

    reader.addEventListener('reading', onReading, { once: true });
    reader.addEventListener('readingerror', onError, { once: true });
  });
}
