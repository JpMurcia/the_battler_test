# Contract: Modificador "Brote Zombi"

Cubre FR-013, FR-014, FR-015, FR-020 de spec.md.

## BattleLaunchContext (nuevo, static class mínimo — puente entre pantallas)

```csharp
public static class BattleLaunchContext
{
    public static bool ZombieOutbreakRequested { get; set; }
}
```

Seteado por la pantalla de selección de nivel (fuera de alcance de código de este plan — capa `View`/flujo de mapa de aventuras) inmediatamente antes de `ISceneNavigator.LoadScene(...)`. Es estático porque debe sobrevivir la carga de escena (mismo problema que cualquier "parámetro de escena" en Unity sin un framework de inyección; no hay estado adicional ni persistencia — un único `bool` que `BattleStateManager` consume y resetea en el mismo frame de `SetupChapter()`).

## BattleStateManager.SetupChapter — selección de oleada

```csharp
private void SetupChapter()
{
    LoadedProgress = m_ProgressStore.Load();

    bool zombieOutbreakActive = BattleLaunchContext.ZombieOutbreakRequested && m_ChapterDefinition.ZombieOutbreakWave != null;
    BattleLaunchContext.ZombieOutbreakRequested = false; // consumido, no debe "filtrarse" a la siguiente escena/reintento

    var activeWave = zombieOutbreakActive ? m_ChapterDefinition.ZombieOutbreakWave : m_ChapterDefinition.EnemyWaves;

    // ... (Initialize de bases, roster de jugador, sin cambios)

    m_EnemyWaveSpawner.Initialize(
        activeWave,
        m_EnemyBase,
        m_ChapterDefinition.HealthThresholdWaveTriggers,
        m_ChapterDefinition.MaxSimultaneousEnemies,
        m_ActiveArc != null ? m_ActiveArc.EnemyStrengthMultiplier : 1f);
}
```

**Nota**: los `HealthThresholdWaveTrigger` del nivel (research.md §2) se siguen evaluando igual en modo Brote Zombi — ninguna historia de usuario pide desactivarlos; si un nivel de ejemplo no debe tener refuerzos por umbral en su variante zombi, eso se logra dejando `ThresholdTriggers` vacío en la autoría de datos, no con una rama de código nueva.

## Por qué no hace falta comprobar "sin jefe" en runtime

No existe ningún flag `IsBoss` en el modelo de datos (ni antes ni después de este plan — ver research.md §11). `ChapterDefinition.ZombieOutbreakWave` es, por diseño, un `EnemyWaveDefinition` distinto del estándar, autorado sin la entrada de oleada del enemigo jefe (si el nivel tuviera una). FR-014 se cumple porque el spawner nunca lee `EnemyWaves` cuando `zombieOutbreakActive == true` — no hay forma de que el jefe aparezca sin que la autoría de datos lo incluya explícitamente en `ZombieOutbreakWave`.

**Nota de cobertura de contenido (añadida tras `/speckit-analyze` — hallazgo E5)**: esta garantía es estructural (por construcción del dato), pero solo es *demostrable end-to-end* sobre un nivel cuya oleada estándar realmente incluya un enemigo jefe distinguible que la oleada zombi omita. Ni "Corea" ni "Mongolia" (los únicos niveles reales autorados por esta feature) tienen un enemigo jefe propio en su oleada estándar — por tanto, sobre contenido real, la comprobación de "sin jefe" es vacuamente cierta (no hay jefe que excluir). La verificación genuina de FR-014 en `/speckit-tasks` debe incluir un caso de prueba **sintético** (dobles en memoria: una `EnemyWaveDefinition` estándar con una entrada de "jefe" + una `ZombieOutbreakWave` sintética sin esa entrada) además de la comprobación sobre "Corea"/"Mongolia".

## Disponibilidad del modificador: `ZombieOutbreakEligibility` (FR-015, FR-020, SC-008)

**Cambio tras `/speckit-analyze` (hallazgo E2)**: FR-015 exigía la regla de disponibilidad, pero el diseño original la dejaba enteramente como responsabilidad de la pantalla de selección de nivel, sin ninguna función de código consultable ni prueba automatizada — FR-020/SC-008 (añadidos a spec.md) cierran ese hueco. La regla ahora vive en una función pura nueva, no solo como snippet de referencia para la capa `View`:

```csharp
// Assets/Scripts/Gameplay/Battler/ZombieOutbreakEligibility.cs
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

La pantalla de selección de nivel (capa `View`, fuera de alcance de **UI** de este plan) debe llamar a `ZombieOutbreakEligibility.IsOfferable(chapterDefinition, progressStore.Load())` en vez de reimplementar la regla inline — la función en sí, y su comportamiento (FR-015/FR-020/SC-008), sí quedan cubiertos por este plan y por su propia suite de tests, a diferencia del diseño original.

## Acceptance mapping

- spec.md Historia 7, Escenario 1 (solo enemigos zombi, nunca los estándar) ⇐ `activeWave` es exactamente uno u otro, nunca una mezcla.
- spec.md Historia 7, Escenario 2 (sin jefe estándar) ⇐ garantizado por construcción del dato `ZombieOutbreakWave` (ver arriba; validado de forma genuina solo con el caso sintético, ver nota de cobertura).
- spec.md Historia 7, Escenario 3 / FR-015 / FR-020 / SC-008 (nivel no superado ⇒ opción no disponible) ⇐ `ZombieOutbreakEligibility.IsOfferable` exige `isCompleted == true`.
