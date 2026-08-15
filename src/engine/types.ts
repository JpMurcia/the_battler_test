/** specs/008-tipos-de-ataque. Sin declarar explícitamente, una unidad se trata como 'Single' (FR-002). */
export type AttackType = 'Single' | 'Area' | 'LongRange'

/** specs/009-clasificacion-habilidades. Sin declarar explícitamente, una unidad se trata como 'Traitless' (FR-011). */
export type ClassificationType = 'Red' | 'Floating' | 'Black' | 'Angel' | 'Alien' | 'Zombie' | 'Relic' | 'Traitless'

/** Excluye a la unidad de habilidades "contra todos los tipos estándar" salvo inclusión explícita (FR-004). */
export type SpecialClassificationType = 'Typeless' | 'Colossus' | 'Behemoth' | 'Sage' | 'Metal' | 'Witch' | 'EvaAngel'

export type Ability =
  | { kind: 'TraitTargeting'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; damageMultiplier: number }
  | { kind: 'Neutral'; damageMultiplier: number }

/** Único efecto de esta spec — unión abierta a extender por specs futuras. */
export type EffectType = 'Curse'

export interface AppliesEffect {
  type: 'Curse'
  durationSeconds: number
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
}
