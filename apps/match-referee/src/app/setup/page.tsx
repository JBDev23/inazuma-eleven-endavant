// src/app/setup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMatchStore } from "@/store/useMatchStore";
import { Loader2, AlertCircle, X } from "lucide-react";
import { ClubShield } from "@/components/ClubShield";
import Image from "next/image";
import { TeamCard } from "@/components/TeamCard";
import { UserClub } from "@inazuma/shared";
import { MatchFormat, MatchFormatSelector } from "@/components/MatchFormatSelector";
import { TimeOfDaySelector, type TimeOfDay } from "@/components/TimeOfDaySelector";
import { WeatherSelector, type WeatherCondition } from "@/components/WeatherSelector";
import { TurnCountSelector } from "@/components/TurnCountSelector";
import { PenaltyShootoutSelector } from "@/components/PenaltyShootoutSelector";
import { api } from "@/services/api";
import { fetchAndCacheGameSettings } from "@/lib/offline-storage";

export default function SetupPage() {
  const router = useRouter();
  const { setTeams, matchFormat: storedFormat, timeOfDay: storedTimeOfDay, weather: storedWeather, totalTurns: storedTotalTurns, penaltyShootoutEnabled: storedPenaltyShootout } = useMatchStore();

  // Estados limpios (sin homeId/awayId redundantes)
  const [clubs, setClubs] = useState<UserClub[]>([]);
  const [selectingSide, setSelectingSide] = useState<string | null>(null);
  const [homeClub, setHomeClub] = useState<UserClub | null>(null);
  const [awayClub, setAwayClub] = useState<UserClub | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(storedFormat);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(storedTimeOfDay);
  const [weather, setWeather] = useState<WeatherCondition>(storedWeather);
  const [totalTurns, setTotalTurns] = useState(storedTotalTurns);
  const [penaltyShootoutEnabled, setPenaltyShootoutEnabled] = useState(storedPenaltyShootout);

  // 1. Cargar la lista de clubes al entrar en la página
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const data = await api.clubs.getAll();
        setClubs(data);
      } catch (err) {
        setError("No se pudo conectar con la base de datos central.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubs();
  }, []);

  // 2. Función para descargar las plantillas y pasar a la fase de Tácticas
  const handleNextStep = async () => {
    if (!homeClub || !awayClub || homeClub.id === awayClub.id) return;
    
    setIsStarting(true);

    try {
      // Descargamos plantillas, configuración de sesión y datos necesarios para jugar offline
      const [homeData, awayData] = await Promise.all([
        api.clubs.getById(homeClub.id),
        api.clubs.getById(awayClub.id),
        fetchAndCacheGameSettings(() => api.gameSettings.get()),
      ]);

      // Guardamos los objetos completos en el store, no solo los IDs
      setTeams(homeData, awayData);

      // Guardamos el formato del partido en el store para la siguiente pantalla
      useMatchStore.setState({ matchFormat, timeOfDay, weather, totalTurns, penaltyShootoutEnabled });

      // Navegamos a la pantalla de tácticas/prematch (en lugar de iniciar el partido)
      router.push("/prematch");
    } catch (err) {
      setError("Fallo al descargar los datos de los clubes. Revisa la conexión.");
      setIsStarting(false);
    }
  };

  const selectClub = (club: UserClub) => {
    if (selectingSide === 'home') setHomeClub(club);
    if (selectingSide === 'away') setAwayClub(club);
    setSelectingSide(null);
  };

  const isReady = homeClub && awayClub && homeClub.id !== awayClub.id;

  return (
    <div className="min-h-screen text-white flex flex-col items-center py-12 px-6">
      <div className="fixed inset-0 -z-10">
        <Image
          src="/setup_back.webp"
          fill
          alt="setup_back"
          priority
          className="object-cover"
        />
      </div>

      {/* Cabecera */}
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-black text-amber-300 uppercase tracking-widest drop-shadow-lg mb-2">
          Configuración
        </h1>
      </div>

      {/* Manejo de Errores */}
      {error && (
        <div className="bg-red-950/50 border border-red-500 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3 mb-8 w-full max-w-2xl">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <MatchFormatSelector 
        format={matchFormat} 
        onChange={setMatchFormat} 
      />

      <TimeOfDaySelector value={timeOfDay} onChange={setTimeOfDay} />
      <WeatherSelector value={weather} onChange={setWeather} />

      <TurnCountSelector value={totalTurns} onChange={setTotalTurns} />

      <PenaltyShootoutSelector value={penaltyShootoutEnabled} onChange={setPenaltyShootoutEnabled} />

      {/* Tarjetas de Selección */}
      <div className="flex flex-col md:flex-row w-full max-w-4xl gap-6 md:gap-12 mb-12 items-center">
        
        <TeamCard 
          side="home" 
          club={homeClub} 
          matchFormat={matchFormat}
          onClick={() => setSelectingSide('home')} 
        />

        <div className="flex items-center justify-center shrink-0 z-10 -my-2 md:my-0 md:-mx-10">
          <div className="bg-slate-950 p-4 rounded-full border-4 border-slate-800 shadow-2xl flex flex-col items-center justify-center w-24 h-24">
            <span className="text-3xl font-black italic text-amber-500 tracking-tighter -ml-1">VS</span>
          </div>
        </div>

        <TeamCard 
          side="away" 
          club={awayClub} 
          matchFormat={matchFormat}
          onClick={() => setSelectingSide('away')} 
        />

      </div>

      {/* Botón de Siguiente Paso */}
      <button
        onClick={handleNextStep}
        disabled={!isReady || isStarting}
        className={`relative w-full max-w-md py-5 rounded-2xl font-black text-2xl uppercase tracking-widest transition-all duration-300 overflow-hidden
          ${
            isReady && !isStarting
              ? "bg-linear-to-r from-amber-500 to-amber-600 text-amber-950 shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95"
              : "bg-slate-800 text-slate-600 cursor-not-allowed border-2 border-slate-700"
          }`}
      >
        {isStarting ? (
          <span className="flex items-center justify-center gap-3">
            <Loader2 className="animate-spin w-6 h-6" /> Procesando...
          </span>
        ) : (
          "Siguiente Paso"
        )}
      </button>

      {/* Modal de Selección */}
      {selectingSide && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-t-3xl md:rounded-3xl max-h-[80vh] flex flex-col shadow-2xl slide-in-from-bottom-10 md:slide-in-from-bottom-0">
            
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-3xl md:rounded-t-3xl">
              <h3 className="text-2xl font-black uppercase tracking-widest text-slate-200">
                Seleccionar {selectingSide === 'home' ? 'Local' : 'Visitante'}
              </h3>
              <button onClick={() => setSelectingSide(null)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 custom-scrollbar">
              {isLoading ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  Buscando clubes...
                </div>
              ) : (
                clubs.map(club => {
                  const isAlreadySelected = (selectingSide === 'home' && awayClub?.id === club.id) || 
                                            (selectingSide === 'away' && homeClub?.id === club.id);
                  return (
                    <button
                      key={club.id}
                      disabled={isAlreadySelected}
                      onClick={() => selectClub(club)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                        ${isAlreadySelected 
                          ? 'opacity-50 border-slate-800 bg-slate-900 cursor-not-allowed' 
                          : 'border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-amber-500 active:scale-95'
                        }`}
                    >
                      <ClubShield
                        shieldUrl={club.shieldUrl}
                        alt={club.name}
                        className={`w-8 h-8 object-contain shrink-0 ${isAlreadySelected ? 'opacity-50' : ''}`}
                      />
                      <div>
                        <div className="font-bold text-lg uppercase tracking-wider">{club.name}</div>
                        {isAlreadySelected && <div className="text-xs text-red-400 font-bold mt-1">YA SELECCIONADO</div>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}