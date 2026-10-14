import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
import {noticesFromEvent,mergeNotices,validNotice,calculatePlan,validPlan,INITIAL_PLAN,simpleText} from '../src/lib/powerguard-model.ts';
import {PowerguardAudio} from '../src/lib/powerguard-audio.ts';
import {thaiVoice,speakThai,stopThai} from '../src/lib/powerguard-speech.ts';
registerHooks({resolve(specifier,context,nextResolve){return nextResolve(specifier.startsWith('@/lib/')?new URL('../src/lib/'+specifier.slice(6)+'.ts',import.meta.url).href:specifier,context);}});
const {usePowerguard,PG_STORAGE_KEY}=await import('../src/store/powerguard.ts');
const root=new URL('../',import.meta.url),audio=JSON.parse(await readFile(new URL('src/lib/powerguard/audio-manifest.json',root),'utf8'));
const event=(type,severity='warning')=>({id:'event-'+type,minute:3,nodeId:'SYSTEM',type,severity,message:'test',action:'P0 ตรวจข้อมูล',simulated:true});
const notice=()=>noticesFromEvent(event('power-outage','critical'),'episode-a',true,'2026-10-14T00:00:00Z')[0];

test('real SVG pack inventory has 115 complete files and five vector mascot moods',async()=>{
 const manifest=JSON.parse(await readFile(new URL('public/powerguard/ASSET_MANIFEST.json',root),'utf8'));
 assert.equal(manifest.total,115);assert.equal(manifest.assets.length,115);
 for(const a of manifest.assets){const data=await readFile(new URL('public'+a.path,root));assert.equal(data.length,a.bytes,a.path);}
 for(const mood of ['happy','thinking','warning','critical','success']){const svg=await readFile(new URL(`public/powerguard/mascot/seabass-${mood}.svg`,root),'utf8');assert.match(svg,/<svg\b/);assert.match(svg,/<path\b/);assert.doesNotMatch(svg,/<image\b|data:image/i);}
});
test('all eleven UI sounds and five ambiences have local alternatives',async()=>{
 assert.equal(Object.values(audio).filter(x=>x.category==='ui').length,11);
 assert.equal(Object.values(audio).filter(x=>x.category==='ambient').length,5);
 for(const entry of Object.values(audio))for(const path of [entry.file,entry.fallback,entry.wav]){const data=await readFile(new URL('public'+path,root));assert.ok(data.length>100);if(path.endsWith('.wav')){assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WAVE');}}
});
test('outage and backup records come from one real source event and deduplicate',()=>{
 const incoming=noticesFromEvent(event('power-outage','critical'),'a',true,'2026-10-14T00:00:00Z');assert.deepEqual(incoming.map(n=>n.kind),['MAIN_POWER_OUTAGE','BACKUP_POWER_ENGAGED']);
 const first=mergeNotices([],incoming),again=mergeNotices(first.history,incoming);assert.equal(first.history.length,2);assert.equal(again.added.length,0);
 assert.equal(noticesFromEvent(event('power-outage','critical'),'b',false,'2026-10-14T00:00:00Z').length,1);
});
test('all electrical/quality/recovery events classify without converting offline to outage',()=>{
 for(const [type,kind] of [['power-sag','VOLTAGE_SAG_DETECTED'],['battery-low','BATTERY_LOW'],['battery-depleted','BATTERY_LOW'],['recovery-start','SOURCE_RESTORED'],['node-offline','NODE_OFFLINE'],['node-recovered','NODE_RECOVERED'],['sensor-fault','SENSOR_FAULT'],['sensor-recovered','SENSOR_RECOVERED'],['reset-normal','POWER_NORMAL'],['water-change','WATER_CHANGE']])assert.equal(noticesFromEvent(event(type),'a',false,'2026-10-14T00:00:00Z')[0].kind,kind);
 assert.equal(noticesFromEvent(event('environment-options'),'a',true,'2026-10-14T00:00:00Z').length,0);assert.doesNotMatch(simpleText('P0 > P1 > P2 > P3'),/P[0-3]/);
});
test('critical records survive ordinary-history bounds and invalid persisted dates are rejected',()=>{
 const critical=notice(),rows=Array.from({length:350},(_,i)=>({...critical,id:'info-'+i,severity:'info'}));const result=mergeNotices([critical],rows);
 assert.ok(result.history.some(n=>n.id===critical.id));assert.equal(result.history.filter(n=>n.severity!=='critical').length,300);assert.equal(validNotice({...critical,createdAt:'bad'}),false);
});
test('notification acknowledgements, resolution and plan persist; reload does not enable audio',()=>{
 const memory=new Map();globalThis.window={};globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
 try{usePowerguard.setState({hydrated:false,history:[],toasts:[],engineering:false,soundEnabled:false});usePowerguard.getState().hydrate();const n=notice();usePowerguard.getState().ingest([n]);usePowerguard.getState().acknowledge(n.id);usePowerguard.getState().resolve(n.id,'ตรวจแล้ว');usePowerguard.getState().setSettings({soundEnabled:true,sfxVolume:.2});const p={...structuredClone(INITIAL_PLAN),hours:3};usePowerguard.getState().savePlan(p);usePowerguard.getState().savePlan({...p,efficiency:0});assert.equal(usePowerguard.getState().plan.efficiency,.8);
  assert.ok(memory.has(PG_STORAGE_KEY));usePowerguard.setState({hydrated:false,history:[],toasts:[],soundEnabled:false,ambientOn:false,musicOn:false});usePowerguard.getState().hydrate();const state=usePowerguard.getState();assert.equal(state.history[0].resolution,'ตรวจแล้ว');assert.ok(state.history[0].acknowledgedAt);assert.equal(state.history[0].severity,'critical');assert.equal(state.plan.hours,3);assert.equal(state.soundEnabled,false);assert.equal(state.sfxVolume,.2);
 }finally{delete globalThis.window;delete globalThis.localStorage;}
});
test('backup plan handles missing prices, UPS power/runtime and invalid inputs',()=>{
 const p=structuredClone(INITIAL_PLAN),r=calculatePlan(p);assert.equal(r.watts,150);assert.ok(Math.abs(r.requiredWh-468.75)<1e-9);assert.equal(r.cost,null);assert.equal(r.upsLoadFits,true);
 p.unitPrice=4;p.installation=100;assert.equal(calculatePlan(p).cost,1975);p.upsWatts=100;assert.equal(calculatePlan(p).upsLoadFits,false);assert.equal(validPlan({...p,efficiency:0}),false);assert.equal(validPlan({...p,unitPrice:-1}),false);assert.equal(validPlan(INITIAL_PLAN),true);
});
class FakeAudio{src='';preload='';loop=false;volume=1;currentTime=0;paused=true;style={};calls=0;attributes={};canPlayType(){return 'probably';}setAttribute(k,v){this.attributes[k]=v;}addEventListener(){}remove(){}async play(){this.calls++;this.paused=false;}pause(){this.paused=true;}}
const prefs={enabled:true,muted:false,sfxVolume:.5,ambientVolume:.5,musicVolume:.5,ambientOn:false,musicOn:false,ambientId:'ocean-waves'};
test('audio requires opt-in, plays every UI sound and updates volume/mute',async()=>{
 const players=[],controller=new PowerguardAudio(audio,p=>p,()=>{const p=new FakeAudio();players.push(p);return p;});controller.configure(prefs);assert.equal(players.length,0);assert.equal(await controller.play('click'),false);controller.unlock();
 for(const [id,entry] of Object.entries(audio).filter(([,e])=>e.category==='ui')){assert.equal(await controller.play(id),true);assert.equal(players.find(p=>p.attributes['data-pg-audio']===id).volume,entry.defaultVolume*.5);}
 controller.configure({...prefs,sfxVolume:0});assert.ok(players.every(p=>p.volume===0));controller.configure({...prefs,muted:true});assert.ok(players.every(p=>p.paused));assert.equal(await controller.play('click'),false);controller.dispose();
});
test('only one ambience plus music play and visibility pauses/resumes them',async()=>{
 const players=[],controller=new PowerguardAudio(audio,p=>p,()=>{const p=new FakeAudio();players.push(p);return p;});controller.unlock();controller.configure({...prefs,ambientOn:true,musicOn:true});await Promise.resolve();
 assert.equal(players.filter(p=>!p.paused).length,2);controller.configure({...prefs,ambientOn:true,musicOn:true,ambientId:'rain-heavy'});await Promise.resolve();assert.equal(players.filter(p=>!p.paused).length,2);assert.equal(players.find(p=>p.attributes['data-pg-audio']==='ocean-waves').paused,true);
 controller.setHidden(true);assert.ok(players.every(p=>p.paused));controller.setHidden(false);await Promise.resolve();assert.equal(players.filter(p=>!p.paused).length,2);controller.dispose();
});
test('speech chooses a Thai voice and falls back without a browser',()=>{
 assert.equal(thaiVoice([{lang:'en-US',localService:true}]),null);const voice={lang:'th-TH',localService:true};assert.equal(thaiVoice([{lang:'en-US'},voice]),voice);assert.equal(speakThai('ไฟปกติ',{start(){},end(){},error(){}}),false);
});
test('intentional speech stop reports completion once instead of a playback error',()=>{
 let utterance;const calls={start:0,end:0,error:0};globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 globalThis.window={speechSynthesis:{getVoices:()=>[{lang:'th-TH',localService:true}],speak:u=>{utterance=u;u.onstart();},cancel:()=>utterance?.onerror?.()}};
 try{assert.equal(speakThai('ไฟปกติ',{start:()=>calls.start++,end:()=>calls.end++,error:()=>calls.error++}),true);stopThai();assert.deepEqual(calls,{start:1,end:1,error:0});}
 finally{delete globalThis.window;delete globalThis.SpeechSynthesisUtterance;}
});
