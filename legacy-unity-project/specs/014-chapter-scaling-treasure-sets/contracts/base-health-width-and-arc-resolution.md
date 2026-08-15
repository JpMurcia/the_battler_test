# Contract: Vida de Base Enemiga Escalada, Ancho de Nivel y Resolución de Arco Activo

Cubre FR-001, FR-002, FR-003, FR-004, FR-005 de spec.md.

## ChapterDefinition — campo nuevo

```csharp
[SerializeField, Min(0.1f)] private float m_LevelWidth = 10f;
public float LevelWidth => m_LevelWidth;
```

Sin `FormerlySerializedAs` (no es un renombrado) — mismo criterio que los campos nuevos de spec 013 sobre este mismo tipo.

## BattleLaunchContext (planeado, spec 013) — campo nuevo

```csharp
public static class BattleLaunchContext
{
    public static bool ZombieOutbreakRequested { get; set; } // planeado, spec 013
    public static SagaArcDefinition RequestedArc { get; set; } // nuevo
}
```

## BattleStateManager.SetupChapter — cambios

```csharp
private void SetupChapter()
{
    LoadedProgress = m_ProgressStore.Load();

    var activeArc = BattleLaunchContext.RequestedArc ?? m_ActiveArc; // nuevo: prioriza el arco de la selección de nivel
    BattleLaunchContext.RequestedArc = null; // consumido, no debe filtrarse a la siguiente escena/reintento

    bool zombieOutbreakActive = BattleLaunchContext.ZombieOutbreakRequested && m_ChapterDefinition.ZombieOutbreakWave != null; // planeado, spec 013
    BattleLaunchContext.ZombieOutbreakRequested = false;

    var activeWave = zombieOutbreakActive ? m_ChapterDefinition.ZombieOutbreakWave : m_ChapterDefinition.EnemyWaves;

    float unitCostMultiplier = activeArc != null ? activeArc.UnitCostMultiplier : 1f;
    float enemyStrengthMultiplier = activeArc != null ? activeArc.EnemyStrengthMultiplier : 1f;

    m_PlayerBase.Initialize(Team.Player, m_ChapterDefinition.PlayerBaseMaxHealth, m_PlayerBase.LanePosition);

    // --- cambia respecto al código actual y respecto al diseño original de spec 013 ---
    int enemyBaseHealth = Mathf.Max(1, Mathf.RoundToInt(m_ChapterDefinition.EnemyBaseMaxHealth * enemyStrengthMultiplier));
    float enemyBaseLanePosition = m_PlayerBase.LanePosition + m_ChapterDefinition.LevelWidth;
    m_EnemyBase.Initialize(Team.Enemy, enemyBaseHealth, enemyBaseLanePosition);
    // --- fin del cambio ---

    m_DeploymentController.Initialize(m_ResourceController, m_ChapterDefinition.AvailableUnits, /* ... */, unitCostMultiplier);

    m_EnemyWaveSpawner.Initialize(
        activeWave,
        m_EnemyBase,
        m_ChapterDefinition.HealthThresholdWaveTriggers, // planeado, spec 013
        m_ChapterDefinition.MaxSimultaneousEnemies,       // planeado, spec 013
        enemyStrengthMultiplier);
}
```

**Compatibilidad**: `activeArc == null` (ni `BattleLaunchContext.RequestedArc` ni `m_ActiveArc` seteados — escenas de `Chapter1`/`Chapter2` no tocadas por saga) ⇒ `enemyStrengthMultiplier = 1f` ⇒ `enemyBaseHealth == m_ChapterDefinition.EnemyBaseMaxHealth` exacto, sin cambio observable en vida de base. `LevelWidth` sí cambia la posición de la base enemiga para **toda** escena que use `SetupChapter()`, incluidas `Chapter1`/`Chapter2` — por eso `/speckit-tasks` DEBE fijar `LevelWidth` de esos dos `ChapterDefinition` existentes al valor equivalente al override de escena actual (dato de migración, no de diseño — ver Nota de Migración abajo).

## Nota de Migración — `LevelWidth` de `Chapter1`/`Chapter2`

`/speckit-tasks` DEBE:
1. Abrir `Chapter1_Battle.unity`/`Chapter2_Battle.unity`, leer el `LanePosition` actual de la instancia de `EnemyBasePrefab` en cada escena (override de Inspector, no el default `0` del prefab).
2. Restar el `LanePosition` de la instancia de `PlayerBasePrefab` en esa misma escena (normalmente `0`, pero no asumir sin verificar).
3. Asignar esa diferencia como `LevelWidth` en `Chapter1.asset`/`Chapter2.asset` respectivamente.
4. Verificar (test de integración o inspección manual) que tras el cambio de código de este contrato, la posición resultante de la base enemiga en esas dos escenas es idéntica a la que tenían antes de esta feature (regresión cero).

## Acceptance mapping

- spec.md Historia 1, Escenarios 1-3 (vida de base enemiga escala con el multiplicador) ⇐ `enemyBaseHealth` calculado con `Mathf.RoundToInt(... * enemyStrengthMultiplier)`, mismo criterio de redondeo que unidades enemigas (spec 013).
- spec.md Historia 3, Escenarios 1-3 (ancho configurable, afecta tiempo de recorrido y rango) ⇐ `enemyBaseLanePosition` derivado de `LevelWidth`; el resto del sistema de movimiento/rango (`LaneRegistry`, `UnitRuntime`) ya opera puramente sobre `LanePosition`, sin cambios adicionales necesarios ahí.
- spec.md Historia 2, Escenarios 1-3 (costo de energía correcto según capítulo de acceso) ⇐ resuelto indirectamente: cada `ChapterBannerDefinition` de un capítulo ya tiene su propio `EnergyCost` (existente, sin cambios); esta feature solo asegura que `activeArc` (y por tanto los multiplicadores de costo/fuerza) coincidan con el banner elegido, vía `BattleLaunchContext.RequestedArc`.
