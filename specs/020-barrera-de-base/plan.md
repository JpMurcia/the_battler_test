# Implementation Plan: Barrera de Base y Jefes Vinculados

**Branch**: `020-barrera-de-base` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/020-barrera-de-base/spec.md`

## Summary

Añade `bossCatId` a `SagaArc` (`specs/012`) y una comprobación en `stepSimulation` que impide aplicar daño a `enemyBase` mientras exista una `BattleUnit` enemiga viva con ese `catId` — estado 100% derivado en cada tick, sin ningún campo persistido nuevo.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: N/A — sin persistencia (FR-009).

**Testing**: Vitest — `tests/unit/engine/simulation.test.ts`, extendido.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio.

**Constraints**: `bossBarrierActive` se recalcula cada tick a partir de `units` — nunca se guarda como campo mutable independiente que pudiera desincronizarse del estado real de `units`.

**Scale/Scope**: extensión de `data/sagaArcs.ts` (`specs/012`), `engine/simulation.ts`, `screens/BattleScreen.tsx`.

## Constitution Check

- **§ V Persistencia Local-First**: cero datos nuevos persistidos (FR-009) — cumple trivialmente.
- **§ VI Separación Motor/UI**: `bossBarrierActive` se calcula dentro de `stepSimulation` (motor puro); `BattleScreen` solo lo lee de `useGameStore` para mostrar el indicador visual — cumple.
- **§ VII Simplicidad/YAGNI**: un único `bossCatId` por arco, sin sistema de "múltiples jefes" — cumple, alcance explícitamente acotado en spec.md Assumptions.

## Project Structure

### Documentation (this feature)

```text
specs/020-barrera-de-base/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/sagaArcs.ts        # SagaArc += bossCatId? (junto a bossLevelId ya existente de specs/012)
├── engine/simulation.ts     # SimState += bossBarrierActive: boolean (derivado, recalculado cada tick); resolveBaseDamage hacia enemyBase se omite mientras esté activo
└── screens/BattleScreen.tsx  # EnemyBaseReadout += indicador de barrera activa/retirada
```

**Structure Decision**: extensión mínima de `specs/012` (un campo más en `SagaArc`) y de `stepSimulation`; sin pantallas nuevas.

## Key Design Decisions

1. **`bossBarrierActive` recalculado cada tick, nunca escrito directamente**: al inicio de cada `stepSimulation`, si `state.levelId` es el `bossLevelId` de algún `SagaArc` con `bossCatId` configurado, se evalúa `alive.some(u => u.team === 'Enemy' && u.catId === bossCatId)` — el resultado determina si el paso de daño hacia `enemyBase` en `baseAttackers` se omite ese tick (FR-002/FR-003). No hay un booleano que "apagar" manualmente: se deriva de `units` en cada paso, por lo que retirar la barrera al derrotar al jefe es automático (el jefe ya no está en `units` la próxima vez que se evalúa).
2. **Resolución dentro del bucle de `baseAttackers` existente**: en vez de una fase nueva, `stepSimulation` filtra `baseAttackers` de equipo `Player` contra `enemyBase` cuando `bossBarrierActive` es `true` — la unidad sigue "atacando" la base (mismo estado, sin quedar libre para moverse) pero `resolveBaseDamage` no se invoca para ese objetivo ese tick, o se invoca con daño forzado a 0; se decide la opción más simple sin romper el resto del flujo al implementar.
3. **`bossCatId` en `SagaArc`, no en `Level`**: dado que `bossLevelId` ya vive en `SagaArc` (`specs/012` Key Entities), `bossCatId` lo acompaña en la misma entidad — evita que un `Level` reutilizado en dos arcos distintos (fuera de alcance actual, pero ya posible estructuralmente) tenga ambigüedad sobre a qué arco pertenece su jefe.
4. **Indicador visual mínimo**: `BattleScreen`'s `EnemyBaseReadout` lee `useGameStore((s) => s.bossBarrierActive)` (expuesto en `GameFields` junto al resto del estado ya leído por selectores) y antepone un indicador de texto ("🛡") cuando está activo — sin nueva librería de UI ni animación, consistente con el resto de `BattleScreen` (HTML/CSS plano superpuesto al canvas de Pixi).

## Complexity Tracking

*Sin violaciones — tabla omitida.*
