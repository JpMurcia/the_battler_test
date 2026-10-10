# Tasks: Catálogo de Habilidades de Combate — Fortalecer, Esquivar, Sobrevivir y Retroceso

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: Vitest — `tests/unit/engine/combat.test.ts` y `tests/unit/engine/simulation.test.ts` extendidos (con `random` inyectado de forma determinista, mismo patrón que `specs/016`/`specs/038`), más `tests/unit/shared/UnitDetailPanel.test.tsx` y `tests/unit/data/cats.test.ts`.

**Organización**: depende de `specs/009-clasificacion-habilidades` (`Ability`, bloqueo por `Curse`), `specs/015-catalogo-habilidades-combate` (efectos on-hit, Debilitar), `specs/016-multigolpe-critico` (`random` inyectado, `MultiHit`) y `specs/038-catalogo-habilidades-avanzado` (`MassiveDamage`/`TraitKiller`/`Shield`, la tubería por golpe que esta spec unifica).

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo con otras tareas de su fase (archivos distintos, sin dependencias abiertas).
- **[Story]**: historia de `spec.md` a la que pertenece (US1 Fortalecer, US2 Esquivar, US3 Sobrevivir, US4 Retroceso).

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: tipos, tubería por golpe unificada y firmas — sin ninguna habilidad nueva resolviéndose todavía. Termina con la suite existente en verde (el refactor es sin cambio de comportamiento).

- [X] T001 `src/engine/types.ts`: `Ability` union += `Strengthen` (`{ kind: 'Strengthen'; hpThresholdFraction: number; damageMultiplier: number }`, FR-001), `Dodge` (`{ kind: 'Dodge'; chance: number }`, FR-002), `Survive` (`{ kind: 'Survive'; chance: number }`, FR-003), `Knockback` (`{ kind: 'Knockback'; chance: number; distance: number }`, FR-004), con su comentario `specs/039-habilidades-control-defensa (FR-00x)` igual que los miembros de `specs/038`. `BattleUnit` no cambia (data-model.md).
- [X] T002 `src/screens/shared/UnitDetailPanel.tsx`: reescribe `describeAbility` como `switch (ability.kind)` exhaustivo (el `else` implícito actual para `SummonOnDeath` deja de compilar al ampliar la unión) con los 11 casos — los 7 existentes con su texto actual sin cambio, más `Strengthen` → `Fortalecer (≤{umbral·100}% HP, x{multiplicador})`, `Dodge` → `Esquivar ({chance·100}%)`, `Survive` → `Sobrevivir ({chance·100}%)`, `Knockback` → `Retroceso ({chance·100}%, {distance})`, con `Math.round` en los porcentajes igual que los textos de `specs/038` (FR-010) (depende de T001).
- [X] T003 `src/engine/combat.ts`: generaliza `findMassiveDamage` a `findActiveAbility<K extends Ability['kind']>(unit, kind)` (devuelve `undefined` si `unit.curseRemainingSeconds > 0` o la unidad no declara ese `kind`, research.md Decisión 6) y reemplaza sus usos actuales de `findMassiveDamage` (`applyDamageSequence`, la salpicadura de `resolveAreaEngagement` y `resolveBaseDamage`); `findMatchingTraitKiller` se conserva tal cual (depende de T001).
- [X] T004 `src/engine/combat.ts`: extrae `applyHit(attacker, defender, random, laneLength?)` con el cuerpo actual del bucle de `applyDamageSequence` (daño base → `MassiveDamage` → `Critical` → `TraitKiller`/escudo/`hp` → `applyOnHitEffect`), sin ninguna lógica nueva todavía (data-model.md); `applyDamageSequence` queda como el bucle de `MultiHit` que llama a `applyHit` (con el corte `if (defender.hp <= 0) break` previo a cada golpe); la salpicadura de `resolveAreaEngagement` copia cada objetivo (`{ ...target }`), llama a `applyHit` sobre la copia y marca `state: 'Dead'` si `hp <= 0`, en vez de mantener su cálculo paralelo; `resolveEngagement` y `resolveAreaEngagement` ganan un parámetro final opcional `laneLength?: number` (tras `random`) reenviado a `applyDamageSequence`/`applyHit` (research.md Decisiones 2 y 5) (depende de T003).
- [X] T005 `src/engine/simulation.ts` (`stepSimulation`): los dos llamados a combate entre unidades pasan `Math.random, state.laneLength` — `resolveAreaEngagement(attacker, primary, splashTargets, deltaSeconds, Math.random, state.laneLength)` y `resolveEngagement(attacker, primary, deltaSeconds, Math.random, state.laneLength)`; `resolveBaseDamage` no cambia (depende de T004).
- [X] T006 Regresión verificada: `npx tsc -b` limpio y la suite existente completa de `tests/unit/engine/` (`combat.test.ts` incluidos los bloques de salpicadura de `specs/038`, `simulation.test.ts`, `collision.test.ts`) pasa sin ningún cambio de test tras T001-T005 (FR-009/SC-005 — el refactor de `applyHit` es sin cambio de comportamiento); anotar el conteo de tests en verde (depende de T001-T005). **Verificado**: `npx tsc -b` limpio y 667/667 tests en verde (58 archivos) sin ningún cambio de test existente tras el refactor (medido con `.claude/**` excluido de Vitest, ver nota de `vite.config.ts` en T023).

**Checkpoint**: tipos listos, tubería por golpe unificada en `applyHit`, `laneLength` fluyendo hasta el motor; ninguna habilidad nueva resolviéndose todavía.

---

## Phase 2: User Story 1 - Fortalecer (Priority: P1) 🎯 MVP

**Goal**: una unidad con `Strengthen` multiplica su daño mientras su vida esté en o bajo el umbral configurado.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T007 [US1] `src/engine/combat.ts`: `effectiveDamage(unit)` multiplica el resultado de Debilitar por el `damageMultiplier` de `findActiveAbility(unit, 'Strengthen')` cuando `unit.hp <= unit.maxHp * hpThresholdFraction` (umbral inclusivo); con eso queda cubierto el daño contra unidades, la salpicadura y las bases (FR-001, FR-008, research.md Decisión 4) (depende de T003).
- [X] T008 [P] [US1] `src/data/cats.ts`: agrega `strengthen-cat` (Gato Enfurecido; stats de data-model.md § `src/data/cats.ts`) con `abilities: [{ kind: 'Strengthen', hpThresholdFraction: 0.5, damageMultiplier: 2 }]`, tras los gatos de `specs/038` y antes del spread de `SEED_CATS_AS_CATS`.
- [X] T009 [US1] Test Vitest `tests/unit/engine/combat.test.ts` (nuevo `describe('Fortalecer …', …)`, reutiliza el `makeUnit` del archivo): con `hp: 60`/`maxHp: 100`, umbral `0.5`, multiplicador `2`, daño `10` contra un defensor de `hp: 1000` el golpe baja 10; con `hp: 50` (justo en el umbral, inclusivo) baja 20; con `hp: 10` baja 20; contra la base (`resolveBaseDamage`) con `hp` bajo el umbral baja 20; en salpicadura (`resolveAreaEngagement`, atacante de Área bajo el umbral) el objetivo de salpicadura baja 20; combinado con Debilitar (`weakenRemainingSeconds: 5`, `weakenMagnitude: 0.5`) el daño es `10 × 0.5 × 2`; un atacante bajo `Curse` (`curseRemainingSeconds: 2`) bajo el umbral hace el daño normal (FR-008); `random` espía no se invoca nunca (Fortalecer es determinista, FR-009) (depende de T007).

**Checkpoint**: Fortalecer funcional — MVP del catálogo de control y defensa.

---

## Phase 3: User Story 2 - Esquivar (Priority: P1)

**Goal**: un defensor con `Dodge` anula por completo, con la probabilidad configurada, los golpes de otras unidades.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T010 [US2] `src/engine/combat.ts` (`applyHit`): al inicio, antes de calcular ningún daño, `const dodge = findActiveAbility(defender, 'Dodge')` y, si `dodge !== undefined && random() < dodge.chance`, `return` sin tocar al defensor ni resolver ningún otro roll (FR-002, FR-006, FR-007, FR-008) (depende de T004).
- [X] T011 [P] [US2] `src/data/cats.ts`: agrega `dodge-cat` (Gato Escurridizo, data-model.md) con `abilities: [{ kind: 'Dodge', chance: 0.25 }]`, a continuación de `strengthen-cat`.
- [X] T012 [US2] Test Vitest `tests/unit/engine/combat.test.ts` (nuevo `describe('Esquivar …', …)`): con `chance: 1` y `random` espía `() => 0`, el defensor conserva `hp`, `shieldRemainingHp` y no recibe `weakenRemainingSeconds` aunque el atacante declare `appliesEffect: Weaken`, ni muere por un `TraitKiller` de `chance: 1` del atacante (la espía se invoca exactamente 1 vez — solo el roll de Esquivar); con `chance: 0` el daño es el normal; en una secuencia `MultiHit` de 3 golpes con `random` guionado `[0, 0.9, 0]` y `chance: 0.5` solo el segundo golpe daña (FR-007); en salpicadura el objetivo con Esquivar `chance: 1` conserva su `hp` mientras el primario sin la habilidad sí recibe daño; un defensor bajo `Curse` con Esquivar `chance: 1` recibe el daño normal (FR-008); estadístico (SC-002): con un RNG sembrado y 400 golpes contra `chance: 0.25`, la cantidad de golpes esquivados queda en un rango razonable alrededor de 100 (mismo patrón que `SC-004` de `specs/016`) (depende de T010).

**Checkpoint**: US1+US2 — las dos capacidades priorizadas P1 completas.

---

## Phase 4: User Story 3 - Sobrevivir (Priority: P2)

**Goal**: un defensor con `Survive` queda con 1 de vida, con la probabilidad configurada, ante un golpe que lo mataría.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T013 [US3] `src/engine/combat.ts` (`applyHit`): tras el bloque Killer/escudo/`hp` y antes de `applyOnHitEffect`, `const survive = findActiveAbility(defender, 'Survive')` y, si `defender.hp <= 0 && survive !== undefined && random() < survive.chance`, `defender.hp = 1` (FR-003, FR-007, FR-008); el roll solo se consume ante un resultado letal (depende de T010 — mismo bloque de función).
- [X] T014 [P] [US3] `src/data/cats.ts`: agrega `survivor-cat` (Gato Superviviente, data-model.md) con `abilities: [{ kind: 'Survive', chance: 0.3 }]`, a continuación de `dodge-cat`.
- [X] T015 [US3] Test Vitest `tests/unit/engine/combat.test.ts` (nuevo `describe('Sobrevivir …', …)`): golpe letal (`hp: 5`, daño `10`) con `chance: 1` y `random` `() => 0` deja `hp: 1` y `state` distinto de `'Dead'`; con `chance: 0` (`random` `() => 0.5`) muere (`hp: 0`, `state: 'Dead'`); un golpe no letal es idéntico a una unidad sin la habilidad y no invoca la espía de `random`; con escudo (`shieldRemainingHp: 20`) un golpe de 10 queda absorbido por completo sin invocar `random` (no es letal), y un golpe de 30 contra `hp: 5` deja un excedente letal de 10 que Sobrevivir salva con `hp: 1`; un `TraitKiller` de `chance: 1` contra un defensor del rasgo con Sobrevivir `chance: 1` termina con `hp: 1` (FR-003 — la eliminación instantánea cuenta como letal); dos golpes letales consecutivos hacen cada uno su roll independiente (primero acierta → `hp: 1`, segundo falla → `Dead`); un defensor bajo `Curse` con Sobrevivir `chance: 1` muere (FR-008); en salpicadura el objetivo con Sobrevivir queda con `hp: 1` y `state` distinto de `'Dead'`; estadístico (SC-003): RNG sembrado y 400 golpes letales contra `chance: 0.3`, la cantidad de sobrevivientes queda en un rango razonable alrededor de 120 (depende de T013).

**Checkpoint**: Sobrevivir funcional.

---

## Phase 5: User Story 4 - Retroceso (Priority: P3)

**Goal**: una unidad con `Knockback` desplaza, con la probabilidad configurada, al objetivo golpeado que sigue vivo hacia su propia base, sin sacarlo del carril.

**Independent Test**: spec.md Historia 4.

### Implementation for User Story 4

- [X] T016 [US4] `src/engine/combat.ts`: nueva `knockBack(unit, distance, laneLength?)` (fórmulas de research.md Decisión 5: jugador `x = max(min(x, 0), x - distance)`; enemigo `x = min(max(x, maxX), x + distance)` con `maxX = laneLength - width`, o sin tope superior si `laneLength` es `undefined`) y, en `applyHit`, tras Sobrevivir y antes de `applyOnHitEffect`: `const knockback = findActiveAbility(attacker, 'Knockback')` y, si `defender.hp > 0 && knockback !== undefined && random() < knockback.chance`, `knockBack(defender, knockback.distance, laneLength)` (FR-004, FR-005, FR-007, FR-008); el roll solo se consume si el objetivo sigue vivo (depende de T013 — mismo bloque de función).
- [X] T017 [P] [US4] `src/data/cats.ts`: agrega `knockback-cat` (Gato Empujón, data-model.md) con `abilities: [{ kind: 'Knockback', chance: 0.3, distance: 30 }]`, a continuación de `survivor-cat`.
- [X] T018 [US4] Test Vitest `tests/unit/engine/combat.test.ts` (nuevo `describe('Retroceso …', …)`): un atacante enemigo con Retroceso `chance: 1`/`distance: 30` desplaza a un objetivo del jugador de `x: 100` a `x: 70`; un atacante del jugador desplaza a un objetivo enemigo de `x: 200` a `x: 230` (sin `laneLength`); tope del jugador: `x: 10` → `0` y `x: 0` → `0`; tope del enemigo con `laneLength: 400` y `width: 16`: `x: 370` → `384`, `x: 384` → `384`, `x: 390` (más allá del borde, caso fuera de rango normal) → `390`; un objetivo que muere por el golpe (`hp: 5`, daño `10`) no se desplaza, pero con Sobrevivir `chance: 1` (queda con `hp: 1`) sí; un golpe esquivado (Esquivar `chance: 1`) no desplaza; en salpicadura cada objetivo hace su propio roll (`random` guionado `[0, 0.99]` con `chance: 0.5`: solo el primario se desplaza); un atacante bajo `Curse` no desplaza y no invoca la espía de `random`; en una secuencia `MultiHit` de 3 golpes con `distance: 10` el desplazamiento acumulado es 30, respetando el tope del carril si se alcanza; estadístico (SC-004): RNG sembrado y 400 golpes contra `chance: 0.3`, la cantidad de desplazamientos queda en un rango razonable alrededor de 120 (depende de T016).
- [X] T019 [US4] Test Vitest `tests/unit/engine/simulation.test.ts` (nuevo `describe('specs/039-habilidades-control-defensa (US4 — Retroceso)', …)`, con `vi.spyOn(Math, 'random').mockReturnValue(0)` restaurado al final, reutilizando `makeState`/`makeUnit`): un atacante del jugador con Retroceso `chance: 1`/`distance: 30` que golpea a un enemigo trabado lo deja desplazado en el `units` resultante del mismo tick; con `makeState({ laneLength: 600 })` el tope del enemigo es `600 - width`, no `400 - width` (el `state.laneLength` llega hasta el motor); tras el retroceso, en ticks sucesivos ambas unidades se vuelven a acercar y a trabar con las reglas normales de detección, sin quedar en ningún estado especial ni fuera del carril (depende de T016, T005).

**Checkpoint**: las cuatro historias completas — spec cerrada.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 [P] Test Vitest `tests/unit/data/cats.test.ts` (nuevo `describe('CATS — specs/039-habilidades-control-defensa', …)`): los 4 ids nuevos (`strengthen-cat`, `dodge-cat`, `survivor-cat`, `knockback-cat`) existen en `CATS`, son únicos y no colisionan con ningún id previo, y cada uno declara exactamente la habilidad esperada de data-model.md; el id de cada gato de `specs/038` y de los previos sigue presente (FR-009, sin modificar gatos existentes) (depende de T008, T011, T014, T017).
- [X] T021 [P] Test Vitest `tests/unit/shared/UnitDetailPanel.test.tsx` (nuevo `describe` de `specs/039`): con cada uno de los 4 gatos semilla como poseído (`useMetaStore.setState({ ownedCats: { … } })`), el panel muestra el texto de `describeAbility` esperado (`Fortalecer (≤50% HP, x2)`, `Esquivar (25%)`, `Sobrevivir (30%)`, `Retroceso (30%, 30)`), y una unidad de `specs/038` sigue mostrando su texto actual (FR-010) (depende de T002, T008, T011, T014, T017).
- [X] T022 [P] `npx tsc -b` limpio y `npm run lint` sin warnings en código propio (depende de T001-T021).
- [X] T023 [P] `npm test` — suite completa (existente + T009/T012/T015/T018/T019/T020/T021) en verde, sin regresión (SC-005/SC-006); anotar el nuevo conteo de archivos/tests (depende de T001-T021). **Verificado**: `npx tsc -b` limpio, `npm run lint` sin warnings en código propio, `npm run build` limpio y `npm test` en verde — 58 archivos / 713 tests (667 previos + 46 nuevos: 8 Fortalecer, 6 Esquivar, 10 Sobrevivir, 11 Retroceso en `combat.test.ts`, 3 de integración de Retroceso en `simulation.test.ts`, 3 de datos en `cats.test.ts`, 5 del panel). Nota: el README previo citaba 77 archivos/776 tests porque `vitest` también recogía los tests de un worktree antiguo de la app de escritorio en `.claude/worktrees/`; `vite.config.ts` ahora lo excluye (`exclude: [...configDefaults.exclude, '.claude/**']`) para que `npm test` cuente solo este proyecto.
- [X] T024 Recorrido manual en el navegador siguiendo `quickstart.md` § Validación manual: gatos semilla inyectados en `ownedCats`, textos correctos en el detalle de unidad, Retroceso visible en una batalla real (enemigo golpeado salta hacia atrás sin salir del carril), Fortalecer duplicando daño bajo la mitad de vida, y consola sin errores nuevos (depende de T022, T023). **Verificado** (app real con `npm run dev`; los 4 gatos semilla inyectados en `ownedCats`/`teamFormation` de IndexedDB y el store de la partida accedido desde la consola; el ticker de Pixi se throttlea en el panel embebido, así que la simulación se avanzó con `useGameStore.tick(dt)` — mismo código que el bucle real): el detalle de unidad de cada gato nuevo muestra `Fortalecer (≤50% HP, x2)`, `Esquivar (25%)`, `Sobrevivir (30%)` y `Retroceso (30%, 30)`; en una batalla completa de `imperio-cap1-etapa-1` con Gatos Empujón, Merodeador y Escudero fueron empujados +30 de `x` (220.9→250.9, 257.2→287.2) sin que ninguna unidad saliera del carril (`x` entre 0.6 y 383.3 con `laneLength` 400) y la batalla terminó en Victoria; con 400 golpes de 1 de daño contra el Gato Escurridizo se esquivaron 100 (25%); con 300 golpes letales contra el Gato Superviviente 94 quedaron con 1 de vida (31%); el Gato Enfurecido infligió 9 de daño con 100 de HP y 18 con 55 y con 20 de HP (umbral inclusivo); consola del navegador sin errores.
- [X] T025 `README.md`: fila `039` en la tabla de specs (estado y conteo de tareas), viñeta nueva en "Contenido de juego" (Fortalecer/Esquivar/Sobrevivir/Retroceso y los 4 gatos semilla), cifras de "Estado actual" (cantidad de specs, archivos y tests de T023), "Qué falta" sin las cuatro habilidades ya hechas y con la nota de que los gatos de demostración `Raro` de `038`/`039` entran en el pool de la Cápsula (`shield-cat`, de rareza `Especial`, no), y árbol de `src/` sin cambios estructurales (depende de T023).

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: T001 → T002/T003 → T004 → T005 → T006. Bloquea todo lo demás. T002 (panel) y T003 (`combat.ts`) solo dependen de T001 y se pueden hacer en paralelo entre sí.
- **US1 (Fase 2)**: depende de Foundational (T003) — toca `effectiveDamage`, no `applyHit`, así que es independiente de US2-US4.
- **US2 (Fase 3)**: depende de Foundational (T004, `applyHit`).
- **US3 (Fase 4)**: depende de US2 (T010 — mismo bloque de `applyHit`, el orden de FR-006 se construye de arriba hacia abajo); no depende de su seed/test.
- **US4 (Fase 5)**: depende de US3 (T013, mismo motivo) y de Foundational (T005 para el test de integración).
- **Polish (Fase 6)**: depende de que las cuatro historias estén completas.

## Parallel Opportunities

- T002 y T003 (Foundational) en paralelo — archivos distintos.
- Dentro de cada historia, el seed de `src/data/cats.ts` (T008/T011/T014/T017) es independiente del test de `combat.test.ts` (T009/T012/T015/T018) — pero los seeds comparten archivo entre sí y los tests de motor también, así que no se paralelizan entre historias.
- US1 puede implementarse en paralelo con US2-US4 una vez terminado Foundational (no comparte función con ellas).
- T020/T021/T022/T023 (Polish) en paralelo entre sí.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational) — tipos, `applyHit` unificada y `laneLength` listos, suite existente en verde.
2. Completar Fase 2 (US1) — Fortalecer funcional.
3. **STOP y VALIDAR**: una unidad con Fortalecer inflige exactamente el multiplicador configurado en o bajo su umbral de vida y su daño normal por encima.

### Incremental Delivery

1. Foundational → refactor sin cambio de comportamiento, tipos listos.
2. + US1 → Fortalecer (MVP).
3. + US2 → Esquivar.
4. + US3 → Sobrevivir.
5. + US4 → Retroceso — spec completa.
6. Polish → tests de datos/panel, tsc/lint/test completos, recorrido manual, README.
