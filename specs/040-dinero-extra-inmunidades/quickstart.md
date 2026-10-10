# Quickstart: Catálogo de Habilidades de Combate — Dinero Extra e Inmunidad a Habilidades

## Prerrequisitos

- `npm install` ya ejecutado.
- Suite de tests en verde antes de empezar: `npx tsc -b && npm test`.

## Validación automatizada

```bash
npx vitest run tests/unit/engine/combat.test.ts
npx vitest run tests/unit/engine/simulation.test.ts
npx vitest run tests/unit/shared/UnitDetailPanel.test.tsx tests/unit/EnemyGuideScreen.test.tsx tests/unit/data/cats.test.ts
npx tsc -b
npm test
```

Todos deben pasar en verde, sin regresión en ninguna suite existente (SC-005/SC-006). El grueso de la validación es a nivel de motor — funciones puras de `src/engine/`, sin canvas ni DOM (Constitución § VI) — con `random` inyectado de forma determinista, mismo patrón que `specs/016`/`specs/038`/`specs/039`:

- **Dinero Extra** (`combat.test.ts`, `simulation.test.ts`): una unidad del jugador con `ExtraMoney` que derrota a un enemigo deja `defeatBounty` en él y, en `stepSimulation`, la energía sube exactamente el bono en ese mismo paso, con tope en `energy.max`; ningún bono si el golpe no derrota (incluido Sobrevivir), si el atacante no declara la habilidad, si está bajo `Curse`, si el atacante es enemigo o si la derrota la causa el cañón especial; tres derrotas por salpicadura en un mismo paso suman tres bonos; una eliminación de Killer cuenta como derrota; una unidad que cae en el mismo paso en que derrota concede igualmente el bono (SC-001).
- **Inmunidad** (`combat.test.ts`): con la habilidad ofensiva a probabilidad 1, el defensor inmune recibe solo el daño normal (sin multiplicar / sin eliminación / sin desplazamiento) y el no inmune recibe el efecto completo; la espía de `random` confirma que la habilidad ignorada no consume tirada; cada inmunidad es independiente de las demás; la salpicadura evalúa la inmunidad por objetivo; `Curse` sobre el defensor no la anula (SC-002/SC-003).
- **Presentación** (`UnitDetailPanel.test.tsx`, `EnemyGuideScreen.test.tsx`): el detalle describe Dinero Extra y muestra "Inmune a: …" solo cuando hay inmunidades; la Guía de Enemigos lista las inmunidades de `enemy-la-mascara` y muestra sin cambios a los enemigos sin ellas (SC-004).
- **Datos** (`cats.test.ts`): `enemy-la-mascara`, `wallet-cat` y `anchor-cat` declaran lo esperado y ningún gato anterior cambia (SC-005).

## Validación manual en navegador

1. Iniciar el dev server (`npm run dev`) y abrir la app.
2. Los gatos semilla son de rareza `Raro`, así que ya pueden salir de la Cápsula, pero para no depender del azar: desde la consola de las devtools, abrir IndexedDB `BattleCatsDB` y agregar a `ownedCats` las filas `{ catId, level: 1, experienceInvested: 0 }` para `wallet-cat` y `anchor-cat`, y a `encounteredEnemies` (`{ id: 1, catIds: [...] }`) el id `enemy-la-mascara`; recargar.
3. En "Equipar" → detalle del Gato Cobrador: confirmar que "Habilidades" muestra `Dinero Extra (+5 energía por enemigo derrotado)`; en el detalle del Gato Ancla, la fila `Inmune a: Retroceso`.
4. En "Biblioteca" → Guía de Enemigos: confirmar que La Máscara muestra `Inmune a: Golpe Letal, Killer, Retroceso` y que el resto de enemigos enfrentados se muestran como antes.
5. Entrar a un nivel jugable con el Gato Cobrador en el equipo, desplegarlo y dejar que derrote enemigos: confirmar (vía el HUD de energía o el store desde las devtools) que cada derrota sube la energía 5 puntos de inmediato y que nunca supera el máximo; confirmar que una derrota por el cañón especial no concede bono.
6. Revisar la consola del navegador: sin errores nuevos.
