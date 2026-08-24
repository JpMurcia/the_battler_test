# Quickstart: Cat Combos

Guía de validación manual/automatizada — no repite el detalle de diseño ya cubierto en `data-model.md`/`research.md`.

## Prerrequisitos

```bash
npm install
npm run dev
```

Sin variables de entorno ni backend — todo corre en el navegador. Cat Combos no agrega ninguna tabla Dexie nueva.

## 1. Detección pura de combos (US1/US3, base de todo lo demás)

```bash
npx vitest run tests/unit/data/catCombos.test.ts
```

Debe cubrir, sobre `getCompletedCombos`: formación exacta de un combo → completo; falta un solo miembro → incompleto (ningún bono parcial); ningún catId de `CAT_COMBOS` referencia un id ausente de `CATS` (FR-010); una formación que satisface `combo-nucleo-original` y `combo-especialistas-control` a la vez → ambos combos devueltos (Historia 3).

## 2. Bono aplicado en batalla (US1)

1. `npm run dev`, navegar a Equipo (`TeamScreen`) y armar la formación exactamente con `basic-cat` + `tank-cat` (poseídos desde el inicio), confirmar equipo.
2. Iniciar cualquier nivel y confirmar (vía `npx vitest run tests/unit/useGameStore.test.ts` o inspección del estado inicial de energía) que `regenPerSecond` incluye el multiplicador `1.05` de `combo-nucleo-original` sobre el valor base del nivel.
3. Repetir sin `tank-cat` en la formación (solo `basic-cat` u otro gato en su lugar): confirmar que el multiplicador de combo vuelve a `1` — ningún bono parcial (FR-004).

## 3. Visibilidad y actualización en vivo en `TeamScreen` (US2)

```bash
npx vitest run tests/unit/TeamScreen.test.tsx
```

1. Con una formación que incluye solo `basic-cat` (no `tank-cat`), abrir Equipo y confirmar que la sección "Cat Combos" muestra `combo-nucleo-original` como incompleto, señalando que falta `tank-cat`.
2. Si el jugador no posee `tank-cat` todavía, confirmar que el indicador distingue ese caso ("no poseído") de "poseído pero no incluido en la formación" (FR-007).
3. Marcar el checkbox de `tank-cat` (sin pulsar "Confirmar equipo" todavía): confirmar que la sección pasa a mostrar el combo como completo en el mismo render, sin recargar la pantalla (Acceptance Scenario 4).

## 4. Combos simultáneos (US3)

1. Armar una formación con los 4 catIds de ambos combos fixture (`basic-cat`, `tank-cat`, `weaken-cat`, `slow-cat`) — caben dentro de `MAX_ACTIVE_TEAM_SIZE` (6).
2. Confirmar equipo e iniciar batalla: verificar que el multiplicador de energía (`combo-nucleo-original`) y, al ganar, el multiplicador de recompensa de moneda (`combo-especialistas-control`) están ambos activos en la misma partida (`tests/unit/useGameStore.test.ts` + `tests/unit/BattleScreen.test.tsx`).

## 5. Combinación con bonos de tesoro ya otorgados (FR-008, Edge Case)

1. Con un set de tesoros ya otorgado que dé `EnergyRegenMultiplier` (`specs/013`, `grantedTreasureSetIds` no vacío) y `combo-nucleo-original` también activo, confirmar que `regenPerSecond` refleja ambos multiplicados entre sí, no solo uno de los dos.

## 6. Suite completa y cero regresiones (SC-005)

```bash
npx tsc -b
npm test
npm run lint
npm run build
```

Las 4 deben terminar sin errores; `npm test` debe seguir reportando en verde las 24 specs previas (`001`-`024`) además de las suites nuevas/ampliadas de esta spec.
