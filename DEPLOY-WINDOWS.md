# Deploy ZeldaBonk: Enemy and Boss Animations

## On Windows: GitHub in the browser

1. Extract `Zelabonk-Enemy-Animations.zip`, then open its `Zelabonk` folder.
2. Open [Adonissimo/zelabonk-](https://github.com/Adonissimo/zelabonk-) and select `main`. At the repository root, choose **Add file → Upload files**.
3. If your repo has **Minimap Zoom**, upload only `app.js` and `art.js`. If you have **Wider Realms and Minimap**, upload `app.js`, `art.js`, `index.html`, and `styles.css`. If your repo has **Ruto Swimming** or **Water Movement**, upload `app.js`, `art.js`, `core.js`, `index.html`, `kokiri-deku-tree.js`, `kokiri-pixel-floor.js`, `minimap.js`, `profile.js`, `styles.css`, and `terrain.js`. If you have **Lord Jabu-Jabu**, **Zora’s Fountain and Ally Proportions**, or **Great Deku Tree 3D**, also upload `companions.js`. If older or unsure, compare your repo and upload the extracted project contents, not the ZIP or the outer folder. Preserve independent edits.
4. Commit message: `Improve mob and boss animations`. Create branch `update/enemy-animations`, propose the changes, and open a pull request into `main`. Check that `index.html` and `vercel.json` are still at the repo root.

## On Vercel

Keep the existing project if it already tracks this GitHub repository. Open the branch **Preview** for a playtest. After merging, check **Deployments** for the **Production** deployment on `main` to be **Ready** before testing the live site. Preview and Production have separate browser saves.

For a new project, import the repo at its root. The included `vercel.json` uses the **Other** preset, skips install/build, and uses `.` as output. The static game needs no environment variables. The optional multiplayer backend is separate.

## Enemy animation smoke test

In Training Grounds, spawn a few different enemies and a boss. Watch their movement, attack tell, strike and hit recoil. Defeat Keese to see it fold its wings and fall; ChuChu flattens into a puddle. Gohma tucks her legs and collapses; Morpha splashes apart, and Colgera fractures into icy pieces. Reduced Motion uses shorter, quieter defeats. See the [sprite preview](ENEMY-MOTION-PREVIEW.png). Hitboxes, attack timing, stats and rewards were not changed.

## Earlier quick smoke tests

0. Resize the title window to laptop height and portrait phone sizes. Confirm the world fills the viewport, no gold title-menu scrollbar appears, and the last Training Grounds button stays reachable, including when Continue adventure is available. Journal and settings still scroll internally when needed.
1. In Training Grounds, choose **Zora’s Fountain** and play as **Ruto**. Walk off the dry causeway into a pool. Her arms stay by her sides; a wave rolls through her body and both fins kick together. Stop to tread water. Dry ground, attacks, and jumps keep their usual animation. Water speed and wake are unchanged. Pan the camera to her side to see the silhouette best. See the [animated sprite preview](RUTO-MERMAID-PREVIEW.gif) and [offline scene comparison](RUTO-SWIMMING-PREVIEW.png).
2. On desktop, left-click the middle of the arena. The cursor should disappear and mouse look should keep turning at the edge. Press **Esc**: the cursor returns and gameplay pauses. Resume and click again. If capture is blocked or you prefer a visible cursor, use **Settings → Mouse look → Free cursor**. Touch still swipes to look.
3. Start Adventure in **Kokiri Forest** or use **Training Grounds** to try another realm. All eight outdoor realms are now 184 units wide instead of 128, with an outer trail network. Follow a path beyond the old boundary. The physical wall still stops you. The bridge and lookout paths remain walkable. Reach the Great Deku Tree’s mouth after level 1-3 and check that it still opens onto the original boss route.
4. Watch **Local map** during a run. It stays north-up, follows your position on the map, and has distinct pixel icons for player, allies, landmark, shrine and boss. Clear a wave to reveal the next objective marker. After Kokiri 1-3, it guides you up the Deku Trail, then switches to the root tunnel and marks Gohma when the fight starts. Press **M** (or tap **Zoom map**) for a larger map; repeat to shrink it. Gameplay and mouse lock continue, and all markers and the north-up view remain. The full realm overview is still under **Pause → Realm map**. See the [offline minimap preview](MINIMAP-PREVIEW.png).

## Earlier features to check

1. Start solo Adventure as Link. Follow the fork through the stump homes, then walk west across the creek bridge without jumping. It should raise Link smoothly above the water and back down. Pan around a stump house: the roof rings, door, and windows should stay fixed to the house, with bark on the back. Try walking into a stump wall; the original collision still applies. The stage shrine is also a solid pixel-textured model. Check the painted bark-and-moss wall around the map. Walk, dash, jump, and glide into it; Link should stop at its inside edge. Move the mouse to look and scroll to zoom. In Free cursor mode, hold the cursor at a side edge for a continuous turn. On touch, swipe the arena. Turn around halfway and press W: Link should walk into the new view. Trees remain grounded and foreground scenery fades or cuts away if it would cover Link.
2. In a crowded wave, look for the sword crescent leaving Link’s weapon side and for enemy recoil. A danger outline should stay visible under smoke and damage numbers.
3. Before finishing level 1-3, follow the bent pale trail uphill to the northwest grove. The Great Deku Tree now has sculpted brow ridges, a long nose, a wooden moustache, a broad canopy, and grounded roots. The face stays on the trail side as you orbit it. Before the last round ends, the mouth is sealed and reaching it does not begin combat. After level 1-3 and any upgrade choices, follow that trail to the open mouth. The camera moves into the root tunnel. Follow its lanterns and walk under the new root arch into Gohma’s arena. No warp or realm portal was added. Try dodging the marked slam, then hit the exposed eye. Normal hits still get through the guard at reduced damage.
4. Beat Gohma with sound enabled. Watch Saria walk in and play her short ocarina phrase. After the scene, the results confirm both her place in this run and the saved roster unlock. Continue and confirm she follows in **Zora’s Fountain**. Follow the causeway to the cliff waterfalls and pan around Lord Jabu-Jabu. His gold-and-sapphire crown, raised blue eyes, painted snout ribbon, lips, and fins should stay attached to the model as you orbit. He rests on the existing plinth and is scenery, not an entrance or fight. See the [offline front and side preview](JABU-JABU-PREVIEW.png). The Water Temple guardian is still Morpha and defeating it still unlocks Ruto. If you already unlocked Saria, her scene still recruits her for the current run; playing as Saria never spawns a clone.
5. Compare Saria, Impa, and Darunia in Training Grounds, where everyone is playable. Darunia stands well above Link’s height and is much wider; Saria is small. If you reach Darunia as a recruit in Adventure, he keeps that same size when following. Health, collision and combat work as before. See the [ally lineup preview](ALLY-PROPORTIONS-PREVIEW.png).

To run locally on a computer with Node: `npm start`, then open `http://127.0.0.1:4173`. No install is needed for the static game. Automated checks from the extracted project: `node --test tests/*.test.cjs backend/tests/party.test.cjs`.

[GitHub browser uploads](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) · [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)

Map reference: [Kokiri Forest Map by rsfiscina01](https://sketchfab.com/3d-models/kokiri-forest-map-320957f554c143fd9950fa97b2324c2f). Used visually only. This release contains original pixel art and scene geometry, not the uploaded GLB or its textures. The Great Deku Tree exterior was redrawn from three supplied images, which are not bundled. See the [offline preview of the 3D structures](KOKIRI-STRUCTURES-PREVIEW.png).

Lord Jabu-Jabu’s exterior was modeled and painted anew from the supplied image. The reference image is not distributed in the ZIP.
