import test from 'node:test';
import assert from 'node:assert/strict';
import { activeLoad, batteryStep, calcPower, gridVoltage, makeSample } from '../src/lib/model.ts';

test('backup policy preserves P0 and P1, sheds P3 first', () => {
  assert.equal(activeLoad('P0', 'outage', 1, null), true);
  assert.equal(activeLoad('P1', 'outage', 1, null), true);
  assert.equal(activeLoad('P2', 'outage', 1, null), true);
  assert.equal(activeLoad('P3', 'outage', 1, null), false);
  assert.equal(calcPower('outage', 1, null), 230);
});

test('P2 is shed below the demo threshold; P0/P1 remain above reserve', () => {
  assert.equal(activeLoad('P2', 'outage', 0.27, null), false);
  assert.equal(activeLoad('P0', 'outage', 0.27, null), true);
  assert.equal(activeLoad('P1', 'outage', 0.27, null), true);
});

test('battery energy decreases according to active modeled load', () => {
  const next = batteryStep(1, 'outage', null, 60);
  assert.ok(Math.abs(next - (1 - 230 / 1200)) < 1e-9);
  assert.equal(batteryStep(0.5, 'normal', null, 60), 0.5);
});

test('battery state never falls below zero', () => {
  assert.equal(batteryStep(0.01, 'outage', null, 600), 0);
});

test('normal, sag and outage voltages are distinct state signals', () => {
  assert.ok(gridVoltage('normal', 0) > 12);
  assert.ok(gridVoltage('sag', 0) < 10);
  assert.equal(gridVoltage('outage', 0), 0);
});

test('offline communication status does not change the modeled electrical load', () => {
  assert.equal(activeLoad('P2', 'normal', 1, 'P2'), true);
  assert.equal(calcPower('outage', 1, 'P2'), calcPower('outage', 1, null));
});

test('water sensor fault can leave sensor channels absent instead of inventing values', () => {
  const sample = makeSample(10, 'normal', 1, null);
  assert.equal(typeof sample.salinity, 'number');
  assert.equal(typeof sample.temperature, 'number');
  const faultSample = makeSample(10, 'normal', 1, null, true);
  assert.equal(faultSample.salinity, null);
  assert.equal(faultSample.temperature, sample.temperature);
  assert.equal(Object.hasOwn(faultSample, 'dissolvedOxygen'), false);
});

test('sample sequence is deterministic for the same inputs', () => {
  assert.deepEqual(makeSample(9, 'sag', 0.7, null), makeSample(9, 'sag', 0.7, null));
});

test('controlled main-source recovery restores P0/P1, then P2, then P3 without altering outage priority', () => {
  assert.equal(calcPower('normal', 0, null, 0), 150);
  assert.equal(calcPower('normal', 0, null, 1), 230);
  assert.equal(calcPower('normal', 0, null, 2), 490);
  assert.equal(activeLoad('P1', 'normal', 0, null, 0), true);
  assert.equal(activeLoad('P2', 'normal', 0, null, 0), false);
  assert.equal(activeLoad('P3', 'normal', 0, null, 1), false);
  assert.equal(calcPower('outage', .7, null, 0), 230);
  assert.equal(calcPower('outage', .7, null, 2), 230);
});

test('DC current uses the same modeled load and separates failed main supply from powered backup bus', () => {
  const normal = makeSample(0, 'normal', 1, null);
  assert.ok(Math.abs(normal.current - 490 / 12.1) < .001);
  const outage = makeSample(0, 'outage', 1, null);
  assert.equal(outage.voltage, 0);
  assert.equal(outage.busVoltage, 12);
  assert.ok(Math.abs(outage.current - 230 / 12) < .001);
  const critical = makeSample(0, 'outage', .07, null);
  assert.equal(critical.current, 2.5);
  const empty = makeSample(0, 'outage', 0, null);
  assert.equal(empty.busVoltage, 0);
  assert.equal(empty.current, 0);
  assert.ok(Number.isFinite(empty.current));
});

test('synthetic water change is an independent input and preserves sensor-fault/DO boundaries', () => {
  const base = makeSample(0, 'normal', 1, null);
  const shifted = makeSample(0, 'normal', 1, null, false, true);
  assert.equal(shifted.salinity, 21.7);
  assert.equal(shifted.temperature, 29.9);
  assert.equal(shifted.voltage, base.voltage);
  assert.equal(shifted.current, base.current);
  const fault = makeSample(0, 'normal', 1, null, true, true);
  assert.equal(fault.salinity, null);
  assert.equal(fault.temperature, shifted.temperature);
  assert.equal(Object.hasOwn(fault, 'dissolvedOxygen'), false);
});

test('P1 telemetry becomes absent when its power or communication is unavailable without removing physical load', () => {
  const offline = makeSample(0, 'normal', 1, 'P1');
  assert.equal(offline.p1Quality, 'offline');
  assert.equal(offline.salinity, null);
  assert.equal(offline.temperature, null);
  assert.equal(offline.p1, 120);
  const cut = makeSample(0, 'outage', .07, null, false, true);
  assert.equal(cut.p1Quality, 'unpowered');
  assert.equal(cut.salinity, null);
  assert.equal(cut.temperature, null);
  const restored = makeSample(0, 'normal', .07, null, true, true, 0);
  assert.equal(restored.p1Quality, 'sensor-fault');
  assert.equal(restored.salinity, null);
  assert.equal(restored.temperature, 29.9);
  assert.equal(makeSample(0, 'normal', 1, null).p1Quality, 'available');
});
