import { describe, expect, it } from 'vitest'
import { NEWS_ENTRIES } from '../../../src/data/news'

describe('NEWS_ENTRIES', () => {
  it('no está vacío', () => {
    expect(NEWS_ENTRIES.length).toBeGreaterThan(0)
  })

  it('cada entrada tiene id/title/date/body no vacíos', () => {
    for (const entry of NEWS_ENTRIES) {
      expect(entry.id).toBeTruthy()
      expect(entry.title).toBeTruthy()
      expect(entry.date).toBeTruthy()
      expect(entry.body).toBeTruthy()
    }
  })

  it('todos los id son únicos', () => {
    const ids = NEWS_ENTRIES.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ordenar por date descendente reproduce un orden estable sin empates', () => {
    const dates = NEWS_ENTRIES.map((entry) => entry.date)
    expect(new Set(dates).size).toBe(dates.length)

    const sorted = [...NEWS_ENTRIES].sort((a, b) => (a.date < b.date ? 1 : -1))
    for (let i = 0; i < sorted.length - 1; i += 1) {
      expect(sorted[i].date > sorted[i + 1].date).toBe(true)
    }
  })
})
