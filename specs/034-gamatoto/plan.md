# Implementation Plan: Gamatoto

**Branch**: `034-gamatoto` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

## Summary

Catálogo puro `src/data/gamatoto.ts` (3 duraciones, funciones de progreso con `nowMs` inyectado) + estado de expedición/materiales en `useMetaStore` (tabla Dexie nueva, v14) + panel `GamatotoPanel` en el stack de paneles del Hub (`PanelId` += `'Gamatoto'`) con countdown en vivo (mismo patrón que `specs/029`/`specs/032`). Sin cambios a `src/engine/`.

## Technical Context

**Language/Version**: TypeScript 5.x · **Dependencies**: React 19, Zustand, Dexie · **Storage**: Dexie — tabla `gamatoto` nueva (v14) · **Testing**: Vitest — `gamatoto.ts` puro (`nowMs` inyectado); `useMetaStore` con `fake-indexeddb`; `HubScreen`/`GamatotoPanel` con Testing Library + `vi.useFakeTimers()` · **Target**: Navegador web · **Project Type**: Single project · **Performance**: N/A · **Constraints**: FR-003 (progreso derivado de timestamp real, nunca de un contador que se desincroniza) · **Scope**: 1 módulo de datos, 1 panel, sin instrumentación de batalla (a diferencia de `specs/033`).

## Constitution Check

| Principio | Evaluación |
|---|---|
| I-III | Sin cambios de combate/progresión/identidad visual. ✅ |
| IV. Balance Dirigido por Datos | Catálogo de 3 duraciones en `src/data/gamatoto.ts`. ✅ |
| V. Persistencia Local-First | Tabla Dexie nueva, mismo patrón singleton ya usado 10 veces; el "avance con app cerrada" se deriva de un timestamp persistido, sin ningún proceso en segundo plano fuera del navegador (sigue siendo 100% local, sin servidor). ✅ |
| VI. Separación Motor/UI | `src/engine/` no se toca — Gamatoto es meta-progresión de Hub, sin relación con la simulación de combate. ✅ |
| VII. Simplicidad | 1 solo slot de expedición (spec.md Assumptions), sin sistema de ingenieros (diferido a `specs/035`). ✅ |

Sin violaciones.

## Project Structure

```text
specs/034-gamatoto/
├── plan.md / research.md / data-model.md / quickstart.md / tasks.md

src/
├── data/
│   └── gamatoto.ts              # NUEVO — GamatotoExpeditionOption, GAMATOTO_EXPEDITION_OPTIONS, getExpeditionRemainingMs, isExpeditionReady
├── db/index.ts                   # + GamatotoRow, tabla gamatoto, versión 14
├── state/
│   └── useMetaStore.ts           # + gamatotoExpedition, gamatotoMaterials, startGamatotoExpedition(), claimGamatotoExpedition()
├── screens/
│   ├── HubScreen.tsx             # + botón "Gamatoto" con badge, + case 'Gamatoto' en el panel stack
│   └── GamatotoPanel.tsx         # NUEVO — envío/countdown/reclamo
├── types/screen.ts               # PanelId += 'Gamatoto'

tests/unit/
├── data/
│   └── gamatoto.test.ts             # NUEVO — funciones puras
├── useMetaStore.test.ts              # + startGamatotoExpedition/claimGamatotoExpedition/persistencia
├── HubScreen.test.tsx                # + botón Gamatoto + badge
└── GamatotoPanel.test.tsx            # NUEVO — envío, countdown, reclamo
```

**Structure Decision**: Extiende el single-project existente — mismo patrón que `specs/033` (módulo de datos + tabla Dexie + panel del Hub), sin instrumentación de batalla esta vez.

## Complexity Tracking

*Sin violaciones — sección no aplica.*
