/**
 * specs/031-mejoras-de-base. Catálogo puro de mejoras de cuenta (manual técnico §5.9) — sin
 * dependencia de React/Zustand (Constitución § IV/VI). Valores de diseño provisionales, no
 * balanceados, mismo criterio que `SPECIAL_CANNON_DEFAULTS` (specs/012) y el costo lineal de
 * `UpgradeScreen.tsx` para unidades.
 */

export type BaseUpgradeId = 'cannonPower' | 'cannonRange' | 'cannonCharge' | 'baseDefense' | 'research' | 'accounting' | 'energyCap'

export interface BaseUpgradeDefinition {
  id: BaseUpgradeId
  name: string
  maxLevel: number
}

const MAX_LEVEL = 10

export const BASE_UPGRADES: BaseUpgradeDefinition[] = [
  { id: 'cannonPower', name: 'Potencia de Cañón', maxLevel: MAX_LEVEL },
  { id: 'cannonRange', name: 'Alcance de Cañón', maxLevel: MAX_LEVEL },
  { id: 'cannonCharge', name: 'Recarga de Cañón', maxLevel: MAX_LEVEL },
  { id: 'baseDefense', name: 'Defensa de Base', maxLevel: MAX_LEVEL },
  { id: 'research', name: 'Investigación', maxLevel: MAX_LEVEL },
  { id: 'accounting', name: 'Contabilidad', maxLevel: MAX_LEVEL },
  { id: 'energyCap', name: 'Energía', maxLevel: MAX_LEVEL },
]

/** Costo en `currency` para subir de `currentLevel` a `currentLevel + 1` — igual para las 7 mejoras. */
export function getBaseUpgradeCost(currentLevel: number): number {
  return (currentLevel + 1) * 100
}

export const MIN_CANNON_RECHARGE_SECONDS = 5
export const MIN_UNIT_COOLDOWN_SECONDS = 0.5

export function getCannonPowerBonus(level: number): number {
  return level * 10
}

export function getCannonRangeBonus(level: number): number {
  return level * 5
}

/** Segundos a restar de `rechargeDurationSeconds`, antes de aplicar `MIN_CANNON_RECHARGE_SECONDS`. */
export function getCannonChargeReduction(level: number): number {
  return level * 1
}

export function getBaseDefenseBonus(level: number): number {
  return level * 100
}

/** Segundos a restar del `cooldownSeconds` de una unidad, antes de aplicar `MIN_UNIT_COOLDOWN_SECONDS`. */
export function getResearchCooldownReduction(level: number): number {
  return level * 0.1
}

/** Multiplicador de moneda de victoria — combina multiplicativamente con `getActiveBonusMultiplier`/`getActiveComboBonusMultiplier`. */
export function getAccountingMultiplier(level: number): number {
  return 1 + level * 0.05
}

export function getEnergyCapBonus(level: number): number {
  return level * 10
}
