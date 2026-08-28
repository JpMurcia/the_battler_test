# Data Model: Talentos y Orbes

## `src/data/talents.ts` (nuevo, funciones puras — sin React/Zustand, Constitución § VI)

```ts
import type { ClassificationType, EffectType } from '../engine/types'

export const MAX_TALENT_POINTS = 5
export const TALENT_POINT_BASE_COST = 100 // NP

export const DEBUFF_RESISTANCE_OPTIONS: EffectType[] = ['Weaken', 'Freeze', 'Slow']
export const ORB_CLASSIFICATION_OPTIONS: ClassificationType[] = [
  'Red', 'Floating', 'Black', 'Angel', 'Alien', 'Zombie', 'Relic', 'Traitless',
]

export interface CatTalents {
  debuffResistance?: { effect: EffectType; points: number }
  statBoost?: { hp: number; damage: number }
  orb?: { classification: ClassificationType; points: number }
}

/** Costo en NP del siguiente punto a invertir, dado el número de puntos ya invertidos en esa pista/contador. */
export function getTalentPointCost(currentPoints: number): number {
  return TALENT_POINT_BASE_COST * (currentPoints + 1)
}

/** 1.0 sin puntos → 0.5 con 5 puntos, en pasos de 0.1. */
export function getDebuffResistanceMultiplier(points: number): number {
  return Math.max(0.5, 1 - points * 0.1)
}

/** 1.0 sin puntos → 1.10 con 5 puntos, en pasos de +2%. */
export function getStatBoostMultiplier(points: number): number {
  return 1 + points * 0.02
}

/** 1.0 sin puntos → 1.20 con 5 puntos, en pasos de +4%. */
export function getOrbDamageMultiplier(points: number): number {
  return 1 + points * 0.04
}

/** specs/036 FR-001: solo Forma Verdadera + rareza Megarraro/Legendario. */
export function isTalentEligible(evolutionStage: 'Base' | 'Second' | 'True', rarity: string | undefined): boolean {
  return evolutionStage === 'True' && (rarity === 'Megarraro' || rarity === 'Legendario')
}
```

## `src/db/index.ts` (modificado)

```ts
export interface OwnedCatRow {
  catId: string
  level: number
  experienceInvested: number
  evolutionStage?: 'Base' | 'Second' | 'True'
  plusLevel?: number
  /** specs/036-talentos-orbes. Ausente en filas viejas = sin talentos invertidos (sin migración, mismo patrón que evolutionStage/plusLevel). */
  talents?: CatTalents
}
```

`CatTalents` importado desde `src/data/talents.ts`. No se toca `this.version(N)` — campo opcional en una tabla ya existente.

## `src/state/useMetaStore.ts` (modificado)

```ts
interface OwnedCatMeta {
  level: number
  experienceInvested: number
  evolutionStage: 'Base' | 'Second' | 'True'
  plusLevel?: number
  /** specs/036-talentos-orbes. */
  talents?: CatTalents
}
```

`hydrate()`: al mapear cada `OwnedCatRow` a `OwnedCatMeta`, copiar `talents: row.talents` (ausente → `undefined`, tratado como "sin inversión" por las funciones de `talents.ts`).

Nuevas acciones (mismo patrón defensivo que `evolveCat`/`startOtotoConstruction` — devuelven `boolean`, no mutan si la validación falla):

```ts
investDebuffResistanceTalent: (catId: string, effect: EffectType) => boolean
investStatBoostTalent: (catId: string, stat: 'hp' | 'damage') => boolean
investOrbTalent: (catId: string, classification: ClassificationType) => boolean
```

Cada una:
1. Lee `owned = get().ownedCats[catId]` y el `Cat` correspondiente en `CATS`; si no existen, o `!isTalentEligible(owned.evolutionStage, cat.rarity)`, devuelve `false`.
2. Lee la pista relevante de `owned.talents` (ausente → puntos `0`, sin elección).
3. Si la pista ya tiene una elección fija (`effect`/`classification`) distinta a la solicitada y `points > 0`, devuelve `false` (elección permanente, FR-004) — excepto `investStatBoostTalent`, que no tiene elección, solo puntos por `stat`.
4. Si `points >= MAX_TALENT_POINTS`, devuelve `false`.
5. Calcula `cost = getTalentPointCost(points)`; si `get().npCurrency < cost`, devuelve `false`.
6. Descuenta `npCurrency`, incrementa `points` en 1 (fijando la elección si era el primer punto), actualiza `ownedCats[catId].talents` en el estado y en `db.ownedCats.update(catId, { talents })`.
7. Devuelve `true`.

## `src/state/useGameStore.ts` (modificado — `deployUnit()`)

Tras calcular `effectiveStats`/`abilities`/`resistantTo` (ya extendidos por `specs/031`/`specs/035`), leer:

```ts
const talents = useMetaStore.getState().ownedCats[catId]?.talents
```

y aplicar, en este orden, sobre las variables ya calculadas (sin tocar `getEffectiveCatStats`):

- **Aumento de Estadísticas**: `hp *= getStatBoostMultiplier(talents?.statBoost?.hp ?? 0)`, `damage *= getStatBoostMultiplier(talents?.statBoost?.damage ?? 0)`, aplicado sobre `effectiveStats.hp`/`effectiveStats.damage` antes de asignarlos a `unit.hp`/`unit.maxHp`/`unit.damage`.
- **Resistencia a Debuff**: si `talents?.debuffResistance` existe, `resistantTo = [{ effect: talents.debuffResistance.effect, durationMultiplier: getDebuffResistanceMultiplier(talents.debuffResistance.points) }, ...resistantTo]` (antepuesto a lo ya resuelto por Ototo/el propio gato).
- **Orbe**: si `talents?.orb` existe, `abilities = [{ kind: 'TraitTargeting', targetClassifications: [talents.orb.classification], damageMultiplier: getOrbDamageMultiplier(talents.orb.points) }, ...abilities]` (antepuesto a lo ya resuelto por el propio gato).

## `src/screens/shared/UnitDetailPanel.tsx` (modificado)

Nueva sección `<TalentsSection catId={catId} />` (mismo archivo o sub-componente local), renderizada solo si `owned && isTalentEligible(owned.evolutionStage, cat.rarity)`. Muestra:
- NP disponible (`useMetaStore((state) => state.npCurrency)`).
- Por cada una de las 3 pistas: estado actual (elección si la hay + `puntos/MAX_TALENT_POINTS`), un `<select>` de elección (solo si `points === 0`, deshabilitado/oculto una vez fijada) para Resistencia a Debuff y Orbe, y un botón "+1 punto" deshabilitado si `npCurrency < getTalentPointCost(points)` o `points >= MAX_TALENT_POINTS`.
