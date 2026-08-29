# Implementation Plan: Catálogo de Habilidades de Combate — Golpe Letal, Killers, Escudo e Invocar

**Branch**: `038-catalogo-habilidades-avanzado` | **Date**: 2026-08-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/038-catalogo-habilidades-avanzado/spec.md`

## Summary

Extiende `Ability`/`BattleUnit` (`src/engine/types.ts`) con cuatro miembros nuevos — `MassiveDamage`, `TraitKiller`, `Shield`, `SummonOnDeath` — y extiende `src/engine/combat.ts`/`src/engine/simulation.ts` para resolverlos, mismo patrón aditivo ya usado por `TraitResistance` (`specs/015`) y `Critical`/`MultiHit` (`specs/016`). No introduce arquitectura nueva: reutiliza el `random: () => number` ya inyectado en `combat.ts` (specs/016) y el matching de rasgo ya existente (specs/009).

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: N/A — sin persistencia (habilidades son datos estáticos de `Cat`; `shieldRemainingHp` es estado efímero de `BattleUnit`, Constitución § V).

**Testing**: Vitest — `tests/unit/engine/combat.test.ts`/`simulation.test.ts` extendidos con `random` inyectado para hacer determinista cada roll de probabilidad, mismo patrón que `criticalChance` en `specs/016`.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio — mismas operaciones O(1) por golpe ya existentes en `applyDamageSequence`.

**Constraints**: `src/engine/combat.ts` sigue sin ninguna dependencia de `src/data/` (Constitución § VI) — `SummonOnDeath` (que necesita construir una `BattleUnit` nueva a partir de un `catId`) se resuelve en `src/engine/simulation.ts`, que ya importa `CATS` para el spawn de oleada, no en `combat.ts`.

**Scale/Scope**: extensión de `engine/types.ts`, `engine/combat.ts`, `engine/simulation.ts`, `state/useGameStore.ts` (init de `shieldRemainingHp` al desplegar), `data/cats.ts` (datos semilla de demostración).

## Constitution Check

- **§ IV Balance Dirigido por Datos**: probabilidad/multiplicador/tamaño de escudo/`catId` a invocar viven como datos en `src/data/cats.ts` (dentro de `Ability`, ya un campo de `Cat`) — cumple.
- **§ VI Separación Motor/UI**: todo el comportamiento nuevo vive en `src/engine/` (funciones puras, sin canvas/DOM); `SummonOnDeath` no toca `src/game/` ni React — cumple.
- **§ VII Simplicidad/YAGNI**: `shieldRemainingHp` es un único escalar (no una pila de escudos ni un `Record` genérico); las variantes de Killer se seedean solo 2-3 veces, no las ~8 del catálogo de referencia; inmunidad a las capacidades nuevas queda fuera de alcance — cumple.

## Project Structure

### Documentation (this feature)

```text
specs/038-catalogo-habilidades-avanzado/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── engine/
│   ├── types.ts       # Ability += MassiveDamage|TraitKiller|Shield|SummonOnDeath; BattleUnit += shieldRemainingHp?
│   ├── combat.ts       # applyDamageSequence: roll de MassiveDamage antes de Critical; TraitKiller anula hp a 0;
│   │                    # absorción de Shield antes de descontar hp; resolveAreaEngagement replica el mismo orden en splash
│   └── simulation.ts   # spawnEnemyUnit generalizado a spawnUnitFromCat(catId, team, x, ...); nuevo paso
│                        # "resolución de SummonOnDeath" justo antes del filtro `state !== 'Dead'`
├── state/
│   └── useGameStore.ts # deployUnit: inicializa shieldRemainingHp desde Ability.Shield del cat, si existe
└── data/
    └── cats.ts          # datos semilla de demostración: 1 unidad con MassiveDamage, 1-2 con TraitKiller
                          # (ej. Zombie/Metálico), 1 con Shield, 1 con SummonOnDeath
```

**Structure Decision**: extensión aditiva de los mismos módulos de `src/engine/` que ya implementan `TraitTargeting`/`Critical`/`MultiHit` — sin archivos nuevos en `engine/`. Único cambio fuera de `engine/` es la inicialización de un campo efímero en el punto de despliegue ya existente.

## Key Design Decisions

Ver `research.md` para el detalle de cada decisión — resumen:

1. Las cuatro capacidades se modelan como nuevos miembros de `Ability` (roll evaluado en combate), no como `EffectType` (efecto de duración transferido on-hit) — ninguna de las cuatro tiene una duración que decae por tick.
2. `SummonOnDeath` se resuelve en `simulation.ts`, no en `combat.ts`, para no romper el límite arquitectónico de que `combat.ts` no depende de `src/data/`.
3. `spawnEnemyUnit` se generaliza a `spawnUnitFromCat(catId, team, x, enemyStrengthMultiplier, unitSpeedMultiplier)`, reutilizado por el spawn de oleada existente (con `team: 'Enemy'`) y por `SummonOnDeath` (con el `team`/`x` de la unidad que murió).
4. `shieldRemainingHp` es un único escalar opcional en `BattleUnit`, inicializado desde `Ability.Shield.shieldHp` en los dos puntos de creación de unidad (`deployUnit`, `spawnUnitFromCat`) — mismo patrón que `curseRemainingSeconds: 0`.
5. Orden de resolución por golpe en `applyDamageSequence`: daño base (con `TraitTargeting`/`TraitResistance`/Debilitar ya aplicados) → roll de `MassiveDamage` → roll de `Critical` (specs/016) → roll de `TraitKiller` (si acierta, anula todo lo anterior y pone `hp` a 0) → si no, se descuenta primero del `shieldRemainingHp` del defensor y el excedente de su `hp`.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
