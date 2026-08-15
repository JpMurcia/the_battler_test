# Feature Specification: Sets de Tesoros y Objetos de Batalla en la Versión Web

**Feature Branch**: `025-treasure-sets-battle-items`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "Spec out 025 for the treasure sets and battle items" — ampliación de `024-react-web-migration` para cubrir dos sistemas ya construidos en la versión Unity (`014-chapter-scaling-treasure-sets`, `018-battle-items`) que `BattleStateManager.cs` reveló como fuera del alcance original de `024` (ver `specs/024-react-web-migration/tasks.md` T033 y `data-model.md` § Nota de alcance)."

**Relación con el proyecto existente**: Esta spec **extiende** `024-react-web-migration` sin redefinir ninguna de sus capacidades: reutiliza el bucle de combate, la resolución de batalla y el recurso de despliegue en batalla ya especificados ahí (`024` FR-002/003/004, `battleSession`), la progresión de capítulos (`024` FR-006), y el guardado de progreso del jugador (`024` FR-012). No vuelve a definir "batalla", "capítulo" ni "recurso de despliegue" desde cero — solo añade los dos sistemas que la lectura completa de `BattleStateManager.cs` identificó como ya construidos en Unity pero ausentes de las 5 historias de usuario originales de `024`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Completar un set de tesoros otorga una bonificación permanente (Priority: P1)

Un jugador que ya viene obteniendo tesoros de nivel (recompensa ya cubierta por `024`) descubre que varios de esos tesoros pertenecen a un mismo set nombrado. Al obtener el último tesoro que le faltaba de ese set, recibe de inmediato una bonificación pasiva permanente a la regeneración de su recurso de despliegue en batalla — activa desde esa misma batalla en adelante, en todas las batallas futuras.

**Why this priority**: Es el sistema completo de mayor prioridad de los dos — sin la evaluación de sets ni la bonificación permanente, los tesoros que el jugador ya obtiene (vía `024`) no tienen ninguna recompensa adicional más allá de su registro individual.

**Independent Test**: Con un set de 2-3 tesoros definido y el jugador ya en posesión de todos menos uno, ganar la batalla que otorga el tesoro faltante y confirmar que la bonificación pasiva del set queda activa de inmediato (visible en la regeneración del recurso de esa misma batalla si se reintenta, y en cualquier batalla posterior).

**Acceptance Scenarios**:

1. **Given** un jugador tiene todos los tesoros de un set salvo uno, **When** gana la batalla que otorga el tesoro faltante, **Then** el set queda completo y su bonificación pasiva se aplica de inmediato, activa en cualquier batalla siguiente (incluido un reintento posterior a esa misma victoria).
2. **Given** un jugador ya tiene un set completado y su bonificación otorgada, **When** entra a cualquier batalla nueva, **Then** la bonificación de ese set se reaplica automáticamente sin que el jugador tenga que hacer nada.
3. **Given** un set ya otorgó su bonificación, **When** el diseño del juego agrega un tesoro nuevo a ese mismo set (haciéndolo momentáneamente "incompleto" de nuevo), **Then** la bonificación ya otorgada permanece activa — nunca se retira una bonificación ya concedida.
4. **Given** un jugador tiene varios sets completados simultáneamente, **When** entra a una batalla, **Then** las bonificaciones de todos los sets completados se suman.

---

### User Story 2 - Seleccionar objetos de batalla antes de entrar a una batalla (Priority: P1)

Un jugador con objetos de batalla en su inventario (obtenidos como recompensa de misión o tesoro, no mediante ningún sistema de azar de obtención) los selecciona, hasta un límite máximo, desde la misma pantalla de preparación donde ya arma su equipo antes de entrar a una batalla.

**Why this priority**: Es el punto de entrada del sistema completo — sin selección, ningún objeto puede llegar a tener efecto en batalla.

**Independent Test**: Con al menos un objeto de batalla disponible en el inventario, entrar al flujo de preparación pre-batalla, seleccionarlo y confirmar que queda marcado como elegido para la siguiente batalla, sin descontarse todavía del inventario.

**Acceptance Scenarios**:

1. **Given** el jugador tiene al menos un objeto de batalla disponible en su inventario, **When** entra al flujo de preparación pre-batalla, **Then** puede seleccionarlo para la batalla siguiente.
2. **Given** el jugador ya seleccionó el número máximo permitido de objetos (3), **When** intenta seleccionar uno adicional, **Then** el sistema no lo permite hasta que deseleccione otro.
3. **Given** el jugador no tiene ningún objeto de batalla en su inventario, **When** entra al flujo de preparación pre-batalla, **Then** puede continuar sin seleccionar ninguno — una selección vacía es válida.
4. **Given** el jugador intenta seleccionar más copias de un objeto de las que tiene en inventario, **When** confirma la selección, **Then** el sistema la rechaza.

---

### User Story 3 - Un objeto de batalla seleccionado surte efecto desde el inicio de la batalla (Priority: P1)

Un jugador que entró a una batalla con uno o más objetos seleccionados observa su efecto activo desde el primer instante — aceleración de despliegue, recurso extra inicial, o una recompensa adicional de tesoro al ganar — y ve que el objeto se descontó de su inventario exactamente al entrar a esa batalla, no antes.

**Why this priority**: Es el valor central del sistema — sin un efecto observable, seleccionar un objeto no cambia nada. Comparte prioridad P1 con US2 porque ninguna de las dos entrega valor sin la otra.

**Independent Test**: Seleccionar un objeto de cada una de las tres categorías (aceleración, recurso extra, tesoro adicional) en batallas separadas y confirmar el efecto correspondiente de cada una, y que el inventario se descontó recién al entrar a la batalla (no al seleccionar en la pantalla de preparación).

**Acceptance Scenarios**:

1. **Given** el jugador seleccionó un objeto de aceleración de despliegue, **When** la batalla comienza, **Then** las unidades desplegadas se mueven más rápido que sin el objeto, desde el primer instante de la batalla.
2. **Given** el jugador seleccionó un objeto de recurso extra, **When** la batalla comienza, **Then** el recurso de despliegue en batalla arranca con un monto adicional respecto al inicio normal.
3. **Given** el jugador seleccionó un objeto de tesoro adicional, **When** la batalla termina en victoria, **Then** el jugador recibe, además del tesoro normal de esa batalla (si existe), un tesoro adicional elegido al azar entre los que todavía no posee de ningún set — y si ya posee todos los tesoros de todos los sets, el objeto no otorga nada adicional sin producir ningún error.
4. **Given** el jugador seleccionó cualquier objeto, **When** entra efectivamente a la batalla, **Then** ese objeto se descuenta del inventario en ese momento, no antes (si vuelve atrás desde la pantalla de preparación sin entrar a la batalla, el objeto sigue disponible sin descontar).
5. **Given** el jugador reintenta la misma batalla tras una derrota, **When** el reintento comienza, **Then** los efectos de los objetos ya consumidos al entrar siguen activos (no se vuelven a descontar del inventario ni se pierden en el reintento).

---

### Edge Cases

- ¿Qué pasa si dos objetos de batalla de la misma categoría se seleccionan a la vez (p. ej. dos de aceleración)? Sus efectos se acumulan (ver `024`/`data-model.md`: el multiplicador de velocidad es aditivo sobre la magnitud de cada objeto).
- ¿Qué pasa si el objeto de "tesoro adicional" se selecciona pero la batalla termina en derrota? No se otorga ningún tesoro adicional — el efecto solo aplica en victoria.
- ¿Qué pasa si un set de tesoros no tiene ningún tesoro configurado (set vacío o mal configurado)? No debe poder completarse nunca ni otorgar ninguna bonificación — un set inválido es contenido mal configurado, no un caso a manejar en tiempo de ejecución.
- ¿Qué pasa si el jugador ya tiene todos los tesoros de todos los sets y usa un objeto de "tesoro adicional"? No pasa nada — ninguna acción produce un error visible al jugador (ver Acceptance Scenario 3 de US3).
- ¿Qué pasa si el jugador intenta seleccionar un objeto que ya no existe en el catálogo del juego (contenido eliminado en una actualización)? Se ignora silenciosamente esa selección, sin bloquear el resto de la preparación pre-batalla.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir agrupar tesoros de nivel ya existentes (ver `024` Key Entities) en sets nombrados, cada uno con una bonificación pasiva permanente asociada.
- **FR-002**: El sistema DEBE evaluar, en cada victoria, si algún set queda completo por primera vez (el jugador posee todos sus tesoros) y, de ser así, otorgar su bonificación de forma permanente y monótona (una vez otorgada, nunca se revoca).
- **FR-003**: El sistema DEBE reaplicar automáticamente, al entrar a cualquier batalla, la bonificación de todos los sets cuya bonificación ya fue otorgada en el pasado — sin requerir ninguna acción del jugador.
- **FR-004**: Los jugadores DEBEN poder seleccionar hasta un máximo de 3 objetos de batalla de su inventario antes de entrar a una batalla, desde la misma pantalla de preparación donde forman su equipo.
- **FR-005**: El sistema DEBE permitir una selección vacía de objetos de batalla como válida (no es obligatorio seleccionar ninguno).
- **FR-006**: El sistema DEBE rechazar una selección que exceda la cantidad disponible en inventario de cualquier objeto elegido.
- **FR-007**: El sistema DEBE descontar del inventario cada objeto seleccionado en el momento exacto en que el jugador entra efectivamente a la batalla, no al momento de seleccionarlo en la pantalla de preparación.
- **FR-008**: El sistema DEBE aplicar el efecto de un objeto de categoría "aceleración de despliegue" desde el primer instante de la batalla, acumulando su magnitud con la de cualquier otro objeto de la misma categoría seleccionado a la vez.
- **FR-009**: El sistema DEBE otorgar el monto adicional de un objeto de categoría "recurso extra" al recurso de despliegue en batalla desde el inicio de la batalla.
- **FR-010**: El sistema DEBE otorgar, únicamente en caso de victoria y solo si el jugador seleccionó un objeto de categoría "tesoro adicional", un tesoro elegido al azar entre los que el jugador todavía no posee de ningún set — independiente del tesoro normal de esa batalla — sin producir ningún error si ya posee todos.
- **FR-011**: El sistema DEBE preservar los efectos de los objetos ya consumidos al reintentar la misma batalla tras una derrota, sin volver a descontarlos del inventario.
- **FR-012**: El sistema DEBE obtener objetos de batalla únicamente como recompensa de misión (victoria de capítulo) o de tesoro — nunca mediante un sistema de obtención aleatoria/gacha.

### Key Entities *(include if feature involves data)*

- **TreasureSet**: agrupación nombrada de tesoros de nivel ya existentes (ver `024` Key Entities), con una bonificación pasiva permanente asociada a completarse.
- **BattleItem**: consumible de una de tres categorías (aceleración de despliegue, recurso extra, tesoro adicional), con una magnitud propia; vive en el inventario del jugador como una cantidad poseída.
- **BattleItemSelection**: la elección de hasta 3 objetos de batalla hecha por el jugador para la próxima entrada a una batalla — efímera, se resuelve (consume) al entrar a la batalla o se descarta si el jugador no llega a entrar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador que completa un set de tesoros ve su bonificación activa en la primera batalla siguiente sin ninguna acción adicional de su parte, el 100% de las veces.
- **SC-002**: Ninguna bonificación de set ya otorgada se pierde nunca, incluso tras cerrar y reabrir la aplicación o tras cambios en la configuración de sets.
- **SC-003**: Un jugador puede seleccionar y usar un objeto de batalla de cada una de las tres categorías, viendo su efecto correspondiente reflejado en esa misma batalla, en el 100% de los casos donde el objeto está disponible en inventario.
- **SC-004**: El inventario de objetos de batalla del jugador nunca queda en un estado inconsistente (cantidad negativa, o descontado sin que la batalla se haya iniciado efectivamente).

## Assumptions

- Esta spec asume que `024-react-web-migration` (spec, plan, tasks) ya está implementada o en implementación — en particular `battleSession` (recurso de despliegue, resolución de victoria/derrota, guardado de progreso) y la pantalla de preparación pre-batalla donde se forma el equipo. Los dos sistemas de esta spec se integran ahí, no reemplazan nada de `024`.
- El catálogo de sets de tesoros y de objetos de batalla es contenido estático versionado (mismo criterio que `024` research.md Decisión 5), no editable en vivo por el jugador.
- Fuera de alcance de esta spec (quedan para specs futuras si se decide ampliarlas): saga arcs/multiplicadores de dificultad, la mecánica "Gatorreta", y el registro de enemigos encontrados — los otros sistemas que `specs/024-react-web-migration/tasks.md` T033 identificó junto a estos dos, pero que el usuario no pidió incluir aquí.
- El límite de 3 objetos seleccionables y las 3 categorías (aceleración, recurso extra, tesoro adicional) son los ya validados en la versión Unity (`018-battle-items`) — esta spec no cambia el balance, solo lo migra.
