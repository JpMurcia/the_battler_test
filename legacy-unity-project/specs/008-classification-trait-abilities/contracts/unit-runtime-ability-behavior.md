# Contract: UnitRuntime — comportamiento de habilidades avanzadas (trait-targeting, neutral, immunities, Curse)

Capa: `TheBattler.Gameplay`. Este documento no describe una interfaz nueva — describe el contrato de comportamiento que `UnitRuntime.Update()`/`Attack()` (`Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`, extendido por 007 con ramificación por `AttackType`) deben cumplir adicionalmente para esta feature, sin alterar el comportamiento ya contractado en `specs/007-attack-types/contracts/unit-attack-type-behavior.md`.

## `Update()` — descuento del temporizador de Curse propio

Antes (o después, el orden no afecta el resultado dentro del mismo frame) del bloque de adquisición de objetivo ya existente:

```csharp
if (m_CurseRemainingSeconds > 0f)
{
    m_CurseRemainingSeconds = Mathf.Max(0f, m_CurseRemainingSeconds - Time.deltaTime);
}
```

- **Comportamiento**: mientras `m_CurseRemainingSeconds > 0f`, `IsCursed` es `true`. Al llegar a `0f`, `IsCursed` pasa a `false` en el mismo frame en que el temporizador se agota — no hay un frame de retraso adicional.
- **Cobertura**: FR-009 / US5 Escenario 3 ("al expirar el efecto Curse, la unidad afectada DEBE recuperar el uso normal de sus habilidades especiales").
- **Sin cambios** sobre la adquisición de objetivo (`FindNearestTarget`/`FindFarthestTarget`) ni sobre `Move()`/`Attack()` en sí — Curse no impide que la unidad se mueva o inflija su daño base; solo desactiva sus propias habilidades avanzadas (ver `Attack()` abajo).

## `Attack()` — evaluación de habilidades tras cada `ApplyDamage`

`Attack()` (007) ya invoca `target.ApplyDamage(m_Source.Damage)` una vez por objetivo, para uno (`SingleTarget`/`LongDistance`) o varios objetivos (`Area`, vía `FindAllTargetsInRange`). Esta feature añade, inmediatamente después de cada llamada a `ApplyDamage` ya existente:

```csharp
ApplyAbilitiesTo(target);
```

donde:

```csharp
private void ApplyAbilitiesTo(ILaneOccupant target)
{
    if (IsCursed) return; // FR-008: mientras el atacante está bajo Curse, ninguna de SUS habilidades se aplica.
    if (!(target is IEffectReceiver receiver)) return; // p.ej. BaseHealth — fuera de alcance (research.md §5).

    foreach (var ability in m_Source.TraitTargetingAbilities)
    {
        if (ability.MatchesTarget(receiver.ClassificationType, receiver.SpecialClassificationType))
        {
            receiver.ApplyEffect(ability.EffectType, ability.DurationSeconds);
        }
    }

    foreach (var ability in m_Source.NeutralAbilities)
    {
        receiver.ApplyEffect(ability.EffectType, ability.DurationSeconds);
    }
}
```

- **Guard de Curse propio** (`IsCursed`, primera línea): implementa FR-008 en su totalidad — "mientras esté activo sobre una unidad, deshabilite todas sus habilidades especiales (trait-targeting y neutral)". El daño base (`ApplyDamage`, ya ejecutado antes de llegar aquí) **no** se ve afectado — Curse deshabilita habilidades especiales, no el ataque en sí (spec.md no lo pide).
- **Guard de tipo de objetivo** (`target is IEffectReceiver`): excluye `BaseHealth` de forma natural, sin una rama condicional explícita por tipo concreto (research.md §5).
- **Bucle de `TraitTargetingAbility`**: cada habilidad se evalúa de forma independiente contra el mismo `target` (spec.md Edge Cases: "cada una se evalúa y aplica de forma independiente; esta feature no define reglas especiales de combinación entre habilidades distintas"). `MatchesTarget` es la única condición de coincidencia — ver [trait-targeting-matching.md](./trait-targeting-matching.md).
- **Bucle de `NeutralAbility`**: sin condición de coincidencia — se invoca `ApplyEffect` incondicionalmente por cada una (FR-006, US3).
- **`ApplyEffect` es responsable de la inmunidad**: `ApplyAbilitiesTo` no consulta `IsImmuneTo` antes de llamar — el guard de inmunidad vive dentro de `IEffectReceiver.ApplyEffect` (ver [effect-receiver.md](./effect-receiver.md)), mismo patrón que `ApplyDamage` (001) ya usa para su propio guard (`amount <= 0`) en vez de que el llamador lo repita en cada punto de invocación.
- **Simetría jugador/enemigo**: `ApplyAbilitiesTo` no consulta `m_Team`/`m_Source.Team` en ningún punto — mismo criterio de simetría que 007 ya estableció para `AttackType` (FR-007 de 007). Una `UnitRuntime` con `Team.Enemy` y una `TraitTargetingAbility` configurada contra "Ángel" ejecuta exactamente la misma rama que una con `Team.Player`.

## Cobertura de Acceptance Scenarios

| Escenario | Cómo se cubre |
|---|---|
| US2 Escenario 1 (trait-targeting coincide) | `MatchesTarget` devuelve `true` → `ApplyEffect` se invoca sobre el objetivo del tipo declarado. |
| US2 Escenario 2 (trait-targeting no coincide) | `MatchesTarget` devuelve `false` → el bucle no invoca `ApplyEffect` para esa habilidad; solo el daño base (ya aplicado antes) afecta al objetivo. |
| US3 Escenario 1 (neutral siempre aplica) | El bucle de `NeutralAbility` no tiene condición — se aplica sin importar `ClassificationType`/`SpecialClassificationType` del objetivo. |
| US4 Escenarios 1-2 (tipo especial excluido salvo inclusión explícita) | Delegado enteramente a `MatchesTarget` — ver tabla de verdad en [trait-targeting-matching.md](./trait-targeting-matching.md). |
| US5 Escenario 1 (inmunidad bloquea el efecto) | `IEffectReceiver.ApplyEffect` no-opea si `IsImmuneTo(effectType)` — ver [effect-receiver.md](./effect-receiver.md). |
| US5 Escenario 2 (Curse deshabilita habilidades propias mientras está activo) | Guard `if (IsCursed) return;` al inicio de `ApplyAbilitiesTo` del atacante afectado. |
| US5 Escenario 3 (Curse expira y se recuperan las habilidades) | Descuento del temporizador en `Update()`; `IsCursed` pasa a `false` cuando `m_CurseRemainingSeconds` llega a `0f`. |
| Edge Case (inmune a Curse, lo recibe igual) | `ApplyEffect` no-opea en el paso de inmunidad antes de tocar `m_CurseRemainingSeconds` — la unidad nunca queda `IsCursed`. |

## Doble de test

`ClassificationAbilityBattlePlayModeTests` (PlayMode, mismo patrón que `AttackTypeBattlePlayModeTests` de 007 — `ScriptableObject.CreateInstance<UnitDefinition>()` + reflexión sobre campos privados, `UnitRuntime` en una escena mínima construida en runtime): cubre cada fila de la tabla de Acceptance Scenarios arriba, con al menos un caso repetido con `Team.Enemy` atacando unidades del jugador para confirmar simetría (mismo criterio que US4 de 007).
