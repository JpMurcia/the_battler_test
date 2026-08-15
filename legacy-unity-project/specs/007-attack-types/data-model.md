# Data Model: Sistema de Tipos de Ataque ("Attack Types")

Todas las entidades marcadas **[SO]** son ScriptableObjects (datos de diseño, Principio V). Las marcadas **[Runtime]** son comportamiento/estado en tiempo de ejecución, no se serializan como asset de diseño. Esta feature no introduce ninguna entidad **[Runtime]** nueva — extiende el dato de `UnitDefinition` y el comportamiento ya existente de `UnitRuntime`/`LaneRegistry` (001).

## AttackType (enum)

Vive en `TheBattler.Core` (mismo nivel que `Team`, `BattleOutcome` — valor compartido sin dependencias de motor).

```csharp
public enum AttackType
{
    SingleTarget,
    Area,
    LongDistance
}
```

| Valor | Orden/valor numérico | Corresponde a |
|---|---|---|
| `SingleTarget` | `0` | "Ataque Único" (FR-004) |
| `Area` | `1` | "Ataque de Área" (FR-005) |
| `LongDistance` | `2` | "Larga Distancia" (FR-006) |

**Reglas de validación**:
- Exactamente estos tres valores (FR-002); no se añaden variantes en esta feature (FR-009 excluye trait-targeting/neutral/inmunidades/clasificación).
- `SingleTarget` DEBE seguir siendo el miembro `0` (primero declarado): es el valor por defecto de C#/Unity para un `[SerializeField] AttackType` no inicializado explícitamente, y FR-008 exige que ese sea precisamente el comportamiento por defecto para datos ya serializados sin este campo. Reordenar el enum sin preservar `SingleTarget = 0` rompería FR-008 para los assets ya existentes de 001 (ver research.md §6).

## UnitDefinition **[SO]** (extensión de 001)

Representa una de las 5 unidades jugables o una unidad enemiga (misma clase, distinguidas por `Team` — sin cambios sobre ese diseño). Se añade un único campo nuevo; los campos ya existentes (`unitId`, `displayName`, `cost`, `cooldownSeconds`, `maxHealth`, `damage`, `range`, `idleAnimation`, `attackAnimation`, `visualVariant`, `team`) no cambian de forma ni de regla de validación — ver `specs/001-chapter1-vertical-slice/data-model.md#unitdefinition-so`.

| Campo | Tipo | Regla de validación |
|---|---|---|
| `attackType` (`m_AttackType`) | `AttackType` | Tipo de ataque declarado por la unidad (FR-003). Por defecto `AttackType.SingleTarget` — tanto para instancias nuevas creadas en el Editor como, de forma implícita, para cualquier `UnitDefinition` serializado antes de esta feature (FR-008, SC-004). Sin rango adicional que validar en `OnValidate()` — el tipo `enum` ya acota los valores posibles a los tres de FR-002; no requiere `[FormerlySerializedAs]` porque es un campo nuevo, no un renombrado de uno existente. |

**Uso de `range` por tipo de ataque** (comportamiento, no forma de dato — ver [contracts/unit-attack-type-behavior.md](./contracts/unit-attack-type-behavior.md)):
- `SingleTarget`: `range` sigue siendo el radio de detección del único objetivo (sin cambios respecto a 001).
- `Area`: `range` se reutiliza como radio de efecto — todo enemigo dentro de esa distancia recibe daño en el mismo ataque (research.md §2).
- `LongDistance`: `range` sigue acotando qué enemigos son candidatos; entre ellos, se selecciona el más lejano (research.md §3).

## LaneRegistry — nuevas consultas de targeting (comportamiento, `Gameplay`)

`LaneRegistry` (`Assets/Scripts/Gameplay/Battler/LaneRegistry.cs`) es un registro estático en memoria ya existente desde 001, no una entidad de datos serializada. Esta feature le añade dos consultas nuevas junto a `FindNearestTarget` (sin cambios). Ver [contracts/lane-registry-targeting.md](./contracts/lane-registry-targeting.md) para la firma completa y el comportamiento exacto de:
- `FindFarthestTarget(Team seekerTeam, float seekerLanePosition, float maxRange)` — usada por `AttackType.LongDistance`.
- `FindAllTargetsInRange(Team seekerTeam, float seekerLanePosition, float maxRange, List<ILaneOccupant> results)` — usada por `AttackType.Area`.

## Relación con entidades existentes

- **`UnitRuntime`** (001, `Gameplay`): sin cambios de forma (mismos campos/propiedades públicas); cambia su lógica interna de adquisición de objetivo (`Update()`) y aplicación de daño (`Attack()`) para ramificar por `m_Source.AttackType` — ver [contracts/unit-attack-type-behavior.md](./contracts/unit-attack-type-behavior.md). Es la misma clase para unidades del jugador y enemigos (sin distinción de `AttackType` por `Team`), por lo que FR-007/US4 se cumplen por construcción.
- **`ILaneOccupant` / `IDamageable`** (001, `Core`/`Gameplay`): sin cambios — `BaseHealth` y `UnitRuntime` los siguen implementando igual. Como `BaseHealth` ya es un `ILaneOccupant`, las bases del jugador y enemiga son candidatas válidas de "Ataque de Área"/"Larga Distancia" exactamente igual que cualquier unidad desplegada, sin lógica adicional (cubre la mención de "o a la base del jugador" en US4).
- **`ChapterDefinition` / `EnemyWaveDefinition`** (001): sin cambios — referencian `UnitDefinition` tal como ya lo hacían; el campo `attackType` nuevo viaja con cada referencia sin requerir cambios en estas clases.
- **Las 5 `UnitDefinition` de jugador y la de enemigo de 001** (`Unit_Arquero.asset`, `Unit_Escudero.asset`, `Unit_Espadachin.asset`, `Unit_Lancero.asset`, `Unit_Mago.asset`, `Unit_EnemyGrunt.asset`): no requieren ninguna edición para seguir funcionando (FR-008, SC-004) — su `AttackType` serializado es `SingleTarget` por el valor por defecto del enum (ver arriba). Pueden reautorarse después a `Area`/`LongDistance` vía Inspector sin recompilar (SC-005); esta feature no reasigna ninguna de ellas permanentemente (ver quickstart.md, validación manual).
