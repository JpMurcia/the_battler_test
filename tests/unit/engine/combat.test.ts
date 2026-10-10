import { describe, expect, it, vi } from 'vitest'
import { applyCannonHead, resolveAbilityMultiplier, resolveAreaEngagement, resolveBaseDamage, resolveEngagement } from '../../../src/engine/combat'
import type { AppliesEffect, BattleUnit, ClassificationType } from '../../../src/engine/types'

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

describe('applyOnHitEffect — catálogo ampliado (specs/015-catalogo-habilidades-combate)', () => {
  it('FR-011: Curse sigue aplicándose exactamente igual que antes (regresión)', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 5,
      attackCooldownRemaining: 0,
      appliesEffect: { type: 'Curse', durationSeconds: 4 },
    })
    const defender = makeUnit({ instanceId: 'defender', attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.curseRemainingSeconds).toBe(4)
  })

  it('FR-001/FR-002: aplica Weaken al campo weakenRemainingSeconds (+ weakenMagnitude) del defensor no inmune', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 5,
      attackCooldownRemaining: 0,
      appliesEffect: { type: 'Weaken', durationSeconds: 3, magnitude: 0.4 },
    })
    const defender = makeUnit({ instanceId: 'defender', attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.weakenRemainingSeconds).toBe(3)
    expect(result.b.weakenMagnitude).toBe(0.4)
  })

  it('aplica Freeze al campo freezeRemainingSeconds del defensor no inmune', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 5,
      attackCooldownRemaining: 0,
      appliesEffect: { type: 'Freeze', durationSeconds: 2 },
    })
    const defender = makeUnit({ instanceId: 'defender', attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.freezeRemainingSeconds).toBe(2)
  })

  it('aplica Slow al campo slowRemainingSeconds (+ slowMagnitude) del defensor no inmune', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 5,
      attackCooldownRemaining: 0,
      appliesEffect: { type: 'Slow', durationSeconds: 5, magnitude: 0.6 },
    })
    const defender = makeUnit({ instanceId: 'defender', attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.slowRemainingSeconds).toBe(5)
    expect(result.b.slowMagnitude).toBe(0.6)
  })

  it('respeta immuneEffects para Weaken/Freeze/Slow igual que ya hace para Curse (specs/009 FR-007)', () => {
    const makeAttacker = (type: 'Weaken' | 'Freeze' | 'Slow') =>
      makeUnit({ instanceId: 'attacker', damage: 5, attackCooldownRemaining: 0, appliesEffect: { type, durationSeconds: 3 } })
    const makeImmuneDefender = (type: 'Weaken' | 'Freeze' | 'Slow') =>
      makeUnit({ instanceId: 'defender', attackCooldownRemaining: 5, immuneEffects: [type] })

    expect(resolveEngagement(makeAttacker('Weaken'), makeImmuneDefender('Weaken'), 0.1).b.weakenRemainingSeconds ?? 0).toBe(0)
    expect(resolveEngagement(makeAttacker('Freeze'), makeImmuneDefender('Freeze'), 0.1).b.freezeRemainingSeconds ?? 0).toBe(0)
    expect(resolveEngagement(makeAttacker('Slow'), makeImmuneDefender('Slow'), 0.1).b.slowRemainingSeconds ?? 0).toBe(0)
  })
})

describe('Debilitar — daño efectivo reducido (specs/015-catalogo-habilidades-combate US1)', () => {
  it('FR-003: una unidad debilitada inflige menos daño que su damage base', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, weakenRemainingSeconds: 2, weakenMagnitude: 0.5 })
    const defender = makeUnit({ instanceId: 'defender', hp: 100, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(95) // 100 - 10*(1-0.5)
  })

  it('sin weakenRemainingSeconds activo, inflige el daño normal', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, weakenRemainingSeconds: 0, weakenMagnitude: 0.5 })
    const defender = makeUnit({ instanceId: 'defender', hp: 100, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(90)
  })

  it('FR-008: un segundo impacto de Weaken antes de expirar refresca sin acumular', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 5,
      attackCooldownRemaining: 0,
      appliesEffect: { type: 'Weaken', durationSeconds: 4, magnitude: 0.5 },
    })
    const defender = makeUnit({ instanceId: 'defender', attackCooldownRemaining: 5, weakenRemainingSeconds: 1, weakenMagnitude: 0.2 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.weakenRemainingSeconds).toBe(4) // refrescado, no 1+4
    expect(result.b.weakenMagnitude).toBe(0.5) // el nuevo magnitude reemplaza al anterior
  })
})

describe('TraitResistance — daño recibido reducido (specs/015-catalogo-habilidades-combate US4)', () => {
  it('FR-007: una unidad con TraitResistance recibe menos daño de un atacante del rasgo listado', () => {
    const resistant = makeUnit({
      instanceId: 'defender',
      hp: 100,
      attackCooldownRemaining: 5,
      abilities: [{ kind: 'TraitResistance', targetClassifications: ['Zombie'], damageTakenMultiplier: 0.5 }],
    })
    const zombieAttacker = makeUnit({ instanceId: 'attacker', damage: 20, attackCooldownRemaining: 0, classification: 'Zombie' })

    const result = resolveEngagement(zombieAttacker, resistant, 0.1)

    expect(result.b.hp).toBe(90) // 100 - 20*0.5
  })

  it('sin coincidencia de rasgo, recibe el daño base sin reducción', () => {
    const resistant = makeUnit({
      instanceId: 'defender',
      hp: 100,
      attackCooldownRemaining: 5,
      abilities: [{ kind: 'TraitResistance', targetClassifications: ['Zombie'], damageTakenMultiplier: 0.5 }],
    })
    const redAttacker = makeUnit({ instanceId: 'attacker', damage: 20, attackCooldownRemaining: 0, classification: 'Red' })

    const result = resolveEngagement(redAttacker, resistant, 0.1)

    expect(result.b.hp).toBe(80) // 100 - 20, sin reducción
  })

  it('coexiste sin interferir con TraitTargeting del atacante declarado en la misma unidad', () => {
    const dualUnit = makeUnit({
      instanceId: 'dual',
      damage: 10,
      hp: 100,
      attackCooldownRemaining: 0,
      classification: 'Traitless',
      abilities: [
        { kind: 'TraitTargeting', targetClassifications: ['Zombie'], damageMultiplier: 3 },
        { kind: 'TraitResistance', targetClassifications: ['Zombie'], damageTakenMultiplier: 0.5 },
      ],
    })
    const zombieEnemy = makeUnit({ instanceId: 'zombie', hp: 100, damage: 20, classification: 'Zombie', attackCooldownRemaining: 0 })

    const result = resolveEngagement(dualUnit, zombieEnemy, 0.1)

    expect(result.b.hp).toBe(70) // zombieEnemy: 100 - 10*3 (TraitTargeting de dualUnit)
    expect(result.a.hp).toBe(90) // dualUnit: 100 - 20*0.5 (su propia TraitResistance)
  })
})

describe('resistantTo — duración de efecto reducida (specs/015-catalogo-habilidades-combate US5)', () => {
  it('FR-009: una unidad con resistantTo sufre menos duración que una sin ella ante el mismo impacto', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 5,
      attackCooldownRemaining: 0,
      appliesEffect: { type: 'Freeze', durationSeconds: 4 },
    })
    const resistantDefender = makeUnit({
      instanceId: 'resistant',
      attackCooldownRemaining: 5,
      resistantTo: [{ effect: 'Freeze', durationMultiplier: 0.5 }],
    })
    const normalDefender = makeUnit({ instanceId: 'normal', attackCooldownRemaining: 5 })

    const resistantResult = resolveEngagement(attacker, resistantDefender, 0.1)
    const normalResult = resolveEngagement(attacker, normalDefender, 0.1)

    expect(resistantResult.b.freezeRemainingSeconds).toBe(2) // 4 * 0.5
    expect(normalResult.b.freezeRemainingSeconds).toBe(4)
  })

  it('Inmunidad total (immuneEffects) sigue bloqueando por completo — distinta de Resistencia', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 5,
      attackCooldownRemaining: 0,
      appliesEffect: { type: 'Freeze', durationSeconds: 4 },
    })
    const immuneDefender = makeUnit({
      instanceId: 'immune',
      attackCooldownRemaining: 5,
      immuneEffects: ['Freeze'],
      resistantTo: [{ effect: 'Freeze', durationMultiplier: 0.9 }],
    })

    const result = resolveEngagement(attacker, immuneDefender, 0.1)

    expect(result.b.freezeRemainingSeconds ?? 0).toBe(0)
  })

  it('una resistencia que deja la duración resultante en ≤0 se comporta como si no se hubiera aplicado', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 5,
      attackCooldownRemaining: 0,
      appliesEffect: { type: 'Freeze', durationSeconds: 4 },
    })
    const defender = makeUnit({
      instanceId: 'defender',
      attackCooldownRemaining: 5,
      resistantTo: [{ effect: 'Freeze', durationMultiplier: 0 }],
    })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.freezeRemainingSeconds ?? 0).toBe(0)
  })
})

/** PRNG determinista (mulberry32) — mismo comportamiento cross-plataforma para el test de distribución 35-65%. */
function mulberry32(seed: number): () => number {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('MultiHit — impactos independientes por secuencia (specs/016-multigolpe-critico US1/US2)', () => {
  it('FR-003: hitsPerSequence: 3 inflige exactamente 3 impactos independientes sin interrupción', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, attackType: 'MultiHit', hitsPerSequence: 3 })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(970) // 1000 - 10*3
  })

  it('con el cooldown sin vencer, MultiHit no inflige ningún impacto — igual que Single', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 5, attackType: 'MultiHit', hitsPerSequence: 3 })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(1000)
  })

  it('FR-004: si el objetivo muere a mitad de la secuencia, los golpes restantes se descartan (sin trasladarse a otro objetivo)', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, attackType: 'MultiHit', hitsPerSequence: 5 })
    const defender = makeUnit({ instanceId: 'defender', hp: 25, attackCooldownRemaining: 5 }) // muere en el 3er golpe (30 > 25)

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(0)
    expect(result.b.state).toBe('Dead')
  })

  it('FR-005: la siguiente secuencia contra un nuevo objetivo siempre aplica los N golpes completos, nunca parcial', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, attackType: 'MultiHit', hitsPerSequence: 3 })
    const firstDefender = makeUnit({ instanceId: 'first', hp: 15, attackCooldownRemaining: 5 }) // muere en el 2º golpe (20 > 15)
    resolveEngagement(attacker, firstDefender, 0.1) // secuencia interrumpida contra el primer objetivo

    const freshAttacker = { ...attacker, attackCooldownRemaining: 0 }
    const secondDefender = makeUnit({ instanceId: 'second', hp: 1000, attackCooldownRemaining: 5 })
    const result = resolveEngagement(freshAttacker, secondDefender, 0.1)

    expect(result.b.hp).toBe(970) // 1000 - 10*3, secuencia completa nueva — sin arrastre del objetivo anterior
  })
})

describe('Crítico — probabilidad configurable de doble daño (specs/016-multigolpe-critico US3)', () => {
  it('SC-003: criticalChance: 1 siempre duplica el daño', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, attackType: 'Critical', criticalChance: 1 })
    const defender = makeUnit({ instanceId: 'defender', hp: 100, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.hp).toBe(80) // 100 - 10*2
  })

  it('SC-003: criticalChance: 0 nunca duplica el daño', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, attackType: 'Critical', criticalChance: 0 })
    const defender = makeUnit({ instanceId: 'defender', hp: 100, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0.999)

    expect(result.b.hp).toBe(90) // 100 - 10, sin duplicar
  })

  it('FR-007: el crítico duplica el daño ya resuelto por Debilitar/TraitTargeting/TraitResistance, no lo reemplaza', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'Critical',
      criticalChance: 1,
      weakenRemainingSeconds: 2,
      weakenMagnitude: 0.5, // daño base efectivo: 10*(1-0.5) = 5
      abilities: [{ kind: 'TraitTargeting', targetClassifications: ['Zombie'], damageMultiplier: 3 }], // *3 contra Zombie
    })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, classification: 'Zombie', attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.hp).toBe(970) // 1000 - (5*3)*2
  })

  it('SC-004: con criticalChance: 0.5 y RNG sembrado sobre 100 ataques independientes, los críticos están entre 35 y 65', () => {
    const random = mulberry32(42)
    let criticalHits = 0

    for (let i = 0; i < 100; i += 1) {
      const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, attackType: 'Critical', criticalChance: 0.5 })
      const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5 })
      const result = resolveEngagement(attacker, defender, 0.1, random)
      if (1000 - result.b.hp === 20) criticalHits += 1 // 10*2 = crítico; 10 = normal
    }

    expect(criticalHits).toBeGreaterThanOrEqual(35)
    expect(criticalHits).toBeLessThanOrEqual(65)
  })
})

describe('Golpe Letal — probabilidad configurable de daño masivo (specs/038-catalogo-habilidades-avanzado US1)', () => {
  it('SC-001: chance: 1 siempre aplica el multiplicador de daño', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      abilities: [{ kind: 'MassiveDamage', chance: 1, damageMultiplier: 3 }],
    })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.hp).toBe(970) // 1000 - 10*3
  })

  it('chance: 0 nunca aplica el multiplicador — daño normal', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      abilities: [{ kind: 'MassiveDamage', chance: 0, damageMultiplier: 3 }],
    })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0.999)

    expect(result.b.hp).toBe(990) // 1000 - 10, sin multiplicar
  })

  it('FR-006: en una secuencia MultiHit, cada golpe hace su propio roll independiente', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'MultiHit',
      hitsPerSequence: 3,
      abilities: [{ kind: 'MassiveDamage', chance: 0.5, damageMultiplier: 3 }],
    })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5 })

    let call = 0
    const random = () => (call++ === 1 ? 0.99 : 0) // golpe 1: acierta, golpe 2: falla, golpe 3: acierta

    const result = resolveEngagement(attacker, defender, 0.1, random)

    expect(result.b.hp).toBe(930) // 1000 - (10*3 + 10 + 10*3)
  })

  it('FR-007: un atacante Cursed con MassiveDamage nunca lo aplica', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      curseRemainingSeconds: 2,
      abilities: [{ kind: 'MassiveDamage', chance: 1, damageMultiplier: 5 }],
    })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.hp).toBe(990) // solo daño normal, la habilidad no se aplica bajo Curse
  })

  it('replica en salpicadura (resolveAreaEngagement)', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'Area',
      areaRadius: 50,
      abilities: [{ kind: 'MassiveDamage', chance: 1, damageMultiplier: 3 }],
    })
    const primary = makeUnit({ instanceId: 'primary', hp: 1000, attackCooldownRemaining: 5 })
    const splash = makeUnit({ instanceId: 'splash', hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveAreaEngagement(attacker, primary, [splash], 0.1, () => 0)

    expect(result.splashTargets[0].hp).toBe(970) // 1000 - 10*3
  })

  it('spec.md Historia 1 Escenario 4: el mismo roll aplica atacando la base (resolveBaseDamage)', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      abilities: [{ kind: 'MassiveDamage', chance: 1, damageMultiplier: 3 }],
    })

    const result = resolveBaseDamage(attacker, { hp: 1000, maxHp: 1000 }, 0.1, () => 0)

    expect(result.base.hp).toBe(970) // 1000 - 10*3
  })
})

describe('Killers de rasgo — eliminación instantánea probabilística (specs/038-catalogo-habilidades-avanzado US2)', () => {
  it('SC-002: contra el rasgo declarado, con chance: 1, elimina instantáneamente pese a vida muy alta', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      abilities: [{ kind: 'TraitKiller', targetClassifications: ['Zombie'], chance: 1 }],
    })
    const defender = makeUnit({ instanceId: 'defender', hp: 1_000_000, classification: 'Zombie', attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.hp).toBe(0)
    expect(result.b.state).toBe('Dead')
  })

  it('contra un rasgo distinto al declarado, nunca se activa aunque el roll favorezca', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      abilities: [{ kind: 'TraitKiller', targetClassifications: ['Zombie'], chance: 1 }],
    })
    const defender = makeUnit({ instanceId: 'defender', hp: 1_000_000, classification: 'Red', attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.hp).toBe(999_990) // solo daño normal, el Killer no coincide con el rasgo
  })

  it('FR-007: un atacante Cursed con TraitKiller nunca lo aplica', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      curseRemainingSeconds: 2,
      abilities: [{ kind: 'TraitKiller', targetClassifications: ['Zombie'], chance: 1 }],
    })
    const defender = makeUnit({ instanceId: 'defender', hp: 1_000_000, classification: 'Zombie', attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.hp).toBe(999_990) // solo daño normal, la habilidad no se aplica bajo Curse
  })

  it('replica en salpicadura (resolveAreaEngagement)', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'Area',
      areaRadius: 50,
      abilities: [{ kind: 'TraitKiller', targetClassifications: ['Zombie'], chance: 1 }],
    })
    const primary = makeUnit({ instanceId: 'primary', hp: 1_000_000, attackCooldownRemaining: 5 })
    const splash = makeUnit({ instanceId: 'splash', hp: 1_000_000, classification: 'Zombie', attackCooldownRemaining: 5 })

    const result = resolveAreaEngagement(attacker, primary, [splash], 0.1, () => 0)

    expect(result.splashTargets[0].hp).toBe(0)
    expect(result.splashTargets[0].state).toBe('Dead')
  })
})

describe('Escudo — absorción de daño previa a hp (specs/038-catalogo-habilidades-avanzado US3)', () => {
  it('un golpe menor al escudo no reduce hp, solo consume el escudo', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 })
    const defender = makeUnit({ instanceId: 'defender', hp: 100, shieldRemainingHp: 50, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(100)
    expect(result.b.shieldRemainingHp).toBe(40)
  })

  it('un golpe mayor al escudo restante lo agota a 0 y aplica el excedente a hp en el mismo golpe', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 })
    const defender = makeUnit({ instanceId: 'defender', hp: 100, shieldRemainingHp: 5, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.shieldRemainingHp).toBe(0)
    expect(result.b.hp).toBe(95) // 100 - (10 - 5) de excedente
  })

  it('con el escudo ya agotado (0), se comporta exactamente como sin Shield', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 })
    const defender = makeUnit({ instanceId: 'defender', hp: 100, shieldRemainingHp: 0, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(90)
  })

  it('replica en salpicadura (resolveAreaEngagement)', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, attackType: 'Area', areaRadius: 50 })
    const primary = makeUnit({ instanceId: 'primary', hp: 100, attackCooldownRemaining: 5 })
    const splash = makeUnit({ instanceId: 'splash', hp: 100, shieldRemainingHp: 5, attackCooldownRemaining: 5 })

    const result = resolveAreaEngagement(attacker, primary, [splash], 0.1)

    expect(result.splashTargets[0].shieldRemainingHp).toBe(0)
    expect(result.splashTargets[0].hp).toBe(95) // 100 - (10 - 5) de excedente
  })
})

describe('Fortalecer — daño multiplicado bajo el umbral de vida (specs/039-habilidades-control-defensa US1)', () => {
  const strengthen = { kind: 'Strengthen' as const, hpThresholdFraction: 0.5, damageMultiplier: 2 }

  it('por encima del umbral inflige su daño normal', () => {
    const attacker = makeUnit({ instanceId: 'attacker', hp: 60, maxHp: 100, damage: 10, attackCooldownRemaining: 0, abilities: [strengthen] })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5 })
    const random = vi.fn(() => 0)

    const result = resolveEngagement(attacker, defender, 0.1, random)

    expect(result.b.hp).toBe(990) // 1000 - 10, sin multiplicar
    expect(random).not.toHaveBeenCalled() // Fortalecer es determinista — nunca consume un roll (FR-009)
  })

  it('justo en el umbral (inclusivo) multiplica el daño', () => {
    const attacker = makeUnit({ instanceId: 'attacker', hp: 50, maxHp: 100, damage: 10, attackCooldownRemaining: 0, abilities: [strengthen] })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(980) // 1000 - 10*2
  })

  it('bajo el umbral multiplica el daño', () => {
    const attacker = makeUnit({ instanceId: 'attacker', hp: 10, maxHp: 100, damage: 10, attackCooldownRemaining: 0, abilities: [strengthen] })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(980)
  })

  it('el multiplicador aplica también contra la base (resolveBaseDamage)', () => {
    const attacker = makeUnit({ instanceId: 'attacker', hp: 40, maxHp: 100, damage: 10, attackCooldownRemaining: 0, abilities: [strengthen] })

    const result = resolveBaseDamage(attacker, { hp: 1000, maxHp: 1000 }, 0.1)

    expect(result.base.hp).toBe(980) // 1000 - 10*2
  })

  it('el multiplicador aplica también en la salpicadura (resolveAreaEngagement)', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      hp: 40,
      maxHp: 100,
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'Area',
      areaRadius: 50,
      abilities: [strengthen],
    })
    const primary = makeUnit({ instanceId: 'primary', hp: 1000, attackCooldownRemaining: 5 })
    const splash = makeUnit({ instanceId: 'splash', hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveAreaEngagement(attacker, primary, [splash], 0.1)

    expect(result.primaryTarget.hp).toBe(980)
    expect(result.splashTargets[0].hp).toBe(980)
  })

  it('combinado con Debilitar ambos modificadores se aplican de forma multiplicativa', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      hp: 40,
      maxHp: 100,
      damage: 10,
      attackCooldownRemaining: 0,
      weakenRemainingSeconds: 2,
      weakenMagnitude: 0.5, // 10 * (1 - 0.5) = 5
      abilities: [strengthen], // * 2
    })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(990) // 1000 - 5*2
  })

  it('FR-008: un atacante bajo Curse no aplica Fortalecer aunque esté bajo el umbral', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      hp: 10,
      maxHp: 100,
      damage: 10,
      attackCooldownRemaining: 0,
      curseRemainingSeconds: 2,
      abilities: [strengthen],
    })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(990) // daño normal bajo Curse
  })

  it('Edge Case: una unidad que cruza el umbral por un golpe recibido en el mismo paso ya ataca fortalecida en ese paso', () => {
    // `a` ataca primero y deja a `b` en 40/100 (≤ 50%); `b` ataca después con el multiplicador ya vigente.
    const a = makeUnit({ instanceId: 'a', hp: 100, maxHp: 100, damage: 20, attackCooldownRemaining: 0 })
    const b = makeUnit({ instanceId: 'b', hp: 60, maxHp: 100, damage: 10, attackCooldownRemaining: 0, abilities: [strengthen] })

    const result = resolveEngagement(a, b, 0.1)

    expect(result.b.hp).toBe(40) // 60 - 20
    expect(result.a.hp).toBe(80) // 100 - 10*2
  })
})

describe('Esquivar — anula un golpe recibido (specs/039-habilidades-control-defensa US2)', () => {
  const dodge = (chance: number) => ({ kind: 'Dodge' as const, chance })

  it('chance: 1 anula el golpe por completo: sin daño, sin escudo consumido, sin efecto on-hit y sin Killer', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      appliesEffect: { type: 'Weaken', durationSeconds: 3, magnitude: 0.5 },
      abilities: [{ kind: 'TraitKiller', targetClassifications: ['Zombie'], chance: 1 }],
    })
    const defender = makeUnit({
      instanceId: 'defender',
      hp: 1000,
      shieldRemainingHp: 50,
      classification: 'Zombie',
      attackCooldownRemaining: 5,
      abilities: [dodge(1)],
    })
    const random = vi.fn(() => 0)

    const result = resolveEngagement(attacker, defender, 0.1, random)

    expect(result.b.hp).toBe(1000)
    expect(result.b.shieldRemainingHp).toBe(50)
    expect(result.b.weakenRemainingSeconds).toBeUndefined()
    expect(random).toHaveBeenCalledTimes(1) // solo el roll de Esquivar — ningún roll posterior (FR-006)
  })

  it('chance: 0 nunca esquiva — el daño se resuelve de forma normal', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5, abilities: [dodge(0)] })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.hp).toBe(990)
  })

  it('FR-007: en una secuencia MultiHit cada golpe hace su propio roll independiente', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'MultiHit',
      hitsPerSequence: 3,
    })
    const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5, abilities: [dodge(0.5)] })

    const rolls = [0, 0.9, 0] // golpe 1: esquiva, golpe 2: conecta, golpe 3: esquiva
    let call = 0
    const result = resolveEngagement(attacker, defender, 0.1, () => rolls[call++])

    expect(result.b.hp).toBe(990) // solo conectó el segundo golpe
  })

  it('FR-007: en salpicadura cada objetivo hace su propio roll — esquivar el golpe primario no protege a la salpicadura ni viceversa', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, attackType: 'Area', areaRadius: 50 })

    const dodgingSplash = resolveAreaEngagement(
      attacker,
      makeUnit({ instanceId: 'primary', hp: 1000, attackCooldownRemaining: 5 }),
      [makeUnit({ instanceId: 'splash', hp: 1000, attackCooldownRemaining: 5, abilities: [dodge(1)] })],
      0.1,
      () => 0,
    )
    expect(dodgingSplash.primaryTarget.hp).toBe(990)
    expect(dodgingSplash.splashTargets[0].hp).toBe(1000)

    const dodgingPrimary = resolveAreaEngagement(
      attacker,
      makeUnit({ instanceId: 'primary', hp: 1000, attackCooldownRemaining: 5, abilities: [dodge(1)] }),
      [makeUnit({ instanceId: 'splash', hp: 1000, attackCooldownRemaining: 5 })],
      0.1,
      () => 0,
    )
    expect(dodgingPrimary.primaryTarget.hp).toBe(1000)
    expect(dodgingPrimary.splashTargets[0].hp).toBe(990)
  })

  it('FR-008: un defensor bajo Curse nunca esquiva', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 })
    const defender = makeUnit({
      instanceId: 'defender',
      hp: 1000,
      attackCooldownRemaining: 5,
      curseRemainingSeconds: 2,
      abilities: [dodge(1)],
    })
    const random = vi.fn(() => 0)

    const result = resolveEngagement(attacker, defender, 0.1, random)

    expect(result.b.hp).toBe(990)
    expect(random).not.toHaveBeenCalled() // el roll ni siquiera se hace bajo Curse
  })

  it('SC-002: con chance: 0.25 y RNG sembrado sobre 400 golpes independientes, los golpes esquivados están entre 75 y 125', () => {
    const random = mulberry32(2026)
    let dodged = 0

    for (let i = 0; i < 400; i += 1) {
      const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 })
      const defender = makeUnit({ instanceId: 'defender', hp: 1000, attackCooldownRemaining: 5, abilities: [dodge(0.25)] })
      const result = resolveEngagement(attacker, defender, 0.1, random)
      if (result.b.hp === 1000) dodged += 1
    }

    expect(dodged).toBeGreaterThanOrEqual(75)
    expect(dodged).toBeLessThanOrEqual(125)
  })
})

describe('Sobrevivir — resistir un golpe letal con 1 de vida (specs/039-habilidades-control-defensa US3)', () => {
  const survive = (chance: number) => ({ kind: 'Survive' as const, chance })

  it('un golpe letal con el roll acertado deja al defensor con exactamente 1 de vida, sin pasar a Dead', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 })
    const defender = makeUnit({ instanceId: 'defender', hp: 5, attackCooldownRemaining: 5, abilities: [survive(1)] })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.hp).toBe(1)
    expect(result.b.state).not.toBe('Dead')
  })

  it('un golpe letal con el roll fallado mata al defensor como a cualquier otra unidad', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 })
    const defender = makeUnit({ instanceId: 'defender', hp: 5, attackCooldownRemaining: 5, abilities: [survive(0)] })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0.5)

    expect(result.b.hp).toBe(0)
    expect(result.b.state).toBe('Dead')
  })

  it('un golpe no letal es idéntico al de una unidad sin la habilidad y no consume ningún roll', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 })
    const defender = makeUnit({ instanceId: 'defender', hp: 50, attackCooldownRemaining: 5, abilities: [survive(1)] })
    const random = vi.fn(() => 0)

    const result = resolveEngagement(attacker, defender, 0.1, random)

    expect(result.b.hp).toBe(40)
    expect(random).not.toHaveBeenCalled()
  })

  it('con Escudo, un golpe absorbido por completo no es letal; solo el excedente sobre el escudo puede serlo', () => {
    const absorbed = resolveEngagement(
      makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 }),
      makeUnit({ instanceId: 'defender', hp: 5, shieldRemainingHp: 20, attackCooldownRemaining: 5, abilities: [survive(1)] }),
      0.1,
      vi.fn(() => 0),
    )
    expect(absorbed.b.hp).toBe(5)
    expect(absorbed.b.shieldRemainingHp).toBe(10)

    const random = vi.fn(() => 0)
    const overflow = resolveEngagement(
      makeUnit({ instanceId: 'attacker', damage: 30, attackCooldownRemaining: 0 }),
      makeUnit({ instanceId: 'defender', hp: 5, shieldRemainingHp: 20, attackCooldownRemaining: 5, abilities: [survive(1)] }),
      0.1,
      random,
    )
    expect(overflow.b.shieldRemainingHp).toBe(0)
    expect(overflow.b.hp).toBe(1) // excedente de 10 ≥ hp 5 → letal → Sobrevivir
    expect(random).toHaveBeenCalledTimes(1)
  })

  it('FR-003: una eliminación instantánea de Killer cuenta como golpe letal y Sobrevivir puede evitarla', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      damage: 10,
      attackCooldownRemaining: 0,
      abilities: [{ kind: 'TraitKiller', targetClassifications: ['Zombie'], chance: 1 }],
    })
    const defender = makeUnit({
      instanceId: 'defender',
      hp: 1000,
      classification: 'Zombie',
      attackCooldownRemaining: 5,
      abilities: [survive(1)],
    })
    const random = vi.fn(() => 0)

    const result = resolveEngagement(attacker, defender, 0.1, random)

    expect(result.b.hp).toBe(1)
    expect(random).toHaveBeenCalledTimes(2) // roll del Killer + roll de Sobrevivir
  })

  it('la habilidad no se agota: una unidad que sobrevivió con 1 de vida hace un roll nuevo e independiente ante el siguiente golpe letal', () => {
    const defender = makeUnit({ instanceId: 'defender', hp: 5, attackCooldownRemaining: 5, abilities: [survive(0.5)] })

    const first = resolveEngagement(makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 }), defender, 0.1, () => 0)
    expect(first.b.hp).toBe(1)

    const second = resolveEngagement(makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 }), first.b, 0.1, () => 0.99)
    expect(second.b.hp).toBe(0)
    expect(second.b.state).toBe('Dead')
  })

  it('FR-007: en una secuencia MultiHit cada golpe letal hace su propio roll de Sobrevivir', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, attackType: 'MultiHit', hitsPerSequence: 2 })
    const defender = makeUnit({ instanceId: 'defender', hp: 5, attackCooldownRemaining: 5, abilities: [survive(0.5)] })

    const rolls = [0, 0.99] // golpe 1: sobrevive con 1 de vida; golpe 2: falla y muere
    let call = 0
    const result = resolveEngagement(attacker, defender, 0.1, () => rolls[call++])

    expect(result.b.hp).toBe(0)
    expect(result.b.state).toBe('Dead')
  })

  it('FR-008: un defensor bajo Curse no sobrevive aunque el roll acertaría', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 })
    const defender = makeUnit({ instanceId: 'defender', hp: 5, attackCooldownRemaining: 5, curseRemainingSeconds: 2, abilities: [survive(1)] })
    const random = vi.fn(() => 0)

    const result = resolveEngagement(attacker, defender, 0.1, random)

    expect(result.b.state).toBe('Dead')
    expect(random).not.toHaveBeenCalled()
  })

  it('en salpicadura (resolveAreaEngagement) el objetivo con Sobrevivir queda con 1 de vida y sin pasar a Dead', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, attackType: 'Area', areaRadius: 50 })
    const primary = makeUnit({ instanceId: 'primary', hp: 1000, attackCooldownRemaining: 5 })
    const splash = makeUnit({ instanceId: 'splash', hp: 5, attackCooldownRemaining: 5, abilities: [survive(1)] })

    const result = resolveAreaEngagement(attacker, primary, [splash], 0.1, () => 0)

    expect(result.splashTargets[0].hp).toBe(1)
    expect(result.splashTargets[0].state).not.toBe('Dead')
  })

  it('SC-003: con chance: 0.3 y RNG sembrado sobre 400 golpes letales, los sobrevivientes están entre 90 y 150', () => {
    const random = mulberry32(2026)
    let survivors = 0

    for (let i = 0; i < 400; i += 1) {
      const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0 })
      const defender = makeUnit({ instanceId: 'defender', hp: 5, attackCooldownRemaining: 5, abilities: [survive(0.3)] })
      const result = resolveEngagement(attacker, defender, 0.1, random)
      if (result.b.hp === 1) survivors += 1
    }

    expect(survivors).toBeGreaterThanOrEqual(90)
    expect(survivors).toBeLessThanOrEqual(150)
  })
})

describe('Retroceso — empujar al objetivo golpeado hacia su base (specs/039-habilidades-control-defensa US4)', () => {
  const knockback = (chance: number, distance: number) => ({ kind: 'Knockback' as const, chance, distance })

  it('un atacante enemigo desplaza a un objetivo del jugador hacia menor x', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Enemy', damage: 10, attackCooldownRemaining: 0, abilities: [knockback(1, 30)] })
    const defender = makeUnit({ instanceId: 'defender', team: 'Player', x: 100, hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.x).toBe(70)
    expect(result.b.hp).toBe(990) // el golpe también hace su daño normal
  })

  it('un atacante del jugador desplaza a un objetivo enemigo hacia mayor x', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0, abilities: [knockback(1, 30)] })
    const defender = makeUnit({ instanceId: 'defender', team: 'Enemy', x: 200, hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.x).toBe(230)
  })

  it('FR-005: el jugador nunca queda por debajo de x = 0, y una unidad ya en el origen no se desplaza', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Enemy', damage: 10, attackCooldownRemaining: 0, abilities: [knockback(1, 30)] })

    const nearOrigin = resolveEngagement(attacker, makeUnit({ instanceId: 'd1', team: 'Player', x: 10, hp: 1000, attackCooldownRemaining: 5 }), 0.1, () => 0)
    expect(nearOrigin.b.x).toBe(0)

    const atOrigin = resolveEngagement(attacker, makeUnit({ instanceId: 'd2', team: 'Player', x: 0, hp: 1000, attackCooldownRemaining: 5 }), 0.1, () => 0)
    expect(atOrigin.b.x).toBe(0)
  })

  it('FR-005: el enemigo nunca supera laneLength - width; una unidad ya en o más allá de ese borde no se desplaza', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0, abilities: [knockback(1, 30)] })
    const enemyAt = (x: number) => makeUnit({ instanceId: 'enemy', team: 'Enemy', x, width: 16, hp: 1000, attackCooldownRemaining: 5 })

    expect(resolveEngagement(attacker, enemyAt(370), 0.1, () => 0, 400).b.x).toBe(384) // 400 - 16
    expect(resolveEngagement(attacker, enemyAt(384), 0.1, () => 0, 400).b.x).toBe(384)
    expect(resolveEngagement(attacker, enemyAt(390), 0.1, () => 0, 400).b.x).toBe(390) // ya más allá del borde: no se "devuelve" hacia adentro
  })

  it('un golpe que mata al objetivo no lo desplaza ni consume el roll de Retroceso', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0, abilities: [knockback(1, 30)] })
    const defender = makeUnit({ instanceId: 'defender', team: 'Enemy', x: 200, hp: 5, attackCooldownRemaining: 5 })
    const random = vi.fn(() => 0)

    const result = resolveEngagement(attacker, defender, 0.1, random)

    expect(result.b.state).toBe('Dead')
    expect(result.b.x).toBe(200)
    expect(random).not.toHaveBeenCalled()
  })

  it('un objetivo que sobrevive con 1 de vida gracias a Sobrevivir sí es empujado', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0, abilities: [knockback(1, 30)] })
    const defender = makeUnit({
      instanceId: 'defender',
      team: 'Enemy',
      x: 200,
      hp: 5,
      attackCooldownRemaining: 5,
      abilities: [{ kind: 'Survive', chance: 1 }],
    })
    const random = vi.fn(() => 0)

    const result = resolveEngagement(attacker, defender, 0.1, random)

    expect(result.b.hp).toBe(1)
    expect(result.b.x).toBe(230)
    expect(random).toHaveBeenCalledTimes(2) // Sobrevivir, luego Retroceso
  })

  it('un golpe esquivado no desplaza al objetivo', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0, abilities: [knockback(1, 30)] })
    const defender = makeUnit({
      instanceId: 'defender',
      team: 'Enemy',
      x: 200,
      hp: 1000,
      attackCooldownRemaining: 5,
      abilities: [{ kind: 'Dodge', chance: 1 }],
    })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.x).toBe(200)
    expect(result.b.hp).toBe(1000)
  })

  it('FR-007: en salpicadura cada objetivo hace su propio roll de Retroceso', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Player',
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'Area',
      areaRadius: 50,
      abilities: [knockback(0.5, 30)],
    })
    const primary = makeUnit({ instanceId: 'primary', team: 'Enemy', x: 100, hp: 1000, attackCooldownRemaining: 5 })
    const splash = makeUnit({ instanceId: 'splash', team: 'Enemy', x: 110, hp: 1000, attackCooldownRemaining: 5 })

    const rolls = [0, 0.99] // primario: acierta; salpicadura: falla
    let call = 0
    const result = resolveAreaEngagement(attacker, primary, [splash], 0.1, () => rolls[call++])

    expect(result.primaryTarget.x).toBe(130)
    expect(result.splashTargets[0].x).toBe(110)
  })

  it('FR-008: un atacante bajo Curse no desplaza a nadie y no consume el roll', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Player',
      damage: 10,
      attackCooldownRemaining: 0,
      curseRemainingSeconds: 2,
      abilities: [knockback(1, 30)],
    })
    const defender = makeUnit({ instanceId: 'defender', team: 'Enemy', x: 200, hp: 1000, attackCooldownRemaining: 5 })
    const random = vi.fn(() => 0)

    const result = resolveEngagement(attacker, defender, 0.1, random)

    expect(result.b.x).toBe(200)
    expect(random).not.toHaveBeenCalled()
  })

  it('FR-007: en una secuencia MultiHit los desplazamientos se acumulan, respetando siempre el borde del carril', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Player',
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'MultiHit',
      hitsPerSequence: 3,
      abilities: [knockback(1, 10)],
    })
    const enemyAt = (x: number) => makeUnit({ instanceId: 'enemy', team: 'Enemy', x, width: 16, hp: 1000, attackCooldownRemaining: 5 })

    expect(resolveEngagement(attacker, enemyAt(200), 0.1, () => 0, 400).b.x).toBe(230) // 3 × 10
    expect(resolveEngagement(attacker, enemyAt(200), 0.1, () => 0, 240).b.x).toBe(224) // tope: 240 - 16
  })

  it('SC-004: con chance: 0.3 y RNG sembrado sobre 400 golpes, los desplazamientos están entre 90 y 150', () => {
    const random = mulberry32(2026)
    let displaced = 0

    for (let i = 0; i < 400; i += 1) {
      const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0, abilities: [knockback(0.3, 30)] })
      const defender = makeUnit({ instanceId: 'defender', team: 'Enemy', x: 200, hp: 1000, attackCooldownRemaining: 5 })
      const result = resolveEngagement(attacker, defender, 0.1, random, 400)
      if (result.b.x !== 200) displaced += 1
    }

    expect(displaced).toBeGreaterThanOrEqual(90)
    expect(displaced).toBeLessThanOrEqual(150)
  })
})

describe('Dinero Extra — crédito de la derrota (specs/040-dinero-extra-inmunidades US1)', () => {
  const extraMoney = { kind: 'ExtraMoney' as const, energyBonus: 5 }

  it('un atacante del jugador con la habilidad que deja a un enemigo en 0 de vida le fija defeatBounty', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0, abilities: [extraMoney] })
    const defender = makeUnit({ instanceId: 'defender', team: 'Enemy', hp: 10, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.state).toBe('Dead')
    expect(result.b.defeatBounty).toBe(5)
  })

  it('un golpe que no derrota al enemigo no deja defeatBounty', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0, abilities: [extraMoney] })
    const defender = makeUnit({ instanceId: 'defender', team: 'Enemy', hp: 11, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.hp).toBe(1)
    expect(result.b.defeatBounty).toBeUndefined()
  })

  it('sin la habilidad, derrotar a un enemigo no deja defeatBounty', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0 })
    const defender = makeUnit({ instanceId: 'defender', team: 'Enemy', hp: 10, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.state).toBe('Dead')
    expect(result.b.defeatBounty).toBeUndefined()
  })

  it('un enemigo que sobrevive con 1 de vida gracias a Sobrevivir no cuenta como derrotado', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0, abilities: [extraMoney] })
    const defender = makeUnit({
      instanceId: 'defender',
      team: 'Enemy',
      hp: 5,
      attackCooldownRemaining: 5,
      abilities: [{ kind: 'Survive', chance: 1 }],
    })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.hp).toBe(1)
    expect(result.b.defeatBounty).toBeUndefined()
  })

  it('FR-002: una eliminación instantánea de Killer cuenta como derrota y concede el bono', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Player',
      damage: 10,
      attackCooldownRemaining: 0,
      abilities: [extraMoney, { kind: 'TraitKiller', targetClassifications: ['Zombie'], chance: 1 }],
    })
    const defender = makeUnit({ instanceId: 'defender', team: 'Enemy', hp: 1000, classification: 'Zombie', attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.state).toBe('Dead')
    expect(result.b.defeatBounty).toBe(5)
  })

  it('FR-003: un atacante bajo Curse no concede el bono', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Player',
      damage: 10,
      attackCooldownRemaining: 0,
      curseRemainingSeconds: 2,
      abilities: [extraMoney],
    })
    const defender = makeUnit({ instanceId: 'defender', team: 'Enemy', hp: 10, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.state).toBe('Dead')
    expect(result.b.defeatBounty).toBeUndefined()
  })

  it('FR-003: la Maldición que aplica el enemigo derrotado en el mismo paso (contraataque simultáneo) no le quita el bono ya ganado', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0, abilities: [extraMoney] })
    const defender = makeUnit({
      instanceId: 'defender',
      team: 'Enemy',
      hp: 10,
      damage: 1,
      attackCooldownRemaining: 0,
      appliesEffect: { type: 'Curse', durationSeconds: 3 },
    })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.a.curseRemainingSeconds).toBe(3) // el atacante terminó maldecido por el contraataque simultáneo…
    expect(result.b.defeatBounty).toBe(5) // …pero lo maldijeron DESPUÉS de su golpe letal: el bono ya estaba ganado
  })

  it('FR-004: una unidad enemiga con Dinero Extra no deja defeatBounty al derrotar a una del jugador', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Enemy', damage: 10, attackCooldownRemaining: 0, abilities: [extraMoney] })
    const defender = makeUnit({ instanceId: 'defender', team: 'Player', hp: 10, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.state).toBe('Dead')
    expect(result.b.defeatBounty).toBeUndefined()
  })

  it('FR-002: en salpicadura (resolveAreaEngagement) cada objetivo derrotado lleva su propio defeatBounty', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Player',
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'Area',
      areaRadius: 50,
      abilities: [extraMoney],
    })
    const primary = makeUnit({ instanceId: 'primary', team: 'Enemy', hp: 10, attackCooldownRemaining: 5 })
    const splashDead = makeUnit({ instanceId: 'splash-dead', team: 'Enemy', hp: 10, attackCooldownRemaining: 5 })
    const splashAlive = makeUnit({ instanceId: 'splash-alive', team: 'Enemy', hp: 100, attackCooldownRemaining: 5 })

    const result = resolveAreaEngagement(attacker, primary, [splashDead, splashAlive], 0.1)

    expect(result.primaryTarget.defeatBounty).toBe(5)
    expect(result.splashTargets[0].defeatBounty).toBe(5)
    expect(result.splashTargets[1].defeatBounty).toBeUndefined()
  })

  it('una secuencia MultiHit que derrota al objetivo concede el bono una sola vez (los golpes restantes se descartan)', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Player',
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'MultiHit',
      hitsPerSequence: 3,
      abilities: [extraMoney],
    })
    const defender = makeUnit({ instanceId: 'defender', team: 'Enemy', hp: 15, attackCooldownRemaining: 5 })

    const result = resolveEngagement(attacker, defender, 0.1)

    expect(result.b.state).toBe('Dead')
    expect(result.b.defeatBounty).toBe(5)
  })

  it('el daño a una base nunca deja defeatBounty (la base no es una unidad)', () => {
    const attacker = makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0, abilities: [extraMoney] })

    const result = resolveBaseDamage(attacker, { hp: 5, maxHp: 1000 }, 0.1)

    expect(result.base.hp).toBe(0)
    expect(result.base).not.toHaveProperty('defeatBounty')
  })
})

describe('Inmunidad a habilidades — Golpe Letal, Killer y Retroceso ignorados (specs/040-dinero-extra-inmunidades US2)', () => {
  const massive = { kind: 'MassiveDamage' as const, chance: 1, damageMultiplier: 3 }
  const zombieKiller = { kind: 'TraitKiller' as const, targetClassifications: ['Zombie' as const], chance: 1 }
  const knockback = { kind: 'Knockback' as const, chance: 1, distance: 30 }

  it('Golpe Letal: un defensor inmune recibe el daño normal y uno no inmune el multiplicado', () => {
    const attacker = () => makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, abilities: [massive] })
    const immune = makeUnit({ instanceId: 'immune', hp: 1000, attackCooldownRemaining: 5, immuneAbilities: ['MassiveDamage'] })
    const plain = makeUnit({ instanceId: 'plain', hp: 1000, attackCooldownRemaining: 5 })

    expect(resolveEngagement(attacker(), immune, 0.1, () => 0).b.hp).toBe(990) // 1000 - 10, sin multiplicar
    expect(resolveEngagement(attacker(), plain, 0.1, () => 0).b.hp).toBe(970) // 1000 - 10*3
  })

  it('Killer: un defensor Zombie inmune a Killer no es eliminado (recibe el daño normal) y uno no inmune sí', () => {
    const attacker = () => makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, abilities: [zombieKiller] })
    const immune = makeUnit({
      instanceId: 'immune',
      hp: 1000,
      classification: 'Zombie',
      attackCooldownRemaining: 5,
      immuneAbilities: ['TraitKiller'],
    })
    const plain = makeUnit({ instanceId: 'plain', hp: 1000, classification: 'Zombie', attackCooldownRemaining: 5 })

    expect(resolveEngagement(attacker(), immune, 0.1, () => 0).b.hp).toBe(990)
    expect(resolveEngagement(attacker(), plain, 0.1, () => 0).b.hp).toBe(0)
  })

  it('Retroceso: un defensor inmune no se desplaza y uno no inmune sí', () => {
    const attacker = () =>
      makeUnit({ instanceId: 'attacker', team: 'Player', damage: 10, attackCooldownRemaining: 0, abilities: [knockback] })
    const immune = makeUnit({
      instanceId: 'immune',
      team: 'Enemy',
      x: 200,
      hp: 1000,
      attackCooldownRemaining: 5,
      immuneAbilities: ['Knockback'],
    })
    const plain = makeUnit({ instanceId: 'plain', team: 'Enemy', x: 200, hp: 1000, attackCooldownRemaining: 5 })

    expect(resolveEngagement(attacker(), immune, 0.1, () => 0).b.x).toBe(200)
    expect(resolveEngagement(attacker(), plain, 0.1, () => 0).b.x).toBe(230)
  })

  it('SC-003: cada inmunidad es independiente — un defensor inmune solo a Retroceso sufre el Golpe Letal del mismo atacante', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Player',
      damage: 10,
      attackCooldownRemaining: 0,
      abilities: [massive, knockback],
    })
    const defender = makeUnit({
      instanceId: 'defender',
      team: 'Enemy',
      x: 200,
      hp: 1000,
      attackCooldownRemaining: 5,
      immuneAbilities: ['Knockback'],
    })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.hp).toBe(970) // el Golpe Letal sí se aplicó
    expect(result.b.x).toBe(200) // el Retroceso no
  })

  it('FR-006: la habilidad ignorada no consume su tirada de probabilidad', () => {
    const defender = makeUnit({
      instanceId: 'defender',
      team: 'Enemy',
      x: 200,
      hp: 1000,
      classification: 'Zombie',
      attackCooldownRemaining: 5,
      immuneAbilities: ['MassiveDamage', 'TraitKiller', 'Knockback'],
    })
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Player',
      damage: 10,
      attackCooldownRemaining: 0,
      abilities: [massive, zombieKiller, knockback],
    })
    const random = vi.fn(() => 0)

    const result = resolveEngagement(attacker, defender, 0.1, random)

    expect(result.b.hp).toBe(990)
    expect(result.b.x).toBe(200)
    expect(random).not.toHaveBeenCalled()
  })

  it('FR-006: en salpicadura la inmunidad se evalúa por objetivo — primario inmune, salpicadura no inmune sufre el efecto', () => {
    const attacker = makeUnit({
      instanceId: 'attacker',
      team: 'Player',
      damage: 10,
      attackCooldownRemaining: 0,
      attackType: 'Area',
      areaRadius: 50,
      abilities: [massive],
    })
    const primary = makeUnit({
      instanceId: 'primary',
      team: 'Enemy',
      hp: 1000,
      attackCooldownRemaining: 5,
      immuneAbilities: ['MassiveDamage'],
    })
    const splash = makeUnit({ instanceId: 'splash', team: 'Enemy', hp: 1000, attackCooldownRemaining: 5 })

    const result = resolveAreaEngagement(attacker, primary, [splash], 0.1, () => 0)

    expect(result.primaryTarget.hp).toBe(990)
    expect(result.splashTargets[0].hp).toBe(970)
  })

  it('FR-007: un defensor inmune bajo Curse sigue siendo inmune', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, abilities: [massive] })
    const defender = makeUnit({
      instanceId: 'defender',
      hp: 1000,
      attackCooldownRemaining: 5,
      curseRemainingSeconds: 2,
      immuneAbilities: ['MassiveDamage'],
    })

    const result = resolveEngagement(attacker, defender, 0.1, () => 0)

    expect(result.b.hp).toBe(990)
  })

  it('el daño a una base sigue pudiendo aplicar Golpe Letal — las bases no tienen inmunidades', () => {
    const attacker = makeUnit({ instanceId: 'attacker', damage: 10, attackCooldownRemaining: 0, abilities: [massive] })

    const result = resolveBaseDamage(attacker, { hp: 1000, maxHp: 1000 }, 0.1, () => 0)

    expect(result.base.hp).toBe(970)
  })
})

describe('Cabeza de Cañón — efecto secundario del cañón especial (specs/041-cabezas-de-canon US2)', () => {
  const enemy = (overrides: Partial<BattleUnit> = {}) =>
    makeUnit({ instanceId: 'enemy', team: 'Enemy', x: 200, width: 16, hp: 100, ...overrides })
  const knockback = { kind: 'Knockback' as const, distance: 40 }
  const effect = (spec: AppliesEffect) => ({ kind: 'Effect' as const, effect: spec })

  it('Retroceso desplaza al enemigo hacia mayor x la distancia del catálogo', () => {
    expect(applyCannonHead(enemy(), knockback, 400).x).toBe(240)
  })

  it('Retroceso respeta el borde del carril (laneLength - width); un enemigo ya en el borde no se desplaza', () => {
    expect(applyCannonHead(enemy({ x: 370 }), knockback, 400).x).toBe(384) // 400 - 16
    expect(applyCannonHead(enemy({ x: 384 }), knockback, 400).x).toBe(384)
  })

  it('Retroceso no desplaza a un enemigo inmune a Retroceso (specs/040)', () => {
    expect(applyCannonHead(enemy({ immuneAbilities: ['Knockback'] }), knockback, 400).x).toBe(200)
  })

  it.each([
    ['Weaken', { type: 'Weaken' as const, durationSeconds: 5, magnitude: 0.5 }, { weakenRemainingSeconds: 5, weakenMagnitude: 0.5 }],
    ['Freeze', { type: 'Freeze' as const, durationSeconds: 3 }, { freezeRemainingSeconds: 3 }],
    ['Slow', { type: 'Slow' as const, durationSeconds: 5, magnitude: 0.5 }, { slowRemainingSeconds: 5, slowMagnitude: 0.5 }],
    ['Curse', { type: 'Curse' as const, durationSeconds: 5 }, { curseRemainingSeconds: 5 }],
  ])('%s deja en el enemigo los campos del efecto con la duración (y magnitud) del catálogo', (_name, spec, expected) => {
    expect(applyCannonHead(enemy(), effect(spec), 400)).toMatchObject(expected)
  })

  it('un efecto de estado respeta immuneEffects (sin efecto)', () => {
    const result = applyCannonHead(enemy({ immuneEffects: ['Freeze'] }), effect({ type: 'Freeze', durationSeconds: 3 }), 400)

    expect(result.freezeRemainingSeconds).toBeUndefined()
  })

  it('un efecto de estado reduce su duración con resistantTo, y una resistencia que la deja en ≤0 equivale a no aplicarlo', () => {
    const resisted = applyCannonHead(
      enemy({ resistantTo: [{ effect: 'Slow', durationMultiplier: 0.5 }] }),
      effect({ type: 'Slow', durationSeconds: 5, magnitude: 0.5 }),
      400,
    )
    expect(resisted.slowRemainingSeconds).toBe(2.5)

    const nullified = applyCannonHead(
      enemy({ resistantTo: [{ effect: 'Slow', durationMultiplier: 0 }] }),
      effect({ type: 'Slow', durationSeconds: 5, magnitude: 0.5 }),
      400,
    )
    expect(nullified.slowRemainingSeconds).toBeUndefined()
  })

  it('un efecto de estado se refresca, no se acumula, al aplicarse dos veces', () => {
    const spec = effect({ type: 'Freeze', durationSeconds: 3 })
    const once = applyCannonHead(enemy(), spec, 400)
    const twice = applyCannonHead({ ...once, freezeRemainingSeconds: 1 }, spec, 400)

    expect(twice.freezeRemainingSeconds).toBe(3)
  })

  it('es pura: devuelve una copia y no muta la unidad de entrada', () => {
    const input = enemy()

    const knocked = applyCannonHead(input, knockback, 400)
    const frozen = applyCannonHead(input, effect({ type: 'Freeze', durationSeconds: 3 }), 400)

    expect(knocked).not.toBe(input)
    expect(frozen).not.toBe(input)
    expect(input.x).toBe(200)
    expect(input.freezeRemainingSeconds).toBeUndefined()
  })
})
