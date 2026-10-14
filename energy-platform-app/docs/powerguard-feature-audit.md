# Existing feature audit — SALA HUM POWERGUARD

14 ตุลาคม 2026 · ตรวจจาก source ปัจจุบันก่อนรวม Asset Pack v2

| สถานะ | ฟังก์ชัน | Source |
| --- | --- | --- |
| Preserve | ลำดับโหลด แบตเตอรี่ การแยกไฟกับการสื่อสาร และช่องข้อมูลขาด | `src/lib/model.ts`, `src/store/simulator.ts` |
| Preserve | ดิจิทัลทวินตามภาพอ้างอิง ผัง 2D เปรียบเทียบ กล้องและภาพส่วนตัวในเบราว์เซอร์ | `Scene3D.tsx`, `SiteExperience.tsx`, `SitePlan.tsx`, `src/lib/site-layout.ts` |
| Preserve | ห้องวงจร 5 มุมมอง รายละเอียดชิ้นส่วนและ flow | `CircuitLab.tsx`, `src/lib/circuit-graph.ts` |
| Preserve | กราฟ JSON/CSV เหตุการณ์ การคืนโหลด และ quality flags | `Platform.tsx`, `TelemetryCharts.tsx` |
| Preserve | บทบาททีม กระบวนการ 11 ขั้น และ deck 10 ฉาก | `SiteGuide.tsx` |
| Preserve | อากาศ น้ำขึ้นลง พื้นท้องน้ำสมมติ การผสม 3 กล่อง และ clock ร่วม | `EnvironmentPanel.tsx`, `environment-model.ts`, `EnvironmentalScene.tsx` |
| Refactor | Shell, navigation, ข้อความและสี — โหมดชุมชน/วิศวกรใช้ simulation เดียวกัน | `Platform.tsx`, `globals.css` |
| Add | มาสคอต SVG, speech แบบกดฟัง, audio mixer/VFX, toast/center/history, Demo Lab | PowerGuard components/utilities เพิ่มใน source เดิม |
| Add | แผนสำรองไฟพร้อมสมมติฐาน/ราคาที่ผู้ใช้ใส่ ประวัติในเครื่องและ roadmap | Citizen pages เพิ่มบน routes เดิมและ routes ใหม่ |

ก่อนเริ่มรวมแพ็ก: 39 tests และ production export ผ่าน งานสี/สิ่งแวดล้อมที่ยังอยู่ใน working tree เป็นงานที่ได้รับอนุญาตในแชตนี้และจะรวมไว้ใน release นี้

ใช้เฉพาะ `public/powerguard/**` จากแพ็ก ภาพรวม preview และ reference images ไม่ใช้แทน SVG และไม่เผยแพร่เป็นแผนที่ ไม่มี hardware/live feed เชื่อมอยู่ ป้ายข้อมูลจึงเป็น “ข้อมูลทดลอง” เสมอ
