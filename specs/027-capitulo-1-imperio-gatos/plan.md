# Implementation Plan: Contenido — Capítulo 1 de Imperio de los Gatos

**Branch**: `027-capitulo-1-imperio-gatos` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/027-capitulo-1-imperio-gatos/spec.md`

## Summary

Puebla el catálogo con 14 gatos jugables nuevos (10 Normal + 3 Especial + 1 de recompensa de arco), 16 enemigos nuevos (15 + jefe final) y 48 niveles nuevos agrupados en un `SagaArc` y un `TreasureSet` propios. Es autoría de contenido pura: cero archivos de `src/engine/` ni `src/state/` se tocan — solo `src/data/cats.ts`, `src/data/levels.ts`, `src/data/sagaArcs.ts` y `src/data/treasureSets.ts` (extensión aditiva de arreglos ya existentes, sin nuevos campos de tipo). 13 de los 48 niveles (12 hitos de desbloqueo + el nivel del jefe) se autoran a mano; los 35 restantes se generan con una función pura determinista a partir de un roster de enemigos por niveles ("tiers") de aparición — sin `Math.random`, mismo criterio determinista que el resto del contenido del proyecto.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: Ninguna tabla Dexie nueva — todo el contenido de esta spec vive en arreglos estáticos de `src/data/`, igual que el resto del catálogo (`CATS`, `LEVELS`, `SAGA_ARCS`, `TREASURE_SETS`); el progreso del jugador sobre este contenido (`ownedCats`, `completedLevelIds`, `obtainedTreasureIds`, `grantedArcRewardIds`, `grantedTreasureSetIds`) ya persiste vía los mecanismos existentes de `specs/006`/`specs/012`/`specs/013` sin cambios de esquema.

**Testing**: Vitest — tests de datos puros (`tests/unit/data/*.test.ts`, mismo patrón que `tests/unit/data/news.test.ts`) que verifican invariantes de contenido (conteos, unicidad de `id`, `difficulty` no decreciente, referencias válidas entre `Level.firstVictoryUnlockCatId`/`SagaArc.bossCatId`/`enemyWave[].catId` y `CATS`); un test de integración de punta a punta sobre `useMetaStore` que reproduce la Historia 2/3 (superar los 13 niveles hito en orden y verificar `ownedCats`).

**Target Platform**: Navegador.

**Project Type**: Web app single-project (ya establecido).

**Performance Goals**: Sin cambio — 48 niveles y 30 gatos/enemigos más no varían el patrón de acceso de `CATS.find`/`LEVELS.find` (arreglos ya recorridos linealmente hoy con <25 elementos; pasar a ~70/~50 no es un `NEEDS CLARIFICATION`, mismo orden de magnitud).

**Constraints**: Ningún nuevo `catId`/`id` de nivel puede colisionar con los 16 `catId` ni los 3 `Level.id` ya existentes (`specs/027` FR-014) — se valida por convención de prefijo (`cat-*` para gatos jugables nuevos, `enemy-*` para enemigos nuevos, `imperio-cap1-etapa-N` para niveles) más un test de unicidad.

**Scale/Scope**: +14 `Cat` jugables, +16 `Cat` enemigo (15 + jefe), +48 `Level`, +1 `SagaArc`, +1 `TreasureSet`. Ningún archivo de `src/engine/`, `src/state/`, `src/screens/` ni `src/game/` cambia.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **§ I Combate Automático por Despliegue**: sin cambios — los 14 gatos y 16 enemigos nuevos son datos consumidos por el motor de combate ya existente (`deployUnit`/`spawnEnemyUnit`/`stepSimulation`), sin ninguna regla de combate nueva. Cumple.
- **§ II Progresión por Niveles con Desbloqueo Secuencial**: los 48 niveles se añaden a `LEVELS` en orden — el desbloqueo secuencial ya existente (`getLevelState`, `specs/005`) opera sobre ellos sin cambio de lógica. Cumple.
- **§ III Identidad Visual Animada**: ninguno de los 30 `Cat` nuevos declara `spriteKey` — todos usan el *fallback* procedural ya establecido (`getVisualProfile` deriva cuerpo/animación de `hp`/`damage`/`width`/`attackType` en tiempo de combate, `specs/003`/`specs/010`/`specs/021` FR-011); cumplen el requisito de "movimiento + ataque animados" sin necesitar arte nuevo por unidad. Cumple, sin excepción que declarar.
- **§ IV Balance Dirigido por Datos**: 100% del contenido nuevo vive en `src/data/` (`cats.ts`, `levels.ts`, `sagaArcs.ts`, `treasureSets.ts`) — ningún valor hardcodeado en `src/engine/`. Cumple.
- **§ V Persistencia Local-First**: no se persiste ningún dato de *contenido* (los 48 niveles son código estático, no guardado); el progreso del jugador sobre ellos reutiliza los campos ya persistidos de `specs/006`/`specs/012`/`specs/013` sin ninguna tabla Dexie nueva. Cumple.
- **§ VI Separación Motor/UI**: no se toca ni `src/engine/` ni ningún componente de React/Pixi — pura adición de datos consumidos por el código ya existente en ambas capas. Cumple.
- **§ VII Simplicidad/YAGNI**: *ver Complexity Tracking* — 48 niveles es una expansión de alcance significativa frente a la "vertical slice" original, pero está justificada explícitamente: `specs/012`/`specs/013` ya declararon la población completa de contenido como "trabajo posterior, fuera de esta spec", y esta es esa spec de seguimiento, pedida explícitamente por el usuario.

## Project Structure

### Documentation (this feature)

```text
specs/027-capitulo-1-imperio-gatos/
├── plan.md              # Este archivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── spec.md
└── tasks.md              # Fase 2 (/speckit-tasks, no generado por /speckit-plan)
```

### Source Code (repository root)

```text
src/
└── data/
    ├── cats.ts           # + 14 Cat jugables, + 16 Cat enemigo (append a CATS, sin tocar los 16 catId existentes)
    ├── levels.ts          # + 48 Level (append a LEVELS): 13 hito a mano + 35 por función generadora pura
    ├── sagaArcs.ts        # + 1 SagaArc nuevo (append a SAGA_ARCS, sin tocar arco-1/arco-2)
    └── treasureSets.ts    # + 1 TreasureSet nuevo (append a TREASURE_SETS)

tests/unit/data/
├── cats.test.ts          # nuevo: unicidad de id/name, referencias de abilities válidas
└── levels.test.ts        # nuevo: unicidad de id/mapPosition/treasureId, difficulty no decreciente,
                            # firstVictoryUnlockCatId/bossCatId resuelven a un catId real
```

**Structure Decision**: extensión puramente aditiva de 4 archivos de datos ya existentes — sin pantallas, componentes, store actions ni tablas Dexie nuevas. No se crea ningún archivo `src/data/` adicional porque los 4 catálogos afectados (gatos, niveles, arcos, sets de tesoro) ya tienen su archivo propio desde specs anteriores.

## Key Design Decisions

1. **35 de los 48 niveles se generan con una función pura, no se tipean a mano**: una función `buildImperioCap1TemplateLevel(stageIndex)` (privada a `levels.ts`) calcula `difficulty`/`energyCost`/`currencyReward`/`enemyBaseHp`/`mapPosition`/`treasureId`/`enemyWave` a partir del índice de etapa (1-48), determinista (sin `Math.random`) — ver `research.md` Decisión 1 y `data-model.md` para la fórmula exacta. Los 13 niveles hito se definen como literales normales (mismo estilo que `level-1`/`level-2` hoy) y se insertan en su índice correspondiente antes de generar el resto.
2. **Ningún `spriteKey` en el contenido nuevo**: se apoya deliberadamente en el fallback procedural ya construido en `specs/003`/`specs/010`/`specs/021` — evita que esta spec de contenido dependa de autoría de arte, y no infringe § III de la Constitución porque ese fallback *es* la animación mínima exigida (ver Constitution Check).
3. **Prefijo de `id` por tipo de contenido**: `cat-*` (gatos jugables nuevos), `enemy-*` (enemigos nuevos, incluido el jefe), `imperio-cap1-etapa-N` (niveles), `tesoro-imperio-cap1-N` (tesoros), `arco-imperio-de-los-gatos-cap1` (arco), `set-imperio-de-los-gatos-cap1` (set) — hace trivial un test de "ningún id nuevo colisiona con `CATS`/`LEVELS` existente" por *substring* además de por igualdad exacta.
4. **`region` propia (`'imperio-de-los-gatos-cap1'`)** en vez de reutilizar `'imperio-de-los-gatos'` (la de `level-1`/`level-2`): evita que el desbloqueo secuencial de `specs/005` (que opera por orden de `LEVELS`, no por `region`) mezcle accidentalmente el nivel 49 potencial de los fixtures con la etapa 1 de este capítulo si `LEVELS` se reordenara en el futuro — documentado aquí porque `Level.region` hoy es metadata descriptiva sin efecto en la lógica de desbloqueo (que es puramente por índice de arreglo), así que esta decisión es una convención de higiene de datos, no un requisito funcional.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| § VII: 48 niveles nuevos en una sola spec, lejos de la "vertical slice" original | El usuario pidió explícitamente poblar el Capítulo 1 completo basándose en el manual técnico; `specs/012`/`specs/013` ya habían declarado por escrito que la población completa de contenido quedaba "fuera de esta spec, autoría posterior" — esta es esa autoría posterior, no una ampliación de alcance no pedida | Poblar solo unos pocos niveles adicionales (p. ej. 5-10) — rechazado porque el pedido explícito fue "Capítulo 1 completo" (48 etapas, tal como lo documenta el manual §8), y un capítulo parcial dejaría el arco sin jefe final ni cierre narrativo |
