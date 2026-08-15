---

description: "Task list template for feature implementation"
---

# Tasks: Sistema de Energía y Escalado de Dificultad por Misión

**Input**: Design documents from `/specs/006-mission-energy-system/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/mission-energy-store.md](./contracts/mission-energy-store.md), [contracts/mission-energy-controller.md](./contracts/mission-energy-controller.md), [contracts/mission-catalog-extension.md](./contracts/mission-catalog-extension.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en 001-003, y plan.md § Project Structure define explícitamente los archivos de test de esta feature.

**Organization**: Tareas agrupadas por historia de usuario (US1/US2/US3/US4, según spec.md) para permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay,View}/Battler/`, datos en `Assets/Data/Battler/`, y tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

**Nota de dependencia entre features (research.md §7 de esta feature)**: `ChapterBannerDefinition.cs`/`AdventureMap.cs`/`AdventureMapFlowController.cs` (`004-adventure-map-banners`) y `IPlayerProgressStore.cs`/`PlayerCharacterLevelCalculator.cs`/`UnitProgress.cs` (`005-player-dashboard`) no existían en `Assets/Scripts/` al momento de escribir el plan de esta feature. Las tareas de esta feature que **extienden** esos archivos (T007, T014, T016, T022) asumen que ya existen en C# para cuando se ejecuten (Fase 6 sigue a Fases 4-5 del roadmap); las tareas que no dependen de la UI de selección (T002-T013, T017-T021, T023-T024) son completamente implementables y testeables en EditMode de forma aislada, sin ningún tipo de 004/005 (research.md §7).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (Capítulo 1 + Guardado de Progreso + Menú Principal) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde (0 errores de compilación, todos los tests en verde) antes de empezar; confirmar además si `Assets/Scripts/Model/Battler/ChapterBannerDefinition.cs`, `Assets/Scripts/Gameplay/Battler/AdventureMapFlowController.cs` (004) y `Assets/Scripts/Model/Battler/IPlayerProgressStore.cs`, `Assets/Scripts/Gameplay/Battler/PlayerCharacterLevelCalculator.cs` (005) ya existen — si falta alguno, las tareas T007/T014/T016/T022 quedan bloqueadas hasta que exista, pero el resto de esta feature (T002-T013, T017-T021, T023-T024) puede avanzar igual (research.md §7)

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos de datos, contrato de guardado y extensión del catálogo de misiones compartidos por las 4 historias de usuario. Ninguna historia puede implementarse ni probarse sin esto.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase. En particular, la extensión de `ChapterBannerDefinition` (T007) DEBE completarse antes de cualquier tarea que lea `EnergyCost`/`Region`/`DifficultyRank` (T014, T016, T023, T024).

- [X] T002 [P] Crear `MissionEnergySaveData` (`formatVersion`, `currentEnergy` con default explícito `-1`, `lastUpdateTimestampUtc` `long`) en `Assets/Scripts/Model/Battler/MissionEnergySaveData.cs`, según [data-model.md § MissionEnergySaveData](./data-model.md#missionenergysavedata)
- [X] T003 [P] Crear `MissionEnergyConfig` (`ScriptableObject`: `baseMaxEnergy`, `maxEnergyPerCharacterLevel`, `regenIntervalSeconds`) en `Assets/Scripts/Model/Battler/MissionEnergyConfig.cs`, según [data-model.md § MissionEnergyConfig](./data-model.md#missionenergyconfig-so)
- [X] T004 [P] Crear `Region` (`ScriptableObject`: `RegionId`, `DisplayNameKey`, sin array propio de misiones) en `Assets/Scripts/Model/Battler/Region.cs`, según [data-model.md § Region](./data-model.md#region-so)
- [X] T005 Crear el contrato `IMissionEnergyStore` (`MissionEnergySaveData Load()`, `void Save(MissionEnergySaveData data)`) en `Assets/Scripts/Model/Battler/IMissionEnergyStore.cs`, según [contracts/mission-energy-store.md](./contracts/mission-energy-store.md) — depende de T002
- [X] T006 [P] EditMode tests en `Assets/Tests/EditMode/Battler/MissionEnergyConfigValidationTests.cs` (archivo nuevo): `baseMaxEnergy >= 1`; `maxEnergyPerCharacterLevel >= 0`; `regenIntervalSeconds >= 1` (data-model.md § MissionEnergyConfig, Reglas de validación) — depende de T003
- [X] T007 Extender `ChapterBannerDefinition` (004) con tres campos nuevos — `EnergyCost` (`int`, `>= 0`), `Region` (`Region`, nullable), `DifficultyRank` (`int`, `>= 0`) — en `Assets/Scripts/Model/Battler/ChapterBannerDefinition.cs`, sin modificar ningún campo existente (`linkedChapter`/`targetSceneName`/`displayNameKey`/`bannerArt`/`ChapterId`/`HasPlayableDestination`), según [contracts/mission-catalog-extension.md](./contracts/mission-catalog-extension.md) — depende de T004 (tipo `Region`); **bloquea T014, T016, T023, T024**
- [X] T008 Implementar `LocalMissionEnergyStore` en `Assets/Scripts/Gameplay/Battler/LocalMissionEnergyStore.cs`: constructor con ruta de archivo inyectable, constante pública `DefaultFileName = "mission-energy.json"`, `Load()` tolerante a archivo ausente/corrupto/`formatVersion` desconocido (normaliza `currentEnergy < -1` a `-1`, nunca lanza), `Save()` con escritura atómica (temp file + reemplazo) que descarta silenciosamente `IOException`/`UnauthorizedAccessException` — mismo patrón que `LocalChapterProgressStore`/`LocalMenuSettingsStore`, según [contracts/mission-energy-store.md](./contracts/mission-energy-store.md) — depende de T005
- [X] T009 [P] EditMode tests en `Assets/Tests/EditMode/Battler/LocalMissionEnergyStoreTests.cs` (archivo nuevo): round-trip guardar→cargar; archivo ausente ⇒ `currentEnergy == -1`; archivo corrupto/JSON malformado/`formatVersion` desconocido ⇒ mismo resultado por defecto sin lanzar excepción; `currentEnergy` editado a mano `< -1` se normaliza a `-1`; escritura atómica no deja `.tmp` huérfano tras una escritura exitosa — depende de T008
- [X] T010 [P] Crear el activo `Assets/Data/Battler/DefaultMissionEnergyConfig.asset` (instancia de `MissionEnergyConfig`) con la curva/tasa inicial (p. ej. `baseMaxEnergy = 100`, `maxEnergyPerCharacterLevel = 5`, `regenIntervalSeconds = 60`, mismos valores usados en quickstart.md) — depende de T003

**Checkpoint**: Tipos de guardado, contrato de store y extensión de `ChapterBannerDefinition` listos — las 4 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Consumir energía al entrar a una misión (Priority: P1) 🎯 MVP

**Goal**: Un jugador con energía suficiente selecciona una misión del mapa de aventuras, entra a ella, y su energía disponible se reduce exactamente en el costo de esa misión.

**Independent Test**: Con energía suficiente disponible, seleccionar una misión, entrar a ella y confirmar que la energía disponible se reduce exactamente en el costo de esa misión (spec.md US1).

### Tests for User Story 1 ⚠️

> Estos tests deben escribirse primero y fallar antes de las tareas de implementación de esta fase.

- [X] T011 [P] [US1] EditMode tests en `Assets/Tests/EditMode/Battler/MissionEnergyControllerTests.cs` (archivo nuevo): (a) `Sync(nowUtc, characterLevel)` sin dato guardado (`store.Load()` con centinela `currentEnergy == -1`) ⇒ `CurrentEnergy == MaxEnergy`, persistido; (b) `TryEnterMission(cost)` con `CurrentEnergy >= cost` ⇒ devuelve `true`, descuenta exactamente `cost`, persiste (quickstart.md Escenario 1, pasos 1-4)
- [X] T012 [US1] PlayMode tests en `Assets/Tests/PlayMode/Battler/AdventureMapEnergyFlowPlayModeTests.cs` (archivo nuevo): con un banner desbloqueado (`isSelectable == true`) y `EnergyCost <= CurrentEnergy`, `AdventureMapFlowController.TrySelectBanner(bannerIndex)` devuelve `true`, invoca `ISceneNavigator.LoadScene` exactamente una vez en un `FakeSceneNavigator` inyectado, y `CurrentEnergy` expuesto por el controlador refleja el descuento inmediatamente después (quickstart.md Escenario 1, PlayMode)

### Implementation for User Story 1

- [X] T013 [US1] Crear `MissionEnergyController` (clase plana, no `MonoBehaviour`) en `Assets/Scripts/Gameplay/Battler/MissionEnergyController.cs`: constructor `(IMissionEnergyStore store, MissionEnergyConfig config)`; propiedades `CurrentEnergy`/`MaxEnergy` (valen `0` hasta el primer `Sync`); evento `Action EnergyChanged`; `void Sync(DateTime nowUtc, int characterLevel)` (calcula `MaxEnergy`, aplica regeneración por tiempo transcurrido con remanente preservado y tope en el máximo, persiste cuando corresponde, dispara `EnergyChanged` si cambió algo — algoritmo completo en research.md §3); `bool TryEnterMission(int energyCost)` (ambas ramas: descuenta+persiste+dispara evento+`true`, o no modifica nada+`false`) — según [contracts/mission-energy-controller.md](./contracts/mission-energy-controller.md) (hace pasar T011a/b) — depende de T003, T005
- [X] T014 [US1] Extender `AdventureMapFlowController` (004) en `Assets/Scripts/Gameplay/Battler/AdventureMapFlowController.cs`: en `Awake()`, además de lo ya calculado por 004 (`BannerStates`), resolver `IMissionEnergyStore`/`MissionEnergyConfig` (mismo patrón de resolución de dependencias que `MainMenuFlowController`, 003), construir `MissionEnergyController` y llamar `Sync(DateTime.UtcNow, characterLevel: 0)` (placeholder — el cálculo real de `characterLevel` se añade en T022, US3), exponer `CurrentEnergy`/`MaxEnergy`; extender `TrySelectBanner(int bannerIndex)`: tras la guarda de `isSelectable` ya existente (004), si es `true`, intentar además `missionEnergyController.TryEnterMission(banners[bannerIndex].EnergyCost)` — si devuelve `false`, `TrySelectBanner` devuelve `false` sin navegar; si devuelve `true`, procede a `sceneNavigator.LoadScene(...)` como ya hace 004 — según [research.md §6](./research.md) (hace pasar T012) — depende de T007, T013
- [X] T015 [US1] Crear `MissionEnergyBarView` (componente TMP simple) en `Assets/Scripts/View/Battler/MissionEnergyBarView.cs`: muestra `"CurrentEnergy/MaxEnergy"` leyendo `AdventureMapFlowController.CurrentEnergy`/`MaxEnergy`, se refresca suscribiéndose al evento `EnergyChanged` expuesto por el flow controller (FR-001) — depende de T014
- [X] T016 [US1] En `Assets/Scenes/AdventureMap.unity` (004): añadir `MissionEnergyBarView` al Canvas referenciando `AdventureMapFlowController`; asignar `Assets/Data/Battler/DefaultMissionEnergyConfig.asset` (T010) al campo correspondiente de `AdventureMapFlowController`; asignar `EnergyCost` al `ChapterBannerDefinition` del Capítulo 1 (asset ya existente de 004) — depende de T010, T015

**Checkpoint**: US1 completa y verificable de forma independiente — con energía suficiente, seleccionar una misión la descuenta exactamente en su costo y navega.

---

## Phase 4: User Story 2 - Bloqueo sin penalización cuando no hay energía suficiente (Priority: P1)

**Goal**: Un jugador sin energía suficiente intenta entrar a una misión y el sistema se lo impide, sin aplicar ninguna penalización ni descontar la energía que sí tiene.

**Independent Test**: Con energía insuficiente para el costo de una misión, intentar entrar a ella y confirmar que el sistema bloquea la entrada, no descuenta energía, y no aplica ninguna otra consecuencia negativa (spec.md US2).

### Tests for User Story 2 ⚠️

- [X] T017 [P] [US2] EditMode tests en `Assets/Tests/EditMode/Battler/MissionEnergyControllerTests.cs` (mismo archivo que T011, secuencial): `TryEnterMission(cost)` con `CurrentEnergy < cost` ⇒ devuelve `false`; `CurrentEnergy`/`MaxEnergy` quedan exactamente como antes de la llamada (snapshot antes/después); `store` no recibe un `Save` con un valor distinto al ya persistido (quickstart.md Escenario 2, pasos 1-2) — depende de T013
- [X] T018 [US2] PlayMode tests en `Assets/Tests/PlayMode/Battler/AdventureMapEnergyFlowPlayModeTests.cs` (mismo archivo que T012, secuencial): con `EnergyCost > CurrentEnergy` sobre un banner desbloqueado, `TrySelectBanner(bannerIndex)` devuelve `false`; `FakeSceneNavigator` registra **cero** llamadas; ningún `ChapterProgressRecord` se crea ni modifica en el `IChapterProgressStore` de prueba usado en el mismo test (quickstart.md Escenario 2, paso 3) — depende de T014

### Implementation for User Story 2

- [X] T019 [US2] Verificar contra T017/T018 que `MissionEnergyController.TryEnterMission` (T013) y `AdventureMapFlowController.TrySelectBanner` (T014) ya satisfacen FR-004/FR-005 sin cambios adicionales de código (ambas ramas se implementaron juntas en US1 por ser un único método cada una); si algún test de esta fase revela una desviación, corregirla en `Assets/Scripts/Gameplay/Battler/MissionEnergyController.cs`/`Assets/Scripts/Gameplay/Battler/AdventureMapFlowController.cs` (mismos archivos que T013/T014) — depende de T017, T018

**Checkpoint**: US1 y US2 funcionan juntas e independientemente — energía suficiente navega y descuenta, energía insuficiente bloquea sin penalización.

---

## Phase 5: User Story 3 - La energía se recupera con el tiempo y escala con el nivel de personaje (Priority: P2)

**Goal**: Un jugador ve que su energía se recupera automáticamente con el paso del tiempo, y que su energía máxima y/o su tasa de recuperación aumentan conforme sube el nivel de personaje definido en el dashboard de base.

**Independent Test**: Dejar pasar tiempo sin gastar energía y confirmar que se recupera hasta el máximo actual; luego subir el nivel de personaje en el dashboard de base y confirmar que la energía máxima y/o la tasa de recuperación aumentan (spec.md US3).

### Tests for User Story 3 ⚠️

- [X] T020 [P] [US3] EditMode tests en `Assets/Tests/EditMode/Battler/MissionEnergyControllerTests.cs` (mismo archivo que T011/T017, secuencial): regeneración parcial (menos de un `regenIntervalSeconds`) no otorga energía pero preserva el remanente de segundos para el siguiente `Sync`; regeneración de varios intervalos completos otorga exactamente `floor(elapsedSeconds / regenIntervalSeconds)` unidades; energía ya en el máximo no banca exceso, incluido un salto de tiempo grande (varios días, "juego cerrado") sin overflow ni excepción (quickstart.md Escenario 3) — depende de T013
- [X] T021 [P] [US3] EditMode tests en `Assets/Tests/EditMode/Battler/MissionEnergyControllerTests.cs` (mismo archivo, secuencial): `MaxEnergy == baseMaxEnergy + maxEnergyPerCharacterLevel * characterLevel`; al subir `characterLevel` entre dos llamadas a `Sync` en el mismo instante, `MaxEnergy` aumenta y `CurrentEnergy` nunca se reduce por el cambio (quickstart.md Escenario 4) — depende de T013

### Implementation for User Story 3

- [X] T022 [US3] Extender `AdventureMapFlowController.Awake()` (mismo archivo que T014, secuencial) en `Assets/Scripts/Gameplay/Battler/AdventureMapFlowController.cs`: reemplazar el placeholder `characterLevel: 0` de T014 por el cálculo real vía `PlayerCharacterLevelCalculator.Calculate(ownedUnits, playerProgressStore.Load().unitProgress)` (005) sobre el roster `ChapterDefinition.AvailableUnits` del capítulo activo, pasado a `missionEnergyController.Sync(DateTime.UtcNow, characterLevel)` (hace pasar T020/T021 a nivel de integración) — depende de T014; requiere que `IPlayerProgressStore.cs`/`PlayerCharacterLevelCalculator.cs` (005) ya existan (ver nota de dependencia entre features, arriba)

**Checkpoint**: US3 completa — la energía se recupera con el tiempo (con o sin el juego cerrado) y escala con `PlayerCharacterLevel`.

---

## Phase 6: User Story 4 - Dificultad progresiva de misiones dentro de una región (Priority: P2)

**Goal**: Un jugador que avanza a través de las misiones de una misma región/país nota que la dificultad de cada misión siguiente es mayor que la anterior dentro de esa región.

**Independent Test**: Recorrer varias misiones consecutivas dentro de la misma región y confirmar que la dificultad asignada a cada una aumenta respecto a la anterior (spec.md US4).

### Tests for User Story 4 ⚠️

- [X] T023 [P] [US4] EditMode tests en `Assets/Tests/EditMode/Battler/MissionRegionDifficultyValidationTests.cs` (archivo nuevo), construyendo `ChapterBannerDefinition`/`Region`/`AdventureMap` de prueba vía `ScriptableObject.CreateInstance<T>()` en memoria: secuencia de `DifficultyRank` estrictamente creciente dentro de una región pasa; secuencia con dos valores iguales consecutivos pasa (regla "igual o mayor"); una región con un solo banner pasa trivialmente; un valor decreciente dentro de la misma región falla en el par de índices correspondiente; dos regiones distintas intercaladas en `AdventureMap.Banners` con dificultades que "bajan" al cambiar de región no fallan (cada región se evalúa por separado); un banner con `Region == null` no participa ni hace fallar ninguna validación; `Region.RegionId` vacío/nulo o duplicado entre assets `Region` falla (quickstart.md Escenario 5; contracts/mission-catalog-extension.md; data-model.md § Region) — depende de T007

### Implementation for User Story 4

- [X] T024 [US4] Crear el activo `Assets/Data/Battler/Regions/ImperioDeLosTestRobotRegion.asset` (instancia de `Region`, único real hoy) y asignar `Region`/`DifficultyRank` al `ChapterBannerDefinition` del Capítulo 1 (asset ya existente de 004) — depende de T007, T023

**Checkpoint**: Las 4 historias de usuario quedan completas e independientemente funcionales.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T025 [P] PlayMode test en `Assets/Tests/PlayMode/Battler/AdventureMapEnergyFlowPlayModeTests.cs` (mismo archivo que T012/T018, secuencial): con un `mission-energy.json` corrupto (JSON malformado o `formatVersion` desconocido) escrito manualmente en la ruta usada por `LocalMissionEnergyStore`, la escena `AdventureMap.unity` carga sin bloquearse ni lanzar excepción durante `Awake()`, y `CurrentEnergy` queda en `MaxEnergy` (FR-011, quickstart.md Escenario 6) — depende de T014
- [X] T026 Revisar que la implementación final no se haya desviado de [contracts/mission-energy-store.md](./contracts/mission-energy-store.md) / [contracts/mission-energy-controller.md](./contracts/mission-energy-controller.md) / [contracts/mission-catalog-extension.md](./contracts/mission-catalog-extension.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación
- [X] T027 Correr la suite completa EditMode + PlayMode (Capítulo 1 + Guardado de Progreso + Menú Principal + Mapa de Aventuras + Dashboard de Base + Sistema de Energía) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde
- [X] T028 Ejecutar una aproximación automatizada de los 6 escenarios de [quickstart.md](./quickstart.md) contra la escena real (mismo enfoque documentado en `specs/003-main-menu-config/tasks.md` § Notas de implementación si no hay acceso a la GUI del Editor), confirmando SC-001 a SC-005

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — bloquea las 4 historias de usuario
- **User Stories (Fase 3-6)**: todas dependen de Foundational; dentro de cada historia, los tests preceden a su implementación correspondiente
- **Polish (Fase 7)**: depende de que las 4 historias estén completas

### User Story Dependencies

- **US1 (P1)**: puede empezar tras Foundational — sin dependencia de otras historias
- **US2 (P1)**: puede empezar tras Foundational; su Independent Test no depende de haber jugado US1, pero su implementación (T019) reutiliza el mismo `TryEnterMission`/`TrySelectBanner` que US1 ya implementó (T013/T014, ambas ramas de cada método se escriben juntas por ser un único método atómico — ver contracts/mission-energy-controller.md), por lo que en la práctica se verifica después
- **US3 (P2)**: puede empezar tras Foundational; su Independent Test no depende de US1/US2 a nivel de `MissionEnergyController` (T013 ya implementa el algoritmo completo de `Sync`, incluida regeneración y escalado), pero la integración real de `characterLevel` (T022) extiende el mismo `AdventureMapFlowController.Awake()` que US1 ya tocó (T014), por lo que se implementa después en la práctica
- **US4 (P2)**: puede empezar tras Foundational (T007 ya extendió `ChapterBannerDefinition` con `Region`/`DifficultyRank`); completamente independiente de US1/US2/US3 en su lógica de validación (no toca `MissionEnergyController` ni `AdventureMapFlowController`)

### Parallel Opportunities

- T002, T003, T004 (Fase 2) son independientes entre sí — archivos distintos
- T006 (test de `MissionEnergyConfig`) y T009 (test de `LocalMissionEnergyStore`) pueden ejecutarse en paralelo entre sí una vez completados T003/T008 respectivamente — archivos distintos
- T010 (activo `DefaultMissionEnergyConfig.asset`) es independiente de T007/T008 — solo depende de T003
- T011 (test EditMode de US1) y T012 (test PlayMode de US1) pueden prepararse en paralelo, aunque T012 requiera T014 para pasar en verde
- T020 y T021 (tests de US3, mismo archivo) son independientes entre sí en su contenido — pueden escribirse en paralelo antes de fusionarse en el mismo archivo
- T023 (tests de US4) es independiente de todo el trabajo de US1/US2/US3 (T011-T022) — solo depende de T007
- Las implementaciones de US1/US2/US3 comparten `MissionEnergyController.cs` y `AdventureMapFlowController.cs`, por lo que sus tareas de implementación son intrínsecamente secuenciales entre esas tres historias, aunque cada una sea conceptualmente independiente y su Independent Test no dependa de las otras; US4 no comparte ningún archivo de implementación con ellas (solo comparte el prerrequisito T007)

---

## Parallel Example: Foundational (Fase 2)

```bash
# Lanzar juntos los tipos de datos base (archivos distintos, sin dependencias entre sí):
Task: "Crear MissionEnergySaveData en Assets/Scripts/Model/Battler/MissionEnergySaveData.cs"
Task: "Crear MissionEnergyConfig en Assets/Scripts/Model/Battler/MissionEnergyConfig.cs"
Task: "Crear Region en Assets/Scripts/Model/Battler/Region.cs"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante — incluye la extensión de `ChapterBannerDefinition`)
3. Completar Fase 3: US1 (consumir energía al entrar)
4. Completar Fase 4: US2 (bloqueo sin penalización) — comparte implementación con US1, spec.md ya documenta que ambas P1 deben resolverse juntas para que el sistema tenga sentido completo
5. **Detener y validar**: correr T011/T012/T017/T018 en verde de forma aislada
6. Esto ya es útil por sí solo: la energía limita cuántas misiones se pueden jugar, con y sin penalización correctamente resueltas

### Incremental Delivery

1. Setup + Foundational → tipos de datos y extensión de catálogo listos
2. + US1 + US2 → sistema de energía funcional de punta a punta (MVP)
3. + US3 → recuperación por tiempo y escalado con nivel de personaje
4. + US4 → dificultad progresiva por región
5. Fase 7 → verificación final y quickstart manual

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- US1/US2 comparten `MissionEnergyController.cs`/`AdventureMapFlowController.cs` porque `TryEnterMission`/`TrySelectBanner` son cada uno un único método atómico que resuelve las dos ramas (energía suficiente/insuficiente) a la vez — separar su implementación por historia fragmentaría un método que el propio contrato describe como una sola operación (contracts/mission-energy-controller.md)
- US3 extiende el mismo `Awake()` de `AdventureMapFlowController` que US1 ya tocó, pero su lógica central (`Sync`, regeneración y escalado) ya queda completa desde T013 (US1) — T022 solo reemplaza el placeholder `characterLevel: 0` por el cálculo real de 005
- US4 es la historia más independiente: no comparte ningún archivo de implementación con US1/US2/US3, solo el prerrequisito común T007 (extensión de `ChapterBannerDefinition`)
- T007 (extensión de `ChapterBannerDefinition`) se agrupó como una sola tarea Foundational con los tres campos nuevos (`EnergyCost`/`Region`/`DifficultyRank`) juntos, en vez de repartirlos entre fases, para evitar reeditar el mismo archivo `.cs` una vez por historia — ver instrucción explícita de orden de tareas de esta feature
- T001/T014/T016/T022 dependen de que `004-adventure-map-banners` (y, para T022, `005-player-dashboard`) ya estén implementadas en C#; si no lo estuvieran al momento de ejecutar `/speckit-implement` de esta feature, el resto de tareas (T002-T013, T017-T021, T023-T024) sigue siendo completamente ejecutable de forma aislada (research.md §7)

---

## Fase 8: Cierre de brechas post-auditoría (2026-07-30)

**Contexto**: una auditoría de mecánicas/niveles (posterior a `010-chapter2-hacia-futuro` y `012-real-asset-integration`) encontró que, pese a que T016 y T024 estaban marcadas `[X]` completas, `Banner_Chapter1.asset` tenía `EnergyCost: 0`, `Region: null` y `DifficultyRank: 0` en el repositorio real.

**Causa raíz** (no un olvido de implementación — un bug de pérdida de datos silenciosa): `AdventureMapContentBuilder.Build()` es idempotente por diseño (borra y recrea `Banner_Chapter1.asset`/`Banner_HaciaElFuturo.asset` desde cero en cada corrida) y su código nunca asignó `EnergyCost`/`Region`/`DifficultyRank` — esos 3 campos los puebla un builder aparte, `MissionEnergyContentBuilder.Build()` (`The Battler > Build Mission Energy Content`), ejecutado una única vez cuando esta feature se implementó originalmente. Durante el ciclo de correcciones de `012-real-asset-integration` se volvió a correr `AdventureMapContentBuilder.Build()` varias veces (para resolver un bug de importación de sprites) sin volver a correr `MissionEnergyContentBuilder.Build()` después — cada corrida de `AdventureMapContentBuilder` pisaba silenciosamente los 3 campos a sus valores por defecto. `Banner_HaciaElFuturo` nunca había tenido estos campos poblados, porque `010-chapter2-hacia-futuro` (posterior a esta spec) no extendió `MissionEnergyContentBuilder` para cubrir el segundo banner.

- [X] T025 Re-ejecutar `The Battler > Build Mission Energy Content` para restaurar `Banner_Chapter1.asset` (`EnergyCost: 30`, `Region: ImperioDeLosTestRobotRegion`, `DifficultyRank: 1`) — sin cambios de código, solo re-aplicar el builder ya existente
- [X] T026 Extender `Chapter2ContentBuilder.LinkAdventureMapBanner(...)` (`010`) en `Assets/Editor/Battler/Chapter2ContentBuilder.cs` para crear/poblar una `Region` propia del Capítulo 2 (`Assets/Data/Battler/Regions/HaciaElFuturoRegion.asset`, `regionId: region.hacia-el-futuro` — región distinta de la del Capítulo 1 porque el antagonista es otro, "Directiva-Cero" vs. "Imperio de los Test/Robot", decisión confirmada con el usuario) y asignar `Banner_HaciaElFuturo.EnergyCost = 40` / `DifficultyRank = 1` (escalera propia e independiente de la del Capítulo 1, ambas región evaluadas por separado por `MissionRegionDifficultyValidator`)
- [X] T027 Conectar `MissionRegionDifficultyValidator` (hasta ahora solo ejercitado por `MissionRegionDifficultyValidationTests.cs` con datos sintéticos) a la validación de build real: `AdventureMapContentBuilder.ValidateScene()` ahora corre `Validate(map.Banners)` contra `MainAdventureMap.asset` y falla si algún banner con `LinkedChapter` no tiene `Region` asignada o si hay dificultad decreciente dentro de una región
- [X] T028 [P] Test EditMode nuevo `Assets/Tests/EditMode/Battler/MissionRegionDifficultyRealDataTests.cs`: corre el validador y `HasInvalidOrDuplicateRegionIds` contra `MainAdventureMap.asset`/todos los assets `Region` reales del proyecto (no solo dobles en memoria), para que una regresión de contenido futura falle en la suite de tests además de en `ValidateScene`
- [X] T029 Re-correr suite completa EditMode (169/169) y PlayMode (50/50) tras T025-T028 — 100% en verde, sin modificar ninguna aserción existente

**Checkpoint**: `EnergyCost`/`Region`/`DifficultyRank` reales en ambos banners, con protección de regresión en dos capas (validación de build + test automatizado) para que este tipo de pérdida de datos no vuelva a pasar desapercibida.
