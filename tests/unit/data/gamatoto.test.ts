import { describe, expect, it } from 'vitest'
import { GAMATOTO_EXPEDITION_OPTIONS, getExpeditionRemainingMs, isExpeditionReady, type GamatotoExpedition } from '../../../src/data/gamatoto'

const OPTION = GAMATOTO_EXPEDITION_OPTIONS[0]
const EXPEDITION: GamatotoExpedition = { optionId: OPTION.id, startedAtMs: 1000 }

describe('gamatoto (specs/034-gamatoto)', () => {
  it('GAMATOTO_EXPEDITION_OPTIONS tiene 3 entradas con durationMs/materialsReward positivos', () => {
    expect(GAMATOTO_EXPEDITION_OPTIONS).toHaveLength(3)
    for (const option of GAMATOTO_EXPEDITION_OPTIONS) {
      expect(option.durationMs).toBeGreaterThan(0)
      expect(option.materialsReward).toBeGreaterThan(0)
    }
  })

  it('getExpeditionRemainingMs decrece con nowMs y nunca es negativo', () => {
    const halfway = 1000 + OPTION.durationMs / 2
    expect(getExpeditionRemainingMs(EXPEDITION, OPTION, halfway)).toBeCloseTo(OPTION.durationMs / 2)

    const wayAfter = 1000 + OPTION.durationMs * 10
    expect(getExpeditionRemainingMs(EXPEDITION, OPTION, wayAfter)).toBe(0)
  })

  it('isExpeditionReady es false mientras falta tiempo, true al cumplirse la duración y después', () => {
    expect(isExpeditionReady(EXPEDITION, OPTION, 1000 + OPTION.durationMs - 1)).toBe(false)
    expect(isExpeditionReady(EXPEDITION, OPTION, 1000 + OPTION.durationMs)).toBe(true)
    expect(isExpeditionReady(EXPEDITION, OPTION, 1000 + OPTION.durationMs + 1000)).toBe(true)
  })
})
