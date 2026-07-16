-- CreateEnum
CREATE TYPE "FormationType" AS ENUM ('OFFENSIVE', 'DEFENSIVE', 'BALANCED');

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "isActiveRoster" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "position11" INTEGER,
ADD COLUMN     "position4" INTEGER;

-- AlterTable
ALTER TABLE "UserClub" ADD COLUMN     "activeFormation11Id" INTEGER,
ADD COLUMN     "activeFormation4Id" INTEGER;

-- CreateTable
CREATE TABLE "Formation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "playerCount" INTEGER NOT NULL,
    "type" "FormationType" NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "positions" JSONB NOT NULL,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubFormation" (
    "clubId" TEXT NOT NULL,
    "formationId" INTEGER NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubFormation_pkey" PRIMARY KEY ("clubId","formationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Formation_name_key" ON "Formation"("name");

-- AddForeignKey
ALTER TABLE "UserClub" ADD CONSTRAINT "UserClub_activeFormation11Id_fkey" FOREIGN KEY ("activeFormation11Id") REFERENCES "Formation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserClub" ADD CONSTRAINT "UserClub_activeFormation4Id_fkey" FOREIGN KEY ("activeFormation4Id") REFERENCES "Formation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubFormation" ADD CONSTRAINT "ClubFormation_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "UserClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubFormation" ADD CONSTRAINT "ClubFormation_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
