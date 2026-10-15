# ผลส่งมอบและการตรวจ SALA HUM POWERGUARD

วันที่ 15 ตุลาคม 2569 · สาขา `feat/powerguard-isometric-pitch10` · ไม่ merge และไม่ deploy รอบนี้

## สิ่งที่เปลี่ยน

- หน้าแรกใช้ R3F coastal digital twin ตัวเดิมจริงในมุม isometric มี floating KPI, selected-equipment inspector, scene/2D, zoom/rotate/reset/focus และ timeline ที่อ่าน event จาก simulator ร่วม
- เลือกกระชังจริงใน scene เพื่อดู P1 ได้ มีปุ่มเลือกอุปกรณ์คู่กันสำหรับ keyboard/2D fallback
- โหมดชาวบ้าน ผู้ดูแล และวิศวกรใช้ state เดียวกัน Community labels ใช้คำไทย ผู้ดูแลรับทราบเหตุและเปิดประวัติ วิศวกรเห็น P0–P3
- มือถือแยก KPI ขึ้นเหนือ canvas มี inspector ต่อด้านล่าง ฉากไม่ถูก KPI บังอุปกรณ์ทั้งสี่
- Toast สำคัญหนึ่งใบเคลียร์ inspector และผู้ช่วย เหตุทั้งหมดอยู่ notification center/history เดิม เสียงเริ่มปิดและให้เปิดเอง
- แผนสำรอง/บันทึกเหตุยังเก็บในเครื่องเดิม มีกราฟและหน้า evidence/roadmap ต่อใต้ฉาก
- ไม่เปลี่ยนสมการพลังงาน priority, battery thresholds หรือสัญญาณ power vs offline vs fault

## คุณสมบัติเดิมที่คงอยู่

19 content routes: `/`, `/dashboard`, `/explore`, `/simulation`, `/circuit`, `/notifications`, `/backup-plan`, `/roadmap`, `/presentation`, `/process`, `/roles`, `/power`, `/devices`, `/community`, `/history`, `/environment`, `/architecture`, `/solution`, `/docs` พร้อม basePath production `/community-field-notes/energy-platform/`

ฉากอิงพื้นที่, orthographic/top/oblique เดิม, spatial reference overlays, environmental/weather/tide/mixing simulation, circuit views/inspection, battery/load policy, history/CSV/JSON exports, original SVG assets, sound/ambience/speech, dedup/acknowledge/resolution/local reports และ planner ไม่ถูกลบ

## Automated checks

| วิธีตรวจ | ผล | ขอบเขต |
|---|---|---|
| `pnpm typecheck` | PASS | TypeScript source |
| `pnpm test` | PASS 52/52 | model, simulator, battery/reserve/recovery, offline/fault quality, circuit graph, relative site geometry, synthetic environment, assets/audio/preferences, notice dedup/storage, backup plan และ 2 tests ใหม่สำหรับ journey/audience |
| `pnpm build` | PASS | production build และ prerender ทุก route |
| `pnpm export:github` | PASS | เรียก production build และคัด static export ไป energy-platform/ พร้อม basePath |

เพิ่ม `test/isometric.test.mjs` โดยไม่แก้ test เก่าให้ผ่านหลอก ไม่ใช้จำนวน test เป็นความพร้อม hardware/field เอกสาร log ส่วนตัวอยู่ `.codex-build/pitch10/final-typecheck.log`, `final-tests.log`, `final-export.log`

## Browser checks จริง

ใช้ CUA In-app browser กับ localhost static production export port3013 และตรวจ Next dev server ที่มีอยู่ port3000 ด้วย Dev UI เปิดได้ แต่ dynamic scene บน dev ค้างรอ จึงตรวจ interaction/capture หลักจาก production export ที่โหลดได้จริง ไม่มีการอ้างว่า dev dynamic loading ผ่านครบ ไม่หยุด dev server ของผู้ใช้

- Desktop ขอ viewport1440×1000 และ mobile390×844 ตรวจขนาด DOM (ไม่มี body horizontal overflow) บางภาพ browser export มี actual dimensions1425×919/375×812 ตามระบบ capture และภาพล่าสุด mobile390×844 ระบุ actual file metadata ได้
- เลือก P1 จาก marker/ปุ่ม: inspector เปลี่ยนชื่อและโหลด120W; zoom, rotate, reset, qualitylow และ 2D เปิดได้
- ไฟตก/ไฟดับ: source0V, backup, P3พัก, P0/P1คงเมื่อแบตพอ, notice/timeline/chartsอัปเดต แม้พักเวลา
- recovery: statusกลับไฟหลักและมีขั้นคืนโหลด ต้องเล่นเวลาให้ P2/P3 คืนครบตาม simulation
- แบตต่ำ/วิกฤต: UI แสดง7%และทำงาน1/4เมื่อเลือกวิกฤต; offlineและsensor faultเป็นคนละเหตุ ไม่เพิ่ม DO
- operator acknowledgement, engineer labels, community labels, ambient opt-in/มิวต์ และเสียงพร้อม status ตรวจแล้ว เสียงการเล่นมี automated media tests ด้วย ไม่อ้างทดสอบความดังทางกายภาพ
- circuit exploded view และการเลือก V/I monitor เปิด inspector ได้ ภาพ `circuit-exploded.png` เป็น concept assembly
- plannerเปิดบนมือถือได้ แสดง150W /469Wh /188VA สมมติ และกดบันทึก มี automated persistence/invalid-input tests ไม่อ้างว่าทดสอบร่วมหลายเครื่องหรือ cloud sync
- โหลดเส้นทางวิศวกรรม 9 routes กับมือถือ 6 routesเพิ่มเติม และ root/power/circuit/planner โดยตรง ไม่มีการอ้างคลิกทุกปุ่มบนทุก route ทุก breakpoint การตรวจ interaction มุ่งเส้นทางสำคัญกับ model tests
- production console ตรวจไม่พบ error ใน fresh capture; มี upstream deprecation warning THREE.Clock และ PCFSoftShadowMap ในห้องวงจร ไม่ใช่ข้อมูลวัดจริง
- ระหว่างใช้หลาย dynamic scene/viewport เป็นเวลานานพบ WebGL context ไม่พร้อมหนึ่งแท็บ เปิดแท็บทดสอบใหม่แล้วแสดงฉากได้ คง low quality/2D fallback ไม่อ้าง benchmark FPS/WebGL performance ที่ไม่ได้วัด

## Visual review

ใช้ impeccable detector ครั้งเดียวบนเป้าหมายใหม่ ผล0 findings แล้ว fresh reviewer พบสามข้อ จึงแก้แจ้งเตือนบัง inspector, KPI มือถือบัง marker และเส้นขอบ toast4px หลังแก้พบ regression noticeบังmascot แก้ตำแหน่งอีกครั้ง Targeted verdictสุดท้าย `ship` ระบุสามข้อและ regression resolved ใช้ reviewerทั่วไปแทน class-specific ที่ harnessไม่ inject ไม่อ้างรับรองทั้งระบบ

`DESIGN.md` และ machine sidecar อัปเดตให้ตรงกับlight brand systemจริง ภาพยืนยัน: `web-ui/screenshots/desktop-normal.png`, `desktop-outage.png`, `mobile-overview.png`, `mobile-full.png`, `circuit-exploded.png`

## Pitch QA

- 10 content slides รวมปกแล้ว รอบใหม่เพิ่ม appendix index บนหน้า 10 พร้อม notes และเว็บฉบับเต็ม ไม่มีสไลด์11
- 16:9 13.333×7.5นิ้ว มี10speaker-note parts เป็นไทย สคริปต์รวม360วินาที หน้าสินค้ามีเดโม45วินาทีในช่วง50วินาที
- PPTX text/shape/connectors editable และ3 native tables บนหน้า6/8/9 มี320โดยประมาณ text object รวมตาราง font Sarabun ตรวจชื่อฟอนต์และ first-party reimport ผ่าน ไม่เปิดตรวจใน PowerPoint/Google Slides จึงไม่อ้าง native application compatibility ทุกกรณี
- Render1920×1080ทุกหน้าด้วย Artifact Tool ตรวจรายหน้าและcontact sheet แก้กล่องชื่อ P2/P3 ที่ตัดบรรทัดทับคำอธิบาย และแก้ทิศลูกศร workflow/dataให้ถูก
- Package/layout finalizer PASS, zero findings/warnings, slide count10, dimensionsถูก, native tablesครบ และภาษาไทยอยู่ในXML/notes
- Direct PDF exporter runtime error missing `#standard-fonts/Helvetica` จึงลอง headless LibreOffice แต่พบ Thai glyphหายและ reject output จากนั้นใช้ reportlabสร้าง PDFอ่านจาก PNGที่ตรวจแล้ว1920×1080 ภาพคมเท่าพรีวิวและมี10หน้า PDFเป็นภาพ ไม่ใช่สำเนาข้อความที่ค้นได้ PPTXยังแก้ไขได้
- มาสคอตบนเว็บเป็นSVGจริง PPTXใช้PNGความละเอียดสูงที่มากับแพ็กเดียวกันเนื่องจากrendererบางส่วนแสดงSVG fillsไม่ตรง เก็บSVGต้นฉบับในsourceด้วย
- ราคาหน้า9เพิ่มเพียงค่าUPSตัวอย่าง1,750บาทจากหน้าAdviceตรวจ15ต.ค.2569 เป็นค่าเครื่องอ้างอิง ไม่ใช่ราคาโครงการรวม/รุ่นที่เลือก/หลักฐานสำรอง2ชั่วโมง ค่าอื่นและBOMยังTBD ต้องตรวจราคาอีกครั้ง
- เกณฑ์ห้าด้านเป็นสมมติสำหรับซ้อม และฉบับล่าสุด/สิทธิ์ภาพยังต้องตรวจ ไม่อ้างคะแนนหรือความร่วมมือที่ไม่มีหลักฐาน

## ความจริงที่ต้องคงไว้

ไม่มีข้อมูล hardware bench test หรือ field installation ที่ตรวจได้ในชุดที่มี ไม่มีผลประหยัดค่าไฟ/ลดปลาตาย/เพิ่มรายได้/ลดคาร์บอนที่วัดแล้ว ทุกค่าบนแอปจำลอง ภาพ3Dคือreconstructionเชิงสัมพันธ์ P0–P3เสนอ ไม่มีDOจริง ไม่มีbackendสด ไม่สั่งmains

ราคาแบต อายุใช้งาน ภาระดูแล ความถี่เหตุไฟ และเจ้าของจุดทดลองยังขาด ดู `research/missing-evidence-and-field-plan.md` แผนถัดไปคือขออนุญาตสำรวจ1–2จุด วัดโหลด/ไฟจริง เทียบซ่อม/UPS/backup/solar แล้วใช้เกณฑ์ร่วมตัดสินใจ

## แผนที่เนื้อหาไกด์เดิมสู่10หน้า

Executive summary=1, ปัญหา/ผลกระทบ=2, workflow=3, solution/architecture=4, user/failover=5, feasibility/circuit=6, product demo=7, PoC/limits=8, costs/alternatives=9, stakeholders/pilot/ESG=10และnotes รายละเอียดแหล่งอ้างอิงและคำถามเสริมอยู่companionMDแทนเพิ่มสไลด์

## ไฟล์ส่งมอบ

`pitch-deck/` มี PPTX/PDF/10 PNG/contact sheet, script,20 Q&A, human video shot list และsourceพร้อมassets/URLs ส่วน `research/` มีevidence ledgerและแผนยืนยัน, `web-ui/` มีภาพเว็บจริงและdesignbrief ไม่สร้างวิดีโอAI

## รอบเผยแพร่และ Canva ตามคำขอใหม่

ผู้ใช้อนุญาต deploy และนำงานไป Canva แล้วในรอบนี้ หน้า 10 เพิ่มสารบัญภาคผนวกที่ลิงก์ไป `pitch-appendix.html` รวมข้อความเต็ม 18 เอกสาร + speaker notes 10 หน้า และภาพ/ไฟล์ต้นฉบับ โดยยังมีสไลด์หลัก 10 หน้า รายละเอียดเต็มแนบใน notes ของหน้า10ด้วย ไม่อัดตัวเล็กลงบนสไลด์ การนำเข้า Canva และการเผยแพร่ต้องตรวจผลจริงก่อนรายงานว่าสำเร็จ ข้อความ “ยังไม่ deploy” ด้านบนเป็นสถานะรอบก่อนหน้า


### ผลตรวจรอบภาคผนวก

- Production export `pnpm export:github` ผ่าน คงเส้นทางแอปเดิม
- ภาคผนวกมี 18 เอกสารและ notes 10 หน้า ตรวจค้นคำว่า “แบต” พบ 12 เอกสาร เปิดทั้งหมดได้ 28 ส่วน ตารางเลื่อนอ่านได้ 23 ตาราง ซูมภาพใน dialog และปิดกลับได้
- Desktop 1440 และ mobile 390 ตรวจ DOM ไม่พบ horizontal overflow ภาพมือถืออ่านได้
- PDF รุ่นใหม่ 10 หน้า หน้า 10 มีลิงก์ภาคผนวก 5 ลิงก์
- Canva นำเข้าสำเร็จ 10 หน้า ตรวจข้อความและลิงก์หน้า 10 ครบ Notes API ส่งกลับ 5,000 ตัวอักษรจึงยังไม่ยืนยัน notes ทั้งก้อนใน Canva ใช้เว็บฉบับเต็มเป็นแหล่งอ่านหลัก


### คำขอล่าสุด

ผู้ใช้เลือกส่งมอบเฉพาะ PPTX และเผยแพร่เว็บ ยกเลิกการเชื่อม Canva ในเว็บ จึงเอาลิงก์ Canva ออกจากหน้าภาคผนวกและ README ใช้ PPTX เป็นไฟล์แก้ไขหลัก และคง PDF สำหรับอ่าน พร้อมภาคผนวกฉบับเต็มบนเว็บ

## ปรับ UX แบบแผนที่เป็นหลัก

รอบ 15 ต.ค. 2569 เปลี่ยนโครงใช้งานเป็นเมนูไอคอน KPI นอกฉาก แผงอุปกรณ์ที่เปิดเมื่อเลือก เครื่องมือกล้องรวม ลำดับเหตุย่อ ผู้ช่วยแบบย่อ และแยกหน้าสาธิต ใช้ตัวจำลองเดิม ตรวจรายละเอียดและภาพก่อน/หลังที่ [รายงาน UX](web-ui/ux-refactor/README.md) ชุดทดสอบเดิมยัง 52 ข้อ ไม่มีการอ้างติดตั้งจริง ภาพ Pitch รอบก่อนหน้าไม่ได้เปลี่ยนตามงาน UX นี้
