'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, AlertTriangle, Battery, BatteryCharging, Bell, BookOpen, Boxes, Cable, ChartNoAxesCombined, Check, ChevronRight, CircleHelp, Clock3, Download, Droplets, Gauge, Home, Info, Lightbulb, Map, Network, Pause, Play, RotateCcw, Send, ShieldCheck, Thermometer, Users, Waves, Zap, Wifi, X, Menu, Maximize2, Minimize2, ArrowUpRight, MapPin, Compass } from 'lucide-react';
import { CIRCUIT_MODES } from '@/lib/view-modes';
import { COMPONENTS, NODE_DEFINITIONS, activeLoad as modelActiveLoad, calcPower as modelCalcPower, estimateRuntimeHours as modelRuntime, gridVoltage, type NodeId, type SimEvent } from '@/lib/model';
import { assetUrl } from '@/lib/urls';
import { useSimulator } from '@/store/simulator';
import SiteExperience from './SiteExperience';
import { SitePlan, SiteWaterPanel } from './SitePlan';
import { CANDIDATE_NODES } from '@/lib/site-layout';
import { SiteRolesGuide, SiteProcessGuide, SitePresentationGuide } from './SiteGuide';
import CitizenPages,{CITIZEN_NAV} from './powerguard/CitizenPages';
import SoundPanel from './powerguard/SoundPanel';
import IsometricDashboard from './powerguard/IsometricDashboard';
import {usePowerguard} from '@/store/powerguard';
import {powerStatus} from '@/lib/powerguard-model';
import brand from '@/lib/powerguard/brand.json';

const activeLoad:typeof modelActiveLoad=(id,mode,soc,offline)=>modelActiveLoad(id,mode,soc,offline,useSimulator.getState().recoveryStage);
const calcPower:typeof modelCalcPower=(mode,soc,offline)=>modelCalcPower(mode,soc,offline,useSimulator.getState().recoveryStage);
const estimateRuntimeHours:typeof modelRuntime=(soc,mode,offline)=>modelRuntime(soc,mode,offline,useSimulator.getState().recoveryStage);

const EnvironmentPanel = dynamic(() => import('./EnvironmentPanel'), { loading: () => <div className="chart-loading" role="status">กำลังเตรียมแบบจำลองสภาพแวดล้อม…</div> });

const ChartLoading = () => <div className="chart-loading" role="status">กำลังเตรียมกราฟจำลอง…</div>;
const PowerLineChart = dynamic(() => import('@/components/TelemetryCharts').then(m => m.PowerChart), { ssr: false, loading: ChartLoading });
const CurrentChart = dynamic(() => import('@/components/TelemetryCharts').then(m => m.CurrentChart), { ssr: false, loading: ChartLoading });
const BatteryChart = dynamic(() => import('@/components/TelemetryCharts').then(m => m.BatteryChart), { ssr: false, loading: ChartLoading });
const LoadChart = dynamic(() => import('@/components/TelemetryCharts').then(m => m.LoadChart), { ssr: false, loading: ChartLoading });
const WaterChart = dynamic(() => import('@/components/TelemetryCharts').then(m => m.WaterChart), { ssr: false, loading: ChartLoading });
const CircuitLab = dynamic(() => import('@/components/CircuitLab'), { ssr: false, loading: () => <div className="scene-loading" role="status"><strong>กำลังเตรียมห้องทดลองวงจร</strong><small>โมเดลอุปกรณ์อ้างอิงแรงดันต่ำ</small></div> });

const navGroups = [
  { label: 'PLATFORM', links: [
    ['overview', '/', 'ภาพรวม', Home], ['explore', '/explore', 'สำรวจพื้นที่', Map], ['simulation', '/simulation', 'โหมดสาธิต', Activity], ['dashboard', '/dashboard', 'มอนิเตอร์', ChartNoAxesCombined], ['environment', '/environment', 'สภาพแวดล้อม', Waves],
  ] },
  { label: 'ENGINEERING', links: [
    ['circuit', '/circuit', 'วงจรและอุปกรณ์', Cable], ['architecture', '/architecture', 'สถาปัตยกรรม', Network], ['docs', '/docs', 'เอกสารวิศวกรรม', BookOpen],
  ] },
  { label: 'PROJECT', links: [
    ['solution', '/solution', 'โจทย์และแนวทาง', Lightbulb], ['process', '/process', 'กระบวนการ', Activity], ['roles', '/roles', 'บทบาททีม', Users], ['presentation', '/presentation', 'โหมดนำเสนอ', Play],
  ] },
] as const;

const titles: Record<string, [string, string, string]> = {
  overview: ['CONTROL CENTER', 'ท่าเรือลุงทองและกระชังบ้านศาลาหุม', 'โจทย์จากเอกสารพื้นที่: ไฟฟ้าไม่เสถียร และความไม่แน่นอนของสภาพน้ำ · ฉากสร้างใหม่จากภาพอ้างอิงเพื่อทดลอง P0–P3'],
  explore: ['DIGITAL TWIN · ILLUSTRATIVE', 'สำรวจพื้นที่ท่าเรือลุงทอง', 'แนวถนน บ้านริมน้ำ ท่า และกระชังตามตำแหน่งสัมพัทธ์ในภาพ · จุดติดตั้งและโซนน้ำเป็นข้อเสนอรอยืนยัน'],
  simulation: ['SCENARIO LAB', 'ทดลองสถานการณ์ระบบไฟ', 'เลือกเหตุจำลองและดูผลต่อโหลด แบตเตอรี่ เหตุการณ์ และข้อมูลมอนิเตอร์'],
  dashboard: ['MONITORING · SIMULATED', 'ข้อมูลมอนิเตอร์', 'ค่าทุกชุดในหน้านี้สร้างจากตัวจำลองในเบราว์เซอร์ · ไม่มีอุปกรณ์จริงเชื่อมต่อ'],
  environment: ['ENVIRONMENT MODEL', 'สภาพแวดล้อมและพลวัตน้ำ', 'อากาศ น้ำขึ้นลง ความลึกและการผสมน้ำ · แบบจำลองเพื่อเรียนรู้ ยังไม่สอบเทียบกับภาคสนาม'],
  circuit: ['REFERENCE CIRCUIT · LOW VOLTAGE', 'ห้องทดลองวงจรและอุปกรณ์', 'โครงวงจรแนวคิดแรงดันต่ำสำหรับสื่อสารการทำงาน · ต้องยืนยันพิกัดและการป้องกันก่อนประกอบจริง'],
  architecture: ['POWER · DATA · POLICY', 'สถาปัตยกรรม P0–P3', 'แสดงทางเดินพลังงาน ทางเดินข้อมูล และกติกาลำดับโหลดจากเอกสารทีม'],
  docs: ['ENGINEERING NOTES', 'เอกสารวิศวกรรมและแหล่งข้อมูล', 'แยกข้อมูลจาก Data Pack ข้อกำหนดในเอกสารทีม แบบเสนอทางวิศวกรรม และช่องว่างภาคสนาม'],
  solution: ['PROBLEM → RESPONSE', 'ปัญหาและแนวทางตอบโจทย์', 'เชื่อมข้อสังเกตใน Data Pack กับขอบเขตการแก้ปัญหาด้านพลังงาน'],
  process: ['SYSTEM PROCESS', 'ลำดับการทำงานเมื่อเกิดเหตุ', 'ติดตามจากเหตุที่ตรวจได้ ไปสู่การจัดลำดับโหลด แจ้งเตือน และฟื้นระบบ'],
  roles: ['TEAM & STAKEHOLDERS', 'ผู้รับผิดชอบและผู้เกี่ยวข้อง', 'แยกบทบาททีมพัฒนากับผู้ใช้และหน่วยงานที่ต้องร่วมยืนยันภาคสนาม'],
  presentation: ['GUIDED DEMO · 4 MIN', 'เดินเรื่องสำหรับกรรมการ', 'ลำดับการสาธิตระบบและข้อจำกัด พร้อมเปลี่ยนสถานการณ์ได้ระหว่างนำเสนอ'],
};

const scenarioCards = [
  { id: 'normal', title: 'ไฟหลักปกติ', desc: 'โหลดทุกโหนดทำงานตามสภาวะปกติ', Icon: Check },
  { id: 'sag', title: 'แรงดันตก', desc: 'แรงดัน bus จำลองลดลง · ยังมีไฟหลัก', Icon: Gauge },
  { id: 'outage', title: 'ไฟหลักดับ', desc: 'ใช้แบตเตอรี่สาธิตและตัด P3 ก่อน', Icon: Zap },
  { id: 'low-battery', title: 'พลังงานสำรองต่ำ', desc: 'จำลอง SoC 34% และเตรียมตัด P2', Icon: Battery },
  { id: 'extended-outage', title: 'ไฟดับต่อเนื่อง', desc: 'ใช้พลังงานสำรองตามโหลดต่อเนื่อง', Icon: Clock3 },
  { id: 'critical-battery', title: 'แบตเตอรี่วิกฤต', desc: 'เหลือ 7% สาธิต · คง P0 ตามเกณฑ์', Icon: Battery },
  { id: 'water-change', title: 'น้ำเปลี่ยนจำลอง', desc: 'ปรับความเค็ม/อุณหภูมิสาธิต · ไม่ยืนยันเหตุภาคสนาม', Icon: Waves },
  { id: 'recovery', title: 'ทยอยคืนโหลด', desc: 'P0/P1 ก่อน ตามด้วย P2 และ P3', Icon: RotateCcw },
  { id: 'offline', title: 'โหนดไม่ส่งข้อมูล', desc: 'P2 ออฟไลน์ · ไม่ได้สรุปว่าไฟดับ', Icon: Wifi },
  { id: 'sensor-fault', title: 'เซนเซอร์ผิดปกติ', desc: 'อินพุตความเค็มเสีย · ไม่ใช่เหตุฉุกเฉินน้ำ', Icon: AlertTriangle },
] as const;

function timeLabel(minute: number) { const seconds=Math.round(minute*60),h=String(Math.floor(seconds/3600)).padStart(2,'0'),m=String(Math.floor(seconds/60)%60).padStart(2,'0'),s=seconds%60;return `T+${h}:${m}${s?':'+String(s).padStart(2,'0'):''}`; }
function Metric({ label, value, unit, detail, Icon, tone = '' }: { label: string; value: string | number; unit?: string; detail: string; Icon: typeof Zap; tone?: string }) {
  return <article className="metric-card"><div className="metric-head"><span>{label}</span><Icon /></div><div className={`metric-value ${tone}`}><strong>{value}</strong>{unit && <small>{unit}</small>}</div><div className="metric-note">{detail}</div></article>;
}

function EventFeed({ events, full = false }: { events: SimEvent[]; full?: boolean }) {
  const shown = full ? events : events.slice(0, 5);
  return <div className="event-list">{shown.length === 0 ? <div className="event-empty">ยังไม่มีเหตุการณ์ · เลือกสถานการณ์จำลองเพื่อเริ่ม</div> : shown.map(e => <div className="event-row" key={e.id}><i className={`event-pin ${e.severity === 'warning' ? 'warn' : e.severity === 'critical' ? 'danger' : ''}`} /><div className="event-text"><strong>{e.message}</strong><small>{e.nodeId === 'SYSTEM' ? 'ทั้งระบบ' : e.nodeId + ' · ' + CANDIDATE_NODES[e.nodeId].title} · {e.action}</small></div><span className="event-time">{timeLabel(e.minute)}</span></div>)}</div>;
}

function exportRecords(format: 'json' | 'csv', samples: ReturnType<typeof useSimulator.getState>['samples'], events: SimEvent[]) {
  const body = format === 'json' ? JSON.stringify({ simulated: true, source: 'browser deterministic demo', exported_at: new Date().toISOString(), environment: { model: 'illustrative uncalibrated three-box model', ...useSimulator.getState().environment }, playback_speed: useSimulator.getState().playbackSpeed, samples: samples.map(row => ({ ...row, simulated: true })), events }, null, 2) : [
    'simulated,minute,voltage_v,dc_bus_voltage_v,dc_bus_current_a,battery_percent,salinity_ppt,water_temperature_c,p1_quality,p0_w,p1_w,p2_w,p3_w',
    ...samples.map(x => `true,${x.minute},${x.voltage},${x.busVoltage},${x.current},${x.battery},${x.salinity ?? ''},${x.temperature ?? ''},${x.p1Quality},${x.p0},${x.p1},${x.p2},${x.p3}`),
  ].join('\n');
  const blob = new Blob([body], { type: format === 'json' ? 'application/json' : 'text/csv' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `community-energy-simulation.${format}`; anchor.click(); URL.revokeObjectURL(url);
}

function SceneCard({compact=false}:{compact?:boolean}){return <SiteExperience compact={compact}/>;}
function ScrollTour(){return <SiteExperience compact documentary/>;}

function FieldReferences() {
  return <section className="field-references"><div className="section-heading"><div><h2>ลักษณะพื้นที่จากภาพต้นทาง</h2><p>ภาพใน Data Pack ที่ใช้กำหนดวัสดุ น้ำ และรูปแบบกระชังของฉากสร้างจำลอง</p></div><a className="text-link" href="https://peephatz-dev.github.io/community-field-notes/visual-library.html">เปิดคลังภาพ<ArrowUpRight size={15} /></a></div><div className="field-photo-grid">{[
    ['salahum-03.webp', 'กระชังไม้และผิวน้ำในพื้นที่', 'อ้างอิงรูปแบบกระชัง โครงไม้ ถังลอย และสีของน้ำ'],
    ['salahum-11.webp', 'ภาพบริบทการเพาะเลี้ยงจาก Data Pack', 'บริบทการทำงานและสิ่งแวดล้อมของชุมชน'],
    ['salahum-18.webp', 'ภาพพื้นที่บ้านศาลาหุมจาก Data Pack', 'ใช้ประกอบความเข้าใจพื้นที่ ไม่ใช่ตำแหน่งในฉาก 3D'],
  ].map(([file, alt, caption]) => <figure key={file}><img src={assetUrl(`assets/reference/${file}`)} alt={alt} loading="lazy" width="640" height="420" /><figcaption>{caption}<small>ภาพเอกสารพื้นที่ · ที่มา: Data Pack บ้านศาลาหุม</small></figcaption></figure>)}</div></section>;
}

function NodeInspector() {
  const selected = useSimulator(s => s.selectedNode), mode = useSimulator(s => s.mode), batterySoc = useSimulator(s => s.batterySoc), offline = useSimulator(s => s.nodeOffline), sensorFault = useSimulator(s => s.sensorFault), setSelected = useSimulator(s => s.setSelectedNode);
  const samples = useSimulator(s => s.samples);
  const latest = samples[samples.length - 1];
  const current = NODE_DEFINITIONS.find(n => n.id === selected)!;
  return <section className="inspect-card panel-card"><div className="panel-title-row"><div><h2>สถานะโหนดและโหลด</h2><p>ทุกตำแหน่งเป็นจุดเสนอ · ยังไม่ยืนยันการติดตั้ง</p></div><span className="mini-live"><i />จำลอง</span></div>
    <div className="node-stack">{NODE_DEFINITIONS.map(node => {
      const online = offline !== node.id;
      const on = activeLoad(node.id, mode, batterySoc, offline);
      const state = !online ? 'OFFLINE' : on ? mode === 'outage' ? 'BACKUP' : 'ทำงาน' : 'ตัดโหลด';
      return <button key={node.id} className={`node-card ${selected === node.id ? 'selected' : ''}`} onClick={() => setSelected(node.id)} aria-pressed={selected === node.id}>
        <div className="node-top"><div className="node-name"><span className="node-symbol">{node.id}</span>{node.name}</div><span className={`node-state ${!online ? 'offline' : !on ? 'warn' : ''}`}>{state}</span></div><p className="node-desc">{node.role}</p><div className="node-reading"><span>โหลด <b>{on ? node.watts : 0} W</b></span><span>ลำดับ <b>{node.priority === 0 ? 'ศูนย์กลาง' : `P${node.priority}`}</b></span></div>
      </button>;
    })}</div>
    <div className="selected-detail"><div className="detail-title">{current.id} · {current.name} <span className="proposal-label">จุดเสนอ</span></div><p>{CANDIDATE_NODES[current.id].rationale}</p><p>{current.description}</p><div className="priority-flow">{current.loads.map(load => <span className="priority-chip" key={load}>{load}</span>)}</div>
      {selected === 'P1' && <div className="sensor-values"><div><small>ความเค็ม</small><b>{sensorFault || !activeLoad('P1', mode, batterySoc, offline) || offline === 'P1' || latest.salinity === null ? '—' : latest.salinity.toFixed(1)} <i>ppt*</i></b></div><div><small>อุณหภูมิน้ำ</small><b>{!activeLoad('P1',mode,batterySoc,offline)||offline==='P1'?'—':latest.temperature?.toFixed(1)??'—'} <i>°C*</i></b></div><div><small>ออกซิเจนละลายน้ำ</small><b className="unavailable">ยังไม่มีข้อมูล</b></div></div>}
      <small className="inspector-caveat">* ค่าทดลองสร้างจากตัวจำลอง · DO ไม่มีเซนเซอร์ในขอบเขตนี้</small>
    </div>
    <div className="inspector-foot">สถานะออฟไลน์หมายถึงไม่ได้รับข้อมูลตามรอบจำลอง ไม่ใช่หลักฐานว่าไฟดับ · ไม่มีอุปกรณ์จริงเชื่อมต่อ</div>
  </section>;
}

function Overview({ section }: { section: string }) {
  const mode = useSimulator(s => s.mode), battery = useSimulator(s => s.batterySoc), offline = useSimulator(s => s.nodeOffline), minute = useSimulator(s => s.minute), samples = useSimulator(s => s.samples), events = useSimulator(s => s.events), setScenario = useSimulator(s => s.setScenario);
  const data = titles[section] || titles.overview;
  const modeVoltage = gridVoltage(mode, minute).toFixed(1);
  const mainScene = <SceneCard compact={section === 'explore'} />;
  return <>
    <PageHeading data={data} />
    <div className="scenario-toolbar"><strong>สถานการณ์</strong>{scenarioCards.map(({ id, title, Icon }) => <button className={`scenario-chip ${((id === 'normal' && mode === 'normal' && !offline) || (id === 'sag' && mode === 'sag') || (id === 'outage' && mode === 'outage')) ? 'chosen' : ''}`} key={id} onClick={() => setScenario(id)}><Icon size={12} />{title}</button>)}</div>
    {section === 'explore' ? <ScrollTour /> : <div className="overview-grid">{mainScene}<NodeInspector /></div>}
    <SiteWaterPanel compact latestSample={samples.at(-1)} waterShift={useSimulator.getState().waterShift} sensorFault={useSimulator.getState().sensorFault} nodeOffline={offline==='P1'} powered={activeLoad('P1',mode,battery,offline)}/>
    <div className="metrics">
      <Metric label="แรงดันแหล่งหลัก" value={modeVoltage} unit="V · จำลอง" detail={mode === 'outage' ? 'แหล่งจ่ายหลักดับ · คงระบบด้วยแบตเตอรี่จำลอง' : mode === 'sag' ? 'ค่าจำลองต่ำกว่าระดับปกติ' : 'แรงดันอ้างอิงในโมเดล 12 V DC'} Icon={Zap} tone={mode === 'outage' || mode === 'sag' ? 'warn-text' : ''} />
      <Metric label="พลังงานสำรอง" value={Math.round(battery * 100)} unit="% · จำลอง" detail="ความจุโมเดล 1.2 kWh · ไม่ใช่สเปกแบตเตอรี่" Icon={BatteryCharging} />
      <Metric label="โหลดที่ยังทำงาน" value={calcPower(mode, battery, offline)} unit="W · โมเดล" detail="นับเฉพาะโหลดที่ยังไม่ถูกตัดในสถานการณ์นี้" Icon={Activity} />
      <Metric label="โหนดที่ยังจ่ายโหลด" value={`${NODE_DEFINITIONS.filter(n=>activeLoad(n.id,mode,battery,offline)).length} / 4`} unit="โหนด" detail={offline ? `${offline} ตั้งสถานะสื่อสารออฟไลน์ · ประเมินโหลดแยก` : 'นับโหลดที่ทำงาน · แยกจากสถานะสื่อสาร'} Icon={Wifi} tone={offline ? 'warn-text' : ''} />
    </div>
    <div className="lower-grid"><section className="chart-card"><div className="section-heading"><div><h2>แรงดันแหล่งหลัก</h2><p>ประวัติแรงดันแหล่งหลัก DC ในตัวจำลอง · ทุก 1 นาทีจำลอง</p></div><span className="simulation-tag">ข้อมูลจำลอง</span></div><PowerLineChart /><div className="chart-key"><i />แหล่งหลัก 12V · สถานะจากตัวจำลอง</div></section><section className="table-card"><div className="section-heading"><div><h2>เหตุการณ์ล่าสุด</h2><p>เวลาเป็นนาฬิกาจำลอง ไม่ใช่เวลาวัดจากอุปกรณ์</p></div><Link href="/simulation/" className="text-link">ดูทั้งหมด <ChevronRight size={13} /></Link></div><EventFeed events={events} /></section></div>
    {section === 'explore' && <><FieldReferences /><div className="spaced"><NodeInspector /></div></>}
  </>;
}

function PageHeading({ data, right }: { data: [string, string, string]; right?: React.ReactNode }) { return <div className="page-heading"><div><h1>{data[1]}</h1><p>{data[2]}</p></div>{right}</div>; }

function NodeRoleStrip() { return <div className="role-strip">{NODE_DEFINITIONS.map(n => <div className="role-strip-card" key={n.id}><b>{n.id}</b><strong>{n.name}</strong><small>ลำดับโหลด {n.priority === 0 ? 'ระบบควบคุม' : n.priority}</small></div>)}</div>; }

function ScenarioButtons() {
  const setScenario = useSimulator(s => s.setScenario), mode = useSimulator(s => s.mode), offline = useSimulator(s => s.nodeOffline), sensorFault = useSimulator(s => s.sensorFault), batterySoc = useSimulator(s => s.batterySoc);
  const active: Record<string, boolean> = { normal: mode === 'normal' && !offline && !sensorFault, sag: mode === 'sag', outage: mode === 'outage' && batterySoc > .3, 'low-battery': mode === 'outage' && batterySoc <= .3, offline: !!offline, 'sensor-fault': sensorFault };
  return <div className="scenario-grid">{scenarioCards.map(({ id, title, desc, Icon }) => <button key={id} className={`scenario-card ${active[id] ? 'selected' : ''}`} aria-pressed={!!active[id]} onClick={() => setScenario(id)}><span className="scenario-icon"><Icon /></span><strong>{title}</strong><p>{desc}</p></button>)}</div>;
}

function SimulationPanel() {
  const mode = useSimulator(s => s.mode), battery = useSimulator(s => s.batterySoc), offline = useSimulator(s => s.nodeOffline), minute = useSimulator(s => s.minute), running = useSimulator(s => s.running), setMode = useSimulator(s => s.setMode), toggle = useSimulator(s => s.toggleRunning), reset = useSimulator(s => s.reset), events = useSimulator(s => s.events), samples = useSimulator(s => s.samples);
  const runtime = estimateRuntimeHours(battery, mode, offline);
  return <><PageHeading data={titles.simulation} right={<div className="sim-controls"><span className="simulation-tag">ข้อมูลจำลองในเครื่อง</span><button className="control-btn" onClick={toggle}>{running ? <Pause size={13} /> : <Play size={13} />}{running ? 'หยุดเวลา' : 'เล่นต่อ'}</button><button className="control-btn" onClick={reset}><RotateCcw size={13} />รีเซ็ต</button></div>} />
    <div className="page-two"><section className="page-panel"><div className="panel-title-row"><div><h2>กำหนดเหตุการณ์</h2><p>สั่งสถานการณ์จำลองหนึ่งรายการเพื่อดูผล</p></div><span className="simulation-tag">{timeLabel(minute)}</span></div><ScenarioButtons /><div className="manual-controls"><button className={`control-btn ${mode === 'sag' ? 'primary' : ''}`} onClick={() => setMode(mode === 'sag' ? 'normal' : 'sag')}><Gauge size={13} />สลับแรงดันตก</button><button className={`control-btn danger ${mode === 'outage' ? 'primary' : ''}`} onClick={() => setMode(mode === 'outage' ? 'normal' : 'outage')}><Zap size={13} />สลับไฟดับ</button><small>ค่าเกณฑ์ และโหลดเป็นสมมติฐานเพื่อการสาธิต ไม่ใช่เกณฑ์ติดตั้ง</small></div></section>
      <section className="page-panel"><div className="panel-title-row"><div><h2>ผลต่อพลังงานสำรอง</h2><p>ขนาดความจุในโมเดล: 1.2 kWh เพื่อแสดงการคำนวณ</p></div><Battery size={18} /></div><div className="battery-big"><strong>{Math.round(battery * 100)}%</strong><div className="battery-track"><i style={{ width: `${battery * 100}%` }} /></div><span>{mode === 'outage' ? `ใช้โหลด ${calcPower(mode, battery, offline)} W · เวลาคงเหลือโดยประมาณ ${runtime?.toFixed(1)} ชั่วโมงสาธิต` : 'รับพลังงานจากแหล่งหลัก · ยังไม่ใช้แบตเตอรี่สำรอง'}</span></div><BatteryChart /><div className="disclaimer"><Info size={13} />เวลาและความจุเป็นค่าจำลองแบบเร่งเวลา 1 นาที/วินาทีจริง ไม่ใช่คำพยากรณ์อายุแบตเตอรี่อุปกรณ์</div></section></div>

    <div className="page-panel spaced"><div className="section-heading"><div><h2>ลำดับจัดการโหลด</h2><p>นโยบายจัดลำดับ ไม่ได้หมายถึงต่อโหลดเป็นอนุกรม</p></div></div><div className="load-priority">{NODE_DEFINITIONS.map((n, index) => <div className={`load-row ${activeLoad(n.id, mode, battery, offline) ? '' : 'shed'}`} key={n.id}><div className="load-rank">{index + 1}</div><div><strong>{n.id} · {n.name}</strong><small>{n.loads.join(' · ')}</small></div><div className="load-watts">{activeLoad(n.id, mode, battery, offline) ? n.watts : 0} <small>W</small></div><span className={`status-pill ${activeLoad(n.id, mode, battery, offline) ? 'normal' : 'simulated'}`}>{activeLoad(n.id, mode, battery, offline) ? mode === 'outage' ? 'สำรอง' : 'ทำงาน' : 'ถูกตัด'}</span></div>)}</div></div>
    <div className="page-panel spaced"><div className="section-heading"><div><h2>ประวัติเหตุการณ์</h2><p>เรียงใหม่ไปเก่า · ทุกรายการระบุว่าเป็นข้อมูลจำลอง</p></div><div className="export-row"><button className="control-btn" onClick={() => exportRecords('json', samples, events)}><Download size={13} />ส่งออก JSON</button><button className="control-btn" onClick={() => exportRecords('csv', samples, events)}><Download size={13} />ส่งออก CSV</button></div></div><EventFeed events={events} full /></div>
  </>;
}

function CircuitPage() {
  const mode = useSimulator(s => s.circuitMode), setMode = useSimulator(s => s.setCircuitMode), selection = useSimulator(s => s.circuitSelection), select = useSimulator(s => s.setCircuitSelection), systemMode = useSimulator(s => s.mode), offline = useSimulator(s => s.nodeOffline);
  const component = COMPONENTS.find(c => c.id === selection);
  return <><PageHeading data={titles.circuit} />
    <div className="circuit-layout"><section className="page-panel circuit-main"><div className="sub-tabs" role="tablist" aria-label="มุมมองวงจร">{CIRCUIT_MODES.map(([id, label]) => <button role="tab" aria-selected={mode === id} className={mode === id ? 'active' : ''} key={id} onClick={() => setMode(id)}>{label}</button>)}</div>
      <div className="circuit-stage"><CircuitLab mode={mode} selection={selection} select={select} systemMode={systemMode} nodeOffline={offline} /></div>
      <div className="disclaimer"><ShieldCheck size={13} />นี่คือ แนวคิดอ้างอิงแรงดันต่ำ ยังไม่ใช่แบบพร้อมผลิต: เอกสารทีมยังไม่ได้ระบุรุ่นเซนเซอร์/พิน/พิกัดฟิวส์/BMS/สวิตช์ และความปลอดภัยทางไฟฟ้าต้องผ่านวิศวกรก่อนต่อวงจรจริง</div>
    </section><aside className="page-panel component-inspector"><div className="panel-title-row"><div><h2>รายละเอียดอุปกรณ์</h2><p>เลือกชิ้นส่วนจากผังเพื่อดูข้อมูล</p></div><Boxes size={16} /></div>
      {component ? <><div className="selected-component"><span className="component-category">{({Power:'กำลังไฟ',Protection:'การป้องกัน',Storage:'พลังงานสำรอง',Control:'การควบคุม',Sensing:'การตรวจวัด',Switching:'การสวิตช์'} as Record<string,string>)[component.category]??component.category}</span><h3>{component.label}</h3><span className={`status-pill ${component.status === 'simulated' ? 'simulated' : 'normal'}`}>{component.status === 'simulated' ? 'ค่าจำลอง' : component.status === 'proposed' ? 'ต้องยืนยัน' : 'ตัวอย่างอ้างอิง'}</span></div><dl className="component-spec"><dt>ขา / จุดต่อ</dt><dd><code>{component.pin}</code></dd><dt>แหล่งจ่าย</dt><dd>{component.supply}</dd><dt>สัญญาณ</dt><dd>{component.signal}</dd><dt>ข้อจำกัด</dt><dd>{component.limit}</dd></dl></> : <div className="disclaimer"><Info size={13} />เลือกกล่องบนแผนผังเพื่อดูส่วนประกอบ</div>}
      <div className="component-list">{COMPONENTS.map(c => <button key={c.id} className={selection === c.id ? 'selected' : ''} onClick={() => select(c.id)}><span>{c.label}</span><small>{c.status === 'simulated' ? 'จำลอง' : c.status === 'proposed' ? 'เสนอ' : 'อ้างอิง'}</small></button>)}</div>
    </aside></div>
    <div className="page-panel spaced"><div className="section-heading"><div><h2>สายสัญญาณและการเชื่อมต่ออ้างอิง</h2><p>ขีดทึบ = กำลังไฟ · ขีดประ = สัญญาณ · เครื่องหมาย * = ยืนยันจากฮาร์ดแวร์จริงก่อนใช้</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>จุดเริ่ม → ปลายทาง</th><th>ชื่อสายสัญญาณ</th><th>ประเภท</th><th>สถานะ</th></tr></thead><tbody>{[
      ['DC Input → F1 → 12V bus', '12V_DC / FUSED_12V', 'กำลังไฟ', 'แบบจำลองอ้างอิง'], ['Battery ↔ Charger/BMS ↔ backup bus', 'BATTERY* / BACKUP_12V*', 'กำลังไฟ', 'ยังไม่ได้ยืนยันอุปกรณ์'], ['12V bus → DC-DC → P0', 'REG_5V / 3V3', 'กำลังไฟ', 'ต้องตรวจสเปกบอร์ด'], ['V/I sensing → P0', 'I²C* / GPIO*', 'สัญญาณ', 'ต้องเลือกรุ่นและ pin map'], ['EC/Salinity + Temperature → P1/P0', 'ADC / digital bus*', 'สัญญาณ', 'interface ยังไม่ระบุ'], ['P0 GPIO → driver → demonstration load', 'EN / LOAD', 'การควบคุมและกำลังไฟ', 'GPIO ห้ามขับโหลดตรง'],
    ].map(row => <tr key={row[0]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div></div>
  </>;
}

function DashboardPage() {
  const mode = useSimulator(s => s.mode), battery = useSimulator(s => s.batterySoc), offline = useSimulator(s => s.nodeOffline), sensorFault = useSimulator(s => s.sensorFault), minute = useSimulator(s => s.minute), samples = useSimulator(s => s.samples), events = useSimulator(s => s.events), setScenario = useSimulator(s => s.setScenario);
  const data = samples[samples.length - 1];
  const p1Available=activeLoad('P1',mode,battery,offline)&&offline!=='P1';
  const running = useSimulator(s => s.running), currentVoltage = gridVoltage(mode, minute);
  return <><PageHeading data={titles.dashboard} right={<div className="export-row"><button className="control-btn" onClick={() => exportRecords('json', samples, events)}><Download size={15} />ส่งออก JSON</button><button className="control-btn" onClick={() => exportRecords('csv', samples, events)}><Download size={15} />ส่งออก CSV</button></div>} />
    <div className="monitor-context"><span className="mini-live"><i />{running ? 'ตัวจำลองกำลังส่งข้อมูล' : 'หยุดนาฬิกาจำลอง · เหตุที่กดจะบันทึกทันที'}</span><span>{timeLabel(minute)} · 1 วินาที = {useSimulator.getState().playbackSpeed} นาทีจำลอง</span><span>ทุกค่าในหน้านี้เป็นข้อมูลจำลอง</span></div>
    <div className="metrics"><Metric label="แรงดันแหล่งหลัก" value={currentVoltage.toFixed(1)} unit="V DC" detail={mode === 'outage' ? 'แหล่งหลักดับ · สำรองยังประเมินแยก' : mode === 'sag' ? 'อยู่ในเหตุการณ์แรงดันตก' : 'โมเดลบัสแรงดันต่ำ 12 V'} Icon={Zap} tone={mode !== 'normal' ? 'warn-text' : ''} /><Metric label="พลังงานสำรอง" value={Math.round(battery * 100)} unit="%" detail="ความจุสาธิต 1.2 kWh" Icon={Battery} /><Metric label="ความเค็ม · P1" value={sensorFault || !p1Available || data.salinity === null ? '—' : data.salinity.toFixed(1)} unit={sensorFault ? 'sensor fault' : 'ppt'} detail="จำลองแนวโน้ม · ไม่ใช่ค่าน้ำภาคสนาม" Icon={Droplets} tone={sensorFault ? 'warn-text' : ''} /><Metric label="อุณหภูมิน้ำ · P1" value={p1Available?(data.temperature?.toFixed(1)??'—'):'—'} unit="°C" detail="จำลองแนวโน้ม · ต้องเทียบโพรบจริง" Icon={Thermometer} /></div>
    <div className="scenario-toolbar dashboard-scenarios"><strong>ทดลองเปลี่ยนสถานะ</strong>{scenarioCards.map(({ id, title, Icon }) => <button className="scenario-chip" key={id} onClick={() => setScenario(id)}><Icon size={14} />{title}</button>)}</div>
    <p className="chart-key">{useSimulator.getState().environment.enabled?'ค่าน้ำ P1 เชื่อมกับแบบจำลองการผสม Zone A · ไม่ใช่การวัดจริง':'ค่าน้ำ P1 ใช้อินพุตสังเคราะห์เดิม · เปิดโมเดลการผสมได้ในหน้าสภาพแวดล้อม'} <Link className="text-link" href="/environment/">สภาพแวดล้อมและพลวัตน้ำ<ArrowUpRight size={14}/></Link></p><div className="site-system-summary"><span>แหล่งจ่าย: {mode==='outage'?'แบตเตอรี่จำลอง':'DC หลักจำลอง'}</span><span>บัสโหลด {data.busVoltage.toFixed(1)} V DC</span><span>คงโหลด {calcPower(mode,battery,offline)} W</span><span>โหนดจ่ายโหลด {NODE_DEFINITIONS.filter(n=>activeLoad(n.id,mode,battery,offline)).length} / 4 โหนด</span><span>สำรอง {estimateRuntimeHours(battery,mode,offline)?.toFixed(1)??'—'} h สาธิต</span><span>อัปเดต T+{data.minute} นาที · {!p1Available?'P1 ไม่พร้อมส่งค่า':sensorFault?'อินพุตความเค็มผิดปกติ':'ข้อมูลจำลองพร้อม'}</span></div><SiteWaterPanel latestSample={data} waterShift={useSimulator.getState().waterShift} sensorFault={sensorFault} nodeOffline={offline==='P1'} powered={activeLoad('P1',mode,battery,offline)}/><div className="dashboard-grid"><section className="chart-card"><div className="section-heading"><div><h2>แรงดันแหล่งหลัก</h2><p>V DC · การเปลี่ยนสภาวะและแนวโน้มจำลอง</p></div><span className={`status-pill ${mode === 'normal' ? 'normal' : 'simulated'}`}>{mode === 'normal' ? 'ปกติ' : mode === 'sag' ? 'แรงดันตก' : 'ไฟหลักดับ'}</span></div><PowerLineChart /><div className="chart-foot"><span>เส้นอ้างอิง 12 V</span><span>สัญญาณไฟและการสื่อสารประเมินแยก</span></div></section>
      <section className="chart-card"><div className="section-heading"><div><h2>พลังงานสำรอง</h2><p>ระดับพลังงานแบตเตอรี่ · คำนวณจากโหลดจำลอง</p></div><BatteryCharging size={19} /></div><BatteryChart /><div className="chart-foot"><span>เกณฑ์สาธิต P2: 28%</span><span>ไม่ใช่พิกัดแบตเตอรี่จริง</span></div></section>
      <section className="chart-card"><div className="section-heading"><div><h2>กระแสบัส DC</h2><p>A · คำนวณจากกำลังโหลด / แรงดันบัสจำลอง</p></div><span className="status-pill">{data.current.toFixed(1)} A</span></div><CurrentChart/><p className="chart-key">ไฟหลักอาจเป็น 0 V ขณะที่บัสสำรองยังมีกระแส · ไม่ใช่กระแสไฟบ้าน AC</p></section><section className="chart-card"><div className="section-heading"><div><h2>การจัดสรรพลังงาน P0–P3</h2><p>กำลังโหลดซ้อนกัน · หน่วย W</p></div><span className="status-pill">{calcPower(mode, battery, offline)} W</span></div><LoadChart /></section>
      <section className="chart-card"><div className="section-heading"><div><h2>ข้อมูลประกอบด้านน้ำ</h2><p>ความเค็มและอุณหภูมิ · ไม่ได้แทน DO</p></div><Waves size={19} /></div><WaterChart /><div className="do-banner"><CircleHelp size={17} /><span><strong>DO ยังไม่มีข้อมูล</strong><small>ไม่มี DO sensor ในขอบเขตนี้ · ไม่อนุมานจากความเค็มหรืออุณหภูมิ</small></span></div></section>
      <section className="table-card full-row"><div className="section-heading"><div><h2>โหนดและเหตุการณ์ล่าสุด</h2><p>สถานะส่งข้อมูลและสถานะโหลดแสดงแยกกัน</p></div><Link href="/simulation/" className="text-link">ดูประวัติทั้งหมด<ArrowUpRight size={15} /></Link></div><div className="event-node-grid">{NODE_DEFINITIONS.map(n => <div className="event-node" key={n.id}><b>{n.id} · {n.name}</b><span>{offline === n.id ? 'ข้อมูล: ออฟไลน์' : n.id==='P1'&&data.p1Quality==='unpowered'?'P1: ไม่มีข้อมูลใหม่': 'สื่อสาร: จำลองว่าพร้อม'}</span><small>{activeLoad(n.id, mode, battery, offline) ? mode === 'outage' ? 'โหลด: ใช้สำรอง' : 'โหลด: ทำงาน' : 'โหลด: ถูกตัด'}</small></div>)}</div><EventFeed events={events} /></section>
    </div>
  </>;
}

function ArchitecturePage() {
  return <><PageHeading data={titles.architecture} /><div className="page-panel"><div className="panel-title-row"><div><h2>โครงสร้างพลังงาน · นโยบายลำดับโหลด</h2><p>ลำดับความสำคัญไม่ใช่การต่อ load เป็นอนุกรม และ P0 ไม่ได้แบกกระแสโหลดทุกตัว</p></div><Zap size={16} /></div>
    <div className="arch-stack"><div className="arch-block source"><strong>แหล่งจ่ายหลัก</strong><small>ไฟหลัก / พลังงานทดแทนที่อาจพัฒนาต่อ</small></div><span>↓ รับพลังงานตามแนวคิด</span><div className="arch-block"><strong>F1 · บัสกระแสตรงและจุดวัด</strong><small>โมเดลแรงดันต่ำเพื่อการสาธิต; พิกัดยังไม่กำหนด</small></div><span>↓ ทางเดินแหล่งจ่ายและพลังงานสำรอง</span><div className="arch-block backup"><strong>แบตเตอรี่ ระบบป้องกัน และเครื่องชาร์จ (เสนอ)</strong><small>ไม่ใช่อุปกรณ์ที่ยืนยันในต้นแบบตามเอกสารทีม</small></div><div className="arch-branches">{NODE_DEFINITIONS.map(n => <div className={`arch-node-card p${n.id}`} key={n.id}><b>{n.id} · P{n.priority} ลำดับ</b><strong>{n.name}</strong><small>{n.watts} วัตต์ · โหลดจำลอง</small><p>{n.description}</p></div>)}</div>
    <div className="priority-rule">ลำดับเมื่อพลังงานจำกัด <b>P0</b><ChevronRight size={13} /><b>P1</b><ChevronRight size={13} /><b>P2</b><ChevronRight size={13} /><b>P3</b><small>ตัด P3 ก่อน แล้ว P2 เมื่อพลังงานต่ำ · P1/P0 เป็นแกนที่รักษาไว้จนเข้าเงื่อนไขป้องกันแบตเตอรี่</small></div>
  </div></div>
  <div className="page-two spaced"><section className="page-panel"><div className="panel-title-row"><div><h2>เส้นทางข้อมูล</h2><p>การสื่อสาร P1–P3 ไป P0 แยกจากเส้นทางกำลังไฟ</p></div><Send size={16} /></div><div className="data-flow"><b>P1 · เซนเซอร์และไฟเลี้ยง</b><span>⋯ ไร้สาย ⋯</span><b>P0 · จุดรับข้อมูล</b><span>⋯ ไร้สาย ⋯</span><b>P2 / P3</b></div><div className="disclaimer spaced"><Wifi size={13} />Offline = P0 ไม่ได้รับข้อมูลภายใน stale-time threshold ที่ตั้งค่าได้ · ไม่ได้ยืนยัน power failure</div></section><section className="page-panel"><div className="panel-title-row"><div><h2>ข้อมูลที่ใช้ร่วมกัน</h2><p>ตัวอย่าง schema จากเอกสารทีม · แสดงค่าว่างเมื่อไม่มีเซนเซอร์</p></div></div><pre className="inspector-json">{JSON.stringify({ simulated: true, node_id: 'P1', seq: 104, timestamp: 'T+00:04', voltage: 12.1, current: 0.8, power_state: 'NORMAL', battery_soc: 100, load_state: 'ON', online_status: 'ONLINE', last_seen: 'T+00:04', sensor_quality: 'DEMO', salinity: 25.4, water_temperature: 29.2, dissolved_oxygen: null }, null, 2)}</pre></section></div>
  </>;
}

function SolutionPage() {
  return <><PageHeading data={titles.solution} /><div className="problem-grid"><article className="problem-column"><div className="eyebrow">บริบทจากเอกสารพื้นที่</div><h2>สิ่งที่เอกสารพื้นที่ระบุ</h2><ul className="evidence-list"><li><strong>กระชังปลาเป็นอาชีพหลัก</strong><span>Data Pack บอกว่าพื้นที่เลี้ยงปลาในกระชังและระบุชนิดปลา เช่น ปลาเก๋าดอกแดงและปลากะพงขาว</span></li><li><strong>ไฟฟ้าไม่เสถียร</strong><span>เอกสารระบุว่ามีไฟตกบ่อยทั่วชุมชน และบางครัวเรือนเริ่มใช้โซลาร์แต่ยังไม่พอสำหรับระบบอื่น</span></li><li><strong>มีหน่วยงานวัดคุณภาพน้ำ</strong><span>Data Pack กล่าวถึงศูนย์วิจัยประมงและ NECTEC ที่ทำงานด้านข้อมูล/คุณภาพน้ำอยู่แล้ว; ต้องประสานและตรวจระบบเดิมก่อนเสนอติดตั้งซ้ำ</span></li><li><strong>ความเสี่ยงน้ำมีหลายสาเหตุ</strong><span>การไหลเวียน ตะกอน และออกซิเจนต่ำเป็นบริบทที่ Data Pack กล่าวถึง; ระบบนี้จัดการพลังงานและข้อมูล ไม่ได้แก้กระแสน้ำหรือตะกอน</span></li></ul><div className="source-ref">ที่มา: Data Package บ้านศาลาหุม ลงพื้นที่ 16 ก.ค. 2569 หน้า 1, 3–7 · รายละเอียดและวันที่ต้องยืนยันกับเอกสารต้นฉบับก่อนนำไปอ้างในเวที</div></article>
    <article className="response-column"><div className="eyebrow">แนวทางที่เสนอ</div><h2>ระบบนี้ตั้งใจช่วยตรงไหน</h2><div className="response-step"><b>01</b><div><strong>สังเกตสภาพไฟเลี้ยง</strong><p>แยกแรงดันตก/ไฟดับจากข้อมูล node offline และแสดงเวลารับข้อมูลล่าสุด</p></div></div><div className="response-step"><b>02</b><div><strong>คงโหลดสำคัญตามลำดับ</strong><p>โมเดล P0 &gt; P1 &gt; P2 &gt; P3 โดยหยุดโหลด P3 ก่อนเมื่อพลังงานสำรองจำกัด</p></div></div><div className="response-step"><b>03</b><div><strong>เตือนและเก็บเหตุการณ์</strong><p>บอก node, เวลา, เหตุ และการกระทำแนะนำ; บันทึก scenario แยกจากข้อมูลจริง</p></div></div><div className="response-step"><b>04</b><div><strong>ใช้น้ำเป็นข้อมูลประกอบ</strong><p>ค่าความเค็ม/อุณหภูมิสนับสนุน situational awareness; DO จะแสดง unavailable จนมีหัววัดและการตรวจสอบจริง</p></div></div><div className="disclaimer"><AlertTriangle size={14} />ระบบนี้ไม่แก้ตะกอน น้ำไหลเวียน โรคปลา หรือปลาตาย และยังไม่มีหลักฐานว่าการจำลองนี้ลดความเสียหายทางรายได้</div></article></div>
  </>;
}

const teamRoles = [
  ['นาย', 'เจ้าของภาพรวมระบบและเรื่องเล่า', 'P0–P3, ขอบเขตระบบ, ทางเดินพลังงาน, โครงและลำดับสไลด์'],
  ['โฟล์ค', 'เซนเซอร์ วงจร และข้อจำกัด', 'หลักการวัด จุดต่อ การป้องกัน การสอบเทียบ และผลที่ทำจริง'],
  ['พี', 'ข้อมูล หน้าจอ กราฟ และแจ้งเตือน', 'telemetry fields, หน้าสถานะ, กราฟ และเนื้อหาแจ้งเหตุ'],
  ['บอส', 'ข้อความและการสื่อสารโหนด', 'schema, seq, timestamp, ack/retry, offline และการส่งย้อนหลัง'],
  ['ข้าวฟ่าง', 'เรียบเรียงและตรวจหลักฐาน', 'แปลงข้อมูลเทคนิคเป็นภาษาง่าย เช็กหลักฐาน ข้อจำกัด และความต่อเนื่อง'],
];

function RolesPage(){return <SiteRolesGuide/>;}

function ProcessPage(){return <SiteProcessGuide/>;}

function AssetProvenance() {
  return <section className="page-panel spaced"><div className="section-heading"><div><h2>วัสดุและที่มาของฉาก 3D</h2><p>โมเดลอุปกรณ์ใช้ประกอบภาพเพื่ออธิบายระบบ ยังไม่ใช่แบบจำลองที่สำรวจตำแหน่งจริง</p></div><a className="text-link" href={assetUrl('assets/ASSET_LICENSES.md')} target="_blank" rel="noreferrer">ตรวจสิทธิ์และต้นทาง<ArrowUpRight size={15} /></a></div><p className="source-ref">GLB ตู้ไฟและเครื่องกำเนิดไฟฟ้า, HDRI ท้องฟ้า, PBR ไม้/สังกะสี/ทราย ใช้ assets CC0 จาก Poly Haven ภาพภาคสนามมาจาก Data Pack ในโปรเจกต์เดิมและไม่มีการอ้างสิทธิ์ CC0 สำหรับภาพเหล่านั้น เครื่องกำเนิดไฟฟ้าและชุดโซลาร์ในฉากเป็นอุปกรณ์ประกอบแนวคิด ไม่ยืนยันว่าเป็นอุปกรณ์ที่ติดตั้งจริงในพื้นที่</p></section>;
}

function DocsPage() {
  return <><PageHeading data={titles.docs} /><div className="source-doc-grid"><section className="page-panel"><div className="panel-title-row"><div><h2>ที่มาของข้อมูล</h2><p>ระดับที่มาของข้อมูลและสถานะการยืนยัน</p></div><BookOpen size={16} /></div><div className="truth-rows"><div><span className="truth-key verified">เอกสารพื้นที่ระบุ</span><p>Data Package ระบุไฟตกบ่อยทั้งชุมชน บางบ้านใช้โซลาร์แต่ยังไม่พอ และมีหน่วยงานตรวจค่าน้ำ/DO/ตะกอนอยู่แล้ว (หน้า 6 จากไฟล์ที่อ่านได้)</p></div><div><span className="truth-key team">เอกสารทีมกำหนด</span><p>P0–P3; P0 เป็น node หลัก; P1 เชื่อมไฟกับน้ำ; แรงดันต่ำและไม่ควบคุมไฟบ้าน; P3 ตัดก่อน P2; โซลาร์/แบตจริงเป็นส่วนต่อยอด</p></div><div><span className="truth-key proposal">แบบเสนอทางวิศวกรรม</span><p>12V DC demonstration bus, fuse, battery/BMS, DC-DC, sensing, driver และแนวทาง telemetry ที่แสดงในแอป — เป็นโครงอธิบายเพื่อการพัฒนา ยังไม่ใช่ schematic ผ่าน review</p></div><div><span className="truth-key simulated">ค่าจำลอง</span><p>โหลด (30/120/80/260 W), battery 1.2 kWh, threshold SoC 28%, voltage sag 9.7 V, อุณหภูมิ/ความเค็ม และเวลาเร่ง 1 นาทีต่อวินาที</p></div><div><span className="truth-key unknown">ยังไม่ทราบ</span><p>ระดับและความถี่ไฟตกจาก log, โหลด/กระแสจริง, อุปกรณ์และพิกัดวงจร, ความจุแบตเตอรี่, จุดติดตั้ง, ตัวรับแจ้ง, การทำงานของระบบเดิม, ค่า DO real-time และความเต็มใจ/การยินยอมของผู้ใช้</p></div></div></section>
    <section className="page-panel"><div className="panel-title-row"><div><h2>ข้อจำกัดและเงื่อนไขใช้จริง</h2><p>สิ่งที่ต้องเพิ่มก่อนนำไปติดตั้ง</p></div><ShieldCheck size={16} /></div><div className="risk-list"><div className="risk-row"><strong>ไฟฟ้าและความปลอดภัย</strong><p>ยังไม่มี rating ของสาย ฟิวส์ BMS charger DC/DC หรือ switching module; วงจรในหน้านี้ห้ามใช้ต่อไฟบ้าน/กระชังจริง</p></div><div className="risk-row"><strong>น้ำเค็ม ความชื้น และไอเกลือ</strong><p>ต้องระบุ enclosure, connector, corrosion test, leakage protection และการติดตั้งให้ห่างจากน้ำ/คน</p></div><div className="risk-row"><strong>ข้อมูลน้ำและการเพาะเลี้ยง</strong><p>มีหน่วยงานและระบบติดตามในพื้นที่อยู่แล้ว; ตรวจการซ้ำซ้อน/owner ของข้อมูลก่อนพัฒนา sensor ใหม่; DO ต้องมีหัววัดและสอบเทียบแยก</p></div><div className="risk-row"><strong>การตอบสนอง alert</strong><p>ต้องมีผู้รับและ action ที่ยอมรับร่วมกัน พร้อมทดสอบ stale / false alarm / ไฟมาแล้วแบตต่ำ</p></div><div className="risk-row"><strong>ความเป็นส่วนตัวและความยินยอม</strong><p>ก่อนสัมภาษณ์หรือเก็บข้อมูลที่ระบุตัวบุคคล ให้ระบุวัตถุประสงค์และขอความยินยอม; demo นี้ไม่มีข้อมูลส่วนบุคคลจริง</p></div></div></section></div>
    <div className="page-panel spaced"><div className="section-heading"><div><h2>รายการการยืนยันภาคสนาม</h2><p>เก็บหลักฐานก่อนยกระดับจาก demonstrator ไปสู่การติดตั้ง</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>ประเด็น</th><th>ผู้ให้ข้อมูล/เครื่องมือ</th><th>สิ่งที่ต้องได้</th><th>สถานะ</th></tr></thead><tbody>{[
      ['เหตุไฟตก/ดับ', 'ครัวเรือน/ผู้ดูแลไฟ + meter logger', 'วันเวลา ระยะเวลา แรงดันต่ำสุด และโหลดที่ได้รับผล', 'ยังไม่มี log ในข้อมูลที่แนบ'], ['โหลดสำคัญ', 'ผู้เลี้ยงปลา / ผู้ดูแลอุปกรณ์', 'W, กระแสเริ่มทำงาน, runtime และลำดับที่ต้องคงไว้', 'รอตรวจหน้างาน'], ['วงจร/แบตเตอรี่', 'ช่างไฟ/วิศวกร', 'BOM, ratings, protection, battery chemistry, wiring review', 'ยังไม่มี design sign-off'], ['การแจ้งเตือน', 'ผู้ใช้และผู้ดูแล', 'ผู้รับ วิธีตอบสนอง ช่องทาง และความเสี่ยง false alarm', 'รอ co-design'], ['น้ำ', 'ศูนย์วิจัยประมง / NECTEC / ผู้เลี้ยง', 'ระบบที่มี จุดวัด calibration ความถี่ และสิทธิ์ใช้ข้อมูล', 'ต้องประสานก่อนซ้ำซ้อน'],
      ].map(row => <tr key={row[0]}>{row.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table></div><p className="source-ref">แหล่งหลัก: Data Package บ้านศาลาหุม (ลงพื้นที่ 16 ก.ค. 2569), หน้า 1, 3–7, 9–13; “สรุปงานรอบนี้” หน้า 1–8. ตัวเลขเฉพาะราย/ราคาตลาดไม่ถูกนำมาทำเป็น dashboard KPI · <a href="https://peephatz-dev.github.io/community-field-notes/team-work-summary.pdf" target="_blank" rel="noreferrer">เปิด PDF สรุปทีมฉบับเต็ม</a></p></div>
    <section className="page-panel spaced"><div className="section-heading"><div><h2>แบบจำลองสภาพแวดล้อม</h2><p>อากาศและน้ำขึ้นลงเป็นอินพุตสังเคราะห์ พื้นท้องน้ำเป็นพื้นสมมติ ไม่ได้อ่านความลึกจากสีภาพ</p></div><Link className="text-link" href="/environment/">เปิดเครื่องมือ<ArrowUpRight size={15}/></Link></div><p>การผสมน้ำใช้กล่องสมมติ A/B/C และสมดุลเกลือ/ความร้อน รวมการแลกเปลี่ยนภายใน น้ำจืดและขอบเขตน้ำด้านนอก ระบบนี้ยังไม่ใช่พยากรณ์อุทกพลศาสตร์ที่สอบเทียบ ค่าความลึกกระชังและเกณฑ์เตือนต้องยืนยันกับผู้ใช้และการสำรวจจริง</p><p className="source-ref">ทิศ 0° = ด้านบนของภาพอ้างอิง ไม่ใช่ทิศเหนือที่สำรวจ · โซลาร์เป็นประมาณการแยก ไม่ใช้ชาร์จแบตเตอรี่ในเดโม · DO ยังไม่มีข้อมูล</p><a className="text-link" href="https://github.com/peephatz-dev/community-field-notes/blob/main/energy-platform-app/docs/environment-equations.md" target="_blank" rel="noreferrer">สมการ หน่วย ขอบเขต และสิ่งที่ต้องสอบเทียบ<ArrowUpRight size={14}/></a></section>
    <AssetProvenance />
  </>;
}

function PresentationPage(){return <SitePresentationGuide/>;}

export default function Platform({ section }: { section: string }) {
  const ui=usePowerguard(),router=useRouter();
  const [railExpanded,setRailExpanded]=useState(true);
  const gridMode=useSimulator(s=>s.mode);
  const engineerOnly=['environment','circuit','architecture','docs','solution','process','roles','presentation'].includes(section);
  const utilityPage=['power','devices','community','notifications','backup','history','roadmap'].includes(section);
  const engineering=!utilityPage&&(ui.engineering||engineerOnly);
  useEffect(()=>{if(engineerOnly&&ui.hydrated)ui.setSettings({engineering:true});},[engineerOnly,ui.hydrated]);
  const switchMode=()=>{ui.setSettings({engineering:!engineering});if(utilityPage||engineering&&engineerOnly)router.push('/');};
  const unread=ui.history.filter(n=>!n.acknowledgedAt).length;
  useSimulator(s=>s.recoveryStage);
  useSimulator(s=>s.playbackSpeed);
  const tick = useSimulator(s => s.step), setPage = useSimulator(s => s.setPage), minute = useSimulator(s => s.minute), running = useSimulator(s => s.running), toggle = useSimulator(s => s.toggleRunning), reset = useSimulator(s => s.reset);
  const menuRef = useRef<HTMLDialogElement>(null), reduceMotion = useReducedMotion();
  useEffect(() => { setPage(section); }, [section, setPage]);
  useEffect(() => { const id = window.setInterval(() => { if (document.visibilityState === 'visible') tick(); }, 1000); return () => window.clearInterval(id); }, [tick]);
  const nav = useMemo(() => navGroups.map(group => ({ ...group, links: group.links.map(([key, href, label, Icon]) => ({ key, href, label, Icon })) })), []);
  const data = titles[section] || titles.overview;
  const navigation = (mobile = false) => <>{nav.map(group => <div className="nav-group" key={group.label}><div className="nav-group-label">{group.label === 'PLATFORM' ? 'พื้นที่และข้อมูล' : group.label === 'ENGINEERING' ? 'ระบบวิศวกรรม' : 'การทำโปรเจกต์'}</div><nav className="nav-list" aria-label={group.label==='PLATFORM'?'พื้นที่และข้อมูล':group.label==='ENGINEERING'?'ระบบวิศวกรรม':'การทำโปรเจกต์'}>{group.links.map(({key,href,label,Icon})=><Link key={key} href={href} className={'nav-item '+(section===key?'active':'')} aria-label={label} title={label} aria-current={section===key?'page':undefined} onClick={()=>{if(mobile)menuRef.current?.close();}}><Icon aria-hidden="true"/><span>{label}</span></Link>)}</nav></div>)}<div className="nav-group"><div className="nav-group-label">ติดตามและดูแล</div><nav className="nav-list" aria-label="ติดตามและดูแล">{CITIZEN_NAV.filter(([key])=>!['overview','community'].includes(key)).map(([key,href,label])=><Link key={key} href={href} className={'nav-item '+(section===key?'active':'')} aria-label={label} aria-current={section===key?'page':undefined} onClick={()=>{if(mobile)menuRef.current?.close();}}><ChevronRight size={16}/><span>{label}</span></Link>)}<Link href="/community/" className="nav-item" onClick={()=>{if(mobile)menuRef.current?.close();}}><Map size={16}/><span>ฉากชุมชน</span></Link></nav></div></>;
  const legacyContent = section === 'environment' ? <EnvironmentPanel /> : section === 'simulation' ? <SimulationPanel /> : section === 'circuit' ? <CircuitPage /> : section === 'dashboard' ? <DashboardPage /> : section === 'architecture' ? <ArchitecturePage /> : section === 'solution' ? <SolutionPage /> : section === 'process' ? <ProcessPage /> : section === 'roles' ? <RolesPage /> : section === 'docs' ? <DocsPage /> : section === 'presentation' ? <PresentationPage /> : <Overview section={section === 'explore' ? 'explore' : 'overview'} />;
  const content=section==='overview'?<IsometricDashboard/>:section==='simulation'?<><IsometricDashboard demo/><details className="map-measurements"><summary>เครื่องมือวิเคราะห์และส่งออกขั้นสูง</summary><SimulationPanel/></details></>:utilityPage||!engineering?<CitizenPages section={section}/>:legacyContent;
  return <div className={`app-shell pg-app map-first-shell ${railExpanded?"rail-expanded":""} page-${section}`} data-mode={engineering?"engineering":"community"}><a className="skip-link" href="#main-content">ข้ามไปเนื้อหา</a><aside className="sidebar"><button className="rail-toggle icon-btn" aria-label={railExpanded?"ย่อเมนู":"ขยายเมนู"} aria-expanded={railExpanded} onClick={()=>setRailExpanded(v=>!v)}><Menu size={20}/></button><Link href="/" className="brand-lockup"><img src={assetUrl("/powerguard/brand/logo-horizontal.svg")} width={196} height={72} alt="พาวเวอร์การ์ด"/></Link>{navigation()}<div className="side-foot"><div className="status-live"><i />ตัวจำลองพร้อมใช้งาน</div><span>ค่าทั้งหมดเป็นข้อมูลจำลอง</span><a href="https://peephatz-dev.github.io/community-field-notes/" className="back-project">กลับเว็บไซต์โปรเจกต์<ArrowUpRight size={13} /></a></div></aside>
    <main className="main" id="main-content"><header className="topbar"><div className="topbar-place"><button className="icon-btn mobile-menu-trigger" onClick={() => menuRef.current?.showModal()} aria-label="เปิดเมนูนำทาง"><Menu size={19}/></button><Link className="topbar-brand" href="/" aria-label="พาวเวอร์การ์ด หน้าหลัก"><img src={assetUrl('/powerguard/mascot/seabass-happy.svg')} alt="" width={36} height={36}/></Link><span>บ้านศาลาหุม</span><span className={'shell-condition '+gridMode}>{powerStatus(gridMode)}</span></div><div className="top-right"><span className="demo-badge"><i/>ข้อมูลจำลอง</span><Link href="/notifications/" className="pg-icon-btn pg-bell" aria-label={"แจ้งเตือน "+unread+" รายการ"}><Bell size={19}/>{unread>0&&<b>{unread}</b>}</Link><select className="pg-mode-toggle" aria-label="โหมดผู้ใช้" value={engineering?"engineer":ui.audience==="operator"?"operator":"community"} onChange={e=>{ui.setSettings({audience:e.target.value as "community"|"operator"|"engineer"});if(engineerOnly&&e.target.value!=="engineer")router.push("/");}}><option value="community">ชาวบ้าน</option><option value="operator">ผู้ดูแล</option><option value="engineer">วิศวกร</option></select></div></header><motion.div className="content" initial={false} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : .15 }}>{content}<footer className="platform-footer"><span>พาวเวอร์การ์ด · ข้อมูลจำลอง</span><SoundPanel/><Link href="/docs/">แหล่งข้อมูลและข้อจำกัด</Link></footer></motion.div></main>
    <nav className="mobile-bottom-nav" aria-label="ทางลัด">{engineering?nav[0].links.slice(0,4).map(({ key, href, label, Icon }) => <Link key={key} className={section === key ? 'active' : ''} href={href} aria-current={section === key ? 'page' : undefined}><Icon aria-hidden="true" /><span>{label}</span><span className="nav-tooltip" aria-hidden="true">{label}</span></Link>) : CITIZEN_NAV.filter(([key])=>["overview","power","devices","notifications"].includes(key)).map(([key,href,label])=><Link key={key} href={href} className={section===key?"active":""}><span>{label}</span></Link>)}<button onClick={() => menuRef.current?.showModal()}><Menu aria-hidden="true" /><span>เมนูทั้งหมด</span></button></nav>
    <dialog className="mobile-menu-dialog" ref={menuRef} aria-label="เมนูนำทางทั้งหมด" onClick={e => { if (e.target === e.currentTarget) menuRef.current?.close(); }}><div className="mobile-menu-heading"><strong>เมนูทั้งหมด</strong><button className="icon-btn" aria-label="ปิดเมนู" onClick={() => menuRef.current?.close()}><X size={20} /></button></div>{navigation(true)}<a className="back-project" href="https://peephatz-dev.github.io/community-field-notes/">กลับเว็บไซต์โปรเจกต์<ArrowUpRight size={15} /></a></dialog>
  </div>;
}
