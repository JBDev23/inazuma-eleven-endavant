// apps/frontend/src/app/editor/[teamId]/page.tsx
import FlowCanvas from "@/components/editor/FlowCanvas";
import PlayerSidebar from "@/components/PlayerSidebar";
import { EditorProvider } from "@/context/EditorContext";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/services/api";

export default async function TeamEditorPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  
  const [players, teamData, allTeams] = await Promise.all([
    api.players.getByTeam(teamId),
    api.teams.get(teamId),
    api.teams.list(),
  ]);

  return (
    <EditorProvider>
      <div className="flex h-screen w-screen bg-slate-100 overflow-hidden">
        <PlayerSidebar players={players} />

        <main className="flex-1 relative flex items-center justify-center bg-[url('/grid-pattern.svg')] bg-slate-50">
          <div className="absolute top-4 left-4 z-50">
            <Link 
              href="/editor"
              className="flex items-center gap-2 bg-slate-900 border-2 border-slate-700 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800 hover:border-yellow-500 transition-all shadow-lg"
            >
              <ArrowLeft size={18} />
              VOLVER AL MENÚ
            </Link>
          </div>

          <FlowCanvas team={teamData} allTeams={allTeams} />
        </main>
      </div>
    </EditorProvider>
  );
}