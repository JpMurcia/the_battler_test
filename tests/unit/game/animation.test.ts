import { describe, expect, it } from 'vitest'
import { CATS } from '../../../src/data/cats'
import {
  ANIMATION_STATE_TO_SPRITE_FOLDER,
  getAnimationPose,
  getAnimationState,
  getDeathEchoPose,
  getVisualProfile,
} from '../../../src/game/animation'

describe('getVisualProfile', () => {
  it('es determinista — el mismo Cat produce siempre el mismo VisualProfile', () => {
    const cat = CATS.find((candidate) => candidate.id === 'basic-cat')!

    expect(getVisualProfile(cat)).toEqual(getVisualProfile(cat))
  })

  it('produce parámetros distintos para los 4 tipos de gato del catálogo', () => {
    const profiles = CATS.map((cat) => getVisualProfile(cat))
    const serialized = profiles.map((profile) => JSON.stringify(profile))

    expect(new Set(serialized).size).toBe(CATS.length)
  })

  it('un gato con más hp produce un cuerpo más alto', () => {
    const tank = getVisualProfile(CATS.find((cat) => cat.id === 'tank-cat')!)
    const speed = getVisualProfile(CATS.find((cat) => cat.id === 'speed-cat')!)

    expect(tank.bodyHeight).toBeGreaterThan(speed.bodyHeight)
  })

  it('un gato más veloz produce un bob de idle más frecuente', () => {
    const speed = getVisualProfile(CATS.find((cat) => cat.id === 'speed-cat')!)
    const heavy = getVisualProfile(CATS.find((cat) => cat.id === 'heavy-cat')!)

    expect(speed.idleBobFrequencyHz).toBeGreaterThan(heavy.idleBobFrequencyHz)
  })

  it('bodyWidth reutiliza el width existente del gato (coincide con su hitbox de colisión)', () => {
    const cat = CATS.find((candidate) => candidate.id === 'heavy-cat')!

    expect(getVisualProfile(cat).bodyWidth).toBe(cat.width)
  })

  it('attackPulseDurationSeconds reutiliza attackIntervalSeconds sin transformarlo', () => {
    const cat = CATS.find((candidate) => candidate.id === 'speed-cat')!

    expect(getVisualProfile(cat).attackPulseDurationSeconds).toBe(cat.attackIntervalSeconds)
  })

  it('specs/010-evolucion-de-gatos: acepta stats efectivos evolucionados (no solo un Cat completo) y produce un perfil distinto al de la Forma Base', () => {
    const cat = CATS.find((candidate) => candidate.id === 'tank-cat')!
    const baseProfile = getVisualProfile(cat)

    const trueFormProfile = getVisualProfile({
      width: cat.width,
      hp: cat.hp * 2,
      speed: cat.speed,
      damage: cat.damage * 2,
      attackIntervalSeconds: cat.attackIntervalSeconds,
    })

    expect(trueFormProfile.bodyHeight).toBeGreaterThan(baseProfile.bodyHeight)
    expect(trueFormProfile.accentColor).not.toBe(baseProfile.accentColor)
  })
})

describe('getAnimationState', () => {
  it('mapea Moving a Idle', () => {
    expect(getAnimationState('Moving')).toBe('Idle')
  })

  it('mapea Engaged a Attacking', () => {
    expect(getAnimationState('Engaged')).toBe('Attacking')
  })
})

describe('ANIMATION_STATE_TO_SPRITE_FOLDER (specs/021-reskin-cyber-modern)', () => {
  it('mapea Idle a la carpeta idle', () => {
    expect(ANIMATION_STATE_TO_SPRITE_FOLDER.Idle).toBe('idle')
  })

  it('mapea Attacking a la carpeta attack', () => {
    expect(ANIMATION_STATE_TO_SPRITE_FOLDER.Attacking).toBe('attack')
  })
})

describe('getAnimationPose', () => {
  const profile = getVisualProfile(CATS.find((cat) => cat.id === 'basic-cat')!)

  it('en Idle nunca escala ni rota — solo desplaza verticalmente (bob)', () => {
    const pose = getAnimationPose('Idle', profile, 0.37, 0)

    expect(pose.scaleX).toBe(1)
    expect(pose.scaleY).toBe(1)
    expect(pose.rotationRadians).toBe(0)
  })

  it('en Attacking con cooldown recién reiniciado (inicio del ciclo) no hay pulso', () => {
    const pose = getAnimationPose('Attacking', profile, 0, profile.attackPulseDurationSeconds)

    expect(pose.scaleX).toBeCloseTo(1)
    expect(pose.scaleY).toBeCloseTo(1)
  })

  it('en Attacking a mitad de su ciclo de cooldown el pulso está en su punto máximo', () => {
    const pose = getAnimationPose('Attacking', profile, 0, profile.attackPulseDurationSeconds / 2)

    expect(pose.scaleX).toBeGreaterThan(1)
    expect(pose.scaleY).toBeLessThan(1)
    expect(pose.rotationRadians).toBeGreaterThan(0)
  })
})

describe('getDeathEchoPose', () => {
  it('al inicio (remainingSeconds al máximo) escala y alpha están en su valor pleno', () => {
    const pose = getDeathEchoPose(0.35)

    expect(pose.scale).toBeCloseTo(1)
    expect(pose.alpha).toBeCloseTo(1)
  })

  it('al llegar a 0 segundos restantes, escala y alpha llegan a 0', () => {
    const pose = getDeathEchoPose(0)

    expect(pose.scale).toBe(0)
    expect(pose.alpha).toBe(0)
  })

  it('nunca produce valores fuera de [0, 1]', () => {
    const negative = getDeathEchoPose(-1)
    const overflow = getDeathEchoPose(10)

    expect(negative.scale).toBe(0)
    expect(overflow.scale).toBe(1)
  })
})
