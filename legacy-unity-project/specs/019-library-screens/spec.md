# Feature Specification: Bibliotecas de Consulta (Cat Guide / Enemy Guide / Treasure Menu)

**Feature Branch**: `019-library-screens`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "Bibliotecas de consulta de \"The Battler\": tres pantallas de solo lectura accesibles desde la Base del Jugador — Cat Guide (unidades desbloqueadas y sus stats, usando UnitUnlockCatalog), Enemy Guide (enemigos ya enfrentados en batalla, con sus stats) y Treasure Menu (progreso de tesoros por capítulo, usando TreasureSetDefinition de 014-chapter-scaling-treasure-sets). No modifica ningún sistema existente, solo lo expone."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar las unidades poseídas y sus estadísticas (Cat Guide) (Priority: P1)

Un jugador entra al Cat Guide desde la Base del Jugador y ve todas las unidades que posee actualmente (las del capítulo más cualquier unidad bonus desbloqueada), cada una con sus estadísticas de combate.

**Why this priority**: Es la biblioteca de mayor uso esperado — ayuda al jugador a decidir cómo formar su equipo, reforzando directamente el dashboard ya existente (`005-player-dashboard`).

**Independent Test**: Con al menos una unidad bonus desbloqueada, entrar al Cat Guide y confirmar que aparecen tanto las unidades base como la bonus, cada una con sus stats.

**Acceptance Scenarios**:

1. **Given** el jugador posee unidades base del capítulo y al menos una unidad bonus desbloqueada, **When** entra al Cat Guide, **Then** ve listadas todas esas unidades, cada una con sus estadísticas de combate.
2. **Given** el jugador no ha desbloqueado ninguna unidad bonus, **When** entra al Cat Guide, **Then** ve únicamente las unidades base del capítulo, sin error.

---

### User Story 2 - Consultar los enemigos ya enfrentados y sus estadísticas (Enemy Guide) (Priority: P1)

Un jugador entra al Enemy Guide desde la Base del Jugador y ve los enemigos que ya aparecieron en alguna de sus batallas, cada uno con sus estadísticas de combate.

**Why this priority**: Mismo valor de consulta que el Cat Guide, pero para el lado enemigo — ayuda al jugador a anticipar amenazas ya conocidas; depende de que exista un registro de qué enemigos ya se han visto, dato nuevo introducido por esta feature.

**Independent Test**: Jugar una batalla donde aparezca al menos un enemigo nuevo, volver a la Base del Jugador, entrar al Enemy Guide y confirmar que ese enemigo aparece listado con sus stats.

**Acceptance Scenarios**:

1. **Given** un enemigo apareció en el carril durante alguna batalla ya jugada, **When** el jugador entra al Enemy Guide, **Then** ese enemigo aparece listado con sus estadísticas de combate.
2. **Given** el jugador nunca ha jugado ninguna batalla, **When** entra al Enemy Guide, **Then** la ve vacía, sin error.
3. **Given** un enemigo estaba planeado en la oleada de una batalla pero nunca llegó a aparecer en el carril (por ejemplo, la batalla terminó antes), **When** el jugador entra al Enemy Guide, **Then** ese enemigo no aparece listado.

---

### User Story 3 - Consultar el progreso de tesoros por set (Treasure Menu) (Priority: P2)

Un jugador entra al Treasure Menu desde la Base del Jugador y ve, para cada set de tesoros configurado, cuántos de sus tesoros ya obtuvo sobre el total del set, y si la bonificación pasiva de ese set ya fue otorgada.

**Why this priority**: Depende de contenido ya construido en `014-chapter-scaling-treasure-sets`; es de menor prioridad que las dos anteriores porque expone progreso que el jugador ya puede inferir jugando, mientras que Cat Guide/Enemy Guide son la única forma de consultar stats de unidades/enemigos.

**Independent Test**: Completar un nivel que otorga un tesoro de un set configurado, entrar al Treasure Menu y confirmar que ese set refleja el nuevo progreso.

**Acceptance Scenarios**:

1. **Given** el jugador ya obtuvo algunos, pero no todos, los tesoros de un set configurado, **When** entra al Treasure Menu, **Then** ve ese set con el conteo correcto de tesoros obtenidos sobre el total.
2. **Given** el jugador completó todos los tesoros de un set y ya recibió su bonificación pasiva, **When** entra al Treasure Menu, **Then** ese set se muestra como completo, con la bonificación marcada como otorgada.
3. **Given** el jugador no ha obtenido ningún tesoro de un set configurado, **When** entra al Treasure Menu, **Then** ese set se muestra con 0 tesoros obtenidos sobre el total, sin error.

---

### Edge Cases

- ¿Qué pasa si el jugador no ha desbloqueado ninguna unidad bonus? Cat Guide muestra únicamente las unidades base del capítulo (US1 Escenario 2).
- ¿Qué pasa si el jugador aún no se ha enfrentado a ningún enemigo? Enemy Guide se muestra vacía, sin error (US2 Escenario 2).
- ¿Qué pasa con un enemigo que estaba planeado en una oleada pero nunca llegó a aparecer en el carril? No se registra como enfrentado — "enfrentado" significa que llegó a aparecer, no que estaba planeado (US2 Escenario 3).
- ¿Qué pasa si un set de tesoros del Treasure Menu aún no tiene ningún tesoro obtenido? Se muestra con 0 de N, sin bonificación otorgada (US3 Escenario 3).
- ¿Puede el jugador interactuar de alguna forma con las bibliotecas más allá de consultarlas (equipar, gastar, activar)? No — son estrictamente de solo lectura; ninguna acción dentro de ellas modifica el progreso del jugador.
- ¿Qué pasa si el jugador abre una biblioteca, y mientras la tiene abierta, su progreso cambia por otra vía (por ejemplo, un proceso de fondo)? Fuera de alcance — el proyecto no tiene ningún mecanismo de actualización de progreso fuera de una batalla jugada activamente, por lo que este caso no puede ocurrir hoy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer tres pantallas de consulta de solo lectura, accesibles desde la Base del Jugador (`005-player-dashboard`): Cat Guide, Enemy Guide y Treasure Menu.
- **FR-002**: Cat Guide DEBE mostrar todas las unidades actualmente poseídas por el jugador (unidades base del capítulo más cualquier unidad bonus desbloqueada), cada una con sus estadísticas de combate.
- **FR-003**: Enemy Guide DEBE mostrar únicamente los enemigos que ya aparecieron en el carril durante al menos una batalla jugada por el jugador, cada uno con sus estadísticas de combate.
- **FR-004**: El sistema DEBE registrar un enemigo como "enfrentado" en el momento en que aparece en el carril durante una batalla, independientemente de si fue derrotado o de si esa batalla se ganó o perdió.
- **FR-005**: El registro de enemigos enfrentados DEBE persistir entre sesiones del juego.
- **FR-006**: Treasure Menu DEBE mostrar, para cada set de tesoros configurado, cuántos de sus tesoros ya fueron obtenidos por el jugador sobre el total del set, y si su bonificación pasiva ya fue otorgada.
- **FR-007**: Ninguna de las tres pantallas DEBE permitir ninguna acción que modifique el progreso del jugador (equipar, gastar, activar) — son estrictamente de solo lectura.
- **FR-008**: Las tres pantallas DEBEN reflejar el estado más reciente del progreso del jugador cada vez que se abren, sin requerir reiniciar el juego.
- **FR-009**: El jugador sin ninguna unidad bonus, ningún enemigo enfrentado, o ningún tesoro obtenido DEBE poder abrir cada una de las tres pantallas sin error, viéndolas vacías o con la información base únicamente.
- **FR-010**: Esta feature NO DEBE modificar ningún dato ya persistido por specs anteriores (`001`-`018`) — solo lo expone en modo lectura, salvo por el registro nuevo de enemigos enfrentados (FR-004/FR-005), que es un dato adicional, no una modificación de uno existente.

### Key Entities *(include if feature involves data)*

- **Entrada de Cat Guide**: una unidad poseída por el jugador junto con sus estadísticas de combate.
- **Entrada de Enemy Guide**: un enemigo ya enfrentado junto con sus estadísticas de combate.
- **Registro de Enemigos Enfrentados** (nuevo, persistente): conjunto de identificadores de enemigos que ya aparecieron en el carril en alguna batalla jugada.
- **Entrada de Treasure Menu**: un set de tesoros (existente, `014-chapter-scaling-treasure-sets`) junto con su progreso (tesoros obtenidos sobre el total) y si su bonificación pasiva ya fue otorgada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El jugador puede acceder a cualquiera de las tres bibliotecas desde la Base del Jugador en un solo paso de navegación.
- **SC-002**: Cat Guide muestra el 100% de las unidades actualmente poseídas por el jugador, con sus stats correctos, en cada apertura.
- **SC-003**: Enemy Guide muestra el 100% de los enemigos que llegaron a aparecer en al menos una batalla jugada, y ningún enemigo que nunca apareció.
- **SC-004**: Treasure Menu refleja el progreso correcto (obtenidos/total y estado de bonificación) de cada set inmediatamente después de que ese progreso cambie en batalla, sin necesidad de reiniciar el juego.
- **SC-005**: Ninguna interacción dentro de las tres bibliotecas modifica el inventario, el equipo activo, ni ningún otro dato de progreso del jugador, en el 100% de los casos de prueba.

## Assumptions

- Enemy Guide requiere un catálogo nuevo de solo lectura ("Enemy Catalog") que resuelve un identificador de enemigo a su `UnitDefinition` para poder mostrar sus stats — análogo a `UnitUnlockCatalog` pero para enemigos, poblado con los enemigos ya definidos en las oleadas existentes (`001`-`014`), sin crear enemigos nuevos.
- "Enfrentado" (FR-003/FR-004) se interpreta como "llegó a aparecer en el carril durante una batalla", no "fue derrotado" ni "estaba planeado en la oleada" — ver Edge Cases.
- El registro de enemigos enfrentados es un dato nuevo — no existía ningún mecanismo de seguimiento de encuentros antes de esta feature. Se persiste de forma aditiva, mismo patrón que `obtainedTreasureIds`/`unlockedBonusUnitIds` (`013`/`014`).
- Las tres bibliotecas son accesibles únicamente desde la Base del Jugador (`005-player-dashboard` ya existente) — esta feature no añade un punto de acceso nuevo fuera de esa pantalla.
- Estas bibliotecas no incluyen ninguna función de búsqueda, filtro u ordenamiento entre unidades/enemigos/tesoros — solo listan y muestran su información, siguiendo el alcance mínimo descrito en `docs/plan-tecnico-manual-completo.md` (Fase 18).
- Cat Guide muestra las estadísticas *efectivas actuales* de cada unidad (nivel y forma de evolución vigentes del jugador, `009-unit-evolution`/`005-player-dashboard`), no solo sus stats base — es la información más útil para decidir formación de equipo, y reutiliza datos ya calculados por el dashboard existente.
- Enemy Guide muestra las estadísticas *base* (sin escalar) de cada enemigo, definidas en su `UnitDefinition` — no las variantes escaladas por multiplicador de arco (`013-empire-of-cats-saga`) que pudo tener en la batalla concreta donde se enfrentó. Un enemigo reutilizado en varios capítulos con distinta dificultad se muestra de forma única y consistente, en vez de una entrada distinta por cada escalado con el que se lo haya enfrentado.

