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

function loadMovesFromJson(): MoveSeed[] {
  const movesFilePath = join(__dirname, 'moves.json');
  const fileContent = readFileSync(movesFilePath, 'utf-8');
  return JSON.parse(fileContent) as MoveSeed[];
}

type PlayerMoveEntry = {
  move: string;
  level: number;
};

type PlayerMovesSeed = Record<string, PlayerMoveEntry[]>;

function loadPlayerMovesFromJson(): PlayerMovesSeed {
  const filePath = join(__dirname, 'movimientos_combinados.json');
  const fileContent = readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent) as PlayerMovesSeed;
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
  return parseFloat(rate.replace('%', '')) / 100.0;
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
  const match = evolutionType.match(/^(Shin|L)\s+\((Fast|Medium|Slow)\)$/);
  if (!match) {
    throw new Error(`Evolution Type desconocido: "${evolutionType}"`);
  }

  const [, pathRaw, speedRaw] = match;
  const evolutionPath: EvolutionPath = pathRaw === 'Shin' ? 'SHIN' : 'L_G';
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
  console.log(`⚽ ${TEAM_SEEDS.length} equipos asegurados (T1 + T2).`);

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
  const moves = loadMovesFromJson();
  console.log(`\n⚡ Cargando ${moves.length} técnicas desde JSON...`);

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
  const playerMovesData = loadPlayerMovesFromJson();
  const moveIdByName = new Map(
    (await prisma.move.findMany({ select: { id: true, name: true } })).map(
      (move) => [move.name, move.id],
    ),
  );
  // Varios jugadores pueden compartir nickname (p. ej. Raimon / Dark Emperors)
  const playerIdsByNickname = new Map<string, number[]>();
  for (const player of await prisma.player.findMany({
    select: { id: true, nickname: true },
  })) {
    if (!player.nickname) continue;
    const list = playerIdsByNickname.get(player.nickname) ?? [];
    list.push(player.id);
    playerIdsByNickname.set(player.nickname, list);
  }

  const missingSkillNames = new Set<string>();
  const playerMoveRecords: {
    playerId: number;
    moveId: number;
    unlockLevel: number;
  }[] = [];

  for (const [nickname, entries] of Object.entries(playerMovesData)) {
    const playerIds = playerIdsByNickname.get(nickname);
    if (!playerIds?.length) {
      console.warn(`⚠️ Jugador no encontrado para repertorio: "${nickname}"`);
      continue;
    }

    for (const { move, level } of entries) {
      const moveId = moveIdByName.get(move);
      if (!moveId) {
        missingSkillNames.add(move);
        continue;
      }

      for (const playerId of playerIds) {
        playerMoveRecords.push({
          playerId,
          moveId,
          unlockLevel: level,
        });
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

    for (const [nickname, entries] of Object.entries(playerMovesData)) {
      const playerIds = playerIdsByNickname.get(nickname);
      if (!playerIds?.length) continue;

      for (const { move, level } of entries) {
        if (!missingSkillNames.has(move)) continue;

        const moveId = moveIdByName.get(move);
        if (!moveId) continue;

        for (const playerId of playerIds) {
          playerMoveRecords.push({
            playerId,
            moveId,
            unlockLevel: level,
          });
        }
      }
    }
  }

  await prisma.playerMove.createMany({
    data: playerMoveRecords,
    skipDuplicates: true,
  });

  console.log(
    `\n⚡ ${playerMoveRecords.length} técnicas asignadas a ${Object.keys(playerMovesData).length} jugadores.`,
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