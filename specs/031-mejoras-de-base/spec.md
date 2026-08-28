# Feature Specification: Mejoras de Base

**Feature Branch**: `031-mejoras-de-base`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Mejoras de Base: segunda pestaña del panel Mejorar (junto a Unidades), meta-progresión pagada con la misma moneda de mejora de unidades, que sube de nivel mejoras permanentes de cuenta: Potencia/Alcance/Recarga del cañón especial (Gatorreta, ya implementado desde specs/012 pero con valores fijos), Defensa de Base (HP máximo de base), Investigación (reduce el cooldown de despliegue de unidades), Contabilidad (bono % a la moneda ganada al completar un nivel) y Energía (bono fijo al máximo de energía de misión). Basado en manual técnico §5.9."

**Nota de origen**: tercera spec del backlog derivado de comparar el mockup y el manual técnico contra `src/` (ver `specs/029`). Nivel B: requiere datos/persistencia nuevos (a diferencia de 029/030), pero ningún subsistema nuevo — cada mejora conecta con mecánica de combate/progreso ya existente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Subir de nivel una mejora de base con la misma moneda de siempre (Priority: P1)

Un jugador abre "Mejorar" y cambia a la pestaña "Mejoras de Base", donde ve una lista de mejoras permanentes de cuenta (no de una unidad concreta), cada una con su nivel actual, su costo para subir un nivel más, y sube la que puede pagar.

**Why this priority**: Es el mecanismo base sin el cual ninguna mejora concreta tiene forma de activarse — sin esto, las 6 mejoras de las historias siguientes no son alcanzables.

**Independent Test**: Con moneda suficiente, abrir la pestaña "Mejoras de Base", subir de nivel una mejora, y confirmar que su nivel aumenta y la moneda se descuenta el costo exacto mostrado.

**Acceptance Scenarios**:

1. **Given** el jugador abre "Mejorar", **When** cambia a la pestaña "Mejoras de Base", **Then** ve una lista de las 6 mejoras (Potencia de Cañón, Alcance de Cañón, Recarga de Cañón, Defensa de Base, Investigación, Contabilidad, Energía — 7 en total), cada una con su nivel actual (0 si nunca se subió) y el costo de subir al siguiente.
2. **Given** el jugador tiene moneda suficiente para una mejora, **When** pulsa "Mejorar" sobre ella, **Then** su nivel sube en 1, la moneda se descuenta exactamente el costo mostrado, y el cambio persiste tras recargar la aplicación.
3. **Given** el jugador no tiene moneda suficiente, **When** observa esa mejora, **Then** el botón de subir de nivel está deshabilitado.
4. **Given** una mejora ya alcanzó su tope de nivel, **When** el jugador la observa, **Then** el botón está deshabilitado y se indica que alcanzó el máximo.
5. **Given** el jugador sube de nivel una mejora, **When** vuelve a la pestaña "Unidades" del mismo panel Mejorar, **Then** el comportamiento de mejora de unidades sigue exactamente igual que antes de esta spec (misma moneda compartida, sin interferencia entre ambas pestañas).

---

### User Story 2 - El cañón especial en batalla refleja las mejoras de Potencia/Alcance/Recarga (Priority: P2)

Un jugador que subió de nivel las mejoras de cañón entra a una batalla y el cañón especial (conectado a la UI en `specs/029`) dispara con más daño, más alcance y/o recarga más rápida, según lo que haya mejorado.

**Why this priority**: Sin esta conexión, las 3 mejoras de cañón de la Historia 1 serían botones que suben un número sin ningún efecto jugable — igual de "huérfanas" que `evolveCat()` lo estaba antes de `specs/030`.

**Independent Test**: Subir Potencia de Cañón un par de niveles, entrar a una batalla, disparar el cañón (specs/029) y confirmar que el daño aplicado a los enemigos en rango es mayor que el valor base sin mejoras.

**Acceptance Scenarios**:

1. **Given** el jugador subió Potencia de Cañón a nivel N, **When** entra a una batalla y dispara el cañón especial, **Then** el daño aplicado es el valor base más el incremento de N niveles.
2. **Given** el jugador subió Alcance de Cañón, **When** dispara el cañón, **Then** el radio de área afectado es mayor que el valor base en la proporción correspondiente.
3. **Given** el jugador subió Recarga de Cañón, **When** el cañón se recarga tras un disparo, **Then** el tiempo de recarga es menor que el valor base, sin bajar de un piso mínimo razonable.
4. **Given** el jugador no subió ninguna mejora de cañón (nivel 0 en las 3), **When** entra a una batalla, **Then** el cañón se comporta exactamente igual que antes de esta spec (mismos valores por defecto de `specs/012`).

---

### User Story 3 - Defensa de Base, Investigación, Contabilidad y Energía afectan la partida (Priority: P2)

Un jugador que subió Defensa de Base entra a una batalla con más HP de base; uno que subió Investigación despliega unidades con cooldown reducido; uno que subió Contabilidad gana más moneda al ganar un nivel; uno que subió Energía tiene más energía de misión máxima disponible en el Hub.

**Why this priority**: Son las 4 mejoras restantes del manual §5.9 que sí tienen un sistema existente al que conectarse en este proyecto (a diferencia de "Ritmo/Cartera del Trabajador", ver Assumptions).

**Independent Test**: Subir Defensa de Base, entrar a una batalla, y confirmar que el HP máximo de la base propia es mayor que el valor base del nivel. Repetir el mismo patrón para Investigación (cooldown), Contabilidad (moneda de victoria) y Energía (máximo en el Hub).

**Acceptance Scenarios**:

1. **Given** el jugador subió Defensa de Base a nivel N, **When** entra a cualquier batalla, **Then** el HP máximo de la base propia es el valor definido por el nivel más el bono acumulado de N niveles.
2. **Given** el jugador subió Investigación a nivel N, **When** despliega cualquier unidad, **Then** su cooldown de redespliegue es menor que su valor base, sin bajar de un piso mínimo por unidad.
3. **Given** el jugador subió Contabilidad a nivel N, **When** completa un nivel con victoria, **Then** la moneda otorgada incluye el bono porcentual de N niveles, combinado con los bonos ya existentes (sets de tesoros, Cat Combos) de la misma forma en que esos dos ya se combinan entre sí.
4. **Given** el jugador subió Energía a nivel N, **When** observa el Hub, **Then** el máximo de energía de misión mostrado incluye el bono fijo de N niveles, sumado al máximo ya derivado del nivel de personaje.
5. **Given** ninguna de estas 4 mejoras tiene nivel subido, **When** el jugador juega, **Then** el comportamiento es idéntico al de antes de esta spec.

---

### Edge Cases

- El jugador sube una mejora de cañón a mitad de una batalla en curso (subir de nivel es una acción del Hub, no de batalla): el cambio se aplica a la SIGUIENTE batalla que empiece, nunca a la que ya está en curso (misma regla que cualquier otro cambio de progreso persistente vs. estado efímero de partida, Constitución § V).
- Investigación reduce el cooldown de una unidad cuyo cooldown base ya es muy bajo (p. ej. 2s): el piso mínimo evita que llegue a 0 o negativo.
- Recarga de Cañón reducida hasta el punto de acercarse al piso mínimo: el piso evita que el cañón se pueda disparar en un bucle sin sentido.
- El jugador no tiene ninguna mejora de base subida (todas en nivel 0): todos los valores de partida son exactamente los mismos que existían antes de esta spec — 0 regresiones.
- Dos mejoras que comparten el mismo tope de nivel llegan a él en momentos distintos: cada una se deshabilita de forma independiente al llegar a su propio tope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer, en el panel "Mejorar", una segunda pestaña "Mejoras de Base" junto a la pestaña "Unidades" ya existente.
- **FR-002**: El sistema DEBE listar 7 mejoras de base (Potencia/Alcance/Recarga de Cañón, Defensa de Base, Investigación, Contabilidad, Energía), cada una con nivel independiente (inicial 0) y tope de nivel propio.
- **FR-003**: Subir de nivel una mejora DEBE costar la misma moneda (`currency`) ya usada para mejorar unidades, con un costo creciente por nivel.
- **FR-004**: El botón de subir de nivel DEBE deshabilitarse cuando la moneda disponible sea insuficiente o cuando la mejora ya esté en su tope de nivel.
- **FR-005**: El nivel de cada mejora de base DEBE persistir entre sesiones.
- **FR-006**: El daño, el radio de área y el tiempo de recarga del cañón especial (`useGameStore.specialCannon`, ya conectado a la UI en `specs/029`) DEBEN calcularse a partir de sus valores base más el bono acumulado de Potencia/Alcance/Recarga de Cañón respectivamente, aplicado al iniciar cada batalla.
- **FR-007**: El HP máximo de la base propia DEBE incluir el bono acumulado de Defensa de Base, aplicado al iniciar cada batalla.
- **FR-008**: El cooldown de redespliegue de cualquier unidad DEBE reducirse según el bono acumulado de Investigación, sin bajar de un piso mínimo por unidad.
- **FR-009**: La moneda otorgada al completar un nivel con victoria DEBE incluir el bono porcentual acumulado de Contabilidad, combinado multiplicativamente con los bonos ya existentes de sets de tesoros y Cat Combos.
- **FR-010**: El máximo de energía de misión mostrado y usado en el Hub DEBE incluir el bono fijo acumulado de Energía, sumado al máximo ya derivado del nivel de personaje.
- **FR-011**: Ninguna mejora de base DEBE afectar una batalla ya en curso al subirse de nivel — el efecto se aplica desde la siguiente vez que se inicie un nivel (Edge Cases).
- **FR-012**: Con las 7 mejoras en nivel 0, el comportamiento del juego DEBE ser idéntico al de antes de esta spec (sin regresión).

### Key Entities *(include if feature involves data)*

- **Nivel de mejora de base** (persistido): `Record<BaseUpgradeId, number>` — nivel actual (0 = nunca subida) de cada una de las 7 mejoras, por cuenta de jugador (no por unidad).
- **Definición de mejora de base** (dato estático, `src/data/`): por `BaseUpgradeId`, tope de nivel, costo por nivel, e incremento de efecto por nivel — mismo patrón de "catálogo de datos" que `userRankThresholds.ts`/`treasureSets.ts`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El jugador puede subir de nivel cualquiera de las 7 mejoras desde la pestaña "Mejoras de Base", con el costo descontado correctamente y persistido tras recargar.
- **SC-002**: Con Potencia de Cañón en nivel ≥1, el daño de un disparo del cañón especial en una batalla de prueba es estrictamente mayor que con nivel 0.
- **SC-003**: Con Defensa de Base en nivel ≥1, el HP máximo de base en una batalla de prueba es estrictamente mayor que con nivel 0.
- **SC-004**: Con Investigación en nivel ≥1, el cooldown de una unidad desplegada en una batalla de prueba es estrictamente menor que con nivel 0, sin llegar nunca a 0.
- **SC-005**: Con Contabilidad en nivel ≥1, la moneda otorgada al ganar un nivel de prueba es estrictamente mayor que con nivel 0.
- **SC-006**: Con Energía en nivel ≥1, el máximo de energía de misión mostrado en el Hub es estrictamente mayor que con nivel 0.
- **SC-007**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en ninguna suite existente.

## Assumptions

- **Ritmo/Cartera del Trabajador (manual §5.9, "Worker Cat Rate/Wallet")**: excluidas de esta spec — el manual las aplica a una economía de "dinero de batalla" que se acumula pasivamente durante el combate; este proyecto no tiene ese recurso (el despliegue de unidades se paga con `energy.current`, ver `specs/029` Resumen priorizado punto 7) — inventar un recurso nuevo solo para estas 2 mejoras excede el alcance de "conectar mejoras a mecánica ya existente" de esta spec. Quedan como candidatas si en el futuro se decide separar dinero-de-batalla de energía (decisión de arquitectura de combate, fuera de alcance de una spec de UI/meta-progresión).
- **Estudio (manual §5.9, "+XP al completar etapa")**: excluida — este proyecto no tiene una economía de XP separada de `currency` (la mejora de unidades ya gasta `currency` directamente, sin XP intermedia); duplicar el efecto de Contabilidad bajo un nombre distinto no aporta valor jugable nuevo.
- **Fórmulas de costo/efecto**: valores de diseño provisionales, no balanceados — mismo criterio ya establecido en `UpgradeScreen.tsx` (`currentLevel * 100` para unidades) y en `SPECIAL_CANNON_DEFAULTS` (specs/012). El tope de nivel se simplifica a un número entero fijo por mejora (p. ej. 10), sin el sistema "20+10" de niveles "+" que el manual describe para unidades (ese sistema es específico de duplicados de gacha, `specs/024`, no aplica a mejoras de cuenta).
- Esta spec no cambia ninguna regla de `src/engine/` — los bonos se aplican como parámetros de entrada ya resueltos (daño/radio/recarga de cañón, HP de base, cooldown de unidad, multiplicador de moneda) antes de llegar al motor, mismo patrón que `specs/013`/`specs/025` ya usan para sus propios multiplicadores.
