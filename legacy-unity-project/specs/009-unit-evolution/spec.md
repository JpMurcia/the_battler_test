# Feature Specification: Sistema de Evolución de Unidad

**Feature Branch**: `009-unit-evolution`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Sistema de evolución de unidad en \"The Battler\": cada unidad puede evolucionar en etapas (forma base, segunda forma, forma verdadera) al alcanzar ciertos niveles, similar a https://battlecats.miraheze.org/wiki/Cat_(Normal_Cat) (evoluciona en nivel 10, y en nivel 20 con un ítem adicional). La forma final mejora significativamente los stats de la unidad (por ejemplo, duplica ataque y vida). Cada forma requiere su propia animación de idle y de ataque, conforme al Principio III de la constitución."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Evolucionar una unidad a su segunda forma al alcanzar el nivel requerido (Priority: P1)

Un jugador con una unidad que alcanzó el nivel necesario (por ejemplo, nivel 10) puede evolucionarla a su segunda forma desde la pantalla de mejora de unidades, obteniendo de inmediato una apariencia y estadísticas distintas.

**Why this priority**: Es el comportamiento central del sistema — sin esto, la evolución no existe como mecánica jugable.

**Independent Test**: Subir una unidad al nivel requerido para su segunda forma, evolucionarla desde la pantalla de mejora (`005-player-dashboard`) y confirmar que su apariencia, animaciones y estadísticas cambian de inmediato.

**Acceptance Scenarios**:

1. **Given** una unidad alcanzó el nivel requerido para su segunda forma, **When** el jugador elige evolucionarla, **Then** la unidad pasa a su segunda forma, con su propia animación de idle/ataque y sus estadísticas correspondientes.
2. **Given** una unidad no ha alcanzado el nivel requerido para su segunda forma, **When** el jugador intenta evolucionarla, **Then** el sistema no permite la evolución.

---

### User Story 2 - Evolucionar a la forma verdadera requiere nivel e ítem (Priority: P2)

Un jugador con una unidad en su segunda forma, que alcanzó un nivel superior (por ejemplo, nivel 20) y posee el ítem de evolución correspondiente, puede evolucionarla a su forma verdadera.

**Why this priority**: Es la etapa final de progresión de una unidad; depende de que la Historia 1 (segunda forma) ya exista, y añade un requisito adicional (ítem) sobre el mismo mecanismo.

**Independent Test**: Con una unidad en segunda forma que alcanzó el nivel requerido y con el ítem de evolución disponible, evolucionarla a forma verdadera y confirmar el consumo del ítem junto con el cambio de forma y estadísticas.

**Acceptance Scenarios**:

1. **Given** una unidad en segunda forma alcanzó el nivel requerido para forma verdadera y el jugador posee el ítem de evolución necesario, **When** el jugador elige evolucionarla, **Then** la unidad pasa a forma verdadera y el ítem se consume.
2. **Given** una unidad alcanzó el nivel requerido para forma verdadera pero el jugador no posee el ítem de evolución, **When** intenta evolucionarla, **Then** el sistema no permite la evolución hasta que el ítem esté disponible.
3. **Given** el jugador posee el ítem de evolución pero la unidad no alcanzó el nivel requerido para forma verdadera, **When** intenta evolucionarla, **Then** el sistema no permite la evolución hasta que se alcance ese nivel.

---

### User Story 3 - La forma verdadera mejora significativamente las estadísticas de combate (Priority: P2)

Un jugador nota que, tras evolucionar una unidad a su forma verdadera, sus estadísticas de combate (por ejemplo, ataque y vida) aumentan de forma notable respecto a su forma base.

**Why this priority**: Le da sentido de recompensa tangible a completar la progresión de evolución; depende de que la evolución (Historias 1 y 2) ya sea posible.

**Independent Test**: Comparar las estadísticas de combate de una unidad en forma base contra las mismas estadísticas ya evolucionada a forma verdadera, y confirmar una mejora significativa (por ejemplo, el doble de ataque y vida).

**Acceptance Scenarios**:

1. **Given** una unidad evolucionó a su forma verdadera, **When** se comparan sus estadísticas de combate con las de su forma base, **Then** muestran una mejora significativa definida en sus datos (por ejemplo, el doble de ataque y vida).

---

### User Story 4 - Cada forma tiene su propia animación de idle y de ataque (Priority: P3)

Un jugador distingue visualmente en qué forma de evolución está una unidad, porque cada forma (base, segunda, verdadera) tiene su propia animación de idle y de ataque.

**Why this priority**: Es un requisito de identidad visual (Principio III de la constitución) más que de mecánica de combate; depende de que existan formas de evolución (Historias 1-2) para tener qué diferenciar visualmente.

**Independent Test**: Evolucionar una unidad a través de sus tres formas y confirmar que cada una muestra una animación de idle y de ataque distinta a las anteriores.

**Acceptance Scenarios**:

1. **Given** una unidad tiene una forma de evolución activa, **When** se observa en el carril de batalla, **Then** reproduce la animación de idle y de ataque específica de esa forma, distinta de las otras formas de la misma unidad.

---

### Edge Cases

- ¿Qué pasa si una unidad supera ampliamente el nivel de una etapa posterior sin haber evolucionado la anterior (por ejemplo, llega a nivel 25 sin haber evolucionado a segunda forma)? Las evoluciones son secuenciales: no puede saltar directamente a forma verdadera sin pasar antes por su segunda forma, aunque ya cumpla el nivel de ambas.
- ¿Qué pasa si el jugador intenta evolucionar una unidad sin cumplir el nivel requerido? El sistema no permite la evolución y no consume ningún ítem.
- ¿Qué pasa si el jugador tiene el ítem de evolución pero la unidad no alcanzó el nivel requerido? El sistema bloquea la evolución hasta que se cumpla el nivel; el ítem no se consume.
- ¿Qué pasa con las unidades ya existentes de `001-chapter1-vertical-slice` que no tienen datos de evolución definidos? Permanecen únicamente en su forma base hasta que se les autore explícitamente datos de segunda forma y forma verdadera; esto no rompe su funcionamiento actual.
- ¿Qué pasa con el equipo activo (`TeamFormation`, `005-player-dashboard`) cuando una unidad evoluciona? La unidad sigue perteneciendo al equipo activo sin cambios; solo se actualizan su apariencia y estadísticas.
- ¿Qué pasa si el dato de forma de evolución o de ítems guardado está corrupto o ilegible? Se trata como ausencia de progreso de evolución (unidad en forma base), consistente con el criterio de fallback usado en `002-local-save-progress` y features posteriores.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE soportar hasta tres formas de evolución por unidad: Forma Base, Segunda Forma, Forma Verdadera.
- **FR-002**: Cada transición de forma DEBE requerir que la unidad alcance un nivel mínimo definido para esa etapa (por ejemplo, nivel 10 para la segunda forma).
- **FR-003**: La transición a Forma Verdadera DEBE requerir, además del nivel mínimo correspondiente (por ejemplo, nivel 20), la disponibilidad de un ítem de evolución para esa unidad.
- **FR-004**: Evolucionar una unidad DEBE ser una acción explícita del jugador, disponible desde la pantalla de mejora de unidades (`005-player-dashboard`) una vez cumplidos sus requisitos, y no un cambio automático al subir de nivel.
- **FR-005**: El sistema NO DEBE permitir evolucionar una unidad a una forma cuyos requisitos de nivel y/o ítem no estén cumplidos.
- **FR-006**: Evolucionar una unidad a Forma Verdadera DEBE consumir el ítem de evolución usado para desbloquearla.
- **FR-007**: Las evoluciones DEBEN ser secuenciales: una unidad no puede pasar a Forma Verdadera sin haber evolucionado antes a Segunda Forma, incluso si ya cumple los requisitos de nivel de ambas.
- **FR-008**: Cada forma de evolución DEBE tener su propia animación de idle y su propia animación de ataque, distintas de las otras formas de la misma unidad, conforme al Principio III de la constitución.
- **FR-009**: La Forma Verdadera DEBE aplicar una mejora significativa de estadísticas de combate respecto a la forma base de esa unidad (por ejemplo, duplicar ataque y vida), definida en los datos de esa unidad.
- **FR-010**: La forma de evolución actual de cada unidad, junto con los ítems de evolución disponibles, DEBE persistir localmente entre sesiones, junto con el resto del progreso de unidad de `005-player-dashboard`.
- **FR-011**: Las unidades ya existentes de `001-chapter1-vertical-slice` que no declaren datos de evolución DEBEN tratarse como si solo tuvieran disponible su Forma Base, sin romper su funcionamiento actual.
- **FR-012**: El sistema DEBE reflejar en batalla la forma de evolución vigente de cada unidad (apariencia, animaciones y estadísticas), no siempre su forma base.
- **FR-013**: El sistema DEBE tratar datos de evolución o de ítems corruptos o ilegibles como ausencia de progreso de evolución (unidad en Forma Base), sin bloquear la carga del dashboard ni de la batalla.

### Key Entities *(include if feature involves data)*

- **UnitEvolutionStage**: valor de datos con tres opciones posibles — Forma Base, Segunda Forma, Forma Verdadera — que determina la apariencia, animaciones y estadísticas vigentes de una unidad.
- **EvolutionRequirement**: requisito de nivel (y, para Forma Verdadera, de ítem de evolución) necesario para pasar de una forma a la siguiente, definido por unidad.
- **EvolutionItem**: recurso mínimo requerido para desbloquear la Forma Verdadera de una unidad; se consume al usarse.
- **Unidad** (existente, de `001-chapter1-vertical-slice`, ya extendida por `007-attack-types` y `008-classification-trait-abilities`): ahora incluye su `UnitEvolutionStage` vigente y, por forma, su propio conjunto de animaciones y modificadores de estadísticas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una unidad que cumple el nivel requerido para su segunda forma puede evolucionar en una sola acción explícita, reflejando de inmediato su nueva apariencia y estadísticas.
- **SC-002**: Un intento de evolución sin cumplir el nivel y/o ítem requerido es bloqueado el 100% de las veces, sin consumir el ítem de evolución.
- **SC-003**: Una unidad en Forma Verdadera muestra una mejora significativa de estadísticas de combate (por ejemplo, el doble de ataque y vida) respecto a su forma base, verificado en el 100% de las unidades evolucionadas.
- **SC-004**: La forma de evolución y los ítems de evolución de cada unidad se mantienen intactos el 100% de las veces tras cerrar y reabrir el juego.
- **SC-005**: Cada forma de evolución de una unidad completamente evolucionada muestra una animación de idle y de ataque distinta a las otras formas de esa misma unidad, verificado en al menos una unidad de prueba.

## Assumptions

- **Nota de gobernanza resuelta (`/speckit.constitution` v1.1.0, 2026-07-29)**: esta feature introduce variantes visuales adicionales (una por forma de evolución) y modifica estadísticas de combate por forma. La constitución (Principio III) fue enmendada explícitamente para cubrir este caso: una mecánica de progresión con un número acotado de etapas (como esta) puede declarar su propia animación/variante/stats por etapa sin violar el principio, siempre que la Forma Base ya cumpla el mínimo exigido por sí sola. Esta feature ya puede avanzar a `/speckit.plan`/`/speckit.tasks`/`/speckit.implement` sin bandera pendiente.
- Esta feature depende de `008-classification-trait-abilities` (que cubre lo que el roadmap llamaba Fase 9, Clasificación) y de `001-chapter1-vertical-slice` (unidades base); no depende funcionalmente de `007-attack-types` más allá de compartir el mismo contrato de datos de unidad.
- Evolucionar una unidad es una acción manual y explícita del jugador desde la pantalla de mejora de unidades (`005-player-dashboard`), no un cambio automático al alcanzar el nivel requerido — sigue la convención del juego de referencia y da una acción claramente testeable.
- El "ítem adicional" requerido para la Forma Verdadera se resuelve en esta feature como un recurso mínimo (`EvolutionItem`) acotado a este propósito; no se introduce aquí un sistema de inventario o ítems general. Por defecto, se asume que este ítem se obtiene como resultado de completar misiones (mismo patrón de obtención ya asumido para la experiencia en `005-player-dashboard` y `006-mission-energy-system`), sin requerir una tienda o tabla de drops dedicada en esta spec.
- Las evoluciones son estrictamente secuenciales (Forma Base → Segunda Forma → Forma Verdadera); una unidad no puede saltarse una etapa aunque ya cumpla los requisitos de nivel de una posterior.
- Las unidades ya existentes de `001-chapter1-vertical-slice` permanecen en Forma Base por defecto hasta que se les autoren datos de Segunda Forma y Forma Verdadera, siguiendo el mismo patrón de valor por defecto ya usado en `007-attack-types` y `008-classification-trait-abilities`.
- El multiplicador exacto de estadísticas por forma (por ejemplo, "duplicar ataque y vida" en la Forma Verdadera) se define por unidad en los datos; esta spec no exige una fórmula universal, solo que la Forma Verdadera represente una mejora significativa.
- No fue posible acceder directamente a la página de referencia (`https://battlecats.miraheze.org/wiki/Cat_(Normal_Cat)`) durante la redacción de esta spec (mismo problema de acceso ya documentado en `007-attack-types` y `008-classification-trait-abilities` para otras páginas del mismo sitio); la estructura de niveles de evolución (10 y 20+ítem) se toma directamente del input de esta feature y del roadmap del proyecto.
