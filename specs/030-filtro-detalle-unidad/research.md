# Research: Filtro de Gatos y Panel de Detalle de Unidad

## Decisión 1 — Filtro como estado local por pantalla, sin store nuevo

**Decision**: El estado del filtro (rarezas marcadas, rasgo, habilidad, modo Y/O, orden) vive en `useState` local dentro de `TeamScreen.tsx` y de `CatGuideScreen.tsx` por separado — no se comparte entre pantallas ni se persiste.

**Rationale**: Mismo criterio que `research.md Decisión 6` de `specs/029` (toggle de filas): es preferencia de sesión sin pedido explícito de persistencia, y cada pantalla ya gestiona su propio estado de UI local (`TeamScreen` ya tiene `selectedIds` local). Compartir el filtro entre pantallas obligaría a un store nuevo por un beneficio no pedido.

**Alternatives considered**: Persistir el filtro en `useMetaStore.settings`. Rechazado por alcance no pedido (Principio VII).

## Decisión 2 — Función pura de filtrado, testeable sin React

**Decision**: Se extrae una función pura `matchesCatFilter(cat: Cat, filter: CatFilterState): boolean` a un módulo nuevo `src/data/catFilter.ts`, consumida por ambos componentes (`TeamScreen`/`CatGuideScreen`) vía `CATS.filter(...)`. `CatFilterState` incluye `rarities: RarityType[]`, `trait: ClassificationType | null`, `ability: CatFilterAbility | null`, `mode: 'AND' | 'OR'`.

**Rationale**: Mismo patrón ya usado en todo el proyecto (`src/data/*` como capa pura sin React, ver Constitución § VI aplicado más allá del motor de combate) — permite testear los 8 acceptance scenarios de la Historia 1 con Vitest puro, sin montar componentes, y reutilizar la misma lógica en las 2 pantallas sin duplicarla.

**Alternatives considered**: Implementar el filtro inline en cada componente. Rechazado — duplicaría la lógica de matching entre `TeamScreen` y `CatGuideScreen` (ya ambas iteran `CATS`, divergerían con el tiempo).

## Decisión 3 — Catálogo de chips de habilidad, anclado a datos ya existentes

**Decision**: `CatFilterAbility` es una unión cerrada: `'Weaken' | 'Freeze' | 'Slow' | 'Curse' | 'Critical' | 'MultiHit'`. Los primeros 4 matchean `cat.appliesEffect?.type`; los últimos 2 matchean `cat.attackType`.

**Rationale**: Cubre el 100% de las habilidades que el roster actual puede tener (ver `EffectType`/`AttackType` en `src/engine/types.ts`) sin inventar chips vacíos para habilidades del manual que `AbilityEffectType` del proyecto todavía no implementa (spec.md Assumptions).

## Decisión 4 — Panel de detalle: componente compartido, sin duplicar entre pantallas

**Decision**: Se crea `src/screens/shared/UnitDetailPanel.tsx`, un componente que recibe `catId` y `onClose`, y se monta idéntico desde `TeamScreen` y `CatGuideScreen` (cada una con su propio `useState<string | null>` para "qué catId está abierto"). Reutiliza `PanelOverlay` (ya existe desde `specs/026`, contenedor de overlay con foco atrapado) para consistencia visual con el resto de paneles del Hub.

**Rationale**: Evita duplicar la lógica de tabs de forma + cálculo de stats + botón de evolución en 2 archivos. `PanelOverlay` ya es el patrón establecido del proyecto para "overlay encima de una pantalla sin ocultar lo de atrás" (`specs/026-navegacion-hub-mockup`).

**Alternatives considered**: Un panel separado por pantalla. Rechazado por duplicación directa de lógica no trivial (evolución, DPS, tabs).

## Decisión 5 — DPS derivado, sin campo nuevo

**Decision**: `dps = damage / attackIntervalSeconds` (usando los stats efectivos de `getEffectiveCatStats` ya existente), calculado inline en el panel — no se persiste ni se agrega a `Cat`/`EffectiveCatStats`.

**Rationale**: Es un valor puramente derivado de 2 campos que ya existen; agregarlo como campo de datos violaría el Principio IV (Balance Dirigido por Datos vive en `src/data/`, no duplicado como dato calculable).

## Decisión 6 — Pestañas de forma muestran stats hipotéticos sin mutar el gato

**Decision**: La pestaña de forma seleccionada en el panel es estado local (`useState<EvolutionStage>`, inicializado a `owned.evolutionStage`) — cambiar de pestaña solo recalcula `getEffectiveCatStats(cat, pestañaSeleccionada)` para mostrar, nunca llama a `evolveCat` ni cambia `owned.evolutionStage` real. El botón de evolución solo opera sobre la forma **siguiente** a la real vigente (`owned.evolutionStage`), sin importar qué pestaña esté siendo visualizada.

**Rationale**: Corresponde exactamente a FR-008 ("sin cambiar la forma real del gato") y evita el bug de permitir "evolucionar" a una forma ya pasada o saltada visualizando otra pestaña.
