import topology from '@/lib/prototype-topology.json';
export type CircuitPoint = [number, number, number];
export type CircuitNode = { id: string; name: string; x: number; y: number; w: number; h: number; pins: string[]; lift: number; group: string };
export type CircuitNet = { id: string; fromNode: string; toNode: string | null; from: [number, number]; to: [number, number]; net: string; kind: 'power' | 'signal' | 'ground'; path: 'grid' | 'solar' | 'backup' | 'bus' | 'local' | 'data' };
// Complete user-provided prototype flowchart. Edges remain proposed, not bench-verified.
export const CIRCUIT_NODES: CircuitNode[] = topology.nodes.map(n => ({...n, name:n.short}));
export const CIRCUIT_NETS = topology.edges as CircuitNet[];
export function assemblyPosition(node: CircuitNode, progress = 0): CircuitPoint {
 return [((node.x + node.w / 2) / 1000 - .5) * 11 * (1 + progress * .17), .1 + progress * node.lift, ((node.y + node.h / 2) / 520 - .5) * 6.5 * (1 + progress * .17)];
}
export function netIsActive(net: CircuitNet, outage: boolean, hasBackup: boolean, offline: string | null, loadPowered = true): boolean {
 // The existing pooled simulation is a visual policy demo, not a rail-level UPS model.
 void offline; void loadPowered;
 if (net.path === 'solar') return false; // sunlight/output/charge controller were not supplied
 if (net.path === 'grid') return !outage;
 if (net.path === 'backup') return outage && hasBackup;
 if (net.path === 'data') return false; // telemetry topology is proposed, not a live network
 return !outage || hasBackup;
}
