import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){if(specifier==='./model')specifier='./model.ts';if(specifier.startsWith('@/lib/'))specifier=new URL('../src/lib/'+specifier.slice(6)+'.ts',import.meta.url).href;return next(specifier,context);}});
const {incidentJourney}=await import('../src/lib/incident-journey.ts');
const {usePowerguard,PG_STORAGE_KEY}=await import('../src/store/powerguard.ts');
const event=(type,n=0)=>({id:type+n,type,minute:n,severity:'info',nodeId:'SYSTEM',message:'',action:'',simulated:true});
test('isometric incident sequence uses source events and does not claim backup when empty',()=>{
 const events=[event('power-outage',2),event('power-sag',1),event('sim-start',0)];
 const rows=incidentJourney(events,'outage',.9,2);assert.equal(rows.length,6);assert.equal(rows[1].minute,1);assert.equal(rows[3].active,true);assert.equal(rows[5].seen,false);
 assert.equal(incidentJourney(events,'outage',0,2)[3].active,false);
 const recovered=incidentJourney([event('recovery-start',3),...events],'normal',.8,0);assert.equal(recovered[5].active,true);assert.equal(recovered[5].eventId,'recovery-start3');
});
test('three audience modes share engineering flag and persist without opting into audio',()=>{
 const memory=new Map();globalThis.window={};globalThis.localStorage={setItem:(k,v)=>memory.set(k,v),getItem:k=>memory.get(k)||null};
 try{const s=usePowerguard.getState();s.setSettings({audience:'operator'});assert.equal(usePowerguard.getState().engineering,false);assert.equal(usePowerguard.getState().audience,'operator');
 s.setSettings({audience:'engineer'});assert.equal(usePowerguard.getState().engineering,true);
 s.setSettings({engineering:false});assert.equal(usePowerguard.getState().audience,'community');
 s.setSettings({audience:'operator'});usePowerguard.setState({hydrated:false,audience:'community',soundEnabled:false});usePowerguard.getState().hydrate();assert.equal(usePowerguard.getState().audience,'operator');assert.equal(usePowerguard.getState().soundEnabled,false);assert.ok(memory.get(PG_STORAGE_KEY));
 }finally{delete globalThis.window;delete globalThis.localStorage;}
});
