# Research: Ajustes Post-Revisión — Combate, Mapa y Diseños

## Decisión 1 — Seguridad de invocar `resolveEngagement` varias veces sobre el mismo defensor en un tick

**Decision**: No modificar `src/engine/combat.ts`. La segunda pasada de `stepSimulation` genera engagements adicionales `{ attackerId: unidadBloqueada, targetIds: [mismoObjetivo] }` y los procesa con el mismo bucle `for (const { attackerId, targetIds } of engagements) { ... resolveEngagement(...) ... byId.set(...) }` ya existente.

**Rationale**: Se verificó línea por línea `resolveEngagement(a, b, deltaSeconds)`: cada llamada decrementa `attackCooldownRemaining` de AMBOS lados independientemente; un lado solo dispara (`applyDamageSequence`) si su propio cooldown llegó a 0 este tick, y tras disparar lo resetea a `attackIntervalSeconds` (no vuelve a 0 hasta el siguiente ciclo completo). Como el bucle principal de `simulation.ts` ya lee `byId.get(targetIds[0])` (el estado MÁS RECIENTE del defensor, actualizado por el engagement anterior) antes de cada llamada, una segunda llamada sobre el mismo defensor con un atacante distinto: (a) deja que el nuevo atacante dispare con su propio cooldown (independiente), (b) el defensor solo "contraataca" en la primera llamada donde su cooldown estaba listo — en la segunda ya está en `attackIntervalSeconds` completo, por lo que `attackCooldownRemaining - deltaSeconds` sigue siendo positivo y no dispara. `applyDamageSequence` ya corta en `defender.hp <= 0`, así que un defensor que muere a mitad de la cadena no puede terminar con HP negativo ni "revivir" para las llamadas siguientes (quedan sin efecto sobre él, `state === 'Dead'` bloquea que siga contraatacando).

**Alternatives considered**: Una función nueva `resolveGroupEngagement(attackers[], defender, deltaSeconds)` en `combat.ts` que sume el daño de todos los atacantes de una vez — descartada: reimplementaría exactamente la misma secuencia que ya produce encadenar `resolveEngagement`, con más superficie de código para el mismo resultado, y perdería la propiedad de que cada atacante dispara según su propio cooldown de forma independiente y ya testeada.

## Decisión 2 — Detección de "quién bloquea a quién" para la promoción

**Decision**: Reutilizar el MISMO criterio geométrico que ya usa el bloqueo de movimiento (`tentativeX` + `overlaps1D` contra unidades del mismo equipo con `state !== 'Moving'`), aplicado en una pasada adicional DESPUÉS de que `engagements`/`baseAttackers`/`freeMovers` ya estén poblados por la lógica actual, en un bucle de reintentos (fixed-point): en cada iteración, para cada unidad todavía en `freeMovers`, calcular si su avance tentativo colisionaría con un aliado que sea `attackerId` de algún engagement conocido (inicial o promovido en una iteración anterior); si sí, promoverla (nuevo engagement, mismo `targetIds[0]`) y sacarla de `freeMovers`. Repetir hasta una iteración sin promociones.

**Rationale**: Reutilizar el criterio de bloqueo ya existente (en vez de inventar uno nuevo basado en posición absoluta) garantiza que "estar bloqueado" signifique exactamente lo mismo para la decisión de refuerzo de fila que para la decisión de "no avanzar" — no hay dos nociones de adyacencia divergentes. El fixed-point (en vez de una sola pasada) es necesario para cadenas de 3+: en una sola pasada, la tercera unidad de la fila no encontraría a la segunda todavía en `engagements` (recién se habría promovido en esa misma pasada, dependiendo del orden de iteración de `alive`) — iterar hasta que no haya cambios lo resuelve sin depender del orden.

**Alternatives considered**: Ordenar `alive` espacialmente (por `x`, según equipo) antes de la pasada única — descartado: añade una ordenación por tick sin necesidad, y el criterio de bloqueo ya depende de `tentativeX`, que ya captura la posición; el fixed-point es más simple y ya usa infraestructura existente.

## Decisión 3 — Pestañas de mapa: canvas de altura dinámica vs. replantear `mapPosition`

**Decision**: `LevelSelectScreen.tsx` agrupa `LEVELS` por `Level.region` en pestañas (`useState` local, primera región por defecto); el contenedor de nodos de la pestaña activa recibe una altura en píxeles `Math.max(320, nodeCount * 70)` vía variable CSS inline, con `overflow-y: auto` en el `.stage-map` exterior — los mismos `mapPosition.y` (0-100%) de `specs/027` se reparten sobre ese lienzo más alto sin modificarlos.

**Rationale**: `specs/027` ya generó `mapPosition` con una fórmula de serpenteo pensada para un lienzo alto (research.md Decisión 3 de esa spec) — el problema reportado no es la distribución relativa de los nodos entre sí, es que el contenedor que los muestra fuerza esa distribución a cientos de píxeles de alto real cuando el `.stage-map` actual mide ~300px. Agrandar el contenedor (con scroll) resuelve el problema sin duplicar trabajo de autoría de contenido ya hecho.

**Alternatives considered**: Recalcular `mapPosition` para las 48 etapas asumiendo un lienzo corto con scroll horizontal en vez de vertical — descartado: el layout del juego es horizontal fijo (`specs/021` Fase 9), con poco margen de ancho adicional; vertical aprovecha mejor el espacio ya disponible por scroll en una pantalla móvil típica.

## Decisión 4 — Generalizar el lookup de diseño procedural en `UnitSprite.tsx`

**Decision**: Sustituir la resolución actual (`SEED_UNITS.find(...) ?? SEED_ENEMIES.find(...)` → objeto `SeedUnit` completo) por una resolución directa de `ProceduralDesign`: `SEED_UNITS.find(u => u.id === catId)?.proceduralDesign ?? SEED_ENEMIES.find(u => u.id === catId)?.proceduralDesign ?? IMPERIO_CAP1_DESIGNS[catId]`. `getOrCreateUnitTexture(renderer, catId, design, role)` ya solo necesita el `catId` (para la key de caché) y el `ProceduralDesign` — nunca necesitó el objeto `SeedUnit` completo.

**Rationale**: Minimiza el cambio de superficie en `UnitSprite.tsx` (una expresión, no una reestructuración) y deja `IMPERIO_CAP1_DESIGNS` como un simple `Record<string, ProceduralDesign>` sin necesitar imitar la forma completa de `SeedUnit` (que incluye `stats`/`targetType`/`traits`, irrelevantes aquí — esos datos ya viven en `CATS`).

**Alternatives considered**: Envolver `IMPERIO_CAP1_DESIGNS` como un arreglo de objetos con la misma forma que `SeedUnit` para reutilizar el `.find()` existente sin tocar la expresión de resolución — descartado: obligaría a rellenar campos (`stats`, `targetType`, `traits`) que ya están duplicados en `CATS`/`Level`, con riesgo de que diverjan.

## Decisión 5 — `distinctiveFeature`: ampliar el enum vs. reforzar solo forma/color

**Decision**: Ampliar `ProceduralDesign['distinctiveFeature']` de 5 a 10 valores, añadiendo `'horns' | 'wings' | 'shield' | 'spikes' | 'tail'`; y dejar que el rol `'ally'` también respete `design.distinctiveFeature` (hoy lo ignora y siempre dibuja orejas de gato).

**Rationale**: Con solo 3 formas base y 5 rasgos, 30 unidades ya empezarían a repetir combinaciones visualmente parecidas mucho antes de agotar la paleta de color (que es continua pero perceptualmente limitada a distinguir a simple vista). 5 rasgos nuevos, elegidos para mapear directamente a los arquetipos ya definidos en `specs/027` (tanque → `horns`, anti-Flotante/aéreo → `wings`, defensivo → `shield`, agresivo/área → `spikes`, rápido → `tail`), dan una asociación visual con el rol de la unidad, no solo variedad aleatoria. Sin este cambio, los 14 gatos jugables nuevos ni siquiera podrían usar un rasgo propio (el bug de `role === 'ally'` siempre dibuja orejas), reduciendo su variedad real a solo forma+color.

**Alternatives considered**: Mantener 5 rasgos y depender solo de más variación de color/tamaño — descartado explícitamente por el propio pedido del usuario ("los personajes no tienen diseños diferentes"), que ya señala que la variación de color/tamaño actual (el sistema genérico de `cyberUnitBody.ts`) no es suficiente. Un sistema de composición con múltiples rasgos simultáneos por unidad — descartado por YAGNI: un rasgo por unidad ya destraba la variedad pedida sin la complejidad de definir capas/z-order entre rasgos combinados.
