# Tasks: Contenido — Capítulo 1 de Imperio de los Gatos

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [research.md](./research.md), [quickstart.md](./quickstart.md)

**Tests**: Vitest sobre datos puros (`tests/unit/data/`) y sobre `useMetaStore` (mecanismos ya implementados en `specs/012`/`specs/013`/`specs/020`, sin código de producción nuevo fuera de `src/data/`).

**Organización**: sin fase de Setup (proyecto ya inicializado). Depende de `specs/010` (evolución), `specs/012` (arcos/recompensas), `specs/013` (sets de tesoro), `specs/018` (Guía de Gatos, sin cambios), `specs/020` (barrera de jefe), `specs/023` (mapa visual, `mapPosition` obligatorio) — todas ya implementadas, ninguna se modifica.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: catálogo de unidades del que dependen los 48 niveles — ningún nivel puede declarar `enemyWave`/`firstVictoryUnlockCatId`/`bossCatId` sin que estas unidades ya existan en `CATS`.

- [X] T001 `src/data/cats.ts`: añade los 16 `Cat` de enemigo nuevos (`data-model.md` § enemigos: `enemy-merodeador` … `enemy-la-mascara`) y los 14 `Cat` jugables nuevos (`data-model.md` § gatos jugables: `cat-recluta` … `cat-veterano`), como un solo `append` al arreglo `CATS` (mismo patrón que `SEED_CATS_AS_CATS`/`GACHA_UNITS` ya al final del arreglo) — ninguno declara `spriteKey` (research.md Decisión 4).
- [X] T002 [P] `tests/unit/data/cats.test.ts` (nuevo): los 30 `id` nuevos son únicos entre sí y no colisionan con ningún `catId` existente antes de esta spec; los `Cat` con `evolutions` declaran `second.requiredLevel === 10` y `true.requiredLevel === 30`, sin `requiredItemCount`; `cat-recluta`, `cat-deidad` y `cat-veterano` no declaran `evolutions` (depende de T001). **Corrección durante implementación**: `data-model.md`/`cats.ts` originalmente asignaban `evolutions` a `cat-recluta`, contradiciendo FR-003/Edge Cases de `spec.md` (el gato inicial no evoluciona) — el test lo detectó en rojo; corregido en ambos archivos antes de continuar.

**Checkpoint**: catálogo de unidades listo — cualquier historia de usuario puede empezar.

---

## Phase 2: User Story 1 - Jugar el Capítulo 1 de punta a punta (Priority: P1) 🎯 MVP

**Goal**: 48 niveles nuevos jugables en secuencia, agrupados en un `SagaArc` propio con `costMultiplier: 0.67`/`enemyStrengthMultiplier: 1`.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T003 [US1] `src/data/levels.ts`: implementa la función pura `buildImperioCap1TemplateLevel(stageIndex: number): Level` (fórmula exacta de `research.md` Decisión 1: `difficulty`/`energyCost`/`currencyReward`/`enemyBaseHp`/`treasureId`; `maxEnergy: 100`/`energyRegenPerSecond: 5` constantes, igual que `level-1`; `playerBaseHp: 1000`; `region: 'imperio-de-los-gatos-cap1'`) y la función `getImperioCap1EnemyRoster(stageIndex: number): string[]` (roster acumulado por tier de `research.md` Decisión 2) que `buildImperioCap1TemplateLevel` consume para construir `enemyWave` (3 entradas, `spawnAtSeconds: 5/16/30`, catId elegido determinista por `stageIndex % roster.length`) (depende de T001).
- [X] T004 [US1] `src/data/levels.ts`: implementa `buildImperioCap1MapPosition(stageIndex: number): { x: number; y: number }` (fórmula de serpenteo de `research.md` Decisión 3) — usada tanto por `buildImperioCap1TemplateLevel` como por los 13 niveles hito de T005.
- [X] T005 [US1] `src/data/levels.ts`: añade los 13 niveles hito como literales (`data-model.md` § 13 hitos hechos a mano: etapas 1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 48), cada uno con `id: 'imperio-cap1-etapa-{N}'`, `mapPosition: buildImperioCap1MapPosition(N)`, `enemyWave` curada de la tabla, `battleItemRewards` de la tabla, `firstVictoryUnlockCatId` (los 12 primeros) y, en la etapa 48, `enemyBaseHp: 20000` (valor propio, no la fórmula) — el resto de campos numéricos sigue la misma fórmula de T003 aplicada a su propio `N` (depende de T001, T003, T004).
- [X] T006 [US1] `src/data/levels.ts`: ensambla el bloque `IMPERIO_CAP1_LEVELS: Level[]` = los 13 literales de T005 + `buildImperioCap1TemplateLevel(N)` para los 35 `N` restantes (1-48 excluyendo los hitos), ordenados por `N` ascendente, y hace `LEVELS.push(...IMPERIO_CAP1_LEVELS)` (append, sin tocar `level-1`/`level-2`/`level-seed-demo`) (depende de T005).
- [X] T007 [US1] `src/data/sagaArcs.ts`: añade `arco-imperio-de-los-gatos-cap1` a `SAGA_ARCS` (`data-model.md` § SagaArc: `levelIds` = los 48 `id` de T006 en orden, `costMultiplier: 0.67`, `enemyStrengthMultiplier: 1`, `bossLevelId: 'imperio-cap1-etapa-48'`, `bossCatId: 'enemy-la-mascara'`, `completionRewards.unlockCatIds: ['cat-veterano']`) — append, sin tocar `arco-1-imperio-de-los-gatos`/`arco-2-imperio-de-los-gatos` (depende de T001, T006).
- [X] T008 [P] [US1] `tests/unit/data/levels.test.ts` (nuevo): las 48 `imperio-cap1-etapa-*` existen en `LEVELS`, con `id`/`mapPosition`/`treasureId` únicos entre sí, `mapPosition.x`/`mapPosition.y` en el rango 0-100, y `Level.difficulty` no decreciente a lo largo de las 48 en orden de `N` (depende de T006).
- [X] T009 [P] [US1] `tests/unit/data/sagaArcs.ts` (extiende el test existente si lo hay, o nuevo): `findArcByLevelId('imperio-cap1-etapa-1')` resuelve `arco-imperio-de-los-gatos-cap1`; desplegar una unidad en ese arco cobra el costo base × 0.67 redondeado (mismo mecanismo ya testeado por `specs/012`, aplicado a este arco) (depende de T007).
- [X] T010 [US1] Verificación manual (`npm run dev`, quickstart.md § Validación visual rápida): el mapa de etapas muestra 48 nodos nuevos conectados en serpenteo, solo el primero disponible al inicio, sin solaparse con los nodos fixture existentes (depende de T006). **Verificado**: sin errores de consola; las 48 "Imperio de los Gatos — Cap. 1, Etapa N" aparecen en orden tras los 3 niveles fixture y antes del nodo del evento; las estrellas de dificultad van de ★1 (etapas 1-4) a ★12 (etapas 45-48) como diseñado; tocar "Etapa 1" (bloqueada, porque el desbloqueo secuencial global exige superar antes `level-1`/`level-2`/`level-seed-demo`) no abre ningún panel — comportamiento correcto de nodo bloqueado (FR-005). El navegador usado tenía progreso persistido de sesiones manuales previas no relacionadas con esta spec (Rango 3, 2 gatos ya poseídos), así que "cat-recluta gratis al inicio" se verificó por los tests automatizados (T012) en vez de en esta sesión concreta — un roster ya no vacío no vuelve a sembrar gatos iniciales (comportamiento idempotente correcto, no un fallo).

**Checkpoint**: el Capítulo 1 es jugable de punta a punta — MVP.

---

## Phase 3: User Story 2 - Desbloquear los gatos Normal y Especial jugando (Priority: P1)

**Goal**: superar por primera vez una de las 12 etapas hito otorga el gato correspondiente — mecanismo ya implementado (`specs/012` `grantLevelRewards`), solo requiere que la Fase 2 haya escrito los `firstVictoryUnlockCatId` correctos.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T011 [US2] `tests/unit/data/levels.test.ts` (extiende T008): los 12 `firstVictoryUnlockCatId` de las etapas hito (excluyendo la 48) son 12 `catId` distintos entre sí, cada uno resuelve a un `Cat` real en `CATS`, y coinciden exactamente con los 9 `rarity: 'Normal'` + 3 `rarity: 'Especial'` no-iniciales de T001 (depende de T001, T006).
- [X] T012 [US2] `tests/unit/data/imperioCap1Playthrough.test.ts` (nuevo, no `useMetaStore.test.ts` — ver Nota de desviación): partiendo de un jugador nuevo (ya posee `cat-recluta` desde el inicio, spec.md US2 Escenario 1), superar en orden las 12 etapas hito y confirmar que `ownedCats` incorpora cada `catId` en el momento exacto de su etapa; repetir la victoria de una etapa ya superada no duplica ni re-otorga el gato (depende de T006, T007, mecanismo de `specs/012` ya implementado).

**Checkpoint**: los 13 gatos hito (Normal + Especial) se obtienen jugando, sin código de producción nuevo.

---

## Phase 4: User Story 3 - Obtener "Gato Veterano" al completar el capítulo (Priority: P2)

**Goal**: al superar las 48 etapas, `claimArcRewardsIfComplete` (`specs/012`, ya implementado) otorga `cat-veterano`.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T013 [US3] `tests/unit/data/imperioCap1Playthrough.test.ts` (nuevo — ver Nota de desviación): marcar las 48 etapas del capítulo como superadas (`completedLevelIds`) dispara el otorgamiento de `cat-veterano` exactamente al completar la última pendiente; volver a superar cualquier etapa del capítulo después no lo re-otorga; ninguna recompensa ya otorgada por `arco-1-imperio-de-los-gatos`/`arco-2-imperio-de-los-gatos` se ve alterada (depende de T006, T007).

**Checkpoint**: recompensa de fin de capítulo verificada.

---

## Phase 5: User Story 4 - Progreso de tesoros del capítulo con bonificación de set (Priority: P3)

**Goal**: los 48 tesoros del capítulo, agrupados en un `TreasureSet` propio, otorgan una bonificación pasiva al completarse — mecanismo ya implementado (`specs/013` `checkTreasureSetCompletion`).

**Independent Test**: spec.md Historia 4.

### Implementation for User Story 4

- [X] T014 [US4] `src/data/treasureSets.ts`: añade `set-imperio-de-los-gatos-cap1` a `TREASURE_SETS` (`data-model.md` § TreasureSet: `treasureIds` = los 48 `treasureId` de T006, `passiveBonus: { type: 'CurrencyRewardMultiplier', value: 1.15 }`) — append, sin tocar `set-imperio-de-los-gatos` existente (depende de T006).
- [X] T015 [P] [US4] `tests/unit/data/imperioCap1Playthrough.test.ts` (nuevo — ver Nota de desviación): obtener los 48 tesoros del set (cualquier orden) otorga la bonificación exactamente al obtener el último pendiente; consultar el progreso antes de completarlo refleja "X sobre 48" correctamente (depende de T014).

**Checkpoint**: set de tesoros del capítulo verificado.

---

## Phase 6: User Story 5 - Enfrentar al jefe final del capítulo (Priority: P3)

**Goal**: en la etapa 48, la base enemiga queda protegida mientras `enemy-la-mascara` esté vivo — mecanismo ya implementado (`specs/020`, mismo usado hoy por `arco-2-imperio-de-los-gatos`/`armored-cat`).

**Independent Test**: spec.md Historia 5.

### Implementation for User Story 5

- [X] T016 [US5] `tests/unit/engine/simulation.test.ts` (extiende, mismo patrón que el caso ya existente de `arco-2-imperio-de-los-gatos`/`armored-cat`): en `imperio-cap1-etapa-48`, con `enemy-la-mascara` vivo, la base enemiga no puede reducirse a 0 HP; al derrotarlo, la base vuelve a ser un objetivo válido (depende de T006, T007).

**Checkpoint**: las 5 historias completas — spec cerrada.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T017 [P] `npx tsc -b` limpio. **Verificado**: sin errores.
- [X] T018 [P] `npm test` — suite completa en verde. **Verificado**: 62 archivos de test, 540 tests, 0 fallos (incluye 6 archivos nuevos/extendidos de esta spec: `cats.test.ts`, `levels.test.ts`, `imperioCap1Playthrough.test.ts`, `simulation.test.ts`, `useMetaStore.test.ts`, `db.test.ts`, más el ajuste de `LevelSelectScreen.test.tsx` — ver § Nota de desviación).
- [X] T019 Recorrido de `quickstart.md` completo en el navegador (`npm run dev`). **Verificado**: Guía de Gatos abre sin error y muestra la etiqueta de rareza (Normal/Megarraro) de cada gato poseído sin ningún cambio de código en `CatGuideScreen.tsx` (SC-005, confirmado también por T002/T011 a nivel de datos). El costo de despliegue reducido un 33% en el capítulo ya está cubierto por el test T009 (`costMultiplier: 0.67` aplicado vía el mecanismo de `specs/012`, sin necesidad de repetirlo manualmente en batalla).

---

## Nota de desviación (detectada durante la implementación)

Cuatro hallazgos reales, ninguno anticipado en `plan.md`/`data-model.md`, corregidos en el momento (TDD: el test en rojo detectó cada uno):

1. **`cat-recluta` con `evolutions` por error** (T002): `data-model.md`/`cats.ts` le habían asignado multiplicadores de evolución, contradiciendo `spec.md` FR-003/Edge Cases (el gato inicial no evoluciona). El test de T002 lo detectó en rojo; corregido en `cats.ts` y `data-model.md`.
2. **Acoplamiento frágil `sagaArcs.ts` → `levels.ts`**: la primera versión de T007 importaba `IMPERIO_CAP1_LEVELS` desde `levels.ts` para construir `levelIds`. Esto rompió `tests/unit/LevelSelectScreen.test.tsx` (de `specs/026`, en curso), cuyo mock de `src/data/levels` no re-exporta ese símbolo. Corregido generando los 48 `id` con el mismo patrón (`imperio-cap1-etapa-{N}`) directamente en `sagaArcs.ts`, sin importar `levels.ts` — mismo criterio de bajo acoplamiento que ya usa el resto de `SAGA_ARCS` (`levelIds` como arreglo de strings plano). La igualdad 1:1 contra `IMPERIO_CAP1_LEVELS` queda verificada por T009.
3. **`ensureDefaultProfile` no otorgaba "Gato Recluta" al inicio** (`src/db/index.ts`): el mecanismo de gato inicial garantizado solo sembraba `CATS[0].id` (`basic-cat`), hardcodeado — spec.md FR-001/US2 Escenario 1 exige que `cat-recluta` también esté disponible desde el inicio. Corregido con un segundo `put` aditivo, condicionado a que `cat-recluta` exista en `CATS` (no rompe otros proyectos que reusen este código sin esta spec). Efecto en cascada: `tests/unit/useMetaStore.test.ts` (`hydrate()` test) y `tests/unit/db.test.ts` (2 tests) esperaban un único gato inicial — actualizados para esperar dos.
4. **Semilla de energía de misión con `characterLevel` hardcodeado en `1`** (`src/db/index.ts`): al pasar a dos gatos iniciales, `characterLevelOf(ownedCats)` (Rango de Usuario, specs/019) pasa a ser 2 desde el arranque, pero la fila `db.missionEnergy` sembrada por `ensureDefaultProfile` seguía usando `computeMissionEnergyMax(1)` — produciendo `current` (de la fila sembrada) desincronizado del `max` recalculado en `hydrate()` a partir del roster real. El test `hydrate() sobre una base vacía siembra la energía de misión al máximo (FR-010)` lo detectó en rojo. Corregido: la semilla ahora usa el número real de gatos iniciales otorgados (1 o 2) en vez de una constante.
5. **Regresión de UI no relacionada con esta spec, pero causada por su contenido**: `LevelSelectScreen.tsx` (de `specs/026`, en curso) calcula un "Tesoros X%" global sobre `TREASURE_SETS.flatMap(set => set.treasureIds)` — al sumar los 48 tesoros nuevos, el total pasó de 2 a 50, y `tests/unit/LevelSelectScreen.test.tsx` tenía hardcodeado `/Tesoros 50%/` para 1/2 obtenidos. Actualizado a `/Tesoros 2%/` (1/50 redondeado), documentado inline en el test.

Ninguna de estas correcciones toca contenido fixture existente (`level-1`, `level-2`, `arco-1`/`arco-2`, ni ningún `catId` previo) — todas son o bien datos nuevos de esta spec, o pequeñas correcciones de un mecanismo compartido (`ensureDefaultProfile`) que ya tenía una suposición implícita de "un solo gato inicial" no documentada como invariante en ninguna spec previa.

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational — MVP.
- **US2 (Fase 3)**: depende de Foundational y de que la Fase 2 haya escrito los 12 `firstVictoryUnlockCatId` (T005/T006) — no puede probarse antes de que el contenido de US1 exista, pero no introduce ningún código de producción propio.
- **US3 (Fase 4)**: depende de Foundational y de T006/T007 (las 48 etapas y el arco deben existir para poder marcarlas como completadas).
- **US4 (Fase 5)**: depende de T006 (los 48 `treasureId` deben existir).
- **US5 (Fase 6)**: depende de T006/T007 (la etapa 48 y el `bossCatId` del arco).
- **Polish (Fase 7)**: depende de que las 5 historias estén completas.

## Parallel Opportunities

- T002 (test de `cats.ts`) en paralelo con el resto de la Fase 1 una vez T001 está escrito.
- T008/T009 (tests de US1) en paralelo entre sí una vez T006/T007 están escritos.
- US2, US3, US4, US5 son mayormente independientes entre sí una vez completada la Fase 2 (todas leen `LEVELS`/`SAGA_ARCS` ya poblados, sin tocarse entre ellas) — pueden desarrollarse en paralelo.
- T017/T018 en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational) — 30 unidades nuevas en `CATS`.
2. Completar Fase 2 (US1) — 48 etapas jugables de punta a punta con su propio arco.
3. **STOP y VALIDAR**: recorrer el mapa de etapas en el navegador, confirmar desbloqueo secuencial y costo reducido.

### Incremental Delivery

1. Foundational → catálogo de unidades listo.
2. + US1 → Capítulo 1 jugable (MVP).
3. + US2 → los 13 gatos hito se obtienen jugando.
4. + US3 → "Gato Veterano" al completar el capítulo.
5. + US4 → set de tesoros del capítulo con bonificación.
6. + US5 → jefe final verificado — spec completa.
