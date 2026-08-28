# Data Model: Mejoras de Base

## `src/data/baseUpgrades.ts` (nuevo módulo puro)

```ts
export type BaseUpgradeId = 'cannonPower' | 'cannonRange' | 'cannonCharge' | 'baseDefense' | 'research' | 'accounting' | 'energyCap'

export interface BaseUpgradeDefinition {
  id: BaseUpgradeId
  name: string
  maxLevel: number
}

export const BASE_UPGRADES: BaseUpgradeDefinition[] // 7 entradas, ver research.md Decisión 5

export function getBaseUpgradeCost(currentLevel: number): number // (currentLevel + 1) * 100, igual para las 7

export const MIN_CANNON_RECHARGE_SECONDS = 5
export const MIN_UNIT_COOLDOWN_SECONDS = 0.5

export function getCannonPowerBonus(level: number): number // level * 10
export function getCannonRangeBonus(level: number): number // level * 5
export function getCannonChargeReduction(level: number): number // level * 1 (segundos a restar, antes del piso)
export function getBaseDefenseBonus(level: number): number // level * 100
export function getResearchCooldownReduction(level: number): number // level * 0.1 (segundos a restar, antes del piso)
export function getAccountingMultiplier(level: number): number // 1 + level * 0.05
export function getEnergyCapBonus(level: number): number // level * 10
```

## `useMetaStore` — campo y acciones nuevas

| Campo/acción | Tipo | Descripción |
|---|---|---|
| `baseUpgrades` | `Record<BaseUpgradeId, number>` | Nivel actual por mejora — ausente = 0 (`baseUpgrades[id] ?? 0`), default `{}` |
| `upgradeBaseUpgrade(id)` | `(id: BaseUpgradeId) => boolean` | Igual patrón que `upgradeCat`: valida tope de nivel y costo (`getBaseUpgradeCost`), descuenta `currency`, persiste |
| `getBaseUpgradeCurrencyMultiplier()` | `() => number` | `getAccountingMultiplier(baseUpgrades.accounting ?? 0)` — factor adicional para `BattleOutcomeWatcher` |

`hydrate()` y el recálculo de `upgradeCat()` (donde ya se recalcula `missionEnergy.max`/`regenPerSecond` por nivel de personaje) suman `getEnergyCapBonus(baseUpgrades.energyCap ?? 0)` al `max` derivado.

## `useGameStore` — lectura de bonos al iniciar nivel/desplegar

- `startLevel()`: lee `useMetaStore.getState().baseUpgrades` una vez; `specialCannon` inicial = `{ damage: SPECIAL_CANNON_DEFAULTS.damage + getCannonPowerBonus(...), areaRadius: SPECIAL_CANNON_DEFAULTS.areaRadius + getCannonRangeBonus(...), rechargeDurationSeconds: Math.max(MIN_CANNON_RECHARGE_SECONDS, SPECIAL_CANNON_DEFAULTS.rechargeDurationSeconds - getCannonChargeReduction(...)) }`; `playerBase.maxHp`/`hp` = `level.playerBaseHp + getBaseDefenseBonus(...)`.
- `deployUnit()`: `deployCooldowns[catId] = Math.max(MIN_UNIT_COOLDOWN_SECONDS, cat.cooldownSeconds - getResearchCooldownReduction(...))` en vez de `cat.cooldownSeconds` tal cual.

## Dexie (`src/db/index.ts`)

```ts
export interface BaseUpgradesRow {
  id: 1 // fila única (singleton)
  levels: Record<BaseUpgradeId, number>
}
```

`this.version(12).stores({ baseUpgrades: 'id' })`. Sin seed en `ensureDefaultProfile()` — ausencia de fila = todas las mejoras en nivel 0 (mismo patrón que `evolutionItems`/`battleItems`, que tampoco se seedean explícitamente).
