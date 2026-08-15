# Data Model: Sistema de Evolución de Unidad

Las entidades marcadas **[SO]** son ScriptableObjects (datos de diseño, Principio V). Las marcadas **[Serializable]** son clases planas anidadas/asociadas a un `[SO]` (mismo patrón que `EnemyWaveDefinition.WaveEntry`, 001, y `TraitTargetingAbility`/`NeutralAbility`/`Immunity`, 008) — datos de diseño editables en el Inspector sin ser un asset independiente. Las marcadas **[Save]** son datos de guardado (clases planas `[Serializable]`, mismo patrón que `UnitProgress`/`PlayerProgressSaveData`, 005). Las marcadas **[Runtime]** son estado calculado o resuelto en memoria — no se serializan como asset de diseño ni se persisten en disco.

## UnitEvolutionStage (enum, `TheBattler.Core`)

```csharp
public enum UnitEvolutionStage
{
    FormaBase,       // = 0, valor por defecto (FR-011)
    SegundaForma,    // = 1
    FormaVerdadera   // = 2
}
```

| Valor | Orden/valor numérico | Corresponde a |
|---|---|---|
| `FormaBase` | `0` | Forma Base — la unidad tal como la define hoy `UnitDefinition` (001/007/008), sin datos de `UnitEvolutionStageData` (FR-001). |
| `SegundaForma` | `1` | Segunda Forma — primera transición de evolución (FR-002, Historia 1). |
| `FormaVerdadera` | `2` | Forma Verdadera — transición final, requiere nivel + `EvolutionItem` (FR-003, Historia 2). |

**Reglas de validación**:
- Exactamente estos 3 valores (FR-001). `FormaBase` DEBE seguir siendo el miembro `0`: es el valor por defecto de C#/Unity para un `[SerializeField]`/campo de guardado no inicializado, así que cualquier `UnitProgress` ya persistido de 005 sin este campo, y cualquier `UnitDefinition` de 001/007/008 sin `m_EvolutionStages`, quedan en `FormaBase` sin migración (FR-011, mismo criterio que `AttackType.SingleTarget = 0` en 007 y `ClassificationType.Traitless = 0` en 008, ver research.md §1/§4).
- El orden ordinal (`FormaBase < SegundaForma < FormaVerdadera`) **es** la secuencialidad exigida por FR-007 — no hay una tabla de transiciones separada (research.md §4): el índice `0` de `UnitDefinition.m_EvolutionStages` corresponde a `SegundaForma`, el índice `1` a `FormaVerdadera`.

## UnitEvolutionStageData **[Serializable]** (anidada en `UnitDefinition`, `TheBattler.Model`)

Datos autorados de una forma de evolución concreta (Segunda Forma o Forma Verdadera; la Forma Base ya está representada por los campos existentes de `UnitDefinition`, no tiene su propia entrada).

| Campo | Tipo | Regla de validación |
|---|---|---|
| `requiredLevel` (`m_RequiredLevel`) | `int` | Nivel mínimo de la unidad (`UnitProgress.level`, 005) para poder evolucionar a esta forma (FR-002). `>= 1`. Para la entrada de Forma Verdadera, representa el nivel además del requisito de ítem (FR-003) — ambos requisitos son independientes y ambos deben cumplirse. |
| `requiresEvolutionItem` (`m_RequiresEvolutionItem`) | `bool` | Si `true`, además del nivel, esta forma exige `UnitProgress.evolutionItemCount > 0` (FR-003). Por diseño de contenido (Historia 2), la entrada de Forma Verdadera lo declara `true`; la de Segunda Forma no lo necesita, pero el campo no está restringido por forma — es la propia `UnitDefinition` autorada quien decide, sin regla de código adicional que lo fuerce. |
| `idleAnimation` (`m_IdleAnimation`) | `RuntimeAnimatorController` | Animación de idle propia de esta forma, distinta de las demás formas de la misma unidad (FR-008, SC-005). |
| `attackAnimation` (`m_AttackAnimation`) | `RuntimeAnimatorController` | Animación de ataque propia de esta forma, distinta de las demás formas de la misma unidad (FR-008, SC-005). |
| `visualVariant` (`m_VisualVariant`) | `GameObject` | Variante visual propia de esta forma (mismo rol que `UnitDefinition.VisualVariant`, 001, pero para esta forma concreta). |
| `damage` (`m_Damage`) | `int` | Daño de combate de esta forma. `>= 1`. Valor absoluto autorado, no un multiplicador (research.md §3, FR-009). |
| `maxHealth` (`m_MaxHealth`) | `int` | Vida máxima de esta forma. `>= 1`. Valor absoluto autorado, no un multiplicador (research.md §3, FR-009). |

**Reglas de validación adicionales**:
- `UnitDefinition.m_EvolutionStages` tiene longitud `0`, `1` o `2` — nunca más de 2 (FR-001: solo Segunda Forma y Forma Verdadera tienen entrada propia). Índice `0` = Segunda Forma, índice `1` = Forma Verdadera; no hay un campo de "a qué forma corresponde" dentro de `UnitEvolutionStageData` — la posición en el array lo determina (mismo criterio posicional que `UnitLevelingConfig.experienceCostPerLevel`, 005).
- Ningún campo de esta clase tiene un valor por defecto especial de "sin autorar": si una `UnitDefinition` declara una entrada en `m_EvolutionStages`, se asume completa (mismo criterio que `HasValidVisualIdentity` de `UnitDefinition`, 001, para los campos base — la validación de completitud es responsabilidad del autor del asset, no de esta clase de datos).
- `idleAnimation != attackAnimation` dentro de la misma `UnitEvolutionStageData` es una convención heredada de `UnitDefinition.HasValidVisualIdentity` (001), no una regla forzada por código en esta feature — ver Complexity Tracking de plan.md sobre la bandera de gobernanza pendiente del Principio III.

## UnitCombatProfile **[Runtime]** (clase plana de solo lectura, `TheBattler.Model`)

Resultado de resolver la forma vigente de una unidad a un único conjunto coherente de valores de combate/apariencia — no se serializa como asset ni se persiste; se construye bajo demanda por `UnitDefinition.GetEffectiveCombatProfile(stage)` (ver [contracts/unit-definition-evolution-data.md](./contracts/unit-definition-evolution-data.md)).

| Campo | Tipo | Notas |
|---|---|---|
| `IdleAnimation` | `RuntimeAnimatorController` | De la forma vigente si tiene datos autorados; si no (fallback), `UnitDefinition.IdleAnimation` (Forma Base) — FR-011/FR-013. |
| `AttackAnimation` | `RuntimeAnimatorController` | Mismo criterio de fallback que `IdleAnimation`. |
| `VisualVariant` | `GameObject` | Mismo criterio de fallback que `IdleAnimation`. |
| `Damage` | `int` | Mismo criterio de fallback que `IdleAnimation`; `>= 1` siempre (heredado de la regla de validación de `UnitEvolutionStageData`/`UnitDefinition.Damage`, 001). |
| `MaxHealth` | `int` | Mismo criterio de fallback que `IdleAnimation`; `>= 1` siempre. |

**Reglas de validación**: ninguna propia — es un resultado derivado, siempre coherente porque `GetEffectiveCombatProfile` (función pura) nunca mezcla campos de dos formas distintas dentro del mismo `UnitCombatProfile` (o son todos de la forma vigente, o son todos de Forma Base por fallback completo — ver contracts).

## UnitDefinition **[SO]** (extensión de 001, coexiste con las extensiones de 007/008)

Se añade 1 campo nuevo y 2 métodos; los campos ya existentes de 001 (`unitId`, `displayName`, `cost`, `cooldownSeconds`, `maxHealth`, `damage`, `range`, `idleAnimation`, `attackAnimation`, `visualVariant`, `team`) y los añadidos por 007 (`attackType`)/008 (`classificationType`, `specialClassificationType`, `traitTargetingAbilities`, `neutralAbilities`, `immunities`) no cambian de forma ni de regla de validación (FR-011 — esta feature no duplica ni entra en conflicto con esos campos).

| Campo/Método | Tipo | Regla de validación / Comportamiento |
|---|---|---|
| `evolutionStages` (`m_EvolutionStages`) | `UnitEvolutionStageData[]` | Longitud `0` a `2` (ver reglas arriba). Por defecto `Array.Empty<UnitEvolutionStageData>()` — una `UnitDefinition` ya existente de 001/007/008 sin este campo deserializa a un array vacío, equivalente a "esta unidad solo tiene Forma Base" (FR-011, sin migración necesaria). |
| `TryGetStageData(UnitEvolutionStage stage, out UnitEvolutionStageData data)` | `bool` | `stage == FormaBase` → siempre devuelve `false` (Forma Base no tiene `UnitEvolutionStageData` propia — está representada por los campos base de esta misma clase). `stage == SegundaForma`/`FormaVerdadera` → devuelve `true` solo si `m_EvolutionStages` tiene la entrada correspondiente (índice `0`/`1`); si no, `false`, `data = default`. |
| `GetEffectiveCombatProfile(UnitEvolutionStage stage)` | `UnitCombatProfile` | Función pura (research.md §5, sin asignaciones nuevas por frame — se invoca una vez en `UnitRuntime.Initialize`). Ver algoritmo completo en [contracts/unit-definition-evolution-data.md](./contracts/unit-definition-evolution-data.md): si `TryGetStageData(stage, ...)` devuelve `true`, construye el perfil con los campos de esa `UnitEvolutionStageData`; si devuelve `false` (incluido siempre que `stage == FormaBase`, o cuando la forma vigente no tiene datos autorados — FR-011/FR-013), construye el perfil con los campos base ya existentes de `UnitDefinition` (`IdleAnimation`, `AttackAnimation`, `VisualVariant`, `Damage`, `MaxHealth`). |

**Sin validación adicional en `OnValidate()`**: `m_EvolutionStages` no tiene una longitud mínima exigida por ningún FR (cero elementos es un estado válido y es, de hecho, el default — FR-011); no se valida el contenido de cada `UnitEvolutionStageData` en tiempo de edición, mismo criterio que 008 aplicó a sus propios arrays de habilidades.

## UnitProgress **[Save]** (extensión de 005)

Se añaden 2 campos nuevos; `unitId`, `level`, `experienceInvested` (005) no cambian de forma ni de regla de validación.

| Campo | Tipo | Regla de validación |
|---|---|---|
| `evolutionStage` (`m_EvolutionStage`) | `UnitEvolutionStage` | Forma vigente de esta unidad. Por defecto `UnitEvolutionStage.FormaBase` (`= 0`) — cualquier `UnitProgress` ya persistido por 005 sin este campo deserializa a `FormaBase` sin migración (FR-011). |
| `evolutionItemCount` (`m_EvolutionItemCount`) | `int` | Cantidad de `EvolutionItem` disponibles para esta unidad. `>= 0` siempre (clampado al cargar/guardar, mismo criterio que `PlayerProgressSaveData.availableExperience`, 005). `0` por defecto. |

**Reglas de validación**:
- Igual que 005 ya documentó para `level`/`experienceInvested`: a lo sumo un `UnitProgress` por `unitId`; se crea (persiste) de forma perezosa — una unidad que nunca evolucionó ni recibió ítems no necesita una entrada distinta de la que 005 ya crea perezosamente para nivel/experiencia (si ya existe una entrada por nivel, estos dos campos simplemente quedan en sus valores por defecto dentro de la misma entrada).
- `evolutionStage` fuera del rango `0`-`2` (dato corrupto/manipulado) se trata, en lectura, como `FormaBase` — no a nivel de esta clase de datos en sí (que solo transporta el valor), sino por `UnitEvolutionStageResolver.Resolve` (`TheBattler.Gameplay`, FR-013, ver research.md §5). Mismo criterio de "esta clase no valida, el resolver sí" que 005 aplicó a `PlayerProgressSaveData`/`IPlayerProgressStore.Load()`.
- `evolutionItemCount` nunca puede quedar negativo tras `UnitEvolutionController.TryEvolve` consumir un ítem — ver [contracts/unit-evolution-controller.md](./contracts/unit-evolution-controller.md).

## EvolutionRequirementInfo **[Runtime]**

Valor de solo lectura devuelto por `UnitEvolutionController.TryGetNextStageRequirement` (ver contracts) — no se persiste ni es un `[Serializable]` de diseño.

| Campo | Tipo | Notas |
|---|---|---|
| `NextStage` | `UnitEvolutionStage` | La siguiente forma (forma actual `+ 1`) hacia la que esta unidad podría evolucionar, si existe. |
| `RequiredLevel` | `int` | De la `UnitEvolutionStageData` correspondiente. |
| `RequiresEvolutionItem` | `bool` | De la `UnitEvolutionStageData` correspondiente. |
| `MeetsLevelRequirement` | `bool` | `UnitProgress.level >= RequiredLevel` para esta unidad. |
| `MeetsItemRequirement` | `bool` | `true` si `!RequiresEvolutionItem`, o si `RequiresEvolutionItem && UnitProgress.evolutionItemCount > 0`. |
| `CanEvolve` | `bool` (derivado) | `MeetsLevelRequirement && MeetsItemRequirement`. |

## Relación con entidades existentes

- **`UnitDefinition` (001, extendida por 007/008)**: esta feature añade `evolutionStages` y los dos métodos descritos arriba, sin tocar ningún campo base de 001 ni los añadidos por 007 (`attackType`)/008 (clasificación/habilidades) — cumple FR-011. Las 5 `UnitDefinition` de jugador y la de enemigo de 001, y cualquier `UnitDefinition` reautorada por 007/008, deserializan `evolutionStages` a un array vacío sin ninguna acción manual (FR-011).
- **`UnitProgress`/`PlayerProgressSaveData`/`IPlayerProgressStore` (005)**: esta feature añade `evolutionStage`/`evolutionItemCount` a `UnitProgress`, dentro del mismo `PlayerProgressSaveData`/`player-progress.json` ya diseñado — no crea ningún archivo de guardado paralelo (FR-010). `IPlayerProgressStore.Load()`/`Save(...)` no cambian de firma; `UnitEvolutionController` los usa exactamente igual que `UnitLevelingController`/`TeamFormationController` (005) ya lo hacen.
- **`UnitRuntime` (001, extendida por 007/008)**: `Initialize(...)` gana un parámetro opcional `UnitEvolutionStage stage = UnitEvolutionStage.FormaBase` (compatible con todos los call-sites existentes) y usa `definition.GetEffectiveCombatProfile(stage)` en vez de leer `m_Source.IdleAnimation`/`AttackAnimation`/`VisualVariant`/`Damage`/`MaxHealth` directamente — ver [contracts/battle-evolution-integration.md](./contracts/battle-evolution-integration.md).
- **`UnitDeploymentController`/`BattleStateManager` (001, modificados por 002/003/005)**: `BattleStateManager.SetupChapter()` resuelve `IPlayerProgressStore` (mismo patrón que `IChapterProgressStore`, 002) y construye un resolver de evolución (`UnitEvolutionStageResolver` + el `UnitProgress[]` cargado) que `UnitDeploymentController.TryDeploy` consulta para cada `slot.Unit` antes de `instance.Initialize(...)` — ver contracts/battle-evolution-integration.md. No se introduce evolución para `EnemyWaveSpawner`/unidades enemigas (spec.md Assumptions, plan.md Constraints): siempre despliegan con el valor por defecto (`FormaBase`).
- **`UnitUpgradeUIController` (005, `View`)**: gana el único punto de entrada de UI para la acción explícita de evolucionar (FR-004) — un botón "Evolucionar" por unidad, habilitado solo cuando `UnitEvolutionController.TryGetNextStageRequirement(...).CanEvolve == true`, que invoca `TryEvolve(unitId)`.

## Diagrama de relaciones (alto nivel)

```text
UnitDefinition [SO]  (001, +attackType 007, +clasificación/habilidades 008)
├── evolutionStages: UnitEvolutionStageData[]          (nuevo, [Serializable], 0-2, default vacío)
│                     ├── [0] SegundaForma: requiredLevel, requiresEvolutionItem,
│                     │        idleAnimation, attackAnimation, visualVariant, damage, maxHealth
│                     └── [1] FormaVerdadera: (mismos campos)
├── TryGetStageData(UnitEvolutionStage) -> bool         (nuevo, pura)
└── GetEffectiveCombatProfile(UnitEvolutionStage)       (nuevo, pura)
                        -> UnitCombatProfile [Runtime]
                           (IdleAnimation, AttackAnimation, VisualVariant, Damage, MaxHealth
                            — de la forma vigente, o fallback a campos base de Forma Base)

UnitProgress [Save] (005, dentro de PlayerProgressSaveData)
├── unitId / level / experienceInvested                 (005, sin cambios)
├── evolutionStage: UnitEvolutionStage                   (nuevo, default FormaBase)
└── evolutionItemCount: int                               (nuevo, default 0, >=0)

UnitEvolutionStageResolver (Gameplay, pura)
└── Resolve(unitId, UnitProgress[]) -> UnitEvolutionStage   (fallback FormaBase, FR-013)

UnitEvolutionController (Gameplay, clase plana, usa IPlayerProgressStore de 005)
├── GetEvolutionStage(unitId) -> UnitEvolutionStage
├── TryGetNextStageRequirement(unitId, out EvolutionRequirementInfo [Runtime]) -> bool
├── TryEvolve(unitId) -> bool
└── event EvolutionChanged

UnitRuntime [Runtime] (Gameplay, 001/007/008)
└── Initialize(definition, team, lanePosition, stage = FormaBase)
    usa definition.GetEffectiveCombatProfile(stage) en vez de leer m_Source.* directamente
```
