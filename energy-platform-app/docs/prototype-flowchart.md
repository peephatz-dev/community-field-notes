# ผังต้นแบบฉบับเต็มร่วมเว็บและสไลด์

ปรับปรุง 16 ตุลาคม 2569 ตาม Mermaid ฉบับเต็มที่ผู้ใช้ส่ง ผังนี้เป็น **แบบต้นแบบที่เสนอ** ไม่ใช่หลักฐานประกอบจริงหรือติดตั้งในชุมชน

## P0 · Master Power Node

กล่องกันน้ำแยกของตัวเอง จำลองจุดเชื่อมไฟหมู่บ้านด้วย AC Adapter; Mini Solar Cell และ AC Adapter เข้า Multi-Source DC Input Manager, 18650 สองก้อนเข้า Dual-Rail UPS Battery System, ทั้ง DCM และ UPS เข้า 2-Way Power Manager แล้วออกไป ESP32-S3, Voltage / Current / Stability Monitor และ Relay Power Distribution

## P1 · Water Quality Node

กล่องแยก ประกอบด้วย 18650 Battery, Single-Rail UPS, ESP32, EC Sensor, Temperature Sensor และ Voltage / Current / Stability Monitor

ลูกศรตามผัง: BAT1→UPS1, UPS1→ESP1, EC→ESP1, TEMP→ESP1, MON1→ESP1

## P2 · Essential Monitoring Node

กล่องแยก ประกอบด้วย 18650 Battery, Single-Rail UPS, ESP32 และ Voltage / Current / Stability Monitor

ลูกศรตามผัง: BAT2→UPS2, UPS2→ESP2, MON2→ESP2

## P3 · General Monitoring Node

กล่องแยก ประกอบด้วย 18650 Battery, Single-Rail UPS, ESP32 และ Voltage / Current / Stability Monitor

ลูกศรตามผัง: BAT3→UPS3, UPS3→ESP3, MON3→ESP3

## การเชื่อมระหว่างกล่อง

- RELAY จ่าย **5V Power** ไปยังกล่อง P1, P2 และ P3
- ESP1 ส่ง **Data** ไป ESP0
- ESP2 ส่ง **Data** ไป ESP0
- ESP3 ส่ง **Data** ไป ESP0

รวม 24 รายการใน component inventory (รวม AC Adapter) และ 26 ลูกศรตามผัง: P0 จำนวน 9, P1 จำนวน 5, P2 จำนวน 3, P3 จำนวน 3, จ่าย 5V จำนวน 3 และ Data จำนวน 3

ผังไม่ได้ระบุรุ่นอุปกรณ์, rating, cell wiring, วิธีชาร์จ/ป้องกัน, pin map, protocol/transport, ความถี่ข้อมูล, calibration, ภาระ 5V หรือผล runtime จึงยังต้องออกแบบและทดสอบก่อนใช้งานจริง ชื่อ Dual-Rail ไม่พอจะสรุปการต่อแบตแบบ 2S/2P

## ตัวจำลองเว็บเป็นอีกขอบเขตหนึ่ง

เว็บยังใช้ตัวจำลองพลังงานรวมเดิมเพื่อสาธิตเหตุการณ์: bus 12 V, ความจุแบตรวม 1.2 kWh, โหลด 30/120/80/260 W และนโยบาย P0 > P1 > P2 > P3 ตัวจำลองนี้ **ยังไม่แทน** UPS แยกกล่อง, แรงดัน 5V ไปแต่ละกล่อง หรือเครือข่าย telemetry ตามผัง ค่าเหล่านี้ไม่ใช่สเปกของ 18650/UPS และไม่ใช่ผลการทดสอบฮาร์ดแวร์

## แหล่งข้อมูลร่วม

- `energy-platform-app/src/lib/prototype-topology.json` เป็นแหล่งกลางของ component inspector, circuit graph, หน้า Architecture และสไลด์ 4/6
- `energy-platform-app/public/prototype-flowchart.mmd` เป็น flowchart ฉบับเต็มที่ผู้ใช้ส่ง
- `energy-platform-app/public/prototype-topology.json` เป็นไฟล์ JSON สำหรับดาวน์โหลด
- รายการตรวจสอบที่ยังต้องทำอยู่ใน `pending` ของ JSON และแสดงในหน้าเว็บ
