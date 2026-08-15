# Contract: Esquema de datos de diseño (ScriptableObjects)

Este es el contrato entre "diseño de contenido" (quien ajusta balance/narrativa en el Editor de Unity) y "código" (quien consume esos assets en runtime). Cumple el Principio V — cualquier cambio de balance debe ser posible tocando únicamente estos assets, sin recompilar.

Los campos y reglas de validación completos están en [data-model.md](../data-model.md). Este documento fija el contrato de **dónde viven** y **cómo se referencian** los assets concretos del Capítulo 1, para que `/speckit-tasks` pueda generar tareas de creación de contenido sin ambigüedad:

| Asset | Ruta esperada | Cantidad para Capítulo 1 |
|---|---|---|
| `UnitDefinition` (jugador) | `Assets/ScriptableObjects/Battler/Chapter1/Units/Player/` | 5 |
| `UnitDefinition` (enemigo) | `Assets/ScriptableObjects/Battler/Chapter1/Units/Enemy/` | según diseño de la oleada (≥1) |
| `EnemyWaveDefinition` | `Assets/ScriptableObjects/Battler/Chapter1/EnemyWave.asset` | 1 |
| `DialogueLine` (pre-batalla) | `Assets/ScriptableObjects/Battler/Chapter1/Dialogue/PreBattle/` | ≥1 |
| `DialogueLine` (post-batalla) | `Assets/ScriptableObjects/Battler/Chapter1/Dialogue/PostBattle/` | ≥1 |
| `ChapterDefinition` | `Assets/ScriptableObjects/Battler/Chapter1/Chapter1.asset` | 1 |

**Regla de contrato**: `ChapterDefinition.availableUnits` debe referenciar exactamente los 5 assets de `Units/Player/` (ni más ni menos, ver FR-012); ningún `UnitDefinition` puede dejar `idleAnimation`, `attackAnimation` o `visualVariant` sin asignar — un validador EditMode test (ver research.md #5) falla la build de contenido si detecta referencias nulas en estos tres campos.
