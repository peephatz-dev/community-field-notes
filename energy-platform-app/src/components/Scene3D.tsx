'use client';

import { Html, Line, OrbitControls, Text } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { NODE_DEFINITIONS, activeLoad, type GridMode, type NodeId } from '@/lib/model';

type SceneProps = { mode: GridMode; batterySoc: number; offline: NodeId | null; selectedNode: NodeId; selectNode: (id: NodeId) => void; cameraMode: string };

const presets: Record<string, { position: [number, number, number]; fov: number }> = {
  aerial: { position: [11, 12, 13], fov: 42 }, walk: { position: [10, 4.6, 10], fov: 48 },
  aquaculture: { position: [9, 7, -9], fov: 43 }, power: { position: [-8, 7, 8], fov: 44 }, circuit: { position: [2, 3.6, 4], fov: 40 },
};

function VillageHouse({ position, rotation = 0, tone = '#d6c6a5' }: { position: [number, number, number]; rotation?: number; tone?: string }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    <mesh position={[0, .65, 0]} castShadow><boxGeometry args={[1.25, 1.05, 1.05]} /><meshStandardMaterial color={tone} roughness={.86} /></mesh>
    <mesh position={[0, 1.34, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[.96, .55, 4]} /><meshStandardMaterial color="#77766b" roughness={.92} /></mesh>
    <mesh position={[0, .13, 0]}><boxGeometry args={[1.45, .18, 1.3]} /><meshStandardMaterial color="#78634e" roughness={.8} /></mesh>
    <mesh position={[.16, .55, .53]}><boxGeometry args={[.28, .44, .03]} /><meshStandardMaterial color="#314b51" roughness={.28} /></mesh>
    <mesh position={[-.37, .15, .56]}><boxGeometry args={[1.7, .12, .12]} /><meshStandardMaterial color="#634f3a" /></mesh>
    <mesh position={[.58, .16, .18]}><boxGeometry args={[.12, .12, .82]} /><meshStandardMaterial color="#634f3a" /></mesh>
  </group>;
}

function Cage({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const net = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (net.current) net.current.position.y = position[1] + Math.sin(clock.elapsedTime * .65 + position[0]) * .025; });
  return <group ref={net} position={position} scale={scale}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .08, 0]}><ringGeometry args={[1.04, 1.2, 48]} /><meshStandardMaterial color="#b48d52" roughness={.62} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, -.28, 0]}><cylinderGeometry args={[1.03, .96, .72, 36, 1, true]} /><meshStandardMaterial color="#59746c" transparent opacity={.38} wireframe /></mesh>
    {[0, 1, 2, 3].map(i => <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 1.07, .18, Math.sin(i * Math.PI / 2) * 1.07]}><cylinderGeometry args={[.08, .08, .12, 12]} /><meshStandardMaterial color="#e7e0ca" /></mesh>)}
  </group>;
}

function Boat({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    <mesh position={[0, .15, 0]} rotation={[0, 0, 0]}><capsuleGeometry args={[.34, 1.6, 4, 10]} /><meshStandardMaterial color="#886143" roughness={.64} /></mesh>
    <mesh position={[0, .34, -.12]}><boxGeometry args={[.42, .22, .58]} /><meshStandardMaterial color="#c7b28b" /></mesh>
    <mesh position={[0, .8, .12]}><cylinderGeometry args={[.025, .025, 1.1, 6]} /><meshStandardMaterial color="#625744" /></mesh>
  </group>;
}

function Cabinet({ position, selected, onClick }: { position: [number, number, number]; selected: boolean; onClick: () => void }) {
  return <group position={position} onClick={e => { e.stopPropagation(); onClick(); }}>
    <mesh position={[0, .55, 0]} castShadow><boxGeometry args={[.74, 1.15, .48]} /><meshStandardMaterial color={selected ? '#498a7d' : '#64767a'} metalness={.3} roughness={.45} /></mesh>
    <mesh position={[.12, .62, .246]}><boxGeometry args={[.31, .56, .018]} /><meshStandardMaterial color="#d5e4db" emissive="#275d53" emissiveIntensity={.18} /></mesh>
    <mesh position={[-.19, .96, .255]}><sphereGeometry args={[.035, 12, 10]} /><meshStandardMaterial color="#7fd5ac" emissive="#54d590" emissiveIntensity={.5} /></mesh>
    <mesh position={[0, 1.2, 0]}><boxGeometry args={[.82, .08, .56]} /><meshStandardMaterial color="#b7c4bd" metalness={.4} /></mesh>
  </group>;
}

function SensorMarker({ position, label, color = '#db9a48' }: { position: [number, number, number]; label: string; color?: string }) {
  return <group position={position}>
    <mesh position={[0, .2, 0]}><cylinderGeometry args={[.04, .04, .4, 8]} /><meshStandardMaterial color="#697d7c" /></mesh>
    <mesh position={[0, .43, 0]}><sphereGeometry args={[.105, 14, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.24} /></mesh>
    <Html distanceFactor={11} position={[0, .68, 0]} center><span className="hotspot-label">{label}</span></Html>
  </group>;
}

function NodeAsset({ id, position, selected, active, offline, onClick }: { id: NodeId; position: [number, number, number]; selected: boolean; active: boolean; offline: boolean; onClick: () => void }) {
  const color = offline ? '#c95f54' : active ? selected ? '#397d70' : '#6f8e84' : '#a7a9a1';
  return <group position={position} onClick={e => { e.stopPropagation(); onClick(); }}>
    <mesh position={[0, .46, 0]} castShadow><boxGeometry args={id === 'P0' ? [.72, .9, .54] : [.6, .76, .46]} /><meshStandardMaterial color={color} metalness={.2} roughness={.45} /></mesh>
    <mesh position={[0, .94, 0]}><boxGeometry args={[.7, .06, .5]} /><meshStandardMaterial color="#d6ddd7" metalness={.3} /></mesh>
    <mesh position={[.17, .58, .236]}><sphereGeometry args={[.035, 10, 8]} /><meshStandardMaterial color={offline ? '#ef8279' : active ? '#81dbb4' : '#c5b377'} emissive={offline ? '#ef8279' : '#81dbb4'} emissiveIntensity={.4} /></mesh>
    <Html distanceFactor={13} position={[0, 1.18, 0]} center><button className={`scene-node-tag ${selected ? 'selected' : ''}`} onClick={e => { e.stopPropagation(); onClick(); }}>{id}<small>{offline ? 'OFFLINE' : active ? 'ACTIVE' : 'SHED'}</small></button></Html>
  </group>;
}

function EnergyPulse({ from, to, active, color = '#dbad58' }: { from: [number, number, number]; to: [number, number, number]; active: boolean; color?: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (ref.current && active) { const t = (clock.elapsedTime * .38) % 1; ref.current.position.lerpVectors(new THREE.Vector3(...from), new THREE.Vector3(...to), t); } });
  if (!active) return null;
  return <mesh ref={ref}><sphereGeometry args={[.065, 10, 8]} /><meshBasicMaterial color={color} /></mesh>;
}

function Environment({ mode, batterySoc, offline, selectedNode, selectNode }: SceneProps) {
  const water = useRef<THREE.Mesh>(null);
  const { scene } = useThree();
  scene.background = new THREE.Color('#c8d9d5');
  useFrame(({ clock }) => { if (water.current) water.current.position.y = -0.2 + Math.sin(clock.elapsedTime * .5) * .012; });
  const powerOn = mode !== 'outage';
  const nodes = useMemo(() => NODE_DEFINITIONS.map(n => ({ ...n, active: activeLoad(n.id, mode, batterySoc, offline) })), [mode, batterySoc, offline]);
  return <>
    <ambientLight intensity={1.35} />
    <directionalLight position={[8, 12, 6]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
    <hemisphereLight args={['#e8f4ed', '#59675b', .6]} />
    <mesh ref={water} rotation={[-Math.PI / 2, 0, 0]} position={[0, -.2, 0]} receiveShadow>
      <planeGeometry args={[34, 28, 1, 1]} /><meshPhysicalMaterial color="#82b6b0" roughness={.28} metalness={.08} clearcoat={.45} transparent opacity={.94} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, -.17, 3]} receiveShadow><planeGeometry args={[12, 12]} /><meshStandardMaterial color="#a9a184" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9, -.17, -1]} receiveShadow><planeGeometry args={[13, 11]} /><meshStandardMaterial color="#aea489" roughness={1} /></mesh>
    <mesh position={[0, -.05, -12]}><boxGeometry args={[34, .35, 5]} /><meshStandardMaterial color="#c5b68e" roughness={1} /></mesh>
    {/* illustrative southern Thai shoreline village reconstruction; not surveyed geometry */}
    <VillageHouse position={[-8.4, -.16, 1.9]} rotation={-.18} tone="#d8c7a1" />
    <VillageHouse position={[-10, -.16, 4.0]} rotation={.13} tone="#c8bd9e" />
    <VillageHouse position={[-6.6, -.16, 5.3]} rotation={.18} tone="#ddd0b7" />
    <VillageHouse position={[-9.8, -.16, -.15]} rotation={-.22} tone="#c9b994" />
    <VillageHouse position={[8.6, -.16, 2.0]} rotation={.35} tone="#d8c6a2" />
    <VillageHouse position={[10, -.16, 4.1]} rotation={-.22} tone="#c9bea3" />
    <VillageHouse position={[7, -.16, 5.4]} rotation={.13} tone="#dfd4b9" />
    <mesh position={[-8, .015, 1.1]} rotation={[0, .18, 0]}><boxGeometry args={[.45, .12, 9.3]} /><meshStandardMaterial color="#b8b3a0" roughness={.95} /></mesh>
    <mesh position={[8, .015, 1.1]} rotation={[0, -.12, 0]}><boxGeometry args={[.45, .12, 9.3]} /><meshStandardMaterial color="#b8b3a0" roughness={.95} /></mesh>
    {/* fish cages */}
    <Cage position={[3.4, -.1, -2.8]} scale={.96} /><Cage position={[5.9, -.1, -4.0]} scale={.88} /><Cage position={[7.8, -.1, -6.2]} scale={.83} />
    <Cage position={[1.3, -.1, -5.1]} scale={.83} /><Cage position={[4.2, -.1, -7]} scale={.88} />
    <Boat position={[3.3, -.07, -8.8]} rotation={.35} /><Boat position={[-3.2, -.07, -5.9]} rotation={1.1} />
    {/* P0–P3 cabinet nodes */}
    {nodes.map(n => <NodeAsset key={n.id} id={n.id} position={n.position} active={n.active} offline={offline === n.id} selected={selectedNode === n.id} onClick={() => selectNode(n.id)} />)}
    <SensorMarker position={[4.7, -.1, -4.8]} label="ความเค็ม · อุณหภูมิ" />
    <SensorMarker position={[6.8, -.1, -3.3]} label="โหลดสาธิต" color="#759890" />
    {/* low-voltage solar demonstrator, explicitly illustrative */}
    <group position={[-5.2, .0, -2.8]}>
      <mesh position={[0, .6, 0]} rotation={[-.15, .25, 0]}><boxGeometry args={[1.9, .06, 1.15]} /><meshStandardMaterial color="#243f50" metalness={.45} roughness={.34} /></mesh>
      {[-.45, 0, .45].map(x => <mesh key={x} position={[x, .64, 0]} rotation={[-.15, .25, 0]}><boxGeometry args={[.014, .065, 1.12]} /><meshStandardMaterial color="#9db4bb" metalness={.35} /></mesh>)}
      <mesh position={[-.55, .3, .22]}><cylinderGeometry args={[.04, .04, .6, 8]} /><meshStandardMaterial color="#667b78" /></mesh>
      <Html distanceFactor={12} position={[0, 1.05, 0]} center><span className="hotspot-label">ชุดโซลาร์สาธิต · ยังไม่ระบุขนาดจริง</span></Html>
    </group>
    {/* overhead low-voltage demonstration wires */}
    <Line points={[[-7, 2.7, 1], [-4, 3.3, .2], [-.3, 3.4, 0], [2.4, 2.9, -1.3]]} color={powerOn ? '#687c74' : '#b17958'} lineWidth={1} />
    {[-7, -4, -.3, 2.4].map((x, i) => <group key={x} position={[x, 0, [1, .2, 0, -1.3][i]]}>
      <mesh position={[0, 1.4, 0]}><cylinderGeometry args={[.055, .08, 2.8, 8]} /><meshStandardMaterial color="#807f72" /></mesh>
      <mesh position={[0, 2.7, 0]}><boxGeometry args={[.8, .06, .06]} /><meshStandardMaterial color="#807f72" /></mesh>
    </group>)}
    <Line points={[[-.1, .7, 0], [-3.4, .7, -1.4]]} color="#6e9885" lineWidth={1.3} />
    <Line points={[[-.1, .7, 0], [3.3, .7, -1.4]]} color="#6e9885" lineWidth={1.3} />
    <Line points={[[-.1, .7, 0], [-1.6, .7, 2.4]]} color="#6e9885" lineWidth={1.3} />
    <EnergyPulse from={[-.1, .8, 0]} to={[-3.4, .8, -1.4]} active={activeLoad('P2', mode, batterySoc, offline)} />
    <EnergyPulse from={[-.1, .8, 0]} to={[3.3, .8, -1.4]} active={activeLoad('P1', mode, batterySoc, offline)} color="#62a99a" />
    <EnergyPulse from={[-.1, .8, 0]} to={[-1.6, .8, 2.4]} active={activeLoad('P3', mode, batterySoc, offline)} color="#acb4a5" />
    <Text position={[0, .02, 7.2]} fontSize={.32} color="#748079" anchorX="center" anchorY="middle">BAN SALA HUM · ILLUSTRATIVE DIGITAL TWIN</Text>
    <OrbitControls makeDefault enableDamping dampingFactor={.08} minDistance={5} maxDistance={26} maxPolarAngle={Math.PI * .49} target={[0, 0, 0]} />
  </>;
}

export default function Scene3D(props: SceneProps) {
  const preset = presets[props.cameraMode] || presets.aerial;
  return <Canvas key={props.cameraMode} shadows dpr={[.7, 1.25]} camera={{ position: preset.position, fov: preset.fov, near: .1, far: 100 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <Environment {...props} />
  </Canvas>;
}
