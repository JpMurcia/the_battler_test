# Quickstart: Mapa de Aventuras (Banners) y Desbloqueo Secuencial

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- Features `001-chapter1-vertical-slice`, `002-local-save-progress` y `003-main-menu-config` implementadas y en verde — esta feature lee `ProgressSaveData` (002) y `MenuSettings`/`LocalizedTextTable` (003), y navega hacia `Chapter1_Battle.unity` (001) desde un banner.
- `Assets/Scenes/AdventureMap.unity` registrada en Build Settings (ver research.md §7).
- `Assets/Data/Battler/MainAdventureMap.asset` (instancia de `AdventureMap`) con los 2 banners de spec.md: "Imperio de los Test/Robot" (`LinkedChapter` = `ChapterDefinition` del Capítulo 1, `TargetSceneName` = `"Chapter1_Battle"`) en índice 0, "Hacia el Futuro" (`LinkedChapter` = `null`) en índice 1.

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar `ChapterBannerUnlockEvaluatorTests` (primer banner siempre desbloqueado; N+1 bloqueado hasta completar N; progreso vacío/corrupto = solo primero desbloqueado; banner sin `LinkedChapter` nunca "completa"; `isSelectable` falso sin `HasPlayableDestination` aunque `isUnlocked` sea verdadero) y `ChapterBannerDefinitionValidationTests` (`TargetSceneName` obligatorio cuando hay `LinkedChapter`, `AdventureMap.Banners` no vacío).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar `AdventureMapFlowPlayModeTests`: `TrySelectBanner` navega solo para el banner desbloqueado y jugable; no navega para un banner bloqueado ni para uno desbloqueado sin destino jugable; índice fuera de rango no lanza excepción.

## Validación manual (escenario end-to-end)

1. Borrar (o renombrar temporalmente) `progress.json` y `menu-settings.json` en `Application.persistentDataPath`, para simular una instalación nueva (mismo estado inicial que el quickstart de 003).
2. Abrir `AdventureMap.unity` en el Editor y entrar en Play Mode.
3. Confirmar que el mapa se muestra sin errores en consola, en menos de 2 segundos percibidos (SC-005), mostrando **ambos** banners: "Imperio de los Test/Robot" y "Hacia el Futuro" (FR-001).
4. Desplazar (scroll) el mapa hasta recorrer los dos banners de punta a punta, incluido pasar por encima de "Hacia el Futuro" (bloqueado/no jugable) sin que el desplazamiento se detenga o rechace el gesto en ningún punto (Historia 1, SC-001).
5. Confirmar que "Imperio de los Test/Robot" aparece como desbloqueado/seleccionable (sin progreso previo — Historia 2, Escenario 1) y que "Hacia el Futuro" aparece visible pero no seleccionable (FR-005).
6. Seleccionar "Imperio de los Test/Robot" y confirmar que el juego entra a la batalla del Capítulo 1 (Historia 2, Escenario 2 / SC-002).
7. Intentar seleccionar "Hacia el Futuro" (p. ej. hacer clic sobre su banner) y confirmar que no ocurre ninguna navegación ni error en consola (Historia 1 Edge Case / SC-003).
8. Jugar hasta Victoria en el Capítulo 1 (para que 002 registre `isCompleted = true`), volver a `AdventureMap.unity` (o reiniciar Play Mode) y confirmar que "Imperio de los Test/Robot" ahora se refleja como completado (Historia 3, Escenario 1 / SC-004).
9. Con el Capítulo 1 completado, confirmar en el mapa que la evaluación de desbloqueo del siguiente banner con contenido real se ejecuta (aunque "Hacia el Futuro" siga sin ser seleccionable por no tener `LinkedChapter` todavía — Historia 3, Escenario 2, y Edge Case correspondiente de spec.md).
10. Corromper manualmente `progress.json` (truncar el JSON) y volver a entrar en Play Mode sobre `AdventureMap.unity`. Confirmar que el mapa lo trata como "sin progreso" — solo "Imperio de los Test/Robot" desbloqueado, sin errores en consola (Historia 3, Escenario 3 / FR-008).
11. Con un idioma distinto de Español confirmado en `menu-settings.json` (vía el panel de ajustes de 003), volver a entrar a `AdventureMap.unity` y confirmar que los nombres de banner se muestran traducidos, sin marcadores `"[key]"` visibles para las claves ya cubiertas en `MainLocalizedText.asset`.

## Resultado esperado

- Los 11 pasos anteriores se completan sin errores en la consola de Unity.
- El contenido de `progress.json` no cambia como consecuencia de entrar/salir del mapa de aventuras (esta feature nunca escribe en él — FR-006); solo cambia por completar/perder una batalla, comportamiento ya cubierto por `002-local-save-progress`.
- El estado de desbloqueo/completado mostrado en el mapa siempre coincide con lo que produciría `ChapterBannerUnlockEvaluator.Evaluate(...)` aplicado manualmente al contenido de `progress.json` en ese momento (ver [data-model.md](./data-model.md) y [contracts/chapter-banner-unlock-evaluator.md](./contracts/chapter-banner-unlock-evaluator.md)).
