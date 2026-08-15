# Research: Sistema de Energía y Escalado de Dificultad por Misión

## §1 — Formato de persistencia y semántica de "sin datos"

**Decisión**: Nuevo archivo `mission-energy.json`, agregado plano `MissionEnergySaveData` (`formatVersion`, `currentEnergy`, `lastUpdateTimestampUtc`), mismo patrón de escritura atómica (temp file + reemplazo) y de captura silenciosa de excepciones que `LocalChapterProgressStore` (002) y el `LocalPlayerProgressStore` planeado en 005. `currentEnergy` usa `-1` como valor por defecto explícito del campo (`public int currentEnergy = -1;`) para poder distinguir "sin dato guardado / corrupto" de "el jugador legítimamente tiene 0 de energía" — un archivo ausente o corrupto siempre produce un `MissionEnergySaveData` nuevo (valores por defecto de los campos), así que sin este centinela `currentEnergy` caería en el default de `int` (`0`), indistinguible de "energía en 0" real (FR-011 exige tratarlo como "energía al máximo por defecto", no como 0).

**Rationale**: Reutiliza exactamente el criterio de tolerancia a corrupción ya validado en 002/003/005 (`Load()` nunca lanza, siempre devuelve un objeto usable). Mantener el "qué significa un dato ausente" fuera del store (que solo sabe leer/escribir bytes) y dentro de `MissionEnergyController` (que sí sabe cuál es la energía máxima vigente) evita que `IMissionEnergyStore` necesite conocer `MissionEnergyConfig`/`PlayerCharacterLevel` — mismo criterio de separación que ya usa `IPlayerProgressStore.Load()` (005), que devuelve valores neutros y deja que `UnitLevelingController` interprete "sin progreso" como nivel base.

**Alternativas consideradas**:
- Añadir un campo `bool hasStoredEnergy` explícito — descartado: introduce un segundo campo que debe mantenerse sincronizado con `currentEnergy`, cuando un centinela de rango inválido (`-1`) ya es suficiente y sigue el mismo estilo compacto que `ProgressSaveData`/`MenuSettings` (un solo campo por dato, sin banderas auxiliares).
- Guardar `maxEnergy` en el archivo — descartado: `maxEnergy` es un valor derivado de `PlayerCharacterLevel` (005), que a su vez nunca se persiste (se recalcula bajo demanda); persistir `maxEnergy` crearía una copia que podría desincronizarse si el nivel de personaje cambia entre sesiones sin que el archivo de energía se reescriba primero.

## §2 — Fórmula de energía máxima según nivel de personaje

**Decisión**: `MaxEnergy = MissionEnergyConfig.baseMaxEnergy + MissionEnergyConfig.maxEnergyPerCharacterLevel * characterLevel`, lineal, con ambos coeficientes en un `ScriptableObject` (`MissionEnergyConfig`, Principio V).

**Rationale**: spec.md Assumptions deja la fórmula exacta explícitamente abierta para este documento ("no cambia el alcance de esta spec"). Con un solo capítulo jugable hoy (`001`), no hay datos de balance reales que justifiquen una curva por tramos como la de `UnitLevelingConfig` (005); una fórmula lineal de dos coeficientes cubre FR-007 ("DEBEN aumentar... la energía máxima y/o la tasa de recuperación") sin construir una abstracción de curva sin consumidor real (Principio VI).

**Alternativas consideradas**:
- Curva por tramos (`int[]` indexado por nivel, como `UnitLevelingConfig.experienceCostPerLevel`) — descartada por ahora: exigiría poblar un array de longitud variable sin ningún dato de diseño real que lo motive; queda como evolución no disruptiva (`MissionEnergyController` seguiría exponiendo `MaxEnergy` como `int`, solo cambiaría el cálculo interno) si el balance futuro lo requiere.
- Escalar también la tasa de regeneración con el nivel — descartada por ahora: FR-007 acepta "y/o"; escalar únicamente el máximo ya satisface el requisito con menos superficie de configuración, y `MissionEnergyConfig.regenIntervalSeconds` queda como constante de diseño ajustable sin recompilar.

## §3 — Regeneración por tiempo transcurrido (incluye juego cerrado)

**Decisión**: `MissionEnergyConfig.regenIntervalSeconds` define cuántos segundos reales debe transcurrir para recuperar 1 punto de energía. En `MissionEnergyController.Sync(DateTime nowUtc, int characterLevel)`:

1. Si `CurrentEnergy` (tras cargar) ya es `>= MaxEnergy` recién calculado → no se acumulan intervalos; `lastUpdateTimestampUtc` se adelanta directamente a `nowUtc` (evita "bancar" tiempo por encima del máximo, Edge Case de spec.md).
2. En otro caso, `elapsedSeconds = (nowUtc - lastUpdateTimestampUtc).TotalSeconds`; `unitsGained = floor(elapsedSeconds / regenIntervalSeconds)`. Si `unitsGained > 0`: `CurrentEnergy = min(CurrentEnergy + unitsGained, MaxEnergy)`, y `lastUpdateTimestampUtc` avanza solo `unitsGained * regenIntervalSeconds` (no salta directo a `nowUtc`) — el remanente de segundos por debajo de un intervalo completo se preserva para la siguiente llamada a `Sync`, en vez de perderse.
3. El resultado se persiste vía `store.Save(...)` siempre que `unitsGained > 0` o que el estado era "sin datos" (primera vez).

**Rationale**: preservar el remanente evita el bug típico de "resetear el reloj a `now` en cada consulta", que perdería progreso parcial hacia el siguiente punto de energía si el jugador abre la pantalla de mapa repetidamente en sesiones cortas. El mismo mecanismo cubre tanto la recuperación durante una sesión activa como con el juego cerrado (SC-003, Historia 3 Escenario 3) — `Sync` no distingue entre "tiempo transcurrido con la app abierta" y "tiempo transcurrido con la app cerrada", solo usa la diferencia entre `nowUtc` y el timestamp persistido.

**Alternativas consideradas**:
- Regeneración fraccional (`float energyPerSecond`) con redondeo al gastar/mostrar — descartada: la energía se consume y se muestra como entero (costo de misión es un `int`, FR-002); manejar fracciones solo para la regeneración añadiría un tipo de dato adicional (`float` en el archivo de guardado) sin necesidad, dado que el requisito (SC-003) solo exige que coincida "dentro de un margen de error despreciable", que un `int regenIntervalSeconds` con remanente preservado ya satisface.
- Recalcular siempre contra `nowUtc` sin preservar remanente — descartada por la pérdida de progreso descrita arriba.

## §4 — Reloj y testabilidad

**Decisión**: `MissionEnergyController.Sync` recibe `DateTime nowUtc` como parámetro explícito, en vez de leer `DateTime.UtcNow` internamente o introducir una interfaz `ISystemClock` nueva.

**Rationale**: mismo criterio de testabilidad que separa `BattleResourceController.Tick(deltaTime)` de `Update()` (001) — aislar la entrada de "tiempo" como parámetro permite que los tests EditMode (`MissionEnergyControllerTests`) simulen exactamente el paso de tiempo (incluyendo huecos largos, "juego cerrado") sin esperar tiempo real ni mockear una interfaz adicional. Introducir una interfaz de reloj sería una abstracción sin un segundo consumidor real hoy (Principio VI) — el único llamador en producción (`AdventureMapFlowController`, ver §6) simplemente pasa `DateTime.UtcNow` en su `Awake()`.

**Alternativas consideradas**: interfaz `ISystemClock`/`IClock` inyectable — descartada por sobre-ingeniería para un único punto de llamada real; se puede introducir después sin romper la firma pública de `Sync` si un segundo consumidor apareciera (p. ej. batallas de evento con ventana horaria, fuera de alcance aquí — FR-012).

## §5 — Región y dificultad progresiva sin duplicar el orden de desbloqueo

**Decisión**: `Region` es un `ScriptableObject` liviano (solo identidad: `regionId`, `displayNameKey`). La pertenencia y el orden de dificultad **no** se modelan como un array propio dentro de `Region` — se reutiliza el mismo array `AdventureMap.Banners` ya definido en 004 (cuyo orden ya es la secuencia de desbloqueo, FR-007 de 004): cada `ChapterBannerDefinition` gana un campo `region` (nullable) y un campo `difficultyRank` (`int`). La subsecuencia de `AdventureMap.Banners` que comparte la misma `region`, tomada en el orden en que aparece en ese array, define la "secuencia interna de la región" para efectos de FR-009 (dificultad no decreciente).

**Rationale**: 004 ya estableció el idioma "el orden del array es la secuencia" para el desbloqueo global; reutilizarlo para la progresión de dificultad por región evita una segunda fuente de verdad sobre el orden de las misiones (un `Region.missions[]` propio podría desincronizarse de `AdventureMap.Banners` si alguien reordena uno sin el otro). Es consistente con Principio VI: menos estado que sincronizar, un test EditMode adicional (`MissionRegionDifficultyValidationTests`, ver Project Structure de plan.md) valida la monotonicidad recorriendo `AdventureMap.Banners` filtrado por región, sin necesidad de una estructura de datos nueva.

**Alternativas consideradas**:
- `Region.missions` como `ChapterBannerDefinition[]` propio, ordenado — descartada por el riesgo de doble fuente de verdad descrito arriba.
- Codificar la dificultad como enum de tramos (`Easy/Medium/Hard`) — descartada: FR-009 solo exige una relación de orden ("igual o mayor que la anterior"), no categorías con significado propio; un `int` simple permite cualquier granularidad futura sin migrar el tipo.

## §6 — Punto de integración con la UI de selección de misiones

**Decisión**: `AdventureMapFlowController` (004, ver research.md de esa feature — hoy sin implementación en C#, ver §7 más abajo) es el punto de integración: en `Awake()`, además de lo ya descrito en 004, resuelve `IMissionEnergyStore`/`MissionEnergyConfig`, calcula `characterLevel` reutilizando `PlayerCharacterLevelCalculator.Calculate(...)` (005, función pura) sobre el roster de unidades y `IPlayerProgressStore.Load().unitProgress`, construye un `MissionEnergyController` y llama `Sync(DateTime.UtcNow, characterLevel)` una vez, igual momento del ciclo de vida en que ya calcula `BannerStates` (FR-001: la energía debe ser visible en el mismo lugar donde se seleccionan misiones). `TrySelectBanner(int bannerIndex)` se extiende con una precondición adicional: solo si `BannerStates[bannerIndex].isSelectable` (guarda ya existente de 004) intenta además `missionEnergyController.TryEnterMission(banners[bannerIndex].EnergyCost)`; si eso devuelve `false` (energía insuficiente), `TrySelectBanner` devuelve `false` sin navegar y sin haber modificado `BannerStates` ni el progreso de capítulo (FR-004/FR-005).

**Rationale**: mismo criterio de "guarda doble en el controlador, no solo en la UI" que ya documenta `contracts/adventure-map-selection.md` (004) para el desbloqueo — ningún camino de invocación (incluido un test que llame a `TrySelectBanner` directo) puede saltarse la comprobación de energía.

## §7 — Orden de implementación entre 004/005/006

**Decisión**: este plan asume que, para cuando se ejecuten `/speckit-tasks` e `/speckit-implement` de esta feature, `004-adventure-map-banners` y `005-player-dashboard` ya estarán implementadas en C# — Fase 6 del roadmap sigue a las Fases 4 y 5. El diseño se apoya en sus `plan.md`/`data-model.md`/`contracts/` ya cerrados (verificados en este documento), no en código existente hoy: al momento de escribir este plan, `ChapterBannerDefinition.cs`, `AdventureMap.cs`, `AdventureMapFlowController.cs` (004) y `PlayerProgressSaveData.cs`, `IPlayerProgressStore.cs`, `PlayerCharacterLevelCalculator.cs` (005) no existen todavía en `Assets/Scripts/` (verificado con búsqueda en el repositorio).

**Rationale**: mismo criterio que 005 ya aplicó respecto a 004 ("esta feature no depende de que 004 esté implementada en C#, se apoya en su spec/plan ya cerrados"). Si el orden real de implementación cambiara, la parte de esta feature que no dependa de la UI de selección (`MissionEnergySaveData`, `IMissionEnergyStore`, `LocalMissionEnergyStore`, `MissionEnergyConfig`, `MissionEnergyController`) es completamente implementable y testeable en EditMode de forma aislada, sin ningún tipo de 004/005; solo la integración final en `AdventureMapFlowController` (§6) requiere que 004 exista, y el cálculo de `characterLevel` requiere que 005 exista.

## §8 — Fuera de alcance

Misiones de evento/especiales con ventana horaria (banner de eventos, Fase 12 del roadmap) no consumen ni interactúan con `MissionEnergyPool` en esta feature (FR-012) — cuando esa fase se especifique, decidirá si introduce su propio recurso o reutiliza este. No se modifica `BattleResourceController.cs` ni ningún tipo de `IBattleResourceSource` (Principio II) — ver Assumptions de spec.md y Constitution Check de plan.md.
