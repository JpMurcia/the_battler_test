# Tasks: Escalado Avanzado por Arco y Sets de Tesoros

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: Vitest para `src/engine/simulation.ts` y `src/state/`.

**Organización**: sin fase de Setup. Depende de `specs/012-saga-imperio-de-los-gatos` (arcos, `obtainedTreasureIds`) y `specs/007-energia-mision-dificultad` (`spendMissionEnergy`).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 [P] `src/data/levels.ts`: `Level` += `energyCostByArc?: Record<string, number>`, `laneLength?: number` (FR-002/004).
- [X] T002 [P] `src/data/treasureSets.ts`: `TreasureSet` interface (FR-006) + fixture mínimo (1-2 sets de prueba).
- [X] T003 `src/db/index.ts`: tabla `treasureSetBonuses`, `db.version(6)` (plan.md § Storage).
- [X] T004 `src/state/useMetaStore.ts`: `grantedTreasureSetIds` hidratado desde Dexie (depende de T003).

**Checkpoint**: datos y estado listos.

---

## Phase 2: User Story 1 - Vida de base enemiga escala por arco (Priority: P1) 🎯 MVP

**Goal**: `enemyBase.maxHp` refleja el `enemyStrengthMultiplier` del arco activo.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T005 [US1] `src/state/useGameStore.ts` (`startLevel`): resuelve el arco del nivel (mismo helper de `specs/012` T006) y aplica `enemyStrengthMultiplier` a `enemyBase.hp`/`enemyBase.maxHp`, redondeado (plan.md Key Design Decision 1) (depende de `specs/012` T001).
- [X] T006 [P] [US1] Test Vitest `tests/unit/state/useGameStore.test.ts` (extiende): `startLevel` de un nivel en un arco con multiplicador 3 produce `enemyBase.maxHp` triplicado respecto al mismo nivel sin arco (depende de T005).

**Checkpoint**: escalado de base enemiga — MVP.

---

## Phase 3: User Story 2 - Costo de energía de misión escala por arco (Priority: P2)

**Goal**: `spendMissionEnergy` descuenta el costo del arco de acceso.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T007 [US2] `src/state/useMetaStore.ts` (`spendMissionEnergy`): acepta el `arcId` de acceso (o lo resuelve del `levelId`) y usa `level.energyCostByArc?.[arcId] ?? level.energyCost` como costo a descontar (depende de T001).
- [X] T008 [P] [US2] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): mismo nivel accedido desde dos arcos descuenta costos distintos; sin entrada para el arco, usa `energyCost` base (depende de T007).

**Checkpoint**: US1+US2 independientes entre sí.

---

## Phase 4: User Story 3 - Ancho de carril configurable (Priority: P3)

**Goal**: `laneLength` por nivel sustituye la constante fija `LANE_LENGTH`.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T009 [US3] `src/engine/simulation.ts`: `SimState` += `laneLength: number`; `getPlayerBaseExtent(laneLength)`/`getEnemyBaseExtent(laneLength)` reemplazan las constantes `PLAYER_BASE_EXTENT`/`ENEMY_BASE_EXTENT` (plan.md Key Design Decision 2); `stepSimulation` las deriva de `state.laneLength` en vez de la constante de módulo.
- [X] T010 [US3] `src/state/useGameStore.ts` (`startLevel`): puebla `laneLength: level.laneLength ?? 400` (depende de T001, T009).
- [X] T011 [US3] `tests/unit/engine/simulation.test.ts`: migra los usos de `ENEMY_BASE_EXTENT`/`PLAYER_BASE_EXTENT` a `getEnemyBaseExtent(400)`/`getPlayerBaseExtent(400)` — mismo resultado, sin cambiar aserciones (depende de T009).
- [X] T012 [P] [US3] Test Vitest `tests/unit/engine/simulation.test.ts` (nuevo caso): con `laneLength: 600`, una unidad tarda más en llegar a `getEnemyBaseExtent(600).x` que con `laneLength: 400`, en proporción (depende de T009).

**Checkpoint**: US1+US2+US3 sin regresión en `level-1`/`level-2`.

---

## Phase 5: User Story 4 - Sets de tesoros con bonificación pasiva (Priority: P4)

**Goal**: bonificación de cuenta al completar un `TreasureSet`.

**Independent Test**: spec.md Historia 4.

### Implementation for User Story 4

- [X] T013 [US4] `src/state/useMetaStore.ts`: `checkTreasureSetCompletion(): void` — para cada `TreasureSet` no en `grantedTreasureSetIds` cuyos `treasureIds` estén todos en `obtainedTreasureIds`, registra el set y persiste (plan.md Key Design Decision 4) (depende de T002, T004).
- [X] T014 [US4] `src/state/useMetaStore.ts` (`grantLevelRewards`, de `specs/012`): invoca `checkTreasureSetCompletion()` al final (depende de T013, `specs/012` T016).
- [X] T015 [US4] `src/state/useMetaStore.ts`/`useGameStore.ts`: aplica `passiveBonus` de cada set en `grantedTreasureSetIds` al calcular `energyRegenPerSecond`/`currencyReward` iniciales de una batalla (depende de T013).
- [X] T016 [P] [US4] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): completar el segundo tesoro pendiente de un set otorga la bonificación exactamente una vez, en cualquier orden de obtención; un tesoro sin set no dispara nada (depende de T013, T014).

**Checkpoint**: las cuatro historias completas — spec cerrada.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T017 [P] `npx tsc -b` limpio.
- [X] T018 [P] `npm run test` — suite completa (existente + T006/T008/T011/T012/T016) en verde, sin regresión en `tests/unit/engine/simulation.test.ts`.
- [ ] T019 Verificación manual en navegador: mismo nivel jugado desde dos arcos con vida de base y costo de energía distintos; un set de tesoros completado en la sesión de prueba refleja su bonificación en la siguiente batalla. **Pendiente**: mismo bloqueo de composición del panel Browser que specs/010 T016 / specs/012 T036 — `npx tsc -b` y `npm test` (269/269) cubren la lógica; falta el recorrido interactivo en vivo.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational y de `specs/012` (resolución de arco) — MVP.
- **US2 (Fase 3)**: depende de Foundational; independiente de US1.
- **US3 (Fase 4)**: depende de Foundational; independiente de US1/US2.
- **US4 (Fase 5)**: depende de Foundational y de `specs/012` (`obtainedTreasureIds`, `grantLevelRewards`).
- **Polish (Fase 6)**: depende de que las cuatro historias estén completas.

## Parallel Opportunities

- T001/T002 (Foundational) en paralelo.
- US1, US2, US3 en paralelo una vez completada Foundational — módulos mayormente distintos.
- T017/T018 en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational).
2. Completar Fase 2 (US1) — vida de base enemiga escala por arco.
3. **STOP y VALIDAR**: mismo nivel en dos arcos produce `enemyBase.maxHp` distinto.

### Incremental Delivery

1. Foundational → datos listos.
2. + US1 → escalado de base enemiga (MVP, completa `specs/012` US1).
3. + US2 → costo de energía por arco.
4. + US3 → ancho de carril configurable (sin regresión).
5. + US4 → sets de tesoros — spec completa.
