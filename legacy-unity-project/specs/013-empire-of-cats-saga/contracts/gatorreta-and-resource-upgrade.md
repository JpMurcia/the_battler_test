# Contract: Gatorreta (Arma Especial de Área) y Mejora de Regeneración de Dinero

Cubre FR-010, FR-011, FR-012 de spec.md.

## GatorretaController (nuevo MonoBehaviour, `Assets/Scripts/Gameplay/Battler/GatorretaController.cs`)

```csharp
public class GatorretaController : MonoBehaviour
{
    [SerializeField, Min(0.1f)] private float m_RechargeSeconds = 30f;
    [SerializeField, Min(0.01f)] private float m_Range = 3f;
    [SerializeField, Min(1)] private int m_AreaDamage = 10;
    [SerializeField] private BaseHealth m_PlayerBase;

    private float m_RechargeRemaining;
    private readonly List<ILaneOccupant> m_TargetsBuffer = new List<ILaneOccupant>();

    public bool IsAvailable => m_RechargeRemaining <= 0f;
    public event Action Available;

    private void Awake() => m_RechargeRemaining = m_RechargeSeconds; // arranca recargando, no disponible de entrada

    private void Update()
    {
        if (m_RechargeRemaining <= 0f) return;

        m_RechargeRemaining = Mathf.Max(0f, m_RechargeRemaining - Time.deltaTime);
        if (m_RechargeRemaining <= 0f) Available?.Invoke();
    }

    public bool TryActivate()
    {
        if (!IsAvailable) return false; // Edge Case spec.md: no-op, no reinicia el temporizador

        LaneRegistry.FindAllTargetsInRange(Team.Player, m_PlayerBase.LanePosition, m_Range, m_TargetsBuffer);
        for (int i = 0; i < m_TargetsBuffer.Count; i++)
        {
            m_TargetsBuffer[i].ApplyDamage(m_AreaDamage);
        }

        m_RechargeRemaining = m_RechargeSeconds;
        return true;
    }

    public void ResetRecharge() => m_RechargeRemaining = m_RechargeSeconds; // llamado por BattleStateManager.RetryBattle()
}
```

**Por qué `Team.Player` como `seekerTeam`**: `LaneRegistry.FindAllTargetsInRange(seekerTeam, ...)` excluye ocupantes del mismo equipo que `seekerTeam` (`Assets/Scripts/LaneRegistry.cs`) — pasar `Team.Player` devuelve todo ocupante `Team.Enemy` en rango de la posición de carril de la base del jugador, igual que ya hace `UnitRuntime.Attack()` para `AttackType.Area` pasando el equipo del atacante.

**Integración con `BattleStateManager`**: `RetryBattle()` (ya existente) gana una línea `m_Gatorreta.ResetRecharge();` junto a los demás resets (`m_ResourceController.ResetResource()`, etc.) para que un reintento tras derrota no arranque con la Gatorreta ya cargada de la partida anterior.

**Integración con UI**: la capa `View` (fuera de alcance de código de este plan — mismo patrón que `MissionEnergyBarView`) se suscribe a `Available` para mostrar el indicador (FR-019) y llama a `TryActivate()` desde el input del jugador.

## BattleResourceController.TryUpgradeRegen (método nuevo sobre la clase existente)

```csharp
public bool TryUpgradeRegen(float cost, float regenIncrease)
{
    if (regenIncrease <= 0f) return false;
    if (!TrySpend(cost)) return false; // Edge Case spec.md: fondos insuficientes -> no-op, sin descuento

    RegenPerSecond += regenIncrease;
    return true;
}
```

Sin cambios a `Tick`, `TrySpend`, `ResetResource` existentes. `ResetResource()` ya reinicia `m_CurrentAmount` pero **no** `RegenPerSecond` — decisión deliberada: `RetryBattle()` reinicia el dinero acumulado pero conserva cualquier mejora de regeneración ya comprada en el intento anterior de la misma sesión de batalla sería inconsistente con "por el resto de esa batalla" (spec.md Historia 6). Por tanto `RetryBattle()` (ya existente en `BattleStateManager`) también debe restablecer `RegenPerSecond` a su valor de diseño original al reintentar — esto requiere que `BattleResourceController` exponga el valor de diseño (ya lo tiene como el valor serializado original `m_RegenPerSecond` fijado en el Inspector) y que `ResetResource()` lo restaure explícitamente en vez de solo poner `m_CurrentAmount = 0`. Ajuste necesario:

```csharp
private float m_DesignRegenPerSecond; // capturado en Awake(), antes de cualquier upgrade

private void Awake()
{
    m_DesignRegenPerSecond = m_RegenPerSecond;
    ResetResource();
}

public void ResetResource()
{
    m_CurrentAmount = 0f;
    m_RegenPerSecond = m_DesignRegenPerSecond; // FR-012 Edge Case: un reintento no conserva la mejora de regen comprada
}
```

## Acceptance mapping

- spec.md Historia 5, Escenarios 1-3 (disponibilidad al terminar recarga, daño de área a los que están en rango únicamente, no-op mientras recarga) ⇐ `Available` event + `TryActivate()` guardado por `IsAvailable`.
- spec.md Historia 6, Escenarios 1-2 (mejora de regen exitosa vs. fondos insuficientes) ⇐ `TryUpgradeRegen` atómico vía `TrySpend`.
