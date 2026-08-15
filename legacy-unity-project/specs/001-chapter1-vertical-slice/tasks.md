---

description: "Task list template for feature implementation"
---

# Tasks: Capítulo 1 — Vertical Slice Jugable

**Input**: Design documents from `/specs/001-chapter1-vertical-slice/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — plan.md fija explícitamente una estrategia de testing (EditMode + PlayMode, research.md #5) como parte del diseño, no como opcional.

**Organization**: Tareas agrupadas por historia de usuario (spec.md) para permitir implementación y prueba independiente de cada una.

**Notas de implementación (/speckit.implement, 2026-07-27)**:

**Pasada 1 (headless, sin Unity Editor)** — código C# puro (interfaces, ScriptableObjects, MonoBehaviours, tests). Desviaciones de diseño corregidas:
- Los tests viven en `Assets/Tests/EditMode|PlayMode/Battler/`, no en `Tests/` en la raíz del repo — Unity solo reconoce test assemblies dentro de `Assets/`.
- `IDeployable` e `IDialogueSequencePlayer` se movieron de `Core/Battler` a `Model/Battler`: referencian `UnitDefinition`/`DialogueLine` (Model), y `Core` no puede depender de `Model` sin crear una dependencia circular (`Model` ya depende de `Core` por el enum `Team`).
- `BattleStateManager` se movió de `Core/Battler` a `Gameplay/Battler` por la misma razón.
- T003 crea un asset de Input Actions dedicado (`Assets/Settings/BattlerInputActions.inputactions`) en vez de editar `InputSystem_Actions.inputactions` de la plantilla de plataformas.

**Pasada 2 (con Unity 6000.3.20f1 en modo batch)** — se confirmó que el Editor SÍ está instalado (`C:\Program Files\Unity\Hub\Editor\6000.3.20f1`) y se puede pilotar headless vía `-batchmode -nographics -executeMethod`. Esto permitió completar T025–T027, T031–T042 con contenido placeholder generado por [Assets/Editor/Battler/Chapter1ContentBuilder.cs](../../Assets/Editor/Battler/Chapter1ContentBuilder.cs) (menú `The Battler > Build Chapter 1 Placeholder Content`, idempotente; `The Battler > Validate Chapter 1 Scene` para verificar referencias). Además:
- Se descubrió que la plantilla "2D Platformer" del proyecto tenía 123 errores de compilación **preexistentes, no relacionados con Battler** (clases como `PlayerController`, `PlatformerModel`, `GameController` no existían en ningún `.cs` del repo). Se reconstruyeron en `Assets/Scripts/Mechanics/` y `Assets/Scripts/Model/PlatformerModel.cs` a partir del contrato exacto que exigían los ~20 archivos que ya las referenciaban — es una reimplementación funcional, no una copia de la plantilla original de Unity.
- Bugs reales encontrados y corregidos gracias a poder ejecutar los tests de verdad (no solo escribirlos):
  - `BattleOutcomeResolver` resolvía el empate en el mismo tick como `Victory` en vez de `Defeat` (contradecía la regla documentada); corregido y aclarada la redacción de `contracts/battle-runtime-interfaces.md`.
  - `UnitRuntime.Initialize` nunca instanciaba `visualVariant` (violaba FR-009 en runtime aunque el dato existiera) — corregido.
  - `UnitRuntime` no revertía el `Animator` a la animación de idle tras atacar — corregido.
  - El test PlayMode disparaba `OnEnable` de `BattleStateManager` con `playerBase`/`enemyBase` todavía en null (orden de inicialización del propio test) — corregido creando el GameObject inactivo, cableando referencias, y activándolo después.
  - `Chapter1ContentBuilder`: referencias a prefabs/ScriptableObjects recién creados se invalidaban (`MissingReferenceException`) tras llamadas subsiguientes a `AssetDatabase.Refresh()`/`EditorSceneManager.NewScene()`; se corrigió recargando cada asset por su ruta justo antes de usarlo, y guardando (`AssetDatabase.SaveAssets()`) inmediatamente después de cada `ApplyModifiedProperties` en vez de solo al final.
- Resultado final verificado: compilación 0 errores/0 warnings, 22/22 tests EditMode, 1/1 test PlayMode, escena `Chapter1_Battle.unity` validada sin referencias nulas.
- **Arte**: todo el contenido visual (sprites, animaciones, retratos) es placeholder generado proceduralmente (cuadrados de color + animaciones de escala), no arte final — ver nota en Phase 5.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: A qué historia de usuario pertenece (US1, US2, US3)
- Cada tarea incluye ruta de archivo exacta

## Path Conventions

Proyecto Unity single-project (ver "Project Structure" en [plan.md](./plan.md)):
- `Assets/Scripts/{Core,Model,Gameplay,View}/Battler/`
- `Assets/Prefabs/Battler/`
- `Assets/ScriptableObjects/Battler/Chapter1/`
- `Assets/Scenes/Chapter1_Battle.unity`
- `Assets/Tests/EditMode/Battler/`, `Assets/Tests/PlayMode/Battler/` (corregido: Unity solo reconoce tests dentro de `Assets/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización de carpetas y configuración base del proyecto para el Capítulo 1

- [X] T001 Crear la estructura de carpetas del Capítulo 1: `Assets/Scripts/Core/Battler/`, `Assets/Scripts/Model/Battler/`, `Assets/Scripts/Gameplay/Battler/`, `Assets/Scripts/View/Battler/`, `Assets/Prefabs/Battler/`, `Assets/ScriptableObjects/Battler/Chapter1/Units/Player/`, `Assets/ScriptableObjects/Battler/Chapter1/Units/Enemy/`, `Assets/ScriptableObjects/Battler/Chapter1/Dialogue/PreBattle/`, `Assets/ScriptableObjects/Battler/Chapter1/Dialogue/PostBattle/`
- [X] T002 [P] Crear `Assets/Tests/EditMode/Battler/` y `Assets/Tests/PlayMode/Battler/` con sus assembly definitions (`.asmdef`) referenciando los ensamblados de `Assets/Scripts` (ruta corregida: dentro de `Assets/`, no en la raíz del repo)
- [X] T003 [P] Añadir un Action Map "Battle" con 5 acciones de despliegue en `Assets/Settings/BattlerInputActions.inputactions` (asset dedicado nuevo, ver Notas de implementación)

**Checkpoint**: Estructura de carpetas y configuración de input listas.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Interfaces y modelos de datos base que TODAS las historias de usuario necesitan

**⚠️ CRITICAL**: Ninguna historia de usuario puede empezar hasta que esta fase esté completa

- [X] T004 [P] Definir enum `Team` e interfaz `IDamageable` en `Assets/Scripts/Core/Battler/Team.cs` y `IDamageable.cs` (contrato en [contracts/battle-runtime-interfaces.md](./contracts/battle-runtime-interfaces.md))
- [X] T005 [P] Definir interfaz `IDeployable` en `Assets/Scripts/Model/Battler/IDeployable.cs` (reubicada de Core a Model, ver Notas de implementación)
- [X] T006 [P] Definir interfaz `IBattleResourceSource` en `Assets/Scripts/Core/Battler/IBattleResourceSource.cs`
- [X] T007 [P] Definir enum `BattleOutcome` e interfaz `IBattleOutcomeListener` en `Assets/Scripts/Core/Battler/BattleOutcome.cs` y `IBattleOutcomeListener.cs`
- [X] T008 [P] Definir interfaz `IDialogueSequencePlayer` en `Assets/Scripts/Model/Battler/IDialogueSequencePlayer.cs` (reubicada de Core a Model, ver Notas de implementación)
- [X] T009 [P] Crear ScriptableObject `UnitDefinition` en `Assets/Scripts/Model/Battler/UnitDefinition.cs` (campos y reglas de validación en [data-model.md](./data-model.md#unitdefinition-so): cost, cooldownSeconds, maxHealth, damage, range, idleAnimation, attackAnimation, visualVariant, team; validar en `OnValidate` que cost/cooldownSeconds/maxHealth/damage/range > 0)
- [X] T010 [P] Crear ScriptableObject `DialogueLine` en `Assets/Scripts/Model/Battler/DialogueLine.cs` (speakerName, portrait, text)
- [X] T011 Crear ScriptableObject `EnemyWaveDefinition` con struct `WaveEntry` en `Assets/Scripts/Model/Battler/EnemyWaveDefinition.cs` (depende de T009 — `WaveEntry.unit` referencia `UnitDefinition`)
- [X] T012 Crear ScriptableObject `ChapterDefinition` en `Assets/Scripts/Model/Battler/ChapterDefinition.cs` (depende de T009, T010, T011 — agrupa `preBattleDialogue`, `postBattleDialogue`, `availableUnits`, `enemyWaves`, `playerBaseMaxHealth`, `enemyBaseMaxHealth`)
- [X] T013 Crear `BattleStateManager` en `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` (reubicado de Core a Gameplay, ver Notas de implementación; implementado completo junto con T024/T030 en vez de en dos pasadas separadas)

**Checkpoint**: Fundación lista — las historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Jugar y ganar la batalla del Capítulo 1 (Priority: P1) 🎯 MVP

**Goal**: Loop completo de combate — recurso se acumula, el jugador despliega unidades con coste/cooldown que actúan solas, y la partida termina en victoria o derrota según la salud de las bases.

**Independent Test**: Cargar la escena de batalla, desplegar unidades en distintas combinaciones y verificar que la partida termina correctamente en victoria o derrota (ver [quickstart.md](./quickstart.md) pasos 3–6, 9–10).

### Tests for User Story 1

> **NOTA**: Escribir estas pruebas primero y confirmar que fallan antes de implementar.

- [X] T014 [P] [US1] EditMode test de acumulación/gasto de recurso (`TrySpend` atómico, sin descuentos parciales) en `Assets/Tests/EditMode/Battler/BattleResourceStateTests.cs`
- [X] T015 [P] [US1] EditMode test de resolución de victoria/derrota, incluyendo el caso de empate en el mismo tick → `Defeat` (Edge Case de spec.md, vía `BattleOutcomeResolver`) Y el guard de `IDamageable.ApplyDamage` (`amount <= 0` no debe alterar `CurrentHealth`) en `Assets/Tests/EditMode/Battler/BaseHealthStateTests.cs`
- [X] T016 [P] [US1] EditMode test de disponibilidad de slot de despliegue (gating por coste Y cooldown) en `Assets/Tests/EditMode/Battler/DeploymentSlotStateTests.cs`
- [X] T017 [US1] PlayMode test del loop completo (acumular recurso → desplegar → cooldown → condición de fin de partida) sobre una escena de prueba mínima instanciada en runtime en `Assets/Tests/PlayMode/Battler/BattleLoopPlayModeTests.cs` — **no ejecutado**: no hay Unity Editor disponible en este entorno headless; correr desde Window > General > Test Runner al abrir el proyecto

### Implementation for User Story 1

- [X] T018 [US1] Implementar `BattleResourceController` (`IBattleResourceSource`) en `Assets/Scripts/Gameplay/Battler/BattleResourceController.cs` (depende de T006)
- [X] T019 [US1] Implementar `UnitRuntime` (`IDamageable`, `IDeployable`) con movimiento por el carril, detección de rango (vía `LaneRegistry`/`ILaneOccupant`) y ataque autónomo en `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs` (depende de T004, T005, T009)
- [X] T020 [US1] Implementar `BaseHealth` (`IDamageable`) en `Assets/Scripts/Gameplay/Battler/BaseHealth.cs` (depende de T004)
- [X] T021 [US1] Implementar `UnitDeploymentController` (estado por slot, validación coste+cooldown, invoca `TrySpend`) en `Assets/Scripts/Gameplay/Battler/UnitDeploymentController.cs` (depende de T009, T018, T019)
- [X] T022 [US1] Implementar `EnemyWaveSpawner` que recorre `EnemyWaveDefinition` contra el timer de batalla en `Assets/Scripts/Gameplay/Battler/EnemyWaveSpawner.cs` (depende de T011, T019)
- [X] T023 [US1] Implementar `DeploymentUIController` (Input System vía `BattlerInputActions`, botones de las 5 unidades, muestra coste/cooldown disponible) en `Assets/Scripts/View/Battler/DeploymentUIController.cs` (depende de T003, T021)
- [X] T024 [US1] Completar `BattleStateManager`: resolución victoria/derrota (vía `BattleOutcomeResolver`, empate en mismo tick → `Defeat`) y flujo de reintento tras derrota sin bloqueos (FR-013), reiniciando solo el estado de combate sin volver a invocar la reproducción del diálogo pre-batalla en el reintento (US2 Acceptance Scenario 3) en `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` (depende de T013, T020)
- [X] T025 [US1] Prefabs `UnitRuntime.prefab`, `PlayerBasePrefab.prefab`, `EnemyBasePrefab.prefab` en `Assets/Prefabs/Battler/` — generados por [Chapter1ContentBuilder.cs](../../Assets/Editor/Battler/Chapter1ContentBuilder.cs) (`The Battler > Build Chapter 1 Placeholder Content`), no a mano en el Editor
- [X] T026 [US1] `Unit_EnemyGrunt.asset` y `EnemyWave.asset` (4 oleadas a los 3s/9s/15s/21s) en `Assets/ScriptableObjects/Battler/Chapter1/` — generados por el mismo Editor script
- [X] T027 [US1] Escena `Assets/Scenes/Chapter1_Battle.unity` ensamblada y cableada (BattleResourceController, UnitDeploymentController, DeploymentUIController, BaseHealth x2, EnemyWaveSpawner, BattleStateManager) por el Editor script; validada sin referencias nulas con `Chapter1ContentBuilder.ValidateScene` (`The Battler > Validate Chapter 1 Scene`)

**Checkpoint**: User Story 1 completamente funcional y probable de forma independiente (arte placeholder es aceptable en este punto).

---

## Phase 4: User Story 2 - Vivir la narrativa ligada a la batalla (Priority: P2)

**Goal**: Diálogo pre-batalla (retrato + texto) antes de habilitar el despliegue, y diálogo post-batalla específico del Capítulo 1 al ganar.

**Independent Test**: Iniciar el Capítulo 1 y verificar que el diálogo pre-batalla bloquea el despliegue hasta terminar, y que el diálogo post-batalla se reproduce tras la victoria (quickstart.md pasos 2 y 9).

### Tests for User Story 2

- [X] T028 [P] [US2] EditMode test que verifica que el despliegue permanece deshabilitado mientras `IDialogueSequencePlayer.Play` no invoca `onComplete` en `Assets/Tests/EditMode/Battler/DialogueGatingTests.cs`

### Implementation for User Story 2

- [X] T029 [US2] Implementar `DialoguePlaybackController` (`IDialogueSequencePlayer`) con retrato + texto (TextMeshPro) y avance manual; base de codigo lista para cablear un Timeline/Signal Track en el Editor en `Assets/Scripts/View/Battler/DialoguePlaybackController.cs` (depende de T008, T010)
- [X] T030 [US2] Cablear en `BattleStateManager` el bloqueo de despliegue durante el diálogo pre-batalla, el disparo del diálogo post-batalla al llegar a `Victory`, y la bandera de "diálogo pre-batalla ya reproducido en esta sesión" que el flujo de reintento de T024 consulta para no volver a llamar a `IDialogueSequencePlayer.Play` con `preBattleDialogue` en `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` (depende de T024, T029)
- [X] T031 [US2] 2 líneas de diálogo pre-batalla (Comandante/Heroe, retrato placeholder) en `Assets/ScriptableObjects/Battler/Chapter1/Dialogue/PreBattle/` — texto real, retrato es un cuadrado de color generado (placeholder, pendiente de arte final)
- [X] T032 [US2] 2 líneas de diálogo post-batalla en `Assets/ScriptableObjects/Battler/Chapter1/Dialogue/PostBattle/`
- [X] T033 [US2] Canvas de diálogo (retrato + nombre + texto TextMeshPro + botón "Siguiente") añadido a `Chapter1_Battle.unity` y cableado a `DialoguePlaybackController`

**Checkpoint**: User Story 1 + 2 funcionan juntas — loop de combate envuelto en narrativa.

---

## Phase 5: User Story 3 - Elegir entre 5 unidades con identidad visual propia (Priority: P3)

**Goal**: Las 5 unidades jugables son visualmente distinguibles: animación de idle propia, animación de ataque propia y una variante visual adicional cada una.

**Independent Test**: Desplegar cada una de las 5 unidades por separado y confirmar visualmente idle, ataque y variante distintos entre sí (quickstart.md paso 7).

### Implementation for User Story 3

- [X] T034 [P] [US3] Idle/Attack (`AnimatorController` + `AnimationClip` de escala, parametrizados por unidad) y variante visual (prefab con `SpriteRenderer` de color propio) del Espadachín en `Assets/ScriptableObjects/Battler/Chapter1/PlaceholderArt/` + `Assets/Prefabs/Battler/Units/` — **placeholder procedural** (cuadrados de color + animación de escala), no arte final
- [X] T035 [P] [US3] Ídem Lancero
- [X] T036 [P] [US3] Ídem Arquero
- [X] T037 [P] [US3] Ídem Escudero
- [X] T038 [P] [US3] Ídem Mago
- [X] T039 [US3] Los 5 assets `UnitDefinition` (team=Player) creados en `Assets/ScriptableObjects/Battler/Chapter1/Units/Player/`, cada uno referenciando su idle/attack/variante (depende de T009, T034–T038)
- [X] T040 [US3] EditMode test validador: falla si algún `UnitDefinition` tiene `idleAnimation`, `attackAnimation` o `visualVariant` nulos, o si idle/attack coinciden (contrato en [contracts/scriptableobject-data-contract.md](./contracts/scriptableobject-data-contract.md)) en `Assets/Tests/EditMode/Battler/UnitDefinitionValidationTests.cs` (depende de T009)
- [X] T041 [US3] Asset `ChapterDefinition` (`Chapter1.asset`) creado, cableando las 5 `UnitDefinition` del jugador, la oleada enemiga, el diálogo pre/post y la salud máxima de ambas bases (30/40) en `Assets/ScriptableObjects/Battler/Chapter1/Chapter1.asset` (depende de T012, T026, T031, T032, T039)
- [X] T042 [US3] `Chapter1.asset` cableado en `Chapter1_Battle.unity` (BattleStateManager) y `DeploymentUIController` con los 5 botones (nombre + coste + relleno de cooldown) generados por unidad (depende de T027, T033, T041)

**Nota de arte placeholder (T034–T039, T031–T032)**: todo el contenido visual (sprites, animaciones, retratos) es **generado proceduralmente** por [Chapter1ContentBuilder.cs](../../Assets/Editor/Battler/Chapter1ContentBuilder.cs) — cuadrados de color con animación de escala, no arte final del juego. Es suficiente para que la vertical slice sea completa y jugable de punta a punta (cumple FR-008/FR-009 estructuralmente), pero se espera que se reemplace con arte real antes de considerar el Capítulo 1 terminado de cara al jugador. El script es re-ejecutable (`The Battler > Build Chapter 1 Placeholder Content`, idempotente) y sirve de base/plantilla para cuando se sustituya por arte real.

**Checkpoint**: Las 3 historias de usuario funcionan juntas — vertical slice completa del Capítulo 1.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificación final y ajustes que afectan a toda la slice

- [~] T043 [P] Validación automatizada completa: compilación limpia (0 errores/warnings), 22/22 tests EditMode, 1/1 test PlayMode, y `ValidateScene` (0 referencias nulas, 5 unidades con identidad visual válida, diálogo y oleada no vacíos) — todo corrido vía Unity en modo batch. **Pendiente**: los pasos manuales 1–10 de [quickstart.md](./quickstart.md) requieren un humano jugando en el Editor (feedback visual/input real); el conteo de despliegues de SC-002 solo es medible en una sesión jugada, no headless
- [ ] T044 [P] Valores iniciales de balance ya cargados (coste 3–7, cooldown 2–4s, salud/daño escalados por unidad, bases a 30/40 HP, oleada enemiga cada 6s) pero **sin playtesting real** que confirme que la batalla es "ganable pero desafiante"; SC-003 (90% identifica el objetivo sin instrucciones) requiere una sesión de playtesting con usuarios reales, fuera del alcance de este pipeline
- [ ] T045 Perfilar `Chapter1_Battle.unity` con ~10 unidades simultáneas para confirmar 60 fps — **no realizable en modo batch `-nographics`** (no hay pipeline de render activo para medir fps reales); requiere el Profiler del Editor con la escena corriendo
- [X] T046 [P] Pasada de limpieza en `Assets/Scripts/*/Battler/` (sin stats hardcodeadas, sin código muerto, consistente con Principio V) — incluyó corregir un parámetro que ocultaba `Component.enabled` en `UnitDeploymentController`, verificar ausencia de TODOs, e instanciar correctamente `visualVariant`/revertir el Animator a idle en `UnitRuntime` (bugs encontrados durante la generación de contenido)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA todas las historias de usuario
- **User Story 1 (Phase 3)**: depende de Foundational — sin dependencias de otras historias
- **User Story 2 (Phase 4)**: depende de Foundational; se integra con la escena y `BattleStateManager` de US1 (T024, T027) pero es probable de forma independiente si se sustituye por una escena de prueba mínima
- **User Story 3 (Phase 5)**: depende de Foundational; se integra con `ChapterDefinition` (T012) y la escena de US1/US2 (T027, T033), pero cada unidad (T034–T038) es independiente entre sí
- **Polish (Phase 6)**: depende de que las historias que se quieran entregar estén completas

### Within Each User Story

- Tests antes que implementación (deben fallar primero)
- Modelos/ScriptableObjects (ya cubiertos en Foundational) antes que controllers de Gameplay
- Controllers de Gameplay antes que UI/View
- Contenido de datos (assets `.asset`) al final de cada historia, una vez el código que los consume existe

### Parallel Opportunities

- T002, T003 (Setup) en paralelo
- T004–T010 (Foundational: interfaces + `UnitDefinition` + `DialogueLine`) en paralelo — archivos distintos sin dependencias entre sí
- T014, T015, T016 (tests EditMode de US1) en paralelo
- T034–T038 (contenido visual de las 5 unidades de US3) en paralelo — cada unidad es un conjunto de archivos independiente
- Una vez completada Foundational, US1/US2/US3 pueden trabajarse en paralelo por distintas personas, aunque US2 y US3 integran sobre la escena que arma US1 (T027)

---

## Parallel Example: User Story 1

```bash
# Lanzar juntos los tests EditMode de la User Story 1:
Task: "EditMode test de acumulación/gasto de recurso en Tests/EditMode/Battler/BattleResourceStateTests.cs"
Task: "EditMode test de resolución de victoria/derrota en Tests/EditMode/Battler/BaseHealthStateTests.cs"
Task: "EditMode test de disponibilidad de slot de despliegue en Tests/EditMode/Battler/DeploymentSlotStateTests.cs"
```

## Parallel Example: User Story 3

```bash
# Lanzar juntas las 5 unidades (archivos independientes):
Task: "Idle+ataque+variante Unidad 1 en Assets/Prefabs/Battler/Units/Unit1/"
Task: "Idle+ataque+variante Unidad 2 en Assets/Prefabs/Battler/Units/Unit2/"
Task: "Idle+ataque+variante Unidad 3 en Assets/Prefabs/Battler/Units/Unit3/"
Task: "Idle+ataque+variante Unidad 4 en Assets/Prefabs/Battler/Units/Unit4/"
Task: "Idle+ataque+variante Unidad 5 en Assets/Prefabs/Battler/Units/Unit5/"
```

---

## Implementation Strategy

### MVP First (User Story 1 solamente)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloquea todo)
3. Completar Phase 3: User Story 1
4. **DETENERSE Y VALIDAR**: probar User Story 1 de forma independiente (con arte placeholder y sin narrativa)
5. Este es ya el "core loop" jugable descrito en la constitución (Principio II)

### Incremental Delivery

1. Setup + Foundational → base lista
2. + User Story 1 → probar de forma independiente → MVP jugable (combate sin narrativa/arte final)
3. + User Story 2 → probar de forma independiente → batalla contextualizada narrativamente
4. + User Story 3 → probar de forma independiente → vertical slice completa según la constitución
5. + Polish → validación final end-to-end vía quickstart.md

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes entre sí
- Cada historia de usuario debe quedar completable y probable de forma independiente
- Confirmar que los tests fallan antes de implementar (T014–T017, T028, T040)
- Hacer commit tras cada tarea o grupo lógico de tareas
- Es válido detenerse en cualquier checkpoint (fin de Phase 3, 4 o 5) para validar esa historia de forma aislada
- Evitar: tareas vagas, conflictos de mismo archivo entre tareas paralelas, dependencias cruzadas entre historias que rompan su independencia
