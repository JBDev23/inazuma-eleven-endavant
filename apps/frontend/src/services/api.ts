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
  Team,
  StartFacilityUpgradeResult,
  SetPitchElementResult,
  ApproveFacilityResult,
  FacilityId,
  CreateFormationDto,
  EquipItemDto,
  Formation,
  FormationClubAssignment,
  FormationWithClubStatus,
  Item,
  ClubItemWithDetails,
  Move,
  Player,
  PlayerWithDetails,
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

export type ApiErrorCode = "OFFLINE" | "TIMEOUT" | "NETWORK_ERROR" | "HTTP_ERROR" | "UNKNOWN";

export class ApiError extends Error {
  code: ApiErrorCode;
  status?: number;
  userMessage: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    options?: { status?: number; userMessage?: string },
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = options?.status;
    this.userMessage = options?.userMessage ?? message;
  }
}

const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return 'http://localhost:4000';
};

const DEFAULT_LOAD_TIMEOUT_MS = 20_000;
const DEFAULT_ACTION_TIMEOUT_MS = 30_000;

type RequestJsonOptions = RequestInit & {
  timeoutMs?: number;
  fallbackMessage: string;
};

const isOffline = () =>
  typeof navigator !== "undefined" &&
  "onLine" in navigator &&
  navigator.onLine === false;

const getFriendlyNetworkMessage = (fallbackMessage: string) => {
  if (isOffline()) {
    return "Parece que no tienes internet. Revisa la conexion e intentalo de nuevo.";
  }

  return `${fallbackMessage} Revisa tu conexion e intentalo de nuevo.`;
};

const parseJsonSafe = async (res: Response) => {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return res.json().catch(() => null);
};

const toApiError = (
  error: unknown,
  fallbackMessage: string,
  timeoutMs: number,
): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError(
      "TIMEOUT",
      `${fallbackMessage} La peticion ha superado el tiempo de espera.`,
      {
        userMessage: `La peticion ha tardado demasiado (>${Math.ceil(timeoutMs / 1000)}s). Intentalo otra vez.`,
      },
    );
  }

  if (error instanceof TypeError) {
    const code: ApiErrorCode = isOffline() ? "OFFLINE" : "NETWORK_ERROR";
    return new ApiError(code, error.message, {
      userMessage: getFriendlyNetworkMessage(fallbackMessage),
    });
  }

  if (error instanceof Error) {
    return new ApiError("UNKNOWN", error.message, {
      userMessage: fallbackMessage,
    });
  }

  return new ApiError("UNKNOWN", fallbackMessage, { userMessage: fallbackMessage });
};

export const getApiErrorMessage = (error: unknown, fallbackMessage: string) =>
  error instanceof ApiError ? error.userMessage : fallbackMessage;

async function requestJson<T>(
  path: string,
  { timeoutMs = DEFAULT_LOAD_TIMEOUT_MS, fallbackMessage, ...init }: RequestJsonOptions,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      ...init,
      signal: controller.signal,
    });
    const data = await parseJsonSafe(res);

    if (!res.ok) {
      const message =
        (data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : null) ?? `${fallbackMessage} (${res.status})`;

      throw new ApiError("HTTP_ERROR", message, {
        status: res.status,
        userMessage: message,
      });
    }

    return data as T;
  } catch (error) {
    throw toApiError(error, fallbackMessage, timeoutMs);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  players: {
    async updatePlayer(playerId: number, updatedData: Partial<Player>) {
      return requestJson<Player>(`/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al actualizar jugador",
      });
    },
    async getByTeam(teamId: string) {
      return requestJson<(PlayerWithDetails & { team: { name: string } })[]>(`/teams/players/${teamId}`, {
        cache: "no-store",
        timeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
        fallbackMessage: "Error al cargar jugadores del equipo",
      });
    },
    async getAllPlayers() {
      return requestJson<Player[]>(`/players`, {
        cache: "no-store",
        timeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
        fallbackMessage: "Error al cargar jugadores",
      });
    },
    async bulkUpdatePlayers(playerIds: number[], updatedData: Partial<Player>) {
      return requestJson<unknown>(`/players/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds, ...updatedData }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al actualizar jugadores",
      });
    },
    async bulkReleasePlayers(playerIds: number[]) {
      return requestJson<{ released: number; skipped: number }>(`/players/bulk-release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al liberar jugadores",
      });
    },
    async releasePlayer(playerId: number) {
      return requestJson<unknown>(`/players/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al liberar jugador",
      });
    },
  },

  teams: {
    async list() {
      return requestJson<Team[]>(`/teams`, {
        cache: "no-store",
        timeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
        fallbackMessage: "Error al cargar equipos",
      });
    },

    async get(teamId: string) {
      return requestJson<Team>(`/teams/${teamId}`, {
        cache: "no-store",
        timeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
        fallbackMessage: "Error al cargar equipo",
      });
    },

    async saveMap(teamId: string, mapData: unknown) {
      return requestJson<unknown>(`/teams/${teamId}/map`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mapData),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al guardar el mapa del equipo",
      });
    },

    async update(teamId: number, updatedData: Partial<Pick<Team, "name" | "slug" | "type">>) {
      return requestJson<Team>(`/teams/${teamId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al actualizar el equipo",
      });
    },
  },

  market: {
    async login(clubId: string, pin: string) {
      return requestJson<{ error?: string; clubId?: string }>("/market/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clubId, pin }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo iniciar sesion.",
      });
    },

    async getUserClubs() {
      return requestJson<UserClub[]>("/market/user-clubs", {
        cache: "no-store",
        fallbackMessage: "No se pudieron cargar los clubes del mercado.",
      });
    },

    async getUserClub(clubId: string) {
      return requestJson<UserClub>(`/market/club/${clubId}`, {
        cache: "no-store",
        fallbackMessage: "No se pudo cargar la sede del club.",
      });
    },
    async getTeamMapForUser(clubId: string, teamSlug: string, sourceTeamSlug?: string) {
      const query = sourceTeamSlug ? `?sourceTeamSlug=${sourceTeamSlug}` : "";
      return requestJson<{ nodes: unknown[]; edges: unknown[] }>(`/market/${clubId}/map/${teamSlug}${query}`, {
        cache: "no-store",
        fallbackMessage: "No se pudo cargar el mapa del equipo.",
      });
    },

    async performAction(clubId: string, action: "buy" | "toll" | "sell", nickname: string) {
      return requestJson<{ newBalance: number }>(`/market/${clubId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, nickname }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo completar la transaccion.",
      });
    },
    async debugTogglePlayer(clubId: string, nickname: string, action: 'buy' | 'sell' | 'make-rival-toll') {
      return requestJson<unknown>("/market/debug/toggle-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId, nickname, action }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo completar la accion de depuracion.",
      });
    },
    async getFreeAgents() {
      return requestJson<Player[]>("/market/free-agents", {
        cache: "no-store",
        fallbackMessage: "No se pudieron cargar los agentes libres.",
      });
    },
    async getFreeCoaches() {
      return requestJson<Coach[]>("/market/free-coaches", {
        cache: "no-store",
        fallbackMessage: "No se pudieron cargar los entrenadores libres.",
      });
    },
    async buyCoach(clubId: string, coachId: number) {
      return requestJson<{ newBalance: number }>(`/market/${clubId}/coaches/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo fichar al entrenador.",
      });
    },
    async sellCoach(clubId: string, coachId: number) {
      return requestJson<{ newBalance: number }>(`/market/${clubId}/coaches/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo liberar al entrenador.",
      });
    },
    async createUserClub(data: {
      name: string;
      password: string;
      baseTeamSlug?: string | null;
      shieldUrl?: string | null;
      pp?: number;
      pe?: number;
      yens?: number;
      pc?: number;
    }) {
      return requestJson<UserClub>("/market/user-clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo crear el club.",
      });
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

    async deleteUserClub(clubId: string) {
      return requestJson<{ success: true }>(`/market/user-clubs/${clubId}`, {
        method: "DELETE",
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo eliminar el club.",
      });
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
      return requestJson<Formation[]>("/market/formations", {
        cache: "no-store",
        fallbackMessage: "No se pudo cargar el catalogo de formaciones.",
      });
    },

    async getClubFormations(clubId: string): Promise<FormationWithClubStatus[]> {
      return requestJson<FormationWithClubStatus[]>(`/market/${clubId}/formations`, {
        cache: "no-store",
        fallbackMessage: "No se pudieron cargar las formaciones del club.",
      });
    },

    async buyFormation(clubId: string, formationId: number): Promise<BuyFormationResult> {
      return requestJson<BuyFormationResult>(`/market/${clubId}/formations/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo comprar la formacion.",
      });
    },

    async activateFormation(
      clubId: string,
      formationId: number,
    ): Promise<ActivateFormationResult> {
      return requestJson<ActivateFormationResult>(`/market/${clubId}/formations/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo activar la formacion.",
      });
    },

    async adminGrantFormation(clubId: string, formationId: number) {
      return requestJson<{ success: true }>(`/market/user-clubs/${clubId}/formations/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo asignar la formacion al club.",
      });
    },

    async adminRevokeFormation(clubId: string, formationId: number) {
      return requestJson<{ success: true }>(`/market/user-clubs/${clubId}/formations/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo quitar la formacion del club.",
      });
    },

    async previewPeRedemption(
      clubId: string,
      allocations: RedeemPeDto["allocations"],
    ): Promise<PeRedemptionPreview> {
      return requestJson<PeRedemptionPreview>(`/market/${clubId}/pe/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo generar la vista previa de PE.",
      });
    },

    async redeemPe(
      clubId: string,
      allocations: RedeemPeDto["allocations"],
    ): Promise<RedeemPeResult> {
      return requestJson<RedeemPeResult>(`/market/${clubId}/pe/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo canjear PE.",
      });
    },

    async previewYeRedemption(
      clubId: string,
      allocations: RedeemYeDto["allocations"],
    ): Promise<YeRedemptionPreview> {
      return requestJson<YeRedemptionPreview>(`/market/${clubId}/ye/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo generar la vista previa de YE.",
      });
    },

    async redeemYe(
      clubId: string,
      allocations: RedeemYeDto["allocations"],
    ): Promise<RedeemYeResult> {
      return requestJson<RedeemYeResult>(`/market/${clubId}/ye/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo canjear YE.",
      });
    },

    async spendPc(
      clubId: string,
      playerId: number,
      statKey: import("@inazuma/shared").StatKey,
    ): Promise<import("@inazuma/shared").SpendPcResult> {
      return requestJson<import("@inazuma/shared").SpendPcResult>(`/market/${clubId}/pc/spend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, statKey }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudieron gastar los PC.",
      });
    },

    async getItemCatalog(): Promise<Item[]> {
      return requestJson<Item[]>("/market/items", {
        cache: "no-store",
        fallbackMessage: "No se pudo cargar el catalogo de objetos.",
      });
    },

    async getClubItems(clubId: string): Promise<ClubItemWithDetails[]> {
      return requestJson<ClubItemWithDetails[]>(`/market/${clubId}/items`, {
        cache: "no-store",
        fallbackMessage: "No se pudo cargar el inventario de objetos.",
      });
    },

    async buyItem(clubId: string, itemId: number): Promise<BuyItemResult> {
      return requestJson<BuyItemResult>(`/market/${clubId}/items/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo comprar el objeto.",
      });
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
      return requestJson<Consumable[]>("/market/consumables", {
        cache: "no-store",
        fallbackMessage: "No se pudo cargar el catalogo de consumibles.",
      });
    },

    async getClubConsumables(clubId: string): Promise<ClubConsumableWithDetails[]> {
      return requestJson<ClubConsumableWithDetails[]>(`/market/${clubId}/consumables`, {
        cache: "no-store",
        fallbackMessage: "No se pudo cargar el inventario de consumibles.",
      });
    },

    async buyConsumable(clubId: string, consumableId: number): Promise<BuyConsumableResult> {
      return requestJson<BuyConsumableResult>(`/market/${clubId}/consumables/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumableId }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo comprar el consumible.",
      });
    },

    async getSportsCity(clubId: string): Promise<ClubSportsCity> {
      return requestJson<ClubSportsCity>(`/market/${clubId}/sports-city`, {
        cache: "no-store",
        fallbackMessage: "No se pudo cargar la ciudad deportiva.",
      });
    },

    async getAllSportsCities(): Promise<Array<ClubSportsCity & { clubName: string }>> {
      return requestJson<Array<ClubSportsCity & { clubName: string }>>("/market/sports-cities", {
        cache: "no-store",
        fallbackMessage: "No se pudieron cargar las ciudades deportivas.",
      });
    },

    async startFacilityUpgrade(clubId: string, facilityId: FacilityId): Promise<StartFacilityUpgradeResult> {
      return requestJson<StartFacilityUpgradeResult>(`/market/${clubId}/sports-city/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo iniciar la obra.",
      });
    },

    async setPitchElement(
      clubId: string,
      pitchElement: string,
    ): Promise<SetPitchElementResult> {
      return requestJson<SetPitchElementResult>(`/market/${clubId}/sports-city/pitch-element`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitchElement }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "No se pudo guardar el terreno elemental.",
      });
    },

    async adminUpdateFacility(
      clubId: string,
      facilityId: FacilityId,
      options: { level?: number; approveConstruction?: boolean },
    ): Promise<ApproveFacilityResult> {
      return requestJson<ApproveFacilityResult>(`/market/sports-city/${clubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId, ...options }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al actualizar instalación",
      });
    },
  },

  nfc: {
    async syncBracelet(bracelet: BraceletData): Promise<NfcSyncResult> {
      return requestJson<NfcSyncResult>("/nfc/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bracelet),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al sincronizar la pulsera",
      });
    },
  },

  moves: {
    async create(move: Move) {
      await requestJson<unknown>("/moves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(move),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al crear la técnica",
      });
    },
    async update(moveId: number, updatedData: Partial<Move>) {
      await requestJson<unknown>(`/moves/${moveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al actualizar la técnica",
      });
    },
    async getAll() { 
      return requestJson<Move[]>("/moves", {
        cache: "no-store",
        timeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
        fallbackMessage: "Error al cargar las técnicas",
      });
    },
    async getOne(moveId: number) {
      return requestJson<Move>(`/moves/${moveId}`, {
        cache: "no-store",
        timeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
        fallbackMessage: "Error al cargar la técnica",
      });
    },
    async delete(moveId: number) {
      return requestJson<unknown>(`/moves/${moveId}`, {
        method: "DELETE",
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al eliminar la técnica",
      });
    },
  },

  coaches: {
    async create(coach: Partial<Coach>) {
      return requestJson<Coach>("/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coach),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al crear el entrenador",
      });
    },
    async update(coachId: number, updatedData: Partial<Coach>) {
      return requestJson<Coach>(`/coaches/${coachId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al actualizar el entrenador",
      });
    },
    async getAll(): Promise<Coach[]> {
      return requestJson<Coach[]>("/coaches", {
        cache: "no-store",
        timeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
        fallbackMessage: "Error al cargar entrenadores",
      });
    },
    async getOne(coachId: number): Promise<Coach> {
      return requestJson<Coach>(`/coaches/${coachId}`, {
        cache: "no-store",
        timeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
        fallbackMessage: "Error al cargar el entrenador",
      });
    },
    async delete(coachId: number) {
      return requestJson<unknown>(`/coaches/${coachId}`, {
        method: "DELETE",
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al eliminar el entrenador",
      });
    },
    async release(coachId: number) {
      return requestJson<unknown>("/coaches/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al liberar el entrenador",
      });
    },
  },

  formations: {
    async create(formation: CreateFormationDto): Promise<Formation> {
      return requestJson<Formation>("/formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formation),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al crear la formación",
      });
    },

    async update(formationId: number, updatedData: UpdateFormationDto): Promise<Formation> {
      return requestJson<Formation>(`/formations/${formationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al actualizar la formación",
      });
    },

    async getAll(): Promise<Formation[]> {
      return requestJson<Formation[]>("/formations", {
        cache: "no-store",
        timeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
        fallbackMessage: "Error al cargar formaciones",
      });
    },

    async getOne(formationId: number): Promise<Formation> {
      return requestJson<Formation>(`/formations/${formationId}`, {
        cache: "no-store",
        timeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
        fallbackMessage: "Error al cargar la formación",
      });
    },

    async delete(formationId: number): Promise<Formation> {
      return requestJson<Formation>(`/formations/${formationId}`, {
        method: "DELETE",
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al eliminar la formación",
      });
    },

    async getClubAssignments(formationId: number): Promise<FormationClubAssignment[]> {
      return requestJson<FormationClubAssignment[]>(`/formations/${formationId}/clubs`, {
        cache: "no-store",
        timeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
        fallbackMessage: "Error al cargar los clubes de la formación",
      });
    },
  },

  gameSettings: {
    async get(): Promise<GameSettings> {
      return requestJson<GameSettings>("/game-settings", {
        cache: "no-store",
        timeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
        fallbackMessage:
          "Error al cargar configuración de XP. Reinicia el backend si el modulo no existe.",
      });
    },

    async update(data: {
      currentSession?: number;
      basePlayerPrice?: number;
      playerPricePerLevel?: number;
      baseCoachPrice?: number;
      coachPricePerLevel?: number;
      playerPricePerPc?: number;
    }): Promise<GameSettings> {
      return requestJson<GameSettings>("/game-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al guardar configuración",
      });
    },

    async upsertSession(config: SessionXpConfig): Promise<GameSettings> {
      return requestJson<GameSettings>("/game-settings/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al guardar sesión",
      });
    },

    async deleteSession(session: number): Promise<GameSettings> {
      return requestJson<GameSettings>(`/game-settings/sessions/${session}`, {
        method: "DELETE",
        timeoutMs: DEFAULT_ACTION_TIMEOUT_MS,
        fallbackMessage: "Error al eliminar sesión",
      });
    },
  },
};
