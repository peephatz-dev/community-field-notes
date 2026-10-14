export type NodeId = 'P0' | 'P1' | 'P2' | 'P3';
export type GridMode = 'normal' | 'sag' | 'outage';
/** Main-source recovery: P0/P1 first, then P2, then P3. Default 2 preserves legacy operation. */
export type RecoveryStage = 0 | 1 | 2;
export type EventSeverity = 'info' | 'warning' | 'critical';
export type P1Quality = 'available' | 'sensor-fault' | 'offline' | 'unpowered';

export type NodeDefinition = {
  id: NodeId;
  name: string;
  role: string;
  priority: number;
  watts: number;
  description: string;
  loads: string[];
};

export const NODE_DEFINITIONS: NodeDefinition[] = [
  { id: 'P0', name: 'ศูนย์ควบคุม', role: 'gateway · controller', priority: 0, watts: 30, description: 'รับข้อมูล ประเมินเหตุ จัดลำดับโหลด และบันทึกเหตุการณ์', loads: ['ตัวควบคุม', 'เกตเวย์สื่อสาร', 'หน้าจอจำลอง'] },
  { id: 'P1', name: 'ประมงและโหลดวิกฤต', role: 'aquaculture · critical', priority: 1, watts: 120, description: 'ติดตามแรงดัน กระแส ความเค็ม และอุณหภูมิ พร้อมโหลดสาธิตสำคัญ', loads: ['เซนเซอร์น้ำ', 'โหลดเติมอากาศสาธิต'] },
  { id: 'P2', name: 'โหลดชุมชนจำเป็น', role: 'essential community loads', priority: 2, watts: 80, description: 'ไฟส่องสว่างและอุปกรณ์จำเป็น ทำงานต่อเมื่อกำลังสำรองพอ', loads: ['ไฟส่องสว่าง', 'อุปกรณ์สื่อสาร'] },
  { id: 'P3', name: 'โหลดทั่วไป', role: 'interruptible loads', priority: 3, watts: 260, description: 'โหลดทั่วไปหรือโหลดสาธิตกำลังสูง ตัดก่อนเมื่อพลังงานจำกัด', loads: ['โทรทัศน์สาธิต', 'โหลดจำลองกำลังสูง'] },
];

export const COMPONENTS = [
  { id: 'source', label: 'แหล่งจ่าย DC จำลอง', category: 'Power', pin: '12V IN', supply: '12 V DC', signal: 'Power net', limit: 'ค่าจำลอง; ต้องกำหนดแหล่งจ่ายจริงก่อนสร้างวงจร', status: 'simulated' },
  { id: 'fuse', label: 'ฟิวส์ / ป้องกันกระแสเกิน', category: 'Protection', pin: 'F1', supply: 'series on 12V bus', signal: 'Power net', limit: 'ยังไม่กำหนดพิกัด; ห้ามต่อโหลดจริงตามภาพนี้', status: 'proposed' },
  { id: 'battery', label: 'แบตเตอรี่สำรอง (จำลอง)', category: 'Storage', pin: 'BAT+/BAT−', supply: '12 V nominal (model only)', signal: 'Power net', limit: 'ไม่ใช่ข้อกำหนดแบตเตอรี่จริง; BMS/charger ยังต้องเลือก', status: 'simulated' },
  { id: 'charger', label: 'วงจรชาร์จ / BMS', category: 'Protection', pin: 'BAT, LOAD', supply: 'chemistry-dependent', signal: 'Power + protection', limit: 'ชนิดเคมีและกระแสชาร์จต้องยืนยันก่อนออกแบบ', status: 'proposed' },
  { id: 'buck', label: 'DC-DC regulator', category: 'Power', pin: '12V → 5V / 3.3V', supply: 'input range TBD', signal: 'Regulated rails', limit: 'ต้องเลือกโมดูลและเช็ก transient / thermal จากโหลดจริง', status: 'proposed' },
  { id: 'esp32', label: 'ESP32 dev board', category: 'Control', pin: '3V3, GND, GPIO', supply: 'regulated per board', signal: 'ADC / digital / wireless', limit: 'GPIO ไม่ใช้ขับโหลดกำลังสูงโดยตรง', status: 'reference' },
  { id: 'sense', label: 'Voltage / current monitor', category: 'Sensing', pin: 'VIN, SHUNT, SDA/SCL', supply: 'device-specific', signal: 'I²C (example only)', limit: 'โมดูลจริงยังไม่ระบุ; ช่วงวัดและ isolation ต้องตรวจ', status: 'proposed' },
  { id: 'driver', label: 'Load driver + switch', category: 'Switching', pin: 'EN, LOAD±', supply: 'rated to load', signal: 'GPIO through driver', limit: 'พิกัดสวิตช์/ไดโอด flyback ขึ้นกับชนิดโหลด', status: 'proposed' },
  { id: 'temp', label: 'Water temperature probe', category: 'Sensing', pin: 'DATA / interface TBD', supply: 'probe-specific', signal: 'digital or conditioned analog', limit: 'รุ่น/ความลึก/การซีลยังไม่ระบุ', status: 'proposed' },
  { id: 'salinity', label: 'Conductivity / salinity interface', category: 'Sensing', pin: 'analog interface TBD', supply: 'probe-specific', signal: 'conditioned analog', limit: 'ต้องชดเชยอุณหภูมิและสอบเทียบกับเครื่องอ้างอิง', status: 'proposed' },
];

export type SimEvent = { id: string; minute: number; severity: EventSeverity; nodeId: NodeId | 'SYSTEM'; type: string; message: string; action: string; simulated: true };
export type Sample = { minute: number; voltage: number; busVoltage: number; current: number; battery: number; salinity: number | null; temperature: number | null; p1Quality: P1Quality; p0: number; p1: number; p2: number; p3: number };

export function activeLoad(id: NodeId, mode: GridMode, batterySoc: number, nodeOffline: NodeId | null, recoveryStage: RecoveryStage = 2): boolean {
  // Telemetry loss does not prove an electrical load stopped drawing power.
  void nodeOffline;
  if (mode !== 'outage') {
    if (mode === 'normal' && id === 'P2') return recoveryStage >= 1;
    if (mode === 'normal' && id === 'P3') return recoveryStage >= 2;
    return true;
  }
  if (id === 'P0' || id === 'P1') return batterySoc > (id === 'P0' ? 0 : 0.08);
  if (id === 'P2') return batterySoc >= 0.28;
  return false;
}

export function calcPower(mode: GridMode, batterySoc: number, nodeOffline: NodeId | null, recoveryStage: RecoveryStage = 2): number {
  return NODE_DEFINITIONS.reduce((sum, node) => sum + (activeLoad(node.id, mode, batterySoc, nodeOffline, recoveryStage) ? node.watts : 0), 0);
}

export function batteryStep(batterySoc: number, mode: GridMode, nodeOffline: NodeId | null, minutes = 1, recoveryStage: RecoveryStage = 2): number {
  if (mode !== 'outage' || batterySoc <= 0) return batterySoc;
  const watts = calcPower(mode, batterySoc, nodeOffline, recoveryStage);
  const capacityWh = 1200; // demonstrator-only capacity; not a selected battery specification.
  return Math.max(0, batterySoc - ((watts * minutes) / 60) / capacityWh);
}

export function gridVoltage(mode: GridMode, minute: number): number {
  if (mode === 'outage') return 0;
  if (mode === 'sag') return 9.7 + Math.sin(minute / 3) * 0.12;
  return 12.1 + Math.sin(minute / 4) * 0.08;
}

/** Illustrative regulated backup bus; voltage is not a selected battery's discharge curve. */
export function loadBusVoltage(mode: GridMode, battery: number, minute: number): number {
  return mode === 'outage' ? battery > 0 ? 12 : 0 : gridVoltage(mode, minute);
}

export function makeSample(minute: number, mode: GridMode, battery: number, nodeOffline: NodeId | null, sensorFault = false, waterShift = false, recoveryStage: RecoveryStage = 2): Sample {
  const busVoltage = loadBusVoltage(mode, battery, minute);
  const power = calcPower(mode, battery, nodeOffline, recoveryStage);
  const p1Powered = activeLoad('P1', mode, battery, nodeOffline, recoveryStage);
  const p1Quality: P1Quality = !p1Powered ? 'unpowered' : nodeOffline === 'P1' ? 'offline' : sensorFault ? 'sensor-fault' : 'available';
  const p1CanReport = p1Powered && nodeOffline !== 'P1';
  return {
    minute,
    voltage: gridVoltage(mode, minute),
    busVoltage: Number(busVoltage.toFixed(3)),
    // DC load-bus current from the same illustrative constant-power loads.
    // This excludes losses/startup current and is never a household AC measurement.
    current: busVoltage > 0 ? Number((power / busVoltage).toFixed(3)) : 0,
    battery: Math.round(battery * 100),
    // Independent synthetic event input; neither site colors nor zones infer these values.
    salinity: !p1CanReport || sensorFault ? null : Number((25.2 + Math.sin(minute / 8) * 0.7 - (waterShift ? 3.5 : 0)).toFixed(1)),
    temperature: p1CanReport ? Number((29.1 + Math.sin(minute / 11) * 0.4 + (waterShift ? .8 : 0)).toFixed(1)) : null,
    p1Quality,
    p0: activeLoad('P0', mode, battery, nodeOffline, recoveryStage) ? 30 : 0,
    p1: activeLoad('P1', mode, battery, nodeOffline, recoveryStage) ? 120 : 0,
    p2: activeLoad('P2', mode, battery, nodeOffline, recoveryStage) ? 80 : 0,
    p3: activeLoad('P3', mode, battery, nodeOffline, recoveryStage) ? 260 : 0,
  };
}

export function estimateRuntimeHours(batterySoc: number, mode: GridMode, nodeOffline: NodeId | null, recoveryStage: RecoveryStage = 2): number | null {
  if (mode !== 'outage') return null;
  const load = calcPower(mode, batterySoc, nodeOffline, recoveryStage);
  return load > 0 ? Math.max(0, (1200 * batterySoc) / load) : 0;
}
