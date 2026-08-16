# Feature Specification: Ampliación del Catálogo de Habilidades de Combate

**Feature Branch**: `015-catalogo-habilidades-combate`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/016-combat-ability-catalog` (proyecto Unity origen): añadir efectos de combate nuevos con comportamiento real (hoy solo existe `Curse`), priorizando Debilitar, Congelar, Ralentizar, Fuerte Contra y Resistente. Reutiliza el framework ya existente de habilidades por rasgo (`specs/009-clasificacion-habilidades`) — esta spec agrega contenido al catálogo de efectos, no arquitectura de selección de objetivo nueva.

**Relación con el proyecto existente**: Extiende `specs/009-clasificacion-habilidades`, que ya define *cuándo* se aplica un efecto (`Ability.TraitTargeting`/`Ability.Neutral`, contra qué `classification`/`specialClassification`) y *un* efecto con comportamiento real (`Curse`, vía `BattleUnit.appliesEffect`/`curseRemainingSeconds`, resuelto en `src/engine/combat.ts`). No redefine `Ability`, `AttackType`, `ClassificationType` ni el mecanismo de selección de objetivo — solo añade miembros nuevos a `EffectType` con comportamiento propio, y dos capacidades pasivas nuevas (Fuerte Contra el daño recibido, Resistente). El daño bonificado *infligido* contra un rasgo ya existe hoy vía `Ability.TraitTargeting.damageMultiplier` — esta spec completa el otro lado (daño *recibido*), que hoy no tiene ningún mecanismo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Debilitar a un enemigo para sobrevivir su ataque (Priority: P1)

Un jugador despliega una unidad con la habilidad "Debilitar" dirigida al rasgo de un enemigo peligroso; al conectar, ese enemigo inflige menos daño por un tiempo.

**Why this priority**: Patrón de "counter-play basado en rasgos" central a la estrategia del proyecto; sin al menos un efecto de control real, `specs/009` es tubería sin contenido jugable.

**Independent Test**: Enfrentar una unidad con Debilitar contra un enemigo del rasgo objetivo y verificar que el daño infligido por el enemigo baja mientras el efecto está activo, y vuelve a su valor normal al expirar.

**Acceptance Scenarios**:

1. **Given** una unidad con Debilitar dirigida al rasgo del enemigo, **When** impacta, **Then** el `damage` efectivo de ese enemigo en sus siguientes ataques se reduce durante `weakenRemainingSeconds`.
2. **Given** un enemigo debilitado, **When** `weakenRemainingSeconds` llega a 0, **Then** vuelve a su `damage` normal sin ninguna acción del jugador.
3. **Given** un enemigo ya debilitado, **When** recibe un segundo impacto de Debilitar antes de expirar el primero, **Then** el efecto se refresca (misma regla que `Curse` hoy — FR-008), sin acumular una reducción mayor a la configurada.

---

### User Story 2 - Congelar a un enemigo para ganar tiempo (Priority: P1)

Un jugador despliega una unidad con "Congelar" dirigida a un enemigo peligroso; al conectar, ese enemigo deja de moverse y de atacar por un tiempo.

**Why this priority**: Junto con Debilitar, es uno de los dos efectos priorizados en el input; ejemplo más claro de efecto binario, fácil de validar.

**Independent Test**: Enfrentar una unidad con Congelar contra un enemigo de prueba y verificar que no avanza ni ataca durante la duración configurada, retomando su comportamiento normal al expirar.

**Acceptance Scenarios**:

1. **Given** un enemigo congelado, **When** transcurre tiempo con el efecto activo, **Then** no cambia su `x` en el carril ni inflige daño (mismo tratamiento que un `attackCooldownRemaining` que nunca vence mientras `freezeRemainingSeconds > 0`).
2. **Given** un enemigo congelado que ya tenía un objetivo en rango, **When** el efecto expira, **Then** retoma su comportamiento normal sin quedar bloqueado permanentemente.
3. **Given** un enemigo con `immuneEffects` incluyendo `'Freeze'`, **When** una unidad le aplica Congelar, **Then** no queda congelado, igual que ya ocurre hoy con `Curse` (`specs/009` FR-007).
4. **Given** un enemigo ya congelado, **When** recibe un segundo impacto antes de expirar, **Then** la duración restante nunca baja de la ya activa (se refresca al máximo entre ambas, no se acumula sumando).

---

### User Story 3 - Ralentizar para ganar distancia (Priority: P2)

Un jugador despliega "Ralentizar" dirigida a un enemigo de bajo riesgo, sin gastar el efecto más fuerte (Congelar).

**Why this priority**: Complementa a Congelar como versión graduada; útil pero no imprescindible para un mínimo jugable — por eso P2.

**Independent Test**: Enfrentar una unidad con Ralentizar contra un enemigo y verificar que tarda perceptiblemente más en recorrer una distancia fija que uno sin el efecto.

**Acceptance Scenarios**:

1. **Given** un enemigo ralentizado, **When** avanza, **Then** su `speed` efectiva es menor que la base durante `slowRemainingSeconds`.
2. **Given** un enemigo ralentizado y además congelado por otro impacto, **When** ambos coinciden, **Then** Congelar prevalece (más restrictivo) — sin comportamiento indefinido.
3. **Given** un enemigo ya ralentizado, **When** recibe un segundo impacto de Ralentizar antes de expirar, **Then** ni la duración ni la intensidad quedan por debajo de las ya activas (mismo criterio que Debilitar/Congelar).

---

### User Story 4 - Resistir a daño recibido de un rasgo ("Fuerte Contra") (Priority: P2)

Un jugador prepara su equipo con unidades "Fuerte Contra" un rasgo específico: infligen más daño (ya cubierto por `Ability.TraitTargeting` existente) y además **reciben menos daño** de ese rasgo — el lado que hoy no existe.

**Why this priority**: Modificador pasivo (sin duración/expiración), más simple que los efectos de control, pero depende de que el jugador vea la preparación reflejada en combate — por eso P2.

**Independent Test**: Enfrentar la misma unidad con "resistencia a daño de rasgo" declarada, primero contra un enemigo de ese rasgo y luego contra uno de rasgo distinto, y verificar que el daño recibido difiere de forma consistente.

**Acceptance Scenarios**:

1. **Given** una unidad con resistencia a daño declarada contra un rasgo específico, **When** recibe daño de un enemigo de ese rasgo, **Then** recibe menos daño que el que recibiría de un enemigo de otro rasgo con el mismo `damage` de ataque.
2. **Given** la misma unidad, **When** recibe daño de un enemigo de un rasgo distinto al declarado, **Then** recibe el daño base, sin reducción.
3. **Given** la bonificación de daño *infligido* ya existente (`Ability.TraitTargeting`) y la resistencia a daño *recibido* nueva de esta spec, **When** ambas se declaran sobre el mismo rasgo en la misma unidad, **Then** operan de forma independiente — una modifica el multiplicador del atacante, la otra el del defensor, sin interferir entre sí.

---

### User Story 5 - Resistir un efecto sin ser inmune ("Resistente") (Priority: P3)

Una unidad diseñada para durar más bajo efectos de control gracias a "Resistente" contra un efecto específico: cuando lo sufre, le dura menos tiempo que a una unidad sin esa resistencia, sin llegar a ser inmune.

**Why this priority**: Añade profundidad pero no es indispensable para un mínimo jugable — se valida y entrega después de las cuatro historias anteriores sin bloquear nada.

**Independent Test**: Aplicar el mismo efecto (ej. Congelar) a dos unidades idénticas salvo por declarar o no Resistencia a ese efecto, y verificar que la resistente lo sufre por menos tiempo.

**Acceptance Scenarios**:

1. **Given** una unidad con Resistencia declarada contra un efecto específico, **When** lo recibe, **Then** la duración que sufre es menor que la duración configurada en el origen del efecto (`durationSeconds * (1 - resistanceFactor)`).
2. **Given** una unidad con Inmunidad total ya declarada (`immuneEffects`, comportamiento existente de `specs/009`), **When** recibe ese efecto, **Then** no se aplica en absoluto — Resistencia e Inmunidad son capacidades distintas y ambas siguen funcionando según lo que cada unidad declare.
3. **Given** una unidad con Resistencia tal que la duración resultante sería 0 o negativa, **When** recibe el efecto, **Then** se trata como si no se hubiera aplicado (equivalente a inmunidad efectiva para esa instancia).

---

### Edge Cases

- Una unidad atacante bajo `Curse` que debería aplicar Debilitar/Congelar/Ralentizar/Fuerte Contra: ninguna de sus habilidades se aplica mientras dure `Curse` (misma regla ya vigente, `specs/009` FR-009).
- Congelar y Ralentizar de fuentes distintas casi al mismo tiempo: Congelar prevalece de forma determinista (Historia 3, Escenario 2).
- Un objetivo con un efecto activo es destruido: el efecto deja de tener relevancia, sin error ni estado colgado — mismo patrón que `curseRemainingSeconds` de una unidad `Dead` (que ya no está en `units`).
- "Fuerte Contra" declarado contra un rasgo que el objetivo no tiene: valores base, sin bonificación ni penalización.
- Una unidad reutiliza su `instanceId` tras morir y desplegarse de nuevo: empieza sin ningún efecto heredado — mismo criterio que `curseRemainingSeconds` se resetea a 0 en `deployUnit`/`spawnEnemyUnit`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `EffectType` (`src/engine/types.ts`) DEBE extenderse con `'Weaken' | 'Freeze' | 'Slow'`, además de `'Curse'` ya existente.
- **FR-002**: `BattleUnit` DEBE ganar `weakenRemainingSeconds?`, `freezeRemainingSeconds?`, `slowRemainingSeconds?` (mismo patrón opcional que `curseRemainingSeconds`), decrementados por tick en `stepSimulation` sin bajar de 0 (mismo mecanismo ya existente para `Curse`).
- **FR-003**: Mientras `weakenRemainingSeconds > 0`, el `damage` efectivo de esa unidad al calcular daño en `src/engine/combat.ts` DEBE reducirse según un factor configurable de `AppliesEffect`.
- **FR-004**: Mientras `freezeRemainingSeconds > 0`, esa unidad NO DEBE avanzar en el carril ni infligir daño (se trata como bloqueada, sin consumir su cooldown de ataque).
- **FR-005**: Mientras `slowRemainingSeconds > 0`, la `speed` efectiva de esa unidad para el cálculo de movimiento DEBE reducirse según un factor configurable, sin impedir que ataque si tiene un objetivo en rango.
- **FR-006**: Si una unidad tiene `freezeRemainingSeconds > 0` y `slowRemainingSeconds > 0` simultáneamente, Congelar DEBE prevalecer (la unidad no se mueve, independientemente del valor de ralentización).
- **FR-007**: `Ability` (`src/engine/types.ts`) DEBE ganar un miembro `TraitResistance` (`{ kind: 'TraitResistance'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; damageTakenMultiplier: number }`) que reduce el daño *recibido* por la unidad que lo declara cuando el atacante pertenece a alguno de los rasgos listados — independiente de `TraitTargeting`, que ya modifica el daño *infligido*.
- **FR-008**: Cuando una unidad ya bajo un efecto de duración (Debilitar/Congelar/Ralentizar) recibe el mismo efecto de nuevo antes de expirar, el sistema DEBE refrescarlo al máximo entre la duración restante y la nueva, nunca sumarlas ni reducirlo.
- **FR-009**: El sistema DEBE soportar una capacidad "Resistente a [efecto]" (`resistantTo?: { effect: EffectType; durationMultiplier: number }[]` en `BattleUnit`/`Cat`) que reduce la duración efectiva de un efecto de duración al aplicarse sobre la unidad que la declara, sin bloquearlo por completo; si la duración resultante es ≤ 0, el efecto no se aplica.
- **FR-010**: El comportamiento de Inmunidad total ya existente (`immuneEffects`) DEBE seguir funcionando sin cambios para cualquier unidad que la tenga declarada, incluidos los `EffectType` nuevos.
- **FR-011**: Ninguna unidad existente que no declare los efectos/capacidades nuevos DEBE cambiar su comportamiento observable — en particular, `Curse` debe seguir comportándose exactamente igual que hoy.

### Key Entities *(include if feature involves data)*

- **`EffectType`** (extendido, `specs/009`): gana `'Weaken' | 'Freeze' | 'Slow'`.
- **`AppliesEffect`** (extendido): gana un `magnitude?: number` (factor de reducción para Debilitar/Ralentizar; irrelevante para Congelar).
- **`Ability.TraitResistance`** (nuevo): resistencia pasiva de daño *recibido* por rasgo — complementa a `Ability.TraitTargeting` (daño *infligido*, ya existente).
- **`BattleUnit.resistantTo`** (nuevo, opcional): lista de resistencias a duración de efecto declaradas por la unidad.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un enemigo bajo Debilitar inflige menos daño por golpe que sin el efecto, y recupera su daño normal al expirar la duración configurada.
- **SC-002**: Un enemigo bajo Congelar permanece en la misma posición y no inflige daño durante el 100% de la duración configurada.
- **SC-003**: Un enemigo bajo Ralentizar tarda más tiempo en recorrer una distancia fija que el mismo enemigo sin el efecto.
- **SC-004**: Una unidad con `TraitResistance` contra un rasgo recibe menos daño de ese rasgo que de un rasgo distinto, con el resto de sus valores base sin cambios.
- **SC-005**: Una unidad con Resistencia declarada contra un efecto lo sufre por menos tiempo que una equivalente sin ella, ante el mismo impacto.
- **SC-006**: Ninguna unidad existente antes de esta spec cambia su comportamiento observable si no declara ninguna capacidad nueva — `Curse` sigue funcionando exactamente igual.
- **SC-007**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en `tests/unit/engine/*` existente.

## Assumptions

- Reutiliza el mecanismo de selección de objetivo ya existente (`Ability.TraitTargeting`/`Ability.Neutral`, `specs/009`) — esta spec define **qué hacen** los efectos/capacidades nuevos, no **cómo se decide** a quién se aplican.
- Los valores de referencia (magnitud/duración de cada efecto) se definen como datos semilla en `src/data/cats.ts`, ajustables sin tocar código (Constitución § IV).
- Esta spec cubre los 5 efectos/capacidades priorizados (Debilitar, Congelar, Ralentizar, Fuerte Contra el daño recibido, Resistente). El resto del catálogo de referencia del juego original (golpe letal, killers de rasgo, escudo, invocar, etc.) queda fuera de alcance — candidato a una iteración futura.
- No se requiere ninguna animación o variante visual nueva por efecto — la identidad visual animada (Constitución § III) ya está cubierta a nivel de unidad vía `specs/003`/`specs/010`, independientemente de qué efectos declare.
- "Fuerte Contra" (daño recibido) y "Resistente" son modificadores pasivos permanentes de la unidad; no expiran, a diferencia de Debilitar/Congelar/Ralentizar.
- Esta spec no modifica `AttackType`, `ClassificationType` ni `SpecialClassificationType` — solo agrega contenido al catálogo de efectos, mismo patrón de extensión aditiva que `specs/009`/`specs/010`/`specs/012`.
