import Dexie, { type Table } from 'dexie'
import type { BaseUpgradeId } from '../data/baseUpgrades'
import { CATS, type RarityType } from '../data/cats'
import { computeMissionEnergyMax } from '../data/missionEnergy'
import type { MissionMetric } from '../data/missions'

export interface PlayerProfileRow {
  id: 1 // fila única (singleton)
  currency: number
  highestUnlockedLevelIndex: number
  createdAt: number
  /** specs/024-sistema-gacha (FR-018). Ausente en filas viejas = 0 al leer (sin migración). */
  gachaCurrency?: number
  /** specs/024-sistema-gacha (FR-009). Ausente en filas viejas = 0 al leer (sin migración). */
  npCurrency?: number
}

export interface OwnedCatRow {
  catId: string // clave primaria
  level: number
  experienceInvested: number
  /** specs/010-evolucion-de-gatos. Ausente en filas viejas = 'Base' al leer (sin migración). */
  evolutionStage?: 'Base' | 'Second' | 'True'
  /** specs/024-sistema-gacha (FR-007). Ausente en filas viejas = 0 al leer (sin migración, mismo patrón que evolutionStage). */
  plusLevel?: number
}

/** specs/024-sistema-gacha (FR-005). Una cápsula de gacha sin activar — clave autoincremental porque un mismo
 * catId puede tener varias cápsulas pendientes a la vez (research.md Decisión 5). */
export interface GachaStorageRow {
  id?: number // clave primaria autoincremental
  catId: string
  rarity: RarityType
}

export interface EvolutionItemsRow {
  id: 1 // fila única (singleton)
  counts: Record<string, number>
}

/** specs/012-saga-imperio-de-los-gatos. */
export interface TreasuresRow {
  id: 1 // fila única (singleton)
  obtainedIds: string[]
}

/** specs/012-saga-imperio-de-los-gatos. */
export interface ArcProgressRow {
  id: 1 // fila única (singleton)
  grantedRewardArcIds: string[]
}

/** specs/013-escalado-capitulos-sets-tesoros. */
export interface TreasureSetBonusesRow {
  id: 1 // fila única (singleton)
  grantedSetIds: string[]
}

/** specs/017-objetos-de-batalla. */
export interface BattleItemsRow {
  id: 1 // fila única (singleton)
  counts: Record<string, number>
}

/** specs/018-bibliotecas-consulta. */
export interface EncounteredEnemiesRow {
  id: 1 // fila única (singleton)
  catIds: string[]
}

/** specs/019-rango-de-usuario (FR-007). Monótono — un umbral reclamado nunca se retira. */
export interface UserRankRow {
  id: 1 // fila única (singleton)
  claimedThresholds: number[]
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

export interface TeamFormationRow {
  id: 1 // fila única (singleton)
  catIds: string[]
}

export interface MissionEnergyRow {
  id: 1 // fila única (singleton)
  current: number
  max: number
  lastUpdatedAt: number
}

/** specs/026-navegacion-hub-mockup (FR-009). `readIds` es monótono — una vez agregado un id, no se retira
 * (mismo patrón que `UserRankRow.claimedThresholds`). */
export interface NewsReadRow {
  id: 1 // fila única (singleton)
  readIds: string[]
}

/** specs/031-mejoras-de-base. Nivel actual por mejora de cuenta — ausente = 0 (mismo patrón que `EvolutionItemsRow.counts`). */
export interface BaseUpgradesRow {
  id: 1 // fila única (singleton)
  levels: Partial<Record<BaseUpgradeId, number>>
}

/** specs/033-misiones-catnip-challenges. `resetDateKey` (`YYYY-MM-DD`) gobierna el reinicio diario (FR-006). */
export interface MissionsRow {
  id: 1 // fila única (singleton)
  resetDateKey: string
  progress: Partial<Record<MissionMetric, number>>
  claimedMissionIds: string[]
}

class BattleCatsDB extends Dexie {
  playerProfile!: Table<PlayerProfileRow, number>
  ownedCats!: Table<OwnedCatRow, string>
  levelProgress!: Table<LevelProgressRow, string>
  settings!: Table<SettingsRow, number>
  teamFormation!: Table<TeamFormationRow, number>
  missionEnergy!: Table<MissionEnergyRow, number>
  evolutionItems!: Table<EvolutionItemsRow, number>
  treasures!: Table<TreasuresRow, number>
  arcProgress!: Table<ArcProgressRow, number>
  treasureSetBonuses!: Table<TreasureSetBonusesRow, number>
  battleItems!: Table<BattleItemsRow, number>
  encounteredEnemies!: Table<EncounteredEnemiesRow, number>
  userRank!: Table<UserRankRow, number>
  gachaStorage!: Table<GachaStorageRow, number>
  newsRead!: Table<NewsReadRow, number>
  baseUpgrades!: Table<BaseUpgradesRow, number>
  missions!: Table<MissionsRow, number>

  constructor() {
    super('BattleCatsDB')
    this.version(1).stores({
      playerProfile: 'id',
      ownedCats: 'catId',
      levelProgress: 'levelId',
      settings: 'id',
    })
    this.version(2).stores({
      teamFormation: 'id',
    })
    this.version(3).stores({
      missionEnergy: 'id',
    })
    this.version(4).stores({
      evolutionItems: 'id',
    })
    this.version(5).stores({
      treasures: 'id',
      arcProgress: 'id',
    })
    this.version(6).stores({
      treasureSetBonuses: 'id',
    })
    this.version(7).stores({
      battleItems: 'id',
    })
    this.version(8).stores({
      encounteredEnemies: 'id',
    })
    this.version(9).stores({
      userRank: 'id',
    })
    this.version(10).stores({
      gachaStorage: '++id',
    })
    this.version(11).stores({
      newsRead: 'id',
    })
    this.version(12).stores({
      baseUpgrades: 'id',
    })
    this.version(13).stores({
      missions: 'id',
    })
  }
}

export const db = new BattleCatsDB()

const DEFAULT_SETTINGS: Omit<SettingsRow, 'id'> = {
  musicVolume: 1,
  sfxVolume: 1,
  language: 'es',
}

/**
 * Crea las filas singleton de playerProfile/settings si no existen (US2 Edge Case, primera sesión),
 * y siembra el gato inicial garantizado en ownedCats si el roster está vacío (FR-011, specs/002-motor-de-combate/spec.md).
 * Idempotente.
 */
export async function ensureDefaultProfile(): Promise<void> {
  await db.transaction('rw', db.playerProfile, db.settings, db.ownedCats, db.missionEnergy, db.newsRead, async () => {
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

    const ownedCatsCount = await db.ownedCats.count()
    // specs/019-rango-de-usuario (FR-001): el Rango de Usuario es la suma de niveles de las unidades poseídas —
    // el máximo de energía de misión sembrado más abajo debe reflejar cuántos gatos iniciales se otorgan aquí,
    // no un "nivel de personaje 1" fijo (specs/027-capitulo-1-imperio-gatos expuso esta suposición al añadir un
    // segundo gato inicial: characterLevelOf ya no es 1 desde el arranque).
    let seededStarterCatCount = 0
    if (ownedCatsCount === 0 && CATS.length > 0) {
      await db.ownedCats.put({ catId: CATS[0].id, level: 1, experienceInvested: 0 })
      seededStarterCatCount = 1
      // specs/027-capitulo-1-imperio-gatos (FR-001, US2 Escenario 1): "Gato Recluta" también es un gato inicial
      // garantizado, sin superar ninguna etapa — mismo criterio que CATS[0], aditivo (no reemplaza al gato inicial ya existente).
      if (CATS.some((cat) => cat.id === 'cat-recluta')) {
        await db.ownedCats.put({ catId: 'cat-recluta', level: 1, experienceInvested: 0 })
        seededStarterCatCount = 2
      }
    }

    const missionEnergy = await db.missionEnergy.get(1)
    if (!missionEnergy) {
      const max = computeMissionEnergyMax(seededStarterCatCount || 1)
      await db.missionEnergy.put({ id: 1, current: max, max, lastUpdatedAt: Date.now() })
    }

    const newsRead = await db.newsRead.get(1)
    if (!newsRead) {
      await db.newsRead.put({ id: 1, readIds: [] })
    }
  })
}
