# Research: Sistema de Tipos de Ataque ("Attack Types")

## 1. Punto de inserción en el flujo de combate existente

**Decision**: No se crea ninguna clase/capa nueva de "resolución de ataque". Se ramifica directamente por `m_Source.AttackType` en los dos lugares donde `UnitRuntime` (`Assets/Scripts/Gameplay/Battler/UnitRuntime.cs`, 001) ya adquiere objetivo y aplica daño: el bloque de adquisición de objetivo dentro de `Update()` (líneas 67-70 en el estado previo a esta feature) y la línea `m_CurrentTarget.ApplyDamage(m_Source.Damage)` dentro de `Attack()` (línea 108). Se apoyan en dos consultas nuevas de `LaneRegistry` (`Assets/Scripts/Gameplay/Battler/LaneRegistry.cs`) — `FindFarthestTarget` y `FindAllTargetsInRange` — añadidas junto a la ya existente `FindNearestTarget`.

**Rationale**: `UnitRuntime.Attack()` ya es el único punto donde una unidad (jugador o enemigo) aplica daño; `LaneRegistry` ya es el único punto donde se resuelve "quién está en rango". Son exactamente 3 valores fijos de `AttackType` (FR-002), acotados y sin previsión de crecer dentro de esta feature (FR-009 excluye explícitamente trait-targeting/clasificación, que sí podrían justificar una capa de estrategia más adelante). Insertar la ramificación donde ya vive la lógica evita indirección nueva sin beneficio medible hoy (Principio VI).

**Alternatives considered**:
- Introducir una interfaz `IAttackResolver`/`IAttackTypeStrategy` con una implementación por tipo, inyectada en `UnitRuntime`: rechazado — sobre-ingeniería para 3 ramas fijas y estables; añadiría un nivel de indirección y un punto de registro/factoría sin que ningún requisito de esta fase (FR-001 a FR-009) lo exija. Puede reconsiderarse en 008/009 si trait-targeting introduce combinaciones reales.
- Mover la lógica de targeting a `UnitDefinition` (p. ej. un método `ResolveTargets(...)`): rechazado — `UnitDefinition` es un ScriptableObject de datos (Principio V); acoplarlo a `LaneRegistry`/`ILaneOccupant` (tipos de `Gameplay`) rompería la separación de capas ya establecida en 001 (Model no depende de Gameplay).

## 2. Radio de área / alcance de larga distancia: reutilizar `Range`

**Decision**: "Ataque de Área" usa `UnitDefinition.Range` como radio de efecto; "Larga Distancia" usa el mismo `Range` como alcance máximo dentro del cual busca el objetivo más lejano. No se añade ningún campo nuevo (p. ej. `areaRadius`) a `UnitDefinition`.

**Rationale**: `Range` ya expresa "hasta dónde llega esta unidad" — es el mismo parámetro que `LaneRegistry.FindNearestTarget` recibe como `maxRange` hoy. Tanto "todos los enemigos dentro del radio de efecto" (FR-005) como "un enemigo más allá del más cercano, dentro de su rango" (FR-006) son la misma noción semántica de alcance que "Ataque Único" ya usa para decidir si hay o no un objetivo válido. Duplicar ese dato en un segundo campo violaría Principio VI (YAGNI) sin que ningún requisito de esta fase pida desacoplar "rango de detección" de "radio de efecto".

**Alternatives considered**:
- Campo nuevo `m_AreaRadius` independiente de `Range`: rechazado por ahora — ningún FR/SC de spec.md exige que el radio de área pueda diferir del rango de la unidad; se puede añadir después sin romper este diseño (el radio de área seguiría siendo un `float` en `UnitDefinition`, solo cambiaría de dónde lo lee `UnitRuntime`).
- Radio de área fijo/global (constante de diseño, no dato por unidad): rechazado — contradice Principio V (balance dirigido por datos) y SC-005 (cambiar el tipo de ataque de una unidad debe reflejarse sin recompilar; un radio fijo global no permitiría variar el alcance de área entre unidades).

## 3. Regla de selección de objetivo para "Larga Distancia"

**Decision**: "Larga Distancia" selecciona siempre el enemigo **más lejano** dentro de `Range` (`LaneRegistry.FindFarthestTarget`), en vez del más cercano. Con un único enemigo en rango, coincide con el resultado de "Ataque Único" (mismo objetivo, único candidato).

**Rationale**: spec.md deja esta regla explícitamente abierta para esta fase ("siempre el más lejano vs. cualquiera más allá del más cercano, queda para `/speckit.plan`"). "Siempre el más lejano" es la opción determinista y más simple de implementar/testear que satisface FR-006 ("puede dañar a un enemigo más allá del más cercano") en todos los escenarios con ≥2 enemigos en rango, y es el espejo directo de `FindNearestTarget` ya existente (mismo recorrido de `LaneRegistry`, criterio de comparación invertido).

**Alternatives considered**:
- Objetivo aleatorio entre los que están "más allá del más cercano": rechazado — no determinista, dificulta un test reproducible para SC-003 ("en al menos un escenario de prueba con enemigos escalonados").
- "Segundo más cercano" (el inmediato siguiente al más próximo): rechazado — requiere ordenar/comparar contra dos candidatos en vez de uno, más estado sin aportar una distinción táctica adicional frente a "el más lejano" dentro del alcance de esta feature; con exactamente 2 enemigos en rango ambas reglas coinciden.

## 4. Adquisición de objetivo para "Ataque de Área": sin `m_CurrentTarget` persistente

**Decision**: Para `AttackType.Area`, `UnitRuntime.Update()` no persiste un único objetivo en `m_CurrentTarget` (ese campo sigue existiendo y sirve solo a `SingleTarget`/`LongDistance`). Para decidir `Move()` vs `Attack()` reutiliza `LaneRegistry.FindNearestTarget(...) != null` únicamente como comprobación de presencia ("¿hay al menos un enemigo en rango?"). Al ejecutar `Attack()`, vuelve a consultar `LaneRegistry.FindAllTargetsInRange(...)` en ese instante y aplica daño a todo lo que devuelva.

**Rationale**: minimiza el cambio sobre el conjunto de campos ya existente en `UnitRuntime` — no hace falta un segundo campo de estado (`List<ILaneOccupant>` persistente) solo para "Área", porque `Attack()` ya está limitado por `m_AttackCooldownRemaining` (se ejecuta una vez por ciclo, no cada frame): recalcular el conjunto de objetivos en ese momento es barato y siempre refleja el estado más actual del carril (enemigos que hayan entrado/salido de rango justo antes de ese ciclo).

**Alternatives considered**:
- Mantener un `List<ILaneOccupant> m_CurrentAreaTargets` refrescado cada `Update()`: rechazado — estado adicional que se invalidaría en cada frame de todos modos (los ocupantes en rango pueden cambiar en cualquier momento), sin beneficio sobre recalcular justo antes de aplicar daño.

## 5. Evitar asignaciones (GC) por ataque de área

**Decision**: `LaneRegistry.FindAllTargetsInRange(Team seekerTeam, float seekerLanePosition, float maxRange, List<ILaneOccupant> results)` escribe sobre un `List<ILaneOccupant>` provisto por quien llama (`results.Clear()` seguido de `results.Add(...)` por cada ocupante en rango), en vez de devolver una lista/`IEnumerable` nueva. `UnitRuntime` mantiene un único campo `List<ILaneOccupant>` reutilizable entre ciclos de ataque para pasar como `results`.

**Rationale**: el camino de "Área" en `Attack()` se ejecuta una vez por cada ciclo de `c_AttackIntervalSeconds` por cada unidad de área activa; con hasta ~10 unidades simultáneas en el carril (Scale/Scope de 001), asignar una lista nueva por ataque introduciría presión de GC evitable en el mismo bucle donde 001 ya fijó un objetivo de 60 fps estables. Reutilizar un buffer es el mismo tipo de optimización que `UnitRuntimePool` (001, extendido en `dbb5a66`) ya aplica para evitar `Instantiate`/`Destroy` repetidos.

**Alternatives considered**:
- Devolver `List<ILaneOccupant>` nuevo (o `IEnumerable<ILaneOccupant>` vía `yield return`) en cada llamada: rechazado — asignación evitable por ataque sin ningún beneficio de legibilidad que compense, dado que el llamador (`UnitRuntime`) es el único consumidor y puede proveer el buffer.

## 6. Compatibilidad retroactiva con las 5 unidades y el enemigo existentes (FR-008)

**Decision**: no se modifica ningún archivo `.asset` existente. El valor por defecto del enum (`SingleTarget = 0`, primer miembro declarado) cubre FR-008 automáticamente: Unity deserializa un `[SerializeField]` nuevo que no existe en el YAML serializado previo usando el valor por defecto de C# para ese tipo, que para un enum sin inicializador explícito de sus miembros es `0`.

**Rationale**: no hace falta ninguna migración de datos ni herramienta de Editor para "rellenar" `AttackType` en `Unit_Arquero.asset`, `Unit_Escudero.asset`, `Unit_Espadachin.asset`, `Unit_Lancero.asset`, `Unit_Mago.asset` ni `Unit_EnemyGrunt.asset` — todos ellos ya son unidades de `Ataque Único` en el momento en que el campo empieza a existir, sin ninguna acción manual (SC-004). Esto es una elección deliberada de orden de declaración del enum, no un accidente: `SingleTarget` se declara primero precisamente porque es el valor que FR-008 exige por defecto.

**Alternatives considered**:
- Declarar `Area` o `LongDistance` como primer miembro (valor `0`) y asignar `SingleTarget = 0` explícitamente en el campo de `UnitDefinition` en su lugar: funcionalmente equivalente para el propósito de FR-008 en el código nuevo, pero más frágil — dependería de que nadie reordene el enum sin notar que el default del `[SerializeField]` cambiaría con él. Declarar `SingleTarget` como miembro `0` hace que el valor por defecto de C#/Unity y el valor exigido por FR-008 sean el mismo por construcción, sin depender de un inicializador que alguien podría eliminar por error.
- Script de migración de Editor que reescriba explícitamente `attackType: 0` en cada `.asset`: rechazado — trabajo redundante, ya que el campo ausente ya deserializa al valor correcto; solo sería necesario si el default exigido no coincidiera con el valor cero del enum.

## 7. Estrategia de testing

**Decision**: mismo split EditMode/PlayMode que 001–003.
- EditMode: `LaneRegistryTargetingTests` (dobles en memoria de `ILaneOccupant` — sin objetos en rango, un objetivo, varios objetivos, objetivo fuera de rango, objetivo del mismo equipo excluido — para `FindFarthestTarget` y `FindAllTargetsInRange`); `UnitDefinitionAttackTypeTests` (una instancia de `UnitDefinition` sin `m_AttackType` asignado expone `AttackType == AttackType.SingleTarget`, mismo patrón que `UnitDefinitionValidationTests`).
- PlayMode: `AttackTypeBattlePlayModeTests`, construido igual que `BattleLoopPlayModeTests.cs` (`ScriptableObject.CreateInstance<UnitDefinition>()` + reflexión sobre campos privados, `UnitRuntime` instanciado sobre un `GameObject` de prueba, sin cargar `Chapter1_Battle.unity`), cubriendo: US1 (varios enemigos agrupados reciben daño en el mismo ataque de una unidad de Área), US2 (con varios enemigos en rango, una unidad de Ataque Único solo daña a uno, y reasigna objetivo al destruirse el actual), US3 (con enemigos escalonados, una unidad de Larga Distancia daña a uno más allá del más cercano), US4 (los mismos tres escenarios repetidos con `Team.Enemy` atacando unidades/base del jugador, para verificar simetría sin duplicar aserciones específicas de equipo).

**Rationale**: continuación directa del patrón ya validado en 001–003; no introduce ninguna herramienta de testing nueva. No se requieren nuevos assets `.asset` para cobertura automatizada — la validación manual con los assets reales del Capítulo 1 se cubre en quickstart.md.
