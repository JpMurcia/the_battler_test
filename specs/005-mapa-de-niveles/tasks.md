# Tasks: Mapa de Niveles y Desbloqueo Secuencial

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: `getLevelState` es función pura testeable con Vitest sin DOM; `LevelSelectScreen` con Testing Library para el bloqueo de interacción.

**Organización**: sin fase de Setup.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 `src/data/levelState.ts`: `getLevelState(levelIndex: number, highestUnlockedLevelIndex: number, isCompleted: boolean): 'locked' | 'unlocked' | 'completed'` — función pura (data-model.md § Estado de nivel).
- [X] T002 [P] Test Vitest `tests/unit/data/levelState.test.ts`: cubre los 3 estados y el caso límite `levelIndex === highestUnlockedLevelIndex` (depende de T001).

**Checkpoint**: lógica de bloqueo completa y testeada, ninguna pantalla la usa todavía.

---

## Phase 2: User Story 1 - Solo los niveles desbloqueados son jugables (Priority: P1) 🎯 MVP

**Goal**: `LevelSelectScreen` deshabilita "Jugar" sobre niveles bloqueados.

**Independent Test**: spec.md Historia 1, pasos 1-3.

### Implementation for User Story 1

- [X] T003 [US1] `src/screens/LevelSelectScreen.tsx`: por cada nivel, calcula su estado con `getLevelState(index, highestUnlockedLevelIndex, completedLevelIds.includes(level.id))`; deshabilita el botón "Jugar" si `'locked'` (depende de T001).
- [X] T004 [US1] Test Testing Library `tests/unit/LevelSelectScreen.test.tsx`: click en un nivel bloqueado no llama a `startLevel` ni navega; click en uno desbloqueado sí (depende de T003).

**Checkpoint**: cierra el gap real — el desbloqueo secuencial (Constitución § II) ya tiene efecto en la pantalla real de selección.

---

## Phase 3: User Story 2 - Navegar libremente por todos los niveles (Priority: P2)

**Goal**: confirmar que la lista permanece 100% desplazable con niveles bloqueados presentes.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T005 [US2] `src/screens/LevelSelectScreen.tsx`: estilos mínimos (`overflow-y: auto` o equivalente en `index.css`) si la lista de niveles excede el viewport — sin librería de scroll adicional (depende de T003).
- [X] T006 [US2] `src/screens/LevelSelectScreen.tsx`: indicador visual por estado (`locked`/`unlocked`/`completed`) — texto o clase CSS distinta por estado, sin requerir arte nuevo (depende de T003).
- [X] T007 [US2] Verificación manual: cubierta por el test con fixture de 2 niveles (T004, nivel bloqueado con opacidad reducida vía `.level-item--locked`) y por el recorrido real en navegador con `level-1` (single-level hoy, sin regresión al entrar a batalla).

**Checkpoint**: ambas historias completas.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T008 [P] `npx tsc -b` limpio.
- [X] T009 [P] `npm test` — suite completa (14 archivos, 63 tests) en verde.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea US1.
- **US1 (Fase 2)**: depende de T001.
- **US2 (Fase 3)**: depende de T003 (US1) — mismo componente, secciones distintas.
- **Polish (Fase 4)**: depende de que ambas historias estén completas.

## Parallel Opportunities

- T001/T002 pueden solaparse una vez el contrato de `getLevelState` está acordado.
- T008/T009 en paralelo.
