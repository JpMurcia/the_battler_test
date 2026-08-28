# Implementation Plan: Talentos y Orbes

**Branch**: `036-talentos-orbes` | **Date**: 2026-08-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/036-talentos-orbes/spec.md`

## Summary

Sistema de mejora por gato individual, disponible solo para gatos poseídos en Forma Verdadera de rareza Megarraro o Legendario, con 3 pistas de inversión (Resistencia a Debuff, Aumento de Estadísticas, Orbe) pagadas con `npCurrency` (NP) — moneda existente desde `specs/024-sistema-gacha` sin ningún sumidero hasta ahora. Los 3 bonos se resuelven íntegramente en `deployUnit()` (`src/state/useGameStore.ts`), reutilizando campos de `BattleUnit` ya soportados por el motor (`resistantTo`, `abilities`, `hp`/`damage` numéricos) — sin ningún cambio en `src/engine/`. La UI vive como una nueva sección dentro de `UnitDetailPanel.tsx`, ya compartido entre `TeamScreen` y `LibraryPanel`/`CatGuideScreen` desde `specs/030`.

## Technical Context

**Language/Version**: TypeScript 5, React 19

**Primary Dependencies**: Zustand (estado), Dexie (persistencia IndexedDB), Vitest + Testing Library (tests)

**Storage**: IndexedDB vía Dexie — campo opcional nuevo en la tabla `ownedCats` ya existente (sin nueva tabla, sin bump de versión)

**Testing**: Vitest (`tests/unit/`) — mismo patrón TDD que specs anteriores del backlog

**Target Platform**: Navegador web (SPA, sin backend)

**Project Type**: Single-project web app (`battle-cats-web/`)

**Performance Goals**: N/A — mismo perfil de rendimiento que el resto del Hub (interacciones discretas, sin bucle de simulación)

**Constraints**: Cero cambios en `src/engine/` (Constitución § VI); estado persistido por gato individual, no global

**Scale/Scope**: 1 componente de UI nuevo (sección dentro de `UnitDetailPanel.tsx`), 1 módulo de datos nuevo (`src/data/talents.ts`), extensión de `useMetaStore`/`OwnedCatRow`, extensión puntual de `deployUnit()`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Combate Automático por Despliegue**: sin cambios — los bonos de Talentos modifican los valores de entrada de una unidad ya desplegada (HP/Daño/resistencias/habilidades), nunca la lógica de colisión o combate en sí. PASA.
- **II. Progresión por Niveles**: no aplica — esta spec no toca desbloqueo de niveles. PASA (N/A).
- **III. Identidad Visual Animada**: no aplica — no se introduce ningún gato ni sprite nuevo. PASA (N/A).
- **IV. Balance Dirigido por Datos**: los multiplicadores/costos de Talentos (porcentaje por punto, costo por punto, máximo de puntos) viven en `src/data/talents.ts`, nunca hardcodeados en `src/engine/` ni en componentes. PASA.
- **V. Persistencia Local-First**: el estado de talentos por gato se persiste de inmediato en Dexie (`db.ownedCats`) en cada inversión, sin paso de "guardar" separado — mismo patrón que `plusLevel`/`evolutionStage`. PASA.
- **VI. Separación Estricta Motor/UI**: cero cambios en `src/engine/`; todos los bonos se resuelven como campos de `BattleUnit` ya soportados, añadidos en `deployUnit()` antes de que la unidad entre a la simulación — mismo patrón que `specs/010`/`specs/017`/`specs/031`/`specs/035`. PASA.
- **VII. Simplicidad desde el MVP**: sin mecanismo de reinicio/respec, sin niveles de "orbe físico" distintos, sin nueva tabla Dexie — ver Assumptions de `spec.md`. PASA.

Sin violaciones — no se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/036-talentos-orbes/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── data/
│   └── talents.ts                    # NUEVO — catálogo de costos/multiplicadores, funciones puras
├── db/
│   └── index.ts                      # MODIFICADO — OwnedCatRow gana `talents?: CatTalents`
├── state/
│   ├── useMetaStore.ts               # MODIFICADO — OwnedCatMeta.talents, acciones investXTalent
│   └── useGameStore.ts               # MODIFICADO — deployUnit() aplica los 3 bonos
└── screens/
    └── shared/
        └── UnitDetailPanel.tsx       # MODIFICADO — nueva sección "Talentos"

tests/unit/
├── data/
│   └── talents.test.ts               # NUEVO
├── useMetaStore.test.ts              # MODIFICADO
├── useGameStore.test.ts              # MODIFICADO
└── shared/
    └── UnitDetailPanel.test.tsx      # MODIFICADO
```

**Structure Decision**: Single-project (`battle-cats-web/`, ya establecido). Mismo patrón de archivos que `specs/031`/`specs/035`: un módulo de datos puro nuevo, extensión de los 2 stores existentes, extensión de un componente de UI ya existente (sin panel nuevo en el Hub — a diferencia de Misiones/Gamatoto/Ototo, Talentos es una propiedad *por gato*, no una pantalla de sistema global, por lo que su lugar natural es la ficha de detalle de unidad ya construida en `specs/030`).

## Complexity Tracking

*Sin violaciones — sección omitida.*
