import type { Cat } from '../data/cats'
import type { BattleUnit } from '../engine/types'

export interface VisualProfile {
  bodyWidth: number
  bodyHeight: number
  cornerRadius: number
  accentColor: number
  idleBobFrequencyHz: number
  attackPulseDurationSeconds: number
}

export type AnimationState = 'Idle' | 'Attacking'

export interface AnimationPose {
  bobOffsetY: number
  scaleX: number
  scaleY: number
  rotationRadians: number
}

const BODY_HEIGHT_BASE = 14
const BODY_HEIGHT_PER_HP = 0.09
const BODY_HEIGHT_MAX = 40

const CORNER_RADIUS_MIN = 1
const CORNER_RADIUS_MAX = 10
const CORNER_RADIUS_REFERENCE_SPEED = 40 // velocidad del gato más veloz del catálogo → totalmente redondeado

const ACCENT_DAMAGE_MIN = 3 // daño del gato tanque — acento más pálido
const ACCENT_DAMAGE_MAX = 20 // daño del gato pesado — acento más intenso

const IDLE_BOB_BASE_HZ = 1.2
const IDLE_BOB_SPEED_FACTOR = 0.05
const IDLE_BOB_AMPLITUDE = 2 // píxeles

const ATTACK_SQUASH_AMOUNT = 0.12
const ATTACK_ROTATION_MAX_RADIANS = 0.15

const DEATH_ECHO_DURATION_SECONDS = 0.35

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function accentColorFromDamage(damage: number): number {
  const t = clamp((damage - ACCENT_DAMAGE_MIN) / (ACCENT_DAMAGE_MAX - ACCENT_DAMAGE_MIN), 0, 1)
  const r = Math.round(200 + t * 55)
  const g = Math.round(200 - t * 90)
  const b = Math.round(200 - t * 150)
  return (r << 16) + (g << 8) + b
}

/**
 * Deriva la identidad visual de un tipo de gato exclusivamente de sus stats ya existentes
 * (width/hp/speed/damage/attackIntervalSeconds) — sin campos nuevos en src/data/cats.ts
 * (specs/003-identidad-visual-animada/research.md Decisión 1). Acepta cualquier objeto con
 * esos mismos campos (p. ej. los stats efectivos ya evolucionados de un BattleUnit —
 * specs/010-evolucion-de-gatos/plan.md § Key Design Decision 2), no solo un Cat completo.
 */
export function getVisualProfile(cat: Pick<Cat, 'width' | 'hp' | 'speed' | 'damage' | 'attackIntervalSeconds'>): VisualProfile {
  return {
    bodyWidth: cat.width,
    bodyHeight: clamp(BODY_HEIGHT_BASE + cat.hp * BODY_HEIGHT_PER_HP, BODY_HEIGHT_BASE, BODY_HEIGHT_MAX),
    cornerRadius: clamp((cat.speed / CORNER_RADIUS_REFERENCE_SPEED) * CORNER_RADIUS_MAX, CORNER_RADIUS_MIN, CORNER_RADIUS_MAX),
    accentColor: accentColorFromDamage(cat.damage),
    idleBobFrequencyHz: IDLE_BOB_BASE_HZ + cat.speed * IDLE_BOB_SPEED_FACTOR,
    attackPulseDurationSeconds: cat.attackIntervalSeconds,
  }
}

/** Mapeo de solo lectura desde BattleUnit.state — 'Dead' nunca llega aquí porque esas unidades ya no están en useGameStore.getState().units. */
export function getAnimationState(unitState: BattleUnit['state']): AnimationState {
  return unitState === 'Engaged' ? 'Attacking' : 'Idle'
}

/**
 * specs/021-reskin-cyber-modern (data-model.md § AnimationState → carpeta de sprite). Aditivo — no
 * cambia getAnimationState/getAnimationPose. Decide qué arreglo de SpriteAnimationSet (src/game/spriteAssets.ts)
 * corresponde a cada AnimationState.
 */
export const ANIMATION_STATE_TO_SPRITE_FOLDER: Record<AnimationState, 'idle' | 'attack'> = {
  Idle: 'idle',
  Attacking: 'attack',
}

/**
 * Pose de transform (nunca redibujado de Graphics) para el frame actual — specs/003-identidad-visual-animada/research.md Decisión 2.
 * `elapsedSeconds` es un reloj propio de la unidad (con offset por instancia para desincronizar el bob entre unidades).
 * `attackCooldownRemaining` viene directo de BattleUnit — el pulso de ataque se sincroniza con la cadencia real de daño.
 */
export function getAnimationPose(
  animationState: AnimationState,
  profile: VisualProfile,
  elapsedSeconds: number,
  attackCooldownRemaining: number,
): AnimationPose {
  if (animationState === 'Idle') {
    const bobOffsetY = -Math.abs(Math.sin(elapsedSeconds * profile.idleBobFrequencyHz * Math.PI * 2)) * IDLE_BOB_AMPLITUDE
    return { bobOffsetY, scaleX: 1, scaleY: 1, rotationRadians: 0 }
  }

  const cycleProgress = 1 - clamp(attackCooldownRemaining / profile.attackPulseDurationSeconds, 0, 1)
  const pulse = Math.sin(cycleProgress * Math.PI) // 0 → 1 → 0 a lo largo de cada ciclo de ataque

  return {
    bobOffsetY: 0,
    scaleX: 1 + pulse * ATTACK_SQUASH_AMOUNT,
    scaleY: 1 - pulse * ATTACK_SQUASH_AMOUNT,
    rotationRadians: pulse * ATTACK_ROTATION_MAX_RADIANS,
  }
}

export function getDeathEchoDurationSeconds(): number {
  return DEATH_ECHO_DURATION_SECONDS
}

/** Escala/alpha decrecientes para un DeathEcho — specs/003-identidad-visual-animada/data-model.md § DeathEcho. */
export function getDeathEchoPose(remainingSeconds: number): { scale: number; alpha: number } {
  const progress = clamp(remainingSeconds / DEATH_ECHO_DURATION_SECONDS, 0, 1)
  return { scale: progress, alpha: progress }
}
