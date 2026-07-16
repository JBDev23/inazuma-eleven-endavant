"use client";

import { useEffect, useState, useMemo } from "react";
import { RefreshCw, UserMinus, ChevronRight, ChevronLeft, Edit2, Users } from "lucide-react";
import { api } from "@/services/api";
import type { Player, Team, UserClub } from "@inazuma/shared";

import AdminPlayerFilters, { PlayerFilterState, INITIAL_FILTERS } from "@/components/admin/AdminPlayerFilters";
import AdminPlayerModal from "@/components/admin/AdminPlayerModal";
import AdminBulkPlayerModal, { BulkPlayerUpdatePayload } from "@/components/admin/AdminBulkPlayerModal";
import PlayerModal from "@/components/player/PlayerModal";

const ITEMS_PER_PAGE = 50;

export default function PlayersTab() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [bulkEditing, setBulkEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [clubs, setClubs] = useState<UserClub[]>([]);
  const [filters, setFilters] = useState<PlayerFilterState>(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  const handleSavePlayer = async (playerId: number, updatedData: Partial<Player>) => {
    try {
      await api.players.updatePlayer(playerId, updatedData);
      setEditingPlayer(null);
      loadData();
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
    }
  };

  const handleBulkSave = async (playerIds: number[], updatedData: BulkPlayerUpdatePayload) => {
    try {
      await api.players.bulkUpdatePlayers(playerIds, updatedData);
      setBulkEditing(false);
      setSelectedIds(new Set());
      loadData();
    } catch (error) {
      console.error("Error al guardar cambios masivos:", error);
    }
  };

  const handleReleasePlayer = async (playerId: number, playerName: string) => {
    const confirmRelease = window.confirm(
      `⚠️ ¿Estás seguro de que quieres quitarle el jugador "${playerName}" a su club actual y mandarlo al mercado libre?`
    );
    
    if (!confirmRelease) return;

    try {
      await api.players.releasePlayer(playerId);
      loadData();
    } catch (error) {
      console.error("Error al liberar al jugador:", error);
    }
  };

  const handleBulkRelease = async () => {
    const selectedPlayers = players.filter((p) => selectedIds.has(p.id));
    const withOwner = selectedPlayers.filter((p) => p.ownerId);

    if (withOwner.length === 0) {
      window.alert("Ninguno de los jugadores seleccionados pertenece a un club.");
      return;
    }

    const confirmRelease = window.confirm(
      `⚠️ ¿Liberar ${withOwner.length} jugador${withOwner.length !== 1 ? "es" : ""} y enviarlos al mercado libre?`
    );

    if (!confirmRelease) return;

    try {
      const result = await api.players.bulkReleasePlayers(withOwner.map((p) => p.id));
      if (result.skipped > 0) {
        window.alert(`${result.released} liberados. ${result.skipped} omitidos (sin club).`);
      }
      setSelectedIds(new Set());
      loadData();
    } catch (error) {
      console.error("Error al liberar jugadores:", error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [playersData, clubsData, teamsData] = await Promise.all([
        api.players.getAllPlayers(),
        api.market.getUserClubs(),
        api.teams.list()
      ]);
      
      setPlayers(playersData);
      setClubs(clubsData);
      setTeams(teamsData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableSeasons = useMemo(() => {
    return [...new Set(players.map((p) => p.season ?? 1))].sort((a, b) => a - b);
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (filters.search) {
        const lowerSearch = filters.search.toLowerCase();
        if (!p.name.toLowerCase().includes(lowerSearch) && !p.nickname?.toLowerCase().includes(lowerSearch)) return false;
      }
      
      if (filters.position !== "all" && p.position !== filters.position) return false;
      if (filters.element !== "all" && p.element !== filters.element) return false;
      if (filters.season !== "all" && (p.season ?? 1) !== parseInt(filters.season, 10)) return false;
      
      if (filters.teamName !== "all") {
        const selectedTeam = teams.find(t => t.name === filters.teamName);
        if (selectedTeam && p.teamId !== selectedTeam.id) return false;
      }

      if (filters.ownerStatus !== "all") {
        if (filters.ownerStatus === "free" && !p.isFreeAgent) return false;
        if (filters.ownerStatus === "locked" && (p.isFreeAgent || p.ownerId)) return false;
        if (filters.ownerStatus !== "free" && filters.ownerStatus !== "locked") {
          if (p.ownerId !== filters.ownerStatus) return false;
        }
      }
      
      return true;
    });
  }, [players, filters, teams]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE));
  
  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlayers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  const selectedPlayers = useMemo(
    () => players.filter((p) => selectedIds.has(p.id)),
    [players, selectedIds],
  );

  const pageIds = paginatedPlayers.map((p) => p.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  const togglePlayer = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePageSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredPlayers.map((p) => p.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedWithOwner = selectedPlayers.filter((p) => p.ownerId).length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      <div className="flex justify-end">
        <button 
          onClick={loadData}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold transition-colors border border-slate-700"
        >
          <RefreshCw size={16} /> Recargar Jugadores
        </button>
      </div>

      <AdminPlayerFilters 
        filters={filters}
        setFilters={setFilters}
        clubs={clubs}
        totalResults={filteredPlayers.length}
        teams={teams}
        seasons={availableSeasons}
      />

      {!isLoading && filteredPlayers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={togglePageSelection}
              className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg transition-colors"
            >
              {allPageSelected ? "Deseleccionar página" : "Seleccionar página"}
            </button>
            <button
              onClick={selectAllFiltered}
              className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg transition-colors"
            >
              Seleccionar todos ({filteredPlayers.length})
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={clearSelection}
                className="text-xs font-bold text-slate-500 hover:text-red-400 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg transition-colors"
              >
                Limpiar selección
              </button>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <span className="text-xs font-black text-blue-400 uppercase tracking-widest px-2">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setBulkEditing(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-[0_0_10px_rgba(37,99,235,0.3)]"
              >
                <Users size={16} /> Editar múltiple
              </button>
              <button
                onClick={handleBulkRelease}
                disabled={selectedWithOwner === 0}
                className="flex items-center gap-2 bg-slate-700 hover:bg-red-600 disabled:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                title={selectedWithOwner === 0 ? "Ninguno tiene club asignado" : `Liberar ${selectedWithOwner} con club`}
              >
                <UserMinus size={16} /> Liberar ({selectedWithOwner})
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-900 border border-t-0 border-slate-800 rounded-b-2xl overflow-hidden overflow-x-auto shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-red-500 font-black uppercase tracking-widest animate-pulse">
            Accediendo a la base de datos...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected;
                    }}
                    onChange={togglePageSelection}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                    title="Seleccionar página actual"
                  />
                </th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Jugador</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Nivel</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Pos / Elem</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Precio</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Equipo</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Temp.</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Estado</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paginatedPlayers.map((player) => {
                const isSelected = selectedIds.has(player.id);
                return (
                <tr
                  key={player.id}
                  className={`hover:bg-slate-800/50 transition-colors group ${isSelected ? "bg-blue-950/20" : ""}`}
                >          
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePlayer(player.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </td>
                  <td 
                    className="p-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => setViewingPlayer(player)}
                  >
                    <img 
                      src={player.spriteUrl || "/sprites/default.webp"} 
                      alt={player.name} 
                      className="w-10 h-10 object-contain drop-shadow-md transition-transform group-hover:scale-110"
                    />
                    <div>
                      <p className="font-black text-white group-hover:text-blue-400 transition-colors">
                        {player.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono uppercase">
                        {player.nickname}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-md text-xs font-black tabular-nums">
                      Nv. {player.level ?? 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-1 rounded border border-slate-700 text-slate-300 bg-slate-950">
                        {player.position}
                      </span>
                      {player.element && (
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded border border-slate-700 text-slate-400 bg-slate-950">
                          {player.element}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-yellow-500 font-black tabular-nums">{player.price} 🪙</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                      {player.teamId ? teams.find(t => t.id === player.teamId)?.name : "Sin equipo"}
                    </span>
                  </td>
                  <td className="p-4 text-center text-sm font-mono text-slate-300">
                    {player.season ?? 1}
                  </td>
                  <td className="p-4 text-center">
                    {player.ownerId ? (
                      <span className="text-xs font-bold text-blue-400 bg-blue-950/30 px-2 py-1 rounded-md border border-blue-900">
                        Club: {player.ownerId}
                      </span>
                    ) : player.isFreeAgent ? (
                      <span className="text-xs font-bold text-yellow-400 bg-yellow-950/30 px-2 py-1 rounded-md border border-yellow-900">
                        Agente Libre
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                        Bloqueado
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReleasePlayer(player.id, player.name);
                        }}
                        disabled={!player.ownerId}
                        className="p-2 bg-slate-700 hover:bg-red-600 disabled:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        title={player.ownerId ? "Liberar Jugador (Resetear dueño)" : "El jugador no pertenece a ningún club"}
                      >
                        <UserMinus size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPlayer(player);
                        }}
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                        title="Editar Jugador"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        )}
        
        {!isLoading && filteredPlayers.length === 0 && (
          <div className="p-12 text-center text-slate-500 font-bold">
            No se han encontrado jugadores con ese nombre.
          </div>
        )}

        {!isLoading && paginatedPlayers.length > 0 && (
          <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Mostrando del {(currentPage - 1) * ITEMS_PER_PAGE + 1} al {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length)}
              {selectedIds.size > 0 && (
                <span className="text-blue-400 ml-2">· {selectedIds.size} seleccionados</span>
              )}
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-black text-white">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {editingPlayer && (
        <AdminPlayerModal 
          player={editingPlayer} 
          onClose={() => setEditingPlayer(null)} 
          onSave={handleSavePlayer} 
          clubs={clubs}
        />
      )}

      {bulkEditing && selectedPlayers.length > 0 && (
        <AdminBulkPlayerModal
          players={selectedPlayers}
          clubs={clubs}
          onClose={() => setBulkEditing(false)}
          onSave={handleBulkSave}
        />
      )}

      {viewingPlayer && (
        <PlayerModal 
          player={viewingPlayer} 
          onClose={() => setViewingPlayer(null)} 
          status="admin"
          onAction={() => {}}
          isLoading={false}
          resources={{ pp: 0, pe: 0, yens: 0, pc: 0 }}
          clubId="0"
        />
      )}
    </div>
  );
}
