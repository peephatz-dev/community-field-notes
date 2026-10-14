'use client';
import {useRef} from 'react';
import {Volume2,VolumeX,X} from 'lucide-react';
import manifest from '@/lib/powerguard/audio-manifest.json';
import {usePowerguard} from '@/store/powerguard';
import {playSound,pgAudio,audioPreferences,setSoundEnabled} from './Runtime';
export default function SoundPanel(){
 const dialog=useRef<HTMLDialogElement>(null),s=usePowerguard();
 const update=(patch:Parameters<typeof s.setSettings>[0])=>{s.setSettings(patch);pgAudio()?.configure(audioPreferences());};
 return <><button className="pg-icon-btn" aria-label="ตั้งค่าเสียงและเอฟเฟกต์" onClick={()=>{dialog.current?.showModal();void playSound('open');}}>{s.soundEnabled&&!s.muted?<Volume2 size={19}/>:<VolumeX size={19}/>}</button>
 <dialog className="pg-dialog pg-sound-dialog" ref={dialog} aria-label="เสียงและเอฟเฟกต์" onClose={()=>void playSound('close')} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><div className="pg-dialog-heading"><h2>เสียงและเอฟเฟกต์</h2><button className="pg-icon-btn" aria-label="ปิดตั้งค่าเสียง" onClick={()=>dialog.current?.close()}><X size={18}/></button></div>
 <p>เสียงบรรยากาศสังเคราะห์จากแพ็ก</p><div className="pg-sound-switches"><button data-pg-silent className="pg-button" onClick={()=>setSoundEnabled(!s.soundEnabled)}>{s.soundEnabled?'ปิดเสียง':'เปิดเสียง'}</button><button data-pg-silent className="pg-button secondary" aria-pressed={s.muted} onClick={()=>update({muted:!s.muted})}>{s.muted?'เปิดเสียงรวม':'ปิดเสียงรวม'}</button><label><input type="checkbox" checked={s.vfx} onChange={e=>update({vfx:e.target.checked})}/>เอฟเฟกต์ภาพ</label></div>
 <div className="pg-volume-grid">{(['sfxVolume','ambientVolume','musicVolume'] as const).map((key,i)=><label key={key}><span>{['เสียงปุ่มและแจ้งเตือน','เสียงบรรยากาศ','ดนตรี'][i]} <b>{Math.round(s[key]*100)}%</b></span><input aria-label={['ระดับเสียงปุ่มและแจ้งเตือน','ระดับเสียงบรรยากาศ','ระดับเสียงดนตรี'][i]} type="range" min="0" max="100" value={Math.round(s[key]*100)} onChange={e=>update({[key]:Number(e.target.value)/100})}/></label>)}</div>
 <div className="pg-loop-controls"><label><input type="checkbox" checked={s.ambientOn} onChange={e=>update({ambientOn:e.target.checked})}/>เล่นบรรยากาศ</label><select aria-label="เลือกเสียงบรรยากาศ" value={s.ambientChoice} onChange={e=>update({ambientChoice:e.target.value as typeof s.ambientChoice})}><option value="auto">ตามอากาศทดลอง</option><option value="ocean-waves">ทะเล</option><option value="rain-light">ฝนเบา</option><option value="rain-heavy">ฝนหนัก</option><option value="sea-wind">ลมทะเล</option><option value="pier-day">ท่าเรือ</option></select><label><input type="checkbox" checked={s.musicOn} onChange={e=>update({musicOn:e.target.checked})}/>เล่นดนตรี</label></div>
 <p className="pg-audio-status" role="status" data-last-sound={s.lastSound}>{s.audioStatus}{s.lastSound?' · '+manifest[s.lastSound as keyof typeof manifest]?.descriptionTH:''}</p>
 <details><summary>ลองเสียงแต่ละแบบ</summary><div className="pg-sound-tests">{Object.entries(manifest).filter(([,m])=>m.category==='ui').map(([id,m])=><button data-pg-silent key={id} className="pg-button secondary" disabled={!s.soundEnabled||s.muted} onClick={()=>void playSound(id)}>ลองเสียง: {m.descriptionTH}</button>)}</div></details>
 <small>พักเสียงเมื่อออกจากหน้า · ไม่มีเสียงเล่นเองตอนเปิดเว็บ</small></dialog></>;
}
