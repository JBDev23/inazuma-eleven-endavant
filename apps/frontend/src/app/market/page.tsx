// apps/frontend/src/app/market/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { api, getApiErrorMessage } from "@/services/api";
import { ClubShield } from '@/components/club/ClubShield';
import { MarketRequestState } from "@/components/market/MarketRequestState";

export default function MarketLogin() {
  const router = useRouter();
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadClubs = async () => {
    setIsLoadingClubs(true);
    setLoadError(null);
    try {
      const data = await api.market.getUserClubs();
      setClubs(data);
    } catch (err) {
      console.error(err);
      setLoadError(err);
    } finally {
      setIsLoadingClubs(false);
    }
  };

  useEffect(() => {
    void loadClubs();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await api.market.login(selectedClub.id, pin);

      if (res && "error" in res && res.error) {
        setError(res.error);
        setPin("");
      } else {
        router.push(`/market/${selectedClub.id}`);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo iniciar sesion."));
      setPin("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingClubs) {
    return <MarketRequestState title="Conectando..." loadingLabel="Estamos cargando los clubes disponibles para entrar al market." accentClassName="text-yellow-500" />;
  }

  if (loadError) {
    return (
      <MarketRequestState
        title="Conectando..."
        error={loadError}
        onRetry={loadClubs}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border-4 border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decoración de fondo */}
        <div className="absolute -top-20 -right-20 text-slate-800/50">
          <Shield size={200} />
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Acceso al Club</h1>
          <p className="text-slate-400 text-sm mb-8">Identifícate para entrar al mercado de fichajes.</p>

          {!selectedClub ? (
            <div className="space-y-3">
              {clubs.map(club => (
                <button
                  key={club.id}
                  onClick={() => setSelectedClub(club)}
                  className="w-full bg-slate-950 border-2 border-slate-700 hover:border-yellow-500 text-white font-bold py-4 px-6 rounded-xl text-left transition-all group flex justify-between items-center gap-3"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <ClubShield
                      shieldUrl={club.shieldUrl}
                      alt={club.name}
                      className="w-8 h-8 object-contain shrink-0"
                    />
                    <span className="truncate">{club.name.toUpperCase()}</span>
                  </span>
                  <ArrowRight className="opacity-0 group-hover:opacity-100 text-yellow-500 transition-opacity" />
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="bg-slate-950 p-4 rounded-xl border-2 border-yellow-500/50 flex items-center justify-between gap-3">
                <span className="flex items-center gap-3 min-w-0">
                  <ClubShield
                    shieldUrl={selectedClub.shieldUrl}
                    alt={selectedClub.name}
                    className="w-8 h-8 object-contain shrink-0"
                  />
                  <span className="font-black text-white truncate">{selectedClub.name.toUpperCase()}</span>
                </span>
                <button type="button" onClick={() => {setSelectedClub(null); setError("");}} className="text-xs text-yellow-500 font-bold hover:underline">
                  Cambiar
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                  <Lock size={14} /> Introduce tu PIN
                </label>
                <input
                  type="password"
                  maxLength={4} // Si usas pines de 4 números
                  autoFocus
                  className="w-full bg-slate-950 border-2 border-slate-700 text-white text-center text-3xl font-black tracking-[1em] rounded-xl py-4 focus:border-yellow-500 focus:ring-0 outline-none transition-colors"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </div>

              {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

              <button type="submit" disabled={!pin || isSubmitting} className="w-full bg-yellow-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-lg py-4 rounded-xl transition-all cursor-pointer">
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    ENTRANDO...
                  </span>
                ) : (
                  "ENTRAR A LA SEDE"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}