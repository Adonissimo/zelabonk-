---
name: "ZeldaBonk"
description: "Porcelain survivor-game controls over a textured 3D Zelda world with crisp pixel billboards."
colors:
  ink: "#29283e"
  paper: "#fffdf8"
  cream: "#fffdf4"
  gold: "#edca76"
  gold-hover: "#f1d797"
  action-ink: "#263d32"
  hud-porcelain: "#fffcf4f5"
  hud-ink: "#2c2a42"
  navy-action: "#302e48ed"
  indigo-announcement: "#34324deb"
  focus-mint: "#75e1cf"
  choice-white: "#fff"
  choice-hover: "#fbf8eb"
  header-blue: "#b8d1e5"
  header-sand: "#ded8b8"
  header-green: "#c4dfbe"
  health-leaf: "#82b976"
  stamina-blue: "#6db5c9"
  experience-leaf: "#aad76f"
  ultimate-gold: "#edd174"
  banish-rose: "#f4d9d5"
  form-accent: "#648e80"
  form-focus: "#397668"
  form-border: "#b7b4c3"
  row-divider: "#dedbe2"
  control-surface: "#ecebf0"
  stage-surface: "#eeedf0"
  stage-current: "#e9efdf"
  stage-active: "#3b5066"
  stage-complete: "#547f67"
typography:
  display:
    fontFamily: "Lilita, Georgia, serif"
    fontSize: "64px"
    fontWeight: 800
    lineHeight: 0.84
    letterSpacing: "2px"
  headline:
    fontFamily: "Lilita, Georgia, serif"
    fontSize: "24px"
    fontWeight: 400
    letterSpacing: "0.1px"
  title:
    fontFamily: "Lilita, Georgia, serif"
    fontSize: "24px"
    fontWeight: 400
  upgrade-heading:
    fontFamily: "Lilita, Georgia, serif"
    fontSize: "38px"
    fontWeight: 400
    letterSpacing: "-0.7px"
  dialog:
    fontFamily: "Georgia, serif"
    fontSize: "32px"
    fontWeight: 400
    letterSpacing: "-0.7px"
  body:
    fontFamily: "Nunito, 'Trebuchet MS', sans-serif"
    fontSize: "14px"
    fontWeight: 800
  label:
    fontFamily: "Nunito, 'Trebuchet MS', sans-serif"
    fontSize: "10px"
    fontWeight: 800
    letterSpacing: "1.8px"
  action:
    fontFamily: "Nunito, 'Trebuchet MS', sans-serif"
    fontSize: "15px"
    fontWeight: 900
rounded:
  key: "4px"
  small: "7px"
  button: "8px"
  slot: "12px"
  panel: "15px"
  timer: "18px"
  pill: "20px"
  dialog: "14px"
  round: "50%"
spacing:
  tight: "5px"
  control: "8px"
  option-gap: "9px"
  inset: "14px"
  action-inline: "22px"
  mobile-edge: "24px"
  dialog-inset: "38px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.action-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.button}"
    padding: "14px 22px"
  button-primary-hover:
    backgroundColor: "{colors.gold-hover}"
  button-secondary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.small}"
    padding: "11px 20px"
  button-text:
    textColor: "#4e6b57"
    padding: "5px 8px"
  button-icon-playing:
    backgroundColor: "#292c46df"
    textColor: "{colors.cream}"
    rounded: "{rounded.round}"
    width: "38px"
    height: "38px"
  hero-choice:
    backgroundColor: "#243c49c9"
    textColor: "{colors.cream}"
    rounded: "10px"
    width: "106px"
    height: "83px"
  hero-choice-selected:
    backgroundColor: "#fffaf0"
    textColor: "#2f3549"
  upgrade-choice:
    backgroundColor: "{colors.choice-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "86px 17px 20px"
  upgrade-refresh:
    backgroundColor: "#dceaf4"
    textColor: "#3c5470"
    rounded: "{rounded.pill}"
    padding: "9px 15px"
  upgrade-skip:
    backgroundColor: "#e9e6dc"
    textColor: "#5f5b54"
  upgrade-banish:
    backgroundColor: "{colors.banish-rose}"
    textColor: "#894d4d"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    padding: "{spacing.dialog-inset}"
  hud-panel:
    backgroundColor: "{colors.hud-porcelain}"
    textColor: "{colors.hud-ink}"
    rounded: "{rounded.panel}"
    padding: "12px 15px"
  map-action:
    backgroundColor: "#fffaf0f5"
    textColor: "#34334c"
    rounded: "{rounded.small}"
    padding: "9px 11px"
  ultimate-button:
    backgroundColor: "#34334ce8"
    textColor: "#fffaf0"
    rounded: "{rounded.round}"
    width: "79px"
    height: "79px"
  weapon-slot:
    backgroundColor: "#fafaffef"
    textColor: "#393953"
    rounded: "{rounded.slot}"
    width: "68px"
    height: "74px"
  button-start-menu:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.button}"
    padding: "11px 17px"
  settings-select:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.small}"
    padding: "7px 27px 7px 10px"
  binding-button:
    backgroundColor: "{colors.control-surface}"
    textColor: "#47425b"
    rounded: "{rounded.button}"
    padding: "9px 12px"
  binding-button-capturing:
    backgroundColor: "#e4eddf"
  roster-card:
    backgroundColor: "#eeeff3"
    textColor: "#393953"
    rounded: "{rounded.slot}"
    padding: "15px 10px"
  roster-card-selected:
    backgroundColor: "#edf2df"
  roster-card-locked:
    backgroundColor: "#e8e6e9"
    textColor: "#686477"
  stage-card:
    backgroundColor: "{colors.stage-surface}"
    textColor: "#39354e"
    rounded: "{rounded.slot}"
    padding: "13px 7px"
  stage-card-current:
    backgroundColor: "{colors.stage-current}"
  stage-level-active:
    backgroundColor: "{colors.stage-active}"
    textColor: "#fff8df"
    rounded: "{rounded.key}"
    padding: "4px 5px"
  stage-level-complete:
    backgroundColor: "{colors.stage-complete}"
    textColor: "#fff8df"
---

# Design System: ZeldaBonk

## Overview

**Creative North Star: "The Hyrule Survivor Arcade"**

ZeldaBonk combines recognizable Legend of Zelda fan depictions with the inspected PokéBonk survivor presentation. Six playable heroes—Link, Zelda, Midna, Tetra, Sheik, and Skull Kid—appear as outlined pixel billboards in textured Three.js arenas. Eight connected maps contain 24 Adventure stages, local enemy species, eight guardians, and final Ganondorf. Survival retains its separate Phantom Ganon encounter, bringing the implemented boss depictions to ten.

Light porcelain panels and indigo text keep combat facts clear; dark navy actions and announcements remain visible over scenery. Gold marks primary actions and Ultimate charge. Lilita gives the interface an arcade voice, while heavy Nunito supports small labels. The established implementation extends this world into the roster, shop, journal, inventory, settings, and save dialogs. Explicit Zelda/PokéBonk direction and implemented renders are the visual authority; there is no separately approved comp or card.

**Key Characteristics:**

- Independently drawn, cached directional pixel actors and foliage inhabit textured 3D space.
- Porcelain status and progression surfaces contrast with dark action hints and announcements.
- Character identity, stage progress, minimap, health, weapon ranks, and Ultimate charge stay readable during combat.
- White upgrade cards use colored headers and finite refresh, skip, and banish actions.
- Settings, roster, journal, and save flows extend the same native-dialog system.

## Colors

The final ZeldaBonk CSS layers own the interface palette. Frontmatter records reused values; synthesized eight-step OKLCH ramps in the sidecar are panel previews, not new production tokens.

### Primary

- **Adventure Gold**: primary actions and identity accents. **Ultimate Gold** independently represents stored charge.
- **Action Ink**: the primary button retains its established dark green text.

### Secondary

- **Midnight Indigo**: core text, dark actions, and announcements. Porcelain HUD surfaces use dedicated dark text.
- **Choice Blue, Sand, and Green**: positional upgrade headers, not weapon rarity.
- **Focus Mint**: button and link focus. Native fields use **Form Focus** and **Form Accent** from the extended settings system.
- **Stage Active** and **Stage Complete**: dark blue current-level chips and green finished-level chips, paired with stage numbers and status text.

### Tertiary

- **Health Leaf**, **Stamina Blue**, and **Experience Leaf**: stable meter meanings.
- **Banish Rose**: the destructive run-choice resource; banish mode also outlines cards.

### Neutral

- **Paper**, **Cream**, and **HUD Porcelain**: dialogs, light text, and near-opaque status surfaces.
- **Choice White**, **Control Surface**, and **Stage Surface**: choice bodies, key bindings, and map cards.
- **Form Border** and **Row Divider**: restrained separation in settings, journal, inventory, and shop rows.

**The Two Materials Rule.** Use light porcelain for readable status and choice surfaces, and dark indigo backing for action hints and scene announcements.

World palettes stay in realm definitions and procedural art. Preserve all eight map identities without treating each terrain texel as an interface token.

## Typography

Keep self-hosted Lilita for identity, character and item names, timer, map labels, and settings section titles. Keep self-hosted Nunito for controls, counts, descriptions, and keyboard hints. Georgia remains the established face for most native-dialog headings and realm announcements; upgrade headings use Lilita.

Frontmatter records current desktop menu roles. ZELDA uses 64px and BONK 80px. The menu headline is 24px. Below 560px, title lines reduce to 51px and 64px; below 680px height, they reduce to 42px and 53px. Upgrade titles and headings retain their separate established sizes. Do not replace observed roles with a new modular scale.

## Layout

A fixed canvas fills the viewport. The scrollable left menu includes Adventure/Survival, difficulty, three quick hero choices, continue/new-run actions, and progression navigation. The full roster contains six heroes. The menu remains bounded by viewport height instead of displacing the world preview.

Each playable map spans 128 by 128 units. Adventure progresses through three numbered stages per map. Preserve location-specific terrain, landmarks, enemy pools, guardian encounters, and stage status when extending the world.

During play, identity and health sit upper left, timing upper center, and the circular minimap upper right. Weapon slots sit below; Ultimate position follows weapon count on wider screens. Width adjustments occur at 800px, 560px, and 379px. Below 560px, six weapon slots fit a three-column grid above touch controls. The narrow HUD keeps the established 102px profile, 90px timer, and 78px minimap at widths up to 379px.

The eight-map stage grid uses four columns on desktop and two below 560px. The six-hero roster uses three columns, then two. Native dialogs scroll internally. Settings range controls shrink from 135px to 100px on mobile; binding buttons retain a two-column grid, minimum 44px height, and compact keycaps. Shop purchase controls move below their descriptions; journal navigation wraps. The final short-height menu adjustment applies below 680px.

Mouse movement looks around without holding a button. Optional cursor capture starts with an arena click; Escape releases capture and pauses. Touch uses an arena swipe, separate from the movement stick. Wheel zoom, sensitivity, inverted Y, field of view, and camera distance remain player controls.

## Elevation & Depth

Pixel billboards sit in textured 3D terrain with raised stone rims, landmarks, perspective, fog, and cast shadows. Original hero art uses a 64-by-80 canvas and four facing directions. Cached canvas, texture, and material variants include actor identity, action, direction, frame, and hit state. Nearest filtering and disabled mipmaps preserve crisp pixels.

Animations include idle, walk, attack, cast, Ultimate, hurt, jump, glide, dash, spawn, wind-up, defeat, and victory. Walking now uses eight frames rather than the former two-frame loop. Boss depictions, local species, phase changes, and telegraphed attacks retain their specific poses and effects. Frame counts and rates belong to the animation table, recorded in sidecar metadata.

Soft structural shadows separate porcelain panels, slots, choices, and dialogs. Buttons depress by 2px; upgrade cards lift by 3px on hover. Dialogs arrive through the implemented brief scale-and-opacity animation. Low/Balanced/High graphics tune rendering quality rather than changing interface identity. System or explicit reduced motion stops CSS transitions and animation and suppresses camera shake, floating damage text, and selected scene effects; world rendering remains active.

## Shapes

Rounded porcelain panels, pill-shaped resource controls, circular minimap and Ultimate, and compact weapon slots remain the core shapes. Roster and stage cards extend the rounded rectangular family. A selected stage or hero uses an inset outline and a surface change; locked heroes retain text explanations and muted portraits.

The authored SVG family keeps its 24-unit viewBox, 1.8 stroke, and rounded caps and joins. Independently drawn pixel portraits remain the identity art. Native checkboxes, sliders, and selects retain browser semantics, the shared accent color, and distinct visible focus.

## Components

### Actions, modes, and hero selection

Gold primary actions retain their arrow and heavy Nunito label. The menu uses a denser 48px minimum height, reducing to 43px on mobile. Other primary actions retain their base sizing. Continue receives priority when a safe checkpoint exists; a new run becomes the secondary light action. Adventure/Survival uses a segmented native-button group, paired with Normal/Hard difficulty.

Three quick hero buttons show pixel portraits and selection state. The full roster shows six hero cards, origins, loadouts, Ultimates, and unlock requirements. Selected cards use the green outline and tint; locked cards use muted surfaces and portraits with explicit locked text. Preserve the distinction between the quick row and the full roster.

### Upgrade choices and combat HUD

White cards retain blue, sand, and green headers by position, keyboard shortcuts, category, title, description, rank, and evolution state. Refresh, Skip, and Banish retain their pastel pills, finite counts, and disabled states. Banish mode outlines the cards and changes the instruction.

Porcelain identity and timer panels pair with the circular minimap, following health bar, evolved weapon slots, streak feedback, stage objective, and checkpoint status. Six charged hero Ultimates use the actual hero name and charge state. Ring offset follows energy; activation is unavailable below full charge. Keep accessible charge labels synchronized with the visible ring and readiness treatment.

### Stage navigation

Eight rounded map cards replace the earlier circular-node diagram. Each card shows a map icon, location name, status, and three numbered stage chips. Current-map outline, active-stage color, completed-stage color, and text provide separate cues. Menu cards preview maps; in-run travel happens at gates through the bound Interact key or touch Activate action. Boss travel restrictions appear in instructions.

The maps are Kokiri Forest, Lake Hylia, Hyrule Field, the Great Sea, the Twilight Realm, Skyloft, the Depths, and Termina Field. They remain authored arena interpretations, not complete canonical Zelda maps.

### Settings and key binding

Native settings rows pair clear labels with sound, volume, system/manual motion, graphics quality, mouse mode, sensitivity, inverted Y, field of view, and camera distance. Numeric outputs remain adjacent to sliders. Fields use the form focus ring; key-binding buttons show action and keycap. Capturing a new key uses a green outline, surface change, and status text. Duplicate bindings are rejected; reset actions restore camera and keys.

### Profile, shop, journal, and save dialogs

The Great Fairy shop uses stacked item rows with icon, upgrade description, rank/cost, and a real purchase button. The journal groups heroes, bosses, equipment, local enemies, and achievements through wrapping section buttons and readable rows. Inventory uses the same surface, row, and item typography.

Continue/checkpoint status, new-run replacement, import confirmation, and export use the shared native-dialog language. Keep save availability, backup/import feedback, locked content, purchase limits, and disabled states tied to actual profile data. Nested map, inventory, and settings dialogs preserve their parent's pause state and focus. Required upgrade and result choices remain non-dismissible with Escape; native Space/Enter activation still works.

## Do's and Don'ts

### Do:

- **Do** preserve the actual Zelda theme and all six recognizable hero fan depictions.
- **Do** retain crisp cached sprites, action and phase animation, local enemy species, textured ground, and three-dimensional landmarks.
- **Do** keep porcelain status and progression surfaces separate from dark backed actions and announcements.
- **Do** bind stage, charge, rank, resource, unlock, checkpoint, and disabled visuals to actual run or profile state.
- **Do** preserve native controls, visible focus, nested-dialog pause behavior, and mobile control space.

### Don't:

- **Don't** replace the Zelda theme with invented names or blur the independently drawn pixel art.
- **Don't** describe the expanded game as six maps, three total heroes, two-frame walking, or drag-only mouse look.
- **Don't** imply complete Zelda maps, complete PokéBonk parity, or verified reference balance formulas.
- **Don't** bundle extracted Nintendo or PokéBonk assets; artwork and animation are independently authored.
- **Don't** present stage chips, Ultimate charge, unlocks, purchases, saves, or rebinding as decorative controls.
