# Data Model: Contenido — Capítulo 1 de Imperio de los Gatos

Todos los tipos (`Cat`, `Level`, `SagaArc`, `TreasureSet`) ya existen — esta spec no agrega ni modifica ningún campo, solo instancias nuevas. Valores de diseño provisionales, no balanceados, mismo criterio que el resto del contenido fixture del proyecto.

## 14 `Cat` jugables nuevos (`src/data/cats.ts`)

Todos con `cost`/`cooldownSeconds` sujetos a `costMultiplier: 0.67` del arco al jugarse dentro del capítulo (`specs/012` FR-002, sin modificar el valor base aquí listado). Ninguno declara `spriteKey` (research.md Decisión 4). `evolutions` sigue el formato de `specs/010`: `second` en nivel 10, `true` en nivel 20+10, sin `requiredItemCount`.

| id | name | rarity | cost | cooldown(s) | hp | dmg | speed | width | atkInterval(s) | attackType | range | classification | evolutions (second / true) | nota |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `cat-recluta` | Gato Recluta | Normal | 10 | 1.5 | 55 | 6 | 20 | 16 | 1.0 | Single | 0 | Traitless | sin evoluciones | disponible desde el inicio (FR-001); permanece en Forma Base indefinidamente (FR-003/Edge Cases) |
| `cat-yunque` | Gato Yunque | Normal | 25 | 4 | 260 | 4 | 8 | 26 | 1.6 | Single | 0 | Traitless | ×1.3/1.2 · ×1.7/1.5 | desbloquea etapa 1 |
| `cat-sigiloso` | Gato Sigiloso | Especial | 35 | 5 | 60 | 22 | 30 | 14 | 1.1 | Single | 0 | Traitless | ×1.25/1.3 · ×1.6/1.7 | desbloquea etapa 2 |
| `cat-cuchilla` | Gato Cuchilla | Normal | 45 | 6 | 140 | 14 | 14 | 20 | 1.7 | Area (radio 30) | 0 | Traitless | ×1.3/1.3 · ×1.7/1.7 | desbloquea etapa 4 |
| `cat-forzudo` | Gato Forzudo | Especial | 70 | 9 | 420 | 60 | 6 | 32 | 3.0 | Single | 0 | Traitless | ×1.25/1.25 · ×1.6/1.6 | desbloquea etapa 6 |
| `cat-verdoso` | Gato Verdoso | Normal | 55 | 7 | 90 | 20 | 16 | 16 | 1.6 | LongRange | 130 | Traitless | ×1.3/1.3 · ×1.7/1.7 | desbloquea etapa 8 |
| `cat-deidad` | Gato Deidad | Especial | 90 | 10 | 150 | 35 | 12 | 20 | 1.8 | Single | 0 | Traitless | sin evoluciones | desbloquea etapa 10; `resistantTo: [{ effect: 'Curse', durationMultiplier: 0.3 }]` |
| `cat-cornamenta` | Gato Cornamenta | Normal | 40 | 3 | 75 | 16 | 34 | 15 | 0.9 | Single | 0 | Traitless | ×1.3/1.3 · ×1.7/1.7 | desbloquea etapa 12 |
| `cat-migratorio` | Gato Migratorio | Normal | 60 | 7 | 110 | 18 | 18 | 18 | 1.5 | Single | 0 | Traitless | ×1.3/1.3 · ×1.7/1.8 | desbloquea etapa 16; `abilities: [{ kind: 'TraitTargeting', targetClassifications: ['Floating'], damageMultiplier: 2.5 }]` |
| `cat-centinela` | Gato Centinela | Normal | 70 | 8 | 150 | 20 | 10 | 20 | 2.0 | LongRange | 160 | Traitless | ×1.3/1.3 · ×1.7/1.7 | desbloquea etapa 20 |
| `cat-anfibio` | Gato Anfibio | Normal | 65 | 7 | 130 | 24 | 16 | 18 | 1.7 | LongRange | 110 | Traitless | ×1.3/1.3 · ×1.7/1.7 | desbloquea etapa 24 |
| `cat-escamado` | Gato Escamado | Normal | 85 | 8 | 260 | 22 | 12 | 24 | 1.9 | Area (radio 35) | 0 | Traitless | ×1.3/1.3 · ×1.7/1.7 | desbloquea etapa 28 |
| `cat-coloso` | Gato Coloso | Normal | 130 | 14 | 380 | 140 | 6 | 34 | 3.2 | Single | 0 | Traitless | ×1.25/1.25 · ×1.6/1.6 | desbloquea etapa 32 |
| `cat-veterano` | Gato Veterano | Normal | 10 | 1.2 | 90 | 10 | 22 | 16 | 0.9 | Single | 0 | Traitless | sin evoluciones | recompensa de fin de capítulo (`SagaArc.completionRewards.unlockCatIds`, FR-004) — reedición mejorada de Gato Recluta |

## 16 `Cat` de enemigo nuevos (`src/data/cats.ts`)

`cost: 0`, `cooldownSeconds: 3` en los 16 (irrelevantes para una unidad que el jugador no despliega, mismo patrón que `SEED_ENEMIES_AS_CATS`). `hp`/`damage` replican el manual §6.6 a magnificación 100% (research.md Decisión 5).

| id | name | equivalente manual | tier | hp | dmg | speed | width | atkInterval(s) | attackType | range | classification |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `enemy-merodeador` | Merodeador | Doge | A | 90 | 8 | 14 | 16 | 1.6 | Single | 0 | Traitless |
| `enemy-escudero` | Escudero | Squire Rel | A | 80 | 30 | 12 | 18 | 1.4 | Single | 0 | Traitless |
| `enemy-triturador` | Triturador | Croco | A | 70 | 30 | 26 | 14 | 1.1 | Single | 0 | Traitless |
| `enemy-rondador` | Rondador | Snache | A | 100 | 15 | 22 | 16 | 1.3 | Single | 0 | Traitless |
| `enemy-turba` | Turba | Those Guys | B | 200 | 20 | 24 | 18 | 1.2 | Single | 0 | Traitless |
| `enemy-planeador` | Planeador | Baa Baa | B | 500 | 50 | 16 | 22 | 1.7 | Single | 0 | Floating |
| `enemy-saltarin-alado` | Saltarín Alado | B.B.Bunny | B | 500 | 50 | 18 | 20 | 1.6 | Single | 0 | Floating |
| `enemy-behemot-gris` | Behemot Gris | Hippoe | C | 1000 | 100 | 6 | 30 | 2.2 | Single | 0 | Traitless |
| `enemy-carmesi` | Carmesí | Gory | C | 1000 | 80 | 10 | 26 | 1.8 | Single | 0 | Red |
| `enemy-emperador-volador` | Emperador Volador | Jackie Peng | C | 1300 | 80 | 14 | 26 | 1.9 | Single | 0 | Floating |
| `enemy-foca-blindada` | Foca Blindada | Sir Seal | D | 2500 | 150 | 9 | 30 | 2.0 | Single | 0 | Traitless |
| `enemy-boxeador` | Boxeador | Kang Roo | D | 4000 | 250 | 8 | 32 | 2.3 | Single | 0 | Traitless |
| `enemy-embestida` | Embestida | Le'boin | D | 4000 | 654 | 10 | 32 | 2.6 | Single | 0 | Traitless |
| `enemy-instructor-feroz` | Instructor Feroz | Teacher Bear | E | 3000 | 1000 | 4 | 34 | 3.5 | Area (radio 45) | 140 | Traitless |
| `enemy-unicornio-guerra` | Unicornio de Guerra | One Horn | E | 15000 | 500 | 5 | 36 | 2.4 | Single | 0 | Traitless |
| `enemy-la-mascara` | La Máscara | The Face | Jefe | 99999 | 2000 | 4 | 44 | 2.8 | LongRange | 160 | Traitless |

## 48 `Level` nuevos (`src/data/levels.ts`)

`id`: `imperio-cap1-etapa-{N}` (N = 1..48). `region: 'imperio-de-los-gatos-cap1'`. `playerBaseHp: 1000` constante en los 48.

### 13 hitos hechos a mano

| N | firstVictoryUnlockCatId | enemyWave (curada) | battleItemRewards | bossLevelId/bossCatId del arco |
|---|---|---|---|---|
| 1 | `cat-yunque` | Merodeador, Escudero, Merodeador | `extra-energy` ×1 | — |
| 2 | `cat-sigiloso` | Escudero, Rondador, Triturador | `extra-energy` ×1 | — |
| 4 | `cat-cuchilla` | Rondador, Triturador, Rondador | `speed-boost` ×1 | — |
| 6 | `cat-forzudo` | Triturador, Rondador, Turba | `speed-boost` ×1 | — |
| 8 | `cat-verdoso` | Turba, Planeador, Turba | `treasure-radar` ×1 | — |
| 10 | `cat-deidad` | Planeador, Saltarín Alado, Turba | `treasure-radar` ×1 | — |
| 12 | `cat-cornamenta` | Saltarín Alado, Planeador, Behemot Gris | `extra-energy` ×1 | — |
| 16 | `cat-migratorio` | Behemot Gris, Carmesí, Saltarín Alado | `speed-boost` ×1 | — |
| 20 | `cat-centinela` | Carmesí, Emperador Volador, Behemot Gris | `treasure-radar` ×1 | — |
| 24 | `cat-anfibio` | Emperador Volador, Foca Blindada, Carmesí | `extra-energy` ×1 | — |
| 28 | `cat-escamado` | Foca Blindada, Boxeador, Emperador Volador | `speed-boost` ×1 | — |
| 32 | `cat-coloso` | Boxeador, Embestida, Foca Blindada | `treasure-radar` ×1 | — |
| 48 | — (recompensa vía arco, no vía nivel) | Instructor Feroz, Unicornio de Guerra, **La Máscara** (jefe) | `extra-energy` ×2 | `bossLevelId`/`bossCatId` del `SagaArc` |

Los `spawnAtSeconds` de las 3 entradas curadas de cada hito siguen el mismo patrón que la plantilla (5, 16, 30); la etapa 48 añade la entrada del jefe en `spawnAtSeconds: 45` (tras los dos mooks de aviso), y **su `enemyBaseHp` es un valor propio más alto que la fórmula** (20000, no la fórmula de la Decisión 1) para que la barrera del jefe (`specs/020`) tenga sentido narrativo — el resto de campos (`difficulty`/`energyCost`/`currencyReward`/`treasureId`/`mapPosition`) de los 13 hitos sigue exactamente la misma fórmula que los 35 de plantilla (research.md Decisión 1/3), usando su propio `N`.

### 35 niveles por plantilla

Generados en `levels.ts` por una función pura `buildImperioCap1TemplateLevel(N)` para cada `N` de 1 a 48 que no está en la tabla de hitos de arriba — fórmula exacta en `research.md` Decisión 1 (dificultad/costo/recompensa/HP de base/posición de mapa/oleada), usando el roster por tier de `research.md` Decisión 2. No se listan los 35 valores literales aquí: son 100% derivables de la fórmula documentada, y así se implementan (una función + un `.map()` sobre los índices no-hito, no 35 objetos literales tipeados a mano).

## `SagaArc` nuevo (`src/data/sagaArcs.ts`)

```ts
{
  id: 'arco-imperio-de-los-gatos-cap1',
  name: 'Imperio de los Gatos — Capítulo 1',
  // Generado por el mismo patrón que los id de nivel (Array.from({length:48}, (_,i) => `imperio-cap1-etapa-${i+1}`)),
  // sin importar IMPERIO_CAP1_LEVELS desde levels.ts — evita acoplar sagaArcs.ts a ese módulo (ver tasks.md § Nota de desviación #2).
  levelIds: ['imperio-cap1-etapa-1', /* ... */ 'imperio-cap1-etapa-48'], // las 48, en orden
  costMultiplier: 0.67,
  enemyStrengthMultiplier: 1,
  bossLevelId: 'imperio-cap1-etapa-48',
  bossCatId: 'enemy-la-mascara',
  completionRewards: { unlockCatIds: ['cat-veterano'] }, // sin unlockNextArcId (FR-009, fuera de alcance Cap. 2)
}
```

## `TreasureSet` nuevo (`src/data/treasureSets.ts`)

```ts
{
  id: 'set-imperio-de-los-gatos-cap1',
  name: 'Set Imperio de los Gatos — Capítulo 1',
  treasureIds: ['tesoro-imperio-cap1-etapa-1', /* ... */ 'tesoro-imperio-cap1-etapa-48'], // las 48
  passiveBonus: { type: 'CurrencyRewardMultiplier', value: 1.15 },
}
```

## Verificación de no-colisión (FR-014)

Los 16 `catId` ya existentes en `CATS` antes de esta spec (`basic-cat`, `tank-cat`, `speed-cat`, `heavy-cat`, `solar-cat`, `armored-cat`, `frost-cat`, `weaken-cat`, `slow-cat`, `zombie-ward-cat`, `triple-strike-cat`, `lucky-cat`, `seed-cat-basic`, `seed-cat-wall`, `seed-cat-ranged`, `seed-cat-titan`, `seed-enemy-dog`, `seed-enemy-red-snake`, `seed-enemy-floating-hippo` — de hecho 19, no 16; ver Nota) no comparten prefijo con ningún `id` nuevo de esta spec (`cat-*`/`enemy-*`), y los 3 `Level.id` existentes (`level-1`, `level-2`, `level-seed-demo`) no comparten prefijo con `imperio-cap1-etapa-*`.

**Nota de corrección de conteo**: `spec.md` hereda de `specs/023` la cifra "16 `catId` ya existentes" (los 13 jugables sin camino de obtención + los 3 ya obtenibles antes de esa spec); sumando los 3 `seed-enemy-*` (fuera del conteo de specs/023 por ser contenido enemigo, no jugable) el total real en `CATS` antes de esta spec es 19. No afecta a ningún requisito: FR-014 exige "no modificar ninguno de los existentes", verificado por prefijo sin importar el conteo exacto.
