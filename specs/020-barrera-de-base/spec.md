# Feature Specification: Barrera de Base y Jefes Vinculados

**Feature Branch**: `020-barrera-de-base`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/021-base-barrier` (proyecto Unity origen): un nivel marcado como `bossLevelId` de su `SagaArc` (`specs/012-saga-imperio-de-los-gatos`) otorga a la base enemiga un escudo invulnerable hasta que se derrota a un enemigo jefe específico dentro de ese nivel, momento en el que la base vuelve a ser atacable con normalidad.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver la base enemiga protegida mientras el jefe vinculado sigue con vida (Priority: P1)

Un jugador entra a un nivel que es el `bossLevelId` de su arco y, mientras el enemigo jefe vinculado siga con vida, sus unidades no logran hacerle ningún daño a la base enemiga por más que la ataquen.

**Why this priority**: Comportamiento base de todo el sistema — sin la barrera activa mientras el jefe vive, no hay ninguna razón para derrotarlo antes de atacar la base, y ninguna otra historia tiene sentido.

**Independent Test**: Entrar a un nivel `bossLevelId` con su jefe vinculado con vida, dejar que las unidades del jugador ataquen la base enemiga, y confirmar que `enemyBase.hp` permanece en su máximo.

**Acceptance Scenarios**:

1. **Given** un nivel `bossLevelId` de su arco con el jefe vinculado con vida, **When** las unidades del jugador atacan la base enemiga, **Then** `enemyBase.hp` no pierde nada.
2. **Given** un nivel que no es `bossLevelId` de ningún arco (o sin jefe vinculado configurado), **When** las unidades del jugador la atacan, **Then** `enemyBase.hp` pierde vida con normalidad, exactamente igual que hoy.

---

### User Story 2 - Derrotar al jefe vinculado retira la barrera y permite ganar el nivel (Priority: P1)

Un jugador que derrota específicamente al enemigo jefe vinculado ve que la base enemiga deja de ser invulnerable de inmediato y puede completar el nivel atacándola con normalidad.

**Why this priority**: Es el pago del sistema — sin esto, la barrera dejaría el nivel imposible de ganar (un softlock), rompiendo la Historia 1 en vez de darle sentido.

**Independent Test**: En un nivel `bossLevelId` con la barrera activa, derrotar específicamente al jefe vinculado (no solo enemigos regulares de la oleada) y confirmar que, a partir de ese momento, los ataques del jugador sí reducen `enemyBase.hp` hasta poder ganar.

**Acceptance Scenarios**:

1. **Given** un nivel `bossLevelId` con la barrera activa y el jefe con vida, **When** el jefe vinculado es derrotado, **Then** la barrera se retira de inmediato, sin ninguna acción adicional del jugador.
2. **Given** la barrera ya retirada, **When** las unidades del jugador siguen atacando la base enemiga, **Then** `enemyBase.hp` se reduce con normalidad y el nivel puede ganarse igual que cualquier otro.
3. **Given** un nivel `bossLevelId` donde el jugador derrotó a todos los enemigos regulares de la oleada pero el jefe vinculado sigue con vida, **When** las unidades atacan la base enemiga, **Then** la barrera sigue activa — derrotar enemigos regulares no basta, debe ser específicamente el jefe vinculado.

---

### Edge Cases

- El jugador pierde la batalla (su propia base es destruida) antes de derrotar al jefe: el intento termina en `Defeat` con normalidad — la barrera solo afecta el daño hacia la base enemiga, no interfiere con la condición de derrota ya existente.
- El jugador reintenta un nivel `bossLevelId` tras una derrota: la barrera vuelve a empezar activa en ese nuevo intento — no persiste ningún estado de "jefe ya derrotado" entre intentos, igual que `playerBase`/`enemyBase` ya se reinician en cada `startLevel`.
- Un nivel marcado como `bossLevelId` sin ningún jefe vinculado configurado (dato de contenido incompleto): no debe dejar el nivel imposible de ganar por un error de autoría — por defecto, sin jefe vinculado configurado no se aplica ninguna barrera.
- Más de un jefe vinculado en el mismo nivel: fuera de alcance — se asume exactamente un jefe vinculado por `bossLevelId`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir declarar, para el nivel `bossLevelId` de un `SagaArc` (`specs/012`), un `bossCatId` que identifica cuál enemigo de su `enemyWave` es el "jefe vinculado" de ese nivel, distinguible de los enemigos regulares de la misma oleada.
- **FR-002**: Mientras la `BattleUnit` cuyo `catId === bossCatId` esté con vida (presente en `units` con `state !== 'Dead'`), la base enemiga DEBE ser invulnerable — cualquier daño dirigido a ella DEBE resultar en cero pérdida de `hp`.
- **FR-003**: En el momento exacto en que esa `BattleUnit` es derrotada (deja de estar en `units`), el sistema DEBE retirar la barrera de la base enemiga de inmediato, en el mismo tick.
- **FR-004**: Una vez retirada la barrera, la base enemiga DEBE volver a recibir daño con normalidad, permitiendo ganar el nivel por el mismo flujo de victoria ya existente en `stepSimulation`.
- **FR-005**: Derrotar únicamente a los enemigos regulares de la oleada de un nivel `bossLevelId` (sin derrotar al jefe vinculado) NO DEBE retirar la barrera.
- **FR-006**: Los niveles que no sean `bossLevelId` de ningún arco, o que no tengan `bossCatId` configurado, DEBEN seguir funcionando exactamente igual que hoy — base enemiga siempre atacable, sin barrera, sin softlock por contenido incompleto.
- **FR-007**: El estado de la barrera (activa/retirada) DEBE reiniciarse en cada intento nuevo de un nivel `bossLevelId` — no persiste entre un intento fallido y el siguiente, igual que `playerBase.hp`/`enemyBase.hp` ya se reinician en cada `startLevel`.
- **FR-008**: El estado de la barrera DEBE ser observable por el jugador durante la batalla (indicación visual distinta de la barra de vida normal de la base) en `BattleScreen`.
- **FR-009**: Esta feature NO DEBE requerir ningún dato de guardado nuevo ni persistente — todo el estado de la barrera es efímero de partida (`SimState`), igual que la vida de las bases (Constitución § V: persistencia de cuenta separada de estado de partida efímero).

### Key Entities *(include if feature involves data)*

- **`bossCatId`** (nuevo, en `SagaArc` o `Level` — a decidir en `/speckit.plan` según cuál referencia ya tiene `bossLevelId`, `specs/012`): identifica qué enemigo de la oleada del nivel jefe es el jefe vinculado.
- **Barrera de Base Enemiga** (nuevo, efímero en `SimState`): `bossBarrierActive: boolean` — `true` mientras exista una `BattleUnit` con `catId === bossCatId` y `team === 'Enemy'` viva; se recalcula cada tick, nunca se persiste.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100% de los intentos de un nivel `bossLevelId` con el jefe vinculado con vida, `enemyBase.hp` termina el intento exactamente igual que empezó, sin importar cuánto daño reciban los ataques dirigidos a ella.
- **SC-002**: En el 100% de los intentos donde se derrota al jefe vinculado, la base enemiga puede dañarse y el nivel ganarse a partir de ese momento, usando el flujo de victoria ya existente.
- **SC-003**: Ningún nivel existente sin `bossLevelId` cambia su comportamiento observable — 100% de los niveles no-jefe se mantienen sin regresión.
- **SC-004**: El jugador puede distinguir sin ambigüedad, en cualquier momento de la batalla, si la barrera está activa o retirada, sin salir de `BattleScreen`.
- **SC-005**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en `tests/unit/engine/*` existente.

## Assumptions

- "Barrera de Base" se refiere exclusivamente a la base ENEMIGA (no a la del jugador) — protección de la base atacada por el jugador hasta vencer a un jefe, no una defensa de la propia base.
- Esta feature es el primer comportamiento real construido sobre `SagaArc.bossLevelId` (`specs/012`, campo ya existente pero sin lógica propia hasta esta spec) — no requiere ningún dato de guardado nuevo ni cambia la persistencia de `SagaArc`.
- Un nivel `bossLevelId` tiene exactamente un jefe vinculado en el alcance de esta spec — múltiples jefes en el mismo nivel queda fuera de alcance.
- Esta feature no depende de `specs/016-multigolpe-critico` ni de ninguna migración de clasificación — un jefe puede tener sus propios stats/comportamiento (incluidos `MultiHit`/`Critical`/efectos de `specs/015` si se desea) sin depender de esa spec como prerrequisito estructural.
- Con "Brote Zombi" activo (`specs/012` Historia 7), el jefe vinculado no se genera (ya cubierto por `specs/012` FR-012) — esta spec no necesita repetir esa regla, solo asume que `bossBarrierActive` nunca se activa en modo zombi porque el `bossCatId` nunca aparece en `units`.
