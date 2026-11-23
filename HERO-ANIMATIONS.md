# Playable hero animation pass

The updated pixel costumes are used throughout the animation, not just on the idle portrait. The frame sheet shows selected frames at a three-quarter angle; the sprites render in eight directions. In Training Grounds you can try the entire roster without unlocking it first. Turn the camera, move and jump, then compare the starter move and Ultimate.

| Hero | Travel and pose | Starter movement | Ultimate sequence |
| --- | --- | --- | --- |
| Link | Planted running steps, drifting cap and shifting sword and shield | Draw back, sweep the Master Sword, then bring the blade back into guard | Wind up, pivot through the Spin Attack, finish facing forward |
| Zelda | Flowing skirt, tabard and hair change shape as she moves | Raise the bow, pull the light arrow back, release and lower the bow | Gather light with both hands, extend it into the seal, gently lower her arms |
| Midna | Hover instead of walking; cloak and limbs drift with the motion | Lead with her arm, extend a shadow hand toward the enemy, retract it | Gather twilight, expand into Fused Shadow, drive the limbs forward, return to her usual silhouette |
| Tetra | Springy travel with a trailing pirate scarf | Raise the cutlass, lunge into the cut, and recover | Brace the pistol, prime and fire the water shot, then settle after recoil |
| Sheik | Low steps with the layered scarf following behind | Draw back the throwing hand, flick the kunai, follow through | Raise the harp, pluck across the strings, bring it back down |
| Skull Kid | Drifts with tucked knees and folded arms | Raise the horn, then send Tatl and Tael outward in separate paths | Raise both hands, hold the summon through the descent, sweep them downward at impact |
| Saria | Light steps with a small upward bounce | Raise the slingshot, pull the band, snap it forward and lower the hand | Bring the ocarina up, play through the rising notes and lower it; green particles appear afterward |
| Darunia | Short, heavy steps and a rocking torso | Lift the hammer high, drive it forward and down, then pull it back | Brace, jump, curl and rotate, flatten the ball pose at contact, then straighten up |
| Impa | Deliberate, grounded steps | Set both hands, draw the Giant Blade up, slash across, return to guard | Draw back, cut through the water at release, and finish with the blade extended |
| Ruto | Swaying gait with the fins following her turn | Gather water between the hands, then push a wave forward | Broaden the charge, push the surge out, then draw her arms back |
| Nabooru | Hip-led steps with moving sash, hair, and loose trousers | In Iron Knuckle armor, draw the axe back, swing it through, and recover | Lift her hands from her chest, open them to reveal the Spirit Sage medallion, then settle |

Attack sprites finish their pose sequence without looping back to anticipation within the same action. Damage, range, unlocks and move effects are unchanged. Ultimates with a gameplay release use that existing release time to choose the release pose; the story scenes for Saria and Nabooru keep their existing timing. Saria’s green healing particles are visual, not an HP recovery effect.

## Defeat animations

Each defeat now uses eight key poses plus up to seven hand-joint in-between poses. Instead of rotating the whole sprite, the head, torso, hips, elbows, knees, and feet shift independently as the hero braces, collapses, or settles. The motion uses a different pace for each hero. As the sprite changes shape, its feet, knees, or lowest body pixels are anchored to the surface. Every prop falls separately, contacts the terrain first, and tumbles, skips, or settles with a character-specific weight. These are visual props, not items to pick up. Reduced Motion omits the orbit and softens the spin and particles.

| Hero | Defeat choreography |
| --- | --- |
| Link | Recoils and loses the Master Sword; it skips ahead. He plants his shield to brace and slumps behind it. |
| Zelda | The bow slips to the side and lands gently. She lowers herself with control as the gold seal breaks into drifting fragments. |
| Midna | A twilight shard spins away before her hover gives out. She drops, her cloak folds into the landing, and purple fragments scatter. |
| Tetra | Her cutlass skitters ahead. She lunges after it, overbalances, and hits the ground with a spray of droplets. |
| Sheik | A kunai flips away. Sheik pivots into a quick low crouch while pale scarf echoes trail past. |
| Skull Kid | The horn bounces away and Tatl and Tael scatter. His tucked legs go limp, and the hover gives way to a grounded fall. |
| Saria | The ocarina slips free before she curls close to the ground, with forest leaves rising around her. |
| Darunia | The Megaton Hammer thuds and barely bounces. His knees buckle and the heavier landing throws off chips and dust. |
| Impa | The Giant Blade tips and slides to a stop first. She keeps a controlled posture, sinking to one knee as sparks trail off. |
| Ruto | A Zora scale tumbles and skips. Her fins fold inward and her landing dissolves into a puddle and ripples. |
| Nabooru | The Spirit Medallion spins away. She staggers into a grounded kneel, with her sash and amber motes settling after her. |

To try any sequence, open Training Grounds, choose that hero, turn off invulnerability and let the enemy wave defeat you. Training losses do not affect saves, rewards or unlocks.

## Navi

Navi flies beside Link with a cyan orb, a faint breathing glow, and four flapping wings. Her smaller wings flap at a slightly different pace, and she dips toward him during a defeat. Reduced Motion steadies the glow and wings. Navi is cosmetic and does not attack or change stats.
