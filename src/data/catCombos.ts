/** specs/025-cat-combos (FR-001). Mismo shape que TreasureSetPassiveBonus (src/data/treasureSets.ts) —
 * se reutiliza el esquema ya existente en vez de introducir un segundo sistema de bonificaciones. */
export interface CatComboBonus {
  type: 'EnergyRegenMultiplier' | 'CurrencyRewardMultiplier'
  value: number
}

/** specs/025-cat-combos (FR-001/FR-010). Contenido estático — vive en src/data/, nunca como progreso de jugador. */
export interface CatCombo {
  id: string
  name: string
  memberCatIds: string[]
  bonus: CatComboBonus
}

/** Fixtures de bootstrap — valores de diseño provisionales, no balanceados (research.md Decisión 3). */
export const CAT_COMBOS: CatCombo[] = [
  {
    id: 'combo-nucleo-original',
    name: 'Núcleo Original',
    memberCatIds: ['basic-cat', 'tank-cat'],
    bonus: { type: 'EnergyRegenMultiplier', value: 1.05 },
  },
  {
    id: 'combo-especialistas-control',
    name: 'Especialistas de Control',
    memberCatIds: ['weaken-cat', 'slow-cat'],
    bonus: { type: 'CurrencyRewardMultiplier', value: 1.1 },
  },
]

/**
 * specs/025-cat-combos (FR-002/FR-004). Función pura: recibe cualquier lista de catIds (formación activa
 * persistida, o una selección local aún sin guardar) y devuelve los combos cuyos miembros están TODOS
 * presentes — sin resultado parcial. Reutilizada tanto por useMetaStore.getActiveComboBonusMultiplier
 * (contra activeTeamCatIds) como por TeamScreen (contra la selección local, research.md Decisión 5).
 */
export function getCompletedCombos(catIds: string[]): CatCombo[] {
  const catIdSet = new Set(catIds)
  return CAT_COMBOS.filter((combo) => combo.memberCatIds.every((memberId) => catIdSet.has(memberId)))
}

/** specs/025-cat-combos (FR-007). Estado por miembro de un combo, para distinguir en la UI un miembro no
 * poseído de uno poseído pero no incluido en la formación consultada. */
export interface ComboMemberStatus {
  catId: string
  owned: boolean
  selected: boolean
}

export function getComboMemberStatus(combo: CatCombo, ownedCatIds: string[], selectedCatIds: string[]): ComboMemberStatus[] {
  const ownedSet = new Set(ownedCatIds)
  const selectedSet = new Set(selectedCatIds)
  return combo.memberCatIds.map((catId) => ({
    catId,
    owned: ownedSet.has(catId),
    selected: selectedSet.has(catId),
  }))
}
