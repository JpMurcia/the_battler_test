# Contract: Fuerte Contra — cálculo de daño infligido/recibido

Capa: `TheBattler.Gameplay`. Describe cómo `UnitRuntime.Attack()` (007/008) calcula el daño final cuando alguna de las dos unidades involucradas declara `StrongAgainstModifier`, y la nueva interfaz `IAttackerAwareDamageable`.

**Nota (hallazgo F3 de `/speckit.analyze`)**: `modifier.DamageDealtMultiplier`/`modifier.DamageReceivedMultiplier`, referenciados abajo, asumen su default documentado de `1.0` (sin cambio) — eso solo es cierto si `StrongAgainstModifier.cs` los declara con inicializador explícito `= 1f` en C#, no con el default `0f` del lenguaje. Ver [data-model.md § StrongAgainstModifier](../data-model.md#strongagainstmodifier-serializable-nueva-anidada-en-unitdefinition-thebattlermodel) para el detalle.

## Orden de cálculo del daño (una sola pasada, sin recursión)

```csharp
private int ComputeOutgoingDamage(ILaneOccupant target)
{
    int baseDamage = m_CombatProfile.Damage;

    // 1. Bonificación de "Fuerte Contra" del ATACANTE (este UnitRuntime) — omitida si el atacante está maldecido (FR-007).
    float dealtMultiplier = 1f;
    if (!IsCursed && target is IEffectReceiver targetReceiver)
    {
        foreach (var modifier in m_Source.StrongAgainstModifiers)
        {
            if (modifier.MatchesTarget(targetReceiver.ClassificationType, targetReceiver.SpecialClassificationType))
            {
                dealtMultiplier *= modifier.DamageDealtMultiplier;
            }
        }
    }

    // 2. Penalización de Debilitar activo sobre el propio atacante.
    float weakenMultiplier = IsWeakened ? Mathf.Max(0f, 1f - m_WeakenMagnitude) : 1f;

    return Mathf.Max(1, Mathf.RoundToInt(baseDamage * dealtMultiplier * weakenMultiplier));
}
```

**Guard de daño mínimo**: `Mathf.Max(1, ...)` — mismo criterio ya usado por `UnitCombatProfile.Scaled` (013) para que ningún multiplicador deje el daño en `0`.

## Aplicación del daño — `IAttackerAwareDamageable` cuando el objetivo lo implementa

`Attack()` (007, ramas `SingleTarget`/`LongDistance`/`Area` sin cambios en cómo se elige el objetivo) reemplaza cada llamada directa a `target.ApplyDamage(m_CombatProfile.Damage)` por:

```csharp
int damage = ComputeOutgoingDamage(target);

if (target is IAttackerAwareDamageable awareTarget)
{
    awareTarget.ApplyDamage(damage, m_Source.ClassificationType, m_Source.SpecialClassificationType);
}
else
{
    target.ApplyDamage(damage); // BaseHealth y cualquier otro IDamageable que no declare Fuerte Contra recibido.
}

ApplyAbilitiesTo(target); // 008, sin cambios de orden — sigue después del daño.
```

## `UnitRuntime.ApplyDamage(int amount, ClassificationType attackerClassification, SpecialClassificationType attackerSpecialType)` — nuevo, `IAttackerAwareDamageable`

```csharp
public void ApplyDamage(int amount, ClassificationType attackerClassification, SpecialClassificationType attackerSpecialType)
{
    float receivedMultiplier = 1f;
    if (!IsCursed) // el receptor tampoco aplica su propia reducción si está maldecido — ver Rationale abajo.
    {
        foreach (var modifier in m_Source.StrongAgainstModifiers)
        {
            if (modifier.MatchesTarget(attackerClassification, attackerSpecialType))
            {
                receivedMultiplier *= modifier.DamageReceivedMultiplier;
            }
        }
    }

    int finalAmount = Mathf.Max(1, Mathf.RoundToInt(amount * receivedMultiplier));
    ApplyDamage(finalAmount); // 001, sin cambios — delega en el ApplyDamage(int) ya existente.
}
```

**Rationale — por qué `IsCursed` también suprime la reducción de daño recibido**: FR-007 de spec.md dice "una unidad bajo Maldición no debe aplicar ninguno de los efectos nuevos... ni la capacidad Fuerte Contra a otras unidades". Fuerte Contra tiene dos mitades — infligir más, recibir menos — y ambas son capacidades que la propia unidad "se aplica a sí misma"; tratar solo la mitad de "infligir" como bloqueada por Curse dejaría la otra mitad activa sin que spec.md lo distinga explícitamente. Se trata como una sola capacidad suprimida por completo mientras dure la Maldición, en ambos roles (atacante o defensor).

## Cobertura de Acceptance Scenarios

| Escenario | Cómo se cubre |
|---|---|
| US4 Escenario 1 (más daño contra el rasgo declarado) | `dealtMultiplier` incluye el `DamageDealtMultiplier` del `StrongAgainstModifier` que coincide con `target.ClassificationType`/`SpecialClassificationType`. |
| US4 Escenario 2 (sin bonificación contra otro rasgo) | `MatchesTarget` devuelve `false` para el modificador declarado → `dealtMultiplier` se queda en `1f`, daño base sin cambios. |
| US4 Escenario 3 (menos daño recibido del rasgo declarado) | `ApplyDamage(int, ClassificationType, SpecialClassificationType)` aplica `DamageReceivedMultiplier` cuando el `attackerClassification` recibido coincide con algún `StrongAgainstModifier` propio. |

## Doble de test

`StrongAgainstModifierMatchingTests` (EditMode, tabla de verdad de `MatchesTarget` — idéntica estructura a `TraitTargetingAbilityMatchingTests` de 008, aplicada a esta clase) + los tres escenarios de arriba cubiertos en `CombatAbilityCatalogBattlePlayModeTests` (PlayMode), incluido un caso donde ambas unidades (atacante y defensor) declaran `StrongAgainstModifier` entre sí simultáneamente, para confirmar que ambas mitades del cálculo son independientes y no se pisan.
