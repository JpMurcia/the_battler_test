# Feature Specification: Talentos y Orbes

**Feature Branch**: `036-talentos-orbes`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Talentos y Orbes: sistema de mejora post-Forma Verdadera para unidades Megarraro/Legendario, gastando NP (npCurrency) — moneda que existe desde specs/024-sistema-gacha (intercambio de cápsulas duplicadas) pero que hoy no tiene ningún sumidero: se acumula y nunca se gasta. Tres pistas de inversión independientes hasta 5 puntos cada una: Resistencia a Debuff (Weaken/Freeze/Slow, reutilizando resistantTo ya usado por specs/015 y specs/035), Aumento de Estadísticas (HP/Daño, multiplicador aplicado en deployUnit), y Orbe (bono de daño infligido contra un rasgo elegido, reutilizando Ability.TraitTargeting, antepuesto al array abilities igual que specs/035 research.md Decisión 3). Basado en manual técnico §5.3/§9.5."

**Nota de origen**: cuarta spec de Nivel C del backlog — ver `specs/029` para el origen completo. Primer consumidor de `npCurrency` (`specs/024-sistema-gacha`, que la introdujo sin ningún sumidero todavía — se acumulaba sin límite de uso).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resistencia a Debuff: reducir la duración de un efecto elegido (Priority: P1)

Un jugador con un gato Megarraro o Legendario en Forma Verdadera abre su ficha de detalle, ve la sección de Talentos, y gasta NP para invertir puntos en Resistencia a Debuff, eligiendo un debuff (por ejemplo, Congelar) la primera vez que invierte en esa pista.

**Why this priority**: Es la pista con mayor impacto directo en la viabilidad de una unidad contra enemigos con debuffs específicos — la más cercana en valor a lo ya construido en `specs/035` (mismo mecanismo).

**Independent Test**: Con NP suficiente, invertir un punto en Resistencia a Debuff eligiendo "Congelar", desplegar esa unidad en batalla, y confirmar que su `resistantTo` incluye una entrada para `Freeze` con la duración reducida correspondiente a 1 punto.

**Acceptance Scenarios**:

1. **Given** un gato elegible sin puntos invertidos en esta pista, **When** el jugador invierte el primer punto eligiendo "Congelar", **Then** el NP se descuenta según el costo del primer punto, la elección "Congelar" queda fija, y la unidad desplegada recibe resistencia de duración contra Congelar.
2. **Given** la pista ya tiene puntos invertidos con "Congelar" elegido, **When** el jugador invierte un punto adicional, **Then** el NP se descuenta según el costo creciente correspondiente y la resistencia mejora (menor duración del debuff), sin poder cambiar la elección a otro debuff.
3. **Given** la pista alcanzó el máximo de puntos, **When** el jugador ve el panel, **Then** el botón de invertir en esa pista aparece deshabilitado.
4. **Given** NP insuficiente para el siguiente punto, **When** el jugador ve el panel, **Then** el botón de invertir aparece deshabilitado, mostrando el costo requerido.

---

### User Story 2 - Aumento de Estadísticas: más HP o más Daño (Priority: P1)

El mismo jugador invierte NP en aumentar el HP y/o el Daño de esa unidad de forma independiente.

**Why this priority**: Misma prioridad que la Historia 1 — es la segunda pista y la más simple de verificar (efecto puramente numérico).

**Independent Test**: Invertir puntos en HP y en Daño por separado, desplegar la unidad, y confirmar que sus estadísticas efectivas reflejan el porcentaje de bono correspondiente a los puntos invertidos en cada estadística.

**Acceptance Scenarios**:

1. **Given** un gato elegible, **When** el jugador invierte puntos en el contador de HP, **Then** el HP de la unidad desplegada aumenta el porcentaje correspondiente, sin afectar su Daño.
2. **Given** el mismo gato, **When** el jugador invierte puntos en el contador de Daño, **Then** el Daño de la unidad desplegada aumenta el porcentaje correspondiente, sin afectar su HP.
3. **Given** ambos contadores tienen puntos invertidos, **When** el jugador despliega la unidad, **Then** ambos bonos se aplican simultáneamente.

---

### User Story 3 - Orbe: bono de daño contra un rasgo elegido (Priority: P2)

El jugador invierte NP en un Orbe, eligiendo un rasgo (por ejemplo, "Rojo") la primera vez, para que la unidad inflija más daño contra enemigos de ese rasgo.

**Why this priority**: Menor prioridad que las dos primeras porque su efecto solo es relevante contra un subconjunto de enemigos (los del rasgo elegido), a diferencia de las otras dos pistas que siempre tienen efecto.

**Independent Test**: Invertir puntos en el Orbe eligiendo un rasgo, desplegar la unidad, enfrentarla contra un enemigo de ese rasgo y confirmar el daño incrementado; confirmar que contra un enemigo de otro rasgo el daño es el normal de la unidad.

**Acceptance Scenarios**:

1. **Given** un gato elegible sin Orbe invertido, **When** el jugador invierte el primer punto eligiendo el rasgo "Rojo", **Then** la elección queda fija y la unidad desplegada inflige daño incrementado contra enemigos "Rojo".
2. **Given** el Orbe ya tiene puntos invertidos en "Rojo", **When** el jugador despliega la unidad contra un enemigo de otro rasgo, **Then** el daño infligido es el normal de la unidad (sin bono), y el resto de sus habilidades propias (si existen) se siguen evaluando con normalidad.
3. **Given** la unidad ya tiene su propia habilidad de daño contra el mismo rasgo del Orbe, **When** se despliega, **Then** el bono del Orbe tiene prioridad de evaluación (research.md documentará el criterio, mismo patrón "antepuesto" de `specs/035`).

---

### Edge Cases

- Un gato deja de cumplir la elegibilidad (por ejemplo, no debería poder ocurrir un "des-evolucionar", pero si algún gato nunca alcanza Forma Verdadera): la sección de Talentos simplemente no se muestra; cualquier punto ya invertido en el pasado en otro gato no se ve afectado, porque el estado es por gato.
- El jugador intenta invertir en una pista con NP exactamente igual al costo del siguiente punto: la inversión procede con normalidad (el botón solo se deshabilita cuando el NP es insuficiente, no en el límite exacto).
- Dos gatos distintos, ambos elegibles, invierten en pistas con elecciones diferentes (por ejemplo, uno en Congelar, otro en Ralentizar): cada uno conserva su propio estado de forma independiente, sin interferencia.
- Un gato con Resistencia a Debuff ya al máximo (5 puntos) y también beneficiado por una construcción de Ototo Corps (`specs/035`) para el mismo debuff: ambos bonos conviven en `resistantTo` como entradas independientes, sin fusión especial (mismo criterio de no-fusión ya documentado en `specs/035`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar la sección de Talentos únicamente para un gato poseído cuya forma actual sea Verdadera y cuya rareza sea Megarraro o Legendario; para cualquier otro gato, la sección no aparece.
- **FR-002**: El sistema DEBE ofrecer 3 pistas de inversión independientes por gato elegible: Resistencia a Debuff, Aumento de Estadísticas (HP y Daño, contadores independientes) y Orbe — cada una hasta un máximo de 5 puntos.
- **FR-003**: El costo en NP de cada punto DEBE crecer con los puntos ya invertidos en esa pista/contador específico, y el sistema DEBE impedir la inversión cuando el NP disponible sea insuficiente.
- **FR-004**: Para Resistencia a Debuff y para Orbe, el sistema DEBE requerir que el jugador elija una opción (debuff o rasgo, respectivamente) únicamente al invertir el primer punto de esa pista; mientras la pista tenga al menos 1 punto invertido, la elección DEBE permanecer fija (sin mecanismo de cambio o reinicio en esta spec).
- **FR-005**: Toda unidad desplegada en batalla correspondiente a un gato con puntos en Resistencia a Debuff DEBE recibir una entrada `resistantTo` para el debuff elegido, con una reducción de duración proporcional a los puntos invertidos.
- **FR-006**: Toda unidad desplegada en batalla correspondiente a un gato con puntos en Aumento de Estadísticas DEBE tener su HP y/o Daño incrementados en el porcentaje proporcional a los puntos invertidos en cada contador, de forma independiente entre sí.
- **FR-007**: Toda unidad desplegada en batalla correspondiente a un gato con puntos en Orbe DEBE infligir daño incrementado contra enemigos del rasgo elegido, en un porcentaje proporcional a los puntos invertidos, sin afectar el daño contra otros rasgos.
- **FR-008**: Un gato sin ningún punto invertido en ninguna pista DEBE comportarse de forma idéntica a como lo hacía antes de esta spec (sin regresión).
- **FR-009**: El estado de talentos (puntos y elección por pista) DEBE persistir por gato individual entre sesiones (Constitución § V).

### Key Entities *(include if feature involves data)*

- **Talentos de un gato poseído** (persistida, por `catId`): puntos y elección de Resistencia a Debuff (debuff elegido, 0-5 puntos); puntos de Aumento de Estadísticas (HP y Daño, cada uno 0-5 puntos independientes); puntos y elección de Orbe (rasgo elegido, 0-5 puntos). Todos ausentes/0 por defecto para un gato sin inversión.
- **NP (`npCurrency`)**: moneda ya existente (`specs/024-sistema-gacha`) — esta spec es su primer sumidero.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un gato elegible con puntos en Resistencia a Debuff produce, al desplegarse, una `resistantTo` verificable para el debuff elegido, con reducción de duración creciente según los puntos invertidos.
- **SC-002**: Un gato elegible con puntos en Aumento de Estadísticas produce, al desplegarse, HP y/o Daño verificablemente incrementados según los puntos invertidos en cada contador.
- **SC-003**: Un gato elegible con puntos en Orbe inflige, en una batalla de prueba, daño verificablemente incrementado contra el rasgo elegido, y daño normal contra cualquier otro rasgo.
- **SC-004**: Un gato no elegible (fuera de Forma Verdadera, o rareza distinta de Megarraro/Legendario) nunca muestra la sección de Talentos.
- **SC-005**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en ninguna suite existente.

## Assumptions

- **Resist Knockback**: excluido de esta spec — el motor no modela ningún efecto de retroceso/aturdimiento sobre unidades (verificado: no existe rastro de "Knockback" en `src/`), y el manual (§9.2) documenta el retroceso solo como un efecto fijo del cañón especial, ya excluido de alcance jugable por `specs/035`. Introducir aquí una resistencia a un efecto que no existe en ningún lado excedería "conectar mecánica ya existente" (mismo criterio de exclusión que `specs/031`/`specs/035` aplicaron a mecánicas sin base en el motor).
- **Alcance por rareza**: solo Megarraro y Legendario, igual que el manual técnico (§5.3: "especialmente Uber Raros y Legendarios"). Unidades Normal/Especial/Raro/Superraro no tienen sección de Talentos en esta spec — mismo criterio de simplificación por rareza que ya usa `specs/024-sistema-gacha` para diferenciar cápsulas.
- **Sin reinicio/respec de talentos**: una vez elegido el debuff o el rasgo de una pista con al menos 1 punto invertido, la elección es permanente en esta spec — no se implementa un mecanismo de "reiniciar y reelegir" (común en el juego real mediante un ítem especial) por no estar pedido y añadir complejidad no solicitada; puede añadirse como extensión futura.
- **Sin niveles de "orbe físico" distintos**: el manual describe orbes obtenidos individualmente con nombres y calidades propias (por ejemplo, "Orbe de Ataque contra Rojo (Grande)"); esta spec simplifica a un único contador de puntos por pista con efecto lineal, mismo criterio de simplificación que `specs/031`/`specs/035` ya aplicaron a sus propios sistemas de mejora escalonada.
- Esta spec no cambia ningún archivo de `src/engine/` — todos los bonos se resuelven como campos ya soportados por `BattleUnit` (`resistantTo`, `abilities`, `hp`/`damage` numéricos), añadidos en el momento de construir la unidad (`deployUnit`), mismo patrón que `specs/010`/`specs/017`/`specs/031`/`specs/035`.
