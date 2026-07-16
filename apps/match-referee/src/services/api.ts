import {
  ActivateFormationResult,
  ApplyMatchXpDto,
  ApplyMatchXpResult,
  FormationWithClubStatus,
  GameSettings,
  UpdateRosterDto,
  UserClub,
} from '@inazuma/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Error HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.message) errorMessage = errorData.message;
    } catch {
      // Respuesta no JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  clubs: {
    getAll: () => fetchAPI<UserClub[]>('/market/user-clubs'),

    getById: (clubId: string) => fetchAPI<UserClub>(`/market/club/${clubId}`),

    getFormations: (clubId: string) =>
      fetchAPI<FormationWithClubStatus[]>(`/market/${clubId}/formations`),

    activateFormation: (clubId: string, formationId: number) =>
      fetchAPI<ActivateFormationResult>(`/market/${clubId}/formations/active`, {
        method: 'PATCH',
        body: JSON.stringify({ formationId }),
      }),

    updateRoster: (clubId: string, roster: UpdateRosterDto) =>
      fetchAPI<UserClub>(`/market/${clubId}/roster`, {
        method: 'PATCH',
        body: JSON.stringify(roster),
      }),
  },

  gameSettings: {
    get: () => fetchAPI<GameSettings>('/game-settings'),

    applyMatchXp: (payload: ApplyMatchXpDto) =>
      fetchAPI<ApplyMatchXpResult>('/game-settings/apply-match-xp', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
};
