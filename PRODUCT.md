# ZeldaBonk

<!-- impeccable:product-schema 1 -->

## Platform

web

## Confirmed Direction

The user wants PokéBonk as the mechanics, graphics, and overall presentation reference, with all functionality rebuilt independently under an actual Legend of Zelda theme. The realms must connect and share progression. Full parity is the active target and is not complete; PARITY.md tracks implemented and missing systems.

## Current Game

An unofficial single-player Zelda survivor featuring Link, Zelda, Midna, Tetra, Sheik, and Skull Kid. Adventure has eight distinct maps, three numbered levels each, eight guardians, and final Ganondorf. The maps are Kokiri Forest, Lake Hylia, Hyrule Field, the Great Sea, the Twilight Realm, Skyloft, the Depths, and Termina Field. Their enemy pools and landmark depictions match those Zelda locations. Adventure follows that numbered order, with a separate boss after each map’s three enemy levels and a map-results stop before onward travel. Health, time, equipment, XP, charge, and upgrades persist between maps. Survival lets the player select one map per run.

Characters use distinct 112×112 pixel art with eight camera-relative views and era-specific costumes. Characters and foliage use independently drawn pixel-art billboards in a textured Three.js world. No official sprites, music, models, or PokéBonk source/assets are bundled. Zelda's characters, names, and setting are recognizable franchise elements.

## Reference Evidence

The official v0.10.15 and v0.10.17 landing screen, public client, and Season 4 notes were inspected. After the user completed verification, the explicitly non-counting Training Grounds was inspected in Brave. Public captures and control guides provide additional evidence. PARITY.md separates verified facts, authored rules, implemented coverage, and remaining work.

## Capabilities

- Automatic weapons, measured XP thresholds, level-up choices, saved weapon rarity growth, three base weapon/charm slots, permanent slot unlocks and treasure-extended level caps.
- Camera-relative movement, mouse look without dragging, continuous horizontal edge/captured-cursor rotation, wider terrain-safe vertical look, wheel zoom, jump, glide, and dash.
- Auto/manual aim, separate target lock, and six charged Ultimates.
- Kill streaks and finite refresh, skip, and banish resources.
- Minimap, over-character health, loadout, Ultimate meter, and realm guide.
- Adventure: 24 enemy levels. Clear 12/18/24 enemies in each map’s three levels. The central shrine advances levels 1 and 2. After level 3 and any pending upgrades, enter a distinct landmark arena. Each map guardian has a signature attack with visible ground telegraphs and stronger later phases. Boss victory banks rewards and opens per-map statistics. Continue moves to the next numbered map; Main Menu preserves the checkpoint. After the eighth map boss, Continue opens the Ganondorf finale in Hyrule. Older saves preserve completed seals/partial waves and resume at the first unfinished map.
- Survival: one chosen map per run, an immediate shrine reward, and the four-minute Phantom Ganon encounter.
- Normal and Hard difficulty, six weapon families, three boss health phases, telegraphed patterns and map-specific enemy species. The requested modest pressure increase adds 5% regular-enemy health, 5% regular-enemy speed, 10% shorter normal spawn intervals, and 8% guardian health; hit damage and Training baselines stay unchanged.
- Original idle, walk, attack, cast, Ultimate, hurt, jump, glide, dash, spawn, wind-up, defeat and victory animations.
- Deterministic plateaus and ramps share height sampling with the renderer; trees, rocks and shrine structures have physical collisions. Deterministic non-blocking dressing adds worn trails, shorelines, causeways, lanterns, varied pixel foliage, textured houses/ruins and a Skyloft windmill. Instanced billboard batches and quality-dependent undergrowth density bound drawing cost. Root-anchored foliage wind follows simulation pause and reduced-motion settings.
- Twenty-six stackable Zelda treasures across five rarities. Physical/magic damage, criticals/mega-criticals, armor, evasion, regeneration, lifesteal, thorns and damage breakdown.
- Burn, freeze, shock and wet effects with steam and chain-shock reactions. Menus freeze their simulation clocks.
- Non-counting Training Grounds with all six heroes, map/stage/level selection, four-weapon/five-charm builds, per-weapon rarity, treasure-extended caps, treasure stack editing, stationary dummies, groups, elites, alphas and map guardians.
- Rupees, seven capped permanent upgrades, three hero unlocks, records, equipment/enemy journal and six achievements.
- Safe map and pending-choice checkpoints, import/export with backup, legacy-record migration and cross-tab checkpoint ownership.
- Low/Balanced/High graphics, sound/volume, key rebinding, mouse sensitivity, inverted Y, field of view, camera distance, optional cursor capture, system or manual reduced motion, nested native dialogs and focus-loss pause.

## Boundaries

These are compact arena interpretations, not complete original Zelda maps. Central progression shrines, stage layouts, some balance formulas, unlock conditions, crossover loadouts, and animations are authored for this adaptation. Full catalogs, fusion, forms and additional modes remain unfinished. Accounts, co-op, clans, trading and ranked records now have a tested local backend; their browser flows and hosted deployment are unfinished. Touch is verified through emulation; physical-device performance varies.

## Stack and Delivery

The user selected local backend development first. backend/ now contains a loopback-only Node service with embedded PostgreSQL, local accounts/sessions, owner-scoped versioned saves, authoritative co-op simulation, reconnect/restart snapshots, server-issued ranked results and rewards, clans, escrow trading, crafting and a fixed-price market. Its APIs are tested independently; browser sign-in/lobby/network rendering is not connected yet. Supabase/Render deployment, production auth and database integration remain unconfigured. No cloud resources were created.

The production game uses static HTML/CSS/JavaScript with vendored Three.js, with no build step or required backend. The optional local backend uses Node.js 24, PGlite and ws, with pinned dependencies in its own package. Confirmed repository: https://github.com/Adonissimo/zelabonk- . Static production: https://zelabonk.vercel.app . Commit and push after meaningful checks; verify Vercel separately. The user's local-first choice does not authorize creating cloud backend resources.

## Principles

- Preserve run progress across ordered Adventure transitions and within the chosen Survival map.
- Freeze simulation during menus, upgrades, and focus loss.
- Preserve each map's three-level progress and restrict normal, elite and summoned mobs to its enemy pool.
- Settle completed runs once; retain another tab's checkpoint and serialize profile changes with native Web Locks where supported.
- Validate imported progress and back up the current profile before replacement. Keep play available when storage fails.
- Keep the character, combat feedback, charge, and choices readable.
- Retain keyboard, mouse, native button semantics, and touch support.
- Separate reference observations from unverified behavior.
- Training cannot replace an Adventure checkpoint, grant rewards, record permanent discoveries or unlock characters.
- Pending chests and acquired equipment serialize separately; each pickup grants its reward once. Secondary proc/reaction damage cannot recursively trigger more procs.
