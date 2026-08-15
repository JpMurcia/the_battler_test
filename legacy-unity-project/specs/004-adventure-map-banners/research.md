# Research: Mapa de Aventuras (Banners) y Desbloqueo Secuencial

## 1. Modelado de banners como referencia, no duplicación, de `ChapterDefinition`

**Decision**: `ChapterBannerDefinition` (nuevo ScriptableObject) mantiene una referencia opcional (nullable) a un `ChapterDefinition` existente (`001-chapter1-vertical-slice`) en vez de repetir campos de contenido de capítulo (diálogos, unidades, oleadas). Los únicos campos propios del banner son metadatos de presentación/navegación que `ChapterDefinition` no tiene hoy: `TargetSceneName` (a qué escena navegar) y `DisplayNameKey`/`BannerArt` (cómo se ve en el mapa).

**Rationale**: El propio input de la feature y las notas del orquestador son explícitas: "no duplicate chapter content fields, only add banner-specific presentation/unlock metadata". `ChapterDefinition.ChapterId` ya es la clave que `ChapterProgressRecord` usa (002); reutilizarlo por referencia (`LinkedChapter.ChapterId`) evita que un banner y su capítulo puedan desincronizarse (dos strings iguales mantenidos a mano en dos assets distintos).

**Alternatives considered**:
- Duplicar `chapterId` como string propio en `ChapterBannerDefinition`: rechazado — reintroduce exactamente el riesgo de desincronización que la referencia directa evita, y viola la instrucción explícita de no duplicar datos de capítulo.
- Que `ChapterDefinition` mismo tenga campos de banner (`displayName`, `bannerArt`, orden de mapa): rechazado — mezclaría datos de contenido de batalla (001, ya usado por `BattleStateManager`/UI de despliegue) con datos de presentación de un hub de navegación que no existía cuando 001 se diseñó; además rompería la composición "un capítulo puede no tener banner togavía" y viceversa.

## 2. Desbloqueo derivado, no persistido

**Decision**: El estado de desbloqueo/completado de cada banner **no se guarda en ningún archivo nuevo**. Se calcula en memoria cada vez que se entra al mapa, mediante `ChapterBannerUnlockEvaluator.Evaluate(banners, progress)`, a partir de: (a) el orden de `AdventureMap.Banners` y (b) el `ProgressSaveData` ya persistido por `002-local-save-progress` (leído vía `IChapterProgressStore.Load()`, sin modificarlo — FR-006).

**Rationale**: `ProgressSaveData` (002) ya es la única fuente de verdad de "qué capítulo se completó"; el orden de banners ya vive en el `AdventureMap` (dato de diseño). Persistir un tercer estado ("banner X está desbloqueado") sería redundante y crearía una fuente de verdad adicional que podría desincronizarse del progreso real (p. ej. si se reordenan banners en un `AdventureMap` en desarrollo). Derivarlo en cada carga es barato (una pasada lineal sobre, hoy, 2 elementos) y cumple FR-010 (reflejar el estado de completado "la próxima vez que el jugador entra al mapa") de forma trivial: siempre se recalcula desde el archivo fuente.

**Alternatives considered**:
- Añadir un campo `unlockedChapterIds` a `ProgressSaveData` (002), escrito por el mapa: rechazado — obligaría a modificar el esquema de guardado de 002 (fuera de alcance de esta feature, spec.md Key Entities dice explícitamente "sin modificarse") y a mantener sincronizados dos conceptos (completado vs. desbloqueado) que ya son derivables el uno del otro por posición.
- Cachear el resultado en un archivo propio de esta feature: rechazado por YAGNI — no hay ningún escenario de rendimiento (2 banners hoy, N pequeño en el roadmap) que lo justifique, y añadiría una cuarta fuente de estado local (tras `progress.json`, `menu-settings.json`) sin beneficio medible.

## 3. Algoritmo de desbloqueo genérico por posición

**Decision**: Para el banner en el índice `i` del array `AdventureMap.Banners` (orden = secuencia, FR-007):
- `IsUnlocked(i)`: `true` si `i == 0`; si no, `true` solo si el banner en `i - 1` está completado (`IsCompleted(i - 1)`).
- `IsCompleted(i)`: `true` solo si `Banners[i].LinkedChapter != null` **y** existe un `ChapterProgressRecord` en `ProgressSaveData.chapters` con `chapterId == Banners[i].LinkedChapter.ChapterId` y `isCompleted == true`. Un banner sin `LinkedChapter` (como "Hacia el Futuro" hoy) nunca puede estar "completado" — no tiene contra qué capítulo comparar.
- `IsSelectable(i)`: `IsUnlocked(i) && Banners[i].HasPlayableDestination` (es decir, `LinkedChapter != null`). Esta es la distinción clave del Edge Case de spec.md: "Hacia el Futuro" puede eventualmente quedar `IsUnlocked == true` (si se completa el Capítulo 1) sin volverse nunca seleccionable hasta que reciba un `LinkedChapter`/`TargetSceneName` real.

**Rationale**: Es la lectura literal de FR-007 ("completar el capítulo del banner N desbloquea el banner N+1") y del Edge Case sobre banners futuros — el mecanismo no nombra "Imperio de los Test/Robot" ni "Hacia el Futuro" en ningún punto de la lógica, solo índices de array y presencia/ausencia de `LinkedChapter`. Cuando "Hacia el Futuro" reciba su `ChapterDefinition` real (Fase 11 del roadmap), bastará con asignarle `LinkedChapter`/`TargetSceneName` en el asset `AdventureMap` — el algoritmo no cambia (cumple la Assumption de spec.md: "no debe requerir cambios cuando esa spec exista").

**Alternatives considered**:
- Desbloqueo basado en un campo `requiredPreviousChapterId` explícito por banner (en vez de posición de array): rechazado — añade un grado de libertad (¿y si no coincide con el orden visual?) que la spec no pide; el input de la feature es explícito en que el orden determina la secuencia ("El orden determina la secuencia de desbloqueo", spec.md Key Entities § AdventureMap). Posición de array es más simple y suficiente (Principio VI).
- Que `IsCompleted` de un banner sin `LinkedChapter` lance una excepción o sea `NEEDS CLARIFICATION`: rechazado — spec.md ya resuelve este caso en el Edge Case dedicado ("Hacia el Futuro" permanece visible pero no seleccionable, "no debe confundirse con un banner bloqueado por progreso"); devolver `false` de forma silenciosa es el comportamiento correcto y ya está cubierto por la distinción `IsUnlocked` vs. `IsSelectable` de arriba.

## 4. Scroll libre: no añadir lógica de bloqueo

**Decision**: La navegación por el mapa (FR-001, FR-002, SC-001) se implementa con el `ScrollRect` estándar de `UnityEngine.UI`, con su `Content` poblado por un `VerticalLayoutGroup` (uno de los helpers ya usados en `MainMenuContentBuilder`, `CreateVerticalColumn`). No se añade ningún código que consulte `IsUnlocked`/`IsSelectable` para decidir si el `ScrollRect` puede desplazarse a una posición determinada — esos flags solo controlan `Button.interactable` de cada `ChapterBannerItemView` individual.

**Rationale**: `ScrollRect` ya permite desplazarse libremente por todo su contenido por diseño; la única forma de que un banner bloqueado "detenga" el scroll sería escribir código específico para eso, que es exactamente lo que FR-002 prohíbe. La forma más simple y correcta de cumplir "no debe restringir el movimiento por la presencia de banners bloqueados" es no acoplar en absoluto el estado de desbloqueo al componente de scroll.

**Alternatives considered**:
- `ScrollRect.movementType = Clamped` vs. `Elastic` vs. `Unrestricted`: es una decisión puramente estética de "qué pasa en los extremos de la lista" (rebote vs. tope duro), no afecta si banners intermedios bloqueados detienen el scroll (ninguna de las tres opciones nativas de Unity hace eso). Se deja como detalle de implementación sin impacto en FR-002; cualquiera de las tres es válida.

## 5. Nombre de banner localizado sin extender `LocalizedTextBinder`

**Decision**: `ChapterBannerItemView` llama directamente a `LocalizedTextTable.GetText(key, language)` (método ya público, 003) para fijar el texto de su nombre, en vez de usar el componente `LocalizedTextBinder`. La tabla (`MainLocalizedText.asset`, reutilizada de 003) y el idioma activo (leído una vez de `IMenuSettingsStore.Load().language` al construir el mapa) se pasan como parámetros al poblar cada item.

**Rationale**: `LocalizedTextBinder.m_Key` es un `[SerializeField] private string` sin setter público — está diseñado para textos fijos cableados en el Editor (botones del menú, título de ajustes), no para una lista cuya cantidad de items depende de `AdventureMap.Banners.Length` en tiempo de ejecución. Añadir un setter público a `LocalizedTextBinder` para este único caso de uso sería un cambio a un archivo ya implementado y probado de 003 por un beneficio marginal (evitar cuatro líneas de lookup manual); llamar a `GetText` directamente reutiliza exactamente el mismo contrato de fallback (clave inexistente → `"[key]"`; traducción vacía → fallback a español) sin tocar 003.

**Alternatives considered**:
- Extender `LocalizedTextBinder` con `SetKey(string)` público: rechazado — modifica un archivo de una feature ya cerrada por un ahorro menor, y mezcla dos casos de uso (texto fijo vs. texto data-driven) en un solo componente.
- Traducir el nombre del banner en el propio `ChapterBannerDefinition` (campo de texto plano en vez de clave): rechazado — perdería la localización a 4 idiomas ya construida en 003 (`MainLocalizedText.asset`) sin ninguna razón; el input de la feature usa nombres en español ("Imperio de los Test/Robot", "Hacia el Futuro") como contenido, no como decisión de mantenerlos sin traducir.

## 6. Idioma activo del mapa: lectura de `MenuSettings` (003), sin escritura

**Decision**: `AdventureMapFlowController` resuelve `IMenuSettingsStore` en `Awake()` (mismo patrón que `MainMenuFlowController`) únicamente para leer `MenuSettings.language` una vez al entrar al mapa; no se suscribe a cambios de idioma en vivo (no hay panel de ajustes en esta pantalla, spec.md no lo pide) ni escribe nunca en `menu-settings.json`.

**Rationale**: El idioma ya elegido en el menú principal (003) debe reflejarse en los nombres de banner sin que el jugador tenga que volver a elegirlo; leerlo de la misma fuente que ya usa el menú evita introducir un tercer mecanismo de idioma. No se justifica un refresco en vivo porque el único lugar donde el idioma cambia (`SettingsPanelController`, 003) vive en la escena de menú, no en la del mapa.

**Alternatives considered**:
- Pasar el idioma como parámetro de escena (vía `PlayerPrefs` o un singleton estático): rechazado — `MenuSettings`/`IMenuSettingsStore` ya cumplen ese rol persistido; introducir un canal paralelo solo para pasar un enum entre escenas sería redundante (YAGNI).

## 7. Registro de escena en Build Settings

**Decision**: Añadir `Assets/Scenes/AdventureMap.unity` (nueva) a Build Settings junto a `MainMenu.unity` y `Chapter1_Battle.unity` (ya registradas por 003). El índice exacto y si `MainMenuFlowController.TargetSceneName` pasa a apuntar a `AdventureMap` en vez de `Chapter1_Battle` directamente quedan fuera del alcance de diseño de esta feature (ver §8) — se documenta aquí solo el prerrequisito de infraestructura de que la escena debe existir y estar registrada para que `ISceneNavigator.LoadScene("AdventureMap")` (invocado desde donde sea que se dispare, dentro o fuera de esta feature) funcione en un build real, mismo motivo que 003 §5 documentó para `Chapter1_Battle`.

**Rationale**: Sin este registro, `SceneManager.LoadScene("AdventureMap")` fallaría en un build (aunque funcione en el Editor) — mismo prerrequisito de infraestructura que 003 ya resolvió para su propia escena.

## 8. Punto de entrada al mapa: fuera de alcance (heredado de spec.md)

**Decision**: Esta feature **no modifica** `MainMenuFlowController.cs` (003). Hoy, `StartNewGame()`/`ContinueGame()` navegan con `TargetSceneName = "Chapter1_Battle"` (código ya implementado); esta feature no cambia ese valor ni añade un salto intermedio por `AdventureMap.unity`.

**Rationale**: spec.md lo declara explícitamente en Assumptions: "El punto de entrada al mapa de aventuras (desde el menú principal, botones 'Empezar'/'Continuar') ya está cubierto por 003-main-menu-config; esta spec cubre únicamente la pantalla del mapa en sí, no cómo se llega a ella." Cambiar `MainMenuFlowController` sería reabrir el alcance de una feature ya implementada sin que esta spec lo pida. Queda documentado aquí como un hueco de integración conocido y explícito (no un olvido): en algún punto posterior (parte de esta misma feature en `/speckit-tasks`, o una corrección menor de infraestructura como la que 002→003 ya tuvo una vez), `MainMenuFlowController.TargetSceneName` tendría que pasar de `"Chapter1_Battle"` a `"AdventureMap"` para que el flujo completo menú→mapa→batalla exista de punta a punta. No se resuelve en este plan porque spec.md lo excluye explícitamente de su alcance.

**Alternatives considered**:
- Modificar `MainMenuFlowController` como parte de esta feature de todas formas, por sentido común de "flujo completo": rechazado — contradice explícitamente la Assumption citada arriba del spec ya aprobado; si se necesita, debe ser una decisión consciente tomada en `/speckit-clarify`/`/speckit-tasks`, no una libertad tomada en `/speckit-plan`.

## 9. Estrategia de testing

**Decision**: Mismo split EditMode/PlayMode que 001/002/003.
- EditMode: `ChapterBannerUnlockEvaluatorTests` (primer banner siempre desbloqueado incluso sin progreso; banner N+1 permanece bloqueado hasta que N se completa; `ProgressSaveData` vacío/corrupto-ya-normalizado por `IChapterProgressStore.Load()` produce el mismo resultado que "sin progreso" — solo el primer banner desbloqueado; un banner sin `LinkedChapter` nunca cuenta como "completado" a efectos de desbloquear el siguiente; `IsSelectable` es `false` para un banner desbloqueado pero sin `LinkedChapter`, aunque `IsUnlocked` sea `true`). `ChapterBannerDefinitionValidationTests` (si `LinkedChapter != null` entonces `TargetSceneName` no puede ser vacío; `AdventureMap.Banners` no puede estar vacío).
- PlayMode: `AdventureMapFlowPlayModeTests` — `TrySelectBanner` navega (vía un `ISceneNavigator` doble de test, mismo patrón que `MainMenuFlowPlayModeTests` de 003) solo cuando el banner objetivo es desbloqueado y jugable; devuelve sin navegar ni lanzar excepción para un banner bloqueado, y también para "Hacia el Futuro" incluso en el hipotético caso de estar desbloqueado (Edge Case de spec.md).

**Rationale**: Continuación directa del patrón ya validado en 001/002/003; no introduce ninguna herramienta de testing nueva. El scroll libre (SC-001) no se presta a un assert automatizado significativo más allá de "no existe código de bloqueo" (§4) — se verifica manualmente en quickstart.md, igual de honesto que el resto de specs de este proyecto sobre qué SC son verificables por test vs. por inspección manual.
