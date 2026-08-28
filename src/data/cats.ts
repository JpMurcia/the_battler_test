import type { Ability, AppliesEffect, AttackType, ClassificationType, EffectType, SpecialClassificationType } from '../engine/types'
import { SEED_CATS_AS_CATS, SEED_ENEMIES_AS_CATS } from './seedData'
import { GACHA_UNITS } from './gachaUnits'

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
  /**
   * Ausente = 0 (sin punto ciego). Distancia mínima de borde a borde requerida para alcanzar a un
   * objetivo — todo enemigo más cerca que esto queda fuera de alcance sin importar `attackRange`.
   */
  attackMinRange?: number
  /** Relevante si `attackType === 'Area'`, o si `attackType === 'LongRange'` y se quiere daño en área alrededor del objetivo más lejano golpeado. */
  areaRadius?: number
  /** specs/009-clasificacion-habilidades. */
  classification: ClassificationType
  specialClassification?: SpecialClassificationType
  abilities?: Ability[]
  immuneEffects?: EffectType[]
  appliesEffect?: AppliesEffect
  /** specs/010-evolucion-de-gatos. Ausente = el gato no tiene evoluciones definidas (FR-011).
   * specs/030-filtro-detalle-unidad (FR-008): `second`/`true` son independientes — un gato puede
   * tener solo `second` definido (su forma máxima es Evolucionada, sin Forma Verdadera). */
  evolutions?: { second?: EvolutionFormData; true?: EvolutionFormData }
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
  /** specs/024-sistema-gacha (FR-013). Append — puebla Legendario/Colaboración, antes sin ninguna unidad. */
  ...GACHA_UNITS,
  /**
   * specs/027-capitulo-1-imperio-gatos (FR-005/FR-006). 16 enemigos del Capítulo 1 — stats de
   * data-model.md § enemigos (manual §6.6 a magnificación 100%, nombres originales). `cost`/`cooldownSeconds`
   * son placeholders sin efecto (nunca desplegados por el jugador), mismo patrón que SEED_ENEMIES_AS_CATS.
   */
  { id: 'enemy-merodeador', name: 'Merodeador', cost: 0, cooldownSeconds: 3, hp: 90, damage: 8, speed: 14, width: 16, attackIntervalSeconds: 1.6, attackType: 'Single', attackRange: 0, classification: 'Traitless' },
  { id: 'enemy-escudero', name: 'Escudero', cost: 0, cooldownSeconds: 3, hp: 80, damage: 30, speed: 12, width: 18, attackIntervalSeconds: 1.4, attackType: 'Single', attackRange: 0, classification: 'Traitless' },
  { id: 'enemy-triturador', name: 'Triturador', cost: 0, cooldownSeconds: 3, hp: 70, damage: 30, speed: 26, width: 14, attackIntervalSeconds: 1.1, attackType: 'Single', attackRange: 0, classification: 'Traitless' },
  { id: 'enemy-rondador', name: 'Rondador', cost: 0, cooldownSeconds: 3, hp: 100, damage: 15, speed: 22, width: 16, attackIntervalSeconds: 1.3, attackType: 'Single', attackRange: 0, classification: 'Traitless' },
  { id: 'enemy-turba', name: 'Turba', cost: 0, cooldownSeconds: 3, hp: 200, damage: 20, speed: 24, width: 18, attackIntervalSeconds: 1.2, attackType: 'Single', attackRange: 0, classification: 'Traitless' },
  { id: 'enemy-planeador', name: 'Planeador', cost: 0, cooldownSeconds: 3, hp: 500, damage: 50, speed: 16, width: 22, attackIntervalSeconds: 1.7, attackType: 'Single', attackRange: 0, classification: 'Floating' },
  { id: 'enemy-saltarin-alado', name: 'Saltarín Alado', cost: 0, cooldownSeconds: 3, hp: 500, damage: 50, speed: 18, width: 20, attackIntervalSeconds: 1.6, attackType: 'Single', attackRange: 0, classification: 'Floating' },
  { id: 'enemy-behemot-gris', name: 'Behemot Gris', cost: 0, cooldownSeconds: 3, hp: 1000, damage: 100, speed: 6, width: 30, attackIntervalSeconds: 2.2, attackType: 'Single', attackRange: 0, classification: 'Traitless' },
  { id: 'enemy-carmesi', name: 'Carmesí', cost: 0, cooldownSeconds: 3, hp: 1000, damage: 80, speed: 10, width: 26, attackIntervalSeconds: 1.8, attackType: 'Single', attackRange: 0, classification: 'Red' },
  { id: 'enemy-emperador-volador', name: 'Emperador Volador', cost: 0, cooldownSeconds: 3, hp: 1300, damage: 80, speed: 14, width: 26, attackIntervalSeconds: 1.9, attackType: 'Single', attackRange: 0, classification: 'Floating' },
  { id: 'enemy-foca-blindada', name: 'Foca Blindada', cost: 0, cooldownSeconds: 3, hp: 2500, damage: 150, speed: 9, width: 30, attackIntervalSeconds: 2.0, attackType: 'Single', attackRange: 0, classification: 'Traitless' },
  { id: 'enemy-boxeador', name: 'Boxeador', cost: 0, cooldownSeconds: 3, hp: 4000, damage: 250, speed: 8, width: 32, attackIntervalSeconds: 2.3, attackType: 'Single', attackRange: 0, classification: 'Traitless' },
  { id: 'enemy-embestida', name: 'Embestida', cost: 0, cooldownSeconds: 3, hp: 4000, damage: 654, speed: 10, width: 32, attackIntervalSeconds: 2.6, attackType: 'Single', attackRange: 0, classification: 'Traitless' },
  { id: 'enemy-instructor-feroz', name: 'Instructor Feroz', cost: 0, cooldownSeconds: 3, hp: 3000, damage: 1000, speed: 4, width: 34, attackIntervalSeconds: 3.5, attackType: 'Area', attackRange: 140, areaRadius: 45, classification: 'Traitless' },
  { id: 'enemy-unicornio-guerra', name: 'Unicornio de Guerra', cost: 0, cooldownSeconds: 3, hp: 15000, damage: 500, speed: 5, width: 36, attackIntervalSeconds: 2.4, attackType: 'Single', attackRange: 0, classification: 'Traitless' },
  { id: 'enemy-la-mascara', name: 'La Máscara', cost: 0, cooldownSeconds: 3, hp: 99999, damage: 2000, speed: 4, width: 44, attackIntervalSeconds: 2.8, attackType: 'LongRange', attackRange: 160, classification: 'Traitless' },
  /**
   * specs/027-capitulo-1-imperio-gatos (FR-001/FR-002/FR-004). 14 gatos jugables del Capítulo 1 — stats de
   * data-model.md § gatos jugables. Ninguno declara spriteKey (research.md Decisión 4: fallback procedural
   * ya satisface Constitución § III). evolutions sin requiredItemCount (sin vía de obtención de ítems, specs/010).
   */
  {
    // specs/027 FR-003/Edge Cases: el gato inicial permanece en Forma Base indefinidamente, sin evolutions.
    id: 'cat-recluta', name: 'Gato Recluta', cost: 10, cooldownSeconds: 1.5, hp: 55, damage: 6, speed: 20, width: 16,
    attackIntervalSeconds: 1.0, attackType: 'Single', attackRange: 0, classification: 'Traitless', rarity: 'Normal',
  },
  {
    id: 'cat-yunque', name: 'Gato Yunque', cost: 25, cooldownSeconds: 4, hp: 260, damage: 4, speed: 8, width: 26,
    attackIntervalSeconds: 1.6, attackType: 'Single', attackRange: 0, classification: 'Traitless', rarity: 'Normal',
    evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.3, damageMultiplier: 1.2 }, true: { requiredLevel: 30, hpMultiplier: 1.7, damageMultiplier: 1.5 } },
  },
  {
    id: 'cat-sigiloso', name: 'Gato Sigiloso', cost: 35, cooldownSeconds: 5, hp: 60, damage: 22, speed: 30, width: 14,
    attackIntervalSeconds: 1.1, attackType: 'Single', attackRange: 0, classification: 'Traitless', rarity: 'Especial',
    evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.25, damageMultiplier: 1.3 }, true: { requiredLevel: 30, hpMultiplier: 1.6, damageMultiplier: 1.7 } },
  },
  {
    id: 'cat-cuchilla', name: 'Gato Cuchilla', cost: 45, cooldownSeconds: 6, hp: 140, damage: 14, speed: 14, width: 20,
    attackIntervalSeconds: 1.7, attackType: 'Area', attackRange: 0, areaRadius: 30, classification: 'Traitless', rarity: 'Normal',
    evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.3, damageMultiplier: 1.3 }, true: { requiredLevel: 30, hpMultiplier: 1.7, damageMultiplier: 1.7 } },
  },
  {
    id: 'cat-forzudo', name: 'Gato Forzudo', cost: 70, cooldownSeconds: 9, hp: 420, damage: 60, speed: 6, width: 32,
    attackIntervalSeconds: 3.0, attackType: 'Single', attackRange: 0, classification: 'Traitless', rarity: 'Especial',
    evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.25, damageMultiplier: 1.25 }, true: { requiredLevel: 30, hpMultiplier: 1.6, damageMultiplier: 1.6 } },
  },
  {
    id: 'cat-verdoso', name: 'Gato Verdoso', cost: 55, cooldownSeconds: 7, hp: 90, damage: 20, speed: 16, width: 16,
    attackIntervalSeconds: 1.6, attackType: 'LongRange', attackRange: 130, classification: 'Traitless', rarity: 'Normal',
    evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.3, damageMultiplier: 1.3 }, true: { requiredLevel: 30, hpMultiplier: 1.7, damageMultiplier: 1.7 } },
  },
  {
    id: 'cat-deidad', name: 'Gato Deidad', cost: 90, cooldownSeconds: 10, hp: 150, damage: 35, speed: 12, width: 20,
    attackIntervalSeconds: 1.8, attackType: 'Single', attackRange: 0, classification: 'Traitless', rarity: 'Especial',
    resistantTo: [{ effect: 'Curse', durationMultiplier: 0.3 }],
  },
  {
    id: 'cat-cornamenta', name: 'Gato Cornamenta', cost: 40, cooldownSeconds: 3, hp: 75, damage: 16, speed: 34, width: 15,
    attackIntervalSeconds: 0.9, attackType: 'Single', attackRange: 0, classification: 'Traitless', rarity: 'Normal',
    evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.3, damageMultiplier: 1.3 }, true: { requiredLevel: 30, hpMultiplier: 1.7, damageMultiplier: 1.7 } },
  },
  {
    id: 'cat-migratorio', name: 'Gato Migratorio', cost: 60, cooldownSeconds: 7, hp: 110, damage: 18, speed: 18, width: 18,
    attackIntervalSeconds: 1.5, attackType: 'Single', attackRange: 0, classification: 'Traitless', rarity: 'Normal',
    abilities: [{ kind: 'TraitTargeting', targetClassifications: ['Floating'], damageMultiplier: 2.5 }],
    evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.3, damageMultiplier: 1.3 }, true: { requiredLevel: 30, hpMultiplier: 1.7, damageMultiplier: 1.8 } },
  },
  {
    id: 'cat-centinela', name: 'Gato Centinela', cost: 70, cooldownSeconds: 8, hp: 150, damage: 20, speed: 10, width: 20,
    attackIntervalSeconds: 2.0, attackType: 'LongRange', attackRange: 160, classification: 'Traitless', rarity: 'Normal',
    evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.3, damageMultiplier: 1.3 }, true: { requiredLevel: 30, hpMultiplier: 1.7, damageMultiplier: 1.7 } },
  },
  {
    id: 'cat-anfibio', name: 'Gato Anfibio', cost: 65, cooldownSeconds: 7, hp: 130, damage: 24, speed: 16, width: 18,
    attackIntervalSeconds: 1.7, attackType: 'LongRange', attackRange: 110, classification: 'Traitless', rarity: 'Normal',
    evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.3, damageMultiplier: 1.3 }, true: { requiredLevel: 30, hpMultiplier: 1.7, damageMultiplier: 1.7 } },
  },
  {
    id: 'cat-escamado', name: 'Gato Escamado', cost: 85, cooldownSeconds: 8, hp: 260, damage: 22, speed: 12, width: 24,
    attackIntervalSeconds: 1.9, attackType: 'Area', attackRange: 0, areaRadius: 35, classification: 'Traitless', rarity: 'Normal',
    evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.3, damageMultiplier: 1.3 }, true: { requiredLevel: 30, hpMultiplier: 1.7, damageMultiplier: 1.7 } },
  },
  {
    id: 'cat-coloso', name: 'Gato Coloso', cost: 130, cooldownSeconds: 14, hp: 380, damage: 140, speed: 6, width: 34,
    attackIntervalSeconds: 3.2, attackType: 'Single', attackRange: 0, classification: 'Traitless', rarity: 'Normal',
    evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.25, damageMultiplier: 1.25 }, true: { requiredLevel: 30, hpMultiplier: 1.6, damageMultiplier: 1.6 } },
  },
  {
    id: 'cat-veterano', name: 'Gato Veterano', cost: 10, cooldownSeconds: 1.2, hp: 90, damage: 10, speed: 22, width: 16,
    attackIntervalSeconds: 0.9, attackType: 'Single', attackRange: 0, classification: 'Traitless', rarity: 'Normal',
  },
  /**
   * Unidad de diseño de usuario: cavernícola sin armadura que clava su lanza en el suelo estilo garrocha
   * olímpica, salta y cae aplastando en área a distancia. `attackType: 'LongRange'` golpea al enemigo más
   * lejano dentro de `attackRange` (motor extendido para sumar salpicadura de `areaRadius` alrededor de ese
   * objetivo — antes solo 'Area' tenía splash); `attackMinRange` es el "punto ciego" del salto: nada más cerca
   * de esa distancia puede ser alcanzado, sin importar `attackRange` (motor extendido, antes no existía este campo).
   */
  {
    id: 'cat-garrochista', name: 'Cavernícola Garrochista', cost: 20, cooldownSeconds: 6, hp: 500, damage: 55, speed: 48, width: 18,
    attackIntervalSeconds: 4.5, attackType: 'LongRange', attackRange: 220, attackMinRange: 50, areaRadius: 40,
    classification: 'Traitless', rarity: 'Normal',
    evolutions: { second: { requiredLevel: 10, hpMultiplier: 1.3, damageMultiplier: 1.3 }, true: { requiredLevel: 30, hpMultiplier: 1.7, damageMultiplier: 1.7 } },
  },
]
