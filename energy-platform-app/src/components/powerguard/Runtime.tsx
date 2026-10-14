'use client';
import {useEffect} from 'react';
import Link from 'next/link';
import {X} from 'lucide-react';
import {useSimulator} from '@/store/simulator';
import {usePowerguard} from '@/store/powerguard';
import {noticesFromEvent} from '@/lib/powerguard-model';
import {PowerguardAudio,type AudioPreferences} from '@/lib/powerguard-audio';
import {stopThai} from '@/lib/powerguard-speech';
import {assetUrl} from '@/lib/urls';
import audioManifest from '@/lib/powerguard/audio-manifest.json';
import notificationAssets from '@/lib/powerguard/notification-assets.json';

let engine:PowerguardAudio|null=null;
export function pgAudio(){if(!engine&&typeof window!=='undefined')engine=new PowerguardAudio(audioManifest,assetUrl,()=>document.createElement('audio'),(status,id)=>usePowerguard.getState().setAudioStatus(status,id));return engine;}
export function audioPreferences():AudioPreferences{
 const ui=usePowerguard.getState(),weather=useSimulator.getState().environment.weather;
 const automatic=weather==='monsoon'||weather==='storm'?'rain-heavy':weather==='light-rain'?'rain-light':weather==='wind'?'sea-wind':'ocean-waves';
 return {enabled:ui.soundEnabled,muted:ui.muted,sfxVolume:ui.sfxVolume,ambientVolume:ui.ambientVolume,musicVolume:ui.musicVolume,ambientOn:ui.ambientOn,musicOn:ui.musicOn,ambientId:ui.ambientChoice==='auto'?automatic:ui.ambientChoice};
}
export function playSound(id:string){const audio=pgAudio();audio?.configure(audioPreferences());return audio?.play(id);}
export function setSoundEnabled(enabled:boolean){if(enabled)pgAudio()?.unlock();usePowerguard.getState().setSettings({soundEnabled:enabled});pgAudio()?.configure(audioPreferences());if(enabled)void playSound('click');else stopThai();}

export default function PowerguardRuntime(){
 const ui=usePowerguard(),weather=useSimulator(s=>s.environment.weather);
 useEffect(()=>{
  ui.hydrate();const audio=pgAudio();let episode=crypto.randomUUID(),seen=new Set<string>(),lastMinute=useSimulator.getState().minute,lastEpoch=useSimulator.getState().runEpoch;
  const collect=()=>{const sim=useSimulator.getState();if(sim.minute<lastMinute||sim.runEpoch!==lastEpoch){episode=crypto.randomUUID();seen=new Set();usePowerguard.setState({toasts:[]});}lastMinute=sim.minute;lastEpoch=sim.runEpoch;
   for(const event of [...sim.events].reverse()){
    if(seen.has(event.id))continue;seen.add(event.id);if(event.type==='sim-start')continue;
    const notices=noticesFromEvent(event,episode,sim.mode==='outage'&&sim.batterySoc>0,new Date().toISOString());
    const added=usePowerguard.getState().ingest(notices);
    for(const notice of added){const mapping=notificationAssets[notice.kind as keyof typeof notificationAssets];void playSound(notice.severity==='critical'?'notify-critical':mapping?.soundId||(notice.severity==='success'?'notify-success':notice.severity==='warning'?'notify-warning':'notify-info'));}
   }
  };collect();const unsubscribe=useSimulator.subscribe(collect);
  const visibility=()=>{const hidden=document.visibilityState==='hidden';audio?.setHidden(hidden);if(hidden)stopThai();};document.addEventListener('visibilitychange',visibility);visibility();
  const click=(event:MouseEvent)=>{const target=event.target as Element;if(target.closest('button,a,select')&&!target.closest('[data-pg-silent]'))void playSound('click');};
  let lastHover=0;const hover=(event:PointerEvent)=>{const target=event.target as Element;if(target.closest('button,a')&&performance.now()-lastHover>350){lastHover=performance.now();void playSound('hover');}};
  document.addEventListener('click',click,true);document.addEventListener('pointerover',hover);
  return()=>{unsubscribe();document.removeEventListener('visibilitychange',visibility);document.removeEventListener('click',click,true);document.removeEventListener('pointerover',hover);audio?.stop();stopThai();};
 },[]);
 useEffect(()=>{pgAudio()?.configure(audioPreferences());if(ui.muted)stopThai();},[ui.soundEnabled,ui.muted,ui.sfxVolume,ui.ambientVolume,ui.musicVolume,ui.ambientOn,ui.musicOn,ui.ambientChoice,weather]);
 useEffect(()=>{const timers=ui.toasts.filter(n=>n.severity!=='critical').map(n=>setTimeout(()=>usePowerguard.getState().dismissToast(n.id),9000));return()=>timers.forEach(clearTimeout);},[ui.toasts]);
 return <div className="pg-toast-stack" aria-label="แจ้งเตือนล่าสุด">{ui.toasts.map(n=><article className={'pg-toast '+n.severity} key={n.id} role={n.severity==='critical'?'alert':'status'}><div><strong>{n.title}</strong><small>{n.source==='simulation'?'ข้อมูลทดลอง':'บันทึกในเครื่อง'} · {n.minute.toFixed(1)} นาที</small></div><div className="pg-toast-actions"><button onClick={()=>ui.acknowledge(n.id)}>รับทราบ</button><Link href="/notifications/">ดูรายละเอียด</Link><button className="pg-icon-btn" aria-label={'ปิดข้อความ '+n.title} onClick={()=>ui.dismissToast(n.id)}><X size={16}/></button></div></article>)}</div>;
}
