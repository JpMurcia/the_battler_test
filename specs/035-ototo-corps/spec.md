# Feature Specification: Cuerpo Ototo (Ototo Corps)

**Feature Branch**: `035-ototo-corps`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Cuerpo Ototo: 2 construcciones (Base/Foundation y Estilo/Style) pagadas con materiales de Gamatoto (specs/034), con tiempo de construcción asíncrono (mismo patrón de timestamp que Gamatoto). Al elegir qué construir, el jugador elige también un rasgo objetivo (para Base) o un tipo de debuff (para Estilo); una vez construida, la unidad correspondiente otorga a TODAS las unidades propias desplegadas en batalla una resistencia de daño contra ese rasgo (Base) o una resistencia de duración contra ese debuff (Estilo), reutilizando TraitResistance/resistantTo ya implementados desde specs/015. Basado en manual técnico §9.2."

**Nota de origen**: tercera spec de Nivel C del backlog — ver `specs/029` para el origen completo. Primer consumidor de los materiales de Gamatoto (`specs/034`, que los introdujo sin ningún uso todavía). No requiere el sistema de "ingenieros" del manual (`specs/034` ya lo excluyó de su propio alcance) — solo materiales.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Construir la Base (Foundation): resistencia de daño a un rasgo (Priority: P1)

Un jugador con materiales suficientes abre el panel del Cuerpo Ototo, elige construir la Base, elige un rasgo objetivo (p. ej. "Flotante"), y confirma — quedando la construcción en curso hasta completarse.

**Why this priority**: Es una de las 2 construcciones del sistema y la primera que un jugador probablemente completa (junto con Estilo, misma prioridad) — sin esto no hay ningún efecto jugable.

**Independent Test**: Con materiales suficientes, construir la Base eligiendo un rasgo, esperar (o simular) a que la construcción termine, reclamarla, desplegar una unidad en batalla y confirmar que recibe una `TraitResistance` contra ese rasgo.

**Acceptance Scenarios**:

1. **Given** el jugador tiene materiales suficientes y la Base no está construida, **When** abre el panel y elige construir la Base con un rasgo objetivo, **Then** los materiales se descuentan, la construcción queda registrada como en curso, y no puede iniciar otra construcción hasta que esta termine.
2. **Given** materiales insuficientes, **When** el jugador intenta construir, **Then** la opción aparece deshabilitada.
3. **Given** la construcción de la Base se completó y se reclamó con el rasgo "Flotante", **When** el jugador despliega cualquier unidad en batalla, **Then** esa unidad recibe una `TraitResistance` (`targetClassifications: ['Floating']`) además de sus propias habilidades.
4. **Given** la Base ya está construida con un rasgo, **When** el jugador ve el panel, **Then** puede iniciar una nueva construcción para reemplazar el rasgo elegido (mismo costo y tiempo que la primera vez).

---

### User Story 2 - Construir el Estilo (Style): resistencia de duración a un debuff (Priority: P1)

Un jugador con materiales suficientes construye el Estilo eligiendo un tipo de debuff (Debilitar/Congelar/Ralentizar/Maldecir) — una vez completada, todas sus unidades desplegadas reciben resistencia a ese debuff.

**Why this priority**: Misma prioridad que la Historia 1 — es la segunda mitad simétrica del mismo sistema.

**Independent Test**: Construir el Estilo eligiendo un debuff, reclamarla, desplegar una unidad y confirmar que su `resistantTo` incluye una entrada para ese debuff.

**Acceptance Scenarios**:

1. **Given** el Estilo se completó y se reclamó con el debuff "Congelar", **When** el jugador despliega cualquier unidad en batalla, **Then** esa unidad recibe una entrada `resistantTo` para `Freeze`, reduciendo la duración de ese efecto si lo recibe.
2. **Given** la Base y el Estilo están construidos con elecciones distintas, **When** el jugador despliega una unidad, **Then** recibe ambos bonos a la vez (resistencia de daño de rasgo Y resistencia de duración de debuff).
3. **Given** ninguna construcción está completa, **When** el jugador despliega una unidad, **Then** no recibe ningún bono de Ototo — comportamiento idéntico al de antes de esta spec.

---

### User Story 3 - El progreso de construcción avanza con la app cerrada (Priority: P2)

Un jugador que inició una construcción, cierra la aplicación, y la reabre más tarde ve el progreso reflejando el tiempo real transcurrido — mismo comportamiento que `specs/034-gamatoto`.

**Why this priority**: Refuerzo de una propiedad de diseño ya validada en `specs/034` para el mismo tipo de mecánica — de menor urgencia porque el patrón ya es conocido y de bajo riesgo, a diferencia de conectar el efecto real (Historias 1/2).

**Independent Test**: Iniciar una construcción, simular el paso de tiempo real sin interacción de UI, releer el estado y confirmar que el progreso calculado es correcto.

**Acceptance Scenarios**:

1. **Given** una construcción en curso, **When** pasa tiempo real igual a su duración total mientras la aplicación está cerrada, **Then** al reabrir la aplicación se muestra como completa y reclamable.
2. **Given** una construcción en curso, **When** el jugador reabre la aplicación antes de que termine, **Then** el tiempo restante mostrado refleja el tiempo real ya transcurrido.

---

### Edge Cases

- El jugador intenta construir mientras ya hay una construcción en curso (de cualquiera de las 2): la opción de iniciar una nueva no está disponible hasta que la actual se reclame — un único slot de construcción compartido entre Base y Estilo (no 2 slots simultáneos).
- El jugador reemplaza la elección de una construcción ya completada (Acceptance Scenario 4 de US1): mientras la nueva construcción está en curso, el bono ANTERIOR (rasgo/debuff ya elegido previamente) sigue activo hasta que la nueva termine y se reclame — no hay una ventana sin bono solo por empezar a reconstruir.
- Un gato cuya propia `Ability`/`resistantTo` ya lo protege del mismo rasgo/debuff que Ototo también otorga: el bono de Ototo se añade igual (research.md documenta el criterio de combinación, sin bloquear ni duplicar de forma dañina).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer, desde el Hub, un panel del Cuerpo Ototo con 2 construcciones (Base, Estilo), cada una con su costo en materiales de Gamatoto y su tiempo de construcción.
- **FR-002**: Al iniciar la construcción de la Base, el jugador DEBE elegir un rasgo objetivo (`ClassificationType`) entre las 8 opciones estándar; al iniciar la del Estilo, un tipo de debuff (`EffectType`) entre las 4 opciones existentes.
- **FR-003**: El sistema DEBE permitir como máximo una construcción en curso a la vez (Base o Estilo, no ambas simultáneamente), y solo si los materiales de Gamatoto disponibles alcanzan el costo.
- **FR-004**: El progreso de una construcción en curso DEBE calcularse a partir del tiempo real transcurrido desde su inicio (mismo patrón que `specs/034-gamatoto`), independientemente de si la aplicación permaneció abierta.
- **FR-005**: Al reclamar una construcción completa, el sistema DEBE registrar la elección (rasgo o debuff) como la construcción activa de esa categoría, reemplazando cualquier elección anterior de la misma categoría.
- **FR-006**: Toda unidad propia desplegada en batalla DEBE recibir, además de sus propias habilidades: una `TraitResistance` contra el rasgo elegido si la Base está construida, y una entrada `resistantTo` para el debuff elegido si el Estilo está construido — ninguna de las dos si esa construcción no está completa.
- **FR-007**: Sin ninguna construcción completa, el comportamiento de despliegue de unidades DEBE ser idéntico al de antes de esta spec (sin regresión).
- **FR-008**: El estado de construcciones completas, la construcción en curso (si la hay) y los materiales de Gamatoto DEBEN persistir entre sesiones (Constitución § V).

### Key Entities *(include if feature involves data)*

- **Definición de construcción** (dato estático, `src/data/`): id (`'foundation' | 'style'`), nombre, costo en materiales, duración de construcción.
- **Construcción en curso** (persistida): id de construcción, elección (rasgo o debuff según corresponda), hora real de inicio — ausente cuando no hay ninguna.
- **Construcciones completas** (persistida): elección activa de la Base (rasgo, opcional) y del Estilo (debuff, opcional) — cada una independiente, puede haber una sin la otra.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El jugador puede construir la Base y el Estilo por separado, cada uno consumiendo el costo correcto de materiales y quedando en curso el tiempo definido.
- **SC-002**: Con la Base construida con un rasgo, toda unidad desplegada en una batalla de prueba tiene una `TraitResistance` verificable contra ese rasgo.
- **SC-003**: Con el Estilo construido con un debuff, toda unidad desplegada tiene una entrada `resistantTo` verificable para ese debuff.
- **SC-004**: El progreso de construcción es verificablemente independiente de si la aplicación estuvo abierta (mismo criterio de prueba que `specs/034` SC-002).
- **SC-005**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en ninguna suite existente.

## Assumptions

- **Ingenieros (manual §9.1/9.2)**: no se implementan — `specs/034-gamatoto` ya excluyó explícitamente ese mecanismo de su propio alcance; esta spec solo consume materiales.
- **Cabezas de Cañón (Cat Cannon, manual §9.2)**: excluidas de esta spec — el cañón especial (`specs/012`/`specs/029`) hoy tiene un único efecto fijo (daño de área) sin ningún comportamiento secundario (retroceso/aturdimiento) codificado en ningún lado; introducir variantes de un efecto secundario que no existe todavía excede el alcance de "conectar Ototo a mecánica ya existente" (mismo criterio de exclusión que `specs/031` aplicó a Ritmo/Cartera del Trabajador). Queda como extensión futura si se decide construir primero un efecto secundario base para el cañón.
- **Niveles de construcción**: el manual describe niveles progresivos por construcción; esta spec implementa un único nivel por construcción (construida o no), reemplazable con una nueva elección (Acceptance Scenario 4 de US1) — mismo criterio de simplificación que `specs/031` aplicó al tope de nivel de las mejoras de base.
- **Combinación con resistencias propias del gato**: si un gato ya tiene su propia `TraitResistance`/`resistantTo` para el mismo rasgo/debuff que Ototo también otorga, ambas entradas conviven en el arreglo resultante — el motor ya resuelve "primera coincidencia" (`src/engine/combat.ts`, sin cambios en esta spec), así que el orden de inserción determina cuál aplica en ese caso puntual; no se implementa una fusión especial (p. ej. sumar o tomar el mejor) por no estar pedido y añadir complejidad no solicitada.
- Esta spec no cambia ningún archivo de `src/engine/` — el bono de Ototo se resuelve como una `Ability`/entrada `resistantTo` adicional ya soportada por el motor, añadida al `BattleUnit` en el momento de construirlo (`deployUnit`), mismo patrón que `specs/010`/`specs/017`/`specs/031` ya usan para modificar unidades antes de que entren a la simulación.
