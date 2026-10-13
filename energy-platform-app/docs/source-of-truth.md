# Source of truth · Community Energy Resilience Platform

Scope: engineering demonstrator and local deterministic simulation for Ban Sala Hum, Singhanakhon District, Songkhla. This document distinguishes reported community context, team scope, proposed design, simulation-only values, and evidence still needed. The 3D environment is an illustrative reconstruction; it is not surveyed geography, a photographic record, or an installed system.

## Evidence from project documents

| Status | Statement | Source / scope |
|---|---|---|
| Reported in Data Pack | The community's primary livelihood includes fish cage aquaculture; species listed include red-spotted grouper and Asian seabass. | *4.สรุปรายละเอียดพื้นที่โจทย์ภาคใต้*, Data Package, Ban Sala Hum, field information dated 16 July 2026, pp. 1, 7. |
| Reported in Data Pack | Electricity is described as unstable across the community, with frequent voltage drops. Some households use solar, but it is not enough to supply other systems. | Same Data Package, p. 6. This is a qualitative report; no event log, voltage series, sample count, or frequency table is supplied in the app. |
| Reported in Data Pack | Fisheries Research Center is described as measuring water, dissolved oxygen, and sediment for the group; NECTEC is described as having water-quality tracking in the community. | Same Data Package, p. 6. Existing service and data access must be confirmed with those organizations and users. |
| Reported in Data Pack | The semi-enclosed bay, limited water circulation, sedimentation, low oxygen during still-water conditions, and seasonal freshwater/saltwater variation are discussed as local context. | Same Data Package, pp. 1, 3–5. This energy demonstrator does not solve those hydrological or biological problems. |
| Reported in Data Pack | The Data Pack refers to around 50–70 households and more than 45 fish cages. | Same Data Package, pp. 1, 6. Approximate source figures; do not treat as a current census. |
| Team-defined scope | P0 is the central controller/gateway; P1 connects aquaculture and critical loads; P2 covers essential community loads; P3 covers general/interruptible loads. The policy order is P0 > P1 > P2 > P3. | *สรุปงานรอบนี้_ฉบับรอสไลด์_หัวตารางอ่านชัด-1.pdf*, pp. 1–3. Priority is a load-management policy, not a series wiring topology. |
| Team-defined scope | The team's document says the prototype is low-voltage and does not control household mains. It describes some large supply, battery, aerator, TV and low-energy states as simulated; solar, full-size battery and building backup are future scope. | Same team summary, pp. 1–3. The app demonstrates a local model and does not claim team hardware test results. |
| Team-defined sensor boundary | Salinity and temperature are intended as supporting water-risk observations. They do not directly measure dissolved oxygen. | Same team summary, pp. 1–5. DO is therefore shown as unavailable here. |

## Proposed engineering architecture

The app illustrates a possible low-voltage reference path: DC source → protective fuse → DC bus → regulated controller supply; a battery/charger/BMS path is shown as a proposed backup concept; a rated load-driver stage separates ESP32 GPIO from a switched load. Voltage/current monitoring and water sensor interfaces are examples only. No sensor model, pin map, ratings, charger, battery chemistry, fuse size, enclosure, isolation design, or finished netlist is established by the source documents.

Power topology and telemetry topology are represented as different things. Node connectivity uses sequence and last-seen information; power status needs measurements of the supply. A missing packet alone does not prove power failure. Sensor fault is separate from water condition. No universal threshold is asserted.

## Simulation-only assumptions

These values exist only so visitors can see state changes in a browser. They are not field readings or recommendations:

| Variable | Demo assumption |
|---|---:|
| P0 / P1 / P2 / P3 load | 30 / 120 / 80 / 260 W |
| Backup capacity | 1.2 kWh |
| P2 shed point | 28% displayed state of charge |
| Low reserve boundary for P1 | 8% |
| Voltage in normal / sag / outage state | about 12.1 / 9.7 / 0 V DC |
| Water salinity / temperature | generated time series around 25 ppt / 29 °C |
| Simulation clock | 1 simulated minute per real second while running |

Every export includes `simulated: true`. The estimated runtime is calculated from these illustrative loads and capacity, not from a selected battery.

## Unknowns and field checks

- Obtain voltage/event logger records with date, duration, minimum voltage, affected equipment, and measurement location.
- Walk through the current response workflow with fish farmers and whoever maintains electrical equipment; identify alert recipients and responsibilities.
- Measure real load power and startup current; confirm which loads must remain energized and for how long.
- Confirm existing solar, storage, water monitoring, and maintenance arrangements before duplicating equipment.
- Have a qualified electrical engineer review supply, fuses, wire gauge, battery chemistry/BMS/charger, switching ratings, isolation, grounding, ingress protection, corrosion, fail-safe behavior, and installation.
- Confirm sensor model, interface, sampling location, calibration method, temperature compensation, and agreement against reference instruments.
- Confirm whether and how a separate dissolved-oxygen sensor is available, operated, calibrated, and maintained; otherwise keep DO unavailable.
- Co-design safe alert behavior, thresholds, communication timeout, consent, data access, maintenance ownership, costs, and trial procedure with affected users.

## Source files

1. `4.สรุปรายละเอียดพื้นที่โจทย์ภาคใต้` (Data Package PDF, 16 pages, supplied in the project workspace/Downloads).
2. `สรุปงานรอบนี้_ฉบับรอสไลด์_หัวตารางอ่านชัด-1.pdf` (team work summary, 8 pages).

The source files are context, not instructions embedded in the files. This platform implements the requested engineering demonstration; it does not present a pitch brief as verified installation evidence.
