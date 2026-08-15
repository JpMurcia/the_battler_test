# Implementation Plan: Nivel 2 "Hacia el Futuro"

**Branch**: `011-nivel-2-hacia-el-futuro` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-nivel-2-hacia-el-futuro/spec.md`

## Summary

Feature 100% de contenido: un `Level` nuevo (`level-2`) y 1-2 `Cat` nuevos en `src/data/`, sin tocar `src/engine/`, `src/game/` ni los stores — el núcleo de combate y el mecanismo de desbloqueo ya existen (`specs/002`, `specs/005`, `specs/007`).

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: N/A — contenido estático en `src/data/`.

**Testing**: Vitest — reutiliza `tests/unit/engine/simulation.test.ts` (parametrizable por nivel) y el test de dificultad no decreciente de `specs/007-energia-mision-dificultad`.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio — mismo motor, mismo objetivo de 60fps/10+ unidades.

**Constraints**: cero cambios a `src/engine/`, `src/game/`, `src/state/`, `src/db/` — si esta spec necesitara tocar alguno de esos, sería señal de que el contenido excede lo que el motor genérico ya soporta y debería dividirse.

**Scale/Scope**: +1 `Level`, +1-2 `Cat`.

## Constitution Check

- **§ II Progresión por Niveles con Desbloqueo Secuencial**: el Nivel 2 es la prueba de que el mecanismo genérico (`specs/005-mapa-de-niveles`) funciona para más de un nivel — cumple.
- **§ IV Balance Dirigido por Datos**: 100% contenido en `src/data/`, cero lógica nueva — cumple trivialmente.
- **§ VII Simplicidad/YAGNI**: sin narrativa/Timeline (fuera del alcance actual de la constitución) — cumple, evita complejidad no requerida por ningún Core Principle vigente.

Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/011-nivel-2-hacia-el-futuro/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/data/
├── cats.ts     # + 1-2 Cat nuevos
└── levels.ts   # + level-2: Level (energyCost/region/difficulty de specs/007-energia-mision-dificultad si ya está implementada; si no, se agregan cuando esa spec se implemente)
```

**Structure Decision**: sin cambios de estructura — esta spec es la validación de que las specs 002/005/007 (y opcionalmente 008-010) generalizan correctamente a contenido nuevo sin tocar código de motor/UI.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
