# Research: Menú Principal y Configuración

## 1. Persistencia de `MenuSettings`

**Decision**: Archivo JSON (`UnityEngine.JsonUtility`) en `Application.persistentDataPath` (`menu-settings.json`), gestionado por `LocalMenuSettingsStore`, con el mismo patrón de escritura atómica (temp file + reemplazo) y lectura tolerante a fallos que `LocalChapterProgressStore` (feature 002).

**Rationale**: Es el mismo tipo de problema que 002 ya resolvió — un pequeño objeto de estado de partida, un único slot local, sin necesidad de consultas. Reutilizar el patrón (en vez de inventar uno nuevo) minimiza superficie de cambio y mantiene consistencia arquitectónica. Un archivo independiente de `progress.json` evita acoplar el ciclo de vida de los ajustes de menú al de guardado de progreso — son conceptos distintos (ver spec.md Key Entities) con distinta cadencia de escritura (ajustes cambian por decisión explícita del jugador; progreso cambia al resolver una batalla).

**Alternatives considered**:
- `PlayerPrefs`: rechazado — incluso siendo apto para settings simples, `PlayerPrefs` no ofrece un punto natural para el patrón de escritura atómica ni un "archivo corrupto → fallback" explícito y testeable como el que ya exige FR-013; usar `LocalMenuSettingsStore` mantiene el mismo mecanismo de tolerancia a fallos verificado en 002.
- Un único archivo compartido `progress.json` con `MenuSettings` embebido: rechazado — mezclaría dos entidades independientes (ver spec.md Assumptions: "Independiente de `ProgressSaveData`") y forzaría que cualquier fallo/migración de una afecte a la otra.

## 2. Selector de idioma sin paquete de Localization

**Decision**: Tabla de texto propia — `LocalizedTextTable`, un `ScriptableObject` con entradas `{ key, spanish, english, chinese, french }` — en vez de instalar `com.unity.localization`.

**Rationale**: `com.unity.localization` no está instalado en el proyecto (`Packages/manifest.json` no lo referencia) y trae consigo un sistema de tablas basado en Addressables más pesado del necesario para el alcance de FR-004 (traducir textos de menú y de la UI ya existente, no narrativa). Un `ScriptableObject` de datos es exactamente el patrón ya usado para contenido de diseño en este proyecto (`ChapterDefinition`, `UnitDefinition`, `EnemyWaveDefinition` — Principio V), así que seguirlo aquí evita una dependencia nueva y mantiene el criterio de "lo mínimo viable" (Principio VI).

**Alternatives considered**:
- `com.unity.localization` (paquete oficial de Unity): rechazado — sobre-ingeniería para 4 idiomas y un conjunto acotado de strings de UI; requeriría Addressables y una curva de configuración no justificada en esta fase.
- CSV/JSON externo cargado en runtime: rechazado — pierde la edición e inspección directa en el Editor de Unity que sí da un ScriptableObject, y complica la validación de que todas las claves tengan sus 4 traducciones (se puede validar con un `OnValidate`/test EditMode contra el asset serializado).

## 3. Canales de audio y conversión de volumen

**Decision**: Un `AudioMixer` (`Assets/Audio/MainAudioMixer.mixer`) con tres grupos expuestos — `MusicVolume`, `SFXVolume`, `VoiceVolume` — controlados vía `AudioMixer.SetFloat(paramName, dB)`. Los valores de `MenuSettings` se guardan como volumen lineal `[0, 1]` (más intuitivo para una UI de slider) y se convierten a decibelios al aplicarlos: `dB = volumeLineal <= 0.0001f ? -80f : Mathf.Log10(volumeLineal) * 20f`.

**Rationale**: Es la forma estándar de exponer volumen de mezcla en Unity (los parámetros de `AudioMixer` son logarítmicos en dB, pero una UI de volumen lineal es lo que el jugador espera). Guardar el valor lineal en `MenuSettings` mantiene el dato desacoplado del mecanismo de aplicación (si en el futuro se cambia de `AudioMixer` a otra cosa, el dato guardado no cambia de forma).

**Alternatives considered**:
- Guardar directamente el valor en dB: rechazado — acopla el formato de guardado a un detalle de implementación de Unity Audio, y complica escribir tests EditMode puros (que no dependen de `AudioMixer`) para `LocalMenuSettingsStore`.

**Nota de alcance**: hoy no existe ningún `AudioSource`/clip de música o efectos en el Capítulo 1 (feature 001) — el proyecto no reproduce audio todavía. Esta feature crea la infraestructura de mezcla (el `AudioMixer` y sus 3 grupos) y la aplica desde `MenuSettings`; enrutar clips de audio reales del Capítulo 1 a través de esos grupos es contenido futuro fuera del alcance de FR-003/FR-006, que solo exigen que el control exista, se aplique y persista.

**Nota de implementación (2026-07-28)**: `UnityEngine.Audio.AudioMixer` no es un `ScriptableObject` y no existe una API pública de `UnityEditor` para crear/editar un Audio Mixer completo (grupos, parámetros expuestos) por código — solo la API interna no documentada `UnityEditor.Audio.AudioMixerController`. Por eso `Assets/Audio/MainAudioMixer.mixer` quedó como paso manual de un humano en el Editor (crear el asset, exponer los 3 parámetros de Volumen del grupo Master, renombrarlos, asignarlo a `MainMenuFlowController.m_AudioMixer` en `MainMenu.unity`), en vez de generarse junto con el resto de la escena — ver `specs/003-main-menu-config/tasks.md` § Notas de implementación. `MenuAudioApplier` tolera un `AudioMixer` nulo o sin parámetros expuestos sin lanzar excepción.

## 4. Confirmación explícita ("Aplicar/Guardar") vs. aplicación en vivo

**Decision**: La UI del menú mantiene un `MenuSettings` "pendiente" (en memoria, distinto del confirmado) mientras el jugador mueve los controles. Solo al presionar "Aplicar/Guardar" el valor pendiente se aplica al `AudioMixer`/idioma activo y se persiste vía `IMenuSettingsStore.Save(...)`. Salir de la pantalla de configuración sin confirmar descarta el estado pendiente y recarga el último confirmado.

**Rationale**: Decisión explícita del usuario en la sesión de `/speckit-clarify` (ver spec.md `## Clarifications`). Requiere una copia de trabajo (`pendingSettings`) separada del estado comprometido, gestionada en la capa `View` (el componente de UI), sin que `IMenuSettingsStore`/`LocalMenuSettingsStore` necesiten saber nada sobre "pendiente vs. confirmado" — esa distinción es puramente de presentación.

**Alternatives considered**:
- Aplicar y persistir en cada cambio de control (comportamiento por defecto habitual en menús de audio): explícitamente rechazado por el usuario en clarificación; hubiera sido más simple pero no es lo pedido.

## 5. Registro de escena en Build Settings

**Decision**: Añadir `Assets/Scenes/MainMenu.unity` (nueva) como escena índice 0 de Build Settings, y `Assets/Scenes/Chapter1_Battle.unity` como índice 1. Actualmente Build Settings solo incluye `SampleScene.unity` (plantilla de Unity sin relación con el proyecto) — se deja intacta salvo por el cambio de índice, ya que tocarla/eliminarla no es parte del alcance de esta feature.

**Rationale**: FR-001 exige que el menú sea la primera pantalla al abrir el juego; en un build real de Unity eso significa ser la escena de índice 0. `Chapter1_Battle.unity` no estaba registrada en absoluto en Build Settings — sin este cambio, `SceneManager.LoadScene("Chapter1_Battle")` fallaría en un build (aunque funcione en el Editor). Es un prerrequisito de infraestructura para que FR-010/FR-011 (transición a la batalla) funcionen fuera del Editor.

## 7. Abstracción de navegación de escena (testabilidad)

**Decision**: Introducir `ISceneNavigator` (`TheBattler.Model`) — un contrato de un solo método, `LoadScene(string sceneName)` — con `UnitySceneNavigator` (`TheBattler.Gameplay`) como implementación de referencia que delega en `SceneManager.LoadScene`. `MainMenuFlowController` recibe el navegador inyectado (mismo patrón que `IChapterProgressStore`), en vez de llamar a `SceneManager` directamente.

**Rationale**: Sin esta abstracción, testear que "Empezar"/"Continuar" piden la escena correcta obligaría a cargar `Chapter1_Battle` de verdad dentro de un test PlayMode del menú — lento y acoplado a que esa escena en particular cargue sin errores, algo que ya cubren sus propios tests (001). Un contrato de un método, con un doble de test en memoria (ver [contracts/scene-navigator.md](./contracts/scene-navigator.md)), mantiene el test del menú enfocado únicamente en "¿pidió la escena correcta?".

**Alternatives considered**:
- Llamar a `SceneManager.LoadScene` directamente desde `MainMenuFlowController` sin abstracción: rechazado — obliga a los tests de navegación a cargar escenas reales o a quedar sin cobertura automatizada, perdiendo el mismo nivel de rigor que 001/002 ya establecieron para su propia lógica.
- Un evento/`UnityEvent` en vez de una interfaz inyectable: rechazado — una interfaz de un método es más simple de instanciar como doble de test (sin necesidad de `UnityEditor`/`ScriptableObject` de por medio) y sigue el mismo patrón de inyección por constructor/campo ya usado para `IChapterProgressStore`/`IMenuSettingsStore`.

## 8. Estrategia de testing

**Decision**: Mismo split EditMode/PlayMode que 001/002.
- EditMode: `LocalMenuSettingsStoreTests` (round-trip, archivo ausente, archivo corrupto — mismo esquema que `LocalChapterProgressStoreTests`), `LocalizedTextTableTests` (lookup por clave+idioma, comportamiento ante clave sin traducción).
- PlayMode: `MainMenuFlowPlayModeTests` — sin progreso solo "Empezar" visible; con progreso "Continuar" visible y navega al contenido correcto; cambios de settings sin confirmar se descartan al salir; confirmar aplica y persiste.

**Rationale**: Continuación directa del patrón ya validado en 001/002; no introduce ninguna herramienta de testing nueva.
