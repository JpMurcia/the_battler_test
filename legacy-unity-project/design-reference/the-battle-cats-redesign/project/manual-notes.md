# Battle Cats — Technical Notes (condensed, for grounding this redesign)

## Core loop
Single horizontal lane. Player base right, enemy base left. Money accrues passively, spend to deploy cat units from a bottom icon row. Units auto-walk/attack. Cat Cannon charges over time (10 bars, ~31.67s full charge, manual fire button). Win: enemy base HP→0. Lose: player base HP→0 (can continue w/ Cat Food).

## Deploy row (battle screen)
- Icons = equipped units, order set in Equip Menu
- Each icon: portrait + real-time deploy cost
- States: available / disabled (insufficient funds) / cooldown (wipe/veil overlay that recedes as it becomes ready)
- Tap to deploy; hold to see ability tooltip + target traits
- Toggle 1 row / 2 rows of icons in Settings
- Speed control x1/x2, pause

## HUD
- Money counter (top), grows automatically
- Cat Cannon: charge bar + "Fire!" button (bottom right), fires wave attack + knockback when ready
- Enemy/ally base HP bars
- Boss appears ~99% dmg to enemy base, triggers "shockwave" knockback to all allies

## Navigation map
Title → Main Menu → Cat Base Menu (hub: Start/Upgrade/Equip buttons; Gamatoto, Missions, Calendar, Settings)
→ Start → Saga tabs (Empire of Cats / Into the Future / Cosmos / Aku Realms / Legend Stages) → Chapter → Stage Select (map, energy indicator, star difficulty, Attack button)
→ Stage Select → team setup (optional) → Battle Screen → Results Screen → back to map

## Units (Cats)
6 rarities: Normal, Special, Rare, Super Rare, Uber Rare, Legend Rare.
Evolution: Normal Form → Evolved (lvl10) → True Form (lvl20+10, Cat Tickets) → Ultra Form (rare, high-level).
Stats: HP, Attack power, Attack frequency (foreswing/backswing/TBA in frames @30fps), Range, Move speed, Knockback count, Deploy cost, Recharge time.
Growth formula: Stat(N) = (base + level accum) × Treasure multiplier. Approx: HP/dmg(L) ≈ (2 + L/2) × base(lvl1).

## Enemies
700+, each with trait(s): Traitless(white), Red, Floating(light green), Black/Dark, Metal(gray, takes 1dmg unless crit/Metal Killer/Waterblast), Angel(yellow), Alien(cyan), Zombie(purple), Relic(dark green), Aku(blue). Special categories: Colossus, Behemoth, Sage, Witch, Eva Angel.
Strength Magnification: final stat = base × (mag%/100). No fixed ceiling. Star scale ★1-★12 for stage difficulty reference. Crown difficulties (1-4) for Legend Stage replay.

## Abilities catalog (40+)
Offensive: Strong Against, Massive/Insane Damage, Savage Blow, Zombie/Metal Killer, Base Destroyer, Explosion, Shield/Barrier Piercing.
Control: Weaken, Freeze, Slow, Knockback, Warp, Curse, Toxic.
Defensive: Resistant/Insanely Tough, Survive, Strengthen, Dodge, immunities.
Utility: Extra Money, Metal (self), Barrier/Wave Shield, Conjure.

## Cat Filter (modal)
Rarity checkboxes, Trait-target icons (10 traits), Ability icons, AND/OR toggle, Talent inclusion toggles, "Only Max Forms" checkbox, sort by level.

## Equip/Upgrade Menu
Equip: grid of Normal-form icons by rarity, select+order units for battle (deploy slot count grows via User Rank).
Upgrade: Units tab (level up w/ XP, Catseyes past lvl30) + Base Upgrades tab (Cannon Power/Range/Charge, Worker Cat Rate/Wallet, Base Defense, Research=cooldown reduction, Accounting=+money on kill, Study=+XP, Cat Energy cap).

## Sagas
Empire of Cats (3 ch × 48 stages, intro, -33% deploy cost ch1), Into the Future (Alien trait), Cats of the Cosmos (Alien "Stellar", high mag), Aku Realms (Aku trait, endgame). Legend Stages: Stories of Legend(yellow)/Uncanny Legends(green)/Zero Legends(blue)/Event(red)/Collab(purple).

## Economy/monetization
Cat Food (premium currency), gacha Cat Capsule (150/tirada, 1500/x11), banner types (standard/EPICFEST/UBERFEST/Legend Capsule) w/ published odds. Officers' Club subscription.
