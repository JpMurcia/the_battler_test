# Implementation Plan: Mapa de Niveles y Desbloqueo Secuencial

**Branch**: `005-mapa-de-niveles` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-mapa-de-niveles/spec.md`

## Summary

Reescribir `LevelSelectScreen.tsx` para derivar el estado (`locked`/`unlocked`/`completed`) de cada nivel a partir de `useMetaStore.highestUnlockedLevelIndex` y `completedLevelIds`, deshabilitando la interacción sobre niveles bloqueados. Sin cambios a `src/engine/`, `src/data/levels.ts` ni al esquema de Dexie.

## Technical Context

**Language/Version**: TypeScript, React 19

**Primary Dependencies**: Ninguna nueva.

**Storage**: Sin cambios — lee `useMetaStore` ya hidratado desde Dexie.

**Testing**: Vitest + Testing Library.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: N/A — pantalla estática, sin loop de combate.

**Constraints**: El cálculo de estado de nivel debe ser una función pura testeable sin DOM, reutilizable si otra pantalla necesita la misma lógica más adelante (dashboard, mapa).

**Scale/Scope**: 1 función pura nueva + reescritura de `LevelSelectScreen.tsx`.

## Constitution Check

- **§ II Progresión por Niveles con Desbloqueo Secuencial**: esta spec es la implementación directa de este principio en la única pantalla donde hoy no se aplica — cumple, cierra un gap existente.
- **§ IV Balance Dirigido por Datos**: el estado de bloqueo se deriva de datos ya existentes (`LEVELS`, progreso persistido), sin nuevos campos hardcodeados — cumple.
- **§ VI Separación Motor/UI**: la función de derivación de estado vive fuera de `src/engine/` (no es simulación de combate) pero sí como función pura testeable, coherente con el espíritu del principio — cumple.
- **§ VII Simplicidad/YAGNI**: sin mapa visual con scroll 2D ni banners — tarjetas simples en una lista desplazable, lo mínimo que cumple FR-004 — cumple.

Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/005-mapa-de-niveles/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/
│   └── levelState.ts        # nuevo: getLevelState(level, index, meta) → 'locked'|'unlocked'|'completed', función pura
└── screens/
    └── LevelSelectScreen.tsx  # reescrito: usa getLevelState por nivel, deshabilita "Jugar" si 'locked'
```

**Structure Decision**: la función de derivación de estado vive junto a `src/data/` (consume datos, no motor de combate) en vez de `src/engine/`, ya que no es parte de la simulación en tiempo real — es lógica de progreso/meta-estado, más cercana a `useMetaStore` que a `stepSimulation`.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
