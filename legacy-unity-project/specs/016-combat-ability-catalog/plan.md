# Implementation Plan: Ampliación del Catálogo de Habilidades de Combate

**Branch**: `016-combat-ability-catalog` | **Date**: 2026-08-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-combat-ability-catalog/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Extiende el catálogo de `AbilityEffectType` (008, hoy solo `Curse`) con tres efectos de duración nuevos — `Weaken` (Debilitar), `Freeze` (Congelar), `Slow` (Ralentizar) — reutilizando exactamente el mismo mecanismo ya construido (`TraitTargetingAbility`/`NeutralAbility` → `ApplyEffect`/`IsImmuneTo` vía `IEffectReceiver`). Añade un campo `magnitude` nuevo a `TraitTargetingAbility`/`NeutralAbility` para que Debilitar/Ralentizar tengan una intensidad configurable, no solo duración. Introduce dos conceptos nuevos que el framework de 008 no cubre: `StrongAgainstModifier` (Fuerte Contra — modificador de combate permanente por rasgo, sin duración) y `Resistance` (Resistente — reducción parcial de duración de un efecto, distinta de la Inmunidad total ya existente). Para que "Fuerte Contra" pueda reducir el daño *recibido* de un rasgo específico, se añade una interfaz nueva `IAttackerAwareDamageable` (mismo patrón que `IEffectReceiver` en 008: implementada únicamente por `UnitRuntime`, `BaseHealth` no cambia, `IDamageable.ApplyDamage(int)` no se toca). Ningún enum existente cambia el valor de sus miembros ya definidos; ningún dato ya serializado por 007/008/009/013/014 se reinterpreta (ver spec.md Assumptions y `docs/plan-tecnico-manual-completo.md` §1.3 Grupo A/B — esta feature es enteramente Grupo A, aditiva).

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que 001-014.

**Primary Dependencies**: Ninguna nueva — únicamente `UnityEngine` ya referenciado por `TheBattler.Core`/`Model`/`Gameplay`.

**Storage**: N/A para esta feature — no introduce persistencia propia. Los datos nuevos (magnitud, resistencias, modificadores de combate) viven en los assets `.asset` de `UnitDefinition` ya existentes, consistentes con Principio V.

**Testing**: Unity Test Framework, mismo split EditMode/PlayMode que 001-014. EditMode para las funciones puras nuevas (`StrongAgainstModifier.MatchesTarget`, `Resistance.Reduce`) y para los defaults de `UnitDefinition`. PlayMode para las 5 historias de usuario end-to-end, siguiendo el mismo patrón que `ClassificationAbilityBattlePlayModeTests.cs` (008).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo.

**Performance Goals**: Sin regresión sobre el objetivo de 60 fps ya fijado en 001/007/008. Ningún bucle nuevo recorre más que `m_Source.TraitTargetingAbilities.Length + m_Source.NeutralAbilities.Length + m_Source.StrongAgainstModifiers.Length` por objetivo dañado, por ciclo de ataque — mismo orden de magnitud que 008. Sin asignaciones nuevas por ataque/frame (mismo criterio que 007/008).

**Constraints**: Simetría jugador/enemigo obligatoria (mismo criterio que FR-007 de 007 y su equivalente en 008) — ninguna rama nueva por `Team`. Las 5 unidades del jugador y el enemigo de 001, y cualquier `UnitDefinition` ya reautorada por 007/008/009/013/014, deben seguir funcionando sin cambios de comportamiento si no declaran ninguno de los campos nuevos (FR-010 de esta spec).

**Scale/Scope**: `AbilityEffectType` pasa de 1 a 4 miembros (`Curse`, `Weaken`, `Freeze`, `Slow`). 2 clases `[Serializable]` nuevas (`StrongAgainstModifier`, `Resistance`). 1 campo nuevo (`magnitude`) en 2 clases ya existentes (`TraitTargetingAbility`, `NeutralAbility`). 1 interfaz nueva (`IAttackerAwareDamageable`). No se autoran unidades nuevas — se extiende el `UnitDefinition` de las unidades ya existentes de 001/007/008, sin reautorado obligatorio (mismo alcance que 007/008).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — esta feature no toca diálogo pre/post-batalla ni contenido narrativo; solo lógica de combate y datos de unidad. Sin conflicto. |
| II. Combate Automático por Despliegue | Alineación directa: los efectos nuevos se evalúan dentro del mismo ciclo autónomo ya establecido (`UnitRuntime.Update()`/`Attack()`), sin introducir control directo del jugador ni tocar el bucle de recurso/coste/cooldown/despliegue. Congelar detiene la unidad afectada, no el control del jugador sobre ella (que ya no existe tras el despliegue, Principio II). |
| III. Identidad Visual Animada | N/A — no añade animaciones ni variantes visuales nuevas; reutiliza `idleAnimation`/`attackAnimation`/`visualVariant` ya exigidos por 001. Sin conflicto. |
| IV. Progresión por Capítulos con Desbloqueo | N/A — no toca el sistema de desbloqueo entre capítulos. |
| V. Balance Dirigido por Datos | Fuerte alineación: `magnitude`, `StrongAgainstModifier`, `Resistance` son campos/clases `[Serializable]` de `UnitDefinition` (ScriptableObject), editables en el Inspector sin recompilar — mismo patrón que 007/008. |
| VI. Simplicidad desde el MVP | **Requiere justificación explícita — ver Complexity Tracking.** Esta feature es más grande que 008 en superficie (2 clases nuevas + 1 interfaz nueva, contra 3 clases + 1 interfaz de 008) porque cubre 5 efectos con 3 mecánicas distintas (duración simple, duración+magnitud, modificador permanente por rasgo) en vez de 1 efecto de duración simple. Se documenta por qué cada pieza es la mínima necesaria. |

## Project Structure

### Documentation (this feature)

```text
specs/016-combat-ability-catalog/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── ability-effect-catalog.md
│   ├── strong-against-combat.md
│   └── unit-runtime-ability-behavior-extension.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Core/Battler/
│   ├── AbilityEffectType.cs                 # modificado — + Weaken, Freeze, Slow (Curse permanece miembro 0)
│   ├── IEffectReceiver.cs                   # modificado (008) — ApplyEffect gana 3er parámetro `float magnitude = 0f` (research.md §7, addendum post-análisis; corrige F1)
│   └── IAttackerAwareDamageable.cs          # nuevo — ApplyDamage(int, ClassificationType, SpecialClassificationType)
├── Model/Battler/
│   ├── UnitDefinition.cs                    # modificado — + m_StrongAgainstModifiers, m_Resistances (ambos default vacío)
│   ├── TraitTargetingAbility.cs             # modificado — + m_Magnitude (float, default 0, sin FormerlySerializedAs por ser campo nuevo)
│   ├── NeutralAbility.cs                    # modificado — + m_Magnitude (mismo criterio)
│   ├── StrongAgainstModifier.cs             # nuevo — [Serializable], + MatchesTarget (mismo algoritmo que TraitTargetingAbility, ver research.md §2)
│   └── Resistance.cs                        # nuevo — [Serializable], + Reduce(AbilityEffectType, float) -> float
└── Gameplay/Battler/
    └── UnitRuntime.cs                       # modificado — implementa IAttackerAwareDamageable; + temporizadores/magnitudes de Weaken/Freeze/Slow (mismo patrón que m_CurseRemainingSeconds, incluido su reset en Initialize() para instancias recicladas del pool — corrige F2); Update() se salta Move()/Attack() si IsFrozen; Attack() aplica StrongAgainstModifiers propios antes de dañar, y el nuevo overload de ApplyDamage aplica los del objetivo; ApplyEffect fija magnitud dentro del mismo switch que fija duración (research.md §7)

Assets/Tests/
├── EditMode/Battler/
│   ├── StrongAgainstModifierMatchingTests.cs    # nuevo — misma tabla de verdad que trait-targeting-matching.md (008), aplicada a StrongAgainstModifier
│   ├── ResistanceTests.cs                        # nuevo — Reduce() por coincidencia/no-coincidencia de efecto, clamp a 0
│   └── UnitDefinitionAbilityCatalogDefaultsTests.cs  # nuevo — defaults magnitude=0/arrays vacíos (FR-010)
└── PlayMode/Battler/
    └── CombatAbilityCatalogBattlePlayModeTests.cs   # nuevo — US1-US5 end-to-end, incluida simetría Team.Enemy y el edge case Congelar+Ralentizar simultáneos
```

**Structure Decision**: Misma capa de asmdefs ya validada (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay`); no se crea ningún ensamblado nuevo, `TheBattler.View` no se toca. `IAttackerAwareDamageable` va en `Core`, junto a `IEffectReceiver` — mismo motivo (contrato puro consultado desde `Gameplay` sin depender de él). `StrongAgainstModifier`/`Resistance` van en `Model` junto a `UnitDefinition`, como clases `[Serializable]` anidadas — mismo patrón que `TraitTargetingAbility`/`NeutralAbility`/`Immunity` (008), no como `ScriptableObject` independientes (mismo research.md §3 de 008, no se reevalúa aquí porque el razonamiento no cambió). Toda la lógica de aplicación se queda en `Gameplay` (`UnitRuntime`), exactamente donde 007/008 ya insertaron la suya.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Elemento de complejidad añadido | Por qué es necesario | Alternativa más simple rechazada porque |
|---|---|---|
| `IAttackerAwareDamageable` — interfaz nueva en `Core`, un método, implementada solo por `UnitRuntime` | FR-004 (Fuerte Contra) exige que una unidad reciba **menos** daño de un rasgo específico — el defensor necesita conocer la clasificación del atacante en el momento de recibir daño, dato que `IDamageable.ApplyDamage(int)` (001) no transporta hoy. | Cambiar la firma de `IDamageable.ApplyDamage` directamente: rechazado — rompería `BaseHealth` y cada test/doble existente desde 001, exactamente el tipo de cambio no-aditivo que `docs/plan-tecnico-manual-completo.md` §1.3 identificó como prohibido para esta ronda de fases. La interfaz nueva, guardada con `is IAttackerAwareDamageable` (mismo patrón que `is IEffectReceiver` de 008), dañado como antes de 001. |
| `StrongAgainstModifier` — clase nueva, duplica la forma de `targetClassificationTypes`/`includedSpecialTypes` de `TraitTargetingAbility` en vez de reutilizarla por composición | FR-004 necesita un modificador *sin duración* (permanente mientras dure el combate, no expira) con dos magnitudes (daño infligido, daño recibido) — una forma que `TraitTargetingAbility` (acoplada a `AbilityEffectType` + `durationSeconds`) no representa sin forzar semántica ajena (¿qué significaría un `AbilityEffectType.StrongAgainst` con duración infinita?). | Extender `TraitTargetingAbility` para que `durationSeconds == 0` signifique "permanente" y añadir dos campos de magnitud más: rechazado — mezclaría dos conceptos con reglas de vida distintas (efectos temporales vs. modificador permanente) en una sola clase ya cubierta por tests de 008, aumentando el riesgo de tocar ese archivo sin necesidad (research.md §2 evalúa esto con más detalle). |
| `Resistance` — clase nueva, en vez de generalizar `Immunity` con un factor de reducción | FR-005 exige una reducción *parcial* (la unidad igual sufre el efecto, menos tiempo) — distinta por diseño de `Immunity.Blocks`, que es un bloqueo binario total (US5 Escenario 2 lo exige explícitamente: Resistencia e Inmunidad son capacidades distintas y ambas deben poder declararse independientemente). | Añadir un `float m_ReductionFactor` a `Immunity` con `1.0` = bloqueo total (compatible con el comportamiento actual): rechazado — el nombre y el contrato público de `Immunity.Blocks(effectType) => bool` (008, ya testeado) dejarían de describir lo que la clase hace; mismo criterio de "no tocar un archivo ya testeado sin necesidad" que el punto anterior. |
| `IEffectReceiver.ApplyEffect` gana un 3er parámetro `float magnitude = 0f` (extensión aditiva de una interfaz de 008) — añadido tras `/speckit.analyze` | El diseño original (un método `ApplyMagnitudeIfApplicable` separado, invocado antes de `ApplyEffect`) permitía que una reaplicación de Debilitar/Ralentizar bloqueada por inmunidad/resistencia igual corrompiera la magnitud de un efecto ya activo (hallazgo F1) — violaba el Edge Case de spec.md que exige tratar ese caso como "no aplicado". Fijar duración y magnitud en la misma rama del mismo `switch`, tras los mismos guards, elimina la clase de bug por construcción. | Mantener las dos llamadas separadas y añadir una comprobación manual de sincronización entre ambas: rechazado — es el mismo tipo de estado duplicado que se puede desincronizar de nuevo con el próximo efecto que se añada al catálogo; un parámetro opcional adicional en la interfaz es más simple de razonar y extender que dos flujos paralelos coordinados a mano (research.md §7). |

Los cuatro elementos se limitan a la superficie mínima que los propios FR-004/FR-005 exigen (los tres primeros) o que corrige un defecto de diseño real detectado antes de implementar (el cuarto, F1); no se generalizó a un sistema de modificadores/efectos genérico de propósito abierto (se evaluó y rechazó, ver research.md §4). Principio VI se considera satisfecho con esta justificación explícita.

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final no amplió la superficie descrita en Complexity Tracking más allá de lo justificado explícitamente arriba: `AbilityEffectType` gana 3 miembros al final del enum (`Curse` sigue siendo `0`), `magnitude` es un campo `float` adicional en `TraitTargetingAbility`/`NeutralAbility` con default `0f` (sin uso observable para `Freeze`/`Curse`, mismo criterio que `durationSeconds` hoy para efectos sin comportamiento temporal definido), `StrongAgainstModifier`/`Resistance` son clases `[Serializable]` anidadas sin `ScriptableObject` adicional, e `IAttackerAwareDamageable` se implementa únicamente en `UnitRuntime` sin tocar `BaseHealth`/`IDamageable`. Una precisión de diseño resuelta durante Fase 1, delegada explícitamente por spec.md: el orden de aplicación cuando coinciden Congelar y Ralentizar (Edge Case, US3 Escenario 2) no requiere una regla de precedencia explícita — se resuelve por construcción, ya que `Freeze` hace que `Update()` no llegue a evaluar `Move()` en absoluto mientras está activo (ver research.md §5, contracts/unit-runtime-ability-behavior-extension.md).

**Revisión post-`/speckit.analyze` (antes de implementar)**: tres correcciones incorporadas a este diseño tras el reporte de análisis, ninguna amplía la superficie de Complexity Tracking más allá de lo ya justificado:
1. **F1** (bug de sincronización magnitud/duración) — resuelto vía el parámetro adicional de `IEffectReceiver.ApplyEffect` documentado arriba y en research.md §7.
2. **F2** (reset de estado al reciclar del pool) — `Initialize()` en `UnitRuntime.cs` debe resetear `m_WeakenRemainingSeconds`/`m_WeakenMagnitude`/`m_FreezeRemainingSeconds`/`m_SlowRemainingSeconds`/`m_SlowMagnitude` a `0f`, mismo patrón que `m_CurseRemainingSeconds = 0f` ya hace (008). No es una pieza de diseño nueva — es completar un patrón ya establecido que el diseño original de esta feature omitió extender a los 5 campos nuevos.
3. **F3** (default incorrecto en `StrongAgainstModifier`) — `m_DamageDealtMultiplier`/`m_DamageReceivedMultiplier` DEBEN declararse con inicializador explícito `= 1f` en el código C#, no depender del default `0f` de C#/Unity — ver data-model.md.
