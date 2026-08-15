# Contract: IEffectReceiver

Capa: `TheBattler.Core`. Implementación de referencia: `UnitRuntime` en `TheBattler.Gameplay`. **No** implementada por `BaseHealth` (research.md §5, data-model.md § Relación con entidades existentes) — las bases quedan fuera del alcance de trait-targeting/neutral/immunity/Curse en esta feature.

## Interfaz

```csharp
namespace TheBattler.Core
{
    public interface IEffectReceiver
    {
        ClassificationType ClassificationType { get; }
        SpecialClassificationType SpecialClassificationType { get; }

        bool IsImmuneTo(AbilityEffectType effectType);
        void ApplyEffect(AbilityEffectType effectType, float durationSeconds);
    }
}
```

Es el único punto de contacto que `UnitRuntime` (como atacante) necesita sobre un `ILaneOccupant` objetivo para evaluar y aplicar habilidades de trait-targeting/neutrales — ver [unit-runtime-ability-behavior.md](./unit-runtime-ability-behavior.md) para cómo se invoca desde `Attack()`.

## `ClassificationType ClassificationType { get; }` / `SpecialClassificationType SpecialClassificationType { get; }`

- **Precondición**: ninguna.
- **Comportamiento**: exponen la clasificación declarada por el objetivo, para que quien ataca pueda evaluar `TraitTargetingAbility.MatchesTarget(receiver.ClassificationType, receiver.SpecialClassificationType)` (FR-005) sin necesitar acceso directo al `UnitDefinition` del objetivo (que podría no ser público desde `Gameplay` fuera de `UnitRuntime`).
- **Postcondición**: en `UnitRuntime`, son passthrough directo de `m_Source.ClassificationType`/`m_Source.SpecialClassificationType` — no cambian mientras la unidad está desplegada (`Initialize()` fija `m_Source` una única vez por ciclo de vida de la instancia pooled).

## `bool IsImmuneTo(AbilityEffectType effectType)`

- **Precondición**: ninguna.
- **Comportamiento**: recorre `m_Source.Immunities` y devuelve `true` si algún elemento `Blocks(effectType)` (FR-007). No tiene efectos secundarios — es una consulta pura sobre datos ya cargados en `Initialize()`.
- **Postcondición**: `false` si `m_Source.Immunities` está vacío (default, FR-010) o si ninguna entrada coincide con `effectType`.
- Expuesto también como consulta pública independiente de `ApplyEffect` (no solo como guard interno) para que tests EditMode/PlayMode puedan verificar SC-004 ("una unidad/enemigo inmune a un efecto nunca recibe ese efecto") sin depender de inspeccionar efectos secundarios internos.

## `void ApplyEffect(AbilityEffectType effectType, float durationSeconds)`

- **Precondición**: `durationSeconds` puede ser cualquier valor — la implementación no exige `> 0` a nivel de contrato (una llamada con `durationSeconds <= 0` para `Curse` no debe dejar la unidad en un estado "cursed" inconsistente; ver guard de implementación abajo).
- **Comportamiento** (implementación de referencia, `UnitRuntime`):
  1. Guard de inmunidad: si `IsImmuneTo(effectType)` es `true`, no hace nada — ni aplica el efecto ni deja rastro observable (FR-007; Edge Case de spec.md: "inmune a Curse y de todas formas lo recibe → el efecto no se aplica en absoluto; la unidad sigue usando sus habilidades con normalidad"). Mismo patrón de guard-al-inicio que `IDamageable.ApplyDamage` (001) ya usa para `amount <= 0`.
  2. Si `effectType == AbilityEffectType.Curse` y `durationSeconds > 0f`: `m_CurseRemainingSeconds = Mathf.Max(m_CurseRemainingSeconds, durationSeconds)` — una nueva aplicación de Curse mientras ya está activo extiende la duración hasta el mayor de los dos valores, nunca la acorta (evita que un segundo golpe con menor duración "adelante" la expiración de un Curse ya en curso).
  3. Cualquier otro `effectType` (sin comportamiento runtime definido en esta feature, ver `AbilityEffectType` en data-model.md): no-op deliberado. La inmunidad (paso 1) sigue aplicándose de forma genérica aunque el efecto en sí todavía no tenga comportamiento — esto es intencional, para que declarar una `Immunity` a un efecto futuro ya sea válido hoy sin requerir cambios a esta interfaz cuando ese efecto se implemente.
- **Postcondición**: para `Curse` sin inmunidad, `IsCursed` (`m_CurseRemainingSeconds > 0f`) pasa a `true` inmediatamente tras la llamada (FR-008).

## Doble de test

Los tests EditMode de `TraitTargetingAbility`/`NeutralAbility`/`Immunity` no requieren un doble de `IEffectReceiver` — son funciones puras sobre enums. Los tests PlayMode de comportamiento de habilidades usan instancias reales de `UnitRuntime` (mismo patrón que `AttackTypeBattlePlayModeTests` de 007, `ScriptableObject.CreateInstance<UnitDefinition>()` + reflexión) como implementación de `IEffectReceiver`, sin necesitar un doble/mock separado — verificando `IsImmuneTo`/`ApplyEffect`/`IsCursed` directamente sobre la instancia real tras uno o más ciclos de `Attack()`.
