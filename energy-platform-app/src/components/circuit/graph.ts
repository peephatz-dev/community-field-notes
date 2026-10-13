export type CircuitPoint = [number, number, number];
export type CircuitNode = { id: string; name: string; x: number; y: number; w: number; h: number; pins: string[]; lift: number };
export type CircuitNet = { id: string; fromNode: string; toNode: string; from: [number, number]; to: [number, number]; net: string; kind: 'power' | 'signal' | 'ground'; path: 'grid' | 'backup' | 'bus' | 'data' };

// The schematic and the physical assembly are projections of this one graph.
// Paths are explanatory. Connector positions, ratings and interfaces require hardware review.
export const CIRCUIT_NODES: CircuitNode[] = [
  { id: 'source', name: 'DC INPUT', x: 40, y: 130, w: 102, h: 62, pins: ['12V+', 'DC−'], lift: .45 },
  { id: 'fuse', name: 'F1 · DC FUSE', x: 208, y: 130, w: 108, h: 62, pins: ['IN', 'OUT'], lift: .8 },
  { id: 'bus', name: 'DC DISTRIBUTION', x: 388, y: 130, w: 126, h: 62, pins: ['POWER PATH*', 'DC−'], lift: 1.15 },
  { id: 'buck', name: 'DC-DC REGULATOR', x: 578, y: 48, w: 132, h: 62, pins: ['12V IN', 'REG OUT*'], lift: 1.9 },
  { id: 'esp32', name: 'P0 · ESP32', x: 787, y: 48, w: 130, h: 62, pins: ['3V3', 'GPIO', 'RADIO'], lift: 2.65 },
  { id: 'battery', name: 'BATTERY · MODEL', x: 388, y: 314, w: 126, h: 62, pins: ['BAT+', 'BAT−'], lift: 1.05 },
  { id: 'charger', name: 'CHARGE / BMS*', x: 198, y: 314, w: 128, h: 62, pins: ['INPUT', 'BAT', 'OUT'], lift: 1.5 },
  { id: 'sense', name: 'V / I MONITOR', x: 578, y: 198, w: 132, h: 62, pins: ['SHUNT', 'I²C*'], lift: 1.7 },
  { id: 'driver', name: 'DRIVER + SWITCH*', x: 787, y: 198, w: 130, h: 62, pins: ['EN', 'POWER', 'LOAD'], lift: 2.25 },
  { id: 'salinity', name: 'EC INTERFACE*', x: 578, y: 380, w: 132, h: 62, pins: ['EC PROBE', 'ADC*'], lift: 1.55 },
  { id: 'temp', name: 'TEMP PROBE*', x: 787, y: 380, w: 130, h: 62, pins: ['CONDITIONED DATA*'], lift: 2.15 },
];

export const CIRCUIT_NETS: CircuitNet[] = [
  { id: 'source-fuse', fromNode: 'source', toNode: 'fuse', from: [142, 147], to: [208, 147], net: '12V_DC', kind: 'power', path: 'grid' },
  { id: 'fuse-bus', fromNode: 'fuse', toNode: 'bus', from: [316, 147], to: [388, 147], net: 'FUSED_12V', kind: 'power', path: 'grid' },
  { id: 'fuse-charger', fromNode: 'fuse', toNode: 'charger', from: [262, 192], to: [262, 314], net: 'CHARGER INPUT*', kind: 'power', path: 'grid' },
  { id: 'battery-charger', fromNode: 'battery', toNode: 'charger', from: [388, 345], to: [326, 345], net: 'BAT±*', kind: 'power', path: 'backup' },
  { id: 'charger-bus', fromNode: 'charger', toNode: 'bus', from: [326, 328], to: [410, 192], net: 'BACKUP / OR-ING*', kind: 'power', path: 'backup' },
  { id: 'bus-buck', fromNode: 'bus', toNode: 'buck', from: [514, 148], to: [578, 79], net: 'DC+', kind: 'power', path: 'bus' },
  { id: 'buck-p0', fromNode: 'buck', toNode: 'esp32', from: [710, 79], to: [787, 79], net: 'REGULATED*', kind: 'power', path: 'bus' },
  { id: 'bus-sense', fromNode: 'bus', toNode: 'sense', from: [514, 171], to: [578, 222], net: 'LOAD DC+', kind: 'power', path: 'bus' },
  { id: 'sense-driver', fromNode: 'sense', toNode: 'driver', from: [710, 222], to: [787, 222], net: 'LOAD POWER', kind: 'power', path: 'bus' },
  { id: 'common-return', fromNode: 'bus', toNode: 'driver', from: [451, 192], to: [852, 260], net: 'COMMON DC−*', kind: 'ground', path: 'bus' },
  { id: 'sense-p0', fromNode: 'sense', toNode: 'esp32', from: [710, 243], to: [810, 110], net: 'I²C*', kind: 'signal', path: 'data' },
  { id: 'p0-driver', fromNode: 'esp32', toNode: 'driver', from: [880, 110], to: [880, 198], net: 'GPIO → EN ONLY', kind: 'signal', path: 'data' },
  { id: 'ec-p0', fromNode: 'salinity', toNode: 'esp32', from: [710, 411], to: [917, 79], net: 'EC DATA*', kind: 'signal', path: 'data' },
  { id: 'temp-p0', fromNode: 'temp', toNode: 'esp32', from: [917, 411], to: [917, 97], net: 'TEMP DATA*', kind: 'signal', path: 'data' },
];

export function assemblyPosition(node: CircuitNode, progress = 0): CircuitPoint {
  return [((node.x + node.w / 2) / 980 - .5) * 11 * (1 + progress * .17), .1 + progress * node.lift, ((node.y + node.h / 2) / 490 - .5) * 6.5 * (1 + progress * .17)];
}

export function netIsActive(net: CircuitNet, outage: boolean, hasBackup: boolean, offline: string | null, loadPowered = true): boolean {
  if (net.path === 'data') return (!outage || hasBackup) && offline !== 'P0' && (!(net.fromNode === 'salinity' || net.fromNode === 'temp') || offline !== 'P1');
  if (net.path === 'grid') return !outage;
  if (net.path === 'backup') return outage && hasBackup;
  if (net.id === 'bus-sense' || net.id === 'sense-driver' || net.id === 'common-return') return (!outage || hasBackup) && loadPowered;
  return !outage || hasBackup;
}
