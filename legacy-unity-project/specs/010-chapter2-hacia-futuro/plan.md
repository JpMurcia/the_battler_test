# Implementation Plan: Capítulo 2 "Hacia el Futuro"

**Branch**: `010-chapter2-hacia-futuro` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-chapter2-hacia-futuro/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Capítulo 2 "Hacia el Futuro" replica exactamente el patrón ya validado por `001-chapter1-vertical-slice` (diálogo pre-batalla → combate automático por despliegue → diálogo post-batalla, victoria/derrota por base) usando el mismo modelo de datos y las mismas clases runtime, sin ningún cambio de código en el núcleo de combate: se verificó contra el código real (`BattleStateManager.cs`, `EnemyWaveSpawner.cs`, `DialoguePlaybackController.cs`, `UnitRuntime.cs`, `UnitDeploymentController.cs`) que las cinco ya están parametrizadas por `ChapterDefinition`/`EnemyWaveDefinition`/`DialogueLine[]` inyectados vía Inspector, sin ningún literal específico del Capítulo 1 en su lógica (research.md §1). Esta feature es, por tanto, un trabajo de **contenido**: un nuevo asset `ChapterDefinition` (`chapter_2`) con su propio diálogo pre/post-batalla (`DialogueLine[]`, sin guion literal fijado aquí — Assumptions de spec.md), 1-2 `UnitDefinition` nuevas específicas del capítulo (además de las 5 ya existentes de `001`) que cumplen el Principio III igual que las cinco originales, una `EnemyWaveDefinition` nueva que reutiliza la misma forma (`WaveEntry[]`) que la de `001` pero con contenido más difícil (research.md §4), y una escena nueva `Chapter2_Battle.unity` que cablea los mismos componentes ya existentes contra estos assets nuevos. Como integración explícita y en alcance (no un "nice to have"), esta feature documenta el cambio de datos necesario en `004-adventure-map-banners` para que el banner "Hacia el Futuro" pase a tener destino jugable — un cambio puramente de datos sobre `MainAdventureMap.asset` (asignar `LinkedChapter`/`TargetSceneName`), no de código, tal como el propio `004` ya lo anticipó en sus Assumptions (research.md §5, contracts/adventure-map-banner-integration.md).

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que `001-chapter1-vertical-slice`.

**Primary Dependencies**: Ninguna nueva. Reutiliza en su totalidad la infraestructura ya implementada de `001` — `ChapterDefinition`, `DialogueLine`, `EnemyWaveDefinition`, `UnitDefinition`, `BattleStateManager`, `EnemyWaveSpawner`, `DialoguePlaybackController`, `UnitDeploymentController`, `UnitRuntime`, `UnitRuntimePool`, `BattleResourceController`, `BaseHealth`, `BattleOutcomeResolver`, `LocalChapterProgressStore` — sin modificar ninguno de esos archivos. No se añade ningún paquete de Unity.

**Storage**: Ninguna nueva. `BattleStateManager` sigue leyendo/escribiendo `progress.json` vía `IChapterProgressStore` (002) tal cual, ahora también con un `ChapterProgressRecord` para `chapter_2`; esta feature no introduce ningún archivo de guardado propio. Los datos de diseño nuevos (diálogo, unidades, oleada, capítulo) viven en assets `.asset`/`.controller`/`.anim` bajo `Assets/ScriptableObjects/Battler/Chapter2/`, mismo patrón que `Chapter1/`.

**Testing**: Unity Test Framework, mismo split que `001` — EditMode (NUnit puro) para validación de datos de los assets nuevos (mismos criterios que `UnitDefinitionValidationTests`/`ChapterDefinitionValidationTests` de `001`, aplicados a los assets de `Chapter2`) y PlayMode para el recorrido diálogo→batalla→diálogo sobre `Chapter2_Battle.unity`, replicando el patrón de `BattleLoopPlayModeTests.cs` de `001` (dobles de `UnitDefinition`/`ChapterDefinition` creados en memoria vía `ScriptableObject.CreateInstance<T>()`, sin depender de assets `.asset` reales del proyecto).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo, se extiende la capa de asmdefs ya validada (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`).

**Performance Goals**: Mismo objetivo que `001` — 60 fps estables con hasta ~10 unidades simultáneas en el carril; esta feature no cambia el motor de combate, solo añade una segunda instancia de contenido sobre él.

**Constraints**:
- **Dependencias del roadmap no implementadas todavía en C#** (verificado directamente contra `Assets/Scripts/`, research.md §2): `ChapterBannerDefinition.cs`/`AdventureMap.cs` (`004`), `Region.cs`/`MissionEnergy*.cs` (`006`), `AttackType.cs` (`007`) y `ClassificationType.cs`/`SpecialClassificationType.cs` (`008`) no existen todavía como código — solo como specs/plan/data-model aprobados. `UnitDefinition.cs` hoy solo tiene los campos de `001` (sin `AttackType` ni clasificación). Esta feature **no bloquea** su propio contenido nuclear (diálogo, batalla, base vs. base) en esa ausencia — es completamente autoría de datos sobre el esquema ya implementado de `001` — pero el desbloqueo real desde el mapa de aventuras (US2 de esta spec) y el escalado de dificultad formal vía `Region`/`DifficultyRank` (FR-007) solo se materializan una vez que `004`/`006` se implementen en C#. Ver research.md §2 para el orden de implementación recomendado.
- Igual que `001`: toda la lógica de combate funciona sin conexión a red; el bando enemigo no requiere IA de decisión, solo ejecución de datos (`EnemyWaveDefinition` reutilizada estructuralmente, FR-007).
- Las 1-2 unidades nuevas DEBEN cumplir el Principio III (idle + ataque + variante visual) exactamente igual que las 5 de `001` — sin excepción (FR-005a).
- El guion/texto literal del diálogo y el nombre concreto del antagonista quedan fuera de este plan (Assumptions de spec.md) — se autoran durante `/speckit.tasks`/`/speckit.implement`, esta fase solo fija la forma de los datos que los contendrán.

**Scale/Scope**: 1 capítulo nuevo, 1 batalla, 7 `UnitDefinition` de jugador disponibles en la batalla (las 5 de `001` + 1-2 nuevas de esta feature), 1 `EnemyWaveDefinition` nueva, 2 bases, 1 secuencia de diálogo pre-batalla + 1 post-batalla — mismo orden de magnitud que `001`, sin introducir sistemas nuevos (Principio VI).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Narrativa Integrada | FR-001/FR-002/FR-006 exigen diálogo pre y post-batalla específicos de "Hacia el Futuro" (formato retrato + texto, `DialogueLine[]`, igual que `001`), centrados en un antagonista nuevo y distinto del Capítulo 1 — no genérico, no reutilizado sin contexto (User Story 3). El guion literal se autora en `/speckit.tasks`/`/speckit.implement`, pero la forma de los datos (`ChapterDefinition.PreBattleDialogue`/`PostBattleDialogue`, no vacíos) ya obliga a que exista contenido narrativo real antes de habilitar combate. | PASS |
| II. Combate Automático por Despliegue | FR-003/FR-004 reutilizan sin cambios el núcleo ya validado por `001` (recurso acumulado, despliegue con coste/cooldown, autonomía total tras desplegar, bases como objetivo de victoria/derrota) — verificado que `BattleStateManager`/`BattleResourceController`/`UnitDeploymentController`/`UnitRuntime` no requieren modificación (research.md §1). | PASS |
| III. Identidad Visual Animada | FR-005a exige explícitamente que cada una de las 1-2 unidades nuevas tenga animación de idle, animación de ataque y una variante visual adicional, igual que las 5 de `001` — sin excepción. `UnitDefinition.HasValidVisualIdentity` (ya implementado en `001`) valida esto sin cambios de código. Es una dependencia de producción de arte/animación fuera del código (mismo criterio que `001` ya asumió con su `PlaceholderArt`), no una limitación de diseño. | PASS (con nota de dependencia de contenido, no de código) |
| IV. Progresión por Capítulos con Desbloqueo | Alineación central — esta feature es exactamente el "Capítulo 2" que `004-adventure-map-banners` dejó como banner visible-pero-no-jugable (FR-008/FR-009 de esta spec). El desbloqueo secuencial en sí ya lo implementa `004` (una vez su código exista); esta feature solo aporta el contenido que ese mecanismo necesita para dejar de estar bloqueado por ausencia de destino. | PASS |
| V. Balance Dirigido por Datos | Los stats de las unidades nuevas, la oleada enemiga y las líneas de diálogo viven en `UnitDefinition`/`EnemyWaveDefinition`/`DialogueLine` (ScriptableObjects ya existentes de `001`) — ningún valor nuevo se hardcodea en `BattleStateManager` ni en ninguna clase de `Gameplay`. | PASS |
| VI. Simplicidad desde el MVP | Fuerte alineación: cero clases C# nuevas propuestas por este plan — se reutiliza el 100% del código de `001` sobre datos nuevos; la oleada enemiga reutiliza la misma forma de `WaveEntry[]` en vez de diseñar una estructura de amenaza nueva (FR-007, explícito en spec.md); no se introduce ningún sistema nuevo (gacha, multijugador, etc.). | PASS |

No hay violaciones que justificar; la sección **Complexity Tracking** queda vacía.

## Project Structure

### Documentation (this feature)

```text
specs/010-chapter2-hacia-futuro/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── chapter2-scriptableobject-data-contract.md
│   ├── new-unit-definitions.md
│   └── adventure-map-banner-integration.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Ningún archivo `.cs` nuevo ni modificado — esta feature es exclusivamente datos + escena, sobre la capa de asmdefs ya existente (`Core→Model→Gameplay→View`) validada por `001`-`003`:

```text
Assets/
├── ScriptableObjects/
│   └── Battler/
│       └── Chapter2/                          # nuevo — mismo layout que Chapter1/
│           ├── Chapter2.asset                 # ChapterDefinition (chapterId = "chapter_2")
│           ├── Units/
│           │   ├── Player/
│           │   │   └── (2 nuevas UnitDefinition, ver contracts/new-unit-definitions.md)
│           │   └── Enemy/
│           │       └── (1+ UnitDefinition enemiga, reutilizando el patrón de Unit_EnemyGrunt)
│           ├── EnemyWave.asset                 # EnemyWaveDefinition — misma forma que Chapter1/EnemyWave.asset, contenido escalado
│           ├── Dialogue/
│           │   ├── PreBattle/                  # DialogueLine[], ≥1
│           │   └── PostBattle/                 # DialogueLine[], ≥1
│           └── PlaceholderArt/                 # idle/attack .anim+.controller y variante visual de las 2 unidades nuevas (Principio III)
│
└── Scenes/
    └── Chapter2_Battle.unity                   # nueva — mismo cableado de componentes que Chapter1_Battle.unity, apuntando a Chapter2.asset

Assets/Tests/
├── EditMode/Battler/
│   └── (extensión de las suites de validación de datos ya existentes de 001, aplicadas a los assets de Chapter2 — sin clases nuevas, mismos validadores genéricos)
└── PlayMode/Battler/
    └── (extensión del patrón BattleLoopPlayModeTests de 001 sobre Chapter2_Battle.unity)
```

**Integración fuera de `Assets/Scripts/` de esta feature, pero en su alcance** (FR-008, Edge Cases de spec.md — ver [contracts/adventure-map-banner-integration.md](./contracts/adventure-map-banner-integration.md)):

```text
Assets/Data/Battler/
└── MainAdventureMap.asset    # de 004 — se edita el segundo elemento de Banners[]:
                               #   LinkedChapter: Chapter2.asset (antes: null)
                               #   TargetSceneName: "Chapter2_Battle" (antes: vacío)
                               # HasPlayableDestination pasa de false a true por ser una propiedad
                               # derivada (004 data-model.md) — cero cambios de código en ChapterBannerDefinition.cs.
```

**Structure Decision**: Se reutiliza íntegramente la estructura de `Assets/Scripts/{Core,Model,Gameplay,View}/Battler/` ya presente — cero archivos `.cs` nuevos. El contenido nuevo replica exactamente el layout de `Assets/ScriptableObjects/Battler/Chapter1/` bajo una carpeta hermana `Chapter2/`, y se añade una escena hermana de `Chapter1_Battle.unity`. Esto mantiene el patrón "una carpeta de datos + una escena por capítulo, cero código nuevo por capítulo" que `001` ya estableció implícitamente (su `BattleStateManager`/`EnemyWaveSpawner`/`DialoguePlaybackController` fueron diseñados data-driven desde el principio, aunque `001` nunca lo verificó explícitamente por no existir todavía un segundo capítulo — esta feature es la primera confirmación real de que ese diseño generaliza, ver research.md §1). El ajuste de datos sobre `MainAdventureMap.asset` (`004`) se documenta en un contrato dedicado en vez de mezclarse con el contenido propio de `Chapter2/`, porque vive en un asset y una carpeta (`Assets/Data/Battler/`) que pertenecen a otra feature — se declara explícitamente como tarea de integración en el alcance de esta feature (spec.md Edge Cases), no como modificación silenciosa de `004`.

## Complexity Tracking

*Sin violaciones de la Constitution Check — sección no aplica.*

## Post-Design Constitution Re-check

Tras completar Phase 0 ([research.md](./research.md)) y Phase 1 ([data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)), se re-evalúan los seis principios contra el diseño concreto:

- Se confirmó contra el código real de `001` (research.md §1) que `BattleStateManager`, `EnemyWaveSpawner`, `DialoguePlaybackController`, `UnitDeploymentController` y `UnitRuntime` son 100% data-driven por `ChapterDefinition`/`EnemyWaveDefinition`/`UnitDefinition`/`DialogueLine` inyectados vía Inspector, sin ningún literal de "Capítulo 1" en su lógica de ejecución (solo un comentario de código no funcional en `BattleStateManager.cs` que menciona "Capitulo 1" — no afecta comportamiento, no requiere cambio). El diseño de esta feature en cero clases nuevas queda validado, no solo asumido.
- `UnitRuntime`/`UnitDeploymentController`/`EnemyWaveSpawner` usan un único prefab `UnitRuntime` genérico para todas las unidades (jugador y enemigo, de cualquier capítulo) — la identidad visual de cada unidad nueva se resuelve 100% por datos (`VisualVariant` instanciado en runtime, `IdleAnimation`/`AttackAnimation` asignados al `Animator`), confirmando que el Principio III se cumple sin ningún prefab nuevo por unidad (research.md §1).
- Las 2 unidades nuevas siguen exigiendo `HasValidVisualIdentity == true` (Principio III) sin ninguna excepción declarada — data-model.md las define con la misma forma exacta que `UnitDefinition` de `001`.
- El ajuste necesario en `004` se confirmó como puramente de datos (`LinkedChapter`/`TargetSceneName` sobre `MainAdventureMap.asset`), no de código — consistente con lo que el propio `004` (Assumptions de su spec.md) ya anticipaba: "esta feature no debe requerir cambios cuando esa spec exista — solo debería empezar a tener un destino de batalla asignado". No se reabre ni modifica ningún archivo `.cs` de `004`.
- El alcance sigue limitado a 1 capítulo adicional, 2 unidades nuevas, 1 oleada enemiga, sin sistemas nuevos (Principio VI) — no se introdujo ninguna dependencia, capa o mecanismo fuera de lo contemplado en el Constitution Check inicial.

No se detectan violaciones nuevas introducidas por el diseño. **Constitution Check: PASS.**
