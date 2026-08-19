import { describe, expect, it } from 'vitest'
import { getLaneScreenX, getLaneScreenY, LANE_MARGIN_FRACTION } from '../../../src/game/graphics/layout'

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
