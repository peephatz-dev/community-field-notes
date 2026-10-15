# Engineering Notes

> Current prototype reference: [partial user flowchart, 15 October 2026](prototype-flowchart.md). P0 uses ESP32-S3, Mini Solar, two listed 18650 cells and Dual-Rail UPS. P1 lists its own battery, Single-Rail UPS and ESP32. Connections for P1 and P2/P3 remain incomplete. The following numerical model and telemetry examples describe the existing browser demonstrator, not measured or specified prototype hardware.

## System states

- Power: normal, voltage sag, outage, backup operation.
- Connectivity: online, stale, offline by time since last packet.
- Sensor quality: valid, suspect, fault.
- Water condition: unavailable until sensor measurements and validated thresholds exist.

Do not collapse these into one alarm state.

## Load policy shown by the demonstrator

1. Keep P0 control/gateway state alive when available reserve permits.
2. Preserve P1 demonstration/critical loads next.
3. Shed P3 first when using backup.
4. Shed P2 below the demonstrator threshold.
5. Enforce a reserve boundary on P1 and protect P0 at empty state.

This policy order follows the team's priority statement; exact load behavior, emergency reserve and thresholds require field and engineering validation.

## Telemetry example

```json
{
  "simulated": true,
  "node_id": "P1",
  "seq": 104,
  "timestamp": "T+00:04",
  "received_at": "T+00:04",
  "voltage": 12.1,
  "current": 0.8,
  "power_state": "NORMAL",
  "battery_soc": 100,
  "load_state": "ON",
  "online_status": "ONLINE",
  "last_seen": "T+00:04",
  "sensor_quality": "DEMO",
  "salinity": 25.4,
  "water_temperature": 29.2,
  "dissolved_oxygen": null
}
```

All numeric values above are illustrative and must not be used for real operating limits.

## Proposed bill of materials (unselected)

| Part | Purpose | Status / missing decision |
|---|---|---|
| DC supply | Demonstration source | Set nominal voltage, current limit, isolation, and laboratory protection. |
| Fuse / reverse-polarity protection | Protect input and branch | Rating and location must follow wire, source and load review. |
| Battery + compatible BMS/charger | Backup energy | Chemistry, voltage, capacity, charge profile, cutoff, temperature and enclosure are unknown. |
| DC-DC regulators | Rails for controller/sensors | Select module after board and sensor specifications are known. |
| ESP32 development board | Control / telemetry | Reference device only; GPIO is a logic signal, never a high-current driver. |
| Voltage/current monitor | Observe source/load | Device, range, shunt, isolation and calibration are not selected. |
| Driver/switch module | Switch low-voltage demo loads | Need rated driver, protection and load type review. |
| Temperature probe | Observe water temperature | Exact probe, interface, waterproofing and calibration are unknown. |
| Conductivity/salinity interface | Observe conductivity-derived salinity | Requires suitable excitation/interface, temperature compensation and reference calibration. |
| DO sensor | Not included | DO remains unavailable in this platform. |

## Test plan in code

Use the built-in Node test runner for deterministic policy calculations. Browser-level checks should verify navigation and simulator interaction in a WebGL-capable browser; a production bundle build alone does not prove hardware safety or field effectiveness.

## Instantaneous scenario records

Changing the power mode, assigning a scenario, toggling node connectivity, or changing sensor quality records a new sample and its timeline event in one store update. The record uses the current simulated minute, including while the clock is paused. It does not advance time or integrate battery consumption. The normal and low-battery scenarios retain their explicit assignments of 100% and 34% state of charge respectively; those assignments are demo inputs, not charging or discharging measurements.

Several records may share a minute when the user changes scenarios before the next timer tick. Preserve their insertion order when reviewing JSON/CSV exports. History is bounded to the latest 40 samples and 80 events; 40 samples do not necessarily represent 40 elapsed minutes. Only a running `step()` advances one simulated minute and applies the unchanged energy calculation.

Node connectivity remains separate from modeled electrical load: an offline record does not set its load to zero. Salinity fault records contain `null` while the independent temperature channel remains available. Neither water color nor reconstructed site position feeds the simulated water measurements, and dissolved oxygen remains absent.

`test/simulator.test.mjs` exercises immediate paused-state records, sag/outage/reset behavior, the low-battery assignment, sensor recovery, offline load independence, repeated-action deduplication, elapsed-time stepping and bounded history. The controller demonstration should invoke `setScenario('outage')` at its outage phase so power, history and timeline use the same state transition.

## Additional scenario inputs and recovery

- `extended-outage` continues with the current reserve and records the event; it does not refill or pre-drain the battery. Running time uses the same existing energy calculation.
- `critical-battery` explicitly assigns 7% SoC with the main source unavailable. This is below the demonstrator's P1 reserve boundary of 8%, so only the 30 W P0 load remains powered. The scenario is a synthetic input, not an actual battery reading or operating recommendation.
- `water-change` independently subtracts 3.5 ppt from the generated salinity channel and adds 0.8°C to the generated temperature channel. These are scenario inputs, never values inferred from site imagery, water colors or monitoring zones. A concurrent salinity fault still yields `null`, and no DO value is created.
- `recovery` restores the main source and powers P0/P1 first, then P2 after one simulated tick, then P3 after another. It preserves current SoC, event history, water-change input, node connectivity and sensor faults. A paused clock pauses this sequence. The two delays are demonstration rules; there is no validated voltage-stability timer, hardware interlock or charging model.

The optional `recoveryStage` argument on load/power/sample functions defaults to 2, preserving the previous full-load behavior. All scene and dashboard load-state consumers should pass the store's stage during controlled recovery. The circuit concept's P1 load is restored in stage 0 and therefore has the same result at every stage.

Samples contain `voltage` for the main DC source, `busVoltage` for the hypothetical load bus and `current` for the aggregate modeled DC load-bus current. During an outage with reserve, the main source is 0 V while the illustrative regulated backup bus is 12 V. Current is active modeled watts divided by that bus voltage; it is 0 when the bus is unavailable. This simplified constant-power calculation excludes conversion losses, startup transients, battery discharge curves and wire ratings. It is not household AC mains current and does not establish a component or installation rating.
