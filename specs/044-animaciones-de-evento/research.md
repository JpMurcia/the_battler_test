# Research: Animaciones de Evento

Sin `NEEDS CLARIFICATION` en el contexto técnico. Decisiones tomadas leyendo el código actual (`UnitSprite.tsx`, `DeathEchoSprite.tsx`, `BattleStage.tsx`, `animation.ts`, `engine/combat.ts`) y la biblia de arte.

## Decisión 1 — Detección de eventos por diferencias entre fotogramas, dentro de `UnitSprite`

- **Decisión**: cada `UnitSprite` guarda la última vida, escudo y posición observadas y detecta golpe (bajada de vida o escudo > 0,01), empujón (desplazamiento hacia su propia base > 0,01 unidades de carril) y aparición (montaje del componente). La muerte ya la detecta `BattleField` (eco).
- **Motivo**: es el patrón vigente (eco y chispas se disparan así) y deja el motor intacto (FR-008). Las unidades nunca caminan hacia atrás (`simulation.ts`: el avance solo suma en la dirección del bando y el bloqueo deja `x` igual), así que cualquier retroceso es un empujón (`knockBack` en `combat.ts`, por habilidad o cañón).
- **Alternativas**: eventos explícitos del motor (rompe FR-008 y § VI en espíritu, más superficie); detección centralizada en `BattleField` con un mapa por unidad (duplica el `find` que `UnitSprite` ya hace y necesitaría pasar datos a cada sprite).

## Decisión 2 — Rastreador mutable y puro (`UnitEventState`)

- **Decisión**: un objeto por unidad, mutado en el `useTick` (sin asignaciones por fotograma), con funciones puras `createUnitEventState`, `updateUnitEvents` y `getUnitEventPose` testeables sin Pixi.
- **Motivo**: toda la lógica con riesgo (límite de 3/s, reinicio de un empujón desde la posición visible, fin exacto en la pose normal) queda cubierta por Vitest (FR-011).

## Decisión 3 — Destello con un `ColorMatrixFilter` compartido y binario

- **Decisión**: una única instancia de filtro, creada bajo demanda, con la matriz `rgb' = 0,35·rgb + 0,65` (alfa intacto). Se asigna a `body.filters` al empezar el destello y se quita a los 0,08 s; solo se escribe al cambiar.
- **Motivo**: el tinte de Pixi multiplica y no puede aclarar; una segunda textura de silueta por unidad no cubre los fotogramas de los sprites y duplica memoria. Un filtro compartido con intensidad fija no necesita uniformes por unidad. El shader de Pixi despremultiplica antes de aplicar la matriz (comprobado en `colorMatrixFilter.frag`), así que el desplazamiento 0,65 está en escala 0–1 y respeta el borde transparente.
- **Coste**: una pasada de filtro por unidad que destella, ≤ 0,08 s y ≤ 3 veces/s. Se valida con 40 unidades (quickstart § 6).
- **Alternativas**: sprite superpuesto con mezcla aditiva (no llega al blanco en unidades oscuras como Eclipse); silueta pregenerada (no sirve para sprites).

## Decisión 4 — Duraciones y amplitudes

| Animación | Duración | Amplitud |
|---|---|---|
| Golpeado | 0,15 s (destello 0,08 s) | sacudida ±1,5 px, 3 oscilaciones amortiguadas |
| Aparición | 0,3 s | aplastamiento inicial 1,3 × 0,65, salto 6 px, opacidad 0→1 en el primer 40 % |
| Retroceso | 0,25 s | deslizamiento con *ease-out*, salto 4 px, inclinación 0,17 rad (≈ 9,7°) |
| Muerte | 0,45 s | 12 px hacia su base, salto 12 px, giro 1,2 rad, opacidad 1 − p² |

Motivo: dentro de los rangos de la investigación (§5.2) y legibles a 14–44 px sin invadir unidades vecinas.

## Decisión 5 — Composición con la pose actual

- **Decisión**: desplazamientos sumados (`x`: sacudida + retroceso; `y`: rebote + salto de aparición + salto de retroceso), escalas multiplicadas (ataque × aparición), rotación sumada y acotada a ±0,2 rad, opacidad = la de aparición. El anillo usa solo el desplazamiento horizontal del retroceso y la opacidad de aparición.
- **Motivo**: FR-006; el ataque inclina hasta +0,15 rad y el retroceso hasta ±0,17, la cota evita sumas exageradas.

## Decisión 6 — Sentido «hacia atrás» por bando

- **Decisión**: `backDir = -1` para el jugador (su base está en `x = 0`, a la izquierda) y `+1` para el enemigo. En Pixi la rotación positiva es horaria: el jugador se inclina y gira en sentido antihorario.

## Decisión 7 — Eco de muerte con pivote centrado

- **Decisión**: el contenedor del eco pasa a pivote `(bodyWidth/2, bodyHeight)` y `x = screenX + bodyWidth/2`; el cuerpo sigue ocupando `[0, bodyWidth]` (anclas y espejo intactos), así que el punto de partida es idéntico y el giro ocurre alrededor de los pies. Duración 0,45 s; ya no se encoge. `UnitSprite` conserva su pivote (no cambia el ataque).

## Decisión 8 — Reducir movimiento

- **Decisión**: `prefersReducedMotion()` lee `matchMedia('(prefers-reduced-motion: reduce)')` una vez (cacheado; los cambios en vivo se reflejan porque se lee `.matches`), con *fallback* `false` sin `window`/`matchMedia`. Con la preferencia: Golpeado y Retroceso no se inician; Aparición y Muerte solo cambian la opacidad.
- **Motivo**: FR-007 y biblia §1 («los pulsos pasan a color fijo»). No existe un ajuste propio en el juego.

## Decisión 9 — Tiempo real y pausa

- **Decisión**: los temporizadores avanzan con `deltaMS` como el reposo y el eco. En pausa no hay eventos nuevos (el motor no avanza) y los iniciados terminan.
- **Motivo**: consistencia con el comportamiento actual; evita que un eco quede congelado a medias.
