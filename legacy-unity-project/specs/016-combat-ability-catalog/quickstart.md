# Quickstart: Ampliación del Catálogo de Habilidades de Combate

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- Feature 008 (`008-classification-trait-abilities`) implementada y en verde — esta feature extiende `AbilityEffectType`, `TraitTargetingAbility`, `NeutralAbility`, `UnitDefinition` y `UnitRuntime` ya definidos ahí, no los reemplaza (ver data-model.md § Relación con entidades existentes).
- Los assets `Unit_Arquero.asset`, `Unit_Escudero.asset`, `Unit_Espadachin.asset`, `Unit_Lancero.asset`, `Unit_Mago.asset` y `Unit_EnemyGrunt.asset` presentes tal como los dejaron 001/007/008.

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar `StrongAgainstModifierMatchingTests` (misma tabla de verdad que `TraitTargetingAbilityMatchingTests` de 008, aplicada a esta clase — cubre SC-004).
- Debe incluir y pasar `ResistanceTests` (`Reduce()` reduce solo cuando el `effectType` coincide, clamp a `0`, no-op cuando no coincide — cubre SC-005).
- Debe incluir y pasar `UnitDefinitionAbilityCatalogDefaultsTests` (una `UnitDefinition` sin `m_StrongAgainstModifiers`/`m_Resistances` asignados expone arrays vacíos; una `TraitTargetingAbility`/`NeutralAbility` sin `m_Magnitude` asignado expone `0f` — FR-010; un `StrongAgainstModifier` recién creado sin tocar sus multiplicadores expone `1f` en ambos, no `0f` — corrección de F3, `/speckit.analyze`).
- Debe seguir pasando `TraitTargetingAbilityMatchingTests`/`ImmunityTests`/`UnitDefinitionClassificationDefaultsTests` (008) sin modificación.

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar `CombatAbilityCatalogBattlePlayModeTests`: US1 (Debilitar reduce y restaura daño, no acumula por debajo del mínimo), US2 (Congelar detiene movimiento/ataque, inmunidad lo bloquea, expira con normalidad), US3 (Ralentizar reduce velocidad, Congelar prevalece si coinciden), US4 (Fuerte Contra infligido/recibido, sin bonificación fuera de rasgo), US5 (Resistencia reduce duración sin bloquear, distinta de Inmunidad) — ver tablas completas en [contracts/ability-effect-catalog.md](./contracts/ability-effect-catalog.md), [contracts/strong-against-combat.md](./contracts/strong-against-combat.md) y [contracts/unit-runtime-ability-behavior-extension.md](./contracts/unit-runtime-ability-behavior-extension.md), incluido al menos un caso `Team.Enemy` por historia para simetría.
- Debe seguir pasando `ClassificationAbilityBattlePlayModeTests` (008) y `AttackTypeBattlePlayModeTests` (007) sin modificación — esta feature no cambia cómo se seleccionan los objetivos, solo cómo se calcula/aplica el daño y qué efectos existen.

## Validación manual (escenario end-to-end)

1. Abrir `Chapter1_Battle.unity` en el Editor.
2. Seleccionar `Unit_Mago.asset` y, **sin guardar el cambio de forma permanente**, añadir una `TraitTargetingAbility` con `Effect Type = Weaken`, `Duration Seconds = 3`, `Magnitude = 0.5`, `Target Classification Types = [Red]` (o el `ClassificationType` que tenga `Unit_EnemyGrunt.asset`).
3. Entrar en Play Mode, desplegar `Unit_Mago` y esperar a que impacte al enemigo. Confirmar en el Inspector de la instancia `UnitRuntime` del enemigo que `IsWeakened = true` y que su siguiente ataque inflige aproximadamente la mitad de su daño base; esperar a que expire y confirmar que vuelve a su daño normal (Historia 1).
4. Cambiar la habilidad a `Effect Type = Freeze`, `Duration Seconds = 2`. Repetir el ataque y confirmar que el enemigo no cambia de posición ni ataca durante ~2 segundos, retomando su comportamiento normal después (Historia 2).
5. Añadir en `Unit_EnemyGrunt.asset` una entrada en "Immunities" con `Effect Type = Freeze` y repetir el paso 4: confirmar que el enemigo **no** queda congelado (Historia 2, Escenario 3).
6. Quitar la inmunidad, cambiar la habilidad de `Unit_Mago.asset` a `Effect Type = Slow`, `Magnitude = 0.5`. Confirmar que el enemigo tarda visiblemente más en cruzar el carril mientras el efecto está activo (Historia 3). Repetir con `Freeze` y `Slow` aplicados a la vez (dos habilidades en el mismo asset) y confirmar que el enemigo permanece inmóvil hasta que expira `Freeze`, sin comportamiento errático (Historia 3, Escenario 2).
7. En `Unit_Mago.asset`, añadir un `Strong Against Modifier` con `Target Classification Types = [Red]`, `Damage Dealt Multiplier = 1.5`, `Damage Received Multiplier = 0.5`. Enfrentarlo contra un enemigo `Red` y confirmar que inflige más daño por golpe que su valor base; cambiar el enemigo a otro rasgo y confirmar que el daño vuelve al valor base (Historia 4, Escenarios 1-2). Configurar también un `Strong Against Modifier` equivalente en `Unit_EnemyGrunt.asset` apuntando a la clasificación de `Unit_Mago` y confirmar que `Unit_Mago` recibe menos daño de ese enemigo que de uno sin el modificador (Historia 4, Escenario 3).
8. Añadir en `Unit_EnemyGrunt.asset` una `Resistance` con `Effect Type = Freeze`, `Reduction Factor = 0.5`. Aplicar `Freeze` con `Duration Seconds = 4` desde `Unit_Mago` y confirmar que el enemigo queda congelado solo ~2 segundos, no 4 (Historia 5, Escenario 1). Confirmar que una `Immunity` a `Freeze` en el mismo asset (en vez de `Resistance`) sigue bloqueando el efecto por completo, sin relación con el resultado del paso anterior (Historia 5, Escenario 2).
9. Confirmar (sin modificar ningún asset) que las 5 unidades del jugador y `Unit_EnemyGrunt` siguen funcionando en batalla sin errores en consola con sus valores por defecto (sin magnitud, sin modificadores, sin resistencias) — repetir el flujo estándar de validación de 001/007/008 (SC-006).
10. **Validación de F2 (reciclaje de pool)**: con la habilidad `Freeze` de `Unit_Mago.asset` del paso 4 todavía activa, dejar que el enemigo objetivo sea destruido (reducir su HP a 0 con daño adicional) mientras `IsFrozen = true` en su `UnitRuntime`. Desplegar una unidad enemiga nueva (mismo `Unit_EnemyGrunt.asset`, sin `Freeze` activo esta vez) y confirmar en el Inspector que la nueva instancia **no** nace con `IsFrozen = true` — si la instancia se recicló del pool y el bug de F2 no está corregido, esto fallaría.
11. Al terminar, verificar con `git status` que ningún `.asset` de unidad existente quedó modificado en disco — esta feature no reautora permanentemente ninguna unidad existente.

## Resultado esperado

- Los 11 pasos anteriores se completan sin errores en la consola de Unity.
- Los tests de EditMode (`StrongAgainstModifierMatchingTests`, `ResistanceTests`, `UnitDefinitionAbilityCatalogDefaultsTests`) y de PlayMode (`CombatAbilityCatalogBattlePlayModeTests`) pasan en verde junto con la suite completa heredada de 001-014.
- Ningún `.asset` de unidad existente queda modificado en disco al finalizar la validación manual.
