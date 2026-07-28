"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { ApiError } from "@/services/api";
import { useOnlineStatus } from "@/lib/use-online-status";

type MarketRequestStateProps = {
  title?: string;
  loadingLabel?: string;
  slowLabel?: string;
  error?: unknown;
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  accentClassName?: string;
  className?: string;
};

const getErrorCopy = (error: unknown, isOnline: boolean) => {
  if (!isOnline) {
    return {
      title: "Sin conexion",
      description: "Parece que no tienes internet. Revisa la conexion e intentalo de nuevo.",
      icon: WifiOff,
      accentClassName: "text-amber-400",
    };
  }

  if (error instanceof ApiError) {
    if (error.code === "TIMEOUT") {
      return {
        title: "La carga va demasiado lenta",
        description: error.userMessage,
        icon: RefreshCw,
        accentClassName: "text-orange-400",
      };
    }

    return {
      title: "No se pudo completar la carga",
      description: error.userMessage,
      icon: AlertTriangle,
      accentClassName: "text-red-400",
    };
  }

  return {
    title: "No se pudo completar la carga",
    description: "Ha ocurrido un problema al cargar esta pantalla. Intentalo de nuevo.",
    icon: AlertTriangle,
    accentClassName: "text-red-400",
  };
};

export function MarketRequestState({
  title = "Conectando...",
  loadingLabel = "Cargando datos del mercado...",
  slowLabel = "La conexion va lenta, seguimos intentando...",
  error,
  onRetry,
  retryLabel = "Reintentar",
  accentClassName = "text-emerald-500",
  className = "w-full min-h-screen bg-slate-950",
}: MarketRequestStateProps) {
  const isOnline = useOnlineStatus();
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (error) {
      setIsSlow(false);
      return;
    }

    setIsSlow(false);
    const timeoutId = window.setTimeout(() => setIsSlow(true), 8000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  if (!error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center px-6 text-white`}>
        <Loader2 className={`mb-4 animate-spin ${accentClassName}`} size={48} />
        <h2 className="text-xl font-black uppercase tracking-widest text-center">{title}</h2>
        <p className="mt-3 max-w-md text-center text-sm font-bold text-slate-400">
          {isSlow ? slowLabel : loadingLabel}
        </p>
        {isSlow && (
          <div className="mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-emerald-500" />
          </div>
        )}
      </div>
    );
  }

  const copy = getErrorCopy(error, isOnline);
  const Icon = copy.icon;

  return (
    <div className={`${className} flex flex-col items-center justify-center px-6 text-white`}>
      <Icon className={`mb-4 ${copy.accentClassName}`} size={48} />
      <h2 className="text-xl font-black uppercase tracking-widest text-center">{copy.title}</h2>
      <p className="mt-3 max-w-lg text-center text-sm font-bold text-slate-400">
        {copy.description}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={() => void onRetry()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition-colors hover:border-slate-500 hover:bg-slate-800"
        >
          <RefreshCw size={16} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
