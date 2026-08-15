# Quickstart: Menú Principal y Configuración

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- Features 001 (Capítulo 1) y 002 (Guardado local) implementadas y en verde — esta feature lee `ProgressSaveData` (002) y navega hacia `Chapter1_Battle.unity` (001).
- `Assets/Scenes/MainMenu.unity` registrada como escena índice 0 de Build Settings, `Chapter1_Battle.unity` como índice 1 (ver research.md §5).

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar `LocalMenuSettingsStoreTests` (round-trip, archivo ausente, archivo corrupto) y `LocalizedTextTableTests` (lookup, fallback a español, marcador de clave faltante).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar `MainMenuFlowPlayModeTests`: visibilidad de "Continuar" según progreso, navegación de "Empezar"/"Continuar", descarte de ajustes sin confirmar, aplicación y persistencia al confirmar.

## Validación manual (escenario end-to-end)

1. Borrar (o renombrar temporalmente) `progress.json` y `menu-settings.json` en `Application.persistentDataPath`, para simular una instalación nueva.
2. Abrir `MainMenu.unity` en el Editor y entrar en Play Mode.
3. Confirmar que el menú se muestra sin errores en consola, con audio/idioma por defecto ya aplicados (Historia 3, Escenario 1) y **solo** la opción "Empezar" visible (Historia 1, sin progreso).
4. Seleccionar "Empezar" y confirmar que el juego entra a la batalla del Capítulo 1 (Historia 1, Escenario 2).
5. Jugar hasta Victoria (o Derrota) para que 002 registre un intento.
6. Volver a `MainMenu.unity` (o reiniciar Play Mode) y confirmar que ahora aparece "Continuar" además de "Empezar" (Historia 2, Escenario 1), y que seleccionarlo lleva al contenido correspondiente al progreso guardado (Historia 2, Escenario 2).
7. Corromper manualmente `progress.json` (truncar el JSON) y volver a entrar en Play Mode. Confirmar que el menú lo trata como "sin progreso" — solo "Empezar" visible, sin errores en consola (Historia 2, Escenario 3).
8. Desde el menú, entrar a Configuración: mover los tres sliders de volumen (música, efectos, voces) y cambiar el idioma sin presionar "Aplicar/Guardar"; salir de la pantalla de configuración y volver a entrar — confirmar que se ven los últimos valores confirmados, no los cambios descartados (Historia 3, Escenario 2 / Edge Case).
9. Repetir el paso 8 pero presionando "Aplicar/Guardar" antes de salir; cerrar completamente el juego (salir de Play Mode) y volver a entrar — confirmar que los tres volúmenes y el idioma elegido se mantienen (Historia 3, Escenario 2).
10. Con un idioma distinto de Español confirmado, verificar que tanto los textos del menú como los de la UI existente (por ejemplo, HUD de `Chapter1_Battle`) se muestran traducidos, sin marcadores `"[key]"` visibles para las claves ya cubiertas (FR-004).
11. (Opcional, edge case) Corromper manualmente `menu-settings.json` y volver a entrar en Play Mode. Confirmar que el menú arranca con los valores por defecto, sin excepciones en consola.

## Resultado esperado

- Los 11 pasos anteriores se completan sin errores en la consola de Unity.
- El contenido de `progress.json` y `menu-settings.json` coincide en cada paso con lo descrito en [data-model.md](./data-model.md) y en [specs/002-local-save-progress/data-model.md](../002-local-save-progress/data-model.md).
