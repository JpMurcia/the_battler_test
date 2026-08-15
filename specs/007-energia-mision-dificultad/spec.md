# Feature Specification: Energía de Misión y Dificultad Progresiva

**Feature Branch**: `007-energia-mision-dificultad`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/006-mission-energy-system` (proyecto Unity origen): cada nivel del mapa consume una energía de misión separada de la energía de batalla; la energía máxima y/o su tasa de recuperación aumentan con el nivel de personaje (`specs/006-dashboard-base-jugador`); los niveles se agrupan por región con dificultad progresiva dentro de cada una; sin energía suficiente, la entrada se bloquea sin penalización.

**Nota de adaptación**: battle-cats-web ya tiene un recurso llamado "energía" (`useGameStore.energy`), pero es exclusivamente el recurso de despliegue **dentro** de una batalla (Constitución § I) — efímero, nunca persistido. Esta feature introduce un recurso **distinto y persistido**, `missionEnergy`, a nivel de mapa de niveles, que limita cuántos niveles se pueden *iniciar*. Ambos comparten nombre por el docx base de referencia pero son conceptos separados, igual que ya lo distinguía la spec origen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consumir energía de misión al entrar a un nivel (Priority: P1)

Un jugador con energía de misión suficiente selecciona un nivel y entra a él, viendo cómo su energía de misión se reduce según el costo de ese nivel.

**Why this priority**: Es el comportamiento central — sin esto, `missionEnergy` no limita nada.

**Independent Test**: Con `missionEnergy.current >= level.energyCost`, seleccionar el nivel desde `LevelSelectScreen` (`specs/005-mapa-de-niveles`) y confirmar que `missionEnergy.current` se reduce exactamente en `level.energyCost` antes de navegar a `Battle`.

**Acceptance Scenarios**:

1. **Given** el jugador tiene energía de misión igual o mayor al costo del nivel, **When** lo selecciona, **Then** entra a la batalla y su energía de misión se reduce en el costo correspondiente.
2. **Given** el jugador acaba de entrar gastando energía de misión, **When** vuelve al mapa de niveles, **Then** el valor mostrado refleja el descuento.

---

### User Story 2 - Bloqueo sin penalización sin energía suficiente (Priority: P1)

Un jugador sin energía de misión suficiente intenta entrar a un nivel y el sistema se lo impide, sin descontar energía ni aplicar penalización.

**Why this priority**: Borde crítico del sistema — debe quedar resuelto para que la Historia 1 tenga sentido completo.

**Independent Test**: Con `missionEnergy.current < level.energyCost`, intentar entrar y confirmar que el sistema bloquea, no descuenta energía, y no navega a `Battle`.

**Acceptance Scenarios**:

1. **Given** el jugador tiene menos energía de misión que el costo del nivel, **When** intenta entrar, **Then** el sistema bloquea la entrada (botón deshabilitado o sin efecto) y no descuenta energía.
2. **Given** el intento fue bloqueado, **When** el jugador revisa su estado, **Then** no hay ninguna penalización adicional más allá de no poder entrar.

---

### User Story 3 - Recuperación con el tiempo y escalado por nivel de personaje (Priority: P2)

Un jugador ve que su energía de misión se recupera automáticamente con el tiempo (incluso con la app cerrada), y que su máximo y/o tasa de recuperación aumentan con su nivel de personaje.

**Why this priority**: Da profundidad de progresión conectando con `specs/006-dashboard-base-jugador`; el sistema ya funciona sin esto (Historias 1-2), pero sería un recurso estático.

**Independent Test**: Dejar pasar tiempo (o simular `Date.now()` avanzado en test) sin gastar energía y confirmar que se recupera hasta el máximo actual; subir el nivel de personaje y confirmar que el máximo y/o la tasa de recuperación aumentan.

**Acceptance Scenarios**:

1. **Given** la energía de misión está por debajo del máximo, **When** pasa tiempo sin gastarla, **Then** aumenta progresivamente hasta el máximo actual, sin superarlo.
2. **Given** el nivel de personaje (`specs/006-dashboard-base-jugador`) aumenta, **When** el jugador consulta su energía de misión, **Then** el máximo y/o la tasa de recuperación reflejan el incremento.
3. **Given** el jugador cierra la app con energía de misión por debajo del máximo, **When** la reabre después de un tiempo, **Then** la recuperación se calcula correctamente a partir de la marca de tiempo persistida (`lastUpdated`), sin superar el máximo.

---

### User Story 4 - Dificultad progresiva dentro de una región (Priority: P3)

Un jugador que avanza por niveles de una misma región nota que la dificultad de cada nivel siguiente es igual o mayor a la anterior dentro de esa región.

**Why this priority**: Da sentido de desafío creciente; con un único nivel jugable hoy no tiene efecto observable, pero deja la estructura lista para `specs/011-nivel-2-hacia-el-futuro` y niveles posteriores.

**Independent Test**: Con 2+ niveles definidos en la misma región, confirmar que `Level.difficulty` es no decreciente en el orden en que aparecen en `LEVELS`.

**Acceptance Scenarios**:

1. **Given** una región con varios niveles ordenados, **When** se comparan en orden, **Then** cada nivel siguiente de esa región tiene `difficulty` igual o mayor a la anterior.
2. **Given** el jugador entra a una región distinta, **When** compara su dificultad inicial contra la región anterior, **Then** no hay dependencia entre regiones — cada una define su propia progresión.

---

### Edge Cases

- ¿Qué pasa si el nivel de personaje sube en medio de una sesión? El nuevo máximo/tasa se aplica de inmediato; la energía actual no se reduce por el cambio, no se otorga energía extra retroactiva.
- ¿Qué pasa si `missionEnergy` guardada está corrupta o ilegible? Se trata como ausencia de progreso (energía al máximo por defecto), sin bloquear el mapa de niveles.
- ¿Qué pasa con una región con un solo nivel (como hoy, con solo `level-1`)? El escalado de dificultad no tiene efecto observable todavía; no bloquea el resto del sistema.
- ¿Qué pasa si el jugador cierra la app varios días? La recuperación se calcula con el tiempo transcurrido real, topada al máximo — nunca negativa ni "acumulada" más allá del máximo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mantener `missionEnergy: { current, max, lastUpdatedAt }`, distinto de `useGameStore.energy` (energía de batalla).
- **FR-002**: Cada `Level` DEBE declarar un `energyCost: number`.
- **FR-003**: Al entrar a un nivel con energía de misión suficiente, el sistema DEBE descontar `energyCost` de `missionEnergy.current` antes de navegar a `Battle`.
- **FR-004**: El sistema NO DEBE permitir entrar a un nivel cuyo `energyCost` sea mayor a `missionEnergy.current`; `LevelSelectScreen` DEBE reflejar esto deshabilitando la acción.
- **FR-005**: Un intento bloqueado por falta de energía de misión NO DEBE descontar energía ni aplicar ninguna otra penalización.
- **FR-006**: `missionEnergy.current` DEBE recuperarse automáticamente con el tiempo transcurrido real (`Date.now() - lastUpdatedAt`) hasta `missionEnergy.max`, sin superarlo, calculado cada vez que se lee/hidrata.
- **FR-007**: `missionEnergy.max` y/o su tasa de recuperación por segundo DEBEN derivarse del nivel de personaje agregado (`specs/006-dashboard-base-jugador`), mediante una función pura y determinista.
- **FR-008**: Cada `Level` DEBE declarar una `region: string` y una `difficulty: number`; dentro de la misma `region`, el orden de aparición en `LEVELS` DEBE tener `difficulty` no decreciente.
- **FR-009**: El sistema DEBE persistir `missionEnergy` localmente (Dexie), incluyendo `lastUpdatedAt`, de forma que la recuperación por tiempo transcurrido sea correcta tras cerrar y reabrir la app.
- **FR-010**: El sistema DEBE tratar `missionEnergy` corrupta/ilegible como ausencia de progreso (energía al máximo por defecto), sin bloquear el mapa de niveles.

### Key Entities

- **`MissionEnergyPool`** (nuevo, persistido): `{ current: number; max: number; lastUpdatedAt: number }` — fila singleton en Dexie, distinta de `useGameStore.energy`.
- **`Level`** (existente, `src/data/levels.ts`, extendido): + `energyCost: number`, `region: string`, `difficulty: number`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Entrar a un nivel con energía de misión suficiente descuenta el costo correcto el 100% de las veces.
- **SC-002**: Un intento sin energía suficiente es bloqueado el 100% de las veces, sin descuento ni penalización.
- **SC-003**: La energía de misión recuperada tras un período (incluso con la app cerrada) coincide con la tasa vigente dentro de un margen despreciable, sin superar nunca el máximo.
- **SC-004**: Un aumento del nivel de personaje se refleja en `missionEnergy.max`/tasa la próxima vez que se consulta, el 100% de las veces.
- **SC-005**: Dentro de una misma región, cada nivel tiene `difficulty` igual o mayor al anterior el 100% de las veces (verificable como test sobre los datos de `LEVELS`).

## Assumptions

- El costo de energía de misión se descuenta al **entrar** al nivel (intentarlo), no según el resultado (victoria/derrota) — mismo criterio que el origen.
- La fórmula exacta de `max`/tasa de recuperación en función del nivel de personaje es una función pura simple (p. ej. lineal por tramos) definida en `plan.md`/implementación, sin cambiar el alcance de esta spec.
- Con el contenido actual (un solo nivel, `level-1`), solo existe una región con un nivel — el resto de la estructura de regiones/dificultad queda lista para `specs/011-nivel-2-hacia-el-futuro` sin requerir rediseño.
- Esta feature depende de `specs/006-dashboard-base-jugador` (nivel de personaje) y de `specs/005-mapa-de-niveles` (pantalla donde se consume/bloquea la energía de misión).
