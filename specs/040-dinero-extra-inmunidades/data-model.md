# Data Model: Catálogo de Habilidades de Combate — Dinero Extra e Inmunidad a Habilidades

## `src/engine/types.ts` (modificado)

```ts
/** specs/040-dinero-extra-inmunidades (FR-005). Habilidades ofensivas que un defensor puede ignorar por completo. */
export type ImmunizableAbilityKind = 'MassiveDamage' | 'TraitKiller' | 'Knockback'

export type Ability =
  // ...miembros existentes sin cambios (TraitTargeting, Neutral, TraitResistance, MassiveDamage, TraitKiller, Shield,
  //    SummonOnDeath, Strengthen, Dodge, Survive, Knockback)...
  /** specs/040-dinero-extra-inmunidades (FR-001). Al derrotar esta unidad del jugador a una unidad enemiga con su golpe, el jugador gana `energyBonus` de energía. */
  | { kind: 'ExtraMoney'; energyBonus: number }
```

`BattleUnit` gana dos campos opcionales:

```ts
export interface BattleUnit {
  // ...campos existentes sin cambios...
  /** specs/040-dinero-extra-inmunidades (FR-005). Ausente = sin inmunidades. Habilidades de un atacante que esta unidad ignora por completo al ser golpeada. */
  immuneAbilities?: ImmunizableAbilityKind[]
  /**
   * specs/040-dinero-extra-inmunidades (FR-001, research.md Decisión 3). Estado efímero de batalla — se escribe en el golpe
   * letal de una unidad del jugador con `ExtraMoney` contra esta unidad enemiga; `stepSimulation` lo suma a la energía del
   * jugador en el mismo paso y se descarta con la unidad al filtrarse las `Dead`. Nunca se persiste.
   */
  defeatBounty?: number
}
```

`Cat` (`src/data/cats.ts`) gana el campo de datos correspondiente:

```ts
export interface Cat {
  // ...campos existentes sin cambios...
  /** specs/040-dinero-extra-inmunidades (FR-005). Copiado al `BattleUnit` en deployUnit/spawnUnitFromCat. */
  immuneAbilities?: ImmunizableAbilityKind[]
}
```

## `src/engine/combat.ts` (modificado)

`findActiveAbility` (introducida en `specs/039`) sigue siendo privada — `simulation.ts` no la necesita porque el bono viaja en `defeatBounty`.

Helper nuevo:

```ts
/** specs/040 (FR-005/FR-006/FR-007). Propiedad pasiva del defensor — no se ve afectada por Curse, igual que `immuneEffects`. */
function isImmuneToAbility(defender: BattleUnit, kind: ImmunizableAbilityKind): boolean {
  return defender.immuneAbilities?.includes(kind) ?? false
}
```

`findMatchingTraitKiller` (existente) gana un cortocircuito al inicio, tras el chequeo de `Curse` del atacante:

```ts
if (isImmuneToAbility(defender, 'TraitKiller')) return undefined
```

`applyHit` (modificada) — dos cambios sobre el orden de `specs/039`:

```ts
// Golpe Letal: si el defensor es inmune, la habilidad se trata como no declarada para este golpe (sin roll)
const massiveDamage = isImmuneToAbility(defender, 'MassiveDamage') ? undefined : findActiveAbility(attacker, 'MassiveDamage')
// ...Crítico, Killer (findMatchingTraitKiller ya respeta la inmunidad), escudo/hp, Sobrevivir: sin cambios...

// Retroceso: igual que Golpe Letal
const knockback = isImmuneToAbility(defender, 'Knockback') ? undefined : findActiveAbility(attacker, 'Knockback')
if (defender.hp > 0 && knockback !== undefined && random() < knockback.chance) knockBack(defender, knockback.distance, laneLength)

// Dinero Extra: tras resolver Sobrevivir, en el golpe letal de una unidad del jugador contra un enemigo
if (defender.hp <= 0 && attacker.team === 'Player' && defender.team === 'Enemy') {
  const extraMoney = findActiveAbility(attacker, 'ExtraMoney')
  if (extraMoney !== undefined) defender.defeatBounty = extraMoney.energyBonus
}
```

(El bloque de Dinero Extra se coloca justo después de Sobrevivir y antes de Retroceso/efectos on-hit; Retroceso ya exige `defender.hp > 0`, así que ambos bloques son mutuamente excluyentes por golpe.)

## `src/engine/simulation.ts` (modificado)

`spawnUnitFromCat` copia el nuevo campo, junto a `immuneEffects`:

```ts
immuneAbilities: cat.immuneAbilities,
```

`stepSimulation` — tras resolver combates y movimiento y antes de construir `units`, suma los bonos de las unidades enemigas derrotadas este paso y los aplica a la energía:

```ts
let defeatBountyTotal = 0
for (const unit of byId.values()) {
  if (unit.state === 'Dead' && unit.team === 'Enemy') defeatBountyTotal += unit.defeatBounty ?? 0
}
const nextEnergy = { ...energy, current: Math.min(energy.max, energy.current + defeatBountyTotal) }
```

y `nextState` usa `energy: nextEnergy` en lugar de `energy`. (El recorrido ocurre antes del filtro `state !== 'Dead'`, que ya descarta a las unidades derrotadas junto con su `defeatBounty`.)

## `src/state/useGameStore.ts` (modificado)

`deployUnit`: junto a `immuneEffects: cat.immuneEffects`, agrega `immuneAbilities: cat.immuneAbilities`. No necesita ningún otro cambio: `ExtraMoney` viaja dentro de `abilities`, que ya se copia (con los antepuestos de Ototo/Talentos).

## `src/screens/shared/abilityLabels.ts` (nuevo)

```ts
import type { ImmunizableAbilityKind } from '../../engine/types'

const IMMUNITY_LABELS: Record<ImmunizableAbilityKind, string> = {
  MassiveDamage: 'Golpe Letal',
  TraitKiller: 'Killer',
  Knockback: 'Retroceso',
}

/** specs/040 (FR-010). `''` si la lista es ausente o vacía — el llamador no renderiza nada en ese caso. */
export function describeImmunities(immuneAbilities: ImmunizableAbilityKind[] | undefined): string {
  return (immuneAbilities ?? []).map((kind) => IMMUNITY_LABELS[kind]).join(', ')
}
```

## `src/screens/shared/UnitDetailPanel.tsx` y `src/screens/EnemyGuideScreen.tsx` (modificados)

- `describeAbility` gana el caso `ExtraMoney` → `Dinero Extra (+{energyBonus} energía por enemigo derrotado)`.
- `UnitDetailPanel`: fila `Inmune a: {describeImmunities(cat.immuneAbilities)}` solo si la unidad declara inmunidades.
- `EnemyGuideScreen`: por enemigo enfrentado con inmunidades, un texto secundario `Inmune a: {describeImmunities(cat.immuneAbilities)}` junto a su fila; los enemigos sin inmunidades se renderizan exactamente como hoy.

## `src/data/cats.ts` (modificado — datos semilla)

- `enemy-la-mascara` gana `immuneAbilities: ['MassiveDamage', 'TraitKiller', 'Knockback']` (FR-008) sin tocar ninguno de sus demás campos.
- Dos gatos nuevos, añadidos tras los de `specs/039` y antes del spread de `SEED_CATS_AS_CATS` (sin modificar ningún gato existente, FR-009). Misma forma que los de `specs/038`/`specs/039`: `attackType: 'Single'`, `attackRange: 0`, `classification: 'Traitless'`, sin `spriteKey`:

| `id` | Nombre | Coste / recarga | HP / daño | Vel. / ancho / intervalo | Rareza | Habilidad / inmunidad |
|---|---|---|---|---|---|---|
| `wallet-cat` | Gato Cobrador | 35 / 6 s | 80 / 9 | 15 / 18 / 1.3 s | Raro | `abilities: [{ kind: 'ExtraMoney', energyBonus: 5 }]` |
| `anchor-cat` | Gato Ancla | 45 / 7 s | 160 / 6 | 8 / 24 / 1.7 s | Raro | `immuneAbilities: ['Knockback']` |

Valores provisionales no balanceados (mismo estatus que los de `specs/038`/`specs/039`) — ajustables sin tocar código (Constitución § IV).
