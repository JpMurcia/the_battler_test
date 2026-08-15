# Data Model: Bibliotecas de Consulta (Cat Guide / Enemy Guide / Treasure Menu)

## PlayerProgressSaveData (extendido, `Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs`)

Campo nuevo, aditivo, sin bump de `formatVersion`:

```csharp
public string[] encounteredEnemyIds = Array.Empty<string>();
```

## EnemyCatalog (nuevo ScriptableObject, `Assets/Scripts/Model/Battler/EnemyCatalog.cs`)

Mismo patrón que `UnitUnlockCatalog`, sin envoltura de entrada (research.md §3):

| Campo | Tipo | Uso |
|---|---|---|
| `m_Enemies` | `UnitDefinition[]` | Todos los enemigos ya definidos en oleadas existentes (`001`-`014`), poblados por contenido, sin crear ninguno nuevo. |

Método público `Resolve(string enemyId) : UnitDefinition` — recorrido lineal comparando `UnitDefinition.UnitId` (mismo criterio `StringComparison.Ordinal` que `UnitUnlockCatalog.Resolve`).

## CatGuideEntry / CatGuideBuilder (nuevos, `Assets/Scripts/Gameplay/Battler/CatGuideBuilder.cs`)

```csharp
public readonly struct CatGuideEntry
{
    public UnitDefinition Unit { get; }
    public int Level { get; }
    public UnitEvolutionStage Stage { get; }
    public UnitCombatProfile EffectiveStats { get; }
}

public static class CatGuideBuilder
{
    public static IReadOnlyList<CatGuideEntry> Build(
        IReadOnlyList<UnitDefinition> ownedUnits,
        UnitLevelingController leveling,
        UnitEvolutionController evolution);
}
```

Vive en `Gameplay` (no en `Model`) porque depende de `UnitLevelingController`/`UnitEvolutionController` (research.md §6). Para cada unidad de `ownedUnits` (ya resuelto por `PlayerBaseFlowController.OwnedUnits`, 013): `Stage = evolution.GetEvolutionStage(unit.UnitId)`, `EffectiveStats = unit.GetEffectiveCombatProfile(Stage)` (009), `Level = leveling.GetUnitLevel(unit.UnitId)`.

## EnemyGuideEntry / EnemyGuideBuilder (nuevos, `Assets/Scripts/Model/Battler/EnemyGuideBuilder.cs`)

```csharp
public readonly struct EnemyGuideEntry
{
    public UnitDefinition Enemy { get; }   // stats base, sin escalar (research.md §5)
}

public static class EnemyGuideBuilder
{
    public static IReadOnlyList<EnemyGuideEntry> Build(EnemyCatalog catalog, PlayerProgressSaveData progress);
}
```

Vive en `Model` (solo depende de `EnemyCatalog`/`PlayerProgressSaveData`, ambos `Model`). Filtra `catalog.Enemies` a los que `progress.encounteredEnemyIds` contiene (`Array.IndexOf >= 0`); `catalog == null` o `encounteredEnemyIds` vacío ⇒ lista vacía, sin error (FR-009).

## TreasureMenuEntry / TreasureMenuBuilder (nuevos, `Assets/Scripts/Model/Battler/TreasureMenuBuilder.cs`)

```csharp
public readonly struct TreasureMenuEntry
{
    public TreasureSetDefinition Set { get; }
    public int ObtainedCount { get; }
    public int TotalCount { get; }
    public bool BonusGranted { get; }
}

public static class TreasureMenuBuilder
{
    public static IReadOnlyList<TreasureMenuEntry> Build(TreasureSetCatalog catalog, PlayerProgressSaveData progress);
}
```

Vive en `Model`, mismo patrón que `TreasureSetProgressEvaluator` (014), de hecho lo reutiliza: `TotalCount = set.TreasureIds.Length`, `ObtainedCount = set.TreasureIds.Count(id => progress.obtainedTreasureIds contiene id)`, `BonusGranted = TreasureSetProgressEvaluator.HasRewardsGranted(set.SetId, progress)`. `catalog == null` ⇒ lista vacía, sin error (FR-009).

## EnemyWaveSpawner (extendido, `Assets/Scripts/Gameplay/Battler/EnemyWaveSpawner.cs`)

Evento nuevo, mismo patrón que `ThresholdWaveTriggered` (013):

```csharp
public event Action<UnitDefinition> EnemyEncountered;
```

Disparado al final de `SpawnEnemy(UnitDefinition unit, float lanePosition)` (research.md §1), para oleada normal y de refuerzo por igual (ambas ya pasan por ese método).

## BattleStateManager (extendido — sin campos serializados nuevos)

Se suscribe a `m_EnemyWaveSpawner.EnemyEncountered` (en `Awake()`, junto a la resolución de `m_ProgressStore`/`m_PlayerProgressStore` ya existente) y, en el handler, añade `unit.UnitId` a `playerProgress.encounteredEnemyIds` de forma idempotente (mismo guard `Array.IndexOf(...) < 0` que `GrantLevelRewards()` ya usa para `obtainedTreasureIds`), persistiendo con `m_PlayerProgressStore.Save(...)`.

## Relación con datos ya existentes

- `EnemyCatalog`/`CatGuideEntry`/`EnemyGuideEntry`/`TreasureMenuEntry` son entidades enteramente nuevas de solo lectura — no reinterpretan ningún dato ya serializado.
- `PlayerProgressSaveData.encounteredEnemyIds` es la única extensión de datos persistidos de esta feature, puramente aditiva (Grupo A de `docs/plan-tecnico-manual-completo.md` §1.3).
- Ninguna de las tres bibliotecas escribe en `unitProgress`, `activeTeamUnitIds`, `battleItemInventory`, `obtainedTreasureIds` ni ningún otro campo ya existente (FR-007/FR-010) — solo `EnemyGuideBuilder`/`TreasureMenuBuilder`/`CatGuideBuilder` los leen.
