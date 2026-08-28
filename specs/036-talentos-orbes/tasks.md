---

description: "Task list for feature 036-talentos-orbes"
---

# Tasks: Talentos y Orbes

**Input**: Design documents from `/specs/036-talentos-orbes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Incluidos.

**Organization**: Foundational bloquea todo. US1 (Resistencia a Debuff) y US2 (Aumento de Estadísticas) son P1 pero independientes entre sí — se implementan en fases separadas porque cada una tiene su propio dato/acción/sección de UI, aunque compartan el mismo archivo `UnitDetailPanel.tsx`. US3 (Orbe) es P2, mismo patrón.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Single-project: `src/`, `tests/` en la raíz.

---

## Phase 1: Setup

- [X] T001 Ejecutar `npx tsc -b` y `npm test` y confirmar línea base en verde

---

## Phase 2: Foundational — catálogo, campo de persistencia y helper de elegibilidad

- [X] T002 [P] Crear `tests/unit/data/talents.test.ts`: `getTalentPointCost` crece con los puntos ya invertidos (100/200/300...); `getDebuffResistanceMultiplier`/`getStatBoostMultiplier`/`getOrbDamageMultiplier` devuelven 1 en 0 puntos y el valor tope correcto en `MAX_TALENT_POINTS` (0.5 / 1.10 / 1.20 respectivamente); `isTalentEligible` es `true` solo con `evolutionStage === 'True'` y `rarity` en `['Megarraro','Legendario']`, `false` en cualquier otra combinación — confirmar que fallan (el archivo no existe)
- [X] T003 Crear `src/data/talents.ts` según data-model.md
- [X] T004 Ejecutar `tests/unit/data/talents.test.ts` y confirmar que T002 pasa
- [X] T005 En `src/db/index.ts`: añadir `talents?: CatTalents` a `OwnedCatRow` (import de tipo desde `src/data/talents.ts`) — sin bump de versión (data-model.md)
- [X] T006 [P] Añadir casos a `tests/unit/useMetaStore.test.ts`: `hydrate()` sobre una fila `ownedCats` sin `talents` deja `ownedCats[catId].talents` como `undefined`; sobre una fila con `talents` ya persistido, lo reproduce sin alterarlo — confirmar que fallan
- [X] T007 En `src/state/useMetaStore.ts`: añadir `talents?: CatTalents` a `OwnedCatMeta`, y en `hydrate()`, copiar `talents: row.talents` al construir cada `OwnedCatMeta`
- [X] T008 Ejecutar `tests/unit/useMetaStore.test.ts` y confirmar que T006 pasa y que ninguna prueba existente se rompe

**Checkpoint**: Catálogo y campo de persistencia listos — sin acciones de inversión ni efecto en batalla todavía.

---

## Phase 3: User Story 1 - Resistencia a Debuff (Priority: P1) 🎯 MVP

**Goal**: Invertir NP en Resistencia a Debuff para un gato elegible, y que la unidad desplegada reciba la resistencia correspondiente.

**Independent Test**: Invertir un punto en Resistencia a Debuff eligiendo "Congelar", desplegar la unidad, y confirmar que su `resistantTo` incluye `{ effect: 'Freeze', durationMultiplier: 0.9 }`.

### Tests for User Story 1

- [X] T009 [P] [US1] Añadir casos a `tests/unit/useMetaStore.test.ts`: `investDebuffResistanceTalent(catId, 'Freeze')` sobre un gato elegible con NP suficiente descuenta el costo exacto (100 en el primer punto), fija la elección y persiste; un segundo `investDebuffResistanceTalent(catId, 'Freeze')` descuenta 200 y sube a 2 puntos; `investDebuffResistanceTalent(catId, 'Slow')` sobre una pista ya fijada en "Freeze" con puntos > 0 devuelve `false` sin mutar; sobre un gato NO elegible (forma distinta de True, o rareza distinta de Megarraro/Legendario) devuelve `false`; con NP insuficiente devuelve `false`; en el máximo de puntos devuelve `false` — confirmar que fallan
- [X] T010 [P] [US1] Añadir casos a `tests/unit/useGameStore.test.ts`: con `ownedCats[catId].talents.debuffResistance = { effect: 'Freeze', points: 3 }` (mockeando `useMetaStore`), `deployUnit()` produce una unidad cuyo `resistantTo` incluye `{ effect: 'Freeze', durationMultiplier: 0.7 }` antepuesto a cualquier `resistantTo` propio del gato o de Ototo Corps; sin talentos, `resistantTo` es exactamente el de antes de esta spec — confirmar que fallan

### Implementation for User Story 1

- [X] T011 [US1] En `src/state/useMetaStore.ts`: implementar `investDebuffResistanceTalent(catId, effect)` según data-model.md (valida elegibilidad, elección fija, máximo de puntos, NP suficiente; descuenta NP, actualiza `talents.debuffResistance`, persiste en `db.ownedCats` y `db.playerProfile`)
- [X] T012 [US1] En `src/state/useGameStore.ts`, `deployUnit()`: leer `useMetaStore.getState().ownedCats[catId]?.talents?.debuffResistance` y anteponer la entrada `resistantTo` correspondiente (research.md Decisión 3) — sin cambiar ningún otro campo
- [X] T013 [P] [US1] Añadir casos a `tests/unit/shared/UnitDetailPanel.test.tsx` (crear el archivo si no existe, o extenderlo): para un gato elegible, la sección "Talentos" muestra el NP disponible y el control de Resistencia a Debuff con selector de debuff (solo con 0 puntos) y botón "+1 punto"; elegir "Congelar" e invertir invoca `investDebuffResistanceTalent(catId, 'Freeze')`; con NP insuficiente o en el máximo, el botón está deshabilitado; para un gato NO elegible, la sección no aparece — confirmar que fallan
- [X] T014 [US1] En `src/screens/shared/UnitDetailPanel.tsx`: añadir la sección "Talentos" (visible solo si `isTalentEligible`), con el control de Resistencia a Debuff
- [X] T015 [US1] Ejecutar `tests/unit/useMetaStore.test.ts`, `tests/unit/useGameStore.test.ts` y `tests/unit/shared/UnitDetailPanel.test.tsx`, confirmar que T009/T010/T013 pasan y que ninguna prueba existente se rompe

**Checkpoint**: Resistencia a Debuff funcional de punta a punta (SC-001).

---

## Phase 4: User Story 2 - Aumento de Estadísticas (Priority: P1)

**Goal**: Invertir NP en HP y/o Daño de forma independiente, y que la unidad desplegada refleje el bono.

**Independent Test**: Invertir puntos en HP y en Daño por separado, desplegar la unidad, y confirmar que `hp`/`damage` efectivos reflejan cada porcentaje de forma independiente.

### Tests for User Story 2

- [X] T016 [P] [US2] Añadir casos a `tests/unit/useMetaStore.test.ts`: `investStatBoostTalent(catId, 'hp')` sobre un gato elegible con NP suficiente descuenta el costo exacto y sube `talents.statBoost.hp` en 1, sin afectar `talents.statBoost.damage`; lo mismo para `'damage'` de forma independiente; sobre un gato NO elegible, con NP insuficiente, o en el máximo de puntos de ese contador, devuelve `false` — confirmar que fallan
- [X] T017 [P] [US2] Añadir casos a `tests/unit/useGameStore.test.ts`: con `ownedCats[catId].talents.statBoost = { hp: 5, damage: 0 }`, `deployUnit()` produce una unidad con `hp`/`maxHp` multiplicados por 1.10 respecto a `getEffectiveCatStats` y `damage` sin cambio; con `{ hp: 0, damage: 5 }`, el caso simétrico; sin `statBoost`, ambos sin cambio — confirmar que fallan

### Implementation for User Story 2

- [X] T018 [US2] En `src/state/useMetaStore.ts`: implementar `investStatBoostTalent(catId, stat)` según data-model.md
- [X] T019 [US2] En `src/state/useGameStore.ts`, `deployUnit()`: aplicar `getStatBoostMultiplier` a `effectiveStats.hp`/`effectiveStats.damage` antes de asignarlos a `unit.hp`/`unit.maxHp`/`unit.damage` (research.md Decisión 3)
- [X] T020 [P] [US2] Añadir casos a `tests/unit/shared/UnitDetailPanel.test.tsx`: la sección "Talentos" muestra 2 contadores independientes (HP/Daño) con su propio botón "+1 punto"; invertir en uno invoca `investStatBoostTalent(catId, 'hp' | 'damage')` con el argumento correcto — confirmar que fallan
- [X] T021 [US2] En `src/screens/shared/UnitDetailPanel.tsx`: añadir el control de Aumento de Estadísticas (HP/Daño) a la sección "Talentos"
- [X] T022 [US2] Ejecutar `tests/unit/useMetaStore.test.ts`, `tests/unit/useGameStore.test.ts` y `tests/unit/shared/UnitDetailPanel.test.tsx`, confirmar que T016/T017/T020 pasan y que ninguna prueba existente se rompe

**Checkpoint**: Aumento de Estadísticas funcional de punta a punta (SC-002).

---

## Phase 5: User Story 3 - Orbe (Priority: P2)

**Goal**: Invertir NP en un Orbe de rasgo elegido, y que la unidad desplegada inflija más daño contra ese rasgo.

**Independent Test**: Invertir puntos en el Orbe eligiendo "Rojo", desplegar la unidad, y confirmar (vía `resolveAbilityMultiplier`) daño incrementado contra un defensor "Rojo" y daño normal contra cualquier otro rasgo.

### Tests for User Story 3

- [X] T023 [P] [US3] Añadir casos a `tests/unit/useMetaStore.test.ts`: `investOrbTalent(catId, 'Red')` sobre un gato elegible con NP suficiente descuenta el costo exacto, fija la elección y persiste; un segundo `investOrbTalent(catId, 'Red')` sube a 2 puntos; `investOrbTalent(catId, 'Black')` sobre una pista ya fijada en "Red" con puntos > 0 devuelve `false`; sobre un gato NO elegible, con NP insuficiente, o en el máximo de puntos, devuelve `false` — confirmar que fallan
- [X] T024 [P] [US3] Añadir casos a `tests/unit/useGameStore.test.ts`: con `ownedCats[catId].talents.orb = { classification: 'Red', points: 5 }`, `deployUnit()` produce una unidad cuyo `abilities` incluye `{ kind: 'TraitTargeting', targetClassifications: ['Red'], damageMultiplier: 1.2 }` antepuesto a las `abilities` propias del gato; sin `orb`, `abilities` es exactamente el del `Cat` original (más cualquier bono de Ototo ya existente) — confirmar que fallan

### Implementation for User Story 3

- [X] T025 [US3] En `src/state/useMetaStore.ts`: implementar `investOrbTalent(catId, classification)` según data-model.md
- [X] T026 [US3] En `src/state/useGameStore.ts`, `deployUnit()`: leer `talents?.orb` y anteponer la `Ability` `TraitTargeting` correspondiente al array `abilities` (research.md Decisión 3)
- [X] T027 [P] [US3] Añadir casos a `tests/unit/shared/UnitDetailPanel.test.tsx`: la sección "Talentos" muestra el control de Orbe con selector de rasgo (solo con 0 puntos) y botón "+1 punto"; elegir "Rojo" e invertir invoca `investOrbTalent(catId, 'Red')` — confirmar que fallan
- [X] T028 [US3] En `src/screens/shared/UnitDetailPanel.tsx`: añadir el control de Orbe a la sección "Talentos"
- [X] T029 [US3] Ejecutar `tests/unit/useMetaStore.test.ts`, `tests/unit/useGameStore.test.ts` y `tests/unit/shared/UnitDetailPanel.test.tsx`, confirmar que T023/T024/T027 pasan y que ninguna prueba existente (incluidas `tests/unit/engine/combat.test.ts`) se rompe

**Checkpoint**: Las 3 pistas de Talentos funcionan de punta a punta, de forma independiente entre sí (SC-001, SC-002, SC-003).

---

## Phase 6: Polish & Verificación Final

- [X] T030 Ejecutar `npx tsc -b` y `npm test` completos, confirmar 0 errores/0 fallos (SC-005)
- [X] T031 Verificación manual en navegador siguiendo `quickstart.md`

---

## Dependencies & Execution Order

Phase 1 → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6.

Aunque US1/US2/US3 son independientes entre sí (ninguna depende del estado de las otras), se ejecutan en orden de prioridad (P1, P1, P2) y comparten el mismo archivo `UnitDetailPanel.tsx`, por lo que se implementan secuencialmente para evitar conflictos de edición simultánea sobre el mismo archivo.

## Implementation Strategy

**MVP = Phase 3 completa**: Resistencia a Debuff por sí sola ya es una mejora jugable completa y verificable; US2 y US3 se suman incrementalmente sin romper lo ya construido.
