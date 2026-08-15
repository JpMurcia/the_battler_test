# Contract: IChapterProgressStore

Capa: `TheBattler.Model`. Implementación de referencia: `LocalChapterProgressStore` en `TheBattler.Gameplay`.

## Interfaz

```csharp
public interface IChapterProgressStore
{
    ProgressSaveData Load();

    void SaveChapterOutcome(string chapterId, BattleOutcome outcome);

    void ClearProgress();
}
```

## `ProgressSaveData Load()`

- **Precondición**: ninguna.
- **Comportamiento**:
  - Si el archivo de guardado no existe → devuelve un `ProgressSaveData` con `formatVersion = 1` y `chapters` vacío (FR-004).
  - Si el archivo existe pero no se puede parsear (JSON malformado, `formatVersion` no reconocido, estructura inesperada) → devuelve el mismo `ProgressSaveData` vacío que en el caso anterior; **nunca lanza una excepción hacia quien llama** (FR-005).
  - Si el archivo existe y es válido → devuelve su contenido deserializado tal cual.
- **Postcondición**: el valor devuelto nunca es `null`; `chapters` nunca es `null` (puede estar vacío).

## `void SaveChapterOutcome(string chapterId, BattleOutcome outcome)`

- **Precondición**: `outcome` es `Victory` o `Defeat` (nunca `InProgress` — quien llama, `BattleStateManager`, solo invoca esto tras resolver la batalla).
- **Comportamiento**:
  1. Carga el estado actual (equivalente a `Load()`).
  2. Si ya existe un `ChapterProgressRecord` con ese `chapterId`, lo actualiza (`isCompleted`/`lastOutcome`) en vez de añadir uno nuevo (FR-006).
  3. Si no existe, añade un nuevo registro.
  4. `isCompleted` se fija a `true` si y solo si `outcome == Victory`.
  5. Persiste el resultado en almacenamiento local de forma atómica (FR-002). Toda la operación de escritura (temp file + reemplazo) queda envuelta en un `try/catch`; cualquier `IOException`/`UnauthorizedAccessException` se captura y se descarta silenciosamente (o se registra vía log, sin relanzar) — **nunca se propaga hacia quien llama** (FR-010).
- **Postcondición**: una llamada subsecuente a `Load()` (incluida tras reiniciar el proceso) refleja el cambio, salvo fallo de escritura a nivel de sistema operativo (FR-010: la sesión sigue jugable, el intento de guardado puede no persistir, pero `SaveChapterOutcome` nunca lanza).

## `void ClearProgress()`

- **Precondición**: ninguna.
- **Comportamiento**: elimina el guardado local (o lo reemplaza por el equivalente vacío) de forma que una llamada posterior a `Load()` devuelva `chapters` vacío (FR-007).
- **Postcondición**: equivalente exacto al estado de una instalación nueva.

## Doble de test

Los tests PlayMode de integración (`BattleStateManager` → guardado) usan una implementación en memoria de `IChapterProgressStore` (sin tocar disco) que registra las llamadas a `SaveChapterOutcome` para poder aserter que se invocó exactamente una vez, con el `chapterId` y `outcome` esperados, al resolverse la batalla.
