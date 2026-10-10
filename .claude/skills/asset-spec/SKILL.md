---
name: asset-spec
description: "Per-asset visual specs + AI image-generation prompts for cats, enemies, bases and stage maps/backdrops, anchored to the art bible and to what the code can render. Run after /art-bible."
argument-hint: "[cat:<id> | enemy:<id> | region:<id> | base | missing]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
model: sonnet
---

<!--
Adapted from Donchitos/Claude-Code-Game-Studios (MIT, see LICENSE in this folder).
Changes for battle-cats-web: removed the yaml-helper.sh config preprocessing, the
review/automation modes and the art-director / technical-artist agent spawns (not
installed here: the main session derives specs and says so). Remapped paths:
design/art/art-bible.md -> docs/art/art-bible.md; design/assets/ -> docs/art/;
GDDs/levels/characters -> src/data/*.ts. Target types are now cat / enemy / region /
base. Added the three-tier render model (sprite / procedural / cyber body), the
sprite-pipeline constraints and the Spec Kit hand-off.
-->

# Asset Spec

Produces, per asset, a written visual spec, the **code hook** that would consume it, and
a ready-to-paste **image-generation prompt**. It writes documents only — it never edits
`src/`, never calls an image generator, and never copies files into `public/`.
Write generated documents **in Spanish**; prompts for image models stay in English
(they work better), and identifiers stay as in the code.

Every `AskUserQuestion` is a normal collaborative prompt: confirm lists before
speccing, and ask before writing any file.

Outputs (create `docs/art/` as needed):
- `docs/art/entity-inventory.md` — everything that needs art, with its current tier
- `docs/art/asset-specs/<target>-assets.md` — the specs
- `docs/art/asset-manifest.md` — project-wide `ASSET-NNN` index and status

## Insufficient input — check before producing anything

If an input this skill needs is ABSENT, the section that depends on it is
**`NOT ASSESSED — NO DATA`**; do not estimate it or infer it from a neighbouring file.
For each input record FOUND / ABSENT (do not assume). A run that cannot be anchored to
anything is reported as "could not run", naming what is missing — that is a correct
result, not a failure.

## How units are rendered (the model the specs target)

`src/game/UnitSprite.tsx` picks the first that applies — **re-verify with Read**:

| Tier | Trigger | What the asset is | Fallback if it fails |
|---|---|---|---|
| A. Sprite pack | `Cat.spriteKey` in `src/data/cats.ts` resolves in `src/game/spriteAssets.ts` | PNG frames in `public/sprites/<spriteKey>/idle/N.png` (16) and `/attack/N.png` (12), RGBA 300×300 | tier B, then C |
| B. Procedural | a `ProceduralDesign` exists for the id in `src/data/seedData.ts` or `src/data/imperioCap1Design.ts` | `{ primaryColor, baseShape: circle\|rect\|poly, size, distinctiveFeature }`, drawn by `src/game/graphics/unitFactory.ts` | tier C |
| C. Cyber body | neither of the above | stat-derived rounded body (`getVisualProfile` + `cyberUnitBody.ts`), team colour cyan/red | — |

Constitution § III requires every unit to have an idle/move and an attack animation:
tier A has both as frame sets; tiers B and C get them from transforms in
`src/game/animation.ts`. A spec must say which tier it targets.

Known constraints (verify each with Grep before relying on it):
- Frame counts are constants for **all** keys (`IDLE_FRAME_COUNT=16`, `ATTACK_FRAME_COUNT=12`, `HERO_COUNT=12` in `spriteAssets.ts`). A sprite set with a different count, or a 13th key, needs a code change — never present it as drop-in.
- On screen every tier is drawn into a `bodyWidth × bodyHeight` box (`Cat.width` px wide, `14 + 0.09·hp` px tall clamped to 14–40; `getVisualProfile` in `src/game/animation.ts`). A 300×300 frame is shrunk ~7–21× and **stretched to that aspect ratio**; enemies are mirrored, so sprites must face **right**. Specs must require legibility at 14–44 px and tolerance to mild non-uniform scaling, and prompts must ask for bold outlines and simple masses.
- Tiers B and C have no frame animation of their own — only the transform bob/squash in `animation.ts` (and, for C, visor/thruster alpha pulses).
- `ProceduralDesign.primaryColor` must be unique across the catalogue; `size` mirrors `Cat.width`.
- `scripts/copy-sprites.mjs` is a one-off copier from `assets-source/`; `assets-source/` is raw material (not web-ready, 172 MB+) and must not be bulk-imported.
- CSS/TSX outside `src/game/` must use `--bc-*` tokens (`tests/unit/theme/designTokens.test.ts`); Pixi code in `src/game/` uses numeric hex and is exempt, but should mirror the tokens.
- Maps: `.stage-map__canvas` height = `max(320, nodes × 70)` px (`LevelSelectScreen.tsx`), 40 px nodes, `mapPosition {x,y}` in % (`src/data/levels.ts`); the map has **no illustration today**, only CSS gradients. Battle: lane at 62 % of the height with 8 % side margins (`src/game/graphics/layout.ts`); base towers 46×70 px (`baseTower.ts`).
- No audio system exists in this build — audio is out of scope.

---

## Phase 0b: Entity inventory (when there is no argument and no inventory yet)

1. If `docs/art/entity-inventory.md` exists, read it, find the first row with status
   `Needed` and no spec file, and ask: "The next unspecced item is **[name]**. Spec it?"
   (`[A] Yes` / `[B] Pick another` / `[C] Stop`).
2. Otherwise **build it from the code** — never from memory:
   - Units: read the arrays in `src/data/cats.ts` (`CATS` mixes playable cats and `enemy-*` entries — tell them apart by id prefix and `cost: 0`), `src/data/gachaUnits.ts`, and the `SEED_UNITS`/`SEED_ENEMIES` in `src/data/seedData.ts`.
   - Tier per unit: `spriteKey` present → A; id in `seedData.ts`/`IMPERIO_CAP1_DESIGNS` → B; else C.
   - Regions and stages: `region` values and counts in `src/data/levels.ts`, event stages in `src/data/events.ts`.
   - Bases: ally and enemy tower (`baseTower.ts`).
   - Art bible: named categories, asset standards (§8).
3. Present the inventory and a one-line tier summary ("N units: a in tier A, b in B, c in C"), then ask: `[A] Looks good — save` / `[B] Add items` / `[C] Remove items` / `[D] Both`.
4. After approval, ask "May I write `docs/art/entity-inventory.md`?" and write:

```markdown
# Inventario de entidades visuales
> Generado: [fecha] · Fuentes: [archivos leídos]

## Unidades
| # | ID | Nombre | Tipo (Gato/Enemigo) | Rareza | Nivel actual (A/B/C) | Origen | Estado |
## Mapas y fondos
| # | ID de región | Niveles | Descripción | Origen | Estado |
## Bases
| # | Nombre | Descripción | Origen | Estado |
```

Then tell the user which next commands apply (`/asset-spec cat:<id>`, `region:<id>`,
`base`, `missing`).

---

## Phase 0: Parse the argument

- `cat:<id>` / `enemy:<id>` — a unit, by its id in the data files (validate it exists; if not, list the closest ids and ask)
- `region:<id>` — a stage-map region plus its battle backdrop (`imperio-de-los-gatos`, `imperio-de-los-gatos-cap1`, event stages)
- `base` — ally and enemy towers
- `missing` — every inventory row without a spec, one target at a time
- no argument → Phase 0b

## Phase 1: Gather context (read before asking the user anything)

- **Art bible**: `docs/art/art-bible.md`. Extract Visual Identity Statement, Colour System, Shape Language, Character Design Direction (§5), Environment Design Language (§6), Asset Standards (§8).
  If it is missing, say: "No art bible found. Run `/art-bible` first — specs are anchored to its rules." Then offer, via `AskUserQuestion`, `[A] Stop — run /art-bible` or `[B] Continue anchored on the existing visual sources`. If [B]: anchor on `src/theme.css`, `docs/roadmap-rediseno-visual.md`, the sprites already in `public/sprites/` and `docs/design-reference/prompts-sprites-robots-nanobanana.md`; put at the top of the spec "Sin biblia de arte: las reglas de color, forma y estándares de abajo son propuestas, no restricciones", and cite no art bible section.
- **Source of the target**:
  - cat/enemy → its entry (stats: `width`, `hp`, `speed`, `damage`, `attackType`/`attackRange`, `classification`, `abilities`, `rarity`, `evolutions`), its `spriteKey`/`ProceduralDesign` if any, and its `specs/NNN-*/data-model.md` description where one exists (Grep the id under `specs/`).
  - region → its `Level` entries (count, `mapPosition` range, `difficulty` range), `treasureId`s, event banners.
  - base → `src/game/graphics/baseTower.ts` and `BaseTower.tsx`.
- **Existing specs**: `docs/art/asset-specs/<target>-assets.md` (re-run → propose only what is new/changed) and `docs/art/asset-manifest.md` (to reuse existing `ASSET-NNN`, see Shared Asset Protocol).
- For units, also **Read one or two sprite frames** of the nearest tier-A unit so the prompt can match or deliberately depart from the existing pixel style.

Present a context summary: target, source files, art-bible status (found / absent),
current tier, shared assets found.

## Phase 2: Identify the assets

Derive the list from the source — explicit and implied.

**cat / enemy** (group by tier the user wants to produce; default is to spec what the art bible §5 says that unit's tier should be):
- Tier A: idle frames (16), attack frames (12), 300×300 RGBA, same baseline/anchor on every frame, character facing right, silhouette readable at 14–44 px. If the user wants a different count → flag the code change (see constraints) instead of silently speccing it.
- Tier B: the `ProceduralDesign` entry (colour, shape, size, feature) — specified as the exact line to add, respecting the uniqueness rule.
- Optional if a screen shows it: portrait/icon (none exist in the UI today — only spec one if the art bible or the user asks).
**region**: stage-map backdrop (note the canvas aspect: tall and variable), node/link treatment per state (`locked`/`unlocked`/`completed`/`event`) if the bible changes it, region banner, battle backdrop layers (far / mid / lane strip), event-stage variant.
**base**: ally tower, enemy tower, damaged/low-HP state if the bible asks for one.

Show the grouped list and ask: `[A] Proceed` / `[B] Remove some` / `[C] Add some` / `[D] Adjust grouping`.
Do **not** continue without confirmation.

## Phase 3: Generate the specs

No specialist agent exists. State this at the top of the output, before the specs:
"art-director and technical-artist not available — specs derived in this session from the
art bible and the code constraints above; no specialist has reviewed them."

For each asset produce:
1. A 2–3 sentence visual description specific enough that two artists would make the same thing, anchored to the bible's shape language and colour system (cite sections).
2. The technical block: dimensions, format, naming, frame count, pivot/baseline.
3. The **code hook**: exactly which file/field consumes it (`src/data/cats.ts` `spriteKey`, `src/data/imperioCap1Design.ts` entry, `src/game/spriteAssets.ts` constants, a CSS class in `src/theme.css`) and whether that hook needs a code change. Never write the change; describe it.
4. A generation prompt (English): build it from the project's DNA block in `docs/design-reference/prompts-sprites-robots-nanobanana.md` **only if** the art bible's character direction is still "chibi, thick black outline, flat cel-shaded"; otherwise write the DNA block from the bible and say the old one no longer applies. Keep that guide's flow: turn 1 is a reference sheet in a neutral pose, later turns *edit* that image for each pose, plain white background (no real alpha — remove the background afterwards), same canvas/scale/anchor in every frame, and fall back to turn 1 if the model drifts. Include: style keywords, palette anchors from the bible, composition, negative prompt.
5. Which bible rules govern it, by section.

**Conflicts**: if what the bible wants cannot be rendered by the code as it stands (frame
counts, a new `distinctiveFeature` that `unitFactory.ts` does not draw, a map background
the DOM layout cannot place), surface it as an explicit conflict with both positions;
never resolve it silently. Typical resolution path: `[A]` fit the asset to the existing
code, `[B]` keep the asset and open a Spec Kit spec to change the code.

## Phase 4: Compile and review

Present every spec in this format and then ask `[A] Approve all — write` /
`[B] Revise a specific asset` / `[C] Regenerate with a different direction`. Revise text
inline for [B]; only redo the visual direction for [C].

```
## ASSET-[NNN] — [Name]

| Campo | Valor |
|---|---|
| Categoría | Sprite A / Diseño procedural B / Cuerpo cyber C / Fondo / Base / UI |
| Dimensiones | [p. ej. 300×300 px RGBA, 16 + 12 fotogramas] |
| Formato y nombre | [p. ej. PNG · public/sprites/hero_13/idle/N.png] |
| Gancho en el código | [archivo · campo · ¿requiere cambio de código? sí/no] |

**Descripción visual:** [2–3 frases]

**Reglas de la biblia:**
- §3 Lenguaje de formas: [regla aplicada]
- §4 Sistema de color: [rol del color]

**Prompt de generación:**
[prompt en inglés]

**Estado:** Pendiente
```

## Phase 5: Write the files

After approval ask "May I write `docs/art/asset-specs/<target>-assets.md`?" (if it
exists, **update in place**: keep existing `ASSET-NNN` blocks and ids, apply only the
approved changes, append new ones with the next project-wide id, and ask "May I
update…?" instead). Header:

```markdown
# Especificaciones de assets — [tipo]: [objetivo]
> **Origen**: [archivos] · **Biblia de arte**: docs/art/art-bible.md (o «sin biblia») · **Generado**: [fecha]
> **Revisión**: ninguna de especialista — derivado por la sesión principal
```

Then ask "May I update `docs/art/asset-manifest.md`?" — create it if absent:

```markdown
# Manifiesto de assets
> Última actualización: [fecha]
| Total | Pendientes | En producción | Hechos | Aprobados |
|---|---|---|---|---|
## [Tipo]: [Objetivo]
| ID | Nombre | Categoría | Estado | Archivo de especificación |
```

**IDs are project-wide and sequential.** Before assigning, Grep `ASSET-` in the manifest
and start at highest + 1 (`ASSET-001` if none).

## Phase 6: Close — turning specs into the game

A spec is not the asset, and the asset is not in the game. Say plainly what remains:
generating the images (outside this skill), post-processing them (remove the white
background, crop every frame to the same canvas and baseline), placing them in
`public/sprites/<spriteKey>/…`, and the code changes (`spriteAssets.ts`, `cats.ts`,
`imperioCap1Design.ts`, CSS). Anything that touches `src/` goes through a Spec Kit spec
first (constitution § Workflow): offer to draft the `/speckit-specify` input from the
approved specs.

Ask: `[A] Spec another target` / `[B] Draft the /speckit-specify input for this one` /
`[C] Stop here`.

## Shared Asset Protocol

Before speccing, check the manifest for an equivalent asset (e.g. a backdrop shared by
two stages of one region, a tower reused across regions, a feature drawn the same way
for two units). Reuse its `ASSET-NNN` instead of duplicating, and note the new user:
"ASSET-012 already specced for `imperio-de-los-gatos`; reused for `cap1`."

## Collaborative protocol

**Identify → Confirm → Generate → Review → Approve → Write.**
- Never spec an asset before the user confirms the asset list.
- A spec that contradicts the art bible is wrong; one that the code cannot render is a conflict, not a spec.
- Write the spec file only after approval, and update the manifest right after.
