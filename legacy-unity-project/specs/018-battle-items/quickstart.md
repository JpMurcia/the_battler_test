# Quickstart: Sistema de Objetos de Batalla

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- `005-player-dashboard`, `013-empire-of-cats-saga` y `014-chapter-scaling-treasure-sets` implementadas y en verde — esta feature extiende `TeamFormationController`'s hermano (`BattleItemSelectionController` nuevo), `ChapterDefinition`, `PlayerProgressSaveData` y el catálogo de tesoros ya definidos ahí, no los reemplaza.

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log"
```

Nota (verificado en 018): **no** combinar `-runTests` con `-quit` — Unity cierra el proceso en cuanto termina el arranque/compilación, antes de que el test runner llegue a ejecutar ningún test (el log muestra compilación en verde pero 0 tests corridos). El test runner ya cierra Unity por su cuenta al terminar.

- Debe incluir y pasar `BattleItemSelectionControllerTests` (confirmar/rechazar selección por límite máximo, por inventario insuficiente, selección vacía válida) y `ChapterDefinitionBattleItemRewardDefaultsTests` (una `ChapterDefinition` sin `m_BattleItemReward` asignado expone `BattleItemReward == null`/`BattleItemRewardCount == 0`, FR-011).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log"
```

- Debe incluir y pasar `BattleItemEffectsBattlePlayModeTests`: US1 (seleccionar hasta el límite, rechazar el exceso), US2 (Aceleración de Velocidad y Dinero Extra activos desde el inicio; Radar de Tesoro otorga un tesoro adicional al ganar, con `UnityEngine.Random.InitState` sembrado; sin tesoros pendientes, no-op sin error), US3 (completar un nivel con recompensa de objeto de batalla configurada añade ese objeto al inventario), y la persistencia de efectos a través de `RetryBattle()` (FR-013).

## Validación manual (escenario end-to-end)

1. Abrir `PlayerBase.unity` en el Editor y, mediante el Inspector, otorgar manualmente al `PlayerProgressSaveData` de prueba (o vía un hook de QA temporal, mismo criterio que `PlayerBaseFlowController.GrantTestExperience`) al menos una unidad de cada uno de los 3 objetos de batalla mínimos.
2. Entrar en Play Mode, navegar a la pantalla de preparación pre-batalla, y confirmar que los 3 objetos aparecen disponibles para seleccionar (Historia 1, Escenario 1).
3. Seleccionar el número máximo permitido de objetos e intentar seleccionar uno adicional: confirmar que el sistema no lo permite (Historia 1, Escenario 2).
4. Confirmar la selección sin elegir ningún objeto y entrar a una batalla: confirmar que la batalla se desarrolla con normalidad, sin ningún objeto activo (Historia 1, Escenario 3; SC-004).
5. Repetir la preparación seleccionando "Aceleración de Velocidad" y entrar a la batalla: confirmar en el Inspector de una instancia de `UnitRuntime` en Play Mode (o a simple vista) que las unidades se mueven más rápido desde el primer despliegue (Historia 2, Escenario 1).
6. Repetir seleccionando "Dinero Extra": confirmar que el recurso de batalla (`BattleResourceController.CurrentAmount`) empieza por encima de 0 en el primer frame de la batalla, en vez de acumularse desde 0 (Historia 2, Escenario 2).
7. Perder deliberadamente esa misma batalla (o forzar la derrota) y usar "Reintentar": confirmar que el recurso extra y la velocidad aumentada siguen presentes en el reintento, sin haberse vuelto a descontar del inventario (FR-013).
8. Repetir la preparación seleccionando "Radar de Tesoro" en un nivel cuyo `TreasureRewardId` normal ya esté obtenido previamente, y ganar la batalla: confirmar que se añade un tesoro adicional distinto al inventario de tesoros del jugador (Historia 2, Escenario 3).
9. Con el jugador en un estado donde ya posee todos los tesoros del catálogo, repetir el paso 8: confirmar que la batalla se resuelve con normalidad sin ningún error en consola y sin tesoro adicional otorgado (Historia 2, Escenario 4; FR-010).
10. Configurar un nivel de prueba con una recompensa de objeto de batalla asignada en su `ChapterDefinition` y completarlo con victoria: confirmar que el objeto correspondiente aparece en el inventario del jugador tras la batalla (Historia 3, Escenario 1).
11. Confirmar (sin modificar ningún asset) que los niveles ya existentes de `001`-`017` siguen funcionando en batalla sin errores en consola, sin ninguna recompensa ni selección de objeto de batalla (SC-004, FR-011).

## Resultado esperado

- Los 11 pasos anteriores se completan sin errores en la consola de Unity.
- Los tests EditMode y PlayMode nuevos de esta feature pasan en verde junto con la suite completa heredada de `001`-`017`.
- Ningún `.asset` de nivel/unidad existente queda modificado en disco al finalizar la validación manual.
