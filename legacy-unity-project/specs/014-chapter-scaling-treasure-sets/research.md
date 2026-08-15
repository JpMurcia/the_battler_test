# Research: Escalado Avanzado por Capítulo y Sets de Tesoros

Todas las decisiones de abajo se verificaron contra el código real en `Assets/Scripts/` (no contra la documentación de spec 013, que además todavía no está implementada — cero tareas de `013-empire-of-cats-saga/tasks.md` completadas). Donde esta feature depende de un tipo que spec 013 solo **planea** (`SagaArcDefinition`, `UnitCombatProfile.Scaled`, `BattleLaunchContext`), se cita explícitamente su plan/data-model como diseño de referencia, no como código existente.

## 1. Vida de base enemiga por capítulo: el campo base ya existe

**Decision**: `ChapterDefinition.EnemyBaseMaxHealth` (`Assets/Scripts/Model/Battler/ChapterDefinition.cs`, `int [Min(1)]`, default `1`) ya es el valor real que `BattleStateManager.SetupChapter()` usa hoy para inicializar la base enemiga:

```csharp
m_EnemyBase.Initialize(Team.Enemy, m_ChapterDefinition.EnemyBaseMaxHealth, m_EnemyBase.LanePosition);
```

Esta feature **no añade ningún campo nuevo a `ChapterDefinition`** para esto — solo escala el valor ya existente en el mismo punto de consumo donde spec 013 (research.md §1, todavía sin implementar) ya planea resolver `enemyStrengthMultiplier` para unidades enemigas:

```csharp
int enemyBaseHealth = Mathf.Max(1, Mathf.RoundToInt(m_ChapterDefinition.EnemyBaseMaxHealth * enemyStrengthMultiplier));
m_EnemyBase.Initialize(Team.Enemy, enemyBaseHealth, /* ver research.md §3 */);
```

donde `enemyStrengthMultiplier` es el mismo `m_ActiveArc?.EnemyStrengthMultiplier ?? 1f` que spec 013 ya resuelve para `EnemyWaveSpawner.Initialize`/`UnitRuntime.Initialize` (spec 013 contracts/chapter-arc-multipliers.md).

**Rationale**: `EnemyBaseMaxHealth` es exactamente el "valor base almacenado en la definición del nivel" que spec.md FR-001 exige no modificar — escalarlo en el punto de consumo (dentro de `SetupChapter()`), nunca mutando el campo serializado, es coherente con Principio V y con el mismo patrón que spec 013 ya usa para unidades enemigas. No hace falta ningún tipo nuevo: es una línea de cálculo adicional en un método que spec 013 ya modifica.

**Alternatives considered**: Añadir un campo nuevo `m_BaseHealthMultiplierOverride` por nivel — rechazado: `EnemyBaseMaxHealth` ya es "el valor base de este nivel específico" (a diferencia de `UnitDefinition`/`EnemyWaveDefinition`, que sí son compartidos entre capítulos); no hay ningún dato compartido que proteger aquí, así que no hace falta el mismo cuidado que con unidades.

## 2. Costo de energía por capítulo: el campo plano por banner ya resuelve esto — el gap real es la resolución de arco activo

**Decision**: `MissionEnergyController.TryEnterMission(int energyCost)` (`Assets/Scripts/Gameplay/Battler/MissionEnergyController.cs:87`) ya recibe un costo **plano por banner**, no por `ChapterDefinition` — el costo real hoy vive en `ChapterBannerDefinition.EnergyCost` (`Assets/Scripts/Model/Battler/ChapterBannerDefinition.cs:16,24`, `[Min(0)] int`), leído por `AdventureMapFlowController.cs:90`. **No existe ninguna tabla de costo por capítulo, y no hace falta crear una**: si "Corea" aparece como tres banners distintos en el mapa (uno por capítulo de la saga, exactamente como en el juego original, donde cada capítulo tiene sus propios 48 slots de nivel aunque compartan nombre/tema), cada banner ya tiene su propio `EnergyCost` fijo hoy, sin ningún código nuevo — Corea-Cap.1 con `EnergyCost = 5`, Corea-Cap.2 con `EnergyCost = 15`, etc.

**El gap real**: para que el multiplicador de costo/fuerza de spec 013 (`SagaArcDefinition.UnitCostMultiplier`/`EnemyStrengthMultiplier`) se aplique correctamente al entrar desde el banner de Corea-Cap.2 (y no desde el de Corea-Cap.1), la escena de batalla necesita saber **qué arco está activo** en el momento de la carga — hoy `BattleStateManager.m_ActiveArc` es un campo serializado fijo por escena (spec 013, contracts/chapter-arc-multipliers.md), lo cual es incompatible con "la misma escena de batalla sirve para Corea-Cap.1 y Corea-Cap.2 con distinto arco activo". Esta feature añade la resolución dinámica que falta, reutilizando el mismo puente estático que spec 013 ya introduce para Brote Zombi (`BattleLaunchContext`, research.md §11 de spec 013):

```csharp
public static class BattleLaunchContext
{
    public static bool ZombieOutbreakRequested { get; set; } // ya planeado por spec 013
    public static SagaArcDefinition RequestedArc { get; set; } // nuevo, esta feature
}
```

Seteado por la pantalla de selección de nivel (capa `View`, fuera de alcance de código) desde `ChapterBannerDefinition` antes de `LoadScene(...)`; leído por `BattleStateManager.SetupChapter()` en vez de depender únicamente de `m_ActiveArc` serializado — `m_ActiveArc` pasa a ser el **valor por defecto** cuando `BattleLaunchContext.RequestedArc == null` (compatibilidad con escenas de prueba/`Chapter1`/`Chapter2` que no pasan por el mapa de aventuras).

**Rationale**: Construir una "tabla de costo de energía por capítulo" nueva sobre `ChapterDefinition` (mi supuesto original en spec.md) duplicaría un dato que `ChapterBannerDefinition.EnergyCost` ya modela correctamente por aparición-de-nivel-en-el-mapa, violando Principio VI (Simplicidad/YAGNI: no construir una segunda fuente de verdad para el mismo hecho). El verdadero trabajo nuevo no es el costo en sí — es que la escena de batalla pueda enterarse de qué arco corresponde a la entrada elegida, exactamente el mismo problema de "estado que debe sobrevivir la carga de escena" que spec 013 ya resuelve para Brote Zombi con el mismo patrón (`BattleLaunchContext`).

**Alternatives considered**: (a) Tabla `Dictionary<string arcId, int energyCost>` en `ChapterDefinition`, tal como el spec.md original de esta feature (FR-002) sugiere textualmente — rechazada tras verificar el código real: `ChapterDefinition` no es "el nivel visible en el mapa", `ChapterBannerDefinition` sí lo es, y ese tipo ya tiene el campo correcto. Mantener la tabla en el tipo equivocado obligaría a sincronizar dos fuentes de costo (banner y tabla) para el mismo número. (b) Una escena de batalla dedicada por arco (`Corea_Cap1_Battle.unity`, `Corea_Cap2_Battle.unity`, ...) con `m_ActiveArc` fijo por escena, evitando `BattleLaunchContext.RequestedArc` — rechazada: multiplica el número de escenas por 3 (144 niveles × 3 capítulos = potencialmente cientos de escenas), inconsistente con cómo el proyecto ya maneja "Brote Zombi" (una sola escena, estado inyectado antes de cargarla).
**Nota de alcance sobre spec.md**: FR-002/FR-003 (spec.md) se satisfacen con este diseño — "el costo de energía... varía según el capítulo" (ya cierto vía banners distintos) y "el sistema DEBE descontar el costo correspondiente al capítulo desde el que el jugador accede" (cierto: cada banner ya dispara su propio `EnergyCost` al llamar `TryEnterMission`). El Key Entity "Costo de Energía por Capítulo" de spec.md se reinterpreta como "un banner por aparición de nivel en un capítulo", no como una tabla nueva — ver data-model.md.

## 3. Ancho de nivel: gap real confirmado — `LanePosition` está hardcodeado por prefab/escena, no es data-driven

**Decision**: Nuevo campo `ChapterDefinition.m_LevelWidth` (`float`, `[Min(0.1f)]`, default documentado). `BattleStateManager.SetupChapter()` (`Assets/Scripts/Gameplay/Battler/BattleStateManager.cs:91-92`) deja de reenviar el `LanePosition` ya existente del prefab de la base enemiga (hoy un no-op: lee `m_EnemyBase.LanePosition` y se lo vuelve a pasar a `Initialize`) y en su lugar calcula la posición de la base enemiga a partir del ancho del nivel:

```csharp
float enemyBaseLanePosition = m_PlayerBase.LanePosition + m_ChapterDefinition.LevelWidth;
m_EnemyBase.Initialize(Team.Enemy, enemyBaseHealth, enemyBaseLanePosition); // ver research.md §1 para enemyBaseHealth
```

**Rationale**: Se verificó (`Assets/Prefabs/Battler/PlayerBasePrefab.prefab:109`, `Assets/Prefabs/Battler/EnemyBasePrefab.prefab:200`) que ambos prefabs tienen `m_LanePosition: 0` de fábrica — la separación real entre bases hoy depende enteramente de un override de instancia de prefab en cada escena `Chapter*_Battle.unity` (un número mágico invisible en el Inspector de cada escena, no en ningún asset de datos ni constante de código). `LaneRegistry`/`FindAllTargetsInRange`/`FindNearestTarget` (`Assets/Scripts/Gameplay/Battler/LaneRegistry.cs`) ya operan puramente sobre `float LanePosition` de cada `ILaneOccupant` — no hay ninguna constante de "ancho" que tocar en ese archivo, solo hace falta que la posición de la base enemiga se derive de un dato explícito en vez de un valor de escena no versionado.

**Compatibilidad**: para preservar el comportamiento observable de `Chapter1`/`Chapter2` (spec 001/010, escenas ya autoradas), sus `ChapterDefinition` deben fijar `LevelWidth` igual a la distancia que sus escenas ya usan hoy (valor a determinar leyendo el override real de cada escena en `/speckit-tasks`, no adivinado aquí) — esto es una migración de datos (rellenar un campo nuevo con el valor equivalente al comportamiento actual), no un cambio de comportamiento.

**Alternatives considered**: Mantener `LanePosition` como override de escena y añadir `LevelWidth` solo como metadata informativa sin consumirla en runtime — rechazada: no cumple spec.md FR-004 ("el sistema DEBE... consultar [el ancho] en vez de asumir una distancia fija"); dejaría el dato desincronizado de la posición real usada en batalla, el mismo problema que motiva esta historia.

## 4. Sets de tesoros: gap de persistencia confirmado — ni el código real ni el plan de spec 013 guardan tesoros obtenidos

**Decision**: Nuevo campo `PlayerProgressSaveData.obtainedTreasureIds: string[]` (aditivo, `Array.Empty<string>()` por defecto, mismo patrón que `unlockedBonusUnitIds` que spec 013 ya planea añadir al mismo tipo — research.md §8 de spec 013). Se escribe en el mismo punto donde spec 013 planea notificar el tesoro por evento (`BattleStateManager.SetOutcome`, rama `outcome == Victory`, contracts/level-rewards-and-unit-unlocks.md de spec 013): además de invocar `LevelRewardsGranted` con el `treasureId`, si `treasureId` no está vacío y no está ya en `obtainedTreasureIds`, se añade.

**Rationale**: Se verificó que `ChapterProgressRecord` (`Assets/Scripts/Model/Battler/ChapterProgressRecord.cs`) no tiene campo de tesoro, y que el propio plan de spec 013 (`data-model.md` línea 28, `research.md §7`) declara explícitamente que el tesoro es "recompensa transitoria, sin inventario persistido" **por diseño** — spec 013 no necesitaba persistirlo porque ninguna de sus historias de usuario pedía una colección consultable. Esta feature sí lo necesita (spec.md Historia 4, FR-006 a FR-010: "el sistema DEBE ser capaz de determinar... qué sets... están completos"), así que la persistencia que 013 conscientemente omitió se añade aquí, sin modificar el diseño de 013 (aditivo sobre `PlayerProgressSaveData`, que 013 ya toca por otro motivo — `unlockedBonusUnitIds`).

**Nuevo tipo — Set de Tesoros**: ScriptableObject `TreasureSetDefinition` (`TheBattler.Model`):

```csharp
public class TreasureSetDefinition : ScriptableObject
{
    [SerializeField] private string m_SetId;
    [SerializeField] private string[] m_TreasureIds; // subconjunto de ChapterDefinition.TreasureRewardId existentes en niveles reales
    [SerializeField] private float m_PassiveRegenBonus; // ver research.md §5
    // Resto de campos: DisplayNameKey, etc. (autoría, no código)
}
```

**Evaluación de set completo**: nueva función pura `TreasureSetProgressEvaluator.IsSetComplete(TreasureSetDefinition set, PlayerProgressSaveData playerProgress)` — recorre `set.TreasureIds` y exige que todos aparezcan en `playerProgress.obtainedTreasureIds`, mismo estilo que `SagaArcProgressEvaluator.IsArcCompleted` (spec 013) y `ChapterBannerUnlockEvaluator.IsCompleted` (spec 004).

**Otorgamiento de la bonificación — una sola vez**: igual que spec 013 necesita `SagaArcProgressRecord.rewardsGranted` para no re-otorgar recompensas de arco en rejugadas, esta feature necesita un registro paralelo. Nuevo campo `PlayerProgressSaveData.grantedTreasureSetIds: string[]` (aditivo). En `BattleStateManager.SetOutcome`, tras añadir el tesoro a `obtainedTreasureIds` (arriba), se evalúa cada `TreasureSetDefinition` conocido (lista serializada en `BattleStateManager` o resuelta vía un catálogo pequeño, mismo patrón que `UnitUnlockCatalog` de spec 013): si `IsSetComplete(...) && !grantedTreasureSetIds.Contains(set.SetId)`, se aplica `set.PassiveRegenBonus` (research.md §5) y se añade `set.SetId` a `grantedTreasureSetIds`.

**Alternatives considered**: Derivar "set completo" sin persistir tesoros individuales, infiriendo desde `ChapterProgressRecord.isCompleted` de los niveles cuyo `TreasureRewardId` pertenece al set — rechazada: un nivel puede superarse sin que su tesoro se "coleccione" bajo esta lectura si en el futuro un tesoro se desvincula de "nivel superado" (p. ej. tesoros obtenibles por otras vías); persistir el tesoro explícitamente es más simple de razonar y evita acoplar la evaluación de sets a la semántica de completado de nivel (que spec 013 ya usa para otra cosa — `SagaArcProgressEvaluator`).

## 5. Bonificación pasiva de cuenta: no existe infraestructura de "modificador económico persistente" — se construye desde cero, sobre `BattleResourceController` ya existente

**Decision**: `BattleResourceController` (`Assets/Scripts/Gameplay/Battler/BattleResourceController.cs`) ya expone `RegenPerSecond { get; set; }` (mutable) y `ResetResource()`. Spec 013 (contracts/gatorreta-and-resource-upgrade.md, todavía sin implementar) ya planea que `Awake()` capture `m_DesignRegenPerSecond` antes de cualquier mejora en-batalla. Esta feature añade un método nuevo, aplicado **antes** de esa captura:

```csharp
public void ApplyPassiveRegenBonus(float bonus)
{
    m_RegenPerSecond += bonus; // aplicado antes de que Awake() capture m_DesignRegenPerSecond (spec 013)
}
```

`BattleStateManager.SetupChapter()` (que ya carga `IPlayerProgressStore` para otros fines, spec 013 contracts/level-rewards-and-unit-unlocks.md) calcula la suma de `PassiveRegenBonus` de todos los `TreasureSetDefinition` presentes en `PlayerProgressSaveData.grantedTreasureSetIds` y llama `m_ResourceController.ApplyPassiveRegenBonus(sum)` una vez, antes de que la batalla arranque (antes de `Awake()` de `BattleResourceController`, o inmediatamente después si el orden de `Awake()` no lo garantiza — a resolver como detalle de `/speckit-tasks`, posiblemente moviendo la aplicación a un método `Initialize` explícito en vez de depender de orden de `Awake()` entre componentes).

**Rationale**: No existe hoy ningún concepto de "bonificación de cuenta" en ningún lado del código (ni en `PlayerProgressSaveData`, ni en `BattleResourceController`) — esta es la primera vez que el proyecto necesita un modificador económico que sobreviva entre batallas, a diferencia de `TryUpgradeRegen` de spec 013 (deliberadamente solo-en-batalla, ver research.md §5 y su Rationale ahí). Reutilizar `RegenPerSecond` (en vez de crear un segundo campo "regen efectivo") evita una fuente de verdad duplicada; sumar el bono directamente al campo serializado antes de que spec 013 capture su "valor de diseño" (`m_DesignRegenPerSecond`) asegura que `ResetResource()`/reintentos de spec 013 preserven el bono de cuenta (correcto: el bono es permanente, no debe perderse en un reintento) mientras siguen descartando cualquier mejora en-batalla comprada con `TryUpgradeRegen` (correcto: esa sí es efímera).

**Alternatives considered**: Que `BattleResourceController` dependa directamente de `IPlayerProgressStore` para auto-resolver su propio bono — rechazada: acopla una clase de economía de batalla (dominio: `Team.Player` en el carril) a la capa de guardado de progreso de cuenta, cuando `BattleStateManager` ya es el orquestador que conecta ambos mundos para otras features (spec 013). Mantiene `BattleResourceController` testeable en aislamiento (EditMode/PlayMode ya existentes) sin necesitar un doble de `IPlayerProgressStore` en sus propios tests.

## 6. Redondeo y consistencia con spec 013

**Decision**: El redondeo de `EnemyBaseMaxHealth` escalado (research.md §1) usa el mismo criterio que spec 013 ya fija para vida/daño de unidades enemigas y costo de despliegue: `Mathf.RoundToInt`, con un piso de `1` (`Mathf.Max(1, ...)`) para evitar una base enemiga con 0 de vida por un multiplicador fraccional agresivo.

**Rationale**: Consistencia de reglas de cálculo en todo el sistema de multiplicadores de capítulo (spec.md Assumptions de esta feature ya lo declara); no introducir una segunda regla de redondeo para el mismo tipo de cálculo.

## 7. Alcance de assemblies (asmdef)

**Decision**: `TreasureSetDefinition`, `TreasureSetProgressEvaluator` (función pura), y los campos nuevos en `ChapterDefinition`/`PlayerProgressSaveData` viven en `TheBattler.Model` (mismo assembly que `SagaArcDefinition`/`ProgressSaveData`). Los cambios de comportamiento en `BattleStateManager`/`BattleResourceController`/`BattleLaunchContext` (extendido con `RequestedArc`) viven en `TheBattler.Gameplay`. Ningún cambio en `TheBattler.Core` (no se necesita ningún enum/interfaz primitivo nuevo compartido).

**Rationale**: Mismo criterio de capas que spec 013 (Model = datos serializables sin `MonoBehaviour`; Gameplay = orquestadores/controllers) y que el propio `docs`/README del proyecto documenta (`Core → Model → Gameplay → View`, dependencia en un solo sentido).
