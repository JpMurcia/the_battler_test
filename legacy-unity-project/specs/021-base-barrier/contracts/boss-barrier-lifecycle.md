# Contract: Ciclo de Vida de la Barrera de Base Enemiga (`BaseHealth` + `EnemyWaveSpawner` + `UnitRuntime`)

Ver [research.md §1-§3](../research.md) para las decisiones de diseño detrás de este contrato.

## `BaseHealth.ApplyDamage(int amount)` — guard extendido (extensión aditiva)

```text
ApplyDamage(amount):
    si amount <= 0 O IsDestroyed O IsBarrierActive: return   # unico cambio: + IsBarrierActive

    ... (resto sin cambios: descuenta vida, dispara HealthDepleted una sola vez) ...
```

**Regla de contrato**: mientras `IsBarrierActive == true`, `ApplyDamage` es un no-op total — ni siquiera actualiza `CurrentHealth` ni dispara `HealthChanged`/`HealthDepleted`. Indistinguible, desde fuera, de un ataque con `amount <= 0` (spec.md FR-002, SC-001).

## `BaseHealth.ActivateBarrier()` / `RemoveBarrier()` — idempotentes

```text
ActivateBarrier():
    si IsBarrierActive: return   # ya activa, no-op
    IsBarrierActive = true
    BarrierStateChanged?.Invoke()

RemoveBarrier():
    si !IsBarrierActive: return   # ya retirada, no-op
    IsBarrierActive = false
    BarrierStateChanged?.Invoke()
```

**Regla de contrato**: `BarrierStateChanged` solo se dispara en una transición real — llamar `ActivateBarrier()` dos veces seguidas, o `RemoveBarrier()` sobre una barrera ya retirada, no genera un segundo evento (evita que `BaseHealthBarView` refresque sin necesidad).

## `EnemyWaveSpawner.Initialize(...)` — activación al arranque del nivel (extensión aditiva)

```text
Initialize(wave, enemyBase, thresholdTriggers, maxSimultaneousEnemies, enemyStrengthMultiplier):
    ... (comportamiento existente: cachear wave/base/triggers/multiplicador — sin cambios) ...

    m_LinkedBossEntryIndex = indice de la primera WaveEntry con isLinkedBoss == true en wave.WaveEntries, o -1 si ninguna

    si m_LinkedBossEntryIndex >= 0:
        enemyBase?.ActivateBarrier()   # research.md §3 — antes de que arranque el spawneo, no diferido al spawn del jefe
```

## `EnemyWaveSpawner.ResetSpawner()` — reactivación en cada reintento (extensión aditiva)

```text
ResetSpawner():
    ... (comportamiento existente: reset de m_BattleTimer, m_Spawned[], m_ThresholdFired[] — sin cambios) ...

    si m_LinkedBossEntryIndex >= 0:
        m_EnemyBase?.ActivateBarrier()   # FR-007 — la barrera vuelve a empezar activa en cada intento nuevo
```

**Regla de contrato**: `RetryBattle()` (`BattleStateManager`) ya llama `m_EnemyWaveSpawner.ResetSpawner()` seguido de `m_EnemyBase.ResetHealth()` — el orden entre ambas llamadas no importa para la barrera (`ResetHealth()` no la toca, data-model.md), a diferencia de si `ActivateBarrier()` dependiera de ejecutarse después de `ResetHealth()`.

## `EnemyWaveSpawner.SpawnEnemy(...)` — suscripción de un solo uso al jefe vinculado (extensión aditiva)

```text
SpawnEnemy(entryIndex, unit, lanePosition):
    instance = UnitRuntimePool.Get(...)
    instance.Initialize(unit, Team.Enemy, lanePosition, ...)
    EnemyEncountered?.Invoke(unit)   # sin cambios (019-library-screens)

    si entryIndex == m_LinkedBossEntryIndex:
        instance.Defeated += OnLinkedBossDefeated

OnLinkedBossDefeated(boss):
    boss.Defeated -= OnLinkedBossDefeated   # desuscripcion propia — un solo disparo por vida de la instancia
    m_EnemyBase?.RemoveBarrier()
```

**Regla de contrato**: derrotar cualquier enemigo regular de la oleada (`entryIndex != m_LinkedBossEntryIndex`) nunca dispara `OnLinkedBossDefeated` — esos spawns no se suscriben a `Defeated` (spec.md FR-005). Si `m_LinkedBossEntryIndex == -1` (nivel sin jefe vinculado), ningún spawn se suscribe nunca — comportamiento idéntico al de antes de esta feature (FR-006).

## `UnitRuntime.ApplyDamage(int amount)` — evento `Defeated` (extensión aditiva)

```text
ApplyDamage(amount):
    si amount <= 0 O IsDestroyed: return   # sin cambios

    CurrentHealth = max(0, CurrentHealth - amount)
    si IsDestroyed:
        Defeated?.Invoke(this)         # nuevo — antes de Release()
        UnitRuntimePool.Release(this)  # sin cambios
```

**Regla de contrato**: `Defeated` se dispara exactamente una vez por ciclo de vida de la instancia (mismo guard que ya impedía un segundo `Release()`), y siempre antes de que la instancia vuelva al pool — ningún suscriptor puede observar una instancia ya reciclada como si siguiera siendo el jefe (research.md §2).

## Acceptance mapping

| Escenario de spec.md | Cubierto por |
|---|---|
| US1 Escenario 1 (barrera activa bloquea daño) | `ApplyDamage` guard extendido + `Initialize`/`ResetSpawner` activando la barrera antes del primer ataque posible |
| US1 Escenario 2 (nivel sin BossLevel, sin regresión) | `m_LinkedBossEntryIndex == -1` ⇒ ninguna llamada a `ActivateBarrier()` |
| US2 Escenario 1 (derrota del jefe retira la barrera de inmediato) | `Defeated` síncrono → `OnLinkedBossDefeated` → `RemoveBarrier()`, sin ventana de un frame |
| US2 Escenario 2 (tras retirar la barrera, daño normal) | Guard de `ApplyDamage` vuelve a evaluar `IsBarrierActive == false` |
| US2 Escenario 3 (enemigos regulares derrotados, jefe vivo, barrera sigue activa) | Solo la entrada `isLinkedBoss` se suscribe a `Defeated` |
| Edge case (reintento reactiva la barrera) | `ResetSpawner()` vuelve a llamar `ActivateBarrier()` |
| Edge case (BossLevel sin jefe configurado, sin softlock) | `m_LinkedBossEntryIndex == -1` ⇒ comportamiento idéntico a un nivel sin barrera |
