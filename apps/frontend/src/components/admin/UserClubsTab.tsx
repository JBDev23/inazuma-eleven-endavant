"use client";

import { useEffect, useState, useMemo } from "react";
import { AlertTriangle, Search, RefreshCw, Edit2, Coins, LayoutGrid } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import type { UserClub, Team, AddTransactionDto } from "@inazuma/shared";
import { pickClubResources } from "@inazuma/shared";
import AdminClubModal from "./AdminClubModal";
import AdminResourceModal from "./AdminResourceModal"; // 🎯 Importamos el nuevo modal
import AdminFormationAssignmentModal from "./AdminFormationAssignmentModal";
import { ClubResourcesDisplay } from "@/components/economy/ClubResourcesDisplay";
import { ClubShield } from "@/components/club/ClubShield";
import { MarketRequestState } from "@/components/market/MarketRequestState";

export default function UserClubsTab() {
  const [clubs, setClubs] = useState<UserClub[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Estados para los modales
  const [editingClub, setEditingClub] = useState<UserClub | null>(null);
  const [resourceClub, setResourceClub] = useState<UserClub | null>(null);
  const [formationsClub, setFormationsClub] = useState<UserClub | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const [clubsData, teamsData] = await Promise.all([
        api.market.getUserClubs(),
        api.teams.list() 
      ]); 
      setClubs(clubsData);
      setTeams(teamsData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClubs = useMemo(() => {
    if (!searchTerm) return clubs;
    const lowerSearch = searchTerm.toLowerCase();
    return clubs.filter((c) => c.name.toLowerCase().includes(lowerSearch));
  }, [clubs, searchTerm]);

  // Guardar configuración general del club
  const handleSaveClub = async (clubId: string, updatedData: Partial<UserClub>) => {
    try {
      await api.market.updateUserClub(clubId, updatedData);
      setEditingClub(null);
      loadData();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Error al guardar los cambios."));
    }
  };

  // 🎯 Nuevo handler para inyectar recursos
  const handleSaveResources = async (clubId: string, transactionData: AddTransactionDto) => {
    try {
      await api.market.addTransaction(clubId, transactionData); 
      setResourceClub(null);
      loadData(); // Recargamos para ver los nuevos saldos reflejados en la tabla
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Error al procesar la transacción."));
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar club por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-yellow-500 transition-colors"
          />
        </div>
        <button 
          onClick={loadData}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold transition-colors border border-slate-700"
        >
          <RefreshCw size={16} /> Recargar
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
        {isLoading ? (
          <MarketRequestState
            title="Accediendo a la base de datos..."
            loadingLabel="Cargando clubs y equipos del admin."
            accentClassName="text-yellow-500"
            className="w-full min-h-[260px] bg-transparent"
          />
        ) : loadError ? (
          <MarketRequestState
            title="No se pudo cargar la base de datos"
            error={loadError}
            onRetry={loadData}
            className="w-full min-h-[260px] bg-transparent"
          />
        ) : (
          <table className="w-full min-w-[480px] md:min-w-[640px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800">
                <th className="p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Nombre del Club</th>
                <th className="hidden md:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Equipo Base</th>
                <th className="hidden sm:table-cell p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Recursos</th>
                <th className="p-3 sm:p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredClubs.map((club) => (
                <tr key={club.id} className="hover:bg-slate-800/50 transition-colors group">
                  
                  {/* NOMBRE DEL CLUB */}
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-[160px]">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center shrink-0 overflow-hidden p-1">
                        <ClubShield shieldUrl={club.shieldUrl} alt={club.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-white text-base sm:text-lg truncate">{club.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">ID: {club.id}</p>
                        <div className="mt-1.5 space-y-1.5 md:hidden">
                          {club.baseTeamSlug ? (
                            <span className="inline-block text-[10px] font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                              {teams.find(t => t.slug === club.baseTeamSlug)?.name || club.baseTeamSlug}
                            </span>
                          ) : null}
                          <ClubResourcesDisplay
                            resources={pickClubResources(club)}
                            variant="inline"
                            className="sm:hidden flex-wrap"
                          />
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="hidden md:table-cell p-3 sm:p-4 text-center">
                    {club.baseTeamSlug ? (
                      <span className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
                        {teams.find(t => t.slug === club.baseTeamSlug)?.name || club.baseTeamSlug}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-600 italic">No asignado</span>
                    )}
                  </td>

                  <td className="hidden sm:table-cell p-3 sm:p-4">
                    <ClubResourcesDisplay
                      resources={pickClubResources(club)}
                      variant="inline"
                      className="justify-center flex-wrap"
                    />
                  </td>
                  
                  <td className="p-3 sm:p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setFormationsClub(club)}
                        className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors shadow-[0_0_10px_rgba(234,88,12,0.3)]"
                        title="Gestionar formaciones"
                      >
                        <LayoutGrid size={16} />
                      </button>

                      {/* Botón de Economía */}
                      <button 
                        onClick={() => setResourceClub(club)}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        title="Modificar Tesorería"
                      >
                        <Coins size={16} />
                      </button>
                      
                      {/* Botón de Edición General */}
                      <button 
                        onClick={() => setEditingClub(club)}
                        className="p-2 bg-yellow-600 hover:bg-yellow-500 text-slate-950 rounded-lg transition-colors shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                        title="Editar Club"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>

      {actionError && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="font-black uppercase tracking-wide text-red-300">Accion no completada</p>
            <p className="mt-1 text-red-100/90">{actionError}</p>
          </div>
        </div>
      )}

      {editingClub && (
        <AdminClubModal 
          club={editingClub}
          teams={teams} 
          onClose={() => setEditingClub(null)} 
          onSave={handleSaveClub} 
        />
      )}

      {/* 🎯 Instanciamos nuestro nuevo Modal de Recursos */}
      {resourceClub && (
        <AdminResourceModal
          club={resourceClub}
          onClose={() => setResourceClub(null)}
          onSave={handleSaveResources}
        />
      )}

      {formationsClub && (
        <AdminFormationAssignmentModal
          mode="club"
          club={formationsClub}
          onClose={() => setFormationsClub(null)}
        />
      )}

    </div>
  );
}