'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Compass, Maximize2, Minimize2, Pause, Play, RotateCcw, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSimulator } from '@/store/simulator';
import { CANDIDATE_NODES, SITE_REFERENCE } from '@/lib/site-layout';
import type { NodeId } from '@/lib/model';
import { SitePlan } from './SitePlan';
const Scene3D=dynamic(()=>import('./Scene3D'),{ssr:false,loading:()=> <div className="scene-loading" role="status"><strong>กำลังประกอบพื้นที่ท่าเรือลุงทอง</strong><small>ผังสร้างใหม่ตามภาพอ้างอิง</small></div>});

const cameras=[['aerial','มุมเฉียง'],['top','จากด้านบน'],['pier','ท่าเรือ'],['walk','แนวบ้าน'],['aquaculture','กระชัง'],['transition','แนวสีน้ำ'],['power','ระบบ'],['circuit','P0']];
const landmarkCameras:Record<string,string>={pier:'pier',waterfront:'walk',cages:'aquaculture',road:'walk',channel:'transition'};
const tour=[
 {camera:'aerial',node:'P0' as NodeId,title:'พื้นที่นี้อยู่ตรงไหน',body:'แนวบ้านเลียบฝั่ง กระชังหลายกลุ่ม และช่องน้ำเปิดจัดตามสัดส่วนในภาพอ้างอิง ยังไม่มีมาตราส่วนและทิศเหนือที่ยืนยัน'},
 {camera:'pier',node:'P0' as NodeId,title:'เข้าใกล้ท่าเรือลุงทอง',body:'ท่ายาวช่วงล่างของภาพเป็นจุดยึดเรื่อง ตำแหน่งเริ่มท่าและรูปร่างวาดใหม่โดยประมาณ ต้องยืนยันชื่อและจุดขึ้นท่ากับคนพื้นที่'},
 {camera:'walk',node:'P2' as NodeId,title:'เดินตามแนวบ้านริมน้ำ',body:'ถนนแคบอยู่ด้านฝั่ง อาคารและจุดจอดเรือเรียงตามแนวขอบน้ำ P2 และ P3 เป็นตัวแทนโหลดเสนอ ยังไม่ใช่การติดตั้งจริง'},
 {camera:'aquaculture',node:'P1' as NodeId,title:'กลุ่มกระชังที่ยื่นออกไปในน้ำ',body:'กระชังเป็นแถวยาวเฉียงหลายกลุ่ม มีช่องว่างและชุดที่แยกออกมา จำนวนช่องในโมเดลใช้ประกอบรูปทรง ไม่ใช่จำนวนกระชังภาคสนาม'},
 {camera:'p1',node:'P1' as NodeId,title:'P1 และแนวคิดเฝ้าตรวจน้ำ',body:'P1 เสนอไว้ใกล้กลุ่มกระชัง Zone A ส่วนจุด B/C เป็นจุดอ้างอิงเสนอ สีเขียวและสีเข้มไม่ยืนยันความเค็ม ค่า DO ยังไม่มีข้อมูล'},
 {camera:'circuit',node:'P0' as NodeId,title:'กลับสู่ศูนย์ควบคุม P0',body:'เสนอ P0 ใกล้จุดขึ้นท่า เพื่อรวบรวมข้อความโหนดและตัดสินใจด้านพลังงาน ตู้และแบตเตอรี่เป็นอุปกรณ์อ้างอิง ยังต้องออกแบบและสำรวจ'},
 {camera:'power',node:'P0' as NodeId,title:'เห็นทางเดินพลังงานและข้อมูล',body:'เส้นที่แสดงคือการเชื่อมต่อเชิงตรรกะ P0–P3 ไม่ใช่แนวสายไฟหรือแนวสัญญาณวิทยุที่สำรวจแล้ว ไฟและการส่งข้อมูลเป็นคนละสถานะ'},
 {camera:'power',node:'P0' as NodeId,title:'ไฟดับ: สำรองและคงโหลดสำคัญ',body:'ขั้นนี้กดให้ไฟหลักดับจริงในตัวจำลอง P3 ถูกตัดก่อน P0/P1 ทำงานต่อเมื่อพลังงานพอ กราฟและประวัติใช้สถานะเดียวกับฉาก'},
];

export default function SiteExperience({compact=false,documentary=false}:{compact?:boolean;documentary?:boolean}){
 const s=useSimulator();const reduce=!!useReducedMotion();
 const [expanded,setExpanded]=useState(false),[quality,setQuality]=useState<'balanced'|'high'>('balanced');
 const [view,setView]=useState<'scene'|'compare'|'plan'>('scene'),[overlay,setOverlay]=useState(false),[opacity,setOpacity]=useState(65),[landmarks,setLandmarks]=useState(false),[zones,setZones]=useState(false),[topology,setTopology]=useState(true),[reset,setReset]=useState(0);
 const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[privateImage,setPrivateImage]=useState<string|null>(null);
 const ref=useRef<HTMLElement>(null),toolbarRef=useRef<HTMLDivElement>(null);
 const [contentTop,setContentTop]=useState(130);
 useEffect(()=>{const toolbar=toolbarRef.current,scene=ref.current;if(!toolbar||!scene)return;const measure=()=>setContentTop(Math.ceil(toolbar.getBoundingClientRect().bottom-scene.getBoundingClientRect().top+14));const observer=new ResizeObserver(measure);observer.observe(toolbar);measure();return()=>observer.disconnect();},[]);
 const applyStep=(next:number)=>{setStep(next);s.setCameraMode(tour[next].camera);s.setSelectedNode(tour[next].node);setTopology(next>=6);setZones(next===4);if(next===7)s.setScenario('outage');};
 useEffect(()=>{
  if(!playing||reduce)return;
  const timer=window.setTimeout(()=>{if(step<tour.length-1)applyStep(step+1);else setPlaying(false);},7000);
  return()=>window.clearTimeout(timer);
 },[playing,step,reduce]);
 useEffect(()=>()=>{if(privateImage)URL.revokeObjectURL(privateImage);},[privateImage]);
 useEffect(()=>{
  if(!expanded)return;
  const focus=document.activeElement as HTMLElement,before=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.querySelector<HTMLElement>('[data-fullscreen-toggle]')?.focus();
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==='Escape')setExpanded(false);
   if(e.key!=='Tab')return;
   const elements=[...(ref.current?.querySelectorAll<HTMLElement>('button,select,input,a[href]')??[])].filter(el=>el.getClientRects().length>0);
   if(e.shiftKey&&document.activeElement===elements[0]){e.preventDefault();elements.at(-1)?.focus();}
   else if(!e.shiftKey&&document.activeElement===elements.at(-1)){e.preventDefault();elements[0]?.focus();}
  };document.addEventListener('keydown',onKey);return()=>{document.body.style.overflow=before;document.removeEventListener('keydown',onKey);focus?.focus();};
 },[expanded]);
 const selectNode=(id:NodeId)=>{s.setSelectedNode(id);setPlaying(false);if(s.cameraMode!=='top')s.setCameraMode('focus-'+id);};
 const chooseCamera=(camera:string)=>{setPlaying(false);s.setCameraMode(camera);setReset(n=>n+1);};
 return <div className="site-experience">
 {documentary&&<section className="site-documentary" aria-label="เดินเรื่องพื้นที่แปดฉาก"><div className="site-documentary-head"><div><h2>จากท่าเรือถึงระบบสำรอง</h2><p>เดินเรื่อง 8 ฉาก · กดเลือกแต่ละช่วงหรือเล่นจากไฟหลักปกติ</p></div><button className="control-btn" disabled={reduce} onClick={()=>{if(playing){setPlaying(false);}else{s.setScenario('normal');applyStep(0);setPlaying(true);}}}>{playing?<Pause size={16}/>:<Play size={16}/>} {playing?'พักเรื่อง':'เล่นจากสภาวะปกติ'}</button></div><div className="site-tour-steps">{tour.map((item,i)=><button key={item.title} aria-current={step===i?'step':undefined} className={step===i?'active':''} onClick={()=>{setPlaying(false);applyStep(i);}}><span>{i+1}</span>{item.title}</button>)}</div><div className="site-tour-current" aria-live="polite"><span>{step+1} / 8</span><div><h3>{tour[step].title}</h3><p>{tour[step].body}</p></div><div><button className="scene-tool-btn" aria-label="ฉากก่อนหน้า" disabled={step===0} onClick={()=>{setPlaying(false);applyStep(step-1);}}><ChevronLeft size={18}/></button><button className="scene-tool-btn" aria-label="ฉากถัดไป" disabled={step===7} onClick={()=>{setPlaying(false);applyStep(step+1);}}><ChevronRight size={18}/></button></div></div>{reduce&&<small>การลดการเคลื่อนไหวเปิดอยู่ · ใช้ปุ่มเลือกฉากแทนการเล่นอัตโนมัติ</small>}</section>}
 <section ref={ref} className={'scene-card site-scene '+(compact?'scene-large ':'')+(expanded?'scene-expanded ':'')+(view==='compare'?'site-compare':view==='plan'?'site-plan-only':'')} aria-label="ฉากพื้นที่ท่าเรือลุงทองและกระชังบ้านศาลาหุม" role={expanded?'dialog':undefined} aria-modal={expanded||undefined}>
 <div className="scene-top"><div className="scene-place"><MapPin size={16}/><span><strong>ท่าเรือลุงทอง · บ้านศาลาหุม</strong><small>ฉากเฉพาะกรอบภาพ · P0–P3 เป็นจุดเสนอ</small></span></div><div className="scene-tools"><span className={'scene-status '+(s.mode!=='normal'?'warning':'')}><i/>{s.mode==='outage'?'ไฟดับ · สำรอง':s.mode==='sag'?'แรงดันตก':s.recoveryStage<2?'ทยอยคืนโหลด':'ไฟหลักปกติ'}</span><button data-fullscreen-toggle className="scene-tool-btn" onClick={()=>setExpanded(v=>!v)} aria-label={expanded?'ออกจากเต็มหน้าจอ':'เปิดฉากเต็มหน้าจอ'}>{expanded?<Minimize2 size={18}/>:<Maximize2 size={18}/>}</button></div></div>
 <div ref={toolbarRef} className="site-view-toolbar"><div role="group" aria-label="เทียบผังอ้างอิงกับสามมิติ"><button aria-pressed={view==='scene'} onClick={()=>setView('scene')}>3D</button><button aria-pressed={view==='plan'} onClick={()=>setView('plan')}>ผัง 2D</button><button aria-pressed={view==='compare'} onClick={()=>{setView('compare');chooseCamera('top');}}>ผังอิงดาวเทียม ↔ 3D</button></div><button aria-pressed={overlay} onClick={()=>setOverlay(v=>!v)}>ซ้อนผัง</button>{overlay&&<label className="site-opacity">ความทึบ {opacity}%<input type="range" min="0" max="100" value={opacity} onChange={e=>setOpacity(Number(e.target.value))} aria-label="ความทึบของผังซ้อน"/></label>}<button aria-pressed={landmarks} onClick={()=>setLandmarks(v=>!v)}>จุดอ้างอิง</button><button aria-pressed={zones} onClick={()=>setZones(v=>!v)}>Zone A/B/C</button><button aria-pressed={topology} onClick={()=>setTopology(v=>!v)}>เส้นระบบ</button></div>
 <div className="site-scene-content" style={{top:contentTop}}>
 {view!=='scene'&&<aside className="site-comparison-reference"><div className="site-reference-controls"><label className="control-btn">เปิดภาพอ้างอิงของคุณ<input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)setPrivateImage(URL.createObjectURL(file));e.currentTarget.value='';}}/></label>{privateImage&&<button onClick={()=>setPrivateImage(null)}>กลับสู่ผังวาดใหม่</button>}</div>{privateImage?<figure className="site-private-image"><img src={privateImage} alt="ภาพอ้างอิงที่ผู้ใช้เปิดในเบราว์เซอร์นี้"/><figcaption>แสดงเฉพาะเบราว์เซอร์นี้ · ไม่อัปโหลดหรือบันทึกลงเว็บไซต์</figcaption></figure>:<SitePlan selectedNode={s.selectedNode} onSelectNode={selectNode} onLandmarkSelect={id=>chooseCamera(landmarkCameras[id])} showZones={zones}/>}<p className="site-reference-note">ผังวาดใหม่จากภาพผู้ใช้ · ไม่ใช่ภาพหรือ map tiles ของ Google Maps <a href={SITE_REFERENCE.mapsUrl} target="_blank" rel="noreferrer">เปิดตำแหน่งต้นทาง</a></p></aside>}
 {view!=='plan'&&<div className="scene-canvas"><Scene3D environment={s.environment} minute={s.minute} running={s.running} playbackSpeed={s.playbackSpeed} mode={s.mode} batterySoc={s.batterySoc} offline={s.nodeOffline} selectedNode={s.selectedNode} selectNode={selectNode} cameraMode={s.cameraMode} quality={quality} reducedMotion={reduce} recoveryStage={s.recoveryStage} sensorFault={s.sensorFault} waterShift={s.waterShift} showOverlay={overlay} overlayOpacity={opacity/100} showLandmarks={landmarks} showZones={zones} showTopology={topology} cameraReset={reset} onCameraSelect={chooseCamera}/></div>}
 </div>
 <div className="scene-bottom"><div className="scene-camera-row"><div className="camera-tabs" role="group" aria-label="มุมกล้องพื้นที่">{cameras.map(([id,label])=><button key={id} className={s.cameraMode===id?'active':''} aria-pressed={s.cameraMode===id} onClick={()=>chooseCamera(id)}>{label}</button>)}</div><label className="quality-control"><span>คุณภาพอัตโนมัติ</span><select value={quality} onChange={e=>setQuality(e.target.value as 'balanced'|'high')} aria-label="คุณภาพการแสดงผลสามมิติ"><option value="balanced">Balanced</option><option value="high">High</option></select></label><button className="scene-tool-btn" aria-label="รีเซ็ตมุมกล้อง" onClick={()=>{setPlaying(false);s.setCameraMode(view!=='scene'?'top':'aerial');setReset(n=>n+1);}}><RotateCcw size={16}/></button></div><div className="scene-help"><span><Compass size={13}/>ลากหมุน / เลื่อนซูม · เลือก P0–P3 เพื่อเข้าใกล้</span><span>{topology?'เส้นระบบเชิงตรรกะ · ไม่ใช่แนวสายจริง':'ตำแหน่งสัมพัทธ์ · ยังไม่ผ่านการสำรวจ'}</span></div></div>
 </section>
 <div className="site-source-strip"><span>เลือก: {s.selectedNode} · {CANDIDATE_NODES[s.selectedNode].title} · PROPOSED</span><span>สีผิวน้ำไม่ยืนยันความเค็ม · ขอบฉากคือกรอบภาพ ไม่ใช่แนวฝั่งที่สำรวจ</span></div>
 </div>;
}
