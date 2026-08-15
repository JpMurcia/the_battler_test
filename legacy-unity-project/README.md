# Legacy Unity Project — Archival Reference

Snapshot preserved from `the_battler_test` (the original Unity implementation of "The Battler") before that repository was deleted, on 2026-08-14. Nothing here is meant to build or run — it's reference material for the web port.

## Contents

- **`specs/`** — the full spec history of the Unity project, `001-chapter1-vertical-slice` through `026-saga-arcs-gatorreta`. `001-023` are the original Unity game-design specs (mechanics, balance, UI); `024-026` are the web-migration planning specs written during the port (spec/plan/research/data-model/tasks for the React+Pixi.js+Zustand+Dexie architecture — see `battle-cats-web/specs/001-nucleo-del-juego/` for how that architecture was actually re-derived from scratch for this repo).
- **`constitution.md`** — the Unity project's design constitution (Principios I-VI: narrativa integrada, combate automático por despliegue, identidad visual animada, progresión por capítulos, balance por datos, simplicidad MVP). `battle-cats-web/.specify/memory/constitution.md` is the equivalent for this repo, written fresh without Unity-specific technical constraints.
- **`ai-tooling/`** — config for the AI/Editor tooling used on the Unity side (Gerty, a Unity Editor↔Claude Code MCP bridge). **Not functional here** — Gerty drives the Unity Editor specifically; there's no equivalent surface in a browser-based React app. Kept only as a record of what was used and how it was configured, in case an analogous dev-tooling need comes up later.
- **`design-reference/`** — `The_Battle_Cats_Manual_Tecnico.docx` and the `the-battle-cats-redesign/` mockup export ("Battle Cats Modernizado") that the cyber-modern UI reskin (Unity specs 022/023) was built from. Still directly useful for this repo's own UI work.

## Where the actual game content lives

The raw sprites, fonts, and content data (unit stats, chapter definitions, dialogue) referenced by these specs are in `../assets-source/`, not here — see that folder's own README for what's there and what still needs to happen to make it usable by the game (`src/data/*.json` + `public/assets/**` per `battle-cats-web/specs/001-nucleo-del-juego/plan.md`).
