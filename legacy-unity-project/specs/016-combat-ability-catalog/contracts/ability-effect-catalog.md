# Contract: Catálogo de efectos — `ApplyEffect` extendido (Debilitar, Congelar, Ralentizar)

Capa: `TheBattler.Core`/`TheBattler.Gameplay`. Extiende `IEffectReceiver.ApplyEffect`/`IsImmuneTo` (008).

**Revisión post-`/speckit.analyze`**: la versión original de este contrato usaba un método `ApplyMagnitudeIfApplicable` separado, invocado antes de `ApplyEffect`. Se detectó (hallazgo F1) que esa separación permitía corromper la magnitud de un efecto ya activo cuando una reaplicación posterior era bloqueada por inmunidad o resistencia — el guard protegía la duración pero no la magnitud, que se escribía en una llamada aparte, sin guard. Este documento refleja el diseño corregido: `magnitude` viaja como parámetro del propio `ApplyEffect`, dentro del mismo guard que la duración. Ver research.md §7 para el detalle de la decisión.

## `IEffectReceiver.ApplyEffect` — firma extendida (modifica 008)

```csharp
public interface IEffectReceiver
{
    ClassificationType ClassificationType { get; }
    SpecialClassificationType SpecialClassificationType { get; }

    bool IsImmuneTo(AbilityEffectType effectType);
    void ApplyEffect(AbilityEffectType effectType, float durationSeconds, float magnitude = 0f); // magnitude: nuevo, default 0f
}
```

El parámetro `magnitude` tiene valor por defecto `0f` — el único call site existente hoy (`ApplyAbilitiesTo`, ver abajo) siempre lo provee explícitamente, pero el default preserva la posibilidad de invocar `ApplyEffect(effectType, duration)` sin él desde cualquier código futuro que no necesite magnitud (p. ej. `Curse`), sin romper la firma para nadie.

## `UnitRuntime.ApplyEffect(AbilityEffectType effectType, float durationSeconds, float magnitude = 0f)` — implementación

```csharp
public void ApplyEffect(AbilityEffectType effectType, float durationSeconds, float magnitude = 0f)
{
    if (IsImmuneTo(effectType)) return; // 008, sin cambios: bloqueo total, no llega a evaluar Resistance ni a tocar ningún campo.

    durationSeconds = ReduceByResistance(effectType, durationSeconds); // nuevo (016)
    if (durationSeconds <= 0f) return; // nuevo: resistencia total para esta instancia — ni duración ni magnitud se tocan.

    switch (effectType)
    {
        case AbilityEffectType.Curse: // 008, sin cambios
            m_CurseRemainingSeconds = Mathf.Max(m_CurseRemainingSeconds, durationSeconds);
            break;
        case AbilityEffectType.Weaken: // nuevo — duración Y magnitud se fijan juntas, mismo guard
            m_WeakenRemainingSeconds = Mathf.Max(m_WeakenRemainingSeconds, durationSeconds);
            m_WeakenMagnitude = Mathf.Max(m_WeakenMagnitude, magnitude);
            break;
        case AbilityEffectType.Freeze: // nuevo — sin magnitud (efecto binario)
            m_FreezeRemainingSeconds = Mathf.Max(m_FreezeRemainingSeconds, durationSeconds);
            break;
        case AbilityEffectType.Slow: // nuevo — duración Y magnitud se fijan juntas, mismo guard
            m_SlowRemainingSeconds = Mathf.Max(m_SlowRemainingSeconds, durationSeconds);
            m_SlowMagnitude = Mathf.Max(m_SlowMagnitude, magnitude);
            break;
    }
}
```

**Por qué esto corrige F1**: tanto la duración como la magnitud de `Weaken`/`Slow` se leen y escriben dentro de la **misma** rama del `switch`, después de los **mismos** dos guards (`IsImmuneTo`, `ReduceByResistance`). Ya no existe una ventana en la que la magnitud se actualice sin que la duración también lo haga (o viceversa) — ambas comparten exactamente el mismo camino de ejecución, así que no pueden desincronizarse.

`ApplyAbilitiesTo` (008, sin cambios en su recorrido de `TraitTargetingAbilities`/`NeutralAbilities`) pasa a hacer una única llamada por habilidad, en vez de dos:

```csharp
private void ApplyAbilitiesTo(ILaneOccupant target)
{
    if (IsCursed) return; // 008, sin cambios
    if (!(target is IEffectReceiver receiver)) return; // 008, sin cambios

    foreach (var ability in m_Source.TraitTargetingAbilities)
    {
        if (ability.MatchesTarget(receiver.ClassificationType, receiver.SpecialClassificationType))
        {
            receiver.ApplyEffect(ability.EffectType, ability.DurationSeconds, ability.Magnitude);
        }
    }

    foreach (var ability in m_Source.NeutralAbilities)
    {
        receiver.ApplyEffect(ability.EffectType, ability.DurationSeconds, ability.Magnitude);
    }
}
```

Para una `TraitTargetingAbility`/`NeutralAbility` con `EffectType = Curse` (008, ya serializada antes de esta feature), `Magnitude` deserializa a `0f` (FR-010) y se pasa igual — `Curse` la ignora por completo en su rama del `switch`, mismo resultado observable que antes de esta feature.

## `Update()` — descuento de los tres temporizadores nuevos

Mismo patrón que el descuento de `m_CurseRemainingSeconds` ya existente (008):

```csharp
if (m_WeakenRemainingSeconds > 0f) m_WeakenRemainingSeconds = Mathf.Max(0f, m_WeakenRemainingSeconds - Time.deltaTime);
if (m_FreezeRemainingSeconds > 0f) m_FreezeRemainingSeconds = Mathf.Max(0f, m_FreezeRemainingSeconds - Time.deltaTime);
if (m_SlowRemainingSeconds > 0f) m_SlowRemainingSeconds = Mathf.Max(0f, m_SlowRemainingSeconds - Time.deltaTime);
```

Al llegar a `0f`, `IsWeakened`/`IsFrozen`/`IsSlowed` pasan a `false` en el mismo frame — sin frame de retraso adicional (US1 Escenario 2, US2 Escenario 2, mismo criterio que Curse en 008).

## `Initialize()` — reset de estado al reciclar del pool (corrige F2)

**Hallazgo de `/speckit.analyze` (F2)**: la versión original de este contrato no especificaba el reset de los 5 campos nuevos al reciclar una instancia de `UnitRuntime` desde `UnitRuntimePool` — a diferencia de `m_CurseRemainingSeconds`, que 008 sí resetea explícitamente en `Initialize()`. Sin este reset, una unidad reciclada podía "heredar" Debilitar/Congelar/Ralentizar activo de un uso anterior en la misma batalla o en la siguiente.

Añadir a `Initialize()`, junto al reset ya existente de `m_CurseRemainingSeconds = 0f` (008):

```csharp
// Instancia reciclada del pool: descarta cualquier efecto de duración de un uso anterior.
m_WeakenRemainingSeconds = 0f;
m_WeakenMagnitude = 0f;
m_FreezeRemainingSeconds = 0f;
m_SlowRemainingSeconds = 0f;
m_SlowMagnitude = 0f;
```

Este bloque va en los tres overloads de `Initialize()` que ya existen (001/009/013) — o, más simple, en el punto único donde los cuatro overloads convergen internamente (el de 5 parámetros, del que los otros tres ya delegan, mismo patrón que `m_CurseRemainingSeconds = 0f` de 008 usa hoy).

## Cobertura de Acceptance Scenarios

| Escenario | Cómo se cubre |
|---|---|
| US1 Escenario 1 (Debilitar reduce daño) | `IsWeakened` verdadero → `Attack()` multiplica el daño base por `(1 - m_WeakenMagnitude)` antes de aplicarlo (ver strong-against-combat.md para el orden completo de multiplicadores). |
| US1 Escenario 2 (Debilitar expira) | Descuento de `m_WeakenRemainingSeconds` en `Update()`; al llegar a `0f`, `IsWeakened` pasa a `false`. |
| US1 Escenario 3 (reaplicación no acumula por debajo del mínimo) | `Mathf.Max` en duración y magnitud, ambas dentro de la misma rama del `switch` — un segundo impacto nunca deja el daño en menos que el mínimo ya activo. |
| US2 Escenario 1 (Congelar detiene por completo) | `IsFrozen` verdadero → guard temprano en `Update()`, ver unit-runtime-ability-behavior-extension.md. |
| US2 Escenario 2 (Congelar expira, comportamiento normal se retoma) | Mismo descuento de temporizador; sin estado adicional que "recordar". |
| US2 Escenario 3 (inmunidad bloquea Congelar) | `IsImmuneTo(AbilityEffectType.Freeze)` (008) → `ApplyEffect` retorna antes de tocar `m_FreezeRemainingSeconds`. |
| US2 Escenario 4 (reaplicación de Congelar no reduce la duración restante) | `Mathf.Max` en la rama `Freeze` del `switch`. |
| US3 Escenario 1 (Ralentizar reduce velocidad) | `IsSlowed` verdadero → `Move()` multiplica `c_MoveSpeed` por `(1 - m_SlowMagnitude)`. |
| US3 Escenario 2 (Congelar prevalece sobre Ralentizar) | Resuelto por construcción — ver research.md §5: `Move()` no se invoca en absoluto mientras `IsFrozen`. |
| US3 Escenario 3 (reaplicación de Ralentizar no acumula por debajo del mínimo) | `Mathf.Max` en duración y magnitud, misma rama `Slow` del `switch` — mismo criterio que US1 Escenario 3. |
| US5 (Resistencia reduce duración sin bloquear) | `ReduceByResistance` dentro de `ApplyEffect`, antes de fijar cualquier temporizador o magnitud. |
| Edge Case (unidad reciclada del pool no hereda efectos) | Reset explícito en `Initialize()`, ver sección de arriba. |

## Doble de test

`CombatAbilityCatalogBattlePlayModeTests` (PlayMode, mismo patrón que `ClassificationAbilityBattlePlayModeTests` de 008): cubre cada fila de arriba, con al menos un caso `Team.Enemy` para confirmar simetría, y un caso dedicado de reciclaje de pool (desplegar, destruir, volver a desplegar la misma instancia con un efecto nuevo) para el Edge Case de F2.
