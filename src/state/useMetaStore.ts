import { create } from 'zustand'
import { db, ensureDefaultProfile } from '../db'
import { BATTLE_ITEMS, MAX_BATTLE_ITEMS_PER_BATTLE } from '../data/battleItems'
import { CATS } from '../data/cats'
import { getAllTreasureIds, resolveLevel } from '../data/events'
import { LEVELS } from '../data/levels'
import { findArcByLevelId, SAGA_ARCS } from '../data/sagaArcs'
import { TREASURE_SETS } from '../data/treasureSets'
import { USER_RANK_THRESHOLDS } from '../data/userRankThresholds'
import { computeMissionEnergyMax, computeRecoveredEnergy, computeRegenPerSecond } from '../data/missionEnergy'
import type { TreasureSetPassiveBonus } from '../data/treasureSets'

interface OwnedCatMeta {
  level: number
  experienceInvested: number
  /** specs/010-evolucion-de-gatos. */
  evolutionStage: 'Base' | 'Second' | 'True'
}

interface MetaSettings {
  musicVolume: number
  sfxVolume: number
  language: string
}

interface MissionEnergyState {
  current: number
  max: number
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
  selectBattleItem: (itemId: string) => boolean
  deselectBattleItem: (itemId: string) => void
  consumeSelectedBattleItems: () => { speedMultiplier: number; energyBonus: number }
  grantRandomUnownedTreasure: (random?: () => number) => void
  clearPendingTreasureRadar: () => void
  recordEncounteredEnemy: (catId: string) => void
  claimRankThreshold: (rank: number) => boolean
}

const DEFAULT_SETTINGS: MetaSettings = { musicVolume: 1, sfxVolume: 1, language: 'es' }

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
  Object.values(ownedCats).reduce((sum, cat) => sum + cat.level, 0)

export const useMetaStore = create<MetaState>((set, get) => ({
  isHydrated: false,
  currency: 0,
  highestUnlockedLevelIndex: 0,
  completedLevelIds: [],
  ownedCats: {},
  settings: DEFAULT_SETTINGS,
  activeTeamCatIds: [],
  missionEnergy: { current: 0, max: 0 },
  evolutionItems: {},
  obtainedTreasureIds: [],
  grantedArcRewardIds: [],
  grantedTreasureSetIds: [],
  battleItemInventory: {},
  selectedBattleItemIds: [],
  pendingTreasureRadar: false,
  encounteredEnemyCatIds: [],
  claimedRankThresholds: [],

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
    ])

    const ownedCats = Object.fromEntries(
      ownedCatRows.map((row) => [
        row.catId,
        { level: row.level, experienceInvested: row.experienceInvested, evolutionStage: row.evolutionStage ?? 'Base' },
      ]),
    )
    const characterLevel = characterLevelOf(ownedCats)
    const max = computeMissionEnergyMax(characterLevel)
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
      missionEnergy: { current, max },
      evolutionItems: evolutionItemsRow?.counts ?? {},
      obtainedTreasureIds: treasuresRow?.obtainedIds ?? [],
      grantedArcRewardIds: arcProgressRow?.grantedRewardArcIds ?? [],
      grantedTreasureSetIds: treasureSetBonusesRow?.grantedSetIds ?? [],
      battleItemInventory: battleItemsRow?.counts ?? {},
      encounteredEnemyCatIds: encounteredEnemiesRow?.catIds ?? [],
      claimedRankThresholds: userRankRow?.claimedThresholds ?? [],
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

    // El máximo de energía de misión escala con el nivel de personaje (specs/007, FR-007) — nunca reduce `current`.
    const max = computeMissionEnergyMax(characterLevelOf(ownedCats))
    if (max !== get().missionEnergy.max) {
      set({ missionEnergy: { ...get().missionEnergy, max } })
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
    if (catIds.length === 0) return false
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

    const { current, max } = get().missionEnergy
    if (current < cost) return false

    const updatedCurrent = current - cost
    const lastUpdatedAt = Date.now()
    set({ missionEnergy: { current: updatedCurrent, max } })
    void db.missionEnergy.put({ id: 1, current: updatedCurrent, max, lastUpdatedAt })
    return true
  },

  evolveCat: (catId) => {
    const cat = CATS.find((candidate) => candidate.id === catId)
    const owned = get().ownedCats[catId]
    if (!cat?.evolutions || !owned) return false

    if (owned.evolutionStage === 'Base') {
      const target = cat.evolutions.second
      if (owned.level < target.requiredLevel) return false

      const updated: OwnedCatMeta = { ...owned, evolutionStage: 'Second' }
      set({ ownedCats: { ...get().ownedCats, [catId]: updated } })
      void db.ownedCats.put({ catId, ...updated })
      return true
    }

    if (owned.evolutionStage === 'Second') {
      const target = cat.evolutions.true
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
}))
