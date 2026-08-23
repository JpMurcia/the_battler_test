# Feature Specification: Mapa Visual de Etapas, Catálogo Completo de Gatos y Grilla de Despliegue

**Feature Branch**: `023-mapa-de-etapas-visual`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "como en el documento base, debería tener 5 personajes y debe funcionar la navegación mediante un mapa, valida el mockup y distribuye los botones" — aclarado en conversación: (1) "el documento base" es `docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html` (el mismo mockup ya usado en `specs/021-reskin-cyber-modern`), específicamente su sección `isStages` (mapa de nodos con líneas conectoras, botones circulares con estrellas, panel de detalle lateral y botón "¡Atacar!"); (2) "5 personajes" no es una cifra estricta — lo que importa es que todos los gatos del catálogo (`src/data/cats.ts`), incluidas sus variaciones de habilidad y rareza, sean obtenibles jugando; (3) el alcance elegido es reconstruir `LevelSelectScreen` como mapa visual, manteniendo toda la lógica de bloqueo/energía ya existente (`specs/005-mapa-de-niveles`).

**Nota de alcance**: durante el análisis se encontraron dos brechas reales no mencionadas explícitamente por el usuario pero necesarias para cumplir el pedido de "todos los gatos disponibles". De los 19 `catId` que existen hoy en `CATS`, solo 3 son obtenibles jugando (`basic-cat` desde el inicio, `tank-cat`/`solar-cat` por primera victoria de Nivel 1/2) — los 16 restantes no tienen ningún camino de obtención. De esos 16, 13 son gatos jugables sin camino de obtención por un descuido de contenido (a corregir en esta spec): `speed-cat`, `heavy-cat`, `armored-cat` (núcleo original de `specs/001`/`specs/011`, hoy usados solo como enemigos de `enemyWave` sin nunca otorgarse al jugador), `frost-cat`, `weaken-cat`, `slow-cat`, `zombie-ward-cat` (`specs/015`), `triple-strike-cat`, `lucky-cat` (`specs/016`), y los 4 gatos semilla `seed-cat-basic`/`seed-cat-wall`/`seed-cat-ranged`/`seed-cat-titan` (`specs/022`). Los 3 restantes (`seed-enemy-dog`, `seed-enemy-red-snake`, `seed-enemy-floating-hippo`) son contenido diseñado explícitamente como enemigo, no como personaje jugable — quedan fuera de alcance a propósito (ver Assumptions). Por separado, la barra de despliegue en batalla (`DeployBar`) usa hoy un `flex` con scroll horizontal, mientras el mockup la define como una grilla fija sin scroll — esta spec corrige ambas brechas junto con el mapa, ya que las tres comparten el mismo documento base como fuente de verdad.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar el progreso mediante un mapa visual de nodos (Priority: P1)

Un jugador abre "Niveles" desde el Menú Principal y ve sus etapas (los niveles reales y el banner de evento activo, si lo hay) representadas como nodos circulares conectados por líneas punteadas sobre un fondo de mapa, en vez de la lista vertical actual. El color y opacidad de cada nodo distinguen si está bloqueado, disponible o completado. Tocar un nodo disponible o completado abre un panel con su nombre, dificultad (estrellas) y costo de energía, con un botón "¡Atacar!" para jugarlo.

**Why this priority**: Es el pedido central — sin esto, ninguna otra historia de esta spec tiene sentido por sí sola.

**Independent Test**: Abrir "Niveles" con progreso parcial (algún nivel completado, el siguiente disponible, el resto bloqueado) y confirmar visualmente los tres estados distintos en el mapa, y que tocar el nodo disponible permite jugarlo desde el panel.

**Acceptance Scenarios**:

1. **Given** el jugador no completó ningún nivel, **When** abre el mapa, **Then** ve el primer nivel como "disponible" y el resto como "bloqueado", conectados por líneas, igual que determina hoy `getLevelState` (`specs/005-mapa-de-niveles`).
2. **Given** el jugador completó el Nivel 1, **When** abre el mapa, **Then** el nodo del Nivel 1 se ve "completado" y el del Nivel 2 pasa a "disponible" — mismo criterio de desbloqueo secuencial de siempre, solo con presentación distinta.
3. **Given** el jugador toca un nodo disponible, **When** se abre el panel de detalle, **Then** ve el nombre del nivel, una dificultad en estrellas derivada de `Level.difficulty`, el costo de energía, y un botón "¡Atacar!"; tocar ese botón dispara exactamente el mismo flujo que hoy tiene "Jugar" (gasto de energía de misión, consumo de objetos de batalla seleccionados, entrada a `BattleScreen`).
4. **Given** el jugador toca un nodo bloqueado, **When** intenta interactuar con él, **Then** no se abre ningún panel ni se gasta energía — mismo comportamiento de "deshabilitado" que el botón "Jugar" tiene hoy para niveles bloqueados.
5. **Given** hay un banner de evento especial activo (`specs/014-banner-evento-especial`), **When** el jugador abre el mapa, **Then** lo ve como un nodo adicional visualmente distinguido (borde dorado, como en el mockup), fuera de la cadena de líneas del desbloqueo secuencial — igual que hoy la tarjeta de evento está separada de la lista de niveles.
6. **Given** la energía de misión del jugador es insuficiente para el nivel de un nodo, **When** lo toca, **Then** el panel de detalle se abre igual (para que pueda ver el costo) pero el botón "¡Atacar!" queda deshabilitado — mismo criterio que hoy usa `lacksEnergy`.

---

### User Story 2 - Todos los gatos jugables del catálogo son obtenibles jugando (Priority: P1)

Un jugador que completa ambos arcos existentes (`specs/012-saga-imperio-de-los-gatos`) termina poseyendo, sin ningún paso adicional ni azar, los 13 gatos que hoy están definidos en el catálogo pero no tienen ninguna forma de conseguirse: el núcleo original sin recompensa asignada (`speed-cat`, `heavy-cat`, `armored-cat`), los 4 de habilidades de combate (`specs/015`), los 2 de multigolpe/crítico (`specs/016`) y los 4 gatos semilla jugables (`specs/022`).

**Why this priority**: Sin esto, "todos los gatos deben estar disponibles" (parte explícita del pedido) queda incumplido — hay contenido jugable que ningún jugador puede alcanzar nunca.

**Independent Test**: Completar `arco-1-imperio-de-los-gatos` y `arco-2-imperio-de-los-gatos` de punta a punta y confirmar en `ownedCats` que los 13 gatos antes inalcanzables ahora están poseídos, cada uno con su rareza y habilidades intactas (visibles en `CatGuideScreen`/`UpgradeScreen`/`TeamScreen`, sin cambio en esas pantallas).

**Acceptance Scenarios**:

1. **Given** un jugador nuevo, **When** consulta `CatGuideScreen`, **Then** ve únicamente los gatos que ya posee (comportamiento actual, sin cambios) — los 13 gatos de esta historia no aparecen ahí hasta ser obtenidos.
2. **Given** el jugador completa `arco-1-imperio-de-los-gatos` (todos sus niveles marcados en `completedLevelIds`), **When** se otorgan las recompensas de finalización de arco (`claimArcRewardsIfComplete`, ya implementado en `specs/012`), **Then** además del comportamiento ya existente de ese arco, el jugador recibe un subconjunto de los 13 gatos de esta historia.
3. **Given** el jugador completa `arco-2-imperio-de-los-gatos`, **When** se otorgan sus recompensas de finalización, **Then** recibe el resto de los 13 gatos no otorgados por `arco-1`.
4. **Given** un gato de esta historia ya fue otorgado, **When** el jugador vuelve a completar el mismo arco en una sesión posterior (rejugando un nivel ya superado), **Then** no se otorga de nuevo ni se duplica — mismo comportamiento monótono que `claimArcRewardsIfComplete`/`addOwnedCat` ya garantizan hoy para cualquier gato de recompensa de arco.
5. **Given** cualquiera de los 13 gatos ya obtenido, **When** el jugador lo ve en `TeamScreen`/`UpgradeScreen`/`DeployBar`, **Then** se comporta exactamente igual que cualquier otro gato poseído (mejorable, equipable, desplegable, con su rareza y habilidades correctas) — sin ninguna lógica especial nueva para estos 13 gatos específicamente.

---

### User Story 3 - Barra de despliegue en grilla fija, sin scroll horizontal (Priority: P2)

Durante una batalla, el jugador ve todos los gatos de su equipo activo distribuidos en una grilla fija de botones (como en el mockup), sin necesidad de deslizar horizontalmente para encontrar alguno.

**Why this priority**: Es la parte de "distribuye los botones" del pedido — depende de un tope de tamaño de equipo para tener sentido como grilla fija, por eso va después de las Historias 1-2, pero es independiente de ambas en implementación.

**Independent Test**: Con un equipo activo de tamaño máximo confirmado, entrar a una batalla y confirmar que todos los botones de despliegue son visibles sin scroll, distribuidos en columnas iguales.

**Acceptance Scenarios**:

1. **Given** un equipo activo de hasta 6 gatos (el mismo tope que usa el mockup para su grilla de despliegue), **When** el jugador entra a una batalla, **Then** ve todos los botones de despliegue distribuidos en una grilla de columnas iguales, sin scroll horizontal ni botones cortados.
2. **Given** el jugador intenta seleccionar un séptimo gato en `TeamScreen` (`specs/006-dashboard-base-jugador`) para su equipo activo, **When** ya tiene 6 seleccionados, **Then** la selección adicional no tiene efecto — mismo patrón ya usado por `MAX_BATTLE_ITEMS_PER_BATTLE` en `specs/017-objetos-de-batalla` para un tope de selección.
3. **Given** un jugador con un equipo ya guardado de más de 6 gatos de una sesión anterior a esta spec (dato heredado), **When** entra a una batalla, **Then** el sistema no rompe — se muestran como máximo los primeros 6 de ese equipo guardado en la grilla, sin error ni pantalla en blanco.

---

### Edge Cases

- Un nivel real sin `mapPosition` configurado (error de autoría de contenido): fuera de alcance dejar un fallback en tiempo de ejecución — `mapPosition` es un campo obligatorio de `Level`, así que su ausencia es un error de tipo detectado en compilación (`npx tsc -b`), igual que cualquier otro campo obligatorio de `Level` hoy.
- El panel de detalle queda abierto sobre un nodo que deja de estar disponible (p. ej. la energía de misión se agota mientras el panel está abierto): el botón "¡Atacar!" se deshabilita de inmediato, reactivo al mismo estado (`missionEnergy.current`) que ya se lee en cada render — sin necesidad de cerrar y reabrir el panel.
- Dos gatos de la Historia 2 asignados al mismo arco no deben pisar la recompensa de gato ya existente de ese arco (`firstVictoryUnlockCatId` de sus niveles, ya usado por `tank-cat`/`solar-cat`) — se otorgan vía `completionRewards.unlockCatIds`, un mecanismo distinto y ya multi-gato, sin tocar los campos de primera victoria existentes.
- Un jugador que ya completó ambos arcos antes de que esta spec exista (progreso guardado previo): al cargar la app tras esta spec, `claimArcRewardsIfComplete` vuelve a evaluarse en el próximo `grantLevelRewards`/finalización disponible — si el arco ya estaba en `grantedArcRewardIds`, no se re-otorga nada (mismo guard ya existente), así que estos jugadores necesitan volver a jugar y ganar un nivel de un arco ya completado para dispararlo de nuevo. Esto es una limitación conocida y aceptada: no se agrega ninguna migración retroactiva de guardado para esta spec.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE reemplazar la lista vertical de `LevelSelectScreen` por un mapa visual: cada `Level` real y la fase especial de un `EventBanner` activo (`specs/014`) se renderizan como un nodo posicionado según un nuevo campo obligatorio `Level.mapPosition: { x: number; y: number }` (porcentaje 0-100 del área del mapa).
- **FR-002**: El sistema DEBE dibujar líneas conectoras entre nodos consecutivos siguiendo el mismo orden secuencial que ya determina su desbloqueo (`LEVELS`, en orden de arreglo) — puramente visual, sin ninguna lógica de desbloqueo nueva.
- **FR-003**: Cada nodo DEBE reflejar exactamente uno de los tres estados que ya calcula `getLevelState` (`specs/005-mapa-de-niveles`): bloqueado, disponible o completado — reutilizado sin modificar esa función.
- **FR-004**: Tocar un nodo disponible o completado DEBE abrir/actualizar un panel de detalle con el nombre del nivel, una dificultad en estrellas derivada de `Level.difficulty`, y su costo de energía (`Level.energyCost`, o el costo por arco si aplica — `specs/013-escalado-capitulos-sets-tesoros`).
- **FR-005**: Tocar un nodo bloqueado NO DEBE abrir el panel de detalle ni tener ningún efecto — mismo comportamiento que un botón deshabilitado.
- **FR-006**: El botón "¡Atacar!" del panel de detalle DEBE invocar exactamente el mismo flujo que hoy usa el botón "Jugar" (`spendMissionEnergy` → `consumeSelectedBattleItems` → `startLevel` → navegar a `Battle`), sin duplicar ni reimplementar esa lógica.
- **FR-007**: El botón "¡Atacar!" DEBE quedar deshabilitado cuando la energía de misión del jugador sea menor al costo del nivel seleccionado — mismo criterio que ya usa `lacksEnergy`.
- **FR-008**: La fase especial de un `EventBanner` activo DEBE aparecer como un nodo visualmente distinguido (p. ej. borde dorado) fuera de la cadena de líneas de desbloqueo secuencial, preservando que NO participa del desbloqueo de niveles (`specs/014` FR-004).
- **FR-009**: El indicador de energía de misión (`missionEnergy.current`/`max`) DEBE seguir visible en la pantalla del mapa, sin quedar tapado por el canvas de nodos ni por el panel de detalle.
- **FR-010**: Cada uno de estos 13 gatos DEBE tener al menos un camino de obtención determinista alcanzable jugando: `speed-cat`, `heavy-cat`, `armored-cat`, `frost-cat`, `weaken-cat`, `slow-cat`, `zombie-ward-cat`, `triple-strike-cat`, `lucky-cat`, `seed-cat-basic`, `seed-cat-wall`, `seed-cat-ranged`, `seed-cat-titan`.
- **FR-011**: La obtención de esos 13 gatos DEBE reutilizar únicamente `SagaArc.completionRewards.unlockCatIds` (`specs/012`, ya implementado y ya soporta múltiples `catId`) — sin ningún mecanismo de recompensa nuevo, sin gacha, sin campo de guardado adicional.
- **FR-012**: Otorgar estos 13 gatos NO DEBE alterar ninguna recompensa ya otorgada hoy por `arco-1-imperio-de-los-gatos`/`arco-2-imperio-de-los-gatos` (el desbloqueo de `arco-2` al completar `arco-1`, ni los `firstVictoryUnlockCatId`/`treasureId` ya existentes de `level-1`/`level-2`) — puramente aditivo sobre `unlockCatIds`.
- **FR-013**: Una vez obtenido, cada uno de estos 13 gatos DEBE comportarse exactamente igual que cualquier otro gato poseído en `CatGuideScreen`, `UpgradeScreen`, `TeamScreen` y `DeployBar` — sin ninguna condición especial nueva en esas pantallas. En particular, que el jugador también posea `armored-cat` NO DEBE alterar la barrera de base (`specs/020-barrera-de-base`), que sigue dependiendo únicamente de la `BattleUnit` **enemiga** con `catId === bossCatId`.
- **FR-014**: `DeployBar` DEBE distribuir los botones de despliegue en una grilla de columnas fijas (sin scroll horizontal), reemplazando el `flex` con desbordamiento actual.
- **FR-015** *(corregido tras el cierre — ver Nota de corrección más abajo)*: `DeployBar` DEBE mostrar/desplegar como máximo `MAX_ACTIVE_TEAM_SIZE` (6) unidades a la vez, sin importar cuántas tenga el equipo equipable — el tope de selección en `TeamScreen`/`useMetaStore.setActiveTeam` es el de `specs/022` FR-008 (5 a 10), no 6.
- **FR-016**: Un equipo activo persistido con más de 6 `catId` (equipo de 7-10 unidades, válido desde `specs/022` FR-008) NO DEBE romper `DeployBar` — se muestran como máximo los primeros 6 sin error.

### Key Entities *(include if feature involves data)*

- **`Level.mapPosition`** (nuevo, obligatorio en `src/data/levels.ts`): `{ x: number; y: number }`, porcentaje 0-100 de posición del nodo en el mapa. Se agrega también a `EventBanner.specialStage` (misma forma de `Level`, ya reutilizada por `specs/014`).
- **Grupo de recompensa "Catálogo Completo"** (no es una entidad nueva de código — es una decisión de contenido): los 13 `catId` de la Historia 2 repartidos entre `SAGA_ARCS[0].completionRewards.unlockCatIds` y `SAGA_ARCS[1].completionRewards.unlockCatIds`.
- **`MAX_ACTIVE_TEAM_SIZE`** (nueva constante, `src/state/useMetaStore.ts`): tope de 6 `catId` mostrados/desplegados a la vez en `DeployBar` — no del equipo equipable en sí (ver Nota de corrección).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los niveles reales y la fase de evento activa se ven como nodos en el mapa, conectados y coloreados según su estado, sin ninguna regresión en qué niveles están bloqueados/disponibles/completados frente al comportamiento actual.
- **SC-002**: El botón "¡Atacar!" del panel de detalle produce exactamente el mismo resultado (gasto de energía, batalla iniciada) que el botón "Jugar" actual, en el 100% de los casos verificados.
- **SC-003**: Al completar ambos arcos existentes, el jugador termina poseyendo 16 de los 19 `catId` actuales de `CATS` — los 3 ya obtenibles hoy (`basic-cat`, `tank-cat`, `solar-cat`) + los 13 de esta spec — quedando fuera únicamente los 3 gatos-enemigo semilla (`seed-enemy-*`, fuera de alcance a propósito). Verificable por `Object.keys(ownedCats).length === 16` en una partida de prueba de punta a punta.
- **SC-004**: Ninguna recompensa ya otorgada por `arco-1`/`arco-2` antes de esta spec cambia — 0 regresiones en los tests existentes de `specs/012`.
- **SC-005**: `DeployBar` no requiere scroll horizontal para un equipo de hasta 6 gatos, en el ancho de pantalla mínimo soportado (`specs/021` Fase 9, layout fijo horizontal).
- **SC-006**: `npx tsc -b` limpio y `npm test` en verde, sin regresión en ninguna suite existente.

## Assumptions

- El mapa de nodos no incluye pestañas de saga (`sagaTabs` del mockup) en esta spec — solo hay 2 arcos con 1 nivel cada uno hoy; se agregarían cuando el contenido lo justifique (Constitución § VII, YAGNI).
- El mapa no incluye el banner "Festival de Tesoros" del mockup (multiplicador temporal de tesoros) — no existe ese sistema en el juego actual y no fue parte del pedido; queda fuera de alcance.
- Los 13 gatos de la Historia 2 se reparten entre `arco-1`/`arco-2` de forma arbitraria (sin narrativa específica) — el balance/tematización de cuál gato corresponde a cuál arco no es un requisito de esta spec, igual que el resto de las estadísticas del proyecto ("valores de diseño provisionales, no balanceados").
- Los 3 gatos-enemigo semilla (`seed-enemy-dog`, `seed-enemy-red-snake`, `seed-enemy-floating-hippo`, `specs/022`) quedan deliberadamente fuera de la Historia 2 — su propio nombre y diseño (`SEED_ENEMIES`, usados en `level-seed-demo.enemyWave`) los identifica como contenido enemigo, no como personajes jugables del jugador; "todos los gatos disponibles" se interpreta como "todo el contenido jugable", no como "todo `catId` que exista en el arreglo `CATS`".
- El tope de 6 gatos *mostrados a la vez en `DeployBar`* (Historia 3) es una decisión nueva de esta spec, no pedida explícitamente por el usuario, pero necesaria para que "grilla fija sin scroll" tenga un límite superior definido — tomada del propio mockup (su grilla de despliegue es `repeat(6,1fr)` y su equipo por defecto llena exactamente 6 de 10 slots). Ese "10 slots" del mockup coincide con el máximo ya exigido por `specs/022` FR-008 para el equipo *equipable* — ver Nota de corrección.
- Esta spec no toca `GachaScreen` (permanece el mismo stub de `specs/004-menu-principal-config`) ni introduce ninguna probabilidad por rareza — la Constitución § VII sigue vigente sin cambios.

## Nota de corrección (post-cierre)

Al implementar esta spec, FR-015 aplicó el tope de 6 tanto a `DeployBar` (grilla de despliegue en batalla) como a `useMetaStore.setActiveTeam`/`TeamScreen` (equipo equipable), sin notar que `specs/022` FR-008 ya exigía un equipo equipable de **5 a 10** unidades — un requisito vivo de una spec previa, pisado por esta. Detectado en una auditoría de deriva posterior (cruce de FRs contra el código de las 23 specs) y corregido: `MAX_ACTIVE_TEAM_SIZE` (6) queda acotado exclusivamente a `DeployBar`; se introduce `MAX_TEAM_ROSTER_SIZE` (10, `src/state/useMetaStore.ts`) para el tope real de `setActiveTeam`/`TeamScreen`, satisfaciendo ambas specs a la vez — FR-016 (equipos de más de 6 no rompen `DeployBar`) pasa de ser un caso "heredado" a un caso normal y esperado (equipos de 7-10).
