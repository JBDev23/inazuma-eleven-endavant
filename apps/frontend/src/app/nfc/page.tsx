"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Nfc,
  Radio,
  RefreshCw,
  Smartphone,
  XCircle,
} from "lucide-react";
import {
  type BraceletData,
  type NfcSyncResult,
  CLUB_RESOURCES,
  braceletHasCoins,
} from "@inazuma/shared";
import { api } from "@/services/api";
import {
  getNfcAvailability,
  readBraceletFromTag,
  writeBraceletToTag,
  type BraceletWriteFormat,
} from "@/lib/nfc";
import { CLUB_RESOURCE_STYLES } from "@/components/economy/club-resource-styles";
import { BraceletSummary } from "@/components/nfc/BraceletSummary";

type SyncStep = "idle" | "reading" | "syncing" | "writing" | "done";

function formatDeposited(result: NfcSyncResult): string {
  return CLUB_RESOURCES.filter(({ key }) => result.deposited[key] > 0)
    .map(({ key, short }) => `+${result.deposited[key]} ${short}`)
    .join(", ");
}

export default function NfcSyncPage() {
  const nfcStatus = getNfcAvailability();
  const nfcAvailable = nfcStatus.available;
  const [step, setStep] = useState<SyncStep>("idle");
  const [error, setError] = useState("");
  const [writeWarning, setWriteWarning] = useState("");
  const [braceletWritten, setBraceletWritten] = useState(false);
  const [success, setSuccess] = useState("");
  const [lastBracelet, setLastBracelet] = useState<BraceletData | null>(null);
  const [syncResult, setSyncResult] = useState<NfcSyncResult | null>(null);

  const resetState = useCallback(() => {
    setStep("idle");
    setError("");
    setWriteWarning("");
    setBraceletWritten(false);
    setSuccess("");
    setLastBracelet(null);
    setSyncResult(null);
  }, []);

  const processBracelet = useCallback(async (
    bracelet: BraceletData,
    writeFormat: BraceletWriteFormat = "plain-string",
  ) => {
    setError("");
    setWriteWarning("");
    setSuccess("");
    setBraceletWritten(false);
    setLastBracelet(bracelet);
    setSyncResult(null);

    if (!braceletHasCoins(bracelet)) {
      setError("La pulsera no tiene monedas pendientes de sincronizar.");
      setStep("idle");
      return;
    }

    try {
      setStep("syncing");
      const result = await api.nfc.syncBracelet(bracelet);
      setSyncResult(result);
      setSuccess(
        `¡Monedas sincronizadas para ${result.clubName}! (${formatDeposited(result)})`,
      );

      if (nfcAvailable) {
        setStep("writing");
        try {
          await writeBraceletToTag(result.resetPayload, writeFormat);
          setBraceletWritten(true);
        } catch (writeErr) {
          setWriteWarning(
            writeErr instanceof Error
              ? writeErr.message
              : "No se pudo reiniciar la pulsera.",
          );
        }
      }

      setStep("done");
    } catch (err) {
      setStep("idle");
      setError(err instanceof Error ? err.message : "Error desconocido al sincronizar.");
    }
  }, [nfcAvailable]);

  const handleNfcRead = async () => {
    resetState();
    setStep("reading");

    try {
      const { bracelet, writeFormat } = await readBraceletFromTag();
      await processBracelet(bracelet, writeFormat);
    } catch (err) {
      setStep("idle");
      setError(err instanceof Error ? err.message : "No se pudo leer la pulsera.");
    }
  };

  const isBusy = step === "reading" || step === "syncing" || step === "writing";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white text-sm font-bold uppercase tracking-widest mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Volver al hub
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-cyan-950/50 rounded-2xl flex items-center justify-center border border-cyan-900/50">
              <Nfc className="text-cyan-400" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-wider">
                Sincronizar Pulsera
              </h1>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
                Descarga monedas al mercado
              </p>
            </div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Acerca tu pulsera NFC para transferir PP, PE, ¥ y PC al club asociado.
            Tras la sincronización, la pulsera se reinicia a cero automáticamente.
          </p>
        </header>

        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-start gap-3">
          {nfcAvailable ? (
            <Radio className="text-emerald-400 shrink-0 mt-0.5" size={18} />
          ) : (
            <Smartphone className="text-amber-400 shrink-0 mt-0.5" size={18} />
          )}
          <div className="text-sm">
            {nfcAvailable ? (
              <p className="text-emerald-300 font-bold">
                NFC disponible en este navegador.
              </p>
            ) : (
              <>
                <p className="text-amber-300 font-bold">NFC no disponible</p>
                {!nfcStatus.available && (
                  <>
                    <p className="text-amber-200/80 mt-1">{nfcStatus.reason}</p>
                    {nfcStatus.tips.length > 0 && (
                      <ul className="mt-3 space-y-2 text-slate-400 list-disc pl-4">
                        {nfcStatus.tips.map((tip) => (
                          <li key={tip}>{tip}</li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </>
            )}
            <p className="text-slate-500 mt-3">
              El número de equipo de la pulsera debe coincidir con el ID del club.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNfcRead}
          disabled={!nfcAvailable || isBusy}
          className="w-full bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-lg py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:bg-cyan-400"
        >
          {isBusy ? (
            <>
              <Loader2 className="animate-spin" size={22} />
              {step === "reading" && "Esperando pulsera…"}
              {step === "syncing" && "Sincronizando monedas…"}
              {step === "writing" && "Acerca la pulsera de nuevo para reiniciarla…"}
            </>
          ) : (
            <>
              <Nfc size={22} /> Escanear pulsera NFC
            </>
          )}
        </button>

        {writeWarning && syncResult && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-900/50 bg-amber-950/30 p-4">
            <Smartphone className="text-amber-400 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-black text-amber-300 uppercase text-sm tracking-wider">
                Pulsera no reiniciada
              </p>
              <p className="text-amber-200/90 text-sm mt-1">{writeWarning}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/30 p-4">
            <XCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-black text-red-300 uppercase text-sm tracking-wider">
                Error
              </p>
              <p className="text-red-200/90 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && syncResult && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-4">
            <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-black text-emerald-300 uppercase text-sm tracking-wider">
                Sincronización completada
              </p>
              <p className="text-emerald-100/90 text-sm mt-1">{success}</p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {CLUB_RESOURCES.map(({ key, short, name }) => {
                  const style = CLUB_RESOURCE_STYLES[key];
                  const deposited = syncResult.deposited[key];
                  if (deposited <= 0) return null;

                  return (
                    <div
                      key={key}
                      className={`rounded-lg border px-3 py-2 ${style.border} ${style.bg}`}
                    >
                      <p className="text-[10px] font-black uppercase text-slate-500">
                        +{deposited} {short}
                      </p>
                      <p className={`text-lg font-black tabular-nums ${style.text}`}>
                        {syncResult.newBalance[key].toLocaleString("es-ES")} total
                      </p>
                      <p className="text-[10px] text-slate-500">{name}</p>
                    </div>
                  );
                })}
              </div>

              {braceletWritten && (
                <p className="text-emerald-200/70 text-xs mt-3">
                  La pulsera ha sido reiniciada a cero. Puedes retirarla del lector.
                </p>
              )}
            </div>
          </div>
        )}

        {lastBracelet && (
          <div className="mt-6">
            <BraceletSummary bracelet={lastBracelet} />
          </div>
        )}

        {step === "done" && (
          <button
            type="button"
            onClick={resetState}
            className="mt-6 w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors"
          >
            <RefreshCw size={16} /> Sincronizar otra pulsera
          </button>
        )}
      </div>
    </main>
  );
}
