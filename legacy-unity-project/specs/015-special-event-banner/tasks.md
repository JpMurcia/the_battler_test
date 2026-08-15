---

description: "Task list template for feature implementation"
---

# Tasks: Banner Especial de Eventos: "Etapas de Fantasía"

**Input**: Design documents from `/specs/015-special-event-banner/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/event-banner-activation.md](./contracts/event-banner-activation.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en `001`-`014`.

**Organization**: Tareas agrupadas por historia de usuario (US1-US4, según spec.md) para permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Model,Gameplay,View}/Battler/`, herramientas de contenido en `Assets/Editor/Battler/`, datos en `Assets/ScriptableObjects/Battler/Events/`, escenas en `Assets/Scenes/`, tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

**Dependencias de otras features (todas ya implementadas en el repo, verificado en research.md)**: `AdventureMap.cs`/`ChapterBannerDefinition.cs`/`AdventureMapFlowController.cs`/`AdventureMapUIController.cs`/`ChapterBannerItemView.cs` (004), `MissionEnergyController.cs`/`MissionEnergyConfig.cs`/`Region.cs` (006), `BattleStateManager.cs`/`BattleLaunchContext.cs`/`PlayerProgressSaveData.cs`/`SagaArcDefinition.cs` (013), `ChapterDefinition.LevelWidth` (014), y los 5 `UnitDefinition`/1 `EnemyWaveDefinition`/2 `DialogueLine`/prefabs de `001-chapter1-vertical-slice`.

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [ ] T001 Correr la suite EditMode + PlayMode existente (`001`-`014`) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde (0 errores de compilación, todos los tests en verde) antes de empezar; confirmar que `Assets/Scripts/Model/Battler/AdventureMap.cs`, `Assets/Scripts/Gameplay/Battler/AdventureMapFlowController.cs`/`BattleStateManager.cs`, y `Assets/ScriptableObjects/Battler/Chapter1/{Units/**,EnemyWave.asset}` ya existen (todas las dependencias de esta feature)

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos de datos y evaluador de activación puro compartidos por las 4 historias de usuario. Ninguna historia puede implementarse ni probarse sin esto.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [ ] T002 [P] Crear `EventTimeWindow` (`[Serializable]`, no `ScriptableObject`: `m_StartLocal`/`m_EndLocal` como `string` en formato `"yyyy-MM-dd HH:mm:ss"`; `bool TryGetRange(out DateTime start, out DateTime end)`; `bool Contains(DateTime now)`; `bool IsValid`) en `Assets/Scripts/Model/Battler/EventTimeWindow.cs`, según [data-model.md § EventTimeWindow](./data-model.md#eventtimewindow-nuevo-serializable--no-scriptableobject-campo-embebido) y [contracts/event-banner-activation.md](./contracts/event-banner-activation.md)
- [ ] T003 [P] EditMode tests en `Assets/Tests/EditMode/Battler/EventTimeWindowTests.cs` (archivo nuevo): `Contains` con `now` dentro/fuera del rango, en cada límite (inclusive); fechas malformadas ⇒ `false` sin lanzar; `start > end` ⇒ `false` siempre; `IsValid` refleja lo mismo — depende de T002
- [ ] T004 Crear `EventBannerDefinition` (`ScriptableObject`: `m_Banner` de tipo `ChapterBannerDefinition`, `m_TimeWindows` de tipo `EventTimeWindow[]`; `HasPlayableDestination`; `IsValid`) en `Assets/Scripts/Model/Battler/EventBannerDefinition.cs`, según [data-model.md § EventBannerDefinition](./data-model.md#eventbannerdefinition-nuevo-scriptableobject-assetsscriptsmodelbattlereventbannerdefinitioncs) — depende de T002
- [ ] T005 [P] EditMode tests en `Assets/Tests/EditMode/Battler/EventBannerDefinitionValidationTests.cs` (archivo nuevo): `IsValid` con `m_Banner == null` ⇒ `false`; `m_Banner` inválido ⇒ `false`; `m_TimeWindows` null/vacío ⇒ `false`; alguna `EventTimeWindow` inválida ⇒ `false`; todo válido ⇒ `true` — depende de T004
- [ ] T006 [P] Crear `EventBannerState` (clase plana runtime, no serializada: `bannerIndex`, `isActive`, `isSelectable`) en `Assets/Scripts/Model/Battler/EventBannerState.cs`, según [data-model.md § EventBannerState](./data-model.md#eventbannerstate-nuevo-clase-plana-runtime--mismo-criterio-que-chapterbannerstate-no-se-serializapersiste)
- [ ] T007 Extender `AdventureMap` con el campo aditivo `m_EventBanners: EventBannerDefinition[]` (sin `FormerlySerializedAs`, sin cambiar `IsValid` existente) y la propiedad `EventBanners` en `Assets/Scripts/Model/Battler/AdventureMap.cs`, según [data-model.md § AdventureMap](./data-model.md#adventuremap-extendido-assetsscriptsmodelbattleradventuremapcs) — depende de T004; **bloquea toda tarea que lea `AdventureMap.EventBanners`**
- [ ] T008 Crear `EventBannerActivationEvaluator.Evaluate(EventBannerDefinition[] eventBanners, DateTime now) : EventBannerState[]` (función estática pura, sin dependencias de motor) en `Assets/Scripts/Gameplay/Battler/EventBannerActivationEvaluator.cs`, según [contracts/event-banner-activation.md](./contracts/event-banner-activation.md) — depende de T004, T006
- [ ] T009 [P] EditMode tests en `Assets/Tests/EditMode/Battler/EventBannerActivationEvaluatorTests.cs` (archivo nuevo): una ventana activa ⇒ `isActive/isSelectable == true`; ventana fuera de rango ⇒ `false`; sin `TimeWindows` ⇒ `false`; dos ventanas no solapadas (una activa, otra no) ⇒ `true` (FR-009); dos ventanas solapadas cubriendo `now` ⇒ `true`, sin caso especial (FR-010); `eventBanners == null` ⇒ array vacío sin lanzar; elemento `null` dentro del array ⇒ tratado como inactivo sin lanzar; banner activo pero `HasPlayableDestination == false` ⇒ `isActive == true`, `isSelectable == false` — depende de T008

**Checkpoint**: Tipos de datos y evaluador de activación listos — las 4 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Ver el banner de evento solo durante su ventana activa (Priority: P1) 🎯 MVP

**Goal**: El banner "Etapas de Fantasía" aparece seleccionable en el mapa únicamente cuando la hora del dispositivo cae dentro de alguna de sus ventanas horarias programadas.

**Independent Test**: Configurar una ventana horaria de prueba, comprobar que el banner es visible y seleccionable dentro de esa ventana, y que no lo es (o aparece inactivo) fuera de ella (spec.md US1).

### Tests for User Story 1 ⚠️

> Estos tests deben escribirse primero y fallar antes de las tareas de implementación de esta fase.

- [ ] T010 [P] [US1] PlayMode test en `Assets/Tests/PlayMode/Battler/AdventureMapEventBannerSelectionPlayModeTests.cs` (archivo nuevo): con un `AdventureMap` de prueba (`ScriptableObject.CreateInstance`) cuyo único `EventBannerDefinition` tiene una `EventTimeWindow` que cubre `DateTime.Now` al momento del test (offset `±1h`), `AdventureMapFlowController.EventBannerStates[0].isActive/isSelectable == true` tras `Awake()`; con una ventana que NO cubre `now` (ej. hace 2 días), ambos valen `false` — sin control de reloj inyectado, ventanas construidas relativas a `DateTime.Now` real del entorno de test (mismo criterio de "sin `ISystemClock`" que `MissionEnergyController`)
- [ ] T011 [P] [US1] PlayMode test en el mismo archivo que T010 (secuencial): con el banner de evento inactivo, `TrySelectEventBanner(0)` devuelve `false`, `FakeSceneNavigator` no recibe ninguna llamada, y ningún costo de energía se descuenta (comparar `CurrentEnergy` antes/después); con el banner activo pero energía insuficiente, igual resultado; con el banner activo y energía suficiente, devuelve `true`, navega exactamente una vez a `eventBanner.Banner.TargetSceneName`, y descuenta exactamente `EnergyCost`

### Implementation for User Story 1

- [ ] T012 [US1] Extender `AdventureMapFlowController.Awake()` en `Assets/Scripts/Gameplay/Battler/AdventureMapFlowController.cs`: calcular `EventBannerStates` (propiedad nueva) vía `EventBannerActivationEvaluator.Evaluate(m_AdventureMap.EventBanners, DateTime.Now)`, recalculado en cada `Awake()` (cada entrada a la escena), mismo criterio que `BannerStates` (004) — depende de T007, T008 (hace pasar T010)
- [ ] T013 [US1] Implementar `AdventureMapFlowController.TrySelectEventBanner(int eventBannerIndex) : bool` (mismo archivo que T012): `false` sin efectos si índice fuera de rango o `EventBannerStates[i].isSelectable == false`; si `isSelectable`, intenta `MissionEnergy.TryEnterMission(m_AdventureMap.EventBanners[i].Banner.EnergyCost)` (mismo `MissionEnergyController` que `TrySelectBanner`, un único pool de energía); si hay energía suficiente, `m_SceneNavigator.LoadScene(m_AdventureMap.EventBanners[i].Banner.TargetSceneName)` y devuelve `true`; no toca `Banners`/`BannerStates` — según [contracts/event-banner-activation.md](./contracts/event-banner-activation.md) (hace pasar T011) — depende de T012
- [ ] T014 [P] [US1] Crear `EventBannerItemView` (componente View: `m_NameLabel`, `m_SelectButton`, `m_BackgroundImage`, sin indicadores de bloqueado/completado) en `Assets/Scripts/View/Battler/EventBannerItemView.cs`, mismo patrón que `ChapterBannerItemView` (004) pero `Initialize(AdventureMapFlowController, int eventBannerIndex, ChapterBannerDefinition banner, EventBannerState state, LocalizedTextTable, SupportedLanguage)` y `OnSelectClicked` llama `flowController.TrySelectEventBanner(eventBannerIndex)` — depende de T013
- [ ] T015 [US1] Extender `AdventureMapUIController.Populate()` en `Assets/Scripts/View/Battler/AdventureMapUIController.cs`: campos nuevos `m_EventItemTemplate` (`EventBannerItemView`) y `m_EventContentRoot` (`RectTransform`, puede ser el mismo `m_ContentRoot`); segunda pasada sobre `adventureMap.EventBanners`/`flowController.EventBannerStates` que instancia un `EventBannerItemView` únicamente cuando `state.isActive == true` (FR-003: ocultar en vez de mostrar inactivo — banner de evento sin ventana activa nunca aparece en el `Content`) — depende de T014
- [ ] T016 [US1] Crear `EventBannerContentBuilder.BuildEventBannerData()` (Editor, `Assets/Editor/Battler/EventBannerContentBuilder.cs`, mismo patrón que `AdventureMapContentBuilder`/`MissionEnergyContentBuilder`): crea carpeta `Assets/ScriptableObjects/Battler/Events/`, `Banner_FantasyStages.asset` (`ChapterBannerDefinition`: `DisplayNameKey = "banner.fantasy-stages.name"`, `BannerArt` de `BattlerArtLibrary`, `EnergyCost` inicial, `LinkedChapter`/`TargetSceneName` vacíos por ahora — se enlazan en US2), `FantasyStagesEventBanner.asset` (`EventBannerDefinition` referenciando ese banner + una `EventTimeWindow` amplia de prueba para QA inmediata), añade la entrada de localización `"banner.fantasy-stages.name"` a `MainLocalizedText.asset`, asigna `AdventureMap.asset.EventBanners = [FantasyStagesEventBanner]`; abre `Assets/Scenes/AdventureMap.unity` (ya creada por 004/006) y añade el `EventBannerItemView` template (mismo layout base que `BuildItemTemplate` de 004, sin indicadores de bloqueado/completado) cableando `AdventureMapUIController.m_EventItemTemplate`/`m_EventContentRoot`; expone `[MenuItem("The Battler/Build Special Event Banner Content")]`
- [ ] T017 [US1] Añadir `EventBannerContentBuilder.ValidateScene()` (mismo archivo que T016) — `[MenuItem("The Battler/Validate Special Event Banner Content")]`: confirma que `FantasyStagesEventBanner.asset`/`Banner_FantasyStages.asset` son válidos (`IsValid`), que `AdventureMap.asset.EventBanners` los referencia, y que `AdventureMapUIController`/`AdventureMapFlowController` en `AdventureMap.unity` tienen las referencias nuevas no nulas — depende de T016

**Checkpoint**: US1 completa y verificable de forma independiente — el banner aparece/desaparece según la ventana horaria configurada (`Banner_FantasyStages` aún sin destino jugable real, igual que "Hacia el Futuro" en 004 antes de 010).

---

## Phase 4: User Story 2 - Jugar la fase especial temática dentro de la ventana activa (Priority: P1)

**Goal**: Seleccionar el banner de evento activo lleva a una batalla real ("matanza de mastodontes") con su propia dificultad, independiente del progreso de capítulos, que otorga recompensas al completarse.

**Independent Test**: Con el evento activo, seleccionar el banner y confirmar que el jugador entra a una batalla con la dificultad y el set de enemigos definidos para la fase especial, obteniendo las recompensas configuradas al completarla (spec.md US2).

### Tests for User Story 2 ⚠️

- [ ] T018 [P] [US2] PlayMode test en `Assets/Tests/PlayMode/Battler/SpecialEventBattleResolutionPlayModeTests.cs` (archivo nuevo): con `BattleStateManager` configurado con la `ChapterDefinition` de la fase especial (dobles de `IChapterProgressStore`/`IPlayerProgressStore` inyectados), `SetupChapter()` no lanza y usa `PlayerBaseMaxHealth`/`EnemyBaseMaxHealth` propios de esa `ChapterDefinition` (sin ningún `SagaArcDefinition` activo, multiplicadores en `1x` — research.md §4); al ganar la batalla, `LevelRewardsGranted` se dispara con el `XpReward`/`TreasureRewardId` configurados y `IPlayerProgressStore.Save` recibe `availableExperience` incrementado y `obtainedTreasureIds` conteniendo el tesoro del evento

### Implementation for User Story 2

- [ ] T019 [US2] Autorar el contenido de la fase especial vía `EventBannerContentBuilder.BuildSpecialStageContent()` (mismo archivo que T016): crea `Assets/ScriptableObjects/Battler/Events/MastodonHuntStage/Dialogue/{PreBattle,PostBattle}/{Line01,Line02}.asset` (4 `DialogueLine` temáticas de "matanza de mastodontes" — 2 pre-batalla y 2 post-batalla, research.md §5; **ambos obligatorios por Principio I de la constitución**, no solo el pre-batalla) y `MastodonHuntStage.asset` (`ChapterDefinition`: `ChapterId = "event_fantasy_stages_mastodon_hunt"`, `PreBattleDialogue`/`PostBattleDialogue` = las líneas nuevas correspondientes, `AvailableUnits` = las 5 `UnitDefinition` de `Assets/ScriptableObjects/Battler/Chapter1/Units/Player/*` (reutilizadas por referencia, sin duplicar — research.md §5), `EnemyWaves` = `Assets/ScriptableObjects/Battler/Chapter1/EnemyWave.asset` (reutilizada), `PlayerBaseMaxHealth`/`EnemyBaseMaxHealth` más exigentes que `Chapter1.asset` (dificultad propia, research.md §4), `TreasureRewardId`/`XpReward` propios, `LevelWidth` propio) — depende de T016
- [ ] T020 [US2] Construir la escena `Assets/Scenes/SpecialEventMastodonHunt_Battle.unity` vía `EventBannerContentBuilder.BuildSpecialStageScene()` (mismo archivo): mismo wiring que `Chapter1ContentBuilder`/`Chapter2ContentBuilder.BuildScene` (instancia `PlayerBasePrefab`/`EnemyBasePrefab`/`UnitRuntime` ya existentes en `Assets/Prefabs/Battler/`, `BattleResourceController`, `UnitDeploymentController`, `EnemyWaveSpawner`, `BattleStateManager` con `m_ChapterDefinition = MastodonHuntStage.asset`, `m_ActiveArc = null`, UI de despliegue + HUD), registra la escena en `EditorBuildSettings.scenes` — depende de T019
- [ ] T021 [US2] Enlazar contenido (dentro de `EventBannerContentBuilder.Build()`, orquestando T016/T019/T020 en orden): `Banner_FantasyStages.asset.LinkedChapter = MastodonHuntStage.asset`, `TargetSceneName = "SpecialEventMastodonHunt_Battle"` — depende de T019, T020
- [ ] T022 [US2] Extender `EventBannerContentBuilder.ValidateScene()` (T017, mismo archivo): confirmar `Banner_FantasyStages.HasPlayableDestination == true`, `MastodonHuntStage.asset` referenciado y con `AvailableUnits`/`EnemyWaves` no nulos, y que `SpecialEventMastodonHunt_Battle.unity` está registrada en `EditorBuildSettings.scenes` — depende de T021

**Checkpoint**: US1 y US2 funcionan juntas — el banner activo lleva a una batalla real, jugable de punta a punta, con recompensas propias.

---

## Phase 5: User Story 3 - Una batalla en curso no se interrumpe cuando la ventana del evento cierra (Priority: P2)

**Goal**: Un jugador que ya entró a la fase especial mientras el evento estaba activo puede terminarla con normalidad aunque la ventana horaria expire mientras juega.

**Independent Test**: Entrar a la fase especial justo antes de que termine la ventana horaria, dejar que expire mientras la batalla está en curso, y confirmar que la batalla continúa hasta su resolución normal (spec.md US3).

### Tests for User Story 3 ⚠️

- [ ] T023 [P] [US3] PlayMode test en `Assets/Tests/PlayMode/Battler/EventWindowExpiryDuringBattlePlayModeTests.cs` (archivo nuevo): con el banner de evento activo, llamar `TrySelectEventBanner` (o instanciar `BattleStateManager` directamente con `MastodonHuntStage.asset`, equivalente); mutar la `EventTimeWindow` del `EventBannerDefinition` en memoria para que ya haya expirado; completar la batalla ya en curso (`SetOutcome(Victory)`) y confirmar que se resuelve con normalidad (sin excepción, sin resultado alterado) y que las recompensas se otorgan igual que en T018 — confirma research.md §3: `BattleStateManager` no tiene ninguna referencia a `EventBannerDefinition`/`EventTimeWindow`, por lo que no hay ningún punto donde la expiración pueda interrumpirla

### Implementation for User Story 3

- [ ] T024 [US3] Verificación de diseño (no se espera código nuevo — research.md §3): confirmar que `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` no referencia `EventBannerDefinition`/`EventTimeWindow`/`AdventureMap` tras T012-T022; si T023 revela alguna dependencia accidental, corregirla eliminándola de `BattleStateManager.cs` (nunca añadiendo una comprobación de ventana horaria ahí) — depende de T023

**Checkpoint**: US1, US2 y US3 funcionan juntas — ninguna batalla del evento se interrumpe por el reloj.

---

## Phase 6: User Story 4 - El evento se repite en ventanas horarias futuras sin reconfiguración manual (Priority: P3)

**Goal**: El mismo evento puede programarse en múltiples ventanas horarias (ej. cada fin de semana) sin requerir código nuevo por cada aparición.

**Independent Test**: Configurar más de una ventana horaria para el mismo evento y confirmar que el banner se activa/desactiva correctamente en cada una de ellas de forma independiente (spec.md US4).

### Tests for User Story 4 ⚠️

- [ ] T025 [P] [US4] PlayMode test en el mismo archivo que T010/T011 (secuencial), usando el contenido real `FantasyStagesEventBanner.asset` (T016/T021, ya con `LinkedChapter` resuelto): configurar 2 `EventTimeWindow` (una en el pasado, otra cubriendo `now`) y confirmar `EventBannerStates[0].isActive == true`; con ambas en el pasado, `false`; sin cambios de código respecto a T010 — solo datos, verificando que la cobertura genérica de T009 (Foundational) se sostiene también a nivel de integración con contenido real

### Implementation for User Story 4

- [ ] T026 [US4] Extender `EventBannerContentBuilder.BuildEventBannerData()` (T016, mismo archivo) para configurar `FantasyStagesEventBanner.asset` con 2 `EventTimeWindow` de ejemplo (demostrando recurrencia, quickstart.md Paso 6) en vez de 1 — depende de T016, T021

**Checkpoint**: Las 4 historias de usuario quedan completas e independientemente funcionales.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T027 [P] Revisar que la implementación final no se haya desviado de [contracts/event-banner-activation.md](./contracts/event-banner-activation.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación
- [ ] T028 Correr la suite completa EditMode + PlayMode (`001`-`015`) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde
- [X] T029a Ejecutar `The Battler > Build Special Event Banner Content` y `The Battler > Validate Special Event Banner Content` en modo batch sobre el proyecto real — OK, sin referencias nulas ni datos faltantes; `AdventureMapContentBuilder.ValidateScene` (004/006) también sigue en verde tras el cableado nuevo en `AdventureMap.unity`
- [ ] T029b Ejecutar los 6 pasos de [quickstart.md](./quickstart.md) contra `AdventureMap.unity`/`SpecialEventMastodonHunt_Battle.unity` reales, con inspección visual del jugador — **no realizable en modo batch `-nographics`**, requiere el Editor con GUI (mismo criterio que T063 de spec 013 y T026 de spec 014)

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — bloquea las 4 historias de usuario
- **User Stories (Fase 3-6)**: todas dependen de Foundational; dentro de cada historia, los tests preceden a su implementación correspondiente
- **Polish (Fase 7)**: depende de que las 4 historias estén completas

### User Story Dependencies

- **US1 (P1)**: puede empezar tras Foundational — sin dependencia de otras historias; entrega un banner visible/seleccionable aunque todavía sin destino jugable real
- **US2 (P1)**: puede empezar tras Foundational en su lógica de `BattleStateManager` (T018 no depende de US1), pero su contenido (T019-T022) se enlaza sobre los assets que US1 ya creó (T016) — en la práctica se implementa después
- **US3 (P2)**: depende de que exista contenido jugable real (US2) y del método de selección (US1, T013) para tener algo que interrumpir/no interrumpir; conceptualmente es una propiedad de `BattleStateManager` que ya es cierta desde antes de esta feature (research.md §3)
- **US4 (P3)**: depende del evaluador (Foundational, T008/T009, que ya soporta múltiples ventanas de forma genérica) y del contenido real de US1/US2 (T016/T021) para su verificación de integración — sin cambios de código propios más allá de datos (T026)

### Parallel Opportunities

- T002, T006 (Fase 2) son independientes entre sí — archivos distintos
- T003 (test de `EventTimeWindow`) puede prepararse en paralelo con T002 mismo, aunque dependa de él para pasar en verde
- T005 y T009 pueden ejecutarse en paralelo entre sí una vez completados T004/T008 respectivamente — archivos distintos
- T010/T011 (tests de US1) pueden prepararse en paralelo, aunque requieran T012/T013 para pasar en verde
- T014 (View) es independiente de T016 (Editor tooling) en su código, aunque T016 termine referenciándolo en la escena
- T018 (test de US2) es independiente de T010/T011 (US1) — archivos distintos, sin dependencia de código entre sí (solo de contenido, T019-T021)
- T023 (test de US3) depende de que exista contenido real (T019-T021) para instanciar una batalla completa — no puede paralelizarse con US1/US2, solo con T024

---

## Parallel Example: Foundational (Fase 2)

```bash
# Lanzar juntos los tipos de datos base (archivos distintos, sin dependencias entre sí):
Task: "Crear EventTimeWindow en Assets/Scripts/Model/Battler/EventTimeWindow.cs"
Task: "Crear EventBannerState en Assets/Scripts/Model/Battler/EventBannerState.cs"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante — tipos de datos y evaluador puro)
3. Completar Fase 3: US1 (banner visible/seleccionable según ventana)
4. Completar Fase 4: US2 (contenido jugable real + recompensas) — ambas P1, spec.md las trata como el núcleo funcional del sistema
5. **Detener y validar**: correr T010/T011/T018 en verde de forma aislada, luego el quickstart.md Pasos 1-4 con GUI
6. Esto ya es útil por sí solo: el banner de evento aparece según horario y es jugable de punta a punta

### Incremental Delivery

1. Setup + Foundational → tipos de datos y evaluador de activación listos
2. + US1 + US2 → banner de evento funcional de punta a punta (MVP)
3. + US3 → protección de batalla en curso ante expiración de ventana
4. + US4 → recurrencia de múltiples ventanas
5. Fase 7 → verificación final y quickstart manual con GUI

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- US1 incluye la implementación completa de `TrySelectEventBanner` (las tres ramas: inactivo, activo sin energía, activo con energía) porque es un único método atómico — mismo criterio que `006-mission-energy-system` aplicó a `TrySelectBanner`/US1-US2 de esa spec
- US3 no añade código a `BattleStateManager` por diseño (research.md §3) — su tarea de implementación (T024) es una verificación, no una construcción; si el test T023 fallara, la corrección sería **remover** acoplamiento accidental, no añadir una guarda de ventana horaria
- US4 no añade código al evaluador (ya soporta N ventanas desde Foundational, T008) — solo añade una segunda `EventTimeWindow` de contenido (T026) para demostrarlo con datos reales
- T016/T017 (US1) y T019-T022 (US2) viven todos en el mismo archivo `EventBannerContentBuilder.cs`, siguiendo el mismo patrón de "un `[MenuItem]` de build + uno de validación por feature de contenido" que `AdventureMapContentBuilder`/`Chapter2ContentBuilder`/`EmpireOfCatsContentBuilder`
