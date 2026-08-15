# Contract: Daño Crítico (`UnitRuntime.ComputeOutgoingDamage()`, `AttackType.Critical`)

Ver [research.md §3-§4](../research.md) para las decisiones de diseño detrás de este contrato.

## Precondición

`m_Source.AttackType == AttackType.Critical`. Targeting sin cambios respecto a `SingleTarget` (mismo objetivo más cercano).

## Algoritmo (`ComputeOutgoingDamage(target)`, extensión de `016-combat-ability-catalog`)

```text
ComputeOutgoingDamage(target):
    baseDamage = m_CombatProfile.Damage

    dealtMultiplier = ... (Fuerte Contra, sin cambios, 016)
    weakenMultiplier = ... (Debilitar, sin cambios, 016)

    criticalMultiplier = 1f
    si m_Source.AttackType == AttackType.Critical Y UnityEngine.Random.value < m_Source.CriticalChance:
        criticalMultiplier = 2f

    return Mathf.Max(1, Mathf.RoundToInt(baseDamage * dealtMultiplier * weakenMultiplier * criticalMultiplier))
```

## Postcondiciones / invariantes

- **FR-006/FR-007**: con `CriticalChance == 1f`, todo ataque de esa unidad resulta en `criticalMultiplier == 2f` (100% de los ataques infligen el doble); con `CriticalChance == 0f`, `UnityEngine.Random.value < 0f` nunca es verdadero — `criticalMultiplier` es siempre `1f`.
- El roll se evalúa **una vez por invocación de `ComputeOutgoingDamage`** — para `AttackType.Area`, cada objetivo dañado en el mismo ciclo de ataque obtiene su propio roll independiente (mismo criterio que cualquier otro multiplicador ya evaluado por objetivo en ese bucle); `AttackType.Critical` no se combina con `AttackType.MultiHit` ni `AttackType.Area` en una misma unidad (son valores mutuamente excluyentes del mismo campo, spec.md Edge Cases), por lo que en la práctica este caso no ocurre hoy — se documenta igualmente para dejar explícito que no haría falta cambiar nada si se combinaran en el futuro.
- El multiplicador crítico se compone con los ya existentes (`dealtMultiplier`, `weakenMultiplier`) en la misma expresión, antes del `Mathf.Max(1, ...)` final — ningún llamador de `ComputeOutgoingDamage` cambia de firma.
- Determinismo en tests: el PlayMode test que valida SC-004 llama `UnityEngine.Random.InitState(<seed fijo>)` antes de generar su muestra (research.md §4) — no se introduce ninguna interfaz de aleatoriedad nueva en producción.
