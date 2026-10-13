import test from 'node:test';
import assert from 'node:assert/strict';
import { CIRCUIT_NODES, CIRCUIT_NETS, netIsActive } from '../src/components/circuit/graph.ts';

test('circuit graph has real endpoints and the controller drives enable, never load current', () => {
  const ids = new Set(CIRCUIT_NODES.map(node => node.id));
  for (const net of CIRCUIT_NETS) {
    assert.ok(ids.has(net.fromNode), `missing origin for ${net.id}`);
    assert.ok(ids.has(net.toNode), `missing destination for ${net.id}`);
  }
  const enable = CIRCUIT_NETS.find(net => net.id === 'p0-driver');
  assert.equal(enable.kind, 'signal');
  assert.ok(CIRCUIT_NETS.some(net => net.toNode === 'driver' && net.kind === 'power'));
  assert.ok(!CIRCUIT_NETS.some(net => net.fromNode === 'esp32' && net.kind === 'power'));
});

test('outage disables grid input, preserves backup, and depleted storage stops the DC bus', () => {
  const input = CIRCUIT_NETS.find(net => net.id === 'source-fuse');
  const backup = CIRCUIT_NETS.find(net => net.id === 'charger-bus');
  const regulated = CIRCUIT_NETS.find(net => net.id === 'buck-p0');
  assert.equal(netIsActive(input, true, true, null), false);
  assert.equal(netIsActive(backup, true, true, null), true);
  assert.equal(netIsActive(regulated, true, true, null), true);
  assert.equal(netIsActive(backup, false, true, null), false);
  assert.equal(netIsActive(backup, true, false, null), false);
  assert.equal(netIsActive(regulated, true, false, null), false);
});

test('telemetry failure leaves power available; P1 cutoff preserves controller supply', () => {
  const load = CIRCUIT_NETS.find(net => net.id === 'sense-driver');
  const regulated = CIRCUIT_NETS.find(net => net.id === 'buck-p0');
  const monitorData = CIRCUIT_NETS.find(net => net.id === 'sense-p0');
  const sensorData = CIRCUIT_NETS.find(net => net.id === 'temp-p0');
  assert.equal(netIsActive(load, true, true, 'P0'), true);
  assert.equal(netIsActive(monitorData, true, true, 'P0'), false);
  assert.equal(netIsActive(sensorData, false, true, 'P1'), false);
  assert.equal(netIsActive(monitorData, false, true, 'P1'), true);
  assert.equal(netIsActive(load, true, true, null, false), false);
  assert.equal(netIsActive(regulated, true, true, null, false), true);
});
