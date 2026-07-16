export const playerWithMovesInclude = {
  team: true,
  primaryItem: true,
  secondaryItem: true,
  moves: {
    include: { move: true },
    orderBy: { unlockLevel: 'asc' as const },
  },
} as const;

export const rosterWithMovesInclude = {
  roster: {
    include: {
      team: true,
      primaryItem: true,
      secondaryItem: true,
      moves: {
        include: { move: true },
        orderBy: { unlockLevel: 'asc' as const },
      },
    },
  },
} as const;

export const coachWithFormationsInclude = {
  formations: true,
} as const;

export const clubWithDetailsInclude = {
  ...rosterWithMovesInclude,
  formations: {
    include: { formation: true },
    orderBy: { unlockedAt: 'asc' as const },
  },
  formation11: true,
  formation4: true,
  coaches: {
    include: coachWithFormationsInclude,
  },
  items: {
    include: { item: true },
    where: { quantity: { gt: 0 } },
    orderBy: { item: { name: 'asc' as const } },
  },
  consumables: {
    include: { consumable: true },
    where: { quantity: { gt: 0 } },
    orderBy: { consumable: { name: 'asc' as const } },
  },
  facilities: true,
} as const;
