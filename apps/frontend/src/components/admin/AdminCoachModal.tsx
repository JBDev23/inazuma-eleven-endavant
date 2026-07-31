"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Coach, CoachModifiers, StatKey, Team, UserClub } from "@inazuma/shared";
import { STAT_KEYS } from "@inazuma/shared";

interface AdminCoachModalProps {
  coach: Coach | Partial<Coach>;
  teams: Team[];
  userClubs: UserClub[];
  onClose: () => void;
  onSave: (coachData: Partial<Coach>) => Promise<void>;
}

function makeDefaultModifiers(value = 1): CoachModifiers {
  return Object.fromEntries(STAT_KEYS.map((k) => [k, value])) as CoachModifiers;
}

function normalizeModifiers(maybe: unknown): CoachModifiers {
  const base = makeDefaultModifiers(1);
  if (!maybe || typeof maybe !== "object") return base;

  const record = maybe as Record<string, unknown>;
  for (const key of STAT_KEYS) {
    const n = record[key as string];
    if (typeof n === "number") base[key] = n;
  }
  return base;
}

export default function AdminCoachModal({
  coach,
  teams,
  userClubs,
  onClose,
  onSave,
}: AdminCoachModalProps) {
  const coachId = (coach as Coach).id;
  const isNew = !coachId;

  const defaultTeamId = teams[0]?.id ?? 1;

  const initialOwnerId = (coach as Coach).ownerId ?? null;
  const initialIsFreeAgent = initialOwnerId ? false : (coach as Coach).isFreeAgent ?? false;

  const [formData, setFormData] = useState<{
    name: string;
    nickname: string | null;
    spriteUrl: string | null;
    teamId: number;
    season: number;
    level: number;
    experience: number;
    isFreeAgent: boolean;
    ownerId: string | null;
    maxModifiers: CoachModifiers;
  }>(() => ({
    name: (coach as Coach).name ?? "",
    nickname: (coach as Coach).nickname ?? null,
    spriteUrl: (coach as Coach).spriteUrl ?? null,
    teamId: (coach as Coach).teamId ?? defaultTeamId,
    season: (coach as Coach).season ?? 1,
    level: (coach as Coach).level ?? 1,
    experience: (coach as Coach).experience ?? 0,
    isFreeAgent: initialIsFreeAgent,
    ownerId: initialOwnerId,
    maxModifiers: normalizeModifiers((coach as Coach).maxModifiers ?? {}),
  }));

  const [isSaving, setIsSaving] = useState(false);

  const statLabels = useMemo(() => {
    const labels: Record<StatKey, string> = {
      gp: "GP",
      tp: "TP",
      kick: "Kick",
      body: "Body",
      control: "Control",
      guard: "Guard",
      speed: "Speed",
      stamina: "Stamina",
      guts: "Guts",
    };
    return labels;
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Partial<Coach> = {
        name: formData.name.trim(),
        nickname: formData.nickname,
        spriteUrl: formData.spriteUrl,
        teamId: Number(formData.teamId),
        season: formData.season,
        level: formData.level,
        experience: formData.experience,
        isFreeAgent: formData.ownerId ? false : formData.isFreeAgent,
        ownerId: formData.ownerId,
        // El backend recalcula baseModifiers desde maxModifiers.
        maxModifiers: formData.maxModifiers,
      };

      await onSave(payload);
    } finally {
      setIsSaving(false);
    }
  };

  const ownerIsSelected = formData.ownerId !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm overflow-y-auto p-0 sm:p-4">
      <div className="bg-slate-900 border-2 border-cyan-900/50 rounded-t-2xl sm:rounded-2xl w-full max-w-3xl max-h-[92dvh] sm:max-h-none overflow-y-auto shadow-2xl my-0 sm:my-auto">
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-black text-white uppercase">{isNew ? "Crear Entrenador" : "Editar Entrenador"}</h3>
            {!isNew && <p className="text-[10px] text-slate-500 font-mono">ID: {coachId}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-cyan-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nickname</label>
              <input
                type="text"
                value={formData.nickname ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, nickname: e.target.value.trim() ? e.target.value : null }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-cyan-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Sprite URL</label>
              <input
                type="text"
                value={formData.spriteUrl ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, spriteUrl: e.target.value.trim() ? e.target.value : null }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-cyan-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Equipo</label>
              <select
                value={formData.teamId}
                onChange={(e) => setFormData((p) => ({ ...p, teamId: parseInt(e.target.value, 10) }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-cyan-500 focus:outline-hidden appearance-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Temporada</label>
              <input
                type="number"
                min={1}
                value={formData.season}
                onChange={(e) => setFormData((p) => ({ ...p, season: parseInt(e.target.value, 10) || 1 }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
              />
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5">
              <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Precio mercado</p>
              <p className="text-yellow-400 font-black tabular-nums">
                {(coach as Coach).price ?? 0} PP
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Calculado por nivel (config global en Ajustes)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nivel</label>
              <input
                type="number"
                min={1}
                value={formData.level}
                onChange={(e) => setFormData((p) => ({ ...p, level: parseInt(e.target.value, 10) || 1 }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Experiencia</label>
              <input
                type="number"
                min={0}
                value={formData.experience}
                onChange={(e) => setFormData((p) => ({ ...p, experience: parseInt(e.target.value, 10) || 0 }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Dueño (opcional)</label>
                <select
                  value={formData.ownerId ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const ownerId = value ? value : null;
                    setFormData((p) => ({
                      ...p,
                      ownerId,
                      isFreeAgent: ownerId ? false : p.isFreeAgent,
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:border-cyan-500 focus:outline-hidden appearance-none"
                >
                  <option value="">Sin dueño</option>
                  {userClubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Agente libre</label>
                  <input
                    type="checkbox"
                    checked={formData.isFreeAgent}
                    disabled={ownerIsSelected}
                    onChange={(e) => setFormData((p) => ({ ...p, isFreeAgent: e.target.checked }))}
                    className="w-5 h-5 accent-cyan-400"
                  />
                  <p className="mt-1 text-[10px] text-slate-600">
                    {ownerIsSelected ? "Si tiene dueño, no puede ser agente libre." : "Marca para ponerlo como agente libre."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase">Max Modifiers</p>
              <p className="text-[10px] text-slate-600 font-mono mt-1">
                Se usa para recalcular `baseModifiers` en el backend.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STAT_KEYS.map((key) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">{statLabels[key]}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.maxModifiers[key]}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      setFormData((p) => ({
                        ...p,
                        maxModifiers: {
                          ...p.maxModifiers,
                          [key]: Number.isFinite(n) ? n : 0,
                        },
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 rounded-lg font-bold text-slate-400 bg-slate-800 hover:bg-slate-700"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 p-3 rounded-lg font-black text-white bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.35)] disabled:opacity-50"
            >
              {isSaving ? "GUARDANDO..." : "GUARDAR ENTRENADOR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

