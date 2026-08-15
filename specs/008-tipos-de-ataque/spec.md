# Feature Specification: Tipos de Ataque (Attack Types)

**Feature Branch**: `008-tipos-de-ataque`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/007-attack-types` (proyecto Unity origen): cada gato y enemigo declara un tipo de ataque (Único, Área, Larga Distancia) que determina a cuántos objetivos y a qué distancia daña, siguiendo la referencia pública de mecánicas de Battle Cats. No incluye trait-targeting, neutral abilities ni inmunidades (eso es `specs/009-clasificacion-habilidades`).

**Nota de adaptación**: a diferencia del origen, battle-cats-web resuelve el combate en `src/engine/simulation.ts` con emparejamiento estrictamente 1 a 1 (`overlaps1D` detecta un único oponente por unidad y ambas quedan `Engaged`). Esta feature **sí toca el motor** (`src/engine/`) porque el comportamiento de Área y Larga Distancia no es expresable solo con datos — requiere generalizar la detección de objetivos de "el primero que se superpone" a "todos/el más lejano dentro de un rango". Se mantiene la separación motor/UI (Constitución § VI): todo el cambio vive en `src/engine/`, sin tocar `src/game/`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un ataque de Área daña a varios enemigos agrupados (Priority: P1)

Un jugador observa que una unidad con `attackType: 'Area'` inflige daño simultáneamente a todos los enemigos dentro de su radio de efecto, no solo al primero.

**Why this priority**: Es el comportamiento más distintivo — sin él, los tipos de ataque no aportan diferencia táctica observable.

**Independent Test**: En `stepSimulation`, colocar varios enemigos superpuestos dentro del `areaRadius` de una unidad `Area` y confirmar que todos reciben daño en el mismo tick de ataque.

**Acceptance Scenarios**:

1. **Given** varios enemigos están dentro del `areaRadius` de una unidad `Area`, **When** la unidad ataca (cooldown vencido), **Then** todos esos enemigos reciben `damage` en ese mismo tick.
2. **Given** solo un enemigo está en rango, **When** la unidad `Area` ataca, **Then** ese único enemigo recibe daño con normalidad (mismo resultado que `Single` en ese caso).

---

### User Story 2 - Un ataque Único solo golpea a un enemigo (Priority: P1)

Un jugador observa que una unidad con `attackType: 'Single'` (comportamiento por defecto, equivalente al motor actual) solo daña a un enemigo por ataque, incluso con varios en rango.

**Why this priority**: Contraste directo de la Historia 1; además preserva el comportamiento ya existente de `specs/002-motor-de-combate` para toda unidad sin tipo declarado.

**Independent Test**: Con varios enemigos agrupados dentro del alcance de una unidad `Single`, confirmar que solo uno recibe daño por ataque.

**Acceptance Scenarios**:

1. **Given** varios enemigos están dentro del alcance de una unidad `Single`, **When** ataca, **Then** solo uno recibe daño en ese ataque (el más cercano).
2. **Given** el objetivo de una unidad `Single` muere, **When** vuelve a atacar, **Then** el daño se dirige a otro enemigo en rango, sin afectar a más de uno por ataque.

---

### User Story 3 - Un ataque de Larga Distancia alcanza más allá del enemigo más cercano (Priority: P2)

Un jugador observa que una unidad con `attackType: 'LongRange'` puede dañar a un enemigo más lejano dentro de su `attackRange`, no limitada al más cercano.

**Why this priority**: Añade una dimensión táctica de alcance; depende de que ya exista el sistema base (Historias 1-2).

**Independent Test**: Con varios enemigos escalonados en X dentro del `attackRange` de una unidad `LongRange`, confirmar que el daño puede alcanzar a uno distinto del más cercano.

**Acceptance Scenarios**:

1. **Given** hay más de un enemigo dentro del `attackRange` de una unidad `LongRange`, **When** ataca, **Then** el objetivo elegido es el más lejano dentro de ese rango (no necesariamente el adyacente).

---

### User Story 4 - Los enemigos también declaran su propio tipo de ataque (Priority: P2)

Un jugador enfrenta enemigos cuyo tipo de ataque afecta de la misma forma a las unidades del jugador y a su base.

**Why this priority**: El sistema debe ser simétrico para que el desafío sea coherente.

**Independent Test**: Un enemigo `Area` contra varias unidades del jugador agrupadas debe dañarlas a todas, igual que una unidad `Area` del jugador.

**Acceptance Scenarios**:

1. **Given** un enemigo declara un `attackType`, **When** ataca a unidades del jugador o a la base del jugador, **Then** sigue las mismas reglas que aplican a una unidad equivalente del jugador.

---

### Edge Cases

- Las 4 unidades existentes de `src/data/cats.ts` no declaran `attackType` hoy — se les asigna `'Single'` por defecto (mismo comportamiento actual de `stepSimulation`, sin romper `specs/002-motor-de-combate` ni `specs/003-identidad-visual-animada`).
- ¿Ataque de Área contra una base? Una base es un único "objetivo" (no hay varias bases enemigas) — `Area` no tiene efecto adicional contra una base respecto a `Single`.
- ¿Dos unidades con distinto `attackType` atacan al mismo enemigo simultáneamente? Cada una aplica su daño según su propio tipo; no hay interacción combinada especial.
- ¿Una unidad `LongRange` sin ningún enemigo en rango? No inflige daño ese tick, igual que `Single`/`Area` sin objetivos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `Cat` (`src/data/cats.ts`) y `BattleUnit` (`src/engine/types.ts`) DEBEN declarar `attackType: 'Single' | 'Area' | 'LongRange'` y `attackRange: number` (distancia máxima de detección de objetivo, más allá de la superposición directa).
- **FR-002**: Toda unidad/enemigo sin `attackType` declarado explícitamente en sus datos DEBE tratarse como `'Single'` con `attackRange` equivalente al comportamiento actual (superposición directa).
- **FR-003**: `'Single'` DEBE dañar únicamente al enemigo más cercano dentro de rango, uno por ataque.
- **FR-004**: `'Area'` DEBE declarar además `areaRadius: number` y dañar simultáneamente a todos los enemigos dentro de ese radio alrededor del objetivo más cercano, en el mismo tick de ataque.
- **FR-005**: `'LongRange'` DEBE poder dañar al enemigo más lejano dentro de su `attackRange`, no limitado al más cercano/adyacente.
- **FR-006**: El comportamiento de cada tipo DEBE aplicarse simétricamente a unidades del jugador y enemigos, usando la misma función pura de `src/engine/`.
- **FR-007**: `stepSimulation`/`resolveEngagement` DEBEN seguir siendo funciones puras sin dependencias de React/Pixi (Constitución § VI) — el cambio se limita a `src/engine/`.
- **FR-008**: Esta feature NO DEBE incluir trait-targeting, neutral abilities ni inmunidades (`specs/009-clasificacion-habilidades`).

### Key Entities

- **`AttackType`**: `'Single' | 'Area' | 'LongRange'`.
- **`Cat`/`BattleUnit`** (existentes, extendidos): + `attackType`, `attackRange`, y `areaRadius` opcional (solo relevante si `attackType === 'Area'`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una unidad `Area` daña al 100% de los enemigos dentro de su `areaRadius` en el mismo tick de ataque.
- **SC-002**: Una unidad `Single` daña exactamente a un enemigo por ataque el 100% de las veces.
- **SC-003**: Una unidad `LongRange` puede dañar a un objetivo más allá del más cercano en al menos un escenario de test con enemigos escalonados.
- **SC-004**: Las 4 unidades existentes (`Single` por defecto) y toda la suite de `specs/002-motor-de-combate`/`specs/003-identidad-visual-animada` siguen pasando sin modificarse tras esta extensión.
- **SC-005**: `npx tsc -b` limpio y `npm test` en verde.

## Assumptions

- "Larga Distancia" se resuelve como: entre los enemigos dentro de `attackRange`, se ataca al **más lejano** (no al más cercano) — simplificación determinista de "puede alcanzar más allá del más cercano" del origen, ya que el carril 1D de battle-cats-web no tiene el concepto de "objetivos detrás de una línea de enemigos" salvo por posición en X.
- `Area` daña alrededor del objetivo primario (el más cercano), no alrededor de la posición de la unidad atacante — evita que `Area` golpee hacia atrás de forma contraintuitiva.
- No se referencia contenido externo (wiki) no verificable; el comportamiento de los 3 tipos se define directamente en esta spec, consistente con las Assumptions ya documentadas en el origen sobre el mismo punto.
- No hay nuevas animaciones por tipo de ataque más allá de lo ya exigido por `specs/003-identidad-visual-animada` — esta feature es puramente de `src/engine/` y `src/data/`.
