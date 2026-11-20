# RELIC WILDS

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

A complete, playable survival game inspired by PokéBonk and Megabonk, with a main theme combining the 3D Legend of Zelda games. Explore connected realms, fight automatically, gather experience, choose upgrades, and defeat a final boss.

## Confirmed Constraints

The user requested PokéBonk as the reference, then specified a combined 3D Zelda theme and interconnected realms across the franchise. The delivered game uses original characters, names, geometry, and effects.

## Implementation Assumptions

Browser delivery, offline support, three playable wanderers, and four-minute runs followed by a boss are implementation choices. Six representative original realms cover forest, sea, twilight, sky, volcanic depths, and ancient moon/time ruins. This is a compact interpretation of the requested combined theme; it does not enumerate every canonical Zelda location. No framework, hosting provider, or GitHub repository has been specified.

## Stack

Static HTML, CSS, JavaScript, and vendored Three.js. No build step or backend. Assumed for easy local play.

## Product Principles

- Start playing with one click.
- Pause simulation during menus, upgrades, and focus loss.
- Make damage, upgrades, controls, and the run objective legible.
- Support keyboard and touch controls.
- Preserve the current run's health, time, upgrades, shrines, and boss health across gates.
