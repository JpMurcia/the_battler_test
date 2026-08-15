# Contract: Esquema de datos de diseño del Capítulo 2 (ScriptableObjects)

Mismo tipo de contrato que [`specs/001-chapter1-vertical-slice/contracts/scriptableobject-data-contract.md`](../../001-chapter1-vertical-slice/contracts/scriptableobject-data-contract.md): fija **dónde viven** y **cómo se referencian** los assets concretos del Capítulo 2, para que `/speckit-tasks` pueda generar tareas de creación de contenido sin ambigüedad. No define ninguna clase nueva — todos los assets de esta tabla son instancias de clases ya implementadas en `001` (`ChapterDefinition`, `UnitDefinition`, `EnemyWaveDefinition`, `DialogueLine`).

| Asset | Ruta esperada | Cantidad para Capítulo 2 |
|---|---|---|
| `UnitDefinition` (jugador, nuevas) | `Assets/ScriptableObjects/Battler/Chapter2/Units/Player/` | 2 (`player_unit_6`, `player_unit_7` — ver [new-unit-definitions.md](./new-unit-definitions.md)) |
| `UnitDefinition` (enemigo, nueva) | `Assets/ScriptableObjects/Battler/Chapter2/Units/Enemy/` | ≥1 |
| `EnemyWaveDefinition` | `Assets/ScriptableObjects/Battler/Chapter2/EnemyWave.asset` | 1 |
| `DialogueLine` (pre-batalla) | `Assets/ScriptableObjects/Battler/Chapter2/Dialogue/PreBattle/` | ≥1 |
| `DialogueLine` (post-batalla) | `Assets/ScriptableObjects/Battler/Chapter2/Dialogue/PostBattle/` | ≥1 |
| `ChapterDefinition` | `Assets/ScriptableObjects/Battler/Chapter2/Chapter2.asset` | 1 |
| Animator Controllers / variantes visuales (Principio III) | `Assets/ScriptableObjects/Battler/Chapter2/PlaceholderArt/` | 2 idle + 2 ataque + 2 variante (una por unidad jugable nueva) |
| Escena de batalla | `Assets/Scenes/Chapter2_Battle.unity` | 1 |

## Regla de contrato: `ChapterDefinition.availableUnits`

`Chapter2.asset.availableUnits` debe referenciar **exactamente 7** `UnitDefinition` de `team = Player` (FR-005):

- Las 5 ya existentes de `001` — referenciadas directamente desde `Assets/ScriptableObjects/Battler/Chapter1/Units/Player/` (`Unit_Arquero`, `Unit_Escudero`, `Unit_Espadachin`, `Unit_Lancero`, `Unit_Mago`). **No se duplican ni se copian** esos assets — la misma instancia se referencia desde dos `ChapterDefinition` distintos (`Chapter1.asset` y `Chapter2.asset`), tal como `UnitDefinition` ya soportaba desde `001` (una unidad no está atada a un único capítulo por diseño).
- Las 2 nuevas de esta feature, en `Assets/ScriptableObjects/Battler/Chapter2/Units/Player/`.

Ninguna de las 2 unidades nuevas puede dejar `idleAnimation`, `attackAnimation` o `visualVariant` sin asignar — el mismo validador EditMode ya usado para las 5 de `001` (`UnitDefinition.HasValidVisualIdentity`) se aplica sin cambios sobre los assets nuevos; un test de validación de datos que recorra todos los `UnitDefinition` del proyecto (no solo los de `Chapter1/`) cubre ambos capítulos con la misma lógica.

## Regla de contrato: escena `Chapter2_Battle.unity`

Replica el cableado de componentes de `Chapter1_Battle.unity` (misma jerarquía de `BattleStateManager`, `BattleResourceController`, `UnitDeploymentController`, `EnemyWaveSpawner`, dos `BaseHealth`, un `DialoguePlaybackController`), con `BattleStateManager.m_ChapterDefinition` apuntando a `Chapter2.asset` en vez de `Chapter1.asset`. Debe registrarse en `ProjectSettings/EditorBuildSettings.asset` (mismo mecanismo ya usado para `MainMenu.unity`/`Chapter1_Battle.unity`) para ser cargable vía `ISceneNavigator.LoadScene("Chapter2_Battle")`.
