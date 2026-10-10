# Especificaciones de assets — gato: basic-cat (Gato Básico)
> **Origen**: `src/data/cats.ts` (`basic-cat`, `spriteKey: 'hero_1'`), `src/game/UnitSprite.tsx`, `src/game/spriteAssets.ts`, `src/game/animation.ts`, `docs/art/entity-inventory.md` · **Biblia de arte**: `docs/art/art-bible.md` · **Generado**: 2026-10-10
> **Revisión**: ninguna de especialista — derivado por la sesión principal (art-director y technical-artist no disponibles; las restricciones técnicas se comprobaron contra el código, no por un especialista)
> **Estado**: 4 assets especificados / 0 aprobados para producción / 0 en producción / 0 hechos

## Datos de partida

| Elemento | Dato |
|---|---|
| Entrada de datos | coste 10, enfriamiento 2 s, vida 50, daño 5, velocidad 20, `width` 16, ataque cada 1 s, cuerpo a cuerpo (`Single`, alcance 0), `Traitless`, rareza Normal; sin habilidades ni evoluciones definidas |
| Papel | gato inicial; forma con `tank-cat` el combo `combo-nucleo-original` (spec 025) |
| Arte actual | nivel A (`hero_1`): guerrero humano con casco con cuernos, espada y escudo; 16 fotogramas de reposo + 12 de ataque |
| Caja en pantalla | **16 × 18,5 px** (`width` 16; alto `14 + 0,09 × 50`). Un fotograma de 300×300 se reduce ≈ 19× en horizontal y ≈ 16× en vertical, y queda ≈ 13 % más estrecho que alto |

Consecuencia: a ese tamaño solo sobreviven cabeza, orejas y una masa de cuerpo con una pieza de equipo. El personaje debe ocupar casi todo el lienzo; los márgenes vacíos se pagan en resolución.

## Conflictos con el código (no resueltos)

**Conflicto 1 — 28 fotogramas.** El código fija 16 de reposo y 12 de ataque para todas las claves (`IDLE_FRAME_COUNT`, `ATTACK_FRAME_COUNT` en `spriteAssets.ts`). Generar 28 fotogramas coherentes con un generador de imágenes es costoso.
- *Opción A (la que siguen estas fichas):* ajustar el arte al código: 4 poses clave de reposo y 3 de ataque, interpoladas hasta 16 y 12. Sobrescribir `public/sprites/hero_1/…` en el sitio **no requiere cambiar código**.
- *Opción B:* una spec para permitir recuentos por unidad, con su propia `animationSpeed` (hoy fija en 0,3 en `UnitSprite.tsx`).

**Conflicto 2 — dónde vive el marcador procedural.** `tests/unit/data/imperioCap1Design.test.ts:44` exige que `IMPERIO_CAP1_DESIGNS` tenga exactamente 30 entradas, así que `basic-cat` no puede ir ahí sin romper el test. Hace falta un registro nuevo y un cambio de una línea en el lookup de `UnitSprite.tsx`. Afecta igual a las otras 15 unidades de nivel C del inventario. Por eso `ASSET-004` es una spec de código.

**Restricciones de motor que las fichas ya respetan:**
- El contenedor aplica además su propio rebote (hasta 2 px), aplastamiento (12 %) y giro (hasta ~8,6°) en `getAnimationPose`: lo dibujado debe ser sutil y con inclinación ≤ 10°.
- Al cambiar de reposo a ataque la animación reinicia en el fotograma 1: ambos conjuntos empiezan en la misma pose neutra.
- Los enemigos se espejan, así que todo sprite debe mirar a la **derecha**.

---

## ASSET-001 — Gato Básico: hoja de referencia + ADN felino compartido

| Campo | Valor |
|---|---|
| Categoría | Sprite A (referencia; no entra al juego) |
| Dimensiones | PNG 1024×1024, fondo blanco sólido; el personaje ocupa ≈ 90 % del alto |
| Formato y nombre | `assets-source/units/cats/basic-cat/ref_neutral.png` |
| Gancho en el código | ninguno · no requiere cambio de código |

**Descripción visual:** gato chibi antropomorfo bípedo, cabeza grande (≈ la mitad de la altura), hocico corto, orejas grandes y puntiagudas que asoman a ambos lados de una gorra de cuero redonda, cola corta, túnica de cuero y una espada corta de hierro en la mano delantera. Una sola masa redonda dominante, sin escudo ni placas: el recluta estándar. Pose neutra mirando a la derecha, pies separados.

**Reglas de la biblia:**
- §1: mundo cartoon, contorno grueso y color plano, sin brillo ni neón.
- §3: círculo = equilibrado, rasgo `none`, contorno ≥ 8 px a 300 px, una masa dominante.
- §4: contorno `#0a0c14`; relleno poco saturado y poco luminoso (pelaje `#cfc4b3`, sombra `#a89b86`, cuero `#8a5a3b` / `#5e3b25`, hierro `#9aa6b5`, interior de oreja `#c98f8a`); el cian queda reservado al anillo de equipo.
- §5: gato chibi, orejas obligatorias, cara de dos estados.

**Prompt de generación (turno 1):**
```
Chibi 2D game character sprite, 3/4 side view facing right, very thick clean near-black
outlines (about 3% of character height), flat cel-shaded coloring with 2-3 flat tones per
material, no gradients, no glow, no neon, no rim light, no photorealism. Subject: an
anthropomorphic CAT warrior, bipedal, oversized head about half of the total height, short
stubby limbs, short muzzle, large pointed cat ears clearly visible in the silhouette, a
short tail, simple expressive face (dot eyes, tiny mouth). Single character, centered,
feet resting on an implicit ground line. Plain solid white background. No text, no
watermark, no UI, no cast shadow, no scenery.

Character design: "Basic Cat", the standard recruit. Warm grey-cream fur (#cfc4b3) with a
slightly darker shade tone (#a89b86), a small round leather cap (#8a5a3b / #5e3b25) with
the ears poking out on both sides, a plain leather tunic, a short iron sword (#9aa6b5) held
in the front hand, no shield, no armor plates. One dominant round mass. Neutral idle
stance, arms relaxed, sword pointing slightly down-forward, facing right, full body
visible, feet apart.

Square canvas, character fills about 90% of the canvas height with a tight margin: the
sprite will be shown only about 16 px wide, so empty margins are wasted resolution.
Negative: glow, neon edges, gradients, thin lines, tiny details, glossy highlights,
realistic human face, text, background.
```

**Estado:** Pendiente

---

## ASSET-002 — Gato Básico: reposo (16 fotogramas)

| Campo | Valor |
|---|---|
| Categoría | Sprite A |
| Dimensiones | 16 PNG RGBA de 300×300; pies en y ≈ 288 (margen ≤ 4 %); cuerpo centrado en x ≈ 130 para dejar sitio al arma en el ataque; orientado a la derecha |
| Formato y nombre | `public/sprites/hero_1/idle/1.png` … `16.png` |
| Gancho en el código | `spriteKey: 'hero_1'` (sin cambios) · **sobrescribir en el sitio no requiere cambio de código** |

**Descripción visual:** respiración y parpadeo en bucle, sutiles, porque el motor ya añade un rebote al contenedor: inhalación (cuerpo +1–2 %, orejas y cola suben), pose neutra con parpadeo (ojos cerrados un fotograma) y exhalación (cuerpo −1–2 %, orejas relajadas). Cuatro poses clave interpoladas a 16 fotogramas; el fotograma 1 es la pose neutra de `ASSET-001`.

**Reglas de la biblia:** §5 (animación mínima, cara en estado neutro), §3 (el contorno ≥ 8 px sobrevive a la reducción de ~16–19×), §1.

**Prompt de generación (turnos de edición, sobre la imagen de `ASSET-001`):**
```
Same cat character, identical colors, proportions, outline thickness and canvas scale,
plain white background, no text, feet in exactly the same position as the reference.
Idle keyframe 2 (inhale): body about 2% taller, ears slightly raised, tail slightly up,
neutral face.
Idle keyframe 3 (blink): exactly the reference pose, eyes closed.
Idle keyframe 4 (exhale): body about 2% lower, ears relaxed, tail slightly down.
Keep the character facing right. Do not change the design.
```

**Estado:** Pendiente

---

## ASSET-003 — Gato Básico: ataque (12 fotogramas)

| Campo | Valor |
|---|---|
| Categoría | Sprite A |
| Dimensiones | 12 PNG RGBA de 300×300; misma línea de pies y mismo anclaje que el reposo; inclinación dibujada ≤ 10° (el motor suma hasta ~8,6°) |
| Formato y nombre | `public/sprites/hero_1/attack/1.png` … `12.png` |
| Gancho en el código | `spriteKey: 'hero_1'` (sin cambios) · no requiere cambio de código |

**Descripción visual:** tres tiempos de cuatro fotogramas. **Anticipación** (1–4): inclina el torso atrás y sube la espada detrás de la cabeza. **Impacto** (5–8): se lanza hacia delante con la espada extendida al frente (pico en 6–7) y cara de esfuerzo (ojos entrecerrados, boca abierta). **Recuperación** (9–12): vuelve a la pose neutra. El fotograma 1 y el 12 son la pose neutra, igual que el reposo, porque el cambio de estado reinicia en el fotograma 1.

**Reglas de la biblia:** §5 (ataque en tres tiempos, cara de dos estados), §3, §1.

**Prompt de generación (turnos de edición):**
```
Same cat character, identical colors, proportions, outline thickness and canvas scale,
plain white background, no text, feet in exactly the same position as the reference.
Attack keyframe 1 (anticipation): torso leaning back slightly (under 10 degrees), sword
raised behind the head, ears back.
Attack keyframe 2 (impact): torso leaning forward, sword fully extended to the front,
effort face (squinting eyes, open mouth), small speed accent only through pose, no glow,
no energy effects.
Attack keyframe 3 (recovery): returning toward the neutral stance, sword lowering.
Keep the character facing right. Do not change the design.
```

**Estado:** Pendiente

---

## ASSET-004 — Gato Básico: marcador procedural (nivel B)

| Campo | Valor |
|---|---|
| Categoría | Diseño procedural B |
| Dimensiones | `size: 16` (= `Cat.width`) |
| Formato y nombre | entrada de datos, sin archivo de imagen |
| Gancho en el código | **requiere cambio de código: sí** (conflicto 2): registro nuevo + una línea en `UnitSprite.tsx` + test |

**Descripción visual:** masa circular de pelaje gris-crema con contorno oscuro grueso, las orejas obligatorias de la biblia y ningún rasgo extra. Es la red de seguridad si la carga del sprite falla; hoy cae en el cuerpo «cyber», que la biblia retira.

**Línea de datos propuesta** (a verificar contra el color más cercano, `a8a29e` de `cat-veterano`):
```ts
'basic-cat': { primaryColor: 0xd2c6b2, baseShape: 'circle', size: 16, distinctiveFeature: 'none' }
```
`primaryColor` es único en el catálogo; `distinctiveFeature: 'none'` porque las orejas no cuentan como rasgo (§5).

**Reglas de la biblia:** §3 (círculo = equilibrado), §4 (color del mundo, no un token de información), §5 (nivel B, orejas, un rasgo máximo).

**Prompt de generación:** no aplica, es dibujo por código.

**Estado:** Pendiente

---

## Post-proceso común (fuera de esta skill)
1. Quitar el fondo blanco (hay que obtener alfa real).
2. Recortar cada fotograma a 300×300 con **la misma línea de pies y el mismo anclaje**.
3. Interpolar las poses clave hasta 16 y 12.
4. **Prueba de reducción** (biblia §3/§6): ver el resultado a 16×18,5 px sobre fondo oscuro y sobre los cuatro biomas, y en gris al 50 %.
5. Copiar sobre `public/sprites/hero_1/`. **No volver a ejecutar `scripts/copy-sprites.mjs`**: sobrescribiría el arte nuevo con el viejo de `assets-source/`.
