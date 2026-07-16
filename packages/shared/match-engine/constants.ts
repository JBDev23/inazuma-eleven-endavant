// packages/shared/src/match-engine/constants.ts

import { ActionCategory, ActionWeight } from './types';

export const ACTION_WEIGHTS: Record<ActionCategory, ActionWeight> = {
  CATCH_NORMAL: { weights: { kick: 0.0, body: 0.0, control: 0.0, guard: 0.8, speed: 0.0, stamina: 0.1, guts: 0.1 }, rngMax: 20, burningPhaseBonus: 20 },
  CATCH_SUPER: { weights: { kick: 0.0, body: 0.1, control: 0.0, guard: 0.8, speed: 0.0, stamina: 0.0, guts: 0.1 }, rngMax: 20, burningPhaseBonus: 15 },
  PUNCH_NORMAL: { weights: { kick: 0.0, body: 0.3, control: 0.0, guard: 0.6, speed: 0.0, stamina: 0.0, guts: 0.1 }, rngMax: 20, burningPhaseBonus: 20 },
  
  BLOCK_NORMAL: { weights: { kick: 0.0, body: 0.0, control: 0.1, guard: 0.8, speed: 0.0, stamina: 0.0, guts: 0.1 }, rngMax: 30, burningPhaseBonus: 20 },
  BLOCK_SUPER: { weights: { kick: 0.0, body: 0.0, control: 0.1, guard: 0.7, speed: 0.0, stamina: 0.1, guts: 0.1 }, rngMax: 20, burningPhaseBonus: 15 },
  
  DRIBBLE_NORMAL: { weights: { kick: 0.0, body: 0.8, control: 0.1, guard: 0.0, speed: 0.0, stamina: 0.0, guts: 0.1 }, rngMax: 40, burningPhaseBonus: 20 },
  DRIBBLE_SUPER: { weights: { kick: 0.0, body: 0.7, control: 0.1, guard: 0.0, speed: 0.0, stamina: 0.1, guts: 0.1 }, rngMax: 20, burningPhaseBonus: 15 },
  FEINT_NORMAL: { weights: { kick: 0.0, body: 0.2, control: 0.5, guard: 0.0, speed: 0.2, stamina: 0.0, guts: 0.1 }, rngMax: 40, burningPhaseBonus: 20 },
  
  SHOOT_NORMAL: { weights: { kick: 0.8, body: 0.0, control: 0.1, guard: 0.0, speed: 0.0, stamina: 0.0, guts: 0.1 }, rngMax: 20, burningPhaseBonus: 20 },
  LOB_SHOT: { weights: { kick: 0.2, body: 0.0, control: 0.7, guard: 0.0, speed: 0.0, stamina: 0.0, guts: 0.1 }, rngMax: 20, burningPhaseBonus: 20 },
  VOLLEY: { weights: { kick: 0.6, body: 0.0, control: 0.0, guard: 0.0, speed: 0.3, stamina: 0.0, guts: 0.1 }, rngMax: 20, burningPhaseBonus: 20 },
  SHOOT_SUPER: { weights: { kick: 0.8, body: 0.0, control: 0.0, guard: 0.0, speed: 0.0, stamina: 0.1, guts: 0.1 }, rngMax: 20, burningPhaseBonus: 15 },
  
  STEAL_NORMAL: { weights: { kick: 0.0, body: 0.0, control: 0.0, guard: 0.6, speed: 0.0, stamina: 0.2, guts: 0.2 }, rngMax: 20, burningPhaseBonus: 0 },
  KEEP_NORMAL: { weights: { kick: 0.0, body: 0.6, control: 0.0, guard: 0.0, speed: 0.0, stamina: 0.2, guts: 0.2 }, rngMax: 20, burningPhaseBonus: 0 },
  GOALKEEPER_DUEL: { weights: { kick: 0.0, body: 0.3, control: 0.4, guard: 0.3, speed: 0.0, stamina: 0.0, guts: 0.0 }, rngMax: 40, burningPhaseBonus: 0 },
  
  BLOCK_WITH_DEFENSE: { weights: { kick: 0.0, body: 0.0, control: 0.0, guard: 0.7, speed: 0.0, stamina: 0.1, guts: 0.2 }, rngMax: 20, burningPhaseBonus: 15 },
  BLOCK_WITH_SHOOT: { weights: { kick: 0.7, body: 0.0, control: 0.2, guard: 0.0, speed: 0.0, stamina: 0.1, guts: 0.0 }, rngMax: 20, burningPhaseBonus: 15 },
};