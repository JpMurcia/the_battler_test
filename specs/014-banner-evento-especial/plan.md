# Implementation Plan: Banner Especial de Eventos: "Etapas de Fantasía"

**Branch**: `014-banner-evento-especial` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-banner-evento-especial/spec.md`

## Summary

Añade `EventBanner`/`EventTimeWindow` (`src/data/events.ts`) y una tarjeta adicional en `LevelSelectScreen` que evalúa la ventana horaria activa contra `Date.now()`, sin tocar el desbloqueo secuencial existente ni `src/engine/`.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: N/A — sin datos nuevos que persistir (las recompensas ya se persisten vía `specs/012`; "evento completado en esta ventana" no bloquea nada, ver spec.md Assumptions).

**Testing**: Vitest — evaluación de ventana horaria como función pura testeable sin mocks de reloj real (inyectando `nowMs` como parámetro); Testing Library para `LevelSelectScreen`.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio.

**Constraints**: la evaluación de ventana horaria vive fuera de `src/engine/` — es una decisión de UI/contenido (¿se muestra el banner?), no de simulación; `stepSimulation` nunca conoce `EventTimeWindow`.

**Scale/Scope**: +1 archivo de datos (`events.ts`), extensión de `LevelSelectScreen.tsx`.

## Constitution Check

- **§ II Progresión por Niveles con Desbloqueo Secuencial**: el banner de evento es la excepción explícita y acotada — no participa del desbloqueo secuencial (FR-004), documentada aquí como excepción intencional, no como violación silenciosa.
- **§ IV Balance Dirigido por Datos**: ventanas horarias y configuración de la fase especial viven en `src/data/events.ts` — cumple.
- **§ V Persistencia Local-First**: sin backend remoto para los horarios; recompensas ya se persisten vía `specs/012` — cumple.
- **§ VI Separación Motor/UI**: `src/engine/` no conoce ventanas horarias; la fase especial es un `Level` como cualquier otro una vez que `startLevel` la recibe — cumple.

## Project Structure

### Documentation (this feature)

```text
specs/014-banner-evento-especial/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/
│   └── events.ts            # nuevo: EventBanner[], EventTimeWindow, isEventActive(banner, nowMs): boolean
└── screens/
    └── LevelSelectScreen.tsx # + tarjeta de EventBanner activo, junto al listado de LEVELS existente
```

**Structure Decision**: extensión mínima — un archivo de datos y una tarjeta condicional adicional en una pantalla ya existente.

## Key Design Decisions

1. **`isEventActive(banner, nowMs)` como función pura**: recibe `nowMs` como parámetro (no llama a `Date.now()` internamente) para ser 100% testeable sin mocks de reloj global — `LevelSelectScreen` la invoca con `Date.now()` en cada render.
2. **Ventanas solapadas se resuelven por `some()`**: `isEventActive` es `banner.timeWindows.some(w => nowMs >= w.startMs && nowMs < w.endMs)` — el solapamiento (FR-010) queda resuelto naturalmente sin lógica de fusión de intervalos.
3. **La fase especial es un `Level` normal para `useGameStore`**: `EventBanner.specialStage` tiene la misma forma que cualquier entrada de `LEVELS`; `startLevel` no necesita saber que vino de un evento — solo `LevelSelectScreen` sabe que ese botón "Jugar" no pasa por la validación de `highestUnlockedLevelIndex`.
4. **Sin arco de saga para la fase especial**: `specialStage` no pertenece a ningún `SagaArc.levelIds` (`specs/012`) — el resolver de arco de `deployUnit`/`spawnEnemyUnit` ya trata "sin arco encontrado" como multiplicador 1 (FR-004 de `specs/012`), así que la fase especial usa sus propios valores base sin cambios adicionales.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
