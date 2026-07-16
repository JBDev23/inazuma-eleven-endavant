interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  encoding?: string;
  data?: DataView;
}

interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFReadingEvent extends Event {
  message: NDEFMessage;
}

type NDEFWriteMessage =
  | string
  | { records: Array<Record<string, unknown>> };

declare class NDEFReader extends EventTarget {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  write(
    message: NDEFWriteMessage,
    options?: { overwrite?: boolean; signal?: AbortSignal },
  ): Promise<void>;
  addEventListener(
    type: 'reading' | 'readingerror',
    listener: (event: NDEFReadingEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: 'reading' | 'readingerror',
    listener: (event: NDEFReadingEvent) => void,
  ): void;
}
