import { describe, expect, it } from 'vitest'
import type { AnimationPose } from '../../../src/game/animation'
import {
  EVENT_ANIMATION,
  createUnitEventState,
  getDeathPose,
  getHitPose,
  getKnockbackPose,
  getSpawnPose,
  getUnitEventPose,
  updateUnitEvents,
  type UnitEventObservation,
  type UnitEventState,
} from '../../../src/game/eventAnimations'
import { HIT_FLASH_MATRIX } from '../../../src/game/graphics/hitFlash'

const BASE: AnimationPose = { bobOffsetY: -1, scaleX: 1.05, scaleY: 0.95, rotationRadians: 0.1 }
const FRAME = 1 / 60

function observe(overrides: Partial<UnitEventObservation> = {}): UnitEventObservation {
  return { x: 100, screenX: 300, hp: 50, shield: 0, team: 'Player', ...overrides }
}

/** Estado ya «asentado»: sin aparición en curso y con una observación previa. */
function settled(obs: UnitEventObservation = observe()): UnitEventState {
  const state = createUnitEventState()
  updateUnitEvents(state, obs, EVENT_ANIMATION.spawnSeconds + 0.01, false)
  return state
}

describe('Golpeado — specs/044-animaciones-de-evento (US1/FR-001/FR-002)', () => {
  it('empieza con destello, sacude como mucho 1,5 px y termina en la pose normal', () => {
    expect(getHitPose(0).flash).toBe(true)
    for (let t = 0; t <= EVENT_ANIMATION.hitSeconds; t += 0.005) {
      expect(Math.abs(getHitPose(t).offsetX)).toBeLessThanOrEqual(EVENT_ANIMATION.hitShakePx)
    }
    expect(getHitPose(EVENT_ANIMATION.hitFlashSeconds + 0.001).flash).toBe(false)
    const end = getHitPose(EVENT_ANIMATION.hitSeconds)
    expect(end.flash).toBe(false)
    expect(end.offsetX).toBeCloseTo(0)
  })

  it('una bajada de vida o de escudo inicia la reacción; sin bajada no', () => {
    const byHp = settled()
    updateUnitEvents(byHp, observe({ hp: 40 }), FRAME, false)
    expect(byHp.hitElapsed).toBe(0)

    const byShield = settled(observe({ shield: 20 }))
    updateUnitEvents(byShield, observe({ shield: 5 }), FRAME, false)
    expect(byShield.hitElapsed).toBe(0)

    const untouched = settled()
    updateUnitEvents(untouched, observe({ hp: 50 }), FRAME, false)
    expect(untouched.hitElapsed).toBeNull()
  })

  it('un golpe antes de 1/3 s desde el anterior no inicia otra reacción; después sí', () => {
    const state = settled()
    updateUnitEvents(state, observe({ hp: 40 }), FRAME, false)
    expect(state.hitElapsed).toBe(0)
    updateUnitEvents(state, observe({ hp: 39 }), 0.2, false)
    expect(state.hitElapsed).toBeNull() // la primera ya terminó (0,15 s) y la segunda se omitió
    updateUnitEvents(state, observe({ hp: 38 }), 0.2, false)
    expect(state.hitElapsed).toBe(0)
  })

  it('30 golpes en un segundo producen como mucho 3 destellos', () => {
    const state = settled()
    let starts = 0
    let hp = 50
    for (let i = 0; i < 30; i += 1) {
      hp -= 1
      updateUnitEvents(state, observe({ hp }), 1 / 30, false)
      if (state.hitElapsed === 0) starts += 1
    }
    expect(starts).toBeLessThanOrEqual(3)
    expect(starts).toBeGreaterThan(0)
  })

  it('con «reducir movimiento» nunca se inicia', () => {
    const state = settled()
    updateUnitEvents(state, observe({ hp: 10 }), FRAME, true)
    expect(state.hitElapsed).toBeNull()
  })

  it('el filtro de destello aclara sin tocar el alfa', () => {
    expect([HIT_FLASH_MATRIX[0], HIT_FLASH_MATRIX[6], HIT_FLASH_MATRIX[12]]).toEqual([0.35, 0.35, 0.35])
    expect([HIT_FLASH_MATRIX[4], HIT_FLASH_MATRIX[9], HIT_FLASH_MATRIX[14]]).toEqual([0.65, 0.65, 0.65])
    expect(HIT_FLASH_MATRIX.slice(15)).toEqual([0, 0, 0, 1, 0])
  })
})

describe('Composición — specs/044 (FR-006)', () => {
  it('sin eventos activos devuelve exactamente la pose base', () => {
    const pose = getUnitEventPose(settled(), BASE, 'Player', false)
    expect(pose).toEqual({
      offsetX: 0,
      offsetY: BASE.bobOffsetY,
      scaleX: BASE.scaleX,
      scaleY: BASE.scaleY,
      rotation: BASE.rotationRadians,
      alpha: 1,
      flash: false,
      ringOffsetX: 0,
      ringAlpha: 1,
    })
  })

  it('un golpe durante la aparición suma la sacudida a la pose de aparición', () => {
    const state = createUnitEventState()
    updateUnitEvents(state, observe(), FRAME, false)
    updateUnitEvents(state, observe({ hp: 40 }), FRAME, false)
    expect(state.spawnElapsed).not.toBeNull()
    expect(state.hitElapsed).toBe(0)
    state.hitElapsed = 0.01
    const pose = getUnitEventPose(state, BASE, 'Player', false)
    expect(pose.offsetX).toBeCloseTo(getHitPose(0.01).offsetX)
    expect(pose.flash).toBe(true)
    expect(pose.alpha).toBeLessThan(1)
  })
})

describe('Muerte — specs/044 (US2/FR-003)', () => {
  it('arranca neutra y opaca y termina transparente en 0,45 s (≤ 0,5 s)', () => {
    expect(EVENT_ANIMATION.deathSeconds).toBeLessThanOrEqual(0.5)
    expect(getDeathPose(0, 'Player', false)).toEqual({ offsetX: -0, offsetY: -0, rotation: -0, alpha: 1 })
    expect(getDeathPose(EVENT_ANIMATION.deathSeconds, 'Player', false).alpha).toBe(0)
  })

  it('cada bando sale despedido y gira hacia su propia base', () => {
    const player = getDeathPose(0.3, 'Player', false)
    const enemy = getDeathPose(0.3, 'Enemy', false)
    expect(player.offsetX).toBeLessThan(0)
    expect(player.rotation).toBeLessThan(0)
    expect(enemy.offsetX).toBeGreaterThan(0)
    expect(enemy.rotation).toBeGreaterThan(0)
    expect(player.offsetY).toBeLessThan(0) // salto hacia arriba
  })

  it('con «reducir movimiento» solo se desvanece', () => {
    const pose = getDeathPose(0.2, 'Enemy', true)
    expect(pose.offsetX).toBe(0)
    expect(pose.offsetY).toBe(0)
    expect(pose.rotation).toBe(0)
    expect(pose.alpha).toBeCloseTo(1 - 0.2 / EVENT_ANIMATION.deathSeconds)
  })
})

describe('Aparición — specs/044 (US3/FR-004)', () => {
  it('toda unidad nueva arranca con la aparición en marcha', () => {
    expect(createUnitEventState().spawnElapsed).toBe(0)
  })

  it('surge aplastada y transparente y aterriza con su forma normal en 0,3 s', () => {
    const start = getSpawnPose(0, false)
    expect(start.scaleX).toBeGreaterThan(1)
    expect(start.scaleY).toBeLessThan(1)
    expect(start.alpha).toBe(0)
    const end = getSpawnPose(EVENT_ANIMATION.spawnSeconds, false)
    expect(end.offsetY).toBeCloseTo(0)
    expect(end.scaleX).toBeCloseTo(1)
    expect(end.scaleY).toBeCloseTo(1)
    expect(end.alpha).toBe(1)
  })

  it('el temporizador se apaga al terminar y el anillo surge con el cuerpo', () => {
    const state = createUnitEventState()
    updateUnitEvents(state, observe(), 0.1, false)
    const during = getUnitEventPose(state, BASE, 'Player', false)
    expect(during.ringAlpha).toBe(during.alpha)
    expect(during.ringAlpha).toBeLessThan(1)
    updateUnitEvents(state, observe(), EVENT_ANIMATION.spawnSeconds, false)
    expect(state.spawnElapsed).toBeNull()
  })

  it('con «reducir movimiento» es solo un fundido', () => {
    expect(getSpawnPose(0.15, true)).toEqual({ offsetY: 0, scaleX: 1, scaleY: 1, alpha: 0.5 })
  })
})

describe('Retroceso — specs/044 (US4/FR-005)', () => {
  it('un jugador empujado hacia la izquierda se desliza desde su posición visible anterior', () => {
    const state = settled()
    updateUnitEvents(state, observe({ x: 70, screenX: 255 }), FRAME, false)
    expect(state.knockback).toEqual({ elapsed: 0, startOffsetPx: 45 })
    const pose = getUnitEventPose(state, { bobOffsetY: 0, scaleX: 1, scaleY: 1, rotationRadians: 0 }, 'Player', false)
    expect(pose.offsetX).toBeCloseTo(45) // en el primer instante se ve donde estaba
    expect(pose.ringOffsetX).toBeCloseTo(45)
  })

  it('un enemigo empujado hacia la derecha arranca con desplazamiento negativo', () => {
    const state = settled(observe({ team: 'Enemy' }))
    updateUnitEvents(state, observe({ team: 'Enemy', x: 130, screenX: 345 }), FRAME, false)
    expect(state.knockback?.startOffsetPx).toBe(-45)
  })

  it('el avance normal no dispara el retroceso', () => {
    const player = settled()
    updateUnitEvents(player, observe({ x: 101, screenX: 301.5 }), FRAME, false)
    expect(player.knockback).toBeNull()
    const enemy = settled(observe({ team: 'Enemy' }))
    updateUnitEvents(enemy, observe({ team: 'Enemy', x: 99, screenX: 298.5 }), FRAME, false)
    expect(enemy.knockback).toBeNull()
  })

  it('termina exactamente en la posición de combate a los 0,25 s', () => {
    expect(getKnockbackPose(EVENT_ANIMATION.knockbackSeconds, 45, 'Player')).toEqual({
      offsetX: 0,
      offsetY: -EVENT_ANIMATION.knockbackHopPx * Math.sin(Math.PI),
      rotation: -EVENT_ANIMATION.knockbackTiltRadians * Math.sin(Math.PI),
    })
    const state = settled()
    updateUnitEvents(state, observe({ x: 70, screenX: 255 }), FRAME, false)
    updateUnitEvents(state, observe({ x: 70, screenX: 255 }), EVENT_ANIMATION.knockbackSeconds, false)
    expect(state.knockback).toBeNull()
  })

  it('un segundo empujón a mitad del deslizamiento continúa desde la posición visible', () => {
    const state = settled()
    updateUnitEvents(state, observe({ x: 70, screenX: 255 }), FRAME, false)
    updateUnitEvents(state, observe({ x: 70, screenX: 255 }), 0.1, false)
    const visible = 255 + getKnockbackPose(state.knockback!.elapsed, 45, 'Player').offsetX
    updateUnitEvents(state, observe({ x: 40, screenX: 210 }), 0, false)
    expect(state.knockback?.startOffsetPx).toBeCloseTo(visible - 210)
  })

  it('se inclina hacia atrás según el bando, sin pasar de 0,17 rad, y la rotación total queda acotada', () => {
    const mid = EVENT_ANIMATION.knockbackSeconds / 2
    expect(getKnockbackPose(mid, 10, 'Player').rotation).toBeCloseTo(-EVENT_ANIMATION.knockbackTiltRadians)
    expect(getKnockbackPose(mid, -10, 'Enemy').rotation).toBeCloseTo(EVENT_ANIMATION.knockbackTiltRadians)

    const state = settled(observe({ team: 'Enemy' }))
    updateUnitEvents(state, observe({ team: 'Enemy', x: 130, screenX: 345 }), FRAME, false)
    state.knockback!.elapsed = mid
    const attacking: AnimationPose = { bobOffsetY: 0, scaleX: 1.12, scaleY: 0.88, rotationRadians: 0.15 }
    expect(getUnitEventPose(state, attacking, 'Enemy', false).rotation).toBe(EVENT_ANIMATION.maxRotationRadians)
  })

  it('con «reducir movimiento» la unidad se coloca directamente', () => {
    const state = settled()
    updateUnitEvents(state, observe({ x: 70, screenX: 255 }), FRAME, true)
    expect(state.knockback).toBeNull()
  })
})
