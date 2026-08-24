import { describe, expect, it } from 'vitest'
import { CATS } from '../../../src/data/cats'
import { CAT_COMBOS, getComboMemberStatus, getCompletedCombos } from '../../../src/data/catCombos'

describe('getCompletedCombos (specs/025-cat-combos FR-002/FR-004)', () => {
  it('formación exacta de combo-nucleo-original devuelve ese combo', () => {
    const result = getCompletedCombos(['basic-cat', 'tank-cat'])
    expect(result.map((combo) => combo.id)).toContain('combo-nucleo-original')
  })

  it('falta un solo miembro: el combo no aparece, sin resultado parcial', () => {
    const result = getCompletedCombos(['basic-cat'])
    expect(result.map((combo) => combo.id)).not.toContain('combo-nucleo-original')
  })

  it('sin ningún miembro de ningún combo: devuelve un array vacío', () => {
    expect(getCompletedCombos(['speed-cat', 'heavy-cat'])).toEqual([])
  })

  it('Historia 3: con los 4 catIds de ambos combos fixture, devuelve los dos', () => {
    const result = getCompletedCombos(['basic-cat', 'tank-cat', 'weaken-cat', 'slow-cat'])
    expect(result.map((combo) => combo.id).sort()).toEqual(['combo-especialistas-control', 'combo-nucleo-original'])
  })

  it('catIds adicionales que no pertenecen a ningún combo no afectan la detección', () => {
    const result = getCompletedCombos(['basic-cat', 'tank-cat', 'speed-cat'])
    expect(result.map((combo) => combo.id)).toContain('combo-nucleo-original')
  })
})

describe('CAT_COMBOS (FR-010) — auditoría de contenido', () => {
  const knownCatIds = new Set(CATS.map((cat) => cat.id))

  it('todo memberCatId de todo combo existe como id en CATS', () => {
    for (const combo of CAT_COMBOS) {
      for (const memberId of combo.memberCatIds) {
        expect(knownCatIds.has(memberId), `${combo.id} referencia catId inexistente: ${memberId}`).toBe(true)
      }
    }
  })

  it('todo combo tiene 2 o más miembros', () => {
    for (const combo of CAT_COMBOS) {
      expect(combo.memberCatIds.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('getComboMemberStatus (FR-007)', () => {
  const combo = CAT_COMBOS.find((c) => c.id === 'combo-nucleo-original')!

  it('distingue un miembro no poseído de uno poseído pero no seleccionado', () => {
    const status = getComboMemberStatus(combo, ['basic-cat'], ['basic-cat'])
    const basic = status.find((s) => s.catId === 'basic-cat')!
    const tank = status.find((s) => s.catId === 'tank-cat')!

    expect(basic).toEqual({ catId: 'basic-cat', owned: true, selected: true })
    expect(tank).toEqual({ catId: 'tank-cat', owned: false, selected: false })
  })

  it('un miembro poseído pero no incluido en la selección actual: owned true, selected false', () => {
    const status = getComboMemberStatus(combo, ['basic-cat', 'tank-cat'], ['basic-cat'])
    const tank = status.find((s) => s.catId === 'tank-cat')!

    expect(tank).toEqual({ catId: 'tank-cat', owned: true, selected: false })
  })
})
