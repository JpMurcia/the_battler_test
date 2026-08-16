# Tasks: Sistema de Objetos de Batalla

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: Vitest para `src/state/`; Testing Library para `TeamScreen`/`LevelSelectScreen`.

**Organización**: sin fase de Setup. Depende de `specs/012-saga-imperio-de-los-gatos` (recompensas de nivel, tesoros), `specs/006-dashboard-base-jugador` (`TeamScreen`).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 [P] `src/data/battleItems.ts`: `BattleItem` interface (Key Entities) + catálogo con al menos "Aceleración de Velocidad" (`Combat`), "Energía Extra" (`InitialResource`), "Radar de Tesoro" (`TreasureBonus`) (FR-002).
- [X] T002 [P] `src/data/levels.ts`: `Level` += `battleItemRewards?: { itemId: string; count: number }[]` (FR-003, FR-011).
- [X] T003 `src/db/index.ts`: tabla `battleItems`, `db.version(7)` (plan.md § Storage).
- [X] T004 `src/state/useMetaStore.ts`: `battleItemInventory` hidratado desde Dexie; `selectedBattleItemIds: string[]` inicializado en `[]`, no persistido (plan.md Key Design Decision 1) (depende de T003).

**Checkpoint**: datos y estado listos, sin UI todavía.

---

## Phase 2: User Story 1 - Seleccionar objetos antes de entrar a un nivel (Priority: P1) 🎯 MVP

**Goal**: selector de objetos en `TeamScreen`, con límite máximo.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T005 [US1] `src/state/useMetaStore.ts`: `selectBattleItem(itemId): boolean` — rechaza si ya se alcanzó el máximo configurado (`MAX_BATTLE_ITEMS_PER_BATTLE`) o si no hay unidades disponibles en `battleItemInventory` más allá de las ya seleccionadas; `deselectBattleItem(itemId): void` (FR-001, FR-007) (depende de T001, T004).
- [X] T006 [US1] `src/screens/TeamScreen.tsx`: lista de `BATTLE_ITEMS` con checkbox de selección (deshabilitado si no hay stock o se alcanzó el máximo), usando `selectBattleItem`/`deselectBattleItem` (depende de T005).
- [X] T007 [P] [US1] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): `selectBattleItem` rechaza sobre el máximo configurado y sin stock disponible; `deselectBattleItem` libera un cupo (depende de T005).
- [X] T008 [P] [US1] Test Testing Library `tests/unit/TeamScreen.test.tsx` (extiende): con un objeto en inventario, seleccionarlo lo marca elegido; sin inventario, `TeamScreen` se renderiza sin objetos seleccionables ni error (depende de T006).

**Checkpoint**: selección funcional — MVP visual.

---

## Phase 3: User Story 2 - El objeto surte efecto desde el inicio de la batalla (Priority: P1)

**Goal**: consumo al entrar a la batalla y aplicación de efectos.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T009 [US2] `src/state/useMetaStore.ts`: `consumeSelectedBattleItems(): { speedMultiplier: number; energyBonus: number; hasTreasureRadar: boolean }` — descuenta cada `selectedBattleItemIds` de `battleItemInventory`, limpia la selección, y devuelve los efectos resueltos (plan.md Key Design Decision 2) (depende de T004, T005).
- [X] T010 [US2] `src/screens/LevelSelectScreen.tsx` ("Jugar"): llama `consumeSelectedBattleItems()` antes de `startLevel`, pasándole el resultado (depende de T009).
- [X] T011 [US2] `src/state/useGameStore.ts`: `startLevel` acepta `{ speedMultiplier?, energyBonus? }`; aplica `energyBonus` a `energy.current` inicial y guarda `unitSpeedMultiplier` en `GameFields` (plan.md Key Design Decision 3) (depende de T010).
- [X] T012 [US2] `src/state/useGameStore.ts` (`deployUnit`)/`src/engine/simulation.ts` (`spawnEnemyUnit`): multiplican `cat.speed` por `unitSpeedMultiplier` vigente al crear el `BattleUnit` (depende de T011).
- [X] T013 [US2] `src/screens/BattleScreen.tsx` (`BattleOutcomeWatcher`): si el resultado de `consumeSelectedBattleItems` incluía "Radar de Tesoro", al ganar llama `grantRandomUnownedTreasure(random)` (plan.md Key Design Decision 4) (depende de T009, `specs/012` `grantLevelRewards`).
- [X] T014 [P] [US2] Test Vitest `tests/unit/state/useGameStore.test.ts` (extiende): `startLevel` con `energyBonus` produce `energy.current` inicial mayor; `deployUnit` con `unitSpeedMultiplier` produce un `BattleUnit.speed` mayor al base (depende de T011, T012).
- [X] T015 [P] [US2] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): `grantRandomUnownedTreasure` añade un tesoro no poseído; con todos los tesoros ya poseídos, no añade nada y no lanza error (FR-010) (depende de T013).

**Checkpoint**: US1+US2 — sistema jugable de punta a punta.

---

## Phase 4: User Story 3 - Obtención vía recompensa de nivel (Priority: P2)

**Goal**: `battleItemRewards` de un nivel se suman al inventario al ganar.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T016 [US3] `src/state/useMetaStore.ts` (`grantLevelRewards`, de `specs/012`): añade `level.battleItemRewards` a `battleItemInventory`, sumando a la cantidad ya poseída (depende de T002, `specs/012` T016).
- [X] T017 [P] [US3] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): ganar un nivel con `battleItemRewards` suma la cantidad correcta al inventario; un nivel sin esa recompensa no cambia el inventario (depende de T016).

**Checkpoint**: las tres historias completas — spec cerrada.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T018 [P] `npx tsc -b` limpio.
- [X] T019 [P] `npm run test` — suite completa (existente + T007/T008/T014/T015/T017) en verde.
- [ ] T020 Verificación manual en navegador: seleccionar un objeto en `TeamScreen`, confirmar su efecto en la batalla siguiente, y confirmar que el inventario persiste tras recargar. **Pendiente**: confirmado por DOM que el selector renderiza en `TeamScreen` ("Objetos de Batalla (0/3)", los 3 objetos deshabilitados sin stock — inventario vacío en una sesión nueva) sin errores de consola; falta jugar una batalla completa hasta victoria para ganar el primer objeto y confirmar su efecto, bloqueado por el mismo problema de composición del panel Browser que specs/012 T036. `npx tsc -b` y `npm test` (334/334) cubren la lógica.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational — MVP.
- **US2 (Fase 3)**: depende de US1 (necesita objetos ya seleccionables).
- **US3 (Fase 4)**: depende de Foundational; independiente de US1/US2 salvo por compartir `battleItemInventory`.
- **Polish (Fase 5)**: depende de que las tres historias estén completas.

## Parallel Opportunities

- T001/T002 (Foundational) en paralelo.
- US3 puede desarrollarse en paralelo a US1/US2 una vez completada Foundational.
- T018/T019 en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational).
2. Completar Fase 2 (US1) — selección visible y funcional.
3. **STOP y VALIDAR**: seleccionar/deseleccionar respeta el máximo y el stock disponible.

### Incremental Delivery

1. Foundational → datos y estado listos.
2. + US1 → selección (MVP visual).
3. + US2 → efectos reales en batalla (cierra el ciclo jugable).
4. + US3 → obtención vía recompensa de nivel — spec completa.
