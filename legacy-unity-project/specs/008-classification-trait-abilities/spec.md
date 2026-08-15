# Feature Specification: Clasificación de Unidades/Enemigos y Habilidades Avanzadas (Trait-Targeting, Neutral, Immunities)

**Feature Branch**: `008-classification-trait-abilities`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Fusión deliberada de las Fases 8 y 9 del roadmap (`docs/roadmap-fases.md`), siguiendo la opción que el propio roadmap ofrece explícitamente para estos dos bloques ('fusionar ambas en un solo spec si ... están demasiado acopladas'). Fase 9 — Sistema de clasificación de unidades y enemigos: cada unidad y enemigo tiene un tipo estándar (Rojo, Flotante, Oscuro, Ángel, Alien, Zombie, Relic, Sin rasgo) y opcionalmente un tipo especial poco común que lo excluye de habilidades \"contra todos los enemigos\" (Sin tipo/Typeless, Colossus, Behemoth, Sage, Metal, Witch, EVA Angel), siguiendo https://battlecats.miraheze.org/wiki/Classification, en el mismo ScriptableObject de datos usado desde 001-chapter1-vertical-slice. Fase 8 — Extensión del sistema de habilidades (tras Attack Types de 007-attack-types): agregar trait-targeting abilities (habilidades que solo afectan a tipos de enemigo específicos, usando la clasificación anterior), neutral abilities (sin restricción de tipo) e immunities (inmunidades que anulan ciertos efectos, incluyendo un efecto tipo \"Curse\" que deshabilita todas las habilidades de una unidad), siguiendo https://battlecats.miraheze.org/wiki/Special_Abilities."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clasificar unidades y enemigos con un tipo (Priority: P1)

Cada unidad y enemigo del juego declara en sus datos un tipo estándar de clasificación (Rojo, Flotante, Oscuro/Negro, Ángel, Alien, Zombie, Relic o Sin rasgo) y, opcionalmente, un tipo especial poco común (Typeless, Colossus, Behemoth, Sage, Metal, Witch o EVA Angel).

**Why this priority**: Es el prerrequisito de todo lo demás en esta feature — sin tipos definidos no hay contra qué apuntar (Historia 2) ni qué excluir (Historia 4).

**Independent Test**: Revisar los datos de las unidades y enemigos existentes (incluidos los 5 de `001-chapter1-vertical-slice`) y confirmar que cada uno tiene un tipo estándar asignado y, si aplica, un tipo especial, sin que el combate existente deje de funcionar.

**Acceptance Scenarios**:

1. **Given** una unidad o enemigo nuevo se define en datos, **When** se le asigna una clasificación, **Then** el sistema acepta exactamente un tipo estándar y, opcionalmente, un tipo especial adicional.
2. **Given** una unidad o enemigo ya existente de `001-chapter1-vertical-slice` no declara clasificación, **When** el sistema la evalúa, **Then** se le trata como tipo estándar "Sin rasgo" y sin tipo especial, sin romper su comportamiento actual.

---

### User Story 2 - Una habilidad de trait-targeting solo afecta a los tipos que declara (Priority: P1)

Un jugador ve que una unidad con una habilidad dirigida a un tipo específico (por ejemplo, "fuerte contra Flotante") solo aplica su efecto contra enemigos de ese tipo, y no contra enemigos de otros tipos.

**Why this priority**: Es el valor central de esta feature — la razón de tener clasificación es que las habilidades reaccionen a ella de forma diferenciada.

**Independent Test**: Enfrentar una unidad con una habilidad de trait-targeting contra un enemigo del tipo objetivo y otro de un tipo distinto, y confirmar que el efecto solo se aplica contra el primero.

**Acceptance Scenarios**:

1. **Given** una unidad tiene una habilidad de trait-targeting configurada contra un tipo específico, **When** ataca a un enemigo de ese tipo, **Then** el efecto de la habilidad se aplica.
2. **Given** la misma unidad ataca a un enemigo de un tipo distinto al configurado, **When** ocurre el ataque, **Then** el efecto de la habilidad no se aplica (solo el daño base, si corresponde).

---

### User Story 3 - Una neutral ability afecta a cualquier enemigo sin importar su tipo (Priority: P2)

Un jugador ve que una habilidad "neutral" (sin restricción de tipo) aplica su efecto contra cualquier enemigo, incluidos los de tipo especial, a diferencia de las habilidades de trait-targeting.

**Why this priority**: Contrasta con la Historia 2 y confirma que ambos tipos de habilidad coexisten sin conflicto; depende de que el sistema de habilidades ya distinga tipos (Historia 1).

**Independent Test**: Aplicar una unidad con habilidad neutral contra enemigos de distintos tipos (estándar y especial) y confirmar que el efecto se aplica en todos los casos.

**Acceptance Scenarios**:

1. **Given** una unidad tiene una habilidad neutral, **When** ataca a un enemigo de cualquier tipo estándar o especial, **Then** el efecto de la habilidad se aplica sin importar la clasificación del objetivo.

---

### User Story 4 - Un tipo especial queda fuera de habilidades "contra todos" salvo que se lo apunte explícitamente (Priority: P2)

Un jugador nota que una habilidad de trait-targeting configurada como "contra todos los tipos estándar" no afecta a un enemigo de tipo especial (por ejemplo, Metal), a menos que esa habilidad incluya explícitamente ese tipo especial.

**Why this priority**: Es la razón de ser de los tipos especiales dentro de la clasificación — deben quedar exceptuados de "contra todos" por defecto, como lo describe el roadmap.

**Independent Test**: Enfrentar una habilidad "contra todos los enemigos estándar" contra un enemigo de tipo especial y confirmar que no recibe el efecto; luego enfrentarla contra una habilidad configurada para incluir explícitamente ese tipo especial y confirmar que sí lo recibe.

**Acceptance Scenarios**:

1. **Given** una habilidad está configurada para afectar a "todos los tipos estándar", **When** ataca a un enemigo con tipo especial, **Then** el efecto no se aplica.
2. **Given** una habilidad incluye explícitamente un tipo especial entre sus objetivos, **When** ataca a un enemigo de ese tipo especial, **Then** el efecto sí se aplica.

---

### User Story 5 - Las inmunidades anulan efectos específicos, incluyendo Curse (Priority: P3)

Un jugador ve que una unidad o enemigo con inmunidad declarada a un efecto no sufre ese efecto al recibirlo, y que el efecto "Curse" en particular deshabilita todas las habilidades especiales de la unidad afectada mientras dura, salvo que esa unidad sea inmune a Curse.

**Why this priority**: Cierra el sistema de habilidades avanzadas con su contraparte defensiva; depende de que ya existan efectos que anular (Historias 2-4).

**Independent Test**: Aplicar un efecto (por ejemplo, Curse) contra una unidad con inmunidad a ese efecto y otra sin ella, y confirmar que la inmune no sufre ningún cambio, mientras que la no inmune pierde el uso de sus habilidades especiales mientras dura el efecto.

**Acceptance Scenarios**:

1. **Given** una unidad declara inmunidad a un efecto específico, **When** recibe ese efecto, **Then** no sufre ningún cambio de comportamiento por él.
2. **Given** una unidad sin inmunidad a Curse recibe ese efecto, **When** el efecto está activo, **Then** ninguna de sus habilidades especiales (trait-targeting, neutral) se aplica mientras dure.
3. **Given** el efecto Curse expira, **When** el jugador observa a la unidad afectada, **Then** vuelve a aplicar sus habilidades especiales con normalidad.

---

### Edge Cases

- ¿Qué pasa con una unidad o enemigo sin tipo especial declarado (solo tipo estándar)? Siempre queda alcanzable por habilidades "contra todos"/"contra todos los tipos estándar".
- ¿Qué pasa si una unidad tiene varias habilidades activas a la vez (por ejemplo, una de trait-targeting y una neutral)? Cada una se evalúa y aplica de forma independiente; esta feature no define reglas especiales de combinación entre habilidades distintas.
- ¿Qué pasa si una unidad es inmune a Curse y de todas formas lo recibe? El efecto no se aplica en absoluto; la unidad sigue usando sus habilidades con normalidad.
- ¿Qué pasa con las unidades y enemigos ya existentes de `001-chapter1-vertical-slice` y `007-attack-types` que no declaran clasificación ni habilidades avanzadas? Se tratan como tipo estándar "Sin rasgo", sin tipo especial y sin ninguna habilidad de trait-targeting/neutral/inmunidad, de forma que el combate actual siga funcionando sin cambios.
- ¿Qué pasa si una habilidad de trait-targeting apunta a un tipo estándar y también existe una versión que apunta a un tipo especial? Son configuraciones independientes de la habilidad; cada una se evalúa contra la clasificación real del objetivo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE extender el contrato de datos de unidad y enemigo (ya extendido en `007-attack-types`) con un campo de tipo estándar de clasificación, con uno de estos valores: Rojo, Flotante, Oscuro/Negro, Ángel, Alien, Zombie, Relic, Sin rasgo.
- **FR-002**: El sistema DEBE permitir, opcionalmente, asignar además un tipo especial de clasificación: Typeless (Sin tipo), Colossus, Behemoth, Sage, Metal, Witch o EVA Angel.
- **FR-003**: Una unidad o enemigo sin tipo especial declarado DEBE ser alcanzable por cualquier habilidad configurada como "contra todos los enemigos"/"contra todos los tipos estándar".
- **FR-004**: Una unidad o enemigo CON un tipo especial declarado NO DEBE ser alcanzado por una habilidad configurada como "contra todos" a menos que esa habilidad incluya explícitamente ese tipo especial entre sus objetivos.
- **FR-005**: El sistema DEBE soportar habilidades de trait-targeting que apliquen un efecto únicamente a enemigos cuya clasificación (estándar y/o especial) coincida con uno o más tipos especificados por la habilidad.
- **FR-006**: El sistema DEBE soportar habilidades neutrales que apliquen su efecto a cualquier enemigo, sin importar su clasificación.
- **FR-007**: El sistema DEBE soportar inmunidades declaradas por una unidad/enemigo a un efecto específico, de forma que ese efecto no se le aplique cuando lo reciba.
- **FR-008**: El sistema DEBE soportar un efecto "Curse" que, mientras esté activo sobre una unidad, deshabilite todas sus habilidades especiales (trait-targeting y neutral), salvo que esa unidad sea inmune a Curse.
- **FR-009**: Al expirar el efecto Curse, la unidad afectada DEBE recuperar el uso normal de sus habilidades especiales.
- **FR-010**: Las unidades y enemigos ya existentes de `001-chapter1-vertical-slice` que no declaren clasificación DEBEN tratarse por defecto como tipo estándar "Sin rasgo", sin tipo especial y sin habilidades avanzadas, para no romper el funcionamiento actual.
- **FR-011**: Los campos de clasificación y habilidades avanzadas de esta feature NO DEBEN duplicar ni entrar en conflicto con los atributos de combate ya definidos en `001-chapter1-vertical-slice` (coste, cooldown, salud, daño, rango) ni con el campo de tipo de ataque de `007-attack-types`.

### Key Entities *(include if feature involves data)*

- **ClassificationType** (estándar): uno de Rojo, Flotante, Oscuro/Negro, Ángel, Alien, Zombie, Relic, Sin rasgo. Obligatorio para toda unidad/enemigo.
- **SpecialClassificationType** (opcional): uno de Typeless, Colossus, Behemoth, Sage, Metal, Witch, EVA Angel. Cuando está presente, excluye a la unidad/enemigo de habilidades "contra todos" salvo inclusión explícita.
- **TraitTargetingAbility**: habilidad ligada a uno o más tipos de clasificación (estándar y/o especial), que solo aplica su efecto contra objetivos que coincidan.
- **NeutralAbility**: habilidad sin restricción de tipo, aplica su efecto a cualquier objetivo.
- **Immunity**: declaración de resistencia a un efecto específico por parte de una unidad/enemigo, que impide que ese efecto se le aplique.
- **CurseEffect**: efecto que, mientras está activo, deshabilita todas las habilidades especiales (trait-targeting y neutral) de la unidad/enemigo afectado, salvo inmunidad a Curse.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una habilidad de trait-targeting aplica su efecto únicamente contra el tipo de clasificación que declara, el 100% de las veces, tanto en casos de coincidencia como de no coincidencia.
- **SC-002**: Una habilidad neutral aplica su efecto contra cualquier enemigo (de cualquier tipo estándar o especial) el 100% de las veces.
- **SC-003**: Un enemigo con tipo especial no recibe el efecto de una habilidad "contra todos" el 100% de las veces, salvo que esa habilidad lo incluya explícitamente, en cuyo caso lo recibe el 100% de las veces.
- **SC-004**: Una unidad/enemigo inmune a un efecto nunca recibe ese efecto, verificado en el 100% de los escenarios de prueba, incluyendo Curse.
- **SC-005**: Una unidad afectada por Curse pierde el uso de todas sus habilidades especiales mientras el efecto está activo, y las recupera el 100% de las veces al expirar el efecto.
- **SC-006**: Las unidades y enemigos existentes de `001-chapter1-vertical-slice` y `007-attack-types` siguen funcionando en batalla sin errores tras esta extensión, con clasificación por defecto "Sin rasgo" cuando no se reautoran explícitamente.

## Assumptions

- **Fases 8 y 9 del roadmap se fusionan deliberadamente en esta única spec**, usando la opción que el propio roadmap ofrece de forma explícita ("fusionar ambas en un solo spec si ... están demasiado acopladas"): el trait-targeting (Fase 8) no tiene ningún efecto observable sin los tipos de clasificación (Fase 9), y la clasificación por sí sola no cambia el combate sin habilidades que la consuman. Como consecuencia, el número de spec siguiente para la Fase 10 (Evolución de Unidad) será `009-...` en lugar de `010-...`; la numeración de specs deja de coincidir 1:1 con el número de fase del roadmap a partir de aquí.
- No fue posible acceder directamente a las páginas de referencia (`battlecats.miraheze.org/wiki/Classification` y `/wiki/Special_Abilities`) durante la redacción de esta spec (mismo problema de acceso HTTP 403 ya documentado en `007-attack-types`); el listado de tipos y el comportamiento de trait-targeting/neutral/immunities se basa en el propio roadmap del proyecto (`docs/roadmap-fases.md`) y en conocimiento público general del juego de referencia.
- Se incluye "Metal" entre los tipos especiales pese a que el bloque "Input para /speckit.specify" original de la Fase 9 lo omite: la sección "Alcance" de esa misma fase en el roadmap sí lo menciona explícitamente, y es un tipo especial reconocido y común en el juego de referencia; se resuelve la inconsistencia del roadmap a favor de incluirlo.
- "Costo de despliegue y stats detallados por unidad" (mencionado en el input original de la Fase 9) ya existen como Coste/Cooldown/Salud/Daño/Rango desde `001-chapter1-vertical-slice` (Principio V de la constitución); esta feature no duplica esos campos, solo añade clasificación y habilidades avanzadas sobre el mismo contrato de datos.
- Las unidades/enemigos ya existentes de `001` y `007-attack-types` sin clasificación declarada se tratan como "Sin rasgo", sin tipo especial y sin habilidades avanzadas por defecto, siguiendo el mismo patrón de valor por defecto ya usado en `007-attack-types` para el tipo de ataque no declarado.
- Esta feature no define aquí el catálogo completo de efectos posibles más allá de Curse (por ejemplo, Congelar, Retroceso, Debilitar, Warp, mencionados en el roadmap general pero no detallados en el input de esta fase); otros efectos concretos pueden definirse en specs de contenido posteriores (unidades o capítulos específicos) sin requerir cambios a esta spec.
- Cuando varias habilidades (trait-targeting, neutral) están activas simultáneamente en la misma unidad/enemigo, se evalúan y aplican de forma independiente; esta feature no define reglas especiales de combinación o prioridad entre ellas.
