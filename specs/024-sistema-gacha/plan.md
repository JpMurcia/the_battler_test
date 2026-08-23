# Implementation Plan: Sistema de Gacha Completo ("Cápsula de Gatos")

**Branch**: `024-sistema-gacha` | **Date**: 2026-08-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/024-sistema-gacha/spec.md`

## Summary

Reescribir `GachaScreen` (stub hoy) como un hub de dos pestañas — "Tirar" y "Almacén" — sobre 3 banners fijos (`uberfest`/`epicfest`/`estandar`, tasas de `docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html`/`docs/The_Battle_Cats_Manual_Tecnico.docx` § 12.3) con funciones puras de tirada (`rollOne`/`rollMany`, testeables sin UI). Cada tirada deposita cápsulas en un Almacén de Gatos persistente (`db.gachaStorage`, tabla nueva) en vez de otorgar el gato directamente; desde ahí el jugador activa (nuevo → `addOwnedCat` ya existente; duplicado → nuevo campo `plusLevel` en `ownedCats`) o intercambia (por `currency` ya existente, alias de "XP"; o por `npCurrency` nuevo, solo cápsulas Megarraro/Legendario). Cierra el vacío de contenido en `Legendario`/`Colaboración` con 4 gatos gacha-exclusivos nuevos (`src/data/gachaUnits.ts`) que reutilizan el fallback `Graphics` genérico ya existente — sin sprites ni pipeline procedural nuevo.

## Technical Context

**Language/Version**: TypeScript (proyecto existente, `tsc -b` vía Vite)

**Primary Dependencies**: React 19 (pestañas dentro de `GachaScreen.tsx`, React puro — sin Pixi.js, mismo criterio que `specs/023` para pantallas de navegación), Zustand (`useMetaStore`, sin store nuevo), Dexie sobre IndexedDB (persistencia ya existente + 1 tabla nueva, research.md Decisión 5)

**Storage**: IndexedDB local vía Dexie — `db.version(10).stores({ gachaStorage: '++id' })` (tabla nueva, ver data-model.md); `gachaCurrency`/`npCurrency` en `playerProfile` y `plusLevel` en `ownedCats` como campos opcionales nuevos, sin bump de versión (research.md Decisión 5)

**Testing**: Vitest + `@testing-library/react` (patrón ya usado en `tests/unit/`); `rollOne`/`rollMany` testeados con `random` inyectable para validar SC-003 de forma determinista

**Target Platform**: Navegador web (100% frontend, sin backend), mismo alcance que el resto del proyecto

**Project Type**: Web app single-project (SPA) — no aplica estructura backend/frontend separada

**Performance Goals**: Sin objetivo nuevo — la Cápsula de Gatos es una pantalla de navegación por render (sin loop de 60fps que sincronizar), igual que `GachaScreen`/`UpgradeScreen` ya existentes

**Constraints**: Sin dependencias npm nuevas; el gacha NO debe alterar ningún camino de obtención ya existente (FR-014); ninguna vía de compra con dinero real (FR-018, alineado con que el proyecto no tiene backend de pagos); `rollOne`/`rollMany` deben ser funciones puras testeables sin `Math.random` real fijo (SC-003)

**Scale/Scope**: 1 pantalla reescrita (`GachaScreen.tsx`), 2 archivos de datos nuevos (`src/data/gacha.ts`, `src/data/gachaUnits.ts`, 4 `Cat` nuevos), 1 tabla Dexie nueva + 3 campos opcionales nuevos en 2 tablas existentes, ~6 acciones nuevas en `useMetaStore.ts`, 1 función existente modificada (`characterLevelOf`); sin pantallas adicionales, sin `Screen` nuevo (research.md Decisión 4)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Combate Automático por Despliegue | ✅ Cumple sin cambios — el gacha es navegación previa a la batalla; una cápsula activada se despliega exactamente igual que cualquier gato ya poseído (`deployUnit`, sin tocar `src/engine/`). |
| II. Progresión por Niveles con Desbloqueo Secuencial | ✅ No aplica al desbloqueo de niveles — el gacha es un camino de obtención de **gatos**, no de niveles; `getLevelState` no cambia. |
| III. Identidad Visual Animada | ✅ Cumple — los 4 gatos gacha-exclusivos nuevos (`gachaUnits.ts`) no llevan `spriteKey` y caen en el fallback `Graphics` genérico que `UnitSprite.tsx`/`animation.ts` ya proveen desde `specs/003` (idle + ataque por transform, nunca estático) — research.md Decisión 2. |
| IV. Balance Dirigido por Datos | ✅ Cumple — banners, tasas y pool viven en `src/data/gacha.ts`; los 4 gatos nuevos viven en `src/data/gachaUnits.ts`; `rollOne`/`rollMany` son funciones puras sobre esos datos, sin lógica hardcodeada en un componente; `src/engine/` no cambia. |
| V. Persistencia Local-First, Sin Backend | ✅ Cumple — toda la persistencia nueva (Almacén, `gachaCurrency`, `npCurrency`, `plusLevel`) usa Dexie/IndexedDB local, con la misma escritura inmediata que el resto del progreso (data-model.md); sin backend, sin compra real (FR-018). |
| VI. Separación Estricta entre Motor y UI | ✅ Cumple — `GachaScreen.tsx` es React puro; `rollOne`/`rollMany` viven en `src/data/gacha.ts` (no en un componente ni en `src/engine/`); `src/engine/`, `BattleStage`/`UnitSprite` (capa Pixi) no cambian su contrato — solo ganan un fallback ya existente para 4 `catId` más. |
| VII. Simplicidad desde el MVP | ⚠️ Excepción explícita y deliberada — ver Complexity Tracking. La Constitución excluye "economía de gacha balanceada" del MVP inicial; esta spec la incorpora a pedido explícito del usuario, acotada al mínimo necesario para cumplir `spec.md` (3 monedas totales, sin tickets gratuitos, sin rotación temporal, research.md Decisiones 1/2/3/4 recortan alcance en cada punto posible). |

## Project Structure

### Documentation (this feature)

```text
specs/024-sistema-gacha/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

Sin `contracts/` — proyecto 100% frontend sin API externa que documentar (mismo criterio ya aplicado en `specs/022-datos-semilla-flujo-navegacion/plan.md` y `specs/023-mapa-de-etapas-visual/plan.md`).

### Source Code (repository root)

```text
src/
├── data/
│   ├── gacha.ts               # NUEVO — GachaBanner[], GACHA_POOL, rollOne()/rollMany() (data-model.md)
│   ├── gachaUnits.ts          # NUEVO — 4 Cat gacha-exclusivos (2 Legendario, 2 Colaboración), sin spriteKey
│   └── cats.ts                 # MODIFICADO — spread de GACHA_UNITS_AS_CATS al final de CATS (mismo patrón que SEED_CATS_AS_CATS)
├── screens/
│   └── GachaScreen.tsx        # REESCRITO — de stub a hub "Tirar"/"Almacén" (data-model.md § Pantalla)
├── state/
│   └── useMetaStore.ts        # MODIFICADO — gachaCurrency/npCurrency/gachaStorage + 6 acciones nuevas (data-model.md); characterLevelOf suma plusLevel
└── db/
    └── index.ts                # MODIFICADO — GachaStorageRow + db.version(10); PlayerProfileRow/OwnedCatRow ganan campos opcionales

tests/unit/
├── data/
│   └── gacha.test.ts           # NUEVO — rollOne/rollMany deterministas, distribución SC-003, pool no vacío por rareza (FR-013)
├── GachaScreen.test.tsx        # REESCRITO — tirada simple/x11, Almacén, activar/intercambiar
├── useMetaStore.test.ts        # MODIFICADO — nuevas acciones de gacha, characterLevelOf con plusLevel
└── db.test.ts                  # MODIFICADO — cobertura de db.version(10)/gachaStorage
```

**Structure Decision**: Proyecto único (SPA de React + Pixi.js ya existente) — no aplica ninguna variante backend/frontend ni mobile. Todo el trabajo entra dentro de las carpetas ya establecidas (`src/data/`, `src/screens/`, `src/state/`, `src/db/`, `tests/unit/`); no se crean carpetas de nivel superior nuevas; `GachaScreen.tsx` se reescribe in-place (mismo criterio que `specs/023` con `LevelSelectScreen.tsx`) en vez de convivir con una pantalla nueva.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Constitución § VII: se incorpora una "economía de gacha" que el MVP inicial excluía explícitamente | Pedido explícito del usuario ("arranca la spec para el gacha completo"), validado además contra `docs/The_Battle_Cats_Manual_Tecnico.docx` § 9.10/11/12.3 como referencia de diseño — no es una desviación accidental sino el objeto mismo de esta spec | No implementar el gacha no es una alternativa válida: incumpliría el pedido directo del usuario. La superficie se acotó al mínimo compatible con `spec.md` en cada decisión de `research.md` (3 monedas en vez de 4, sin tickets gratuitos/rotación temporal, sin pipeline de arte nuevo, sin `Screen` adicional) para minimizar cuánto se aparta del principio. |
