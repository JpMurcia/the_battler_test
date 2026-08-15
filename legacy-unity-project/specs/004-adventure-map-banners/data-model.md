# Data Model: Mapa de Aventuras (Banners) y Desbloqueo Secuencial

Las entidades marcadas **[SO]** son ScriptableObjects (datos de diseño, Principio V). Las marcadas **[Runtime]** son estado calculado en memoria al entrar al mapa — no se serializan como asset de diseño ni se persisten en disco (ver research.md §2).

## ChapterBannerDefinition **[SO]**

Representa un banner de capítulo/aventura dentro del mapa. Vive en `TheBattler.Model`, mismo nivel que `ChapterDefinition`.

| Campo | Tipo | Descripción |
|---|---|---|
| `linkedChapter` | `ChapterDefinition` (nullable) | Referencia al capítulo existente (001) cuyo contenido representa este banner. `null` cuando el contenido de batalla todavía no está especificado (p. ej. "Hacia el Futuro" hoy). **No se duplica** ningún campo de `ChapterDefinition` aquí (ver research.md §1). |
| `targetSceneName` | `string` | Nombre de la escena de Unity a cargar (vía `ISceneNavigator.LoadScene`) al seleccionar este banner. Solo tiene sentido cuando `linkedChapter != null`. |
| `displayNameKey` | `string` | Clave de `LocalizedTextTable` (003) para el nombre visible del banner (p. ej. `"banner.chapter1.name"`, `"banner.hacia-el-futuro.name"`). No es el texto en sí — se resuelve en la capa View contra la tabla ya existente. |
| `bannerArt` | `Sprite` (opcional) | Arte de presentación del banner en el mapa. Puramente visual; `null` es válido (se muestra un placeholder), no hay requisito de animación (Principio III no aplica a banners de mapa — ver plan.md Constitution Check). |

**Propiedades derivadas** (no son campos serializados, se calculan sobre los de arriba):

| Propiedad | Tipo | Cálculo |
|---|---|---|
| `ChapterId` | `string` (nullable) | `linkedChapter != null ? linkedChapter.ChapterId : null`. Clave usada para buscar el `ChapterProgressRecord` correspondiente en `ProgressSaveData` (002). |
| `HasPlayableDestination` | `bool` | `linkedChapter != null`. Distingue "no seleccionable porque el contenido no existe todavía" (FR-005) de "no seleccionable porque está bloqueado por progreso" (FR-003) — ver `ChapterBannerState` más abajo. |

**Reglas de validación** (ver [contracts/chapter-banner-definition.md](./contracts/chapter-banner-definition.md)):
- `displayNameKey` no puede ser vacío o nulo (se necesita para resolver el nombre en cualquier idioma).
- Si `linkedChapter != null`, `targetSceneName` no puede ser vacío o nulo (un banner con contenido jugable real siempre debe saber a qué escena navegar).
- Si `linkedChapter == null`, `targetSceneName` se ignora en tiempo de ejecución (nunca se lee, porque `HasPlayableDestination` ya es `false` y bloquea la selección antes de llegar a usarlo) — por convención debería quedar vacío, pero no es un error runtime si no lo está.

## AdventureMap **[SO]**

Colección ordenada de `ChapterBannerDefinition` que se muestra y recorre en el mapa. Vive en `TheBattler.Model`.

| Campo | Tipo | Descripción |
|---|---|---|
| `banners` | `ChapterBannerDefinition[]` | Lista ordenada de banners. **El orden del array es la secuencia de desbloqueo** (índice 0 = primer banner, siempre desbloqueado; índice `i` depende de que el capítulo del índice `i - 1` esté completado) — FR-007. |

**Reglas de validación**:
- `banners` no puede estar vacío (el mapa siempre debe mostrar al menos un banner, FR-001).
- No se exige que todos los elementos tengan `linkedChapter != null` — de hecho el segundo banner de esta feature ("Hacia el Futuro") no lo tiene.
- No se valida unicidad de `ChapterId` entre banners como regla dura de esta feature (dos banners nunca deberían compartir el mismo `linkedChapter`, pero no hay hoy un escenario de diseño donde eso ocurra; si llegara a pasar, el evaluador simplemente trataría a ambos como "completados juntos", sin lanzar excepción).

## ChapterBannerState **[Runtime]**

Estado calculado para un banner concreto en el momento de entrar al mapa. Producido por `ChapterBannerUnlockEvaluator.Evaluate(...)` (ver [contracts/chapter-banner-unlock-evaluator.md](./contracts/chapter-banner-unlock-evaluator.md)); no se serializa ni persiste.

| Campo | Tipo | Notas |
|---|---|---|
| `bannerIndex` | `int` | Índice dentro de `AdventureMap.Banners`, usado por `AdventureMapFlowController.TrySelectBanner(index)`. |
| `isUnlocked` | `bool` | `true` en el índice `0`; en cualquier otro índice, `true` solo si el banner anterior está completado (research.md §3). |
| `isCompleted` | `bool` | `true` solo si el banner tiene `linkedChapter != null` y existe un `ChapterProgressRecord` con `isCompleted == true` para su `ChapterId` (002). |
| `isSelectable` | `bool` derivado | `isUnlocked && definition.HasPlayableDestination`. Ver Edge Case de spec.md: "Hacia el Futuro" puede llegar a tener `isUnlocked == true` sin ser nunca `isSelectable` hasta que reciba un `linkedChapter` real. |

**Transiciones**: no hay transiciones en el sentido de máquina de estados — `ChapterBannerState[]` se recalcula por completo cada vez que `AdventureMapFlowController.Awake()` se ejecuta (cada vez que se entra a la escena del mapa), a partir de la lectura fresca de `IChapterProgressStore.Load()`. No hay estado que sobreviva entre dos entradas al mapa fuera de lo que ya persiste `ProgressSaveData` (002).

## Relación con entidades existentes

- **`ChapterDefinition` (001)**: `ChapterBannerDefinition.linkedChapter` referencia directamente el asset existente; no se le añade ningún campo nuevo (no se toca `ChapterDefinition.cs`). El `ChapterId` que ya expone (`ChapterDefinition.ChapterId`) es la única fuente de verdad para relacionar un banner con su progreso.
- **`ProgressSaveData` / `ChapterProgressRecord` / `IChapterProgressStore` (002)**: se leen tal cual, sin modificación, únicamente para derivar `ChapterBannerState.isCompleted`/`isUnlocked` (FR-006). Ningún campo ni método nuevo se añade a estos tipos.
- **`MenuSettings` / `IMenuSettingsStore` / `LocalizedTextTable` (003)**: se reutilizan en modo lectura para resolver `ChapterBannerDefinition.displayNameKey` al idioma activo (`MenuSettings.language`), sin cambios a esos tipos (ver research.md §5-6). `ISceneNavigator` (003) se reutiliza sin cambios para la navegación al seleccionar un banner.
- **`BattleOutcome` (001, Core)**: indirectamente, vía `ChapterProgressRecord.lastOutcome` (002) — esta feature no lo consulta directamente, solo `ChapterProgressRecord.isCompleted` (ya derivado por 002 como `lastOutcome == Victory`).
