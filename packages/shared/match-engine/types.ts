// packages/shared/src/match-engine/types.ts

export interface DuelStats {
    kick: number;    // Tiro
    body: number;    // Físico
    control: number; // Control
    guard: number;   // Defensa
    speed: number;   // Rapidez
    stamina: number; // Aguante
    guts: number;    // Valor
  }
  
  // Categorías basadas en la tabla de ponderación
  export type ActionCategory = 
    | 'CATCH_NORMAL' | 'CATCH_SUPER' | 'PUNCH_NORMAL'
    | 'BLOCK_NORMAL' | 'BLOCK_SUPER'
    | 'DRIBBLE_NORMAL' | 'DRIBBLE_SUPER' | 'FEINT_NORMAL'
    | 'SHOOT_NORMAL' | 'LOB_SHOT' | 'VOLLEY' | 'SHOOT_SUPER'
    | 'STEAL_NORMAL' | 'KEEP_NORMAL' | 'GOALKEEPER_DUEL'
    | 'BLOCK_WITH_DEFENSE' | 'BLOCK_WITH_SHOOT';
  
  export interface ActionWeight {
    weights: DuelStats; // Reutilizamos DuelStats para mapear los porcentajes
    rngMax: number;
    burningPhaseBonus: number; // Impulso de Fase de Furor
  }