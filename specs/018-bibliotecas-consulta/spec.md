# Feature Specification: Bibliotecas de Consulta (Guía de Gatos, Guía de Enemigos, Menú de Tesoros)

**Feature Branch**: `018-bibliotecas-consulta`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/019-library-screens` (proyecto Unity origen): tres pantallas de solo lectura accesibles desde la Base del Jugador (`UpgradeScreen`, `specs/006-dashboard-base-jugador`) — Guía de Gatos (unidades poseídas y sus stats), Guía de Enemigos (enemigos ya enfrentados en batalla) y Menú de Tesoros (progreso de sets, `specs/013-escalado-capitulos-sets-tesoros`). No modifica ningún sistema existente, solo lo expone.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar las unidades poseídas y sus estadísticas (Guía de Gatos) (Priority: P1)

Un jugador entra a la Guía de Gatos desde `UpgradeScreen` y ve todas las unidades que posee (`ownedCats`), cada una con sus estadísticas de combate efectivas (nivel y forma de evolución vigentes).

**Why this priority**: Biblioteca de mayor uso esperado — ayuda a decidir formación de equipo, reforzando `UpgradeScreen`/`TeamScreen` ya existentes.

**Independent Test**: Con al menos un gato en `ownedCats` con nivel/evolución distintos del base, entrar a la Guía de Gatos y confirmar que sus stats mostrados reflejan esos valores efectivos, no los base de `CATS`.

**Acceptance Scenarios**:

1. **Given** el jugador posee varias unidades, algunas evolucionadas o mejoradas de nivel, **When** entra a la Guía de Gatos, **Then** ve listadas todas esas unidades, cada una con sus stats efectivos (`specs/010-evolucion-de-gatos` aplicado).
2. **Given** el jugador solo posee el gato inicial garantizado, **When** entra a la Guía de Gatos, **Then** ve únicamente ese gato, sin error.

---

### User Story 2 - Consultar los enemigos ya enfrentados y sus estadísticas (Guía de Enemigos) (Priority: P1)

Un jugador entra a la Guía de Enemigos y ve los enemigos que ya aparecieron en el carril en alguna de sus batallas, cada uno con sus estadísticas base.

**Why this priority**: Mismo valor de consulta que la Guía de Gatos, para el lado enemigo; depende de que exista un registro de qué enemigos ya se han visto, dato nuevo de esta feature.

**Independent Test**: Jugar una batalla donde aparezca al menos un enemigo nuevo, volver a la Base, entrar a la Guía de Enemigos y confirmar que ese enemigo aparece listado.

**Acceptance Scenarios**:

1. **Given** un enemigo apareció en el carril durante alguna batalla ya jugada, **When** el jugador entra a la Guía de Enemigos, **Then** ese enemigo aparece listado con sus stats base (`CATS`, sin escalar por arco).
2. **Given** el jugador nunca ha jugado ninguna batalla, **When** entra a la Guía de Enemigos, **Then** la ve vacía, sin error.
3. **Given** un enemigo estaba en la oleada de un nivel pero la batalla terminó antes de que llegara a aparecer, **When** el jugador entra a la Guía de Enemigos, **Then** ese enemigo no aparece listado.

---

### User Story 3 - Consultar el progreso de tesoros por set (Menú de Tesoros) (Priority: P2)

Un jugador entra al Menú de Tesoros y ve, para cada `TreasureSet` configurado, cuántos de sus tesoros ya obtuvo sobre el total, y si su bonificación pasiva ya fue otorgada.

**Why this priority**: Depende de contenido ya construido en `specs/013-escalado-capitulos-sets-tesoros`; menor prioridad que las dos anteriores porque expone progreso que el jugador ya puede inferir jugando.

**Independent Test**: Completar un nivel que otorga un tesoro de un set configurado, entrar al Menú de Tesoros y confirmar que ese set refleja el nuevo progreso.

**Acceptance Scenarios**:

1. **Given** el jugador ya obtuvo algunos, pero no todos, los tesoros de un set, **When** entra al Menú de Tesoros, **Then** ve ese set con el conteo correcto de tesoros obtenidos sobre el total.
2. **Given** el jugador completó todos los tesoros de un set y ya recibió su bonificación, **When** entra al Menú de Tesoros, **Then** ese set se muestra completo, con la bonificación marcada como otorgada.
3. **Given** el jugador no ha obtenido ningún tesoro de un set, **When** entra al Menú de Tesoros, **Then** ese set se muestra con 0 sobre el total, sin error.

---

### Edge Cases

- Jugador sin ninguna unidad más allá del gato inicial: Guía de Gatos muestra solo esa unidad (US1 Escenario 2).
- Jugador sin ninguna batalla jugada: Guía de Enemigos vacía, sin error (US2 Escenario 2).
- Enemigo planeado en una oleada pero nunca aparecido en el carril: no se registra como enfrentado — "enfrentado" significa que llegó a aparecer, no que estaba planeado (US2 Escenario 3).
- Set de tesoros sin ningún tesoro obtenido todavía: se muestra 0 de N, sin bonificación otorgada (US3 Escenario 3).
- Ninguna de las tres bibliotecas permite ninguna acción que modifique progreso (equipar, gastar, activar) — son estrictamente de solo lectura.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer tres pantallas de consulta de solo lectura, accesibles desde `UpgradeScreen` (`specs/006-dashboard-base-jugador`): Guía de Gatos, Guía de Enemigos, Menú de Tesoros.
- **FR-002**: La Guía de Gatos DEBE mostrar todas las unidades en `ownedCats`, cada una con sus stats *efectivos* (nivel y `evolutionStage` vigentes, `specs/006`/`specs/010`).
- **FR-003**: La Guía de Enemigos DEBE mostrar únicamente los enemigos (`catId` de `BattleUnit.team === 'Enemy'`) que ya aparecieron en el carril durante al menos una batalla jugada, cada uno con sus stats *base* de `CATS` (sin escalar por `SagaArc`, `specs/012`).
- **FR-004**: El sistema DEBE registrar un enemigo como "enfrentado" en el momento en que aparece en `units` durante una batalla, independientemente de si fue derrotado o de si esa batalla se ganó o perdió.
- **FR-005**: El registro de enemigos enfrentados DEBE persistir entre sesiones.
- **FR-006**: El Menú de Tesoros DEBE mostrar, para cada `TreasureSet` (`specs/013`), cuántos de sus `treasureIds` ya están en `obtainedTreasureIds` sobre el total, y si está en `grantedTreasureSetIds`.
- **FR-007**: Ninguna de las tres pantallas DEBE permitir ninguna acción que modifique progreso del jugador — estrictamente de solo lectura.
- **FR-008**: Las tres pantallas DEBEN reflejar el estado más reciente del progreso cada vez que se abren, sin requerir reiniciar la aplicación.
- **FR-009**: Un jugador sin unidades bonus, sin enemigos enfrentados, o sin tesoros obtenidos DEBE poder abrir cada una de las tres pantallas sin error.
- **FR-010**: Esta feature NO DEBE modificar ningún dato ya persistido por specs anteriores — solo lo expone en modo lectura, salvo por el registro nuevo de enemigos enfrentados (FR-004/FR-005), que es un dato adicional, no una modificación de uno existente.

### Key Entities *(include if feature involves data)*

- **Entrada de Guía de Gatos**: una unidad de `ownedCats` junto a sus stats de combate efectivos.
- **Entrada de Guía de Enemigos**: un `catId` ya enfrentado junto a sus stats base de `CATS`.
- **`encounteredEnemyCatIds`** (nuevo, persistido en `useMetaStore`): conjunto de `catId` que ya aparecieron como enemigo en el carril en alguna batalla jugada.
- **Entrada de Menú de Tesoros**: un `TreasureSet` (`specs/013`) junto a su progreso (`obtainedTreasureIds` ∩ `treasureIds` sobre el total) y si está en `grantedTreasureSetIds`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El jugador accede a cualquiera de las tres bibliotecas desde `UpgradeScreen` en un solo paso de navegación.
- **SC-002**: La Guía de Gatos muestra el 100% de las unidades poseídas, con sus stats efectivos correctos, en cada apertura.
- **SC-003**: La Guía de Enemigos muestra el 100% de los enemigos que llegaron a aparecer en al menos una batalla jugada, y ningún enemigo que nunca apareció.
- **SC-004**: El Menú de Tesoros refleja el progreso correcto de cada set inmediatamente después de que cambie en batalla, sin reiniciar la aplicación.
- **SC-005**: Ninguna interacción dentro de las tres bibliotecas modifica el inventario, el equipo activo, ni ningún otro dato de progreso, en el 100% de los casos de prueba.
- **SC-006**: `npx tsc -b` limpio y `npm test` en verde.

## Assumptions

- La Guía de Enemigos requiere un catálogo de solo lectura que resuelve un `catId` a su `Cat` para mostrar sus stats — reutiliza `CATS` directamente (`src/data/cats.ts`), sin crear enemigos nuevos ni un catálogo separado.
- "Enfrentado" (FR-003/FR-004) se interpreta como "llegó a aparecer en el carril durante una batalla", no "fue derrotado" ni "estaba planeado en la oleada" — ver Edge Cases.
- El registro de enemigos enfrentados es un dato nuevo — no existía ningún mecanismo de seguimiento de encuentros antes de esta feature; se persiste de forma aditiva, mismo patrón que `obtainedTreasureIds`/`grantedArcRewardIds` (`specs/012`).
- Las tres bibliotecas son accesibles únicamente desde `UpgradeScreen` — esta feature no añade un punto de acceso fuera de esa pantalla.
- Estas bibliotecas no incluyen ninguna función de búsqueda, filtro u ordenamiento — solo listan y muestran información.
- La Guía de Gatos muestra estadísticas *efectivas actuales* (nivel/evolución vigentes) porque es la información más útil para decidir formación de equipo, reutilizando cálculos ya existentes de `specs/006`/`specs/010`. La Guía de Enemigos muestra estadísticas *base* (sin escalar por `SagaArc`) porque un enemigo reutilizado en varios arcos con distinta dificultad debe mostrarse de forma única y consistente, no una entrada distinta por cada escalado con el que se lo haya enfrentado.
