# Quickstart: Guardado Local de Progreso

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- Feature 001 (Capítulo 1) implementada y en verde — este feature se apoya en `BattleStateManager`, `BattleOutcomeResolver` y `ChapterDefinition` ya existentes.

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar `LocalChapterProgressStoreTests` (round-trip, archivo ausente, archivo corrupto, `ClearProgress`).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar la aserción de que `BattleStateManager` invoca `IChapterProgressStore.SaveChapterOutcome` exactamente una vez, con el `chapterId` y outcome correctos, al resolver la batalla del Capítulo 1 en Victoria.

## Validación manual (escenario end-to-end)

1. Borrar (o renombrar temporalmente) el archivo de guardado real en `Application.persistentDataPath` si existe de una sesión anterior, para simular una instalación nueva.
2. Abrir `Chapter1_Battle.unity` en el Editor y entrar en Play Mode.
3. Confirmar que el juego arranca con normalidad (sin errores en la consola) — corresponde a Historia 2, Escenario 2 (sin guardado previo).
4. Jugar la batalla hasta Victoria.
5. Salir de Play Mode. Inspeccionar el archivo de guardado en `Application.persistentDataPath` (por ejemplo `%userprofile%\AppData\LocalLow\<Company>\<Product>\progress.json` en Windows) y confirmar que contiene un registro para el `chapterId` del Capítulo 1 con `isCompleted = true` y `lastOutcome = Victory`.
6. Volver a entrar en Play Mode (simula reabrir el juego). Confirmar (por ejemplo con un breakpoint o log temporal) que el estado cargado refleja el paso 5 — corresponde a Historia 2, Escenario 1.
7. Repetir la batalla y perder deliberadamente (Derrota). Confirmar que el registro se actualiza a `isCompleted = false`, `lastOutcome = Defeat`, sin que aparezca un segundo registro para el mismo capítulo — corresponde a Historia 1, Escenario 3 y FR-006.
8. Invocar la acción de borrado de progreso (control de QA, ver Historia 3). Confirmar que el archivo de guardado queda vacío/ausente y que una carga posterior no encuentra capítulos completados.
9. (Opcional, edge case) Corromper manualmente el archivo de guardado (por ejemplo truncar el JSON a mitad) y volver a entrar en Play Mode. Confirmar que el juego arranca con normalidad tratándolo como sin progreso, sin excepciones en la consola.

## Resultado esperado

- Los 9 pasos anteriores se completan sin errores en la consola de Unity.
- El contenido del archivo de guardado coincide en cada paso con lo descrito en [data-model.md](./data-model.md).
