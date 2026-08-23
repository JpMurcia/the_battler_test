# Research: Mapa Visual de Etapas, Catálogo Completo de Gatos y Grilla de Despliegue

## Decisión 1 — Tecnología de render del mapa de nodos

**Decision**: El mapa se implementa como React puro (JSX + CSS + un `<svg>` inline para las líneas conectoras), igual que las 6 pantallas ya existentes (`MainMenuScreen`, `TeamScreen`, etc.) — sin Pixi.js. Los nodos son `<button>` posicionados con `position: absolute` sobre un contenedor relativo, usando coordenadas porcentuales (`Level.mapPosition.x/y`, 0-100), exactamente el mecanismo que ya usa el mockup base (`viewBox="0 0 100 100"` + `left:{{node.x}}%;top:{{node.y}}%`).

**Rationale**: Constitución § VI reserva Pixi.js exclusivamente para el render en tiempo real de la superficie de combate (`BattleStage`); el mapa de niveles es una pantalla de navegación con datos estáticos por render (no hay un loop de 60fps que sincronizar). Usar React+CSS/SVG aquí es consistente con el patrón ya establecido por las 6 pantallas existentes y no introduce ninguna dependencia nueva.

**Alternatives considered**: Renderizar el mapa con `@pixi/react` (mismo motor que `BattleStage`) — descartado: violaría la separación de capas de la Constitución (un componente de navegación no tiene ninguna razón para depender de Pixi), y añadiría complejidad de gestión de texturas/ticker sin ningún beneficio de rendimiento medible para ~3-10 nodos estáticos.

## Decisión 2 — Reparto de los 13 `catId` entre `arco-1`/`arco-2`

**Decision**: Repartir los 13 `catId` sin obtención en dos grupos arbitrarios (sin narrativa específica, tal como ya declara `spec.md` § Assumptions) entre `SAGA_ARCS[0].completionRewards.unlockCatIds` (`arco-1-imperio-de-los-gatos`) y `SAGA_ARCS[1].completionRewards.unlockCatIds` (`arco-2-imperio-de-los-gatos`, campo nuevo — hoy es `{}`). Grupo exacto documentado en `data-model.md`.

**Rationale**: `SagaArc.completionRewards.unlockCatIds` (`specs/012`) ya soporta múltiples `catId` y ya es evaluado de forma monótona por `claimArcRewardsIfComplete` (`useMetaStore.ts:352-365`) — es el único mecanismo que cumple FR-011 ("sin ningún mecanismo de recompensa nuevo").

**Alternatives considered**: Crear un tercer arco/nivel nuevo dedicado a repartir estos 13 gatos — descartado por YAGNI (Constitución § VII): la spec no pide contenido nuevo, solo que el contenido jugable ya existente sea alcanzable. Otorgarlos todos de una vez en un único arco — descartado porque desbalancearía aún más la ya mínima "vertical slice" de 2 niveles/2 arcos (mejor repartir la carga entre ambos).

## Decisión 3 — Ubicación de `MAX_ACTIVE_TEAM_SIZE`

**Decision**: Constante nueva `MAX_ACTIVE_TEAM_SIZE = 6` definida en `src/state/useMetaStore.ts`, junto a `setActiveTeam` (no en un archivo de `src/data/`).

**Rationale**: A diferencia de `MAX_BATTLE_ITEMS_PER_BATTLE` (`src/data/battleItems.ts`), que es una constante de catálogo de contenido (vive junto a `BATTLE_ITEMS`, el arreglo que limita), el tope de equipo activo no tiene un catálogo de datos propio al que pertenecer — es una regla sobre `useMetaStore.activeTeamCatIds`. Colocarla junto al store que la aplica (`setActiveTeam`) evita una dependencia circular o un archivo de una sola constante.

**Alternatives considered**: Nuevo archivo `src/data/team.ts` — descartado por YAGNI: una sola constante no justifica un archivo nuevo cuando ya existe un lugar natural (`useMetaStore.ts`) que la consume directamente.

## Decisión 4 — Alcance del impacto en fixtures de tests existentes

**Decision**: `Level.mapPosition` se agrega como campo **obligatorio** (según FR-001 de `spec.md`), lo que fuerza actualizar todo literal de tipo `Level` en el código de producción (`src/data/levels.ts`: 3 niveles; `src/data/events.ts`: 1 `specialStage`) y en fixtures de test (`tests/unit/LevelSelectScreen.test.tsx` `MOCK_LEVELS`/`activeBanner.specialStage`, `tests/unit/data/levels.test.ts`, `tests/unit/data/events.test.ts`) — `npx tsc -b` fallará en cualquiera que se omita, sirviendo como checklist de compilación (mismo mecanismo ya aceptado en `spec.md` § Edge Cases para el propio `mapPosition`).

**Rationale**: Es el comportamiento ya elegido explícitamente en `spec.md` (Edge Cases): "fuera de alcance dejar un fallback en tiempo de ejecución — `mapPosition` es un campo obligatorio de `Level`, así que su ausencia es un error de tipo detectado en compilación". Documentarlo aquí evita que la fase de tareas lo pase por alto.

**Alternatives considered**: Campo opcional con fallback (p. ej. posición calculada por índice) — descartado explícitamente por la propia spec (Edge Cases), ya que un nivel real sin posición es un error de autoría de contenido, no un caso a tolerar en runtime.

## Decisión 5 — Reescritura de `LevelSelectScreen.tsx` vs. componente nuevo en paralelo

**Decision**: `LevelSelectScreen.tsx` se reescribe in-place (mismo nombre de export, misma prop `onNavigate`, mismo punto de montaje en `App.tsx`) — no se crea una pantalla nueva ni un flag de alternancia.

**Rationale**: `spec.md` (Input) es explícito: "el alcance elegido es reconstruir `LevelSelectScreen` como mapa visual" — no pide una pantalla adicional. Constitución § VII (YAGNI) descarta cualquier mecanismo de alternancia entre la lista vieja y el mapa nuevo, ya que no fue pedido.

**Alternatives considered**: Mantener `LevelSelectScreen` (lista) y agregar `LevelMapScreen` nueva, con un flag — descartado por YAGNI y porque `spec.md` ya decidió "reconstruir", no "añadir".
