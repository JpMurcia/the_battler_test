# Implementation Plan: Pulido de Batalla y HUD

**Branch**: `029-pulido-batalla-hud` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/029-pulido-batalla-hud/spec.md`

## Summary

Conectar a la interfaz 5 mecánicas/datos que ya existen en `src/engine/`, `useGameStore.ts` y `missionEnergy.ts` pero hoy son inaccesibles o invisibles para el jugador: disparo del cañón especial con anillo de carga, control de velocidad x1/x2 + pausa, HP individual por unidad en batalla, temporizador de regeneración de energía en el Hub, y toggle de 1/2 filas en la barra de despliegue. Enfoque técnico: reutilizar los 2 patrones ya establecidos en el repo para exponer estado de simulación en UI — (a) selectores acotados de Zustand para chips de HUD fuera del canvas de Pixi (igual que `EnergyReadout`), y (b) `Graphics` redibujado imperativamente por `ref` dentro de un `useTick` ya existente para elementos dentro del canvas de Pixi (igual que `BaseTower`'s barra de HP de base). Ningún cambio a `src/engine/`, ningún dato nuevo en `src/data/`, ninguna tabla Dexie nueva.

## Technical Context

**Language/Version**: TypeScript 5.x (proyecto existente, sin cambio de versión)

**Primary Dependencies**: React 19, Pixi.js v8 vía `@pixi/react`, Zustand, lucide-react (iconos ya usados en `BattleScreen.tsx`/`HubScreen.tsx`)

**Storage**: N/A para esta spec — ningún campo nuevo persistido en Dexie; `useMetaStore.missionEnergy` gana 2 campos derivados (`regenPerSecond`, `lastUpdatedAt`) que ya existen en la tabla Dexie `missionEnergy` (solo se exponen en el estado reactivo, no se agrega columna nueva)

**Testing**: Vitest + Testing Library (ya configurado) — componentes con `render`/`fireEvent`/`act` con timers falsos para los `setInterval`/`useTick` involucrados; `src/engine/simulation.test.ts` no cambia (el motor no se toca)

**Target Platform**: Navegador web (sin cambio)

**Project Type**: Single project — app web sin backend (sin cambio de estructura)

**Performance Goals**: 60fps en el campo de batalla ya validado por specs previas — el redibujado de HP por unidad debe seguir el mismo umbral de "solo redibujar si la fracción cambia perceptiblemente" (`HP_BAR_REDRAW_THRESHOLD` ya usado en `BaseTower`) para no añadir costo de dibujo por unidad en cada frame

**Constraints**: Ningún cambio de comportamiento/balance de combate (FR-010); mantener la separación Motor/UI (Constitución § VI) tal como se documenta en research.md Decisiones 1 y 4

**Scale/Scope**: Hasta 6 unidades aliadas activas simultáneas (tope `MAX_ACTIVE_TEAM_SIZE`) + N unidades enemigas de oleada — ninguna de las 5 historias introduce una entidad de datos nueva ni una pantalla nueva, solo componentes/estado dentro de `BattleScreen.tsx`, `BattleStage.tsx`, `UnitSprite.tsx` y `HubScreen.tsx`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Combate Automático por Despliegue | Sin cambios — velocidad/pausa escalan `deltaSeconds`, no alteran ninguna regla de colisión/daño/refuerzo de fila. ✅ |
| II. Progresión por Niveles con Desbloqueo Secuencial | No aplica — esta spec no toca progreso ni desbloqueo. ✅ |
| III. Identidad Visual Animada | No aplica — no se añade ninguna unidad/enemigo nuevo. ✅ |
| IV. Balance Dirigido por Datos | El cañón especial ya usa `SPECIAL_CANNON_DEFAULTS` en `src/data`-adjacent (`useGameStore.ts`, valores provisionales de specs/012); esta spec no cambia esos valores, solo los expone. ✅ |
| V. Persistencia Local-First, Sin Backend | Velocidad/pausa/filas son estado de partida en curso — ninguno se persiste, consistente con "el estado de una batalla en curso es efímero". ✅ |
| VI. Separación Estricta entre Motor y UI | Ver research.md Decisiones 1 y 4 — se reutilizan los 2 patrones ya validados del repo (selectores acotados para chips HUD, `Graphics`+ref+useTick para elementos del canvas); ningún componente React nuevo re-renderiza el árbol de la simulación en cada tick, y `src/engine/` no se modifica. ✅ |
| VII. Simplicidad desde el MVP | Se descartó explícitamente (research.md Decisión 6) persistir el toggle de filas — se mantiene como estado de sesión, la opción más simple que satisface la spec. ✅ |

Sin violaciones. No se requiere `Complexity Tracking`.

## Project Structure

### Documentation (this feature)

```text
specs/029-pulido-batalla-hud/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

No se genera `contracts/` — es una app frontend sin API pública ni interfaz externa (mismo criterio ya aplicado en `specs/028` y specs anteriores del proyecto, ninguna de las cuales generó `contracts/`).

### Source Code (repository root)

Proyecto single-app existente (`battle-cats-web/`) — Opción 1 (single project), sin cambio de estructura. Archivos tocados por esta feature:

```text
src/
├── state/
│   └── useGameStore.ts       # + speedMultiplier, paused; tick() respeta ambos vía BattleStage
│   └── useMetaStore.ts       # MissionEnergyState + regenPerSecond, lastUpdatedAt
├── screens/
│   └── BattleScreen.tsx      # + CannonControl, SpeedControls, DeployBar con toggle de filas
│   └── HubScreen.tsx         # + EnergyRegenTimer
├── game/
│   ├── BattleStage.tsx       # useTick de BattleField respeta paused/speedMultiplier
│   ├── UnitSprite.tsx        # + capa Graphics de HP por unidad (ref + useTick existente)
│   └── graphics/
│       └── unitHpBar.ts      # NUEVO — drawUnitHpBar, mismo patrón que baseTower.ts
└── theme.css                 # + clase de disposición de 2 filas para .deploy-bar

tests/unit/
├── useGameStore.test.ts          # + tests de speedMultiplier/paused/tick escalado
├── useMetaStore.test.ts          # + tests de regenPerSecond/lastUpdatedAt expuestos
├── BattleScreen.test.tsx         # + tests de CannonControl/SpeedControls/toggle de filas
├── HubScreen.test.tsx            # + test de EnergyRegenTimer
└── game/unitHpBar.test.ts        # NUEVO — test unitario puro de drawUnitHpBar (geometría/fracción)
```

**Structure Decision**: Se extiende el mismo single-project ya existente — ningún directorio nuevo de primer nivel, ningún módulo de estado nuevo (`speedMultiplier`/`paused` viven en `useGameStore` ya existente, no en un store nuevo — ver research.md Decisión 2).

## Complexity Tracking

*Sin violaciones de Constitution Check — sección no aplica.*
