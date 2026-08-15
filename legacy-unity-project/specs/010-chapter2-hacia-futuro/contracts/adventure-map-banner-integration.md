# Contract: Integración con el banner "Hacia el Futuro" (`004-adventure-map-banners`)

Documenta el ajuste exacto que esta feature requiere sobre `004-adventure-map-banners` (FR-008/FR-009 de esta spec; Edge Cases de spec.md) para que el banner "Hacia el Futuro" pase de "visible-pero-no-seleccionable" a "desbloqueado tras completar el Capítulo 1". Ver research.md §5 para el hallazgo completo. **Es un cambio de datos, no de código** — no se modifica ningún archivo `.cs` de `004`.

## Estado de partida

`004` diseñó `ChapterBannerDefinition.HasPlayableDestination` como propiedad **derivada**: `LinkedChapter != null` (ver `specs/004-adventure-map-banners/contracts/chapter-banner-definition.md`). El asset `Assets/Data/Battler/MainAdventureMap.asset` (instancia de `AdventureMap`, `004`) tiene hoy, en su segundo elemento de `Banners[]` (el banner "Hacia el Futuro"), `LinkedChapter == null` y `TargetSceneName` vacío — por eso `HasPlayableDestination == false` y el banner nunca es seleccionable, con independencia del progreso del jugador (FR-005 de `004`), exactamente como esa spec documentó desde el principio como comportamiento esperado mientras "Hacia el Futuro" no tuviera contenido.

**Precondición**: este contrato solo es aplicable una vez que `004-adventure-map-banners` esté implementado en C# (`ChapterBannerDefinition.cs`, `AdventureMap.cs`, `MainAdventureMap.asset` existentes) — ver research.md §2 sobre el estado actual (todavía no implementado a la fecha de este plan).

## Cambio requerido

Sobre el segundo elemento de `Banners[]` en `Assets/Data/Battler/MainAdventureMap.asset`:

| Campo | Valor antes (según `004` plan.md) | Valor después (integración de esta feature) |
|---|---|---|
| `linkedChapter` | `null` | `Chapter2.asset` (`Assets/ScriptableObjects/Battler/Chapter2/Chapter2.asset`, esta feature) |
| `targetSceneName` | vacío | `"Chapter2_Battle"` |
| `displayNameKey` | `"banner.hacia-el-futuro.name"` (ya definido por `004`) | sin cambio |
| `bannerArt` | opcional, ya definido o no por `004` | sin cambio (fuera de alcance de esta feature) |

Efecto derivado, sin ninguna acción de código adicional:

- `HasPlayableDestination` pasa de `false` a `true` (recalculada automáticamente, es una propiedad, no un campo serializado — `004` contracts/chapter-banner-definition.md).
- `ChapterId` (derivada) pasa de `null` a `"chapter_2"` (`Chapter2.asset.chapterId` — data-model.md de esta feature), habilitando que `ChapterBannerUnlockEvaluator.Evaluate(...)` (`004`) pueda calcular `isCompleted`/`isUnlocked` correctamente para este banner en corridas futuras, una vez exista un `ChapterProgressRecord` con `chapterId == "chapter_2"`.
- El test de validación de datos de `004` (`ChapterBannerDefinitionValidationTests`, regla "si `LinkedChapter != null`, `TargetSceneName` no puede ser vacío") pasa a aplicar y a exigir que `TargetSceneName` esté asignado — cumplido por el valor de la tabla de arriba.

## Verificación (User Story 2 de esta spec, FR-008/FR-009)

Una vez aplicado el cambio de datos de arriba:

1. Con `progress.json` indicando `chapter_1` completado, `ChapterBannerUnlockEvaluator.Evaluate(...)` (`004`) debe devolver `isUnlocked == true` para el banner en índice `1` (ya lo hacía antes de este cambio, por posición) **y ahora también** `isSelectable == true` (antes `false`, por `HasPlayableDestination == false`).
2. Seleccionar el banner navega, vía `ISceneNavigator.LoadScene("Chapter2_Battle")` (`AdventureMapFlowController.TrySelectBanner`, `004`), a la escena de esta feature.
3. Con `chapter_1` no completado, el banner sigue `isUnlocked == false` (sin cambio de comportamiento respecto a hoy — el desbloqueo por progreso es independiente de este ajuste).

## Fuera de alcance de este contrato

- Asignar `Region`/`DifficultyRank`/`EnergyCost` al banner del Capítulo 2 (`006-mission-energy-system`) — depende de que `006` esté implementado; se documenta como nota de integración futura equivalente en data-model.md de esta feature, no se resuelve aquí.
- Cualquier cambio al mecanismo genérico de desbloqueo secuencial de `004` (`ChapterBannerUnlockEvaluator`) — no se toca, ya funciona por posición/progreso sin necesitar ajuste.
