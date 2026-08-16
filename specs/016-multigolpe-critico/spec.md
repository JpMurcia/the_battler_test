# Feature Specification: Extensión de Tipos de Ataque — Multi-Golpe y Crítico

**Feature Branch**: `016-multigolpe-critico`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/017-multi-hit-critical` (proyecto Unity origen): añadir Multi-Golpe (varios impactos por secuencia de ataque, descartada si la unidad es interrumpida antes del último) y Crítico (probabilidad configurable de infligir el doble de daño) al `AttackType` existente de `specs/008-tipos-de-ataque`, como miembros nuevos sin reordenar ni reinterpretar `'Single' | 'Area' | 'LongRange'` ya existentes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un ataque Multi-Golpe inflige varios impactos en una secuencia (Priority: P1)

Una unidad con `attackType: 'MultiHit'` inflige varios impactos de daño independientes dentro de una misma secuencia de ataque, en vez de uno único.

**Why this priority**: Comportamiento más distintivo y visible — sin él, "Multi-Golpe" no aporta ninguna diferencia observable frente a `'Single'`.

**Independent Test**: Desplegar una unidad `MultiHit` con N golpes configurados contra un enemigo dentro de su alcance y contar los impactos independientes registrados durante una secuencia completa sin interrupción.

**Acceptance Scenarios**:

1. **Given** una unidad `MultiHit` con `hitsPerSequence: N` tiene un enemigo en rango, **When** completa una secuencia sin interrupción, **Then** ese enemigo recibe exactamente N impactos de daño independientes.
2. **Given** una unidad `MultiHit` sin ningún enemigo en rango, **When** su cooldown de ataque se cumple, **Then** no inflige ningún impacto, igual que `'Single'` sin objetivo.

---

### User Story 2 - Una secuencia Multi-Golpe interrumpida no deja golpes pendientes (Priority: P2)

Si el objetivo de una unidad `MultiHit` es destruido o deja de estar en rango antes de que termine su secuencia, los golpes restantes no se aplican a otro objetivo, y la siguiente secuencia empieza desde cero.

**Why this priority**: Evita golpes "fantasma" trasladados a un objetivo distinto del que los originó; refina el comportamiento base de la Historia 1.

**Independent Test**: Iniciar la secuencia de una unidad `MultiHit` contra un enemigo, destruirlo o sacarlo de rango antes del último impacto, y confirmar que ningún golpe adicional se aplica a otro objetivo; luego confirmar que la siguiente secuencia contra un nuevo objetivo vuelve a empezar en el primer golpe.

**Acceptance Scenarios**:

1. **Given** una unidad `MultiHit` aplicó algunos pero no todos los golpes de su secuencia, **When** el objetivo es destruido o deja de estar en rango antes del último golpe, **Then** los golpes restantes no se aplican a ningún otro objetivo.
2. **Given** una unidad `MultiHit` interrumpida a mitad de secuencia, **When** adquiere un nuevo objetivo y su cooldown se cumple de nuevo, **Then** inicia una secuencia completa nueva de N golpes, sin continuar desde el golpe donde quedó la anterior.

---

### User Story 3 - Un ataque Crítico inflige el doble de daño con probabilidad configurable (Priority: P1)

Una unidad con `attackType: 'Critical'` tiene una probabilidad configurable de infligir el doble de daño en un ataque dado.

**Why this priority**: Junto con Multi-Golpe, es el otro comportamiento explícitamente pedido; independiente de Multi-Golpe y con valor táctico propio.

**Independent Test**: Con `criticalChance` fijada a un valor conocido (0 o 1) en un entorno de prueba (RNG inyectable), desplegar la unidad y confirmar que el daño observado corresponde al valor esperado.

**Acceptance Scenarios**:

1. **Given** una unidad `Critical` con `criticalChance: 1`, **When** ataca, **Then** cada ataque inflige el doble del daño base.
2. **Given** una unidad `Critical` con `criticalChance: 0`, **When** ataca, **Then** nunca inflige el doble, solo el daño base.
3. **Given** una unidad `Critical` con `criticalChance: 0.5`, **When** se observan 100 ataques con un RNG determinista sembrado en el test, **Then** el número de golpes críticos está entre 35 y 65 (±15 puntos porcentuales sobre el 50% esperado).

---

### Edge Cases

- Unidades/enemigos existentes que no declaran `MultiHit`/`Critical`: conservan su `attackType` actual sin ningún cambio de comportamiento.
- Una unidad `MultiHit`/`Critical` del bando enemigo: mismo comportamiento simétrico ya exigido por `specs/008` FR-007 para unidades del jugador.
- Interacción de Crítico con los multiplicadores de daño de `specs/015-catalogo-habilidades-combate` (Debilitar, `TraitTargeting`/`TraitResistance`): el crítico duplica el daño ya resultante de esos cálculos — se aplica último, sobre el daño final.
- Una misma unidad no puede ser `MultiHit` y `Critical` a la vez — son valores mutuamente excluyentes del mismo campo `attackType`, igual que `'Single'`/`'Area'`/`'LongRange'` ya lo son entre sí.
- `hitsPerSequence: 1` es un caso degenerado válido — se comporta igual que `'Single'`, sin manejo especial adicional.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `AttackType` (`src/engine/types.ts`) DEBE extenderse con `'MultiHit' | 'Critical'`, sin reordenar ni reinterpretar `'Single' | 'Area' | 'LongRange'` ya existentes.
- **FR-002**: Una unidad/enemigo con `attackType: 'MultiHit'` DEBE declarar `hitsPerSequence: number` (entero ≥ 1) en `Cat`/`BattleUnit`.
- **FR-003**: Una unidad `MultiHit` DEBE infligir `hitsPerSequence` impactos de daño independientes contra su objetivo durante una única secuencia de ataque, siempre que no sea interrumpida.
- **FR-004**: Si el objetivo de una secuencia `MultiHit` es destruido o deja de ser válido (fuera de rango) antes de completar todos sus golpes, el sistema DEBE descartar los golpes restantes sin aplicarlos a otro objetivo.
- **FR-005**: Tras una interrupción, la siguiente secuencia `MultiHit` DEBE reiniciar desde el primer golpe, nunca reanudar desde el punto de interrupción.
- **FR-006**: Una unidad/enemigo con `attackType: 'Critical'` DEBE declarar `criticalChance: number` (0-1) en `Cat`/`BattleUnit`.
- **FR-007**: Cuando un ataque de una unidad `Critical` resulta en golpe crítico, el daño infligido en ese ataque DEBE ser el doble del que habría infligido sin crítico, aplicado sobre el daño ya resuelto por `specs/015` (Debilitar, `TraitTargeting`/`TraitResistance`).
- **FR-008**: El comportamiento de `MultiHit`/`Critical` DEBE aplicarse de forma simétrica a unidades del jugador y enemigos, mismo criterio que `specs/008` FR-007.
- **FR-009**: Unidades/enemigos existentes que no declaren `MultiHit`/`Critical` DEBEN seguir comportándose exactamente igual que antes de esta feature.
- **FR-010**: La determinación de golpe crítico DEBE resolverse con una función de aleatoriedad inyectable (no `Math.random` invocado directamente dentro de `src/engine/`), para permitir sembrarla de forma determinista en tests.

### Key Entities *(include if feature involves data)*

- **`AttackType`** (extendido, `specs/008`): gana `'MultiHit'` y `'Critical'`.
- **`hitsPerSequence`** (nuevo, en `Cat`/`BattleUnit`): número de golpes independientes por secuencia `MultiHit`.
- **`criticalChance`** (nuevo, en `Cat`/`BattleUnit`): probabilidad 0-1 de golpe crítico por ataque.
- **`multiHitProgress`** (nuevo, efímero en `BattleUnit`): golpes ya aplicados de la secuencia `MultiHit` en curso contra el objetivo actual; se resetea al cambiar de objetivo o al completarse.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una unidad `MultiHit` con N golpes inflige exactamente N impactos independientes por secuencia completa, en el 100% de los casos de prueba sin interrupción.
- **SC-002**: Al interrumpir una secuencia `MultiHit` a mitad de camino, el 0% de los golpes restantes se aplica a un objetivo distinto del original.
- **SC-003**: Con `criticalChance: 1`, el 100% de los ataques observados infligen el doble de daño; con `criticalChance: 0`, el 0% lo hace.
- **SC-004**: Con `criticalChance: 0.5` y una muestra de 100 ataques con RNG sembrado, el número de golpes críticos está entre 35 y 65.
- **SC-005**: Las unidades/enemigos existentes (`'Single'`/`'Area'`/`'LongRange'`) mantienen su comportamiento sin regresión observable.
- **SC-006**: `npx tsc -b` limpio y `npm test` en verde.

## Assumptions

- El comportamiento y la terminología de "Multi-Hit" y "Crítico" se basan en el conocimiento público ya conocido de estas mecánicas en el juego de referencia, mismo criterio que `specs/008-tipos-de-ataque` documentó para sus tres tipos base.
- "Reinicio de la secuencia si la unidad es interrumpida" se interpreta como: `multiHitProgress` no persiste entre secuencias separadas por una interrupción de objetivo — no implica una animación de re-disparo inmediata (fuera de alcance visual de esta spec), solo que el contador vuelve a 0 en el siguiente ciclo de ataque válido.
- Los N golpes de una secuencia `MultiHit` se resuelven en el mismo instante de impacto (mismo tick de cooldown vencido) en vez de distribuirse en sub-intervalos — la más simple compatible con el modelo de tick discreto ya usado por `src/engine/simulation.ts` (`deltaSeconds` por paso), sin introducir un sub-reloj nuevo.
- El "doble de daño" de Crítico se aplica sobre el daño ya calculado por `specs/015-catalogo-habilidades-combate` (Debilitar, `TraitTargeting`/`TraitResistance`) — es el último multiplicador en aplicarse.
- El RNG inyectable (FR-010) sigue el mismo patrón de determinismo en tests que el resto de `src/engine/` (funciones puras parametrizadas): una función `(min, max) => number` o equivalente, con `Math.random` como implementación por defecto en producción y una función sembrada en los tests — sin introducir una interfaz de aleatoriedad más amplia de la necesaria.
- Esta feature no añade animaciones nuevas por tipo de ataque más allá de lo ya exigido por Constitución § III; solo afecta la lógica de aplicación de daño y los datos correspondientes.
