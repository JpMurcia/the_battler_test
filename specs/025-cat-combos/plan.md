# Implementation Plan: Cat Combos

**Branch**: `025-cat-combos` | **Date**: 2026-08-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/025-cat-combos/spec.md`

## Summary

Añadir `src/data/catCombos.ts` con un catálogo fijo de Cat Combos (`CatCombo[]`, cada uno un conjunto de `memberCatIds` + una `CatComboBonus` que reutiliza el mismo esquema `type`/`value` que `TreasureSetPassiveBonus`, `specs/013`) y una función pura `getCompletedCombos(catIds: string[]): CatCombo[]` para detectar cuáles están satisfechos por un conjunto dado de catIds. Se definen 2 combos fixture: `combo-nucleo-original` (`basic-cat` + `tank-cat`, los únicos dos gatos `Normal` del catálogo → `EnergyRegenMultiplier`) y `combo-especialistas-control` (`weaken-cat` + `slow-cat` → `CurrencyRewardMultiplier`), de tipos de bonus distintos para poder verificar la Historia 3 (combos simultáneos) sin ambigüedad de apilamiento. `useMetaStore` gana una función derivada nueva, `getActiveComboBonusMultiplier(type)`, que llama a `getCompletedCombos(activeTeamCatIds)` en el momento de la consulta — sin ningún campo persistido nuevo, a diferencia de los sets de tesoros (que si guardan `grantedTreasureSetIds`). `useGameStore.startLevel` y `BattleScreen.tsx` multiplican esta nueva función junto a `getActiveBonusMultiplier` ya existente en sus mismos puntos de cálculo (FR-008: se combinan, no se excluyen). `TeamScreen.tsx` gana una sección nueva que llama a `getCompletedCombos`/una función hermana de estado por miembro directamente sobre `selectedIds` (el estado local de la pantalla, antes de "Confirmar equipo"), para que la Historia 2 (visibilidad, incluida la actualización en vivo del Acceptance Scenario 4) no dependa de guardar la formación primero.

## Technical Context

**Language/Version**: TypeScript (proyecto existente, `tsc -b` vía Vite)

**Primary Dependencies**: Ninguna nueva — React 19 (sección nueva dentro de `TeamScreen.tsx`, ya existente), Zustand (`useMetaStore`, 1 función derivada nueva, sin store nuevo)

**Storage**: Ninguna nueva — el estado de combo es 100% derivado de `activeTeamCatIds`, ya persistido por `specs/006`; esta spec no agrega tablas ni campos a `src/db/index.ts` (a diferencia de `specs/013`/`specs/024`)

**Testing**: Vitest (patrón ya usado en `tests/unit/data/`); `getCompletedCombos` testeado como función pura con distintos conjuntos de catIds, sin necesidad de store ni componente

**Target Platform**: Navegador web (100% frontend, sin backend), mismo alcance que el resto del proyecto

**Project Type**: Web app single-project (SPA) — no aplica estructura backend/frontend separada

**Performance Goals**: Sin objetivo nuevo — `getCompletedCombos` es una función pura de complejidad O(combos × miembros) sobre un catálogo de tamaño fijo pequeño, invocada solo al iniciar batalla y al renderizar `TeamScreen`, nunca dentro del tick de 60fps del combate

**Constraints**: Sin dependencias npm nuevas; ningún combo puede definirse sobre un catId inexistente (FR-010); el bonus de un combo activo DEBE combinarse (multiplicarse) con cualquier bonus de set de tesoros del mismo tipo, nunca excluirlo (FR-008); el estado de combo NO DEBE persistirse como progreso de cuenta (FR-009)

**Scale/Scope**: 1 archivo de datos nuevo (`src/data/catCombos.ts`, 2 `CatCombo` fixture), 1 función derivada nueva en `useMetaStore.ts` (sin campo de estado nuevo), 2 puntos de lectura modificados (`useGameStore.startLevel`, `BattleScreen.tsx`) para multiplicar el nuevo factor, 1 sección nueva en `TeamScreen.tsx`; cero cambios en `src/db/index.ts`, cero cambios en `src/engine/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Combate Automático por Despliegue | ✅ Cumple sin cambios — un Cat Combo activo solo escala un multiplicador ya leído una vez al iniciar la batalla (energía) o al sumar recompensa (moneda); el despliegue, cooldown y combate de cada unidad no cambian. |
| II. Progresión por Niveles con Desbloqueo Secuencial | ✅ No aplica — Cat Combos no toca desbloqueo ni orden de niveles. |
| III. Identidad Visual Animada | ✅ No aplica — ningún gato nuevo se crea; los combos se definen sobre `catId` ya existentes, cada uno con su animación idle/ataque ya provista desde su propia spec. |
| IV. Balance Dirigido por Datos | ✅ Cumple — combos, miembros y bonus viven en `src/data/catCombos.ts`; `getCompletedCombos` es una función pura sobre esos datos; `src/engine/` no cambia. |
| V. Persistencia Local-First, Sin Backend | ✅ Cumple, y de forma más estricta que `specs/013`: el estado de combo no se persiste en absoluto (FR-009) — se deriva en el momento de `activeTeamCatIds`, ya persistido por `specs/006`; cero tablas/campos Dexie nuevos. |
| VI. Separación Estricta entre Motor y UI | ✅ Cumple — toda la lógica nueva vive en `src/data/` y `src/state/useMetaStore.ts` (fuera de React/Pixi salvo la sección de presentación en `TeamScreen.tsx`); `src/engine/`, `BattleStage`/`UnitSprite` no cambian su contrato. |
| VII. Simplicidad desde el MVP | ✅ Cumple sin excepción — a diferencia de `specs/024`, esta spec no introduce ninguna economía, moneda ni tabla nueva; reutiliza el esquema de bonus ya existente (`TreasureSetPassiveBonus`) y sus mismos puntos de lectura, con la superficie mínima que `spec.md` permite (2 combos, sin persistencia nueva). |

Sin violaciones — no aplica Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/025-cat-combos/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

Sin `contracts/` — proyecto 100% frontend sin API externa que documentar (mismo criterio ya aplicado en `specs/022`/`specs/023`/`specs/024`).

### Source Code (repository root)

```text
src/
├── data/
│   └── catCombos.ts        # NUEVO — CatCombo, CatComboBonus (mismo esquema type/value que TreasureSetPassiveBonus),
│                            #         CAT_COMBOS fixture (2 combos), getCompletedCombos(catIds) (data-model.md)
├── state/
│   └── useMetaStore.ts     # MODIFICADO — getActiveComboBonusMultiplier(type): deriva de activeTeamCatIds vía
│                            #              getCompletedCombos, sin campo de estado ni escritura a Dexie nueva
├── screens/
│   └── TeamScreen.tsx      # MODIFICADO — sección nueva "Cat Combos" sobre `selectedIds` local (estado por miembro,
│                            #              FR-006/FR-007), independiente de "Confirmar equipo"
└── game/ (sin cambios)      # src/engine/, BattleStage.tsx, UnitSprite.tsx no se tocan

# Puntos de lectura modificados (multiplican el nuevo factor junto al ya existente de tesoros):
src/state/useGameStore.ts    # startLevel(): energyRegenPerSecond *= getActiveComboBonusMultiplier('EnergyRegenMultiplier')
src/screens/BattleScreen.tsx # addCurrency(...): *= getActiveComboBonusMultiplier('CurrencyRewardMultiplier')

tests/unit/
├── data/
│   └── catCombos.test.ts   # NUEVO — getCompletedCombos con distintos conjuntos de catIds (completo/incompleto/
│                            #         parcial/miembro compartido entre 2 combos), FR-010 (todo memberCatId existe en CATS)
├── useMetaStore.test.ts    # MODIFICADO — getActiveComboBonusMultiplier: 0/1/2 combos activos, no persiste nada
├── useGameStore.test.ts    # MODIFICADO — startLevel aplica el multiplicador de combo combinado con el de tesoros
├── BattleScreen.test.tsx   # MODIFICADO — recompensa de moneda escalada por combo activo
└── TeamScreen.test.tsx     # MODIFICADO — sección de combos visible, estado completo/incompleto, distinción
                             #              no-poseído vs no-en-formación, actualización en vivo al togglear un checkbox
```

**Structure Decision**: Proyecto único (SPA de React + Pixi.js ya existente) — no aplica ninguna variante backend/frontend ni mobile. Todo el trabajo entra dentro de las carpetas ya establecidas (`src/data/`, `src/state/`, `src/screens/`, `tests/unit/`); no se crean carpetas de nivel superior nuevas, no se toca `src/db/index.ts` ni `src/engine/`.

## Complexity Tracking

Sin violaciones que justificar — ver Constitution Check arriba.
