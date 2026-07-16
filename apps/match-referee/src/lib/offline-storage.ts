import type { ApplyMatchXpDto, GameSettings } from "@inazuma/shared";

const GAME_SETTINGS_CACHE_KEY = "match-referee-game-settings";
const PENDING_UPLOADS_KEY = "match-referee-pending-uploads";
const XP_APPLIED_PREFIX = "match-xp-applied:";
export const PENDING_UPLOADS_CHANGED = "match-referee-pending-changed";

export interface PendingMatchUpload {
  id: string;
  payload: ApplyMatchXpDto;
  homeTeamName: string;
  awayTeamName: string;
  finishedAt: string;
  createdAt: string;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function notifyPendingChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PENDING_UPLOADS_CHANGED));
}

export function isBrowserOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export function getXpAppliedKey(finishedAt: string | null): string {
  return `${XP_APPLIED_PREFIX}${finishedAt ?? "unknown"}`;
}

export function isMatchXpApplied(finishedAt: string | null): boolean {
  if (typeof sessionStorage === "undefined" || !finishedAt) return false;
  return sessionStorage.getItem(getXpAppliedKey(finishedAt)) === "1";
}

export function markMatchXpApplied(finishedAt: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(getXpAppliedKey(finishedAt), "1");
}

export function cacheGameSettings(settings: GameSettings): void {
  writeJson(GAME_SETTINGS_CACHE_KEY, settings);
}

export function getCachedGameSettings(): GameSettings | null {
  return readJson<GameSettings | null>(GAME_SETTINGS_CACHE_KEY, null);
}

export async function fetchAndCacheGameSettings(
  fetcher: () => Promise<GameSettings>,
): Promise<GameSettings> {
  const settings = await fetcher();
  cacheGameSettings(settings);
  return settings;
}

export function getPendingUploads(): PendingMatchUpload[] {
  return readJson<PendingMatchUpload[]>(PENDING_UPLOADS_KEY, []);
}

export function getPendingUploadCount(): number {
  return getPendingUploads().length;
}

export function hasPendingUpload(finishedAt: string): boolean {
  return getPendingUploads().some((item) => item.id === finishedAt);
}

export function addPendingUpload(upload: PendingMatchUpload): void {
  const existing = getPendingUploads();
  if (existing.some((item) => item.id === upload.id)) return;

  writeJson(PENDING_UPLOADS_KEY, [...existing, upload]);
  notifyPendingChanged();
}

export function removePendingUpload(id: string): void {
  const next = getPendingUploads().filter((item) => item.id !== id);
  writeJson(PENDING_UPLOADS_KEY, next);
  notifyPendingChanged();
}

export function subscribePendingUploads(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onChange = () => listener();
  window.addEventListener(PENDING_UPLOADS_CHANGED, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(PENDING_UPLOADS_CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}
