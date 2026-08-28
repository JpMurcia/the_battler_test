---

description: "Task list for feature 029-pulido-batalla-hud"
---

# Tasks: Pulido de Batalla y HUD

**Input**: Design documents from `/specs/029-pulido-batalla-hud/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (contracts/ no existe — app frontend sin interfaz externa, ver plan.md § Project Structure)

**Tests**: Incluidos — el proyecto sigue TDD en sus ~560 pruebas existentes; cada historia añade sus propios casos antes de implementar.

**Organization**: Tareas agrupadas por historia de usuario (US1-US5), en el orden de prioridad de `spec.md` (P1, P1, P2, P2, P3). US2 depende de un campo compartido en `useGameStore.ts` que se crea en su propia fase; el resto son independientes entre sí, aunque US1/US2/US5 comparten el archivo `BattleScreen.tsx` (no ejecutar en paralelo entre sí, sí contra US3/US4).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto, sin dependencia de una tarea sin terminar)
- **[Story]**: Historia de usuario a la que pertenece (US1-US5)

## Path Conventions

Proyecto single-project: `src/`, `tests/` en la raíz del repo (ver `plan.md` § Project Structure).

---

## Phase 1: Setup

**Purpose**: Confirmar una línea base limpia — esta spec es 100% modificación/extensión de código existente, sin dependencias nuevas.

- [X] T001 Ejecutar `npx tsc -b` y `npm test` en la raíz del repo y confirmar que ambos están en verde antes de empezar (línea base para SC-007) — confirmado: 63 archivos/557 tests en verde, tsc -b sin salida

---

## Phase 2: Foundational

**N/A para esta spec.** No hay infraestructura compartida bloqueante: cada historia toca su propio campo de estado/componente. US2 crea `speedMultiplier`/`paused` dentro de su propia fase (no antes) porque ninguna otra historia los necesita.

---

## Phase 3: User Story 1 - Disparar el cañón especial de base (Priority: P1) 🎯 MVP

**Goal**: Un botón en `BattleScreen` muestra el progreso de recarga de `specialCannon` y, al completarse, permite dispararlo.

**Independent Test**: Entrar a una batalla, esperar a que el cañón complete su recarga, confirmar que el botón pasa de deshabilitado a habilitado, pulsarlo y confirmar que se aplica el efecto de área y la recarga vuelve a empezar.

### Tests for User Story 1

- [X] T002 [P] [US1] Añadir casos a `tests/unit/BattleScreen.test.tsx`: el control de cañón se muestra deshabilitado mientras `specialCannon.rechargeRemaining > 0`, se habilita cuando llega a 0, pulsarlo invoca `activateSpecialCannon()` (mock/spy sobre `useGameStore`) y no hace nada si está deshabilitado (Acceptance Scenarios 1-4 de `spec.md` US1) — confirmar que fallan contra la implementación actual

### Implementation for User Story 1

- [X] T003 [US1] Crear componente `CannonControl` en `src/screens/BattleScreen.tsx` (mismo archivo, junto a `EnergyReadout`/`PlayerBaseReadout`): suscribe `specialCannon` vía `useGameStore((state) => state.specialCannon)` y `activateSpecialCannon` vía `useGameStore((state) => state.activateSpecialCannon)` (research.md Decisión 1); calcula `pct = 1 - rechargeRemaining / rechargeDurationSeconds`; renderiza un botón con un indicador de progreso reutilizando la clase `.progress-bar`/`.progress-bar__fill` ya usada por `EnergyReadout` (o un anillo SVG si `plan.md` lo prefiere — cualquiera satisface FR-001, la elección visual exacta queda a criterio de implementación); `disabled={specialCannon.rechargeRemaining > 0}`; `onClick={() => activateSpecialCannon()}`
- [X] T004 [US1] Renderizar `<CannonControl />` dentro de `.battle-overlay.hud-bar` en `BattleScreen`, junto a los demás chips de HUD
- [X] T005 [US1] Ejecutar `tests/unit/BattleScreen.test.tsx` y confirmar que los casos de T002 pasan y que ninguna prueba existente de la suite se rompe

**Checkpoint**: El jugador puede disparar el cañón especial desde la UI (SC-001).

---

## Phase 4: User Story 2 - Controlar la velocidad y pausar la batalla (Priority: P1)

**Goal**: Controles x1/x2 y pausa en `BattleScreen` que afectan el `deltaSeconds` efectivo del tick sin alterar ninguna regla de combate.

**Independent Test**: Activar x2 y confirmar que las unidades avanzan/atacan visiblemente más rápido que a x1; pulsar pausa y confirmar que nada se mueve hasta reanudar.

### Tests for User Story 2

- [X] T006 [P] [US2] Añadir casos a `tests/unit/useGameStore.test.ts`: `speedMultiplier` inicia en `1` (`IDLE_STATE` y tras `startLevel`), una acción `setSpeedMultiplier(2)` lo cambia a `2`, `paused` inicia en `false`, una acción `setPaused(true)` lo cambia a `true`, y `reset()`/`startLevel()` restauran ambos a sus valores por defecto — confirmar que fallan contra la implementación actual
- [X] T007 [P] [US2] Añadir casos a `tests/unit/BattleScreen.test.tsx`: los botones x1/x2/pausa reflejan el estado activo (resaltado) leyendo `useGameStore`, y pulsarlos invoca `setSpeedMultiplier`/`setPaused` respectivamente — confirmar que fallan contra la implementación actual

### Implementation for User Story 2

- [X] T008 [US2] En `src/state/useGameStore.ts`: añadir `speedMultiplier: 1 | 2` y `paused: boolean` a `GameFields`/`IDLE_STATE` (default `1`/`false`, data-model.md), incluirlos en el `set({...})` de `startLevel()` con los mismos defaults, y añadir acciones `setSpeedMultiplier: (value: 1 | 2) => void` y `setPaused: (value: boolean) => void` a `GameState`/la implementación del store (no tocan `src/engine/`)
- [X] T009 [US2] En `src/game/BattleStage.tsx`, dentro del `useTick` de `BattleField` (antes de `store.tick(deltaSeconds)`): si `store.paused` es `true`, hacer `return` sin llamar a `tick()`; si no, llamar `store.tick(deltaSeconds * store.speedMultiplier)` (research.md Decisión 3) — sin tocar el resto del cuerpo del callback (death echoes/impact effects siguen leyendo el resultado normalmente cuando no está pausado)
- [X] T010 [US2] Crear componente `SpeedControls` en `src/screens/BattleScreen.tsx`: 3 botones (x1, x2, pausa/reanudar) que suscriben `speedMultiplier`/`paused` vía selectores acotados de `useGameStore` para resaltar el estado activo, `onClick` invoca `setSpeedMultiplier`/`setPaused`; renderizarlo en `.battle-overlay.hud-bar` junto a `CannonControl`
- [X] T011 [US2] Ejecutar `tests/unit/useGameStore.test.ts` y `tests/unit/BattleScreen.test.tsx`, confirmar que los casos de T006/T007 pasan y que ninguna prueba existente se rompe (incluida `tests/unit/engine/simulation.test.ts`, que no debe requerir ningún cambio)

**Checkpoint**: El jugador puede acelerar/pausar la batalla sin alterar el resultado determinista (SC-002, SC-003).

---

## Phase 5: User Story 3 - Ver el HP de cada unidad en batalla (Priority: P2)

**Goal**: Cada unidad activa (aliada/enemiga) muestra su HP actual/máximo sobre su sprite, actualizado en tiempo real, sin redibujar de más.

**Independent Test**: Desplegar una unidad, dejar que reciba daño sin morir, confirmar que su indicador de HP se reduce proporcionalmente en tiempo real.

### Tests for User Story 3

- [X] T012 [P] [US3] Crear `tests/unit/game/unitHpBar.test.ts`: `drawUnitHpBar` no lanza para `team` `'Player'`/`'Enemy'` y fracciones `0`, `0.5`, `1` (mismo patrón `not.toThrow()` que `tests/unit/game/baseTower.test.ts` para `drawBaseTowerTurret`/`drawBaseTowerShield`), y reutiliza `getHpFraction`/`getHpBarFillWidth` importadas de `baseTower.ts` en vez de reimplementarlas (confirmar que el archivo aún no existe → falla)

### Implementation for User Story 3

- [X] T013 [US3] Crear `src/game/graphics/unitHpBar.ts`: exportar `drawUnitHpBar(g: Graphics, bodyLayout: CyberBodyLayout, team: BattleUnit['team'], fraction: number): void` — limpia `g`, dibuja fondo + relleno sólido (sin `FillGradient`, data-model.md) posicionado sobre la cabeza del cuerpo (`bodyLayout`), color por equipo (mismo criterio cian/rojo que `cyberUnitBody.ts` ya usa); reutiliza `getHpFraction`/`getHpBarFillWidth` importados de `./baseTower`
- [X] T014 [US3] En `src/game/UnitSprite.tsx`: añadir `hpBarRef = useRef<Graphics>(null)` y un `<pixiGraphics ref={hpBarRef} draw={...} />` adicional dentro del `pixiContainer` (junto a `drawBody`/`visorRef`/`thrusterRef`); dentro del `useTick` ya existente (que ya lee `unit` fresco cada frame), calcular `fraction = getHpFraction(unit.hp, unit.maxHp)` y, solo si cambia más allá de un umbral (mismo `HP_BAR_REDRAW_THRESHOLD` que `BaseTower.tsx`, guardado en un `ref` local), llamar `drawUnitHpBar(hpBarRef.current, bodyLayout, team, fraction)`
- [X] T015 [US3] Ejecutar `tests/unit/game/unitHpBar.test.ts` y `npm test` completo, confirmar que T012 pasa y que ninguna prueba existente de `UnitSprite`/animación se rompe

**Checkpoint**: Toda unidad activa en batalla muestra su HP individual (SC-004).

---

## Phase 6: User Story 4 - Ver cuánto falta para la próxima energía en el Hub (Priority: P2)

**Goal**: El Hub muestra un countdown hasta la próxima unidad de energía recuperada, basado en el cálculo ya existente de `missionEnergy.ts`.

**Independent Test**: Con energía por debajo del máximo, abrir el Hub, confirmar que se muestra un temporizador que cuenta regresivamente y desaparece al llegar al máximo.

### Tests for User Story 4

- [X] T016 [P] [US4] Añadir casos a `tests/unit/useMetaStore.test.ts`: tras `hydrate()`, `missionEnergy.regenPerSecond` coincide con `computeRegenPerSecond(characterLevel)` y `missionEnergy.lastUpdatedAt` coincide con el `lastUpdatedAt` persistido/usado; tras `consumeMissionEnergy(...)`, `lastUpdatedAt` se actualiza al nuevo timestamp — confirmar que fallan contra la implementación actual
- [X] T017 [P] [US4] Añadir casos a `tests/unit/HubScreen.test.tsx` (usar `vi.useFakeTimers()`): con `missionEnergy.current < max`, se muestra un temporizador; avanzar timers y confirmar que el valor mostrado cambia; con `current === max`, no se muestra ningún temporizador — confirmar que fallan contra la implementación actual

### Implementation for User Story 4

- [X] T018 [US4] En `src/state/useMetaStore.ts`: extender la interfaz `MissionEnergyState` con `regenPerSecond: number` y `lastUpdatedAt: number`; poblar ambos en `hydrate()` (usando el mismo `computeRegenPerSecond`/`now` que ya se calculan ahí, líneas ~229-263) y actualizar `lastUpdatedAt` en `consumeMissionEnergy()` (líneas ~353-359) cada vez que ya escribe a Dexie — sin agregar ninguna columna nueva a la tabla `missionEnergy` de Dexie (data-model.md)
- [X] T019 [US4] Crear componente `EnergyRegenTimer` en `src/screens/HubScreen.tsx`: lee `missionEnergy` de `useMetaStore`; si `current >= max`, retorna `null`; si no, usa un `useEffect` + `setInterval(1000)` local (research.md Decisión 5) para re-renderizar cada segundo, calcula segundos restantes hasta el próximo punto entero de energía a partir de `regenPerSecond`/`lastUpdatedAt`/`Date.now()`, y lo formatea como `mm:ss`; renderizarlo junto al chip de energía existente en `.hud-bar`
- [X] T020 [US4] Ejecutar `tests/unit/useMetaStore.test.ts` y `tests/unit/HubScreen.test.tsx`, confirmar que T016/T017 pasan y que ninguna prueba existente se rompe

**Checkpoint**: El jugador ve cuánto falta para la próxima energía sin salir del Hub (SC-005).

---

## Phase 7: User Story 5 - Elegir cuántas filas ver en la barra de despliegue (Priority: P3)

**Goal**: Un control en `BattleScreen` alterna la barra de despliegue entre 1 y 2 filas sin cambiar qué unidades están disponibles ni su orden.

**Independent Test**: Alternar el control de filas y confirmar que la misma barra de unidades se redistribuye en 1 o 2 filas sin cambiar cuáles están disponibles, sus costos o su orden.

### Tests for User Story 5

- [X] T021 [P] [US5] Añadir casos a `tests/unit/BattleScreen.test.tsx`: por defecto la barra de despliegue está en 1 fila; pulsar el toggle la pasa a 2 filas (verificar clase CSS aplicada); las mismas unidades/costos siguen presentes y en el mismo orden en ambas disposiciones — confirmar que fallan contra la implementación actual

### Implementation for User Story 5

- [X] T022 [US5] En `src/screens/BattleScreen.tsx`, dentro de `DeployBar` (o un wrapper que la envuelva): añadir `useState<1 | 2>(1)` local para `rowLayout` (research.md Decisión 6, no persistido) y un botón de toggle que alterne su valor
- [X] T023 [US5] Añadir en `src/theme.css` una clase `.deploy-bar--two-rows` (o equivalente) que cambie `grid-template-columns`/`grid-template-rows` de `.deploy-bar` a una disposición de 2 filas (p. ej. 3 columnas × 2 filas) sin alterar el orden `.map()` ya existente de `ownedCats`; aplicar condicionalmente esa clase según `rowLayout` de T022
- [X] T024 [US5] Ejecutar `tests/unit/BattleScreen.test.tsx` completo, confirmar que T021 pasa y que ninguna prueba existente (incluidas las de T002/T007/T021 juntas en el mismo archivo) se rompe

**Checkpoint**: El jugador puede alternar la disposición de la barra de despliegue sin perder progreso (SC-006).

---

## Phase 8: Polish & Verificación Final

**Purpose**: Confirmar que las 5 historias conviven sin regresión y que el estado del repo queda limpio.

- [X] T025 Ejecutar `npx tsc -b` y `npm test` completos en la raíz del repo y confirmar 0 errores/0 fallos (SC-007)
- [X] T026 Verificación manual en navegador siguiendo `quickstart.md` (las 5 secciones + regresión) con `npm run dev`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → bloquea todo lo demás (línea base limpia).
- **Phase 2 (Foundational)**: N/A, no bloquea nada.
- **US1 (Phase 3)**, **US3 (Phase 5)**, **US4 (Phase 6)**: completamente independientes entre sí y de US2/US5 — pueden ejecutarse en cualquier orden o en paralelo entre ellas.
- **US2 (Phase 4)** y **US5 (Phase 7)**: independientes en lógica, pero ambas tocan `src/screens/BattleScreen.tsx` (igual que US1) — no ejecutar sus tareas de implementación en paralelo entre sí ni con US1 para evitar conflictos de edición concurrente sobre el mismo archivo; sí pueden ejecutarse en paralelo con US3/US4 (archivos disjuntos).
- **Phase 8 (Polish)**: después de que las 5 historias estén completas.

## Parallel Execution Examples

Tras Phase 1, estos 3 grupos pueden avanzar en paralelo (archivos disjuntos):

```text
Grupo A (US1 → US2 → US5, secuencial dentro del grupo por compartir BattleScreen.tsx):
  T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T021, T022, T023, T024

Grupo B (US3, independiente):
  T012, T013, T014, T015

Grupo C (US4, independiente):
  T016, T017, T018, T019, T020
```

## Implementation Strategy

**MVP = User Story 1** (Phase 3): el cañón especial es la mecánica de mayor impacto ya construida pero inaccesible — entregarla sola ya es una mejora jugable completa y demostrable. Las historias siguientes (US2 → US3 → US4 → US5) se entregan de forma incremental en el orden de prioridad de `spec.md`, cada una verificable de forma independiente sin depender de que las demás estén terminadas.
