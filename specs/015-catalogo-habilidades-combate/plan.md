# Implementation Plan: Ampliación del Catálogo de Habilidades de Combate

**Branch**: `015-catalogo-habilidades-combate` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-catalogo-habilidades-combate/spec.md`

## Summary

Extiende `EffectType`/`Ability`/`BattleUnit` (`src/engine/types.ts`) con Debilitar/Congelar/Ralentizar/`TraitResistance`/`resistantTo`, y extiende `src/engine/combat.ts` para resolverlos — mismo patrón aditivo ya usado por `Curse` (`specs/009`), sin tocar `AttackType` ni el mecanismo de selección de objetivo.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: N/A — sin persistencia (efectos de combate son estado efímero de `BattleUnit`, Constitución § V).

**Testing**: Vitest — `tests/unit/engine/combat.test.ts`/`simulation.test.ts` extendidos, sin canvas ni DOM.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio.

**Constraints**: `src/engine/` sigue siendo el único lugar que resuelve efectos — ningún componente de `src/game/` necesita conocer `Weaken`/`Freeze`/`Slow` para la simulación (solo `UnitSprite`/`animation.ts` podrían opcionalmente reflejarlos visualmente en una spec futura, fuera de alcance aquí).

**Scale/Scope**: extensión de `engine/types.ts`, `engine/combat.ts`, `engine/simulation.ts`, `data/cats.ts`.

## Constitution Check

- **§ IV Balance Dirigido por Datos**: magnitud/duración de cada efecto y las resistencias viven en `src/data/cats.ts` — cumple.
- **§ VI Separación Motor/UI**: todo el comportamiento nuevo vive en `src/engine/`, funciones puras testeables sin canvas ni DOM — cumple.
- **§ VII Simplicidad/YAGNI**: reutiliza el campo `appliesEffect` singular ya existente (no introduce una lista de efectos simultáneos por unidad) y el patrón de campo `xRemainingSeconds` opcional ya validado por `Curse` — cumple.

## Project Structure

### Documentation (this feature)

```text
specs/015-catalogo-habilidades-combate/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── engine/
│   ├── types.ts    # EffectType += 'Weaken'|'Freeze'|'Slow'; AppliesEffect += magnitude?; Ability += TraitResistance; BattleUnit += weakenRemainingSeconds?/freezeRemainingSeconds?/slowRemainingSeconds?/resistantTo?
│   ├── combat.ts    # resolveAbilityMultiplier += TraitResistance (daño recibido); applyOnHitEffect generaliza Curse a cualquier EffectType, aplicando resistantTo del defensor
│   └── simulation.ts # stepSimulation: decremento de los 3 campos nuevos junto a curseRemainingSeconds; freeze bloquea movimiento/ataque; slow reduce speed efectiva en el cálculo de freeMovers
└── data/
    └── cats.ts       # fixtures de prueba con appliesEffect/abilities/resistantTo nuevos (sin tocar los 4 gatos base ni los de specs/011)
```

**Structure Decision**: extensión aditiva de los mismos tres módulos de `src/engine/` que ya implementan `Curse`/`TraitTargeting` — sin archivos nuevos.

## Key Design Decisions

1. **Un campo `xRemainingSeconds` por efecto, no una lista genérica**: sigue el patrón ya validado por `curseRemainingSeconds` en vez de introducir `activeEffects: Partial<Record<EffectType, number>>` — más verboso pero consistente con el código existente y con FR-011 (cero cambio de comportamiento para unidades que no declaran nada nuevo).
2. **`applyOnHitEffect` generalizada**: hoy solo lee `attacker.appliesEffect?.type === 'Curse'`; se generaliza a un `switch`/mapa sobre `EffectType` que escribe el campo `xRemainingSeconds` correspondiente del defensor, aplicando `resistantTo` del defensor a la duración antes de escribirla (FR-009) y respetando `immuneEffects` (sin cambios, FR-010).
3. **Congelar bloquea en la misma etapa que "target en rango"**: `stepSimulation` trata a una unidad con `freezeRemainingSeconds > 0` como si no pudiera generar `engagements`/`baseAttackers`/`freeMovers` — permanece en su `x` actual sin decrementar su `attackCooldownRemaining`, evitando que "acumule" un ataque pendiente mientras está congelada.
4. **Ralentizar como multiplicador de `speed` en el cálculo de `freeMovers`**: `tentativeX` usa `unit.speed * (slowFactor si aplica)` en vez de `unit.speed` directo — cambio de una línea en el bucle ya existente de `stepSimulation`.
5. **`TraitResistance` se evalúa en el lado del defensor**: `resolveAbilityMultiplier(attacker, defender)` ya devuelve el multiplicador del atacante; se añade una segunda función `resolveResistanceMultiplier(defender, attacker)` que busca `TraitResistance` en `defender.abilities` — `combat.ts` multiplica ambos factores al calcular el daño final, manteniendo cada función responsable de un solo lado.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
