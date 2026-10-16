import Link from 'next/link';
import topology from '@/lib/prototype-topology.json';
import { assetUrl } from '@/lib/urls';

const groups = [
 ['P0','Master Power Node'],['P1','Water Quality Node'],
 ['P2','Essential Monitoring Node'],['P3','General Monitoring Node'],
] as const;

export function PrototypeScopeNote() {
 return <div className="prototype-scope-note"><strong>ผังต้นแบบ P0–P3 ฉบับเต็ม</strong><span>P0 รวมไฟเข้า/สำรองและกระจายไฟ · P1 ตรวจ EC/อุณหภูมิ · P2 จำเป็น · P3 ทั่วไป</span><Link href="/architecture/">เปิดผังไฟและ Data ↗</Link><small>ตัวจำลองยังเป็นโมเดลรวมเดิม 12 V / 1.2 kWh ไม่ได้จำลอง UPS แยกแต่ละกล่อง</small></div>;
}

export default function PrototypeBrief() {
 return <section className="page-panel prototype-brief"><div className="section-heading"><div><h2>Smart Sala-Hum Prototype</h2><p>{topology.source} · ผังที่ทีมเสนอครบทั้ง P0–P3 · ยังไม่ใช่ผลทดสอบฮาร์ดแวร์</p></div></div>
 <div className="prototype-boxes">{groups.map(([group,title])=><article key={group}><h3>{group} · {title}</h3><p>กล่องกันน้ำแยกโหนด · ระดับ IP ยังไม่ระบุ</p><ul>{topology.nodes.filter(n=>n.group===group).map(n=><li key={n.id}><strong>{n.label}</strong><small>{n.note}</small></li>)}</ul></article>)}</div>
 <div className="disclaimer"><strong>ผังระบุการเชื่อมต่อ:</strong> P0–P3 มี 26 ลูกศรตามแบบ รวม RELAY จ่าย 5V ไป P1–P3 และ ESP1–ESP3 ส่ง Data เข้า ESP0 · รุ่นโมดูล พิกัด และผลทดสอบจริงยังต้องยืนยัน</div>
 <details className="spaced"><summary>รายการที่ต้องยืนยันก่อนประกอบและติดตั้ง</summary><ul>{topology.pending.map(p=><li key={p}>{p}</li>)}</ul></details>
 <p className="export-row"><a className="text-link" href={assetUrl('/prototype-flowchart.mmd')} download>ดาวน์โหลดผัง Mermaid ฉบับเต็ม</a><a className="text-link" href={assetUrl('/prototype-topology.json')} download>ดาวน์โหลดข้อมูลผัง JSON</a></p></section>;
}
