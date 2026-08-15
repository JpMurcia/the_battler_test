# Implementation Plan: Motor de Combate Real

**Branch**: `002-motor-de-combate` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification `specs/002-motor-de-combate/spec.md` — depende del bootstrap ya entregado en `specs/001-nucleo-del-juego/` (Dexie, Zustand, UI shell, Pixi Application con sprite de prueba).

## Summary

Reemplazar el sprite de prueba de `BattleStage.tsx` y el `tick()` placeholder de `useGameStore` por el motor de combate real: funciones puras de simulación (`src/engine/`) que mueven unidades, resuelven colisión AABB en 1D, aplican daño, regeneran energía, hacen aparecer la oleada enemiga del nivel y evalúan victoria/derrota — conectadas al `Ticker` de Pixi en `BattleStage` y reflejadas en `BattleScreen`/`ResultScreen`. Cierra además un gap de la spec fundacional: el gato inicial garantizado (FR-009 de `specs/001-nucleo-del-juego/spec.md`) nunca se implementó en el bootstrap.

## Technical Context

**Language/Version**: TypeScript ~6.0.2, React 19 — mismo stack que `specs/001-nucleo-del-juego/plan.md`, sin dependencias nuevas.

**Primary Dependencies**: `pixi.js` + `@pixi/react` (ya instalados), `zustand`, `dexie` — reutilizados tal cual.

**Storage**: IndexedDB vía Dexie, sin cambios de esquema. `ensureDefaultProfile()` (`src/db/index.ts`) se extiende para sembrar también una fila en `ownedCats` (el gato inicial garantizado), no solo `playerProfile`/`settings`.

**Testing**: Vitest. `src/engine/` se testea sin canvas ni DOM (funciones puras, sin import de React ni Pixi) — es el requisito verificable de la Constitución § Separación Estricta entre Motor y UI.

**Target Platform**: navegadores evergreen de escritorio y móvil (sin cambio).

**Project Type**: aplicación web de un solo proyecto (sin cambio).

**Performance Goals**: 60fps con al menos 10 unidades activas simultáneas (spec.md SC-003, heredado de `specs/001-nucleo-del-juego/spec.md` SC-003).

**Constraints**: `simulation.ts` debe ser un paso puro y determinista `(state, deltaSeconds) => state` — sin temporizadores reales ni `Date.now()` internos — para ser testeable con Vitest sin esperar tiempo real. El `Ticker` de Pixi en `BattleStage` llama a `useGameStore.getState().tick(deltaSeconds)` directamente (fuera del ciclo de render de React); solo indicadores puntuales de energía/salud de bases en `BattleScreen` se suscriben vía selectores acotados de Zustand — ningún otro componente de React vuelve a renderizar por el tick de 60fps (Constitución § Separación Estricta entre Motor y UI).

**Scale/Scope**: 1 nivel jugable, una oleada enemiga de prueba (2-3 apariciones escalonadas, usando el mismo catálogo `CATS` con `team: "Enemy"`), sin balance final ni arte/animación real.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Nota |
|---|---|---|
| I. Combate Automático por Despliegue | ✅ Pass | Es exactamente el alcance de esta spec (FR-001 a FR-007). |
| II. Progresión por Niveles con Desbloqueo Secuencial | ✅ Pass | FR-008/FR-009 conectan victoria → `useMetaStore.unlockNextLevel`/`markLevelCompleted`, ya implementados en 001. |
| III. Identidad Visual Animada | ⚠️ Excepción declarada | Ver Complexity Tracking — esta ronda usa un rectángulo de color sólido por unidad/equipo, sin animación real. |
| IV. Balance Dirigido por Datos | ✅ Pass | La oleada enemiga (`EnemyWave`) vive en `src/data/levels.ts`, no hardcodeada en `src/engine/`. |
| V. Persistencia Local-First | ✅ Pass | Sin cambios de arquitectura de persistencia; solo se cierra el gap del gato inicial. |
| VI. Separación Estricta entre Motor y UI | ✅ Pass | `src/engine/` sin imports de React/Pixi; es el requisito central de esta spec. |
| VII. Simplicidad desde el MVP | ✅ Pass | Un carril, una oleada de prueba, sin gacha/mejora funcional (fuera de alcance, ver spec.md § Assumptions). |

## Project Structure

### Documentation (this feature)

```text
specs/002-motor-de-combate/
├── spec.md          # Ya creado — QUÉ/POR QUÉ
├── plan.md          # Este archivo
├── research.md       # Fase 0
├── data-model.md      # Fase 1
├── quickstart.md      # Fase 1
└── tasks.md          # Fase 2 (/speckit-tasks, no este comando)
```

### Source Code (repositorio raíz)

```text
battle-cats-web/
├── src/
│   ├── engine/
│   │   ├── collision.ts        # nuevo — overlap AABB 1D puro, sin dependencias
│   │   ├── combat.ts           # nuevo — resolución de daño entre dos BattleUnit por dt
│   │   └── simulation.ts       # nuevo — paso de tick puro: mover, colisionar, combatir, regenerar energía, spawnear oleada, evaluar victoria/derrota
│   ├── data/
│   │   └── levels.ts           # MODIFICAR — añade `enemyWave: { catId, spawnAtSeconds }[]` por nivel
│   ├── db/
│   │   └── index.ts            # MODIFICAR — ensureDefaultProfile() siembra el gato inicial en ownedCats
│   ├── state/
│   │   └── useGameStore.ts     # MODIFICAR — tick(deltaSeconds) real (llama a engine/simulation.ts), nuevos campos internos (elapsedSeconds, enemiesSpawned)
│   ├── game/
│   │   ├── BattleStage.tsx     # MODIFICAR — reemplaza el sprite de prueba; un UnitSprite por BattleUnit activa; el Ticker llama a tick()
│   │   └── UnitSprite.tsx      # nuevo — pixiGraphics: rectángulo de color por team, posicionado por unit.x/width (sin animación real esta ronda)
│   └── screens/
│       ├── BattleScreen.tsx    # MODIFICAR — overlay con energía/salud de bases reales (selectores acotados), navega a Result al terminar la batalla
│       └── ResultScreen.tsx    # MODIFICAR — victoria/derrota real y recompensa, reemplaza el placeholder
└── tests/
    └── unit/
        ├── engine/
        │   ├── collision.test.ts
        │   ├── combat.test.ts
        │   └── simulation.test.ts
        └── useGameStore.test.ts # ampliar con casos de tick() real
```

**Structure Decision**: `src/engine/` se mantiene completamente aislado de React/Pixi (Constitución § VI) — `simulation.ts` es la única función que orquesta collision.ts + combat.ts en un paso de tick, y es la que `useGameStore.tick()` invoca. `BattleStage.tsx` pasa de dueño-de-una-animación-de-prueba a lector puro de `useGameStore` cada frame (vía `useTick`, sin suscripción React) para posicionar `UnitSprite`s — ningún estado de posición vive en React. `BattleScreen.tsx` es la única superficie donde un cambio de `useGameStore` puede disparar un re-render de React, y solo para los selectores puntuales de energía/salud de bases, nunca para el árbol de `BattleStage`.

## Complexity Tracking

> Excepción declarada a un Core Principle, según exige la Constitución § Governance.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Principio III (Identidad Visual Animada) — unidades se renderizan como rectángulos de color sólido por equipo, sin animación de movimiento/ataque | Esta spec valida las reglas de combate (colisión, daño, victoria/derrota) end-to-end; bloquear ese trabajo en tener arte y animaciones finales retrasaría verificar la parte de mayor riesgo del proyecto (la lógica del bucle central) | Esperar a tener sprites animados antes de conectar el motor duplicaría el trabajo si las reglas de combate cambian durante la validación, y no hay ninguna decisión de arte tomada todavía — una spec futura de contenido/arte reemplaza los rectángulos por sprites animados reales sin tocar `src/engine/` |
