# Contract: IMissionEnergyStore

Capa: `TheBattler.Model`. Implementación de referencia: `LocalMissionEnergyStore` en `TheBattler.Gameplay`.

## Interfaz

```csharp
public interface IMissionEnergyStore
{
    MissionEnergySaveData Load();

    void Save(MissionEnergySaveData data);
}
```

## `MissionEnergySaveData Load()`

- **Precondición**: ninguna.
- **Comportamiento**:
  - Si el archivo (`mission-energy.json`) no existe → devuelve un `MissionEnergySaveData` con valores por defecto (`currentEnergy = -1` — centinela "sin dato", `lastUpdateTimestampUtc = 0`, `formatVersion = 1`) (FR-011).
  - Si el archivo existe pero no se puede parsear (JSON malformado, `formatVersion` no reconocido, estructura inesperada) → devuelve el mismo `MissionEnergySaveData` por defecto; **nunca lanza una excepción hacia quien llama** (mismo patrón que `IChapterProgressStore.Load()`/`IMenuSettingsStore.Load()`/`IPlayerProgressStore.Load()`, FR-011).
  - Si el archivo existe, es válido, pero `currentEnergy < -1` (dato editado a mano fuera de rango) → se normaliza a `-1` (mismo tratamiento que "sin dato").
  - Si el archivo existe y es válido con `currentEnergy >= 0` → devuelve su contenido deserializado tal cual.
- **Postcondición**: el valor devuelto nunca es `null`. `currentEnergy` devuelto es siempre `>= -1`.

## `void Save(MissionEnergySaveData data)`

- **Precondición**: `data` representa el estado ya calculado a persistir (quien llama — `MissionEnergyController.Sync`/`TryEnterMission` — ya aplicó sus propias reglas antes de invocar `Save`; este método no vuelve a calcular regeneración ni valida costos, solo persiste).
- **Comportamiento**:
  1. Persiste el resultado en almacenamiento local de forma atómica (archivo temporal + reemplazo), igual que `LocalChapterProgressStore.WriteAtomic`/`LocalMenuSettingsStore.WriteAtomic`/`LocalPlayerProgressStore` (005).
  2. Cualquier `IOException`/`UnauthorizedAccessException` durante la escritura se captura y se descarta silenciosamente — **nunca se propaga hacia quien llama** (FR-011, mismo criterio que 002/003/005).
- **Postcondición**: una llamada subsecuente a `Load()` (incluida tras reiniciar el proceso) refleja el cambio, salvo fallo de escritura a nivel de sistema operativo (mismo límite documentado para `IMenuSettingsStore.Save`/`IPlayerProgressStore.Save`).

## Nombre de archivo

`LocalMissionEnergyStore.DefaultFileName = "mission-energy.json"`, resuelto contra `Application.persistentDataPath` por quien construye el store (mismo patrón que `LocalChapterProgressStore`/`LocalMenuSettingsStore`) — el propio store no conoce `Application.persistentDataPath`, recibe la ruta completa en su constructor (testeable con una ruta temporal en EditMode, sin depender de Unity en tiempo de ejecución).

## Doble de test

Los tests EditMode de `MissionEnergyController` (ver contracts/mission-energy-controller.md) usan una implementación en memoria de `IMissionEnergyStore` (sin tocar disco) para sembrar estado inicial (incluido el centinela "sin dato") y para aserter cuántas veces y con qué valores se invocó `Save`. `LocalMissionEnergyStoreTests` (EditMode) prueba la implementación real contra un directorio temporal: round-trip, archivo ausente, archivo corrupto, escritura atómica (no deja `.tmp` huérfano tras una escritura exitosa).
