# Tasks: Catálogo de Habilidades de Combate — Golpe Letal, Killers, Escudo e Invocar

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: Vitest — `tests/unit/engine/combat.test.ts` y `tests/unit/engine/simulation.test.ts`, extendidos.

**Organización**: depende de `specs/009-clasificacion-habilidades` (`Ability`, matching de rasgo), `specs/015-catalogo-habilidades-combate` (`TraitResistance`, patrón de extensión) y `specs/016-multigolpe-critico` (`random` inyectado, `criticalChance`).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 [P] `src/engine/types.ts`: `Ability` union += `MassiveDamage` (`{ kind: 'MassiveDamage'; chance: number; damageMultiplier: number }`, FR-001), `TraitKiller` (`{ kind: 'TraitKiller'; targetClassifications: (ClassificationType | SpecialClassificationType)[]; chance: number }`, FR-002), `Shield` (`{ kind: 'Shield'; shieldHp: number }`, FR-003), `SummonOnDeath` (`{ kind: 'SummonOnDeath'; summonCatId: string; count: number }`, FR-005); `BattleUnit` += `shieldRemainingHp?: number` (FR-004).
- [X] T002 [P] `src/engine/simulation.ts`: extrae `spawnUnitFromCat(catId, team, x, enemyStrengthMultiplier, unitSpeedMultiplier)` con el mapeo completo de campos (research.md Decisión 3) — `hp`/`damage` solo se escalan por `enemyStrengthMultiplier` cuando `team === 'Enemy'`; inicializa `shieldRemainingHp` desde `cat.abilities?.find(a => a.kind === 'Shield')?.shieldHp` (FR-003); `spawnEnemyUnit` se conserva como envoltorio delgado que resuelve `x = laneLength - cat.width` y delega en `spawnUnitFromCat` — ambos call sites del spawn de oleada quedan sin cambios (depende de T001).
- [X] T003 [P] `src/state/useGameStore.ts` (`deployUnit`): junto a `curseRemainingSeconds: 0`, agrega `shieldRemainingHp: abilities?.find(a => a.kind === 'Shield')?.shieldHp` (FR-003) (depende de T001).
- [X] T004 [P] Regresión verificada: la suite existente de `tests/unit/engine/simulation.test.ts` (specs/012 US1/FR-003/FR-004, specs/017 US2/FR-008 — escalado por `enemyStrengthMultiplier`, `unitSpeedMultiplier`, conteos de oleada) pasa sin cambios tras la generalización de T002 — 58/58 en verde, sin necesidad de test nuevo (depende de T002).

**Checkpoint**: tipos listos y ambos puntos de creación de unidad preparados para `shieldRemainingHp`; sin ninguna capacidad nueva resolviéndose en combate todavía.

---

## Phase 2: User Story 1 - Golpe Letal (Priority: P1) 🎯 MVP

**Goal**: una unidad con `MassiveDamage` inflige, con la probabilidad configurada, un múltiplo alto de su daño normal.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T005 [US1] `src/engine/combat.ts`: agrega `findMassiveDamage(attacker): Extract<Ability, { kind: 'MassiveDamage' }> | undefined` (devuelve `undefined` si `attacker.curseRemainingSeconds > 0`, FR-007); en `applyDamageSequence`, tras calcular `baseAmount` (daño con `TraitTargeting`/`TraitResistance`/Debilitar ya aplicados) y antes del roll de `Critical` existente, aplica el roll de `MassiveDamage` con el `random` ya inyectado (FR-001, FR-006) (depende de T001).
- [X] T006 [US1] `src/engine/combat.ts` (`resolveAreaEngagement`): replica el mismo roll de `MassiveDamage` en el cálculo de daño de `splashTargets` (depende de T005).
- [X] T006b [US1] `src/engine/combat.ts` (`resolveBaseDamage`): agrega el mismo roll de `MassiveDamage` antes del roll de `Critical` ya existente — mismo alcance que `Critical`, que ya se resuelve contra bases (FR-001, spec.md Historia 1 Escenario 4) (depende de T005).
- [X] T007 [P] [US1] `src/data/cats.ts`: asigna `{ kind: 'MassiveDamage', chance: 0.05, damageMultiplier: 3 }` a una unidad de daño único ya existente (data-model.md).
- [X] T008 [P] [US1] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): con `random` inyectado que siempre acierta, el daño infligido es `damage * damageMultiplier`; con `random` que siempre falla, daño normal; en una secuencia `MultiHit`, cada golpe hace su propio roll independiente (FR-006); un atacante `Cursed` con `MassiveDamage` nunca lo aplica (FR-007); el mismo roll aplica atacando la base (FR-001 Escenario 4) (depende de T005, T006, T006b).

**Checkpoint**: Golpe Letal funcional — MVP del catálogo avanzado.

---

## Phase 3: User Story 2 - Killers de rasgo (Priority: P1)

**Goal**: una unidad con `TraitKiller` elimina instantáneamente, con la probabilidad configurada, a un enemigo de alguno de los rasgos declarados.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T009 [US2] `src/engine/combat.ts`: agrega `findMatchingTraitKiller(attacker, defender): Extract<Ability, { kind: 'TraitKiller' }> | undefined` (mismo algoritmo de matching/exclusión de tipos especiales que `resolveAbilityMultiplier`; devuelve `undefined` si `attacker.curseRemainingSeconds > 0`, FR-007); en `applyDamageSequence`, tras el roll de `Critical`, si el roll de `TraitKiller` acierta, `defender.hp = 0` y se omite la resta de daño normal/escudo de ese golpe (FR-002, FR-006) (depende de T005, T006 — mismo bloque de función).
- [X] T010 [US2] `src/engine/combat.ts` (`resolveAreaEngagement`): replica el mismo roll de `TraitKiller` en `splashTargets` (depende de T009, T006).
- [X] T011 [P] [US2] `src/data/cats.ts`: asigna `{ kind: 'TraitKiller', targetClassifications: ['Zombie'], chance: 0.15 }` y `{ kind: 'TraitKiller', targetClassifications: ['Metal'], chance: 0.15 }` a dos unidades ya existentes distintas (Zombie Killer / Metálico Killer, spec.md Assumptions).
- [X] T012 [P] [US2] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): contra un objetivo del rasgo declarado, con `random` que acierta, `hp` queda en 0 pese a tener vida alta; contra un rasgo distinto, nunca se activa aunque `random` acierte; un atacante `Cursed` con `TraitKiller` nunca lo aplica (FR-007) (depende de T009, T010).

**Checkpoint**: US1+US2 — las dos capacidades priorizadas P1 completas.

---

## Phase 4: User Story 3 - Escudo (Priority: P2)

**Goal**: `shieldRemainingHp` absorbe daño entrante antes que `hp`.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T013 [US3] `src/engine/combat.ts` (`applyDamageSequence`): en la rama donde `TraitKiller` no se activó, descuenta primero de `defender.shieldRemainingHp` (sin bajar de 0) y solo el excedente de `finalDamage` se aplica a `defender.hp` (FR-004) (depende de T009).
- [X] T014 [US3] `src/engine/combat.ts` (`resolveAreaEngagement`): replica la misma absorción de escudo en `splashTargets` (depende de T013, T010).
- [X] T015 [P] [US3] `src/data/cats.ts`: asigna `{ kind: 'Shield', shieldHp: 100 }` a una unidad de vida baja ya existente.
- [X] T016 [P] [US3] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): un golpe menor al escudo no reduce `hp`; un golpe mayor al escudo restante agota el escudo a 0 y aplica el excedente a `hp` en el mismo golpe; con el escudo ya agotado, se comporta como sin `Shield`; una unidad nueva (`spawnUnitFromCat`/`deployUnit`, T002/T003) siempre inicia con `shieldRemainingHp` completo (FR-009 — no arrastra consumo de una instancia anterior) (depende de T013, T014, T002, T003).

**Checkpoint**: Escudo funcional.

---

## Phase 5: User Story 4 - Invocar (Priority: P3)

**Goal**: al morir, una unidad con `SummonOnDeath` genera nuevas unidades aliadas en su posición.

**Independent Test**: spec.md Historia 4.

### Implementation for User Story 4

- [X] T017 [US4] `src/engine/simulation.ts` (`stepSimulation`): inmediatamente antes del filtro `units = ...filter(u => u.state !== 'Dead')`, recorre `byId.values()` buscando unidades `state === 'Dead'` con `SummonOnDeath` en `abilities` y `curseRemainingSeconds <= 0` al momento de morir (FR-007); por cada una, genera `count` unidades vía `spawnUnitFromCat(summonCatId, unit.team, unit.x, enemyStrengthMultiplier, state.unitSpeedMultiplier)` (T002) y las agrega al `units` resultante (FR-005) (depende de T002).
- [X] T018 [P] [US4] `src/data/cats.ts`: asigna `{ kind: 'SummonOnDeath', summonCatId: '<catId barato ya existente>', count: 1 }` a una unidad ya existente.
- [X] T019 [P] [US4] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): una unidad con `SummonOnDeath` que muere en un tick deja, en el `units` resultante de ese mismo tick, la unidad aliada configurada en su posición y equipo, capaz de actuar desde el tick siguiente; una unidad `Cursed` con `SummonOnDeath` que muere no invoca nada (FR-007); tras `reset()` no quedan invocaciones huérfanas (depende de T017).

**Checkpoint**: las cuatro historias completas — spec cerrada.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 [P] `npx tsc -b` limpio.
- [X] T021 [P] `npm test` — suite completa (existente + T004/T008/T012/T016/T019) en verde, sin regresión (SC-005/SC-006).
- [X] T022 Recorrido manual siguiendo `quickstart.md` § Validación manual en navegador: cada unidad semilla nueva (Golpe Letal/Killer/Escudo/Invocar) desplegada en una batalla real, confirmando el efecto esperado y que ninguna unidad del catálogo base cambia su comportamiento. **Verificado**: equipo real (`basic-cat` + los 5 gatos nuevos) desplegado en `imperio-cap1-etapa-1`; `UnitDetailPanel` muestra correctamente "Golpe Letal (5%, x3)", "Killer contra Zombie (15%)", "Escudo (100 HP)"; Gato Golpe Certero desplegado en la base enemiga bajó su HP de 800 a 126 en pocos ticks (roll de MassiveDamage vivo en `resolveBaseDamage`); Gato Escudo y Gato Cazazombis combatieron sin errores; batalla resuelta en Victoria sin errores de consola. `npx tsc -b` y `npm test` (77/77 archivos, 776/776 tests) en verde.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational (T001) — MVP.
- **US2 (Fase 3)**: depende de US1 (T005/T006 — mismo bloque de `applyDamageSequence`/`resolveAreaEngagement`), no de su seed/test.
- **US3 (Fase 4)**: depende de US2 (T009/T010, mismo motivo) y de Foundational (T002/T003, init de `shieldRemainingHp`).
- **US4 (Fase 5)**: depende solo de Foundational (T002) — independiente de US1-US3 (no toca `combat.ts`), podría implementarse en paralelo con las Fases 2-4.
- **Polish (Fase 6)**: depende de que las cuatro historias estén completas.

## Parallel Opportunities

- T001/T002/T003 (Foundational) en paralelo — archivos distintos.
- Fase 5 (US4) completa en paralelo con Fases 2-4 (US1-US3) una vez terminada Foundational — no comparte ninguna función.
- T007/T008 (US1), T011/T012 (US2), T015/T016 (US3), T018/T019 (US4): seed data y test de cada historia en paralelo entre sí una vez lista su implementación.
- T020/T021 en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational) — tipos y ambos puntos de creación de unidad listos.
2. Completar Fase 2 (US1) — Golpe Letal funcional.
3. **STOP y VALIDAR**: una unidad con Golpe Letal inflige, en una fracción de sus golpes cercana a la probabilidad configurada, varias veces su daño normal.

### Incremental Delivery

1. Foundational → tipos + creación de unidad lista, sin capacidad nueva resolviéndose todavía.
2. + US1 → Golpe Letal (MVP).
3. + US2 → Killers de rasgo.
4. + US3 → Escudo.
5. + US4 → Invocar (implementable en paralelo con 3-4 si se prioriza así) — spec completa.
