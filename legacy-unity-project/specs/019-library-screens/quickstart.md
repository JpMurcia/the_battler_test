# Quickstart: Bibliotecas de Consulta (Cat Guide / Enemy Guide / Treasure Menu)

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- `005-player-dashboard`, `009-unit-evolution`, `013-empire-of-cats-saga` y `014-chapter-scaling-treasure-sets` implementadas y en verde — esta feature solo lee de sus controllers/catálogos, no los modifica.

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar `CatGuideBuilderTests`, `EnemyGuideBuilderTests` (incluyendo catálogo/registro vacíos ⇒ lista vacía, FR-009) y `TreasureMenuBuilderTests` (incluyendo un set sin ningún tesoro obtenido ⇒ 0/total, FR-009).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar `EnemyEncounterTrackingPlayModeTests`: un enemigo generado durante una batalla queda registrado en `encounteredEnemyIds` (independientemente del resultado de la batalla), un enemigo planeado en la oleada pero nunca generado no queda registrado (US2 Escenario 3), y un reintento (`RetryBattle()`) no duplica la entrada de un enemigo ya registrado.

## Validación manual (escenario end-to-end)

1. Abrir `PlayerBase.unity` en el Editor y entrar en Play Mode.
2. Abrir Cat Guide desde la Base del Jugador: confirmar que aparecen las unidades base del capítulo y cualquier unidad bonus ya desbloqueada, cada una con su nivel, forma de evolución y stats efectivas (Historia 1, Escenario 1).
3. Con un guardado sin ninguna unidad bonus desbloqueada, repetir el paso 2: confirmar que Cat Guide muestra únicamente las unidades base, sin error (Historia 1, Escenario 2).
4. Con un guardado sin ninguna batalla jugada, abrir Enemy Guide: confirmar que se muestra vacío, sin error (Historia 2, Escenario 2).
5. Jugar una batalla (`Chapter1_Battle.unity`) hasta que al menos un enemigo aparezca en el carril, sin importar si se gana o se pierde la batalla. Volver a la Base del Jugador y abrir Enemy Guide: confirmar que ese enemigo aparece listado con sus stats base (Historia 2, Escenario 1).
6. Repetir una batalla deteniéndola (o forzando la derrota) antes de que un enemigo tardío de la oleada llegue a su `spawnTimeSeconds`: confirmar que ese enemigo específico no aparece en Enemy Guide (Historia 2, Escenario 3).
7. Con un set de tesoros parcialmente completado, abrir Treasure Menu: confirmar que ese set muestra el conteo correcto de tesoros obtenidos sobre el total, sin bonificación marcada como otorgada (Historia 3, Escenario 1).
8. Completar el resto de tesoros de ese set jugando los niveles correspondientes, y repetir el paso 7: confirmar que el set se muestra completo, con la bonificación marcada como otorgada (Historia 3, Escenario 2).
9. Confirmar (sin modificar ningún asset) que ninguna interacción dentro de las tres bibliotecas modificó el equipo activo, el inventario de objetos de batalla, ni ningún otro dato de progreso (SC-005) — comparar el `PlayerProgressSaveData` persistido antes y después de navegar las tres pantallas sin salir de ellas mediante ninguna acción de escritura.

## Resultado esperado

- Los 9 pasos anteriores se completan sin errores en la consola de Unity.
- Los tests EditMode y PlayMode nuevos de esta feature pasan en verde junto con la suite completa heredada de `001`-`018`.
- Ningún dato de progreso del jugador queda modificado por el mero hecho de abrir o navegar las tres bibliotecas.
