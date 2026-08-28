---

description: "Task list for feature 035-ototo-corps"
---

# Tasks: Cuerpo Ototo

**Input**: Design documents from `/specs/035-ototo-corps/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Incluidos.

**Organization**: Foundational bloquea todo. US1 (Base) y US2 (Estilo) comparten panel/acciones — se implementan juntas en la práctica, con test por separado para cada rasgo/debuff. US3 (progreso con app cerrada) es cobertura de test sobre el diseño ya presente en Foundational (mismo patrón que specs/034).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Single-project: `src/`, `tests/` en la raíz.

---

## Phase 1: Setup

- [X] T001 Ejecutar `npx tsc -b` y `npm test` y confirmar línea base en verde

---

## Phase 2: Foundational — catálogo, persistencia y acciones del store

- [X] T002 [P] Crear `tests/unit/data/ototoCorps.test.ts`: `getConstructionRemainingMs`/`isConstructionReady` con el mismo contrato que `specs/034` (nunca negativo, `true` al cumplirse la duración); `OTOTO_BUILDINGS` tiene 2 entradas (`foundation`/`style`) con costo/duración positivos — confirmar que fallan (el archivo no existe)
- [X] T003 Crear `src/data/ototoCorps.ts` según data-model.md
- [X] T004 Ejecutar `tests/unit/data/ototoCorps.test.ts` y confirmar que T002 pasa
- [X] T005 En `src/db/index.ts`: añadir `OtotoCorpsRow`, tabla `ototoCorps: Table<OtotoCorpsRow, number>`, `this.version(15).stores({ ototoCorps: 'id' })`
- [X] T006 En `src/types/screen.ts`: añadir `'OtotoCorps'` a `PanelId`
- [X] T007 [P] Añadir casos a `tests/unit/useMetaStore.test.ts`: `hydrate()` sobre una base vacía deja `ototoConstruction: null`/`ototoBuildings: {}`; `startOtotoConstruction('foundation', 'Floating')` con materiales suficientes y sin construcción activa descuenta el costo exacto, registra la construcción, persiste; sin materiales suficientes o con una construcción ya activa devuelve `false` sin mutar; `claimOtotoConstruction()` con construcción lista escribe `ototoBuildings.foundation`, limpia `ototoConstruction`, persiste; sin construcción o todavía no lista devuelve `false` — confirmar que fallan
- [X] T008 En `src/state/useMetaStore.ts`: añadir `ototoConstruction`/`ototoBuildings` a `MetaState` (defaults `null`/`{}`), poblarlos en `hydrate()` desde `db.ototoCorps.get(1)`, añadir `startOtotoConstruction`/`claimOtotoConstruction` según data-model.md
- [X] T009 Ejecutar `tests/unit/useMetaStore.test.ts` y confirmar que T007 pasa y que ninguna prueba existente se rompe

**Checkpoint**: Catálogo, persistencia y acciones listos — sin UI ni efecto en batalla todavía.

---

## Phase 3: User Story 1 + 2 - Panel de Ototo: construir Base/Estilo y aplicar el bono (Priority: P1)

**Goal**: `OtotoCorpsPanel` en el Hub + `deployUnit()` aplica los bonos activos.

**Independent Test**: Construir la Base con un rasgo, reclamarla, desplegar una unidad y confirmar la `TraitResistance` correspondiente; repetir con el Estilo y `resistantTo`.

### Tests for User Story 1+2

- [X] T010 [P] [US1] Crear `tests/unit/OtotoCorpsPanel.test.tsx`: sin construcción activa, muestra las 2 construcciones (Base/Estilo) con selector de rasgo/debuff; con materiales insuficientes, el botón de construir está deshabilitado; elegir un rasgo/debuff y confirmar invoca `startOtotoConstruction` con esos argumentos; con una construcción en curso, no se ofrece iniciar otra; con una completa, muestra "Reclamar" habilitado y pulsarlo invoca `claimOtotoConstruction` (Acceptance Scenarios de `spec.md` US1) — confirmar que fallan (el archivo no existe)
- [X] T011 [P] [US1] Añadir casos a `tests/unit/useGameStore.test.ts`: con `ototoBuildings.foundation = 'Floating'` (mockeando `useMetaStore`), `deployUnit()` produce una unidad cuyo `abilities` incluye `{ kind: 'TraitResistance', targetClassifications: ['Floating'], damageTakenMultiplier: OTOTO_DAMAGE_REDUCTION }`; con `ototoBuildings.style = 'Freeze'`, `resistantTo` incluye `{ effect: 'Freeze', durationMultiplier: OTOTO_DEBUFF_RESISTANCE }`; sin ninguna construcción, `abilities`/`resistantTo` son exactamente los del `Cat` original, sin bono añadido (Acceptance Scenarios de `spec.md` US2, FR-006/FR-007) — confirmar que fallan

### Implementation for User Story 1+2

- [X] T012 [US1] Crear `src/screens/OtotoCorpsPanel.tsx`: lee `ototoConstruction`/`ototoBuildings`/`gamatotoMaterials`/`startOtotoConstruction`/`claimOtotoConstruction` de `useMetaStore`; para cada `OtotoBuildingDefinition` sin construcción activa, un selector (rasgo para `foundation`, debuff para `style`) + botón "Construir" (`disabled` si `gamatotoMaterials < materialsCost`); con construcción activa, countdown en vivo (mismo `setInterval` local que `GamatotoPanel`) o botón "Reclamar" si `isConstructionReady`
- [X] T013 [US1] En `src/state/useGameStore.ts`, `deployUnit()`: leer `useMetaStore.getState().ototoBuildings` y anteponer la `TraitResistance`/entrada `resistantTo` correspondiente a `abilities`/`resistantTo` del `BattleUnit` construido (data-model.md, research.md Decisión 3) — sin cambiar ningún otro campo
- [X] T014 [US1] En `src/screens/HubScreen.tsx`: añadir botón "Cuerpo Ototo" al dock, y el `case 'OtotoCorps'` en el switch de `panelContent`
- [X] T015 [US1] Ejecutar `tests/unit/OtotoCorpsPanel.test.tsx`, `tests/unit/useGameStore.test.ts` y `tests/unit/HubScreen.test.tsx`, confirmar que T010/T011 pasan y que ninguna prueba existente (incluidas `tests/unit/engine/combat.test.ts` y las de evolución/specs/031 en `deployUnit`) se rompe

**Checkpoint**: Las unidades desplegadas reflejan los bonos de Ototo activos (SC-001, SC-002, SC-003).

---

## Phase 4: User Story 3 - Progreso con la aplicación cerrada (Priority: P2)

**Goal**: Cobertura de test explícita, mismo criterio que `specs/034`.

### Tests for User Story 3

- [X] T016 [P] [US3] Añadir casos a `tests/unit/useMetaStore.test.ts`: tras `startOtotoConstruction`, `hydrate()` de nuevo no altera `startedAtMs`; con el reloj avanzado más allá de la duración (`vi.setSystemTime`), `claimOtotoConstruction()` ahora sí procede — confirmar que fallan si no lo hacían ya

### Implementation for User Story 3

- [X] T017 [US3] Si Foundational (T008) no cubre ya el caso, ajustar `hydrate()` para no reescribir `startedAtMs` de una construcción existente
- [X] T018 [US3] Ejecutar `tests/unit/useMetaStore.test.ts` completo, confirmar que T016 pasa

---

## Phase 5: Polish & Verificación Final

- [X] T019 Ejecutar `npx tsc -b` y `npm test` completos, confirmar 0 errores/0 fallos (SC-005)
- [X] T020 Verificación manual en navegador siguiendo `quickstart.md`

---

## Dependencies & Execution Order

Phase 1 → Phase 2 (Foundational) → Phase 3 (US1+2, UI + efecto en batalla) → Phase 4 (US3, cobertura de test) → Phase 5.

## Implementation Strategy

**MVP = Phase 3 completa**: sin ella no hay ningún efecto jugable observable — la Fase 2 sola es solo datos/persistencia sin manifestación visible.
