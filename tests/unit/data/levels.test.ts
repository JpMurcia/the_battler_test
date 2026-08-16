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

  it('specs/011-nivel-2-hacia-el-futuro (T007): level-2.difficulty >= level-1.difficulty (misma región)', () => {
    const level1 = LEVELS.find((candidate) => candidate.id === 'level-1')!
    const level2 = LEVELS.find((candidate) => candidate.id === 'level-2')!

    expect(level2.region).toBe(level1.region)
    expect(level2.difficulty).toBeGreaterThanOrEqual(level1.difficulty)
  })
})
