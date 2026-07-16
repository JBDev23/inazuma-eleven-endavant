import {
  ActivateFormationResult,
  BuyFormationResult,
  BuyItemResult,
  BuyConsumableResult,
  ClubConsumableWithDetails,
  Consumable,
  Coach,
  ClubFacilityRecord,
  ClubSportsCity,
  StartFacilityUpgradeResult,
  SetPitchElementResult,
  ApproveFacilityResult,
  FacilityId,
  CreateFormationDto,
  EquipItemDto,
  Formation,
  FormationWithClubStatus,
  Item,
  ClubItemWithDetails,
  Move,
  Player,
  UpdateFormationDto,
  AddTransactionDto,
  UpdateRosterDto,
  UserClub,
  BraceletData,
  NfcSyncResult,
  PeRedemptionPreview,
  RedeemPeDto,
  RedeemPeResult,
  RedeemYeDto,
  RedeemYeResult,
  YeRedemptionPreview,
  GameSettings,
  SessionXpConfig,
} from "@inazuma/shared";

const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return 'http://localhost:4000';
};

export const api = {
  players: {
    async updatePlayer(playerId: number, updatedData: Partial<Player>) {
      const res = await fetch(`${getApiBase()}/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw new Error("Error al actualizar jugador");
      return res.json();
    },
    async getByTeam(teamId: string) {
      const res = await fetch(`${getApiBase()}/teams/players/${teamId}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Error al cargar jugadores del equipo");
      return res.json();
    },
    async getAllPlayers() {
      const res = await fetch(`${getApiBase()}/players`, {
        cache: "no-store",
      });
      return res.json();
    },
    async bulkUpdatePlayers(playerIds: number[], updatedData: Partial<Player>) {
      const res = await fetch(`${getApiBase()}/players/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds, ...updatedData }),
      });
      if (!res.ok) throw new Error("Error al actualizar jugadores");
      return res.json();
    },
    async bulkReleasePlayers(playerIds: number[]) {
      const res = await fetch(`${getApiBase()}/players/bulk-release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds }),
      });
      if (!res.ok) throw new Error("Error al liberar jugadores");
      return res.json();
    },
    async releasePlayer(playerId: number) {
      const res = await fetch(`${getApiBase()}/players/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) throw new Error("Error al liberar jugador");
      return res.json();
    },
  },

  teams: {
    async list() {
      const res = await fetch(`${getApiBase()}/teams`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Error al cargar equipos");
      return res.json();
    },

    async get(teamId: string) {
      const res = await fetch(`${getApiBase()}/teams/${teamId}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Error al cargar equipo");
      return res.json();
    },

    async saveMap(teamId: string, mapData: unknown) {
      const res = await fetch(`${getApiBase()}/teams/${teamId}/map`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mapData),
      });

      if (!res.ok) {
        const errorDetails = await res.json().catch(() => null);
        console.error("❌ NestJS rechazó el guardado. Motivo:", errorDetails);
        throw new Error(`Error al guardar: ${errorDetails?.message || res.statusText}`);
      }
      return res.json();
    },
  },

  market: {
    async login(clubId: string, pin: string) {
      const res = await fetch(`${getApiBase()}/market/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clubId, pin }),
      });

      if (!res.ok) throw new Error("Error al iniciar sesión");
      return res.json();
    },

    async getUserClubs() {
      const res = await fetch(`${getApiBase()}/market/user-clubs`, {
        cache: "no-store",
      });
      return res.json();
    },

    async getUserClub(clubId: string) {
      const res = await fetch(`${getApiBase()}/market/club/${clubId}`, {
        cache: "no-store",
      });
      return res.json();
    },
    async getTeamMapForUser(clubId: string, teamSlug: string, sourceTeamSlug?: string) {
      const query = sourceTeamSlug ? `?sourceTeamSlug=${sourceTeamSlug}` : "";
      const res = await fetch(`${getApiBase()}/market/${clubId}/map/${teamSlug}${query}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error al cargar el mapa");
      return res.json();
    },

    async performAction(clubId: string, action: "buy" | "toll" | "sell", nickname: string) {
      const res = await fetch(`${getApiBase()}/market/${clubId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, nickname }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al procesar la transacción");
      }
      return data;
    },
    async debugTogglePlayer(clubId: string, nickname: string, action: 'buy' | 'sell' | 'make-rival-toll') {
      const res = await fetch(`${getApiBase()}/market/debug/toggle-player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId, nickname, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error en acción de debug");
      }
      return data;
    },
    async getFreeAgents() {
      const res = await fetch(`${getApiBase()}/market/free-agents`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Error al cargar agentes libres");
      return res.json();
    },
    async getFreeCoaches() {
      const res = await fetch(`${getApiBase()}/market/free-coaches`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Error al cargar entrenadores libres");
      return res.json();
    },
    async buyCoach(clubId: string, coachId: number) {
      const res = await fetch(`${getApiBase()}/market/${clubId}/coaches/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al fichar entrenador");
      }
      return data;
    },
    async sellCoach(clubId: string, coachId: number) {
      const res = await fetch(`${getApiBase()}/market/${clubId}/coaches/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al vender entrenador");
      }
      return data;
    },
    async updateUserClub(clubId: string, updatedData: Partial<UserClub>) {
      const res = await fetch(`${getApiBase()}/market/user-clubs/${clubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error al actualizar club");
      return res.json();
    },

    async addTransaction(clubId: string, transactionData: AddTransactionDto) {
      const res = await fetch(`${getApiBase()}/market/user-clubs/${clubId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al procesar la transacción");
      }
      return data;
    },

    async updateRoster(clubId: string, roster: UpdateRosterDto) {
      const res = await fetch(`${getApiBase()}/market/${clubId}/roster`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roster),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar la alineación");
      return data;
    },

    async getFormationCatalog(): Promise<Formation[]> {
      const res = await fetch(`${getApiBase()}/market/formations`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error al cargar el catálogo de formaciones");
      return res.json();
    },

    async getClubFormations(clubId: string): Promise<FormationWithClubStatus[]> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/formations`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error al cargar las formaciones del club");
      return res.json();
    },

    async buyFormation(clubId: string, formationId: number): Promise<BuyFormationResult> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/formations/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al comprar la formación");
      }
      return data;
    },

    async activateFormation(
      clubId: string,
      formationId: number,
    ): Promise<ActivateFormationResult> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/formations/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al activar la formación");
      }
      return data;
    },

    async previewPeRedemption(
      clubId: string,
      allocations: RedeemPeDto["allocations"],
    ): Promise<PeRedemptionPreview> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/pe/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al generar la vista previa");
      }
      return data;
    },

    async redeemPe(
      clubId: string,
      allocations: RedeemPeDto["allocations"],
    ): Promise<RedeemPeResult> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/pe/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al canjear PE");
      }
      return data;
    },

    async previewYeRedemption(
      clubId: string,
      allocations: RedeemYeDto["allocations"],
    ): Promise<YeRedemptionPreview> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/ye/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al generar la vista previa");
      }
      return data;
    },

    async redeemYe(
      clubId: string,
      allocations: RedeemYeDto["allocations"],
    ): Promise<RedeemYeResult> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/ye/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al canjear YE");
      }
      return data;
    },

    async spendPc(
      clubId: string,
      playerId: number,
      statKey: import("@inazuma/shared").StatKey,
    ): Promise<import("@inazuma/shared").SpendPcResult> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/pc/spend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, statKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al gastar PC");
      }
      return data;
    },

    async getItemCatalog(): Promise<Item[]> {
      const res = await fetch(`${getApiBase()}/market/items`, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar el catálogo de objetos");
      return res.json();
    },

    async getClubItems(clubId: string): Promise<ClubItemWithDetails[]> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/items`, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar el inventario del club");
      return res.json();
    },

    async buyItem(clubId: string, itemId: number): Promise<BuyItemResult> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/items/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al comprar el objeto");
      return data;
    },

    async equipItem(clubId: string, dto: EquipItemDto) {
      const res = await fetch(`${getApiBase()}/market/${clubId}/players/equipment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al equipar objeto");
      return data;
    },

    async getConsumableCatalog(): Promise<Consumable[]> {
      const res = await fetch(`${getApiBase()}/market/consumables`, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar el catálogo de consumibles");
      return res.json();
    },

    async getClubConsumables(clubId: string): Promise<ClubConsumableWithDetails[]> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/consumables`, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar el inventario de consumibles");
      return res.json();
    },

    async buyConsumable(clubId: string, consumableId: number): Promise<BuyConsumableResult> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/consumables/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumableId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al comprar el consumible");
      return data;
    },

    async getSportsCity(clubId: string): Promise<ClubSportsCity> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/sports-city`, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar la ciudad deportiva");
      return res.json();
    },

    async getAllSportsCities(): Promise<Array<ClubSportsCity & { clubName: string }>> {
      const res = await fetch(`${getApiBase()}/market/sports-cities`, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar ciudades deportivas");
      return res.json();
    },

    async startFacilityUpgrade(clubId: string, facilityId: FacilityId): Promise<StartFacilityUpgradeResult> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/sports-city/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al iniciar la obra");
      return data;
    },

    async setPitchElement(
      clubId: string,
      pitchElement: string,
    ): Promise<SetPitchElementResult> {
      const res = await fetch(`${getApiBase()}/market/${clubId}/sports-city/pitch-element`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitchElement }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar el terreno elemental");
      return data;
    },

    async adminUpdateFacility(
      clubId: string,
      facilityId: FacilityId,
      options: { level?: number; approveConstruction?: boolean },
    ): Promise<ApproveFacilityResult> {
      const res = await fetch(`${getApiBase()}/market/sports-city/${clubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId, ...options }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al actualizar instalación");
      return data;
    },
  },

  nfc: {
    async syncBracelet(bracelet: BraceletData): Promise<NfcSyncResult> {
      const res = await fetch(`${getApiBase()}/nfc/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bracelet),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al sincronizar la pulsera");
      }
      return data;
    },
  },

  moves: {
    async create(move: Move) {
      const res = await fetch(`${getApiBase()}/moves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(move),
      });
    },
    async update(moveId: number, updatedData: Partial<Move>) {
      const res = await fetch(`${getApiBase()}/moves/${moveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
    },
    async getAll() { 
      const res = await fetch(`${getApiBase()}/moves`, {
        cache: "no-store",
      });
      return res.json();
    },
    async getOne(moveId: number) {
      const res = await fetch(`${getApiBase()}/moves/${moveId}`, {
        cache: "no-store",
      });
      return res.json();
    },
    async delete(moveId: number) {
      const res = await fetch(`${getApiBase()}/moves/${moveId}`, {
        method: "DELETE",
      });
      return res.json();
    },
  },

  coaches: {
    async create(coach: Partial<Coach>) {
      const res = await fetch(`${getApiBase()}/coaches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coach),
      });
      if (!res.ok) throw new Error("Error al crear el entrenador");
      return res.json();
    },
    async update(coachId: number, updatedData: Partial<Coach>) {
      const res = await fetch(`${getApiBase()}/coaches/${coachId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw new Error("Error al actualizar el entrenador");
      return res.json();
    },
    async getAll(): Promise<Coach[]> {
      const res = await fetch(`${getApiBase()}/coaches`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error al cargar entrenadores");
      return res.json();
    },
    async getOne(coachId: number): Promise<Coach> {
      const res = await fetch(`${getApiBase()}/coaches/${coachId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error al cargar el entrenador");
      return res.json();
    },
    async delete(coachId: number) {
      const res = await fetch(`${getApiBase()}/coaches/${coachId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Error al eliminar el entrenador");
      return data;
    },
    async release(coachId: number) {
      const res = await fetch(`${getApiBase()}/coaches/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Error al liberar el entrenador");
      return data;
    },
  },

  formations: {
    async create(formation: CreateFormationDto): Promise<Formation> {
      const res = await fetch(`${getApiBase()}/formations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formation),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear la formación");
      return data;
    },

    async update(formationId: number, updatedData: UpdateFormationDto): Promise<Formation> {
      const res = await fetch(`${getApiBase()}/formations/${formationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al actualizar la formación");
      return data;
    },

    async getAll(): Promise<Formation[]> {
      const res = await fetch(`${getApiBase()}/formations`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error al cargar formaciones");
      return res.json();
    },

    async getOne(formationId: number): Promise<Formation> {
      const res = await fetch(`${getApiBase()}/formations/${formationId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error al cargar la formación");
      return res.json();
    },

    async delete(formationId: number): Promise<Formation> {
      const res = await fetch(`${getApiBase()}/formations/${formationId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al eliminar la formación");
      return data;
    },
  },

  gameSettings: {
    async get(): Promise<GameSettings> {
      const res = await fetch(`${getApiBase()}/game-settings`, { cache: "no-store" });
      if (!res.ok) {
        let message = `Error al cargar configuración de XP (${res.status})`;
        try {
          const json = await res.json();
          if (json.message) message = json.message;
        } catch {
          if (res.status === 404) {
            message =
              "El endpoint /game-settings no existe. Reinicia el backend para cargar el módulo de XP.";
          }
        }
        throw new Error(message);
      }
      return res.json();
    },

    async update(data: { currentSession?: number }): Promise<GameSettings> {
      const res = await fetch(`${getApiBase()}/game-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al guardar configuración");
      return json;
    },

    async upsertSession(config: SessionXpConfig): Promise<GameSettings> {
      const res = await fetch(`${getApiBase()}/game-settings/sessions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al guardar sesión");
      return json;
    },

    async deleteSession(session: number): Promise<GameSettings> {
      const res = await fetch(`${getApiBase()}/game-settings/sessions/${session}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al eliminar sesión");
      return json;
    },
  },
};
