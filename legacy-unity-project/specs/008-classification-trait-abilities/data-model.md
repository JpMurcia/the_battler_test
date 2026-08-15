# Data Model: Clasificación de Unidades/Enemigos y Habilidades Avanzadas (Trait-Targeting, Neutral, Immunities)

Todas las entidades marcadas **[SO]** son ScriptableObjects (datos de diseño, Principio V). Las marcadas **[Serializable]** son clases planas anidadas en un `[SO]` (mismo patrón que `EnemyWaveDefinition.WaveEntry`, 001) — datos de diseño editables en el Inspector sin ser un asset independiente. Las marcadas **[Runtime]** son estado en tiempo de ejecución, no se serializan como asset de diseño.

## ClassificationType (enum, `TheBattler.Core`)

```csharp
public enum ClassificationType
{
    Traitless,  // "Sin rasgo" — valor por defecto (FR-010)
    Red,
    Floating,
    Black,      // "Oscuro/Negro"
    Angel,
    Alien,
    Zombie,
    Relic
}
```

| Valor | Orden/valor numérico | Corresponde a |
|---|---|---|
| `Traitless` | `0` | "Sin rasgo" (FR-001, FR-010) |
| `Red` | `1` | "Rojo" |
| `Floating` | `2` | "Flotante" |
| `Black` | `3` | "Oscuro/Negro" |
| `Angel` | `4` | "Ángel" |
| `Alien` | `5` | "Alien" |
| `Zombie` | `6` | "Zombie" |
| `Relic` | `7` | "Relic" |

**Reglas de validación**:
- Exactamente estos 8 valores (FR-001). Obligatorio: toda `UnitDefinition` declara exactamente uno.
- `Traitless` DEBE seguir siendo el miembro `0`: es el valor por defecto de C#/Unity para un `[SerializeField]` no inicializado, y FR-010 exige que ese sea el comportamiento por defecto para `UnitDefinition` ya serializadas de 001/007 (mismo criterio que `AttackType.SingleTarget = 0` en 007, ver research.md §2).

## SpecialClassificationType (enum, `TheBattler.Core`)

```csharp
public enum SpecialClassificationType
{
    None,       // sin tipo especial declarado — valor por defecto (FR-010)
    Typeless,   // "Sin tipo"/Typeless — tipo especial real (FR-002), distinto de None
    Colossus,
    Behemoth,
    Sage,
    Metal,
    Witch,
    EvaAngel    // "EVA Angel"
}
```

| Valor | Orden/valor numérico | Corresponde a |
|---|---|---|
| `None` | `0` | Sin tipo especial declarado (FR-010) — **no** excluye de "contra todos" (FR-003) |
| `Typeless` | `1` | "Typeless (Sin tipo)" (FR-002) — **sí** excluye de "contra todos" (FR-004), como cualquier otro tipo especial |
| `Colossus` | `2` | "Colossus" |
| `Behemoth` | `3` | "Behemoth" |
| `Sage` | `4` | "Sage" |
| `Metal` | `5` | "Metal" |
| `Witch` | `6` | "Witch" |
| `EvaAngel` | `7` | "EVA Angel" |

**Reglas de validación**:
- Exactamente estos 8 valores (`None` + los 7 de FR-002). Opcional: una `UnitDefinition` puede quedarse en `None` o declarar exactamente uno de los 7 restantes.
- `None` DEBE seguir siendo el miembro `0`, por el mismo motivo que `Traitless` en `ClassificationType` (FR-010, ver research.md §2).
- **`None` ≠ `Typeless`** (ver research.md §2): son conceptos distintos aunque ambos se traduzcan coloquialmente como "sin tipo". `None` es la ausencia de declaración (FR-010); `Typeless` es una declaración explícita de uno de los 7 tipos especiales de FR-002, con el mismo efecto de exclusión de "contra todos" (FR-004) que `Colossus`/`Behemoth`/etc.

## AbilityEffectType (enum, `TheBattler.Core`)

```csharp
public enum AbilityEffectType
{
    Curse
}
```

**Reglas de validación**:
- Esta feature solo define `Curse` como valor concreto con comportamiento runtime (FR-008/FR-009). El enum queda deliberadamente abierto a que specs de contenido posteriores añadan nuevos miembros (p. ej. `Freeze`, `Knockback`, `Weaken`, `Warp` — mencionados en el roadmap general, no detallados aquí, ver spec.md Assumptions) **sin romper compatibilidad**, siempre que los miembros existentes no cambien de valor numérico (misma regla de estabilidad de orden que `AttackType`/`ClassificationType`).
- No tiene un valor `0`/`None` "sin efecto" — a diferencia de `SpecialClassificationType`, este enum no se usa como "campo opcional que puede estar ausente": toda `TraitTargetingAbility`/`NeutralAbility`/`Immunity` que exista ya declara explícitamente a qué efecto se refiere (no hay estado "ninguno" válido para una habilidad/inmunidad que sí fue autorada).

## UnitDefinition **[SO]** (extensión de 001, coexiste con la extensión de 007)

Se añaden 5 campos nuevos; los campos ya existentes de 001 (`unitId`, `displayName`, `cost`, `cooldownSeconds`, `maxHealth`, `damage`, `range`, `idleAnimation`, `attackAnimation`, `visualVariant`, `team`) y el `attackType` añadido por 007 no cambian de forma ni de regla de validación (FR-011 — esta feature no duplica ni entra en conflicto con esos campos).

| Campo | Tipo | Regla de validación |
|---|---|---|
| `classificationType` (`m_ClassificationType`) | `ClassificationType` | Tipo estándar de clasificación (FR-001). Por defecto `ClassificationType.Traitless` — tanto para instancias nuevas como, de forma implícita, para cualquier `UnitDefinition` serializada antes de esta feature (FR-010). |
| `specialClassificationType` (`m_SpecialClassificationType`) | `SpecialClassificationType` | Tipo especial opcional (FR-002). Por defecto `SpecialClassificationType.None` (FR-010). |
| `traitTargetingAbilities` (`m_TraitTargetingAbilities`) | `TraitTargetingAbility[]` | Cero o más habilidades de trait-targeting (FR-005). Por defecto `Array.Empty<TraitTargetingAbility>()` — una `UnitDefinition` ya existente sin este campo deserializa a una lista vacía (FR-010), equivalente a "sin habilidades avanzadas". |
| `neutralAbilities` (`m_NeutralAbilities`) | `NeutralAbility[]` | Cero o más habilidades neutrales (FR-006). Mismo comportamiento por defecto que `traitTargetingAbilities`. |
| `immunities` (`m_Immunities`) | `Immunity[]` | Cero o más inmunidades declaradas (FR-007). Mismo comportamiento por defecto que `traitTargetingAbilities`. |

**Sin validación adicional en `OnValidate()`**: los tres enums acotan sus propios valores posibles (igual que `AttackType` en 007); los arrays no tienen una longitud mínima ni máxima exigida por ningún FR (cero elementos es un estado válido y es, de hecho, el default — FR-010).

## TraitTargetingAbility **[Serializable]** (anidada en `UnitDefinition`, `TheBattler.Model`)

Habilidad que aplica un efecto únicamente contra objetivos cuya clasificación coincide con lo declarado (FR-005).

| Campo | Tipo | Regla de validación |
|---|---|---|
| `effectType` (`m_EffectType`) | `AbilityEffectType` | Qué efecto aplica esta habilidad al coincidir (p. ej. `Curse`). |
| `durationSeconds` (`m_DurationSeconds`) | `float` | Duración del efecto aplicado, en segundos. `> 0` para efectos con comportamiento temporal definido (hoy, `Curse` — FR-008/FR-009); sin uso observable para un `AbilityEffectType` sin comportamiento runtime definido todavía (ver `AbilityEffectType` arriba). |
| `targetClassificationTypes` (`m_TargetClassificationTypes`) | `ClassificationType[]` | Uno o más tipos estándar contra los que aplica (FR-005). Poblar con los 8 valores de `ClassificationType` expresa "contra todos los tipos estándar" (research.md §4) — sin campo/flag dedicado adicional. |
| `includedSpecialTypes` (`m_IncludedSpecialTypes`) | `SpecialClassificationType[]` | Cero o más tipos especiales incluidos explícitamente (FR-004). Vacío por defecto — sin inclusión explícita, ningún objetivo con tipo especial declarado (≠ `None`) coincide con esta habilidad, sin importar `targetClassificationTypes`. |

**Método de comportamiento — `MatchesTarget`** (algoritmo completo en [contracts/trait-targeting-matching.md](./contracts/trait-targeting-matching.md), es el corazón de FR-003/FR-004/SC-003):

```csharp
public bool MatchesTarget(ClassificationType targetClassification, SpecialClassificationType targetSpecialType)
```

- Si `targetSpecialType != SpecialClassificationType.None` → coincide **solo si** `targetSpecialType` está en `includedSpecialTypes` (FR-004). El contenido de `targetClassificationTypes` se ignora por completo en este caso.
- Si `targetSpecialType == SpecialClassificationType.None` → coincide **solo si** `targetClassification` está en `targetClassificationTypes` (FR-003). `includedSpecialTypes` se ignora por completo en este caso.

## NeutralAbility **[Serializable]** (anidada en `UnitDefinition`, `TheBattler.Model`)

Habilidad que aplica su efecto sin restricción de tipo (FR-006).

| Campo | Tipo | Regla de validación |
|---|---|---|
| `effectType` (`m_EffectType`) | `AbilityEffectType` | Qué efecto aplica esta habilidad. |
| `durationSeconds` (`m_DurationSeconds`) | `float` | Igual regla que en `TraitTargetingAbility`. |

Sin campos de targeting: por diseño (FR-006), una `NeutralAbility` siempre coincide con cualquier objetivo — incluidos los que declaran tipo especial, a diferencia de `TraitTargetingAbility` (US3, contraste explícito con US4 en spec.md).

## Immunity **[Serializable]** (anidada en `UnitDefinition`, `TheBattler.Model`)

Declaración de resistencia a un efecto específico (FR-007).

| Campo | Tipo | Regla de validación |
|---|---|---|
| `effectType` (`m_EffectType`) | `AbilityEffectType` | Efecto al que esta unidad/enemigo es inmune. |

**Método de comportamiento — `Blocks`**:

```csharp
public bool Blocks(AbilityEffectType effectType) => m_EffectType == effectType;
```

Una `UnitDefinition` puede declarar varias `Immunity` (una por cada `AbilityEffectType` al que sea inmune); no hay límite superior exigido por ningún FR. Inmunidad a `Curse` es el caso explícito de FR-008/FR-009/US5 Escenario 3 del Edge Case ("inmune a Curse y de todas formas lo recibe → el efecto no se aplica en absoluto").

## IEffectReceiver (interfaz, `TheBattler.Core`)

Ver [contracts/effect-receiver.md](./contracts/effect-receiver.md) para la firma completa. Implementada únicamente por `UnitRuntime` (`Gameplay`) — **no** por `BaseHealth` (research.md §5): las bases no tienen `UnitDefinition`/clasificación y quedan fuera del alcance de trait-targeting/neutral/immunity/Curse en esta feature. Expone la clasificación del receptor (para que el atacante evalúe `MatchesTarget`) y los dos puntos de entrada para aplicar/consultar efectos (`ApplyEffect`, `IsImmuneTo`).

## UnitRuntime **[Runtime]** (extensión de 001/007, comportamiento en `Gameplay`)

Sin cambios de forma en sus campos/propiedades públicas ya existentes. Se añade:

| Campo/Propiedad | Tipo | Notas |
|---|---|---|
| `m_CurseRemainingSeconds` | `float` (privado) | Temporizador de Curse activo sobre esta instancia. `0` = sin Curse activo. Decrementado en `Update()` (research.md §6). |
| `IsCursed` | `bool` (derivado) | `m_CurseRemainingSeconds > 0f`. Mientras es `true`, esta instancia **no evalúa sus propias** `TraitTargetingAbility`/`NeutralAbility` como atacante (FR-008) — el daño base de `Attack()` no se ve afectado. |
| `ClassificationType` | `ClassificationType` (implementa `IEffectReceiver`) | `m_Source.ClassificationType` — passthrough. |
| `SpecialClassificationType` | `SpecialClassificationType` (implementa `IEffectReceiver`) | `m_Source.SpecialClassificationType` — passthrough. |

Comportamiento completo (`Update()`/`Attack()`/`ApplyEffect()`/`IsImmuneTo()`) en [contracts/unit-runtime-ability-behavior.md](./contracts/unit-runtime-ability-behavior.md).

## Relación con entidades existentes

- **`UnitDefinition` (001, extendida por 007)**: esta feature añade los 5 campos nuevos descritos arriba, sin tocar `unitId`/`displayName`/`cost`/`cooldownSeconds`/`maxHealth`/`damage`/`range`/`idleAnimation`/`attackAnimation`/`visualVariant`/`team` (001) ni `attackType` (007) — cumple FR-011. Las 5 `UnitDefinition` de jugador y la de enemigo de 001, y cualquier `UnitDefinition` que 007 haya reautorado, deserializan los 5 campos nuevos a sus valores por defecto (`Traitless`/`None`/arrays vacíos) sin ninguna acción manual (FR-010, SC-006).
- **`UnitRuntime` (001, extendida por 007)**: gana el temporizador de Curse y la implementación de `IEffectReceiver`; su lógica de adquisición de objetivo (`Update()`) y ramificación por `AttackType` (`Attack()`, 007) no cambia — la evaluación de habilidades se añade *después* de cada `ApplyDamage` ya existente, sin alterar a cuántos objetivos se daña ni cómo se seleccionan (ver research.md §7).
- **`LaneRegistry`/`ILaneOccupant` (001, extendida por 007)**: sin cambios — siguen resolviendo únicamente "quién está en rango"; la clasificación/habilidades se evalúan sobre los `ILaneOccupant` que esas consultas ya devuelven, vía un chequeo `is IEffectReceiver` adicional en `UnitRuntime`.
- **`BaseHealth` (001)**: sin cambios — no implementa `IEffectReceiver` (research.md §5); sigue recibiendo únicamente daño (`ApplyDamage`) de cualquier `AttackType`, exactamente igual que hoy.
- **`ChapterDefinition`/`EnemyWaveDefinition` (001)**: sin cambios — siguen referenciando `UnitDefinition` tal como ya lo hacían; los 5 campos nuevos viajan con cada referencia sin requerir cambios en estas clases.

## Diagrama de relaciones (alto nivel)

```text
UnitDefinition [SO]  (001, +attackType de 007)
├── classificationType: ClassificationType            (nuevo, default Traitless)
├── specialClassificationType: SpecialClassificationType (nuevo, default None)
├── traitTargetingAbilities: TraitTargetingAbility[]   (nuevo, [Serializable], default vacío)
│                             └── MatchesTarget(ClassificationType, SpecialClassificationType)
├── neutralAbilities: NeutralAbility[]                 (nuevo, [Serializable], default vacío)
└── immunities: Immunity[]                             (nuevo, [Serializable], default vacío)
                 └── Blocks(AbilityEffectType)

UnitRuntime [Runtime] (Gameplay, implementa IEffectReceiver)
├── m_CurseRemainingSeconds: float                     (nuevo)
├── IsCursed: bool                                     (nuevo, derivado)
├── ApplyEffect(AbilityEffectType, float)               (nuevo, IEffectReceiver)
└── IsImmuneTo(AbilityEffectType)                       (nuevo, IEffectReceiver — consulta m_Source.immunities)

BaseHealth [Runtime] (001) — NO implementa IEffectReceiver, fuera de alcance de esta feature.
```
