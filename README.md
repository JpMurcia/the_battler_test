# Battle Cats Web

Tower-defense 1D estilo *The Battle Cats*, 100% web nativo — sin backend, sin cuenta de jugador, progreso local vía IndexedDB.

**Stack**: Vite + React 19 + TypeScript · Pixi.js (`@pixi/react`) para el render de combate en tiempo real · Zustand para estado · Dexie sobre IndexedDB para persistencia · Vitest para testing.

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

El progreso del jugador se guarda en IndexedDB del navegador (base `BattleCatsDB` vía Dexie) — persiste entre recargas pero es local a ese navegador/perfil; borrar los datos del sitio reinicia el progreso.

---

## Estado actual

El proyecto avanza en tres specs numeradas bajo `specs/`, cada una construida sobre la anterior sin tocar sus capas ya cerradas:

| Spec | Contenido | Estado |
|---|---|---|
| [`001-nucleo-del-juego`](specs/001-nucleo-del-juego/) | Arquitectura base, pantallas, navegación, stores, persistencia Dexie | ✅ Completa (23/23 tareas) |
| [`002-motor-de-combate`](specs/002-motor-de-combate/) | Motor de combate real: colisión AABB 1D, daño, oleadas, energía, victoria/derrota | ✅ Completa (24/24 tareas) |
| [`003-identidad-visual-animada`](specs/003-identidad-visual-animada/) | Reemplaza las unidades como rectángulo sólido estático por cuerpos animados (idle/ataque) por tipo de gato | 🚧 En curso |

`npx tsc -b` limpio y `npm test` en verde (**8 archivos, 50 tests**) al momento de escribir esto.

### Spec 003 (en curso) — qué está hecho y qué falta

- ✅ **Fase 1 (Foundational)**: [`src/game/animation.ts`](src/game/animation.ts) — `getVisualProfile(cat)` deriva tamaño/forma/color/ritmo de idle de los stats ya existentes del gato; mapeo `BattleUnit.state → AnimationState`. Testeado en [`tests/unit/game/animation.test.ts`](tests/unit/game/animation.test.ts).
- ✅ **Fase 2 (US1 — unidades vivas)**: [`UnitSprite.tsx`](src/game/UnitSprite.tsx) dibuja el cuerpo una sola vez y anima posición/idle/ataque por `useTick` propio, sin re-render de React; [`BattleStage.tsx`](src/game/BattleStage.tsx) solo re-renderiza al nacer/morir una unidad, nunca en cada frame.
- ⏳ **Verificación manual en navegador** de las fases 2 y 3 (recorrido de `quickstart.md`) — pendiente.
- ⏳ **Fase 4 (US3 — señal de derrota / "death echo")** — pendiente.
- ⏳ **Fase 5 (Polish)** — verificación de rendimiento con 10+ unidades activas — pendiente.

Ver [`specs/003-identidad-visual-animada/tasks.md`](specs/003-identidad-visual-animada/tasks.md) para el detalle tarea por tarea.

### Contenido de juego (todavía placeholder, sin balancear)

- **4 gatos** en [`src/data/cats.ts`](src/data/cats.ts): Básico, Tanque, Veloz, Pesado.
- **1 nivel** en [`src/data/levels.ts`](src/data/levels.ts) con una oleada enemiga de 3 unidades.
- Sin gacha real, sin mejora de gatos balanceada, sin arte dibujado a mano — fuera de alcance hasta specs futuras (ver `Assumptions` de cada spec).

---

## Arquitectura

### Vista de capas

```
React (pantallas, UI reactiva a eventos)
  │  useGameStore / useMetaStore (Zustand)
  ▼
src/engine/*            ← simulación pura, sin React ni Pixi, testeada con Vitest
src/game/*               ← puente Pixi.js: lee el store por tick, dibuja/anima
src/db/*                 ← Dexie sobre IndexedDB (persistencia)
src/data/*               ← contenido (stats de gatos y niveles)
```

Principio central (Constitución § VI): la simulación de combate vive en funciones puras de TypeScript sin ninguna dependencia de React/Pixi; React gobierna solo pantallas y UI discreta; Pixi gobierna solo el render en tiempo real. **Ningún componente de React vuelve a renderizar en el tick de 60fps del combate** — la UI overlay lee el estado vía selectores acotados de Zustand.

### Estructura de directorios

```
src/
├── main.tsx              # Entry point (ReactDOM.createRoot)
├── App.tsx                # Router manual por useState<Screen> — sin librería de routing
├── types/screen.ts        # type Screen = 'Title' | 'MainMenu' | 'LevelSelect' | 'Gacha' | 'Upgrade' | 'Battle' | 'Result'
├── screens/                # Una pantalla por archivo, navegación vía prop onNavigate
├── state/
│   ├── useGameStore.ts    # Estado efímero de la partida en curso (nunca persistido)
│   └── useMetaStore.ts    # Progreso persistente del jugador, hidratado desde Dexie al arrancar
├── engine/                 # Simulación pura — sin imports de React/Pixi
│   ├── types.ts           # BattleUnit
│   ├── collision.ts       # overlaps1D — AABB en 1D
│   ├── combat.ts          # resolveEngagement, resolveBaseDamage
│   └── simulation.ts      # stepSimulation — el reducer puro de un tick completo
├── game/                   # Puente hacia Pixi.js
│   ├── BattleStage.tsx    # <Application> de Pixi + BattleField (mount/unmount por unidad)
│   ├── UnitSprite.tsx     # Cuerpo Graphics + animación por transform en cada tick
│   └── animation.ts       # Funciones puras: Cat → VisualProfile, pose de animación por frame
├── data/
│   ├── cats.ts            # Catálogo de gatos (stats)
│   └── levels.ts          # Niveles (bases, energía, oleada enemiga)
└── db/index.ts             # Esquema Dexie + ensureDefaultProfile()
```

### Flujo de pantallas

`App.tsx` mantiene un `useState<Screen>` simple (sin router) y renderiza la pantalla activa por `switch`. Al montar, hidrata `useMetaStore` desde IndexedDB antes de mostrar nada.

```
Title ──(Jugar/Continuar)──▶ MainMenu ──▶ LevelSelect ──(Jugar nivel)──▶ Battle ──▶ Result
                                │                                                    │
                                ├──▶ Gacha                              (Volver) ────┘
                                └──▶ Upgrade
```

`LevelSelectScreen` llama a `useGameStore.startLevel(levelId)` y navega a `Battle`. `Gacha` y `Upgrade` son stubs de navegación (sin lógica todavía).

### Motor de combate (`src/engine/`)

Determinista y puro — `stepSimulation(state, deltaSeconds) → nextState`, sin timers propios ni side effects:

1. **Energía y cooldowns** avanzan según `deltaSeconds`.
2. **Spawns de oleada**: se generan las `BattleUnit` enemigas cuyo `spawnAtSeconds` ya venció (`src/data/levels.ts`).
3. **Detección de combate**: para cada unidad viva se busca la primera unidad enemiga que se superpone en X (`overlaps1D`, AABB 1D) — de haberla, ambas quedan `Engaged`; si no, se comprueba superposición con la base enemiga (`Engaged` contra base); si tampoco, la unidad avanza libremente (bloqueada solo por aliados delante que no estén `Moving`).
4. **Resolución de daño**: `resolveEngagement` (unidad vs. unidad) y `resolveBaseDamage` (unidad vs. base) aplican daño simultáneo según el cooldown de ataque propio de cada unidad; la muerte (`hp <= 0`) se marca en el mismo tick.
5. **Condición de victoria/derrota**: `enemyBase.hp <= 0` → `Victory`; `playerBase.hp <= 0` → `Defeat`.

`useGameStore.tick(deltaSeconds)` simplemente llama a `stepSimulation(get(), deltaSeconds)` y aplica el resultado — el store no contiene lógica de combate propia.

### Capa de render (`src/game/`)

- `BattleStage.tsx`: monta el `<Application>` de Pixi (vía `@pixi/react`) y su `useTick` maestro llama a `useGameStore.getState().tick(deltaSeconds)` en cada frame. `BattleField` solo dispara `setState` de React (re-render) cuando cambia el **conjunto** de `instanceId`s activos (nace/muere una unidad) — nunca por su posición.
- `UnitSprite.tsx`: por cada unidad activa, dibuja su cuerpo (`Graphics`) **una sola vez** a partir de `getVisualProfile(cat)`, y en un `useTick` propio lee la unidad fresca directo de `useGameStore.getState()` por `instanceId` para mutar `position`/`scale`/`rotation` vía `ref` — sin pasar por props ni re-render de React.
- `animation.ts`: funciones puras — `getVisualProfile(cat)` deriva tamaño/redondeo/color de acento/ritmo de idle de los stats ya existentes del gato (sin campos nuevos de contenido); `getAnimationPose(...)` calcula la pose (bob de idle o squash/rotación de ataque) para un instante dado.

### Estado (Zustand)

- **`useGameStore`** — estado de la partida en curso: `status`, energía, HP de bases, `units[]`, cooldowns de despliegue, tiempo transcurrido. Completamente efímero: `reset()` lo vuelve a `Idle`, nunca se persiste (Constitución § V).
- **`useMetaStore`** — progreso persistente del jugador: moneda, niveles desbloqueados/completados, gatos poseídos y su nivel, ajustes. Se hidrata una vez desde Dexie al arrancar (`hydrate()`) y cada acción de mutación escribe de inmediato en IndexedDB (sin paso de "guardar" separado).

### Persistencia (`src/db/index.ts`)

Dexie sobre IndexedDB, base `BattleCatsDB`, 4 tablas singleton/por-clave: `playerProfile` (moneda, nivel más alto desbloqueado), `ownedCats` (roster con nivel/XP invertida), `levelProgress` (completado + timestamp), `settings` (volumen, idioma). `ensureDefaultProfile()` es idempotente y siembra el perfil por defecto y el primer gato garantizado en la primera sesión.

### Testing

Vitest + Testing Library + `fake-indexeddb` (jsdom). La suite cubre `src/engine/` (colisión, combate, simulación), los stores (`useGameStore`, `useMetaStore`, incluyendo Dexie con `fake-indexeddb`), `animation.ts`, y al menos una pantalla (`TitleScreen`). El motor de combate se testea sin canvas ni árbol de componentes, por diseño (Constitución § VI).

---

## Documentación adicional

- [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — principios de diseño no negociables del proyecto.
- [`specs/001-nucleo-del-juego/`](specs/001-nucleo-del-juego/), [`specs/002-motor-de-combate/`](specs/002-motor-de-combate/), [`specs/003-identidad-visual-animada/`](specs/003-identidad-visual-animada/) — spec/plan/tasks de cada feature.
- [`docs/`](docs/) — material de diseño y rediseño visual adicional (guías de estilo, roadmap de fases, referencia de manual técnico).
