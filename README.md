# ZeldaBonk

An unofficial single-player Legend of Zelda survivor, using PokéBonk as its gameplay and presentation reference. Animated pixel actors inhabit eight distinct 3D maps. Adventure has 24 numbered levels and a final Ganondorf encounter. Survival has a four-minute Phantom Ganon challenge.

Repository: https://github.com/Adonissimo/zelabonk- . Production: https://zelabonk.vercel.app . A Git push and a live deployment are separate events; verify the current revision before treating it as deployed.

## Play

Open index.html in a current WebGL-capable browser with the source folder intact. The separately delivered ZeldaBonk.html embeds scripts, fonts and art for offline play. No account, backend, environment variables, installation or build step is required.

For a local server with Node.js 18 or newer:

    npm start

Open http://127.0.0.1:4173 . PORT selects another port. Serving the game gives browser storage a stable origin.

## Adventure: eight maps, three levels each

Adventure follows the numbered map order below. Defeat 12 enemies in level 1 and 18 in level 2; reach the central shrine and press E or tap Activate to advance between levels. Level 3 is a full 24-enemy wave. After that wave clears and pending upgrades finish, you automatically enter a separate landmark arena for that map’s guardian. Each guardian introduces a signature attack with ground warnings, and its later phases increase the pressure. Defeat the boss to restore its seal, bank remaining treasure/XP, then see a results screen with that map’s time, enemies defeated, damage dealt and damage taken. Choose Continue to enter the next map, or Main Menu to leave and resume later. Health, equipment, charge, time, and upgrades carry onward. After the eighth map boss, the game takes you to Hyrule Field for Ganondorf.

Safe checkpoints retain partial waves, pending upgrades, boss readiness and pending map results. Menus freeze encounter transition timers. Reloading from a map-results checkpoint reopens the results. Older checkpoints without map results retain their previous resume behavior. Older free-roam saves keep their seals, equipment, and per-map progress, then resume at the first unfinished map. Completed maps are skipped. A boss fight still restarts from its preceding safe checkpoint.

| Map and levels | Local enemies | Guardian | Guardian arena |
|---|---|---|---|
| Kokiri Forest 1-1, 1-2, 1-3 | Deku Baba, Deku Scrub, Skulltula | Gohma | Great Deku Tree |
| Lake Hylia 2-1, 2-2, 2-3 | Octorok, Tektite, Lizalfos | Morpha | Water Temple |
| Hyrule Field 3-1, 3-2, 3-3 | Chuchu, Keese, Bokoblin | King Bulblin | Hyrule Castle Courtyard |
| Great Sea 4-1, 4-2, 4-3 | Blue ChuChu, Bokoblin, Seahat | Helmaroc King | Forsaken Fortress |
| Twilight Realm 5-1, 5-2, 5-3 | Shadow Vermin, Shadow Kargarok, Shadow Beast | Zant | Palace of Twilight |
| Skyloft 6-1, 6-2, 6-3 | Chuchu, Keese, Remlit | Ghirahim | Sky Keep |
| Depths 7-1, 7-2, 7-3 | Little Frox, Gloom Bokoblin, Evermean | Colgera | Wind Temple |
| Termina Field 8-1, 8-2, 8-3 | Blue ChuChu, Deku Baba, Takkuri | Majora's Mask | Inside the Moon |

Kokiri Forest is the canonical name of the village location. Stage layouts, central progression shrines, crossover encounters and combat formulas are authored for this game, rather than exact reproductions of Zelda maps. Map changes preserve health, XP, equipment, charge and each map's unfinished level progress. Each regular map measures 128 by 128 playable units. Guardian arenas are smaller and flat, with a distinct look. Stage layouts vary while retaining the location’s terrain and landmarks.

Use the title-screen Realm selector to choose any of the eight maps before starting Survival. In Adventure, it previews the campaign maps without skipping progression. That run stays on the chosen map, with an immediate shrine reward and a Phantom Ganon fight once the clock reaches four minutes.

## Combat and progression

Weapons cast automatically. Link uses a hand-held slash below full health and sends an animated sword beam at full hearts. Zelda’s Light Arrows point along their flight path. Midna uses a close strike with her giant hair-hand. Collect XP shards to choose weapons and charms. The six weapon families are Master Sword, Fused Shadow, Din's Fire, Light Arrows, Bombs and Boomerang. Bombs explode across an area; Boomerangs strike outward and on return. Start with three weapon and three charm slots. The Great Fairy camp unlocks a fourth weapon for 1500 rupees, then a fourth and fifth charm for 1200 and 3000 rupees. Weapons cap at level 8 and charms at 10. Adventure Pouch extends weapons to 10; Green Potion extends charms to 12. Shrine bonuses consume no learned slots. Weapon upgrades have five rarities, with real changes to damage, shot count, cooldown, speed, piercing, bounces and critical chance. The old automatic rank-7 awakening has been removed. A run provides two refreshes, two skips and one banish. Banish excludes a choice from later rolls without removing equipped ranks.

Normal runs now apply a modest pressure increase: regular enemies have 5% more health and 5% more movement speed, the normal spawn interval is 10% shorter, and guardians have 8% more health. Hit damage and attack telegraphs are unchanged. Hard retains its existing multipliers; Training keeps its existing baseline and manual spawns.

Bosses change phase at two-thirds and one-third health. Warnings precede slams, charges, volleys, summons and teleports. Time and enemy defeats charge your Ultimate. Animation states include idle, locomotion, attacks, casting, Ultimates, hurt, jump/glide, dash, spawn, wind-up, defeat and victory.

Link, Zelda, and Midna start unlocked. Helmaroc King unlocks Tetra; three different guardians unlock Sheik; Majora's Mask unlocks Skull Kid. Their automatic loadouts and survivor effects are crossover adaptations.

Completed runs grant rupees. The Great Fairy camp sells capped permanent upgrades: Heart Container, Power Bracelet, Mirror Shield, Wallet, Magic Jar, and weapon/charm slot unlocks. Custom bonuses apply to new runs. A journal tracks heroes, bosses, equipment, local enemies, and six achievements.

## Treasure and Training Grounds

Elites and every twentieth defeated enemy drop treasure; guardians drop a Rare-or-better chest. Walk over a chest to collect it. Twenty-six Zelda treasures cover five rarities and stack up to their listed limit, normally ten. Uncollected chests bank before travel, and checkpoints preserve pending rewards separately from acquired stacks.

Equipment modifies physical/magic damage, critical chance and damage, movement, projectile speed, armor, evasion, healing, regeneration, lifesteal, thorns and XP collection. Critical chance starts at 5%, with 175% critical damage. Above 100%, additional critical chance becomes mega-critical probability, capped at 200%. Fire, ice, splash and shock fruits add statuses; opposing fire/water effects produce steam, and shock chains from soaked targets. Inventory shows actual damage per weapon and effect.

Choose **Training grounds** from the title. Try any of the 11 playable characters on any map or stage. Edit up to four weapons at levels 0–8 and five charms at levels 0–10, extend the caps to 10/12 with the appropriate treasure, select each weapon’s upgrade rarity, change treasure stacks, and manually spawn a stationary dummy, groups, elites, alphas or a map guardian. Inventory reopens Training controls. Incoming damage is disabled by default and can be enabled. Applying a build resets the arena; setting treasure alone preserves it. Training grants no rewards, discoveries or unlocks, and never replaces a saved Adventure. Training itself is not saved.

These are independently authored Zelda equivalents. PARITY.md identifies verified reference formulas and remaining differences; this release does not claim full PokéBonk parity.

## Pixel art and map dressing

All eight realms now have layered pixel canopies, varied undergrowth, worn trails, trail markers, lanterns, and ground patches. Lake Hylia and the Great Sea have visible shorelines, reeds, ripple patterns, and causeways. The Depths use pale fungal trees and cyan growth; Twilight has its own palette and markings. Kokiri houses and ruins carry timber, shingle, masonry, moss, and window detail. Skyloft has an animated windmill. Hero sprites now use 112×112 pixel canvases and eight camera-relative views. Their distinct depictions follow Ocarina of Time Link and Sheik, Breath of the Wild ceremonial Zelda, Twilight Princess imp Midna, The Wind Waker Tetra, and Majora’s Mask Skull Kid. Costumes include the Hylian Shield crest, Sheikah eye, Fused Shadow carvings, pirate scarf/sash, and mask horns. Walk cycles move jointed limbs, hair, and cloth; attacks, casts and Ultimates retain their own poses. Little Frox now has its single central eye. These remain independently authored pixel adaptations, not official sprites or extracted animation.

Ground textures use mip levels to reduce distant shimmer while sprite magnification remains nearest-neighbor. Trees and undergrowth use shared instanced billboard batches with root-anchored wind. Wind pauses with the simulation and stops under reduced motion or Low graphics. Low quality reduces undergrowth density and shadows; High retains full dressing. Scenery does not add collision barriers or change the existing terrain routes.

## Adventure companions and unlocks

Defeating a map guardian recruits the realm’s ally. The ally follows you into later maps and returns when you resume that campaign. Recruits take turns helping; they do not all attack at once. Recruit rewards also make the matching hero available for new runs. Sheik still unlocks for selection after three guardians; clearing Sky Keep is what recruits her into that Adventure. Training lets you test all heroes but does not unlock or recruit them.

| Victory | Ally |
| --- | --- |
| Gohma at the Great Deku Tree | Saria |
| Morpha at the Water Temple | Ruto |
| King Bulblin at Hyrule Castle Courtyard | Nabooru |
| Helmaroc King at Forsaken Fortress | Tetra |
| Zant at Palace of Twilight | Impa |
| Ghirahim at Sky Keep | Sheik |
| Colgera at the Wind Temple | Darunia |
| Majora’s Mask inside the Moon | Skull Kid |

Link, Zelda, and Midna remain starting heroes. The three original progression unlocks remain. No bosses are playable. Companions are a single-player Adventure system.

## Hero, enemy, and boss animation

The roster’s signature moves and poses are based on specific official titles, including linked sources in [Franchise move references](FRANCHISE-MOVE-REFERENCES.md). Pixels are drawn for Zelabonk; official animation assets are not included. Link retains the paraglider and animated sword beam. The other characters can still slow descent as a shared control, without invented glider gear. Skull Kid hovers in place and floats as he moves, including when recruited; this is presentation only and does not lift the hitbox off the ground. Enemies and guardians keep their authored wind-ups, follow-through, and reaction frames.

Each roster card describes its own starter and Ultimate. Different moves have their own anticipation, release, and recovery. Skull Kid summons a grinning Moon that falls onto an aimed area. Darunia keeps his hammer for normal attacks, then leaps, curls into a boulder, and damages nearby enemies only when he lands. Saria’s ocarina and Nabooru’s medallion remain noncombat scenes; their presentation does not imply damage or healing.

## Saves and settings

Safe checkpoints preserve map levels, learned weapon rarity history, and pending choices with their rarities. Older oversized builds retain their slot capacity; older weapon ranks receive Common history because rarity was not previously stored. Boss encounters restart from the preceding safe checkpoint. Pause and return to title to save safe progress. Starting a new run protects an existing checkpoint with a replacement choice.

Settings includes Low/Balanced/High graphics, sound, volume, reduced motion, camera sensitivity, inverted Y, field of view, camera distance, free or captured cursor, keyboard rebinding, export and import. Move the mouse to look without holding a button. Keep the cursor at either horizontal arena edge to turn continuously through any number of revolutions. Cursor capture also supports continuous turns. Vertical look ranges from near the horizon to nearly overhead, with terrain clearance. Touch uses an arena swipe. Duplicate key assignments are rejected; camera and keys have reset actions. Import validates data and backs up the current profile in browser storage before replacement. Profiles do not sync across devices; export before moving. Old basic records migrate automatically. If storage fails, play continues in memory and export remains available. Web Locks serialize profile mutations in browsers that support them. A stale run cannot overwrite another run's checkpoint.

## Controls

| Input | Action |
|---|---|
| WASD / arrows | Move relative to camera |
| Mouse movement / mouse wheel | Look without holding a button / zoom |
| Space | Jump; hold while descending to slow your fall (Link opens the paraglider) |
| Shift | Dash with brief protection |
| Q / right-click | Aim mode / nearest-target lock |
| R | Fully charged Ultimate |
| E | Level shrine or Survival shrine interaction |
| M | Realm map and level status |
| I / Tab | Inventory |
| Escape / P | Pause; Escape closes auxiliary dialogs |
| 1, 2, 3 | Choose upgrade |
| F / X / Z | Refresh / skip / toggle banish during upgrades |

Touch has a movement stick, jump/slow descent, dash, aim, Ultimate and contextual Activate. Buttons keep native Space/Enter activation. Focus loss pauses gameplay. Nested inventory, map and settings dialogs preserve their parent's pause state.

## Optional local backend

The local Node backend uses embedded PostgreSQL, so Docker and provider accounts are not required. From this folder, install its pinned dependencies with `npm ci --prefix backend --ignore-scripts`, then run `npm run backend -- --data-dir 'C:\path\to\private\zeldabonk-data'`. Its health endpoint is http://127.0.0.1:4180/health . `npm run test:backend` exercises real HTTP/WebSocket clients, persistence, authorization and transactional economy.

Local accounts, saves, shared authoritative rooms, ranked settlement, clans, escrow trades, crafting and a fixed-price shop are implemented. The current game menus are not wired to those APIs yet. No online backend is deployed. [Backend documentation](backend/README.md) describes the API, local ruleset and remaining production work.

## Source and verification

    npm ci --prefix backend --ignore-scripts
    npm test

The complete test suite requires Node.js 24 and the optional backend dependencies. Frontend-only simulation tests can run separately with `node --test tests/*.test.cjs`.

Deterministic tests cover the 24-level campaign, map enemy pools, progression, terminal results, checkpoints, migration/import, purchases, unlocks, bounded entities, projectile families, targeting and baseline combat. Browser checks cover menus, changing animation poses, keyboard/touch, campaign event flow, safe reload and responsive layouts. Forced encounter completion verifies integration, rather than balance. Touch is verified through emulation; physical-device performance varies.

- core.js: simulation, campaign and checkpoint invariants.
- terrain.js: shared deterministic terrain, collision geometry and spatial lookup.
- combat.js: Zelda treasure catalog, stat aggregation, critical rules and equipment validation.
- profile.js: progression, purchases, migration, validation and once-per-run settlement.
- art.js: original pixel art, animation frames, textures and material cache.
- app.js: 3D rendering, effects, input, dialogs, sound and persistence.
- REFERENCE-ANALYSIS.md: reference evidence and scope limits.
- PARITY.md: active feature coverage, evidence and missing systems.

## Vercel

The repository is connected to https://zelabonk.vercel.app . Static hosting uses the repository root, no install/build command, and output directory dot, as set in vercel.json. No environment variables are needed. Successful GitHub deployment status and matching public source hashes establish a deployed revision.

## Credits and scope

Unofficial fan game, unaffiliated with Nintendo. Zelda's characters, names and settings belong to their respective owners. Pixel artwork and animations are independently authored. No Nintendo or PokéBonk sprites, music, models or source are bundled. Three.js uses MIT; Lilita One and Nunito use SIL Open Font License. License texts ship alongside those files.

Reference: https://pokebonk.com/ . The public v0.10.15 and v0.10.17 clients, official notes, and non-counting Training Grounds were inspected. These eight maps remain compact interpretations. Capture, fusion, transformations, additional modes, expanded catalogs, multiplayer, accounts and social systems are requested work that remains unfinished. No online backend exists yet.
