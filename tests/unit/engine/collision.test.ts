import { describe, expect, it } from 'vitest'
import { overlaps1D, withinRange1D } from '../../../src/engine/collision'

describe('overlaps1D', () => {
  it('detecta superposición cuando los intervalos se solapan', () => {
    expect(overlaps1D({ x: 0, width: 10 }, { x: 5, width: 10 })).toBe(true)
  })

  it('no detecta superposición cuando los intervalos están separados', () => {
    expect(overlaps1D({ x: 0, width: 10 }, { x: 20, width: 10 })).toBe(false)
  })

  it('detecta superposición cuando un intervalo contiene completamente al otro', () => {
    expect(overlaps1D({ x: 0, width: 100 }, { x: 40, width: 5 })).toBe(true)
  })

  it('no detecta superposición cuando los bordes solo se tocan (sin solape real)', () => {
    expect(overlaps1D({ x: 0, width: 10 }, { x: 10, width: 10 })).toBe(false)
  })

  it('es simétrica respecto al orden de los argumentos', () => {
    const a = { x: 3, width: 8 }
    const b = { x: 5, width: 4 }
    expect(overlaps1D(a, b)).toBe(overlaps1D(b, a))
  })
})

describe('withinRange1D', () => {
  it('con range = 0 coincide con overlaps1D en superposición', () => {
    const a = { x: 0, width: 10 }
    const b = { x: 5, width: 10 }
    expect(withinRange1D(a, b, 0)).toBe(overlaps1D(a, b))
  })

  it('con range = 0 coincide con overlaps1D en separación', () => {
    const a = { x: 0, width: 10 }
    const b = { x: 20, width: 10 }
    expect(withinRange1D(a, b, 0)).toBe(overlaps1D(a, b))
  })

  it('con range > 0 detecta candidatos separados dentro de esa distancia', () => {
    const a = { x: 0, width: 10 } // borde derecho en 10
    const b = { x: 15, width: 10 } // borde izquierdo en 15, gap = 5
    expect(withinRange1D(a, b, 6)).toBe(true) // gap (5) < range (6)
    expect(withinRange1D(a, b, 5)).toBe(false) // gap == range: borde, sin solape real (misma convención que overlaps1D)
    expect(withinRange1D(a, b, 4)).toBe(false) // gap (5) > range (4)
  })

  it('es simétrica respecto al orden de los argumentos', () => {
    const a = { x: 0, width: 10 }
    const b = { x: 15, width: 10 }
    expect(withinRange1D(a, b, 5)).toBe(withinRange1D(b, a, 5))
  })
})
