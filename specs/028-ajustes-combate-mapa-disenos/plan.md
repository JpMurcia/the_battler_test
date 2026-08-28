# Implementation Plan: Ajustes Post-Revisión — Combate por Refuerzo de Fila, Pestañas de Mapa y Diseños Procedurales

**Branch**: `028-ajustes-combate-mapa-disenos` | **Date**: 2026-08-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/028-ajustes-combate-mapa-disenos/spec.md`

## Summary

Tres ajustes independientes sobre lo ya construido: (1) `stepSimulation` gana una segunda pasada de "refuerzo de fila" que promueve unidades bloqueadas a engagements adicionales contra el mismo objetivo de la aliada que las bloquea, sin tocar `combat.ts`; (2) `LevelSelectScreen` gana pestañas por `Level.region` y un canvas de altura dinámica con scroll vertical, sin tocar la lógica de desbloqueo; (3) se extiende el sistema procedural ya existente (`unitFactory.ts`/`ProceduralDesign`, hoy solo para los 7 gatos semilla) con un registro nuevo de diseños para las 30 unidades de `specs/027`, generalizando el lookup de `UnitSprite.tsx` y ampliando el catálogo de rasgos distintivos de 5 a 10 valores.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Ninguna nueva.

**Storage**: Ninguna — las 3 historias son lógica de motor/UI y datos estáticos, sin persistencia nueva.

**Testing**: Vitest — `tests/unit/engine/simulation.test.ts` (refuerzo de fila, casos puros sobre `stepSimulation`), `tests/unit/LevelSelectScreen.test.tsx` (pestañas, extiende), nuevo `tests/unit/data/imperioCap1Design.test.ts` (unicidad de combinación forma+rasgo+color).

**Target Platform**: Navegador.

**Project Type**: Web app single-project.

**Performance Goals**: Sin cambio — la segunda pasada de refuerzo de fila es O(unidades) por tick, mismo orden de magnitud que las pasadas ya existentes.

**Constraints**: El refuerzo de fila NO DEBE requerir cambios en `src/engine/combat.ts` (`resolveEngagement` ya es seguro de invocar varias veces sobre el mismo defensor en el mismo tick, ver research.md Decisión 1) — solo `src/engine/simulation.ts`. Las pestañas de mapa NO DEBEN cambiar `getLevelState`/`highestUnlockedLevelIndex` ni ningún dato de `useMetaStore` — puramente presentación derivada en `LevelSelectScreen.tsx`. Los diseños procedurales NO DEBEN introducir ningún `spriteKey` ni asset importado — siguen siendo `Graphics` generadas en runtime.

**Scale/Scope**: 1 archivo de motor modificado (`simulation.ts`), 1 pantalla modificada (`LevelSelectScreen.tsx`) + CSS (`theme.css`), 1 archivo de datos nuevo (diseños) + 1 tipo ampliado (`distinctiveFeature`) + 1 archivo de render generalizado (`UnitSprite.tsx`), 1 amendment de Constitución (ya aplicado, ver `.specify/memory/constitution.md` v2.0.0).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **§ I Combate Automático por Despliegue**: esta spec ES el amendment de este principio (v2.0.0, ya aplicado) — el "Refuerzo de fila" queda documentado como parte del principio, no como una excepción. Cumple por definición.
- **§ II Progresión por Niveles con Desbloqueo Secuencial**: las pestañas de región son puramente de presentación (FR-008) — `getLevelState`/`highestUnlockedLevelIndex` no se tocan. Cumple.
- **§ III Identidad Visual Animada**: los diseños procedurales nuevos siguen produciendo una textura con idle/ataque animados vía el mismo `useTick` de `UnitSprite.tsx` ya existente (bob/squash aplicado sobre el `pixiSprite` de la textura procedural, igual que hoy para los 7 gatos semilla) — no hay ninguna unidad con una sola imagen estática. Cumple.
- **§ IV Balance Dirigido por Datos**: el registro de diseños nuevo vive en `src/data/` — cumple. El refuerzo de fila es lógica de motor pura (no hay "dato" de refuerzo de fila que balancear, es una regla de resolución) — no aplica balance de datos aquí, coherente con cómo ya vive el resto de `stepSimulation`.
- **§ V Persistencia Local-First**: ninguna de las 3 historias persiste nada nuevo. Cumple.
- **§ VI Separación Motor/UI**: el refuerzo de fila vive enteramente en `src/engine/simulation.ts` (función pura, sin React/Pixi) — cumple. Las pestañas de mapa son estado de React local (`useState`), sin fugas al motor — cumple. El registro de diseños es dato consumido por `UnitSprite.tsx` (capa de render), igual que `SEED_UNITS`/`SEED_ENEMIES` ya hoy — cumple.
- **§ VII Simplicidad/YAGNI**: sin tope de unidades apiladas (spec.md Assumptions, decisión consciente); pestañas derivadas de `Level.region` ya existente, sin campo de agrupación nuevo; 5 rasgos distintivos nuevos (no 10+) — el mínimo que da variedad suficiente para 30 unidades con 3 formas base. Cumple.

## Project Structure

### Documentation (this feature)

```text
specs/028-ajustes-combate-mapa-disenos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── engine/
│   └── simulation.ts          # + segunda pasada "refuerzo de fila" en stepSimulation (T0xx)
├── screens/
│   └── LevelSelectScreen.tsx  # + pestañas por Level.region, canvas con scroll vertical dinámico
├── theme.css                   # + .stage-map--scrollable, .stage-map__canvas (altura dinámica vía --stage-map-canvas-height)
├── data/
│   ├── seedData.ts             # ProceduralDesign.distinctiveFeature: 5 → 10 valores (+ 'horns'|'wings'|'shield'|'spikes'|'tail')
│   └── imperioCap1Design.ts    # nuevo: IMPERIO_CAP1_DESIGNS: Record<string, ProceduralDesign>, las 30 unidades de specs/027
└── game/
    ├── UnitSprite.tsx           # lookup de ProceduralDesign generalizado: SEED_UNITS/SEED_ENEMIES → IMPERIO_CAP1_DESIGNS
    └── graphics/unitFactory.ts  # drawEnemyFeature (renombrado conceptualmente): +5 casos nuevos; drawSeedUnit ya no fuerza cat-ears para 'ally'

.specify/memory/constitution.md  # v2.0.0, ya aplicado — Core Principle I documenta "Refuerzo de fila"

tests/unit/
├── engine/simulation.test.ts    # + casos de refuerzo de fila (2, 3+ en cadena, splash de Área excluido, contraataque único)
├── LevelSelectScreen.test.tsx   # + pestañas: cambio de tab filtra nodos, no altera bloqueo/desbloqueo
└── data/imperioCap1Design.test.ts  # nuevo: las 30 unidades tienen diseño propio, sin combinación forma+rasgo+color repetida
```

**Structure Decision**: extensión de 3 áreas ya existentes (motor, pantalla de mapa, sistema procedural) — sin pantallas, stores ni tablas Dexie nuevas.

## Key Design Decisions

1. **Refuerzo de fila sin tocar `combat.ts`**: ver research.md Decisión 1 — `resolveEngagement` ya es seguro de invocar secuencialmente sobre el mismo defensor con distintos atacantes dentro de un mismo `stepSimulation`, porque lee/escribe el estado del defensor vía el mismo `byId: Map<string, BattleUnit>` mutable que `simulation.ts` ya usa entre engagements. La segunda pasada solo necesita **detectar** qué unidades bloqueadas deben promoverse y a qué `targetIds` — la resolución de daño reutiliza el bucle `for (const { attackerId, targetIds } of engagements)` ya existente sin cambios.
2. **Promoción por fixed-point, no por profundidad fija**: en vez de calcular la cadena completa de antemano (requeriría conocer el orden espacial de las unidades, que `alive` no garantiza), se itera repetidamente sobre `freeMovers` promoviendo a quien esté bloqueado por un `attackerId` ya conocido (en `engagements` o promovido en una iteración anterior de la misma pasada), hasta que una iteración completa no promueva a nadie — soporta cadenas de cualquier longitud sin ordenar `alive` espacialmente.
3. **Pestañas derivadas, sin nuevo campo de agrupación**: `Level.region` ya existe y ya distingue "fixtures" (`'imperio-de-los-gatos'`) de "Capítulo 1" (`'imperio-de-los-gatos-cap1'`) — las pestañas son `[...new Set(LEVELS.map(l => l.region))]`, con una etiqueta legible por un `REGION_LABELS: Record<string, string>` pequeño (fallback al valor crudo si no está mapeado).
4. **Canvas de altura dinámica en vez de replantear `mapPosition`**: en vez de re-derivar los 48 `mapPosition` de `specs/027`, el contenedor de nodos pasa de una altura fija (100% del `.stage-map`) a una altura en píxeles proporcional al número de nodos de la pestaña activa (`Math.max(MIN_CANVAS_HEIGHT_PX, nodeCount * PX_PER_NODE_ESTIMATE)`), con `overflow-y: auto` en el contenedor exterior — los mismos porcentajes 0-100 de `mapPosition` ahora se reparten sobre un lienzo más alto, sin tocar `src/data/levels.ts`. La pestaña de fixtures (3 nodos) cae en el mínimo (sin scroll, igual que hoy); la de Capítulo 1 (48 nodos) queda ampliamente desplegada.
5. **`role` dogging de `drawSeedUnit` deja de forzar orejas de gato para `'ally'`**: hoy `drawSeedUnit` ignora `design.distinctiveFeature` para unidades propias (siempre dibuja orejas). Se generaliza para que ambos roles usen `design.distinctiveFeature` — los 4 `SEED_UNITS` (gatos jugables) ya declaran `distinctiveFeature: 'cat-ears'` explícitamente, así que su render no cambia (mismo resultado); las unidades jugables nuevas de `specs/027` ganan variedad real de rasgo, no solo de forma/color.
6. **10 valores de `distinctiveFeature`, no un enum abierto**: 5 nuevos (`'horns'`, `'wings'`, `'shield'`, `'spikes'`, `'tail'`) sobre los 5 existentes — con 3 formas base × 10 rasgos × variación continua de color hay sobra de combinaciones para 30 unidades sin repetir (FR-012), sin necesitar un sistema de composición más complejo (múltiples rasgos por unidad, capas adicionales, etc.) — YAGNI.

## Complexity Tracking

*Sin violaciones no justificadas — el único cambio de Core Principle (§ I) es el propósito mismo de esta spec y ya está aplicado como amendment versionado.*
