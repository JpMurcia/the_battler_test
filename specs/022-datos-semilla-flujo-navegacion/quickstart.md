# Quickstart: Validar Datos Semilla, Assets Procedimentales y Flujo de Navegación

Guía para comprobar, de extremo a extremo, que el catálogo semilla (spec.md US1), las representaciones visuales procedimentales (US2) y el flujo de navegación (US3) funcionan una vez implementados. No incluye código de implementación — ver [data-model.md](data-model.md) y [research.md](research.md) para el diseño, y `tasks.md` (generado por `/speckit-tasks`) para el desglose de trabajo.

## Prerrequisitos

- Dependencias ya instaladas (`npm install` si es la primera vez en esta máquina).
- Ninguna variable de entorno ni servicio externo — el proyecto es 100% frontend local-first.

```bash
npm install
```

## 1. Validar el catálogo semilla (US1)

```bash
npx vitest run tests/unit/data/seedData.test.ts
```

**Resultado esperado**: todas las aserciones en verde, cubriendo (spec.md Acceptance Scenarios 1-3 de US1):
- `SEED_UNITS` tiene exactamente 4 entradas, una por cada `SeedRarity` (`Normal`, `Rare`, `SuperRare`, `UberRare`).
- `SEED_ENEMIES` tiene exactamente 3 entradas con `traits` `[]`, `['Red']`, `['Floating']` respectivamente.
- `seedUnitToCat()` produce un `Cat` con todos los campos requeridos por el motor (`hp`, `damage`, `attackRange`, `speed`, `attackIntervalSeconds`, `cost`, `cooldownSeconds`, `attackType`, `classification`, `rarity`, `width`).
- El gato `UberRare` tiene el `cost`/`stats.spawnCooldown` más altos del catálogo semilla; el `Rare` tiene el `hp` más alto con el `attackRange` más bajo (arquetipos de spec.md § User Story 1).

## 2. Validar la generación procedimental de assets (US2)

```bash
npx vitest run tests/unit/game/unitFactory.test.ts
```

**Resultado esperado**:
- `drawSeedUnit()` es determinista: llamarla dos veces con el mismo `ProceduralDesign` produce la misma secuencia de instrucciones de dibujo (o el mismo resultado observable, según cómo se implemente el test).
- `getOrCreateUnitTexture()` invoca `renderer.generateTexture()` una sola vez por combinación única de `(seedUnitId, role)` — la segunda llamada con los mismos argumentos devuelve la textura cacheada sin volver a generar (verificar con un mock/spy sobre `generateTexture`).
- Dos unidades semilla con `proceduralDesign` distinto producen texturas distintas (no colisionan en caché).

### Verificación visual manual (complementaria, no sustituye el test anterior)

1. Levantar el servidor de desarrollo y abrir el navegador embebido en la URL local.
2. Navegar hasta el nivel de demostración (Menú Principal → Selección de Equipo → equipar los 4 gatos semilla → Batalla).
3. Confirmar visualmente: cada gato semilla y cada enemigo semilla se ve con su color/forma/rasgo distintivo propio, y no se congela ni parpadea al aparecer una segunda instancia de la misma unidad (evidencia de reutilización de textura cacheada).

## 3. Validar el flujo de navegación completo (US3)

```bash
npx vitest run tests/unit/AppFlow.test.tsx
```

**Resultado esperado** — cubre spec.md Acceptance Scenarios 1-7 de US3:
1. Desde `Title`, pulsar iniciar → aterriza en `MainMenu` con los datos hidratados desde `fake-indexeddb`.
2. Desde `MainMenu` → `Team`: se puede equipar entre 5 y 10 unidades (usar el roster semilla) y la alineación persiste (releer del store/Dexie tras re-render).
3. Desde `MainMenu` → `Upgrade`: se puede invertir experiencia disponible en una unidad de la colección.
4. Desde `MainMenu` → `Battle` (con alineación válida): el HUD superior muestra dinero + HP de ambas bases, el HUD inferior muestra botones de invocación con costo/cooldown.
5. Forzar HP de base enemiga a 0 → aparece el modal de Victoria.
6. (Caso separado) Forzar HP de base aliada a 0 → aparece el modal de Derrota.
7. Confirmar el modal de resultado → vuelve a `MainMenu` con el progreso (recursos/experiencia) reflejado en el estado guardado.

### Caso límite: alineación vacía (spec.md Edge Cases)

Confirmar que intentar entrar a `Battle` sin ninguna unidad equipada no navega a `Battle` y muestra el motivo al jugador (assert sobre el mensaje/estado deshabilitado, no sobre una excepción lanzada).

## 4. Suite completa

```bash
npm test
```

**Resultado esperado**: toda la suite existente (21 features previas) sigue en verde — evidencia de que el catálogo semilla y sus assets procedimentales se sumaron sin romper el catálogo de producción ni el motor de combate (spec.md § Assumptions).

## 5. Lint y build (higiene estándar del proyecto, no específico de esta feature)

```bash
npm run lint
npm run build
```
