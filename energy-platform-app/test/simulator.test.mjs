import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { batteryStep, gridVoltage, makeSample } from '../src/lib/model.ts';

// Node's strip-types runner does not read tsconfig path aliases. Resolve only
// this store's local lib imports; production resolution stays unchanged.
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier.startsWith('@/lib/') ? new URL('../src/lib/'+specifier.slice(6)+'.ts', import.meta.url).href : specifier, context);
  },
});
const { useSimulator } = await import('../src/store/simulator.ts');

beforeEach(() => useSimulator.getState().reset());

function pauseAt(minute = 7, batterySoc = .7) {
  useSimulator.setState({ minute, batterySoc, running: false, samples: [makeSample(minute, 'normal', batterySoc, null)] });
}

test('outage immediately records voltage/load changes and an event while paused without consuming energy', () => {
  pauseAt();
  const prior = useSimulator.getState().samples.at(-1);
  useSimulator.getState().setScenario('outage');
  const state = useSimulator.getState(), latest = state.samples.at(-1);
  assert.equal(state.minute, 7);
  assert.equal(state.running, false);
  assert.equal(state.batterySoc, .7);
  assert.equal(latest.minute, 7);
  assert.equal(latest.voltage, 0);
  assert.equal(latest.battery, 70);
  assert.deepEqual([latest.p0, latest.p1, latest.p2, latest.p3], [30, 120, 80, 0]);
  assert.equal(state.samples.length, 2);
  assert.deepEqual(state.samples[0], prior);
  assert.equal(state.events[0].type, 'power-outage');
  assert.equal(state.events[0].minute, 7);
  assert.equal(state.events[0].simulated, true);
});

test('sag and normal scenario records update at the current minute with the explicit normal reset preserved', () => {
  pauseAt();
  useSimulator.getState().setScenario('sag');
  assert.equal(useSimulator.getState().samples.at(-1).voltage, gridVoltage('sag', 7));
  assert.equal(useSimulator.getState().batterySoc, .7);
  useSimulator.getState().setScenario('offline');
  useSimulator.getState().setScenario('sensor-fault');
  useSimulator.getState().setScenario('normal');
  const state = useSimulator.getState(), latest = state.samples.at(-1);
  assert.equal(state.minute, 7);
  assert.equal(state.batterySoc, 1); // The normal scenario explicitly resets SoC.
  assert.equal(state.running, true);
  assert.equal(state.nodeOffline, null);
  assert.equal(state.sensorFault, false);
  assert.equal(latest.voltage, gridVoltage('normal', 7));
  assert.equal(latest.battery, 100);
  assert.equal(typeof latest.salinity, 'number');
  assert.equal(latest.p3, 260);
  assert.equal(state.events[0].type, 'reset-normal');
});

test('low-battery scenario records exactly its assigned 34% before an elapsed-time step', () => {
  pauseAt();
  useSimulator.getState().setScenario('low-battery');
  const state = useSimulator.getState(), latest = state.samples.at(-1);
  assert.equal(state.minute, 7);
  assert.equal(state.running, false);
  assert.equal(state.batterySoc, .34);
  assert.equal(latest.battery, 34);
  assert.equal(latest.voltage, 0);
  assert.equal(latest.p2, 80);
  assert.equal(latest.p3, 0);
  assert.equal(state.events[0].type, 'battery-low');
});

test('sensor fault and recovery immediately expose a gap while temperature and DO boundaries stay intact', () => {
  pauseAt();
  const prior = useSimulator.getState().samples.at(-1);
  useSimulator.getState().setScenario('sensor-fault');
  let state = useSimulator.getState(), latest = state.samples.at(-1);
  assert.equal(latest.salinity, null);
  assert.equal(latest.temperature, prior.temperature);
  assert.equal(latest.minute, prior.minute);
  assert.equal(Object.hasOwn(latest, 'dissolvedOxygen'), false);
  assert.equal(state.batterySoc, .7);
  assert.equal(state.events[0].type, 'sensor-fault');
  state.toggleSensorFault();
  state = useSimulator.getState(); latest = state.samples.at(-1);
  assert.equal(latest.salinity, prior.salinity);
  assert.equal(state.events[0].type, 'sensor-recovered');
  assert.equal(state.minute, 7);
});

test('communication loss and recovery record an event without changing physical loads or sensor values', () => {
  pauseAt();
  const prior = useSimulator.getState().samples.at(-1);
  useSimulator.getState().setScenario('offline');
  let state = useSimulator.getState();
  assert.equal(state.nodeOffline, 'P2');
  assert.deepEqual(state.samples.at(-1), prior);
  assert.equal(state.samples.length, 2);
  assert.equal(state.events[0].type, 'node-offline');
  assert.equal(state.events[0].minute, 7);
  state.toggleOffline('P2');
  state = useSimulator.getState();
  assert.equal(state.nodeOffline, null);
  assert.deepEqual(state.samples.at(-1), prior);
  assert.equal(state.events[0].type, 'node-recovered');
  assert.equal(state.batterySoc, .7);
});

test('repeating an already active fault/mode does not manufacture extra samples or timeline events', () => {
  pauseAt();
  useSimulator.getState().setScenario('outage');
  useSimulator.getState().setScenario('offline');
  useSimulator.getState().setScenario('sensor-fault');
  const state = useSimulator.getState();
  state.setScenario('outage');
  state.setScenario('offline');
  state.setScenario('sensor-fault');
  state.toggleOffline('P0');
  assert.equal(useSimulator.getState().samples, state.samples);
  assert.equal(useSimulator.getState().events, state.events);
});

test('only a running step advances time and battery integration after an instantaneous transition', () => {
  pauseAt();
  useSimulator.getState().setScenario('outage');
  const paused = useSimulator.getState();
  paused.step();
  assert.equal(useSimulator.getState(), paused);
  paused.toggleRunning();
  useSimulator.getState().step();
  const state = useSimulator.getState();
  assert.equal(state.minute, 8);
  assert.equal(state.batterySoc, batteryStep(.7, 'outage', null, 1));
  assert.equal(state.samples.at(-1).minute, 8);
  assert.equal(state.samples.length, 3);
});

test('rapid transitions retain a bounded history and unique ordered events at the same simulated minute', () => {
  pauseAt();
  for (let i = 0; i < 100; i++) useSimulator.getState().setMode(i % 2 ? 'normal' : 'outage');
  const state = useSimulator.getState();
  assert.equal(state.samples.length, 40);
  assert.equal(state.events.length, 80);
  assert.equal(new Set(state.events.map(event => event.id)).size, 80);
  assert.ok(state.samples.every(sample => sample.minute === 7));
  assert.ok(state.events.every(event => event.minute === 7 && event.simulated));
  assert.equal(state.minute, 7);
  assert.equal(state.batterySoc, .7);
});

test('extended outage preserves existing reserve/history and integrates only when time runs', () => {
  pauseAt();
  const prior = useSimulator.getState().samples[0];
  useSimulator.getState().setScenario('extended-outage');
  let state = useSimulator.getState();
  assert.equal(state.batterySoc, .7);
  assert.equal(state.minute, 7);
  assert.equal(state.samples[0], prior);
  assert.equal(state.samples.at(-1).current, 19.167);
  assert.equal(state.events[0].type, 'extended-outage');
  state.toggleRunning(); state.step();
  state = useSimulator.getState();
  assert.equal(state.batterySoc, batteryStep(.7, 'outage', null, 1));
  assert.equal(state.minute, 8);
});

test('critical battery immediately shows only P0 can remain sustained under the existing reserve policy', () => {
  pauseAt();
  useSimulator.getState().setScenario('critical-battery');
  const state = useSimulator.getState(), latest = state.samples.at(-1);
  assert.equal(state.batterySoc, .07);
  assert.equal(state.minute, 7);
  assert.deepEqual([latest.p0, latest.p1, latest.p2, latest.p3], [30, 0, 0, 0]);
  assert.equal(latest.current, 2.5);
  assert.equal(state.events[0].severity, 'critical');
  assert.equal(state.events[0].type, 'battery-critical');
});

test('paused water-change records immediate synthetic values independently from power and keeps faults null', () => {
  pauseAt();
  const prior = useSimulator.getState().samples.at(-1);
  useSimulator.getState().setScenario('water-change');
  let state = useSimulator.getState(), latest = state.samples.at(-1);
  assert.equal(state.waterShift, true);
  assert.equal(state.mode, 'normal');
  assert.equal(state.minute, 7);
  assert.equal(state.batterySoc, .7);
  assert.equal(latest.current, prior.current);
  assert.ok(Math.abs(latest.salinity - (prior.salinity - 3.5)) < .001);
  assert.ok(Math.abs(latest.temperature - (prior.temperature + .8)) < .001);
  assert.equal(state.events[0].type, 'water-change');
  assert.equal(state.events[0].nodeId, 'P1');
  state.setScenario('sensor-fault');
  state = useSimulator.getState(); latest = state.samples.at(-1);
  assert.equal(latest.salinity, null);
  assert.equal(Object.hasOwn(latest, 'dissolvedOxygen'), false);
  state.setScenario('normal');
  assert.equal(useSimulator.getState().waterShift, false);
  assert.equal(useSimulator.getState().samples.at(-1).salinity, prior.salinity);
});

test('recovery preserves reserve/faults/history and restores main-powered loads in two simulated ticks', () => {
  pauseAt();
  useSimulator.getState().setScenario('offline');
  useSimulator.getState().setScenario('water-change');
  useSimulator.getState().setScenario('sensor-fault');
  useSimulator.getState().setScenario('critical-battery');
  const prior = useSimulator.getState(), eventIds = prior.events.map(e => e.id);
  prior.setScenario('recovery');
  let state = useSimulator.getState(), latest = state.samples.at(-1);
  assert.equal(state.mode, 'normal');
  assert.equal(state.recoveryStage, 0);
  assert.equal(state.running, false);
  assert.equal(state.batterySoc, .07);
  assert.equal(state.minute, 7);
  assert.equal(state.nodeOffline, 'P2');
  assert.equal(state.sensorFault, true);
  assert.equal(state.waterShift, true);
  assert.deepEqual([latest.p0, latest.p1, latest.p2, latest.p3], [30, 120, 0, 0]);
  assert.equal(latest.salinity, null);
  assert.equal(state.events[0].type, 'recovery-start');
  assert.deepEqual(state.events.slice(1).map(e => e.id), eventIds);
  state.step();
  assert.equal(useSimulator.getState().recoveryStage, 0);
  state.toggleRunning(); useSimulator.getState().step();
  state = useSimulator.getState(); latest = state.samples.at(-1);
  assert.equal(state.recoveryStage, 1);
  assert.equal(state.minute, 8);
  assert.equal(state.batterySoc, .07);
  assert.deepEqual([latest.p0, latest.p1, latest.p2, latest.p3], [30, 120, 80, 0]);
  assert.equal(state.events[0].type, 'recovery-p2');
  state.step();
  state = useSimulator.getState(); latest = state.samples.at(-1);
  assert.equal(state.recoveryStage, 2);
  assert.equal(state.minute, 9);
  assert.equal(state.batterySoc, .07);
  assert.deepEqual([latest.p0, latest.p1, latest.p2, latest.p3], [30, 120, 80, 260]);
  assert.equal(state.events[0].type, 'recovery-p3');
  const completedEvents = state.events;
  state.step();
  assert.equal(useSimulator.getState().events, completedEvents);
});

test('recovery interrupted by outage returns to the unchanged backup priority without phantom charging', () => {
  pauseAt();
  useSimulator.getState().setScenario('recovery');
  useSimulator.getState().setScenario('outage');
  const state = useSimulator.getState(), latest = state.samples.at(-1);
  assert.equal(state.mode, 'outage');
  assert.equal(state.recoveryStage, 2);
  assert.equal(state.batterySoc, .7);
  assert.equal(state.minute, 7);
  assert.deepEqual([latest.p0, latest.p1, latest.p2, latest.p3], [30, 120, 80, 0]);
});

test('running outage crossing the P1 reserve boundary emits a critical event and retains P0', () => {
  pauseAt(7, .081);
  useSimulator.getState().setScenario('extended-outage');
  useSimulator.getState().toggleRunning();
  useSimulator.getState().step();
  const state = useSimulator.getState(), latest = state.samples.at(-1);
  assert.ok(state.batterySoc < .08);
  assert.equal(latest.p0, 30);
  assert.equal(latest.p1, 0);
  assert.equal(state.events[0].type, 'battery-critical');
  assert.equal(state.events[0].nodeId, 'P1');
});

test('P1 loss and restoration immediately record water-history gaps with quality instead of fresh invented telemetry', () => {
  pauseAt();
  useSimulator.getState().toggleOffline('P1');
  let state = useSimulator.getState(), latest = state.samples.at(-1);
  assert.equal(latest.p1Quality, 'offline');
  assert.equal(latest.salinity, null);
  assert.equal(latest.temperature, null);
  assert.equal(latest.p1, 120);
  assert.equal(state.minute, 7);
  state.toggleOffline('P1');
  state = useSimulator.getState(); latest = state.samples.at(-1);
  assert.equal(latest.p1Quality, 'available');
  assert.equal(typeof latest.temperature, 'number');
  state.setScenario('critical-battery');
  state = useSimulator.getState(); latest = state.samples.at(-1);
  assert.equal(latest.p1Quality, 'unpowered');
  assert.equal(latest.salinity, null);
  assert.equal(latest.temperature, null);
  state.setScenario('recovery');
  state = useSimulator.getState(); latest = state.samples.at(-1);
  assert.equal(latest.p1Quality, 'available');
  assert.equal(typeof latest.salinity, 'number');
  assert.equal(typeof latest.temperature, 'number');
  assert.equal(state.minute, 7);
  assert.equal(state.batterySoc, .07);
});
