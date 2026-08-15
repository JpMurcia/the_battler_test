# Implementation Plan: Identidad Visual Animada

**Branch**: `003-identidad-visual-animada` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification `specs/003-identidad-visual-animada/spec.md` — cierra la excepción declarada en `specs/002-motor-de-combate/plan.md` § Complexity Tracking (Constitución § III).

## Summary

Reemplazar el rectángulo de color estático de `src/game/UnitSprite.tsx` por una representación visual que anima continuamente: movimiento/idle mientras la unidad avanza, un gesto de ataque reconocible mientras está `Engaged`, y una señal breve de derrota al morir — sin arte externo (formas vectoriales animadas por transform, derivadas de los stats ya existentes de cada `Cat`). El motor de simulación (`src/engine/`) no cambia. La conexión entre la batalla y el render se ajusta para que la animación de cada unidad se calcule por su propio `Ticker` de Pixi en vez de por re-render de React en cada frame, sosteniendo el objetivo de 60fps ya establecido con más unidades animadas en pantalla.

## Technical Context

**Language/Version**: TypeScript ~6.0.2, React 19 — mismo stack que `specs/002-motor-de-combate/plan.md`, sin dependencias nuevas.

**Primary Dependencies**: `pixi.js` + `@pixi/react` (ya instalados) — reutilizados tal cual; ninguna dependencia nueva.

**Storage**: N/A — sin cambios de esquema ni de persistencia.

**Testing**: Vitest. Las funciones puras de mapeo `Cat → parámetros visuales` y de cálculo de fase de animación (`src/game/animation.ts`) se testean sin canvas ni DOM, igual que `src/engine/` — no porque la Constitución lo exija para código de render (§ VI solo protege `src/engine/`), sino porque son funciones puras testeables sin costo adicional. Lo estrictamente visual (Pixi, transforms en pantalla) se valida por recorrido manual en navegador (`quickstart.md`), igual que `specs/002-motor-de-combate/` hizo con la parte visual del sprite de prueba.

**Target Platform**: navegadores evergreen de escritorio y móvil (sin cambio).

**Project Type**: aplicación web de un solo proyecto (sin cambio).

**Performance Goals**: 60fps con al menos 10 unidades animadas activas simultáneamente — mismo umbral de `specs/002-motor-de-combate/spec.md` SC-003, ahora con animación continua por unidad en vez de una forma estática.

**Constraints**: `src/engine/` no se modifica (Constitución § VI) — ninguna estructura nueva (temporizador de muerte, campo de animación) se añade a `BattleUnit`/`SimState`. La animación se dirige por mutación de transform (posición/escala/rotación/alpha) sobre objetos Pixi ya creados, nunca por `Graphics.clear()` + redibujado en el ciclo de animación (guía directa de las skills instaladas `pixijs-scene-graphics`/`pixijs-performance`). Sin ningún asset de arte/animación producido externamente (spec.md FR-004).

**Scale/Scope**: los 4 tipos de gato ya definidos en `src/data/cats.ts` (básico, tanque, veloz, pesado) — ningún gato nuevo se añade al catálogo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Nota |
|---|---|---|
| I. Combate Automático por Despliegue | ✅ Pass | Sin cambios a las reglas de combate — esta spec es puramente de capa visual. |
| II. Progresión por Niveles con Desbloqueo Secuencial | ✅ Pass | Sin cambios. |
| III. Identidad Visual Animada | ✅ Pass | Es exactamente el objetivo de esta spec — cierra la excepción declarada en `specs/002-motor-de-combate/plan.md`. |
| IV. Balance Dirigido por Datos | ✅ Pass | Los parámetros visuales por tipo de gato se derivan de stats ya existentes en `src/data/cats.ts` (research.md Decisión 1/5), nunca hardcodeados en `src/game/`. |
| V. Persistencia Local-First | ✅ Pass | Sin cambios de persistencia — toda la animación es estado efímero de render. |
| VI. Separación Estricta entre Motor y UI | ✅ Pass | `src/engine/` no se toca (research.md Decisión 4); toda la animación vive en `src/game/`, derivada de campos ya existentes de `BattleUnit` (`state`, `x`, `attackCooldownRemaining`). |
| VII. Simplicidad desde el MVP | ✅ Pass | Animación procedural con transforms sobre formas ya generadas, sin nuevo pipeline de arte ni campos de contenido nuevos (research.md Decisión 1). |

Sin violaciones — no aplica Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-identidad-visual-animada/
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
│   ├── engine/                  # SIN CAMBIOS (Constitución § VI) — ni tipos ni lógica se tocan
│   ├── data/
│   │   └── cats.ts              # SIN CAMBIOS DE ESQUEMA — se sigue leyendo tal cual (research.md Decisión 1)
│   ├── game/
│   │   ├── animation.ts         # nuevo — funciones puras: getVisualProfile(cat) deriva forma/tamaño/paleta/ritmo por archetype; getAnimationPhase(...) calcula idle/ataque/muerte a partir de tiempo transcurrido y BattleUnit.state (sin imports de Pixi/React, testeable con Vitest)
│   │   ├── UnitSprite.tsx        # MODIFICAR — el cuerpo (Graphics) se dibuja una vez por unidad vía getVisualProfile; useTick propio lee la unidad fresca desde useGameStore y muta transform (posición + animación) cada frame, sin redibujado ni prop-driven re-render
│   │   └── BattleStage.tsx       # MODIFICAR — BattleField sigue llamando a tick() cada frame, pero solo dispara re-render (setUnits) cuando cambia el conjunto de instanceIds activos (spawn o muerte), no en cada frame; además mantiene el registro efímero de "ecos de muerte" (DeathEcho) para animar la desaparición sin tocar src/engine/
│   └── screens/                 # SIN CAMBIOS
└── tests/
    └── unit/
        └── game/
            └── animation.test.ts # nuevo — getVisualProfile produce parámetros distintos y deterministas por archetype; el cálculo de fase de animación es correcto para Moving/Engaged y para el ritmo de ataque derivado de attackIntervalSeconds
```

**Structure Decision**: Todo el trabajo vive en `src/game/` (capa de render ya existente) y en sus tests correspondientes — `src/engine/` permanece exactamente como lo dejó `specs/002-motor-de-combate/`, sin ninguna dependencia nueva hacia Pixi ni hacia conceptos de animación (Constitución § VI). `src/data/cats.ts` no cambia de forma: la diferenciación visual por tipo de gato (US2) se deriva matemáticamente de sus stats ya existentes, no de contenido nuevo. El único cambio de flujo de datos es que `BattleField` dejará de forzar un re-render de React en cada uno de los 60 frames/s solo para reposicionar unidades — cada `UnitSprite` pasa a leer su propio estado fresco de `useGameStore` dentro de su propio `useTick`, aplicándolo por mutación directa de los objetos Pixi (research.md Decisión 3), y `BattleField` solo re-renderiza cuando la composición de unidades activas cambia (nace o muere una unidad).

## Complexity Tracking

*Sin violaciones que justificar — tabla omitida (ver Constitution Check arriba).*
