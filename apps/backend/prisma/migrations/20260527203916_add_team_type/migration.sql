-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('CLUB', 'CENTRAL');

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "type" "TeamType" NOT NULL DEFAULT 'CLUB';
