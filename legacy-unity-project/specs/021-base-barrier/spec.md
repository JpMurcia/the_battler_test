# Feature Specification: Barrera de Base y Jefes Vinculados

**Feature Branch**: `021-base-barrier`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "Barrera de Base de \"The Battler\": ciertos niveles marcados como BossLevel (013-empire-of-cats-saga) otorgan a la base enemiga un escudo invulnerable hasta que se derrota a un enemigo jefe específico dentro de ese nivel, momento en el que la base vuelve a ser atacable con normalidad. Usar la ficha de \"The Face\" del manual técnico del proyecto (99999 HP / 2000 daño) como dato semilla del primer jefe real. Sigue https://battlecats.miraheze.org/wiki/Enemy_Bases sección \"Base Barrier\"."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver la base enemiga protegida mientras el jefe vinculado sigue con vida (Priority: P1)

Un jugador entra a un nivel marcado como jefe (`BossLevel` de `SagaArcDefinition`, `013-empire-of-cats-saga`) y, mientras el enemigo jefe vinculado a ese nivel siga con vida, sus unidades no logran hacerle ningún daño a la base enemiga por más que la ataquen.

**Why this priority**: Es el comportamiento base de todo el sistema — sin la barrera activa mientras el jefe vive, no hay ninguna razón para derrotarlo primero antes de atacar la base, y ninguna otra historia tiene sentido.

**Independent Test**: Entrar a un nivel configurado como `BossLevel` con su jefe vinculado, dejar que las unidades del jugador ataquen la base enemiga sin haber derrotado al jefe, y confirmar que la vida de la base enemiga permanece en su máximo.

**Acceptance Scenarios**:

1. **Given** un nivel marcado como `BossLevel` con su jefe vinculado con vida, **When** las unidades del jugador atacan la base enemiga, **Then** la base enemiga no pierde nada de vida.
2. **Given** un nivel que no está marcado como `BossLevel` (o sin jefe vinculado configurado), **When** las unidades del jugador atacan la base enemiga, **Then** la base enemiga pierde vida con normalidad, exactamente igual que hoy.

---

### User Story 2 - Derrotar al jefe vinculado retira la barrera y permite ganar el nivel (Priority: P1)

Un jugador que derrota específicamente al enemigo jefe vinculado a un `BossLevel` ve que la base enemiga deja de ser invulnerable de inmediato y puede completar el nivel atacándola con normalidad, igual que en cualquier otro nivel.

**Why this priority**: Es el pago del sistema — sin esto, la barrera sería un bloqueo permanente que dejaría el nivel imposible de ganar (un softlock), rompiendo la Historia 1 en vez de darle sentido.

**Independent Test**: En un `BossLevel` con la barrera activa, derrotar específicamente al jefe vinculado (no solo enemigos regulares de la oleada) y confirmar que, a partir de ese momento, los ataques del jugador sí reducen la vida de la base enemiga hasta poder ganar el nivel.

**Acceptance Scenarios**:

1. **Given** un `BossLevel` con la barrera activa y el jefe vinculado con vida, **When** el jefe vinculado es derrotado, **Then** la barrera de la base enemiga se retira de inmediato, sin ninguna acción adicional del jugador.
2. **Given** la barrera ya retirada tras derrotar al jefe, **When** las unidades del jugador siguen atacando la base enemiga, **Then** su vida se reduce con normalidad y el nivel puede ganarse igual que cualquier otro.
3. **Given** un `BossLevel` donde el jugador derrotó a todos los enemigos regulares de la oleada pero el jefe vinculado sigue con vida, **When** las unidades atacan la base enemiga, **Then** la barrera sigue activa y la base no pierde vida — derrotar enemigos regulares no basta, debe ser específicamente el jefe vinculado.

---

### Edge Cases

- ¿Qué pasa si el jugador pierde la batalla (su propia base es destruida) antes de derrotar al jefe? El intento termina en derrota con normalidad — la barrera solo afecta el daño hacia la base enemiga, no interfiere con la condición de derrota ya existente.
- ¿Qué pasa si el jugador reintenta un `BossLevel` tras una derrota? La barrera vuelve a empezar activa en ese nuevo intento — no existe ningún estado de "jefe ya derrotado" que persista entre intentos, igual que la vida de ambas bases ya se reinicia en cada intento nuevo (`BaseHealth.ResetHealth`).
- ¿Qué pasa con un nivel marcado como `BossLevel` que no tiene ningún jefe vinculado configurado (dato de contenido incompleto)? El sistema no debe dejar el nivel imposible de ganar por un error de autoría de contenido — por defecto, sin jefe vinculado configurado no se aplica ninguna barrera (ver FR-006).
- ¿Puede haber más de un jefe vinculado en el mismo nivel? Fuera de alcance de esta spec — se asume exactamente un jefe vinculado por `BossLevel`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir declarar, para un nivel marcado como `BossLevel` dentro de un `SagaArcDefinition` (`013-empire-of-cats-saga`), un enemigo específico de su oleada como "jefe vinculado" de ese nivel, distinguible de los enemigos regulares de la misma oleada.
- **FR-002**: Mientras el jefe vinculado de un `BossLevel` esté con vida, la base enemiga de ese nivel DEBE ser invulnerable — cualquier daño dirigido a ella DEBE resultar en cero pérdida de vida.
- **FR-003**: En el momento exacto en que el jefe vinculado es derrotado, el sistema DEBE retirar la barrera de la base enemiga de inmediato.
- **FR-004**: Una vez retirada la barrera, la base enemiga DEBE volver a recibir daño con normalidad, permitiendo ganar el nivel por el mismo flujo de victoria ya existente.
- **FR-005**: Derrotar únicamente a los enemigos regulares de la oleada de un `BossLevel` (sin derrotar al jefe vinculado) NO DEBE retirar la barrera de la base enemiga.
- **FR-006**: Los niveles que no estén marcados como `BossLevel`, o que no tengan un jefe vinculado configurado, DEBEN seguir funcionando exactamente igual que hoy — base enemiga siempre atacable, sin ninguna barrera aplicada (sin regresión, y sin softlock por contenido incompleto).
- **FR-007**: El estado de la barrera (activa/retirada) DEBE reiniciarse en cada intento nuevo de un `BossLevel` — no persiste entre un intento fallido y el siguiente, igual que la vida de las bases ya se reinicia en cada intento (`BaseHealth.ResetHealth`).
- **FR-008**: El estado de la barrera DEBE ser observable por el jugador durante la batalla (por ejemplo, una indicación visual distinta de la barra de vida normal de la base); la presentación exacta se decide en `/speckit.plan`.
- **FR-009**: Esta feature NO DEBE requerir ningún dato de guardado nuevo ni persistente — todo el estado de la barrera es efímero de partida, igual que la vida de las bases (mismo criterio ya seguido por `002-local-save-progress`: persistencia de cuenta separada de estado de partida efímero).

### Key Entities *(include if feature involves data)*

- **Jefe Vinculado** (nuevo): un enemigo específico dentro de la oleada de un `BossLevel`, distinto de los enemigos regulares, cuya derrota controla el estado de la barrera de la base enemiga de ese nivel.
- **Barrera de Base Enemiga** (nuevo, runtime/efímero): estado sobre la base enemiga de un `BossLevel` — activa mientras el jefe vinculado esté con vida, retirada de forma permanente para ese intento de batalla en cuanto se lo derrota.
- **`SagaArcDefinition.BossLevel`** (existente, [`SagaArcDefinition.cs`](../../Assets/Scripts/Model/Battler/SagaArcDefinition.cs)): ya identifica qué `ChapterDefinition` de un arco es su nivel de jefe; esta feature es el primer comportamiento real que consume ese campo (hoy documentado como "sin comportamiento propio").
- **Base Enemiga / `BaseHealth`** (existente, [`BaseHealth.cs`](../../Assets/Scripts/Gameplay/Battler/BaseHealth.cs)): esta feature extiende su comportamiento en tiempo de ejecución (invulnerabilidad condicional) sin cambiar su esquema de datos serializado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100% de los intentos de un `BossLevel` con el jefe vinculado con vida, la base enemiga termina el intento con exactamente la misma vida con la que empezó, sin importar cuánto daño reciban los ataques dirigidos a ella.
- **SC-002**: En el 100% de los intentos de un `BossLevel` donde se derrota al jefe vinculado, la base enemiga puede dañarse y el nivel ganarse a partir de ese momento, usando el mismo flujo de victoria ya existente.
- **SC-003**: Ningún nivel existente sin marcar como `BossLevel` cambia su comportamiento observable — 100% de los niveles no-jefe se mantienen sin regresión.
- **SC-004**: El jugador puede distinguir sin ambigüedad, en cualquier momento de la batalla, si la barrera de la base enemiga está activa o retirada, sin salir de la pantalla de batalla.

## Assumptions

- "Barrera de Base" en esta spec se refiere exclusivamente a la base ENEMIGA (no a la base del jugador) — sigue la sección "Base Barrier" de `https://battlecats.miraheze.org/wiki/Enemy_Bases`, que describe este mecanismo como una protección de la base atacada por el jugador hasta vencer a un jefe, no como una defensa de la propia base.
- Esta feature es el primer comportamiento real construido sobre `SagaArcDefinition.BossLevel` (`013-empire-of-cats-saga`), campo ya existente pero sin lógica propia hoy — no requiere ningún dato de guardado nuevo ni cambia la firma de `SagaArcDefinition` (se retiró explícitamente como requisito, ver `docs/plan-tecnico-manual-completo.md` §1.3 Grupo B).
- Un `BossLevel` tiene exactamente un jefe vinculado en el alcance de esta spec — múltiples jefes en el mismo nivel queda fuera de alcance.
- La ficha de "The Face" del manual técnico del proyecto (99999 HP / 2000 daño, sección 6.6) se usa como dato semilla del primer jefe vinculado real, siguiendo el mismo patrón de "catálogo del manual como datos semilla" ya usado en `011-imported-asset-audit`/`012-real-asset-integration` (ver `docs/plan-tecnico-manual-completo.md` §1.4) — a qué nivel/arco concreto se asigna este primer jefe se decide en `/speckit.plan`, no restringe el alcance funcional de esta spec.
- Esta feature no depende de `017-multi-hit-critical` ni de ninguna migración de clasificación "Metálico" — se retiró explícitamente como prerrequisito (`docs/plan-tecnico-manual-completo.md` §1.3 Grupo B); un jefe puede tener sus propios contadores/comportamiento sin depender de esa migración.
