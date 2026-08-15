# Feature Specification: Nivel 2 "Hacia el Futuro"

**Feature Branch**: `011-nivel-2-hacia-el-futuro`

**Created**: 2026-08-15

**Status**: Draft

**Input**: Adaptación a battle-cats-web de `the_battler_test/specs/010-chapter2-hacia-futuro` (proyecto Unity origen): segundo nivel jugable, con 1-2 gatos nuevos, que se desbloquea al completar el Nivel 1, reutilizando la misma plantilla de amenaza enemiga con dificultad escalada.

**Nota de adaptación**: la constitución de battle-cats-web (a diferencia de la del proyecto Unity origen) **no exige narrativa** (sin Principio equivalente al "diálogo pre/post-batalla con Timeline/Cinemachine" del origen) — battle-cats-web no tiene sistema de diálogo. Esta spec adapta el Capítulo 2 a lo que sí es alcance actual: un segundo `Level` jugable con identidad propia (nombre, gatos nuevos, oleada más difícil), con un texto breve opcional de ambientación en `LevelSelectScreen`/`ResultScreen` (no bloqueante, sin Timeline). Depende de `specs/005-mapa-de-niveles` (desbloqueo real), `specs/007-energia-mision-dificultad` (región/dificultad) y opcionalmente de `specs/008-tipos-de-ataque`/`specs/009-clasificacion-habilidades`/`specs/010-evolucion-de-gatos` si los gatos nuevos usan esos campos (no obligatorio — pueden ser gatos simples como los 4 actuales).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jugar el Nivel 2 completo tras desbloquearlo (Priority: P1)

Un jugador que completó el Nivel 1 entra al Nivel 2 desde la selección de niveles, juega la batalla desplegando gatos (incluidos 1-2 nuevos), y termina en victoria o derrota.

**Why this priority**: Recorrido central — replica para el Nivel 2 el mismo valor que ya tiene el Nivel 1; sin esto no hay contenido jugable nuevo.

**Independent Test**: Con el Nivel 1 completado (progreso guardado), entrar al Nivel 2 desde la selección y confirmar el recorrido completo hasta victoria o derrota.

**Acceptance Scenarios**:

1. **Given** el jugador completó el Nivel 1, **When** entra al Nivel 2, **Then** `startLevel('level-2')` inicializa `useGameStore` con la configuración de ese nivel (bases, energía, oleada).
2. **Given** el jugador está en la batalla del Nivel 2, **When** despliega gatos pagando el recurso de batalla, **Then** actúan de forma autónoma en el carril, igual que en el Nivel 1.
3. **Given** la batalla del Nivel 2 termina, **When** finaliza, **Then** el jugador ve el resultado (victoria/derrota) en `ResultScreen`, igual que el Nivel 1.

---

### User Story 2 - El Nivel 2 se desbloquea automáticamente al completar el Nivel 1 (Priority: P1)

Un jugador que completa el Nivel 1 ve, la próxima vez que abre selección de niveles, que el Nivel 2 pasó de bloqueado a desbloqueado.

**Why this priority**: Conecta este nivel con el mecanismo genérico de `specs/005-mapa-de-niveles`; sin esto, el Nivel 2 existiría como contenido pero sería inalcanzable desde el flujo normal.

**Independent Test**: Completar el Nivel 1, volver a selección de niveles y confirmar que `LEVELS[1]` (Nivel 2) queda desbloqueado según `getLevelState` (`specs/005-mapa-de-niveles`), sin ninguna excepción hardcodeada.

**Acceptance Scenarios**:

1. **Given** el progreso indica que el Nivel 1 está completado (`highestUnlockedLevelIndex >= 1`), **When** el jugador abre selección de niveles, **Then** el Nivel 2 aparece desbloqueado.
2. **Given** el Nivel 1 no está completado, **When** el jugador abre selección de niveles, **Then** el Nivel 2 permanece bloqueado.

---

### User Story 3 - El Nivel 2 introduce 1-2 gatos nuevos y una oleada más difícil (Priority: P2)

Un jugador identifica que el Nivel 2 introduce gatos nuevos en su roster potencial y una oleada enemiga más exigente que el Nivel 1.

**Why this priority**: Da sentido de contenido nuevo real, no solo un nivel repetido con números distintos.

**Independent Test**: Comparar `LEVELS[1].enemyWave` contra `LEVELS[0].enemyWave` y confirmar mayor `difficulty` (`specs/007-energia-mision-dificultad`); confirmar que existen 1-2 `Cat` nuevos en `src/data/cats.ts` marcados como propios de este nivel.

**Acceptance Scenarios**:

1. **Given** el jugador compara el Nivel 1 y el Nivel 2, **When** revisa la oleada enemiga y las bases, **Then** el Nivel 2 tiene una configuración de amenaza igual o más difícil (misma plantilla estructural — oleada por tiempo — reutilizada de `specs/002-motor-de-combate`, sin rediseño).
2. **Given** el jugador revisa `src/data/cats.ts`, **When** cuenta los gatos disponibles, **Then** hay 1-2 gatos nuevos respecto al catálogo de 4 ya existente.

---

### Edge Cases

- Intentar entrar al Nivel 2 sin haber completado el Nivel 1: bloqueado, consistente con `specs/005-mapa-de-niveles`.
- Ambas bases llegan a 0 en el mismo tick: se resuelve igual que hoy en `stepSimulation` (derrota del jugador tiene prioridad, comportamiento ya existente, sin cambios).
- Gatos nuevos del Nivel 2 sin `evolutions`/`abilities`/`attackType` declarados: se tratan con los valores por defecto ya definidos en `specs/008-tipos-de-ataque`/`specs/009-clasificacion-habilidades`/`specs/010-evolucion-de-gatos` (`'Single'`, `'Traitless'`, sin evolución) — no es obligatorio usarlos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `src/data/levels.ts` DEBE declarar un segundo `Level` (`level-2`) con `name`, `playerBaseHp`, `enemyBaseHp`, `maxEnergy`, `energyRegenPerSecond`, `currencyReward`, `enemyWave`, y los campos de `specs/007-energia-mision-dificultad` (`energyCost`, `region`, `difficulty >= LEVELS[0].difficulty` si comparte región, o una región nueva).
- **FR-002**: `src/data/cats.ts` DEBE declarar 1-2 `Cat` nuevos, cada uno con stats propios (costo, cooldown, hp, daño, velocidad, ancho, intervalo de ataque) — sin reutilizar valores de los 4 existentes.
- **FR-003**: El Nivel 2 DEBE ser jugable con el mismo núcleo de combate ya existente (`useGameStore.startLevel`/`tick`/`deployUnit`, `stepSimulation`), sin requerir cambios a `src/engine/`.
- **FR-004**: El sistema DEBE desbloquear el Nivel 2 únicamente a través del mecanismo genérico de `specs/005-mapa-de-niveles` (`highestUnlockedLevelIndex`) — sin ninguna excepción hardcodeada por `levelId`.
- **FR-005**: Los gatos nuevos del Nivel 2 NO ESTÁN obligados a declarar `attackType`/`classification`/`evolutions` — si no los declaran, usan los valores por defecto ya definidos en las specs correspondientes.
- **FR-006**: El sistema PUEDE mostrar un texto breve de ambientación para el Nivel 2 (p. ej. en `LevelSelectScreen` o `ResultScreen`), sin bloquear el flujo de juego ni requerir un sistema de diálogo nuevo.

### Key Entities

- **`Level` `level-2`** (nuevo, en `src/data/levels.ts`): mismo contrato que `level-1`, sin cambios de tipo.
- **Gatos nuevos** (1-2, en `src/data/cats.ts`): mismo contrato `Cat` ya existente, sin nuevos campos obligatorios.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador que completó el Nivel 1 puede completar el recorrido íntegro del Nivel 2 (selección → batalla → resultado) en una sola sesión.
- **SC-002**: El Nivel 2 pasa de bloqueado a desbloqueado el 100% de las veces que el jugador completa el Nivel 1 y vuelve a selección de niveles.
- **SC-003**: Un jugador sin el Nivel 1 completado no puede acceder a la batalla del Nivel 2 en el 100% de los intentos.
- **SC-004**: `npx tsc -b` limpio y `npm test` en verde (incluye el test de dificultad no decreciente por región de `specs/007-energia-mision-dificultad`, ya preparado para este caso).

## Assumptions

- Sin narrativa/diálogo Timeline (divergencia deliberada del origen, ver Nota de adaptación) — el "beat de historia" se reduce a nombre del nivel + texto breve opcional, no bloqueante.
- El diseño concreto de los 1-2 gatos nuevos (stats exactos, nombre, tema visual) se resuelve como contenido durante la implementación de esta spec, no como parte del `spec.md` en sí — mismo criterio que el origen para su propio guion.
- La oleada enemiga del Nivel 2 reutiliza la misma estructura de `EnemyWaveEntry[]` por tiempo ya definida en `specs/002-motor-de-combate`, solo con más/mejores entradas — sin rediseñar el formato de oleada.
- Esta spec depende funcionalmente de `specs/005-mapa-de-niveles` (para que el desbloqueo tenga efecto real) y de `specs/007-energia-mision-dificultad` (para los campos `energyCost`/`region`/`difficulty`); puede implementarse antes de `specs/008`-`specs/010` si los gatos nuevos no requieren esos campos.
