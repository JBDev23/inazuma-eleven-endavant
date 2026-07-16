-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('BOOTS', 'GLOVES', 'BRACELET', 'PENDANT');

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 100,
    "stats" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubItem" (
    "clubId" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClubItem_pkey" PRIMARY KEY ("clubId","itemId")
);

-- AlterTable
ALTER TABLE "Player" ADD COLUMN "primaryItemId" INTEGER,
ADD COLUMN "secondaryItemId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Item_name_key" ON "Item"("name");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_primaryItemId_fkey" FOREIGN KEY ("primaryItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_secondaryItemId_fkey" FOREIGN KEY ("secondaryItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubItem" ADD CONSTRAINT "ClubItem_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "UserClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubItem" ADD CONSTRAINT "ClubItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
