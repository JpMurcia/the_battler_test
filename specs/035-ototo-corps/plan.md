# Implementation Plan: Cuerpo Ototo

**Branch**: `035-ototo-corps` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

## Summary

Catálogo puro `src/data/ototoCorps.ts` (2 construcciones, mismo patrón timestamp que `specs/034`) + estado en `useMetaStore` (tabla Dexie nueva, v15) + panel `OtotoCorpsPanel` en el stack del Hub (`PanelId` += `'OtotoCorps'`) + `deployUnit()` extiende `abilities`/`resistantTo` del `BattleUnit` con los bonos activos, reutilizando `TraitResistance`/`resistantTo` de `specs/015`. Sin cambios a `src/engine/`. Primer consumidor de `gamatotoMaterials` (`specs/034`).

## Technical Context

**Language/Version**: TypeScript 5.x · **Dependencies**: React 19, Zustand, Dexie · **Storage**: Dexie — tabla `ototoCorps` nueva (v15) · **Testing**: Vitest — `ototoCorps.ts` puro; `useMetaStore`/`useGameStore` con `fake-indexeddb`; `HubScreen`/`OtotoCorpsPanel` con Testing Library + `vi.useFakeTimers()` · **Target**: Navegador web · **Project Type**: Single project · **Performance**: N/A · **Constraints**: FR-007 (sin construcciones, cero regresión en `deployUnit`) · **Scope**: 1 módulo de datos, 1 panel, 1 punto de instrumentación (`deployUnit`).

## Constitution Check

| Principio | Evaluación |
|---|---|
| I-III | Sin cambios de reglas de combate — solo datos de entrada adicionales ya soportados por el motor (`TraitResistance`/`resistantTo`, specs/015). ✅ |
| IV. Balance Dirigido por Datos | Catálogo en `src/data/ototoCorps.ts`, valores de bono como constantes nombradas. ✅ |
| V. Persistencia Local-First | Tabla Dexie nueva, mismo patrón singleton usado 11 veces. ✅ |
| VI. Separación Motor/UI | `src/engine/` no se toca — el bono se añade a `abilities`/`resistantTo` del `BattleUnit` en `deployUnit()` (research.md Decisión 3), campos que el motor ya interpreta desde specs/015. ✅ |
| VII. Simplicidad | Sin ingenieros ni cabezas de cañón (spec.md Assumptions); un nivel por construcción, no un sistema de niveles progresivos. ✅ |

Sin violaciones.

## Project Structure

```text
specs/035-ototo-corps/
├── plan.md / research.md / data-model.md / quickstart.md / tasks.md

src/
├── data/
│   └── ototoCorps.ts             # NUEVO — OtotoBuildingId, OTOTO_BUILDINGS, getConstructionRemainingMs, isConstructionReady, OTOTO_DAMAGE_REDUCTION, OTOTO_DEBUFF_RESISTANCE
├── db/index.ts                    # + OtotoCorpsRow, tabla ototoCorps, versión 15
├── state/
│   ├── useMetaStore.ts            # + ototoConstruction, ototoBuildings, startOtotoConstruction(), claimOtotoConstruction()
│   └── useGameStore.ts            # deployUnit() antepone TraitResistance/resistantTo de Ototo
├── screens/
│   ├── HubScreen.tsx              # + botón "Cuerpo Ototo", + case 'OtotoCorps' en el panel stack
│   └── OtotoCorpsPanel.tsx        # NUEVO — elegir construcción + objetivo, countdown, reclamo
├── types/screen.ts                # PanelId += 'OtotoCorps'

tests/unit/
├── data/
│   └── ototoCorps.test.ts             # NUEVO
├── useMetaStore.test.ts                # + startOtotoConstruction/claimOtotoConstruction/persistencia
├── useGameStore.test.ts                # + deployUnit aplica TraitResistance/resistantTo de Ototo
├── HubScreen.test.tsx                  # + botón Cuerpo Ototo
└── OtotoCorpsPanel.test.tsx            # NUEVO — elegir, construir, reclamar
```

**Structure Decision**: Extiende el single-project existente — mismo patrón que `specs/034` (módulo de datos + tabla Dexie + panel), más un punto de instrumentación en `deployUnit()` (mismo lugar que `specs/010`/`specs/017`/`specs/031` ya modifican).

## Complexity Tracking

*Sin violaciones — sección no aplica.*
