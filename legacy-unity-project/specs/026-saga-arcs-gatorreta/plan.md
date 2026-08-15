# Implementation Plan: Arcos de Saga y Gatorreta en la Versión Web

**Branch**: `026-saga-arcs-gatorreta` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/026-saga-arcs-gatorreta/spec.md`, informada por [research.md](./research.md) y [data-model.md](./data-model.md). Extiende `specs/024-react-web-migration/plan.md` y `specs/025-treasure-sets-battle-items/plan.md` — mismo stack, mismo repositorio, sin decisiones de arquitectura adicionales.

## Summary

Rellenar el último tramo mayor de `024-react-web-migration` `tasks.md` T033 pendiente de spec propia (junto con `025`, que ya cubrió sets de tesoros y objetos de batalla): arcos de saga (agrupación de capítulos con multiplicadores de dificultad y recompensas de finalización) y el arma especial de área de la base del jugador ("Gatorreta", incluida la mejora táctica de regeneración de recurso con la que comparte contrato de diseño en Unity). Ambos sistemas se integran en `battleSession.ts` y `battleResource.ts` ya creados por `024` y ya extendidos por `025`, sin nuevas claves de `localStorage` ni componentes de render fuera de lo ya previsto.

## Technical Context

Sin cambios respecto a `specs/024-react-web-migration/plan.md` — mismo stack (Vite + React + TS + Pixi.js + Zustand + `localStorage`), mismo repositorio (`the-battler-web/`). Esta spec no añade dependencias nuevas.

**Storage**: sin claves nuevas — reutiliza `battler.chapterProgress` (campo `arcs[]`, ya declarado en `024`) y `battler.playerProgress` (`unlockedBonusUnitIds`).

**Scale/Scope**: 1 catálogo de arcos (JSON, nuevo), 2 funciones puras nuevas (`specialAreaWeapon.ts`, extensión de `battleResource.ts`), extensión de `battleSession.ts` (resolución de arco activo + recompensas de finalización) ya creado por `024`/`025`, 1-2 componentes de UI nuevos (indicador/botón de Gatorreta, control de mejora de regeneración).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Misma lectura que `024`/`025` § Constitution Check — `.specify/memory/constitution.md` gobierna el proyecto Unity, no el repositorio nuevo. Evaluación por intención de diseño:

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | No aplica — sin diálogo nuevo. |
| II. Combate Automático por Despliegue | Preservado y **extendido de forma literal**: el propio Principio II menciona "la base del jugador (con torre/cañón especial de recarga lenta)" como parte del núcleo de combate — esta spec es la primera de las tres (`024`/`025`/`026`) en cubrir efectivamente esa mención explícita de la constitución. |
| III. Identidad Visual Animada | No aplica — el arma especial no es una unidad desplegable, no requiere animación idle/attack propia (es un efecto de área en la base). |
| IV. Progresión por Capítulos con Desbloqueo | Preservado por diseño: los arcos agrupan capítulos ya secuenciados por `024`, sin introducir un desbloqueo paralelo. |
| V. Balance Dirigido por Datos | Preservado: `SagaArcCatalog` es contenido estático versionado; recarga/rango/daño de la Gatorreta y costo/incremento de la mejora de regeneración también viven en `data-model.md` como configuración, no hardcodeados en `src/engine/`. |
| VI. Simplicidad desde el MVP | Guía el alcance: solo arcos + Gatorreta (incluida la mejora de regen, agrupada en el mismo contrato Unity) — tracking de enemigos encontrados queda fuera hasta una spec futura explícita (ver spec.md Assumptions). |

Sin violaciones — Complexity Tracking vacío.

## Project Structure

### Documentation (this feature)

```text
specs/026-saga-arcs-gatorreta/
├── spec.md
├── plan.md                # Este archivo
├── research.md
├── data-model.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (extiende la estructura ya fijada por `024/plan.md`, mismo repo `the-battler-web/`)

```text
src/
├── data/
│   └── catalogs/
│       └── sagaArcs.json          # nuevo — SagaArcCatalog
├── engine/
│   ├── sagaArcProgress.ts         # ya creado por 024 (T011) — sin cambios, solo nuevo llamador
│   ├── specialAreaWeapon.ts       # nuevo — port de GatorretaController (tick, tryActivate, resetRecharge)
│   ├── battleResource.ts          # existente (024 T016) — MODIFICADO: +tryUpgradeRegen
│   └── battleSession.ts           # existente (024 T024, ya extendido por 025) — MODIFICADO: resuelve
│                                   #   activeArc en setupChapter, aplica sus multiplicadores, inicializa
│                                   #   specialAreaWeapon si está configurada; flujo de recompensas de
│                                   #   victoria evalúa finalización de arco (extiende el mismo paso que
│                                   #   025 ya añadió para sets de tesoros)
├── state/
│   └── useBattleSessionStore.ts   # existente (024 T025) — expone acciones `activateSpecialWeapon`,
│                                   #   `upgradeRegen`
└── components/
    └── battle/
        ├── SpecialWeaponButton.tsx  # nuevo — indicador de recarga + botón de activación, oculto si
        │                            #   la batalla no tiene el arma configurada
        └── RegenUpgradeButton.tsx   # nuevo — botón de mejora de regeneración, deshabilitado si no
                                     #   alcanza el recurso
```

**Structure Decision**: sin proyecto ni carpeta nueva — extensión in-place de la estructura ya definida por `024/plan.md`, coherente con que ambos sistemas ya vivían dentro del mismo `BattleStateManager.cs`/contrato `gatorreta-and-resource-upgrade.md` en el original Unity.

## Tabla de Mapeo Unity → React

| Unity (C#) | Naturaleza | React/TS equivalente |
|---|---|---|
| `SagaArcDefinition` (ScriptableObject) | Contenido | `src/data/catalogs/sagaArcs.json` + tipos en `src/types/content.ts` (ya referenciado por `024`) |
| `SagaArcProgressEvaluator` (clase estática) | Lógica pura | `src/engine/sagaArcProgress.ts` — **ya creado por `024` T011**, esta spec solo lo consume |
| Resolución de `activeArc` en `BattleStateManager.SetupChapter` (líneas 150-156 del original) | Runtime, integrado en el orquestador | Extiende `battleSession.setupChapter()` (research.md Decisión 2) |
| `TryGrantArcRewardsIfCompleted` (líneas 504-527) | Runtime | Extiende el flujo de recompensas de victoria de `battleSession.ts` (mismo paso que `025` ya añadió) |
| `GatorretaController` (MonoBehaviour) | Runtime | `src/engine/specialAreaWeapon.ts` (funciones puras `tick`/`tryActivate`/`resetRecharge`) + `SpecialWeaponButton.tsx` (Pixi/UI) |
| `BattleResourceController.TryUpgradeRegen` | Runtime | Extiende `src/engine/battleResource.ts` (`024` T016) + `RegenUpgradeButton.tsx` |
| `IBattleOutcomeListener`/eventos de disponibilidad del arma (FR-019 de spec 013 original) | Contrato + payloads de evento | Callback/evento de `useBattleSessionStore` (mismo patrón ya fijado en `024/plan.md`) |

## Complexity Tracking

*Sin violaciones que justificar — tabla vacía.*
