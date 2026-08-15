# Catálogo de Assets Importados

**Spec**: [011-imported-asset-audit](./spec.md) | **Generado**: 2026-07-29 | **Alcance**: 8 packs (ver spec.md Assumptions, ampliado el 2026-07-29)

**Estado de esta versión**: Completa — US1 (Packs), US2 (Principio III), US3 (Recomendación de UI), US4 (Licencias) y Polish (Problemas Estructurales, FR-006) ejecutados. Ver [tasks.md](./tasks.md) para el detalle tarea por tarea.

- [Packs](#packs)
- [Enemigos y Criaturas](#enemigos-y-criaturas)
- [Personajes — Principio III](#personajes--principio-iii)
- [Recomendación de UI](#recomendación-de-ui)
- [Licencias y Riesgos](#licencias-y-riesgos)
- [Problemas Estructurales](#problemas-estructurales)

---

## Packs

Resumen rápido de los 8 packs (detalle por pack más abajo):

| Pack | Ruta | Tipo de contenido | Archivos (sin `.meta`) |
|---|---|---|---|
| Characters | `Assets/Characters/` | Sprites de personaje jugable — 30 héroes, variantes `male`/`female`, 6 estados cada uno | ≈5040 |
| UI Elements + Raw and SpriteSheets | `Assets/Assets/` | Iconos/UI (botones, círculos de progreso, barras) `Black`/`White` 1x/2x, 2 escenas demo | 224 |
| Dragon Warrior Files | `Assets/Dragon Warrior Files/` | Sprites de personaje jugable único + `Effects/` (VFX) + escena demo + léame | 78 |
| Free 2D Cartoon Parallax Background | `Assets/Free 2D Cartoon Parallax Background/` | Fondos parallax (4 escenarios × 5 capas + "FullBG") + scripts/escena demo | 27 |
| Hyper_Casual_UI | `Assets/Hyper_Casual_UI/` | Iconos/UI (Buttons, GameUI, Icons, Panel_Sprites, Toggle), 5 fuentes + licencia, 4 escenas demo | 209 |
| Monsters Creatures Fantasy 2 | `Assets/Monsters Creatures Fantasy 2/` | Sprites de enemigo/criatura — 4 criaturas + Animator Controllers + escena demo | 36 |
| Warrior free set | `Assets/Warrior free set/` | Sprites de personaje jugable único (21 animaciones) + 2 sprite sheets | 27 |
| ShootingSound | `Assets/ShootingSound/` | Efectos de sonido — 13 `.wav` reutilizables + léame | 14 |

### Characters

**Ruta**: `Assets/Characters/` · **Tipo de contenido**: sprites de personaje jugable · **Archivos**: ≈5040 (sin `.meta`)

30 héroes (`hero_1`..`hero_30`), cada uno con carpetas `male`/`female` × 6 estados de animación (`1_idle`, `2_walk`, `3_run`, `4_attack`, `5_block`, `6_die`).

**Completitud individual** (FR-002, SC-002) — conteo de frames por estado de animación (idéntico en `male` y `female` para las 30 carpetas):

| Héroe | Variante `male` | Variante `female` | idle | walk | run | attack | block | die | Estado |
|---|---|---|---|---|---|---|---|---|---|
| hero_1 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_2 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_3 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_4 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_5 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_6 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_7 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_8 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_9 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_10 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_11 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_12 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_13 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_14 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_15 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_16 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_17 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_18 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_19 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_20 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_21 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_22 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_23 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_24 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_25 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_26 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_27 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_28 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_29 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |
| hero_30 | Sí | Sí | 16 | 16 | 16 | 12 | 12 | 12 | **Completo** |

**100% de las 30 carpetas completas** — ninguna carece de variante de género ni de estado de animación.

### UI Elements + Raw and SpriteSheets

**Ruta**: `Assets/Assets/` · **Tipo de contenido**: iconos/UI · **Archivos**: 224 (216 en `UI Elements/`, 6 en `Raw and SpriteSheets/`, 2 escenas demo en `Scenes/`)

`UI Elements/` trae variantes `Black`/`White` en resolución `1x`/`2x`, más `Extras/` (círculos de progreso en 3 tamaños, barras de progreso, rects).

### Dragon Warrior Files

**Ruta**: `Assets/Dragon Warrior Files/` · **Tipo de contenido**: sprites de personaje jugable único + VFX · **Archivos**: 78

`Dragon Warrior PNG/` trae idle (6), walk (6), múltiples variantes de ataque (strike ×5, crouch_ATK ×3, jumpATK ×3), die (10), hurt (2), jump/flyKick/dizzy/win. `Effects/` (20 archivos) trae VFX reutilizable: `dashwind`, `explosion`, `fireball`, `iblast`, `potion`. Incluye `Demo.unity` y `Read Me.txt`.

### Free 2D Cartoon Parallax Background

**Ruta**: `Assets/Free 2D Cartoon Parallax Background/` · **Tipo de contenido**: fondos parallax · **Archivos**: 27

4 escenarios (`!_Moutain`, `2_Desert`, `3_Graveyard`, `4_Snow`) con 5 capas cada uno para parallax, más una versión `FullBG/` plana por escenario. Incluye `Demo/Scenes/Demo_Scene.unity` y 2 scripts demo (`BackgroundControl_0.cs`, `ParallaxBackground_0.cs`).

### Hyper_Casual_UI

**Ruta**: `Assets/Hyper_Casual_UI/` · **Tipo de contenido**: iconos/UI + fuentes · **Archivos**: 209

`Sprites/` (197 archivos) en `Buttons/`, `GameUI/`, `Icons/`, `Panel_Sprites/`, `Toggle/`. `Fonts/` trae 5 variantes de la fuente Baloo2 + `license.txt`. `Scenes/` trae 4 escenas demo (Buttons, Game UI, Icons, Pop Ups).

### Monsters Creatures Fantasy 2

**Ruta**: `Assets/Monsters Creatures Fantasy 2/` · **Tipo de contenido**: sprites de enemigo/criatura · **Archivos**: 36

4 criaturas (`Bat`, `Mimic`, `Rat`, `Slime`) — detalle de estados de animación por criatura en la sección [Enemigos y Criaturas](#enemigos-y-criaturas). Incluye `Demo/DemoScene.unity`.

### Warrior free set

**Ruta**: `Assets/Warrior free set/` · **Tipo de contenido**: sprites de personaje jugable único · **Archivos**: 27

`Aniamtion/` (sic) trae 21 animaciones (idle, attack, dash-attack ×2, croush, hurt ×2, death ×2, fall, run, jump, dash ×2, wall-slide ×2, edge-grab, edge-idle, ladder, slide, jump-to-fall) + `Warrior.controller`. `Sprite Sheet/` trae 2 hojas: `Warrior_Sheet-Effect.png` y `Warrior_SheetnoEffect.png`. Incluye `License.txt` y `Contact.txt`.

### ShootingSound

**Ruta**: `Assets/ShootingSound/` · **Tipo de contenido**: efectos de sonido · **Archivos**: 14 (13 `.wav` + `ReadMe.txt`)

Pack puramente de audio, sin sprites ni animaciones (FR-004b): `cannon_01/02`, `card`, `crossbow`, `electronic_01/02`, `heal`, `laser_01/02`, `machine_gun`, `magic_01/02/03`. Disponibles como sonido de ataque/habilidad reutilizable para cualquier unidad jugable; no se asignan a un personaje específico salvo que una spec futura lo decida.

---

## Enemigos y Criaturas

Candidatas a enemigo del pack `"Monsters Creatures Fantasy 2"` (FR-002b). **No se evalúan contra el Principio III** — ese principio aplica solo a unidades jugables (research.md §5).

| Criatura | Estados de animación disponibles | Nota |
|---|---|---|
| Bat | attack, death, fall, fly, fly-to-fall, hurt | Sin sprite `idle` explícito — `fly` parece cumplir ese rol de estado de reposo/movimiento por defecto; requiere confirmación de diseño |
| Mimic | idle_open, idle_closed, idle_transformed, opening, transform, attack_1, attack_2, walk, death, hurt | El más completo de las 4 criaturas — incluye un ciclo de transformación (cofre → criatura) |
| Rat | idle, run, attack_bite, hurt, death (`rat-death.png`) | Set mínimo pero completo (idle + ataque + muerte) |
| Slime | idle, walk, attack, hurt, death | Set mínimo pero completo (idle + ataque + muerte) |

Animator Controllers en `Assets/Monsters Creatures Fantasy 2/Animations/`: `idle_0`, `idle_0 1`, `fly_0`, `fly_0 1`, `attack_1_0` (nombres sugieren que están pensados originalmente para `Bat`/genéricos, no hay un controller por criatura confirmado — requiere inspección en el Editor para asignar controller↔criatura, fuera del alcance de solo-lectura por sistema de archivos de esta spec).

---

## Personajes — Principio III

Evaluación de cada candidato a unidad jugable contra el Principio III de la constitución (idle + ataque + variante visual adicional). FR-003.

| Personaje | Variantes | Estados presentes | Cumple Principio III (mínimo idle+attack) | Variante visual adicional |
|---|---|---|---|---|
| hero_1 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_2 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_3 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_4 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_5 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_6 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_7 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_8 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_9 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_10 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_11 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_12 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_13 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_14 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_15 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_16 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_17 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_18 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_19 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_20 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_21 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_22 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_23 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_24 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_25 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_26 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_27 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_28 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_29 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| hero_30 | male, female | idle, walk, run, attack, block, die | **Cumple** | Requiere decisión de diseño |
| Dragon Warrior | Personaje único | idle (6), walk (6), attack (strike ×5, crouch_ATK ×3, jumpATK ×3 = 11 variantes de ataque), die (10), hurt (2), jump (2), flyKick (6), dizzy (3), win (2) | **Cumple** — idle y attack ampliamente presentes, con múltiples variantes de ataque | Requiere decisión de diseño — no hay una segunda skin visible en los sprites; `Effects/` (`fireball`, `explosion`, `dashwind`, `iblast`, `potion`) es VFX de batalla reutilizable independientemente del personaje elegido, no una variante visual del propio Dragon Warrior |
| Warrior free set | Personaje único | Idle, Attack, Dash-Attack (2 variantes), Croush, Hurt (2 variantes), Death (2 variantes), Fall, Run, jump, Dash (2 variantes), Wall-Slide (2 variantes), Edge-Grab, Edge-Idle, Ladder, Slide, JumptoFall | **Cumple** — `Idle.anim` y `Attack.anim` presentes, además de `Dash-Attack.anim` como ataque alternativo | **Posible variante presente** — el pack trae 2 sprite sheets, `Warrior_Sheet-Effect.png` y `Warrior_SheetnoEffect.png` (con y sin efecto visual); no está confirmado si esto constituye la "variante visual adicional" del principio (podría ser solo una versión con/sin estela de partículas del mismo sprite) — requiere confirmación de diseño. Los efectos de sonido de `ShootingSound` quedan disponibles como sonido de ataque reutilizable para este u otro personaje, sin asignación fija |

**Resumen** (SC-002 aplicado a esta tabla): las 30 carpetas `hero_N` quedan reportadas individualmente — **32/32 candidatos a personaje jugable cumplen el mínimo (idle + attack)** del Principio III. Ninguno tiene confirmada la "variante visual adicional" sin revisión manual en el Editor: los 30 `hero_N` y Dragon Warrior quedan "requiere decisión de diseño" para ese único requisito; Warrior free set tiene una posible variante (2 sprite sheets) pendiente de confirmar.

---

## Recomendación de UI

Comparación entre `Assets/Assets/UI Elements` (216 archivos, `Black`/`White` × `1x`/`2x` + `Extras/`) y `Assets/Hyper_Casual_UI/Sprites` (197 archivos, `Buttons/`, `GameUI/`, `Icons/`, `Panel_Sprites/`, `Toggle/`). FR-004.

**Diferencia de estilo** (determina la recomendación por pantalla): `UI Elements` es un set de iconos planos monocromáticos (una sola línea de color, `Black`/`White`) sin texto integrado — pensado como capa de controles mínima que no compite visualmente con el arte del juego. `Hyper_Casual_UI` es un set ilustrado, colorido, con texto en inglés ya incrustado en los sprites ("Claim Reward", "Daily Reward", "Next Level", "DEFEAT PANNEL") y paneles/popups completos ya diseñados (`Main Menu pannel`, `Settings pannel`, `Level popup`, `Victory Pannel`) — pensado como identidad visual completa de menú, no solo iconos sueltos. `Hyper_Casual_UI` además trae un componente que `UI Elements` no tiene: un toggle interactivo (`Toggle_ON.png`/`Toggle_Off.png`).

**Categorías solapadas** (mismo concepto, estilo distinto):

| Categoría | En `UI Elements` | En `Hyper_Casual_UI` |
|---|---|---|
| Pausa | `Black\|White/1x\|2x/pause.png` | `Buttons/Pause.png`, `Buttons/Pause (1).png`, `Icons/Pause (2).png`, `GameUI/Pause (1).png` |
| Ajustes/Settings | `.../settings.png` | `Buttons/Setting.png`, `Buttons/Setting (1).png`, `Icons/setting.png`, `GameUI/Settings (2).png`, `Panel_Sprites/Settings pannel.png` |
| Home / Menú principal | `.../home.png`, `.../menu1.png`, `.../menu2.png` | `Buttons/Home.png`, `Icons/home_icon.png`, `GameUI/Main Menu.png`, `Panel_Sprites/Main Menu pannel.png` |
| Música/Sonido on-off | `.../music on.png`, `.../music off.png`, `.../mic on.png`, `.../mic off.png` | `Icons/musicOn.png`, `Icons/musicoff.png`, `Icons/soundon.png`, `Icons/soundoff.png` |
| Compartir | `.../share.png` | `Icons/Share.png`, `Icons/Share (1).png`, `GameUI/SHARE FOR REWARDS.png` |
| Bloqueo/Desbloqueo | `.../lock.png`, `.../unlock.png` | `Icons/lock.png`, `GameUI/UNLOCK NEW SKIN.png`, `GameUI/NEW ITEM UNLOCKED.png` |
| Leaderboard | `.../Leaderboard.png` | `Buttons/Leaderboard.png`, `Icons/leaderboard.png` |
| Info/Ayuda | `.../info.png` | `Icons/Info.png`, `Icons/Info (1).png`, `Icons/help.png`, `Icons/help (1).png`, `Icons/Help (2).png` |
| Cerrar/Cross | `.../cross.png` | `Icons/Cross.png`, `Icons/Cross pressed.png`, `Icons/Close.png`, `Buttons/Close (1).png` |
| Botón genérico vacío | `.../BUtton 1/2/3.png`, `.../BUtton A/B/C.png` | `Buttons/empty_buttons/*` (10 colores: GOLDEN, GREY, PURPLE, PINK, blue, cyan, green, orange, yellow, light red/blue, lightgrey) |

**Recomendación por pantalla** (SC-003 — cero pantallas sin decisión):

| Pantalla | Pack recomendado | Motivo |
|---|---|---|
| `MainMenu` | `Hyper_Casual_UI` | Ya trae `GameUI/Main Menu.png` y `Panel_Sprites/Main Menu pannel.png` listos, con estilo ilustrado consistente con la identidad del juego (Principio III — diferenciador visual); `UI Elements` no tiene un panel de menú, solo iconos sueltos |
| `AdventureMap` | `Hyper_Casual_UI` | `GameUI/Level.png`, `GameUI/Level screen.png`, `Panel_Sprites/Level popup.png`, botón `Buttons/Next Level.png` cubren directamente la selección de capítulo/banner que ya construye `AdventureMapUIController`/`ChapterBannerItemView` |
| `PlayerBase` | `Hyper_Casual_UI` | `Buttons/Upgrade.png`/`Upgrade (1).png`, `Buttons/Customize.png`, `Panel_Sprites/Shop Panel` (vía `GameUI/Shop Panel.png`), `Icons/character.png`/`character2.png` cubren mejora de unidad y formación de equipo (`UnitUpgradeUIController`, `TeamFormationUIController`) |
| HUD de batalla (`Chapter1_Battle` y sucesores) | `UI Elements` | Los iconos planos monocromáticos (`pause`, `settings`, `stop`) tienen huella visual mínima y no compiten con los sprites animados del combate ni con el fondo parallax — el estilo ilustrado y con texto de `Hyper_Casual_UI` es demasiado pesado para superponerse sobre la acción en curso |

**Consistencia**: para evitar mezclar estilos dentro de una misma pantalla (Edge Case de spec.md), cuando `MainMenu`/`AdventureMap`/`PlayerBase` necesiten un icono que solo existe en `UI Elements` (por ejemplo alguna flecha direccional), la recomendación es re-crear ese icono en el estilo de `Hyper_Casual_UI` en vez de mezclar ambos packs en la misma pantalla — decisión de diseño a confirmar antes de integrar, fuera del alcance de esta spec (FR-007).

---

## Licencias y Riesgos

Archivos de licencia/atribución/contacto encontrados en los 8 packs (FR-005, SC-004). Revisión de superficie únicamente — no es validación legal exhaustiva (spec.md Assumptions).

| Archivo | Ruta | Pack | Resumen de superficie | Estado |
|---|---|---|---|---|
| Read Me.txt | `Assets/Dragon Warrior Files/Read Me.txt` | Dragon Warrior Files | Remite a `graphictoon.com`, menciona arte gratuito y descuentos — no fija términos de uso explícitos | Pendiente de revisión legal manual |
| license.txt | `Assets/Hyper_Casual_UI/Fonts/license.txt` | Hyper_Casual_UI | Copyright 2019 The Baloo 2 Project Authors — licenciado bajo SIL Open Font License 1.1 | Pendiente de revisión legal manual |
| License.txt | `Assets/Warrior free set/License.txt` | Warrior free set | Uso personal y comercial permitido, se puede modificar; crédito no obligatorio pero apreciado; **prohíbe redistribuir o revender** el asset tal cual | Pendiente de revisión legal manual |
| Contact.txt | `Assets/Warrior free set/Contact.txt` | Warrior free set | Datos de contacto del autor (Twitter/Instagram/email/Itch.io/ArtStation: Clembod) — no es una licencia en sí, pero acompaña a `License.txt` | Pendiente de revisión legal manual |
| ReadMe.txt | `Assets/ShootingSound/ReadMe.txt` | ShootingSound | "Free. Freely usable. Do not resell." + listado de los 13 `.wav` incluidos | Pendiente de revisión legal manual |

**Nota de riesgo destacada**: `Warrior free set/License.txt` es el único de los 5 con una prohibición explícita (no redistribuir/revender el asset) — relevante si el juego se distribuye comercialmente con este personaje integrado; el resto son permisivos o no fijan términos claros (Dragon Warrior).

**5/5 archivos de licencia/léame detectados en los 8 packs quedan listados con su ruta exacta** (SC-004). No se encontraron archivos de licencia adicionales en `Assets/Assets/`, `Assets/Free 2D Cartoon Parallax Background/`, `Assets/Monsters Creatures Fantasy 2/` ni `Assets/Characters/`.

---

## Problemas Estructurales

Hallazgos estructurales sobre los 8 packs (FR-006, Edge Cases de spec.md).

### Archivos `.meta` faltantes

**Ninguno.** Se comparó cada archivo de los 8 packs (≈5713 archivos sin contar `.meta`) contra su `.meta` correspondiente — el 100% tiene su `.meta` presente. No hay importaciones potencialmente rotas por este criterio.

### Carpetas `hero_N` incompletas

**Ninguna.** Ya confirmado en US1 (sección [Characters](#characters)): las 30 carpetas `hero_N` tienen ambas variantes de género y los 6 estados de animación completos.

### Escenas/scripts de demo sin cablear

Se comparó cada escena de demo incluida en los packs contra `ProjectSettings/EditorBuildSettings.asset` (que solo lista `MainMenu`, `AdventureMap`, `Chapter1_Battle`, `SampleScene`, `PlayerBase`) y contra referencias en `Assets/Scripts/` y `Assets/Scenes/` propios del proyecto. Ninguna de las siguientes está cableada:

| Escena/script de demo | Pack | Estado |
|---|---|---|
| `Dragon Warrior Files/Demo.unity` | Dragon Warrior Files | No está en Build Settings ni referenciada |
| `Assets/Assets/Scenes/ProgressBar and Sliders.unity` | UI Elements | No está en Build Settings ni referenciada |
| `Free 2D Cartoon Parallax Background/Demo/Scenes/Demo_Scene.unity` | Free 2D Cartoon Parallax Background | No está en Build Settings ni referenciada |
| `Free 2D Cartoon Parallax Background/Demo/Script/BackgroundControl_0.cs` | Free 2D Cartoon Parallax Background | No hay ninguna referencia a esta clase en `Assets/Scripts/` ni `Assets/Scenes/` propios |
| `Free 2D Cartoon Parallax Background/Demo/Script/ParallaxBackground_0.cs` | Free 2D Cartoon Parallax Background | No hay ninguna referencia a esta clase en `Assets/Scripts/` ni `Assets/Scenes/` propios |
| `Hyper_Casual_UI/Scenes/Demo_Buttons.unity` | Hyper_Casual_UI | No está en Build Settings ni referenciada |
| `Hyper_Casual_UI/Scenes/Demo_Game_UI.unity` | Hyper_Casual_UI | No está en Build Settings ni referenciada |
| `Hyper_Casual_UI/Scenes/Demo_Icons.unity` | Hyper_Casual_UI | No está en Build Settings ni referenciada |
| `Hyper_Casual_UI/Scenes/Demo_Pop_Ups.unity` | Hyper_Casual_UI | No está en Build Settings ni referenciada |
| `Monsters Creatures Fantasy 2/Demo/DemoScene.unity` | Monsters Creatures Fantasy 2 | No está en Build Settings ni referenciada |

Estas 10 escenas/scripts son seguras de dejar sin cablear (no afectan el build actual, que solo incluye las 5 escenas propias del proyecto) — quedan disponibles como referencia de cómo el autor original de cada pack pensó su integración, útil si una spec futura decide adoptarlas.

### Otros hallazgos de diseño (no bloqueantes)

- **`Bat` (Monsters Creatures Fantasy 2)** no tiene un sprite `idle` explícito — solo `attack`, `death`, `fall`, `fly`, `fly-to-fall`, `hurt`. No se trata como importación rota (todos los `.meta` están presentes); es una decisión de diseño del pack original (criatura voladora sin estado de reposo en tierra) a confirmar si `Bat` se adopta como enemigo.
- **`Assets/Assets/UI Elements`** no tiene un componente de toggle interactivo (a diferencia de `Hyper_Casual_UI/Sprites/Toggle/`) — no es un defecto de importación, es una diferencia de cobertura entre ambos packs de UI (ver [Recomendación de UI](#recomendación-de-ui)).

---

## Validación final (quickstart.md)

Ejecutado sobre esta versión del catálogo (T026):

| Check | Resultado |
|---|---|
| US1 — al menos una sección/subsección por cada uno de los 8 packs | ✅ 8 subsecciones `###` bajo `## Packs` |
| US2 — 30 referencias `hero_N` distintas, todas marcadas | ✅ `hero_1`..`hero_30`, las 30 marcadas **Cumple** |
| US3 — recomendación explícita en las 4 pantallas núcleo | ✅ `MainMenu`, `AdventureMap`, `PlayerBase`, HUD de batalla — cero pantallas sin decisión |
| US4 — 100% de archivos de licencia/léame listados con ruta exacta | ✅ 5/5 (`Read Me.txt`, `license.txt`, `License.txt`, `Contact.txt`, `ReadMe.txt`) |
| FR-006 — problemas estructurales señalados | ✅ 0 `.meta` faltantes, 0 `hero_N` incompletos, 10 escenas/scripts demo sin cablear identificados |
| FR-007 — `Assets/` sin cambios durante la auditoría | ✅ Confirmado vía `git status --short -- Assets` antes y después (mismo conteo de archivos untracked/modified) |

**Las 4 historias de usuario (US1-US4) y el requisito de problemas estructurales (FR-006) están completos.** Spec `011-imported-asset-audit` lista para servir como insumo a specs futuras (FR-008) sin necesidad de re-escanear los packs.
