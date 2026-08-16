# Implementation Plan: Extensión de Tipos de Ataque — Multi-Golpe y Crítico

**Branch**: `016-multigolpe-critico` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/016-multigolpe-critico/spec.md`

## Summary

Extiende `AttackType` con `'MultiHit' | 'Critical'` y añade `hitsPerSequence`/`criticalChance`/`multiHitProgress` a `BattleUnit`; extiende `src/engine/simulation.ts`/`combat.ts` para resolver ambos, con una función de aleatoriedad inyectable para que el crítico sea determinista en tests.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: N/A.

**Testing**: Vitest — RNG inyectado y sembrado (`() => 0`, `() => 0.999`, generador con semilla fija para la prueba de distribución 35-65%).

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio.

**Constraints**: `resolveEngagement`/`resolveAreaEngagement`/`resolveBaseDamage` (`src/engine/combat.ts`) ganan un parámetro de aleatoriedad opcional con default `Math.random`, sin romper la firma para los llamadores existentes que no lo necesitan (`Single`/`Area`/`LongRange` nunca lo consultan).

**Scale/Scope**: extensión de `engine/types.ts`, `engine/combat.ts`, `engine/simulation.ts`.

## Constitution Check

- **§ IV Balance Dirigido por Datos**: `hitsPerSequence`/`criticalChance` viven en `src/data/cats.ts` — cumple.
- **§ VI Separación Motor/UI**: toda la lógica nueva vive en `src/engine/`, funciones puras (la única "impureza" es el RNG, inyectado explícitamente para mantener el resto determinista y testeable) — cumple.
- **§ VII Simplicidad/YAGNI**: los N golpes de Multi-Golpe se resuelven en el mismo tick de impacto, sin sub-reloj nuevo (plan de `specs/016` origen ya documentó esta simplificación como aceptable) — cumple.

## Project Structure

### Documentation (this feature)

```text
specs/016-multigolpe-critico/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
└── engine/
    ├── types.ts      # AttackType += 'MultiHit'|'Critical'; BattleUnit += hitsPerSequence?/criticalChance?/multiHitProgress?
    ├── combat.ts      # resolveEngagement/resolveAreaEngagement/resolveBaseDamage += multiHit (repite el impacto N veces) y critical (duplica con probabilidad, vía RNG inyectado)
    └── simulation.ts   # findTargetsInRange sin cambios (MultiHit/Critical no alteran selección de objetivo, solo daño); resetea multiHitProgress al cambiar de objetivo
```

**Structure Decision**: extensión aditiva de los mismos módulos ya centrales de `src/engine/combat.ts`/`types.ts` — sin archivos nuevos.

## Key Design Decisions

1. **RNG inyectado como parámetro con default**: `resolveEngagement(a, b, deltaSeconds, random: () => number = Math.random)` — producción usa `Math.random` implícito, tests pasan una función sembrada (ej. generador lineal congruencial simple con semilla fija), sin añadir una dependencia externa de RNG.
2. **Multi-Golpe resuelto como bucle dentro del mismo impacto**: cuando el cooldown de una unidad `MultiHit` vence, `combat.ts` aplica `hitsPerSequence` reducciones de `hp` sucesivas sobre el mismo `defender` en la misma llamada — más simple que modelar sub-cooldowns, y ya cumple FR-003 (N impactos "durante una secuencia", sin exigir que estén separados en el tiempo real).
3. **Interrupción de Multi-Golpe es un no-evento, no un estado a limpiar**: como el bucle de N golpes ocurre atómicamente dentro de un solo tick (Decisión 2), "interrumpido a mitad de secuencia" (US2) solo puede ocurrir si el objetivo muere a mitad del bucle — el bucle se detiene en cuanto `target.hp <= 0`, y el resto de golpes de esa invocación simplemente no se ejecutan (no hay estado `multiHitProgress` que limpiar entre ticks para este caso). `multiHitProgress` en `BattleUnit` queda reservado para test/observabilidad y para una futura spec que reparta los golpes en varios ticks, pero no es necesario para satisfacer FR-004/FR-005 con esta resolución atómica.
4. **Crítico se aplica al final de la cadena de multiplicadores**: `combat.ts` calcula `baseDamage * resolveAbilityMultiplier * resolveResistanceMultiplier` (specs/015) y luego, si `random() < criticalChance`, lo duplica — un único punto de aplicación, sin reordenar los cálculos ya existentes.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
