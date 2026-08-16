/**
 * specs/008-tipos-de-ataque. Sin declarar explícitamente, una unidad se trata como 'Single' (FR-002).
 * specs/016-multigolpe-critico añade 'MultiHit'/'Critical' — mutuamente excluyentes con el resto (mismo campo).
 */
export type AttackType = 'Single' | 'Area' | 'LongRange' | 'MultiHit' | 'Critical'

/** specs/009-clasificacion-habilidades. Sin declarar explícitamente, una unidad se trata como 'Traitless' (FR-011). */
export type ClassificationType = 'Red' | 'Floating' | 'Black' | 'Angel' | 'Alien' | 'Zombie' | 'Relic' | 'Traitless'

/** Excluye a la unidad de habilidades "contra todos los tipos estándar" salvo inclusión explícita (FR-004). */
export type SpecialClassificationType = 'Typeless' | 'Colossus' | 'Behemoth' | 'Sage' | 'Metal' | 'Witch' | 'EvaAngel'

export type Ability =
  | { kind: 'TraitTargeting'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; damageMultiplier: number }
  | { kind: 'Neutral'; damageMultiplier: number }
  /** specs/015-catalogo-habilidades-combate (FR-007). Daño *recibido* de los rasgos listados — complementa a TraitTargeting (daño *infligido*). */
  | { kind: 'TraitResistance'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; damageTakenMultiplier: number }

/** specs/009-clasificacion-habilidades añadió 'Curse'; specs/015-catalogo-habilidades-combate añade Debilitar/Congelar/Ralentizar (FR-001). */
export type EffectType = 'Curse' | 'Weaken' | 'Freeze' | 'Slow'

export interface AppliesEffect {
  type: EffectType
  durationSeconds: number
  /** specs/015-catalogo-habilidades-combate. Fracción de reducción (0-1) para Weaken/Slow — irrelevante para Curse/Freeze. */
  magnitude?: number
}

export interface BattleUnit {
  instanceId: string
  catId: string
  team: 'Player' | 'Enemy'
  x: number
  width: number
  hp: number
  maxHp: number
  damage: number
  attackIntervalSeconds: number
  attackCooldownRemaining: number
  speed: number
  state: 'Moving' | 'Engaged' | 'Dead'
  /** Ausente = 'Single' (FR-002) — mantiene compatibilidad con unidades/tests que no lo declaran. */
  attackType?: AttackType
  /** Ausente = 0 (solo superposición directa, comportamiento previo a specs/008). */
  attackRange?: number
  /** Solo relevante si `attackType === 'Area'` (FR-004). */
  areaRadius?: number
  /** Ausente = 'Traitless' sin tipo especial (FR-011). */
  classification?: ClassificationType
  specialClassification?: SpecialClassificationType
  abilities?: Ability[]
  immuneEffects?: EffectType[]
  appliesEffect?: AppliesEffect
  /** Estado de batalla efímero — ausente/0 equivale a "sin Curse activo" (specs/009 FR-009). */
  curseRemainingSeconds?: number
  /** specs/015-catalogo-habilidades-combate (US1/FR-002). Estado de batalla efímero — ausente/0 = sin Debilitar activo. */
  weakenRemainingSeconds?: number
  /** Fracción de reducción de daño mientras `weakenRemainingSeconds > 0` — copiada de `AppliesEffect.magnitude` al aplicarse, porque el origen del efecto ya no está disponible en ticks posteriores. */
  weakenMagnitude?: number
  /** specs/015-catalogo-habilidades-combate (US2/FR-002). Ausente/0 = sin Congelar activo. */
  freezeRemainingSeconds?: number
  /** specs/015-catalogo-habilidades-combate (US3/FR-002). Ausente/0 = sin Ralentizar activo. */
  slowRemainingSeconds?: number
  /** Fracción de reducción de velocidad mientras `slowRemainingSeconds > 0` — mismo motivo que `weakenMagnitude`. */
  slowMagnitude?: number
  /** specs/015-catalogo-habilidades-combate (US5/FR-009). Reduce la duración efectiva de un efecto al aplicarse — ≤0 resultante ⇒ no se aplica. Distinta de `immuneEffects` (bloqueo total). */
  resistantTo?: { effect: EffectType; durationMultiplier: number }[]
  /** specs/016-multigolpe-critico (FR-002). Solo relevante si `attackType === 'MultiHit'` — entero ≥1, golpes independientes por secuencia. */
  hitsPerSequence?: number
  /** specs/016-multigolpe-critico (FR-006). Solo relevante si `attackType === 'Critical'` — probabilidad 0-1 de doblar el daño por ataque. */
  criticalChance?: number
  /**
   * specs/016-multigolpe-critico. Reservado para observabilidad/specs futuras — la resolución atómica de N golpes
   * dentro de un mismo tick (plan.md Key Design Decision 3) no requiere leer ni persistir este campo entre ticks
   * para cumplir FR-004/FR-005 (una secuencia interrumpida nunca deja golpes pendientes que reanudar).
   */
  multiHitProgress?: number
}
