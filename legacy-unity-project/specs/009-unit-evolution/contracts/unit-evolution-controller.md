# Contract: UnitEvolutionController / UnitEvolutionStageResolver

Capa: `TheBattler.Gameplay`. Clases planas (no `MonoBehaviour`, mismo motivo que `UnitLevelingController`/`TeamFormationController` — 005, research.md §4 de 005): testables en EditMode sin escena. `UnitEvolutionController` es instanciado por `PlayerBaseFlowController` (mismo punto de construcción que `UnitLevelingController`/`TeamFormationController`, 005); `UnitEvolutionStageResolver` es una función estática pura, invocada tanto por `UnitEvolutionController` como por `UnitDeploymentController`/`BattleStateManager` en batalla (ver [battle-evolution-integration.md](./battle-evolution-integration.md)).

## `UnitEvolutionStageResolver` (función pura)

```csharp
public static class UnitEvolutionStageResolver
{
    public static UnitEvolutionStage Resolve(string unitId, UnitProgress[] unitProgress);
}
```

- **Precondición**: `unitId` no es `null`/vacío en el uso normal (un `unitId` vacío simplemente no coincidirá con ninguna entrada, no lanza). `unitProgress` puede ser `null` o vacío.
- **Comportamiento**:
  1. Si `unitProgress` es `null` o no contiene una entrada con `unitId` coincidente → devuelve `UnitEvolutionStage.FormaBase` (unidad sin progreso de evolución, FR-011).
  2. Si existe una entrada, pero su `evolutionStage` es un valor fuera del rango `0`-`2` (dato corrupto o manipulado) → devuelve `UnitEvolutionStage.FormaBase` (FR-013 — mismo criterio de fallback que el resto del guardado de progreso, 002/003/005).
  3. En cualquier otro caso → devuelve `evolutionStage` de esa entrada, tal cual.
- **Postcondición**: función pura, sin efectos secundarios, no muta `unitProgress`. Nunca lanza excepción. El valor devuelto siempre es uno de los 3 miembros válidos del enum (nunca un valor fuera de rango, incluso si la entrada de origen lo tenía).

## `UnitEvolutionController`

```csharp
public class UnitEvolutionController
{
    public UnitEvolutionController(
        IPlayerProgressStore store,
        IReadOnlyList<UnitDefinition> ownedUnits);

    public event Action EvolutionChanged;

    public UnitEvolutionStage GetEvolutionStage(string unitId);
    public bool TryGetNextStageRequirement(string unitId, out EvolutionRequirementInfo requirement);
    public bool TryEvolve(string unitId);
}
```

### Construcción

No pre-carga estado propio más allá de resolver `ownedUnits` para poder localizar la `UnitDefinition` correspondiente a un `unitId` en `TryGetNextStageRequirement`/`TryEvolve` — cada método consulta `store.Load()` en el momento (mismo criterio de "fuente de verdad es siempre el store, no una copia en memoria potencialmente desactualizada" que `UnitLevelingController`/`TeamFormationController`, 005, aplican de forma equivalente a través de su propio ciclo de vida).

### `UnitEvolutionStage GetEvolutionStage(string unitId)`

Devuelve `UnitEvolutionStageResolver.Resolve(unitId, store.Load().unitProgress)`. Un `unitId` desconocido (no pertenece a `ownedUnits`) simplemente devuelve `FormaBase`, sin lanzar — mismo criterio que `UnitLevelingController.GetUnitLevel` (005) con un id desconocido.

### `bool TryGetNextStageRequirement(string unitId, out EvolutionRequirementInfo requirement)`

- **Precondición**: ninguna adicional.
- **Comportamiento**:
  1. Resuelve `currentStage = GetEvolutionStage(unitId)`.
  2. Si `currentStage == UnitEvolutionStage.FormaVerdadera` (ya en la forma final, no hay "siguiente") → devuelve `false`, `requirement = default`.
  3. Busca la `UnitDefinition` de `unitId` en `ownedUnits`; si no existe, o si `TryGetStageData(currentStage + 1, out data) == false` (esta unidad no tiene datos autorados para la siguiente forma — FR-011, unidad de 001 sin evolución configurada) → devuelve `false`, `requirement = default`. **No** es un error: simplemente no hay una "siguiente forma" ofrecible todavía para esta unidad.
  4. En cualquier otro caso, construye `EvolutionRequirementInfo` con `NextStage = currentStage + 1`, `RequiredLevel = data.RequiredLevel`, `RequiresEvolutionItem = data.RequiresEvolutionItem`, `MeetsLevelRequirement = (nivel actual de la unidad, vía UnitProgress/UnitLevelingController-equivalente) >= RequiredLevel`, `MeetsItemRequirement = !RequiresEvolutionItem || evolutionItemCount > 0`, y devuelve `true`.
- **Postcondición**: función de solo lectura — no persiste ni muta nada. `requirement.CanEvolve` (`MeetsLevelRequirement && MeetsItemRequirement`) es lo que la capa View (`UnitUpgradeUIController`, 005) usa para habilitar/deshabilitar el botón "Evolucionar" (FR-004).

### `bool TryEvolve(string unitId)`

- **Precondición**: ninguna adicional — es seguro invocarlo incluso si los requisitos no se cumplen (debe rechazar limpiamente, no es responsabilidad exclusiva de la capa View filtrar la llamada, aunque en la práctica `UnitUpgradeUIController` solo la expone cuando `CanEvolve == true`).
- **Comportamiento**:
  1. Si `TryGetNextStageRequirement(unitId, out var requirement) == false` → devuelve `false`. **No modifica nada.**
  2. Si `!requirement.CanEvolve` (nivel y/o ítem insuficiente) → devuelve `false`. **No modifica nada** — ni el nivel, ni la forma persistida, ni el contador de ítems (FR-005, SC-002, mismo criterio "sin efectos parciales" que `UnitLevelingController.TryLevelUp`, 005).
  3. En cualquier otro caso:
     - Actualiza `UnitProgress.evolutionStage = requirement.NextStage` para esta unidad.
     - Si `requirement.RequiresEvolutionItem` → decrementa en 1 `UnitProgress.evolutionItemCount` (FR-006). Nunca queda negativo (ya se verificó `evolutionItemCount > 0` en el paso 1/`MeetsItemRequirement`).
     - Persiste el nuevo `PlayerProgressSaveData` completo vía `store.Save(...)` (FR-010: se mantiene entre sesiones).
     - Dispara `EvolutionChanged`.
     - Devuelve `true`.
- **Postcondición**: en caso de `false`, `evolutionStage`, `evolutionItemCount` y cualquier otro campo de `UnitProgress` para esta unidad quedan exactamente como antes de la llamada (verificable comparando snapshots antes/después en test) — garantiza SC-002 ("un intento de evolución sin cumplir el nivel y/o ítem requerido es bloqueado el 100% de las veces, sin consumir el ítem de evolución"). En caso de `true`, la secuencialidad queda garantizada estructuralmente (research.md §4): `evolutionStage` solo pudo avanzar exactamente un paso desde su valor anterior, nunca dos.

## Doble de test

Los tests EditMode (`UnitEvolutionStageResolverTests`, `UnitEvolutionControllerTests`) usan `ScriptableObject.CreateInstance<UnitDefinition>()` para las `UnitDefinition` de prueba (con `m_EvolutionStages` sembrado por reflexión) y una implementación en memoria de `IPlayerProgressStore` — sin `MonoBehaviour`, sin escena, mismo mecanismo que `UnitLevelingControllerTests`/`TeamFormationControllerTests` (005). Casos mínimos exigidos: secuencialidad (evolucionar directamente de `FormaBase` a `FormaVerdadera` con ambos niveles ya cumplidos debe fallar, FR-007); nivel insuficiente; ítem insuficiente (`FormaVerdadera` con nivel cumplido pero `evolutionItemCount == 0`); evolución exitosa consume el ítem exactamente una vez y persiste; cualquier rechazo dejando el `UnitProgress` bit a bit idéntico al estado previo (SC-002).
