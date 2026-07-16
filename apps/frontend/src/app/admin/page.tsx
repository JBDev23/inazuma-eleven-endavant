"use client";

import { useState } from "react";
import { AlertTriangle, Users, Trophy, Zap, UserCircle2, TrendingUp, Building2 } from "lucide-react"; 

import PlayersTab from "@/components/admin/PlayersTab";
import UserClubsTab from "@/components/admin/UserClubsTab";
import MovesTab from "@/components/admin/MovesTab";
import CoachesTab from "@/components/admin/CoachesTab";
import GameSettingsTab from "@/components/admin/GameSettingsTab";
import SportsCitiesTab from "@/components/admin/SportsCitiesTab";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"players" | "clubs" | "moves" | "coaches" | "xp" | "sports-city">("players");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={32} />
              God Mode
            </h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
              Panel de Administración Absoluta
            </p>
          </div>
        </div>

        {/* SISTEMA DE PESTAÑAS */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("players")}
            className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-sm rounded-t-xl transition-all ${
              activeTab === "players" ? "bg-slate-900 text-blue-500 border-t-2 border-blue-500" : "bg-slate-950 text-slate-500 hover:bg-slate-900"
            }`}
          >
            <Users size={18} /> Jugadores
          </button>
          
          <button
            onClick={() => setActiveTab("clubs")}
            className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-sm rounded-t-xl transition-all ${
              activeTab === "clubs" ? "bg-slate-900 text-yellow-500 border-t-2 border-yellow-500" : "bg-slate-950 text-slate-500 hover:bg-slate-900"
            }`}
          >
            <Trophy size={18} /> Clubes de Usuarios
          </button>

          {/* 🎯 NUEVA PESTAÑA: SUPERTÉCNICAS */}
          <button
            onClick={() => setActiveTab("moves")}
            className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-sm rounded-t-xl transition-all ${
              activeTab === "moves" ? "bg-slate-900 text-purple-500 border-t-2 border-purple-500" : "bg-slate-950 text-slate-500 hover:bg-slate-900"
            }`}
          >
            <Zap size={18} /> Supertécnicas
          </button>

          {/* 🎓 NUEVA PESTAÑA: ENTRENADORES */}
          <button
            onClick={() => setActiveTab("coaches")}
            className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-sm rounded-t-xl transition-all ${
              activeTab === "coaches" ? "bg-slate-900 text-cyan-400 border-t-2 border-cyan-400" : "bg-slate-950 text-slate-500 hover:bg-slate-900"
            }`}
          >
            <UserCircle2 size={18} /> Entrenadores
          </button>

          <button
            onClick={() => setActiveTab("xp")}
            className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-sm rounded-t-xl transition-all ${
              activeTab === "xp" ? "bg-slate-900 text-violet-400 border-t-2 border-violet-400" : "bg-slate-950 text-slate-500 hover:bg-slate-900"
            }`}
          >
            <TrendingUp size={18} /> XP Partidos
          </button>

          <button
            onClick={() => setActiveTab("sports-city")}
            className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-sm rounded-t-xl transition-all ${
              activeTab === "sports-city" ? "bg-slate-900 text-emerald-400 border-t-2 border-emerald-400" : "bg-slate-950 text-slate-500 hover:bg-slate-900"
            }`}
          >
            <Building2 size={18} /> Ciudades
          </button>

        </div>

        {/* RENDERIZADO CONDICIONAL */}
        {activeTab === "players" && <PlayersTab />}
        {activeTab === "clubs" && <UserClubsTab />}
        {activeTab === "moves" && <MovesTab />}
        {activeTab === "coaches" && <CoachesTab />}
        {activeTab === "xp" && <GameSettingsTab />}
        {activeTab === "sports-city" && <SportsCitiesTab />}

      </div>
    </div>
  );
}