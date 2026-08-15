# Feature Specification: Núcleo del Juego — Bucle de Combate, Estado y Persistencia

**Feature Branch**: `001-nucleo-del-juego`

**Created**: 2026-08-14

**Status**: Draft

**Input**: "Vamos a construir un juego 2D estilo 'The Battle Cats' para la web — 100% web nativo (React + Pixi.js + Zustand + Dexie), Tower Defense 1D, colisiones en eje X, sistema de economía/cooldowns."

**Nota de alcance**: Este es el documento fundacional del proyecto `battle-cats-web` — no es una migración ni una referencia de ningún otro proyecto. Define desde cero la arquitectura de las cuatro capas del juego (UI, motor de juego, estado, persistencia) y el bucle jugable central. Toda spec futura de este repositorio construye sobre lo que este documento fija.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jugar el bucle central: desplegar, combate automático, victoria/derrota (Priority: P1)

Un jugador entra a un nivel, ve un recurso de energía acumularse automáticamente con el tiempo, despliega gatos (unidades) predefinidos pagando ese recurso — sujeto a un costo y a un cooldown individual por unidad — y observa que cada unidad avanza sola por el carril hasta chocar con un enemigo o con la base enemiga, momento en que combate automáticamente. La batalla termina cuando la base del jugador o la base enemiga llega a cero de salud.

**Why this priority**: Es el bucle jugable completo — sin esto no hay juego, es el único requisito verdaderamente bloqueante de todo lo demás.

**Independent Test**: Cargar un nivel de prueba, esperar a que la energía alcance el costo de la primera unidad disponible, desplegarla, y confirmar que avanza sola, combate automáticamente al chocar con un enemigo o con la base enemiga, y que la batalla resuelve a victoria o derrota sin ninguna otra acción del jugador sobre la unidad ya desplegada.

**Acceptance Scenarios**:

1. **Given** el jugador está en un nivel con energía en cero, **When** pasa el tiempo, **Then** la energía se acumula automáticamente hasta permitir desplegar la primera unidad.
2. **Given** el jugador tiene energía suficiente, **When** despliega una unidad, **Then** la unidad aparece en la posición de la base del jugador y avanza sola en el eje X hacia la base enemiga, y la energía se descuenta según el costo de esa unidad.
3. **Given** una unidad fue desplegada, **When** su cooldown individual no expiró, **Then** el jugador no puede volver a desplegar esa misma unidad hasta que termine.
4. **Given** una unidad del jugador avanza y su rectángulo de colisión en X se superpone con el de una unidad enemiga, **When** eso ocurre, **Then** ambas dejan de avanzar y combaten automáticamente (intercambio de daño a intervalos regulares) hasta que una muere.
5. **Given** ninguna unidad enemiga bloquea el camino, **When** una unidad del jugador llega a superponerse en X con la base enemiga, **Then** inflige daño directo a la base enemiga a intervalos regulares, sin necesidad de otra unidad presente.
6. **Given** la base del jugador o la base enemiga llega a cero de salud, **When** eso ocurre, **Then** la batalla termina de inmediato mostrando victoria o derrota según qué base sigue en pie.

---

### User Story 2 - El progreso del jugador persiste entre sesiones (Priority: P1)

Un jugador que cierra el navegador y vuelve más tarde encuentra exactamente el mismo estado: su moneda acumulada, los niveles que desbloqueó, los gatos que posee y su nivel de mejora, y sus ajustes de audio/idioma — todo tal como lo dejó.

**Why this priority**: Sin persistencia, cada sesión empieza de cero — el juego no tiene continuidad, que es un requisito tan fundamental como el propio combate.

**Independent Test**: Jugar una partida, ganar un nivel, cerrar la pestaña del navegador, volver a abrir la aplicación, y confirmar que la moneda, el nivel desbloqueado y el roster de gatos reflejan exactamente lo que había antes de cerrar.

**Acceptance Scenarios**:

1. **Given** el jugador gana un nivel, **When** la victoria se resuelve, **Then** la moneda ganada y el desbloqueo del siguiente nivel quedan guardados de inmediato, sin acción manual de "guardar".
2. **Given** el jugador cierra y reabre la aplicación, **When** carga la pantalla principal, **Then** ve exactamente el mismo estado de moneda, niveles desbloqueados, roster de gatos y ajustes que tenía antes de cerrar.
3. **Given** el almacenamiento local del navegador está vacío (primera vez que se abre la aplicación), **When** carga, **Then** se inicializa con un estado por defecto jugable (un gato inicial, el primer nivel desbloqueado, moneda en cero) sin ningún error visible.

---

### User Story 3 - Obtener nuevos gatos por gacha y mejorarlos (Priority: P2)

Un jugador con suficiente moneda usa la pantalla de Gacha para obtener un gato nuevo al azar de un pool configurado, y usa la pantalla de Mejora para gastar moneda y subir de nivel a un gato que ya posee, aumentando sus estadísticas de combate.

**Why this priority**: Es la capa de meta-progresión que le da sentido a jugar más de un nivel — importante para la retención, pero el bucle de combate (US1) ya es una demo jugable sin ella.

**Independent Test**: Con moneda suficiente, usar el Gacha y confirmar que un gato nuevo aparece en el roster; con un gato ya poseído y moneda suficiente, mejorarlo y confirmar que sus estadísticas de combate (salud/daño) aumentan en la siguiente batalla donde se despliegue.

**Acceptance Scenarios**:

1. **Given** el jugador tiene moneda suficiente para una tirada de Gacha, **When** la ejecuta, **Then** obtiene un gato del pool configurado (nuevo o ya poseído, según las reglas del pool) y su moneda se descuenta por el costo de la tirada.
2. **Given** el jugador no tiene moneda suficiente, **When** intenta usar el Gacha, **Then** el sistema lo impide sin descontar nada.
3. **Given** el jugador tiene un gato con moneda suficiente para mejorarlo, **When** confirma la mejora, **Then** el nivel del gato sube, sus estadísticas de combate aumentan según una curva definida, y la moneda se descuenta.

---

### User Story 4 - Seleccionar y avanzar por niveles (Priority: P2)

Un jugador ve una lista de niveles, entra a uno ya desbloqueado, y al ganarlo ve el siguiente nivel desbloqueado — sin poder saltarse niveles todavía bloqueados.

**Why this priority**: Conecta "jugar una batalla" (US1) con "progresar en el juego" — sin esto, ganar una batalla no tiene ninguna consecuencia sobre qué se puede jugar después.

**Independent Test**: Ganar el primer nivel, volver a la selección de niveles, y confirmar que el segundo nivel aparece desbloqueado mientras el tercero sigue bloqueado.

**Acceptance Scenarios**:

1. **Given** el jugador completa un nivel con victoria, **When** vuelve a la selección de niveles, **Then** el siguiente nivel de la lista aparece desbloqueado.
2. **Given** un nivel todavía no está desbloqueado, **When** el jugador intenta entrar, **Then** el sistema lo impide.

---

### Edge Cases

- ¿Qué pasa si dos unidades enemigas llegan a la misma posición X casi simultáneamente frente a una unidad del jugador? La unidad del jugador combate contra la primera con la que su rectángulo de colisión se superpone; el resto espera detrás en cola (no se superponen entre sí en X mientras una está "ocupada" combatiendo, ver `plan.md` para la regla exacta de bloqueo de carril).
- ¿Qué pasa si el jugador recarga la página a mitad de una batalla en curso? El estado de la batalla en curso se pierde (no se persiste); el progreso ya guardado (niveles completados, roster) antes de entrar a esa batalla no se ve afectado.
- ¿Qué pasa si el jugador intenta desplegar una unidad sin energía suficiente? El sistema lo impide sin ningún efecto.
- ¿Qué pasa si el jugador no tiene ningún gato en su roster en la primera sesión? El estado inicial por defecto (US2, Acceptance Scenario 3) siempre incluye al menos un gato jugable.
- ¿Qué pasa si `IndexedDB` no está disponible en el navegador del jugador (modo privado restrictivo, navegador muy antiguo)? El juego debe seguir siendo jugable en memoria durante esa sesión, mostrando al jugador que su progreso no se está guardando, en vez de bloquear el juego con un error.

## Arquitectura UI (React)

React gobierna todo lo que **no** es la superficie de juego en tiempo real: pantallas de menú, formularios, listas, y cualquier UI que reaccione a eventos discretos del jugador (clicks, navegación) en vez de a un bucle de 60fps.

**Pantallas**:
- `TitleScreen` — pantalla de título, botón "Jugar" (o "Continuar" si ya hay progreso guardado).
- `MainMenuScreen` (Hub) — accesos a Selección de Nivel, Gacha, Mejora de Gatos, Ajustes; muestra moneda actual.
- `LevelSelectScreen` — lista de niveles con su estado (bloqueado/desbloqueado/completado).
- `GachaScreen` — costo de tirada, animación/resultado de la tirada, pool visible o no según diseño.
- `UpgradeScreen` — lista del roster del jugador, costo/efecto de mejorar cada gato.
- `BattleScreen` — aloja el `<canvas>` de Pixi.js (Fase Core del Juego) más una capa fina de UI superpuesta en React (barra de energía, botones de despliegue, salud de bases, botón de pausa/rendición).
- `ResultScreen` — victoria/derrota, recompensas obtenidas, navegación de vuelta a `LevelSelectScreen`.

**Navegación**: enrutamiento simple basado en estado (una pantalla activa a la vez, sin necesidad de URLs profundas para un MVP) — `react-router` queda disponible para adoptarse más adelante si el proyecto lo requiere, no es un requisito de esta spec.

**Regla de frontera**: ningún componente de React re-renderiza en respuesta al tick de 60fps del combate — la capa de UI superpuesta en `BattleScreen` (energía, salud de bases) se suscribe a `useGameStore` (ver Gestor de Estado) con selectores acotados, para que solo esos valores puntuales disparen render, nunca el árbol completo de `BattleScreen`.

## Arquitectura Core del Juego (Pixi.js)

Pixi.js gobierna exclusivamente la superficie de combate en tiempo real — un único `<canvas>` WebGL montado dentro de `BattleScreen`, vía `@pixi/react`.

**Bucle de juego**: un `Ticker` de Pixi corriendo a 60fps (o el refresco del dispositivo) impulsa cada frame: (1) mover cada unidad activa en el eje X según su velocidad, salvo que esté bloqueada por combate; (2) evaluar colisiones; (3) resolver combate para las unidades bloqueadas; (4) aplicar regeneración de energía; (5) evaluar condición de victoria/derrota. El bucle es la única fuente de verdad del estado de una batalla en curso — la UI de React solo lee, nunca escribe directamente sobre la simulación.

**Detección de colisión (AABB en 1D)**: cada unidad y cada base tienen un `x` (posición) y un `width` (ancho de su rectángula de colisión); dos entidades "se superponen" cuando sus intervalos `[x, x+width]` se solapan en el eje X — no hay eje Y relevante dentro de un mismo carril (un juego con más de un carril simplemente repite esta misma comprobación de forma independiente por carril, sin ninguna interacción entre carriles distintos). Una unidad avanza mientras no haya ninguna superposición con una entidad enemiga por delante de su posición; dos entidades superpuestas quedan "bloqueadas" (dejan de moverse) hasta que una de las dos muere.

**Renderizado de sprites**: cada unidad activa es un `Sprite`/`AnimatedSprite` de Pixi con al menos dos estados de animación (movimiento/idle y ataque) — un pool de sprites reutilizables evita crear/destruir texturas en cada despliegue.

**Separación de responsabilidades**: la simulación (posiciones, salud, colisiones, resolución de combate) vive en funciones puras de TypeScript, independientes de Pixi — Pixi solo lee ese estado cada frame para posicionar/animar sprites. Esto permite testear las reglas de combate con Vitest sin levantar un canvas.

## Gestor de Estado (Zustand)

Dos stores con responsabilidades disjuntas — ninguno depende del otro, se comunican únicamente a través de acciones explícitas (p. ej. "la batalla terminó en victoria" dispara una acción que `useMetaStore` consume, nunca una lectura cruzada directa de un store dentro del otro).

### `useGameStore` — estado de la partida en curso, efímero, no persistido

```ts
interface GameState {
  status: "Idle" | "InProgress" | "Victory" | "Defeat";
  levelId: string | null;
  energy: { current: number; max: number; regenPerSecond: number };
  playerBase: { hp: number; maxHp: number };
  enemyBase: { hp: number; maxHp: number };
  units: BattleUnit[]; // unidades activas en el carril, jugador + enemigo
  deployCooldowns: Record<string, number>; // catId -> segundos restantes de cooldown

  startLevel: (levelId: string) => void;
  tick: (deltaSeconds: number) => void; // avanzado por el Ticker de Pixi, no por React
  deployUnit: (catId: string) => boolean; // false si no hay energía o está en cooldown
  reset: () => void;
}

interface BattleUnit {
  instanceId: string;
  catId: string;
  team: "Player" | "Enemy";
  x: number;
  width: number;
  hp: number;
  maxHp: number;
  damage: number;
  attackIntervalSeconds: number;
  attackCooldownRemaining: number;
  speed: number; // unidades de X por segundo, 0 mientras está bloqueada en combate
  state: "Moving" | "Engaged" | "Dead";
}
```

### `useMetaStore` — progreso persistente del jugador, hidratado desde Dexie al arrancar

```ts
interface MetaState {
  isHydrated: boolean; // true una vez que la carga inicial desde Dexie terminó
  currency: number;
  highestUnlockedLevelIndex: number;
  completedLevelIds: string[];
  ownedCats: Record<string, { level: number; experienceInvested: number }>;
  settings: { musicVolume: number; sfxVolume: number; language: string };

  hydrate: () => Promise<void>; // lee de Dexie al arrancar la app
  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  unlockNextLevel: () => void;
  markLevelCompleted: (levelId: string) => void;
  addOwnedCat: (catId: string) => void;
  upgradeCat: (catId: string) => boolean;
  updateSettings: (partial: Partial<MetaState["settings"]>) => void;
}
```

Toda acción de `useMetaStore` que cambia estado persistente escribe también a Dexie (ver Persistencia) en el mismo paso — no hay un botón de "guardar" separado ni un guardado diferido.

## Persistencia (Dexie.js)

Una única base de datos IndexedDB local al navegador, sin backend remoto. Dexie gestiona el esquema y las transacciones; `useMetaStore.hydrate()` es el único punto de lectura al arrancar, y cada acción mutadora de `useMetaStore` es el único punto de escritura.

```ts
// db.ts
import Dexie, { type Table } from "dexie";

interface PlayerProfileRow {
  id: 1; // fila única (singleton)
  currency: number;
  highestUnlockedLevelIndex: number;
  createdAt: number;
}

interface OwnedCatRow {
  catId: string; // clave primaria
  level: number;
  experienceInvested: number;
}

interface LevelProgressRow {
  levelId: string; // clave primaria
  isCompleted: boolean;
  completedAtTimestamp: number | null;
}

interface SettingsRow {
  id: 1; // fila única (singleton)
  musicVolume: number;
  sfxVolume: number;
  language: string;
}

class BattleCatsDB extends Dexie {
  playerProfile!: Table<PlayerProfileRow, number>;
  ownedCats!: Table<OwnedCatRow, string>;
  levelProgress!: Table<LevelProgressRow, string>;
  settings!: Table<SettingsRow, number>;

  constructor() {
    super("BattleCatsDB");
    this.version(1).stores({
      playerProfile: "id",
      ownedCats: "catId",
      levelProgress: "levelId",
      settings: "id",
    });
  }
}

export const db = new BattleCatsDB();
```

**Reglas**: si `playerProfile`/`settings` no tienen fila al arrancar (primera sesión), `hydrate()` crea el estado por defecto (US2 Edge Case) y lo escribe antes de resolver. Ninguna tabla depende de un backend — toda la validación (fondos suficientes, nivel desbloqueado) ocurre en `useMetaStore`/`useGameStore` antes de tocar Dexie, nunca al revés.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE acumular automáticamente un recurso de energía con el tiempo durante una batalla, con una tasa de regeneración configurable por nivel.
- **FR-002**: Los jugadores DEBEN poder desplegar unidades predefinidas pagando energía, sujeto a un costo y a un cooldown individual por unidad.
- **FR-003**: El sistema DEBE mover automáticamente cada unidad desplegada en el eje X hacia la base enemiga (o hacia la base del jugador, si es una unidad enemiga) hasta que su rectángulo de colisión se superponga con el de una entidad enemiga.
- **FR-004**: El sistema DEBE resolver el combate entre dos entidades cuyos rectángulos de colisión se superponen mediante intercambio de daño a intervalos regulares, hasta que una muere.
- **FR-005**: El sistema DEBE aplicar daño directo a una base cuando una unidad enemiga a esa base logra superponerse con su rectángulo de colisión, sin requerir ninguna otra unidad presente.
- **FR-006**: El sistema DEBE terminar la batalla en victoria o derrota exactamente cuando la salud de la base enemiga o la base del jugador, respectivamente, llega a cero.
- **FR-007**: El sistema DEBE persistir automáticamente, sin acción manual del jugador, cualquier cambio a la moneda, al desbloqueo de niveles, al roster de gatos poseídos y a los ajustes.
- **FR-008**: El sistema DEBE restaurar exactamente el mismo estado persistido al recargar o reabrir la aplicación.
- **FR-009**: El sistema DEBE inicializar un estado por defecto jugable (moneda en cero, un gato inicial, el primer nivel desbloqueado) cuando no existe ningún dato persistido previo.
- **FR-010**: Los jugadores DEBEN poder obtener un gato nuevo mediante una tirada de Gacha, pagando su costo en moneda, solo si tienen fondos suficientes.
- **FR-011**: Los jugadores DEBEN poder mejorar un gato que ya poseen pagando moneda, aumentando sus estadísticas de combate según una curva definida.
- **FR-012**: El sistema DEBE desbloquear el siguiente nivel de la lista al completar el nivel anterior con victoria, e impedir el acceso a niveles todavía no desbloqueados.
- **FR-013**: El sistema NO DEBE persistir el estado de una batalla en curso — solo el resultado final (victoria/derrota) y sus efectos sobre moneda/desbloqueo se guardan.

### Key Entities *(include if feature involves data)*

- **Cat (Unidad)**: definición de una unidad jugable — costo, cooldown, salud, daño, velocidad, ancho de colisión, intervalo de ataque, animaciones.
- **Level (Nivel)**: contenido de una batalla — oleadas/composición enemiga, salud de ambas bases, recompensa de moneda, tasa de regeneración de energía.
- **PlayerProfile**: moneda actual, nivel más alto desbloqueado.
- **OwnedCat**: la relación entre el jugador y un `Cat` — nivel de mejora, experiencia invertida.
- **BattleUnit**: instancia en tiempo real de un `Cat` desplegado en una batalla — posición, salud actual, estado de combate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador nuevo puede completar el primer nivel (desplegar, ver combate automático, llegar a un resultado) sin instrucciones externas, en menos de 3 minutos desde que carga la página por primera vez.
- **SC-002**: El 100% de las victorias y desbloqueos de nivel sobreviven a cerrar y reabrir la aplicación, sin pérdida de datos.
- **SC-003**: El bucle de combate corre de forma fluida y perceptible como fluida (sin tirones) en un dispositivo de gama media, con al menos 10 unidades activas simultáneas en pantalla.
- **SC-004**: Un jugador puede obtener un gato nuevo por Gacha y verlo disponible para desplegar en la siguiente batalla sin recargar la página.

## Assumptions

- El MVP cubre un único carril de combate por nivel; múltiples carriles simultáneos (si se decide más adelante) reutilizan la misma regla de colisión AABB en 1D de forma independiente por carril, sin interacción entre carriles.
- El pool y las probabilidades del Gacha son contenido configurable (no se fija ningún valor concreto en esta spec) — se definen como datos, no como lógica hardcodeada, siguiendo el mismo criterio de "balance dirigido por datos" que el resto del juego.
- No existe backend remoto en el alcance de esta spec — toda la persistencia es local al navegador vía Dexie/IndexedDB; sincronización entre dispositivos o cuentas de jugador queda fuera de alcance hasta una spec futura explícita.
- El estado de una batalla en curso (`useGameStore`) es intencionalmente efímero — no sobrevive a un recargo de página (ver Edge Cases); esto es una decisión de diseño, no una limitación pendiente de resolver.
