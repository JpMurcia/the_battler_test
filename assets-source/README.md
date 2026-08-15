# Asset Source (raw, unprocessed) — staging area

Raw source files copied out of `the_battler_test` (Unity) before that repository was deleted, 2026-08-14. **Nothing here is web-ready yet** — this is the staging area for the asset export work already planned in `../legacy-unity-project/specs/024-react-web-migration/`.

Every folder below was verified in-use by a real GUID audit (grep of `.meta` guids against every `.unity`/`.prefab`/`.asset`/`.anim`/`.controller` in the Unity project) before being copied — nothing speculative, no unused third-party clutter. See `legacy-unity-project/specs/024-react-web-migration/data-model.md` § "Auditoría de referencias real" for the full audit trail.

## Contents

- **`units/Characters/`** — sprite source for the player units (`Unit_Arquero`, `Unit_Escudero`, `Unit_Espadachin`, `Unit_Lancero`, `Unit_Mago`, `CentinelaBlindado`, `DronDeApoyo`, `Unit_GatoDefensor`, `Unit_GatoLuchador`). 172 MB — a third-party pack with thousands of sprites, of which only the ones these 9 `UnitDefinition`s actually reference matter (see `content/ScriptableObjects-Battler/**/PlaceholderArt/*.controller` for which specific frames each unit's idle/attack animation uses).
- **`units/MonstersCreaturesFantasy2/`** — sprite source for every enemy unit (`Unit_EnemyGrunt`, `Unit_EnemySentinel`, `Unit_Chucho`/`ChuchoZ`/`Kodrizzz`/`Serpi`/`TheFace`/`Zerpi`).
- **`banners/Free2DCartoonParallaxBackground/`** — chapter banner art (Chapter1, Corea, Mongolia, TheFace, HaciaElFuturo).
- **`sprites/root/`** — misc sprites referenced by the main menu, adventure map, and every battle scene.
- **`ui/UIElements/`** — flat UI kit referenced by all 6 battle scenes.
- **`ui/HyperCasualUI/`** — the likely real UI theme (sprites + the Baloo2 font family, 5 weights).
- **`fonts/ModAssetsFonts/`** — `Inter-VariableFont.ttf` (source font behind the TextMeshPro SDF asset used project-wide) + the Unity-only `.asset` wrapper (ignorable).
- **`content/ScriptableObjects-Battler/`** — the actual `UnitDefinition`/`ChapterDefinition`/dialogue/enemy-wave source-of-truth data, as Unity YAML. This is where every stat (cost, cooldown, HP, damage, XP reward, dialogue lines) lives — **not portable as-is**, but it's the authoritative source to transcribe into `src/data/**/*.json` per `plan.md`. Losing this would mean re-inventing balance numbers from scratch.
- **`content/Data-Battler/`** — banner/region definitions and the root default configs (`DefaultMissionEnergyConfig`, `DefaultUnitLevelingConfig`, `MainLocalizedText`, etc.).

## What's still pending (tracked in `legacy-unity-project/specs/024-react-web-migration/tasks.md`)

This is raw material, not the finished pipeline. Still needed, per `plan.md`:
- Export each unit's idle/attack frames as Pixi-compatible spritesheet atlases (`public/assets/units/<unitId>/<stage>/{idle,attack}.json+png`) — T023/T027/T038.
- Transcribe the `.asset` YAML content into typed JSON (`src/data/**`) — T008.
- Everything in `units/`, `banners/`, `ui/` beyond what's actually referenced by `content/ScriptableObjects-Battler/` is unused filler shipped with the original third-party packs — don't bulk-import these folders into the web build, extract only the referenced frames.
