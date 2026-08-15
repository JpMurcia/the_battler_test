# Implementation Plan: Energía de Misión y Dificultad Progresiva

**Branch**: `007-energia-mision-dificultad` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-energia-mision-dificultad/spec.md`

## Summary

Nuevo recurso persistido `missionEnergy` (Dexie, versión 3 del esquema) con recuperación por tiempo transcurrido real; `Level` se extiende con `energyCost`/`region`/`difficulty`; `LevelSelectScreen` (`specs/005-mapa-de-niveles`) bloquea la entrada sin energía suficiente y la descuenta al entrar.

## Technical Context

**Language/Version**: TypeScript, React 19

**Primary Dependencies**: Ninguna nueva.

**Storage**: Dexie — nueva tabla `missionEnergy` (fila singleton), `db.version(3)`.

**Testing**: Vitest para la función pura de recuperación/escalado y para `Level.difficulty` no decreciente por región.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: N/A — cálculo de recuperación es O(1) por lectura.

**Constraints**: El cálculo de energía recuperada DEBE ser una función pura `computeRecoveredEnergy(pool, maxNow, nowMs)` sin efectos secundarios, testeable inyectando `nowMs` (sin depender de temporizadores reales en tests).

**Scale/Scope**: 1 tabla Dexie nueva, extensión de `Level`, extensión de `useMetaStore`, cambios en `LevelSelectScreen`.

## Constitution Check

- **§ I Combate Automático por Despliegue**: `missionEnergy` es explícitamente un recurso distinto del recurso de batalla del Principio I — no lo reemplaza ni lo reutiliza, evitando ambigüedad — cumple.
- **§ IV Balance Dirigido por Datos**: `energyCost`/`region`/`difficulty` viven en `src/data/levels.ts`, nunca hardcodeados en la pantalla — cumple.
- **§ V Persistencia Local-First**: `missionEnergy` se persiste igual que el resto del progreso, sin backend — cumple.
- **§ VI Separación Motor/UI**: la función de recuperación es pura y vive fuera de `src/engine/` (no es simulación de combate) — cumple, mismo patrón que `getLevelState` de `specs/005-mapa-de-niveles`.
- **§ VII Simplicidad/YAGNI**: escalado lineal simple por nivel de personaje, sin tablas de balance elaboradas — cumple.

Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/007-energia-mision-dificultad/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/levels.ts              # Level += energyCost, region, difficulty
├── data/missionEnergy.ts       # nuevo: computeMissionEnergyMax(characterLevel), computeRegenPerSecond(characterLevel), computeRecoveredEnergy(pool, maxNow, nowMs) — funciones puras
├── db/index.ts                 # + tabla missionEnergy (versión 3), MissionEnergyRow
├── state/useMetaStore.ts       # + missionEnergy: {current,max}, + spendMissionEnergy(levelId): boolean, recalcula al hidratar con computeRecoveredEnergy
└── screens/LevelSelectScreen.tsx  # deshabilita "Jugar" si missionEnergy.current < level.energyCost; al confirmar, llama spendMissionEnergy antes de startLevel/onNavigate
```

**Structure Decision**: `missionEnergy.ts` sigue el mismo patrón que `levelState.ts` de `specs/005-mapa-de-niveles` — funciones puras de meta-progreso junto a `src/data/`, no en `src/engine/` (que es exclusivamente simulación de combate en tiempo real).

## Complexity Tracking

*Sin violaciones — tabla omitida.*
