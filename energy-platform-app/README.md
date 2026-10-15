# SALA HUM POWERGUARD

## หน้าติดตามแบบแผนที่เป็นหลัก

หน้าแรกเริ่มจากสถานะไฟและแผนที่ เลือกหมุดเพื่อเปิดรายละเอียดอุปกรณ์ กดปิดหรือ Escape เพื่อกลับมุมรวม เมนูข้างย่อเป็นไอคอนและขยายได้ บนมือถือใช้เมนูล่างและแผงรายละเอียดใต้แผนที่

ปุ่มสั่งเหตุอยู่ที่ `/simulation/` เท่านั้นสำหรับการสาธิต ส่วนหน้าแรกไม่มีปุ่มสั่งเหตุ กราฟ ลำดับเหตุ และรายการเลือกอุปกรณ์เปิดอ่านเพิ่มได้ มาสคอตและเสียงเปิดเมื่อผู้ใช้กด ทุกค่ายังจำลอง ไม่มีการเชื่อมอุปกรณ์จริง ดูผลตรวจใน `../deliverables/web-ui/ux-refactor/README.md`


Community and engineering demonstrator for Ban Sala Hum. A light, rounded interface with the original ปลากะพงสามน้ำ SVG mascot, local audio and a coastal reconstruction share one local deterministic simulation. It does not connect to sensors, relays, batteries, MQTT, databases, or community infrastructure.

The village and original SVG site plan now use one image-relative layout for the fish-cage area near ท่าเรือลุงทอง, Ban Sala Hum. The village uses locally hosted PBR timber, metal and shoreline materials, a sky HDRI, detailed licensed equipment models, and authored boats, aquaculture cages and buildings informed by the supplied field photographs. The circuit lab adds physical component detail, shared 2D/3D nets and an exploded view. All twelve existing content routes retain the project's engineering and team content. Seven community utility routes bring the total to nineteen.

## Run locally

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The app can run offline after packages are installed. Use an ordinary browser with WebGL enabled for the 3D views.

## Build and validate

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm export:github
```

`pnpm build` creates a static Next.js export. `pnpm export:github` copies the generated app into the parent repository's `energy-platform/` folder for its GitHub Pages site. The configured deployment base path is `/community-field-notes/energy-platform/`.

## Navigation

- `/` interactive isometric site dashboard, shared KPI/inspector/timeline, 3D/2D, camera tools and scenarios; audience selector: community/operator/engineer
- `/power/`, `/devices/`, `/community/` power, device status and clearly labelled vector illustration
- `/notifications/`, `/history/` notifications, acknowledgements, local problem reports and JSON/CSV exports
- `/backup-plan/` assumed loads, hours, efficiency, usable fraction, prices and UPS comparison
- `/roadmap/` survey through measured evaluation and expansion
- `/explore/` site plan, community edge, cage clusters, proposed P0–P3 nodes and water-transition view
- `/simulation/` normal, voltage sag, outage, extended outage, critical/low battery, water change, offline, sensor fault and staged recovery
- `/circuit/` 3D assembly, 2D schematic, power/signal flow and component inspector
- `/dashboard/` charts, node states and JSON/CSV export
- `/process/` eleven sensing-to-recovery steps with live shared-state badges
- `/roles/` five named team owners, deliverables and site-specific community responsibilities
- `/presentation/` ten-stage judge walkthrough with chapter selection, keyboard navigation and route previews
- `/architecture/`, `/solution/`, `/docs/`

## Use the demonstrator

Use the community Demo Lab or select a scenario from the engineering command bar, then move between the village, circuit and dashboard to inspect the same state. Select P0–P3 from spatial labels or the node inspector. Village camera presets and scroll chapters expose each node's role; manual camera control remains available.

The village can expand to the viewport. Press **Escape** or the minimize control to exit. **Balanced** is the default rendering quality; **High** enables additional desktop effects. Mobile uses a lower pixel ratio, wider camera framing and reduced effects. A WebGL fallback preserves access to the information and simulation controls.

The dashboard shows primary-source voltage separately from backed-up load-bus voltage/current, battery state, stacked P0–P3 loads, salinity and temperature. A failed salinity sensor produces a missing chart sample and a blank CSV cell. Export JSON or CSV from the dashboard; both label the data as simulated.

The site-plan coordinates are normalized to the supplied reference crop, not geographic survey coordinates. P0–P3 are **PROPOSED**; zones A/B/C are a monitoring concept. B/C have no installed instruments or invented readings. Visible water-color separation is an observation that requires measurement; it does not establish salinity, depth, flow direction or DO. Reference screenshots are not served as map tiles, textures or embedded maps.

The presentation uses the shared simulator and remembers its stage within the current browser session. Use chapter buttons, **←/→**, **Home/End**, and preview controls. Outage and recovery actions preserve the event history. Its site-plan previews keep the presentation light without a second WebGL canvas.

## Assets and design references

The self-hosted 3D/texture/sky bundle and three field reference photographs total approximately **4.32 MB**. Poly Haven rendering assets are CC0; the supplied field photographs retain their Data Pack provenance. Manrope Variable and IBM Plex Sans Thai fonts are self-hosted under the SIL Open Font License, with notices included in `public/assets/licenses/`.

- [`ASSET_LICENSES.md`](ASSET_LICENSES.md): sources, licenses, transformations and model limits.
- [`public/assets/asset-manifest.json`](public/assets/asset-manifest.json): file-level provenance and byte sizes.
- [`PRODUCT.md`](PRODUCT.md), [`DESIGN.md`](DESIGN.md) and [`.impeccable/design.json`](.impeccable/design.json): product commitments and the implemented visual system.
- [`docs/visual-upgrade.md`](docs/visual-upgrade.md): the previous cinematic upgrade and its verification matrix.
- [`docs/site-upgrade.md`](docs/site-upgrade.md): site grounding, scenario semantics, team/process/deck implementation and pending integration checks.

## Important boundaries

- The 3D scene is illustrative and not a geographic survey or photorealistic site scan.
- All values exported by the app carry `simulated: true`.
- The load watts, 1.2 kWh battery, voltage states, salinity/temperature series and thresholds are demo assumptions.
- Salinity and temperature are not dissolved oxygen. DO is intentionally unavailable.
- A communication timeout is not proof of a power outage.
- A zero primary-source voltage does not mean every load is unpowered: the simulated backup bus and load policy are assessed separately.
- The circuit lab is a concept reference, not a build-ready schematic. Part numbers, ratings, pin assignments, battery charging/protection, isolation, enclosure and safety review remain open.
- The team's source summary says the prototype is low voltage and does not control household mains. Never use this UI or its example circuit to connect household mains or real aquaculture equipment.

See [`docs/source-of-truth.md`](docs/source-of-truth.md) and [`docs/engineering-notes.md`](docs/engineering-notes.md).

## PowerGuard controls and persistence

Click the mascot to expand its short Thai explanation; **ฟังเสียง** opts into Thai TTS and **หยุดพูด** cancels it. If no Thai voice is installed, the bubble remains and explains the fallback. Audio never starts on page load. The sound dialog separately controls SFX, ambience and music, master mute, five ambience choices and eleven UI test sounds. Ambience and music pause while the document is hidden. VFX can be switched off and respect reduced motion.

Notifications originate from the shared simulator. Exact event IDs deduplicate; simulation resets begin a new episode. Acknowledging or closing a critical toast never deletes its history record. History, resolution notes, backup plans and selected preferences persist in this browser's localStorage. They are not synchronized or transmitted to anyone. Audio activation and loop activation do not persist across reloads. A browser reset or storage restrictions can remove/prevent local records; exports provide a copy.

The user-supplied Asset Pack v2 is inventoried in `public/powerguard/ASSET_MANIFEST.json`. Its SVGs are original vector assets; the concept community illustration is not the surveyed site map, and its audio is synthesized rather than a field recording. Colors come from `src/lib/powerguard/brand.json`: yellow **#F8C642**, orange #FF7A3C, blue #2F7DD3, sky #5EC6E8 and navy #1F2D5A. See [PowerGuard verification](docs/powerguard-upgrade.md) and [feature audit](docs/powerguard-feature-audit.md).

## Isometric dashboard and ten-slide pitch (15 October 2026)

The primary dashboard now uses the existing R3F site scene. Select a cage or equipment marker to inspect its simulated source, load and latest event. Community and operator labels use natural names; engineering shows P0–P3. Mobile KPI indicators occupy a separate region above the canvas. Low, balanced and high quality settings and the 2D plan remain available.

The pitch package is [../deliverables/pitch-deck/](../deliverables/pitch-deck/): editable 10-slide 16:9 PPTX, reading PDF, ten PNG previews, six-minute Thai script, speaker notes and skeptical Q&A. [QA and limits](../deliverables/QA_AND_LIMITATIONS.md) and [evidence ledger](../deliverables/research/evidence-ledger.md) separate browser tests, simulated values, reported field context and the missing hardware/field evidence. This branch has not been merged or deployed.
