# Implementation Plan: Filtro de Gatos y Panel de Detalle de Unidad

**Branch**: `030-filtro-detalle-unidad` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/030-filtro-detalle-unidad/spec.md`

## Summary

Añade un filtro (rareza/rasgo objetivo/habilidad, Y/O, orden por nivel) y un panel de detalle de unidad (stats completos + tabs de forma + botón de evolución, conectando `evolveCat()` ya existente y huérfano de UI) a `TeamScreen` y `CatGuideScreen`. Función de filtrado pura y nueva (`src/data/catFilter.ts`) + componente de panel compartido (`src/screens/shared/UnitDetailPanel.tsx`, reutilizando `PanelOverlay`). Ningún cambio a `src/engine/` ni a persistencia Dexie.

## Technical Context

**Language/Version**: TypeScript 5.x (sin cambio)

**Primary Dependencies**: React 19, Zustand, lucide-react (sin cambio)

**Storage**: N/A — ningún campo nuevo persistido; `evolveCat()`/`ownedCats` ya existen desde `specs/010`

**Testing**: Vitest + Testing Library — `catFilter.ts` testeado puro (sin canvas ni componentes); `UnitDetailPanel`/`TeamScreen`/`CatGuideScreen` con `render`/`fireEvent`

**Target Platform**: Navegador web (sin cambio)

**Project Type**: Single project (sin cambio de estructura)

**Performance Goals**: N/A — sin ruta de 60fps involucrada (pantallas de menú, no batalla)

**Constraints**: No debe cambiar el comportamiento de selección de equipo (FR-011) ni las reglas de `evolveCat()` ya validadas por `specs/010`

**Scale/Scope**: Roster actual de 34 gatos (`src/data/cats.ts`) — sin paginación, un `Array.filter` es suficiente

## Constitution Check

| Principio | Evaluación |
|---|---|
| I-III | No aplica — sin cambios de combate, progresión ni identidad visual. ✅ |
| IV. Balance Dirigido por Datos | El filtro lee campos ya existentes en `src/data/cats.ts`; DPS es derivado, no un dato nuevo (research.md Decisión 5). ✅ |
| V. Persistencia Local-First | Sin persistencia nueva — filtro es estado de sesión (research.md Decisión 1); evolución ya persiste vía `evolveCat()` existente. ✅ |
| VI. Separación Motor/UI | `catFilter.ts` es una función pura en `src/data/`, sin React ni Pixi — mismo patrón que el resto de `src/data/*`. ✅ |
| VII. Simplicidad | Se excluyeron explícitamente "Solo Formas Máximas" (no-op en este modelo de datos) e Inclusión de Talentos (sistema inexistente) — spec.md Assumptions. ✅ |

Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/030-filtro-detalle-unidad/
├── plan.md / research.md / data-model.md / quickstart.md / tasks.md
```

Sin `contracts/` (mismo criterio que `specs/029` y anteriores — app frontend sin interfaz externa).

### Source Code (repository root)

```text
src/
├── data/
│   └── catFilter.ts          # NUEVO — matchesCatFilter, CatFilterState, CatFilterAbility
├── screens/
│   ├── TeamScreen.tsx         # + control de filtro, + abrir UnitDetailPanel al tocar un gato
│   ├── CatGuideScreen.tsx     # + control de filtro, + abrir UnitDetailPanel al tocar un gato
│   └── shared/
│       └── UnitDetailPanel.tsx # NUEVO — stats + tabs de forma + botón de evolución

tests/unit/
├── data/
│   └── catFilter.test.ts          # NUEVO — función pura, 8 acceptance scenarios de US1
├── TeamScreen.test.tsx             # + filtro, + panel de detalle
├── CatGuideScreen.test.tsx         # + filtro, + panel de detalle
└── shared/
    └── UnitDetailPanel.test.tsx    # NUEVO — tabs de forma, botón de evolución (habilitado/deshabilitado/ausente)
```

**Structure Decision**: Extiende el single-project existente — un módulo de datos puro nuevo y un componente compartido nuevo bajo `screens/shared/` (ya existe ese directorio desde `specs/026`, con `PanelOverlay.tsx`).

## Complexity Tracking

*Sin violaciones — sección no aplica.*
