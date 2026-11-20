---
name: Relic Wilds
description: A parchment-and-spruce interface over a living, low-poly fantasy world.
colors:
  ink: "#233e36"
  cream: "#fff5d8"
  paper: "#f4efd9"
  gold: "#e6c779"
  gold-hover: "#f1d797"
  action-ink: "#263d32"
  hud-backing: "#1b3e35ed"
  focus-mint: "#75e1cf"
  choice-paper: "#e9ead5"
  choice-hover: "#dfe7cd"
  choice-border: "#b9c4a7"
  choice-copy: "#536852"
  spruce-hover: "#426c56"
  health-coral: "#ed8972"
  stamina-leaf: "#a8e092"
  experience-mint: "#aee8bc"
  evolved-mint: "#a4eada"
typography:
  display:
    fontFamily: "Lilita, Georgia, serif"
    fontSize: "91px"
    fontWeight: 800
    lineHeight: 0.84
    letterSpacing: "5px"
  headline:
    fontFamily: "Lilita, Georgia, serif"
    fontSize: "26px"
    fontWeight: 400
    letterSpacing: "0.1px"
  title:
    fontFamily: "Lilita, Georgia, serif"
    fontSize: "23px"
    fontWeight: 400
  dialog:
    fontFamily: "Georgia, serif"
    fontSize: "32px"
    fontWeight: 400
    letterSpacing: "-0.7px"
  body:
    fontFamily: "Nunito, 'Trebuchet MS', sans-serif"
    fontSize: "14px"
    fontWeight: 800
  introduction:
    fontFamily: "Nunito, 'Trebuchet MS', sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.65
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
  card: "9px"
  choice: "10px"
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
  button-secondary-hover:
    backgroundColor: "{colors.spruce-hover}"
  button-text:
    textColor: "#4e6b57"
    padding: "5px 8px"
  button-icon:
    backgroundColor: "#21423c80"
    textColor: "{colors.cream}"
    rounded: "{rounded.round}"
    width: "38px"
    height: "38px"
  hero-choice:
    backgroundColor: "#1b423b70"
    textColor: "{colors.cream}"
    rounded: "{rounded.choice}"
    width: "106px"
    height: "80px"
  hero-choice-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  upgrade-choice:
    backgroundColor: "{colors.choice-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px 17px"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    padding: "{spacing.dialog-inset}"
  hud-panel:
    backgroundColor: "{colors.hud-backing}"
    textColor: "{colors.cream}"
    rounded: "{rounded.card}"
    padding: "11px 14px"
  map-action:
    backgroundColor: "#1b403baa"
    textColor: "{colors.cream}"
    rounded: "{rounded.small}"
    padding: "9px 11px"
---

# Design System: Relic Wilds

## Overview

**Creative North Star: "The Wanderer's Field Guide"**

Relic Wilds puts a warm, readable field-guide interface over a full-screen, explorable fantasy world. Parchment choices, aged gold actions, and deep spruce status panels sit beside original low-poly adventurers and cel-shaded landmarks. This metaphor describes the finished implementation; it is an implementation assumption, not a separately approved comp.

The scene provides atmosphere and depth. Interface ornament stays small: a relic diamond, thin rules, rounded line icons, and compact labels. Six connected original realms express forest, sea, twilight, sky, volcanic, and moon/time settings through distinct geometry, lighting, fog, and landmarks. The visual authority is the running code and its verified desktop and mobile renders.

**Key Characteristics:**

- A real Three.js world fills the viewport behind the interface.
- Gold actions and parchment selections remain distinct from spruce status surfaces.
- Friendly display lettering pairs with sturdy, compact control text.
- Native dialogs and visible keyboard focus preserve clear interaction states.

## Colors

The palette combines aged gold, warm parchment, deep spruce, and restrained mint and coral signals. Frontmatter owns exact reusable values; the sidecar adds previews and metadata. Its eight-step OKLCH ramps are synthesized panel previews, not additional production tokens.

### Primary

- **Aged Gold** (`gold`, `gold-hover`): start, resume, retry, relic accents, and selected importance.
- **Action Spruce** (`action-ink`): strong text on gold actions.

### Secondary

- **Deep Spruce** (`ink`, `spruce-hover`, `hud-backing`): parchment text, secondary actions, and dark status backing.
- **Focus Mint** (`focus-mint`): visible keyboard focus. Experience and evolved-weapon mint remain separate semantic signals.

### Tertiary

- **Health Coral** (`health-coral`): health fill. Stamina uses leaf green; experience uses mint. Keep these meanings stable.

### Neutral

- **Warm Cream** (`cream`): text over dark controls and status panels.
- **Field Parchment** (`paper`): dialogs and selected wanderers.
- **Choice Parchment** (`choice-paper`, `choice-hover`, `choice-border`, `choice-copy`): upgrade surfaces, borders, and explanatory copy.

**The Backed Status Rule.** Place persistent gameplay text and realm announcements on the implemented dark backing. Text shadow alone is insufficient over changing terrain.

Realm-specific sky, ground, fog, and accent values belong to the world definitions in `core.js`. Preserve their distinct identities rather than extending the interface palette into every mesh.

## Typography

Lilita is the self-hosted display face; Nunito is the self-hosted interface face. The files are `assets/lilita-one.ttf` and `assets/nunito-extra-bold.ttf`. Keep Georgia for the quieter dialog headings and realm announcements already using it.

The frontmatter records desktop roles. The two-line title pairs a large RELIC with a larger WILDS; its sizes step down across width and height breakpoints. Menu headlines use Lilita; upgrade titles use the smaller title role. Nunito remains heavy enough for compact buttons, counts, and instructions. Letter-spaced uppercase labels mark categories rather than paragraphs.

**The Two Voices Rule.** Use Lilita for playful identity and upgrade names, Nunito for controls and facts, and Georgia for the established ceremonial headings.

## Layout

This is an experience, with a fixed full-viewport canvas and overlay controls. The desktop menu occupies a narrow left column with open scenery to its right. The topbar and footer frame the world. During play, health sits upper left, time and objective upper center, map and shrines upper right, and loadout and control hints below.

Width breakpoints are 800px and 560px. Short-window adjustments apply at heights of 700px on wider screens and 640px on narrow screens. Below 560px, the menu uses 24px side margins, upgrade choices form one column, map nodes compact, and dialogs stay within the viewport with internal scrolling. Preserve the final HUD overrides: health panels are 218px wide on desktop, 178px at the intermediate width, and 124px on mobile.

Coarse pointers receive a joystick and separate jump/glide and dash controls. Loadout and interaction prompts move above that control zone. These changes follow pointer capability as well as viewport width. Spacing tokens describe repeated observed measurements, not a newly imposed scale.

## Elevation & Depth

The world carries physical depth through perspective, toon materials, low-sided geometry, soft directional shadows, atmospheric fog, and elevated islands or landmarks. The interface uses restrained structural depth: an ambient dialog shadow, a small primary-action shadow, and dark translucent backing. The menu vignette makes text readable and fades during play.

The sidecar records exact shadow and transition values. Controls depress by 2px on activation; upgrade cards lift by 3px on hover. Honor reduced motion: CSS transitions and animations stop, while camera shake and floating damage numbers are suppressed. Continuous world rendering remains active.

## Shapes

Soft rectangular controls and parchment panels contrast with faceted world geometry. Small keycaps, compact buttons, choice cards, and dialogs use distinct observed radius steps from frontmatter. Utility buttons, map orbs, and touch controls are circles. Borders remain thin; focus rings sit clearly outside controls.

The authored SVG icon family uses a 24-unit viewBox, rounded caps and joins, a 1.8 stroke, and mostly unfilled paths. Keep icons consistent with the relic, sword, shield, map, and realm motifs already present.

## Components

### Buttons

Gold primary actions use strong spruce text, an arrow at the trailing edge, and a desktop minimum height of 54px. Secondary actions use spruce and cream. Text actions are quiet and underlined. Circular utility buttons use translucent spruce, visible borders, accessible names, and a compact icon. Preserve hover, visible focus, pressed, and disabled treatments.

### Wanderer choices

Three native buttons act as a single visual choice group. The selected button changes to parchment with dark text and reports `aria-pressed`. Each choice keeps its icon, name, role, and separate perk line. Do not use color as the only indication of selection.

### Upgrade cards

Three parchment action cards form the desktop choice row. Each card includes an icon, keyboard shortcut, category, Lilita title, description, and rank. Evolution has its own green-tinted surface. On narrow screens, keep the full card clickable while arranging its contents horizontally in a single-column list.

### Dialogs

Native `dialog` surfaces pause the simulation and use parchment, centered serif headings, a dark backdrop, and bounded internal scrolling. Map, help, pause, upgrade, and result surfaces share this language. Preserve native Space and Enter activation. Escape resumes pause, closes auxiliary dialogs through their owning flow, and cannot dismiss mandatory upgrade or result choices.

### Realm navigation

The map uses six colored circular nodes and dashed connections. The current realm has an extra spruce outline and a text status. Menu nodes preview worlds; during a run, travel occurs at world gates. Keep this distinction visible in the map's instructions.

### Gameplay status and touch controls

Persistent health, timer, shrine, control-hint, and boss text use dark backing. Health and stamina remain separate tracks; experience spans the top edge; loadout slots show weapon ranks and evolved state. Transient messages and realm announcements share the same readable material. Touch controls use large circular hit areas and separate movement from actions.

## Do's and Don'ts

### Do:

- **Do** use the running implementation as visual authority; there is no separately approved comp.
- **Do** keep gameplay facts readable on dark backing across all six realms.
- **Do** retain self-hosted type, authored SVG icons, and original characters and geometry.
- **Do** preserve native button activation, visible focus, dialog pause behavior, and touch control space.
- **Do** keep the compact six-realm scope accurate in descriptions and visual extensions.

### Don't:

- **Don't** replace the playable scene with a decorative hero image or a dashboard shell.
- **Don't** place persistent gameplay labels directly over terrain using only text shadow.
- **Don't** substitute franchise characters, logos, or canonical locations for the original world.
- **Don't** imply every location from the inspiration franchises is represented.
- **Don't** let global gameplay shortcuts consume Space or Enter on focused native controls.
