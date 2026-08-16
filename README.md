# Battle Cats Web

Tower-defense 1D estilo *The Battle Cats*, 100% web nativo — sin backend, sin cuenta de jugador, progreso local vía IndexedDB.

**Stack**: Vite + React 19 + TypeScript · Pixi.js (`@pixi/react`) para el render de combate en tiempo real, con sprites reales por frame (reskin Cyber-Modern) · Zustand para estado · Dexie sobre IndexedDB para persistencia · Vitest para testing.

Las reglas de diseño y técnicas del proyecto están fijadas en [`.specify/memory/constitution.md`](.specify/memory/constitution.md). El desarrollo sigue Spec-Driven Development: cada feature no trivial pasa por `spec.md` → `plan.md` → `tasks.md` bajo [`specs/`](specs/) antes de escribirse en código.

---

## Cómo ejecutar la aplicación

Requisitos: Node.js (con npm).

```bash
npm install
npm run dev
```

Esto levanta Vite en modo desarrollo con hot-reload (por defecto en `http://localhost:5173`). No hace falta backend ni variables de entorno — todo corre en el navegador.

Otros comandos disponibles (`package.json`):

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite con HMR |
| `npm run build` | Type-check (`tsc -b`) + build de producción a `dist/` |
| `npm run preview` | Sirve el build de `dist/` localmente para verificarlo |
| `npm test` | Corre la suite de Vitest (`src/engine/`, stores, componentes) |
| `npm run lint` | Lint con `oxlint` |

El progreso del jugador se guarda en IndexedDB del navegador (base `BattleCatsDB` vía Dexie, actualmente en versión 9 de esquema) — persiste entre recargas pero es local a ese navegador/perfil; borrar los datos del sitio reinicia el progreso.

`scripts/copy-sprites.mjs` es un script manual de un solo uso (no corre en `dev`/`build`) que copia los frames `idle`/`attack` de los 12 héroes usados por `src/data/cats.ts` desde `assets-source/` hacia `public/sprites/`.

---

## Estado actual

El proyecto avanza en 22 specs numeradas bajo `specs/`, cada una construida sobre la anterior sin tocar sus capas ya cerradas. `npx tsc -b` limpio y `npm test` en verde (**47 archivos, 393 tests**) al momento de escribir esto.

| Spec | Contenido | Tareas |
|---|---|---|
| [`001-nucleo-del-juego`](specs/001-nucleo-del-juego/) | Arquitectura base, pantallas, navegación, stores, persistencia Dexie | ✅ 23/23 |
| [`002-motor-de-combate`](specs/002-motor-de-combate/) | Motor real: colisión AABB 1D, daño, oleadas, energía, victoria/derrota | ✅ 24/24 |
| [`003-identidad-visual-animada`](specs/003-identidad-visual-animada/) | Unidades como cuerpos animados (idle/ataque) por tipo de gato | ✅ 16/16 |
| [`004-menu-principal-config`](specs/004-menu-principal-config/) | Menú principal y pantalla de configuración (volumen, idioma) | ✅ 15/15 |
| [`005-mapa-de-niveles`](specs/005-mapa-de-niveles/) | Mapa de niveles con desbloqueo secuencial | ✅ 9/9 |
| [`006-dashboard-base-jugador`](specs/006-dashboard-base-jugador/) | Dashboard de base del jugador | ✅ 17/17 |
| [`007-energia-mision-dificultad`](specs/007-energia-mision-dificultad/) | Energía de misión con regeneración y dificultad progresiva | ✅ 19/19 |
| [`008-tipos-de-ataque`](specs/008-tipos-de-ataque/) | Tipos de ataque: `Single` / `Area` / `LongRange` | ✅ 18/18 |
| [`009-clasificacion-habilidades`](specs/009-clasificacion-habilidades/) | Clasificación de gatos/enemigos y habilidades por rasgo (`TraitTargeting`, `Curse`) | ✅ 16/16 |
| [`010-evolucion-de-gatos`](specs/010-evolucion-de-gatos/) | Evolución de gatos (`Base` → `Second` → `True`) vía ítems | 🚧 15/16 |
| [`011-nivel-2-hacia-el-futuro`](specs/011-nivel-2-hacia-el-futuro/) | Segundo nivel jugable con gatos nuevos | 🚧 7/11 |
| [`012-saga-imperio-de-los-gatos`](specs/012-saga-imperio-de-los-gatos/) | Arcos de saga, Gatorreta y Brote Zombi | 🚧 35/36 |
| [`013-escalado-capitulos-sets-tesoros`](specs/013-escalado-capitulos-sets-tesoros/) | Escalado por arco y sets de tesoros con bonificación pasiva | 🚧 18/19 |
| [`014-banner-evento-especial`](specs/014-banner-evento-especial/) | Banner especial de evento: "Etapas de Fantasía" | 🚧 14/15 |
| [`015-catalogo-habilidades-combate`](specs/015-catalogo-habilidades-combate/) | Efectos `Weaken` / `Freeze` / `Slow`, resistencias | 🚧 20/21 |
| [`016-multigolpe-critico`](specs/016-multigolpe-critico/) | Tipos de ataque `MultiHit` y `Critical` | 🚧 12/13 |
| [`017-objetos-de-batalla`](specs/017-objetos-de-batalla/) | Objetos de batalla seleccionables pre-combate (máx. 3) | 🚧 19/20 |
| [`018-bibliotecas-consulta`](specs/018-bibliotecas-consulta/) | Guía de gatos, guía de enemigos y menú de tesoros | ✅ 21/22 |
| [`019-rango-de-usuario`](specs/019-rango-de-usuario/) | Sistema de rango de usuario con umbrales reclamables | 🚧 13/14 |
| [`020-barrera-de-base`](specs/020-barrera-de-base/) | Barrera de base y jefes vinculados | 🚧 14/15 |
| [`021-reskin-cyber-modern`](specs/021-reskin-cyber-modern/) | Reskin visual Cyber-Modern + sprites reales de combate (12 héroes) | ✅ 36/37 |
| [`022-datos-semilla-flujo-navegacion`](specs/022-datos-semilla-flujo-navegacion/) | Datos semilla, assets procedimentales y flujo de navegación | 🚧 20/21 |

### Sobre las tareas pendientes

Casi todo lo que queda abierto (9 de las 22 specs) es el **mismo tipo de tarea**: una verificación manual de punta a punta en navegador (recorrer una pantalla, jugar un nivel, confirmar un flujo visual). Quedan sin ejecutar porque requieren el panel de Browser del lado del usuario — no reflejan lógica sin terminar; la lógica correspondiente ya tiene su test Vitest en verde. El detalle está anotado tarea por tarea en cada `tasks.md`.

### Contenido de juego

- **12 gatos** en [`src/data/cats.ts`](src/data/cats.ts), cada uno con `spriteKey` propio (`hero_1`…`hero_12`) y sprites reales de idle/ataque en `public/sprites/`.
- **3 niveles** en [`src/data/levels.ts`](src/data/levels.ts), agrupados en **2 arcos de saga** ([`src/data/sagaArcs.ts`](src/data/sagaArcs.ts)).
- **Sets de tesoros** con bonificación pasiva ([`src/data/treasureSets.ts`](src/data/treasureSets.ts)) y **eventos especiales** con banner propio ([`src/data/events.ts`](src/data/events.ts)).
- **3 objetos de batalla** seleccionables antes del combate ([`src/data/battleItems.ts`](src/data/battleItems.ts)): aceleración de velocidad, energía extra, radar de tesoro.
- **Umbrales de rango de usuario** reclamables ([`src/data/userRankThresholds.ts`](src/data/userRankThresholds.ts)).
- Sin gacha real todavía — `GachaScreen` sigue siendo un stub de navegación.

---

## Arquitectura

### Vista de capas

```
React (pantallas, UI reactiva a eventos)
  │  useGameStore / useMetaStore (Zustand)
  ▼
src/engine/*            ← simulación pura, sin React ni Pixi, testeada con Vitest
src/game/*               ← puente Pixi.js: lee el store por tick, dibuja/anima sprites reales
src/db/*                 ← Dexie sobre IndexedDB (persistencia, 9 versiones de esquema)
src/data/*               ← contenido (gatos, niveles, saga, tesoros, eventos, objetos, rangos)
```

Principio central (Constitución § VI): la simulación de combate vive en funciones puras de TypeScript sin ninguna dependencia de React/Pixi; React gobierna solo pantallas y UI discreta; Pixi gobierna solo el render en tiempo real. **Ningún componente de React vuelve a renderizar en el tick de 60fps del combate** — la UI overlay lee el estado vía selectores acotados de Zustand.

### Estructura de directorios

```
src/
├── main.tsx              # Entry point (ReactDOM.createRoot)
├── App.tsx                # Router manual por useState<Screen> — sin librería de routing
├── types/screen.ts        # type Screen = 'Title' | 'MainMenu' | 'LevelSelect' | 'Gacha' | 'Upgrade'
│                           #             | 'Team' | 'Battle' | 'Result' | 'Settings'
│                           #             | 'CatGuide' | 'EnemyGuide' | 'TreasureMenu'
├── screens/                # Una pantalla por archivo, navegación vía prop onNavigate
├── state/
│   ├── useGameStore.ts    # Estado efímero de la partida en curso (nunca persistido)
│   └── useMetaStore.ts    # Progreso persistente del jugador, hidratado desde Dexie al arrancar
├── engine/                 # Simulación pura — sin imports de React/Pixi
│   ├── types.ts           # BattleUnit, AttackType, ClassificationType, Ability, EffectType
│   ├── collision.ts       # overlaps1D — AABB en 1D
│   ├── combat.ts          # resolveEngagement, resolveBaseDamage
│   └── simulation.ts      # stepSimulation — el reducer puro de un tick completo
├── game/                   # Puente hacia Pixi.js
│   ├── BattleStage.tsx    # <Application> de Pixi + BattleField (mount/unmount por unidad)
│   ├── UnitSprite.tsx     # Sprite real (idle/attack por frame) + animación por transform en cada tick
│   ├── DeathEchoSprite.tsx # Señal visual de "death echo" al morir una unidad
│   ├── animation.ts       # Funciones puras: Cat → VisualProfile, pose de animación por frame
│   ├── spriteAssets.ts    # Manifest de rutas de textura idle/attack por spriteKey (hero_1..hero_12)
│   ├── enemyEncounters.ts # Registro de enemigos vistos (alimenta EnemyGuideScreen)
│   └── graphics/unitFactory.ts # Construcción de BattleUnit desde Cat + contenido de nivel/evento
├── data/
│   ├── cats.ts             # Catálogo de gatos (stats + spriteKey)
│   ├── levels.ts           # Niveles (bases, energía, oleada enemiga)
│   ├── sagaArcs.ts         # Arcos de saga y agrupación de niveles
│   ├── events.ts           # Eventos especiales / banners
│   ├── treasureSets.ts     # Sets de tesoros y sus bonificaciones pasivas
│   ├── battleItems.ts      # Objetos de batalla seleccionables pre-combate
│   ├── userRankThresholds.ts # Umbrales de rango de usuario
│   ├── missionEnergy.ts    # Cálculo de energía máxima/regeneración
│   ├── levelState.ts       # Resolución de estado derivado de nivel (bloqueado/desbloqueado/completado)
│   └── seedData.ts         # Datos semilla de bootstrap (specs/022)
└── db/index.ts             # Esquema Dexie (9 versiones) + ensureDefaultProfile()
```

### Flujo de pantallas

`App.tsx` mantiene un `useState<Screen>` simple (sin router) y renderiza la pantalla activa por `switch`. Al montar, hidrata `useMetaStore` desde IndexedDB antes de mostrar nada.

```
Title ──▶ MainMenu ──┬──▶ LevelSelect ──▶ Battle ──▶ Result ──(Volver)──▶ LevelSelect
                      │        ▲
                      │        └────────────────────────────────────────────┘ (Volver)
                      ├──▶ Gacha (stub)
                      ├──▶ Settings ──(Guardar/Volver)──▶ MainMenu
                      └──▶ Upgrade ──┬──▶ Team
                                     ├──▶ CatGuide
                                     ├──▶ EnemyGuide
                                     └──▶ TreasureMenu
                           (las 4 subpantallas de Upgrade vuelven a Upgrade)
```

`LevelSelectScreen` llama a `useGameStore.startLevel(levelId)` y navega a `Battle`. `Upgrade` funciona como hub hacia `Team` (formación activa), `CatGuide`/`EnemyGuide` (bibliotecas de consulta, specs/018) y `TreasureMenu`. `Gacha` sigue siendo un stub de navegación sin lógica.

### Motor de combate (`src/engine/`)

Determinista y puro — `stepSimulation(state, deltaSeconds) → nextState`, sin timers propios ni side effects:

1. **Energía y cooldowns** avanzan según `deltaSeconds`.
2. **Spawns de oleada**: se generan las `BattleUnit` enemigas cuyo `spawnAtSeconds` ya venció (`src/data/levels.ts`).
3. **Detección de combate**: por tipo de ataque (`Single`/`Area`/`LongRange`/`MultiHit`/`Critical`) y alcance (`attackRange`/`areaRadius`) se busca la unidad o base enemiga elegible en X (`overlaps1D`, AABB 1D extendido a rango); de haberla, ambas quedan `Engaged`; si no, la unidad avanza libremente (bloqueada solo por aliados delante que no estén `Moving`).
4. **Resolución de daño**: `resolveEngagement` (unidad vs. unidad) y `resolveBaseDamage` (unidad vs. base) aplican daño simultáneo según el cooldown propio de cada unidad, moduladas por `Ability`/`ClassificationType` (daño por rasgo), efectos activos (`Curse`/`Weaken`/`Freeze`/`Slow`) y multi-golpe/crítico; la muerte (`hp <= 0`) se marca en el mismo tick.
5. **Condición de victoria/derrota**: `enemyBase.hp <= 0` → `Victory`; `playerBase.hp <= 0` → `Defeat`.

`useGameStore.tick(deltaSeconds)` simplemente llama a `stepSimulation(get(), deltaSeconds)` y aplica el resultado — el store no contiene lógica de combate propia.

### Capa de render (`src/game/`)

- `BattleStage.tsx`: monta el `<Application>` de Pixi (vía `@pixi/react`) y su `useTick` maestro llama a `useGameStore.getState().tick(deltaSeconds)` en cada frame. `BattleField` solo dispara `setState` de React (re-render) cuando cambia el **conjunto** de `instanceId`s activos (nace/muere una unidad) — nunca por su posición.
- `UnitSprite.tsx`: por cada unidad activa, monta su sprite real (`spriteAssets.ts`, frames idle/attack por `spriteKey`) y en un `useTick` propio lee la unidad fresca directo de `useGameStore.getState()` por `instanceId` para mutar `position`/`scale`/frame vía `ref` — sin pasar por props ni re-render de React.
- `DeathEchoSprite.tsx`: señal visual efímera al morir una unidad (specs/003 US3).
- `animation.ts`: funciones puras — `getVisualProfile(cat)` deriva tamaño/ritmo de idle de los stats del gato; `getAnimationPose(...)` calcula la pose para un instante dado.
- `spriteAssets.ts` / `graphics/unitFactory.ts`: manifest de texturas y construcción de `BattleUnit` a partir de `Cat` + contenido del nivel/evento activo.

### Estado (Zustand)

- **`useGameStore`** — estado de la partida en curso: `status`, energía, HP de bases, `units[]`, cooldowns de despliegue, objetos de batalla seleccionados, tiempo transcurrido. Completamente efímero: `reset()` lo vuelve a `Idle`, nunca se persiste (Constitución § V).
- **`useMetaStore`** — progreso persistente del jugador: moneda, niveles desbloqueados/completados, gatos poseídos (nivel, XP, `evolutionStage`), formación activa, energía de misión, ítems de evolución, tesoros obtenidos, recompensas de arco/set otorgadas, inventario de objetos de batalla, enemigos avistados, rango reclamado y ajustes. Se hidrata una vez desde Dexie al arrancar (`hydrate()`) y cada acción de mutación escribe de inmediato en IndexedDB (sin paso de "guardar" separado).

### Persistencia (`src/db/index.ts`)

Dexie sobre IndexedDB, base `BattleCatsDB`, con 9 versiones de esquema acumuladas spec sobre spec. Tablas actuales: `playerProfile`, `ownedCats`, `levelProgress`, `settings`, `teamFormation`, `missionEnergy`, `evolutionItems`, `treasures`, `arcProgress`, `treasureSetBonuses`, `battleItems`, `encounteredEnemies`, `userRank`. `ensureDefaultProfile()` es idempotente y siembra el perfil por defecto y el primer gato garantizado en la primera sesión.

### Testing

Vitest + Testing Library + `fake-indexeddb` (jsdom). La suite cubre `src/engine/` (colisión, combate, simulación, tipos de ataque, clasificación/habilidades, efectos, multi-golpe/crítico), `src/data/*` (niveles, eventos, datos semilla), los stores (`useGameStore`, `useMetaStore`, incluyendo Dexie con `fake-indexeddb`), `src/game/*` (animación, sprites, encuentros de enemigos, fábrica de unidades) y todas las pantallas, incluido un test de flujo end-to-end (`AppFlow.test.tsx`). El motor de combate se testea sin canvas ni árbol de componentes, por diseño (Constitución § VI).

---

## Documentación adicional

- [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — principios de diseño no negociables del proyecto.
- [`specs/`](specs/) — spec/plan/tasks de cada una de las 22 features, en orden cronológico.
- [`docs/`](docs/) — material de diseño y rediseño visual adicional (guías de estilo, roadmap de fases, referencia de manual técnico).
