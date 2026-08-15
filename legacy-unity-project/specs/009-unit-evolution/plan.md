# Implementation Plan: Sistema de Evolución de Unidad

**Branch**: `009-unit-evolution` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-unit-evolution/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

> ✅ **Bandera de gobernanza resuelta (`/speckit.constitution` v1.1.0, 2026-07-29)**: esta feature llevaba heredada, desde `docs/roadmap-fases.md` (Fase 10) y desde spec.md (Assumptions), una nota de gobernanza pendiente sobre variantes visuales adicionales por forma de evolución y cambios de estadísticas por forma. La constitución fue enmendada explícitamente (Principio III) para cubrir mecánicas de progresión con un número acotado de etapas, cada una con su propia animación/variante/stats, sin que eso constituya una violación — ver el Constitution Check actualizado abajo. Este plan ya puede avanzar a `/speckit.tasks`/`/speckit.implement`.

## Summary

Extiende `UnitDefinition` (001, ya extendida por 007 con `AttackType` y por 008 con clasificación/habilidades) con un campo nuevo `m_EvolutionStages: UnitEvolutionStageData[]` de longitud 0 a 2 (índice 0 = Segunda Forma, índice 1 = Forma Verdadera; la Forma Base ya está representada por los campos existentes de `UnitDefinition`), cada entrada con su propio nivel requerido, animaciones de idle/ataque, variante visual y stats de combate (daño, vida máxima) — un array vacío (default) deja a la unidad únicamente en Forma Base, sin migración, mismo patrón cero-por-defecto que `AttackType`/`ClassificationType` (007/008). La forma vigente de cada unidad (`UnitEvolutionStage`, 0-2) y su contador de `EvolutionItem` se persisten como dos campos nuevos en `UnitProgress` (005), dentro del mismo `PlayerProgressSaveData`/`player-progress.json`/`IPlayerProgressStore` ya diseñado por 005 — no se crea ningún archivo de guardado paralelo. Un nuevo `UnitEvolutionController` (clase plana en `Gameplay`, mismo patrón que `UnitLevelingController` de 005) resuelve, para cada unidad, si puede evolucionar a la siguiente forma (nivel desde el mismo `UnitProgress` que ya usa 005, más el contador de ítem cuando la forma destino es Forma Verdadera) y aplica la transición desde una acción explícita del jugador en la pantalla de mejora de unidades (005) — nunca automáticamente al subir de nivel (FR-004). La secuencialidad (FR-007) se obtiene estructuralmente: `TryEvolve` solo evalúa la transición desde la forma persistida actual hacia `forma actual + 1`, nunca "la primera forma que ya cumple nivel", así que saltarse una forma es estructuralmente imposible sin lógica adicional de validación. En batalla, `UnitDefinition.GetEffectiveCombatProfile(stage)` (función pura) resuelve las animaciones/variante/daño/vida efectivos para la forma vigente, con fallback a los campos base si la forma no tiene datos autorados (FR-011/FR-013); `UnitRuntime.Initialize` gana un parámetro opcional `UnitEvolutionStage` (valor por defecto `FormaBase`, preserva compatibilidad con todos los call-sites existentes de 001/007/008, incluidos enemigos, que no evolucionan en esta feature) y usa ese perfil resuelto en vez de leer directamente los campos base de `UnitDefinition`.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que 001-008.

**Primary Dependencies**: Ninguna nueva — únicamente `UnityEngine`/`UnityEngine.UI`/`TMPro` ya referenciados por `TheBattler.Core`/`Model`/`Gameplay`/`View`. No se añade ningún paquete de Unity.

**Storage**: No se crea ningún archivo de guardado nuevo. Se extiende `player-progress.json` (005) — dos campos nuevos en `UnitProgress` (`evolutionStage`, `evolutionItemCount`), persistidos por el mismo `IPlayerProgressStore`/`LocalPlayerProgressStore` (005), con el mismo criterio de escritura atómica y lectura tolerante a corrupción ya validado por `LocalChapterProgressStore` (002)/`LocalMenuSettingsStore` (003) y ya diseñado para `LocalPlayerProgressStore` (005). No se toca `progress.json` (002) ni `menu-settings.json` (003).

**Testing**: Unity Test Framework, mismo split EditMode/PlayMode que 001-008. EditMode (NUnit puro) para las funciones/clases puras nuevas: `UnitDefinition.GetEffectiveCombatProfile`, `UnitEvolutionStageResolver.Resolve`, `UnitEvolutionController` (con un doble en memoria de `IPlayerProgressStore`, mismo criterio que `UnitLevelingControllerTests` de 005). PlayMode para integración batalla (`UnitRuntime` muestra el perfil de combate de la forma persistida al desplegarse) y para la Historia 4 (animaciones distintas por forma en el carril), siguiendo el mismo patrón que `ClassificationAbilityBattlePlayModeTests.cs` (008) y `TeamFormationBattleIntegrationPlayModeTests.cs` (005): `ScriptableObject.CreateInstance<UnitDefinition>()` + reflexión sobre campos privados, sin depender de assets `.asset` reales.

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo, se extiende la capa de asmdefs ya validada (Core→Model→Gameplay→View).

**Performance Goals**: Sin regresión sobre el objetivo de 60 fps ya fijado en 001/007/008. `GetEffectiveCombatProfile(stage)` se resuelve una única vez por unidad, dentro de `UnitRuntime.Initialize` (al desplegarse), no por frame — mismo criterio de "sin asignaciones nuevas por ciclo de Update/Attack" que 008 documentó para `ApplyAbilitiesTo`.

**Constraints**: Evolucionar es una acción explícita del jugador desde la pantalla de mejora de unidades (005), nunca un efecto secundario automático de subir de nivel (FR-004). Un intento de evolución sin nivel y/o ítem suficiente no debe alterar ni el nivel, ni la forma persistida, ni el contador de ítems (FR-005, SC-002, mismo criterio "sin efectos parciales" que `UnitLevelingController.TryLevelUp`, 005). Las evoluciones son estrictamente secuenciales, sin excepción por nivel ya alcanzado de una forma posterior (FR-007). Datos de forma/ítem corruptos o ilegibles se tratan como Forma Base sin ítems, sin bloquear ni el dashboard ni la batalla (FR-013). Unidades de 001 sin datos de evolución autorados permanecen en Forma Base indefinidamente, sin romper su funcionamiento actual (FR-011). Esta feature no introduce evolución para unidades enemigas — el roadmap y spec.md solo hablan de la unidad del jugador gestionada desde el dashboard (005); `EnemyWaveSpawner` sigue desplegando en Forma Base (valor por defecto del parámetro nuevo de `UnitRuntime.Initialize`) sin cambio de comportamiento.

**Scale/Scope**: Hasta 2 entradas de `UnitEvolutionStageData` por `UnitDefinition` (Segunda Forma, Forma Verdadera) sobre el roster actual de 5 unidades del jugador (001) — sin unidades de evolución nuevas introducidas por esta feature. `EvolutionItem` es un contador entero simple por unidad dentro de `UnitProgress`, no un sistema de inventario general (spec.md Assumptions).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — esta feature no toca diálogo pre/post-batalla ni contenido narrativo de capítulo; solo datos de unidad, progreso de jugador y lógica de combate. Sin conflicto. |
| II. Combate Automático por Despliegue | Alineación directa: la forma de evolución vigente se resuelve una única vez al desplegar la unidad (`UnitRuntime.Initialize`), antes de que el combate autónomo empiece; evolucionar en sí ocurre fuera de la batalla, desde el dashboard (FR-004). No se introduce control directo del jugador durante el combate ni se altera el bucle de recurso/coste/cooldown. |
| III. Identidad Visual Animada | **RESUELTO (`/speckit.constitution` v1.1.0).** Esta feature exige, por forma de evolución, su propia animación de idle y de ataque (FR-008), variante visual y estadísticas de combate (FR-009). El Principio III (v1.1.0) cubre explícitamente este caso: una mecánica de progresión con un número acotado y explícito de etapas por unidad puede declarar animación/variante/stats propias por etapa, satisfaciendo el principio de forma independiente por etapa, siempre que la Forma Base ya cumpla el mínimo por sí sola (idle + ataque + una variante visual) — que es exactamente el diseño de esta feature (`m_EvolutionStages` de longitud 0-2 sobre los campos base ya existentes). Sin conflicto. |
| IV. Progresión por Capítulos con Desbloqueo | N/A — no toca `ChapterDefinition` ni el desbloqueo entre capítulos; opera enteramente dentro del roster de unidades ya desbloqueadas de un capítulo existente. |
| V. Balance Dirigido por Datos | Fuerte alineación: `UnitEvolutionStageData[]` es un campo de `UnitDefinition` (ScriptableObject), editable en el Inspector sin recompilar, mismo patrón que `cost`/`damage`/`attackType` (007)/clasificación (008). Los stats por forma (daño, vida máxima) son valores absolutos autorados por unidad — no una fórmula universal de multiplicador — cumpliendo literalmente spec.md Assumptions ("el multiplicador exacto... se define por unidad en los datos... no exige una fórmula universal"). |
| VI. Simplicidad desde el MVP | **Requiere justificación explícita — ver Complexity Tracking.** Se evaluaron y rechazaron generalizaciones más amplias (`ScriptableObject` de evolución independiente por unidad, sistema de inventario general para `EvolutionItem`, fórmula de multiplicador de stats configurable) en favor del diseño mínimo que cubre exactamente los 13 FR de spec.md — documentado a continuación en vez de asumir silenciosamente que no hay complejidad añadida. |

## Project Structure

### Documentation (this feature)

```text
specs/009-unit-evolution/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── unit-definition-evolution-data.md
│   ├── unit-evolution-controller.md
│   └── battle-evolution-integration.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Core/Battler/
│   └── UnitEvolutionStage.cs                 # nuevo — enum FormaBase(=0, default)/SegundaForma(=1)/FormaVerdadera(=2)
├── Model/Battler/
│   ├── UnitDefinition.cs                     # modificado — + m_EvolutionStages: UnitEvolutionStageData[] (0-2, default vacío);
│   │                                          #   + TryGetStageData(UnitEvolutionStage, out UnitEvolutionStageData);
│   │                                          #   + GetEffectiveCombatProfile(UnitEvolutionStage) -> UnitCombatProfile (pura, con fallback a campos base)
│   ├── UnitEvolutionStageData.cs             # nuevo — [Serializable] anidada: requiredLevel, requiresEvolutionItem,
│   │                                          #   idleAnimation, attackAnimation, visualVariant, damage, maxHealth
│   ├── UnitCombatProfile.cs                  # nuevo — [Serializable]/clase plana de solo lectura: resultado de
│   │                                          #   GetEffectiveCombatProfile (idleAnimation, attackAnimation, visualVariant, damage, maxHealth)
│   └── UnitProgress.cs                       # modificado (005) — + m_EvolutionStage: UnitEvolutionStage (default FormaBase),
│                                              #   + m_EvolutionItemCount: int (default 0, >=0)
├── Gameplay/Battler/
│   ├── UnitEvolutionStageResolver.cs         # nuevo — logica pura: Resolve(unitId, UnitProgress[]) -> UnitEvolutionStage
│   │                                          #   (fallback FormaBase ante ausencia/corrupcion, FR-013)
│   ├── UnitEvolutionController.cs            # nuevo — clase plana (no MonoBehaviour), mismo patron que UnitLevelingController (005):
│   │                                          #   GetEvolutionStage(unitId), TryGetNextStageRequirement(unitId, out EvolutionRequirementInfo),
│   │                                          #   TryEvolve(unitId), evento EvolutionChanged
│   ├── UnitRuntime.cs                        # modificado — Initialize(definition, team, lanePosition, stage = UnitEvolutionStage.FormaBase);
│   │                                          #   usa definition.GetEffectiveCombatProfile(stage) en vez de leer m_Source.* directamente
│   │                                          #   para IdleAnimation/AttackAnimation/VisualVariant/Damage/MaxHealth
│   ├── UnitDeploymentController.cs           # modificado — TryDeploy resuelve la UnitEvolutionStage vigente de slot.Unit
│   │                                          #   (via resolver inyectado en Initialize) antes de instance.Initialize(...)
│   └── BattleStateManager.cs                 # modificado — SetupChapter() resuelve IPlayerProgressStore (005, mismo patron que
│                                              #   IChapterProgressStore) y construye el resolver de evolucion pasado a
│                                              #   UnitDeploymentController.Initialize(...)
│
Assets/Scripts/View/Battler/
└── UnitUpgradeUIController.cs                # modificado (005) — + boton "Evolucionar" por unidad, habilitado solo cuando
                                               # UnitEvolutionController.TryGetNextStageRequirement admite la transicion,
                                               # invoca TryEvolve(unitId) (FR-004: accion explicita, no automatica)

Assets/Tests/
├── EditMode/Battler/
│   ├── UnitEvolutionStageDefaultsTests.cs        # nuevo — UnitDefinition sin m_EvolutionStages -> solo FormaBase disponible (FR-011)
│   ├── UnitDefinitionEffectiveCombatProfileTests.cs  # nuevo — GetEffectiveCombatProfile por forma, fallback a campos base
│   ├── UnitEvolutionStageResolverTests.cs        # nuevo — progreso ausente/corrupto/valor fuera de rango -> FormaBase (FR-013)
│   └── UnitEvolutionControllerTests.cs           # nuevo — secuencialidad (FR-007), nivel insuficiente, item insuficiente,
│                                                  #   evolucion exitosa consume item y persiste, sin efectos parciales en rechazo (SC-002)
└── PlayMode/Battler/
    └── UnitEvolutionBattleIntegrationPlayModeTests.cs   # nuevo — unidad evolucionada muestra animaciones/stats de su forma
                                                          #   vigente al desplegarse (FR-012, SC-005)
```

**Structure Decision**: Se reutiliza exactamente la misma capa de asmdefs ya validada en 001-008 (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`); no se crea ningún ensamblado nuevo. `UnitEvolutionStage` va en `Core`, junto a `Team`/`BattleOutcome`/`AttackType` (007) — un enum de datos compartido sin dependencia de motor, mismo criterio que 007/008 documentaron para sus propios enums. `UnitEvolutionStageData`/`UnitCombatProfile` van en `Model`, anidadas/asociadas a `UnitDefinition`, como clases `[Serializable]` — mismo patrón que `EnemyWaveDefinition.WaveEntry` (001) y `TraitTargetingAbility`/`NeutralAbility`/`Immunity` (008), explícitamente **no** como `ScriptableObject` independiente (ver research.md y Complexity Tracking). Los dos campos nuevos de `UnitProgress` (005) siguen viviendo en `Model`, en el mismo archivo que 005 ya diseñó, sin crear un agregado de guardado paralelo. La lógica de comportamiento (`UnitEvolutionStageResolver`, `UnitEvolutionController`) va en `Gameplay`, como clases planas testables en EditMode sin `MonoBehaviour` ni escena — mismo criterio de testabilidad que `UnitLevelingController`/`TeamFormationController` (005). El único punto de integración con el ciclo de batalla es `UnitRuntime.Initialize` (parámetro opcional, compatible con todos los call-sites de 001/007/008) más una resolución mínima adicional en `UnitDeploymentController`/`BattleStateManager`, exactamente el mismo criterio de "superficie mínima de integración" que 005 ya documentó para `TeamFormationRosterFilter`. `UnitUpgradeUIController` (005, `View`) gana el único punto de entrada de UI para la acción explícita de evolucionar (FR-004) — no se crea ninguna pantalla nueva.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| ~~Principio III sin resolver: variantes visuales adicionales por forma de evolución + cambio de stats por forma~~ — **RESUELTO, ya no es una fila de Complexity Tracking activa.** | Era un requisito explícito de spec.md (FR-008, FR-009, Historia 4) heredado del roadmap (`docs/roadmap-fases.md`, Fase 10), pendiente de decisión de gobernanza. | `/speckit.constitution` v1.1.0 (2026-07-29) amplió el Principio III para cubrir explícitamente mecánicas de progresión con etapas acotadas — ver Constitution Check arriba. Esta fila se conserva tachada para trazabilidad histórica de la decisión. |
| `UnitEvolutionStageData[]` en `UnitDefinition` (hasta 2 entradas) + `UnitCombatProfile`/`GetEffectiveCombatProfile` como capa de resolución nueva sobre los campos base ya existentes | FR-001/FR-008/FR-009/FR-012 exigen hasta 3 formas con su propio conjunto de animaciones/variante/stats, y que la batalla refleje la forma vigente, no siempre la base — no hay forma de cumplir esto sin algún tipo de dato por forma y algún punto de resolución que elija cuál usar. | Un `ScriptableObject` de evolución independiente por unidad (`UnitEvolutionDefinition`) referenciando `UnitDefinition`: rechazado (research.md) — introduce dos assets a mantener sincronizados por unidad, una referencia cruzada nueva, y rompe el patrón ya establecido en 001/007/008 de "todo sobre una unidad vive en su `UnitDefinition`". Duplicar campos base completos por forma (en vez de fallback al valor base): rechazado — obligaría a reautorar animaciones/stats de Forma Base dentro de cada entrada del array, violando FR-011 (unidades de 001 sin datos de evolución deben seguir funcionando sin reautorado). |
| `EvolutionItem` modelado como `int m_EvolutionItemCount` dentro de `UnitProgress` (005), no como sistema de inventario | FR-003/FR-006 exigen que la Forma Verdadera requiera y consuma un ítem por unidad. | Un sistema de inventario general (ítems apilables, múltiples tipos, UI de inventario propia): rechazado explícitamente por spec.md Assumptions ("no se introduce aquí un sistema de inventario o ítems general") — un contador entero por unidad, en el mismo agregado de progreso que 005 ya diseñó, es la superficie mínima que FR-003/FR-006 exigen. |
| Stats por forma como valores absolutos autorados (`damage`, `maxHealth` por `UnitEvolutionStageData`), no como fórmula/multiplicador configurable | FR-009 exige "una mejora significativa... definida en sus datos", y spec.md Assumptions descarta explícitamente exigir una fórmula universal. | Un multiplicador `float` (`damageMultiplier`, `maxHealthMultiplier`) aplicado sobre los stats base: evaluado y rechazado (research.md) — añade una capa de cálculo (multiplicación en tiempo de resolución, redondeo, validación de rango) sin beneficio real dado que spec.md ya renuncia explícitamente a exigir una fórmula universal; un valor absoluto por forma es igual de expresivo (el diseñador de contenido puede lograr "duplicar" escribiendo el doble a mano) y consistente con que `damage`/`maxHealth` en `UnitDefinition` (001) ya son valores absolutos, no multiplicadores. |

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño detallado de Fase 1 (`UnitEvolutionStage` como enum en `Core` con `FormaBase` en `0` para preservar FR-011 sin migración; `UnitEvolutionStageData[]` de longitud 0-2 anidada en `UnitDefinition` sin `ScriptableObject` adicional; `GetEffectiveCombatProfile` como función pura con fallback explícito a los campos base de la Forma Base; `UnitEvolutionController`/`UnitEvolutionStageResolver` como clases planas en `Gameplay`, reutilizando el mismo `IPlayerProgressStore`/`PlayerProgressSaveData` que 005 ya diseñó, sin archivo de guardado nuevo; secuencialidad resuelta estructuralmente, no por una tabla de validación adicional; `UnitRuntime.Initialize` con un parámetro opcional que preserva compatibilidad total con 001/007/008) **no amplió ni redujo** la superficie de complejidad ya documentada en el Constitution Check inicial y su Complexity Tracking — las cuatro filas de esa tabla siguen siendo, tras el diseño detallado, la superficie mínima necesaria.

**La bandera de gobernanza sobre el Principio III quedó resuelta el 2026-07-29 vía `/speckit.constitution` (v1.0.0 → v1.1.0)**, con posterioridad al diseño de Fase 0/Fase 1 de este plan. Ningún artefacto de Fase 0/Fase 1 (research.md, data-model.md, contracts/, quickstart.md) necesitó cambios como consecuencia — el diseño ya descrito (formas acotadas 0-2, Forma Base con los campos ya existentes como mínimo garantizado) encaja exactamente con la lectura ahora explícita del Principio III. `/speckit.tasks`/`/speckit.implement` pueden invocarse sobre este plan sin ambigüedad de gobernanza pendiente.
