---

description: "Task list template for feature implementation"
---

# Tasks: Guardado Local de Progreso

**Input**: Design documents from `/specs/002-local-save-progress/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/chapter-progress-store.md](./contracts/chapter-progress-store.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — el proyecto ya sigue un patrón de verificación real (EditMode/PlayMode) establecido en la feature 001 (Capítulo 1), y research.md §5 define explícitamente la estrategia de testing de esta feature.

**Organization**: Tareas agrupadas por historia de usuario (US1/US2/US3, según spec.md) para permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay,View}/Battler/` y tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código — no se requiere infraestructura nueva (no hay asmdefs ni paquetes nuevos, ver plan.md § Technical Context).

- [X] T001 Correr la suite EditMode + PlayMode existente del Capítulo 1 en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde (0 errores de compilación, todos los tests en verde) antes de empezar, como línea base de referencia.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos de datos y contrato compartidos por las 3 historias de usuario. Ninguna historia puede implementarse sin esto.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [X] T002 Crear `ChapterProgressRecord` (struct/clase plana: `chapterId`, `isCompleted`, `lastOutcome` reutilizando `BattleOutcome`) en `Assets/Scripts/Model/Battler/ChapterProgressRecord.cs`, según [data-model.md § ChapterProgressRecord](./data-model.md#chapterprogressrecord)
- [X] T003 Crear `ProgressSaveData` (`formatVersion`, `chapters: ChapterProgressRecord[]`) en `Assets/Scripts/Model/Battler/ProgressSaveData.cs`, según [data-model.md § ProgressSaveData](./data-model.md#progresssavedata) (depende de T002)
- [X] T004 Crear el contrato `IChapterProgressStore` (`Load()`, `SaveChapterOutcome(string, BattleOutcome)`, `ClearProgress()`) en `Assets/Scripts/Model/Battler/IChapterProgressStore.cs`, según [contracts/chapter-progress-store.md](./contracts/chapter-progress-store.md) (depende de T003)

**Checkpoint**: Tipos y contrato listos en `TheBattler.Model` — las 3 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Guardar el resultado de una batalla completada (Priority: P1) 🎯 MVP

**Goal**: Al resolverse una batalla (Victoria o Derrota), el resultado se persiste automáticamente en almacenamiento local, sin acción manual del jugador.

**Independent Test**: Completar la batalla del Capítulo 1 en PlayMode hasta Victoria/Derrota y verificar (vía store falso en el test, o inspeccionando el archivo real) que el resultado quedó guardado — sin depender de US2 (cargar) ni US3 (borrar).

### Tests for User Story 1 ⚠️

> Estos tests deben escribirse primero y fallar antes de las tareas de implementación de esta fase.

- [X] T005 [P] [US1] EditMode test de `SaveChapterOutcome`: (a) guarda un nuevo registro y lo relee correctamente; (b) guardar dos veces el mismo `chapterId` actualiza el registro existente en vez de duplicarlo (FR-006); (c) guardar dos `chapterId` distintos deja ambos registros coexistiendo de forma independiente en `chapters` (FR-009); (d) con una ruta de archivo inválida/no escribible, `SaveChapterOutcome` no lanza excepción (FR-010) — en `Assets/Tests/EditMode/Battler/LocalChapterProgressStoreTests.cs` (archivo nuevo)
- [X] T006 [US1] PlayMode test: `BattleStateManager` invoca `IChapterProgressStore.SaveChapterOutcome` exactamente una vez, con el `chapterId` y outcome correctos, al resolver la batalla en Victoria (usando un store falso en memoria como doble de test), en `Assets/Tests/PlayMode/Battler/BattleProgressIntegrationTests.cs` (archivo nuevo)

### Implementation for User Story 1

- [X] T007 [US1] Implementar `LocalChapterProgressStore` — constructor con ruta de archivo inyectable, `SaveChapterOutcome` con escritura atómica (temp file + reemplazo), actualización sin duplicar por `chapterId`, y **todo el bloque de escritura envuelto en `try/catch`** (`IOException`/`UnauthorizedAccessException` capturadas y descartadas sin relanzar, FR-010) — en `Assets/Scripts/Gameplay/Battler/LocalChapterProgressStore.cs` (archivo nuevo; hace pasar T005) — depende de T004
- [X] T008 [US1] Añadir un campo `IChapterProgressStore progressStore` a `BattleStateManager` (con una instancia por defecto de `LocalChapterProgressStore` apuntando a `Application.persistentDataPath`) y llamar a `progressStore.SaveChapterOutcome(chapterDefinition.chapterId, outcome)` en el punto donde `SetOutcome()` fija Victoria/Derrota por primera vez, en `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` (hace pasar T006) — depende de T007

**Checkpoint**: US1 completa y verificable de forma independiente — jugar y resolver una batalla persiste el resultado en disco.

---

## Phase 4: User Story 2 - Retomar el juego con el progreso previo cargado (Priority: P2)

**Goal**: Al iniciar el juego, el progreso guardado (o su ausencia/corrupción) se carga automáticamente antes de que el jugador pueda interactuar, sin errores.

**Independent Test**: Con un archivo de guardado preexistente (válido, ausente, o corrupto) fijado por el test, arrancar `BattleStateManager` y verificar que expone el estado cargado correcto antes de habilitar el despliegue — sin depender de US1 (para este test el archivo ya viene preparado de antemano) ni de US3.

### Tests for User Story 2 ⚠️

- [X] T009 [US2] EditMode tests en `LocalChapterProgressStoreTests.cs`: `Load()` sin archivo devuelve `ProgressSaveData` vacío (FR-004); `Load()` con archivo corrupto/JSON malformado devuelve vacío sin lanzar excepción (FR-005); `Load()` cronometrado con `System.Diagnostics.Stopwatch` completa muy por debajo de 1s (SC-002, aserción barata dado el tamaño trivial del archivo) — en `Assets/Tests/EditMode/Battler/LocalChapterProgressStoreTests.cs` (mismo archivo que T005, secuencial)
- [X] T010 [US2] PlayMode/integración: `BattleStateManager.SetupChapter()` invoca `progressStore.Load()` y expone el resultado (p. ej. propiedad `LoadedProgress`) antes de que el despliegue quede habilitado, en `Assets/Tests/PlayMode/Battler/BattleProgressIntegrationTests.cs` (mismo archivo que T006, secuencial)

### Implementation for User Story 2

- [X] T011 [US2] Implementar `Load()` en `LocalChapterProgressStore` — try/catch sobre la deserialización, archivo ausente o `formatVersion` no reconocido ⇒ `ProgressSaveData` vacío, nunca relanza excepción — en `Assets/Scripts/Gameplay/Battler/LocalChapterProgressStore.cs` (mismo archivo que T007, secuencial; hace pasar T009) — depende de T007
- [X] T012 [US2] En `BattleStateManager.SetupChapter()`, llamar a `progressStore.Load()` y exponer el resultado (propiedad pública `LoadedProgress`) antes de habilitar despliegue/diálogo, en `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` (mismo archivo que T008, secuencial; hace pasar T010) — depende de T008

**Checkpoint**: US1 y US2 funcionan juntas e independientemente — el progreso se guarda y se recupera correctamente al reiniciar, tolerando ausencia/corrupción del archivo.

---

## Phase 5: User Story 3 - Reiniciar el progreso guardado (Priority: P3)

**Goal**: Es posible borrar el progreso guardado localmente, dejando el estado equivalente al de una instalación nueva.

**Independent Test**: Con un guardado existente (preparado directamente por el test, sin depender de haber ejecutado US1), invocar `ClearProgress()` y verificar que `Load()` devuelve vacío después.

### Tests for User Story 3 ⚠️

- [X] T013 [US3] EditMode test: tras guardar datos y llamar a `ClearProgress()`, `Load()` devuelve `ProgressSaveData` vacío (FR-007), en `Assets/Tests/EditMode/Battler/LocalChapterProgressStoreTests.cs` (mismo archivo que T005/T009, secuencial)

### Implementation for User Story 3

- [X] T014 [US3] Implementar `ClearProgress()` en `LocalChapterProgressStore` (elimina el archivo de guardado, incluido cualquier temporal residual) en `Assets/Scripts/Gameplay/Battler/LocalChapterProgressStore.cs` (mismo archivo que T007/T011, secuencial; hace pasar T013) — depende de T011
- [X] T015 [US3] Exponer un punto de invocación de QA para borrar el progreso — dado que no hay UI de jugador en esta etapa (ver spec.md § Assumptions) — vía `[ContextMenu("Clear Saved Progress")]` sobre `BattleStateManager` que invoca `progressStore.ClearProgress()`, en `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` (mismo archivo que T008/T012, secuencial) — depende de T012

**Checkpoint**: Las 3 historias funcionan de forma independiente y en conjunto — guardar, cargar y borrar progreso local.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T016 Revisar que la implementación final no se haya desviado de [contracts/chapter-progress-store.md](./contracts/chapter-progress-store.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación
- [X] T017 Correr la suite completa EditMode + PlayMode (Capítulo 1 + Guardado de Progreso) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde
- [X] T018 Ejecutar una aproximación automatizada de los 9 pasos de [quickstart.md](./quickstart.md) contra la escena real y el archivo real de guardado (ver nota abajo) — no reemplaza un walkthrough humano en la GUI, pero cubre el mismo comportamiento observable de forma reproducible

## Notas de implementación

- **T018 — aproximación automatizada (2026-07-28)**: no tengo control de escritorio/GUI (solo automatización de navegador), así que no pude hacer clic literalmente por el Editor. En su lugar escribí un test PlayMode temporal (`ProgressQuickstartApproximationTests.cs`, borrado tras validar) que carga la escena real `Chapter1_Battle.unity`, ejercita despliegue real + fuerza el desenlace (Victoria/Derrota) vía `ApplyDamage` directo para no depender del balance placeholder aún sin ajustar (T044), y lee/escribe el archivo real en `Application.persistentDataPath`, con backup/restore automático del guardado real preexistente en `[OneTimeSetUp]`/`[OneTimeTearDown]`. Los 4 tests (pasos 3-6, 7, 8, 9) pasaron en verde. Requirió añadir temporalmente `"UnityEditor"` a las referencias del asmdef de PlayMode (para `EditorSceneManager.LoadSceneInPlayMode`); revertido tras la validación.
- **Bug real encontrado por esta aproximación**: `BattleLoopPlayModeTests.cs` (test preexistente de la feature 001, sin modificar hasta ahora) nunca inyectaba un `IChapterProgressStore` de prueba, así que `BattleStateManager` caía en su store real por defecto y **contaminaba el archivo de guardado real del usuario en cada corrida de test** — y como esa unidad de prueba nunca fija `chapterId` (queda `null`), la comparación `chapterId == chapterId` fallaba contra el `""` ya guardado y duplicaba el registro en vez de actualizarlo. Corregido con dos cambios: (1) `LocalChapterProgressStore.SaveChapterOutcome` ahora compara con `string.Equals(..., StringComparison.Ordinal)` (null-safe); (2) `BattleLoopPlayModeTests.cs` ahora inyecta un `NoOpChapterProgressStore` de prueba, igual que ya hacía `BattleProgressIntegrationTests.cs`. Verificado tras el fix: 30/30 EditMode, 3/3 PlayMode, y el archivo real ya no se recrea al correr la suite.
- **Verificación final (2026-07-28)**: compilación en modo batch sin errores (`Exiting batchmode successfully`); EditMode **30/30** tests en verde (22 de la feature 001 + 8 nuevos de `LocalChapterProgressStoreTests`); PlayMode **3/3** en verde (1 de la feature 001 + 2 nuevos de `BattleProgressIntegrationTests`).
- **Detalle técnico de la corrida en batch**: la primera invocación con `-runTests` combinada con `-quit` salió antes de que el test runner llegara a ejecutar nada (el log terminaba justo tras la compilación de scripts, sin resultados). Quitar el flag `-quit` (el propio `-runTests` cierra Unity al terminar) resolvió el problema en el reintento. Anotado aquí por si se repite en corridas futuras del proyecto.
- **T007/T011/T014 implementados en una sola pasada**: como anticipaba la nota de diseño original de este archivo, `LocalChapterProgressStore.cs` se escribió completo (Load/Save/Clear) en un solo paso en vez de en 3 incrementos estrictos, porque `SaveChapterOutcome` ya necesita una `Load()` funcional internamente para poder actualizar sin duplicar. Los tests de cada historia (T005/T009/T013) sí se mapean 1:1 a los métodos que cada uno ejercita.
- **Recomendaciones de `/speckit.analyze` aplicadas antes de implementar**: FR-010 (resiliencia ante fallo de escritura) añadida a spec.md; T005 ampliada para cubrir coexistencia multi-capítulo (E1) y fallo de escritura (C1); T009 ampliada con una aserción de tiempo barata para SC-002 (E2).
- **Archivos nuevos**: `Assets/Scripts/Model/Battler/{ChapterProgressRecord,ProgressSaveData,IChapterProgressStore}.cs`, `Assets/Scripts/Gameplay/Battler/LocalChapterProgressStore.cs`, `Assets/Tests/EditMode/Battler/LocalChapterProgressStoreTests.cs`, `Assets/Tests/PlayMode/Battler/BattleProgressIntegrationTests.cs`.
- **Archivo modificado**: `Assets/Scripts/Gameplay/Battler/BattleStateManager.cs` (campo `progressStore` con default a `LocalChapterProgressStore` sobre `Application.persistentDataPath/progress.json`, propiedad `LoadedProgress`, guardado en `SetOutcome()`, `[ContextMenu("Clear Saved Progress")] ClearSavedProgress()`).
- **T018 pendiente**: requiere un humano en la GUI del Editor de Unity (inspeccionar el archivo real en `Application.persistentDataPath`, entrar/salir de Play Mode varias veces); no automatizable en modo `-nographics`, igual que T044/T045 de la feature 001.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — bloquea las 3 historias de usuario
- **User Stories (Fase 3-5)**: todas dependen de Foundational; dentro de cada historia, los tests preceden a su implementación correspondiente
- **Polish (Fase 6)**: depende de que las 3 historias estén completas

### User Story Dependencies

- **US1 (P1)**: puede empezar tras Foundational — sin dependencia de otras historias
- **US2 (P2)**: puede empezar tras Foundational; sus tests se preparan un archivo de guardado directamente (no dependen de que US1 ya se haya jugado), pero su implementación (T011/T012) modifica los mismos archivos que creó US1 (T007/T008), por lo que en la práctica se implementa después de US1
- **US3 (P3)**: análogamente, sus tests son independientes, pero su implementación (T014/T015) extiende los mismos archivos que US1/US2 tocaron

### Parallel Opportunities

- T002→T003→T004 (Fase 2) son secuenciales por dependencia de tipos, no por archivo compartido
- T005 (test EditMode de US1) puede ejecutarse en paralelo con T006 (test PlayMode de US1) — archivos distintos
- Las implementaciones de US1/US2/US3 comparten únicamente 2 archivos (`LocalChapterProgressStore.cs`, `BattleStateManager.cs`), por lo que sus tareas de implementación son intrínsecamente secuenciales entre historias, aunque cada historia sea conceptualmente independiente y su Independent Test no dependa de las otras

---

## Implementation Strategy

### MVP First (User Story 1 solamente)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante)
3. Completar Fase 3: US1 (guardar automáticamente al resolver la batalla)
4. **Detener y validar**: correr T005/T006 en verde de forma aislada
5. Esto ya es útil por sí solo: el progreso se guarda aunque todavía no se cargue al reabrir

### Incremental Delivery

1. Setup + Foundational → base lista
2. + US1 → guardar automático (MVP)
3. + US2 → cargar al reabrir, tolerante a ausencia/corrupción
4. + US3 → borrar progreso (control de QA)
5. Fase 6 → verificación final y quickstart manual

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- Las tres historias comparten `LocalChapterProgressStore.cs` y `BattleStateManager.cs` porque el contrato (`IChapterProgressStore`) agrupa deliberadamente Load/Save/Clear en un único servicio pequeño (ver research.md §1, alineado con Principio VI — Simplicidad/YAGNI); esto hace que las tareas de implementación sean secuenciales entre historias aunque cada historia siga siendo independientemente testeable por su Independent Test
- T018 requiere un humano en el Editor de Unity (GUI), igual que quedó documentado para T044/T045 en `specs/001-chapter1-vertical-slice/tasks.md`
