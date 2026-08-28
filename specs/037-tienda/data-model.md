# Data Model: Tienda

## `src/data/shop.ts` (nuevo, funciones puras — sin React/Zustand, Constitución § VI)

```ts
export const BATTLE_ITEM_PRICES: Record<string, number> = {
  'speed-boost': 150,
  'extra-energy': 100,
  'treasure-radar': 300,
}

export function getBattleItemPrice(itemId: string): number {
  return BATTLE_ITEM_PRICES[itemId] ?? 0
}

/** research.md Decisión 3: precio fijo, igual para cualquier gato. */
export const EVOLUTION_ITEM_PRICE = 250
```

Sin bump de versión en ningún sitio — módulo de datos puro, sin persistencia propia.

## `src/state/useMetaStore.ts` (modificado)

Nuevas acciones (mismo patrón defensivo — `set()` único combinando moneda + entidad objetivo, igual que `startOtotoConstruction`):

```ts
purchaseBattleItem: (itemId: string) => boolean
purchaseEvolutionItem: (catId: string) => boolean
```

**`purchaseBattleItem(itemId)`**:
1. `price = getBattleItemPrice(itemId)`; si `get().currency < price`, devuelve `false`.
2. `battleItemInventory = { ...get().battleItemInventory, [itemId]: (get().battleItemInventory[itemId] ?? 0) + 1 }`.
3. `currency = get().currency - price`.
4. `set({ currency, battleItemInventory })`; `void db.playerProfile.update(1, { currency })`; `void db.battleItems.put({ id: 1, counts: battleItemInventory })`.
5. Devuelve `true`.

**`purchaseEvolutionItem(catId)`**:
1. Lee `owned = get().ownedCats[catId]` y `cat = CATS.find(...)`; si no existen, o `!cat.evolutions?.true`, o `owned.evolutionStage === 'True'`, devuelve `false` (FR-004/FR-005 — gato no elegible para esta compra).
2. `requiredItemCount = cat.evolutions.true.requiredItemCount ?? 0`; `current = get().evolutionItems[catId] ?? 0`; si `current >= requiredItemCount`, devuelve `false` (ya alcanzó el tope, FR-005).
3. Si `get().currency < EVOLUTION_ITEM_PRICE`, devuelve `false`.
4. `evolutionItems = { ...get().evolutionItems, [catId]: current + 1 }`; `currency = get().currency - EVOLUTION_ITEM_PRICE`.
5. `set({ currency, evolutionItems })`; `void db.playerProfile.update(1, { currency })`; `void db.evolutionItems.put({ id: 1, counts: evolutionItems })`.
6. Devuelve `true`.

## `src/types/screen.ts` (modificado)

`PanelId` gana `'Shop'`.

## `src/screens/ShopPanel.tsx` (nuevo)

Sin props (mismo patrón que `MissionsPanel`/`GamatotoPanel`). Lee `currency`, `battleItemInventory`, `ownedCats`, `evolutionItems`, `purchaseBattleItem`, `purchaseEvolutionItem` de `useMetaStore`; `BATTLE_ITEMS` de `src/data/battleItems.ts`; `CATS` de `src/data/cats.ts`; `getBattleItemPrice`/`EVOLUTION_ITEM_PRICE` de `src/data/shop.ts`.

- Sección "Objetos de Batalla": una fila por `BattleItem` en `BATTLE_ITEMS`, mostrando nombre, cantidad en inventario (`battleItemInventory[item.id] ?? 0`), precio, y botón "Comprar" deshabilitado si `currency < getBattleItemPrice(item.id)`.
- Sección "Ítems de Evolución": una fila por cada `catId` en `ownedCats` cuyo `CATS.find(...)` tenga `evolutions?.true` definido y `ownedCats[catId].evolutionStage !== 'True'`, mostrando nombre del gato, `evolutionItems[catId] ?? 0` sobre `requiredItemCount`, precio fijo, y botón "Comprar" deshabilitado si `currency < EVOLUTION_ITEM_PRICE` o si ya alcanzó `requiredItemCount`. Lista vacía si no hay ningún gato elegible (Edge Case de spec.md).

## `src/screens/HubScreen.tsx` (modificado)

`PANEL_LABELS.Shop = 'Tienda'`; nuevo botón de dock "Tienda" (icono `ShoppingCart` de `lucide-react`, mismo estilo que el resto del dock); nuevo `case 'Shop': panelContent = <ShopPanel />` en el switch.
