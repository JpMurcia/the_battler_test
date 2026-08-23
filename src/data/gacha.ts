import { CATS } from './cats'

/** specs/024-sistema-gacha (FR-003). Las 4 rarezas que participan de algún banner de gacha — Normal/Especial/Colaboración quedan fuera (spec.md § Assumptions). */
export type GachaRarity = 'Legendario' | 'Megarraro' | 'Superraro' | 'Raro'

const GACHA_RARITIES: GachaRarity[] = ['Legendario', 'Megarraro', 'Superraro', 'Raro']

export interface GachaRarityOdds {
  rarity: GachaRarity
  percent: number
}

export interface GachaBanner {
  id: string
  name: string
  tagline: string
  /** Orden Legendario → Raro; `percent` de cada banner suma 100 (research.md Decisión 6). */
  odds: GachaRarityOdds[]
}

/** research.md Decisión 6 — mismos 3 banners y tasas que el mockup base y el manual técnico § 12.3. */
export const GACHA_BANNERS: GachaBanner[] = [
  {
    id: 'uberfest',
    name: 'UBERFEST',
    tagline: 'Tasa aumentada de Uber Raros, con posibilidad de Legendarios.',
    odds: [
      { rarity: 'Legendario', percent: 0.3 },
      { rarity: 'Megarraro', percent: 9 },
      { rarity: 'Superraro', percent: 26 },
      { rarity: 'Raro', percent: 64.7 },
    ],
  },
  {
    id: 'epicfest',
    name: 'EPICFEST',
    tagline: 'Tasa aumentada de Uber Raros frente al banner estándar.',
    odds: [
      { rarity: 'Megarraro', percent: 9 },
      { rarity: 'Superraro', percent: 26 },
      { rarity: 'Raro', percent: 65 },
    ],
  },
  {
    id: 'estandar',
    name: 'Banner Estándar',
    tagline: 'Pool regular de gacha.',
    odds: [
      { rarity: 'Megarraro', percent: 5 },
      { rarity: 'Superraro', percent: 15 },
      { rarity: 'Raro', percent: 80 },
    ],
  },
]

/** Costo fijo de tirada (research.md Decisión 6 — mismos valores que mockup/manual). */
export const GACHA_SINGLE_ROLL_COST = 150
export const GACHA_MULTI_ROLL_COST = 1500
export const GACHA_MULTI_ROLL_COUNT = 11

/** specs/024-sistema-gacha (FR-008/FR-009). Monto que devuelve intercambiar una cápsula del Almacén por XP/NP
 * en vez de activarla — mismo valor que el costo de una tirada simple, punto de partida sin balancear (data-model.md). */
export const GACHA_CAPSULE_EXCHANGE_VALUE = 150

/**
 * Pool de `catId` elegibles por rareza — filtra `CATS` (ya incluye GACHA_UNITS tras cats.ts) por `cat.rarity`.
 * FR-013/SC-009: ninguna rareza ofrecida por un banner puede resolver a un array vacío.
 */
export const GACHA_POOL: Record<GachaRarity, string[]> = GACHA_RARITIES.reduce(
  (pool, rarity) => {
    pool[rarity] = CATS.filter((cat) => cat.rarity === rarity).map((cat) => cat.id)
    return pool
  },
  {} as Record<GachaRarity, string[]>,
)

export interface GachaRollResult {
  catId: string
  rarity: GachaRarity
}

/** Determina la rareza de una tirada acumulando `odds` en el orden ya declarado (Legendario → Raro). */
function rollRarity(banner: GachaBanner, random: () => number): GachaRarity {
  const roll = random() * 100
  let cumulative = 0
  for (const odds of banner.odds) {
    cumulative += odds.percent
    if (roll < cumulative) return odds.rarity
  }
  return banner.odds[banner.odds.length - 1].rarity
}

/** specs/024-sistema-gacha (FR-001). Función pura — `random` inyectable para tests deterministas (SC-003). */
export function rollOne(banner: GachaBanner, random: () => number = Math.random): GachaRollResult {
  const rarity = rollRarity(banner, random)
  const pool = GACHA_POOL[rarity]
  const catId = pool[Math.floor(random() * pool.length)]
  return { catId, rarity }
}

/** specs/024-sistema-gacha (FR-002). `count` tiradas independientes — usa el mismo `rollOne` por cada una. */
export function rollMany(banner: GachaBanner, count: number, random: () => number = Math.random): GachaRollResult[] {
  return Array.from({ length: count }, () => rollOne(banner, random))
}
