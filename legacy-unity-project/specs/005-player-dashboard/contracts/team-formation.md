# Contract: TeamFormationController / TeamFormationRosterFilter

Capa: `TheBattler.Gameplay`. `TeamFormationController` es una clase plana (no `MonoBehaviour`, mismo motivo que `UnitLevelingController` — research.md §4), instanciada por `PlayerBaseFlowController`. `TeamFormationRosterFilter` es una función estática pura, invocada tanto por `TeamFormationController` como por `BattleStateManager` (research.md §5).

## `TeamFormationRosterFilter` (función pura)

```csharp
public static class TeamFormationRosterFilter
{
    public static UnitDefinition[] Apply(
        UnitDefinition[] availableUnits,
        string[] activeTeamUnitIds);
}
```

- **Precondición**: `availableUnits` no es `null` (puede ser vacío, aunque `ChapterDefinition` en la práctica siempre trae 5 — 001). `activeTeamUnitIds` puede ser `null` o vacío.
- **Comportamiento**:
  1. Si `activeTeamUnitIds` es `null` o de longitud `0` → devuelve `availableUnits` tal cual (equipo por defecto = roster completo, FR-013/Edge Case de spec.md).
  2. En cualquier otro caso, devuelve el subconjunto de `availableUnits` cuyo `UnitId` está en `activeTeamUnitIds`, **preservando el orden de `availableUnits`** (no el orden de `activeTeamUnitIds`). Ids en `activeTeamUnitIds` que no correspondan a ninguna unidad de `availableUnits` se ignoran silenciosamente (nunca lanza).
  3. Si el resultado del paso 2 queda vacío (p. ej. todos los ids guardados son de unidades que ya no están en `availableUnits`) → se aplica el mismo fallback que el paso 1 y se devuelve `availableUnits` completo. **Nunca se devuelve un array vacío.**
- **Postcondición**: función pura, no muta ninguno de los dos parámetros. El array devuelto nunca es vacío si `availableUnits` no lo es (garantiza FR-010 a nivel de consumo, incluso si `activeTeamUnitIds` llegara corrupto o desactualizado por un cambio de roster).

## `TeamFormationController`

```csharp
public class TeamFormationController
{
    public TeamFormationController(
        IPlayerProgressStore store,
        IReadOnlyList<UnitDefinition> ownedUnits);

    public IReadOnlyList<string> ActiveTeamUnitIds { get; }

    public bool TryConfirmFormation(IReadOnlyList<string> selectedUnitIds);
}
```

### Construcción

Carga el estado actual vía `store.Load()`; `ActiveTeamUnitIds` refleja `loaded.activeTeamUnitIds` (sin pasar por `TeamFormationRosterFilter` — ese filtro es de consumo en batalla, no de lo que se expone aquí como "última selección guardada").

### `bool TryConfirmFormation(IReadOnlyList<string> selectedUnitIds)`

- **Precondición**: `selectedUnitIds` es la selección "pendiente" ya reunida por la capa View (research.md §6) — esta capa (Gameplay) no sabe nada de qué unidad estaba marcada antes de esta llamada.
- **Comportamiento**:
  1. Deduplica `selectedUnitIds` y descarta cualquier id que no pertenezca a `ownedUnits` (protección contra datos de UI inconsistentes).
  2. Si el resultado queda vacío → devuelve `false`. **No persiste nada** (FR-010: "el sistema no permite guardar un equipo vacío"; Edge Case: "se mantiene el último equipo activo válido" — al no escribir, `ActiveTeamUnitIds` sigue siendo el valor anterior).
  3. En cualquier otro caso: actualiza `PlayerProgressSaveData.activeTeamUnitIds` con el resultado deduplicado/filtrado, persiste vía `store.Save(...)`, actualiza `ActiveTeamUnitIds`, devuelve `true`.
- **Postcondición**: en caso de `false`, `ActiveTeamUnitIds` y el archivo persistido quedan exactamente como antes de la llamada (SC-003-equivalente para equipo: ningún intento de guardar vacío dejó estado inconsistente).

## Integración con la batalla (FR-009, sin modificar `ChapterDefinition`)

`BattleStateManager.SetupChapter()` (001, ya modificado por 002) añade una línea: en vez de

```csharp
m_DeploymentController.Initialize(m_ResourceController, m_ChapterDefinition.AvailableUnits);
```

pasa a

```csharp
var activeTeam = m_PlayerProgressStore.Load().activeTeamUnitIds;
var roster = TeamFormationRosterFilter.Apply(m_ChapterDefinition.AvailableUnits, activeTeam);
m_DeploymentController.Initialize(m_ResourceController, roster);
```

`m_PlayerProgressStore` se resuelve en `Awake()` igual que `m_ProgressStore` (`IChapterProgressStore`) ya se resuelve hoy — mismo patrón, nueva instancia de `IPlayerProgressStore`/`LocalPlayerProgressStore`. `UnitDeploymentController.Initialize(IBattleResourceSource, IReadOnlyList<UnitDefinition>)` no cambia de firma.

## Doble de test

Los tests EditMode (`TeamFormationRosterFilterTests`, `TeamFormationControllerTests`) no requieren doble para el filtro (función pura, se invoca directo); `TeamFormationControllerTests` usa una implementación en memoria de `IPlayerProgressStore`. El test PlayMode de integración (`TeamFormationBattleIntegrationPlayModeTests`) inyecta la misma clase de doble en memoria en `BattleStateManager` (mismo mecanismo de inyección por reflexión/campo ya usado para `IChapterProgressStore` en `BattleLoopPlayModeTests`, 002) para sembrar un `activeTeamUnitIds` conocido y verificar `UnitDeploymentController.Slots`.
