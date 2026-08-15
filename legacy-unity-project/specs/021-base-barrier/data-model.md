# Data Model: Barrera de Base y Jefes Vinculados

## `EnemyWaveDefinition.WaveEntry` (extendido, `Assets/Scripts/Model/Battler/EnemyWaveDefinition.cs`)

Campo nuevo, aditivo, sin `FormerlySerializedAs` (no es un renombrado):

```csharp
public struct WaveEntry
{
    [Min(0f)] public float spawnTimeSeconds;
    public UnitDefinition unit;
    public float lanePosition;
    public bool isLinkedBoss; // nuevo — default false preserva toda oleada ya serializada (FR-006)
}
```

`isLinkedBoss = true` marca la entrada como el jefe vinculado del nivel (research.md §1). Se asume como máximo una entrada marcada por `EnemyWaveDefinition` (spec.md Assumptions: "un jefe vinculado por BossLevel") — si hubiera más de una, `EnemyWaveSpawner` usa la primera encontrada por índice (comportamiento determinista, sin validación adicional en runtime; ver quickstart.md para el criterio de contenido).

## `BaseHealth` (extendido, `Assets/Scripts/Gameplay/Battler/BaseHealth.cs`)

Estado y API nuevos, aditivos — ningún miembro existente cambia de firma:

| Miembro | Tipo | Uso |
|---|---|---|
| `IsBarrierActive` | `bool` (propiedad, solo lectura) | `true` mientras la base es invulnerable. Default `false` — preserva el comportamiento de toda base existente (FR-006). |
| `BarrierStateChanged` | `event Action` | Notifica una transición real de `IsBarrierActive` (para `BaseHealthBarView`, research.md §4). No se dispara si el estado solicitado ya coincidía con el actual (idempotente). |
| `ActivateBarrier()` | método | Pone `IsBarrierActive = true`. Idempotente. |
| `RemoveBarrier()` | método | Pone `IsBarrierActive = false`. Idempotente. |

`ApplyDamage(int amount)` extiende su guard existente:

```csharp
// antes: if (amount <= 0 || IsDestroyed) return;
if (amount <= 0 || IsDestroyed || IsBarrierActive) return;
```

`ResetHealth()` **no** toca `IsBarrierActive` — el ciclo de vida de la barrera lo gobierna por completo `EnemyWaveSpawner` (ver abajo), no `BaseHealth.Initialize()`/`ResetHealth()`, para que el orden de llamadas ya existente en `BattleStateManager.SetupChapter()`/`RetryBattle()` no necesite reordenarse (research.md §3).

## `UnitRuntime` (extendido, `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`)

Evento nuevo:

```csharp
public event Action<UnitRuntime> Defeated;
```

Disparado dentro de `ApplyDamage(int amount)`, en el mismo punto donde hoy se decide `UnitRuntimePool.Release(this)` — antes de esa llamada (research.md §2):

```csharp
public void ApplyDamage(int amount)
{
    if (amount <= 0 || IsDestroyed) return;

    m_CurrentHealth = Mathf.Max(0, m_CurrentHealth - amount);
    if (IsDestroyed)
    {
        Defeated?.Invoke(this);
        UnitRuntimePool.Release(this);
    }
}
```

Ningún suscriptor propio dentro de `UnitRuntime` — el guard de un solo disparo ya lo da gratis el `if (amount <= 0 || IsDestroyed) return;` de la primera línea (una vez destruida, no puede volver a entrar al cuerpo del método hasta su próximo `Initialize()`).

## `EnemyWaveSpawner` (extendido, `Assets/Scripts/Gameplay/Battler/EnemyWaveSpawner.cs`)

Estado runtime nuevo (no serializado):

| Campo | Tipo | Uso |
|---|---|---|
| `m_LinkedBossEntryIndex` | `int` | Índice dentro de `m_WaveDefinition.WaveEntries` de la entrada `isLinkedBoss == true`; `-1` si ninguna (calculado una vez en `Initialize()`). |

Cambios de comportamiento:

- `Initialize(...)`: al final, si `m_LinkedBossEntryIndex >= 0`, llama `m_EnemyBase?.ActivateBarrier()` (research.md §3 — barrera activa desde el arranque del nivel, no diferida hasta el spawn del jefe).
- `ResetSpawner()`: si `m_LinkedBossEntryIndex >= 0`, vuelve a llamar `m_EnemyBase?.ActivateBarrier()` — cubre el reintento (FR-007), que no vuelve a pasar por `Initialize()`.
- `SpawnEnemy(...)`: cuando el índice de la entrada spawneada coincide con `m_LinkedBossEntryIndex`, se suscribe `instance.Defeated += OnLinkedBossDefeated` sobre esa instancia concreta.
- `OnLinkedBossDefeated(UnitRuntime boss)` (nuevo, privado): `boss.Defeated -= OnLinkedBossDefeated;` (desuscripción propia, evita fugas si esa misma instancia del pool se reutiliza después para un enemigo no-jefe, research.md §2) y `m_EnemyBase?.RemoveBarrier();`.

Ningún cambio en la firma pública de `Initialize`/`SetRunning`/`ResetSpawner` ni en los eventos ya existentes (`ThresholdWaveTriggered`, `EnemyEncountered`).

## `BaseHealthBarView` (extendido, `Assets/Scripts/View/Battler/BaseHealthBarView.cs`)

Campo nuevo, opcional (research.md §4):

```csharp
[SerializeField] private GameObject m_BarrierIndicator; // null-safe — sin indicador en escenas que no lo cablean
```

`OnEnable`/`OnDisable` se suscriben también a `BaseHealth.BarrierStateChanged`; un nuevo `RefreshBarrier()` hace `m_BarrierIndicator?.SetActive(m_BaseHealth.IsBarrierActive)`, invocado en `OnEnable` (estado inicial) y en cada `BarrierStateChanged`.

## Contenido nuevo (no-código) — primer jefe vinculado real

- **`TheFace` (`UnitDefinition`)**: `MaxHealth = 99999`, `Damage = 2000` (manual técnico 6.6, seed data confirmada en spec.md Assumptions), idle+ataque+variante visual mínima (Principio III) reutilizando arte ya importado.
- **`TheFaceWave` (`EnemyWaveDefinition`)**: una `WaveEntry` con `unit = TheFace`, `isLinkedBoss = true`.
- **`TheFace` (`ChapterDefinition`, nuevo nivel)**: usa `TheFaceWave` como `EnemyWaves`; diálogo pre/post-batalla propio (Principio I).
- **`TheFaceArc` (`SagaArcDefinition`, nuevo y dedicado — research.md §6, revisado tras `/speckit-analyze`)**: `m_Levels = [TheFace]`, `m_BossLevel = TheFace` (requisito de `IsValid`, ver `SagaArcDefinition.cs`). **No** se reutiliza `Chapter1Arc` — `Chapter1Arc.Levels`/`BossLevel` permanecen exactamente como `013`/`014` los dejaron, evitando redefinir qué significa "arco completo" para un arco ya jugable (`SagaArcProgressEvaluator.IsArcCompleted`, consumido por `PlayerBaseFlowController.cs` para el desbloqueo del tope de mejora expandido).
- **`Banner_TheFace` (`ChapterBannerDefinition`, nuevo)**: `LinkedChapter = TheFace`, `TargetSceneName = "TheFace_Battle"`, `Region = ImperioDeLosGatosRegion` (misma región que Corea/Mongolia), `DifficultyRank` mayor al de `Banner_Mongolia`. Sin este banner, "The Face" quedaría autorado pero inalcanzable desde el Mapa de Aventuras — `ChapterBannerDefinition` vincula un banner a un único `ChapterDefinition`/escena, `SagaArcDefinition.Levels` no se usa para navegación.
- **`TheFace_Battle.unity`** (nueva escena): misma composición que `Corea_Battle.unity`/`Mongolia_Battle.unity`, generada por el mismo helper de `EmpireOfCatsContentBuilder.cs`, vinculada a `TheFaceArc` (no a `Chapter1Arc`); `BaseHealthBarView` de su `EnemyBasePrefab` es la primera instancia que cablea `m_BarrierIndicator` a un GameObject real.

## Relación con datos ya existentes

- `SagaArcDefinition.BossLevel` (`013-empire-of-cats-saga`) no cambia de esquema — esta feature es el primer comportamiento real que lo consume, pero solo como convención de autoría (research.md §1), no como dependencia de runtime.
- Ningún campo de `PlayerProgressSaveData`/`ProgressSaveData` se modifica — toda la barrera es estado runtime efímero sobre `BaseHealth`/`EnemyWaveSpawner` (spec.md FR-009), reiniciado en cada intento igual que `CurrentHealth` (`BaseHealth.ResetHealth`) y los flags de spawn (`EnemyWaveSpawner.ResetSpawner`).
- `IDamageable`/`ILaneOccupant` (`contracts/battle-runtime-interfaces.md` de `001-chapter1-vertical-slice`) no cambian de firma — `BaseHealth` sigue implementándolos sin alterar su contrato público existente.
