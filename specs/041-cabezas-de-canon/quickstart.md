# Quickstart: Cabezas de Cañón (Ototo Corps)

## Prerrequisitos

- `npm install` ya ejecutado.
- Suite de tests en verde antes de empezar: `npx tsc -b && npm test`.

## Validación automatizada

```bash
npx vitest run tests/unit/engine/combat.test.ts
npx vitest run tests/unit/data/ototoCorps.test.ts tests/unit/useMetaStore.test.ts
npx vitest run tests/unit/useGameStore.test.ts tests/unit/OtotoCorpsPanel.test.tsx tests/unit/BattleScreen.test.tsx
npx tsc -b
npm test
```

Todos deben pasar en verde, sin regresión en ninguna suite existente (SC-004/SC-006):

- **Refactor** (`combat.test.ts`): los tests de efectos de estado de `specs/015` (inmunidad, resistencia, refresco) pasan sin cambios tras extraer `applyEffectToDefender`.
- **Motor** (`combat.test.ts`): `applyCannonHead` con Retroceso desplaza a un enemigo hacia mayor `x` con tope en `laneLength - width` y no desplaza a uno inmune a Retroceso; con cada uno de los cuatro efectos de estado aplica la duración y magnitud del catálogo, respeta `immuneEffects` y reduce la duración con `resistantTo`, y refresca sin acumular; no muta su entrada.
- **Catálogo** (`ototoCorps.test.ts`): `OTOTO_BUILDINGS` incluye `cannonHead` con costo/duración positivos; `CANNON_HEAD_OPTIONS` tiene exactamente las cinco elecciones y todas tienen etiqueta; `getCannonHeadSpec` devuelve el spec esperado para cada una.
- **Cañón** (`useGameStore.test.ts`): sin cabeza, el disparo es idéntico al de antes (daño, recarga, eliminados); con cabeza, solo los enemigos alcanzados que sobreviven reciben el efecto — no los de fuera del radio, ni los derrotados, ni las unidades del jugador — y el daño es el mismo con o sin cabeza (SC-001/SC-002).
- **Construcción** (`useMetaStore.test.ts`): construir `cannonHead` descuenta el costo exacto, registra la construcción y persiste; reclamarla deja la elección activa y persistida, y una nueva sesión (`hydrate`) la recupera; una elección inválida devuelve `false` sin mutar; Base y Estilo se comportan como antes (SC-003/SC-004).
- **Panel y HUD** (`OtotoCorpsPanel.test.tsx`, `BattleScreen.test.tsx`): el panel muestra tres construcciones; la tercera ofrece las cinco elecciones con etiquetas en español; el control de cañón muestra el efecto solo si hay cabeza (SC-005).

## Validación manual en navegador

1. Iniciar el dev server (`npm run dev`) y abrir la app.
2. Dar materiales de Gamatoto (`gamatoto.materials` en IndexedDB, o completando una expedición) y abrir "Cuerpo Ototo": confirmar que aparecen tres construcciones (Base, Estilo, Cabeza de Cañón).
3. Construir la Cabeza de Cañón eligiendo "Retroceso"; para no esperar 15 minutos, retrasar `startedAtMs` de la construcción en la fila `ototoCorps` de IndexedDB y recargar; reclamarla y confirmar que el panel muestra "actual: Retroceso".
4. Entrar a un nivel jugable: confirmar que el control de cañón del HUD dice "Cañón · Retroceso".
5. Con enemigos cerca de la base, disparar el cañón (esperar su recarga o, desde las devtools, `useGameStore.setState`): confirmar que los enemigos alcanzados que sobreviven saltan hacia atrás y vuelven a acercarse, sin salir del carril, y que el daño del cañón es el de siempre.
6. Repetir con otra elección (p. ej. "Congelar"): confirmar que los enemigos alcanzados quedan congelados unos segundos; contra un jefe inmune a Retroceso (La Máscara, `specs/040`) con la cabeza de Retroceso, confirmar que recibe el daño y no se desplaza.
7. Revisar la consola del navegador: sin errores nuevos.
