---

description: "Task list for feature 032-festival-de-tesoros"
---

# Tasks: Festival de Tesoros

**Input**: Design documents from `/specs/032-festival-de-tesoros/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Incluidos.

**Organization**: US1 (banner) y US2 (efecto en moneda) comparten el mismo catálogo de datos (Foundational) pero tocan archivos de pantalla distintos (`LevelSelectScreen.tsx` vs. `BattleScreen.tsx`) — independientes entre sí tras la fase Foundational.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Single-project: `src/`, `tests/` en la raíz.

---

## Phase 1: Setup

- [X] T001 Ejecutar `npx tsc -b` y `npm test` y confirmar línea base en verde

---

## Phase 2: Foundational — catálogo de datos

- [X] T002 [P] Crear `tests/unit/data/treasureFestival.test.ts`: `getActiveTreasureFestival` devuelve el festival cuya ventana contiene `nowMs`, `undefined` fuera de cualquier ventana; con 2 ventanas no solapadas de un mismo festival, cada una activa por separado según `nowMs`; `getFestivalTimeRemainingMs` devuelve la diferencia exacta hasta `endMs` de la ventana activa, `0` si ninguna ventana contiene `nowMs` — confirmar que fallan (el archivo no existe)
- [X] T003 Crear `src/data/treasureFestival.ts` según data-model.md, con 1 `TreasureFestival` de bootstrap (`currencyMultiplier: 2`, ventana amplia que cubra 2026, mismo criterio que `EVENT_BANNERS`)
- [X] T004 Ejecutar `tests/unit/data/treasureFestival.test.ts` y confirmar que T002 pasa

**Checkpoint**: Catálogo listo — US1/US2 pueden implementarse en cualquier orden a partir de aquí.

---

## Phase 3: User Story 1 - Banner con countdown en el mapa de etapas (Priority: P1)

**Goal**: `TreasureFestivalBanner` en `LevelSelectScreen`, visible solo con festival activo, countdown en tiempo real.

**Independent Test**: Con festival activo (mockeado), abrir el mapa y confirmar banner + countdown decreciente; fuera de ventana, confirmar ausencia del banner.

### Tests for User Story 1

- [X] T005 [P] [US1] Añadir casos a `tests/unit/LevelSelectScreen.test.tsx` (usar `vi.useFakeTimers()`, mockear `../../src/data/treasureFestival` con una ventana de prueba controlada): con festival activo, el banner muestra nombre/multiplicador y un countdown; avanzar timers y confirmar que el countdown decrece; fuera de ventana, el banner no aparece (Acceptance Scenarios 1-3 de `spec.md` US1) — confirmar que fallan

### Implementation for User Story 1

- [X] T006 [US1] En `src/screens/LevelSelectScreen.tsx`: crear componente `TreasureFestivalBanner` (research.md Decisión 3 — `setInterval(1000)` local, `getActiveTreasureFestival(Date.now())`/`getFestivalTimeRemainingMs`, retorna `null` sin festival activo); renderizarlo junto al encabezado (junto al chip de energía de misión)
- [X] T007 [US1] Ejecutar `tests/unit/LevelSelectScreen.test.tsx` y confirmar que T005 pasa y que ninguna prueba existente se rompe

**Checkpoint**: Banner visible y actualizado en tiempo real (SC-001, SC-002).

---

## Phase 4: User Story 2 - Moneda de victoria duplicada durante el festival (Priority: P1)

**Goal**: `BattleOutcomeWatcher` aplica el multiplicador del festival activo al momento de la victoria.

**Independent Test**: Ganar un nivel de prueba dentro y fuera de una ventana de festival, confirmar la proporción exacta de moneda otorgada.

### Tests for User Story 2

- [X] T008 [P] [US2] Añadir casos a `tests/unit/BattleScreen.test.tsx` (mockear `../../src/data/treasureFestival` con una ventana de prueba controlada por fecha real o `vi.setSystemTime`): en victoria dentro de la ventana, la moneda otorgada incluye el multiplicador del festival junto a los 3 ya existentes; en victoria fuera de la ventana, la moneda es idéntica a la de antes de esta spec (Acceptance Scenarios 1-2 de `spec.md` US2) — confirmar que fallan

### Implementation for User Story 2

- [X] T009 [US2] En `src/screens/BattleScreen.tsx`, `BattleOutcomeWatcher`: multiplicar la recompensa de moneda por `getActiveTreasureFestival(Date.now())?.currencyMultiplier ?? 1`, junto a los 3 factores ya existentes (specs/013/025/031)
- [X] T010 [US2] Ejecutar `tests/unit/BattleScreen.test.tsx` completo, confirmar que T008 pasa y que ninguna prueba existente (incluida la de Contabilidad, specs/031) se rompe

**Checkpoint**: La moneda de victoria refleja el festival activo (SC-003).

---

## Phase 5: Polish & Verificación Final

- [X] T011 Ejecutar `npx tsc -b` y `npm test` completos, confirmar 0 errores/0 fallos (SC-004)
- [X] T012 Verificación manual en navegador siguiendo `quickstart.md`

---

## Dependencies & Execution Order

Phase 1 → Phase 2 (bloquea US1/US2) → US1 (Phase 3) y US2 (Phase 4) en paralelo (archivos disjuntos) → Phase 5.

## Implementation Strategy

**MVP = User Story 1**: el banner es demostrable de forma aislada; US2 (el efecto real en moneda) se entrega inmediatamente después, completando el valor jugable de la spec.
