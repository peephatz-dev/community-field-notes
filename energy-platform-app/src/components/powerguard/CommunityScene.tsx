'use client';
import {useSimulator} from '@/store/simulator';
import {usePowerguard} from '@/store/powerguard';
import {assetUrl} from '@/lib/urls';
import {activeLoad} from '@/lib/model';
import {NODE_NAMES} from '@/lib/powerguard-model';
import presets from '@/lib/powerguard/vfx-presets.json';
export default function CommunityScene(){
 const s=useSimulator(),vfx=usePowerguard(x=>x.vfx),rain=['light-rain','monsoon','storm'].includes(s.environment.weather),on=(id:Parameters<typeof activeLoad>[0])=>activeLoad(id,s.mode,s.batterySoc,s.nodeOffline,s.recoveryStage);
 return <figure className={'pg-community-scene '+(s.mode==='outage'?'outage':'')}><img className="pg-community-art" src={assetUrl('/powerguard/scenes/coastal-community.svg')} width={1000} height={620} alt="ภาพประกอบบ้าน ท่าเรือ เรือและกระชัง"/>
 {vfx&&<div className="pg-vfx" aria-hidden="true"><img className="pg-wave" src={assetUrl(presets.wave.asset)} alt=""/>{rain&&Array.from({length:s.environment.weather==='storm'?14:8},(_,i)=><img key={'rain'+i} className="pg-rain" src={assetUrl(presets.rain.asset)} alt="" style={{left:(i*7+4)+'%',animationDelay:(i%5)*.2+'s'}}/>)}{s.mode!=='normal'&&<img className="pg-spark" src={assetUrl(presets.power_warning.asset)} alt=""/>}{Array.from({length:3},(_,i)=><img className="pg-bubble-float" src={assetUrl(presets.bubble.asset)} alt="" key={i} style={{left:(55+i*11)+'%',animationDelay:i*.7+'s'}}/>)}</div>}
 <div className="pg-scene-statuses">{(['P0','P1','P2','P3'] as const).map(id=><span key={id} className={on(id)?'on':'off'}><i/>{NODE_NAMES[id]}<b>{on(id)?s.mode==='outage'?'ใช้ไฟสำรอง':'ทำงาน':'หยุดชั่วคราว'}</b></span>)}</div><figcaption>ภาพประกอบชุมชน · สถานะจากข้อมูลทดลอง · ไม่ใช่แผนที่สำรวจ</figcaption></figure>;
}
