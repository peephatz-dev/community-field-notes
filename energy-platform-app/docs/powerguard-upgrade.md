# SALA HUM POWERGUARD — Upgrade and verification

14 October 2026 · Asset Pack v2 · browser-local demonstrator

## Preserved

- Existing power equations, 1.2 kWh assumed battery, P0 > P1 > P2 > P3 priority and staged source recovery (`src/lib/model.ts`, `src/store/simulator.ts`). Communication loss does not disconnect physical loads; sensor failure produces missing telemetry, not a fabricated zero.
- Image-relative site layout near ท่าเรือลุงทอง, original 2D map, 3D reconstruction, proposed node selection, comparison, overlay, camera controls and private local reference image.
- Five circuit views, component inspector, engineering dashboard and exports, architecture, solution, eleven-step process, five named owners and ten-stage judge walkthrough.
- Weather, tide, assumed bathymetry, water layers and illustrative three-box mixing engine. Environment and electricity share one clock; rain alone does not imply a grid outage. See `environment-equations.md`.
- All twelve previous content routes. No main parent website content was replaced.

## Modified

- Light rounded shell, readable navy text and Thai labels; engineering spatial canvases retain dark controls. Colors follow `brand.json`, including the latest yellow **#F8C642**.
- Community labels replace P0–P3 with names. Technical identifiers remain available in Engineer Mode. Utility pages provide community navigation; entering technical routes retains the engineering mode for subsequent graph/site views.
- Root layout hosts a single notification/audio runtime. Simulator reset increments an episode counter so a new run cannot collide with old event IDs. Reset clears current toasts, not persistent history.
- Every content page has a primary heading. Technical page labels and non-canvas surfaces were adjusted for the new light theme.

## New

- Actual SVG mascot with happy/thinking/warning/critical/success states, short Thai bubble, explicit Thai TTS, speaking status, stop and text fallback. Intentional stop does not report a playback failure.
- Eleven local UI sounds, five selectable synthesized ambiences and music. Separate SFX/ambient/music sliders, master mute, opt-in, visibility pause and bounded simultaneous playback. Reload does not auto-enable audio or loops.
- CSS/SVG waves, rain, bubbles and electrical warning effects, user toggle and reduced-motion rules.
- Shared-state Demo Lab; persistent notification center, acknowledgements, critical retention, local problem reports and resolution notes. Exact source IDs deduplicate.
- Backup planner: selected loads, assumed watts, hours, efficiency, usable battery fraction, power factor, prices and UPS W/VA/Wh comparison. Unknown prices remain unknown; invalid plans cannot save/export. CSV uses UTF-8 BOM and neutralizes spreadsheet formula prefixes in user text.
- Seven new utility routes: `/power/`, `/devices/`, `/community/`, `/notifications/`, `/backup-plan/`, `/history/`, `/roadmap/`.

## Tested

### Automated

`pnpm test`: **50/50 pass**, including all pre-existing tests and PowerGuard asset integrity, genuine event classification/dedup, critical retention, persistence, plan sizing/validation, audio opt-in/mute/volume/visibility, Thai voice fallback and speech cancellation. Production export passes TypeScript and generates all nineteen content routes plus error pages.

115 supplied public assets were verified byte-for-byte against the pack manifest. The preview/reference sheets are not deployed. Five mascot mood files contain real vector paths and no embedded raster image.

### Actual browser interaction

Verified in the Codex in-app browser against the production static export:

| Feature | Observed result |
| --- | --- |
| 19 content routes | All opened and displayed their content. Missing primary headings on process/roles/presentation were repaired. |
| Mascot | Happy and thinking SVGs observed; sag/low-battery warning, outage/critical battery critical, recovery success followed the shared simulator. |
| Thai speech | Installed Thai TTS entered speaking state; stop became available and ended with “หยุดพูดแล้ว”. No speech started on load. |
| Eleven UI sound tests | Each produced the corresponding `data-last-sound` and successful browser playback status. |
| Five ambiences + music | Actual OGG sources loaded with advancing playback time; previous ambience paused. Only one ambience plus music remained active. |
| Audio controls | Three slider values changed; mute paused every player; unmute resumed opted-in loops; disable left no player running. |
| VFX | Storm displayed fourteen rain SVGs, one wave and one spark. Toggle removed the effect container. Motion CSS also contains reduced-motion overrides. |
| Electrical Demo Lab | Outage immediately showed 0 V source, 3/4 active loads and backup. Low battery showed 34%; critical 7% left only the central load. Recovery started with 2/4 loads; existing integration tests verify staged return. |
| Communication/sensor | Offline and reconnect buttons updated state. Sensor fault created a distinct notice while main power stayed normal. |
| Notices/history | Critical acknowledgement survived reload and the critical record remained. Local report and action note survived reload and appeared in downloaded JSON. |
| Backup planner | Saved 150 W, 3 h, efficiency/usable 0.8, user price 4 baht/Wh + 1,000 baht. Reload/export retained 703.125 Wh, 187.5 VA and 3,812.5 baht as user assumptions. |
| Existing engineering | Site canvas rendered; camera/top-down and comparison controls operated. Five circuit tabs selected correctly and the battery inspector changed. Fullscreen entry and Escape exit operated. Process badges reflected outage. Presentation End/Home reached 10/1. |
| Environment | High/low tide changed illustrative water level +0.6/−0.6 m and clearance 1.3/0.1 m. All four layers selected. Storm propagated outage into the shared monitor. |
| Responsive | Actual desktop 1440×1000, tablet 1024×900 and mobile 390×844 screenshots inspected. Mobile full menu opened and Escape closed it. |
| Console | No JavaScript error entries were returned during the route checks. |

Screenshots are saved in the task's `outputs/site-reconstruction/` folder: `powerguard-desktop.png`, `powerguard-mobile.png`, `powerguard-engineer-tablet.png`, `powerguard-environment.png`, `powerguard-monitor.png` and final live proof. Transient server-rendered defaults can appear before local preferences hydrate; saved values were confirmed through UI and exported files.

## Unverified / external dependencies

- No actual sensors, battery hardware, MQTT, backend or AC control are connected. All current values are **ข้อมูลทดลอง**. Local problem reports are not delivered to agencies, LINE or SMS.
- Thai speech depends on the user's installed OS/browser voice. The no-Thai-voice path is unit-tested; the tested browser had Thai TTS. Physical speaker audibility and every OS/codec combination are not certified.
- The site rendered in 3D in the tested browser; switching several WebGL views also exercised the informative 2D fallback. Sustained GPU performance, every device and recovery from every driver/context failure are not certified.
- The environment is not surveyed or hydrodynamically calibrated. B/C model values are not sensor readings, water color is not proof of salinity and DO remains unavailable.
- Browser-local storage is not cloud synchronization. Clearing site data loses local history; storage restrictions may prevent saving. JSON/CSV exports are available.
- Plan prices are user assumptions, not market quotations. Startup current, battery ageing, field loads, final hardware ratings and electrical safety still need measurement/review.

## Release

The source and generated static export are delivered together to the existing GitHub Pages repository. Public route and asset availability are checked after Pages reports a successful deployment.
