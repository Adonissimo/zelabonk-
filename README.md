# ZeldaBonk

An unofficial Legend of Zelda survivor. PokéBonk is the gameplay and presentation reference. Play Link, Zelda, or Midna in a world of pixel sprites, textured 3D terrain, and six connected Zelda realms.

Project: https://github.com/Adonissimo/zelabonk- . Production: https://zelabonk.vercel.app . Check deployment status for each revision.

## Play

Open index.html in a current WebGL-capable browser. Keep the folder together. No installation, backend, account, build step, or runtime network access is required. The separately delivered ZeldaBonk.html embeds the game, art generator, engine, and fonts.

With Node.js 18 or newer:

    npm start

Open http://127.0.0.1:4173 . PORT selects another local port.

## Controls

| Input | Action |
|---|---|
| WASD / arrows | Move relative to the camera |
| Drag game view | Orbit camera |
| Mouse wheel | Zoom |
| Space | Jump; hold while descending to glide |
| Shift | Slide/dash with brief protection |
| Q | Auto/manual camera-directed aim |
| Right-click | Lock/unlock nearest enemy; a ring marks it |
| R | Use fully charged Ultimate |
| E | Gate or shrine interaction |
| M | Open/close realm map |
| Escape / P | Pause/resume |
| 1, 2, 3 | Choose upgrade |
| F / X / Z | Refresh / skip / toggle banish during level-up |

Touch controls include a movement stick, jump/glide, dash, contextual interaction, aim toggle, and tappable Ultimate. Drag the arena to orbit. Focused interface buttons retain native keyboard activation; gameplay focus returns after menus close.

## Run

Weapons cast automatically. Defeat enemies, collect green shards, and choose upgrades. Weapons evolve at rank 7. Each run has two refreshes, two skips, and one banish. Banish removes a selected choice from future offers without removing an equipped weapon.

Time and defeated enemies charge the Ultimate. Link uses Great Spin. Midna uses Fused Shadow and gains longer protection. Zelda uses Triforce Light and restores health. A kill streak expires after four seconds without another defeat.

After four minutes, Phantom Ganon appears. Dodge telegraphed circles and defeat him to win. The clock continues during the fight. All numerical balance is original to this survivor mode.

Hyrule Field, the Great Sea, the Twilight Realm, Skyloft, the Depths, and Termina Field each have three gates and a shrine. Health, time, XP, weapons, charge, shrine blessings, and boss health persist across gates. Loose XP is banked once on crossing. Gates recharge for five seconds.

These are compact connected arenas with decorative stone rims and landmarks. They are not full recreations of Zelda's maps or complete platforming levels.

## Source and checks

    npm test

Nineteen deterministic tests cover simulation invariants, camera-relative movement, leveling, targeting, Ultimates, streaks, choice resources, realm connectivity, shrines, bounded entities, boss persistence, and terminal states.

- core.js: simulation and run invariants.
- art.js: independently drawn pixel sprites and procedural texture cache.
- app.js: Three.js scene, camera, input, sound, interface, local records.
- REFERENCE-ANALYSIS.md: evidence, sources, differences, and remaining gaps.

Local storage optionally retains best records and sound preference. Runs do not persist across page reloads. Touch checks use browser emulation; performance is not established on every physical device.

## Vercel

Import Adonissimo/zelabonk- at https://vercel.com/new . Keep the repository root. vercel.json configures a static project, no install/build command, and output directory dot. No environment variables are needed. Wait for Ready before treating a push as deployed.

## Credits and scope

Unofficial fan game; unaffiliated with Nintendo. Zelda characters, names, and setting belong to their respective owners. Pixel depictions are independently drawn in art.js. No official sprites, audio, models, or PokéBonk source/assets are bundled.

Reference: https://pokebonk.com/ . Guest entry encountered human verification; analysis uses public captures and labeled secondary guides. Collection/capture, permanent upgrade shop, multiplayer, accounts, an exhaustive roster, and full franchise map coverage are not implemented.

- Three.js 0.160.1, MIT: vendor/THREE-LICENSE.txt. Its classic-script warning is expected; direct offline file launch is supported.
- Lilita One, SIL Open Font License: assets/LILITA-OFL.txt.
- Nunito Extra Bold, SIL Open Font License: assets/NUNITO-OFL.txt.
