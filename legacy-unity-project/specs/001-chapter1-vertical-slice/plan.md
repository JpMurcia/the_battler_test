# Implementation Plan: Capítulo 1 — Vertical Slice Jugable

**Branch**: `001-chapter1-vertical-slice` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-chapter1-vertical-slice/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Construir la primera vertical slice jugable de "The Battler": una escena de batalla de carril único donde el jugador despliega 5 unidades predefinidas (coste/cooldown, stats en ScriptableObjects) pagadas con un recurso que se acumula automáticamente, contra una base enemiga que genera amenaza mediante oleadas de datos también definidas en ScriptableObjects, envuelta en un diálogo pre-batalla y post-batalla estilo novela visual (Timeline + retratos + TextMeshPro). Enfoque técnico: arquitectura data-driven sobre Unity URP 2D, separando definición de datos (ScriptableObjects) de runtime (MonoBehaviours que consumen esos datos), reutilizando lo que aplique de la plantilla 2D Platformer ya presente en `Assets/` (estructura `Scripts/Core|Gameplay|Mechanics|Model|View`) y añadiendo los subsistemas nuevos de combate, economía y diálogo bajo esa misma convención.

## Technical Context

**Language/Version**: C# (Unity scripting runtime asociado a Unity 6000.3.20f1 LTS)

**Primary Dependencies**: Unity URP 2D (pipeline), TextMeshPro (UI/diálogos), Unity Timeline + Cinemachine (cinemáticas pre/post-batalla), Input System (`com.unity.inputsystem`) para el input de despliegue de unidades

**Storage**: N/A para persistencia de jugador en esta slice (sin guardado a mitad de batalla, FR de Assumptions); datos de diseño (stats de unidades, oleadas enemigas, líneas de diálogo) viven en ScriptableObjects serializados como assets `.asset` dentro del proyecto

**Testing**: Unity Test Framework — EditMode tests para validar datos de ScriptableObjects (rangos de coste/cooldown/daño válidos) y lógica pura (cálculo de acumulación de recurso, resolución de victoria/derrota); PlayMode tests para el loop de despliegue-cooldown-combate en una escena de prueba mínima

**Target Platform**: Build de escritorio (Windows) ejecutado desde el Editor de Unity para esta slice; sin requerimientos de plataforma móvil/consola en esta fase

**Project Type**: Juego Unity (single project, no hay separación frontend/backend) — se extiende la estructura ya existente en `Assets/Scripts/`

**Performance Goals**: 60 fps estables durante la batalla con hasta ~10 unidades simultáneas en el carril (5 del jugador + oleada enemiga concurrente)

**Constraints**: Una sola escena de batalla por partida del Capítulo 1 (sin streaming de niveles); toda la lógica de combate debe funcionar sin conexión a red (juego local/offline); el bando enemigo no requiere IA de decisión compleja, solo ejecución de oleadas de datos predefinidas

**Scale/Scope**: 1 capítulo, 1 batalla, 5 unidades jugables, 2 bases (jugador/enemiga), 1 secuencia de diálogo pre-batalla + 1 post-batalla — alcance de vertical slice, no de producto completo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Narrativa Integrada | La spec exige diálogo pre y post-batalla específicos del Capítulo 1 (FR-001, FR-002, User Story 2) antes de habilitar combate y al ganar. | PASS |
| II. Combate Automático por Despliegue | Recurso acumulado con el tiempo, despliegue con coste/cooldown, autonomía total tras el despliegue, bases como condición de victoria/derrota (FR-003 a FR-007). | PASS |
| III. Identidad Visual Animada | Cada una de las 5 unidades requiere idle + ataque + variante visual (FR-008, FR-009, User Story 3); ninguna unidad se acepta como "completa" con un solo sprite estático. | PASS |
| IV. Progresión por Capítulos | Esta slice cubre un único capítulo; no se implementa el sistema de desbloqueo entre capítulos todavía (no hay capítulo 2 que desbloquear). Documentado como fuera de alcance en Assumptions de spec.md, no como violación — el principio no exige que exista desbloqueo si solo hay un capítulo. | PASS (no aplica desbloqueo aún) |
| V. Balance Dirigido por Datos | FR-010 exige stats de unidades en ScriptableObjects; se extiende igual a oleadas enemigas y bases para mantener consistencia data-driven. | PASS |
| VI. Simplicidad desde el MVP | Alcance limitado exactamente a lo que define la constitución como vertical slice: 1 capítulo, 5 unidades, base vs base, sin gacha ni monetización (FR-012, Assumptions). | PASS |

No hay violaciones que justificar; la sección **Complexity Tracking** queda vacía.

## Project Structure

### Documentation (this feature)

```text
specs/001-chapter1-vertical-slice/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

El proyecto ya trae la estructura de la plantilla Unity 2D Platformer Microgame bajo `Assets/Scripts/{Core,Gameplay,Mechanics,Model,View}` más `Assets/Editor`. Se respeta esa convención (Model = datos/estado, View = presentación, Mechanics/Gameplay = comportamiento en juego, Core = infraestructura transversal) y se añaden los subsistemas nuevos del Capítulo 1 como carpetas hijas dedicadas, sin tocar el código de la plantilla de plataformas (que queda inerte, no se borra, para no romper referencias de escena existentes):

```text
Assets/
├── Scripts/
│   ├── Core/
│   │   └── Battler/                # interfaces/enums sin dependencias: Team, IDamageable, IBattleResourceSource, BattleOutcome, IBattleOutcomeListener
│   ├── Model/
│   │   └── Battler/
│   │       ├── UnitDefinition.cs           # ScriptableObject: coste, cooldown, salud, daño, rango, refs a animación/variante
│   │       ├── EnemyWaveDefinition.cs      # ScriptableObject: oleadas de amenaza enemiga data-driven
│   │       ├── ChapterDefinition.cs        # ScriptableObject: liga unidades disponibles + oleadas + diálogos del Capítulo 1
│   │       ├── DialogueLine.cs             # ScriptableObject: retrato + texto de una línea de diálogo
│   │       ├── IDeployable.cs              # referencia UnitDefinition; no puede vivir en Core (evita dependencia circular Core<->Model)
│   │       └── IDialogueSequencePlayer.cs  # referencia DialogueLine; misma razón que IDeployable
│   ├── Gameplay/
│   │   └── Battler/
│   │       ├── BattleResourceController.cs # acumulación de recurso con el tiempo
│   │       ├── UnitDeploymentController.cs # valida coste/cooldown y spawnea unidades
│   │       ├── UnitRuntime.cs              # comportamiento autónomo en carril (mover/atacar) de una unidad desplegada
│   │       ├── BaseHealth.cs               # salud de base jugador/enemiga + disparo de victoria/derrota
│   │       ├── EnemyWaveSpawner.cs         # ejecuta EnemyWaveDefinition en el tiempo
│   │       ├── BattleOutcomeResolver.cs    # logica pura de resolucion victoria/derrota (testable sin escena)
│   │       └── BattleStateManager.cs       # gestor de estado de partida (movido de Core: necesita ChapterDefinition/DialogueLine de Model)
│   └── View/
│       └── Battler/
│           ├── DeploymentUIController.cs   # UI de selección/coste/cooldown de las 5 unidades (usa Input System)
│           └── DialoguePlaybackController.cs # reproduce diálogo pre/post vía Timeline + TextMeshPro
├── Prefabs/
│   └── Battler/                    # prefabs de las 5 unidades, bases, HUD de batalla
├── ScriptableObjects/
│   └── Battler/
│       └── Chapter1/                # assets .asset concretos: las 5 UnitDefinition, ChapterDefinition, EnemyWaveDefinition, líneas de diálogo del Capítulo 1
└── Scenes/
    └── Chapter1_Battle.unity        # escena jugable del Capítulo 1 (nueva)

Tests/
├── EditMode/
│   └── Battler/                    # validación de datos de ScriptableObjects y lógica pura (recurso, condición de victoria)
└── PlayMode/
    └── Battler/                    # loop despliegue → cooldown → combate en escena de prueba
```

**Structure Decision**: Se extiende la carpeta `Assets/Scripts/` existente (patrón Model/View/Gameplay/Core de la plantilla) con una subcarpeta `Battler/` en cada capa, en vez de crear una jerarquía paralela — mantiene consistente la convención ya presente en el repo y deja claro qué es plantilla heredada vs. sistema propio de "The Battler". Los datos de diseño (`UnitDefinition`, `EnemyWaveDefinition`, `ChapterDefinition`, `DialogueLine`) son ScriptableObjects para cumplir el Principio V; viven separados en `Assets/ScriptableObjects/Battler/Chapter1/` de su definición de clase para que el diseño de datos del Capítulo 1 sea editable sin tocar código.

## Complexity Tracking

*Sin violaciones de la Constitution Check — sección no aplica.*

## Post-Design Constitution Re-check

Tras completar Phase 0 ([research.md](./research.md)) y Phase 1 ([data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)), se re-evalúan los seis principios contra el diseño concreto:

- El diseño de `UnitDefinition`/`EnemyWaveDefinition`/`DialogueLine`/`ChapterDefinition` como ScriptableObjects mantiene el Principio V sin excepciones.
- `IDialogueSequencePlayer` bloquea el despliegue mientras el diálogo pre-batalla no termina (Principio I), y `ChapterDefinition` obliga a tener diálogo pre y post no vacíos.
- `UnitDefinition` exige `idleAnimation`, `attackAnimation` y `visualVariant` no nulos (Principio III), validado por EditMode tests.
- El alcance de datos/carpetas sigue limitado a 1 capítulo, 5 unidades del jugador, 2 bases (Principio VI) — no se introdujeron sistemas adicionales (gacha, multi-capítulo, multijugador) durante el diseño.

No se detectan violaciones nuevas introducidas por el diseño. **Constitution Check: PASS.**
