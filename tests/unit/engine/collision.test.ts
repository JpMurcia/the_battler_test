import { describe, expect, it } from 'vitest'
import { overlaps1D } from '../../../src/engine/collision'

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
