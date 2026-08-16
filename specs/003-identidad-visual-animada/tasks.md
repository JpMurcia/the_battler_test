# Tasks: Identidad Visual Animada

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: incluidos para las funciones puras de `src/game/animation.ts` (testeables con Vitest sin canvas ni DOM, igual que `src/engine/`) — lo estrictamente visual (Pixi) se valida por recorrido manual en navegador, igual que `specs/002-motor-de-combate/` hizo con la parte visual.

**Organización**: sin fase de Setup — no hay dependencias nuevas que instalar (mismo stack que `specs/002-motor-de-combate/`). Se empieza directo en Foundational.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: a qué historia de usuario de `spec.md` pertenece la tarea

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: las funciones puras de mapeo `Cat → parámetros visuales` y `BattleUnit.state → AnimationState` — bloquean US1 y US2, que dependen de ambas para dibujar y animar el cuerpo de cada unidad.

**⚠️ CRITICAL**: ninguna historia de usuario puede empezar hasta que esta fase esté completa.

- [X] T001 [P] `src/game/animation.ts`: `getVisualProfile(cat: Cat): VisualProfile` — deriva `bodyWidth`/`bodyHeight`/`cornerRadius`/`accentColor`/`idleBobFrequencyHz`/`attackPulseDurationSeconds` de los stats ya existentes de `Cat` (`width`, `hp`, `speed`, `damage`, `attackIntervalSeconds`), sin campos nuevos en `src/data/cats.ts` (research.md Decisión 1, data-model.md § VisualProfile)
- [X] T002 [P] `src/game/animation.ts`: mapeo `BattleUnit.state` → `AnimationState` (`'Moving'` → `'Idle'`, `'Engaged'` → `'Attacking'`) y función pura de fase de animación (bob de idle, pulso de ataque) a partir de tiempo transcurrido y `VisualProfile` (data-model.md § AnimationState)
- [X] T003 [P] Test Vitest `tests/unit/game/animation.test.ts`: `getVisualProfile` es determinista y produce parámetros distintos para los 4 tipos de gato de `CATS`; el mapeo de `state` a `AnimationState` es correcto para `Moving`/`Engaged` (depende de T001, T002)

**Checkpoint**: `src/game/animation.ts` completo y testeado sin canvas ni DOM — ninguna UI todavía lo usa.

---

## Phase 2: User Story 1 - Ver que cada unidad está viva mientras avanza o combate (Priority: P1) 🎯 MVP

**Goal**: reemplazar el rectángulo estático de `UnitSprite.tsx` por un cuerpo animado que muestra movimiento/idle continuo y cambia a una animación de ataque reconocible al entrar en combate — el requisito mínimo de la Constitución § III.

**Independent Test**: desplegar una unidad, confirmar que muestra animación de movimiento/idle continua mientras avanza, que cambia a animación de ataque reconociblemente distinta al trabarse en combate, y que vuelve a movimiento/idle al liberarse (quickstart.md pasos 1-4).

### Implementation for User Story 1

- [X] T004 [US1] `src/game/UnitSprite.tsx`: dibuja el cuerpo (`Graphics`) una única vez por unidad usando `getVisualProfile(cat)` (T001) — reemplaza el `g.rect(...).fill(...)` fijo actual (depende de T001)
- [X] T005 [US1] `src/game/UnitSprite.tsx`: `useTick` propio (de `@pixi/react`) que en cada frame lee la unidad fresca desde `useGameStore.getState().units` por `instanceId` y muta, vía `ref` al objeto Pixi, su posición y su transform de animación (bob de idle o pulso de ataque según `AnimationState`) — nunca redibuja el `Graphics` (research.md Decisión 2/3) (depende de T004, T002)
- [X] T006 [US1] `src/game/BattleStage.tsx` (`BattleField`): deja de llamar a `setUnits` en cada tick; recalcula el conjunto de `instanceId`s activos y solo dispara re-render (mount/unmount de `UnitSprite`) cuando esa composición cambia — nace o muere una unidad (research.md Decisión 3) (depende de T005)
- [X] T007 [US1] Verificación manual en navegador: `npm run dev`, recorrer quickstart.md pasos 1-4 (animación de idle continua sin instantes estáticos, transición a ataque reconocible y sincronizada con la cadencia de daño, retorno a idle al quedar libre)

**Checkpoint**: cada unidad activa se ve viva en todo momento — cierra el requisito mínimo de Constitución § III. Sin diferenciación por tipo de gato ni señal de muerte todavía (eso es US2/US3).

---

## Phase 3: User Story 2 - Distinguir a simple vista qué tipo de gato es cada unidad (Priority: P2)

**Goal**: aplicar los parámetros de `VisualProfile` (tamaño, proporción, acento de color, ritmo) para que los 4 tipos de gato del catálogo sean reconocibles entre sí más allá del color de equipo.

**Independent Test**: desplegar al menos dos tipos de gato distintos en la misma batalla y confirmar que un observador puede identificar cuál unidad corresponde a cuál tipo sin abrir ningún panel (quickstart.md paso 5).

### Implementation for User Story 2

- [X] T008 [P] [US2] `src/game/UnitSprite.tsx`: aplica `bodyWidth`/`bodyHeight`/`cornerRadius`/`accentColor` de `VisualProfile` (T001) al dibujar el cuerpo (T004), de forma que los 4 tipos de gato produzcan siluetas y acentos de color distinguibles entre sí (research.md Decisión 5) (depende de T001, T004)
- [X] T009 [US2] Verificación manual en navegador: quickstart.md paso 5 (dos tipos de gato desplegados a la vez se distinguen a simple vista, sin abrir ningún panel de información)

**Checkpoint**: US1 + US2 funcionan juntas — unidades animadas y visualmente distinguibles por tipo.

---

## Phase 4: User Story 3 - Ver con claridad el momento en que una unidad es derrotada (Priority: P3)

**Goal**: mostrar una señal visual breve de derrota antes de que una unidad desaparezca de la pantalla, sin tocar `src/engine/`.

**Independent Test**: dejar que una unidad pierda todo su HP en combate y confirmar que se percibe una señal visual de derrota antes de que deje de estar en pantalla (quickstart.md paso 6).

### Implementation for User Story 3

- [X] T010 [US3] `src/game/BattleStage.tsx` (`BattleField`): registro efímero de `DeathEcho` — compara, tick a tick y solo mientras `status === 'InProgress'`, el conjunto de `instanceId`s del tick anterior contra el actual; cualquier `instanceId` que desaparece por esa vía (no por `reset()`) se añade al registro con su última posición/equipo/tipo de gato conocidos (data-model.md § DeathEcho, research.md Decisión 4) (depende de T006)
- [X] T011 [US3] `src/game/BattleStage.tsx`: renderiza y anima cada `DeathEcho` activo (escala/alpha decrecientes según `remainingSeconds`) y lo elimina del registro al llegar a 0 (depende de T010)
- [X] T012 [US3] Verificación manual en navegador: quickstart.md paso 6 (señal visual de derrota antes de la desaparición) y paso 8 (sin ecos residuales al salir de la batalla y volver a entrar)

**Checkpoint**: las tres historias de usuario funcionan de forma independiente y en conjunto — la spec está completa.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T013 [P] `npx tsc -b` limpio sobre todo el proyecto
- [X] T014 [P] `npm run test` — suite completa (existente de `src/engine/` sin ningún cambio + T003) en verde
- [X] T015 Verificación de rendimiento: quickstart.md paso 7 (10+ unidades animadas activas simultáneamente, fluido sin tirones perceptibles — sin regresión sobre `specs/002-motor-de-combate/spec.md` SC-003)
- [X] T016 Recorrido final de `quickstart.md` de punta a punta (pasos 1-8 en una sola sesión de navegador)

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea US1 y US2. T003 depende de T001+T002.
- **US1 (Fase 2)**: depende de Foundational completo (T001, T002 en particular). T005 depende de T004+T002; T006 depende de T005.
- **US2 (Fase 3)**: depende de Foundational (T001) y de T004 (US1) — reutiliza el cuerpo ya dibujado por `UnitSprite`, solo lo parametriza por tipo.
- **US3 (Fase 4)**: depende de T006 (US1) — el registro de `DeathEcho` vive en el mismo `BattleField` ya reestructurado para no re-renderizar en cada tick.
- **Polish (Fase 5)**: depende de que las tres historias estén completas.

## Parallel Opportunities

- Dentro de Foundational: T001/T002 en paralelo (archivos distintos... misma función `animation.ts`, pero secciones independientes — pueden desarrollarse en paralelo y fusionarse antes de T003).
- T008 (US2) es paralelizable respecto a T005/T006 (US1) una vez completado T004 — ambas tocan `UnitSprite.tsx` en secciones distintas (dibujo del cuerpo vs. animación por frame), coordinar al fusionar.
- T013/T014 (Polish) en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational) — funciones puras testeadas, sin UI.
2. Completar Fase 2 (US1) — cada unidad animada en movimiento/idle y ataque, cierra el mínimo de Constitución § III.
3. **STOP y VALIDAR**: recorrer quickstart.md pasos 1-4 antes de continuar.

### Incremental Delivery

1. Foundational → `getVisualProfile`/`AnimationState` testeados, sin UI.
2. + US1 → unidades animadas (MVP, cierra la excepción de Constitución § III).
3. + US2 → tipos de gato distinguibles entre sí.
4. + US3 → señal de derrota — spec completa.
