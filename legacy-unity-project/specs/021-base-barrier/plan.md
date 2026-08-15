# Implementation Plan: Barrera de Base y Jefes Vinculados

**Branch**: `021-base-barrier` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/021-base-barrier/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Extiende `BaseHealth` con un estado de invulnerabilidad condicional (`IsBarrierActive`) gobernado por `EnemyWaveSpawner`, que identifica al "jefe vinculado" de un nivel mediante un campo nuevo y aditivo (`EnemyWaveDefinition.WaveEntry.isLinkedBoss`) y retira la barrera de forma síncrona en el instante exacto en que ese enemigo muere, vía un evento nuevo `UnitRuntime.Defeated` (research.md §2 — evita por construcción la condición de carrera que introduciría un diseño por sondeo sobre el pool de instancias reutilizables). El disparo del mecanismo depende únicamente del dato de la oleada, no de resolver `SagaArcDefinition.BossLevel` en runtime (research.md §1) — ese campo, ya existente pero sin comportamiento propio desde `013-empire-of-cats-saga`, se mantiene como convención de autoría de contenido. Como contenido semilla real (spec.md Assumptions), se autora "The Face" (99999 HP / 2000 daño, manual técnico 6.6) en un `SagaArcDefinition` dedicado nuevo con su propio banner en la región "Imperio de los Gatos" ya existente (research.md §6, revisado tras `/speckit-analyze`: reutilizar `Chapter1Arc`/`Banner_Corea` habría dejado el nivel inalcanzable desde el Mapa de Aventuras y habría acoplado latentemente el desbloqueo del tope de mejora expandido de `PlayerBaseFlowController` a la derrota de un jefe que no existía cuando ese arco ya se completó) — cerrando el hallazgo que `EmpireOfCatsContentBuilder.cs` ya había dejado marcado ("se deja sin asignar hasta que el nivel de jefe real se autore") sin tocar ningún dato ya serializado de `013`/`014`.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que 001-020.

**Primary Dependencies**: Ninguna nueva — únicamente `UnityEngine` ya referenciado por `TheBattler.Core`/`Model`/`Gameplay`/`View`.

**Storage**: N/A — toda la barrera es estado runtime efímero sobre `BaseHealth`/`EnemyWaveSpawner` (spec.md FR-009); no se añade ningún campo a `PlayerProgressSaveData`/`ProgressSaveData`.

**Testing**: Unity Test Framework, mismo split EditMode/PlayMode que 001-020. EditMode extiende `BaseHealthStateTests` (clase plana sin dependencia de `Update()`, ya se instancia con `new GameObject().AddComponent<BaseHealth>()` — research.md, confirmado contra el archivo existente): guard de `ApplyDamage` con barrera activa, restauración tras `RemoveBarrier()`, idempotencia de `ActivateBarrier`/`RemoveBarrier`. PlayMode nuevo (`BossBarrierBattlePlayModeTests`) para el flujo completo jefe→barrera→base — `UnitRuntime` nunca se instancia en EditMode en este proyecto (depende de `Update()`/`Animator`, confirmado: ningún test EditMode existente lo hace), mismo criterio que `017-multi-hit-critical`/`018-battle-items` ya siguieron para comportamiento de combate.

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún ensamblado nuevo.

**Performance Goals**: Sin regresión sobre el objetivo de 60 fps ya fijado en 001-020 — el único costo añadido al bucle de combate es un booleano adicional en el guard ya existente de `BaseHealth.ApplyDamage`; la suscripción a `Defeated` es un único delegate por batalla (el jefe vinculado), no por frame.

**Constraints**: La retirada de la barrera debe ser atómica respecto al instante de muerte del jefe — ningún frame intermedio debe permitir daño a la base tras la muerte del jefe pero antes de registrarse la retirada (research.md §2, satisfecho por el disparo síncrono de `Defeated` antes de `UnitRuntimePool.Release`). Un `BossLevel`/oleada sin jefe vinculado configurado no debe poder dejar el nivel imposible de ganar (FR-006 — satisfecho por `m_LinkedBossEntryIndex == -1` ⇒ ninguna activación de barrera).

**Scale/Scope**: 1 campo nuevo (`WaveEntry.isLinkedBoss`), 4 miembros nuevos en `BaseHealth` (propiedad + evento + 2 métodos) + 1 línea en su guard de `ApplyDamage`, 1 evento nuevo en `UnitRuntime` (+ 1 línea en su `ApplyDamage`), lógica de seguimiento del jefe vinculado en `EnemyWaveSpawner` (3 métodos extendidos + 1 método nuevo privado), 1 campo + 1 suscripción nueva en `BaseHealthBarView`. Contenido: 1 `UnitDefinition` nueva ("The Face"), 1 `EnemyWaveDefinition` nueva, 1 `ChapterDefinition` nueva, 1 `SagaArcDefinition` nueva y dedicada (`TheFaceArc`, no `Chapter1Arc` — research.md §6 revisado), 1 `ChapterBannerDefinition` nueva (`Banner_TheFace`, misma región que Corea/Mongolia) registrada en `MainAdventureMap.asset`, 1 escena nueva (`TheFace_Battle.unity`). `Chapter1Arc.asset`/región/mapa existentes no se modifican — la extensión a `MainAdventureMap.asset`/`EmpireOfCatsContentBuilder.ValidateScene()` es aditiva.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | Aplica de lleno al contenido nuevo: el nivel "The Face" requiere diálogo pre/post-batalla propio, ligado a la revelación del jefe (research.md §6) — mismo patrón que cualquier `ChapterDefinition` ya existente. |
| II. Combate Automático por Despliegue | Alineación directa: la barrera solo condiciona si el daño ya calculado por el bucle de despliegue/ataque existente se aplica o no a la base — no introduce control directo del jugador ni cambia el bucle de despliegue en sí. |
| III. Identidad Visual Animada | Aplica al contenido nuevo: "The Face" necesita idle + ataque + variante visual mínima, igual que cualquier unidad — reutilizando arte ya importado (mismo criterio que `011`/`012`), sin sprite estático. |
| IV. Progresión por Capítulos con Desbloqueo | Alineación directa: "The Face" es un nivel más dentro de la región "Imperio de los Gatos" ya existente, con su propio banner (`Banner_TheFace`, `DifficultyRank` mayor al de "Mongolia" — mismo mecanismo de ordenamiento por región ya implementado en `006-mission-energy-system`) — no se introduce ninguna región nueva ni un segundo criterio de desbloqueo. |
| V. Balance Dirigido por Datos | Alineación directa: `isLinkedBoss`, las stats de "The Face" y la asignación de `BossLevel` viven enteramente en ScriptableObjects editables en el Inspector, sin ninguna condición hardcodeada en el código de combate. |
| VI. Simplicidad desde el MVP | Alineación directa: reutiliza el patrón evento-suscripción-un-solo-disparo ya establecido por `BaseHealth.HealthDepleted` (research.md §2) en vez de un mecanismo de sondeo nuevo; reutiliza el generador de escena de batalla ya compartido por `Corea_Battle.unity`/`Mongolia_Battle.unity` en vez de un patrón de autoría nuevo (research.md §6); extiende `BaseHealthBarView` existente en vez de crear un componente de vista nuevo (research.md §4). Sin necesidad de Complexity Tracking. |

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final no amplió la superficie descrita en Technical Context. La decisión más importante de esta feature se mantuvo firme durante el diseño: el disparo de la barrera nunca depende de resolver `SagaArcDefinition.BossLevel`/`activeArc` en runtime (research.md §1) — evita heredar la divergencia ya documentada entre `activeArc` local y `m_ActiveArc` serializado de `BattleStateManager` (research.md §5, riesgo preexistente, no introducido ni corregido por esta feature). La retirada de la barrera es síncrona por construcción (research.md §2, contracts/boss-barrier-lifecycle.md), sin ninguna ventana de frame que un test PlayMode pudiera necesitar tolerar con un margen de tiempo arbitrario. El Constitution Check original se mantiene sin cambios: ningún principio requiere una excepción documentada.

## Project Structure

### Documentation (this feature)

```text
specs/021-base-barrier/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/             # Phase 1 output (/speckit-plan command)
│   └── boss-barrier-lifecycle.md
└── tasks.md               # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Model/Battler/
│   └── EnemyWaveDefinition.cs                # modificado — + WaveEntry.isLinkedBoss: bool (default false)
└── Gameplay/Battler/
    ├── BaseHealth.cs                          # modificado — + IsBarrierActive, BarrierStateChanged, ActivateBarrier(), RemoveBarrier(); guard de ApplyDamage extendido
    ├── UnitRuntime.cs                         # modificado — + event Defeated, disparado en ApplyDamage antes de UnitRuntimePool.Release
    └── EnemyWaveSpawner.cs                    # modificado — + m_LinkedBossEntryIndex, activacion de barrera en Initialize()/ResetSpawner(), suscripcion de un solo uso en SpawnEnemy()/OnLinkedBossDefeated()

Assets/Scripts/View/Battler/
└── BaseHealthBarView.cs                       # modificado — + m_BarrierIndicator (GameObject opcional), suscripcion a BarrierStateChanged

Assets/Editor/Battler/
└── EmpireOfCatsContentBuilder.cs              # modificado — autora TheFace (UnitDefinition), TheFaceWave (EnemyWaveDefinition), TheFace (ChapterDefinition), TheFaceArc (SagaArcDefinition nueva y dedicada, no Chapter1Arc), Banner_TheFace (ChapterBannerDefinition, registrado en MainAdventureMap.asset), genera TheFace_Battle.unity reutilizando el mismo helper de escena que Corea/Mongolia, cablea m_BarrierIndicator en su EnemyBasePrefab, extiende ValidateScene() para cubrir el nuevo nivel

Assets/Tests/
├── EditMode/Battler/
│   └── BaseHealthStateTests.cs                # extendido — ApplyDamage no-op con barrera activa, restauracion tras RemoveBarrier(), idempotencia de ActivateBarrier()/RemoveBarrier()
└── PlayMode/Battler/
    └── BossBarrierBattlePlayModeTests.cs      # nuevo — barrera bloquea daño mientras el jefe vive; derrotar enemigos regulares no la retira; derrotar al jefe la retira en el mismo frame y permite ganar; nivel sin jefe vinculado sin regresion; reintento reactiva la barrera
```

**Structure Decision**: Misma capa de asmdefs ya validada (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`); no se crea ningún ensamblado nuevo. `WaveEntry.isLinkedBoss` va en `Model` junto al resto de `EnemyWaveDefinition`. La lógica de barrera vive en `Gameplay` (`BaseHealth`/`UnitRuntime`/`EnemyWaveSpawner`), donde ya vive toda la lógica de combate equivalente — no se introduce ninguna capa nueva. `BaseHealthBarView` (View) sigue dependiendo solo de `BaseHealth` (Gameplay), mismo sentido de dependencia ya establecido.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — el Constitution Check no encontró ningún ítem que requiera justificación (ver Principio VI arriba). No se rellena esta tabla.
