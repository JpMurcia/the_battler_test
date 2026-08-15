import { CATS } from '../data/cats'
import { LEVELS } from '../data/levels'
import { overlaps1D, type Extent } from './collision'
import { resolveBaseDamage, resolveEngagement } from './combat'
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
  }
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
  const engagementPairs: [string, string][] = []
  const baseAttackers: string[] = []
  const freeMovers: string[] = []

  for (const unit of alive) {
    if (processed.has(unit.instanceId)) continue
    const enemyTeam = unit.team === 'Player' ? 'Enemy' : 'Player'
    const opponent = alive.find((candidate) => candidate.team === enemyTeam && !processed.has(candidate.instanceId) && overlaps1D(unit, candidate))

    if (opponent) {
      processed.add(unit.instanceId)
      processed.add(opponent.instanceId)
      engagementPairs.push([unit.instanceId, opponent.instanceId])
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

  for (const [aId, bId] of engagementPairs) {
    const a = byId.get(aId)!
    const b = byId.get(bId)!
    const result = resolveEngagement({ ...a, state: 'Engaged' }, { ...b, state: 'Engaged' }, deltaSeconds)
    byId.set(aId, result.a)
    byId.set(bId, result.b)
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

  const units = Array.from(byId.values()).filter((unit) => unit.state !== 'Dead')

  if (playerBase.hp <= 0) {
    return { ...state, status: 'Defeat', playerBase, enemyBase, units, energy, deployCooldowns, elapsedSeconds, enemiesSpawnedCount }
  }
  if (enemyBase.hp <= 0) {
    return { ...state, status: 'Victory', playerBase, enemyBase, units, energy, deployCooldowns, elapsedSeconds, enemiesSpawnedCount }
  }

  return { ...state, playerBase, enemyBase, units, energy, deployCooldowns, elapsedSeconds, enemiesSpawnedCount }
}
