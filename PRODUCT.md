# ZeldaBonk

<!-- impeccable:product-schema 1 -->

## Platform

web

## Confirmed Direction

The user wants PokéBonk as the mechanics, graphics, and overall presentation reference. The user explicitly replaced a merely Zelda-inspired theme with an actual Legend of Zelda theme. The realms must connect and share progression.

## Current Game

An unofficial Zelda survivor featuring Link, Zelda, and Midna. Six compact arenas represent Hyrule Field, the Great Sea, the Twilight Realm, Skyloft, the Depths, and Termina Field. Gates form one connected graph. Health, time, weapons, XP, shrine blessings, Ultimate charge, and boss health carry between realms.

Characters and foliage use independently drawn pixel-art billboards in a textured Three.js world. No official sprites, music, models, or PokéBonk source/assets are bundled. Zelda's characters, names, and setting are recognizable franchise elements.

## Reference Evidence

The official landing screen was inspected. Guest entry encountered a human-verification check, so live combat could not be played. Public captures of the original game's combat, selection, menu, and upgrades were visually inspected. Control guides supply secondary evidence. REFERENCE-ANALYSIS.md separates findings from limits.

## Capabilities

- Automatic weapons, XP, level-up choices, and weapon evolution.
- Camera-relative movement, drag orbit, wheel zoom, jump, glide, and dash.
- Auto/manual aim, separate target lock, and three charged Ultimates.
- Kill streaks and finite refresh, skip, and banish resources.
- Minimap, over-character health, loadout, Ultimate meter, and connected realm map.
- Six once-per-run shrine blessings and a Phantom Ganon victory condition.

## Boundaries

These are compact connected arenas, not complete original Zelda maps. Balance values are original. Collection/capture, a permanent upgrade shop, multiplayer, accounts, an exhaustive roster, and complete platforming terrain are not implemented. Public reference images do not establish current live damage or timing formulas.

## Stack and Delivery

Static HTML/CSS/JavaScript with vendored Three.js. No build step, account, backend, runtime network requests, or environment variables. Confirmed repository: https://github.com/Adonissimo/zelabonk- . Production: https://zelabonk.vercel.app . Commit and push after meaningful checks; verify Vercel separately.

## Principles

- Preserve run progress across gates.
- Freeze simulation during menus, upgrades, and focus loss.
- Keep the character, combat feedback, charge, and choices readable.
- Retain keyboard, mouse, native button semantics, and touch support.
- Separate reference observations from unverified behavior.
