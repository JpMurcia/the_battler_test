# Tasks: Barrera de Base y Jefes Vinculados

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: Vitest — `tests/unit/engine/simulation.test.ts`, extendido.

**Organización**: sin fase de Setup. Depende de `specs/012-saga-imperio-de-los-gatos` (`SagaArc.bossLevelId`).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 `src/data/sagaArcs.ts`: `SagaArc` += `bossCatId?: string` (FR-001, junto a `bossLevelId` ya existente de `specs/012`).
- [X] T002 `src/engine/simulation.ts`: `SimState` += `bossBarrierActive: boolean` (derivado, campo de solo lectura recalculado por `stepSimulation`, no mutado desde fuera) (plan.md Key Design Decision 1).

**Checkpoint**: tipo listo, sin comportamiento todavía.

---

## Phase 2: User Story 1 - Base enemiga protegida mientras el jefe vive (Priority: P1) 🎯 MVP

**Goal**: `stepSimulation` calcula `bossBarrierActive` y bloquea daño a `enemyBase` mientras esté activa.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T003 [US1] `src/engine/simulation.ts` (`stepSimulation`): al inicio del paso, si `state.levelId` es `bossLevelId` de algún `SAGA_ARCS` con `bossCatId` configurado, calcula `bossBarrierActive = alive.some(u => u.team === 'Enemy' && u.catId === bossCatId && u.state !== 'Dead')` (depende de T001, T002).
- [X] T004 [US1] `src/engine/simulation.ts` (bucle de `baseAttackers`): mientras `bossBarrierActive` es `true`, omite el daño hacia `enemyBase` para atacantes `Player` (plan.md Key Design Decision 2) (depende de T003).
- [X] T005 [P] [US1] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): con el jefe vinculado vivo, `enemyBase.hp` no cambia tras varios ticks de ataque; un nivel sin `bossLevelId`/`bossCatId` configurado se comporta exactamente igual que hoy (FR-006) (depende de T004).

**Checkpoint**: barrera activa — MVP (todavía sin forma de retirarla dentro del mismo test, cubierto en US2).

---

## Phase 3: User Story 2 - Derrotar al jefe retira la barrera (Priority: P1)

**Goal**: confirmar que `bossBarrierActive` se apaga automáticamente al morir el jefe, y que enemigos regulares no bastan.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T006 [P] [US2] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): tras derrotar (llevar a `hp <= 0`) a la unidad con `catId === bossCatId`, el siguiente `stepSimulation` calcula `bossBarrierActive === false` y el daño a `enemyBase` vuelve a aplicarse con normalidad (depende de T003, T004).
- [X] T007 [P] [US2] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): derrotar únicamente enemigos regulares de la oleada (con `catId !== bossCatId`) mientras el jefe sigue vivo NO retira la barrera (FR-005) (depende de T003, T004).
- [X] T008 [P] [US2] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): con el jefe derrotado y la barrera retirada, una unidad puede reducir `enemyBase.hp` hasta 0 y el nivel resuelve `Victory` por el flujo ya existente (depende de T006).

**Checkpoint**: US1+US2 — sistema completo y sin softlock.

---

## Phase 4: Indicador visual y verificación de edge cases

- [X] T009 `src/state/useGameStore.ts`: expone `bossBarrierActive` en `GameFields` (poblado desde el resultado de `stepSimulation` en `tick()`) (depende de T002-T004).
- [X] T010 `src/screens/BattleScreen.tsx` (`EnemyBaseReadout`): muestra un indicador cuando `bossBarrierActive` es `true` (FR-008, plan.md Key Design Decision 4) (depende de T009).
- [X] T011 [P] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): reintentar un nivel `bossLevelId` (`startLevel` de nuevo tras `Defeat`) reinicia `bossBarrierActive` a `true` si el jefe vuelve a estar vivo en la oleada — no persiste "jefe ya derrotado" entre intentos (FR-007) (depende de T003).
- [X] T012 [P] Test Testing Library `tests/unit/BattleScreen.test.tsx` (extiende): con `bossBarrierActive: true`, el indicador aparece; con `false`, no aparece (depende de T010).

**Checkpoint**: las dos historias completas + observabilidad — spec cerrada.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T013 [P] `npx tsc -b` limpio.
- [X] T014 [P] `npm run test` — suite completa (existente de `src/engine/` sin regresión + T005/T006/T007/T008/T011/T012) en verde.
- [ ] T015 Verificación manual en navegador: un nivel de prueba marcado `bossLevelId` con `bossCatId` configurado, confirmando que la base enemiga resiste hasta derrotar al jefe y que el indicador visual aparece/desaparece correctamente. **Pendiente**: mismo bloqueo de composición del panel Browser que specs/012 T036 (requiere que el bucle de batalla avance para que `armored-cat`, el jefe real configurado en `arco-2-imperio-de-los-gatos`/`level-2`, aparezca y pueda derrotarse) — `npx tsc -b` y `npm test` (364/364, incluida la barrera activa/retirada/reintento y el indicador de `BattleScreen`) cubren la lógica completa.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational y de `specs/012` (`SagaArc.bossLevelId`) — MVP.
- **US2 (Fase 3)**: depende de US1 (T003-T004, misma derivación de `bossBarrierActive`).
- **Fase 4 (indicador/edge cases)**: depende de US1+US2.
- **Polish (Fase 5)**: depende de que todo lo anterior esté completo.

## Parallel Opportunities

- T005/T006/T007/T008 (tests) en paralelo entre sí una vez completado T004.
- T013/T014 en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational).
2. Completar Fase 2 (US1) — barrera bloquea daño mientras el jefe vive.
3. **STOP y VALIDAR**: `enemyBase.hp` no cambia con el jefe vivo, sin importar cuánto se la ataque.

### Incremental Delivery

1. Foundational → tipo listo.
2. + US1 → barrera activa (MVP).
3. + US2 → barrera se retira al derrotar al jefe (cierra el softlock).
4. + Fase 4 → indicador visual y robustez ante reintento — spec completa.
