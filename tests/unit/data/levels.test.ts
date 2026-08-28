import { describe, expect, it } from 'vitest'
import { CATS } from '../../../src/data/cats'
import { IMPERIO_CAP1_LEVELS, LEVELS } from '../../../src/data/levels'
import { SAGA_ARCS } from '../../../src/data/sagaArcs'

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

/** specs/027-capitulo-1-imperio-gatos T008. */
describe('IMPERIO_CAP1_LEVELS — specs/027-capitulo-1-imperio-gatos', () => {
  it('tiene exactamente 48 etapas, todas añadidas a LEVELS', () => {
    expect(IMPERIO_CAP1_LEVELS.length).toBe(48)
    for (const level of IMPERIO_CAP1_LEVELS) {
      expect(LEVELS).toContain(level)
    }
  })

  it('id/mapPosition/treasureId son únicos entre las 48 etapas', () => {
    const ids = IMPERIO_CAP1_LEVELS.map((level) => level.id)
    expect(new Set(ids).size).toBe(48)

    const treasureIds = IMPERIO_CAP1_LEVELS.map((level) => level.treasureId)
    expect(new Set(treasureIds).size).toBe(48)

    const positions = IMPERIO_CAP1_LEVELS.map((level) => `${level.mapPosition.x},${level.mapPosition.y}`)
    expect(new Set(positions).size).toBe(48)
  })

  it('mapPosition está dentro de 0-100 en ambos ejes', () => {
    for (const level of IMPERIO_CAP1_LEVELS) {
      expect(level.mapPosition.x).toBeGreaterThanOrEqual(0)
      expect(level.mapPosition.x).toBeLessThanOrEqual(100)
      expect(level.mapPosition.y).toBeGreaterThanOrEqual(0)
      expect(level.mapPosition.y).toBeLessThanOrEqual(100)
    }
  })

  it('los 12 firstVictoryUnlockCatId (etapas hito, sin contar la 48) son únicos y resuelven a un catId real', () => {
    const unlockIds = IMPERIO_CAP1_LEVELS.map((level) => level.firstVictoryUnlockCatId).filter((id): id is string => id !== undefined)

    expect(unlockIds.length).toBe(12)
    expect(new Set(unlockIds).size).toBe(12)
    for (const catId of unlockIds) {
      expect(CATS.some((cat) => cat.id === catId)).toBe(true)
    }
  })

  it('los 12 firstVictoryUnlockCatId coinciden exactamente con los 9 Normal + 3 Especial no-iniciales de esta spec (specs/027 T011)', () => {
    const unlockIds = new Set(
      IMPERIO_CAP1_LEVELS.map((level) => level.firstVictoryUnlockCatId).filter((id): id is string => id !== undefined),
    )
    // cat-recluta (inicial, sin desbloqueo) y cat-veterano (recompensa de arco, no de nivel) quedan fuera.
    const expected = new Set([
      'cat-yunque', 'cat-sigiloso', 'cat-cuchilla', 'cat-forzudo', 'cat-verdoso', 'cat-deidad',
      'cat-cornamenta', 'cat-migratorio', 'cat-centinela', 'cat-anfibio', 'cat-escamado', 'cat-coloso',
    ])
    expect(unlockIds).toEqual(expected)

    for (const catId of unlockIds) {
      const cat = CATS.find((candidate) => candidate.id === catId)!
      expect(['Normal', 'Especial']).toContain(cat.rarity)
    }
  })

  it('la etapa 48 es el nivel del jefe del arco, sin firstVictoryUnlockCatId propio', () => {
    const finalStage = IMPERIO_CAP1_LEVELS.find((level) => level.id === 'imperio-cap1-etapa-48')!
    expect(finalStage.firstVictoryUnlockCatId).toBeUndefined()

    const arc = SAGA_ARCS.find((candidate) => candidate.id === 'arco-imperio-de-los-gatos-cap1')!
    expect(arc.bossLevelId).toBe('imperio-cap1-etapa-48')
    expect(CATS.some((cat) => cat.id === arc.bossCatId)).toBe(true)
    expect(finalStage.enemyWave.some((entry) => entry.catId === arc.bossCatId)).toBe(true)
  })
})

/** specs/027-capitulo-1-imperio-gatos T009. */
describe('arco-imperio-de-los-gatos-cap1 — specs/027-capitulo-1-imperio-gatos', () => {
  it('agrupa exactamente las 48 etapas del capítulo, con los multiplicadores del manual §8.3', () => {
    const arc = SAGA_ARCS.find((candidate) => candidate.id === 'arco-imperio-de-los-gatos-cap1')!
    expect(arc.levelIds).toEqual(IMPERIO_CAP1_LEVELS.map((level) => level.id))
    expect(arc.costMultiplier).toBe(0.67)
    expect(arc.enemyStrengthMultiplier).toBe(1)
    expect(arc.completionRewards.unlockCatIds).toEqual(['cat-veterano'])
  })

  it('no altera arco-1-imperio-de-los-gatos ni arco-2-imperio-de-los-gatos existentes', () => {
    const arc1 = SAGA_ARCS.find((candidate) => candidate.id === 'arco-1-imperio-de-los-gatos')!
    const arc2 = SAGA_ARCS.find((candidate) => candidate.id === 'arco-2-imperio-de-los-gatos')!
    expect(arc1.levelIds).toEqual(['level-1'])
    expect(arc2.levelIds).toEqual(['level-2'])
  })
})
