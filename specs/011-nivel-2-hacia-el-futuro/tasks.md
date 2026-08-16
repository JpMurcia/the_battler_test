# Tasks: Nivel 2 "Hacia el Futuro"

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: sin funciones puras nuevas — se reutilizan los tests parametrizados ya existentes de `specs/002-motor-de-combate` y `specs/007-energia-mision-dificultad` contra el `LEVELS` extendido.

**Organización**: sin fase de Setup. Depende de `specs/005-mapa-de-niveles` (desbloqueo real); `specs/007-energia-mision-dificultad` recomendada pero no bloqueante (ver spec.md Assumptions).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 [P] `src/data/cats.ts`: añade 1-2 `Cat` nuevos con stats propios (nombre, costo, cooldown, hp, daño, velocidad, ancho, intervalo de ataque) — no reutilizar valores de los 4 gatos existentes.
- [X] T002 `src/data/levels.ts`: añade `level-2: Level` con `enemyWave` más exigente que `level-1` (más entradas y/o gatos enemigos más fuertes) y, si `specs/007-energia-mision-dificultad` ya está implementada, `energyCost`/`region`/`difficulty >= level-1.difficulty` en la misma región (depende de T001 si el `enemyWave` usa los gatos nuevos como enemigos).

**Checkpoint**: contenido del Nivel 2 definido — ninguna pantalla lo ofrece todavía más allá de lo que ya generaliza `specs/005-mapa-de-niveles`.

---

## Phase 2: User Story 1 - Jugar el Nivel 2 completo (Priority: P1) 🎯 MVP

**Goal**: el Nivel 2 es jugable de punta a punta con el motor ya existente.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [ ] T003 [US1] Verificación manual en navegador: con el Nivel 1 completado, entrar al Nivel 2 desde selección, desplegar gatos (incluidos los nuevos), y confirmar que la batalla resuelve en victoria o derrota igual que el Nivel 1. **Pendiente** — reintentado en sesión posterior: `Selección de Nivel` confirmado por DOM (`Nivel 2: Hacia el Futuro (Bloqueado, costo: 25)` con `highestUnlockedLevelIndex = 0`, coherente con T005), pero el bucle de batalla (rAF/Pixi ticker) no avanza sin composición del panel Browser — mismo bloqueo que specs/010 T016. Requiere panel Browser visible del lado del usuario.
- [X] T004 [US1] Test Vitest `tests/unit/engine/simulation.test.ts` (extiende, parametrizado por nivel si el patrón existente lo permite, o caso nuevo): `stepSimulation` con la configuración de `level-2` spawnea la oleada completa y resuelve victoria/derrota correctamente (depende de T002).

**Checkpoint**: Nivel 2 jugable de punta a punta.

---

## Phase 3: User Story 2 - Desbloqueo automático al completar el Nivel 1 (Priority: P1)

**Goal**: confirmar que `specs/005-mapa-de-niveles` generaliza correctamente a un segundo nivel real, sin excepciones hardcodeadas.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T005 [US2] Test Testing Library `tests/unit/LevelSelectScreen.test.tsx` (extiende, de `specs/005-mapa-de-niveles`): con `LEVELS` de 2 elementos y `highestUnlockedLevelIndex = 0`, `level-2` aparece bloqueado; con `highestUnlockedLevelIndex = 1`, aparece desbloqueado (depende de T002).
- [ ] T006 [US2] Verificación manual: completar el Nivel 1 en el navegador, confirmar que `unlockNextLevel()` deja `level-2` desbloqueado en la siguiente visita a selección de niveles, sin ninguna excepción especial en el código. **Pendiente** — misma limitación de sesión que T003.

**Checkpoint**: desbloqueo secuencial validado con contenido real de 2 niveles.

---

## Phase 4: User Story 3 - Gatos nuevos y oleada más difícil (Priority: P2)

**Goal**: confirmar diferenciación de contenido entre Nivel 1 y Nivel 2.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T007 [US3] Test Vitest `tests/unit/data/levels.test.ts` (extiende, de `specs/007-energia-mision-dificultad`, si ya implementada): `level-2.difficulty >= level-1.difficulty` si comparten región (depende de T002).
- [ ] T008 [US3] Verificación manual: confirmar en `DeployBar` (una vez el jugador posea los gatos nuevos) que aparecen como opciones distintas de los 4 originales. **Pendiente** — misma limitación de sesión que T003.

**Checkpoint**: las tres historias completas — spec cerrada.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T009 [P] `npx tsc -b` limpio.
- [X] T010 [P] `npm test` — suite completa (existente + T004/T005/T007) en verde.
- [ ] T011 Recorrido manual de punta a punta: Nivel 1 → completar → Nivel 2 desbloqueado → jugar Nivel 2 → resultado. **Pendiente** — misma limitación de sesión que T003.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational.
- **US2 (Fase 3)**: depende de Foundational y de `specs/005-mapa-de-niveles` ya implementada.
- **US3 (Fase 4)**: depende de Foundational; T007 depende además de `specs/007-energia-mision-dificultad`.
- **Polish (Fase 5)**: depende de que las tres historias estén completas.

## Parallel Opportunities

- T001 puede prepararse en paralelo a research de balance de `level-2` (T002 los integra).
- T009/T010 en paralelo.
