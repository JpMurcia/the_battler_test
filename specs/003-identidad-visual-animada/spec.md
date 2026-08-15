# Feature Specification: Identidad Visual Animada

**Feature Branch**: `003-identidad-visual-animada`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "Spec 003 — Identidad Visual Animada del motor de combate. Cierra la excepción declarada en specs/002-motor-de-combate/plan.md § Complexity Tracking (Constitución § III): las BattleUnit actualmente se renderizan como rectángulos de color sólido por equipo (src/game/UnitSprite.tsx), sin ninguna animación. La Constitución § III exige, como mínimo, una animación de movimiento/idle y una animación de ataque por cada gato jugable o enemigo — nunca un único sprite estático. El proyecto NO tiene todavía ningún asset de arte/animación por gato; esta spec debe decidir un enfoque de animación factible sin depender de arte que no existe, manteniendo la separación estricta motor/UI (Constitución § VI)."

**Nota de alcance**: Esta spec cierra la excepción a la Constitución § III (Identidad Visual Animada) declarada explícitamente en `specs/002-motor-de-combate/plan.md` § Complexity Tracking: las unidades de batalla se renderizan hoy como un rectángulo de color sólido por equipo, sin ninguna animación de movimiento/idle ni de ataque. El balance final de contenido, el catálogo de gatos nuevos y cualquier arte dibujado a mano quedan fuera de esta spec — se resuelve con un enfoque de animación que no depende de ningún asset de arte externo, ya que el proyecto no tiene todavía un pipeline de producción de arte definido (ver Assumptions).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver que cada unidad está viva mientras avanza o combate (Priority: P1)

Un jugador observando la batalla ve que cada unidad desplegada (propia o enemiga) tiene una animación continua de movimiento/idle mientras avanza, y que esa animación cambia de forma reconocible a una animación de ataque en el momento en que la unidad queda trabada combatiendo contra otra unidad o contra una base — nunca ve una forma estática e inmóvil en el campo de batalla.

**Why this priority**: Es exactamente el requisito mínimo de la Constitución § III y la razón de ser de esta spec — sin esto, ninguna unidad del juego se considera "completa" según las reglas del proyecto. Es la única historia bloqueante; el resto son mejoras de legibilidad sobre esta base.

**Independent Test**: Entrar a una batalla, desplegar una unidad, y confirmar visualmente que (a) mientras avanza sin oponente muestra una animación continua de movimiento/idle, (b) al quedar trabada en combate contra una unidad enemiga o una base cambia a una animación de ataque reconociblemente distinta, y (c) al quedar libre de nuevo vuelve a la animación de movimiento/idle — todo sin ningún instante en que la unidad se vea como una forma fija sin movimiento propio.

**Acceptance Scenarios**:

1. **Given** una unidad fue desplegada y avanza sin ningún oponente bloqueándola, **When** el jugador la observa en cualquier momento mientras avanza, **Then** la unidad muestra una animación de movimiento/idle en curso, nunca una forma completamente estática.
2. **Given** una unidad queda superpuesta con una unidad enemiga o con una base y entra en combate, **When** eso ocurre, **Then** la unidad cambia a una animación de ataque visualmente distinguible de su animación de movimiento/idle, sincronizada con el ritmo de sus intercambios de daño.
3. **Given** una unidad estaba combatiendo y su oponente muere o dejó de bloquearla, **When** la unidad vuelve a avanzar, **Then** su animación regresa a movimiento/idle sin quedar congelada en la pose de ataque.
4. **Given** varias unidades están activas simultáneamente en pantalla, **When** el jugador las observa, **Then** cada una anima de forma independiente según su propio estado (avanzando o combatiendo), sin que la animación de una unidad afecte a otra.

---

### User Story 2 - Distinguir a simple vista qué tipo de gato es cada unidad (Priority: P2)

Un jugador que ha desplegado varios tipos de gato (básico, tanque, veloz, pesado) puede distinguir de un vistazo, sin abrir ningún menú, cuál unidad en el campo de batalla corresponde a cuál tipo, más allá de solo el color de equipo.

**Why this priority**: Mejora directamente la legibilidad de una batalla con varios gatos distintos en pantalla a la vez, pero la batalla ya es jugable y comprensible sin esto (US1 cubre el requisito constitucional mínimo) — por eso es una mejora de prioridad menor, no bloqueante.

**Independent Test**: Desplegar al menos dos tipos de gato distintos del roster en la misma batalla y confirmar que un observador puede identificar cuál unidad en pantalla corresponde a cuál tipo desplegado, sin necesitar abrir ningún panel de información.

**Acceptance Scenarios**:

1. **Given** dos tipos de gato distintos están activos en el campo de batalla al mismo tiempo, **When** el jugador los observa, **Then** puede diferenciarlos visualmente entre sí más allá del color de equipo (por ejemplo, tamaño, forma o carácter del movimiento).
2. **Given** un mismo tipo de gato se despliega varias veces, **When** el jugador observa esas unidades, **Then** todas comparten la misma identidad visual reconocible entre sí.

---

### User Story 3 - Ver con claridad el momento en que una unidad es derrotada (Priority: P3)

Un jugador observando la batalla ve una señal visual clara en el instante en que una unidad (propia o enemiga) es derrotada, en vez de que la unidad simplemente desaparezca sin ningún cambio visible o quede congelada en su última pose.

**Why this priority**: Es una mejora de claridad y sensación de juego ("game feel"), útil pero no exigida por la Constitución § III (que solo pide animación de movimiento/idle y de ataque) — la más baja prioridad de las tres, prescindible sin afectar el cumplimiento del resto de la spec.

**Independent Test**: Dejar que una unidad pierda todo su HP en combate y confirmar que, en el instante en que su salud llega a cero, se percibe una señal visual distinta antes de que la unidad deje de estar en pantalla.

**Acceptance Scenarios**:

1. **Given** una unidad llega a cero de salud durante el combate, **When** eso ocurre, **Then** el jugador percibe una señal visual de derrota distinguible de sus animaciones de movimiento/idle y de ataque, antes de que la unidad deje de renderizarse.

---

### Edge Cases

- ¿Qué pasa si una unidad muere en medio de su animación de ataque? La señal de derrota (US3) interrumpe inmediatamente la animación de ataque en curso — nunca quedan ambas superpuestas ni la unidad se congela a mitad de gesto.
- ¿Qué pasa con unidades de intervalo de ataque muy corto (por ejemplo, 0.8s)? La animación de ataque debe seguir siendo perceptible como un gesto distinguible en cada intercambio, no un parpadeo ilegible.
- ¿Qué pasa cuando hay 10 o más unidades animadas activas a la vez? El rendimiento debe mantenerse fluido (ver Success Criteria SC-003, heredado de `specs/002-motor-de-combate/spec.md` SC-003) — la animación no puede degradar los fps por debajo de ese umbral.
- ¿Qué pasa si la pestaña del navegador pierde foco y luego lo recupera a mitad de una animación? Cada unidad retoma la animación correspondiente a su estado actual de forma coherente, sin saltos ni poses inconsistentes con su estado real de combate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar una animación continua de movimiento/idle para toda unidad de batalla activa mientras esté viva, en todo momento — ninguna unidad puede aparecer como una forma completamente estática mientras está en pantalla.
- **FR-002**: El sistema DEBE mostrar una animación de ataque visualmente distinguible de la animación de movimiento/idle mientras una unidad está trabada en combate (intercambiando daño con otra unidad o con una base).
- **FR-003**: El sistema DEBE devolver a una unidad a su animación de movimiento/idle inmediatamente al dejar de estar trabada en combate y retomar el avance.
- **FR-004**: El sistema NO DEBE depender de ningún asset de arte dibujado a mano o producido externamente por gato para cumplir FR-001/FR-002 — el enfoque de animación debe ser viable con los recursos ya disponibles en el proyecto.
- **FR-005**: El sistema DEBE mantener la distinción visual actual entre unidades del jugador y unidades enemigas en todo momento, incluso durante ambas animaciones.
- **FR-006**: El sistema DEBE permitir distinguir visualmente, más allá del color de equipo, entre los distintos tipos de gato del catálogo activos simultáneamente en una batalla (US2).
- **FR-007**: El sistema DEBE mostrar una señal visual de derrota distinguible en el instante en que una unidad llega a cero de salud, antes de que deje de renderizarse (US3).
- **FR-008**: La lógica de simulación de combate (`src/engine/`) NO DEBE adquirir ninguna dependencia del motor de render ni de las animaciones — el estado de animación de una unidad se deriva exclusivamente en la capa de presentación a partir de datos ya existentes de `BattleUnit` (Constitución § VI, heredado de `specs/002-motor-de-combate/plan.md`).
- **FR-009**: El sistema DEBE mantener el objetivo de rendimiento ya establecido (60fps con al menos 10 unidades activas simultáneas, `specs/002-motor-de-combate/spec.md` SC-003) con las animaciones activas, no solo con las formas estáticas actuales.

### Key Entities *(include if feature involves data)*

- **Animation Profile por tipo de gato**: parámetros visuales (más allá del color de equipo) que le dan identidad reconocible a cada tipo de gato del catálogo — vive como contenido asociado a cada `Cat` en los mismos archivos de datos existentes (`src/data/cats.ts`), nunca hardcodeado en la capa de render ni en `src/engine/` (Constitución § IV).
- **Estado de animación de una BattleUnit**: representación puramente visual (movimiento/idle, ataque, derrota) derivada del `state` ya existente de `BattleUnit` (`Moving`/`Engaged`/`Dead`) — no es un campo nuevo del motor de simulación, solo una interpretación en la capa de presentación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las unidades activas en cualquier batalla muestran animación de movimiento/idle en curso durante todo el tiempo que están vivas en pantalla — cero instantes observables de forma estática.
- **SC-002**: El 100% de las unidades trabadas en combate muestran una animación de ataque distinguible de su animación de movimiento/idle, sincronizada perceptiblemente con sus intercambios de daño.
- **SC-003**: El bucle de combate se mantiene fluido y perceptible como fluido (sin tirones), con al menos 10 unidades animadas activas simultáneamente en pantalla — sin regresión respecto al umbral ya establecido en `specs/002-motor-de-combate/spec.md` SC-003.
- **SC-004**: Un jugador puede identificar, solo observando el campo de batalla (sin abrir ningún menú), cuál unidad está avanzando y cuál está combatiendo, en el 100% de los casos.
- **SC-005**: Con al menos dos tipos de gato distintos desplegados a la vez, un jugador puede distinguirlos entre sí a simple vista sin abrir ningún panel de información.

## Assumptions

- El proyecto no tiene todavía ningún pipeline de producción de arte ni assets de animación por gato (solo existe un placeholder genérico sin animación) — el enfoque de animación de esta spec se resuelve con recursos ya disponibles en el proyecto (por ejemplo, formas vectoriales animadas por transformación: escala, rotación, color, desplazamiento), no con spritesheets dibujados a mano. Una spec futura de arte/contenido puede reemplazar este enfoque por arte final sin volver a tocar `src/engine/`, igual que esta spec reemplaza el rectángulo estático de `specs/002-motor-de-combate/` sin tocarlo.
- La identidad visual por tipo de gato (US2, FR-006) se deriva de atributos que ya existen como datos por gato (por ejemplo, tamaño/`width`, velocidad, HP en `src/data/cats.ts`), no de nueva autoría de contenido artístico — mantiene la Constitución § IV (Balance Dirigido por Datos) sin ampliar el alcance de producción de contenido.
- La señal de derrota (US3, FR-007) es breve y no bloquea ni retrasa la resolución del combate ya en curso para otras unidades — es una mejora puramente visual, sin efecto en el motor de simulación.
- Los cuatro tipos de gato ya definidos en `src/data/cats.ts` (básico, tanque, veloz, pesado) son el alcance de contenido de esta spec — ningún gato nuevo se añade al catálogo como parte de este trabajo.
- El balance final de combate, el arte dibujado a mano y cualquier gato adicional del catálogo quedan fuera de esta spec, igual que quedaron fuera de `specs/002-motor-de-combate/spec.md`.
