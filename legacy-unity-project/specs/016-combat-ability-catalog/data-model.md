# Data Model: Ampliación del Catálogo de Habilidades de Combate

Todas las entidades marcadas **[Serializable]** son clases planas anidadas en un `[SO]` (mismo patrón que 008). Las marcadas **[Runtime]** son estado en tiempo de ejecución. Este documento solo describe lo que esta feature **añade o modifica**; todo lo no mencionado explícitamente (por ejemplo, `ClassificationType`, `SpecialClassificationType`, `MatchesTarget` de `TraitTargetingAbility`, `Immunity.Blocks`) queda exactamente como lo dejó 008, sin cambios.

## AbilityEffectType (enum, `TheBattler.Core`) — modificado

```csharp
public enum AbilityEffectType
{
    Curse,   // 0 — sin cambios, comportamiento de 008 intacto
    Weaken,  // 1 — nuevo (Debilitar)
    Freeze,  // 2 — nuevo (Congelar)
    Slow     // 3 — nuevo (Ralentizar)
}
```

**Reglas de validación**:
- `Curse` DEBE seguir siendo el miembro `0` (FR-010 de esta spec, mismo criterio de estabilidad que 007/008).
- `Weaken`/`Freeze`/`Slow` tienen comportamiento runtime real definido por esta feature (a diferencia de cómo `AbilityEffectType` nació en 008, donde solo `Curse` tenía comportamiento). El enum sigue abierto a extensión futura (Golpe Letal, Zombie Killer, Warp, etc. — fuera de alcance).

## TraitTargetingAbility **[Serializable]** (extensión de 008, `TheBattler.Model`) — modificado

Se añade un campo; los ya existentes (`effectType`, `durationSeconds`, `targetClassificationTypes`, `includedSpecialTypes`) y el algoritmo `MatchesTarget` no cambian.

| Campo | Tipo | Regla de validación |
|---|---|---|
| `magnitude` (`m_Magnitude`) | `float` | Intensidad del efecto, interpretación según `effectType`: fracción de daño reducido (0-1) para `Weaken`; fracción de velocidad reducida (0-1) para `Slow`; sin uso observable para `Freeze`/`Curse` (mismo criterio que `durationSeconds` para un efecto sin comportamiento temporal). Default `0f` — una `TraitTargetingAbility` ya serializada por 008 (sin este campo) deserializa a `0f`, equivalente a "sin magnitud declarada" (FR-010). |

## NeutralAbility **[Serializable]** (extensión de 008, `TheBattler.Model`) — modificado

| Campo | Tipo | Regla de validación |
|---|---|---|
| `magnitude` (`m_Magnitude`) | `float` | Misma regla e interpretación que en `TraitTargetingAbility`. Default `0f`. |

## StrongAgainstModifier **[Serializable]** (nueva, anidada en `UnitDefinition`, `TheBattler.Model`)

Modificador de combate permanente (sin duración) declarado por una unidad hacia un rasgo objetivo (FR-004).

| Campo | Tipo | Regla de validación |
|---|---|---|
| `targetClassificationTypes` (`m_TargetClassificationTypes`) | `ClassificationType[]` | Uno o más tipos estándar contra los que aplica este modificador. Mismo criterio de "contra todos" que `TraitTargetingAbility` (008 research.md §4): poblar con los 8 valores expresa "contra todos los tipos estándar". |
| `includedSpecialTypes` (`m_IncludedSpecialTypes`) | `SpecialClassificationType[]` | Cero o más tipos especiales incluidos explícitamente. Vacío por defecto — mismo criterio de exclusión que `TraitTargetingAbility` (008 FR-004). |
| `damageDealtMultiplier` (`m_DamageDealtMultiplier`) | `float` | Multiplicador aplicado al daño infligido cuando el objetivo coincide. `1.0` = sin cambio. Valores `> 1.0` aumentan el daño infligido (FR-004, US4 Escenario 1). **Corrección de `/speckit.analyze` (hallazgo F3)**: DEBE declararse con inicializador explícito `= 1f` en el código (`[SerializeField] private float m_DamageDealtMultiplier = 1f;`) — el default de C#/Unity para un `float` sin inicializador es `0f`, no `1f`; sin este inicializador explícito, cualquier `StrongAgainstModifier` nuevo autorado en el Inspector sin tocar este campo anularía el daño infligido en vez de dejarlo sin cambio. |
| `damageReceivedMultiplier` (`m_DamageReceivedMultiplier`) | `float` | Multiplicador aplicado al daño recibido cuando el atacante coincide. `1.0` = sin cambio. Valores `< 1.0` reducen el daño recibido (FR-004, US4 Escenario 3). Misma corrección de F3 que `damageDealtMultiplier`: DEBE declararse `= 1f` explícitamente. |

**Método de comportamiento — `MatchesTarget`** (mismo algoritmo que `TraitTargetingAbility.MatchesTarget`, 008 — duplicado deliberadamente, ver research.md §2):

```csharp
public bool MatchesTarget(ClassificationType targetClassification, SpecialClassificationType targetSpecialType)
```

## Resistance **[Serializable]** (nueva, anidada en `UnitDefinition`, `TheBattler.Model`)

Declaración de resistencia parcial a un efecto específico (FR-005) — distinta de `Immunity` (008), que bloquea por completo.

| Campo | Tipo | Regla de validación |
|---|---|---|
| `effectType` (`m_EffectType`) | `AbilityEffectType` | Efecto al que esta unidad/enemigo es parcialmente resistente. |
| `reductionFactor` (`m_ReductionFactor`) | `float` | Fracción de la duración que se resta cuando el efecto se recibe, entre `0` (sin efecto de la resistencia) y `1` (equivalente observable a inmunidad para esa instancia — duración resultante `0`). Sin límite superior impuesto por código más allá de este rango recomendado; valores fuera de `[0,1]` son responsabilidad de quien autora el dato (mismo criterio de "sin `OnValidate` adicional" que 008). |

**Método de comportamiento — `Reduce`**:

```csharp
public float Reduce(AbilityEffectType effectType, float durationSeconds)
{
    if (m_EffectType != effectType) return durationSeconds;
    return Mathf.Max(0f, durationSeconds * (1f - m_ReductionFactor));
}
```

Una `UnitDefinition` puede declarar varias `Resistance` (una por cada `AbilityEffectType`); no hay límite superior. Si el resultado es `0f`, el efecto se trata como no aplicado (mismo resultado observable que `Immunity`, cubre el edge case de spec.md).

## IEffectReceiver (interfaz de 008, `TheBattler.Core`) — firma extendida

**Corrección de `/speckit.analyze` (hallazgo F1, ver research.md §7)**: `ApplyEffect` gana un tercer parámetro `magnitude` con default `0f`, en vez del método interno separado `ApplyMagnitudeIfApplicable` del diseño original de esta feature.

```csharp
public interface IEffectReceiver
{
    ClassificationType ClassificationType { get; }
    SpecialClassificationType SpecialClassificationType { get; }

    bool IsImmuneTo(AbilityEffectType effectType);
    void ApplyEffect(AbilityEffectType effectType, float durationSeconds, float magnitude = 0f); // magnitude: nuevo (016)
}
```

Extensión aditiva (parámetro con valor por defecto) sobre la interfaz ya definida por 008 — el único call site existente (`ApplyAbilitiesTo`) pasa a proveer `magnitude` explícitamente; cualquier código que siga llamando `ApplyEffect(effectType, duration)` sin el tercer argumento (no hay ninguno hoy) seguiría compilando. Ver [contracts/ability-effect-catalog.md](./contracts/ability-effect-catalog.md) para el porqué de este cambio de diseño.

## IAttackerAwareDamageable (interfaz nueva, `TheBattler.Core`)

```csharp
public interface IAttackerAwareDamageable
{
    void ApplyDamage(int amount, ClassificationType attackerClassification, SpecialClassificationType attackerSpecialType);
}
```

Implementada únicamente por `UnitRuntime` (`Gameplay`) — **no** por `BaseHealth` (mismo criterio que `IEffectReceiver` en 008: las bases quedan fuera del alcance de Fuerte Contra en esta feature). No reemplaza `IDamageable.ApplyDamage(int)` (001) — es un método adicional que `Attack()` (007) usa *cuando el objetivo lo implementa*, cayendo de vuelta al `ApplyDamage(int)` ya existente en caso contrario (`BaseHealth`). Ver contracts/strong-against-combat.md para el algoritmo completo.

## UnitDefinition **[SO]** (extensión de 008, coexiste con 007/009/012/013)

Se añaden 2 campos nuevos; ningún campo ya existente (001/007/008/009/012/013) cambia de forma ni de regla de validación (FR-010 de esta spec).

| Campo | Tipo | Regla de validación |
|---|---|---|
| `strongAgainstModifiers` (`m_StrongAgainstModifiers`) | `StrongAgainstModifier[]` | Cero o más modificadores de combate por rasgo (FR-004). Default `Array.Empty<StrongAgainstModifier>()` — una `UnitDefinition` ya existente deserializa a lista vacía, equivalente a "sin Fuerte Contra declarado". |
| `resistances` (`m_Resistances`) | `Resistance[]` | Cero o más resistencias parciales declaradas (FR-005). Mismo comportamiento por defecto que `strongAgainstModifiers`. |

## UnitRuntime **[Runtime]** (extensión de 008, comportamiento en `Gameplay`)

Sin cambios de forma en sus campos/propiedades públicas ya existentes (`IsCursed`, `ClassificationType`, `SpecialClassificationType`, etc.). Se añade, siguiendo exactamente el mismo patrón que `m_CurseRemainingSeconds`/`IsCursed` (008):

| Campo/Propiedad | Tipo | Notas |
|---|---|---|
| `m_WeakenRemainingSeconds` | `float` (privado) | `0` = sin Debilitar activo. Decrementado en `Update()`. |
| `m_WeakenMagnitude` | `float` (privado) | Magnitud del Debilitar activo actualmente (se conserva la de mayor magnitud entre aplicaciones simultáneas, mismo criterio `Mathf.Max` que la duración — FR-008). |
| `IsWeakened` | `bool` (derivado) | `m_WeakenRemainingSeconds > 0f`. Mientras es `true`, el daño infligido por `Attack()` se reduce por `m_WeakenMagnitude` (FR-001). |
| `m_FreezeRemainingSeconds` | `float` (privado) | `0` = sin Congelar activo. |
| `IsFrozen` | `bool` (derivado) | `m_FreezeRemainingSeconds > 0f`. Mientras es `true`, `Update()` no evalúa adquisición de objetivo ni invoca `Move()`/`Attack()` (FR-002). |
| `m_SlowRemainingSeconds` | `float` (privado) | `0` = sin Ralentizar activo. |
| `m_SlowMagnitude` | `float` (privado) | Magnitud del Ralentizar activo (mismo criterio `Mathf.Max` que `m_WeakenMagnitude`). |
| `IsSlowed` | `bool` (derivado) | `m_SlowRemainingSeconds > 0f`. Mientras es `true` y la unidad no está congelada, `Move()` reduce `c_MoveSpeed` por `m_SlowMagnitude` (FR-003). |

**Corrección de `/speckit.analyze` (hallazgo F2)**: los 5 campos de arriba DEBEN resetearse a `0f` en `Initialize()`, junto al reset ya existente de `m_CurseRemainingSeconds` (008) — sin esto, una instancia de `UnitRuntime` reciclada desde `UnitRuntimePool` puede heredar Debilitar/Congelar/Ralentizar de un despliegue anterior. Ver [contracts/ability-effect-catalog.md § Initialize()](./contracts/ability-effect-catalog.md#initialize--reset-de-estado-al-reciclar-del-pool-corrige-f2).

Comportamiento completo (`Update()`/`Move()`/`Attack()`/`ApplyEffect()`/nuevo `ApplyDamage(int, ClassificationType, SpecialClassificationType)`) en [contracts/unit-runtime-ability-behavior-extension.md](./contracts/unit-runtime-ability-behavior-extension.md) y [contracts/strong-against-combat.md](./contracts/strong-against-combat.md).

## Relación con entidades existentes

- **`UnitDefinition` (001, extendida por 007/008/009/012/013)**: esta feature añade los 2 campos nuevos descritos arriba, sin tocar ningún campo previo — cumple FR-010. Toda `UnitDefinition` ya serializada deserializa los campos nuevos a sus valores por defecto (arrays vacíos) sin acción manual.
- **`TraitTargetingAbility`/`NeutralAbility` (008)**: ganan `magnitude` (default `0f`); su algoritmo de matching (`MatchesTarget`, solo en `TraitTargetingAbility`) y el resto de sus campos no cambian.
- **`Immunity` (008)**: sin cambios — sigue siendo bloqueo binario total. `Resistance` es una entidad nueva e independiente, no una generalización de `Immunity` (research.md §3).
- **`IEffectReceiver` (008)**: sin cambios en su contrato (`ApplyEffect`/`IsImmuneTo`/`ClassificationType`/`SpecialClassificationType`); su implementación en `UnitRuntime` gana lógica interna nueva (consulta `Resistance` antes de fijar la duración de un efecto) sin cambiar su firma pública.
- **`UnitRuntime` (001/007/008)**: gana los 3 pares de temporizador/magnitud de arriba y la implementación de `IAttackerAwareDamageable`; su ramificación por `AttackType` (007) y su guard de `IsCursed` (008) no cambian — los efectos nuevos se leen/escriben en los mismos puntos de inserción ya contractados (`Update()`, `Attack()`), sin mover ninguna lógica existente.
- **`BaseHealth` (001)**: sin cambios — no implementa `IAttackerAwareDamageable`, igual que ya no implementaba `IEffectReceiver` (008). Sigue recibiendo únicamente `ApplyDamage(int)`.

## Diagrama de relaciones (alto nivel)

```text
UnitDefinition [SO]  (001, +attackType 007, +clasificación/habilidades 008)
├── traitTargetingAbilities: TraitTargetingAbility[]   (008, + magnitude nuevo)
├── neutralAbilities: NeutralAbility[]                 (008, + magnitude nuevo)
├── immunities: Immunity[]                             (008, sin cambios)
├── strongAgainstModifiers: StrongAgainstModifier[]    (nuevo, [Serializable], default vacío)
│                            └── MatchesTarget(ClassificationType, SpecialClassificationType)
└── resistances: Resistance[]                          (nuevo, [Serializable], default vacío)
                  └── Reduce(AbilityEffectType, float) -> float

UnitRuntime [Runtime] (Gameplay, implementa IEffectReceiver [008] + IAttackerAwareDamageable [nuevo])
├── m_WeakenRemainingSeconds / m_WeakenMagnitude / IsWeakened   (nuevo)
├── m_FreezeRemainingSeconds / IsFrozen                          (nuevo)
├── m_SlowRemainingSeconds / m_SlowMagnitude / IsSlowed          (nuevo)
├── ApplyEffect(AbilityEffectType, float)               (008, + consulta Resistance antes de fijar duración)
└── ApplyDamage(int, ClassificationType, SpecialClassificationType)   (nuevo, IAttackerAwareDamageable)

BaseHealth [Runtime] (001) — NO implementa IAttackerAwareDamageable, fuera de alcance.
```
