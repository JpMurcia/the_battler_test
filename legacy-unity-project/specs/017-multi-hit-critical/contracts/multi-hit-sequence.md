# Contract: Secuencia de Multi-Golpe (`UnitRuntime.Attack()`, rama `AttackType.MultiHit`)

Ver [research.md §1-§2](../research.md) para las decisiones de diseño detrás de este contrato.

## Precondición

`m_Source.AttackType == AttackType.MultiHit`. Targeting (adquisición de `m_CurrentTarget`) usa la misma rama que `SingleTarget`/`Critical` en `Update()` — objetivo más cercano, sin cambios respecto al targeting ya existente.

## Algoritmo (`Attack()`)

```text
Attack():
    si hay una secuencia en curso (m_MultiHitRemainingHits > 0):
        si m_MultiHitTarget es null, o esta destruido, o fuera de m_Source.Range:
            # FR-004: descartar los golpes restantes, no se aplican a otro objetivo
            m_MultiHitRemainingHits = 0
            m_MultiHitTarget = null
            return   # esta secuencia queda descartada; NO empieza una nueva este mismo frame

        m_MultiHitIntervalRemaining -= Time.deltaTime
        si m_MultiHitIntervalRemaining > 0: return

        DealDamageTo(m_MultiHitTarget)
        ApplyAbilitiesTo(m_MultiHitTarget)
        m_MultiHitRemainingHits -= 1
        m_MultiHitIntervalRemaining = c_MultiHitIntervalSeconds
        return

    # ninguna secuencia en curso: mismo gate de cooldown que las demas AttackType
    m_AttackCooldownRemaining -= Time.deltaTime
    si m_AttackCooldownRemaining > 0: return
    m_AttackCooldownRemaining = c_AttackIntervalSeconds
    disparar animator trigger "Attack"

    m_MultiHitTarget = m_CurrentTarget
    m_MultiHitRemainingHits = m_Source.MultiHitCount
    m_MultiHitIntervalRemaining = 0f   # el primer golpe se aplica en el mismo frame que dispara la animacion
    # el bucle de arriba consume este primer golpe (y los siguientes) en llamadas posteriores a Attack()
```

## Postcondiciones / invariantes

- **FR-002/FR-003**: una secuencia no interrumpida aplica exactamente `m_Source.MultiHitCount` impactos independientes (cada uno pasa por `DealDamageTo`/`ApplyAbilitiesTo`, igual que un ataque de único objetivo).
- **FR-004**: si `m_MultiHitTarget` deja de ser válido (destruido o fuera de rango) en cualquier punto de la secuencia, los golpes restantes se descartan — nunca se reasignan a `m_CurrentTarget` ni a ningún otro `ILaneOccupant`.
- **FR-005**: tras un descarte, la siguiente secuencia (cuando el cooldown externo vuelva a cumplirse) siempre arranca con `m_MultiHitRemainingHits = m_Source.MultiHitCount` completo — nunca hereda el conteo de la secuencia anterior.
- Caso degenerado (`MultiHitCount == 1`): la secuencia aplica un único golpe y termina — comportamiento observable idéntico a `SingleTarget` (spec.md Edge Cases).
- `m_MultiHitTarget` es independiente de `m_CurrentTarget`; el guard de Congelar (`IsFrozen`) en `Update()` sigue aplicando *antes* de llegar a `Attack()` — una unidad congelada no continúa ni empieza ninguna secuencia de Multi-Golpe (mismo criterio que congela cualquier otro `AttackType`).

## Reset obligatorio (`Initialize()`)

`m_MultiHitRemainingHits = 0`, `m_MultiHitTarget = null`, `m_MultiHitIntervalRemaining = 0f` — mismo criterio F2 que `016-combat-ability-catalog` ya aplicó a sus propios temporizadores, para que una instancia reciclada del pool no herede una secuencia a medias de un uso anterior.
