# Implementation Plan: Clasificación de Unidades/Enemigos y Habilidades Avanzadas (Trait-Targeting, Neutral, Immunities)

**Branch**: `008-classification-trait-abilities` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-classification-trait-abilities/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Fusión deliberada de las Fases 8 y 9 del roadmap (ver spec.md Assumptions). Extiende `UnitDefinition` (001, ya extendida por 007 con `AttackType`) con dos campos de clasificación — `ClassificationType` (estándar, obligatorio, 8 valores) y `SpecialClassificationType` (opcional, 8 valores incluido un centinela `None`) — y con tres colecciones de datos anidados nuevos (`TraitTargetingAbility[]`, `NeutralAbility[]`, `Immunity[]`), todos con default cero-elementos/valor-cero que preservan el comportamiento de las unidades ya serializadas de 001/007 sin migración (FR-010, mismo patrón que `AttackType.SingleTarget = 0` en 007). Enfoque técnico: no se crea una capa de "resolución de habilidades" nueva — se extiende `UnitRuntime.Update()`/`Attack()` (el mismo punto de inserción que 007 ya usó para `AttackType`) con un método `ApplyAbilitiesTo(target)` invocado justo después de cada `ApplyDamage` ya existente, para uno o varios objetivos según `AttackType`. Un `IEffectReceiver` nuevo en `Core` (implementado solo por `UnitRuntime`, no por `BaseHealth` — las bases quedan fuera de alcance) expone clasificación + `ApplyEffect`/`IsImmuneTo` genéricos en `AbilityEffectType`, de forma que el único efecto concreto definido hoy (`Curse`) no requiera una estructura de datos runtime genérica sin consumidor real (research.md §6). El algoritmo de coincidencia `TraitTargetingAbility.MatchesTarget` es la pieza central que resuelve FR-003/FR-004: un objetivo con tipo especial declarado solo es alcanzado por inclusión explícita, ignorando por completo la lista de tipos estándar de la habilidad.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que 001-007.

**Primary Dependencies**: Ninguna nueva — únicamente `UnityEngine` ya referenciado por `TheBattler.Core`/`Model`/`Gameplay`. No se añade ningún paquete de Unity.

**Storage**: N/A para esta feature — no introduce persistencia propia. Los datos nuevos (clasificación, habilidades, inmunidades) viven en los assets `.asset` de `UnitDefinition` ya existentes, consistentes con Principio V; no se toca `progress.json` (002) ni `menu-settings.json` (003).

**Testing**: Unity Test Framework, mismo split EditMode/PlayMode que 001-007. EditMode para las funciones puras nuevas (`TraitTargetingAbility.MatchesTarget`, `Immunity.Blocks`) y para los valores por defecto de `UnitDefinition`. PlayMode para las 5 historias de usuario end-to-end, siguiendo el mismo patrón que `AttackTypeBattlePlayModeTests.cs` (007) — `ScriptableObject.CreateInstance<UnitDefinition>()` + reflexión sobre campos privados, sin depender de los assets `.asset` reales del Capítulo 1.

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); esta feature no introduce restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo, se extiende la capa de asmdefs ya validada (Core→Model→Gameplay→View).

**Performance Goals**: Sin regresión sobre el objetivo de 60 fps ya fijado en 001/007. `ApplyAbilitiesTo` recorre como mucho `m_Source.TraitTargetingAbilities.Length + m_Source.NeutralAbilities.Length` por objetivo dañado, por ciclo de ataque (gobernado por el mismo `m_AttackCooldownRemaining` que ya limita `Attack()` a una vez por intervalo) — sin asignaciones nuevas por ataque (no se instancia ninguna colección; `MatchesTarget`/`Blocks` son comparaciones de enum sobre arrays ya serializados).

**Constraints**: El comportamiento de trait-targeting/neutral/inmunidad debe aplicarse de forma simétrica entre unidades del jugador y enemigos, sin ramas especiales por `Team` (mismo criterio que FR-007 de 007). Las 5 unidades y el enemigo ya existentes de 001/007 deben seguir funcionando sin errores y sin reautorado obligatorio (FR-010, SC-006). Curse deshabilita únicamente las habilidades especiales del atacante afectado, nunca su daño base (FR-008, spec.md no lo pide de otra forma).

**Scale/Scope**: 8 valores de `ClassificationType`, 8 de `SpecialClassificationType` (incluido `None`), 1 valor concreto de `AbilityEffectType` (`Curse`, enum abierto a extensión futura sin romper compatibilidad). Extiende el `UnitDefinition` de las 5 unidades del jugador y 1 unidad enemiga ya definidas en 001, sin añadir unidades nuevas ni reautorarlas permanentemente (mismo alcance que 007).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — esta feature no toca diálogo pre/post-batalla ni contenido narrativo; solo lógica de combate y datos de unidad. Sin conflicto. |
| II. Combate Automático por Despliegue | Alineación directa: las habilidades avanzadas se evalúan dentro del mismo ciclo autónomo de ataque ya establecido por 001/007 (`UnitRuntime.Attack()`), sin introducir control directo del jugador ni tocar el bucle de recurso/coste/cooldown/despliegue. |
| III. Identidad Visual Animada | N/A — no añade animaciones ni variantes visuales nuevas por clasificación/habilidad; reutiliza `idleAnimation`/`attackAnimation`/`visualVariant` ya exigidos y validados por 001. Sin conflicto. |
| IV. Progresión por Capítulos con Desbloqueo | N/A — no toca el sistema de desbloqueo entre capítulos ni `ChapterDefinition`. |
| V. Balance Dirigido por Datos | Fuerte alineación: `ClassificationType`/`SpecialClassificationType`/`TraitTargetingAbility[]`/`NeutralAbility[]`/`Immunity[]` son campos de `UnitDefinition` (ScriptableObject), editables en el Inspector sin recompilar, mismo patrón que `cost`/`damage`/`range`/`attackType` (007). Las habilidades/inmunidades se modelan como clases `[Serializable]` anidadas (mismo patrón que `EnemyWaveDefinition.WaveEntry`, 001) en vez de datos hardcodeados en `UnitRuntime`. |
| VI. Simplicidad desde el MVP | **Requiere justificación explícita — ver Complexity Tracking.** Esta feature introduce una capa de habilidades que no existía en el MVP original (001-007 no tenían ningún concepto de "efecto aplicado condicionalmente"). Se evaluaron y rechazaron activamente varias generalizaciones más amplias (framework de scripting de efectos, diccionario runtime de efectos activos, flag dedicado para "contra todos", `ScriptableObject` por habilidad — ver research.md §§3-6) en favor del diseño mínimo que cubre exactamente los 11 FR de spec.md. La constitución exige que "la complejidad añadida fuera de esa slice debe justificarse explícitamente en el `/speckit.plan` correspondiente" — se documenta a continuación en vez de asumir silenciosamente que no hay violación. |

## Project Structure

### Documentation (this feature)

```text
specs/008-classification-trait-abilities/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── effect-receiver.md
│   ├── trait-targeting-matching.md
│   └── unit-runtime-ability-behavior.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Core/Battler/
│   ├── ClassificationType.cs                # nuevo — enum estándar, 8 valores, Traitless(=0, default)
│   ├── SpecialClassificationType.cs         # nuevo — enum opcional, 8 valores, None(=0, default) + 7 tipos especiales
│   ├── AbilityEffectType.cs                 # nuevo — enum abierto a extensión futura; solo Curse definido en esta feature
│   └── IEffectReceiver.cs                   # nuevo — contrato ClassificationType/SpecialClassificationType/IsImmuneTo/ApplyEffect
├── Model/Battler/
│   ├── UnitDefinition.cs                    # modificado — + m_ClassificationType, m_SpecialClassificationType, m_TraitTargetingAbilities, m_NeutralAbilities, m_Immunities (todos con default cero-elementos/valor-cero, sin FormerlySerializedAs por ser campos nuevos)
│   ├── TraitTargetingAbility.cs             # nuevo — [Serializable], + MatchesTarget(ClassificationType, SpecialClassificationType)
│   ├── NeutralAbility.cs                    # nuevo — [Serializable]
│   └── Immunity.cs                          # nuevo — [Serializable], + Blocks(AbilityEffectType)
└── Gameplay/Battler/
    └── UnitRuntime.cs                       # modificado — implementa IEffectReceiver; + m_CurseRemainingSeconds, IsCursed; Update() descuenta el temporizador; Attack() invoca ApplyAbilitiesTo(target) tras cada ApplyDamage ya existente (ver contracts/unit-runtime-ability-behavior.md)

Assets/Tests/
├── EditMode/Battler/
│   ├── TraitTargetingAbilityMatchingTests.cs    # nuevo — tabla de verdad completa de contracts/trait-targeting-matching.md
│   ├── ImmunityTests.cs                          # nuevo — Blocks(effectType) por coincidencia exacta
│   └── UnitDefinitionClassificationDefaultsTests.cs  # nuevo — defaults Traitless/None/arrays vacíos (FR-010)
└── PlayMode/Battler/
    └── ClassificationAbilityBattlePlayModeTests.cs   # nuevo — US2-US5 end-to-end, incluida simetría Team.Enemy
```

**Structure Decision**: Se reutiliza exactamente la misma capa de asmdefs ya validada en 001-007 (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay`); no se crea ningún ensamblado nuevo ni se toca `TheBattler.View` (esta feature no tiene UI propia, mismo alcance que 007). Los tres enums nuevos van en `Core` junto a `Team`/`BattleOutcome`/`AttackType` — valores de datos compartidos sin dependencia de motor (research.md §1). `IEffectReceiver` también va en `Core` porque es un contrato puro de datos/comportamiento consultado tanto desde `Model` (indirectamente, vía los tipos que sus métodos aceptan) como desde `Gameplay` (`UnitRuntime`), sin ningún `using` de `Gameplay` en su firma. `TraitTargetingAbility`/`NeutralAbility`/`Immunity` van en `Model` junto a `UnitDefinition`, como clases `[Serializable]` anidadas — mismo patrón que `EnemyWaveDefinition.WaveEntry` (001), no como `ScriptableObject` independientes (research.md §3, rechazado por sobre-ingeniería). La lógica de aplicación (`ApplyAbilitiesTo`, guard de Curse, implementación de `IEffectReceiver`) se queda en `Gameplay` (`UnitRuntime`), exactamente donde 007 ya insertó su propia ramificación por `AttackType` — no se introduce una clase nueva de "resolución de habilidades" por el mismo motivo que 007 documentó para `IAttackResolver` (research.md §7). `BaseHealth` no se modifica — no implementa `IEffectReceiver`, las bases quedan fuera del alcance de trait-targeting/neutral/immunity/Curse (research.md §5). Los tests siguen el split EditMode (funciones puras: `MatchesTarget`, `Blocks`, defaults) / PlayMode (ciclo de combate real) ya usado en 001-007, sin herramientas de testing nuevas.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Elemento de complejidad añadido | Por qué es necesario | Alternativa más simple rechazada porque |
|---|---|---|
| `IEffectReceiver` — interfaz nueva en `Core`, con dos propiedades y dos métodos, implementada solo por `UnitRuntime` | FR-005/FR-006/FR-007 exigen que un atacante pueda consultar la clasificación de un objetivo arbitrario (`ILaneOccupant`) y aplicarle/consultarle un efecto sin que `UnitRuntime` (Gameplay) dependa del tipo concreto `UnitDefinition` de otra instancia ni haga *casting* inseguro repetido en cada punto de invocación. | Consultar `((UnitRuntime)target).Source.ClassificationType` directamente con *casting* explícito en cada llamada: rechazado — rompe la abstracción `ILaneOccupant` ya establecida en 001/007 (el llamador tendría que conocer que el objetivo es concretamente un `UnitRuntime`, no cualquier `ILaneOccupant`), y no hay forma de excluir `BaseHealth` de forma declarativa (research.md §5) sin repetir un chequeo `is UnitRuntime` en cada sitio en vez de una única interfaz. |
| `AbilityEffectType`/`ApplyEffect`/`IsImmuneTo` genéricos en el tipo de efecto, aunque solo `Curse` tiene comportamiento definido hoy | FR-007 exige inmunidad "a un efecto específico" de forma genérica — no solo a Curse; el propio spec.md (Assumptions) anticipa efectos futuros (Congelar, Retroceso, Debilitar, Warp) que "pueden definirse en specs de contenido posteriores... sin requerir cambios a esta spec". Una firma genérica hoy evita tener que romper la interfaz `IEffectReceiver` (y por tanto todo lo que ya la implementa/consume) cuando llegue el primer efecto adicional. | Métodos específicos `ApplyCurse()`/`IsImmuneToCurse()` en vez de una firma genérica: rechazado (research.md §6) — cada efecto nuevo obligaría a añadir un método nuevo a la interfaz y a todos los sitios que la consumen, en vez de solo añadir un valor de enum y, opcionalmente, un campo de estado en `UnitRuntime` cuando ese efecto se implemente. Se evitó, en cambio, construir ya un `Dictionary<AbilityEffectType, float>` genérico de efectos activos — eso sí se rechazó por especulativo, ver research.md §6. |

Ambos elementos se limitan a la superficie mínima que los propios FR-005/FR-006/FR-007/FR-008/FR-009 ya exigen (targeting genérico por clasificación + inmunidad/efecto genéricos por tipo); no se construyó ningún framework de scripting de efectos, ningún `ScriptableObject` adicional por habilidad, ni ninguna estructura runtime para efectos sin consumidor real hoy (ver research.md §§3, 4, 6 para las alternativas más amplias evaluadas y rechazadas). Principio VI se considera satisfecho con esta justificación explícita, no por ausencia de complejidad.

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final — `ClassificationType`/`SpecialClassificationType` como enums en `Core` con `Traitless`/`None` como miembro `0` (cubre FR-010 sin migración, mismo criterio que `AttackType.SingleTarget = 0` de 007), `TraitTargetingAbility`/`NeutralAbility`/`Immunity` como clases `[Serializable]` anidadas en `UnitDefinition` sin `ScriptableObject` adicional, `IEffectReceiver` implementado únicamente por `UnitRuntime` (explícitamente no por `BaseHealth`), `MatchesTarget` como función pura con una única regla de coincidencia sin caso especial para "contra todos" (se autora como lista completa, sin flag dedicado), y `ApplyAbilitiesTo` insertado en `UnitRuntime.Attack()` justo después de cada `ApplyDamage` ya existente (mismo punto de inserción que 007) — no introdujo ninguna dependencia, capa o mecanismo fuera de lo ya contemplado en el Constitution Check inicial y en su Complexity Tracking. Las 6 evaluaciones de la tabla anterior se mantienen sin cambios; los dos elementos de complejidad documentados (`IEffectReceiver`, genericidad de `AbilityEffectType`) siguen siendo, tras el diseño detallado, exactamente la superficie mínima necesaria — ninguna decisión de Fase 1 amplió esa superficie.

Dos ajustes de alcance identificados durante el diseño (no cambios de scope de la feature, sino precisiones delegadas explícitamente por spec.md a esta fase):
1. La distinción `SpecialClassificationType.None` (sin tipo especial declarado, FR-010) vs. `SpecialClassificationType.Typeless` (uno de los 7 tipos especiales reales de FR-002) no estaba explícita en spec.md más allá de nombrarlos por separado en la Key Entity `SpecialClassificationType`; se resolvió en research.md §2/data-model.md como dos valores de enum distintos, con `Typeless` sujeto a la misma exclusión de "contra todos" que cualquier otro tipo especial (FR-004) — es la única lectura consistente con que FR-002 liste "Typeless (Sin tipo)" como uno de los 7 valores opcionales, no como un noveno estado de "ausencia".
2. El mecanismo concreto de "contra todos los tipos estándar" (FR-003/FR-004) no estaba definido en spec.md más allá del comportamiento observable; se resolvió como "autorar la lista completa de 8 `ClassificationType`" sin campo/flag adicional (research.md §4), por ser la opción de una única fuente de verdad más simple de validar y testear (SC-003).

Ninguno de los dos cambia el Constitution Check ni el Complexity Tracking.
