---

description: "Task list template for feature implementation"
---

# Tasks: Dashboard de Base del Jugador

**Input**: Design documents from `/specs/005-player-dashboard/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/player-progress-store.md](./contracts/player-progress-store.md), [contracts/unit-leveling.md](./contracts/unit-leveling.md), [contracts/team-formation.md](./contracts/team-formation.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en 001-004, y research.md §10 define explícitamente la estrategia de testing de esta feature.

**Organization**: Tareas agrupadas por historia de usuario (US1-US4, según spec.md) para permitir implementación y prueba independientes de cada una. Historias 1 y 2 comparten prioridad P1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay,View}/Battler/`, activos en `Assets/Scenes/`, `Assets/Data/Battler/`, y tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (Capítulo 1 + Guardado de Progreso + Menú Principal + lo que exista de Mapa de Aventuras) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde (0 errores de compilación, todos los tests en verde) antes de empezar, como línea base de referencia.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Escena base y capa de datos/guardado compartida por las 4 historias de usuario (data-model.md: `UnitProgress`, `PlayerExperiencePool` y `TeamFormation` viven en el mismo agregado/archivo con una sola escritura atómica — research.md §1). Ninguna historia puede exponer nivel de personaje ni experiencia sin esto.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [X] T002 [P] Crear la escena `Assets/Scenes/PlayerBase.unity` (Canvas raíz, EventSystem, tres paneles vacíos deshabilitados: Dashboard/Upgrade/Team) y registrarla en Build Settings como índice 3 (después de `MainMenu.unity`=0, `Chapter1_Battle.unity`=1, `SampleScene.unity`=2, según `ProjectSettings/EditorBuildSettings.asset` actual)
- [X] T003 [P] Crear `UnitProgress` (`unitId: string`, `level: int`, `experienceInvested: int`) en `Assets/Scripts/Model/Battler/UnitProgress.cs`, según [data-model.md § UnitProgress](./data-model.md#unitprogress)
- [X] T004 Crear `PlayerProgressSaveData` (`formatVersion: int`, `unitProgress: UnitProgress[]`, `availableExperience: int`, `activeTeamUnitIds: string[]`) en `Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs`, según [data-model.md § PlayerProgressSaveData](./data-model.md#playerprogresssavedata) — depende de T003
- [X] T005 Crear el contrato `IPlayerProgressStore` (`Load()`, `Save(PlayerProgressSaveData)`) en `Assets/Scripts/Model/Battler/IPlayerProgressStore.cs`, según [contracts/player-progress-store.md](./contracts/player-progress-store.md) — depende de T004
- [X] T006 Implementar `LocalPlayerProgressStore` (constructor con ruta inyectable, `DefaultFileName = "player-progress.json"`, `Load()`/`Save()` con clamp de `availableExperience >= 0`, deduplicación de `unitProgress` por `unitId`, escritura atómica temp+reemplazo, try/catch que nunca relanza — mismo patrón que `LocalChapterProgressStore`/`LocalMenuSettingsStore`) en `Assets/Scripts/Gameplay/Battler/LocalPlayerProgressStore.cs`, según [contracts/player-progress-store.md](./contracts/player-progress-store.md) — depende de T005
- [X] T007 [P] EditMode tests en `Assets/Tests/EditMode/Battler/LocalPlayerProgressStoreTests.cs` (archivo nuevo): round-trip guardar→cargar; archivo ausente ⇒ valores por defecto (`unitProgress`/`activeTeamUnitIds` vacíos, `availableExperience = 0`); archivo corrupto/JSON malformado/`formatVersion` desconocido ⇒ los mismos valores por defecto, sin lanzar excepción; `availableExperience` negativo se clampa a `0` al cargar/guardar; `unitProgress` duplicado por `unitId` se deduplica conservando la última entrada; con una ruta no escribible, `Save()` no lanza excepción (hace pasar el contrato de T006) — depende de T006
- [X] T008 [P] Crear `UnitLevelingConfig` (`ScriptableObject`: `maxLevel: int`, `experienceCostPerLevel: int[]`) en `Assets/Scripts/Model/Battler/UnitLevelingConfig.cs`, según [data-model.md § UnitLevelingConfig](./data-model.md#unitlevelingconfig)
- [X] T009 [P] EditMode tests en `Assets/Tests/EditMode/Battler/UnitLevelingConfigValidationTests.cs` (archivo nuevo): `maxLevel >= 2`; `experienceCostPerLevel.Length == maxLevel - 1`; todo elemento de `experienceCostPerLevel` es `> 0` (hace pasar el contrato de T008) — depende de T008
- [X] T010 [P] Crear el activo `Assets/Data/Battler/DefaultUnitLevelingConfig.asset` (instancia de `UnitLevelingConfig`) con una curva de costo de experiencia compartida por las 5 unidades del Capítulo 1 (research.md §2) — depende de T008
- [X] T011 [P] Crear `PlayerCharacterLevelCalculator` (función estática pura: `Calculate(IReadOnlyList<UnitDefinition> ownedUnits, UnitProgress[] unitProgress) -> int`, `BaseUnitLevel = 1`) en `Assets/Scripts/Gameplay/Battler/PlayerCharacterLevelCalculator.cs`, según [contracts/unit-leveling.md § PlayerCharacterLevelCalculator](./contracts/unit-leveling.md) — depende de T003
- [X] T012 [P] EditMode tests en `Assets/Tests/EditMode/Battler/PlayerCharacterLevelCalculatorTests.cs` (archivo nuevo): `ownedUnits` sin ningún `UnitProgress` ⇒ suma de niveles base (`BaseUnitLevel` por unidad); progreso mixto (algunas unidades con `UnitProgress`, otras sin) ⇒ suma correcta; `ownedUnits` vacío ⇒ `0` sin lanzar (Acceptance Scenario 2, Historia 1) (hace pasar el contrato de T011) — depende de T011

**Checkpoint**: Escena base, guardado local y calculadora de nivel listos — las 4 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Ver el estado de la base del jugador (Priority: P1) 🎯 MVP

**Goal**: Un jugador que entra a la base ve su nivel de personaje actual y la experiencia acumulada disponible, coherentes con el progreso real de sus unidades (incluso sin haber mejorado ninguna todavía).

**Independent Test**: Entrar a la base desde el banner "Imperio de los Test/Robot" y confirmar que se muestra el nivel de personaje actual y la experiencia acumulada disponible, coherentes con el progreso de las unidades del jugador.

### Tests for User Story 1 ⚠️

> Estos tests deben escribirse primero y fallar antes de las tareas de implementación de esta fase.

- [X] T013 [P] [US1] EditMode tests en `Assets/Tests/EditMode/Battler/UnitLevelingControllerTests.cs` (archivo nuevo): construir con una store en memoria sin progreso guardado ⇒ `CharacterLevel` = suma de niveles base de `ownedUnits`, `AvailableExperience = 0` (Historia 1 Escenario 2); construir con una store en memoria con progreso sembrado (algunas unidades mejoradas) ⇒ `CharacterLevel`/`AvailableExperience` reflejan exactamente ese estado (Historia 1 Escenario 1); `GetUnitLevel(unitId)` devuelve `UnitProgress.level` si existe registro, si no `BaseUnitLevel`, incluso para un `unitId` desconocido, sin lanzar
- [X] T014 [P] [US1] PlayMode tests en `Assets/Tests/PlayMode/Battler/PlayerBaseFlowPlayModeTests.cs` (archivo nuevo): con `PlayerBase.unity` cargada y un `player-progress.json` sembrado en `Application.persistentDataPath` antes de entrar en Play Mode, `PlayerBaseFlowController` resuelve `IPlayerProgressStore`/`ChapterDefinition` en `Awake()` (dependencias reales, sin doble inyectado) y expone `CharacterLevel`/`AvailableExperience` coherentes con ese save (Historia 1 Escenario 1); sin ningún save previo, expone la suma de niveles base sin errores en consola (Historia 1 Escenario 2); cronometrar con `System.Diagnostics.Stopwatch` (desde `Awake()` hasta que el estado queda listo para la View) que la carga completa muy por debajo de los 2s de SC-001

### Implementation for User Story 1

- [X] T015 [US1] Crear `UnitLevelingController` en `Assets/Scripts/Gameplay/Battler/UnitLevelingController.cs`: constructor `(IPlayerProgressStore store, UnitLevelingConfig config, IReadOnlyList<UnitDefinition> ownedUnits)` que carga `store.Load()` y calcula `CharacterLevel` vía `PlayerCharacterLevelCalculator.Calculate(...)`; expone `AvailableExperience`, `CharacterLevel`, `GetUnitLevel(string unitId)` (`TryGetNextLevelCost`/`TryLevelUp`/evento `ProgressChanged` se añaden en Historia 2 — ver T020), según [contracts/unit-leveling.md](./contracts/unit-leveling.md) (hace pasar T013) — depende de T006, T008, T011
- [X] T016 [US1] Crear `PlayerBaseFlowController` en `Assets/Scripts/Gameplay/Battler/PlayerBaseFlowController.cs`: `MonoBehaviour` con `[SerializeField] ChapterDefinition`; en `Awake()` resuelve `IPlayerProgressStore` (`LocalPlayerProgressStore` sobre `player-progress.json` en `Application.persistentDataPath`, si no fue ya inyectado por un test — mismo patrón que `BattleStateManager`/`MainMenuFlowController`), construye `UnitLevelingController` con `ChapterDefinition.AvailableUnits`; expone `CharacterLevel`/`AvailableExperience` a la capa View (hace pasar T014) — depende de T015
- [X] T017 [US1] Crear `PlayerBaseDashboardUIController` en `Assets/Scripts/View/Battler/PlayerBaseDashboardUIController.cs`: textos TMP enlazados a `PlayerBaseFlowController.CharacterLevel`/`AvailableExperience`, refrescados en `Start()`; botones de navegación a los paneles de Mejora/Equipo presentes pero sin panel de destino poblado todavía (se completan en Historia 2/3) — depende de T016
- [X] T018 [US1] Añadir el contenido del panel Dashboard (textos de nivel de personaje/experiencia disponible, botones de navegación a Mejora/Equipo) a `Assets/Scenes/PlayerBase.unity`, con el GameObject raíz `PlayerBaseFlowController` + `PlayerBaseDashboardUIController` enlazados y `ChapterDefinition` del Capítulo 1 asignado — depende de T002, T017

**Checkpoint**: US1 completa y verificable de forma independiente — el dashboard muestra nivel de personaje y experiencia acumulada correctos, con y sin progreso guardado.

---

## Phase 4: User Story 2 - Mejorar una unidad usando experiencia acumulada (Priority: P1)

**Goal**: Un jugador con experiencia acumulada sube el nivel de una unidad desde la pantalla de mejora, descontando la experiencia gastada y actualizando de inmediato el nivel de personaje agregado; el progreso se mantiene entre sesiones.

**Independent Test**: Con experiencia acumulada disponible, entrar a la pantalla de mejora de unidades, subir el nivel de una unidad y confirmar que se descuenta la experiencia gastada y que el nivel de personaje agregado aumenta en consecuencia.

### Tests for User Story 2 ⚠️

- [X] T019 [US2] Extender `Assets/Tests/EditMode/Battler/UnitLevelingControllerTests.cs` (mismo archivo que T013, secuencial): `TryGetNextLevelCost` devuelve el costo de `config.ExperienceCostPerLevel` para el nivel actual, y `false`/`cost = 0` cuando la unidad ya está en `maxLevel`; `TryLevelUp` con experiencia suficiente descuenta el costo de `AvailableExperience`, sube el nivel de la unidad, persiste vía `store.Save(...)`, dispara `ProgressChanged` y actualiza `CharacterLevel` de inmediato (FR-005); `TryLevelUp` con experiencia insuficiente devuelve `false` sin modificar `AvailableExperience`/nivel/`CharacterLevel` (FR-006/SC-003, Historia 2 Escenario 2); `TryLevelUp` en `maxLevel` devuelve `false` sin efectos parciales

### Implementation for User Story 2

- [X] T020 [US2] Extender `UnitLevelingController` (mismo archivo que T015, secuencial) en `Assets/Scripts/Gameplay/Battler/UnitLevelingController.cs`: añadir `bool TryGetNextLevelCost(string unitId, out int cost)` y `bool TryLevelUp(string unitId)` con el evento `Action ProgressChanged`, exactamente según [contracts/unit-leveling.md § TryLevelUp](./contracts/unit-leveling.md) (hace pasar T019) — depende de T015
- [X] T021 [P] [US2] Crear `UnitUpgradeUIController` en `Assets/Scripts/View/Battler/UnitUpgradeUIController.cs`: lista `ownedUnits` mostrando nivel actual (`GetUnitLevel`) y costo de la siguiente mejora (`TryGetNextLevelCost`); botón "Mejorar" por unidad habilitado solo si `TryGetNextLevelCost` tiene éxito y `AvailableExperience >= cost`; al pulsar invoca `TryLevelUp` y refresca la lista — depende de T020
- [X] T022 [P] [US2] Extender `PlayerBaseFlowController` (mismo archivo que T016, en paralelo a T021 — ambos solo dependen de T020) en `Assets/Scripts/Gameplay/Battler/PlayerBaseFlowController.cs`: exponer el `UnitLevelingController` construido (o los miembros necesarios) a la capa View para que `UnitUpgradeUIController` pueda enlazarse — depende de T020
- [X] T023 [US2] Extender `PlayerBaseDashboardUIController` (mismo archivo que T017, secuencial) en `Assets/Scripts/View/Battler/PlayerBaseDashboardUIController.cs`: enlazar el botón de navegación a Mejora con el panel Upgrade; refrescar el nivel de personaje/experiencia mostrados cuando `UnitLevelingController.ProgressChanged` se dispare — depende de T021, T022
- [X] T024 [US2] Añadir el hook de QA `[ContextMenu("Grant Test Experience")]` a `PlayerBaseFlowController` (mismo archivo que T022, secuencial; mismo patrón que `BattleStateManager.ClearSavedProgress`) en `Assets/Scripts/Gameplay/Battler/PlayerBaseFlowController.cs`, que otorga una cantidad fija de experiencia de prueba sobre `IPlayerProgressStore` para validación manual sin depender de una feature de recompensas todavía no escrita (quickstart.md Prerrequisitos, research.md §8) — depende de T022
- [X] T025 [US2] Añadir el contenido del panel Upgrade (fila por unidad: nombre, nivel actual, costo de siguiente mejora, botón "Mejorar") a `Assets/Scenes/PlayerBase.unity`, enlazado a `UnitUpgradeUIController` — depende de T018, T021

**Checkpoint**: US1 y US2 funcionan juntas e independientemente — el dashboard y la pantalla de mejora son completamente funcionales, con persistencia entre sesiones (FR-007/SC-005).

---

## Phase 5: User Story 3 - Organizar el equipo antes de entrar en batalla (Priority: P2)

**Goal**: Un jugador elige qué unidades llevar a la próxima batalla desde la pantalla de organización de equipo; esa selección se respeta al entrar en combate, y nunca se permite guardar un equipo vacío.

**Independent Test**: Desde el dashboard, entrar a la pantalla de organización de equipo, elegir un subconjunto de las unidades disponibles, entrar a una batalla y confirmar que solo las unidades seleccionadas están disponibles para desplegar.

### Tests for User Story 3 ⚠️

- [X] T026 [P] [US3] EditMode tests en `Assets/Tests/EditMode/Battler/TeamFormationRosterFilterTests.cs` (archivo nuevo): `activeTeamUnitIds` `null` o vacío ⇒ devuelve `availableUnits` completo; subconjunto de ids válidos ⇒ devuelve esas unidades preservando el orden de `availableUnits` (no el de `activeTeamUnitIds`); ids desconocidos en `activeTeamUnitIds` se ignoran silenciosamente; si la intersección queda vacía ⇒ fallback a `availableUnits` completo; nunca devuelve un array vacío si `availableUnits` no lo es
- [X] T027 [P] [US3] EditMode tests en `Assets/Tests/EditMode/Battler/TeamFormationControllerTests.cs` (archivo nuevo): `TryConfirmFormation` con selección vacía devuelve `false` y no persiste (`ActiveTeamUnitIds` conserva el valor anterior — FR-010, Edge Case de spec.md); `TryConfirmFormation` con selección no vacía persiste vía `store.Save(...)` y actualiza `ActiveTeamUnitIds`; ids duplicados o que no pertenecen a `ownedUnits` se deduplican/descartan antes de persistir
- [X] T028 [P] [US3] PlayMode tests en `Assets/Tests/PlayMode/Battler/TeamFormationBattleIntegrationPlayModeTests.cs` (archivo nuevo): con un `IPlayerProgressStore` doble en memoria inyectado en `BattleStateManager` (mismo mecanismo de inyección por reflexión ya usado para `IChapterProgressStore` en `BattleLoopPlayModeTests`, 002) sembrado con un `activeTeamUnitIds` conocido, `SetupChapter()` deja en `UnitDeploymentController.Slots` únicamente esas unidades (Historia 3 Escenario 2 / FR-009 / SC-004); con `activeTeamUnitIds` `null`/vacío, `Slots` contiene el roster completo del capítulo (fallback)

### Implementation for User Story 3

- [X] T029 [P] [US3] Crear `TeamFormationRosterFilter` (función estática pura: `Apply(UnitDefinition[] availableUnits, string[] activeTeamUnitIds) -> UnitDefinition[]`) en `Assets/Scripts/Gameplay/Battler/TeamFormationRosterFilter.cs`, según [contracts/team-formation.md § TeamFormationRosterFilter](./contracts/team-formation.md) (hace pasar T026)
- [X] T030 [P] [US3] Crear `TeamFormationController` en `Assets/Scripts/Gameplay/Battler/TeamFormationController.cs`: constructor `(IPlayerProgressStore store, IReadOnlyList<UnitDefinition> ownedUnits)`, `ActiveTeamUnitIds` (refleja `store.Load().activeTeamUnitIds`), `TryConfirmFormation(IReadOnlyList<string> selectedUnitIds)` (dedupe, descarta ids ajenos a `ownedUnits`, rechaza vacío sin persistir, si no persiste y actualiza), según [contracts/team-formation.md § TeamFormationController](./contracts/team-formation.md) (hace pasar T027) — depende de T006
- [X] T031 [P] [US3] Modificar `BattleStateManager` en `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: añadir campo privado `IPlayerProgressStore m_PlayerProgressStore` resuelto en `Awake()` (mismo patrón que `m_ProgressStore`, sobre `LocalPlayerProgressStore`/`player-progress.json`); en `SetupChapter()`, reemplazar `m_DeploymentController.Initialize(m_ResourceController, m_ChapterDefinition.AvailableUnits)` (línea 84 actual) por el filtrado vía `TeamFormationRosterFilter.Apply(m_ChapterDefinition.AvailableUnits, m_PlayerProgressStore.Load().activeTeamUnitIds)` antes de `Initialize(...)`, exactamente según [contracts/team-formation.md § Integración con la batalla](./contracts/team-formation.md) (hace pasar T028) — depende de T029, T006
- [X] T032 [US3] Extender `PlayerBaseFlowController` (mismo archivo que T016/T022/T024, secuencial) en `Assets/Scripts/Gameplay/Battler/PlayerBaseFlowController.cs`: construir `TeamFormationController` y exponerlo a la capa View — depende de T030
- [X] T033 [P] [US3] Crear `TeamFormationUIController` en `Assets/Scripts/View/Battler/TeamFormationUIController.cs`: selección pendiente (casillas marcadas en memoria, en la propia View) separada de la selección confirmada (`TeamFormationController.ActiveTeamUnitIds`) — mismo patrón que `SettingsPanelController` (003, research.md §6); botón "Confirmar" deshabilitado si la selección pendiente queda vacía; al confirmar invoca `TryConfirmFormation` y refresca; salir sin confirmar descarta la selección pendiente (Edge Case de spec.md) — depende de T032
- [X] T034 [US3] Extender `PlayerBaseDashboardUIController` (mismo archivo que T017/T023, secuencial) en `Assets/Scripts/View/Battler/PlayerBaseDashboardUIController.cs`: enlazar el botón de navegación a Equipo con el panel Team — depende de T033
- [X] T035 [US3] Añadir el contenido del panel Team (lista de casillas por unidad + botón "Confirmar") a `Assets/Scenes/PlayerBase.unity`, enlazado a `TeamFormationUIController` — depende de T018, T033

**Checkpoint**: US1, US2 y US3 funcionan juntas e independientemente — dashboard, mejora de unidades y organización de equipo completamente funcionales, con la selección de equipo respetada en batalla.

---

## Phase 6: User Story 4 - Dashboard reutilizado entre aventuras (Priority: P3)

**Goal**: El dashboard mantiene el mismo layout y funciones (nivel, experiencia, mejora, organización de equipo) sin importar desde qué banner de aventura se accede, variando únicamente el fondo visual.

**Independent Test**: Entrar a la base desde dos banners de aventura distintos (uno desbloqueado con contenido real y otro, cuando exista) y confirmar que el layout y las funciones del dashboard son idénticos, cambiando solo el fondo visual. (Hoy solo existe un banner jugable real — research.md §7; el segundo queda pendiente de `004-adventure-map-banners`.)

### Implementation for User Story 4

- [X] T036 [US4] Extender `PlayerBaseDashboardUIController` (mismo archivo que T017/T023/T034, secuencial) en `Assets/Scripts/View/Battler/PlayerBaseDashboardUIController.cs`: añadir un campo serializado de fondo (`Sprite`/`Image`) aplicado sobre el fondo de la escena en `Start()`, sin introducir ninguna abstracción de "proveedor de fondo por banner" (research.md §7) — depende de T017
- [X] T037 [US4] Asignar el fondo del banner "Imperio de los Test/Robot" al `PlayerBaseDashboardUIController` en `Assets/Scenes/PlayerBase.unity` (único banner jugable real hoy); dejar documentado en el campo/inspector que queda listo para recibir un segundo fondo el día que exista un segundo banner real de `004-adventure-map-banners` (FR-011, sin impacto en `UnitProgress`/`PlayerExperiencePool`/`TeamFormation`) — depende de T018, T036

**Checkpoint**: Las 4 historias de usuario funcionan de forma independiente y en conjunto — dashboard completo, reutilizable entre aventuras.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T038 Revisar que la implementación final no se haya desviado de [contracts/player-progress-store.md](./contracts/player-progress-store.md) / [contracts/unit-leveling.md](./contracts/unit-leveling.md) / [contracts/team-formation.md](./contracts/team-formation.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación
- [X] T039 Correr la suite completa EditMode + PlayMode (Capítulo 1 + Guardado de Progreso + Menú Principal + Dashboard de Base) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde
- [X] T040 Ejecutar una aproximación automatizada de los 14 pasos de [quickstart.md](./quickstart.md) contra la escena real (mismo enfoque documentado en `specs/002-local-save-progress/tasks.md`/`specs/003-main-menu-config/tasks.md` si no hay acceso a la GUI del Editor) — no reemplaza un walkthrough humano, pero cubre el mismo comportamiento observable de forma reproducible

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — bloquea las 4 historias de usuario
- **User Stories (Fase 3-6)**: todas dependen de Foundational; dentro de cada historia, los tests preceden a su implementación correspondiente
- **Polish (Fase 7)**: depende de que las 4 historias estén completas

### User Story Dependencies

- **US1 (P1)**: puede empezar tras Foundational — sin dependencia de otras historias
- **US2 (P1)**: puede empezar tras Foundational; su Independent Test no depende de US1 en términos de datos (una store en memoria ya sembrada basta), pero su implementación (T020-T025) extiende el mismo `UnitLevelingController`/`PlayerBaseFlowController`/`PlayerBaseDashboardUIController` que creó US1, por lo que en la práctica se implementa después
- **US3 (P2)**: puede empezar tras Foundational; su Independent Test no depende de US1/US2, pero su implementación (T032, T034, T035) extiende `PlayerBaseFlowController`/`PlayerBaseDashboardUIController`/`PlayerBase.unity`, mismos archivos que US1/US2, por lo que también se implementa después en la práctica
- **US4 (P3)**: puede empezar tras Foundational en teoría, pero su único archivo de implementación (`PlayerBaseDashboardUIController`) ya fue creado por US1 y extendido por US2/US3 — se implementa al final por ser la extensión más simple sobre ese archivo compartido

### Within Each User Story

- Tests escritos y en rojo antes de la implementación correspondiente
- Modelos/contratos antes de controladores; controladores antes de UI; UI antes del cableado en escena
- Historia completa (checkpoint) antes de pasar a la siguiente prioridad

### Parallel Opportunities

- T002 y T003 (Fase 2) son independientes entre sí — archivos distintos
- T007 (test de `LocalPlayerProgressStore`) puede ejecutarse en paralelo con la cadena T008-T012 (`UnitLevelingConfig`/`PlayerCharacterLevelCalculator`) — ambas cadenas solo comparten prerrequisitos ya completados de Fase 2
- T008/T009/T010 y T011/T012 (Fase 2) son dos cadenas independientes entre sí — archivos distintos, sin dependencia cruzada
- T013 y T014 (tests de US1) son archivos distintos (EditMode vs. PlayMode) — en paralelo
- T021 (`UnitUpgradeUIController`) y T022 (extensión de `PlayerBaseFlowController`) solo comparten T020 como prerrequisito ya completado — en paralelo
- T026, T027 y T028 (tests de US3) son tres archivos nuevos distintos — en paralelo
- T029 (`TeamFormationRosterFilter`) y T030 (`TeamFormationController`) son independientes entre sí — `TryConfirmFormation` no invoca el filtro (ver contracts/team-formation.md) — en paralelo
- T031 (modificación de `BattleStateManager`) y T033 (`TeamFormationUIController`) avanzan por cadenas de dependencia independientes (T029 vs. T032) y no comparten archivo — en paralelo una vez satisfechos sus propios prerrequisitos
- Las implementaciones de US1/US2/US3/US4 comparten `PlayerBaseFlowController.cs`, `PlayerBaseDashboardUIController.cs` y `PlayerBase.unity`, por lo que sus tareas de implementación sobre esos archivos son intrínsecamente secuenciales entre historias, aunque cada historia sea conceptualmente independiente y su Independent Test no dependa de las otras

---

## Parallel Example: Foundational + User Story 1

```bash
# Fase 2, dos cadenas independientes en paralelo:
Task: "Crear UnitLevelingConfig en Assets/Scripts/Model/Battler/UnitLevelingConfig.cs"
Task: "Crear PlayerCharacterLevelCalculator en Assets/Scripts/Gameplay/Battler/PlayerCharacterLevelCalculator.cs"

# Fase 3 (US1), tests en paralelo:
Task: "EditMode tests en Assets/Tests/EditMode/Battler/UnitLevelingControllerTests.cs"
Task: "PlayMode tests en Assets/Tests/PlayMode/Battler/PlayerBaseFlowPlayModeTests.cs"
```

---

## Implementation Strategy

### MVP First (User Stories 1 y 2 — ambas P1)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante)
3. Completar Fase 3: US1 (dashboard muestra nivel de personaje + experiencia)
4. Completar Fase 4: US2 (mejora de unidades gastando experiencia)
5. **Detener y validar**: correr T013/T014/T019 en verde de forma aislada
6. Esto ya es el MVP real de la feature — spec.md marca ambas historias como P1 porque el dashboard sin poder mejorar unidades ("Historia 2... le da sentido a acumular experiencia") es solo una vista, no un ciclo de progresión completo

### Incremental Delivery

1. Setup + Foundational → guardado local y escena base listos
2. + US1 → vista de nivel/experiencia (parcial, sin acción todavía)
3. + US2 → ciclo de progresión completo (MVP real)
4. + US3 → control táctico de equipo antes de batalla
5. + US4 → reutilización visual entre aventuras
6. Fase 7 → verificación final y quickstart manual

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- US1/US2/US3 comparten `PlayerBaseFlowController.cs`/`PlayerBaseDashboardUIController.cs`/`PlayerBase.unity` porque las tres son, en esencia, vistas sobre el mismo `IPlayerProgressStore` cargado una vez por el mismo controlador de flujo — mismo criterio que 003 usó para `MainMenuFlowController`/`MainMenuUIController`/`MainMenu.unity` entre sus historias
- `UnitLevelingController` se construye de forma incremental entre Historia 1 (T015: solo lectura — `CharacterLevel`/`AvailableExperience`/`GetUnitLevel`) e Historia 2 (T020: `TryGetNextLevelCost`/`TryLevelUp`/`ProgressChanged`) porque el contrato (contracts/unit-leveling.md) define una sola clase para ambas responsabilidades, pero cada historia solo necesita — y solo debe probarse contra — el subconjunto que le corresponde
- `TeamFormationRosterFilter` (T029) no depende de `TeamFormationController` (T030) ni viceversa — el filtro se usa desde `BattleStateManager` (T031) para el consumo en batalla; `TryConfirmFormation` (T030) valida/persiste independientemente, sin invocar el filtro (ver contracts/team-formation.md)
- Historia 4 (P3) es deliberadamente la fase más pequeña — research.md §7 documenta por qué no se introduce ninguna abstracción de "proveedor de fondo por banner" mientras exista un único banner jugable real; su Independent Test completo queda pendiente de un segundo banner de `004-adventure-map-banners`
- T040 probablemente requiera un humano en el Editor de Unity (GUI) para los pasos de inspección visual (fondo aplicado, casillas de equipo), igual que quedó documentado para pasos equivalentes en `specs/002-local-save-progress/tasks.md` y `specs/003-main-menu-config/tasks.md`

## Desviaciones registradas durante la implementación (T038)

- Las filas de lista de `UnitUpgradeUIController`/`TeamFormationUIController` se implementaron como componentes de nivel superior (`UnitUpgradeRowView.cs`, `TeamFormationRowView.cs`, mismo patrón que `ChapterBannerItemView` de 004) en vez de clases anidadas dentro de sus controladores. Se probó primero la variante anidada: Unity serializó la referencia de script del `MonoBehaviour` anidado sin su `guid` (`m_Script: {fileID: X}` sin `guid:`), dejando el componente como "missing script" y por tanto `m_RowTemplate` null tras recargar la escena desde disco. Extraerlas a archivos propios resuelve el problema de raíz y no cambia ningún contrato observable (`UnitUpgradeUIController.Refresh()`/`TeamFormationUIController.OnPanelOpened()` siguen exponiendo el mismo comportamiento).
- `PlayerBase.unity` quedó registrada en `EditorBuildSettings.scenes` en el índice 4 (tras `MainMenu.unity`=0, `AdventureMap.unity`=1, `Chapter1_Battle.unity`=2, `SampleScene.unity`=3), no en el índice 3 asumido en T002 — para cuando se implementó esta feature, `004-adventure-map-banners` ya había registrado `AdventureMap.unity`, un entry que no existía todavía cuando se escribió esta tarea. Sin impacto funcional: la escena queda registrada y accesible, que es lo que exige el contrato.
- La navegación real desde un banner de `AdventureMap.unity` hacia `PlayerBase.unity` no se cableó en esta feature (spec.md §Assumptions ya lo marca fuera de alcance: "esta feature asume que solo se entra a la base desde un banner con contenido de batalla real y desbloqueado"); `PlayerBase.unity` existe y es completamente funcional de forma standalone (mismo patrón que `Chapter1_Battle.unity` es alcanzable manualmente antes de que 004 cableara la navegación real).
