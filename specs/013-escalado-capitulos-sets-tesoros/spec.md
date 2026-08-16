# Feature Specification: Escalado Avanzado por Arco y Sets de Tesoros

**Feature Branch**: `013-escalado-capitulos-sets-tesoros`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/014-chapter-scaling-treasure-sets` (proyecto Unity origen): la vida de la base enemiga también escala por arco (no solo sus unidades), el costo de energía de misión también escala por arco, el ancho del carril de combate se vuelve un dato de nivel configurable, y los tesoros individuales se agrupan opcionalmente en sets con una bonificación pasiva de cuenta al completarse.

**Relación con el proyecto existente**: Esta especificación **extiende** `specs/012-saga-imperio-de-los-gatos` sin redefinir ninguna de sus capacidades: reutiliza `SagaArc.enemyStrengthMultiplier`, `Level`, `useMetaStore.obtainedTreasureIds`, y el sistema de energía de misión de `specs/007-energia-mision-dificultad`. No vuelve a definir "arco", "nivel", "energía" ni "tesoro" — solo añade los parámetros y agrupaciones detectados como ausentes al comparar contra el catálogo del juego de referencia: la base enemiga (no solo sus enemigos) también escala vida por arco, la energía de misión por nivel también escala por arco, cada nivel expone un ancho de carril configurable, y los tesoros se agrupan opcionalmente en sets con bonificación pasiva.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La vida de la base enemiga también escala por arco (Priority: P1)

Un jugador se enfrenta al mismo nivel en distintos arcos de la saga. La base enemiga no solo tiene enemigos más fuertes según el arco (ya cubierto por `specs/012`): su propia vida máxima también es mayor cuanto más avanzado es el arco.

**Why this priority**: Sin esto, el escalado por arco de `specs/012` queda incompleto — un jugador podría destruir la base enemiga de cualquier arco con la misma facilidad ignorando a los enemigos, porque el único elemento que escalaba eran las unidades enemigas, no el objetivo de victoria en sí.

**Independent Test**: Iniciar el mismo nivel desde un arco con `enemyStrengthMultiplier: 1` y desde uno con `enemyStrengthMultiplier: 4`; verificar que `enemyBase.maxHp` al iniciar la batalla es proporcional al multiplicador, sin alterar `Level.enemyBaseHp`.

**Acceptance Scenarios**:

1. **Given** un nivel con `enemyBaseHp: 500` perteneciente a un arco con `enemyStrengthMultiplier: 1`, **When** `startLevel` inicializa la batalla, **Then** `enemyBase.maxHp` es 500.
2. **Given** el mismo nivel perteneciente a un arco con `enemyStrengthMultiplier: 3`, **When** la batalla inicia, **Then** `enemyBase.maxHp` es 1500, sin alterar el `enemyBaseHp: 500` almacenado en `Level`.
3. **Given** el mismo nivel jugado en dos arcos distintos, **When** se comparan ambas partidas, **Then** el daño necesario para destruir la base enemiga es mayor en el arco con multiplicador más alto, en proporción exacta.

---

### User Story 2 - El costo de energía de misión también escala por arco (Priority: P2)

Un jugador que ya superó un nivel en un arco decide rejugar su versión más difícil en otro arco; acceder a esa versión cuesta más energía de misión.

**Why this priority**: Extensión directa de `specs/007-energia-mision-dificultad`; sin ella el costo de energía es un valor plano que ignora la dificultad real del arco activo.

**Independent Test**: Configurar el mismo nivel con un costo de energía distinto por arco; iniciarlo desde cada arco y verificar que `spendMissionEnergy` descuenta el costo correspondiente al arco de acceso.

**Acceptance Scenarios**:

1. **Given** un nivel con costo de energía 5 en un arco y 15 en otro, **When** el jugador lo inicia desde el primero, **Then** se descuentan 5 de energía de misión.
2. **Given** el mismo nivel, **When** se inicia desde el segundo arco, **Then** se descuentan 15 en vez de 5.
3. **Given** energía de misión insuficiente para el costo del arco de acceso, **When** el jugador intenta iniciar el nivel, **Then** `spendMissionEnergy` lo rechaza igual que hoy para energía insuficiente.

---

### User Story 3 - Ancho de carril configurable por nivel (Priority: P3)

Un nivel se configura con un ancho de carril distinto al de otro, de modo que el tiempo de recorrido de las unidades y el punto de entrada en rango de un ataque a distancia varían nivel a nivel.

**Why this priority**: Dato de configuración puro sobre un valor (`LANE_LENGTH`) hoy fijo en `src/engine/simulation.ts`; formalizarlo es de menor impacto que el escalado de dificultad (Historias 1-2), pero necesario para que niveles futuros varíen su ritmo de combate.

**Independent Test**: Configurar dos niveles con `laneLength` distintos y la misma unidad/enemigo; verificar que el tiempo de recorrido hasta la base opuesta y el punto de entrada en rango de un ataque `LongRange` difieren en proporción al `laneLength` configurado.

**Acceptance Scenarios**:

1. **Given** un nivel con `laneLength: 600`, **When** una unidad se despliega, **Then** la distancia hasta la base enemiga (`ENEMY_BASE_EXTENT.x`) corresponde a ese valor.
2. **Given** dos niveles con `laneLength` distintos (400 y 600) y la misma unidad, **When** se despliega en ambos, **Then** el tiempo de recorrido hasta la base enemiga es mayor en el nivel de mayor `laneLength`, en proporción a la diferencia.
3. **Given** un nivel sin `laneLength` configurado, **When** se carga, **Then** el sistema usa 400 (el valor de `LANE_LENGTH` ya vigente hoy) como valor por defecto, sin romper ningún nivel existente (`level-1`, `level-2`).

---

### User Story 4 - Sets de tesoros con bonificación pasiva de cuenta (Priority: P4)

Un jugador que ya obtuvo todos los tesoros de un set configurado recibe automáticamente una bonificación pasiva permanente en su cuenta, activa en todas las batallas futuras sin acción adicional.

**Why this priority**: Depende de que ya existan tesoros individuales por nivel (`specs/012`, Historia 4); es la de menor prioridad porque agrega una capa de meta-progresión sobre un sistema que ya funciona sin ella.

**Independent Test**: Configurar un set de prueba con 2 tesoros de 2 niveles distintos; ganar ambos niveles por primera vez en cualquier orden y verificar que la bonificación se otorga exactamente al completarse el segundo tesoro del set.

**Acceptance Scenarios**:

1. **Given** un set con 2 tesoros configurados y el jugador ya tiene 1, **When** obtiene el tesoro restante del set, **Then** la bonificación pasiva del set se otorga de inmediato.
2. **Given** la bonificación de un set ya otorgada, **When** el jugador inicia cualquier batalla posterior, **Then** el efecto está activo desde el inicio de esa batalla sin acción adicional.
3. **Given** un set con tesoros pendientes, **When** el jugador consulta su progreso, **Then** el set aparece incompleto y su bonificación como no obtenida.
4. **Given** un tesoro que no pertenece a ningún set configurado, **When** se obtiene, **Then** se comporta exactamente igual que hoy (`specs/012`), sin disparar ninguna bonificación.

---

### Edge Cases

- Nivel sin `enemyBaseHp` propio: usa el mismo valor por defecto ya vigente hoy, sin cambio de comportamiento si no se configura el campo nuevo.
- Multiplicador de arco que produce `enemyBase.maxHp` con decimales: redondeo al entero más cercano (misma regla que `specs/012` Assumptions).
- Nivel sin costo de energía configurado para el arco activo (arco añadido sin actualizar la tabla): usa `Level.energyCost` base como valor por defecto, sin bloquear el acceso.
- Dos niveles del mismo set de tesoros ganados en el mismo tick (pruebas automatizadas): la bonificación se otorga exactamente una vez, nunca duplicada.
- Set de tesoros reconfigurado para incluir un tesoro adicional después de que el jugador ya lo había completado: el set pasa a incompleto hasta obtener el nuevo tesoro; la bonificación ya otorgada NO se retira.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `useGameStore.startLevel` DEBE aplicar el `enemyStrengthMultiplier` del arco activo (`specs/012` FR-001) a `Level.enemyBaseHp` al inicializar `enemyBase.maxHp`/`enemyBase.hp`, redondeado al entero más cercano, sin modificar el valor almacenado en `Level`.
- **FR-002**: El sistema DEBE permitir configurar, por nivel y por arco desde el que ese nivel es accesible, un costo de energía de misión específico (`energyCostByArc?: Record<arcId, number>`), y `useMetaStore.spendMissionEnergy` DEBE descontar el costo correspondiente al arco de acceso.
- **FR-003**: Si un nivel no tiene costo de energía configurado para el arco activo, el sistema DEBE usar `Level.energyCost` como valor por defecto.
- **FR-004**: El sistema DEBE permitir configurar, por nivel, un `laneLength` que `src/engine/simulation.ts` DEBE consultar en vez de la constante fija `LANE_LENGTH` para calcular `PLAYER_BASE_EXTENT`/`ENEMY_BASE_EXTENT` y el movimiento/rango de las unidades de ese nivel.
- **FR-005**: Si un nivel no tiene `laneLength` configurado, el sistema DEBE usar 400 (el valor ya vigente hoy) como valor por defecto, sin romper `level-1`/`level-2` existentes.
- **FR-006**: El sistema DEBE permitir agrupar tesoros existentes (`specs/012` FR-007) en `TreasureSet` nombrados, cada uno con la lista de `treasureIds` que lo componen.
- **FR-007**: El sistema DEBE otorgar la bonificación pasiva de un `TreasureSet` exactamente una vez, en el momento en que `obtainedTreasureIds` cubre el último tesoro pendiente del set, y DEBE mantenerla activa de forma permanente en todas las batallas posteriores.
- **FR-008**: El sistema DEBE persistir localmente, sobreviviendo reinicios, qué sets están completos y qué bonificaciones ya fueron otorgadas (`grantedTreasureSetIds`).
- **FR-009**: Un tesoro que no pertenece a ningún `TreasureSet` configurado DEBE comportarse exactamente igual que hoy (`specs/012`), sin disparar ninguna bonificación.
- **FR-010**: El sistema NO DEBE retirar una bonificación de set ya otorgada si el set se reconfigura después para incluir tesoros adicionales.

### Key Entities *(include if feature involves data)*

- **`Level.enemyBaseHp`** (existente, sin cambio de forma): se le aplica en `startLevel` el mismo `enemyStrengthMultiplier` del `SagaArc` (`specs/012`) que ya se aplica a los enemigos.
- **`Level.energyCostByArc`** (nuevo, opcional): mapa `arcId → costo de energía`; sin entrada para el arco activo, usa `Level.energyCost`.
- **`Level.laneLength`** (nuevo, opcional): ancho del carril de ese nivel; sin declarar, usa 400.
- **`TreasureSet`** (nuevo, `src/data/treasureSets.ts`): `id`, `name`, `treasureIds: string[]`, `passiveBonus: { type: 'EnergyRegenMultiplier' | 'CurrencyRewardMultiplier'; value: number }`.
- **`grantedTreasureSetIds`** (nuevo, persistido en `useMetaStore`): sets cuya bonificación ya fue otorgada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Para un mismo nivel, `enemyBase.maxHp` difiere de forma consistente entre arcos, siguiendo exactamente el `enemyStrengthMultiplier` configurado.
- **SC-002**: Para un nivel accesible desde varios arcos, el costo de energía de misión descontado corresponde exactamente al arco de acceso, en el 100% de los casos de prueba.
- **SC-003**: El tiempo de recorrido de una unidad y el punto de entrada en rango de un ataque `LongRange` son proporcionales al `laneLength` configurado.
- **SC-004**: La bonificación de un `TreasureSet` se otorga exactamente una vez por set, sin importar el orden de obtención de sus tesoros, en el 100% de las combinaciones de prueba.
- **SC-005**: El estado de sets completos y bonificaciones otorgadas sobrevive un reinicio de la aplicación, sin pérdida ni duplicación.
- **SC-006**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en `level-1`/`level-2` existentes.

## Assumptions

- Esta especificación asume `specs/012-saga-imperio-de-los-gatos` ya implementada: reutiliza `SagaArc.enemyStrengthMultiplier` y `obtainedTreasureIds` sin modificarlos.
- El redondeo de `enemyBase.maxHp` tras aplicar el multiplicador usa la misma regla ya definida en `specs/012` (entero más cercano), por consistencia con el redondeo de stats de unidades enemigas.
- `energyCostByArc` es configuración de contenido por nivel, no una fórmula automática derivada del multiplicador de fuerza del arco — distintos niveles pueden tener progresiones de costo distintas.
- `laneLength` por defecto (400, FR-005) es el valor que `src/engine/simulation.ts` ya asume hoy como `LANE_LENGTH`, preservando el comportamiento actual de `level-1`/`level-2` sin requerir ninguna migración de datos.
- Las bonificaciones pasivas de sets (FR-007) son modificadores acumulativos sobre sistemas ya existentes (regeneración de energía de misión, recompensa de moneda) — esta spec no diseña nuevos tipos de efecto, solo el mecanismo de otorgamiento al completar un set.
- La población completa de sets de tesoros y su asignación de niveles específicos es autoría de contenido posterior a esta spec, igual que `specs/012` dejó la población completa de arcos/niveles como trabajo posterior.
