import { create } from 'zustand'
import { db, ensureDefaultProfile } from '../db'
import { LEVELS } from '../data/levels'
import { computeMissionEnergyMax, computeRecoveredEnergy, computeRegenPerSecond } from '../data/missionEnergy'

interface OwnedCatMeta {
  level: number
  experienceInvested: number
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
}

const DEFAULT_SETTINGS: MetaSettings = { musicVolume: 1, sfxVolume: 1, language: 'es' }

/** Costo de mejora provisional, no balanceado (tasks.md Fase 1). */
const upgradeCost = (currentLevel: number) => currentLevel * 100

/** Nivel de personaje agregado — mismo cálculo que `UpgradeScreen.tsx` (specs/006-dashboard-base-jugador). */
const characterLevelOf = (ownedCats: Record<string, OwnedCatMeta>) =>
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

  hydrate: async () => {
    await ensureDefaultProfile()
    const [profile, settings, ownedCatRows, levelRows, teamFormation, missionEnergyRow] = await Promise.all([
      db.playerProfile.get(1),
      db.settings.get(1),
      db.ownedCats.toArray(),
      db.levelProgress.toArray(),
      db.teamFormation.get(1),
      db.missionEnergy.get(1),
    ])

    const ownedCats = Object.fromEntries(
      ownedCatRows.map((row) => [row.catId, { level: row.level, experienceInvested: row.experienceInvested }]),
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
    const meta: OwnedCatMeta = { level: 1, experienceInvested: 0 }
    set({ ownedCats: { ...get().ownedCats, [catId]: meta } })
    void db.ownedCats.put({ catId, ...meta })
  },

  upgradeCat: (catId) => {
    const owned = get().ownedCats[catId]
    if (!owned) return false
    const cost = upgradeCost(owned.level)
    if (get().currency < cost) return false

    const updated: OwnedCatMeta = { level: owned.level + 1, experienceInvested: owned.experienceInvested + cost }
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
    const level = LEVELS.find((candidate) => candidate.id === levelId)
    if (!level) return false

    const { current, max } = get().missionEnergy
    if (current < level.energyCost) return false

    const updatedCurrent = current - level.energyCost
    const lastUpdatedAt = Date.now()
    set({ missionEnergy: { current: updatedCurrent, max } })
    void db.missionEnergy.put({ id: 1, current: updatedCurrent, max, lastUpdatedAt })
    return true
  },
}))
