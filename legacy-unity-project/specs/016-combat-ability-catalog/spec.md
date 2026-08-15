# Feature Specification: Ampliación del Catálogo de Habilidades de Combate

**Feature Branch**: `016-combat-ability-catalog`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "Ampliación del catálogo de habilidades de combate de \"The Battler\": añadir nuevos tipos de AbilityEffectType con comportamiento real (hoy solo existe Curse), priorizando Debilitar, Congelar, Ralentizar, Fuerte Contra y Resistente, siguiendo el catálogo de https://battlecats.miraheze.org/wiki/Special_Abilities secciones \"Trait-targeting abilities\" y \"Immunities\". Reutiliza el framework ya existente de TraitTargetingAbility/NeutralAbility/Immunity (008-classification-trait-abilities) — esta fase agrega contenido, no arquitectura nueva."

**Relación con el proyecto existente**: Esta especificación **extiende** el sistema de habilidades de combate ya construido en `008-classification-trait-abilities` (habilidades por objetivo de rasgo, habilidades neutrales, inmunidades). Ese sistema define *cuándo* se aplica un efecto (contra qué rasgo, o sin restricción); hoy solo existe **un** efecto con comportamiento real ("Maldición"/Curse). Esta feature agrega **contenido nuevo al catálogo de efectos** — no cambia el mecanismo de selección de objetivo ni introduce arquitectura nueva. No redefine `TraitTargetingAbility`, `NeutralAbility` ni `Immunity` desde cero.

**Nota de gobernanza (Principio V, Balance Dirigido por Datos)**: todos los valores de magnitud y duración de los efectos nuevos deben vivir en datos (assets), nunca hardcodeados — mismo criterio ya aplicado por `008`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Debilitar a un enemigo para sobrevivir su ataque (Priority: P1)

Un jugador enfrenta un enemigo cuyo daño por golpe es demasiado alto para sus unidades actuales. Despliega una unidad con la habilidad "Debilitar" dirigida al rasgo de ese enemigo; al conectar, el enemigo inflige menos daño por un tiempo, dando margen al jugador para sostener la línea de combate.

**Why this priority**: Es el patrón de "counter-play basado en rasgos" que la constitución y el manual técnico del proyecto identifican como el eje central de la estrategia — sin al menos un efecto de control real, el catálogo de habilidades (008) es solo tubería sin contenido jugable.

**Independent Test**: Configurar una unidad con habilidad Debilitar contra un rasgo de prueba, enfrentarla a un enemigo de ese rasgo, y verificar que el daño infligido por el enemigo baja mientras el efecto está activo y vuelve a su valor normal al expirar.

**Acceptance Scenarios**:

1. **Given** una unidad propia con habilidad Debilitar dirigida al rasgo del enemigo, **When** la unidad propia impacta al enemigo, **Then** el daño que ese enemigo inflige en sus siguientes ataques se reduce durante la duración configurada.
2. **Given** un enemigo debilitado, **When** la duración configurada expira, **Then** el enemigo vuelve a infligir su daño normal sin necesidad de ninguna acción del jugador.
3. **Given** un enemigo ya debilitado, **When** recibe un segundo impacto de Debilitar antes de que expire el primero, **Then** el efecto no se acumula de forma que el daño quede en un valor menor al mínimo configurado (incluso si un tercer impacto lo reduciría más).

---

### User Story 2 - Congelar a un enemigo para ganar tiempo (Priority: P1)

Un jugador necesita detener por completo a un enemigo peligroso mientras reorganiza su equipo o acumula dinero de batalla. Despliega una unidad con la habilidad "Congelar" dirigida al rasgo de ese enemigo; al conectar, el enemigo deja de moverse y de atacar por un tiempo.

**Why this priority**: Junto con Debilitar, es uno de los dos efectos de control mencionados explícitamente como prioritarios en el input de esta feature, y es el ejemplo más claro de "efecto binario" (funciona o no funciona) fácil de validar.

**Independent Test**: Configurar una unidad con habilidad Congelar, enfrentarla a un enemigo de prueba, y verificar que el enemigo no avanza ni ataca durante la duración configurada, retomando su comportamiento normal al expirar.

**Acceptance Scenarios**:

1. **Given** un enemigo congelado, **When** transcurre tiempo mientras el efecto está activo, **Then** el enemigo no cambia su posición en el carril ni inflige daño.
2. **Given** un enemigo congelado que ya tenía un objetivo propio en rango antes de ser congelado, **When** el efecto expira, **Then** el enemigo retoma su comportamiento normal (moverse o atacar) sin quedar bloqueado permanentemente.
3. **Given** un enemigo con inmunidad declarada contra Congelar, **When** una unidad propia le aplica Congelar, **Then** el enemigo no queda congelado, igual que ya ocurre hoy con la inmunidad a Maldición.
4. **Given** un enemigo ya congelado, **When** recibe un segundo impacto de Congelar antes de que expire el primero, **Then** la duración restante nunca queda por debajo de la ya activa (no se "resetea" a un valor menor ni se acumula sumando ambas duraciones).

---

### User Story 3 - Ralentizar para ganar distancia (Priority: P2)

Un jugador quiere retrasar a un enemigo sin inmovilizarlo por completo, para ganar tiempo de reacción sin gastar el efecto más fuerte (Congelar) en un enemigo de bajo riesgo. Despliega una unidad con habilidad "Ralentizar" dirigida al rasgo de ese enemigo.

**Why this priority**: Complementa a Congelar como una versión graduada del mismo tipo de control — útil pero no imprescindible para que el catálogo tenga valor jugable mínimo (por eso P2, no P1).

**Independent Test**: Configurar una unidad con habilidad Ralentizar, enfrentarla a un enemigo de prueba, y verificar que el enemigo tarda perceptiblemente más en recorrer una distancia fija que un enemigo equivalente sin el efecto.

**Acceptance Scenarios**:

1. **Given** un enemigo ralentizado, **When** avanza por el carril, **Then** su velocidad de movimiento es menor que su velocidad normal durante la duración configurada.
2. **Given** un enemigo ralentizado y además congelado por otro impacto, **When** ambos efectos coinciden en el tiempo, **Then** el sistema define de forma consistente cuál efecto prevalece (Congelar, por ser más restrictivo) sin comportamiento indefinido.
3. **Given** un enemigo ya ralentizado, **When** recibe un segundo impacto de Ralentizar antes de que expire el primero, **Then** ni la duración restante ni la intensidad de la ralentización quedan en un valor menor a las ya activas (mismo criterio de no-acumulación que Debilitar, Historia 1 Escenario 3).

---

### User Story 4 - Preparar el equipo con "Fuerte Contra" (Priority: P2)

Un jugador que ya conoce el rasgo del enemigo objetivo de un nivel prepara su equipo llevando unidades con la habilidad "Fuerte Contra" ese rasgo, para infligir más daño y recibir menos daño en cada enfrentamiento contra esos enemigos específicos.

**Why this priority**: Es un modificador pasivo (no requiere lógica de duración/expiración), más simple de construir que los efectos de control, pero depende de que el jugador pueda ver esa preparación reflejada en el combate — por eso P2.

**Independent Test**: Enfrentar la misma unidad con Fuerte Contra declarado, primero contra un enemigo del rasgo objetivo y luego contra un enemigo de un rasgo distinto, y verificar que el daño infligido y recibido difiere de forma consistente con la ventaja declarada.

**Acceptance Scenarios**:

1. **Given** una unidad con Fuerte Contra un rasgo específico, **When** combate contra un enemigo de ese rasgo, **Then** inflige más daño por golpe que su valor base.
2. **Given** la misma unidad con Fuerte Contra, **When** combate contra un enemigo de un rasgo distinto al declarado, **Then** su daño e interacción de combate son los valores base, sin bonificación.
3. **Given** una unidad con Fuerte Contra un rasgo específico, **When** recibe daño de un enemigo de ese mismo rasgo, **Then** recibe menos daño que el que recibiría de un enemigo de otro rasgo con el mismo poder de ataque.

---

### User Story 5 - Resistir un debuff sin ser inmune (Priority: P3)

Un jugador tiene una unidad diseñada para durar más tiempo bajo efectos de control gracias a la habilidad "Resistente" contra un efecto específico (por ejemplo, Congelar): cuando la sufre, el efecto le dura menos tiempo que a una unidad sin esa resistencia, sin llegar a ser inmune por completo.

**Why this priority**: Añade profundidad pero no es indispensable para que el catálogo tenga un mínimo jugable — se puede validar y entregar después de las cuatro historias anteriores sin bloquear nada.

**Independent Test**: Aplicar el mismo efecto (por ejemplo, Congelar) a dos unidades idénticas salvo por tener o no declarada la Resistencia a ese efecto, y verificar que la unidad resistente queda bajo el efecto menos tiempo que la que no lo es.

**Acceptance Scenarios**:

1. **Given** una unidad con Resistencia declarada contra un efecto específico, **When** recibe ese efecto, **Then** la duración que sufre es menor que la duración configurada en el origen del efecto.
2. **Given** una unidad con Inmunidad total ya declarada contra un efecto (comportamiento existente de `008`), **When** recibe ese efecto, **Then** el efecto no se aplica en absoluto — Resistencia e Inmunidad son capacidades distintas y ambas siguen funcionando según lo que cada unidad declare.

---

### Edge Cases

- ¿Qué pasa si una unidad atacante está bajo el efecto de Maldición (Curse) cuando debería aplicar Debilitar/Congelar/Ralentizar/Fuerte Contra a su objetivo? Debe seguir la misma regla ya vigente para toda habilidad de una unidad "maldecida": ninguna de sus habilidades se aplica mientras dure la Maldición.
- ¿Qué pasa si una unidad recibe Congelar y Ralentizar de fuentes distintas casi al mismo tiempo? El sistema debe resolverlo de forma consistente y predecible (ver Historia 3, Escenario 2), no dejar el resultado indefinido según el orden de llegada.
- ¿Qué pasa si un enemigo objetivo es destruido mientras tiene un efecto activo (Debilitar/Congelar/Ralentizar)? El efecto simplemente deja de tener relevancia — no debe producir ningún error ni comportamiento colgado.
- ¿Qué pasa si "Fuerte Contra" se declara contra un rasgo que el objetivo no tiene? La unidad se comporta con sus valores base, sin bonificación ni penalización.
- ¿Qué pasa si una unidad tiene Resistencia declarada contra un efecto pero la duración resultante después de aplicar la resistencia sería cero o negativa? El efecto se trata como si no se hubiera aplicado (equivalente a inmunidad efectiva para esa instancia).
- ¿Qué pasa si una unidad que estuvo bajo Debilitar/Congelar/Ralentizar es destruida y su instancia se reutiliza más tarde para desplegar una unidad nueva? La unidad nueva DEBE empezar sin ningún efecto activo heredado del uso anterior — mismo criterio ya aplicado a Maldición (`m_CurseRemainingSeconds` se resetea al reciclar la instancia, 008).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE soportar un efecto "Debilitar" que reduzca el daño infligido por la unidad afectada durante una duración configurable, volviendo a su daño normal al expirar.
- **FR-002**: El sistema DEBE soportar un efecto "Congelar" que impida por completo el movimiento y el ataque de la unidad afectada durante una duración configurable, retomando su comportamiento normal al expirar.
- **FR-003**: El sistema DEBE soportar un efecto "Ralentizar" que reduzca la velocidad de movimiento de la unidad afectada durante una duración configurable, sin impedir que ataque si tiene un objetivo en rango.
- **FR-004**: El sistema DEBE soportar una capacidad "Fuerte Contra [rasgo]" que aumente el daño infligido a unidades del rasgo declarado y reduzca el daño recibido de esas mismas unidades, sin alterar el comportamiento contra cualquier otro rasgo.
- **FR-005**: El sistema DEBE soportar una capacidad "Resistente a [efecto]" que reduzca la duración efectiva de un efecto específico (Debilitar, Congelar o Ralentizar) cuando se aplica sobre la unidad que la declara, sin bloquearlo por completo.
- **FR-006**: El comportamiento ya existente de Inmunidad total (bloqueo completo de un efecto, hoy usado por Maldición) DEBE seguir funcionando sin cambios para cualquier unidad que la tenga declarada.
- **FR-007**: Una unidad bajo el efecto de Maldición NO DEBE aplicar ninguno de los efectos nuevos (Debilitar/Congelar/Ralentizar) ni la capacidad Fuerte Contra a otras unidades, igual que ya ocurre con cualquier otra habilidad suya.
- **FR-008**: Cuando una unidad ya bajo un efecto de duración (Debilitar, Congelar o Ralentizar) recibe el mismo efecto de nuevo antes de que expire, el sistema DEBE resolverlo de forma consistente (sin acumular indefinidamente ni comportarse de forma distinta según el orden de llegada).
- **FR-009**: Todos los valores de magnitud y duración de los efectos nuevos (cuánto reduce Debilitar, cuánto dura Congelar, cuánta velocidad quita Ralentizar, cuánto bonifica Fuerte Contra, cuánto reduce Resistente) DEBEN ser configurables como datos, sin requerir cambios de código para ajustarlos.
- **FR-010**: La introducción de estos efectos nuevos NO DEBE alterar el comportamiento de ninguna unidad ya existente en el juego que no los declare explícitamente — en particular, el efecto Maldición ya implementado debe seguir comportándose exactamente igual que hoy.

### Key Entities *(include if feature involves data)*

- **Efecto de Duración (Debilitar / Congelar / Ralentizar)**: un efecto con nombre reconocible que se aplica sobre una unidad durante un tiempo configurable, y que modifica su capacidad de moverse y/o de infligir daño mientras está activo.
- **Capacidad de Combate por Rasgo (Fuerte Contra)**: una relación declarada por una unidad hacia un rasgo objetivo, que modifica de forma permanente (sin expiración) el daño infligido y recibido al combatir contra unidades de ese rasgo.
- **Resistencia (Resistente)**: una relación declarada por una unidad hacia un efecto específico, que reduce (sin eliminar por completo) el impacto de ese efecto cuando la unidad lo recibe — se diferencia de la Inmunidad ya existente, que bloquea el efecto por completo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una batalla de prueba, un enemigo bajo Debilitar inflige menos daño por golpe que el mismo enemigo sin el efecto, y recupera su daño normal en cuanto la duración configurada termina.
- **SC-002**: En una batalla de prueba, un enemigo bajo Congelar permanece en la misma posición del carril y no inflige ningún daño durante el 100% de la duración configurada del efecto.
- **SC-003**: En una batalla de prueba, un enemigo bajo Ralentizar tarda más tiempo en recorrer una distancia fija que el mismo enemigo sin el efecto.
- **SC-004**: En una batalla de prueba, una unidad con Fuerte Contra un rasgo específico inflige más daño y recibe menos daño frente a enemigos de ese rasgo que frente a enemigos de un rasgo distinto, manteniendo el resto de sus valores base sin cambios.
- **SC-005**: En una batalla de prueba, una unidad con Resistencia declarada contra un efecto sufre ese efecto por menos tiempo que una unidad equivalente sin la resistencia, ante el mismo impacto.
- **SC-006**: Ninguna unidad existente en el juego antes de esta feature cambia su comportamiento observable en batalla si no declara ninguno de los efectos nuevos — el efecto Maldición sigue funcionando exactamente igual que antes de esta feature.

## Assumptions

- Esta feature reutiliza el mecanismo ya existente de selección de objetivo (`TraitTargetingAbility` para habilidades dirigidas a un rasgo, `NeutralAbility` para habilidades sin restricción) de `008-classification-trait-abilities` — esta spec define **qué hacen** los efectos nuevos, no **cómo se decide** a quién se aplican.
- Los valores iniciales de referencia (magnitud y duración de cada efecto) se toman como datos semilla del catálogo del manual técnico del proyecto (sección "Habilidades de control y debilitamiento" / "Habilidades ofensivas por rasgo objetivo"), ajustables después sin tocar código.
- Esta feature cubre 5 efectos priorizados explícitamente (Debilitar, Congelar, Ralentizar, Fuerte Contra, Resistente). El resto del catálogo del manual (Golpe Letal, Zombie Killer, Metal Killer, Deformación/Warp, Tóxico, Sobrevivir, Escudo, Invocar, Dinero Extra, y otros) queda fuera de alcance — candidato a una iteración futura del mismo catálogo.
- No se requiere ninguna animación o variante visual nueva por efecto — el Principio III (identidad visual animada) ya está cubierto a nivel de unidad, independientemente de qué efectos declare.
- "Fuerte Contra" y "Resistente" son modificadores pasivos permanentes de la unidad (no tienen duración temporal como Debilitar/Congelar/Ralentizar, que sí expiran).
- Esta feature no modifica ni redefine `AttackType`, `ClassificationType`, `SpecialClassificationType` ni ningún dato ya serializado por specs anteriores — solo agrega contenido nuevo al catálogo de efectos, siguiendo el mismo patrón de extensión aditiva ya usado por `009`, `010`, `013` y `014`.
