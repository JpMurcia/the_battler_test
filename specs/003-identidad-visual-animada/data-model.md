# Data Model: Identidad Visual Animada

Todos los conceptos de esta spec son **estado de render efímero**, derivado o calculado — ninguno se persiste (Constitución § V) y ninguno modifica la forma de `BattleUnit`, `SimState` o `Cat` ya existentes (Constitución § VI, research.md Decisión 1/4).

## Cat (ya existente, `src/data/cats.ts`) — sin cambios de forma

```ts
interface Cat {
  id: string
  name: string
  cost: number
  cooldownSeconds: number
  hp: number
  damage: number
  speed: number
  width: number
  attackIntervalSeconds: number
}
```

Sin campos nuevos (research.md Decisión 1) — `getVisualProfile()` lee estos campos ya existentes.

## VisualProfile (nuevo, derivado — `src/game/animation.ts`)

```ts
interface VisualProfile {
  bodyWidth: number            // derivado de cat.width
  bodyHeight: number           // derivado de cat.hp — más vida, cuerpo más "pesado"
  cornerRadius: number         // derivado de cat.speed — más veloz, silueta más aerodinámica; más lento, más anguloso
  accentColor: number          // acento sobre TEAM_COLOR, derivado de cat.damage
  idleBobFrequencyHz: number   // derivado de cat.speed — ritmo del bob de movimiento/idle
  attackPulseDurationSeconds: number // = cat.attackIntervalSeconds (reutiliza el dato existente, no uno nuevo)
}
```

`getVisualProfile(cat: Cat): VisualProfile` — función pura, sin dependencias de Pixi/React, testeable con Vitest. Determinista: el mismo `Cat` produce siempre el mismo `VisualProfile`, calculado una vez por unidad (no en cada frame).

## AnimationState (nuevo, derivado — vive solo en la capa de render)

```ts
type AnimationState = 'Idle' | 'Attacking'
```

Mapea 1:1 desde `BattleUnit.state` ya existente: `'Moving'` → `'Idle'`, `'Engaged'` → `'Attacking'`. No es un campo nuevo de `BattleUnit` — es una interpretación de solo lectura calculada dentro de `UnitSprite` en cada frame a partir del `state` que ya expone el motor. `'Dead'` no mapea a `AnimationState` porque una unidad `Dead` ya no está en `useGameStore.getState().units` (ver `DeathEcho` abajo).

## DeathEcho (nuevo, efímero — vive en un registro dentro de `BattleField`, nunca en `useGameStore`/`SimState`)

```ts
interface DeathEcho {
  instanceId: string
  team: BattleUnit['team']
  catId: string
  x: number
  width: number
  remainingSeconds: number // cuenta regresiva desde una duración fija hasta 0
}
```

Se crea cuando `BattleField` detecta, tick a tick y solo mientras `status === 'InProgress'`, que un `instanceId` presente en el tick anterior ya no está en `useGameStore.getState().units` (research.md Decisión 4). Se anima por `remainingSeconds` decreciente (escala/alpha) y se elimina del registro al llegar a 0 — nunca se sincroniza de vuelta hacia `src/engine/`.

**Validation rules**: un `DeathEcho` nunca se crea a partir de una limpieza por `reset()` (la transición completa de `units` a `[]` fuera de una muerte tick-a-tick durante `status === 'InProgress'` no genera ecos — la pantalla de batalla típicamente se abandona en ese momento).

## Relación entre entidades

```text
Cat (contenido, src/data/cats.ts)
  └─ getVisualProfile() ─→ VisualProfile (calculado una vez por unidad, cacheado en el ciclo de vida del UnitSprite)

BattleUnit.state (motor, src/engine/types.ts — sin cambios)
  └─ mapeo de solo lectura ─→ AnimationState ('Idle' | 'Attacking', recalculado cada frame en la capa de render)

BattleField (comparación tick a tick de instanceIds activos)
  └─ unidad desaparecida por muerte ─→ DeathEcho (registro efímero, solo en la capa de render)
```

Ningún nodo de este grafo modifica `src/engine/` ni añade persistencia — es exclusivamente la capa de presentación descrita en `plan.md` § Project Structure.
