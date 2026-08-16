# Tasks: Sistema de Rango de Usuario

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: Vitest para `useMetaStore`; Testing Library para `UpgradeScreen`.

**Organización**: sin fase de Setup. Depende de `specs/006-dashboard-base-jugador` (`characterLevelOf`, `UpgradeScreen`) y `specs/017-objetos-de-batalla` (`battleItemInventory`).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (Blocking Prerequisites)

- [X] T001 [P] `src/data/userRankThresholds.ts`: `UserRankThreshold` interface (Key Entities) + fixture con 2-3 umbrales de prueba.
- [X] T002 `src/state/useMetaStore.ts`: exporta `characterLevelOf` (deja de ser `const` interna) (plan.md Key Design Decision 1).
- [X] T003 `src/db/index.ts`: tabla `userRank`, `db.version(9)` (plan.md § Storage).
- [X] T004 `src/state/useMetaStore.ts`: `claimedRankThresholds: number[]` hidratado desde Dexie (depende de T003).

**Checkpoint**: rango calculable y exportado; sin reclamo todavía.

---

## Phase 2: User Story 1 - Ver el Rango de Usuario actual (Priority: P1) 🎯 MVP

**Goal**: `UpgradeScreen` muestra el Rango de Usuario y sus umbrales.

**Independent Test**: spec.md Historia 1.

### Implementation for User Story 1

- [X] T005 [US1] `src/screens/UpgradeScreen.tsx`: importa `characterLevelOf` en vez de mantener su propio cálculo duplicado; muestra "Rango de Usuario: N" (FR-001, FR-002) (depende de T002).
- [X] T006 [US1] `src/screens/UpgradeScreen.tsx`: lista `USER_RANK_THRESHOLDS` con indicación de cuáles ya se alcanzaron (`rank <= characterLevelOf(ownedCats)`) (depende de T001, T005).
- [X] T007 [P] [US1] Test Testing Library `tests/unit/UpgradeScreen.test.tsx` (extiende): el Rango de Usuario mostrado coincide con la suma de niveles de `ownedCats`; un jugador nuevo con solo el gato inicial no produce error (depende de T005, T006).

**Checkpoint**: visibilidad del rango — MVP.

---

## Phase 3: User Story 2 - Reclamar la recompensa de un umbral (Priority: P1)

**Goal**: reclamo manual con validación y persistencia monótona.

**Independent Test**: spec.md Historia 2.

### Implementation for User Story 2

- [X] T008 [US2] `src/state/useMetaStore.ts`: `claimRankThreshold(rank): boolean` — valida umbral alcanzado y no reclamado, suma la recompensa a `battleItemInventory` (`specs/017`), registra `rank` en `claimedRankThresholds` y persiste (plan.md Key Design Decision 2) (depende de T001, T004, `specs/017` `battleItemInventory`).
- [X] T009 [US2] `src/screens/UpgradeScreen.tsx`: botón "Reclamar" por umbral alcanzado y no reclamado, deshabilitado para los no alcanzados o ya reclamados (depende de T006, T008).
- [X] T010 [P] [US2] Test Vitest `tests/unit/useMetaStore.test.ts` (extiende): `claimRankThreshold` otorga la recompensa exactamente una vez por umbral; rechaza sin efecto un umbral no alcanzado o ya reclamado; permite reclamar varios umbrales alcanzados en cualquier orden (depende de T008).
- [X] T011 [P] [US2] Test Testing Library `tests/unit/UpgradeScreen.test.tsx` (extiende): reclamar un umbral alcanzado suma la recompensa al inventario y el botón deja de estar disponible para ese umbral (depende de T009).

**Checkpoint**: las dos historias completas — spec cerrada.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T012 [P] `npx tsc -b` limpio.
- [X] T013 [P] `npm run test` — suite completa (existente + T007/T010/T011) en verde.
- [ ] T014 Verificación manual en navegador: mejorar unidades hasta alcanzar un umbral de prueba, reclamarlo, y confirmar que el objeto de batalla aparece en `TeamScreen` (`specs/017`). **Parcialmente confirmado**: `UpgradeScreen` muestra "Rango de Usuario: 1" con los 3 umbrales (rango 3/5/10) y sus botones "Reclamar" correctamente deshabilitados (rango 1 no alcanza ninguno), sin errores de consola. Falta mejorar unidades hasta alcanzar rango 3, reclamar, y confirmar en `TeamScreen` — bloqueado por el mismo problema de composición del panel Browser que specs/012 T036 (el click de "Mejorar" sí funciona vía DOM, pero verificar el flujo completo con capturas visuales requiere el panel compuesto). `npx tsc -b` y `npm test` (356/356) cubren la lógica.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: sin dependencias externas — bloquea todo.
- **US1 (Fase 2)**: depende de Foundational — MVP.
- **US2 (Fase 3)**: depende de US1 (necesita los umbrales visibles) y de `specs/017` (`battleItemInventory`).
- **Polish (Fase 4)**: depende de que las dos historias estén completas.

## Parallel Opportunities

- T001/T002/T003 (Foundational) en paralelo.
- T012/T013 en paralelo.

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1 (Foundational).
2. Completar Fase 2 (US1) — rango visible.
3. **STOP y VALIDAR**: el Rango de Usuario mostrado coincide con la suma de niveles reales.

### Incremental Delivery

1. Foundational → `characterLevelOf` exportado, sin UI todavía.
2. + US1 → rango visible (MVP).
3. + US2 → reclamo de recompensas — spec completa.
