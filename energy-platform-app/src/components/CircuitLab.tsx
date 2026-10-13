'use client';

import { Html, Line, OrbitControls, Text } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { COMPONENTS, type GridMode } from '@/lib/model';

export const CIRCUIT_MODES = [
  ['assembly', '3D Assembly'], ['schematic', '2D Schematic'], ['power', 'Power Flow'], ['signal', 'Signal Flow'], ['exploded', 'Exploded View'],
] as const;

const nodes = [
  { id: 'source', name: 'DC INPUT', x: 45, y: 160, w: 104, h: 56, pins: ['12V+', 'GND'] },
  { id: 'fuse', name: 'F1 · FUSE', x: 205, y: 160, w: 102, h: 56, pins: ['IN', 'OUT'] },
  { id: 'bus', name: '12V BUS', x: 370, y: 160, w: 104, h: 56, pins: ['BUS+', 'GND'] },
  { id: 'buck', name: 'DC-DC', x: 545, y: 76, w: 105, h: 56, pins: ['12V', '5V/3V3'] },
  { id: 'esp32', name: 'P0 · ESP32', x: 711, y: 76, w: 118, h: 56, pins: ['3V3', 'GPIO', 'RADIO'] },
  { id: 'battery', name: 'BATTERY', x: 365, y: 292, w: 112, h: 56, pins: ['BAT+', 'BAT−'] },
  { id: 'charger', name: 'CHARGER / BMS', x: 203, y: 292, w: 124, h: 56, pins: ['BAT', 'LOAD'] },
  { id: 'sense', name: 'V/I SENSE', x: 545, y: 220, w: 112, h: 56, pins: ['SHUNT', 'I²C'] },
  { id: 'driver', name: 'DRIVER + SWITCH', x: 711, y: 220, w: 118, h: 56, pins: ['GPIO → EN', 'LOAD'] },
  { id: 'salinity', name: 'EC INTERFACE', x: 545, y: 344, w: 112, h: 56, pins: ['PROBE', 'ADC*'] },
  { id: 'temp', name: 'TEMP PROBE', x: 711, y: 344, w: 118, h: 56, pins: ['PROBE', 'BUS*'] },
];
const wires = [
  { id: 'source-fuse', fromNode: 'source', toNode: 'fuse', from: [149, 181], to: [205, 181], net: '12V_DC', kind: 'power' },
  { id: 'fuse-bus', fromNode: 'fuse', toNode: 'bus', from: [307, 181], to: [370, 181], net: 'FUSED_12V', kind: 'power' },
  { id: 'bus-buck', fromNode: 'bus', toNode: 'buck', from: [474, 174], to: [545, 104], net: 'FUSED_12V', kind: 'power' },
  { id: 'buck-p0', fromNode: 'buck', toNode: 'esp32', from: [650, 104], to: [711, 104], net: 'REG_3V3 / 5V', kind: 'power' },
  { id: 'charger-bus', fromNode: 'charger', toNode: 'bus', from: [327, 321], to: [392, 216], net: 'BACKUP_12V*', kind: 'power' },
  { id: 'battery-charger', fromNode: 'battery', toNode: 'charger', from: [365, 321], to: [327, 321], net: 'BATTERY*', kind: 'power' },
  { id: 'bus-sense', fromNode: 'bus', toNode: 'sense', from: [422, 216], to: [545, 249], net: 'V/I MEASURE', kind: 'power' },
  { id: 'sense-p0', fromNode: 'sense', toNode: 'esp32', from: [657, 249], to: [742, 132], net: 'I²C*', kind: 'signal' },
  { id: 'p0-driver', fromNode: 'esp32', toNode: 'driver', from: [770, 132], to: [770, 220], net: 'GPIO → DRIVER', kind: 'signal' },
  { id: 'ec-p0', fromNode: 'salinity', toNode: 'esp32', from: [657, 372], to: [711, 104], net: 'SALINITY*', kind: 'signal' },
  { id: 'temp-p0', fromNode: 'temp', toNode: 'esp32', from: [711, 372], to: [770, 132], net: 'TEMPERATURE*', kind: 'signal' },
];

function CircuitScene({ mode, selected, select }: { mode: string; selected: string; select: (id: string) => void }) {
  const spacing = mode === 'exploded' ? 1.35 : 1;
  const positions = useMemo(() => nodes.map(n => ({ ...n, p: [((n.x + n.w / 2) / 880 - .5) * 11 * spacing, .2, ((n.y + n.h / 2) / 440 - .5) * 6.5 * spacing] as [number, number, number] })), [spacing]);
  const positionById = new Map(positions.map(n => [n.id, n.p]));
  return <Canvas shadows dpr={[.7, 1.2]} camera={{ position: [7, 7, 9], fov: 44 }}>
    <color attach="background" args={['#e7eeec']} /><ambientLight intensity={1.4} /><directionalLight position={[7, 9, 5]} intensity={1.8} castShadow />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.18, 0]} receiveShadow><planeGeometry args={[16, 12]} /><meshStandardMaterial color="#d8e2de" /></mesh>
    {positions.map((n, i) => <group key={n.id} position={n.p} onClick={e => { e.stopPropagation(); select(n.id); }}>
      <mesh castShadow><boxGeometry args={[1.38, .22, .86]} /><meshStandardMaterial color={n.id === selected ? '#3e8e7f' : i % 3 === 0 ? '#334f59' : '#607b7c'} metalness={.24} roughness={.48} /></mesh>
      <mesh position={[0, .13, 0]}><boxGeometry args={[.84, .04, .4]} /><meshStandardMaterial color="#aebbb1" metalness={.32} /></mesh>
      {[-.43, .43].map(x => <mesh key={x} position={[x, .14, .27]}><cylinderGeometry args={[.025, .025, .06, 8]} /><meshStandardMaterial color="#e4b756" metalness={.55} /></mesh>)}
      <Html distanceFactor={10} position={[0, .46, 0]} center><button className={`scene-node-tag ${n.id === selected ? 'selected' : ''}`} onClick={e => { e.stopPropagation(); select(n.id); }}>{n.name}<small>{n.id.toUpperCase()}</small></button></Html>
    </group>)}
    {wires.map(w => { const from = positionById.get(w.fromNode), to = positionById.get(w.toNode); return from && to ? <Line key={w.id} points={[[from[0], .02, from[2]], [to[0], .02, to[2]]]} color={w.kind === 'signal' ? '#508b83' : '#d19b48'} lineWidth={w.kind === 'signal' ? 1 : 1.8} dashed={w.kind === 'signal'} /> : null; })}
    <Text position={[0, -.05, -4]} fontSize={.25} color="#66797b" anchorX="center">REFERENCE LOW-VOLTAGE CIRCUIT · NOT BUILD-READY</Text>
    <OrbitControls makeDefault enableDamping minDistance={5} maxDistance={18} />
  </Canvas>;
}

export default function CircuitLab({ mode, selection, select, systemMode, nodeOffline }: { mode: string; selection: string; select: (id: string) => void; systemMode: GridMode; nodeOffline: string | null }) {
  if (mode === 'assembly' || mode === 'exploded') return <div className="circuit-3d"><CircuitScene mode={mode} selected={selection} select={select} /><div className="circuit-scene-overlay">{mode === 'exploded' ? 'Exploded reference assembly · spacing increased' : '3D component relationship · illustrative model'}</div></div>;
  const powerActive = systemMode !== 'outage';
  return <div className="schematic-wrap"><svg viewBox="0 0 880 440" role="img" aria-label="แผนผังวงจรแรงดันต่ำจำลอง: แหล่งจ่าย ฟิวส์ บัส แบตเตอรี่ ตัวควบคุม เซนเซอร์ และ load driver">
    <defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="#527c76" /></marker></defs>
    {wires.map(w => {
      const signal = w.kind === 'signal';
      const modeVisible = mode === 'power' ? !signal : mode === 'signal' ? signal : true;
      const active = modeVisible && (signal ? nodeOffline !== 'P0' : powerActive || w.net.includes('BATTERY') || w.net.includes('BACKUP'));
      return <g key={w.id} opacity={modeVisible ? 1 : .12}>
        <path d={`M${w.from[0]},${w.from[1]} L${w.to[0]},${w.to[1]}`} fill="none" stroke={active ? signal ? '#508b83' : '#d19b48' : '#b8c0bb'} strokeWidth={signal ? 2 : 3} strokeDasharray={signal ? '6 5' : undefined} markerEnd="url(#arrow)" />
        <text x={(w.from[0] + w.to[0]) / 2} y={(w.from[1] + w.to[1]) / 2 - 6} className="wire-label">{w.net}</text>
      </g>;
    })}
    {nodes.map(n => {
      const component = COMPONENTS.find(c => c.id === n.id);
      if (!component && n.id !== 'bus') return null;
      const selected = selection === n.id;
      return <g key={n.id} role="button" tabIndex={0} aria-label={`เลือก ${n.name}`} onClick={() => select(n.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') select(n.id); }} className="svg-component">
        <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="8" fill={selected ? '#dff0eb' : '#fff'} stroke={selected ? '#438f80' : '#cedbd6'} strokeWidth={selected ? 2 : 1} />
        <text x={n.x + n.w / 2} y={n.y + 21} textAnchor="middle" className="component-label">{n.name}</text>
        <text x={n.x + n.w / 2} y={n.y + 40} textAnchor="middle" className="component-pin">{n.pins.join(' · ')}</text>
      </g>;
    })}
    <text x="34" y="30" className="schematic-caption">CONCEPT ONLY · PINS, RATINGS, ISOLATION AND CHARGER MODEL REQUIRE ENGINEERING REVIEW</text>
    <text x="690" y="421" className="schematic-caption">* EXAMPLE SIGNAL / PATH NOT HARDWARE VERIFIED</text>
  </svg></div>;
}
