import { describe, expect, it } from 'vitest'
import { getActiveTreasureFestival, getFestivalTimeRemainingMs, type TreasureFestival } from '../../../src/data/treasureFestival'

const FESTIVAL: TreasureFestival = {
  id: 'test-festival',
  name: 'Festival de Prueba',
  currencyMultiplier: 2,
  timeWindows: [
    { startMs: 1000, endMs: 2000 },
    { startMs: 5000, endMs: 6000 },
  ],
}

describe('treasureFestival (specs/032-festival-de-tesoros)', () => {
  it('getActiveTreasureFestival devuelve el festival cuya ventana contiene nowMs', () => {
    expect(getActiveTreasureFestival([FESTIVAL], 1500)).toBe(FESTIVAL)
    expect(getActiveTreasureFestival([FESTIVAL], 5500)).toBe(FESTIVAL)
  })

  it('getActiveTreasureFestival devuelve undefined fuera de cualquier ventana', () => {
    expect(getActiveTreasureFestival([FESTIVAL], 3000)).toBeUndefined()
    expect(getActiveTreasureFestival([FESTIVAL], 0)).toBeUndefined()
  })

  it('getFestivalTimeRemainingMs devuelve la diferencia exacta hasta endMs de la ventana activa', () => {
    expect(getFestivalTimeRemainingMs(FESTIVAL, 1500)).toBe(500)
    expect(getFestivalTimeRemainingMs(FESTIVAL, 5900)).toBe(100)
  })

  it('getFestivalTimeRemainingMs devuelve 0 si ninguna ventana contiene nowMs', () => {
    expect(getFestivalTimeRemainingMs(FESTIVAL, 3000)).toBe(0)
  })
})
