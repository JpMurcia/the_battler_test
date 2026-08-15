# Contract: IMenuSettingsStore

Capa: `TheBattler.Model`. Implementación de referencia: `LocalMenuSettingsStore` en `TheBattler.Gameplay`.

## Interfaz

```csharp
public interface IMenuSettingsStore
{
    MenuSettings Load();

    void Save(MenuSettings settings);
}
```

## `MenuSettings Load()`

- **Precondición**: ninguna.
- **Comportamiento**:
  - Si el archivo de ajustes no existe → devuelve un `MenuSettings` con los valores por defecto (`musicVolume`/`sfxVolume`/`voiceVolume` = `1.0`, `language` = `Spanish`) (FR-002).
  - Si el archivo existe pero no se puede parsear (JSON malformado, `formatVersion` no reconocido, estructura inesperada) → devuelve el mismo `MenuSettings` por defecto; **nunca lanza una excepción hacia quien llama** (mismo patrón de tolerancia que `IChapterProgressStore.Load()`, FR-013).
  - Si el archivo existe y es válido → devuelve su contenido deserializado, con `musicVolume`/`sfxVolume`/`voiceVolume` clampados a `[0, 1]`.
- **Postcondición**: el valor devuelto nunca es `null`.

## `void Save(MenuSettings settings)`

- **Precondición**: `settings` representa el estado ya confirmado por el jugador (acción explícita "Aplicar/Guardar" — ver FR-005; quien llama, la capa `View`, es responsable de no invocar `Save` con valores todavía "pendientes"/sin confirmar).
- **Comportamiento**:
  1. Clampa `musicVolume`/`sfxVolume`/`voiceVolume` a `[0, 1]`.
  2. Persiste el resultado en almacenamiento local de forma atómica (temp file + reemplazo), igual que `LocalChapterProgressStore.WriteAtomic`.
  3. Cualquier `IOException`/`UnauthorizedAccessException` durante la escritura se captura y se descarta silenciosamente — **nunca se propaga hacia quien llama** (FR-013).
- **Postcondición**: una llamada subsecuente a `Load()` (incluida tras reiniciar el proceso) refleja el cambio, salvo fallo de escritura a nivel de sistema operativo (en cuyo caso el valor en memoria de la sesión actual ya está aplicado vía `MenuAudioApplier`/idioma activo, pero no persiste — FR-013).

## Doble de test

Los tests PlayMode de `MainMenuFlowPlayModeTests` usan una implementación en memoria de `IMenuSettingsStore` (sin tocar disco) para verificar que "Aplicar/Guardar" invoca `Save` exactamente una vez con los valores pendientes, y que salir sin confirmar nunca la invoca.
