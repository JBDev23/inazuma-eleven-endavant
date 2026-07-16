import PlayerCanvas from "@/components/player/PlayerCanvas";
import { api } from "@/services/api";
import { pickClubResources } from "@inazuma/shared";

export default async function MapExplorerPage({ 
  params 
}: { 
  params: Promise<{ clubId: string; teamSlug: string }> 
}) {
  const { clubId, teamSlug } = await params;
  const userClub = await api.market.getUserClub(clubId);
  return (
    <PlayerCanvas clubId={clubId} baseTeamSlug={teamSlug} initialResources={pickClubResources(userClub)} />
  );
}