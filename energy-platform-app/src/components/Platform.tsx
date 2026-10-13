'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, AlertTriangle, Battery, BatteryCharging, BookOpen, Boxes, Cable, ChartNoAxesCombined, Check, ChevronRight, CircleHelp, Clock3, Download, Droplets, Gauge, Home, Info, Lightbulb, Map, Network, Pause, Play, RotateCcw, Send, ShieldCheck, Thermometer, Users, Waves, Zap, Wifi, X } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import CircuitLab, { CIRCUIT_MODES } from '@/components/CircuitLab';
import { COMPONENTS, NODE_DEFINITIONS, activeLoad, calcPower, estimateRuntimeHours, type NodeId, type SimEvent } from '@/lib/model';
import { platformUrl } from '@/lib/urls';
import { useSimulator } from '@/store/simulator';

const Scene3D = dynamic(() => import('@/components/Scene3D'), { ssr: false, loading: () => <div className="scene-loading"><div className="loading-mark">3D</div><strong>กำลังประกอบฉากจำลอง</strong><small>พื้นที่สาธิตเชิงภาพ · ไม่ใช่แผนที่สำรวจ</small></div> });

const navGroups = [
  { label: 'PLATFORM', links: [
    ['overview', '/', 'ภาพรวม', Home], ['explore', '/explore', 'สำรวจพื้นที่', Map], ['simulation', '/simulation', 'จำลองเหตุการณ์', Activity], ['dashboard', '/dashboard', 'มอนิเตอร์', ChartNoAxesCombined],
  ] },
  { label: 'ENGINEERING', links: [
    ['circuit', '/circuit', 'วงจรและอุปกรณ์', Cable], ['architecture', '/architecture', 'สถาปัตยกรรม', Network], ['docs', '/docs', 'เอกสารวิศวกรรม', BookOpen],
  ] },
  { label: 'PROJECT', links: [
    ['solution', '/solution', 'โจทย์และแนวทาง', Lightbulb], ['process', '/process', 'กระบวนการ', Activity], ['roles', '/roles', 'บทบาททีม', Users], ['presentation', '/presentation', 'โหมดนำเสนอ', Play],
  ] },
] as const;

const titles: Record<string, [string, string, string]> = {
  overview: ['CONTROL CENTER', 'ภาพรวมระบบ', 'ภาพจำลองพลังงานและกระชัง พร้อมสถานะที่เปลี่ยนตามเหตุการณ์จำลอง'],
  explore: ['DIGITAL TWIN · ILLUSTRATIVE', 'สำรวจชุมชนและโหนด', 'ฉากประกอบเพื่ออธิบายความสัมพันธ์ของ P0–P3 · ไม่ใช่ผังภูมิศาสตร์หรือแบบติดตั้งจริง'],
  simulation: ['SCENARIO LAB', 'ทดลองสถานการณ์ระบบไฟ', 'เลือกเหตุจำลองและดูผลต่อโหลด แบตเตอรี่ เหตุการณ์ และข้อมูลมอนิเตอร์'],
  dashboard: ['MONITORING · SIMULATED', 'ข้อมูลมอนิเตอร์', 'ค่าทุกชุดในหน้านี้สร้างจากตัวจำลองในเบราว์เซอร์ · ไม่มีอุปกรณ์จริงเชื่อมต่อ'],
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
  { id: 'offline', title: 'โหนดไม่ส่งข้อมูล', desc: 'P2 ออฟไลน์ · ไม่ได้สรุปว่าไฟดับ', Icon: Wifi },
  { id: 'sensor-fault', title: 'เซนเซอร์ผิดปกติ', desc: 'อินพุตความเค็มเสีย · ไม่ใช่เหตุฉุกเฉินน้ำ', Icon: AlertTriangle },
] as const;

function timeLabel(minute: number) { return `T+${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`; }
function Metric({ label, value, unit, detail, Icon, tone = '' }: { label: string; value: string | number; unit?: string; detail: string; Icon: typeof Zap; tone?: string }) {
  return <article className="metric-card"><div className="metric-head"><span>{label}</span><Icon /></div><div className={`metric-value ${tone}`}><strong>{value}</strong>{unit && <small>{unit}</small>}</div><div className="metric-note">{detail}</div></article>;
}

function PowerLineChart() {
  const samples = useSimulator(s => s.samples);
  return <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={samples} margin={{ top: 7, right: 8, bottom: 0, left: -20 }}>
    <CartesianGrid stroke="#e9efed" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="minute" tickFormatter={n => `${n}m`} tick={{ fontSize: 8, fill: '#82919a' }} axisLine={false} tickLine={false} /><YAxis domain={[0, 14]} tick={{ fontSize: 8, fill: '#82919a' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ fontSize: 10, border: '1px solid #e0e8e7', borderRadius: 7 }} labelFormatter={n => `เวลาจำลอง T+${n} นาที`} />
    <Line type="monotone" dataKey="voltage" name="12V bus (จำลอง)" stroke="#32897c" strokeWidth={2} dot={false} isAnimationActive={false} />
  </LineChart></ResponsiveContainer></div>;
}

function BatteryChart() {
  const samples = useSimulator(s => s.samples);
  return <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={samples} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
    <CartesianGrid stroke="#e9efed" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="minute" tickFormatter={n => `${n}m`} tick={{ fontSize: 8, fill: '#82919a' }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#82919a' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ fontSize: 10, border: '1px solid #e0e8e7', borderRadius: 7 }} labelFormatter={n => `เวลา T+${n} นาที`} />
    <Area type="monotone" dataKey="battery" name="พลังงานสำรอง (%) · จำลอง" stroke="#d3a255" fill="#f4e6ca" strokeWidth={2} isAnimationActive={false} />
  </AreaChart></ResponsiveContainer></div>;
}

function EventFeed({ events, full = false }: { events: SimEvent[]; full?: boolean }) {
  const shown = full ? events : events.slice(0, 5);
  return <div className="event-list">{shown.length === 0 ? <div className="event-empty">ยังไม่มีเหตุการณ์ · เลือกสถานการณ์จำลองเพื่อเริ่ม</div> : shown.map(e => <div className="event-row" key={e.id}><i className={`event-pin ${e.severity === 'warning' ? 'warn' : e.severity === 'critical' ? 'danger' : ''}`} /><div className="event-text"><strong>{e.message}</strong><small>{e.nodeId} · {e.action}</small></div><span className="event-time">{timeLabel(e.minute)}</span></div>)}</div>;
}

function exportRecords(format: 'json' | 'csv', samples: ReturnType<typeof useSimulator.getState>['samples'], events: SimEvent[]) {
  const body = format === 'json' ? JSON.stringify({ simulated: true, source: 'browser deterministic demo', exported_at: new Date().toISOString(), samples: samples.map(row => ({ ...row, simulated: true })), events }, null, 2) : [
    'simulated,minute,voltage_v,battery_percent,salinity_ppt,water_temperature_c,p0_w,p1_w,p2_w,p3_w',
    ...samples.map(x => `true,${x.minute},${x.voltage},${x.battery},${x.salinity},${x.temperature},${x.p0},${x.p1},${x.p2},${x.p3}`),
  ].join('\n');
  const blob = new Blob([body], { type: format === 'json' ? 'application/json' : 'text/csv' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `community-energy-simulation.${format}`; anchor.click(); URL.revokeObjectURL(url);
}

function SceneCard({ compact = false }: { compact?: boolean }) {
  const mode = useSimulator(s => s.mode), batterySoc = useSimulator(s => s.batterySoc), offline = useSimulator(s => s.nodeOffline), selected = useSimulator(s => s.selectedNode), setSelected = useSimulator(s => s.setSelectedNode), cameraMode = useSimulator(s => s.cameraMode), setCamera = useSimulator(s => s.setCameraMode);
  const cameraTabs = [['aerial', 'มุมสูง'], ['walk', 'ชุมชน'], ['aquaculture', 'กระชังปลา'], ['power', 'ระบบไฟ'], ['circuit', 'อุปกรณ์']];
  return <section className={`scene-card ${compact ? 'scene-large' : ''}`} aria-label="ฉากจำลองสามมิติ">
    <div className="scene-top"><div className="scene-label">BAN SALA HUM · ILLUSTRATIVE <span>พื้นที่จำลอง</span></div><div className="scene-label">{mode === 'outage' ? 'BACKUP DEMO' : mode === 'sag' ? 'VOLTAGE SAG DEMO' : 'NODES · P0–P3'}</div></div>
    <div className="scene-controls-note">ลากเพื่อหมุน · เลื่อนเพื่อซูม · แตะโหนดเพื่อเลือก</div>
    <div className="scene-canvas"><Scene3D mode={mode} batterySoc={batterySoc} offline={offline} selectedNode={selected} selectNode={setSelected} cameraMode={cameraMode} /></div>
    <div className="scene-toolbar"><div className="camera-tabs" role="group" aria-label="มุมกล้อง">{cameraTabs.map(([id, label]) => <button key={id} className={cameraMode === id ? 'active' : ''} aria-pressed={cameraMode === id} onClick={() => setCamera(id)}>{label}</button>)}</div><span className="simulation-tag">ฉากประกอบ · ไม่ใช่ผังสำรวจจริง</span></div>
  </section>;
}

function NodeInspector() {
  const selected = useSimulator(s => s.selectedNode), mode = useSimulator(s => s.mode), batterySoc = useSimulator(s => s.batterySoc), offline = useSimulator(s => s.nodeOffline), sensorFault = useSimulator(s => s.sensorFault), setSelected = useSimulator(s => s.setSelectedNode);
  const current = NODE_DEFINITIONS.find(n => n.id === selected)!;
  return <section className="inspect-card panel-card"><div className="panel-title-row"><div><h2>สถานะโหนดและโหลด</h2><p>เลือกโหนดบนฉากหรือรายการด้านล่าง</p></div><span className="mini-live"><i />จำลอง</span></div>
    <div className="node-stack">{NODE_DEFINITIONS.map(node => {
      const online = offline !== node.id;
      const on = activeLoad(node.id, mode, batterySoc, offline);
      const state = !online ? 'OFFLINE' : on ? mode === 'outage' ? 'BACKUP' : 'ทำงาน' : 'ตัดโหลด';
      return <button key={node.id} className={`node-card ${selected === node.id ? 'selected' : ''}`} onClick={() => setSelected(node.id)} aria-pressed={selected === node.id}>
        <div className="node-top"><div className="node-name"><span className="node-symbol">{node.id}</span>{node.name}</div><span className={`node-state ${!online ? 'offline' : !on ? 'warn' : ''}`}>{state}</span></div><p className="node-desc">{node.role}</p><div className="node-reading"><span>โหลด <b>{on ? node.watts : 0} W</b></span><span>ลำดับ <b>{node.priority === 0 ? 'ศูนย์กลาง' : `P${node.priority}`}</b></span></div>
      </button>;
    })}</div>
    <div className="selected-detail"><div className="detail-title">{current.id} · {current.name}</div><p>{current.description}</p><div className="priority-flow">{current.loads.map(load => <span className="priority-chip" key={load}>{load}</span>)}</div>
      {selected === 'P1' && <div className="sensor-values"><div><small>Salinity</small><b>{sensorFault ? '—' : '25.2'} <i>ppt*</i></b></div><div><small>Water temp</small><b>29.1 <i>°C*</i></b></div><div><small>Dissolved oxygen (DO)</small><b className="unavailable">Unavailable</b></div></div>}
      <small className="inspector-caveat">* ค่าทดลองสร้างจากตัวจำลอง · DO ไม่มีเซนเซอร์ในขอบเขตนี้</small>
    </div>
    <div className="inspector-foot">สถานะออฟไลน์หมายถึงไม่ได้รับข้อมูลตามรอบจำลอง ไม่ใช่หลักฐานว่าไฟดับ · ไม่มีอุปกรณ์จริงเชื่อมต่อ</div>
  </section>;
}

function Overview({ section }: { section: string }) {
  const mode = useSimulator(s => s.mode), battery = useSimulator(s => s.batterySoc), offline = useSimulator(s => s.nodeOffline), minute = useSimulator(s => s.minute), samples = useSimulator(s => s.samples), events = useSimulator(s => s.events), setScenario = useSimulator(s => s.setScenario);
  const data = useMemo(() => ({ ...titles[section] }), [section]);
  const modeVoltage = useMemo(() => mode === 'outage' ? '0.0' : mode === 'sag' ? '9.7' : '12.1', [mode]);
  const mainScene = <SceneCard compact={section === 'explore'} />;
  return <>
    <PageHeading data={data} />
    <div className="scenario-toolbar"><strong>สถานการณ์</strong>{scenarioCards.map(({ id, title, Icon }) => <button className={`scenario-chip ${((id === 'normal' && mode === 'normal' && !offline) || (id === 'sag' && mode === 'sag') || (id === 'outage' && mode === 'outage')) ? 'chosen' : ''}`} key={id} onClick={() => setScenario(id)}><Icon size={12} />{title}</button>)}</div>
    <div className="overview-grid">{mainScene}<NodeInspector /></div>
    <div className="metrics">
      <Metric label="แรงดัน DC bus" value={modeVoltage} unit="V · จำลอง" detail={mode === 'outage' ? 'แหล่งจ่ายหลักดับ · คงระบบด้วยแบตเตอรี่จำลอง' : mode === 'sag' ? 'ค่าจำลองต่ำกว่าระดับปกติ' : 'แรงดันอ้างอิงในโมเดล 12 V DC'} Icon={Zap} tone={mode === 'outage' || mode === 'sag' ? 'warn-text' : ''} />
      <Metric label="พลังงานสำรอง" value={Math.round(battery * 100)} unit="% · จำลอง" detail="ความจุโมเดล 1.2 kWh · ไม่ใช่สเปกแบตเตอรี่" Icon={BatteryCharging} />
      <Metric label="โหลดที่ยังทำงาน" value={calcPower(mode, battery, offline)} unit="W · โมเดล" detail="นับเฉพาะโหลดที่ยังไม่ถูกตัดในสถานการณ์นี้" Icon={Activity} />
      <Metric label="อุปกรณ์ส่งข้อมูล" value={`${4 - (offline ? 1 : 0)} / 4`} unit="โหนด" detail={offline ? `${offline} ออฟไลน์ · สถานะไฟประเมินแยก` : 'last_seen ปรับตามเวลาในตัวจำลอง'} Icon={Wifi} tone={offline ? 'warn-text' : ''} />
    </div>
    <div className="lower-grid"><section className="chart-card"><div className="section-heading"><div><h2>แรงดันที่บัสสาธิต</h2><p>ค่าแรงดัน DC ในตัวจำลอง · ทุก 1 นาทีจำลอง</p></div><span className="simulation-tag">SIMULATED</span></div><PowerLineChart /><div className="chart-key"><i />12V bus · ระดับปกติ/ตก/ดับจากสถานการณ์จำลอง</div></section><section className="table-card"><div className="section-heading"><div><h2>เหตุการณ์ล่าสุด</h2><p>เวลาเป็นนาฬิกาจำลอง ไม่ใช่เวลาวัดจากอุปกรณ์</p></div><Link href="/simulation/" className="text-link">ดูทั้งหมด <ChevronRight size={13} /></Link></div><EventFeed events={events} /></section></div>
    {section === 'explore' && <NodeRoleStrip />}
  </>;
}

function PageHeading({ data, right }: { data: [string, string, string]; right?: React.ReactNode }) { return <div className="page-heading"><div><div className="eyebrow">{data[0]}</div><h1>{data[1]}</h1><p>{data[2]}</p></div>{right}</div>; }

function NodeRoleStrip() { return <div className="role-strip">{NODE_DEFINITIONS.map(n => <div className="role-strip-card" key={n.id}><b>{n.id}</b><strong>{n.name}</strong><small>ลำดับโหลด {n.priority === 0 ? 'ระบบควบคุม' : n.priority}</small></div>)}</div>; }

function ScenarioButtons() {
  const setScenario = useSimulator(s => s.setScenario), mode = useSimulator(s => s.mode), offline = useSimulator(s => s.nodeOffline), sensorFault = useSimulator(s => s.sensorFault), batterySoc = useSimulator(s => s.batterySoc);
  const active: Record<string, boolean> = { normal: mode === 'normal' && !offline && !sensorFault, sag: mode === 'sag', outage: mode === 'outage' && batterySoc > .3, 'low-battery': mode === 'outage' && batterySoc <= .3, offline: !!offline, 'sensor-fault': sensorFault };
  return <div className="scenario-grid">{scenarioCards.map(({ id, title, desc, Icon }) => <button key={id} className={`scenario-card ${active[id] ? 'selected' : ''}`} aria-pressed={!!active[id]} onClick={() => setScenario(id)}><span className="scenario-icon"><Icon /></span><strong>{title}</strong><p>{desc}</p></button>)}</div>;
}

function SimulationPanel() {
  const mode = useSimulator(s => s.mode), battery = useSimulator(s => s.batterySoc), offline = useSimulator(s => s.nodeOffline), minute = useSimulator(s => s.minute), running = useSimulator(s => s.running), setMode = useSimulator(s => s.setMode), toggle = useSimulator(s => s.toggleRunning), reset = useSimulator(s => s.reset), events = useSimulator(s => s.events), samples = useSimulator(s => s.samples);
  const runtime = estimateRuntimeHours(battery, mode, offline);
  return <><PageHeading data={titles.simulation} right={<div className="sim-controls"><span className="simulation-tag">LOCAL DETERMINISTIC MODEL</span><button className="control-btn" onClick={toggle}>{running ? <Pause size={13} /> : <Play size={13} />}{running ? 'หยุดเวลา' : 'เล่นต่อ'}</button><button className="control-btn" onClick={reset}><RotateCcw size={13} />รีเซ็ต</button></div>} />
    <div className="page-two"><section className="page-panel"><div className="panel-title-row"><div><h2>กำหนดเหตุการณ์</h2><p>สั่งสถานการณ์จำลองหนึ่งรายการเพื่อดูผล</p></div><span className="simulation-tag">T+{timeLabel(minute)}</span></div><ScenarioButtons /><div className="manual-controls"><button className={`control-btn ${mode === 'sag' ? 'primary' : ''}`} onClick={() => setMode(mode === 'sag' ? 'normal' : 'sag')}><Gauge size={13} />สลับแรงดันตก</button><button className={`control-btn danger ${mode === 'outage' ? 'primary' : ''}`} onClick={() => setMode(mode === 'outage' ? 'normal' : 'outage')}><Zap size={13} />สลับไฟดับ</button><small>ค่า thresholds และโหลดเป็นสมมติฐานเพื่อการสาธิต ไม่ใช่เกณฑ์ติดตั้ง</small></div></section>
      <section className="page-panel"><div className="panel-title-row"><div><h2>ผลต่อพลังงานสำรอง</h2><p>ขนาดความจุในโมเดล: 1.2 kWh เพื่อแสดงการคำนวณ</p></div><Battery size={18} /></div><div className="battery-big"><strong>{Math.round(battery * 100)}%</strong><div className="battery-track"><i style={{ width: `${battery * 100}%` }} /></div><span>{mode === 'outage' ? `ใช้โหลด ${calcPower(mode, battery, offline)} W · เวลาคงเหลือโดยประมาณ ${runtime?.toFixed(1)} ชั่วโมงสาธิต` : 'รับพลังงานจากแหล่งหลัก · ยังไม่ใช้แบตเตอรี่สำรอง'}</span></div><div className="chart-wrap"><BatteryChart /></div><div className="disclaimer"><Info size={13} />เวลาและความจุเป็นค่าจำลองแบบเร่งเวลา 1 นาที/วินาทีจริง ไม่ใช่คำพยากรณ์อายุแบตเตอรี่อุปกรณ์</div></section></div>
    <div className="page-panel spaced"><div className="section-heading"><div><h2>ลำดับจัดการโหลด</h2><p>นโยบายจัดลำดับ ไม่ได้หมายถึงต่อโหลดเป็นอนุกรม</p></div></div><div className="load-priority">{NODE_DEFINITIONS.map((n, index) => <div className={`load-row ${activeLoad(n.id, mode, battery, offline) ? '' : 'shed'}`} key={n.id}><div className="load-rank">{index + 1}</div><div><strong>{n.id} · {n.name}</strong><small>{n.loads.join(' · ')}</small></div><div className="load-watts">{activeLoad(n.id, mode, battery, offline) ? n.watts : 0} <small>W</small></div><span className={`status-pill ${activeLoad(n.id, mode, battery, offline) ? 'normal' : 'simulated'}`}>{activeLoad(n.id, mode, battery, offline) ? mode === 'outage' ? 'สำรอง' : 'ทำงาน' : 'ถูกตัด'}</span></div>)}</div></div>
    <div className="page-panel spaced"><div className="section-heading"><div><h2>ประวัติเหตุการณ์</h2><p>เรียงใหม่ไปเก่า · ทุก record ระบุ simulated=true</p></div><div className="export-row"><button className="control-btn" onClick={() => exportRecords('json', samples, events)}><Download size={13} />ส่งออก JSON</button><button className="control-btn" onClick={() => exportRecords('csv', samples, events)}><Download size={13} />CSV</button></div></div><EventFeed events={events} full /></div>
  </>;
}

function CircuitPage() {
  const mode = useSimulator(s => s.circuitMode), setMode = useSimulator(s => s.setCircuitMode), selection = useSimulator(s => s.circuitSelection), select = useSimulator(s => s.setCircuitSelection), systemMode = useSimulator(s => s.mode), offline = useSimulator(s => s.nodeOffline);
  const component = COMPONENTS.find(c => c.id === selection);
  return <><PageHeading data={titles.circuit} />
    <div className="circuit-layout"><section className="page-panel circuit-main"><div className="sub-tabs" role="tablist" aria-label="มุมมองวงจร">{CIRCUIT_MODES.map(([id, label]) => <button role="tab" aria-selected={mode === id} className={mode === id ? 'active' : ''} key={id} onClick={() => setMode(id)}>{label}</button>)}</div>
      <div className="circuit-stage"><CircuitLab mode={mode} selection={selection} select={select} systemMode={systemMode} nodeOffline={offline} /></div>
      <div className="disclaimer"><ShieldCheck size={13} />นี่คือ reference concept สำหรับแรงดันต่ำ ไม่ใช่ schematic พร้อมผลิต: เอกสารทีมยังไม่ได้ระบุรุ่นเซนเซอร์/พิน/พิกัดฟิวส์/BMS/สวิตช์ และความปลอดภัยทางไฟฟ้าต้องผ่านวิศวกรก่อนต่อวงจรจริง</div>
    </section><aside className="page-panel component-inspector"><div className="panel-title-row"><div><h2>รายละเอียดอุปกรณ์</h2><p>เลือกชิ้นส่วนจากผังเพื่อดูข้อมูล</p></div><Boxes size={16} /></div>
      {component ? <><div className="selected-component"><span className="component-category">{component.category}</span><h3>{component.label}</h3><span className={`status-pill ${component.status === 'simulated' ? 'simulated' : 'normal'}`}>{component.status === 'simulated' ? 'ค่าจำลอง' : component.status === 'proposed' ? 'ต้องยืนยัน' : 'ตัวอย่างอ้างอิง'}</span></div><dl className="component-spec"><dt>ขา / จุดต่อ</dt><dd><code>{component.pin}</code></dd><dt>แหล่งจ่าย</dt><dd>{component.supply}</dd><dt>สัญญาณ</dt><dd>{component.signal}</dd><dt>ข้อจำกัด</dt><dd>{component.limit}</dd></dl></> : <div className="disclaimer"><Info size={13} />เลือกกล่องบนแผนผังเพื่อดูส่วนประกอบ</div>}
      <div className="component-list">{COMPONENTS.map(c => <button key={c.id} className={selection === c.id ? 'selected' : ''} onClick={() => select(c.id)}><span>{c.label}</span><small>{c.status === 'simulated' ? 'จำลอง' : c.status === 'proposed' ? 'เสนอ' : 'อ้างอิง'}</small></button>)}</div>
    </aside></div>
    <div className="page-panel spaced"><div className="section-heading"><div><h2>รายการ net และการเชื่อมต่ออ้างอิง</h2><p>ขีดทึบ = power · ขีดประ = signal · เครื่องหมาย * = ยืนยันจากฮาร์ดแวร์จริงก่อนใช้</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>จุดเริ่ม → ปลายทาง</th><th>ชื่อ net</th><th>ประเภท</th><th>สถานะ</th></tr></thead><tbody>{[
      ['DC Input → F1 → 12V bus', '12V_DC / FUSED_12V', 'Power', 'Reference model'], ['Battery ↔ Charger/BMS ↔ backup bus', 'BATTERY* / BACKUP_12V*', 'Power', 'ยังไม่ได้ยืนยันอุปกรณ์'], ['12V bus → DC-DC → P0', 'REG_5V / 3V3', 'Power', 'ต้องตรวจสเปกบอร์ด'], ['V/I sensing → P0', 'I²C* / GPIO*', 'Signal', 'ต้องเลือกรุ่นและ pin map'], ['EC/Salinity + Temperature → P1/P0', 'ADC / digital bus*', 'Signal', 'interface ยังไม่ระบุ'], ['P0 GPIO → driver → demonstration load', 'EN / LOAD', 'Control + power', 'GPIO ห้ามขับโหลดตรง'],
    ].map(row => <tr key={row[0]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div></div>
  </>;
}

function DashboardPage() {
  const mode = useSimulator(s => s.mode), battery = useSimulator(s => s.batterySoc), offline = useSimulator(s => s.nodeOffline), sensorFault = useSimulator(s => s.sensorFault), minute = useSimulator(s => s.minute), samples = useSimulator(s => s.samples), events = useSimulator(s => s.events);
  const data = samples[samples.length - 1];
  return <><PageHeading data={titles.dashboard} right={<div className="export-row"><button className="control-btn" onClick={() => exportRecords('json', samples, events)}><Download size={13} />JSON</button><button className="control-btn" onClick={() => exportRecords('csv', samples, events)}><Download size={13} />CSV</button></div>} />
    <div className="status-key"><span className="status-pill normal">● ปกติ</span><span className="status-pill simulated">● เฝ้าระวัง / จำลอง</span><span className="status-pill unavailable">● ไม่มีข้อมูลจริง</span><span className="status-pill">เวลาจำลอง {timeLabel(minute)}</span></div>
    <div className="metrics"><Metric label="Supply bus" value={data.voltage.toFixed(1)} unit="V DC*" detail={mode === 'outage' ? 'ไฟหลักไม่จ่าย · bus หลักเป็น 0V' : mode === 'sag' ? 'voltage sag scenario' : 'โมเดลตัวอย่าง; ยังไม่ใช่ไฟบ้าน'} Icon={Zap} tone={mode !== 'normal' ? 'warn-text' : ''} /><Metric label="Backup battery" value={Math.round(battery * 100)} unit="%*" detail="model capacity 1.2 kWh · illustrative" Icon={Battery} /><Metric label="Salinity (P1)" value={sensorFault ? '—' : data.salinity.toFixed(1)} unit={sensorFault ? 'fault' : 'ppt*'} detail="จำลองแนวโน้ม · ไม่ใช่ค่าจากน้ำในพื้นที่" Icon={Droplets} tone={sensorFault ? 'warn-text' : ''} /><Metric label="Water temperature" value={data.temperature.toFixed(1)} unit="°C*" detail="จำลองแนวโน้ม · ต้องเทียบโพรบจริง" Icon={Thermometer} /></div>
    <div className="dashboard-grid"><section className="chart-card"><div className="section-heading"><div><h2>ไฟเลี้ยง · แรงดัน</h2><p>สัญญาณไฟเลี้ยงในโมเดล · โปรดแยกกับ node online</p></div><span className={`status-pill ${mode === 'normal' ? 'normal' : 'simulated'}`}>{mode === 'normal' ? 'MAINS NORMAL' : mode === 'sag' ? 'VOLTAGE SAG' : 'MAINS OUTAGE'}</span></div><PowerLineChart /></section><section className="chart-card"><div className="section-heading"><div><h2>พลังงานสำรอง</h2><p>คำนวณจากโหลดโมเดลและความจุสมมติ</p></div><BatteryCharging size={16} /></div><BatteryChart /></section>
      <section className="chart-card"><div className="section-heading"><div><h2>ค่าประกอบน้ำ · P1</h2><p>Salinity และอุณหภูมิเป็น simulated values เท่านั้น</p></div><Waves size={16} /></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={samples} margin={{ top: 8, right: 6, bottom: 0, left: -22 }}><CartesianGrid stroke="#e9efed" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="minute" tick={{ fontSize: 8, fill: '#82919a' }} axisLine={false} tickLine={false} /><YAxis yAxisId="left" tick={{ fontSize: 8, fill: '#82919a' }} axisLine={false} tickLine={false} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 8, fill: '#82919a' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ fontSize: 10, border: '1px solid #e0e8e7', borderRadius: 7 }} /><Line yAxisId="left" type="monotone" dataKey="salinity" name="Salinity · ppt*" stroke="#32897c" dot={false} isAnimationActive={false} /><Line yAxisId="right" type="monotone" dataKey="temperature" name="Water temp · °C*" stroke="#d39b48" dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div><div className="do-banner"><CircleHelp size={14} /><span><strong>DO · dissolved oxygen</strong><small>Unavailable · ระบบนี้ไม่มี DO sensor; ไม่อนุมานจาก salinity/temperature</small></span></div></section>
      <section className="table-card"><div className="section-heading"><div><h2>สถานะโหนดและเหตุการณ์</h2><p>สัญญาณ communication status แยกจาก power status</p></div></div><div className="event-node-grid">{NODE_DEFINITIONS.map(n => <div className="event-node" key={n.id}><b>{n.id}</b><span>{offline === n.id ? 'OFFLINE' : activeLoad(n.id, mode, battery, offline) ? 'ONLINE · SIM' : 'LOAD SHED'}</span></div>)}</div><EventFeed events={events} /></section>
    </div><div className="disclaimer spaced"><Info size={14} />ค่าที่มี * สร้างโดยตัวจำลองแบบ deterministic ใน browser · ระบบไม่ได้อ่านไฟฟ้า/น้ำจากฮาร์ดแวร์จริง · การเปลี่ยน scenario ทุกครั้งจะมีประวัติ simulated=true</div>
  </>;
}

function ArchitecturePage() {
  return <><PageHeading data={titles.architecture} /><div className="page-panel"><div className="panel-title-row"><div><h2>โครงสร้างพลังงาน · นโยบายลำดับโหลด</h2><p>ลำดับความสำคัญไม่ใช่การต่อ load เป็นอนุกรม และ P0 ไม่ได้แบกกระแสโหลดทุกตัว</p></div><Zap size={16} /></div>
    <div className="arch-stack"><div className="arch-block source"><strong>แหล่งจ่ายหลัก</strong><small>utility / renewable (future scope)</small></div><span>↓ power input · reference</span><div className="arch-block"><strong>F1 · DC Bus · monitor</strong><small>โมเดลแรงดันต่ำเพื่อการสาธิต; พิกัดยังไม่กำหนด</small></div><span>↓ source + storage path</span><div className="arch-block backup"><strong>Battery + BMS / charger (เสนอ)</strong><small>ไม่ใช่อุปกรณ์ที่ยืนยันในต้นแบบตามเอกสารทีม</small></div><div className="arch-branches">{NODE_DEFINITIONS.map(n => <div className={`arch-node-card p${n.id}`} key={n.id}><b>{n.id} · P{n.priority} priority</b><strong>{n.name}</strong><small>{n.watts} W · load model only</small><p>{n.description}</p></div>)}</div>
    <div className="priority-rule">Policy เมื่อพลังงานจำกัด <b>P0</b><ChevronRight size={13} /><b>P1</b><ChevronRight size={13} /><b>P2</b><ChevronRight size={13} /><b>P3</b><small>ตัด P3 ก่อน แล้ว P2 เมื่อพลังงานต่ำ · P1/P0 เป็นแกนที่รักษาไว้จนเข้าเงื่อนไขป้องกันแบตเตอรี่</small></div>
  </div></div>
  <div className="page-two spaced"><section className="page-panel"><div className="panel-title-row"><div><h2>Data topology</h2><p>การสื่อสาร P1–P3 ไป P0 แยกจากเส้นทางกำลังไฟ</p></div><Send size={16} /></div><div className="data-flow"><b>P1 · sensor + power</b><span>⋯ wireless ⋯</span><b>P0 · gateway</b><span>⋯ wireless ⋯</span><b>P2 / P3</b></div><div className="disclaimer spaced"><Wifi size={13} />Offline = P0 ไม่ได้รับข้อมูลภายใน stale-time threshold ที่ตั้งค่าได้ · ไม่ได้ยืนยัน power failure</div></section><section className="page-panel"><div className="panel-title-row"><div><h2>Shared telemetry</h2><p>ตัวอย่าง schema จากเอกสารทีม · แสดงค่าว่างเมื่อไม่มีเซนเซอร์</p></div></div><pre className="inspector-json">{JSON.stringify({ simulated: true, node_id: 'P1', seq: 104, timestamp: 'T+00:04', voltage: 12.1, current: 0.8, power_state: 'NORMAL', battery_soc: 100, load_state: 'ON', online_status: 'ONLINE', last_seen: 'T+00:04', sensor_quality: 'DEMO', salinity: 25.4, water_temperature: 29.2, dissolved_oxygen: null }, null, 2)}</pre></section></div>
  </>;
}

function SolutionPage() {
  return <><PageHeading data={titles.solution} /><div className="problem-grid"><article className="problem-column"><div className="eyebrow">DOCUMENTED CONTEXT · DATA PACK</div><h2>สิ่งที่เอกสารพื้นที่ระบุ</h2><ul className="evidence-list"><li><strong>กระชังปลาเป็นอาชีพหลัก</strong><span>Data Pack บอกว่าพื้นที่เลี้ยงปลาในกระชังและระบุชนิดปลา เช่น ปลาเก๋าดอกแดงและปลากะพงขาว</span></li><li><strong>ไฟฟ้าไม่เสถียร</strong><span>เอกสารระบุว่ามีไฟตกบ่อยทั่วชุมชน และบางครัวเรือนเริ่มใช้โซลาร์แต่ยังไม่พอสำหรับระบบอื่น</span></li><li><strong>มีหน่วยงานวัดคุณภาพน้ำ</strong><span>Data Pack กล่าวถึงศูนย์วิจัยประมงและ NECTEC ที่ทำงานด้านข้อมูล/คุณภาพน้ำอยู่แล้ว; ต้องประสานและตรวจระบบเดิมก่อนเสนอติดตั้งซ้ำ</span></li><li><strong>ความเสี่ยงน้ำมีหลายสาเหตุ</strong><span>การไหลเวียน ตะกอน และออกซิเจนต่ำเป็นบริบทที่ Data Pack กล่าวถึง; ระบบนี้จัดการพลังงานและข้อมูล ไม่ได้แก้กระแสน้ำหรือตะกอน</span></li></ul><div className="source-ref">ที่มา: Data Package บ้านศาลาหุม ลงพื้นที่ 16 ก.ค. 2569 หน้า 1, 3–7 · รายละเอียดและวันที่ต้องยืนยันกับเอกสารต้นฉบับก่อนนำไปอ้างในเวที</div></article>
    <article className="response-column"><div className="eyebrow">PROPOSED TECHNICAL RESPONSE</div><h2>ระบบนี้ตั้งใจช่วยตรงไหน</h2><div className="response-step"><b>01</b><div><strong>สังเกตสภาพไฟเลี้ยง</strong><p>แยกแรงดันตก/ไฟดับจากข้อมูล node offline และแสดงเวลารับข้อมูลล่าสุด</p></div></div><div className="response-step"><b>02</b><div><strong>คงโหลดสำคัญตามลำดับ</strong><p>โมเดล P0 &gt; P1 &gt; P2 &gt; P3 โดยหยุดโหลด P3 ก่อนเมื่อพลังงานสำรองจำกัด</p></div></div><div className="response-step"><b>03</b><div><strong>เตือนและเก็บเหตุการณ์</strong><p>บอก node, เวลา, เหตุ และการกระทำแนะนำ; บันทึก scenario แยกจากข้อมูลจริง</p></div></div><div className="response-step"><b>04</b><div><strong>ใช้น้ำเป็นข้อมูลประกอบ</strong><p>ค่าความเค็ม/อุณหภูมิสนับสนุน situational awareness; DO จะแสดง unavailable จนมีหัววัดและการตรวจสอบจริง</p></div></div><div className="disclaimer"><AlertTriangle size={14} />ระบบนี้ไม่แก้ตะกอน น้ำไหลเวียน โรคปลา หรือปลาตาย และยังไม่มีหลักฐานว่าการจำลองนี้ลดความเสียหายทางรายได้</div></article></div>
  </>;
}

const teamRoles = [
  ['นาย', 'เจ้าของภาพรวมระบบและเรื่องเล่า', 'P0–P3, ขอบเขตระบบ, ทางเดินพลังงาน, โครงและลำดับสไลด์'],
  ['โฟล์ค', 'เซนเซอร์ วงจร และข้อจำกัด', 'หลักการวัด จุดต่อ การป้องกัน การสอบเทียบ และผลที่ทำจริง'],
  ['พี', 'ข้อมูล หน้าจอ กราฟ และแจ้งเตือน', 'telemetry fields, หน้าสถานะ, กราฟ และเนื้อหาแจ้งเหตุ'],
  ['บอส', 'ข้อความและการสื่อสารโหนด', 'schema, seq, timestamp, ack/retry, offline และการส่งย้อนหลัง'],
  ['ข้าวฟ่าง', 'เรียบเรียงและตรวจหลักฐาน', 'แปลงข้อมูลเทคนิคเป็นภาษาง่าย เช็กหลักฐาน ข้อจำกัด และความต่อเนื่อง'],
];

function RolesPage() {
  return <><PageHeading data={titles.roles} /><div className="role-grid">{teamRoles.map(([name, role, deliver], i) => <article className="role-card large" key={name}><div className="role-avatar">{i + 1}</div><div><strong>{name} · {role}</strong><small>ชิ้นงานที่ต้องส่ง</small><p>{deliver}</p></div></article>)}</div><div className="page-panel spaced"><div className="panel-title-row"><div><h2>ผู้ใช้และผู้เกี่ยวข้องที่ต้องร่วมยืนยัน</h2><p>กลุ่มด้านล่างเป็นผู้มีส่วนได้เสีย/ผู้ให้ข้อมูลใน Data Pack ไม่ได้ยืนยันความยินยอมเป็นผู้ทดสอบระบบ</p></div><Users size={16} /></div><div className="stakeholder-grid">{[['ผู้เลี้ยงปลาในกระชัง', 'ยืนยันโหลดที่จำเป็น ขั้นตอนเมื่อไฟตก/ดับ อุปกรณ์สำรองและผู้รับแจ้งเหตุ'], ['ประมงพื้นบ้าน / ผู้รู้พื้นที่', 'ช่วยตรวจบริบทอ่าวและการออกเรือ โดยไม่ใช้ข้อมูลแทนกันทุกกลุ่ม'], ['ศูนย์วิจัยประมง', 'ประสานข้อมูลตรวจน้ำ ค่า DO และตะกอนที่ทำต่อเนื่องอยู่แล้ว'], ['NECTEC', 'ตรวจความเชื่อมโยงกับระบบติดตามคุณภาพน้ำและการรับรองที่เอกสารระบุ'], ['กรมเจ้าท่า / องค์กรชุมชน', 'หารือแผนขุดลอกและข้อจำกัดการติดตั้ง/ดูแลในพื้นที่'], ['PTTEP / หน่วยงานสนับสนุน', 'ตรวจโครงการที่มีอยู่และเงื่อนไขการร่วมมือ โดยไม่สมมติว่าจะเป็นผู้สนับสนุนระบบ']].map(([name, desc]) => <div className="stakeholder" key={name}><strong>{name}</strong><p>{desc}</p></div>)}</div></div></>;
}

function ProcessPage() {
  const mode = useSimulator(s => s.mode), offline = useSimulator(s => s.nodeOffline), setScenario = useSimulator(s => s.setScenario);
  const steps = [
    ['01', 'รับข้อมูลที่มีอยู่', 'node_id, seq, timestamp, แรงดัน, current, load state และ last_seen · ตรวจคุณภาพ/อายุข้อมูล'],
    ['02', 'จำแนกเหตุแยกกัน', 'ไฟตก/ดับจากสัญญาณไฟ; communication loss จาก last_seen; sensor fault แยกจากสถานะน้ำ'],
    ['03', 'จัดลำดับโหลด', 'P0 > P1 > P2 > P3 ตาม policy; เมื่อพลังงานจำกัดตัด P3 ก่อน แล้วพิจารณา P2'],
    ['04', 'สื่อสารเหตุและทางเลือก', 'บอกว่าเกิดที่ไหน เมื่อไร สถานะใด และแนะนำให้ผู้ดูแลตรวจสอบ; ไม่สั่งอุปกรณ์จริงในเดโม'],
    ['05', 'ติดตามและฟื้นระบบ', 'บันทึก recovery แยกจากเหตุเดิม ตรวจข้อมูลใหม่ และทบทวนผลกระทบต่อผู้ใช้'],
  ];
  return <><PageHeading data={titles.process} /><div className="process-layout"><div className="process-steps">{steps.map(([n, title, desc], i) => <article className="process-step" key={n}><span>{n}</span><div><strong>{title}</strong><p>{desc}</p>{i < steps.length - 1 && <div className="step-connector" />}</div></article>)}</div><aside className="page-panel process-live"><div className="panel-title-row"><div><h2>ลองเดิน flow</h2><p>เปลี่ยนเหตุการณ์เพื่อดู state ระบบ</p></div><Activity size={16} /></div><div className="process-indicators"><div><span>ไฟหลัก</span><b className={mode === 'normal' ? 'green-text' : 'warn-text'}>{mode === 'normal' ? 'ปกติ' : mode === 'sag' ? 'แรงดันตก' : 'ดับ · จำลอง'}</b></div><div><span>การสื่อสาร</span><b className={offline ? 'warn-text' : 'green-text'}>{offline ? `${offline} ออฟไลน์` : 'รับข้อมูล'}</b></div><div><span>โหลดเรียงลำดับ</span><b>P0 → P1 → P2 → P3</b></div></div><div className="process-actions"><button className="control-btn" onClick={() => setScenario('sag')}>แรงดันตก</button><button className="control-btn danger" onClick={() => setScenario('outage')}>ไฟดับ</button><button className="control-btn" onClick={() => setScenario('offline')}>P2 Offline</button><button className="control-btn" onClick={() => setScenario('normal')}>คืนปกติ</button></div><div className="disclaimer"><Info size={13} />ในอุปกรณ์จริง ข้อความเตือนต้องระบุผู้รับผิดชอบและ action ที่อนุมัติ; UI นี้ยังไม่ส่งแจ้งเตือนออกนอกเบราว์เซอร์</div></aside></div><div className="page-panel spaced"><h2 className="simple-title">หลักการแยกสถานะ</h2><div className="state-compare"><div><b>Power state</b><span>แรงดัน / กระแส / source health → ไฟหลักปกติ, ตก, ดับ</span></div><div><b>Node connectivity</b><span>seq + last_seen → online, stale, offline</span></div><div><b>Sensor quality</b><span>range / CRC / calibration → valid, suspect, fault</span></div><div><b>Water condition</b><span>ค่าเซนเซอร์ที่ยืนยันแล้ว + เกณฑ์ผู้เชี่ยวชาญ → ไม่อนุมาน DO จากค่าความเค็ม</span></div></div></div></>;
}

function DocsPage() {
  return <><PageHeading data={titles.docs} /><div className="source-doc-grid"><section className="page-panel"><div className="panel-title-row"><div><h2>Source of truth</h2><p>ระดับที่มาของข้อมูลและสถานะการยืนยัน</p></div><BookOpen size={16} /></div><div className="truth-rows"><div><span className="truth-key verified">เอกสารพื้นที่ระบุ</span><p>Data Package ระบุไฟตกบ่อยทั้งชุมชน บางบ้านใช้โซลาร์แต่ยังไม่พอ และมีหน่วยงานตรวจค่าน้ำ/DO/ตะกอนอยู่แล้ว (หน้า 6 จากไฟล์ที่อ่านได้)</p></div><div><span className="truth-key team">เอกสารทีมกำหนด</span><p>P0–P3; P0 เป็น node หลัก; P1 เชื่อมไฟกับน้ำ; แรงดันต่ำและไม่ควบคุมไฟบ้าน; P3 ตัดก่อน P2; โซลาร์/แบตจริงเป็นส่วนต่อยอด</p></div><div><span className="truth-key proposal">แบบเสนอทางวิศวกรรม</span><p>12V DC demonstration bus, fuse, battery/BMS, DC-DC, sensing, driver และแนวทาง telemetry ที่แสดงในแอป — เป็นโครงอธิบายเพื่อการพัฒนา ยังไม่ใช่ schematic ผ่าน review</p></div><div><span className="truth-key simulated">ค่าจำลอง</span><p>โหลด (30/120/80/260 W), battery 1.2 kWh, threshold SoC 28%, voltage sag 9.7 V, อุณหภูมิ/ความเค็ม และเวลาเร่ง 1 นาทีต่อวินาที</p></div><div><span className="truth-key unknown">ยังไม่ทราบ</span><p>ระดับและความถี่ไฟตกจาก log, โหลด/กระแสจริง, อุปกรณ์และพิกัดวงจร, ความจุแบตเตอรี่, จุดติดตั้ง, ตัวรับแจ้ง, การทำงานของระบบเดิม, ค่า DO real-time และความเต็มใจ/การยินยอมของผู้ใช้</p></div></div></section>
    <section className="page-panel"><div className="panel-title-row"><div><h2>ข้อจำกัดและเงื่อนไขใช้จริง</h2><p>สิ่งที่ต้องเพิ่มก่อนนำไปติดตั้ง</p></div><ShieldCheck size={16} /></div><div className="risk-list"><div className="risk-row"><strong>ไฟฟ้าและความปลอดภัย</strong><p>ยังไม่มี rating ของสาย ฟิวส์ BMS charger DC/DC หรือ switching module; วงจรในหน้านี้ห้ามใช้ต่อไฟบ้าน/กระชังจริง</p></div><div className="risk-row"><strong>น้ำเค็ม ความชื้น และไอเกลือ</strong><p>ต้องระบุ enclosure, connector, corrosion test, leakage protection และการติดตั้งให้ห่างจากน้ำ/คน</p></div><div className="risk-row"><strong>ข้อมูลน้ำและการเพาะเลี้ยง</strong><p>มีหน่วยงานและระบบติดตามในพื้นที่อยู่แล้ว; ตรวจการซ้ำซ้อน/owner ของข้อมูลก่อนพัฒนา sensor ใหม่; DO ต้องมีหัววัดและสอบเทียบแยก</p></div><div className="risk-row"><strong>การตอบสนอง alert</strong><p>ต้องมีผู้รับและ action ที่ยอมรับร่วมกัน พร้อมทดสอบ stale / false alarm / ไฟมาแล้วแบตต่ำ</p></div><div className="risk-row"><strong>ความเป็นส่วนตัวและความยินยอม</strong><p>ก่อนสัมภาษณ์หรือเก็บข้อมูลที่ระบุตัวบุคคล ให้ระบุวัตถุประสงค์และขอความยินยอม; demo นี้ไม่มีข้อมูลส่วนบุคคลจริง</p></div></div></section></div>
    <div className="page-panel spaced"><div className="section-heading"><div><h2>รายการการยืนยันภาคสนาม</h2><p>เก็บหลักฐานก่อนยกระดับจาก demonstrator ไปสู่การติดตั้ง</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>ประเด็น</th><th>ผู้ให้ข้อมูล/เครื่องมือ</th><th>สิ่งที่ต้องได้</th><th>สถานะ</th></tr></thead><tbody>{[
      ['เหตุไฟตก/ดับ', 'ครัวเรือน/ผู้ดูแลไฟ + meter logger', 'วันเวลา ระยะเวลา แรงดันต่ำสุด และโหลดที่ได้รับผล', 'ยังไม่มี log ในข้อมูลที่แนบ'], ['โหลดสำคัญ', 'ผู้เลี้ยงปลา / ผู้ดูแลอุปกรณ์', 'W, startup current, runtime และลำดับที่ต้องคงไว้', 'รอตรวจหน้างาน'], ['วงจร/แบตเตอรี่', 'ช่างไฟ/วิศวกร', 'BOM, ratings, protection, battery chemistry, wiring review', 'ยังไม่มี design sign-off'], ['การแจ้งเตือน', 'ผู้ใช้และผู้ดูแล', 'ผู้รับ วิธีตอบสนอง ช่องทาง และความเสี่ยง false alarm', 'รอ co-design'], ['น้ำ', 'ศูนย์วิจัยประมง / NECTEC / ผู้เลี้ยง', 'ระบบที่มี จุดวัด calibration ความถี่ และสิทธิ์ใช้ข้อมูล', 'ต้องประสานก่อนซ้ำซ้อน'],
      ].map(row => <tr key={row[0]}>{row.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table></div><p className="source-ref">แหล่งหลัก: Data Package บ้านศาลาหุม (ลงพื้นที่ 16 ก.ค. 2569), หน้า 1, 3–7, 9–13; “สรุปงานรอบนี้” หน้า 1–8. ตัวเลขเฉพาะราย/ราคาตลาดไม่ถูกนำมาทำเป็น dashboard KPI</p></div>
  </>;
}

function PresentationPage() {
  const setScenario = useSimulator(s => s.setScenario), mode = useSimulator(s => s.mode), next = useSimulator(s => s.setPage), setSelected = useSimulator(s => s.setSelectedNode);
  const steps = [
    ['1 · ปัญหาพื้นที่', 'เอกสารพื้นที่กล่าวถึงไฟตกบ่อย และอาชีพหลักคือการเลี้ยงปลาในกระชัง', 'solution', 'เปิดบริบท'],
    ['2 · แนะนำระบบ', 'P0 เป็นศูนย์กลาง · P1 น้ำ/ไฟ · P2 โหลดจำเป็น · P3 โหลดทั่วไป', 'architecture', 'ดูสถาปัตยกรรม'],
    ['3 · ทดลองเหตุไฟตก/ดับ', 'หยุดระบบเพื่อแสดงผลการจัดลำดับโหลดและแบตเตอรี่จำลอง', 'simulation', 'เปิด scenario'],
    ['4 · ตรวจวงจร', 'ชี้เส้นทาง power และ data พร้อมบอกว่าพิกัด hardware ยังไม่ยืนยัน', 'circuit', 'เปิดวงจร'],
    ['5 · ดูมอนิเตอร์และข้อจำกัด', 'แยกไฟดับกับ offline; ค่า DO unavailable; ทุกค่าทำจาก simulation', 'dashboard', 'เปิด dashboard'],
  ];
  return <><PageHeading data={titles.presentation} /><div className="presentation-layout"><div className="presentation-steps">{steps.map(([title, desc, route, label], i) => <article className="presentation-step" key={title}><span className="presentation-number">0{i + 1}</span><div><h2>{title}</h2><p>{desc}</p><button className="control-btn" onClick={() => { if (route === 'simulation') setScenario(mode === 'normal' ? 'outage' : 'normal'); if (i === 0) setSelected('P1'); next(route); window.location.href = platformUrl(route); }}>{label}<ChevronRight size={12} /></button></div></article>)}</div><aside className="page-panel demo-check"><div className="eyebrow">JUDGE VIEW</div><h2>ประโยคที่ควรพูดระหว่างเดโม</h2><blockquote>“ตัวเลขและเหตุการณ์ที่เห็นเป็นการจำลองในเบราว์เซอร์ ระบบยังไม่ได้เชื่อมต่อ hardware จริง ค่า salinity และอุณหภูมิไม่ได้แทน DO และผังวงจรยังต้องผ่านการตรวจสอบก่อนต่ออุปกรณ์จริง”</blockquote><button className="control-btn primary" onClick={() => { setScenario('normal'); window.location.href = platformUrl('/'); }}><RotateCcw size={13} />เริ่ม demo ใหม่</button></aside></div></>;
}

export default function Platform({ section }: { section: string }) {
  const tick = useSimulator(s => s.step), page = useSimulator(s => s.activePage), setPage = useSimulator(s => s.setPage), minute = useSimulator(s => s.minute), running = useSimulator(s => s.running), toggle = useSimulator(s => s.toggleRunning), reset = useSimulator(s => s.reset);
  useEffect(() => { setPage(section); }, [section, setPage]);
  useEffect(() => { const id = window.setInterval(tick, 1000); return () => window.clearInterval(id); }, [tick]);
  const nav = useMemo(() => navGroups.map(group => ({ ...group, links: group.links.map(([key, href, label, Icon]) => ({ key, href, label, Icon })) })), []);
  const data = titles[section] || titles.overview;
  const reduceMotion = useReducedMotion();
  const content = section === 'simulation' ? <SimulationPanel /> : section === 'circuit' ? <CircuitPage /> : section === 'dashboard' ? <DashboardPage /> : section === 'architecture' ? <ArchitecturePage /> : section === 'solution' ? <SolutionPage /> : section === 'process' ? <ProcessPage /> : section === 'roles' ? <RolesPage /> : section === 'docs' ? <DocsPage /> : section === 'presentation' ? <PresentationPage /> : <Overview section={section === 'explore' ? 'explore' : 'overview'} />;
  return <div className="app-shell"><aside className="sidebar"><Link href="/" className="brand-lockup"><span className="brand-mark">CE</span><span><strong>COMMUNITY ENERGY</strong><small>RESILIENCE PLATFORM</small></span></Link>{nav.map(group => <div key={group.label}><div className="nav-group-label">{group.label}</div><nav className="nav-list">{group.links.map(({ key, href, label, Icon }) => <Link key={key} className={`nav-item ${section === key ? 'active' : ''}`} href={href} aria-current={section === key ? 'page' : undefined} title={label}><Icon aria-hidden="true" /><span>{label}</span></Link>)}</nav></div>)}<div className="side-foot"><div className="status-live"><i />LOCAL SIMULATION · ONLINE</div>ไม่มี connection กับ hardware จริง<br />แผนภาพพื้นที่เป็น illustrative reconstruction</div></aside>
    <main className="main"><header className="topbar"><span className="crumb">บ้านศาลาหุม / <b>{data[1]}</b></span><div className="top-right"><span className="demo-badge"><Activity size={11} /> DEMO DATA · T+{timeLabel(minute)}</span><button className="icon-btn" title={running ? 'หยุดเวลา' : 'เล่นเวลา'} aria-label={running ? 'หยุดเวลา' : 'เล่นเวลา'} onClick={toggle}>{running ? <Pause size={13} /> : <Play size={13} />}</button><button className="icon-btn" title="รีเซ็ต simulation" aria-label="รีเซ็ต simulation" onClick={reset}><RotateCcw size={13} /></button></div></header><motion.div className="content" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}>{content}<footer className="platform-footer"><span>COMMUNITY ENERGY RESILIENCE PLATFORM</span><span>LOCAL · DETERMINISTIC · SIMULATED</span><Link href="/docs/">อ่าน Source of truth และข้อจำกัด</Link></footer></motion.div></main></div>;
}
