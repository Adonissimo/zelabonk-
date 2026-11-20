# PokéBonk parity coverage

Full functional parity is the target. It is not complete. This table describes implemented behavior, rather than treating research or planned work as finished features.

Reference version inspected: PokéBonk v0.10.15, November 21, 2026. Evidence includes the public landing screen and client, official Season 4 announcements, and the signed-in, explicitly non-counting Training Grounds. Private account data, downloaded reference source, browser profiles, and reference assets are not distributed with this project.

| System | Reference evidence | ZeldaBonk coverage | Remaining work |
|---|---|---|---|
| Camera and movement | Training and public control settings | Camera-relative movement, mouse look without dragging, zoom, jump, glide, dash, lock-on, auto/manual aim | Measure camera response and additional platforming behavior against live play |
| Terrain | Training with plateaus | Shared rendered and physical plateau/ramp terrain, trees and rocks, clear gate routes across 24 stages | More terrain shapes and environmental interactions |
| Maps | Zone-based reference progression | Eight connected Zelda maps with three stages each, map-specific enemies and landmarks | Broader franchise coverage and richer authored level layouts |
| Heroes and enemies | Reference roster and live training | Six animated Zelda heroes, regional mobs, eight guardians and Ganondorf | Larger roster, distinct passives and additional enemy roles |
| Attacks | Four move slots; normal cap 8; equipment can extend caps | Six automatic weapon families, rank upgrades and awakenings | Four-slot builds, rarities, reference level caps, move archive and broad move catalog |
| Passive upgrades | Five vitamin slots, equipment can extend caps | Six selectable charm families and shrine bonuses | Slot ownership, caps and reference upgrade formulas |
| Equipment | Public item catalog and Training item editor | 24 Zelda treasures, five rarities, stack limits, modifiers, equipment journal and save support | Complete catalog, remaining special effects, insurance and source-specific drop tables |
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
| Training | Non-counting sandbox, configurable builds and rivals | All six heroes, 24 map/stages, level, invulnerability, four-weapon/five-charm builds, treasure stacks and manual rivals | Relic editor, attack rarities, recurring spawns and remaining sandbox tools |
| Expedition | Permanent extraction mode, crafting, market | Not implemented | Inventory, extraction, recipes and trade settlement |
| Progression | Friendship, archive, builds, league and collections | Local rupees, permanent upgrades, unlocks, equipment discoveries and achievements | Friendship, archive, build plans and expanded progression |
| Saves | Reference local/cloud saves and reconnect | Validated local saves, legacy migration, backups, safe checkpoints and cross-tab ownership | Cloud accounts, co-op reconnect and server persistence |
| Accounts and social | Reference accounts, clans, trading, global records | No backend exists; no online functionality is claimed | Real authentication, authorization, persistent database and social workflows |
| Co-op and ranked | Reference relay/daily/boss co-op and server validation | Not implemented | Authoritative server simulation, rooms, reconnect, validation and leaderboards |
| Settings | Live options and public controls | Graphics, audio, volume, rebindable keys, camera sensitivity, inversion, FOV, distance and reduced motion | Additional input devices and remaining accessibility/settings parity |

## Mechanical evidence and authored choices

Verified reference facts reproduced in this pass include base critical chance and damage, the 200% total critical chance cap, the mega-critical multiplier of `criticalDamage × (1 + 0.5 × (criticalDamage − 1))`, default item stack limit 10, and a subset of additive/multiplicative equipment bonuses.

The Zelda equipment mapping, rarity allocation, periodic treasure frequency, armor formula, status chances/durations, reaction damage, awakening behavior and campaign rules are independently authored. They have not all been measured against live reference gameplay. Similar functionality does not establish exact numerical parity.

## Data and delivery constraints

Training must never settle rewards, discover permanent items, unlock heroes, or replace an Adventure checkpoint. Pending treasure and acquired equipment must remain disjoint in saves. A chest can grant its reward once. Status timers freeze during menus. Proc and reaction damage cannot recursively trigger another proc chain.

Online features require a real backend. Client-side records and local profiles are not authoritative ranked scores. Deployment provider selection, account access, security configuration and any hosting costs must be resolved before creating production resources.
