# Data Model: Saga "Imperio de los Gatos"

Convención: los tipos marcados **(existente)** ya están implementados y solo describen los campos nuevos que esta feature añade; los marcados **(nuevo)** no existen todavía. Todos los campos nuevos sobre `ScriptableObject`/clases `[Serializable]` ya implementados se añaden sin `FormerlySerializedAs` (no son renombrados) y con inicializadores por defecto seguros, siguiendo el precedente de `007`/`008`/`009`/`012` sobre `UnitDefinition` — ver research.md §8 y §12.

## SagaArcDefinition (nuevo, ScriptableObject)

Agrupa un conjunto ordenado de niveles ya existentes (`ChapterDefinition`) bajo los multiplicadores de un arco de la saga "Imperio de los Gatos". Deliberadamente **no** se llama `ChapterDefinition` ni `ChapterDataSO` para evitar colisión con el `ChapterDefinition` ya existente, que en este proyecto significa "un nivel/batalla" (`001`), no "un arco de 48 niveles".

| Campo | Tipo | Notas |
|---|---|---|
| `ArcId` | `string` | Identificador estable (`"empire_of_cats_ch1"`, etc.), mismo rol que `ChapterDefinition.ChapterId`. |
| `DisplayNameKey` | `string` | Clave de localización, mismo patrón que `ChapterBannerDefinition.DisplayNameKey`. |
| `UnitCostMultiplier` | `float` (`[Min(0f)]`) | Aplicado en `UnitDeploymentController.TryDeploy` (research.md §1). `1.0` = sin cambio. |
| `EnemyStrengthMultiplier` | `float` (`[Min(0f)]`) | Aplicado al construir el `UnitCombatProfile` de cada enemigo generado en un nivel de este arco (research.md §1). `1.0` = sin cambio. |
| `Levels` | `ChapterDefinition[]` | Orden = orden narrativo del arco. Cada entrada ya existe como asset independiente (reutilizado, no duplicado). |
| `BossLevel` | `ChapterDefinition` | DEBE ser uno de `Levels` (validado en `IsValid`, no enforced en runtime). Documenta cuál nivel es el final del arco (FR-004); el motor de combate no necesita saberlo (research.md §11). |
| `ArcCompletionUnitUnlocks` | `UnitDefinition[]` | Unidades otorgadas cuando `SagaArcProgressEvaluator.IsArcCompleted` pasa a `true` por primera vez (FR-005). |
| `ArcCompletionFeatureFlags` | `string[]` | Ids de feature-flag desbloqueados al completar el arco (p. ej. `"legend_stages"`, `"cat_combos"`, `"sharpened_claws_dojo"`, `"ototo_equipment"`, `"fruit_system"`). Este plan solo persiste el hecho de que fueron otorgados (`SagaArcProgressRecord.rewardsGranted`); la mecánica interna de cada sistema queda fuera de alcance (spec.md Assumptions). |

**Validación** (`IsValid`, mismo patrón que `ChapterBannerDefinition.IsValid`): `ArcId`/`DisplayNameKey` no vacíos; `Levels.Length > 0`; `BossLevel` está contenido en `Levels`; `UnitCostMultiplier >= 0` y `EnemyStrengthMultiplier >= 0`.

## ChapterDefinition (existente — `Assets/Scripts/Model/Battler/ChapterDefinition.cs`) — campos nuevos

| Campo nuevo | Tipo | Default | Notas |
|---|---|---|---|
| `m_MaxSimultaneousEnemies` | `int` (`[Min(0)]`) | `0` | `0` = sin límite (preserva `Chapter1`/`Chapter2`). Consultado por `EnemyWaveSpawner` (research.md §3). |
| `m_HealthThresholdWaveTriggers` | `HealthThresholdWaveTrigger[]` | `Array.Empty<...>()` | Ver tipo nuevo abajo. |
| `m_TreasureRewardId` | `string` | `""` | Vacío = sin tesoro. Notificado por evento en cada victoria (research.md §7), no persistido. |
| `m_XpReward` | `int` (`[Min(0)]`) | `0` | Sumado a `PlayerProgressSaveData.availableExperience` en cada victoria. |
| `m_FirstClearUnitUnlock` | `UnitDefinition` | `null` | `null` = sin desbloqueo de unidad en primera victoria (FR-009). |
| `m_ZombieOutbreakWave` | `EnemyWaveDefinition` | `null` | `null` = el nivel no admite Brote Zombi (FR-015). |

## HealthThresholdWaveTrigger (nuevo, `[Serializable] struct`, mismo patrón que `EnemyWaveDefinition.WaveEntry`)

| Campo | Tipo | Notas |
|---|---|---|
| `ThresholdPercent` | `float` (`[Range(0f, 1f)]`) | Porcentaje de vida de la base enemiga (0-1) que dispara la oleada de refuerzo al ser cruzado hacia abajo. |
| `ReinforcementWave` | `EnemyWaveDefinition` | Oleada a generar cuando se cruza el umbral. Reutiliza la forma ya existente de `EnemyWaveDefinition`/`WaveEntry` — sin un tipo de oleada nuevo. |

## UnitDefinition (existente — `Assets/Scripts/Model/Battler/UnitDefinition.cs`) — campo nuevo

| Campo nuevo | Tipo | Default | Notas |
|---|---|---|---|
| `m_Rarity` | `UnitRarity` (nuevo enum) | `Normal` (miembro 0) | Metadata de presentación (FR-017), sin lógica de obtención asociada (research.md §12). |

## UnitRarity (nuevo enum)

`Normal, Special, Rare, SuperRare, UberRare, Legend, Collaboration` — `Normal` DEBE seguir siendo el miembro 0 (mismo criterio de migración que `ClassificationType.Traitless`).

## UnitCombatProfile (existente — `Assets/Scripts/Model/Battler/UnitCombatProfile.cs`) — helper nuevo

Nuevo método estático `UnitCombatProfile.Scaled(UnitCombatProfile source, float multiplier)`, sin cambiar la clase (sigue inmutable, sin setters):

```csharp
public static UnitCombatProfile Scaled(UnitCombatProfile source, float multiplier)
{
    if (Mathf.Approximately(multiplier, 1f)) return source;
    int damage = Mathf.Max(1, Mathf.RoundToInt(source.Damage * multiplier));
    int maxHealth = Mathf.Max(1, Mathf.RoundToInt(source.MaxHealth * multiplier));
    return new UnitCombatProfile(source.IdleAnimation, source.AttackAnimation, source.VisualVariant, damage, maxHealth);
}
```

Redondeo consistente con spec.md Assumptions ("redondeo al entero más cercano de la moneda del juego"), aplicado igual a vida/daño de enemigo. El mismo criterio de redondeo (`Mathf.RoundToInt`, piso `1`) se usa para el costo de despliegue en `UnitDeploymentController.TryDeploy`.

## UnitUnlockCatalog (nuevo, ScriptableObject)

| Campo | Tipo | Notas |
|---|---|---|
| `Entries` | `UnitUnlockEntry[]` | Ver tipo abajo. |

Método `UnitDefinition Resolve(string unitId)` — recorre `Entries` buscando `UnitId` igual (`StringComparison.Ordinal`, mismo criterio que `LocalChapterProgressStore`); `null` si no existe.

### UnitUnlockEntry (nuevo, `[Serializable]`)

| Campo | Tipo | Notas |
|---|---|---|
| `UnitId` | `string` | DEBE coincidir con el `UnitId` de la `UnitDefinition` referenciada (validado, no enforced en runtime). |
| `Unit` | `UnitDefinition` | La unidad real a desbloquear. |

## ProgressSaveData (existente — `Assets/Scripts/Model/Battler/ProgressSaveData.cs`) — campo nuevo

| Campo nuevo | Tipo | Default | Notas |
|---|---|---|---|
| `arcs` | `SagaArcProgressRecord[]` | `Array.Empty<...>()` | Aditivo, sin bump de `formatVersion` (research.md §8). |

## SagaArcProgressRecord (nuevo, `[Serializable]`, mismo estilo que `ChapterProgressRecord`)

| Campo | Tipo | Notas |
|---|---|---|
| `arcId` | `string` | Coincide con `SagaArcDefinition.ArcId`. |
| `rewardsGranted` | `bool` | `true` una vez que `SagaArcDefinition.ArcCompletionUnitUnlocks`/`ArcCompletionFeatureFlags` ya fueron otorgados (research.md §5). `isCompleted` del arco NO se persiste — se deriva de `ProgressSaveData.chapters` vía `SagaArcProgressEvaluator`. |

## PlayerProgressSaveData (existente — `Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs`) — campo nuevo

| Campo nuevo | Tipo | Default | Notas |
|---|---|---|---|
| `unlockedBonusUnitIds` | `string[]` | `Array.Empty<string>()` | Ids resueltos contra `UnitUnlockCatalog` para calcular `PlayerBaseFlowController.OwnedUnits` (research.md §6). Aditivo, sin bump de `formatVersion`. |

## IChapterProgressStore (existente — `Assets/Scripts/Model/Battler/IChapterProgressStore.cs`) — cambios de firma

```csharp
public interface IChapterProgressStore
{
    ProgressSaveData Load();

    // Cambiado de void a bool: true = esta llamada transicionó isCompleted de false a true
    // (primera victoria de ese nivel). Ver research.md §4 — cambio deliberado, documentado
    // en Complexity Tracking de plan.md.
    bool SaveChapterOutcome(string chapterId, BattleOutcome outcome);

    // Nuevo — aditivo. Marca SagaArcProgressRecord.rewardsGranted = true para arcId,
    // creando el registro si no existe.
    void SaveArcRewardsGranted(string arcId);

    void ClearProgress();
}
```

`LocalChapterProgressStore` implementa ambos cambios; cualquier doble de test que implemente `IChapterProgressStore` (usado por `001`/`002`) debe actualizarse para devolver el `bool` correcto.

## SagaArcProgressEvaluator (nuevo, static class — función pura, mismo precedente que `ChapterBannerUnlockEvaluator`/`BattleOutcomeResolver`)

```csharp
public static class SagaArcProgressEvaluator
{
    public static bool IsArcCompleted(SagaArcDefinition arc, ProgressSaveData progress);
    public static bool HasRewardsGranted(string arcId, ProgressSaveData progress);
}
```

`IsArcCompleted` recorre `arc.Levels[].ChapterId` y exige que cada uno tenga un `ChapterProgressRecord` con `isCompleted == true` en `progress.chapters`.

## LaneRegistry (existente — `Assets/Scripts/LaneRegistry.cs`) — método nuevo

```csharp
public static int CountAlive(Team team)
{
    int count = 0;
    foreach (var occupant in s_Occupants)
    {
        if (occupant != null && !occupant.IsDestroyed && occupant.Team == team) count++;
    }
    return count;
}
```

## GatorretaController (nuevo, MonoBehaviour)

| Miembro | Tipo | Notas |
|---|---|---|
| `m_RechargeSeconds` | `float` (`[Min(0.1f)]`, serializado) | Duración de recarga. |
| `m_Range` | `float` (`[Min(0.01f)]`, serializado) | Rango de área, mismo significado que `UnitDefinition.Range`. |
| `m_AreaDamage` | `int` (`[Min(1)]`, serializado) | Daño aplicado a cada objetivo en rango. |
| `m_PlayerBase` | `BaseHealth` (serializado) | Fuente de `LanePosition` para la query de `LaneRegistry`. |
| `IsAvailable` | `bool` (propiedad) | `true` cuando terminó de recargar. |
| `event Action Available` | | Se invoca una única vez por ciclo de recarga, al pasar a disponible (FR-019). |
| `TryActivate()` | `bool` | No-op si `!IsAvailable` (Edge Case spec.md); si disponible, aplica daño de área vía `LaneRegistry.FindAllTargetsInRange(Team.Player, m_PlayerBase.LanePosition, m_Range, buffer)` y reinicia la recarga. |

## BattleResourceController (existente — `Assets/Scripts/Gameplay/Battler/BattleResourceController.cs`) — método nuevo

```csharp
public bool TryUpgradeRegen(float cost, float regenIncrease)
{
    if (regenIncrease <= 0f) return false;
    if (!TrySpend(cost)) return false;
    RegenPerSecond += regenIncrease;
    return true;
}
```

## ZombieOutbreakEligibility (nuevo, static class — función pura, resuelve FR-015/FR-020/SC-008)

```csharp
public static class ZombieOutbreakEligibility
{
    public static bool IsOfferable(ChapterDefinition chapter, ProgressSaveData progress)
    {
        if (chapter == null || chapter.ZombieOutbreakWave == null) return false;

        for (int i = 0; i < progress.chapters.Length; i++)
        {
            var record = progress.chapters[i];
            if (record != null && record.chapterId == chapter.ChapterId && record.isCompleted) return true;
        }

        return false;
    }
}
```

Introducida a raíz de `/speckit-analyze` (hallazgo E2): FR-015/SC-008 exigían una regla consultable en código, no solo un criterio narrativo de UI — esta función pura (mismo estilo que `SagaArcProgressEvaluator`/`ChapterBannerUnlockEvaluator`) es la fuente de verdad única que la pantalla de selección de nivel (`View`, fuera de alcance de código de este plan) debe consultar antes de ofrecer el modificador.

## EnemyWaveSpawner (existente) — evento nuevo (FR-019)

Añadido a raíz de `/speckit-analyze` (hallazgo E1): FR-019 exige notificar "disparo de una oleada de refuerzo por umbral de vida" vía evento de suscripción, pero el diseño original de `EnemyWaveSpawner` (ver [contracts/wave-triggers-and-enemy-cap.md](./contracts/wave-triggers-and-enemy-cap.md)) no lo exponía. Se añade:

```csharp
public event Action<int> ThresholdWaveTriggered; // índice dentro de m_ThresholdTriggers que acaba de dispararse
```

Invocado inmediatamente después de marcar `m_ThresholdFired[i] = true` (antes o después de generar los enemigos de refuerzo es indiferente para el contrato — ver contracts/wave-triggers-and-enemy-cap.md para el punto exacto).

## BattleLaunchContext (nuevo, static class — puente mínimo entre la pantalla de selección de nivel y la escena de batalla)

```csharp
public static class BattleLaunchContext
{
    public static bool ZombieOutbreakRequested { get; set; }
}
```

Seteado por la UI de selección de nivel antes de `ISceneNavigator.LoadScene(...)`; leído y reseteado a `false` por `BattleStateManager.SetupChapter()` (research.md §11).

## BattleStateManager (existente) — campo nuevo y cambios de comportamiento

- Nuevo campo serializado opcional `SagaArcDefinition m_ActiveArc` (`null` = comportamiento actual sin multiplicadores).
- `SetupChapter()`: resuelve `bool useZombieWave = BattleLaunchContext.ZombieOutbreakRequested && m_ChapterDefinition.ZombieOutbreakWave != null`, resetea `BattleLaunchContext.ZombieOutbreakRequested = false`, y pasa a `m_EnemyWaveSpawner.Initialize(...)` la oleada correspondiente + `m_EnemyBase` + `m_ChapterDefinition.HealthThresholdWaveTriggers` + `m_ChapterDefinition.MaxSimultaneousEnemies` + `m_ActiveArc?.EnemyStrengthMultiplier ?? 1f`. Pasa `m_ActiveArc?.UnitCostMultiplier ?? 1f` a `m_DeploymentController.Initialize(...)`.
- `SetOutcome(...)`: al recibir `BattleOutcome.Victory`, usa el `bool` devuelto por `m_ProgressStore.SaveChapterOutcome(...)` (research.md §4) para: sumar `m_ChapterDefinition.XpReward` a `PlayerProgressSaveData.availableExperience` (cada victoria), invocar un nuevo evento `event Action<LevelRewardResult> LevelRewardsGranted` (FR-019, payload con XP/tesoro/unidad desbloqueada, si aplica), y si `firstVictory && FirstClearUnitUnlock != null`, añadir su `UnitId` a `unlockedBonusUnitIds`. Luego, si `m_ActiveArc != null`, evalúa `SagaArcProgressEvaluator` y, si corresponde, otorga las recompensas de arco y llama a `m_ProgressStore.SaveArcRewardsGranted(m_ActiveArc.ArcId)`.

## PlayerBaseFlowController (existente) — cambios de dependencias

- Nuevos campos serializados: `UnitUnlockCatalog m_UnlockCatalog`, `UnitLevelingConfig m_ExpandedLevelingConfig` (además del ya existente `m_LevelingConfig`, que pasa a interpretarse como "config base"), y una referencia a `SagaArcDefinition` del arco cuya finalización eleva el tope de nivel (el "segundo capítulo" de FR-018).
- Nueva dependencia no serializada `IChapterProgressStore` (mismo patrón de resolución en `Awake()` que `BattleStateManager`).
- `OwnedUnits` pasa de `m_ChapterDefinition.AvailableUnits` a la unión de ese array con `m_UnlockCatalog.Resolve(id)` para cada `id` en `PlayerProgressSaveData.unlockedBonusUnitIds` (omitiendo resoluciones `null`).
- `Awake()` elige `m_LevelingConfig` o `m_ExpandedLevelingConfig` según `SagaArcProgressEvaluator.IsArcCompleted(arco-2, progressStore.Load())` antes de construir `UnitLevelingController` (FR-018).

## UnitLevelingConfig (existente) — nuevo asset de datos, sin cambio de clase

`DefaultUnitLevelingConfig.asset` (existente, `MaxLevel = 10`) se conserva como config base. Nuevo asset `ExpandedUnitLevelingConfig.asset` (`MaxLevel = 20`, `ExperienceCostPerLevel.Length == 19`) — puro dato, cero cambios en `UnitLevelingConfig.cs`.
