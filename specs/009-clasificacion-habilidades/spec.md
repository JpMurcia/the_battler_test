# Feature Specification: Clasificación de Gatos/Enemigos y Habilidades Avanzadas

**Feature Branch**: `009-clasificacion-habilidades`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/008-classification-trait-abilities` (fusión de las Fases 8/9 del roadmap origen, proyecto Unity): cada gato/enemigo declara un tipo estándar de clasificación (Rojo, Flotante, Oscuro, Ángel, Alien, Zombie, Relic, Sin rasgo) y opcionalmente un tipo especial (Typeless, Colossus, Behemoth, Sage, Metal, Witch, EVA Angel) que lo excluye de habilidades "contra todos" salvo inclusión explícita; se añaden habilidades de trait-targeting, neutral abilities e inmunidades, incluyendo un efecto Curse que deshabilita las habilidades especiales de quien lo sufre.

**Nota de adaptación**: battle-cats-web no tiene ningún sistema de habilidades/efectos hoy — esta spec lo introduce desde cero, deliberadamente mínimo (Constitución § VII): una habilidad es un multiplicador de daño condicional (por clasificación o neutral); un efecto es solo `Curse`, aplicado on-hit por gatos/enemigos que lo declaren. Depende de `specs/008-tipos-de-ataque` (mismo punto de extensión de `src/engine/`, misma unidad de daño base).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clasificar gatos y enemigos con un tipo (Priority: P1)

Cada gato/enemigo declara un tipo estándar y, opcionalmente, un tipo especial.

**Why this priority**: Prerrequisito de todo lo demás — sin tipos no hay contra qué apuntar (Historia 2) ni qué excluir (Historia 4).

**Independent Test**: Revisar `src/data/cats.ts` y confirmar que cada gato tiene un `classification` estándar y, si aplica, `specialClassification`, sin romper el combate existente.

**Acceptance Scenarios**:

1. **Given** un gato nuevo se define en `src/data/cats.ts`, **When** se le asigna clasificación, **Then** el sistema acepta exactamente un tipo estándar y, opcionalmente, un tipo especial adicional.
2. **Given** un gato ya existente no declara clasificación, **When** el motor lo evalúa, **Then** se le trata como `'Traitless'` (Sin rasgo) sin tipo especial, sin romper su comportamiento actual.

---

### User Story 2 - Una habilidad de trait-targeting solo afecta a los tipos que declara (Priority: P1)

Una unidad con una habilidad dirigida a un tipo específico (p. ej. "fuerte contra Flotante") solo aplica su bonificación de daño contra enemigos de ese tipo.

**Why this priority**: Valor central de la feature.

**Independent Test**: Enfrentar una unidad con habilidad `TraitTargeting` contra un enemigo del tipo objetivo y otro de tipo distinto; solo el primero recibe el multiplicador.

**Acceptance Scenarios**:

1. **Given** una unidad tiene una habilidad `TraitTargeting` contra un tipo, **When** ataca a un enemigo de ese tipo, **Then** el daño aplicado usa `damageMultiplier` de la habilidad.
2. **Given** la misma unidad ataca a un enemigo de tipo distinto, **When** ocurre el ataque, **Then** el daño es el base (`damage`), sin el multiplicador.

---

### User Story 3 - Una neutral ability afecta a cualquier enemigo (Priority: P2)

Una habilidad `Neutral` aplica su bonificación contra cualquier enemigo, incluidos los de tipo especial.

**Why this priority**: Contrasta con la Historia 2; depende de que el sistema ya distinga tipos (Historia 1).

**Independent Test**: Una unidad con habilidad `Neutral` contra enemigos de tipos distintos (estándar y especial) — el multiplicador se aplica en todos los casos.

**Acceptance Scenarios**:

1. **Given** una unidad tiene una habilidad `Neutral`, **When** ataca a cualquier enemigo, **Then** el multiplicador se aplica sin importar su clasificación.

---

### User Story 4 - Un tipo especial queda fuera de habilidades "contra todos" (Priority: P2)

Una habilidad `TraitTargeting` configurada contra "todos los tipos estándar" no afecta a un enemigo con tipo especial, salvo que lo incluya explícitamente.

**Why this priority**: Razón de ser de los tipos especiales en la clasificación.

**Independent Test**: Una habilidad "contra todos los estándar" contra un enemigo `Metal` (especial) no aplica el multiplicador; una habilidad que incluye `Metal` explícitamente sí.

**Acceptance Scenarios**:

1. **Given** una habilidad apunta a "todos los tipos estándar", **When** ataca a un enemigo con tipo especial, **Then** el multiplicador no se aplica.
2. **Given** una habilidad incluye explícitamente un tipo especial entre sus objetivos, **When** ataca a un enemigo de ese tipo, **Then** el multiplicador sí se aplica.

---

### User Story 5 - Las inmunidades anulan efectos, incluyendo Curse (Priority: P3)

Una unidad inmune a un efecto no lo sufre; `Curse` deshabilita las habilidades especiales de quien lo sufre mientras dura, salvo inmunidad a Curse.

**Why this priority**: Cierra el sistema con su contraparte defensiva; depende de que ya existan habilidades que anular.

**Independent Test**: Aplicar `Curse` contra una unidad inmune y otra no inmune; la inmune no cambia, la no inmune pierde el multiplicador de sus habilidades mientras dura.

**Acceptance Scenarios**:

1. **Given** una unidad declara `immuneEffects` incluyendo `'Curse'`, **When** recibe ese efecto, **Then** `curseRemainingSeconds` nunca se activa.
2. **Given** una unidad sin inmunidad recibe `Curse`, **When** el efecto está activo, **Then** cualquier habilidad (`TraitTargeting`/`Neutral`) que declare se resuelve como daño base, sin multiplicador.
3. **Given** `Curse` expira (`curseRemainingSeconds <= 0`), **When** la unidad vuelve a atacar, **Then** sus habilidades se aplican con normalidad.

---

### Edge Cases

- Unidad sin tipo especial: siempre alcanzable por habilidades "contra todos".
- Unidad con varias habilidades a la vez: cada una se evalúa de forma independiente; no hay reglas de combinación especiales.
- Unidad inmune a Curse que de todas formas lo recibe: el efecto no se aplica, sigue usando sus habilidades con normalidad.
- Gatos/enemigos existentes sin clasificación/habilidades: `'Traitless'`, sin tipo especial, sin habilidades ni inmunidades — el combate actual sigue funcionando sin cambios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `Cat`/`BattleUnit` (ya extendidos por `specs/008-tipos-de-ataque`) DEBEN declarar `classification: ClassificationType` (`'Red' | 'Floating' | 'Black' | 'Angel' | 'Alien' | 'Zombie' | 'Relic' | 'Traitless'`).
- **FR-002**: `Cat`/`BattleUnit` DEBEN permitir opcionalmente `specialClassification?: SpecialClassificationType` (`'Typeless' | 'Colossus' | 'Behemoth' | 'Sage' | 'Metal' | 'Witch' | 'EvaAngel'`).
- **FR-003**: Una unidad sin `specialClassification` DEBE ser alcanzable por cualquier habilidad "contra todos los tipos estándar".
- **FR-004**: Una unidad CON `specialClassification` NO DEBE ser alcanzada por una habilidad "contra todos" a menos que la incluya explícitamente en `targetClassifications`.
- **FR-005**: `Cat` DEBE permitir declarar opcionalmente `abilities: Ability[]`, donde cada `Ability` es `{ kind: 'TraitTargeting'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; damageMultiplier: number }` o `{ kind: 'Neutral'; damageMultiplier: number }`.
- **FR-006**: Al resolver daño (`resolveEngagement`/`resolveAreaEngagement` de `specs/008-tipos-de-ataque`), el sistema DEBE aplicar el `damageMultiplier` de la primera habilidad del atacante que coincida con la clasificación del defensor (`Neutral` siempre coincide; `TraitTargeting` coincide si `defender.classification` o `defender.specialClassification` está en `targetClassifications`).
- **FR-007**: `Cat` DEBE permitir declarar opcionalmente `immuneEffects: EffectType[]` (hoy, `EffectType = 'Curse'`).
- **FR-008**: `Cat` DEBE permitir declarar opcionalmente `appliesEffect?: { type: 'Curse'; durationSeconds: number }`, aplicado al defensor en cada golpe exitoso, salvo que el defensor sea inmune a `'Curse'`.
- **FR-009**: Mientras `BattleUnit.curseRemainingSeconds > 0`, ninguna `Ability` de esa unidad DEBE aplicarse al atacar — el daño resuelve como `damage` base.
- **FR-010**: Al expirar `Curse` (`curseRemainingSeconds` llega a 0), la unidad DEBE recuperar el uso normal de sus habilidades en el siguiente ataque.
- **FR-011**: Gatos/enemigos sin clasificación/habilidades/inmunidades declaradas DEBEN tratarse como `'Traitless'`, sin tipo especial, sin habilidades ni inmunidades, sin romper el combate actual.
- **FR-012**: Los campos de esta feature NO DEBEN duplicar ni entrar en conflicto con los ya definidos por `specs/002-motor-de-combate` (costo, cooldown, salud, daño, velocidad) ni `specs/008-tipos-de-ataque` (tipo de ataque).

### Key Entities

- **`ClassificationType`** / **`SpecialClassificationType`**: ver FR-001/FR-002.
- **`Ability`**: `TraitTargetingAbility | NeutralAbility`, ver FR-005.
- **`EffectType`**: `'Curse'` (único efecto de esta spec).
- **`Cat`/`BattleUnit`** (extendidos): + `classification`, `specialClassification?`, `abilities?`, `immuneEffects?`, `appliesEffect?`; `BattleUnit` además + `curseRemainingSeconds: number` (estado en tiempo real, no en `Cat`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una habilidad `TraitTargeting` aplica su multiplicador únicamente contra el tipo que declara, el 100% de las veces.
- **SC-002**: Una habilidad `Neutral` aplica su multiplicador contra cualquier enemigo el 100% de las veces.
- **SC-003**: Un enemigo con tipo especial no recibe el efecto de una habilidad "contra todos" salvo inclusión explícita, el 100% de las veces.
- **SC-004**: Una unidad inmune a `Curse` nunca activa `curseRemainingSeconds`, verificado en el 100% de los casos de prueba.
- **SC-005**: Una unidad afectada por `Curse` pierde el multiplicador de sus habilidades mientras dura y lo recupera el 100% de las veces al expirar.
- **SC-006**: Las 4 unidades existentes y toda la suite de `specs/002`/`specs/003`/`specs/008-tipos-de-ataque` siguen funcionando sin modificarse tras esta extensión.

## Assumptions

- Se fusionan deliberadamente clasificación + habilidades avanzadas en una sola spec, igual que el origen — trait-targeting no tiene efecto sin clasificación, y clasificación sola no cambia el combate.
- El catálogo completo de efectos posibles más allá de `Curse` (Congelar, Retroceso, Debilitar, etc., mencionados en el roadmap origen) queda fuera de esta spec — puede añadirse en specs de contenido futuras sin romper este diseño (`EffectType` es una unión abierta a extender).
- Cuando varias `abilities` de una misma unidad podrían coincidir con el mismo defensor, se aplica la primera coincidencia en orden de declaración — no hay apilamiento de multiplicadores en esta spec.
- Esta feature no define aquí cómo se obtienen/autoran las habilidades de gatos concretos (más allá del catálogo actual de 4) — eso es contenido de specs futuras de unidades nuevas.
