-- AlterTable: SessionXpConfig — multiplicador pachanga y recompensas al ganador
ALTER TABLE "SessionXpConfig" ADD COLUMN IF NOT EXISTS "pachangaMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 0.2;
ALTER TABLE "SessionXpConfig" ADD COLUMN IF NOT EXISTS "winnerRewardPp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SessionXpConfig" ADD COLUMN IF NOT EXISTS "winnerRewardYens" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: GameSettings — quitar XP fija de pachanga
ALTER TABLE "GameSettings" DROP COLUMN IF EXISTS "xpPerPachanga";
