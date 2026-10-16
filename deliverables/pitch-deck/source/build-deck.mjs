/** Editable deck. Run with bundled Node; see README.md beside this script. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const {Presentation,PresentationFile}=await import(process.env.ARTIFACT_TOOL_MODULE ?? 'file:///Users/nokia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs');
const HERE=path.dirname(fileURLToPath(import.meta.url)), OUT=path.resolve(HERE,'..'), ROOT=path.resolve(HERE,'../../..');
const TMP=path.join(ROOT,'.codex-build/pitch10');
const FONT='Sarabun';
process.env.RUNTIME_NODE_MODULES ??= '/Users/nokia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const C={navy:'#1F2D5A',blue:'#2F7DD3',sky:'#5EC6E8',yellow:'#F8C642',orange:'#FF7A3C',green:'#26B99A',red:'#B73040',soft:'#E9F7FC',ink:'#16294B',gray:'#536A82',line:'#C9DCEB',white:'#FFFFFF'};
const topology=JSON.parse(await fs.readFile(path.join(ROOT,'energy-platform-app/src/lib/prototype-topology.json'),'utf8'));
const P=Presentation.create({slideSize:{width:1280,height:720}});
const timings=[25,35,30,40,35,35,50,35,40,35];
const notes=JSON.parse(await fs.readFile(path.join(HERE,'speaker-content.json'),'utf8'));
function rect(s,x,y,w,h,fill=C.soft,stroke='none'){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:stroke==='none'?0:1}})}
function tx(s,str,x,y,w,h,size=25,color=C.navy,bold=false,align='left'){
 const q=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});q.text=str;q.text.style={typeface:FONT,fontSize:size,bold,color,alignment:align,verticalAlignment:'top',wrap:'square',autoFit:'none',insets:0};return q;
}
function line(s,x,y,w,h=0,color=C.line,width=1){return s.shapes.add({geometry:'line',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:color,width}})}
function label(s,str,x,y,w=180,fill=C.soft,color=C.navy){rect(s,x,y,w,32,fill);tx(s,str,x+10,y+3,w-20,26,17,color,true)}
function base(n,title,sub,source){const s=P.slides.add();s.background.fill=C.white;tx(s,title,56,42,1168,66,43,C.navy,true);if(sub)tx(s,sub,58,112,1150,40,24,C.gray);line(s,56,665,1168);tx(s,source,56,677,1075,26,14,C.gray);tx(s,String(n).padStart(2,'0')+' / 10',1142,676,82,25,15,C.navy,true,'right');s.speakerNotes.text=`เวลา ${timings[n-1]} วินาที\n${notes[n-1].script}\n\nข้อมูลขยายสำหรับซ้อมและตอบคำถาม:\n${notes[n-1].detail}\n\nคำถามกรรมการ: ${notes[n-1].question}\nคำตอบ: ${notes[n-1].answer}\n\nแหล่งอ้างอิง:\n${notes[n-1].sources.join('\n')}`;return s;}
async function img(s,n,x,y,w,h,fit='cover'){const bytes=await fs.readFile(path.join(HERE,'assets',n));return s.images.add({blob:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),contentType:n.endsWith('.svg')?'image/svg+xml':'image/png',alt:n,position:{left:x,top:y,width:w,height:h},fit});}
function block(s,title,body,x,y,w,h,fill=C.soft){const r=rect(s,x,y,w,h,fill);tx(s,title,x+18,y+15,w-36,38,27,C.navy,true);tx(s,body,x+18,y+61,w-36,h-70,23,C.gray);return r;}
function table(s,values,x,y,width,height,widths,size=23){const t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width,height,columnWidths:widths,values});t.borders.assign({fill:C.line,width:1,style:'solid'});for(let r=0;r<values.length;r++){t.rows[r].height=r===0?52:(height-52)/(values.length-1);for(let c=0;c<values[0].length;c++){const cell=t.getCell(r,c);cell.fill=r===0?C.navy:r%2===0?C.soft:C.white;cell.text.style={typeface:FONT,fontSize:size,bold:r===0,color:r===0?C.white:C.navy,wrap:'square',autoFit:'none',insets:10,verticalAlignment:'middle'};}}return t;}
function arrow(s,a,b,color=C.blue,fromSide='right',toSide='left',dash=false){s.shapes.connect(a,b,{kind:'straight',fromSide,toSide,line:{fill:color,width:3,style:dash?'dashed':'solid'},tail:{type:'arrow',width:'med',length:'med'}})}
// 01. Source photograph and real supplied SVG, editable text.
{
const s=base(1,'SALA HUM POWERGUARD','ระบบดูแลไฟฟ้าชุมชน','E01 / E04 / E09  Data Pack ภาคใต้ 16 ก.ค. 2569 น.6 และเอกสารทีม');
await img(s,'salahum-14.png',604,164,620,432);
label(s,'ต้นแบบเว็บไซต์จำลอง',58,173,226,C.yellow);
tx(s,'บ้านศาลาหุม\nชุมชนประมงกระชัง',58,233,500,105,36,C.navy,true);
tx(s,'เริ่มตรวจไฟจริง\nเลือกวิธีแก้ที่คุ้ม\nแล้วติดตามผล',58,353,430,146,32,C.navy);
await img(s,'seabass-happy.png',410,435,165,185,'contain');
tx(s,'ไฟฟ้าไม่เสถียรตามรายงานพื้นที่\nยังไม่มีหลักฐานติดตั้งฮาร์ดแวร์ของทีม',58,541,480,65,23,C.gray);
tx(s,'ภาพจากแพ็กชุมชน  วันถ่ายไม่ระบุ  ใช้แสดงบริบทกระชัง',604,605,620,28,16,C.gray);
tx(s,'นาย  โฟล์ค  พี  บอส  ข้าวฟ่าง',58,624,1030,26,18,C.navy);
}
// 02. Context, reported estimates and evidence ladder.
{
const s=base(2,'ไฟไม่เสถียรตามรายงานพื้นที่','ผลต่ออุปกรณ์และความเสียหายยังต้องตรวจวัด','E01–E03  Data Pack ภาคใต้ น.1, 3–7  ตัวเลขในเอกสาร ไม่ใช่สำมะโนล่าสุด');
await img(s,'salahum-03.png',56,177,496,326);
tx(s,'เรือและกระชังในภาพจาก Data Pack  วันถ่ายไม่ระบุ',56,513,496,30,16,C.gray);
tx(s,'50–70',595,175,280,76,60,C.blue,true);tx(s,'ครัวเรือนโดยประมาณ\nตามเอกสารหน้า 6',595,256,280,76,25);
tx(s,'>45',944,175,260,76,60,C.blue,true);tx(s,'กระชังที่ผู้ให้ข้อมูล\nเชื่อมโยงในเอกสารหน้า 1',944,256,270,76,25);
tx(s,'คนที่ต้องร่วมระบุโหลด',595,359,600,40,28,C.navy,true);tx(s,'ผู้เลี้ยงปลา  ครัวเรือน  ผู้ดูแลระบบเดิม\nยังไม่ทราบว่าใครและเครื่องใดต้องสำรองไฟ',595,407,610,85,25,C.gray);
const rows=[['มีรายงาน','ไฟตก / โซลาร์บางบ้านไม่พอ'],['ต้องวัดเพิ่ม','แรงดัน ความถี่ ระยะเวลา'],['ต้องยืนยัน','เครื่องที่หยุด ภาระดูแล งบที่จ่ายไหว']];
for(let i=0;i<3;i++){const x=56+i*394;rect(s,x,558,380,81,i===0?C.soft:'#F4F7FA');tx(s,rows[i][0],x+14,568,350,29,22,C.navy,true);tx(s,rows[i][1],x+14,603,350,27,21,C.gray);}
}
// 03. Unknown workflow and decision loop.
{
const s=base(3,'วิธีรับเหตุเดิมยังต้องถามคนใช้งาน','การสัมภาษณ์และบันทึกไฟช่วยเลือกทางแก้ได้ตรงจุด','E01 / E04  ไกด์ทีม #decision-board และ Data Pack น.6  ขั้นตอนเดิมยังไม่มี field validation');
const phases=[['ก่อนเกิดเหตุ','เครื่องใดจำเป็นต้องมีไฟ?\nใครเป็นคนดูแล?'],['ระหว่างเกิดเหตุ','รู้เหตุเมื่อไร? เครื่องไหนหยุด?\nใครรับแจ้งและทำอะไร?'],['หลังเกิดเหตุ','มีหลักฐานอะไรเหลือ?\nซ่อมหรือสำรองไฟคุ้มกว่า?']];
for(let i=0;i<3;i++){block(s,phases[i][0],phases[i][1],56+i*397,184,374,210);label(s,'TBD รอสัมภาษณ์',74+i*397,345,212,C.yellow);}
tx(s,'วงจรตัดสินใจที่เสนอ',56,436,1100,42,30,C.navy,true);
const a=block(s,'วัดหลักฐาน','ไฟ โหลด เวลา และคุณภาพข้อมูล',56,493,345,128,C.soft),b=block(s,'เลือกวิธีแก้','ซ่อม / UPS / ไฟสำรองเฉพาะจุด',468,493,345,128,C.soft),c=block(s,'ตรวจผล','เปรียบเทียบกับ baseline เดิม',880,493,344,128,C.soft);arrow(s,a,b);arrow(s,b,c);
}
// 04. Complete P0–P3 topology, rendered as editable group cards from the shared source.
{
const s=base(4,'ผังต้นแบบครบ P0–P3 ตามที่ทีมส่ง','แยกกล่องและเส้นไฟ / Data ตาม flowchart · แบบเสนอ ยังไม่ใช่ผลทดสอบ','ผังผู้ใช้ฉบับเต็ม 16 ต.ค. 2569 / prototype-topology.json · รายละเอียดเดียวกับหน้า Architecture');
const cards=[
 ['P0 · MASTER POWER','AC Adapter + Mini Solar → DC Input Manager\n18650 #1/#2 → Dual-Rail UPS\nDC Input + UPS → 2-Way Power Manager\nPower Manager → ESP32-S3 / V-I-Stability Monitor / Relay'],
 ['P1 · WATER QUALITY','18650 → Single-Rail UPS → ESP32\nEC Sensor → ESP32\nTemperature Sensor → ESP32\nV-I-Stability Monitor → ESP32'],
 ['P2 · ESSENTIAL','18650 → Single-Rail UPS → ESP32\nV-I-Stability Monitor → ESP32\nบทบาท: Essential Monitoring'],
 ['P3 · GENERAL','18650 → Single-Rail UPS → ESP32\nV-I-Stability Monitor → ESP32\nบทบาท: General Monitoring']
];
const xs=[56,355,654,953], widths=[280,280,280,271];
for(let i=0;i<cards.length;i++){
 const [title,body]=cards[i],x=xs[i],w=widths[i],fill=i===0?'#EEF6FC':i===1?'#FFF8E5':'#F4F7FA';
 rect(s,x,170,w,294,fill,C.line);tx(s,title,x+14,184,w-28,30,19,C.navy,true);tx(s,body,x+14,225,w-28,225,17,C.ink,false);
}
rect(s,56,486,1168,123,C.soft,C.line);
tx(s,'สายระหว่างกล่องตามผัง',74,499,370,30,21,C.navy,true);
tx(s,'RELAY ── 5V Power ──▶ P1 · P2 · P3',74,538,525,27,20,C.blue,true);
tx(s,'ESP1 · ESP2 · ESP3 ── Data ──▶ ESP0',650,538,540,27,20,C.blue,true);
tx(s,'ค่าจำลองรวม 12 V / 1.2 kWh ยังไม่ใช่พิกัด UPS แยกกล่อง · รุ่นอุปกรณ์, protocol, pin และผลทดสอบจริงยังต้องยืนยัน',56,622,1168,28,17,C.gray);
}
// 05. Incident sequence, actual notification capture, offline boundary.
{
const s=base(5,'เหตุไฟดับและการรับแจ้ง','ทุกสถานะในเดโมมาจากตัวจำลองชุดเดียวกัน','E05–E08  simulator.ts / powerguard-model.ts และ screenshot จริง 15 ต.ค. 2569  ข้อมูลจำลอง');
const names=['ไฟตก / ดับ','เก็บหลักฐาน','วิเคราะห์เหตุ','ใช้ไฟสำรอง','พักโหลด','แจ้งเตือน','คืนระบบ'];
for(let i=0;i<7;i++){let x=56+i*168;rect(s,x,180,156,109,i===3?'#FFF4D1':C.soft);tx(s,String(i+1),x+13,191,32,30,20,C.blue,true);tx(s,names[i],x+13,235,134,45,23,C.navy,true);if(i<6)line(s,x+156,233,12,0,C.blue,2);}
await img(s,'notice-crop.png',56,331,535,238,'contain');
label(s,'ภาพจากเว็บจริง / ค่าจำลอง',56,585,340,C.yellow);
block(s,'โหนดไม่ส่งข้อมูล','ตรวจ last_seen / quality\nตรวจว่าเครื่องยังมีไฟหรือไม่\nเปิดดูเหตุและให้คนรับทราบ',640,331,584,191,C.soft);
tx(s,'Offline อย่างเดียวไม่ยืนยันไฟดับ\nไฟกลับคืน P0/P1 ก่อน ตามด้วย P2/P3 เมื่อเวลาเดิน',640,544,584,89,24,C.navy,true);
}
// 06. Full proposed hardware topology versus the still-pooled simulation model.
{
const s=base(6,'แบบฮาร์ดแวร์ครบแล้ว · ผลทดสอบยังต้องทำ','ผังระบุ P0–P3 และสาย 5V / Data แต่ dashboard ยังเป็นตัวจำลองรวม','ผังผู้ใช้ฉบับเต็ม 16 ต.ค. 2569 / ไม่อ้างผลติดตั้งหรือทดสอบจริง');
table(s,[['โหนด / เส้น','ข้อมูลตาม flowchart ฉบับเต็ม'],['P0','AC Adapter + Mini Solar → DCM → PM0 → ESP32-S3 / Monitor / Relay; 18650 ×2 → Dual-Rail UPS → PM0'],['P1','Battery → Single-Rail UPS → ESP32; EC / Temperature / V-I-Stability Monitor → ESP32'],['P2 · P3','แต่ละกล่อง: Battery → Single-Rail UPS → ESP32; Monitor → ESP32'],['ระหว่างกล่อง','RELAY ── 5V ──▶ P1/P2/P3 · ESP1/2/3 ── Data ──▶ ESP0']],56,176,1168,285,[210,958],19);
tx(s,'ตัวจำลองเดิม',56,489,520,36,28,C.navy,true);tx(s,'12 V / 1.2 kWh เป็นสมมติฐานรวม\nยังไม่จำลอง UPS แยกกล่องหรือ 5V จริง',56,538,545,82,22,C.gray);
tx(s,'สิ่งที่ยังต้องยืนยัน',676,489,548,36,28,C.navy,true);tx(s,'รุ่น / rating / cell wiring / charge & protection\nSensor calibration / 5V loading / Data protocol',676,538,548,82,21,C.gray);
}
// 07. Actual product proof. Main capture and compact supporting state.
{
const s=base(7,'ต้นแบบที่กดทดลองได้','เลือกอุปกรณ์ ลองไฟดับ แล้วอ่านเหตุและไฟสำรอง','E08–E09  ภาพระบบ production export บน localhost 15 ต.ค. 2569  ฉากสร้างตามภาพอ้างอิงและค่าจำลอง');
await img(s,'dashboard-crop.png',56,166,808,464,'contain');
await img(s,'outage-detail.png',894,166,330,259,'contain');
label(s,'ข้อมูลทดลอง',894,439,172,C.yellow);
const link=tx(s,'เปิดเว็บสาธารณะ',56,632,802,26,17,C.blue);link.text=[[{run:'peephatz-dev.github.io/community-field-notes/energy-platform/',link:{uri:'https://peephatz-dev.github.io/community-field-notes/energy-platform/',isExternal:true}}]];
tx(s,'URL: เว็บสาธารณะ',894,634,330,24,16,C.gray);
tx(s,'เดโม 45 วินาที',894,487,330,35,27,C.navy,true);tx(s,'เลือกจุดกระชัง\nลองไฟตก / ไฟดับ\nเปิดแจ้งเตือนและคืนไฟ',894,531,330,111,24);
}
// 08. Native proof matrix with explicit absence of physical evidence.
{
const s=base(8,'ความพร้อมที่พิสูจน์ได้วันนี้','ระดับแนวคิด / วิเคราะห์ พร้อมต้นแบบเว็บจำลอง','E06–E08 / E15  test/*.test.mjs และ deliverables/web-ui/screenshots  ตรวจ 15 ต.ค. 2569');
table(s,[['เรื่อง','ทำได้ในเว็บ','ฮาร์ดแวร์จริง','ก่อนติดตั้ง'],['พื้นที่ / เลือกจุด','PASS ภาพหน้าจอ','ยังไม่มีหลักฐาน','สำรวจตำแหน่งและสิทธิ์'],['ไฟดับ / แบต / โหลด','PASS automated tests','ยังไม่มีหลักฐาน','bench + runtime test'],['แจ้งเตือน / ประวัติ','PASS UI + tests','ยังไม่มีหลักฐาน','ทดสอบรับเหตุ / offline'],['วงจร / ข้อมูล','แนวคิด DC และ schema','ยังไม่มีหลักฐาน','BOM / rating / สอบเทียบ']],56,176,1168,332,[258,280,275,355],23);
rect(s,56,535,1168,103,C.soft);tx(s,'52 / 52',76,547,240,58,43,C.blue,true);tx(s,'แบบทดสอบซอฟต์แวร์ผ่าน',330,549,820,36,27,C.navy,true);tx(s,'หลักฐานนี้ยังไม่ใช่ผลทดลองกับกลุ่มตัวอย่างหรือการติดตั้งในชุมชน',330,594,850,32,23,C.gray);
}
// 09. Native decision table. No invented price or return.
{
const s=base(9,'ต้นทุนขึ้นกับปัญหาและโหลดจริง','ความต่างที่เสนอ: มีหลักฐานเลือกวิธีแก้และตรวจผลหลังทำ','E10–E14 / E18  PEA / Schneider / NECTEC (2560, 2563) / ราคา UPS: Advice 15 ต.ค. 2569  URL ใน notes');
table(s,[['ทางเลือก','เงินลงทุน / ดูแล','ชั่วโมงคุ้มครอง','ข้อมูลและความเสี่ยง'],['ตรวจระบบกับการไฟฟ้า','TBD / ขอบเขตงาน','ขึ้นกับการแก้เหตุ','บันทึกแรงดัน / ผู้รับผิดชอบ'],['UPS สำเร็จรูป','1,750* / ดูแล TBD','ตามรุ่นและโหลด','W, VA, runtime / เข้ากันได้'],['สำรองเฉพาะโหลด','TBD / วงจรและแบต','ตาม Wh ใช้ได้จริง','กระแสเริ่มต้น / ความปลอดภัย'],['Solar + Battery','TBD / ติดตั้งและดูแล','ตามแสงและโหลด','พื้นที่ อายุแบต / ความคุ้ม']],56,168,1168,305,[260,270,265,373],22);
rect(s,56,496,566,139,'#FFF7D9');tx(s,'ตัวอย่างขนาดแบต  ไม่ใช่ราคา',74,508,530,35,25,C.navy,true);tx(s,'150 W × 2 h ÷ (0.8 × 0.8) ≈ 469 Wh',74,553,530,36,27,C.navy,true);tx(s,'สมมติ DoD 80% และประสิทธิภาพ 80%  ยังต้องวัด',74,600,530,27,19,C.gray);
tx(s,'เทคโนโลยีเดิมที่ต้องเทียบ',654,500,570,37,25,C.navy,true);tx(s,'Bubble FiT / Aqua-IoT ทำเรื่องติดตามน้ำ\nPowerGuard เสนอการวินิจฉัยไฟและลำดับโหลด\nต้นทุนรวมและผลประหยัดยังรอยืนยัน',654,546,570,100,22,C.gray);
}
// The advertised UPS unit is a pricing reference, not a selected or runtime-validated BOM.
tx(P.slides.items[8],'*ราคาเครื่อง UPS ตัวอย่างเฉพาะออนไลน์  ยังไม่รวมระบบวัด ตู้ การติดตั้ง และค่าเปลี่ยนแบต  ต้องตรวจราคาอีกครั้ง',56,642,1168,23,16,C.gray);
// 10. Pilot, owners, KPI and full appendix entry points.
{
const s=base(10,'แผนทดลองและภาคผนวกฉบับเต็ม','เริ่ม 1–2 จุดที่ชุมชนยินยอม  รายละเอียดทุกหมวดเปิดจากหน้านี้','E04 / E16–E18  ข้อเสนอทดลอง  เกณฑ์ซ้อมทั้ง 5 ด้านยังไม่ใช่เกณฑ์ทางการ');
const phases=['สำรวจ','วัด','วิเคราะห์','ป้องกัน','วัดผล','ขยาย'];for(let i=0;i<6;i++){rect(s,56+i*197,167,181,58,i===5?C.navy:C.soft);tx(s,phases[i],66+i*197,177,161,36,26,i===5?C.white:C.navy,true,'center');if(i<5)line(s,237+i*197,195,16,0,C.blue,2);}
tx(s,'วัดผลก่อนขยาย',56,252,355,38,28,C.navy,true);tx(s,'หลักฐานเหตุครบเพียงใด\nคงโหลดสำคัญได้กี่นาที\nต้นทุนตลอดอายุเทียบทางเลือก\nผู้ดูแลอ่านเหตุและบันทึกได้',56,306,355,162,23);
tx(s,'เจ้าของงาน',458,252,355,38,28,C.navy,true);tx(s,'นาย  โจทย์ / ต้นทุน / แผน\nโฟล์ค  โหลด / วงจร / ป้องกัน\nพี  Dashboard / ข้อมูล / KPI\nบอส  การสื่อสาร / ผู้รับเหตุ\nข้าวฟ่าง  หลักฐาน / ยืนยัน',458,306,355,200,23);
tx(s,'ภาคผนวกทุกหมวด',860,252,364,38,28,C.navy,true);
const appendixUrl='https://peephatz-dev.github.io/community-field-notes/pitch-appendix.html';
for(const [i,[label,hash]]of [['หลักฐานและข้อมูลที่ยังขาด','evidence'],['วงจร สมการ และข้อจำกัด','engineering'],['ต้นทุน KPI และแผนลงพื้นที่','field'],['สคริปต์ Q&A ผลตรวจ และไฟล์','pitch']].entries()){
 const t=tx(s,label,860,305+i*43,364,38,23,C.blue,true);t.text=[[{run:label,style:{underline:'sng'},link:{uri:appendixUrl+'#'+hash,isExternal:true}}]];
}
const all=tx(s,'เปิดภาคผนวกฉบับเต็ม ↗',860,486,364,35,22,C.navy,true);all.text=[[{run:'เปิดภาคผนวกฉบับเต็ม',link:{uri:appendixUrl,isExternal:true},style:{underline:'sng'}}]];
rect(s,56,540,1168,101,C.navy);tx(s,'สิ่งที่ขอเพื่อเริ่ม',76,552,280,36,27,C.white,true);tx(s,'อนุญาตวัดแบบจำกัดจุด  เปิดข้อมูลเดิมที่ยินยอม\nตกลงผู้ประสานงานและผู้รับเหตุ  ชื่อท้องถิ่นยัง TBD',365,551,829,76,25,C.white);
const appendices=JSON.parse(await fs.readFile(path.join(TMP,'appendix-sources.json'),'utf8'));
let full='\n\nAPPENDIX ฉบับเต็ม — เอกสารในคลังโครงการ\n'+appendixUrl+'\n';
for(const doc of appendices)full+='\n\n===== '+doc.id+' / '+doc.file+' =====\n'+await fs.readFile(path.join(ROOT,doc.file),'utf8');
full+='\n\n===== SPEAKER NOTES 1–10 =====\n'+notes.map((n,i)=>'หน้า '+(i+1)+'\n'+n.script+'\n'+n.detail+'\n'+n.sources.join('\n')).join('\n\n');
s.speakerNotes.text=String(s.speakerNotes.text)+full;
}
await fs.mkdir(path.join(OUT,'slides'),{recursive:true});
for(const [i,s] of P.slides.items.entries()){
 const png=await P.export({slide:s,format:'png',scale:1.5});await fs.writeFile(path.join(OUT,'slides',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
 const layout=await s.export({format:'layout'});await fs.writeFile(path.join(TMP,`slide-${i+1}.layout.json`),await layout.text());
}
await (await PresentationFile.exportPptx(P)).save(path.join(TMP,'candidate.pptx'));
// PDF is converted from the finalized PPTX by export-pdf.sh. The bundled PDF export lacks #standard-fonts/Helvetica in this runtime.
const validatedPath=path.join(TMP,'validated',`pitch-${Date.now()}.pptx`);
await fs.mkdir(path.dirname(validatedPath),{recursive:true});
const receiptPath=path.join(TMP,'receipts',path.basename(validatedPath)+'.json');
await fs.mkdir(path.dirname(receiptPath),{recursive:true});
const {finalizePresentation}=await import(pathToFileURL('/Users/nokia/.codex/plugins/cache/openai-primary-runtime/presentations/26.1013.11914/skills/presentations/container_tools/artifact_tool_utils.mjs').href);
await finalizePresentation({workspaceDir:ROOT,candidatePath:path.join(TMP,'candidate.pptx'),finalPath:validatedPath,pythonExecutable:'/Users/nokia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:'/Users/nokia/.codex/plugins/cache/openai-primary-runtime/presentations/26.1013.11914/skills/presentations/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:'/Users/nokia/.codex/plugins/cache/openai-primary-runtime/presentations/26.1013.11914/skills/presentations/container_tools/inspect_presentation_layout_geometry.py',explicitTotalSlideCount:10,requiredNativeTableOwnerSlides:[6,8,9],requiredNativeChartOwnerSlides:[],layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','6','--require-native-table-slide','8','--require-native-table-slide','9'],fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,receiptPath});
await fs.copyFile(receiptPath,path.join(TMP,'final-deck.validation.json'));
await fs.copyFile(validatedPath,path.join(OUT,'SalaHum_PowerGuard_Pitch_10Slides_16x9.pptx'));
console.log('Exported 10 editable slides and PNGs');
