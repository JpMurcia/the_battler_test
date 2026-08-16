# Implementation Plan: Datos Semilla, Assets Procedimentales y Flujo de Navegación

**Branch**: `022-datos-semilla-flujo-navegacion` | **Date**: 2026-08-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/022-datos-semilla-flujo-navegacion/spec.md`

## Summary

Añadir un catálogo semilla independiente (`src/data/seedData.ts`) de 4 gatos (uno por rareza) y 3 enemigos, con un esquema propio (`stats`, `targetType`, `traits`, `proceduralDesign`) y un adaptador puro hacia el `Cat` ya usado por el motor/UI, de modo que se sume al catálogo de producción existente sin reemplazarlo. Añadir generación procedimental de texturas reutilizables con `PIXI.Graphics` + `renderer.generateTexture()` (`src/game/graphics/unitFactory.ts`), integradas como un tercer nivel de fallback en `UnitSprite.tsx` (sprite real → textura procedimental cacheada → `Graphics` derivado de stats). Validar el flujo de navegación de las 6 pantallas ya existentes añadiendo un nivel jugable con el catálogo semilla y una prueba de integración de extremo a extremo, sin construir pantallas nuevas.

## Technical Context

**Language/Version**: TypeScript (proyecto existente, `tsc -b` vía Vite)

**Primary Dependencies**: React 19, `pixi.js` v8 + `@pixi/react` v8 (render de combate), Zustand (estado), Dexie sobre IndexedDB (persistencia)

**Storage**: IndexedDB local vía Dexie (`src/db/index.ts`) — el catálogo semilla es contenido estático de código, no una tabla nueva de Dexie

**Testing**: Vitest + `@testing-library/react` + `fake-indexeddb` (patrón ya usado en `tests/unit/`)

**Target Platform**: Navegador web (100% frontend, sin backend), mismo alcance que el resto del proyecto

**Project Type**: Web app single-project (SPA) — no aplica estructura backend/frontend separada

**Performance Goals**: Generar y mostrar la textura procedimental de una unidad nueva en <100 ms percibidos (spec.md SC-005); instancias repetidas de la misma unidad reutilizan la textura cacheada sin regenerarla

**Constraints**: Sin dependencias nuevas de npm (usa `pixi.js`/`renderer.generateTexture()` ya instalado); no debe alterar el catálogo de producción (`CATS` existente) ni las 21 specs previas de contenido; no debe introducir pantallas nuevas (reutiliza las 6 ya construidas)

**Scale/Scope**: 4 gatos + 3 enemigos semilla, 1 nivel de demostración jugable, 3 archivos nuevos (`seedData.ts`, `unitFactory.ts`, su test), cambios acotados en `cats.ts` (append), `UnitSprite.tsx` (tercer fallback) y `levels.ts` (una entrada)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Combate Automático por Despliegue | ✅ Cumple sin cambios — el catálogo semilla se adapta a `Cat` y fluye por el mismo `combat.ts`/`simulation.ts` ya existente; no se toca la lógica de despliegue/colisión. |
| II. Progresión por Niveles con Desbloqueo Secuencial | ✅ Cumple — el nivel de demostración es un `Level` más, con su propio desbloqueo secuencial; no altera el progreso guardado de otros niveles. |
| III. Identidad Visual Animada | ✅ Cumple bajo la misma excepción ya declarada en `specs/002-motor-de-combate/plan.md` y heredada por el fallback `Graphics` actual (`UnitSprite.tsx`): la textura procedimental, igual que el `Graphics` derivado de stats hoy, se anima por transform (bob de idle + squash/rotación de ataque) en cada frame vía el `useTick` ya existente — nunca queda estática en pantalla. No se declara una excepción nueva; se extiende la ya vigente al nuevo tercer nivel de fallback. |
| IV. Balance Dirigido por Datos | ✅ Cumple — todas las estadísticas nuevas viven en `src/data/seedData.ts`; `src/engine/` no cambia. |
| V. Persistencia Local-First, Sin Backend | ✅ Cumple — no se añade ninguna tabla de Dexie; el catálogo semilla es código estático, la caché de texturas es en memoria (no persistida, reconstruible). |
| VI. Separación Estricta entre Motor y UI | ✅ Cumple — `unitFactory.ts` vive en `src/game/` (capa Pixi), es puro respecto a React, y no introduce dependencias de React en `src/engine/`. |
| VII. Simplicidad desde el MVP | ✅ Cumple — 7 unidades semilla (no un catálogo completo), sin pantalla de sandbox nueva, sin generación offline por build (ver research.md Decisión 2/3 para alternativas descartadas por YAGNI). |

Sin violaciones — no se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── data/
│   ├── seedData.ts          # NUEVO — SeedUnit, SEED_UNITS, SEED_ENEMIES, seedUnitToCat()
│   ├── cats.ts               # MODIFICADO — append de SEED_CATS_AS_CATS/SEED_ENEMIES_AS_CATS a CATS
│   └── levels.ts             # MODIFICADO — una entrada de Level referencia los 3 seed-enemy-* por catId
├── game/
│   ├── graphics/
│   │   └── unitFactory.ts   # NUEVO — drawSeedUnit(), getOrCreateUnitTexture(), clearUnitTextureCache()
│   ├── UnitSprite.tsx        # MODIFICADO — tercer nivel de fallback (textura procedimental)
│   └── animation.ts          # sin cambios — sigue gobernando el pose de idle/ataque
├── engine/                   # sin cambios (types.ts, combat.ts, simulation.ts)
├── screens/                  # sin cambios — las 6 pantallas ya existen y ya navegan vía App.tsx
└── App.tsx                   # sin cambios

tests/unit/
├── data/
│   └── seedData.test.ts     # NUEVO — valida forma del catálogo semilla y seedUnitToCat()
├── game/
│   └── unitFactory.test.ts  # NUEVO — valida drawSeedUnit()/caché de getOrCreateUnitTexture()
└── AppFlow.test.tsx          # NUEVO — integración: Título→Menú→Equipo→Batalla→Resultado→Menú (US3)
```

**Structure Decision**: Proyecto único (SPA de React + Pixi.js ya existente) — no aplica ninguna variante backend/frontend ni mobile. Todo el trabajo nuevo entra dentro de las carpetas `src/data/`, `src/game/graphics/` (nueva) y `tests/unit/` ya establecidas por el proyecto; no se crean carpetas de nivel superior nuevas.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
