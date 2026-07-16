-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 100;

-- CreateTable
CREATE TABLE "UserClub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "UserClub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnlockedNode" (
    "id" TEXT NOT NULL,
    "userClubId" TEXT NOT NULL,
    "playerId" INTEGER NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnlockedNode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserClub_name_key" ON "UserClub"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UnlockedNode_userClubId_playerId_key" ON "UnlockedNode"("userClubId", "playerId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserClub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockedNode" ADD CONSTRAINT "UnlockedNode_userClubId_fkey" FOREIGN KEY ("userClubId") REFERENCES "UserClub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockedNode" ADD CONSTRAINT "UnlockedNode_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
