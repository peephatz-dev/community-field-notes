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
// 04. Native two-layer topology. Color and line type identify separate domains.
{
const s=base(4,'พลังงานและข้อมูลมีเส้นทางแยกกัน','โครงสร้าง P0–P3 เป็นข้อเสนอที่ต้องตรวจพิกัดก่อนสร้างจริง','E04–E05  เอกสารทีม น.1–5 และ src/lib/model.ts  ลำดับและตัวเลขเป็นนโยบายสาธิต');
label(s,'ทางเดินพลังงาน DC',56,172,270,C.yellow);label(s,'ข้อมูลและการแจ้งเตือน',56,422,270,C.soft);
const supply=block(s,'แหล่งจ่าย','DC / แบตสำรอง\nฟิวส์ + BMS เสนอ',56,227,230,156,'#FFF7D9');
const titles=['P0 ศูนย์ไฟ','P1 กระชัง','P2','P3'];
const bodies=['ตัวควบคุม\n30 W สมมติ','มอนิเตอร์ตัวอย่าง\n120 W สมมติ','เครื่องจำเป็น\n80 W สมมติ','เครื่องที่พักได้\n260 W สมมติ'];
for(let i=0;i<4;i++){const x=330+i*229;line(s,x+100,214,0,22,C.orange,3);block(s,titles[i],bodies[i],x,237,210,146,i===3?'#FFF0E8':C.soft);}
line(s,286,214,832,0,C.orange,4);line(s,286,214,0,70,C.orange,4);
const n1=block(s,'P1–P3','ค่าจำลอง + quality\nlast_seen / สถานะโหลด',56,477,316,137);const n0=block(s,'P0 รวมเหตุ','จำแนกไฟ / offline\nคงลำดับความสำคัญ',450,477,316,137);const dash=block(s,'Dashboard','คนรับแจ้ง / ประวัติ\nยืนยันหน้างานก่อนทำต่อ',844,477,380,137);arrow(s,n1,n0,C.blue,'right','left',true);arrow(s,n0,dash,C.blue,'right','left',true);
tx(s,'P0 > P1 > P2 > P3  ตามแบบจำลอง',350,175,690,35,26,C.navy,true);tx(s,'ตัวควบคุมสั่ง driver แรงดันต่ำ  ยังไม่มีการสั่งตัดไฟบ้านจริง',350,393,862,30,22,C.red);
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
// 06. Accurate feasibility. Native table + real circuit screenshot.
{
const s=base(6,'วงจรและข้อมูลที่ต้องพิสูจน์','เว็บแสดงแนวคิด DC  ฮาร์ดแวร์และ gateway ยังเป็นแผนพัฒนา','E04–E07  เอกสารทีม / circuit.ts / model.ts  schema ตัวอย่าง ไม่ใช่ telemetry สด');
table(s,[['ประเภทข้อมูล','แผนฮาร์ดแวร์ / สถานะตอนนี้'],['วัดตรง','แรงดัน กระแส อุณหภูมิ / เว็บใช้ค่าจำลอง'],['คำนวณ','SoC และเวลาสำรอง / ต้องเทียบค่าจริง'],['ยังวัดไม่ได้','DO ไม่มี sensor  ห้ามแจ้งภัยจาก DO']],56,176,630,250,[175,455],23);
await img(s,'circuit-crop.png',720,176,504,334,'contain');
tx(s,'ภาพห้องวงจรที่รันจริง  ชิ้นส่วนเป็น reference concept',720,519,504,28,16,C.gray);
rect(s,56,452,630,170,C.soft);tx(s,'Payload ที่เสนอ',74,464,594,35,25,C.navy,true);tx(s,'node_id, seq, timestamp, source_voltage,\nbattery_soc, load_state, last_seen, quality',74,507,590,63,22,C.navy);tx(s,'edge / gateway / transport ต้องเลือกและทดสอบจริง',74,582,590,26,20,C.gray);
tx(s,'ฟิวส์ BMS พิกัด สาย ตู้ และ isolation ต้องผ่านผู้มีคุณสมบัติ\nGPIO ไม่ขับโหลดโดยตรง  เว็บยังไม่สั่ง mains จริง',720,565,504,79,22,C.red);
}
// 07. Actual product proof. Main capture and compact supporting state.
{
const s=base(7,'ต้นแบบที่กดทดลองได้','เลือกอุปกรณ์ ลองไฟดับ แล้วอ่านเหตุและไฟสำรอง','E08–E09  ภาพระบบ production export บน localhost 15 ต.ค. 2569  ฉากสร้างตามภาพอ้างอิงและค่าจำลอง');
await img(s,'dashboard-crop.png',56,166,808,464,'contain');
await img(s,'outage-detail.png',894,166,330,259,'contain');
label(s,'ข้อมูลทดลอง',894,439,172,C.yellow);
const link=tx(s,'เปิดเว็บสาธารณะ (รุ่นก่อนรอบนี้)',56,632,802,26,17,C.blue);link.text=[[{run:'peephatz-dev.github.io/community-field-notes/energy-platform/',link:{uri:'https://peephatz-dev.github.io/community-field-notes/energy-platform/',isExternal:true}}]];
tx(s,'URL: รุ่นเผยแพร่ก่อนรอบนี้',894,634,330,24,16,C.gray);
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
// 10. Pilot, owners, KPI and modest ask.
{
const s=base(10,'ทดลอง 1–2 จุดก่อนตัดสินใจขยาย','จุดทดลองและผู้ดูแลในชุมชนยังรอข้อตกลง','E04 / E16–E17  แผนเสนอ  เกณฑ์ซ้อม: Problem, Innovation, Feasibility, Impact, Presentation (ไม่ใช่เกณฑ์ทางการ)');
const phases=['สำรวจ','วัด','วิเคราะห์','ป้องกัน','วัดผล','ขยาย'];for(let i=0;i<6;i++){rect(s,56+i*197,174,181,64,i===5?C.navy:C.soft);tx(s,phases[i],66+i*197,187,161,36,27,i===5?C.white:C.navy,true,'center');if(i<5)line(s,237+i*197,205,16,0,C.blue,2);}
tx(s,'สิ่งที่จะวัดก่อนขยาย',56,267,553,39,29,C.navy,true);tx(s,'ความครบถ้วนหลักฐานเหตุ\nนาทีที่คงโหลดสำคัญได้\nต้นทุนตลอดอายุเทียบทางเลือก\nผู้ดูแลอ่านเหตุและบันทึกได้',56,317,553,172,25);
tx(s,'เจ้าของงานและผลส่งมอบ',660,267,564,39,29,C.navy,true);tx(s,'นาย  โจทย์ / ต้นทุน / แผนทดลอง\nโฟล์ค  โหลด / วงจร / ความปลอดภัย\nพี  Dashboard / บันทึกและ KPI\nบอส  การส่งข้อมูล / ผู้รับเหตุ\nข้าวฟ่าง  แหล่งข้อมูล / ยืนยันกับชุมชน',660,317,564,209,24);
rect(s,56,540,1168,101,C.navy);tx(s,'สิ่งที่ขอเพื่อเริ่ม',76,552,290,36,27,C.white,true);tx(s,'อนุญาตวัดแบบจำกัดจุด  เข้าถึงข้อมูลระบบเดิมที่ยินยอม\nระบุผู้ประสานงานและผู้รับเหตุร่วมกัน  ชื่อท้องถิ่นยัง TBD',376,551,818,74,25,C.white);
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
const {finalizePresentation}=await import(pathToFileURL('/Users/nokia/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/presentations/container_tools/artifact_tool_utils.mjs').href);
await finalizePresentation({workspaceDir:ROOT,candidatePath:path.join(TMP,'candidate.pptx'),finalPath:validatedPath,pythonExecutable:'/Users/nokia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:'/Users/nokia/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/presentations/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:'/Users/nokia/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/presentations/container_tools/inspect_presentation_layout_geometry.py',explicitTotalSlideCount:10,requiredNativeTableOwnerSlides:[6,8,9],requiredNativeChartOwnerSlides:[],layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','6','--require-native-table-slide','8','--require-native-table-slide','9'],fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,receiptPath});
await fs.copyFile(receiptPath,path.join(TMP,'final-deck.validation.json'));
await fs.copyFile(validatedPath,path.join(OUT,'SalaHum_PowerGuard_Pitch_10Slides_16x9.pptx'));
console.log('Exported 10 editable slides and PNGs');
