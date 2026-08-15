# Contract: Recompensas de Nivel, Desbloqueo de Unidad y Recompensas de Arco

Cubre FR-005, FR-008, FR-009, FR-016 (parcial), FR-019 (parcial) de spec.md.

## IChapterProgressStore — cambio de firma

```csharp
public interface IChapterProgressStore
{
    ProgressSaveData Load();
    bool SaveChapterOutcome(string chapterId, BattleOutcome outcome); // antes: void
    void SaveArcRewardsGranted(string arcId); // nuevo
    void ClearProgress();
}
```

`LocalChapterProgressStore.SaveChapterOutcome`:

```csharp
public bool SaveChapterOutcome(string chapterId, BattleOutcome outcome)
{
    var data = Load();
    var record = Array.Find(data.chapters, r => string.Equals(r.chapterId, chapterId, StringComparison.Ordinal));
    bool wasCompletedBefore = record != null && record.isCompleted;

    if (record == null)
    {
        record = new ChapterProgressRecord { chapterId = chapterId };
        var chapters = new ChapterProgressRecord[data.chapters.Length + 1];
        Array.Copy(data.chapters, chapters, data.chapters.Length);
        chapters[chapters.Length - 1] = record;
        data.chapters = chapters;
    }

    record.lastOutcome = outcome;
    record.isCompleted = outcome == BattleOutcome.Victory;

    try { WriteAtomic(data); } catch (Exception) { /* FR-010, sin cambios */ }

    return !wasCompletedBefore && record.isCompleted;
}

public void SaveArcRewardsGranted(string arcId)
{
    var data = Load();
    var record = Array.Find(data.arcs, r => string.Equals(r.arcId, arcId, StringComparison.Ordinal));
    if (record == null)
    {
        record = new SagaArcProgressRecord { arcId = arcId };
        var arcs = new SagaArcProgressRecord[data.arcs.Length + 1];
        Array.Copy(data.arcs, arcs, data.arcs.Length);
        arcs[arcs.Length - 1] = record;
        data.arcs = arcs;
    }
    record.rewardsGranted = true;
    try { WriteAtomic(data); } catch (Exception) { /* mismo tratamiento */ }
}
```

## BattleStateManager.SetOutcome — flujo de recompensas (Victory)

```csharp
private void SetOutcome(BattleOutcome outcome)
{
    m_CurrentOutcome = outcome;
    m_DeploymentController.SetDeploymentEnabled(false);
    m_EnemyWaveSpawner.SetRunning(false);

    bool firstVictory = m_ProgressStore.SaveChapterOutcome(m_ChapterDefinition.ChapterId, outcome);

    foreach (var listener in m_OutcomeListeners) listener.OnBattleOutcomeChanged(outcome);

    if (outcome == BattleOutcome.Victory)
    {
        var playerProgress = m_PlayerProgressStore.Load();
        playerProgress.availableExperience += m_ChapterDefinition.XpReward;

        string unlockedUnitId = null;
        if (firstVictory && m_ChapterDefinition.FirstClearUnitUnlock != null)
        {
            string unitId = m_ChapterDefinition.FirstClearUnitUnlock.UnitId;
            if (Array.IndexOf(playerProgress.unlockedBonusUnitIds, unitId) < 0)
            {
                var updated = new string[playerProgress.unlockedBonusUnitIds.Length + 1];
                Array.Copy(playerProgress.unlockedBonusUnitIds, updated, playerProgress.unlockedBonusUnitIds.Length);
                updated[updated.Length - 1] = unitId;
                playerProgress.unlockedBonusUnitIds = updated;
                unlockedUnitId = unitId;
            }
        }

        m_PlayerProgressStore.Save(playerProgress);

        var arcRewards = TryGrantArcRewardsIfCompleted(); // ver abajo, null si no aplica

        LevelRewardsGranted?.Invoke(new LevelRewardResult(
            xp: m_ChapterDefinition.XpReward,
            treasureId: m_ChapterDefinition.TreasureRewardId,
            unlockedUnitId: unlockedUnitId,
            arcRewards: arcRewards));
    }

    bool hasPostBattleDialogue = m_ChapterDefinition.PostBattleDialogue != null && m_ChapterDefinition.PostBattleDialogue.Length > 0;
    if (outcome == BattleOutcome.Victory && m_DialoguePlayer != null && hasPostBattleDialogue)
    {
        m_DialoguePlayer.Play(m_ChapterDefinition.PostBattleDialogue, null);
    }
}

private ArcRewardResult TryGrantArcRewardsIfCompleted()
{
    if (m_ActiveArc == null) return null;

    var progress = m_ProgressStore.Load();
    if (!SagaArcProgressEvaluator.IsArcCompleted(m_ActiveArc, progress)) return null;
    if (SagaArcProgressEvaluator.HasRewardsGranted(m_ActiveArc.ArcId, progress)) return null;

    m_ProgressStore.SaveArcRewardsGranted(m_ActiveArc.ArcId);

    var playerProgress = m_PlayerProgressStore.Load();
    foreach (var unit in m_ActiveArc.ArcCompletionUnitUnlocks)
    {
        if (Array.IndexOf(playerProgress.unlockedBonusUnitIds, unit.UnitId) >= 0) continue;
        var updated = new string[playerProgress.unlockedBonusUnitIds.Length + 1];
        Array.Copy(playerProgress.unlockedBonusUnitIds, updated, playerProgress.unlockedBonusUnitIds.Length);
        updated[updated.Length - 1] = unit.UnitId;
        playerProgress.unlockedBonusUnitIds = updated;
    }
    m_PlayerProgressStore.Save(playerProgress);

    return new ArcRewardResult(m_ActiveArc.ArcId, m_ActiveArc.ArcCompletionUnitUnlocks, m_ActiveArc.ArcCompletionFeatureFlags);
}
```

`LevelRewardResult`/`ArcRewardResult` son structs/clases simples `[data-only]` en `TheBattler.Gameplay`, usadas únicamente como payload del evento `LevelRewardsGranted` (FR-019) — no se persisten, no llevan lógica.

## PlayerBaseFlowController.OwnedUnits — unión con unidades bonus

```csharp
public IReadOnlyList<UnitDefinition> OwnedUnits
{
    get
    {
        var progress = m_ProgressStore.Load(); // IPlayerProgressStore, ya resuelto en Awake()
        if (progress.unlockedBonusUnitIds.Length == 0) return m_ChapterDefinition.AvailableUnits;

        var result = new List<UnitDefinition>(m_ChapterDefinition.AvailableUnits);
        foreach (var unitId in progress.unlockedBonusUnitIds)
        {
            var unit = m_UnlockCatalog.Resolve(unitId);
            if (unit != null && !result.Contains(unit)) result.Add(unit);
        }
        return result;
    }
}
```

## Acceptance mapping

- spec.md Historia 4, Escenarios 1-2 (Corea: XP+tesoro+desbloqueo en 1ª victoria; XP+tesoro sin re-desbloqueo en victorias siguientes) ⇐ `firstVictory` gating solo el desbloqueo de unidad; XP/tesoro se otorgan siempre que `outcome == Victory`.
- spec.md Historia 8, Escenarios 1-3 (desbloqueo de recompensas de capítulo/arco) ⇐ `TryGrantArcRewardsIfCompleted`, gateado por `SagaArcProgressEvaluator.HasRewardsGranted` para no re-otorgar en rejugadas posteriores del arco ya completado.
