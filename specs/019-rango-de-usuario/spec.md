# Feature Specification: Sistema de Rango de Usuario

**Feature Branch**: `019-rango-de-usuario`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/020-user-rank` (proyecto Unity origen): un contador de progreso de cuenta calculado como la suma de los niveles de todas las unidades poseídas (ya derivable de `ownedCats`, sin campo de guardado nuevo para el valor en sí), visible en la Base del Jugador, con recompensas reclamables (objetos de batalla, `specs/017-objetos-de-batalla`) al superar umbrales configurables.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el Rango de Usuario actual (Priority: P1)

Un jugador entra a `UpgradeScreen` y ve su Rango de Usuario actual, junto con la lista de umbrales configurados y cuáles ya alcanzó.

**Why this priority**: Punto de entrada de todo el sistema — sin visibilidad del rango y los umbrales, el jugador no puede saber qué recompensas tiene disponibles.

**Independent Test**: Entrar a `UpgradeScreen` y confirmar que el Rango de Usuario mostrado coincide con la suma de niveles de todas las unidades poseídas.

**Acceptance Scenarios**:

1. **Given** el jugador posee varias unidades con distintos niveles, **When** entra a `UpgradeScreen`, **Then** ve su Rango de Usuario igual a la suma de los niveles de esas unidades (mismo cálculo que "Nivel de personaje" ya mostrado hoy).
2. **Given** el jugador es nuevo y solo tiene el gato inicial en nivel 1, **When** entra a `UpgradeScreen`, **Then** ve su Rango de Usuario correspondiente, sin error.

---

### User Story 2 - Reclamar la recompensa de un umbral alcanzado (Priority: P1)

Un jugador cuyo Rango de Usuario alcanza o supera un umbral configurado reclama manualmente la recompensa de objetos de batalla asociada.

**Why this priority**: Valor central del sistema — sin poder reclamar, el Rango de Usuario sería solo un número decorativo.

**Independent Test**: Con el Rango de Usuario ya por encima de un umbral sin reclamar, reclamarlo y confirmar que la recompensa se añade a `battleItemInventory`.

**Acceptance Scenarios**:

1. **Given** el Rango de Usuario del jugador alcanza o supera un umbral no reclamado, **When** lo reclama, **Then** recibe la recompensa de objetos de batalla configurada para ese umbral.
2. **Given** el jugador ya reclamó la recompensa de un umbral, **When** intenta reclamarlo de nuevo, **Then** el sistema no lo permite ni otorga una recompensa adicional.
3. **Given** el Rango de Usuario todavía no alcanza un umbral, **When** intenta reclamarlo, **Then** el sistema no lo permite.
4. **Given** el jugador alcanzó varios umbrales a la vez sin reclamar ninguno (ej. tras varias mejoras seguidas), **When** reclama cada uno, **Then** puede hacerlo en cualquier orden, cada uno exactamente una vez.

---

### Edge Cases

- El Rango de Usuario del jugador no puede bajar hoy (`upgradeCat` solo sube niveles, nunca los reduce) — un umbral ya reclamado de todos modos permanece reclamado de forma monótona, por si una spec futura introdujera alguna forma de reducción.
- Jugador sin ningún umbral alcanzado todavía: ve su Rango de Usuario y la lista de umbrales pendientes, sin ninguna recompensa reclamable y sin error.
- El jugador puede reclamar un umbral menor sin haber reclamado antes uno mayor ya alcanzado — cada umbral se reclama de forma independiente.
- Dos umbrales configurados otorgan el mismo objeto de batalla: cada reclamo se procesa de forma independiente, el inventario acumula ambas cantidades sin regla especial de combinación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE calcular el Rango de Usuario como la suma de los niveles de todas las unidades en `ownedCats`, reutilizando exactamente el mismo cálculo ya usado como "Nivel de personaje" en `UpgradeScreen` (`characterLevelOf`, `specs/006-dashboard-base-jugador`) — sin introducir un segundo cálculo ni un campo de guardado nuevo para el valor en sí.
- **FR-002**: El Rango de Usuario DEBE ser visible desde `UpgradeScreen`.
- **FR-003**: El sistema DEBE declarar una lista configurable de umbrales de Rango de Usuario, cada uno con una recompensa de objetos de batalla (`specs/017-objetos-de-batalla`) y su cantidad.
- **FR-004**: El jugador DEBE poder reclamar manualmente la recompensa de un umbral una vez que su Rango de Usuario actual lo alcanza o supera.
- **FR-005**: El sistema NO DEBE permitir reclamar la recompensa de un umbral que el jugador aún no ha alcanzado.
- **FR-006**: El sistema NO DEBE permitir reclamar la recompensa de un umbral ya reclamado anteriormente.
- **FR-007**: El estado de qué umbrales ya fueron reclamados DEBE persistir entre sesiones, de forma monótona — un umbral reclamado nunca vuelve a quedar disponible.
- **FR-008**: El jugador DEBE poder reclamar los umbrales alcanzados en cualquier orden, sin necesidad de reclamar primero los de umbral menor.
- **FR-009**: Reclamar la recompensa de un umbral DEBE otorgar objetos de batalla al `battleItemInventory` del jugador (`specs/017`) — esta feature NO DEBE otorgar moneda premium ni acceso a ningún sistema de gacha (Constitución § VII).
- **FR-010**: Un jugador sin ningún umbral alcanzado todavía DEBE poder ver su Rango de Usuario y la lista de umbrales pendientes sin error, sin ninguna recompensa reclamable.

### Key Entities *(include if feature involves data)*

- **Rango de Usuario**: valor derivado, idéntico al "Nivel de personaje" ya calculado por `specs/006-dashboard-base-jugador` (`characterLevelOf(ownedCats)`) — no es un dato nuevo a persistir.
- **`UserRankThreshold`** (nuevo, `src/data/userRankThresholds.ts`): `{ rank: number; reward: { itemId: string; count: number } }`.
- **`claimedRankThresholds`** (nuevo, persistido en `useMetaStore`): conjunto de umbrales ya reclamados, monótono.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El jugador ve su Rango de Usuario actual desde `UpgradeScreen` sin ningún paso de navegación adicional.
- **SC-002**: Un umbral alcanzado y no reclamado aparece como reclamable en el 100% de los casos de prueba.
- **SC-003**: Reclamar un umbral otorga exactamente la recompensa configurada, y ese umbral nunca vuelve a aparecer como reclamable, en el 100% de los casos de prueba.
- **SC-004**: El sistema rechaza el 100% de los intentos de reclamar un umbral no alcanzado o ya reclamado, sin otorgar ninguna recompensa en esos intentos.
- **SC-005**: Un jugador sin ningún umbral alcanzado ve la pantalla sin error, con cero recompensas reclamables.
- **SC-006**: `npx tsc -b` limpio y `npm test` en verde.

## Assumptions

- "Rango de Usuario" reutiliza exactamente el mismo valor ya calculado como "Nivel de personaje" en `useMetaStore.ts` (`characterLevelOf`, suma de niveles de unidades poseídas) — no introduce un segundo contador ni un campo de guardado nuevo para el valor en sí. El trabajo nuevo es la capa de umbrales/recompensas reclamables sobre ese valor ya existente.
- Los umbrales y sus recompensas se definen en un catálogo de datos editable sin recompilar (Constitución § IV) — el número y valor exacto de umbrales es autoría de contenido, no restringe el alcance funcional.
- Las recompensas de umbral son siempre objetos de batalla (`specs/017-objetos-de-batalla`) — esta feature depende de que esa spec ya esté implementada; no introduce ningún tipo de recompensa nuevo.
- Reclamar una recompensa es una acción explícita del jugador (no automática al cruzar el umbral) desde una pantalla dedicada, en vez de otorgarse en el momento exacto en que se cruza el umbral (que podría no coincidir con ninguna sesión de juego activa, a diferencia de las recompensas de nivel que sí se otorgan al ganar una batalla).
- Esta feature vive como una sección más de `UpgradeScreen` (o una pantalla propia enlazada desde ahí, decidido en implementación) — no requiere una pantalla completamente nueva más allá de lo ya cubierto por `specs/018-bibliotecas-consulta`.
