# Feature Specification: Contenido — Capítulo 1 de Imperio de los Gatos

**Feature Branch**: `027-capitulo-1-imperio-gatos`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "Contenido: Capítulo 1 de Imperio de los Gatos — 13 gatos nuevos (9 Normal + 3 Especial + 1 recompensa de fin de capítulo) y 48 etapas, basado en el manual "The_Battle_Cats_Manual_Tecnico.docx"."

**Nota de alcance**: esta especificación es autoría de contenido pura — no introduce ninguna mecánica nueva. Reutiliza tal cual `specs/001-nucleo-del-juego` (núcleo), `specs/005-mapa-de-niveles` (desbloqueo secuencial), `specs/007-energia-mision-dificultad` (energía de misión), `specs/009-clasificacion-habilidades` (rasgos), `specs/010-evolucion-de-gatos` (evolución), `specs/012-saga-imperio-de-los-gatos` (arcos, umbrales de vida de base, recompensas de nivel/tesoro/primera victoria), `specs/013-escalado-capitulos-sets-tesoros` (escalado de base enemiga por arco, sets de tesoro), `specs/017-objetos-de-batalla` (objetos), `specs/018-bibliotecas-consulta` (la Guía de Gatos ya muestra la etiqueta de rareza de cualquier `Cat` con `rarity` asignada, sin cambios), `specs/020-barrera-de-base` (jefe de arco) y `specs/023-mapa-de-etapas-visual` (mapa visual de nodos, `Level.mapPosition` obligatorio). Ningún arco/nivel/gato fixture existente (`arco-1-imperio-de-los-gatos`, `arco-2-imperio-de-los-gatos`, `level-1`, `level-2`, `level-seed-demo`, ni los 16 `catId` ya existentes en `CATS`) se modifica — todo el contenido de esta spec es aditivo. Los datos de enemigos (HP/daño) provienen de `docs/The_Battle_Cats_Manual_Tecnico.docx` §6.6, tratados ahí explícitamente como "hechos objetivos de diseño, no expresión creativa"; todos los nombres de gatos y enemigos son originales del proyecto, no los del manual, para no reutilizar marcas registradas de PONOS Corporation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jugar el Capítulo 1 de punta a punta (Priority: P1)

Un jugador entra al mapa de etapas y encuentra 48 niveles nuevos encadenados en un arco propio, desbloqueados secuencialmente igual que cualquier otro nivel: solo el primero está disponible al inicio, y superar uno desbloquea el siguiente.

**Why this priority**: Es el contenido central de la spec — sin las 48 etapas jugables, ninguna otra historia (desbloqueo de gatos, tesoros, jefe final) tiene sobre qué apoyarse.

**Independent Test**: Abrir el mapa de etapas sin progreso, confirmar que solo la etapa 1 del capítulo está disponible y el resto bloqueadas, superarla y confirmar que la etapa 2 pasa a disponible — mismo criterio de `getLevelState` que ya usa el resto del juego.

**Acceptance Scenarios**:

1. **Given** un jugador nuevo, **When** abre el mapa de etapas, **Then** ve las 48 etapas del capítulo como nodos conectados, con solo la primera disponible y las 47 restantes bloqueadas.
2. **Given** el jugador supera la etapa N del capítulo, **When** vuelve al mapa, **Then** la etapa N aparece completada y la etapa N+1 pasa a disponible, sin alterar el desbloqueo de ningún otro nivel/arco existente.
3. **Given** el jugador juega cualquier etapa del capítulo, **When** despliega un gato o se enfrenta a un enemigo, **Then** el costo de despliegue está reducido un 33% (`costMultiplier: 0.67` del arco) y los enemigos golpean a su valor base sin magnificación adicional (`enemyStrengthMultiplier: 1`), igual que documenta el manual para este capítulo.

---

### User Story 2 - Desbloquear los gatos Normales y Especiales jugando (Priority: P1)

Un jugador que supera por primera vez una de las 12 etapas hito del capítulo recibe el gato Normal o Especial asociado a esa etapa, sumado a su roster de forma permanente.

**Why this priority**: Es la razón de ser del capítulo — sin desbloqueo de gatos nuevos, jugar las 48 etapas no deja ninguna recompensa de contenido distinta a la moneda/tesoro genéricos.

**Independent Test**: Superar por primera vez una etapa hito con `firstVictoryUnlockCatId` configurado y confirmar que el gato correspondiente aparece en `ownedCats`; repetir la victoria y confirmar que no se duplica ni se re-otorga.

**Acceptance Scenarios**:

1. **Given** un jugador nuevo, **When** consulta su roster inicial, **Then** ya posee "Gato Recluta" (rareza Normal) sin necesidad de superar ninguna etapa — el punto de partida del capítulo, igual que hoy ocurre con el gato inicial existente.
2. **Given** el jugador supera por primera vez una de las etapas 1, 4, 8, 12, 16, 20, 24, 28 o 32, **When** se otorgan las recompensas de victoria, **Then** recibe el gato Normal correspondiente a esa etapa (`firstVictoryUnlockCatId`), sumándose a su roster.
3. **Given** el jugador supera por primera vez una de las etapas 2, 6 o 10, **When** se otorgan las recompensas de victoria, **Then** recibe el gato Especial correspondiente a esa etapa.
4. **Given** un gato ya desbloqueado por primera victoria, **When** el jugador vuelve a superar esa misma etapa en una sesión posterior, **Then** no se otorga una segunda copia ni se altera su nivel/evolución — mismo comportamiento monótono que `specs/012` ya garantiza.

---

### User Story 3 - Obtener "Gato Veterano" al completar el capítulo (Priority: P2)

Un jugador que supera las 48 etapas del capítulo recibe, además de los 12 gatos de las etapas hito, un decimotercer gato — "Gato Veterano" — como recompensa de finalización del arco completo.

**Why this priority**: Es la recompensa de mayor alcance del capítulo; depende de que las 48 etapas existan y de que el sistema de recompensas de arco ya funcione (`specs/012` Historia 8) — por eso va después de las dos historias anteriores.

**Independent Test**: Marcar como superadas las 48 etapas del capítulo y confirmar que, al completar la última pendiente, "Gato Veterano" se otorga exactamente una vez, sin duplicarse en sesiones posteriores.

**Acceptance Scenarios**:

1. **Given** el jugador superó las 47 primeras etapas del capítulo, **When** supera la etapa 48 (jefe final), **Then** el arco queda marcado como completado y "Gato Veterano" se otorga.
2. **Given** el arco del capítulo ya completado, **When** el jugador vuelve a superar cualquiera de sus 48 etapas, **Then** "Gato Veterano" no se otorga una segunda vez.

---

### User Story 4 - Progreso de tesoros del capítulo con bonificación de set (Priority: P3)

Un jugador que va superando etapas del capítulo acumula un tesoro distinto por cada una; al completar los 48, recibe automáticamente una bonificación pasiva permanente de cuenta.

**Why this priority**: Capa de meta-progresión sobre un sistema (tesoros/sets) que ya funciona sin población de contenido nueva — depende de que las 48 etapas existan (Historia 1), pero no bloquea ninguna otra historia.

**Independent Test**: Obtener los 48 tesoros del set del capítulo (en cualquier orden) y confirmar que la bonificación pasiva se otorga exactamente al obtener el último pendiente.

**Acceptance Scenarios**:

1. **Given** el jugador ya obtuvo algunos, pero no todos, los tesoros del capítulo, **When** consulta el Menú de Tesoros, **Then** ve el set del capítulo con el conteo correcto sobre 48.
2. **Given** el jugador obtiene el último tesoro pendiente del set, **When** se evalúa su progreso, **Then** la bonificación pasiva (+15% de recompensa de moneda) se otorga de inmediato y queda activa en toda batalla posterior.

---

### User Story 5 - Enfrentar al jefe final del capítulo (Priority: P3)

Al llegar a la etapa 48, el jugador se enfrenta a un enemigo jefe que bloquea la base enemiga hasta ser derrotado, reutilizando el mismo mecanismo de barrera de jefe que ya usa el arco fixture existente.

**Why this priority**: Cierra narrativamente el capítulo; depende de que la etapa 48 exista (Historia 1) y reutiliza un mecanismo ya implementado (`specs/020`), por lo que es de menor riesgo que las historias anteriores.

**Independent Test**: Jugar la etapa 48 y confirmar que la base enemiga permanece protegida mientras el enemigo jefe del arco siga con vida, cayendo la protección solo al derrotarlo.

**Acceptance Scenarios**:

1. **Given** el jugador juega la etapa 48, **When** el enemigo jefe del capítulo sigue con vida, **Then** la base enemiga no puede reducirse a 0 HP, igual que ya garantiza `specs/020` para `arco-2-imperio-de-los-gatos`.
2. **Given** el jefe es derrotado, **When** la batalla continúa, **Then** la base enemiga vuelve a ser un objetivo válido y el jugador puede ganar la etapa.

---

### Edge Cases

- Un nivel del capítulo sin `mapPosition` configurado: fuera de alcance en tiempo de ejecución — es un campo obligatorio de `Level`, su ausencia es un error de compilación (`npx tsc -b`), igual que ya asume `specs/023`.
- Dos de los 13 gatos de esta spec no deben chocar de `id` ni de `name` con ninguno de los 16 `catId` ya existentes en `CATS`, ni entre sí.
- Un jugador que completa una etapa hito por primera vez en la misma sesión en que también completa el set de tesoros o el arco completo: cada recompensa (gato de etapa, bonificación de set, "Gato Veterano") se evalúa y otorga de forma independiente, sin que una bloquee o duplique a la otra.
- "Gato Recluta" y "Gato Deidad"/"Gato Veterano" no tienen `evolutions` declarado (el primero por decisión de diseño simple, los otros dos por ser unidades únicas sin evolución, igual que "The Cat God"/"Superfeline" en el manual) — deben permanecer jugables en Forma Base indefinidamente sin romper nada, comportamiento ya cubierto por `specs/010` FR-011.
- Un nivel del capítulo jugado desde fuera de su arco (no debería ser posible con el desbloqueo secuencial, pero por robustez): sin arco resuelto, se comporta con multiplicadores 1 igual que cualquier nivel sin arco (`specs/012` FR-004) — no es un caso que esta spec necesite forzar, solo no debe romperse.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE añadir 10 gatos nuevos de `rarity: 'Normal'` a `CATS` (`src/data/cats.ts`): un gato inicial disponible desde el comienzo del juego y 9 más, cada uno desbloqueable por primera victoria en una etapa hito distinta del capítulo.
- **FR-002**: El sistema DEBE añadir 3 gatos nuevos de `rarity: 'Especial'` a `CATS`, cada uno desbloqueable por primera victoria en una etapa hito distinta del capítulo, usando el mismo mecanismo `firstVictoryUnlockCatId` que los gatos Normal de FR-001.
- **FR-003**: De los 13 gatos de FR-001/FR-002, todos DEBEN declarar `evolutions` (Segunda Forma en nivel 10, Forma Verdadera en nivel 20+10, sin `requiredItemCount`) salvo el gato inicial y las dos unidades únicas sin evolución equivalentes a "The Cat God" y "Superfeline" del manual, que permanecen en Forma Base indefinidamente.
- **FR-004**: El sistema DEBE añadir un decimocuarto gato nuevo de `rarity: 'Normal'`, sin `evolutions`, otorgado únicamente como recompensa de finalización del arco del capítulo (`SagaArc.completionRewards.unlockCatIds`), nunca por `firstVictoryUnlockCatId` de ningún nivel.
- **FR-005**: El sistema DEBE añadir 15 enemigos nuevos a `CATS`, con `classification` limitada a `'Traitless'`, `'Red'` o `'Floating'` — los 3 únicos rasgos que el manual documenta para toda la saga Imperio de los Gatos — cada uno con `hp`/`damage` tomados de la tabla de referencia del manual (§6.6) a magnificación 100%.
- **FR-006**: Uno de los 15 enemigos de FR-005 DEBE ser designado enemigo jefe de un nuevo `SagaArc` (ver FR-009), con `hp` significativamente mayor al resto (equivalente al jefe de capítulo del manual).
- **FR-007**: El sistema DEBE añadir 48 niveles nuevos a `LEVELS` (`src/data/levels.ts`), con `region` propia distinta de la ya usada por los niveles fixture existentes.
- **FR-008**: De los 48 niveles de FR-007, exactamente 12 DEBEN declarar `firstVictoryUnlockCatId` (uno por cada gato de FR-001/FR-002, en un orden de aparición no decreciente a lo largo del capítulo), y exactamente 1 (el último del capítulo) DEBE ser el nivel del enemigo jefe de FR-006.
- **FR-009**: El sistema DEBE agrupar los 48 niveles de FR-007 en un `SagaArc` nuevo (`src/data/sagaArcs.ts`) con `costMultiplier: 0.67` y `enemyStrengthMultiplier: 1`, `bossLevelId` apuntando al último nivel del capítulo, `bossCatId` apuntando al enemigo jefe de FR-006, y `completionRewards.unlockCatIds` conteniendo el gato de FR-004.
- **FR-010**: `Level.difficulty` DEBE ser no decreciente a lo largo de los 48 niveles del capítulo, consistente con la regla ya vigente para cualquier nivel de una misma `region` (`specs/002-motor-de-combate`).
- **FR-011**: Cada uno de los 48 niveles DEBE declarar un `treasureId` propio y único, y el sistema DEBE agruparlos en un `TreasureSet` nuevo (`src/data/treasureSets.ts`) con una bonificación pasiva `CurrencyRewardMultiplier`.
- **FR-012**: Cada uno de los 48 niveles DEBE declarar un `mapPosition` propio dentro del rango 0-100 en ambos ejes, sin solaparse entre sí de forma que impida distinguir los nodos en el mapa visual (`specs/023`).
- **FR-013**: Los 12 niveles hito de FR-008 DEBEN declarar `battleItemRewards`, reutilizando únicamente ids ya existentes en `src/data/battleItems.ts` — esta spec no crea ningún objeto de batalla nuevo.
- **FR-014**: Esta spec NO DEBE modificar ningún campo de los niveles/arcos/gatos fixture existentes (`level-1`, `level-2`, `level-seed-demo`, `arco-1-imperio-de-los-gatos`, `arco-2-imperio-de-los-gatos`, ni ninguno de los 16 `catId` ya presentes en `CATS` antes de esta spec).
- **FR-015**: El sistema NO DEBE introducir ningún gato adicional de rareza Raro, Superraro, Legendario o Colaboración en esta spec — esas rarezas ya están representadas en el catálogo existente (gatos fixture y `GACHA_UNITS` de `specs/024-sistema-gacha`) y ya se muestran correctamente etiquetadas por rareza en la Guía de Gatos (`specs/018`, `RARITY_TAG_CLASS`) sin ningún cambio necesario.

### Key Entities *(include if feature involves data)*

- **13 `Cat` nuevos jugables** (`src/data/cats.ts`): 10 de `rarity: 'Normal'` (FR-001) + 3 de `rarity: 'Especial'` (FR-002), más el decimocuarto de recompensa de arco (FR-004) — reutilizan el tipo `Cat` existente sin extenderlo.
- **15 `Cat` nuevos de enemigo** (`src/data/cats.ts`): mismos campos que cualquier enemigo ya definido en `CATS`, sin extender el tipo.
- **48 `Level` nuevos** (`src/data/levels.ts`): reutilizan el tipo `Level` existente sin extenderlo — todos los campos usados (`mapPosition`, `treasureId`, `firstVictoryUnlockCatId`, `battleItemRewards`) ya existen desde `specs/012/013/017/023`.
- **1 `SagaArc` nuevo** (`src/data/sagaArcs.ts`): agrupa los 48 niveles con sus multiplicadores propios y la recompensa de finalización del capítulo.
- **1 `TreasureSet` nuevo** (`src/data/treasureSets.ts`): agrupa los 48 `treasureId` nuevos con su bonificación pasiva.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Las 48 etapas del capítulo son visibles y jugables en el mapa de etapas, respetando el desbloqueo secuencial estándar, sin ninguna regresión sobre los niveles/arcos existentes.
- **SC-002**: Una partida de prueba que supera en orden las 12 etapas hito del capítulo confirma que los 12 gatos correspondientes quedan en `ownedCats`, cada uno en el momento exacto de su etapa.
- **SC-003**: Al superar la etapa 48 (jefe final), el decimocuarto gato de recompensa de arco se otorga exactamente una vez, sin duplicarse en sesiones posteriores ni alterar ninguna recompensa ya otorgada por `arco-1-imperio-de-los-gatos`/`arco-2-imperio-de-los-gatos`.
- **SC-004**: El set de tesoros del capítulo refleja el progreso correcto (X sobre 48) en todo momento, y su bonificación pasiva se otorga exactamente una vez al completarse.
- **SC-005**: La Guía de Gatos muestra los 14 gatos nuevos con su etiqueta de rareza correcta (Normal o Especial) en cuanto son obtenidos, sin ningún cambio de código en esa pantalla.
- **SC-006**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en ninguna suite existente (incluida `specs/012`/`specs/020`/`specs/023`).

## Assumptions

- Los valores numéricos exactos de los 48 niveles (HP de base, costo de energía, recompensa de moneda, composición exacta de oleada por nivel) son valores de diseño provisionales, no balanceados — mismo criterio que el resto del contenido fixture del proyecto ("tasks.md Fase 1"). Solo los 12 niveles hito y el nivel del jefe final tienen composición de oleada curada a mano; los 35 restantes se generan combinando el roster de 15 enemigos con dificultad no decreciente.
- Los `hp`/`damage` de los 15 enemigos nuevos replican los valores del manual (§6.6) a magnificación 100% porque el propio manual los documenta como datos objetivos de referencia, no como expresión creativa protegida — los nombres, en cambio, son originales del proyecto.
- El nombre y rol de cada uno de los 14 gatos nuevos (Normal + Especial + recompensa de arco) es una decisión de diseño de esta spec, sin equivalencia 1:1 obligatoria con ningún gato del manual más allá de inspirar su arquetipo general (tanque, área, a distancia, anti-Flotante, unidad única sin evolución, etc.).
- Ningún gato de esta spec requiere ítem de evolución (`requiredItemCount` ausente en su Forma Verdadera) porque hoy no existe ninguna vía de obtención de ítems de evolución en el proyecto (`specs/010` Assumptions) — introducir esa vía queda fuera de alcance.
- La distribución de las 12 etapas hito (1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32) y la asignación de qué gato desbloquea cada una es arbitraria dentro del orden creciente — no hay narrativa específica requerida, igual que `specs/023` ya asumió para el reparto de sus 13 gatos entre arcos.
- Esta spec no incluye los Capítulos 2 y 3 de Imperio de los Gatos (magnificación 200%/400%), ninguna otra saga (Hacia el Futuro, Gatos del Cosmos, Los Reinos de Aku), Legend Stages, contenido de gacha nuevo, ni una vía de obtención de ítems de evolución — todo queda como trabajo de contenido posterior, mismo patrón que `specs/012` y `specs/013` dejaron la población completa como autoría futura.
