# Contract: Extensiones de Guardado

Cubre FR-016, FR-017 de spec.md. Ver formas completas en [data-model.md](../data-model.md).

## ProgressSaveData (existente) — diff

```csharp
[Serializable]
public class ProgressSaveData
{
    public int formatVersion = 1; // SIN CAMBIO — ver research.md §8
    public ChapterProgressRecord[] chapters = Array.Empty<ChapterProgressRecord>();
    public SagaArcProgressRecord[] arcs = Array.Empty<SagaArcProgressRecord>(); // nuevo
}

[Serializable]
public class SagaArcProgressRecord
{
    public string arcId;
    public bool rewardsGranted;
}
```

## PlayerProgressSaveData (existente) — diff

```csharp
[Serializable]
public class PlayerProgressSaveData
{
    public int formatVersion = 1; // SIN CAMBIO
    public UnitProgress[] unitProgress = Array.Empty<UnitProgress>();
    public int availableExperience;
    public string[] activeTeamUnitIds = Array.Empty<string>();
    public string[] unlockedBonusUnitIds = Array.Empty<string>(); // nuevo
}
```

## UnitDefinition (existente) — diff

```csharp
// campo nuevo, sin FormerlySerializedAs (no es un renombrado) — mismo criterio que 007/008/009/012
[SerializeField] private UnitRarity m_Rarity; // default: Normal (miembro 0)
public UnitRarity Rarity => m_Rarity;
```

```csharp
namespace TheBattler.Core
{
    public enum UnitRarity
    {
        Normal,
        Special,
        Rare,
        SuperRare,
        UberRare,
        Legend,
        Collaboration
    }
}
```

## Por qué ningún campo nuevo aquí requiere bump de `formatVersion`

`LocalChapterProgressStore.Load()`/el store equivalente de `PlayerProgressSaveData` (`LocalPlayerProgressStore`) descartan el guardado completo si `formatVersion` no coincide con la constante esperada. Todos los campos añadidos en este contrato tienen un inicializador de campo seguro (`Array.Empty<T>()`) que `JsonUtility.FromJson` preserva para cualquier campo ausente en un JSON guardado antes de esta feature (research.md §8) — un guardado de `002`/`005`/`009` sigue cargando sin pérdida de datos, simplemente con `arcs`/`unlockedBonusUnitIds` vacíos hasta que el jugador complete contenido nuevo.

## Tests existentes que deben actualizarse (lista verificada tras `/speckit-analyze`, hallazgo C1)

Cualquier doble de prueba (`EditMode`/`PlayMode`) que implemente `IChapterProgressStore` debe actualizar la firma de `SaveChapterOutcome` de `void` a `bool` y añadir una implementación (aunque sea trivial) de `SaveArcRewardsGranted` para seguir compilando.

La lista original de este contrato ("specs 001/002/004/006/009/010") era una estimación sin verificar contra el código real. Se corrigió con una búsqueda real de `: IChapterProgressStore` en `Assets/Tests/`, que encontró **8 archivos** (dos más de los estimados — `003`/`005` no habían sido considerados en absoluto):

- `Assets/Tests/PlayMode/Battler/BattleLoopPlayModeTests.cs` (`NoOpChapterProgressStore`)
- `Assets/Tests/PlayMode/Battler/BattleProgressIntegrationTests.cs` (`FakeChapterProgressStore`)
- `Assets/Tests/PlayMode/Battler/MainMenuFlowPlayModeTests.cs` (`FakeChapterProgressStore`)
- `Assets/Tests/PlayMode/Battler/AdventureMapFlowPlayModeTests.cs` (`FakeChapterProgressStore`)
- `Assets/Tests/PlayMode/Battler/AdventureMapEnergyFlowPlayModeTests.cs` (`FakeChapterProgressStore`)
- `Assets/Tests/PlayMode/Battler/TeamFormationBattleIntegrationPlayModeTests.cs` (`FakeChapterProgressStore`)
- `Assets/Tests/PlayMode/Battler/UnitEvolutionBattleIntegrationPlayModeTests.cs` (`FakeChapterProgressStore`)
- `Assets/Tests/PlayMode/Battler/Chapter2BattleLoopPlayModeTests.cs` (`NoOpChapterProgressStore`)

Cada uno de estos 8 archivos declara su propia clase privada anidada que implementa `IChapterProgressStore` — no hay un único doble compartido reutilizado entre suites, así que la migración toca los 8 archivos por separado, cada edición mecánica y sin cambio de comportamiento observable (devolver `record == null || !record.isCompleted` capturado antes de la escritura, e implementar `SaveArcRewardsGranted` como no-op si la suite no lo ejercita).
