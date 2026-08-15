# Tasks: Clasificación de Gatos/Enemigos y Habilidades Avanzadas

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: 100% en `src/engine/` puro con Vitest.

**Organización**: sin fase de Setup. Depende de `specs/008-tipos-de-ataque` ya implementada (reutiliza `resolveEngagement`/`resolveAreaEngagement`).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 [P] `src/engine/types.ts`: `BattleUnit` += `classification`, `specialClassification?`, `abilities?`, `immuneEffects?`, `appliesEffect?`, `curseRemainingSeconds: number` (runtime, inicializado en 0 al spawnear). Desviación deliberada: `classification`/`curseRemainingSeconds` quedaron opcionales con fallback (`?? 'Traitless'` / `?? 0`) en vez de requeridos, igual patrón que `attackType` en specs/008, para no romper `makeUnit()` de tests existentes.
- [X] T002 [P] `src/data/cats.ts`: `Cat` += los mismos campos de datos (sin `curseRemainingSeconds`, que es solo runtime); los 4 gatos existentes reciben `classification: 'Traitless'` sin tipo especial ni habilidades.
- [X] T003 `src/engine/combat.ts`: `resolveAbilityMultiplier(attacker: BattleUnit, defender: BattleUnit): number` (plan.md § Key Design Decision, punto 1) (depende de T001).
- [X] T004 [P] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): `resolveAbilityMultiplier` — `Neutral` siempre coincide, `TraitTargeting` solo con la clasificación declarada, devuelve `1` si el atacante está `Cursed` (depende de T003). El test de US4 detectó un bug real en la primera implementación (un defensor con `specialClassification` seguía siendo alcanzado si su clasificación estándar coincidía) — corregido: con `specialClassification` presente, solo cuenta la inclusión explícita de ese tipo especial.

**Checkpoint**: tipos y multiplicador listos; `resolveEngagement` todavía no lo usa.

---

## Phase 2: User Story 1 - Clasificar gatos y enemigos (Priority: P1) 🎯 MVP

**Goal**: datos de clasificación presentes y por-defecto seguros.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T005 [US1] Test Vitest `tests/unit/engine/combat.test.ts` (extiende T004): un `BattleUnit` sin `classification` declarada explícitamente en el fixture de test se comporta como `'Traitless'` (depende de T001, T002).

**Checkpoint**: clasificación presente sin romper nada — base para las historias siguientes.

---

## Phase 3: User Story 2 - Trait-targeting solo afecta al tipo declarado (Priority: P1)

**Goal**: el multiplicador de daño se aplica en la resolución real de combate.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T006 [US2] `src/engine/combat.ts`: `resolveEngagement` multiplica `damageToA`/`damageToB` por `resolveAbilityMultiplier(atacante, defensor)` antes de restar `hp` (depende de T003).
- [X] T007 [US2] `src/engine/combat.ts`/`resolveAreaEngagement` (de `specs/008-tipos-de-ataque`): aplica el mismo multiplicador por objetivo (primario y splash), cada uno evaluado contra su propia clasificación (depende de T003).
- [X] T008 [US2] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): una unidad con `TraitTargeting` contra su tipo objetivo aplica el multiplicador; contra otro tipo, no (depende de T006).

**Checkpoint**: US1 + US2 — trait-targeting funcional en combate real.

---

## Phase 4: User Story 3 - Neutral ability afecta a cualquier enemigo (Priority: P2)

**Goal**: confirmar `Neutral` coincide siempre, incluidos tipos especiales.

**Independent Test**: spec.md Historia 3 — ya cubierta estructuralmente por T004/T008; esta fase añade el caso explícito con tipo especial.

### Implementation for User Story 3

- [X] T009 [US3] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): una habilidad `Neutral` aplica su multiplicador contra un defensor con `specialClassification` (depende de T006).

**Checkpoint**: `Neutral` verificado explícitamente contra tipos especiales.

---

## Phase 5: User Story 4 - Tipo especial excluido de "contra todos" (Priority: P2)

**Goal**: `TraitTargeting` "contra todos los estándar" no alcanza tipos especiales salvo inclusión explícita.

**Independent Test**: spec.md Historia 4.

### Implementation for User Story 4

- [X] T010 [US4] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): `targetClassifications` con solo tipos estándar no coincide contra un defensor con `specialClassification`; incluir ese tipo especial explícitamente sí coincide (depende de T003).

**Checkpoint**: las 4 primeras historias completas.

---

## Phase 6: User Story 5 - Inmunidades y Curse (Priority: P3)

**Goal**: `Curse` se aplica on-hit, deshabilita habilidades mientras dura, respeta inmunidad, y decae con el tiempo.

**Independent Test**: spec.md Historia 5.

### Implementation for User Story 5

- [X] T011 [US5] `src/engine/combat.ts`: en `resolveEngagement`/`resolveAreaEngagement`, tras aplicar daño, si `attacker.appliesEffect?.type === 'Curse'` y `!defender.immuneEffects?.includes('Curse')`, fija `defender.curseRemainingSeconds = appliesEffect.durationSeconds` (plan.md § Key Design Decision, punto 2) (depende de T006, T007).
- [X] T012 [US5] `src/engine/simulation.ts` (`stepSimulation`): decrementa `curseRemainingSeconds` de toda unidad viva por `deltaSeconds`, con piso en 0 — mismo patrón que `attackCooldownRemaining` (depende de T001).
- [X] T013 [US5] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): aplicar `Curse` sobre una unidad inmune no activa `curseRemainingSeconds`; sobre una no inmune, sí, y mientras `curseRemainingSeconds > 0` sus habilidades no aplican multiplicador (depende de T003, T011).
- [X] T014 [US5] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): `curseRemainingSeconds` decrece por tick y llega a 0 sin quedar negativo (depende de T012).

**Checkpoint**: las cinco historias completas — spec cerrada.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T015 [P] `npx tsc -b` limpio.
- [X] T016 [P] `npm test` — suite completa (existente de `specs/002`/`specs/003`/`specs/008` sin modificarse + nuevos tests) en verde. 109/109.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational.
- **US2 (Fase 3)**: depende de Foundational; integra el multiplicador en la resolución real.
- **US3/US4 (Fases 4-5)**: dependen de US2 (mismo mecanismo, casos de prueba adicionales) — paralelizables entre sí.
- **US5 (Fase 6)**: depende de US2 (T006/T007) y de Foundational (T001).
- **Polish (Fase 7)**: depende de que las cinco historias estén completas.

## Parallel Opportunities

- T001/T002 en paralelo (Foundational).
- US3 (Fase 4) y US4 (Fase 5) en paralelo una vez completada US2.
- T015/T016 en paralelo.
