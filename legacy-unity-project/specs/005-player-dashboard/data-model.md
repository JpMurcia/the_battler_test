# Data Model: Dashboard de Base del Jugador

Las entidades marcadas **[SO]** son ScriptableObjects (datos de diseño, Principio V). Las marcadas **[Runtime]** son estado calculado en memoria — no se serializan como asset de diseño ni se persisten en disco. El resto son datos de guardado (clases planas `[Serializable]`, mismo patrón que `ProgressSaveData`/`MenuSettings`).

## UnitProgress

Progreso de mejora de una única unidad. Vive en `TheBattler.Model`, anidada dentro de `PlayerProgressSaveData`.

| Campo | Tipo | Descripción |
|---|---|---|
| `unitId` | `string` | Igual valor que `UnitDefinition.UnitId` (001) — clave de vínculo, no una referencia de objeto (mismo criterio que `ChapterProgressRecord.chapterId` en 002). |
| `level` | `int` | Nivel actual de la unidad. Empieza en `1` (nivel base) para cualquier unidad sin mejorar. |
| `experienceInvested` | `int` | Suma acumulada de experiencia gastada en esta unidad a lo largo de todas sus mejoras. |

**Reglas de validación**:
- A lo sumo un `UnitProgress` por `unitId` (igual regla que `ChapterProgressRecord` por `chapterId` en 002).
- `level >= 1` siempre; `experienceInvested >= 0` siempre.
- Se crea (persiste) de forma perezosa: una unidad que nunca se mejoró **no** tiene entrada en `unitProgress[]` — su nivel base (`1`) se asume en tiempo de lectura (ver `PlayerCharacterLevelCalculator` y contracts/unit-leveling.md), igual que 002 solo crea un `ChapterProgressRecord` tras el primer intento resuelto.
- `level` nunca puede superar `UnitLevelingConfig.MaxLevel` (aplicado por `UnitLevelingController.TryLevelUp`, no por esta clase — es una regla de comportamiento, no de forma serializada).

## PlayerExperiencePool

No es una clase propia serializada — es el campo escalar `PlayerProgressSaveData.availableExperience` (ver más abajo). Se documenta como entidad separada aquí porque así la nombra spec.md (Key Entities), pero a nivel de implementación es un `int` en el agregado raíz, igual que `MenuSettings.musicVolume` es un campo escalar y no una clase `Volume` propia.

| Campo (en `PlayerProgressSaveData`) | Tipo | Descripción |
|---|---|---|
| `availableExperience` | `int` | Experiencia acumulada disponible para gastar en mejoras. `>= 0` siempre (clampado al cargar/guardar, mismo criterio que `MenuSettings` clampa volúmenes). |

## PlayerCharacterLevel **[Runtime]**

Valor agregado, calculado bajo demanda por `PlayerCharacterLevelCalculator.Calculate(...)` (ver [contracts/unit-leveling.md](./contracts/unit-leveling.md)). **No se persiste** — spec.md Key Entities lo indica explícitamente.

| Cálculo | Notas |
|---|---|
| `Σ nivel(unit)` para cada `unit` en el roster del jugador (`ChapterDefinition.AvailableUnits`, ver research.md §9) | Para una unidad sin `UnitProgress` guardado, `nivel(unit) = UnitProgress.BaseLevel (1)`. Nunca lanza excepción ni produce un valor indefinido con el roster vacío de `UnitProgress` (Acceptance Scenario 2, Historia 1). |

## TeamFormation

Tampoco es una clase propia serializada — es el campo `PlayerProgressSaveData.activeTeamUnitIds` (ver más abajo), documentado por separado porque así lo nombra spec.md (Key Entities).

| Campo (en `PlayerProgressSaveData`) | Tipo | Descripción |
|---|---|---|
| `activeTeamUnitIds` | `string[]` | Subconjunto de `unitId` (de `UnitDefinition.UnitId`, roster del capítulo) elegido por el jugador como equipo activo para la próxima batalla. |

**Reglas de validación**:
- Nunca se persiste vacío por acción explícita del jugador (FR-010) — la validación vive en `TeamFormationController.TryConfirmFormation` (contracts/team-formation.md), no en esta clase de datos en sí (que solo transporta el valor ya validado, mismo criterio que `MenuSettings.Save` recibe valores "ya confirmados" según 003).
- Un array `null`, vacío, o que tras filtrar por el roster actual queda vacío se trata como "sin equipo activo definido" → equipo por defecto = roster completo (FR-013, Edge Case de spec.md; ver `TeamFormationRosterFilter` en contracts/team-formation.md).
- No se exige que los ids sean únicos como regla dura (una duplicación no tiene efecto — la intersección con el roster los trata igual), pero `TeamFormationController.TryConfirmFormation` deduplica antes de persistir para mantener el archivo limpio.

## UnitLevelingConfig **[SO]**

Curva de costo de mejora, compartida por las unidades del roster actual (ver research.md §2). Vive en `TheBattler.Model`, mismo nivel que `UnitDefinition`/`EnemyWaveDefinition`.

| Campo | Tipo | Descripción |
|---|---|---|
| `maxLevel` | `int` | Nivel máximo alcanzable por cualquier unidad. `>= 2` (si fuera `1`, ninguna mejora sería posible, lo cual no tiene sentido como configuración de diseño). |
| `experienceCostPerLevel` | `int[]` | Longitud `maxLevel - 1`. El índice `i` es el costo de experiencia para subir del nivel `i + 1` al nivel `i + 2` (p. ej. índice `0` = costo de nivel 1→2). |

**Reglas de validación** (ver [contracts/unit-leveling.md](./contracts/unit-leveling.md)):
- `maxLevel >= 2`.
- `experienceCostPerLevel.Length == maxLevel - 1`.
- Todo elemento de `experienceCostPerLevel` es `> 0`.

## PlayerProgressSaveData

Agregado raíz que se serializa a JSON tal cual (mismo patrón que `ProgressSaveData`/`MenuSettings`). Vive en `TheBattler.Model`.

| Campo | Tipo | Descripción |
|---|---|---|
| `formatVersion` | `int` | Versión del esquema de guardado. Empieza en `1`. |
| `unitProgress` | `UnitProgress[]` | Progreso por unidad, uno por cada unidad que el jugador ya mejoró al menos una vez. Vacío en una instalación nueva. |
| `availableExperience` | `int` | Ver `PlayerExperiencePool` arriba. `0` por defecto. |
| `activeTeamUnitIds` | `string[]` | Ver `TeamFormation` arriba. Vacío por defecto (equivale a "sin equipo activo definido", FR-013). |

**Reglas de validación**:
- Un `formatVersion` desconocido, o un JSON que no deserializa a esta forma, se trata como "ausencia de progreso de base" → valores por defecto (`unitProgress` vacío, `availableExperience = 0`, `activeTeamUnitIds` vacío), nunca lanza una excepción hacia quien llama a `Load()` (FR-013, mismo patrón de tolerancia que 002/003).
- Independiente de `ProgressSaveData` (002) y `MenuSettings` (003): archivo propio (`player-progress.json`), ninguno referencia al otro (spec.md Assumptions).

## IPlayerProgressStore (contrato)

Ver [contracts/player-progress-store.md](./contracts/player-progress-store.md) para la interfaz completa.

## UnitLevelingController / TeamFormationController (contratos de comportamiento)

Ver [contracts/unit-leveling.md](./contracts/unit-leveling.md) y [contracts/team-formation.md](./contracts/team-formation.md).

## Relación con entidades existentes

- **`UnitDefinition` (001)**: `UnitProgress.unitId` referencia por valor `UnitDefinition.UnitId` — no se le añade ningún campo nuevo a `UnitDefinition` (no se toca `UnitDefinition.cs`; nivel/experiencia son progreso de jugador, no dato de diseño estático — ver la nota explícita de la asignación de esta tarea). `ChapterDefinition.AvailableUnits` (001) sigue siendo la única fuente de "qué unidades existen"; esta feature no introduce una entidad "unidades poseídas" separada (research.md §9).
- **`ChapterDefinition` (001)**: no se modifica. `PlayerBaseFlowController` la referencia de la misma forma que `BattleStateManager` (campo serializado), para resolver el roster de unidades del dashboard.
- **`BattleStateManager` / `UnitDeploymentController` (001, modificados por 002/003 previamente)**: `BattleStateManager.SetupChapter()` se modifica una vez más (ver research.md §5) para pasar `TeamFormationRosterFilter.Apply(chapterDefinition.AvailableUnits, playerProgress.activeTeamUnitIds)` en vez de `chapterDefinition.AvailableUnits` directo a `UnitDeploymentController.Initialize(...)`. `UnitDeploymentController.Initialize(IBattleResourceSource, IReadOnlyList<UnitDefinition>)` no cambia de firma — ya acepta cualquier lista.
- **`ProgressSaveData` / `IChapterProgressStore` (002)**: sin relación directa; esta feature no lee ni escribe `progress.json`.
- **`MenuSettings` / `IMenuSettingsStore` / `LocalizedTextTable` (003)**: sin dependencia obligatoria; el mecanismo de `LocalizedTextTable` queda disponible para localizar los textos del dashboard si se decide en implementación, pero ninguna FR de esta feature lo exige.
- **`ChapterBannerDefinition` / `AdventureMap` (004, solo planeada, sin código todavía)**: el dashboard se alcanza conceptualmente desde un banner con `HasPlayableDestination == true`; esta feature no depende de que 004 esté implementada en C# (ver research.md §7) — el fondo por banner queda como extensión futura sin impacto en las entidades de este data-model.
