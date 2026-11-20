# ZeldaBonk

<!-- impeccable:product-schema 1 -->

## Platform

web

## Confirmed Direction

The user wants PokéBonk as the mechanics, graphics, and overall presentation reference, with all functionality rebuilt independently under an actual Legend of Zelda theme. The realms must connect and share progression. Full parity is the active target and is not complete; PARITY.md tracks implemented and missing systems.

## Current Game

An unofficial single-player Zelda survivor featuring Link, Zelda, Midna, Tetra, Sheik, and Skull Kid. Adventure has eight connected maps, three numbered levels each, eight guardians, and final Ganondorf. The maps are Kokiri Forest, Lake Hylia, Hyrule Field, the Great Sea, the Twilight Realm, Skyloft, the Depths, and Termina Field. Their enemy pools and landmark depictions match those Zelda locations. Health, time, equipment, XP, charge, and unfinished map levels persist through gates.

Characters and foliage use independently drawn pixel-art billboards in a textured Three.js world. No official sprites, music, models, or PokéBonk source/assets are bundled. Zelda's characters, names, and setting are recognizable franchise elements.

## Reference Evidence

The official v0.10.15 landing screen, public client, and Season 4 notes were inspected. After the user completed verification, the explicitly non-counting Training Grounds was inspected in Brave. Public captures and control guides provide additional evidence. PARITY.md separates verified facts, authored rules, implemented coverage, and remaining work.

## Capabilities

- Automatic weapons, XP, level-up choices, and weapon evolution.
- Camera-relative movement, mouse look without dragging, wheel zoom, jump, glide, and dash.
- Auto/manual aim, separate target lock, and six charged Ultimates.
- Kill streaks and finite refresh, skip, and banish resources.
- Minimap, over-character health, loadout, Ultimate meter, and connected realm map.
- Adventure: 24 levels. Clear 12 enemies in a map's first level and 18 in its second; advance at its central shrine. Its guardian waits in level three. Restore all eight seals, then challenge Ganondorf in Hyrule.
- Survival: immediate shrine rewards and the four-minute Phantom Ganon encounter; boss health persists through travel.
- Normal and Hard difficulty, six weapon families, three boss health phases, telegraphed patterns and map-specific enemy species.
- Original idle, walk, attack, cast, Ultimate, hurt, jump, glide, dash, spawn, wind-up, defeat and victory animations.
- Deterministic plateaus and ramps share height sampling with the renderer; trees, rocks and shrine structures have physical collisions.
- Twenty-four stackable Zelda treasures across five rarities. Physical/magic damage, criticals/mega-criticals, armor, evasion, regeneration, lifesteal, thorns and damage breakdown.
- Burn, freeze, shock and wet effects with steam and chain-shock reactions. Menus freeze their simulation clocks.
- Non-counting Training Grounds with all six heroes, map/stage/level selection, four-weapon/five-charm builds, treasure stack editing, stationary dummies, groups, elites, alphas and map guardians.
- Rupees, five capped permanent upgrades, three hero unlocks, records, equipment/enemy journal and six achievements.
- Safe map and pending-choice checkpoints, import/export with backup, legacy-record migration and cross-tab checkpoint ownership.
- Low/Balanced/High graphics, sound/volume, key rebinding, mouse sensitivity, inverted Y, field of view, camera distance, optional cursor capture, system or manual reduced motion, nested native dialogs and focus-loss pause.

## Boundaries

These are compact arena interpretations, not complete original Zelda maps. Central progression shrines, stage layouts, some balance formulas, unlock conditions, crossover loadouts, and animations are authored for this adaptation. Full catalogs, fusion, forms and additional modes remain unfinished. Accounts, co-op, clans, trading and ranked records now have a tested local backend; their browser flows and hosted deployment are unfinished. Touch is verified through emulation; physical-device performance varies.

## Stack and Delivery

The user selected local backend development first. backend/ now contains a loopback-only Node service with embedded PostgreSQL, local accounts/sessions, owner-scoped versioned saves, authoritative co-op simulation, reconnect/restart snapshots, server-issued ranked results and rewards, clans, escrow trading, crafting and a fixed-price market. Its APIs are tested independently; browser sign-in/lobby/network rendering is not connected yet. Supabase/Render deployment, production auth and database integration remain unconfigured. No cloud resources were created.

The production game uses static HTML/CSS/JavaScript with vendored Three.js, with no build step or required backend. The optional local backend uses Node.js 24, PGlite and ws, with pinned dependencies in its own package. Confirmed repository: https://github.com/Adonissimo/zelabonk- . Static production: https://zelabonk.vercel.app . Commit and push after meaningful checks; verify Vercel separately. The user's local-first choice does not authorize creating cloud backend resources.

## Principles

- Preserve run progress across gates.
- Freeze simulation during menus, upgrades, and focus loss.
- Preserve each map's three-level progress and restrict normal, elite and summoned mobs to its enemy pool.
- Settle completed runs once; retain another tab's checkpoint and serialize profile changes with native Web Locks where supported.
- Validate imported progress and back up the current profile before replacement. Keep play available when storage fails.
- Keep the character, combat feedback, charge, and choices readable.
- Retain keyboard, mouse, native button semantics, and touch support.
- Separate reference observations from unverified behavior.
- Training cannot replace an Adventure checkpoint, grant rewards, record permanent discoveries or unlock characters.
- Pending chests and acquired equipment serialize separately; each pickup grants its reward once. Secondary proc/reaction damage cannot recursively trigger more procs.
