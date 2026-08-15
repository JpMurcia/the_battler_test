# Contract: ChapterBannerDefinition

Capa: `TheBattler.Model`. ScriptableObject de datos de diseño, mismo patrón que `ChapterDefinition` (001).

## Forma

```csharp
public class ChapterBannerDefinition : ScriptableObject
{
    public ChapterDefinition LinkedChapter { get; }   // nullable
    public string TargetSceneName { get; }
    public string DisplayNameKey { get; }
    public Sprite BannerArt { get; }                  // nullable

    public string ChapterId { get; }               // derivado: LinkedChapter?.ChapterId
    public bool HasPlayableDestination { get; }     // derivado: LinkedChapter != null
}
```

## `ChapterId` (derivado)

- **Comportamiento**: `LinkedChapter != null ? LinkedChapter.ChapterId : null`. No es un campo serializado — se recalcula cada vez que se accede, siempre coherente con el `ChapterDefinition` referenciado (no puede desincronizarse, ver research.md §1).
- **Uso**: clave de búsqueda contra `ProgressSaveData.chapters[].chapterId` (002) dentro de `ChapterBannerUnlockEvaluator`.

## `HasPlayableDestination` (derivado)

- **Comportamiento**: `LinkedChapter != null`.
- **Postcondición**: cuando es `false`, ningún banner puede volverse `isSelectable` en `ChapterBannerState`, sin importar el resultado de `isUnlocked` (FR-005) — es una condición independiente del cálculo de progreso.

## Validación de datos (Editor / EditMode)

- `DisplayNameKey` no vacío/nulo — error de datos de diseño si falta (equivalente a `spanish` obligatorio en `LocalizedStringEntry`, 003).
- Si `LinkedChapter != null`, `TargetSceneName` no vacío/nulo — un banner con contenido jugable real que no sabe a qué escena navegar es un dato de diseño incompleto, detectable en un test EditMode que recorra los assets `ChapterBannerDefinition` del proyecto (mismo patrón que `UnitDefinitionValidationTests`, 001).
- No hay validación de que `TargetSceneName` corresponda a una escena realmente registrada en Build Settings — igual que `ISceneNavigator` (003), esa verificación queda fuera de alcance en tiempo de datos; solo se manifestaría como un fallo de `SceneManager.LoadScene` en tiempo de ejecución, responsabilidad ya delegada a `ISceneNavigator`.

## Motivo de las propiedades derivadas en vez de campos serializados

Serializar `ChapterId`/`HasPlayableDestination` como campos propios obligaría a mantenerlos sincronizados a mano cada vez que `LinkedChapter` cambia en el Editor (riesgo de datos inconsistentes, p. ej. un `HasPlayableDestination = true` con `LinkedChapter == null` tras un cambio manual sin querer). Calcularlos como propiedades hace que la inconsistencia sea estructuralmente imposible.
