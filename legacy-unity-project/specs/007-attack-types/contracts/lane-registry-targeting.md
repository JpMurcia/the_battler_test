# Contract: LaneRegistry — consultas de targeting

Capa: `TheBattler.Gameplay`. `LaneRegistry` (`Assets/Scripts/Gameplay/Battler/LaneRegistry.cs`) es un registro estático en memoria ya existente desde `001-chapter1-vertical-slice`; esta feature añade dos métodos junto a los ya existentes, sin tocar su forma pública actual.

## API existente (sin cambios)

```csharp
public static void Register(ILaneOccupant occupant);
public static void Unregister(ILaneOccupant occupant);
public static void Clear();
public static ILaneOccupant FindNearestTarget(Team seekerTeam, float seekerLanePosition, float maxRange);
```

Sigue siendo el mecanismo de adquisición de objetivo de `AttackType.SingleTarget` (y, como comprobación de presencia, de `AttackType.Area` — ver [unit-attack-type-behavior.md](./unit-attack-type-behavior.md) y research.md §4). Sin cambios de firma ni de comportamiento.

## Nuevo: `FindFarthestTarget`

```csharp
public static ILaneOccupant FindFarthestTarget(Team seekerTeam, float seekerLanePosition, float maxRange);
```

- **Precondición**: ninguna adicional a `FindNearestTarget` — `seekerTeam` es el equipo de quien busca, `seekerLanePosition` su posición actual en el carril, `maxRange` su alcance máximo (`UnitDefinition.Range`).
- **Comportamiento**: recorre los mismos `ILaneOccupant` registrados que `FindNearestTarget` (excluye `null`, destruidos y del mismo `seekerTeam`), calculando `distance = Mathf.Abs(occupant.LanePosition - seekerLanePosition)` igual que hoy, pero se queda con el ocupante de **mayor** `distance` dentro de `maxRange`, en vez de menor.
- **Postcondición**:
  - Ningún ocupante enemigo dentro de `maxRange` → devuelve `null` (mismo contrato que `FindNearestTarget`).
  - Exactamente un ocupante enemigo dentro de `maxRange` → lo devuelve (mismo resultado que `FindNearestTarget` en ese caso: con un único candidato, "más lejano" y "más cercano" coinciden — cubre el edge case implícito de FR-006 cuando solo hay un enemigo).
  - Dos o más ocupantes enemigos dentro de `maxRange` → devuelve el de mayor distancia, cumpliendo FR-006 ("puede dañar a un enemigo más allá del más cercano").
  - En caso de empate exacto de distancia entre dos candidatos, se devuelve el primero encontrado en el orden de iteración de `s_Occupants` (mismo criterio de desempate implícito que ya usa `FindNearestTarget`, sin garantía de estabilidad adicional — no hay ningún FR/SC que exija una regla de desempate específica).

## Nuevo: `FindAllTargetsInRange`

```csharp
public static void FindAllTargetsInRange(Team seekerTeam, float seekerLanePosition, float maxRange, List<ILaneOccupant> results);
```

- **Precondición**: `results` no es `null` — es un buffer propiedad de quien llama, reutilizable entre invocaciones (ver research.md §5, evitar asignaciones por ataque).
- **Comportamiento**:
  1. `results.Clear()`.
  2. Recorre `s_Occupants` con el mismo filtro que `FindNearestTarget`/`FindFarthestTarget` (excluye `null`, destruidos, mismo `seekerTeam`) y añade a `results` cada ocupante cuya `distance` (igual fórmula) sea `<= maxRange`.
  - No asigna ninguna colección nueva — escribe únicamente sobre `results`. El orden de los elementos añadidos no está garantizado ni es relevante (FR-005 exige que **todos** reciban daño en el mismo ataque, no un orden específico).
- **Postcondición**: `results` contiene cero o más elementos (nunca queda `null`); cero elementos significa "ningún enemigo en rango en este instante", equivalente al caso `FindNearestTarget(...) == null`.

## Motivo de esta extensión

`UnitRuntime.Attack()` (001) ya resuelve "a quién daño" consultando `LaneRegistry` con un único candidato (`FindNearestTarget`). Ataque de Área (FR-005) necesita "a todos los candidatos en rango" y Larga Distancia (FR-006) necesita "el candidato más lejano en vez del más cercano" — ambas son variaciones del mismo recorrido ya implementado en `FindNearestTarget`, así que se añaden como métodos hermanos en el mismo registro estático, en vez de introducir un tipo de consulta genérico parametrizable (rechazado en research.md §1 por sobre-ingeniería para 3 casos fijos).

## Doble de test

`LaneRegistryTargetingTests` (EditMode) usa implementaciones mínimas en memoria de `ILaneOccupant` (posición y equipo fijos, `IsDestroyed` controlable) registradas directamente vía `LaneRegistry.Register`, sin ningún `MonoBehaviour` ni escena — mismo enfoque que tendría un test directo de `FindNearestTarget` si existiera hoy. Casos cubiertos: sin ocupantes enemigos en rango (`null` / lista vacía), un único ocupante en rango, varios ocupantes en rango con distancias distintas, un ocupante justo en el límite de `maxRange`, un ocupante del mismo equipo (excluido), un ocupante destruido (excluido).
