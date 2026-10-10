import { create } from 'zustand'
import { db, ensureDefaultProfile, type GachaStorageRow } from '../db'
import { BASE_UPGRADES, getAccountingMultiplier, getBaseUpgradeCost, getEnergyCapBonus, type BaseUpgradeId } from '../data/baseUpgrades'
import { BATTLE_ITEMS, MAX_BATTLE_ITEMS_PER_BATTLE } from '../data/battleItems'
import { MISSIONS, getDateKey, type MissionMetric } from '../data/missions'
import { GAMATOTO_EXPEDITION_OPTIONS, isExpeditionReady, type GamatotoExpedition } from '../data/gamatoto'
import {
  CANNON_HEAD_OPTIONS,
  OTOTO_BUILDINGS,
  isConstructionReady as isOtotoConstructionReady,
  type CannonHeadEffect,
  type OtotoBuildingId,
  type OtotoBuildings,
  type OtotoConstruction,
} from '../data/ototoCorps'
import {
  MAX_TALENT_POINTS,
  getTalentPointCost,
  isTalentEligible,
  type CatTalents,
} from '../data/talents'
import { EVOLUTION_ITEM_PRICE, getBattleItemPrice } from '../data/shop'
import type { ClassificationType, EffectType } from '../engine/types'
import { CATS } from '../data/cats'
import { getAllTreasureIds, resolveLevel } from '../data/events'
import { LEVELS } from '../data/levels'
import { findArcByLevelId, SAGA_ARCS } from '../data/sagaArcs'
import { TREASURE_SETS } from '../data/treasureSets'
import { USER_RANK_THRESHOLDS } from '../data/userRankThresholds'
import { computeMissionEnergyMax, computeRecoveredEnergy, computeRegenPerSecond } from '../data/missionEnergy'
import { getCompletedCombos } from '../data/catCombos'
import type { TreasureSetPassiveBonus } from '../data/treasureSets'
import type { CatComboBonus } from '../data/catCombos'
import {
  GACHA_BANNERS,
  GACHA_CAPSULE_EXCHANGE_VALUE,
  GACHA_MULTI_ROLL_COST,
  GACHA_MULTI_ROLL_COUNT,
  GACHA_SINGLE_ROLL_COST,
  rollMany,
  rollOne,
  type GachaRollResult,
} from '../data/gacha'

interface OwnedCatMeta {
  level: number
  experienceInvested: number
  /** specs/010-evolucion-de-gatos. */
  evolutionStage: 'Base' | 'Second' | 'True'
  /** specs/024-sistema-gacha (FR-007). Ausente/0 = sin cápsulas duplicadas activadas todavía. */
  plusLevel?: number
  /** specs/036-talentos-orbes. Ausente = sin talentos invertidos todavía. */
  talents?: CatTalents
}

interface MetaSettings {
  musicVolume: number
  sfxVolume: number
  language: string
}

interface MissionEnergyState {
  current: number
  max: number
  /** specs/029-pulido-batalla-hud (US4). Mismo valor ya calculado por `computeRegenPerSecond` en `hydrate()`/`upgradeCat()` — antes descartado tras usarse, ahora expuesto para el countdown del Hub. */
  regenPerSecond: number
  /** specs/029-pulido-batalla-hud (US4). Mismo timestamp ya persistido en la tabla Dexie `missionEnergy` — expuesto en el estado reactivo para poder extrapolar el countdown sin volver a leer Dexie. */
  lastUpdatedAt: number
}

interface MetaState {
  isHydrated: boolean
  currency: number
  highestUnlockedLevelIndex: number
  completedLevelIds: string[]
  ownedCats: Record<string, OwnedCatMeta>
  settings: MetaSettings
  activeTeamCatIds: string[]
  missionEnergy: MissionEnergyState
  /** specs/010-evolucion-de-gatos. Cantidad de ítem de evolución por catId. */
  evolutionItems: Record<string, number>
  /** specs/012-saga-imperio-de-los-gatos. */
  obtainedTreasureIds: string[]
  /** specs/012-saga-imperio-de-los-gatos (FR-015). Arcos cuya recompensa de finalización ya fue otorgada. */
  grantedArcRewardIds: string[]
  /** specs/013-escalado-capitulos-sets-tesoros (FR-008). Sets de tesoros cuya bonificación pasiva ya fue otorgada. */
  grantedTreasureSetIds: string[]
  /** specs/017-objetos-de-batalla (FR-005). Persistido — cantidad en inventario por `BattleItem.id`. */
  battleItemInventory: Record<string, number>
  /** specs/017-objetos-de-batalla (plan.md Key Design Decision 1). Selección pendiente, efímera de sesión — NO persistida en Dexie. */
  selectedBattleItemIds: string[]
  /** specs/017-objetos-de-batalla (plan.md Key Design Decision 4). `true` si la batalla en curso consumió "Radar de Tesoro". */
  pendingTreasureRadar: boolean
  /** specs/018-bibliotecas-consulta (FR-003/004/005). `catId` de enemigos que ya aparecieron en el carril en alguna batalla. */
  encounteredEnemyCatIds: string[]
  /** specs/019-rango-de-usuario (FR-007). Monótono — un umbral reclamado nunca vuelve a quedar disponible. */
  claimedRankThresholds: number[]
  /** specs/024-sistema-gacha (FR-018). Moneda de gacha — separada de `currency`, se gana jugando, nunca se compra. */
  gachaCurrency: number
  /** specs/024-sistema-gacha (FR-009). Moneda de progresión secundaria — solo por intercambio de cápsulas Megarraro/Legendario. */
  npCurrency: number
  /** specs/024-sistema-gacha (FR-005). Cápsulas de gacha sin activar, pendientes en el Almacén. */
  gachaStorage: GachaStorageRow[]
  /** specs/026-navegacion-hub-mockup (FR-009). Monótono — un id de NewsEntry leído nunca vuelve a "no leído". */
  readNewsIds: string[]
  /** specs/031-mejoras-de-base. Nivel actual por mejora de cuenta — ausente = 0 al leer. */
  baseUpgrades: Partial<Record<BaseUpgradeId, number>>
  /** specs/033-misiones-catnip-challenges. Contador acumulado hoy por métrica — ausente = 0, sin recorte interno. */
  missionProgress: Partial<Record<MissionMetric, number>>
  /** specs/033-misiones-catnip-challenges. Ids de `MissionDefinition` ya reclamados hoy. */
  claimedMissionIds: string[]
  /** specs/033-misiones-catnip-challenges (FR-006). `getDateKey` de la última vez que se tocó el progreso. */
  missionsResetDateKey: string
  /** specs/034-gamatoto. `null` = sin expedición en curso — el progreso se deriva de `startedAtMs`, nunca de un remanente persistido. */
  gamatotoExpedition: GamatotoExpedition | null
  /** specs/034-gamatoto. Contador de cuenta — primer consumidor: specs/035-ototo-corps. */
  gamatotoMaterials: number
  /** specs/035-ototo-corps. `null` = sin construcción en curso. */
  ototoConstruction: OtotoConstruction | null
  /** specs/035-ototo-corps. Elección activa por categoría — ausente = esa construcción nunca se completó. */
  ototoBuildings: OtotoBuildings

  hydrate: () => Promise<void>
  addCurrency: (amount: number) => void
  spendCurrency: (amount: number) => boolean
  unlockNextLevel: () => void
  markLevelCompleted: (levelId: string) => void
  addOwnedCat: (catId: string) => void
  upgradeCat: (catId: string) => boolean
  updateSettings: (partial: Partial<MetaSettings>) => void
  setActiveTeam: (catIds: string[]) => boolean
  spendMissionEnergy: (levelId: string) => boolean
  evolveCat: (catId: string) => boolean
  grantLevelRewards: (levelId: string) => void
  claimArcRewardsIfComplete: (arcId: string) => void
  isZombieModeAvailable: (levelId: string) => boolean
  checkTreasureSetCompletion: () => void
  getActiveBonusMultiplier: (type: TreasureSetPassiveBonus['type']) => number
  /** specs/025-cat-combos (FR-002/FR-004/FR-009). Deriva de activeTeamCatIds en cada llamada — sin campo de
   * estado propio ni persistencia (a diferencia de getActiveBonusMultiplier/grantedTreasureSetIds). */
  getActiveComboBonusMultiplier: (type: CatComboBonus['type']) => number
  /** specs/031-mejoras-de-base (US1). Mismo patrón que `upgradeCat` — valida tope de nivel y costo, descuenta `currency`, persiste. */
  upgradeBaseUpgrade: (id: BaseUpgradeId) => boolean
  /** specs/031-mejoras-de-base (US3). Factor adicional para la moneda de victoria, combinado con `getActiveBonusMultiplier`/`getActiveComboBonusMultiplier`. */
  getBaseUpgradeCurrencyMultiplier: () => number
  /** specs/033-misiones-catnip-challenges (US2). Aplica el reinicio diario si corresponde, luego suma `amount` al contador de `metric`. */
  recordMissionProgress: (metric: MissionMetric, amount: number) => void
  /** specs/033-misiones-catnip-challenges (US1). `false` si la misión no existe, ya fue reclamada hoy, o su progreso no alcanza el objetivo. */
  claimMission: (missionId: string) => boolean
  /** specs/034-gamatoto (US1). `false` si ya hay una expedición activa o `optionId` no existe en el catálogo. */
  startGamatotoExpedition: (optionId: string) => boolean
  /** specs/034-gamatoto (US3). `false` si no hay expedición o todavía no está lista. */
  claimGamatotoExpedition: () => boolean
  /** specs/035-ototo-corps (US1/US2). `false` si ya hay una construcción en curso o `gamatotoMaterials` insuficientes. */
  startOtotoConstruction: (building: OtotoBuildingId, choice: string) => boolean
  /** specs/035-ototo-corps (US1/US2). `false` si no hay construcción o todavía no está lista. */
  claimOtotoConstruction: () => boolean
  /** specs/036-talentos-orbes (US1/FR-004/FR-005). `false` = gato no elegible, elección distinta ya fijada, NP insuficiente, o pista al máximo. */
  investDebuffResistanceTalent: (catId: string, effect: EffectType) => boolean
  /** specs/036-talentos-orbes (US2/FR-006). `false` = gato no elegible, NP insuficiente, o ese contador al máximo. */
  investStatBoostTalent: (catId: string, stat: 'hp' | 'damage') => boolean
  /** specs/036-talentos-orbes (US3/FR-004/FR-007). `false` = gato no elegible, rasgo distinto ya fijado, NP insuficiente, o pista al máximo. */
  investOrbTalent: (catId: string, classification: ClassificationType) => boolean
  selectBattleItem: (itemId: string) => boolean
  deselectBattleItem: (itemId: string) => void
  consumeSelectedBattleItems: () => { speedMultiplier: number; energyBonus: number }
  grantRandomUnownedTreasure: (random?: () => number) => void
  clearPendingTreasureRadar: () => void
  recordEncounteredEnemy: (catId: string) => void
  claimRankThreshold: (rank: number) => boolean
  /**
   * specs/024-sistema-gacha (FR-001/FR-004/FR-005). `null` = saldo insuficiente, sin efecto. Async — a diferencia
   * del resto de acciones de este store, `gachaStorage` usa clave autoincremental de Dexie (`++id`), que solo se
   * conoce tras resolver la escritura (research.md Decisión 5); el resto del estado se actualiza igual de inmediato.
   */
  rollGachaSingle: (bannerId: string) => Promise<GachaRollResult | null>
  /** specs/024-sistema-gacha (FR-002/FR-004). `null` = saldo insuficiente, sin efecto. Async — mismo motivo que rollGachaSingle. */
  rollGachaMulti: (bannerId: string) => Promise<GachaRollResult[] | null>
  /** specs/024-sistema-gacha (FR-006/FR-007). Nuevo → addOwnedCat; ya poseído → +1 plusLevel. */
  activateCapsule: (storageRowId: number) => Promise<void>
  /** specs/024-sistema-gacha (FR-008). Retira la cápsula, suma a `currency` (alias de "XP", research.md Decisión 1). */
  exchangeCapsuleForXp: (storageRowId: number) => Promise<void>
  /** specs/024-sistema-gacha (FR-009). Solo cápsulas Megarraro/Legendario — `false` sin efecto si la rareza no califica. */
  exchangeCapsuleForNp: (storageRowId: number) => Promise<boolean>
  /** specs/026-navegacion-hub-mockup (FR-009). Idempotente — agregar un id ya presente no lo duplica. */
  markNewsRead: (id: string) => Promise<void>
  /** specs/037-tienda (US1/FR-003). `false` = moneda insuficiente (incluye ids desconocidos, precio 0 tratado como insuficiente). */
  purchaseBattleItem: (itemId: string) => boolean
  /** specs/037-tienda (US2/FR-006). `false` = gato no elegible (sin Forma Verdadera definida, ya alcanzada, o ya en el tope de ítems) o moneda insuficiente. */
  purchaseEvolutionItem: (catId: string) => boolean
}

const DEFAULT_SETTINGS: MetaSettings = { musicVolume: 1, sfxVolume: 1, language: 'es' }

/** specs/023-mapa-de-etapas-visual (FR-014/FR-016). Tope del mockup: grilla de despliegue de `repeat(6,1fr)`.
 * Acota únicamente cuántas unidades del equipo se muestran/despliegan a la vez en batalla (`DeployBar`) — no
 * el tamaño del equipo equipable en sí, ver `MAX_TEAM_ROSTER_SIZE`. */
export const MAX_ACTIVE_TEAM_SIZE = 6

/** specs/022-datos-semilla-flujo-navegacion (FR-008): equipo equipable de 5 a 10 unidades. Corrige una
 * contradicción detectada tras specs/023: `setActiveTeam`/`TeamScreen` habían quedado acotados a
 * `MAX_ACTIVE_TEAM_SIZE` (6, un límite de la grilla de despliegue en batalla, no del roster equipable). */
export const MAX_TEAM_ROSTER_SIZE = 10

/** Costo de mejora provisional, no balanceado (tasks.md Fase 1). */
const upgradeCost = (currentLevel: number) => currentLevel * 100

/** specs/012-saga-imperio-de-los-gatos (FR-017). 10 por defecto; 20 una vez otorgada la recompensa del segundo arco de la saga. */
const UPGRADE_CAP_BASE = 10
const UPGRADE_CAP_EXTENDED = 20

/**
 * Nivel de personaje agregado ("Rango de Usuario", specs/019-rango-de-usuario FR-001) — única fuente de este
 * cálculo, exportada para que `UpgradeScreen` deje de mantener su propia copia (plan.md Key Design Decision 1).
 */
export const characterLevelOf = (ownedCats: Record<string, OwnedCatMeta>) =>
  Object.values(ownedCats).reduce((sum, cat) => sum + cat.level + (cat.plusLevel ?? 0), 0)

/**
 * specs/024-sistema-gacha (FR-007, research.md Decisión 3). Formato "20+10" del manual técnico § 5.7 —
 * único punto de esta cadena, reutilizado por CatGuideScreen/UpgradeScreen.
 */
export const formatCatLevel = (owned: OwnedCatMeta) =>
  owned.plusLevel ? `${owned.level}+${owned.plusLevel}` : `${owned.level}`

export const useMetaStore = create<MetaState>((set, get) => ({
  isHydrated: false,
  currency: 0,
  highestUnlockedLevelIndex: 0,
  completedLevelIds: [],
  ownedCats: {},
  settings: DEFAULT_SETTINGS,
  activeTeamCatIds: [],
  missionEnergy: { current: 0, max: 0, regenPerSecond: 0, lastUpdatedAt: 0 },
  evolutionItems: {},
  obtainedTreasureIds: [],
  grantedArcRewardIds: [],
  grantedTreasureSetIds: [],
  battleItemInventory: {},
  selectedBattleItemIds: [],
  pendingTreasureRadar: false,
  encounteredEnemyCatIds: [],
  claimedRankThresholds: [],
  gachaCurrency: 0,
  npCurrency: 0,
  gachaStorage: [],
  readNewsIds: [],
  baseUpgrades: {} as Partial<Record<BaseUpgradeId, number>>,
  missionProgress: {} as Partial<Record<MissionMetric, number>>,
  claimedMissionIds: [] as string[],
  missionsResetDateKey: '',
  gamatotoExpedition: null as GamatotoExpedition | null,
  gamatotoMaterials: 0,
  ototoConstruction: null as OtotoConstruction | null,
  ototoBuildings: {} as OtotoBuildings,

  hydrate: async () => {
    await ensureDefaultProfile()
    const [
      profile,
      settings,
      ownedCatRows,
      levelRows,
      teamFormation,
      missionEnergyRow,
      evolutionItemsRow,
      treasuresRow,
      arcProgressRow,
      treasureSetBonusesRow,
      battleItemsRow,
      encounteredEnemiesRow,
      userRankRow,
      gachaStorage,
      newsReadRow,
      baseUpgradesRow,
      missionsRow,
      gamatotoRow,
      ototoCorpsRow,
    ] = await Promise.all([
      db.playerProfile.get(1),
      db.settings.get(1),
      db.ownedCats.toArray(),
      db.levelProgress.toArray(),
      db.teamFormation.get(1),
      db.missionEnergy.get(1),
      db.evolutionItems.get(1),
      db.treasures.get(1),
      db.arcProgress.get(1),
      db.treasureSetBonuses.get(1),
      db.battleItems.get(1),
      db.encounteredEnemies.get(1),
      db.userRank.get(1),
      db.gachaStorage.toArray(),
      db.newsRead.get(1),
      db.baseUpgrades.get(1),
      db.missions.get(1),
      db.gamatoto.get(1),
      db.ototoCorps.get(1),
    ])

    const baseUpgrades = baseUpgradesRow?.levels ?? ({} as Partial<Record<BaseUpgradeId, number>>)

    // specs/033-misiones-catnip-challenges (FR-006): fila ausente = primera vez, se trata como "hoy" sin
    // progreso; una fila con resetDateKey de un día distinto a hoy también se descarta aquí (mismo criterio
    // de reinicio que recordMissionProgress/claimMission — research.md Decisión 2).
    const todayKey = getDateKey(Date.now())
    const missionsUpToDate = missionsRow?.resetDateKey === todayKey
    const missionProgress = missionsUpToDate ? (missionsRow?.progress ?? {}) : ({} as Partial<Record<MissionMetric, number>>)
    const claimedMissionIds = missionsUpToDate ? (missionsRow?.claimedMissionIds ?? []) : []
    if (!missionsUpToDate) void db.missions.put({ id: 1, resetDateKey: todayKey, progress: {}, claimedMissionIds: [] })

    const ownedCats = Object.fromEntries(
      ownedCatRows.map((row) => [
        row.catId,
        {
          level: row.level,
          experienceInvested: row.experienceInvested,
          evolutionStage: row.evolutionStage ?? 'Base',
          plusLevel: row.plusLevel ?? 0,
          talents: row.talents,
        },
      ]),
    )
    const characterLevel = characterLevelOf(ownedCats)
    // specs/031-mejoras-de-base (US3/FR-010): bono fijo de la mejora "Energía", sumado al máximo ya derivado del nivel de personaje.
    const max = computeMissionEnergyMax(characterLevel) + getEnergyCapBonus(baseUpgrades.energyCap ?? 0)
    const regenPerSecond = computeRegenPerSecond(characterLevel)
    const now = Date.now()
    // Fila ausente/ilegible se trata como ausencia de progreso: energía al máximo (FR-010).
    const current = missionEnergyRow
      ? computeRecoveredEnergy(
          { current: missionEnergyRow.current, lastUpdatedAt: missionEnergyRow.lastUpdatedAt },
          max,
          regenPerSecond,
          now,
        )
      : max

    set({
      isHydrated: true,
      currency: profile?.currency ?? 0,
      highestUnlockedLevelIndex: profile?.highestUnlockedLevelIndex ?? 0,
      completedLevelIds: levelRows.filter((row) => row.isCompleted).map((row) => row.levelId),
      ownedCats,
      settings: settings ?? DEFAULT_SETTINGS,
      activeTeamCatIds: teamFormation?.catIds ?? [],
      missionEnergy: { current, max, regenPerSecond, lastUpdatedAt: now },
      evolutionItems: evolutionItemsRow?.counts ?? {},
      obtainedTreasureIds: treasuresRow?.obtainedIds ?? [],
      grantedArcRewardIds: arcProgressRow?.grantedRewardArcIds ?? [],
      grantedTreasureSetIds: treasureSetBonusesRow?.grantedSetIds ?? [],
      battleItemInventory: battleItemsRow?.counts ?? {},
      encounteredEnemyCatIds: encounteredEnemiesRow?.catIds ?? [],
      claimedRankThresholds: userRankRow?.claimedThresholds ?? [],
      gachaCurrency: profile?.gachaCurrency ?? 0,
      npCurrency: profile?.npCurrency ?? 0,
      gachaStorage,
      readNewsIds: newsReadRow?.readIds ?? [],
      baseUpgrades,
      missionProgress,
      claimedMissionIds,
      missionsResetDateKey: todayKey,
      gamatotoExpedition: gamatotoRow?.expedition ?? null,
      gamatotoMaterials: gamatotoRow?.materials ?? 0,
      ototoConstruction: ototoCorpsRow?.construction ?? null,
      ototoBuildings: ototoCorpsRow?.buildings ?? {},
    })
    void db.missionEnergy.put({ id: 1, current, max, lastUpdatedAt: now })
  },

  addCurrency: (amount) => {
    const currency = get().currency + amount
    set({ currency })
    void db.playerProfile.update(1, { currency })
  },

  spendCurrency: (amount) => {
    const current = get().currency
    if (amount > current) return false
    const currency = current - amount
    set({ currency })
    void db.playerProfile.update(1, { currency })
    return true
  },

  unlockNextLevel: () => {
    const highestUnlockedLevelIndex = get().highestUnlockedLevelIndex + 1
    set({ highestUnlockedLevelIndex })
    void db.playerProfile.update(1, { highestUnlockedLevelIndex })
  },

  markLevelCompleted: (levelId) => {
    const { completedLevelIds } = get()
    if (!completedLevelIds.includes(levelId)) {
      set({ completedLevelIds: [...completedLevelIds, levelId] })
    }
    void db.levelProgress.put({ levelId, isCompleted: true, completedAtTimestamp: Date.now() })
  },

  addOwnedCat: (catId) => {
    if (get().ownedCats[catId]) return
    const meta: OwnedCatMeta = { level: 1, experienceInvested: 0, evolutionStage: 'Base' }
    set({ ownedCats: { ...get().ownedCats, [catId]: meta } })
    void db.ownedCats.put({ catId, ...meta })
  },

  upgradeCat: (catId) => {
    const owned = get().ownedCats[catId]
    if (!owned) return false

    // specs/012-saga-imperio-de-los-gatos (FR-017, plan.md Key Design Decision 5): tope escalonado 10→20.
    const secondArc = SAGA_ARCS[1]
    const cap = secondArc && get().grantedArcRewardIds.includes(secondArc.id) ? UPGRADE_CAP_EXTENDED : UPGRADE_CAP_BASE
    if (owned.level >= cap) return false

    const cost = upgradeCost(owned.level)
    if (get().currency < cost) return false

    const updated: OwnedCatMeta = { ...owned, level: owned.level + 1, experienceInvested: owned.experienceInvested + cost }
    const currency = get().currency - cost
    const ownedCats = { ...get().ownedCats, [catId]: updated }
    set({ currency, ownedCats })
    void db.playerProfile.update(1, { currency })
    void db.ownedCats.put({ catId, ...updated })

    // El máximo y la tasa de regeneración de energía de misión escalan con el nivel de personaje
    // (specs/007, FR-007; specs/029-pulido-batalla-hud US4 para regenPerSecond) — nunca reducen `current`.
    const characterLevel = characterLevelOf(ownedCats)
    const max = computeMissionEnergyMax(characterLevel) + getEnergyCapBonus(get().baseUpgrades.energyCap ?? 0)
    const regenPerSecond = computeRegenPerSecond(characterLevel)
    if (max !== get().missionEnergy.max || regenPerSecond !== get().missionEnergy.regenPerSecond) {
      set({ missionEnergy: { ...get().missionEnergy, max, regenPerSecond } })
      void db.missionEnergy.update(1, { max })
    }

    return true
  },

  updateSettings: (partial) => {
    const settings = { ...get().settings, ...partial }
    set({ settings })
    void db.settings.update(1, settings)
  },

  setActiveTeam: (catIds) => {
    if (catIds.length === 0 || catIds.length > MAX_TEAM_ROSTER_SIZE) return false
    set({ activeTeamCatIds: catIds })
    void db.teamFormation.put({ id: 1, catIds })
    return true
  },

  spendMissionEnergy: (levelId) => {
    // specs/014-banner-evento-especial (FR-006): resuelve tanto LEVELS como la specialStage de un EventBanner.
    const level = resolveLevel(levelId)
    if (!level) return false

    // specs/013-escalado-capitulos-sets-tesoros (US2/FR-002/FR-003): costo por arco de acceso, o el base sin entrada.
    const arc = findArcByLevelId(levelId)
    const cost = (arc && level.energyCostByArc?.[arc.id]) ?? level.energyCost

    const { current, max, regenPerSecond } = get().missionEnergy
    if (current < cost) return false

    const updatedCurrent = current - cost
    const lastUpdatedAt = Date.now()
    set({ missionEnergy: { current: updatedCurrent, max, regenPerSecond, lastUpdatedAt } })
    void db.missionEnergy.put({ id: 1, current: updatedCurrent, max, lastUpdatedAt })
    return true
  },

  evolveCat: (catId) => {
    const cat = CATS.find((candidate) => candidate.id === catId)
    const owned = get().ownedCats[catId]
    if (!cat?.evolutions || !owned) return false

    if (owned.evolutionStage === 'Base') {
      // specs/030-filtro-detalle-unidad (FR-008): `second` ahora es opcional — un gato sin forma
      // Evolucionada definida no puede evolucionar desde Base, igual que si no tuviera `evolutions`.
      const target = cat.evolutions.second
      if (!target || owned.level < target.requiredLevel) return false

      const updated: OwnedCatMeta = { ...owned, evolutionStage: 'Second' }
      set({ ownedCats: { ...get().ownedCats, [catId]: updated } })
      void db.ownedCats.put({ catId, ...updated })
      return true
    }

    if (owned.evolutionStage === 'Second') {
      // specs/030-filtro-detalle-unidad (FR-008): `true` también es opcional — sin Forma Verdadera
      // definida, `Second` es la forma máxima del gato (mismo criterio que la rama de arriba).
      const target = cat.evolutions.true
      if (!target) return false
      const requiredItemCount = target.requiredItemCount ?? 0
      const itemCount = get().evolutionItems[catId] ?? 0
      if (owned.level < target.requiredLevel || itemCount < requiredItemCount) return false

      const updated: OwnedCatMeta = { ...owned, evolutionStage: 'True' }
      const evolutionItems = { ...get().evolutionItems, [catId]: itemCount - requiredItemCount }
      set({ ownedCats: { ...get().ownedCats, [catId]: updated }, evolutionItems })
      void db.ownedCats.put({ catId, ...updated })
      void db.evolutionItems.put({ id: 1, counts: evolutionItems })
      return true
    }

    // Ya está en 'True' — las evoluciones son secuenciales, no hay etapa siguiente (FR-007).
    return false
  },

  grantLevelRewards: (levelId) => {
    // specs/014-banner-evento-especial (FR-007): resuelve tanto LEVELS como la specialStage de un EventBanner.
    const level = resolveLevel(levelId)
    if (!level) return

    if (level.treasureId && !get().obtainedTreasureIds.includes(level.treasureId)) {
      const obtainedTreasureIds = [...get().obtainedTreasureIds, level.treasureId]
      set({ obtainedTreasureIds })
      void db.treasures.put({ id: 1, obtainedIds: obtainedTreasureIds })
    }

    // "Primera victoria" derivada de ownedCats — sin flag propio (FR-015, plan.md Key Design Decision 4).
    if (level.firstVictoryUnlockCatId && !get().ownedCats[level.firstVictoryUnlockCatId]) {
      get().addOwnedCat(level.firstVictoryUnlockCatId)
    }

    // specs/017-objetos-de-batalla (US3/FR-003): suma cada recompensa de objeto a la cantidad ya poseída.
    if (level.battleItemRewards && level.battleItemRewards.length > 0) {
      const battleItemInventory = { ...get().battleItemInventory }
      for (const reward of level.battleItemRewards) {
        battleItemInventory[reward.itemId] = (battleItemInventory[reward.itemId] ?? 0) + reward.count
      }
      set({ battleItemInventory })
      void db.battleItems.put({ id: 1, counts: battleItemInventory })
    }

    // specs/013-escalado-capitulos-sets-tesoros (plan.md Key Design Decision 4): evita la ventana en la que el
    // tesoro ya está en obtainedTreasureIds pero el set todavía no se evaluó.
    get().checkTreasureSetCompletion()
  },

  claimArcRewardsIfComplete: (arcId) => {
    if (get().grantedArcRewardIds.includes(arcId)) return
    const arc = SAGA_ARCS.find((candidate) => candidate.id === arcId)
    if (!arc) return
    if (!arc.levelIds.every((levelId) => get().completedLevelIds.includes(levelId))) return

    for (const catId of arc.completionRewards.unlockCatIds ?? []) {
      get().addOwnedCat(catId)
    }

    const grantedArcRewardIds = [...get().grantedArcRewardIds, arcId]
    set({ grantedArcRewardIds })
    void db.arcProgress.put({ id: 1, grantedRewardArcIds: grantedArcRewardIds })
  },

  isZombieModeAvailable: (levelId) => {
    const level = LEVELS.find((candidate) => candidate.id === levelId)
    return !!level?.zombieWave && get().completedLevelIds.includes(levelId)
  },

  checkTreasureSetCompletion: () => {
    const { obtainedTreasureIds, grantedTreasureSetIds } = get()
    const newlyCompleted = TREASURE_SETS.filter(
      (set) => !grantedTreasureSetIds.includes(set.id) && set.treasureIds.every((treasureId) => obtainedTreasureIds.includes(treasureId)),
    )
    if (newlyCompleted.length === 0) return

    const updated = [...grantedTreasureSetIds, ...newlyCompleted.map((set) => set.id)]
    set({ grantedTreasureSetIds: updated })
    void db.treasureSetBonuses.put({ id: 1, grantedSetIds: updated })
  },

  getActiveBonusMultiplier: (type) => {
    const { grantedTreasureSetIds } = get()
    return TREASURE_SETS.filter((set) => set.passiveBonus.type === type && grantedTreasureSetIds.includes(set.id)).reduce(
      (product, set) => product * set.passiveBonus.value,
      1,
    )
  },

  getActiveComboBonusMultiplier: (type) => {
    const { activeTeamCatIds } = get()
    return getCompletedCombos(activeTeamCatIds)
      .filter((combo) => combo.bonus.type === type)
      .reduce((product, combo) => product * combo.bonus.value, 1)
  },

  upgradeBaseUpgrade: (id) => {
    const definition = BASE_UPGRADES.find((candidate) => candidate.id === id)
    if (!definition) return false

    const { baseUpgrades, currency } = get()
    const currentLevel = baseUpgrades[id] ?? 0
    if (currentLevel >= definition.maxLevel) return false

    const cost = getBaseUpgradeCost(currentLevel)
    if (currency < cost) return false

    const levels = { ...baseUpgrades, [id]: currentLevel + 1 }
    set({ baseUpgrades: levels, currency: currency - cost })
    void db.playerProfile.update(1, { currency: currency - cost })
    void db.baseUpgrades.put({ id: 1, levels })
    return true
  },

  getBaseUpgradeCurrencyMultiplier: () => getAccountingMultiplier(get().baseUpgrades.accounting ?? 0),

  recordMissionProgress: (metric, amount) => {
    // specs/033-misiones-catnip-challenges (FR-006/research.md Decisión 2): mismo chequeo de reinicio que
    // hydrate() — duplicado deliberado, mismo criterio que missionEnergy.max en hydrate()/upgradeCat().
    const todayKey = getDateKey(Date.now())
    const current = get().missionsResetDateKey === todayKey ? get().missionProgress : {}
    const claimedMissionIds = get().missionsResetDateKey === todayKey ? get().claimedMissionIds : []

    const progress = { ...current, [metric]: (current[metric] ?? 0) + amount }
    set({ missionProgress: progress, claimedMissionIds, missionsResetDateKey: todayKey })
    void db.missions.put({ id: 1, resetDateKey: todayKey, progress, claimedMissionIds })
  },

  claimMission: (missionId) => {
    const mission = MISSIONS.find((candidate) => candidate.id === missionId)
    if (!mission) return false

    const todayKey = getDateKey(Date.now())
    const upToDate = get().missionsResetDateKey === todayKey
    const progress = upToDate ? get().missionProgress : {}
    const claimedSoFar = upToDate ? get().claimedMissionIds : []

    if (claimedSoFar.includes(missionId)) return false
    if ((progress[mission.metric] ?? 0) < mission.target) return false

    const claimedMissionIds = [...claimedSoFar, missionId]
    const currency = get().currency + mission.currencyReward
    set({ missionProgress: progress, claimedMissionIds, missionsResetDateKey: todayKey, currency })
    void db.playerProfile.update(1, { currency })
    void db.missions.put({ id: 1, resetDateKey: todayKey, progress, claimedMissionIds })
    return true
  },

  startGamatotoExpedition: (optionId) => {
    if (get().gamatotoExpedition) return false
    const option = GAMATOTO_EXPEDITION_OPTIONS.find((candidate) => candidate.id === optionId)
    if (!option) return false

    const expedition: GamatotoExpedition = { optionId, startedAtMs: Date.now() }
    set({ gamatotoExpedition: expedition })
    void db.gamatoto.put({ id: 1, expedition, materials: get().gamatotoMaterials })
    return true
  },

  claimGamatotoExpedition: () => {
    const expedition = get().gamatotoExpedition
    if (!expedition) return false
    const option = GAMATOTO_EXPEDITION_OPTIONS.find((candidate) => candidate.id === expedition.optionId)
    if (!option || !isExpeditionReady(expedition, option, Date.now())) return false

    const materials = get().gamatotoMaterials + option.materialsReward
    set({ gamatotoExpedition: null, gamatotoMaterials: materials })
    void db.gamatoto.put({ id: 1, expedition: null, materials })
    return true
  },

  startOtotoConstruction: (building, choice) => {
    if (get().ototoConstruction) return false
    const definition = OTOTO_BUILDINGS.find((candidate) => candidate.id === building)
    if (!definition) return false
    // specs/041-cabezas-de-canon (FR-002): solo la construcción nueva valida su elección (la UI ya restringe las de Base/Estilo).
    if (building === 'cannonHead' && !CANNON_HEAD_OPTIONS.includes(choice as CannonHeadEffect)) return false
    if (get().gamatotoMaterials < definition.materialsCost) return false

    const construction: OtotoConstruction = { building, choice, startedAtMs: Date.now() }
    const gamatotoMaterials = get().gamatotoMaterials - definition.materialsCost
    set({ ototoConstruction: construction, gamatotoMaterials })
    void db.ototoCorps.put({ id: 1, construction, buildings: get().ototoBuildings })
    void db.gamatoto.put({ id: 1, expedition: get().gamatotoExpedition, materials: gamatotoMaterials })
    return true
  },

  claimOtotoConstruction: () => {
    const construction = get().ototoConstruction
    if (!construction) return false
    const definition = OTOTO_BUILDINGS.find((candidate) => candidate.id === construction.building)
    if (!definition || !isOtotoConstructionReady(construction, definition, Date.now())) return false

    const buildings = { ...get().ototoBuildings, [construction.building]: construction.choice }
    set({ ototoConstruction: null, ototoBuildings: buildings })
    void db.ototoCorps.put({ id: 1, construction: null, buildings })
    return true
  },

  investDebuffResistanceTalent: (catId, effect) => {
    const owned = get().ownedCats[catId]
    const cat = CATS.find((candidate) => candidate.id === catId)
    if (!owned || !cat || !isTalentEligible(owned.evolutionStage, cat.rarity)) return false

    const current = owned.talents?.debuffResistance
    if (current && current.points > 0 && current.effect !== effect) return false
    const points = current?.points ?? 0
    if (points >= MAX_TALENT_POINTS) return false

    const cost = getTalentPointCost(points)
    if (get().npCurrency < cost) return false

    const talents: CatTalents = { ...owned.talents, debuffResistance: { effect, points: points + 1 } }
    const updated: OwnedCatMeta = { ...owned, talents }
    const npCurrency = get().npCurrency - cost
    set({ ownedCats: { ...get().ownedCats, [catId]: updated }, npCurrency })
    void db.ownedCats.put({ catId, ...updated })
    void db.playerProfile.update(1, { npCurrency })
    return true
  },

  investStatBoostTalent: (catId, stat) => {
    const owned = get().ownedCats[catId]
    const cat = CATS.find((candidate) => candidate.id === catId)
    if (!owned || !cat || !isTalentEligible(owned.evolutionStage, cat.rarity)) return false

    const statBoost = owned.talents?.statBoost ?? { hp: 0, damage: 0 }
    const points = statBoost[stat]
    if (points >= MAX_TALENT_POINTS) return false

    const cost = getTalentPointCost(points)
    if (get().npCurrency < cost) return false

    const talents: CatTalents = { ...owned.talents, statBoost: { ...statBoost, [stat]: points + 1 } }
    const updated: OwnedCatMeta = { ...owned, talents }
    const npCurrency = get().npCurrency - cost
    set({ ownedCats: { ...get().ownedCats, [catId]: updated }, npCurrency })
    void db.ownedCats.put({ catId, ...updated })
    void db.playerProfile.update(1, { npCurrency })
    return true
  },

  investOrbTalent: (catId, classification) => {
    const owned = get().ownedCats[catId]
    const cat = CATS.find((candidate) => candidate.id === catId)
    if (!owned || !cat || !isTalentEligible(owned.evolutionStage, cat.rarity)) return false

    const current = owned.talents?.orb
    if (current && current.points > 0 && current.classification !== classification) return false
    const points = current?.points ?? 0
    if (points >= MAX_TALENT_POINTS) return false

    const cost = getTalentPointCost(points)
    if (get().npCurrency < cost) return false

    const talents: CatTalents = { ...owned.talents, orb: { classification, points: points + 1 } }
    const updated: OwnedCatMeta = { ...owned, talents }
    const npCurrency = get().npCurrency - cost
    set({ ownedCats: { ...get().ownedCats, [catId]: updated }, npCurrency })
    void db.ownedCats.put({ catId, ...updated })
    void db.playerProfile.update(1, { npCurrency })
    return true
  },

  purchaseBattleItem: (itemId) => {
    if (!BATTLE_ITEMS.some((item) => item.id === itemId)) return false
    const price = getBattleItemPrice(itemId)
    if (get().currency < price) return false

    const battleItemInventory = { ...get().battleItemInventory, [itemId]: (get().battleItemInventory[itemId] ?? 0) + 1 }
    const currency = get().currency - price
    set({ currency, battleItemInventory })
    void db.playerProfile.update(1, { currency })
    void db.battleItems.put({ id: 1, counts: battleItemInventory })
    return true
  },

  purchaseEvolutionItem: (catId) => {
    const owned = get().ownedCats[catId]
    const cat = CATS.find((candidate) => candidate.id === catId)
    if (!owned || !cat || !cat.evolutions?.true || owned.evolutionStage === 'True') return false

    const requiredItemCount = cat.evolutions.true.requiredItemCount ?? 0
    const current = get().evolutionItems[catId] ?? 0
    if (current >= requiredItemCount) return false
    if (get().currency < EVOLUTION_ITEM_PRICE) return false

    const evolutionItems = { ...get().evolutionItems, [catId]: current + 1 }
    const currency = get().currency - EVOLUTION_ITEM_PRICE
    set({ currency, evolutionItems })
    void db.playerProfile.update(1, { currency })
    void db.evolutionItems.put({ id: 1, counts: evolutionItems })
    return true
  },

  selectBattleItem: (itemId) => {
    const { selectedBattleItemIds, battleItemInventory } = get()
    if (selectedBattleItemIds.length >= MAX_BATTLE_ITEMS_PER_BATTLE) return false

    // specs/017-objetos-de-batalla (Edge Cases): varias unidades del mismo objeto están permitidas si hay stock.
    const alreadySelectedOfThisItem = selectedBattleItemIds.filter((id) => id === itemId).length
    if (alreadySelectedOfThisItem >= (battleItemInventory[itemId] ?? 0)) return false

    set({ selectedBattleItemIds: [...selectedBattleItemIds, itemId] })
    return true
  },

  deselectBattleItem: (itemId) => {
    const { selectedBattleItemIds } = get()
    const index = selectedBattleItemIds.lastIndexOf(itemId)
    if (index === -1) return
    set({ selectedBattleItemIds: [...selectedBattleItemIds.slice(0, index), ...selectedBattleItemIds.slice(index + 1)] })
  },

  consumeSelectedBattleItems: () => {
    // specs/017-objetos-de-batalla (FR-006, plan.md Key Design Decision 2): único punto de descuento — al
    // entrar efectivamente a la batalla, nunca en TeamScreen.
    const { selectedBattleItemIds, battleItemInventory } = get()

    const updatedInventory = { ...battleItemInventory }
    let speedMultiplier = 1
    let energyBonus = 0
    let hasTreasureRadar = false

    for (const itemId of selectedBattleItemIds) {
      updatedInventory[itemId] = (updatedInventory[itemId] ?? 0) - 1
      const item = BATTLE_ITEMS.find((candidate) => candidate.id === itemId)
      if (!item) continue
      if (item.speedMultiplier) speedMultiplier *= item.speedMultiplier
      if (item.energyBonus) energyBonus += item.energyBonus
      if (item.category === 'TreasureBonus') hasTreasureRadar = true
    }

    set({ battleItemInventory: updatedInventory, selectedBattleItemIds: [], pendingTreasureRadar: hasTreasureRadar })
    void db.battleItems.put({ id: 1, counts: updatedInventory })

    return { speedMultiplier, energyBonus }
  },

  grantRandomUnownedTreasure: (random = Math.random) => {
    const unowned = getAllTreasureIds().filter((id) => !get().obtainedTreasureIds.includes(id))
    if (unowned.length === 0) return // FR-010: sin tesoros pendientes, sin efecto ni error.

    const index = Math.min(unowned.length - 1, Math.floor(random() * unowned.length))
    const obtainedTreasureIds = [...get().obtainedTreasureIds, unowned[index]]
    set({ obtainedTreasureIds })
    void db.treasures.put({ id: 1, obtainedIds: obtainedTreasureIds })
    get().checkTreasureSetCompletion()
  },

  clearPendingTreasureRadar: () => set({ pendingTreasureRadar: false }),

  recordEncounteredEnemy: (catId) => {
    if (get().encounteredEnemyCatIds.includes(catId)) return
    const encounteredEnemyCatIds = [...get().encounteredEnemyCatIds, catId]
    set({ encounteredEnemyCatIds })
    void db.encounteredEnemies.put({ id: 1, catIds: encounteredEnemyCatIds })
  },

  claimRankThreshold: (rank) => {
    // specs/019-rango-de-usuario (FR-004/005/006, plan.md Key Design Decision 2): acción explícita — reclamable
    // en cualquier orden (FR-008), monótona (FR-007).
    if (get().claimedRankThresholds.includes(rank)) return false
    const threshold = USER_RANK_THRESHOLDS.find((candidate) => candidate.rank === rank)
    if (!threshold) return false
    if (characterLevelOf(get().ownedCats) < rank) return false

    const battleItemInventory = { ...get().battleItemInventory }
    battleItemInventory[threshold.reward.itemId] = (battleItemInventory[threshold.reward.itemId] ?? 0) + threshold.reward.count
    const claimedRankThresholds = [...get().claimedRankThresholds, rank]

    set({ battleItemInventory, claimedRankThresholds })
    void db.battleItems.put({ id: 1, counts: battleItemInventory })
    void db.userRank.put({ id: 1, claimedThresholds: claimedRankThresholds })
    return true
  },

  rollGachaSingle: async (bannerId) => {
    const banner = GACHA_BANNERS.find((candidate) => candidate.id === bannerId)
    if (!banner) return null
    if (get().gachaCurrency < GACHA_SINGLE_ROLL_COST) return null

    const gachaCurrency = get().gachaCurrency - GACHA_SINGLE_ROLL_COST
    const result = rollOne(banner)
    const id = await db.gachaStorage.add({ catId: result.catId, rarity: result.rarity })

    set({ gachaCurrency, gachaStorage: [...get().gachaStorage, { id, catId: result.catId, rarity: result.rarity }] })
    void db.playerProfile.update(1, { gachaCurrency })
    return result
  },

  rollGachaMulti: async (bannerId) => {
    const banner = GACHA_BANNERS.find((candidate) => candidate.id === bannerId)
    if (!banner) return null
    if (get().gachaCurrency < GACHA_MULTI_ROLL_COST) return null

    const gachaCurrency = get().gachaCurrency - GACHA_MULTI_ROLL_COST
    const results = rollMany(banner, GACHA_MULTI_ROLL_COUNT)
    const newRows = await Promise.all(
      results.map(async (result) => {
        const id = await db.gachaStorage.add({ catId: result.catId, rarity: result.rarity })
        return { id, catId: result.catId, rarity: result.rarity }
      }),
    )

    set({ gachaCurrency, gachaStorage: [...get().gachaStorage, ...newRows] })
    void db.playerProfile.update(1, { gachaCurrency })
    return results
  },

  activateCapsule: async (storageRowId) => {
    const row = get().gachaStorage.find((candidate) => candidate.id === storageRowId)
    if (!row) return

    const owned = get().ownedCats[row.catId]
    if (!owned) {
      get().addOwnedCat(row.catId)
    } else {
      // specs/024-sistema-gacha (FR-007): duplicado — suma nivel "+" en vez de crear una segunda entrada.
      const updated: OwnedCatMeta = { ...owned, plusLevel: (owned.plusLevel ?? 0) + 1 }
      set({ ownedCats: { ...get().ownedCats, [row.catId]: updated } })
      void db.ownedCats.put({ catId: row.catId, ...updated })
    }

    const gachaStorage = get().gachaStorage.filter((candidate) => candidate.id !== storageRowId)
    set({ gachaStorage })
    await db.gachaStorage.delete(storageRowId)
  },

  exchangeCapsuleForXp: async (storageRowId) => {
    const row = get().gachaStorage.find((candidate) => candidate.id === storageRowId)
    if (!row) return

    const gachaStorage = get().gachaStorage.filter((candidate) => candidate.id !== storageRowId)
    // specs/024-sistema-gacha (FR-008, research.md Decisión 1): "XP" es la `currency` ya existente.
    const currency = get().currency + GACHA_CAPSULE_EXCHANGE_VALUE
    set({ gachaStorage, currency })
    void db.playerProfile.update(1, { currency })
    await db.gachaStorage.delete(storageRowId)
  },

  exchangeCapsuleForNp: async (storageRowId) => {
    const row = get().gachaStorage.find((candidate) => candidate.id === storageRowId)
    if (!row) return false
    if (row.rarity !== 'Megarraro' && row.rarity !== 'Legendario') return false

    const gachaStorage = get().gachaStorage.filter((candidate) => candidate.id !== storageRowId)
    const npCurrency = get().npCurrency + GACHA_CAPSULE_EXCHANGE_VALUE
    set({ gachaStorage, npCurrency })
    void db.playerProfile.update(1, { npCurrency })
    await db.gachaStorage.delete(storageRowId)
    return true
  },

  markNewsRead: async (id) => {
    const { readNewsIds } = get()
    if (readNewsIds.includes(id)) return
    const updated = [...readNewsIds, id]
    set({ readNewsIds: updated })
    await db.newsRead.put({ id: 1, readIds: updated })
  },
}))
