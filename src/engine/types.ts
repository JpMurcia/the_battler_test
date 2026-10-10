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
  /** specs/038-catalogo-habilidades-avanzado (FR-001). Probabilidad `chance` de multiplicar el daño de un golpe por `damageMultiplier`. */
  | { kind: 'MassiveDamage'; chance: number; damageMultiplier: number }
  /** specs/038-catalogo-habilidades-avanzado (FR-002). Probabilidad `chance` de eliminar instantáneamente (hp → 0) a un objetivo de alguno de `targetClassifications`. */
  | { kind: 'TraitKiller'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; chance: number }
  /** specs/038-catalogo-habilidades-avanzado (FR-003). Al desplegarse/generarse, inicializa `BattleUnit.shieldRemainingHp` en `shieldHp`. */
  | { kind: 'Shield'; shieldHp: number }
  /** specs/038-catalogo-habilidades-avanzado (FR-005). Al morir la unidad que lo declara, genera `count` BattleUnit de `summonCatId`. */
  | { kind: 'SummonOnDeath'; summonCatId: string; count: number }
  /** specs/039-habilidades-control-defensa (FR-001). Mientras `hp <= maxHp * hpThresholdFraction` (inclusivo), el daño base de la unidad se multiplica por `damageMultiplier`. */
  | { kind: 'Strengthen'; hpThresholdFraction: number; damageMultiplier: number }
  /** specs/039-habilidades-control-defensa (FR-002). Probabilidad `chance` (0-1) de anular por completo un golpe recibido de otra unidad. */
  | { kind: 'Dodge'; chance: number }
  /** specs/039-habilidades-control-defensa (FR-003). Probabilidad `chance` (0-1) de quedar con `hp = 1` ante un golpe que dejaría `hp <= 0`. */
  | { kind: 'Survive'; chance: number }
  /** specs/039-habilidades-control-defensa (FR-004). Probabilidad `chance` (0-1) de desplazar `distance` al objetivo golpeado hacia su propia base. */
  | { kind: 'Knockback'; chance: number; distance: number }
  /** specs/040-dinero-extra-inmunidades (FR-001). Al derrotar esta unidad del jugador a una unidad enemiga con su golpe, el jugador gana `energyBonus` de energía. */
  | { kind: 'ExtraMoney'; energyBonus: number }

/**
 * specs/040-dinero-extra-inmunidades (FR-005). Habilidades ofensivas que un defensor puede ignorar por completo vía
 * `immuneAbilities` — subconjunto de `Ability['kind']`, así que declarar una inmunidad que el motor no sabe resolver es un error de tipos.
 */
export type ImmunizableAbilityKind = 'MassiveDamage' | 'TraitKiller' | 'Knockback'

/** specs/009-clasificacion-habilidades añadió 'Curse'; specs/015-catalogo-habilidades-combate añade Debilitar/Congelar/Ralentizar (FR-001). */
export type EffectType = 'Curse' | 'Weaken' | 'Freeze' | 'Slow'

export interface AppliesEffect {
  type: EffectType
  durationSeconds: number
  /** specs/015-catalogo-habilidades-combate. Fracción de reducción (0-1) para Weaken/Slow — irrelevante para Curse/Freeze. */
  magnitude?: number
}

/**
 * specs/041-cabezas-de-canon (FR-003..FR-005). Efecto secundario del cañón especial ya traducido desde el catálogo del
 * Cuerpo Ototo — el motor no importa `src/data/`, así que el catálogo (`getCannonHeadSpec`) construye este valor.
 */
export type CannonHeadSpec = { kind: 'Knockback'; distance: number } | { kind: 'Effect'; effect: AppliesEffect }

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
  /**
   * Ausente = 0 (sin punto ciego). Distancia mínima de borde a borde requerida para alcanzar a un
   * objetivo — todo candidato más cerca que esto queda fuera de alcance sin importar `attackRange`
   * (unidad "de salto/garrocha": no puede golpear lo que tiene justo delante).
   */
  attackMinRange?: number
  /** Relevante si `attackType === 'Area'` (FR-004), o si `attackType === 'LongRange'` y se quiere daño en área alrededor del objetivo más lejano golpeado. */
  areaRadius?: number
  /** Ausente = 'Traitless' sin tipo especial (FR-011). */
  classification?: ClassificationType
  specialClassification?: SpecialClassificationType
  abilities?: Ability[]
  immuneEffects?: EffectType[]
  /** specs/040-dinero-extra-inmunidades (FR-005). Ausente = sin inmunidades. Habilidades de un atacante que esta unidad ignora por completo al ser golpeada. */
  immuneAbilities?: ImmunizableAbilityKind[]
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
  /** specs/038-catalogo-habilidades-avanzado (FR-003/FR-004). Ausente/0 = sin escudo activo. Absorbe daño entrante antes que `hp`. */
  shieldRemainingHp?: number
  /**
   * specs/040-dinero-extra-inmunidades (FR-001, research.md Decisión 3). Estado efímero de batalla — se escribe en el golpe letal
   * de una unidad del jugador con `ExtraMoney` contra esta unidad enemiga; `stepSimulation` lo suma a la energía del jugador en el
   * mismo paso y se descarta con la unidad al filtrarse las `Dead`. Nunca se persiste.
   */
  defeatBounty?: number
}
