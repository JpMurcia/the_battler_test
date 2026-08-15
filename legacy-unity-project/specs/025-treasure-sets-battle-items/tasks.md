# Tasks: Sets de Tesoros y Objetos de Batalla en la Versión Web

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md)

**Prerequisites**: `specs/024-react-web-migration/tasks.md` Fase 1-4 (Setup, Foundational, US1, US2) completadas — esta spec extiende `battleSession.ts` (024 T024), `battleResource.ts` (024 T016) y la pantalla de preparación pre-batalla del roster (024 T041), no las recrea.

**Tests**: mismo criterio que `024` — Vitest para las funciones puras de `src/engine/`, sin contract-tests (sin backend).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Foundational (contenido + tipos, bloqueante para ambas historias)

- [ ] T001 [P] Definir tipos TS `TreasureSetDefinition`, `BattleItemDefinition`, `BattleItemCategory` en `src/types/content.ts` / `src/data/enums.ts` (ver `data-model.md`)
- [ ] T002 [P] Exportar `TreasureSetCatalog` de Unity (`Assets/Scripts/Model/Battler/TreasureSetCatalog.cs` + sus `TreasureSetDefinition` asset instances) a `src/data/catalogs/treasureSets.json`
- [ ] T003 [P] Exportar `BattleItemCatalog` de Unity a `src/data/catalogs/battleItems.json`
- [ ] T004 [P] Portar `TreasureSetProgressEvaluator` → `src/engine/treasureSetProgress.ts` (`isSetComplete`, `hasRewardsGranted` — ver research.md Decisión 3, `hasRewardsGranted` NO depende de `isSetComplete`)
- [ ] T005 [P] Portar `BattleItemSelectionController.TryConfirmSelection` → `src/engine/battleItemSelection.ts` (máximo 3, valida cantidad contra inventario, lista vacía válida)
- [ ] T006 [P] Tests Vitest de T004-T005: set con tesoro añadido después de otorgado el bono sigue `hasRewardsGranted() === true` aunque `isSetComplete() === false`; selección que excede inventario se rechaza; selección vacía se acepta

**Checkpoint**: contenido y funciones puras listas y testeadas, sin tocar todavía `battleSession.ts`.

---

## Phase 2: User Story 1 - Completar un set de tesoros otorga bonificación permanente (Priority: P1)

**Goal**: al ganar una batalla que completa un set, la bonificación pasiva queda otorgada de forma permanente y activa de inmediato; se reaplica automáticamente en cada batalla futura.

**Independent Test**: ver spec.md US1 Independent Test.

- [ ] T007 [US1] Extender `battleSession.setupChapter()` (`024` T024, `src/engine/battleSession.ts`): sumar `passiveRegenBonus` de cada set con `hasRewardsGranted() === true` (T004) y aplicarlo vía `battleResource.applyPassiveRegenBonus` (`024` T016) antes de habilitar despliegue (research.md Decisión 4)
- [ ] T008 [US1] Extender el flujo de recompensas de victoria dentro de `battleSession.ts` (parte de `024` T024): evaluar todos los sets del catálogo tras cada victoria, otorgar (monótono, `grantedTreasureSetIds`) los recién completados, y aplicar su bono de inmediato a la sesión activa (research.md Decisión 5) — no solo diferido al próximo `setupChapter`
- [ ] T009 [P] [US1] Test Vitest: completar un set en la victoria N, confirmar que el bono está activo en un reintento inmediato de esa misma victoria (sin pasar por un `setupChapter` nuevo) y también en la siguiente entrada a batalla
- [ ] T010 [P] [US1] Test Vitest: un set ya otorgado no pierde su bono si se le añade un tesoro nuevo al catálogo (mock de `TreasureSetDefinition.treasureIds` ampliado)
- [ ] T011 [US1] Test Playwright/integración: completar dos sets distintos con victorias separadas, confirmar que sus bonos se suman en una batalla posterior

**Checkpoint**: US1 demostrable de forma independiente sobre el MVP de `024`.

---

## Phase 3: User Story 2 - Seleccionar objetos de batalla antes de entrar (Priority: P1)

**Goal**: el jugador selecciona hasta 3 objetos de su inventario en la pantalla de preparación pre-batalla, sin que se descuenten todavía.

**Independent Test**: ver spec.md US2 Independent Test.

- [ ] T012 [US2] Componente `src/components/roster/BattleItemSelectionPanel.tsx` + `BattleItemRow.tsx`: lista `battleItemInventory` del jugador, checkbox/stepper de selección hasta 3, usa `battleItemSelection.ts` (T005) para validar en vivo
- [ ] T013 [US2] Integrar `BattleItemSelectionPanel` en la misma pantalla donde `024` T041 (`TeamFormationScreen.tsx`) ya arma el equipo — misma pantalla de preparación pre-batalla
- [ ] T014 [US2] Al confirmar preparación, pasar la `BattleItemSelection` como state efímero de navegación (`react-router`) hacia `/battle/:chapterId`, análogo a `BattleLaunchContext.SelectedBattleItemIds` (research.md Decisión 2) — no persistir en ningún store
- [ ] T015 [P] [US2] Test de componente: seleccionar un 4º objeto con 3 ya seleccionados no lo permite hasta deseleccionar uno; sin objetos en inventario, la pantalla permite continuar sin seleccionar

**Checkpoint**: US2 demostrable de forma independiente — la selección queda marcada, sin necesitar todavía que sus efectos estén implementados (US3).

---

## Phase 4: User Story 3 - Un objeto seleccionado surte efecto desde el inicio de la batalla (Priority: P1)

**Goal**: los tres tipos de efecto (aceleración, recurso extra, tesoro adicional) se aplican correctamente, el inventario se descuenta solo al entrar a la batalla, y los efectos sobreviven a un reintento.

**Independent Test**: ver spec.md US3 Independent Test.

- [ ] T016 [US3] Extender `battleSession.setupChapter()` (mismo punto que T007): leer la `BattleItemSelection` recibida por navegación (T014), resolver cada `itemId` contra `battleItemCatalog`, descontar `count -= 1` en `battleItemInventory` del jugador guardado — ignorar sin error cualquier `itemId` sin stock real o desconocido (research.md Decisión 7)
- [ ] T017 [US3] [P] Aplicar efecto `SpeedBoost`: sumar `magnitude` a `battleSession.moveSpeedMultiplier` (acumulativo si hay más de uno), consumido por el multiplicador de velocidad ya definido en `024` `src/engine/combat/` (`BattleSessionModifiers.MoveSpeedMultiplier` equivalente)
- [ ] T018 [US3] [P] Aplicar efecto `ExtraResource`: sumar `magnitude` a `battleSession.grantedInstantResourceAmount` y llamar `battleResource.addInstantResource` al inicio de la batalla
- [ ] T019 [US3] Aplicar efecto `BonusTreasure`: fijar `battleSession.bonusTreasureRequested = true`; en el flujo de recompensas de victoria (extiende T008), si está activo, construir el conjunto de `treasureIds` pendientes de todos los sets y otorgar uno aleatorio (research.md Decisión 6) — no-op sin error si no quedan pendientes
- [ ] T020 [US3] Extender `battleSession.retryBattle()` (`024` T024): resetear recurso pero reaplicar `grantedInstantResourceAmount` ya otorgado; **no** volver a descontar inventario ni resetear `moveSpeedMultiplier`/`bonusTreasureRequested` (research.md Decisión 7 — mismo criterio que el resto de `RetryBattle` ya documentado en `024`)
- [ ] T021 [P] [US3] Tests Vitest de T016-T020: descuento ocurre exactamente una vez al entrar (no en selección, no se repite en retry); `BonusTreasure` sin pendientes no produce error; `SpeedBoost` doble se acumula
- [ ] T022 [US3] Test Playwright end-to-end: seleccionar un objeto de cada categoría en 3 batallas separadas, confirmar el efecto observable de cada una (velocidad de unidad, recurso inicial, tesoro adicional en la pantalla de resultado)

**Checkpoint**: las 3 historias de usuario de `spec.md` (todas P1) están cubiertas — el sistema de objetos de batalla es funcionalmente completo.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: depende de `024` Fases 1-4 completas. Bloquea US1/US2/US3.
- **US1 (Fase 2)**: depende solo de Foundational — no depende de US2/US3, puede completarse y demostrarse antes.
- **US2 (Fase 3)**: depende solo de Foundational — la UI de selección no requiere que los efectos (US3) ya estén implementados.
- **US3 (Fase 4)**: depende de Foundational y de que US2 exista (T016 lee la selección que T014 produce) — no puede demostrarse de forma end-to-end sin US2, aunque su lógica de efectos (T017-T020) es testeable de forma aislada con una selección simulada.

## Implementation Strategy

1. Fase 1 (Foundational) — contenido y funciones puras, testeadas de forma aislada.
2. US1 y US2 en paralelo si hay más de un desarrollador — ninguna depende de la otra.
3. US3 al final — integra la salida de US2 con los efectos sobre `battleSession` ya extendido por US1.
4. Al cerrar esta spec, actualizar `specs/024-react-web-migration/tasks.md` T033 marcando sets de tesoros y objetos de batalla como completados (quedan pendientes ahí solo saga arcs, Gatorreta y tracking de enemigos).
