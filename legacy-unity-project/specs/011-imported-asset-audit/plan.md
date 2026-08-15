# Implementation Plan: Auditoría de Assets Importados

**Branch**: `011-imported-asset-audit` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-imported-asset-audit/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Esta feature no produce código de gameplay: produce un documento (`asset-catalog.md`) que cataloga los ocho packs de assets recién importados a `Assets/` (FR-001, ampliado el 2026-07-29 para incluir `"Monsters Creatures Fantasy 2"`, `"Warrior free set"` y `ShootingSound`), reporta la completitud de las 30 carpetas `hero_N` por variante de género y estado de animación (FR-002) y de las 4 criaturas de `"Monsters Creatures Fantasy 2"` (FR-002b), evalúa cada personaje candidato a unidad jugable — incluido "Warrior free set" — contra el Principio III de la constitución (FR-003), recomienda por pantalla qué pack de UI usar entre `Assets/Assets/UI Elements` y `Hyper_Casual_UI` (FR-004), cataloga `ShootingSound` como colección de efectos de sonido reutilizables (FR-004b), señala archivos de licencia/léame para revisión legal (FR-005), y marca problemas estructurales — `.meta` faltantes, `hero_N` incompletos, escenas/scripts de demo sin cablear (FR-006). Enfoque técnico: no hay lógica en runtime ni ScriptableObjects nuevos; el "sistema" es un proceso de inspección del sistema de archivos (`Assets/` vía `Get-ChildItem`/`find`, sin abrir el Editor de Unity) cuyo output es Markdown versionado junto a la spec, explícitamente de solo lectura (FR-007) — no mueve, renombra ni cablea ningún asset.

## Technical Context

**Language/Version**: N/A para lógica de producto — el propio proceso de catalogación se ejecuta con utilidades de shell (PowerShell/`find` sobre el árbol de `Assets/`) desde Claude Code, no C# ni un `MonoBehaviour`/`EditorWindow`.

**Primary Dependencies**: Ninguna dependencia de Unity ni paquete nuevo. Inspección directa de archivos y carpetas bajo `Assets/`; no requiere abrir el Editor de Unity ni el Asset Database para completar el catálogo (SC-001).

**Storage**: Un documento Markdown nuevo, `specs/011-imported-asset-audit/asset-catalog.md`, versionado junto a esta spec (no en `Application.persistentDataPath`, no es guardado de partida — ver Assumptions de spec.md). No se crea ningún `ScriptableObject` ni archivo de datos de runtime.

**Testing**: N/A — no hay código ejecutable que testear con Unity Test Framework. La validación es la que ya define spec.md: cada "Independent Test" por historia de usuario se satisface leyendo el catálogo generado y confirmando que contiene la sección/dato esperado (ver quickstart.md).

**Target Platform**: N/A — el catálogo es un artefacto de documentación de proyecto, sin dependencia de plataforma de build.

**Project Type**: Documento de análisis dentro del proyecto Unity existente (`the_battler_test`); no se crea ningún proyecto, asmdef, escena ni script de producto nuevo.

**Performance Goals**: SC-001 — un miembro del equipo debe poder determinar qué contenido hay disponible en menos de 5 minutos leyendo solo el catálogo.

**Constraints**: FR-007 — el proceso de catalogación es de solo lectura sobre `Assets/`: no mueve, renombra, elimina ni cablea ningún asset importado en escenas/prefabs/ScriptableObjects; esa integración queda fuera de alcance para specs futuras. El catálogo debe quedar en un estado reusable (FR-008), sin re-escanear los packs para decisiones futuras.

**Scale/Scope**: 8 packs nombrados en FR-001 (`Characters/` con 30 carpetas `hero_N` × 2 géneros × 6 estados de animación ≈ 5040 archivos sin contar `.meta`; `Assets/Assets/UI Elements` + `Raw and SpriteSheets` ≈ 224 archivos; `"Dragon Warrior Files"` ≈ 78 archivos, personaje único + `Effects/`; `"Free 2D Cartoon Parallax Background"` ≈ 27 archivos; `Hyper_Casual_UI` ≈ 209 archivos; `"Monsters Creatures Fantasy 2"` ≈ 36 archivos, 4 criaturas — `Bat`, `Mimic`, `Rat`, `Slime`; `"Warrior free set"` ≈ 27 archivos, personaje único; `ShootingSound` ≈ 14 archivos `.wav`). Decisión del usuario (2026-07-29): se amplía el alcance original de spec.md a estos 3 packs adicionales porque contienen audio reutilizable para el juego — research.md §2 documenta el hallazgo y la resolución.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Narrativa Integrada | N/A — esta feature no introduce contenido narrativo ni una batalla; es catalogación de assets crudos, no un capítulo/mapa. |
| II. Combate Automático por Despliegue | N/A — no se toca ninguna regla de combate, `UnitDefinition` ni `BattleStateManager`. |
| III. Identidad Visual Animada | Alineación central: US2/FR-003 existen precisamente para evaluar los packs de personaje importados contra este principio (idle + ataque + variante visual adicional) antes de que cualquier spec futura los adopte como unidad jugable. |
| IV. Progresión por Capítulos con Desbloqueo | N/A — no se desbloquea ni define ningún capítulo nuevo; el catálogo es insumo para decisiones futuras de contenido, no contenido en sí. |
| V. Balance Dirigido por Datos | N/A — no hay estadísticas de unidad (Coste/Cooldown/Salud/Daño/Rango) involucradas; el catálogo no define balance. |
| VI. Simplicidad desde el MVP | Alineación central: FR-007 fija explícitamente el alcance a análisis/catalogación, sin integrar assets en escenas/prefabs/ScriptableObjects — evita anticipar trabajo de integración antes de que una spec futura lo necesite. |

Sin violaciones que requieran justificación en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/011-imported-asset-audit/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── asset-catalog.md     # Deliverable del catálogo (producido durante /speckit-implement, US1-US4)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

No se añade código fuente. El único artefacto de esta feature es el documento `specs/011-imported-asset-audit/asset-catalog.md`, generado inspeccionando (sin modificar) los directorios ya presentes en el repositorio:

```text
Assets/
├── Characters/                                  # hero_1..hero_30, {male,female}/{1_idle..6_die}
├── Assets/
│   ├── UI Elements/
│   └── Raw and SpriteSheets/
├── Dragon Warrior Files/
│   ├── Effects/
│   └── Read Me.txt
├── Free 2D Cartoon Parallax Background/
└── Hyper_Casual_UI/
    ├── Fonts/  (incluye license.txt)
    ├── Scenes/
    └── Sprites/
```

**Structure Decision**: Proyecto único de Unity existente (`the_battler_test`); esta feature no crea ningún asmdef, escena ni carpeta de producto. Es un documento de análisis (`asset-catalog.md`) versionado junto a la spec en `specs/011-imported-asset-audit/`, que referencia rutas dentro de `Assets/` sin moverlas ni cablearlas (FR-007).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones — tabla omitida.
