# Tasks: Tipos de Ataque (Attack Types)

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: 100% en `src/engine/` puro con Vitest, sin canvas ni DOM — mismo patrón que `specs/002-motor-de-combate`.

**Organización**: sin fase de Setup.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: tipos de datos y detección de rango genérica — bloquean todas las historias.

- [X] T001 [P] `src/engine/types.ts`: `BattleUnit` += `attackType: 'Single' | 'Area' | 'LongRange'`, `attackRange: number`, `areaRadius?: number`.
- [X] T002 [P] `src/data/cats.ts`: `Cat` += los mismos campos; los 4 gatos existentes reciben `attackType: 'Single'`, `attackRange: 0` (equivalente a solo-superposición, plan.md § Compatibilidad retroactiva).
- [X] T003 `src/engine/collision.ts`: `withinRange1D(a: Extent, b: Extent, range: number): boolean` — superposición extendida por `range` en ambos bordes; con `range = 0` es idéntica a `overlaps1D` (depende de T001).
- [X] T004 [P] Test Vitest `tests/unit/engine/collision.test.ts` (extiende): `withinRange1D` con `range = 0` coincide con `overlaps1D`; con `range > 0` detecta candidatos no superpuestos dentro de esa distancia (depende de T003).

**Checkpoint**: tipos y detección de rango listos, `stepSimulation` todavía no los usa.

---

## Phase 2: User Story 2 - Un ataque Único solo golpea a un enemigo (Priority: P1) 🎯 MVP (compatibilidad)

**Goal**: reemplazar la detección actual por `findTargetsInRange` sin cambiar el resultado observable para `'Single'` — es el caso base que garantiza no-regresión.

**Independent Test**: spec.md Historia 2; además, la suite existente de `specs/002-motor-de-combate` (`simulation.test.ts`) debe seguir en verde sin modificarse.

### Implementation for User Story 2

- [X] T005 [US2] `src/engine/simulation.ts`: nueva función `findTargetsInRange(unit, candidates): BattleUnit[]` — para `'Single'`, devuelve como máximo el candidato más cercano que cumple `withinRange1D(unit, candidate, unit.attackRange)` (depende de T003).
- [X] T006 [US2] `src/engine/simulation.ts`: reemplaza la búsqueda de oponente actual (`alive.find(...)`) por `findTargetsInRange` en la fase de detección de `stepSimulation`, manteniendo el resto del flujo (engagement/base/free movers) sin cambios de estructura (depende de T005).
- [X] T007 [US2] Test Vitest `tests/unit/engine/simulation.test.ts` (existente, sin modificar): confirma que sigue pasando tal cual, verificando compatibilidad retroactiva con `attackType: 'Single'`/`attackRange: 0` (depende de T006). Confirmado: 20/20 tests de `src/engine/` en verde sin modificar el archivo.

**Checkpoint**: el motor generalizado se comporta igual que antes para `'Single'` — base segura para las historias siguientes.

---

## Phase 3: User Story 1 - Un ataque de Área daña a varios enemigos agrupados (Priority: P1)

**Goal**: `'Area'` daña a todos los enemigos dentro de `areaRadius` del objetivo primario en el mismo tick.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T008 [US1] `src/engine/combat.ts`: `resolveAreaEngagement(attacker: BattleUnit, primaryTarget: BattleUnit, splashTargets: BattleUnit[], deltaSeconds: number)` — aplica el mismo daño de `attacker` a `primaryTarget` y a cada `splashTargets[i]` en el mismo tick de cooldown vencido, sin duplicar el cooldown del atacante (depende de T001).
- [X] T009 [US1] `src/engine/simulation.ts`: `findTargetsInRange` para `'Area'` devuelve `[primario, ...splash]`, donde `splash` son enemigos con `withinRange1D(primario, candidate, unit.areaRadius)` distintos del primario (depende de T005).
- [X] T010 [US1] `src/engine/simulation.ts`: en la fase de resolución de daño, si `unit.attackType === 'Area'` y hay más de un objetivo, usa `resolveAreaEngagement`; si no, usa `resolveEngagement` (comportamiento actual) (depende de T008, T009).
- [X] T011 [US1] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): `resolveAreaEngagement` daña a todos los objetivos en el mismo tick con el `damage` del atacante (depende de T008).
- [X] T012 [US1] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): con 3 enemigos agrupados dentro de `areaRadius`, una unidad `Area` los daña a los 3 en el mismo `stepSimulation` (depende de T010).

**Checkpoint**: US1 + US2 — Área y Único funcionan de forma independiente y compatible.

---

## Phase 4: User Story 3 - Larga Distancia alcanza más allá del más cercano (Priority: P2)

**Goal**: `'LongRange'` selecciona el objetivo más lejano dentro de `attackRange`, no el más cercano.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T013 [US3] `src/engine/simulation.ts`: `findTargetsInRange` para `'LongRange'` — entre los candidatos dentro de `attackRange`, devuelve el de mayor distancia a `unit` (plan.md § Key Design Decision, punto 1) (depende de T005).
- [X] T014 [US3] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): con enemigos escalonados en X dentro de `attackRange`, una unidad `LongRange` daña al más lejano, no al más cercano (depende de T013).

**Checkpoint**: los tres tipos de ataque funcionan de forma independiente.

---

## Phase 5: User Story 4 - Simetría jugador/enemigo (Priority: P2)

**Goal**: confirmar que `findTargetsInRange`/`resolveAreaEngagement` no distinguen `team` — ya es cierto por construcción (mismas funciones para ambos equipos), esta fase solo lo verifica explícitamente.

**Independent Test**: spec.md Historia 4.

### Implementation for User Story 4

- [X] T015 [US4] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): un enemigo `Area` contra varias unidades del jugador agrupadas las daña a todas, igual que en US1 pero con equipos invertidos (depende de T010).

**Checkpoint**: las cuatro historias completas — spec cerrada.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T016 [P] `npx tsc -b` limpio.
- [X] T017 [P] `npm test` — suite completa (existente de `specs/002`/`specs/003` sin modificarse + nuevos tests) en verde.
- [X] T018 Verificación en navegador: desplegadas 6+ unidades reales en batalla con el motor generalizado, base enemiga dañada correctamente (1000→750) tras varios ciclos de combate, sin errores de consola. El roster jugable actual no expone gatos `Area`/`LongRange` (los 4 existentes son `Single` por FR-002/compatibilidad), por lo que la carga real con tipos mixtos queda cubierta por los tests de `stepSimulation` (T012/T014/T015), no por este recorrido manual.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo lo demás.
- **US2 (Fase 2)**: depende de Foundational; es el caso base de no-regresión, se implementa primero aunque su prioridad de negocio sea igual a US1.
- **US1 (Fase 3)**: depende de US2 (reutiliza `findTargetsInRange` ya generalizado).
- **US3 (Fase 4)**: depende de US2, independiente de US1.
- **US4 (Fase 5)**: depende de US1 (reutiliza el mismo mecanismo, solo cambia el equipo probado).
- **Polish (Fase 6)**: depende de que las cuatro historias estén completas.

## Parallel Opportunities

- T001/T002 en paralelo (Foundational).
- US3 (Fase 4) puede desarrollarse en paralelo a US1 (Fase 3) una vez completada US2 — tocan la misma función pero ramas de `switch` independientes por `attackType`.
- T016/T017 en paralelo.
