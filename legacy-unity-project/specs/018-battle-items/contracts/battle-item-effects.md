# Contract: Consumo y Efecto de Objetos de Batalla (`BattleStateManager`)

Ver [research.md §3, §4, §5](../research.md) para las decisiones de diseño detrás de este contrato.

## `SetupChapter()` — consumo y aplicación inmediata (extensión aditiva)

```text
SetupChapter():
    ... (comportamiento existente de 001/006/013/014, sin cambios) ...

    BattleSessionModifiers.MoveSpeedMultiplier = 1f   # reset por nueva ENTRADA a la batalla (no en RetryBattle, research.md §6)
    m_BonusTreasureRequested = false
    m_GrantedInstantResourceAmount = 0f

    selectedIds = BattleLaunchContext.SelectedBattleItemIds ?? Array.Empty<string>()
    BattleLaunchContext.SelectedBattleItemIds = null   # consumido, mismo patron que RequestedArc

    si m_BattleItemCatalog != null Y selectedIds.Length > 0:
        playerProgress = m_PlayerProgressStore.Load()
        huboDescuento = false

        para cada itemId en selectedIds:
            si !m_BattleItemCatalog.TryGetItem(itemId, out definition): continue   # id desconocido, se ignora sin error
            stack = buscar itemId en playerProgress.battleItemInventory
            si stack == null o stack.count <= 0: continue   # sin inventario real, se ignora sin error (defensivo)

            stack.count -= 1   # FR-006: descuento en el momento de entrar a la batalla
            huboDescuento = true

            segun definition.Category:
                SpeedBoost:     BattleSessionModifiers.MoveSpeedMultiplier += definition.Magnitude
                ExtraResource:  m_GrantedInstantResourceAmount += definition.Magnitude   # aplicado una vez, abajo
                BonusTreasure:  m_BonusTreasureRequested = true

        si huboDescuento: m_PlayerProgressStore.Save(playerProgress)

    si m_GrantedInstantResourceAmount > 0f:
        m_ResourceController.AddInstantResource(m_GrantedInstantResourceAmount)
```

## `RetryBattle()` — extensión aditiva (research.md §6)

```text
RetryBattle():
    ... (comportamiento existente: liberar unidades del pool, ResetSlots, ResetSpawner, ResetHealth — sin cambios) ...

    m_ResourceController.ResetResource()
    si m_GrantedInstantResourceAmount > 0f:
        m_ResourceController.AddInstantResource(m_GrantedInstantResourceAmount)   # reaplica el bono ya pagado, ResetResource() lo habria borrado

    ... (resto de RetryBattle sin cambios) ...
```

Nota: `BattleSessionModifiers.MoveSpeedMultiplier` y `m_BonusTreasureRequested` **no** requieren ninguna línea nueva en `RetryBattle()` — ninguno de los dos es tocado por el método existente, por lo que ya persisten sin cambios a través de un reintento (research.md §6).

## `GrantLevelRewards(bool firstVictory)` — extensión aditiva

```text
GrantLevelRewards(firstVictory):
    ... (comportamiento existente: XP, TreasureRewardId, unlock, sets de tesoro — sin cambios) ...

    # 018-battle-items: recompensa de objeto de batalla del nivel, en cada victoria
    # (mismo criterio que XpReward/TreasureRewardId, no solo la primera)
    si m_ChapterDefinition.BattleItemReward != null Y m_ChapterDefinition.BattleItemRewardCount > 0:
        playerProgress = m_PlayerProgressStore.Load()
        itemId = m_ChapterDefinition.BattleItemReward.ItemId
        stack = buscar itemId en playerProgress.battleItemInventory
        si stack existe: stack.count += m_ChapterDefinition.BattleItemRewardCount
        si no: agregar nuevo BattleItemStack { itemId, count = m_ChapterDefinition.BattleItemRewardCount }
        m_PlayerProgressStore.Save(playerProgress)

    # 018-battle-items: "Radar de Tesoro" (FR-009/FR-010) - solo si se selecciono
    # para ESTA batalla (m_BonusTreasureRequested, fijado en SetupChapter())
    si m_BonusTreasureRequested Y m_TreasureSetCatalog != null:
        playerProgress = m_PlayerProgressStore.Load()   # recargar: pudo cambiar arriba
        todosLosTesoros = union de TreasureIds de cada set en m_TreasureSetCatalog.Sets
        pendientes = todosLosTesoros donde NO esta en playerProgress.obtainedTreasureIds
        si pendientes.Count > 0:
            elegido = pendientes[UnityEngine.Random.Range(0, pendientes.Count)]
            agregar elegido a playerProgress.obtainedTreasureIds (mismo guard idempotente que TreasureRewardId)
            m_PlayerProgressStore.Save(playerProgress)
        # si pendientes.Count == 0: no-op, sin error (FR-010)
```

## Postcondiciones / invariantes

- **FR-006**: el descuento de inventario ocurre exclusivamente dentro de `SetupChapter()`, nunca en `BattleItemSelectionController` ni en `GrantLevelRewards()`.
- **FR-008**: `SpeedBoost`/`ExtraResource` surten efecto antes de que `SetupChapter()` termine (por tanto, antes del primer despliegue posible) — `BonusTreasure` surte efecto únicamente dentro de `GrantLevelRewards()`, invocado solo en victoria.
- **FR-009/FR-010**: el pool de candidatos de "Radar de Tesoro" se recalcula en cada victoria (no se cachea entre batallas); si está vacío, el flujo continúa sin error y sin persistir ningún cambio de `obtainedTreasureIds` por ese motivo.
- Un `itemId` seleccionado que ya no existe en el catálogo, o del que el inventario ya no tiene unidades (por ejemplo, un guardado corrupto o editado a mano), se ignora silenciosamente — no lanza excepción ni bloquea `SetupChapter()` (mismo criterio defensivo que `EventBannerActivationEvaluator.Evaluate` ya aplicó a elementos `null` dentro de un array, `015-special-event-banner`).
- `BattleSessionModifiers.MoveSpeedMultiplier` se resetea a `1f` al inicio de cada `SetupChapter()`, antes de leer `SelectedBattleItemIds` — una escena reciclada (reintento, `RetryBattle()`) nunca hereda el multiplicador de un intento anterior.
