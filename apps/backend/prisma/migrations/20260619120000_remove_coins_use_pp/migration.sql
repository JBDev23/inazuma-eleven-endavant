-- Migrate existing budget from coins to pp, then drop the legacy column
UPDATE "UserClub" SET "pp" = "coins";

ALTER TABLE "UserClub" DROP COLUMN "coins";

ALTER TABLE "UserClub" ALTER COLUMN "pp" SET DEFAULT 1000;
