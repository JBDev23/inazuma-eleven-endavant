-- CreateEnum
CREATE TYPE "ConsumableCategory" AS ENUM ('WATER', 'FOOD', 'SPECIAL');

-- CreateEnum
CREATE TYPE "ConsumableEffect" AS ENUM ('RESTORE_GP_PERCENT', 'RESTORE_TP_PERCENT', 'REVEAL_OPPONENT_COMMAND');

-- CreateTable
CREATE TABLE "Consumable" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ConsumableCategory" NOT NULL,
    "effect" "ConsumableEffect" NOT NULL,
    "effectValue" INTEGER NOT NULL DEFAULT 0,
    "price" INTEGER NOT NULL DEFAULT 100,
    "description" TEXT,
    "imageUrl" TEXT,

    CONSTRAINT "Consumable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubConsumable" (
    "clubId" TEXT NOT NULL,
    "consumableId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClubConsumable_pkey" PRIMARY KEY ("clubId","consumableId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Consumable_name_key" ON "Consumable"("name");

-- AddForeignKey
ALTER TABLE "ClubConsumable" ADD CONSTRAINT "ClubConsumable_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "UserClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubConsumable" ADD CONSTRAINT "ClubConsumable_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES "Consumable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
