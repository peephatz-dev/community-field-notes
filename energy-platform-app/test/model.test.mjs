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
  assert.equal(Object.hasOwn(sample, 'dissolvedOxygen'), false);
});

test('sample sequence is deterministic for the same inputs', () => {
  assert.deepEqual(makeSample(9, 'sag', 0.7, null), makeSample(9, 'sag', 0.7, null));
});
