---
description: "Task list template for feature implementation"
---

# Tasks: Mapa Visual de Etapas, Catálogo Completo de Gatos y Grilla de Despliegue

**Input**: Design documents from `specs/023-mapa-de-etapas-visual/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Tests**: Incluidos — el proyecto ya tiene cobertura Vitest para cada feature previa (`tests/unit/`) y `quickstart.md` de esta feature depende de que existan las suites ampliadas de `LevelSelectScreen.test.tsx`, `useMetaStore.test.ts`, `TeamScreen.test.tsx` y `BattleScreen.test.tsx`.

**Organization**: Tareas agrupadas por historia de usuario (US1/US2/US3 de [spec.md](spec.md)) para que cada una sea implementable y verificable de forma independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto, sin dependencia de una tarea incompleta)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Proyecto único (SPA React + Pixi.js): `src/`, `tests/unit/` en la raíz del repo — ver plan.md § Project Structure.

---

## Phase 1: Setup

**Purpose**: Confirmar que no hace falta infraestructura nueva antes de tocar código de la feature

- [X] T001 Confirmar que no se requiere ninguna dependencia npm nueva (research.md Decisión 1: el mapa se implementa en React puro + CSS/SVG, sin `@pixi/react` adicional) y que la rama activa es `023-mapa-de-etapas-visual` — no crea código, solo verifica supuestos de research.md antes de empezar

**Checkpoint**: Sin bloqueos de tooling — se puede empezar Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `Level.mapPosition` es un campo obligatorio (spec.md Edge Cases) — su adición rompe la compilación de cualquier literal `Level`/`EventBanner.specialStage` existente en todo el repo, no solo en los archivos que toca US1. Como `npx tsc -b`/`npm test` son gates de proyecto completo (no por historia), este arreglo es un prerrequisito compartido antes de que cualquier historia pueda validarse.

**⚠️ CRITICAL**: Ninguna historia de usuario puede darse por verificable (`tsc -b`/`npm test` en verde) hasta que este archivo compile

- [X] T002 En `src/data/levels.ts`, agregar el campo obligatorio `mapPosition: { x: number; y: number }` a la interfaz `Level`, y asignar los valores de data-model.md a los 3 niveles existentes: `level-1` → `{ x: 15, y: 80 }`, `level-2` → `{ x: 45, y: 55 }`, `level-seed-demo` → `{ x: 75, y: 30 }`
- [X] T003 En `src/data/events.ts`, agregar `mapPosition: { x: 90, y: 88 }` al literal `specialStage` de `evento-etapas-de-fantasia-fase-especial` (mismo tipo `Level`, sin cambio de forma) — depende de T002. Valor ajustado de `{x:90,y:12}` a `{x:90,y:88}` tras verificación con Playwright (T023): la esquina superior derecha queda físicamente cubierta por `.stage-detail-panel` mientras está abierto.
- [X] T004 Ejecutar `npx tsc -b` y corregir cada error de "falta la propiedad `mapPosition`" que aparezca en fixtures de test con literales `Level`/`EventBanner.specialStage` — como mínimo `tests/unit/data/events.test.ts` (helper `makeBanner`), `tests/unit/useGameStore.test.ts` y `tests/unit/engine/simulation.test.ts` (arrays `LEVELS` mockeados vía `vi.mock`) — usar cualquier valor válido de `{x,y}` (0-100), ya que estos fixtures no ejercitan la UI del mapa (research.md Decisión 4); NO tocar `tests/unit/LevelSelectScreen.test.tsx` aquí — se reescribe entero en T006 — depende de T002, T003
- [X] T005 Confirmar `npx tsc -b` sin errores y `npm test` en verde (con las suites de T004 ya corregidas) antes de tocar código de cualquier historia de usuario

**Checkpoint**: Compilación y suite existente en verde — las 3 historias de usuario pueden implementarse en cualquier orden o en paralelo.

---

## Phase 3: User Story 1 - Navegar el progreso mediante un mapa visual de nodos (Priority: P1) 🎯 MVP

**Goal**: Reemplazar la lista vertical de `LevelSelectScreen` por un mapa de nodos circulares conectados por líneas, con panel de detalle y botón "¡Atacar!", reutilizando sin modificar toda la lógica de desbloqueo/energía/inicio de batalla ya existente (spec.md FR-001 a FR-009).

**Independent Test**: Abrir "Niveles" con progreso parcial (algún nivel completado, el siguiente disponible, el resto bloqueado) y confirmar visualmente los tres estados en el mapa, que tocar el nodo disponible abre el panel y permite jugarlo, y que un nodo bloqueado no tiene efecto.

### Tests for User Story 1

> Escribir primero — deben fallar contra la pantalla de lista todavía vigente

- [X] T006 [P] [US1] Reescribir `tests/unit/LevelSelectScreen.test.tsx` por completo para el mapa de nodos: con progreso parcial (`highestUnlockedLevelIndex`/`completedLevelIds`), cada nodo refleja el estado correcto (`getLevelState`); tocar un nodo disponible/completado abre el panel de detalle con nombre, estrellas (`Level.difficulty`) y costo de energía; tocar un nodo bloqueado no abre nada ni navega; "¡Atacar!" descuenta `missionEnergy` y navega a `Battle` igual que el "Jugar" anterior; "¡Atacar!" queda deshabilitado sin energía suficiente; con un `EventBanner` activo (mock de `EVENT_BANNERS`/`resolveLevel`/`isEventStageId`, mismo patrón de `vi.mock` que la versión anterior de este archivo) su nodo aparece distinguido y fuera de la cadena de líneas — cubre spec.md US1 Acceptance Scenarios 1-6

### Implementation for User Story 1

- [X] T007 [US1] En `src/theme.css`, agregar las clases del mapa: `.stage-map` (contenedor relativo), `.stage-node`/`.stage-node--locked`/`.stage-node--unlocked`/`.stage-node--completed`/`.stage-node--event` (nodo circular, borde dorado para `--event`), `.stage-detail-panel` (panel lateral) — estilo basado en la sección `isStages` del mockup base (spec.md Input)
- [X] T008 [US1] Reescribir `src/screens/LevelSelectScreen.tsx`: un `<svg viewBox="0 0 100 100">` con una `<line>` entre cada par consecutivo `LEVELS[i].mapPosition`/`LEVELS[i+1].mapPosition` (FR-002, data-model.md § Líneas conectoras); un nodo `<button>` posicionado en `%` por `Level`/fase especial de evento activo (FR-001), con estado vía `getLevelState` sin modificar (FR-003) y el nodo de evento visualmente distinto y fuera de la cadena de líneas (FR-008); estado local `selectedNodeId` que abre el panel de detalle (nombre, estrellas, costo) al tocar un nodo disponible/completado (FR-004) y no hace nada sobre uno bloqueado (FR-005); botón "¡Atacar!" reutilizando el `handlePlay` ya existente (`spendMissionEnergy` → `consumeSelectedBattleItems` → `startLevel` → `onNavigate('Battle')`), deshabilitado si `missionEnergy.current` es menor al costo del nodo seleccionado, reactivo sin necesidad de cerrar el panel (FR-006/007, Edge Cases); indicador de energía de misión (`hud-chip` ya existente) visible sin quedar tapado (FR-009) — depende de T002, T003 (datos), T007 (clases CSS)
- [X] T009 [US1] Ejecutar `npx vitest run tests/unit/LevelSelectScreen.test.tsx` y confirmar verde; ejecutar `npx tsc -b` para confirmar que no hay regresión de tipos

**Checkpoint**: US1 demostrable — mapa navegable de punta a punta, con el mismo flujo de entrada a batalla que antes.

---

## Phase 4: User Story 2 - Todos los gatos jugables del catálogo son obtenibles jugando (Priority: P1)

**Goal**: Los 13 `catId` jugables sin camino de obtención (núcleo original, habilidades de combate, multigolpe/crítico y catálogo semilla) se otorgan al completar `arco-1`/`arco-2`, reutilizando `SagaArc.completionRewards.unlockCatIds` ya implementado (spec.md FR-010 a FR-013).

**Independent Test**: Completar `arco-1-imperio-de-los-gatos` y `arco-2-imperio-de-los-gatos` de punta a punta y confirmar en `ownedCats` que los 13 gatos antes inalcanzables ahora están poseídos, sin alterar ninguna recompensa ya otorgada por esos arcos.

### Tests for User Story 2

> Escribir primero — deben fallar contra el `completionRewards` actual (`arco-1` sin `unlockCatIds`, `arco-2` con `{}`)

- [X] T010 [P] [US2] Ampliar `tests/unit/useMetaStore.test.ts`: con `completedLevelIds` incluyendo `level-1`, `claimArcRewardsIfComplete('arco-1-imperio-de-los-gatos')` otorga exactamente `speed-cat, heavy-cat, armored-cat, frost-cat, weaken-cat, slow-cat, zombie-ward-cat` (data-model.md) sin tocar `firstVictoryUnlockCatId`/`grantedArcRewardIds` de recompensas previas; con `completedLevelIds` incluyendo además `level-2`, `claimArcRewardsIfComplete('arco-2-imperio-de-los-gatos')` otorga `triple-strike-cat, lucky-cat, seed-cat-basic, seed-cat-wall, seed-cat-ranged, seed-cat-titan`; volver a llamar `claimArcRewardsIfComplete` sobre un arco ya otorgado no duplica ni vuelve a otorgar (guard monótono ya existente) — cubre spec.md US2 Acceptance Scenarios 2-4

### Implementation for User Story 2

- [X] T011 [US2] En `src/data/sagaArcs.ts`, agregar `completionRewards.unlockCatIds` a `arco-1-imperio-de-los-gatos` (los 7 `catId` de data-model.md, junto al `unlockNextArcId` ya existente sin tocarlo — FR-012) y a `arco-2-imperio-de-los-gatos` (los 6 `catId` restantes, reemplazando `completionRewards: {}` por `completionRewards: { unlockCatIds: [...] }`)
- [X] T012 [US2] Ejecutar `npx vitest run tests/unit/useMetaStore.test.ts` y confirmar verde; ejecutar `npm test` completo y confirmar cero regresiones en las suites existentes de `specs/012-saga-imperio-de-los-gatos` (SC-004)

**Checkpoint**: US2 demostrable — completar ambos arcos deja 16 `catId` poseídos (SC-003), sin regresión en recompensas previas.

---

## Phase 5: User Story 3 - Barra de despliegue en grilla fija, sin scroll horizontal (Priority: P2)

**Goal**: `DeployBar` distribuye el equipo activo en una grilla fija de 6 columnas en vez de un `flex` con scroll, con el equipo activo acotado a un máximo de 6 `catId` (spec.md FR-014 a FR-016).

**Independent Test**: Con un equipo activo de tamaño máximo confirmado, entrar a una batalla y confirmar que todos los botones de despliegue son visibles sin scroll, distribuidos en columnas iguales.

### Tests for User Story 3

> Escribir primero — deben fallar contra el `setActiveTeam`/`DeployBar`/`TeamScreen` actuales, sin tope

- [X] T013 [P] [US3] Ampliar `tests/unit/useMetaStore.test.ts`: `setActiveTeam` con 7 `catId` retorna `false` y no muta `activeTeamCatIds` (mismo patrón que el test ya existente de selección vacía) — cubre FR-015
- [X] T014 [P] [US3] Ampliar `tests/unit/TeamScreen.test.tsx`: con 6 gatos poseídos ya seleccionados, el checkbox de un 7º gato poseído queda deshabilitado (no se puede marcar) — cubre US3 Acceptance Scenario 2
- [X] T015 [P] [US3] Ampliar `tests/unit/BattleScreen.test.tsx`: con `activeTeamCatIds` seteado a 7 `catId` poseídos, `DeployBar` renderiza como máximo los primeros 6 botones, sin error ni pantalla en blanco — cubre FR-016/US3 Acceptance Scenario 3

### Implementation for User Story 3

- [X] T016 [US3] En `src/state/useMetaStore.ts`, exportar `MAX_ACTIVE_TEAM_SIZE = 6` junto a `setActiveTeam` (data-model.md), y agregar el guard `catIds.length > MAX_ACTIVE_TEAM_SIZE` → `return false` (mismo patrón de rechazo sin efecto que el guard de selección vacía ya existente)
- [X] T017 [P] [US3] En `src/screens/TeamScreen.tsx`, importar `MAX_ACTIVE_TEAM_SIZE` de `useMetaStore` y deshabilitar el checkbox de un `catId` no seleccionado cuando `selectedIds.length >= MAX_ACTIVE_TEAM_SIZE` (mismo patrón que `disabledToSelect` de `BattleItemSelector` en el mismo archivo) — depende de T016
- [X] T018 [P] [US3] En `src/screens/BattleScreen.tsx`, importar `MAX_ACTIVE_TEAM_SIZE` de `useMetaStore` y recortar la lista `ownedCats` de `DeployBar` con `.slice(0, MAX_ACTIVE_TEAM_SIZE)` antes de renderizar los botones — depende de T016
- [X] T019 [US3] En `src/theme.css`, cambiar `.deploy-bar` de `display:flex` (con `overflow-x`/`flex-wrap`) a `display:grid; grid-template-columns:repeat(6,1fr)` (FR-014) — mismo archivo que T007 (clases `.stage-*` de US1), bloque de reglas disjunto, sin conflicto
- [X] T020 [US3] Ejecutar `npx vitest run tests/unit/useMetaStore.test.ts tests/unit/TeamScreen.test.tsx tests/unit/BattleScreen.test.tsx` y confirmar verde

**Checkpoint**: US3 demostrable — equipo acotado a 6, grilla fija sin scroll, equipos heredados de más de 6 degradan sin romper nada.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Higiene final y evidencia de no-regresión sobre el resto del proyecto

- [X] T021 [P] Añadir comentarios de una línea con referencia `specs/023-mapa-de-etapas-visual` en los campos/exports nuevos (`Level.mapPosition`, `MAX_ACTIVE_TEAM_SIZE`, el bloque de nodos/panel de `LevelSelectScreen.tsx`), siguiendo el mismo patrón de anotación ya usado en `src/data/cats.ts`/`src/data/sagaArcs.ts`
- [X] T022 Ejecutar `npx tsc -b`, `npm test`, `npm run lint` y `npm run build` — las 4 deben terminar sin errores antes de dar la feature por completa (SC-006)
- [X] T023 Pasada manual de quickstart.md Escenario 1 (mapa: estados de nodo, panel, "¡Atacar!") y Escenario 3 (grilla de despliegue sin scroll) en `npm run dev`, confirmando ausencia de errores de consola

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede empezar de inmediato
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA que cualquier historia se dé por verificable (compila el proyecto entero)
- **User Story 1 (Phase 3)**: Depende de Foundational (necesita `Level.mapPosition` de T002/T003) — sin dependencia de US2/US3
- **User Story 2 (Phase 4)**: Depende de Foundational (solo del compile limpio, no de `mapPosition` en sí) — sin dependencia de US1/US3, puede implementarse en paralelo con ellas
- **User Story 3 (Phase 5)**: Depende de Foundational — sin dependencia de US1/US2, puede implementarse en paralelo con ellas
- **Polish (Phase 6)**: Depende de que las 3 historias estén completas

### Dentro de cada historia

- Tests (T006, T010, T013-T015) se escriben antes que la implementación correspondiente y deben fallar primero
- T008 (US1) depende de T007 (mismo archivo `theme.css` que T019 de US3, pero bloques de reglas distintos — no conflicto real, aun así no son la misma tarea)
- T017/T018 (US3) dependen de T016 (misma constante `MAX_ACTIVE_TEAM_SIZE`), pero entre sí tocan archivos distintos (`TeamScreen.tsx` vs. `BattleScreen.tsx`) — paralelizables

### Parallel Opportunities

- T006 (test US1) puede escribirse en paralelo con el resto de Foundational, aunque solo pasará en verde después de T007/T008
- T010 (test US2) y T013-T015 (tests US3) son paralelizables entre sí y con T006 (historias independientes)
- Una vez completado Foundational (Phase 2), US1/US2/US3 pueden implementarse en paralelo por completo (archivos disjuntos, salvo `theme.css` que solo comparte el archivo, no las reglas)
- T017 y T018 (US3) son paralelizables entre sí tras T016
- T021 (Polish, comentarios) es paralelizable con el resto de Polish solo si toca archivos distintos a T022/T023

---

## Parallel Example: Tras completar Foundational (Phase 2)

```bash
# Las 3 historias pueden arrancar a la vez, cada una en sus propios archivos:
Task: "Reescribir tests/unit/LevelSelectScreen.test.tsx para el mapa de nodos (US1)"
Task: "Ampliar tests/unit/useMetaStore.test.ts para unlockCatIds de arco-1/arco-2 (US2)"
Task: "Ampliar tests/unit/useMetaStore.test.ts + TeamScreen.test.tsx + BattleScreen.test.tsx para el tope de equipo (US3)"
```

> Nota: T010 (US2) y T013 (US3) tocan el mismo archivo `tests/unit/useMetaStore.test.ts` — ejecutar en secuencia entre sí aunque pertenezcan a historias distintas.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (bloqueante — `Level.mapPosition` + compilación limpia)
3. Completar Phase 3: User Story 1
4. **DETENER y VALIDAR**: `npx vitest run tests/unit/LevelSelectScreen.test.tsx` + `npx tsc -b` en verde
5. En este punto el mapa de nodos ya es demostrable de punta a punta — MVP alcanzado

### Incremental Delivery

1. Setup + Foundational → base lista (compila, `mapPosition` disponible)
2. US1 → mapa visual navegable (MVP)
3. US2 → catálogo completo obtenible al completar ambos arcos
4. US3 → grilla de despliegue fija, equipo acotado a 6
5. Polish → evidencia de no-regresión sobre el resto del proyecto

### Parallel Team Strategy

Con varios desarrolladores:

1. El equipo completa Setup + Foundational junto (T001-T005)
2. Una vez Foundational está listo:
   - Desarrollador A: User Story 1 (mapa)
   - Desarrollador B: User Story 2 (recompensas de arco)
   - Desarrollador C: User Story 3 (grilla de despliegue)
3. Coordinar solo en `tests/unit/useMetaStore.test.ts` y `src/theme.css` (compartidos por US2/US3 y US1/US3 respectivamente) — resto de archivos disjuntos

---

## Notes

- No hay `contracts/` (proyecto 100% frontend sin interfaces externas) — sin tareas de contract test
- [P] = archivo distinto, sin dependencia de una tarea incompleta
- Commit sugerido por tarea o por grupo lógico (T002+T003, T017+T018, etc.), siguiendo el patrón de commits atómicos ya usado en las specs previas del repo
- Ningún task de esta lista modifica `src/engine/` — la Constitución § IV/VI quedan intactas
- T011 (US2) es puramente aditivo sobre `SAGA_ARCS` — no requiere migración de guardado (spec.md Assumptions ya acepta que jugadores con progreso previo deban rejugar un nivel de un arco ya completado para disparar el otorgamiento)
