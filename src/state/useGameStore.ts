import { create } from 'zustand'
import { CATS, getEffectiveCatStats } from '../data/cats'
import { resolveLevel } from '../data/events'
import { findArcByLevelId } from '../data/sagaArcs'
import { withinRange1D } from '../engine/collision'
import { getPlayerBaseExtent, LANE_LENGTH, stepSimulation } from '../engine/simulation'
import { useMetaStore } from './useMetaStore'
import type { EnemyWaveEntry } from '../data/levels'
import type { BattleUnit } from '../engine/types'

export type { BattleUnit }

interface SpecialCannonState {
  rechargeRemaining: number
  rechargeDurationSeconds: number
  areaRadius: number
  damage: number
}

/** specs/012-saga-imperio-de-los-gatos (US5). Valores de diseño provisionales, no balanceados. */
const SPECIAL_CANNON_DEFAULTS: SpecialCannonState = {
  rechargeRemaining: 20,
  rechargeDurationSeconds: 20,
  areaRadius: 40,
  damage: 50,
}

interface GameFields {
  status: 'Idle' | 'InProgress' | 'Victory' | 'Defeat'
  levelId: string | null
  energy: { current: number; max: number; regenPerSecond: number }
  playerBase: { hp: number; maxHp: number }
  enemyBase: { hp: number; maxHp: number }
  units: BattleUnit[]
  deployCooldowns: Record<string, number>
  elapsedSeconds: number
  enemiesSpawnedCount: number
  /** specs/012-saga-imperio-de-los-gatos (US7). */
  activeEnemyWave?: EnemyWaveEntry[]
  /** specs/012-saga-imperio-de-los-gatos (US2). */
  pendingReinforcements?: EnemyWaveEntry[]
  /** specs/012-saga-imperio-de-los-gatos (US2). */
  triggeredBaseHpThresholdPercents?: number[]
  /** specs/012-saga-imperio-de-los-gatos (US5). */
  specialCannon: SpecialCannonState
  /** specs/013-escalado-capitulos-sets-tesoros (US3). Poblado en `startLevel` desde `level.laneLength ?? LANE_LENGTH`. */
  laneLength: number
  /** specs/017-objetos-de-batalla (US2/FR-008). Poblado en `startLevel` desde el objeto "Aceleración de Velocidad" consumido, si lo hubo. */
  unitSpeedMultiplier: number
  /** specs/020-barrera-de-base (FR-002). Derivado por `stepSimulation` en cada `tick()` — solo lectura, nunca escrito directamente aquí. */
  bossBarrierActive: boolean
}

interface BattleItemEffects {
  speedMultiplier?: number
  energyBonus?: number
}

interface GameState extends GameFields {
  startLevel: (levelId: string, zombieMode?: boolean, battleItemEffects?: BattleItemEffects) => void
  tick: (deltaSeconds: number) => void
  deployUnit: (catId: string) => boolean
  activateSpecialCannon: () => boolean
  boostEnergyRegen: (cost: number, increment: number) => boolean
  reset: () => void
}

const IDLE_STATE: GameFields = {
  status: 'Idle',
  levelId: null,
  energy: { current: 0, max: 0, regenPerSecond: 0 },
  playerBase: { hp: 0, maxHp: 0 },
  enemyBase: { hp: 0, maxHp: 0 },
  units: [],
  deployCooldowns: {},
  elapsedSeconds: 0,
  enemiesSpawnedCount: 0,
  specialCannon: { ...SPECIAL_CANNON_DEFAULTS },
  laneLength: LANE_LENGTH,
  unitSpeedMultiplier: 1,
  bossBarrierActive: false,
}

export const useGameStore = create<GameState>((set, get) => ({
  ...IDLE_STATE,

  startLevel: (levelId, zombieMode = false, battleItemEffects = {}) => {
    // specs/014-banner-evento-especial (FR-005): resuelve tanto LEVELS como la specialStage de un EventBanner.
    const level = resolveLevel(levelId)
    if (!level) return

    // specs/012-saga-imperio-de-los-gatos (US7/FR-011): resuelto una sola vez, nunca releído de LEVELS en cada tick.
    const activeEnemyWave = zombieMode && level.zombieWave ? level.zombieWave : level.enemyWave

    // specs/013-escalado-capitulos-sets-tesoros (US1/FR-001): mismo enemyStrengthMultiplier de specs/012, aplicado
    // aquí a la vida de la base enemiga — stepSimulation sigue operando solo sobre SimState.enemyBase ya resuelto.
    const enemyStrengthMultiplier = findArcByLevelId(levelId)?.enemyStrengthMultiplier ?? 1
    const enemyBaseHp = Math.round(level.enemyBaseHp * enemyStrengthMultiplier)

    // specs/013-escalado-capitulos-sets-tesoros (US4/FR-007): bonificación pasiva de sets de tesoros ya otorgados.
    const energyRegenMultiplier = useMetaStore.getState().getActiveBonusMultiplier('EnergyRegenMultiplier')

    set({
      status: 'InProgress',
      levelId,
      // specs/017-objetos-de-batalla (US2/FR-008): "Energía Extra" consumida se suma a la energía inicial de batalla.
      energy: {
        current: battleItemEffects.energyBonus ?? 0,
        max: level.maxEnergy,
        regenPerSecond: level.energyRegenPerSecond * energyRegenMultiplier,
      },
      playerBase: { hp: level.playerBaseHp, maxHp: level.playerBaseHp },
      enemyBase: { hp: enemyBaseHp, maxHp: enemyBaseHp },
      units: [],
      deployCooldowns: {},
      elapsedSeconds: 0,
      enemiesSpawnedCount: 0,
      activeEnemyWave,
      pendingReinforcements: [],
      triggeredBaseHpThresholdPercents: [],
      specialCannon: { ...SPECIAL_CANNON_DEFAULTS, rechargeRemaining: SPECIAL_CANNON_DEFAULTS.rechargeDurationSeconds },
      // specs/013-escalado-capitulos-sets-tesoros (US3/FR-004/FR-005).
      laneLength: level.laneLength ?? LANE_LENGTH,
      // specs/017-objetos-de-batalla (US2/FR-008): "Aceleración de Velocidad" consumida, aplicada a toda unidad creada.
      unitSpeedMultiplier: battleItemEffects.speedMultiplier ?? 1,
    })
  },

  tick: (deltaSeconds) => {
    set({
      ...stepSimulation(get(), deltaSeconds),
      specialCannon: {
        ...get().specialCannon,
        rechargeRemaining: Math.max(0, get().specialCannon.rechargeRemaining - deltaSeconds),
      },
    })
  },

  deployUnit: (catId) => {
    const cat = CATS.find((candidate) => candidate.id === catId)
    if (!cat) return false

    const { energy, deployCooldowns, units, levelId, unitSpeedMultiplier } = get()
    // specs/012-saga-imperio-de-los-gatos (US1/FR-002): costMultiplier del arco activo, redondeado, sin modificar Cat.cost.
    const costMultiplier = findArcByLevelId(levelId)?.costMultiplier ?? 1
    const effectiveCost = Math.round(cat.cost * costMultiplier)
    if (energy.current < effectiveCost) return false
    if ((deployCooldowns[catId] ?? 0) > 0) return false

    // specs/010-evolucion-de-gatos: único punto de aplicación del multiplicador de evolución —
    // src/engine/ nunca vuelve a mirar Cat, solo opera sobre el BattleUnit ya resuelto (FR-008).
    // specs/018-bibliotecas-consulta (US1): misma fórmula reutilizada por CatGuideScreen vía getEffectiveCatStats.
    const evolutionStage = useMetaStore.getState().ownedCats[catId]?.evolutionStage ?? 'Base'
    const effectiveStats = getEffectiveCatStats(cat, evolutionStage)

    const unit: BattleUnit = {
      instanceId: `${catId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      catId,
      team: 'Player',
      x: 0,
      width: cat.width,
      hp: effectiveStats.hp,
      maxHp: effectiveStats.hp,
      damage: effectiveStats.damage,
      attackIntervalSeconds: cat.attackIntervalSeconds,
      attackCooldownRemaining: 0,
      // specs/017-objetos-de-batalla (US2/FR-008): "Aceleración de Velocidad" consumida, simétrica jugador/enemigo.
      speed: cat.speed * unitSpeedMultiplier,
      state: 'Moving',
      attackType: cat.attackType,
      attackRange: cat.attackRange,
      areaRadius: cat.areaRadius,
      classification: cat.classification,
      specialClassification: cat.specialClassification,
      abilities: cat.abilities,
      immuneEffects: cat.immuneEffects,
      appliesEffect: cat.appliesEffect,
      curseRemainingSeconds: 0,
      resistantTo: cat.resistantTo,
      hitsPerSequence: cat.hitsPerSequence,
      criticalChance: cat.criticalChance,
    }

    set({
      energy: { ...energy, current: energy.current - effectiveCost },
      deployCooldowns: { ...deployCooldowns, [catId]: cat.cooldownSeconds },
      units: [...units, unit],
    })
    return true
  },

  activateSpecialCannon: () => {
    const { specialCannon, units, laneLength } = get()
    if (specialCannon.rechargeRemaining > 0) return false

    const playerBaseExtent = getPlayerBaseExtent(laneLength)
    const nextUnits = units
      .map((unit) => {
        if (unit.team !== 'Enemy' || !withinRange1D(playerBaseExtent, unit, specialCannon.areaRadius)) return unit
        const hp = Math.max(0, unit.hp - specialCannon.damage)
        return { ...unit, hp, state: hp <= 0 ? ('Dead' as const) : unit.state }
      })
      .filter((unit) => unit.state !== 'Dead')

    set({
      units: nextUnits,
      specialCannon: { ...specialCannon, rechargeRemaining: specialCannon.rechargeDurationSeconds },
    })
    return true
  },

  boostEnergyRegen: (cost, increment) => {
    const { energy } = get()
    if (energy.current < cost) return false
    set({ energy: { ...energy, current: energy.current - cost, regenPerSecond: energy.regenPerSecond + increment } })
    return true
  },

  reset: () => set({ ...IDLE_STATE, specialCannon: { ...SPECIAL_CANNON_DEFAULTS } }),
}))
