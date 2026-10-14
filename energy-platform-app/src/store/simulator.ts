import { create } from 'zustand';
import { activeLoad, batteryStep, gridVoltage, makeSample, type GridMode, type NodeId, type RecoveryStage, type Sample, type SimEvent } from '@/lib/model';
import { advanceEnvironment, createEnvironmentState, environmentPresetOptions, normalizeEnvironmentControls, recordEnvironment, type EnvironmentControls, type EnvironmentPreset, type EnvironmentState } from '@/lib/environment-model';

export type Scenario = 'normal' | 'sag' | 'outage' | 'offline' | 'sensor-fault' | 'low-battery' | 'extended-outage' | 'critical-battery' | 'water-change' | 'recovery';
type SimulatorState = {
  minute: number; running: boolean; mode: GridMode; batterySoc: number; nodeOffline: NodeId | null; sensorFault: boolean; waterShift: boolean; recoveryStage: RecoveryStage;
  selectedNode: NodeId; activePage: string; cameraMode: string; circuitMode: string; circuitSelection: string;
  events: SimEvent[]; samples: Sample[];
  environment: EnvironmentState; playbackSpeed: number; runEpoch:number;
  setPage: (page: string) => void; setSelectedNode: (id: NodeId) => void; setCameraMode: (mode: string) => void;
  setCircuitMode: (mode: string) => void; setCircuitSelection: (id: string) => void;
  setScenario: (scenario: Scenario) => void; setMode: (mode: GridMode) => void; toggleOffline: (id: NodeId) => void;
  toggleSensorFault: () => void; toggleRunning: () => void; step: () => void; reset: () => void;
  setEnvironmentOptions: (patch: Partial<EnvironmentControls>) => void;
  setEnvironmentView: (patch: Partial<Pick<EnvironmentState, 'layer' | 'inspection' | 'showCurrents' | 'inspectPoint'>>) => void;
  setEnvironmentPreset: (preset: EnvironmentPreset) => void;
  setPlaybackSpeed: (speed: number) => void;
};

const initialSample = makeSample(0, 'normal', 1, null);
let eventSequence = 0;
const event = (minute: number, severity: SimEvent['severity'], nodeId: SimEvent['nodeId'], type: string, message: string, action: string): SimEvent => ({
  id: `${minute}-${type}-${nodeId}-${++eventSequence}`, minute, severity, nodeId, type, message, action, simulated: true,
});

type SnapshotState = Pick<SimulatorState, 'minute' | 'mode' | 'batterySoc' | 'nodeOffline' | 'sensorFault' | 'waterShift' | 'recoveryStage' | 'environment'>;
function perturbZoneA(environment: EnvironmentState): EnvironmentState {
  return { ...environment, zones: { ...environment.zones, A: {
    salinity: Math.max(0, environment.zones.A.salinity - 3.5),
    temperature: environment.zones.A.temperature + .8,
  } } };
}
function activateEnvironment(state: SnapshotState, patch: Partial<EnvironmentControls>): EnvironmentState {
  const base = !state.environment.enabled && state.waterShift ? perturbZoneA(state.environment) : state.environment;
  return recordEnvironment({ ...base, ...normalizeEnvironmentControls(base, patch), enabled: true }, state.minute);
}
function stateSample(state: SnapshotState): Sample {
  const sample = makeSample(state.minute, state.mode, state.batterySoc, state.nodeOffline, state.sensorFault, state.waterShift, state.recoveryStage);
  if (!state.environment.enabled) return sample;
  // These are synthetic Zone A outputs, not measured telemetry or image-derived values.
  // Existing availability/quality rules still suppress unavailable channels.
  return { ...sample,
    salinity: sample.salinity === null ? null : Number(state.environment.zones.A.salinity.toFixed(1)),
    temperature: sample.temperature === null ? null : Number(state.environment.zones.A.temperature.toFixed(1)),
  };
}
// A scenario is an instantaneous state transition, not an elapsed-time step.
// Preserve its pre-transition sample and allow several records at the same minute.
// Only step() advances the clock and integrates battery energy.
function appendSnapshot(state: SnapshotState & { samples: Sample[] }, change: Partial<SnapshotState>): Sample[] {
  const next = { ...state, ...change };
  return [...state.samples.slice(-39), stateSample(next)];
}

export const useSimulator = create<SimulatorState>((set, get) => ({
  minute: 0, running: true, mode: 'normal', batterySoc: 1, nodeOffline: null, sensorFault: false, waterShift: false, recoveryStage: 2,
  selectedNode: 'P0', activePage: 'overview', cameraMode: 'aerial', circuitMode: 'assembly', circuitSelection: 'esp32',
  events: [event(0, 'info', 'SYSTEM', 'sim-start', 'เริ่มระบบจากสถานะจำลองปกติ', 'เลือกสถานการณ์เพื่อดูการตอบสนองของโหนด')],
  samples: [initialSample],
  environment: createEnvironmentState(), playbackSpeed: 1, runEpoch:0,
  setPage: activePage => set({ activePage }), setSelectedNode: selectedNode => set({ selectedNode }),
  setCameraMode: cameraMode => set({ cameraMode }), setCircuitMode: circuitMode => set({ circuitMode }), setCircuitSelection: circuitSelection => set({ circuitSelection }),
  toggleRunning: () => set(s => ({ running: !s.running })),
  setEnvironmentOptions: patch => {
    set(state => {
      const environment = activateEnvironment(state, patch);
      return { environment, samples: appendSnapshot(state, { environment }), events: [event(state.minute, 'info', 'P1', 'environment-options', 'ปรับพารามิเตอร์แบบจำลองน้ำ/อากาศสังเคราะห์', 'เปลี่ยนอินพุตโดยไม่เร่งเวลา ไม่ระบายแบตเตอรี่และไม่ผสมน้ำทันที; ต้องเล่นเวลาเพื่อให้สมการเปลี่ยนค่า'), ...state.events].slice(0, 80) };
    });
  },
  setEnvironmentView: patch => set(state => {
    const { inspectPoint, ...view } = patch;
    const point: [number, number] = inspectPoint ? [Math.min(1, Math.max(0, Number.isFinite(inspectPoint[0]) ? inspectPoint[0] : .5)), Math.min(1, Math.max(0, Number.isFinite(inspectPoint[1]) ? inspectPoint[1] : .5))] : state.environment.inspectPoint;
    return { environment: { ...state.environment, ...view, inspectPoint: point } };
  }),
  setEnvironmentPreset: preset => {
    set(state => {
      const environment = activateEnvironment(state, environmentPresetOptions(preset));
      const mode: GridMode = preset === 'storm' ? 'outage' : preset === 'calm' ? 'normal' : state.mode;
      const recoveryStage: RecoveryStage = preset === 'storm' || preset === 'calm' ? 2 : state.recoveryStage;
      const title = preset === 'storm' ? 'พายุจำลองพร้อมไฟหลักขัดข้อง' : preset === 'calm' ? 'คืนสภาพสงบและไฟหลักโดยคง SoC/ประวัติ' : preset === 'rain' ? 'ฝนมรสุมจำลอง: น้ำจืดเข้าสู่ระบบตามเวลา' : preset === 'low-tide' ? 'เลือกน้ำลงสังเคราะห์' : 'เลือกน้ำขึ้นสังเคราะห์';
      let events = state.events;
      if (mode !== state.mode) events = [event(state.minute, mode === 'outage' ? 'critical' : 'info', 'SYSTEM', `power-${mode}`, mode === 'outage' ? 'ไฟหลักดับจาก preset พายุจำลอง' : 'ไฟหลักกลับจาก preset สงบจำลอง', 'การเชื่อมสภาพอากาศกับไฟดับเป็นกติกาสถานการณ์นี้ ไม่ใช่ข้อสรุปจากฝนหรือข้อมูลภาคสนาม'), ...events];
      events = [event(state.minute, preset === 'storm' ? 'critical' : 'info', 'SYSTEM', `environment-${preset}`, title, 'ค่าทั้งหมดสังเคราะห์; ผสมน้ำเมื่อเวลาเดินเท่านั้น ไม่มี DO และไม่จำลองชาร์จแบตเตอรี่'), ...events].slice(0, 80);
      return { environment, mode, recoveryStage, samples: appendSnapshot(state, { environment, mode, recoveryStage }), events };
    });
  },
  setPlaybackSpeed: speed => {
    const permitted = [.5, 1, 2, 4];
    const finiteSpeed = Number.isFinite(speed) ? speed : 1;
    const playbackSpeed = permitted.reduce((closest, value) => Math.abs(value - finiteSpeed) < Math.abs(closest - finiteSpeed) ? value : closest, 1);
    if (playbackSpeed === get().playbackSpeed) return;
    set(state => ({ playbackSpeed, samples: appendSnapshot(state, {}), events: [event(state.minute, 'info', 'SYSTEM', 'playback-speed', `อัตราเวลาจำลอง ${playbackSpeed} นาทีต่อวินาทีจริง`, 'ใช้เวลาร่วมกันสำหรับพลังงาน น้ำ และกราฟ; การเปลี่ยนอัตราไม่ข้ามเวลาหรือระบายแบตเตอรี่ทันที'), ...state.events].slice(0, 80) }));
  },
  setMode: mode => {
    const s = get();
    if (s.mode === mode) return;
    const messages = {
      normal: ['ไฟฟ้าหลักกลับมาปกติ', 'ระบบกลับสู่ไฟหลัก; บันทึกเหตุการณ์ไว้ในประวัติ'],
      sag: ['แรงดันไฟจำลองลดลง', 'ตรวจสอบค่าที่แหล่งจ่ายและเทียบกับเกณฑ์จริงที่ทีมกำหนด'],
      outage: ['ไฟหลักจำลองขัดข้อง', 'ระบบใช้แบตเตอรี่จำลองและจัดลำดับโหลด P0 > P1 > P2 > P3'],
    } as const;
    const [message, action] = messages[mode];
    set(state => ({ mode, recoveryStage: 2, samples: appendSnapshot(state, { mode, recoveryStage: 2 }), events: [event(state.minute, mode === 'outage' ? 'critical' : mode === 'sag' ? 'warning' : 'info', 'SYSTEM', `power-${mode}`, message, action), ...state.events].slice(0, 80) }));
  },
  setScenario: scenario => {
    const s = get();
    if (scenario === 'normal') {
      set(state => ({ mode: 'normal', batterySoc: 1, nodeOffline: null, sensorFault: false, waterShift: false, recoveryStage: 2, running: true, samples: appendSnapshot(state, { mode: 'normal', batterySoc: 1, nodeOffline: null, sensorFault: false, waterShift: false, recoveryStage: 2 }), events: [event(state.minute, 'info', 'SYSTEM', 'reset-normal', 'คืนค่าระบบจำลองเป็นสถานะปกติ', 'ไม่มีการเชื่อมต่ออุปกรณ์จริง'), ...state.events].slice(0, 80) })); return;
    }
    if (scenario === 'sag') { get().setMode('sag'); return; }
    if (scenario === 'outage') { get().setMode('outage'); return; }
    if (scenario === 'extended-outage') {
      set(state => ({ mode: 'outage', recoveryStage: 2, samples: appendSnapshot(state, { mode: 'outage', recoveryStage: 2 }), events: [event(state.minute, 'critical', 'SYSTEM', 'extended-outage', 'จำลองไฟหลักดับต่อเนื่องโดยคงพลังงานสำรองปัจจุบัน', 'กดเล่นเวลาเพื่อดูแบตเตอรี่ลดตามโหลด; P2 จะตัดเมื่อ SoC ต่ำกว่าเกณฑ์สาธิต 28% โดยไม่เติมพลังงานใหม่'), ...state.events].slice(0, 80) }));
      return;
    }
    if (scenario === 'critical-battery') {
      set(state => ({ mode: 'outage', batterySoc: .07, recoveryStage: 2, samples: appendSnapshot(state, { mode: 'outage', batterySoc: .07, recoveryStage: 2 }), events: [event(state.minute, 'critical', 'SYSTEM', 'battery-critical', 'สำรองจำลองเหลือ 7%: P1/P2/P3 หยุด เหลือโหลด P0', '7% ต่ำกว่าขอบเขตสำรอง P1 ที่ 8% ในเดโม; ยังรักษา P0 จนพลังงานหมด ต้องกำหนดแผนตอบสนองและเวลาสำรองจริงกับผู้ใช้'), ...state.events].slice(0, 80) }));
      return;
    }
    if (scenario === 'water-change') {
      if (!s.waterShift) set(state => {
        const environment = state.environment.enabled ? recordEnvironment(perturbZoneA(state.environment), state.minute) : state.environment;
        return { waterShift: true, environment, samples: appendSnapshot(state, { waterShift: true, environment }), events: [event(state.minute, 'warning', 'P1', 'water-change', 'ป้อนเหตุจำลองความเค็ม −3.5 ppt และอุณหภูมิ +0.8°C', state.environment.enabled ? 'เปลี่ยนเกลือ/ความร้อนในกล่อง A ครั้งเดียวจากอินพุตสังเคราะห์ แล้วให้การผสมเดินตามเวลา; ไม่อนุมานจากสี ไม่สรุป DO หรือปลาตาย' : 'อินพุตสังเคราะห์ในเดโมเดิม; หากเปิดแบบจำลองน้ำจะป้อนเข้า A ครั้งเดียว ไม่อนุมานจากสี ไม่สรุป DO หรือปลาตาย'), ...state.events].slice(0, 80) };
      });
      return;
    }
    if (scenario === 'recovery') {
      set(state => ({ mode: 'normal', recoveryStage: 0, samples: appendSnapshot(state, { mode: 'normal', recoveryStage: 0 }), events: [event(state.minute, 'info', 'SYSTEM', 'recovery-start', 'ไฟหลักจำลองกลับมา: คืน P0/P1 ก่อน แล้ว P2 และ P3', 'คง SoC ประวัติและเหตุเซนเซอร์/การสื่อสาร; เมื่อเดินเวลาอีกสองรอบจะคืน P2 แล้ว P3 ตามลำดับสาธิต ไม่จำลองการชาร์จแบตเตอรี่'), ...state.events].slice(0, 80) }));
      return;
    }
    if (scenario === 'offline') {
      const target: NodeId = 'P2';
      if (s.nodeOffline !== target) set(state => ({ nodeOffline: target, samples: appendSnapshot(state, { nodeOffline: target }), events: [event(state.minute, 'warning', target, 'node-offline', 'P2 ไม่ส่งข้อมูลถึง P0 ตามรอบจำลอง', 'ตรวจไฟเลี้ยง/วิทยุ/ซอฟต์แวร์แยกกัน; สถานะนี้ไม่ยืนยันว่าไฟดับ'), ...state.events].slice(0, 80) }));
      return;
    }
    if (scenario === 'sensor-fault') {
      if (!s.sensorFault) set(state => ({ sensorFault: true, samples: appendSnapshot(state, { sensorFault: true }), events: [event(state.minute, 'warning', 'P1', 'sensor-fault', 'เซนเซอร์ความเค็มจำลองรายงานค่าผิดปกติ', 'ตรวจสาย/การปรับสัญญาณ/สอบเทียบ; ไม่ตีความเป็นเหตุฉุกเฉินทางน้ำ'), ...state.events].slice(0, 80) }));
      return;
    }
    if (scenario === 'low-battery') {
      set(state => ({ mode: 'outage', batterySoc: 0.34, recoveryStage: 2, samples: appendSnapshot(state, { mode: 'outage', batterySoc: 0.34, recoveryStage: 2 }), events: [event(state.minute, 'warning', 'SYSTEM', 'battery-low', 'พลังงานสำรองจำลองเหลือ 34%', 'P3 ถูกตัดก่อน; P2 จะหยุดเมื่อพลังงานต่ำกว่าเกณฑ์สาธิต 28%'), ...state.events].slice(0, 80) }));
    }
  },
  toggleOffline: id => {
    const s = get();
    if (id === 'P0') return;
    if (s.nodeOffline === id) {
      set(state => ({ nodeOffline: null, samples: appendSnapshot(state, { nodeOffline: null }), events: [event(state.minute, 'info', id, 'node-recovered', `${id} กลับมาส่งข้อมูลจำลอง`, 'ยืนยันลำดับข้อมูลและเวลารับล่าสุดจากอุปกรณ์จริงเมื่อเชื่อมต่อ'), ...state.events].slice(0, 80) }));
    } else {
      set(state => ({ nodeOffline: id, samples: appendSnapshot(state, { nodeOffline: id }), events: [event(state.minute, 'warning', id, 'node-offline', `${id} ไม่ส่งข้อมูลถึง P0 ตามรอบจำลอง`, 'ตรวจแหล่งจ่าย สัญญาณสื่อสาร และซอฟต์แวร์; อย่าสรุปว่าไฟดับจากสถานะออฟไลน์'), ...state.events].slice(0, 80) }));
    }
  },
  toggleSensorFault: () => {
    const s = get(), next = !s.sensorFault;
    set(state => ({ sensorFault: next, samples: appendSnapshot(state, { sensorFault: next }), events: [event(state.minute, next ? 'warning' : 'info', 'P1', next ? 'sensor-fault' : 'sensor-recovered', next ? 'อินพุตความเค็มถูกตั้งเป็น sensor fault จำลอง' : 'ล้างสถานะ sensor fault จำลอง', 'ตรวจสัญญาณและเทียบเครื่องอ้างอิง; เซนเซอร์ขัดข้องไม่เท่ากับคุณภาพน้ำวิกฤต'), ...state.events].slice(0, 80) }));
  },
  step: () => {
    const s = get();
    if (!s.running) return;
    const duration = s.playbackSpeed;
    const minute = s.minute + duration;
    const battery = batteryStep(s.batterySoc, s.mode, s.nodeOffline, duration, s.recoveryStage);
    const environment = advanceEnvironment(s.environment, minute, duration);
    const recoveryStage: RecoveryStage = s.mode === 'normal' && s.recoveryStage < 2 ? s.recoveryStage === 0 ? 1 : 2 : s.recoveryStage;
    const beforeP2 = activeLoad('P2', s.mode, s.batterySoc, s.nodeOffline, s.recoveryStage);
    const afterP2 = activeLoad('P2', s.mode, battery, s.nodeOffline, recoveryStage);
    const beforeP1 = activeLoad('P1', s.mode, s.batterySoc, s.nodeOffline, s.recoveryStage);
    const afterP1 = activeLoad('P1', s.mode, battery, s.nodeOffline, recoveryStage);
    let events = s.events;
    if (s.mode === 'outage' && beforeP2 && !afterP2) events = [event(minute, 'warning', 'P2', 'load-shed', 'ตัด P2 ตามเกณฑ์พลังงานสาธิต', 'ยืนยันความจุแบตเตอรี่ โหลดจริง และเกณฑ์สำรองก่อนใช้งาน'), ...events].slice(0, 80);
    if (s.mode === 'outage' && beforeP1 && !afterP1) events = [event(minute, 'critical', 'P1', 'battery-critical', 'พลังงานผ่านขอบเขตสาธิต 8%: หยุด P1 คง P0', 'โหลดวิกฤต P1 ไม่สามารถรักษาต่อด้วยสำรองในโมเดลนี้ ต้องมีผู้รับเหตุและแผนฉุกเฉินที่ยืนยันจริง'), ...events].slice(0, 80);
    if (s.mode === 'outage' && battery === 0 && s.batterySoc > 0) events = [event(minute, 'critical', 'SYSTEM', 'battery-depleted', 'แบตเตอรี่จำลองหมดพลังงาน', 'พลังงานสำรองในระบบจริงต้องคำนวณจากโหลดและข้อมูลแบตเตอรี่จริง'), ...events].slice(0, 80);
    if (recoveryStage !== s.recoveryStage) events = [event(minute, 'info', recoveryStage === 1 ? 'P2' : 'P3', recoveryStage === 1 ? 'recovery-p2' : 'recovery-p3', recoveryStage === 1 ? 'คืนโหลด P2 หลังเดินเวลาฟื้นระบบหนึ่งรอบ' : 'คืนโหลด P3: จบลำดับฟื้นระบบจำลอง', 'ช่วงรอหนึ่งรอบเป็นกติกาเดโม ไม่ใช่เกณฑ์จริง; ต้องยืนยันแรงดัน โหลดและเงื่อนไขการคืนไฟก่อนใช้งาน'), ...events].slice(0, 80);
    const sample = stateSample({ ...s, minute, batterySoc: battery, recoveryStage, environment });
    set({ minute, batterySoc: battery, recoveryStage, environment, events, samples: [...s.samples.slice(-39), sample] });
  },
  reset: () => { eventSequence = 0; set({ runEpoch:get().runEpoch+1, minute: 0, running: true, mode: 'normal', batterySoc: 1, nodeOffline: null, sensorFault: false, waterShift: false, recoveryStage: 2, environment: createEnvironmentState(), playbackSpeed: 1, selectedNode: 'P0', events: [event(0, 'info', 'SYSTEM', 'sim-start', 'รีเซ็ตสถานการณ์จำลอง', 'สถานะตั้งต้นถูกสร้างซ้ำได้; ไม่ใช่ข้อมูลฮาร์ดแวร์จริง')], samples: [initialSample] }); },
}));

export function getPowerVoltage(mode: GridMode, minute: number) { return gridVoltage(mode, minute); }
