# Research: Reskin Visual Cyber-Modern + Sprites Reales de Combate

No quedó ningún `NEEDS CLARIFICATION` en el Technical Context de `plan.md` — las decisiones de esta fase resuelven las alternativas técnicas de implementación (el "CÓMO"), no ambigüedades de alcance (esas ya se resolvieron en `spec.md`, Assumptions).

## Decisión 1: Tema visual en CSS plano, iconos con la dependencia ya instalada — cero dependencias nuevas

**Decisión**: El catálogo de tema (`src/theme.css`) se implementa como `:root` custom properties + clases utilitarias en CSS plano, importado una vez desde `src/index.css`. Los iconos usan `lucide-react`, ya presente en `package.json` sin uso hasta ahora.

**Rationale**: El proyecto no tiene ninguna dependencia de CSS-in-JS ni de UI kit — todas las pantallas actuales usan `className` string sobre CSS plano (`src/index.css`, clases como `.level-list`/`.deploy-bar`). Seguir ese mismo patrón evita introducir una segunda convención de estilo a mitad de proyecto (Constitución § VII). `lucide-react` ya fue instalado en una sesión anterior específicamente para esto (coincide con el set de iconos SVG que usa el mockup de referencia) — usarlo cierra una dependencia que hoy está inerte, en vez de sumar una nueva.

**Alternatives considered**:
- *CSS Modules por pantalla*: mayor aislamiento de estilos, pero exige renombrar 12 archivos a `.module.css` y no aporta nada sobre el problema real (falta de estilo alguno) — se descarta por sobre-ingeniería para el tamaño del proyecto.
- *styled-components / Emotion*: dependencia nueva de runtime, inconsistente con la ausencia total de CSS-in-JS en el resto del código — descartado.
- *Mantener emoji/ASCII*: ya evaluado y descartado explícitamente por el usuario en la ronda de alcance previa a esta spec (ver Assumptions de `spec.md`).

## Decisión 2: `AnimatedSprite` se dirige por el mismo patrón `useTick` + mutación directa que ya usa `Graphics`

**Decisión**: `UnitSprite`/`DeathEchoSprite` mantienen exactamente su arquitectura actual — un `useTick` propio por instancia que lee `useGameStore.getState()` directo (sin selector reactivo) y muta el `Container` cada frame. Lo único que cambia es que, en vez de mutar solo transform sobre una figura `Graphics` ya dibujada, ese mismo callback también decide qué arreglo de texturas (idle/attack) debe estar activo en el `AnimatedSprite` hijo, y lo cambia por asignación directa de `.textures` cuando `getAnimationState(unit.state)` cambia de valor — no en cada frame.

**Rationale**: `specs/003-identidad-visual-animada/research.md` ya estableció (y la Constitución § VI lo exige) que ningún componente de React puede re-renderizar por el tick de 60fps de la simulación. Ese patrón ya resuelto no se toca — solo se extiende el *contenido* de lo que el `useTick` mutaba. Cambiar de arreglo de texturas solo en las transiciones de estado (no cada frame) evita reasignar `.textures` 60 veces por segundo por unidad, que sería el error de rendimiento más fácil de introducir aquí.

**Alternatives considered**:
- *Reconstruir el `AnimatedSprite` en cada cambio de estado (unmount/mount)*: más simple de escribir, pero reintroduce el costo de creación de objeto Pixi por transición que el patrón actual evita para las 10+ unidades simultáneas del objetivo de rendimiento — descartado.
- *Delegar la animación a `AnimatedSprite.play()` con `loop=true` y dejar que Pixi controle el avance de frame internamente*: viable y de hecho se usa así para el avance de frame dentro de cada estado (idle/attack); lo que sigue gobernando este `useTick` es exclusivamente *cuál* arreglo de texturas está activo y el transform (bob/squash/rotación) que ya existía — no se reemplaza el mecanismo de reproducción de `AnimatedSprite`, se reutiliza.

## Decisión 3: Asignación de sprite determinista por orden de catálogo, sin curaduría temática

**Decisión**: `spriteKey` se añade como campo opcional a `Cat` (`src/data/cats.ts`) y se puebla a mano, en el propio archivo de datos, asignando `hero_1`…`hero_12` (variante `male`) a los 12 `CATS` existentes en el mismo orden en que ya aparecen en el array.

**Rationale**: `assets-source/units/Characters/hero_1`…`hero_30` es un pack de arte genérico (30 personajes humanoides numerados, variantes `male`/`female`, sin ningún nombre, tag o metadata que indique "tanque", "veloz", etc.) — no existe ninguna señal en el propio pack para curar una asignación temática mejor que otra. Fijar un criterio determinista y documentado en el propio dato (FR-009 de spec.md) es más barato y más auditable que introducir un paso de curación manual basado en inspeccionar 30 spritesheets, y dado que enemigos y jugador comparten el mismo catálogo `CATS` (`src/data/levels.ts` reutiliza los mismos `catId` para oleadas enemigas), un único `spriteKey` por gato ya cubre ambos lados sin trabajo adicional.

**Alternatives considered**:
- *Curar manualmente qué héroe "parece" cada arquetipo (tanque, veloz, etc.)*: requeriría renderizar/inspeccionar visualmente 30 personajes sin ninguna base objetiva de decisión — alto costo, cero valor verificable, y contradice la Assumption ya fijada en `spec.md` de que esta es una decisión de contenido determinista, no curatorial.
- *Generar la asignación en runtime (hash del `catId`)*: añade indirección sin beneficio — la lista de 12 gatos es fija y pequeña; una tabla explícita en el dato es más legible y más fácil de auditar en review que una función de hash.

## Decisión 4: Glow por equipo simulado con trazos `Graphics` concéntricos, sin paquete de filtros

**Decisión**: El anillo de resplandor cian (jugador) / rojo (enemigo) detrás de cada unidad se dibuja como 2–3 `roundRect`/`circle` concéntricos del color de equipo con alpha decreciente hacia afuera, usando la misma API `Graphics` que el proyecto ya usa — no se añade `pixi-filters` ni `DropShadowFilter`.

**Rationale**: Ni `pixi-filters` ni ningún paquete de filtros está instalado hoy; añadirlo solo para un glow cosmético contradice la Constitución § VII (simplicidad) cuando el mismo efecto visual es alcanzable con geometría simple, que además es más barata en GPU para 10+ unidades simultáneas que un filtro de post-proceso por sprite.

**Alternatives considered**:
- *`pixi-filters` `DropShadowFilter`/`GlowFilter`*: resultado visualmente más suave, pero dependencia nueva + costo de filtro por sprite en un límite de rendimiento ya fijado (60fps/10 unidades) — descartado por ahora; queda como posible mejora futura si el resultado con `Graphics` no convence visualmente durante `quickstart.md`.
- *Sprite de gradiente radial pre-renderizado (mismo enfoque que la spec Unity análoga, `022-cyber-modern-theme`, usó para paneles)*: razonable, pero exige generar y mantener un asset de imagen adicional para algo que la geometría `Graphics` ya resuelve sin arte nuevo — descartado por YAGNI.

## Decisión 5: Pipeline de sprites — copia selectiva a `public/`, script manual fuera del build

**Decisión**: Un script Node (`scripts/copy-sprites.mjs`, ejecutado a mano una sola vez, nunca desde `npm run dev`/`build`) copia únicamente las carpetas `1_idle` y `4_attack` de los 12 `hero_N` asignados desde `assets-source/units/Characters/hero_N/male/` hacia `public/sprites/hero_N/{idle,attack}/`, renombrando los frames a una secuencia simple (`1.png`…`16.png`). El resto de `assets-source/` (18 héroes no usados, `2_walk`/`3_run`/`5_block`/`6_die`, el pack `MonstersCreaturesFantasy2`, banners, fuentes, ScriptableObjects, archivos `.meta`) no se toca.

**Rationale**: `assets-source/` tiene más de 12k archivos — servirlo completo desde `public/` (o simplemente no filtrarlo) infla el dev server y cualquier build sin ningún beneficio, ya que `animation.ts` solo distingue dos estados (`Idle`/`Attacking`, ver `src/game/animation.ts` actual). Copiar solo lo que realmente se renderiza mantiene `public/sprites/` en 336 archivos (12 gatos × (16 idle + 12 attack)), proporcional al catálogo real de 12 gatos. Que sea un script manual (no parte de `vite build`) es consistente con que `assets-source/` ya es, hoy, un área de staging fuera del árbol servido — este pipeline no cambia esa relación, solo automatiza copiar el subconjunto necesario en vez de hacerlo a mano archivo por archivo.

**Alternatives considered**:
- *Importar los PNG como módulos ES vía Vite (`import` + `new URL(..., import.meta.url)`)*: viable para un puñado de assets, pero para 336 archivos con nombres generados dinámicamente (`hero_${n}`) es más frágil que rutas estáticas bajo `public/` resueltas en runtime por el manifest de `spriteAssets.ts` — descartado por complejidad innecesaria.
- *Servir `assets-source/` directo (symlink o `publicDir` adicional)*: descartado — expone 12k archivos irrelevantes (incluye `.meta` de Unity, variantes no usadas) al dev server/build sin ningún filtrado.

## Nota: accesibilidad de movimiento (edge case de spec.md)

Las animaciones puramente cosméticas (pulso del botón CTA, parpadeo del glow) se envuelven en `@media (prefers-reduced-motion: reduce)` dentro de `theme.css`, desactivando la animación CSS sin afectar disponibilidad del control — mismo mecanismo nativo que ya cubre este caso sin lógica adicional en componentes. La animación de sprites en el campo de batalla (idle/ataque) no se considera "puramente cosmética" a efectos de esta preferencia — es la representación primaria del estado de la unidad, no un adorno, y se mantiene igual que hoy.
