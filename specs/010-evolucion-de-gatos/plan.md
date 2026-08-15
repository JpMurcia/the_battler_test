# Implementation Plan: Evolución de Gatos

**Branch**: `010-evolucion-de-gatos` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-evolucion-de-gatos/spec.md`

## Summary

Añadir `evolutions` a `Cat`, `evolutionStage`/`evolutionItems` a `useMetaStore` (persistidos en Dexie, versión 4), `evolveCat(catId)` con validación secuencial nivel+ítem, y aplicar el multiplicador de stats en `useGameStore.deployUnit` — la identidad visual por forma sale gratis de `specs/003-identidad-visual-animada` cambiando de dónde `UnitSprite` lee el perfil.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: Dexie — nueva tabla `evolutionItems` (fila singleton `{ id: 1; counts: Record<string, number> }`), `db.version(4)`; `ownedCats` gana el campo `evolutionStage` (Dexie no requiere migración de datos para campos nuevos con default en la capa de aplicación, ya que `OwnedCatRow` es forward-compatible: filas viejas sin el campo se tratan como `'Base'` al leer).

**Testing**: Vitest — `useMetaStore.evolveCat` con `fake-indexeddb`; `getVisualProfile`/`UnitSprite` (ya cubiertos por `specs/003`) extendidos con un caso de stats evolucionados.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio.

**Constraints**: `deployUnit` sigue siendo la única fuente de verdad para stats efectivos de un `BattleUnit` recién creado — ni `src/engine/` ni `src/game/` vuelven a mirar `Cat` por separado para decidir stats en tiempo real.

**Scale/Scope**: extensión de `data/cats.ts`, `state/useMetaStore.ts`, `state/useGameStore.ts`, `db/index.ts`, `game/UnitSprite.tsx`.

## Constitution Check

- **§ III Identidad Visual Animada**: cada forma produce un perfil visual distinto sin arte nuevo, reutilizando el mecanismo ya validado por `specs/003-identidad-visual-animada` — cumple sin coste adicional.
- **§ IV Balance Dirigido por Datos**: `evolutions` vive en `src/data/cats.ts` — cumple.
- **§ V Persistencia Local-First**: `evolutionStage`/`evolutionItems` persisten en Dexie, sin backend — cumple.
- **§ VI Separación Motor/UI**: el multiplicador se aplica una sola vez al crear el `BattleUnit` en `deployUnit` (capa de estado, no motor puro) — `src/engine/` sigue operando solo sobre los stats ya resueltos del `BattleUnit`, sin conocer evolución — cumple.
- **§ VII Simplicidad/YAGNI**: sin sistema de inventario general, sin fórmulas de evolución complejas — cumple.

## Project Structure

### Documentation (this feature)

```text
specs/010-evolucion-de-gatos/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── data/cats.ts             # Cat += evolutions?: { second: EvolutionFormData; true: EvolutionFormData }
├── db/index.ts               # OwnedCatRow += evolutionStage; + tabla evolutionItems (versión 4)
├── state/useMetaStore.ts     # ownedCats entries += evolutionStage; + evolutionItems; + evolveCat(catId): boolean
├── state/useGameStore.ts     # deployUnit: aplica hpMultiplier/damageMultiplier de la etapa vigente al crear BattleUnit
└── game/UnitSprite.tsx        # getVisualProfile ya no recibe el Cat estático — recibe un objeto derivado de los stats efectivos del BattleUnit (hp/damage/speed/width ya en el propio BattleUnit)
```

**Key Design Decision** (embebido, equivalente a research.md):

1. **Punto único de aplicación del multiplicador**: solo `deployUnit` (jugador) y `spawnEnemyUnit` (enemigos, sin evolución en esta spec — los enemigos no tienen `ownedCats`) leen `evolutions`; `src/engine/` nunca vuelve a mirar `Cat`, solo opera sobre el `BattleUnit` ya resuelto — evita duplicar la lógica de evolución en el motor.
2. **Reutilización de `getVisualProfile`**: hoy recibe un `Cat` completo pero solo lee `width`/`hp`/`speed`/`damage`/`attackIntervalSeconds` (ver `src/game/animation.ts`). Como `BattleUnit` ya tiene esos mismos campos con los valores efectivos (post-evolución), `UnitSprite` construye un objeto `Pick<Cat, 'width'|'hp'|'speed'|'damage'|'attackIntervalSeconds'>` a partir del `BattleUnit` en vez de buscar el `Cat` estático — cambio de una línea, sin tocar la firma de `getVisualProfile`.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
