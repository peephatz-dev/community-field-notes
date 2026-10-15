'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {useReducedMotion} from 'framer-motion';
import {ArrowUpRight,Battery,ShieldCheck,Zap,Play} from 'lucide-react';
import {useSimulator} from '@/store/simulator';
import {usePowerguard} from '@/store/powerguard';
import {activeLoad,calcPower,type NodeId} from '@/lib/model';
import {calculatePlan,NODE_NAMES,powerStatus} from '@/lib/powerguard-model';
import {incidentJourney} from '@/lib/incident-journey';
import {assetUrl} from '@/lib/urls';
import {SitePlan} from '@/components/SitePlan';
import SeaBassAssistant from './SeaBassAssistant';
import {DemoLab,currentDialogue} from './CitizenPages';
import {MapToolbar,EquipmentInspector,IncidentBar,MapNotice} from './MapWorkspace';
import type {SceneProps} from '@/components/Scene3D';

const Scene=dynamic(()=>import('@/components/Scene3D'),{ssr:false,loading:()=> <div className="iso-loading" role="status"><img src={assetUrl('/powerguard/mascot/seabass-thinking.svg')} alt="" width={100} height={100}/><strong>กำลังเปิดพื้นที่สามมิติ</strong><span>ใช้ผังสองมิติได้ระหว่างรอ</span></div>});
const PowerChart=dynamic(()=>import('@/components/TelemetryCharts').then(m=>m.PowerChart),{ssr:false});
const BatteryChart=dynamic(()=>import('@/components/TelemetryCharts').then(m=>m.BatteryChart),{ssr:false});
const ids:NodeId[]=['P0','P1','P2','P3'];

export default function IsometricDashboard({demo=false}:{demo?:boolean}){
 const s=useSimulator(),ui=usePowerguard(),reduce=!!useReducedMotion();
 const [view,setView]=useState<'3d'|'2d'>('3d'),[quality,setQuality]=useState<'low'|'balanced'|'high'>('balanced'),[reset,setReset]=useState(0),[command,setCommand]=useState<SceneProps['cameraCommand']>();
 const [measurements,setMeasurements]=useState(true);
 const [inspecting,setInspecting]=useState(true),[expanded,setExpanded]=useState(true),[fullscreen,setFullscreen]=useState(false),[fullscreenMessage,setFullscreenMessage]=useState('');
 const workspace=useRef<HTMLDivElement>(null),returnFocus=useRef<HTMLElement|null>(null);
 const engineering=ui.audience==='engineer',operator=ui.audience==='operator';
 useEffect(()=>{s.setCameraMode('isometric');},[]);
 useEffect(()=>{const change=()=>setFullscreen(document.fullscreenElement===workspace.current);document.addEventListener('fullscreenchange',change);return()=>document.removeEventListener('fullscreenchange',change);},[]);
 const on=(id:NodeId)=>activeLoad(id,s.mode,s.batterySoc,s.nodeOffline,s.recoveryStage);
 const notice=ui.history.find(n=>!n.acknowledgedAt&&(n.nodeId===s.selectedNode||n.nodeId==='SYSTEM'));
 const journey=useMemo(()=>incidentJourney(s.events,s.mode,s.batterySoc,s.recoveryStage),[s.events,s.mode,s.batterySoc,s.recoveryStage]);
 const plan=calculatePlan(ui.plan),sample=s.samples.at(-1)!;
 const label=(id:NodeId)=>engineering?id+' '+NODE_NAMES[id]:NODE_NAMES[id];
 const select=(id:NodeId)=>{returnFocus.current=document.activeElement as HTMLElement;s.setSelectedNode(id);setInspecting(true);s.setCameraMode('focus-'+id);setReset(n=>n+1);};
 const close=()=>{setInspecting(false);s.setCameraMode('isometric');setReset(n=>n+1);returnFocus.current?.focus();};
 const cameraAction=useCallback((action:NonNullable<SceneProps['cameraCommand']>['action'])=>setCommand(c=>({id:(c?.id??0)+1,action})),[]);
 const resetCamera=useCallback(()=>{s.setCameraMode('isometric');setReset(n=>n+1);},[s.setCameraMode]);
 async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(workspace.current?.requestFullscreen)await workspace.current.requestFullscreen();else setFullscreen(v=>!v);}catch{setFullscreen(v=>!v);setFullscreenMessage('ขยายพื้นที่ในหน้านี้ กดออกจากเต็มจอเพื่อกลับ');}}
 return <div className="iso-dashboard map-first">
  <div className="iso-heading"><div><h1>ท่าเรือลุงทอง</h1><p>ฉากอิงภาพอ้างอิง · จุดอุปกรณ์เสนอ รอสำรวจ</p></div>{demo?<Link href="/" className="iso-start">กลับหน้าดูสถานะ<ArrowUpRight size={15}/></Link>:<Link href="/simulation/" className="iso-start"><Play size={15}/>โหมดสาธิต</Link>}</div>
  <section className="compact-topology" aria-label="จุดและหน้าที่ของระบบ"><h2>จุดไหน เชื่อมกับอะไร ทำหน้าที่อะไร</h2><div>{([['P0','ศูนย์ไฟใกล้ท่าเรือ','รับข้อมูลและจัดลำดับไฟสำรอง'],['P1','จุดกระชัง','เชื่อม P0 · ติดตามไฟและค่าน้ำ'],['P2','บ้านริมน้ำ','เชื่อม P0 · เครื่องใช้จำเป็น'],['P3','เครื่องใช้ทั่วไป','เชื่อม P0 · พักก่อนเมื่อไฟจำกัด']] as const).map(([id,name,task])=><button key={id} onClick={()=>select(id)}><strong>{id} · {name}</strong><span>{task}</span></button>)}</div><p>เส้นเชื่อมอธิบายความสัมพันธ์ในแบบจำลอง ไม่ใช่แนวสายจริง · ทุกจุดยังเป็นข้อเสนอ</p></section>
  <MapNotice/>
  <div className="iso-kpis" aria-label="สถานะจากตัวจำลอง">
   <div className={'iso-kpi '+s.mode}><span><Zap size={16}/>ไฟฟ้าหลัก</span><strong>{powerStatus(s.mode)}</strong><small>ข้อมูลจำลอง</small></div>
   <div className="iso-kpi"><span><Battery size={16}/>ไฟสำรอง</span><strong>{Math.round(s.batterySoc*100)}<em>%</em></strong><small>{s.mode==='outage'?s.batterySoc>0?'กำลังใช้ไฟสำรอง':'ไฟสำรองหมดแล้ว':'พลังงานคงเหลือจำลอง'}</small></div>
   <div className="iso-kpi"><span><ShieldCheck size={16}/>อุปกรณ์สำคัญ</span><strong>{['P0','P1'].filter(id=>on(id as NodeId)).length}<em>/ 2 ทำงาน</em></strong><small>ศูนย์ไฟและจุดกระชัง</small></div>
  </div>
  <div ref={workspace} className={'map-workspace '+(inspecting?'has-inspector ':'')+(fullscreen?'is-fullscreen':'')} onKeyDown={e=>{if(e.key==='Escape'){if(fullscreen&&!document.fullscreenElement)setFullscreen(false);else if(inspecting)close();}}}>
   <section className="iso-stage" aria-label="พื้นที่ชุมชนแบบโต้ตอบ" data-testid="isometric-dashboard">
    <div className="iso-canvas" role="group" aria-label={view==='3d'?'ฉากสามมิติบ้านศาลาหุม':'ผังสองมิติบ้านศาลาหุม'}>
     {view==='3d'?<Scene environment={s.environment} minute={s.minute} running={s.running} playbackSpeed={s.playbackSpeed} mode={s.mode} batterySoc={s.batterySoc} offline={s.nodeOffline} selectedNode={s.selectedNode} selectionActive={inspecting} selectNode={select} cameraMode={s.cameraMode} cameraCommand={command} cameraReset={reset} communityLabels={!engineering} compactMarkers quality={quality} reducedMotion={reduce} recoveryStage={s.recoveryStage} sensorFault={s.sensorFault} waterShift={s.waterShift} showTopology={true}/>:<SitePlan selectedNode={s.selectedNode} onSelectNode={select} showZones={false} communityLabels={!engineering}/>}
    </div>
    <MapToolbar view={view} setView={setView} quality={quality} setQuality={setQuality} cameraAction={cameraAction} resetCamera={resetCamera} cameraMode={s.cameraMode} setCameraMode={s.setCameraMode} fullscreen={fullscreen} toggleFullscreen={toggleFullscreen}/>
   </section>
   {inspecting&&<EquipmentInspector engineering={true} onClose={close}/>}
   {fullscreenMessage&&<span className="fullscreen-message" role="status">{fullscreenMessage}</span>}
  </div>
  {<section className="demo-workbench" aria-label="โหมดสาธิต"><div><strong>โหมดสาธิต</strong><span>ทุกเหตุใช้ข้อมูลจำลอง ไม่สั่งอุปกรณ์จริง</span></div><div className="demo-primary-actions">{([['normal','ไฟปกติ'],['sag','ไฟตก'],['outage','ไฟดับ'],['extended-outage','ใช้ไฟสำรอง'],['low-battery','แบตใกล้หมด'],['recovery','ไฟกลับมา']] as const).map(([id,label])=><button key={id} onClick={()=>{const state=useSimulator.getState();if(id==='normal'&&state.mode==='normal'&&state.batterySoc===1&&!state.sensorFault&&!state.nodeOffline&&!state.waterShift&&state.recoveryStage===2)return;if(id==='low-battery'&&state.mode==='outage'&&state.batterySoc===.34)return;if(id==='recovery'&&state.mode==='normal'&&state.recoveryStage<2)return;state.setScenario(id);}}>{label}</button>)}<button onClick={s.toggleRunning}>{s.running?'หยุดเวลา':'เล่นต่อ'}</button><button onClick={s.reset}>เริ่มใหม่</button></div><details><summary>เหตุอื่นและการตั้งค่า</summary><DemoLab/></details></section>}
  <div className="map-access-row"><details className="map-device-picker" open><summary>เลือกอุปกรณ์ <span>4 จุดเสนอ</span></summary><div className="iso-equipment-selector" role="group" aria-label="เลือกอุปกรณ์ในพื้นที่">{ids.map(id=><button key={id} aria-pressed={inspecting&&s.selectedNode===id} onClick={()=>select(id)}><i className={on(id)?'on':'off'}/><span>{label(id)}</span><small>{on(id)?s.mode==='outage'?'ใช้ไฟสำรอง':'ทำงาน':'พักโหลด'}</small></button>)}</div></details><SeaBassAssistant dialogueId={currentDialogue()}/></div>
  <IncidentBar expanded={expanded} setExpanded={setExpanded} journey={journey}/>
  <details className="map-measurements" open onToggle={e=>setMeasurements(e.currentTarget.open)}><summary>ดูค่าไฟและกราฟเพิ่มเติม</summary>{measurements&&<><p>ค่าตัวอย่างจากตัวจำลอง ไม่ใช่การวัดภาคสนาม</p><dl><div><dt>แรงดันแหล่งหลัก</dt><dd>{sample.voltage.toFixed(1)} โวลต์ กระแสตรง</dd></div><div><dt>กำลังโหลดรวม</dt><dd>{calcPower(s.mode,s.batterySoc,s.nodeOffline,s.recoveryStage)} วัตต์</dd></div><div><dt>ความจุแบตตัวอย่าง</dt><dd>1.2 กิโลวัตต์ชั่วโมง</dd></div></dl>
  {operator&&<section className="iso-operator"><div><h2>รับเหตุและติดตามการดูแล</h2><p>ผู้ดูแลหน้างานยังต้องยืนยันกับชุมชน บันทึกนี้อยู่ในเครื่องและยังไม่ส่งให้หน่วยงาน</p></div><button className="pg-button" disabled={!notice} onClick={()=>notice&&ui.acknowledge(notice.id)}>รับทราบเหตุล่าสุด</button><Link className="pg-button secondary" href="/history/">บันทึกการดูแล</Link></section>}
  <div className="iso-chart-grid"><section className="pg-card"><div className="iso-section-title"><h2>ไฟหลัก</h2><span>V DC ค่าจำลอง</span></div><PowerChart/><small>เหตุเปลี่ยนทันที แม้พักเวลา</small></section><section className="pg-card"><div className="iso-section-title"><h2>พลังงานสำรอง</h2><span>% ค่าจำลอง</span></div><BatteryChart/><small>ใช้ตามโหลดที่ยังทำงาน รวม {calcPower(s.mode,s.batterySoc,s.nodeOffline,s.recoveryStage)} W สมมติ</small></section></div>
  </>} </details>
  <section className="iso-response-flow"><h2>เมื่อเกิดเหตุ ใครทำอะไร</h2><div>{[['เกิดอะไร','ดูแรงดันและสถานะอุปกรณ์','/power/'],['ต้องทำอะไร','ตรวจข้อมูลก่อนเลือกวิธีแก้','/notifications/'],['ใครดูแล','ตกลงผู้รับแจ้งก่อนลงพื้นที่','/roles/'],['มีบันทึกแล้ว','บันทึกการแก้ไขและส่งออก','/history/']].map(([name,detail,path])=><Link key={name} href={path}><strong>{name}</strong><span>{detail}</span><ArrowUpRight size={16}/></Link>)}</div></section>
  <div className="iso-lower-grid"><section className="pg-card"><h2>เริ่มจากโหลดที่ต้องใช้ต่อ</h2><p>แผนที่บันทึก: {plan.watts.toFixed(0)} W สำหรับ {ui.plan.hours} ชั่วโมง</p><strong className="iso-plan-value">{plan.requiredWh.toFixed(0)} <small>Wh สมมติ</small></strong><p>{plan.cost===null?'ต้นทุนยังรอราคาและค่าติดตั้ง':plan.cost.toLocaleString('th-TH',{maximumFractionDigits:0})+' บาท ตามราคาที่ผู้ใช้ใส่'}</p><Link href="/backup-plan/" className="pg-button secondary">เลือกโหลดและเทียบเครื่องสำรองไฟ<ArrowUpRight size={15}/></Link></section><section className="pg-card"><h2>หลักฐานก่อนขยาย</h2><p>เอกสารชุมชนลงวันที่ 16 ก.ค. 2569 รายงานว่าไฟยังไม่เสถียร แต่ยังไม่มีชุดบันทึกแรงดันเพื่อระบุความถี่และอุปกรณ์ที่ได้รับผล</p><p>ขั้นต่อไปคือวัดไฟ โหลดจริง และวิธีรับเหตุเดิมที่จุดทดลองซึ่งชุมชนยินยอม</p><div className="iso-evidence-links"><Link href="/roadmap/">แผนทดลอง<ArrowUpRight size={14}/></Link><a href="https://peephatz-dev.github.io/community-field-notes/pitch-appendix.html">ภาคผนวกและสไลด์ 10 หน้า<ArrowUpRight size={14}/></a><a href="https://peephatz-dev.github.io/community-field-notes/presentation-guide.html#decision-board" target="_blank" rel="noreferrer">ข้อมูลที่ต้องยืนยัน<ArrowUpRight size={14}/></a></div></section></div>
 </div>;
}
