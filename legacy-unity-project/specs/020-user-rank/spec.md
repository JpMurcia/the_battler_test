# Feature Specification: Sistema de Rango de Usuario

**Feature Branch**: `020-user-rank`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "Sistema de Rango de Usuario de \"The Battler\": un contador de progreso de cuenta calculado como la suma de los niveles de todas las unidades que el jugador posee (PlayerProgressSaveData.unitProgress[].level, ya persistido desde 005-player-dashboard — no requiere campo de guardado nuevo, es un valor derivado), visible en la Base del Jugador, con recompensas reclamables (objetos de batalla, no moneda premium) al superar umbrales configurables. Sigue https://battlecats.miraheze.org/wiki/User_Rank, adaptado sin depender de gacha ni moneda premium (Principio VI)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el Rango de Usuario actual (Priority: P1)

Un jugador entra a la Base del Jugador y ve su Rango de Usuario actual, junto con la lista de umbrales configurados y cuáles ya alcanzó.

**Why this priority**: Es el punto de entrada de todo el sistema — sin visibilidad del rango actual y de los umbrales, el jugador no puede saber qué recompensas tiene disponibles para reclamar.

**Independent Test**: Entrar a la Base del Jugador y confirmar que el Rango de Usuario mostrado coincide con la suma de los niveles de todas las unidades poseídas.

**Acceptance Scenarios**:

1. **Given** el jugador posee varias unidades con distintos niveles, **When** entra a la Base del Jugador, **Then** ve su Rango de Usuario igual a la suma de los niveles de todas esas unidades.
2. **Given** el jugador es nuevo y ninguna de sus unidades ha subido de nivel, **When** entra a la Base del Jugador, **Then** ve su Rango de Usuario correspondiente al nivel base de sus unidades iniciales, sin error.

---

### User Story 2 - Reclamar la recompensa de un umbral alcanzado (Priority: P1)

Un jugador cuyo Rango de Usuario alcanza o supera un umbral configurado reclama manualmente la recompensa de objetos de batalla asociada a ese umbral.

**Why this priority**: Es el valor central del sistema — sin la posibilidad de reclamar, el Rango de Usuario sería solo un número decorativo sin ninguna recompensa real asociada.

**Independent Test**: Con el Rango de Usuario ya por encima de un umbral configurado y sin reclamar, reclamarlo y confirmar que la recompensa de objetos de batalla se añade al inventario del jugador.

**Acceptance Scenarios**:

1. **Given** el Rango de Usuario del jugador alcanza o supera un umbral configurado que aún no reclamó, **When** lo reclama, **Then** recibe la recompensa de objetos de batalla configurada para ese umbral en su inventario.
2. **Given** el jugador ya reclamó la recompensa de un umbral, **When** intenta reclamarlo de nuevo, **Then** el sistema no lo permite ni otorga una recompensa adicional.
3. **Given** el Rango de Usuario del jugador todavía no alcanza un umbral configurado, **When** intenta reclamarlo, **Then** el sistema no lo permite.
4. **Given** el jugador alcanzó varios umbrales a la vez sin reclamar ninguno (por ejemplo, tras mejorar varias unidades de golpe), **When** reclama cada uno, **Then** puede hacerlo en cualquier orden, cada uno exactamente una vez.

---

### Edge Cases

- ¿Qué pasa si el Rango de Usuario del jugador bajara en el futuro (por ejemplo, alguna mecánica redujera el nivel de una unidad)? Un umbral ya reclamado permanece reclamado — la recompensa ya otorgada nunca se revoca (mismo criterio monótono que `grantedTreasureSetIds` en `014-chapter-scaling-treasure-sets`).
- ¿Qué pasa con un jugador sin ningún umbral alcanzado todavía? Ve su Rango de Usuario y la lista de umbrales pendientes, sin ninguna recompensa reclamable y sin error.
- ¿Puede el jugador reclamar un umbral menor sin haber reclamado antes uno mayor ya alcanzado? Sí — cada umbral se reclama de forma independiente, no existe un orden obligatorio (Acceptance Scenario 4).
- ¿Qué pasa si dos umbrales configurados otorgan el mismo objeto de batalla como recompensa? Cada reclamo se procesa de forma independiente — el inventario del jugador simplemente acumula ambas cantidades, sin ninguna regla especial de combinación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE calcular el Rango de Usuario del jugador como la suma de los niveles de todas las unidades que posee, reutilizando exactamente el mismo cálculo ya usado para el "nivel de personaje" del dashboard de `005-player-dashboard` — sin introducir un segundo cálculo ni un campo de guardado nuevo para el valor del contador en sí.
- **FR-002**: El Rango de Usuario DEBE ser visible para el jugador desde la Base del Jugador.
- **FR-003**: El sistema DEBE declarar una lista configurable de umbrales de Rango de Usuario, cada uno con una recompensa de objetos de batalla asociada (`018-battle-items`) y su cantidad.
- **FR-004**: El jugador DEBE poder reclamar manualmente la recompensa de un umbral una vez que su Rango de Usuario actual lo alcanza o supera.
- **FR-005**: El sistema NO DEBE permitir reclamar la recompensa de un umbral que el jugador aún no ha alcanzado.
- **FR-006**: El sistema NO DEBE permitir reclamar la recompensa de un umbral ya reclamado anteriormente.
- **FR-007**: El estado de qué umbrales ya fueron reclamados DEBE persistir entre sesiones del juego, de forma monótona — un umbral reclamado nunca vuelve a quedar disponible, incluso si el Rango de Usuario bajara.
- **FR-008**: El jugador DEBE poder reclamar los umbrales alcanzados en cualquier orden, sin necesidad de reclamar primero los de umbral menor.
- **FR-009**: Reclamar la recompensa de un umbral DEBE otorgar objetos de batalla al inventario del jugador (`018-battle-items`) — esta feature NO DEBE otorgar moneda premium ni acceso a ningún sistema de gacha (Principio VI).
- **FR-010**: Un jugador sin ningún umbral alcanzado todavía DEBE poder ver su Rango de Usuario y la lista de umbrales pendientes sin error, sin ninguna recompensa reclamable.

### Key Entities *(include if feature involves data)*

- **Rango de Usuario**: valor derivado, idéntico al "nivel de personaje" ya calculado por `005-player-dashboard` (suma de niveles de todas las unidades poseídas) — no es un dato nuevo a persistir.
- **Umbral de Rango de Usuario** (nuevo, configurable): un rango requerido, junto con la recompensa de objetos de batalla (tipo y cantidad) otorgada al reclamarlo.
- **Registro de Umbrales Reclamados** (nuevo, persistente): conjunto de umbrales ya reclamados por el jugador, monótono — nunca se revoca una entrada ya presente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El jugador puede ver su Rango de Usuario actual desde la Base del Jugador sin ningún paso de navegación adicional más allá de entrar a esa pantalla.
- **SC-002**: Un umbral alcanzado y no reclamado aparece como reclamable en el 100% de los casos de prueba.
- **SC-003**: Reclamar un umbral otorga exactamente la recompensa configurada al inventario del jugador, y ese umbral nunca vuelve a aparecer como reclamable, en el 100% de los casos de prueba.
- **SC-004**: El sistema rechaza el 100% de los intentos de reclamar un umbral no alcanzado o ya reclamado, sin otorgar ninguna recompensa en esos intentos.
- **SC-005**: Un jugador sin ningún umbral alcanzado ve la pantalla de Rango de Usuario sin error, con cero recompensas reclamables.

## Assumptions

- "Rango de Usuario" reutiliza exactamente el mismo valor ya calculado como "nivel de personaje" en `005-player-dashboard` (`PlayerCharacterLevelCalculator.Calculate`, suma de niveles de unidades poseídas, confirmado contra el código: [`PlayerCharacterLevelCalculator.cs`](../../Assets/Scripts/Gameplay/Battler/PlayerCharacterLevelCalculator.cs)) — no introduce un segundo contador ni un campo de guardado nuevo para el valor en sí. El trabajo nuevo de esta feature es la capa de umbrales/recompensas reclamables sobre ese valor ya existente, y la presentación de ese valor con el encuadre de "Rango de Usuario" (posiblemente junto a la vista de "nivel de personaje" ya existente, decidido en `/speckit.plan`).
- Los umbrales y sus recompensas se definen en un catálogo de datos editable sin recompilar (Principio V) — el número y valor exacto de umbrales queda para `/speckit.plan`/autoría de contenido, no restringe el alcance funcional de esta spec.
- Las recompensas de umbral son siempre objetos de batalla (`018-battle-items`) — esta feature depende de que esa spec ya esté implementada; no introduce ningún tipo de recompensa nuevo.
- Reclamar una recompensa es una acción explícita del jugador (no automática al cruzar el umbral) — sigue la referencia de `https://battlecats.miraheze.org/wiki/User_Rank`, donde las recompensas de rango se reclaman manualmente desde una pantalla dedicada, en vez de otorgarse en el momento exacto en que se cruza el umbral (que podría no coincidir con ninguna sesión de juego activa, a diferencia de las recompensas de nivel que sí se otorgan en el momento de ganar una batalla).
