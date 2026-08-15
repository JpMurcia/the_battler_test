# Phase 1 Data Model: Auditoría de Assets Importados

No hay entidades de runtime (sin `ScriptableObject`, sin clases C# nuevas — ver plan.md Technical Context). Las "entidades" de esta feature son secciones/filas dentro del documento `asset-catalog.md`.

## Pack de Assets

Fila de la sección "Packs" del catálogo (US1, FR-001).

| Campo | Descripción |
|---|---|
| `nombre` | Nombre del pack (`Characters`, `Assets/Assets`, `Dragon Warrior Files`, `Free 2D Cartoon Parallax Background`, `Hyper_Casual_UI`, `Monsters Creatures Fantasy 2`, `Warrior free set`, `ShootingSound`) |
| `ruta` | Ruta relativa a `Assets/` |
| `tipo_contenido` | Categoría principal: sprites de personaje / sprites de enemigo-criatura / fondos parallax / iconos-UI / efectos / fuentes / **efectos de sonido** |
| `conteo_archivos` | Conteo aproximado de archivos (sin `.meta`) |

## Candidato a Personaje

Fila de la tabla de cumplimiento del Principio III (US2, FR-003). Aplica a `hero_1`..`hero_30`, "Dragon Warrior" y "Warrior free set" (research.md §6).

| Campo | Descripción |
|---|---|
| `id` | `hero_N`, `dragon_warrior` o `warrior_free_set` |
| `variantes_genero` | `male`, `female`, ambas, o N/A (personaje único) |
| `estados_presentes` | Subconjunto de `{idle, walk, run, attack, block, die}` encontrado por variante |
| `conteo_frames_por_estado` | Número de frames por carpeta de estado |
| `cumple_principio_iii` | `cumple` / `incompleto` + requisito faltante si aplica |
| `variante_visual_adicional` | `presente` / `requiere decisión de diseño` (no se puede confirmar en un pack de sprites crudo — research.md §4) |

## Candidato a Enemigo/Criatura

Fila de la tabla de criaturas (US1, FR-002b). Aplica a `Bat`, `Mimic`, `Rat`, `Slime` del pack `"Monsters Creatures Fantasy 2"`. No se evalúa contra el Principio III (research.md §5).

| Campo | Descripción |
|---|---|
| `id` | `bat` / `mimic` / `rat` / `slime` |
| `estados_presentes` | Estados de animación encontrados (idle, attack, hurt, death, y variantes propias como `fly`/`transform`) |
| `nota` | "Candidata a enemigo — no evaluada contra Principio III salvo decisión de diseño futura" |

## Pack de Audio

Fila para `ShootingSound` (US1, FR-004b) — no encaja como "Pack de Assets" visual estándar por no tener sprites/animaciones.

| Campo | Descripción |
|---|---|
| `nombre_archivo` | Nombre del `.wav` |
| `ruta` | Ruta exacta dentro de `Assets/ShootingSound/` |
| `nota` | "Efecto de sonido reutilizable — sin asignación a personaje/pantalla específica" |

## Recomendación de Superficie de UI

Fila de la tabla de recomendación por pantalla (US3, FR-004).

| Campo | Descripción |
|---|---|
| `pantalla` | `MainMenu` \| `AdventureMap` \| `PlayerBase` \| `HUD de batalla` |
| `categorias_solapadas` | Categorías equivalentes encontradas en ambos packs (pause, settings, botones genéricos, etc.) |
| `pack_recomendado` | `Assets/Assets/UI Elements` \| `Hyper_Casual_UI` \| "requiere decisión de diseño" |

## Riesgo de Licencia

Fila de la sección de licencias (US4, FR-005).

| Campo | Descripción |
|---|---|
| `archivo` | Nombre del archivo de licencia/léame |
| `ruta` | Ruta exacta dentro de `Assets/` |
| `pack` | Pack al que pertenece |
| `estado` | Siempre "pendiente de revisión legal manual" (FR-005 — no es validación legal automática) |

## Problema Estructural

Fila de la sección de hallazgos (FR-006). No tiene historia de usuario dedicada, pero spec.md la exige como parte del catálogo.

| Campo | Descripción |
|---|---|
| `tipo` | `.meta faltante` \| `hero_N incompleto` \| `demo sin cablear` |
| `ruta` | Ruta del archivo/carpeta afectado |
| `detalle` | Descripción puntual (p. ej. "falta variante `female`", "escena `Demo.unity` no referenciada por ninguna spec") |
