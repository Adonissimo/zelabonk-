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
typography:
  display:
    fontFamily: "Lilita, Georgia, serif"
    fontSize: "90px"
    fontWeight: 800
    lineHeight: 0.84
    letterSpacing: "2px"
  headline:
    fontFamily: "Lilita, Georgia, serif"
    fontSize: "26px"
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
    height: "112px"
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
---

# Design System: ZeldaBonk

## Overview

**Creative North Star: "The Hyrule Survivor Arcade"**

ZeldaBonk combines recognizable Legend of Zelda fan depictions with the inspected PokéBonk survivor presentation. Link, Zelda, and Midna appear as outlined pixel billboards in a textured Three.js world. Crisp foliage, stone rims, and three-dimensional landmarks support the compact arenas. The actual Zelda identity replaces the earlier invented-world direction.

Light porcelain panels and indigo text keep combat facts clear; dark navy actions and announcements remain visible over scenery. Gold marks primary actions and Ultimate charge. Lilita gives the interface an arcade voice, while heavy Nunito supports small labels. This named metaphor describes the implementation; code and verified renders are the visual authority, with no separately approved comp.

**Key Characteristics:**

- Independently drawn directional pixel characters and foliage inhabit textured 3D space.
- Porcelain status panels contrast with dark action hints and announcements.
- Character identity, minimap, health, weapon ranks, and Ultimate charge stay visible during combat.
- White upgrade cards use colored headers and finite refresh, skip, and banish actions.

## Colors

The final ZeldaBonk CSS override owns the current interface palette. Frontmatter records reused values; synthesized eight-step OKLCH ramps in the sidecar are panel previews, not new production tokens.

### Primary

- **Adventure Gold**: primary actions and identity accents; **Ultimate Gold** independently represents stored charge.
- **Action Ink**: the primary button retains its existing dark green text value.

### Secondary

- **Midnight Indigo**: core text, dark actions, and announcements. Light HUD panels use the dedicated dark HUD text.
- **Choice Blue, Sand, and Green**: three positional upgrade headers. These colors distinguish the displayed choices, not weapon rarity.
- **Focus Mint**: the inherited visible keyboard-focus ring.

### Tertiary

- **Health Leaf**, **Stamina Blue**, and **Experience Leaf**: distinct persistent meter meanings.
- **Banish Rose**: the destructive run-choice resource; banish mode also outlines the cards.

### Neutral

- **Paper**, **Cream**, and **HUD Porcelain**: dialog surfaces, light text, and near-opaque status panels.
- **Choice White** and **Choice Hover**: card body and hover feedback.

**The Two Materials Rule.** Use light porcelain for readable status and choice surfaces, and dark indigo backing for action hints and scene announcements.

World palettes live in the realm definitions and procedural art. Preserve six distinct arena identities without treating every terrain texel as an interface token.

## Typography

Keep self-hosted Lilita for the title, character names, timer, upgrade titles, and upgrade heading. Keep self-hosted Nunito for controls, counts, descriptions, and keyboard hints. Georgia remains the established face for other dialog headings and realm announcements.

Frontmatter records desktop roles. The ZELDA title line uses the display role; BONK is larger at 112px with 4px tracking. The final width and short-height overrides reduce both lines. Upgrade titles are 24px on desktop and 21px on mobile; upgrade headings reduce from 38px to 28px. Do not infer a new modular type scale from these observed values.

## Layout

A fixed canvas fills the viewport. The menu occupies a narrow left column, leaving a wide world preview. During play, character identity and health sit upper left, timing upper center, and the circular minimap upper right. Weapon slots and the charged Ultimate sit below. Utility controls move to the lower right during play.

Width breakpoints are 800px, 560px, and a final narrow-screen adjustment at 379px. At mobile width, the identity panel is 126px wide, timer panel 109px, and minimap 91px; desktop minimap is 156px. At widths up to 379px, the profile, timer, and minimap reduce to 102px, 90px, and 78px; the joystick reduces to 96px. Upgrade choices switch from three columns to a single column. Dialogs retain bounded internal scrolling. The last short-height override compacts title and hero choices below 700px.

Touch controls reserve the lower corners for movement, glide, and dash. Mobile loadout moves above them; Ultimate sits near the lower center. Pointer capability controls keyboard-hint visibility. Dragging the arena orbits the camera; the wheel changes zoom; movement follows camera orientation.

## Elevation & Depth

The main depth language comes from pixel billboards placed in textured 3D terrain, raised stone rims, landmarks, perspective, fog, and cast shadows. Hero art uses four facing directions and two walk frames on a 48-by-64 canvas. Nearest filtering and disabled mipmaps preserve crisp source pixels. Terrain tiles use repeated procedural textures.

The interface uses soft structural shadows beneath porcelain panels, weapon slots, buttons, and dialogs. The minimap has a circular silhouette and drop shadow. Keep dark backed announcements distinct from these pale surfaces. Buttons depress by 2px; upgrade cards lift by 3px on hover. Reduced-motion handling disables CSS transitions and camera shake, while the world continues rendering.

## Shapes

Rounded porcelain panels, pill-shaped upgrade-resource controls, circular minimap and Ultimate, and compact rounded weapon slots define the UI. The floating health track follows the character. Pixel actors retain hard texel edges rather than smooth vector or low-poly character replacements.

The authored line SVG icons retain their 24-unit viewBox, 1.8 stroke, and rounded caps and joins. Use the existing icon family for weapons and interface actions; preserve independently drawn sprite portraits for the playable characters.

## Components

### Actions and hero choices

Gold primary actions retain their arrow, heavy Nunito label, and desktop minimum height of 54px. Secondary actions use the current ink token. Text actions and visible focus retain their inherited treatments. Playing utility buttons use dark indigo backing. The three native hero-choice buttons show pixel portraits, Lilita names, role labels, and a parchment selected state with `aria-pressed`.

### Upgrade choices

White cards carry blue, sand, and green icon headers by position. Each full-card button retains its shortcut, category, item name, description, and rank. Master Sword, Din's Fire, and Light Arrows belong to the actual Zelda theme. Evolution retains its implemented state treatment. Mobile cards use compact icon tiles and horizontal content.

Refresh, Skip, and Banish use separate pastel pills, resource counts, and disabled states. Banish mode outlines choice cards and changes the instruction. Keep these actions finite and preserve their run-state effects.

### Gameplay HUD

Porcelain identity and timer panels use indigo text. The circular minimap shows nearby threats, gates, and the shrine. A floating health bar follows the hero. Light weapon slots show names, icons, and ranks; evolved slots become gold-tinted. Streak feedback uses outlined light display text.

The Ultimate is a real charge ring, not decoration: stroke offset tracks energy, the button remains unavailable until charged, and ready state changes its surface and ring. Link, Midna, and Zelda receive Great Spin, Fused Shadow, and Triforce Light labels. Keep the accessible charge label and visible readiness state synchronized.

### Dialogs and realm navigation

Native dialogs pause simulation, keep focus handling, and preserve Space and Enter activation. Required upgrade and result choices cannot be dismissed with Escape. The realm map uses six named circular nodes with dashed connections, current-state outline, and text status. Menu nodes preview arenas; in-run travel occurs through world gates using E or the touch Activate action.

The connected arenas represent Hyrule Field, the Great Sea, the Twilight Realm, Skyloft, the Depths, and Termina Field. Landmark depictions include the Great Deku Tree, a red sailing boat, a winged goddess statue, gloom fissures, a clock tower, and an expressive moon. They are compact arena interpretations, not complete canonical maps.

## Do's and Don'ts

### Do:

- **Do** preserve the actual Zelda theme and recognizable Link, Zelda, and Midna fan depictions.
- **Do** retain crisp directional sprites, textured ground, sprite foliage, and three-dimensional landmarks.
- **Do** keep porcelain status panels separate from dark backed actions and announcements.
- **Do** connect charge, rank, resource, selection, and disabled visuals to real run state.
- **Do** preserve native control semantics, visible focus, paused dialogs, and mobile control space.

### Don't:

- **Don't** describe the current game as merely Zelda-inspired or replace its theme with invented names.
- **Don't** replace pixel actors with solid-color primitive character models or blur their texels.
- **Don't** imply complete Zelda maps, complete PokéBonk parity, or verified reference balance formulas.
- **Don't** bundle extracted Nintendo or PokéBonk assets; the implementation uses independently drawn fan artwork.
- **Don't** treat Ultimate charge, finite upgrade resources, or target-lock feedback as decorative controls.
