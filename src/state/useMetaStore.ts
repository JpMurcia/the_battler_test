import { create } from 'zustand'
import { db, ensureDefaultProfile } from '../db'

interface OwnedCatMeta {
  level: number
  experienceInvested: number
}

interface MetaSettings {
  musicVolume: number
  sfxVolume: number
  language: string
}

interface MetaState {
  isHydrated: boolean
  currency: number
  highestUnlockedLevelIndex: number
  completedLevelIds: string[]
  ownedCats: Record<string, OwnedCatMeta>
  settings: MetaSettings

  hydrate: () => Promise<void>
  addCurrency: (amount: number) => void
  spendCurrency: (amount: number) => boolean
  unlockNextLevel: () => void
  markLevelCompleted: (levelId: string) => void
  addOwnedCat: (catId: string) => void
  upgradeCat: (catId: string) => boolean
  updateSettings: (partial: Partial<MetaSettings>) => void
}

const DEFAULT_SETTINGS: MetaSettings = { musicVolume: 1, sfxVolume: 1, language: 'es' }

/** Costo de mejora provisional, no balanceado (tasks.md Fase 1). */
const upgradeCost = (currentLevel: number) => currentLevel * 100

export const useMetaStore = create<MetaState>((set, get) => ({
  isHydrated: false,
  currency: 0,
  highestUnlockedLevelIndex: 0,
  completedLevelIds: [],
  ownedCats: {},
  settings: DEFAULT_SETTINGS,

  hydrate: async () => {
    await ensureDefaultProfile()
    const [profile, settings, ownedCatRows, levelRows] = await Promise.all([
      db.playerProfile.get(1),
      db.settings.get(1),
      db.ownedCats.toArray(),
      db.levelProgress.toArray(),
    ])

    set({
      isHydrated: true,
      currency: profile?.currency ?? 0,
      highestUnlockedLevelIndex: profile?.highestUnlockedLevelIndex ?? 0,
      completedLevelIds: levelRows.filter((row) => row.isCompleted).map((row) => row.levelId),
      ownedCats: Object.fromEntries(
        ownedCatRows.map((row) => [row.catId, { level: row.level, experienceInvested: row.experienceInvested }]),
      ),
      settings: settings ?? DEFAULT_SETTINGS,
    })
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
    set({ currency, ownedCats: { ...get().ownedCats, [catId]: updated } })
    void db.playerProfile.update(1, { currency })
    void db.ownedCats.put({ catId, ...updated })
    return true
  },

  updateSettings: (partial) => {
    const settings = { ...get().settings, ...partial }
    set({ settings })
    void db.settings.update(1, settings)
  },
}))
