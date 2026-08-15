# Feature Specification: Extensión de Tipos de Ataque — Multi-Golpe y Crítico

**Feature Branch**: `017-multi-hit-critical`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "Extensión de tipos de ataque de \"The Battler\": añadir Multi-Hit (varios golpes por animación de ataque, con reinicio de la secuencia si la unidad es interrumpida antes del último impacto) y Crítico (probabilidad configurable de infligir el doble de daño) al AttackType existente de 007-attack-types, como miembros nuevos al final del enum (sin reordenar ni reinterpretar los valores existentes: SingleTarget/Area/LongDistance deben seguir siendo 0/1/2). No incluye reclasificar el rasgo \"Metálico\" — eso es una decisión de migración de datos separada, fuera de esta spec."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un ataque de Multi-Golpe inflige varios impactos en una sola secuencia (Priority: P1)

Un jugador observa que una unidad con tipo de ataque "Multi-Golpe" inflige varios impactos de daño independientes dentro de una misma secuencia de ataque, en lugar de un único impacto.

**Why this priority**: Es el comportamiento más distintivo y visible del sistema — sin él, "Multi-Golpe" no aporta ninguna diferencia observable frente a "Ataque Único".

**Independent Test**: Desplegar una unidad con "Multi-Golpe" configurada con N golpes contra un enemigo de prueba dentro de su alcance y contar los impactos de daño independientes registrados durante una secuencia de ataque completa sin interrupción.

**Acceptance Scenarios**:

1. **Given** una unidad "Multi-Golpe" configurada con N golpes tiene un enemigo dentro de su alcance, **When** completa una secuencia de ataque sin interrupción, **Then** ese enemigo recibe exactamente N impactos de daño independientes durante esa secuencia.
2. **Given** una unidad "Multi-Golpe" no tiene ningún enemigo dentro de su alcance, **When** su cooldown de ataque se cumple, **Then** no inflige ningún impacto, igual que "Ataque Único" sin objetivo.

---

### User Story 2 - Una secuencia de Multi-Golpe interrumpida se descarta sin dejar golpes pendientes (Priority: P2)

Un jugador observa que si el objetivo de una unidad "Multi-Golpe" es destruido o deja de estar en rango antes de que termine su secuencia de golpes, los golpes restantes de esa secuencia no se aplican a ningún otro objetivo, y la siguiente secuencia empieza desde cero.

**Why this priority**: Evita golpes "fantasma" que se trasladarían a un objetivo distinto del que los originó; refina el comportamiento base de la Historia 1 y previene un bug de diseño explícito señalado en el input de esta feature.

**Independent Test**: Iniciar la secuencia de golpes de una unidad "Multi-Golpe" contra un enemigo, destruirlo o sacarlo de rango antes del último impacto, y confirmar que ningún golpe adicional de esa secuencia se aplica a otro objetivo; luego confirmar que la siguiente secuencia contra un nuevo objetivo vuelve a empezar en el primer golpe.

**Acceptance Scenarios**:

1. **Given** una unidad "Multi-Golpe" ha aplicado algunos pero no todos los golpes de su secuencia contra un objetivo, **When** ese objetivo es destruido o deja de estar en rango antes del último golpe, **Then** los golpes restantes de esa secuencia no se aplican a ningún otro objetivo.
2. **Given** una unidad "Multi-Golpe" fue interrumpida a mitad de una secuencia, **When** adquiere un nuevo objetivo y su cooldown de ataque se cumple de nuevo, **Then** inicia una secuencia completa nueva de N golpes contra el nuevo objetivo, sin continuar desde el golpe donde quedó la secuencia anterior.

---

### User Story 3 - Un ataque Crítico inflige el doble de daño con probabilidad configurable (Priority: P1)

Un jugador observa que una unidad con tipo de ataque "Crítico" tiene una probabilidad configurable de infligir el doble de daño en un ataque dado.

**Why this priority**: Junto con Multi-Golpe, es el otro comportamiento explícitamente pedido en el alcance de esta feature; es independiente de Multi-Golpe y aporta valor táctico por sí solo.

**Independent Test**: Con la probabilidad de crítico fijada a un valor conocido (0% o 100%) en un entorno de prueba, desplegar la unidad y confirmar que el daño observado corresponde de forma consistente al valor esperado.

**Acceptance Scenarios**:

1. **Given** una unidad "Crítico" con probabilidad de crítico configurada al 100%, **When** ataca, **Then** cada ataque inflige el doble del daño base de la unidad.
2. **Given** una unidad "Crítico" con probabilidad de crítico configurada al 0%, **When** ataca, **Then** nunca inflige el doble de daño, solo el daño base.
3. **Given** una unidad "Crítico" con probabilidad de crítico configurada al 50%, **When** se observan 100 ataques en una muestra de prueba, **Then** el número de ataques con daño doble está entre 35 y 65 (±15 puntos porcentuales sobre el 50% esperado).

---

### Edge Cases

- ¿Qué pasa con las unidades/enemigos existentes que no declaran "Multi-Golpe" ni "Crítico"? Conservan su `AttackType` actual (Único/Área/Larga Distancia = 0/1/2) sin ningún cambio de comportamiento.
- ¿Qué pasa si una unidad o enemigo "Multi-Golpe"/"Crítico" pertenece al bando enemigo? Mismo comportamiento simétrico ya exigido por FR-007 de `007-attack-types` para unidades del jugador.
- ¿Cómo interactúa "Crítico" con los multiplicadores de daño ya existentes (Debilitar, Fuerte Contra de `016-combat-ability-catalog`)? Esta feature no define el orden exacto de combinación de multiplicadores — solo exige que el crítico duplique el daño resultante de esos cálculos; el orden se resuelve en `/speckit.plan` sin cambiar el alcance.
- ¿Puede una misma unidad ser "Multi-Golpe" y "Crítico" a la vez? Fuera de alcance: ambos son valores mutuamente excluyentes del mismo campo `AttackType`, igual que Único/Área/Larga Distancia ya lo son entre sí. Combinar ambos comportamientos en una sola unidad requeriría una spec de "flags" independiente, no esta.
- ¿Qué pasa si el número de golpes configurado para "Multi-Golpe" es 1? Es un caso degenerado válido — se comporta igual que "Ataque Único", sin manejo especial adicional.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE extender el `AttackType` de `007-attack-types` con dos miembros nuevos al final del enum ("Multi-Golpe" y "Crítico"), sin reordenar ni reinterpretar los tres valores existentes (Único/Área/Larga Distancia DEBEN seguir siendo 0/1/2).
- **FR-002**: Una unidad o enemigo con "Multi-Golpe" DEBE declarar en sus datos un número configurable de golpes por secuencia de ataque (entero ≥ 1).
- **FR-003**: Una unidad o enemigo con "Multi-Golpe" DEBE infligir esa cantidad de impactos de daño independientes contra su objetivo durante una única secuencia de ataque, siempre que no sea interrumpida.
- **FR-004**: Si el objetivo de una secuencia de "Multi-Golpe" es destruido o deja de ser un objetivo válido (fuera de rango) antes de completar todos sus golpes, el sistema DEBE descartar los golpes restantes de esa secuencia sin aplicarlos a ningún otro objetivo.
- **FR-005**: Tras una interrupción, la siguiente secuencia de "Multi-Golpe" DEBE reiniciar desde el primer golpe, nunca reanudar desde el punto de interrupción.
- **FR-006**: Una unidad o enemigo con "Crítico" DEBE declarar en sus datos una probabilidad configurable (0%-100%) de infligir daño crítico en cada ataque.
- **FR-007**: Cuando un ataque de una unidad o enemigo "Crítico" resulta en golpe crítico, el daño infligido en ese ataque DEBE ser el doble del que habría infligido sin crítico.
- **FR-008**: El comportamiento de "Multi-Golpe" y "Crítico" DEBE aplicarse de forma simétrica tanto a unidades del jugador como a enemigos, mismo criterio que FR-007 de `007-attack-types`.
- **FR-009**: Las unidades y enemigos existentes que no declaren "Multi-Golpe" ni "Crítico" DEBEN seguir comportándose exactamente igual que antes de esta feature.
- **FR-010**: Esta feature NO DEBE incluir la reclasificación del rasgo "Metálico" de especial a estándar, ni ningún contador especial de "Crítico" contra ese rasgo — queda como decisión de migración de datos separada, fuera de alcance.

### Key Entities *(include if feature involves data)*

- **AttackType** (extendido, de `007-attack-types`): gana dos valores nuevos — "Multi-Golpe" y "Crítico" — además de los tres ya existentes (Único/Área/Larga Distancia).
- **Configuración de Multi-Golpe**: dato nuevo asociado a la unidad/enemigo que define cuántos golpes independientes componen una secuencia de ataque.
- **Configuración de Crítico**: dato nuevo asociado a la unidad/enemigo que define la probabilidad de que un ataque dado sea crítico.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una unidad "Multi-Golpe" configurada con N golpes inflige exactamente N impactos de daño independientes por secuencia completa, en el 100% de los casos de prueba sin interrupción.
- **SC-002**: Al interrumpir una secuencia de "Multi-Golpe" a mitad de camino, el 0% de los golpes restantes se aplica a un objetivo distinto del original.
- **SC-003**: Con probabilidad de crítico al 100%, el 100% de los ataques observados de esa unidad infligen el doble de daño; al 0%, el 0% lo hace.
- **SC-004**: Con probabilidad de crítico configurada al 50% y una muestra de 100 ataques observados en prueba automatizada, el número de golpes críticos está entre 35 y 65 (±15 puntos porcentuales sobre el 50% esperado).
- **SC-005**: Las unidades y enemigos existentes (Único/Área/Larga Distancia) mantienen su comportamiento sin regresiones observables tras esta extensión.

## Assumptions

- El comportamiento y la terminología de "Multi-Hit" y "Crítico" se basan en el conocimiento público ya conocido de estas mecánicas en el juego de referencia (mismo criterio que `007-attack-types` documentó para sus tres tipos base); si difieren de una fuente específica, se ajustan en `/speckit.clarify` sin cambiar el alcance general.
- "Reinicio de la secuencia si la unidad es interrumpida" (frase del input de la feature) se interpreta como: el contador de golpes de "Multi-Golpe" no persiste entre secuencias separadas por una interrupción de objetivo — no implica que la propia unidad deba re-disparar su animación de ataque inmediatamente, solo que el contador vuelve a cero en el siguiente ciclo de ataque válido.
- El mecanismo exacto de temporización entre golpes de una misma secuencia de "Multi-Golpe" (todos en el mismo instante de impacto vs. distribuidos en sub-intervalos dentro del cooldown de ataque) queda para `/speckit.plan`; esta spec solo exige que N impactos independientes ocurran por secuencia no interrumpida.
- El "doble de daño" de "Crítico" se aplica sobre el daño ya calculado por los multiplicadores existentes (Debilitar, Fuerte Contra de `016-combat-ability-catalog`); el orden exacto de combinación de multiplicadores se resuelve en `/speckit.plan`.
- Al igual que en `007-attack-types`, el rasgo "Metálico" (`SpecialClassificationType.Metal`) permanece sin cambios — no se reclasifica en esta spec (ver `docs/plan-tecnico-manual-completo.md` §1.3 Grupo B).
- Esta feature no añade nuevas animaciones por tipo de ataque más allá de lo ya exigido por el Principio III de la constitución; solo afecta la lógica de aplicación de daño y los datos correspondientes.
