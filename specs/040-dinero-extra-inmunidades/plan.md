# Implementation Plan: Catálogo de Habilidades de Combate — Dinero Extra e Inmunidad a Habilidades

**Branch**: `040-dinero-extra-inmunidades` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/040-dinero-extra-inmunidades/spec.md`

## Summary

Extiende `Ability` (`src/engine/types.ts`) con `ExtraMoney`, añade `immuneAbilities` a `Cat`/`BattleUnit` y un campo efímero de crédito de derrota (`defeatBounty`) a `BattleUnit`, y extiende la tubería de un golpe individual que `specs/039` unificó (`applyHit`, `src/engine/combat.ts`) para (1) ignorar Golpe Letal/Killer/Retroceso contra defensores inmunes y (2) marcar, en el golpe letal de una unidad del jugador con Dinero Extra, la energía que ganará el equipo; `stepSimulation` (`src/engine/simulation.ts`) suma esas marcas a la energía del jugador al final de cada paso. Es el mismo patrón aditivo de `specs/015`/`specs/038`/`specs/039`: ningún cambio de arquitectura, ningún sistema nuevo. En la capa de presentación, `UnitDetailPanel` y la Guía de Enemigos muestran el bono y las inmunidades.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: N/A — sin persistencia (la inmunidad y el bono son datos estáticos de `Cat`; `defeatBounty` es estado efímero de `BattleUnit` que muere con la unidad, Constitución § V).

**Testing**: Vitest — `tests/unit/engine/combat.test.ts`/`simulation.test.ts` extendidos con `random` inyectado; `tests/unit/shared/UnitDetailPanel.test.tsx`, `tests/unit/EnemyGuideScreen.test.tsx` y `tests/unit/data/cats.test.ts` extendidos para presentación y datos semilla.

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: sin cambio — cada comprobación nueva es una búsqueda lineal sobre listas de 0-3 elementos por golpe, más un recorrido O(n) por paso sobre las unidades ya presentes en `byId`.

**Constraints**: `src/engine/combat.ts` sigue sin dependencias de `src/data/` ni de `simulation.ts` (Constitución § VI) — el bono de energía viaja en el propio `BattleUnit` derrotado (`defeatBounty`), así que `simulation.ts` no necesita buscar habilidades del atacante ni importar nada nuevo de `combat.ts`. Los `random` de golpes que no involucran las habilidades nuevas no se consumen (FR-009): las secuencias de `random` guionadas de los tests de `specs/016`/`specs/038`/`specs/039` no cambian.

**Scale/Scope**: extensión de `engine/types.ts`, `engine/combat.ts`, `engine/simulation.ts` (`spawnUnitFromCat` + suma de energía), `state/useGameStore.ts` (`deployUnit` copia `immuneAbilities`), `data/cats.ts` (campo nuevo en `Cat`, inmunidad del jefe del Capítulo 1 y 2 gatos semilla), `screens/shared/UnitDetailPanel.tsx`, `screens/EnemyGuideScreen.tsx` y un módulo pequeño de etiquetas compartidas.

## Constitution Check

- **§ IV Balance Dirigido por Datos**: el bono de energía y la lista de inmunidades viven como datos en `src/data/cats.ts` — cumple.
- **§ VI Separación Motor/UI**: todo el comportamiento nuevo vive en `src/engine/` (funciones puras, sin canvas/DOM); `UnitDetailPanel` y la Guía de Enemigos solo leen datos del catálogo — cumple. El HUD ya refleja `energy.current` por selector acotado: el bono se ve sin cambios en Pixi ni en React de batalla.
- **§ VII Simplicidad/YAGNI**: bono fijo por enemigo derrotado (sin "valor de dinero" por enemigo ni multiplicadores); inmunidades limitadas a las tres habilidades ofensivas que hoy existen; una sola marca efímera en la unidad derrotada en vez de un registro de eliminaciones — cumple.
- **§ I Combate Automático**: nada da control directo al jugador sobre unidades desplegadas; la energía extra solo cambia cuánto puede desplegar — cumple.
- **§ V Persistencia Local-First**: `defeatBounty` es efímero, nunca se persiste — cumple.

## Project Structure

### Documentation (this feature)

```text
specs/040-dinero-extra-inmunidades/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── spec.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

(Sin `contracts/`: el proyecto no expone interfaces externas — el "contrato" de esta feature son los tipos `Ability`/`Cat`/`BattleUnit`, documentados en `data-model.md`.)

### Source Code (repository root)

```text
src/
├── engine/
│   ├── types.ts       # Ability += ExtraMoney; ImmunizableAbilityKind; BattleUnit += immuneAbilities?, defeatBounty?
│   ├── combat.ts       # isImmuneToAbility; applyHit ignora MassiveDamage/TraitKiller/Knockback
│   │                    # contra defensores inmunes (sin consumir el roll) y marca defeatBounty en el golpe letal de un
│   │                    # jugador con ExtraMoney contra un enemigo
│   └── simulation.ts   # spawnUnitFromCat copia immuneAbilities; stepSimulation suma los defeatBounty de los enemigos
│                        # derrotados este paso a energy.current (tope energy.max)
├── state/
│   └── useGameStore.ts # deployUnit copia immuneAbilities del Cat
├── screens/
│   ├── shared/
│   │   ├── abilityLabels.ts    # nuevo: describeImmunities(immuneAbilities) — etiquetas "Golpe Letal"/"Killer"/"Retroceso"
│   │   └── UnitDetailPanel.tsx # describeAbility += ExtraMoney; fila "Inmune a: …" si la unidad declara inmunidades
│   └── EnemyGuideScreen.tsx    # línea "Inmune a: …" por enemigo enfrentado que declara inmunidades
└── data/
    └── cats.ts          # Cat += immuneAbilities?; enemy-la-mascara inmune a las tres; gatos semilla wallet-cat y anchor-cat
```

**Structure Decision**: extensión aditiva de los módulos de `src/engine/` que ya implementan `MassiveDamage`/`TraitKiller`/`Knockback` y de las dos pantallas que ya muestran habilidades/enemigos; el único archivo nuevo es un módulo de etiquetas compartidas (evita duplicar los nombres de habilidad entre las dos pantallas).

## Key Design Decisions

Ver `research.md` para el detalle de cada decisión — resumen:

1. `immuneAbilities` es una lista propia (no se mezcla con `immuneEffects`): son dominios distintos (efectos de estado transferidos on-hit vs. habilidades ofensivas evaluadas en el golpe) y mezclarlos obligaría a ensanchar un tipo (`EffectType[]`) que hoy comprueba `applyOnHitEffect`.
2. La inmunidad se evalúa dentro de `applyHit`, en los tres puntos donde cada habilidad ofensiva decide si se resuelve — si el defensor es inmune, la habilidad se trata como "no declarada" para ese golpe: no multiplica/elimina/desplaza y no consume su `random()` (FR-006).
3. El crédito de una derrota se fija en el propio golpe letal: `applyHit` escribe `defender.defeatBounty = energyBonus` cuando una unidad del jugador con `ExtraMoney` activo (no `Cursed` en ese instante) deja a un enemigo en `hp <= 0` tras Sobrevivir. Así el motor no necesita saber "quién mató a quién" ni buscar al atacante después, y la maldición se evalúa en el instante exacto del golpe (no al final del paso, donde un contraataque simultáneo podría haberla aplicado).
4. `stepSimulation` suma los `defeatBounty` de todas las unidades enemigas en `Dead` este paso y los aplica a `energy.current` con tope `energy.max` — una sola escritura de energía por paso, antes de construir el estado siguiente.
5. La inmunidad no se ve afectada por `Curse` (FR-007), igual que `immuneEffects`; Dinero Extra sí (FR-003), igual que el resto de habilidades que "se aplican".
6. Las etiquetas de habilidad para la presentación viven en un módulo compartido pequeño (`abilityLabels.ts`), usado por `UnitDetailPanel` y la Guía de Enemigos.

## Complexity Tracking

*Sin violaciones — tabla omitida.*
