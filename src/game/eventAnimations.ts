import type { BattleUnit } from '../engine/types'
import type { AnimationPose } from './animation'

/**
 * specs/044-animaciones-de-evento. Cuatro animaciones de cuerpo completo sin arte nuevo — Golpeado, Muerte, Aparición y
 * Retroceso — como matemática pura, sin Pixi ni React (mismo patrón que `animation.ts` y `graphics/cyberEffects.ts`).
 *
 * Los eventos se deducen comparando observaciones de la unidad entre fotogramas (vida, escudo, posición), nunca con
 * eventos del motor (FR-008, research.md Decisión 1). El rastreador es un objeto mutable por unidad que vive en un ref
 * de `UnitSprite` y se actualiza dentro de su `useTick` — sin estado de React ni asignaciones por fotograma (§ VI).
 */

export const EVENT_ANIMATION = {
  hitSeconds: 0.15,
  hitFlashSeconds: 0.08,
  /** Biblia de arte §1: nada parpadea más de 3 veces por segundo (FR-002). */
  hitMinIntervalSeconds: 1 / 3,
  hitShakePx: 1.5,
  spawnSeconds: 0.3,
  spawnHopPx: 6,
  knockbackSeconds: 0.25,
  knockbackHopPx: 4,
  knockbackTiltRadians: 0.17,
  deathSeconds: 0.45,
  deathDriftPx: 12,
  deathHopPx: 12,
  deathSpinRadians: 1.2,
  /** FR-006: inclinación total del cuerpo (ataque + retroceso). */
  maxRotationRadians: 0.2,
  hpEpsilon: 0.01,
  xEpsilon: 0.01,
} as const

type Team = BattleUnit['team']

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function progress(elapsedSeconds: number, durationSeconds: number): number {
  return clamp(elapsedSeconds / durationSeconds, 0, 1)
}

/** Sentido «hacia atrás» (hacia la propia base): el jugador tiene su base a la izquierda (x = 0), el enemigo a la derecha. */
export function backDirection(team: Team): -1 | 1 {
  return team === 'Player' ? -1 : 1
}

// ── Poses por evento ────────────────────────────────────────────────────────────────────────────

export interface HitPose {
  offsetX: number
  flash: boolean
}

/** Golpeado: sacudida horizontal amortiguada de 3 oscilaciones y destello en sus primeros 0,08 s. */
export function getHitPose(elapsedSeconds: number): HitPose {
  const p = progress(elapsedSeconds, EVENT_ANIMATION.hitSeconds)
  return {
    offsetX: EVENT_ANIMATION.hitShakePx * Math.sin(p * Math.PI * 6) * (1 - p),
    flash: p < 1 && elapsedSeconds < EVENT_ANIMATION.hitFlashSeconds,
  }
}

export interface SpawnPose {
  offsetY: number
  scaleX: number
  scaleY: number
  alpha: number
}

/** Aparición: surge aplastada y transparente, se estira con un pequeño salto y aterriza con su forma normal. */
export function getSpawnPose(elapsedSeconds: number, reduced: boolean): SpawnPose {
  const p = progress(elapsedSeconds, EVENT_ANIMATION.spawnSeconds)
  if (reduced) return { offsetY: 0, scaleX: 1, scaleY: 1, alpha: p }
  const squash = (1 - p) ** 3
  const stretch = Math.sin(p * Math.PI)
  return {
    offsetY: -EVENT_ANIMATION.spawnHopPx * stretch,
    scaleX: 1 + 0.3 * squash - 0.08 * stretch,
    scaleY: 1 - 0.35 * squash + 0.12 * stretch,
    alpha: Math.min(1, p / 0.4),
  }
}

export interface KnockbackPose {
  offsetX: number
  offsetY: number
  rotation: number
}

/**
 * Retroceso: el cuerpo se desliza (ease-out) desde donde se veía hasta su nueva posición de combate, con un pequeño salto y
 * una inclinación hacia atrás. `startOffsetPx` = posición visible previa − posición nueva, en píxeles de pantalla.
 */
export function getKnockbackPose(elapsedSeconds: number, startOffsetPx: number, team: Team): KnockbackPose {
  const p = progress(elapsedSeconds, EVENT_ANIMATION.knockbackSeconds)
  const eased = 1 - (1 - p) ** 2
  const arc = Math.sin(p * Math.PI)
  return {
    offsetX: startOffsetPx * (1 - eased),
    offsetY: -EVENT_ANIMATION.knockbackHopPx * arc,
    rotation: backDirection(team) * EVENT_ANIMATION.knockbackTiltRadians * arc,
  }
}

export interface DeathPose {
  offsetX: number
  offsetY: number
  rotation: number
  alpha: number
}

/** Muerte: salto hacia la propia base, giro en ese sentido y desvanecimiento (sustituye al encogimiento de specs/003). */
export function getDeathPose(elapsedSeconds: number, team: Team, reduced: boolean): DeathPose {
  const p = progress(elapsedSeconds, EVENT_ANIMATION.deathSeconds)
  if (reduced) return { offsetX: 0, offsetY: 0, rotation: 0, alpha: 1 - p }
  const dir = backDirection(team)
  return {
    offsetX: dir * EVENT_ANIMATION.deathDriftPx * p,
    offsetY: -EVENT_ANIMATION.deathHopPx * Math.sin(p * Math.PI),
    rotation: dir * EVENT_ANIMATION.deathSpinRadians * p,
    alpha: 1 - p * p,
  }
}

// ── Rastreador por unidad ───────────────────────────────────────────────────────────────────────

export interface UnitEventState {
  spawnElapsed: number | null
  hitElapsed: number | null
  sinceHitStart: number
  knockback: { elapsed: number; startOffsetPx: number } | null
  lastX: number | null
  lastScreenX: number | null
  lastHp: number | null
  lastShield: number | null
}

export interface UnitEventObservation {
  /** Posición de combate en el carril (`BattleUnit.x`). */
  x: number
  /** La misma posición ya en píxeles de pantalla. */
  screenX: number
  hp: number
  shield: number
  team: Team
}

/** Toda unidad nace con su aparición en marcha: el componente se monta exactamente cuando la unidad entra al campo. */
export function createUnitEventState(): UnitEventState {
  return {
    spawnElapsed: 0,
    hitElapsed: null,
    sinceHitStart: Number.POSITIVE_INFINITY,
    knockback: null,
    lastX: null,
    lastScreenX: null,
    lastHp: null,
    lastShield: null,
  }
}

function advance(elapsed: number | null, deltaSeconds: number, durationSeconds: number): number | null {
  if (elapsed === null) return null
  const next = elapsed + deltaSeconds
  return next >= durationSeconds ? null : next
}

function currentKnockbackOffset(state: UnitEventState, team: Team): number {
  return state.knockback ? getKnockbackPose(state.knockback.elapsed, state.knockback.startOffsetPx, team).offsetX : 0
}

/**
 * Avanza los temporizadores y detecta eventos nuevos comparando con la observación anterior (data-model.md § 3). Muta
 * `state`. Con `reduced`, Golpeado y Retroceso no se inician (FR-007).
 */
export function updateUnitEvents(state: UnitEventState, obs: UnitEventObservation, deltaSeconds: number, reduced: boolean): void {
  state.spawnElapsed = advance(state.spawnElapsed, deltaSeconds, EVENT_ANIMATION.spawnSeconds)
  state.hitElapsed = advance(state.hitElapsed, deltaSeconds, EVENT_ANIMATION.hitSeconds)
  state.sinceHitStart += deltaSeconds
  if (state.knockback) {
    const elapsed = advance(state.knockback.elapsed, deltaSeconds, EVENT_ANIMATION.knockbackSeconds)
    state.knockback = elapsed === null ? null : { elapsed, startOffsetPx: state.knockback.startOffsetPx }
  }

  if (state.lastHp !== null && state.lastShield !== null) {
    const tookDamage =
      state.lastHp - obs.hp > EVENT_ANIMATION.hpEpsilon || state.lastShield - obs.shield > EVENT_ANIMATION.hpEpsilon
    if (tookDamage && !reduced && state.sinceHitStart >= EVENT_ANIMATION.hitMinIntervalSeconds) {
      state.hitElapsed = 0
      state.sinceHitStart = 0
    }
  }

  if (state.lastX !== null && state.lastScreenX !== null) {
    const pushedBack =
      obs.team === 'Player' ? obs.x < state.lastX - EVENT_ANIMATION.xEpsilon : obs.x > state.lastX + EVENT_ANIMATION.xEpsilon
    if (pushedBack && !reduced) {
      const visibleX = state.lastScreenX + currentKnockbackOffset(state, obs.team)
      state.knockback = { elapsed: 0, startOffsetPx: visibleX - obs.screenX }
    }
  }

  state.lastX = obs.x
  state.lastScreenX = obs.screenX
  state.lastHp = obs.hp
  state.lastShield = obs.shield
}

export interface UnitEventPose {
  offsetX: number
  offsetY: number
  scaleX: number
  scaleY: number
  rotation: number
  alpha: number
  flash: boolean
  ringOffsetX: number
  ringAlpha: number
}

/** Combina la pose de reposo/ataque con los eventos activos (data-model.md § 4). Sin eventos devuelve la pose base intacta. */
export function getUnitEventPose(state: UnitEventState, base: AnimationPose, team: Team, reduced: boolean): UnitEventPose {
  const spawn = state.spawnElapsed === null ? null : getSpawnPose(state.spawnElapsed, reduced)
  const hit = state.hitElapsed === null ? null : getHitPose(state.hitElapsed)
  const knockback = state.knockback ? getKnockbackPose(state.knockback.elapsed, state.knockback.startOffsetPx, team) : null

  const knockbackX = knockback?.offsetX ?? 0
  const alpha = spawn?.alpha ?? 1
  return {
    offsetX: (hit?.offsetX ?? 0) + knockbackX,
    offsetY: base.bobOffsetY + (spawn?.offsetY ?? 0) + (knockback?.offsetY ?? 0),
    scaleX: base.scaleX * (spawn?.scaleX ?? 1),
    scaleY: base.scaleY * (spawn?.scaleY ?? 1),
    rotation: clamp(base.rotationRadians + (knockback?.rotation ?? 0), -EVENT_ANIMATION.maxRotationRadians, EVENT_ANIMATION.maxRotationRadians),
    alpha,
    flash: hit?.flash ?? false,
    ringOffsetX: knockbackX,
    ringAlpha: alpha,
  }
}
