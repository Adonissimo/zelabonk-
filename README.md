# ZeldaBonk

An unofficial single-player Legend of Zelda survivor, using PokéBonk as its gameplay and presentation reference. Animated pixel actors inhabit eight connected 3D arenas. Adventure has 24 numbered levels and a final Ganondorf encounter. Survival has a four-minute Phantom Ganon challenge.

Repository: https://github.com/Adonissimo/zelabonk- . Production: https://zelabonk.vercel.app . A Git push and a live deployment are separate events; verify the current revision before treating it as deployed.

## Play

Open index.html in a current WebGL-capable browser with the source folder intact. The separately delivered ZeldaBonk.html embeds scripts, fonts and art for offline play. No account, backend, environment variables, installation or build step is required.

For a local server with Node.js 18 or newer:

    npm start

Open http://127.0.0.1:4173 . PORT selects another port. Serving the game gives browser storage a stable origin.

## Adventure: eight maps, three levels each

Each map has an independent level state. Defeat 12 enemies in its first level and 18 in its second. Reach the central shrine and press E or tap Activate to advance. The third level ends with a guardian. Restore all eight seals, return to Hyrule Field, and challenge Ganondorf. Gates are sealed during Adventure boss encounters.

| Map and levels | Local enemies | Guardian | Landmark interpretation |
|---|---|---|---|
| Kokiri Forest 1-1, 1-2, 1-3 | Deku Baba, Deku Scrub, Skulltula | Gohma | Great Deku Tree and tree houses |
| Lake Hylia 2-1, 2-2, 2-3 | Octorok, Tektite, Lizalfos | Morpha | Lakeshore and Water Temple ruins |
| Hyrule Field 3-1, 3-2, 3-3 | Chuchu, Keese, Bokoblin | King Bulblin | Hyrule Castle skyline |
| Great Sea 4-1, 4-2, 4-3 | Blue ChuChu, Bokoblin, Seahat | Helmaroc King | Red sailing boat and Tower of the Gods |
| Twilight Realm 5-1, 5-2, 5-3 | Shadow Vermin, Shadow Kargarok, Shadow Beast | Zant | Twilight architecture and mirror |
| Skyloft 6-1, 6-2, 6-3 | Chuchu, Keese, Remlit | Ghirahim | Statue of the Goddess and sky islands |
| Depths 7-1, 7-2, 7-3 | Little Frox, Gloom Bokoblin, Evermean | Colgera | Lightroot and gloom fissures |
| Termina Field 8-1, 8-2, 8-3 | Blue ChuChu, Deku Baba, Takkuri | Majora's Mask | Clock Tower and moon |

Kokiri Forest is the canonical name of the village location. Stage layouts, central progression shrines, crossover encounters and combat formulas are authored for this game, rather than exact reproductions of Zelda maps. Map changes preserve health, XP, equipment, charge and each map's unfinished level progress. Each arena measures 128 by 128 playable units, about six times the prior area. Stage layouts vary while retaining the location's terrain and landmarks.

Survival uses the connected map network with immediate shrine rewards and the timed final boss. It does not require Adventure's three-level campaign progression. Phantom Ganon follows you through gates without recovering health.

## Combat and progression

Weapons cast automatically. Collect XP shards to choose weapons and charms. The six weapon families are Master Sword, Fused Shadow, Din's Fire, Light Arrows, Bombs and Boomerang. Bombs explode across an area; Boomerangs strike outward and on return. Rank 7 awakens weapons. A run provides two refreshes, two skips and one banish. Banish excludes a choice from later rolls without removing equipped ranks.

Bosses change phase at two-thirds and one-third health. Warnings precede slams, charges, volleys, summons and teleports. Time and enemy defeats charge your Ultimate. Animation states include idle, locomotion, attacks, casting, Ultimates, hurt, jump/glide, dash, spawn, wind-up, defeat and victory.

Link, Zelda and Midna start unlocked. Helmaroc King unlocks Tetra; three different guardians unlock Sheik; Majora's Mask unlocks Skull Kid. Their automatic loadouts and survivor effects are crossover adaptations.

Completed runs grant rupees. The Great Fairy camp sells five capped permanent upgrades: Heart Container, Power Bracelet, Mirror Shield, Wallet and Magic Jar. Custom bonuses apply to new runs. A journal tracks heroes, bosses, equipment, local enemies, and six achievements.

## Treasure and Training Grounds

Elites and every twentieth defeated enemy drop treasure; guardians drop a Rare-or-better chest. Walk over a chest to collect it. Twenty-four Zelda treasures cover five rarities and stack up to their listed limit, normally ten. Uncollected chests bank before travel, and checkpoints preserve pending rewards separately from acquired stacks.

Equipment modifies physical/magic damage, critical chance and damage, movement, projectile speed, armor, evasion, healing, regeneration, lifesteal, thorns and XP collection. Critical chance starts at 5%, with 175% critical damage. Above 100%, additional critical chance becomes mega-critical probability, capped at 200%. Fire, ice, splash and shock fruits add statuses; opposing fire/water effects produce steam, and shock chains from soaked targets. Inventory shows actual damage per weapon and effect.

Choose **Training grounds** from the title. Try any of six heroes on any map/stage. Edit up to four weapons at ranks 0–8 and five charms at ranks 0–10, change treasure stacks, and manually spawn a stationary dummy, groups, elites, alphas or a map guardian. Inventory reopens Training controls. Incoming damage is disabled by default and can be enabled. Applying a build resets the arena; setting treasure alone preserves it. Training grants no rewards, discoveries or unlocks, and never replaces a saved Adventure. Training itself is not saved.

These are independently authored Zelda equivalents. PARITY.md identifies verified reference formulas and remaining differences; this release does not claim full PokéBonk parity.

## Saves and settings

Safe checkpoints preserve map levels and pending upgrade choices. Boss encounters restart from the preceding safe checkpoint. Pause and return to title to save safe progress. Starting a new run protects an existing checkpoint with a replacement choice.

Settings includes Low/Balanced/High graphics, sound, volume, reduced motion, camera sensitivity, inverted Y, field of view, camera distance, free or captured cursor, keyboard rebinding, export and import. Move the mouse to look without holding a button. Touch uses an arena swipe. Duplicate key assignments are rejected; camera and keys have reset actions. Import validates data and backs up the current profile in browser storage before replacement. Profiles do not sync across devices; export before moving. Old basic records migrate automatically. If storage fails, play continues in memory and export remains available. Web Locks serialize profile mutations in browsers that support them. A stale run cannot overwrite another run's checkpoint.

## Controls

| Input | Action |
|---|---|
| WASD / arrows | Move relative to camera |
| Mouse movement / mouse wheel | Look without holding a button / zoom |
| Space | Jump; hold while descending to glide |
| Shift | Dash with brief protection |
| Q / right-click | Aim mode / nearest-target lock |
| R | Fully charged Ultimate |
| E | Gate, level shrine or guardian interaction |
| M | Realm map and level status |
| I / Tab | Inventory |
| Escape / P | Pause; Escape closes auxiliary dialogs |
| 1, 2, 3 | Choose upgrade |
| F / X / Z | Refresh / skip / toggle banish during upgrades |

Touch has a movement stick, jump/glide, dash, aim, Ultimate and contextual Activate. Buttons keep native Space/Enter activation. Focus loss pauses gameplay. Nested inventory, map and settings dialogs preserve their parent's pause state.

## Source and verification

    npm test

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

Reference: https://pokebonk.com/ . The public v0.10.15 client, official notes, and non-counting Training Grounds were inspected. These eight maps remain compact interpretations. Capture, fusion, transformations, additional modes, expanded catalogs, multiplayer, accounts and social systems are requested work that remains unfinished. No online backend exists yet.
