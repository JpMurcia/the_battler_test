# Implementation Plan: Mejoras de Base

**Branch**: `031-mejoras-de-base` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/031-mejoras-de-base/spec.md`

## Summary

Nueva pestaña "Mejoras de Base" en `UpgradeScreen` con 7 mejoras de cuenta (catálogo puro en `src/data/baseUpgrades.ts`), persistidas en una tabla Dexie nueva (`baseUpgrades`, versión 12) y expuestas en `useMetaStore`. Los bonos se resuelven en `useGameStore.startLevel()`/`deployUnit()` y en `BattleOutcomeWatcher` (moneda de victoria), reutilizando el mismo patrón de "modificador de cuenta resuelto antes de entrar al motor" ya usado por `specs/012/013/017/025`.

## Technical Context

**Language/Version**: TypeScript 5.x

**Primary Dependencies**: React 19, Zustand, Dexie (sin cambio)

**Storage**: Dexie — nueva tabla `baseUpgrades` (versión 12, fila singleton `{ id: 1, levels: Record<BaseUpgradeId, number> }`)

**Testing**: Vitest — `baseUpgrades.ts` puro; `useMetaStore`/`useGameStore` con `fake-indexeddb`; `UpgradeScreen` con Testing Library

**Target Platform**: Navegador web

**Project Type**: Single project

**Performance Goals**: N/A — sin ruta de 60fps (los bonos se resuelven una vez en `startLevel`/`deployUnit`, no por tick)

**Constraints**: `src/engine/` no cambia (research.md Decisión 3); con las 7 mejoras en nivel 0, cero regresión (FR-012)

**Scale/Scope**: 7 mejoras, tope de nivel 10 cada una — sin paginación necesaria

## Constitution Check

| Principio | Evaluación |
|---|---|
| I-III | Sin cambios de reglas de combate/progresión/identidad visual — solo parámetros de entrada ya resueltos. ✅ |
| IV. Balance Dirigido por Datos | Catálogo completo en `src/data/baseUpgrades.ts`, sin valores hardcodeados en la UI ni en el motor. ✅ |
| V. Persistencia Local-First | Tabla Dexie nueva, mismo patrón singleton ya usado 8 veces en el proyecto. ✅ |
| VI. Separación Motor/UI | `src/engine/` no se toca — bonos resueltos en `useGameStore`/`useMetaStore` antes de simular (research.md Decisión 3). ✅ |
| VII. Simplicidad | 2 de las 9 mejoras del manual excluidas explícitamente por no tener mecánica existente (spec.md Assumptions); tope de nivel simplificado a un entero fijo, sin sistema "20+10". ✅ |

Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/031-mejoras-de-base/
├── plan.md / research.md / data-model.md / quickstart.md / tasks.md
```

### Source Code (repository root)

```text
src/
├── data/
│   └── baseUpgrades.ts        # NUEVO — BaseUpgradeId, BASE_UPGRADES, funciones de efecto puras
├── db/index.ts                 # + BaseUpgradesRow, tabla baseUpgrades, versión 12
├── state/
│   ├── useMetaStore.ts         # + baseUpgrades, upgradeBaseUpgrade(), getBaseUpgradeCurrencyMultiplier(), + bono de energía en hydrate/upgradeCat
│   └── useGameStore.ts         # startLevel()/deployUnit() aplican bonos de cañón/base/investigación
├── screens/
│   ├── UpgradeScreen.tsx       # + pestaña "Mejoras de Base"
│   └── BattleScreen.tsx        # BattleOutcomeWatcher aplica el 3er multiplicador de moneda

tests/unit/
├── data/
│   └── baseUpgrades.test.ts        # NUEVO — funciones de efecto puras
├── db.test.ts                       # + tabla baseUpgrades (si aplica, ver tasks.md)
├── useMetaStore.test.ts             # + upgradeBaseUpgrade, getBaseUpgradeCurrencyMultiplier, bono de energía
├── useGameStore.test.ts             # + bonos de cañón/base/investigación en startLevel/deployUnit
├── UpgradeScreen.test.tsx           # + pestaña Mejoras de Base
└── BattleScreen.test.tsx            # + 3er multiplicador de moneda en victoria
```

**Structure Decision**: Extiende el single-project existente — un módulo de datos nuevo, una tabla Dexie nueva, sin pantallas ni stores nuevos (se integra en `UpgradeScreen`/`useMetaStore`/`useGameStore` ya existentes).

## Complexity Tracking

*Sin violaciones — sección no aplica.*
