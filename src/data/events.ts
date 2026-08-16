import { LEVELS, type Level } from './levels'

export interface EventTimeWindow {
  startMs: number
  endMs: number
}

/** specs/014-banner-evento-especial (FR-001). */
export interface EventBanner {
  id: string
  name: string
  timeWindows: EventTimeWindow[]
  /** Misma forma que `Level` (`specs/001`) — no pertenece a `LEVELS` ni a ningún `SagaArc.levelIds` (plan.md Key Design Decision 4). */
  specialStage: Level
  energyCost: number
}

/**
 * Función pura: recibe `nowMs` en vez de leer `Date.now()` internamente (plan.md Key Design Decision 1).
 * Ventanas solapadas se resuelven por `some()` sin fusión de intervalos (FR-010, plan.md Key Design Decision 2).
 */
export function isEventActive(banner: EventBanner, nowMs: number): boolean {
  return banner.timeWindows.some((window) => nowMs >= window.startMs && nowMs < window.endMs)
}

/**
 * `spendMissionEnergy`/`startLevel`/`grantLevelRewards` resuelven niveles por id vía `LEVELS.find` — `specialStage`
 * no vive en `LEVELS`, así que este helper une ambas fuentes para que esos flujos funcionen sin más cambios (FR-005/006/007).
 */
export function resolveLevel(levelId: string): Level | undefined {
  return LEVELS.find((level) => level.id === levelId) ?? EVENT_BANNERS.map((banner) => banner.specialStage).find((stage) => stage.id === levelId)
}

/** `true` si `levelId` es la fase especial de algún evento — usado para excluirla del desbloqueo secuencial (FR-004). */
export function isEventStageId(levelId: string): boolean {
  return EVENT_BANNERS.some((banner) => banner.specialStage.id === levelId)
}

/**
 * specs/017-objetos-de-batalla ("Radar de Tesoro"): catálogo completo de tesoros existentes en el juego, derivado
 * de `LEVELS`/`EVENT_BANNERS` — sin lista separada que pueda desincronizarse al añadir contenido nuevo.
 */
export function getAllTreasureIds(): string[] {
  const levelTreasureIds = LEVELS.map((level) => level.treasureId).filter((id): id is string => !!id)
  const eventTreasureIds = EVENT_BANNERS.map((banner) => banner.specialStage.treasureId).filter((id): id is string => !!id)
  return [...new Set([...levelTreasureIds, ...eventTreasureIds])]
}

const EVENT_ENERGY_COST = 15

/** Fixture de bootstrap — valores de diseño provisionales, no balanceados (tasks.md Fase 1/5). */
export const EVENT_BANNERS: EventBanner[] = [
  {
    id: 'evento-etapas-de-fantasia',
    name: 'Etapas de Fantasía',
    timeWindows: [
      // Ventana amplia que cubre el desarrollo/pruebas actuales, y una segunda ventana futura no solapada (US4).
      { startMs: Date.parse('2026-01-01T00:00:00Z'), endMs: Date.parse('2026-12-31T23:59:59Z') },
      { startMs: Date.parse('2027-06-01T00:00:00Z'), endMs: Date.parse('2027-06-08T00:00:00Z') },
    ],
    specialStage: {
      id: 'evento-etapas-de-fantasia-fase-especial',
      name: 'Etapas de Fantasía: Fase Especial',
      playerBaseHp: 1000,
      enemyBaseHp: 800,
      maxEnergy: 100,
      energyRegenPerSecond: 5,
      currencyReward: 300,
      enemyWave: [
        { catId: 'speed-cat', spawnAtSeconds: 3 },
        { catId: 'solar-cat', spawnAtSeconds: 12 },
        { catId: 'armored-cat', spawnAtSeconds: 25 },
      ],
      energyCost: EVENT_ENERGY_COST,
      region: 'evento-etapas-de-fantasia',
      difficulty: 3,
      treasureId: 'tesoro-evento-etapas-de-fantasia',
    },
    energyCost: EVENT_ENERGY_COST,
  },
]
