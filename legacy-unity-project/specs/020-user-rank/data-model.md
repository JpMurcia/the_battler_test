# Data Model: Sistema de Rango de Usuario

## UserRankThreshold (nuevo, `[Serializable]` plano, `Assets/Scripts/Model/Battler/UserRankThreshold.cs`)

| Campo | Tipo | Uso |
|---|---|---|
| `m_ThresholdId` | `string` | Identificador estable, independiente del rango requerido (research.md §2). |
| `m_RequiredRank` | `int`, `[Min(1)]` | Rango de Usuario mínimo para poder reclamar este umbral. |
| `m_Reward` | `BattleItemDefinition` (`018-battle-items`) | Objeto de batalla otorgado al reclamar. |
| `m_RewardCount` | `int`, `[Min(1)]` | Cantidad otorgada. |

`IsValid`: `ThresholdId` no vacío; `RequiredRank >= 1`; `Reward != null`; `RewardCount >= 1` (mismo criterio de validación que `TreasureSetDefinition.IsValid`).

## UserRankRewardCatalog (nuevo ScriptableObject, `Assets/Scripts/Model/Battler/UserRankRewardCatalog.cs`)

Mismo patrón que `TreasureSetCatalog`:

| Campo | Tipo | Uso |
|---|---|---|
| `m_Thresholds` | `UserRankThreshold[]` | Todos los umbrales configurados del proyecto. |

Sin método `Resolve` propio — `UserRankController` (Gameplay) recorre `m_Thresholds` directamente (lista pequeña, mismo orden de magnitud que el resto de catálogos).

## PlayerProgressSaveData (extendido, `Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs`)

Campo nuevo, aditivo, sin bump de `formatVersion`:

```csharp
public string[] claimedThresholdIds = Array.Empty<string>();
```

Nota: **no** se añade ningún campo para el valor del Rango de Usuario en sí — sigue siendo un valor derivado de `unitProgress[].level`, sin persistencia propia (research.md §1, FR-001).

## UserRankThresholdStatus (nuevo, vista de solo lectura, `Assets/Scripts/Gameplay/Battler/UserRankController.cs`)

```csharp
public readonly struct UserRankThresholdStatus
{
    public UserRankThreshold Threshold { get; }
    public bool Reached { get; }   // CurrentRank >= Threshold.RequiredRank
    public bool Claimed { get; }   // Threshold.ThresholdId ya en claimedThresholdIds
}
```

## UserRankController (nuevo, clase plana, `Assets/Scripts/Gameplay/Battler/UserRankController.cs`)

Mismo patrón que `TeamFormationController`/`BattleItemSelectionController` (research.md §3):

| Miembro | Tipo | Uso |
|---|---|---|
| `CurrentRank` | `int` (propiedad) | `PlayerCharacterLevelCalculator.Calculate(ownedUnits, m_State.unitProgress)` — sin cálculo propio (research.md §1). |
| `Thresholds` | `IReadOnlyList<UserRankThresholdStatus>` (propiedad) | Todos los umbrales del catálogo con su estado `Reached`/`Claimed` actual. |
| `TryClaim(string thresholdId)` | `bool` | Ver `contracts/user-rank-claim.md`. |

Constructor `(IPlayerProgressStore store, UserRankRewardCatalog catalog, IReadOnlyList<UnitDefinition> ownedUnits)` — mismo patrón de instanciación por `PlayerBaseFlowController` que `TeamFormationController`/`UnitLevelingController`/`UnitEvolutionController`.

## PlayerBaseFlowController (extendido, `Assets/Scripts/Gameplay/Battler/PlayerBaseFlowController.cs`)

Campo nuevo opcional (`[SerializeField]`, `null` preserva el comportamiento sin umbrales — FR-010): `m_UserRankCatalog: UserRankRewardCatalog`. Propiedad nueva `UserRank: UserRankController`, instanciada en `Awake()` junto a `Leveling`/`TeamFormation`/`Evolution`.

## Relación con datos ya existentes

- `UserRankController.CurrentRank` no reinterpreta ni duplica `PlayerCharacterLevelCalculator`/`UnitLevelingController.CharacterLevel` — delega en la misma función pura ya usada por `005` (research.md §1).
- `claimedThresholdIds` es la única extensión de datos persistidos de esta feature, puramente aditiva (Grupo A de `docs/plan-tecnico-manual-completo.md` §1.3).
- `TryClaim` escribe en `PlayerProgressSaveData.battleItemInventory` con el mismo tipo (`BattleItemStack`, `018-battle-items`) y la misma regla de fusión idempotente que `BattleStateManager.GrantLevelRewards()` ya usa (research.md §4) — sin ningún concepto de inventario nuevo.
