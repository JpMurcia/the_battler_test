# Tasks: Catálogo de Habilidades de Combate — Dinero Extra e Inmunidad a Habilidades

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: Vitest — `tests/unit/engine/combat.test.ts` y `tests/unit/engine/simulation.test.ts` extendidos (con `random` inyectado de forma determinista, mismo patrón que `specs/016`/`specs/038`/`specs/039`), más `tests/unit/shared/UnitDetailPanel.test.tsx`, `tests/unit/EnemyGuideScreen.test.tsx` y `tests/unit/data/cats.test.ts`.

**Organización**: depende de `specs/009-clasificacion-habilidades` (`Ability`, bloqueo por `Curse`), `specs/015-catalogo-habilidades-combate` (`immuneEffects`, el patrón de inmunidad), `specs/038-catalogo-habilidades-avanzado` (`MassiveDamage`/`TraitKiller`/`SummonOnDeath`), `specs/039-habilidades-control-defensa` (`Knockback`, `applyHit`, `Survive`) y `specs/018-bibliotecas-consulta` (Guía de Enemigos).

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo con otras tareas de su fase (archivos distintos, sin dependencias abiertas).
- **[Story]**: historia de `spec.md` a la que pertenece (US1 Dinero Extra, US2 Inmunidad, US3 presentación).

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: tipos, campos de datos y puntos de copia `Cat` → `BattleUnit` — sin ninguna habilidad nueva resolviéndose todavía. Termina con la suite existente en verde.

- [X] T001 `src/engine/types.ts`: agrega `export type ImmunizableAbilityKind = 'MassiveDamage' | 'TraitKiller' | 'Knockback'` (FR-005); `Ability` union += `ExtraMoney` (`{ kind: 'ExtraMoney'; energyBonus: number }`, FR-001); `BattleUnit` += `immuneAbilities?: ImmunizableAbilityKind[]` (FR-005) y `defeatBounty?: number` (estado efímero de batalla, research.md Decisión 3), con su comentario `specs/040-dinero-extra-inmunidades (FR-00x)` igual que los miembros de `specs/038`/`specs/039`.
- [X] T002 `src/data/cats.ts`: la interfaz `Cat` gana `immuneAbilities?: ImmunizableAbilityKind[]` (import type desde `../engine/types`), con comentario `specs/040 (FR-005)`; sin ningún dato todavía (depende de T001).
- [X] T003 `src/screens/shared/UnitDetailPanel.tsx`: `describeAbility` (ya un `switch` exhaustivo desde `specs/039`) gana `case 'ExtraMoney'` → `Dinero Extra (+{energyBonus} energía por enemigo derrotado)` — sin él la ampliación de la unión en T001 no compila (FR-010) (depende de T001).
- [X] T004 `src/engine/simulation.ts` (`spawnUnitFromCat`): junto a `immuneEffects: cat.immuneEffects`, agrega `immuneAbilities: cat.immuneAbilities` (depende de T001, T002).
- [X] T005 `src/state/useGameStore.ts` (`deployUnit`): junto a `immuneEffects: cat.immuneEffects`, agrega `immuneAbilities: cat.immuneAbilities` — `ExtraMoney` viaja dentro de `abilities`, que ya se copia, sin cambios (depende de T001, T002).
- [X] T006 Regresión verificada: `npx tsc -b` limpio y la suite existente completa (`npm test`) pasa sin ningún cambio de test tras T001-T005; anotar el conteo en verde (depende de T001-T005). **Verificado**: `npx tsc -b` limpio y 713/713 tests en verde (58 archivos) sin ningún cambio de test tras T001-T005.

**Checkpoint**: tipos y campos listos, ambos puntos de creación de unidad copian `immuneAbilities`; ninguna habilidad nueva resolviéndose todavía.

---

## Phase 2: User Story 1 - Dinero Extra (Priority: P1) 🎯 MVP

**Goal**: una unidad del jugador con `ExtraMoney` que derrota a un enemigo con su golpe concede su bono de energía, en el mismo paso y con tope en el máximo.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T007 [US1] `src/engine/combat.ts` (`applyHit`): tras el bloque de Sobrevivir y antes del de Retroceso, si `defender.hp <= 0 && attacker.team === 'Player' && defender.team === 'Enemy'`, `const extraMoney = findActiveAbility(attacker, 'ExtraMoney')` y, si existe, `defender.defeatBounty = extraMoney.energyBonus` (FR-001, FR-003, FR-004; `findActiveAbility` ya bloquea por `Curse` en ese instante, research.md Decisión 3); actualiza el comentario de `applyHit` con el orden final (depende de T001).
- [X] T008 [US1] `src/engine/simulation.ts` (`stepSimulation`): tras resolver combates, bases y movimiento y antes de construir `units` (y del filtro `state !== 'Dead'`), suma `unit.defeatBounty ?? 0` de toda unidad `Enemy` en `Dead` de `byId.values()` y calcula `const nextEnergy = { ...energy, current: Math.min(energy.max, energy.current + defeatBountyTotal) }`; `nextState` usa `energy: nextEnergy` (FR-001, FR-002, research.md Decisión 4) (depende de T007).
- [X] T009 [P] [US1] `src/data/cats.ts`: agrega `wallet-cat` (Gato Cobrador; stats de data-model.md § `src/data/cats.ts`) con `abilities: [{ kind: 'ExtraMoney', energyBonus: 5 }]`, tras los gatos de `specs/039` y antes del spread de `SEED_CATS_AS_CATS`.
- [X] T010 [US1] Test Vitest `tests/unit/engine/combat.test.ts` (nuevo `describe('Dinero Extra …', …)`, reutiliza `makeUnit`): un atacante `Player` con `ExtraMoney` (`energyBonus: 5`) que deja a un defensor `Enemy` en 0 de vida le deja `defeatBounty: 5`; un golpe que no derrota (`hp` restante > 0) no deja `defeatBounty`; sin la habilidad no deja nada; con Sobrevivir `chance: 1` del defensor (queda con 1 de vida) no deja nada; un Killer de `chance: 1` que elimina al defensor sí lo deja (FR-002); bajo `Curse` el atacante no lo deja (FR-003); un atacante `Enemy` con `ExtraMoney` no deja nada (FR-004); un defensor `Player` derrotado no deja nada; en salpicadura (`resolveAreaEngagement`) cada objetivo derrotado lleva su `defeatBounty`; en `resolveBaseDamage` nunca hay `defeatBounty` (la base no es una unidad) (depende de T007).
- [X] T011 [US1] Test Vitest `tests/unit/engine/simulation.test.ts` (nuevo `describe('specs/040-dinero-extra-inmunidades (US1 — Dinero Extra)', …)`, reutiliza `makeState`/`makeUnit`, con `energy: { current: 10, max: 100, regenPerSecond: 0 }`): una unidad `Player` con `ExtraMoney` que derrota a un enemigo trabado en un tick deja la energía en `10 + bono` en el mismo `stepSimulation`; sin la habilidad la energía queda en 10; con la energía en 98 y un bono de 5 queda en 100 (tope `energy.max`); tres enemigos derrotados por la salpicadura de una unidad Área con la habilidad suman tres bonos; una unidad `Player` que muere en el mismo paso en que derrota al enemigo concede igualmente el bono (intercambio simultáneo); el cañón especial (derrota por `activateSpecialCannon` del store) no pasa por `stepSimulation` y no concede nada — se confirma probando que un enemigo `Dead` sin `defeatBounty` suma 0 (depende de T008).

**Checkpoint**: Dinero Extra funcional — MVP de la spec.

---

## Phase 3: User Story 2 - Inmunidad (Priority: P2)

**Goal**: un defensor con `immuneAbilities` ignora por completo Golpe Letal, Killer y/o Retroceso, sin consumir la tirada de la habilidad ignorada.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T012 [US2] `src/engine/combat.ts`: nuevo helper `isImmuneToAbility(defender, kind: ImmunizableAbilityKind): boolean` (`defender.immuneAbilities?.includes(kind) ?? false`, sin bloqueo por `Curse`, FR-007); `findMatchingTraitKiller` devuelve `undefined` si `isImmuneToAbility(defender, 'TraitKiller')` (tras el chequeo de `Curse` del atacante); en `applyHit`, `massiveDamage` y `knockback` se buscan solo si el defensor no es inmune a `'MassiveDamage'`/`'Knockback'` respectivamente — si lo es, se tratan como `undefined` para ese golpe y no consumen su `random()` (FR-005, FR-006, research.md Decisión 2); `resolveBaseDamage` no cambia (depende de T007 — mismo bloque de función).
- [X] T013 [P] [US2] `src/data/cats.ts`: `enemy-la-mascara` gana `immuneAbilities: ['MassiveDamage', 'TraitKiller', 'Knockback']` sin tocar ninguno de sus demás campos (FR-008); agrega `anchor-cat` (Gato Ancla; stats de data-model.md § `src/data/cats.ts`) con `immuneAbilities: ['Knockback']`, a continuación de `wallet-cat`.
- [X] T014 [US2] Test Vitest `tests/unit/engine/combat.test.ts` (nuevo `describe('Inmunidad a habilidades …', …)`): con Golpe Letal `chance: 1`/`damageMultiplier: 3`, un defensor con `immuneAbilities: ['MassiveDamage']` recibe el daño normal (10) y uno sin inmunidad el triple (30); con un Killer `chance: 1` contra `Zombie`, un defensor Zombie inmune a `'TraitKiller'` no es eliminado (recibe el daño normal) y uno no inmune sí; con Retroceso `chance: 1`, un defensor inmune a `'Knockback'` no se desplaza y uno no inmune sí; cada inmunidad es independiente (un defensor inmune solo a Retroceso sufre el Golpe Letal del mismo atacante y no el desplazamiento); la espía de `random` confirma que la habilidad ignorada no consume tirada (con solo la habilidad ignorada declarada, `random` no se invoca); en salpicadura la inmunidad se evalúa por objetivo (primario inmune, salpicadura no inmune sufre el efecto); un defensor inmune bajo `Curse` sigue inmune (FR-007); en `resolveBaseDamage` Golpe Letal sigue funcionando como hoy (las bases no tienen inmunidades) (depende de T012).

**Checkpoint**: US1+US2 — las dos habilidades del motor completas.

---

## Phase 4: User Story 3 - Ver el bono y las inmunidades (Priority: P3)

**Goal**: el detalle de unidad y la Guía de Enemigos muestran Dinero Extra e inmunidades.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T015 [US3] `src/screens/shared/abilityLabels.ts` (archivo nuevo): `describeImmunities(immuneAbilities: ImmunizableAbilityKind[] | undefined): string` con el mapa `MassiveDamage` → `Golpe Letal`, `TraitKiller` → `Killer`, `Knockback` → `Retroceso`, unidos con `', '`; cadena vacía si la lista es ausente o vacía (data-model.md § `abilityLabels.ts`) (depende de T001).
- [X] T016 [P] [US3] `src/screens/shared/UnitDetailPanel.tsx`: tras la fila de habilidades, una fila `Inmune a: {describeImmunities(cat.immuneAbilities)}` renderizada solo si la cadena no es vacía (FR-010) (depende de T015).
- [X] T017 [P] [US3] `src/screens/EnemyGuideScreen.tsx`: por cada enemigo enfrentado cuya `describeImmunities(cat.immuneAbilities)` no sea vacía, un texto secundario `Inmune a: …` en su fila (junto al título existente, sin cambiarlo); los enemigos sin inmunidades se renderizan exactamente como hoy (FR-010) (depende de T015).
- [X] T018 [P] [US3] Tests Vitest: `tests/unit/shared/UnitDetailPanel.test.tsx` — con `wallet-cat` poseído el detalle muestra `Dinero Extra (+5 energía por enemigo derrotado)` y no muestra `Inmune a`; con `anchor-cat` muestra `Inmune a: Retroceso`; `tests/unit/EnemyGuideScreen.test.tsx` — con `enemy-la-mascara` enfrentado la entrada lista `Inmune a: Golpe Letal, Killer, Retroceso`, y un enemigo sin inmunidades (p. ej. `CATS[0]`) no muestra ninguna línea `Inmune a` (depende de T016, T017, T013, T009).

**Checkpoint**: las tres historias completas — spec cerrada.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T019 [P] Test Vitest `tests/unit/data/cats.test.ts` (nuevo `describe('CATS — specs/040-dinero-extra-inmunidades', …)`): `wallet-cat` y `anchor-cat` existen, son únicos, y declaran exactamente `ExtraMoney { energyBonus: 5 }` / `immuneAbilities: ['Knockback']`; `enemy-la-mascara` declara las tres inmunidades y conserva `hp: 99999`/`damage: 2000`; ningún otro gato existente declara `immuneAbilities` (FR-009) (depende de T009, T013).
- [X] T020 [P] `npx tsc -b` limpio, `npm run lint` sin warnings en código propio y `npm run build` limpio (depende de T001-T019). **Verificado**: `npx tsc -b` limpio, `npm run lint` sin warnings en código propio y `npm run build` limpio.
- [X] T021 [P] `npm test` — suite completa (existente + T010/T011/T014/T018/T019) en verde, sin regresión (SC-005/SC-006); anotar el nuevo conteo de archivos/tests (depende de T001-T019). **Verificado**: 58 archivos / 748 tests en verde (713 previos + 35 nuevos: 11 de Dinero Extra en `combat.test.ts`, 8 de inmunidad en `combat.test.ts`, 8 de Dinero Extra en `simulation.test.ts`, 3 del panel, 2 de la Guía de Enemigos, 3 de datos).
- [X] T022 Recorrido manual en el navegador siguiendo `quickstart.md` § Validación manual: gatos semilla inyectados, textos correctos en el detalle de unidad y en la Guía de Enemigos, y el bono de energía de Dinero Extra verificado en una batalla real sin errores de consola (depende de T020, T021). **Verificado** (app real con `npm run dev`; gatos semilla y `enemy-la-mascara` inyectados en IndexedDB; el store de la partida accedido desde la consola con `tick(dt)` — mismo código que el bucle real — porque el ticker de Pixi se throttlea en el panel embebido): el detalle del Gato Cobrador muestra `Dinero Extra (+5 energía por enemigo derrotado)` sin fila de inmunidades y el del Gato Ancla `Inmune a: Retroceso`; la Guía de Enemigos muestra a La Máscara con `Inmune a: Golpe Letal, Killer, Retroceso` (a la derecha de su fila) y al Merodeador sin cambios; el Gato Cobrador al derrotar a un enemigo subió la energía de 40 a 45, de 98 a 100 (tope) y el Gato Básico no concedió bono; en una batalla real de `imperio-cap1-etapa-48` La Máscara apareció a los 45 s con `immuneAbilities` copiado por el spawn, y 600 golpes del Gato Empujón (Retroceso 30%) desplazaron 161 veces a un Merodeador pero 0 veces a La Máscara; consola del navegador sin errores.
- [X] T023 `README.md`: fila `040` en la tabla de specs, viñeta en "Contenido de juego" (Dinero Extra, inmunidades, los 2 gatos semilla y la inmunidad de La Máscara), cifras de "Estado actual" (cantidad de specs, archivos y tests de T021) y "Qué falta" sin Dinero Extra ni la inmunidad de jefes (depende de T021).

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: T001 → T002/T003 → T004/T005 → T006. Bloquea todo lo demás. T002 y T003 solo dependen de T001 y son paralelos entre sí; T004 y T005 dependen de T002.
- **US1 (Fase 2)**: depende de Foundational (T001) — T007 (`applyHit`) → T008 (`simulation.ts`); el seed (T009) y los tests (T010/T011) dependen de la implementación.
- **US2 (Fase 3)**: depende de US1 (T007 — mismo bloque de `applyHit`); no depende de su seed/test.
- **US3 (Fase 4)**: depende solo de Foundational para los tipos (T015) — independiente del motor, puede hacerse en paralelo con las Fases 2-3; sus tests (T018) necesitan los seeds de T009 y T013.
- **Polish (Fase 5)**: depende de que las tres historias estén completas.

## Parallel Opportunities

- T002 y T003 (Foundational) en paralelo — archivos distintos.
- La Fase 4 completa (T015-T017) puede implementarse en paralelo con las Fases 2-3 una vez terminada Foundational (no comparte función con el motor); T016 y T017 son paralelos entre sí (archivos distintos).
- Los seeds de `cats.ts` (T009, T013) y los tests de motor de `combat.test.ts` (T010, T014) están en archivos distintos entre sí por historia, pero los tests de una misma suite no se paralelizan entre historias.
- T019/T020/T021 (Polish) en paralelo entre sí.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational) — tipos y campos listos, suite existente en verde.
2. Completar Fase 2 (US1) — Dinero Extra funcional.
3. **STOP y VALIDAR**: una unidad con Dinero Extra que derrota a un enemigo sube la energía del jugador exactamente su bono en el mismo paso, sin pasar del máximo.

### Incremental Delivery

1. Foundational → tipos y campos de datos listos, sin habilidad nueva resolviéndose.
2. + US1 → Dinero Extra (MVP).
3. + US2 → Inmunidad a habilidades.
4. + US3 → presentación en el detalle de unidad y la Guía de Enemigos — spec completa.
5. Polish → tests de datos, tsc/lint/build/test completos, recorrido manual, README.
