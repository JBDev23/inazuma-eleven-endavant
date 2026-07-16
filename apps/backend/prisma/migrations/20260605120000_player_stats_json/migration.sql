-- AlterTable: añadir columnas nuevas
ALTER TABLE "Player" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Player" ADD COLUMN "experience" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Player" ADD COLUMN "baseStats" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Player" ADD COLUMN "maxStats" JSONB NOT NULL DEFAULT '{}';

-- Migrar datos existentes: las columnas planas pasan a maxStats; baseStats = max * 0.15
UPDATE "Player" SET
  "maxStats" = jsonb_build_object(
    'gp', "gp",
    'tp', "tp",
    'kick', "kick",
    'body', "body",
    'control', "control",
    'guard', "guard",
    'speed', "speed",
    'stamina', "stamina",
    'guts', "guts"
  ),
  "baseStats" = jsonb_build_object(
    'gp', ROUND("gp" * 0.15),
    'tp', ROUND("tp" * 0.15),
    'kick', ROUND("kick" * 0.15),
    'body', ROUND("body" * 0.15),
    'control', ROUND("control" * 0.15),
    'guard', ROUND("guard" * 0.15),
    'speed', ROUND("speed" * 0.15),
    'stamina', ROUND("stamina" * 0.15),
    'guts', ROUND("guts" * 0.15)
  );

-- Eliminar columnas planas antiguas
ALTER TABLE "Player" DROP COLUMN "gp",
DROP COLUMN "tp",
DROP COLUMN "kick",
DROP COLUMN "body",
DROP COLUMN "control",
DROP COLUMN "guard",
DROP COLUMN "speed",
DROP COLUMN "stamina",
DROP COLUMN "guts";
