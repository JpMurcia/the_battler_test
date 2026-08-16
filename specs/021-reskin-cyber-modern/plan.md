# Implementation Plan: Reskin Visual Cyber-Modern + Sprites Reales de Combate

**Branch**: `021-reskin-cyber-modern` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification `specs/021-reskin-cyber-modern/spec.md`

## Summary

Aplicar la identidad visual "Cyber-Modern" (fondo casi negro, acentos cian/naranja/púrpura/dorado, tipografía Orbitron/Inter, paneles tipo cristal) a las 12 pantallas React existentes y al escenario de batalla PixiJS, usando un catálogo de tema compartido (tokens CSS) en vez de valores fijados por pantalla, migrando los glifos emoji/ASCII actuales a iconos `lucide-react`, y sustituyendo las unidades de combate — hoy rectángulos `Graphics` de color liso — por sprites animados reales (reposo + ataque) tomados de `assets-source/units/Characters/`, asignados de forma determinista por tipo de gato. Es una spec puramente de capa de presentación: `src/engine/` no se toca, ninguna regla de combate/guardado cambia, y ningún texto/nombre accesible que los tests existentes verifican se modifica.

## Technical Context

**Language/Version**: TypeScript ~6.0.2, React 19 — mismo stack del proyecto, sin cambios.

**Primary Dependencies**: `pixi.js` + `@pixi/react` (ya instalados, reutilizados para `AnimatedSprite`/`Assets`/`Graphics`); `lucide-react` (ya instalado desde antes pero sin usar — esta spec lo consume por primera vez). Ninguna dependencia nueva se añade — ni para el tema (CSS plano, mismo patrón que `src/index.css` ya usa), ni para el glow (trazos `Graphics` concéntricos en vez de un paquete de filtros).

**Storage**: N/A — `spriteKey` es contenido estático en `src/data/cats.ts`, no dato de progreso del jugador; el esquema de Dexie/`useMetaStore` no cambia.

**Testing**: Vitest. Las funciones puras nuevas (mapeo `AnimationState → carpeta de sprite`, manifest `catId → rutas de textura`) se testean sin canvas/DOM, mismo criterio que `src/game/animation.ts` ya establece (`specs/003-identidad-visual-animada`). La suite completa de tests de pantalla (`tests/unit/*Screen.test.tsx`) actúa como guardia de regresión — debe seguir en verde sin editar ninguna aserción, ya que las consultas (`getByRole`, `getByLabelText`, `getByText`) no cambian de objetivo. Lo estrictamente visual (paneles, animación de sprites, glow) se valida por recorrido manual en navegador (`quickstart.md`), mismo precedente que `specs/003-identidad-visual-animada/plan.md`.

**Target Platform**: navegadores evergreen de escritorio y móvil — sin cambio.

**Project Type**: aplicación web de un solo proyecto — sin cambio.

**Performance Goals**: 60fps con al menos 10 unidades animadas simultáneas (mismo umbral que `specs/002-motor-de-combate/spec.md` SC-003 y `specs/003-identidad-visual-animada`), ahora usando `AnimatedSprite` con texturas cacheadas por `spriteKey` (cargadas una vez vía `Assets`, no por instancia) en vez de redibujado de `Graphics`.

**Constraints**: `src/engine/` no se modifica (Constitución § VI). Ninguna dependencia nueva de terceros (Constitución § VII / simplicidad) — tema en CSS plano, iconos con la dependencia ya instalada, glow sin paquete de filtros. El pipeline de copia de sprites es un paso de contenido de una sola vez (script manual), nunca parte del build de Vite ni del bundle servido (`assets-source/` en su totalidad —12k+ archivos— permanece fuera de `public/`).

**Scale/Scope**: 12 pantallas React, 1 escena PixiJS, 12 entradas de `Cat` existentes reciben `spriteKey`, 336 archivos de sprite copiados (`1_idle` [16 frames] + `4_attack` [12 frames] de 12 de los 30 `hero_N` disponibles).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Nota |
|---|---|---|
| I. Combate Automático por Despliegue | ✅ Pass | Sin cambios a reglas de combate, coste, cooldown ni colisión — spec.md FR-012 lo prohíbe explícitamente. |
| II. Progresión por Niveles con Desbloqueo Secuencial | ✅ Pass | Sin cambios — el reskin no toca desbloqueo ni guardado. |
| III. Identidad Visual Animada | ✅ Pass | Ya se cumplía desde `specs/003` (bob/squash procedural). Esta spec la refuerza: cada unidad pasa a mostrar arte real con pose de reposo y de ataque (spec.md FR-008), manteniendo el mismo mínimo de dos poses cuando no hay arte asignado (fallback `Graphics`, FR-011). |
| IV. Balance Dirigido por Datos | ✅ Pass | `spriteKey` vive en `src/data/cats.ts` junto al resto de stats del gato — nunca hardcodeado en `src/game/` (research.md Decisión 3). |
| V. Persistencia Local-First | ✅ Pass | Sin cambios de esquema persistido — `spriteKey` es contenido, no progreso del jugador. |
| VI. Separación Estricta entre Motor y UI | ✅ Pass | `src/engine/` intacto. El cambio de `Graphics` a `AnimatedSprite` ocurre dentro del mismo `useTick` que ya mutaba transform directamente (research.md Decisión 2) — ningún componente de React pasa a re-renderizar por frame; sigue disparándose solo por mount/unmount de unidad, igual que hoy. |
| VII. Simplicidad desde el MVP | ✅ Pass | Cero dependencias nuevas (research.md Decisión 1, 4, 5); el mapeo de arte es determinista y no requiere un sistema de curaduría/configuración nuevo (research.md Decisión 3); el glow es geometría simple, no un pipeline de shaders. |

Sin violaciones — no aplica Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/021-reskin-cyber-modern/
├── spec.md                          # Ya creado — QUÉ/POR QUÉ
├── plan.md                          # Este archivo
├── research.md                      # Fase 0
├── data-model.md                    # Fase 1 (incluye las reglas de consumo del catálogo de tema y del manifest de sprites)
├── quickstart.md                    # Fase 1
└── tasks.md                         # Fase 2 (/speckit-tasks, no este comando)
```

### Source Code (repositorio raíz)

```text
battle-cats-web/
├── index.html                        # MODIFICAR — añade <link> de Google Fonts Orbitron+Inter (mismo origen que usa el mockup de referencia)
├── src/
│   ├── theme.css                     # NUEVO — custom properties (colores/gradiente/radios/tipografía) + clases utilitarias (.screen, .glass-panel, .btn/.btn-primary/.btn-outline/.btn-ghost/.btn-icon, .tag+variantes de rareza, .progress-bar, .list-card, .hud-bar)
│   ├── index.css                     # MODIFICAR — @import de theme.css; conserva su :root actual (no se elimina, solo deja de ser lo único que las pantallas consumen)
│   ├── screens/
│   │   ├── TitleScreen.tsx           # MODIFICAR — estructura+clases+iconos; mismas props/lógica/textos
│   │   ├── MainMenuScreen.tsx        # MODIFICAR — idem
│   │   ├── SettingsScreen.tsx        # MODIFICAR — idem
│   │   ├── LevelSelectScreen.tsx     # MODIFICAR — idem
│   │   ├── TreasureMenuScreen.tsx    # MODIFICAR — idem
│   │   ├── TeamScreen.tsx            # MODIFICAR — idem
│   │   ├── UpgradeScreen.tsx         # MODIFICAR — idem + mapeo de color por rareza (data-model.md § Rarity Color Map)
│   │   ├── CatGuideScreen.tsx        # MODIFICAR — idem + mapeo de color por rareza
│   │   ├── EnemyGuideScreen.tsx      # MODIFICAR — idem
│   │   ├── ResultScreen.tsx          # MODIFICAR — idem
│   │   ├── GachaScreen.tsx           # MODIFICAR — idem, solo el shell existente (spec.md FR-013 — sin nueva mecánica)
│   │   └── BattleScreen.tsx          # MODIFICAR — HUD DOM (energía, HP de bases, fila de despliegue, salir) con nuevo estilo; ningún handler/llamada a store cambia
│   ├── game/
│   │   ├── animation.ts              # MODIFICAR (aditivo) — mapeo `AnimationState → carpeta de sprite` junto a `getAnimationState` existente; ninguna función existente cambia de firma ni comportamiento
│   │   ├── spriteAssets.ts           # NUEVO — manifest `catId → { idle: string[], attack: string[] }` + helper de carga vía `Assets.load`
│   │   ├── UnitSprite.tsx            # MODIFICAR — `pixiGraphics` → `pixiAnimatedSprite` cuando `cat.spriteKey` resuelve en el manifest (fallback al `Graphics` actual si no); anillo de glow por equipo (cian/rojo) con trazos concéntricos; `scale.x` negado para `team === 'Enemy'`
│   │   ├── DeathEchoSprite.tsx       # MODIFICAR — misma sustitución que UnitSprite; congela el frame idle vigente en vez de redibujar
│   │   └── BattleStage.tsx           # MODIFICAR — `Application` con fondo transparente + capa `Graphics` de fondo de carril (una vez por montaje, no por unidad)
│   └── data/
│       └── cats.ts                   # MODIFICAR — añade `spriteKey?: string` a `Cat`; puebla los 12 fixtures existentes con `hero_1`…`hero_12` (data-model.md § Sprite Assignment)
├── public/
│   └── sprites/
│       └── hero_N/{idle,attack}/*.png  # NUEVO — generado por el script de copia (research.md Decisión 5), 336 archivos; reemplaza el actual `cat-placeholder.png` sin usar
├── scripts/
│   └── copy-sprites.mjs              # NUEVO — copia `1_idle`/`4_attack` de los 12 `hero_N` asignados desde `assets-source/units/Characters/` hacia `public/sprites/`; se ejecuta una sola vez a mano, nunca en `npm run build`/`dev`
└── tests/
    └── unit/
        ├── game/
        │   ├── animation.test.ts     # MODIFICAR (aditivo) — nuevo caso: `AnimationState` resuelve la carpeta esperada
        │   └── spriteAssets.test.ts  # NUEVO — el manifest resuelve rutas correctas por `catId`, y `undefined` para un `catId` sin `spriteKey`
        └── *Screen.test.tsx          # SIN CAMBIOS DE ASERCIONES — deben seguir en verde tal cual (verificado pantalla por pantalla antes de tocarla, ver quickstart.md)
```

**Structure Decision**: Todo el trabajo vive dentro del proyecto único ya existente (`src/`, `public/`, `tests/`) — no se crea ningún paquete/app nuevo. `theme.css` se coloca junto a `index.css` porque ambos gobiernan estilo global de la misma manera. `scripts/copy-sprites.mjs` vive en la raíz del repo como herramienta de autoría de contenido de una sola ejecución (mismo espíritu que `assets-source/` como área de staging fuera de `src/`/`public/`) — explícitamente **no** se integra al pipeline de build para no acoplar `npm run build`/`dev` a un directorio de 12k+ archivos que no se sirve. `src/engine/` no aparece en este árbol porque no se toca (Constitución § VI).

## Complexity Tracking

*Sin violaciones que justificar — tabla omitida (ver Constitution Check arriba).*
