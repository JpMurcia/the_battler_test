---

description: "Task list template for feature implementation"
---

# Tasks: Capítulo 2 "Hacia el Futuro"

**Input**: Design documents from `/specs/010-chapter2-hacia-futuro/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en `001`/`003`.

**Organization**: Tareas agrupadas por historia de usuario (spec.md: US1/US2/US3) para permitir implementación y prueba independiente de cada una.

**Nota de alcance (plan.md, Constitution Check)**: esta feature no introduce ni modifica ningún archivo `.cs` — es 100% autoría de datos (`ChapterDefinition`, `UnitDefinition` x2 nuevas, `EnemyWaveDefinition`, `DialogueLine[]`) más una escena nueva (`Chapter2_Battle.unity`), sobre el código ya existente de `001-chapter1-vertical-slice`. La única tarea con superficie de código es un **Editor tool** (`Chapter2ContentBuilder.cs`), siguiendo el mismo patrón ya usado por `Chapter1ContentBuilder.cs` (`001`) y `MainMenuContentBuilder.cs` (`003`) para generar contenido/escenas por código en vez de a mano en el Editor.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US1/US2/US3, spec.md)
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay,View}/Battler/` (sin cambios en esta feature), contenido nuevo en `Assets/ScriptableObjects/Battler/Chapter2/`, escena en `Assets/Scenes/Chapter2_Battle.unity`, herramienta de autoría en `Assets/Editor/Battler/Chapter2ContentBuilder.cs`, tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Estructura de carpetas del Capítulo 2 y esqueleto del Editor tool que generará su contenido, siguiendo el patrón de `Chapter1ContentBuilder.cs`.

- [X] T001 Crear la estructura de carpetas del Capítulo 2: `Assets/ScriptableObjects/Battler/Chapter2/Units/Player/`, `Assets/ScriptableObjects/Battler/Chapter2/Units/Enemy/`, `Assets/ScriptableObjects/Battler/Chapter2/Dialogue/PreBattle/`, `Assets/ScriptableObjects/Battler/Chapter2/Dialogue/PostBattle/`, `Assets/ScriptableObjects/Battler/Chapter2/PlaceholderArt/` (mismo layout que `Assets/ScriptableObjects/Battler/Chapter1/`, [contracts/chapter2-scriptableobject-data-contract.md](./contracts/chapter2-scriptableobject-data-contract.md))
- [X] T002 [P] Crear el esqueleto de `Assets/Editor/Battler/Chapter2ContentBuilder.cs` (namespace/menú `The Battler > Build Chapter 2 Placeholder Content`, mismo patrón que [Chapter1ContentBuilder.cs](../../Assets/Editor/Battler/Chapter1ContentBuilder.cs)), sin lógica de generación todavía (se completa en Phase 3)

**Checkpoint**: Estructura de carpetas y esqueleto de la herramienta de autoría listos.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Validadores de datos genéricos (project-wide, no atados a `Chapter1/`) que TODAS las historias de usuario de esta feature necesitan para poder verificar sus assets — sin esto no hay forma automatizada de confirmar que los assets nuevos cumplen sus reglas de contrato.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede darse por completa (tests en verde) hasta que esta fase esté lista, aunque la autoría de contenido en sí no está bloqueada por ella.

- [X] T003 [P] Crear `ChapterDefinitionValidationTests.cs` en `Assets/Tests/EditMode/Battler/ChapterDefinitionValidationTests.cs`: recorre **todos** los `ChapterDefinition` del proyecto (`AssetDatabase.FindAssets`, no una ruta fija) y falla si algún `chapterId` está duplicado, si `preBattleDialogue`/`postBattleDialogue` están vacíos, o si `availableUnits` está vacío — no existía como suite dedicada en `001` (solo se validaba manualmente); cubre `Chapter1.asset` y `Chapter2.asset` con la misma lógica
- [X] T004 [P] Revisar `Assets/Tests/EditMode/Battler/UnitDefinitionValidationTests.cs`: confirmar que recorre **todos** los `UnitDefinition` del proyecto vía `AssetDatabase.FindAssets` (no una carpeta `Chapter1/` fija); si está acotada a `Chapter1/`, generalizarla para que cubra también `Chapter2/` sin duplicar la clase de test ([contracts/chapter2-scriptableobject-data-contract.md](./contracts/chapter2-scriptableobject-data-contract.md) — "un test de validación de datos que recorra todos los assets del proyecto... cubre ambos capítulos con la misma lógica")

**Checkpoint**: Validadores de datos listos para correr sobre el contenido del Capítulo 2 en cuanto exista.

---

## Phase 3: User Story 1 - Jugar el Capítulo 2 completo tras desbloquearlo (Priority: P1) 🎯 MVP

**Goal**: Diálogo pre-batalla específico → combate automático por despliegue con 7 unidades disponibles (5 de `001` + 2 nuevas) → diálogo post-batalla según resultado, sobre una oleada enemiga más difícil que la del Capítulo 1.

**Independent Test**: Con `chapter_1` marcado como completado en `progress.json`, abrir `Chapter2_Battle.unity` en Play Mode y recorrer diálogo pre-batalla → despliegue/combate → diálogo post-batalla, terminando en victoria o derrota (quickstart.md pasos 1–6).

### Tests for User Story 1

> **NOTA**: Escribir/confirmar estas pruebas antes de dar por completo el contenido de esta fase.

- [X] T005 [P] [US1] PlayMode test extendiendo el patrón `BattleLoopPlayModeTests` de `001` (dobles en memoria de `ChapterDefinition`/`UnitDefinition`, sin depender de assets `.asset` reales) verificando el loop completo (recurso → despliegue → cooldown → condición de fin de partida) sobre una `ChapterDefinition` con **7** unidades disponibles en vez de 5, en `Assets/Tests/PlayMode/Battler/Chapter2BattleLoopPlayModeTests.cs`

### Implementation for User Story 1

- [X] T006 [US1] Autoría de la(s) `UnitDefinition` enemiga(s) del Capítulo 2 en `Assets/ScriptableObjects/Battler/Chapter2/Units/Enemy/` (`maxHealth`/`damage` mayores que `Unit_EnemyGrunt` de `001`, research.md §4) — generada por `Chapter2ContentBuilder.cs` (placeholder procedural, mismo patrón que `Unit_EnemyGrunt`)
- [X] T007 [US1] Autoría de `EnemyWave.asset` del Capítulo 2 en `Assets/ScriptableObjects/Battler/Chapter2/EnemyWave.asset` — misma forma `WaveEntry[]` que `Chapter1/EnemyWave.asset` (FR-007), más entradas y/o mayor amenaza que la oleada de `001` (research.md §4), referenciando la(s) unidad(es) de T006 — depende de T006
- [X] T008 [P] [US1] Autoría de `player_unit_6` (apoyo/dron, daño a distancia) en `Assets/ScriptableObjects/Battler/Chapter2/Units/Player/`, con `idleAnimation`/`attackAnimation`/`visualVariant` placeholder propios (`Chapter2/PlaceholderArt/`) según [contracts/new-unit-definitions.md](./contracts/new-unit-definitions.md) — generada por `Chapter2ContentBuilder.cs`
- [X] T009 [P] [US1] Autoría de `player_unit_7` (blindado pesado, tanque cuerpo a cuerpo) en `Assets/ScriptableObjects/Battler/Chapter2/Units/Player/`, con `idleAnimation`/`attackAnimation`/`visualVariant` placeholder propios (`Chapter2/PlaceholderArt/`) según [contracts/new-unit-definitions.md](./contracts/new-unit-definitions.md) — generada por `Chapter2ContentBuilder.cs`
- [X] T010 [US1] Completar `Chapter2ContentBuilder.Build()` (`Assets/Editor/Battler/Chapter2ContentBuilder.cs`, depende de T002) para generar de forma idempotente: la(s) unidad(es) enemiga(s) (T006), `EnemyWave.asset` (T007), `player_unit_6`/`player_unit_7` con su arte placeholder (T008, T009) — mismo enfoque procedural (cuadrados de color + animación de escala) que `Chapter1ContentBuilder.cs`
- [X] T011 [US1] Ensamblar `Assets/Scenes/Chapter2_Battle.unity` con el mismo cableado de componentes que `Chapter1_Battle.unity` (`BattleStateManager`, `BattleResourceController`, `UnitDeploymentController`, `DeploymentUIController`, `EnemyWaveSpawner`, `BaseHealth` x2, `DialoguePlaybackController`, Canvas de diálogo) apuntando `BattleStateManager.m_ChapterDefinition` a `Chapter2.asset` — generada por `Chapter2ContentBuilder.Build()` (depende de T010, T014, T015, T017) y registrada en `ProjectSettings/EditorBuildSettings.asset`
- [X] T012 [US1] Añadir `Chapter2ContentBuilder.ValidateScene()` (menú `The Battler > Validate Chapter 2 Scene`, mismo patrón que `Chapter1ContentBuilder.ValidateScene`) que abre `Chapter2_Battle.unity` y falla si hay referencias serializadas nulas — depende de T011
- [X] T013 [US1] Correr `Chapter2ContentBuilder.Build()` + `ValidateScene()` en modo batch de Unity y confirmar 0 referencias nulas, `Chapter2.asset.availableUnits` con exactamente 7 elementos, y T005 en verde

**Checkpoint**: User Story 1 completamente funcional y probable de forma independiente (arte placeholder es aceptable en este punto, igual que en `001`).

---

## Phase 4: User Story 3 - El Capítulo 2 declara qué unidades introduce y qué beat de historia resuelve (Priority: P1)

**Goal**: El diálogo pre/post-batalla y las 2 unidades nuevas comunican, sin fuentes externas, que "Hacia el Futuro" trata de una amenaza nueva y distinta del "Imperio de los Test/Robot" del Capítulo 1 (User Story 3, FR-006, Principio I/IV).

**Independent Test**: Jugar el recorrido completo del Capítulo 2 (reutilizando la escena de US1) y confirmar, leyendo solo el diálogo reproducido y observando las unidades disponibles, que se puede describir el beat de historia específico de "Hacia el Futuro" sin ayuda externa (quickstart.md paso 7).

### Implementation for User Story 3

- [X] T014 [P] [US3] Autoría de ≥1 `DialogueLine` de diálogo pre-batalla en `Assets/ScriptableObjects/Battler/Chapter2/Dialogue/PreBattle/` — texto real (no placeholder genérico) que identifique una amenaza/antagonista nuevo y distinto del "Imperio de los Test/Robot" del Capítulo 1 (nombre concreto del antagonista y guion a decidir en esta tarea, spec.md Assumptions/FR-006, research.md §3); retrato placeholder generado, mismo criterio que `001`
- [X] T015 [P] [US3] Autoría de ≥1 `DialogueLine` de diálogo post-batalla en `Assets/ScriptableObjects/Battler/Chapter2/Dialogue/PostBattle/` — texto real que cierre el beat de historia del capítulo (victoria), consistente con el antagonista/premisa establecidos en T014
- [X] T016 [US3] Crear `Chapter2.asset` (`ChapterDefinition`) en `Assets/ScriptableObjects/Battler/Chapter2/Chapter2.asset`: `chapterId = "chapter_2"`, `preBattleDialogue`/`postBattleDialogue` referenciando T014/T015, `availableUnits` referenciando las 5 `UnitDefinition` de `Chapter1/Units/Player/` (sin duplicar) + `player_unit_6`/`player_unit_7` (T008/T009) = 7 en total, `enemyWaves` referenciando `EnemyWave.asset` (T007), `playerBaseMaxHealth`/`enemyBaseMaxHealth` > 0 — generado por `Chapter2ContentBuilder.Build()`, depende de T007, T008, T009, T014, T015
- [X] T017 [US3] Revisar el diseño/nombres de `player_unit_6`/`player_unit_7` (T008/T009) y su `visualVariant` placeholder para que refuercen visualmente la ambientación tecnológica de "Hacia el Futuro" frente a las 5 unidades "medievales" de `001` ([contracts/new-unit-definitions.md](./contracts/new-unit-definitions.md)) — ajustar si el placeholder generado en T008/T009 no distingue suficientemente el salto tecnológico
- [X] T018 [US3] Validación manual narrativa (quickstart.md paso 7): jugar el recorrido completo y confirmar, sin fuentes externas, que se identifica el antagonista/beat de historia de "Hacia el Futuro" como distinto del Capítulo 1 (SC-003) — depende de T013, T016

**Checkpoint**: User Story 1 + 3 funcionan juntas — recorrido jugable del Capítulo 2 con identidad narrativa propia, verificable de forma independiente de la integración con el mapa de aventuras (US2).

---

## Phase 5: User Story 2 - El Capítulo 2 se desbloquea automáticamente al completar el Capítulo 1 (Priority: P2)

**Goal**: El banner "Hacia el Futuro" en el mapa de aventuras pasa de bloqueado a desbloqueado/seleccionable cuando `progress.json` indica `chapter_1` completado, y navega a `Chapter2_Battle.unity`.

**Independent Test**: Completar la batalla del Capítulo 1, volver al mapa de aventuras y confirmar que el banner "Hacia el Futuro" queda desbloqueado y navega a la batalla del Capítulo 2 (quickstart.md pasos 8–10).

**⚠️ Precondición externa a esta feature** (plan.md Constraints, research.md §2/§5): esta historia depende de que `004-adventure-map-banners` esté implementado en C# (`ChapterBannerDefinition.cs`, `AdventureMap.cs`, `ChapterBannerUnlockEvaluator.cs`, `AdventureMapFlowController.cs`, `AdventureMap.unity`, `MainAdventureMap.asset`) — verificado que **no existe todavía** en `Assets/Scripts/` a la fecha de este plan. La tarea de abajo es un cambio de **datos únicamente**, listo para aplicarse en cuanto esa precondición se cumpla; no bloquea el cierre de US1/US3.

### Implementation for User Story 2

- [X] T019 [US2] Una vez `004-adventure-map-banners` esté implementado: editar el segundo elemento de `Banners[]` en `Assets/Data/Battler/MainAdventureMap.asset` — `linkedChapter = Chapter2.asset` (antes `null`), `targetSceneName = "Chapter2_Battle"` (antes vacío); sin cambio de código en `ChapterBannerDefinition.cs` (`HasPlayableDestination` es derivada, [contracts/adventure-map-banner-integration.md](./contracts/adventure-map-banner-integration.md)) — depende de T011, T016, y de que `004` exista
- [X] T020 [US2] Verificación manual (quickstart.md pasos 8–10, una vez aplicado T019): con `chapter_1` no completado, el banner permanece bloqueado/no seleccionable; con `chapter_1` completado, el banner aparece desbloqueado y seleccionable; seleccionarlo navega a `Chapter2_Battle.unity` vía `ISceneNavigator.LoadScene("Chapter2_Battle")` — depende de T019

**Checkpoint**: Las 3 historias de usuario funcionan juntas — Capítulo 2 jugable, narrativamente identificable, y alcanzable desde el mapa de aventuras en cuanto `004` exista.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificación final y ajustes que afectan a toda la feature

- [X] T021 [P] Correr la suite completa EditMode + PlayMode (`001` + `002` + `003` + `010`) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde, incluyendo T003–T005
- [X] T022 Ejecutar los pasos 1–7 de [quickstart.md](./quickstart.md) (recorrido nuclear US1/US3, independiente de `004`/`006`/`007`/`008`) contra `Chapter2_Battle.unity` real y confirmar resultado esperado
- [X] T023 [P] Actualizar el comentario de código en `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` que menciona "Capitulo 1" (research.md §1 — no afecta comportamiento, opcional) para reflejar que el manager es agnóstico de capítulo, ahora confirmado con un segundo capítulo real
- [X] T024 Revisar que la implementación final no se haya desviado de [data-model.md](./data-model.md) / [contracts/](./contracts/); actualizar esos documentos si hubo un cambio deliberado durante la implementación (p. ej. valores de balance concretos elegidos para T006–T009)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — sus tests deben existir antes de dar por cerrada cualquier historia, pero no bloquea la autoría de contenido en sí
- **User Story 1 (Fase 3)**: depende de Foundational (T003/T004) para verificación, pero puede autorarse en paralelo — sin dependencia de US2/US3 para su Independent Test
- **User Story 3 (Fase 4)**: depende de Foundational; reutiliza los assets de unidades de US1 (T007–T009) y produce `Chapter2.asset` (T016) que US1 necesita para su escena (T011) — en la práctica se completa junto con US1, no estrictamente después
- **User Story 2 (Fase 5)**: depende de Foundational y de que US1/US3 hayan producido `Chapter2.asset`/`Chapter2_Battle.unity` (T011, T016); además depende de una precondición externa (`004` implementado) fuera del control de esta feature
- **Polish (Fase 6)**: depende de que las historias que se quieran entregar estén completas

### User Story Dependencies

- **US1 (P1)**: puede empezar tras Foundational — sin dependencia dura de otras historias, pero su escena final (T011) consume `Chapter2.asset` que produce US3 (T016)
- **US3 (P1)**: puede empezar tras Foundational en paralelo con US1 — comparte archivos de unidades (T008/T009) y termina de ensamblar `Chapter2.asset` (T016) que US1 necesita para T011
- **US2 (P2)**: puede empezar tras Foundational conceptualmente, pero su única tarea de implementación (T019) no puede completarse hasta que `004-adventure-map-banners` exista en código — es la historia con menor prioridad y la única con una dependencia externa real, consistente con spec.md

### Parallel Opportunities

- T002 (Fase 1) en paralelo con T001
- T003, T004 (Fase 2) en paralelo — archivos distintos
- T008, T009 (unidades jugables nuevas de US1) en paralelo — archivos distintos, mismo patrón que T034–T038 de `001`
- T014, T015 (diálogo pre/post de US3) en paralelo — archivos distintos
- Una vez completada Foundational, US1 y US3 pueden trabajarse en paralelo (comparten T008/T009/T016 como puntos de integración, no de exclusión mutua)

---

## Parallel Example: User Story 1

```bash
# Lanzar juntas las unidades jugables nuevas (archivos independientes):
Task: "Autoría de player_unit_6 en Assets/ScriptableObjects/Battler/Chapter2/Units/Player/"
Task: "Autoría de player_unit_7 en Assets/ScriptableObjects/Battler/Chapter2/Units/Player/"
```

## Parallel Example: User Story 3

```bash
# Lanzar juntas las líneas de diálogo pre y post-batalla (archivos independientes):
Task: "Diálogo pre-batalla en Assets/ScriptableObjects/Battler/Chapter2/Dialogue/PreBattle/"
Task: "Diálogo post-batalla en Assets/ScriptableObjects/Battler/Chapter2/Dialogue/PostBattle/"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 3, ambas P1)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (validadores genéricos)
3. Completar Fase 3 (US1) y Fase 4 (US3) en paralelo — ambas P1, se integran sobre los mismos assets de unidades/`Chapter2.asset`
4. **DETENERSE Y VALIDAR**: correr quickstart.md pasos 1–7 (independientes de `004`)
5. Esto ya cumple el recorrido central del capítulo (spec.md SC-001, SC-003) sin depender de `004-adventure-map-banners`

### Incremental Delivery

1. Setup + Foundational → validadores listos
2. + US1 + US3 → Capítulo 2 completo y jugable, narrativamente identificable (MVP de esta feature)
3. + US2 → alcanzable desde el mapa de aventuras, en cuanto `004` exista
4. + Polish → verificación final end-to-end vía quickstart.md

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes entre sí
- Cero archivos `.cs` nuevos salvo `Chapter2ContentBuilder.cs` (Editor tool, mismo patrón que `Chapter1ContentBuilder.cs`/`MainMenuContentBuilder.cs`) — el resto de tareas son autoría de datos/escena (plan.md Constitution Check)
- US2 (T019/T020) queda documentada y lista para ejecutarse, pero formalmente bloqueada por una dependencia externa (`004-adventure-map-banners` sin implementar en código a la fecha de este plan, research.md §2) — no es una tarea vaga ni omitida, es una dependencia real fuera del alcance de esta feature
- El guion literal del diálogo (T014/T015) y los valores numéricos de balance (T006–T009) son autoría de contenido de esta fase, consistente con spec.md Assumptions (mismo criterio que `001` nunca fijó esos valores en su propio plan.md)
- Evitar: tareas vagas, conflictos de mismo archivo entre tareas paralelas, dependencias cruzadas entre historias que rompan su independencia salvo las ya documentadas arriba (US1↔US3 comparten `Chapter2.asset`)
