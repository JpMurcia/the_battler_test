# Spec 045: Escala visual de la batalla

**Estado:** implementada (2026-11-17) · **Origen:** petición del usuario durante el piloto de sprites con IA (`docs/art/investigacion-pipeline-sprites-n8n-comfyui.md` § 7).

## Problema

Las unidades se dibujan a su tamaño de mundo en píxeles de pantalla. El ancho es el `width` del gato y el alto es 14 + 0,09 × vida, con un máximo de 40 (`src/game/animation.ts`). El Gato Básico mide **16×18,5 px** en cualquier pantalla. A ese tamaño ningún dibujo se distingue: se pierden la cara, el arma y la gorra. Además, el canvas de Pixi se rasterizaba a resolución 1, así que en pantallas HiDPI todo se veía borroso.

## Historia de usuario

**US1 (P1):** como jugador quiero ver a cada personaje lo bastante grande para reconocer su cara, su arma y su equipo, sin que el combate cambie.

**Escenarios de aceptación:**
1. En un canvas de 1256×535 (ventana de 1280×720), el Gato Básico mide 64 px de alto.
2. Con un canvas mayor, todo crece en proporción. Con uno menor, encoge, sin bajar de 1,5× ni pasar de 6×.
3. Las bases crecen en proporción a las unidades y su barra de vida queda dentro del canvas.
4. El anillo de equipo, la barra de vida, el eco de muerte y los impactos crecen con la unidad.
5. El contorno de los diseños procedurales y de los sprites sigue nítido a esa escala.

## Requisitos

- **FR-001:** una única función pura `getBattleVisualScale(ancho, alto)` decide la escala. Vale ≈ 3,46 en el canvas de referencia, sigue al lado más limitante y está acotada entre 1,5 y 6.
- **FR-002:** la escala es **solo de render**. No cambian `width`, `hp`, las posiciones del carril, la colisión ni ningún dato de `src/data/` ni de `src/engine/` (Constitución § IV y § VI).
- **FR-003:** las bases usan el 75 % de la escala de las unidades.
- **FR-004:** el canvas se rasteriza a la densidad real de la pantalla (`devicePixelRatio`, `autoDensity`).
- **FR-005:** las texturas procedurales se generan a resolución 8 y los fotogramas de sprite usan mipmaps.

## Criterios de éxito

- **SC-001:** el test de `getBattleVisualScale` comprueba 64 px en el canvas de referencia y los límites.
- **SC-002:** toda la suite de Vitest y `tsc -b` pasan sin cambios en las pruebas de motor ni de balance.
- **SC-003:** en el juego real (1280×720), una batalla con unidades desplegadas no da errores en consola y las barras de las bases quedan dentro del canvas.

## Fuera de alcance

- El arte nuevo de los gatos (piloto de sprites, en curso).
- Que los sprites `hero_*` actuales llenen su fotograma: tienen mucho margen vacío y se ven más pequeños que su caja. Los sprites nuevos lo resuelven (ficha ASSET-002: pies en y ≈ 288).
