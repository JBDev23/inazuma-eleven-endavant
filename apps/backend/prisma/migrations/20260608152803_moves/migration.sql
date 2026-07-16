/*
  Warnings:

  - Added the required column `basePower` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `element` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxPower` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tpCost` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Move` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MoveType" AS ENUM ('SHOOT', 'DRIBBLE', 'BLOCK', 'CATCH', 'SKILL');

-- CreateEnum
CREATE TYPE "EvolutionPath" AS ENUM ('SHIN', 'L_G', 'NONE');

-- CreateEnum
CREATE TYPE "EvolutionSpeed" AS ENUM ('FAST', 'MEDIUM', 'SLOW', 'NONE');

-- AlterTable
ALTER TABLE "Move" ADD COLUMN     "basePower" INTEGER NOT NULL,
ADD COLUMN     "element" TEXT NOT NULL,
ADD COLUMN     "evolutionPath" "EvolutionPath" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "evolutionSpeed" "EvolutionSpeed" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "foulRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "maxPower" INTEGER NOT NULL,
ADD COLUMN     "secondaryType" TEXT,
ADD COLUMN     "tpCost" INTEGER NOT NULL,
ADD COLUMN     "type" "MoveType" NOT NULL;

-- AlterTable
ALTER TABLE "PlayerMove" ADD COLUMN     "moveLevel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "unlockLevel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "uses" INTEGER NOT NULL DEFAULT 0;
