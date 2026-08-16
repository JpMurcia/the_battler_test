# Tasks: Bibliotecas de Consulta (Guía de Gatos, Guía de Enemigos, Menú de Tesoros)

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: Vitest para el cálculo de progreso de cada biblioteca; Testing Library para las tres pantallas nuevas.

**Organización**: sin fase de Setup. Depende de `specs/006-dashboard-base-jugador` (`UpgradeScreen`), `specs/010-evolucion-de-gatos` (stats efectivos), `specs/013-escalado-capitulos-sets-tesoros` (`TreasureSet`).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 `src/db/index.ts`: tabla `encounteredEnemies`, `db.version(8)`.
- [X] T002 `src/state/useMetaStore.ts`: `encounteredEnemyCatIds: string[]` hidratado desde Dexie; `recordEncounteredEnemy(catId): void` — añade si no está ya presente, persiste (depende de T001).
- [X] T003 [P] `src/types/screen.ts`: `Screen` += `'CatGuide' | 'EnemyGuide' | 'TreasureMenu'`.
- [X] T004 [P] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): `recordEncounteredEnemy` añade un `catId` nuevo y persiste; llamarlo de nuevo con el mismo `catId` no duplica (depende de T002).

**Checkpoint**: registro de encuentros listo; ninguna pantalla lo consume todavía.

---

## Phase 2: User Story 1 - Guía de Gatos (Priority: P1) 🎯 MVP

**Goal**: pantalla de solo lectura con las unidades poseídas y sus stats efectivos.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T005 [US1] `src/state/useGameStore.ts` o `src/data/cats.ts`: extrae `getEffectiveCatStats(cat, ownedMeta): { hp, damage, ... }` de la lógica ya existente en `deployUnit` (`specs/010`), reutilizada por ambos (plan.md Key Design Decision 2) (depende de `specs/010` `deployUnit`).
- [X] T006 [US1] `src/screens/CatGuideScreen.tsx`: lista `Object.keys(ownedCats)` resueltos contra `CATS`, mostrando `getEffectiveCatStats` de cada uno (FR-002) (depende de T005).
- [X] T007 [US1] `src/screens/UpgradeScreen.tsx`: botón "Guía de Gatos" → `onNavigate('CatGuide')` (depende de T003, T006).
- [X] T008 [US1] `src/App.tsx`: caso `'CatGuide'` → `<CatGuideScreen onNavigate={setScreen} />` (depende de T006).
- [X] T009 [P] [US1] Test Testing Library `tests/unit/CatGuideScreen.test.tsx`: con unidades evolucionadas/mejoradas en `ownedCats`, muestra sus stats efectivos, no los base de `CATS`; con solo el gato inicial, no falla (depende de T006).

**Checkpoint**: Guía de Gatos funcional — MVP.

---

## Phase 3: User Story 2 - Guía de Enemigos (Priority: P1)

**Goal**: registro de encuentros poblado en batalla + pantalla de consulta.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T010 [US2] `src/game/BattleStage.tsx` (`BattleField`): además del diff ya existente para `activeUnits`/`DeathEcho`, detecta `catId`s de unidades `team === 'Enemy'` nuevas en el tick y llama `recordEncounteredEnemy(catId)` una vez por `catId` no visto (plan.md Key Design Decision 1) (depende de T002).
- [X] T011 [US2] `src/screens/EnemyGuideScreen.tsx`: lista `encounteredEnemyCatIds` resueltos contra `CATS` (stats base, sin escalar — plan.md Key Design Decision 3) (FR-003).
- [X] T012 [US2] `src/screens/UpgradeScreen.tsx`: botón "Guía de Enemigos" → `onNavigate('EnemyGuide')` (depende de T003, T011).
- [X] T013 [US2] `src/App.tsx`: caso `'EnemyGuide'` → `<EnemyGuideScreen onNavigate={setScreen} />` (depende de T011).
- [X] T014 [P] [US2] Test Vitest o integración `tests/unit/game/BattleStage.test.tsx`/similar: una unidad enemiga que aparece en `units` durante `stepSimulation` dispara `recordEncounteredEnemy` exactamente una vez por `catId`, no por `instanceId` repetido (depende de T010).
- [X] T015 [P] [US2] Test Testing Library `tests/unit/EnemyGuideScreen.test.tsx`: con `encounteredEnemyCatIds` vacío, se renderiza vacía sin error; con entradas, muestra sus stats base (depende de T011).

**Checkpoint**: US1+US2 — ambas guías funcionales.

---

## Phase 4: User Story 3 - Menú de Tesoros (Priority: P2)

**Goal**: progreso de `TreasureSet` por set.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T016 [US3] `src/screens/TreasureMenuScreen.tsx`: lista `TREASURE_SETS` (`specs/013`), mostrando `treasureIds.filter(id => obtainedTreasureIds.includes(id)).length` sobre `treasureIds.length`, y si `set.id` está en `grantedTreasureSetIds` (FR-006) (depende de `specs/013` `TreasureSet`).
- [X] T017 [US3] `src/screens/UpgradeScreen.tsx`: botón "Menú de Tesoros" → `onNavigate('TreasureMenu')` (depende de T003, T016).
- [X] T018 [US3] `src/App.tsx`: caso `'TreasureMenu'` → `<TreasureMenuScreen onNavigate={setScreen} />` (depende de T016).
- [X] T019 [P] [US3] Test Testing Library `tests/unit/TreasureMenuScreen.test.tsx`: un set con tesoros parciales muestra el conteo correcto; un set completo muestra la bonificación como otorgada; un set sin tesoros obtenidos muestra 0/N sin error (depende de T016).

**Checkpoint**: las tres historias completas — spec cerrada.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T020 [P] `npx tsc -b` limpio.
- [X] T021 [P] `npm run test` — suite completa (existente + T004/T009/T014/T015/T019) en verde.
- [ ] T022 Verificación manual en navegador: jugar una batalla con al menos un enemigo nuevo, volver a la Base, y confirmar que las tres bibliotecas reflejan el estado correcto sin ninguna acción de escritura disponible. **Parcialmente confirmado**: las tres pantallas navegan y renderizan correctamente por DOM desde `UpgradeScreen` — Guía de Gatos muestra "Gato Básico — Nivel 1, Forma Base: HP 50, Daño 5" (stats efectivos reales), Guía de Enemigos vacía sin error (sin batallas jugadas), Menú de Tesoros muestra "Set Imperio de los Gatos: 0/2"; ninguna tiene control de escritura (solo "Volver"). Falta jugar una batalla completa hasta que aparezca un enemigo nuevo para confirmar que Guía de Enemigos se actualiza — bloqueado por el mismo problema de composición del panel Browser que specs/012 T036. `npx tsc -b` y `npm test` (348/348) cubren la lógica del registro de encuentros.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational — MVP.
- **US2 (Fase 3)**: depende de Foundational; independiente de US1.
- **US3 (Fase 4)**: depende de Foundational y de `specs/013` (`TreasureSet`); independiente de US1/US2.
- **Polish (Fase 5)**: depende de que las tres historias estén completas.

## Parallel Opportunities

- US1, US2, US3 pueden desarrollarse en paralelo una vez completada Foundational — tres pantallas independientes.
- T020/T021 en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational).
2. Completar Fase 2 (US1) — Guía de Gatos.
3. **STOP y VALIDAR**: Guía de Gatos muestra stats efectivos correctos para unidades evolucionadas/mejoradas.

### Incremental Delivery

1. Foundational → registro de encuentros listo.
2. + US1 → Guía de Gatos (MVP).
3. + US2 → Guía de Enemigos (registro poblado en batalla).
4. + US3 → Menú de Tesoros — spec completa.
