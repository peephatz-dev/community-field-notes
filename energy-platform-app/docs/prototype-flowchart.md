# ผังต้นแบบล่าสุดร่วมเว็บและสไลด์

ปรับปรุง 15 ตุลาคม 2569 จาก Mermaid ที่ผู้ใช้ส่งโดยตรง สถานะเป็น **ผังที่เสนอและยังได้รับไม่ครบ** ไม่ใช่ผลทดลองหรือติดตั้งจริง

เอกสารนี้แทนรายละเอียดวงจรทั่วไปในฉบับเดิมเมื่อมีความขัดแย้งกัน ข้อมูลบริบทชุมชนและตัวจำลองเดิมยังคงใช้ตามขอบเขตที่ติดป้ายไว้

## P0: Master Power Node

กล่องกันน้ำของตัวเอง จำลองจุดเชื่อมไฟหมู่บ้านด้วย AC Adapter รับ Mini Solar Cell ผ่าน Multi-Source DC Input Manager แบตเตอรี่ 18650 #1 และ #2 เข้า Dual-Rail UPS Battery System จากนั้น DC Input Manager และ UPS เข้า 2-Way Power Manager จ่ายให้ ESP32-S3, Voltage / Current / Stability Monitor และ Relay Power Distribution

### ลูกศรที่ได้รับ

| ต้นทาง | ปลายทาง |
|---|---|
| AC Adapter | Multi-Source DC Input Manager |
| Mini Solar Cell | Multi-Source DC Input Manager |
| 18650 #1 | Dual-Rail UPS Battery System |
| 18650 #2 | Dual-Rail UPS Battery System |
| Multi-Source DC Input Manager | 2-Way Power Manager |
| Dual-Rail UPS Battery System | 2-Way Power Manager |
| 2-Way Power Manager | ESP32-S3 |
| 2-Way Power Manager | Voltage / Current / Stability Monitor |
| 2-Way Power Manager | Relay Power Distribution |

## P1: Water Quality Node

กล่องกันน้ำแยกจาก P0 มีรายการ 18650 Battery, Single-Rail UPS, ESP32 และข้อความ EC ที่ยังไม่ครบ ต้นฉบับจบที่ `EC["EC` จึงยังไม่มีลูกศร P1 ที่ยืนยันได้ ไม่เติมการต่อแบตไป UPS หรือ EC ไป ESP32 ด้วยการคาดเดา

## P2–P3 และเส้นเชื่อมระหว่างโหนด

ส่วนที่ได้รับยังไม่ระบุองค์ประกอบ P2–P3, เส้นจ่ายไฟระหว่างกล่อง, transport, เส้นข้อมูล, GPIO หรือเส้นควบคุมรีเลย์ บทบาทและเส้นเชื่อมบนแผนที่เดิมเป็นความสัมพันธ์ของการสาธิต ไม่ยืนยันการเดินสายจริง

## ตัวจำลองและฮาร์ดแวร์ต้องอ่านแยกกัน

เว็บยังใช้ตัวจำลองร่วมเดิมเพื่อแสดงสถานการณ์และบันทึกเหตุ: บัสสาธิต 12 V, ความจุรวม 1.2 kWh, โหลด 30/120/80/260 W และนโยบาย P0 > P1 > P2 > P3 **ยังไม่จำลอง UPS แยกกล่องหรือแต่ละเซลล์** ตัวเลขเหล่านี้ไม่ใช่สเปก Mini Solar, 18650 หรือผลทดสอบเวลาสำรองของวงจรล่าสุด

ชื่อ Dual-Rail ไม่ยืนยันว่าเซลล์ต่อ 2S/2P หรือแรงดันแพ็กเท่าใด ชื่อ 2-Way Power Manager ไม่ยืนยันวงจรชาร์จหรือ DC-DC ภายใน กล่องกันน้ำยังไม่ยืนยันระดับ IP

EC คือการนำไฟฟ้า การแปลงเป็นความเค็มต้องมีรุ่นหัววัด การชดเชยอุณหภูมิ และวิธีสอบเทียบ ส่วนนี้เป็นคำอธิบายสิ่งที่ต้องตรวจ ไม่ใช่สเปกจากผังที่ขาดอยู่ DO ยังไม่มีการวัดและไม่แสดงค่าขึ้นเอง

## แหล่งข้อมูลร่วม

- `energy-platform-app/src/lib/prototype-topology.json` ใช้สร้าง component inspector, circuit graph และสไลด์หน้า 4 โดยตรง
- `energy-platform-app/public/prototype-flowchart.mmd` เป็น Mermaid ที่ปิด syntax ให้อ่านได้เฉพาะส่วนที่ได้รับ ไม่มีการเติมเส้นที่ขาด
- `energy-platform-app/public/prototype-topology.json` สำเนาสำหรับดาวน์โหลดบนเว็บ
- สไลด์หน้า 6 และ speaker notes อธิบาย P1 ที่ยังไม่ครบและขอบเขตตัวจำลอง หน้า 10 รวมข้อความเต็มนี้ใน notes และลิงก์ภาคผนวก

## ข้อมูลที่ยังต้องส่งต่อ

- ผัง P1 หลัง EC และลูกศรทั้งหมด
- องค์ประกอบและการเชื่อมต่อ P2–P3
- เส้นข้อมูลและ transport ระหว่างโหนด
- รุ่น UPS และ DC Input/Power Manager
- ความจุเซลล์ การป้องกัน การชาร์จ พิกัด และการต่อแบตจริง
- ผลวัดฮาร์ดแวร์ แรงดัน กระแส และเวลาสำรองแต่ละกล่อง
