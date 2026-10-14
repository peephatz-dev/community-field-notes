import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { advanceEnvironment, createEnvironmentState, environmentReadout, ENVIRONMENT_VOLUMES } from '../src/lib/environment-model.ts';

registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier.startsWith('@/lib/') ? new URL('../src/lib/'+specifier.slice(6)+'.ts', import.meta.url).href : specifier, context);
}});
const { useSimulator } = await import('../src/store/simulator.ts');

test('closed illustrative boxes conserve salt and temperature during internal exchange', () => {
  const env={...createEnvironmentState(),enabled:true,freshwaterInflow:0,seawaterExchange:0};
  const next=advanceEnvironment(env,20,20);
  for(const key of ['salinity','temperature']) {
    const mass=e=>Object.entries(ENVIRONMENT_VOLUMES).reduce((sum,[zone,volume])=>sum+volume*e.zones[zone][key],0);
    assert.ok(Math.abs(mass(next)-mass(env))<1e-7);
  }
});

test('assumed high and low tides change depth by the same surface-level difference', () => {
  const env={...createEnvironmentState(),enabled:true,inspectPoint:[.8,.8]};
  const high=environmentReadout({...env,tideMode:'high'},0),low=environmentReadout({...env,tideMode:'low'},0);
  assert.ok(Math.abs((high.localDepth-low.localDepth)-1.2)<1e-9);
  assert.equal(high.cageClearance,high.localDepth-env.cageDepth);
});

test('rain stays electrically independent; storm shares one state and reset restores initial conditions', () => {
  const sim=useSimulator;sim.getState().reset();sim.setState({running:false});
  sim.getState().setEnvironmentPreset('rain');
  assert.equal(sim.getState().mode,'normal');assert.equal(sim.getState().minute,0);assert.equal(sim.getState().batterySoc,1);
  sim.getState().setEnvironmentPreset('storm');
  let state=sim.getState(),sample=state.samples.at(-1);
  assert.equal(state.environment.weather,'storm');assert.equal(state.mode,'outage');assert.equal(sample.p3,0);assert.equal(sample.p1,120);
  assert.equal(sample.salinity,Number(state.environment.zones.A.salinity.toFixed(1)));
  sim.getState().setScenario('water-change');state=sim.getState();
  assert.equal(state.samples.at(-1).salinity,Number(state.environment.zones.A.salinity.toFixed(1)));
  sim.getState().reset();state=sim.getState();
  assert.equal(state.minute,0);assert.equal(state.batterySoc,1);assert.deepEqual(state.environment,createEnvironmentState());
});
