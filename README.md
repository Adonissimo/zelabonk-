# Relic Wilds

A playable 3D survival adventure inspired by PokéBonk's survivor loop and the landscapes, exploration, and ancient magic of the 3D Zelda games.

This compact original world contains six interconnected realms. It is a representative interpretation of the combined theme, not an exhaustive recreation of every canonical location. All character models, environments, names, and effects in this game are original procedural artwork.

## Play

Open `index.html` in a current version of Edge, Chrome, Firefox, or Safari. Keep the folder together. No installation, account, build step, server, or internet connection is required. JavaScript, WebGL, and browser hardware acceleration must be available.

The separately delivered `Relic-Wilds.html` is the portable version: one file with the game, 3D engine, and fonts embedded.

Optional local server, with Node.js 18 or newer:

```sh
npm start
```

Open `http://127.0.0.1:4173`. Set `PORT` to use another local port.

## Deploy on Vercel

1. Open https://vercel.com/new and sign in with GitHub.
2. Import `Adonissimo/zelabonk-`. Grant Vercel access to that repository if asked.
3. Keep the root directory at the repository root. The included `vercel.json` selects no framework, skips installation and building, and serves the current directory.
4. Click Deploy. Open the production URL once Vercel reports Ready.

If configuring manually, choose the Other framework preset, leave Build Command and Install Command empty, and set Output Directory to `.`. No environment variables are required. Future pushes to the connected production branch can trigger Vercel deployments. A GitHub push alone does not establish that Vercel has deployed the game.

## Your adventure

Choose Ari, Rook, or Fern. Weapons attack automatically. Defeat enemies, collect luminous shards, and choose a power whenever you level up. Each weapon evolves at rank 7. A four-minute survival phase ends when the Hollow Warden awakens. Defeat the Warden to win; the clock continues during the fight.

Three ancient gates in every realm connect the world. Approach a gate and interact to cross. Health, experience, weapons, charms, elapsed time, and shrine blessings carry over. Uncollected shards are banked once during the crossing. The Warden follows gates without restoring its health. Gates recharge for five seconds after travel.

Each realm contains one shrine near its center. Interact to receive its permanent blessing for the current run, brief protection, and an enemy-clearing pulse. The six realms are:

| Realm | Theme | Shrine blessing |
|---|---|---|
| Verdant Reach | Ancient forest and forgotten stonework | +45% shard collection range |
| Tideglass Coast | Bright seas, palms, and a wind-powered sailboat | +25 maximum health; restore 35 health |
| Dusk Hollow | Twilight, dark crystals, and an otherworldly moon | +18% weapon damage |
| Zephyr Isles | Floating islands and sky ruins | Weapons attack 10% faster |
| Ember Depths | Volcanic rock, fissures, and glowing embers | Regenerate 1 health per second |
| Moonveil Ruins | Lunar ruins and a suspended time ring | +10% movement speed |

The realm map shows the actual gate network. Map nodes preview worlds on the title screen. During a run, travel requires reaching a physical gate.

## Controls

| Control | Action |
|---|---|
| WASD / arrow keys | Move |
| Space | Jump; hold while descending to glide |
| Shift | Dash with brief invulnerability |
| E | Awaken a nearby shrine or cross a gate |
| M | Realm map |
| Escape / P | Pause / resume |
| 1, 2, 3 | Choose an upgrade |

Touchscreen devices show a movement stick, glide and dash buttons, and a contextual Activate button. Gliding consumes stamina; landing restores it.

The world pauses during upgrades, help, the map, and focus loss. Best kill count and victories are saved locally when browser storage is available. Individual runs are not saved between page reloads. Sound is optional and can be toggled in the top bar.

## Source and checks

- `core.js`: deterministic simulation, combat, leveling, realm graph, shrines, and win/loss rules.
- `app.js`: Three.js scene, original models, rendering, sound, input, interface, and optional local records.
- `styles.css` and `index.html`: responsive interface and native accessible dialogs.
- `tests/core.test.cjs`: fourteen deterministic tests, including a full simulated survival phase.

```sh
npm test
```

Desktop and mobile browser checks cover offline launch, controls, pause ownership, upgrade selection, every gate transition, every shrine blessing, the Warden interface, victory, defeat, and restart. Headless tests use software WebGL; this does not establish frame rates on all physical devices. Touch was checked through browser emulation, not a physical phone. Long-term difficulty balancing remains an area for playtesting.

## Credits

- Three.js 0.160.1, MIT license: `vendor/THREE-LICENSE.txt`. The vendored classic script is intentionally used for direct offline `file:` launch without a module server. Its legacy-build warning is expected.
- Lilita One, SIL Open Font License: `assets/LILITA-OFL.txt`.
- Nunito Extra Bold, SIL Open Font License: `assets/NUNITO-OFL.txt`.
- Gameplay reference: https://pokebonk.com/ . The reference's source, art, branding, and audio are not included.

No analytics, advertising, remote account services, or runtime network requests are included.
