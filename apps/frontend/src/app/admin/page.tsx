"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Users,
  Trophy,
  Zap,
  UserCircle2,
  TrendingUp,
  Building2,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

import PlayersTab from "@/components/admin/PlayersTab";
import UserClubsTab from "@/components/admin/UserClubsTab";
import MovesTab from "@/components/admin/MovesTab";
import CoachesTab from "@/components/admin/CoachesTab";
import FormationsTab from "@/components/admin/FormationsTab";
import GameSettingsTab from "@/components/admin/GameSettingsTab";
import SportsCitiesTab from "@/components/admin/SportsCitiesTab";

type AdminTabId = "players" | "clubs" | "moves" | "coaches" | "formations" | "xp" | "sports-city";

type AdminTab = {
  id: AdminTabId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  activeClass: string;
};

const ADMIN_TABS: AdminTab[] = [
  {
    id: "players",
    label: "Jugadores",
    shortLabel: "Jugadores",
    icon: Users,
    activeClass: "bg-slate-900 text-blue-500 border-t-2 border-blue-500",
  },
  {
    id: "clubs",
    label: "Clubes de Usuarios",
    shortLabel: "Clubes",
    icon: Trophy,
    activeClass: "bg-slate-900 text-yellow-500 border-t-2 border-yellow-500",
  },
  {
    id: "moves",
    label: "Supertécnicas",
    shortLabel: "Técnicas",
    icon: Zap,
    activeClass: "bg-slate-900 text-purple-500 border-t-2 border-purple-500",
  },
  {
    id: "coaches",
    label: "Entrenadores",
    shortLabel: "Entren.",
    icon: UserCircle2,
    activeClass: "bg-slate-900 text-cyan-400 border-t-2 border-cyan-400",
  },
  {
    id: "formations",
    label: "Formaciones",
    shortLabel: "Formac.",
    icon: LayoutGrid,
    activeClass: "bg-slate-900 text-orange-400 border-t-2 border-orange-400",
  },
  {
    id: "xp",
    label: "XP Partidos",
    shortLabel: "XP",
    icon: TrendingUp,
    activeClass: "bg-slate-900 text-violet-400 border-t-2 border-violet-400",
  },
  {
    id: "sports-city",
    label: "Ciudades",
    shortLabel: "Ciudades",
    icon: Building2,
    activeClass: "bg-slate-900 text-emerald-400 border-t-2 border-emerald-400",
  },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTabId>("players");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2 sm:gap-3">
              <AlertTriangle className="text-red-500 shrink-0" size={28} />
              God Mode
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-widest mt-1">
              Panel de Administración Absoluta
            </p>
          </div>
        </div>

        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto overscroll-x-contain mb-6">
          <div
            className="flex gap-1 min-w-max sm:min-w-0 sm:flex-wrap border-b border-slate-800"
            role="tablist"
            aria-label="Secciones de administración"
          >
            {ADMIN_TABS.map(({ id, label, shortLabel, icon: Icon, activeClass }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 font-black uppercase tracking-widest text-xs sm:text-sm rounded-t-xl transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? activeClass
                      : "bg-slate-950 text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                  }`}
                >
                  <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "players" && <PlayersTab />}
        {activeTab === "clubs" && <UserClubsTab />}
        {activeTab === "moves" && <MovesTab />}
        {activeTab === "coaches" && <CoachesTab />}
        {activeTab === "formations" && <FormationsTab />}
        {activeTab === "xp" && <GameSettingsTab />}
        {activeTab === "sports-city" && <SportsCitiesTab />}
      </div>
    </div>
  );
}
