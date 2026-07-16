-- AlterTable
ALTER TABLE "UserClub" ADD COLUMN     "activeCoachId" INTEGER;

-- CreateTable
CREATE TABLE "Coach" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "spriteUrl" TEXT,
    "price" INTEGER NOT NULL DEFAULT 500,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "baseModifiers" JSONB NOT NULL DEFAULT '{}',
    "maxModifiers" JSONB NOT NULL DEFAULT '{}',
    "isFreeAgent" BOOLEAN NOT NULL DEFAULT false,
    "teamId" INTEGER NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CoachToFormation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CoachToFormation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CoachToFormation_B_index" ON "_CoachToFormation"("B");

-- AddForeignKey
ALTER TABLE "UserClub" ADD CONSTRAINT "UserClub_activeCoachId_fkey" FOREIGN KEY ("activeCoachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserClub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CoachToFormation" ADD CONSTRAINT "_CoachToFormation_A_fkey" FOREIGN KEY ("A") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CoachToFormation" ADD CONSTRAINT "_CoachToFormation_B_fkey" FOREIGN KEY ("B") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
