# Contract: MissionEnergyController

Capa: `TheBattler.Gameplay`. Clase plana (no `MonoBehaviour` — mismo criterio de testabilidad EditMode que `UnitLevelingController`/`TeamFormationController`, 005), instanciada por `AdventureMapFlowController` (004 + esta feature, ver research.md §6-7).

## Firma

```csharp
public class MissionEnergyController
{
    public MissionEnergyController(IMissionEnergyStore store, MissionEnergyConfig config);

    public event Action EnergyChanged;

    public int CurrentEnergy { get; }
    public int MaxEnergy { get; }

    public void Sync(DateTime nowUtc, int characterLevel);

    public bool TryEnterMission(int energyCost);
}
```

### Construcción

El constructor no toca el store todavía (no hay `nowUtc`/`characterLevel` disponibles sin que el llamador los provea) — `CurrentEnergy`/`MaxEnergy` valen `0` hasta la primera llamada a `Sync`. `AdventureMapFlowController.Awake()` siempre llama `Sync(DateTime.UtcNow, characterLevel)` inmediatamente después de construir el controlador, antes de exponer nada a la capa View (mismo momento del ciclo de vida en que ya calcula `BannerStates`, 004).

### `void Sync(DateTime nowUtc, int characterLevel)`

- **Precondición**: `characterLevel >= 0` (si el llamador pasa un valor negativo por error, se trata como `0` — no lanza).
- **Comportamiento** (algoritmo completo en research.md §3):
  1. Carga `MissionEnergySaveData` vía `store.Load()`.
  2. Calcula `MaxEnergy = config.baseMaxEnergy + config.maxEnergyPerCharacterLevel * characterLevel`.
  3. Si `data.currentEnergy == -1` (sin dato/corrupto, FR-011) → `CurrentEnergy = MaxEnergy` (energía al máximo por defecto), `lastUpdateTimestampUtc = nowUtc`, y persiste inmediatamente.
  4. En otro caso, aplica regeneración por tiempo transcurrido: si `data.currentEnergy >= MaxEnergy` → `CurrentEnergy = MaxEnergy`, `lastUpdateTimestampUtc = nowUtc` (sin bancar exceso, Edge Case de spec.md); si no, calcula `unitsGained = floor((nowUtc - lastUpdateTimestampUtc) / regenIntervalSeconds)`; si `unitsGained > 0`, `CurrentEnergy = min(data.currentEnergy + unitsGained, MaxEnergy)` y `lastUpdateTimestampUtc += unitsGained * regenIntervalSeconds` (remanente preservado, research.md §3); persiste solo si algo cambió respecto al valor cargado.
  5. Dispara `EnergyChanged` si `CurrentEnergy` o `MaxEnergy` cambiaron respecto al estado anterior del controlador (evita eventos redundantes si `Sync` se llama dos veces seguidas sin que pase tiempo).
- **Postcondición**: `0 <= CurrentEnergy <= MaxEnergy` siempre, tras cualquier `Sync`. Es seguro llamar `Sync` repetidamente (idempotente si `nowUtc` no avanza y `characterLevel` no cambia).

### `bool TryEnterMission(int energyCost)`

- **Precondición**: `Sync` ya se llamó al menos una vez en la vida de esta instancia (si no, opera sobre `CurrentEnergy/MaxEnergy == 0`, lo cual bloquea correctamente cualquier costo `> 0` sin lanzar — comportamiento seguro por defecto, no un caso a explotar).
- **Comportamiento**:
  1. Si `CurrentEnergy < energyCost` → devuelve `false`. **No modifica nada** (FR-004/FR-005: ni descuenta energía, ni persiste, ni dispara `EnergyChanged`).
  2. Si `CurrentEnergy >= energyCost` → descuenta `energyCost` de `CurrentEnergy`, persiste el nuevo `MissionEnergySaveData` (con `lastUpdateTimestampUtc` sin modificar respecto al último `Sync` — descontar energía no adelanta el reloj de regeneración), dispara `EnergyChanged`, devuelve `true` (FR-003).
- **Postcondición**: en caso de `false`, `CurrentEnergy` y `MaxEnergy` quedan exactamente como antes de la llamada (verificable comparando snapshots antes/después en test) — garantiza SC-002 ("sin descontar energía ni aplicar penalización alguna"). La operación es atómica: nunca hay un estado intermedio donde parte del costo se descontó.

## Motivo de esta separación (Sync vs. TryEnterMission)

Separar "sincronizar contra el paso del tiempo y el nivel de personaje vigente" de "intentar gastar energía" permite que la capa de integración (`AdventureMapFlowController`) llame `Sync` una vez por entrada a la pantalla (FR-001, energía visible al llegar) y `TryEnterMission` solo en el momento de la selección real de una misión (FR-003/FR-004), sin que un `Sync` incidental pueda alguna vez descontar energía por accidente — mismo espíritu que separar `Tick`/`Update` en `BattleResourceController` (001) o `TryGetNextLevelCost`/`TryLevelUp` en `UnitLevelingController` (005).

## Doble de test

Los tests EditMode (`MissionEnergyControllerTests`) construyen `MissionEnergyConfig` vía `ScriptableObject.CreateInstance<MissionEnergyConfig>()` y una implementación en memoria de `IMissionEnergyStore` — sin `MonoBehaviour`, sin escena, sin esperar tiempo real (`nowUtc` se pasa explícito, research.md §4). Casos cubiertos: primera sincronización sin dato guardado → energía al máximo y persistida; regeneración parcial (menos de un intervalo completo) no otorga energía pero preserva el remanente para el siguiente `Sync`; regeneración de varios intervalos completos otorga la cantidad exacta; energía ya en el máximo no banca exceso; `TryEnterMission` con energía suficiente descuenta exactamente el costo y persiste; `TryEnterMission` con energía insuficiente no modifica ni persiste nada.
