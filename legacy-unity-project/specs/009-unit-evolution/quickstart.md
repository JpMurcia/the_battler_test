# Quickstart: Sistema de Evolución de Unidad

## Prerrequisitos

- Unity 6000.3.20f1 con el proyecto `the_battler_test` abierto (o accesible en modo batch).
- Feature 001 (`001-chapter1-vertical-slice`) y 005 (`005-player-dashboard`) implementadas y en verde — esta feature extiende `UnitDefinition` y `UnitProgress`/`IPlayerProgressStore` ya definidos ahí, no los reemplaza (ver data-model.md § Relación con entidades existentes).
- Los assets de unidad del jugador (`Assets/ScriptableObjects/Battler/Chapter1/Units/Player/`) presentes tal como los dejaron 001/007/008.
- Pantalla de mejora de unidades (`005-player-dashboard`) accesible, con al menos una unidad con experiencia suficiente para llegar a nivel 10+.

> **Nota**: esta feature tiene una bandera de gobernanza pendiente sobre el Principio III (ver plan.md, Constitution Check) — la validación de este quickstart es igualmente ejecutable para verificar el diseño, pero no debe interpretarse como habilitación para `/speckit.tasks`/`/speckit.implement` hasta que esa decisión se tome.

## Validación automatizada

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform EditMode -testResults "<ruta>\editmode-results.xml" -logFile "<ruta>\editmode.log" -quit
```

- Debe incluir y pasar `UnitEvolutionStageDefaultsTests` (una `UnitDefinition` sin `m_EvolutionStages` asignado expone un array vacío; `TryGetStageData` devuelve `false` para las 3 formas — FR-011). Cubre SC-004 a nivel de defaults, sin persistencia.
- Debe incluir y pasar `UnitDefinitionEffectiveCombatProfileTests` (las 6 filas de la tabla de comportamiento de [contracts/unit-definition-evolution-data.md](./contracts/unit-definition-evolution-data.md): `FormaBase`, `SegundaForma`/`FormaVerdadera` con y sin datos autorados, valor fuera de rango — FR-011, FR-013).
- Debe incluir y pasar `UnitEvolutionStageResolverTests` (progreso ausente, corrupto, y valor fuera de rango → `FormaBase`; progreso válido → se respeta — FR-013).
- Debe incluir y pasar `UnitEvolutionControllerTests` (secuencialidad —evolucionar directo de `FormaBase` a `FormaVerdadera` falla incluso con ambos niveles cumplidos, FR-007—, nivel insuficiente, ítem insuficiente, evolución exitosa consume el ítem y persiste, cualquier rechazo deja el `UnitProgress` intacto — FR-005, SC-002).

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.20f1\Editor\Unity.exe" -batchmode -nographics -silent-crashes -projectPath "C:\Users\Usuario\Documents\GitHub\IA GAME\the_battler_test" -runTests -testPlatform PlayMode -testResults "<ruta>\playmode-results.xml" -logFile "<ruta>\playmode.log" -quit
```

- Debe incluir y pasar `UnitEvolutionBattleIntegrationPlayModeTests`: unidad desplegada en `SegundaForma`/`FormaVerdadera` muestra el `Animator.runtimeAnimatorController`/daño de esa forma, no de la Forma Base (FR-012, SC-005); las tres formas de una misma unidad muestran animaciones de idle/ataque distintas entre sí (Historia 4, SC-005); un enemigo (`EnemyWaveSpawner`) sigue desplegándose en `FormaBase` sin cambio de comportamiento.
- Debe seguir pasando la suite heredada de 001-008 (`AttackTypeBattlePlayModeTests`, `ClassificationAbilityBattlePlayModeTests`, `TeamFormationBattleIntegrationPlayModeTests`) sin modificación — esta feature no cambia selección de objetivos, coste/cooldown de despliegue, ni el filtro de equipo activo, solo qué perfil de combate/animación usa cada `UnitRuntime` ya desplegado.

## Validación manual (escenario end-to-end)

1. Abrir el proyecto en el Editor y, sobre una copia de trabajo de `Unit_Mago.asset` (o la unidad de prueba elegida), **sin guardar el cambio de forma permanente**, autorar en el Inspector una entrada en "Evolution Stages" (índice 0, Segunda Forma): `Required Level = 10`, `Requires Evolution Item = false`, animaciones de idle/ataque distintas de las de Forma Base, una variante visual distinta, y `Damage`/`Max Health` mayores que los de Forma Base.
2. Añadir una segunda entrada (índice 1, Forma Verdadera): `Required Level = 20`, `Requires Evolution Item = true`, animaciones/variante propias (distintas de las dos formas anteriores), y `Damage`/`Max Health` que dupliquen los de Forma Base (US3).
3. Desde la pantalla de mejora de unidades (005), subir la unidad de prueba a nivel 9 (por debajo del requisito de Segunda Forma) e intentar evolucionarla: confirmar que el sistema **no** permite la evolución (Historia 1, Escenario 2; SC-002).
4. Subir la unidad a nivel 10 e intentar evolucionarla: confirmar que pasa a Segunda Forma de inmediato, con su nueva apariencia y estadísticas reflejadas en la pantalla de mejora (Historia 1, Escenario 1; SC-001).
5. Sin ítem de evolución disponible, subir la unidad a nivel 20 e intentar evolucionarla a Forma Verdadera: confirmar que el sistema **no** permite la evolución hasta que el ítem esté disponible (Historia 2, Escenario 2).
6. Con la unidad en nivel 20 y el ítem de evolución disponible (asignado directamente al `UnitProgress` de prueba para este paso, dado que la obtención real de ítems vía misiones es de 006), evolucionarla a Forma Verdadera: confirmar el cambio de forma y que el ítem se consume (Historia 2, Escenario 1; contador decrementado en exactamente 1).
7. Repetir el paso 6 con una unidad distinta que tenga el ítem disponible pero **no** haya alcanzado nivel 20: confirmar que el sistema bloquea la evolución hasta alcanzar ese nivel, sin consumir el ítem (Historia 2, Escenario 3; SC-002).
8. Con una unidad que alcanzó nivel 25 (por encima de ambos requisitos) pero que nunca evolucionó a Segunda Forma, intentar evolucionarla directamente: confirmar que el sistema no ofrece/permite saltar directo a Forma Verdadera — debe pasar primero por Segunda Forma (Edge Case de spec.md, FR-007).
9. Con la unidad ya en Forma Verdadera, comparar sus estadísticas de combate (daño, vida máxima) contra las de su Forma Base: confirmar una mejora significativa acorde a los datos autorados en el paso 2 (Historia 3, Escenario 1; SC-003).
10. Entrar en Play Mode, iniciar una batalla, y desplegar la unidad de prueba ya evolucionada a Forma Verdadera: confirmar en el carril de batalla que reproduce la animación de idle/ataque de esa forma (distinta a las otras dos) y que su daño/vida en combate corresponden a los valores de Forma Verdadera, no a los de Forma Base (Historia 4; FR-012; SC-005).
11. Cerrar y reabrir el juego (o recargar `player-progress.json` desde disco): confirmar que la forma de evolución y el contador de ítems de la unidad de prueba se mantienen intactos (SC-004).
12. Confirmar (sin modificar ningún asset de forma permanente) que el resto de unidades del jugador y el enemigo de 001/007/008, sin datos de evolución autorados, siguen funcionando en batalla sin errores en consola, permaneciendo únicamente en Forma Base (FR-011) — repetir el flujo estándar de validación de 001 (empezar batalla, desplegar, resolver Victoria/Derrota).
13. Al terminar, verificar con `git status` (o el estado de "Modificado" en el Editor) que ningún `.asset` de unidad existente quedó con datos de evolución autorados de forma permanente en disco, y que `player-progress.json` de la instalación de prueba no queda con datos de evolución fuera de este escenario controlado.

## Resultado esperado

- Los 13 pasos anteriores se completan sin errores en la consola de Unity.
- Los tests de EditMode (`UnitEvolutionStageDefaultsTests`, `UnitDefinitionEffectiveCombatProfileTests`, `UnitEvolutionStageResolverTests`, `UnitEvolutionControllerTests`) y de PlayMode (`UnitEvolutionBattleIntegrationPlayModeTests`) pasan en verde junto con la suite completa heredada de 001-008.
- Ningún `.asset` de unidad existente queda modificado en disco al finalizar la validación manual — las unidades del jugador y el enemigo de 001/007/008 siguen sin datos de evolución autorados (`evolutionStages` vacío) por defecto, consistente con [data-model.md](./data-model.md).
- **Recordatorio de gobernanza**: completar este quickstart en verde no resuelve por sí solo la bandera de Principio III documentada en plan.md — esa decisión sigue pendiente de `/speckit.constitution` independientemente del resultado de esta validación.
