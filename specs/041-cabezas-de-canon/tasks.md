# Tasks: Cabezas de Cañón (Ototo Corps)

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: Vitest — `tests/unit/engine/combat.test.ts`, `tests/unit/data/ototoCorps.test.ts`, `tests/unit/useMetaStore.test.ts`, `tests/unit/useGameStore.test.ts`, `tests/unit/OtotoCorpsPanel.test.tsx` y `tests/unit/BattleScreen.test.tsx`, extendidos.

**Organización**: depende de `specs/035-ototo-corps` (construcciones, `OtotoCorpsPanel`, `startOtotoConstruction`/`claimOtotoConstruction`), `specs/012`/`specs/029` (cañón especial y su control en el HUD), `specs/039-habilidades-control-defensa` (`knockBack`), `specs/015-catalogo-habilidades-combate` (efectos de estado) y `specs/040-dinero-extra-inmunidades` (`immuneAbilities`).

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo con otras tareas de su fase (archivos distintos, sin dependencias abiertas).
- **[Story]**: historia de `spec.md` a la que pertenece (US1 construir, US2 efecto del cañón, US3 etiqueta del HUD).

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: tipo del motor, refactor de efectos de estado, catálogo y tipos de persistencia — sin ningún efecto jugable todavía. Termina con la suite existente en verde (con los dos tests que contaban "exactamente 2 construcciones" actualizados a 3).

- [X] T001 [P] `src/engine/types.ts`: agrega `export type CannonHeadSpec = { kind: 'Knockback'; distance: number } | { kind: 'Effect'; effect: AppliesEffect }` con su comentario `specs/041-cabezas-de-canon (FR-003..FR-005)`; `BattleUnit`/`Ability` no cambian (data-model.md).
- [X] T002 `src/engine/combat.ts`: refactor sin cambio de comportamiento — extrae de `applyOnHitEffect` su cuerpo posterior a leer el efecto a `applyEffectToDefender(effect: AppliesEffect, defender: BattleUnit)` (inmunidad total por `immuneEffects`, reducción por `resistantTo`, descarte si la duración resultante es ≤ 0, y el `switch` de los cuatro efectos), y deja `applyOnHitEffect(attacker, defender)` como `if (attacker.appliesEffect) applyEffectToDefender(attacker.appliesEffect, defender)` (research.md Decisión 3).
- [X] T003 [P] `src/data/ototoCorps.ts`: `OtotoBuildingId` += `'cannonHead'`; `OTOTO_BUILDINGS` += `{ id: 'cannonHead', name: 'Cabeza de Cañón', materialsCost: 40, durationMs: 15 * 60_000 }`; agrega `CannonHeadEffect`, `CANNON_HEAD_OPTIONS` (`Knockback`, `Weaken`, `Freeze`, `Slow`, `Curse`), `CANNON_HEAD_LABELS` (`Retroceso`, `Debilitar`, `Congelar`, `Ralentizar`, `Maldecir`), `CANNON_KNOCKBACK_DISTANCE = 40`, `CANNON_DEBUFFS` (Debilitar 5 s/0.5, Congelar 3 s, Ralentizar 5 s/0.5, Maldecir 5 s) y `getCannonHeadSpec(effect): CannonHeadSpec` (data-model.md § `ototoCorps.ts`); importa los tipos del motor con `import type` (depende de T001).
- [X] T004 [P] `src/db/index.ts` y `src/state/useMetaStore.ts`: `OtotoCorpsRow.buildings` y `ototoBuildings` pasan a `{ foundation?: ClassificationType; style?: EffectType; cannonHead?: CannonHeadEffect }`; `startOtotoConstruction` pasa a `(building: OtotoBuildingId, choice: string) => boolean` y, solo para `cannonHead`, devuelve `false` sin mutar si la elección no está en `CANNON_HEAD_OPTIONS`, antes de descontar nada (FR-002); `claimOtotoConstruction`/`hydrate` no cambian (depende de T003).
- [X] T005 Actualiza los dos tests existentes que contaban "exactamente 2 construcciones" a 3 — `tests/unit/data/ototoCorps.test.ts` (`OTOTO_BUILDINGS` tiene 3 entradas: `foundation`/`style`/`cannonHead`, costo y duración positivos) y `tests/unit/OtotoCorpsPanel.test.tsx` (muestra Base, Estilo y Cabeza de Cañón) — mismo criterio y mismo espíritu que antes, sin tocar el resto de sus aserciones (FR-009) (depende de T003; el segundo test fallará hasta T007, así que su ajuste se deja anotado y se cierra en T007).
- [X] T006 Regresión verificada: `npx tsc -b` limpio y la suite completa pasa tras T001-T004 (el test del panel actualizado en T005 puede quedar pendiente hasta T007 — si ya falla por la nueva fila, es el único fallo esperado); anotar el conteo en verde (depende de T001-T005). **Verificado**: `npx tsc -b` limpio y 748/748 tests en verde (58 archivos) con los dos tests de conteo de construcciones ya actualizados a 3 (T005) y el panel ya con su tercera fila (T007, hecha antes de cerrar esta verificación).

**Checkpoint**: tipo, refactor y catálogo listos; la persistencia acepta la tercera construcción; ningún efecto jugable todavía.

---

## Phase 2: User Story 1 - Construir una Cabeza de Cañón (Priority: P1) 🎯 MVP

**Goal**: el jugador construye, espera y reclama una Cabeza de Cañón eligiendo uno de cinco efectos, con persistencia local.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T007 [US1] `src/screens/OtotoCorpsPanel.tsx`: las opciones por construcción pasan a un mapa (`foundation` → `TRAIT_OPTIONS`, `style` → `DEBUFF_OPTIONS`, `cannonHead` → `CANNON_HEAD_OPTIONS`); `choices` gana `cannonHead: CANNON_HEAD_OPTIONS[0]`; para `cannonHead` el texto de cada `<option>` y el "actual: …" usan `CANNON_HEAD_LABELS` (el `value` sigue siendo el id); `ototoBuildings[definition.id]` se indexa directamente con `OtotoBuildingId`; Base y Estilo se muestran exactamente como hoy (FR-009); cierra el ajuste del test del panel de T005 (depende de T003, T004).
- [X] T008 [US1] Tests Vitest: `tests/unit/useMetaStore.test.ts` (nuevo `describe` de `specs/041`, mismo patrón que el bloque de `specs/035`): construir `cannonHead` con materiales suficientes descuenta el costo exacto, registra la construcción y persiste; sin materiales devuelve `false` sin mutar; una elección fuera de `CANNON_HEAD_OPTIONS` devuelve `false` sin mutar ni descontar; con otra construcción en curso devuelve `false`; reclamarla con tiempo cumplido deja `ototoBuildings.cannonHead` igual a la elección, la persiste y un `hydrate()` posterior la recupera; Base y Estilo siguen funcionando igual. `tests/unit/OtotoCorpsPanel.test.tsx`: la fila de Cabeza de Cañón ofrece las cinco elecciones con etiquetas en español y valores de id, deshabilita Construir con materiales insuficientes, elegir `Knockback` y construir invoca `startOtotoConstruction('cannonHead', 'Knockback')`, y con una cabeza ya reclamada muestra "actual: Retroceso". `tests/unit/data/ototoCorps.test.ts`: `CANNON_HEAD_OPTIONS` tiene exactamente las cinco elecciones, cada una con etiqueta, y `getCannonHeadSpec` devuelve el spec esperado para cada una (depende de T007).

**Checkpoint**: la Cabeza de Cañón se construye, se reclama y persiste — MVP de la spec.

---

## Phase 3: User Story 2 - El cañón especial aplica el efecto elegido (Priority: P1)

**Goal**: el disparo del cañón aplica el efecto secundario a los enemigos alcanzados que sobreviven.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T009 [US2] `src/engine/combat.ts`: nueva función exportada y pura `applyCannonHead(unit: BattleUnit, head: CannonHeadSpec, laneLength: number): BattleUnit` — copia la unidad; con `kind: 'Knockback'` llama a `knockBack(next, head.distance, laneLength)` salvo que `isImmuneToAbility(next, 'Knockback')`; con `kind: 'Effect'` llama a `applyEffectToDefender(head.effect, next)`; devuelve la copia, sin mutar la entrada (FR-003..FR-005, research.md Decisiones 2-4) (depende de T002).
- [X] T010 [US2] `src/state/useGameStore.ts` (`activateSpecialCannon`): lee `useMetaStore.getState().ototoBuildings.cannonHead` al disparar y, si existe, `getCannonHeadSpec` lo traduce; en el `map` de enemigos alcanzados, tras restar el daño, aplica `applyCannonHead(damaged, headSpec, laneLength)` solo si `hp > 0` y hay cabeza; sin cabeza el resultado es idéntico al de hoy (FR-003, FR-006, FR-007, research.md Decisión 6) (depende de T009, T003).
- [X] T011 [US2] Tests Vitest: `tests/unit/engine/combat.test.ts` (nuevo `describe('Cabeza de Cañón …', …)`): Retroceso desplaza a un enemigo (`x: 200` → `240` con `distance: 40`), con tope en `laneLength - width` (p. ej. `x: 370`, `laneLength: 400`, `width: 16` → `384`) y no desplaza a un enemigo con `immuneAbilities: ['Knockback']`; cada efecto de estado (`Weaken`/`Freeze`/`Slow`/`Curse`) deja los campos `…RemainingSeconds` (y `…Magnitude`) del catálogo; respeta `immuneEffects` (sin efecto) y `resistantTo` (duración reducida; ≤ 0 ⇒ sin efecto); refresca sin acumular al aplicarse dos veces; no muta su entrada; y los tests de efectos on-hit de `specs/015` siguen en verde tras el refactor de T002. `tests/unit/useGameStore.test.ts` (nuevo `describe` de `specs/041`, mismo patrón que el de `specs/012` US5): con cabeza de Retroceso solo los enemigos dentro del radio que sobreviven se desplazan y todos reciben el mismo daño que sin cabeza; un enemigo derrotado por el disparo se remueve sin efecto; las unidades del jugador y los enemigos fuera del radio no se afectan; con cabeza de Congelar los alcanzados vivos quedan con `freezeRemainingSeconds` del catálogo; sin ninguna cabeza el disparo es idéntico al de antes (SC-002); la recarga se reinicia igual con o sin cabeza (depende de T009, T010).

**Checkpoint**: US1+US2 — la Cabeza de Cañón se construye y tiene efecto en combate.

---

## Phase 4: User Story 3 - Ver el efecto del cañón antes de dispararlo (Priority: P3)

**Goal**: el control de cañón del HUD muestra el efecto elegido.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T012 [US3] `src/screens/BattleScreen.tsx` (`CannonControl`): lee `useMetaStore((state) => state.ototoBuildings.cannonHead)` y, si existe, la etiqueta pasa de `Cañón` a `Cañón · {CANNON_HEAD_LABELS[cannonHead]}`; sin cabeza queda exactamente como hoy (FR-008) (depende de T003).
- [X] T013 [US3] Test Vitest `tests/unit/BattleScreen.test.tsx` (en el `describe` del cañón especial de `specs/029` o uno nuevo de `specs/041`): con `ototoBuildings: { cannonHead: 'Knockback' }` el botón del cañón contiene `Cañón · Retroceso`; con `ototoBuildings: {}` solo `Cañón` (sin " · "); el botón sigue localizable por `/cañón/i` y su estado habilitado/deshabilitado no cambia (depende de T012).

**Checkpoint**: las tres historias completas — spec cerrada.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T014 [P] `npx tsc -b` limpio, `npm run lint` sin warnings en código propio y `npm run build` limpio (depende de T001-T013). **Verificado**: `npx tsc -b` limpio, `npm run lint` sin warnings en código propio y `npm run build` limpio.
- [X] T015 [P] `npm test` — suite completa (existente + T005/T008/T011/T013) en verde, sin regresión (SC-004/SC-006); anotar el nuevo conteo de archivos/tests (depende de T001-T013). **Verificado**: 58 archivos / 783 tests en verde (748 previos + 35 nuevos: 11 de `applyCannonHead` en `combat.test.ts`, 5 de `activateSpecialCannon` en `useGameStore.test.ts`, 7 de construcción en `useMetaStore.test.ts`, 6 del panel, 3 de datos y 3 del HUD; más los dos tests de conteo existentes actualizados de 2 a 3 construcciones).
- [X] T016 Recorrido manual en el navegador siguiendo `quickstart.md` § Validación manual: tercera construcción en el panel, construcción/reclamación con la espera acortada, etiqueta del HUD, y el efecto del cañón en batalla real (Retroceso y al menos un efecto de estado, más el jefe inmune a Retroceso) sin errores de consola (depende de T014, T015). **Verificado** (app real con `npm run dev`; filas de IndexedDB `gamatoto` y `ototoCorps` inyectadas; los stores se importaron por la URL exacta que carga la app — con su `?t=` de HMR — desde la consola, y se disparó el cañón con `activateSpecialCannon`): el panel del Cuerpo Ototo mostró "Cabeza de Cañón — Retroceso" con Reclamar (tiempo cumplido); al reclamar aparecieron las tres filas (Base "actual: Floating", Estilo, Cabeza de Cañón "actual: Retroceso") y la fila persistida quedó en `buildings: { foundation: 'Floating', cannonHead: 'Knockback' }`; el selector de la tercera fila ofreció `Knockback=Retroceso`, `Weaken=Debilitar`, `Freeze=Congelar`, `Slow=Ralentizar`, `Curse=Maldecir` mientras los de Base y Estilo no cambiaron; construir "Congelar" descontó 40 materiales (200→160) y mostró "Cabeza de Cañón — Congelar" con "Tiempo restante: 15:00"; en batalla el HUD mostró "Cañón · Retroceso"; el disparo con Retroceso dejó al enemigo vivo en `x` 0→40 con 50 menos de vida, eliminó al de 10 de vida sin efecto, no tocó al enemigo fuera de rango y a La Máscara (inmune) le bajó 50 de vida sin moverla; con Congelar, Ralentizar (con `resistantTo` 0.5 → 2.5 s), Debilitar (5 s) los campos del catálogo quedaron aplicados, un enemigo inmune a Maldecir no recibió el efecto, y sin cabeza el disparo fue idéntico al de antes; consola sin errores.
- [X] T017 `README.md`: fila `041` en la tabla de specs, viñeta en "Contenido de juego" (Cabezas de Cañón: construcción, cinco elecciones, efecto del cañón y etiqueta del HUD), cifras de "Estado actual" (cantidad de specs, archivos y tests de T015), "Qué falta" sin Cabezas de Cañón, y el árbol de `src/` sin cambios estructurales (depende de T015).

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: T001 → T003 → T004; T002 independiente (solo `combat.ts`); T005 depende de T003; T006 cierra la fase. Bloquea todo lo demás. T001/T002 son paralelos entre sí; T003/T004 dependen de T001.
- **US1 (Fase 2)**: depende de Foundational (T003, T004) — panel (T007) → tests (T008).
- **US2 (Fase 3)**: depende de Foundational (T002 para `applyEffectToDefender`, T003 para `getCannonHeadSpec`) — independiente de US1 (puede probarse con la elección puesta directamente en el store); T009 → T010 → T011.
- **US3 (Fase 4)**: depende solo de Foundational (T003) — independiente del resto, puede hacerse en paralelo con las Fases 2-3; T012 → T013.
- **Polish (Fase 5)**: depende de que las tres historias estén completas.

## Parallel Opportunities

- T001 y T002 (Foundational) en paralelo — archivos distintos; T003/T004 en paralelo tras T001.
- US2 (T009-T011) y US3 (T012-T013) pueden implementarse en paralelo con US1 (T007-T008) una vez terminada Foundational — no comparten archivos de implementación.
- T014/T015 (Polish) en paralelo entre sí.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational) — tipo, refactor, catálogo y persistencia listos, suite existente en verde.
2. Completar Fase 2 (US1) — la Cabeza de Cañón se construye, se reclama y persiste.
3. **STOP y VALIDAR**: construir y reclamar una Cabeza de Cañón y recuperarla tras recargar.

### Incremental Delivery

1. Foundational → refactor sin cambio de comportamiento + catálogo.
2. + US1 → construcción (MVP).
3. + US2 → efecto del cañón en combate.
4. + US3 → etiqueta del HUD — spec completa.
5. Polish → tsc/lint/build/test, recorrido manual, README.
