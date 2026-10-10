# Research: Cabezas de Cañón (Ototo Corps)

## Decisión 1: Tercera entrada de `OTOTO_BUILDINGS`, mismo flujo de construcción

**Decisión**: `OtotoBuildingId` pasa a `'foundation' | 'style' | 'cannonHead'`, `OTOTO_BUILDINGS` gana una entrada "Cabeza de Cañón" (costo y duración provisionales), y la construcción reutiliza `OtotoConstruction`, `startOtotoConstruction`/`claimOtotoConstruction` y la fila `ototoCorps` tal cual.

**Rationale**: Es exactamente el mismo contrato que Base y Estilo: pagar materiales, esperar un tiempo por timestamp persistido, reclamar y dejar una elección activa. Las acciones de la store ya son genéricas sobre `building` (buscan su `definition` en `OTOTO_BUILDINGS` y escriben `buildings[construction.building] = choice`), así que solo cambian los tipos de unión y no hay lógica de construcción nueva. Como la fila `ototoCorps` es un objeto con `buildings` sin esquema indexado, una clave `cannonHead` más no necesita nueva versión de Dexie.

**Alternativas consideradas**: una tabla/acción aparte para la cabeza: rechazada — duplicaría el flujo de construcción por timestamp ya validado en `specs/034`/`specs/035` sin ninguna ventaja, y rompería la regla de "una sola construcción en curso a la vez" (FR-001).

## Decisión 2: El efecto del cañón es una función pura del motor

**Decisión**: Se añade a `src/engine/types.ts` el tipo `CannonHeadSpec` (`{ kind: 'Knockback'; distance: number } | { kind: 'Effect'; effect: AppliesEffect }`) y a `src/engine/combat.ts` la función exportada `applyCannonHead(unit, head, laneLength): BattleUnit`, que devuelve una copia de la unidad con el efecto aplicado. El catálogo (`src/data/ototoCorps.ts`) traduce la elección persistida a un `CannonHeadSpec` con `getCannonHeadSpec`, y `useGameStore.activateSpecialCannon` lo pasa a la función para cada enemigo alcanzado que sigue vivo.

**Rationale**: Hoy la lógica del cañón (filtrar por rango, restar daño, descartar muertos) vive inline en la store, fuera de la zona testeable del motor — la Constitución § VI pide que las reglas de combate vivan en funciones puras de `src/engine/`. Poner el efecto nuevo en una función pura mantiene esa separación sin tener que mover el resto del cañón (cambio mayor y sin necesidad), y la hace probar sin Zustand. El tipo `CannonHeadSpec` vive en el motor (que no puede importar `src/data/`), y la traducción desde el dato del catálogo la hace la capa de datos/store.

**Alternativas consideradas**: mover todo el disparo (`resolveCannonBlast`) al motor: rechazado por alcance — reescribiría código estable de `specs/012` sin necesidad para esta feature (Constitución § VII). Aplicar el efecto inline en la store: rechazado — duplicaría las reglas de efectos y desplazamiento en una capa que no es testeable sin el store.

## Decisión 3: Extraer `applyEffectToDefender` de `applyOnHitEffect`

**Decisión**: `applyOnHitEffect(attacker, defender)` hoy lee `attacker.appliesEffect` y aplica el efecto con las reglas de inmunidad (`immuneEffects`), resistencia (`resistantTo`) y refresco. Se extrae el cuerpo posterior a leer el efecto a `applyEffectToDefender(effect: AppliesEffect, defender)`, y `applyOnHitEffect` pasa a ser `if (attacker.appliesEffect) applyEffectToDefender(attacker.appliesEffect, defender)`. `applyCannonHead` llama a la misma función.

**Rationale**: FR-005 pide que los debuffs del cañón se comporten exactamente igual que los on-hit — misma inmunidad total, misma reducción de duración por resistencia, mismo refresco sin acumular. La forma de garantizar la equivalencia sin duplicar ~20 líneas (y evitar que una futura regla nueva de efectos se aplique a un camino y se olvide en el otro) es compartir la función. Es un refactor sin cambio de comportamiento: el cuerpo se mueve tal cual, y los tests de `specs/015` (inmunidad, resistencia, refresco) lo cubren.

**Alternativas consideradas**: construir un `BattleUnit` "atacante" ficticio con `appliesEffect` solo para reutilizar `applyOnHitEffect` sin tocarlo: rechazado — es indirecto y frágil (una unidad falsa con campos obligatorios inventados) para ahorrar un refactor trivial.

## Decisión 4: Retroceso del cañón reutiliza `knockBack` y respeta la inmunidad de `specs/040`

**Decisión**: `applyCannonHead` con `kind: 'Knockback'` llama a la misma `knockBack(unit, distance, laneLength)` de `specs/039` salvo que el enemigo sea inmune (`immuneAbilities` incluye `'Knockback'`, `specs/040`). La distancia (provisional, mayor que la del Retroceso de una unidad) es un dato del catálogo.

**Rationale**: Es el motivo por el que esta spec se hace ahora: el desplazamiento con tope de carril y la inmunidad de jefes ya existen. Que un jefe inmune a Retroceso no sea empujado por el cañón es coherente con que no lo sea por una unidad, y sin ello la inmunidad de `specs/040` sería una puerta trasera.

**Alternativas consideradas**: que el cañón ignore la inmunidad por ser "un arma de la base": rechazado — contradice la intención de la inmunidad ("el jefe no queda fuera de combate por un empuje") y obligaría al jugador a descubrirlo por ensayo.

## Decisión 5: El cañón sigue fuera de `applyHit`

**Decisión**: El disparo no pasa por la tubería de un golpe de unidad: no se tiran Esquivar/Sobrevivir ni se consume el escudo, y no concede Dinero Extra. Solo se aplica el efecto secundario a los enemigos que sobreviven al daño directo.

**Rationale**: Es la decisión de `specs/039` Decisión 7, que esta spec confirma en vez de reabrir: el cañón no tiene atacante `BattleUnit`. Cambiarlo alteraría el equilibrio de todo el cañón (p. ej. un enemigo con Esquivar dejaría de recibir el daño del cañón) y excede el alcance de añadir un efecto secundario.

**Alternativas consideradas**: modelar el cañón como un atacante virtual que pasa por `applyHit`: rechazado — cambia el comportamiento ya validado de cada disparo (FR-006/FR-007 exigen daño idéntico).

## Decisión 6: La elección se lee de `useMetaStore` al disparar

**Decisión**: `activateSpecialCannon` consulta `useMetaStore.getState().ototoBuildings.cannonHead` en el momento de disparar, igual que `deployUnit` consulta `foundation`/`style` en el momento de desplegar; no se copia al estado efímero de la partida.

**Rationale**: Es el patrón ya establecido por `specs/035` (research.md Decisión 3 de aquella spec) y mantiene `useGameStore` sin estado persistente propio (Constitución § V). Una construcción reclamada a mitad de partida (imposible hoy, el panel no es accesible en batalla) afectaría igualmente al siguiente disparo.

**Alternativas consideradas**: copiar la elección a `useGameStore.specialCannon` en `startLevel`: rechazado — añade estado duplicado que habría que mantener sincronizado.

## Decisión 7: Elecciones y valores del catálogo

**Decisión**: `CANNON_HEAD_OPTIONS = ['Knockback', 'Weaken', 'Freeze', 'Slow', 'Curse']` con etiquetas en español para la UI (`Retroceso`, `Debilitar`, `Congelar`, `Ralentizar`, `Maldecir`). Valores provisionales: construcción 40 materiales / 15 minutos (igual que Base y Estilo); Retroceso del cañón 40 unidades; Debilitar 5 s con magnitud 0.5; Congelar 3 s; Ralentizar 5 s con magnitud 0.5; Maldecir 5 s. `startOtotoConstruction` rechaza (devuelve `false`) una elección de `cannonHead` fuera de `CANNON_HEAD_OPTIONS`.

**Rationale**: Las cuatro elecciones de estado son exactamente los `EffectType` que ya existen, y Retroceso es la habilidad que `specs/039` añadió — nada nuevo que modelar. Los valores siguen el estatus "provisionales, no balanceados" de `specs/035` (Decisión 4 de aquella spec); la elección de Retroceso, 40, es mayor que el 30 del gato de demostración porque el cañón es un recurso de carga lenta. Validar solo la elección nueva evita persistir un valor que el motor no sabría traducir a un `CannonHeadSpec` sin tocar el comportamiento de las construcciones existentes.

**Alternativas consideradas**: validar también Base/Estilo: rechazado — fuera de alcance y cambiaría `specs/035` (FR-009).
