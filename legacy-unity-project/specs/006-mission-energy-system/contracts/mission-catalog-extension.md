# Contract: Extensión del catálogo de misiones (Region + ChapterBannerDefinition)

Capa: `TheBattler.Model`. Extiende datos de diseño ya planeados en 004 (`ChapterBannerDefinition`, `AdventureMap`), sin modificar su forma existente — ver data-model.md de esta feature para el detalle campo por campo.

## Forma extendida de ChapterBannerDefinition

```csharp
public class ChapterBannerDefinition : ScriptableObject
{
    // --- Campos ya definidos en 004 (sin cambios) ---
    public ChapterDefinition LinkedChapter { get; }
    public string TargetSceneName { get; }
    public string DisplayNameKey { get; }
    public Sprite BannerArt { get; }
    public string ChapterId { get; }               // derivado
    public bool HasPlayableDestination { get; }     // derivado

    // --- Campos nuevos de esta feature (006) ---
    public int EnergyCost { get; }
    public Region Region { get; }                   // nullable
    public int DifficultyRank { get; }
}
```

## Forma de Region

```csharp
public class Region : ScriptableObject
{
    public string RegionId { get; }
    public string DisplayNameKey { get; }
}
```

## `EnergyCost`

- **Validación de datos (Editor/EditMode)**: `EnergyCost >= 0`. Un banner con `EnergyCost` negativo es un error de datos de diseño, detectable en un test EditMode que recorra los assets `ChapterBannerDefinition` del proyecto (mismo patrón que `ChapterBannerDefinitionValidationTests`, 004).
- **Uso**: entrada de `MissionEnergyController.TryEnterMission(banner.EnergyCost)` (ver contracts/mission-energy-controller.md) — se lee en el momento de selección, nunca se cachea.

## `Region` / `DifficultyRank`

- **Validación de datos (Editor/EditMode)**:
  1. `DifficultyRank >= 0`.
  2. Para cada `Region` distinta referenciada por al menos un banner de un `AdventureMap.Banners` dado: al filtrar `AdventureMap.Banners` por `banner.Region == esaRegión` preservando el orden del array original, la secuencia de `DifficultyRank` resultante debe ser no decreciente (`DifficultyRank[i] >= DifficultyRank[i-1]` para cada par de índices consecutivos dentro de esa subsecuencia filtrada) — FR-009.
  3. Una subsecuencia de longitud `0` o `1` cumple la regla trivialmente (Edge Case de spec.md: una región con una sola misión, como el Capítulo 1 hoy).
  4. Un banner con `Region == null` queda excluido de la regla 2 (no pertenece a ninguna subsecuencia).
- **Regla explícita de independencia entre regiones** (Acceptance Scenario 2, Historia 4 de spec.md): la validación anterior nunca compara `DifficultyRank` de banners de regiones distintas entre sí — cada subsecuencia se evalúa de forma completamente independiente, así que el `DifficultyRank` inicial de una región nueva no tiene ninguna relación obligatoria con el `DifficultyRank` final de la región anterior en `AdventureMap.Banners`.

## Motivo de no introducir un array ordenado propio en `Region`

Ver research.md §5: reutilizar el orden ya existente de `AdventureMap.Banners` (004) para derivar la secuencia interna de cada región evita mantener dos fuentes de verdad sobre "en qué orden van las misiones" — una en `AdventureMap.Banners` (desbloqueo) y otra en un `Region.missions[]` propio (dificultad), que podrían desincronizarse si se reordena una sin la otra.

## Doble de test

`MissionRegionDifficultyValidationTests` (EditMode) construye `ChapterBannerDefinition`/`Region`/`AdventureMap` de prueba vía `ScriptableObject.CreateInstance<T>()` en memoria (mismo patrón que `ChapterBannerDefinitionValidationTests`, 004) — sin necesidad de assets reales en disco ni escena. Casos cubiertos: secuencia estrictamente creciente dentro de una región pasa; secuencia con dos valores iguales consecutivos pasa (regla es "igual o mayor"); una región con un solo banner pasa trivialmente; un valor decreciente dentro de la misma región falla; dos regiones distintas intercaladas en `AdventureMap.Banners` con dificultades que "bajan" al cambiar de región no fallan (cada región se evalúa por separado); un banner con `Region == null` no participa ni hace fallar ninguna validación.
