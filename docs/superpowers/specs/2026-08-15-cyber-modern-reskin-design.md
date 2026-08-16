# Design: Cyber-Modern Reskin + Real Sprite Integration

**Date**: 2026-08-15
**Status**: Approved by user, pending implementation plan

## Context

`battle-cats-web` (React 19 + `@pixi/react`/PixiJS 8 + Zustand + Dexie) has 12 fully functional screens and a working combat engine, but zero visual identity: every screen is bare semantic HTML (`<main><h1><ul><li><button>`, no CSS classes beyond a handful of structural ones), and battle units render as flat-colored `Graphics` rounded rectangles (`specs/003-identidad-visual-animada`).

A separate design initiative already produced a "Cyber-Modern" visual language for this game, captured in:
- `docs/the-battle-cats-redesign/project/Battle Cats Modernizado.dc.html` — an HTML/CSS/JS mockup (Claude Design export) covering Title, Hub, Stage Map, Battle, Equip, Upgrade, Library and Treasure screens.
- `legacy-unity-project/specs/022-cyber-modern-theme/data-model.md` — the same theme already formalized as a Unity `UIThemeCatalog` ScriptableObject with exact token values, from when this project was still Unity-based (`legacy-unity-project/specs/024-react-web-migration` documents that migration).
- `docs/roadmap-rediseno-visual.md` — an 8-phase rollout plan (V1–V8) for applying that theme screen-by-screen, written against the old Unity controller names but conceptually reusable here.

This spec adapts that theme and roadmap to the current React/Pixi codebase, and additionally scopes in wiring real character sprites (currently just placeholder rectangles) using the raw art pack already sitting in `assets-source/units/Characters/`.

## Goals

1. Apply the Cyber-Modern visual language (dark near-black grounds, cyan/orange/purple/gold accents, Orbitron/Inter typography, glass panels, glow effects) consistently across all 12 screens and the Pixi battle stage.
2. Replace emoji/ASCII UI glyphs with `lucide-react` icons (already an unused dependency), matching the mockup's icon usage.
3. Replace the placeholder `Graphics` rectangle units in battle with real animated character sprites sourced from `assets-source/`.
4. Do all of the above as a **pure presentation-layer change**: no game-logic, no data-model behavior change (beyond one new optional cosmetic field), no change to any visible text or accessible name that existing tests assert on.

## Non-Goals (explicitly out of scope)

Matches `docs/roadmap-rediseno-visual.md`'s "Grupo B" — pieces the mockup draws but that have no functional spec/implementation behind them yet in this repo. Do not build these; leave their entry points absent, inert, or "Próximamente" if already present:

- Gamatoto, Cápsula/Gacha real mechanics (odds, pulls), Almacén de Gatos, Tienda
- "Mejoras de Base" tab (Cannon Power/Range, Worker Cat Rate, Research, Accounting, Study)
- "Cat Filter" advanced filtering modal (rarity/trait/ability AND-OR)
- "Leadership" / "Meow Medals" profile stats (undefined anywhere in the project)
- Any change to combat rules, damage resolution, save schema, or store action signatures

`GachaScreen` stays a stub (it already is one) — only its shell gets the theme treatment, no new mechanics.

## Design Tokens (source of truth: Unity `UIThemeCatalog` + mockup inline styles)

```css
--bc-bg: #020308;              /* page/app ground */
--bc-surface: rgba(20,22,30,.9); /* glass panel fill */
--bc-border: rgba(255,255,255,.14);
--bc-text: #f4f6fb;
--bc-text-dim: #94a3b8;
--bc-text-faint: #5b6577;

--bc-cyan: #22d3ee;
--bc-orange: #fb923c;
--bc-purple: #a855f7;
--bc-gold: #facc15;
--bc-red: #ef4444;
--bc-green: #4ade80;
--bc-pink: #f472b6;

--bc-gradient-primary-start: #fb923c;
--bc-gradient-primary-end: #ef4444;   /* used for primary CTA buttons, e.g. "¡Batalla!" */

--bc-radius-sm: 10px;
--bc-radius-md: 14px;
--bc-radius-lg: 18px;

--bc-font-heading: 'Orbitron', sans-serif;  /* weights 600/700/800 */
--bc-font-body: 'Inter', sans-serif;        /* weights 400/500/600/700 */
```

Rarity tag colors (for `CatGuideScreen`, `UpgradeScreen`, `TeamScreen`) derive from `RarityType` in `src/data/cats.ts` (`Normal | Especial | Raro | Superraro | Megarraro | Legendario | Colaboración`). The mockup only styles a generic rarity chip, so this spec fixes a concrete 7-step ramp (same convention The Battle Cats itself uses for rarity coloring, expressed with this theme's palette):

| Rarity | Color |
|---|---|
| Normal | `var(--bc-text-dim)` (neutral gray) |
| Especial | `var(--bc-green)` |
| Raro | `var(--bc-cyan)` |
| Superraro | `var(--bc-purple)` |
| Megarraro | `var(--bc-gold)` |
| Legendario | `var(--bc-orange)` — solid, not the primary gradient (that's reserved for CTA buttons) |
| Colaboración | `var(--bc-pink)` |

## 1. Theme Foundation

New file `src/theme.css`, imported once from `src/index.css` (which keeps its existing light/dark `:root` block for now — `theme.css` layers the cyber-modern tokens on top and is what every screen actually consumes). `index.html` gains the Orbitron+Inter Google Fonts `<link>` (same URL as the mockup).

Utility classes (plain CSS, no framework — matches the project's existing convention of bare `className` strings):

- `.screen` — full-height flex column, `background: radial-gradient(...), var(--bc-bg)` (three-blob radial gradient matching the mockup's page wrapper), padding, gap.
- `.glass-panel` — `background: var(--bc-surface); border: 1px solid var(--bc-border); border-radius: var(--bc-radius-md); backdrop-filter: blur(10px);`
- `.btn`, `.btn-primary` (gradient fill), `.btn-outline` (+ per-accent modifier classes `.btn-outline--cyan/orange/purple`), `.btn-ghost`, `.btn-icon` (square icon-only button)
- `.tag` + `.tag--<rarity>` modifiers
- `.progress-bar` + `.progress-bar__fill` (gradient fill, used for energy/HP/treasure %)
- `.list-card`, `.list-card__row` — replaces bare `<ul><li>` visual treatment without changing the underlying list semantics
- `.hud-bar` — top HUD row pattern (money/energy/settings icons)

## 2. Icon Migration

Replace every emoji/ASCII glyph currently used as a control with the equivalent `lucide-react` icon, always **alongside unchanged visible text**, icon marked `aria-hidden="true"` so accessible names (asserted by tests via `getByRole('button', { name: ... })`) never change:

| Current | Replacement icon |
|---|---|
| `←` (back) | `ArrowLeft` |
| `✕` (close) | `X` |
| `⚡` (energy) | `Zap` |
| `🛡` (barrier) | `Shield` |
| `↻` (regen/retry) | `RotateCw` |

Apply consistently to every screen that has a back/close/energy affordance (all 12).

## 3. Screen Reskin (roadmap order, adapted to this repo's actual screen list)

No screen's props, hooks, store calls, conditional logic, or visible text changes — only JSX structure (wrapping elements) and `className`/icon additions.

| Roadmap phase | This repo's screen(s) |
|---|---|
| V1 — Menú Principal + Ajustes | `TitleScreen`, `MainMenuScreen`, `SettingsScreen` |
| V3 — Mapa de Etapas | `LevelSelectScreen`, `TreasureMenuScreen` |
| V4 — Batalla | `BattleScreen` (DOM HUD chrome — energy/base HP readouts, deploy bar, exit button) |
| V5 — Equipar | `TeamScreen` |
| V6 — Mejorar (Unidades) | `UpgradeScreen` (units section + `UserRankSection` only — no base-upgrades tab exists to reskin) |
| V7 — Biblioteca | `CatGuideScreen`, `EnemyGuideScreen` |
| (not in Unity roadmap; exists here) | `ResultScreen`, `GachaScreen` (stub-level treatment only) |

V2 (Base del Jugador/Hub) and V8 (Perfil de Rango) don't map to a distinct screen in this repo — `MainMenuScreen` already plays the Hub role, and rank display lives inside `UpgradeScreen`'s `UserRankSection`; both get covered by their respective phase above rather than as separate phases.

## 4. Battle Stage (PixiJS)

DOM chrome (HP text, deploy buttons) is covered by phase V4 above via CSS. The Pixi-rendered canvas itself (`BattleStage.tsx`, `UnitSprite.tsx`, `DeathEchoSprite.tsx`) needs actual PixiJS work:

- `Application` background → transparent (`backgroundAlpha: 0` or equivalent per `pixijs-application`), so the theme's CSS radial-gradient on the wrapping `.battle-stage` div shows through the canvas instead of the current flat `0x1a1a2e`.
- A `Graphics`-drawn background layer for the lane itself (subtle gradient + scanline texture, echoing the mockup's `repeating-linear-gradient` battlefield treatment), added once per `Application` mount, not per-unit.
- Team color shifts from flat `0x3b82f6`/`0xef4444` fill to theme `0x22d3ee` (cyan, Player) / keep `0xef4444` (red, Enemy) — plus a soft glow ring: since `pixi-filters`/`DropShadowFilter` isn't installed and this spec doesn't add a new dependency, fake the glow with 2–3 concentric `roundRect` strokes of decreasing alpha in the team color, per `pixijs-scene-graphics`.

## 5. Real Sprite Integration

Currently `getVisualProfile`/`getAnimationPose` (`src/game/animation.ts`) only distinguish two states — `Idle` and `Attacking` — driving a procedural bob/squash/rotate on a `Graphics` body. Enemies and player units reuse the exact same 12 `CATS` entries (see `src/data/levels.ts` wave definitions using the same `catId`s as player-deployable cats), just tagged with a different `team` at spawn — so **one sprite per cat id serves both sides**, distinguished only by team tint + horizontal flip.

**Data model**: add `spriteKey?: string` to `Cat` (`src/data/cats.ts`). Optional so any cat without one keeps today's `Graphics` fallback — nothing breaks if a future cat ships without art.

**Asset source**: `assets-source/units/Characters/hero_1` … `hero_30`, each with `male/`+`female/` variants, each with `1_idle`, `2_walk`, `3_run`, `4_attack`, `5_block`, `6_die` frame-sequence folders (16 PNGs each). No thematic/character-name metadata exists to curate a "best fit" per cat, so mapping is **deterministic, not curated**: the 12 `CATS` entries (in file order) get `hero_1`…`hero_12`, `male` variant.

**Asset pipeline**: a one-time copy step (Node/bash script, run manually, not part of the build) copies only the two folders this project actually animates — `1_idle` and `4_attack` — per assigned hero, flattened into:
```
public/sprites/hero_N/idle/1.png … 16.png
public/sprites/hero_N/attack/1.png … 16.png
```
~32 frames × 12 cats ≈ 384 files. Everything else under `assets-source/` (the other 18 heroes, `2_walk`/`3_run`/`5_block`/`6_die`, `.meta` files, the `MonstersCreaturesFantasy2` pack, banners, fonts, ScriptableObjects) is left untouched — out of scope for this pass.

**Rendering**: `UnitSprite`/`DeathEchoSprite` switch from a `pixiGraphics` draw callback to a `pixiAnimatedSprite` (per `pixijs-scene-sprite`), textures loaded via `Assets.load` keyed by `cat.spriteKey`, with two texture arrays (idle/attack) swapped on `getAnimationState` transitions. `animation.ts` gains the state→folder mapping as a plain lookup next to `getAnimationState` (`{ Idle: 'idle', Attacking: 'attack' }`) — same single-source-of-truth pattern it already uses for the rest of the animation logic. The existing container-level transform (`x`, `pivot`, `scale`, `rotation` from `getAnimationPose`) keeps driving position/bob/squash exactly as today — only the leaf visual changes from drawn rectangle to sprite. Enemy team gets `container.scale.x` negated (mirrored, since enemies walk right-to-left facing left while the art faces right by convention) in addition to the existing pose scale. Team identity: the glow ring from §4 goes behind the sprite (cyan for Player, red for Enemy) since the art itself isn't recolored per team. `DeathEchoSprite` freezes on the current idle frame (no separate `6_die` art in this pass) while still applying its existing shrink/fade.

**Fallback**: cats without `spriteKey` (none, initially, but the mechanism stays generic) render exactly as today via `Graphics`.

## Testing / Non-Regression

- No test file's `getByText`/`getByRole(..., {name})`/`getByLabelText` query target changes — verified against `tests/unit/*.test.tsx` query patterns before touching each screen.
- `tests/unit/game/animation.test.ts` and the engine/combat tests are untouched except for the new additive `Idle`/`Attacking` → sprite-folder lookup in `animation.ts` (§5), which needs its own new test, not a change to existing assertions.
- Run `npm test` and `npm run build` (includes `tsc -b`) after each phase.

## Rollout Order

1. Theme foundation (`theme.css` + fonts) + icon migration groundwork (no visible screens changed yet — infra only).
2. V1 screens (Title, MainMenu, Settings).
3. V3 screens (LevelSelect, TreasureMenu).
4. V4 — Battle DOM chrome.
5. Battle Pixi stage reskin (background, glow, team colors) — no sprites yet, still `Graphics` bodies.
6. V5–V7 screens (Team, Upgrade, CatGuide, EnemyGuide) + Result/Gacha stub.
7. Real sprite integration (data model + asset copy script + `UnitSprite`/`DeathEchoSprite` rewrite) — last, since it's the highest-risk/most-novel piece and benefits from the rest of the theme already being in place to visually validate against.

Each numbered step lands as its own commit (or small set of commits) with tests green before moving to the next.
