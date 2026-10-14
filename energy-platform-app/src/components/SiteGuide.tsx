'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Battery, ChevronLeft, ChevronRight, ClipboardCheck, Cpu, Database, Radio, ShieldCheck, Users, Waves, Zap } from 'lucide-react';
import { activeLoad, calcPower, NODE_DEFINITIONS, type NodeId } from '@/lib/model';
import { useSimulator } from '@/store/simulator';
import { SitePlan, SiteWaterPanel } from './SitePlan';

const teamRoles = [
  { name: 'นาย', role: 'สถาปัตยกรรมและภาพรวมระบบ', Icon: Cpu, duty: 'เชื่อมพื้นที่ท่าเรือลุงทอง แนวบ้าน และกลุ่มกระชังเข้ากับ P0–P3 กำหนดว่าข้อมูลเดินอย่างไร ไฟสำรองรักษาโหลดใด และขอบเขตไหนยังเป็นข้อเสนอ', deliverable: 'ผัง architecture + power/data flow + เหตุผลลำดับ P0 > P1 > P2 > P3 + ขอบเขตทดลองแรงดันต่ำ', handoff: 'ส่งขอบเขตและ interface ให้โฟล์ค/บอส แล้วตรวจความสอดคล้องของ dashboard กับพี' },
  { name: 'โฟล์ค', role: 'เซนเซอร์ วงจร และความปลอดภัยไฟฟ้า', Icon: ShieldCheck, duty: 'เลือกแนวทางวัดแรงดัน กระแส ความเค็ม และอุณหภูมิ ตรวจ interface โพรบ แหล่งจ่าย การซีล และการป้องกันให้เหมาะกับการทำงานริมน้ำ', deliverable: 'วงจรอ้างอิงแรงดันต่ำ + BOM/พิกัดที่ต้องยืนยัน + ขั้นตอนสอบเทียบ + แผนตรวจโหลดและ startup current', handoff: 'ส่งหน่วย/ช่วงวัด/quality flag ให้พี และ pin/interface ให้บอส; ให้ผู้มีความรู้ตรวจวงจรก่อนต่อจริง' },
  { name: 'พี', role: 'ข้อมูล Dashboard กราฟ และการแจ้งเตือน', Icon: Database, duty: 'แสดงไฟหลัก บัสสำรอง โหลด และค่าน้ำให้แยกความหมายกัน ทำกราฟที่ไม่เติมค่าศูนย์แทนเซนเซอร์เสีย และทำ alert ที่บอกจุด เวลา ผลกระทบ และ action', deliverable: 'dashboard + นิยามข้อมูล/หน่วย + event/alert view + JSON/CSV + ตัวอย่างกรณีข้อมูลขาดหรือผิดปกติ', handoff: 'รับ schema จากบอสและช่วงวัดจากโฟล์ค; ส่งภาพและหลักฐานเดโมให้ข้าวฟ่างตรวจคำกล่าว' },
  { name: 'บอส', role: 'การสื่อสาร ข้อความโหนด และ State', Icon: Radio, duty: 'กำหนดข้อความ P1–P3 ไป P0 ลำดับ seq เวลารับล่าสุด การตรวจ stale/offline และการฟื้นระบบ โดยแยกการขาดการสื่อสารออกจากไฟดับ', deliverable: 'message schema + state transitions + timeout/recovery rules + แผนทดสอบเครือข่ายในแนวบ้านและกลุ่มกระชัง', handoff: 'ส่ง schema ให้พี และข้อกำหนด interface ให้โฟล์ค; ตรวจ event history และ restoration flow ร่วมกับนาย' },
  { name: 'ข้าวฟ่าง', role: 'เอกสาร การยืนยัน และการอธิบาย', Icon: ClipboardCheck, duty: 'ผูกคำกล่าวกับ Data Pack และภาพอ้างอิง ระบุสิ่งที่เห็น ข้อเสนอ ค่าจำลอง และส่วนที่ยังต้องลงพื้นที่ ทำสไลด์/เรื่องเล่าให้คนทุกสายเข้าใจตรงกัน', deliverable: 'evidence/validation checklist + เอกสารขอบเขตและข้อจำกัด + Presentation + แผนถ่าย Video Walkthrough จากงานจริง', handoff: 'ตรวจข้อมูลกับทุกคนก่อนส่ง; นัดผู้เลี้ยง/ผู้ดูแลเพื่อยืนยันโจทย์ โหลด จุดวัด และผู้รับเหตุ' },
] as const;

const communityRoles = [
  ['ผู้เลี้ยงปลา', 'กลุ่มกระชังและทางขึ้นท่า', 'บอกโหลดที่กระทบการดูแลปลา ช่วงเวลาที่ต้องคงไว้ อาการที่พบ และวิธีรับมือเดิม ร่วมยืนยันตำแหน่ง P1 และเวลาวัดน้ำ', 'ข้อมูลอาชีพ/โหลดจริง + ผู้ร่วมทดลองที่ยินยอม'],
  ['ผู้ดูแลชุมชน / ผู้ปฏิบัติงาน', 'แนวบ้าน ถนนริมน้ำ และจุด P0 ที่เสนอ', 'ตรวจหน้าจอและบันทึกเหตุ รับ alert ตามบทบาทที่ตกลง และประสานคนพื้นที่เมื่อไฟหรือข้อมูลขาด ไม่ใช้สีบนหน้าจอแทนการตรวจหน้างาน', 'เวรดูแล + ผู้รับเหตุ + ขั้นตอนตอบสนอง'],
  ['ผู้บำรุงรักษาทางเทคนิค', 'ตู้ควบคุม แนวสาย และจุดติดตั้งริมกระชัง', 'ตรวจไฟเลี้ยง สาย โพรบ วิทยุ ซีล และการกัดกร่อน แยกเซนเซอร์ผิดปกติออกจากการเปลี่ยนแปลงของน้ำ', 'บันทึกซ่อม/สอบเทียบ + รอบตรวจ + วิธีหยุดใช้อุปกรณ์'],
  ['ผู้ใช้ข้อมูลมอนิเตอร์', 'P1 จุดหลัก และ B/C จุดอ้างอิงที่เสนอ', 'เทียบแนวโน้มกับเครื่องมืออ้างอิง เวลา/ระดับน้ำ และข้อมูลที่หน่วยงานมีอยู่ ตรวจ quality flag ก่อนตีความ', 'เกณฑ์ตรวจข้อมูล + สิทธิ์เข้าถึง + แผนเทียบระบบเดิม'],
  ['ผู้ตัดสินใจร่วมกับชุมชน', 'ภาระโหลด P0–P3 และงบการทดลอง', 'ตกลงว่าควรคงหรือตัดโหลดใด ใครมีสิทธิ์สั่งการ ใครรับค่าใช้จ่าย และเมื่อใดควรยุติ/ขยายการทดลอง', 'ลำดับโหลดที่ยืนยัน + งบ + เกณฑ์ตัดสินใจทดลอง'],
] as const;

export function SiteRolesGuide() {
  return <section className="site-guide" aria-label="บทบาททีมและชุมชนสำหรับพื้นที่ท่าเรือลุงทอง">
    <div className="guide-heading"><div><span className="guide-eyebrow">TEAM → FIELD VALIDATION</span><h2>ใครทำอะไร และต้องส่งอะไร</h2><p>แบ่งเจ้าของงานให้ชัด แล้วรวมหลักฐานเพื่อยืนยันระบบที่จะทดลองใกล้ท่าเรือลุงทอง</p></div><Users size={22} /></div>
    <div className="guide-role-grid">{teamRoles.map(({name,role,Icon,duty,deliverable,handoff}) => <article className="guide-role-card page-panel" key={name}>
      <div className="guide-person"><Icon size={21} /><div><h3>{name}</h3><span>{role}</span></div></div>
      <p className="guide-role-duty">{duty}</p>
      <div className="guide-role-deliverable"><strong>สิ่งที่ต้องส่ง</strong><p>{deliverable}</p></div>
      <div className="guide-handoff"><strong>ช่วยกันทำ / ส่งต่อ</strong><p>{handoff}</p></div>
    </article>)}</div>
    <div className="guide-note"><Users size={18} /><span><strong>ทั้งทีมช่วยกันยืนยัน</strong> ปัญหาจริงและ workflow เดิม · ลำดับโหลด · จุดติดตั้งที่เข้าถึงได้ · ผู้รับเหตุ · วิธีวัดผล ก่อนกำหนดคำกล่าวว่าจะใช้งานจริงได้</span></div>
    <div className="guide-heading spaced"><div><span className="guide-eyebrow">COMMUNITY & SYSTEM ROLES</span><h2>ใครต้องร่วมยืนยันในพื้นที่</h2><p>บทบาทต่อไปนี้เป็นกลุ่มที่ต้องประสาน ยังไม่ได้อ้างว่ามีผู้รับผิดชอบหรือตกลงติดตั้งแล้ว</p></div></div>
    <div className="guide-community-grid">{communityRoles.map(([name,where,action,output]) => <article className="guide-community-card page-panel" key={name}><h3>{name}</h3><span className="guide-eyebrow">{where}</span><p>{action}</p><div className="guide-role-deliverable"><strong>สิ่งที่ต้องยืนยันร่วมกัน</strong><p>{output}</p></div></article>)}</div>
    <div className="guide-actions"><Link className="control-btn" href="/process/">ดูลำดับการทำงาน<ArrowRight size={15} /></Link><Link className="control-btn" href="/docs/">ข้อมูลที่ยังต้องหาเพิ่ม<ArrowUpRight size={15} /></Link></div>
  </section>;
}

function useLiveGuideState() {
  const mode = useSimulator(s => s.mode), batterySoc = useSimulator(s => s.batterySoc), nodeOffline = useSimulator(s => s.nodeOffline), sensorFault = useSimulator(s => s.sensorFault), waterShift = useSimulator(s => s.waterShift), recoveryStage = useSimulator(s => s.recoveryStage), minute = useSimulator(s => s.minute), samples = useSimulator(s => s.samples), events = useSimulator(s => s.events);
  return { mode, batterySoc, nodeOffline, sensorFault, waterShift, recoveryStage, minute, sample: samples.at(-1)!, samples, events, powered: (id:NodeId) => activeLoad(id,mode,batterySoc,nodeOffline,recoveryStage) };
}

function LiveGuideStatus({ compact = false }: { compact?:boolean }) {
  const state = useLiveGuideState();
  return <aside className={`guide-live-status page-panel ${compact?'guide-live-compact':''}`} aria-label="สถานะจากตัวจำลองกลาง">
    <div className="guide-heading"><div><span className="guide-eyebrow">SHARED SIMULATION</span><h3>สถานะเดียวกับทุกหน้า</h3></div><span className="simulation-tag">SIMULATED</span></div>
    <div className="guide-live-grid"><div className="guide-live-reading"><span>ไฟหลัก · DC</span><strong>{state.sample.voltage.toFixed(1)} <small>V</small></strong></div><div className="guide-live-reading"><span>บัสโหลด · DC</span><strong>{state.sample.busVoltage.toFixed(1)} <small>V</small></strong></div><div className="guide-live-reading"><span>สำรอง</span><strong>{Math.round(state.batterySoc*100)} <small>%</small></strong></div><div className="guide-live-reading"><span>กำลังโหลด</span><strong>{calcPower(state.mode,state.batterySoc,state.nodeOffline,state.recoveryStage)} <small>W*</small></strong></div></div>
    <div className="guide-node-status">{NODE_DEFINITIONS.map(node=><div key={node.id}><b>{node.id}</b><span className={`status-pill ${state.powered(node.id)?'normal':'simulated'}`}>{state.powered(node.id)?'โหลดจ่าย':'โหลดหยุด'}</span><small>{state.nodeOffline===node.id?'ไม่ส่งข้อมูล':'ข้อมูลจำลอง'}</small></div>)}</div>
    <p className="guide-note">T+{state.minute} นาทีจำลอง · ความเค็ม {state.sensorFault?'sensor fault':state.waterShift?'อินพุตเปลี่ยนจำลอง':'อินพุตสังเคราะห์'} · DO ไม่มีข้อมูล</p>
    {!compact&&state.events[0]&&<div className="guide-handoff"><strong>เหตุการณ์ล่าสุด · {state.events[0].nodeId}</strong><p>{state.events[0].message}</p><p>{state.events[0].action}</p></div>}
  </aside>;
}

export function SiteProcessGuide() {
  const state = useLiveGuideState(), setScenario = useSimulator(s=>s.setScenario);
  const steps = [
    ['Sensing', 'ตรวจไฟและค่าน้ำ ณ จุดที่เสนอ', 'P1 ใกล้กลุ่มกระชังเป็นจุดหลัก เสนอ B สำหรับสังเกตแนวเปลี่ยนสีและ C สำหรับเปรียบเทียบ ต้องกำหนดเครื่องมือ เวลา ความลึก และการสอบเทียบก่อนติดตั้ง', !state.powered('P1')?'P1 โหลดหยุด':state.nodeOffline==='P1'?'P1 ขาดการสื่อสาร':state.sensorFault?'ความเค็มขาด / fault':'ค่าน้ำสังเคราะห์ · B/C ยังไม่มีเครื่องมือ'],
    ['Node processing', 'ประมวลผลและติดป้ายคุณภาพ', 'โหนดตรวจ range ความสมเหตุสมผล และข้อมูลขาด ก่อนส่งค่า หน่วย seq และ quality flag ไม่ตีความเซนเซอร์เสียเป็นน้ำวิกฤต', state.sensorFault?'sensor fault แยกจาก water event':'ตัวอย่างอินพุตจำลองพร้อม quality label'],
    ['Communication', 'ส่ง P1–P3 ไป P0', 'ตรวจ seq และ last_seen เพื่อแยก online/stale/offline ระยะบ้านถึงกระชังและสิ่งกีดขวางต้องตรวจสัญญาณจริง', state.nodeOffline?`${state.nodeOffline} ไม่ส่งข้อมูล`:'ไม่มีเครือข่ายจริง · จำลองการรับข้อมูล'],
    ['P0 aggregation', 'รวมข้อมูลที่ศูนย์ควบคุมริมฝั่ง', 'P0 รวบรวมข้อมูลไฟ โหลด เซนเซอร์ และเวลา สงวนข้อมูลต้นทางและบันทึกเหตุ โดยตำแหน่งบนผังยังเป็น PROPOSED', `${state.samples.length} records · T+${state.minute}`],
    ['Event evaluation', 'จำแนกเหตุและผลกระทบ', 'ประเมินไฟหลัก การสื่อสาร และคุณภาพเซนเซอร์แยกกัน น้ำเปลี่ยนจากอินพุตจำลองต้องเทียบเครื่องอ้างอิง ไม่ใช้สีผิวน้ำยืนยันความเค็มหรือ DO', state.mode==='outage'?'ไฟหลักดับ':state.mode==='sag'?'แรงดันตก':state.waterShift?'เหตุเปลี่ยนน้ำจำลอง':'ไฟหลักปกติ'],
    ['Backup decision', 'ประเมินพลังงานที่จะคงโหลด', 'เมื่อไฟหลักดับ ประเมินแบตเตอรี่และบัสสำรองก่อนจ่ายโหลด ความจุและแรงดันที่เห็นเป็นค่าตัวอย่าง ต้องวัดโหลด/สูญเสีย/startup current จริง', state.mode==='outage'?(state.batterySoc>0?'บัสสำรองจำลองทำงาน':'สำรองหมด'):'ไฟหลักจ่าย · ไม่จำลองการชาร์จ'],
    ['Load prioritization', 'ตัด P3 ก่อน และคงโหลดสำคัญ', 'P0 > P1 > P2 > P3 เป็นนโยบาย ไม่ใช่การต่ออนุกรม P2 หยุดเมื่อสำรองต่ำกว่า 28% และ P1 หยุดเมื่อไม่พอขอบเขต 8% ในเดโม', `P1 ${state.powered('P1')?'คง':'หยุด'} · P2 ${state.powered('P2')?'คง':'หยุด'} · P3 ${state.powered('P3')?'คง':'หยุด'}`],
    ['Dashboard update', 'อัปเดตกราฟและสถานะร่วมกัน', 'กราฟไฟหลัก บัสโหลด กระแส แบตเตอรี่ และค่าน้ำใช้ state กลางเดียวกับฉาก/วงจร หน่วยและสถานะจำลองต้องติดกับทุกค่า', `ไฟหลัก ${state.sample.voltage.toFixed(1)} V · บัส ${state.sample.busVoltage.toFixed(1)} V`],
    ['Alerting', 'แจ้งว่าอะไรเกิด ที่ไหน และควรทำอะไร', 'บอกโหนด เวลา ความรุนแรง ความหมาย และ recommended action การแจ้งเตือนในเว็บยังไม่ส่ง LINE/SMS หรือสั่งงานอุปกรณ์จริง', state.events[0]?`${state.events[0].nodeId} · ${state.events[0].severity}`:'ยังไม่มีเหตุ'],
    ['Human response', 'ให้ผู้รับเหตุยืนยันหน้างาน', 'ผู้เลี้ยง/ผู้ดูแลตรวจอุปกรณ์ น้ำ และเครื่องอ้างอิงตามบทบาทที่ตกลง ผู้บำรุงรักษาตรวจวงจร/สื่อสาร และจด action เพื่อประเมิน false alarm', 'รอยืนยันผู้รับเหตุและวิธีตอบสนองจริง'],
    ['Recovery', 'คืนโหลดตามลำดับและเก็บประวัติ', 'เมื่อไฟหลักกลับ เดโมคืน P0/P1 ก่อน แล้ว P2 และ P3 ตามการเดินเวลา เก็บ SoC ประวัติ และ fault เดิมเพื่อให้ตรวจสอบย้อนหลัง', state.mode==='outage'?'ยังใช้สำรอง':state.recoveryStage===0?'คืน P0/P1 แล้ว':state.recoveryStage===1?'คืน P2 แล้ว · รอ P3':'โหลดที่อนุญาตพร้อมทำงาน'],
  ];
  return <section className="site-guide" aria-label="ลำดับการตอบสนองของระบบพื้นที่ท่าเรือลุงทอง">
    <div className="guide-heading"><div><span className="guide-eyebrow">SENSE → ACT → RECOVER</span><h2>11 ขั้นจากจุดวัด ถึงคนรับเหตุ</h2><p>กดสถานการณ์แล้วดูป้ายสถานะในแต่ละขั้นเปลี่ยนตามตัวจำลองเดียวกับฉากและ Dashboard</p></div></div>
    <div className="guide-actions"><button className="control-btn" onClick={()=>setScenario('sag')}>แรงดันตก</button><button className="control-btn danger" onClick={()=>setScenario('outage')}>ไฟหลักดับ</button><button className="control-btn" onClick={()=>setScenario('water-change')}>น้ำเปลี่ยนจำลอง</button><button className="control-btn" onClick={()=>setScenario('offline')}>P2 ไม่ส่งข้อมูล</button><button className="control-btn" onClick={()=>setScenario('sensor-fault')}>Sensor fault</button><button className="control-btn primary" onClick={()=>setScenario('recovery')}>ฟื้นระบบ · เก็บประวัติ</button></div>
    <div className="guide-process-layout"><ol className="guide-process-list">{steps.map(([phase,title,body,status],index)=><li className="guide-process-step" key={phase}><span className="guide-step-number">{String(index+1).padStart(2,'0')}</span><div className="guide-step-body"><span className="guide-eyebrow">{phase}</span><h3>{title}</h3><p>{body}</p><span className="status-pill">{status}</span></div></li>)}</ol><LiveGuideStatus /></div>
    <div className="guide-note"><ShieldCheck size={18}/><span>ขั้นแจ้งเตือนและการตัดสินใจของคนเป็น workflow ที่เสนอ ระบบนี้จำลองในเบราว์เซอร์และยังไม่เชื่อมต่ออุปกรณ์จริง <Link href="/roles/">ดูผู้รับผิดชอบและสิ่งที่ต้องยืนยันร่วมกัน</Link></span></div>
  </section>;
}

const deckStages: {title:string;eyebrow:string;body:string;node:NodeId;camera:string;route:string;routeLabel:string;talk:string}[] = [
  {title:'พื้นที่นี้คือที่ทำงานของระบบ',eyebrow:'01 · AERIAL SITE INTRODUCTION',body:'แนวบ้านและถนนริมฝั่ง เชื่อมทางขึ้นท่ากับกลุ่มกระชังหลายแนวใกล้ท่าเรือลุงทอง ผังและฉากวาดใหม่เพื่อรักษาความสัมพันธ์ที่เห็นในภาพอ้างอิง',node:'P0',camera:'aerial',route:'/',routeLabel:'เปิดภาพรวม 3D',talk:'ชี้ตำแหน่งแนวฝั่ง กระชัง และท่า ก่อนอธิบายเทคโนโลยี ระบุว่าผังเป็นสัดส่วนภาพอ้างอิง ไม่ใช่พิกัดสำรวจ'},
  {title:'ชุมชนและโหลดจำเป็นอยู่ริมฝั่ง',eyebrow:'02 · WATERFRONT COMMUNITY',body:'P0 รับข้อมูลและจัดลำดับ ส่วน P2 แทนโหลดจำเป็นในแนวบ้าน P3 แทนโหลดที่ยืดหยุ่นได้ ตำแหน่งที่เลือกต้องเข้าถึง ตรวจซ่อม และยืนยันผู้ดูแลก่อนทดลอง',node:'P2',camera:'walk',route:'/explore/',routeLabel:'ดูแนวชุมชน',talk:'อธิบายว่าใครดูหน้าจอ ใครรับเหตุ และอุปกรณ์ใดต้องทำงานต่อ อย่าอ้างว่าจุดบนผังติดตั้งแล้ว'},
  {title:'กระชังหนาแน่น ต้องตรวจโหลดที่เกี่ยวข้อง',eyebrow:'03 · AQUACULTURE LAYOUT',body:'P1 เสนอใกล้กลุ่มกระชังเพื่อคงข้อมูลและโหลดประมงที่ตกลงว่าสำคัญ กลุ่มกระชังที่เห็นมีหลายแนวและช่องน้ำคั่น จำนวนรูปในฉากเป็นตัวแทน ไม่ใช่สถิติกระชังจริง',node:'P1',camera:'aquaculture',route:'/explore/',routeLabel:'ดู P1 และกระชัง',talk:'เชื่อม livelihood กับการคงโหลด แต่ยังต้องวัดกำลังไฟ ช่วงใช้ เวลาไฟตก และวิธีรับมือเดิมของผู้เลี้ยง'},
  {title:'แนวสีของน้ำ ช่วยตั้งคำถามเรื่องจุดวัด',eyebrow:'04 · WATER TRANSITION',body:'Zone A คือจุดหลักที่เสนอใกล้กระชัง B คือจุดสังเกตแนวเปลี่ยนสี และ C คือจุดเปรียบเทียบด้านนอก สีอาจต่างจากความขุ่น มวลน้ำ หรือเงา ต้องยืนยันด้วยการวัด',node:'P1',camera:'transition',route:'/explore/',routeLabel:'ดูแนวเปลี่ยนสี',talk:'แยกสิ่งที่เห็นจากข้อเสนอ จุด B/C ยังไม่มีเครื่องมือ ไม่มีตัวเลขจริง และสีไม่ยืนยันความเค็มหรือ DO'},
  {title:'วาง P0–P3 ตามความสัมพันธ์ของพื้นที่',eyebrow:'05 · PROPOSED NODE PLACEMENT',body:'P0 อยู่ฝั่งที่ดูแลได้ P1 อยู่กลุ่มกระชัง P2 แทนโหลดจำเป็นริมบ้าน และ P3 แทนโหลดทั่วไป กติกาสำรองคือ P0 > P1 > P2 > P3 โดยต้องร่วมยืนยันกับผู้ใช้',node:'P0',camera:'power',route:'/explore/',routeLabel:'ดูทางเดินพลังงาน',talk:'ใช้ผังเพื่อถามระยะ สัญญาณ การเข้าถึง การซีล และสิทธิ์ติดตั้ง ไม่อ้างความแม่นยำเชิงสำรวจ'},
  {title:'วงจรอธิบายการทำงานแรงดันต่ำ',eyebrow:'06 · REFERENCE HARDWARE',body:'ESP32 concept รับข้อมูล V/I และโพรบน้ำ ผ่าน interface ที่ต้องเลือก แบตเตอรี่/BMS และ driver เป็นโครงอ้างอิงให้ตรวจความสัมพันธ์ของพลังงานและข้อมูล',node:'P0',camera:'circuit',route:'/circuit/',routeLabel:'เปิด Circuit Lab',talk:'เปิด assembly/exploded แล้วชี้การป้องกัน แหล่งจ่าย และ GPIO ผ่าน driver ระบุ REFERENCE DESIGN — REQUIRES VALIDATION'},
  {title:'ทดลองไฟดับ แล้วดูโหลดที่คงไว้',eyebrow:'07 · OUTAGE RESPONSE',body:'กดเริ่มเหตุจำลองเพื่อให้ไฟหลักเป็นศูนย์ บัสสำรองรับโหลดที่อนุญาต และ P3 หยุดก่อน แบตเตอรี่ลดตามเวลาจำลอง เมื่อไม่พอจึงหยุด P2/P1 ตามขอบเขตสาธิต',node:'P0',camera:'power',route:'/simulation/',routeLabel:'เปิด Scenario Lab',talk:'ให้กรรมการดูไฟหลักกับบัสสำรองแยกกัน ชี้ว่าค่า W/ความจุ/threshold เป็นค่าตัวอย่าง และทดสอบ recovery โดยเก็บประวัติ'},
  {title:'Dashboard อธิบายเหตุและข้อมูลที่ขาด',eyebrow:'08 · MONITORING RESPONSE',body:'กราฟแรงดัน กระแสบัส แบตเตอรี่ โหลด และค่าน้ำใช้ state เดียวกัน Alert ระบุโหนด เวลา และ action เซนเซอร์เสียแสดงช่องว่าง การสื่อสารขาดไม่สรุปว่าไฟดับ',node:'P1',camera:'aquaculture',route:'/dashboard/',routeLabel:'เปิด Dashboard',talk:'เปรียบเทียบ outage, offline และ sensor fault; แสดง export ที่มี simulated:true และ DO unavailable'},
  {title:'ประโยชน์ที่ต้องพิสูจน์ และข้อจำกัด',eyebrow:'09 · EXPECTED BENEFITS',body:'เป้าหมายคือเห็นเหตุเร็วขึ้น ตรวจสอบย้อนหลังได้ และคงโหลดที่ตกลงว่าสำคัญ ประโยชน์ยังไม่ใช่ผลวัดจริง ต้องเทียบ workflow เดิมและผลทดลองกับผู้ใช้',node:'P1',camera:'aquaculture',route:'/solution/',routeLabel:'ดูโจทย์และขอบเขต',talk:'ไม่อ้างลดปลาตาย ลดค่าไฟ หรือเพิ่มรายได้เป็นตัวเลข หากยังไม่มีข้อมูลทดลองและตัวเปรียบเทียบ'},
  {title:'สิ่งที่ต้องยืนยันก่อนนำไปใช้จริง',eyebrow:'10 · VALIDATION ROADMAP',body:'ร่วมยืนยันปัญหา/โหลด เลือกจุดวัดและผู้รับเหตุ เก็บ log ไฟและค่าน้ำ ตรวจวงจรแรงดันต่ำ ทดลองการสื่อสาร แล้วทำ pilot ที่มีเกณฑ์หยุดและผู้ดูแลชัดเจน',node:'P0',camera:'aerial',route:'/docs/',routeLabel:'เปิดรายการข้อมูลที่ต้องหา',talk:'จบด้วยหลักฐานที่ทีมจะหาเพิ่ม เจ้าของงาน และสิ่งที่ส่งในรอบถัดไป สถานะผลงานต้องตรงกับสิ่งที่ทดลองแล้ว'},
];

export function SitePresentationGuide() {
  const router = useRouter(), [index,setIndex] = useState(0), [loaded,setLoaded] = useState(false);
  const state = useLiveGuideState(), selected = useSimulator(s=>s.selectedNode), setCamera = useSimulator(s=>s.setCameraMode), setSelected = useSimulator(s=>s.setSelectedNode), setScenario = useSimulator(s=>s.setScenario), setCircuitMode = useSimulator(s=>s.setCircuitMode);
  const stage=deckStages[index];
  useEffect(()=>{try{const saved=Number(sessionStorage.getItem('community-site-deck-stage'));if(Number.isInteger(saved)&&saved>=0&&saved<deckStages.length)setIndex(saved);}catch{}setLoaded(true);},[]);
  useEffect(()=>{if(loaded){try{sessionStorage.setItem('community-site-deck-stage',String(index));}catch{}}},[loaded,index]);
  useEffect(()=>{if(loaded){setCamera(stage.camera);setSelected(stage.node);}},[loaded,stage.camera,stage.node,setCamera,setSelected]);
  useEffect(()=>{const onKey=(event:KeyboardEvent)=>{if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.defaultPrevented)return;const target=event.target as HTMLElement|null;if(document.querySelector('dialog[open]')||target?.closest('input,textarea,select,[contenteditable="true"]'))return;if(target&&target!==document.body&&!target.closest('.guide-deck'))return;if(event.key==='ArrowRight'){event.preventDefault();setIndex(i=>Math.min(deckStages.length-1,i+1));}else if(event.key==='ArrowLeft'){event.preventDefault();setIndex(i=>Math.max(0,i-1));}else if(event.key==='Home'){event.preventDefault();setIndex(0);}else if(event.key==='End'){event.preventDefault();setIndex(deckStages.length-1);}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[]);
  const preview=()=>{setCamera(stage.camera);setSelected(stage.node);if(index===5)setCircuitMode('assembly');router.push(stage.route);};
  return <section className="site-guide guide-deck" aria-label="โหมดนำเสนอ 10 ฉากสำหรับกรรมการ" aria-keyshortcuts="ArrowLeft ArrowRight Home End">
    <div className="guide-deck-header"><div><span className="guide-eyebrow">INTERACTIVE JUDGE WALKTHROUGH</span><h2>จากสถานที่ ถึงการตอบสนองของระบบ</h2><p>10 ฉาก · ปุ่มก่อนหน้า/ถัดไป หรือแป้น ← → · กด Home/End เพื่อไปฉากแรก/สุดท้าย</p></div><span className="status-pill">{index+1} / {deckStages.length}</span></div>
    <div className="guide-deck-progress" role="progressbar" aria-label="ความคืบหน้าการนำเสนอ" aria-valuemin={1} aria-valuemax={deckStages.length} aria-valuenow={index+1}><span style={{width:`${(index+1)/deckStages.length*100}%`}}/></div>
    <div className="guide-deck-layout"><nav className="guide-deck-chapters" aria-label="เลือกฉากนำเสนอ">{deckStages.map((item,i)=><button key={item.title} className={`guide-deck-chapter ${i===index?'is-active':''}`} aria-current={i===index?'step':undefined} onClick={()=>setIndex(i)}><span>{String(i+1).padStart(2,'0')}</span><strong>{item.title}</strong></button>)}</nav>
      <article className="guide-deck-body page-panel"><div className="guide-deck-stage-copy" aria-live="polite"><span className="guide-eyebrow">{stage.eyebrow}</span><h3>{stage.title}</h3><p>{stage.body}</p></div>
        <div className="guide-deck-stage">{index<=4?<><SitePlan selectedNode={selected} onSelectNode={setSelected} showZones={index!==1}/>{index===3&&<SiteWaterPanel waterShift={state.waterShift} sensorFault={state.sensorFault} latestSample={state.sample} nodeOffline={state.nodeOffline==='P1'} powered={state.powered('P1')}/>}</>:<LiveGuideStatus compact/>}</div>
        {index===3&&<div className="guide-actions"><button className="control-btn" onClick={()=>setScenario('water-change')}><Waves size={15}/>ป้อนน้ำเปลี่ยนจำลอง · ไม่อนุมานจากสี</button></div>}
        {index===7&&<div className="guide-actions"><button className="control-btn" onClick={()=>setScenario('offline')}>P2 ไม่ส่งข้อมูล</button><button className="control-btn" onClick={()=>setScenario('sensor-fault')}>ความเค็ม sensor fault</button></div>}
        {index===6&&<div className="guide-actions"><button className="control-btn danger" onClick={()=>setScenario('outage')}><Zap size={15}/>เริ่มไฟหลักดับจำลอง</button><button className="control-btn" onClick={()=>setScenario('extended-outage')}><Battery size={15}/>ให้ไฟดับต่อเนื่อง</button><button className="control-btn" onClick={()=>setScenario('critical-battery')}>สำรองวิกฤต 7%*</button><button className="control-btn primary" onClick={()=>setScenario('recovery')}>ไฟกลับ · เก็บประวัติ</button></div>}
        {index===8&&<div className="guide-benefit-grid">{[['สิ่งที่หวังให้ดีขึ้น','ข้อมูลเหตุและลำดับโหลดชัดขึ้น ผู้รับเหตุมีข้อมูลช่วยตรวจ'],['หลักฐานที่ต้องหา','เวลาเดิมเทียบเวลาใหม่ จำนวน false alarm ความต่อเนื่องของโหลด และ usability'],['ข้อจำกัด','ไม่มี hardware จริง/ผลภาคสนาม และไม่ได้วัด DO']].map(([title,body])=><div className="guide-benefit-card" key={title}><strong>{title}</strong><p>{body}</p></div>)}</div>}
        <div className="guide-handoff"><strong>ไกด์สำหรับคนเล่า</strong><p>{stage.talk}</p></div><div className="guide-actions"><button className="control-btn primary" onClick={preview}>{stage.routeLabel}<ArrowUpRight size={15}/></button><Link className="control-btn" href="/docs/">หลักฐานและข้อจำกัด</Link></div>
      </article></div>
    <div className="guide-deck-controls"><button className="control-btn" disabled={index===0} onClick={()=>setIndex(i=>Math.max(0,i-1))}><ChevronLeft size={16}/>ก่อนหน้า</button><span>ฉาก {index+1} · ความคืบหน้าจำไว้ในเบราว์เซอร์นี้</span><button className="control-btn primary" disabled={index===deckStages.length-1} onClick={()=>setIndex(i=>Math.min(deckStages.length-1,i+1))}>ถัดไป<ChevronRight size={16}/></button></div>
    <div className="guide-note"><Waves size={18}/><span>ผังสร้างใหม่จากภาพอ้างอิง · ทุกตำแหน่ง PROPOSED · A/B/C เป็นแนวคิดจุดมอนิเตอร์ · ค่าที่เห็น SIMULATED · เดโมไม่ล้าง event history</span></div>
  </section>;
}
