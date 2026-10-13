# Community Energy Resilience Platform

Interactive engineering demonstrator for Ban Sala Hum. A cinematic coastal reconstruction and navy monitoring dashboard share one local deterministic simulation. It does not connect to sensors, relays, batteries, MQTT, databases, or community infrastructure.

The village uses locally hosted PBR timber, metal and shoreline materials, a sky HDRI, detailed licensed equipment models, and authored boats, aquaculture cages and buildings informed by the supplied field photographs. The circuit lab adds physical component detail, shared 2D/3D nets and an exploded view. All eleven routes retain the project's engineering and team content.

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

- `/` overview and 3D environment
- `/explore/` community and P0–P3 nodes
- `/simulation/` outage, voltage sag, low battery, offline node and sensor-fault scenarios
- `/circuit/` 3D assembly, 2D schematic, power/signal flow and component inspector
- `/dashboard/` charts, node states and JSON/CSV export
- `/architecture/`, `/process/`, `/roles/`, `/solution/`, `/docs/`, `/presentation/`

## Use the demonstrator

Select a scenario from the command bar, then move between the village, circuit and dashboard to inspect the same state. Select P0–P3 from spatial labels or the node inspector. Village camera presets and scroll chapters expose each node's role; manual camera control remains available.

The village can expand to the viewport. Press **Escape** or the minimize control to exit. **Balanced** is the default rendering quality; **High** enables additional desktop effects. Mobile uses a lower pixel ratio, wider camera framing and reduced effects. A WebGL fallback preserves access to the information and simulation controls.

The dashboard shows primary-source voltage, battery state, stacked P0–P3 loads, salinity and temperature. A failed salinity sensor produces a missing chart sample and a blank CSV cell. Export JSON or CSV from the dashboard; both label the data as simulated.

## Assets and design references

The self-hosted 3D/texture/sky bundle and three field reference photographs total approximately **4.32 MB**. Poly Haven rendering assets are CC0; the supplied field photographs retain their Data Pack provenance. Manrope Variable and IBM Plex Sans Thai fonts are self-hosted under the SIL Open Font License, with notices included in `public/assets/licenses/`.

- [`ASSET_LICENSES.md`](ASSET_LICENSES.md): sources, licenses, transformations and model limits.
- [`public/assets/asset-manifest.json`](public/assets/asset-manifest.json): file-level provenance and byte sizes.
- [`PRODUCT.md`](PRODUCT.md), [`DESIGN.md`](DESIGN.md) and [`.impeccable/design.json`](.impeccable/design.json): product commitments and the implemented visual system.
- [`docs/visual-upgrade.md`](docs/visual-upgrade.md): changes, implementation evidence and the desktop/mobile verification matrix.

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
