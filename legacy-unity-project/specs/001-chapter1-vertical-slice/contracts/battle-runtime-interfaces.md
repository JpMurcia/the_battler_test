# Contract: Interfaces de runtime de batalla

Este proyecto no expone una API externa (juego local, single-player). El "contrato" relevante aquí es el conjunto de interfaces C# que desacoplan los sistemas de Gameplay entre sí, para que `UnitRuntime`, `BaseHealth`, `BattleResourceController` y `EnemyWaveSpawner` puedan implementarse y testearse de forma independiente (Testing plan en research.md #5).

## `IDamageable`

Implementado por cualquier cosa que pueda recibir daño en el carril: `UnitRuntime` y `BaseHealth`.

```csharp
public interface IDamageable
{
    int CurrentHealth { get; }
    int MaxHealth { get; }
    void ApplyDamage(int amount);
    bool IsDestroyed { get; } // true cuando CurrentHealth <= 0
}
```

**Regla de contrato**: `ApplyDamage` con `amount <= 0` no debe alterar `CurrentHealth` (protege contra daño negativo/curación implícita no especificada en la spec).

## `IDeployable`

Implementado por `UnitRuntime`: expone lo mínimo que `UnitDeploymentController` necesita para spawnear una unidad a partir de una `UnitDefinition`.

```csharp
public interface IDeployable
{
    void Initialize(UnitDefinition definition, Team team, float lanePosition);
}
```

**Regla de contrato**: `Initialize` se llama exactamente una vez, inmediatamente después de instanciar el prefab, antes de que el objeto reciba su primer `Update`.

## `IBattleResourceSource`

Implementado por `BattleResourceController`; lo consume `DeploymentUIController` para saber si un despliegue es válido (FR-004) y por `UnitDeploymentController` para descontar el coste.

```csharp
public interface IBattleResourceSource
{
    float CurrentAmount { get; }
    bool TrySpend(float amount); // false y sin efecto si CurrentAmount < amount
}
```

**Regla de contrato**: `TrySpend` es atómico — o descuenta el monto completo y devuelve `true`, o no descuenta nada y devuelve `false`. No se permiten descuentos parciales (Edge Case de spec.md: "el despliegue debe rechazarse sin penalización y sin descontar recurso parcial").

## `IBattleOutcomeListener`

Implementado por el controlador de flujo de la escena (el que dispara el diálogo post-batalla). Se suscribe a `BaseHealth` de ambas bases.

```csharp
public enum BattleOutcome { InProgress, Victory, Defeat }

public interface IBattleOutcomeListener
{
    void OnBattleOutcomeChanged(BattleOutcome outcome);
}
```

**Regla de contrato**: el emisor (`BattleStateManager` en `Assets/Scripts/Gameplay/Battler/`, vía `BattleOutcomeResolver`) comprueba primero si la base del jugador está destruida; si lo está, el resultado es `Defeat` sin importar el estado de la base enemiga. Solo si la base del jugador sigue en pie se comprueba la base enemiga para emitir `Victory`. Esto significa que si ambas bases llegan a 0 en el mismo tick, el resultado emitido es `Defeat` (regla de desempate de spec.md, Edge Cases).

## `IDialogueSequencePlayer`

Implementado por `DialoguePlaybackController`; usado tanto para `preBattleDialogue` como `postBattleDialogue` de `ChapterDefinition`.

```csharp
public interface IDialogueSequencePlayer
{
    void Play(IReadOnlyList<DialogueLine> lines, Action onComplete);
}
```

**Regla de contrato**: mientras `Play` no ha invocado `onComplete`, el despliegue de unidades debe estar deshabilitado (FR-001: el diálogo pre-batalla se reproduce "antes de permitir el despliegue de unidades").
