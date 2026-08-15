# Implementation Plan: Núcleo del Juego — Bucle de Combate, Estado y Persistencia

**Branch**: `001-nucleo-del-juego` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification `specs/001-nucleo-del-juego/spec.md` — documento fundacional de `battle-cats-web`, sin dependencias de ninguna spec previa (proyecto nuevo).

## Summary

Construir el esqueleto ejecutable del juego: cuatro capas ya arquitecturadas en `spec.md` (UI en React, motor de combate en Pixi.js con colisión AABB en 1D, estado en dos stores de Zustand, persistencia en Dexie/IndexedDB) integradas en un bucle jugable mínimo — un nivel, un puñado de gatos, victoria/derrota funcionando de punta a punta con progreso que persiste entre sesiones.

## Technical Context

**Language/Version**: TypeScript 5.x (`~6.0.2` instalado por el scaffold de Vite) + React 19, Node.js para tooling.

**Primary Dependencies**: Vite (bundler/dev server, ya scaffoldeado), `pixi.js` + `@pixi/react` (render de combate), `zustand` (estado), `dexie` (persistencia IndexedDB), `lucide-react` (iconografía de UI).

**Storage**: IndexedDB del navegador vía Dexie, base de datos `BattleCatsDB` (ver `spec.md` § Persistencia). Sin backend remoto.

**Testing**: Vitest para las funciones puras de simulación de combate (`src/engine/`) y para los stores de Zustand; sin test runner configurado todavía en el scaffold — se añade en Fase 1 de `tasks.md`.

**Target Platform**: navegadores evergreen de escritorio y móvil (Chrome/Safari/Firefox/Edge recientes).

**Project Type**: aplicación web de un solo proyecto (frontend puro), ya scaffoldeada en la raíz del repositorio (`battle-cats-web/`) — sin `backend/`.

**Performance Goals**: 60fps con al menos 10 unidades activas simultáneas en pantalla (spec.md SC-003); sin bloqueo del hilo principal de React por el bucle de Pixi.

**Constraints**: el bucle de combate (`useGameStore.tick`) es la única fuente de verdad de una batalla en curso y corre fuera del ciclo de render de React (impulsado por el `Ticker` de Pixi, no por un `useEffect` con `setInterval`); ningún componente de React debe re-renderizar en cada frame.

**Scale/Scope**: 1 nivel jugable para el MVP, ~3-5 gatos de prueba, 2 stores de Zustand, 4 tablas Dexie, 7 pantallas de React (`spec.md` § Arquitectura UI).

## Project Structure

### Documentation (this feature)

```text
specs/001-nucleo-del-juego/
├── spec.md    # Fundacional — incluye arquitectura de las 4 capas (ver spec.md)
├── plan.md    # Este archivo
└── tasks.md   # Desglose de tareas de bootstrap
```

### Source Code (repositorio raíz — ya scaffoldeado por Vite)

```text
battle-cats-web/
├── src/
│   ├── main.tsx                    # ya existe — entry point de Vite
│   ├── App.tsx                     # ya existe — MODIFICAR: enruta entre pantallas (spec.md § Arquitectura UI)
│   ├── db/
│   │   └── index.ts                # nuevo — clase BattleCatsDB (Dexie), export `db`
│   ├── data/
│   │   ├── cats.ts                 # nuevo — catálogo de Cat (contenido estático, ver spec.md § Key Entities)
│   │   └── levels.ts               # nuevo — catálogo de Level
│   ├── engine/
│   │   ├── collision.ts            # nuevo — función pura de superposición AABB en 1D
│   │   ├── combat.ts               # nuevo — resolución de daño entre dos BattleUnit
│   │   └── simulation.ts           # nuevo — un paso de tick puro: mover, colisionar, combatir, regenerar
│   ├── state/
│   │   ├── useGameStore.ts         # nuevo — Zustand, efímero (spec.md § useGameStore)
│   │   └── useMetaStore.ts         # nuevo — Zustand, persistente vía db/ (spec.md § useMetaStore)
│   ├── screens/
│   │   ├── TitleScreen.tsx
│   │   ├── MainMenuScreen.tsx
│   │   ├── LevelSelectScreen.tsx
│   │   ├── GachaScreen.tsx
│   │   ├── UpgradeScreen.tsx
│   │   ├── BattleScreen.tsx        # aloja el canvas de Pixi + overlay de UI en React
│   │   └── ResultScreen.tsx
│   └── game/
│       ├── BattleStage.tsx         # nuevo — <Application> de @pixi/react, monta el Ticker
│       └── UnitSprite.tsx          # nuevo — componente Pixi por BattleUnit activa
└── tests/
    └── unit/                       # Vitest sobre src/engine/ y src/state/
```

**Structure Decision**: separación estricta entre `src/engine/` (funciones puras de simulación, sin import de React ni de Pixi — testeables con Vitest sin canvas) y `src/game/` (componentes Pixi que solo leen `useGameStore` cada frame para posicionar sprites), reflejando la "Regla de frontera" y la "Separación de responsabilidades" ya fijadas en `spec.md`.

## Fases de implementación

1. **Fase 0 — Persistencia y estado** (`tasks.md` T001-T00x): `db/index.ts` + `useMetaStore` con `hydrate()`, probado de forma aislada (sin UI todavía) contra un IndexedDB real en el navegador.
2. **Fase 1 — Estado de partida y motor puro**: `useGameStore` + `src/engine/*.ts`, testeados con Vitest sin ningún render.
3. **Fase 2 — UI de React**: `App.tsx` enrutando `TitleScreen`/`MainMenuScreen` como primeras pantallas navegables, sin lógica de juego real todavía (placeholders donde haga falta).
4. **Fase 3 — Campo de batalla en Pixi**: `BattleStage.tsx` con un sprite de prueba y el `Ticker` corriendo, antes de conectar el motor de combate real.
5. **Fase 4 (fuera de esta ronda de tareas, siguiente spec)**: conectar el motor de combate real al render de Pixi, Gacha/Mejora funcionales, contenido real de niveles/gatos más allá de los de prueba.

`tasks.md` cubre las Fases 0-3 (el "bootstrap" ejecutable) — la Fase 4 es intencionalmente una spec/tasks futura, no parte de este documento.
