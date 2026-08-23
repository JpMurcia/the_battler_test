# Quickstart: Mapa Visual de Etapas, Catálogo Completo de Gatos y Grilla de Despliegue

## Prerrequisitos

```bash
npm install
```

Rama activa: `023-mapa-de-etapas-visual`. Ver [data-model.md](data-model.md) para los valores concretos de `mapPosition` y el reparto de `catId`, y [research.md](research.md) para las decisiones de arquitectura.

## Validación automatizada (gate mínimo, SC-006)

```bash
npx tsc -b
npm test
```

`tsc -b` en verde confirma que todo literal `Level`/`EventBanner.specialStage` (producción y fixtures de test) recibió `mapPosition` (research.md Decisión 4). `npm test` en verde confirma cero regresiones en las suites existentes, incluidas las de `specs/012` (SC-004).

## Escenario 1 — Mapa de nodos con los tres estados (US1, SC-001)

```bash
npm run dev
```

1. Abrir la app, ir a "Niveles" desde el Menú Principal con progreso nuevo (sin niveles completados).
2. Confirmar: el nodo de `level-1` se ve "disponible", `level-2` y `level-seed-demo` se ven "bloqueados", conectados por líneas punteadas en el orden de `LEVELS`.
3. Tocar el nodo de `level-1`: se abre el panel de detalle con nombre, estrellas (`difficulty`) y costo de energía, con el botón "¡Atacar!" habilitado.
4. Tocar un nodo bloqueado: no se abre ningún panel, no cambia `missionEnergy`.
5. Pulsar "¡Atacar!": navega a `Battle` con el mismo gasto de energía que antes tenía "Jugar".
6. Si `evento-etapas-de-fantasia-fase-especial` está en su ventana horaria activa: aparece como nodo adicional con borde dorado, fuera de la cadena de líneas.

## Escenario 2 — Catálogo completo obtenible (US2, SC-003)

Camino más rápido: en un entorno de test o consola de dev, simular el guardado en vez de jugar manualmente los niveles.

```ts
// Ejemplo de aserción (ver tests/unit/useMetaStore.test.ts para el patrón real)
useMetaStore.setState({ completedLevelIds: ['level-1'] })
useMetaStore.getState().claimArcRewardsIfComplete('arco-1-imperio-de-los-gatos')
// → ownedCats debe incluir speed-cat, heavy-cat, armored-cat, frost-cat, weaken-cat, slow-cat, zombie-ward-cat

useMetaStore.setState({ completedLevelIds: ['level-1', 'level-2'] })
useMetaStore.getState().claimArcRewardsIfComplete('arco-2-imperio-de-los-gatos')
// → ownedCats debe incluir además triple-strike-cat, lucky-cat, seed-cat-basic, seed-cat-wall, seed-cat-ranged, seed-cat-titan
```

Confirmar `Object.keys(useMetaStore.getState().ownedCats).length === 16` (SC-003: 3 ya obtenibles hoy + 13 nuevos). Confirmar que `firstVictoryUnlockCatId` de `level-1`/`level-2` (`tank-cat`/`solar-cat`) sigue otorgándose igual (FR-012, SC-004).

## Escenario 3 — Grilla de despliegue sin scroll (US3, SC-005)

1. En "Equipo", seleccionar 6 gatos poseídos y "Confirmar equipo" — confirmar que un 7º intento de selección no tiene efecto (FR-015).
2. Entrar a una batalla con ese equipo — confirmar en el layout fijo horizontal (`specs/021` Fase 9) que los 6 botones de despliegue son visibles en una grilla de columnas iguales, sin scroll horizontal (FR-014).
3. Con `activeTeamCatIds` de más de 6 `catId` seteado directamente en el store (equipo heredado, FR-016), confirmar que `DeployBar` muestra como máximo los primeros 6 sin error ni pantalla en blanco.

## Verificación manual en navegador

```bash
npm run dev
```

Repetir los pasos del Escenario 1 en `http://localhost:5173` (o el puerto que reporte Vite), con las herramientas de desarrollo abiertas para confirmar ausencia de errores de consola.
