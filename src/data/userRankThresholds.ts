/** specs/019-rango-de-usuario (FR-003). Recompensa siempre de `specs/017-objetos-de-batalla` — nunca moneda premium/gacha. */
export interface UserRankThreshold {
  rank: number
  reward: { itemId: string; count: number }
}

/** Fixture de bootstrap — valores de diseño provisionales, no balanceados (tasks.md Fase 1). */
export const USER_RANK_THRESHOLDS: UserRankThreshold[] = [
  { rank: 3, reward: { itemId: 'extra-energy', count: 1 } },
  { rank: 5, reward: { itemId: 'speed-boost', count: 1 } },
  { rank: 10, reward: { itemId: 'treasure-radar', count: 1 } },
]
