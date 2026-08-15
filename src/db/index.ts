import Dexie, { type Table } from 'dexie'

export interface PlayerProfileRow {
  id: 1 // fila única (singleton)
  currency: number
  highestUnlockedLevelIndex: number
  createdAt: number
}

export interface OwnedCatRow {
  catId: string // clave primaria
  level: number
  experienceInvested: number
}

export interface LevelProgressRow {
  levelId: string // clave primaria
  isCompleted: boolean
  completedAtTimestamp: number | null
}

export interface SettingsRow {
  id: 1 // fila única (singleton)
  musicVolume: number
  sfxVolume: number
  language: string
}

class BattleCatsDB extends Dexie {
  playerProfile!: Table<PlayerProfileRow, number>
  ownedCats!: Table<OwnedCatRow, string>
  levelProgress!: Table<LevelProgressRow, string>
  settings!: Table<SettingsRow, number>

  constructor() {
    super('BattleCatsDB')
    this.version(1).stores({
      playerProfile: 'id',
      ownedCats: 'catId',
      levelProgress: 'levelId',
      settings: 'id',
    })
  }
}

export const db = new BattleCatsDB()

const DEFAULT_SETTINGS: Omit<SettingsRow, 'id'> = {
  musicVolume: 1,
  sfxVolume: 1,
  language: 'es',
}

/** Crea las filas singleton de playerProfile/settings si no existen — US2 Edge Case (primera sesión). Idempotente. */
export async function ensureDefaultProfile(): Promise<void> {
  await db.transaction('rw', db.playerProfile, db.settings, async () => {
    const profile = await db.playerProfile.get(1)
    if (!profile) {
      await db.playerProfile.put({
        id: 1,
        currency: 0,
        highestUnlockedLevelIndex: 0,
        createdAt: Date.now(),
      })
    }

    const settings = await db.settings.get(1)
    if (!settings) {
      await db.settings.put({ id: 1, ...DEFAULT_SETTINGS })
    }
  })
}
