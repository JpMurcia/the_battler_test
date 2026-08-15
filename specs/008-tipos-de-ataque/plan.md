# Implementation Plan: Tipos de Ataque (Attack Types)

**Branch**: `008-tipos-de-ataque` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-tipos-de-ataque/spec.md`

## Summary

Generalizar la detección de objetivos de `stepSimulation` de "el primer oponente que se superpone en X" a "todos/el más lejano dentro de un rango de detección", parametrizado por `attackType`/`attackRange`/`areaRadius` en `BattleUnit`. Cambio contenido en `src/engine/` — sin tocar `src/game/` ni stores.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: N/A — `attackType`/`attackRange`/`areaRadius` viven en `src/data/cats.ts` (contenido), no en Dexie.

**Testing**: Vitest sobre `src/engine/` — mismo patrón que `tests/unit/engine/{collision,combat,simulation}.test.ts`.

**Target Platform**: Navegador (sin cambio).

**Project Type**: Web app single-project.

**Performance Goals**: mantiene SC-003 de `specs/002-motor-de-combate` (60fps, 10+ unidades) — la búsqueda de objetivos en rango sigue siendo O(n²) en el peor caso, igual de orden que la búsqueda actual de `alive.find(...)`, sin degradar el costo asintótico.

**Constraints**: `stepSimulation`/nuevas funciones de targeting DEBEN seguir siendo puras, sin `Date.now()` ni I/O.

**Scale/Scope**: extensión de `collision.ts`, `combat.ts`, `simulation.ts`, `types.ts`, `data/cats.ts`.

## Constitution Check

- **§ I Combate Automático por Despliegue**: no cambia el ciclo despliegue/energía/autonomía, solo cómo se eligen objetivos y se reparte daño — cumple.
- **§ IV Balance Dirigido por Datos**: `attackType`/`attackRange`/`areaRadius` viven en `src/data/cats.ts`, nunca hardcodeados en `src/engine/` — cumple.
- **§ VI Separación Motor/UI**: todo el cambio de comportamiento vive en `src/engine/` como funciones puras adicionales; `src/game/UnitSprite.tsx` no necesita saber de `attackType` para renderizar (usa `state`/`attackCooldownRemaining` como ya hace) — cumple.
- **§ VII Simplicidad/YAGNI**: 3 tipos fijos, sin sistema de reglas configurable genérico — la complejidad añadida a `src/engine/` es la mínima necesaria para expresar Área/Larga Distancia y está justificada por ser el objetivo explícito de esta spec (ver Complexity Tracking).

## Project Structure

### Documentation (this feature)

```text
specs/008-tipos-de-ataque/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/cats.ts               # Cat += attackType, attackRange, areaRadius?
├── engine/
│   ├── types.ts                # BattleUnit += attackType, attackRange, areaRadius?
│   ├── collision.ts            # + withinRange1D(a, b, range): boolean (generaliza overlaps1D con un margen)
│   ├── combat.ts               # resolveEngagement → acepta múltiples defensores (Area); nueva resolveAreaEngagement(attacker, defenders[], deltaSeconds)
│   └── simulation.ts           # stepSimulation: fase de detección de objetivos generalizada — findTargetsInRange(unit, candidates) según attackType
└── data/cats.ts / levels.ts    # sin cambios de esquema adicionales
```

**Key Design Decision** (equivalente a research.md, embebido aquí por alcance de esta spec):

1. **Detección de objetivos**: se reemplaza `alive.find((candidate) => ... && overlaps1D(unit, candidate))` por `findTargetsInRange(unit, alive)`, que:
   - Para `'Single'`/`'Area'`: busca candidatos que se superponen (`overlaps1D`, comportamiento actual, `attackRange` efectivo = 0 más allá del propio `width`).
   - Para `'LongRange'`: busca candidatos dentro de `attackRange` (distancia entre bordes, no solo superposición) y selecciona el **más lejano** de ellos (Assumption de spec.md).
   - El resultado sigue determinando si la unidad quede `Engaged` (deja de avanzar) — una unidad `LongRange` se detiene al tener *cualquier* enemigo dentro de `attackRange`, no solo al tocarlo.
2. **Aplicación de daño**: `'Single'`/`'LongRange'` dañan solo al objetivo elegido (mismo `resolveEngagement` de hoy, sin cambios de firma). `'Area'` daña al objetivo elegido y a todo enemigo adicional cuya distancia al objetivo sea `<= areaRadius`, todos en el mismo tick de cooldown vencido del atacante (nueva `resolveAreaEngagement`).
3. **Compatibilidad retroactiva**: con `attackType: 'Single'` y `attackRange` igual al comportamiento de superposición actual, el resultado de `stepSimulation` es idéntico al de hoy — garantiza que la suite existente de `specs/002-motor-de-combate` siga en verde sin modificarse.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| `simulation.ts` gana una fase de targeting generalizada (en vez de "primer oponente que se superpone") | Es el requisito central de la spec (FR-004/FR-005) — Área y Larga Distancia no son expresables solo con datos sobre el motor actual | Mantener el motor sin cambios y simular Área/Larga Distancia solo visualmente (en `src/game/`) violaría Constitución § VI (el daño real debe decidirse en el motor, no en la capa de render) |
