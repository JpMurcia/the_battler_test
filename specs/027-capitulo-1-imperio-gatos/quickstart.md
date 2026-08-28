# Quickstart: Contenido — Capítulo 1 de Imperio de los Gatos

Guía de validación manual/automatizada de que el contenido de esta spec funciona de punta a punta, sin repetir el detalle ya cubierto en `spec.md` (criterios de éxito) y `data-model.md` (valores exactos).

## Prerrequisitos

- Implementación completa de `tasks.md` (los 4 archivos de `src/data/` extendidos).
- `npm install` ya ejecutado.

## Validación automatizada

```bash
npx tsc -b
npm test
```

Debe terminar limpio (SC-006) — sin regresión en ninguna suite existente (`specs/012`/`specs/020`/`specs/023`), más las suites nuevas de datos (`tests/unit/data/cats.test.ts`, `tests/unit/data/levels.test.ts`) verificando:

- Los 48 `imperio-cap1-etapa-*` existen en `LEVELS`, con `mapPosition` único y dentro de 0-100.
- `Level.difficulty` es no decreciente a lo largo de las 48 etapas.
- Los 12 `firstVictoryUnlockCatId` y el `bossCatId` del arco resuelven a un `catId` real de `CATS`.
- Ningún `id` nuevo (gato, enemigo, nivel, tesoro) colisiona con contenido existente (`data-model.md` § Verificación de no-colisión).

## Validación de punta a punta (manual o test de integración sobre `useMetaStore`)

1. Iniciar una partida nueva (`ownedCats` solo con el gato inicial de siempre + `cat-recluta`, disponible desde el inicio).
2. Superar en orden `imperio-cap1-etapa-1`, `-2`, `-4`, `-6`, `-8`, `-10`, `-12`, `-16`, `-20`, `-24`, `-28`, `-32`: tras cada una, confirmar en `useMetaStore.getState().ownedCats` que aparece el `catId` correspondiente de `data-model.md` § 13 hitos, y que el nivel siguiente del capítulo pasó de bloqueado a disponible (`getLevelState`).
3. Superar `imperio-cap1-etapa-48`: confirmar que, mientras `enemy-la-mascara` sigue con vida, la base enemiga no llega a 0 HP (barrera de jefe, `specs/020`); tras derrotarlo, confirmar que se puede ganar la etapa.
4. Tras ganar la etapa 48, confirmar que `grantedArcRewardIds` incluye `arco-imperio-de-los-gatos-cap1` y que `ownedCats` incluye `cat-veterano`.
5. Confirmar en el Menú de Tesoros (`specs/018`) que `set-imperio-de-los-gatos-cap1` aparece 48/48 y con su bonificación otorgada.
6. Abrir la Guía de Gatos (`specs/018`) y confirmar que los 14 gatos nuevos obtenidos muestran su etiqueta de rareza correcta (Normal o Especial) sin ningún cambio de código en esa pantalla (SC-005).

## Validación visual rápida (opcional, navegador)

```bash
npm run dev
```

Abrir "Niveles", confirmar que el mapa (`specs/023`) muestra 48 nodos nuevos conectados en serpenteo, sin solaparse entre sí ni con los nodos de los niveles fixture existentes.
