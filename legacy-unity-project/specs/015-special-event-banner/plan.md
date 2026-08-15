# Implementation Plan: Banner Especial de Eventos: "Etapas de Fantasía"

**Branch**: `015-special-event-banner` | **Date**: 2026-07-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-special-event-banner/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Esta feature añade un segundo tipo de banner al mapa de aventuras (`004-adventure-map-banners`) que no participa del desbloqueo secuencial: se activa/desactiva según ventanas horarias programadas en datos de build (sin backend), reutilizando el sistema de energía (`006-mission-energy-system`) y el flujo de recompensas por victoria (`013-empire-of-cats-saga`) sin modificarlos. La verificación contra código real (`ChapterBannerUnlockEvaluator`, `BattleStateManager`, `AdventureMapFlowController`) confirmó que: (1) mantener los banners de evento en un array separado de `AdventureMap.Banners` satisface "fuera del flujo secuencial" (FR-004) sin tocar el evaluador ya probado (research.md §1); (2) `BattleStateManager` no tiene ningún punto de acoplamiento con el mapa de aventuras, por lo que "una batalla en curso no se interrumpe al expirar la ventana" (US3/FR-008) se cumple por ausencia de código, no por una guarda nueva (research.md §3); (3) la "propia dificultad" de la fase especial (FR-005) se resuelve con datos de `ChapterDefinition` ya existentes, sin arco de saga activo, sin sistema de multiplicadores nuevo (research.md §4); (4) el contenido jugable (unidades/enemigos) de la fase especial reutiliza el roster ya autorado de `001-chapter1-vertical-slice` (research.md §5), ya que spec.md excluye explícitamente autoría narrativa/arte nueva de su alcance. Lo único genuinamente nuevo es: `EventTimeWindow` (dato), `EventBannerDefinition` (dato, compone `ChapterBannerDefinition`), `EventBannerState`/`EventBannerActivationEvaluator` (lógica pura de activación) y las extensiones mínimas de `AdventureMap`/`AdventureMapFlowController`/UI para exponer un segundo flujo de selección paralelo al ya existente.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que `001`-`014`.

**Primary Dependencies**: Ninguna nueva de terceros. Reutiliza infraestructura real existente (`AdventureMap`, `ChapterBannerDefinition`, `AdventureMapFlowController`, `MissionEnergyController`, `ChapterDefinition`, `BattleStateManager`, `LocalChapterProgressStore`, `LocalPlayerProgressStore`, los 5 `UnitDefinition`/1 `EnemyWaveDefinition` de `001`, los prefabs de `Assets/Prefabs/Battler/`). No se añade ningún paquete de Unity.

**Storage**: Ninguna nueva (research.md §6). El "evento completado" se persiste con el mismo mecanismo que cualquier capítulo (`IChapterProgressStore.SaveChapterOutcome`, `IPlayerProgressStore` para XP/tesoro) — sin campos nuevos en `ProgressSaveData`/`PlayerProgressSaveData`. `EventTimeWindow`/`EventBannerDefinition` son datos de **diseño** (assets `.asset`), no de guardado de partida.

**Testing**: Unity Test Framework, mismo split que el resto del proyecto — EditMode (NUnit puro) para `EventTimeWindow.Contains`/`IsValid`, `EventBannerDefinition.IsValid`, `EventBannerActivationEvaluator.Evaluate` (ventana única, múltiples ventanas no solapadas, ventanas solapadas, sin ventanas, banner null, fechas malformadas, límites inclusivos); PlayMode para `AdventureMapFlowController.TrySelectEventBanner` (activo+energía→navega+descuenta, inactivo→bloquea sin navegar, activo+energía insuficiente→bloquea sin descontar) y un caso que confirma que `BattleStateManager` resuelve la batalla de la fase especial con normalidad sin ninguna referencia al mapa de aventuras (research.md §3).

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); sin restricciones de plataforma adicionales. Reloj del dispositivo como fuente de hora (spec.md Assumptions) — sin llamadas de red.

**Project Type**: Proyecto único de Unity (`the_battler_test`); se extiende la capa de asmdefs ya validada (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`), sin ensamblados nuevos.

**Performance Goals**: Mismo objetivo que el resto — 60 fps estables con hasta ~10 unidades simultáneas en el carril. `EventBannerActivationEvaluator.Evaluate` corre una vez en `AdventureMapFlowController.Awake()` (no por frame), mismo patrón que `ChapterBannerUnlockEvaluator.Evaluate`.

**Constraints**:
- **Sin backend/servicio remoto de horarios**: las ventanas horarias son datos de build; reprogramar el evento requiere una nueva build (spec.md Assumptions, Principio VI). No hay validación contra hora de servidor.
- **`AdventureMap.Banners` (secuencial) no se modifica en absoluto** por esta feature — `EventBanners` es un array nuevo e independiente (research.md §1). Cualquier tarea que toque `ChapterBannerUnlockEvaluator`, `MissionRegionDifficultyValidator` o `ChapterBannerItemView` existentes está fuera de alcance salvo que se demuestre necesario.
- **`BattleStateManager` no gana ninguna dependencia nueva** (research.md §3) — ninguna tarea debe añadir un campo o comprobación relacionada con `EventBannerDefinition`/`EventTimeWindow` a esa clase.
- **Sin gacha, sin economía de rareza, sin cuentas/login/backend**: igual que el resto del proyecto.
- Contenido jugable de la fase especial reutiliza assets ya existentes de `001` (research.md §5) — no se autora arte ni unidades nuevas.

**Scale/Scope**: 2 tipos nuevos de dato (`EventTimeWindow`, `EventBannerDefinition`), 1 clase runtime nueva (`EventBannerState`), 1 función pura nueva (`EventBannerActivationEvaluator`), 1 método nuevo en `AdventureMapFlowController` (`TrySelectEventBanner`) + 1 propiedad (`EventBannerStates`), 1 campo nuevo en `AdventureMap` (`m_EventBanners`), 1 componente View nuevo (`EventBannerItemView`), 1 extensión de `AdventureMapUIController` (segunda pasada de poblado), 1 `ChapterDefinition` de contenido nueva (fase especial, reutilizando roster de 001), 2 `DialogueLine` nuevas, 1 escena de batalla nueva (`SpecialEventMastodonHunt_Battle.unity`, wiring idéntico a Chapter1/Chapter2 sin prefabs nuevos), 1 `EventBannerContentBuilder` (Editor) — orden de magnitud comparable a `006-mission-energy-system` (extensión aditiva sobre 004), no una reescritura.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Narrativa Integrada | La fase especial recibe diálogo pre-batalla **y** post-batalla propios (2 líneas cada uno, research.md §5) — la constitución exige ambos por capítulo, no solo pre-batalla; ninguna batalla de esta feature se lanza sin contexto narrativo mínimo, aunque el guion completo del evento se deja para iteración de contenido posterior (spec.md Assumptions, explícitamente fuera de bloqueo). | PASS |
| II. Combate Automático por Despliegue | Sin impacto — la fase especial usa el mismo `BattleStateManager`/`BattleResourceController`/`UnitDeploymentController` sin ningún cambio de comportamiento; el jugador sigue sin control directo durante el combate. | PASS |
| III. Identidad Visual Animada | Sin impacto — reutiliza unidades ya conformes (5 `UnitDefinition` de 001, ya validadas con idle+ataque+variante visual en su propia spec); esta feature no introduce ninguna unidad jugable nueva. | PASS |
| IV. Progresión por Capítulos con Desbloqueo | El banner de evento es deliberadamente ortogonal a este principio (FR-004: no participa del desbloqueo secuencial) — es contenido adicional programado por horario, no una etapa de la progresión de capítulos. No lo contradice: los capítulos normales (`AdventureMap.Banners`) siguen desbloqueándose exactamente igual, sin verse afectados. | PASS |
| V. Balance Dirigido por Datos | Todo valor nuevo (`EventTimeWindow.Start/End`, `EnergyCost`, `EnemyBaseMaxHealth`/`PlayerBaseMaxHealth`/`XpReward`/`TreasureRewardId` de la `ChapterDefinition` de la fase especial) vive en `ScriptableObject`/campos serializados — nada hardcodeado en `AdventureMapFlowController`/`BattleStateManager`. | PASS |
| VI. Simplicidad desde el MVP | Decisión más significativa de esta feature (research.md §1/§3): resolver "fuera del flujo secuencial" y "no interrumpir batalla en curso" con separación de datos y ausencia de acoplamiento nuevo, en vez de añadir flags/guardas condicionales al código ya probado de 004/013. Sin gacha, sin backend de horarios remoto. | PASS |

No hay violaciones sin justificar. Ninguna entrada en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/015-special-event-banner/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── event-banner-activation.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Model/Battler/
│   ├── EventTimeWindow.cs                          # nuevo [Serializable] (Contains/IsValid)
│   ├── EventBannerDefinition.cs                    # nuevo SO (compone ChapterBannerDefinition + EventTimeWindow[])
│   ├── EventBannerState.cs                         # nuevo, runtime, no serializado
│   └── AdventureMap.cs                              # EXTENDIDO (m_EventBanners, sin FormerlySerializedAs)
│
└── Gameplay/Battler/
    ├── EventBannerActivationEvaluator.cs            # nuevo static class (funcion pura)
    └── AdventureMapFlowController.cs                 # EXTENDIDO (EventBannerStates, TrySelectEventBanner)

Assets/Scripts/View/Battler/
├── EventBannerItemView.cs                           # nuevo (mismo patron que ChapterBannerItemView)
└── AdventureMapUIController.cs                       # EXTENDIDO (segunda pasada de poblado sobre EventBanners)

Assets/Editor/Battler/
└── EventBannerContentBuilder.cs                      # nuevo (datos + escena + validacion, research.md §7)

Assets/ScriptableObjects/Battler/Events/
├── FantasyStagesEventBanner.asset                    # EventBannerDefinition
├── Banner_FantasyStages.asset                        # ChapterBannerDefinition embebido
└── MastodonHuntStage/
    ├── MastodonHuntStage.asset                       # ChapterDefinition (reutiliza roster de Chapter1)
    └── Dialogue/PreBattle/Line01.asset, Line02.asset  # 2 DialogueLine nuevas (research.md §5)

Assets/Scenes/
└── SpecialEventMastodonHunt_Battle.unity              # nueva escena, wiring identico a Chapter1_Battle (sin prefabs nuevos)

Assets/Tests/
├── EditMode/Battler/
│   ├── EventTimeWindowTests.cs
│   ├── EventBannerDefinitionValidationTests.cs
│   └── EventBannerActivationEvaluatorTests.cs
└── PlayMode/Battler/
    ├── AdventureMapEventBannerSelectionPlayModeTests.cs
    └── SpecialEventBattleResolutionPlayModeTests.cs
```

**Structure Decision**: Misma capa `Core → Model → Gameplay → View` que el resto del proyecto, sin ensamblados nuevos. `EventTimeWindow`/`EventBannerDefinition`/`EventBannerState` viven en `TheBattler.Model` (datos + estado, sin `MonoBehaviour`); `EventBannerActivationEvaluator` vive en `TheBattler.Gameplay` como función pura (mismo criterio que `ChapterBannerUnlockEvaluator`); las extensiones de `AdventureMapFlowController`/`AdventureMapUIController` viven donde ya viven esas clases. El contenido nuevo de datos vive en una carpeta hermana (`Events/`) a `Chapter1/`/`EmpireOfCats/`, ya que esta feature introduce un tipo de contenido distinto (evento, no capítulo de saga) — no una extensión de spec 013/014.

## Complexity Tracking

> No hay violaciones de Constitution Check que requieran justificación en esta feature.

Ninguna entrada.

## Post-Design Constitution Re-check

Tras completar Phase 0 ([research.md](./research.md)) y Phase 1 ([data-model.md](./data-model.md), [contracts/event-banner-activation.md](./contracts/event-banner-activation.md), [quickstart.md](./quickstart.md)), se re-evalúan los seis principios contra el diseño concreto:

- Se confirmó contra el código real (`ChapterBannerUnlockEvaluator.cs`, `BattleStateManager.cs`, `AdventureMapFlowController.cs`) que ni el flujo de desbloqueo secuencial ni la escena de batalla ganan ninguna dependencia nueva hacia el sistema de eventos — el diseño es aditivo puro, dos superficies de extensión (`AdventureMap.EventBanners`, `AdventureMapFlowController.TrySelectEventBanner`) que coexisten con las existentes sin modificarlas en su comportamiento (Principio VI).
- El hallazgo de research.md §3 (ninguna guarda nueva necesaria para "no interrumpir batalla en curso") es el mismo tipo de verificación-antes-de-construir que ya premió Principio VI en spec 014 (research.md §2 de esa spec) — de nuevo el diseño final es más simple que la lectura literal ingenua del requisito ("habría que hacer que la batalla verifique el reloj periódicamente").
- Se verificó que reutilizar el roster de unidades de `001-chapter1-vertical-slice` para el contenido jugable de la fase especial no viola Principio III: esas unidades ya cumplen idle+ataque+variante visual por diseño de su propia spec: no se re-declara ni se relaja esa garantía aquí.
- Ningún dato compartido entre capítulos/arcos (`ChapterDefinition` de Chapter1/Chapter2/Corea/Mongolia, `SagaArcDefinition`) se modifica — la `ChapterDefinition` de la fase especial es un asset nuevo e independiente.

No se detectan violaciones nuevas introducidas por el diseño. **Constitution Check: PASS.**
