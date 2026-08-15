import { describe, expect, it } from 'vitest'
import { resolveAbilityMultiplier, resolveAreaEngagement, resolveBaseDamage, resolveEngagement } from '../../../src/engine/combat'
import type { BattleUnit, ClassificationType } from '../../../src/engine/types'

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

describe('resolveAbilityMultiplier', () => {
  it('Neutral siempre coincide, sin importar la clasificación del defensor', () => {
    const attacker = makeUnit({ abilities: [{ kind: 'Neutral', damageMultiplier: 3 }] })
    const defender = makeUnit({ classification: 'Zombie' })

    expect(resolveAbilityMultiplier(attacker, defender)).toBe(3)
  })

  it('Neutral coincide incluso contra un defensor con tipo especial', () => {
    const attacker = makeUnit({ abilities: [{ kind: 'Neutral', damageMultiplier: 2 }] })
    const defender = makeUnit({ classification: 'Red', specialClassification: 'Metal' })

    expect(resolveAbilityMultiplier(attacker, defender)).toBe(2)
  })

  it('TraitTargeting solo coincide con la clasificación declarada', () => {
    const attacker = makeUnit({ abilities: [{ kind: 'TraitTargeting', targetClassifications: ['Floating'], damageMultiplier: 4 }] })

    expect(resolveAbilityMultiplier(attacker, makeUnit({ classification: 'Floating' }))).toBe(4)
    expect(resolveAbilityMultiplier(attacker, makeUnit({ classification: 'Red' }))).toBe(1)
  })

  it('un defensor sin classification declarada se trata como Traitless (FR-011)', () => {
    const attacker = makeUnit({ abilities: [{ kind: 'TraitTargeting', targetClassifications: ['Traitless'], damageMultiplier: 5 }] })
    const defender = makeUnit({}) // sin classification

    expect(resolveAbilityMultiplier(attacker, defender)).toBe(5)
  })

  it('TraitTargeting "contra todos los estándar" no alcanza un tipo especial salvo inclusión explícita (US4)', () => {
    const allStandard: ClassificationType[] = [
      'Red',
      'Floating',
      'Black',
      'Angel',
      'Alien',
      'Zombie',
      'Relic',
      'Traitless',
    ]
    const attacker = makeUnit({ abilities: [{ kind: 'TraitTargeting', targetClassifications: allStandard, damageMultiplier: 2 }] })
    const specialDefender = makeUnit({ classification: 'Red', specialClassification: 'Metal' })

    expect(resolveAbilityMultiplier(attacker, specialDefender)).toBe(1)

    const attackerWithMetal = makeUnit({
      abilities: [{ kind: 'TraitTargeting', targetClassifications: [...allStandard, 'Metal'], damageMultiplier: 2 }],
    })
    expect(resolveAbilityMultiplier(attackerWithMetal, specialDefender)).toBe(2)
  })

  it('un atacante Cursed no aplica ninguna habilidad, incluso si la clasificación coincide (FR-009)', () => {
    const attacker = makeUnit({
      abilities: [{ kind: 'TraitTargeting', targetClassifications: ['Red'], damageMultiplier: 10 }],
      curseRemainingSeconds: 3,
    })
    const defender = makeUnit({ classification: 'Red' })

    expect(resolveAbilityMultiplier(attacker, defender)).toBe(1)
  })
})

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

  it('aplica el multiplicador de una TraitTargeting contra el tipo objetivo, no contra otro tipo (specs/009 US2)', () => {
    const ability = { kind: 'TraitTargeting' as const, targetClassifications: ['Floating' as const], damageMultiplier: 3 }
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, abilities: [ability] })
    const floatingDefender = makeUnit({ instanceId: 'floating', hp: 100, classification: 'Floating', attackCooldownRemaining: 5 })
    const redDefender = makeUnit({ instanceId: 'red', hp: 100, classification: 'Red', attackCooldownRemaining: 5 })

    const againstFloating = resolveEngagement(attacker, floatingDefender, 0.1)
    const againstRed = resolveEngagement(attacker, redDefender, 0.1)

    expect(againstFloating.b.hp).toBe(70) // 100 - 10*3
    expect(againstRed.b.hp).toBe(90) // 100 - 10*1 (sin coincidencia)
  })

  it('aplica Curse al defensor no inmune en un golpe exitoso y lo refresca sin acumular (FR-008)', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 5,
      attackCooldownRemaining: 0,
      appliesEffect: { type: 'Curse', durationSeconds: 4 },
    })
    const defender = makeUnit({ instanceId: 'defender', attackCooldownRemaining: 5, curseRemainingSeconds: 1 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.curseRemainingSeconds).toBe(4)
  })

  it('no aplica Curse a un defensor inmune (specs/009 US5, FR-008)', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 5,
      attackCooldownRemaining: 0,
      appliesEffect: { type: 'Curse', durationSeconds: 4 },
    })
    const defender = makeUnit({ instanceId: 'defender', attackCooldownRemaining: 5, immuneEffects: ['Curse'] })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.curseRemainingSeconds ?? 0).toBe(0)
  })

  it('mientras un atacante está Cursed, sus habilidades no aplican multiplicador en combate real (FR-009)', () => {
    const ability = { kind: 'TraitTargeting' as const, targetClassifications: ['Red' as const], damageMultiplier: 5 }
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      abilities: [ability],
      curseRemainingSeconds: 2,
    })
    const defender = makeUnit({ instanceId: 'defender', hp: 100, classification: 'Red', attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(90) // daño base, sin el x5
  })
})

describe('resolveAreaEngagement', () => {
  it('daña al objetivo primario y a todos los objetivos de salpicadura en el mismo tick (FR-004)', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, attackType: 'Area' })
    const primary = makeUnit({ instanceId: 'primary', hp: 50, attackCooldownRemaining: 5 })
    const splashA = makeUnit({ instanceId: 'splash-a', hp: 50, attackCooldownRemaining: 5 })
    const splashB = makeUnit({ instanceId: 'splash-b', hp: 50, attackCooldownRemaining: 5 })

    const result = resolveAreaEngagement(attacker, primary, [splashA, splashB], 0.1)

    expect(result.primaryTarget.hp).toBe(40)
    expect(result.splashTargets[0].hp).toBe(40)
    expect(result.splashTargets[1].hp).toBe(40)
  })

  it('no aplica daño de salpicadura si el cooldown del atacante no venció', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 5, attackType: 'Area' })
    const primary = makeUnit({ instanceId: 'primary', hp: 50, attackCooldownRemaining: 5 })
    const splash = makeUnit({ instanceId: 'splash', hp: 50, attackCooldownRemaining: 5 })

    const result = resolveAreaEngagement(attacker, primary, [splash], 0.1)

    expect(result.splashTargets[0].hp).toBe(50)
  })

  it('el objetivo primario contraataca al atacante igual que en resolveEngagement, sin afectar a la salpicadura', () => {
    const attacker = makeUnit({ instanceId: 'attacker', hp: 50, damage: 10, attackCooldownRemaining: 5, attackType: 'Area' })
    const primary = makeUnit({ instanceId: 'primary', damage: 20, attackCooldownRemaining: 0 })
    const splash = makeUnit({ instanceId: 'splash', hp: 50, attackCooldownRemaining: 5 })

    const result = resolveAreaEngagement(attacker, primary, [splash], 0.1)

    expect(result.attacker.hp).toBe(30)
    expect(result.splashTargets[0].hp).toBe(50)
  })

  it('marca Dead a un objetivo de salpicadura cuya salud llega a 0', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 100, attackCooldownRemaining: 0, attackType: 'Area' })
    const primary = makeUnit({ instanceId: 'primary', hp: 50, attackCooldownRemaining: 5 })
    const splash = makeUnit({ instanceId: 'splash', hp: 50, attackCooldownRemaining: 5 })

    const result = resolveAreaEngagement(attacker, primary, [splash], 0.1)

    expect(result.splashTargets[0].hp).toBe(0)
    expect(result.splashTargets[0].state).toBe('Dead')
  })

  it('evalúa el multiplicador de habilidad de cada objetivo de salpicadura contra su propia clasificación (specs/009 T007)', () => {
    const ability = { kind: 'TraitTargeting' as const, targetClassifications: ['Floating' as const], damageMultiplier: 3 }
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, attackType: 'Area', abilities: [ability] })
    const primary = makeUnit({ instanceId: 'primary', hp: 100, classification: 'Floating', attackCooldownRemaining: 5 })
    const floatingSplash = makeUnit({ instanceId: 'floating-splash', hp: 100, classification: 'Floating', attackCooldownRemaining: 5 })
    const redSplash = makeUnit({ instanceId: 'red-splash', hp: 100, classification: 'Red', attackCooldownRemaining: 5 })

    const result = resolveAreaEngagement(attacker, primary, [floatingSplash, redSplash], 0.1)

    expect(result.primaryTarget.hp).toBe(70) // 100 - 10*3
    expect(result.splashTargets[0].hp).toBe(70) // Floating, coincide
    expect(result.splashTargets[1].hp).toBe(90) // Red, no coincide -> daño base
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
