---
name: Community Energy Resilience Platform
description: Cinematic Coastal Industrial Digital Twin
colors:
  background: "#08141f"
  navigation: "#0b1926"
  surface: "#102332"
  raised: "#152c3b"
  text: "#e5edf1"
  muted: "#a9bdc9"
  border: "#2b4658"
  accent: "#67dcc6"
  warning: "#eebd76"
  fault: "#f28b86"
typography:
  headline:
    fontFamily: "Manrope Variable, IBM Plex Sans Thai, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope Variable, IBM Plex Sans Thai, sans-serif"
    fontSize: "15px"
    lineHeight: 1.65
  support:
    fontFamily: "Manrope Variable, IBM Plex Sans Thai, sans-serif"
    fontSize: "13px"
  reading:
    fontFamily: "Manrope Variable, IBM Plex Sans Thai, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
    fontFeature: "tabular-nums"
rounded:
  panel: "14px"
  control: "8px"
spacing:
  step-4: "4px"
  step-8: "8px"
  step-12: "12px"
  step-16: "16px"
  step-24: "24px"
  step-32: "32px"
components:
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "24px"
  metric:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "19px 20px"
  button-primary:
    backgroundColor: "#204c4b"
    textColor: "#b1f0df"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  button-secondary:
    backgroundColor: "#152d3c"
    textColor: "#dceaf0"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  input-quality:
    backgroundColor: "#0c202de8"
    textColor: "#c9d9df"
    rounded: "7px"
    padding: "5px 9px"
  navigation:
    textColor: "#b0c2ce"
    rounded: "{rounded.control}"
    padding: "9px 12px"
    height: "44px"
  status-chip:
    backgroundColor: "#233e4f"
    textColor: "#c1d4df"
    rounded: "5px"
    padding: "5px 9px"
---
# Design System: Community Energy Resilience Platform

## Overview

**Creative North Star: "Cinematic Coastal Industrial Digital Twin"**

The digital twin is the signature view: opaque estuary water, weathered timber aquaculture infrastructure, warm natural sun, measured industrial hardware and overlays that expose the simulated system state. The dashboard uses quiet navy surfaces and precise typographic hierarchy so the scene and data remain primary.

**Key Characteristics:**

- A premium dark navy control center with marine teal operating cues.
- Authentic field references inform weathered coastal materials and aquaculture forms.
- Precise readings, readable Thai/Latin typography and restrained motion.
- Complete desktop and mobile access to the engineering demonstrator.

## Colors

The normative frontmatter retains the established deep water and industrial palette. Marine teal carries operating and selection cues; brass amber marks warnings; warm fault red marks critical states. The four navy surfaces provide hierarchy without decorative color competition.

### Primary

The `accent` token is marine teal for system operation, focus and active data series. Use it consistently across the scene overlays and monitoring charts.

### Secondary

The `warning` token is brass amber for reduced energy and caution. The `fault` token identifies fault states; labels must communicate their meaning alongside color.

### Neutral

`background`, `navigation`, `surface` and `raised` form the quiet control-center layers. `text`, `muted` and `border` establish reading hierarchy and panel boundaries.

## Typography

Manrope Variable serves Latin and numbers; IBM Plex Sans Thai supplies Thai glyphs. Both fonts are self-hosted. Frontmatter records the implemented route headline, body, support and numeric-reading roles. Readings use tabular numerals. Support copy also uses the existing compact 12 px scale where appropriate.

The original visual brief described a 17 px panel-title reference; the implemented common panel-title selectors currently use 16 px. This is an observed scale detail rather than a CSS change in this documentation pass. Route titles and numerical metrics reflow at narrow widths.

## Layout

Desktop uses quiet fixed-width navigation, one top command bar, a large village/circuit view and a slimmer equipment inspector. Dashboard charts share dark axes and tooltips. Documentation uses a comfortable reading measure. The existing spacing rhythm is preserved in frontmatter.

Mobile provides all routes through a native modal menu, five-item bottom navigation and reflowing controls. Wide schematics and tables scroll inside their own containers. Village cameras account for the actual canvas aspect ratio. The intended reading order and controls remain usable within the narrow viewport.

Overview/dashboard/simulation are operating surfaces. Explore/circuit combine experience and operation. Architecture/solution/process/roles/docs are reading surfaces. Presentation supports guided operation.

## Elevation & Depth

Ordinary panels use tonal layers and restrained borders. Physical depth comes primarily from the 3D environment and its local PBR/HDRI lighting. Expanded scenes receive the existing large ambient shadow; spatial labels use a compact shadow to remain legible over scene detail. Exact elevation and motion values live in the sidecar.

## Shapes

Panels use the established softly rounded panel shape; compact controls use the control radius in frontmatter. Small status pills remain compact. Detailed authored boats, cages and electronics establish recognizable physical silhouettes rather than a uniform collection of boxes.

## Components

Buttons, the quality selector, navigation, status chips, metric panels and scene overlays share the same palette, type system and visible keyboard focus. Hover and active treatments refine the existing surface layer. The sidecar records representative implemented components as self-contained HTML/CSS snippets.

### Village and circuit views

Smooth camera transitions and one electrical state transition convey causality. Reduced motion prevents automatic camera choreography and decorative animation. Sun and water conditions remain independent of grid state; outage affects equipment LEDs, worklights, data overlays and power flow. No per-frame React state or new vector allocations.

Viewport expansion uses a dedicated exit control, Escape, focus handling and body-scroll restoration. Scroll storytelling has a manual override. Mobile quality uses a lower pixel ratio and reduced effects. Any failure to create WebGL has an informative fallback.

### Monitoring

Charts use the shared navy/teal/amber system, restrained grid lines and legible tooltips. Units and source/simulation status accompany the readings. Missing salinity values remain visible as missing data rather than a false zero. Primary-source voltage and eligible backup loads remain distinct.

## Do's and Don'ts

### Do:

- Do keep reconstructed geometry and simulated values visibly labelled.
- Do retain all route content, scenarios, exports and engineering source boundaries.
- Do use the shared simulator for village, circuit, dashboard and presentation state.
- Do use local assets with documented licenses and distinct field-photo provenance.
- Do preserve mobile quality limits and an informative WebGL fallback.

### Don't:

- Don’t present reconstructed geometry as surveyed geography or installed infrastructure.
- Don’t replace factual body copy with 8–10px text.
- Don’t let mobile navigation overlap primary controls.
- Don’t remount the camera on telemetry ticks.
- Don’t change sunlight or water conditions to imply an electrical outage darkens daylight.
