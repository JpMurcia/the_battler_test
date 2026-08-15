# Quickstart: Reskin Visual Cyber-Modern — Base del Jugador / Hub

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- `022-cyber-modern-theme` implementada y en verde — `UIThemeCatalog.asset` debe existir en `Assets/ScriptableObjects/Battler/UI/` y estar poblado con los valores del mockup. Si `022` todavía no tiene su `PlayerBase.unity` equivalente para Menú Principal terminado, esta spec puede igual implementarse en paralelo (comparten el mismo `UIThemeCatalog.asset`, no hay dependencia de tareas entre ambas más allá del asset).
- `005-player-dashboard`, `018-battle-items`, `019-library-screens`, `020-user-rank` implementadas y en verde — esta spec reskinea sus botones de acceso desde el Hub, no su funcionalidad.
- Mockup de referencia disponible para comparación visual: `docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html`, pantalla `isHub`.

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar `ComingSoonUIControllerTests` (nuevo): `ShowSystem("Gamatoto")` actualiza el label a "Gamatoto"; llamar `ShowSystem()` dos veces seguidas con nombres distintos deja el label con el segundo nombre (misma instancia reutilizada); `m_SystemNameLabel` sin asignar no lanza excepción (spec.md Edge Cases).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar `PlayerBaseFlowPlayModeTests` con sus asserts ya existentes intactos (data-model.md) más los 4 casos nuevos: cada uno de los 4 accesos "Próximamente" abre `ComingSoonPanel` con el nombre de sistema correcto (SC-005).

## Validación manual (comparación perceptual contra el mockup de referencia)

1. Abrir `PlayerBase.unity` en el Editor y entrar en Play Mode: confirmar que la cabecera (nivel de personaje, experiencia disponible) y el fondo usan el nuevo estilo visual, comparándola contra el estado `isHub` del mockup de referencia — mismo criterio de comparación manual que ancla spec.md SC-001.
2. Subir de nivel o gastar experiencia mientras la Base está abierta: confirmar que la cabecera themeada sigue actualizándose igual que antes del reskin (US1 Escenario 2).
3. Tocar cada uno de los 7 accesos ya construidos (Mejorar, Equipo, Objetos de Batalla, Cat Guide, Enemy Guide, Menú de Tesoros, Rango de Usuario): confirmar que cada uno abre el mismo panel que abría antes de esta spec, que el botón se ve con el nuevo tema, y que el contenido interno del panel sigue con su estilo actual sin cambios (US2).
4. Tocar cada uno de los 4 accesos nuevos (Gamatoto, Cápsula, Almacén, Tienda): confirmar que cada uno abre el mismo panel "Próximamente", mostrando el nombre de sistema correcto en cada caso, y que cerrarlo vuelve al Hub sin alterar ningún otro estado (US3).
5. Con un panel opcional sin asignar en la escena de prueba (p. ej. quitar temporalmente la referencia a `UserRankUIController`): confirmar que el botón correspondiente no aparece y no rompe el layout del resto de accesos themeados (Edge Case).
6. Confirmar en la consola de Unity que no aparece ningún error/warning nuevo al abrir `PlayerBase.unity` o al entrar/salir de Play Mode repetidas veces.

## Resultado esperado

- Los 6 pasos anteriores se completan sin errores en la consola de Unity.
- Los tests EditMode nuevos de esta feature pasan en verde; la suite PlayMode heredada de `001`-`022`, incluyendo los asserts ya existentes de `PlayerBaseFlowPlayModeTests`, sigue en verde sin ningún cambio de comportamiento.
- La Base del Jugador es visualmente reconocible como una interpretación Unity fiel del mockup de referencia "Battle Cats Modernizado" (pantalla `isHub`), sin ninguna pérdida de funcionalidad respecto al Hub anterior.
- Ninguna otra pantalla del juego (Mapa de Etapas, Batalla, Equipar, Mejorar, Biblioteca, Perfil) cambia su apariencia, y el contenido interno de los 7 paneles ya construidos tampoco cambia — el alcance visual de esta spec es exclusivamente el chrome del Hub.
