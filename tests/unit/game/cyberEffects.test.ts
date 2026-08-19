import { describe, expect, it } from 'vitest'
import {
  getFloatingDamageDurationSeconds,
  getFloatingDamagePose,
  getImpactEffectDurationSeconds,
  getShockwavePose,
  getSparkCount,
  getSparkPose,
} from '../../../src/game/graphics/cyberEffects'

describe('getShockwavePose', () => {
  it('al inicio el radio es 0 y el alpha es máximo', () => {
    const pose = getShockwavePose(0, 40)
    expect(pose.radius).toBeCloseTo(0)
    expect(pose.alpha).toBeGreaterThan(0)
  })

  it('al terminar la duración el radio alcanza el máximo y el alpha llega a 0', () => {
    const pose = getShockwavePose(getImpactEffectDurationSeconds(), 40)
    expect(pose.radius).toBeCloseTo(40)
    expect(pose.alpha).toBeCloseTo(0)
  })

  it('el radio crece monótonamente con el tiempo', () => {
    const early = getShockwavePose(0.05, 40)
    const late = getShockwavePose(0.3, 40)
    expect(late.radius).toBeGreaterThan(early.radius)
  })

  it('nunca excede el radio máximo ni produce alpha negativo pasada la duración', () => {
    const overflow = getShockwavePose(10, 40)
    expect(overflow.radius).toBeLessThanOrEqual(40)
    expect(overflow.alpha).toBeGreaterThanOrEqual(0)
  })
})

describe('getSparkPose', () => {
  it('distribuye las chispas en ángulos distintos — offsets distintos para índices distintos', () => {
    const a = getSparkPose(0.2, 0, getSparkCount(), 20)
    const b = getSparkPose(0.2, 1, getSparkCount(), 20)
    expect(a.offsetX).not.toBeCloseTo(b.offsetX)
  })

  it('se alejan del centro con el tiempo', () => {
    const early = getSparkPose(0.05, 0, getSparkCount(), 20)
    const late = getSparkPose(0.3, 0, getSparkCount(), 20)
    const earlyDist = Math.hypot(early.offsetX, early.offsetY)
    const lateDist = Math.hypot(late.offsetX, late.offsetY)
    expect(lateDist).toBeGreaterThan(earlyDist)
  })

  it('es determinista — mismos parámetros producen la misma pose', () => {
    expect(getSparkPose(0.15, 2, 5, 30)).toEqual(getSparkPose(0.15, 2, 5, 30))
  })
})

describe('getFloatingDamagePose', () => {
  it('al inicio no se ha desplazado y el alpha es máximo', () => {
    const pose = getFloatingDamagePose(0)
    expect(pose.offsetY).toBeCloseTo(0)
    expect(pose.alpha).toBeCloseTo(1)
  })

  it('asciende (offsetY negativo) y se desvanece con el tiempo', () => {
    const pose = getFloatingDamagePose(getFloatingDamageDurationSeconds() / 2)
    expect(pose.offsetY).toBeLessThan(0)
    expect(pose.alpha).toBeGreaterThan(0)
    expect(pose.alpha).toBeLessThan(1)
  })

  it('al terminar su duración el alpha llega a 0', () => {
    const pose = getFloatingDamagePose(getFloatingDamageDurationSeconds())
    expect(pose.alpha).toBeCloseTo(0)
  })
})
