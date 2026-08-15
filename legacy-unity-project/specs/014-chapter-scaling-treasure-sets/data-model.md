# Data Model: Escalado Avanzado por Capítulo y Sets de Tesoros

Convención (misma que spec 013): **(existente)** ya está implementado hoy; **(planeado, spec 013)** existe solo en el diseño de `specs/013-empire-of-cats-saga/` (sin implementar todavía) y esta feature construye sobre él; **(nuevo)** no existe en ningún lado, lo introduce esta feature.

## ChapterDefinition (existente — `Assets/Scripts/Model/Battler/ChapterDefinition.cs`) — campo nuevo

| Campo nuevo | Tipo | Default | Notas |
|---|---|---|---|
| `m_LevelWidth` | `float` (`[Min(0.1f)]`) | `10f` (placeholder — el valor real de migración para `Chapter1`/`Chapter2` se determina en `/speckit-tasks` leyendo el override de escena existente, research.md §3) | Distancia entre la base del jugador y la base enemiga. Consumido por `BattleStateManager.SetupChapter()` para calcular `LanePosition` de la base enemiga (research.md §3), reemplazando el reenvío no-op del `LanePosition` actual del prefab. |

No se añade ningún campo de "costo de energía por capítulo" a este tipo — ver research.md §2 (el costo ya vive correctamente en `ChapterBannerDefinition.EnergyCost`, existente).

`EnemyBaseMaxHealth` (existente, sin cambio de forma) pasa a escalarse en el punto de consumo — ver `BattleStateManager` más abajo. No se le añade ningún campo nuevo.

## SagaArcDefinition (planeado, spec 013 — sin cambios aquí)

Esta feature no modifica su forma. Se referencia por `BattleLaunchContext.RequestedArc` (nuevo, ver abajo) para resolver el arco activo dinámicamente en vez de depender únicamente del campo serializado `BattleStateManager.m_ActiveArc`.

## BattleLaunchContext (planeado, spec 013 — campo nuevo de esta feature)

```csharp
public static class BattleLaunchContext
{
    public static bool ZombieOutbreakRequested { get; set; } // planeado por spec 013
    public static SagaArcDefinition RequestedArc { get; set; } // nuevo, esta feature
}
```

Seteado por la pantalla de selección de nivel (capa `View`, fuera de alcance de código) junto al `ChapterBannerDefinition` elegido, antes de `LoadScene(...)`. Leído y reseteado a `null` por `BattleStateManager.SetupChapter()` en el mismo punto donde spec 013 ya resetea `ZombieOutbreakRequested`.

## PlayerProgressSaveData (existente — `Assets/Scripts/Model/Battler/PlayerProgressSaveData.cs`) — campos nuevos

| Campo nuevo | Tipo | Default | Notas |
|---|---|---|---|
| `obtainedTreasureIds` | `string[]` | `Array.Empty<string>()` | Ids de `ChapterDefinition.TreasureRewardId` (planeado, spec 013) ya obtenidos alguna vez. Aditivo — se suma junto a `unlockedBonusUnitIds` que spec 013 ya añade al mismo tipo, sin bump de `formatVersion` (mismo criterio que research.md §8 de spec 013). |
| `grantedTreasureSetIds` | `string[]` | `Array.Empty<string>()` | Ids de `TreasureSetDefinition.SetId` cuya bonificación pasiva ya fue otorgada — evita reotorgarla si el set se reconfigura o el jugador reobtiene un tesoro ya tenido. |

## TreasureSetDefinition (nuevo, ScriptableObject, `TheBattler.Model`)

| Campo | Tipo | Notas |
|---|---|---|
| `SetId` | `string` | Identificador estable, mismo rol que `SagaArcDefinition.ArcId`. |
| `DisplayNameKey` | `string` | Clave de localización (mismo patrón que `ChapterBannerDefinition.DisplayNameKey`). |
| `TreasureIds` | `string[]` | Subconjunto de valores de `ChapterDefinition.TreasureRewardId` de niveles reales que componen este set. |
| `PassiveRegenBonus` | `float` (`[Min(0f)]`) | Incremento aplicado a `BattleResourceController.RegenPerSecond` (vía `ApplyPassiveRegenBonus`) una vez completado el set. `0` = sin bonificación (no debería autorarse así, pero no rompe nada). |

**Validación** (`IsValid`, mismo patrón que `SagaArcDefinition.IsValid`/`ChapterBannerDefinition.IsValid`): `SetId`/`DisplayNameKey` no vacíos; `TreasureIds.Length > 0`; sin duplicados dentro de `TreasureIds`.

## TreasureSetProgressEvaluator (nuevo, static class — función pura, mismo precedente que `SagaArcProgressEvaluator`/`ChapterBannerUnlockEvaluator`)

```csharp
public static class TreasureSetProgressEvaluator
{
    public static bool IsSetComplete(TreasureSetDefinition set, PlayerProgressSaveData playerProgress)
    {
        foreach (var treasureId in set.TreasureIds)
        {
            if (Array.IndexOf(playerProgress.obtainedTreasureIds, treasureId) < 0) return false;
        }
        return true;
    }

    public static bool HasRewardsGranted(string setId, PlayerProgressSaveData playerProgress)
        => Array.IndexOf(playerProgress.grantedTreasureSetIds, setId) >= 0;
}
```

## TreasureSetCatalog (nuevo, ScriptableObject — mismo patrón que `UnitUnlockCatalog` de spec 013)

| Campo | Tipo | Notas |
|---|---|---|
| `Sets` | `TreasureSetDefinition[]` | Todos los sets conocidos del juego. Referenciado por `BattleStateManager` para evaluar sets tras cada victoria (evita que `BattleStateManager` mantenga su propia lista ad-hoc). |

## BattleResourceController (existente) — método nuevo

```csharp
public void ApplyPassiveRegenBonus(float bonus)
{
    if (bonus <= 0f) return;
    m_RegenPerSecond += bonus;
}
```

Debe invocarse **antes** de que `Awake()` capture `m_DesignRegenPerSecond` (planeado por spec 013) — el orden exacto de inicialización (llamada explícita desde `BattleStateManager.SetupChapter()` antes de que el frame de `Awake()` de `BattleResourceController` corra, o refactor de `BattleResourceController` para exponer un `Initialize` explícito en vez de depender de `Awake()`) se resuelve en `/speckit-tasks` — ver research.md §5.

## BattleStateManager (existente) — cambios de comportamiento

- `SetupChapter()`:
  - Resuelve el arco activo como `BattleLaunchContext.RequestedArc ?? m_ActiveArc` (en vez de solo `m_ActiveArc`), reseteando `BattleLaunchContext.RequestedArc = null` tras leerlo (mismo patrón que `ZombieOutbreakRequested`, planeado por spec 013).
  - Calcula `enemyBaseHealth = Mathf.Max(1, Mathf.RoundToInt(m_ChapterDefinition.EnemyBaseMaxHealth * enemyStrengthMultiplier))` (research.md §1) y `enemyBaseLanePosition = m_PlayerBase.LanePosition + m_ChapterDefinition.LevelWidth` (research.md §3), pasando ambos a `m_EnemyBase.Initialize(Team.Enemy, enemyBaseHealth, enemyBaseLanePosition)` en vez de la llamada actual (que reenvía `EnemyBaseMaxHealth` sin escalar y `m_EnemyBase.LanePosition` sin recalcular).
  - Suma `PassiveRegenBonus` de todos los `TreasureSetDefinition` en `m_TreasureSetCatalog.Sets` cuyo `SetId` esté en `PlayerProgressSaveData.grantedTreasureSetIds`, y llama `m_ResourceController.ApplyPassiveRegenBonus(sum)` (research.md §5).
- `SetOutcome(...)`, rama `outcome == Victory`, tras el flujo de recompensas de nivel que spec 013 ya planea (XP, tesoro notificado, desbloqueo de unidad):
  - Si `m_ChapterDefinition.TreasureRewardId` (planeado por spec 013) no es vacío y no está ya en `playerProgress.obtainedTreasureIds`, se añade (mismo patrón array-append que `unlockedBonusUnitIds`, spec 013 research.md §4).
  - Tras guardar `playerProgress`, recorre `m_TreasureSetCatalog.Sets`: para cada uno con `TreasureSetProgressEvaluator.IsSetComplete(set, playerProgress) && !TreasureSetProgressEvaluator.HasRewardsGranted(set.SetId, playerProgress)`, añade `set.SetId` a `grantedTreasureSetIds`, guarda de nuevo, y aplica `set.PassiveRegenBonus` a la sesión de batalla actual (vía `m_ResourceController.ApplyPassiveRegenBonus`, para que el bono esté activo inmediatamente si el set se completó en la victoria de la batalla en curso — no solo en la siguiente).
- Nuevo campo serializado opcional `TreasureSetCatalog m_TreasureSetCatalog` (`null` = sin sets configurados, ninguna bonificación se evalúa — preserva comportamiento de `Chapter1`/`Chapter2`).

## Resumen de campos de guardado aditivos (sin bump de `formatVersion`)

```csharp
// PlayerProgressSaveData (existente + spec 013 + esta feature)
[Serializable]
public class PlayerProgressSaveData
{
    public int formatVersion = 1;                                    // SIN CAMBIO
    public UnitProgress[] unitProgress = Array.Empty<UnitProgress>();
    public int availableExperience;
    public string[] activeTeamUnitIds = Array.Empty<string>();
    public string[] unlockedBonusUnitIds = Array.Empty<string>();     // planeado, spec 013
    public string[] obtainedTreasureIds = Array.Empty<string>();      // nuevo, esta feature
    public string[] grantedTreasureSetIds = Array.Empty<string>();    // nuevo, esta feature
}
```

`JsonUtility.FromJson` conserva el inicializador de campo para cualquier campo ausente en un guardado previo (mismo argumento que research.md §8 de spec 013) — un guardado de antes de esta feature (o de antes de spec 013) sigue cargando sin pérdida, con estos tres campos vacíos hasta que el jugador genere contenido nuevo.
