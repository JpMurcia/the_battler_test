---
description: "Task list template for feature implementation"
---

# Tasks: Cat Combos

**Input**: Design documents from `specs/025-cat-combos/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Tests**: Incluidos — el proyecto ya tiene cobertura Vitest para cada feature previa (`tests/unit/`); esta feature sigue el mismo patrón de profundidad ya establecido por el precedente directo que reutiliza (`getActiveBonusMultiplier` de `specs/013`): la función pura derivada se testea a fondo, y los dos puntos de lectura que la consumen (`useGameStore.startLevel`, `BattleScreen.tsx`) se testean en la medida en que el archivo de test correspondiente ya ejerce ese código (`useGameStore.test.ts` sí; `BattleScreen.test.tsx` hoy no cubre el flujo de victoria en absoluto, ni siquiera para el multiplicador de tesoros ya existente — no se inventa un arnés de test nuevo para ese archivo solo para esta feature, ver research.md/Notes).

**Organization**: Tareas agrupadas por historia de usuario (US1-US3 de [spec.md](spec.md)) para que cada una sea implementable y verificable de forma independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto, sin dependencia de una tarea incompleta)
- **[Story]**: Historia de usuario a la que pertenece (US1-US3)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Proyecto único (SPA React + Pixi.js): `src/`, `tests/unit/` en la raíz del repo — ver plan.md § Project Structure.

---

## Phase 1: Setup

**Purpose**: Confirmar que no hace falta infraestructura nueva antes de tocar código de la feature

- [X] T001 Confirmar que no se requiere ninguna dependencia npm nueva (plan.md § Technical Context) y que la rama activa es `025-cat-combos` — no crea código, solo verifica supuestos antes de empezar

**Checkpoint**: Sin bloqueos de tooling — se puede empezar Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: El catálogo de combos (`CAT_COMBOS`) y la función pura de detección son consumidos por las 3 historias — ninguna puede demostrar un combo activo, mostrar su estado en `TeamScreen` ni verificar dos combos simultáneos sin esto.

**⚠️ CRITICAL**: Ninguna historia de usuario puede darse por verificable (`tsc -b`/`npm test` en verde) hasta que este archivo compile

- [X] T002 [P] Crear `src/data/catCombos.ts` (data-model.md): `CatComboBonus { type: 'EnergyRegenMultiplier' | 'CurrencyRewardMultiplier'; value: number }` (mismo shape que `TreasureSetPassiveBonus`, `src/data/treasureSets.ts`), `CatCombo { id, name, memberCatIds: string[], bonus: CatComboBonus }`, fixture `CAT_COMBOS` con exactamente 2 combos (`combo-nucleo-original`: `['basic-cat', 'tank-cat']` → `EnergyRegenMultiplier` 1.05; `combo-especialistas-control`: `['weaken-cat', 'slow-cat']` → `CurrencyRewardMultiplier` 1.1, research.md Decisión 3), `getCompletedCombos(catIds: string[]): CatCombo[]` y `getComboMemberStatus(combo, ownedCatIds, selectedCatIds): ComboMemberStatus[]` (FR-001/FR-002/FR-007/FR-010)
- [X] T003 [P] Crear `tests/unit/data/catCombos.test.ts`: `getCompletedCombos` con formación exacta de `combo-nucleo-original` → lo incluye; con un solo miembro faltante → no lo incluye (sin resultado parcial, FR-004); con los 4 catIds de ambos combos fixture a la vez → devuelve ambos (adelanta Historia 3); auditoría FR-010 — todo `memberCatId` de `CAT_COMBOS` existe como `id` en `CATS` (`src/data/cats.ts`); `getComboMemberStatus` distingue un miembro no poseído de uno poseído pero no seleccionado — depende de T002
- [X] T004 En `src/state/useMetaStore.ts`: importar `CAT_COMBOS`/`getCompletedCombos`/tipo `CatComboBonus` de `./data/catCombos`, agregar `getActiveComboBonusMultiplier: (type: CatComboBonus['type']) => number` a `MetaState` — implementación: `getCompletedCombos(get().activeTeamCatIds).filter((combo) => combo.bonus.type === type).reduce((product, combo) => product * combo.bonus.value, 1)` (data-model.md); sin campo de estado nuevo, sin escritura a Dexie, sin cambio en `hydrate()` (FR-009, research.md Decisión 1) — depende de T002
- [X] T005 Ejecutar `npx tsc -b` y `npm test` — confirmar verde antes de tocar código de cualquier historia de usuario

**Checkpoint**: Compilación y suite existente en verde, catálogo de combos completo y función derivada lista — las 3 historias pueden implementarse en cualquier orden.

---

## Phase 3: User Story 1 - Activar un combo llevando la combinación completa a la batalla (Priority: P1) 🎯 MVP

**Goal**: Al iniciar una batalla con la formación activa completa de un Cat Combo, su bonificación pasiva se aplica automáticamente durante todo el combate; con la formación incompleta, no se aplica nada (spec.md FR-002, FR-003, FR-004, FR-008, FR-009).

**Independent Test**: Configurar `activeTeamCatIds` con exactamente los miembros de `combo-nucleo-original`, llamar `startLevel`, y confirmar que `energy.regenPerSecond` incluye el multiplicador `1.05`; repetir con un miembro faltante y confirmar que vuelve a ser el valor base.

### Tests for User Story 1

> Escribir primero — deben fallar contra el código actual (sin `getActiveComboBonusMultiplier` consumido todavía en los puntos de lectura)

- [X] T006 [P] [US1] Ampliar `tests/unit/useMetaStore.test.ts`: `getActiveComboBonusMultiplier('EnergyRegenMultiplier')` con `activeTeamCatIds` = miembros completos de `combo-nucleo-original` devuelve `1.05`; con un miembro faltante devuelve `1`; sin ningún combo activo devuelve `1` — cubre FR-002/FR-004, Acceptance Scenarios 1-2 — depende de T004
- [X] T007 [P] [US1] Ampliar `tests/unit/useGameStore.test.ts`: con `useMetaStore` en estado `activeTeamCatIds` = miembros completos de `combo-nucleo-original`, `startLevel('level-1')` produce `energy.regenPerSecond === level.energyRegenPerSecond * 1.05`; con formación incompleta, `regenPerSecond` no incluye el multiplicador de combo — cubre FR-003, Acceptance Scenario 1 — depende de T004

### Implementation for User Story 1

- [X] T008 [US1] En `src/state/useGameStore.ts` (`startLevel`), junto al cálculo ya existente de `energyRegenMultiplier` (bono de tesoros): leer `const comboEnergyMultiplier = useMetaStore.getState().getActiveComboBonusMultiplier('EnergyRegenMultiplier')` y multiplicarlo en `regenPerSecond: level.energyRegenPerSecond * energyRegenMultiplier * comboEnergyMultiplier` (data-model.md § Puntos de lectura modificados, FR-003/FR-008) — depende de T004
- [X] T009 [US1] En `src/screens/BattleScreen.tsx` (`BattleOutcomeWatcher`, rama `Victory`), junto a la lectura ya existente de `getActiveBonusMultiplier('CurrencyRewardMultiplier')`: leer `getActiveComboBonusMultiplier('CurrencyRewardMultiplier')` del mismo store y multiplicarlo en `addCurrency(Math.round(level.currencyReward * getActiveBonusMultiplier('CurrencyRewardMultiplier') * getActiveComboBonusMultiplier('CurrencyRewardMultiplier')))` (FR-003/FR-008) — depende de T004
- [X] T010 [US1] Ejecutar `npx vitest run tests/unit/useMetaStore.test.ts tests/unit/useGameStore.test.ts` y confirmar verde; ejecutar `npx tsc -b` para confirmar que no hay regresión de tipos

**Checkpoint**: US1 demostrable — un combo completo activa su bono automáticamente al iniciar batalla; romperlo lo desactiva, sin ninguna acción manual.

---

## Phase 4: User Story 2 - Consultar qué combos existen y cuáles están completos antes de entrar a la batalla (Priority: P1)

**Goal**: El jugador ve, en la pantalla de formación de equipo, la lista de Cat Combos definidos, sus miembros y si están completos con la selección actual — actualizado en vivo al togglear un checkbox, sin necesidad de guardar la formación primero (spec.md FR-006, FR-007).

**Independent Test**: Abrir `TeamScreen` con una formación parcial de un combo, confirmar que se muestra incompleto distinguiendo miembro no poseído de miembro poseído-no-seleccionado; completar la selección y confirmar que pasa a "completo" sin recargar.

### Tests for User Story 2

> Escribir primero — deben fallar porque `TeamScreen` todavía no tiene sección de combos

- [X] T011 [P] [US2] Ampliar `tests/unit/TeamScreen.test.tsx`: la sección "Cat Combos" lista `CAT_COMBOS` con nombre y miembros; con una selección parcial de `combo-nucleo-original`, se distingue un miembro no poseído (`owned: false`) de uno poseído pero no incluido en `selectedIds`; al togglear el checkbox del miembro faltante (sin pulsar "Confirmar equipo"), el combo pasa a mostrarse como completo en el mismo render — cubre Acceptance Scenarios 1-4 — depende de T002

### Implementation for User Story 2

- [X] T012 [US2] En `src/screens/TeamScreen.tsx`, agregar una sección "Cat Combos" (debajo de la lista de gatos, junto a `BattleItemSelector`) que recorre `CAT_COMBOS` y, para cada uno, llama `getComboMemberStatus(combo, Object.keys(ownedCats), selectedIds)` para pintar el estado por miembro y `getCompletedCombos(selectedIds).some((c) => c.id === combo.id)` para el indicador agregado completo/incompleto — depende de T002, T011
- [X] T013 [US2] Ejecutar `npx vitest run tests/unit/TeamScreen.test.tsx` y confirmar verde; ejecutar `npx tsc -b`

**Checkpoint**: US2 demostrable — visibilidad completa de combos con actualización en vivo, sin depender de guardar la formación.

---

## Phase 5: User Story 3 - Varios combos activos al mismo tiempo (Priority: P2)

**Goal**: Con la formación activa satisfaciendo dos Cat Combos a la vez, ambas bonificaciones se aplican simultáneamente sin excluirse (spec.md FR-005).

**Independent Test**: Con `activeTeamCatIds` conteniendo los 4 catIds de `combo-nucleo-original` y `combo-especialistas-control`, confirmar que `getActiveComboBonusMultiplier('EnergyRegenMultiplier')` devuelve `1.05` y `getActiveComboBonusMultiplier('CurrencyRewardMultiplier')` devuelve `1.1` en la misma consulta.

> Esta historia ya queda mayormente satisfecha por Foundational y US1: `CAT_COMBOS` (T002) define 2 combos de tipos de bonus distintos precisamente para este caso (research.md Decisión 3), y `getActiveComboBonusMultiplier` (T004) evalúa cada combo de forma independiente sin acoplarlos entre sí. La única tarea propia es el test que cierra explícitamente el Acceptance Scenario de esta historia.

### Tests for User Story 3

- [X] T014 [US3] Ampliar `tests/unit/useMetaStore.test.ts`: con `activeTeamCatIds` = los 4 catIds de `combo-nucleo-original` + `combo-especialistas-control`, `getActiveComboBonusMultiplier('EnergyRegenMultiplier')` devuelve `1.05` y `getActiveComboBonusMultiplier('CurrencyRewardMultiplier')` devuelve `1.1` en la misma llamada — cubre Acceptance Scenarios 1-2, sin código de producción nuevo — depende de T004 (y de T006, mismo archivo). Ya escrito como parte de T006 (test "Historia 3 (FR-005)..."); verificado en verde de forma independiente.

**Checkpoint**: US3 demostrable — dos combos de tipos de bonus distintos activos a la vez, verificados de forma independiente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Higiene final y evidencia de no-regresión sobre el resto del proyecto

- [X] T015 [P] Añadir comentarios de una línea con referencia `specs/025-cat-combos` en los exports nuevos (`catCombos.ts`, `getActiveComboBonusMultiplier` en `useMetaStore.ts`, la sección nueva de `TeamScreen.tsx`), siguiendo el mismo patrón de anotación ya usado en `src/data/treasureSets.ts`/`src/state/useMetaStore.ts` — ya cubierto de forma incremental en T004/T008/T009/T012
- [X] T016 Ejecutar `npx tsc -b`, `npm test`, `npm run lint` y `npm run build` — las 4 deben terminar sin errores antes de dar la feature por completa (SC-005)
- [X] T017 Pasada manual de quickstart.md Escenarios 2-5 (bono en batalla, visibilidad en vivo en Equipo, combos simultáneos, combinación con bono de tesoro) en `npm run dev`, confirmando ausencia de errores de consola — verificado en el navegador: la sección "Cat Combos" renderiza en `TeamScreen` con el estado real del jugador (ambos combos incompletos por defecto, distinguiendo "no posee este gato" de "no está en el equipo"), y togglear el checkbox de un miembro actualiza el estado del combo en el mismo render sin guardar la formación; sin errores de consola
- [X] T018 Actualizar `README.md`: agregar `025-cat-combos` a la tabla de specs completas, mencionar Cat Combos en "Contenido de juego" y en la descripción de `TeamScreen` dentro del flujo de pantallas

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede arrancar de inmediato
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA las 3 historias de usuario
- **User Stories (Phase 3-5)**: Todas dependen de que Foundational esté completo
  - US1 y US2 pueden implementarse en paralelo entre sí (archivos disjuntos: `useGameStore.ts`/`BattleScreen.tsx` vs. `TeamScreen.tsx`)
  - US3 depende conceptualmente de que Foundational ya exista (no de US1/US2) — es principalmente un test de cierre
- **Polish (Phase 6)**: Depende de que las 3 historias estén completas

### Dentro de cada historia

- Tests (T006-T007, T011, T014) se escriben antes que la implementación correspondiente y deben fallar primero
- `src/state/useMetaStore.ts` se toca en T004 (Foundational) — ninguna historia vuelve a modificar esa función, solo la consumen
- `src/screens/TeamScreen.tsx` se toca solo en T012 (US2) — sin conflicto con US1 (que toca `useGameStore.ts`/`BattleScreen.tsx`)

### Parallel Opportunities

- T002 (`catCombos.ts`) y su test T003 son secuenciales entre sí (T003 depende de T002), pero ambos son el único trabajo de Foundational fuera de T004/T005
- T006 (`useMetaStore.test.ts`) y T007 (`useGameStore.test.ts`) son paralelizables entre sí (archivos distintos), ambos dependientes de T004
- US1 (Phase 3) y US2 (Phase 4) son paralelizables entre sí una vez completado Foundational — no comparten ningún archivo
- US3 (Phase 5) es paralelizable con US2 — solo depende de Foundational, no de código nuevo de US1/US2
- T015 (Polish, comentarios) es paralelizable con el resto de Polish solo si toca archivos distintos a T016/T017/T018

---

## Parallel Example: Tras completar Foundational (Phase 2)

```bash
# US1 y US2 pueden arrancar a la vez (archivos disjuntos):
Task: "Ampliar tests/unit/useMetaStore.test.ts + tests/unit/useGameStore.test.ts para el bono de combo en batalla (US1)"
Task: "Ampliar tests/unit/TeamScreen.test.tsx + agregar sección Cat Combos en TeamScreen.tsx (US2)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (bloqueante — catálogo de combos + función derivada)
3. Completar Phase 3: User Story 1
4. **DETENER y VALIDAR**: `npx vitest run tests/unit/useMetaStore.test.ts tests/unit/useGameStore.test.ts` + `npx tsc -b` en verde
5. En este punto un combo ya activa su bono automáticamente en batalla — MVP alcanzado (aunque sin visibilidad previa en la UI, que llega con US2)

### Incremental Delivery

1. Setup + Foundational → catálogo de combos y función derivada listos
2. US1 → bono automático en batalla (MVP funcional, sin UI de consulta)
3. US2 → visibilidad y planificación en `TeamScreen` (cierra el propósito del manual: "capa de planificación de equipo")
4. US3 → confirma que dos combos conviven sin excluirse (ya satisfecho por construcción, se formaliza con un test)
5. Polish → evidencia de no-regresión sobre el resto del proyecto

### Parallel Team Strategy

Con varios desarrolladores:

1. El equipo completa Setup + Foundational junto (T001-T005)
2. Una vez Foundational está listo:
   - Desarrollador A: User Story 1 (`useGameStore.ts`/`BattleScreen.tsx`)
   - Desarrollador B: User Story 2 (`TeamScreen.tsx`)
   - Desarrollador C: User Story 3 (test de cierre, no bloqueado por A ni B)
3. Coordinar solo en `tests/unit/useMetaStore.test.ts` (T006 y T014 tocan el mismo archivo, en secciones distintas)

---

## Notes

- No hay `contracts/` (proyecto 100% frontend sin interfaces externas) — sin tareas de contract test
- [P] = archivo distinto, sin dependencia de una tarea incompleta
- Commit sugerido por tarea o por grupo lógico (T002+T003, T008+T009, etc.), siguiendo el patrón de commits atómicos ya usado en las specs previas del repo
- `BattleScreen.test.tsx` no cubre hoy el flujo de victoria de `BattleOutcomeWatcher` en absoluto (ni siquiera el multiplicador de tesoros ya existente, `specs/013`) — T009 sigue el mismo patrón de código que esa línea ya establecida, sin inventar un arnés de test de integración nuevo para ese archivo que no tiene precedente en el proyecto; la corrección del valor del multiplicador de combo en sí queda cubierta por T006/T014 a nivel de `useMetaStore`
- Ningún task de esta lista modifica `src/engine/` — la Constitución § IV/VI quedan intactas; ningún task modifica `src/db/index.ts` — no se persiste ningún estado de combo (FR-009)
