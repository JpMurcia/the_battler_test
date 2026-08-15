# Tasks: Migración de The Battler a React Web

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md)

**Tests**: `spec.md` no exige TDD explícito; se incluyen tareas de test ligeras solo donde `plan.md` ya comprometió una estrategia (Vitest para `src/engine/`, Playwright para el flujo de User Story 1) — no hay tareas de contract-test por endpoint porque no hay backend.

**Organización**: Tareas agrupadas por historia de usuario de `spec.md` (P1 → P3), cada una entregable y demostrable de forma independiente sobre el repositorio nuevo (`the-battler-web/`, fuera de `the_battler_test/`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: historia de `spec.md` a la que pertenece (US1-US5)

## Phase 1: Setup

- [ ] T001 Crear repositorio nuevo `the-battler-web/` con Vite + React 18 + TypeScript (`npm create vite@latest -- --template react-ts`)
- [ ] T002 [P] Instalar dependencias de runtime: `pixi.js`, `@pixi/react`, `zustand`, `react-router-dom`
- [ ] T003 [P] Instalar dependencias de desarrollo: `vitest`, `@testing-library/react`, `playwright`, ESLint + Prettier (mismas reglas de formato que el resto del stack TS del equipo, si existen)
- [x] T004 Auditoría de GUIDs completada (2026-08-14, ver `data-model.md` § Auditoría de referencias real) — corrige la suposición original de esta tarea: `Assets/Characters/` y `Assets/Monsters Creatures Fantasy 2/` **sí están en uso** (son la fuente real de sprites de unidades jugables/enemigas), no hay que excluirlos. Lo confirmado sin uso y a excluir de la exportación es: `Assets/Character/` (singular), `Assets/Dragon Warrior Files/`, `Assets/Warrior free set/`, `Assets/ShootingSound/`, `Assets/Tiles/`+`TilePalette.prefab`. Pendiente para T023/T027/T038 (exportación de atlas): exportar únicamente los sprites que los 9 `UnitDefinition` de Capítulo 1/2/Empire of Cats referencian dentro de `Characters/`/`Monsters Creatures Fantasy 2/`, no las carpetas completas.
- [ ] T005 [P] Configurar estructura de carpetas base per `plan.md` (`src/data`, `src/engine`, `src/services/persistence`, `src/state`, `src/components`, `src/i18n`, `public/assets`)

**Checkpoint**: proyecto arranca (`npm run dev`), lint/test corren en vacío sin errores.

---

## Phase 2: Foundational (bloqueante para todas las historias)

**Propósito**: contenido base, persistencia y motor de reglas puras que toda historia de usuario necesita.

- [ ] T006 [P] Definir tipos TS de todas las DTOs de guardado en `src/types/saveData.ts` (`ProgressSaveData`, `PlayerProgressSaveData`, `MissionEnergySaveData`, `MenuSettings` — ver `data-model.md`)
- [ ] T007 [P] Definir tipos TS de contenido en `src/data/enums.ts` y `src/types/content.ts` (`UnitDefinition`, `ChapterDefinition`, `SagaArcDefinition`, `ChapterBannerDefinition`, `AdventureMap`, catálogos — ver `data-model.md`)
- [ ] T008 Exportar el contenido de `Assets/ScriptableObjects/Battler/Chapter1/` y `Assets/Data/Battler/` (banners, `MainAdventureMap`, configs por defecto) a JSON en `src/data/**` (depende de T004, T007)
- [ ] T009 [P] Implementar wrappers de persistencia `src/services/persistence/{chapterProgress,playerProgress,missionEnergy,menuSettings}.ts` — try/catch a default en `load()`, `localStorage.setItem` en `save()` (research.md Decisión 1)
- [ ] T010 [P] Implementar los 4 stores Zustand con middleware `persist` sobre los wrappers de T009 en `src/state/`
- [ ] T011 [P] Portar a `src/engine/` las funciones puras de menor riesgo (research.md Decisión 6): `battleOutcome.ts`, `missionEnergy.ts`, `unitLeveling.ts`, `playerCharacterLevel.ts`, `unitEvolution.ts`, `teamFormation.ts`, `sagaArcProgress.ts`
- [ ] T012 [P] Tests Vitest de las funciones de T011 usando los mismos casos borde documentados en `research.md` (energía nunca banca excedente al tope, coste indexado no fórmula, evolución todo-o-nada, equipo nunca vacío, empate resuelto a Defeat)
- [ ] T013 Implementar lookup de localización `src/i18n/useLocalizedText.ts` sobre el JSON exportado de `MainLocalizedText` (fallback a español, clave visible si falta — research.md Decisión 7)
- [ ] T014 Configurar `react-router-dom` con las rutas base (`/`, `/map`, `/battle/:chapterId`, `/hub`) en `App.tsx`

**Checkpoint**: motor de reglas puro testeado y verde; stores persisten y recargan correctamente; contenido del Capítulo 1 disponible como JSON tipado.

---

## Phase 3: User Story 1 - Bucle central de combate (Priority: P1) 🎯 MVP

**Goal**: desplegar unidades en un carril y ver el combate resolverse automáticamente hasta victoria/derrota.

**Independent Test**: cargar la app, entrar a la primera batalla del Capítulo 1, desplegar ≥2 unidades distintas, confirmar resolución automática sin más input tras el despliegue.

- [x] T015 [US1] Leer `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` en detalle — **completado**. `BattleStateManager` es un orquestador de 4 sub-sistemas propios (`BattleResourceController`, `UnitDeploymentController`, `EnemyWaveSpawner`, `BaseHealth`) más el resto del motor ya portado (`BattleOutcomeResolver`, `TeamFormationRosterFilter`, `UnitEvolutionStageResolver`). Hallazgos completos en `data-model.md` § BattleSession; también reveló systems fuera de las 5 historias actuales de `spec.md` (ver T033).
- [ ] T016 [P] [US1] Portar `BattleResourceController` → `src/engine/battleResource.ts`: regeneración automática del recurso de despliegue **en batalla** (distinto de Energía de Misión — ver `data-model.md`), `applyPassiveRegenBonus`, `addInstantResource`, `resetResource`
- [ ] T017 [P] [US1] Portar `UnitDeploymentController` → `src/engine/unitDeployment.ts`: slots/cooldown por unidad del roster activo (filtrado por `TeamFormationRosterFilter`, T011), coste modificado por `unitCostMultiplier`, habilitar/deshabilitar despliegue como bloque
- [ ] T018 [P] [US1] Portar `EnemyWaveSpawner` → `src/engine/enemyWaveSpawner.ts`: disparo de oleada por tiempo y por `healthThresholdWaveTriggers`, tope `maxSimultaneousEnemies`. **No portar** el modo "Zombie Outbreak" (oleada alternativa) ni el evento `EnemyEncountered` en esta tarea — quedan en T033 (fuera de las 5 historias de `spec.md`)
- [ ] T019 [P] [US1] Portar `BaseHealth` → `src/engine/baseHealth.ts`: `initialize(team, maxHealth, lanePosition)`, `resetHealth()`, evento `healthDepleted`
- [ ] T020 [US1] Portar `UnitRuntime.ComputeOutgoingDamage`/`ApplyDamage` (multiplicadores de clasificación, crítico, suelo de daño en 1) a `src/engine/combat/damage.ts`
- [ ] T021 [US1] Portar lógica de multi-hit (intervalo fijo 0.2s, descarte si el objetivo muere/sale de rango) a `src/engine/combat/multiHit.ts`
- [ ] T022 [US1] Portar inmunidad (bloqueo binario) y resistencia (reducción proporcional de duración) a `src/engine/combat/statusEffects.ts`
- [ ] T023 [P] [US1] Tests Vitest de T016-T022 sobre los casos ya documentados en `research.md`/`data-model.md` (crítico ×2 con roll independiente por golpe/objetivo, Cursed se salta sus propios bonus/penalizaciones, recurso de batalla nunca banca excedente al tope)
- [ ] T024 [US1] Implementar `src/engine/battleSession.ts` orquestando T016-T019 + `battleOutcome.ts` (T011), replicando el flujo real de `BattleStateManager` (`data-model.md` § BattleSession): `setupChapter` (carga progreso, filtra roster, resuelve etapa de evolución por unidad) → `beginBattle` (gate de diálogo pre-batalla antes de habilitar despliegue+oleada, **sin repetirse en retry**) → `evaluateOutcome` (empate resuelve Defeat) → `setOutcome` (guardado automático único vía `SaveChapterOutcome`, XP + desbloqueo de unidad en primera victoria vía `grantLevelRewards` — subconjunto sin sets de tesoro/objetos de batalla/arco, ver T033 — diálogo post-batalla antes de notificar en Victoria) → `retryBattle` (reset de recurso/slots/oleada/salud, reaplica bono de sets/objetos ya otorgado, sin repetir diálogo pre-batalla)
- [ ] T025 [US1] Implementar `useBattleSessionStore` (Zustand, efímero — no persiste, ver `data-model.md`) que envuelve T024 y expone acciones `deployUnit`, `tick(deltaSeconds)`
- [ ] T026 [US1] Implementar el ticker de simulación desacoplado del render (`PIXI.Ticker` o `requestAnimationFrame`, research.md Decisión 4) que llama `tick(deltaSeconds)` cada frame
- [ ] T027 [US1] Exportar atlas Pixi (idle+attack) de las unidades del Capítulo 1 a `public/assets/units/**` (depende de T004)
- [ ] T028 [P] [US1] Componente `src/components/battle/BattleScreen.tsx` (Pixi via `@pixi/react`): carril(es), bases jugador/enemigo, barra de recurso de batalla; lee `BattleLaunchContext` equivalente (state de `react-router`, consumido una vez al montar — ver `data-model.md`)
- [ ] T029 [P] [US1] Componente `src/components/battle/UnitSprite.tsx`: renderiza `UnitCombatProfile` con animación idle/attack según estado de `battleSession`
- [ ] T030 [P] [US1] Componente `src/components/battle/DeploymentBar.tsx`: lista de unidades desplegables con coste/cooldown (de T017), deshabilitadas según recurso/cooldown actual
- [ ] T031 [US1] Pantalla de resultado (`BattleResultScreen.tsx`) que muestra victoria/derrota y navega de vuelta al mapa
- [ ] T032 [US1] Test Playwright end-to-end: cargar batalla del Capítulo 1, desplegar 2 unidades, confirmar que llega a un resultado sin input adicional
- [ ] T033 [P] [US1] **[Opcional — fuera de las 5 historias actuales de `spec.md`]** Sistemas adicionales que `BattleStateManager.cs` reveló y que ya existen en Unity pero no están cubiertos por ninguna historia de usuario de esta spec. **Sets de tesoros y objetos de batalla ya tienen spec propia**: ver [`specs/025-treasure-sets-battle-items/`](../025-treasure-sets-battle-items/). **Arcos de saga y Gatorreta (incluida la mejora de regeneración) ya tienen spec propia**: ver [`specs/026-saga-arcs-gatorreta/`](../026-saga-arcs-gatorreta/). Queda aquí, todavía sin spec, solo: tracking de `encounteredEnemyIds` (futura biblioteca/bestiario) — requiere su propia spec (`027-...`) antes de planificarse en detalle. No bloquea el MVP de US1/US2.

**Checkpoint**: el bucle de combate es jugable de punta a punta sobre el Capítulo 1.

---

## Phase 4: User Story 2 - Progresión de capítulos con desbloqueo (Priority: P1)

**Goal**: completar una batalla desbloquea la siguiente etapa; el progreso sobrevive a recargar la página.

**Independent Test**: completar la primera batalla, recargar, confirmar que la siguiente etapa está desbloqueada y las posteriores siguen bloqueadas.

- [ ] T034 [US2] Conectar el resultado de `battleSession` (T024) con `useChapterProgressStore` (T010): al ganar, marcar `ChapterProgressRecord.isCompleted = true` y desbloquear el siguiente banner en `AdventureMap.banners[]` (orden = secuencia, ver `data-model.md`)
- [ ] T035 [P] [US2] Componente `src/components/map/AdventureMapScreen.tsx`: lista `AdventureMap.banners[]`, marca visualmente bloqueado/desbloqueado/completado
- [ ] T036 [P] [US2] Componente `src/components/map/ChapterBannerCard.tsx`
- [ ] T037 [US2] Impedir en `battleSession`/router la entrada a una etapa cuyo banner previo no esté completado (guard de ruta o validación al hacer clic)
- [ ] T038 [US2] Test Vitest: dado un `ProgressSaveData` con capítulo 1 completado, el store deriva capítulo 2 desbloqueado y capítulo 3 bloqueado

**Checkpoint**: US1 + US2 juntas cubren el MVP completo de "jugar y progresar".

---

## Phase 5: User Story 3 - Roster: nivelado, evolución y formación de equipo (Priority: P2)

**Goal**: subir de nivel, evolucionar unidades que cumplen requisitos, y elegir el equipo que se lleva a la próxima batalla.

**Independent Test**: con una unidad que cumple requisitos de evolución, evolucionarla cambia etapa/apariencia/stats; el equipo formado es el que aparece disponible en la siguiente batalla.

- [ ] T039 [P] [US3] Componente `src/components/roster/UnitUpgradeScreen.tsx` + `UnitUpgradeRow.tsx`: usa `unitLeveling.ts` (T011) contra `usePlayerProgressStore`
- [ ] T040 [P] [US3] Componente `src/components/roster/UnitEvolutionPanel.tsx`: usa `unitEvolution.ts` (T011), deshabilita el botón si no cumple `requiredLevel`/ítem, muestra el resultado todo-o-nada de la etapa
- [ ] T041 [P] [US3] Componente `src/components/roster/TeamFormationScreen.tsx` + `TeamFormationRow.tsx`: usa `teamFormation.ts` (T011), rechaza confirmar equipo vacío
- [ ] T042 [US3] Conectar `activeTeamUnitIds` de `usePlayerProgressStore` con `DeploymentBar` (T030) para que solo el equipo formado esté disponible en batalla
- [ ] T043 [US3] Exportar atlas Pixi por etapa de evolución (`SegundaForma`/`FormaVerdadera`) para las unidades del Capítulo 1 que las tengan definidas

**Checkpoint**: la meta-progresión completa (roster) funciona sobre el MVP de US1+US2.

---

## Phase 6: User Story 4 - Energía de misión (stamina) (Priority: P2)

**Goal**: la energía de misión limita cuántas batallas se pueden iniciar, se regenera con el tiempo.

**Independent Test**: gastar energía de misión por debajo del costo de la siguiente batalla, confirmar bloqueo hasta regeneración suficiente.

- [ ] T044 [US4] Conectar `missionEnergy.ts` (T011) con `useMissionEnergyStore` (T010): `sync(nowUtc, characterLevel)` al montar cualquier pantalla que dependa de energía de misión
- [ ] T045 [US4] Componente `src/components/battle/MissionEnergyBar.tsx`: muestra energía actual/máxima, se actualiza en vivo
- [ ] T046 [US4] Guard de entrada a batalla: `tryEnterMission(cost)` antes de navegar a `/battle/:chapterId`, con mensaje de energía insuficiente si falla
- [ ] T047 [US4] Test Vitest: regeneración con resto acarreado (no se pierden segundos sobrantes), tope en máximo sin bancar excedente — mismos casos que `research.md`

**Checkpoint**: el ritmo de sesión (stamina) está impuesto igual que en Unity. Nota: este es un recurso **distinto** del recurso de despliegue en batalla portado en T016 — no fusionar ambos stores.

---

## Phase 7: User Story 5 - Narrativa por batalla (Priority: P3)

**Goal**: reproducir diálogo pre/post-batalla específico de cada etapa.

**Independent Test**: entrar a una batalla con diálogo pre-batalla configurado, confirmar que se reproduce completo antes del primer despliegue posible; el diálogo post-batalla correcto según el resultado se reproduce al terminar.

- [ ] T048 [P] [US5] Componente `src/components/dialogue/DialoguePlayer.tsx` + hook `useDialogueSequence(lines)`: avanza línea por línea (retrato + texto)
- [ ] T049 [US5] Integrar `DialoguePlayer` en el gate de `beginBattle` de `battleSession.ts` (T024) antes del primer despliegue posible en `BattleScreen.tsx`
- [ ] T050 [US5] Integrar diálogo post-batalla correspondiente al resultado (`Victory`/`Defeat`) antes de mostrar `BattleResultScreen.tsx` (ya resuelto en el flujo de `setOutcome` de T024)
- [ ] T051 [US5] Test Playwright: batalla con diálogo configurado no permite desplegar hasta que la secuencia pre-batalla termina; un reintento tras derrota no repite el diálogo pre-batalla

**Checkpoint**: todas las historias de usuario de `spec.md` (P1-P3) están cubiertas.

---

## Phase 8: Polish & Cross-Cutting

- [ ] T052 [P] Selector de idioma en pantalla de ajustes (`SettingsPanel.tsx`), conectado a `useMenuSettingsStore.language`
- [ ] T053 [P] Selector/control de volumen (música/sfx/voz), conectado a `useMenuSettingsStore` (research.md — clamp `[0,1]`)
- [ ] T054 Auditoría de rendimiento en un dispositivo Android/iOS de gama media contra el objetivo de `plan.md` (60fps objetivo, piso 30fps)
- [ ] T055 [P] Exportar y portar el contenido restante (`Chapter2`, `EmpireOfCats`, eventos) siguiendo el mismo pipeline de T008/T027/T043, una vez validado el MVP de Capítulo 1
- [ ] T056 Validar manualmente el criterio SC-005 de `spec.md`: un jugador que conoce la versión Unity completa las mismas acciones sin explicación adicional

---

## Dependencies & Execution Order

- **Setup (Fase 1)**: sin dependencias.
- **Foundational (Fase 2)**: depende de Setup — bloquea todas las historias de usuario.
- **US1 (Fase 3, P1)**: depende solo de Foundational. Es el MVP. T033 (sistemas fuera de alcance) es opcional y no bloquea el resto de la fase.
- **US2 (Fase 4, P1)**: depende de Foundational + del resultado de batalla que produce US1 (T024/T034), pero es demostrable con un resultado de batalla simulado si US1 no está terminada.
- **US3 (Fase 5, P2)**: depende de Foundational; se integra con `DeploymentBar` de US1 (T042) pero las pantallas de roster en sí son independientes.
- **US4 (Fase 6, P2)**: depende de Foundational; se integra con la entrada a batalla de US1/US2 (T046).
- **US5 (Fase 7, P3)**: depende de Foundational; se integra con `battleSession`/`BattleScreen`/`BattleResultScreen` de US1 (T049/T050).
- **Polish (Fase 8)**: depende de todas las historias que se quieran pulir.

## Implementation Strategy

### MVP primero
1. Fase 1 (Setup) + Fase 2 (Foundational).
2. Fase 3 (US1) — **detenerse y validar** el bucle de combate de forma independiente.
3. Fase 4 (US2) — cierra el MVP mínimo demostrable ("jugar y progresar").

### Entrega incremental
4. Fase 5 (US3) y Fase 6 (US4) en paralelo si hay más de un desarrollador — ambas solo dependen de Foundational.
5. Fase 7 (US5) al final — es la de menor prioridad y la que más depende de que el resto del flujo de batalla ya exista.
6. Fase 8 (Polish) — incluye expandir a Capítulo 2 y el resto del catálogo, ya validado el pipeline de contenido con Capítulo 1.
7. Si se decide ampliar `spec.md` con las historias descubiertas en T015 (sets de tesoro, objetos de batalla, saga arcs, Gatorreta, biblioteca de enemigos), planificarlas como una spec incremental separada (`025-...`) en vez de forzarlas dentro del alcance ya cerrado de `024`.
