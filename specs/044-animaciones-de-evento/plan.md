# Implementation Plan: Animaciones de Evento

**Branch**: `044-animaciones-de-evento` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/044-animaciones-de-evento/spec.md`

## Summary

Cuatro animaciones procedurales de cuerpo completo (Golpeado, Muerte, Aparición, Retroceso) sin arte nuevo y sin tocar el motor. Todo vive en la capa de render:

1. **Matemática pura** (`src/game/eventAnimations.ts`): duraciones, poses por evento, un rastreador mutable por unidad que detecta los eventos comparando observaciones entre fotogramas (vida, escudo, posición) y la composición con la pose de reposo/ataque existente. Sin Pixi ni React, cubierto por Vitest.
2. **Preferencia de movimiento** (`src/game/motionPreference.ts`): lectura cacheada de `prefers-reduced-motion`.
3. **Destello** (`src/game/graphics/hitFlash.ts`): un único `ColorMatrixFilter` compartido, creado bajo demanda, que se asigna al cuerpo solo durante 0,08 s.
4. **Integración**: `UnitSprite.tsx` usa el rastreador dentro de su `useTick` existente (aparición, golpe, retroceso; anillo y opacidad); `DeathEchoSprite.tsx` sustituye el encogimiento por la pose de muerte con pivote centrado.

## Technical Context

**Language/Version**: TypeScript ~6.0 (`tsc -b`).

**Primary Dependencies**: React 19, `pixi.js` 8.19 (`ColorMatrixFilter` ya incluido), `@pixi/react` 8. Ninguna nueva.

**Storage**: N/A. Las animaciones son estado efímero de render (refs), nunca en `useGameStore` ni Dexie (§ V).

**Testing**: Vitest 4 + jsdom.
- **Nuevo**: `tests/unit/game/eventAnimations.test.ts` (poses, detección, límite de 3/s, reducir movimiento, composición) y `tests/unit/game/motionPreference.test.ts`.
- **Ajustado**: `tests/unit/game/animation.test.ts` (el eco ya no usa `getDeathEchoPose`).
- Sin tests de componentes Pixi (como hoy); verificación visual en el navegador (quickstart.md).

**Target Platform**: navegador (escritorio y móvil).

**Project Type**: web app de un solo proyecto.

**Performance Goals**: SC-008, 40 unidades sin degradación perceptible. Por fotograma y unidad: unas comparaciones numéricas y la escritura de transformaciones que ya se hacía. El filtro solo existe en las unidades que destellan (≤ 0,08 s cada una, ≤ 3/s), y es una única instancia compartida.

**Constraints**:
- § VI: cero re-renders de React por tick; ningún `Graphics` redibujado por fotograma.
- `src/engine/` no se toca (FR-008, SC-007).
- Rotación total del cuerpo ≤ 0,2 rad (FR-006).
- Biblia §1: ≤ 3 destellos/s; con reducir movimiento, sin pulsos.

**Scale/Scope**: 3 módulos nuevos, 3 modificados (`UnitSprite.tsx`, `DeathEchoSprite.tsx`, `animation.ts`), 2 tests nuevos y 1 ajustado, más la documentación de arte.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| **§ I Combate automático** | Ninguna regla cambia; las animaciones solo observan | ✅ |
| **§ II Progresión** | Sin efecto | ✅ |
| **§ III Identidad visual animada** | Se mantienen reposo y ataque; se añaden 4 reacciones | ✅ |
| **§ IV Datos** | No hay datos de balance nuevos; las constantes de animación son de presentación y viven en `src/game/` como las de `animation.ts` | ✅ |
| **§ V Local-first** | Nada se persiste | ✅ |
| **§ VI Motor/UI** | Motor intacto. Detección por diferencias entre fotogramas en la capa de render, como el eco y las chispas. Todo ocurre dentro de los `useTick` existentes, sin estado de React nuevo | ✅ |
| **§ VII Simplicidad** | Sin dependencias. Un filtro compartido en lugar de texturas de silueta por unidad (research.md Decisión 3). Sin sistema genérico de animación: cuatro funciones de pose y un rastreador | ✅ |

**Re-check tras el diseño (Phase 1)**: sin cambios ni excepciones.

## Project Structure

### Documentation (this feature)

```text
specs/044-animaciones-de-evento/
├── spec.md
├── plan.md              # este archivo
├── research.md          # Decisiones 1–9
├── data-model.md        # poses, rastreador y composición
├── quickstart.md        # validación manual y automática
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/game/
├── eventAnimations.ts      # NUEVO: duraciones, poses, rastreador, composición
├── motionPreference.ts     # NUEVO: prefers-reduced-motion cacheado
├── graphics/hitFlash.ts    # NUEVO: filtro de destello compartido
├── UnitSprite.tsx          # MOD: aparición, golpe, retroceso, anillo
├── DeathEchoSprite.tsx     # MOD: pose de muerte, pivote centrado
└── animation.ts            # MOD: se retira la pose de encogimiento del eco

tests/unit/game/
├── eventAnimations.test.ts # NUEVO
├── motionPreference.test.ts# NUEVO
└── animation.test.ts       # MOD
```

**Structure Decision**: mismo patrón que `animation.ts` y `cyberEffects.ts`: matemática pura en `src/game/`, componentes Pixi que solo la aplican.

## Complexity Tracking

Sin violaciones que justificar.
