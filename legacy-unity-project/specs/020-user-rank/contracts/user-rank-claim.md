# Contract: Reclamo de Umbral de Rango de Usuario (`UserRankController`)

Ver [research.md §1-§4](../research.md) para las decisiones de diseño detrás de este contrato.

## Construcción

```text
UserRankController(IPlayerProgressStore store, UserRankRewardCatalog catalog, IReadOnlyList<UnitDefinition> ownedUnits):
    m_Store = store
    m_Catalog = catalog
    m_OwnedUnits = ownedUnits
    m_State = store.Load()
```

## `CurrentRank` (propiedad de solo lectura)

```text
CurrentRank => PlayerCharacterLevelCalculator.Calculate(m_OwnedUnits, m_State.unitProgress)
```

Sin caché — recalculado en cada acceso (mismo criterio de "sin estado obsoleto" que `019-library-screens` aplicó a sus builders).

## `Thresholds` (propiedad de solo lectura)

```text
Thresholds =>
    si m_Catalog == null: []   # FR-010
    m_Catalog.Thresholds.Select(t => new UserRankThresholdStatus {
        Threshold = t,
        Reached = CurrentRank >= t.RequiredRank,
        Claimed = Array.IndexOf(m_State.claimedThresholdIds, t.ThresholdId) >= 0
    })
```

## `TryClaim(string thresholdId) : bool`

```text
TryClaim(thresholdId):
    si m_Catalog == null: return false

    threshold = m_Catalog.Thresholds.FirstOrDefault(t => t.ThresholdId == thresholdId)
    si threshold == null: return false   # id desconocido

    si Array.IndexOf(m_State.claimedThresholdIds, thresholdId) >= 0:
        return false   # FR-006: ya reclamado

    si CurrentRank < threshold.RequiredRank:
        return false   # FR-005: aun no alcanzado

    # Todo valido: registrar el reclamo (FR-007, monotono) y otorgar la recompensa
    agregar thresholdId a m_State.claimedThresholdIds

    stack = buscar threshold.Reward.ItemId en m_State.battleItemInventory
    si stack existe: stack.count += threshold.RewardCount
    si no: agregar nuevo BattleItemStack { itemId = threshold.Reward.ItemId, count = threshold.RewardCount }

    m_Store.Save(m_State)
    return true
```

## Postcondiciones / invariantes

- **FR-004/FR-005/FR-006**: `TryClaim` devuelve `true` únicamente cuando el umbral existe, aún no fue reclamado, y `CurrentRank` ya lo alcanza o supera — en cualquier otro caso devuelve `false` sin efectos secundarios (ninguna escritura parcial).
- **FR-007**: una vez añadido, `thresholdId` permanece en `claimedThresholdIds` para siempre — ninguna otra operación de este controller lo elimina, incluso si `CurrentRank` bajara después (Edge Case de spec.md).
- **FR-008**: `TryClaim` no impone ningún orden entre umbrales — cada llamada se evalúa de forma completamente independiente contra `CurrentRank` y `claimedThresholdIds`.
- **FR-009**: la única mutación de progreso que produce un reclamo exitoso es sumar al `battleItemInventory` (`018-battle-items`) — ningún camino de este contrato toca moneda premium ni ningún sistema de gacha.
- Reclamar un `thresholdId` que no existe en el catálogo (por ejemplo, un id obsoleto tras una reconfiguración de contenido) devuelve `false` sin lanzar excepción — mismo criterio defensivo que `BattleItemCatalog.TryGetItem` (018) o `EnemyCatalog.Resolve` (019) para ids desconocidos.
