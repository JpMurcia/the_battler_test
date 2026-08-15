# Implementation Plan: Extensión de Tipos de Ataque — Multi-Golpe y Crítico

**Branch**: `017-multi-hit-critical` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-multi-hit-critical/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Extiende `AttackType` (007) con dos miembros nuevos al final del enum — `MultiHit` (varios impactos independientes por secuencia de ataque, con descarte de golpes restantes si el objetivo se invalida a mitad de secuencia) y `Critical` (probabilidad configurable de infligir el doble de daño) — sin reordenar ni reinterpretar `SingleTarget`/`Area`/`LongDistance` (siguen siendo 0/1/2). Reutiliza el pipeline de daño de una sola pasada ya establecido por `016-combat-ability-catalog` (`ComputeOutgoingDamage()`) para el multiplicador de crítico, y añade una máquina de estados mínima nueva a `UnitRuntime.Attack()` (temporizador de sub-intervalo + snapshot de objetivo propio) para la secuencia de Multi-Golpe. No introduce ningún sistema de eventos de animación, interfaz de aleatoriedad inyectable, ni reclasificación del rasgo "Metálico" (fuera de alcance explícito de spec.md).

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que 001-016.

**Primary Dependencies**: Ninguna nueva — únicamente `UnityEngine` ya referenciado por `TheBattler.Core`/`Model`/`Gameplay`.

**Storage**: N/A para esta feature — no introduce persistencia propia. `MultiHitCount`/`CriticalChance` viven en los assets `.asset` de `UnitDefinition` ya existentes, consistentes con el Principio V.

**Testing**: Unity Test Framework, mismo split EditMode/PlayMode que 001-016. EditMode para los defaults de `UnitDefinition` (`MultiHitCount == 1`, `CriticalChance == 0f` sin asignar). PlayMode para las 3 historias de usuario end-to-end, siguiendo el mismo patrón que `AttackTypeBattlePlayModeTests.cs` (007) y `CombatAbilityCatalogBattlePlayModeTests.cs` (016); el test de la Historia 3 Escenario 3 (SC-004) siembra `UnityEngine.Random.InitState` para reproducibilidad (research.md §4).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo.

**Performance Goals**: Sin regresión sobre el objetivo de 60 fps ya fijado en 001/007/008/016. La secuencia de Multi-Golpe añade dos comparaciones de temporizador por frame mientras está activa (mismo orden de magnitud que `m_AttackCooldownRemaining` ya existente); el roll de Crítico es una única llamada a `UnityEngine.Random.value` por invocación de `ComputeOutgoingDamage`, sin asignaciones nuevas por ataque/frame (mismo criterio que 007/008/016).

**Constraints**: Simetría jugador/enemigo obligatoria (mismo criterio que FR-007 de 007 y FR-008 de esta spec) — ninguna rama nueva por `Team`. Las unidades y enemigos ya existentes de 001-016 que no declaren `MultiHit`/`Critical` deben seguir funcionando sin cambios de comportamiento (FR-009).

**Scale/Scope**: `AttackType` pasa de 3 a 5 miembros (`SingleTarget`, `Area`, `LongDistance`, `MultiHit`, `Critical`). 2 campos nuevos en `UnitDefinition` (`m_MultiHitCount`, `m_CriticalChance`). 3 campos de estado runtime nuevos en `UnitRuntime` (no serializados). 1 rama nueva en `Attack()`, 1 multiplicador nuevo en `ComputeOutgoingDamage()`. No se autoran unidades nuevas — se extiende el `UnitDefinition` de las unidades ya existentes, sin reautorado obligatorio (mismo alcance que 007/016).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — esta feature no toca diálogo pre/post-batalla ni contenido narrativo; solo lógica de combate y datos de unidad. Sin conflicto. |
| II. Combate Automático por Despliegue | Alineación directa: Multi-Golpe/Crítico se evalúan dentro del mismo ciclo autónomo ya establecido (`UnitRuntime.Update()`/`Attack()`), sin introducir control directo del jugador ni tocar el bucle de recurso/coste/cooldown/despliegue. |
| III. Identidad Visual Animada | N/A — no añade animaciones ni variantes visuales nuevas; reutiliza `idleAnimation`/`attackAnimation`/`visualVariant` ya exigidos por 001. El trigger de animación de ataque (`s_AttackTrigger`) se dispara igual que hoy, una vez por secuencia (no una vez por golpe individual de Multi-Golpe) — sin conflicto. |
| IV. Progresión por Capítulos con Desbloqueo | N/A — no toca el sistema de desbloqueo entre capítulos. |
| V. Balance Dirigido por Datos | Fuerte alineación: `MultiHitCount`/`CriticalChance` son campos `[SerializeField]` de `UnitDefinition` (ScriptableObject), editables en el Inspector sin recompilar — mismo patrón que 007/016. |
| VI. Simplicidad desde el MVP | Alineación directa, sin necesidad de Complexity Tracking: ambos tipos de ataque reutilizan el pipeline de daño de una sola pasada ya existente (`ComputeOutgoingDamage`, 016) y el mismo patrón de temporizador que `m_AttackCooldownRemaining` (001); no se introduce ningún sistema genérico nuevo (ni de aleatoriedad inyectable, ni de eventos de animación) — ver research.md §1 y §4 para las alternativas más complejas evaluadas y rechazadas explícitamente por este motivo. |

## Project Structure

### Documentation (this feature)

```text
specs/017-multi-hit-critical/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── multi-hit-sequence.md
│   └── critical-damage.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Core/Battler/
│   └── AttackType.cs                        # modificado — + MultiHit (3), Critical (4); SingleTarget/Area/LongDistance conservan 0/1/2
├── Model/Battler/
│   └── UnitDefinition.cs                    # modificado — + m_MultiHitCount (int, Min 1, default 1), m_CriticalChance (float, Range 0-1, default 0), + clamp en OnValidate()
└── Gameplay/Battler/
    └── UnitRuntime.cs                       # modificado — Attack() gana la rama de secuencia de Multi-Golpe (contracts/multi-hit-sequence.md); ComputeOutgoingDamage() gana el multiplicador de Crítico (contracts/critical-damage.md); Initialize() resetea m_MultiHitRemainingHits/m_MultiHitTarget/m_MultiHitIntervalRemaining (mismo criterio F2 de 016)

Assets/Tests/
├── EditMode/Battler/
│   └── UnitDefinitionAttackTypeDefaultsTests.cs   # nuevo (o extiende el equivalente de 007 si ya cubre AttackType) — MultiHitCount==1 / CriticalChance==0f sin asignar (FR-009)
└── PlayMode/Battler/
    └── MultiHitCriticalAttackBattlePlayModeTests.cs   # nuevo — US1 (N golpes por secuencia), US2 (descarte al interrumpir + reinicio completo), US3 (crítico 100%/0%/muestra estadística con seed fijo), Historia 4 (simetría Team.Enemy)
```

**Structure Decision**: Misma capa de asmdefs ya validada (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay`); no se crea ningún ensamblado nuevo, `TheBattler.View` no se toca. Todo el cambio de comportamiento vive en `UnitRuntime.cs` (`Gameplay`), exactamente donde 007/008/016 ya insertaron el suyo — ningún archivo nuevo de `Model`/`Core` más allá de los campos/miembros de enum añadidos a los ya existentes.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — el Constitution Check no encontró ningún ítem que requiera justificación (ver Principio VI arriba). No se rellena esta tabla.

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final no amplió la superficie descrita en Technical Context: `AttackType` gana exactamente 2 miembros al final del enum (`SingleTarget`/`Area`/`LongDistance` siguen siendo 0/1/2), `MultiHitCount`/`CriticalChance` son campos `[SerializeField]` adicionales de `UnitDefinition` con defaults seguros, y los 3 campos de estado runtime nuevos de `UnitRuntime` (`m_MultiHitRemainingHits`, `m_MultiHitTarget`, `m_MultiHitIntervalRemaining`) no se serializan ni afectan a ningún asset ya construido. Ninguna decisión de Fase 1 introdujo una interfaz de aleatoriedad inyectable, un sistema de eventos de animación, ni una reclasificación del rasgo "Metálico" — las tres alternativas más complejas evaluadas en research.md (§1, §4) y descartadas explícitamente por el Principio VI siguen fuera de este diseño. El Constitution Check original se mantiene sin cambios: ningún principio requiere una excepción documentada.
