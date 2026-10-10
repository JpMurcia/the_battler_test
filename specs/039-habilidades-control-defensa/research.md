# Research: Catálogo de Habilidades de Combate — Fortalecer, Esquivar, Sobrevivir y Retroceso

## Decisión 1: Modelar las cuatro habilidades como `Ability`, sin campos nuevos en `BattleUnit`

**Decisión**: `Strengthen`, `Dodge`, `Survive` y `Knockback` se agregan como miembros del discriminated union `Ability` (`src/engine/types.ts`). No se añade ningún campo a `BattleUnit` ni ningún valor a `EffectType`.

**Rationale**: Mismo criterio que `specs/038` Decisión 1. `EffectType` modela efectos que se transfieren on-hit y decaen por tiempo — ninguna de estas cuatro lo hace. Y a diferencia de `Shield` (`specs/038`, que necesita un contador mutable `shieldRemainingHp`), aquí no hay estado por-unidad que se consuma: Fortalecer es una función pura de `hp`/`maxHp`; Esquivar, Sobrevivir y Retroceso son rolls instantáneos sin memoria; y el resultado del retroceso es el `x` ya existente de la unidad. Que no haya campo nuevo implica además que `deployUnit` (`useGameStore.ts`) y `spawnUnitFromCat` (`simulation.ts`) no cambian — una superficie de error menos que en `specs/038`.

**Alternativas consideradas**: un campo `knockedBackThisTick`/`dodgedLastHit` para observabilidad (UI/animación): rechazado por YAGNI — no hay ningún consumidor y la animación de combate lee posición, no eventos (Constitución § VII).

## Decisión 2: Unificar la tubería de un golpe individual en `applyHit`

**Decisión**: Se extrae el cuerpo del bucle de `applyDamageSequence` (daño base → `MassiveDamage` → `Critical` → `TraitKiller`/escudo/`hp` → efectos on-hit) a una función `applyHit(attacker, defender, random, laneLength?)` que muta al defensor. `applyDamageSequence` queda como el bucle de `MultiHit` (`hits` golpes, corte si el defensor muere) que llama a `applyHit`; la salpicadura de `resolveAreaEngagement` copia cada objetivo y llama a `applyHit` sobre la copia en vez de mantener su propio cálculo paralelo.

**Rationale**: Hoy el mismo orden de resolución está escrito dos veces (`applyDamageSequence` y el `map` de salpicadura) y `specs/038` tuvo que replicar a mano cada regla nueva en ambos sitios (tareas T006/T010/T014 duplicadas). Agregar Esquivar, Sobrevivir y Retroceso a ambos sería la tercera ronda de duplicación, con el riesgo concreto de que una regla se olvide en uno (p. ej. salpicadura sin Esquivar). Con `applyHit`, FR-006 (el orden) vive en un único lugar. Es seguro porque la equivalencia es exacta: la salpicadura solo ocurre con `attackType` `'Area'`/`'LongRange'`, que son mutuamente excluyentes con `'MultiHit'`/`'Critical'` (`specs/016`), así que el único golpe de la secuencia nunca activa `Critical` — idéntico al cálculo actual de la salpicadura. Los tests ya existentes sobre ambos caminos (`resolveAreaEngagement`: daño, cooldown, contraataque, muerte, multiplicador por rasgo, `MassiveDamage`/`TraitKiller`/`Shield` en salpicadura) actúan como red de seguridad del refactor.

**Alternativas consideradas**: replicar de nuevo cada regla en ambos sitios (como `specs/038`): rechazado — triplica la duplicación y es la fuente más probable de regresiones silenciosas. Hacer que la salpicadura llame a `applyDamageSequence`: equivalente en resultado, pero oscurece la semántica ("la salpicadura es exactamente un golpe", nunca una secuencia) — se prefiere `applyHit`, que lo hace explícito en el nombre.

## Decisión 3: Orden de resolución por golpe y consumo condicional de `random`

**Decisión**: Orden fijo por golpe (FR-006):

1. **Esquivar** del defensor — si acierta, el golpe termina aquí sin tocar nada y sin consumir ningún roll posterior.
2. Daño base = `effectiveDamage(atacante)` (daño × Debilitar × Fortalecer) × `TraitTargeting`/`Neutral` × `TraitResistance`.
3. `MassiveDamage` (roll) → `Critical` (roll) → `TraitKiller` (roll, si coincide el rasgo).
4. Si el Killer acierta: `hp = 0`. Si no: se descuenta del escudo y el excedente de `hp`.
5. **Sobrevivir** del defensor — solo si `hp <= 0` tras el paso anterior (incluida una eliminación de Killer): con probabilidad `chance`, `hp = 1`.
6. **Retroceso** del atacante — solo si `hp > 0` tras el paso anterior: con probabilidad `chance`, desplazamiento de `x`.
7. Efectos on-hit (`applyOnHitEffect`, sin cambios).

Cada `random()` se invoca solo cuando la habilidad aplica (el defensor declara `Dodge` y no está bajo `Curse`; el defensor declara `Survive` y el golpe fue letal; el atacante declara `Knockback` y el objetivo sigue vivo).

**Rationale**: Esquivar es lo más externo porque anula "el golpe entero" (FR-002) — cualquier otro roll consumido antes sería trabajo inútil y haría el orden de `random` dependiente de una habilidad que ya no importa. Sobrevivir va después de Killer/escudo porque necesita el resultado final para saber si fue letal, y debe poder contrarrestar al Killer (FR-003). Retroceso va después de Sobrevivir porque requiere que el objetivo siga vivo — un objetivo que sobrevive con 1 de vida sí puede ser empujado. El consumo condicional de `random` garantiza FR-009: ninguna unidad sin las habilidades nuevas consume un `random()` extra, así que las secuencias guionadas de los tests de `specs/016`/`specs/038` (p. ej. `call++ === 1`) no cambian.

**Alternativas consideradas**: Sobrevivir antes de Killer (no podría contrarrestarlo, y la regla "cualquier resultado letal" se vuelve más compleja de explicar): rechazado. Que Retroceso se evalúe aunque el objetivo muera (para efectos de observabilidad): rechazado — un objetivo muerto se descarta igual, el desplazamiento no tendría efecto observable.

## Decisión 4: Fortalecer dentro de `effectiveDamage`, evaluado en vivo

**Decisión**: `effectiveDamage(unit)` (que hoy resuelve solo Debilitar) multiplica además por el `damageMultiplier` de `Strengthen` cuando `unit.hp <= unit.maxHp * hpThresholdFraction` y la unidad no está bajo `Curse`. Se evalúa contra el `hp` del atacante al momento exacto de atacar, sin snapshot de inicio de tick.

**Rationale**: `effectiveDamage` ya es el único punto por el que pasa el daño base de unidad-vs-unidad, salpicadura y unidad-vs-base, así que cubre los tres sin código duplicado. Evaluar en vivo es consistente con cómo el motor ya trata el orden dentro de un paso: un Debilitar o Congelar aplicado por el primer atacante surte efecto sobre el defensor antes de que éste ataque en el mismo paso (el intercambio es simultáneo solo en el sentido de que ambos pueden morir). No es una asimetría nueva.

La salpicadura de Área evalúa al atacante con su estado previo al intercambio con el objetivo primario (exactamente como ya hace hoy con Maldición/Debilitar, para no cambiar el comportamiento existente — FR-009): un umbral de Fortalecer cruzado en ese mismo paso por el contraataque del objetivo primario afecta a la salpicadura recién en el paso siguiente.

**Alternativas consideradas**: snapshot de `hp` al inicio del paso para que ambos combatientes usen la vida "previa al intercambio": rechazado — habría que calcular los dos multiplicadores antes de aplicar cualquier golpe, rompiendo la estructura actual de `resolveEngagement` para una asimetría de baja visibilidad (un paso de simulación = décimas de segundo). Un umbral estricto (`<` en vez de `<=`): rechazado — el inclusivo permite expresar "a la mitad de vida exacta" sin depender del redondeo de un decimal (spec.md Historia 1 Escenario 2).

## Decisión 5: Retroceso se aplica en `applyHit` con `laneLength` opcional

**Decisión**: El desplazamiento ocurre dentro de `applyHit`, mutando `defender.x`:

- Jugador: `x = max(min(x, 0), x - distance)` — retrocede hacia menor `x`, sin pasar de `0`; una unidad ya en `x <= 0` no se mueve.
- Enemigo: `x = min(max(x, maxX), x + distance)` con `maxX = laneLength - width` — retrocede hacia mayor `x`, sin pasar del borde de aparición; si `laneLength` no se proporciona (tests unitarios de `combat.ts`), no hay tope superior.

`resolveEngagement` y `resolveAreaEngagement` ganan un parámetro final opcional `laneLength?: number` que reenvían a `applyHit`; `stepSimulation` pasa `state.laneLength`.

**Rationale**: El borde del jugador (`0`, el origen de despliegue — `deployUnit` crea unidades en `x: 0`) es una constante del juego, pero el del enemigo depende de `Level.laneLength` (`specs/013`) — por eso no puede ser una constante en `combat.ts` (ni importarse de `simulation.ts`, que ya importa `combat.ts`: ciclo de módulos). Un parámetro opcional final mantiene todas las firmas actuales válidas (los 45 usos de `resolveEngagement(...)` en `combat.test.ts` no cambian). Las fórmulas con `min`/`max` anidados garantizan la propiedad de FR-005 "una unidad ya en o más allá del borde no se desplaza", incluso para casos legítimos fuera del rango "normal" (un enemigo que ya cruzó `x < 0` para atacar la base del jugador, o un jugador con `x > laneLength - width` atacando la base enemiga: ambos retroceden hacia su propia base sin cortarse contra el borde opuesto).

**Alternativas consideradas**: (a) un campo efímero `pendingKnockback` en `BattleUnit` que `stepSimulation` aplica y limpia al final del tick: rechazado — añade estado y un segundo punto de aplicación solo para evitar un parámetro opcional. (b) importar `LANE_LENGTH` en `combat.ts`: rechazado — ignora `Level.laneLength` (niveles con carril distinto retrocederían contra el borde equivocado) y crea un ciclo de módulos.

## Decisión 6: `Curse` suspende las cuatro habilidades vía un helper genérico

**Decisión**: `findMassiveDamage` (`specs/038`) se generaliza a `findActiveAbility(unit, kind)`: devuelve la primera `Ability` del `kind` pedido, o `undefined` si la unidad está bajo `Curse` o no la declara. `MassiveDamage`, `Dodge`, `Survive` y `Knockback` lo usan; `Strengthen` aplica el mismo chequeo de `Curse` dentro de su propia función por necesitar el umbral. `TraitKiller` conserva su helper específico (necesita además el matching de rasgo del defensor).

**Rationale**: `specs/009` FR-009 define `Curse` como "la unidad no aplica ninguna habilidad"; las dos habilidades defensivas reactivas (Esquivar/Sobrevivir) son habilidades que "se aplican" en combate igual que Killer/Golpe Letal — dejarlas activas bajo `Curse` volvería a `Curse` ineficaz contra justamente las unidades que más lo necesitan. `Shield` (pasivo, sin roll) y `TraitResistance` (multiplicador de datos) ya fueron decididos como inmunes a `Curse` en `specs/015`/`specs/038` y no se tocan (FR-008 lo deja explícito). Un helper genérico evita cinco copias del chequeo `curseRemainingSeconds > 0`.

**Alternativas consideradas**: dejar Esquivar/Sobrevivir sin bloqueo por `Curse` (por analogía con `Shield`): rechazado — `Shield` no tiene roll y es un contador de datos; Esquivar/Sobrevivir sí son habilidades activas con probabilidad.

## Decisión 7: Fuera de alcance y consistencia con el cañón especial

**Decisión**: El cañón especial de la base (`activateSpecialCannon`, `useGameStore.ts`) aplica su daño directamente a `hp` — no pasa por `applyHit`, así que no activa Esquivar ni Sobrevivir ni el escudo de `specs/038`. La inmunidad de jefes a las habilidades ofensivas (Golpe Letal/Killer/Retroceso), la duración de evasión de Esquivar, el retroceso estándar por umbrales de vida y las cabezas de cañón con retroceso (`specs/035` las dejó pendientes) quedan fuera de esta spec.

**Rationale**: El cañón no es un "golpe de unidad" en el modelo del motor (no tiene atacante `BattleUnit` ni pasa por `combat.ts`); convertirlo en uno es una decisión de diseño que pertenece a la spec de las cabezas de cañón, que podrá además reutilizar el desplazamiento de `applyHit` para su efecto secundario. Mantener el alcance acotado a cuatro habilidades es el mismo criterio de priorización parcial de `specs/015`/`specs/038` (Constitución § VII).

**Alternativas consideradas**: incluir inmunidades ahora: rechazado — requiere decidir un modelo de datos nuevo (`immuneAbilities`) y datos de jefes, trabajo cohesivo propio de la spec siguiente.

## Decisión 8: Datos semilla — un gato de demostración por habilidad, sin modificar los existentes

**Decisión**: Se añaden cuatro gatos nuevos a `CATS` (`strengthen-cat`, `dodge-cat`, `survivor-cat`, `knockback-cat`), igual que `specs/038` hizo con sus cinco — sin tocar ninguno de los gatos previos. Siguen sin spriteKey propio (fallback `Graphics`, `specs/021` FR-011). Los cuatro son de rareza `Raro`, y `GACHA_POOL` (`src/data/gacha.ts`) filtra `CATS` por rareza, así que cualquier gato nuevo de rareza `Raro` entra solo en el pool de la Cápsula (`specs/024`): salen de la Cápsula junto a los `Raro` ya existentes — un efecto colateral de añadirlos al catálogo, igual que ya ocurre con los de `specs/038`. Para validarlos sin depender del azar se inyecta su posesión en `ownedCats` (tests, o IndexedDB desde las devtools para el recorrido manual).

**Rationale**: Modificar un gato existente cambiaría su comportamiento observable, contradiciendo FR-009; añadir uno nuevo por habilidad es la forma más barata de tener datos reales contra los que validar la tubería completa (catálogo → `deployUnit` → motor → `UnitDetailPanel`). Si esos gatos deben compartir el pool `Raro` con los originales (hoy 6 de 16 entradas son originales), moverse a una rareza fuera de gacha o repartirse como recompensas es una decisión de contenido/balance separada, anotada como pendiente en el README.

**Alternativas consideradas**: darles una rareza fuera de gacha (`Normal`/`Especial`/`Colaboración`) para no diluir el pool `Raro`: no se hizo porque `specs/038` ya fijó `Raro` para sus gatos de demostración y cambiar la rareza de un gato es una decisión de balance que no se tomó en esta spec; queda anotado como pendiente en el README.
