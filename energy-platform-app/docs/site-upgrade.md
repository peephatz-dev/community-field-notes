# Site-specific platform upgrade

14 October 2026 · Smart Energy & Aquaculture Resilience — Ban Sala Hum, Songkhla.

This expansion grounds the demonstrator in the supplied image of the fish-cage area near **ท่าเรือลุงทอง**. It adds a shared site layout, environmental observation/placement concept, richer scenarios and practical process/team/presentation interfaces. Existing energy-priority, circuit, export and source-boundary features are retained.

## Spatial source and limits

`src/lib/site-layout.ts` traces image-relative features in normalized `[u,v]` coordinates. The reference uses a 591 × 922 crop from the supplied 591 × 1280 screenshot. Its scale, capture date and north direction are unknown. Scene units are composition units; representative cage divisions and roof patches do not establish field counts.

The trace preserves the relative shore/road/house relationship, several pier/landing directions, differently oriented cage runs, cluster gaps and the visible water-color boundary. UI-covered portions are recorded as occlusions instead of filled with claimed observations. `SitePlan.tsx` renders newly authored SVG geometry from this data. `SiteEnvironment.tsx` uses the shared layout for the reconstructed environment. The screenshot is not redistributed as a map, iframe, texture or map tile. A plain link opens the user-provided place reference.

| Layer | What is supported | What remains unconfirmed |
| --- | --- | --- |
| Site appearance | Relative positions and visible shapes in the supplied reference | Survey coordinates, metre distances, north, image date and complete real cage/house counts |
| Water appearance | Green-toned inner water, darker outer water and a visible color transition | Salinity class, depth, turbidity mechanism, current direction or the cause of the contrast |
| Monitoring placement | P0 near accessible shore, P1 near cages, P2 essential community loads, P3 flexible loads | Exact installation locations, permissions, range, electrical loads and weather/sealing requirements |
| Zone strategy | A primary P1 concept; B transition observation; C comparison reference | B/C instruments, measured readings, measured zone boundaries and validated warning thresholds |
| Telemetry | Browser-generated values and events clearly labelled SIMULATED | Actual field readings, DO, hardware connectivity and measured outcomes |

Every proposed node remains **PROPOSED**. B/C are **CONCEPT** and have no instruments; they receive no invented independent numerical samples. Water color only motivates a question about placement. The water-change input is generated independently from those colors/zones.

## Working interfaces

`src/components/SiteGuide.tsx` exports three lightweight client components consumed by the existing routes:

| Export | Behavior |
| --- | --- |
| `SiteRolesGuide` | Five exact named team owners with duties, concrete deliverables and handoffs; five community/system roles tied to cages, shore access, monitoring, maintenance and decision rights |
| `SiteProcessGuide` | Eleven steps from sensing through staged recovery; current model badges, node load/connectivity distinctions, event action and scenario buttons |
| `SitePresentationGuide` | Ten interactive stages; chapters, previous/next, keyboard arrows/Home/End, progress, session-local stage memory, original site-plan previews and direct full-scene/circuit/dashboard links |

The team allocation is นาย (architecture), โฟล์ค (sensors/circuits/safety), พี (data/dashboard/alerts), บอส (communications/messages/state), and ข้าวฟ่าง (documentation/validation/explanation). Loads, monitoring positions, responsible recipients and approved human actions are shared field-validation work.

The judge sequence covers aerial introduction → waterfront community → cage layout → water transition → node placement → circuit → outage → dashboard → benefits/limits → validation roadmap. Camera previews update the shared `cameraMode` and selected node. The component creates no second WebGL canvas and does not call the simulator's destructive `reset()` action. The outage/recovery buttons are explicit; changing slides alone does not manufacture an outage or erase events.

## Simulation semantics

The model retains P0 > P1 > P2 > P3. It now exposes normal, sag, outage, extended outage, critical battery, water change, offline, sensor fault and recovery, with the previous low-battery shortcut retained. Scenario transitions append samples immediately; only elapsed-time `step()` integrates battery energy.

Main-source voltage is separate from the load-bus voltage/current. Current is a synthetic DC constant-power calculation from the active loads and bus voltage; it excludes losses and startup current. A zero main-source voltage can coexist with a backed-up live load bus. Offline communication alone does not stop physical loads.

The synthetic water input applies a salinity/temperature shift without inferring those numbers from the picture. Sensor fault produces missing salinity instead of zero. DO remains unavailable. Recovery preserves SoC, communication/sensor faults, water input and events; the demonstration restores P0/P1, then P2, then P3 over two elapsed-time steps. It does not model battery charging.

## Verification status for this expansion

The release owner verified the current site-specific build. **TypeScript checks, all 36 tests and `pnpm export:github` passed**, including the latest final production build. This documentation pass records those results; it did not run another build, browser session or Git operation.

| Check | Result and scope |
| --- | --- |
| Shared spatial layout | Original SVG and 3D reconstruction compared; proposed P0–P3, overlays, camera presets, camera reset and viewport expansion checked |
| Production desktop/mobile | Screenshots inspected at 1440 × 1000 and 390 × 844; distant framing, water edge, mobile toolbar overlap and fullscreen height corrected |
| Immediate scenario state | With time paused, outage, water-change, critical 7% battery and recovery immediately updated charts and events from the same state |
| Invalid/unpowered P1 channels | Critical battery displayed missing P1 water channels rather than retained numerical readings |
| Recovery regression | Unit suite verified two elapsed-time restoration steps and preservation of history/state boundaries |
| Judge deck | Next selected stage 2, ArrowRight selected stage 3, End selected stage 10 with Next disabled; returning from another route restored stage 10. No WebGL Canvas mounted in the deck |
| Team/process guides | All five exact team names and deliverables inspected; eleven process steps and live critical-7% state inspected |
| Export downloads | CSV and JSON downloaded in the browser. At critical battery, P1 quality was `unpowered`, CSV water cells were blank and JSON water channels were null; source voltage 0 V, bus voltage 12 V, bus current 2.5 A and P0 load 30 W remained coherent |
| Private reference comparison | File picker used a browser-local `blob:` URL with no upload or persistence; clearing restored the original SVG. Overlay slider Home selected 0 and End selected 100 |
| Interaction errors | Browser console errors were an empty array after the inspected interactions |
| Live publication | The prior reconstruction release was verified on GitHub Pages: all eleven content pages matched their production HTML and referenced compiled assets responded HTTP 200. The brand/environment extension has a separate focused release check below. |

Review outputs are stored outside the application in `outputs/site-reconstruction/comparison.jpg` and `outputs/site-reconstruction/mobile.jpg`. These are rendered review artifacts; they are not redistributed map tiles. The checks above do not assert field measurements, hardware readiness or cross-device GPU performance certification.

Expected benefits are proposals to evaluate. No measured reduction in fish losses, energy cost, response time or other field outcome is claimed. BOM/ratings/protection/calibration, approved alerts, site permissions and a supervised low-voltage pilot remain prerequisites for real deployment.

## Brand and environmental extension

The user-supplied five-color palette is applied throughout the control center: yellow #FBC642, orange #FF7A3C, blue #2F7DD3, cyan #5EC6E8, navy #1F2D5A. Physical reference water colors remain separate. Balanced rendering caps desktop DPR at 1 with 1024-pixel shadows; high quality remains optional. The environment page initially loads an original SVG map and loads its single WebGL scene only when requested.

Synthetic weather, illustrative tides, assumed bathymetry, a depth/clearance inspector, cross-section and three-box mixing controls share the energy clock. The new source and engineering limits are documented in `environment-equations.md`. TypeScript and production export passed; 39 tests passed, including three focused environmental cases (internal conservation, tide/depth response, and independent rain versus coupled storm/outage/reset).

The focused browser pass showed the branded dashboard, a storm with P0/P1/P2 backed up and P3 shed, transparent underwater inspection, and low/high water levels of −0.6/+0.6 m changing selected assumed depth from 2.3 to 3.5 m and clearance from 0.1 to 1.3 m. Console errors were absent. At 390 × 844 the mobile menu appeared and horizontal document width did not exceed the viewport; the rendered primary controls and two-column metrics were inspected. This was a bounded check, not an exhaustive interaction/GPU/performance audit.
