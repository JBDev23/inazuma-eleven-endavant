-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('FIELD', 'STANDS', 'BENCHES', 'SHOP', 'TRAINING', 'CLINIC', 'LAB');

-- CreateTable
CREATE TABLE "ClubFacility" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "facility" "FacilityType" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "upgradingTo" INTEGER,

    CONSTRAINT "ClubFacility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubFacility_clubId_facility_key" ON "ClubFacility"("clubId", "facility");

-- AddForeignKey
ALTER TABLE "ClubFacility" ADD CONSTRAINT "ClubFacility_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "UserClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;
