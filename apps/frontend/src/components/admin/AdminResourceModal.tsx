"use client";

import { useMemo, useState } from "react";
import {
  AddTransactionDto,
  CLUB_RESOURCES,
  ClubResourceKey,
  pickClubResources,
  UserClub,
} from "@inazuma/shared";
import { X, Coins, Minus, Plus, TrendingDown, TrendingUp, Eraser } from "lucide-react";
import { CLUB_RESOURCE_STYLES } from "@/components/economy/club-resource-styles";

interface AdminResourceModalProps {
  club: UserClub;
  onClose: () => void;
  onSave: (clubId: string, transactionData: AddTransactionDto) => Promise<void>;
}

const INCREMENT_STEPS = [1, 10, 50, 100, 500, 1000];

type Operation = "add" | "subtract";

function parseAmountInput(value: string): number {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export default function AdminResourceModal({ club, onClose, onSave }: AdminResourceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ClubResourceKey>("pp");
  const [operation, setOperation] = useState<Operation>("add");
  const [amountInput, setAmountInput] = useState("");
  const [description, setDescription] = useState("");
  
  const [step, setStep] = useState<number>(50);

  const currentResources = useMemo(() => pickClubResources(club), [club]);
  const selectedMeta = CLUB_RESOURCES.find((r) => r.key === selectedResource)!;
  const selectedStyle = CLUB_RESOURCE_STYLES[selectedResource];
  const currentBalance = currentResources[selectedResource];
  const amount = parseAmountInput(amountInput);
  const signedDelta = operation === "add" ? amount : -amount;
  const newBalance = currentBalance + signedDelta;

  const adjustAmount = (direction: 1 | -1) => {
    const current = parseInt(amountInput, 10) || 0;
    const next = Math.max(0, current + (step * direction));
    setAmountInput(next > 0 ? String(next) : "");
  };

  const handleAmountChange = (value: string) => {
    if (value === "") {
      setAmountInput("");
      return;
    }
    const digitsOnly = value.replace(/\D/g, "");
    setAmountInput(digitsOnly.replace(/^0+(?=\d)/, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      alert("Indica una cantidad mayor que cero.");
      return;
    }
    if (!description.trim()) {
      alert("Debes incluir un motivo para la transacción.");
      return;
    }
    if (newBalance < 0) {
      alert("El saldo no puede quedar en negativo.");
      return;
    }

    const transactionData: AddTransactionDto = {
      amountPP: selectedResource === "pp" ? signedDelta : 0,
      amountPE: selectedResource === "pe" ? signedDelta : 0,
      amountYens: selectedResource === "yens" ? signedDelta : 0,
      amountPC: selectedResource === "pc" ? signedDelta : 0,
      description: description.trim(),
    };

    setIsSubmitting(true);
    try {
      await onSave(club.id, transactionData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2 min-w-0">
            <Coins className="text-emerald-500 w-5 h-5 shrink-0" />
            <h3 className="font-black text-white uppercase tracking-wider text-sm sm:text-base truncate">
              Gestión de Tesorería
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 -mr-2 text-slate-400 hover:text-white transition-colors touch-manipulation"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="overflow-y-auto overscroll-contain p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 scrollbar-hide">

            <div className="text-center">
              <p className="text-xs sm:text-sm text-slate-400 font-mono uppercase">Modificando saldo de:</p>
              <p className="text-lg sm:text-xl font-black text-white truncate px-2">{club.name}</p>
            </div>

            {/* 1. SELECCIÓN DE RECURSO */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                1. Elige el recurso
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CLUB_RESOURCES.map(({ key, short, name }) => {
                  const style = CLUB_RESOURCE_STYLES[key];
                  const isSelected = selectedResource === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedResource(key);
                        setAmountInput("");
                      }}
                      className={`rounded-xl border p-2.5 sm:p-3 text-left transition-all touch-manipulation min-h-[72px] ${
                        isSelected
                          ? `${style.border} ${style.bg} ring-2 ring-offset-2 ring-offset-slate-900 ring-white/30`
                          : "border-slate-800 bg-slate-950 active:border-slate-600"
                      }`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {short}
                      </p>
                      <p className={`text-xs sm:text-sm font-bold truncate ${isSelected ? style.text : "text-slate-300"}`}>
                        {name}
                      </p>
                      <p className={`text-base sm:text-lg font-black tabular-nums mt-0.5 ${style.text}`}>
                        {currentResources[key].toLocaleString("es-ES")}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. TIPO DE MOVIMIENTO */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                2. Tipo de movimiento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOperation("add")}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 min-h-[48px] font-bold uppercase text-sm transition-all touch-manipulation ${
                    operation === "add"
                      ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 active:border-slate-600"
                  }`}
                >
                  <TrendingUp size={16} /> Añadir
                </button>
                <button
                  type="button"
                  onClick={() => setOperation("subtract")}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 min-h-[48px] font-bold uppercase text-sm transition-all touch-manipulation ${
                    operation === "subtract"
                      ? "bg-red-600/20 border-red-500 text-red-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 active:border-slate-600"
                  }`}
                >
                  <TrendingDown size={16} /> Restar
                </button>
              </div>
            </div>

            {/* 3. SELECCIÓN DE SALTO */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                <span>3. Multiplicador (+ / -)</span>
              </label>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                {INCREMENT_STEPS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStep(s)}
                    className={`py-2 sm:py-1.5 sm:px-3 rounded-lg border text-xs font-bold transition-colors touch-manipulation min-h-[40px] flex-1 flex flex-col items-center justify-center ${
                      step === s
                        ? `${selectedStyle.badge} border`
                        : "border-slate-800 bg-slate-950 text-slate-400 active:border-slate-600"
                    }`}
                  >
                    {s.toLocaleString("es-ES")}
                  </button>
                ))}
                
                {/* Botón de limpiar cantidad */}
                <button
                  type="button"
                  onClick={() => setAmountInput("")}
                  className="py-2 sm:py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-red-950 hover:border-red-900 hover:text-red-400 text-slate-500 text-xs font-bold transition-colors touch-manipulation min-h-[40px] flex items-center justify-center gap-1 col-span-3 sm:col-span-1"
                  title="Poner a cero"
                >
                  <Eraser size={14} /> <span className="sm:hidden">Limpiar</span>
                </button>
              </div>
            </div>

            {/* 4. CANTIDAD FINAL Y BOTONES */}
            <div className="flex flex-col gap-2">
              <div className={`flex items-center gap-2 sm:gap-3 rounded-xl border p-2 ${selectedStyle.border} ${selectedStyle.bg}`}>
                
                {/* Botón Menos */}
                <button
                  type="button"
                  onClick={() => adjustAmount(-1)}
                  disabled={amount <= 0}
                  className="shrink-0 p-2 min-w-[56px] min-h-[56px] flex items-center justify-center rounded-lg bg-slate-950 border border-slate-700 text-slate-300 active:bg-slate-800 disabled:opacity-30 transition-colors touch-manipulation"
                >
                  <Minus size={22} />
                </button>

                {/* Input central */}
                <div className="flex-1 min-w-0 flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-1 w-full">
                    <span
                      className={`text-xl sm:text-2xl font-black shrink-0 ${
                        operation === "add" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {operation === "subtract" && amount > 0 ? "−" : "+"}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={amountInput}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className={`w-full max-w-[140px] bg-transparent text-center text-3xl sm:text-4xl font-black tabular-nums outline-none placeholder:text-slate-600 ${
                        operation === "add" ? "text-emerald-400" : "text-red-400"
                      }`}
                    />
                  </div>
                </div>

                {/* Botón Más */}
                <button
                  type="button"
                  onClick={() => adjustAmount(1)}
                  className="shrink-0 p-2 min-w-[56px] min-h-[56px] flex items-center justify-center rounded-lg bg-slate-950 border border-slate-700 text-slate-300 active:bg-slate-800 transition-colors touch-manipulation"
                >
                  <Plus size={22} />
                </button>
              </div>
            </div>

            {/* VISTA PREVIA DEL SALDO */}
            {amount > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 sm:p-4 text-center">
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2">
                  Vista previa
                </p>
                <p className="text-xs sm:text-sm text-slate-400 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  <span className={`font-black tabular-nums ${selectedStyle.text}`}>
                    {currentBalance.toLocaleString("es-ES")} {selectedMeta.short}
                  </span>
                  <span className="text-slate-600">→</span>
                  <span
                    className={`font-black tabular-nums ${
                      newBalance < 0 ? "text-red-400" : selectedStyle.text
                    }`}
                  >
                    {newBalance.toLocaleString("es-ES")} {selectedMeta.short}
                  </span>
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Motivo (para el registro)</label>
              <input
                type="text"
                placeholder="Ej: Multa por llegar tarde / Premio torneo"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-base text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-950/90 backdrop-blur-sm">
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0 || newBalance < 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 text-white font-black uppercase tracking-widest py-3.5 sm:py-3 rounded-xl transition-colors disabled:opacity-50 touch-manipulation min-h-[48px]"
            >
              {isSubmitting ? "Ejecutando..." : "Confirmar transacción"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}