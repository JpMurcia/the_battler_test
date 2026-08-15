# Implementation Plan: Dashboard de Base del Jugador

**Branch**: `006-dashboard-base-jugador` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-dashboard-base-jugador/spec.md`

## Summary

Construir la pantalla `Base` (nivel agregado + lista de mejora, sobre `useMetaStore.upgradeCat` ya existente) y una pantalla `Team` nueva que persiste el equipo activo en una tabla Dexie nueva (`teamFormation`, versión 2 del esquema); `DeployBar` filtra por ese equipo cuando existe.

## Technical Context

**Language/Version**: TypeScript, React 19

**Primary Dependencies**: Ninguna nueva.

**Storage**: Dexie — nueva tabla `teamFormation` (fila singleton), `db.version(2).stores({ ...v1, teamFormation: 'id' })` con upgrade no destructivo (Dexie mantiene v1 al no declarar cambios en tablas existentes).

**Testing**: Vitest (store) + Testing Library (pantallas).

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: N/A.

**Constraints**: `DeployBar` no debe romper partidas existentes sin equipo activo guardado (fallback a "todos los ownedCats").

**Scale/Scope**: 2 pantallas (`Base`, `Team`), 1 tabla Dexie nueva, extensión de `useMetaStore`.

## Constitution Check

- **§ IV Balance Dirigido por Datos**: `upgradeCost` ya vive fuera de `src/engine/` (en el store); esta spec no lo mueve — cumple.
- **§ V Persistencia Local-First**: `teamFormation` se persiste en Dexie igual que el resto del progreso; cada acción (mejorar, confirmar equipo) escribe de inmediato — cumple.
- **§ VI Separación Motor/UI**: `DeployBar` ya lee `useGameStore`/`useMetaStore` vía selectores; el filtro por equipo activo es un `.filter()` adicional sobre los mismos datos, no toca `src/engine/` — cumple.
- **§ VII Simplicidad/YAGNI**: se reutiliza `currency` (sin segundo recurso), y el equipo activo es un array plano de `catId` sin jerarquía ni slots por posición — cumple.

Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/006-dashboard-base-jugador/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── db/index.ts             # + tabla teamFormation (versión 2), + getActiveTeam()/setActiveTeam() o expuesto vía Dexie directo
├── state/useMetaStore.ts   # + activeTeamCatIds: string[], + setActiveTeam(catIds)
├── screens/
│   ├── UpgradeScreen.tsx   # reescrito → contenido de "Base" (nivel agregado + lista de mejora)
│   ├── TeamScreen.tsx      # nuevo — selección de equipo activo
│   └── BattleScreen.tsx    # DeployBar: filtra ownedCats por activeTeamCatIds si no está vacío
└── types/screen.ts         # Screen añade 'Team' (Upgrade ya existe, se reutiliza para Base)
```

**Structure Decision**: `UpgradeScreen.tsx` se reutiliza como la pantalla "Base" descrita en la spec origen (mismo punto de entrada ya cableado desde `MainMenuScreen`), evitando renombrar rutas ya existentes; `TeamScreen.tsx` es la única pantalla nueva.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
