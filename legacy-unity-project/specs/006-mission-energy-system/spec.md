# Feature Specification: Sistema de Energía y Escalado de Dificultad por Misión

**Feature Branch**: `006-mission-energy-system`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Sistema de energía de \"The Battler\": cada misión del mapa de aventuras consume energía; la energía máxima y/o su tasa de recuperación aumenta con el nivel de personaje del jugador (dashboard de base). Las misiones se agrupan por país/región y su dificultad aumenta progresivamente conforme el jugador avanza dentro de esa región. Definir qué pasa si el jugador no tiene energía suficiente para entrar a una misión (bloqueo, sin penalización)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consumir energía al entrar a una misión (Priority: P1)

Un jugador con energía suficiente selecciona una misión del mapa de aventuras y entra a ella, viendo cómo su energía disponible se reduce según el costo de esa misión.

**Why this priority**: Es el comportamiento central del sistema — sin esto la energía no cumple ninguna función de limitar el juego.

**Independent Test**: Con energía suficiente disponible, seleccionar una misión, entrar a ella y confirmar que la energía disponible se reduce exactamente en el costo de esa misión.

**Acceptance Scenarios**:

1. **Given** el jugador tiene energía igual o mayor al costo de una misión, **When** selecciona esa misión, **Then** entra a ella y su energía disponible se reduce en el costo correspondiente.
2. **Given** el jugador acaba de entrar a una misión gastando energía, **When** consulta su energía disponible, **Then** el valor mostrado refleja el descuento aplicado.

---

### User Story 2 - Bloqueo sin penalización cuando no hay energía suficiente (Priority: P1)

Un jugador sin energía suficiente intenta entrar a una misión y el sistema se lo impide, sin aplicar ninguna penalización ni descontar la energía que sí tiene.

**Why this priority**: Es el borde crítico del sistema — define qué pasa cuando el recurso no alcanza, y debe quedar resuelto desde el inicio para que el resto del diseño (Historia 1) tenga sentido completo.

**Independent Test**: Con energía insuficiente para el costo de una misión, intentar entrar a ella y confirmar que el sistema bloquea la entrada, no descuenta energía, y no aplica ninguna otra consecuencia negativa.

**Acceptance Scenarios**:

1. **Given** el jugador tiene menos energía que el costo de una misión, **When** intenta entrar a esa misión, **Then** el sistema bloquea la entrada y no descuenta energía.
2. **Given** el intento de entrada fue bloqueado por falta de energía, **When** el jugador revisa su estado, **Then** no encuentra ninguna penalización adicional (no se pierde progreso, no se aplica ningún castigo) más allá de no poder entrar.

---

### User Story 3 - La energía se recupera con el tiempo y escala con el nivel de personaje (Priority: P2)

Un jugador ve que su energía se recupera automáticamente con el paso del tiempo, y que su energía máxima y/o su tasa de recuperación aumentan conforme sube el nivel de personaje definido en el dashboard de base.

**Why this priority**: Le da profundidad de progresión al sistema, conectándolo con `005-player-dashboard`; el sistema ya es funcional con las Historias 1 y 2 sin esto, pero sin recuperación ni escalado la energía sería un recurso estático poco interesante.

**Independent Test**: Dejar pasar tiempo sin gastar energía y confirmar que se recupera hasta el máximo actual; luego subir el nivel de personaje en el dashboard de base y confirmar que la energía máxima y/o la tasa de recuperación aumentan.

**Acceptance Scenarios**:

1. **Given** el jugador tiene energía por debajo de su máximo, **When** pasa tiempo sin gastar energía, **Then** su energía disponible aumenta progresivamente hasta alcanzar el máximo actual, sin superarlo.
2. **Given** el nivel de personaje del jugador (`005-player-dashboard`) aumenta, **When** el jugador vuelve a consultar su energía, **Then** su energía máxima y/o su tasa de recuperación reflejan el incremento correspondiente a su nuevo nivel.
3. **Given** el jugador cierra el juego con energía por debajo del máximo, **When** lo reabre después de un tiempo, **Then** la energía recuperada durante el tiempo cerrado se refleja correctamente, sin superar el máximo.

---

### User Story 4 - Dificultad progresiva de misiones dentro de una región (Priority: P2)

Un jugador que avanza a través de las misiones de una misma región/país nota que la dificultad de cada misión siguiente es mayor que la anterior dentro de esa región.

**Why this priority**: Da sentido de progresión y desafío creciente; depende de que ya existan misiones agrupadas y jugables (Historias 1 y 2) para que el escalado de dificultad sea observable.

**Independent Test**: Recorrer varias misiones consecutivas dentro de la misma región y confirmar que la dificultad asignada a cada una aumenta respecto a la anterior.

**Acceptance Scenarios**:

1. **Given** una región con varias misiones ordenadas, **When** el jugador las compara en orden, **Then** cada misión siguiente dentro de esa región tiene una dificultad igual o mayor que la anterior.
2. **Given** el jugador entra a una región distinta, **When** compara la dificultad inicial de esa región con la dificultad de la región anterior, **Then** la dificultad de una región nueva no depende de dónde terminó la región previa (cada región define su propia progresión).

---

### Edge Cases

- ¿Qué pasa si el jugador no tiene energía suficiente para entrar a una misión? Se bloquea la entrada, no se descuenta energía y no se aplica ninguna penalización (ver Historia 2).
- ¿Qué pasa si el jugador cierra el juego durante mucho tiempo (días)? La energía se recupera hasta el máximo actual según el tiempo transcurrido, sin acumular por encima del máximo ni generar energía "negativa" por el tiempo excedente.
- ¿Qué pasa si el nivel de personaje sube mientras el jugador está en medio de una sesión? El nuevo máximo/tasa de recuperación se aplica de inmediato; la energía actual no se reduce por el cambio, y no se otorga automáticamente energía extra más allá de lo ya acumulado.
- ¿Qué pasa si el dato de energía guardado está corrupto o no es legible? Se trata como ausencia de progreso de energía (energía al máximo por defecto), consistente con el criterio de fallback usado en `002-local-save-progress`.
- ¿Qué pasa con la energía de misiones especiales/eventos (banner de eventos, Fase 12 del roadmap)? Fuera de alcance de esta feature; se define en esa spec separada.
- ¿Qué pasa si una región solo tiene una misión disponible hoy (como el Capítulo 1)? El escalado de dificultad dentro de esa región no tiene efecto observable hasta que existan más misiones en ella; esto no bloquea el resto del sistema.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mantener un valor de energía actual y un valor de energía máxima para el jugador, visibles allí donde se seleccionan misiones (mapa de aventuras, `004-adventure-map-banners`).
- **FR-002**: Cada misión DEBE tener asignado un costo de energía.
- **FR-003**: Al entrar a una misión con energía suficiente, el sistema DEBE descontar el costo de esa misión de la energía actual del jugador.
- **FR-004**: El sistema NO DEBE permitir la entrada a una misión cuyo costo de energía sea mayor a la energía actual del jugador.
- **FR-005**: Un intento de entrada bloqueado por falta de energía NO DEBE descontar energía ni aplicar ninguna otra penalización (pérdida de progreso, recursos u otro castigo).
- **FR-006**: La energía actual DEBE recuperarse automáticamente con el tiempo hasta alcanzar la energía máxima vigente, sin superarla.
- **FR-007**: La energía máxima y/o la tasa de recuperación de energía DEBEN aumentar conforme aumenta el nivel de personaje del jugador (`005-player-dashboard`).
- **FR-008**: El sistema DEBE agrupar las misiones en regiones/países, cada una con su propia secuencia ordenada de misiones.
- **FR-009**: Dentro de una misma región, la dificultad de cada misión DEBE ser igual o mayor a la de la misión anterior de esa región.
- **FR-010**: El sistema DEBE persistir localmente la energía actual y el momento de la última actualización, de forma que la recuperación por tiempo transcurrido se calcule correctamente aun si el juego estuvo cerrado.
- **FR-011**: El sistema DEBE tratar datos de energía corruptos o ilegibles como ausencia de progreso de energía (energía al máximo por defecto), sin bloquear la carga del mapa de aventuras.
- **FR-012**: El sistema NO DEBE incluir en esta feature misiones de eventos/especiales con ventana horaria (fuera de alcance, ver banner de eventos del roadmap).

### Key Entities *(include if feature involves data)*

- **MissionEnergyPool**: energía actual, energía máxima vigente, y marca de tiempo de la última actualización, usada para calcular la recuperación por tiempo transcurrido. Persistido localmente. Es un recurso distinto del "Recurso de Batalla (Energía/Dinero)" del Principio II de la constitución, que se usa exclusivamente dentro de una batalla para desplegar unidades; esta feature introduce un recurso separado a nivel de mapa de aventuras para limitar cuántas misiones se pueden jugar.
- **Region**: agrupación ordenada de misiones (país/región), con su propia progresión de dificultad interna.
- **Mission**: unidad seleccionable dentro de una región — en esta feature corresponde al mismo capítulo/banner ya definido en `004-adventure-map-banners` (`ChapterBanner`), extendido con un costo de energía, una región de pertenencia y un valor de dificultad.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Entrar a una misión con energía suficiente descuenta el costo correcto de energía el 100% de las veces.
- **SC-002**: Intentar entrar a una misión sin energía suficiente es bloqueado el 100% de las veces, sin descontar energía ni aplicar penalización alguna.
- **SC-003**: La energía recuperada tras un período de tiempo (incluyendo con el juego cerrado) coincide con la tasa de recuperación vigente dentro de un margen de error despreciable, sin superar nunca el máximo.
- **SC-004**: Un aumento en el nivel de personaje se refleja en la energía máxima y/o la tasa de recuperación la próxima vez que el jugador consulta su energía, el 100% de las veces.
- **SC-005**: Al comparar las misiones de una misma región en orden, cada una tiene una dificultad igual o mayor que la anterior el 100% de las veces.

## Assumptions

- "Misión" se resuelve en esta feature como el mismo `ChapterBanner` ya definido en `004-adventure-map-banners`, extendido con costo de energía, región y dificultad; esta feature no introduce una pantalla de selección de misiones separada del mapa de aventuras, ni un nuevo tipo de contenido distinto a un capítulo. Si el diseño posterior requiere misiones más granulares que capítulos completos, se ajusta en `/speckit.clarify` o en una spec futura.
- El costo de energía se descuenta al entrar a la misión (al intentarla), no según el resultado (victoria o derrota), siguiendo el patrón estándar de juegos de este género.
- El sistema de energía descrito aquí es un recurso de progresión a nivel de mapa de aventuras, independiente del "Recurso de Batalla (Energía/Dinero)" del Principio II de la constitución, que solo existe dentro de una batalla y se gasta en desplegar unidades. Ambos comparten el nombre "energía" en el docx base pero son conceptualmente distintos; esta spec los distingue explícitamente para evitar confusión en `/speckit.plan`.
- La energía máxima y la tasa de recuperación se derivan del nivel de personaje agregado (`PlayerCharacterLevel` de `005-player-dashboard`); la fórmula exacta de esa relación (lineal, por tramos, etc.) se deja para `/speckit.plan`, ya que no cambia el alcance de esta spec.
- Con el contenido actual (un solo capítulo jugable, `001-chapter1-vertical-slice`), solo existe una región con una misión; el resto de la estructura de regiones/dificultad progresiva queda lista para cuando se agreguen más misiones (Fase 11 en adelante), sin requerir rediseño.
- Un dato de energía corrupto o ilegible se trata igual que en `002-local-save-progress`: como ausencia de progreso, en este caso asumiendo energía al máximo por defecto, sin bloquear el mapa de aventuras.
- Los banners de eventos/especiales (Fase 12 del roadmap) no consumen ni interactúan con este sistema de energía en el alcance de esta feature.
