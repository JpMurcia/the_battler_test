# Quickstart: Sistema de Rango de Usuario

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- `005-player-dashboard` y `018-battle-items` implementadas y en verde — esta feature reutiliza `PlayerCharacterLevelCalculator`/`PlayerBaseFlowController` (005) y `BattleItemStack`/`battleItemInventory` (018) sin modificarlos.

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar `UserRankControllerTests`: `CurrentRank` coincide exactamente con `PlayerCharacterLevelCalculator.Calculate` sobre el mismo `unitProgress` (FR-001); `TryClaim` rechaza un umbral no alcanzado (FR-005), un umbral ya reclamado (FR-006), y un `thresholdId` desconocido, sin ninguna escritura en esos tres casos; un reclamo válido añade exactamente la recompensa configurada al inventario y marca el umbral como reclamado de forma permanente (FR-007); `Thresholds` refleja `Reached`/`Claimed` correctos para una combinación de umbrales alcanzados/no alcanzados/reclamados; un catálogo `null` produce una lista de umbrales vacía sin error (FR-010).

No se requiere un test PlayMode dedicado — esta feature no introduce ningún comportamiento nuevo dentro de una batalla (a diferencia de `018`/`019`).

## Validación manual (escenario end-to-end)

1. Abrir `PlayerBase.unity` en el Editor y entrar en Play Mode con un guardado de progreso conocido (nivel de personaje ya calculado).
2. Confirmar que el Rango de Usuario mostrado coincide exactamente con la suma de niveles de las unidades poseídas, igual al "nivel de personaje" ya mostrado en el dashboard (Historia 1, Escenario 1).
3. Con un umbral configurado por debajo del Rango de Usuario actual y sin reclamar, confirmar que aparece marcado como reclamable, y reclamarlo: confirmar que el objeto de batalla configurado se añade al inventario del jugador (Historia 2, Escenario 1).
4. Intentar reclamar ese mismo umbral de nuevo: confirmar que el sistema no lo permite y que el inventario no cambia una segunda vez (Historia 2, Escenario 2).
5. Con un umbral configurado por encima del Rango de Usuario actual, intentar reclamarlo: confirmar que el sistema no lo permite (Historia 2, Escenario 3).
6. Mejorar varias unidades hasta superar dos o más umbrales sin reclamar ninguno, y reclamarlos en orden inverso (el de mayor rango primero): confirmar que ambos se reclaman correctamente sin importar el orden (Historia 2, Escenario 4).
7. Con un guardado nuevo, sin ninguna unidad mejorada, confirmar que la pantalla de Rango de Usuario se muestra sin error, con el rango base y ningún umbral reclamable (US1 Escenario 2, FR-010).
8. Cerrar y reabrir el juego tras reclamar al menos un umbral: confirmar que sigue marcado como reclamado (FR-007).

## Resultado esperado

- Los 8 pasos anteriores se completan sin errores en la consola de Unity.
- Los tests EditMode nuevos de esta feature pasan en verde junto con la suite completa heredada de `001`-`019`.
- Ningún umbral ya reclamado vuelve a otorgar su recompensa, y el Rango de Usuario mostrado siempre coincide con el "nivel de personaje" ya calculado por `005-player-dashboard`.
