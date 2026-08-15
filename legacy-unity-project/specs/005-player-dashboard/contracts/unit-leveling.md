# Contract: UnitLevelingController / PlayerCharacterLevelCalculator

Capa: `TheBattler.Gameplay`. Clases planas (no `MonoBehaviour` — ver research.md §4), instanciadas por `PlayerBaseFlowController`.

## `PlayerCharacterLevelCalculator` (función pura)

```csharp
public static class PlayerCharacterLevelCalculator
{
    public const int BaseUnitLevel = 1;

    public static int Calculate(
        IReadOnlyList<UnitDefinition> ownedUnits,
        UnitProgress[] unitProgress);
}
```

- **Precondición**: `ownedUnits` no es `null` (puede ser vacío). `unitProgress` no es `null` (puede ser vacío — el contrato de `IPlayerProgressStore.Load()` ya lo garantiza).
- **Comportamiento**: para cada unidad en `ownedUnits`, busca un `UnitProgress` con el mismo `unitId`; si existe, suma su `level`; si no existe, suma `BaseUnitLevel` (1). Devuelve la suma total.
- **Postcondición**: función pura — no muta ninguno de los dos parámetros, mismo resultado ante los mismos argumentos. `ownedUnits` vacío → devuelve `0` (nunca lanza, nunca indefinido — Acceptance Scenario 2, Historia 1).

## `UnitLevelingController`

```csharp
public class UnitLevelingController
{
    public UnitLevelingController(
        IPlayerProgressStore store,
        UnitLevelingConfig config,
        IReadOnlyList<UnitDefinition> ownedUnits);

    public event Action ProgressChanged;

    public int AvailableExperience { get; }
    public int CharacterLevel { get; }

    public int GetUnitLevel(string unitId);
    public bool TryGetNextLevelCost(string unitId, out int cost);
    public bool TryLevelUp(string unitId);
}
```

### Construcción

Al construirse, carga el estado actual vía `store.Load()` y calcula `CharacterLevel` con `PlayerCharacterLevelCalculator.Calculate(ownedUnits, loaded.unitProgress)`. `AvailableExperience` refleja `loaded.availableExperience`.

### `int GetUnitLevel(string unitId)`

Devuelve el nivel actual de la unidad (`UnitProgress.level` si existe un registro, si no `PlayerCharacterLevelCalculator.BaseUnitLevel`). No valida que `unitId` pertenezca a `ownedUnits` (un id desconocido simplemente devuelve el nivel base, sin lanzar).

### `bool TryGetNextLevelCost(string unitId, out int cost)`

- Si la unidad ya está en `config.MaxLevel` → devuelve `false`, `cost = 0` (no hay "siguiente mejora" que ofrecer — FR-006 vía "nivel máximo alcanzado" en vez de "experiencia insuficiente", ver research.md §2).
- En cualquier otro caso → devuelve `true`, `cost = config.ExperienceCostPerLevel[nivelActual - 1]`.

### `bool TryLevelUp(string unitId)`

- **Precondición**: `unitId` corresponde a una unidad del roster del jugador (si no, se trata igual que "sin experiencia/sin progreso" — la operación puede proceder sobre un `UnitProgress` nuevo en nivel base, pero en la práctica la capa View solo invoca esto para unidades visibles en la pantalla de mejora).
- **Comportamiento**:
  1. Si `TryGetNextLevelCost(unitId, out cost) == false` (nivel máximo) → devuelve `false`. **No modifica nada** (FR-006, sin efectos parciales).
  2. Si `AvailableExperience < cost` → devuelve `false`. **No modifica nada** (FR-006: "el sistema NO DEBE... tampoco DEBE descontar experiencia").
  3. En cualquier otro caso:
     - Descuenta `cost` de `AvailableExperience`.
     - Incrementa en 1 el `level` de la unidad (crea el `UnitProgress` si no existía, con `level = BaseUnitLevel + 1`, `experienceInvested = cost`; si ya existía, `level += 1`, `experienceInvested += cost`).
     - Recalcula `CharacterLevel` (FR-005: "inmediatamente después de que una unidad sube de nivel").
     - Persiste el nuevo `PlayerProgressSaveData` completo vía `store.Save(...)` (FR-007: se mantiene entre sesiones).
     - Dispara `ProgressChanged`.
     - Devuelve `true`.
- **Postcondición**: en caso de `false`, `AvailableExperience`, `CharacterLevel` y el nivel de la unidad quedan exactamente como antes de la llamada (verificable comparando snapshots antes/después en test) — garantiza SC-003 ("sin descontar experiencia ni dejar el estado de la unidad inconsistente").

## Doble de test

Los tests EditMode (`UnitLevelingControllerTests`) construyen `UnitLevelingConfig` vía `ScriptableObject.CreateInstance<UnitLevelingConfig>()`, una lista de `UnitDefinition` de prueba y una implementación en memoria de `IPlayerProgressStore` — sin `MonoBehaviour`, sin escena.
