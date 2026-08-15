# Contract: Registro de Enemigos Enfrentados (`EnemyWaveSpawner` → `BattleStateManager`)

Ver [research.md §1-§2](../research.md) para las decisiones de diseño detrás de este contrato.

## `EnemyWaveSpawner.SpawnEnemy(UnitDefinition unit, float lanePosition)` — extensión aditiva

```text
SpawnEnemy(unit, lanePosition):
    ... (comportamiento existente: instanciar desde el pool, Initialize — sin cambios) ...
    EnemyEncountered?.Invoke(unit)
```

## `BattleStateManager` — suscripción y persistencia

```text
Awake():
    ... (resolución existente de m_ProgressStore/m_PlayerProgressStore — sin cambios) ...
    m_EnemyWaveSpawner.EnemyEncountered += OnEnemyEncountered

OnEnemyEncountered(unit):
    si unit == null o string.IsNullOrEmpty(unit.UnitId): return   # defensivo, no deberia ocurrir

    playerProgress = m_PlayerProgressStore.Load()
    si Array.IndexOf(playerProgress.encounteredEnemyIds, unit.UnitId) >= 0: return   # ya registrado, no-op

    agregar unit.UnitId a playerProgress.encounteredEnemyIds
    m_PlayerProgressStore.Save(playerProgress)
```

## Postcondiciones / invariantes

- **FR-004**: el registro ocurre en el mismo instante en que el enemigo pasa a existir en el carril — antes de cualquier posible derrota, y sin importar el resultado final de la batalla.
- **FR-005**: la persistencia usa el mismo `IPlayerProgressStore` que el resto del progreso del jugador — sobrevive a cerrar y reabrir el juego.
- Un enemigo ya registrado que vuelve a aparecer (en la misma batalla tras un `RetryBattle()`, o en una batalla distinta más adelante) no duplica su entrada ni realiza una escritura innecesaria (guard `IndexOf`).
- Este contrato no depende de si la unidad enemiga llega a ser derrotada, ni del resultado de la batalla (Victoria/Derrota) — coherente con spec.md Edge Cases.
- `EnemyWaveSpawner` no depende de `IPlayerProgressStore` ni de ningún tipo de `Model` de persistencia — solo expone el evento; toda la responsabilidad de persistir vive en `BattleStateManager` (research.md §1, separación de responsabilidades ya establecida por el resto del proyecto).
