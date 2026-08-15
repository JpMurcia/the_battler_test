# Contract: Selección Pre-Batalla de Objetos (`BattleItemSelectionController`)

Ver [research.md §2, §3, §6](../research.md) para las decisiones de diseño detrás de este contrato.

## Construcción

```text
BattleItemSelectionController(IPlayerProgressStore store):
    m_Store = store
    m_State = store.Load()
```

Nota: este controller no recibe `BattleItemCatalog` — no lo necesita para validar cantidades contra el inventario (ver más abajo). Resolver `itemId → BattleItemDefinition` es responsabilidad exclusiva de `BattleStateManager.SetupChapter()` (`contracts/battle-item-effects.md`), que ya tiene su propia referencia al catálogo — pasarlo aquí también sería un parámetro sin uso (Principio VI).

## `Inventory` (propiedad de solo lectura)

Expone `m_State.battleItemInventory` tal cual, para que la capa View liste los objetos disponibles y sus cantidades (US1).

## `TryConfirmSelection(IReadOnlyList<string> selectedItemIds) : bool`

```text
TryConfirmSelection(selectedItemIds):
    si selectedItemIds.Count > c_MaxSelectableItems:
        return false   # FR-007: excede el limite maximo por batalla

    agrupar selectedItemIds por itemId -> requestedCounts

    para cada (itemId, requestedCount) en requestedCounts:
        stack = buscar itemId en m_State.battleItemInventory
        si stack == null o stack.count < requestedCount:
            return false   # FR-007: mas unidades de las disponibles en inventario

    # Todo valido: NO se descuenta nada aqui (FR-006 - el descuento ocurre en
    # BattleStateManager.SetupChapter(), al entrar efectivamente a la batalla)
    BattleLaunchContext.SelectedBattleItemIds = selectedItemIds.ToArray()
    return true
```

## Postcondiciones / invariantes

- **FR-001**: la selección se resuelve enteramente en memoria contra el inventario ya cargado — ninguna llamada a `m_Store.Save` ocurre en este controller (a diferencia de `TeamFormationController.TryConfirmFormation`, que sí persiste el equipo activo — la selección de objetos no es un estado persistente propio, es efímera hasta que se entra a la batalla).
- **FR-004**: una lista vacía (`selectedItemIds.Count == 0`) es una entrada válida — el jugador puede confirmar sin seleccionar ningún objeto; `BattleLaunchContext.SelectedBattleItemIds` queda como array vacío, no `null` (para distinguir "confirmó sin elegir nada" de "nunca pasó por esta pantalla", aunque `SetupChapter()` trata ambos casos igual).
- **FR-007**: seleccionar dos unidades del mismo `itemId` es válido siempre que `m_State.battleItemInventory` tenga al menos esa cantidad disponible para ese `itemId` (Edge Case de spec.md) — no hay un límite de "una unidad por tipo distinto", solo el límite total `c_MaxSelectableItems`.
- Este controller solo valida cantidades contra el inventario, no reglas de categoría — no necesita conocer `BattleItemDefinition`/`BattleItemCategory` en absoluto, por lo que no depende de `BattleItemCatalog`.
