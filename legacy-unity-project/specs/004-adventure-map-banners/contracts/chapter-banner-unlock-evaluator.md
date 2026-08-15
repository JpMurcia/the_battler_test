# Contract: ChapterBannerUnlockEvaluator

Capa: `TheBattler.Gameplay` (lógica pura, sin dependencias de motor — mismo precedente que `BattleOutcomeResolver` de `001-chapter1-vertical-slice`).

## Firma

```csharp
public static class ChapterBannerUnlockEvaluator
{
    public static ChapterBannerState[] Evaluate(
        ChapterBannerDefinition[] orderedBanners,
        ProgressSaveData progress);
}
```

## `ChapterBannerState[] Evaluate(ChapterBannerDefinition[] orderedBanners, ProgressSaveData progress)`

- **Precondición**: `orderedBanners` no es `null` (puede ser un array vacío, aunque `AdventureMap` ya valida que no lo sea — data-model.md). `progress` no es `null` — quien llama es responsable de pasar el resultado de `IChapterProgressStore.Load()`, que **nunca** devuelve `null` ni un `progress.chapters` nulo (contrato ya garantizado por `IChapterProgressStore`, 002).
- **Comportamiento**: para cada índice `i` de `orderedBanners`, en orden:
  1. `isCompleted[i]` = `orderedBanners[i].LinkedChapter != null` **y** existe un elemento en `progress.chapters` con `chapterId == orderedBanners[i].LinkedChapter.ChapterId` y `isCompleted == true`.
  2. `isUnlocked[i]` = `i == 0` **o** `isCompleted[i - 1] == true`.
  3. `isSelectable[i]` = `isUnlocked[i] && orderedBanners[i].HasPlayableDestination`.
  4. Devuelve un `ChapterBannerState` por índice, en el mismo orden que `orderedBanners` (`ChapterBannerState.bannerIndex == i`).
- **Postcondición**: el array devuelto tiene la misma longitud que `orderedBanners`. La función es **pura**: no muta `orderedBanners` ni `progress`, no tiene efectos secundarios, y llamarla dos veces con los mismos argumentos produce el mismo resultado (no depende de reloj, aleatoriedad ni estado externo).
- **Casos borde**:
  - `orderedBanners` vacío → devuelve un array vacío, sin lanzar excepción.
  - `progress.chapters` vacío (sin progreso, o progreso corrupto ya normalizado por `IChapterProgressStore.Load()` a "sin progreso" — FR-008) → solo el índice `0` queda `isUnlocked == true`; todos los demás `isUnlocked == false`.
  - Un banner con `LinkedChapter == null` en cualquier posición → su propio `isCompleted` siempre es `false` (nunca puede "completarse" sin capítulo vinculado), lo que mantiene bloqueado a todo lo que venga después de él en el orden, hasta que reciba un `LinkedChapter` real.

## Motivo de esta abstracción

Aislar el cálculo de desbloqueo en una función estática pura (sin `MonoBehaviour`, sin `IChapterProgressStore` inyectado dentro de ella) permite testearla en EditMode con `NUnit` puro, construyendo `ChapterBannerDefinition`/`ProgressSaveData` de prueba en memoria, sin escena ni Editor de Unity cargando assets reales — mismo motivo y mismo patrón que `BattleOutcomeResolver` (001).

## Doble de test

No requiere doble de test: al ser una función pura y estática, los tests EditMode (`ChapterBannerUnlockEvaluatorTests`) la invocan directamente con instancias de `ChapterBannerDefinition` creadas vía `ScriptableObject.CreateInstance<T>()` en memoria y objetos `ProgressSaveData` construidos a mano — no hay nada que doblar.
