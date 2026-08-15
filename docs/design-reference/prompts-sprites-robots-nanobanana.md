# Estructura de prompts para generar sprites de robots estilo Battle Cats (Nano Banana / Gemini)

Guía de referencia para "The Battler". Objetivo: unidades robot con la silueta simple y expresiva de Battle Cats, con las poses que hoy consume el motor (`Idle` y `Attack`, ambas como flipbook de 2+ frames — ver `Assets/Tests/EditMode/Battler/UnitAnimationSpriteFrameTests.cs`).

## 1. Cómo funciona el flujo con Nano Banana (para quien viene de dev, no de IA gen)

Nano Banana (Gemini 2.5/2.6 Flash Image, en la app Gemini o AI Studio) es un modelo de **edición conversacional de imágenes**, no solo texto→imagen. La clave para que un mismo personaje se vea igual en todas sus poses no es escribir un prompt perfecto una sola vez: es esto:

1. **Turno 1 — generas una imagen de referencia** ("model sheet") del personaje en pose neutral, con el prompt base (sección 3).
2. **Turnos siguientes — editas esa misma imagen**, en el mismo chat, pidiendo únicamente el cambio de pose ("ahora el mismo robot, pero en pose de ataque, brazo extendido hacia adelante"). No abras un chat nuevo ni cambies de prompt base: cada turno hereda la imagen anterior como referencia visual, que es lo que te da consistencia de personaje (proporciones, colores, forma de la cabeza, etc.).
3. Si en algún turno el resultado se desvía (cambia de color, proporciones, etc.), no sigas iterando sobre esa rama: vuelve a la imagen de referencia del turno 1 y repite la edición.

Esto reemplaza lo que en Stable Diffusion harías con LoRA/seed fija — aquí la "memoria del personaje" es literalmente la imagen que subes de vuelta al modelo en cada turno.

## 2. Bloque de ADN visual (fijo, se repite en todos los prompts)

Este bloque no cambia entre unidades ni entre poses. Defínelo una vez y pégalo siempre al inicio del prompt:

```
Chibi 2D game character sprite, front-facing 3/4 side view (matching the classic
"Battle Cats" mobile tower-defense unit style), thick clean black outlines, flat
cel-shaded coloring, simple rounded shapes, small stubby limbs, oversized head-to-body
ratio (about 1:1.5), minimal shading with 2-3 tone flat cartoon coloring, no gradients,
no photorealism. Subject: a small friendly robot person (NOT a cat), single character,
centered, standing on an implicit ground line. Plain solid white background so it can be
isolated. No text, no watermark, no UI elements, no shadow cast on the ground.
```

Ajusta color/material del robot en la parte variable (sección 3), no aquí.

## 3. Turno 1 — prompt de referencia (model sheet)

Plantilla con placeholders:

```
[BLOQUE DE ADN VISUAL de la sección 2]

Character design: [NOMBRE DE LA UNIDAD]. A [tamaño: pequeño/mediano/grande] robot
person built from [material: chatarra oxidada / chapa pintada de colores / placas
de plástico brillante], with [forma de cabeza: cabeza cuadrada con antena / cabeza
redonda tipo casco / pantalla como cara], [color primario] as main body color and
[color secundario] as accent color, [detalle distintivo: tornillos visibles, un ojo
tipo linterna, tubos de escape en la espalda, etc.]. Pose: neutral idle stance, arms
relaxed at sides, facing right, full body visible, feet apart shoulder-width.

Square canvas, character fills about 70% of the frame height, centered with even
margin on both sides for later cropping.
```

Ejemplo relleno (unidad de prueba: "Robot Chatarra Básico"):

```
[BLOQUE DE ADN VISUAL]

Character design: Robot Chatarra Básico. A small robot person built from rusty
scrap metal panels riveted together, with a square head with a single glowing
orange eye and a tiny antenna on top, dull grey as main body color and orange as
accent color (eye, joints, chest bolt), visible screws at the shoulder and knee
joints. Pose: neutral idle stance, arms relaxed at sides, facing right, full body
visible, feet apart shoulder-width.

Square canvas, character fills about 70% of the frame height, centered with even
margin on both sides for later cropping.
```

## 4. Turnos siguientes — poses (edición sobre la imagen del turno 1)

No repitas el bloque de ADN visual completo en estos turnos: al ser edición conversacional, basta con nombrar el cambio de pose y recordar restricciones clave (fondo, outline, sin texto). El motor necesita **mínimo 2 frames por animación** para que el flipbook funcione, así que genera al menos 2 variantes por estado.

**Idle (2 frames — loop de respiración/parpadeo):**

```
Same robot character, identical colors, proportions and outline style, plain white
background, no text. Idle frame 2: subtle secondary pose — head tilted very slightly
down, arms lowered a touch further, as if mid-breathing-cycle loop with frame 1. Same
canvas size and character scale as the reference image so the two frames align when
placed in a flipbook.
```

**Attack (2-3 frames — anticipación / impacto / recuperación):**

```
Same robot character, identical colors, proportions and outline style, plain white
background, no text. Attack frame 1 (anticipation): torso leaning back slightly,
[arma/ataque: puño retraído hacia atrás / brazo-cañón cargando un disparo], facing
right, same canvas size and character scale as the reference image.
```

```
Same robot character, identical colors, proportions and outline style, plain white
background, no text. Attack frame 2 (impact): torso leaning forward, [arma/ataque:
puño extendido al máximo hacia adelante / brazo-cañón disparando con destello
pequeño en la punta], facing right, same canvas size and character scale as the
reference image.
```

```
Same robot character, identical colors, proportions and outline style, plain white
background, no text. Attack frame 3 (recovery, optional): torso returning to
neutral, [arma/ataque] retracting back to idle position, facing right, same canvas
size and character scale as the reference image.
```

**Extra (no lo pide el motor hoy, pero conviene generarlo junto porque roadmap-fases.md ya prevé evolución y variantes de unidad — así lo tienes listo):**

```
Same robot character, identical colors, proportions and outline style, plain white
background, no text. Hurt/knockback frame: leaning backward off-balance, one arm
raised defensively, small motion lines behind the character, facing right, same
canvas size and character scale as the reference image.
```

## 5. Restricciones que van SIEMPRE (pégalas al final de cualquier prompt si el modelo se desvía)

```
Constraints: keep the exact same color palette, outline thickness, head shape and
body proportions as the reference image. Do not change the character into a
different design. Do not add background scenery, shadows, text, logos or extra
characters. Keep the character facing the same direction (right) unless explicitly
asked otherwise.
```

## 6. Tips específicos de Nano Banana

- **Edición > regeneración**: usa el botón/flujo de "editar esta imagen" (o simplemente responde en el mismo chat) en lugar de pegar el prompt completo de nuevo — así el modelo usa la imagen previa como ancla visual real, no solo como texto recordado.
- **Fondo blanco sólido, no transparente**: Nano Banana no genera canal alfa real. Pide fondo blanco plano y luego quita el fondo con una herramienta aparte (`rembg`, Photoshop, Remove.bg) antes de importar a Unity.
- **Grid en una sola imagen (opcional, más barato en turnos)**: puedes pedir las 2-3 poses de attack en una sola imagen tipo hoja de contactos ("a 3-panel sprite sheet, side by side, same character, poses: anticipation / impact / recovery, white background, thin dividing lines between panels") y luego recortar tú los paneles. Es más rápido pero da menos control por frame que iterar turno a turno.
- **Si el modelo "arregla" algo que no le pediste** (cambia el color del ojo, engorda al personaje, etc.), no seas condescendiente pidiendo disculpas al prompt — simplemente vuelve a la imagen del turno 1 y repite la instrucción de forma más explícita, nombrando el atributo que se movió.
- **Nano Banana 2 (Lite)** es la versión más reciente disponible en 2026; si tu acceso ya usa esa versión, la consistencia de personaje entre turnos es notablemente mejor que en la primera versión — igual conviene seguir el flujo turno a turno de todos modos.

## 7. Post-proceso antes de meterlo a Unity

1. Quitar fondo blanco → PNG con transparencia.
2. Recortar cada frame al mismo tamaño de canvas y mismo punto de anclaje (pies tocando el borde inferior) para que no “salte” al animar.
3. Importar en Unity: Sprite Mode = Single, Pixels Per Unit consistente entre todos los frames de una misma unidad, Pivot = Bottom.
4. Armar el `AnimatorController` de `IdleAnimation` / `AttackAnimation` como flipbook (ya validado por el test existente) con los frames en orden.

## 8. Checklist rápido por unidad nueva

- [ ] Turno 1: model sheet de referencia generado y aprobado (proporciones, colores, silueta correctos)
- [ ] Idle frame 1 y frame 2
- [ ] Attack frame 1, 2 (y 3 si aplica)
- [ ] (Opcional) Hurt/knockback frame para futuro
- [ ] Fondo removido, frames recortados al mismo canvas/pivote
- [ ] Importado a Unity con Pixels Per Unit y Pivot consistentes
- [ ] `IdleAnimation` y `AttackAnimation` armados como AnimatorController con >1 frame (pasa `UnitAnimationSpriteFrameTests`)
