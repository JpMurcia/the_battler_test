# Implementation Plan: Sistema de Rango de Usuario

**Branch**: `019-rango-de-usuario` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/019-rango-de-usuario/spec.md`

## Summary

Exporta `characterLevelOf` de `useMetaStore.ts` como fuente única del "Rango de Usuario"; añade `UserRankThreshold` (`src/data/userRankThresholds.ts`) y `claimedRankThresholds`/`claimRankThreshold()` a `useMetaStore` (Dexie v9); muestra el rango y los umbrales reclamables en `UpgradeScreen`.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: Dexie — `db.version(9)`: nueva tabla `userRank` (`{ id: 1; claimedThresholds: number[] }`).

**Testing**: Vitest — `useMetaStore.claimRankThreshold` con `fake-indexeddb`.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio.

**Constraints**: `specs/017-objetos-de-batalla` DEBE estar implementada primero (las recompensas de umbral son `battleItemInventory`).

**Scale/Scope**: +1 archivo de datos (`userRankThresholds.ts`), extensión de `db/index.ts`, `useMetaStore.ts`, `UpgradeScreen.tsx`.

## Constitution Check

- **§ IV Balance Dirigido por Datos**: umbrales y sus recompensas viven en `src/data/userRankThresholds.ts` — cumple.
- **§ V Persistencia Local-First**: `claimedRankThresholds` persiste en Dexie, de forma monótona — cumple.
- **§ VI Separación Motor/UI**: el cálculo del rango es una función pura ya existente (`characterLevelOf`), sin tocar `src/engine/` — cumple.
- **§ VII Simplicidad/YAGNI**: reutiliza `characterLevelOf` en vez de introducir un segundo contador — cumple, y de paso elimina la duplicación ya señalada en el comentario de `useMetaStore.ts` ("mismo cálculo que `UpgradeScreen.tsx`").

## Project Structure

### Documentation (this feature)

```text
specs/019-rango-de-usuario/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/
│   └── userRankThresholds.ts # nuevo: UserRankThreshold[]
├── db/index.ts                # + tabla userRank (db.version(9))
├── state/useMetaStore.ts       # export characterLevelOf (deja de ser interno); + claimedRankThresholds, + claimRankThreshold(rank)
└── screens/UpgradeScreen.tsx    # + sección de Rango de Usuario con umbrales reclamables; deja de duplicar el cálculo de "Nivel de personaje" (usa characterLevelOf importado)
```

**Structure Decision**: extensión mínima sobre una pantalla ya existente; sin pantalla nueva.

## Key Design Decisions

1. **`characterLevelOf` pasa de interno a exportado**: hoy vive como `const` no exportada en `useMetaStore.ts`, duplicada manualmente en `UpgradeScreen.tsx` (mismo comentario ya presente en el código: "mismo cálculo que `UpgradeScreen.tsx`"). Esta spec la exporta y hace que `UpgradeScreen.tsx` la importe en vez de mantener su propia copia — consolida la duplicación existente como efecto colateral positivo, no como alcance nuevo.
2. **Reclamo como acción explícita, no derivada**: `claimRankThreshold(rank): boolean` valida `characterLevelOf(get().ownedCats) >= rank && !claimedRankThresholds.includes(rank)`, añade `rank` a `claimedRankThresholds` (persistido) y suma la recompensa a `battleItemInventory` (`specs/017`) — todo en una sola acción de store, sin paso intermedio.
3. **Umbrales reclamables se derivan en el render, no se precalculan**: `UpgradeScreen` filtra `USER_RANK_THRESHOLDS` por `t.rank <= characterLevelOf(ownedCats) && !claimedRankThresholds.includes(t.rank)` en cada render — sin estado derivado adicional que mantener sincronizado.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
