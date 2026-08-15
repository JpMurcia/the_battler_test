# Contract: Multiplicadores de Arco (Capítulo de Saga)

Cubre FR-001, FR-002, FR-003, FR-004 de spec.md.

## SagaArcDefinition

Ver forma completa en [data-model.md](../data-model.md#sagaarcdefinition-nuevo-scriptableobject).

## Punto de aplicación: costo de despliegue

`UnitDeploymentController.Initialize` gana un parámetro opcional:

```csharp
public void Initialize(
    IBattleResourceSource resource,
    IReadOnlyList<UnitDefinition> availableUnits,
    Func<string, UnitEvolutionStage> resolveEvolutionStage = null,
    float unitCostMultiplier = 1f)
```

`TryDeploy(int slotIndex)` calcula el costo cobrado como:

```csharp
int cost = Mathf.Max(1, Mathf.RoundToInt(slot.Unit.Cost * m_UnitCostMultiplier));
if (!m_ResourceSource.TrySpend(cost)) return false;
```

**Regla de redondeo**: `Mathf.RoundToInt`, piso `1` (nunca gratis). Consistente entre todos los capítulos/arcos.

**Compatibilidad**: `unitCostMultiplier = 1f` por defecto ⇒ `Chapter1`/`Chapter2` (sin `SagaArcDefinition` asociado) cobran exactamente `slot.Unit.Cost`, sin cambio observable.

## Punto de aplicación: fuerza enemiga

`EnemyWaveSpawner.Initialize` gana un parámetro opcional `float enemyStrengthMultiplier = 1f` (ver [wave-triggers-and-enemy-cap.md](./wave-triggers-and-enemy-cap.md) para la firma completa). Al instanciar cada enemigo:

```csharp
var instance = UnitRuntimePool.Get(m_UnitRuntimePrefab, spawnPosition, Quaternion.identity);
instance.Initialize(entries[i].unit, Team.Enemy, entries[i].lanePosition, UnitEvolutionStage.FormaBase, m_EnemyStrengthMultiplier);
```

`UnitRuntime` gana un nuevo overload de `Initialize` (además de los 2 ya existentes):

```csharp
public void Initialize(UnitDefinition definition, Team assignedTeam, float startLanePosition, UnitEvolutionStage stage, float statMultiplier)
{
    m_Source = definition;
    m_CombatProfile = UnitCombatProfile.Scaled(definition.GetEffectiveCombatProfile(stage), statMultiplier);
    // ... resto idéntico al overload de 4 parámetros existente
}
```

El overload de 4 parámetros (`stage`, sin multiplicador) sigue existiendo y delega en este con `statMultiplier = 1f`, preservando el comportamiento de `Chapter1`/`Chapter2`/`007`/`008`/`009` sin cambios.

## Resolución del arco activo

`BattleStateManager` gana un campo serializado opcional `SagaArcDefinition m_ActiveArc`. En `SetupChapter()`:

```csharp
float unitCostMultiplier = m_ActiveArc != null ? m_ActiveArc.UnitCostMultiplier : 1f;
float enemyStrengthMultiplier = m_ActiveArc != null ? m_ActiveArc.EnemyStrengthMultiplier : 1f;
```

`m_ActiveArc == null` (escenas de `Chapter1`/`Chapter2` no tocadas por esta feature) ⇒ ambos multiplicadores en `1f`.

## Acceptance mapping

- spec.md Historia 1, Escenario 1/2 ⇐ `Mathf.RoundToInt(Cost * UnitCostMultiplier)` con `-33.3%`/`+33.3%`.
- spec.md Historia 1, Escenario 3 ⇐ `UnitCombatProfile.Scaled(..., EnemyStrengthMultiplier)` con `100%` vs `400%`.
- spec.md FR-004 (nivel de jefe) ⇐ `SagaArcDefinition.BossLevel`, sin lectura desde ningún componente runtime (research.md §11 — es documentación de diseño, no una regla ejecutada).
