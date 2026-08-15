# Research: Banner Especial de Eventos: "Etapas de Fantasía"

## §1. ¿Cómo insertar un banner "fuera del flujo de desbloqueo secuencial" sin tocar `ChapterBannerUnlockEvaluator`?

**Decisión**: `AdventureMap` gana un segundo array independiente, `m_EventBanners: EventBannerDefinition[]`, separado de `m_Banners: ChapterBannerDefinition[]`. `ChapterBannerUnlockEvaluator.Evaluate` (004) sigue operando exclusivamente sobre `m_Banners`, sin cambios.

**Rationale**: `ChapterBannerUnlockEvaluator.Evaluate` calcula `isUnlocked` por índice (`i == 0 || previousCompleted`, [ChapterBannerUnlockEvaluator.cs:18](../../Assets/Scripts/Gameplay/Battler/ChapterBannerUnlockEvaluator.cs)). Insertar el banner de evento dentro de `m_Banners` correría los índices de todos los banners posteriores (mismo problema que ya documentó spec 013 al insertar Corea/Mongolia antes de "Hacia el Futuro" — ver nota histórica en `AdventureMapContentBuilder.ValidateScene`). Un array separado hace que FR-004 ("NO DEBE participar del flujo de desbloqueo secuencial") se cumpla por construcción, sin lógica condicional nueva que discriminar "banners de evento" dentro del evaluador existente — exactamente el tipo de decisión que Principio VI premia (reutilizar sin acoplar, en vez de ramificar código ya probado).

**Alternativas consideradas**:
- Añadir un flag `IsEventBanner` a `ChapterBannerDefinition` y hacer que `ChapterBannerUnlockEvaluator` lo excluya del cálculo secuencial (`previousCompleted` saltaría el banner marcado). Rechazada: acopla el evaluador ya testeado (004/006/013) a un concepto (ventanas horarias) que no le pertenece, y su índice seguiría desplazando los banners reales si un evento se inserta entre dos capítulos.

## §2. ¿Cómo evaluar la ventana horaria sin depender de un servicio externo?

**Decisión**: `EventTimeWindow` es una clase `[Serializable]` (no `ScriptableObject`) con dos campos `string` en formato ordenable `"yyyy-MM-dd HH:mm:ss"` (`m_StartLocal`, `m_EndLocal`), parseados con `DateTime.TryParseExact` (`DateTimeStyles.None` → `DateTimeKind.Unspecified`) y comparados directamente contra `DateTime.Now` (hora local del dispositivo, sin conversión a UTC).

**Rationale**: La feature (spec.md Assumptions) fija explícitamente "hora local del dispositivo" como fuente de verdad, a diferencia de `MissionEnergySaveData` (006), que usa `long` de segundos Unix UTC porque necesita **aritmética de tiempo transcurrido** correcta entre sesiones (research.md de 006 §3/§4). Aquí no hay aritmética de duración — solo una comprobación puntual "¿`now` cae dentro de `[start, end]`?" — así que convertir a UTC solo añadiría una capa de conversión sin beneficio, y complicaría que un diseñador lea/edite la ventana directamente en el Inspector (un string legible tipo "2026-08-01 00:00:00" es editable a mano; un `long` Unix no lo es sin herramienta externa).

**Alternativas consideradas**:
- Reutilizar el patrón `long` Unix UTC de `MissionEnergySaveData`. Rechazada: no hay recuperación/acumulación de tiempo que calcular aquí (a diferencia de 006), y el campo debe ser legible/editable por diseño de contenido en el Inspector.
- `DateTime` serializado nativamente. Rechazada: `UnityEngine.JsonUtility`/`SerializedProperty` no serializan `System.DateTime` de forma nativa en un campo de Inspector estándar; el patrón establecido en este proyecto para instantes de tiempo persistidos es primitivos (`string`/`long`), no tipos de .NET complejos.

## §3. ¿Dónde vive la comprobación de "batalla en curso no se interrumpe" (US3/FR-008)?

**Decisión**: en ningún lado — es la ausencia de código, no una feature nueva.

**Rationale**: Verificado contra `BattleStateManager.cs` real (`SetupChapter()`/`SetOutcome()`/`GrantLevelRewards()`): ninguno de esos métodos consulta el mapa de aventuras, `AdventureMap`, `ChapterBannerDefinition` ni ningún concepto de "ventana horaria" — la escena de batalla solo conoce su propio `ChapterDefinition` serializado y `BattleLaunchContext` (dos flags estáticos consumidos una vez). La comprobación de ventana horaria ocurre exclusivamente en `AdventureMapFlowController.TrySelectEventBanner` (equivalente nuevo de `TrySelectBanner`, 004/006), **antes** de `m_SceneNavigator.LoadScene(...)`. Una vez cargada la escena de batalla, no existe ningún punto donde el sistema vuelva a preguntar "¿sigue activo el evento?" — exactamente el comportamiento que pide Historia 3. No se necesita ningún guardia nuevo en `BattleStateManager`.

**Alternativas consideradas**:
- Añadir una comprobación periódica de ventana horaria dentro de `BattleStateManager` que aborte la batalla si expira. Rechazada explícitamente: es lo opuesto a lo que pide FR-008, y añadiría acoplamiento nuevo entre la escena de batalla y el sistema de mapa que ningún otro sistema tiene hoy (Principio VI).

## §4. ¿Cómo obtiene la fase especial su "propia dificultad" sin un sistema de multiplicadores nuevo?

**Decisión**: la "dificultad" de la fase especial es enteramente el resultado de los valores ya autorados en su propio `ChapterDefinition` (`PlayerBaseMaxHealth`, `EnemyBaseMaxHealth`, `EnemyWaves`) — el mismo mecanismo que ya usan Chapter1/Chapter2 sin pertenecer a ningún `SagaArcDefinition`. `BattleLaunchContext.RequestedArc` no se setea para este banner (queda `null`), por lo que `SetupChapter()` cae a `m_ActiveArc` (también `null` en esta escena) y los multiplicadores de 013 quedan en `1x` — ver [BattleStateManager.cs:112-118](../../Assets/Scripts/Gameplay/Battler/BattleStateManager.cs).

**Rationale**: `SagaArcDefinition.EnemyStrengthMultiplier`/`UnitCostMultiplier` (013) existen para escalar un conjunto de niveles **dentro de una progresión de capítulos** — el evento no pertenece a esa progresión (FR-004) y no tiene "capítulos" que escalar, así que reutilizar ese mecanismo sería aplicar una abstracción diseñada para otro problema. La `ChapterDefinition` de la fase especial simplemente se autora con `EnemyBaseMaxHealth`/`EnemyWaves` más exigentes que Chapter1 (ya lo prueba que `Chapter2ContentBuilder`/`EmpireOfCatsContentBuilder` hacen exactamente esto por nivel, sin pasar por un multiplicador, cuando no hay arco activo). Satisface FR-005 sin código nuevo, solo datos.

## §5. ¿Qué reutilizar para el contenido jugable de la fase especial (unidades/enemigos), dado que la narrativa/arte del evento están fuera de alcance de spec.md?

**Decisión**: la `ChapterDefinition` de la fase especial reutiliza por referencia directa las 5 `UnitDefinition` de jugador y la `EnemyWaveDefinition` (con su `UnitDefinition` de enemigo) ya autoradas por `001-chapter1-vertical-slice` (`Assets/ScriptableObjects/Battler/Chapter1/Units/**`, `Assets/ScriptableObjects/Battler/Chapter1/EnemyWave.asset`), y su escena reutiliza los prefabs ya existentes en `Assets/Prefabs/Battler/` (`PlayerBasePrefab`, `EnemyBasePrefab`, `UnitRuntime`, `Unit_*_Variant`) sin crear ningún prefab ni `UnitDefinition` nuevo.

**Rationale**: spec.md Assumptions declara explícitamente que el guion/arte específico del evento "no bloquea esta especificación de sistema" — el entregable de esta feature es el **sistema** de banner/ventana horaria, no contenido narrativo nuevo. Reutilizar el roster de Chapter1 dota a la fase especial de contenido jugable real de punta a punta (jugable, no un placeholder vacío) sin requerir autoría de arte/unidades nueva, consistente con Principio VI. Se autoran 4 `DialogueLine` nuevas mínimas — 2 pre-batalla y 2 post-batalla — para no violar el Principio I (Narrativa Integrada, que exige explícitamente diálogo **pre-batalla Y post-batalla** por capítulo, no solo pre-batalla: "Cada capítulo/mapa debe tener diálogos pre-batalla y post-batalla ligados a esa batalla específica"), con texto genérico temático ("matanza de mastodontes") que puede reemplazarse por guion real en una iteración de contenido posterior sin cambiar ningún contrato de código.

**Alternativas consideradas**:
- Autorar una unidad/enemigo "mastodonte" nueva con arte propio. Rechazada por alcance: eso es contenido de diseño (Fase 12 del roadmap ya lo declara como algo a completar "cuando se defina el guion"), no una tarea de sistema; añadirla aquí infla el scope de esta spec muy por encima de lo que sus FR/SC piden (ninguno menciona una unidad nueva).

## §6. ¿Cómo se recuerda si el evento fue completado en la ventana actual?

**Decisión**: no se necesita ningún dato nuevo. `BattleStateManager.SetOutcome()` ya llama `m_ProgressStore.SaveChapterOutcome(chapterId, outcome)` para el `ChapterId` de la fase especial (como para cualquier capítulo) — ese registro entra a `ProgressSaveData.chapters[]` (002) pero, al no estar el banner de evento en `AdventureMap.Banners` (§1), ningún otro sistema lo consulta para desbloqueo. `GrantLevelRewards()` ya otorga XP en **cada** victoria (no solo la primera) y trata el tesoro (`TreasureRewardId`) como obtenible una única vez por cuenta — el mismo comportamiento que Historia 4/Assumptions de spec.md acepta explícitamente ("salvo que una recompensa se marque como una sola vez... queda fuera de alcance").

**Rationale**: verificado contra `BattleStateManager.GrantLevelRewards()` real ([BattleStateManager.cs:258-325](../../Assets/Scripts/Gameplay/Battler/BattleStateManager.cs)): `availableExperience += m_ChapterDefinition.XpReward` no tiene guarda de "ya obtenido"; el tesoro sí la tiene (`Array.IndexOf(...) < 0`). Introducir persistencia nueva de "evento completado en esta ventana" sería infraestructura no solicitada por ningún FR/SC de spec.md — Principio VI.

## §7. Convención de contenido/escena a seguir

**Decisión**: nuevo `EventBannerContentBuilder.cs` (Editor, `[MenuItem]`) que sigue el mismo patrón de `Chapter2ContentBuilder`/`EmpireOfCatsContentBuilder`/`AdventureMapContentBuilder`: crea los `ScriptableObject` de datos (`EventBannerDefinition`, `ChapterBannerDefinition` embebido, `ChapterDefinition` de la fase especial, `DialogueLine`), construye la escena de batalla (`SpecialEventMastodonHunt_Battle.unity`) reutilizando prefabs/unidades existentes (§5), extiende `AdventureMap.unity` (abre la escena ya creada por 004, añade el `EventBannerItemView` template y cablea `m_EventBanners` en el `AdventureMap.asset`, análogo a como `MissionEnergyContentBuilder` extiende esa misma escena sin recrearla), registra la escena nueva en `EditorBuildSettings.scenes`, y expone un `[MenuItem("The Battler/Validate Special Event Banner Content")]` companion.

**Rationale**: es el único patrón de autoría de contenido que usa el proyecto (no hay escenas ni asset `.asset` creados a mano fuera de este flujo, según el precedente de las 8 features anteriores con contenido real) — seguirlo mantiene la feature reproducible/idempotente igual que las demás.
