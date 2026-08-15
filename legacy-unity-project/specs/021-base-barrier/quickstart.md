# Quickstart: Barrera de Base y Jefes Vinculados

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- `013-empire-of-cats-saga` implementada y en verde — esta feature extiende `SagaArcDefinition`/`ChapterDefinition`/`EnemyWaveDefinition`/`ChapterBannerDefinition` y autora "The Face" en un `SagaArcDefinition` **dedicado nuevo** (`TheFaceArc`) con su propio banner (`Banner_TheFace`) dentro de la región "Imperio de los Gatos" ya existente — `Chapter1Arc`/"Corea"/"Mongolia" no se modifican (research.md §6).

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar las extensiones nuevas de `BaseHealthStateTests`: `ApplyDamage` es un no-op total mientras `IsBarrierActive` (FR-002); `ApplyDamage` vuelve a reducir vida normalmente tras `RemoveBarrier()` (FR-004); `ActivateBarrier()`/`RemoveBarrier()` son idempotentes (una segunda llamada no vuelve a disparar `BarrierStateChanged`).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar `BossBarrierBattlePlayModeTests` (nuevo): en un nivel con una oleada marcada `isLinkedBoss`, atacar la base enemiga antes de derrotar al jefe deja su vida sin cambios (US1 Escenario 1, SC-001); derrotar únicamente a los enemigos regulares de la oleada no retira la barrera (US2 Escenario 3); derrotar específicamente al jefe vinculado retira la barrera en el mismo frame y los ataques siguientes sí reducen la vida de la base hasta poder ganar el nivel (US2 Escenarios 1-2, SC-002); un nivel sin ninguna entrada `isLinkedBoss` se comporta exactamente igual que antes de esta feature (US1 Escenario 2, SC-003); reintentar el nivel tras una derrota reactiva la barrera desde cero (Edge Case).

## Validación manual (escenario end-to-end)

1. Abrir `AdventureMap.unity` en el Editor, entrar en Play Mode y navegar hasta la región "Imperio de los Gatos": confirmar que `Banner_TheFace` es visible y seleccionable junto a "Corea"/"Mongolia" (no bloqueado), y seleccionarlo para cargar `TheFace_Battle.unity` — sin esto, "The Face" quedaría autorado pero inalcanzable por un jugador real (research.md §6).
2. Con la batalla ya cargada (vía el paso 1, o abriendo `TheFace_Battle.unity` directamente en el Editor y entrando en Play Mode), desplegar unidades y dejar que alcancen la base enemiga sin haber derrotado a "The Face": confirmar que la barra de vida de la base enemiga no baja, y que el indicador de barrera (`BaseHealthBarView.m_BarrierIndicator`) está visible.
3. Concentrar el daño en "The Face" hasta derrotarlo: confirmar que el indicador de barrera desaparece de inmediato, en el mismo instante en que "The Face" muere (sin esperar ningún ataque adicional a la base).
4. Seguir atacando la base enemiga: confirmar que ahora sí pierde vida con normalidad y que el nivel puede ganarse.
5. Provocar una derrota (dejar que la base del jugador sea destruida) y reintentar (`RetryBattle`): confirmar que la barrera vuelve a estar activa y el indicador visible desde el inicio del reintento, sin importar que "The Face" ya hubiera muerto en el intento anterior.
6. Abrir `Corea_Battle.unity` o `Mongolia_Battle.unity` y jugar un nivel completo: confirmar que la base enemiga se comporta exactamente igual que antes de esta feature (sin barrera, sin indicador visible) — regresión (SC-003).
7. Desde `AdventureMap.unity`, confirmar además que "Corea" y "Mongolia" siguen exactamente como antes (mismo desbloqueo secuencial, mismo `DifficultyRank` relativo) — `Banner_TheFace` es aditivo, no reordena ni reemplaza ningún banner existente de esa región.

## Resultado esperado

- Los 7 pasos anteriores se completan sin errores en la consola de Unity.
- Los tests EditMode y PlayMode nuevos de esta feature pasan en verde junto con la suite completa heredada de `001`-`020`.
- Ninguna base enemiga de un nivel sin jefe vinculado cambia su comportamiento observable; en "The Face", la base enemiga es invulnerable de principio a fin hasta el instante exacto en que el jefe muere, sin ninguna ventana intermedia.
- "The Face" es alcanzable por un jugador real desde el Mapa de Aventuras, no solo abriendo la escena directamente en el Editor.
