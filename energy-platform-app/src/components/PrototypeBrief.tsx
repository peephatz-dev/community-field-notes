import Link from 'next/link';
import topology from '@/lib/prototype-topology.json';
import { assetUrl } from '@/lib/urls';
export function PrototypeScopeNote() {
 return <div className="prototype-scope-note"><strong>ผังต้นแบบล่าสุด</strong><span>P0: ESP32-S3 + Dual-Rail UPS · P1: ESP32 + แบตเตอรี่และ UPS ของตัวเอง</span><Link href="/architecture/">ดูผังและส่วนที่รอยืนยัน ↗</Link><small>กราฟและเหตุไฟยังใช้โมเดลรวมเดิม 12 V / 1.2 kWh เพื่อสาธิต ไม่ใช่พิกัดหรือเวลาสำรองของ 18650</small></div>;
}
export default function PrototypeBrief() {
 return <section className="page-panel prototype-brief"><div className="section-heading"><div><h2>Smart Sala-Hum Prototype</h2><p>{topology.source} · ต้นแบบตามแบบที่เสนอ ยังไม่มีผลทดลองฮาร์ดแวร์ยืนยัน</p></div></div>
 <div className="prototype-boxes">{['P0','P1'].map(group=><article key={group}><h3>{group === 'P0' ? 'P0 · Master Power Node' : 'P1 · Water Quality Node'}</h3><p>กล่องกันน้ำแยกโหนด · ยังไม่ระบุระดับ IP</p><ul>{topology.nodes.filter(n=>n.group===group).map(n=><li key={n.id}><strong>{n.label}</strong><small>{n.note}</small></li>)}</ul></article>)}</div>
 <div className="disclaimer"><strong>ส่วนที่ยังไม่ได้รับ:</strong> ผังจบที่ <code>EC[&quot;EC</code> จึงยังไม่ใส่ลูกศร P1, P2–P3 หรือเส้นสื่อสารระหว่างกล่อง และไม่เดาการต่อเซลล์แบบอนุกรม/ขนาน</div>
 <details className="spaced"><summary>รายการที่ต้องยืนยันก่อนประกอบ</summary><ul>{topology.pending.map(p=><li key={p}>{p}</li>)}</ul></details>
 <p className="export-row"><a className="text-link" href={assetUrl('/prototype-flowchart.mmd')} download>ดาวน์โหลดผัง Mermaid ส่วนที่ได้รับ</a><a className="text-link" href={assetUrl('/prototype-topology.json')} download>ข้อมูลผังร่วมเว็บและสไลด์ JSON</a></p></section>;
}
