# Quickstart: Validar Pulido de Batalla y HUD

## Prerrequisitos

```bash
npm install
npm run dev
```

Tener al menos 1 gato poseído y un nivel desbloqueado (perfil por defecto ya lo garantiza vía `ensureDefaultProfile`).

## Automatizado

```bash
npx tsc -b
npm test
```

Debe quedar limpio/en verde, incluyendo los tests nuevos de `useGameStore.test.ts` (speedMultiplier/paused), `useMetaStore.test.ts` (regenPerSecond/lastUpdatedAt expuestos), `BattleScreen.test.tsx` (cañón/velocidad/filas) y `tests/unit/game/unitHpBar.test.ts`.

## Manual en navegador

1. **Cañón especial**: entrar a cualquier batalla, observar el control de cañón en el HUD — debe mostrar progreso de recarga y estar deshabilitado. Esperar (o, si el tiempo de recarga por defecto de 20s es largo para verificar manualmente, revisar en DevTools que `useGameStore.getState().specialCannon.rechargeRemaining` baja cada frame) hasta que se habilite; pulsarlo y confirmar que enemigos cercanos a la base propia pierden HP y el anillo vuelve a llenarse desde cero.
2. **Velocidad/pausa**: en la misma batalla, pulsar x2 y confirmar visualmente que las unidades se mueven más rápido; pulsar pausa y confirmar que nada se mueve (incluida la barra de energía); reanudar y confirmar que continúa con normalidad.
3. **HP por unidad**: desplegar 2-3 unidades, dejar que entren en combate, confirmar que cada una (aliada y enemiga) muestra una barra de HP propia que baja al recibir daño y desaparece al morir.
4. **Temporizador de energía**: volver al Hub con energía por debajo del máximo (jugar y perder/ganar una batalla suele bajarla), confirmar que aparece un countdown junto al chip de energía; verificar que cuenta hacia abajo con el reloj real.
5. **Toggle de filas**: en batalla, pulsar el control de disposición y confirmar que la barra de despliegue pasa de 1 fila de hasta 6 a 2 filas, sin cambiar qué unidades aparecen ni su orden; desplegar una unidad en cada disposición y confirmar que el costo/cooldown se comporta igual.

## Regresión

Confirmar que el resto del HUD de batalla (energía, HP de bases, resultado de victoria/derrota) sigue funcionando exactamente igual que antes de esta spec — ninguna de las 5 historias debe cambiar su comportamiento.
