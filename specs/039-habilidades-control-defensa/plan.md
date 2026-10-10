# Implementation Plan: Catálogo de Habilidades de Combate — Fortalecer, Esquivar, Sobrevivir y Retroceso

**Branch**: `039-habilidades-control-defensa` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/039-habilidades-control-defensa/spec.md`

## Summary

Extiende `Ability` (`src/engine/types.ts`) con cuatro miembros nuevos — `Strengthen`, `Dodge`, `Survive`, `Knockback` — y extiende `src/engine/combat.ts` para resolverlos, mismo patrón aditivo ya usado por `TraitResistance` (`specs/015`), `Critical`/`MultiHit` (`specs/016`) y `MassiveDamage`/`TraitKiller`/`Shield` (`specs/038`). A diferencia de `specs/038`, no requiere campos nuevos en `BattleUnit` ni cambios en los puntos de creación de unidad: las cuatro se derivan de `abilities`, `hp`, `maxHp` y de la posición `x` ya existente. Como las tres reglas por golpe nuevas (Esquivar, Sobrevivir, Retroceso) se suman a las ya existentes, el plan incluye un refactor sin cambio de comportamiento que unifica la tubería de un golpe individual — hoy duplicada entre `applyDamageSequence` y la salpicadura de `resolveAreaEngagement` — en una única función, para que el orden de FR-006 quede codificado en un solo lugar.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: N/A — sin persistencia (las habilidades son datos estáticos de `Cat`; el desplazamiento de Retroceso modifica el `x` efímero de una `BattleUnit`, Constitución § V).

**Testing**: Vitest — `tests/unit/engine/combat.test.ts`/`simulation.test.ts` extendidos con `random` inyectado para hacer determinista cada roll, mismo patrón que `criticalChance` (`specs/016`) y `MassiveDamage`/`TraitKiller` (`specs/038`); `tests/unit/shared/UnitDetailPanel.test.tsx` y `tests/unit/data/cats.test.ts` extendidos para las descripciones y los datos semilla.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio — la tubería por golpe sigue siendo O(1) (cada habilidad nueva es una búsqueda lineal en un `abilities` de pocos elementos, igual que las de `specs/038`).

**Constraints**: `src/engine/combat.ts` sigue sin ninguna dependencia de `src/data/` ni de constantes de `simulation.ts` (Constitución § VI, y evita un ciclo de módulos: `simulation.ts` ya importa `combat.ts`) — el borde del carril que necesita Retroceso para el enemigo llega por un parámetro opcional (`laneLength`), no por un import. Los `random` de golpes que NO declaran las habilidades nuevas no se consumen (FR-009): los tests existentes con secuencias de `random` guionadas deben seguir pasando sin cambios.

**Scale/Scope**: extensión de `engine/types.ts`, `engine/combat.ts` (refactor + 4 habilidades), `engine/simulation.ts` (solo pasa `state.laneLength` a las funciones de combate), `screens/shared/UnitDetailPanel.tsx` (`describeAbility`) y `data/cats.ts` (4 gatos semilla de demostración).

## Constitution Check

- **§ IV Balance Dirigido por Datos**: umbral, multiplicador, probabilidades y distancia viven como datos dentro de `Ability` en `src/data/cats.ts` — cumple.
- **§ VI Separación Motor/UI**: todo el comportamiento nuevo vive en `src/engine/` (funciones puras, sin canvas/DOM); `UnitDetailPanel` solo describe los datos — cumple. Pixi no se modifica: el retroceso es un cambio de `x` que el render ya lee cada tick.
- **§ VII Simplicidad/YAGNI**: ningún campo nuevo en `BattleUnit`; Esquivar/Retroceso son probabilidades por golpe (sin ventana de tiempo de evasión ni retroceso estándar por umbrales); inmunidades y economía de batalla quedan para `specs/040` — cumple. El refactor de la tubería por golpe reduce código (elimina la copia de la salpicadura) en vez de añadirlo.
- **§ I Combate Automático**: el retroceso nunca da control directo al jugador sobre unidades desplegadas; cambia solo la posición de una unidad por una regla de datos — cumple. No altera la regla de "Refuerzo de fila" (`specs/028`): las unidades se siguen re-evaluando cada tick por detección AABB 1D.

## Project Structure

### Documentation (this feature)

```text
specs/039-habilidades-control-defensa/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── spec.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

(Sin `contracts/`: el proyecto no expone interfaces externas — el "contrato" de esta feature es el discriminated union `Ability`, documentado en `data-model.md`.)

### Source Code (repository root)

```text
src/
├── engine/
│   ├── types.ts       # Ability += Strengthen|Dodge|Survive|Knockback (sin campos nuevos en BattleUnit)
│   ├── combat.ts       # findMassiveDamage → findActiveAbility(unit, kind) genérico (bloqueado por Curse);
│   │                    # effectiveDamage += multiplicador de Fortalecer; nueva applyHit(attacker, defender, random, laneLength?)
│   │                    # con el orden de FR-006; applyDamageSequence (bucle MultiHit) y la salpicadura de
│   │                    # resolveAreaEngagement delegan en applyHit; resolveEngagement/resolveAreaEngagement ganan
│   │                    # un parámetro final opcional `laneLength`
│   └── simulation.ts   # stepSimulation pasa state.laneLength a resolveEngagement/resolveAreaEngagement
├── screens/shared/
│   └── UnitDetailPanel.tsx  # describeAbility: 4 casos nuevos + SummonOnDeath explícito (ya no es el "else" implícito)
└── data/
    └── cats.ts          # 4 gatos semilla de demostración: strengthen-cat, dodge-cat, survivor-cat, knockback-cat
```

**Structure Decision**: extensión aditiva de los mismos módulos de `src/engine/` que ya implementan `MassiveDamage`/`TraitKiller`/`Shield`, sin archivos nuevos en `engine/`. `src/state/useGameStore.ts` y `src/engine/simulation.ts::spawnUnitFromCat` NO cambian (a diferencia de `specs/038`, no hay estado inicial nuevo que sembrar).

## Key Design Decisions

Ver `research.md` para el detalle de cada decisión — resumen:

1. Las cuatro se modelan como nuevos miembros de `Ability` (declaradas en `abilities`, evaluadas en combate), no como `EffectType` ni como campos de `BattleUnit` — ninguna tiene una duración que decae ni estado que sobreviva al golpe.
2. Se unifica la tubería de un golpe individual en `applyHit`, usada tanto por la secuencia (`MultiHit`) como por la salpicadura de Área — un único lugar donde vive el orden de FR-006, eliminando la copia que `specs/038` tuvo que mantener sincronizada a mano.
3. Orden por golpe (FR-006): Esquivar del defensor → daño base (Fortalecer × `TraitTargeting` × `TraitResistance` × Debilitar) → `MassiveDamage` → `Critical` → `TraitKiller` o, si no, descuento de escudo y de `hp` → Sobrevivir del defensor → Retroceso del atacante → efectos on-hit. Cada roll solo se consume si la habilidad correspondiente aplica, así que ninguna secuencia de `random` guionada de tests anteriores cambia.
4. Fortalecer vive en `effectiveDamage` (que ya resuelve Debilitar), así que cubre sin código extra el ataque contra unidades, la salpicadura y el ataque contra bases; se evalúa en vivo contra el `hp` del atacante al momento de atacar.
5. Retroceso desplaza `x` dentro de `applyHit` (mismo lugar donde se resuelven todos los efectos de un golpe), con un parámetro opcional `laneLength` para el borde del enemigo; el borde del jugador (`x = 0`) es independiente del nivel.
6. `Curse` suspende las cuatro habilidades mediante el helper genérico `findActiveAbility`; `Shield`/`TraitResistance` (pasivas) siguen sin verse afectadas.
7. El cañón especial no es un golpe de unidad: no pasa por Esquivar/Sobrevivir/Escudo (sin cambios).

## Complexity Tracking

*Sin violaciones — tabla omitida.*
