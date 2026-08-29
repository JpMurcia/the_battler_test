# Research: Catálogo de Habilidades de Combate — Golpe Letal, Killers, Escudo e Invocar

## Decisión 1: Modelar las cuatro capacidades como `Ability`, no como `EffectType`

**Decisión**: `MassiveDamage`, `TraitKiller`, `Shield` y `SummonOnDeath` se agregan como miembros nuevos del discriminated union `Ability` (`src/engine/types.ts`), no como valores nuevos de `EffectType`.

**Rationale**: `EffectType` (`Curse`/`Weaken`/`Freeze`/`Slow`) modela efectos que se **transfieren on-hit al defensor** y **decaen por tiempo** (`xRemainingSeconds` en `stepSimulation`, `specs/015`). Ninguna de las cuatro capacidades nuevas tiene esa forma: `MassiveDamage`/`TraitKiller` son un roll de probabilidad evaluado en el propio golpe del atacante (sin estado que sobreviva al tick), `Shield` es un contador que se consume por daño recibido (no por tiempo) y `SummonOnDeath` se dispara una vez, al morir, sin transferirse a nadie. Encajan exactamente en el molde ya usado por `TraitTargeting`/`Neutral`/`TraitResistance` — capacidades declaradas en `abilities?: Ability[]` que `combat.ts` consulta caso por caso.

**Alternativas consideradas**: añadir `EffectType` nuevos (`'MassiveDamage'`, `'TraitKiller'`) con un `AppliesEffect` de duración 0: rechazado — forzaría el pipeline de `applyOnHitEffect`/`resistantTo`/`immuneEffects` (diseñado para efectos de estado persistente) sobre un mecanismo que en realidad es un roll instantáneo sin estado, añadiendo complejidad sin ganar nada (viola Constitución § VII).

## Decisión 2: `SummonOnDeath` se resuelve en `simulation.ts`, no en `combat.ts`

**Decisión**: La detección de "unidad murió este tick con `SummonOnDeath`" y la construcción de la(s) unidad(es) nueva(s) vive en `stepSimulation` (`src/engine/simulation.ts`), justo antes del filtro `units = ...filter(u => u.state !== 'Dead')` ya existente (línea ~335).

**Rationale**: `src/engine/combat.ts` hoy no importa nada de `src/data/` — solo opera sobre los `BattleUnit` que recibe por parámetro. Construir una unidad nueva a partir de un `catId` requiere `CATS.find(...)`, que ya es una dependencia de `simulation.ts` (`spawnEnemyUnit`) pero nunca de `combat.ts`. Resolver `SummonOnDeath` en `combat.ts` rompería ese límite arquitectónico sin necesidad — `simulation.ts` ya es exactamente el lugar donde "aparecen unidades nuevas en `units[]`" para el resto del proyecto (spawn de oleada, refuerzos por umbral de vida de base, `specs/012`).

**Alternativas consideradas**: pasar `CATS`/una función factory como parámetro a `combat.ts`: rechazado — introduce acoplamiento de datos en una capa que hoy es 100% agnóstica de contenido, solo para un caso de uso; el punto de detección de muerte ya vive de forma natural en `simulation.ts` (única fuente de verdad de qué unidades siguen vivas al final del tick).

## Decisión 3: Generalizar `spawnEnemyUnit` a `spawnUnitFromCat(catId, team, x, ...)`

**Decisión**: La función privada `spawnEnemyUnit(catId, enemyStrengthMultiplier, laneLength, unitSpeedMultiplier)` se generaliza a `spawnUnitFromCat(catId, team, x, enemyStrengthMultiplier, unitSpeedMultiplier)`, donde el spawn de oleada existente pasa `team: 'Enemy'` y `x: laneLength - cat.width` (mismo resultado que hoy) y `SummonOnDeath` pasa el `team`/`x` de la unidad que acaba de morir.

**Rationale**: Evita duplicar el mapeo completo de ~20 campos de `Cat` a `BattleUnit` (incluidos los cuatro nuevos de esta spec) en un segundo lugar. `enemyStrengthMultiplier` solo se aplica cuando `team === 'Enemy'` (mismo criterio que hoy — el multiplicador de arco nunca escaló unidades del jugador), así que una invocación del lado del jugador queda con sus stats base de `Cat`, sin cambiar el comportamiento ya validado del spawn de oleada.

**Alternativas consideradas**: una segunda función `spawnSummonedUnit` con su propio mapeo de campos: rechazada por duplicar lógica que ya existe y arriesgar que un campo nuevo se agregue a una función y se olvide en la otra (ya pasó implícitamente con cada spec anterior que añadió un campo a `BattleUnit` — `hitsPerSequence`/`criticalChance`/`resistantTo` solo se mapean hoy en dos sitios, `deployUnit` y `spawnEnemyUnit`; una generalización reduce eso a uno para el lado enemigo/invocado).

## Decisión 4: `shieldRemainingHp` como escalar único, sin pila de escudos

**Decisión**: `BattleUnit.shieldRemainingHp?: number`, un único valor — no una lista de escudos activos ni un `Record<string, number>` por fuente.

**Rationale**: Ninguna unidad de este proyecto declara más de una fuente de escudo hoy, y el juego de referencia tampoco combina escudos de distinto origen sobre la misma unidad de forma relevante para el MVP. Un escalar único es el mismo patrón ya validado por `weakenMagnitude`/`slowMagnitude` (Constitución § VII) — si una futura spec necesitara apilar escudos de fuentes distintas, es una extensión aditiva sobre este campo, no algo que deba resolverse ahora.

**Alternativas consideradas**: `shields: { source: string; remainingHp: number }[]`: rechazada por sobre-ingeniería sin caso de uso actual (YAGNI, Constitución § VII).

## Decisión 5: Reutilizar el `random: () => number` ya inyectado, sin nueva fuente de aleatoriedad

**Decisión**: `MassiveDamage.chance` y `TraitKiller.chance` se resuelven con el mismo parámetro `random: () => number = Math.random` que `resolveEngagement`/`resolveAreaEngagement`/`resolveBaseDamage` ya reciben desde `specs/016` (usado hoy para `criticalChance`).

**Rationale**: Cero superficie nueva — los tests ya inyectan un `random` determinista para validar `criticalChance` (`combat.test.ts`); el mismo mecanismo sirve para los dos rolls nuevos sin ningún cambio de firma pública adicional.

**Alternativas consideradas**: un generador de aleatoriedad dedicado por capacidad (ej. seeded RNG por `instanceId`): rechazado — no hay ningún requisito de reproducibilidad entre partidas distintas, solo de testabilidad determinista, que el parámetro ya inyectado cubre por completo.
