---

description: "Task list template for feature implementation"
---

# Tasks: Bibliotecas de Consulta (Cat Guide / Enemy Guide / Treasure Menu)

**Input**: Design documents from `/specs/019-library-screens/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/enemy-encounter-tracking.md](./contracts/enemy-encounter-tracking.md), [contracts/library-builders.md](./contracts/library-builders.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en 001-018.

**Organization**: Tareas agrupadas por historia de usuario (US1-US3, según spec.md). Las 3 historias son independientes entre sí — cada biblioteca tiene su propia fuente de datos, sin ningún tipo compartido entre ellas (a diferencia de specs anteriores, no hay Fase Foundational bloqueante).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Model,Gameplay,View}/Battler/`, herramientas de contenido en `Assets/Editor/Battler/`, tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (001-018) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde antes de empezar, como línea base de referencia. (248 EditMode + 130 PlayMode, 0 fallos)

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational

**Purpose**: N/A — a diferencia de specs anteriores, las 3 historias de usuario de esta feature no comparten ningún tipo de dato ni punto de código común (research.md §6: cada biblioteca es una función pura sobre su propia fuente de datos). No hay ninguna tarea bloqueante compartida; se pasa directo a las historias de usuario.

**Checkpoint**: N/A.

---

## Phase 3: User Story 1 - Consultar las unidades poseídas y sus estadísticas (Cat Guide) (Priority: P1) 🎯 MVP

**Goal**: El jugador ve, desde la Base del Jugador, todas sus unidades poseídas con sus estadísticas efectivas actuales.

**Independent Test**: Con al menos una unidad bonus desbloqueada, entrar al Cat Guide y confirmar que aparecen tanto las unidades base como la bonus, cada una con sus stats (spec.md US1).

### Tests for User Story 1 ⚠️

- [X] T002 [P] [US1] EditMode test en `Assets/Tests/EditMode/Battler/CatGuideBuilderTests.cs` (archivo nuevo): `CatGuideBuilder.Build` con dobles de `IReadOnlyList<UnitDefinition>`/`UnitLevelingController`/`UnitEvolutionController` produce una `CatGuideEntry` por unidad poseída, con `Level`/`Stage`/`EffectiveStats` correctos (FR-002); `ownedUnits` vacío ⇒ lista vacía sin error (FR-009)

### Implementation for User Story 1

- [X] T003 [US1] Crear `CatGuideEntry`/`CatGuideBuilder.Build(ownedUnits, leveling, evolution)` en `Assets/Scripts/Gameplay/Battler/CatGuideBuilder.cs`, según [contracts/library-builders.md § CatGuideBuilder](./contracts/library-builders.md) (hace pasar T002)
- [X] T004 [P] [US1] Crear `CatGuideUIController` (componente View: lista de filas, `Initialize(IReadOnlyList<CatGuideEntry>)`, sin ninguna acción de escritura) en `Assets/Scripts/View/Battler/CatGuideUIController.cs`, mismo patrón de solo-renderizado que `TeamFormationUIController` — depende de T003
- [X] T005 [US1] Extender `Assets/Editor/Battler/PlayerBaseContentBuilder.cs`: instanciar el template de `CatGuideUIController` en `PlayerBase.unity` y cablearlo con `PlayerBaseFlowController.OwnedUnits`/`Leveling`/`Evolution` — depende de T004

**Checkpoint**: US1 completa y verificable de forma independiente.

---

## Phase 4: User Story 2 - Consultar los enemigos ya enfrentados y sus estadísticas (Enemy Guide) (Priority: P1) 🎯 MVP

**Goal**: El jugador ve, desde la Base del Jugador, los enemigos que ya aparecieron en alguna de sus batallas, con sus stats base.

**Independent Test**: Jugar una batalla donde aparezca al menos un enemigo nuevo, volver a la Base del Jugador, entrar al Enemy Guide y confirmar que ese enemigo aparece listado con sus stats (spec.md US2).

### Tests for User Story 2 ⚠️

- [X] T006 [P] [US2] Añadir `encounteredEnemyIds: string[]` (default vacío) a `Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs`, sin bump de `formatVersion`
- [X] T007 [P] [US2] Crear `EnemyCatalog` (`ScriptableObject`: `m_Enemies: UnitDefinition[]`; método `Resolve(string) : UnitDefinition`) en `Assets/Scripts/Model/Battler/EnemyCatalog.cs`, según [data-model.md § EnemyCatalog](./data-model.md#enemycatalog-nuevo-scriptableobject-assetsscriptsmodelbattlerenemycatalogcs)
- [X] T008 [P] [US2] EditMode test en `Assets/Tests/EditMode/Battler/EnemyGuideBuilderTests.cs` (archivo nuevo): `EnemyGuideBuilder.Build` filtra `catalog.Enemies` a los presentes en `progress.encounteredEnemyIds` (FR-003); `catalog == null` o `encounteredEnemyIds` vacío ⇒ lista vacía sin error (FR-009); un enemigo del catálogo nunca enfrentado no aparece (US2 Escenario 3) — depende de T006, T007

### Implementation for User Story 2

- [X] T009 [US2] Crear `EnemyGuideEntry`/`EnemyGuideBuilder.Build(catalog, progress)` en `Assets/Scripts/Model/Battler/EnemyGuideBuilder.cs`, según [contracts/library-builders.md § EnemyGuideBuilder](./contracts/library-builders.md) (hace pasar T008) — depende de T006, T007
- [X] T010 [US2] En `Assets/Scripts/Gameplay/Battler/EnemyWaveSpawner.cs`: añadir el evento `EnemyEncountered: Action<UnitDefinition>`, disparado al final de `SpawnEnemy(UnitDefinition, float)` (oleada normal y de refuerzo por igual, ambas ya pasan por ese método), según [contracts/enemy-encounter-tracking.md § SpawnEnemy](./contracts/enemy-encounter-tracking.md)
- [X] T011 [US2] En `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`: suscribirse a `m_EnemyWaveSpawner.EnemyEncountered` en `Awake()`; implementar el handler que añade `unit.UnitId` a `playerProgress.encounteredEnemyIds` de forma idempotente y persiste, según [contracts/enemy-encounter-tracking.md § BattleStateManager](./contracts/enemy-encounter-tracking.md) — depende de T006, T010
- [X] T012 [P] [US2] PlayMode test en `Assets/Tests/PlayMode/Battler/EnemyEncounterTrackingPlayModeTests.cs` (archivo nuevo): un enemigo generado en batalla (con `IPlayerProgressStore` inyectado) queda en `encounteredEnemyIds` al finalizar, independientemente del resultado de la batalla; un enemigo planeado en la oleada pero nunca generado (batalla terminada antes de su `spawnTimeSeconds`) no queda registrado (US2 Escenario 3); un `RetryBattle()` no duplica la entrada de un enemigo ya registrado — depende de T010, T011 (verifica el contrato completo)
- [X] T013 [P] [US2] Crear `EnemyGuideUIController` (componente View, mismo patrón que T004) en `Assets/Scripts/View/Battler/EnemyGuideUIController.cs` — depende de T009
- [X] T014 [US2] Extender `Assets/Editor/Battler/PlayerBaseContentBuilder.cs` (mismo archivo que T005, secuencial): crear un `EnemyCatalog` de ejemplo con los enemigos ya definidos en `001`/`010`/`013` (`Assets/ScriptableObjects/Battler/EnemyCatalog.asset`), instanciar el template de `EnemyGuideUIController` en `PlayerBase.unity` y cablearlo — depende de T007, T013

**Checkpoint**: US1 y US2 funcionan de forma independiente — el registro de enemigos enfrentados y su consulta quedan operativos de punta a punta.

---

## Phase 5: User Story 3 - Consultar el progreso de tesoros por set (Treasure Menu) (Priority: P2)

**Goal**: El jugador ve, desde la Base del Jugador, el progreso de cada set de tesoros configurado.

**Independent Test**: Completar un nivel que otorga un tesoro de un set configurado, entrar al Treasure Menu y confirmar que ese set refleja el nuevo progreso (spec.md US3).

### Tests for User Story 3 ⚠️

- [X] T015 [P] [US3] EditMode test en `Assets/Tests/EditMode/Battler/TreasureMenuBuilderTests.cs` (archivo nuevo): `TreasureMenuBuilder.Build` calcula `ObtainedCount`/`TotalCount`/`BonusGranted` correctos por set (FR-006); un set sin ningún tesoro obtenido ⇒ `ObtainedCount == 0` sin error (FR-009); `catalog == null` ⇒ lista vacía sin error

### Implementation for User Story 3

- [X] T016 [US3] Crear `TreasureMenuEntry`/`TreasureMenuBuilder.Build(catalog, progress)` en `Assets/Scripts/Model/Battler/TreasureMenuBuilder.cs`, según [contracts/library-builders.md § TreasureMenuBuilder](./contracts/library-builders.md), reutilizando `TreasureSetProgressEvaluator.HasRewardsGranted` (014) (hace pasar T015)
- [X] T017 [P] [US3] Crear `TreasureMenuUIController` (componente View, mismo patrón que T004/T013) en `Assets/Scripts/View/Battler/TreasureMenuUIController.cs` — depende de T016
- [X] T018 [US3] Extender `Assets/Editor/Battler/PlayerBaseContentBuilder.cs` (mismo archivo que T005/T014, secuencial): instanciar el template de `TreasureMenuUIController` en `PlayerBase.unity` y cablearlo con el `TreasureSetCatalog` ya existente de `014` — depende de T017

**Checkpoint**: Las 3 historias de usuario quedan completas e independientemente funcionales.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T019 [P] Revisar que la implementación final no se haya desviado de [contracts/enemy-encounter-tracking.md](./contracts/enemy-encounter-tracking.md) / [contracts/library-builders.md](./contracts/library-builders.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación. Sin desviaciones — única adición no documentada explícitamente en los contratos: `PlayerBaseFlowController.EnemyCatalog`/`TreasureSetCatalog`/`Progress` (propiedades públicas nuevas) como mecanismo para que `EnemyGuideUIController`/`TreasureMenuUIController` sigan el mismo patrón de referencia a `PlayerBaseFlowController` que `CatGuideUIController`/`TeamFormationUIController`, en vez de que cada `UIController` resuelva su propio `IPlayerProgressStore` — consistente con "mismo patrón que TeamFormationUIController" ya indicado en plan.md Project Structure para los 3 controllers.
- [X] T020 Correr la suite completa EditMode + PlayMode (001-019) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde. **Resultado**: 257 EditMode (248 heredados + 9 nuevos) y 133 PlayMode (130 heredados + 3 nuevos) — 100% en verde, 0 fallos. Adicionalmente se corrió `PlayerBaseContentBuilder.Build`/`ValidateScene` en modo batch: escena generada y validada sin referencias nulas ni datos faltantes.
- [ ] T021 Ejecutar los 9 pasos de validación manual de [quickstart.md](./quickstart.md) contra `PlayerBase.unity`/una batalla real — **probablemente requiera el Editor con GUI**, mismo criterio documentado para pasos equivalentes en specs anteriores

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias
- **Foundational (Fase 2)**: N/A, sin tareas
- **US1/US2/US3 (Fases 3-5)**: cada una depende solo de Setup — son completamente independientes entre sí en su lógica de datos
- **Polish (Fase 6)**: depende de que las 3 historias estén completas

### User Story Dependencies

- **US1 (P1)**: sin dependencia de otras historias
- **US2 (P1)**: sin dependencia de otras historias — es la única que introduce un dato persistido nuevo (`encounteredEnemyIds`)
- **US3 (P2)**: sin dependencia de otras historias; prioridad P2 porque expone progreso que el jugador ya puede inferir jugando (spec.md Why-priority), no por ninguna dependencia técnica de US1/US2
- Las 3 comparten `Assets/Editor/Battler/PlayerBaseContentBuilder.cs` (T005/T014/T018) por conveniencia de contenido (un único builder para toda la escena `PlayerBase.unity`), no por una dependencia conceptual — son ediciones secuenciales del mismo archivo, mismo patrón ya documentado en specs anteriores para archivos compartidos

### Parallel Opportunities

- T002 (test US1), T006/T007/T008 (US2), T015 (test US3) pueden prepararse en paralelo entre sí — ninguna depende de las otras historias
- T004, T013, T017 (los 3 `UIController`) son independientes entre sí — archivos distintos
- T010 (evento en `EnemyWaveSpawner`) es independiente de T006/T007/T009 (datos de `EnemyGuideBuilder`) — se puede preparar en paralelo, aunque T011 necesite ambos

---

## Parallel Example: User Story 2

```bash
# Lanzar en paralelo los 3 tipos de datos independientes de US2 (archivos distintos):
Task: "Añadir encounteredEnemyIds a Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs"
Task: "Crear EnemyCatalog en Assets/Scripts/Model/Battler/EnemyCatalog.cs"
Task: "Añadir el evento EnemyEncountered a Assets/Scripts/Gameplay/Battler/EnemyWaveSpawner.cs"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Fase 1: Setup
2. Completar Fase 3: US1 (Cat Guide)
3. Completar Fase 4: US2 (Enemy Guide) — ambas P1, spec.md las trata como las de mayor valor de consulta
4. **Detener y validar**: correr T002/T008/T012 en verde de forma aislada, luego el quickstart.md pasos 1-6 con GUI
5. Esto ya es útil por sí solo: las dos bibliotecas de mayor uso esperado (unidades/enemigos) funcionan de punta a punta

### Incremental Delivery

1. Setup → línea base confirmada
2. + US1 → Cat Guide funcional
3. + US2 → Enemy Guide funcional, con el registro de enfrentamientos ya operativo
4. + US3 → Treasure Menu, cerrando las 3 bibliotecas
5. Fase 6 → verificación final y quickstart manual con GUI

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- A diferencia de `007`-`018`, esta feature no tiene Fase Foundational — cada historia es una vertical completa e independiente desde Setup (research.md §6)
- T005/T014/T018 comparten `PlayerBaseContentBuilder.cs`, siguiendo el mismo patrón de edición secuencial de un archivo compartido ya documentado en specs anteriores
- El registro de enemigos enfrentados (T010/T011) es el único punto de esta feature que toca código de combate ya existente (`EnemyWaveSpawner`) — se limita a un evento de notificación, sin alterar el timing ni el comportamiento de generación de oleadas ya construido (FR-010)
- T021 probablemente requiera un humano en el Editor de Unity (GUI) para la inspección visual de las 3 pantallas, igual que quedó documentado para pasos equivalentes en specs anteriores
