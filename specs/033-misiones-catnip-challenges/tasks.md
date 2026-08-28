---

description: "Task list for feature 033-misiones-catnip-challenges"
---

# Tasks: Misiones (Catnip Challenges)

**Input**: Design documents from `/specs/033-misiones-catnip-challenges/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Incluidos.

**Organization**: Foundational (catálogo + persistencia + acciones del store) bloquea todo. US1 (panel/UI) y US2 (instrumentación) tocan archivos disjuntos y son independientes entre sí una vez completada la fase Foundational. US3 (reinicio diario) ya queda cubierta por el diseño de Foundational — su fase solo añade la cobertura de test explícita.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Single-project: `src/`, `tests/` en la raíz.

---

## Phase 1: Setup

- [X] T001 Ejecutar `npx tsc -b` y `npm test` y confirmar línea base en verde

---

## Phase 2: Foundational — catálogo, persistencia y acciones del store

- [X] T002 [P] Crear `tests/unit/data/missions.test.ts`: `getDateKey` determinista (`YYYY-MM-DD`), 2 timestamps del mismo día UTC producen la misma clave, 2 de días distintos producen claves distintas; `MISSIONS` tiene 3 entradas con `target`/`currencyReward` positivos — confirmar que fallan (el archivo no existe)
- [X] T003 Crear `src/data/missions.ts` según data-model.md
- [X] T004 Ejecutar `tests/unit/data/missions.test.ts` y confirmar que T002 pasa
- [X] T005 En `src/db/index.ts`: añadir `MissionsRow`, tabla `missions: Table<MissionsRow, number>`, `this.version(13).stores({ missions: 'id' })`
- [X] T006 En `src/types/screen.ts`: añadir `'Missions'` a `PanelId`
- [X] T007 [P] Añadir casos a `tests/unit/useMetaStore.test.ts`: `hydrate()` sobre una base vacía deja `missionProgress: {}`/`claimedMissionIds: []`/`missionsResetDateKey` en la fecha de hoy; `recordMissionProgress('unitsDeployed', 1)` suma al contador y persiste; `claimMission(id)` con progreso suficiente suma `currencyReward` a `currency`, agrega el id a `claimedMissionIds`, y persiste; `claimMission(id)` con progreso insuficiente o ya reclamado devuelve `false` sin mutar; con `missionsResetDateKey` de un día distinto al actual, la siguiente llamada a `recordMissionProgress`/`claimMission` reinicia `missionProgress`/`claimedMissionIds` antes de aplicar el efecto pedido (Acceptance Scenarios de `spec.md` US1/US3) — confirmar que fallan
- [X] T008 En `src/state/useMetaStore.ts`: añadir `missionProgress`/`claimedMissionIds`/`missionsResetDateKey` a `MetaState` (defaults `{}`/`[]`/`''`), poblarlos en `hydrate()` desde `db.missions.get(1)` (aplicando el chequeo de reinicio de fecha ahí también), añadir una función interna compartida `applyMissionResetIfNeeded()` (research.md Decisión 2) usada por `recordMissionProgress`/`claimMission`, y ambas acciones según data-model.md
- [X] T009 Ejecutar `tests/unit/useMetaStore.test.ts` y confirmar que T007 pasa y que ninguna prueba existente se rompe

**Checkpoint**: Catálogo, persistencia y acciones listos — sin UI ni instrumentación todavía.

---

## Phase 3: User Story 1 - Panel de Misiones con progreso y reclamo (Priority: P1)

**Goal**: `MissionsPanel` accesible desde el Hub, con badge de pendientes.

**Independent Test**: Con progreso mockeado suficiente en una misión, abrir el panel, confirmar que aparece reclamable, reclamarla, confirmar el aumento de moneda.

### Tests for User Story 1

- [X] T010 [P] [US1] Crear `tests/unit/MissionsPanel.test.tsx`: lista las 3 misiones con descripción y progreso `actual/objetivo`; una misión con progreso ≥ objetivo muestra un botón "Reclamar" habilitado en vez del progreso; pulsarlo invoca `claimMission` y aumenta `currency`; una misión ya reclamada muestra "Reclamada" sin botón; el progreso mostrado nunca supera el objetivo aunque el valor interno lo haga (FR-004, mockear `missionProgress` por encima de `target`) — confirmar que fallan (el archivo no existe)
- [X] T011 [P] [US1] Añadir casos a `tests/unit/HubScreen.test.tsx`: el botón "Misiones" existe y abre `MissionsPanel`; con al menos 1 misión completada y sin reclamar, el botón muestra un badge con la cantidad; sin ninguna, no muestra badge — confirmar que fallan

### Implementation for User Story 1

- [X] T012 [US1] Crear `src/screens/MissionsPanel.tsx`: lee `missionProgress`/`claimedMissionIds`/`claimMission` de `useMetaStore`, itera `MISSIONS`, calcula `Math.min(missionProgress[m.metric] ?? 0, m.target)` para mostrar (research.md Decisión 4), botón "Reclamar" solo si `progreso real ≥ target` y no está en `claimedMissionIds`
- [X] T013 [US1] En `src/screens/HubScreen.tsx`: añadir botón "Misiones" al dock/accesos (mismo estilo que el resto, con badge condicional calculado como `MISSIONS.filter(m => (missionProgress[m.metric] ?? 0) >= m.target && !claimedMissionIds.includes(m.id)).length`), y el `case 'Missions'` en el switch de `panelContent`
- [X] T014 [US1] Ejecutar `tests/unit/MissionsPanel.test.tsx` y `tests/unit/HubScreen.test.tsx`, confirmar que T010/T011 pasan y que ninguna prueba existente se rompe

**Checkpoint**: El jugador puede ver y reclamar misiones desde el Hub (SC-001, SC-003).

---

## Phase 4: User Story 2 - Instrumentación automática de progreso (Priority: P1)

**Goal**: Los 3 puntos de instrumentación (data-model.md) registran progreso sin acción manual.

**Independent Test**: Desplegar unidades/ganar una batalla/derrotar enemigos y confirmar el avance correspondiente en `useMetaStore.getState().missionProgress`.

### Tests for User Story 2

- [X] T015 [P] [US2] Añadir casos a `tests/unit/useGameStore.test.ts`: `deployUnit()` exitoso incrementa `useMetaStore.getState().missionProgress.unitsDeployed` en 1; un `deployUnit()` rechazado (sin energía/en cooldown) no incrementa nada — confirmar que fallan
- [X] T016 [P] [US2] Añadir casos a `tests/unit/BattleScreen.test.tsx`: en victoria, `BattleOutcomeWatcher` incrementa `missionProgress.levelsCompleted` en 1 — confirmar que falla

### Implementation for User Story 2

- [X] T017 [US2] En `src/state/useGameStore.ts`, `deployUnit()`: antes de `return true` (tras el `set({...})` exitoso), `useMetaStore.getState().recordMissionProgress('unitsDeployed', 1)`
- [X] T018 [US2] En `src/screens/BattleScreen.tsx`, `BattleOutcomeWatcher`: junto al resto de efectos de victoria, `recordMissionProgress('levelsCompleted', 1)`
- [X] T019 [US2] En `src/game/BattleStage.tsx`, `BattleField`'s `useTick`, junto al cálculo ya existente de `newlyDead`: contar `newlyDead.filter(u => u.team === 'Enemy').length` y, si `> 0`, `useMetaStore.getState().recordMissionProgress('enemiesDefeated', count)`
- [X] T020 [US2] Ejecutar `tests/unit/useGameStore.test.ts` y `tests/unit/BattleScreen.test.tsx` completos, confirmar que T015/T016 pasan y que ninguna prueba existente (incluidas las de death echo/impact effects de `BattleStage.tsx`) se rompe

**Checkpoint**: Las 3 misiones avanzan jugando, sin acción manual (SC-002).

---

## Phase 5: User Story 3 - Reinicio diario (Priority: P2)

**Goal**: Cobertura de test explícita del reinicio ya implementado en Foundational (T008).

**Independent Test**: Reclamar una misión, simular un `missionsResetDateKey` de ayer, confirmar que la siguiente interacción reinicia todo.

### Tests for User Story 3

- [X] T021 [P] [US3] Añadir casos a `tests/unit/useMetaStore.test.ts`: con `missionsResetDateKey` de un día distinto a hoy y progreso/reclamos previos seteados directamente, `hydrate()` reinicia `missionProgress`/`claimedMissionIds` a vacío y actualiza `missionsResetDateKey` a hoy, y esto persiste tras releer de Dexie (Acceptance Scenarios 1-3 de `spec.md` US3) — confirmar que fallan si no lo hacían ya con T007

### Implementation for User Story 3

- [X] T022 [US3] Si T008 no cubre ya el reinicio dentro de `hydrate()` (no solo en `recordMissionProgress`/`claimMission`), añadirlo ahí también
- [X] T023 [US3] Ejecutar `tests/unit/useMetaStore.test.ts` completo, confirmar que T021 pasa

**Checkpoint**: Reinicio diario cubierto explícitamente por test (SC-004).

---

## Phase 6: Polish & Verificación Final

- [X] T024 Ejecutar `npx tsc -b` y `npm test` completos, confirmar 0 errores/0 fallos (SC-005)
- [X] T025 Verificación manual en navegador siguiendo `quickstart.md`

---

## Dependencies & Execution Order

Phase 1 → Phase 2 (Foundational, bloquea todo) → US1 (Phase 3) y US2 (Phase 4) en paralelo (archivos disjuntos) → US3 (Phase 5, mayormente cobertura de test sobre lo ya construido) → Phase 6.

## Implementation Strategy

**MVP = User Story 1 + User Story 2 juntas**: por separado ninguna demuestra valor completo (el panel sin instrumentación muestra siempre 0; la instrumentación sin panel no es visible) — se entregan como el primer incremento demostrable, con US3 como refuerzo de robustez inmediatamente después.
