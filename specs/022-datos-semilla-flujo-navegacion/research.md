# Phase 0 Research: Datos Semilla, Assets Procedimentales y Flujo de Navegación

## Contexto de partida (estado real del código, no asunciones)

Antes de investigar decisiones, se auditó el código existente relevante:

- `src/data/cats.ts` ya define un catálogo unificado `CATS: Cat[]` usado tanto para aliados como para enemigos (los niveles referencian `catId` en `enemyWave`/`reinforcementWave`/`zombieWave`, y `spawnEnemyUnit` en `src/engine/simulation.ts:54-55` resuelve ese `catId` contra el mismo `CATS`). **No existe una tabla `ENEMIES` separada.**
- `Cat` (`src/data/cats.ts`) ya tiene: `id`, `name`, `cost`, `cooldownSeconds`, `hp`, `damage`, `speed`, `width`, `attackIntervalSeconds`, `attackType`, `attackRange`, `areaRadius?`, `classification`, `rarity?` (`RarityType` en español: Normal/Especial/Raro/Superraro/Megarraro/Legendario/Colaboración), `spriteKey?`.
- `src/game/UnitSprite.tsx` ya tiene una cadena de fallback de 2 niveles: sprite real animado (`spriteKey` → `SPRITE_MANIFEST`) → `Graphics` vectorial dibujado en cada frame vía `drawBody`, cuyo `VisualProfile` se **deriva matemáticamente de los stats** (`src/game/animation.ts::getVisualProfile`), no de campos de diseño explícitos.
- No existe `src/game/graphics/` ni ningún uso de `renderer.generateTexture()` en el proyecto — la generación procedimental por textura cacheada (lo que pide el usuario) es capacidad nueva, no un reemplazo de algo existente.
- Las 6 pantallas del flujo (Título, Menú Principal, Selección de Equipo, Mejoras, Batalla, Resultado) ya existen y ya navegan entre sí vía `App.tsx` (máquina de estados simple con `Screen` + `onNavigate`).

Esto confirma los supuestos documentados en `spec.md` § Assumptions y acota el trabajo real de esta feature a tres piezas nuevas y acotadas, no a una reconstrucción.

## Decisión 1 — Ubicación y relación de `seedData.ts` con el catálogo de producción

**Decisión**: `src/data/seedData.ts` define su propio tipo `SeedUnit` con exactamente la forma pedida por el usuario (`id`, `name`, `rarity: 'Normal'|'Rare'|'SuperRare'|'UberRare'`, `stats{ hp, attackPower, attackRange, moveSpeed, attackCooldown, cost, spawnCooldown }`, `targetType`, `traits`, `proceduralDesign`). Exporta también `SEED_UNITS: SeedUnit[]` (los 4 gatos) y `SEED_ENEMIES: SeedUnit[]` (los 3 enemigos), y una función pura `seedUnitToCat(unit: SeedUnit): Cat` que adapta cada entrada al `Cat` ya consumido por el motor/UI. `seedData.ts` invoca esa función para exportar además `SEED_CATS_AS_CATS: Cat[]`, listo para añadirse a `CATS` (spread) sin tocar las 21 features de contenido ya construidas.

**Rationale**:
- Cumple literalmente el contrato de datos pedido por el usuario (nombres de campo exactos) sin forzar ese esquema sobre el resto del catálogo ya construido en 21 specs previas.
- El adaptador puro (`seedUnitToCat`) es la única pieza que "sabe" mapear un esquema al otro — testeable de forma aislada, sin duplicar reglas de negocio del motor.
- Mantiene Constitución § IV (datos de contenido en `src/data/`, nunca hardcodeados en `src/engine/`).

**Mapeo del adaptador**:

| SeedUnit | Cat |
|---|---|
| `stats.hp` | `hp` |
| `stats.attackPower` | `damage` |
| `stats.attackRange` | `attackRange` |
| `stats.moveSpeed` | `speed` |
| `stats.attackCooldown` | `attackIntervalSeconds` |
| `stats.cost` | `cost` |
| `stats.spawnCooldown` | `cooldownSeconds` |
| `targetType` (`'Area'`) | `attackType: 'Area'` (+ `areaRadius` por defecto razonable) |
| `targetType` (`'Single'`) | `attackType: 'Single'` |
| `traits[0]` (si existe) | `classification` (`Red`/`Floating`/`Black`/`Angel`/`Alien` coinciden 1:1 con `ClassificationType`); ausente/`[]` → `'Traitless'` |
| `rarity` | `rarity` (`Normal→Normal`, `Rare→Raro`, `SuperRare→Superraro`, `UberRare→Megarraro`) |
| `proceduralDesign` | no se copia a `Cat` — se consume directo por `unitFactory.ts` vía `id`, no vía el `Cat` adaptado |
| — | `width` (no existe en `SeedUnit.stats`): derivado de `proceduralDesign.size` con la misma fórmula ya usada por `getVisualProfile` para mantener consistencia de hitbox/visual |

**Alternatives considered**:
- *Extender `Cat` con los campos nuevos del usuario*: rechazado — rompería el contrato ya usado por 21 specs y el checklist de calidad de la spec exige no tocar el catálogo de producción sin necesidad.
- *Mantener `SeedUnit` totalmente aislado, sin adaptador, con su propio mini-motor de combate*: rechazado — violaría Constitución § VII (Simplicidad/YAGNI) al duplicar `combat.ts`/`simulation.ts` para un catálogo de prueba.

## Decisión 2 — Generación procedimental de texturas con PixiJS v8

**Decisión**: `src/game/graphics/unitFactory.ts` expone:
- `drawSeedUnit(g: Graphics, design: ProceduralDesign, role: 'ally' | 'enemy'): void` — función pura de dibujo (cuerpo con `roundRect`/`circle` según `design.baseShape`, orejas triangulares vía `poly` si `role === 'ally'` o el rasgo distintivo del enemigo si `role === 'enemy'`, y expresión facial simple con `circle` para ojos + `lineTo` para boca), coloreada con `design.primaryColor`.
- `getOrCreateUnitTexture(renderer: Renderer, seedUnitId: string, design: ProceduralDesign, role: 'ally' | 'enemy'): Texture` — cachea en un `Map<string, Texture>` module-level, keyed por `` `${seedUnitId}:${role}` ``; en cache-miss dibuja con `drawSeedUnit` sobre un `Graphics` temporal y llama `renderer.generateTexture(graphics)` una sola vez.

Integración en `UnitSprite.tsx`: se añade un tercer nivel de fallback **entre** el sprite real y el `Graphics` derivado de stats — si el `Cat` no tiene `spriteKey` pero su `id` resuelve en `seedData.ts` (tiene `proceduralDesign`), se usa `getOrCreateUnitTexture` (vía un `pixiSprite` con la textura cacheada) en vez del `Graphics` dibujado por stats. Si no resuelve en ninguno de los dos, se conserva el `Graphics` de stats sin cambios (comportamiento actual, cero regresión para las 21 features previas).

**Rationale**:
- Sigue el patrón oficial de PixiJS v8 (`PIXI.Graphics` + `renderer.generateTexture()`) pedido explícitamente por el usuario, para convertir gráficos vectoriales en texturas reutilizables (menos trabajo de GPU que redibujar `Graphics` cada frame, ver `pixijs-performance`/`pixijs-scene-graphics`).
- La caché por `id` garantiza que instancias repetidas de la misma unidad (varias invocaciones del mismo gato, u oleadas repetidas del mismo enemigo) reutilicen la textura ya generada (spec.md FR-005 / SC-005), sin regenerar `Graphics` por instancia.
- No reemplaza el sprite real (`hero_1`…`hero_12`) del catálogo de producción — mantiene la coexistencia declarada en spec.md § Assumptions.

**Alternatives considered**:
- *Generar la textura en el momento del build (script offline) en vez de en runtime*: rechazado por ahora — el catálogo semilla es pequeño (7 entradas) y `generateTexture()` en runtime, cacheado, ya cumple el objetivo de rendimiento de SC-005 sin la complejidad de un paso de build adicional (YAGNI, Constitución § VII).
- *Reemplazar directamente el `Graphics` derivado de stats (`getVisualProfile`) para todo el catálogo, no solo el semilla*: rechazado — cambiaría la identidad visual ya validada de las 12 unidades de producción sin que ninguna historia de esta feature lo requiera.

## Decisión 3 — Validación del flujo de navegación

**Decisión**: No se crean pantallas ni rutas nuevas — las 6 ya existen y ya navegan vía `App.tsx`. La "validación" pedida por el usuario se implementa como:
1. Un nivel de prueba (`level-seed-demo` o reutilizar un `Level` existente) cuyo `enemyWave` referencia los 3 IDs de `SEED_ENEMIES` adaptados, y una alineación de prueba con los 4 `SEED_UNITS` adaptados — de forma que el catálogo semilla sea alcanzable jugando, no solo importable en código.
2. Una prueba de integración (Vitest + Testing Library, mismo patrón que `tests/unit/*Screen.test.tsx` ya existentes) que monta `<App />`, hidrata el store con datos de prueba (roster = `SEED_UNITS` adaptados, IndexedDB fake ya usada vía `fake-indexeddb`), y recorre Título → Menú → Equipo (equipar 5-10) → Batalla (forzar victoria/derrota) → Resultado → Menú, aserting en cada paso el contenido esperado del HUD (spec.md US3, acceptance scenarios 1-7).
3. Una pasada manual con el navegador embebido (`preview_start`/Browser pane) para confirmar visualmente que las representaciones procedimentales del catálogo semilla se ven en el campo de batalla — no reemplaza la prueba automatizada, la complementa (regla de este proyecto: "para cambios de UI, probar en navegador antes de reportar completo").

**Rationale**:
- Reutiliza el patrón de test ya establecido (`tests/unit/BattleScreen.test.tsx`, etc.) — cero infraestructura nueva de testing.
- Un nivel jugable real (en vez de solo un test unitario del catálogo) es la única forma de que un humano pueda "ver" el catálogo semilla funcionando end-to-end, que es literalmente lo que pide la Historia 3.

**Alternatives considered**:
- *Construir una pantalla de "sandbox/debug" nueva solo para inspeccionar el catálogo semilla*: rechazado — Constitución § VII (YAGNI); no hay historia de usuario que pida una pantalla nueva, y el nivel de prueba ya cubre el mismo propósito reutilizando UI existente.
