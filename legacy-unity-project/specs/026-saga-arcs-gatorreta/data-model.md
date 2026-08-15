# Phase 1 Data Model: Arcos de Saga y Gatorreta en la Versión Web

**Input**: [spec.md](./spec.md) Key Entities · [research.md](./research.md) · Extiende `specs/024-react-web-migration/data-model.md` (no lo redefine — `SagaArcDefinition`/`SagaArcProgressRecord` ya estaban ahí como stubs de contenido/guardado).

## Contenido estático (JSON, `src/data/`, ver `024` research.md Decisión 5)

### SagaArcDefinition
Origen: `Assets/Scripts/Model/Battler/SagaArcDefinition.cs` (ScriptableObject) — ya declarado en `024/data-model.md`, repetido aquí con el detalle completo de validación:

```ts
interface SagaArcDefinition {
  arcId: string;
  displayNameKey: string;
  unitCostMultiplier: number;    // >= 0, default 1
  enemyStrengthMultiplier: number; // >= 0, default 1
  levels: string[];              // chapterId[], no vacío
  bossLevel?: string;            // chapterId — si está definido, DEBE estar contenido en levels[]
  arcCompletionUnitUnlocks: string[]; // unitId[]
  arcCompletionFeatureFlags: string[]; // banderas opacas — ver research.md Decisión 6
}
```
Invariante de validez (espejo de `SagaArcDefinition.IsValid`): `arcId`/`displayNameKey` no vacíos; `levels` no vacío; ambos multiplicadores `>= 0`; si `bossLevel` está definido, debe pertenecer a `levels[]`. Un arco inválido no se incluye en el JSON exportado.

### SagaArcCatalog
Nuevo — mismo patrón que `TreasureSetCatalog`/`BattleItemCatalog` (`025`): `{ arcs: SagaArcDefinition[] }`. No existe como `ScriptableObject` dedicado en Unity (cada capítulo referencia su arco directamente o vía `BattleLaunchContext.RequestedArc`), pero el port web sí necesita una lista completa para resolver "a qué arco pertenece este capítulo" al armar la pantalla de selección de nivel.

## Guardado del jugador — campo ya existente en `ProgressSaveData` (ver `024/data-model.md`)

Ningún campo nuevo. Esta spec usa `arcs: SagaArcProgressRecord[]`, ya declarado en `024/data-model.md` § `ProgressSaveData`:

```ts
interface SagaArcProgressRecord {
  arcId: string;
  rewardsGranted: boolean; // monótono — nunca se revoca
}
```
La finalización del arco (`isArcCompleted`) **nunca** se guarda aquí ni en ningún otro campo — siempre se deriva de `ProgressSaveData.chapters[]` (ver `research.md` Decisión 3).

## Runtime (memoria, nunca serializado)

### SpecialAreaWeapon (Gatorreta)
Estado efímero de una batalla en curso — opcional, `undefined`/`null` si la batalla no tiene el arma configurada (mismo criterio nulo-seguro que otros paneles opcionales ya documentado en `023`/`024`).

```ts
interface SpecialAreaWeaponConfig {
  rechargeSeconds: number;  // > 0, default 30
  range: number;            // > 0, default 3
  areaDamage: number;       // >= 1, default 10
}
interface SpecialAreaWeaponState {
  rechargeRemaining: number; // arranca en rechargeSeconds — no disponible al inicio de la batalla
}
```
Derivado: `isAvailable = rechargeRemaining <= 0`. Acciones puras (`research.md` Decisión 5): `tick(state, deltaSeconds) → state` (decrece `rechargeRemaining`, nunca baja de 0); `tryActivate(state, targetsInRange) → { activated: boolean; state; damageEvents }` (no-op si no disponible; si disponible, aplica `areaDamage` a cada objetivo en `targetsInRange` y reinicia `rechargeRemaining = rechargeSeconds`); `resetRecharge(config) → state` (usado por `retryBattle`, arranca de nuevo en "recargando" — spec.md US3 Acceptance Scenario 4).

### Extensión de `BattleResourceState` (ver `024/data-model.md`, campo `regenPerSecond`)

Nuevo campo/acción sobre el estado ya definido por `024` (`battleResource.ts`, T016) y ya extendido por `025` (bonificación pasiva de sets):

```ts
// Acción pura nueva, no un campo nuevo de estado:
tryUpgradeRegen(state: BattleResourceState, cost: number, regenIncrease: number): { upgraded: boolean; state: BattleResourceState }
```
Atómico: si `state.currentAmount >= cost` y `regenIncrease > 0`, descuenta `cost` y suma `regenIncrease` a `regenPerSecond`; de lo contrario, no cambia nada. **No** se incorpora a la "línea base de diseño" que `resetResource()` restaura en un reintento (a diferencia de `applyPassiveRegenBonus` de `025`, que sí se incorpora) — ver `research.md` Decisión 7.

### Extensión de `BattleSession` (ver `024/data-model.md` y `025/data-model.md`)

```ts
interface BattleSession {
  // ...campos ya definidos en 024 y extendidos en 025...
  activeArc?: SagaArcDefinition;         // resuelto en setupChapter, consumido del contexto de navegación o del arco fijo del capítulo — research.md Decisión 2
  specialAreaWeapon?: SpecialAreaWeaponState; // undefined si el capítulo no lo configura
}
```

Extensión de `setupChapter` (además de lo ya definido en `024`/`025`): resolver `activeArc` (Decisión 2), aplicar `activeArc.unitCostMultiplier`/`enemyStrengthMultiplier` a `unitDeployment`/`enemyWaveSpawner`/salud de base enemiga (ya soportado por las firmas de `024`, solo falta la fuente del valor), inicializar `specialAreaWeapon` si el capítulo lo configura.

Extensión del flujo de recompensas de victoria (mismo paso que `025` ya añadió para sets de tesoros): si `activeArc` está definido, `isArcCompleted(activeArc, chapterProgress)` es verdadero y `hasRewardsGranted(activeArc.arcId, chapterProgress)` es falso → registrar en `arcs[]` (monótono), añadir cada `arcCompletionUnitUnlocks[]` a `unlockedBonusUnitIds` (deduplicado), persistir `arcCompletionFeatureFlags[]` sin interpretarlos (research.md Decisión 6).

Extensión de `retryBattle`: `specialAreaWeapon` se reinicia a "recargando" (`resetRecharge`); cualquier `tryUpgradeRegen` aplicado durante el intento anterior no se conserva (ya cubierto por el reset de línea base de `battleResource`, sin cambio adicional necesario aquí).

## Relaciones clave

- `SagaArcDefinition.levels[] (*) → ChapterDefinition (1)` de `024/data-model.md`, vía `chapterId`; `bossLevel` ⊆ `levels[]`.
- `SagaArcDefinition.arcCompletionUnitUnlocks[] (*) → UnitDefinition (1)` de `024/data-model.md`, vía `unitId`.
- `ProgressSaveData.arcs[] (*) → SagaArcDefinition (1)` vía `arcId`.
- `SpecialAreaWeaponConfig` — sin relación con `UnitCombatProfile`/`UnitDefinition` (research.md Decisión 5: dominio de arma de base, no de unidad desplegable).
