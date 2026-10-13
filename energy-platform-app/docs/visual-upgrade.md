# Cinematic Coastal Industrial upgrade

14 October 2026 · implementation record for the Community Energy Resilience Platform.

The upgrade applies the user's coastal industrial direction to the complete application: village experience, dashboard, circuit lab and all supporting engineering/team routes. The visual target is a cinematic reconstruction informed by field references. It is not a photorealistic site scan, a surveyed digital twin or field-tested hardware.

## What changed

| Area | Implemented change | Evidence in the project |
| --- | --- | --- |
| Visual system | Navy surfaces, marine teal operating states, brass amber warnings, restrained typography and tabular readings; readable Thai and Latin fonts served locally | `src/app/globals.css`, `src/app/layout.tsx`, `DESIGN.md`, `.impeccable/design.json` |
| Village | Detailed fishing boats, rectangular net cages, floats, timber jetties, shoreline homes, utility poles and P0–P3 equipment; opaque estuary water and warm outdoor lighting | `Scene3D.tsx`, `three/VillageAssets.tsx`, `three/VillageWater.tsx` |
| Physical materials | Local CC0 PBR timber, corrugated iron and sand maps; local HDRI; detailed GLB utility cabinet and generator prop | `public/assets/asset-manifest.json`, `ASSET_LICENSES.md` |
| Camera and spatial controls | Smooth presets, clickable equipment labels, viewport expansion with Escape/focus restoration, desktop scroll chapters and manual override | `Scene3D.tsx`, `Platform.tsx` |
| Circuit lab | Authored PCB/terminal/probe/battery detail, assembly and exploded views, inspectable components; shared graph drives the physical wires and 2D nets | `CircuitLab.tsx`, `circuit/Equipment.tsx`, `circuit/graph.ts` |
| Outage demonstration | Shared simulation drives equipment lights, flow, backup and load status; daylight stays independent of the power failure | `store/simulator.ts`, `lib/model.ts`, village and circuit scene consumers |
| Monitoring | Lazy-loaded voltage, battery, stacked load and water charts with consistent axes/tooltip styles and missing salinity samples on sensor fault | `TelemetryCharts.tsx`, `Platform.tsx` |
| Mobile/performance | Aspect-aware camera framing, lower mobile DPR, desktop-only high-quality postprocessing, native modal route menu, bounded spatial DOM overlays and WebGL fallback | `Scene3D.tsx`, `CircuitLab.tsx`, `three/SpatialHtml.tsx`, responsive CSS |

The simulation equations and priority **P0 > P1 > P2 > P3** remain the common source for every route. Circuit power and data connectivity use separate state rules. Primary-source voltage can be zero while the simulated backup still supplies eligible loads. Offline communication does not itself turn physical loads off.

## Asset and design evidence checked

The preparation audit checked download MD5 values, GLB headers/buffer ranges and embedded JPEG validity. The rendering assets plus three existing Data Pack photographs total **4.32 MB**. The utility box has 4,404 triangles; the optional generator prop has 26,419. Their materials use optimized 512 px PBR maps. Both models are generic appearance references, not identified local installed devices. Field photographs are credited separately from CC0 assets. OFL font notices ship locally.

The documented palette agrees with the reusable CSS values: background `#08141f`, navigation `#0b1926`, surface `#102332`, raised surface `#152c3b`, text `#e5edf1`, muted text `#a9bdc9`, boundary `#2b4658`, teal `#67dcc6`, amber `#eebd76` and fault `#f28b86`. The CSS and design references use Manrope Variable/IBM Plex Sans Thai, a 15 px body and 14 px panel radius. `DESIGN.md` now carries the normative token frontmatter and canonical design sections; `.impeccable/design.json` uses schema version 2 for metadata, component snippets, motion and breakpoints. Both retain the established direction and color/type values. The current common panel-title selector is 16 px; the original 17 px brief reference is explicitly identified rather than presented as current CSS.

The code audit also checked that chart/3D modules are loaded on demand, salinity fault becomes `null` rather than zero, and `SpatialHtml` removes its DOM element immediately while deferring its independent React-root unmount until the outer R3F commit completes. Spatial projection reuses vector objects rather than allocating them each frame.

## Manual verification matrix

Targets: **1440 × 1000 desktop** and **390 × 844 mobile**. Browser observations were supplied by the integration owner through CUA. This documentation pass audited source and provenance without another screenshot or test session. Screenshots are visible in the integration tool history; no saved screenshot file path is asserted.

| Surface/behavior | Desktop · 1440 × 1000 | Mobile · 390 × 844 | Evidence and scope |
| --- | --- | --- | --- |
| Overview scene and equipment inspector | Full scene screenshot captured/reviewed | All P0–P3 nodes within camera frame after aspect correction | Scene composition and spatial labels inspected at both targets |
| Monitoring charts | Chart screenshot captured/reviewed | Metrics and plots captured; no horizontal overflow | Mobile measured document width 375 px within the 390 px viewport |
| Circuit assembly/exploded view | Both views captured/reviewed | Panel and selected tag captured after framing correction | Selected tag right edge 299 px, within the 390 px viewport |
| Route navigation | Circuit → overview → dashboard transitions checked | Modal menu shows all eleven content routes | Fresh transition console errors were an empty array after the SpatialHtml lifecycle fix |
| Fullscreen and Escape | 1200 × 900 expansion checked after intermediate-breakpoint correction | Viewport expansion observed; Escape closes and restores focus | Mobile viewport-expanded view covered 390 × 844; exit button received focus |
| Scroll chapters and camera override | P0–P3 chapter selection checked in static production export | Automatic follow disabled at narrow widths | Scrolled chapter selection changed camera/node; turning follow off retained P3 while returning to P0 text. Reduced-motion handling audited |
| Scenarios/state/exports | Typecheck and eleven meaningful tests passed; JSON download inspected | Same browser-local model | Export contained 40 samples, simulated flag, null salinity and the sensor-fault event; paused outage updates the current metric to 0.0 V while history stays paused |
| WebGL fallback and quality | Source path checked | Source path checked | Mobile DPR 0.75–1; desktop cap 1.25 Balanced/1.5 High. Forced context-loss performance was not separately measured |
| Production export and routes | All eleven content routes statically generated without build warnings | Same static output | Final export succeeded; local production HTTP checks returned 200 for all eleven routes, ten HTML-referenced assets, both GLB models, HDRI and manifest; no duplicated base paths |

This is a scoped visual/functional review, not a hardware validation or a measured cross-device GPU performance certification.

## Engineering boundaries

- The geometry is reconstructed from context and visual references; location, dimensions and installed infrastructure have not been surveyed.
- Battery capacity, wattages, thresholds, water series and accelerated time are demonstration assumptions. The generator is an illustrative prop.
- Salinity and temperature do not establish dissolved oxygen; DO stays unavailable.
- Hardware interfaces, BOM, protection ratings, battery/BMS selection, calibration and installation review remain open. The circuit is a low-voltage concept reference and does not control household mains.
- Browser-local state and exports demonstrate an engineering workflow. No live sensor stream, remote alert delivery or persistent project backend is connected.
