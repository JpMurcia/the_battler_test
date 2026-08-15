---

description: "Task list template for feature implementation"
---

# Tasks: Saga "Imperio de los Gatos" — Multiplicadores por Capítulo, Gatorreta y Brotes Zombis

**Input**: Design documents from `/specs/013-empire-of-cats-saga/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en `001`/`010`.

**Organization**: Tareas agrupadas por historia de usuario (spec.md: US1-US8) para permitir implementación y prueba independiente de cada una.

**Nota de alcance (plan.md, Constitution Check)**: esta feature SÍ introduce y modifica archivos `.cs` (a diferencia de `010`, que fue 100% datos) — extiende 7 clases existentes de forma aditiva y añade 9 tipos/clases pequeños nuevos (ver [plan.md § Project Structure](./plan.md#project-structure)). El contenido real autorado se limita a "Corea" y "Mongolia" (spec.md Assumptions); el resto de los 144 niveles de la saga queda fuera de esta feature.

**Nota de revisión**: esta versión incorpora las correcciones de un pase de `/speckit-analyze` (hallazgos E1-E5, C1, D1, F2) — ver el texto marcado "añadido/editado tras `/speckit-analyze`" en las tareas afectadas.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US1-US8, spec.md)
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay,View}/Battler/` (extendidas en esta feature, sin ensamblados nuevos), contenido nuevo en `Assets/ScriptableObjects/Battler/EmpireOfCats/`, escenas en `Assets/Scenes/Corea_Battle.unity` y `Assets/Scenes/Mongolia_Battle.unity`, herramienta de autoría en `Assets/Editor/Battler/EmpireOfCatsContentBuilder.cs`, tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Estructura de carpetas del contenido nuevo y esqueleto de la herramienta de autoría, siguiendo el patrón de `Chapter1ContentBuilder.cs`/`Chapter2ContentBuilder.cs`.

- [x] T001 Crear la estructura de carpetas: `Assets/ScriptableObjects/Battler/EmpireOfCats/Levels/`, `Assets/ScriptableObjects/Battler/EmpireOfCats/Units/Enemy/`, `Assets/ScriptableObjects/Battler/EmpireOfCats/Units/Player/`, `Assets/ScriptableObjects/Battler/EmpireOfCats/Dialogue/{Corea,Mongolia}/{PreBattle,PostBattle}/`, `Assets/ScriptableObjects/Battler/EmpireOfCats/PlaceholderArt/` (mismo layout que `Chapter1/`/`Chapter2/`)
- [x] T002 [P] Crear el esqueleto de `Assets/Editor/Battler/EmpireOfCatsContentBuilder.cs` (menú `The Battler > Build Empire of Cats Placeholder Content`, mismo patrón que `Chapter2ContentBuilder.cs`), sin lógica de generación todavía (se completa progresivamente en las fases de abajo)

**Checkpoint**: Estructura de carpetas y esqueleto de la herramienta de autoría listos.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Toda la infraestructura de código compartida que **todas** las historias de usuario de esta feature consumen — extensiones a `ChapterDefinition`, `UnitDefinition`, `UnitCombatProfile`, `UnitRuntime`, `LaneRegistry`, `EnemyWaveSpawner`, el guardado (`IChapterProgressStore`/`ProgressSaveData`/`PlayerProgressSaveData`), y 7 tipos nuevos (`SagaArcDefinition`, `SagaArcProgressRecord`, `SagaArcProgressEvaluator`, `UnitUnlockCatalog`+`UnitUnlockEntry`, `BattleLaunchContext`, `ZombieOutbreakEligibility`, además de `HealthThresholdWaveTrigger` y `UnitRarity`).

**⚠️ CRITICAL**: Ninguna historia de usuario puede darse por completa hasta que esta fase compile y sus tests (si los hay) pasen — a diferencia de `010` (donde Foundational era solo validadores), aquí Foundational contiene el código de producción que las 8 historias comparten.

- [x] T003 [P] Crear `UnitRarity` (enum: `Normal, Special, Rare, SuperRare, UberRare, Legend, Collaboration`, `Normal` = miembro 0) en `Assets/Scripts/Core/Battler/UnitRarity.cs` ([data-model.md](./data-model.md#unitrarity-nuevo-enum))
- [x] T004 [P] Crear `HealthThresholdWaveTrigger` (`[Serializable] struct { float ThresholdPercent [Range(0,1)]; EnemyWaveDefinition ReinforcementWave; }`) en `Assets/Scripts/Model/Battler/HealthThresholdWaveTrigger.cs` ([data-model.md](./data-model.md#healththresholdwavetrigger-nuevo-serializable-struct))
- [x] T005 [P] Extender `Assets/Scripts/Model/Battler/UnitDefinition.cs`: añadir `m_Rarity` (sin `FormerlySerializedAs`) y propiedad pública `Rarity` (depende de T003)
- [x] T006 [P] Extender `Assets/Scripts/Model/Battler/UnitCombatProfile.cs`: añadir método estático `Scaled(UnitCombatProfile source, float multiplier)` (redondeo `Mathf.RoundToInt`, piso 1 en daño y vida) ([data-model.md](./data-model.md#unitcombatprofile-existente--método-nuevo))
- [x] T007 Extender `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`: nuevo overload `Initialize(UnitDefinition, Team, float, UnitEvolutionStage, float statMultiplier)` que usa `UnitCombatProfile.Scaled` (depende de T006; [contracts/chapter-arc-multipliers.md](./contracts/chapter-arc-multipliers.md))
- [x] T008 [P] Extender `Assets/Scripts/Model/Battler/ChapterDefinition.cs`: añadir `m_MaxSimultaneousEnemies`, `m_HealthThresholdWaveTriggers`, `m_TreasureRewardId`, `m_XpReward`, `m_FirstClearUnitUnlock`, `m_ZombieOutbreakWave` (sin `FormerlySerializedAs`, depende de T004; [data-model.md](./data-model.md#chapterdefinition-existente--assetsscriptsmodelbattlerchapterdefinitioncs--campos-nuevos))
- [x] T009 [P] Extender `Assets/Scripts/LaneRegistry.cs`: añadir `static int CountAlive(Team team)` ([data-model.md](./data-model.md#laneregistry-existente--assetsscriptslaneregistrycs--método-nuevo))
- [x] T010 Extender `Assets/Scripts/Gameplay/Battler/EnemyWaveSpawner.cs`: nueva firma de `Initialize` (`BaseHealth enemyBase = null, HealthThresholdWaveTrigger[] thresholdTriggers = null, int maxSimultaneousEnemies = 0, float enemyStrengthMultiplier = 1f`), reescritura de `Update()`/`ResetSpawner()` per [contracts/wave-triggers-and-enemy-cap.md](./contracts/wave-triggers-and-enemy-cap.md) (cupo con reintento, disparo de umbrales, multiplicador pasado a `UnitRuntime.Initialize`), **y nuevo `event Action<int> ThresholdWaveTriggered` invocado al disparar cada umbral** (FR-019 — añadido tras `/speckit-analyze`, hallazgo E1) — depende de T004, T007, T009
- [x] T011 Cambiar la firma de `Assets/Scripts/Model/Battler/IChapterProgressStore.cs`: `SaveChapterOutcome` de `void` a `bool`; añadir `void SaveArcRewardsGranted(string arcId)` ([data-model.md](./data-model.md#ichapterprogressstore-existente--assetsscriptsmodelbattlerichapterprogressstorecs--cambios-de-firma))
- [x] T012 Actualizar `Assets/Scripts/Gameplay/Battler/LocalChapterProgressStore.cs` para implementar la nueva firma (`bool` = transición false→true; `SaveArcRewardsGranted` nuevo) — depende de T011, [contracts/level-rewards-and-unit-unlocks.md](./contracts/level-rewards-and-unit-unlocks.md)
- [x] T013 Actualizar los **8 dobles de test verificados** que implementan `IChapterProgressStore` a la nueva firma (lista confirmada por búsqueda real tras `/speckit-analyze`, hallazgo C1 — no la estimación original de "specs 001/002/004/006/009/010"): `Assets/Tests/PlayMode/Battler/BattleLoopPlayModeTests.cs` (`NoOpChapterProgressStore`), `BattleProgressIntegrationTests.cs` (`FakeChapterProgressStore`), `MainMenuFlowPlayModeTests.cs` (`FakeChapterProgressStore`), `AdventureMapFlowPlayModeTests.cs` (`FakeChapterProgressStore`), `AdventureMapEnergyFlowPlayModeTests.cs` (`FakeChapterProgressStore`), `TeamFormationBattleIntegrationPlayModeTests.cs` (`FakeChapterProgressStore`), `UnitEvolutionBattleIntegrationPlayModeTests.cs` (`FakeChapterProgressStore`), `Chapter2BattleLoopPlayModeTests.cs` (`NoOpChapterProgressStore`) — depende de T011, migración mecánica sin cambio de comportamiento observable ([save-data-extensions.md](./contracts/save-data-extensions.md))
- [x] T014 [P] Extender `Assets/Scripts/Model/Battler/ProgressSaveData.cs`: añadir campo `arcs: SagaArcProgressRecord[]`; crear `Assets/Scripts/Model/Battler/SagaArcProgressRecord.cs` (`{ string arcId; bool rewardsGranted; }`)
- [x] T015 [P] Extender `Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs`: añadir campo `unlockedBonusUnitIds: string[]`
- [x] T016 [P] **[Nuevo tras `/speckit-analyze`, hallazgo E3 — SC-007]** EditMode test de round-trip de serialización JSON (`JsonUtility.ToJson`/`FromJson`) para `ProgressSaveData.arcs` y `PlayerProgressSaveData.unlockedBonusUnitIds` (confirmar que sobreviven sin pérdida ni duplicación, y que un guardado previo a esta feature sin esos campos sigue cargando con arrays vacíos) en `Assets/Tests/EditMode/Battler/SaveDataNewFieldsRoundTripTests.cs` — depende de T014, T015
- [x] T017 Crear `Assets/Scripts/Model/Battler/SagaArcDefinition.cs` (nuevo `ScriptableObject`: `ArcId`, `DisplayNameKey`, `UnitCostMultiplier`, `EnemyStrengthMultiplier`, `Levels: ChapterDefinition[]`, `BossLevel`, `ArcCompletionUnitUnlocks: UnitDefinition[]`, `ArcCompletionFeatureFlags: string[]`, `IsValid`) ([data-model.md](./data-model.md#sagaarcdefinition-nuevo-scriptableobject))
- [x] T018 Crear `Assets/Scripts/Gameplay/Battler/SagaArcProgressEvaluator.cs` (static class puro: `IsArcCompleted(SagaArcDefinition, ProgressSaveData)`, `HasRewardsGranted(string, ProgressSaveData)`) — depende de T014, T017
- [x] T019 [P] Crear `Assets/Scripts/Model/Battler/UnitUnlockCatalog.cs` + `UnitUnlockEntry` (`{ string UnitId; UnitDefinition Unit; }`, método `Resolve(string unitId)`) ([data-model.md](./data-model.md#unitunlockcatalog-nuevo-scriptableobject))
- [x] T020 [P] Crear `Assets/Scripts/Gameplay/Battler/BattleLaunchContext.cs` (static class: `static bool ZombieOutbreakRequested { get; set; }`)
- [x] T021 [P] **[Nuevo tras `/speckit-analyze`, hallazgo E2 — FR-015/FR-020/SC-008]** Crear `Assets/Scripts/Gameplay/Battler/ZombieOutbreakEligibility.cs` (static class puro: `IsOfferable(ChapterDefinition chapter, ProgressSaveData progress)` — `true` solo si `chapter.ZombieOutbreakWave != null` y el nivel tiene `isCompleted == true` en `progress.chapters`) ([contracts/zombie-outbreak-mode.md](./contracts/zombie-outbreak-mode.md)) — depende de T008, T014

**Checkpoint**: Foundation lista — todas las 8 historias de usuario pueden implementarse (en paralelo si hay capacidad, o en orden de prioridad).

---

## Phase 3: User Story 1 - Dificultad y costo escalan por capítulo (Priority: P1) 🎯 MVP

**Goal**: El mismo gato/enemigo cuesta y golpea distinto según el `SagaArcDefinition` (multiplicador de costo/fuerza enemiga) del capítulo activo.

**Independent Test**: Desplegar el mismo gato y generar el mismo enemigo bajo dos `SagaArcDefinition` con multiplicadores distintos y confirmar que el costo cobrado y las estadísticas de combate del enemigo difieren según el multiplicador activo, sin cambiar los datos base (quickstart.md pasos 1-3).

### Tests for User Story 1

> **NOTA**: Escribir/confirmar estas pruebas antes de dar por completo el contenido de esta fase.

- [x] T022 [P] [US1] EditMode test de redondeo/piso de `UnitCombatProfile.Scaled` en `Assets/Tests/EditMode/Battler/UnitCombatProfileScaledTests.cs` (depende de T006)
- [x] T023 [P] [US1] PlayMode test del multiplicador de costo (`SagaArcDefinition` sintético vía `ScriptableObject.CreateInstance`, sin depender de assets reales; usar $75 como costo base de referencia, consistente con spec.md Historia 1 tras la corrección de `/speckit-analyze` hallazgo A1) en `Assets/Tests/PlayMode/Battler/ArcCostMultiplierPlayModeTests.cs` (depende de T025)
- [x] T024 [P] [US1] PlayMode test del multiplicador de fuerza enemiga (mismo enfoque sintético, comparando `UnitCombatProfile` resultante a `1.0×` y `4.0×`) en `Assets/Tests/PlayMode/Battler/ArcEnemyStrengthMultiplierPlayModeTests.cs` (depende de T010)

### Implementation for User Story 1

- [x] T025 [US1] Extender `Assets/Scripts/Gameplay/Battler/UnitDeploymentController.cs`: parámetro opcional `unitCostMultiplier = 1f` en `Initialize`, aplicado en `TryDeploy` (`Mathf.Max(1, Mathf.RoundToInt(cost * multiplier))`) ([contracts/chapter-arc-multipliers.md](./contracts/chapter-arc-multipliers.md))
- [x] T026 [US1] Extender `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: nuevo campo serializado opcional `m_ActiveArc: SagaArcDefinition`; `SetupChapter()` resuelve `unitCostMultiplier`/`enemyStrengthMultiplier` (`1f` si `m_ActiveArc == null`) y los pasa a `UnitDeploymentController.Initialize` (T025) y `EnemyWaveSpawner.Initialize` (T010) — depende de T010, T017, T025
- [x] T027 [US1] Autoría de `Assets/ScriptableObjects/Battler/EmpireOfCats/Chapter1.asset` (`SagaArcDefinition` "Levantamiento Felino", `UnitCostMultiplier ≈ 0.667`, `EnemyStrengthMultiplier = 1.0`) vía `EmpireOfCatsContentBuilder` — depende de T002, T017
- [x] T028 [US1] Autoría de contenido base de "Corea": `Corea.asset` (`ChapterDefinition`, con costo base de referencia $75 en su unidad jugable, consistente con spec.md tras la corrección de `/speckit-analyze` hallazgo A1), `Corea_EnemyWave.asset`, `UnitDefinition` "Chucho" (enemigo), diálogo pre/post-batalla placeholder, `availableUnits` con ≥1 gato jugable (reutilizar `Unit_Escudero`/similar de `Chapter1/` o crear uno propio) — depende de T002, T008
- [x] T029 [US1] Autoría de contenido base de "Mongolia": `Mongolia.asset` (`ChapterDefinition`), `Mongolia_EnemyWave.asset`, `UnitDefinition` "Serpi" (enemigo, además de "Chucho"), diálogo pre/post-batalla placeholder — depende de T002, T008
- [x] T030 [US1] Ensamblar `Assets/Scenes/Corea_Battle.unity` (mismo cableado que `Chapter1_Battle.unity`: `BattleStateManager` con `m_ChapterDefinition = Corea.asset`, `m_ActiveArc = Chapter1.asset`, `BattleResourceController`, `UnitDeploymentController`, `EnemyWaveSpawner`, `BaseHealth` x2, `DialoguePlaybackController`) — depende de T026, T028
- [x] T031 [US1] Ensamblar `Assets/Scenes/Mongolia_Battle.unity` (mismo cableado, `m_ChapterDefinition = Mongolia.asset`, `m_ActiveArc = Chapter1.asset`) — depende de T026, T029
- [x] T032 [US1] Completar `EmpireOfCatsContentBuilder.Build()`/`ValidateScene()` (menú `The Battler > Validate Empire of Cats Scenes`) generando de forma idempotente T027-T029 y validando 0 referencias nulas en T030/T031 — depende de T002, T027, T028, T029, T030, T031

**Checkpoint**: User Story 1 completamente funcional y probable de forma independiente — 2 escenas jugables base con multiplicadores de capítulo aplicados (arte placeholder aceptable en este punto, igual que `001`).

---

## Phase 4: User Story 2 - Oleada de refuerzo al cruzar un umbral de vida de la base enemiga (Priority: P2)

**Goal**: En "Mongolia", al reducir la vida de la base enemiga al 50%, se dispara automáticamente una oleada de refuerzo de 4 "Serpi".

**Independent Test**: Configurar un `HealthThresholdWaveTrigger` en un `ChapterDefinition` de prueba y confirmar que la oleada de refuerzo se genera exactamente una vez al cruzar el umbral, incluso si dos umbrales se cruzan en el mismo golpe (quickstart.md pasos 4-6).

**Nota de dependencia real**: la lógica de disparo de umbral ya la implementó `EnemyWaveSpawner` en la Fase Foundational (T010, compartida con US3 porque ambas extienden el mismo `Update()`); esta historia añade el dato y la verificación específicos, reutilizando el cableado de `BattleStateManager` ya entregado por US1 (T026) — mismo patrón de solapamiento documentado que `010` (US1/US3 compartiendo `Chapter2.asset`).

### Tests for User Story 2

- [x] T033 [P] [US2] PlayMode test de disparo de umbral (único disparo, no re-disparo, múltiples umbrales cruzados en el mismo frame, **y que `ThresholdWaveTriggered` se invoca exactamente una vez por umbral disparado** — FR-019, añadido tras `/speckit-analyze` hallazgo E1) en `Assets/Tests/PlayMode/Battler/HealthThresholdWaveTriggerTests.cs` (depende de T010)

### Implementation for User Story 2

- [x] T034 [US2] Autoría de `Assets/ScriptableObjects/Battler/EmpireOfCats/Mongolia_ReinforcementWave.asset` (4× "Serpi") y asignación de `Mongolia.asset.HealthThresholdWaveTriggers = [{ 0.5, Mongolia_ReinforcementWave.asset }]` vía `EmpireOfCatsContentBuilder` — depende de T029

**Checkpoint**: User Story 2 funcional sobre la escena de "Mongolia" ya ensamblada por US1.

---

## Phase 5: User Story 3 - Límite de enemigos simultáneos por nivel (Priority: P3)

**Goal**: "Corea" nunca tiene más de 3 "Chucho" vivos a la vez; "Mongolia" nunca más de 4.

**Independent Test**: Configurar `MaxSimultaneousEnemies` en un `ChapterDefinition` de prueba y confirmar que un enemigo programado se retiene hasta que el conteo baje del límite (quickstart.md pasos 7-8).

**Nota de dependencia real**: mismo caso que US2 — el cupo ya lo implementó `EnemyWaveSpawner` en Foundational (T010); esta historia solo añade el dato.

### Tests for User Story 3

- [x] T035 [P] [US3] PlayMode test de cupo simultáneo (retención y liberación al morir un enemigo) en `Assets/Tests/PlayMode/Battler/EnemySimultaneousCapTests.cs` (depende de T010)

### Implementation for User Story 3

- [x] T036 [US3] Asignar `Corea.asset.MaxSimultaneousEnemies = 3` y `Mongolia.asset.MaxSimultaneousEnemies = 4` vía `EmpireOfCatsContentBuilder` — depende de T028, T029

**Checkpoint**: User Story 3 funcional sobre las escenas ya ensambladas por US1.

---

## Phase 6: User Story 4 - Recompensas de victoria y desbloqueo de unidad (Priority: P4)

**Goal**: Ganar "Corea" otorga 1000 XP + tesoro "Kimchi" + desbloqueo de "Gato Defensor" en la primera victoria; ganar "Mongolia" otorga 1300 XP + tesoro "Tienda de campaña".

**Independent Test**: Ganar un nivel de prueba dos veces seguidas y confirmar que XP/tesoro se otorgan ambas veces mientras que el desbloqueo de unidad ocurre solo en la primera (quickstart.md pasos 9-10). Independiente de US1-US3 (no requiere `SagaArcDefinition` ni cupo/umbral configurados).

### Tests for User Story 4

- [x] T037 [P] [US4] PlayMode test del flujo de recompensas (`SaveChapterOutcome` bool, XP/tesoro en cada victoria, desbloqueo de unidad solo en primera) en `Assets/Tests/PlayMode/Battler/LevelRewardFlowPlayModeTests.cs` (depende de T012, T019)

### Implementation for User Story 4

- [x] T038 [US4] Crear `Assets/Scripts/Gameplay/Battler/LevelRewardResult.cs` (clase de datos: XP, `TreasureRewardId`, `UnlockedUnitId` opcional, recompensas de arco opcionales — payload de evento, sin lógica)
- [x] T039 [US4] Extender `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: en `SetOutcome(Victory)`, sumar `ChapterDefinition.XpReward` vía `IPlayerProgressStore`, invocar nuevo `event Action<LevelRewardResult> LevelRewardsGranted`, y — si `firstVictory` (bool de T012) y `FirstClearUnitUnlock != null` — añadir su `UnitId` a `unlockedBonusUnitIds` ([contracts/level-rewards-and-unit-unlocks.md](./contracts/level-rewards-and-unit-unlocks.md)) — depende de T012, T015, T038
- [x] T040 [US4] Extender `Assets/Scripts/Gameplay/Battler/PlayerBaseFlowController.cs`: `OwnedUnits` pasa a la unión de `m_ChapterDefinition.AvailableUnits` con `UnitUnlockCatalog.Resolve(id)` para cada `id` en `unlockedBonusUnitIds` — depende de T015, T019
- [x] T041 [US4] Autoría de `GatoDefensor.asset` (`UnitDefinition`, Principio III: idle + ataque + variante visual obligatorios) en `Assets/ScriptableObjects/Battler/EmpireOfCats/Units/Player/` — depende de T005
- [x] T042 [US4] Asignar en `Corea.asset`: `XpReward = 1000`, `TreasureRewardId = "kimchi"`, `FirstClearUnitUnlock = GatoDefensor.asset` — depende de T028, T041
- [x] T043 [US4] Asignar en `Mongolia.asset`: `XpReward = 1300`, `TreasureRewardId = "tienda_de_campana"` — depende de T029
- [x] T044 [US4] Autoría de `Assets/ScriptableObjects/Battler/EmpireOfCats/UnitUnlockCatalog.asset` con la entrada `{ "gato_defensor", GatoDefensor.asset }` — depende de T019, T041

**Checkpoint**: User Story 4 completamente funcional de forma independiente.

---

## Phase 7: User Story 5 - Cañón especial "Gatorreta" (Priority: P5)

**Goal**: Cañón de recarga lenta en la base del jugador, activable manualmente para daño de área a enemigos en rango.

**Independent Test**: Esperar la recarga, activar manualmente con enemigos dentro/fuera de rango, confirmar daño solo a los que están en rango y reinicio de recarga; confirmar no-op mientras recarga (quickstart.md pasos 11-13). Completamente independiente de US1-US4.

### Tests for User Story 5

- [x] T045 [P] [US5] PlayMode test de `GatorretaController` (disponibilidad, daño de área solo en rango, no-op en recarga) en `Assets/Tests/PlayMode/Battler/GatorretaControllerTests.cs`

### Implementation for User Story 5

- [x] T046 [US5] Crear `Assets/Scripts/Gameplay/Battler/GatorretaController.cs` (`m_RechargeSeconds`, `m_Range`, `m_AreaDamage`, `m_PlayerBase`, `IsAvailable`, `event Action Available`, `TryActivate()`, `ResetRecharge()`) reutilizando `LaneRegistry.FindAllTargetsInRange` ([contracts/gatorreta-and-resource-upgrade.md](./contracts/gatorreta-and-resource-upgrade.md))
- [x] T047 [US5] Extender `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: `RetryBattle()` llama a `m_Gatorreta.ResetRecharge()` — depende de T046
- [x] T048 [US5] Añadir `GatorretaController` al GameObject de la base del jugador en `Corea_Battle.unity` y `Mongolia_Battle.unity` — depende de T046, T030, T031

**Checkpoint**: User Story 5 completamente funcional de forma independiente.

---

## Phase 8: User Story 6 - Mejora de velocidad de regeneración de dinero durante la batalla (Priority: P6)

**Goal**: Gastar dinero acumulado para aumentar la tasa de regeneración de dinero por el resto de la batalla.

**Independent Test**: Con fondos suficientes, activar la mejora y confirmar el aumento inmediato; con fondos insuficientes, confirmar que no tiene efecto (quickstart.md pasos 14-15). Completamente independiente de las demás historias.

### Tests for User Story 6

- [x] T049 [P] [US6] EditMode/PlayMode test de `BattleResourceController.TryUpgradeRegen` (éxito, fondos insuficientes, reset en reintento no conserva la mejora) en `Assets/Tests/PlayMode/Battler/ResourceRegenUpgradeTests.cs`

### Implementation for User Story 6

- [x] T050 [US6] Extender `Assets/Scripts/Gameplay/Battler/BattleResourceController.cs`: `TryUpgradeRegen(float cost, float regenIncrease)`, captura de `m_DesignRegenPerSecond` en `Awake()`, `ResetResource()` restaura `m_RegenPerSecond` al valor de diseño ([contracts/gatorreta-and-resource-upgrade.md](./contracts/gatorreta-and-resource-upgrade.md))

**Checkpoint**: User Story 6 completamente funcional de forma independiente.

---

## Phase 9: User Story 7 - Brote Zombi en niveles ya superados (Priority: P7)

**Goal**: Rejugar "Corea"/"Mongolia" ya superados con enemigos reemplazados por variantes zombi, sin el jefe estándar.

**Independent Test**: Con un nivel de prueba ya superado y un `ZombieOutbreakWave` configurado, activar el modificador y confirmar que solo aparecen enemigos zombi; confirmar que la opción no aparece en un nivel no superado (quickstart.md pasos 16-18). Depende de que "Corea"/"Mongolia" existan (US1) pero no de US2-US6.

### Tests for User Story 7

- [x] T051 [P] [US7] PlayMode test de selección de oleada Brote Zombi vía `BattleLaunchContext` (elenco 100% zombi, reset del flag tras consumirlo), de `ZombieOutbreakEligibility.IsOfferable` (nivel superado + roster configurado ⇒ ofrecible; cualquiera de los dos ausente ⇒ no ofrecible), **y un caso sintético de supresión de jefe** (una `EnemyWaveDefinition` estándar con una entrada de "jefe" + una `ZombieOutbreakWave` sintética sin esa entrada, confirmando que el jefe nunca aparece — necesario porque ni "Corea" ni "Mongolia" tienen un jefe real que excluir, `/speckit-analyze` hallazgo E5) en `Assets/Tests/PlayMode/Battler/ZombieOutbreakModeTests.cs` (depende de T020, T021)

### Implementation for User Story 7

- [x] T052 [US7] Extender `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: `SetupChapter()` consulta `BattleLaunchContext.ZombieOutbreakRequested`, resetea el flag, y elige `ChapterDefinition.ZombieOutbreakWave` en vez de `EnemyWaves` si aplica ([contracts/zombie-outbreak-mode.md](./contracts/zombie-outbreak-mode.md)) — depende de T020, T026
- [x] T053 [US7] Autoría de `Corea_ZombieWave.asset` + `UnitDefinition` "Chucho Z."; asignar `Corea.asset.ZombieOutbreakWave` — depende de T028
- [x] T054 [US7] Autoría de `Mongolia_ZombieWave.asset` + `UnitDefinition` "Zerpi"/"Kodrizzz"; asignar `Mongolia.asset.ZombieOutbreakWave` — depende de T029

**Checkpoint**: User Story 7 funcional sobre el contenido base de US1.

---

## Phase 10: User Story 8 - Desbloqueos al completar un capítulo (Priority: P8)

**Goal**: Completar el arco de Capítulo 1 otorga sus recompensas de finalización; completar el arco designado como "segundo capítulo" eleva el nivel máximo de mejora de unidades a 20.

**Independent Test**: Marcar todos los niveles de un `SagaArcDefinition` de prueba como superados salvo uno, ganar el último y confirmar que las recompensas de arco se otorgan exactamente una vez (quickstart.md pasos 19-21). **Depende de US1** (necesita `SagaArcDefinition` para existir) **y de US4** (extiende el mismo flujo de `SetOutcome` que otorga recompensas de nivel) — única historia con dependencias reales sobre otras, documentadas explícitamente en spec.md Historia 8.

### Tests for User Story 8

- [x] T055 [P] [US8] EditMode test de `SagaArcProgressEvaluator.IsArcCompleted`/`HasRewardsGranted` en `Assets/Tests/EditMode/Battler/SagaArcProgressEvaluatorTests.cs` (depende de T018)
- [x] T056 [P] [US8] PlayMode test del flujo completo de recompensas de arco (otorgadas una única vez, no re-otorgadas al rejugar) en `Assets/Tests/PlayMode/Battler/ArcCompletionRewardFlowTests.cs` (depende de T058)
- [x] T057 [P] [US8] EditMode/PlayMode test de la selección de `UnitLevelingConfig` según finalización de arco en `Assets/Tests/PlayMode/Battler/UnitLevelingCapUnlockTests.cs` (depende de T059)

### Implementation for User Story 8

- [x] T058 [US8] Extender `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: en `SetOutcome(Victory)`, tras T039, evaluar `SagaArcProgressEvaluator` sobre `m_ActiveArc` y, si corresponde, otorgar `ArcCompletionUnitUnlocks`/`ArcCompletionFeatureFlags` y llamar `IChapterProgressStore.SaveArcRewardsGranted` ([contracts/level-rewards-and-unit-unlocks.md](./contracts/level-rewards-and-unit-unlocks.md)) — depende de T018, T039
- [x] T059 [US8] Extender `Assets/Scripts/Gameplay/Battler/PlayerBaseFlowController.cs`: nuevos campos `m_ExpandedLevelingConfig`, referencia al arco cuya finalización eleva el tope, nueva dependencia `IChapterProgressStore`; `Awake()` elige config base o expandida según `SagaArcProgressEvaluator.IsArcCompleted`. **Para esta feature, asignar esa referencia a `Chapter1.asset` (T027) como placeholder documentado** (comentario `// TODO: reapuntar a la SagaArcDefinition real del Capítulo 2 cuando se autore`), de forma que FR-018 quede demostrado con contenido real y no solo con el doble sintético de T057 (`/speckit-analyze` hallazgo E4) — depende de T018, T027
- [x] T060 [US8] Autoría de `Assets/ScriptableObjects/Battler/EmpireOfCats/ExpandedUnitLevelingConfig.asset` (`MaxLevel = 20`, `ExperienceCostPerLevel.Length = 19`) — puro dato, sin cambio de clase
- [x] T061 [US8] Asignar en `Chapter1.asset` (`SagaArcDefinition`): `ArcCompletionFeatureFlags = ["hacia_el_futuro_entry","legend_stages","cat_combos","sharpened_claws_dojo","ototo_equipment"]`, `ArcCompletionUnitUnlocks = []` (vacío — Moneko y el resto de contenido de recompensa de arco quedan fuera de alcance de esta feature, plan.md Scale/Scope). **`BossLevel` se deja sin asignar (`null`) en este vertical slice**: ni "Corea" ni "Mongolia" autoran un enemigo jefe distinguible, así que marcar cualquiera de los dos como jefe sería una etiqueta sin contenido real detrás (`/speckit-analyze` hallazgo E5) — se asignará cuando el nivel de jefe real del Capítulo 1 completo se autore — depende de T027

**Checkpoint**: Las 8 historias de usuario funcionan juntas — vertical slice completo de la saga "Imperio de los Gatos" sobre "Corea"/"Mongolia".

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Verificación final y ajustes que afectan a toda la feature.

- [x] T062 [P] Correr la suite completa EditMode + PlayMode (`001`-`013`) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde, incluyendo T013 (los 8 dobles de `IChapterProgressStore` migrados) y T016 (round-trip de guardado)
- [ ] T063 Ejecutar los pasos 1-21 de [quickstart.md](./quickstart.md) contra `Corea_Battle.unity`/`Mongolia_Battle.unity` reales y confirmar el resultado esperado
- [x] T064 [P] Insertar los banners de "Corea"/"Mongolia" en `Assets/Data/Battler/MainAdventureMap.asset` (`Banners[]`) **antes** del banner ya existente de "Hacia el Futuro" — cambio de datos únicamente, sin tocar `ChapterBannerUnlockEvaluator.cs`/`AdventureMap.cs` (research.md §6) — depende de T030, T031
- [x] T065 Revisar que la implementación final no se haya desviado de [data-model.md](./data-model.md)/[contracts/](./contracts/); actualizar esos documentos si hubo un cambio deliberado durante la implementación (p. ej. valores de balance concretos elegidos para T028/T029/T042-T044)
- [x] T066 [P] Validación manual del Principio III sobre "Gato Defensor" (único caso al que el principio literalmente aplica — "personaje jugable"; los enemigos "Chucho"/"Serpi" y sus variantes zombi quedan fuera de este gate por precedente de `010`, `/speckit-analyze` hallazgo D1, aunque su calidad visual puede revisarse igualmente como criterio de contenido, no de constitución) — depende de T041

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — **BLOQUEA** las 8 historias de usuario (a diferencia de `010`, aquí Foundational es código de producción compartido, no solo validadores)
- **Historias de usuario (Fase 3-10)**: todas dependen de Foundational. US1-US7 son mutuamente independientes salvo el solapamiento de archivo documentado abajo; **US8 depende de US1 (T017/T027) y de US4 (T039)**
- **Polish (Fase 11)**: depende de las historias que se quieran entregar

### User Story Dependencies

- **US1 (P1, MVP)**: tras Foundational — sin dependencia de otras historias. Entrega las 2 escenas base que US2-US7 reutilizan.
- **US2 (P2)**: tras Foundational; reutiliza la lógica de `EnemyWaveSpawner` (Foundational T010) y el cableado de `BattleStateManager` (US1 T026) — en la práctica se completa junto con US1, mismo criterio que `010` documentó para su US1/US3.
- **US3 (P3)**: mismo caso que US2 — reutiliza T010/T026.
- **US4 (P4)**: tras Foundational — independiente de US1-US3 (no requiere `SagaArcDefinition` ni cupo/umbral).
- **US5 (P5)**: tras Foundational — completamente independiente.
- **US6 (P6)**: tras Foundational — completamente independiente.
- **US7 (P7)**: tras Foundational y tras US1 (necesita `Corea.asset`/`Mongolia.asset` para asignarles `ZombieOutbreakWave`) — independiente de US2-US6.
- **US8 (P8)**: tras Foundational, **tras US1** (T017/T027, necesita `SagaArcDefinition` real) y **tras US4** (T039, extiende el mismo flujo de recompensas) — única historia con dependencias funcionales reales sobre otras, documentado también en spec.md Historia 8.

### Parallel Opportunities

- T002 (Fase 1) en paralelo con T001
- T003, T004, T006, T009 (Fase 2) en paralelo — archivos distintos, sin dependencias entre sí
- T014, T015, T019, T020 (Fase 2) en paralelo — archivos distintos
- T016 en paralelo con T017-T021 una vez T014/T015 existen — archivo de test distinto
- T021 en paralelo con T017-T020 una vez T008/T014 existen — archivo distinto
- T022, T023, T024 (tests US1) en paralelo — archivos distintos
- T028, T029 (contenido base de Corea/Mongolia, US1) en paralelo — carpetas/archivos distintos
- Una vez completada Foundational, US4, US5, US6 pueden trabajarse en paralelo entre sí y en paralelo con US1 (sin compartir archivos de producción, salvo `BattleStateManager.cs` — ver nota abajo)

**Nota sobre `BattleStateManager.cs`**: T026 (US1), T039 (US4), T047 (US5), T052 (US7) y T058 (US8) editan el mismo archivo (métodos distintos: `SetupChapter()`/`RetryBattle()`/`SetOutcome()`). No son tareas `[P]` entre sí — deben aplicarse secuencialmente (aunque las historias que representan sean conceptualmente independientes y probables por separado con dobles en memoria), igual que `010` documentó para `Chapter2.asset` compartido entre US1/US3.

---

## Parallel Example: Foundational

```bash
# Lanzar juntos los tipos nuevos sin dependencias cruzadas:
Task: "Crear UnitRarity en Assets/Scripts/Core/Battler/UnitRarity.cs"
Task: "Crear HealthThresholdWaveTrigger en Assets/Scripts/Model/Battler/HealthThresholdWaveTrigger.cs"
Task: "Extender UnitCombatProfile.cs con Scaled(...)"
Task: "Extender LaneRegistry.cs con CountAlive(Team)"
```

## Parallel Example: User Story 1

```bash
# Lanzar juntas las pruebas de US1 (archivos distintos):
Task: "EditMode test de UnitCombatProfile.Scaled"
Task: "PlayMode test del multiplicador de costo"
Task: "PlayMode test del multiplicador de fuerza enemiga"

# Lanzar juntos el contenido base de Corea y Mongolia (carpetas distintas):
Task: "Autoría de contenido base de Corea"
Task: "Autoría de contenido base de Mongolia"
```

---

## Implementation Strategy

### MVP First (User Story 1 únicamente)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (CRÍTICO — bloquea las 8 historias)
3. Completar Fase 3: User Story 1
4. **DETENERSE Y VALIDAR**: quickstart.md pasos 1-3, dos escenas jugables con multiplicadores de capítulo aplicados
5. Esto ya demuestra la mecánica estructural que distingue a los capítulos entre sí (spec.md, "Why this priority" de Historia 1)

### Incremental Delivery

1. Setup + Foundational → infraestructura compartida lista
2. + US1 → MVP: 2 niveles jugables con multiplicadores de capítulo (deploy/demo)
3. + US2, US3 → dificultad dinámica (oleada por umbral, cupo simultáneo) sobre los mismos niveles
4. + US4 → recompensas y progresión de desbloqueo de unidad
5. + US5, US6 → profundidad de combate/economía en batalla (Gatorreta, mejora de regen)
6. + US7 → contenido rejugable (Brote Zombi)
7. + US8 → cierre de arco (recompensas de capítulo, tope de mejora de unidades) — última por depender de US1+US4
8. + Polish → verificación end-to-end vía quickstart.md, integración de datos con el mapa de aventuras (`004`)

### Parallel Team Strategy

Con varios desarrolladores, tras completar Foundational: Desarrollador A → US1 (y luego US2/US3, que reutilizan su cableado); Desarrollador B → US4; Desarrollador C → US5 + US6; Desarrollador D → US7 (tras que US1 entregue `Corea.asset`/`Mongolia.asset`). US8 se asigna al final, tras converger US1 y US4 (coordinar ediciones a `BattleStateManager.cs`, ver nota de Parallel Opportunities).

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes entre sí
- A diferencia de `010` (0 archivos `.cs` nuevos), esta feature extiende 7 clases existentes y añade 9 tipos/clases nuevos — ver plan.md Constitution Check y Complexity Tracking para la única desviación deliberada (`IChapterProgressStore.SaveChapterOutcome` de `void` a `bool`)
- US2, US3 y (parcialmente) US7 reutilizan cableado de código ya entregado por US1 sobre los mismos archivos (`EnemyWaveSpawner.cs` en Foundational, `BattleStateManager.cs` en US1) — documentado explícitamente arriba, mismo criterio que `010` usó para su propio solapamiento US1/US3
- US8 es la única historia con dependencia funcional real sobre otras (US1, US4) — consistente con spec.md, que la describe como "la de mayor alcance... depende de que los tres capítulos existan... y de que el guardado de progreso registre victorias por nivel"
- El contenido real autorado se limita a "Corea"/"Mongolia" + 1 unidad de recompensa ("Gato Defensor"); la población completa de los 144 niveles y la mecánica interna de los feature-flags de fin de capítulo (Cat Combos, Dojo, Ototo, Sistema de Frutas) quedan fuera de esta feature (spec.md Assumptions, plan.md Scale/Scope)
- **Correcciones de `/speckit-analyze` incorporadas en esta versión**: A1 (números de spec.md corregidos, $75→$50/$100), F1 (FR-016 reformulado como capacidad en vez de almacenamiento literal), E1 (evento `ThresholdWaveTriggered`, T010/T033), E2 (`ZombieOutbreakEligibility`, T021/T051, FR-020/SC-008 nuevos), E3 (test de round-trip de guardado, T016), E4 (placeholder documentado para el arco de "segundo capítulo", T059), E5 (`BossLevel` sin asignar + caso sintético de supresión de jefe, T051/T061), C1 (lista verificada de 8 dobles de `IChapterProgressStore`, T013), D1 (Principio III acotado a "Gato Defensor", T066), F2 (conteos corregidos en plan.md)
- Evitar: tareas vagas, conflictos de mismo archivo entre tareas marcadas `[P]`, dependencias cruzadas entre historias que rompan su independencia salvo las ya documentadas arriba
