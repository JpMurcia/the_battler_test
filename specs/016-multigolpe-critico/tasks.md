# Tasks: Extensión de Tipos de Ataque — Multi-Golpe y Crítico

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: Vitest — `tests/unit/engine/combat.test.ts`/`simulation.test.ts`, extendidos, con RNG sembrado.

**Organización**: sin fase de Setup. Depende de `specs/008-tipos-de-ataque` (`AttackType`, `findTargetsInRange`) y `specs/015-catalogo-habilidades-combate` (orden de multiplicadores de daño).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 [P] `src/engine/types.ts`: `AttackType` += `'MultiHit' | 'Critical'` (FR-001, sin reordenar los 3 valores existentes).
- [X] T002 [P] `src/engine/types.ts`: `BattleUnit` += `hitsPerSequence?`, `criticalChance?`, `multiHitProgress?` (FR-002, FR-006).
- [X] T003 `src/engine/combat.ts`: añade parámetro `random: () => number = Math.random` a `resolveEngagement`/`resolveAreaEngagement`/`resolveBaseDamage` (FR-010, plan.md Key Design Decision 1) — sin cambiar el resultado para llamadores que no lo pasan explícitamente.

**Checkpoint**: tipos y firma de RNG listos, sin comportamiento nuevo todavía.

---

## Phase 2: User Story 1 - Multi-Golpe inflige varios impactos (Priority: P1) 🎯 MVP

**Goal**: una unidad `MultiHit` aplica `hitsPerSequence` impactos independientes por secuencia.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T004 [US1] `src/engine/combat.ts` (`resolveEngagement`): cuando el atacante tiene `attackType === 'MultiHit'` y su cooldown vence, aplica `hitsPerSequence` reducciones sucesivas de `hp` al defensor en la misma invocación, deteniéndose si `hp` llega a 0 a mitad del bucle (plan.md Key Design Decision 2/3) (depende de T001, T002).
- [X] T005 [US1] `src/engine/combat.ts` (`resolveAreaEngagement`/`resolveBaseDamage`): mismo tratamiento de `MultiHit` para el objetivo primario/la base, consistente con T004 (depende de T004).
- [X] T006 [P] [US1] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): una unidad `MultiHit` con `hitsPerSequence: 3` inflige exactamente 3 impactos independientes por secuencia sin interrupción; sin objetivo en rango, no inflige nada (depende de T004).

**Checkpoint**: Multi-Golpe funcional — MVP.

---

## Phase 3: User Story 2 - Secuencia interrumpida no deja golpes pendientes (Priority: P2)

**Goal**: confirmar que la resolución atómica de T004 ya satisface FR-004/FR-005 sin estado adicional.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T007 [US2] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): un objetivo con `hp` suficiente para morir a mitad de una secuencia `MultiHit` de N golpes no recibe más de los golpes necesarios para llegar a 0, y ningún golpe restante se aplica a otro objetivo en la misma invocación (depende de T004).
- [X] T008 [P] [US2] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende): una unidad `MultiHit` que pierde a su objetivo (destruido o fuera de rango) y adquiere uno nuevo en un tick posterior inicia una secuencia completa de N golpes contra el nuevo objetivo, no una parcial (depende de T004, `specs/008` `findTargetsInRange`).

**Checkpoint**: US1+US2 — Multi-Golpe completo.

---

## Phase 4: User Story 3 - Crítico con probabilidad configurable (Priority: P1)

**Goal**: `criticalChance` duplica el daño con la probabilidad configurada, usando el RNG inyectado.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T009 [US3] `src/engine/combat.ts`: al resolver el daño final de un atacante con `attackType === 'Critical'`, si `random() < criticalChance` duplica el daño ya calculado por `resolveAbilityMultiplier`/`resolveResistanceMultiplier` (`specs/015`) (plan.md Key Design Decision 4) (depende de T002, T003).
- [X] T010 [P] [US3] Test Vitest `tests/unit/engine/combat.test.ts` (extiende): `criticalChance: 1` con `random: () => 0` siempre duplica; `criticalChance: 0` con cualquier `random` nunca duplica; `criticalChance: 0.5` con un RNG sembrado sobre 100 ataques produce entre 35 y 65 golpes críticos (depende de T009).

**Checkpoint**: las tres historias completas — spec cerrada.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T011 [P] `npx tsc -b` limpio.
- [X] T012 [P] `npm run test` — suite completa (existente de `src/engine/` sin regresión + T006/T007/T008/T010) en verde.
- [ ] T013 Recorrido manual: una unidad `MultiHit` y una `Critical` de prueba enfrentadas en `BattleScreen`, confirmando que `'Single'`/`'Area'`/`'LongRange'` existentes no cambian su comportamiento. **Pendiente**: mismo bloqueo de composición del panel Browser que specs/012 T036 — `npx tsc -b` y `npm test` (311/311) cubren la lógica; `triple-strike-cat`/`lucky-cat` ya están en el catálogo real.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational — MVP.
- **US2 (Fase 3)**: depende de US1 (T004, misma resolución atómica).
- **US3 (Fase 4)**: depende de Foundational; independiente de US1/US2.
- **Polish (Fase 5)**: depende de que las tres historias estén completas.

## Parallel Opportunities

- T001/T002 (Foundational) en paralelo.
- US3 en paralelo a US1/US2 una vez completada Foundational — toca una ruta de cálculo de daño distinta.
- T011/T012 en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational) — tipos y firma de RNG.
2. Completar Fase 2 (US1) — Multi-Golpe funcional.
3. **STOP y VALIDAR**: una unidad `MultiHit` inflige exactamente N impactos por secuencia.

### Incremental Delivery

1. Foundational → tipos listos, sin comportamiento nuevo.
2. + US1 → Multi-Golpe (MVP).
3. + US2 → robustez ante interrupción (ya cubierta por la resolución atómica, solo test).
4. + US3 → Crítico — spec completa.
