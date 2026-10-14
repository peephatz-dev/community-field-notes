# SALA HUM POWERGUARD — Design system

## Direction

Light iOS rounded community operation, as requested in Asset Pack v2. White surfaces on a pale blue background, navy Thai text, restrained elevation and the original vector ปลากะพงสามน้ำ. The first screen names the electrical state plainly: ไฟปกติ, ไฟตก or ไฟดับ. Community labels use short Thai words.

## Color and type

`src/lib/powerguard/brand.json` is authoritative: #F8C642 yellow, #FF7A3C orange, #2F7DD3 blue, #5EC6E8 sky and #1F2D5A navy. Accessible darker derivatives serve text and primary controls. Status always includes words as well as color. Physical water colors remain reference appearances, with no measured salinity claim.

Self-hosted Manrope Variable and IBM Plex Sans Thai remain. Main status titles scale down on mobile; readable body text, short labels and tabular readings provide hierarchy. Community panels use 24–30 px corners; 44 px primary controls and visible keyboard focus support touch and keyboard operation.

## Layout and modes

Desktop keeps a navigation rail and top controls. Mobile uses a two-row command bar, five-item bottom navigation and a native dialog with all links. Secondary tables scroll within their container. Community SVGs load without WebGL. Engineering routes retain circuit, charts, architecture, process, roles, documentation and presentation.

The same simulator drives community equipment, notification center, engineering graphs, circuit and site reconstruction. Engineer Mode retains P0–P3 and dark spatial panels for legibility over the scene. The reconstructed shoreline/road/housing/piers/cage layout near ท่าเรือลุงทอง remains relative to the supplied image, not surveyed geography. Utility pages expose community navigation; the engineering preference is restored when returning to a technical view.

## Mascot, motion and audio

Use actual vector files from `public/powerguard/mascot/`. Happy, thinking, warning, critical and success follow the simulation. The bubble is always available. Thai speech is explicit opt-in, has speaking and stop controls, and falls back to text when Thai TTS is unavailable.

Bounded CSS/SVG rain, waves, sparks and bubbles respect reduced motion and the VFX switch. The concept community illustration is labelled as an illustration. Its ambience is synthesized. Audio has separate SFX, ambience and music controls, one active ambience plus music, mute and visibility pause. Reload never auto-enables audio.

## Operational state

Toasts and notifications originate from classified simulator events. Critical records survive acknowledgement and toast closure. Local history, action notes and backup plans persist and export. Invalid plan inputs cannot be saved or exported and show recovery guidance. Cost remains unknown without user prices.

Every surface keeps a trial-data label. Proposed node positions, conceptual B/C monitoring, missing DO and hardware limitations remain visible. Mobile and desktop screenshots and functional checks are documented in `docs/powerguard-upgrade.md`.
