import type { Cat, RarityType } from './cats'
import type { ClassificationType } from '../engine/types'

/** specs/022-datos-semilla-flujo-navegacion (FR-001/FR-002). Esquema pedido por el usuario — independiente del `Cat` de producción; ver seedUnitToCat() para el puente. */
export type SeedRarity = 'Normal' | 'Rare' | 'SuperRare' | 'UberRare'

export type SeedTargetType = 'Single' | 'Area'

/** Coincide 1:1 con el subconjunto "elemental" de ClassificationType (src/engine/types.ts) — ver seedUnitToCat(). */
export type SeedTrait = 'Red' | 'Floating' | 'Black' | 'Angel' | 'Alien'

export type ProceduralShape = 'circle' | 'rect' | 'poly'

/** data-model.md § SeedUnit. */
export interface SeedUnitStats {
  hp: number
  attackPower: number
  attackRange: number
  moveSpeed: number
  attackCooldown: number
  cost: number
  spawnCooldown: number
}

/** Parámetros consumidos por src/game/graphics/unitFactory.ts para generar la textura procedimental (FR-004). */
export interface ProceduralDesign {
  primaryColor: number
  baseShape: ProceduralShape
  size: number
  distinctiveFeature: 'cat-ears' | 'fangs' | 'fin' | 'crest' | 'none'
}

export interface SeedUnit {
  id: string
  name: string
  rarity: SeedRarity
  stats: SeedUnitStats
  targetType: SeedTargetType
  traits: SeedTrait[]
  proceduralDesign: ProceduralDesign
}

/** data-model.md § Catálogo semilla — 4 arquetipos, uno por rareza (FR-001). */
export const SEED_UNITS: SeedUnit[] = [
  {
    id: 'seed-cat-basic',
    name: 'Gato Básico (Semilla)',
    rarity: 'Normal',
    stats: { hp: 50, attackPower: 5, attackRange: 0, moveSpeed: 20, attackCooldown: 1.0, cost: 10, spawnCooldown: 2 },
    targetType: 'Single',
    traits: [],
    proceduralDesign: { primaryColor: 0xf5a623, baseShape: 'circle', size: 23, distinctiveFeature: 'cat-ears' },
  },
  {
    id: 'seed-cat-wall',
    name: 'Gato Muro (Semilla)',
    rarity: 'Rare',
    stats: { hp: 500, attackPower: 3, attackRange: 0, moveSpeed: 8, attackCooldown: 1.5, cost: 60, spawnCooldown: 5 },
    targetType: 'Single',
    traits: [],
    proceduralDesign: { primaryColor: 0x6b7280, baseShape: 'rect', size: 34, distinctiveFeature: 'cat-ears' },
  },
  {
    id: 'seed-cat-ranged',
    name: 'Gato a Distancia (Semilla)',
    rarity: 'SuperRare',
    stats: { hp: 35, attackPower: 12, attackRange: 250, moveSpeed: 14, attackCooldown: 1.8, cost: 200, spawnCooldown: 8 },
    targetType: 'Single',
    traits: [],
    proceduralDesign: { primaryColor: 0x22d3ee, baseShape: 'poly', size: 18, distinctiveFeature: 'cat-ears' },
  },
  {
    id: 'seed-cat-titan',
    name: 'Gato Titán (Semilla)',
    rarity: 'UberRare',
    stats: { hp: 350, attackPower: 90, attackRange: 0, moveSpeed: 10, attackCooldown: 4.0, cost: 2700, spawnCooldown: 40 },
    targetType: 'Single',
    traits: [],
    proceduralDesign: { primaryColor: 0xef4444, baseShape: 'rect', size: 44, distinctiveFeature: 'crest' },
  },
]

/** data-model.md § Catálogo semilla — Perro Básico (sin rasgo), Serpiente Roja (Red), Hipopótamo Flotante (Floating) (FR-002). */
export const SEED_ENEMIES: SeedUnit[] = [
  {
    id: 'seed-enemy-dog',
    name: 'Perro Básico (Semilla)',
    rarity: 'Normal',
    stats: { hp: 60, attackPower: 6, attackRange: 0, moveSpeed: 12, attackCooldown: 1.2, cost: 0, spawnCooldown: 3 },
    targetType: 'Single',
    traits: [],
    proceduralDesign: { primaryColor: 0x92664a, baseShape: 'circle', size: 20, distinctiveFeature: 'fangs' },
  },
  {
    id: 'seed-enemy-red-snake',
    name: 'Serpiente Roja (Semilla)',
    rarity: 'Normal',
    stats: { hp: 45, attackPower: 8, attackRange: 0, moveSpeed: 35, attackCooldown: 0.9, cost: 0, spawnCooldown: 3 },
    targetType: 'Single',
    traits: ['Red'],
    proceduralDesign: { primaryColor: 0xdc2626, baseShape: 'poly', size: 16, distinctiveFeature: 'fangs' },
  },
  {
    id: 'seed-enemy-floating-hippo',
    name: 'Hipopótamo Flotante (Semilla)',
    rarity: 'Normal',
    stats: { hp: 350, attackPower: 10, attackRange: 0, moveSpeed: 9, attackCooldown: 1.6, cost: 0, spawnCooldown: 6 },
    targetType: 'Single',
    traits: ['Floating'],
    proceduralDesign: { primaryColor: 0x60a5fa, baseShape: 'rect', size: 38, distinctiveFeature: 'fin' },
  },
]

const SEED_RARITY_TO_RARITY_TYPE: Record<SeedRarity, RarityType> = {
  Normal: 'Normal',
  Rare: 'Raro',
  SuperRare: 'Superraro',
  UberRare: 'Megarraro',
}

const BODY_WIDTH_PER_DESIGN_SIZE = 0.8

/**
 * specs/022-datos-semilla-flujo-navegacion (research.md Decisión 1). Adaptador puro hacia el `Cat`
 * ya consumido por el motor/UI — el catálogo semilla se suma a `CATS`, nunca lo reemplaza.
 * `proceduralDesign` no se copia al `Cat` resultante: `unitFactory.ts` lo consume directo desde `SeedUnit` por `id`.
 */
export function seedUnitToCat(unit: SeedUnit): Cat {
  return {
    id: unit.id,
    name: unit.name,
    cost: unit.stats.cost,
    cooldownSeconds: unit.stats.spawnCooldown,
    hp: unit.stats.hp,
    damage: unit.stats.attackPower,
    speed: unit.stats.moveSpeed,
    width: unit.proceduralDesign.size * BODY_WIDTH_PER_DESIGN_SIZE,
    attackIntervalSeconds: unit.stats.attackCooldown,
    attackType: unit.targetType === 'Area' ? 'Area' : 'Single',
    attackRange: unit.stats.attackRange,
    areaRadius: unit.targetType === 'Area' ? unit.stats.attackRange : undefined,
    classification: (unit.traits[0] as ClassificationType | undefined) ?? 'Traitless',
    rarity: SEED_RARITY_TO_RARITY_TYPE[unit.rarity],
  }
}

/** Sumado a `CATS` en src/data/cats.ts (append, nunca reemplazo — spec.md § Assumptions). */
export const SEED_CATS_AS_CATS: Cat[] = SEED_UNITS.map(seedUnitToCat)
export const SEED_ENEMIES_AS_CATS: Cat[] = SEED_ENEMIES.map(seedUnitToCat)
