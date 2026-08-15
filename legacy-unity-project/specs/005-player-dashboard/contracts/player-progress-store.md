# Contract: IPlayerProgressStore

Capa: `TheBattler.Model`. Implementación de referencia: `LocalPlayerProgressStore` en `TheBattler.Gameplay`.

## Interfaz

```csharp
public interface IPlayerProgressStore
{
    PlayerProgressSaveData Load();

    void Save(PlayerProgressSaveData data);
}
```

## `PlayerProgressSaveData Load()`

- **Precondición**: ninguna.
- **Comportamiento**:
  - Si el archivo (`player-progress.json`) no existe → devuelve un `PlayerProgressSaveData` con valores por defecto (`unitProgress` vacío, `availableExperience = 0`, `activeTeamUnitIds` vacío) (FR-013).
  - Si el archivo existe pero no se puede parsear (JSON malformado, `formatVersion` no reconocido, estructura inesperada) → devuelve el mismo `PlayerProgressSaveData` por defecto; **nunca lanza una excepción hacia quien llama** (mismo patrón que `IChapterProgressStore.Load()`/`IMenuSettingsStore.Load()`, FR-013).
  - Si el archivo existe y es válido → devuelve su contenido deserializado, con `availableExperience` clampado a `>= 0` y sin entradas duplicadas de `unitProgress` por `unitId` (si el archivo llegara a tener duplicados por edición manual, se conserva la última).
- **Postcondición**: el valor devuelto nunca es `null`; `unitProgress` y `activeTeamUnitIds` nunca son `null` (pueden estar vacíos).

## `void Save(PlayerProgressSaveData data)`

- **Precondición**: `data` representa el estado ya válido a persistir (quien llama — `UnitLevelingController.TryLevelUp` o `TeamFormationController.TryConfirmFormation` — ya aplicó sus propias reglas de negocio antes de invocar `Save`; este método no vuelve a validar "equipo no vacío" ni "experiencia suficiente", solo persiste).
- **Comportamiento**:
  1. Clampa `availableExperience` a `>= 0`.
  2. Persiste el resultado en almacenamiento local de forma atómica (temp file + reemplazo), igual que `LocalChapterProgressStore.WriteAtomic`/`LocalMenuSettingsStore.WriteAtomic`.
  3. Cualquier `IOException`/`UnauthorizedAccessException` durante la escritura se captura y se descarta silenciosamente — **nunca se propaga hacia quien llama** (FR-013).
- **Postcondición**: una llamada subsecuente a `Load()` (incluida tras reiniciar el proceso) refleja el cambio, salvo fallo de escritura a nivel de sistema operativo (mismo límite documentado para `IMenuSettingsStore.Save`).

## Doble de test

Los tests EditMode de `UnitLevelingController`/`TeamFormationController` (ver contracts/unit-leveling.md, contracts/team-formation.md) y los tests PlayMode de integración con `BattleStateManager` usan una implementación en memoria de `IPlayerProgressStore` (sin tocar disco) para sembrar estado inicial y para aserter cuántas veces y con qué valores se invocó `Save`.
