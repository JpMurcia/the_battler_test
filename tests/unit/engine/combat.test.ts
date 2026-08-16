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
