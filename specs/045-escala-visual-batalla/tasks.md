# Tasks 045: Escala visual de la batalla

- [X] T001 `getBattleVisualScale` y sus constantes en `src/game/graphics/layout.ts`, con tests en `tests/unit/game/layout.test.ts` (SC-001).
- [X] T002 Escala en `UnitSprite.tsx`: cuerpo, anillo y desplazamiento vertical.
- [X] T003 Escala en `DeathEchoSprite.tsx` e `ImpactEffect.tsx`, con el texto rasterizado a su escala.
- [X] T004 Escala de la base al 75 % en `BaseTower.tsx`; comprobado que la barra de vida queda dentro del canvas en 1256×535.
- [X] T005 Nitidez: `devicePixelRatio`, `autoDensity` y `antialias` en `BattleStage.tsx`; `TEXTURE_RESOLUTION` 8 (y su test); mipmaps en `spriteAssets.ts`.
- [X] T006 Regresión: `npx tsc -b` limpio y `npx vitest run` con 62 archivos y 893 tests en verde, incluidos los 4 nuevos de la escala; `oxlint` sin avisos en `src/game` y `tests/unit/game`.
- [X] T007 Verificación en el juego real (1280×720): unidades y bases escaladas, barras dentro del canvas, sin errores nuevos en consola durante la batalla.
- [X] T008 Documentación: biblia de arte (tamaños) y filtro de Venice a 55×64 px.
