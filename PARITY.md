# PokéBonk parity coverage

Full functional parity is the target. It is not complete. This table describes implemented behavior, rather than treating research or planned work as finished features.

Reference versions inspected: PokéBonk v0.10.15 and v0.10.17, November 21, 2026. Evidence includes the public landing screen and client, official Season 4 announcements, and the signed-in, explicitly non-counting Training Grounds. Private account data, downloaded reference source, browser profiles, and reference assets are not distributed with this project.

| System | Reference evidence | ZeldaBonk coverage | Remaining work |
|---|---|---|---|
| Camera and movement | Training and public control settings | Camera-relative movement, mouse look without dragging, zoom, jump, glide, dash, lock-on, auto/manual aim | Measure camera response and additional platforming behavior against live play |
| Terrain | Training with plateaus | Shared rendered and physical plateau/ramp terrain, trees and rocks, clear gate routes across 24 stages | More terrain shapes and environmental interactions |
| Maps | Zone-based reference progression | Eight connected Zelda maps with three stages each, map-specific enemies and landmarks | Broader franchise coverage and richer authored level layouts |
| Heroes and enemies | Reference roster and live training | Six animated Zelda heroes, regional mobs, eight guardians and Ganondorf | Larger roster, distinct passives and additional enemy roles |
| Attacks | Three base move slots; fourth Lab unlock costs 1500; normal cap 8, extended cap 10 | Six weapon families, three/four slots, measured rotating rarity growth and archetype stats, 8/10 caps, projectile speed/lifetime/pierce/bounce, timed orbit, saved rarity history | Move archive, broad move catalog, move-specific statuses and exact character balance |
| Passive upgrades | Three base vitamin slots; upgrades cost 1200 and 3000; cap 10, extended cap 12 | Three/four/five charm slots, matching unlock prices, 10/12 caps; realm bonuses do not consume learned slots | Reference passive rarity/stat growth and full vitamin equivalents |
| Equipment | Public item catalog and Training item editor | 26 Zelda treasures, five rarities, stack limits, modifiers, equipment journal, cap-extending Adventure Pouch/Green Potion and saves | Complete catalog, remaining special effects, insurance and source-specific drop tables |
| Experience | Threshold is round(8 + level × 5.5 + level^1.8) | Same threshold in solo, training and local co-op; XP overflow preserved | Reference enemy values, encounter pacing and XP modifiers |
| Critical hits | Base 5%, critical damage 175%, overflow to mega-critical chance | Criticals, capped 200% chance, overflow mega-criticals and distinct feedback | More stat interactions and multi-hit aggregation |
| Defense and recovery | Reference stat panel and item modifiers | Armor, evasion, thorns, regeneration, healing modifiers and lifesteal | Shields, overheal, revival and remaining proc families |
| Statuses | Public combat system | Burn, freeze, shock, wet, steam and chain shock | Full status/reaction catalog and move-specific application rules |
| Damage breakdown | Live Training inventory | Actual damage attributed to each weapon, treasure effect, reaction and Ultimate | Detailed encounter timelines and additional system sources |
| Loot and map events | Public client and official notes | Elite/guardian treasure drops and periodic enemy treasure; pickups bank across gates | Merchants, machines, encounter choices, support capture, rifts and relic events |
| Fusion and joins | Public move and fusion systems | Not implemented | Recipes, prerequisites, slot replacement, animations and UI |
| Transformations | Official Season 4: separate 25-second Max Forms | Hero Ultimates exist as a separate current mechanic | Zelda transformations, charge rules, form animations and independent controls |
| Classic | Three-zone flow, guardians and legendary, challenge seals | Three-stage Zelda map campaign and guardian encounters | Reference timing, Final Swarm/Collapse and optional seal modifiers |
| Survival | Contracts and badges | Current four-minute encounter mode | Reference contracts, badges, pacing and scoring |
| Overtime | Official notes and current round-24 cap | Not implemented | Rounds, offerings, ring/tide pressure, cash-out and reward settlement |
| Relay | Four-member team | Not implemented | Team builds, swaps, separate health and run saves |
| Daily | Deterministic daily map, difficulty and seed | Seeded simulation exists | Daily selection, mutators and records |
| Training | Non-counting sandbox, configurable builds and rivals | All six heroes, 24 map/stages, level, invulnerability, four-weapon/five-charm builds, per-weapon rarity selectors, extended caps, treasure stacks and manual rivals | Relic editor, recurring spawns and remaining sandbox tools |
| Expedition | Permanent extraction mode, crafting, market | Not implemented | Inventory, extraction, recipes and trade settlement |
| Progression | Friendship, archive, builds, league and collections | Local rupees, permanent upgrades, unlocks, equipment discoveries and achievements | Friendship, archive, build plans and expanded progression |
| Saves | Reference local/cloud saves and reconnect | Browser saves plus tested local account-save API, revision conflicts, persisted co-op snapshots and restart/reconnect | Browser/API integration and hosted cloud persistence |
| Accounts and social | Reference accounts, clans, trading, global records | Local PostgreSQL accounts/sessions, ownership checks, clan API, escrow trade/craft/shop transactions | Browser flows, hosted authentication, clan missions/chat, player-listed market and production hardening |
| Co-op and ranked | Reference relay/daily/boss co-op and server validation | Tested local authoritative one-to-four-player rooms, shared combat/XP, reconnect and server-only ranked settlement | Browser multiplayer rendering/lobby, remaining modes, hosted service, multi-process coordination and production validation |
| Settings | Live options and public controls | Graphics, audio, volume, rebindable keys, camera sensitivity, inversion, FOV, distance and reduced motion | Additional input devices and remaining accessibility/settings parity |

## Mechanical evidence and authored choices

Verified reference facts reproduced in this pass include base critical chance and damage, the 200% total critical chance cap, the mega-critical multiplier of `criticalDamage × (1 + 0.5 × (criticalDamage − 1))`, default item stack limit 10, and a subset of additive/multiplicative equipment bonuses.

The progression pass also reproduces three starting slots in each category, the fourth-weapon and fourth/fifth-passive unlock prices, 8/10 normal caps, 10/12 extended caps, the XP curve, and rarity strength factors `[1, 1.2, 1.45, 1.75, 2.1]`. Weapon upgrades apply the measured rotating two-stat bonuses, or three at Heroic/Legendary strength, plus the 8% upgrade damage modifier and 4%-per-level damage factor. A level-8 bolt with seven Uncommon upgrades reproduces the measured 2.088 damage modifier, 0.817216 cooldown multiplier, two extra shots, 36% speed, two pierce, two bounces and 12% critical bonus. The former automatic rank-7 awakening was removed; real fusion remains unfinished.

The six attack families use measured archetype base damage, cooldown, projectile count, size, speed and duration. Their Zelda mapping and hero multipliers remain authored. Fused Shadow now has four seconds of base uptime per 5.5-second activation cycle; its contact debounce remains authored. Homing belongs to Light Arrows; Master Sword beams fly straight. Swept collision keeps fast projectiles from skipping enemies.

The Zelda equipment mapping, rarity roll weights and equipment allocation, passive stat growth, periodic treasure frequency, armor formula, status chances/durations, reaction damage and campaign rules are independently authored. They have not all been measured against live reference gameplay. Similar functionality does not establish exact numerical parity.

## Data and delivery constraints

Training must never settle rewards, discover permanent items, unlock heroes, or replace an Adventure checkpoint. Pending treasure and acquired equipment must remain disjoint in saves. A chest can grant its reward once. Status timers freeze during menus. Proc and reaction damage cannot recursively trigger another proc chain.

Upgrade rarity history and pending card rarities survive reloads. Legacy builds retain their equipment and pending choices, even when larger than the new starting capacity. Old weapon levels receive Common upgrade history because old saves did not record rarity. Local party actors own separate rarity histories and orbit timers. New local rooms use ruleset `2.2.0-local-1`; old persisted rooms retain their stored settlement ruleset label while their simulation migrates to these rules.

Online features require a real backend. Client-side records and local profiles are not authoritative ranked scores. Deployment provider selection, account access, security configuration and any hosting costs must be resolved before creating production resources.
