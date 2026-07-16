-- CreateTable
CREATE TABLE "GameSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "currentSession" INTEGER NOT NULL DEFAULT 1,
    "xpPerPachanga" INTEGER NOT NULL DEFAULT 400,

    CONSTRAINT "GameSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionXpConfig" (
    "id" SERIAL NOT NULL,
    "session" INTEGER NOT NULL,
    "minXp" INTEGER NOT NULL,
    "maxXp" INTEGER NOT NULL,

    CONSTRAINT "SessionXpConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionXpConfig_session_key" ON "SessionXpConfig"("session");

-- Seed singleton settings and default session 1
INSERT INTO "GameSettings" ("id", "currentSession", "xpPerPachanga")
VALUES (1, 1, 400)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "SessionXpConfig" ("session", "minXp", "maxXp")
VALUES (1, 600, 3500)
ON CONFLICT ("session") DO NOTHING;
