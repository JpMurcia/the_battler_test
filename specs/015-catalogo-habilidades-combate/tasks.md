# Tasks: Ampliación del Catálogo de Habilidades de Combate

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: Vitest — `tests/unit/engine/combat.test.ts` y `tests/unit/engine/simulation.test.ts`, extendidos.

**Organización**: sin fase de Setup. Depende de `specs/009-clasificacion-habilidades` (`Ability`, `EffectType`, `immuneEffects`, patrón `curseRemainingSeconds`).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 [P] `src/engine/types.ts`: `EffectType` += `'Weaken' | 'Freeze' | 'Slow'`; `AppliesEffect` += `magnitude?: number` (FR-001).
- [X] T002 [P] `src/engine/types.ts`: `BattleUnit` += `weakenRemainingSeconds?`, `freezeRemainingSeconds?`, `slowRemainingSeconds?`, `resistantTo?: { effect: EffectType; durationMultiplier: number }[]` (FR-002, FR-009).
- [X] T003 [P] `src/engine/types.ts`: `Ability` union += `{ kind: 'TraitResistance'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; damageTakenMultiplier: number }` (FR-007).
- [X] T004 `src/engine/combat.ts` (`applyOnHitEffect`): generaliza de "solo Curse" a cualquier `EffectType` de `attacker.appliesEffect`, escribiendo el campo `xRemainingSeconds` correspondiente del defensor; aplica `defender.resistantTo` a la duración antes de escribirla (0 o negativa ⇒ no se aplica); respeta `immuneEffects` sin cambios (plan.md Key Design Decision 2) (depende de T001, T002).
- [X] T005 [P] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): `applyOnHitEffect` sigue aplicando `Curse` exactamente igual que antes (regresión, FR-011); aplica `Weaken`/`Freeze`/`Slow` al campo correcto; respeta `immuneEffects` para los tres nuevos (depende de T004).

**Checkpoint**: tipos y aplicación on-hit listos, sin efecto todavía en movimiento/daño.

---

## Phase 2: User Story 1 - Debilitar (Priority: P1) 🎯 MVP

**Goal**: `weakenRemainingSeconds` reduce el `damage` efectivo del defensor afectado.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T006 [US1] `src/engine/combat.ts` (`resolveEngagement`/`resolveAreaEngagement`/`resolveBaseDamage`): al calcular el daño que inflige una unidad con `weakenRemainingSeconds > 0`, aplica el `magnitude` de reducción configurado (depende de T001, T002).
- [X] T007 [US1] `src/engine/simulation.ts` (`stepSimulation`): decrementa `weakenRemainingSeconds` por tick junto a `curseRemainingSeconds`, sin bajar de 0 (depende de T002).
- [X] T008 [P] [US1] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): una unidad debilitada inflige menos daño que su `damage` base; al expirar, vuelve al daño normal; un segundo impacto antes de expirar refresca sin acumular (FR-008) (depende de T006, T007).

**Checkpoint**: Debilitar funcional — MVP del catálogo.

---

## Phase 3: User Story 2 - Congelar (Priority: P1)

**Goal**: una unidad congelada no se mueve ni ataca.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T009 [US2] `src/engine/simulation.ts` (`stepSimulation`): una unidad con `freezeRemainingSeconds > 0` no entra en `engagements`/`baseAttackers`/`freeMovers` — permanece en su `x` actual, sin decrementar `attackCooldownRemaining` (plan.md Key Design Decision 3) (depende de T002).
- [X] T010 [US2] `src/engine/simulation.ts`: decrementa `freezeRemainingSeconds` por tick, sin bajar de 0; al llegar a 0, la unidad vuelve al flujo normal de `engagements`/movimiento en el mismo tick o el siguiente (depende de T009).
- [X] T011 [P] [US2] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): una unidad congelada no cambia su `x` ni inflige daño durante la duración; retoma su comportamiento normal al expirar; con `immuneEffects` incluyendo `'Freeze'`, no queda congelada (depende de T009, T010).

**Checkpoint**: US1+US2 — los dos efectos priorizados P1 completos.

---

## Phase 4: User Story 3 - Ralentizar (Priority: P2)

**Goal**: `slowRemainingSeconds` reduce la `speed` efectiva en movimiento libre.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T012 [US3] `src/engine/simulation.ts` (bucle de `freeMovers`): calcula `tentativeX` con `unit.speed * slowFactor` si `slowRemainingSeconds > 0` (plan.md Key Design Decision 4); si además `freezeRemainingSeconds > 0`, Congelar prevalece (FR-006, ya cubierto por T009 al excluirla de `freeMovers`) (depende de T002, T009).
- [X] T013 [US3] `src/engine/simulation.ts`: decrementa `slowRemainingSeconds` por tick, sin bajar de 0 (depende de T002).
- [X] T014 [P] [US3] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): una unidad ralentizada avanza menos distancia por tick que sin el efecto; ralentizada + congelada simultáneamente no se mueve (Congelar prevalece); un segundo impacto de Ralentizar antes de expirar no reduce por debajo del ya activo (depende de T012, T013).

**Checkpoint**: los tres efectos de duración completos.

---

## Phase 5: User Story 4 - Fuerte Contra el daño recibido (Priority: P2)

**Goal**: `TraitResistance` reduce el daño recibido de un rasgo declarado.

**Independent Test**: spec.md Historia 4.

### Implementation for User Story 4

- [X] T015 [US4] `src/engine/combat.ts`: `resolveResistanceMultiplier(defender, attacker): number` — busca `TraitResistance` en `defender.abilities` que coincida con la clasificación del `attacker` (misma lógica de match que `resolveAbilityMultiplier`, FR-007) (plan.md Key Design Decision 5) (depende de T003).
- [X] T016 [US4] `src/engine/combat.ts` (`resolveEngagement`/`resolveAreaEngagement`/`resolveBaseDamage`): multiplica el daño final por `resolveResistanceMultiplier(defender, attacker)` además del multiplicador de ataque ya existente (depende de T015).
- [X] T017 [P] [US4] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): una unidad con `TraitResistance` contra un rasgo recibe menos daño de ese rasgo que de otro; sin coincidencia, daño base sin cambio; coexiste sin interferir con `TraitTargeting` del atacante declarado en la misma unidad (depende de T016).

**Checkpoint**: Fuerte Contra (ambos lados: infligido ya existente + recibido nuevo) completo.

---

## Phase 6: User Story 5 - Resistente a un efecto (Priority: P3)

**Goal**: `resistantTo` reduce la duración de un efecto recibido, ya integrado en `applyOnHitEffect` (T004).

**Independent Test**: spec.md Historia 5.

### Implementation for User Story 5

- [X] T018 [P] [US5] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): una unidad con `resistantTo` contra Congelar sufre una duración menor que una sin esa resistencia ante el mismo impacto; con Inmunidad total (`immuneEffects`) ya declarada, el efecto no se aplica en absoluto (Resistencia e Inmunidad son capacidades distintas); una resistencia que deja la duración en ≤0 se comporta como si el efecto no se hubiera aplicado (depende de T004 — comportamiento ya implementado en Foundational, esta tarea solo añade cobertura de test explícita para US5).

**Checkpoint**: las cinco historias completas — spec cerrada.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T019 [P] `npx tsc -b` limpio.
- [X] T020 [P] `npm run test` — suite completa (existente de `src/engine/` sin regresión + T005/T008/T011/T014/T017/T018) en verde.
- [ ] T021 Recorrido manual: unidades de prueba con cada efecto/capacidad nueva enfrentadas en `BattleScreen`, confirmando que ninguna unidad del catálogo base (`specs/001`/`specs/011`) cambia su comportamiento. **Pendiente**: mismo bloqueo de composición del panel Browser que specs/012 T036 — `npx tsc -b` y `npm test` (302/302, incluida cobertura de regresión explícita FR-011) cubren la lógica; los 5 gatos de ejemplo (`frost-cat`/`weaken-cat`/`slow-cat`/`zombie-ward-cat`) ya están en el catálogo real, listos para un recorrido en vivo.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational — MVP.
- **US2 (Fase 3)**: depende de Foundational; independiente de US1.
- **US3 (Fase 4)**: depende de Foundational y de T009 (US2, para la regla de precedencia FR-006).
- **US4 (Fase 5)**: depende de Foundational (T003); independiente de US1-US3.
- **US5 (Fase 6)**: depende de T004 (Foundational) — solo añade cobertura de test sobre comportamiento ya implementado.
- **Polish (Fase 7)**: depende de que las cinco historias estén completas.

## Parallel Opportunities

- T001/T002/T003 (Foundational) en paralelo — mismo archivo (`types.ts`) pero secciones independientes, coordinar al fusionar.
- US1 y US4 en paralelo una vez completada Foundational — tocan funciones distintas de `combat.ts`.
- T019/T020 en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational) — tipos y `applyOnHitEffect` generalizada.
2. Completar Fase 2 (US1) — Debilitar funcional.
3. **STOP y VALIDAR**: una unidad debilitada inflige menos daño y se recupera al expirar.

### Incremental Delivery

1. Foundational → tipos + aplicación on-hit, sin efecto en combate todavía.
2. + US1 → Debilitar (MVP).
3. + US2 → Congelar.
4. + US3 → Ralentizar (con precedencia sobre Congelar ya resuelta).
5. + US4 → Fuerte Contra el daño recibido.
6. + US5 → Resistente — spec completa.
