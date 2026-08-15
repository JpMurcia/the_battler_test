# Quickstart: Extensión de Tipos de Ataque — Multi-Golpe y Crítico

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- `007-attack-types` y `016-combat-ability-catalog` implementadas y en verde — esta feature extiende `AttackType`, `UnitDefinition` y `UnitRuntime.ComputeOutgoingDamage()` ya definidos ahí, no los reemplaza.
- Los assets de unidad/enemigo existentes de `001`-`016` presentes sin cambios.

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar los tests EditMode nuevos: una `UnitDefinition` sin `m_MultiHitCount`/`m_CriticalChance` asignados expone `MultiHitCount == 1` y `CriticalChance == 0f` (FR-009).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar el PlayMode test nuevo de esta feature: US1 (una unidad Multi-Golpe con N golpes configurados inflige exactamente N impactos independientes en una secuencia sin interrupción), US2 (destruir/sacar de rango al objetivo a mitad de secuencia descarta los golpes restantes sin aplicarlos a otro objetivo; la siguiente secuencia arranca completa), US3 Escenarios 1-2 (Crítico al 100%/0% produce daño doble/normal de forma consistente), US3 Escenario 3 (con `UnityEngine.Random.InitState` sembrado y `CriticalChance = 0.5f`, entre 35 y 65 de 100 ataques observados resultan en golpe crítico, SC-004), y la verificación de simetría FR-008 (mismos escenarios anteriores repetidos con `Team.Enemy`).

## Validación manual (escenario end-to-end)

1. Abrir `Chapter1_Battle.unity` en el Editor.
2. Seleccionar `Unit_Mago.asset` (`Assets/ScriptableObjects/Battler/Chapter1/Units/Player/`) y, **sin guardar el cambio de forma permanente**, cambiar su "Attack Type" a "Multi Hit" con "Multi Hit Count" = 3.
3. Entrar en Play Mode, desplegar la unidad contra un enemigo, y confirmar en el Inspector de la instancia de `UnitRuntime` enemiga (Play Mode) que su `Current Health` baja en 3 decrementos separados durante una misma secuencia de ataque, no en un único salto (Historia 1, Escenario 1).
4. Con la misma unidad a mitad de una secuencia de Multi-Golpe, forzar la destrucción del objetivo (por ejemplo, bajando su vida a 0 desde otra unidad) y confirmar que ningún golpe adicional de esa secuencia impacta a un enemigo distinto (Historia 2, Escenario 1); confirmar que la siguiente secuencia contra el nuevo objetivo vuelve a aplicar 3 golpes completos (Historia 2, Escenario 2).
5. Revertir `Unit_Mago.asset` a "Single Target" y cambiar `Unit_Escudero.asset` a "Critical" con "Critical Chance" = 1.0 (100%), sin guardar el cambio de forma permanente. Confirmar que cada ataque observado inflige visiblemente el doble de daño de su valor base (Historia 3, Escenario 1).
6. Cambiar "Critical Chance" de `Unit_Escudero.asset` a 0.0 (0%) y confirmar que ningún ataque observado en varios ciclos infligió el doble de daño (Historia 3, Escenario 2).
7. Confirmar (sin modificar ningún asset) que las unidades y enemigos existentes de `001`-`016` siguen funcionando en batalla sin errores en consola con su `AttackType` actual sin cambios (SC-005).
8. Repetir los pasos 3 y 5 con `Unit_EnemyGrunt.asset` (bando enemigo) para confirmar la simetría jugador/enemigo (FR-008).
9. Al terminar, verificar con `git status` que ningún `.asset` de unidad existente quedó modificado en disco — esta feature no reautora permanentemente ninguna unidad existente, igual que `007-attack-types` documentó para su propia validación manual.

## Resultado esperado

- Los 9 pasos anteriores se completan sin errores en la consola de Unity.
- Los tests EditMode y PlayMode nuevos de esta feature pasan en verde junto con la suite completa heredada de `001`-`016`.
- Ningún `.asset` de unidad existente queda modificado en disco al finalizar la validación manual.
