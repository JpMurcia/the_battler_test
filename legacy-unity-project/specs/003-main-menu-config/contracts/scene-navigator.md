# Contract: ISceneNavigator

Capa: `TheBattler.Model`. Implementación de referencia: `UnitySceneNavigator` en `TheBattler.Gameplay`.

## Interfaz

```csharp
public interface ISceneNavigator
{
    void LoadScene(string sceneName);
}
```

## `void LoadScene(string sceneName)`

- **Precondición**: `sceneName` es el nombre de una escena registrada en Build Settings (p. ej. `"Chapter1_Battle"` — ver research.md §5).
- **Comportamiento**: delega en `UnityEngine.SceneManagement.SceneManager.LoadScene(sceneName)`. No añade lógica propia (validación, animaciones de transición, etc. quedan fuera de alcance de esta feature).
- **Postcondición**: la escena indicada queda cargada y activa, reemplazando la escena actual (comportamiento por defecto de `LoadSceneMode.Single`).

## Motivo de esta abstracción

`MainMenuFlowController.StartNewGame()`/`ContinueGame()` necesitan disparar una transición de escena, pero un test PlayMode que invoque `SceneManager.LoadScene` directamente forzaría cargar la escena real `Chapter1_Battle` dentro del propio test (lento, y acopla el test de "¿se disparó la navegación correcta?" con "¿esa escena carga sin errores?", que ya es responsabilidad de sus propios tests). Inyectar `ISceneNavigator` permite un doble de test que solo registra qué nombre de escena se pidió, sin cargar nada.

## Doble de test

Los tests PlayMode de `MainMenuFlowPlayModeTests` usan una implementación en memoria de `ISceneNavigator` (`FakeSceneNavigator`) que registra el último `sceneName` recibido y cuántas veces se invocó `LoadScene`, para poder aserter que `StartNewGame()`/`ContinueGame()` piden exactamente `"Chapter1_Battle"` una vez, sin cargar la escena real.
