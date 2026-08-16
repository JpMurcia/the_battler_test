# Tasks: Evolución de Gatos

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: `useMetaStore.evolveCat`/`deployUnit` con Vitest + `fake-indexeddb`; `getVisualProfile` vía `UnitSprite` extiende los tests existentes de `specs/003-identidad-visual-animada`.

**Organización**: sin fase de Setup. Depende de `specs/006-dashboard-base-jugador` (ownedCats, upgradeCat) ya implementada.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 [P] `src/data/cats.ts`: `Cat` += `evolutions?: { second: EvolutionFormData; true: EvolutionFormData }`; `EvolutionFormData` en `src/data/cats.ts` o `src/engine/types.ts` según corresponda (data-model.md § EvolutionFormData).
- [X] T002 [P] `src/db/index.ts`: `OwnedCatRow` += `evolutionStage?: 'Base' | 'Second' | 'True'` (opcional para compatibilidad con filas viejas); nueva tabla `evolutionItems` (`db.version(4)`), interfaz `EvolutionItemsRow { id: 1; counts: Record<string, number> }`.
- [X] T003 `src/state/useMetaStore.ts`: `ownedCats` expone `evolutionStage` con fallback `'Base'` si la fila no lo declara; nuevo estado `evolutionItems: Record<string, number>`, hidratado desde `db.evolutionItems` (depende de T002).
- [X] T004 [P] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): hidratar sin `evolutionStage` en Dexie expone `'Base'` por defecto (depende de T003).

**Checkpoint**: datos y estado listos; sin acción de evolución todavía.

---

## Phase 2: User Story 1 - Evolucionar a Segunda Forma al alcanzar el nivel (Priority: P1) 🎯 MVP

**Goal**: `evolveCat` funcional para la transición `Base → Second`.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T005 [US1] `src/state/useMetaStore.ts`: `evolveCat(catId): boolean` — si `evolutionStage === 'Base'` y `ownedCats[catId].level >= evolutions.second.requiredLevel`, actualiza `evolutionStage = 'Second'`, persiste en `db.ownedCats.put`, devuelve `true`; si no cumple, devuelve `false` sin mutar (depende de T001, T003).
- [X] T006 [US1] `src/state/useGameStore.ts` (`deployUnit`): lee `useMetaStore.getState().ownedCats[catId].evolutionStage`; si es `'Second'`/`'True'`, aplica `hpMultiplier`/`damageMultiplier` de la etapa correspondiente a `hp`/`maxHp`/`damage` del `BattleUnit` creado (depende de T005).
- [X] T007 [US1] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): `evolveCat` sube a `'Second'` con nivel suficiente, devuelve `false` sin nivel suficiente (depende de T005).
- [X] T008 [US1] Test Vitest `tests/unit/useGameStore.test.ts` (extiende): `deployUnit` de un gato en `'Second'` produce un `BattleUnit` con `hp`/`damage` multiplicados respecto a `'Base'` (depende de T006).

**Checkpoint**: evolución a Segunda Forma completa y reflejada en combate.

---

## Phase 3: User Story 2 - Forma Verdadera requiere nivel e ítem (Priority: P2)

**Goal**: `evolveCat` valida y consume el ítem para la transición `Second → True`.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T009 [US2] `src/state/useMetaStore.ts` (`evolveCat`, extiende T005): si `evolutionStage === 'Second'` y se cumple `level >= evolutions.true.requiredLevel` y `evolutionItems[catId] >= evolutions.true.requiredItemCount`, descuenta el ítem, actualiza `evolutionStage = 'True'`, persiste ambas tablas, devuelve `true`; si falta nivel o ítem, devuelve `false` sin descontar ni mutar etapa (depende de T005).
- [X] T010 [US2] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): evolucionar a `'True'` consume el ítem exacto; sin ítem suficiente no lo consume ni cambia etapa; sin nivel suficiente, igual (depende de T009).

**Checkpoint**: US1 + US2 — las 3 formas son alcanzables con sus requisitos correctos.

---

## Phase 4: User Story 3 - Forma Verdadera mejora significativamente los stats (Priority: P2)

**Goal**: confirmar el multiplicador aplicado en `deployUnit` para `'True'`.

**Independent Test**: spec.md Historia 3 — ya cubierta estructuralmente por T006/T008; esta fase añade el caso `'True'` explícito.

### Implementation for User Story 3

- [X] T011 [US3] Test Vitest `tests/unit/useGameStore.test.ts` (extiende T008): `deployUnit` de un gato en `'True'` con `evolutions.true` (p. ej. `hpMultiplier: 2`, `damageMultiplier: 2`) produce un `BattleUnit` con el doble de `hp`/`damage` respecto a `'Base'` (depende de T006, T009).

**Checkpoint**: mejora de stats verificada para ambas formas evolucionadas.

---

## Phase 5: User Story 4 - Cada forma se ve distinta en batalla (Priority: P3)

**Goal**: `UnitSprite` deriva el perfil visual de los stats efectivos, no de los stats base de `Cat`.

**Independent Test**: spec.md Historia 4.

### Implementation for User Story 4

- [X] T012 [US4] `src/game/UnitSprite.tsx`: reemplaza `getVisualProfile(cat)` (lookup estático por `catId`) por `getVisualProfile(unit)` construido a partir de los campos del `BattleUnit` fresco (`width`, `hp`←`maxHp`, `speed`, `damage`, `attackIntervalSeconds` — todos ya presentes en `BattleUnit`) (plan.md § Key Design Decision, punto 2) (depende de T006).
- [X] T013 [US4] Test Vitest `tests/unit/game/animation.test.ts` (extiende, de `specs/003-identidad-visual-animada`): `getVisualProfile` con stats evolucionados (hp/damage multiplicados) produce `bodyHeight`/`accentColor` distinto del de la Forma Base del mismo gato (depende de T012).

**Checkpoint**: las cuatro historias completas — spec cerrada.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T014 [P] `npx tsc -b` limpio.
- [X] T015 [P] `npm test` — suite completa (existente de `specs/002`/`specs/003`/`specs/006` sin modificarse + nuevos tests) en verde.
- [ ] T016 Recorrido manual en navegador: con un gato de prueba con `evolutions` declarado y `evolutionItems` sembrado manualmente (DevTools/Dexie), evolucionar ambas etapas desde la Base y confirmar el cambio visual en combate. **Pendiente**: reintentado en sesión posterior — mismo bloqueo (`el panel Browser no está compuesto del lado del usuario, requestAnimationFrame no corre`); DOM sí responde (`read_page`/clicks funcionan sin captura de pantalla), pero el bucle de batalla no avanza sin composición. Requiere que el usuario mantenga el panel Browser visible durante la verificación.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational.
- **US2 (Fase 3)**: depende de US1 (T005, mismo `evolveCat`).
- **US3 (Fase 4)**: depende de US1/US2 (T006, T009) — solo tests adicionales.
- **US4 (Fase 5)**: depende de US1 (T006) — independiente de US2/US3.
- **Polish (Fase 6)**: depende de que las cuatro historias estén completas.

## Parallel Opportunities

- T001/T002 en paralelo (Foundational).
- US4 (Fase 5) puede desarrollarse en paralelo a US2/US3 (Fases 3-4) una vez completada US1.
- T014/T015 en paralelo.
