# Tasks: Energía de Misión y Dificultad Progresiva

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: funciones puras de `data/missionEnergy.ts` con Vitest (sin DOM, `nowMs` inyectado); `useMetaStore` extendido con `fake-indexeddb`; `Level.difficulty` no decreciente por región como test de datos.

**Organización**: sin fase de Setup.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: esquema de datos (`Level` extendido) y funciones puras de energía de misión — bloquean todas las historias.

- [X] T001 [P] `src/data/levels.ts`: añade `energyCost`, `region`, `difficulty` a `Level` y a `LEVELS[0]` (`level-1`) con valores iniciales razonables (p. ej. `energyCost: 20`, `region: 'imperio-de-los-gatos'`, `difficulty: 1`).
- [X] T002 [P] `src/data/missionEnergy.ts`: `computeMissionEnergyMax(characterLevel)`, `computeRegenPerSecond(characterLevel)` (lineal simple), `computeRecoveredEnergy(current, max, lastUpdatedAt, nowMs)` — funciones puras (data-model.md § MissionEnergyPool).
- [X] T003 `src/db/index.ts`: `db.version(3).stores({ ...v2Stores, missionEnergy: 'id' })`; interfaz `MissionEnergyRow { id: 1; current: number; max: number; lastUpdatedAt: number }`; `ensureDefaultProfile` siembra la fila si no existe (`current = max` inicial) (depende de T002 para el valor inicial de `max`).
- [X] T004 [P] Test Vitest `tests/unit/data/missionEnergy.test.ts`: recuperación no supera el máximo, es proporcional al tiempo transcurrido, y `computeMissionEnergyMax`/`computeRegenPerSecond` aumentan con `characterLevel` (depende de T002).
- [X] T005 [P] Test Vitest `tests/unit/data/levels.test.ts`: dentro de cada `region` de `LEVELS`, `difficulty` es no decreciente en el orden del array (depende de T001).

**Checkpoint**: datos y funciones puras completos y testeados; ninguna pantalla los usa todavía.

---

## Phase 2: User Story 1 - Consumir energía al entrar a un nivel (Priority: P1) 🎯 MVP

**Goal**: `useMetaStore.spendMissionEnergy(levelId)` descuenta el costo antes de iniciar batalla.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T006 [US1] `src/state/useMetaStore.ts`: añade `missionEnergy: { current, max }` al estado, hidratado desde `db.missionEnergy` aplicando `computeRecoveredEnergy` con `Date.now()` en `hydrate()` (depende de T002, T003).
- [X] T007 [US1] `src/state/useMetaStore.ts`: `spendMissionEnergy(levelId): boolean` — busca el `Level`, si `missionEnergy.current >= level.energyCost` descuenta, persiste (`current` + `lastUpdatedAt = Date.now()`) y devuelve `true`; si no, devuelve `false` sin mutar nada (depende de T006, T001).
- [X] T008 [US1] `src/screens/LevelSelectScreen.tsx`: `handlePlay` llama primero `spendMissionEnergy(levelId)`; solo si devuelve `true` continúa con `startLevel`/`onNavigate('Battle')` (depende de T007).
- [X] T009 [US1] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): `spendMissionEnergy` con energía suficiente descuenta el costo exacto (depende de T007).

**Checkpoint**: entrar a un nivel descuenta energía de misión correctamente.

---

## Phase 3: User Story 2 - Bloqueo sin penalización sin energía suficiente (Priority: P1)

**Goal**: `LevelSelectScreen` impide la entrada y `spendMissionEnergy` no muta nada si falta energía.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T010 [US2] `src/screens/LevelSelectScreen.tsx`: deshabilita "Jugar" (además del chequeo de `getLevelState` de `specs/005-mapa-de-niveles`) cuando `missionEnergy.current < level.energyCost` (depende de T008).
- [X] T011 [US2] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): `spendMissionEnergy` sin energía suficiente devuelve `false` y no cambia `missionEnergy.current` (depende de T007).
- [X] T012 [US2] Test Testing Library `tests/unit/LevelSelectScreen.test.tsx` (extiende de `specs/005-mapa-de-niveles`): click con energía de misión insuficiente no navega a `Battle` (depende de T010).

**Checkpoint**: US1 + US2 — el sistema de energía de misión es funcional y seguro ante el caso límite.

---

## Phase 4: User Story 3 - Recuperación con el tiempo y escalado por nivel de personaje (Priority: P2)

**Goal**: `missionEnergy` se recupera correctamente al hidratar, y su máximo/tasa reflejan el nivel de personaje de `specs/006-dashboard-base-jugador`.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T013 [US3] `src/state/useMetaStore.ts`: `hydrate()` recalcula `missionEnergy.max` a partir del nivel de personaje agregado (ya calculado en `specs/006-dashboard-base-jugador`) usando `computeMissionEnergyMax`, y aplica `computeRecoveredEnergy` con `lastUpdatedAt` persistido antes de exponer el estado (depende de T006, T002).
- [X] T014 [US3] `src/state/useMetaStore.ts`: tras `upgradeCat` (que sube el nivel de personaje), recalcula `missionEnergy.max`/tasa vigente sin reducir `current` (depende de T013).
- [X] T015 [US3] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): simular `lastUpdatedAt` en el pasado y confirmar recuperación proporcional al hidratar, topada al máximo (depende de T013).

**Checkpoint**: recurso completo — se gasta, bloquea, recupera y escala.

---

## Phase 5: User Story 4 - Dificultad progresiva dentro de una región (Priority: P3)

**Goal**: garantizar el invariante de datos (`difficulty` no decreciente por región) como red de seguridad para contenido futuro.

**Independent Test**: spec.md Historia 4 — cubierta ya por T005 como test de datos; sin UI nueva mientras exista un solo nivel.

### Implementation for User Story 4

- [X] T016 [US4] Verificación manual: al añadir `level-2` en `specs/011-nivel-2-hacia-el-futuro`, confirmar que T005 (`levels.test.ts`) sigue en verde con la nueva región/dificultad declarada. Cubierto ya por T005; sin efecto observable adicional hasta que exista `level-2`.

**Checkpoint**: las cuatro historias completas — spec cerrada.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T017 [P] `npx tsc -b` limpio.
- [X] T018 [P] `npm test` — suite completa en verde.
- [X] T019 Recorrido manual en navegador: gastar energía de misión hasta bloquear la entrada, confirmar el bloqueo, y verificar recuperación tras recargar con `lastUpdatedAt` manipulado en IndexedDB (DevTools) para simular tiempo transcurrido.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todas las historias.
- **US1 (Fase 2)**: depende de Foundational completo.
- **US2 (Fase 3)**: depende de US1 (T007, T008).
- **US3 (Fase 4)**: depende de Foundational (T006) y de `specs/006-dashboard-base-jugador` (nivel de personaje).
- **US4 (Fase 5)**: depende de T005 (Foundational) y de `specs/011-nivel-2-hacia-el-futuro` para tener efecto observable.
- **Polish (Fase 6)**: depende de que las cuatro historias estén completas.

## Parallel Opportunities

- T001/T002 en paralelo (Foundational, archivos distintos).
- T004/T005 en paralelo.
- T017/T018 en paralelo.
