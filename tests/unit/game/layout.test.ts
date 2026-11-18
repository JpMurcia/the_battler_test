import { describe, expect, it } from 'vitest'
import {
  BATTLE_REFERENCE_SCREEN,
  BATTLE_VISUAL_SCALE_MAX,
  BATTLE_VISUAL_SCALE_MIN,
  getBattleVisualScale,
  getLaneScreenX,
  getLaneScreenY,
  LANE_MARGIN_FRACTION,
} from '../../../src/game/graphics/layout'

describe('getBattleVisualScale (specs/045)', () => {
  const { width, height } = BATTLE_REFERENCE_SCREEN

  it('en el canvas de referencia el Gato Básico (18,5 de alto) mide 64 px', () => {
    expect(18.5 * getBattleVisualScale(width, height)).toBeCloseTo(64)
  })

  it('crece con el canvas y sigue al lado más limitante', () => {
    expect(getBattleVisualScale(width * 1.5, height * 1.5)).toBeGreaterThan(getBattleVisualScale(width, height))
    expect(getBattleVisualScale(width * 3, height)).toBeCloseTo(getBattleVisualScale(width, height))
  })

  it('se mantiene entre el mínimo y el máximo', () => {
    expect(getBattleVisualScale(100, 50)).toBe(BATTLE_VISUAL_SCALE_MIN)
    expect(getBattleVisualScale(width * 10, height * 10)).toBe(BATTLE_VISUAL_SCALE_MAX)
  })

  it('con dimensiones 0 no lanza y devuelve el mínimo', () => {
    expect(getBattleVisualScale(0, 0)).toBe(BATTLE_VISUAL_SCALE_MIN)
  })
})

describe('getLaneScreenX', () => {
  it('mapea x=0 (base del jugador) al margen izquierdo', () => {
    expect(getLaneScreenX(0, 400, 1000)).toBeCloseTo(1000 * LANE_MARGIN_FRACTION)
  })

  it('mapea x=laneLength (base enemiga) al margen derecho', () => {
    expect(getLaneScreenX(400, 400, 1000)).toBeCloseTo(1000 * (1 - LANE_MARGIN_FRACTION))
  })

  it('mapea el punto medio del carril al punto medio de la zona útil', () => {
    expect(getLaneScreenX(200, 400, 1000)).toBeCloseTo(500)
  })

  it('escala proporcionalmente con el ancho de pantalla', () => {
    const narrow = getLaneScreenX(200, 400, 500)
    const wide = getLaneScreenX(200, 400, 1000)
    expect(wide).toBeGreaterThan(narrow)
  })

  it('con laneLength 0 no lanza y devuelve 0', () => {
    expect(getLaneScreenX(10, 0, 1000)).toBe(0)
  })

  it('con screenWidth 0 no lanza y devuelve 0', () => {
    expect(getLaneScreenX(10, 400, 0)).toBe(0)
  })
})

describe('getLaneScreenY', () => {
  it('es una fracción fija de la altura de pantalla', () => {
    expect(getLaneScreenY(800)).toBeGreaterThan(0)
    expect(getLaneScreenY(800)).toBeLessThan(800)
  })

  it('escala proporcionalmente con la altura de pantalla', () => {
    expect(getLaneScreenY(1000)).toBeGreaterThan(getLaneScreenY(500))
  })
})
