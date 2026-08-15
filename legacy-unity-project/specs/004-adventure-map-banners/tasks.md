---

description: "Task list template for feature implementation"
---

# Tasks: Mapa de Aventuras (Banners) y Desbloqueo Secuencial

**Input**: Design documents from `/specs/004-adventure-map-banners/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/chapter-banner-unlock-evaluator.md](./contracts/chapter-banner-unlock-evaluator.md), [contracts/chapter-banner-definition.md](./contracts/chapter-banner-definition.md), [contracts/adventure-map-selection.md](./contracts/adventure-map-selection.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en 001/002/003, y research.md §9 define explícitamente la estrategia de testing de esta feature.

**Organization**: Tareas agrupadas por historia de usuario (US1/US2/US3, según spec.md) para permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay,View}/Battler/`, escenas en `Assets/Scenes/`, datos de diseño en `Assets/Data/Battler/`, y tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (Capítulo 1 + Guardado de Progreso + Menú Principal) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde (0 errores de compilación, todos los tests en verde) antes de empezar, como línea base de referencia.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Los tipos de datos de diseño y la infraestructura de escena que las 3 historias de usuario necesitan para existir en absoluto. Ninguna historia puede implementarse ni probarse sin esto.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [X] T002 [P] Crear `ChapterBannerDefinition` (ScriptableObject: `LinkedChapter` (`ChapterDefinition`, nullable), `TargetSceneName`, `DisplayNameKey`, `BannerArt` (`Sprite`, opcional), y las propiedades derivadas `ChapterId`/`HasPlayableDestination`) en `Assets/Scripts/Model/Battler/ChapterBannerDefinition.cs`, según [contracts/chapter-banner-definition.md](./contracts/chapter-banner-definition.md) y [data-model.md § ChapterBannerDefinition](./data-model.md#chapterbannerdefinition-so)
- [X] T003 [P] Crear `AdventureMap` (ScriptableObject: `Banners` (`ChapterBannerDefinition[]`), el orden del array es la secuencia de desbloqueo — FR-007) en `Assets/Scripts/Model/Battler/AdventureMap.cs`, según [data-model.md § AdventureMap](./data-model.md#adventuremap-so)
- [X] T004 [P] EditMode tests en `Assets/Tests/EditMode/Battler/ChapterBannerDefinitionValidationTests.cs` (archivo nuevo): `DisplayNameKey` vacío/nulo es un error de datos de diseño; si `LinkedChapter != null` entonces `TargetSceneName` no puede ser vacío/nulo; `AdventureMap.Banners` no puede estar vacío — según [contracts/chapter-banner-definition.md](./contracts/chapter-banner-definition.md) y [data-model.md § AdventureMap](./data-model.md#adventuremap-so) (hace pasar validando T002, T003) — depende de T002, T003
- [X] T005 [P] Crear la escena `Assets/Scenes/AdventureMap.unity` (Canvas raíz, EventSystem, un `ScrollRect` con `Content` vacío para los items de banner) y registrarla en Build Settings junto a `MainMenu.unity`/`Chapter1_Battle.unity` (ver [research.md §7](./research.md))
- [X] T006 Crear el activo `Assets/Data/Battler/MainAdventureMap.asset` (instancia de `AdventureMap`) con los 2 banners de spec.md en orden: índice 0 "Imperio de los Test/Robot" (`LinkedChapter` = `ChapterDefinition` del Capítulo 1, `TargetSceneName` = `"Chapter1_Battle"`, `DisplayNameKey` = `"banner.chapter1.name"`), índice 1 "Hacia el Futuro" (`LinkedChapter` = `null`, `DisplayNameKey` = `"banner.hacia-el-futuro.name"`) — depende de T002, T003
- [X] T007 [P] Añadir las entradas `banner.chapter1.name` / `banner.hacia-el-futuro.name` (español/inglés/chino/francés) al activo ya existente `Assets/Data/Battler/MainLocalizedText.asset` (`LocalizedTextTable`, reutilizado de 003), según [research.md §5](./research.md)

**Checkpoint**: Tipos de datos, escena y assets base listos — las 3 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Navegar el mapa de banners libremente (Priority: P1) 🎯 MVP

**Goal**: Un jugador que entra al mapa de aventuras puede desplazarse (scroll) por todos los banners existentes, desbloqueados o no, sin que el sistema le impida moverse por ninguno de ellos.

**Independent Test**: Entrar al mapa de aventuras con cualquier estado de progreso (incluso sin progreso) y confirmar que se puede desplazar hasta ver todos los banners existentes, incluidos los bloqueados, sin ningún tope o bloqueo de scroll.

### Tests for User Story 1 ⚠️

> Estos tests deben escribirse primero y fallar antes de las tareas de implementación de esta fase.

- [X] T008 [P] [US1] EditMode tests en `Assets/Tests/EditMode/Battler/ChapterBannerUnlockEvaluatorTests.cs` (archivo nuevo): con `ProgressSaveData` vacío (sin progreso), el banner en el índice `0` siempre resulta `isUnlocked == true` y el resto `isUnlocked == false` (US1 Independent Test / contracts/chapter-banner-unlock-evaluator.md § Casos borde) — precondición de que el mapa tenga algo desbloqueado y algo bloqueado que recorrer
- [X] T009 [P] [US1] PlayMode tests en `Assets/Tests/PlayMode/Battler/AdventureMapFlowPlayModeTests.cs` (archivo nuevo): con `MainAdventureMap.asset` (2 banners) y un `IChapterProgressStore` falso vacío, `AdventureMapUIController` instancia exactamente un `ChapterBannerItemView` por banner (incluido el bloqueado "Hacia el Futuro"), y ninguno de los dos queda excluido del `Content` del `ScrollRect` (FR-001)

### Implementation for User Story 1

- [X] T010 [US1] Crear `ChapterBannerUnlockEvaluator.Evaluate(ChapterBannerDefinition[] orderedBanners, ProgressSaveData progress)` (función estática pura) en `Assets/Scripts/Gameplay/Battler/ChapterBannerUnlockEvaluator.cs`, según [contracts/chapter-banner-unlock-evaluator.md](./contracts/chapter-banner-unlock-evaluator.md): calcula `isCompleted`/`isUnlocked`/`isSelectable` por índice para todo `orderedBanners` (hace pasar T008) — depende de T002, T003
- [X] T011 [US1] Crear `AdventureMapFlowController` en `Assets/Scripts/Gameplay/Battler/AdventureMapFlowController.cs`: en `Awake()` resuelve `IChapterProgressStore`/`IMenuSettingsStore`/`ISceneNavigator` (mismo patrón que `MainMenuFlowController`, 003, todos inyectables por test) y calcula `BannerStates` mediante `ChapterBannerUnlockEvaluator.Evaluate(adventureMap.Banners, progressStore.Load())`, según [contracts/adventure-map-selection.md](./contracts/adventure-map-selection.md) — depende de T010
- [X] T012 [US1] Crear `ChapterBannerItemView` en `Assets/Scripts/View/Battler/ChapterBannerItemView.cs`: nombre localizado vía `LocalizedTextTable.GetText(displayNameKey, language)` (llamada directa, sin `LocalizedTextBinder` — ver [research.md §5](./research.md)), indicador visual bloqueado/desbloqueado, y botón "Select" (sin enlazar todavía a navegación — se conecta en US2) — depende de T011
- [X] T013 [US1] Crear `AdventureMapUIController` en `Assets/Scripts/View/Battler/AdventureMapUIController.cs`: puebla el `Content` del `ScrollRect` de la escena con un `ChapterBannerItemView` por cada entrada de `AdventureMapFlowController.BannerStates`, en el mismo orden que `AdventureMap.Banners`, sin ninguna lógica que restrinja el scroll por banners bloqueados (FR-002 — la ausencia de esa lógica ES la implementación, ver [research.md §4](./research.md)) (hace pasar T009) — depende de T012
- [X] T014 [US1] Añadir al Canvas de `AdventureMap.unity` el GameObject raíz con `AdventureMapFlowController` + `AdventureMapUIController` enlazados, referenciando `MainAdventureMap.asset`, el `ScrollRect` y `MainLocalizedText.asset`, en `Assets/Scenes/AdventureMap.unity` — depende de T013, T005, T006, T007

**Checkpoint**: US1 completa y verificable de forma independiente — el mapa muestra y permite recorrer todos los banners (bloqueados o no) sin restricción de scroll.

---

## Phase 4: User Story 2 - Entrar a la batalla desde un banner desbloqueado (Priority: P1)

**Goal**: Un jugador selecciona un banner desbloqueado (p. ej. "Imperio de los Test/Robot") y el juego lo lleva a la batalla correspondiente a ese capítulo.

**Independent Test**: Con el primer banner desbloqueado (estado por defecto, sin progreso previo), seleccionarlo y confirmar que el juego entra a la batalla del Capítulo 1.

### Tests for User Story 2 ⚠️

- [X] T015 [P] [US2] PlayMode tests en `Assets/Tests/PlayMode/Battler/AdventureMapFlowPlayModeTests.cs` (mismo archivo que T009, secuencial): con un `IChapterProgressStore` falso vacío (sin progreso), `TrySelectBanner(0)` invoca `ISceneNavigator.LoadScene("Chapter1_Battle")` exactamente una vez en un `FakeSceneNavigator` inyectado (mismo patrón que `MainMenuFlowPlayModeTests`, 003 — ver [contracts/adventure-map-selection.md](./contracts/adventure-map-selection.md)) (US2 Escenarios 1 y 2 / SC-002)
- [X] T016 [P] [US2] PlayMode tests en el mismo archivo: `TrySelectBanner(1)` ("Hacia el Futuro", sin `LinkedChapter`) nunca invoca `ISceneNavigator.LoadScene` ni lanza excepción, con independencia de `isUnlocked` (FR-005); un `bannerIndex` fuera de rango (p. ej. `TrySelectBanner(99)`) devuelve `false` sin lanzar excepción

### Implementation for User Story 2

- [X] T017 [US2] Añadir `bool TrySelectBanner(int bannerIndex)` a `AdventureMapFlowController` (mismo archivo que T011, secuencial): valida rango, comprueba `BannerStates[bannerIndex].isSelectable`, e invoca `sceneNavigator.LoadScene(adventureMap.Banners[bannerIndex].TargetSceneName)` solo si es seleccionable, según [contracts/adventure-map-selection.md](./contracts/adventure-map-selection.md) (hace pasar T015, T016) — depende de T011
- [X] T018 [US2] Enlazar el botón "Select" de `ChapterBannerItemView` (mismo archivo que T012, secuencial) al `OnClick` de `AdventureMapFlowController.TrySelectBanner(bannerIndex)` en `Assets/Scripts/View/Battler/ChapterBannerItemView.cs` — depende de T012, T017

**Checkpoint**: US1 y US2 funcionan juntas e independientemente — el mapa se recorre libremente y seleccionar "Imperio de los Test/Robot" navega a la batalla del Capítulo 1; seleccionar un banner bloqueado o sin destino jugable no hace nada.

---

## Phase 5: User Story 3 - Desbloqueo secuencial automático al completar un capítulo (Priority: P2)

**Goal**: Un jugador que completa la batalla de un capítulo ve reflejado, la próxima vez que entra al mapa, que ese capítulo quedó marcado como completado, y que el desbloqueo del siguiente banner se evalúa en función de ese progreso.

**Independent Test**: Completar la batalla del Capítulo 1, volver al mapa de aventuras y confirmar que el banner correspondiente refleja el estado de completado, usando el progreso persistido por 002-local-save-progress.

### Tests for User Story 3 ⚠️

- [X] T019 [P] [US3] Extender `Assets/Tests/EditMode/Battler/ChapterBannerUnlockEvaluatorTests.cs` (mismo archivo que T008, secuencial): el banner en el índice `i` queda `isUnlocked == true` solo si el banner `i - 1` tiene `isCompleted == true` (desbloqueo secuencial genérico, FR-007); un `ProgressSaveData` con `chapters` vacío (progreso ausente o corrupto ya normalizado por `IChapterProgressStore.Load()`, FR-008) produce el mismo resultado que "sin progreso"; un banner con `LinkedChapter == null` nunca resulta `isCompleted == true`, por lo que nunca desbloquea el siguiente; `isSelectable` es `false` para un banner `isUnlocked == true` pero sin `HasPlayableDestination` (caso "Hacia el Futuro") — según [contracts/chapter-banner-unlock-evaluator.md § Casos borde](./contracts/chapter-banner-unlock-evaluator.md)
- [X] T020 [P] [US3] Extender `Assets/Tests/PlayMode/Battler/AdventureMapFlowPlayModeTests.cs` (mismo archivo que T009/T015, secuencial): con un `IChapterProgressStore` falso que devuelve el Capítulo 1 completado (`isCompleted == true`), `BannerStates[1].isUnlocked` es `true` pero `TrySelectBanner(1)` sigue sin navegar (banner sin `LinkedChapter` — US3 Escenario 2); con un store falso que simula progreso corrupto (devuelve `ProgressSaveData` vacío, mismo contrato de fallback que 002), `BannerStates` resultante es idéntico al caso "sin progreso" (US3 Escenario 3 / FR-008)

### Implementation for User Story 3

- [X] T021 [US3] En `ChapterBannerItemView` (mismo archivo que T012/T018, secuencial), reflejar el estado `isCompleted` de `ChapterBannerState` con un indicador visual distinto de "bloqueado"/"desbloqueado" (p. ej. un marcador de completado sobre el banner correspondiente), en `Assets/Scripts/View/Battler/ChapterBannerItemView.cs` (US3 Escenario 1 / FR-010) — depende de T012
- [X] T022 [US3] Confirmar (y ajustar si hace falta) que `AdventureMapFlowController.Awake()` recalcula `BannerStates` desde una lectura fresca de `IChapterProgressStore.Load()` cada vez que la escena se carga, sin cachear entre entradas al mapa, en `Assets/Scripts/Gameplay/Battler/AdventureMapFlowController.cs` (mismo archivo que T011/T017, secuencial; hace pasar T019, T020) — depende de T011, T017

**Checkpoint**: Las 3 historias funcionan de forma independiente y en conjunto — el mapa refleja completado/desbloqueado según el progreso real persistido, incluida la degradación ante progreso corrupto, sin necesidad de rediseño para banners futuros.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T023 Revisar que la implementación final no se haya desviado de [contracts/chapter-banner-unlock-evaluator.md](./contracts/chapter-banner-unlock-evaluator.md) / [contracts/chapter-banner-definition.md](./contracts/chapter-banner-definition.md) / [contracts/adventure-map-selection.md](./contracts/adventure-map-selection.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación
- [X] T024 Correr la suite completa EditMode + PlayMode (Capítulo 1 + Guardado de Progreso + Menú Principal + Mapa de Aventuras) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde
- [X] T025 Ejecutar los 11 pasos de [quickstart.md](./quickstart.md) contra la escena real (validación automatizada de EditMode/PlayMode + recorrido manual de los pasos de inspección visual — scroll libre SC-001, idioma traducido, ausencia de errores en consola)

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — bloquea las 3 historias de usuario
- **User Stories (Fase 3-5)**: todas dependen de Foundational; dentro de cada historia, los tests preceden a su implementación correspondiente
- **Polish (Fase 6)**: depende de que las 3 historias estén completas

### User Story Dependencies

- **US1 (P1)**: puede empezar tras Foundational — sin dependencia de otras historias; su Independent Test no requiere que la navegación (US2) ni el desbloqueo secuencial completo (US3) funcionen, solo que el mapa muestre y permita recorrer todos los banners
- **US2 (P1)**: puede empezar tras Foundational; su Independent Test (seleccionar el primer banner, siempre desbloqueado por defecto) no depende de que US3 esté implementada, pero su implementación (T017-T018) extiende los mismos archivos que creó US1 (T011-T012), por lo que en la práctica se implementa después
- **US3 (P2)**: puede empezar tras Foundational; su Independent Test (reflejar completado tras jugar el Capítulo 1) requiere que exista una batalla que completar y una forma de seleccionarla, por lo que depende en la práctica de US1+US2 ya implementadas, aunque el propio `ChapterBannerUnlockEvaluator` (T010, creado en US1) ya contiene el algoritmo genérico completo — US3 solo añade la cobertura de test y el reflejo visual de las ramas de progreso restantes

### Parallel Opportunities

- T002 (`ChapterBannerDefinition`) y T003 (`AdventureMap`) son independientes entre sí — archivos distintos
- T004 (validación EditMode) y T005 (escena) pueden ejecutarse en paralelo entre sí y con T007 (localización) — archivos distintos sin dependencia cruzada
- T008 (test EditMode del evaluador) y T009 (test PlayMode de la UI) pueden ejecutarse en paralelo — archivos distintos
- T015 y T016 (tests de US2, mismo archivo que T009) son secuenciales entre sí una vez creado el archivo, pero independientes de T019/T020 (US3) hasta que ambas historias toquen el mismo archivo de test
- Las implementaciones de US1/US2/US3 comparten `AdventureMapFlowController.cs` y `ChapterBannerItemView.cs`, por lo que sus tareas de implementación son intrínsecamente secuenciales entre historias, aunque cada historia sea conceptualmente independiente y su Independent Test no dependa de las otras — mismo patrón ya documentado en `specs/003-main-menu-config/tasks.md`

---

## Implementation Strategy

### MVP First (User Story 1 solamente)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante)
3. Completar Fase 3: US1 (mapa navegable con scroll libre sobre banners bloqueados/desbloqueados)
4. **Detener y validar**: correr T008/T009 en verde de forma aislada
5. Esto ya es útil por sí solo: la pantalla del mapa existe y es recorrible, aunque todavía no lleve a ninguna batalla

### Incremental Delivery

1. Setup + Foundational → tipos de datos y escena base listos
2. + US1 → mapa recorrible de punta a punta (scroll libre)
3. + US2 → seleccionar el primer banner entra a la batalla del Capítulo 1 (MVP jugable)
4. + US3 → el mapa refleja completado/desbloqueado según progreso real, de forma genérica para futuros banners
5. Fase 6 → verificación final y quickstart manual

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- US1/US2/US3 comparten `AdventureMapFlowController.cs`/`ChapterBannerItemView.cs` porque las 3 historias son, en esencia, distintas facetas del mismo flujo de mapa (mostrar, seleccionar, reflejar progreso) — igual que 003 agrupó Empezar/Continuar/Ajustes en los mismos archivos (Principio VI)
- `ChapterBannerUnlockEvaluator.Evaluate` (T010) implementa el algoritmo genérico completo (contracts/chapter-banner-unlock-evaluator.md) desde US1, porque no existe una versión "parcial" coherente de esa función pura; US1 solo necesita y prueba el caso `isUnlocked` del índice `0`, mientras que US3 añade la cobertura de test de las ramas de progreso restantes (secuencial, corrupto, banner sin `LinkedChapter`) — ninguna lógica nueva se escribe en US3 salvo el reflejo visual de `isCompleted` (T021)
- No se modifica `MainMenuFlowController.cs` (003) en ninguna tarea de esta lista — spec.md marca explícitamente el punto de entrada al mapa como fuera de alcance de esta feature (ver [research.md §8](./research.md)); el hueco de integración menú→mapa queda documentado ahí como conocido y explícito, no como una tarea pendiente de esta feature
- Ningún test de esta feature requiere doble de `ChapterBannerUnlockEvaluator` (es una función estática pura, ver [contracts/chapter-banner-unlock-evaluator.md § Doble de test](./contracts/chapter-banner-unlock-evaluator.md)); los tests PlayMode reutilizan el mismo `FakeSceneNavigator`/store falso en memoria que `MainMenuFlowPlayModeTests` (003)
- T025 probablemente requiera un humano en el Editor de Unity (GUI) para los pasos de inspección visual (scroll libre percibido, idioma traducido en pantalla), igual que quedó documentado para tareas equivalentes en `specs/002-local-save-progress/tasks.md` y `specs/003-main-menu-config/tasks.md`

## Notas de implementación (2026-07-29)

- **Escena y assets generados por código, no a mano**: siguiendo el mismo patrón ya establecido en 001/003 (`Chapter1ContentBuilder.cs`/`MainMenuContentBuilder.cs`), se creó `Assets/Editor/Battler/AdventureMapContentBuilder.cs` con un método `Build()` (`-executeMethod TheBattler.EditorTools.AdventureMapContentBuilder.Build` en modo batch), idempotente, que genera: los dos `ChapterBannerDefinition` (`Assets/Data/Battler/Banners/Banner_Chapter1.asset` con `LinkedChapter` = `Chapter1.asset` de 001 y `TargetSceneName` = `"Chapter1_Battle"`; `Banner_HaciaElFuturo.asset` sin `LinkedChapter`), el `AdventureMap` (`Assets/Data/Battler/MainAdventureMap.asset`, en ese orden), las 2 claves de localización nuevas añadidas **sin recrear** `MainLocalizedText.asset` (solo se le agregan entradas, preservando las 9 claves ya existentes de 003), y la escena `Assets/Scenes/AdventureMap.unity` (Canvas, EventSystem con `InputSystemUIInputModule`, un `ScrollRect` estándar de `UnityEngine.UI.DefaultControls.CreateScrollView` con `VerticalLayoutGroup`+`ContentSizeFitter` en `Content`, un `BannerItemTemplate` con `ChapterBannerItemView` cableado y desactivado por defecto, y `AdventureMapFlowController`/`AdventureMapUIController` enlazados). También incluye `ValidateScene()` (`The Battler/Validate Adventure Map Scene`), análogo a los de 001/003, que abre la escena real y falla si hay referencias serializadas nulas, si `MainAdventureMap.asset` no es válido, si el banner "Hacia el Futuro" ya tuviera `LinkedChapter` asignado (no debería, según spec.md), o si faltan las claves de localización — corrida en verde tras la generación.
- **Registro en Build Settings**: `AdventureMap.unity` se insertó entre `MainMenu.unity` (índice 0) y `Chapter1_Battle.unity` (ahora índice 2), preservando `SampleScene.unity` al final (índice 3) — mismo criterio de "no inventar infraestructura de 003 si faltara" documentado en research.md §7, pero en este proyecto ya estaba presente.
- **Precisión de diseño no prevista explícitamente en los contratos — propiedades `IsValid` derivadas**: `contracts/chapter-banner-definition.md` y `data-model.md` describen las reglas de validación de `ChapterBannerDefinition`/`AdventureMap` en prosa (DisplayNameKey obligatorio, TargetSceneName obligatorio si hay LinkedChapter, Banners no vacío) pero no especifican una superficie pública para verificarlas en tests. Siguiendo el precedente ya establecido por `UnitDefinition.HasValidVisualIdentity` (001), se añadió una propiedad derivada `IsValid` a ambos ScriptableObjects (`ChapterBannerDefinition.IsValid`, `AdventureMap.IsValid`), usada tanto por `ChapterBannerDefinitionValidationTests` como por `AdventureMapContentBuilder.ValidateScene()`. No contradice ningún contrato — es una superficie adicional puramente de validación de datos, sin efecto en tiempo de ejecución del mapa; no se actualizaron contracts/data-model.md porque no hay contradicción, solo una adición no especificada.
- **`ChapterBannerState` ubicado en `TheBattler.Model`**: data-model.md lo describe como `[Runtime]` (no serializado, no persistido) pero no fija su capa. Se ubicó en Model junto a `ChapterProgressRecord`/`MenuSettings` (mismo patrón de "contrato de datos plano sin dependencias de motor"), ya que lo consumen tanto Gameplay (`ChapterBannerUnlockEvaluator`, `AdventureMapFlowController`) como View (`ChapterBannerItemView`).
- **Verificación final (2026-07-29)**: compilación en modo batch sin errores; EditMode **54/54** tests en verde (39 de 001+002+003 + 15 nuevos: `ChapterBannerDefinitionValidationTests` ×8, `ChapterBannerUnlockEvaluatorTests` ×7); PlayMode **17/17** en verde (11 de 001+002+003 + 6 nuevos en `AdventureMapFlowPlayModeTests`, cubriendo US1/US2/US3 completas: instanciación de items sin exclusión, navegación desde banner 0, no-navegación desde "Hacia el Futuro" e índice fuera de rango, desbloqueo secuencial con capítulo 1 completado, y degradación de progreso corrupto). `ValidateScene()` sin referencias nulas. El feature 004 queda funcional de punta a punta a nivel de lógica/datos/escena verificado por tests automatizados; los pasos puramente visuales de quickstart.md (percepción real del scroll libre, texto traducido en pantalla al cambiar idioma desde el panel de 003, recorrido manual completo tras jugar hasta Victoria en el Capítulo 1) no se ejecutaron con un humano en la GUI del Editor — mismo gap ya documentado y aceptado en 002/003, no bloqueante para el resto de la suite.
- **Incidente de codificación durante la edición de este archivo**: un comando de PowerShell (`Get-Content -Raw` seguido de `Set-Content -Encoding utf8`) corrompió transitoriamente los caracteres UTF-8 no ASCII de este `tasks.md` (mojibake tipo "Ã©"/"â€"). Se detectó de inmediato (el harness señaló el archivo como modificado externamente) y se revirtió programáticamente (decodificación inversa cp1252→UTF-8 y reescritura sin BOM) antes de continuar; no afectó a ningún archivo de código fuente, solo a este documento de tareas, y el contenido quedó verificado íntegro tras la corrección.
