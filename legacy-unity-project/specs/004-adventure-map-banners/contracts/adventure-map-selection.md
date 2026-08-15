# Contract: AdventureMapFlowController — selección de banner

Capa: `TheBattler.Gameplay`. `MonoBehaviour`, mismo patrón de resolución de dependencias en `Awake()` que `MainMenuFlowController` (003).

## Superficie relevante

```csharp
public class AdventureMapFlowController : MonoBehaviour
{
    public ChapterBannerState[] BannerStates { get; }

    public bool TrySelectBanner(int bannerIndex);
}
```

## `ChapterBannerState[] BannerStates`

- **Comportamiento**: calculado una vez en `Awake()` mediante `ChapterBannerUnlockEvaluator.Evaluate(adventureMap.Banners, progressStore.Load())` (mismo momento del ciclo de vida en que `MainMenuFlowController` calcula `HasSavedProgress` — antes de cualquier `Start()` de la capa View, ya que Unity garantiza que todos los `Awake()` terminan antes de cualquier `Start()`). No se recalcula automáticamente durante la vida de la escena (no hay ningún evento que cambie el progreso mientras el mapa está en pantalla — completar una batalla implica salir de esta escena).

## `bool TrySelectBanner(int bannerIndex)`

- **Precondición**: ninguna sobre el llamador — `bannerIndex` puede ser cualquier valor, incluido uno fuera de rango.
- **Comportamiento**:
  1. Si `bannerIndex` está fuera de rango de `BannerStates` → devuelve `false`, sin efectos secundarios.
  2. Si `BannerStates[bannerIndex].isSelectable == false` (bloqueado por progreso, **o** desbloqueado pero sin `HasPlayableDestination` — FR-003/FR-005) → devuelve `false`, **no invoca `ISceneNavigator.LoadScene`, no lanza excepción**.
  3. Si `BannerStates[bannerIndex].isSelectable == true` → invoca `sceneNavigator.LoadScene(adventureMap.Banners[bannerIndex].TargetSceneName)` y devuelve `true`.
- **Postcondición**: el valor de retorno indica sin ambigüedad si se disparó una navegación; la capa View (`ChapterBannerItemView`) no necesita volver a consultar `IsSelectable` por su cuenta antes de llamar — la guarda vive en `AdventureMapFlowController`, no solo en `Button.interactable` (defensa en profundidad: aunque algo dejara un botón bloqueado interactuable por error de UI, la navegación seguiría sin dispararse).

## Motivo de esta guarda doble (UI + controlador)

FR-003 exige que seleccionar un banner bloqueado "NO DEBE iniciar ninguna navegación ni batalla" — no solo que el botón parezca deshabilitado. Poner la comprobación de `isSelectable` en `TrySelectBanner` (Gameplay), y no solo en `Button.interactable` (View), asegura que ningún camino de invocación (incluido un test que llame a `TrySelectBanner` directamente, sin pasar por un clic de UI) pueda saltarse la regla.

## Doble de test

`AdventureMapFlowPlayModeTests` usa el mismo `ISceneNavigator` de prueba en memoria que `MainMenuFlowPlayModeTests` (003) para verificar, sin cargar escenas reales: `TrySelectBanner(0)` (primer banner, siempre desbloqueado y jugable) navega exactamente una vez a `TargetSceneName`; `TrySelectBanner(1)` sin progreso previo no navega (bloqueado); con el capítulo 0 marcado como completado en un `IChapterProgressStore` de prueba, `TrySelectBanner(1)` sigue sin navegar si ese banner no tiene `LinkedChapter` (caso "Hacia el Futuro" — desbloqueado pero no jugable); un índice fuera de rango no lanza excepción.
