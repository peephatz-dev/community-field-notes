---
name: SALA HUM POWERGUARD
description: Rounded Thai community operations around a shared simulated coastal scene.
colors:
  brand-yellow: "#F8C642"
  brand-orange: "#FF7A3C"
  brand-blue: "#2F7DD3"
  brand-sky: "#5EC6E8"
  brand-navy: "#1F2D5A"
  brand-green: "#26B99A"
  brand-red: "#EF5A5A"
  white: "#FFFFFF"
  soft: "#E9F7FC"
  brand-ink: "#16294B"
  page: "#F6FBFF"
  muted: "#657A91"
  line: "#D9E7F2"
  action: "#2468B5"
  link: "#2165AC"
  secondary: "#EDF5FF"
  selected: "#E1EEFF"
  selected-ink: "#185FAC"
  success-ink: "#13775F"
  success-soft: "#E8F8F1"
  warning-ink: "#9B6600"
  warning-soft: "#FFF4CF"
  fault-ink: "#B8303C"
  fault-soft: "#FFF0F0"
  scene-ground: "#DCEEF1"
typography:
  headline:
    fontFamily: "Manrope Variable, IBM Plex Sans Thai, sans-serif"
    fontSize: "25px"
    fontWeight: 600
    lineHeight: 1.35
  title:
    fontFamily: "Manrope Variable, IBM Plex Sans Thai, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Manrope Variable, IBM Plex Sans Thai, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Manrope Variable, IBM Plex Sans Thai, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.65
  reading:
    fontFamily: "Manrope Variable, IBM Plex Sans Thai, sans-serif"
    fontSize: "23px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "14px"
  md: "22px"
  lg: "30px"
  button: "16px"
  card: "24px"
  scene: "26px"
spacing:
  step-4: "4px"
  step-8: "8px"
  step-10: "10px"
  step-12: "12px"
  step-14: "14px"
  step-16: "16px"
  step-18: "18px"
  step-20: "20px"
  step-24: "24px"
  step-30: "30px"
  step-32: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
    padding: "11px 18px"
  button-primary-hover:
    backgroundColor: "{colors.brand-navy}"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.button}"
    padding: "11px 18px"
  input-number:
    backgroundColor: "#F8FBFF"
    textColor: "{colors.brand-navy}"
    rounded: "11px"
    padding: "9px 10px"
  navigation:
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
  navigation-active:
    backgroundColor: "#E5F1FF"
    textColor: "{colors.link}"
  data-badge:
    backgroundColor: "{colors.warning-soft}"
    textColor: "#87611B"
    rounded: "10px"
    padding: "6px 11px"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.card}"
    padding: "24px"
  scene-marker:
    backgroundColor: "#FFFFFFF5"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.sm}"
    padding: "9px 10px"
  scene-marker-selected:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.white}"
  inspector:
    backgroundColor: "#FFFFFFF7"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.md}"
    padding: "18px"
    width: "274px"
  incident-timeline:
    backgroundColor: "#FFFFFFF7"
    textColor: "{colors.brand-navy}"
    rounded: "20px"
    padding: "14px 20px"
---
# Design System: SALA HUM POWERGUARD

## Overview

**Creative North Star: "The shared community work surface"**

The established light iOS-style community interface combines white and sky surfaces, navy Thai text, generous rounded corners and the original ปลากะพงสามน้ำ vector mascot. The exact PowerGuard brand palette remains the authority; technical scenes retain dark spatial controls when detail needs contrast.

The shared coastal scene lets people select proposed equipment and follow one simulated event through the inspector, charts and incident history. Audience modes change terminology and available actions while retaining the same underlying state. This is a browser-local demonstrator: telemetry, loads, positions, water and weather models remain visibly simulated or proposed.

**Key Characteristics:**
- Short Thai labels and explicit electrical status words.
- A shared scene with compact, legible operation surfaces.
- Original vector mascot, restrained ambient shadows and local fonts.
- Simulation and field-evidence boundaries remain visible.

## Colors

Warm yellow and orange identify the brand and events; blue leads interaction, sky supports the light canvas, and navy carries Thai text.

### Primary

- **PowerGuard Blue** (`brand-blue`): exact brand blue for icons, selected scene markers and active timeline steps. Primary buttons use the darker `action` derivative; text links use `link`.
- **PowerGuard Navy** (`brand-navy`): primary interface text, brand detail and dark spatial controls.

### Secondary

- **Signal Yellow, Orange and Sky** (`brand-yellow`, `brand-orange`, `brand-sky`): mascot/brand detail, selected-marker dots, load suspension and pale supporting surfaces.
- **Equipment Green and Incident Red** (`brand-green`, `brand-red`): brand status accents. Use `success-ink`, `warning-ink` and `fault-ink` with the corresponding soft backgrounds for text-bearing states.

### Neutral

- **Pale Page** (`page`), **White** (`white`), **Sky Soft** (`soft`): page, card and supporting surface layers.
- **Secondary Text** (`muted`) and **Panel Line** (`line`): supporting copy and thin panel boundaries. Metadata may be smaller than body copy but is not the model for new essential text.
- **Scene Ground** (`scene-ground`): canvas/loading fallback around coastal geometry. Water appearance is illustrative, independent of simulated water readings.

**The Status Has Words Rule.** Use explicit status words alongside color; distinguish electrical outage, telemetry offline and sensor fault.

**The Brand Is Exact Rule.** Preserve brand.json color values. Use the implemented darker derivatives for readable controls and status text.

## Typography

**Display and Body Font:** self-hosted `Manrope Variable`, then `IBM Plex Sans Thai`, then `sans-serif`. Root layout imports Manrope Variable and IBM Plex Sans Thai at 400, 500 and 600. Thai glyphs use the Thai fallback; do not adopt the unused Noto Sans Thai declaration from the token prelude as a font migration.

### Hierarchy

- **Headline:** overview 25px / 600 / 1.35, reduced to 22px on phones. Other page headings retain their existing 25–30px scale.
- **Title:** overview section heading 18px / 600; community card titles retain 20px and nested titles 16px.
- **Body:** inherited 15px / 400 / 1.65. Explanatory cards commonly use 13px; the inspector uses 12px.
- **Label:** compact 11px labels; keep short Thai phrasing. The smallest scene metadata is supporting detail rather than a reusable essential-text role.
- **Reading:** 23px / 600 / 1.4 in scene KPIs; 22px at the compact desktop layout, 20px at intermediate widths and 21px on phones. Units remain smaller and regular. Numerical readings use tabular figures where the existing metric components provide them.

**The One Shared State Rule.** Scene, inspector, charts, timeline and history describe the same simulator state. Audience mode changes presentation and actions.

## Layout

The app uses a 72px icon navigation rail, expanding to 232px on request. Each destination retains an accessible Thai name and a tooltip on pointer hover and keyboard focus. Below 900px the existing menu dialog and bottom navigation replace the rail. The top bar is 64px (60px on phones): location, original mascot logo, system condition, an explicit simulated-data label, bell and audience selector. Audio settings remain available in the footer.

The overview is map-first. Three compact KPI cards sit in normal document flow above the canvas. The scene owns its space and keeps one active WebGL canvas; the unified camera toolbar occupies its own bottom row. Four small selectable markers disclose names on hover/focus or selection. Equipment selection opens a 310px desktop inspector (280px at intermediate widths). A grid column reduces canvas width, and the camera focuses on the selected equipment and responds to canvas resize. The inspector starts closed. Escape or the close button restores focus and the overall view.

Phones use a 470px map workspace. Selecting equipment creates a 670px workspace with a 310px upper map/toolbar region and an independently scrollable lower inspector sheet. The sheet is in layout, never over the scene. Controls have 40–44px minimum dimensions and native select affordances. The main event bar starts collapsed; full sequence and event details open below it. A 52px mascot button opens its text and opt-in speech controls only on request.

Simulation controls are confined to the dedicated simulation route and existing guided engineering workflows. The everyday overview has only a link to the demo. Both routes use the same simulator, events, battery policy, alerts and mascot state. The full engineering simulation controls/exports remain under an advanced disclosure. Measurements and charts mount on demand. A single retained priority notice lives in a separate layout row above the KPIs on map routes; other routes preserve existing toast behavior. Dismissing or acknowledging a notice does not delete the retained history.

The brand palette and self-hosted Thai font are unchanged. Native forms, technical part identifiers, units and exported schema remain truthful. Thai UI labels cover controls, statuses, navigation, diagrams and scene settings. No live data or installed hardware is implied.

## Elevation & Depth

White panels use thin pale-blue borders and low-opacity navy shadows. Nearly opaque white surfaces keep the physical scene visible around them while remaining readable. The global header uses a 12px backdrop blur; the scene itself retains authored coastal geometry and bounded 3D quality settings.

### Shadow Vocabulary

- **Community card:** `0 5px 20px #1F2D5A05`.
- **Scene stage:** `0 9px 32px #1F2D5A0B`.
- **KPI:** `0 6px 16px #1F2D5A0E`.
- **Inspector:** `0 8px 26px #1F2D5A14`.
- **Equipment marker:** `0 3px 10px #1F2D5A20`.
- **Priority notice:** `0 8px 28px #1F2D5A1A`.

**The Depth Supports Operation Rule.** Soft shadows separate white operation surfaces from the physical scene; avoid using elevation to imply a measured or installed asset.

## Shapes

The inherited radius vocabulary is 14px, 22px and 30px. Current primary buttons resolve to 16px, community cards to 24px (21px on mobile), the scene to 26px (22px on mobile), and the inspector to 22px. KPI panels use 19px, reduced to 14px on phones. Markers retain 14px corners; small status chips use 8–10px. The mascot bubble preserves its distinctive asymmetric `22px 22px 22px 4px` silhouette. Use these established component shapes rather than forcing one radius onto every surface.

## Components

### Buttons and fields

Primary actions use `action` with white text, 11px 18px padding, 16px corners and a 44px minimum height. Hover shifts to navy. Secondary actions use pale blue, navy text and a pale boundary, with a stronger blue boundary on hover. Disabled controls use opacity .45. Global keyboard focus for buttons, links, selects and tabindex targets is a 2px blue outline with 4px offset. Numeric fields use pale white-blue fill, an 11px corner, thin line border and 9px 10px padding; validation remains the responsibility of the existing plan forms.

### Navigation and audience control

The rail uses 46px-high rounded items, muted default text and a pale-blue selected state with darker blue text. Mobile uses the established menu dialog and bottom navigation. The audience selector exposes ชาวบ้าน, ผู้ดูแล and วิศวกร. Community and operator views use equipment names; engineer mode adds P0–P3. Operator mode adds acknowledgement and a local history path; it does not imply assignment to a real authority.

### Cards and explicit data badges

Community cards are white, lightly bordered, softly lifted and padded 24px. The warm trial-data badge keeps `ข้อมูลทดลอง` visible. Status chips pair green, amber or red text with a soft matching background and words. Do not reuse the brand accent alone to communicate state.

### Shared coastal scene and inspector

Selectable scene markers have at least a 44px control height. A selected marker becomes brand blue with white text and a yellow dot; marker text identifies whether a point is proposed, powered, on backup or suspended. Equipment buttons below the scene expose the same selection with `aria-pressed`. The inspector presents proposed status, source, simulated load, telemetry availability and the latest local event, with a focus-camera action and device-details link. The 3D scene is dynamically loaded; the 2D plan shares the equipment model. Keep shoreline, road, housing, piers and cage relationships image-relative, with no survey claim.

### Incident sequence and notifications

The six steps show normal, sag, outage, backup, load suspension and recovery as derived incident history. Blue marks the active step and green marks visited steps; words and minutes carry meaning. Mobile permits horizontal scrolling of the 550px sequence. Closing a priority toast does not delete the underlying critical record. Acknowledgements and resolution notes persist locally and can be exported; notes are not sent to agencies.

### Mascot, motion and sound

Use the original vector files from `public/powerguard/mascot/` with happy, thinking, warning, critical and success expressions driven by simulation. The bubble remains available. Thai speech requires explicit opt-in, supplies speaking/stop controls and falls back to text. Bounded rain, waves, sparks and bubbles honor reduced motion and the VFX switch. Sound offers separate SFX, ambience and music controls, one active ambience plus music, mute and visibility pause. Reload never auto-enables audio. Existing synthesized ambience and the concept illustration remain labelled.

## Do's and Don'ts

### Do:
- Do preserve the exact brand palette and the Manrope Variable / IBM Plex Sans Thai source fonts.
- Do label values, proposed monitoring positions, demonstration loads and geometry according to their evidence.
- Do keep the scene selection and equipment inspector synchronized across all three audience modes.
- Do preserve a reachable 2D view, reduced motion behavior, opt-in audio and local export paths.
- Do retain critical records when a toast is closed or an event is acknowledged.

### Don't:
- Don't use physical water color to claim salinity, dissolved oxygen or measured depth.
- Don't present local notes as delivered to authorities or the demonstrator as connected hardware.
- Don't replace the authentic vector mascot with an invented fish or use the private composition reference as a site asset.
- Don't place a transient incident notice over the selected equipment inspector or mascot.
