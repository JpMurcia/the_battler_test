# Tasks: Banner Especial de Eventos: "Etapas de Fantasía"

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: Vitest para `isEventActive` (función pura); Testing Library para la tarjeta nueva en `LevelSelectScreen`.

**Organización**: sin fase de Setup. Depende de `specs/005-mapa-de-niveles` (pantalla), `specs/007-energia-mision-dificultad` (energía), `specs/012-saga-imperio-de-los-gatos` (recompensas).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 `src/data/events.ts`: `EventTimeWindow`/`EventBanner` interfaces (data-model § Key Entities) + `isEventActive(banner, nowMs): boolean` (plan.md Key Design Decision 1/2) + fixture de un `EventBanner` de prueba con `specialStage` completo.
- [X] T002 [P] Test Vitest `tests/unit/data/events.test.ts`: `isEventActive` es `true` dentro de una ventana, `false` fuera; dos ventanas solapadas se comportan como una continua (FR-010) (depende de T001).

**Checkpoint**: evaluación de ventana horaria testeada, sin UI todavía.

---

## Phase 2: User Story 1 - Ver el banner solo durante su ventana activa (Priority: P1) 🎯 MVP

**Goal**: `LevelSelectScreen` muestra el banner condicionalmente.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T003 [US1] `src/screens/LevelSelectScreen.tsx`: renderiza una tarjeta de `EventBanner` (nombre + botón "Jugar") cuando `isEventActive(banner, Date.now())`, junto al listado de `LEVELS` (depende de T001).
- [X] T004 [US1] `src/screens/LevelSelectScreen.tsx`: fuera de la ventana activa, la tarjeta no se renderiza (o se renderiza deshabilitada — decidir consistente con el resto de la pantalla) (depende de T003).
- [X] T005 [P] [US1] Test Testing Library `tests/unit/LevelSelectScreen.test.tsx` (extiende): con un `EventBanner` mockeado dentro de su ventana, el botón aparece habilitado; fuera de la ventana, no aparece o aparece deshabilitado (depende de T003, T004).

**Checkpoint**: visibilidad condicional funcional — MVP visual.

---

## Phase 3: User Story 2 - Jugar la fase especial dentro de la ventana (Priority: P1)

**Goal**: seleccionar el banner activo inicia la fase especial.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T006 [US2] `src/screens/LevelSelectScreen.tsx`: el botón "Jugar" del banner llama `spendMissionEnergy`/`startLevel` con `banner.specialStage`, igual que el flujo ya existente para niveles regulares, sin pasar por la validación de `highestUnlockedLevelIndex` (FR-004, FR-005) (depende de T003).
- [X] T007 [US2] `src/screens/BattleScreen.tsx` (`BattleOutcomeWatcher`): al ganar `banner.specialStage`, invoca `grantLevelRewards`/`addCurrency` igual que cualquier nivel (FR-007) — sin cambios si `specialStage` ya tiene la misma forma que `Level` (depende de T001).
- [X] T008 [P] [US2] Test Testing Library `tests/unit/LevelSelectScreen.test.tsx` (extiende): seleccionar el banner activo con energía suficiente navega a `Battle` con `levelId` de la fase especial; sin energía suficiente, el botón está deshabilitado (mismo patrón que el test ya existente para niveles regulares) (depende de T006).

**Checkpoint**: US1+US2 — evento jugable de punta a punta.

---

## Phase 4: User Story 3 - Batalla en curso no se interrumpe al expirar la ventana (Priority: P2)

**Goal**: confirmar que la ventana horaria solo se evalúa al entrar, nunca dentro del bucle de combate.

**Independent Test**: spec.md Historia 3.

### Implementation for User Story 3

- [X] T009 [US3] Verificación de diseño (sin código nuevo): confirmar que ningún punto de `src/engine/simulation.ts`/`useGameStore.tick` referencia `isEventActive`/`EventTimeWindow` — la ventana se evalúa exclusivamente en `LevelSelectScreen` al seleccionar el banner (T006), nunca durante `tick` (FR-008).
- [X] T010 [P] [US3] Test Vitest `tests/unit/state/useGameStore.test.ts` o integración: iniciar `banner.specialStage` y avanzar `tick()` varias veces no depende en ningún punto de la hora del sistema — la batalla resuelve por `stepSimulation` puro, sin leer `Date.now()` (depende de T007, T009).

**Checkpoint**: robustez ante expiración de ventana confirmada.

---

## Phase 5: User Story 4 - El evento se repite en ventanas futuras (Priority: P3)

**Goal**: múltiples ventanas sin cambios de código.

**Independent Test**: spec.md Historia 4.

### Implementation for User Story 4

- [X] T011 [US4] Fixture de prueba en `src/data/events.ts` o en el test: `EventBanner` con 2+ `timeWindows` no solapadas (depende de T001).
- [X] T012 [P] [US4] Test Vitest `tests/unit/data/events.test.ts` (extiende): `isEventActive` es `true` en ambas ventanas de forma independiente, `false` en el hueco entre ellas (depende de T011).

**Checkpoint**: las cuatro historias completas — spec cerrada.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T013 [P] `npx tsc -b` limpio.
- [X] T014 [P] `npm run test` — suite completa (existente + T002/T005/T008/T010/T012) en verde.
- [ ] T015 Verificación manual en navegador: con una ventana de prueba configurada para incluir la hora actual, confirmar que el banner aparece en `LevelSelectScreen`, es jugable, y otorga recompensas al ganar. **Pendiente**: mismo bloqueo de composición del panel Browser que specs/012 T036 — `npx tsc -b` y `npm test` (282/282) cubren la lógica; el banner de producción (`evento-etapas-de-fantasia`, ventana 2026 completa) ya está diseñado para estar activo en cualquier sesión de prueba real.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational — MVP visual.
- **US2 (Fase 3)**: depende de US1 (la tarjeta debe existir antes de cablear su acción).
- **US3 (Fase 4)**: depende de US2 (necesita una batalla de evento iniciable para verificar que no se interrumpe).
- **US4 (Fase 5)**: depende de Foundational; independiente de US2/US3.
- **Polish (Fase 6)**: depende de que las cuatro historias estén completas.

## Parallel Opportunities

- T002 (test de Foundational) en paralelo con el resto de T001 una vez la interfaz esté definida.
- US4 puede desarrollarse en paralelo a US2/US3 una vez completada US1.
- T013/T014 en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational) — `isEventActive` testeada.
2. Completar Fase 2 (US1) — banner visible condicionalmente.
3. **STOP y VALIDAR**: banner aparece/desaparece según la ventana configurada.

### Incremental Delivery

1. Foundational → `isEventActive` testeada, sin UI.
2. + US1 → banner visible (MVP visual).
3. + US2 → banner jugable con recompensas.
4. + US3 → robustez ante expiración a mitad de batalla.
5. + US4 → recurrencia sin cambios de código — spec completa.
