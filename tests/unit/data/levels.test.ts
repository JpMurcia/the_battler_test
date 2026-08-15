import { describe, expect, it } from 'vitest'
import { LEVELS } from '../../../src/data/levels'

describe('LEVELS difficulty por región', () => {
  it('dentro de cada región, la dificultad es no decreciente en el orden de aparición (FR-008)', () => {
    const lastDifficultyByRegion = new Map<string, number>()

    for (const level of LEVELS) {
      const previous = lastDifficultyByRegion.get(level.region)
      if (previous !== undefined) {
        expect(level.difficulty).toBeGreaterThanOrEqual(previous)
      }
      lastDifficultyByRegion.set(level.region, level.difficulty)
    }
  })
})
