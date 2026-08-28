# Implementation Plan: Festival de Tesoros

**Branch**: `032-festival-de-tesoros` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

## Summary

Catálogo puro `src/data/treasureFestival.ts` (ventanas de tiempo, mismo tipo `EventTimeWindow` que `specs/014`) + banner con countdown en `LevelSelectScreen` (mismo patrón que `EnergyRegenTimer`, `specs/029`) + 4º factor multiplicativo en la moneda de victoria de `BattleOutcomeWatcher`. Sin persistencia nueva, sin cambios a `src/engine/`.

## Technical Context

**Language/Version**: TypeScript 5.x · **Dependencies**: React 19, Zustand (sin cambio) · **Storage**: N/A (dato estático, sin persistencia) · **Testing**: Vitest — `treasureFestival.ts` puro (con `nowMs` inyectado, sin `Date.now()` interno en la lógica testeada), `LevelSelectScreen`/`BattleScreen` con Testing Library y `vi.useFakeTimers()` · **Target**: Navegador web · **Project Type**: Single project · **Performance**: N/A (sin ruta de 60fps) · **Constraints**: FR-006 — sin festival activo, cero regresión · **Scope**: 1 módulo de datos, 1 componente de banner, 1 línea de multiplicador adicional.

## Constitution Check

| Principio | Evaluación |
|---|---|
| I-III | Sin cambios de combate/progresión/identidad visual. ✅ |
| IV. Balance Dirigido por Datos | Catálogo puro en `src/data/`, sin valores hardcodeados en componentes. ✅ |
| V. Persistencia Local-First | Sin persistencia nueva — el festival es 100% derivado de `Date.now()` + catálogo estático. ✅ |
| VI. Separación Motor/UI | `src/engine/` no se toca; el multiplicador se resuelve en `BattleScreen.tsx`, no en `stepSimulation`. ✅ |
| VII. Simplicidad | Efecto adaptado a un único multiplicador reutilizando el patrón ya existente (research.md Decisión 2), sin programador recurrente genérico (spec.md Assumptions). ✅ |

Sin violaciones.

## Project Structure

```text
specs/032-festival-de-tesoros/
├── plan.md / research.md / data-model.md / quickstart.md / tasks.md

src/
├── data/
│   └── treasureFestival.ts     # NUEVO — TreasureFestival, TREASURE_FESTIVALS, getActiveTreasureFestival, getFestivalTimeRemainingMs
├── screens/
│   ├── LevelSelectScreen.tsx   # + TreasureFestivalBanner
│   └── BattleScreen.tsx        # BattleOutcomeWatcher + 4º factor de moneda

tests/unit/
├── data/
│   └── treasureFestival.test.ts    # NUEVO
├── LevelSelectScreen.test.tsx       # + banner con countdown
└── BattleScreen.test.tsx            # + 4º factor de moneda
```

**Structure Decision**: Extiende el single-project existente — un módulo de datos nuevo, sin pantallas ni stores nuevos.

## Complexity Tracking

*Sin violaciones — sección no aplica.*
