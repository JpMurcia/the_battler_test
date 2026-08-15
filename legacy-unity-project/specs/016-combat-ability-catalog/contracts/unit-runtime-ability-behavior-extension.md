# Contract: UnitRuntime — extensión de `Update()`/`Move()` para Congelar y Ralentizar

Capa: `TheBattler.Gameplay`. Extiende el contrato ya fijado por `specs/007-attack-types/contracts/unit-attack-type-behavior.md` y `specs/008-classification-trait-abilities/contracts/unit-runtime-ability-behavior.md`, sin alterar lo que esos documentos ya describen (adquisición de objetivo por `AttackType`, guard de `IsCursed` sobre habilidades propias).

## `Update()` — guard de Congelar, antes de cualquier otra lógica del frame

```csharp
private void Update()
{
    if (m_Source == null || IsDestroyed) return;

    // Descuento de los 4 temporizadores de efecto (Curse de 008 + los 3 nuevos) — siempre,
    // incluso si la unidad está congelada: un efecto no dejar de expirar porque otro esté activo.
    TickEffectTimers();

    if (IsFrozen) return; // nuevo — ninguna adquisición de objetivo, ningún Move()/Attack() este frame.

    // Resto de Update() sin cambios respecto a 007/008: adquisición de objetivo por AttackType,
    // Attack() si hasTarget, Move() en caso contrario.
    ...
}
```

**Por qué el guard de `IsFrozen` va después de `TickEffectTimers()` y no antes**: si fuera antes, una unidad congelada nunca vería decrementar su propio `m_FreezeRemainingSeconds` (ni `m_WeakenRemainingSeconds`/`m_SlowRemainingSeconds`, que corren en paralelo) — quedaría congelada para siempre. El orden correcto es: descontar todos los temporizadores primero, y solo después decidir si este frame se salta el resto del comportamiento.

## `Move()` — aplicación de Ralentizar

```csharp
private void Move()
{
    if (m_Animator != null && m_Animator.runtimeAnimatorController != m_CombatProfile.IdleAnimation)
    {
        m_Animator.runtimeAnimatorController = m_CombatProfile.IdleAnimation;
    }

    float speedMultiplier = IsSlowed ? Mathf.Max(0f, 1f - m_SlowMagnitude) : 1f; // nuevo
    float direction = m_Team == Team.Player ? 1f : -1f;
    m_LanePosition += direction * c_MoveSpeed * speedMultiplier * Time.deltaTime; // c_MoveSpeed * speedMultiplier reemplaza c_MoveSpeed
}
```

Sin cambios en el resto de `Move()` (animación idle, dirección por equipo) — mismo criterio de mínimo cambio que 007/008 ya aplicaron en sus respectivas extensiones de este método.

## `Attack()` — sin cambios de estructura, solo el cálculo de daño (ver strong-against-combat.md)

La ramificación por `AttackType` (`Area` vs. único objetivo, 007) y la invocación de `ApplyAbilitiesTo` tras el daño (008) no cambian de forma. Lo único que cambia es *cómo* se calcula el monto de daño antes de aplicarlo (`ComputeOutgoingDamage`, ver contracts/strong-against-combat.md) y *cómo* se aplica (`IAttackerAwareDamageable` cuando el objetivo lo implementa).

## Cobertura de Acceptance Scenarios

| Escenario | Cómo se cubre |
|---|---|
| US2 Escenario 1 (Congelar detiene movimiento y ataque) | Guard `if (IsFrozen) return;` tras `TickEffectTimers()` — ningún camino del resto de `Update()` se ejecuta. |
| US2 Escenario 2 (retoma comportamiento normal al expirar, sin quedar bloqueada) | `TickEffectTimers()` sigue corriendo cada frame incluso mientras `IsFrozen`; en el frame en que `m_FreezeRemainingSeconds` llega a `0f`, el guard ya no se activa y el resto de `Update()` se ejecuta con normalidad. |
| US3 Escenario 1 (Ralentizar reduce velocidad observable) | `speedMultiplier` en `Move()`. |
| US3 Escenario 2 (Congelar prevalece sobre Ralentizar) | `Move()` nunca se invoca mientras `IsFrozen` (guard de `Update()`) — no hay conflicto que resolver, ver research.md §5. |
| Edge Case (enemigo destruido con efecto activo) | `IsDestroyed` ya corta `Update()` en su primera línea (001), antes de tocar ningún temporizador — sin cambios necesarios ahí. |
| Edge Case (unidad reciclada del pool no hereda efectos de un uso anterior — hallazgo F2 de `/speckit.analyze`) | `Initialize()` resetea explícitamente `m_WeakenRemainingSeconds`/`m_WeakenMagnitude`/`m_FreezeRemainingSeconds`/`m_SlowRemainingSeconds`/`m_SlowMagnitude` a `0f`, mismo patrón que `m_CurseRemainingSeconds = 0f` ya hace en 008 — ver [contracts/ability-effect-catalog.md § Initialize()](./ability-effect-catalog.md#initialize--reset-de-estado-al-reciclar-del-pool-corrige-f2) para el detalle completo; este documento no lo repite. |

## Doble de test

Cubierto por `CombatAbilityCatalogBattlePlayModeTests` (mismo archivo referenciado en contracts/ability-effect-catalog.md) — no se crea un archivo de test separado por contrato, siguiendo el mismo criterio de agrupación que 008 usó para sus 3 contratos con una sola suite PlayMode.
