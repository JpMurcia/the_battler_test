# Contract: Oleadas por Umbral de Vida y Límite de Enemigos Simultáneos

Cubre FR-006, FR-007 de spec.md.

## EnemyWaveSpawner.Initialize — firma extendida

```csharp
public void Initialize(
    EnemyWaveDefinition wave,
    BaseHealth enemyBase = null,
    HealthThresholdWaveTrigger[] thresholdTriggers = null,
    int maxSimultaneousEnemies = 0,
    float enemyStrengthMultiplier = 1f)
{
    m_WaveDefinition = wave;
    m_Spawned = wave != null ? new bool[wave.WaveEntries.Length] : Array.Empty<bool>();
    m_EnemyBase = enemyBase;
    m_ThresholdTriggers = thresholdTriggers ?? Array.Empty<HealthThresholdWaveTrigger>();
    m_ThresholdFired = new bool[m_ThresholdTriggers.Length];
    m_MaxSimultaneousEnemies = maxSimultaneousEnemies;
    m_EnemyStrengthMultiplier = enemyStrengthMultiplier;
    m_BattleTimer = 0f;
}
```

Todos los parámetros nuevos son opcionales con defaults que preservan el comportamiento actual (`enemyBase = null` ⇒ sin triggers evaluables aunque se pasen; `maxSimultaneousEnemies = 0` ⇒ sin límite; `enemyStrengthMultiplier = 1f` ⇒ sin escalado). Ningún call site existente (`Chapter1_Battle.unity`, `Chapter2_Battle.unity`) necesita cambiar.

## Evento nuevo (FR-019, añadido tras `/speckit-analyze` — hallazgo E1)

```csharp
public event Action<int> ThresholdWaveTriggered; // indice dentro del array de triggers pasado a Initialize()
```

FR-019 exige notificar "disparo de una oleada de refuerzo por umbral de vida" vía evento de suscripción; el diseño original de este contrato lo omitía. Se invoca en `Update()` (ver abajo) en el mismo punto donde se marca `m_ThresholdFired[i] = true`, independientemente de si hay cupo para generar la oleada de refuerzo (el evento notifica "el umbral se cruzó", no "la oleada se generó por completo").

## Update() — lógica combinada

```csharp
private void Update()
{
    if (!m_IsRunning) return;

    m_BattleTimer += Time.deltaTime;
    bool hasRoomToSpawn() => m_MaxSimultaneousEnemies <= 0 || LaneRegistry.CountAlive(Team.Enemy) < m_MaxSimultaneousEnemies;

    if (m_WaveDefinition != null)
    {
        var entries = m_WaveDefinition.WaveEntries;
        for (int i = 0; i < entries.Length; i++)
        {
            if (m_Spawned[i] || m_BattleTimer < entries[i].spawnTimeSeconds) continue;
            if (!hasRoomToSpawn()) continue; // difiere: NO se marca m_Spawned[i], se reintenta el siguiente Update()

            m_Spawned[i] = true;
            SpawnEnemy(entries[i].unit, entries[i].lanePosition);
        }
    }

    if (m_EnemyBase != null && m_EnemyBase.MaxHealth > 0)
    {
        float healthPercent = m_EnemyBase.CurrentHealth / (float)m_EnemyBase.MaxHealth;
        for (int i = 0; i < m_ThresholdTriggers.Length; i++)
        {
            if (m_ThresholdFired[i] || healthPercent > m_ThresholdTriggers[i].ThresholdPercent) continue;

            m_ThresholdFired[i] = true; // se marca disparado SIEMPRE (no reintenta) - un umbral cruzado dispara una unica vez, con o sin cupo
            ThresholdWaveTriggered?.Invoke(i); // FR-019/data-model.md - notifica a la UI que este umbral disparo, con o sin cupo disponible
            var reinforcement = m_ThresholdTriggers[i].ReinforcementWave;
            if (reinforcement == null) continue;

            foreach (var entry in reinforcement.WaveEntries)
            {
                if (!hasRoomToSpawn()) break; // el resto de esta oleada de refuerzo se pierde si no hay cupo - ver nota abajo
                SpawnEnemy(entry.unit, entry.lanePosition);
            }
        }
    }
}

private void SpawnEnemy(UnitDefinition unit, float lanePosition)
{
    var spawnPosition = new Vector3(lanePosition, 0f, 0f) + LaneVisualSpread.RandomOffset();
    var instance = UnitRuntimePool.Get(m_UnitRuntimePrefab, spawnPosition, Quaternion.identity);
    instance.Initialize(unit, Team.Enemy, lanePosition, UnitEvolutionStage.FormaBase, m_EnemyStrengthMultiplier);
}
```

**Nota de diseño — oleada de refuerzo y límite simultáneo**: el trigger de % de vida se marca `m_ThresholdFired[i] = true` de forma incondicional en cuanto se cruza el umbral (nunca se reintenta en un `Update()` posterior), porque semánticamente es "un evento que ocurrió", no "una entrada de horario pendiente". Si el límite de enemigos impide generar toda la oleada de refuerzo de golpe, los enemigos de esa oleada que no cupieron simplemente no se generan (más simple que una segunda cola de reintento anidada; no hay ninguna historia de usuario en spec.md que exija que la oleada de refuerzo se complete eventualmente si el límite lo bloquea). Los niveles configurados en las tareas de `/speckit-tasks` deben dimensionar `MaxSimultaneousEnemies` con margen suficiente para su(s) `HealthThresholdWaveTrigger` (p. ej. Mongolia: límite 4, oleada de refuerzo de 4 Serpis — el límite ya vigente puede estar reduciendo el cupo disponible en ese instante; esto es un caso de balance de datos, no un bug de esta lógica).

## ResetSpawner()

Debe reiniciar también `m_ThresholdFired` (todo a `false`), igual que ya reinicia `m_Spawned` — necesario para que `BattleStateManager.RetryBattle()` (que ya llama a `ResetSpawner()`) no arrastre triggers ya disparados de un intento anterior.

## LaneRegistry.CountAlive — ver [data-model.md](../data-model.md#laneregistry-existente--assetsscriptslaneregistrycs--método-nuevo)

## Acceptance mapping

- spec.md Historia 2, Escenarios 1-3 (Mongolia, umbral 50%, oleada de 4 Serpis; múltiples umbrales en un mismo golpe) ⇐ el bucle sobre `m_ThresholdTriggers` no hace `break`/`return` tras el primero — todos los no disparados con `healthPercent <= ThresholdPercent` se procesan en el mismo `Update()`.
- spec.md Historia 3, Escenarios 1-2 (límite de 3, cuarto enemigo retenido hasta que muere uno) ⇐ `hasRoomToSpawn()` sobre la lista por horario, sin marcar `m_Spawned[i]` hasta el spawn real.
