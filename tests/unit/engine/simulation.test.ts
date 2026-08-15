import { describe, expect, it } from 'vitest'
import type { BattleUnit } from '../../../src/engine/types'
import { ENEMY_BASE_EXTENT, type SimState, stepSimulation } from '../../../src/engine/simulation'

function makeUnit(overrides: Partial<BattleUnit> = {}): BattleUnit {
  return {
    instanceId: 'unit-1',
    catId: 'basic-cat',
    team: 'Player',
    x: 0,
    width: 16,
    hp: 50,
    maxHp: 50,
    damage: 10,
    attackIntervalSeconds: 1,
    attackCooldownRemaining: 0,
    speed: 20,
    state: 'Moving',
    ...overrides,
  }
}

function makeState(overrides: Partial<SimState> = {}): SimState {
  return {
    status: 'InProgress',
    levelId: 'level-1',
    energy: { current: 0, max: 100, regenPerSecond: 5 },
    playerBase: { hp: 1000, maxHp: 1000 },
    enemyBase: { hp: 1000, maxHp: 1000 },
    units: [],
    deployCooldowns: {},
    elapsedSeconds: 0,
    enemiesSpawnedCount: 3, // sin oleada pendiente salvo que el test la reactive
    ...overrides,
  }
}

describe('stepSimulation', () => {
  it('mueve una unidad sin bloqueo según su velocidad', () => {
    const unit = makeUnit({ x: 0, speed: 20 })
    const next = stepSimulation(makeState({ units: [unit] }), 1)

    expect(next.units[0].x).toBe(20)
    expect(next.units[0].state).toBe('Moving')
  })

  it('bloquea y combate cuando dos unidades enemigas se superponen', () => {
    const player = makeUnit({ instanceId: 'p1', team: 'Player', x: 0, width: 16, damage: 10, attackCooldownRemaining: 0 })
    const enemy = makeUnit({ instanceId: 'e1', team: 'Enemy', x: 5, width: 16, damage: 8, attackCooldownRemaining: 0 })

    const next = stepSimulation(makeState({ units: [player, enemy] }), 0.5)

    const nextPlayer = next.units.find((u) => u.instanceId === 'p1')!
    const nextEnemy = next.units.find((u) => u.instanceId === 'e1')!
    expect(nextPlayer.state).toBe('Engaged')
    expect(nextEnemy.state).toBe('Engaged')
    expect(nextPlayer.x).toBe(0) // no avanza mientras está bloqueada
    expect(nextEnemy.hp).toBeLessThan(50)
    expect(nextPlayer.hp).toBeLessThan(50)
  })

  it('inflige daño directo a la base enemiga cuando ninguna unidad bloquea el camino', () => {
    const unit = makeUnit({
      x: ENEMY_BASE_EXTENT.x,
      width: 16,
      damage: 30,
      attackCooldownRemaining: 0,
    })

    const next = stepSimulation(makeState({ units: [unit], enemyBase: { hp: 100, maxHp: 100 } }), 0.2)

    expect(next.enemyBase.hp).toBe(70)
    expect(next.units[0].x).toBe(ENEMY_BASE_EXTENT.x) // no avanza mientras ataca la base
  })

  it('regenera energía con el tiempo hasta el máximo del nivel', () => {
    const next = stepSimulation(makeState({ energy: { current: 98, max: 100, regenPerSecond: 5 } }), 1)
    expect(next.energy.current).toBe(100) // clamp al máximo, no 103
  })

  it('spawnea una entrada de la oleada enemiga exactamente cuando su spawnAtSeconds vence', () => {
    const before = stepSimulation(makeState({ elapsedSeconds: 4.8, enemiesSpawnedCount: 0 }), 0.1)
    expect(before.enemiesSpawnedCount).toBe(0)
    expect(before.units).toHaveLength(0)

    const after = stepSimulation(makeState({ elapsedSeconds: 4.9, enemiesSpawnedCount: 0 }), 0.2)
    expect(after.enemiesSpawnedCount).toBe(1)
    expect(after.units).toHaveLength(1)
    expect(after.units[0].team).toBe('Enemy')
    expect(after.units[0].catId).toBe('basic-cat')
  })

  it('resuelve Defeat cuando la base del jugador llega a 0 y detiene todo movimiento posterior', () => {
    const lethalUnit = makeUnit({
      team: 'Enemy',
      x: -24, // PLAYER_BASE_EXTENT.x
      width: 24,
      damage: 999,
      attackCooldownRemaining: 0,
    })
    const state = makeState({ units: [lethalUnit], playerBase: { hp: 10, maxHp: 1000 } })

    const afterHit = stepSimulation(state, 0.1)
    expect(afterHit.status).toBe('Defeat')

    const frozen = stepSimulation(afterHit, 1)
    expect(frozen).toBe(afterHit) // no-op: el estado ya no es 'InProgress'
  })

  it('resuelve Victory cuando la base enemiga llega a 0', () => {
    const finisher = makeUnit({
      team: 'Player',
      x: ENEMY_BASE_EXTENT.x,
      width: 16,
      damage: 999,
      attackCooldownRemaining: 0,
    })
    const state = makeState({ units: [finisher], enemyBase: { hp: 10, maxHp: 1000 } })

    const next = stepSimulation(state, 0.1)
    expect(next.status).toBe('Victory')
  })

  it('no avanza el estado cuando status no es InProgress', () => {
    const state = makeState({ status: 'Victory', elapsedSeconds: 42 })
    const next = stepSimulation(state, 5)
    expect(next).toBe(state)
  })
})
