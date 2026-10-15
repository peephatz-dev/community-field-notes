'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {useReducedMotion} from 'framer-motion';
import {ArrowUpRight,Battery,Bell,Check,ChevronDown,Focus,MapPin,Minus,Plus,RotateCcw,RotateCw,ShieldCheck,Unplug,Zap} from 'lucide-react';
import {useSimulator} from '@/store/simulator';
import {usePowerguard} from '@/store/powerguard';
import {activeLoad,calcPower,NODE_DEFINITIONS,type NodeId} from '@/lib/model';
import {calculatePlan,NODE_NAMES,powerStatus,simpleText} from '@/lib/powerguard-model';
import {incidentJourney} from '@/lib/incident-journey';
import {assetUrl} from '@/lib/urls';
import {SitePlan} from '@/components/SitePlan';
import SeaBassAssistant from './SeaBassAssistant';
import {currentDialogue} from './CitizenPages';
import type {SceneProps} from '@/components/Scene3D';

const Scene=dynamic(()=>import('@/components/Scene3D'),{ssr:false,loading:()=> <div className="iso-loading" role="status"><img src={assetUrl('/powerguard/mascot/seabass-thinking.svg')} alt="" width={100} height={100}/><strong>กำลังเปิดพื้นที่ 3D</strong><span>ใช้ผัง 2D ได้ระหว่างรอ</span></div>});
const PowerChart=dynamic(()=>import('@/components/TelemetryCharts').then(m=>m.PowerChart),{ssr:false});
const BatteryChart=dynamic(()=>import('@/components/TelemetryCharts').then(m=>m.BatteryChart),{ssr:false});
const ids:NodeId[]=['P0','P1','P2','P3'];

export default function IsometricDashboard(){
 const s=useSimulator(),ui=usePowerguard(),reduce=!!useReducedMotion();
 const [view,setView]=useState<'3d'|'2d'>('3d'),[quality,setQuality]=useState<'low'|'balanced'|'high'>('balanced'),[reset,setReset]=useState(0),[command,setCommand]=useState<SceneProps['cameraCommand']>();
 const engineering=ui.audience==='engineer',operator=ui.audience==='operator';
 useEffect(()=>{s.setCameraMode('isometric');},[]);
 const sample=s.samples.at(-1)!,node=NODE_DEFINITIONS.find(n=>n.id===s.selectedNode)!;
 const on=(id:NodeId)=>activeLoad(id,s.mode,s.batterySoc,s.nodeOffline,s.recoveryStage);
 const event=s.events.find(e=>e.nodeId===s.selectedNode||e.nodeId==='SYSTEM');
 const unread=ui.history.filter(n=>!n.acknowledgedAt).length;
 const notice=ui.history.find(n=>!n.acknowledgedAt&&(n.nodeId===s.selectedNode||n.nodeId==='SYSTEM'));
 const journey=useMemo(()=>incidentJourney(s.events,s.mode,s.batterySoc,s.recoveryStage),[s.events,s.mode,s.batterySoc,s.recoveryStage]);
 const plan=calculatePlan(ui.plan);
 const label=(id:NodeId)=>engineering?id+' '+NODE_NAMES[id]:NODE_NAMES[id];
 const select=(id:NodeId)=>s.setSelectedNode(id);
 const cameraAction=(action:NonNullable<SceneProps['cameraCommand']>['action'])=>setCommand(c=>({id:(c?.id??0)+1,action}));
 const resetCamera=()=>{s.setCameraMode('isometric');setReset(n=>n+1);};
 const normal=()=>{if(s.mode!=='normal'||s.sensorFault||s.nodeOffline||s.batterySoc<1||s.recoveryStage<2)s.setScenario('normal');};
 return <div className="iso-dashboard">
  <div className="iso-heading"><div><h1>พื้นที่ท่าเรือลุงทอง</h1><p>บ้านศาลาหุม <span>ฉากอิงภาพอ้างอิง ตำแหน่งอุปกรณ์ยังเป็นจุดเสนอ</span></p></div><a href="#iso-controls" className="iso-start"><ChevronDown size={15}/>ลองเหตุการณ์</a></div>
  <section className={'iso-stage '+(view==='2d'?'is-plan':'')} aria-label="พื้นที่ชุมชนแบบโต้ตอบ" data-testid="isometric-dashboard">
   <div className="iso-canvas" role="group" aria-label={view==='3d'?'ฉาก 3D บ้านศาลาหุม':'ผัง 2D บ้านศาลาหุม'}>
    {view==='3d'?<Scene environment={s.environment} minute={s.minute} running={s.running} playbackSpeed={s.playbackSpeed} mode={s.mode} batterySoc={s.batterySoc} offline={s.nodeOffline} selectedNode={s.selectedNode} selectNode={select} cameraMode={s.cameraMode} cameraCommand={command} cameraReset={reset} communityLabels={!engineering} compactMarkers quality={quality} reducedMotion={reduce} recoveryStage={s.recoveryStage} sensorFault={s.sensorFault} waterShift={s.waterShift} showTopology={engineering}/>:<SitePlan selectedNode={s.selectedNode} onSelectNode={select} showZones={false} communityLabels={!engineering}/>}
   </div>
   <div className="iso-kpis" aria-label="สถานะจากตัวจำลอง">
    <div className={'iso-kpi '+s.mode}><span><Zap size={15}/>ไฟหลัก</span><strong>{powerStatus(s.mode)}</strong><small>{sample.voltage.toFixed(1)} V DC จำลอง</small></div>
    <div className="iso-kpi"><span><Battery size={15}/>ไฟสำรอง</span><strong>{Math.round(s.batterySoc*100)}<em>%</em></strong><small>{s.mode==='outage'&&s.batterySoc>0?'ใช้ไฟสำรอง':'ความจุตัวอย่าง 1.2 kWh'}</small></div>
    <div className="iso-kpi"><span><ShieldCheck size={15}/>อุปกรณ์สำคัญ</span><strong>{['P0','P1'].filter(id=>on(id as NodeId)).length}<em>/ 2</em></strong><small>ตามนโยบายสาธิต</small></div>
    <Link className="iso-kpi" href="/notifications/"><span><Bell size={15}/>แจ้งเตือน</span><strong>{unread}<em>รายการ</em></strong><small>ยังไม่รับทราบ ในเครื่องนี้</small></Link>
   </div>
   <aside className="iso-inspector" aria-label="รายละเอียดจุดที่เลือก" data-testid="equipment-inspector">
    <div className="iso-inspector-title"><img src={assetUrl('/powerguard/icons/'+(node.id==='P0'?'power':node.id==='P1'?'cage':node.id==='P2'?'house':'lightning')+'.svg')} width={40} height={40} alt=""/><div><small>จุดเสนอ รอสำรวจ</small><h2>{label(node.id)}</h2></div></div>
    <span className={'iso-equipment-state '+(on(node.id)?'on':'off')}>{on(node.id)?'เครื่องทำงาน':'เครื่องหยุดชั่วคราว'}</span>
    <dl><div><dt>แหล่งจ่าย</dt><dd>{!on(node.id)?'พักโหลด':s.mode==='outage'?'ไฟสำรอง':'ไฟหลัก'}</dd></div><div><dt>กำลังโหลดจำลอง</dt><dd>{on(node.id)?node.watts:0} W</dd></div><div><dt>การส่งข้อมูล</dt><dd>{s.nodeOffline===node.id?'ขาดการเชื่อมต่อ':!on(node.id)?'ไม่มีไฟเลี้ยง':'พร้อมในเดโม'}</dd></div></dl>
    {node.id==='P1'&&s.sensorFault&&<p className="iso-sensor-warning">เซนเซอร์ต้องตรวจสอบ ค่าน้ำบางส่วนจึงไม่แสดง</p>}
    <div className="iso-latest"><small>เหตุในรอบจำลองนี้</small><p>{event?(engineering?event.message:simpleText(event.message)):'ยังไม่มีเหตุเฉพาะจุด'}</p><span>{event?'T+'+event.minute.toFixed(1)+' นาที':'รอเหตุการณ์'}</span></div>
    <button className="pg-button secondary" onClick={()=>s.setCameraMode('focus-'+node.id)}><Focus size={15}/>เข้าใกล้จุดนี้</button>
    <Link className="iso-detail-link" href="/devices/">ดูอุปกรณ์ทั้งหมด<ArrowUpRight size={14}/></Link>
   </aside>
   <div className="iso-view-tools"><div className="iso-view-switch" role="group" aria-label="เลือกมุมมองพื้นที่"><button aria-pressed={view==='3d'} onClick={()=>setView('3d')}>3D</button><button aria-pressed={view==='2d'} onClick={()=>setView('2d')}>ผัง 2D</button></div>
    <select aria-label="คุณภาพฉาก" value={quality} onChange={e=>setQuality(e.target.value as typeof quality)}><option value="low">เบา</option><option value="balanced">สมดุล</option><option value="high">ละเอียด</option></select>
   </div>
   <div className="iso-camera-tools" aria-label="ควบคุมกล้อง"><button aria-label="ซูมเข้า" disabled={view==='2d'} onClick={()=>cameraAction('in')}><Plus size={17}/></button><button aria-label="ซูมออก" disabled={view==='2d'} onClick={()=>cameraAction('out')}><Minus size={17}/></button><button aria-label="หมุนซ้าย" disabled={view==='2d'} onClick={()=>cameraAction('left')}><RotateCcw size={17}/></button><button aria-label="หมุนขวา" disabled={view==='2d'} onClick={()=>cameraAction('right')}><RotateCw size={17}/></button><button aria-label="คืนมุม Isometric" onClick={resetCamera}><Focus size={17}/></button></div>
   <div className="iso-help"><SeaBassAssistant dialogueId={currentDialogue()}/></div>
   <div className="iso-incident-timeline" aria-label="ลำดับเหตุจำลอง"><div className="iso-timeline-label"><b>ลำดับเหตุ</b><span>ข้อมูลทดลอง</span><small>T+{s.minute.toFixed(0)} นาที</small></div><ol>{journey.map((step,i)=><li key={step.label} className={step.active?'active':step.seen?'seen':''}><i>{step.seen?<Check size={11}/>:i+1}</i><span>{step.label}</span><small>{step.minute===null?'ยังไม่มีเหตุ':step.minute.toFixed(1)+' นาที'}</small></li>)}</ol></div>
  </section>
  <section className="iso-operation-bar" id="iso-controls" aria-label="ลองเหตุการณ์ร่วมกัน"><div><strong>ลองจำลอง</strong><span>ทุกปุ่มเปลี่ยนฉาก กราฟ และบันทึกเหตุ</span></div><div className="iso-scenario-actions"><button onClick={normal} aria-label="จำลองไฟปกติ"><Check size={15}/>ไฟปกติ</button><button onClick={()=>s.setScenario('sag')} aria-label="จำลองไฟตก"><Zap size={15}/>ไฟตก</button><button className="outage" onClick={()=>s.setScenario('outage')} aria-label="จำลองไฟดับ"><Unplug size={15}/>ไฟดับ</button><button onClick={()=>s.setScenario('recovery')} aria-label="จำลองไฟกลับมา"><RotateCw size={15}/>ไฟกลับมา</button><Link href="/simulation/">ทุกเหตุการณ์<ArrowUpRight size={14}/></Link></div></section>
  <div className="iso-equipment-selector" role="group" aria-label="เลือกอุปกรณ์ในพื้นที่">{ids.map(id=><button key={id} aria-pressed={s.selectedNode===id} onClick={()=>select(id)}><i className={on(id)?'on':'off'}/><span>{label(id)}</span><small>{on(id)?s.mode==='outage'?'ใช้ไฟสำรอง':'ทำงาน':'พักโหลด'}</small></button>)}</div>
  {operator&&<section className="iso-operator"><div><h2>รับเหตุและติดตามการดูแล</h2><p>ผู้ดูแลหน้างานยังต้องยืนยันกับชุมชน บันทึกนี้อยู่ในเครื่องและยังไม่ส่งให้หน่วยงาน</p></div><button className="pg-button" disabled={!notice} onClick={()=>notice&&ui.acknowledge(notice.id)}>รับทราบเหตุล่าสุด</button><Link className="pg-button secondary" href="/history/">บันทึกการดูแล</Link></section>}
  <div className="iso-chart-grid"><section className="pg-card"><div className="iso-section-title"><h2>ไฟหลัก</h2><span>V DC ค่าจำลอง</span></div><PowerChart/><small>เหตุเปลี่ยนทันที แม้พักเวลา</small></section><section className="pg-card"><div className="iso-section-title"><h2>พลังงานสำรอง</h2><span>% ค่าจำลอง</span></div><BatteryChart/><small>ใช้ตามโหลดที่ยังทำงาน รวม {calcPower(s.mode,s.batterySoc,s.nodeOffline,s.recoveryStage)} W สมมติ</small></section></div>
  <section className="iso-response-flow"><h2>เมื่อเกิดเหตุ ใครทำอะไร</h2><div>{[['เกิดอะไร','ดูแรงดันและสถานะอุปกรณ์','/power/'],['ต้องทำอะไร','ตรวจข้อมูลก่อนเลือกวิธีแก้','/notifications/'],['ใครดูแล','ตกลงผู้รับแจ้งก่อนลงพื้นที่','/roles/'],['มีบันทึกแล้ว','บันทึกการแก้ไขและส่งออก','/history/']].map(([name,detail,path])=><Link key={name} href={path}><strong>{name}</strong><span>{detail}</span><ArrowUpRight size={16}/></Link>)}</div></section>
  <div className="iso-lower-grid"><section className="pg-card"><h2>เริ่มจากโหลดที่ต้องใช้ต่อ</h2><p>แผนที่บันทึก: {plan.watts.toFixed(0)} W สำหรับ {ui.plan.hours} ชั่วโมง</p><strong className="iso-plan-value">{plan.requiredWh.toFixed(0)} <small>Wh สมมติ</small></strong><p>{plan.cost===null?'ต้นทุนยังรอราคาและค่าติดตั้ง':plan.cost.toLocaleString('th-TH',{maximumFractionDigits:0})+' บาท ตามราคาที่ผู้ใช้ใส่'}</p><Link href="/backup-plan/" className="pg-button secondary">เลือกโหลดและเทียบ UPS<ArrowUpRight size={15}/></Link></section><section className="pg-card"><h2>หลักฐานก่อนขยาย</h2><p>เอกสารชุมชนลงวันที่ 16 ก.ค. 2569 รายงานว่าไฟยังไม่เสถียร แต่ยังไม่มีชุดบันทึกแรงดันเพื่อระบุความถี่และอุปกรณ์ที่ได้รับผล</p><p>ขั้นต่อไปคือวัดไฟ โหลดจริง และวิธีรับเหตุเดิมที่จุดทดลองซึ่งชุมชนยินยอม</p><div className="iso-evidence-links"><Link href="/roadmap/">แผนทดลอง<ArrowUpRight size={14}/></Link><a href="https://peephatz-dev.github.io/community-field-notes/presentation-guide.html#decision-board" target="_blank" rel="noreferrer">ข้อมูลที่ต้องยืนยัน<ArrowUpRight size={14}/></a></div></section></div>
 </div>;
}
