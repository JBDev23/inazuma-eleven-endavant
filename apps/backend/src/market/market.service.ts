import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AddTransactionDto } from './dto/add-transaction.dto';
import { UserClub } from '@inazuma/shared';
import {
    clubWithDetailsInclude,
    coachWithFormationsInclude,
    playerWithMovesInclude,
} from '../common/prisma-includes';
import {
    formatClubWithRoster,
    formatPlayerWithMoves,
    formatPlayersWithMoves,
    enrichPlayerWithEquipment,
    enrichPlayersWithEquipment,
} from '../common/format-player';
import { rosterResetData } from '../common/player-roster';
import { formatFormation } from '../common/format-formation';
import { formatItem, formatClubItems } from '../common/format-item';
import { formatConsumable, formatClubConsumables } from '../common/format-consumable';
import {
    ALL_FACILITY_TYPES,
    DEFAULT_FACILITY_LEVELS,
    facilityIdToPrisma,
    formatClubFacilities,
    formatClubFacility,
} from '../common/format-facility';
import type {
    ActivateFormationResult,
    ApproveFacilityResult,
    BuyFormationResult,
    BuyItemResult,
    BuyConsumableResult,
    ClubFacilityRecord,
    ClubSportsCity,
    EquipItemDto,
    FacilityId,
    FacilityLevel,
    FormationWithClubStatus,
    PeAllocationDto,
    PeRedemptionPreview,
    StartFacilityUpgradeResult,
    SetPitchElementResult,
    RedeemPeResult,
    RedeemYeResult,
    YeAllocationDto,
    YeRedemptionPreview,
    RosterPositionUpdate,
    SpendPcResult,
    StatKey,
} from '@inazuma/shared';
import {
    addExperience,
    buildPeRedemptionPreview,
    buildYeRedemptionPreview,
    buildSpendPcPreview,
    canEquipPrimaryItem,
    FACILITY_LABELS,
    getUpgradeCost,
    isSecondaryItemType,
    MAX_COACH_LEVEL,
    MAX_PLAYER_LEVEL,
    mergeStatBonus,
    parseStatBonuses,
    PC_COST_PER_STAT,
    PE_XP_PER_POINT,
    YE_XP_PER_POINT,
    STAT_KEYS,
  getTrainingPeXpPerPoint,
  resolveClubFacilities,
  getShopItemPrice,
  getFreeMarketPlayerPrice,
} from '@inazuma/shared';
import type { Prisma } from '@prisma/client';

function isFormationAvailableToClub(
    formation: { id: number; price: number },
    purchasedIds: Set<number>,
    coachFormationIds: Set<number>,
): boolean {
    if (formation.price === 0) return true;
    return purchasedIds.has(formation.id) || coachFormationIds.has(formation.id);
}

type PrismaTx = Prisma.TransactionClient;

async function returnEquippedItemsToClub(tx: PrismaTx, playerId: number, clubId: string) {
    const player = await tx.player.findUnique({
        where: { id: playerId },
        select: { primaryItemId: true, secondaryItemId: true },
    });
    if (!player) return;

    const itemIds = [player.primaryItemId, player.secondaryItemId].filter(
        (id): id is number => id != null,
    );

    for (const itemId of itemIds) {
        await tx.clubItem.upsert({
            where: { clubId_itemId: { clubId, itemId } },
            create: { clubId, itemId, quantity: 1 },
            update: { quantity: { increment: 1 } },
        });
    }

    if (itemIds.length > 0) {
        await tx.player.update({
            where: { id: playerId },
            data: { primaryItemId: null, secondaryItemId: null },
        });
    }
}

@Injectable()
export class MarketService {

    constructor(private prisma: PrismaService) { }

    async login(loginDto: LoginDto) {
        return this.prisma.userClub.findUnique({
            where: { id: loginDto.clubId },
        });
    }

    async getUserClubs() {
        const clubs = await this.prisma.userClub.findMany({
            include: clubWithDetailsInclude,
        });
        return clubs.map((club) => formatClubWithRoster(club));
    }

    async getUserClub(clubId: string) {
        const club = await this.prisma.userClub.findUnique({
            where: { id: clubId },
            include: clubWithDetailsInclude,
        });
        return club ? formatClubWithRoster(club) : null;
    }

    async calculateMapState(clubId: string, teamSlug: string, sourceTeamSlug?: string) {

        // 1. Obtenemos el mapa crudo desde la base de datos
        const team = await this.prisma.team.findUnique({
            where: { slug: teamSlug }
        });

        if (!team || !team.mapData) {
            throw new NotFoundException('Mapa no encontrado');
        }

        const mapData = team.mapData as any; // { nodes: [], edges: [] }

        // 2. Extraemos los IDs de los jugadores que están en este mapa
        const playerNicknamesEnMapa = mapData.nodes
            .filter(n => n.type === 'playerNode' && n.data?.player?.nickname)
            .map(n => n.data.player.nickname);


        // 3. Consultamos el estado ACTUAL de esos jugadores en la Base de Datos
        const playersDB = await this.prisma.player.findMany({
            where: { nickname: { in: playerNicknamesEnMapa } },
            include: playerWithMovesInclude,
        });
        const playersByNickname = new Map(
            playersDB.filter(p => p.nickname).map(p => [p.nickname!, p]),
        );

        // Enriquecer nodos con datos frescos de la BD (evita mapData obsoleto con stats planas)
        mapData.nodes.forEach((node: any) => {
            if (node.type === 'playerNode' && node.data?.player?.nickname) {
                const dbPlayer = playersByNickname.get(node.data.player.nickname);
                if (dbPlayer) {
                    node.data.player = {
                        ...node.data.player,
                        ...enrichPlayerWithEquipment(dbPlayer),
                    };
                }
            }
        });


        // 4. Consultamos qué "peajes" ha pagado ya este usuario en el mapa
        const unlockedNodes = await this.prisma.unlockedNode.findMany({
            where: {
                userClubId: clubId,
                playerId: { in: playersDB.map(p => p.id) }
            }
        });
        const unlockedPlayerIds = new Set(unlockedNodes.map(u => u.playerId));

        // 5. PREPARAMOS LA NAVEGACIÓN (Mapa de quién conecta con quién)
        const hijosMap = new Map<string, string[]>();

        mapData.edges.forEach((edge: any) => {
            // Dirección normal (Source -> Target)
            if (!hijosMap.has(edge.source)) hijosMap.set(edge.source, []);
            hijosMap.get(edge.source)?.push(edge.target);

            // 🎯 FIX: Dirección inversa (Target -> Source)
            // Esto permite que el desbloqueo "suba" hacia arriba si compras desde abajo
            if (!hijosMap.has(edge.target)) hijosMap.set(edge.target, []);
            hijosMap.get(edge.target)?.push(edge.source);
        });

        // Encontramos los puntos de partida: El Escudo y las Entradas
        const nodosDeInicio = mapData.nodes
            .filter((n: any) => {
                if (n.type === 'shieldNode') return true; // El escudo siempre es punto de inicio

                if (n.type === 'entryNode') {
                    // Ojo: Asegúrate de usar la propiedad correcta (sourceTeamSlug o sourceMapId) 
                    // que hayas puesto en tu editor para definir el origen de esa entrada.
                    const origenDeEstaEntrada = n.data.sourceTeamSlug || n.data.sourceMapId;

                    // Si nos han pasado un origen en la petición, solo activamos la entrada que coincida
                    if (sourceTeamSlug && origenDeEstaEntrada === sourceTeamSlug) {
                        return true;
                    }
                    // Si no nos pasan origen (ej: es el mapa base al cargar la página), 
                    // las entradas se quedan apagadas porque se empieza desde el escudo.
                    if (!sourceTeamSlug) {
                        return false;
                    }
                }
                return false;
            })
            .map((n: any) => n.id);

        // 6. EL ALGORITMO EXPLORADOR (Calculando el "Fog of War")
        const cola = [...nodosDeInicio];
        const nodosAlcanzados = new Set<string>();
        // Tipamos el Map para que sepa que la clave es string y el valor es any
        const nodeMap = new Map<string, any>(mapData.nodes.map((n: any) => [n.id, n]));

        while (cola.length > 0) {
            const currentId = cola.shift();

            // 🎯 FIX 1: Verificamos que shift() no haya devuelto undefined
            if (!currentId) continue;

            nodosAlcanzados.add(currentId);

            // 🎯 FIX 2: Forzamos el tipado y verificamos que el nodo existe
            const node = nodeMap.get(currentId);
            if (!node) continue;

            let elCaminoSigue = false;

            if (node.type === 'shieldNode' || node.type === 'entryNode') {
                elCaminoSigue = true;
            }
            else if (node.type === 'playerNode') {
                const playerNickname = node.data.player.nickname;
                const dbPlayer = playersDB.find(p => p.nickname === playerNickname);

                if (dbPlayer) {
                    if (dbPlayer.ownerId === clubId) {
                        node.data.status = 'owned';
                        elCaminoSigue = true;
                    }
                    else if (unlockedPlayerIds.has(dbPlayer.id)) {
                        node.data.status = 'unlocked';
                        elCaminoSigue = true;
                    }
                    else if (dbPlayer.ownerId && dbPlayer.ownerId !== clubId) {
                        node.data.status = 'toll';
                        elCaminoSigue = false;
                    }
                    else {
                        node.data.status = 'available';
                        elCaminoSigue = false;
                    }
                }
            }

            if (elCaminoSigue) {
                const hijos = hijosMap.get(currentId) || [];
                hijos.forEach(hijoId => {
                    if (!nodosAlcanzados.has(hijoId)) cola.push(hijoId);
                });
            }
        }

        // 7. BLOQUEAR LO INALCANZABLE
        // Cualquier playerNode que nuestro explorador no haya alcanzado ni calculado, está bloqueado por defecto.

        mapData.nodes.forEach(node => {
            if (node.type === 'playerNode' && !node.data.status) {
                node.data.status = 'locked';
            }
        });

        // 8. COLOREAR Y ESTILAR LAS ARISTAS (Flechas) SEGÚN EL DESTINO
        mapData.edges.forEach((edge: any) => {
            // 🎯 La clave: Buscamos el nodo DESTINO (donde ACABA la flecha)
            const targetNode = nodeMap.get(edge.target);

            if (targetNode) {
                // CASO 1: Si la flecha va hacia un JUGADOR
                if (targetNode.type === 'playerNode') {
                    const status = targetNode.data.status;

                    if (status === 'owned') {
                        // 🔵 Acaba en nodo comprado: Amarilla y CONTINUA
                        edge.style = {
                            stroke: '#eab308',
                            strokeWidth: 3,
                            strokeDasharray: '0' // Sólida
                        };
                        edge.animated = false;
                    }
                    else if (status === 'available') {
                        // 🟢 Acaba en nodo por comprar: Amarilla y DISCONTINUA
                        edge.style = {
                            stroke: '#eab308',
                            strokeWidth: 3,
                            strokeDasharray: '5,5' // Punteada
                        };
                        edge.animated = true;
                    }
                    else {
                        // 🔒 Acaba en peaje o bloqueado profundo: Gris oscura y DISCONTINUA
                        edge.style = {
                            stroke: '#334155',
                            strokeWidth: 2,
                            strokeDasharray: '5,5'
                        };
                        edge.animated = false;
                    }
                }
                // CASO 2: Si la flecha va hacia una PUERTA de salida
                else if (targetNode.type === 'gatewayNode') {
                    // 1. Encontramos todas las aristas que apuntan a esta puerta
                    const aristasPadre = mapData.edges.filter((e: any) => e.target === targetNode.id);

                    // 2. Contamos cuántas hay en total
                    const llavesTotales = aristasPadre.length;

                    // 3. Contamos cuántas ha conseguido el usuario
                    const llavesConseguidas = aristasPadre.filter((e: any) => {
                        const padreNode = nodeMap.get(e.source);
                        return padreNode && (padreNode.data.status === 'owned' || padreNode.data.status === 'unlocked');
                    }).length;

                    // 4. ¿Están todas? (Nos aseguramos de que haya al menos 1 para no dividir por cero)
                    const tieneTodasLasLlaves = llavesTotales > 0 && llavesConseguidas === llavesTotales;

                    // 5. 🎯 Guardamos los números para el Frontend
                    targetNode.data.isLocked = !tieneTodasLasLlaves;
                    targetNode.data.keysAcquired = llavesConseguidas;
                    targetNode.data.keysRequired = llavesTotales;

                    edge.style = {
                        stroke: tieneTodasLasLlaves ? '#a855f7' : '#334155',
                        strokeWidth: 3,
                        strokeDasharray: tieneTodasLasLlaves ? '0' : '5,5'
                    };
                }
            }
        });

        return mapData;

    }

    async debugTogglePlayer(clubId: string, nickname: string, action: 'buy' | 'sell' | 'make-rival-toll') {
        // 1. Buscamos al jugador por su nickname único en el mapa
        const player = await this.prisma.player.findFirst({
            where: { nickname }
        });

        if (!player) {
            throw new NotFoundException(`Jugador con nickname '${nickname}' no encontrado en la Base de Datos.`);
        }

        // 2. Ejecutamos la mutación en la BD según el botón pulsado
        switch (action) {
            case 'buy': {
                const bought = await this.prisma.player.update({
                    where: { id: player.id },
                    data: { ownerId: clubId, ...rosterResetData },
                    include: playerWithMovesInclude,
                });
                return formatPlayerWithMoves(bought);
            }

            case 'sell': {
                await this.prisma.unlockedNode.deleteMany({
                    where: { playerId: player.id, userClubId: clubId },
                });
                await this.prisma.$transaction(async (tx) => {
                    await returnEquippedItemsToClub(tx, player.id, clubId);
                    await tx.player.update({
                        where: { id: player.id },
                        data: { ownerId: null, ...rosterResetData },
                    });
                });
                const sold = await this.prisma.player.findUnique({
                    where: { id: player.id },
                    include: playerWithMovesInclude,
                });
                return enrichPlayerWithEquipment(sold);
            }

            case 'make-rival-toll': {
                // 1. Buscamos cualquier otro club en la BD que NO sea el nuestro
                // (Asegúrate de que el modelo se llama 'userClub' o 'club', según tu schema)
                let rivalClub = await this.prisma.userClub.findFirst({
                    where: {
                        id: { not: clubId }
                    }
                });

                // 2. Si eres el único usuario en la base de datos, creamos el rival al vuelo
                if (!rivalClub) {
                    rivalClub = await this.prisma.userClub.create({
                        data: {
                            name: 'Rival Debug FC',
                            password: '0000',
                            baseTeamSlug: 'occult', // Cambia esto si tu campo obligatorio es otro
                            pp: 1000
                        }
                    });
                }

                const rivalOwned = await this.prisma.player.update({
                    where: { id: player.id },
                    data: { ownerId: rivalClub.id, ...rosterResetData },
                    include: playerWithMovesInclude,
                });
                return formatPlayerWithMoves(rivalOwned);
            }
        }
    }

    async performMarketAction(clubId: string, nickname: string, action: 'buy' | 'toll' | 'sell') {
        // Usamos $transaction para evitar fallos de concurrencia (ej: 2 usuarios comprando a la vez)
        return this.prisma.$transaction(async (tx) => {
            // 1. Obtenemos el club y el jugador actualizados al milisegundo
            const club = await tx.userClub.findUnique({
                where: { id: clubId },
                include: { facilities: true },
            });
            const player = await tx.player.findFirst({ where: { nickname } });

            if (!club) throw new NotFoundException('Club no encontrado');
            if (!player) throw new NotFoundException(`Jugador con nickname '${nickname}' no encontrado`);

            const playerId = player.id;
            const facilities = resolveClubFacilities(formatClubFacilities(club.facilities));

            // 2. Calculamos el precio (El peaje es la mitad del precio base)
            const buyPrice = getFreeMarketPlayerPrice(player.price, facilities);
            const price = action === 'buy' ? buyPrice : Math.floor(player.price / 2);

            // 3. Verificamos el saldo
            if (club.pp < price) {
                throw new BadRequestException(`No tienes suficientes PP. Necesitas ${price}.`);
            }

            // 4. LÓGICA DE COMPRA
            if (action === 'buy') {
                if (player.ownerId) {
                    throw new BadRequestException('Este jugador ya ha sido fichado por otro club.');
                }

                // Restamos PP al comprador
                await tx.userClub.update({
                    where: { id: clubId },
                    data: { pp: { decrement: price } }
                });

                // Le asignamos el jugador y desbloqueamos su nodo en el mapa
                await tx.player.update({
                    where: { id: playerId },
                    data: { ownerId: clubId, isFreeAgent: false, ...rosterResetData },
                });

                const existingUnlock = await tx.unlockedNode.findFirst({
                    where: { userClubId: clubId, playerId }
                });

                if (!existingUnlock) {
                    await tx.unlockedNode.create({
                        data: { userClubId: clubId, playerId }
                    });
                }

                return { success: true, newBalance: club.pp - price };

                // 5. LÓGICA DE PEAJE
            } else if (action === 'toll') {
                if (!player.ownerId || player.ownerId === clubId) {
                    throw new BadRequestException('Acción inválida. Este jugador no es un peaje.');
                }

                // Verificamos que no haya pagado ya este peaje antes
                const alreadyUnlocked = await tx.unlockedNode.findFirst({
                    where: { userClubId: clubId, playerId: playerId }
                });

                if (alreadyUnlocked) {
                    throw new BadRequestException('Ya habías pagado este peaje.');
                }

                // Restamos PP al comprador
                await tx.userClub.update({
                    where: { id: clubId },
                    data: { pp: { decrement: Math.floor(player.price / 2) } }
                });

                // 🎯 Opcional: ¿El dinero del peaje se lo queda el dueño del jugador?
                // Si es así, descomenta esto:
                /*
                await tx.userClub.update({
                  where: { id: player.ownerId },
                  data: { pp: { increment: price } }
                });
                */

                // Registramos que este club ya tiene la llave de este camino
                await tx.unlockedNode.create({
                    data: { userClubId: clubId, playerId: playerId }
                });

                return { success: true, newBalance: club.pp - Math.floor(player.price / 2) };
            }

            else if (action === 'sell') {
                // 1. Verificamos que realmente eres el dueño
                if (player.ownerId !== clubId) {
                    throw new BadRequestException('No puedes vender un jugador que no es tuyo.');
                }

                // 2. Calculamos cuánto le pagamos (Ej: 50% de su valor)
                const sellPrice = Math.floor(player.price / 2);

                // 3. Devolvemos objetos equipados al inventario del club
                await returnEquippedItemsToClub(tx, playerId, clubId);

                // 4. Le sumamos el dinero al club
                await tx.userClub.update({
                    where: { id: clubId },
                    data: { pp: { increment: sellPrice } }
                });

                // 5. Liberamos al jugador para que vaya al Mercado de Agentes Libres
                await tx.player.update({
                    where: { id: playerId },
                    data: { ownerId: null, isFreeAgent: true, ...rosterResetData },
                });

                // 5. CRUCIAL: Mantenemos el nodo abierto para este jugador creando un "peaje" gratuito
                // Así la niebla de guerra no se vuelve a cerrar.
                const existingUnlock = await tx.unlockedNode.findFirst({
                    where: { userClubId: clubId, playerId: playerId }
                });

                if (!existingUnlock) {
                    await tx.unlockedNode.create({
                        data: { userClubId: clubId, playerId: playerId }
                    });
                }

                return { success: true, newBalance: club.pp + sellPrice };
            }
        });
    }

    async getFreeAgents() {
        const players = await this.prisma.player.findMany({
            where: {
                isFreeAgent: true,
                ownerId: null,
            },
            include: playerWithMovesInclude,
            orderBy: {
                price: 'desc',
            },
        });
        return enrichPlayersWithEquipment(players);
    }

    async getFreeCoaches() {
        return this.prisma.coach.findMany({
            where: {
                isFreeAgent: true,
                ownerId: null,
            },
            include: coachWithFormationsInclude,
            orderBy: {
                price: 'desc',
            },
        });
    }

    async buyCoach(clubId: string, coachId: number) {
        return this.prisma.$transaction(async (tx) => {
            const club = await tx.userClub.findUnique({ where: { id: clubId } });
            const coach = await tx.coach.findUnique({ where: { id: coachId } });

            if (!club) throw new NotFoundException('Club no encontrado');
            if (!coach) throw new NotFoundException(`Entrenador con ID ${coachId} no encontrado`);

            if (!coach.isFreeAgent || coach.ownerId) {
                throw new BadRequestException('Este entrenador ya ha sido fichado por otro club.');
            }

            if (club.pp < coach.price) {
                throw new BadRequestException(`No tienes suficientes PP. Necesitas ${coach.price}.`);
            }

            await tx.userClub.update({
                where: { id: clubId },
                data: { pp: { decrement: coach.price } },
            });

            await tx.coach.update({
                where: { id: coachId },
                data: { ownerId: clubId, isFreeAgent: false },
            });

            return { success: true, newBalance: club.pp - coach.price };
        });
    }

    async sellCoach(clubId: string, coachId: number) {
        return this.prisma.$transaction(async (tx) => {
            const club = await tx.userClub.findUnique({ where: { id: clubId } });
            const coach = await tx.coach.findUnique({ where: { id: coachId } });

            if (!club) throw new NotFoundException('Club no encontrado');
            if (!coach) throw new NotFoundException(`Entrenador con ID ${coachId} no encontrado`);

            if (coach.ownerId !== clubId) {
                throw new BadRequestException('No puedes vender un entrenador que no es tuyo.');
            }

            const ownedCoachCount = await tx.coach.count({
                where: { ownerId: clubId },
            });

            if (ownedCoachCount <= 1) {
                throw new BadRequestException(
                    'No puedes liberar a tu único entrenador. Ficha otro antes de vender este.',
                );
            }

            const sellPrice = Math.floor(coach.price / 2);

            await tx.userClub.update({
                where: { id: clubId },
                data: {
                    pp: { increment: sellPrice },
                    ...(club.activeCoachId === coachId ? { activeCoachId: null } : {}),
                },
            });

            await tx.coach.update({
                where: { id: coachId },
                data: { ownerId: null, isFreeAgent: true },
            });

            return { success: true, newBalance: club.pp + sellPrice };
        });
    }

    async getFormationCatalog() {
        const formations = await this.prisma.formation.findMany({
            orderBy: { id: 'asc' },
        });
        return formations.map(formatFormation);
    }

    async getClubFormations(clubId: string): Promise<FormationWithClubStatus[]> {
        const club = await this.prisma.userClub.findUnique({
            where: { id: clubId },
            select: {
                activeFormation11Id: true,
                activeFormation4Id: true,
                formations: { select: { formationId: true } },
                activeCoach: {
                    select: { formations: { select: { id: true } } },
                },
            },
        });

        if (!club) {
            throw new NotFoundException(`El club con ID ${clubId} no existe.`);
        }

        const purchasedIds = new Set(club.formations.map((entry) => entry.formationId));
        const coachFormationIds = new Set(
            (club.activeCoach?.formations ?? []).map((formation) => formation.id),
        );
        const formations = await this.prisma.formation.findMany({
            orderBy: { id: 'asc' },
        });

        return formations.map((formation) => {
            const formatted = formatFormation(formation);
            return {
                ...formatted,
                unlocked: isFormationAvailableToClub(formation, purchasedIds, coachFormationIds),
                unlockedByCoach: coachFormationIds.has(formation.id),
                isActive11: club.activeFormation11Id === formation.id,
                isActive4: club.activeFormation4Id === formation.id,
            };
        });
    }

    async buyFormation(clubId: string, formationId: number): Promise<BuyFormationResult> {
        return this.prisma.$transaction(async (tx) => {
            const club = await tx.userClub.findUnique({ where: { id: clubId } });
            const formation = await tx.formation.findUnique({ where: { id: formationId } });

            if (!club) throw new NotFoundException('Club no encontrado');
            if (!formation) throw new NotFoundException(`Formación con ID ${formationId} no encontrada`);

            const alreadyUnlocked = await tx.clubFormation.findUnique({
                where: { clubId_formationId: { clubId, formationId } },
            });

            if (alreadyUnlocked) {
                throw new BadRequestException('Ya has desbloqueado esta formación.');
            }

            if (club.pp < formation.price) {
                throw new BadRequestException(
                    `No tienes suficientes PP. Necesitas ${formation.price}.`,
                );
            }

            await tx.userClub.update({
                where: { id: clubId },
                data: { pp: { decrement: formation.price } },
            });

            await tx.clubFormation.create({
                data: { clubId, formationId },
            });

            return {
                success: true,
                newBalance: club.pp - formation.price,
                formation: formatFormation(formation),
            };
        });
    }

    async activateFormation(
        clubId: string,
        formationId: number,
    ): Promise<ActivateFormationResult> {
        return this.prisma.$transaction(async (tx) => {
            const club = await tx.userClub.findUnique({
                where: { id: clubId },
                select: {
                    activeFormation11Id: true,
                    activeFormation4Id: true,
                    formations: { select: { formationId: true } },
                    activeCoach: {
                        select: { formations: { select: { id: true } } },
                    },
                },
            });
            const formation = await tx.formation.findUnique({ where: { id: formationId } });

            if (!club) throw new NotFoundException('Club no encontrado');
            if (!formation) throw new NotFoundException(`Formación con ID ${formationId} no encontrada`);

            const purchased = club.formations.some((entry) => entry.formationId === formationId);
            const fromCoach = club.activeCoach?.formations.some((f) => f.id === formationId) ?? false;
            const isDefault = formation.price === 0;

            if (!isDefault && !purchased && !fromCoach) {
                throw new BadRequestException('Debes desbloquear esta formación antes de activarla.');
            }

            if (formation.playerCount === 11) {
                await tx.userClub.update({
                    where: { id: clubId },
                    data: { activeFormation11Id: formationId },
                });

                return {
                    success: true,
                    activeFormation11Id: formationId,
                    activeFormation4Id: club.activeFormation4Id,
                };
            }

            if (formation.playerCount === 4) {
                await tx.userClub.update({
                    where: { id: clubId },
                    data: { activeFormation4Id: formationId },
                });

                return {
                    success: true,
                    activeFormation11Id: club.activeFormation11Id,
                    activeFormation4Id: formationId,
                };
            }

            throw new BadRequestException(
                `La formación debe ser de 4 o 11 jugadores (tiene ${formation.playerCount}).`,
            );
        });
    }

    async updateRoster(clubId: string, roster: RosterPositionUpdate[]) {
        const club = await this.prisma.userClub.findUnique({
            where: { id: clubId },
            include: { roster: { select: { id: true } } },
        });

        if (!club) {
            throw new NotFoundException(`El club con ID ${clubId} no existe.`);
        }

        const clubPlayerIds = new Set(club.roster.map((p) => p.id));

        for (const entry of roster) {
            if (!clubPlayerIds.has(entry.playerId)) {
                throw new BadRequestException(
                    `El jugador ${entry.playerId} no pertenece a este club.`,
                );
            }
        }

        const convocadosCount = roster.filter((entry) => entry.isActiveRoster).length;
        if (convocadosCount > 16) {
            throw new BadRequestException('No puedes convocar más de 16 jugadores.');
        }

        await this.prisma.$transaction(
            roster.map(({ playerId, isActiveRoster, position11, position4 }) =>
                this.prisma.player.update({
                    where: { id: playerId },
                    data: {
                        isActiveRoster,
                        position11: isActiveRoster ? position11 : null,
                        position4: isActiveRoster ? position4 : null,
                    },
                }),
            ),
        );

        return this.getUserClub(clubId);
    }

    async addTransaction(clubId: string, dto: AddTransactionDto) {
        const { amountPP, amountPE, amountYens, amountPC, description } = dto;

        if (amountPP === 0 && amountPE === 0 && amountYens === 0 && amountPC === 0) {
            throw new BadRequestException('Debes modificar al menos un recurso.');
        }

        return this.prisma.$transaction(async (tx) => {
            const club = await tx.userClub.findUnique({ where: { id: clubId } });

            if (!club) {
                throw new NotFoundException(`El club con ID ${clubId} no existe.`);
            }

            const newPp = club.pp + amountPP;
            const newPe = club.pe + amountPE;
            const newYens = club.yens + amountYens;
            const newPc = club.pc + amountPC;

            if (newPp < 0 || newPe < 0 || newYens < 0 || newPc < 0) {
                throw new BadRequestException('El saldo no puede quedar en negativo.');
            }

            await tx.transaction.create({
                data: {
                    clubId,
                    type: 'EXTERNAL',
                    description: description.trim(),
                    amountPP,
                    amountPE,
                    amountYens,
                    amountPC,
                },
            });

            const updatedClub = await tx.userClub.update({
                where: { id: clubId },
                data: {
                    pp: newPp,
                    pe: newPe,
                    yens: newYens,
                    pc: newPc,
                },
                include: clubWithDetailsInclude,
            });

            return formatClubWithRoster(updatedClub);
        });
    }

    async updateUserClub(id: string, updateData: Partial<UserClub>) {
        const existingClub = await this.prisma.userClub.findUnique({
          where: { id },
        });
    
        if (!existingClub) {
          throw new NotFoundException(`El club con ID ${id} no existe.`);
        }
    
        if (updateData.name && updateData.name !== existingClub.name) {
          const nameInUse = await this.prisma.userClub.findUnique({
            where: { name: updateData.name },
          });
    
          if (nameInUse) {
            throw new ConflictException(
              `El nombre "${updateData.name}" ya está siendo utilizado por otro club.`
            );
          }
        }

        const data: {
          name?: string;
          pp?: number;
          baseTeamSlug?: string;
          shieldUrl?: string;
          activeCoachId?: number | null;
        } = {
          name: updateData.name,
          pp: updateData.pp,
          baseTeamSlug: updateData.baseTeamSlug,
          shieldUrl: updateData.shieldUrl,
        };

        if (updateData.activeCoachId !== undefined) {
          if (updateData.activeCoachId === null) {
            data.activeCoachId = null;
          } else {
            const coach = await this.prisma.coach.findFirst({
              where: { id: updateData.activeCoachId, ownerId: id },
            });

            if (!coach) {
              throw new BadRequestException('El entrenador no pertenece a este club.');
            }

            data.activeCoachId = updateData.activeCoachId;
          }
        }
    
        const updatedClub = await this.prisma.userClub.update({
          where: { id },
          data,
          include: clubWithDetailsInclude,
        });

        const formattedClub = formatClubWithRoster(updatedClub);
        const { password: _password, ...clubWithoutPassword } = formattedClub;

        return clubWithoutPassword;
      }

    async previewPeRedemption(clubId: string, allocations: PeAllocationDto[]): Promise<PeRedemptionPreview> {
        const club = await this.prisma.userClub.findUnique({
            where: { id: clubId },
            include: {
                roster: { select: { id: true, name: true, level: true, experience: true } },
                facilities: true,
            },
        });

        if (!club) {
            throw new NotFoundException(`El club con ID ${clubId} no existe.`);
        }

        const xpPerPe = getTrainingPeXpPerPoint(
            PE_XP_PER_POINT,
            resolveClubFacilities(formatClubFacilities(club.facilities)),
        );

        return buildPeRedemptionPreview(allocations, club.roster, club.pe, xpPerPe);
    }

    async redeemPe(clubId: string, allocations: PeAllocationDto[]): Promise<RedeemPeResult> {
        const preview = await this.previewPeRedemption(clubId, allocations);

        if (preview.warnings.some((w) => w.includes('No tienes suficientes PE') || w.includes('no pertenece'))) {
            throw new BadRequestException(preview.warnings.join(' '));
        }

        if (preview.totalPe === 0) {
            throw new BadRequestException('Debes asignar al menos 1 PE.');
        }

        return this.prisma.$transaction(async (tx) => {
            const club = await tx.userClub.findUnique({
                where: { id: clubId },
                include: {
                    roster: { select: { id: true, level: true, experience: true } },
                    facilities: true,
                },
            });

            if (!club) {
                throw new NotFoundException(`El club con ID ${clubId} no existe.`);
            }

            if (club.pe < preview.totalPe) {
                throw new BadRequestException(`No tienes suficientes PE. Disponibles: ${club.pe}.`);
            }

            const xpPerPe = getTrainingPeXpPerPoint(
                PE_XP_PER_POINT,
                resolveClubFacilities(formatClubFacilities(club.facilities)),
            );

            const rosterIds = new Set(club.roster.map((p) => p.id));
            for (const { playerId } of allocations) {
                if (!rosterIds.has(playerId)) {
                    throw new BadRequestException(`El jugador ${playerId} no pertenece a este club.`);
                }
            }

            const peByPlayer = new Map<number, number>();
            for (const { playerId } of allocations) {
                peByPlayer.set(playerId, (peByPlayer.get(playerId) ?? 0) + 1);
            }

            for (const [playerId, peCount] of peByPlayer) {
                const player = club.roster.find((p) => p.id === playerId)!;
                if (player.level >= MAX_PLAYER_LEVEL) continue;

                const xpGained = peCount * xpPerPe;
                const { level, experience } = addExperience(player.level, player.experience, xpGained);

                await tx.player.update({
                    where: { id: playerId },
                    data: { level, experience },
                });
            }

            const playerNames = preview.players.map((p) => p.playerName).join(', ');
            await tx.transaction.create({
                data: {
                    clubId,
                    type: 'INTERNAL',
                    description: `Canje de ${preview.totalPe} PE (+${preview.totalXp} XP) en: ${playerNames}`,
                    amountPE: -preview.totalPe,
                    amountPP: 0,
                    amountYens: 0,
                    amountPC: 0,
                },
            });

            const newPeBalance = club.pe - preview.totalPe;
            await tx.userClub.update({
                where: { id: clubId },
                data: { pe: newPeBalance },
            });

            return {
                success: true as const,
                newPeBalance,
                preview,
            };
        });
    }

    async previewYeRedemption(clubId: string, allocations: YeAllocationDto[]): Promise<YeRedemptionPreview> {
        const club = await this.prisma.userClub.findUnique({
            where: { id: clubId },
            include: { coaches: { select: { id: true, name: true, level: true, experience: true } } },
        });

        if (!club) {
            throw new NotFoundException(`El club con ID ${clubId} no existe.`);
        }

        return buildYeRedemptionPreview(allocations, club.coaches, club.yens, YE_XP_PER_POINT);
    }

    async redeemYe(clubId: string, allocations: YeAllocationDto[]): Promise<RedeemYeResult> {
        const preview = await this.previewYeRedemption(clubId, allocations);

        if (preview.warnings.some((w) => w.includes('No tienes suficientes YE') || w.includes('no pertenece'))) {
            throw new BadRequestException(preview.warnings.join(' '));
        }

        if (preview.totalYe === 0) {
            throw new BadRequestException('Debes asignar al menos 1 YE.');
        }

        return this.prisma.$transaction(async (tx) => {
            const club = await tx.userClub.findUnique({
                where: { id: clubId },
                include: { coaches: { select: { id: true, level: true, experience: true } } },
            });

            if (!club) {
                throw new NotFoundException(`El club con ID ${clubId} no existe.`);
            }

            if (club.yens < preview.totalYe) {
                throw new BadRequestException(`No tienes suficientes YE. Disponibles: ${club.yens}.`);
            }

            const coachIds = new Set(club.coaches.map((c) => c.id));
            for (const { coachId } of allocations) {
                if (!coachIds.has(coachId)) {
                    throw new BadRequestException(`El entrenador ${coachId} no pertenece a este club.`);
                }
            }

            const yeByCoach = new Map<number, number>();
            for (const { coachId } of allocations) {
                yeByCoach.set(coachId, (yeByCoach.get(coachId) ?? 0) + 1);
            }

            for (const [coachId, yeCount] of yeByCoach) {
                const coach = club.coaches.find((c) => c.id === coachId)!;
                if (coach.level >= MAX_COACH_LEVEL) continue;

                const xpGained = yeCount * YE_XP_PER_POINT;
                const { level, experience } = addExperience(
                    coach.level,
                    coach.experience,
                    xpGained,
                    MAX_COACH_LEVEL,
                );

                await tx.coach.update({
                    where: { id: coachId },
                    data: { level, experience },
                });
            }

            const coachNames = preview.coaches.map((c) => c.coachName).join(', ');
            await tx.transaction.create({
                data: {
                    clubId,
                    type: 'INTERNAL',
                    description: `Canje de ${preview.totalYe} YE (+${preview.totalXp} XP) en: ${coachNames}`,
                    amountPE: 0,
                    amountPP: 0,
                    amountYens: -preview.totalYe,
                    amountPC: 0,
                },
            });

            const newYeBalance = club.yens - preview.totalYe;
            await tx.userClub.update({
                where: { id: clubId },
                data: { yens: newYeBalance },
            });

            return {
                success: true as const,
                newYeBalance,
                preview,
            };
        });
    }

    async spendPc(clubId: string, playerId: number, statKey: StatKey): Promise<SpendPcResult> {
        if (!STAT_KEYS.includes(statKey)) {
            throw new BadRequestException(`Stat inválida: ${statKey}`);
        }

        const club = await this.prisma.userClub.findUnique({
            where: { id: clubId },
            include: {
                roster: {
                    select: { id: true, name: true, statBonuses: true },
                },
            },
        });

        if (!club) {
            throw new NotFoundException(`El club con ID ${clubId} no existe.`);
        }

        const player = club.roster.find((p) => p.id === playerId);
        if (!player) {
            throw new BadRequestException(`El jugador ${playerId} no pertenece a este club.`);
        }

        const currentBonuses = parseStatBonuses(player.statBonuses);
        const preview = buildSpendPcPreview(
            playerId,
            statKey,
            club.roster,
            club.pc,
            currentBonuses,
            PC_COST_PER_STAT,
        );

        if (preview.warnings.length > 0) {
            throw new BadRequestException(preview.warnings.join(' '));
        }

        const newBonuses = mergeStatBonus(currentBonuses, statKey);

        return this.prisma.$transaction(async (tx) => {
            const freshClub = await tx.userClub.findUnique({ where: { id: clubId } });
            if (!freshClub || freshClub.pc < PC_COST_PER_STAT) {
                throw new BadRequestException(`No tienes suficientes PC. Disponibles: ${freshClub?.pc ?? 0}.`);
            }

            const freshPlayer = await tx.player.findFirst({
                where: { id: playerId, ownerId: clubId },
            });
            if (!freshPlayer) {
                throw new BadRequestException(`El jugador ${playerId} no pertenece a este club.`);
            }

            await tx.player.update({
                where: { id: playerId },
                data: { statBonuses: newBonuses as Prisma.InputJsonValue },
            });

            const statLabels: Record<StatKey, string> = {
                gp: 'GP',
                tp: 'TP',
                kick: 'Tiro',
                body: 'Físico',
                control: 'Control',
                guard: 'Defensa',
                speed: 'Velocidad',
                stamina: 'Resistencia',
                guts: 'Determinación',
            };

            await tx.transaction.create({
                data: {
                    clubId,
                    type: 'INTERNAL',
                    description: `Mejora permanente +1 ${statLabels[statKey]} en ${player.name}`,
                    amountPC: -PC_COST_PER_STAT,
                    amountPP: 0,
                    amountPE: 0,
                    amountYens: 0,
                },
            });

            const newPcBalance = freshClub.pc - PC_COST_PER_STAT;
            await tx.userClub.update({
                where: { id: clubId },
                data: { pc: newPcBalance },
            });

            return {
                success: true as const,
                newPcBalance,
                statBonuses: newBonuses,
                statKey,
                newStatValue: preview.newBonus,
            };
        });
    }

    async getItemCatalog() {
        const items = await this.prisma.item.findMany({
            orderBy: [{ type: 'asc' }, { price: 'asc' }],
        });
        return items.map(formatItem);
    }

    async getClubItems(clubId: string) {
        const club = await this.prisma.userClub.findUnique({ where: { id: clubId } });
        if (!club) throw new NotFoundException('Club no encontrado');

        const items = await this.prisma.clubItem.findMany({
            where: { clubId, quantity: { gt: 0 } },
            include: { item: true },
            orderBy: { item: { name: 'asc' } },
        });
        return formatClubItems(items);
    }

    async buyItem(clubId: string, itemId: number): Promise<BuyItemResult> {
        return this.prisma.$transaction(async (tx) => {
            const club = await tx.userClub.findUnique({
                where: { id: clubId },
                include: { facilities: true },
            });
            const item = await tx.item.findUnique({ where: { id: itemId } });

            if (!club) throw new NotFoundException('Club no encontrado');
            if (!item) throw new NotFoundException(`Objeto con ID ${itemId} no encontrado`);

            const facilities = resolveClubFacilities(formatClubFacilities(club.facilities));
            const price = getShopItemPrice(item.price, facilities);

            if (club.pp < price) {
                throw new BadRequestException(`No tienes suficientes PP. Necesitas ${price}.`);
            }

            await tx.userClub.update({
                where: { id: clubId },
                data: { pp: { decrement: price } },
            });

            const clubItem = await tx.clubItem.upsert({
                where: { clubId_itemId: { clubId, itemId } },
                create: { clubId, itemId, quantity: 1 },
                update: { quantity: { increment: 1 } },
            });

            return {
                success: true,
                newBalance: club.pp - price,
                quantity: clubItem.quantity,
            };
        });
    }

    async equipItem(clubId: string, dto: EquipItemDto) {
        return this.prisma.$transaction(async (tx) => {
            const player = await tx.player.findUnique({ where: { id: dto.playerId } });
            if (!player) throw new NotFoundException('Jugador no encontrado');
            if (player.ownerId !== clubId) {
                throw new BadRequestException('Este jugador no pertenece a tu club.');
            }

            const slotField = dto.slot === 'primary' ? 'primaryItemId' : 'secondaryItemId';
            const currentItemId = player[slotField];

            if (dto.itemId == null) {
                if (currentItemId != null) {
                    await tx.clubItem.upsert({
                        where: { clubId_itemId: { clubId, itemId: currentItemId } },
                        create: { clubId, itemId: currentItemId, quantity: 1 },
                        update: { quantity: { increment: 1 } },
                    });
                    await tx.player.update({
                        where: { id: dto.playerId },
                        data: { [slotField]: null },
                    });
                }
                return { success: true };
            }

            const item = await tx.item.findUnique({ where: { id: dto.itemId } });
            if (!item) throw new NotFoundException('Objeto no encontrado');

            if (dto.slot === 'primary' && !canEquipPrimaryItem(player, item)) {
                throw new BadRequestException(
                    `Este jugador no puede equipar ${item.type} como objeto principal.`,
                );
            }
            if (dto.slot === 'secondary' && !isSecondaryItemType(item.type)) {
                throw new BadRequestException('El objeto secundario debe ser pulsera o colgante.');
            }

            const clubItem = await tx.clubItem.findUnique({
                where: { clubId_itemId: { clubId, itemId: dto.itemId } },
            });
            if (!clubItem || clubItem.quantity < 1) {
                throw new BadRequestException('No tienes este objeto en el inventario.');
            }

            if (currentItemId === dto.itemId) {
                return { success: true };
            }

            if (currentItemId != null) {
                await tx.clubItem.upsert({
                    where: { clubId_itemId: { clubId, itemId: currentItemId } },
                    create: { clubId, itemId: currentItemId, quantity: 1 },
                    update: { quantity: { increment: 1 } },
                });
            }

            await tx.clubItem.update({
                where: { clubId_itemId: { clubId, itemId: dto.itemId } },
                data: { quantity: { decrement: 1 } },
            });

            await tx.player.update({
                where: { id: dto.playerId },
                data: { [slotField]: dto.itemId },
            });

            return { success: true };
        });
    }

    async getConsumableCatalog() {
        const consumables = await this.prisma.consumable.findMany({
            orderBy: [{ category: 'asc' }, { effectValue: 'asc' }],
        });
        return consumables.map(formatConsumable);
    }

    async getClubConsumables(clubId: string) {
        const club = await this.prisma.userClub.findUnique({ where: { id: clubId } });
        if (!club) throw new NotFoundException('Club no encontrado');

        const consumables = await this.prisma.clubConsumable.findMany({
            where: { clubId, quantity: { gt: 0 } },
            include: { consumable: true },
            orderBy: { consumable: { name: 'asc' } },
        });
        return formatClubConsumables(consumables);
    }

    async buyConsumable(clubId: string, consumableId: number): Promise<BuyConsumableResult> {
        return this.prisma.$transaction(async (tx) => {
            const club = await tx.userClub.findUnique({ where: { id: clubId } });
            const consumable = await tx.consumable.findUnique({ where: { id: consumableId } });

            if (!club) throw new NotFoundException('Club no encontrado');
            if (!consumable) throw new NotFoundException(`Consumible con ID ${consumableId} no encontrado`);

            if (club.pp < consumable.price) {
                throw new BadRequestException(`No tienes suficientes PP. Necesitas ${consumable.price}.`);
            }

            await tx.userClub.update({
                where: { id: clubId },
                data: { pp: { decrement: consumable.price } },
            });

            const clubConsumable = await tx.clubConsumable.upsert({
                where: { clubId_consumableId: { clubId, consumableId } },
                create: { clubId, consumableId, quantity: 1 },
                update: { quantity: { increment: 1 } },
            });

            return {
                success: true,
                newBalance: club.pp - consumable.price,
                quantity: clubConsumable.quantity,
            };
        });
    }

    private async ensureClubFacilities(clubId: string) {
        const existing = await this.prisma.clubFacility.findMany({ where: { clubId } });
        const existingTypes = new Set(existing.map((f) => f.facility));

        const missing = ALL_FACILITY_TYPES.filter((type) => !existingTypes.has(type));
        if (missing.length === 0) return existing;

        await this.prisma.clubFacility.createMany({
            data: missing.map((facility) => ({
                clubId,
                facility,
                level: DEFAULT_FACILITY_LEVELS[facility],
            })),
        });

        return this.prisma.clubFacility.findMany({ where: { clubId } });
    }

    async getSportsCity(clubId: string): Promise<ClubSportsCity> {
        const club = await this.prisma.userClub.findUnique({ where: { id: clubId } });
        if (!club) throw new NotFoundException('Club no encontrado');

        const raw = await this.ensureClubFacilities(clubId);
        return {
            clubId,
            facilities: formatClubFacilities(raw),
        };
    }

    async getAllSportsCities(): Promise<Array<ClubSportsCity & { clubName: string }>> {
        const clubs = await this.prisma.userClub.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        });

        const results: Array<ClubSportsCity & { clubName: string }> = [];
        for (const club of clubs) {
            const raw = await this.ensureClubFacilities(club.id);
            results.push({
                clubId: club.id,
                clubName: club.name,
                facilities: formatClubFacilities(raw),
            });
        }
        return results;
    }

    async startFacilityUpgrade(
        clubId: string,
        facilityId: FacilityId,
    ): Promise<StartFacilityUpgradeResult> {
        return this.prisma.$transaction(async (tx) => {
            const club = await tx.userClub.findUnique({ where: { id: clubId } });
            if (!club) throw new NotFoundException('Club no encontrado');

            await this.ensureClubFacilities(clubId);

            const prismaType = facilityIdToPrisma(facilityId);
            const facility = await tx.clubFacility.findUnique({
                where: { clubId_facility: { clubId, facility: prismaType } },
            });

            if (!facility) throw new NotFoundException('Instalación no encontrada');

            if (facility.upgradingTo != null) {
                throw new BadRequestException('Esta instalación ya está en construcción.');
            }

            const currentLevel = facility.level as FacilityLevel;
            if (currentLevel >= 3) {
                throw new BadRequestException('La instalación ya está al nivel máximo.');
            }

            const cost = getUpgradeCost(currentLevel);
            if (cost == null) {
                throw new BadRequestException('No se puede mejorar más esta instalación.');
            }

            if (club.pp < cost) {
                throw new BadRequestException(`No tienes suficientes PP. Necesitas ${cost}.`);
            }

            const targetLevel = (currentLevel + 1) as FacilityLevel;

            await tx.userClub.update({
                where: { id: clubId },
                data: { pp: { decrement: cost } },
            });

            await tx.transaction.create({
                data: {
                    clubId,
                    description: `Obra: ${FACILITY_LABELS[facilityId]} → Nv.${targetLevel}`,
                    amountPP: -cost,
                },
            });

            const updated = await tx.clubFacility.update({
                where: { clubId_facility: { clubId, facility: prismaType } },
                data: { upgradingTo: targetLevel },
            });

            return {
                success: true,
                facility: formatClubFacility(updated),
                newBalance: club.pp - cost,
            };
        });
    }

    async adminUpdateFacility(
        clubId: string,
        facilityId: FacilityId,
        options: { level?: number; approveConstruction?: boolean },
    ): Promise<ApproveFacilityResult & { facility: ClubFacilityRecord }> {
        return this.prisma.$transaction(async (tx) => {
            const club = await tx.userClub.findUnique({ where: { id: clubId } });
            if (!club) throw new NotFoundException('Club no encontrado');

            await this.ensureClubFacilities(clubId);

            const prismaType = facilityIdToPrisma(facilityId);
            const facility = await tx.clubFacility.findUnique({
                where: { clubId_facility: { clubId, facility: prismaType } },
            });

            if (!facility) throw new NotFoundException('Instalación no encontrada');

            const data: { level?: number; upgradingTo?: number | null } = {};

            if (options.approveConstruction) {
                if (facility.upgradingTo == null) {
                    throw new BadRequestException('No hay obra pendiente en esta instalación.');
                }
                data.level = facility.upgradingTo;
                data.upgradingTo = null;
            }

            if (options.level !== undefined) {
                if (options.level < 0 || options.level > 3) {
                    throw new BadRequestException('El nivel debe estar entre 0 y 3.');
                }
                data.level = options.level;
                if (!options.approveConstruction) {
                    data.upgradingTo = null;
                }
            }

            if (Object.keys(data).length === 0) {
                throw new BadRequestException('No se especificó ningún cambio.');
            }

            const updated = await tx.clubFacility.update({
                where: { clubId_facility: { clubId, facility: prismaType } },
                data,
            });

            return {
                success: true,
                facility: formatClubFacility(updated),
            };
        });
    }

    async setPitchElement(
        clubId: string,
        pitchElement: string,
    ): Promise<SetPitchElementResult> {
        return this.prisma.$transaction(async (tx) => {
            const club = await tx.userClub.findUnique({ where: { id: clubId } });
            if (!club) throw new NotFoundException('Club no encontrado');

            await this.ensureClubFacilities(clubId);

            const facility = await tx.clubFacility.findUnique({
                where: {
                    clubId_facility: { clubId, facility: facilityIdToPrisma('field') },
                },
            });

            if (!facility) throw new NotFoundException('Terreno de juego no encontrado');

            if (facility.level < 2) {
                throw new BadRequestException(
                    'Necesitas el Terreno de Juego en nivel 2 o superior para elegir un elemento.',
                );
            }

            const updated = await tx.clubFacility.update({
                where: {
                    clubId_facility: { clubId, facility: facilityIdToPrisma('field') },
                },
                data: { pitchElement },
            });

            return {
                success: true,
                facility: formatClubFacility(updated),
            };
        });
    }
}
