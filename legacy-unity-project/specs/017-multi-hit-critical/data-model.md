# Data Model: Extensión de Tipos de Ataque — Multi-Golpe y Crítico

## AttackType enum (extendido, `Assets/Scripts/Core/Battler/AttackType.cs`)

```csharp
public enum AttackType
{
    SingleTarget,   // 0 — sin cambios (007-attack-types)
    Area,           // 1 — sin cambios (007-attack-types)
    LongDistance,   // 2 — sin cambios (007-attack-types)
    MultiHit,       // 3 — nuevo (017)
    Critical        // 4 — nuevo (017)
}
```

**Invariante (FR-001)**: `SingleTarget`/`Area`/`LongDistance` DEBEN conservar los valores `0`/`1`/`2` — cualquier `UnitDefinition`/`EnemyWaveDefinition` ya serializada con esos valores sigue leyéndose exactamente igual tras esta feature.

## UnitDefinition (extendido, `Assets/Scripts/Model/Battler/UnitDefinition.cs`)

Campos nuevos, ambos con default seguro para cualquier `UnitDefinition` ya serializada (FR-009):

| Campo | Tipo | Default | Uso |
|---|---|---|---|
| `m_MultiHitCount` | `int`, `[Min(1)]` | `1` | Número de golpes por secuencia cuando `AttackType == MultiHit`. Un valor de `1` es un caso degenerado válido (equivale a `SingleTarget`, ver spec.md Edge Cases). Sin uso observable para los otros 4 `AttackType` — mismo criterio que `durationSeconds` en `AbilityEffectType.Curse` (008) o `magnitude` en `Freeze` (016): un campo que algunos valores del enum no consumen no es una inconsistencia nueva. |
| `m_CriticalChance` | `float`, `[Range(0f, 1f)]` | `0f` | Probabilidad de golpe crítico cuando `AttackType == Critical`. `0f` (nunca crítico) es el default seguro para cualquier unidad que no declare este campo. Sin uso observable para los otros 4 `AttackType`. |

Propiedades públicas nuevas: `MultiHitCount`, `CriticalChance` (mismo patrón de exposición que el resto de `UnitDefinition`).

`OnValidate()` gana el clamp correspondiente (`m_MultiHitCount < 1 → 1`), mismo patrón que los clamps ya existentes de `m_Cost`/`m_CooldownSeconds`/etc. (`Range` de Unity ya fuerza el clamp de `m_CriticalChance` en el Inspector, sin necesitar lógica adicional en `OnValidate()`).

## UnitRuntime (estado en memoria, no serializado — `Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`)

| Campo | Tipo | Reset en `Initialize()` | Uso |
|---|---|---|---|
| `m_MultiHitRemainingHits` | `int` | `0` | Golpes restantes de la secuencia de Multi-Golpe en curso. `0` = ninguna secuencia activa. |
| `m_MultiHitTarget` | `ILaneOccupant` | `null` | Snapshot del objetivo de la secuencia en curso (research.md §2) — independiente de `m_CurrentTarget`. |
| `m_MultiHitIntervalRemaining` | `float` | `0f` | Tiempo restante hasta el próximo golpe dentro de la secuencia en curso. |

Reset obligatorio en `Initialize()` (mismo criterio F2 ya aplicado por `016` a `m_WeakenRemainingSeconds`/etc.): una instancia reciclada del pool no debe heredar una secuencia de Multi-Golpe de un uso anterior.

Constante nueva: `c_MultiHitIntervalSeconds` (float, mismo patrón que `c_AttackIntervalSeconds`/`c_MoveSpeed` ya existentes — valor fijo razonable para el MVP, ajustable sin romper el contrato).

## Relación con datos ya existentes

- `AttackType.MultiHit`/`AttackType.Critical` son valores adicionales del mismo campo `UnitDefinition.AttackType` ya usado por `007-attack-types` — ninguna unidad puede declarar más de un `AttackType` a la vez (mismo criterio que Único/Área/Larga Distancia ya son mutuamente excluyentes, ver spec.md Edge Cases).
- El daño resultante de un golpe crítico o de cada golpe de una secuencia de Multi-Golpe sigue pasando por `ComputeOutgoingDamage()` (`016-combat-ability-catalog`), por lo que hereda automáticamente los multiplicadores de Debilitar/Fuerte Contra ya existentes sin ningún cambio en esas rutas.
