# Implementation Plan: Tienda

**Branch**: `037-tienda` | **Date**: 2026-08-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/037-tienda/spec.md`

## Summary

Nueva pantalla del Hub ("Tienda") con 2 secciones que dan a `currency` (moneda principal) un sumidero directo sobre 2 entidades de progreso ya existentes sin vía de compra: Objetos de Batalla (`battleItemInventory`, specs/017) e Ítems de Evolución por gato (`evolutionItems`, specs/010) — este último sin ningún productor en el código antes de esta spec. Precios estáticos nuevos en `src/data/shop.ts`; 2 acciones nuevas en `useMetaStore` que reutilizan la persistencia ya existente de cada entidad (`db.battleItems`, `db.evolutionItems`, `db.playerProfile`), sin tabla Dexie nueva.

## Technical Context

**Language/Version**: TypeScript 5, React 19

**Primary Dependencies**: Zustand (estado), Dexie (persistencia IndexedDB), Vitest + Testing Library (tests)

**Storage**: IndexedDB vía Dexie — reutiliza `db.battleItems`, `db.evolutionItems`, `db.playerProfile` ya existentes, sin tabla ni bump de versión nuevos

**Testing**: Vitest (`tests/unit/`) — mismo patrón TDD que el resto del backlog

**Target Platform**: Navegador web (SPA, sin backend)

**Project Type**: Single-project web app (`battle-cats-web/`)

**Performance Goals**: N/A — interacciones discretas de Hub, sin bucle de simulación

**Constraints**: Cero cambios en `src/engine/`; sin pagos reales ni backend (Constitución § V) — precios en `currency`, nunca en dinero real

**Scale/Scope**: 1 módulo de datos nuevo (`src/data/shop.ts`), 1 panel de Hub nuevo (`ShopPanel.tsx`), 2 acciones nuevas en `useMetaStore`, 1 entrada nueva en `PanelId`/dock del Hub

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Combate Automático por Despliegue**: sin cambios — la Tienda no toca combate. PASA (N/A).
- **II. Progresión por Niveles**: sin cambios. PASA (N/A).
- **III. Identidad Visual Animada**: no aplica — sin gatos/sprites nuevos. PASA (N/A).
- **IV. Balance Dirigido por Datos**: precios en `src/data/shop.ts`, nunca hardcodeados en componentes ni en `src/engine/`. PASA.
- **V. Persistencia Local-First, Sin Backend**: esta es la razón de ser de la spec — el "Cat Food Shop" real (pagos con dinero real) queda explícitamente excluido; la Tienda solo gasta `currency` ya local, persistida de inmediato en cada compra. PASA.
- **VI. Separación Estricta Motor/UI**: cero cambios en `src/engine/`. PASA.
- **VII. Simplicidad desde el MVP**: precios fijos sin escalado, sin rotación ni stock limitado, sin tabla Dexie nueva — ver Assumptions de `spec.md`. PASA.

Sin violaciones — no se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/037-tienda/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/
│   └── shop.ts                # NUEVO — precios estáticos, funciones puras
├── state/
│   └── useMetaStore.ts        # MODIFICADO — purchaseBattleItem, purchaseEvolutionItem
├── screens/
│   ├── ShopPanel.tsx           # NUEVO
│   └── HubScreen.tsx           # MODIFICADO — PanelId 'Shop', botón de dock, case en el switch
└── types/
    └── screen.ts               # MODIFICADO — 'Shop' en PanelId

tests/unit/
├── data/
│   └── shop.test.ts            # NUEVO
├── useMetaStore.test.ts        # MODIFICADO
├── ShopPanel.test.tsx          # NUEVO
└── HubScreen.test.tsx          # MODIFICADO
```

**Structure Decision**: Single-project (`battle-cats-web/`, ya establecido). Mismo patrón de archivos que `specs/033`/`specs/034`/`specs/035` (sistema de cuenta con su propio panel de Hub, a diferencia de `specs/036` que vivía dentro de la ficha de un gato) — la Tienda es un sistema global, no por-unidad, por lo que su lugar natural es un panel nuevo del dock.

## Complexity Tracking

*Sin violaciones — sección omitida.*
