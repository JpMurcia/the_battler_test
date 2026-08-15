# Tasks: Motor de Combate Real

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: incluidos — la Constitución § Separación Estricta entre Motor y UI exige que `src/engine/` sea testeable con Vitest sin canvas ni DOM; es el mecanismo de verificación de esta spec.

**Organización**: sin fase de Setup — no hay dependencias nuevas que instalar (mismo stack que `specs/001-nucleo-del-juego/`). Se empieza directo en Foundational.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: a qué historia de usuario de `spec.md` pertenece la tarea

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: el motor de combate puro y su conexión a la store — bloquea las tres historias de usuario, ninguna es demostrable sin esto.

**⚠️ CRITICAL**: ninguna historia de usuario puede empezar hasta que esta fase esté completa.

- [X] T001 [P] `src/engine/collision.ts`: `overlaps1D(a: { x: number; width: number }, b: { x: number; width: number }): boolean` — compara intervalos `[x, x+width]` (research.md Decisión 2)
- [X] T002 [P] `src/engine/combat.ts`: función pura que aplica intercambio de daño entre dos `BattleUnit` según `attackIntervalSeconds`/`attackCooldownRemaining` y `deltaSeconds`, marca `state: 'Dead'` cuando `hp <= 0`
- [X] T003 `src/engine/simulation.ts`: `stepSimulation(state, deltaSeconds)` puro — orquesta T001+T002: mueve unidades `Moving` sin bloqueo, detecta colisión y pasa a `Engaged` (regla de bloqueo de carril de research.md Decisión 3), resuelve combate de unidades `Engaged`, aplica daño directo a base sin bloqueo, regenera energía, spawnea entradas de `enemyWave` cuyo `spawnAtSeconds` ya venció, evalúa `Victory`/`Defeat` y detiene todo movimiento posterior (depende de T001, T002)
- [X] T004 [P] Test Vitest `tests/unit/engine/collision.test.ts`: casos límite de `overlaps1D` (sin overlap, borde exacto, contenido completo)
- [X] T005 [P] Test Vitest `tests/unit/engine/combat.test.ts`: intercambio de daño reduce `hp` de ambas unidades por intervalo; `hp <= 0` transiciona a `Dead`
- [X] T006 Test Vitest `tests/unit/engine/simulation.test.ts`: un paso mueve sin bloqueo, bloquea+combate en colisión, daño directo a base sin unidades bloqueando, regeneración de energía, spawn de oleada en el instante correcto, resolución de `Victory`/`Defeat` que detiene todo movimiento posterior (depende de T003)
- [X] T007 [P] `src/data/levels.ts`: añade `enemyWave: { catId: string; spawnAtSeconds: number }[]` a `Level`, con una oleada de prueba de 2-3 entradas escalonadas usando `catId` de `CATS` (data-model.md § EnemyWave)
- [X] T008 `src/state/useGameStore.ts`: `tick(deltaSeconds)` real — delega en `stepSimulation` (`set(stepSimulation(get(), deltaSeconds))`); añade campos internos `elapsedSeconds`/`enemiesSpawnedCount`, reiniciados en `startLevel()`/`reset()` (depende de T003, T007)
- [X] T009 [P] Test Vitest ampliado en `tests/unit/useGameStore.test.ts`: `tick()` real avanza `elapsedSeconds`, delega en `stepSimulation`, `reset()` limpia los campos nuevos (depende de T008)
- [X] T010 `src/db/index.ts`: `ensureDefaultProfile()` siembra también una fila en `ownedCats` (primer `catId` de `CATS`, `level: 1`) si el roster está vacío al arrancar — cierra FR-011 (data-model.md § PlayerProfile/OwnedCat)
- [X] T011 [P] Test Vitest ampliado en `tests/unit/db.test.ts`: `ensureDefaultProfile()` sobre una base vacía deja al menos un `ownedCats` sembrado, y no duplica en una segunda llamada (depende de T010)

**Checkpoint**: `src/engine/` completo y testeado sin canvas ni DOM; `useGameStore.tick()` ya no es un placeholder; un jugador nuevo siempre tiene un gato en su roster. Ninguna UI todavía refleja esto.

---

## Phase 2: User Story 1 - Jugar una batalla completa de principio a fin (Priority: P1) 🎯 MVP

**Goal**: reemplazar el sprite de prueba de `BattleStage.tsx` por unidades reales del roster del jugador y de la oleada enemiga, movidas y resueltas por el motor de Fase 1 — la batalla es jugable de punta a punta visualmente.

**Independent Test**: entrar a un nivel, desplegar un gato del roster, confirmar que avanza solo, combate al chocar con una unidad enemiga de la oleada o con la base enemiga, y que la batalla termina en victoria o derrota (quickstart.md pasos 1-5).

### Implementation for User Story 1

- [X] T012 [P] [US1] `src/game/UnitSprite.tsx`: `pixiGraphics` — rectángulo relleno por `BattleUnit`, color fijo por `team` (`Player`/`Enemy`), tamaño derivado de `width`/altura de placeholder, posicionado por `x` (research.md Decisión 4 — sin `Assets.load`, excepción de Constitución § III ya declarada en `plan.md`)
- [X] T013 [US1] `src/game/BattleStage.tsx`: reemplaza `TestSprite`/sprite de prueba — el `Ticker` de Pixi llama a `useGameStore.getState().tick(deltaSeconds)` cada frame y renderiza un `UnitSprite` (T012) por cada `BattleUnit` en `useGameStore.getState().units`, leído directamente del `Ticker` (sin suscripción React, Constitución § VI) (depende de T008, T012)
- [X] T014 [US1] `src/screens/BattleScreen.tsx` (además de energía/salud de bases, se añadió `DeployBar` con los gatos del roster — necesario para que US1 sea jugable; no estaba explícito en la redacción original de la tarea): overlay reemplaza los placeholders `—` por energía actual/máxima y salud de ambas bases, vía selectores acotados de `useGameStore` (`useGameStore(state => state.energy)`, etc. — solo esos nodos de UI re-renderizan, nunca `BattleStage`) (depende de T008)
- [X] T015 [US1] Verificación manual en navegador (encontrado y corregido en el camino: bucle infinito de render en `DeployBar` por un selector de Zustand que devolvía un array nuevo cada llamada): `npm run dev`, recorrer quickstart.md pasos 1-5 (energía sube, despliegue avanza solo, colisión/bloqueo/combate contra unidad enemiga de la oleada, daño directo a base sin bloqueo)

**Checkpoint**: la batalla corre de punta a punta visualmente — sin pantalla de resultado poblada con datos reales todavía (eso es US2).

---

## Phase 3: User Story 2 - Ver el resultado y que las recompensas queden guardadas (Priority: P2)

**Goal**: al terminar la batalla, el jugador ve `ResultScreen` con el resultado real, y una victoria otorga moneda/desbloqueo de inmediato en `useMetaStore`.

**Independent Test**: ganar una batalla, confirmar recompensa en `ResultScreen`, volver a `LevelSelectScreen` y confirmar que la moneda/desbloqueo ya están reflejados sin recargar (quickstart.md paso 6).

### Implementation for User Story 2

- [X] T016 [US2] `src/screens/BattleScreen.tsx`: efecto que observa la transición de `useGameStore.status` a `'Victory'`/`'Defeat'` — en `'Victory'` invoca **una sola vez** `useMetaStore.addCurrency(level.currencyReward)`, `useMetaStore.markLevelCompleted(levelId)` y `useMetaStore.unlockNextLevel()`; en `'Defeat'` no invoca ninguna acción de `useMetaStore`; navega a `'Result'` en ambos casos (depende de T013, T014)
- [X] T017 [US2] `src/screens/ResultScreen.tsx`: reemplaza el placeholder — muestra victoria/derrota real (lee `useGameStore.status` antes del `reset()` de salida) y la recompensa de moneda obtenida en victoria; botón vuelve a `LevelSelectScreen` (ya existente) llamando a `useGameStore.reset()` (depende de T016)
- [X] T018 [US2] Verificación manual en navegador: quickstart.md paso 6 (victoria/derrota, recompensa visible, moneda y desbloqueo reflejados en `LevelSelectScreen` sin recargar)

**Checkpoint**: US1 + US2 funcionan juntas — jugar una batalla completa y ver sus consecuencias persistidas.

---

## Phase 4: User Story 3 - Salir de una batalla sin perder progreso guardado (Priority: P3)

**Goal**: confirmar que abandonar o recargar a mitad de una batalla no persiste ningún cambio parcial.

**Independent Test**: entrar a una batalla, desplegar una unidad, salir antes de que termine (o recargar), y confirmar que la moneda y los niveles desbloqueados quedan exactamente como antes (quickstart.md paso 7).

### Implementation for User Story 3

- [X] T019 [US3] Revisar `src/screens/BattleScreen.tsx` § botón "Salir": confirmar que solo llama a `useGameStore.reset()` (efímero, sin Dexie) y **nunca** a ninguna acción de `useMetaStore` fuera del camino de victoria de T016 — ajustar si alguna escritura se cuela fuera de ese camino
- [X] T020 [P] [US3] Test Vitest ampliado en `tests/unit/useGameStore.test.ts`: `reset()` limpia `elapsedSeconds`/`enemiesSpawnedCount`/`units`/`deployCooldowns` a su estado inicial y no deja ninguna unidad activa
- [X] T021 [US3] Verificación manual en navegador: quickstart.md paso 7 (salir a mitad de batalla y recargar la página; progreso persistente sin cambios en ambos casos)

**Checkpoint**: las tres historias de usuario funcionan de forma independiente y en conjunto — la spec está completa.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T022 [P] `npx tsc -b` limpio sobre todo el proyecto
- [X] T023 [P] `npm run test` — suite completa (existente + T004-T006, T009, T011, T020) en verde
- [X] T024 Recorrido final de `quickstart.md` de punta a punta (pasos 1-7 en una sola sesión de navegador, sin recargar entre pasos salvo donde el propio paso lo pida)

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo lo demás. T003 depende de T001+T002; T006 depende de T003; T008 depende de T003+T007; T009 depende de T008; T011 depende de T010.
- **US1 (Fase 2)**: depende de Foundational completo (T008 en particular). T013 depende de T012.
- **US2 (Fase 3)**: depende de US1 (T013, T014) — reutiliza el `BattleScreen` ya conectado a datos reales.
- **US3 (Fase 4)**: depende de US2 (T016) para distinguir el camino de victoria (que sí escribe a `useMetaStore`) del camino de salida/recarga (que no debe escribir nada).
- **Polish (Fase 5)**: depende de que las tres historias estén completas.

## Parallel Opportunities

- Dentro de Foundational: T001/T002 en paralelo (archivos distintos); T004/T005/T007 en paralelo entre sí y con lo anterior que no bloqueen.
- T012 (US1) es paralelizable respecto a cualquier tarea de Foundational que no sea T008.
- T020 (US3) es paralelizable respecto a T019/T021 (archivo de test distinto).
- T022/T023 (Polish) en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational) — motor puro testeado, sin UI.
2. Completar Fase 2 (US1) — batalla jugable de punta a punta visualmente.
3. **STOP y VALIDAR**: recorrer quickstart.md pasos 1-5 antes de continuar.

### Incremental Delivery

1. Foundational → engine testeado, sin UI.
2. + US1 → batalla jugable visualmente (MVP).
3. + US2 → resultado y recompensas persistentes.
4. + US3 → salida/recarga sin corromper progreso — spec completa.
