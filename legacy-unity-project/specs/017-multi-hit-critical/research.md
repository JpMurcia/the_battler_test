# Research: Extensión de Tipos de Ataque — Multi-Golpe y Crítico

## §1. ¿Cómo se distribuyen en el tiempo los N golpes de una secuencia de "Multi-Golpe"?

**Decisión**: un temporizador de sub-intervalo nuevo (`c_MultiHitIntervalSeconds`, constante fija razonable para el MVP, mismo criterio que `c_AttackIntervalSeconds`/`c_MoveSpeed` ya existentes) separa cada golpe dentro de una misma secuencia. El primer golpe se aplica en el mismo instante en que se dispara la animación de ataque (igual que hoy hace cualquier `AttackType`); los golpes siguientes se aplican cuando ese sub-intervalo se cumple, hasta agotar los N golpes configurados. Al completar la secuencia completa, se reinicia el cooldown normal (`c_AttackIntervalSeconds`) antes de que pueda empezar la siguiente secuencia.

**Rationale**: reutiliza exactamente el mismo patrón de temporizador que `m_AttackCooldownRemaining` ya usa (decremento en `Update()`/`Attack()`, sin corutinas ni sistema de eventos de animación nuevo) — el proyecto no tiene un sistema de "frames de impacto" ligado al Animator (`Attack()` ya aplica daño en el mismo instante en que dispara el trigger, no en un evento de animación), así que introducir uno solo para esta feature sería una pieza de infraestructura nueva no exigida por ningún FR. Un temporizador de sub-intervalo adicional es la extensión mínima de ese mismo patrón.

**Alternativas consideradas**:
- Repartir los N golpes dentro del propio `c_AttackIntervalSeconds` (en vez de extenderlo): rechazada — con `c_AttackIntervalSeconds = 1f` y, por ejemplo, N=3, cada golpe caería cada ~0.33s sin margen configurable por unidad; un sub-intervalo fijo e independiente es más simple de razonar y de ajustar por separado si el balance lo requiere después.
- Sistema de eventos de animación (`AnimationEvent` de Unity) para marcar el instante exacto de cada impacto: rechazada por alcance — ninguna unidad del proyecto usa hoy `AnimationEvent` para sincronizar daño con animación (`Attack()` ya lo hace por temporizador, no por evento), y añadirlo ahora solo para Multi-Golpe rompería la consistencia de "todo ataque se resuelve por temporizador en `Update()`" que 001/007/008/016 ya establecieron.

## §2. ¿Cómo se representa el objetivo de una secuencia de Multi-Golpe en curso — reutilizar `m_CurrentTarget` o un snapshot propio?

**Decisión**: snapshot propio, `m_MultiHitTarget`, capturado al iniciar la secuencia (cuando el cooldown externo se cumple), independiente de `m_CurrentTarget`.

**Rationale**: `Update()` ya reasigna `m_CurrentTarget` a un nuevo objetivo tan pronto como el actual es `null` o `IsDestroyed` (mismo guard que usan `SingleTarget`/`LongDistance` desde 007). Si la secuencia de Multi-Golpe leyera `m_CurrentTarget` directamente, un objetivo destruido a mitad de secuencia sería reemplazado por uno nuevo *antes* de que `Attack()` tuviera oportunidad de descartar los golpes restantes — exactamente el bug que el Edge Case y FR-004/FR-005 de spec.md prohíben. Un snapshot propio, que `Attack()` controla y limpia por sí mismo, hace posible cumplir "los golpes restantes no se aplican a ningún otro objetivo" sin tocar el ciclo de retargeting ya existente de `Update()`.

**Alternativas consideradas**:
- Bloquear la reasignación de `m_CurrentTarget` en `Update()` mientras haya una secuencia de Multi-Golpe activa (un guard `if (m_MultiHitRemainingHits > 0) return;` antes del bloque de retargeting): rechazada — acoplaría el ciclo de adquisición de objetivo genérico (compartido por los 5 `AttackType`) a un detalle interno de uno solo de ellos, y complicaría el guard de Congelar (`IsFrozen`) ya existente en el mismo método. Un snapshot local a la secuencia mantiene `Update()` sin cambios de flujo, solo `Attack()` gana la rama nueva.

## §3. ¿Dónde se resuelve el roll de "Crítico" — en `ComputeOutgoingDamage()` o en un método separado?

**Decisión**: dentro de `ComputeOutgoingDamage()` ya existente (016), como un multiplicador más en la misma cadena (`dealtMultiplier * weakenMultiplier * criticalMultiplier`), evaluado antes del `Mathf.Max(1, Mathf.RoundToInt(...))` final.

**Rationale**: `ComputeOutgoingDamage()` ya es el único punto de cálculo de daño saliente de una sola pasada, documentado explícitamente en `contracts/strong-against-combat.md` de `016-combat-ability-catalog` como "sin recursión". Añadir el multiplicador de crítico ahí reutiliza ese contrato sin crear un segundo punto de cálculo de daño ni tocar `DealDamageTo`/`Attack()` más de lo necesario — el crítico se aplica igual sin importar si el golpe viene de la rama `Area`, `MultiHit` o del branch de único objetivo, porque los tres ya llaman a `DealDamageTo` → `ComputeOutgoingDamage`.

**Alternativas consideradas**:
- Calcular el crítico en `Attack()` y pasar un `bool isCritical`/`float multiplier` como parámetro nuevo a `DealDamageTo`: rechazada — obligaría a decidir el roll una vez por golpe de `Area`/Multi-Golpe (múltiples objetivos o múltiples impactos por secuencia) en el sitio de llamada, duplicando lógica que `ComputeOutgoingDamage` ya centraliza para los demás multiplicadores (Debilitar, Fuerte Contra).

## §4. ¿Cómo se prueba de forma determinista la proporción de golpes críticos (SC-004)?

**Decisión**: `UnityEngine.Random.InitState(<seed fijo>)` al inicio del PlayMode test correspondiente, antes de generar la muestra de ataques observados.

**Rationale**: ningún sistema de este proyecto inyecta una abstracción de aleatoriedad — `Fuzzy.cs` y `LaneVisualSpread.cs` ya llaman a `UnityEngine.Random.value`/`Random.Range` directamente sin interfaz intermedia. Introducir una `IRandomProvider` inyectable solo para esta feature sería la única pieza de infraestructura de aleatoriedad de todo el proyecto sin que ningún FR la exija — el mismo criterio de "no generalizar sin necesidad real" que `docs/plan-tecnico-manual-completo.md` §1.3 y el research.md de `016` ya aplicaron a otras decisiones. Sembrar `UnityEngine.Random` con un valor fijo al inicio del test es la técnica estándar de Unity Test Framework para reproducibilidad y no añade superficie nueva al código de producción.

**Alternativas consideradas**:
- Interfaz `IRandomProvider`/`ISystemRandom` inyectada en `UnitRuntime` (mismo espíritu que el "sin `ISystemClock`" ya documentado para `MissionEnergyController`, pero en la dirección contraria — aquí el proyecto tampoco inyecta aleatoriedad hoy): rechazada por la misma razón que el proyecto nunca inyectó una fuente de tiempo — no hay un segundo caso de uso todavía que la justifique: seedear `UnityEngine.Random` en el test basta para la Historia 3 Escenario 3 (SC-004) sin tocar producción.

## §5. Simetría jugador/enemigo para Multi-Golpe y Crítico

**Decisión**: ninguna rama nueva por `Team` — mismo pipeline ya simétrico de `Attack()`/`ComputeOutgoingDamage()` que heredan `SingleTarget`/`Area`/`LongDistance` desde `007-attack-types` (FR-007 de esa spec) y `Weaken`/`Freeze`/`Slow`/Fuerte Contra desde `016-combat-ability-catalog`.

**Rationale**: `UnitRuntime` no distingue `Team.Player`/`Team.Enemy` en ningún punto de su lógica de ataque o cálculo de daño — el comportamiento ya es simétrico por construcción; esta feature no necesita ningún trabajo adicional para cumplir FR-008, solo un caso de prueba que lo confirme (mismo criterio que la Historia 4 de `007-attack-types`).
