# Research: Unidades del Mundo Cartoon

**Feature**: `specs/042-unidades-mundo-cartoon` · **Fecha**: 2026-11-15

El Technical Context no dejó ningún `NEEDS CLARIFICATION`: todas las incógnitas se resolvieron leyendo el código actual. Cada decisión cita el archivo que la sustenta.

## Estado de partida verificado

| Pieza | Hoy | Archivo |
|---|---|---|
| Cuerpo con diseño (B) | `drawSeedUnit`: sombra → cuerpo → **placas** → rasgo → **visor** → cara → **borde neón**. El rol `ally` ya no dibuja orejas (spec 028) | `src/game/graphics/unitFactory.ts` |
| Caché de texturas | `getOrCreateUnitTexture(renderer, id, design, role)` → `renderer.generateTexture(g)` una vez por `(id, rol)` | `unitFactory.ts` |
| Resolución del diseño | `SEED_UNITS` → `SEED_ENEMIES` → `IMPERIO_CAP1_DESIGNS`; si no hay → **cuerpo "cyber"** (3 `Graphics`: cuerpo con degradado, visor con pulso, propulsor con parpadeo) | `src/game/UnitSprite.tsx:82-88, 239-245` |
| Sprite (A) | Mientras carga o si falla, `textures === null` → usa diseño si existe; los 12 no tienen diseño → **cuerpo "cyber"** | `UnitSprite.tsx:90-112` |
| Eco de muerte | Sprite: primer fotograma de reposo. Resto: **`drawCyberBodyBase(..., { dimmed: true })`** siempre, también para unidades con diseño | `src/game/DeathEchoSprite.tsx:75-115` |
| Barra de vida | `drawUnitHpBar(g, bodyLayout, team, fraction)` recibe un `CyberBodyLayout`, pero **solo lee `bodyWidth` y `bodyHeight`**, que `computeCyberBodyLayout` copia tal cual del `VisualProfile` | `src/game/graphics/unitHpBar.ts`, `cyberUnitBody.ts:42-47` |
| Color de equipo | `CYBER_TEAM_COLOR = { Player: 0x22d3ee, Enemy: 0xef4444 }` (espejo de `--bc-cyan` / `--bc-red`) | `cyberUnitBody.ts:14-17` |
| Registro Cap. 1 | `IMPERIO_CAP1_DESIGNS`: el test exige **exactamente 30** entradas | `tests/unit/data/imperioCap1Design.test.ts:44` |
| Montaje | `BattleStage` monta un `UnitSprite` por unidad viva y un `DeathEchoSprite` por eco; la pausa corta `store.tick`, no el ticker de Pixi | `src/game/BattleStage.tsx:131, 223-240` |

---

## Decisión 1 — Dónde viven los 28 diseños nuevos

**Decision**: un registro nuevo `src/data/unitDesigns.ts` con `EXTRA_UNIT_DESIGNS` (las 16 unidades "cyber" y los 12 respaldos de sprite) y una función pura `resolveUnitDesign(catId)` que consulta, en este orden: `SEED_UNITS`, `SEED_ENEMIES`, `IMPERIO_CAP1_DESIGNS` y `EXTRA_UNIT_DESIGNS`. `UnitSprite` y `DeathEchoSprite` usan solo `resolveUnitDesign`.

**Rationale**: no rompe el test de 30 entradas del Capítulo 1 (Assumption de la spec); mantiene los datos en `src/data/` (Constitución § IV); centraliza en un único punto la búsqueda hoy duplicada en `UnitSprite`, lo que además permite que el eco de muerte use el mismo diseño.

**Alternatives considered**:
- Añadir a `IMPERIO_CAP1_DESIGNS`: rompe el test de 30 entradas y mezcla unidades ajenas al Capítulo 1.
- Añadir un campo `proceduralDesign` a `Cat`: toca el tipo de producción usado por motor y UI para algo que es solo de render; más radio de cambio.

---

## Decisión 2 — Estilo cartoon en `drawSeedUnit`

**Decision**: se eliminan `drawArmorPlates`, `drawVisorPanel` y `drawNeonRim`. El dibujo pasa a tres capas, cada parte con relleno plano y contorno:
1. **Detrás del cuerpo**: sombra de contacto (se conserva), orejas (aliado) y rasgos que sobresalen (`horns`, `crest`, `fin`, `spikes`, `wings`, `tail`, `cat-ears`).
2. **Cuerpo**: relleno plano `primaryColor` + contorno.
3. **Delante del cuerpo**: `shield`, `fangs` y la cara.

Contorno: color `0x0a0c14` (biblia §4, = `--bc-bg-2`), grosor `max(1.5, size × 0.08)` px de textura. Los ojos y la boca pasan a usar el mismo color de contorno. El escudo deja de usar `lighten(+40)` con alfa y pasa a un tono plano propio (`primaryColor` aclarado sin transparencia) con contorno. Además se mueve abajo y hacia delante y se dibuja después de la cara, porque en la revisión visual tapaba los ojos. Los colmillos pasan de `0xffffff` a un blanco roto plano `0xe8e2d4`.

**Rationale**: dibujar los rasgos **detrás** del cuerpo hace que el contorno del cuerpo tape la base de cada rasgo: la silueta queda limpia y el contorno del cuerpo es continuo en todo su perímetro (FR-001) sin calcular uniones de formas. Grosor: la biblia propone ≥ 8 px a 300 px (2,7 %), lo que a 14–44 px daría 0,4–1,2 px, invisible; `0,08 × size` da 1,5 px a 14 px y 3,5 px a 44 px, y el mínimo de 1,5 px cumple el edge case de 14 px.

**Alternatives considered**:
- Un único `stroke` sobre la unión de formas: Pixi 8 no ofrece unión booleana de caminos en `Graphics`; habría que aproximarla.
- Contorno solo en el cuerpo y no en los rasgos: los rasgos claros sobre fondo claro (futuros fondos diurnos, biblia §6) perderían forma.

---

## Decisión 3 — Orejas de aliado y marco de cabeza

**Decision**:
- `role === 'ally'` vuelve a dibujar orejas **siempre**, salvo que `distinctiveFeature === 'cat-ears'`, en cuyo caso las orejas se dibujan una sola vez como el propio rasgo (FR-006, escenario 3). `role === 'enemy'` nunca dibuja orejas (FR-007).
- Las orejas y los rasgos de cabeza (`horns`, `crest`, `spikes`, `fin`) se dibujan en un **marco de cabeza** que depende de la forma:

| Forma | `top` | `halfWidth` |
|---|---|---|
| `circle` | `-half` | `half` |
| `rect` | `-half` | `half` |
| `poly` (triángulo) | `-0.75 × half` | `0.25 × half` |

  En el triángulo el vértice superior es un punto, así que hoy los rasgos de cabeza flotan sobre él. Con el marco, su base queda dentro del cuerpo y su punta asoma sobre el vértice. La primera propuesta (`-0.45`, `0.28`) los dejaba tapados, según la revisión visual. En el triángulo las orejas nacen de los lados inclinados, bajo el vértice (data-model.md § 3).
- **Disposición de orejas**: sin rasgo de cabeza, las orejas van en la posición normal (`±0.15…±0.70 × halfWidth`). Con un rasgo de cabeza, se abren hacia los lados (`±0.55…±0.98 × halfWidth`, punta hacia fuera), para que el rasgo ocupe el centro y las orejas asomen a ambos lados sin superponerse (escenario 2 y edge case).

**Rationale**: la spec 028 había quitado las orejas porque solo existía la posición central, que chocaba con cuernos y crestas. El marco de cabeza y las dos disposiciones resuelven ese choque sin crecer el vocabulario de rasgos. Los valores son iniciales y se afinan en la revisión visual (`quickstart.md`, paso 3); los tests fijan el comportamiento (orejas sí o no, una sola vez), no los píxeles.

**Alternatives considered**: tratar las orejas como un rasgo más (`cat-ears`) en cada aliado. Se descarta porque la biblia §5 dice que las orejas **no** cuentan como el rasgo distintivo y la spec exige ambos a la vez.

---

## Decisión 4 — Anillo de equipo

**Decision**: módulo puro `src/game/graphics/teamRing.ts` con `computeTeamRingGeometry(bodyWidth)` y `drawTeamRing(g, geometry, team)`. En `UnitSprite` el anillo es un `Graphics` **hermano** del contenedor del cuerpo (dentro de un fragmento, dibujado antes que él), dibujado una sola vez. En el mismo `useTick` ya existente solo se actualiza su posición: `x = laneX` e `y = laneY` (la geometría ya centra la elipse en `bodyWidth/2`). No hereda el rebote, el aplastamiento ni el giro del cuerpo. El resplandor son dos trazos exteriores del mismo color con alfa bajo, sin filtros. `DeathEchoSprite` no dibuja anillo.

**Rationale**: si el anillo estuviera dentro del contenedor del cuerpo, subiría con el rebote y se deformaría con el ataque, y se leería como parte del dibujo y no como suelo (FR-008: "acompaña sin desfasarse… no parpadea ni pulsa"). Dibujarlo una vez y moverlo por `x/y` cumple § VI. El resplandor por trazos replica la técnica de `drawGlowRings` de la spec 021 (sin paquete de filtros, sin coste por fotograma).

**Alternatives considered**:
- Una capa de anillos aparte en `BattleStage`, debajo de todas las unidades: garantiza que ningún anillo pinte sobre otra unidad, pero obliga a otro `useTick` por unidad con su propio `store.units.find` (O(n) por unidad y fotograma), duplicando el coste actual. Se descarta: el anillo es una elipse fina a la altura de los pies, y que se solape con los pies de una unidad vecina en combate es aceptable.
- `BlurFilter` o un filtro de brillo: tienen coste de GPU por fotograma con muchas unidades (SC-007).

---

## Decisión 5 — Retirar el cuerpo "cyber" y conservar la barra de vida

**Decision**:
- `drawUnitHpBar` pasa a recibir `{ bodyWidth, bodyHeight }` (el `VisualProfile` ya los tiene) en lugar de `CyberBodyLayout`. Como `computeCyberBodyLayout` copia esos dos valores del perfil sin transformarlos, el dibujo de la barra es idéntico (FR-009).
- El color de equipo pasa a `src/game/graphics/teamColors.ts` (`TEAM_INFO_COLOR`), compartido por la barra de vida y el anillo.
- Se borra `src/game/graphics/cyberUnitBody.ts` y su test. `UnitSprite` pierde la rama de tres `Graphics` cyber y las refs `visorRef` y `thrusterRef`.

**Rationale**: FR-002 prohíbe el cuerpo "cyber" en cualquier estado. Borrar el módulo lo garantiza de forma estructural: no hay ruta de código que lo pueda dibujar. El único consumidor que no es "cyber" (la barra de vida) solo necesitaba el tamaño.

**Alternatives considered**: conservar el módulo sin usarlo. Se descarta porque deja código muerto que un cambio futuro podría volver a montar como respaldo.

**Si una unidad no tiene sprite ni diseño en tiempo de ejecución**: el cuerpo no se dibuja (solo el anillo y la barra de vida) y se registra `console.error` una vez por `catId`. El test de FR-012 impide que eso llegue a producción; la spec pide que **nunca** se dibuje en silencio un cuerpo genérico.

---

## Decisión 6 — Eco de muerte

**Decision**: para unidades sin sprite cargado, el eco usa **la misma textura cacheada** del diseño (`getOrCreateUnitTexture`, misma clave `(catId, rol)` que la unidad viva) con `tint = 0x8a8f99` (multiplicativo, apaga sin redibujar). Se conservan la escala y el alfa decrecientes de `getDeathEchoPose` y la duración de 0,35 s. El eco de sprite no cambia.

**Rationale**: FR-010 pide la misma forma en tonos apagados, sin brillo. El tinte reutiliza la textura (cero texturas nuevas, cero `Graphics` por eco) y es determinista. El eco mantiene el espejo de enemigo con la misma convención de `anchor`/`scale` que la unidad viva.

**Alternatives considered**: una textura "apagada" propia por unidad (clave `:dimmed`): duplica la memoria de texturas para un efecto de 0,35 s.

---

## Decisión 7 — Regla de color verificable

**Decision**: para los 28 diseños nuevos y los 5 colores corregidos se exige, en HSL, **saturación < 0,69 y luminosidad < 0,48**. Esta condición basta para cumplir FR-005 («menos saturado y menos luminoso que el color de información de su matiz») frente a **cualquier** matiz, porque es menor que el mínimo de los siete tokens:

| Token | Hex | S | L |
|---|---|---|---|
| `--bc-cyan` | `#22d3ee` | 0,85 | **0,48** (mínimo de L) |
| `--bc-orange` | `#fb923c` | 0,96 | 0,61 |
| `--bc-purple` | `#a855f7` | 0,91 | 0,65 |
| `--bc-gold` | `#facc15` | 0,96 | 0,53 |
| `--bc-red` | `#ef4444` | 0,84 | 0,60 |
| `--bc-green` | `#4ade80` | **0,69** (mínimo de S) | 0,58 |
| `--bc-pink` | `#f472b6` | 0,86 | 0,70 |

Además, los 65 colores son únicos y la distancia RGB mínima entre un color nuevo o corregido y cualquier otro es ≥ 20, para que no haya pares indistinguibles aunque sean distintos en hex. Todos los colores de `data-model.md` se validaron con un script antes de fijarlos.

**Rationale**: comparar con «el token de su matiz» exige decidir el matiz de colores casi neutros (marrones, grises), donde el matiz es inestable. La condición universal evita esa ambigüedad y se puede probar en un test.

**Alternatives considered**: comparar con el token de matiz más cercano. Se descarta porque falla con los grises y marrones (el matiz es inestable).

---

## Decisión 8 — Hallazgo: color duplicado no listado en la spec

**Hallazgo**: `cat-cuchilla` (`imperioCap1Design.ts`) y `seed-enemy-red-snake` (`seedData.ts`) comparten exactamente `0xdc2626`. La spec solo enumera las cuatro coincidencias con tokens, pero FR-005 («único en todo el catálogo») y la comprobación de FR-012 fallarían con este par.

**Decision**: se cambia `cat-cuchilla` a `0xa5512f` (óxido). La Serpiente Roja enemiga conserva el rojo, que es parte de su identidad, y un aliado deja de usar un rojo cercano al color de equipo enemigo.

**Rationale**: cumplir FR-005 y FR-012 tal como están escritos. Hay que anotarlo en `spec.md` (Assumptions → Colores) durante `/speckit-tasks`.

---

## Decisión 9 — Arquetipo y rasgo de las 28 unidades

**Decision**: se aplica la tabla de la biblia §3 a partir de estadísticas y habilidades (detalle por unidad en `data-model.md`):

| Arquetipo | Regla en datos | Rasgo | Forma |
|---|---|---|---|
| Tanque | vida alta y daño bajo, o empuje | `horns` | `rect` |
| Defensivo | `Shield`, `Survive`, resistencias, inmunidad a Retroceso, vida alta y lento | `shield` | `rect` o `circle` si es pequeño |
| Agresivo / área | daño alto, `MassiveDamage`, `TraitKiller`, `Strengthen`, `MultiHit`, `Critical` | `spikes` | `poly` o `rect` si es pesado |
| Rápido | velocidad ≥ 22 o `Dodge` | `tail` | `poly` |
| Mando / divinidad | invocador, legendarios, "Solar" | `crest` | `circle` o `rect` |
| Aéreo | clasificación `Angel` | `wings` | `circle` |
| **Control** (Congelar, Debilitar, Ralentizar) y **economía** (`ExtraMoney`) | sin arquetipo de combate en la biblia | `none` | `circle` (`rect` el Grillete) |

**Rationale**: el vocabulario de rasgos **no crece** (Assumption de la spec). Control y economía no tienen fila en la biblia, así que usan `none`, igual que `cat-recluta` y `cat-veterano`; los distingue su color. `fangs` y `fin` no se usan en aliados: `fangs` es fiereza enemiga y `fin` es anfibio.

**Alternatives considered**: inventar rasgos para control (`frost` y similares). Se descarta porque lo prohíbe la spec y añadirlos exigiría ampliar la biblia.

---

## Decisión 10 — Nitidez de la textura

**Decision**: `getOrCreateUnitTexture` genera con `renderer.generateTexture({ target: g, resolution: 2 })`. `GenerateTextureOptions.resolution` existe en Pixi 8 (`node_modules/pixi.js/lib/rendering/renderers/shared/extract/GenerateTextureSystem.d.ts`).

**Rationale**: el sprite se estira a `bodyWidth × bodyHeight` (`UnitSprite.tsx:232-238`). A resolución 1, un contorno de 1,5 px queda borroso al escalar. Con resolución 2, el tamaño lógico de la textura (y por tanto el tamaño en pantalla, FR-011) no cambia y el borde se mantiene nítido. Coste: ~4× memoria en ≤ 130 texturas de 14–44 px (despreciable).

**Alternatives considered**: mantener la resolución por defecto. Se descarta porque el contorno grueso es el rasgo central del estilo y se perdería a 14 px.

---

## Decisión 11 — Consecuencias aceptadas

- **Proporciones dentro de la caja**: la textura incluye orejas y rasgos, y el sprite se ajusta a la misma caja `bodyWidth × bodyHeight` de hoy. En los aliados que ganan orejas, el cuerpo ocupa algo menos de alto dentro de esa caja. El tamaño en pantalla no cambia (FR-011); es la misma regla que ya sigue cualquier rasgo saliente.
- **Orden de pintado de anillos**: el anillo de una unidad montada después puede pintarse sobre los pies de una montada antes (Decisión 4).
- **Movimiento**: `getAnimationPose` y `getAnimationState` no se tocan; reposo y ataque se ven igual (FR-011, Constitución § III).
- **Inventario**: `docs/art/entity-inventory.md` debe reflejar que el nivel C desaparece y que los 12 sprites tienen respaldo B.
