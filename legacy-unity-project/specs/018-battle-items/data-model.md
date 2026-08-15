# Data Model: Sistema de Objetos de Batalla

## BattleItemCategory (nuevo enum, `Assets/Scripts/Core/Battler/BattleItemCategory.cs`)

```csharp
public enum BattleItemCategory
{
    SpeedBoost,      // 0 — combate: multiplicador de velocidad de movimiento
    ExtraResource,   // 1 — recurso inicial: suma instantánea al recurso de batalla
    BonusTreasure    // 2 — recompensa: tesoro adicional aleatorio al ganar
}
```

Sin datos previos que migrar (enum nuevo, no extiende uno existente) — el orden de declaración no tiene restricción de compatibilidad hacia atrás todavía, pero sigue la misma convención de "0 = comportamiento más simple/neutral" que el resto del proyecto.

## BattleItemDefinition (nuevo ScriptableObject, `Assets/Scripts/Model/Battler/BattleItemDefinition.cs`)

| Campo | Tipo | Uso |
|---|---|---|
| `m_ItemId` | `string` | Identificador estable, mismo criterio que `TreasureSetDefinition.SetId`/`ChapterDefinition.ChapterId`. |
| `m_DisplayNameKey` | `string` | Clave de localización, mismo patrón que el resto del proyecto (`MainLocalizedText`). |
| `m_Category` | `BattleItemCategory` | Determina qué mecanismo de `research.md §4` aplica este objeto. |
| `m_Magnitude` | `float` | Reutilizado entre categorías, mismo criterio que `TraitTargetingAbility.Magnitude` (016): multiplicador de velocidad añadido a `1f` para `SpeedBoost` (ej. `0.5` = +50%), cantidad instantánea de recurso para `ExtraResource`; sin uso observable para `BonusTreasure` (no participa del roll, ver `contracts/battle-item-effects.md`). |

`IsValid`: `ItemId`/`DisplayNameKey` no vacíos; `Magnitude >= 0f` (clamp en `OnValidate()`, mismo criterio que el resto de `UnitDefinition`/`TreasureSetDefinition`).

## BattleItemCatalog (nuevo ScriptableObject, `Assets/Scripts/Model/Battler/BattleItemCatalog.cs`)

Mismo patrón que `TreasureSetCatalog`/`UnitUnlockCatalog` — lista pequeña y dedicada:

| Campo | Tipo | Uso |
|---|---|---|
| `m_Items` | `BattleItemDefinition[]` | Catálogo completo de objetos de batalla disponibles en el proyecto. |

Método público `TryGetItem(string itemId, out BattleItemDefinition item)` — recorrido lineal (catálogo pequeño, mismo orden de magnitud que `UnitUnlockCatalog.Resolve`).

## BattleItemStack (nuevo, `[Serializable]` plano, `Assets/Scripts/Model/Battler/BattleItemStack.cs`)

```csharp
[Serializable]
public class BattleItemStack
{
    public string itemId;
    public int count;
}
```

Mismo patrón que `UnitProgress` — evita un `Dictionary<string,int>` (research.md §1).

## PlayerProgressSaveData (extendido, `Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs`)

Campo nuevo, aditivo, sin bump de `formatVersion` (mismo criterio que `unlockedBonusUnitIds`/`obtainedTreasureIds`):

```csharp
public BattleItemStack[] battleItemInventory = Array.Empty<BattleItemStack>();
```

## ChapterDefinition (extendido, `Assets/Scripts/Model/Battler/ChapterDefinition.cs`)

Campos nuevos, aditivos, sin `FormerlySerializedAs` (no son renombrados), defaults seguros para cualquier `ChapterDefinition` ya serializada de `001`-`017` (`null`/`0` = sin recompensa de objeto de batalla, FR-011):

| Campo | Tipo | Default |
|---|---|---|
| `m_BattleItemReward` | `BattleItemDefinition` | `null` |
| `m_BattleItemRewardCount` | `int`, `[Min(0)]` | `0` |

Otorgado en cada victoria (mismo criterio que `XpReward`/`TreasureRewardId`, no solo la primera vez), sumado al `count` existente de ese `itemId` en `battleItemInventory` si ya hay una entrada, o añadido como una entrada nueva si no la hay.

## BattleLaunchContext (extendido, `Assets/Scripts/Gameplay/Battler/BattleLaunchContext.cs`)

Campo nuevo, mismo criterio que `RequestedArc`/`ZombieOutbreakRequested` (consumido y reseteado por `BattleStateManager.SetupChapter()` en el mismo frame):

```csharp
public static string[] SelectedBattleItemIds { get; set; }
```

`null`/vacío = sin objetos seleccionados para la próxima batalla (comportamiento sin cambios, FR-004).

## BattleSessionModifiers (nuevo, estático, `Assets/Scripts/Gameplay/Battler/BattleSessionModifiers.cs`)

Mismo patrón estático que `LaneRegistry` (estado compartido dentro de una batalla en curso, no serializado, no persistente entre escenas):

```csharp
public static class BattleSessionModifiers
{
    public static float MoveSpeedMultiplier { get; set; } = 1f;
}
```

Reseteado a `1f` en `SetupChapter()` al inicio de cada nueva entrada a una batalla (no en cada `RetryBattle()` — ver research.md §6, un reintento de la misma entrada conserva el multiplicador ya aplicado).

## BattleStateManager (extendido — estado runtime nuevo, no serializado)

| Campo | Tipo | Uso |
|---|---|---|
| `m_BattleItemCatalog` | `BattleItemCatalog` (`[SerializeField]`, opcional) | Catálogo para resolver `itemId → BattleItemDefinition` en `SetupChapter()`. `null` preserva el comportamiento sin objetos de batalla (mismo criterio que `m_TreasureSetCatalog`). |
| `m_BonusTreasureRequested` | `bool` | Fijado en `SetupChapter()`, consumido en `GrantLevelRewards()` (research.md §4-§5). No se resetea en `RetryBattle()` — persiste para el reintento, igual que los demás efectos (research.md §6). |
| `m_GrantedInstantResourceAmount` | `float` | Monto total de "Dinero Extra" ya otorgado en esta entrada a la batalla, cacheado para que `RetryBattle()` pueda reaplicarlo tras `ResetResource()` (research.md §6, mismo criterio que `m_DesignRegenPerSecond` en `BattleResourceController`). |

## BattleItemSelectionController (nuevo, clase plana, `Assets/Scripts/Gameplay/Battler/BattleItemSelectionController.cs`)

Mismo patrón que `TeamFormationController` — no `MonoBehaviour`, instanciada por `PlayerBaseFlowController`, opera sobre `PlayerProgressSaveData.battleItemInventory` vía `IPlayerProgressStore` únicamente (sin referencia a `BattleItemCatalog`: no la necesita para validar cantidades, ver `contracts/battle-item-selection.md`). Ver ese contrato para el detalle completo.

## Relación con datos ya existentes

- `BattleItemDefinition`/`BattleItemCatalog`/`BattleItemStack` son entidades enteramente nuevas — no reinterpretan ningún dato ya serializado.
- `ChapterDefinition`/`PlayerProgressSaveData`/`BattleLaunchContext` se extienden de forma puramente aditiva (Grupo A de `docs/plan-tecnico-manual-completo.md` §1.3) — ningún campo existente cambia de significado ni de valor por defecto.
- El roll de "Radar de Tesoro" (`BonusTreasure`) lee `TreasureSetDefinition.TreasureIds`/`PlayerProgressSaveData.obtainedTreasureIds` (`014-chapter-scaling-treasure-sets`) en modo solo lectura para calcular el pool de candidatos, y escribe en `obtainedTreasureIds` con el mismo patrón idempotente ya usado por `GrantLevelRewards()` para `TreasureRewardId`.
