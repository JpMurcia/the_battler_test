# Phase 1 Data Model: Capítulo 2 "Hacia el Futuro"

Esta feature **no introduce ninguna clase C# nueva**. Todas las entidades de abajo son instancias de datos (assets `.asset`) de clases ya existentes e implementadas en `001-chapter1-vertical-slice` (`ChapterDefinition`, `DialogueLine`, `EnemyWaveDefinition`, `UnitDefinition`) — ver `specs/001-chapter1-vertical-slice/data-model.md` para la forma completa de cada clase, que no cambia. Este documento describe únicamente **qué instancias nuevas** aporta el Capítulo 2 y las reglas de contenido específicas que deben cumplir. La única entidad de **otra** feature que cambia es un asset (no una clase) de `004-adventure-map-banners`, documentado al final como integración, no como parte del modelo propio de esta feature.

Las entidades marcadas **[SO]** son ScriptableObjects (Principio V). No hay entidades **[Runtime]** nuevas — el estado en memoria de la partida (`BattleResourceState`, `BaseHealthState`, `DeployedUnitState`, `DeploymentSlotState`) es exactamente el mismo definido por `001-chapter1-vertical-slice/data-model.md`, reutilizado sin cambios de forma para el Capítulo 2.

## Chapter2 **[SO]** (instancia de `ChapterDefinition`, clase de `001`)

| Campo | Valor/regla para esta instancia |
|---|---|
| `chapterId` | `"chapter_2"` — único en el proyecto (distinto de `"chapter_1"`), sigue la misma convención de nombre corto que ya usa `Chapter1.asset` (`chapterId: chapter_1`). Es la clave que `IChapterProgressStore`/`004` usarán para relacionar progreso y banner. |
| `preBattleDialogue` | Lista ordenada de `DialogueLine` nuevas (≥1, FR-001) — ver "Diálogo del Capítulo 2" abajo. |
| `postBattleDialogue` | Lista ordenada de `DialogueLine` nuevas (≥1, FR-002), sin diferenciación estructural por resultado (igual que `001`: `BattleStateManager` solo reproduce diálogo post-batalla en victoria — ver Edge Case de spec.md sobre empate = derrota, y research.md de `001`). |
| `availableUnits` | Las 5 `UnitDefinition` de `001` (`Unit_Arquero`, `Unit_Escudero`, `Unit_Espadachin`, `Unit_Lancero`, `Unit_Mago` — **referenciadas directamente, no duplicadas**) **+** las 2 `UnitDefinition` nuevas de esta feature (`player_unit_6`, `player_unit_7`) = 7 en total (FR-005). |
| `enemyWaves` | Referencia a la `EnemyWaveDefinition` nueva del Capítulo 2 (ver abajo, FR-007). |
| `playerBaseMaxHealth` | `> 0` — valor de balance concreto a definir en autoría de contenido; no fijado por este plan (mismo criterio que `001`, cuyo plan.md tampoco fijó `30`/`40` — esos valores viven solo en el `.asset` final). |
| `enemyBaseMaxHealth` | `> 0` — misma nota que arriba. |

**Regla de contrato**: idéntica a la de `001` (ver [contracts/chapter2-scriptableobject-data-contract.md](./contracts/chapter2-scriptableobject-data-contract.md)) — `availableUnits` debe referenciar exactamente 7 `UnitDefinition` (las 5 de `001` sin modificar + las 2 nuevas), ninguna de las 2 nuevas puede dejar `idleAnimation`/`attackAnimation`/`visualVariant` sin asignar (`HasValidVisualIdentity == true`, Principio III/FR-005a).

## Diálogo del Capítulo 2 (instancias de `DialogueLine`, clase de `001`)

| Campo | Regla |
|---|---|
| `speakerName` | Puede identificar al antagonista nuevo del Capítulo 2 o a un personaje del elenco ya existente reaccionando a él; el nombre concreto del antagonista se autora en `/speckit.tasks`/`/speckit.implement` (Assumptions de spec.md — no se fija aquí). |
| `portrait` | Obligatorio, igual que `001` (Principio I). |
| `text` | No vacío; el guion literal queda fuera de este plan — ver research.md §3 para el rol narrativo que debe cumplir (distinguir el capítulo del Capítulo 1, User Story 3). |

**Regla de contenido narrativo** (FR-006, User Story 3 — no es una regla de forma de dato, es un criterio de contenido): el conjunto de líneas pre y post-batalla debe, en su texto final, dejar identificable que la amenaza de este capítulo es una entidad nueva y distinta del "Imperio de los Test/Robot" del Capítulo 1 — no reutilizar diálogo genérico ni referencias que podrían aplicar a cualquier capítulo. Verificable manualmente en quickstart.md (paso de validación narrativa), no por un test automatizado (es contenido, no lógica).

## Unidades jugables nuevas (instancias de `UnitDefinition`, clase de `001`)

Ver [contracts/new-unit-definitions.md](./contracts/new-unit-definitions.md) para el diseño completo de rol/stats de cada una. Ambas usan exactamente la misma forma de campo que `UnitDefinition` ya define hoy en `001` (`unitId`, `displayName`, `cost`, `cooldownSeconds`, `maxHealth`, `damage`, `range`, `idleAnimation`, `attackAnimation`, `visualVariant`, `team`) — sin ningún campo adicional, porque `AttackType` (`007`) y clasificación (`008`) todavía no existen en `UnitDefinition.cs` (research.md §2).

| Campo | `player_unit_6` (apoyo/dron) | `player_unit_7` (blindado pesado) |
|---|---|---|
| `unitId` | `"player_unit_6"` | `"player_unit_7"` |
| `team` | `Player` | `Player` |
| `idleAnimation`/`attackAnimation`/`visualVariant` | Obligatorios, distintos entre sí (`HasValidVisualIdentity`) | Obligatorios, distintos entre sí |
| `cost`/`cooldownSeconds`/`maxHealth`/`damage`/`range` | `> 0` cada uno — valores de balance concretos a definir en autoría de contenido (mismo criterio que las 5 unidades de `001`) | `> 0` cada uno |

**Nota de compatibilidad hacia adelante** (research.md §2, Assumptions de spec.md): cuando `007-attack-types` y `008-classification-trait-abilities` se implementen en código, estas 2 `UnitDefinition` deserializan sus campos nuevos (`attackType`, `classificationType`, `specialClassificationType`, `traitTargetingAbilities`, `neutralAbilities`, `immunities`) a los valores por defecto de esas specs (`SingleTarget`/`Traitless`/`None`/arrays vacíos) sin ninguna acción manual — exactamente el mismo mecanismo de compatibilidad que esas dos specs ya diseñaron para las 5 `UnitDefinition` de `001`. Esta feature no necesita anticipar esos campos ni dejarlos "reservados".

## Unidad(es) enemiga(s) del Capítulo 2 (instancia de `UnitDefinition`, `team = Enemy`)

| Campo | Regla |
|---|---|
| `unitId` | Único, distinto de `"enemy_unit_1"` (`Unit_EnemyGrunt` de `001`). |
| `team` | `Enemy`. |
| `maxHealth`/`damage` | Mayores que los de `Unit_EnemyGrunt` de `001`, para materializar el escalado de dificultad (research.md §4) — valores exactos de autoría de contenido. |
| `idleAnimation`/`attackAnimation`/`visualVariant` | Recomendado asignarlos (mismo patrón que `Unit_EnemyGrunt`) aunque el Principio III solo los exige para "personaje jugable" — no es un requisito duro de esta spec para unidades enemigas, pero mantiene consistencia visual con `001`. |

No se exige más de 1 `UnitDefinition` enemiga — FR-007 permite reutilizar la misma unidad enemiga en varias `WaveEntry` de la oleada, igual que `001` ya hacía.

## EnemyWave2 **[SO]** (instancia de `EnemyWaveDefinition`, clase de `001`)

| Campo | Regla |
|---|---|
| `waveEntries` | Lista de `WaveEntry { spawnTimeSeconds, unit, lanePosition }` — misma estructura exacta que `Chapter1/EnemyWave.asset` (FR-007, sin campo nuevo). Referencia la(s) `UnitDefinition` enemiga(s) del Capítulo 2 (no las de `001`). Contenido (número de entradas, `spawnTimeSeconds`) autorado para representar mayor amenaza que la oleada de `001` — ver research.md §4. |

## Relación con entidades existentes

- **`ChapterDefinition`/`UnitDefinition`/`EnemyWaveDefinition`/`DialogueLine` (`001`, `TheBattler.Model`)**: sin ningún cambio de forma ni de regla de validación — esta feature solo añade instancias nuevas de esas mismas clases. Las 5 `UnitDefinition` de jugador de `001` se **referencian**, no se duplican, exactamente como `ChapterBannerDefinition.linkedChapter` ya referencia (no duplica) `ChapterDefinition` en `004`.
- **`ProgressSaveData`/`IChapterProgressStore` (`002`)**: sin cambio de forma; tras la primera batalla del Capítulo 2, `progress.json` gana un segundo `ChapterProgressRecord` con `chapterId == "chapter_2"`, mismo mecanismo ya usado para `"chapter_1"`.
- **`ChapterBannerDefinition`/`AdventureMap` (`004`, todavía sin implementar en C#, research.md §2)**: esta feature no depende de que exista para su contenido nuclear. Cuando exista, el segundo elemento de `AdventureMap.Banners` (`Assets/Data/Battler/MainAdventureMap.asset`) debe apuntar a `Chapter2` — ver [contracts/adventure-map-banner-integration.md](./contracts/adventure-map-banner-integration.md). No se define ninguna entidad nueva de `004` aquí — es un cambio de valores sobre un asset que ya pertenece a esa feature.
- **`Region`/extensión de `ChapterBannerDefinition` (`006`, todavía sin implementar en C#)**: cuando exista, el banner del Capítulo 2 debe declarar una `Region` propia (research.md §4) y un `DifficultyRank`/`EnergyCost` — fuera del alcance de esta feature crear esos assets, se documenta como nota de integración futura equivalente a la de `004`, no como una entidad de esta feature.
- **`AttackType` (`007`)/`ClassificationType`/`SpecialClassificationType` (`008`, todavía sin implementar en C#)**: ver "Nota de compatibilidad hacia adelante" arriba — sin acción requerida hoy.

## Diagrama de relaciones (alto nivel)

```text
Chapter2 [SO] (ChapterDefinition, clase de 001)
├── preBattleDialogue: DialogueLine[SO][]      (nuevas, Capítulo 2)
├── postBattleDialogue: DialogueLine[SO][]     (nuevas, Capítulo 2)
├── availableUnits: UnitDefinition[SO][]       (5 de 001, referenciadas sin duplicar + 2 nuevas de esta feature)
└── enemyWaves: EnemyWaveDefinition[SO]        (nueva, misma forma que Chapter1/EnemyWave.asset)
                 └── waveEntries[].unit: UnitDefinition[SO] (Enemy, nueva de esta feature)

Integración (fuera del modelo propio, en el alcance de la feature):
MainAdventureMap.asset (004) → Banners[1].LinkedChapter = Chapter2 [SO]
                              → Banners[1].TargetSceneName = "Chapter2_Battle"
                              → HasPlayableDestination (derivada, 004) pasa false → true
```
