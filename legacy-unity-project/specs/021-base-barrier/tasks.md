---

description: "Task list template for feature implementation"
---

# Tasks: Barrera de Base y Jefes Vinculados

**Input**: Design documents from `/specs/021-base-barrier/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/boss-barrier-lifecycle.md](./contracts/boss-barrier-lifecycle.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode + PlayMode) ya establecido en 001-020.

**Organization**: Tareas agrupadas por historia de usuario (US1-US2, según spec.md — ambas P1).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Model,Gameplay,View}/Battler/`, herramientas de contenido en `Assets/Editor/Battler/`, tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (001-020) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde antes de empezar, como línea base de referencia.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: El dato que identifica al jefe vinculado y la API de barrera de `BaseHealth`, compartidos por ambas historias de usuario.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [X] T002 [P] Añadir `isLinkedBoss: bool` (default `false`) a `WaveEntry` en `Assets/Scripts/Model/Battler/EnemyWaveDefinition.cs`, según [data-model.md § EnemyWaveDefinition.WaveEntry](./data-model.md#enemywavedefinitionwaveentry-extendido-assetsscriptsmodelbattlerenemywavedefinitioncs)
- [X] T003 [P] Añadir `IsBarrierActive` (propiedad), `BarrierStateChanged` (evento), `ActivateBarrier()`/`RemoveBarrier()` (idempotentes) a `Assets/Scripts/Gameplay/Battler/BaseHealth.cs`, y extender el guard de `ApplyDamage` con `|| IsBarrierActive`, según [contracts/boss-barrier-lifecycle.md § BaseHealth.ApplyDamage / ActivateBarrier / RemoveBarrier](./contracts/boss-barrier-lifecycle.md)

**Checkpoint**: Dato de jefe vinculado y API de barrera listos — las 2 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Ver la base enemiga protegida mientras el jefe vinculado sigue con vida (Priority: P1) 🎯 MVP

**Goal**: Un nivel cuya oleada declara un jefe vinculado mantiene su base enemiga invulnerable de principio a fin (hasta que exista un mecanismo de derrota, entregado en US2); un nivel sin jefe vinculado sigue funcionando exactamente igual que hoy.

**Independent Test**: Entrar a un nivel configurado con una oleada `isLinkedBoss`, atacar la base enemiga sin ningún mecanismo de derrota disponible todavía, y confirmar que su vida permanece en el máximo (spec.md US1).

### Tests for User Story 1 ⚠️

- [X] T004 [P] [US1] EditMode test en `Assets/Tests/EditMode/Battler/BaseHealthStateTests.cs` (extendido): con `ActivateBarrier()` llamado, `ApplyDamage` de cualquier monto positivo no cambia `CurrentHealth` ni dispara `HealthChanged`/`HealthDepleted` (FR-002); `ActivateBarrier()` llamado dos veces seguidas dispara `BarrierStateChanged` una sola vez (idempotencia) — depende de T003
- [X] T005 [US1] PlayMode test en `Assets/Tests/PlayMode/Battler/BossBarrierBattlePlayModeTests.cs` (archivo nuevo): en un nivel cuya oleada activa tiene una entrada `isLinkedBoss`, simular una batalla completa atacando la base enemiga y confirmar que su vida nunca baja del máximo (US1 Escenario 1, SC-001); en un nivel sin ninguna entrada `isLinkedBoss`, confirmar que la base enemiga pierde vida con normalidad, igual que antes de esta feature (US1 Escenario 2, SC-003, regresión) — depende de T002, T003 (hace pasar T006)

### Implementation for User Story 1

- [X] T006 [US1] Extender `Assets/Scripts/Gameplay/Battler/EnemyWaveSpawner.cs`: campo nuevo `m_LinkedBossEntryIndex` calculado en `Initialize()` (índice de la primera `WaveEntry.isLinkedBoss == true`, `-1` si ninguna); si `>= 0`, llamar `m_EnemyBase?.ActivateBarrier()` al final de `Initialize()` y de nuevo en `ResetSpawner()`, según [contracts/boss-barrier-lifecycle.md § EnemyWaveSpawner.Initialize / ResetSpawner](./contracts/boss-barrier-lifecycle.md) (hace pasar T005) — depende de T002, T003
- [X] T007 [P] [US1] Extender `Assets/Scripts/View/Battler/BaseHealthBarView.cs`: campo opcional `m_BarrierIndicator: GameObject`, suscripción a `BaseHealth.BarrierStateChanged` en `OnEnable`/`OnDisable`, `RefreshBarrier()` que hace `m_BarrierIndicator?.SetActive(m_BaseHealth.IsBarrierActive)` — depende de T003 (archivo distinto de T006, en paralelo)
- [X] T008 [US1] Extender `Assets/Editor/Battler/EmpireOfCatsContentBuilder.cs`: autorar `TheFace` (`UnitDefinition`: `MaxHealth = 99999`, `Damage = 2000`, idle+ataque+variante visual reutilizando arte ya importado, Principio III) y `TheFaceWave` (`EnemyWaveDefinition`: una `WaveEntry` con `unit = TheFace`, `isLinkedBoss = true`), según [data-model.md § Contenido nuevo](./data-model.md#contenido-nuevo-no-código--primer-jefe-vinculado-real) — depende de T002
- [X] T009 [US1] Extender `Assets/Editor/Battler/EmpireOfCatsContentBuilder.cs` (mismo archivo que T008, secuencial): autorar `TheFace` (`ChapterDefinition`, diálogo pre/post-batalla breve propio — Principio I) usando `TheFaceWave`; autorar `TheFaceArc` (`SagaArcDefinition` **nuevo y dedicado**, no `Chapter1Arc` — `Levels = [TheFace]`, `BossLevel = TheFace`, research.md §6 revisado); generar `TheFace_Battle.unity` reutilizando el mismo helper de escena de batalla ya usado por `Corea_Battle.unity`/`Mongolia_Battle.unity`, vinculado a `TheFaceArc`; cablear `m_BarrierIndicator` en el `EnemyBasePrefab` de esa escena — depende de T006, T007, T008
- [X] T010 [US1] Extender `Assets/Editor/Battler/EmpireOfCatsContentBuilder.cs` (mismo archivo que T008/T009, secuencial): autorar `Banner_TheFace` (`ChapterBannerDefinition`: `LinkedChapter = TheFace`, `TargetSceneName = "TheFace_Battle"`, `Region = ImperioDeLosGatosRegion` — misma región que Corea/Mongolia —, `DifficultyRank` mayor al de `Banner_Mongolia` para satisfacer `MissionRegionDifficultyValidator`, `EnergyCost`); registrarlo en `MainAdventureMap.asset` — sin este banner, "The Face" queda autorado pero inalcanzable desde el Mapa de Aventuras (research.md §6, hallazgo H1 de `/speckit-analyze`) — depende de T009. **Corrección durante implementación**: la resolución de arco NO usa `BattleLaunchContext.RequestedArc` (ese cableado no existe para ningún banner de este proyecto, ver research.md §6 "Corrección durante implementación") — `TheFace_Battle.unity` fija `BattleStateManager.m_ActiveArc = TheFaceArc` de forma serializada vía `BuildBattleScene(..., TheFaceArcAssetPath, ...)`, exactamente el mismo mecanismo real que ya usan Corea/Mongolia.
- [X] T011 [US1] Extender `Assets/Editor/Battler/EmpireOfCatsContentBuilder.cs` (mismo archivo, secuencial): añadir a `ValidateScene()` una llamada `ValidateBattleScene(TheFaceScenePath, TheFaceChapterAssetPath, "thefacelevel", errors)` (mismo patrón que las validaciones ya existentes de Corea/Mongolia) y validar `TheFaceArc.IsValid` — sin esto, un error de autoría en T008-T010 no lo detectaría la herramienta de validación propia del proyecto (hallazgo M1 de `/speckit-analyze`) — depende de T009, T010

**Checkpoint**: US1 completa y verificable de forma independiente — la barrera bloquea el daño mientras haya un jefe vinculado, con indicador visible y contenido real ("The Face") alcanzable desde su propio banner y validado por la herramienta de contenido del proyecto.

---

## Phase 4: User Story 2 - Derrotar al jefe vinculado retira la barrera y permite ganar el nivel (Priority: P1) 🎯 MVP

**Goal**: Derrotar específicamente al jefe vinculado retira la barrera de inmediato; derrotar solo enemigos regulares de la oleada no la retira.

**Independent Test**: En un `BossLevel` con la barrera activa, derrotar específicamente al jefe vinculado y confirmar que la base enemiga vuelve a recibir daño con normalidad de inmediato (spec.md US2).

### Tests for User Story 2 ⚠️

- [X] T012 [US2] Extender `Assets/Tests/EditMode/Battler/BaseHealthStateTests.cs` (mismo archivo que T004, secuencial): tras `ActivateBarrier()` seguido de `RemoveBarrier()`, `ApplyDamage` vuelve a reducir `CurrentHealth` con normalidad (FR-004); `RemoveBarrier()` llamado dos veces seguidas dispara `BarrierStateChanged` una sola vez (idempotencia) — depende de T004
- [X] T013 [US2] Extender `Assets/Tests/PlayMode/Battler/BossBarrierBattlePlayModeTests.cs` (mismo archivo que T005, secuencial): derrotar únicamente a los enemigos regulares de la oleada de "The Face" (sin derrotar al jefe) no retira la barrera (US2 Escenario 3); derrotar específicamente a "The Face" retira la barrera en el mismo frame y los ataques siguientes reducen la vida de la base con normalidad hasta poder ganar el nivel (US2 Escenarios 1-2, SC-002); reintentar el nivel tras una derrota reactiva la barrera desde cero, incluso si "The Face" ya había muerto en el intento anterior (Edge Case) — depende de T005, T009 (no depende de T010/T011: el test carga la escena directamente, igual que quickstart.md)

### Implementation for User Story 2

- [X] T014 [US2] Extender `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`: evento nuevo `Defeated`, disparado en `ApplyDamage(int amount)` cuando `IsDestroyed` pasa a `true`, antes de `UnitRuntimePool.Release(this)`, según [contracts/boss-barrier-lifecycle.md § UnitRuntime.ApplyDamage](./contracts/boss-barrier-lifecycle.md) — sin dependencia de código real sobre T002/T003; puede ejecutarse en cualquier momento tras la Fase 2
- [X] T015 [US2] Extender `Assets/Scripts/Gameplay/Battler/EnemyWaveSpawner.cs` (mismo archivo que T006, secuencial): en `SpawnEnemy(...)`, si el índice spawneado coincide con `m_LinkedBossEntryIndex`, suscribir `instance.Defeated += OnLinkedBossDefeated`; nuevo método privado `OnLinkedBossDefeated(UnitRuntime boss)` que se desuscribe a sí mismo y llama `m_EnemyBase?.RemoveBarrier()`, según [contracts/boss-barrier-lifecycle.md § EnemyWaveSpawner.SpawnEnemy](./contracts/boss-barrier-lifecycle.md) (hace pasar T013) — depende de T006, T014

**Checkpoint**: Las 2 historias de usuario quedan completas e independientemente funcionales — el ciclo completo (barrera activa → derrotar al jefe → base atacable → ganar el nivel) es jugable de punta a punta en "The Face", alcanzable desde su propio banner en el Mapa de Aventuras.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T016 [P] Revisar que la implementación final no se haya desviado de [contracts/boss-barrier-lifecycle.md](./contracts/boss-barrier-lifecycle.md) / [data-model.md](./data-model.md) / [research.md § 6](./research.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación.
- [X] T017 Correr la suite completa EditMode + PlayMode (001-021) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde. Incluir `EmpireOfCatsContentBuilder.ValidateScene()` (T011) en la corrida.
- [ ] T018 Ejecutar los 7 pasos de validación manual de [quickstart.md](./quickstart.md) (incluye entrar por el Mapa de Aventuras y confirmar que `Banner_TheFace` es visible y seleccionable dentro de la región "Imperio de los Gatos", paso 1, T010) — probablemente requiera el Editor con GUI, mismo criterio documentado para pasos equivalentes en specs anteriores.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias
- **Foundational (Fase 2)**: depende de Setup — bloquea las 2 historias de usuario
- **US1 (Fase 3)**: depende de Foundational
- **US2 (Fase 4)**: depende de Foundational en su lógica de datos; en la práctica se implementa después de US1 porque `OnLinkedBossDefeated`/la suscripción a `Defeated` (T015) extiende el mismo `EnemyWaveSpawner.cs` que T006 (US1) ya creó, y su test PlayMode (T013) extiende el mismo archivo que T005 (US1), además de depender del contenido real ("The Face") autorado en T008/T009 (US1) — no depende de T010/T011 (banner/validación), que son alcanzabilidad y verificación, no prerrequisitos funcionales de la mecánica
- **Polish (Fase 5)**: depende de que las 2 historias estén completas

### User Story Dependencies

- **US1 (P1)**: tras Foundational — sin dependencia de otras historias; entrega la barrera activa (bloqueo de daño), contenido real ("The Face" en su propio arco dedicado, research.md §6 revisado) y su propio banner en el Mapa de Aventuras para poder alcanzarlo, aunque todavía sin ningún mecanismo de derrota
- **US2 (P1)**: tras Foundational — conceptualmente independiente de US1 en su lógica (`Defeated`/`OnLinkedBossDefeated` no dependen de cómo se activó la barrera), pero comparte archivo con T006 (`EnemyWaveSpawner.cs`) y reutiliza el contenido de "The Face" ya autorado por T008/T009 en vez de autorar un segundo nivel de prueba

### Parallel Opportunities

- T002, T003 (Fase 2) son independientes entre sí — archivos distintos
- T004 (test) y T006/T007 (implementación) pueden avanzar en paralelo una vez completada la Fase 2, aunque T005/T006 comparten intención (el test hace pasar la implementación)
- T007 (US1, `BaseHealthBarView.cs`) es independiente de T006/T008/T009/T010/T011 (US1) — archivo distinto
- T014 (US2, `UnitRuntime.cs`) es independiente de T006/T007 (US1) y de T008-T011 (US1, contenido) — archivo distinto, sin dependencia de datos real (ver Notes)

---

## Parallel Example: Foundational (Fase 2)

```bash
# Lanzar juntos los cambios de datos independientes entre si (archivos distintos):
Task: "Añadir isLinkedBoss a Assets/Scripts/Model/Battler/EnemyWaveDefinition.cs"
Task: "Añadir IsBarrierActive/ActivateBarrier/RemoveBarrier a Assets/Scripts/Gameplay/Battler/BaseHealth.cs"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante — dato de jefe vinculado + API de barrera)
3. Completar Fase 3: US1 (barrera activa + contenido real de "The Face", en su propio arco/banner, para observarla y alcanzarla)
4. Completar Fase 4: US2 (derrota del jefe retira la barrera) — ambas P1, spec.md las trata como el núcleo funcional del sistema
5. **Detener y validar**: correr T004/T005/T012/T013 en verde de forma aislada, luego el quickstart.md completo con GUI
6. Esto ya es el sistema completo — no hay una historia P2/P3 adicional en spec.md

### Incremental Delivery

1. Setup + Foundational → dato de jefe vinculado y API de barrera listos
2. + US1 → barrera activa, bloquea daño, indicador visible, contenido real jugable y alcanzable desde su propio banner (sin forma de ganar todavía)
3. + US2 → derrota del jefe funcional, cerrando el ciclo completo (el nivel ya puede ganarse)
4. Fase 5 → verificación final y quickstart manual con GUI

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- T006/T015 (mismo archivo `EnemyWaveSpawner.cs`), T008/T009/T010/T011 (mismo archivo `EmpireOfCatsContentBuilder.cs`) y T005/T013, T004/T012 (mismos archivos de test) se extienden de forma secuencial entre historias/tareas, siguiendo el mismo patrón ya usado en specs anteriores para archivos compartidos
- T008/T009 autoran la ÚNICA pieza de contenido real de esta feature ("The Face", en un `SagaArcDefinition` dedicado — **no** en `Chapter1Arc`, research.md §6 revisado tras `/speckit-analyze`) — US2 no autora un segundo nivel de prueba, reutiliza exactamente ese mismo contenido
- T010 (banner) y T011 (validación) existen porque `/speckit-analyze` encontró que el diseño original de esta sección (reutilizar `Chapter1Arc`/`Banner_Corea`) dejaba "The Face" inalcanzable desde el Mapa de Aventuras y sin cobertura de la herramienta de validación de contenido ya existente del proyecto — ver research.md §6 para el detalle completo de ambos hallazgos
- El hallazgo central de esta feature (research.md §2: el disparo de `Defeated` debe ser síncrono, no por sondeo, para evitar la condición de carrera con `UnitRuntimePool`) se verifica implícitamente en T013 — cualquier futura refactorización que reintroduzca un sondeo debe hacer fallar ese test, no pasar desapercibida
- T018 probablemente requiera un humano en el Editor de Unity (GUI) para la inspección visual de la barrera/indicador y el flujo completo de "The Face" (incluyendo su selección desde el Mapa de Aventuras), igual que quedó documentado para pasos equivalentes en specs anteriores
