# PokéBonk reference analysis

Update, November 21, 2026: the user completed verification and non-counting Training Grounds was subsequently inspected in Brave at v0.10.15. Public client data and official Season 4 notes were also reviewed. PARITY.md is the current feature/evidence matrix. The earlier landing-screen audit below remains historical evidence; its former bounded scope does not replace the active full-parity target.

## Evidence

Inspected November 20, 2026. The official landing screen displayed beta v0.10.14. Guest entry stopped at a human-verification check. No live combat playtest is claimed.

Visually inspected five public captures: survival gameplay, combat, upgrades, starter selection, and the main menu. Some captures show earlier beta interfaces. Control guides are secondary evidence; current timing and formulas remain unverified.

Sources:

- Official game: https://pokebonk.com/
- Original-game capture gallery: https://pokebonk.lol/pokebonk-original/
- Secondary controls: https://pokebonk.wiki/guides/controls-and-aiming/
- Secondary first-run outline: https://pokebonk.games/play/

Reference images stay in the analysis workspace and are not shipped as game assets.

## Findings

The inspected images show outlined pixel characters and sprite-like foliage in textured 3D terrain. Crisp grass texels, layered stone walls, readable silhouettes, and dense plants establish the look. Solid-color primitive character models do not reproduce that approach.

The HUD groups character identity at upper left, timing and phase above the action, a circular minimap at upper right, and move slots plus an R ability below. Health follows the character. Damage numbers and a streak counter reinforce combat feedback. Upgrade captures show three choices and refresh, skip, and banish controls. The menu also presents collection and permanent-progression systems.

Secondary guides report automatic regular attacks, camera movement, jump/slide, aim switching with Q, separate right-click target lock, and an R Ultimate. These reports are not a live verification of every binding in v0.10.14.

## ZeldaBonk changes

| Area | Implemented response |
|---|---|
| Art | Independently drawn directional Zelda pixel sprites, foliage, grass and stone textures |
| Camera | Mouse look without dragging, wheel zoom, camera-relative movement |
| Combat | Retained auto-casting; added manual camera-directed aim, target lock and its ring |
| Ultimate | Six character-specific survivor adaptations, original poses, charge cost and visible meter |
| Upgrade decisions | Two refreshes, two skips, one banish per run; banished choices stay excluded |
| HUD | Hero portrait, minimap, follow-health bar, loadout names, charge, and kill streak |
| Actual Zelda identity | Six playable heroes, ten bosses, canonical equipment/location names and independently drawn fan depictions |
| Interconnection | Eight-map gate graph; shared run state and persistent unfinished map levels |
| Campaign | Three numbered stages per map; enemy waves, guardian seals, then Ganondorf |
| Map ecology | Distinct local species pools for normal spawns, elites and boss summons |
| Permanent progress | Rupees, five capped upgrades, hero unlocks, journal, records and achievements |
| Recovery | Map/upgrade checkpoints, import/export, backups and legacy-record migration |
| Motion | Locomotion, casts, Ultimates, hurt, jump/glide, dash, boss warnings, projectiles, defeat and victory |

Reused the responsible simulation, rendering, and interface layers. The first prototype's art approach was the main mismatch; the actor and environment renderer was changed instead of adding decoration around the same primitive models.

## Theme and limits

The user's final theme instruction is actual Zelda. The build uses Kokiri Forest, Zora’s Fountain, Hyrule Field, the Great Sea, the Twilight Realm, Skyloft, the Depths, and Termina Field. Kokiri Forest is the canonical name for the village location. The 24 level numbers and central progression shrines are this game's structure. Landmarks include the Great Deku Tree, Lord Jabu-Jabu’s spring altar, Hyrule Castle skyline, red sailing boat, Tower of the Gods, twilight architecture, winged goddess statue, lightroot, gloom fissures, clock tower, and expressive moon.

Artwork is independently drawn in code. No assets were extracted from Nintendo or PokéBonk. This is an unofficial fan game, unaffiliated with Nintendo.

Exact reference balance is unverified and not copied. This is a bounded single-player game, without full PokéBonk parity. Creature capture, multiplayer, accounts, richer platforming terrain, exhaustive maps and the full franchise roster remain outside scope.

## Zelda names versus custom behavior

The journal labels games where entities are seen; it does not claim first appearance. Nintendo's Zelda overview and Hyrule Warriors roster establish official character context. Zelda Wiki supplies item and enemy context.

- https://zelda.nintendo.com/about/
- https://www.nintendo.com/en-gb/Games/Wii-U-games/Hyrule-Warriors-891849.html
- https://zeldawiki.wiki/

Named characters, bosses, locations and equipment belong to Zelda. Automatic casting, formulas, stage waves, shrine rewards, unlock requirements, permanent bonuses, connected layouts and animations are ZeldaBonk adaptations. Skull Kid using Din's Fire and Sheik carrying a Boomerang are crossover builds, not claims about their original move sets. Each map's enemy pool uses species associated with its game/location. Boss placements are crossover guardian encounters rather than original dungeon reproductions.


## Camera and settings evidence

Public controls guides describe turning the camera by moving the mouse after focus, with optional pointer capture, wheel zoom, sensitivity, inverted Y, field of view, camera distance and rebinding. ZeldaBonk now uses mouse movement without a held button, with optional cursor capture and touch swiping. Exact current reference camera curves remain unverified because live guest entry required human verification.

- https://pokebonk.app/controls/
- https://pokebonk.gg/controls
- https://pokebonk.cc/guides/controls

The playable bounds increased from 52 by 52 to 128 by 128 units. Low/Balanced/High presets change render resolution, shadows and optional effects. The map-size and camera values are authored for this adaptation.
