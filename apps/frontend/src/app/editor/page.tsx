// apps/frontend/src/app/editor/page.tsx
import Link from "next/link";
import { Shield } from "lucide-react";
import { api } from "@/services/api";
import { Team } from "@inazuma/shared";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function EditorSelectPage() {
  const teams = await api.teams.list();

  return (
    <div className="min-h-screen bg-slate-950 p-10 flex flex-col items-center justify-center">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white uppercase tracking-widest mb-4">
          Base de Datos de Equipos
        </h1>
        <p className="text-slate-400">Selecciona una facción para editar su mapa de progreso</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {teams.map((team: Team) => (
          <Link 
            key={team.id} 
            href={`/editor/${team.id}`}
            className={`group relative ${team.type === 'CLUB' ? 'bg-slate-900 border-2 border-slate-700' : 'bg-slate-800 border-2 border-yellow-400'} rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-slate-800 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]`}
          >
            <Image src={`/teams/${team.slug.toLowerCase()}_shield.webp`} alt={team.name} width={100} height={100} className="object-contain" />
            <h2 className="text-xl text-center font-bold text-white uppercase tracking-wider">
              {team.name}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
} 