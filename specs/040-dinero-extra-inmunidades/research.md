# Research: Catálogo de Habilidades de Combate — Dinero Extra e Inmunidad a Habilidades

## Decisión 1: `immuneAbilities` como lista propia, separada de `immuneEffects`

**Decisión**: `Cat` y `BattleUnit` ganan `immuneAbilities?: ImmunizableAbilityKind[]`, con `type ImmunizableAbilityKind = 'MassiveDamage' | 'TraitKiller' | 'Knockback'` (subconjunto de `Ability['kind']`). `immuneEffects?: EffectType[]` (`specs/009`/`specs/015`) no cambia.

**Rationale**: `immuneEffects` protege contra efectos de estado transferidos on-hit (`Curse`/`Weaken`/`Freeze`/`Slow`), que `applyOnHitEffect` comprueba por `effect.type`. Las tres habilidades de esta spec son de otra naturaleza — rolls evaluados en el golpe del atacante (`specs/038`/`specs/039`) — y se resuelven en otro punto del código. Fusionar ambas listas en un tipo unión (`EffectType | Ability['kind']`) obligaría a ensanchar el tipo que hoy valida `applyOnHitEffect`, a filtrar por tipo en cada comprobación y a permitir inmunidades sin sentido (p. ej. a `Shield`). Una lista propia con un tipo restringido hace imposible declarar una inmunidad que el motor no sabe resolver, y deja `immuneEffects` intacto (FR-009). Es el mismo criterio con que `TraitResistance` (daño recibido) se modeló aparte de `TraitTargeting` (daño infligido) en `specs/015`.

**Alternativas consideradas**: reutilizar `immuneEffects` ampliando `EffectType` con los tres nombres: rechazado — `EffectType` también define qué puede aplicar `AppliesEffect` y cómo decae por tiempo; añadirle valores que no son efectos de estado contaminaría esa abstracción. Un `Ability` de tipo `Immunity`: rechazado — `abilities` pertenece a quien *ataca/declara* la habilidad y se recorre con `find` por `kind`; la inmunidad es una propiedad pasiva de *quien es golpeado*, igual que `immuneEffects`, y vivir en `abilities` la sometería al bloqueo por `Curse` que no le corresponde (FR-007).

## Decisión 2: La inmunidad se evalúa dentro de `applyHit`, y la habilidad ignorada no consume su tirada

**Decisión**: En `applyHit`, cada una de las tres habilidades ofensivas se busca así: si el defensor la lista en `immuneAbilities`, se trata como si el atacante no la declarara (`undefined`) para ese golpe; si no, se busca con `findActiveAbility`/`findMatchingTraitKiller` como hasta hoy. Un helper `isImmuneToAbility(defender, kind)` encapsula la comprobación.

**Rationale**: `applyHit` (`specs/039` Decisión 2) es el único punto por el que pasan los golpes de unidad contra unidad — secuencia `MultiHit`, objetivo primario y salpicadura —, así que la inmunidad queda aplicada por golpe y por objetivo (FR-006) sin código duplicado, y la salpicadura evalúa la de cada objetivo por separado sin trabajo extra. Tratar la habilidad como "no declarada" garantiza además el consumo condicional de `random` ya establecido (`specs/039` Decisión 3): una habilidad que no puede aplicarse no tira un dado que no se va a usar, lo que mantiene estable el orden de las tiradas de un test guionado y hace la regla fácil de explicar ("para ese golpe, esa habilidad no existe").

**Alternativas consideradas**: tirar el dado y descartar el resultado: rechazado — consume un `random()` sin efecto y desordena secuencias guionadas sin ningún beneficio. Evaluar la inmunidad en `resolveAbilityMultiplier`/`findMassiveDamage` en vez de en `applyHit`: rechazado — Golpe Letal también se resuelve en `resolveBaseDamage` (contra bases, que no tienen inmunidades), así que ponerla en el helper compartido forzaría a pasarle un defensor opcional.

## Decisión 3: El crédito de la derrota se fija en el golpe letal (`defeatBounty`)

**Decisión**: `BattleUnit` gana `defeatBounty?: number` (efímero). En `applyHit`, tras resolver Sobrevivir, si `defender.hp <= 0`, el atacante es del jugador, el defensor es enemigo y `findActiveAbility(attacker, 'ExtraMoney')` existe, se escribe `defender.defeatBounty = energyBonus`. `stepSimulation` suma después los `defeatBounty` de las unidades enemigas en `Dead` y los suma a `energy.current`.

**Rationale**: El motor hoy no registra quién derrota a quién; `hp` baja en copias de unidades que viajan por `resolveEngagement`/`resolveAreaEngagement` y vuelven a `byId`. Las alternativas implican o devolver información extra por todas esas firmas (cambio de tipos de retorno en funciones públicas con ~45 usos en tests) o buscar el atacante después por `instanceId`. Marcar el bono en el defensor en el instante del golpe letal evita ambos: la información viaja gratis en el objeto que ya se devuelve, y la comprobación de `Curse` del atacante se hace en el momento exacto del golpe — un enfoque que buscara al atacante al final del paso podría verlo ya maldecido por el contraataque simultáneo del enemigo derrotado (el intercambio es simultáneo, `resolveEngagement`) y negarle injustamente un bono que ganó antes de ser maldecido. Como las unidades `Dead` se filtran de `units` al terminar cada paso (invariante ya usada por `SummonOnDeath`, `specs/038`), el campo nunca sobrevive ni se persiste (Constitución § V); y como solo se escribe en un golpe letal de una unidad, el cañón especial (que baja `hp` directamente en `activateSpecialCannon`) nunca lo produce (FR-003).

**Alternativas consideradas**: `defeatedByInstanceId` + búsqueda del atacante en `stepSimulation`: rechazada por el problema de la maldición simultánea y por añadir un recorrido con búsqueda por `instanceId`. Un contador `killCount` por unidad del jugador: rechazado — haría falta además convertirlo en energía y evitar doble conteo entre pasos.

## Decisión 4: La energía se actualiza una sola vez por paso, con tope

**Decisión**: Al final de `stepSimulation`, antes de construir el estado siguiente, `energy` pasa a `{ ...energy, current: Math.min(energy.max, energy.current + bonusTotal) }` — con `bonusTotal` igual a 0 el resultado es idéntico al valor ya calculado por la regeneración.

**Rationale**: La regeneración por tiempo ya se calcula al inicio del paso y escribe `energy`; el bono se suma después, así que un enemigo derrotado en este paso financia ya el siguiente despliegue (spec.md Historia 1 Escenario 1: "en ese mismo paso"). El tope en `energy.max` es el mismo que ya aplica la regeneración — un bono por encima del máximo se pierde, sin reserva (spec.md Edge Cases). Una sola escritura por paso mantiene el motor determinista y trivial de probar.

**Alternativas consideradas**: aplicar el bono en el store (`useGameStore.tick`) después de `stepSimulation`: rechazado — dejaría fuera del motor una regla de combate y la haría imposible de probar sin el store (Constitución § VI).

## Decisión 5: Solo la energía del jugador, solo golpes de unidad

**Decisión**: El bono solo se marca cuando `attacker.team === 'Player'` y `defender.team === 'Enemy'`; una unidad enemiga con Dinero Extra no tiene efecto (FR-004), y las derrotas fuera de `applyHit` (cañón especial) no conceden nada (FR-003).

**Rationale**: La energía es un recurso del jugador (Constitución § I) — el lado enemigo no tiene energía propia en el motor (su cadencia es la oleada por tiempo). El cañón especial no es un golpe de unidad y ya queda fuera de Esquivar/Sobrevivir/Escudo (`specs/039` Decisión 7); mantenerlo fuera también de Dinero Extra es la misma regla.

**Alternativas consideradas**: dar el bono por cualquier derrota de cualquier equipo: rechazado — carecería de sentido para el enemigo y alteraría el equilibrio de cualquier etapa que use una unidad con la habilidad del lado enemigo.

## Decisión 6: Presentación — etiquetas compartidas y una fila por pantalla

**Decisión**: Se crea `src/screens/shared/abilityLabels.ts` con `describeImmunities(immuneAbilities)` (nombres en español: Golpe Letal, Killer, Retroceso). `UnitDetailPanel` añade el caso `ExtraMoney` a `describeAbility` y una fila "Inmune a: …" solo si la lista no está vacía; `EnemyGuideScreen` añade una línea con las inmunidades solo para los enemigos que las tienen.

**Rationale**: Las dos pantallas necesitan los mismos nombres; un módulo compartido evita que se desincronicen (el `switch` exhaustivo de `describeAbility`, `specs/039`, ya protege el lado de `Ability`, pero `immuneAbilities` es otro tipo). Mostrar la fila solo cuando hay inmunidades deja el resto de la UI exactamente igual (FR-009/SC-005).

**Alternativas consideradas**: mover también `describeAbility` al módulo compartido: rechazado por alcance — no hay un segundo consumidor hoy (Constitución § VII).

## Decisión 7: Datos semilla — jefe inmune, dos gatos de demostración

**Decisión**: `enemy-la-mascara` (jefe vinculado del Capítulo 1, `SAGA_ARCS`) declara `immuneAbilities: ['MassiveDamage', 'TraitKiller', 'Knockback']`. Se añaden `wallet-cat` (Gato Cobrador, `ExtraMoney` con `energyBonus: 5`) y `anchor-cat` (Gato Ancla, `immuneAbilities: ['Knockback']`) a `CATS`, sin modificar ningún gato existente.

**Rationale**: Dar inmunidad al jefe cierra explícitamente lo que `specs/038`/`specs/039` dejaron pendiente ("común en jefes") con un único cambio observable, el pretendido: contra La Máscara, las unidades que declaren Golpe Letal/Killer/Retroceso ya no los aplican. Hoy solo las declaran los gatos de demostración de `specs/038`/`specs/039` (que, al ser de rareza `Raro`, sí pueden salir de la Cápsula), así que ninguna unidad de producción ni ninguna batalla contra el resto de enemigos cambia (FR-008/FR-009). Los dos gatos nuevos son los datos reales contra los que validar la tubería completa catálogo → `deployUnit` → motor → panel, mismo criterio que las dos specs anteriores. Ambos son de rareza `Raro`, así que (como los de `specs/038`/`specs/039`) entran en el pool de la Cápsula — `GACHA_POOL` filtra `CATS` por rareza (`specs/024`).

**Alternativas consideradas**: dar inmunidad a todos los enemigos de categoría "jefe": no existe esa categoría en los datos (solo `SagaArc.bossCatId`); introducirla es una decisión de contenido aparte.
