-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Move" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Move_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "jpName" TEXT,
    "position" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "season" INTEGER NOT NULL DEFAULT 1,
    "spriteUrl" TEXT,
    "gp" INTEGER NOT NULL,
    "tp" INTEGER NOT NULL,
    "kick" INTEGER NOT NULL,
    "body" INTEGER NOT NULL,
    "control" INTEGER NOT NULL,
    "guard" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "stamina" INTEGER NOT NULL,
    "guts" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerMove" (
    "playerId" INTEGER NOT NULL,
    "moveId" INTEGER NOT NULL,

    CONSTRAINT "PlayerMove_pkey" PRIMARY KEY ("playerId","moveId")
);

-- CreateTable
CREATE TABLE "Connection" (
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("sourceId","targetId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Move_name_key" ON "Move"("name");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMove" ADD CONSTRAINT "PlayerMove_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMove" ADD CONSTRAINT "PlayerMove_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
