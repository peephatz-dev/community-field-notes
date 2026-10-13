# Engineering Notes

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
