# Contract: Sets de Tesoros y Bonificación Pasiva de Cuenta

Cubre FR-006, FR-007, FR-008, FR-009, FR-010 de spec.md.

## TreasureSetDefinition / TreasureSetCatalog

Ver forma completa en [data-model.md](../data-model.md#treasuresetdefinition-nuevo-scriptableobject-themodel).

## TreasureSetProgressEvaluator

```csharp
namespace TheBattler.Model
{
    public static class TreasureSetProgressEvaluator
    {
        public static bool IsSetComplete(TreasureSetDefinition set, PlayerProgressSaveData playerProgress)
        {
            var treasureIds = set.TreasureIds;
            for (int i = 0; i < treasureIds.Length; i++)
            {
                if (Array.IndexOf(playerProgress.obtainedTreasureIds, treasureIds[i]) < 0) return false;
            }
            return true;
        }

        public static bool HasRewardsGranted(string setId, PlayerProgressSaveData playerProgress)
            => Array.IndexOf(playerProgress.grantedTreasureSetIds, setId) >= 0;
    }
}
```

Función pura, sin dependencias de motor — mismo estilo que `SagaArcProgressEvaluator`/`ChapterBannerUnlockEvaluator`.

## BattleResourceController.ApplyPassiveRegenBonus

```csharp
public void ApplyPassiveRegenBonus(float bonus)
{
    if (bonus <= 0f) return;
    m_RegenPerSecond += bonus;
}
```

**Orden de inicialización (a resolver en `/speckit-tasks`)**: debe aplicarse antes de que `Awake()` de `BattleResourceController` capture `m_DesignRegenPerSecond` (planeado por spec 013, contracts/gatorreta-and-resource-upgrade.md). Dos opciones viables, decisión de `/speckit-tasks`:
- (a) `BattleStateManager` llama `ApplyPassiveRegenBonus` desde su propio `Awake()`/`Start()`, garantizando el orden vía Script Execution Order de Unity (frágil, depende de configuración de proyecto).
- (b) `BattleResourceController` expone un `Initialize(float passiveBonus)` explícito, llamado por `BattleStateManager.SetupChapter()` (que ya se ejecuta después de que todos los componentes existen), y `Awake()` de `BattleResourceController` deja de capturar `m_DesignRegenPerSecond` por sí solo — `Initialize` lo hace. **Preferida**: no depende de orden de `Awake()` entre componentes distintos, mismo patrón explícito que `m_EnemyWaveSpawner.Initialize(...)`/`m_DeploymentController.Initialize(...)` ya usan.

## BattleStateManager — flujo de tesoros y sets (extiende `SetOutcome`, spec 013 contracts/level-rewards-and-unit-unlocks.md)

```csharp
// Dentro de la rama `outcome == Victory`, después del bloque de recompensas de nivel/arco que spec 013 ya define:

string treasureId = m_ChapterDefinition.TreasureRewardId; // planeado, spec 013
if (!string.IsNullOrEmpty(treasureId) && Array.IndexOf(playerProgress.obtainedTreasureIds, treasureId) < 0)
{
    var updatedTreasures = new string[playerProgress.obtainedTreasureIds.Length + 1];
    Array.Copy(playerProgress.obtainedTreasureIds, updatedTreasures, playerProgress.obtainedTreasureIds.Length);
    updatedTreasures[updatedTreasures.Length - 1] = treasureId;
    playerProgress.obtainedTreasureIds = updatedTreasures;
}

m_PlayerProgressStore.Save(playerProgress); // guarda tesoro nuevo junto a XP/unlocks ya guardados por spec 013 en el mismo método

if (m_TreasureSetCatalog != null)
{
    foreach (var set in m_TreasureSetCatalog.Sets)
    {
        if (!TreasureSetProgressEvaluator.IsSetComplete(set, playerProgress)) continue;
        if (TreasureSetProgressEvaluator.HasRewardsGranted(set.SetId, playerProgress)) continue;

        var updatedGranted = new string[playerProgress.grantedTreasureSetIds.Length + 1];
        Array.Copy(playerProgress.grantedTreasureSetIds, updatedGranted, playerProgress.grantedTreasureSetIds.Length);
        updatedGranted[updatedGranted.Length - 1] = set.SetId;
        playerProgress.grantedTreasureSetIds = updatedGranted;

        m_ResourceController.ApplyPassiveRegenBonus(set.PassiveRegenBonus); // activo de inmediato para el resto de esta sesión
    }
    m_PlayerProgressStore.Save(playerProgress); // guarda grantedTreasureSetIds si cambió
}
```

**Nota de idempotencia (Edge Case spec.md — victorias simultáneas)**: `SetOutcome` ya es el único punto de escritura de este flujo (mismo argumento que spec 013 research.md §4 para `SaveChapterOutcome`); no hay carrera posible dentro de una misma partida porque `SetOutcome` se invoca una vez por resultado de batalla, de forma síncrona.

## Acceptance mapping

- spec.md Historia 4, Escenarios 1-2 (bonificación al completar el set, activa en batallas posteriores) ⇐ `ApplyPassiveRegenBonus` llamado tanto en el momento de completar el set (activo de inmediato) como en cada `SetupChapter()` futuro (data-model.md, suma de `PassiveRegenBonus` de sets en `grantedTreasureSetIds`).
- spec.md Historia 4, Escenario 3 (set incompleto se ve como tal) ⇐ `TreasureSetProgressEvaluator.IsSetComplete` consultable en cualquier momento contra `playerProgress.obtainedTreasureIds` (capa `View`, fuera de alcance de código de este plan).
- spec.md Historia 4, Escenario 4 / FR-009 (tesoro sin set no dispara nada) ⇐ el bucle sobre `m_TreasureSetCatalog.Sets` solo actúa si algún set completo lo referencia; un tesoro fuera de todo set simplemente se añade a `obtainedTreasureIds` sin más efecto.
- spec.md FR-010 (bonificación no se retira si el set se reconfigura) ⇐ `grantedTreasureSetIds` es monótono (solo se añade, nunca se remueve) — un set reconfigurado con un tesoro nuevo pasa a `IsSetComplete == false` pero conserva su entrada en `grantedTreasureSetIds`, y el bono ya aplicado a `m_RegenPerSecond` no se revierte (no hay ninguna ruta de código que reste `PassiveRegenBonus`).
