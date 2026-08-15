# Phase 1 Data Model: Capítulo 1 — Vertical Slice Jugable

Todas las entidades marcadas **[SO]** son ScriptableObjects (datos de diseño, Principio V). Las marcadas **[Runtime]** son estado en tiempo de ejecución (MonoBehaviour u objeto plano en memoria), no se serializan como asset de diseño.

## UnitDefinition **[SO]**

Representa una de las 5 unidades jugables (o una unidad enemiga reutilizando la misma estructura).

| Campo | Tipo | Regla de validación |
|---|---|---|
| `unitId` | string | único dentro del `ChapterDefinition` que la referencia |
| `displayName` | string | no vacío |
| `cost` | int | > 0 |
| `cooldownSeconds` | float | > 0 |
| `maxHealth` | int | > 0 |
| `damage` | int | > 0 |
| `range` | float | > 0 |
| `idleAnimation` | referencia a Animator/clip | obligatoria (FR-008) |
| `attackAnimation` | referencia a Animator/clip | obligatoria y distinta de `idleAnimation` (FR-008) |
| `visualVariant` | referencia a sprite/prefab de accesorio | obligatoria — al menos una variante (FR-009) |
| `team` | enum `{Player, Enemy}` | determina hacia qué base avanza y a qué bando ataca |

**Relaciones**: referenciada por `ChapterDefinition.availableUnits` (unidades del jugador) y por `EnemyWaveDefinition` (unidades enemigas).

## EnemyWaveDefinition **[SO]**

Describe cómo el bando enemigo genera amenaza a lo largo de la batalla (ver research.md #2).

| Campo | Tipo | Regla de validación |
|---|---|---|
| `waveEntries` | lista de `WaveEntry { spawnTimeSeconds: float, unit: UnitDefinition (team=Enemy), lanePosition: float }` | `spawnTimeSeconds` ≥ 0; lista no vacía |

**Relaciones**: referenciada por `ChapterDefinition.enemyWaves`; cada `WaveEntry.unit` es un `UnitDefinition` con `team = Enemy`.

## DialogueLine **[SO]**

Una línea individual de diálogo pre o post-batalla.

| Campo | Tipo | Regla de validación |
|---|---|---|
| `speakerName` | string | puede estar vacío (narración sin hablante) |
| `portrait` | Sprite | obligatorio (Principio I: retrato + texto) |
| `text` | string (localizable) | no vacío |

**Relaciones**: agrupada en listas ordenadas dentro de `ChapterDefinition.preBattleDialogue` y `ChapterDefinition.postBattleDialogue`.

## ChapterDefinition **[SO]**

Agrupa todo el contenido del Capítulo 1: qué unidades hay disponibles, cómo amenaza el enemigo, y qué diálogo lo envuelve.

| Campo | Tipo | Regla de validación |
|---|---|---|
| `chapterId` | string | único en el proyecto |
| `preBattleDialogue` | lista ordenada de `DialogueLine` | no vacía (FR-001) |
| `postBattleDialogue` | lista ordenada de `DialogueLine` | no vacía (FR-002) |
| `availableUnits` | lista de `UnitDefinition` (team=Player) | exactamente 5 para esta slice (FR-012, Assumptions) |
| `enemyWaves` | `EnemyWaveDefinition` | obligatorio (FR-011) |
| `playerBaseMaxHealth` | int | > 0 |
| `enemyBaseMaxHealth` | int | > 0 |

## BattleResourceState **[Runtime]**

Estado del recurso (Energía/Dinero) durante la partida en curso.

| Campo | Tipo | Notas |
|---|---|---|
| `currentAmount` | float | arranca en 0 al iniciar la batalla (Acceptance Scenario 1, US1) |
| `regenPerSecond` | float | mejorable durante la partida (constitución, Principio II) — valor base viene de `ChapterDefinition` o config de balance separada |

**Transiciones**: `currentAmount` incrementa continuamente con `regenPerSecond`; decrementa en `cost` de la `UnitDefinition` desplegada al pasar la validación de `UnitDeploymentController` (FR-004).

## BaseHealthState **[Runtime]**

Estado de salud de la base del jugador o la enemiga.

| Campo | Tipo | Notas |
|---|---|---|
| `owner` | enum `{Player, Enemy}` | |
| `currentHealth` | int | inicializado desde `ChapterDefinition.playerBaseMaxHealth` / `enemyBaseMaxHealth` |
| `maxHealth` | int | copiado de `ChapterDefinition` al iniciar |

**Transiciones de estado** (FR-006, FR-007, Edge Case de empate en el mismo tick):
`InProgress` → (`currentHealth` del enemigo llega a 0) → `Victory`
`InProgress` → (`currentHealth` del jugador llega a 0) → `Defeat`
Si ambas llegan a 0 en el mismo tick, se resuelve como `Defeat` (prioridad de resolución del enemigo, según Edge Cases de spec.md).

## DeployedUnitState **[Runtime]**

Instancia en curso de una `UnitDefinition` ya spawneada en el carril.

| Campo | Tipo | Notas |
|---|---|---|
| `sourceDefinition` | `UnitDefinition` | de dónde salieron sus stats |
| `currentHealth` | int | inicializado a `sourceDefinition.maxHealth` |
| `lanePosition` | float | avanza mientras no haya objetivo en rango |

**Nota**: el cooldown de despliegue NO es un campo de `DeployedUnitState` — vive únicamente en `DeploymentSlotState.cooldownRemaining` (una instancia desplegada ya gastó su cooldown al spawnear; lo que queda en cooldown es el *slot* de la unidad para volver a desplegarse).

## DeploymentSlotState **[Runtime]**

Uno por cada una de las 5 unidades disponibles del jugador; controla si esa unidad puede volver a desplegarse.

| Campo | Tipo | Notas |
|---|---|---|
| `unit` | `UnitDefinition` | referencia fija durante toda la batalla |
| `cooldownRemaining` | float | cuenta regresiva desde `unit.cooldownSeconds` tras cada despliegue (Acceptance Scenario 3, US1) |
| `isAvailable` | bool derivado | `true` cuando `cooldownRemaining <= 0` y `BattleResourceState.currentAmount >= unit.cost` |

## Diagrama de relaciones (alto nivel)

```text
ChapterDefinition [SO]
├── preBattleDialogue: DialogueLine[SO][]
├── postBattleDialogue: DialogueLine[SO][]
├── availableUnits: UnitDefinition[SO][]   (5, team=Player)
└── enemyWaves: EnemyWaveDefinition[SO]
                 └── waveEntries[].unit: UnitDefinition[SO] (team=Enemy)

En runtime, al iniciar la batalla:
ChapterDefinition → instancia → BattleResourceState, BaseHealthState (x2), DeploymentSlotState (x5)
UnitDefinition (vía despliegue o wave) → instancia → DeployedUnitState
```
