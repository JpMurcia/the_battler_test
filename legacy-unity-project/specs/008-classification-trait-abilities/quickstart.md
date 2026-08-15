# Quickstart: Clasificación de Unidades/Enemigos y Habilidades Avanzadas (Trait-Targeting, Neutral, Immunities)

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- Feature 001 (`001-chapter1-vertical-slice`) y 007 (`007-attack-types`) implementadas y en verde — esta feature extiende `UnitDefinition` y `UnitRuntime` ya definidos ahí, no los reemplaza (ver data-model.md § Relación con entidades existentes).
- Los assets `Unit_Arquero.asset`, `Unit_Escudero.asset`, `Unit_Espadachin.asset`, `Unit_Lancero.asset`, `Unit_Mago.asset` (`Assets/ScriptableObjects/Battler/Chapter1/Units/Player/`) y `Unit_EnemyGrunt.asset` (`Assets/ScriptableObjects/Battler/Chapter1/Units/Enemy/`) presentes tal como los dejaron 001/007.

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar `TraitTargetingAbilityMatchingTests` (las 4 filas de la tabla de verdad de [contracts/trait-targeting-matching.md](./contracts/trait-targeting-matching.md), más los casos de lista parcial e inclusión vacía — cubre SC-001 y SC-003 de forma determinista, sin motor).
- Debe incluir y pasar `ImmunityTests` (`Blocks(effectType)` coincide solo con el `AbilityEffectType` exacto declarado).
- Debe incluir y pasar `UnitDefinitionClassificationDefaultsTests` (una instancia sin `m_ClassificationType`/`m_SpecialClassificationType`/`m_TraitTargetingAbilities`/`m_NeutralAbilities`/`m_Immunities` asignados expone `ClassificationType.Traitless`, `SpecialClassificationType.None` y arrays vacíos — FR-010).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar `ClassificationAbilityBattlePlayModeTests`: US2 (coincidencia/no coincidencia de trait-targeting), US3 (neutral siempre aplica), US4 (tipo especial excluido de "contra todos" salvo inclusión explícita), US5 (inmunidad bloquea el efecto incluido Curse; Curse deshabilita habilidades propias mientras está activo y se recuperan al expirar) — ver tabla completa en [contracts/unit-runtime-ability-behavior.md](./contracts/unit-runtime-ability-behavior.md), incluido al menos un caso con `Team.Enemy` para simetría.
- Debe seguir pasando `AttackTypeBattlePlayModeTests` (007) sin modificación — esta feature no cambia la selección de objetivos ni el conteo de objetivos dañados por `AttackType`, solo añade una evaluación posterior sobre cada objetivo ya dañado.

## Validación manual (escenario end-to-end)

1. Abrir `Chapter1_Battle.unity` en el Editor.
2. Seleccionar `Unit_Mago.asset` y, **sin guardar el cambio de forma permanente**, asignar en el Inspector: "Classification Type" = `Floating`, y una entrada en "Trait Targeting Abilities" con `Effect Type = Curse`, `Duration Seconds = 3`, `Target Classification Types = [Alien]`.
3. Entrar en Play Mode, desplegar `Unit_Mago` y esperar a que ataque a un enemigo de tipo `Alien` (puede requerir editar temporalmente `Unit_EnemyGrunt.asset` → "Classification Type" = `Alien` para este paso). Confirmar en el Inspector de la instancia `UnitRuntime` del enemigo que queda `IsCursed = true` tras el ataque (Historia 2, Escenario 1).
4. Revertir `Unit_EnemyGrunt.asset` a un `ClassificationType` distinto de `Alien` (p. ej. `Red`) y repetir el paso 3: confirmar que `IsCursed` permanece `false` tras el ataque de `Unit_Mago` — la habilidad no coincide (Historia 2, Escenario 2).
5. Cambiar la habilidad de `Unit_Mago.asset` a una `NeutralAbility` (`Effect Type = Curse`, `Duration Seconds = 3`) en vez de trait-targeting, y repetir contra enemigos de dos `ClassificationType`/`SpecialClassificationType` distintos (uno con tipo especial, p. ej. `Metal`, y otro sin): confirmar que ambos quedan `IsCursed = true` (Historia 3, Escenario 1).
6. Configurar en `Unit_Mago.asset` una `TraitTargetingAbility` con `Target Classification Types` = los 8 valores de `ClassificationType` (equivalente a "contra todos los tipos estándar") y `Included Special Types` vacío. Enfrentarla contra un `Unit_EnemyGrunt.asset` con "Special Classification Type" = `Metal`: confirmar que **no** queda `IsCursed` (Historia 4, Escenario 1). Añadir `Metal` a `Included Special Types` de la misma habilidad y repetir: confirmar que ahora **sí** queda `IsCursed` (Historia 4, Escenario 2).
7. Añadir una entrada en "Immunities" de `Unit_EnemyGrunt.asset` con `Effect Type = Curse`. Repetir el paso 6 (con `Metal` ya incluido): confirmar que el enemigo inmune **no** queda `IsCursed` pese a que la habilidad coincide (Historia 5, Escenario 1).
8. Con el enemigo `IsCursed = true` de un paso anterior y configurado además con su propia `TraitTargetingAbility`/`NeutralAbility` de prueba, confirmar en el Inspector de su `UnitRuntime` que, mientras `IsCursed` es `true`, sus propias habilidades no dejan `IsCursed`/efecto alguno en la unidad del jugador que reciba su ataque (Historia 5, Escenario 2); esperar a que `m_CurseRemainingSeconds` llegue a `0` y confirmar que sus habilidades vuelven a aplicarse con normalidad en el siguiente ataque (Historia 5, Escenario 3).
9. Confirmar (sin modificar ningún asset) que las 5 unidades del jugador y `Unit_EnemyGrunt` siguen funcionando en batalla sin errores en consola con sus valores por defecto ("Sin rasgo"/sin tipo especial/sin habilidades) — repetir el flujo estándar de validación de 001/007 (empezar batalla, desplegar, resolver Victoria/Derrota) (SC-006).
10. Al terminar, verificar con `git status` (o el estado de "Modificado" en el Editor) que ningún `.asset` de unidad existente quedó con clasificación/habilidades distintas de sus valores por defecto guardadas en disco — esta feature no reautora permanentemente ninguna unidad existente; la reasignación real de clasificación/habilidades por unidad es contenido de diseño posterior, fuera de este alcance.

## Resultado esperado

- Los 10 pasos anteriores se completan sin errores en la consola de Unity.
- Los tests de EditMode (`TraitTargetingAbilityMatchingTests`, `ImmunityTests`, `UnitDefinitionClassificationDefaultsTests`) y de PlayMode (`ClassificationAbilityBattlePlayModeTests`) pasan en verde junto con la suite completa heredada de 001-007.
- Ningún `.asset` de unidad existente queda modificado en disco al finalizar la validación manual — las 5 unidades del jugador y el enemigo de 001/007 siguen declarando `ClassificationType.Traitless`, `SpecialClassificationType.None` y arrays vacíos de habilidades/inmunidades (por defecto), consistente con [data-model.md](./data-model.md).
