import type { Ability, AppliesEffect, AttackType, ClassificationType, EffectType, SpecialClassificationType } from '../engine/types'
import { SEED_CATS_AS_CATS, SEED_ENEMIES_AS_CATS } from './seedData'

/** specs/010-evolucion-de-gatos. `requiredItemCount` solo es relevante en la forma `true` (FR-001). */
export interface EvolutionFormData {
  requiredLevel: number
  hpMultiplier: number
  damageMultiplier: number
  requiredItemCount?: number
}

/** specs/012-saga-imperio-de-los-gatos (FR-016). Metadata de presentación — sin mecanismo de obtención aleatoria asociado. */
export type RarityType = 'Normal' | 'Especial' | 'Raro' | 'Superraro' | 'Megarraro' | 'Legendario' | 'Colaboración'

/** specs/021-reskin-cyber-modern (FR-007, data-model.md § RarityColorMap). Clase `.tag--<rareza>` de src/theme.css por cada RarityType. */
export const RARITY_TAG_CLASS: Record<RarityType, string> = {
  Normal: 'tag--normal',
  Especial: 'tag--especial',
  Raro: 'tag--raro',
  Superraro: 'tag--superraro',
  Megarraro: 'tag--megarraro',
  Legendario: 'tag--legendario',
  Colaboración: 'tag--colaboracion',
}

/** specs/010-evolucion-de-gatos. */
export type EvolutionStage = 'Base' | 'Second' | 'True'

export interface Cat {
  id: string
  name: string
  cost: number
  cooldownSeconds: number
  hp: number
  damage: number
  speed: number
  width: number
  attackIntervalSeconds: number
  /** specs/008-tipos-de-ataque. */
  attackType: AttackType
  /** Distancia máxima de detección de objetivo más allá de la superposición directa. */
  attackRange: number
  /** Solo relevante si `attackType === 'Area'`. */
  areaRadius?: number
  /** specs/009-clasificacion-habilidades. */
  classification: ClassificationType
  specialClassification?: SpecialClassificationType
  abilities?: Ability[]
  immuneEffects?: EffectType[]
  appliesEffect?: AppliesEffect
  /** specs/010-evolucion-de-gatos. Ausente = el gato no tiene evoluciones definidas (FR-011). */
  evolutions?: { second: EvolutionFormData; true: EvolutionFormData }
  /** specs/012-saga-imperio-de-los-gatos. Ausente = sin rareza asignada todavía (FR-016). */
  rarity?: RarityType
  /** specs/015-catalogo-habilidades-combate (US5/FR-009). Capacidad pasiva permanente — copiada al `BattleUnit` en deployUnit/spawnEnemyUnit. */
  resistantTo?: { effect: EffectType; durationMultiplier: number }[]
  /** specs/016-multigolpe-critico (FR-002). Solo relevante si `attackType === 'MultiHit'`. */
  hitsPerSequence?: number
  /** specs/016-multigolpe-critico (FR-006). Solo relevante si `attackType === 'Critical'`. */
  criticalChance?: number
  /** specs/021-reskin-cyber-modern (FR-009, data-model.md § Cat). Clave hacia SPRITE_MANIFEST (src/game/spriteAssets.ts) — ausente = fallback Graphics (FR-011). */
  spriteKey?: string
}

export interface EffectiveCatStats {
  hp: number
  damage: number
}

/**
 * specs/010-evolucion-de-gatos: stats efectivos según la forma de evolución vigente — única fuente de esta
 * fórmula, reutilizada por `useGameStore.deployUnit` y `CatGuideScreen` (specs/018-bibliotecas-consulta US1).
 */
export function getEffectiveCatStats(cat: Cat, evolutionStage: EvolutionStage): EffectiveCatStats {
  const evolutionForm = evolutionStage === 'Second' ? cat.evolutions?.second : evolutionStage === 'True' ? cat.evolutions?.true : undefined
  return {
    hp: cat.hp * (evolutionForm?.hpMultiplier ?? 1),
    damage: cat.damage * (evolutionForm?.damageMultiplier ?? 1),
  }
}

/** Fixtures de bootstrap — valores de diseño provisionales, no balanceados (tasks.md Fase 1). */
export const CATS: Cat[] = [
  {
    id: 'basic-cat',
    name: 'Gato Básico',
    cost: 10,
    cooldownSeconds: 2,
    hp: 50,
    damage: 5,
    speed: 20,
    width: 16,
    attackIntervalSeconds: 1,
    attackType: 'Single',
    attackRange: 0,
    classification: 'Traitless',
    rarity: 'Normal',
    spriteKey: 'hero_1',
  },
  {
    id: 'tank-cat',
    name: 'Gato Tanque',
    cost: 30,
    cooldownSeconds: 5,
    hp: 200,
    damage: 3,
    speed: 10,
    width: 24,
    attackIntervalSeconds: 1.5,
    attackType: 'Single',
    attackRange: 0,
    classification: 'Traitless',
    rarity: 'Normal',
    spriteKey: 'hero_2',
  },
  {
    id: 'speed-cat',
    name: 'Gato Veloz',
    cost: 15,
    cooldownSeconds: 3,
    hp: 30,
    damage: 4,
    speed: 40,
    width: 12,
    attackIntervalSeconds: 0.8,
    attackType: 'Single',
    attackRange: 0,
    classification: 'Traitless',
    rarity: 'Especial',
    spriteKey: 'hero_3',
  },
  {
    id: 'heavy-cat',
    name: 'Gato Pesado',
    cost: 50,
    cooldownSeconds: 8,
    hp: 150,
    damage: 20,
    speed: 8,
    width: 28,
    attackIntervalSeconds: 2,
    attackType: 'Single',
    attackRange: 0,
    classification: 'Traitless',
    rarity: 'Raro',
    spriteKey: 'hero_4',
  },
  // specs/011-nivel-2-hacia-el-futuro (FR-002): gatos nuevos del Nivel 2, stats propios sin reutilizar los 4 anteriores.
  {
    id: 'solar-cat',
    name: 'Gato Solar',
    cost: 25,
    cooldownSeconds: 4,
    hp: 40,
    damage: 12,
    speed: 18,
    width: 14,
    attackIntervalSeconds: 1.2,
    attackType: 'LongRange',
    attackRange: 60,
    classification: 'Traitless',
    rarity: 'Superraro',
    spriteKey: 'hero_5',
  },
  {
    id: 'armored-cat',
    name: 'Gato Blindado',
    cost: 60,
    cooldownSeconds: 9,
    hp: 250,
    damage: 8,
    speed: 6,
    width: 30,
    attackIntervalSeconds: 1.8,
    attackType: 'Area',
    attackRange: 0,
    areaRadius: 25,
    classification: 'Traitless',
    rarity: 'Raro',
    spriteKey: 'hero_6',
  },
  // specs/015-catalogo-habilidades-combate: un gato de ejemplo por capacidad nueva — sin tocar los 6 anteriores.
  {
    id: 'frost-cat',
    name: 'Gato Escarcha',
    cost: 40,
    cooldownSeconds: 6,
    hp: 90,
    damage: 6,
    speed: 14,
    width: 18,
    attackIntervalSeconds: 1.4,
    attackType: 'Single',
    attackRange: 0,
    classification: 'Traitless',
    rarity: 'Raro',
    spriteKey: 'hero_7',
    appliesEffect: { type: 'Freeze', durationSeconds: 3 },
  },
  {
    id: 'weaken-cat',
    name: 'Gato Debilitador',
    cost: 35,
    cooldownSeconds: 6,
    hp: 80,
    damage: 5,
    speed: 16,
    width: 16,
    attackIntervalSeconds: 1.3,
    attackType: 'Single',
    attackRange: 0,
    classification: 'Traitless',
    rarity: 'Raro',
    spriteKey: 'hero_8',
    appliesEffect: { type: 'Weaken', durationSeconds: 4, magnitude: 0.5 },
  },
  {
    id: 'slow-cat',
    name: 'Gato Grillete',
    cost: 35,
    cooldownSeconds: 6,
    hp: 85,
    damage: 5,
    speed: 16,
    width: 16,
    attackIntervalSeconds: 1.3,
    attackType: 'Single',
    attackRange: 0,
    classification: 'Traitless',
    rarity: 'Especial',
    spriteKey: 'hero_9',
    appliesEffect: { type: 'Slow', durationSeconds: 5, magnitude: 0.6 },
  },
  {
    id: 'zombie-ward-cat',
    name: 'Gato Guardián Antizombi',
    cost: 55,
    cooldownSeconds: 8,
    hp: 220,
    damage: 10,
    speed: 9,
    width: 26,
    attackIntervalSeconds: 1.6,
    attackType: 'Single',
    attackRange: 0,
    classification: 'Traitless',
    rarity: 'Superraro',
    spriteKey: 'hero_10',
    // specs/015 US4: recibe la mitad de daño de enemigos Zombie (Fuerte Contra, lado del daño recibido).
    abilities: [{ kind: 'TraitResistance', targetClassifications: ['Zombie'], damageTakenMultiplier: 0.5 }],
    // specs/015 US5: sufre la mitad de duración de Congelar — Resistencia, no Inmunidad.
    resistantTo: [{ effect: 'Freeze', durationMultiplier: 0.5 }],
  },
  // specs/016-multigolpe-critico: un gato de ejemplo por tipo de ataque nuevo.
  {
    id: 'triple-strike-cat',
    name: 'Gato Triple Golpe',
    cost: 45,
    cooldownSeconds: 7,
    hp: 100,
    damage: 6,
    speed: 15,
    width: 18,
    attackIntervalSeconds: 1.5,
    attackType: 'MultiHit',
    attackRange: 0,
    classification: 'Traitless',
    rarity: 'Raro',
    spriteKey: 'hero_11',
    hitsPerSequence: 3,
  },
  {
    id: 'lucky-cat',
    name: 'Gato Afortunado',
    cost: 40,
    cooldownSeconds: 6,
    hp: 90,
    damage: 12,
    speed: 17,
    width: 16,
    attackIntervalSeconds: 1.2,
    attackType: 'Critical',
    attackRange: 0,
    classification: 'Traitless',
    rarity: 'Superraro',
    spriteKey: 'hero_12',
    criticalChance: 0.3,
  },
  /** specs/022-datos-semilla-flujo-navegacion (FR-001/FR-002). Append — nunca reemplaza el catálogo de producción de arriba. */
  ...SEED_CATS_AS_CATS,
  ...SEED_ENEMIES_AS_CATS,
]
