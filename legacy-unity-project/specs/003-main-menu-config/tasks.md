---

description: "Task list template for feature implementation"
---

# Tasks: Menú Principal y Configuración

**Input**: Design documents from `/specs/003-main-menu-config/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/menu-settings-store.md](./contracts/menu-settings-store.md), [contracts/localized-text-table.md](./contracts/localized-text-table.md), [contracts/scene-navigator.md](./contracts/scene-navigator.md), [quickstart.md](./quickstart.md)

**Tests**: Incluidos — mismo patrón de verificación real (EditMode/PlayMode) ya establecido en 001/002, y research.md §8 define explícitamente la estrategia de testing de esta feature.

**Organization**: Tareas agrupadas por historia de usuario (US1/US2/US3, según spec.md) para permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

Proyecto único de Unity — capas `Assets/Scripts/{Core,Model,Gameplay,View}/Battler/`, activos en `Assets/Scenes/`, `Assets/Audio/`, `Assets/Data/Battler/`, y tests en `Assets/Tests/{EditMode,PlayMode}/Battler/`, según [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: Confirmar línea base antes de tocar código.

- [X] T001 Correr la suite EditMode + PlayMode existente (Capítulo 1 + Guardado de Progreso) en modo batch de Unity sobre `C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test` y confirmar que sigue en verde (0 errores de compilación, todos los tests en verde) antes de empezar, como línea base de referencia.

**Checkpoint**: Línea base verde confirmada antes de tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura de escena y plumbing compartido por las 3 historias de usuario. Ninguna historia puede implementarse ni probarse en Play Mode sin esto.

**⚠️ CRITICAL**: Ninguna tarea de Fase 3+ puede empezar hasta completar esta fase.

- [X] T002 [P] Crear la escena `Assets/Scenes/MainMenu.unity` (Canvas raíz, EventSystem, un panel "Main" vacío y un panel "Settings" vacío deshabilitado) y registrarla como escena índice 0 de Build Settings; registrar `Assets/Scenes/Chapter1_Battle.unity` (hoy ausente de Build Settings) como índice 1 — ver [research.md §5](./research.md)
- [X] T003 [P] Extraer el nombre de archivo de guardado a una constante pública `LocalChapterProgressStore.DefaultFileName = "progress.json"` en `Assets/Scripts/Gameplay/Battler/LocalChapterProgressStore.cs`, y actualizar `BattleStateManager.Awake()` (`Assets/Scripts/Gameplay/Battler/BattleStateManager.cs`) para usar esa constante en vez del literal — sin cambio de comportamiento (ver [plan.md § Post-Design Constitution Re-check](./plan.md))

**Checkpoint**: Escena base y constante compartida listas — las 3 historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Empezar una partida nueva desde el menú principal (Priority: P1) 🎯 MVP

**Goal**: Un jugador sin progreso guardado ve el menú principal con la opción "Empezar" y, al seleccionarla, entra a la batalla del Capítulo 1.

**Independent Test**: Lanzar el juego sin ningún guardado previo (store falso vacío en el test), confirmar que solo "Empezar" queda visible/habilitado, seleccionarla y verificar que se dispara la navegación hacia `Chapter1_Battle` — sin depender de US2 (Continuar) ni US3 (ajustes).

### Tests for User Story 1 ⚠️

> Estos tests deben escribirse primero y fallar antes de las tareas de implementación de esta fase.

- [X] T004 [P] [US1] PlayMode tests en `Assets/Tests/PlayMode/Battler/MainMenuFlowPlayModeTests.cs` (archivo nuevo): (a) con un `IChapterProgressStore` falso que devuelve `ProgressSaveData` vacío, `MainMenuFlowController.HasSavedProgress` es `false` (US1 Escenario 1); (b) invocar `StartNewGame()` invoca `ISceneNavigator.LoadScene("Chapter1_Battle")` exactamente una vez en un `FakeSceneNavigator` inyectado (doble en memoria, sin cargar una escena real — ver [contracts/scene-navigator.md](./contracts/scene-navigator.md)) (US1 Escenario 2); (c) cronometrar con `System.Diagnostics.Stopwatch` (desde `Awake()` hasta que `MainMenuFlowController` termina de aplicar `MenuSettings`/`ProgressSaveData` y queda listo para interacción) que el arranque del menú completa muy por debajo de 2s (SC-004, aserción barata dado que no hay carga de red ni contenido pesado)

### Implementation for User Story 1

- [X] T005 [US1] Crear el contrato `ISceneNavigator` (`LoadScene(string sceneName)`) en `Assets/Scripts/Model/Battler/ISceneNavigator.cs`, según [contracts/scene-navigator.md](./contracts/scene-navigator.md)
- [X] T006 [US1] Implementar `UnitySceneNavigator` (delega en `SceneManager.LoadScene`) en `Assets/Scripts/Gameplay/Battler/UnitySceneNavigator.cs` — depende de T005
- [X] T007 [US1] Crear `MainMenuFlowController` en `Assets/Scripts/Gameplay/Battler/MainMenuFlowController.cs`: en `Awake()` construye `IChapterProgressStore` (mismo patrón que `BattleStateManager`, usando `LocalChapterProgressStore.DefaultFileName` sobre `Application.persistentDataPath`) e `ISceneNavigator` (por defecto `UnitySceneNavigator`, ambos inyectables por test); expone `bool HasSavedProgress` (`Load().chapters.Length > 0`) y `void StartNewGame()` que invoca `LoadScene("Chapter1_Battle")` (hace pasar T004a/b/c) — depende de T003, T006
- [X] T008 [US1] Crear `MainMenuUIController` en `Assets/Scripts/View/Battler/MainMenuUIController.cs`: referencia al botón "Empezar" (TMP), siempre habilitado, con `OnClick` enlazado a `MainMenuFlowController.StartNewGame()`; referencia al botón "Continuar" mantenida deshabilitada/oculta por defecto (se completa en US2) — depende de T007
- [X] T009 [US1] Añadir al Canvas de `MainMenu.unity` el botón "Empezar" (TMP) y el GameObject raíz con `MainMenuFlowController` + `MainMenuUIController` enlazados, en `Assets/Scenes/MainMenu.unity` — depende de T008

**Checkpoint**: US1 completa y verificable de forma independiente — sin progreso guardado, el menú muestra solo "Empezar" y navega correctamente al Capítulo 1.

---

## Phase 4: User Story 2 - Continuar el progreso guardado desde el menú principal (Priority: P2)

**Goal**: Un jugador con progreso guardado válido ve la opción "Continuar" además de "Empezar", y retoma el juego reflejando su progreso.

**Independent Test**: Con un `IChapterProgressStore` falso que devuelve al menos un `ChapterProgressRecord`, confirmar que "Continuar" aparece habilitado junto a "Empezar" y que seleccionarlo dispara la misma navegación hacia el contenido jugable — sin depender de haber jugado realmente US1 antes (el store falso ya viene preparado).

### Tests for User Story 2 ⚠️

- [X] T010 [US2] PlayMode tests en `Assets/Tests/PlayMode/Battler/MainMenuFlowPlayModeTests.cs` (mismo archivo que T004, secuencial): (a) con un store falso que devuelve `ProgressSaveData` con al menos un `ChapterProgressRecord`, `HasSavedProgress` es `true` y "Continuar" queda habilitado/visible junto a "Empezar" (US2 Escenario 1); (b) invocar `ContinueGame()` invoca `ISceneNavigator.LoadScene("Chapter1_Battle")` en el mismo `FakeSceneNavigator` (US2 Escenario 2 — ver spec.md Assumptions sobre destino único mientras no exista la Fase 4); (c) con un store falso que simula guardado corrupto (devuelve `ProgressSaveData` vacío, mismo contrato de fallback que `IChapterProgressStore.Load()` en 002), `HasSavedProgress` es `false` — solo "Empezar" (US2 Escenario 3 / FR-009)

### Implementation for User Story 2

- [X] T011 [US2] Añadir `void ContinueGame()` a `MainMenuFlowController` (misma navegación vía `ISceneNavigator` que `StartNewGame()`, hacia `Chapter1_Battle`) en `Assets/Scripts/Gameplay/Battler/MainMenuFlowController.cs` (mismo archivo que T007, secuencial; hace pasar T010a/b) — depende de T007
- [X] T012 [US2] En `MainMenuUIController`, mostrar/habilitar el botón "Continuar" si y solo si `HasSavedProgress`, y enlazar su `OnClick` a `ContinueGame()`, en `Assets/Scripts/View/Battler/MainMenuUIController.cs` (mismo archivo que T008, secuencial; hace pasar T010c a nivel de UI) — depende de T008 y T011
- [X] T013 [US2] Añadir el botón "Continuar" al Canvas de `MainMenu.unity`, enlazado a `MainMenuUIController`, en `Assets/Scenes/MainMenu.unity` (mismo archivo que T009, secuencial) — depende de T012

**Checkpoint**: US1 y US2 funcionan juntas e independientemente — el menú distingue correctamente Empezar/Continuar según el progreso real, incluida la degradación ante guardado corrupto.

---

## Phase 5: User Story 3 - Ajustar configuración básica antes de jugar (Priority: P3)

**Goal**: Un jugador puede ajustar 3 canales de volumen (música/SFX/voces) y el idioma (Español/Inglés/Chino/Francés) del menú desde el propio menú, confirmando con "Aplicar/Guardar"; los valores se mantienen entre sesiones.

**Independent Test**: Desde el menú (sin haber jugado ninguna partida), cambiar los 3 volúmenes y el idioma, confirmar con "Aplicar/Guardar", y verificar (vía store falso o archivo real) que persisten tras un reinicio; verificar por separado que cambios sin confirmar se descartan al salir del panel — sin depender de US1 ni US2.

### Tests for User Story 3 ⚠️

- [X] T014 [P] [US3] EditMode tests en `Assets/Tests/EditMode/Battler/LocalMenuSettingsStoreTests.cs` (archivo nuevo): round-trip guardar→cargar; archivo ausente ⇒ valores por defecto (`musicVolume`/`sfxVolume`/`voiceVolume` = `1.0`, `language` = `Spanish`); archivo corrupto/JSON malformado ⇒ los mismos valores por defecto al cargar, sin lanzar excepción; valores fuera de `[0,1]` se clampan tanto al cargar como al guardar; con una ruta de archivo inválida/no escribible, `Save()` no lanza excepción (FR-013, mismo caso que el análogo `SaveChapterOutcome` de `LocalChapterProgressStoreTests` en 002)
- [X] T015 [P] [US3] EditMode tests en `Assets/Tests/EditMode/Battler/LocalizedTextTableTests.cs` (archivo nuevo): lookup exacto por clave+idioma; clave existente con traducción vacía para el idioma pedido hace fallback a `spanish`; clave inexistente devuelve el marcador `"[key]"` sin lanzar excepción
- [X] T016 [US3] PlayMode tests en `Assets/Tests/PlayMode/Battler/MainMenuFlowPlayModeTests.cs` (mismo archivo que T004/T010, secuencial): (a) modificar sliders/idioma en `SettingsPanelController` sin invocar "Aplicar/Guardar" y descartar el panel ⇒ `IMenuSettingsStore.Save` (store falso) nunca se invoca, y los valores expuestos siguen siendo los últimos confirmados (Historia 3 Escenario 3 / Edge Case); (b) invocar "Aplicar/Guardar" ⇒ `Save` se invoca exactamente una vez con los valores pendientes, y quedan aplicados de inmediato (audio + idioma activo) (Historia 3 Escenario 2)

### Implementation for User Story 3

- [X] T017 [P] [US3] Crear `SupportedLanguage` (enum: `Spanish`, `English`, `Chinese`, `French`) en `Assets/Scripts/Core/Battler/SupportedLanguage.cs`
- [X] T018 [US3] Crear `MenuSettings` (`formatVersion`, `musicVolume`/`sfxVolume`/`voiceVolume` float `[0,1]`, `language`) en `Assets/Scripts/Model/Battler/MenuSettings.cs`, según [data-model.md § MenuSettings](./data-model.md#menusettings) — depende de T017
- [X] T019 [US3] Crear el contrato `IMenuSettingsStore` (`Load()`, `Save(MenuSettings)`) en `Assets/Scripts/Model/Battler/IMenuSettingsStore.cs`, según [contracts/menu-settings-store.md](./contracts/menu-settings-store.md) — depende de T018
- [X] T020 [P] [US3] Crear `LocalizedStringEntry` (`key`, `spanish`, `english`, `chinese`, `french`) en `Assets/Scripts/Model/Battler/LocalizedStringEntry.cs`
- [X] T021 [US3] Crear `LocalizedTextTable` (`ScriptableObject`, `entries[]`, `GetText(key, language)` con fallback a español y marcador `"[key]"`) en `Assets/Scripts/Model/Battler/LocalizedTextTable.cs`, según [contracts/localized-text-table.md](./contracts/localized-text-table.md) (hace pasar T015) — depende de T017, T020
- [X] T022 [US3] Implementar `LocalMenuSettingsStore` (constructor con ruta inyectable, `Load()`/`Save()` con clamp `[0,1]`, escritura atómica temp+reemplazo, try/catch que nunca relanza — mismo patrón que `LocalChapterProgressStore`) en `Assets/Scripts/Gameplay/Battler/LocalMenuSettingsStore.cs`, según [contracts/menu-settings-store.md](./contracts/menu-settings-store.md) (hace pasar T014) — depende de T019
- [X] T023 [P] [US3] Implementar `MenuAudioApplier` (conversión volumen lineal `[0,1]`→dB y `AudioMixer.SetFloat` para los 3 parámetros expuestos) en `Assets/Scripts/Gameplay/Battler/MenuAudioApplier.cs`, según [research.md §3](./research.md) — depende de T018
- [X] T024 [P] [US3] Crear el activo `AudioMixer` `Assets/Audio/MainAudioMixer.mixer` con 3 grupos/parámetros expuestos (`MusicVolume`, `SFXVolume`, `VoiceVolume`)
- [X] T025 [P] [US3] Crear el activo `Assets/Data/Battler/MainLocalizedText.asset` (instancia de `LocalizedTextTable`), poblado con las claves del menú principal en los 4 idiomas (`menu.start`, `menu.continue`, `menu.settings`, `menu.apply`, `menu.audio.music`, `menu.audio.sfx`, `menu.audio.voice`, `menu.language`) — depende de T021
- [X] T026 [US3] Crear `LocalizedTextBinder` (componente reutilizable sobre `TMP_Text`, `Refresh(SupportedLanguage)` vía `LocalizedTextTable.GetText`) en `Assets/Scripts/View/Battler/LocalizedTextBinder.cs`, según [contracts/localized-text-table.md](./contracts/localized-text-table.md) — depende de T021
- [X] T027 [US3] Crear `SettingsPanelController` (3 sliders + selector de idioma, estado `pendingSettings` separado del confirmado, botón "Aplicar/Guardar" que invoca `IMenuSettingsStore.Save` + `MenuAudioApplier` + refresco de todos los `LocalizedTextBinder` activos de la escena, y descarta `pendingSettings` al salir del panel sin confirmar) en `Assets/Scripts/View/Battler/SettingsPanelController.cs` (hace pasar T016) — depende de T022, T023, T026
- [X] T028 [US3] En `MainMenuFlowController.Awake()`/`Start()`, cargar `MenuSettings` vía `IMenuSettingsStore.Load()` y aplicarlo (audio + idioma) automáticamente antes de que el menú quede interactivo, sin intervención del jugador (FR-002) en `Assets/Scripts/Gameplay/Battler/MainMenuFlowController.cs` (mismo archivo que T007/T011, secuencial) — depende de T022, T023, T026
- [X] T029 [US3] Añadir el panel de configuración (sliders, selector de idioma, botón Aplicar/Guardar) al Canvas de `MainMenu.unity`, referenciando `MainAudioMixer.mixer` y `MainLocalizedText.asset`, y confirmar que ese panel **no** existe ni es alcanzable desde `Chapter1_Battle.unity` (FR-007) en `Assets/Scenes/MainMenu.unity` (mismo archivo que T009/T013, secuencial) — depende de T027, T028

**Checkpoint**: Las 3 historias funcionan de forma independiente y en conjunto — menú completo con Empezar/Continuar y configuración de audio/idioma persistente.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T030 Revisar que la implementación final no se haya desviado de [contracts/menu-settings-store.md](./contracts/menu-settings-store.md) / [contracts/localized-text-table.md](./contracts/localized-text-table.md) / [contracts/scene-navigator.md](./contracts/scene-navigator.md) / [data-model.md](./data-model.md); actualizar esos documentos si hubo un cambio deliberado durante la implementación
- [X] T031 Correr la suite completa EditMode + PlayMode (Capítulo 1 + Guardado de Progreso + Menú Principal) en modo batch de Unity y confirmar 0 errores/0 warnings de compilación y 100% de tests en verde
- [X] T032 Ejecutar una aproximación automatizada de los 11 pasos de [quickstart.md](./quickstart.md) contra la escena real (mismo enfoque documentado en `specs/002-local-save-progress/tasks.md` § Notas de implementación si no hay acceso a la GUI del Editor) — no reemplaza un walkthrough humano, pero cubre el mismo comportamiento observable de forma reproducible

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup — bloquea las 3 historias de usuario
- **User Stories (Fase 3-5)**: todas dependen de Foundational; dentro de cada historia, los tests preceden a su implementación correspondiente
- **Polish (Fase 6)**: depende de que las 3 historias estén completas

### User Story Dependencies

- **US1 (P1)**: puede empezar tras Foundational — sin dependencia de otras historias
- **US2 (P2)**: puede empezar tras Foundational; su Independent Test no depende de haber jugado US1 (el store falso ya viene preparado), pero su implementación (T011-T013) extiende los mismos archivos que creó US1 (T007-T009), por lo que en la práctica se implementa después
- **US3 (P3)**: completamente independiente en su lógica de datos (settings/localización no tocan progreso ni navegación); su Independent Test tampoco depende de US1/US2, pero su implementación toca `MainMenuFlowController`/`MainMenuUIController`/`MainMenu.unity` (mismos archivos), por lo que también se implementa después en la práctica

### Parallel Opportunities

- T002 y T003 (Fase 2) son independientes entre sí — archivos distintos
- T004 (test PlayMode de US1) puede ejecutarse en paralelo con el resto de Fase 3 aún no iniciado
- T014, T015 (tests EditMode de US3) y T017, T020 (tipos base de US3) pueden ejecutarse en paralelo entre sí — archivos distintos sin dependencia cruzada
- T023 (MenuAudioApplier) y T024 (activo AudioMixer) pueden ejecutarse en paralelo con T022 (LocalMenuSettingsStore) — solo comparten `MenuSettings` (T018) como prerrequisito común, ya completado
- T005 (ISceneNavigator) es independiente de T017/T018/T020 (tipos de US3) aunque pertenezcan a historias distintas — no comparten archivo ni tipo
- Las implementaciones de US1/US2/US3 comparten `MainMenuFlowController.cs`, `MainMenuUIController.cs` y `MainMenu.unity`, por lo que sus tareas de implementación son intrínsecamente secuenciales entre historias, aunque cada historia sea conceptualmente independiente y su Independent Test no dependa de las otras

---

## Implementation Strategy

### MVP First (User Story 1 solamente)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante)
3. Completar Fase 3: US1 (menú con "Empezar" navegando al Capítulo 1)
4. **Detener y validar**: correr T004 en verde de forma aislada
5. Esto ya es útil por sí solo: el juego tiene un punto de entrada real en vez de arrancar directo en batalla

### Incremental Delivery

1. Setup + Foundational → escena base lista
2. + US1 → punto de entrada mínimo (MVP)
3. + US2 → retomar progreso guardado
4. + US3 → configuración de audio/idioma persistente
5. Fase 6 → verificación final y quickstart manual

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- US1/US2 comparten `MainMenuFlowController.cs`/`MainMenuUIController.cs`/`MainMenu.unity` porque ambas historias son, en esencia, dos ramas del mismo flujo de navegación del menú (ver spec.md, ambas comparten FR-008/FR-010/FR-011) — igual que 002 agrupó Load/Save/Clear en un único servicio pequeño (Principio VI)
- `ISceneNavigator`/`UnitySceneNavigator` (T005/T006) se introdujeron durante `/speckit-analyze` (hallazgo I1) para que la navegación de US1/US2 fuera testeable con un doble en memoria, sin cargar `Chapter1_Battle.unity` real dentro de cada test PlayMode del menú — ver research.md §7
- US3 es la historia con más superficie nueva (6 tipos/servicios nuevos) porque introduce dos conceptos de datos que no existían antes en el proyecto (ajustes de audio, tabla de localización); research.md documenta por qué se optó por el patrón más simple posible en cada caso (reutilizar el patrón de store JSON de 002, ScriptableObject en vez de un paquete de Localization)
- La UI existente de 001 (`Chapter1_Battle.unity`) no se modifica en esta feature: revisado en código, no tiene texto estático traducible hoy (solo un número de coste y contenido narrativo, este último fuera de alcance de FR-004) — ver data-model.md § Relación con entidades existentes
- T032 probablemente requiera un humano en el Editor de Unity (GUI) para los pasos de inspección visual (idioma aplicado en pantalla, sliders), igual que quedó documentado para T018 en `specs/002-local-save-progress/tasks.md`

## Notas de implementación (2026-07-28)

- **Escena y assets generados por código, no a mano**: siguiendo el mismo patrón ya establecido en 001 (`Assets/Editor/Battler/Chapter1ContentBuilder.cs`), se creó `Assets/Editor/Battler/MainMenuContentBuilder.cs` con un método `Build()` (`-executeMethod TheBattler.EditorTools.MainMenuContentBuilder.Build` en modo batch) que genera `MainLocalizedText.asset` y `MainMenu.unity` (Canvas, botones Empezar/Continuar/Configuración vía `TMPro.TMP_DefaultControls`/`UnityEngine.UI.DefaultControls`, panel de ajustes con 3 sliders + dropdown de idioma, y el cableado de `MainMenuFlowController`/`MainMenuUIController`/`SettingsPanelController`), y registra `MainMenu.unity`/`Chapter1_Battle.unity`/`SampleScene.unity` en Build Settings (índices 0/1/2). También incluye `ValidateScene()` (`The Battler/Validate Main Menu Scene`), análogo al de Chapter1, que abre la escena real y falla si hay referencias serializadas nulas — corrida en verde tras la generación.
- **Desviación respecto a research.md §3 / plan.md — `Assets/Audio/MainAudioMixer.mixer` no se generó por código**: durante la implementación se confirmó (vía error de compilación real, no suposición) que `UnityEngine.Audio.AudioMixer` **no** es un `ScriptableObject` — no existe una forma soportada de crear/editar un Audio Mixer completo (grupos, parámetros expuestos) desde `UnityEditor` público; la única vía es la API interna `UnityEditor.Audio.AudioMixerController`, sin superficie pública ni documentada, inviable de reconstruir por reflexión con confianza razonable. Se dejó como **paso manual pendiente para un humano en el Editor**: crear el asset (`Assets/Audio > Create > Audio Mixer`), exponer los 3 parámetros de Volumen del grupo Master (clic derecho > "Expose ... to script"), renombrarlos `MusicVolume`/`SFXVolume`/`VoiceVolume`, y asignar el asset al campo `m_AudioMixer` de `MainMenuFlowController` en `MainMenu.unity`. Hasta entonces, `MenuAudioApplier.SetFloat` no lanza excepción (mismo tratamiento tolerante que el resto del proyecto) — simplemente no tiene efecto audible; ya no existen clips de audio reales en el proyecto de todas formas (ver research.md §3 "Nota de alcance"). El resto de FR-003/FR-006 (persistencia de los 3 volúmenes, aplicación inmediata al confirmar) está completamente implementado y cubierto por tests.
- **Verificación final (2026-07-28)**: compilación en modo batch sin errores; EditMode **39/39** tests en verde (30 de 001+002 + 9 nuevos: `LocalMenuSettingsStoreTests` ×6, `LocalizedTextTableTests` ×3); PlayMode **11/11** en verde (3 de 001/002 + 8 nuevos en `MainMenuFlowPlayModeTests`, cubriendo US1/US2/US3 completas). `ValidateScene()` sin referencias nulas.
- Se agregó `"Unity.TextMeshPro"` a las referencias de `Assets/Tests/PlayMode/Battler/TheBattler.Tests.PlayMode.asmdef` (requerido por `MainMenuFlowPlayModeTests` para instanciar `TextMeshProUGUI`/verificar `LocalizedTextBinder`); cambio permanente, no revertido (a diferencia del ajuste temporal de `UnityEditor` documentado en 002), ya que TMPro es una dependencia legítima y ya usada por `TheBattler.View`.
