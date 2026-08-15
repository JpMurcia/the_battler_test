# Implementation Plan: Clasificación de Gatos/Enemigos y Habilidades Avanzadas

**Branch**: `009-clasificacion-habilidades` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-clasificacion-habilidades/spec.md`

## Summary

Extender `Cat`/`BattleUnit` con clasificación (estándar + especial opcional), un catálogo mínimo de `Ability` (trait-targeting/neutral, como multiplicador de daño), inmunidades y el efecto `Curse` (deshabilita habilidades mientras dura). Todo el cálculo vive en `src/engine/combat.ts`, sobre la base ya generalizada por `specs/008-tipos-de-ataque`.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: N/A — contenido en `src/data/cats.ts`; `curseRemainingSeconds` es estado efímero de `BattleUnit`, igual que `attackCooldownRemaining` (nunca persistido, Constitución § V).

**Testing**: Vitest sobre `src/engine/combat.ts`.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio respecto a `specs/008-tipos-de-ataque` — la resolución de multiplicador es O(1) por unidad (búsqueda lineal sobre `abilities`, típicamente 0-2 elementos).

**Constraints**: la resolución de daño sigue siendo pura y determinista; `curseRemainingSeconds` decrece en `stepSimulation` igual que `attackCooldownRemaining`.

**Scale/Scope**: extensión de `types.ts`, `combat.ts`, `simulation.ts`, `data/cats.ts`.

## Constitution Check

- **§ IV Balance Dirigido por Datos**: `classification`/`abilities`/`immuneEffects`/`appliesEffect` viven en `src/data/cats.ts` — cumple.
- **§ V Persistencia Local-First**: `curseRemainingSeconds` es estado de batalla efímero (como el resto de `BattleUnit`), nunca persiste — cumple.
- **§ VI Separación Motor/UI**: multiplicador y Curse se resuelven íntegramente en `src/engine/`; `src/game/` no necesita saber de clasificación para renderizar — cumple.
- **§ VII Simplicidad/YAGNI**: un solo efecto (`Curse`), sin sistema de efectos genérico extensible por ahora, sin apilamiento de multiplicadores — cumple, ver Complexity Tracking por el sistema de habilidades en sí.

## Project Structure

### Documentation (this feature)

```text
specs/009-clasificacion-habilidades/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/cats.ts     # Cat += classification, specialClassification?, abilities?, immuneEffects?, appliesEffect?
├── engine/
│   ├── types.ts      # BattleUnit += los mismos campos + curseRemainingSeconds: number (runtime)
│   └── combat.ts      # + resolveAbilityMultiplier(attacker, defender): number
│                       # resolveEngagement/resolveAreaEngagement (de specs/008) aplican el multiplicador
│                       #   al damage base antes de restar hp, y decrementan curseRemainingSeconds
└── engine/simulation.ts  # aplica appliesEffect del atacante al defensor en cada golpe exitoso (si no inmune)
```

**Key Design Decision** (embebido, equivalente a research.md):

1. **`resolveAbilityMultiplier(attacker, defender)`**: recorre `attacker.abilities ?? []`; si `attacker.curseRemainingSeconds > 0`, devuelve `1` sin evaluar nada (FR-009); si no, devuelve el `damageMultiplier` de la primera `Ability` que coincida (`Neutral` siempre; `TraitTargeting` si `defender.classification`/`defender.specialClassification` ∈ `targetClassifications`), o `1` si ninguna coincide.
2. **Aplicación de Curse**: en el mismo punto donde `resolveEngagement`/`resolveAreaEngagement` aplican daño, si `attacker.appliesEffect?.type === 'Curse'` y `!defender.immuneEffects?.includes('Curse')`, se fija `defender.curseRemainingSeconds = appliesEffect.durationSeconds` (se refresca, no se acumula, en cada golpe exitoso).
3. **Decaimiento**: `curseRemainingSeconds` decrece por `deltaSeconds` en el mismo punto que `attackCooldownRemaining`, con piso en 0.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| `src/engine/combat.ts` gana un sistema de habilidades condicionales (`resolveAbilityMultiplier`) y un efecto de estado (`Curse`) | Es el requisito central de `specs/009` (FR-005 a FR-010) — sin esto, clasificación (`specs/009` Historia 1) no tendría ningún efecto de combate observable | Resolverlo fuera de `src/engine/` (p. ej. en `src/game/`) violaría Constitución § VI: el daño real debe decidirse en el motor puro, no en la capa de render |
