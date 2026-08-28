---

description: "Task list for feature 034-gamatoto"
---

# Tasks: Gamatoto

**Input**: Design documents from `/specs/034-gamatoto/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Incluidos.

**Organization**: Foundational (catálogo + persistencia + acciones) bloquea todo. US1 (enviar) y US3 (reclamar) comparten las mismas acciones del store y el mismo panel — se implementan juntas en la práctica. US2 (progreso con app cerrada) es una propiedad de diseño de Foundational (Decisión 1/2 de research.md), cubierta por test explícito en su propia fase.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Single-project: `src/`, `tests/` en la raíz.

---

## Phase 1: Setup

- [X] T001 Ejecutar `npx tsc -b` y `npm test` y confirmar línea base en verde

---

## Phase 2: Foundational — catálogo, persistencia y acciones del store

- [X] T002 [P] Crear `tests/unit/data/gamatoto.test.ts`: `getExpeditionRemainingMs` decrece correctamente con `nowMs`, nunca negativo; `isExpeditionReady` `false` mientras falta tiempo, `true` en el instante exacto en que se cumple la duración y después; `GAMATOTO_EXPEDITION_OPTIONS` tiene 3 entradas con `durationMs`/`materialsReward` positivos — confirmar que fallan (el archivo no existe)
- [X] T003 Crear `src/data/gamatoto.ts` según data-model.md
- [X] T004 Ejecutar `tests/unit/data/gamatoto.test.ts` y confirmar que T002 pasa
- [X] T005 En `src/db/index.ts`: añadir `GamatotoRow`, tabla `gamatoto: Table<GamatotoRow, number>`, `this.version(14).stores({ gamatoto: 'id' })`
- [X] T006 En `src/types/screen.ts`: añadir `'Gamatoto'` a `PanelId`
- [X] T007 [P] Añadir casos a `tests/unit/useMetaStore.test.ts`: `hydrate()` sobre una base vacía deja `gamatotoExpedition: null`/`gamatotoMaterials: 0`; `startGamatotoExpedition(optionId)` sin expedición activa la registra con `startedAtMs` actual y persiste; `startGamatotoExpedition` con una ya activa devuelve `false` sin mutar; `claimGamatotoExpedition()` con expedición lista suma `materialsReward` y limpia `gamatotoExpedition`, persiste; `claimGamatotoExpedition()` sin expedición o todavía no lista devuelve `false` sin mutar — confirmar que fallan
- [X] T008 En `src/state/useMetaStore.ts`: añadir `gamatotoExpedition`/`gamatotoMaterials` a `MetaState` (defaults `null`/`0`), poblarlos en `hydrate()` desde `db.gamatoto.get(1)`, añadir `startGamatotoExpedition`/`claimGamatotoExpedition` según data-model.md
- [X] T009 Ejecutar `tests/unit/useMetaStore.test.ts` y confirmar que T007 pasa y que ninguna prueba existente se rompe

**Checkpoint**: Catálogo, persistencia y acciones listos — sin UI todavía.

---

## Phase 3: User Story 1 + 3 - Panel de Gamatoto: enviar y reclamar (Priority: P1)

**Goal**: `GamatotoPanel` accesible desde el Hub, con badge de expedición lista.

**Independent Test**: Sin expedición activa, enviar una; con una completa (mockeada), reclamarla y confirmar el aumento de materiales.

### Tests for User Story 1+3

- [X] T010 [P] [US1] Crear `tests/unit/GamatotoPanel.test.tsx`: sin expedición activa, muestra las 3 opciones de duración; elegir una invoca `startGamatotoExpedition` y el panel pasa a mostrar el countdown; con una expedición en curso, no se muestran las opciones de envío; con una expedición completa (progreso mockeado ≥ duración), muestra un botón "Reclamar" habilitado; pulsarlo invoca `claimGamatotoExpedition`, aumenta `gamatotoMaterials`, y el panel vuelve a ofrecer las 3 opciones (Acceptance Scenarios de `spec.md` US1/US3) — confirmar que fallan (el archivo no existe)
- [X] T011 [P] [US1] Añadir casos a `tests/unit/HubScreen.test.tsx`: el botón "Gamatoto" existe y abre `GamatotoPanel`; con una expedición completa sin reclamar, muestra un badge; sin expedición o con una todavía en curso, no muestra badge (FR-005) — confirmar que fallan

### Implementation for User Story 1+3

- [X] T012 [US1] Crear `src/screens/GamatotoPanel.tsx`: lee `gamatotoExpedition`/`gamatotoMaterials`/`startGamatotoExpedition`/`claimGamatotoExpedition` de `useMetaStore`, resuelve la `GamatotoExpeditionOption` activa por `optionId`, countdown en vivo con `setInterval(1000)` local (research.md Decisión 4) recalculando `getExpeditionRemainingMs`/`isExpeditionReady` con `Date.now()`
- [X] T013 [US1] En `src/screens/HubScreen.tsx`: añadir botón "Gamatoto" al dock (con badge condicional `gamatotoExpedition && isExpeditionReady(...)`), y el `case 'Gamatoto'` en el switch de `panelContent`
- [X] T014 [US1] Ejecutar `tests/unit/GamatotoPanel.test.tsx` y `tests/unit/HubScreen.test.tsx`, confirmar que T010/T011 pasan y que ninguna prueba existente se rompe

**Checkpoint**: El jugador puede enviar y reclamar expediciones desde el Hub (SC-001, SC-003, SC-004).

---

## Phase 4: User Story 2 - Progreso con la aplicación cerrada (Priority: P1)

**Goal**: Cobertura de test explícita de que el progreso se deriva de tiempo real, no de tiempo de sesión.

**Independent Test**: Enviar una expedición, avanzar `nowMs` sin ninguna interacción de UI, releer el estado y confirmar el tiempo restante correcto.

### Tests for User Story 2

- [X] T015 [P] [US2] Añadir casos a `tests/unit/useMetaStore.test.ts`: tras `startGamatotoExpedition`, `hydrate()` de nuevo (simulando "reabrir la app") con `vi.setSystemTime` avanzado a mitad de la duración — `gamatotoExpedition` sigue presente (no se pierde) y `getExpeditionRemainingMs(gamatotoExpedition, option, Date.now())` calculado en el test refleja la mitad restante; avanzando el reloj más allá de la duración completa, `claimGamatotoExpedition()` ahora sí procede (Acceptance Scenarios 1-3 de `spec.md` US2) — confirmar que fallan si no lo hacían ya

### Implementation for User Story 2

- [X] T016 [US2] Si Foundational (T008) no cubre ya el caso ("hydrate no debe alterar `startedAtMs` de una expedición existente"), ajustarlo — `hydrate()` debe limitarse a leer `db.gamatoto.get(1)` tal cual, nunca reescribir `startedAtMs`
- [X] T017 [US2] Ejecutar `tests/unit/useMetaStore.test.ts` completo, confirmar que T015 pasa

**Checkpoint**: El progreso de Gamatoto es verificablemente independiente de si la app estuvo abierta (SC-002).

---

## Phase 5: Polish & Verificación Final

- [X] T018 Ejecutar `npx tsc -b` y `npm test` completos, confirmar 0 errores/0 fallos (SC-005)
- [X] T019 Verificación manual en navegador siguiendo `quickstart.md`

---

## Dependencies & Execution Order

Phase 1 → Phase 2 (Foundational, bloquea todo) → Phase 3 (US1+3, UI) → Phase 4 (US2, cobertura de test sobre lo ya construido) → Phase 5.

## Implementation Strategy

**MVP = Phase 3 completa** (US1+3 juntas, ya que comparten panel y acciones): es el primer incremento con valor demostrable — enviar y reclamar una expedición end-to-end. US2 refuerza la propiedad de diseño ya presente desde Foundational con test explícito.
