---

description: "Task list template for feature implementation"
---

# Tasks: Escalado Avanzado por Capítulo y Sets de Tesoros

**Input**: Design documents from `/specs/014-chapter-scaling-treasure-sets/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en `001`/`013`.

**Organization**: Tareas agrupadas por historia de usuario (spec.md: US1-US4) para permitir implementación y prueba independiente de cada una.

**Bloqueo externo de spec 013 — RESUELTO**: esta feature modifica tipos y métodos que `013-empire-of-cats-saga` introduce o modifica primero (`ChapterDefinition`, `PlayerProgressSaveData`, `BattleLaunchContext`, `BattleStateManager.SetupChapter()`/`SetOutcome()`, `BattleResourceController`). Las tareas Foundational de spec 013 (`specs/013-empire-of-cats-saga/tasks.md`, T003-T021) están completas y compilando — verificado (2026-07-31) contra el código real (`BattleStateManager.cs`, `PlayerProgressSaveData.cs`): 65/66 tareas de esa feature hechas, solo queda `T063` (validación manual de quickstart, no bloquea código). Las tareas de abajo pueden empezar; donde una tarea edita un método que spec 013 también edita (`SetupChapter()`, `SetOutcome()`), la descripción indica explícitamente sobre qué versión del método (la de spec 013) se construye.

**Nota de alcance (plan.md, Constitution Check)**: sin entradas en Complexity Tracking — todos los cambios son aditivos o escalado en punto de consumo. El hallazgo más significativo de `research.md` (§2) es que "costo de energía por capítulo" **no requiere tabla de datos nueva** (ya resuelto por `ChapterBannerDefinition.EnergyCost` existente); el trabajo real de US2 es la resolución de arco activo (`BattleLaunchContext.RequestedArc`), no una tarea de costo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US1-US4, spec.md)
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Model,Gameplay}/Battler/` (extendidas en esta feature, sin ensamblados nuevos), contenido nuevo en `Assets/ScriptableObjects/Battler/EmpireOfCats/TreasureSets/`, tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Estructura de carpetas del contenido nuevo, dentro de la carpeta `EmpireOfCats/` que spec 013 ya crea.

- [X] T001 Crear la carpeta `Assets/ScriptableObjects/Battler/EmpireOfCats/TreasureSets/` (mismo nivel que `Levels/`/`Units/` de spec 013)

**Checkpoint**: Estructura de carpetas lista.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura de código compartida que las 4 historias de usuario de esta feature consumen — campos nuevos sobre tipos existentes/planeados por spec 013, y los tipos nuevos de sets de tesoros.

**⚠️ CRITICAL**: Ninguna historia de usuario puede darse por completa hasta que esta fase compile y sus tests pasen.

- [X] T002 [P] Extender `Assets/Scripts/Model/Battler/ChapterDefinition.cs`: añadir `m_LevelWidth` (`float`, `[Min(0.1f)]`, default `10f`, sin `FormerlySerializedAs`) y propiedad pública `LevelWidth` ([data-model.md](./data-model.md#chapterdefinition-existente--assetsscriptsmodelbattlerchapterdefinitioncs--campo-nuevo))
- [X] T003 [P] Extender `Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs`: añadir `obtainedTreasureIds: string[] = Array.Empty<string>()` y `grantedTreasureSetIds: string[] = Array.Empty<string>()` (aditivo, sobre el tipo ya extendido por spec 013 con `unlockedBonusUnitIds`) ([data-model.md](./data-model.md#playerprogresssavedata-existente--assetsscriptsmodelbattlerplayerprogresssavedatacs--campos-nuevos))
- [X] T004 [P] EditMode test de round-trip de serialización JSON (SC-005) para `obtainedTreasureIds`/`grantedTreasureSetIds` (confirmar que sobreviven guardar/cargar sin pérdida ni duplicación, y que un guardado previo a esta feature sigue cargando con ambos arrays vacíos) en `Assets/Tests/EditMode/Battler/TreasureSaveDataRoundTripTests.cs` — depende de T003
- [X] T005 [P] Extender `Assets/Scripts/Gameplay/Battler/BattleLaunchContext.cs` (tipo creado por spec 013): añadir `static SagaArcDefinition RequestedArc { get; set; }` ([data-model.md](./data-model.md#battlelaunchcontext-planeado-spec-013--campo-nuevo-de-esta-feature))
- [X] T006 [P] Crear `Assets/Scripts/Model/Battler/TreasureSetDefinition.cs` (nuevo `ScriptableObject`: `SetId`, `DisplayNameKey`, `TreasureIds: string[]`, `PassiveRegenBonus: float [Min(0f)]`, `IsValid` — no vacíos, `TreasureIds.Length > 0`, sin duplicados) ([data-model.md](./data-model.md#treasuresetdefinition-nuevo-scriptableobject-thebattlermodel))
- [X] T007 [P] Crear `Assets/Scripts/Model/Battler/TreasureSetCatalog.cs` (nuevo `ScriptableObject`: `Sets: TreasureSetDefinition[]`) — depende de T006
- [X] T008 Crear `Assets/Scripts/Model/Battler/TreasureSetProgressEvaluator.cs` (static class puro: `IsSetComplete(TreasureSetDefinition, PlayerProgressSaveData)`, `HasRewardsGranted(string, PlayerProgressSaveData)`) — depende de T003, T006 ([contracts/treasure-sets-and-passive-bonus.md](./contracts/treasure-sets-and-passive-bonus.md))
- [X] T009 Refactorizar `Assets/Scripts/Gameplay/Battler/BattleResourceController.cs`: extraer la captura de `m_DesignRegenPerSecond` de `Awake()` (planeada por spec 013) a un método `Initialize()` explícito invocado por `BattleStateManager`, y añadir `ApplyPassiveRegenBonus(float bonus)` (suma a `m_RegenPerSecond` antes de que `Initialize()` capture el valor de diseño) — depende de que spec 013 haya implementado `TryUpgradeRegen`/`m_DesignRegenPerSecond` primero ([contracts/treasure-sets-and-passive-bonus.md](./contracts/treasure-sets-and-passive-bonus.md))
- [X] T010 [P] EditMode test de `TreasureSetDefinition.IsValid` en `Assets/Tests/EditMode/Battler/TreasureSetDefinitionValidationTests.cs` — depende de T006
- [X] T011 [P] EditMode test de `TreasureSetProgressEvaluator` (set completo/incompleto/`HasRewardsGranted`) en `Assets/Tests/EditMode/Battler/TreasureSetProgressEvaluatorTests.cs` — depende de T008

**Checkpoint**: Foundation lista — las 4 historias de usuario pueden implementarse en orden de prioridad.

---

## Phase 3: User Story 1 - Vida de base enemiga escala por capítulo (Priority: P1) 🎯 MVP

**Goal**: La vida máxima de la base enemiga de un nivel escala con el `EnemyStrengthMultiplier` del `SagaArcDefinition` activo (`m_ActiveArc` serializado, spec 013), igual que ya ocurre con las unidades enemigas.

**Independent Test**: Iniciar el mismo nivel bajo dos `SagaArcDefinition` con `EnemyStrengthMultiplier` distintos (`1.0` y `4.0`) y confirmar que la vida máxima inicial de la base enemiga es proporcional al multiplicador, sin cambiar `ChapterDefinition.EnemyBaseMaxHealth` (quickstart.md pasos 1-3).

### Tests for User Story 1

- [X] T012 [P] [US1] PlayMode test del escalado de vida de base enemiga (`EnemyBaseMaxHealth = 500` bajo `1.0×` y `4.0×`, confirmar `500` y `2000` redondeados) en `Assets/Tests/PlayMode/Battler/EnemyBaseHealthScalingPlayModeTests.cs`

### Implementation for User Story 1

- [X] T013 [US1] Extender `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: en `SetupChapter()`, calcular `enemyBaseHealth = Mathf.Max(1, Mathf.RoundToInt(m_ChapterDefinition.EnemyBaseMaxHealth * enemyStrengthMultiplier))` (usando el `enemyStrengthMultiplier` que spec 013 ya resuelve desde `m_ActiveArc`) y pasarlo a `m_EnemyBase.Initialize(...)` en vez del valor sin escalar ([contracts/base-health-width-and-arc-resolution.md](./contracts/base-health-width-and-arc-resolution.md)) — depende de que spec 013 haya implementado la resolución de `enemyStrengthMultiplier` en este método

**Checkpoint**: User Story 1 funcional de forma independiente — vida de base enemiga escala por capítulo (usando solo `m_ActiveArc` serializado; no requiere US2 todavía).

---

## Phase 4: User Story 2 - Costo de energía correcto según capítulo de acceso (Priority: P2)

**Goal**: Al entrar a un nivel desde un banner de un capítulo específico, la batalla usa el `SagaArcDefinition` de ese capítulo (no solo el `m_ActiveArc` fijo por escena), para que los multiplicadores de costo/fuerza (y, por extensión, el escalado de vida de base de US1) correspondan al capítulo real de entrada. El costo de energía en sí ya lo resuelve `ChapterBannerDefinition.EnergyCost` existente, sin cambios.

**Independent Test**: Seleccionar dos banners distintos que apunten al mismo nivel pero con `SagaArcDefinition`/`EnergyCost` distintos; confirmar que la energía descontada y los multiplicadores aplicados en batalla corresponden al banner elegido, no a un valor fijo (quickstart.md pasos 4-6).

### Tests for User Story 2

- [X] T014 [P] [US2] PlayMode test de resolución de arco (`BattleLaunchContext.RequestedArc` distinto de `m_ActiveArc` serializado prevalece; `RequestedArc == null` cae a `m_ActiveArc`; se resetea a `null` tras `SetupChapter()`) en `Assets/Tests/PlayMode/Battler/ArcResolutionFromBannerPlayModeTests.cs` — depende de T005

### Implementation for User Story 2

- [X] T015 [US2] Extender `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: en `SetupChapter()`, resolver `var activeArc = BattleLaunchContext.RequestedArc ?? m_ActiveArc` y resetear `BattleLaunchContext.RequestedArc = null` (mismo patrón que el reseteo de `ZombieOutbreakRequested` de spec 013), usando `activeArc` en vez de `m_ActiveArc` directo para calcular `unitCostMultiplier`/`enemyStrengthMultiplier` ([contracts/base-health-width-and-arc-resolution.md](./contracts/base-health-width-and-arc-resolution.md)) — depende de T005, T013

**Checkpoint**: User Stories 1 y 2 funcionan juntas — el capítulo de entrada (vía banner) determina correctamente tanto costo/fuerza como vida de base enemiga.

> **Nota fuera de alcance de código**: la pantalla de selección de nivel (capa `View`) debe setear `BattleLaunchContext.RequestedArc` desde el `SagaArcDefinition` asociado al `ChapterBannerDefinition` elegido antes de `LoadScene(...)` — no es una tarea de este plan (mismo criterio que spec 013 trata la UI de Brote Zombi).

---

## Phase 5: User Story 3 - Ancho de nivel configurable (Priority: P3)

**Goal**: La posición de la base enemiga (y por tanto el tiempo de recorrido de unidades y el punto de entrada en rango de ataques a distancia) se deriva de `ChapterDefinition.LevelWidth` en vez de un override de escena no versionado.

**Independent Test**: Configurar dos niveles con `LevelWidth` distintos y confirmar que el tiempo de recorrido de la misma unidad hasta la base enemiga difiere en proporción al ancho (quickstart.md pasos 7-9).

### Tests for User Story 3

- [X] T016 [P] [US3] PlayMode test de posicionamiento de base enemiga a partir de `LevelWidth` (`enemyBaseLanePosition == playerBaseLanePosition + LevelWidth`) en `Assets/Tests/PlayMode/Battler/LevelWidthPositioningPlayModeTests.cs` — depende de T002

### Implementation for User Story 3

- [X] T017 [US3] Extender `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: en `SetupChapter()`, calcular `enemyBaseLanePosition = m_PlayerBase.LanePosition + m_ChapterDefinition.LevelWidth` y pasarlo a `m_EnemyBase.Initialize(...)` en vez de reenviar el `LanePosition` actual del prefab ([contracts/base-health-width-and-arc-resolution.md](./contracts/base-health-width-and-arc-resolution.md)) — depende de T002, T013 (mismo bloque de código que US1)
- [X] T018 [US3] **Migración de datos**: abrir `Assets/Scenes/Chapter1_Battle.unity`/`Chapter2_Battle.unity`, leer el `LanePosition` real (override de Inspector) de la instancia de `EnemyBasePrefab` en cada escena, restar el `LanePosition` de `PlayerBasePrefab` de esa misma escena, y asignar esa diferencia como `LevelWidth` en `Assets/ScriptableObjects/Battler/Chapter1/Chapter1.asset` / el `ChapterDefinition` de Capítulo 2 correspondiente — depende de T002, T017
- [X] T019 [US3] PlayMode test de no-regresión: confirmar que, tras T017/T018, la posición resultante de la base enemiga en `Chapter1_Battle.unity`/`Chapter2_Battle.unity` es idéntica a la que tenían antes de esta feature en `Assets/Tests/PlayMode/Battler/LevelWidthMigrationRegressionPlayModeTests.cs` — depende de T018

**Checkpoint**: User Stories 1-3 funcionan juntas — dificultad y ritmo de combate escalan de forma consistente por capítulo/nivel.

---

## Phase 6: User Story 4 - Sets de tesoros con bonificación pasiva de cuenta (Priority: P4)

**Goal**: Al completar todos los tesoros de un `TreasureSetDefinition`, la cuenta del jugador recibe una bonificación pasiva permanente (`PassiveRegenBonus`) sobre `BattleResourceController.RegenPerSecond`, activa desde ese momento en adelante.

**Independent Test**: Ganar dos niveles cuyos tesoros completan un set de prueba; confirmar que la bonificación se otorga exactamente al completar el segundo, y que persiste en batallas posteriores tras reiniciar la aplicación (quickstart.md pasos 10-13).

### Tests for User Story 4

- [X] T020 [P] [US4] PlayMode test del flujo completo tesoro→set→bono: ganar el nivel que completa un `TreasureSetDefinition` de prueba, confirmar `obtainedTreasureIds`/`grantedTreasureSetIds` actualizados y `RegenPerSecond` incrementado en la batalla actual; ganar solo un tesoro de dos, confirmar que no se aplica ningún bono; obtener un tesoro fuera de cualquier set, confirmar que no altera `grantedTreasureSetIds`/`RegenPerSecond` en `Assets/Tests/PlayMode/Battler/TreasureSetPassiveBonusPlayModeTests.cs` — depende de T008, T009
- [X] T020a [P] [US4] PlayMode test de reaplicación de bonificación tras reinicio de sesión (SC-005): con un `PlayerProgressSaveData` cuyo `grantedTreasureSetIds` ya contiene el `SetId` de un `TreasureSetDefinition` de prueba (sin que ocurra ningún `SetOutcome()` en esta sesión — simula reabrir la aplicación con progreso ya guardado), llamar `SetupChapter()` directamente y confirmar que `BattleResourceController.RegenPerSecond` ya refleja `PassiveRegenBonus` del set antes de cualquier evento de victoria en `Assets/Tests/PlayMode/Battler/TreasureSetPassiveBonusPlayModeTests.cs` (mismo archivo que T020) — depende de T008, T009
- [X] T020b [P] [US4] PlayMode test de no-revocación de bonificación tras reconfiguración de set (FR-010, Edge Case spec.md): con un `TreasureSetDefinition` de prueba cuyo `SetId` ya está en `grantedTreasureSetIds`, añadir a `TreasureIds` un tesoro que el jugador todavía no posee (de modo que `TreasureSetProgressEvaluator.IsSetComplete` pasa a devolver `false` para ese set) y confirmar que `SetupChapter()` sigue aplicando el `PassiveRegenBonus` del set (la lectura de sets ya otorgados se hace por membresía en `grantedTreasureSetIds`, no por `IsSetComplete`) en `Assets/Tests/PlayMode/Battler/TreasureSetPassiveBonusPlayModeTests.cs` (mismo archivo que T020/T020a) — depende de T008, T009

### Implementation for User Story 4

- [X] T021 [US4] Extender `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: añadir campo serializado opcional `TreasureSetCatalog m_TreasureSetCatalog` (`null` = sin sets configurados, sin efecto — preserva comportamiento de `Chapter1`/`Chapter2`) — depende de T007
- [X] T022 [US4] Extender `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: en `SetOutcome()`, rama `Victory`, tras el flujo de recompensas de nivel/arco que spec 013 ya implementa — si `m_ChapterDefinition.TreasureRewardId` no está vacío y no está ya en `obtainedTreasureIds`, añadirlo y guardar vía `IPlayerProgressStore` ([contracts/treasure-sets-and-passive-bonus.md](./contracts/treasure-sets-and-passive-bonus.md)) — depende de T003, T021
- [X] T023 [US4] Extender `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: en `SetOutcome()`, tras T022, recorrer `m_TreasureSetCatalog.Sets`; para cada uno con `TreasureSetProgressEvaluator.IsSetComplete(...) && !HasRewardsGranted(...)`, añadir su `SetId` a `grantedTreasureSetIds`, guardar, y llamar `m_ResourceController.ApplyPassiveRegenBonus(set.PassiveRegenBonus)` (activo de inmediato en la batalla actual) — depende de T008, T009, T022
- [X] T024 [US4] Extender `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: en `SetupChapter()`, si `m_TreasureSetCatalog != null`, sumar `PassiveRegenBonus` de todos los sets en `grantedTreasureSetIds` (leído de `PlayerProgressSaveData` vía `IPlayerProgressStore`) y llamar `m_ResourceController.ApplyPassiveRegenBonus(sum)` antes de que la batalla arranque — depende de T009, T021
- [X] T025 [P] [US4] Crear contenido de ejemplo: `Assets/ScriptableObjects/Battler/EmpireOfCats/TreasureSets/EnergyDrink.asset` (`TreasureSetDefinition` con los `TreasureRewardId` de "Corea"/"Mongolia" — spec 013 — y un `PassiveRegenBonus` de referencia) y `Assets/ScriptableObjects/Battler/EmpireOfCats/TreasureSetCatalog.asset` que lo contenga — depende de T006, T007, y de que spec 013 haya autorado `Corea.asset`/`Mongolia.asset` con `TreasureRewardId`

**Checkpoint**: Las 4 historias de usuario funcionan de forma independiente y en conjunto.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificación end-to-end y limpieza final.

- [ ] T026 Ejecutar la validación manual completa de [quickstart.md](./quickstart.md) (los 13 pasos, historias 1-4) sobre el proyecto con spec 013 y esta feature implementadas
- [X] T027 [P] Revisar que ningún test existente de `Assets/Tests/PlayMode/Battler/` que ejercite `BattleStateManager.SetupChapter()`/`SetOutcome()` (incluidos los 8 dobles de `IChapterProgressStore` migrados por spec 013, T013) haya quedado roto por los cambios de T013/T15/T17/T22-T24

---

## Nota de auditoría post-implementación (2026-08-01)

Al retomar esta feature para verificación, se encontró que **T018 y T025 estaban marcadas `[X]` sin haberse ejecutado realmente** — el código (Foundational + US1-US4) sí estaba completo y compilando, pero:

- **T018 (migración de `LevelWidth`)**: `Chapter1.asset`/`Chapter2.asset` seguían en el valor por defecto de clase (`10`), no en `18` (la distancia real -9/9 entre bases que ambas escenas ya usaban). Confirmado con evidencia real: `LevelWidthMigrationRegressionPlayModeTests` (T019) fallaba con `Expected: 9.0f, But was: 1.0f` en ambos casos — es decir, `BattleStateManager.SetupChapter()` habría reposicionado la base enemiga a `LanePosition 1` en cualquier batalla real de Chapter1/Chapter2, una regresión genuina de alcance/distancia de combate. El mismo defecto existía en `Corea.asset`/`Mongolia.asset` (spec 013), que tampoco tenían `LevelWidth` migrado — corregido igual, aunque no era una tarea formal de este documento.
- **T025 (contenido de ejemplo)**: `Assets/ScriptableObjects/Battler/EmpireOfCats/TreasureSets/` estaba vacía y `TreasureSetCatalog.asset` no existía.

**Corrección aplicada**: `Chapter1.asset`/`Chapter2.asset`/`Corea.asset`/`Mongolia.asset` migrados a `LevelWidth = 18`; `EmpireOfCatsContentBuilder.cs` extendido con `BuildTreasureSetCatalog()` (genera `EnergyDrink.asset` — set con los tesoros `kimchi`/`tienda_de_campana` de spec 013 y `PassiveRegenBonus = 1` — y `TreasureSetCatalog.asset`, cableados en `BattleStateManager.m_TreasureSetCatalog` de ambas escenas); `ValidateScene()` extendido para verificar `LevelWidth == 18` y la existencia/validez del catálogo. Verificado tras el fix: **224/224 EditMode + 94/94 PlayMode en verde** (incluye los 2 tests de regresión de `LevelWidth` que antes fallaban), `ValidateScene()` de `EmpireOfCatsContentBuilder`/`AdventureMapContentBuilder` sin errores.

T026 permanece sin marcar deliberadamente: requiere una sesión interactiva de Play Mode (igual que T063 de spec 013), no ejecutada en esta pasada.

## Dependencies & Execution Order

### Phase Dependencies

- **Bloqueo externo**: Foundational de spec 013 (`013-empire-of-cats-saga/tasks.md` T003-T021) debe estar completo y compilando antes de **cualquier** tarea de este documento.
- **Setup (Phase 1)**: Sin dependencias internas — puede empezar en cuanto spec 013 Foundational esté lista.
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA las 4 historias de usuario.
- **User Stories (Phase 3-6)**: Todas dependen de Foundational. US1 es independiente; US2 depende de que el bloque de código de US1 en `SetupChapter()` ya exista (mismo método, edición secuencial); US3 depende del mismo bloque por el mismo motivo; US4 es independiente de US1-US3 salvo por T009 (Foundational).
- **Polish (Phase 7)**: Depende de que las 4 historias estén completas.

### User Story Dependencies

- **User Story 1 (P1)**: Puede empezar tras Foundational. Sin dependencia de otras historias de esta feature (sí depende de que spec 013 resuelva `enemyStrengthMultiplier` en `SetupChapter()`).
- **User Story 2 (P2)**: Técnicamente independiente en su propósito, pero su única tarea de implementación (T015) edita la misma sección de `SetupChapter()` que T013 (US1) ya modificó — ejecutar después de US1 para evitar conflictos de merge en el mismo método, no por dependencia funcional real.
- **User Story 3 (P3)**: Mismo caso que US2 — edita el mismo bloque de `SetupChapter()` que T013 (US1) toca (la llamada a `m_EnemyBase.Initialize(...)`). Ejecutar después de US1.
- **User Story 4 (P4)**: Independiente de US1-US3 en el código de producción (toca `SetOutcome()` y un campo nuevo, no la sección de `SetupChapter()` que las otras tres comparten) — puede implementarse en paralelo a US1-US3 si hay capacidad, ambas ramas conviven en el mismo archivo pero en métodos distintos.

### Parallel Opportunities

- T002, T003, T005, T006 (Foundational) son archivos/tipos distintos sin dependencias entre sí — paralelizables.
- T010, T011 (tests EditMode de Foundational) paralelizables entre sí una vez sus sujetos (T006, T008) existen.
- US4 (T020-T025) puede desarrollarse en paralelo a US1-US3 (T012-T019) por un segundo desarrollador, dado que tocan métodos distintos de `BattleStateManager` (`SetOutcome()` vs `SetupChapter()`) — el único punto de integración compartido es T009 (Foundational), ya resuelto antes de que ambas ramas empiecen.

---

## Parallel Example: Foundational

```bash
# Lanzar en paralelo (archivos distintos, sin dependencias pendientes):
Task: "Extender ChapterDefinition.cs con m_LevelWidth"
Task: "Extender PlayerProgressSaveData.cs con obtainedTreasureIds/grantedTreasureSetIds"
Task: "Extender BattleLaunchContext.cs con RequestedArc"
Task: "Crear TreasureSetDefinition.cs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Confirmar Foundational de spec 013 completo.
2. Completar Phase 1 (Setup) + Phase 2 (Foundational de esta feature).
3. Completar Phase 3 (US1 — vida de base enemiga escala).
4. **STOP and VALIDATE**: quickstart.md pasos 1-3, de forma independiente.

### Incremental Delivery

1. Foundational (spec 013 + esta feature) → base lista.
2. US1 → validar → vida de base enemiga escala correctamente (MVP).
3. US2 → validar → el capítulo de entrada (banner) determina el arco activo de punta a punta.
4. US3 → validar → ritmo de combate por nivel es data-driven, sin regresión en `Chapter1`/`Chapter2`.
5. US4 → validar → sets de tesoros con bonificación pasiva, independiente de US1-US3.

### Parallel Team Strategy

Con dos desarrolladores tras Foundational: Desarrollador A toma US1 → US2 → US3 (secuencial, mismo método `SetupChapter()`); Desarrollador B toma US4 en paralelo (método `SetOutcome()` distinto). Integrar y correr Phase 7 (Polish) al final.

---

## Notes

- [P] tasks = archivos distintos, sin dependencias.
- [Story] label mapea la tarea a su historia de usuario para trazabilidad.
- T013/T015/T017 comparten el mismo método (`BattleStateManager.SetupChapter()`) — no son `[P]` entre sí pese a pertenecer a historias distintas; ejecutar en el orden US1 → US2 → US3.
- Confirmar que los tests fallan antes de implementar.
- Commit tras cada tarea o grupo lógico.
- Detenerse en cada checkpoint para validar la historia de forma independiente.
