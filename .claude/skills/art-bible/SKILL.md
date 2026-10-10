---
name: art-bible
description: "Author the Art Bible (docs/art/art-bible.md): visual identity for cats, enemies, stage maps/backdrops, UI and asset standards. Run before /asset-spec."
argument-hint: "[core|characters-maps|full|resume]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
model: sonnet
---

<!--
Adapted from Donchitos/Claude-Code-Game-Studios (MIT, see LICENSE in this folder).
Changes for battle-cats-web: removed the yaml-helper.sh config preprocessing, the
review/automation/workflow modes, the director gates and every specialist-agent spawn
(art-director, ux-designer, technical-artist are not installed here: the main session
authors each section and says so in the document header). Remapped paths:
design/art/art-bible.md -> docs/art/art-bible.md; game concept -> constitution +
roadmap-rediseno-visual + theme.css. Added the "Visual reality" ground truth below and
the project-specific constraints for Sections 3-8.
-->

# Art Bible

Output: `docs/art/art-bible.md`. Write it **in Spanish** (the language of every other
doc in this repo); keep file paths, identifiers and code in their original form.

Every `AskUserQuestion` is a normal collaborative prompt: always ask before locking a
section and before writing a file. The bible is a **constraint document** — it narrows
future visual decisions in exchange for coherence, so each section must forbid
something, not only describe.

**No specialist review exists here.** The original skill delegates every section to an
`art-director` agent; this project has none. You author each section yourself, and the
document header must say so (see the template). Never present a draft as if a
specialist had reviewed it.

---

## Visual reality — ground truth to verify before authoring

These were true when the skill was adapted. **Re-verify each with Grep/Read** — code
drifts, and a bible written against stale facts is worse than none.

**Four visual languages coexist today, and nothing reconciles them:**

| # | Where it shows | What it is | Source |
|---|---|---|---|
| 1 | UI screens | "Cyber-Modern": dark panels, neon cyan/orange/purple, Orbitron headings + Inter body, `lucide-react` outline icons | `src/theme.css` (`--bc-*` tokens), mockup `docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html` |
| 2 | Battle, units with `spriteKey` | Third-party **fantasy chibi humans** (knights/fighters, thick black outline, flat colour) — not cats, not neon | `public/sprites/hero_1..hero_12/{idle,attack}/N.png` (300×300 RGBA; 16 idle + 12 attack frames), `src/game/spriteAssets.ts` |
| 3 | Battle, units with a `ProceduralDesign` | Geometric shape (`circle`/`rect`/`poly`) + one `distinctiveFeature` (`fangs`, `fin`, `crest`, `cat-ears`, `horns`, `wings`, `shield`, `spikes`, `tail`, `none`) with a neon rim, armor plates and a visor | `src/data/seedData.ts`, `src/data/imperioCap1Design.ts`, `src/game/graphics/unitFactory.ts` |
| 4 | Battle, everything else | Stat-derived rounded-rect "cyber" body: team gradient (player cyan `0x22d3ee`, enemy red `0xef4444`), glow rings, visor, thruster | `src/game/graphics/cyberUnitBody.ts`, `src/game/animation.ts` (`getVisualProfile`) |

Render precedence in `src/game/UnitSprite.tsx`: real sprite frames → procedural design
→ cyber body. Which units fall in which tier is **not** documented anywhere — derive it
from `src/data/cats.ts` (`spriteKey`), `seedData.ts`, `imperioCap1Design.ts`,
`gachaUnits.ts` (the 4 gacha units are deliberately sprite-less).

**Other facts the sections below depend on:**
- Maps are DOM/SVG, **no illustration**: `.stage-map` (radial-gradient wash), `.stage-map__canvas` (height `max(320, nodes×70)` px — 48 nodes ≈ 3360 px), 40 px `.stage-node--{locked,unlocked,completed,event}`, dashed `.stage-map__link`; node positions are `mapPosition {x,y}` in % (`src/data/levels.ts`; Chapter 1 is a serpentine of 8 columns × 6 rows). See `src/screens/LevelSelectScreen.tsx`, `src/theme.css`.
- Battle backdrop: `.battle-stage` radial gradients in CSS + `LaneBackground` (floor grid + neon horizon) in `src/game/BattleStage.tsx`; lane at `LANE_Y_FRACTION` (0.62) of the height with `LANE_MARGIN_FRACTION` (0.08) per side for the bases (`src/game/graphics/layout.ts`); base towers 46×70 px (`src/game/graphics/baseTower.ts`).
- Unit collision `width` ranges roughly 14–44 px, so in-battle silhouettes are tiny. `UnitSprite.tsx` draws **every** tier into a `bodyWidth × bodyHeight` box (`bodyWidth` = `Cat.width`; `bodyHeight` = 14 + 0.09·`hp`, clamped to 14–40 px — `getVisualProfile` in `src/game/animation.ts`): a 300×300 frame is shrunk roughly 7–21× **and stretched to a stat-derived aspect ratio**, and enemies are mirrored (`scale.x = -1`), so every sprite must face **right**.
- Raw art is staged, not wired: `assets-source/` (30 hero packs of which 12 are copied by `scripts/copy-sprites.mjs`; enemy monsters in `units/MonstersCreaturesFantasy2`; parallax banners in `banners/Free2DCartoonParallaxBackground`: `!_Moutain`, `2_Desert`, `3_Graveyard`, `4_Snow`). Do not bulk-import it (172 MB+).
- Constitution § III: every playable/enemy unit needs **at least an idle/move animation and an attack animation** — a static sprite is never "complete".
- Pixi code (`src/game/**`) cannot read CSS variables: world colours are numeric hex there and are **exempt** from `tests/unit/theme/designTokens.test.ts`. Everything else (CSS, `.tsx` outside `src/game/`) must use `--bc-*` tokens or the test fails.
- `docs/design-reference/prompts-sprites-robots-nanobanana.md` is an existing prompt guide, written for the Unity version and for *robot* sprites. Its generation flow is reusable; its Unity post-processing (§7–8) is not.

**The bible's first job is to resolve that fragmentation** (Sections 1, 3 and 5). Do
not paper over it with a description that happens to fit all four.

---

## Phase 0: Context and retrofit detection

Read, noting each as FOUND or ABSENT (do not assume):
- `.specify/memory/constitution.md`
- `docs/roadmap-rediseno-visual.md` (Cyber-Modern direction; written for the Unity port — its `UIThemeCatalog` is `src/theme.css` here)
- `src/theme.css` `:root` block (the UI token set)
- `docs/design-reference/prompts-sprites-robots-nanobanana.md`
- `src/game/graphics/*.ts`, `src/game/spriteAssets.ts`, `src/game/animation.ts`
- Two or three sprite frames with the image Read (e.g. `public/sprites/hero_1/idle/1.png`) so Section 5 is judged from the pixels, not from the folder names
- The mockup file **by Grep only** (it is ~143 KB): search the screen or state you need, never full-read it

If `docs/art/art-bible.md` exists, **do not read it whole**. Build the status table
from headings and placeholders only:

```
Grep pattern="^## [1-9]\." path="docs/art/art-bible.md" output_mode="content" -n
Grep pattern="\[Por diseñar\]|\[TBD\]|^_?TODO" path="docs/art/art-bible.md" output_mode="content" -n
```

A section is **Complete** if it spans real lines and holds no placeholder, **Placeholder**
if a marker falls inside it, **Empty** if two headings are adjacent. Read a section's
line range with `Read(offset, limit)` only when ambiguous. Present the table and say:
"I will work only on incomplete sections; complete ones will not be touched."

If the file does not exist, ask: "May I create `docs/art/art-bible.md` from the template
below?" Each approved section then replaces its own `[Por diseñar]` line with `Edit`.

### Template (the nine headings are what retrofit mode greps — keep them)

```markdown
# Biblia de Arte — Battle Cats Web

> **Estado**: [N]/9 secciones completas
> **Revisión de dirección de arte**: ninguna — redactada por la sesión principal, sin revisión de un especialista
> **Última actualización**: [fecha]

## 1. Declaración de identidad visual
[Por diseñar]

## 2. Atmósfera y estados de ánimo
[Por diseñar]

## 3. Lenguaje de formas
[Por diseñar]

## 4. Sistema de color
[Por diseñar]

## 5. Dirección de diseño de personajes
[Por diseñar]

## 6. Lenguaje de entornos (mapas y fondos de batalla)
[Por diseñar]

## 7. Dirección visual de UI/HUD
[Por diseñar]

## 8. Estándares de assets
[Por diseñar]

## 9. Referencias
[Por diseñar]
```

---

## Phase 1: Framing

Use `AskUserQuestion` with two questions.

**Scope** — "Which sections need to be authored today?"
- `Core + characters & maps (sections 1–6)` **(Recommended)** — what `/asset-spec` needs to spec cats, enemies and maps. Sections 7–9 are mostly already decided by `src/theme.css` and the mockup.
- `Full bible — all 9 sections`
- `Visual identity core (sections 1–4 only)`
- `Resume — fill in the Empty/Placeholder sections`

If the argument names a scope (`core`, `characters-maps`, `full`, `resume`), use it
without asking.

**References** — "Reference games, films or art that define the direction?" Free text,
no preset options. Treat references as *what to take / what to avoid*, never as
"copy X": this project is already a Battle Cats lookalike, so the bible must say what
makes its own look distinct.

Author only the sections in scope; Phase 4 names every section left out.

---

## Phase 2: Visual identity foundation (Sections 1–4)

Author and write each section to file before the next. Per section:
**draft → present → `AskUserQuestion` → write**. The approving option is always
`[A] Lock this in and write it to docs/art/art-bible.md`; the others are
`[B] Revise` and `[C] I'll describe my own direction`. No section is written without [A].

### Section 1 — Visual Identity Statement
A one-line visual rule that could settle any visual ambiguity, plus 2–3 supporting
principles, each with a design test ("when X is ambiguous, choose Y"). Anchor them in
the constitution's principles and the pitch (cat units, lane combat, Cyber-Modern UI).

This section **must take a position on the four-way fragmentation** above. Present it as
a real decision with `AskUserQuestion` *before* drafting, with the trade-off of each:
- **Converge on Cyber-Modern cats** — all units get the neon-rim, geometric look; the fantasy-human sprites are treated as temporary and replaced over time.
- **Keep the third-party sprites as the "hero" tier** — procedural designs become explicit placeholders until real art exists; the bible defines how placeholders must look so the mismatch is bounded.
- **Own direction** — the user describes it.
Record the choice and its reason in the section.

### Section 2 — Mood & Atmosphere
Per game state: Title/Hub, Stage map, Battle (opening, boss/base under attack), Victory,
Defeat, Gacha reveal (one row per rarity: `Raro`, `Superraro`, `Megarraro`,
`Legendario`), Shop. For each: emotional target, lighting character (colour temperature,
contrast), 3–5 atmospheric adjectives, energy level (frenetic / measured / …). "Dark and
foreboding" is not enough — name the visual element that carries the mood. States must
look distinct from each other. Ground it in what exists (`.battle-stage` nebula:
cyan top-left, orange top-right, purple bottom) and say what stays vs. changes.

### Section 3 — Shape Language
- **Silhouette at battle size**: units are 14–44 px wide and drawn in a stat-derived box that distorts the aspect ratio (see the facts above) — so a design must survive shrinking and mild stretching, not just look good at 300 px. Define what makes an archetype readable at that size (this is why `distinctiveFeature` exists) and the per-archetype rule already used in `imperioCap1Design.ts` (tank→`horns`, anti-Floating→`wings`, defensive→`shield`, aggressive/area→`spikes`, fast→`tail`). Keep, change or extend it — explicitly.
- Environment geometry, UI shape grammar (radius tokens `--bc-radius-*`, pill vs. rect), hero shapes vs. supporting shapes.
Every shape rule connects back to Section 1 and says what it communicates.

### Section 4 — Colour System
- **UI palette** = the `--bc-*` tokens. List them with their role (do not invent new hex values; if a role is missing, propose a new token and say it needs a change to `src/theme.css`, which the token test will then enforce).
- **World palette** = numeric hex in Pixi code. State the rule: each world colour either mirrors a token (e.g. impact gold = `--bc-gold`) or is a documented exception.
- **Semantic colours**: what cyan (ally/energy), red (enemy), gold (impact/treasure/difficulty), orange (primary action), purple (rare/gacha), green (completed) *mean*, and the rarity colours (`RARITY_TAG_CLASS` in `src/data/cats.ts`).
- Per-region colour temperature for the stage map.
- **Colour-blind safety**: name every pair that carries meaning by colour alone (ally cyan vs enemy red; node states) and the backup cue (facing direction, base side, icon, label). Text contrast must keep the ≥ 4.5:1 floor the UI already meets.

---

## Phase 3: Production guides (Sections 5–8)

Present and approve one section at a time, same protocol.

### Section 5 — Character Design Direction
- How an **ally** is told from an **enemy** at a glance (colour is not enough — see Section 4).
- The rule for each of the three art tiers: when a unit gets real sprites, a `ProceduralDesign`, or the cyber body; what a placeholder must look like; and what *promotes* a unit between tiers.
- `ProceduralDesign` rules: `primaryColor` unique per unit across the catalogue (the existing designs rely on it so no shape+feature+colour combination repeats), `size` mirrors `Cat.width`, one feature per archetype.
- Evolution (`Cat.evolutions`: Normal → Evolved → True form): what changes visually at each form.
- Rarity presentation (`Raro` … `Legendario`, `Colaboración`).
- Animation floor from the constitution (idle + attack), pose/expression style, and the LOD philosophy: battle size vs. any larger UI display.

### Section 6 — Environment Design Language
- **Stage map**: the map is currently flat gradients + dots. Define whether regions get illustrated backdrops, how nodes and links look per state, and how it scales to a 48-node, ~3360 px tall canvas (tiling vs. one tall image). Say which raw banners in `assets-source/banners/` (if any) are acceptable starting material and which are not.
- **Battle backdrop**: layers (CSS wash, Pixi floor/horizon), the lane at 62 % of the height, base towers 46×70 px, prop-density rule: nothing may reduce the legibility of a 14 px unit on the lane.
- Region identity (`imperio-de-los-gatos`, `imperio-de-los-gatos-cap1`, event stages): what visually distinguishes them. Environment storytelling without text.
Characters and environments must be legible **against each other**: state the contrast rule between unit silhouettes and the backdrop.

### Section 7 — UI/HUD Visual Direction
Mostly decided. Summarise (do not redo): headings Orbitron / body Inter, outline icons from `lucide-react`, token-driven motion with `prefers-reduced-motion` handled, glass panels. Cite `src/theme.css` and the policy test `tests/unit/theme/designTokens.test.ts` as the enforcement. Ask only about **gaps**: unit portraits/icons in UI (none exist today — screens render names), rarity frames, battle HUD animation feel.

### Section 8 — Asset Standards
Record what the code *requires*, as hard constraints, and mark everything else as a
proposal. Verify each against the code first:
- Unit sprites: PNG RGBA 300×300, `public/sprites/<spriteKey>/idle/N.png` and `/attack/N.png`, frame counts fixed at 16 idle / 12 attack by the constants in `src/game/spriteAssets.ts` for **every** key (a different count needs a code change and therefore a spec).
- New `spriteKey` also needs an entry in `src/data/cats.ts` and a manifest update (`HERO_COUNT`), and `scripts/copy-sprites.mjs` is the one-off copier from `assets-source/`.
- Procedural: fields of `ProceduralDesign`; textures cached by `getOrCreateUnitTexture`.
- Any CSS/TSX added outside `src/game/` must pass the token test (no loose colour/spacing/type/radius/shadow/motion/z-index/blur literals).
- Performance budgets: grep `docs/` and `specs/` for stated limits. If none exist, write **"no budget defined — proposals only"** and do not invent numbers as if they were requirements.
If an art preference conflicts with a constraint (e.g. more frames than the manifest
allows), surface both positions with `AskUserQuestion` — never resolve silently.

---

## Phase 4: Reference direction (Section 9)

3–5 sources (games, films, artists, or this repo's own mockup). For each: the specific
technique to take, and what to avoid. References must be additive — no two pointing the
same way. Write after approval.

---

## Phase 5: Close

1. Update the header counts (`N/9`) and the date.
2. Name every section **not** authored this run and why (outside the chosen scope /
   already complete) — a bible that stopped at Section 6 must not read as finished.
3. If the bible changes a rule the constitution states (e.g. § III on animation), say
   that a constitution amendment is needed; do not edit the constitution yourself.
4. Offer next steps with `AskUserQuestion` (only those that apply):
   - `/asset-spec` — specs and generation prompts for cats, enemies, maps
   - Open a Spec Kit spec (`/speckit-specify`) for the first visual change the bible calls for, since anything touching `src/game/`, `src/data/` or the sprite manifest goes through `specs/NNN-*/` first
   - Stop here

---

## Collaborative protocol

Every section: **Question → Options → Decision → Draft → Approval → Write.**
- Write each section immediately after its approval; never batch approvals.
- Surface every conflict (art wish vs. code constraint) to the user.
- Do not edit source files in this skill — it produces a document only.
