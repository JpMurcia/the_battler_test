# Battle Cats Web — Constitution

<!-- Título de trabajo: "Battle Cats Web". Este documento fija las reglas de diseño y técnicas que no cambian mientras el resto del proyecto se construye — deriva de las decisiones ya validadas en specs/001-nucleo-del-juego/spec.md. -->

## Core Principles

### I. Combate Automático por Despliegue (Deployment-Driven Combat)

El núcleo de juego es: un recurso de energía se acumula automáticamente con el tiempo, con una tasa de regeneración mejorable durante la partida; el jugador despliega gatos (unidades) predefinidos pagando ese recurso, sujetos a un costo y a un cooldown individual por unidad; una vez desplegada, la unidad avanza y combate de forma autónoma — no hay control directo del jugador sobre una unidad ya desplegada. La detección de combate es una superposición de rectángulos de colisión en el eje X (AABB en 1D): dos entidades enemigas entre sí que se superponen en X quedan bloqueadas y combaten hasta que una muere; una unidad sin nada por delante sigue avanzando. La base del jugador y la base enemiga son los objetivos de victoria/derrota.

### II. Progresión por Niveles con Desbloqueo Secuencial (Level-Based Unlock Progression)

El contenido se organiza en niveles secuenciales; cada nivel se desbloquea al completar el anterior con victoria. El estado de "nivel desbloqueado/completado" es progreso persistente del jugador, nunca contenido — un nivel no decide su propio estado de desbloqueo, lo hace el guardado del jugador.

### III. Identidad Visual Animada (Beyond Static Sprites)

Cada gato jugable o enemigo requiere, como mínimo, una animación de movimiento/idle y una animación de ataque — nunca un único sprite estático. Ningún gato se considera "completo" si solo tiene una imagen fija; esto es una condición de aceptación, no un nice-to-have.

### IV. Balance Dirigido por Datos (Data-Driven Balance)

Las estadísticas de un gato (costo, cooldown, salud, daño, velocidad, ancho de colisión) y las de un nivel (salud de bases, composición de oleadas, tasa de regeneración de energía) viven en archivos de contenido (`src/data/`), nunca hardcodeadas en `src/engine/`. Esto permite iterar balance sin tocar lógica, y es prerrequisito para que `plan.md`/`tasks.md` puedan generar trabajo verificable.

### V. Persistencia Local-First, Sin Backend (Local-First Persistence)

Todo el progreso del jugador (moneda, niveles desbloqueados, roster de gatos, ajustes) se guarda localmente en el navegador vía IndexedDB (Dexie) — no existe backend remoto ni cuenta de jugador en el alcance actual del proyecto. Cada acción que cambia estado persistente escribe de inmediato, sin un paso de "guardar" separado ni guardado diferido. El estado de una batalla en curso es efímero por diseño y nunca se persiste — solo su resultado final y los efectos de ese resultado sobre el progreso del jugador.

### VI. Separación Estricta entre Motor y UI (Engine/UI Boundary)

La simulación de combate (movimiento, colisión, resolución de daño, regeneración de energía) vive en funciones puras de TypeScript sin ninguna dependencia de React ni de Pixi.js, testeables con Vitest sin levantar un canvas ni un árbol de componentes. React gobierna exclusivamente pantallas y UI reactiva a eventos discretos; Pixi.js gobierna exclusivamente el render en tiempo real de la superficie de combate. Ningún componente de React vuelve a renderizar en respuesta al tick de 60fps del combate — la UI superpuesta durante una batalla lee el estado de la simulación mediante selectores acotados, nunca al revés.

### VII. Simplicidad desde el MVP (Simplicity First / YAGNI)

Se construye primero una vertical slice: un nivel completo, un puñado de gatos, base vs. base — sin economía de gacha balanceada, sin monetización, sin sincronización entre dispositivos. La complejidad añadida fuera de esa slice debe justificarse explícitamente en el `plan.md` correspondiente antes de construirse.

## Restricciones Técnicas

Plataforma: navegador web, 100% frontend — sin backend ni servidor propio. Lenguaje: TypeScript. Build/dev: Vite. UI: React 19. Motor de render de combate: Pixi.js vía `@pixi/react`. Estado: Zustand (`useGameStore` para partida en curso, `useMetaStore` para progreso persistente — ver `specs/001-nucleo-del-juego/spec.md`). Persistencia: Dexie sobre IndexedDB del navegador. Testing: Vitest para `src/engine/` y stores. El proyecto vive en la raíz de este repositorio (`battle-cats-web/`); toda nueva feature relevante para el motor de combate o la persistencia pasa por una spec (`spec.md`/`plan.md`/`tasks.md`) antes de escribirse en código.

## Flujo de Trabajo (Spec-Driven Development)

Todo trabajo no trivial sigue el mismo patrón ya establecido por `specs/001-nucleo-del-juego/`: `spec.md` (QUÉ/POR QUÉ — historias de usuario, requisitos funcionales, criterios de éxito) → `plan.md` (CÓMO — arquitectura, estructura de archivos, secuencia de fases) → `tasks.md` (desglose accionable, organizado por historia de usuario cuando aplica). Las specs se numeran secuencialmente bajo `specs/` (`001-...`, `002-...`, ...).

## Governance

Esta constitución tiene prioridad sobre decisiones ad-hoc de diseño o código. Cualquier cambio a un Core Principle requiere justificación escrita, incrementa la versión (MAJOR si redefine o elimina un principio, MINOR si añade uno nuevo, PATCH si es aclaración de redacción) y actualiza `Last Amended`. Cualquier `plan.md` que se aparte de un principio (por ejemplo, un gato sin animación de ataque, o lógica de combate acoplada a un componente de React) debe declarar explícitamente la excepción y su motivo.

**Version**: 1.0.0 | **Ratified**: 2026-08-14 | **Last Amended**: 2026-08-14
