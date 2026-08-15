# Data Model: Guardado Local de Progreso

## ChapterProgressRecord

Registro de progreso de un único capítulo.

| Campo | Tipo | Descripción |
|---|---|---|
| `chapterId` | `string` | Identificador del capítulo; mismo valor que `ChapterDefinition.chapterId` (Model, feature 001). |
| `isCompleted` | `bool` | `true` si el intento más reciente resolvió en Victoria. |
| `lastOutcome` | `enum` (`Victory` \| `Defeat`) | Resultado del intento más reciente. Se reutiliza el `BattleOutcome` existente (Core/Gameplay, feature 001), excluyendo `InProgress` (un registro solo se crea/actualiza cuando la batalla ya se resolvió — ver Edge Cases del spec). |

**Reglas de validación**:
- `chapterId` no puede ser vacío o nulo al guardarse (si `ChapterDefinition.chapterId` está vacío, eso es un error de datos de diseño anterior a este feature, no algo que este sistema deba tolerar en escritura).
- `isCompleted` es `true` si y solo si `lastOutcome == Victory` (Derrota nunca marca el capítulo como completado — FR-001, User Story 1 Escenario 2).

## ProgressSaveData

Agregado raíz que se serializa a JSON tal cual.

| Campo | Tipo | Descripción |
|---|---|---|
| `formatVersion` | `int` | Versión del esquema de guardado. Empieza en `1`. Permite detectar guardados de un formato futuro/desconocido y tratarlos como "sin progreso" en vez de intentar parsearlos a la fuerza. |
| `chapters` | `ChapterProgressRecord[]` | Lista de registros, uno por capítulo con al menos un intento resuelto. Vacía en una instalación nueva. |

**Reglas de validación**:
- A lo sumo un `ChapterProgressRecord` por `chapterId` (FR-006: repetir un capítulo actualiza su registro existente, no añade uno nuevo).
- Un `formatVersion` desconocido o un JSON que no deserializa a esta forma se trata como equivalente a "archivo ausente" (`chapters` vacío) — nunca lanza una excepción hacia quien llama a `Load()`.

## IChapterProgressStore (contrato)

Ver [contracts/chapter-progress-store.md](./contracts/chapter-progress-store.md) para la interfaz completa.

## Relación con entidades existentes (feature 001)

- `ChapterProgressRecord.chapterId` referencia por valor (no por objeto) a `ChapterDefinition.chapterId` — no se añade ninguna dependencia nueva de Gameplay/Model hacia asset ScriptableObject alguno; el guardado no necesita cargar `ChapterDefinition` para funcionar, solo el string id que `BattleStateManager` ya tiene en memoria vía su `chapterDefinition` asignado.
- `ChapterProgressRecord.lastOutcome` reutiliza el `enum BattleOutcome` ya definido (feature 001), restringido a `Victory`/`Defeat` en el momento de guardar (nunca se persiste `InProgress`).
