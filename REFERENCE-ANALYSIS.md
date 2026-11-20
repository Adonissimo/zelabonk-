# PokéBonk reference analysis

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
| Camera | Drag orbit, wheel zoom, camera-relative movement |
| Combat | Retained auto-casting; added manual camera-directed aim, target lock and its ring |
| Ultimate | Great Spin, Fused Shadow, Triforce Light, charge cost and visible meter |
| Upgrade decisions | Two refreshes, two skips, one banish per run; banished choices stay excluded |
| HUD | Hero portrait, minimap, follow-health bar, loadout names, charge, and kill streak |
| Actual Zelda identity | Link, Zelda, Midna, canonical realm names, Zelda items, landmarks, Phantom Ganon |
| Interconnection | Retained the tested six-realm gate graph and shared run state |

Reused the responsible simulation, rendering, and interface layers. The first prototype's art approach was the main mismatch; the actor and environment renderer was changed instead of adding decoration around the same primitive models.

## Theme and limits

The user's final theme instruction is actual Zelda, not invented names with a similar mood. The build uses Hyrule Field, the Great Sea, the Twilight Realm, Skyloft, the Depths, and Termina Field. Landmarks include a Great Deku Tree depiction, a red sailing boat, a winged goddess statue, gloom fissures, a clock tower, and an expressive moon.

Artwork is independently drawn in code. No assets were extracted from Nintendo or PokéBonk. This is an unofficial fan game, unaffiliated with Nintendo.

Exact reference balance is unverified and not copied. Complete feature parity still requires collection, permanent progression, more content, and richer terrain traversal. The six maps are compact arena interpretations, not exhaustive canonical maps. Multiplayer and accounts are not implemented.
