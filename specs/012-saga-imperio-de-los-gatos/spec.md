# Feature Specification: Saga "Imperio de los Gatos" — Arcos, Gatorreta y Brote Zombi

**Feature Branch**: `012-saga-imperio-de-los-gatos`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/013-empire-of-cats-saga` (proyecto Unity origen): agrupar niveles en arcos de saga con multiplicadores de costo/fuerza propios, oleadas de refuerzo disparadas por % de vida de la base enemiga, límite de enemigos simultáneos, recompensas de nivel (moneda, tesoro, desbloqueo de gato en primera victoria), el cañón especial "Gatorreta", la mejora de regeneración de energía en batalla, el modificador "Brote Zombi" sobre niveles ya superados, y recompensas al completar un arco completo.

**Nota de adaptación**: salta deliberadamente `the_battler_test/specs/011-imported-asset-audit` y `012-real-asset-integration` — ambas tratan exclusivamente de auditar/integrar packs de arte importados a Unity, y battle-cats-web ya resolvió su identidad visual de forma procedural (`specs/003-identidad-visual-animada`, `specs/010-evolucion-de-gatos`) sin ningún pipeline de assets importados; no hay nada que adaptar. Esta spec retoma la numeración en el primer contenido de origen todavía sin adaptar. "Dinero"/"XP" del origen se funden en el único recurso de progresión ya existente de battle-cats-web: `currency` (`specs/001-nucleo-del-juego`, gastado en `useMetaStore.upgradeCat`); no se introduce una segunda economía. El "GachaScreen" ya scaffoldeado (`specs/004-menu-principal-config`) permanece intacto como stub — ningún gato se desbloquea por azar/moneda premium en esta spec (Constitución § VII).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El costo y la fuerza enemiga escalan por arco (Priority: P1)

Un jugador avanza por los arcos de la saga. El mismo gato cuesta distinto y el mismo enemigo golpea distinto según el arco activo: más barato y enemigos más débiles en el Arco 1, precio normal y enemigos más fuertes en el Arco 2, y más marcado aún en el Arco 3.

**Why this priority**: Es la mecánica estructural que distingue arcos entre sí; sin ella "varios arcos" es solo una etiqueta y ninguna otra historia tiene un arco real sobre el cual apoyarse.

**Independent Test**: Desplegar el mismo gato dentro de un nivel de un arco con multiplicador de costo distinto de 1 y verificar que `deployUnit` cobra el costo base multiplicado, sin alterar `Cat.cost`; enfrentar el mismo enemigo en niveles de dos arcos distintos y verificar que su `hp`/`damage` en `BattleUnit` difieren según el multiplicador de fuerza del arco.

**Acceptance Scenarios**:

1. **Given** un gato con `cost` base 30 desplegado en un nivel de un arco con `costMultiplier: 0.5`, **When** el jugador lo despliega, **Then** el costo cobrado es 15, sin modificar `CATS`.
2. **Given** el mismo enemigo base desplegado en un nivel de un arco con `enemyStrengthMultiplier: 1` y en el nivel equivalente de un arco con `enemyStrengthMultiplier: 4`, **When** ambos combates se ejecutan, **Then** el `hp`/`damage` del enemigo en el segundo arco son 4 veces los del primero.
3. **Given** un nivel que no pertenece a ningún arco declarado, **When** se juega, **Then** se comporta exactamente igual que hoy (multiplicadores 1, sin cambio de comportamiento).

---

### User Story 2 - Oleada de refuerzo al cruzar un umbral de vida de la base enemiga (Priority: P2)

En un nivel configurado con un umbral al 50% de vida de la base enemiga, al reducir su vida a ese punto se dispara automáticamente una oleada de refuerzo adicional.

**Why this priority**: Es la dificultad dinámica que distingue a niveles con este evento de una simple lista de oleadas por tiempo.

**Independent Test**: Configurar un nivel con un umbral al 50% y una oleada de refuerzo; llevar la vida de la base enemiga a ese porcentaje y verificar que la oleada de refuerzo se genera exactamente una vez.

**Acceptance Scenarios**:

1. **Given** un nivel con un umbral al 50% de vida de base enemiga y una oleada de refuerzo configurada, **When** la vida de la base enemiga cae a 50% o menos por primera vez, **Then** `stepSimulation` genera esa oleada exactamente una vez.
2. **Given** el mismo nivel, **When** la vida sigue bajando del 50% al 10%, **Then** ese umbral no vuelve a dispararse.
3. **Given** un nivel con umbrales en 50% y 20%, **When** un solo golpe hace que la vida pase de 60% a 15% en el mismo tick, **Then** ambos umbrales se disparan, cada uno una única vez.

---

### User Story 3 - Límite de enemigos simultáneos por nivel (Priority: P3)

En un nivel configurado con un máximo de 3 enemigos simultáneos, nunca hay más de 3 con vida en el carril a la vez; los siguientes de la oleada esperan a que el conteo baje.

**Why this priority**: Acota el ritmo de la batalla; es una restricción de generación, no una mecánica de combate nueva — menor impacto que las dos anteriores.

**Independent Test**: Configurar un nivel con límite 3 y una oleada que intentaría generar un cuarto enemigo antes de que muera alguno de los tres primeros; verificar que el cuarto no aparece hasta que el conteo baje de 3.

**Acceptance Scenarios**:

1. **Given** un nivel con `maxSimultaneousEnemies: 3` y ya 3 enemigos vivos, **When** toca generar un cuarto según su `spawnAtSeconds`, **Then** su generación se retiene hasta que el conteo baje de 3.
2. **Given** el mismo nivel, **When** uno de los 3 enemigos vivos muere, **Then** el enemigo retenido se genera en el siguiente tick disponible.
3. **Given** un nivel sin `maxSimultaneousEnemies` declarado, **When** se juega, **Then** se comporta exactamente igual que hoy (sin límite).

---

### User Story 4 - Recompensas de victoria: moneda, tesoro y desbloqueo de gato en primera victoria (Priority: P1)

Al ganar un nivel configurado con tesoro y desbloqueo de gato, el jugador recibe la moneda y el tesoro configurados, y desbloquea el gato solo la primera vez que gana ese nivel.

**Why this priority**: Es la recompensa que motiva el avance nivel a nivel; ya existe parcialmente (`currencyReward` vía `BattleScreen`) — esta historia completa el ciclo con tesoro y unidad, cerrando el hueco de que `useMetaStore.addOwnedCat` hoy no lo invoca ninguna pantalla.

**Independent Test**: Configurar un nivel con `treasureId` y `firstVictoryUnlockCatId`; ganarlo dos veces seguidas y verificar que el tesoro se otorga en ambas victorias mientras que el gato se añade a `ownedCats` solo en la primera.

**Acceptance Scenarios**:

1. **Given** un nivel con tesoro y gato de desbloqueo configurados, **When** el jugador lo gana por primera vez, **Then** recibe la moneda y el tesoro configurados, y el gato pasa a estar disponible en `ownedCats`/`DeployBar`.
2. **Given** el mismo nivel ya ganado antes, **When** el jugador lo gana de nuevo, **Then** recibe nuevamente moneda y tesoro, pero no se repite el desbloqueo del gato (ya estaba en `ownedCats`).
3. **Given** un nivel sin `treasureId` ni `firstVictoryUnlockCatId`, **When** se gana, **Then** se comporta exactamente igual que hoy.

---

### User Story 5 - Cañón especial "Gatorreta" (Priority: P5)

Durante la batalla, un cañón de recarga lenta en la base del jugador se va cargando con el tiempo. Al terminar de cargar, el jugador puede activarlo manualmente para dañar en área a los enemigos dentro de su rango, tras lo cual vuelve a recargarse desde cero.

**Why this priority**: Sistema de combate independiente y opcional; no bloquea ninguna historia anterior.

**Independent Test**: Iniciar una batalla, esperar a que el cañón termine su recarga, activarlo y verificar que aplica daño de área a los enemigos dentro de rango y vuelve a recargarse desde cero.

**Acceptance Scenarios**:

1. **Given** una batalla en curso con el cañón recargando, **When** el tiempo de recarga configurado transcurre, **Then** el cañón queda disponible para activación manual.
2. **Given** el cañón disponible con enemigos dentro y fuera de su rango de área, **When** el jugador lo activa, **Then** solo los enemigos dentro de rango reciben el daño configurado, y el cañón reinicia su recarga.
3. **Given** el cañón todavía recargando, **When** el jugador intenta activarlo, **Then** la activación no tiene efecto y no reinicia el temporizador.

---

### User Story 6 - Mejorar la regeneración de energía durante la batalla (Priority: P6)

Durante una batalla, el jugador puede gastar energía ya acumulada para aumentar la tasa de regeneración de energía por el resto de esa batalla.

**Why this priority**: Decisión económica adicional sobre un sistema ya jugable; ninguna otra historia depende de ella.

**Independent Test**: Acumular energía suficiente para pagar la mejora, activarla, y verificar que `energy.regenPerSecond` aumenta de inmediato y se mantiene por el resto de la batalla.

**Acceptance Scenarios**:

1. **Given** una batalla en curso con energía acumulada suficiente, **When** el jugador activa la mejora, **Then** la energía requerida se descuenta una sola vez y `energy.regenPerSecond` aumenta para el resto de la batalla.
2. **Given** energía acumulada insuficiente, **When** el jugador intenta activarla, **Then** la activación no tiene efecto y `regenPerSecond` no cambia.

---

### User Story 7 - Brote Zombi en niveles ya superados (Priority: P7)

El jugador puede volver a jugar un nivel ya superado con el modificador "Brote Zombi" activo: los enemigos estándar se reemplazan por su elenco zombi configurado, sin jefe, con victoria centrada en destruir la base enemiga.

**Why this priority**: Contenido rejugable que depende de que un nivel ya tenga historial de victoria (Historia 4); es la historia de mayor alcance y la que más se apoya en las demás.

**Independent Test**: Marcar un nivel ya superado con `zombieWave` configurado; iniciarlo en modo Brote Zombi y verificar que únicamente aparecen enemigos de ese elenco, nunca el estándar ni el jefe del arco.

**Acceptance Scenarios**:

1. **Given** un nivel superado con `zombieWave` configurado, **When** el jugador lo inicia en modo Brote Zombi, **Then** todos los enemigos generados provienen de `zombieWave`, nunca de `enemyWave`.
2. **Given** el mismo nivel en modo Brote Zombi, **When** pertenece a un arco con `bossLevelId` igual a ese nivel, **Then** el jefe del arco (`specs/020-barrera-de-base`) no se genera ni bloquea la base enemiga.
3. **Given** un nivel que **no** ha sido superado todavía, **When** el jugador intenta seleccionar Brote Zombi para él, **Then** la opción no está disponible.
4. **Given** un nivel sin `zombieWave` configurado, **When** el jugador lo consulta, **Then** el modo Brote Zombi no se ofrece para ese nivel.

---

### User Story 8 - Recompensas al completar un arco (Priority: P8)

Al completar todos los niveles de un arco, el jugador recibe las recompensas de finalización configuradas (gatos a desbloquear, siguiente arco a abrir).

**Why this priority**: Recompensa de mayor alcance; depende de que los arcos existan (Historia 1) y de que el guardado registre victorias por nivel (Historia 4) — por eso es la de menor prioridad, ya que desbloquea *acceso*, no implementa los sistemas desbloqueados en sí.

**Independent Test**: Marcar como superados todos los niveles de un arco de prueba con recompensas de finalización definidas, y verificar que, al superar el último nivel pendiente, esas recompensas se otorgan exactamente una vez.

**Acceptance Scenarios**:

1. **Given** todos los niveles de un arco superados menos uno, **When** el jugador supera ese último nivel, **Then** el arco queda registrado como completado y sus recompensas de finalización (gatos, siguiente arco) se otorgan.
2. **Given** un arco ya completado, **When** el jugador vuelve a ganar cualquiera de sus niveles, **Then** las recompensas de finalización no se otorgan una segunda vez.
3. **Given** un arco con niveles pendientes, **When** el jugador consulta su progreso, **Then** sus recompensas de finalización aparecen como no obtenidas todavía.

---

### Edge Cases

- Multiplicador de costo/fuerza que produce un valor con decimales (ej. costo 30 × 0.667): se redondea al entero más cercano de forma consistente (ver Assumptions).
- Dos umbrales de vida de base se cruzan en el mismo tick (Historia 2, Escenario 3): ambos se disparan, cada uno una única vez.
- Límite de enemigos simultáneos alcanzado justo cuando toca generar uno programado: la generación se retiene (Historia 3).
- Intento de activar la Gatorreta mientras recarga: sin efecto (Historia 5, Escenario 3).
- Intento de mejorar regeneración sin energía suficiente: sin efecto, nada se descuenta (Historia 6, Escenario 2).
- Nivel sin `zombieWave` configurado: Brote Zombi no se ofrece (Historia 7, Escenario 4).
- El jugador sale de la batalla a mitad (botón "Salir", `reset()`): el estado efímero de umbrales disparados, cañón y boost de regeneración se descarta con el resto de `SimState`, sin persistir nada (Constitución § V).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir agrupar niveles existentes (`src/data/levels.ts`) en un `SagaArc` con `costMultiplier` y `enemyStrengthMultiplier` propios.
- **FR-002**: `useGameStore.deployUnit` DEBE aplicar el `costMultiplier` del arco al que pertenece el nivel activo al costo cobrado, redondeado al entero más cercano, sin modificar `Cat.cost`.
- **FR-003**: `spawnEnemyUnit` (`src/engine/simulation.ts`) DEBE aplicar el `enemyStrengthMultiplier` del arco activo a `hp`/`maxHp`/`damage` del enemigo generado, redondeado al entero más cercano, sin modificar `CATS`.
- **FR-004**: Un nivel sin arco declarado DEBE comportarse exactamente igual que hoy (multiplicadores 1).
- **FR-005**: El sistema DEBE permitir declarar, por nivel, uno o más umbrales de % de vida de la base enemiga con su oleada de refuerzo asociada, y DEBE disparar cada umbral exactamente una vez por partida, la primera vez que la vida de la base enemiga cruza ese umbral hacia abajo.
- **FR-006**: El sistema DEBE permitir declarar, por nivel, un `maxSimultaneousEnemies`, y DEBE retener la generación de nuevos enemigos de la oleada mientras ese máximo de enemigos vivos esté alcanzado.
- **FR-007**: El sistema DEBE permitir declarar, por nivel, un `treasureId` y un `firstVictoryUnlockCatId`, otorgados al ganar: el tesoro en cada victoria, el gato solo si no estaba ya en `ownedCats` antes de esa victoria.
- **FR-008**: El sistema DEBE proveer un cañón especial de área en la base del jugador (recarga automática por tiempo, activación manual solo cuando terminó de recargar) que aplica daño de área a los enemigos dentro de su rango en el momento de la activación y reinicia su recarga desde cero.
- **FR-009**: Mientras el cañón está recargando, los intentos de activación NO DEBEN tener efecto ni reiniciar el temporizador.
- **FR-010**: El sistema DEBE permitir al jugador gastar energía acumulada durante una batalla para aumentar `energy.regenPerSecond` por el resto de esa batalla, rechazando la operación sin efecto si la energía acumulada es insuficiente.
- **FR-011**: El sistema DEBE permitir marcar un nivel ya superado como disponible para "Brote Zombi", con un `zombieWave: EnemyWaveEntry[]` que reemplaza por completo a `enemyWave` cuando el modificador está activo.
- **FR-012**: Con "Brote Zombi" activo, el sistema NO DEBE generar el enemigo jefe del arco (`specs/020-barrera-de-base`) si el nivel es su `bossLevelId`.
- **FR-013**: El sistema NO DEBE ofrecer "Brote Zombi" como opción para un nivel que el jugador todavía no ha superado, ni para uno sin `zombieWave` configurado.
- **FR-014**: El sistema DEBE permitir asociar a un `SagaArc` una lista de recompensas de finalización (`unlockCatIds`, `unlockNextArcId`), otorgadas exactamente una vez cuando todos sus niveles quedan marcados como superados en `completedLevelIds`.
- **FR-015**: El sistema DEBE persistir localmente (Dexie), sobreviviendo reinicios: qué tesoros posee el jugador (`obtainedTreasureIds`) y qué arcos ya otorgaron su recompensa de finalización (`grantedArcRewardIds`) — este último requiere un campo persistido propio para no volver a otorgarlo; si un gato ya está en `ownedCats` o un nivel ya está en `completedLevelIds` es suficiente para derivar "primera victoria"/"arco completo" sin un campo adicional.
- **FR-016**: El sistema DEBE permitir etiquetar cada `Cat` con una `rarity` opcional (Normal, Especial, Raro, Superraro, Megarraro, Legendario, Colaboración) con fines de presentación, sin ningún mecanismo de obtención aleatoria asociado.
- **FR-017**: `useMetaStore.upgradeCat` DEBE respetar un nivel máximo de mejora (por defecto 10), rechazando la mejora sin efecto al alcanzarlo; ese máximo DEBE subir a 20 cuando el arco configurado como segundo de la saga complete su recompensa de finalización (FR-014).

### Key Entities *(include if feature involves data)*

- **`SagaArc`** (nuevo, `src/data/sagaArcs.ts`): `id`, `name`, `levelIds: string[]`, `costMultiplier`, `enemyStrengthMultiplier`, `bossLevelId?`, `completionRewards: { unlockCatIds?: string[]; unlockNextArcId?: string }`.
- **`Level`** (existente, `src/data/levels.ts`, extendido): `+baseHpTriggers?: { thresholdPercent: number; reinforcementWave: EnemyWaveEntry[] }[]`, `+maxSimultaneousEnemies?: number`, `+treasureId?: string`, `+firstVictoryUnlockCatId?: string`, `+zombieWave?: EnemyWaveEntry[]`.
- **`Cat`** (existente, `src/data/cats.ts`, extendido): `+rarity?: RarityType`.
- **Cañón Especial** (nuevo, efímero en `useGameStore`): `{ rechargeRemaining: number; rechargeDurationSeconds: number; areaRadius: number; damage: number }`.
- **Progreso de Saga** (nuevo, persistido en `useMetaStore`): `obtainedTreasureIds: string[]`, `grantedArcRewardIds: string[]`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Para un mismo gato/enemigo, el costo de despliegue y las estadísticas de combate del enemigo difieren de forma consistente entre arcos, siguiendo exactamente los multiplicadores configurados.
- **SC-002**: En un nivel con umbral de vida de base configurado, la oleada de refuerzo se genera exactamente una vez por partida en el 100% de las partidas de prueba en las que la base cruza el umbral.
- **SC-003**: En un nivel con límite de enemigos simultáneos, el conteo de enemigos vivos nunca supera ese límite durante toda la partida.
- **SC-004**: El jugador recibe moneda y tesoro en el 100% de las victorias de un nivel con esas recompensas configuradas, y el desbloqueo de gato de primera victoria ocurre exactamente en la primera.
- **SC-005**: El cañón especial se activa manualmente en cuanto termina su recarga y aplica daño a todos los enemigos dentro de rango en el 100% de las activaciones válidas, sin efecto en el 100% de los intentos mientras recarga.
- **SC-006**: Ningún enemigo jefe de arco aparece en una partida con "Brote Zombi" activo, en el 100% de las partidas de prueba.
- **SC-007**: El progreso de tesoros, recompensas de arco otorgadas, y el nivel máximo de mejora sobreviven un reinicio de la aplicación, sin pérdida ni duplicación.
- **SC-008**: `npx tsc -b` limpio y `npm test` en verde, incluida la suite existente de `src/engine/` sin regresión.

## Assumptions

- Esta especificación cubre las **capacidades** de arco, umbral de vida de base, límite de enemigos simultáneos, recompensas de nivel, Gatorreta, mejora de regeneración de energía, y Brote Zombi. La **población de contenido** completa (todos los niveles y arcos de la saga) es autoría posterior, fuera de esta spec — igual que `specs/011-nivel-2-hacia-el-futuro` dejó la población completa de niveles como trabajo posterior a la mecánica.
- El redondeo tras aplicar un multiplicador de arco usa redondeo al entero más cercano, consistente en costo y en stats de enemigo.
- La moneda y el tesoro se otorgan en cada victoria (no solo la primera); el desbloqueo de gato de primera victoria ocurre una única vez — mismo criterio que `specs/010-evolucion-de-gatos` para "primera vez" derivada de estado ya persistido cuando es posible.
- "Brote Zombi" está disponible en cualquier momento sobre un nivel ya superado con `zombieWave` configurado, sin rotación temporal ni servidor (Persistencia Local-First, Constitución § V).
- El umbral de vida de base respeta el límite de enemigos simultáneos del nivel — si el límite ya está alcanzado cuando el umbral dispara, la oleada de refuerzo también queda retenida hasta que haya cupo.
- `rarity` (FR-016) es metadata de presentación; ningún mecanismo de obtención aleatoria, tasa de invocación, o moneda premium se especifica ni se implementa aquí — el `GachaScreen` ya scaffoldeado permanece un stub.
- El nivel máximo de mejora de `upgradeCat` no tenía tope antes de esta spec; FR-017 introduce el primer tope (10) junto con la regla de que sube a 20 al completar el segundo arco — no hay dato de guardado que migrar porque el tope se deriva en código, no se persiste como tal.
