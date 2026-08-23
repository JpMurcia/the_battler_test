# Data Model: Mapa Visual de Etapas, Catálogo Completo de Gatos y Grilla de Despliegue

## `Level.mapPosition` (nuevo campo obligatorio — `src/data/levels.ts`)

```ts
export interface Level {
  // ...campos existentes sin cambios...
  /** specs/023-mapa-de-etapas-visual (FR-001). Porcentaje 0-100 de posición del nodo dentro del área del mapa. */
  mapPosition: { x: number; y: number }
}
```

Al ser obligatorio, `npx tsc -b` exige un valor en **todo** literal de tipo `Level` existente (research.md Decisión 4). Valores de diseño provisionales, no balanceados, siguiendo el mismo orden secuencial que ya determina `LEVELS` (bottom-left → top-right, como el mockup base):

| `id` | `mapPosition` | Nota |
|---|---|---|
| `level-1` | `{ x: 15, y: 80 }` | primer nodo, siempre disponible |
| `level-2` | `{ x: 45, y: 55 }` | segundo nodo, misma región |
| `level-seed-demo` | `{ x: 75, y: 30 }` | tercer nodo, catálogo semilla (`specs/022`) |

`EventBanner.specialStage` (`src/data/events.ts`) reutiliza el tipo `Level` sin cambio de forma (ya documentado en su propio comentario), así que también requiere `mapPosition`. Se ubica visualmente separado de la cadena secuencial (FR-008), esquina inferior derecha del mapa — no la superior: el panel de detalle (`.stage-detail-panel`, `right:8px;top:8px;width:190px`) cubre físicamente esa esquina mientras está abierto, lo que dejaría el nodo sin poder recibir clics con otro panel ya abierto (hallazgo de verificación con Playwright, T023):

| `id` | `mapPosition` |
|---|---|
| `evento-etapas-de-fantasia-fase-especial` | `{ x: 90, y: 88 }` |

## Líneas conectoras (`nodeLines`, derivadas — sin persistencia)

Puramente calculadas en el componente a partir de `LEVELS` en su orden de arreglo (FR-002): un segmento entre `LEVELS[i].mapPosition` y `LEVELS[i+1].mapPosition` para cada `i` de `0` a `LEVELS.length - 2`. La fase especial de un `EventBanner` activo **no** participa de este cálculo (FR-008) — no genera ni recibe ninguna línea.

## Estado visual del nodo (derivado — sin campo nuevo)

Cada nodo reutiliza `getLevelState(index, highestUnlockedLevelIndex, isCompleted)` (`src/data/levelState.ts`, sin modificar) para mapear a exactamente uno de `'locked' | 'unlocked' | 'completed'` (FR-003). El nodo del banner de evento activo no pasa por `getLevelState` — su color/borde es siempre el "dorado" distintivo de FR-008 mientras esté activo (`isEventActive`, ya existente).

## `SagaArc.completionRewards.unlockCatIds` (modificado — `src/data/sagaArcs.ts`)

Reparto de los 13 `catId` sin camino de obtención (research.md Decisión 2), agrupados por la spec de origen de cada uno — arbitrario respecto a narrativa, pero determinista y fácil de auditar:

**`arco-1-imperio-de-los-gatos`** (`completionRewards.unlockCatIds`, nuevo campo — hoy solo tiene `unlockNextArcId`):
`['speed-cat', 'heavy-cat', 'armored-cat', 'frost-cat', 'weaken-cat', 'slow-cat', 'zombie-ward-cat']`
(núcleo original sin recompensa + los 4 de `specs/015-catalogo-habilidades-combate`)

**`arco-2-imperio-de-los-gatos`** (`completionRewards.unlockCatIds`, reemplaza el `{}` actual):
`['triple-strike-cat', 'lucky-cat', 'seed-cat-basic', 'seed-cat-wall', 'seed-cat-ranged', 'seed-cat-titan']`
(los 2 de `specs/016-multigolpe-critico` + los 4 gatos semilla jugables de `specs/022`)

`unlockNextArcId` de `arco-1` permanece sin cambios (FR-012) — el campo nuevo es puramente aditivo dentro de `completionRewards`.

## `MAX_ACTIVE_TEAM_SIZE` / `MAX_TEAM_ROSTER_SIZE` (`src/state/useMetaStore.ts`)

*Corregido post-cierre — ver spec.md § Nota de corrección: FR-015 original acotaba tanto la grilla de despliegue como el equipo equipable al mismo número (6), pisando el rango 5-10 ya exigido por `specs/022` FR-008.*

```ts
/** specs/023 (FR-014/FR-016). Cuántas unidades se muestran/despliegan a la vez en DeployBar — no el tamaño del equipo. */
export const MAX_ACTIVE_TEAM_SIZE = 6

/** specs/022 (FR-008). Tope del equipo equipable en sí (mínimo real: "no vacío", ver Nota de corrección). */
export const MAX_TEAM_ROSTER_SIZE = 10
```

- `setActiveTeam(catIds)` (`useMetaStore.ts`) agrega el guard `catIds.length > MAX_TEAM_ROSTER_SIZE` → `return false` (mismo patrón de rechazo sin efecto que ya usa `catIds.length === 0`, de `specs/006`).
- `DeployBar` (`src/screens/BattleScreen.tsx`) recorta su lista de despliegue a `.slice(0, MAX_ACTIVE_TEAM_SIZE)` — cubre FR-016 (equipos de 7-10, ya un caso normal bajo `specs/022`, no solo "heredado") sin depender de que `setActiveTeam` haya validado ese equipo.
- `TeamScreen` (`src/screens/TeamScreen.tsx`) deshabilita el checkbox de un `catId` no seleccionado cuando `selectedIds.length >= MAX_TEAM_ROSTER_SIZE` (mismo patrón ya usado por `BattleItemSelector`/`MAX_BATTLE_ITEMS_PER_BATTLE` en el mismo archivo).

## Nodo de UI — `StageNode` (tipo interno de `LevelSelectScreen.tsx`, no persistido)

```ts
interface StageNode {
  id: string           // Level.id o EventBanner.specialStage.id
  name: string
  x: number             // Level.mapPosition.x
  y: number             // Level.mapPosition.y
  state: 'locked' | 'unlocked' | 'completed' | 'event'
  difficulty: number     // Level.difficulty — usado para las estrellas del panel
  energyCost: number
}
```

Puramente derivado en cada render a partir de `LEVELS`, `EVENT_BANNERS` y el estado ya existente de `useMetaStore` — no es una entidad persistida ni un tipo exportado de `src/data/`.

## Panel de detalle — estado local de `LevelSelectScreen.tsx`

`selectedNodeId: string | null` (React `useState`, efímero, no persistido) — el nodo actualmente mostrado en el panel lateral. Se limpia (`null`) solo por interacción del usuario, nunca automáticamente al cambiar `missionEnergy` (Edge Cases: el botón "¡Atacar!" se deshabilita reactivamente sin cerrar el panel).
