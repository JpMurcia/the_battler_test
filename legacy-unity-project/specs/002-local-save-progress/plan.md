# Implementation Plan: Guardado Local de Progreso

**Branch**: `002-local-save-progress` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-local-save-progress/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Persistir localmente, sin cuentas ni backend, si el jugador completó cada capítulo y el resultado (Victoria/Derrota) de su intento más reciente, y cargar ese estado automáticamente al iniciar el juego. Enfoque técnico: un archivo JSON en `Application.persistentDataPath`, escrito de forma atómica (temp file + reemplazo) y leído de forma tolerante a archivos ausentes o corruptos, detrás de una interfaz `IChapterProgressStore` en la capa Model, con una implementación de archivo en la capa Gameplay que `BattleStateManager` invoca en el único punto donde ya resuelve Victoria/Derrota.

## Technical Context

**Language/Version**: C# (Unity 6000.3.20f1 scripting runtime), mismo proyecto que el Capítulo 1

**Primary Dependencies**: APIs del propio motor únicamente — `System.IO`, `UnityEngine.JsonUtility`, `UnityEngine.Application.persistentDataPath`. No se añade ningún paquete nuevo.

**Storage**: Archivo JSON local en `Application.persistentDataPath` (p. ej. `progress.json`); ruta inyectable para que el servicio sea testeable sin tocar el guardado real del usuario.

**Testing**: Unity Test Framework, mismo split que el Capítulo 1 — EditMode (NUnit puro) para el servicio de guardado, PlayMode para verificar que `BattleStateManager` invoca el guardado al resolver la batalla.

**Target Platform**: El mismo definido por el proyecto (Unity 6000.3.20f1, URP 2D); esta feature no introduce restricciones de plataforma adicionales.

**Project Type**: Proyecto único de Unity (`the_battler_test`); no se crea ningún módulo/proyecto nuevo, se extiende la estructura de asmdefs existente (Core→Model→Gameplay→View).

**Performance Goals**: SC-002 — cargar el progreso al iniciar en menos de 1 segundo (archivo JSON de pocos KB, en la práctica instantáneo).

**Constraints**: Sin llamadas de red ni cuentas de usuario (FR-008); nunca debe bloquear el arranque ni lanzar una excepción no controlada ante un guardado ausente o corrupto (FR-004/FR-005).

**Scale/Scope**: Hoy existe 1 capítulo (Capítulo 1); el modelo de datos debe admitir añadir más `ChapterProgressRecord` sin cambios estructurales (FR-009). Un único slot de guardado local, sin perfiles múltiples.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A para esta feature — no toca diálogos ni contenido narrativo. Sin conflicto. |
| II. Combate Automático por Despliegue | N/A — no cambia reglas de combate; solo observa su resultado final (Victoria/Derrota) ya calculado por `BattleOutcomeResolver`. Sin conflicto. |
| III. Identidad Visual Animada | N/A — no introduce unidades ni assets visuales. Sin conflicto. |
| IV. Progresión por Capítulos con Desbloqueo | Alineación parcial e intencional: esta feature solo registra qué capítulo se completó y con qué resultado; **no implementa la lógica de desbloqueo/gating** en sí (bloquear acceso al Capítulo 2, etc.), porque el Capítulo 2 aún no existe/no tiene spec. Es el cimiento de datos sobre el que un futuro spec de "selección de capítulo/desbloqueo" se apoyará. No contradice el principio, lo prepara. |
| V. Balance Dirigido por Datos | Consistente: reutiliza `ChapterDefinition.chapterId` (ya en Model, ya en un ScriptableObject) como clave de capítulo en vez de inventar un identificador nuevo. El guardado en sí es estado de partida (no balance de diseño), por eso vive en clases planas de Model/Gameplay, no en un ScriptableObject — mismo patrón ya usado para `BattleResourceState`/`DeploymentSlotState`. |
| VI. Simplicidad desde el MVP | Fuerte alineación: un solo slot de guardado, JSON simple, sin cuentas, sin nube, sin sistema de desbloqueo todavía — exactamente el alcance mínimo pedido. |

Sin violaciones que requieran justificación en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-local-save-progress/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
Assets/Scripts/
├── Model/Battler/
│   ├── ChapterProgressRecord.cs         # nuevo — dato plano: chapterId, isCompleted, lastOutcome
│   ├── ProgressSaveData.cs              # nuevo — agregado: formatVersion + lista de ChapterProgressRecord
│   └── IChapterProgressStore.cs         # nuevo — contrato Load()/Save()/ClearProgress()
├── Gameplay/Battler/
│   ├── LocalChapterProgressStore.cs     # nuevo — implementación de archivo JSON (System.IO + JsonUtility)
│   └── BattleStateManager.cs            # modificado — inyecta IChapterProgressStore, guarda en SetOutcome()

Assets/Tests/
├── EditMode/Battler/
│   └── LocalChapterProgressStoreTests.cs   # nuevo — round-trip, sin archivo, archivo corrupto, clear
└── PlayMode/Battler/
    └── BattleLoopPlayModeTests.cs          # modificado — verifica que Victory/Defeat invoque el store inyectado
```

**Structure Decision**: Se reutiliza la capa de asmdefs ya existente del Capítulo 1 (`TheBattler.Core` → `TheBattler.Model` → `TheBattler.Gameplay` → `TheBattler.View`); no se crea ningún ensamblado nuevo. El contrato y los datos van en Model (igual que `ChapterDefinition`, del que se reutiliza `chapterId`); la implementación con I/O de archivo va en Gameplay (igual que el resto de estado de runtime, p. ej. `BattleResourceController`), y se inyecta en `BattleStateManager` en vez de que este último toque el sistema de archivos directamente.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — tabla omitida.

## Post-Design Constitution Re-check

*Tras completar research.md, data-model.md, contracts/ y quickstart.md (Fase 1).*

El diseño final (interfaz `IChapterProgressStore` en Model, implementación de archivo en Gameplay, gancho único en `BattleStateManager.SetOutcome()`, reutilización de `chapterId`/`BattleOutcome` existentes) no introdujo ninguna dependencia, capa o mecanismo que no estuviera ya contemplado en el Constitution Check inicial. Las 6 evaluaciones de la tabla anterior se mantienen sin cambios. Sigue sin haber violaciones ni necesidad de Complexity Tracking.
