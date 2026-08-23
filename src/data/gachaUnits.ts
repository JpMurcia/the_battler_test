import type { Cat } from './cats'

/**
 * specs/024-sistema-gacha (FR-013). 4 gatos gacha-exclusivos que pueblan las rarezas `Legendario`/`Colaboración`
 * (0 unidades antes de esta spec). Sin `spriteKey` a propósito — caen en el fallback `Graphics` genérico que
 * `UnitSprite.tsx` ya provee desde specs/003 (idle + ataque por transform), sin pipeline procedural nuevo
 * (research.md Decisión 2). Valores de diseño provisionales, no balanceados, mismo criterio que `CATS`.
 */
export const GACHA_UNITS: Cat[] = [
  {
    id: 'legend-cat-eclipse',
    name: 'Gato Eclipse',
    cost: 3500,
    cooldownSeconds: 45,
    hp: 500,
    damage: 150,
    speed: 12,
    width: 40,
    attackIntervalSeconds: 3.5,
    attackType: 'Critical',
    attackRange: 0,
    classification: 'Traitless',
    rarity: 'Legendario',
    criticalChance: 0.3,
  },
  {
    id: 'legend-cat-supreme',
    name: 'Gato Supremo',
    cost: 3000,
    cooldownSeconds: 42,
    hp: 700,
    damage: 60,
    speed: 10,
    width: 42,
    attackIntervalSeconds: 2.5,
    attackType: 'Area',
    attackRange: 150,
    areaRadius: 120,
    classification: 'Traitless',
    rarity: 'Legendario',
    abilities: [{ kind: 'TraitTargeting', targetClassifications: ['Zombie', 'Relic'], damageMultiplier: 2 }],
  },
  {
    id: 'collab-cat-voidwalker',
    name: 'Gato Errante del Vacío',
    cost: 1800,
    cooldownSeconds: 30,
    hp: 220,
    damage: 45,
    speed: 16,
    width: 26,
    attackIntervalSeconds: 2.2,
    attackType: 'LongRange',
    attackRange: 350,
    classification: 'Alien',
    rarity: 'Colaboración',
  },
  {
    id: 'collab-cat-star-idol',
    name: 'Gato Ídolo Estelar',
    cost: 1600,
    cooldownSeconds: 28,
    hp: 160,
    damage: 20,
    speed: 18,
    width: 24,
    attackIntervalSeconds: 1.8,
    attackType: 'MultiHit',
    attackRange: 0,
    classification: 'Angel',
    rarity: 'Colaboración',
    hitsPerSequence: 3,
  },
]
