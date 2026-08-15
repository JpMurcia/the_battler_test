import type { BattleUnit } from './types'

/**
 * Un paso de intercambio de daño entre dos unidades bloqueadas entre sí.
 * Cada unidad ataca según su propio cooldown; el daño se aplica sobre la salud
 * previa al tick (simultáneo), así que ambas pueden morir en el mismo paso.
 */
export function resolveEngagement(a: BattleUnit, b: BattleUnit, deltaSeconds: number): { a: BattleUnit; b: BattleUnit } {
  const nextA = { ...a, attackCooldownRemaining: a.attackCooldownRemaining - deltaSeconds }
  const nextB = { ...b, attackCooldownRemaining: b.attackCooldownRemaining - deltaSeconds }

  let damageToA = 0
  let damageToB = 0

  if (nextA.attackCooldownRemaining <= 0 && nextA.state !== 'Dead') {
    damageToB += nextA.damage
    nextA.attackCooldownRemaining += nextA.attackIntervalSeconds
  }
  if (nextB.attackCooldownRemaining <= 0 && nextB.state !== 'Dead') {
    damageToA += nextB.damage
    nextB.attackCooldownRemaining += nextB.attackIntervalSeconds
  }

  nextA.hp = Math.max(0, nextA.hp - damageToA)
  nextB.hp = Math.max(0, nextB.hp - damageToB)

  if (nextA.hp <= 0) nextA.state = 'Dead'
  if (nextB.hp <= 0) nextB.state = 'Dead'

  return { a: nextA, b: nextB }
}

/** Daño directo de una unidad contra una base (sin cooldown de la base — solo el de la unidad atacante). */
export function resolveBaseDamage(
  attacker: BattleUnit,
  base: { hp: number; maxHp: number },
  deltaSeconds: number,
): { attacker: BattleUnit; base: { hp: number; maxHp: number } } {
  const nextAttacker = { ...attacker, attackCooldownRemaining: attacker.attackCooldownRemaining - deltaSeconds }
  let damage = 0

  if (nextAttacker.attackCooldownRemaining <= 0) {
    damage = nextAttacker.damage
    nextAttacker.attackCooldownRemaining += nextAttacker.attackIntervalSeconds
  }

  return { attacker: nextAttacker, base: { ...base, hp: Math.max(0, base.hp - damage) } }
}
