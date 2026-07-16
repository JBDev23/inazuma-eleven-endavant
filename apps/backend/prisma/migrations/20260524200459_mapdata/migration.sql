/*
  Warnings:

  - You are about to drop the `Connection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Connection" DROP CONSTRAINT "Connection_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "Connection" DROP CONSTRAINT "Connection_targetId_fkey";

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "mapData" JSONB;

-- DropTable
DROP TABLE "Connection";
