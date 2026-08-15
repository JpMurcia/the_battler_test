# Contract: UnitRuntime — comportamiento por AttackType

Capa: `TheBattler.Gameplay`. Este documento no describe una interfaz nueva — describe el contrato de comportamiento que `UnitRuntime.Update()`/`Attack()` (`Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`, 001) deben cumplir según `m_Source.AttackType`, reemplazando la lógica de adquisición/daño que hoy asume implícitamente `SingleTarget`.

## `AttackType.SingleTarget` (FR-004, US2)

- **Adquisición** (`Update()`): sin cambios respecto a 001 — `m_CurrentTarget` se mantiene mientras no sea `null` ni esté destruido; si lo está, se reasigna con `LaneRegistry.FindNearestTarget(m_Team, m_LanePosition, m_Source.Range)`.
- **Aplicación de daño** (`Attack()`): exactamente una llamada a `m_CurrentTarget.ApplyDamage(m_Source.Damage)` por ciclo de ataque (gobernado por `m_AttackCooldownRemaining`, sin cambios).
- **Reasignación tras destruir el objetivo**: si `m_CurrentTarget` se destruye entre dos ciclos, el próximo `Update()` adquiere otro objetivo dentro de rango si existe (sin cambios respecto a 001) — cubre US2 Escenario 2 ("el daño se dirige a otro enemigo... sin afectar a más de uno por ataque").
- **Sin objetivo en rango**: no ataca ese ciclo (mismo comportamiento que 001, Edge Case de spec.md ya cubierto).

## `AttackType.Area` (FR-005, US1)

- **Adquisición** (`Update()`, decide `Move()` vs `Attack()`): no se persiste un `m_CurrentTarget` único para este tipo. Se reutiliza `LaneRegistry.FindNearestTarget(m_Team, m_LanePosition, m_Source.Range) != null` únicamente como comprobación de presencia ("¿hay al menos un enemigo dentro de `Range`?") — ver research.md §4.
- **Aplicación de daño** (`Attack()`): en cada ciclo de ataque, se llama `LaneRegistry.FindAllTargetsInRange(m_Team, m_LanePosition, m_Source.Range, <buffer reutilizable>)` y se invoca `ApplyDamage(m_Source.Damage)` sobre cada elemento devuelto — de 0 a N objetivos, todos los presentes en `Range` en ese instante.
- **Cobertura de Acceptance Scenarios (US1)**:
  - Varios enemigos agrupados en rango → todos reciben daño en el mismo ataque (Escenario 1).
  - Un único enemigo en rango → ese único enemigo recibe daño con normalidad (Escenario 2 — `FindAllTargetsInRange` devuelve una lista de 1 elemento, mismo efecto que `SingleTarget` en ese caso).
- **Enemigos fuera del radio**: no reciben daño en ese ataque (Edge Case de spec.md — `FindAllTargetsInRange` los excluye por `maxRange`).

## `AttackType.LongDistance` (FR-006, US3)

- **Adquisición** (`Update()`): igual que `SingleTarget`, pero usando `LaneRegistry.FindFarthestTarget(m_Team, m_LanePosition, m_Source.Range)` en vez de `FindNearestTarget` — único cambio de código respecto a la rama `SingleTarget`. `m_CurrentTarget` se reasigna con la misma condición (`null` o destruido).
- **Aplicación de daño** (`Attack()`): exactamente una llamada a `m_CurrentTarget.ApplyDamage(m_Source.Damage)` por ciclo, igual que `SingleTarget` — la diferencia está enteramente en qué objetivo se adquirió, no en cuántos reciben daño.
- **Cobertura de Acceptance Scenarios (US3)**: con más de un enemigo en rango, el daño llega al más lejano de ellos, no necesariamente al inmediatamente adyacente (Escenario 1). Con exactamente un enemigo en rango, coincide con el resultado de `SingleTarget` (mismo único candidato).

## Simetría jugador/enemigo (FR-007, US4)

Ninguna de las tres ramas anteriores consulta `m_Team`/`m_Source.Team` para decidir *qué hacer* — el único uso de `Team` en todo este flujo es el filtro `occupant.Team != seekerTeam` ya existente dentro de `LaneRegistry` (idéntico para las tres consultas: `FindNearestTarget`, `FindFarthestTarget`, `FindAllTargetsInRange`). Por construcción, una `UnitRuntime` con `Team.Enemy` y `AttackType.Area` ejecuta exactamente la misma rama de código que una con `Team.Player` y `AttackType.Area`; lo único que cambia es qué conjunto de ocupantes cuenta como "enemigo" para cada una. Esto cubre FR-007/US4 sin necesitar ninguna rama condicional adicional por `Team` en `UnitRuntime` ni en `LaneRegistry`.

## Doble de test

`AttackTypeBattlePlayModeTests` (PlayMode) instancia `UnitDefinition` vía `ScriptableObject.CreateInstance<UnitDefinition>()` y asigna `m_AttackType`/`m_Range`/`m_Damage`/`m_Team` por reflexión (mismo patrón que `BattleLoopPlayModeTests.CreateUnit`), añade varios `UnitRuntime` a una escena mínima construida en runtime (sin cargar `Chapter1_Battle.unity`) y verifica `CurrentHealth` de cada objetivo tras dejar correr uno o más ciclos de `Attack()`. Los mismos tres escenarios (Área/Único/Larga Distancia) se ejecutan una vez con `Team.Player` atacando `Team.Enemy` y una vez con los equipos invertidos, para US4.
