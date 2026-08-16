# Tasks: Saga "Imperio de los Gatos" — Arcos, Gatorreta y Brote Zombi

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: Vitest para todo lo nuevo en `src/engine/`, `src/state/`; sin tests de UI nuevos (esta spec no añade pantallas).

**Organización**: sin fase de Setup. Depende de `specs/007-energia-mision-dificultad` (energía/región/dificultad), `specs/010-evolucion-de-gatos` (patrón de "primera vez" derivada).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 [P] `src/data/sagaArcs.ts`: `SagaArc` interface (FR-001, data-entity § SagaArc) + `SAGA_ARCS: SagaArc[]` (fixture mínimo, 1-2 arcos de prueba).
- [X] T002 [P] `src/data/levels.ts`: `Level` += `baseHpTriggers?`, `maxSimultaneousEnemies?`, `treasureId?`, `firstVictoryUnlockCatId?`, `zombieWave?` (todos opcionales, FR-004/006/007/011/013).
- [X] T003 [P] `src/data/cats.ts`: `Cat` += `rarity?: RarityType` (FR-016).
- [X] T004 `src/db/index.ts`: tablas `treasures`/`arcProgress`, `db.version(5)` (plan.md § Storage).
- [X] T005 `src/state/useMetaStore.ts`: `obtainedTreasureIds`/`grantedArcRewardIds` hidratados desde Dexie (depende de T004).

**Checkpoint**: datos y estado listos; sin comportamiento nuevo todavía.

---

## Phase 2: User Story 1 - Costo y fuerza enemiga escalan por arco (Priority: P1) 🎯 MVP

**Goal**: `deployUnit`/`spawnEnemyUnit` aplican el multiplicador del arco activo.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T006 [US1] `src/state/useGameStore.ts` (`deployUnit`): resuelve el arco del `levelId` activo (plan.md Key Design Decision 1) y aplica `costMultiplier` redondeado al costo cobrado (depende de T001, T002).
- [X] T007 [US1] `src/engine/simulation.ts` (`spawnEnemyUnit`): recibe/resuelve el `enemyStrengthMultiplier` del arco activo y lo aplica a `hp`/`maxHp`/`damage`, redondeado (depende de T001, T002).
- [X] T008 [P] [US1] Test Vitest `tests/unit/state/useGameStore.test.ts` (extiende): `deployUnit` cobra el costo multiplicado por el arco del nivel activo; sin arco, cobra el costo base (depende de T006).
- [X] T009 [P] [US1] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): un enemigo generado en un nivel de un arco con `enemyStrengthMultiplier: 4` tiene 4× el `hp`/`damage` del mismo enemigo sin arco (depende de T007).

**Checkpoint**: costo/fuerza escalan por arco — MVP de la spec.

---

## Phase 3: User Story 2 - Oleada de refuerzo por umbral de vida de base (Priority: P2)

**Goal**: `stepSimulation` dispara oleadas de refuerzo al cruzar umbrales de vida de la base enemiga.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T010 [US2] `src/engine/simulation.ts` (`SimState`): + `triggeredBaseHpThresholdPercents: number[]` (efímero, reset en `startLevel`) (plan.md Key Design Decision 2).
- [X] T011 [US2] `src/engine/simulation.ts` (`stepSimulation`): compara `enemyBase.hp` antes/después del tick contra `level.baseHpTriggers` no disparados; genera cada `reinforcementWave` exactamente una vez al cruzar su umbral hacia abajo (depende de T002, T010).
- [X] T012 [US2] `src/state/useGameStore.ts` (`startLevel`): resetea `triggeredBaseHpThresholdPercents: []` (depende de T010).
- [X] T013 [P] [US2] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): un umbral se dispara exactamente una vez al cruzarlo; dos umbrales cruzados en el mismo tick se disparan ambos, cada uno una vez (spec.md Edge Cases) (depende de T011).

**Checkpoint**: oleadas de refuerzo funcionales e independientes de US1.

---

## Phase 4: User Story 3 - Límite de enemigos simultáneos (Priority: P3)

**Goal**: la generación de oleada respeta `maxSimultaneousEnemies`.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T014 [US3] `src/engine/simulation.ts` (`stepSimulation`): antes de generar cada entrada de oleada (`enemyWave` y `reinforcementWave` de US2), cuenta enemigos vivos y retiene la generación si `maxSimultaneousEnemies` ya está alcanzado — sin descartar la entrada, solo posponerla (depende de T002, T011).
- [X] T015 [P] [US3] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): con límite 3 y 3 enemigos vivos, el cuarto no se genera hasta que el conteo baje de 3 (depende de T014).

**Checkpoint**: US1+US2+US3 funcionan juntas.

---

## Phase 5: User Story 4 - Recompensas de victoria: moneda, tesoro, gato (Priority: P1)

**Goal**: cerrar el ciclo de recompensa de nivel existente con tesoro y desbloqueo de gato.

**Independent Test**: spec.md Historia 4.

### Implementation for User Story 4

- [X] T016 [US4] `src/state/useMetaStore.ts`: `grantLevelRewards(levelId): void` — añade `level.treasureId` a `obtainedTreasureIds` (si no estaba) y, si `level.firstVictoryUnlockCatId` no está en `ownedCats`, llama `addOwnedCat` (depende de T002, T005).
- [X] T017 [US4] `src/screens/BattleScreen.tsx` (`BattleOutcomeWatcher`): invoca `grantLevelRewards(level.id)` junto a `addCurrency`/`markLevelCompleted`/`unlockNextLevel` ya existentes (depende de T016).
- [X] T018 [P] [US4] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): `grantLevelRewards` añade el tesoro en cada llamada; añade el gato solo si no estaba ya en `ownedCats` (depende de T016).

**Checkpoint**: recompensas de nivel completas — cierra el hueco de `addOwnedCat` sin invocar.

---

## Phase 6: User Story 5 - Cañón especial "Gatorreta" (Priority: P5)

**Goal**: cañón de recarga/activación manual en la base del jugador.

**Independent Test**: spec.md Historia 5.

### Implementation for User Story 5

- [X] T019 [US5] `src/state/useGameStore.ts`: `GameFields` += `specialCannon: { rechargeRemaining: number; rechargeDurationSeconds: number; areaRadius: number; damage: number }`, inicializado en `startLevel` (plan.md Key Design Decision 3).
- [X] T020 [US5] `src/state/useGameStore.ts` (`tick`): decrementa `specialCannon.rechargeRemaining` junto a `stepSimulation`, sin bajar de 0.
- [X] T021 [US5] `src/state/useGameStore.ts`: `activateSpecialCannon(): boolean` — si `rechargeRemaining > 0` no hace nada y devuelve `false`; si no, aplica `specialCannon.damage` a cada `units` enemiga dentro de `areaRadius` de la base del jugador (reutiliza `withinRange1D`/`PLAYER_BASE_EXTENT` de `src/engine/`) y reinicia `rechargeRemaining` (depende de T019, T020).
- [X] T022 [P] [US5] Test Vitest `tests/unit/state/useGameStore.test.ts` (extiende): activación con recarga completa aplica daño de área y reinicia la recarga; activación mientras recarga no tiene efecto (depende de T021).

**Checkpoint**: sistema opcional, independiente del resto.

---

## Phase 7: User Story 6 - Mejora de regeneración de energía (Priority: P6)

**Goal**: gastar energía acumulada para subir `regenPerSecond` por el resto de la batalla.

**Independent Test**: spec.md Historia 6.

### Implementation for User Story 6

- [X] T023 [US6] `src/state/useGameStore.ts`: `boostEnergyRegen(cost: number, increment: number): boolean` — si `energy.current < cost` devuelve `false` sin mutar; si no, descuenta `cost` y suma `increment` a `energy.regenPerSecond`.
- [X] T024 [P] [US6] Test Vitest `tests/unit/state/useGameStore.test.ts` (extiende): con energía suficiente descuenta y sube `regenPerSecond`; sin energía suficiente no tiene efecto (depende de T023).

**Checkpoint**: mejora de regeneración funcional, independiente del resto.

---

## Phase 8: User Story 7 - Brote Zombi (Priority: P7)

**Goal**: rejugar un nivel superado con elenco zombi, sin jefe.

**Independent Test**: spec.md Historia 7.

### Implementation for User Story 7

- [X] T025 [US7] `src/state/useGameStore.ts` (`startLevel`): acepta un segundo parámetro `zombieMode?: boolean`; si es `true` y `level.zombieWave` existe, usa `zombieWave` en vez de `enemyWave` para toda la resolución de oleada de `stepSimulation` (vía un campo `activeEnemyWave` resuelto una vez en `SimState`, no releído de `LEVELS` en cada tick) (depende de T002).
- [X] T026 [US7] `src/engine/simulation.ts`/`src/state/useGameStore.ts`: con `zombieMode` activo, omite la generación del jefe de arco si el nivel es `bossLevelId` de su `SagaArc` (depende de T001, T025; coordinar con `specs/020-barrera-de-base` si ya implementada).
- [X] T027 [US7] `src/state/useMetaStore.ts` o `src/data/levels.ts`: función `isZombieModeAvailable(levelId): boolean` — `completedLevelIds.includes(levelId) && !!level.zombieWave` (FR-013) (depende de T002).
- [X] T028 [P] [US7] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): en modo zombi, todos los enemigos generados provienen de `zombieWave`, nunca de `enemyWave` (depende de T025).
- [X] T029 [P] [US7] Test Vitest `tests/unit/state/useMetaStore.test.ts` o `useGameStore.test.ts`: `isZombieModeAvailable` es `false` para un nivel no superado o sin `zombieWave` (depende de T027).

**Checkpoint**: siete historias completas.

---

## Phase 9: User Story 8 - Recompensas de finalización de arco (Priority: P8)

**Goal**: otorgar recompensas de arco exactamente una vez al completar todos sus niveles.

**Independent Test**: spec.md Historia 8.

### Implementation for User Story 8

- [X] T030 [US8] `src/state/useMetaStore.ts`: `claimArcRewardsIfComplete(arcId): void` — si todos los `levelIds` del arco están en `completedLevelIds` y `arcId` no está en `grantedArcRewardIds`, añade `unlockCatIds` (vía `addOwnedCat`) y registra `arcId` en `grantedArcRewardIds` (persistido) (depende de T001, T005).
- [X] T031 [US8] `src/screens/BattleScreen.tsx` (`BattleOutcomeWatcher`): tras `markLevelCompleted`, resuelve el arco del nivel ganado e invoca `claimArcRewardsIfComplete` (depende de T030).
- [X] T032 [US8] `src/state/useMetaStore.ts` (`upgradeCat`): calcula el tope vigente (10, o 20 si el segundo `SAGA_ARCS` está en `grantedArcRewardIds`) y rechaza la mejora sin efecto al alcanzarlo (FR-017, plan.md Key Design Decision 5) (depende de T030).
- [X] T033 [P] [US8] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): `claimArcRewardsIfComplete` otorga las recompensas exactamente al completar el último nivel pendiente, nunca dos veces; `upgradeCat` respeta el tope 10→20 (depende de T030, T032).

**Checkpoint**: las ocho historias completas — spec cerrada.

---

## Phase 10: Polish & Cross-Cutting Concerns

- [X] T034 [P] `npx tsc -b` limpio sobre todo el proyecto.
- [X] T035 [P] `npm run test` — suite completa (existente + T008/T009/T013/T015/T018/T022/T024/T028/T029/T033) en verde.
- [ ] T036 Verificación manual en navegador: un arco de prueba con costo/fuerza distintos, un umbral de vida de base, un tesoro+gato de primera victoria, la Gatorreta, la mejora de regeneración, y Brote Zombi sobre un nivel ya superado. **Pendiente**: confirmado por DOM que la app carga y `BattleScreen` renderiza sin errores de consola con todo el código de esta spec integrado (Selección de Nivel, Energía/Base jugador/Base enemiga, DeployBar); el bucle de batalla (rAF/Pixi ticker) no avanza sin composición del panel Browser en este entorno — mismo bloqueo que specs/010 T016 y specs/011 T003. Requiere panel Browser visible del lado del usuario para completar el recorrido de las 8 historias en vivo.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational — MVP.
- **US2 (Fase 3)**: depende de Foundational; independiente de US1.
- **US3 (Fase 4)**: depende de Foundational y de la generación de oleada de US2 (T011) para posponer también `reinforcementWave`.
- **US4 (Fase 5)**: depende de Foundational; independiente de US1-US3.
- **US5 (Fase 6)**: depende de Foundational; independiente del resto.
- **US6 (Fase 7)**: depende de Foundational; independiente del resto.
- **US7 (Fase 8)**: depende de US4 (primera victoria/`completedLevelIds`) y de Foundational (T001 para el jefe de arco).
- **US8 (Fase 9)**: depende de US4 (T016-T017, `markLevelCompleted`) y de Foundational (T001).
- **Polish (Fase 10)**: depende de que las ocho historias estén completas.

## Parallel Opportunities

- T001/T002/T003 (Foundational) en paralelo — archivos distintos.
- US2, US4, US5, US6 pueden desarrollarse en paralelo una vez completada Foundational — no comparten archivos en su núcleo de implementación.
- Todos los tests marcados [P] dentro de cada historia en paralelo entre sí.
- T034/T035 en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational).
2. Completar Fase 2 (US1) — costo/fuerza escalan por arco.
3. **STOP y VALIDAR**: un mismo nivel jugado desde dos arcos distintos produce costo/stats de enemigo distintos.

### Incremental Delivery

1. Foundational → datos y estado listos.
2. + US1 → escalado por arco (MVP).
3. + US2/US3 → dificultad dinámica del nivel (oleadas de refuerzo, límite simultáneo).
4. + US4 → recompensas de nivel completas (tesoro, gato).
5. + US5/US6 → sistemas de batalla opcionales (Gatorreta, boost de regeneración).
6. + US7 → Brote Zombi (depende de US4).
7. + US8 → recompensas de arco (depende de US4) — spec completa.
