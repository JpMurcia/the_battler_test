import { CATS } from '../data/cats'
import { LEVELS } from '../data/levels'
import { edgeGap, overlaps1D, withinRange1D, type Extent } from './collision'
import { resolveAreaEngagement, resolveBaseDamage, resolveEngagement } from './combat'
import type { BattleUnit } from './types'

export const LANE_LENGTH = 400
const BASE_WIDTH = 24

export const PLAYER_BASE_EXTENT: Extent = { x: -BASE_WIDTH, width: BASE_WIDTH }
export const ENEMY_BASE_EXTENT: Extent = { x: LANE_LENGTH, width: BASE_WIDTH }

interface BaseHp {
  hp: number
  maxHp: number
}

export interface SimState {
  status: 'Idle' | 'InProgress' | 'Victory' | 'Defeat'
  levelId: string | null
  energy: { current: number; max: number; regenPerSecond: number }
  playerBase: BaseHp
  enemyBase: BaseHp
  units: BattleUnit[]
  deployCooldowns: Record<string, number>
  elapsedSeconds: number
  enemiesSpawnedCount: number
}

function spawnEnemyUnit(catId: string): BattleUnit | null {
  const cat = CATS.find((candidate) => candidate.id === catId)
  if (!cat) return null
  return {
    instanceId: `enemy-${cat.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    catId: cat.id,
    team: 'Enemy',
    x: LANE_LENGTH - cat.width,
    width: cat.width,
    hp: cat.hp,
    maxHp: cat.hp,
    damage: cat.damage,
    attackIntervalSeconds: cat.attackIntervalSeconds,
    attackCooldownRemaining: 0,
    speed: cat.speed,
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
  }
}

/**
 * specs/008-tipos-de-ataque: generaliza "el primer oponente que se superpone" a los 3 tipos de ataque.
 * `candidates` ya debe venir filtrado al equipo enemigo y a instancias no procesadas todavía este tick.
 * - 'Single' (por defecto): el candidato más cercano dentro de `attackRange`.
 * - 'LongRange': el candidato más lejano dentro de `attackRange`.
 * - 'Area': el más cercano (objetivo primario) + todo candidato adicional dentro de `areaRadius` de ese primario.
 */
export function findTargetsInRange(unit: BattleUnit, candidates: BattleUnit[]): BattleUnit[] {
  const attackType = unit.attackType ?? 'Single'
  const attackRange = unit.attackRange ?? 0
  const inRange = candidates.filter((candidate) => withinRange1D(unit, candidate, attackRange))
  if (inRange.length === 0) return []

  if (attackType === 'LongRange') {
    const farthest = inRange.reduce((best, candidate) => (edgeGap(unit, candidate) > edgeGap(unit, best) ? candidate : best))
    return [farthest]
  }

  const primary = inRange.reduce((best, candidate) => (edgeGap(unit, candidate) < edgeGap(unit, best) ? candidate : best))

  if (attackType === 'Area') {
    const areaRadius = unit.areaRadius ?? 0
    const splash = candidates.filter(
      (candidate) => candidate.instanceId !== primary.instanceId && withinRange1D(primary, candidate, areaRadius),
    )
    return [primary, ...splash]
  }

  return [primary]
}

/** Paso de simulación puro y determinista — sin temporizadores internos, sin dependencias de React/Pixi. */
export function stepSimulation(state: SimState, deltaSeconds: number): SimState {
  if (state.status !== 'InProgress') return state

  const elapsedSeconds = state.elapsedSeconds + deltaSeconds
  const energy = {
    ...state.energy,
    current: Math.min(state.energy.max, state.energy.current + state.energy.regenPerSecond * deltaSeconds),
  }
  const deployCooldowns = Object.fromEntries(
    Object.entries(state.deployCooldowns).map(([catId, remaining]) => [catId, Math.max(0, remaining - deltaSeconds)]),
  )

  // Spawnear las entradas de la oleada enemiga cuyo spawnAtSeconds ya venció.
  const level = LEVELS.find((candidate) => candidate.id === state.levelId)
  const spawned: BattleUnit[] = []
  let enemiesSpawnedCount = state.enemiesSpawnedCount
  if (level) {
    while (enemiesSpawnedCount < level.enemyWave.length && level.enemyWave[enemiesSpawnedCount].spawnAtSeconds <= elapsedSeconds) {
      const unit = spawnEnemyUnit(level.enemyWave[enemiesSpawnedCount].catId)
      if (unit) spawned.push(unit)
      enemiesSpawnedCount += 1
    }
  }

  const alive = [...state.units, ...spawned]
  const byId = new Map(alive.map((unit) => [unit.instanceId, unit]))
  const processed = new Set<string>()
  const engagements: { attackerId: string; targetIds: string[] }[] = []
  const baseAttackers: string[] = []
  const freeMovers: string[] = []

  for (const unit of alive) {
    if (processed.has(unit.instanceId)) continue
    const enemyTeam = unit.team === 'Player' ? 'Enemy' : 'Player'
    const candidatesInTeam = alive.filter((candidate) => candidate.team === enemyTeam && !processed.has(candidate.instanceId))
    const targets = findTargetsInRange(unit, candidatesInTeam)

    if (targets.length > 0) {
      processed.add(unit.instanceId)
      for (const target of targets) processed.add(target.instanceId)
      engagements.push({ attackerId: unit.instanceId, targetIds: targets.map((target) => target.instanceId) })
      continue
    }

    const opponentBaseExtent = unit.team === 'Player' ? ENEMY_BASE_EXTENT : PLAYER_BASE_EXTENT
    if (overlaps1D(unit, opponentBaseExtent)) {
      processed.add(unit.instanceId)
      baseAttackers.push(unit.instanceId)
      continue
    }

    processed.add(unit.instanceId)
    freeMovers.push(unit.instanceId)
  }

  let playerBase = { ...state.playerBase }
  let enemyBase = { ...state.enemyBase }

  for (const { attackerId, targetIds } of engagements) {
    const attacker = { ...byId.get(attackerId)!, state: 'Engaged' as const }
    const primary = { ...byId.get(targetIds[0])!, state: 'Engaged' as const }

    if ((attacker.attackType ?? 'Single') === 'Area' && targetIds.length > 1) {
      const splashTargets = targetIds.slice(1).map((id) => byId.get(id)!)
      const result = resolveAreaEngagement(attacker, primary, splashTargets, deltaSeconds)
      byId.set(attackerId, result.attacker)
      byId.set(targetIds[0], result.primaryTarget)
      result.splashTargets.forEach((target, index) => byId.set(targetIds[index + 1], target))
    } else {
      const result = resolveEngagement(attacker, primary, deltaSeconds)
      byId.set(attackerId, result.a)
      byId.set(targetIds[0], result.b)
    }
  }

  for (const id of baseAttackers) {
    const unit = byId.get(id)!
    const targetBase = unit.team === 'Player' ? enemyBase : playerBase
    const result = resolveBaseDamage(unit, targetBase, deltaSeconds)
    byId.set(id, result.attacker)
    if (unit.team === 'Player') enemyBase = result.base
    else playerBase = result.base
  }

  for (const id of freeMovers) {
    const unit = byId.get(id)!
    const direction = unit.team === 'Player' ? 1 : -1
    const tentativeX = unit.x + direction * unit.speed * deltaSeconds
    const blockedByAlly = alive.some(
      (candidate) =>
        candidate.instanceId !== unit.instanceId &&
        candidate.team === unit.team &&
        candidate.state !== 'Moving' &&
        overlaps1D({ x: tentativeX, width: unit.width }, candidate),
    )
    byId.set(id, { ...unit, x: blockedByAlly ? unit.x : tentativeX, state: 'Moving' })
  }

  // specs/009-clasificacion-habilidades (US5): Curse decae por tiempo real, para toda unidad viva sin importar su acción este tick.
  for (const [id, unit] of byId) {
    if ((unit.curseRemainingSeconds ?? 0) > 0) {
      byId.set(id, { ...unit, curseRemainingSeconds: Math.max(0, unit.curseRemainingSeconds! - deltaSeconds) })
    }
  }

  const units = Array.from(byId.values()).filter((unit) => unit.state !== 'Dead')

  if (playerBase.hp <= 0) {
    return { ...state, status: 'Defeat', playerBase, enemyBase, units, energy, deployCooldowns, elapsedSeconds, enemiesSpawnedCount }
  }
  if (enemyBase.hp <= 0) {
    return { ...state, status: 'Victory', playerBase, enemyBase, units, energy, deployCooldowns, elapsedSeconds, enemiesSpawnedCount }
  }

  return { ...state, playerBase, enemyBase, units, energy, deployCooldowns, elapsedSeconds, enemiesSpawnedCount }
}
