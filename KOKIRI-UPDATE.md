# ZeldaBonk — Kokiri Forest update

This update builds on Articulated Hero Defeats + Navi, not a fresh project. The existing eight-realm route, save format, heroes, and impact animations are retained. No realm portals were added.

- **Kokiri 1–3:** Follow a forked village lane along five stump homes, climb the low banks, and cross a plank bridge above the brook that joins two shallow pools. The village stays recognizable across waves while light and colors darken toward the tree. The house footprints and bridge height are shared with the simulation. Separate from the village is a moss-covered outer wall that stops Link regardless of jump height; the wall uses stepped world geometry with pixel textures and the collision is unchanged.
- **Layout reference:** [Kokiri Forest Map by rsfiscina01](https://sketchfab.com/3d-models/kokiri-forest-map-320957f554c143fd9950fa97b2324c2f), supplied as a GLB, was studied for its branching paths, stump buildings, raised banks and connected water. ZeldaBonk's layout dimensions, game collision, materials, and meshes were built separately. The GLB and its textures are not included.
- **The Great Deku Tree:** Walk through a lantern-lit root tunnel before stepping into the wider chamber. The root banks are physical. The guardian only starts after the player crosses the chamber threshold.
- **Gohma:** Root Slam and Falling Brood mark danger on the ground. Gohma shields her eye while winding up, then exposes it when the attack lands. Her eye is visibly brighter while exposed, and the HUD calls out the opening. Later phases use tighter timing and additional danger circles rather than merely adding HP. Her standard Training encounter is unchanged.
- **Combat presentation:** Link's crescent peels off his weapon toward the active target lane. Enemies recoil on contact, and heavier hits briefly hold the impact pose without slowing input, the combat timer, or ground warnings. Ordinary hurt and boss arrivals do not shake the camera; major ultimate impacts retain their shake. Shape and timing indicate dangerous ground even under smoke.
- **Saria:** Gohma’s defeat clears the residual attack hazards before the rescue. In a short scene Saria steps in and plays a synthesized ocarina phrase if sound is on. The results distinguish joining this run from the saved character unlock. Finishing the scene is not required to recover a saved victory; reloading skips the story beat and retains the reward and map result.

See [DEPLOY-WINDOWS.md](DEPLOY-WINDOWS.md) for ZIP upload steps and a live gameplay checklist.

## 2D art in a 3D world

- The grass, branching trail, ponds, and bridge are hand-painted pixel tiles draped over the 3D terrain. Houses, trees, roots, and the outer Deku door are crisp native-pixel sprites. The mossy perimeter and inner root banks have height and depth, with original nearest-filtered pixel textures.
- Kokiri and the Deku interior use the regular perspective camera again. Move the mouse (or swipe on touch) to turn and tilt, and use the wheel to zoom. Walking follows the camera heading. Foreground sprites fade and nearby wall sections cut away if they would cover Link, without altering collision.
- Take the pale trail to the tree’s northwest clearing after 1-3. The painted door opens at the same entry point. Inside, the narrow lantern-lit passage opens into the wider nest. The bridge height, wall collision, Gohma, Saria, and saves are unchanged.

[Kokiri Pixel Orbit preview](KOKIRI-PIXEL-PREVIEW.png) shows four offline views, including opposite sides of the same bridge. It is not a live browser screenshot.
