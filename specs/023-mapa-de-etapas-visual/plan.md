# Implementation Plan: Mapa Visual de Etapas, Catálogo Completo de Gatos y Grilla de Despliegue

**Branch**: `023-mapa-de-etapas-visual` | **Date**: 2026-08-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/023-mapa-de-etapas-visual/spec.md`

## Summary

Reconstruir `LevelSelectScreen` como un mapa visual de nodos (React puro + SVG de líneas conectoras, sin Pixi.js) que reutiliza sin modificar toda la lógica ya existente de desbloqueo/energía/inicio de batalla (`getLevelState`, `spendMissionEnergy`, `consumeSelectedBattleItems`, `startLevel`), añadiendo un campo obligatorio `Level.mapPosition` para posicionar cada nodo. Cerrar la brecha de contenido de 13 `catId` jugables sin camino de obtención otorgándolos vía `SagaArc.completionRewards.unlockCatIds` (`specs/012`, ya implementado), repartidos entre `arco-1`/`arco-2`. Convertir `DeployBar` de un `flex` con scroll a una grilla fija de 6 columnas, introduciendo `MAX_ACTIVE_TEAM_SIZE = 6` como tope de equipo activo aplicado en `setActiveTeam` y `TeamScreen`.

## Technical Context

**Language/Version**: TypeScript (proyecto existente, `tsc -b` vía Vite)

**Primary Dependencies**: React 19 (el mapa es una pantalla de navegación más — React puro + CSS/SVG, igual que las 6 pantallas ya existentes; sin Pixi.js, ver research.md Decisión 1), Zustand (`useMetaStore`/`useGameStore`, sin store nuevo), Dexie sobre IndexedDB (persistencia ya existente, sin tabla nueva)

**Storage**: IndexedDB local vía Dexie — sin cambios de esquema; los 13 `catId` otorgados usan `db.ownedCats`/`db.arcProgress` ya existentes (vía `addOwnedCat`/`claimArcRewardsIfComplete`), el tope de equipo usa `db.teamFormation` ya existente

**Testing**: Vitest + `@testing-library/react` (patrón ya usado en `tests/unit/`)

**Target Platform**: Navegador web (100% frontend, sin backend), mismo alcance que el resto del proyecto

**Project Type**: Web app single-project (SPA) — no aplica estructura backend/frontend separada

**Performance Goals**: Sin objetivo nuevo — el mapa es una pantalla estática por render (sin loop de 60fps), sujeta únicamente a la responsividad de interacción habitual de las demás pantallas

**Constraints**: Sin dependencias nuevas de npm; `Level.mapPosition` es un campo obligatorio (spec.md Edge Cases), lo que fuerza actualizar todo literal `Level`/`EventBanner.specialStage` existente en producción y en fixtures de test (research.md Decisión 4) — `npx tsc -b` es el gate de esa cobertura; no debe alterar ninguna recompensa ya otorgada por `arco-1`/`arco-2` antes de esta spec (FR-012); `DeployBar`/`TeamScreen` deben seguir funcionando para equipos guardados de sesiones anteriores a esta spec con más de 6 `catId` (FR-016)

**Scale/Scope**: Reescritura de `LevelSelectScreen.tsx` (1 pantalla), 3 archivos de datos modificados (`levels.ts`, `events.ts`, `sagaArcs.ts`), 1 constante + 1 guard nuevos en `useMetaStore.ts`, ajustes en `TeamScreen.tsx` y `DeployBar` (dentro de `BattleScreen.tsx`), reglas CSS nuevas/modificadas en `theme.css`; sin pantallas nuevas, sin tablas de Dexie nuevas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Combate Automático por Despliegue | ✅ Cumple sin cambios — el mapa es navegación previa a la batalla; el botón "¡Atacar!" invoca exactamente el mismo flujo (`spendMissionEnergy` → `consumeSelectedBattleItems` → `startLevel`) que hoy usa "Jugar" (FR-006), sin tocar `src/engine/`. `DeployBar` sigue llamando `deployUnit` sin cambios en su lógica de despliegue/cooldown, solo se le acota cuántos gatos puede mostrar. |
| II. Progresión por Niveles con Desbloqueo Secuencial | ✅ Cumple — `getLevelState` (`specs/005`) se reutiliza sin modificar (FR-003); `mapPosition` es puramente de presentación y no participa en ningún cálculo de desbloqueo. La fase especial de evento sigue fuera de la cadena secuencial (FR-008, ya garantizado por `specs/014`). |
| III. Identidad Visual Animada | ✅ No aplica — esta spec no introduce ningún gato ni enemigo nuevo (los 13 `catId` del catálogo ya existen y ya cumplen esta condición desde sus specs de origen); los nodos del mapa son UI de navegación, no unidades de combate. |
| IV. Balance Dirigido por Datos | ✅ Cumple — `mapPosition` vive en `src/data/levels.ts`/`events.ts`; el reparto de `catId` vive en `src/data/sagaArcs.ts`; `src/engine/` no cambia. `MAX_ACTIVE_TEAM_SIZE` es una regla de estado de jugador (no de balance de un gato/nivel individual) y se documenta su ubicación en `useMetaStore.ts` en research.md Decisión 3. |
| V. Persistencia Local-First, Sin Backend | ✅ Cumple — no se añade ninguna tabla de Dexie; los 13 `catId` se otorgan vía `addOwnedCat`/`claimArcRewardsIfComplete` (ya persisten a `db.ownedCats`/`db.arcProgress`); el tope de equipo usa `db.teamFormation` ya existente. |
| VI. Separación Estricta entre Motor y UI | ✅ Cumple — el mapa vive enteramente en `src/screens/LevelSelectScreen.tsx` (React + CSS/SVG), sin ninguna dependencia de Pixi.js (research.md Decisión 1); `src/engine/` y `BattleStage`/`UnitSprite` (capa Pixi) no cambian. |
| VII. Simplicidad desde el MVP | ✅ Cumple — no se agregan `sagaTabs` ni "Festival de Tesoros" del mockup (spec.md Assumptions, YAGNI); el reparto de los 13 `catId` reutiliza el mecanismo de recompensa ya existente en vez de crear uno nuevo (research.md Decisión 2); `MAX_ACTIVE_TEAM_SIZE` no justifica un archivo de datos nuevo (research.md Decisión 3). |

Sin violaciones — no se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/023-mapa-de-etapas-visual/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

Sin `contracts/` — proyecto 100% frontend sin API externa que documentar (mismo criterio ya aplicado en `specs/022-datos-semilla-flujo-navegacion/plan.md`).

### Source Code (repository root)

```text
src/
├── data/
│   ├── levels.ts             # MODIFICADO — Level.mapPosition (nuevo campo obligatorio) + valor en level-1/level-2/level-seed-demo
│   ├── events.ts              # MODIFICADO — EventBanner.specialStage requiere mapPosition (mismo tipo Level, sin cambio de forma)
│   ├── sagaArcs.ts            # MODIFICADO — completionRewards.unlockCatIds de arco-1/arco-2 reparte los 13 catId (data-model.md)
│   └── cats.ts                # sin cambios — los 13 catId ya existen en CATS
├── screens/
│   ├── LevelSelectScreen.tsx  # REESCRITO — de lista vertical a mapa de nodos SVG + panel de detalle; misma prop onNavigate, mismo handlePlay reutilizado
│   └── TeamScreen.tsx         # MODIFICADO — tope de selección MAX_ACTIVE_TEAM_SIZE en el checkbox de cada gato (US3/FR-015)
├── state/
│   └── useMetaStore.ts        # MODIFICADO — MAX_ACTIVE_TEAM_SIZE (nueva constante) + setActiveTeam rechaza selecciones > 6 (FR-015)
└── theme.css                  # MODIFICADO — .deploy-bar de flex a grid de 6 columnas (FR-014); clases nuevas .stage-map/.stage-node/.stage-node--*/.stage-detail-panel

# BattleScreen.tsx no se relocaliza — DeployBar sigue definido ahí (src/screens/BattleScreen.tsx:68-94),
# solo se le agrega el recorte a MAX_ACTIVE_TEAM_SIZE (FR-016) y las clases CSS de grilla.

tests/unit/
├── LevelSelectScreen.test.tsx  # REESCRITO — nodos/estados/panel de detalle/"¡Atacar!" en vez de lista de "Jugar"
├── data/
│   ├── levels.test.ts          # MODIFICADO — cubre Level.mapPosition
│   └── events.test.ts          # MODIFICADO — fixtures de specialStage requieren mapPosition
├── TeamScreen.test.tsx         # MODIFICADO — tope de selección a 6
├── useMetaStore.test.ts        # MODIFICADO — setActiveTeam rechaza > 6; claimArcRewardsIfComplete otorga los catId nuevos
└── BattleScreen.test.tsx       # MODIFICADO — DeployBar en grilla, recorte a 6 con equipo heredado > 6
```

**Structure Decision**: Proyecto único (SPA de React + Pixi.js ya existente) — no aplica ninguna variante backend/frontend ni mobile. Todo el trabajo entra dentro de las carpetas ya establecidas (`src/data/`, `src/screens/`, `src/state/`, `tests/unit/`); no se crean carpetas de nivel superior nuevas, y `LevelSelectScreen.tsx` se reescribe in-place en vez de convivir con una pantalla nueva (research.md Decisión 5).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — tabla omitida.
