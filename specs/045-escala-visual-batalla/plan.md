# Plan 045: Escala visual de la batalla

## Decisión

Se usa **una sola escala multiplicativa aplicada en el render**, calculada a partir del tamaño del canvas. Se descartaron dos alternativas:
- **Agrandar `bodyWidth`/`bodyHeight` en `getVisualProfile`:** habría roto el significado de «tamaño de mundo» que usan los tests y el anillo, y no habría escalado las bases.
- **Escalar un contenedor padre:** escalaría también las posiciones del carril, que ya están en píxeles de pantalla.

## Archivos

| Archivo | Cambio |
|---|---|
| `src/game/graphics/layout.ts` | `getBattleVisualScale`, `BATTLE_REFERENCE_SCREEN` (1256×535), `BATTLE_VISUAL_SCALE_AT_REFERENCE` (64/18,5), límites 1,5–6 y `BASE_VISUAL_SCALE_RATIO` (0,75) |
| `src/game/UnitSprite.tsx` | Escala del contenedor del cuerpo (con el aplastamiento del ataque), del anillo y del desplazamiento vertical (rebote y saltos). El desplazamiento horizontal no se escala porque el retroceso ya viene en píxeles de pantalla reales |
| `src/game/DeathEchoSprite.tsx` | Misma escala; la deriva y el salto de la muerte crecen con ella |
| `src/game/ImpactEffect.tsx` | Contenedor escalado (onda, chispas, altura); texto rasterizado a `escala × devicePixelRatio` |
| `src/game/BaseTower.tsx` | Contenedor de la base escalado a `escala × 0,75` desde su pivote (centro del suelo) |
| `src/game/BattleStage.tsx` | `resolution = devicePixelRatio`, `autoDensity`, `antialias` |
| `src/game/graphics/unitFactory.ts` | `TEXTURE_RESOLUTION` de 2 a 8 |
| `src/game/spriteAssets.ts` | Mipmaps en los fotogramas cargados |
| `tests/unit/game/layout.test.ts`, `unitFactory.test.ts` | Tests nuevos de la escala; la resolución esperada pasa a 8 |
| `docs/art/art-bible.md` | Tamaños de diseño: 48–138 px (64 el Gato Básico) |
| `scripts/art/*` | El filtro de Venice y la hoja de contacto juzgan la legibilidad a 55×64 px |

## Riesgos

- **Unidades más solapadas en el carril:** el ancho de colisión no cambia y el dibujo es ≈ 30 % más ancho que su hueco. Es aceptable en un juego de oleadas; si molesta, se puede bajar la escala.
- **Memoria:** las texturas procedurales a resolución 8 ocupan unas 16 veces más que a resolución 2. Son decenas de texturas pequeñas, cacheadas por `(unidad, rol)`.
