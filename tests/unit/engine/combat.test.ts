import { describe, expect, it } from 'vitest'
import { resolveBaseDamage, resolveEngagement } from '../../../src/engine/combat'
import type { BattleUnit } from '../../../src/engine/types'

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
    state: 'Engaged',
    ...overrides,
  }
}

describe('resolveEngagement', () => {
  it('aplica daño a ambas unidades cuando su cooldown venció', () => {
    const a = makeUnit({ instanceId: 'a', damage: 10, attackCooldownRemaining: 0 })
    const b = makeUnit({ instanceId: 'b', damage: 15, attackCooldownRemaining: 0 })

    const result = resolveEngagement(a, b, 0.1)

    expect(result.a.hp).toBe(a.hp - 15)
    expect(result.b.hp).toBe(b.hp - 10)
  })

  it('no aplica daño mientras el cooldown de ataque no venció', () => {
    const a = makeUnit({ instanceId: 'a', attackCooldownRemaining: 5 })
    const b = makeUnit({ instanceId: 'b', attackCooldownRemaining: 5 })

    const result = resolveEngagement(a, b, 0.1)

    expect(result.a.hp).toBe(a.hp)
    expect(result.b.hp).toBe(b.hp)
  })

  it('marca Dead a la unidad cuya salud llega a 0 o menos', () => {
    const a = makeUnit({ instanceId: 'a', hp: 5, damage: 1, attackCooldownRemaining: 0 })
    const b = makeUnit({ instanceId: 'b', hp: 100, damage: 100, attackCooldownRemaining: 0 })

    const result = resolveEngagement(a, b, 0.1)

    expect(result.a.hp).toBe(0)
    expect(result.a.state).toBe('Dead')
    expect(result.b.state).not.toBe('Dead')
  })

  it('una unidad ya Dead no inflige daño', () => {
    const a = makeUnit({ instanceId: 'a', state: 'Dead', damage: 999, attackCooldownRemaining: 0 })
    const b = makeUnit({ instanceId: 'b', hp: 50, attackCooldownRemaining: 0 })

    const result = resolveEngagement(a, b, 0.1)

    expect(result.b.hp).toBe(50)
  })
})

describe('resolveBaseDamage', () => {
  it('reduce la salud de la base cuando el cooldown del atacante venció', () => {
    const attacker = makeUnit({ damage: 25, attackCooldownRemaining: 0 })
    const base = { hp: 100, maxHp: 100 }

    const result = resolveBaseDamage(attacker, base, 0.1)

    expect(result.base.hp).toBe(75)
    expect(result.attacker.attackCooldownRemaining).toBeCloseTo(attacker.attackIntervalSeconds - 0.1)
  })

  it('no reduce la salud de la base mientras el cooldown no venció', () => {
    const attacker = makeUnit({ damage: 25, attackCooldownRemaining: 3 })
    const base = { hp: 100, maxHp: 100 }

    const result = resolveBaseDamage(attacker, base, 0.1)

    expect(result.base.hp).toBe(100)
  })

  it('la salud de la base nunca baja de 0', () => {
    const attacker = makeUnit({ damage: 500, attackCooldownRemaining: 0 })
    const base = { hp: 10, maxHp: 100 }

    const result = resolveBaseDamage(attacker, base, 0.1)

    expect(result.base.hp).toBe(0)
  })
})
