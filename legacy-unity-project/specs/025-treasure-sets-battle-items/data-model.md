# Phase 1 Data Model: Sets de Tesoros y Objetos de Batalla en la Versión Web

**Input**: [spec.md](./spec.md) Key Entities · [research.md](./research.md) · Extiende `specs/024-react-web-migration/data-model.md` (no lo redefine — los campos de guardado ya existían ahí).

## Contenido estático (JSON, `src/data/`, ver `024` research.md Decisión 5)

### TreasureSetDefinition
Origen: `Assets/Scripts/Model/Battler/TreasureSetDefinition.cs` (ScriptableObject).

```ts
interface TreasureSetDefinition {
  setId: string;
  displayNameKey: string;
  treasureIds: string[];       // no vacío, sin duplicados — invariante de contenido, no de runtime
  passiveRegenBonus: number;   // >= 0
}
```
Invariante de validez (espejo de `TreasureSetDefinition.IsValid`): `setId`/`displayNameKey` no vacíos, `treasureIds` no vacío y sin duplicados. Un set inválido no se incluye en el JSON exportado — no hay manejo en runtime para un set mal formado (spec.md Edge Case).

### TreasureSetCatalog
Origen: `TreasureSetCatalog.cs`. `{ sets: TreasureSetDefinition[] }` — lista pequeña y dedicada, mismo patrón que `UnitUnlockCatalog`/`BattleItemCatalog`.

### BattleItemDefinition
Origen: `Assets/Scripts/Model/Battler/BattleItemDefinition.cs`.

```ts
interface BattleItemDefinition {
  itemId: string;
  displayNameKey: string;
  category: "SpeedBoost" | "ExtraResource" | "BonusTreasure"; // BattleItemCategory
  magnitude: number; // >= 0, clamp en autoría de contenido (espejo de OnValidate)
}
```

### BattleItemCatalog
Origen: `BattleItemCatalog.cs`. `{ items: BattleItemDefinition[] }`. Lookup por `itemId` (comparación ordinal, ver `research.md`).

## Guardado del jugador — campos ya existentes en `PlayerProgressSaveData` (ver `024/data-model.md`)

Ningún campo nuevo. Esta spec **usa** tres campos que `024/data-model.md` ya declaró como parte de `PlayerProgressSaveData`:

- `obtainedTreasureIds: string[]` — tesoros individuales ya obtenidos (poblado por el flujo de recompensas de `024`; consultado aquí por `isSetComplete`/"Radar de Tesoro").
- `grantedTreasureSetIds: string[]` — monótono; qué sets ya otorgaron su bonificación.
- `battleItemInventory: { itemId: string; count: number }[]` (`BattleItemStack[]`) — cantidad poseída por objeto; array plano, no `Map`/diccionario, para mantener la forma serializable ya fijada en `024`.

## Runtime (memoria, nunca serializado)

### BattleItemSelection
Estado efímero del lado del cliente entre la pantalla de preparación pre-batalla y la entrada efectiva a la batalla (ver `research.md` Decisión 2 — equivalente a `BattleLaunchContext.SelectedBattleItemIds` de Unity).

```ts
interface BattleItemSelection {
  selectedItemIds: string[]; // longitud <= 3, puede repetir itemId (múltiples copias del mismo objeto)
}
```
Validación (espejo de `BattleItemSelectionController.TryConfirmSelection`): rechazar si `selectedItemIds.length > 3`; agrupar por `itemId` y rechazar si la cantidad pedida de algún `itemId` excede `battleItemInventory` correspondiente. Una lista vacía es válida. No se persiste — si el jugador no llega a entrar a la batalla, se descarta sin ningún efecto sobre el inventario.

### Extensión de `BattleSession` (ver `024/data-model.md` § BattleSession)

Esta spec rellena dos huecos que `024` había dejado explícitamente fuera de su port inicial de `GrantLevelRewards`/`setupChapter`:

- **`setupChapter`**: además de lo ya definido en `024`, ahora también: (a) suma `passiveRegenBonus` de cada `TreasureSetDefinition` con `hasRewardsGranted() === true` y lo aplica a `battleResource` antes de habilitar despliegue; (b) resuelve `BattleItemSelection` pendiente, descuenta inventario, y aplica sus efectos (`moveSpeedMultiplier += magnitude` por cada `SpeedBoost`, `grantedInstantResourceAmount += magnitude` por cada `ExtraResource` sumado a `battleResource`, marca `bonusTreasureRequested = true` si hay algún `BonusTreasure`).
- **Flujo de recompensas de victoria** (dentro de `SetOutcome`/`GrantLevelRewards` de `024`): además de XP + desbloqueo de unidad ya cubiertos, ahora también: evalúa todos los sets del catálogo, otorga los recién completados (monótono) y aplica su bono de inmediato a la sesión activa; si `bonusTreasureRequested`, otorga un tesoro pendiente aleatorio entre todos los sets (ver `research.md` Decisión 6).

Campos nuevos en el estado de sesión (`BattleSession`, extiende el interfaz de `024`):
```ts
interface BattleSession {
  // ...campos ya definidos en 024/data-model.md...
  moveSpeedMultiplier: number;         // default 1, reseteado en setupChapter, NO en retry
  grantedInstantResourceAmount: number; // cacheado para reaplicar en retry (research.md Decisión 7)
  bonusTreasureRequested: boolean;      // NO se resetea en retry (persiste igual que en Unity)
}
```

## Relaciones clave

- `TreasureSetDefinition.treasureIds[] (*) → ChapterDefinition.treasureRewardId (1)` de `024/data-model.md` — un `treasureId` es simplemente el `treasureRewardId` de algún capítulo; los sets no introducen un nuevo espacio de identificadores.
- `PlayerProgressSaveData.grantedTreasureSetIds[] (*) → TreasureSetDefinition (1)` vía `setId`.
- `BattleItemSelection.selectedItemIds[] (*) → BattleItemDefinition (1)` vía `itemId`, validado contra `PlayerProgressSaveData.battleItemInventory[]`.
- `ChapterDefinition.battleItemReward (1) → BattleItemDefinition (1)` (ya declarado en `024/data-model.md` — la recompensa de objeto de batalla de un capítulo, sin relación con la selección pre-batalla de esta spec).
