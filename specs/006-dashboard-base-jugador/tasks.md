# Tasks: Dashboard de Base del Jugador

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: store (`useMetaStore` extendido) con Vitest + `fake-indexeddb`, pantallas con Testing Library.

**Organización**: sin fase de Setup — Dexie ya está instalado; solo se extiende el esquema.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: esquema Dexie y estado de equipo activo — bloquean US3; US1/US2 no dependen de esta fase (reutilizan `ownedCats`/`upgradeCat` ya existentes).

- [X] T001 `src/db/index.ts`: añade tabla `teamFormation` en `db.version(2).stores({ ...v1Stores, teamFormation: 'id' })`; interfaz `TeamFormationRow { id: 1; catIds: string[] }`.
- [X] T002 `src/state/useMetaStore.ts`: añade `activeTeamCatIds: string[]` al estado, hidratado desde `db.teamFormation.get(1)` (vacío si no existe fila) en `hydrate()`; `setActiveTeam(catIds: string[]): boolean` — rechaza (`return false`) si `catIds.length === 0`, si no persiste en `db.teamFormation.put` y actualiza el estado (depende de T001).
- [X] T003 [P] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende el existente): `setActiveTeam([])` devuelve `false` y no muta el estado; `setActiveTeam([...])` no vacío persiste y actualiza `activeTeamCatIds` (depende de T002).

**Checkpoint**: estado de equipo activo completo y testeado, ninguna pantalla lo usa todavía.

---

## Phase 2: User Story 1 - Ver nivel de personaje y moneda disponible (Priority: P1) 🎯 MVP

**Goal**: pantalla `Base` (reescritura de `UpgradeScreen.tsx`) muestra nivel agregado + `currency`.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T004 [US1] `src/screens/UpgradeScreen.tsx`: calcula nivel de personaje (`Object.values(ownedCats).reduce((sum, c) => sum + c.level, 0)`) y muestra junto a `currency` de `useMetaStore`.
- [X] T005 [US1] Test Testing Library `tests/unit/UpgradeScreen.test.tsx`: nivel de personaje se calcula correctamente con 1+ gatos poseídos de distinto nivel (depende de T004).

**Checkpoint**: la Base muestra contexto de progreso.

---

## Phase 3: User Story 2 - Mejorar un gato gastando moneda (Priority: P1)

**Goal**: lista de gatos poseídos en `Base` con acción "Mejorar" sobre `upgradeCat` ya existente.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T006 [US2] `src/screens/UpgradeScreen.tsx`: lista cada `ownedCats` entry con nombre (`CATS`), nivel actual, costo de siguiente mejora, botón "Mejorar" → `useMetaStore.upgradeCat(catId)`; deshabilitado si `currency < upgradeCost(nivel)` (mismo cálculo que el store, expuesto o replicado como constante compartida) (depende de T004).
- [X] T007 [US2] Test Testing Library `tests/unit/UpgradeScreen.test.tsx` (extiende T005): click en "Mejorar" con moneda suficiente sube el nivel mostrado; botón deshabilitado sin moneda suficiente no dispara `upgradeCat` (depende de T006).

**Checkpoint**: US1 + US2 — Base completamente funcional para progresión de gatos.

---

## Phase 4: User Story 3 - Elegir el equipo antes de la batalla (Priority: P2)

**Goal**: pantalla `Team` nueva + filtro en `DeployBar`.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T008 [US3] `src/types/screen.ts`: añade `'Team'` a `Screen`.
- [X] T009 [US3] `src/screens/TeamScreen.tsx`: checkbox por gato poseído, botón "Confirmar equipo" → `useMetaStore.setActiveTeam(selectedIds)`, deshabilitado si la selección está vacía (depende de T002, T008).
- [X] T010 [US3] `src/screens/MainMenuScreen.tsx` o `UpgradeScreen.tsx`: añade botón "Equipo" → `onNavigate('Team')`.
- [X] T011 [US3] `src/App.tsx`: añade el `case 'Team'`.
- [X] T012 [US3] `src/screens/BattleScreen.tsx` (`DeployBar`): filtra `ownedCats` por `activeTeamCatIds` cuando no esté vacío; si está vacío (sin equipo definido todavía), mantiene el comportamiento actual (depende de T002).
- [X] T013 [US3] Test Testing Library `tests/unit/TeamScreen.test.tsx`: deseleccionar todos deshabilita "Confirmar equipo"; confirmar con selección no vacía llama `setActiveTeam` (depende de T009).
- [X] T014 [US3] Test Testing Library `tests/unit/BattleScreen.test.tsx` (extiende si existe, o nuevo): `DeployBar` no ofrece un gato excluido del equipo activo cuando hay uno guardado (depende de T012).

**Checkpoint**: las tres historias funcionan de forma independiente y en conjunto — spec completa.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T015 [P] `npx tsc -b` limpio.
- [X] T016 [P] `npm test` — suite completa en verde.
- [X] T017 Recorrido manual en navegador: mejorar un gato en Base, definir equipo parcial en Team, entrar a batalla y confirmar que `DeployBar` respeta la selección.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: bloquea US3 (T008-T014); no bloquea US1/US2.
- **US1 (Fase 2)** y **US2 (Fase 3)**: pueden desarrollarse en secuencia sobre el mismo archivo (`UpgradeScreen.tsx`) sin depender de Foundational.
- **US3 (Fase 4)**: depende de Foundational (T001-T002).
- **Polish (Fase 5)**: depende de que las tres historias estén completas.

## Parallel Opportunities

- T001/T003 pueden prepararse en paralelo con T004-T007 (archivos distintos).
- T015/T016 en paralelo.
