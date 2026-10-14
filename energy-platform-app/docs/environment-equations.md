# Environmental demonstration model

Every environmental value is synthetic. This model is for exploring assumptions; it is not a bathymetric survey, tide forecast, weather observation, salinity map, or aquaculture safety recommendation. Water colors in the reference image remain visual observations. They do not supply depths, temperatures, salinity, water-mass classes or current measurements. There is no dissolved-oxygen output.

## Shared clock and activation

The existing store timer is the only integration clock. Each running timer tick advances both energy and environment by the selected duration: 0.5, 1, 2 or 4 simulated minutes. The default is 1. Battery discharge still calls the existing `batteryStep` equation with that duration; this model does not invent charging or solar contributions to the energy controller.

Initially `environment.enabled` is false. P1 retains its existing harmonic demonstration telemetry and the original scene water level remains at its assumed datum. Selecting environmental parameters or a preset enables the new model. Inspection, layer and current-visibility controls only change the display. Instantaneous controls record parameters/events at the current minute without mixing water, advancing time or discharging the battery. Global reset recreates the initial environment, history and speed.

The clock pauses mixing and battery integration together. Controlled recovery still advances one stage per timer tick: P0/P1 first, then P2, then P3. Its simulated delay therefore varies with playback speed; the sequence is an explanatory rule, not a validated electrical interlock or stability timer.

## Fixed-volume mixing boxes

The three conceptual boxes have assumed constant volumes:

| Box | Assumed volume |
| --- | ---: |
| A | 10,000 m³ |
| B | 8,000 m³ |
| C | 20,000 m³ |

Their initial salinities are 25.2, 28.4 and 31.2 ppt and temperatures are 29.1, 29.0 and 28.9°C. These are model initial conditions, not measurements at the proposed A/B/C markers. The boxes have no surveyed volume or flow connection. Their outputs are three well-mixed scalar states, not a resolved hydrodynamic field.

Let `F` be freshwater inflow, `Qab` and `Qbc` be symmetric exchange flows, and `Qsea` be exchange between C and an assumed sea boundary. Flow units are m³/min. For either concentration `c = salinity` or `c = temperature`, the model uses:

```text
VA dcA/dt = F(cf − cA) + Qab(cB − cA)
VB dcB/dt = F(cA − cB) + Qab(cA − cB) + Qbc(cC − cB)
VC dcC/dt = F(cB − cC) + Qbc(cB − cC) + Qsea(cs − cC)
```

For salt, the freshwater boundary is 0 ppt and the sea boundary is the chosen `seaSalinity`. For temperature, the two boundary temperatures are separate controls. Density and heat capacity are treated as constant and equal. There is no evaporative salt term, surface heat-flux model, stratification, sediment transport or oxygen model.

Symmetric A/B and B/C exchanges cancel in the volume-weighted total. The remaining boundary change is `F(cf − cC) + Qsea(cs − cC)`. Freshwater volume entering A is displaced through A→B→C and leaves C; this keeps the assumed box volumes constant. Tide does not enlarge or shrink these volumes.

Updates use simultaneous forward Euler values from the same previous state. Deterministic substeps limit the maximum outgoing fraction to 0.4 per substep, which keeps each scalar update a convex mixture of previous/boundary values. No random source or arbitrary rain-induced salinity jump is used. Internal exchange conserves volume-weighted salt/temperature up to floating-point rounding; external boundaries change the totals intentionally.

## Illustrative exchange and rain input

```text
alignment = 0.6 + 0.4 × |cos(currentDirection − 120°)|
tideFactor = clamp(1 + 0.35 × waterLevel, 0.5, 1.5)
Qab  = currentSpeed × 60 × 8  × alignment × tideFactor
Qbc  = currentSpeed × 60 × 12 × alignment × tideFactor
Qsea = seawaterExchange × tideFactor
F = freshwaterInflow + rain × 12,000 × 0.55 / 1,000 / 60
```

Current speed is m/s; the 8 and 12 m² exchange sections are assumptions. The rain calculation assumes a 12,000 m² catchment, 0.55 runoff coefficient and rainfall in mm/hour. These are adjustable-model assumptions with no surveyed drainage support. Current/wind directions refer to the schematic frame; north and true geographic bearings remain unconfirmed. The directional alignment is a mixing-strength proxy, not a directional fluid-flow solution.

Weather selection changes the assumed rain/wind/cloud/solar conditions immediately. Rain changes freshwater flux over subsequent integration steps. It does not change salinity instantly, raise tide automatically or create a sensor/communication fault.

## Water level, depth and clearance

The illustrative tide has a 720-minute period and ±0.6 m amplitude. High/low modes hold the corresponding endpoint; rising/falling modes use opposite phases of the same sinusoid; manual mode uses only the chosen offset. The reference hour plus global simulated minutes determines the displayed time of day. None of these are astronomical predictions for Songkhla.

Bathymetry is an original analytical assumed surface: a shallow bank, a Gaussian deeper channel and a Gaussian sandbar. The negative bed elevation is bounded between −6.2 and −0.4 assumed metres relative to the datum. Its relative placement is a composition choice; the image did not establish depth. JS `seabedElevationAt` and GLSL `assumedSeabedElevation` implement the same expression.

```text
localDepth = max(0, waterLevel − seabedElevation)
cageClearance = localDepth − assumedCageDepth
renderedWaterY = −0.115 + waterLevel × 0.25
renderedBedY = −0.115 + seabedElevation × 0.25
```

The vertical factor 0.25 compresses the scene for presentation. Default cage depth is 2.2 assumed metres. A clearance below an input threshold is a model planning warning, not evidence that a real cage touches the bed or a safe installation limit. The reconstruction has no validated floodplain/ground elevations or inundation volume model.

## Weather and independent solar estimate

The six weather presets supply synthetic rainfall, wind speed, cloud fraction and transmission. A deterministic daylight sine produces irradiance up to 1,000 W/m² before the chosen weather transmission. Solar output assumes 6 m² of panel area and 20% efficiency, giving up to 1.2 kW under the model's full irradiance. Temperature is a simple synthetic daily/weather curve. There is no live weather feed, verified panel rating, MPPT, loss model or charging simulation.

Wind direction is independent from current direction. Weather does not prove power failure. The explicit **storm preset** couples storm weather and a main-source outage in one state update and records both events. The **calm preset** restores main-source normal mode and clear weather while preserving reserve, faults, tide settings and event history. Neither preset recharges the battery.

## Telemetry quality and explicit synthetic water event

When the environmental model is enabled, P1 channels use box A's model output. Existing availability rules are retained: P1 unpowered/offline yields null salinity and temperature, while a salinity sensor fault alone keeps temperature available and salinity null. Environment history can still describe the underlying hypothetical water states while unavailable P1 telemetry remains absent.

With the environmental engine active, the existing water-change scenario applies an explicit one-time external perturbation to box A: salinity decreases by 3.5 ppt (clipped at zero) and temperature increases by 0.8°C. This intentionally changes the box's salt/heat inventory; subsequent internal mixing remains conservative. It is a synthetic input pulse, not a rain equation or an observation inferred from the color boundary. P1, environmental history and the 3D scalar layers read this same box state, with no separate continuing telemetry offset.

While the environmental engine is disabled, legacy water-change behavior remains unchanged. If that flag is already active when the engine is first enabled, the pulse is transferred into A exactly once on activation. Later parameter/preset changes do not repeat it. The normal electrical scenario can clear the legacy flag but does not undo the evolved water reservoirs. An explicit later water-change trigger can introduce another pulse; global reset recreates the initial reservoirs. DO stays absent in every state.

Environment history retains the latest 240 records, including instantaneous parameter records. Multiple records may share a minute; record count does not imply elapsed duration or a sampling rate. The whole environment is included in the exported simulated session for inspecting the assumptions and state.
