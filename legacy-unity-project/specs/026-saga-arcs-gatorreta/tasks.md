# Tasks: Arcos de Saga y Gatorreta en la Versión Web

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md)

**Prerequisites**: `specs/024-react-web-migration/tasks.md` Fase 1-4 completadas (en particular T011 `sagaArcProgress.ts`, T016 `battleResource.ts`, T024 `battleSession.ts`). No depende de `025`, pero comparte el mismo punto de extensión del flujo de recompensas de victoria — conviene implementarse después para evitar conflictos de merge en `battleSession.ts`.

**Tests**: mismo criterio que `024`/`025` — Vitest para funciones puras, sin contract-tests (sin backend).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Foundational (contenido + tipos, bloqueante para ambas historias)

- [ ] T001 [P] Definir tipos TS `SagaArcDefinition`, `SagaArcCatalog`, `SpecialAreaWeaponConfig` en `src/types/content.ts` (ver `data-model.md`)
- [ ] T002 [P] Exportar `SagaArcDefinition` instances de Unity (`Assets/Scripts/Model/Battler/SagaArcDefinition.cs` assets del arco "Imperio de los Gatos") a `src/data/catalogs/sagaArcs.json`
- [ ] T003 [P] Confirmar que `src/engine/sagaArcProgress.ts` (creado por `024` T011) expone `isArcCompleted`/`hasRewardsGranted` con la firma que esta spec necesita; si `024` T011 todavía no se completó, tratarlo como bloqueante y ejecutarlo primero
- [ ] T004 [P] Portar `GatorretaController` → `src/engine/specialAreaWeapon.ts`: `tick(state, deltaSeconds)`, `tryActivate(state, targetsInRange)`, `resetRecharge(config)` (research.md Decisión 5 — funciones puras, sin acoplarse al pipeline de daño de `024` T020)
- [ ] T005 [P] Extender `src/engine/battleResource.ts` (`024` T016) con `tryUpgradeRegen(state, cost, regenIncrease)` — atómico, no se incorpora a la línea base que `resetResource()` restaura (research.md Decisión 7)
- [ ] T006 [P] Tests Vitest de T004-T005: arma no disponible mientras recarga y no reinicia temporizador en intento fallido; `tryUpgradeRegen` con recurso insuficiente no cambia nada; mejora de regen no sobrevive a un `resetResource()` simulado

**Checkpoint**: contenido y funciones puras listas y testeadas, sin tocar todavía `battleSession.ts`.

---

## Phase 2: User Story 1 - Jugar un capítulo con la dificultad de su arco de saga (Priority: P1)

**Goal**: el mismo capítulo jugado dentro de arcos distintos aplica proporcionalmente sus multiplicadores de costo/fuerza enemiga.

**Independent Test**: ver spec.md US1 Independent Test.

- [ ] T007 [US1] Extender `battleSession.setupChapter()` (`024` T024): resolver `activeArc` con prioridad al contexto de navegación sobre el arco fijo del capítulo, consumido y reseteado en el mismo montaje (research.md Decisión 2)
- [ ] T008 [US1] Pasar `activeArc.unitCostMultiplier`/`enemyStrengthMultiplier` a `unitDeployment`/`enemyWaveSpawner`/cálculo de salud de base enemiga ya creados por `024` T017/T018/T024 — sin cambiar sus firmas, solo el valor por defecto (1) que reciben cuando no hay arco activo
- [ ] T009 [P] [US1] Test Vitest: mismo capítulo con arco multiplicador 100% vs. 300% produce costo/fuerza enemiga proporcionalmente distintos; capítulo sin arco se comporta igual que antes de esta spec

**Checkpoint**: US1 demostrable de forma independiente sobre el MVP de `024`.

---

## Phase 3: User Story 2 - Recompensas de finalización de arco (Priority: P2)

**Goal**: completar todos los capítulos de un arco otorga sus recompensas de finalización exactamente una vez.

**Independent Test**: ver spec.md US2 Independent Test.

- [ ] T010 [US2] Extender el flujo de recompensas de victoria dentro de `battleSession.ts` (mismo paso que `025` T008 ya añadió para sets de tesoros): si `activeArc` está definido, `isArcCompleted()` (T003) es verdadero y `hasRewardsGranted()` es falso, registrar el arco en `arcs[]` (monótono) y añadir `arcCompletionUnitUnlocks[]` a `unlockedBonusUnitIds` (deduplicado)
- [ ] T011 [US2] Persistir `arcCompletionFeatureFlags[]` sin interpretarlos — solo registrar que el arco fue recompensado (research.md Decisión 6, no crear ningún sistema que las consuma)
- [ ] T012 [P] [US2] Test Vitest: completar el último capítulo pendiente de un arco otorga sus recompensas exactamente una vez; rejugar capítulos del mismo arco después no las repite
- [ ] T013 [P] [US2] Test Vitest: un arco con capítulo de jefe designado evalúa la finalización igual que cualquier otro capítulo (sin condición especial para el jefe)

**Checkpoint**: US1 + US2 cubren el sistema de arcos completo.

---

## Phase 4: User Story 3 - Activar el arma especial de área "Gatorreta" (Priority: P2)

**Goal**: el arma se recarga con el tiempo, se activa manualmente cuando está disponible, y aplica daño de área a los enemigos en rango.

**Independent Test**: ver spec.md US3 Independent Test.

- [ ] T014 [US3] Extender `battleSession.setupChapter()`: inicializar `specialAreaWeapon` (T004) si el capítulo activo lo configura; `undefined` si no (nulo-seguro, sin UI visible — spec.md Edge Cases)
- [ ] T015 [US3] Integrar el ticker de simulación ya creado por `024` T026 para llamar `specialAreaWeapon.tick(deltaSeconds)` cada frame, junto al resto del estado de `battleSession`
- [ ] T016 [P] [US3] Componente `src/components/battle/SpecialWeaponButton.tsx`: indicador de recarga (visual/porcentaje), botón habilitado solo cuando `isAvailable`, oculto por completo si `specialAreaWeapon` es `undefined`
- [ ] T017 [US3] Acción `activateSpecialWeapon` en `useBattleSessionStore` (`024` T025): resuelve objetivos enemigos en rango desde el mismo registro de unidades activas que usa el combate normal (research.md Decisión 5 — sin segunda fuente de verdad de posiciones), llama `tryActivate`, aplica `damageEvents` resultantes reutilizando la misma vía de aplicación de daño que `024` T020 usa para daño a unidades (el daño de área en sí no pasa por el pipeline de crítico/clasificación — es un valor fijo)
- [ ] T018 [US3] Extender `battleSession.retryBattle()` (`024` T024): llamar `specialAreaWeapon.resetRecharge()` si está configurada (spec.md US3 Acceptance Scenario 4)
- [ ] T019 [P] [US3] Test Vitest: activación con objetivos dentro y fuera de rango solo daña a los de dentro; activación mientras recarga es no-op sin reiniciar el temporizador
- [ ] T020 [US3] Test Playwright/integración: esperar la recarga completa, activar manualmente, confirmar el daño de área aplicado y el reinicio del temporizador

**Checkpoint**: US1 + US2 + US3 — Gatorreta funcional sobre el bucle de combate de `024`.

---

## Phase 5: User Story 4 - Mejorar la regeneración del recurso de despliegue (Priority: P3)

**Goal**: gastar recurso acumulado para aumentar su tasa de regeneración por el resto de la batalla, sin que la mejora sobreviva a un reintento.

**Independent Test**: ver spec.md US4 Independent Test.

- [ ] T021 [US4] Acción `upgradeRegen(cost, regenIncrease)` en `useBattleSessionStore`, llamando `battleResource.tryUpgradeRegen` (T005)
- [ ] T022 [P] [US4] Componente `src/components/battle/RegenUpgradeButton.tsx`: deshabilitado cuando el recurso actual es menor al costo configurado
- [ ] T023 [P] [US4] Test Vitest: mejora exitosa descuenta recurso y aumenta la tasa de inmediato; intento con recurso insuficiente no cambia nada; un `retryBattle()` posterior no conserva la mejora (integración con `024` T024/`025` — la bonificación de sets sí se conserva, la mejora manual no)

**Checkpoint**: todas las historias de usuario de `spec.md` (US1-US4) están cubiertas.

---

## Dependencies & Execution Order

- **Foundational (Fase 1)**: depende de `024` Fases 1-4 (en particular T011, T016, T024). Bloquea US1-US4.
- **US1 (Fase 2)**: depende solo de Foundational.
- **US2 (Fase 3)**: depende de Foundational; comparte punto de extensión de `battleSession.ts` con `025` T008 — si ambas specs se implementan en paralelo, coordinar el merge de esa función.
- **US3 (Fase 4)**: depende solo de Foundational — independiente de US1/US2, puede implementarse en paralelo.
- **US4 (Fase 5)**: depende solo de Foundational (T005) — independiente del resto.

## Implementation Strategy

1. Fase 1 (Foundational) — contenido y funciones puras, testeadas de forma aislada.
2. US1 (arcos aplicando multiplicadores) primero — es P1 y la base conceptual de US2.
3. US2 (recompensas de finalización) — depende conceptualmente de US1 (necesita `activeArc` resuelto) aunque el otorgamiento en sí solo depende de `isArcCompleted`.
4. US3 (Gatorreta) y US4 (mejora de regen) en paralelo — ninguna depende de arcos ni entre sí.
5. Al cerrar esta spec, actualizar `specs/024-react-web-migration/tasks.md` T033: de los sistemas ahí listados, solo queda pendiente de spec propia el tracking de enemigos encontrados (`encounteredEnemyIds`).
