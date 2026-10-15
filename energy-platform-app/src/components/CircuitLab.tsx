'use client';

import { Environment, OrbitControls, RoundedBox } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode, type ComponentRef } from 'react';
import * as THREE from 'three';
import { activeLoad, COMPONENTS, type GridMode } from '@/lib/model';
import { BASE_PATH } from '@/lib/urls';
import { useSimulator } from '@/store/simulator';
import { CircuitEquipment } from './circuit/Equipment';
import { SpatialHtml as Html } from './three/SpatialHtml';
import { CIRCUIT_NODES, CIRCUIT_NETS, assemblyPosition, netIsActive, type CircuitNet, type CircuitNode } from './circuit/graph';

export { CIRCUIT_MODES } from '@/lib/view-modes';

const TEAL = '#67dcc6', AMBER = '#eebd76';
type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;
const pointById = new Map(CIRCUIT_NODES.map(node => [node.id, node]));
const liftById = new Map(CIRCUIT_NODES.map(node => [node.id, node.lift]));
const socketHeight: Record<string, number> = { source: .37, fuse: .42, bus: .29, buck: .22, esp32: .22, battery: .25, battery2: .25, p1battery: .25, charger: .22, sense: .22, driver: .22, salinity: .17, temp: .17 };

function useDisplaySettings() {
  const [settings, setSettings] = useState({ compact: false, reducedMotion: false });
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 760px)'), motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSettings({ compact: mobile.matches, reducedMotion: motion.matches });
    update(); mobile.addEventListener('change', update); motion.addEventListener('change', update);
    return () => { mobile.removeEventListener('change', update); motion.removeEventListener('change', update); };
  }, []);
  return settings;
}

function usePrintedLabel(text: string) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 128;
    const c = canvas.getContext('2d');
    if (c) { c.fillStyle = '#102332'; c.fillRect(0, 0, 1024, 128); c.fillStyle = '#c5d8da'; c.font = '600 30px monospace'; c.fillText(text, 30, 57); c.fillStyle = '#67dcc6'; c.font = '18px monospace'; c.fillText('REFERENCE PANEL · LOW VOLTAGE · NO HARDWARE CONNECTION', 30, 98); }
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function ControllerPanel() {
  const print = usePrintedLabel('SALA-HUM / SEPARATE P0 AND P1 BOXES / PARTIAL SOURCE');
  return <group>
    {[-.55,4.1].map((x,i)=><group key={i} position={[x,-.08,.15]}><RoundedBox args={[i===0?6.1:2.5,.2,6.4]} radius={.08} smoothness={2}><meshStandardMaterial color="#274b5b" metalness={.4} roughness={.5}/></RoundedBox>{[-3.2,3.2].map(z=><mesh key={z} position={[0,.23,z]}><boxGeometry args={[i===0?6.1:2.5,.3,.055]}/><meshStandardMaterial color="#718f9a"/></mesh>)}</group>)}
    <RoundedBox args={[11.4, .19, 6.9]} position={[0, -.15, 0]} radius={.08} smoothness={2} receiveShadow><meshStandardMaterial color="#223948" metalness={.78} roughness={.43} /></RoundedBox>
    <RoundedBox args={[11.65, .06, 7.15]} position={[0, -.27, 0]} radius={.05} smoothness={2}><meshStandardMaterial color="#536b76" metalness={.85} roughness={.27} /></RoundedBox>
    {[-1.9, .1, 2.2].map(z => <group key={z} position={[0, -.022, z]}>
      <mesh receiveShadow><boxGeometry args={[10.65, .022, .19]} /><meshStandardMaterial color="#7a8e9a" metalness={.9} roughness={.28} /></mesh>
      {[-.1, .1].map(dz => <mesh key={dz} position={[0, .026, dz]}><boxGeometry args={[10.65, .06, .027]} /><meshStandardMaterial color="#a7b9c2" metalness={.94} roughness={.25} /></mesh>)}
      {[-4.7, 4.7].map(x => <mesh key={x} position={[x, .02, 0]}><cylinderGeometry args={[.07, .07, .025, 12]} /><meshStandardMaterial color="#bdc9d1" metalness={.95} roughness={.3} /></mesh>)}
    </group>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.046, -3.1]}><planeGeometry args={[6.8, .69]} /><meshStandardMaterial map={print} roughness={.66} /></mesh>
    {[-1, 1].flatMap(x => [-1, 1].map(z => <mesh key={`${x}-${z}`} position={[x * 5.35, -.03, z * 3.15]}><cylinderGeometry args={[.065, .065, .035, 12]} /><meshStandardMaterial color="#94a7b3" metalness={.9} roughness={.27} /></mesh>))}
  </group>;
}

function MountedEquipment({ node, progress, selected, select, lit, online, setHover, hovered, fault }: { node: CircuitNode; progress: React.RefObject<number>; selected: string; select: (id: string) => void; lit: boolean; online: boolean; setHover: (id: string | null) => void; hovered: boolean; fault: boolean }) {
  const ref = useRef<THREE.Group>(null), base = useMemo(() => assemblyPosition(node), [node]);
  useFrame(() => {
    if (!ref.current) return;
    const p = progress.current;
    ref.current.position.set(base[0] * (1 + p * .17), base[1] + p * node.lift, base[2] * (1 + p * .17));
  });
  const isSelected = selected === node.id;
  const detailVisible = isSelected || hovered;
  return <group ref={ref} position={base} onClick={e => { if (e.delta > 6) return; e.stopPropagation(); select(node.id); }} onPointerOver={e => { e.stopPropagation(); setHover(node.id); }} onPointerOut={() => setHover(null)}>
    <CircuitEquipment id={node.id} lit={lit && node.group !== "P1"} dataOnline={online && node.group !== "P1"} />
    {isSelected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.025, 0]}><ringGeometry args={[.72, .741, 48]} /><meshBasicMaterial color={TEAL} transparent opacity={.9} side={THREE.DoubleSide} /></mesh>}
    <Html position={[0, node.id === 'battery' ? 1.04 : .67, 0]} center distanceFactor={11} zIndexRange={[10, 0]}><button className={`scene-node-tag circuit-equipment-tag ${isSelected ? 'selected' : ''}`} onClick={e => { e.stopPropagation(); select(node.id); }} aria-label={`ดูรายละเอียด ${node.name}`} style={{ background: isSelected ? '#153f41ee' : '#0b1823e8', borderColor: fault ? AMBER : isSelected ? TEAL : '#4c6c7c', boxShadow: '0 4px 16px #030b1370', padding: '8px 10px', minHeight: 44, fontSize: 11, borderRadius: 5 }}>{detailVisible ? node.name : node.name}{detailVisible && <small style={{ color: online && !fault ? '#91b9b7' : AMBER, fontSize: 10, marginTop: 3 }}>{node.group === 'P1' ? 'ยังไม่จำลอง UPS แยก P1' : `ไฟตามนโยบายเดโม ${lit ? 'จ่าย' : 'หยุด'} · ยังไม่ใช่การวัดจริง`}</small>}</button></Html>
  </group>;
}

function netEndpoint(nodeId: string, point: [number, number]): THREE.Vector3 {
  const node = pointById.get(nodeId)!;
  const base = assemblyPosition(node);
  return new THREE.Vector3(base[0] + (point[0] - (node.x + node.w / 2)) / node.w * .9, base[1] + (socketHeight[nodeId] ?? .22), base[2] + (point[1] - (node.y + node.h / 2)) / node.h * .55);
}

function PhysicalNet({ net, progress, active, reducedMotion, fault = false }: { net: CircuitNet; progress: React.RefObject<number>; active: boolean; reducedMotion: boolean; fault?: boolean }) {
  const bead = useRef<THREE.Mesh>(null), previous = useRef(-1), point = useMemo(() => new THREE.Vector3(), []);
  const fromLift = liftById.get(net.fromNode) ?? 0, toLift = liftById.get(net.toNode) ?? 0;
  const { curve, geometry, original } = useMemo(() => {
    const a = netEndpoint(net.fromNode, net.from), b = netEndpoint(net.toNode, net.to);
    const midA = a.clone(), midB = b.clone(); midA.y += .13; midB.y += .13;
    midA.x += (b.x - a.x) * .25; midB.x -= (b.x - a.x) * .25;
    const c = new THREE.CatmullRomCurve3([a, midA, midB, b]);
    const g = new THREE.TubeGeometry(c, 24, net.kind === 'signal' ? .012 : .02, 6, false);
    return { curve: c, geometry: g, original: Float32Array.from(g.getAttribute('position').array) };
  }, [net]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    const p = progress.current;
    if (Math.abs(previous.current - p) > .0001) {
      const attr = geometry.getAttribute('position');
      for (let i = 0; i < attr.count; i++) {
        const t = Math.floor(i / 7) / 24;
        attr.setXYZ(i, original[i * 3] * (1 + p * .17), original[i * 3 + 1] + p * (fromLift + (toLift - fromLift) * t), original[i * 3 + 2] * (1 + p * .17));
      }
      attr.needsUpdate = true; geometry.computeVertexNormals(); previous.current = p;
    }
    if (bead.current && active) {
      const t = reducedMotion ? .45 : (clock.elapsedTime * .22 + net.id.length * .073) % 1;
      curve.getPoint(t, point);
      bead.current.position.set(point.x * (1 + p * .17), point.y + p * (fromLift + (toLift - fromLift) * t), point.z * (1 + p * .17));
    }
  });
  const color = fault ? AMBER : net.kind === 'signal' ? TEAL : net.kind === 'ground' ? '#6687a3' : net.path === 'backup' ? '#f2cb79' : '#c78661';
  return <group><mesh geometry={geometry} castShadow><meshStandardMaterial color={active ? color : '#364959'} metalness={.1} roughness={.48} emissive={active ? color : '#000000'} emissiveIntensity={net.kind === 'signal' && active ? .14 : 0} /></mesh>
    {active && net.kind !== 'ground' && <mesh ref={bead}><sphereGeometry args={[net.kind === 'signal' ? .03 : .04, 8, 8]} /><meshBasicMaterial color={net.kind === 'signal' && !fault ? '#bbfff0' : '#ffe4a9'} toneMapped={false} /></mesh>}
  </group>;
}

function AssemblyMotion({ mode, progress, reducedMotion }: { mode: string; progress: React.RefObject<number>; reducedMotion: boolean }) {
  useFrame((_, dt) => { progress.current = reducedMotion ? mode === 'exploded' ? 1 : 0 : THREE.MathUtils.damp(progress.current, mode === 'exploded' ? 1 : 0, 4.5, Math.min(dt, .1)); });
  return null;
}

function CameraFocus({ selected, exploded, compact, reducedMotion, controls }: { selected: string; exploded: boolean; compact: boolean; reducedMotion: boolean; controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3()), desired = useRef(new THREE.Vector3()), moving = useRef(false), mounted = useRef(false);
  useEffect(() => {
    const node = pointById.get(selected); if (!node) return;
    if (!mounted.current) { mounted.current = true; return; }
    const p = assemblyPosition(node, exploded ? 1 : 0);
    // A portrait stage needs the complete panel centred; offsetting toward a
    // selected edge component can clip its tooltip and the opposite rail.
    target.current.set(compact ? 0 : p[0] * .35, exploded ? .9 : .1, compact ? 0 : p[2] * .35);
    const distance = compact ? exploded ? 23 : 20 : 10.2;
    desired.current.set(target.current.x + distance * .63, compact ? exploded ? 18.5 : 16 : exploded ? 11.5 : 9.5, target.current.z + distance * .8);
    moving.current = true;
  }, [selected, exploded, compact]);
  useEffect(() => { const control = controls.current; const stop = () => { moving.current = false; }; control?.addEventListener('start', stop); return () => control?.removeEventListener('start', stop); }, [controls]);
  useFrame((_, dt) => {
    if (!moving.current || !controls.current) return;
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-4 * dt);
    camera.position.lerp(desired.current, alpha); controls.current.target.lerp(target.current, alpha); controls.current.update();
    if (camera.position.distanceToSquared(desired.current) < .0005) moving.current = false;
  });
  return null;
}

function CircuitScene({ mode, selected, select, systemMode, nodeOffline, batterySoc, sensorFault, compact, reducedMotion }: { mode: string; selected: string; select: (id: string) => void; systemMode: GridMode; nodeOffline: string | null; batterySoc: number; sensorFault: boolean; compact: boolean; reducedMotion: boolean }) {
  const progress = useRef(0), controls = useRef<OrbitControlsImpl>(null), [hover, setHover] = useState<string | null>(null);
  const outage = systemMode === 'outage', backup = batterySoc > 0, busPowered = !outage || backup, loadPowered = activeLoad('P1', systemMode, batterySoc, null);
  return <Canvas shadows dpr={compact ? [1, 1] : [1, 1.5]} camera={{ position: compact ? [12, 16, 18] : [8, 9.5, 10.5], fov: compact ? 47 : 43, near: .1, far: 100 }} style={{ cursor: hover ? 'pointer' : 'grab' }} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.12; gl.outputColorSpace = THREE.SRGBColorSpace; }} fallback={<div style={{ padding: 30, color: '#e5edf1' }}>อุปกรณ์นี้เปิด WebGL ไม่ได้ · ใช้แท็บ ผังวงจรสองมิติ เพื่อดูวงจรและเลือกอุปกรณ์</div>}>
    <color attach="background" args={['#0a1622']} />
    <ambientLight intensity={.27} /><hemisphereLight args={['#aecbd7', '#142331', .65]} />
    <directionalLight position={[4, 10, 7]} intensity={2.5} color="#f5e5d4" castShadow shadow-mapSize-width={compact ? 512 : 1024} shadow-mapSize-height={compact ? 512 : 1024} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-camera-far={30} shadow-bias={-.0003} shadow-normalBias={.04} />
    <directionalLight position={[-6, 4, -5]} intensity={1.4} color="#83b7c7" />
    <Suspense fallback={null}><Environment files={`${BASE_PATH}/assets/sky/kloppenheim_06_puresky_1k.hdr`} environmentIntensity={.55} /></Suspense>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.36, 0]} receiveShadow><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#08141f" roughness={.58} metalness={.14} /></mesh>
    <ControllerPanel /><AssemblyMotion mode={mode} progress={progress} reducedMotion={reducedMotion} />
    {CIRCUIT_NETS.map(net => <PhysicalNet key={net.id} net={net} progress={progress} active={netIsActive(net, outage, backup, nodeOffline, loadPowered)} fault={sensorFault && net.id === 'ec-p0'} reducedMotion={reducedMotion} />)}
    {CIRCUIT_NODES.map(node => <MountedEquipment key={node.id} node={node} progress={progress} selected={selected} select={select} setHover={setHover} hovered={hover === node.id} lit={node.id === 'solar' ? false : node.id === 'source' || node.id === 'bus' ? !outage : node.id === 'battery' || node.id === 'battery2' ? backup : node.id === 'driver' ? loadPowered : busPowered} online={node.id === 'salinity' || node.id === 'temp' ? nodeOffline !== 'P0' && nodeOffline !== 'P1' : nodeOffline !== 'P0'} fault={sensorFault && node.id === 'salinity'} />)}
    <CameraFocus selected={selected} exploded={mode === 'exploded'} compact={compact} reducedMotion={reducedMotion} controls={controls} />
    <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.075} target={[0, .3, 0]} minDistance={4.8} maxDistance={compact ? 38 : 24} minPolarAngle={.15} maxPolarAngle={Math.PI / 2 - .06} />
    {!compact && <EffectComposer multisampling={0}><Bloom intensity={.23} luminanceThreshold={1.1} mipmapBlur /><Vignette offset={.18} darkness={.42} /></EffectComposer>}
  </Canvas>;
}

function Schematic({ mode, selection, select, systemMode, nodeOffline, batterySoc, sensorFault }: { mode: string; selection: string; select: (id: string) => void; systemMode: GridMode; nodeOffline: string | null; batterySoc: number; sensorFault: boolean }) {
  const outage = systemMode === 'outage';
  return <div className="schematic-wrap" style={{ background: '#0a1622' }}><svg viewBox="0 0 1000 520" role="img" aria-label="ผังต้นแบบล่าสุด P0 พร้อมลูกศรตามที่ได้รับ และ P1 กล่องแยกที่ยังไม่มีลูกศรยืนยัน">
    <defs><pattern id="circuit-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a3140" strokeWidth=".45" /></pattern><marker id="circuit-arrow-power" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill={AMBER} /></marker><marker id="circuit-arrow-data" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill={TEAL} /></marker></defs>
    <rect width="1000" height="520" fill="url(#circuit-grid)" />
    <text x="36" y="24" fill="#9ab2bd" fontSize="9" letterSpacing="1.2">ผังผู้ใช้ 15 ต.ค. 2569 / P0 ตามลูกศร / P1 ยังไม่ครบ</text>
    <rect x="178" y="40" width="553" height="448" rx="12" fill="#102a36" stroke="#41667b"/><text x="190" y="59" fill="#b9d4dd" fontSize="10">P0 · MASTER POWER NODE · WATERPROOF BOX</text>
    <rect x="751" y="40" width="238" height="448" rx="12" fill="#142536" stroke="#628395" strokeDasharray="5 4"/><text x="765" y="59" fill="#eebd76" fontSize="10">P1 · WATER QUALITY · PARTIAL</text>
    {mode === 'signal' && <text x="20" y="510" fill="#67dcc6" fontSize="9">ยังไม่ได้รับลูกศรสัญญาณ / transport ระหว่างโหนด จึงไม่วาดเส้นขึ้นเอง</text>}
    {CIRCUIT_NETS.map(net => {
      const signal = net.kind === 'signal', ground = net.kind === 'ground';
      const visible = mode === 'power' ? !signal : mode === 'signal' ? signal : true;
      const active = netIsActive(net, outage, batterySoc > 0, nodeOffline, activeLoad('P1', systemMode, batterySoc, null));
      const x1 = net.from[0], y1 = net.from[1], x2 = net.to[0], y2 = net.to[1];
      const bend = net.id === 'ec-p0' ? 964 : net.id === 'temp-p0' ? 977 : net.id === 'common-return' ? 290 : (x1 + x2) / 2;
      const path = net.id === 'common-return' ? `M${x1},${y1} V${bend} H${x2} V${y2}` : net.id === 'ec-p0' || net.id === 'temp-p0' ? `M${x1},${y1} H${bend} V${y2} H${x2}` : x1 === x2 || y1 === y2 ? `M${x1},${y1} L${x2},${y2}` : `M${x1},${y1} H${bend} V${y2} H${x2}`;
      const labelX = net.id === 'ec-p0' || net.id === 'temp-p0' ? bend - 5 : net.id === 'common-return' ? 657 : (x1 + x2) / 2;
      const labelY = net.id === 'common-return' ? 283 : net.id === 'ec-p0' ? 342 : net.id === 'temp-p0' ? 310 : (y1 + y2) / 2 - 8;
      const color = active ? sensorFault && net.id === 'ec-p0' ? AMBER : signal ? TEAL : ground ? '#7295b2' : AMBER : '#516777';
      return <g key={net.id} opacity={visible ? 1 : .13}><path d={path} fill="none" stroke={color} strokeWidth={signal ? 1.7 : ground ? 2 : 2.5} strokeDasharray={signal ? '5 5' : undefined} strokeLinejoin="round" markerEnd={!ground ? `url(#circuit-arrow-${signal ? 'data' : 'power'})` : undefined} /><text x={labelX} y={labelY} textAnchor={net.id === 'ec-p0' || net.id === 'temp-p0' ? 'end' : 'middle'} fill={visible ? color : '#3b5261'} fontSize="7.5" style={{ paintOrder: 'stroke', stroke: '#0a1622', strokeWidth: 4, strokeLinejoin: 'round' }}>{net.net}</text></g>;
    })}
    {CIRCUIT_NODES.map(node => {
      const selected = selection === node.id, component = COMPONENTS.find(c => c.id === node.id);
      return <g key={node.id} role="button" tabIndex={0} aria-label={`เลือก ${node.name}`} aria-pressed={selected} onClick={() => select(node.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(node.id); } }} className="svg-component">
        <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="7" fill={selected ? '#153d40' : '#122838'} stroke={selected ? TEAL : '#365362'} strokeWidth={selected ? 1.7 : 1} />
        <rect x={node.x + 10} y={node.y + 11} width="3" height="10" rx="1" fill={component?.category === 'Sensing' || node.id === 'esp32' ? TEAL : AMBER} />
        <text x={node.x + 20} y={node.y + 21} fill="#e5edf1" fontSize="9.5" fontWeight="700">{node.name}</text>
        <text x={node.x + 12} y={node.y + 40} fill="#a4bec5" fontSize="8">{node.pins.join(' · ')}</text>
        <text x={node.x + 12} y={node.y + 52} fill="#7897a7" fontSize="6.5">{node.id === 'bus' ? 'MULTI-SOURCE / RATING TBD' : component?.status === 'simulated' ? 'SIMULATED REFERENCE' : 'DEVICE / RATING TO CONFIRM'}</text>
      </g>;
    })}
    {mode !== 'signal' && <text x="20" y="510" fill="#b3c9d2" fontSize="8">ลูกศรเป็นผังแนวคิด ไม่ระบุ pin / voltage / cell arrangement · EC และส่วน P1–P3 รอข้อมูลต่อ</text>}
  </svg></div>;
}

class CircuitBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function CircuitLab({ mode, selection, select, systemMode, nodeOffline }: { mode: string; selection: string; select: (id: string) => void; systemMode: GridMode; nodeOffline: string | null }) {
  const batterySoc = useSimulator(s => s.batterySoc), sensorFault = useSimulator(s => s.sensorFault);
  const { compact, reducedMotion } = useDisplaySettings();
  const schematic = <Schematic mode={mode === 'assembly' || mode === 'exploded' ? 'schematic' : mode} selection={selection} select={select} systemMode={systemMode} nodeOffline={nodeOffline} batterySoc={batterySoc} sensorFault={sensorFault} />;
  if (mode !== 'assembly' && mode !== 'exploded') return schematic;
  return <div className="circuit-3d" style={{ background: '#0a1622' }}>
    <CircuitBoundary fallback={schematic}><CircuitScene mode={mode} selected={selection} select={select} systemMode={systemMode} nodeOffline={nodeOffline} batterySoc={batterySoc} sensorFault={sensorFault} compact={compact} reducedMotion={reducedMotion} /></CircuitBoundary>
    <div className="circuit-scene-overlay" style={{ background: '#0a1622dd', border: '1px solid #355263', color: '#c2d4dc', padding: '8px 11px', fontSize: 10, maxWidth: 'calc(100% - 20px)' }}><span style={{ color: TEAL }}>{mode === 'exploded' ? 'EXPLODED ASSEMBLY' : 'P0 / P1 REFERENCE BOXES'}</span> · {mode === 'exploded' ? 'เคลื่อนชิ้นส่วนเพื่ออ่านความสัมพันธ์' : 'หมุน / ซูม / เลือกอุปกรณ์'}<small style={{ display: 'block', marginTop: 4, color: '#8ba8b8', fontSize: 9 }}>แยกกล่อง P0 / P1 ตามแบบ · P1 ไม่มีสายยืนยัน · รูปทรงโมดูลเป็นภาพอธิบาย ไม่ใช่อุปกรณ์ที่เลือกแล้ว</small></div>
    <div style={{ position: 'absolute', top: 12, left: 12, pointerEvents: 'none', display: 'flex', gap: 7, fontSize: 9, color: '#b9cdd3' }}><span style={{ padding: '5px 7px', background: '#0a1622dd', border: '1px solid #2e4d5d', borderRadius: 4 }}><i style={{ color: AMBER }}>●</i> Power path</span><span style={{ padding: '5px 7px', background: '#0a1622dd', border: '1px solid #2e4d5d', borderRadius: 4 }}><i style={{ color: TEAL }}>●</i> Data / control</span></div>
  </div>;
}
