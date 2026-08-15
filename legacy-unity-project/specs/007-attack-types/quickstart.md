# Quickstart: Sistema de Tipos de Ataque ("Attack Types")

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- Feature 001 (`001-chapter1-vertical-slice`) implementada y en verde — esta feature extiende `UnitDefinition`, `UnitRuntime` y `LaneRegistry` ya definidos ahí, no los reemplaza.
- Los assets `Unit_Arquero.asset`, `Unit_Escudero.asset`, `Unit_Espadachin.asset`, `Unit_Lancero.asset`, `Unit_Mago.asset` (`Assets/ScriptableObjects/Battler/Chapter1/Units/Player/`) y `Unit_EnemyGrunt.asset` (`Assets/ScriptableObjects/Battler/Chapter1/Units/Enemy/`) presentes tal como los dejó 001.

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar `LaneRegistryTargetingTests` (`FindFarthestTarget`: sin objetivo, un objetivo, varios objetivos, objetivo en el límite de rango, exclusión por equipo/destruido; `FindAllTargetsInRange`: mismos casos, verificando que el buffer recibido contiene exactamente los ocupantes esperados) y `UnitDefinitionAttackTypeTests` (una instancia sin `m_AttackType` asignado expone `AttackType == AttackType.SingleTarget`).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar `AttackTypeBattlePlayModeTests`: US1 (una unidad de Área daña a todos los enemigos agrupados en rango en el mismo ataque), US2 (una unidad de Ataque Único daña exactamente a uno y reasigna objetivo al destruirse el actual), US3 (una unidad de Larga Distancia, con enemigos escalonados, daña a uno más allá del más cercano), US4 (los tres escenarios anteriores repetidos con `Team.Enemy` atacando unidades/base del jugador, con el mismo resultado).

## Validación manual (escenario end-to-end)

1. Abrir `Chapter1_Battle.unity` en el Editor.
2. Seleccionar `Unit_Mago.asset` (`Assets/ScriptableObjects/Battler/Chapter1/Units/Player/`) y, **sin guardar el cambio de forma permanente** (o revirtiéndolo al terminar el paso 4), cambiar su campo "Attack Type" en el Inspector de "Single Target" a "Area".
3. Entrar en Play Mode, esperar a que la oleada enemiga agrupe 2 o más enemigos dentro del rango de `Unit_Mago`, desplegarla, y confirmar que **todos** los enemigos agrupados pierden vida en el mismo ciclo de ataque (Historia 1, Escenario 1) — inspeccionable en el Inspector de cada instancia de `UnitRuntime` enemiga en Play Mode (`Current Health` decreciendo simultáneamente) o vía logs temporales.
4. Repetir el paso 3 con un único enemigo dentro de rango en el momento del ataque: confirmar que ese único enemigo recibe daño con normalidad (Historia 1, Escenario 2).
5. Cambiar `Unit_Mago.asset` a "Long Distance" (revirtiendo el cambio del paso 2) y repetir en una batalla con enemigos escalonados en el carril: confirmar que el daño llega a un enemigo más allá del inmediatamente más cercano, no solo al adyacente (Historia 3, Escenario 1).
6. Revertir `Unit_Mago.asset` a su estado original ("Single Target", valor por defecto) sin guardar cambios permanentes. Confirmar, con varios enemigos agrupados en rango, que solo uno recibe daño por ataque (Historia 2, Escenario 1); dejar que ese objetivo sea destruido y confirmar que el siguiente ataque se dirige a otro enemigo en rango, sin afectar a más de uno (Historia 2, Escenario 2).
7. Confirmar (sin modificar ningún asset) que las 5 unidades del jugador y `Unit_EnemyGrunt` siguen funcionando en batalla sin errores en consola con su valor por defecto "Single Target" (SC-004) — repetir el flujo estándar de validación de 001 (empezar batalla, desplegar, resolver Victoria/Derrota).
8. Cambiar temporalmente `Unit_EnemyGrunt.asset` a "Area", agrupar dos o más unidades del jugador dentro de su rango durante una batalla, y confirmar que todas reciben daño en el mismo ataque del enemigo — mismo comportamiento que en el paso 3 pero con los equipos invertidos (Historia 4, Escenario 1). Revertir el cambio al terminar.
9. Confirmar que cada cambio de tipo de ataque realizado en los pasos 2/5/8 se reflejó en la siguiente entrada a Play Mode sin necesidad de recompilar el proyecto (SC-005) — ya verificado implícitamente en esos pasos si no fue necesario cerrar/reabrir el Editor entre cada uno.
10. Al terminar, verificar con `git status` (o el estado de "Modificado" en el Editor) que ningún `.asset` de `Unit_Arquero`, `Unit_Escudero`, `Unit_Espadachin`, `Unit_Lancero`, `Unit_Mago` o `Unit_EnemyGrunt` quedó con un `AttackType` distinto de `Single Target` guardado en disco — esta feature no reautora permanentemente ninguna unidad existente (ver spec.md Assumptions); la reasignación real de tipos de ataque por unidad es contenido de diseño posterior, fuera de este alcance.

## Resultado esperado

- Los 10 pasos anteriores se completan sin errores en la consola de Unity.
- Los 4 tests de EditMode y el test de PlayMode de esta feature pasan en verde junto con la suite completa heredada de 001-003.
- Ningún `.asset` de unidad existente queda modificado en disco al finalizar la validación manual — las 5 unidades del jugador y el enemigo de 001 siguen declarando `AttackType.SingleTarget` (por defecto), consistente con [data-model.md](./data-model.md).
