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

This documentation/component subtask reviewed the current site-layout types, SitePlan API, model/store transitions and existing design tokens. No new test/build/browser/Git operation was run by the documenter. Integration QA is **pending** and belongs to the release owner; the previous cinematic-upgrade checks in `visual-upgrade.md` are not evidence that this expansion has passed.

The required integration checks are: typecheck/meaningful model regressions; all routes/build/static export; desktop and mobile site plan/scene alignment; P0–P3 placement interaction; transition camera and B/C concept labels; main-source versus bus readings; water-change/offline/fault distinction; history-preserving recovery; deck buttons/keyboard/session return; role/process content; and no duplicated Canvas or inaccessible overflow.

Expected benefits are proposals to evaluate. No measured reduction in fish losses, energy cost, response time or other field outcome is claimed. BOM/ratings/protection/calibration, approved alerts, site permissions and a supervised low-voltage pilot remain prerequisites for real deployment.
