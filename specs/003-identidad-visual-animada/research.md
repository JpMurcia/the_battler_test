# Research: Identidad Visual Animada

No queda ningún `NEEDS CLARIFICATION` en `plan.md` § Technical Context — el stack es el mismo que `specs/002-motor-de-combate/plan.md` ya validó en producción. Este documento resuelve las decisiones de diseño abiertas para animar las unidades sin arte externo y sin tocar `src/engine/`, apoyado en la guía de las skills de PixiJS v8 instaladas en el proyecto (`pixijs-scene-graphics`, `pixijs-scene-container`, `pixijs-ticker`, `pixijs-performance`).

## Decisión 1: Parámetros visuales por archetype derivados de stats existentes, sin campos nuevos en `Cat`

**Decision**: Una función pura `getVisualProfile(cat: Cat): VisualProfile` (`src/game/animation.ts`) deriva matemáticamente forma, tamaño, acento de color y ritmo de animación a partir de los campos ya existentes de `Cat` (`width`, `hp`, `speed`, `damage`, `attackIntervalSeconds`) — ningún campo nuevo se añade a `src/data/cats.ts`.

**Rationale**: Constitución § IV exige que el balance viva en datos, no que cada aspecto visual sea un campo explícito de contenido. Los 4 gatos ya existentes están completamente diferenciados por sus stats numéricas (el tanque tiene `hp: 200`/`width: 28`/`speed: 10`; el veloz tiene `hp: 30`/`width: 12`/`speed: 40`), así que derivar la identidad visual de esos mismos números es la opción más simple (Constitución § VII) y evita mantener dos fuentes de verdad — balance de juego y arte — para el mismo catálogo.

**Alternatives considered**: Añadir un campo `visualProfile` explícito por gato en `cats.ts` (rechazado — over-engineering para 4 gatos ya diferenciados por sus stats; se puede introducir sin romper `getVisualProfile()` el día que una spec de arte real lo necesite, sustituyendo su implementación sin cambiar su firma).

## Decisión 2: Animación por transform, no por redibujado de `Graphics`

**Decision**: Cada `UnitSprite` dibuja su `Graphics` (la forma del cuerpo, vía `getVisualProfile`) una única vez por unidad — nunca en el ciclo de animación. La animación (idle/movimiento, ataque, muerte) se aplica mutando `position`, `scale`, `rotation` y `alpha` del `Container`/`Graphics` ya creado en cada frame.

**Rationale**: Las skills `pixijs-scene-graphics` y `pixijs-performance` instaladas son explícitas: *"Do not clear and redraw every frame unless the shape really changes; prefer transforms"* y *"Redrawing Graphics every frame: animate transforms or move to sprites/mesh"*. Con el umbral de rendimiento heredado (≥10 unidades activas a 60fps, FR-009/SC-003), redibujar geometría vectorial en cada uno de los 60 frames/s por unidad es exactamente el primer cuello de botella que esas skills marcan como evitable.

**Alternatives considered**: Redibujar el `Graphics` cada frame variando ligeramente sus puntos (deformación real de la geometría) — rechazado, más caro en CPU sin beneficio visual perceptible sobre animar el transform del mismo `Container` que envuelve la forma ya dibujada.

## Decisión 3: Animación dirigida por el `Ticker` propio de cada `UnitSprite`, no por re-render de React en cada frame

**Decision**: Cada `UnitSprite` se suscribe a su propio `useTick` (de `@pixi/react`, ya en uso en el proyecto — ver `src/game/BattleStage.tsx`) y en cada frame lee su `BattleUnit` correspondiente directamente de `useGameStore.getState().units` (por `instanceId`) para mutar imperativamente, vía `ref` al objeto Pixi, su posición y su transform de animación — sin pasar por `setState` ni por props de React. `BattleField` deja de llamar a `setUnits` en cada tick; en su lugar recalcula la lista de `instanceId`s activos y solo dispara un re-render (que monta/desmonta los `UnitSprite` correspondientes) cuando esa composición cambia — es decir, cuando una unidad nace o muere, no en cada uno de los 60 frames/s.

**Rationale**: Es la lectura estricta de la Constitución § VI (*"ningún componente de React vuelve a renderizar en respuesta al tick de 60fps del combate"*) aplicada a este caso concreto. El patrón que dejó `specs/002-motor-de-combate/` (`setUnits` en cada tick, re-renderizando `BattleField` y por lo tanto cada `UnitSprite` 60 veces por segundo) era aceptable porque solo reposicionaba un rectángulo sin ningún cálculo adicional; esta spec añade animación continua por unidad (idle + ataque + muerte), lo que multiplica el costo de ese patrón justo cuando FR-009/SC-003 exige sostener 60fps con más unidades en pantalla y más trabajo por unidad. Es también la guía explícita de las skills `pixijs-ticker`/`pixijs-performance`: mover el trabajo de cada frame fuera del ciclo de reconciliación de React.

**Alternatives considered**: Mantener `setUnits` en cada tick como hoy y calcular la animación a partir de las props que ya se reciben (rechazado — obliga a React a reconciliar el árbol completo de `UnitSprite`s en cada uno de los 60 frames/s solo para que cada uno recalcule su propia animación local, un costo evitable que las skills de rendimiento de Pixi señalan directamente).

## Decisión 4: Señal de muerte (US3) sin tocar `src/engine/`

**Decision**: `stepSimulation` sigue filtrando las unidades `Dead` del array de `units` en el mismo tick en que mueren, exactamente como lo dejó `specs/002-motor-de-combate/` — ningún campo ni temporizador nuevo se añade a `BattleUnit` ni a `SimState`. La animación de derrota vive enteramente en la capa de render: `BattleField` compara, en cada tick y solo mientras `status === 'InProgress'`, el conjunto de `instanceId`s del tick anterior contra el actual; cualquier `instanceId` que desaparece por esa vía (no por `reset()`) se registra como un "eco de muerte" efímero (última posición/equipo/tipo de gato conocidos) que anima su propia desaparición (escala y alpha decrecientes) durante una ventana corta antes de eliminarse del registro.

**Rationale**: `src/engine/simulation.ts` (línea `const units = ... .filter((unit) => unit.state !== 'Dead')`) ya filtra las unidades muertas en el mismo paso — es una función pura y determinista sin ningún concepto de "cuánto debe seguir viéndose una unidad muerta". Añadirle esa noción sería colar una preocupación de presentación (duración de una animación) dentro del motor de simulación, justo lo que la Constitución § VI prohíbe. Resolverlo enteramente en la capa de render es la única opción que no exige tocar `src/engine/` ni sus tests ya existentes (`simulation.test.ts`).

**Alternatives considered**: Mantener las unidades `Dead` un número fijo de ticks en `SimState.units` antes de filtrarlas, o añadir un campo `deathTimerRemaining` (rechazado — mezclaría una duración de animación, dato puramente de presentación, dentro del estado de simulación pura; también rompería la suposición ya testeada de `simulation.test.ts` de que una unidad muerta desaparece del array en el mismo paso en que llega a `hp <= 0`).

## Decisión 5: Diferenciación visual por archetype (US2) reutilizando la Decisión 1

**Decision**: La forma base de cada gato (proporciones del cuerpo, "peso" visual, acento de color sobre el color de equipo, velocidad del bob de idle) se deriva de `getVisualProfile()` (Decisión 1) — por ejemplo, mayor `hp`/`width` produce un cuerpo más grande y anguloso (gato tanque), mayor `speed` produce un cuerpo más compacto con un bob de movimiento más rápido (gato veloz), sin ninguna autoría de contenido nueva.

**Rationale**: Cumple FR-006/SC-005 sin ampliar el catálogo de contenido ni requerir arte — coherente con Constitución § IV y con la Nota de Alcance de `spec.md` (los 4 gatos ya definidos en `src/data/cats.ts` son el alcance de contenido de esta spec).

**Alternatives considered**: Ninguna adicional — ya evaluada en Decisión 1 (misma decisión de diseño, aplicada aquí a su segunda consecuencia).
