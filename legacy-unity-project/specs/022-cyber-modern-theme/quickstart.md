# Quickstart: Sistema Visual Cyber-Modern — Tema Compartido y Reskin de Menú Principal

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- `003-main-menu-config` implementada y en verde — esta feature reskinea `MainMenu.unity` sin tocar `MainMenuFlowController.cs`/`MainMenuUIController.cs`/`SettingsPanelController.cs` (research.md §4).
- DOTween importado en el proyecto (research.md §1 — paso manual de configuración, fuera del alcance de este pipeline automatizado).
- Fuente Inter importada como TMP Font Asset, o `UIThemeCatalog.BodyFont` apuntando a "Raleway" como respaldo si se optó por no descargarla (research.md §2).
- Mockup de referencia disponible para comparación visual: proyecto Claude Design "The Battle Cats Redesign" (`Battle Cats Modernizado.dc.html`, pantalla `isTitle`).

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar `UIThemeCatalogTests` (nuevo): valores por defecto razonables al crear una instancia vacía; `HeadingFont`/`BodyFont`/colores sin asignar no lanzan excepción al leerse (spec.md Edge Cases).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar `MainMenuFlowPlayModeTests` **sin ninguna modificación respecto a antes de esta spec** (data-model.md) — su verde continuo es la prueba de que el reskin no alteró comportamiento (visibilidad de Continuar, navegación de Start/Continue, patrón pendiente/confirmado de Ajustes, aplicación inmediata de idioma/audio).

## Validación manual (comparación perceptual contra el mockup de referencia)

1. Abrir `MainMenu.unity` en el Editor y entrar en Play Mode sin progreso guardado: confirmar que la pantalla usa el nuevo estilo visual (paneles oscuros, acentos de color, tipografía Orbitron/Inter) comparándola lado a lado con el estado `isTitle` del mockup de referencia — mismo criterio de comparación manual que ancla spec.md SC-001. Confirmar que solo el botón "Jugar" es visible.
2. Guardar progreso (completar o simular una batalla de `Chapter1_Battle`) y reabrir `MainMenu.unity`: confirmar que aparece también "Continuar" con el nuevo estilo, y que ambos botones navegan exactamente a donde navegaban antes de esta spec.
3. Pulsar "Ajustes": confirmar que el panel se ve con el nuevo estilo (paneles/botones themeados) y que los sliders de audio, el dropdown de idioma, y Aplicar/Cerrar se comportan exactamente igual que antes (cambiar un valor sin Aplicar y cerrar debe descartarlo; Aplicar debe persistirlo y reflejarse de inmediato).
4. Abrir el asset `Assets/ScriptableObjects/Battler/UI/UIThemeCatalog.asset` en el Inspector, cambiar `AccentOrange` a otro color, guardar, y volver a entrar en Play Mode: confirmar que el botón "Jugar" refleja el nuevo color sin haber tocado ningún script (spec.md SC-004, US2 Escenario 2).
5. Con `UIThemeCatalog.BodyFont` temporalmente vacío (sin asignar), volver a entrar en Play Mode: confirmar que la escena no lanza ninguna excepción y que el texto de cuerpo simplemente conserva la fuente que ya tuviera en la escena (research.md §5) — restaurar la referencia a Inter/Raleway al terminar esta verificación.
6. Confirmar en la consola de Unity que no aparece ningún error/warning nuevo al abrir `MainMenu.unity` o al entrar/salir de Play Mode repetidas veces (el pulso del botón "Jugar" vía DOTween no debe dejar tweens huérfanos — `OnDisable` los mata, data-model.md).

## Resultado esperado

- Los 6 pasos anteriores se completan sin errores en la consola de Unity.
- Los tests EditMode nuevos de esta feature pasan en verde; la suite PlayMode heredada de `001`-`021`, incluyendo `MainMenuFlowPlayModeTests` sin modificar, sigue en verde sin ningún cambio de comportamiento.
- El Menú Principal y su panel de Ajustes son visualmente reconocibles como una interpretación Unity fiel del mockup de referencia "Battle Cats Modernizado" (pantalla `isTitle`), sin ninguna pérdida de funcionalidad respecto al menú anterior.
- Ninguna otra pantalla del juego (Hub, Mapa de Etapas, Batalla, Equipar, Mejorar, Biblioteca, Perfil) cambia su apariencia — el alcance visual de esta spec es exclusivamente Menú Principal + Ajustes.
