# Research: Contenido — Capítulo 1 de Imperio de los Gatos

## Decisión 1 — Fórmula de generación de los 35 niveles por plantilla

**Decision**: Para cada índice de etapa `N` (1-48) que no sea uno de los 13 hitos hechos a mano, se calcula:

- `difficulty = 1 + floor((N-1) / 4)` — no decreciente, rango 1-12 (coincide con la escala de estrellas ★1-★12 que el manual documenta para capítulos principales, §6.3, aunque esta spec no la expone visualmente — es solo un rango cómodo y ya coherente con el manual).
- `energyCost = 6 + floor(N / 3)`
- `currencyReward = 90 + N * 8`
- `enemyBaseHp = 700 + N * 60`
- `playerBaseHp = 1000` (constante, igual que `level-1`/`level-2`)
- `treasureId = 'tesoro-imperio-cap1-etapa-' + N`
- `mapPosition`: ver Decisión 3.
- `enemyWave`: 3 entradas deterministas tomadas del "roster disponible" en la etapa `N` (ver Decisión 2), en posiciones `spawnAtSeconds: 5, 16, 30`.

**Rationale**: Sin esta fórmula, autorar 35 niveles a mano habría multiplicado el trabajo de esta spec sin beneficio de diseño — el propio manual confirma (§6.3/§8.3) que el juego real construye la dificultad del Capítulo 1 reutilizando el mismo puñado de enemigos con progresión suave, no con contenido nuevo etapa a etapa. Una función pura y determinista (sin `Math.random`) mantiene el contenido reproducible y fácil de testear (mismos valores en cada `import`).

**Alternatives considered**: Generar `enemyWave` con aleatoriedad semillada por `N` — descartado porque introduce una dependencia nueva (generador pseudoaleatorio) para un beneficio nulo: el patrón determinista ya varía por etapa al variar el roster disponible y el `N` usado en el índice de selección.

## Decisión 2 — Roster de 15 enemigos + jefe, agrupado por "tier" de aparición

**Decision**: Los 16 `Cat` de enemigo (15 + `enemy-la-mascara`) se agrupan en 5 tiers acumulativos según su `hp` (menor a mayor), reflejando en qué bloque de etapas se vuelven parte del roster disponible para la fórmula de la Decisión 1:

| Tier | Etapas donde ya está disponible | Enemigos (equivalencia del manual §6.6) |
|---|---|---|
| A | 1-8 | Merodeador (Doge, HP90), Escudero (Squire Rel, HP80), Triturador (Croco, HP70), Rondador (Snache, HP100) |
| B | 9-16 | + Turba (Those Guys, HP200), Planeador (Baa Baa, HP500, Flotante), Saltarín Alado (B.B.Bunny, HP500, Flotante) |
| C | 17-24 | + Behemot Gris (Hippoe, HP1000), Carmesí (Gory, HP1000, Rojo), Emperador Volador (Jackie Peng, HP1300, Flotante) |
| D | 25-32 | + Foca Blindada (Sir Seal, HP2500), Boxeador (Kang Roo, HP4000), Embestida (Le'boin, HP4000) |
| E | 33-47 | + Instructor Feroz (Teacher Bear, HP3000/dmg1000, área), Unicornio de Guerra (One Horn, HP15000) |
| Jefe | 48 | La Máscara (The Face, HP99999) — solo en el nivel del jefe, nunca en la fórmula de plantilla |

Para la etapa `N`, el "roster disponible" de la Decisión 1 es la unión de todos los tiers cuyo rango de etapas ya comenzó (`N >= inicio del tier`).

**Rationale**: Reproduce fielmente el ritmo de introducción de enemigos del manual (§8.3: "~19-21 tipos distintos" a lo largo de todo el capítulo, introducidos progresivamente, nunca todos desde la etapa 1) sin necesitar coordinar manualmente cuándo aparece cada uno — el corte por HP creciente ya ordena naturalmente de "más fácil/temprano" a "más difícil/tardío".

**Alternatives considered**: Un roster plano sin tiers (los 15 disponibles desde la etapa 1) — descartado porque contradice directamente al manual, que documenta una introducción progresiva; además haría que la etapa 1 pudiera generar (por la fórmula determinista) un enemigo de HP 15.000, rompiendo la curva de dificultad esperada para un tutorial.

## Decisión 3 — `mapPosition` por fórmula de serpenteo

**Decision**: 8 columnas × 6 filas. Para la etapa `N` (índice 1-48): `row = floor((N-1) / 8)`, `col = row par ? (N-1) % 8 : 7 - ((N-1) % 8)` (serpenteo, alternando dirección por fila, igual que un mapa de mundo clásico); `x = 8 + col * 11.7`, `y = 90 - row * 15.5`. Produce coordenadas dentro de 0-100 en ambos ejes sin solapar dos nodos consecutivos (FR-012).

**Rationale**: `Level.mapPosition` es obligatorio (`specs/023` FR-001) y debe evitar solapamiento — una fórmula de serpenteo es el patrón visual que el propio manual describe para mapas de nivel de estilo similar y ya es coherente con el orden secuencial de desbloqueo (`LEVELS` en orden de arreglo, `specs/023` FR-002), sin necesitar tipear 96 números a mano.

**Alternatives considered**: Coordenadas manuales para las 48 etapas — descartado por volumen de trabajo sin beneficio de diseño (ya acordado con el usuario como "plantilla" en brainstorming); una espiral en vez de serpenteo — descartado por ser visualmente más difícil de seguir con líneas conectoras rectas entre 48 nodos.

## Decisión 4 — Ningún `spriteKey` en el contenido nuevo

**Decision**: Los 30 `Cat` nuevos (14 jugables + 16 enemigo) no declaran `spriteKey`.

**Rationale**: `UnitSprite.tsx` ya cae a un `Graphics` procedural derivado de stats (`getVisualProfile`) cuando `spriteKey` está ausente (`specs/021` FR-011) — es una animación real de idle/ataque, no un sprite estático, así que satisface Constitución § III sin necesitar autoría de arte ni extender `SPRITE_MANIFEST`. Añadir `spriteKey` a 30 unidades nuevas requeriría además 30 entradas nuevas de manifiesto de sprites, un tipo de trabajo (arte/asset pipeline) fuera del alcance de "autoría de contenido de diseño" que pidió el usuario.

**Alternatives considered**: Asignar `spriteKey` reutilizando los 12 ya existentes (`hero_1`-`hero_12`) de forma repetida entre las 30 unidades nuevas — descartado porque produciría colisiones visuales confusas (dos gatos con roles distintos compartiendo sprite) sin ningún beneficio sobre el fallback procedural, que ya varía por stats.

## Decisión 5 — Fuente de los `hp`/`damage` de los 16 enemigos

**Decision**: Se reutilizan literalmente los valores de HP/daño de la tabla del manual §6.6 (magnificación 100%), redistribuidos 1:1 sobre nombres originales del proyecto (ver `data-model.md`).

**Rationale**: El propio manual declara esos números "hechos objetivos de diseño, no expresión creativa" (portada, aviso de derechos de autor) — reutilizarlos como referencia numérica es seguro y, además, da al Capítulo 1 una curva de dificultad ya validada por el juego real en vez de una inventada desde cero.

**Alternatives considered**: Inventar una curva de HP/daño propia desde cero — descartado: no hay ninguna ventaja de diseño sobre reutilizar una curva ya probada, y hacerlo divergiría sin motivo del resto de fixtures del proyecto que ya citan el manual como fuente (`cats.ts`/`levels.ts` existentes no citan el manual porque son anteriores a su redacción, pero esta spec sí lo tiene disponible).
