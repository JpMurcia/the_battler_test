/** specs/037-tienda (US1/FR-002). Precio fijo en `currency` por unidad — sin escalado (research.md Decisión 3). */
export const BATTLE_ITEM_PRICES: Record<string, number> = {
  'speed-boost': 150,
  'extra-energy': 100,
  'treasure-radar': 300,
}

export function getBattleItemPrice(itemId: string): number {
  return BATTLE_ITEM_PRICES[itemId] ?? 0
}

/** specs/037-tienda (US2/FR-005). Precio fijo por unidad, igual para cualquier gato. */
export const EVOLUTION_ITEM_PRICE = 250
