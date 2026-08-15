# Implementation Plan: Sistema de Tipos de Ataque ("Attack Types")

**Branch**: `007-attack-types` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-attack-types/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Extiende `UnitDefinition` (001, ya usado tanto para unidades del jugador como para enemigos vía `Team`) con un campo `AttackType` de tres valores — Ataque Único, Ataque de Área, Larga Distancia — que determina cuántos enemigos dentro de rango reciben daño en cada ciclo de ataque. Enfoque técnico: no se crea ninguna capa de "resolución de ataque" nueva; se ramifica por `AttackType` directamente en los dos puntos donde `UnitRuntime` ya adquiere objetivo y aplica daño (`Update()`/`Attack()`, 001), apoyándose en dos consultas nuevas de `LaneRegistry` (`FindFarthestTarget`, `FindAllTargetsInRange`) que se añaden junto a la ya existente `FindNearestTarget`. El radio de efecto de "Ataque de Área" y el alcance máximo de "Larga Distancia" reutilizan el campo `Range` ya existente en `UnitDefinition` (sin campo nuevo, Principio VI). Como ninguna de las tres ramas consulta `Team` para decidir su comportamiento — solo `LaneRegistry` ya usa `Team` para filtrar "enemigo", igual que en 001 —, el comportamiento resulta simétrico entre unidades del jugador y enemigos sin código adicional (FR-007). El valor por defecto del enum (`SingleTarget = 0`) cubre FR-008 automáticamente: las 5 unidades y el enemigo ya serializados en `001-chapter1-vertical-slice` no requieren ninguna migración de datos.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que el Capítulo 1 (`001-chapter1-vertical-slice`).

**Primary Dependencies**: Ninguna nueva — únicamente `UnityEngine` ya referenciado por `TheBattler.Core`/`Model`/`Gameplay`. No se añade ningún paquete de Unity.

**Storage**: N/A para esta feature — no introduce persistencia propia. El dato (`AttackType`) vive en los assets `.asset` de `UnitDefinition` ya existentes (`Assets/ScriptableObjects/Battler/Chapter1/Units/`), consistentes con Principio V; no se toca `progress.json` (002) ni `menu-settings.json` (003).

**Testing**: Unity Test Framework, mismo split EditMode/PlayMode que 001–003. EditMode para las dos consultas nuevas de `LaneRegistry` (dobles en memoria de `ILaneOccupant`, sin escena) y para el valor por defecto de `UnitDefinition.AttackType`. PlayMode para las 4 historias de usuario end-to-end, siguiendo el mismo patrón que `BattleLoopPlayModeTests.cs` (`ScriptableObject.CreateInstance<UnitDefinition>()` + reflexión sobre campos privados, sin depender de los assets `.asset` reales del Capítulo 1).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); esta feature no introduce restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo, se extiende la capa de asmdefs ya validada (Core→Model→Gameplay→View).

**Performance Goals**: Sin regresión sobre el objetivo de 60 fps ya fijado en 001 con hasta ~10 unidades simultáneas en el carril. `FindAllTargetsInRange` (usada por "Ataque de Área", potencialmente una vez por ciclo de ataque por cada unidad de área activa) escribe en un `List<ILaneOccupant>` reutilizable provisto por el llamador en vez de asignar una lista nueva por ataque, para no introducir presión de GC nueva por frame.

**Constraints**: El comportamiento de cada tipo de ataque debe aplicarse de forma simétrica entre unidades del jugador y enemigos, sin ramas especiales por `Team` en la lógica de tipos de ataque (FR-007). Las 5 unidades y el enemigo ya existentes de 001 deben seguir funcionando sin errores y sin reautorado obligatorio (FR-008, SC-004). No se añaden animaciones ni efectos visuales nuevos por tipo de ataque (Assumptions de spec.md) — solo lógica de aplicación de daño y datos.

**Scale/Scope**: 3 valores de `AttackType`; extiende el `UnitDefinition` de las 5 unidades del jugador (`Unit_Arquero`, `Unit_Escudero`, `Unit_Espadachin`, `Unit_Lancero`, `Unit_Mago`) y 1 unidad enemiga (`Unit_EnemyGrunt`) ya definidas en `001-chapter1-vertical-slice`, sin añadir unidades nuevas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — esta feature no toca diálogo pre/post-batalla ni contenido narrativo; solo lógica de combate y datos de unidad. Sin conflicto. |
| II. Combate Automático por Despliegue | Alineación directa: extiende el comportamiento ya autónomo de la unidad tras desplegarse (FR-005 de 001) con una variante de a cuántos objetivos daña, sin tocar el bucle de recurso/coste/cooldown/despliegue. No introduce control directo del jugador durante el combate. |
| III. Identidad Visual Animada | N/A — no añade animaciones ni variantes visuales nuevas por tipo de ataque (ver Assumptions de spec.md); reutiliza `idleAnimation`/`attackAnimation`/`visualVariant` ya exigidos y validados por 001 (`HasValidVisualIdentity`). Sin conflicto. |
| IV. Progresión por Capítulos con Desbloqueo | N/A — no toca el sistema de desbloqueo entre capítulos ni `ChapterDefinition`. |
| V. Balance Dirigido por Datos | Fuerte alineación: `AttackType` es un campo más de `UnitDefinition` (ScriptableObject), editable en el Inspector sin recompilar (SC-005), mismo patrón que `cost`/`damage`/`range` ya validado en 001. |
| VI. Simplicidad desde el MVP | Fuerte alineación: se reutiliza `Range` como radio de área/alcance de larga distancia en vez de añadir un campo nuevo (research.md §2); se reutilizan `LaneRegistry`/`UnitRuntime` existentes con dos métodos nuevos y una rama por tipo, en vez de introducir una capa de estrategia/resolución de ataque nueva para solo 3 valores fijos (research.md §1). |

Sin violaciones — tabla omitida (ver Complexity Tracking).

## Project Structure

### Documentation (this feature)

```text
specs/007-attack-types/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── lane-registry-targeting.md
│   └── unit-attack-type-behavior.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Core/Battler/
│   └── AttackType.cs                        # nuevo — enum SingleTarget(=0, default)/Area/LongDistance, sin dependencias de motor (mismo nivel que Team/BattleOutcome)
├── Model/Battler/
│   └── UnitDefinition.cs                    # modificado — + campo m_AttackType (AttackType, default SingleTarget) y propiedad AttackType; sin FormerlySerializedAs (campo nuevo, no renombrado)
└── Gameplay/Battler/
    ├── LaneRegistry.cs                      # modificado — + FindFarthestTarget(...), + FindAllTargetsInRange(..., List<ILaneOccupant> results); FindNearestTarget sin cambios
    └── UnitRuntime.cs                       # modificado — Update() (adquisición) y Attack() (aplicación de daño) ramifican por m_Source.AttackType; ver contracts/unit-attack-type-behavior.md

Assets/Tests/
├── EditMode/Battler/
│   ├── LaneRegistryTargetingTests.cs        # nuevo — FindFarthestTarget y FindAllTargetsInRange con dobles ILaneOccupant en memoria, sin escena
│   └── UnitDefinitionAttackTypeTests.cs     # nuevo — AttackType es SingleTarget por defecto en una instancia sin ese campo asignado (FR-008)
└── PlayMode/Battler/
    └── AttackTypeBattlePlayModeTests.cs     # nuevo — US1 (área daña a todos en rango), US2 (único daña a uno y reasigna al destruirse el objetivo), US3 (larga distancia alcanza más allá del más cercano), US4 (mismo comportamiento con Team.Enemy atacando unidades/base del jugador)
```

**Structure Decision**: Se reutiliza exactamente la misma capa de asmdefs ya validada en 001–003 (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay`); no se crea ningún ensamblado nuevo ni se toca `TheBattler.View` (esta feature no tiene UI propia). `AttackType` va en `Core` junto a `Team`/`BattleOutcome` — es un valor de datos compartido sin I/O ni dependencia de otras capas (mismo criterio que llevó `SupportedLanguage` a `Core` en 003). El campo nuevo va directamente en `UnitDefinition` (`Model`), no en una clase separada para enemigos: la spec y el código ya existente distinguen jugador/enemigo únicamente por `Team`, y el feature description del roadmap pide explícitamente extender "el mismo contrato de datos ya definido en 001", no duplicarlo. La lógica de targeting/daño se queda en `Gameplay` (`LaneRegistry`, `UnitRuntime`), exactamente donde ya vivía en 001 — no se introduce una clase nueva de "resolución de ataque" porque serían 3 ramas fijas y acotadas dentro de un método que ya existe, y una capa de estrategia añadiría indirección sin beneficio medible (Principio VI, ver research.md §1). Los tests siguen el split EditMode (lógica pura/consultas) / PlayMode (loop de combate en escena mínima instanciada en runtime) ya usado en 001–003, sin herramientas de testing nuevas.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — tabla omitida.

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final — `AttackType` como enum de 3 valores en `Core` con `SingleTarget` como miembro `0` (cubre FR-008 sin migración), `UnitDefinition` extendido con un único campo nuevo sin tocar sus atributos existentes, `LaneRegistry.FindFarthestTarget`/`FindAllTargetsInRange` como espejo de `FindNearestTarget` ya existente, `UnitRuntime.Update()`/`Attack()` ramificando por `AttackType` sin consultar `Team` en ningún punto de esa lógica, y reutilización de `Range` como radio de área/alcance de larga distancia en vez de un campo nuevo — no introdujo ninguna dependencia, capa ni mecanismo fuera de lo ya contemplado en el Constitution Check inicial. Las 6 evaluaciones de la tabla anterior se mantienen sin cambios. Sigue sin haber violaciones ni necesidad de Complexity Tracking.

Un ajuste de alcance identificado durante el diseño (no un cambio de scope de la feature, sino una decisión de diseño explícitamente delegada por spec.md a esta fase): la regla exacta de selección de objetivo para "Larga Distancia" quedaba abierta en spec.md Assumptions ("siempre el más lejano vs. cualquiera más allá del más cercano, queda para /speckit.plan"); se resolvió como "siempre el más lejano dentro de rango" (research.md §3) por ser la opción determinista y más simple de testear que satisface FR-006 sin ambigüedad. No cambia el Constitution Check.
