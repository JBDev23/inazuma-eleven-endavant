import 'dotenv/config';
import {
  EvolutionPath,
  EvolutionSpeed,
  FormationType,
  MoveType,
  PrismaClient,
} from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BASE_STAT_MULTIPLIER,
  buildBaseModifiersFromMax,
  buildBaseStatsFromMax,
  buildMaxModifiersFromSeed,
  buildMaxStatsFromSeed,
  type StatKey,
} from '@inazuma/shared';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const STAT_KEYS: StatKey[] = [
  'gp',
  'tp',
  'kick',
  'body',
  'control',
  'guard',
  'speed',
  'stamina',
  'guts',
];

type PlayerSeed = {
  'team-slug': string;
  nickname: string | null;
  name: string;
  position: string;
  element: string;
  jpName: string | null;
  season: number;
} & Record<StatKey, number>;

type TeamSeed = {
  name: string;
  slug: string;
  type: 'CLUB' | 'CENTRAL';
};

const TEAM_SEEDS: TeamSeed[] = [
  // Temporada 1 — CLUB
  { name: 'Raimon', type: 'CLUB', slug: 'raimon' },
  { name: 'Occult', type: 'CLUB', slug: 'occult' },
  { name: 'Kirkwood', type: 'CLUB', slug: 'kirkwood' },
  { name: 'Wild', type: 'CLUB', slug: 'wild' },
  { name: 'Brain', type: 'CLUB', slug: 'brainwashing' },
  { name: 'Otaku', type: 'CLUB', slug: 'otaku' },
  { name: 'Shuriken', type: 'CLUB', slug: 'shuriken' },
  { name: 'Raimon Old Boys', type: 'CLUB', slug: 'raimon-old-boys' },
  // Temporada 1 — CENTRAL
  { name: 'Zeus', type: 'CENTRAL', slug: 'zeus' },
  { name: 'Royal Academy', type: 'CENTRAL', slug: 'royal-academy' },
  { name: 'Umbrella', type: 'CENTRAL', slug: 'umbrella' },
  { name: 'Farm', type: 'CENTRAL', slug: 'farm' },
  // Temporada 2 — CLUB
  { name: 'Alpine', type: 'CLUB', slug: 'alpine' },
  { name: 'Cloister Divinity', type: 'CLUB', slug: 'cloister-divinity' },
  { name: 'Triple C', type: 'CLUB', slug: 'triple-c' },
  { name: 'Fauxshore', type: 'CLUB', slug: 'fauxshore' },
  { name: 'Mary Times Memorial', type: 'CLUB', slug: 'mary-times-memorial' },
  { name: 'Secret Service', type: 'CLUB', slug: 'secret-service' },
  // Temporada 2 — CENTRAL
  { name: 'Royal Academy Redux', type: 'CENTRAL', slug: 'royal-academy-redux' },
  { name: 'Gemini Storm', type: 'CENTRAL', slug: 'gemini-storm' },
  { name: 'Epsilon', type: 'CENTRAL', slug: 'epsilon' },
  { name: 'The Genesis', type: 'CENTRAL', slug: 'the-genesis' },
  { name: 'Prominence', type: 'CENTRAL', slug: 'prominence' },
  { name: 'Diamond Dust', type: 'CENTRAL', slug: 'diamond-dust' },
  { name: 'Dark Emperors', type: 'CENTRAL', slug: 'dark-emperors' },
  // Temporada 3 — CLUB
  { name: 'Inazuma Japan', type: 'CLUB', slug: 'inazuma-japan' },
  // Temporada 3 — CENTRAL
  { name: 'Big Waves', type: 'CENTRAL', slug: 'big-waves' },
  { name: 'Desert Lion', type: 'CENTRAL', slug: 'desert-lion' },
  { name: 'Fire Dragon', type: 'CENTRAL', slug: 'fire-dragon' },
  { name: 'Knights of Queen', type: 'CENTRAL', slug: 'knights-of-queen' },
  { name: 'The Empire', type: 'CENTRAL', slug: 'the-empire' },
  { name: 'Unicorn', type: 'CENTRAL', slug: 'unicorn' },
  { name: 'Orpheus', type: 'CENTRAL', slug: 'orpheus' },
  { name: 'Os Reis', type: 'CENTRAL', slug: 'os-reis' },
  { name: 'Team Garshield', type: 'CENTRAL', slug: 'team-garshield' },
  { name: 'Red Matador', type: 'CENTRAL', slug: 'red-matador' },
  { name: 'Team K', type: 'CENTRAL', slug: 'team-k' },
  { name: 'The Little Gigant', type: 'CENTRAL', slug: 'little-gigant' },
  { name: 'Rose Griffon', type: 'CENTRAL', slug: 'rose-griffon' },
  { name: 'The Great Horn', type: 'CENTRAL', slug: 'the-great-horn' },
  { name: 'Makai Gundan Z', type: 'CENTRAL', slug: 'makai-gundan-z' },
  { name: 'Tenkuu no Shito', type: 'CENTRAL', slug: 'tenkuu-no-shito' },
];

function loadPlayersFromJson(): PlayerSeed[] {
  const playersFilePath = join(__dirname, 'players.json');
  const fileContent = readFileSync(playersFilePath, 'utf-8');
  return JSON.parse(fileContent) as PlayerSeed[];
}

type CoachSeed = {
  'team-slug': string;
  nickname: string | null;
  name: string;
  formations: string[];
} & Record<StatKey, number>;

function loadCoachesFromJson(): CoachSeed[] {
  const coachesFilePath = join(__dirname, 'coaches.json');
  const fileContent = readFileSync(coachesFilePath, 'utf-8');
  return JSON.parse(fileContent) as CoachSeed[];
}

type MoveSeed = {
  'Move Name': string;
  Type: string;
  Element: string;
  'Fouls Rate': string;
  'Base Power': number;
  'Power at Max Lv.': number;
  'TP Cost': number;
  'Secondary Type': string;
  'Evolution Type': string;
  'HEX ID': string;
};

function loadMovesFromJson(filename: string): MoveSeed[] {
  const movesFilePath = join(__dirname, filename);
  const fileContent = readFileSync(movesFilePath, 'utf-8');
  return JSON.parse(fileContent) as MoveSeed[];
}

/** Une moves.json (T1/T2) + movesIe3.json; si hay nombre repetido, prevalece el primero. */
function loadAllMovesFromJson(): MoveSeed[] {
  const byName = new Map<string, MoveSeed>();
  for (const move of [...loadMovesFromJson('moves.json'), ...loadMovesFromJson('movesIe3.json')]) {
    if (!byName.has(move['Move Name'])) {
      byName.set(move['Move Name'], move);
    }
  }
  return [...byName.values()];
}

type PlayerMoveEntry = {
  move: string;
  level: number;
};

type PlayerMovesSeed = Record<string, PlayerMoveEntry[]>;

function loadPlayerMovesFromJson(filename: string): PlayerMovesSeed {
  const filePath = join(__dirname, filename);
  const fileContent = readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent) as PlayerMovesSeed;
}

/** Alias de nombres en repertorios → nombre canónico del manual. */
const MOVE_NAME_ALIASES: Record<string, string> = {
  'Emperor Penguin No. 3': 'Emperor Penguin No.3',
  Megalodon: 'Mega Lodon',
  'Mirage Shot': 'Mirage Shoot',
  'Samba Strike': 'Strike Samba',
  'Barrier Reef': 'Great Barrier Reef',
  'Heavenly Drive': 'Heaven Drive',
  'Majin The Hand(W)': 'Majin The Hand(Wood)',
  'Fire Blizzard(A)': 'Fire Blizzard(Wind)',
};

function resolveMoveName(name: string): string {
  return MOVE_NAME_ALIASES[name] ?? name;
}

type FormationSeed = {
  name: string;
  playerCount: number;
  type: FormationType;
  price: number;
  positions: string;
};

function loadFormationsFromJson(): FormationSeed[] {
  const filePath = join(__dirname, 'formations.json');
  const fileContent = readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent) as FormationSeed[];
}

function parseFoulRate(rate: string): number {
  const trimmed = rate.trim();
  if (!trimmed) return 0;
  const parsed = parseFloat(trimmed.replace('%', ''));
  return Number.isFinite(parsed) ? parsed / 100.0 : 0;
}

function mapMoveType(type: string): MoveType {
  const map: Record<string, MoveType> = {
    Block: 'BLOCK',
    Dribble: 'DRIBBLE',
    Keeper: 'CATCH',
    Shoot: 'SHOOT',
  };
  const result = map[type];
  if (!result) {
    throw new Error(`Tipo de técnica desconocido: "${type}"`);
  }
  return result;
}

function parseEvolutionType(evolutionType: string): {
  evolutionPath: EvolutionPath;
  evolutionSpeed: EvolutionSpeed;
} {
  // Shin / Version → 3 niveles (SHIN); L / Grade → 5 niveles (L_G)
  const match = evolutionType.match(/^(Shin|Version|L|Grade)\s+\((Fast|Medium|Slow)\)$/);
  if (!match) {
    throw new Error(`Evolution Type desconocido: "${evolutionType}"`);
  }

  const [, pathRaw, speedRaw] = match;
  const evolutionPath: EvolutionPath =
    pathRaw === 'Shin' || pathRaw === 'Version' ? 'SHIN' : 'L_G';
  const speedMap: Record<string, EvolutionSpeed> = {
    Fast: 'FAST',
    Medium: 'MEDIUM',
    Slow: 'SLOW',
  };

  return {
    evolutionPath,
    evolutionSpeed: speedMap[speedRaw] ?? 'NONE',
  };
}

async function main() {
  console.log('⚡ Iniciando el mercado de fichajes de Inazuma Eleven...\n');

  // ==========================================
  // 0. LIMPIEZA DE BASE DE DATOS (Orden crucial)
  // ==========================================
  console.log('🧹 Limpiando la base de datos de datos antiguos...');
  await prisma.unlockedNode.deleteMany();
  await prisma.playerMove.deleteMany();
  await prisma.clubFormation.deleteMany();
  await prisma.player.deleteMany();
  await prisma.userClub.updateMany({ data: { activeCoachId: null } });
  await prisma.coach.deleteMany();
  await prisma.userClub.deleteMany();
  await prisma.formation.deleteMany();
  await prisma.move.deleteMany();
  await prisma.team.deleteMany();
  console.log('✨ Base de datos impoluta.\n');

  // ==========================================
  // 1. INSERCIÓN DE EQUIPOS
  // ==========================================
  await prisma.team.createMany({
    data: TEAM_SEEDS,
    skipDuplicates: true,
  });
  console.log(`⚽ ${TEAM_SEEDS.length} equipos asegurados (T1 + T2 + T3).`);

  await prisma.userClub.createMany({
    data: [
      {
        id: '1',
        name: 'Equipo 1',
        password: '1234',
        baseTeamSlug: 'occult',
      },
      {
        id: '2',
        name: 'Equipo 2',
        password: '1234',
      },
      {
        id: '3',
        name: 'Equipo 3',
        password: '1234',
      },
      {
        id: '4',
        name: 'Equipo 4',
        password: '1234',
      },
      {
        id: '5',
        name: 'Equipo 5',
        password: '1234',
      },
      {
        id: '6',
        name: 'Equipo 6',
        password: '1234',
      },
    ]
  });
  

  // ==========================================
  // 2. INSERCIÓN DE TÉCNICAS DESDE JSON
  // ==========================================
  const moves = loadAllMovesFromJson();
  console.log(`\n⚡ Cargando ${moves.length} técnicas desde moves.json + movesIe3.json...`);

  await prisma.move.createMany({
    data: moves.map((moveData) => {
      const { evolutionPath, evolutionSpeed } = parseEvolutionType(moveData['Evolution Type']);
      const secondaryType = moveData['Secondary Type'].trim();

      return {
        name: moveData['Move Name'],
        type: mapMoveType(moveData.Type),
        element: moveData.Element,
        foulRate: parseFoulRate(moveData['Fouls Rate']),
        basePower: moveData['Base Power'],
        maxPower: moveData['Power at Max Lv.'],
        tpCost: moveData['TP Cost'],
        secondaryType: secondaryType || null,
        evolutionPath,
        evolutionSpeed,
      };
    }),
  });

  console.log(`✅ ${moves.length} técnicas registradas en el manual general.`);

  // ==========================================
  // 2b. INSERCIÓN DE FORMACIONES DESDE JSON
  // ==========================================
  const formations = loadFormationsFromJson();
  console.log(`\n📐 Cargando ${formations.length} formaciones desde JSON...`);

  await prisma.formation.createMany({
    data: formations.map((formationData) => ({
      name: formationData.name,
      playerCount: formationData.playerCount,
      type: formationData.type,
      price: formationData.price,
      positions: formationData.positions,
    })),
  });

  console.log(`✅ ${formations.length} formaciones registradas en el catálogo.`);

  // ==========================================
  // 2c. INSERCIÓN DE ENTRENADORES DESDE JSON
  // ==========================================
  const coaches = loadCoachesFromJson();
  const teamsBySlug = await prisma.team.findMany({
    select: { id: true, slug: true, name: true },
  });
  const teamIdBySlug = new Map(teamsBySlug.map((team) => [team.slug, team.id]));

  console.log(`\n🎓 Reclutando ${coaches.length} entrenadores desde JSON...`);

  for (const coachData of coaches) {
    const teamId = teamIdBySlug.get(coachData['team-slug']);
    if (!teamId) {
      throw new Error(
        `No existe el equipo con slug "${coachData['team-slug']}" para el entrenador "${coachData.name}".`,
      );
    }

    const formattedSpriteUrl = `/sprites/sprites_${coachData['team-slug']}/${coachData.nickname}.webp`;

    const maxModifiers = buildMaxModifiersFromSeed(
      Object.fromEntries(STAT_KEYS.map((key) => [key, coachData[key]])) as Record<
        StatKey,
        number
      >,
    );
    const baseModifiers = buildBaseModifiersFromMax(maxModifiers);

    const coach = await prisma.coach.create({
      data: {
        name: coachData.name,
        nickname: coachData.nickname,
        spriteUrl: formattedSpriteUrl,
        season: 1,
        level: 1,
        experience: 0,
        baseModifiers,
        maxModifiers,
        teamId,
        formations: {
          connect: coachData.formations.map((name) => ({ name })),
        },
      },
    });

    console.log(
      `✅ Entrenador fichado: ${coach.name} (${coachData.formations.join(', ')}) -> ${coachData['team-slug']}`,
    );
  }

  // ==========================================
  // 3. INSERCIÓN DE JUGADORES DESDE JSON
  // ==========================================
  const players = loadPlayersFromJson();

  console.log(`\n🧤 Reclutando ${players.length} jugadores desde JSON...`);

  for (const playerData of players) {
    const teamId = teamIdBySlug.get(playerData['team-slug']);
    if (!teamId) {
      throw new Error(`No existe el equipo con slug "${playerData['team-slug']}" para el jugador "${playerData.name}".`);
    }

    const formattedSpriteUrl = `/sprites/sprites_${playerData['team-slug']}/${playerData.nickname}.webp`;
    const jpName = playerData.jpName?.trim() ? playerData.jpName.trim() : null;

    const maxStats = buildMaxStatsFromSeed(
      Object.fromEntries(STAT_KEYS.map((key) => [key, playerData[key]])) as Record<StatKey, number>,
    );
    const baseStats = buildBaseStatsFromMax(maxStats, BASE_STAT_MULTIPLIER);

    const player = await prisma.player.create({
      data: {
        name: playerData.name,
        nickname: playerData.nickname,
        jpName,
        position: playerData.position,
        element: playerData.element,
        season: playerData.season,
        spriteUrl: formattedSpriteUrl,
        level: 1,
        experience: 0,
        baseStats,
        maxStats,
        teamId,
      }
    });

    console.log(
      `✅ Fichado: ${player.name} (${player.position}) T${player.season} -> ${playerData['team-slug']}`,
    );
  }

  // ==========================================
  // 4. PLANTILLA INICIAL — Equipo 1 (Occult)
  // ==========================================
  const equipo1OccultNicknames = ['Mask', 'Zombie', 'Styx', 'Franky', 'Undead', 'Creepy', 'Mummy', 'Jiangshi'];
  const occultTeamId = teamIdBySlug.get('occult');
  if (!occultTeamId) {
    throw new Error('No existe el equipo con slug "occult".');
  }

  const equipo1Players = await prisma.player.findMany({
    where: {
      teamId: occultTeamId,
      nickname: { in: equipo1OccultNicknames },
    },
    select: { id: true },
  });

  await prisma.player.updateMany({
    where: { id: { in: equipo1Players.map((p) => p.id) } },
    data: { ownerId: '1' },
  });

  await prisma.unlockedNode.createMany({
    data: equipo1Players.map((p) => ({
      userClubId: '1',
      playerId: p.id,
    })),
  });

  console.log(
    `\n👕 Equipo 1: ${equipo1Players.length} jugadores de Occult en plantilla y ${equipo1Players.length} nodos desbloqueados en el mapa.`,
  );

  // ==========================================
  // 4b. FORMACIONES DESBLOQUEADAS — Equipo 1 (pruebas)
  // ==========================================
  const allFormations = await prisma.formation.findMany({
    select: { id: true, name: true, playerCount: true },
  });

  await prisma.clubFormation.createMany({
    data: allFormations.map((formation) => ({
      clubId: '1',
      formationId: formation.id,
    })),
  });

  const defaultFormation11 = allFormations.find((f) => f.name === 'F-Básica');
  const defaultFormation4 = allFormations.find((f) => f.name === 'F-Mini Básica');

  await prisma.userClub.update({
    where: { id: '1' },
    data: {
      activeFormation11Id: defaultFormation11?.id,
      activeFormation4Id: defaultFormation4?.id,
    },
  });

  console.log(
    `\n📐 Equipo 1: ${allFormations.length} formaciones desbloqueadas para pruebas.`,
  );

  // ==========================================
  // 5. REPERTORIO DE TÉCNICAS POR JUGADOR
  // ==========================================
  const playerMoveSources: { label: string; seasons: number[]; data: PlayerMovesSeed }[] = [
    {
      label: 'movimientos_combinados.json (T1/T2)',
      seasons: [1, 2],
      data: loadPlayerMovesFromJson('movimientos_combinados.json'),
    },
    {
      label: 'movimientos_ie3.json (T3)',
      seasons: [3],
      data: loadPlayerMovesFromJson('movimientos_ie3.json'),
    },
  ];

  const moveIdByName = new Map(
    (await prisma.move.findMany({ select: { id: true, name: true } })).map(
      (move) => [move.name, move.id],
    ),
  );

  // nickname → jugadores (varios pueden compartir nickname entre equipos/temporadas)
  const playersForMoves = await prisma.player.findMany({
    select: {
      id: true,
      nickname: true,
      season: true,
      team: { select: { slug: true } },
    },
  });

  const resolveMoveId = (rawName: string): number | undefined => {
    const name = resolveMoveName(rawName);
    return moveIdByName.get(name) ?? moveIdByName.get(rawName);
  };

  const pickPlayersForNickname = (
    nickname: string,
    seasons: number[],
  ): { id: number }[] => {
    const matches = playersForMoves.filter(
      (player) =>
        player.nickname === nickname && seasons.includes(player.season),
    );
    if (matches.length <= 1) return matches;

    // En T3, nicknames compartidos (Mark/Kevin/Kane) → preferir Inazuma Japan
    if (seasons.includes(3)) {
      const japan = matches.filter((player) => player.team.slug === 'inazuma-japan');
      if (japan.length) return japan;
    }

    return matches;
  };

  const missingSkillNames = new Set<string>();
  const playerMoveRecords: {
    playerId: number;
    moveId: number;
    unlockLevel: number;
  }[] = [];
  let totalPlayerKeys = 0;

  for (const source of playerMoveSources) {
    totalPlayerKeys += Object.keys(source.data).length;
    console.log(`\n📘 Asignando repertorio desde ${source.label}...`);

    for (const [nickname, entries] of Object.entries(source.data)) {
      const playerIds = pickPlayersForNickname(nickname, source.seasons);
      if (!playerIds.length) {
        console.warn(
          `⚠️ Jugador no encontrado para repertorio (${source.label}): "${nickname}"`,
        );
        continue;
      }

      for (const { move, level } of entries) {
        const moveId = resolveMoveId(move);
        if (!moveId) {
          missingSkillNames.add(resolveMoveName(move));
          continue;
        }

        for (const player of playerIds) {
          playerMoveRecords.push({
            playerId: player.id,
            moveId,
            unlockLevel: level,
          });
        }
      }
    }
  }

  if (missingSkillNames.size > 0) {
    console.log(
      `\n🧠 Creando ${missingSkillNames.size} habilidades pasivas (SKILL) ausentes del manual...`,
    );

    await prisma.move.createMany({
      data: [...missingSkillNames].map((name) => ({
        name,
        type: 'SKILL' as const,
        element: 'Void',
        foulRate: 0,
        basePower: 0,
        maxPower: 0,
        tpCost: 0,
        secondaryType: null,
        evolutionPath: 'NONE' as const,
        evolutionSpeed: 'NONE' as const,
      })),
    });

    for (const move of await prisma.move.findMany({
      where: { name: { in: [...missingSkillNames] } },
      select: { id: true, name: true },
    })) {
      moveIdByName.set(move.name, move.id);
    }

    for (const source of playerMoveSources) {
      for (const [nickname, entries] of Object.entries(source.data)) {
        const playerIds = pickPlayersForNickname(nickname, source.seasons);
        if (!playerIds.length) continue;

        for (const { move, level } of entries) {
          const canonical = resolveMoveName(move);
          if (!missingSkillNames.has(canonical)) continue;

          const moveId = moveIdByName.get(canonical);
          if (!moveId) continue;

          for (const player of playerIds) {
            playerMoveRecords.push({
              playerId: player.id,
              moveId,
              unlockLevel: level,
            });
          }
        }
      }
    }
  }

  await prisma.playerMove.createMany({
    data: playerMoveRecords,
    skipDuplicates: true,
  });

  console.log(
    `\n⚡ ${playerMoveRecords.length} técnicas asignadas a ${totalPlayerKeys} entradas de repertorio.`,
  );

  console.log('\n🏆 ¡Plantillas cargadas desde JSON con éxito!');

  const itemSeeds = [
    { name: 'Botas Velocidad', type: 'BOOTS' as const, price: 150, stats: { speed: 3 } },
    { name: 'Botas Tiro', type: 'BOOTS' as const, price: 180, stats: { kick: 2, control: 1 } },
    { name: 'Botas Defensa', type: 'BOOTS' as const, price: 160, stats: { guard: 2, body: 1 } },
    { name: 'Guantes Reflejos', type: 'GLOVES' as const, price: 200, stats: { guard: 3, control: 1 } },
    { name: 'Guantes Agarre', type: 'GLOVES' as const, price: 170, stats: { guard: 2, guts: 1 } },
    { name: 'Pulsera Fuerza', type: 'BRACELET' as const, price: 120, stats: { body: 2 } },
    { name: 'Pulsera Espíritu', type: 'BRACELET' as const, price: 100, stats: { guts: 2, stamina: 1 } },
    { name: 'Colgante Tiro', type: 'PENDANT' as const, price: 140, stats: { kick: 2 } },
    { name: 'Colgante Resistencia', type: 'PENDANT' as const, price: 130, stats: { stamina: 2, speed: 1 } },
  ];

  for (const seed of itemSeeds) {
    await prisma.item.upsert({
      where: { name: seed.name },
      update: {
        type: seed.type,
        price: seed.price,
        stats: seed.stats,
      },
      create: {
        name: seed.name,
        type: seed.type,
        price: seed.price,
        stats: seed.stats,
      },
    });
  }

  console.log(`\n🎒 ${itemSeeds.length} objetos de equipamiento cargados.`);

  const consumableSeeds = [
    {
      name: 'Agua Pequeña',
      category: 'WATER' as const,
      effect: 'RESTORE_GP_PERCENT' as const,
      effectValue: 25,
      price: 75,
      description: 'Recupera un 25% del GP del jugador. Un solo uso en partido.',
    },
    {
      name: 'Agua Mediana',
      category: 'WATER' as const,
      effect: 'RESTORE_GP_PERCENT' as const,
      effectValue: 50,
      price: 125,
      description: 'Recupera un 50% del GP del jugador. Un solo uso en partido.',
    },
    {
      name: 'Agua Grande',
      category: 'WATER' as const,
      effect: 'RESTORE_GP_PERCENT' as const,
      effectValue: 75,
      price: 175,
      description: 'Recupera un 75% del GP del jugador. Un solo uso en partido.',
    },
    {
      name: 'Agua Máxima',
      category: 'WATER' as const,
      effect: 'RESTORE_GP_PERCENT' as const,
      effectValue: 100,
      price: 225,
      description: 'Recupera el 100% del GP del jugador. Un solo uso en partido.',
    },
    {
      name: 'Bocadillo',
      category: 'FOOD' as const,
      effect: 'RESTORE_TP_PERCENT' as const,
      effectValue: 25,
      price: 75,
      description: 'Recupera un 25% del TP del jugador. Un solo uso en partido.',
    },
    {
      name: 'Ración',
      category: 'FOOD' as const,
      effect: 'RESTORE_TP_PERCENT' as const,
      effectValue: 50,
      price: 125,
      description: 'Recupera un 50% del TP del jugador. Un solo uso en partido.',
    },
    {
      name: 'Menú Completo',
      category: 'FOOD' as const,
      effect: 'RESTORE_TP_PERCENT' as const,
      effectValue: 75,
      price: 175,
      description: 'Recupera un 75% del TP del jugador. Un solo uso en partido.',
    },
    {
      name: 'Banquete',
      category: 'FOOD' as const,
      effect: 'RESTORE_TP_PERCENT' as const,
      effectValue: 100,
      price: 225,
      description: 'Recupera el 100% del TP del jugador. Un solo uso en partido.',
    },
  ];

  for (const seed of consumableSeeds) {
    await prisma.consumable.upsert({
      where: { name: seed.name },
      update: {
        category: seed.category,
        effect: seed.effect,
        effectValue: seed.effectValue,
        price: seed.price,
        description: seed.description,
      },
      create: {
        name: seed.name,
        category: seed.category,
        effect: seed.effect,
        effectValue: seed.effectValue,
        price: seed.price,
        description: seed.description,
      },
    });
  }

  console.log(`\n🧃 ${consumableSeeds.length} consumibles cargados.`);
}



main()
  .catch((e) => {
    console.error('❌ Error al inyectar datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexión cerrada.');
  });