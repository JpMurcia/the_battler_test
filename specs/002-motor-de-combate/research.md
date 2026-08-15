# Research: Motor de Combate Real

No queda ningún `NEEDS CLARIFICATION` en `plan.md` § Technical Context — el stack es el mismo que `specs/001-nucleo-del-juego/plan.md` ya validó en producción (bootstrap ejecutable, tests pasando). Este documento resuelve las decisiones de diseño abiertas al conectar el motor real.

## Decisión 1: Forma del paso de simulación (`simulation.ts`)

**Decision**: Una única función pura `stepSimulation(state: SimState, deltaSeconds: number): SimState` que recibe un subconjunto serializable del estado de `useGameStore` (unidades, bases, energía, cooldowns, oleada pendiente) y devuelve el siguiente estado — sin mutación, sin dependencias externas, sin `Date.now()`/temporizadores internos (el tiempo transcurrido lo controla quien la llama).

**Rationale**: Es el único diseño que cumple la Constitución § VI (testeable con Vitest pasando `deltaSeconds` fijos, sin canvas ni temporizadores reales) y que permite que `useGameStore.tick()` sea una llamada trivial de una línea (`set(stepSimulation(get(), deltaSeconds))`).

**Alternatives considered**: Mutar unidades in-place dentro de `useGameStore.tick()` directamente (rechazado — mezclaría lógica de combate con la store, violando la separación motor/UI y complicando los tests de T005-estilo que ya existen para la store). Un motor basado en clases con métodos `.update()` por unidad (rechazado — más ceremonia sin beneficio para el alcance de un único carril; funciones puras sobre arrays son suficientes y más fáciles de testear aisladamente por reglas: colisión, combate, movimiento).

## Decisión 2: Colisión AABB 1D (`collision.ts`)

**Decision**: `overlaps1D(a: { x: number; width: number }, b: { x: number; width: number }): boolean` — compara los intervalos `[x, x+width]` de ambas entidades. Reutilizable tanto para unidad-vs-unidad como para unidad-vs-base (una base se modela con el mismo shape `{ x, width }`).

**Rationale**: Coincide literalmente con la regla ya fijada en `specs/001-nucleo-del-juego/spec.md` § Arquitectura Core del Juego — no hay ambigüedad de diseño aquí, solo falta implementarla.

**Alternatives considered**: Ninguna — la spec fundacional ya cerró esta decisión.

## Decisión 3: Bloqueo de carril con múltiples candidatos (Edge Case de spec.md)

**Decision**: Al buscar con qué combate una unidad, se recorre el array de unidades enemigas en orden de aparición (orden de despliegue/spawn) y se combate contra la **primera** con la que haya overlap; las demás no avanzan mientras compartan posición con una unidad ya "Engaged" por delante en el carril (se bloquean por transición: si una unidad no-combatiente se superpondría con otra unidad de su mismo equipo que ya dejó de avanzar, tampoco avanza).

**Rationale**: Es la regla textual del Edge Case ya escrito en `specs/001-nucleo-del-juego/spec.md` ("la unidad del jugador combate contra la primera con la que su rectángulo de colisión se superpone; el resto espera detrás en cola"). Usar el orden de aparición como desempate es determinista y trivial de testear.

**Alternatives considered**: Desempate por distancia al jugador/enemigo más cercano (rechazado — en un único carril 1D el orden de aparición y la distancia coinciden casi siempre; añadir esa comparación es complejidad sin beneficio observable).

## Decisión 4: Representación visual sin arte real

**Decision**: `UnitSprite.tsx` renderiza un `pixiGraphics` (rectángulo relleno) por `BattleUnit`, con color fijo por `team` (`Player`/`Enemy`) y tamaño derivado de `width`/una altura fija de placeholder — sin `Assets.load` de ningún sprite.

**Rationale**: Ya declarado como excepción en `plan.md` § Complexity Tracking (Principio III). Evita bloquear la validación del motor en arte que todavía no existe, y evita también el trabajo de gestionar un pool de texturas por gato (que si tendría sentido con arte real) para unidades que van a desecharse en la siguiente spec de contenido.

**Alternatives considered**: Reusar el sprite de prueba (`cat-placeholder.png`) del bootstrap para todas las unidades (rechazado — no distingue equipos visualmente, lo que dificultaría la verificación manual de que la colisión/combate ocurre entre los bandos correctos).

## Decisión 5: Oleada enemiga como datos

**Decision**: `Level.enemyWave: { catId: string; spawnAtSeconds: number }[]` en `src/data/levels.ts`, usando el mismo catálogo `CATS` para las estadísticas de las unidades enemigas (mismo `Cat`, `team: "Enemy"` al instanciarse como `BattleUnit`). `simulation.ts` compara `elapsedSeconds` contra la lista y spawnea las que ya "vencieron" y no se han spawneado todavía.

**Rationale**: Cumple Constitución § IV (datos, no lógica hardcodeada) con el mínimo de entidades nuevas — reutilizar `CATS` para enemigos evita duplicar un catálogo completo de contenido enemigo en esta ronda, consistente con `specs/001-nucleo-del-juego/spec.md` § Assumptions ("el pool... es contenido configurable").

**Alternatives considered**: Un catálogo de enemigos separado con sus propias estadísticas (rechazado para esta ronda — más contenido a mantener sin que ninguna historia de usuario de esta spec lo requiera; se puede introducir en la spec de contenido/balance futura sin cambiar la forma de `EnemyWave`).
