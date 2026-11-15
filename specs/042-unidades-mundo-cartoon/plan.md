# Implementation Plan: Unidades del Mundo Cartoon

**Branch**: `042-unidades-mundo-cartoon` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/042-unidades-mundo-cartoon/spec.md`

## Summary

Las unidades que no se dibujan con sprite pasan al estilo cartoon de la biblia de arte (contorno oscuro grueso, relleno plano). Desaparece el cuerpo "cyber" genérico y toda unidad viva muestra un anillo de equipo, sin tocar el motor ni el balance. El trabajo es de datos y de render:

1. **Datos** (`src/data/`): registro nuevo `unitDesigns.ts` con 28 diseños (los 16 "cyber" y los 12 respaldos de sprite) y un único resolvedor `resolveUnitDesign`; corrección de 5 colores (las 4 coincidencias con tokens y un duplicado hallado en la investigación).
2. **Dibujo** (`unitFactory.ts`): sin placas, visor ni borde neón. Rasgos detrás del cuerpo, contorno `0x0a0c14` en cada parte, orejas obligatorias en aliados con un marco de cabeza por forma, textura a resolución 2.
3. **Anillo** (`teamRing.ts`): elipse estática con resplandor por trazos, hermana del cuerpo; solo se actualiza su posición en el `useTick` existente.
4. **Retirada del "cyber"**: se borra `cyberUnitBody.ts`. La barra de vida pasa a recibir solo el tamaño, con dibujo idéntico, y el eco de muerte usa la textura del diseño con un tinte apagado.

## Technical Context

**Language/Version**: TypeScript ~6.0 (`tsc -b`).

**Primary Dependencies**: React 19, `pixi.js` 8.19, `@pixi/react` 8. Ninguna nueva.

**Storage**: N/A. Nada se persiste (Constitución § V); los diseños son contenido estático y las texturas viven en una caché en memoria.

**Testing**: Vitest 4 + jsdom. Los `Graphics` de Pixi se construyen y miden en tests sin canvas, como ya hacen `unitFactory.test.ts` y `unitHpBar.test.ts`. Sin degradados (`FillGradient` lanza en jsdom, ver `baseTower.test.ts:63`).
- **Nuevos**: `tests/unit/data/unitDesigns.test.ts` y `tests/unit/game/teamRing.test.ts`.
- **Ajustados**: `unitFactory.test.ts` y `unitHpBar.test.ts`.
- **Borrado**: `cyberUnitBody.test.ts`.

**Target Platform**: navegador (escritorio y móvil).

**Project Type**: web app de un solo proyecto.

**Performance Goals**: sin degradación perceptible con muchas unidades (SC-007). Por unidad viva: una textura cacheada por `(catId, rol)` y un `Graphics` de anillo dibujado una vez. Por fotograma, solo transformaciones. Sin filtros. El cuerpo "cyber" de 3 `Graphics` con alfa animado desaparece, así que el coste neto por unidad baja o se mantiene.

**Constraints**:
- § VI: cero re-renders de React por tick y cero redibujados por fotograma.
- FR-011: el tamaño en pantalla (`bodyWidth × bodyHeight`) y el movimiento (`getAnimationPose`) no cambian.
- `src/engine/` no se toca.
- El vocabulario de rasgos no crece.
- `IMPERIO_CAP1_DESIGNS` mantiene sus 30 entradas.

**Scale/Scope**: 65 unidades: 28 diseños nuevos y 5 colores corregidos. Unos 9 archivos de `src/`, 5 de tests y la documentación de arte.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| **§ I Combate automático** | Ninguna regla de despliegue, colisión ni combate cambia (FR-011) | ✅ |
| **§ II Progresión** | Sin efecto | ✅ |
| **§ III Identidad visual animada** | Toda unidad conserva reposo y ataque: los sprites siguen igual y las unidades con diseño mantienen las transformaciones de `getAnimationPose`. Ninguna queda como imagen estática | ✅ |
| **§ IV Datos** | Los 28 diseños y los colores viven en `src/data/` (`unitDesigns.ts`, `seedData.ts`, `imperioCap1Design.ts`); el render solo los lee | ✅ |
| **§ V Local-first** | Nada se persiste; sin migración de Dexie | ✅ |
| **§ VI Motor/UI** | Motor intacto. Las texturas se generan una vez y se cachean. El anillo se dibuja una vez y por fotograma solo cambia `x/y` dentro del `useTick` existente. Sin re-render de React por tick | ✅ |
| **§ VII Simplicidad** | Sin dependencias ni filtros nuevos. Se **elimina** un módulo (`cyberUnitBody.ts`) y una rama de render. Los dos módulos nuevos (`teamRing.ts`, `teamColors.ts`) son funciones puras pequeñas | ✅ |

**Re-check tras el diseño (Phase 1)**: sin cambios. El diseño final (research.md, Decisiones 1–11) no introduce estado nuevo, persistencia ni lógica en el motor. No hay excepciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/042-unidades-mundo-cartoon/
├── plan.md              # este archivo
├── research.md          # Phase 0: 11 decisiones + estado de partida verificado
├── data-model.md        # Phase 1: diseños, colores, geometría de anillo y orejas
├── quickstart.md        # Phase 1: validación automática, estructural y visual
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks, no lo crea este comando)
```

Sin `contracts/`: la feature no expone interfaces externas (API, CLI ni formato de archivo). Los únicos "contratos" son funciones internas de render, documentadas en `data-model.md`.

### Source Code (repository root)

```text
src/
├── data/
│   ├── unitDesigns.ts           # NUEVO: EXTRA_UNIT_DESIGNS (28) + resolveUnitDesign()
│   ├── seedData.ts              # colores: seed-cat-ranged, seed-cat-titan
│   └── imperioCap1Design.ts     # colores: cat-deidad, enemy-saltarin-alado, cat-cuchilla
└── game/
    ├── UnitSprite.tsx           # resolveUnitDesign, sin rama cyber, anillo hermano del cuerpo
    ├── DeathEchoSprite.tsx      # textura del diseño + tinte apagado, sin cyber
    └── graphics/
        ├── unitFactory.ts       # dibujo cartoon, orejas de aliado, marco de cabeza, resolución 2
        ├── teamRing.ts          # NUEVO: computeTeamRingGeometry + drawTeamRing
        ├── teamColors.ts        # NUEVO: TEAM_INFO_COLOR (sustituye a CYBER_TEAM_COLOR)
        ├── unitHpBar.ts         # recibe { bodyWidth, bodyHeight }
        └── cyberUnitBody.ts     # BORRADO

tests/unit/
├── data/unitDesigns.test.ts     # NUEVO: FR-004/005/012
├── data/imperioCap1Design.test.ts  # sin cambios (30 entradas)
└── game/
    ├── unitFactory.test.ts      # orejas aliado/enemigo, cat-ears una vez, resolución 2
    ├── teamRing.test.ts         # NUEVO
    ├── unitHpBar.test.ts        # tamaño en vez de CyberBodyLayout
    └── cyberUnitBody.test.ts    # BORRADO

docs/art/entity-inventory.md     # nivel C → 0; los 12 sprites con respaldo B
```

**Structure Decision**: proyecto único existente. Los datos van en `src/data/` y el render Pixi puro en `src/game/graphics/`; los componentes `@pixi/react` solo orquestan, el mismo reparto que siguen las specs 021, 022 y 028.

## Secuencia sugerida para `/speckit-tasks`

1. **Base**: `teamColors.ts`; `unitHpBar` pasa a recibir el tamaño (con su test). Así `cyberUnitBody.ts` queda sin consumidores salvo `UnitSprite` y `DeathEchoSprite`.
2. **US1 (P1), datos**: corregir los 5 colores, crear `unitDesigns.ts` con los 28 diseños y añadir `unitDesigns.test.ts` (FR-012).
3. **US1, dibujo**: `unitFactory.ts` en estilo cartoon (capas, contorno, resolución 2); `UnitSprite` usa `resolveUnitDesign` y pierde la rama cyber; borrar `cyberUnitBody.ts`.
4. **US2 (P1)**: `teamRing.ts` con su test y montaje en `UnitSprite`.
5. **US3 (P2)**: orejas de aliado y marco de cabeza en `unitFactory.ts`, con sus tests.
6. **US4 (P3)**: `DeathEchoSprite` con la textura del diseño y el tinte.
7. **Cierre**: revisión visual (quickstart § 3), inventario de arte y anotar el duplicado de color en `spec.md` (Assumptions → Colores).

US1 y US2 comparten `UnitSprite.tsx`, así que van en serie.

## Hallazgos de la investigación que afectan a la spec

- **Color duplicado no listado**: `cat-cuchilla` y `seed-enemy-red-snake` comparten `0xdc2626`. FR-005 y FR-012 obligan a corregirlo, y la spec solo nombra cuatro casos (research.md, Decisión 8).
- **La barra de vida dependía del módulo "cyber"**, aunque solo usaba el tamaño. Se desacopla sin cambiar su dibujo (Decisión 5).
- **El eco de muerte usaba el cuerpo "cyber" también para las unidades con diseño**, no solo como respaldo (Decisión 6).

## Complexity Tracking

Sin violaciones de la Constitución que justificar.
