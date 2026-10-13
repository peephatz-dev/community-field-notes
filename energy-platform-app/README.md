# Community Energy Resilience Platform

Interactive engineering demonstrator for Ban Sala Hum. The application runs a local deterministic simulation and draws an illustrative 3D reconstruction. It does not connect to sensors, relays, batteries, MQTT, databases, or community infrastructure.

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

## Important boundaries

- The 3D scene is illustrative and not a geographic survey or photorealistic site scan.
- All values exported by the app carry `simulated: true`.
- The load watts, 1.2 kWh battery, voltage states, salinity/temperature series and thresholds are demo assumptions.
- Salinity and temperature are not dissolved oxygen. DO is intentionally unavailable.
- A communication timeout is not proof of a power outage.
- The circuit lab is a concept reference, not a build-ready schematic. Part numbers, ratings, pin assignments, battery charging/protection, isolation, enclosure and safety review remain open.
- The team's source summary says the prototype is low voltage and does not control household mains. Never use this UI or its example circuit to connect household mains or real aquaculture equipment.

See [`docs/source-of-truth.md`](docs/source-of-truth.md) and [`docs/engineering-notes.md`](docs/engineering-notes.md).
