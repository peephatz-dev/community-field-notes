'use client';

import { RoundedBox } from '@react-three/drei';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const METAL = '#adbcc6', PCB = '#163f3d', BLACK = '#17232e', COPPER = '#c88a48';
type Point = [number, number, number];

function Body({ size, position = [0, 0, 0], color = BLACK, metalness = .05, roughness = .42, radius = .035 }: { size: Point; position?: Point; color?: string; metalness?: number; roughness?: number; radius?: number }) {
  return <RoundedBox args={size} position={position} radius={radius} smoothness={2} castShadow receiveShadow><meshStandardMaterial color={color} metalness={metalness} roughness={roughness} /></RoundedBox>;
}

function Pins({ count = 18, spacing = .052, x = 0, z = 0, y = .16, along = 'z' }: { count?: number; spacing?: number; x?: number; z?: number; y?: number; along?: 'x' | 'z' }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set(x + (along === 'x' ? (i - (count - 1) / 2) * spacing : 0), y, z + (along === 'z' ? (i - (count - 1) / 2) * spacing : 0));
      dummy.updateMatrix(); ref.current?.setMatrixAt(i, dummy.matrix);
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [count, spacing, x, z, y, along]);
  return <instancedMesh ref={ref} args={[undefined, undefined, count]}><boxGeometry args={[.017, .15, .017]} /><meshStandardMaterial color="#ddc18a" metalness={.9} roughness={.27} /></instancedMesh>;
}

function Screw({ position, scale = 1 }: { position: Point; scale?: number }) {
  return <group position={position} scale={scale}><mesh><cylinderGeometry args={[.045, .045, .025, 10]} /><meshStandardMaterial color={METAL} metalness={.9} roughness={.28} /></mesh><mesh position={[0, .014, 0]}><boxGeometry args={[.052, .004, .008]} /><meshStandardMaterial color="#253746" roughness={.8} /></mesh></group>;
}

function Capacitor({ position, height = .24, radius = .08 }: { position: Point; height?: number; radius?: number }) {
  return <group position={position}><mesh position={[0, height / 2, 0]} castShadow><cylinderGeometry args={[radius, radius, height, 16]} /><meshStandardMaterial color="#344b59" metalness={.62} roughness={.32} /></mesh><mesh position={[0, height + .006, 0]}><cylinderGeometry args={[radius * .94, radius * .94, .013, 16]} /><meshStandardMaterial color={METAL} metalness={.8} roughness={.3} /></mesh><mesh position={[0, height + .014, 0]}><boxGeometry args={[radius * 1.4, .003, .008]} /><meshStandardMaterial color="#53656c" /></mesh></group>;
}

function Terminal({ position = [0, 0, 0], count = 2, color = '#307c6b', spacing = .12 }: { position?: Point; count?: number; color?: string; spacing?: number }) {
  return <group position={position}><Body size={[count * spacing + .025, .18, .21]} position={[0, .09, 0]} color={color} radius={.015} />{Array.from({ length: count }, (_, i) => <group key={i} position={[(i - (count - 1) / 2) * spacing, 0, 0]}><Screw position={[0, .192, 0]} scale={.7} /><mesh position={[0, .085, .108]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.035, .035, .012, 10]} /><meshStandardMaterial color="#071823" roughness={.7} /></mesh></group>)}</group>;
}

function useBoardTexture(label: string) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const c = canvas.getContext('2d');
    if (c) {
      c.fillStyle = PCB; c.fillRect(0, 0, 512, 512);
      c.strokeStyle = '#266355'; c.lineWidth = 4;
      for (let i = 0; i < 13; i++) {
        const x = 28 + i * 35, y = 84 + (i % 4) * 24;
        c.beginPath(); c.moveTo(x, 14); c.lineTo(x, y); c.lineTo(x + 22, y + 22); c.lineTo(x + 22, 458); c.stroke();
      }
      c.strokeStyle = '#b4cabd'; c.lineWidth = 2; c.strokeRect(18, 18, 476, 476);
      c.fillStyle = '#ddd7bc';
      for (let i = 0; i < 18; i++) { c.beginPath(); c.arc(35, 36 + i * 25, 7, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(477, 36 + i * 25, 7, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#dce8dd'; c.font = '600 24px monospace'; c.fillText(label, 57, 470);
      c.font = '15px monospace'; c.fillText('REFERENCE • REV 0.1', 57, 44); c.fillText('NOT HARDWARE VERIFIED', 57, 66);
    }
    const result = new THREE.CanvasTexture(canvas); result.colorSpace = THREE.SRGBColorSpace; result.anisotropy = 4;
    return result;
  }, [label]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Board({ width = 1.05, depth = .72, label = 'REFERENCE PCB', children }: { width?: number; depth?: number; label?: string; children?: React.ReactNode }) {
  const texture = useBoardTexture(label);
  return <group><Body size={[width, .055, depth]} color={PCB} position={[0, .06, 0]} radius={.016} roughness={.46} /><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .089, 0]}><planeGeometry args={[width - .014, depth - .014]} /><meshStandardMaterial map={texture} roughness={.45} metalness={.08} /></mesh>{[-1, 1].flatMap(x => [-1, 1].map(z => <group key={`${x}-${z}`} position={[x * (width / 2 - .075), 0, z * (depth / 2 - .075)]}><mesh position={[0, .02, 0]}><cylinderGeometry args={[.036, .036, .08, 8]} /><meshStandardMaterial color="#9f8d57" metalness={.86} roughness={.4} /></mesh><Screw position={[0, .105, 0]} scale={.62} /></group>))}{children}</group>;
}

function Led({ position, lit, color = '#67dcc6' }: { position: Point; lit: boolean; color?: string }) {
  return <mesh position={position}><sphereGeometry args={[.028, 10, 8]} /><meshStandardMaterial color={lit ? color : '#223743'} emissive={lit ? color : '#000000'} emissiveIntensity={lit ? 2.2 : 0} roughness={.25} /></mesh>;
}

function Controller({ lit, dataOnline }: { lit: boolean; dataOnline: boolean }) {
  return <group rotation={[0, Math.PI / 2, 0]}><Board width={.74} depth={1.18} label="ESP32 DEV · P0">
    <Body size={[.48, .105, .54]} position={[0, .17, -.14]} color="#afbac0" metalness={.95} roughness={.32} radius={.008} />
    <Body size={[.51, .012, .27]} position={[0, .108, -.44]} color="#273036" radius={.004} />
    {Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[-.2 + i * .075, .12, -.445]}><boxGeometry args={[.021, .006, .21]} /><meshStandardMaterial color="#d8b670" metalness={.94} roughness={.3} /></mesh>)}
    <Body size={[.48, .025, .012]} position={[0, .127, -.54]} color="#d8b670" metalness={.94} radius={.003} />
    <Body size={[.25, .045, .25]} position={[0, .12, .19]} radius={.005} />
    <Body size={[.24, .09, .18]} position={[0, .145, .56]} color={METAL} metalness={.92} roughness={.23} radius={.008} />
    <Body size={[.18, .05, .025]} position={[0, .145, .659]} color="#17232b" radius={.004} />
    {[-.31, .31].map(x => <group key={x}><Body size={[.065, .085, .95]} position={[x, .112, 0]} radius={.007} /><Pins x={x} count={18} spacing={.051} /></group>)}
    <Body size={[.075, .07, .1]} position={[-.22, .132, .37]} color="#444d52" radius={.005} /><Body size={[.075, .07, .1]} position={[.22, .132, .37]} color="#444d52" radius={.005} />
    <Led position={[-.2, .124, .23]} lit={lit} color="#eebd76" /><Led position={[.2, .124, .23]} lit={lit && dataOnline} />
  </Board></group>;
}

function Buck({ lit }: { lit: boolean }) {
  return <Board label="DC-DC · REG OUT TBD"><Terminal position={[-.36, .095, .17]} /><Terminal position={[.36, .095, -.17]} />
    <mesh position={[-.07, .225, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[.14, .06, 8, 24]} /><meshStandardMaterial color={COPPER} metalness={.91} roughness={.27} /></mesh>
    <mesh position={[-.07, .225, 0]}><cylinderGeometry args={[.09, .09, .16, 16]} /><meshStandardMaterial color="#31474b" roughness={.72} /></mesh>
    <Capacitor position={[.26, .096, .14]} height={.25} /><Capacitor position={[-.28, .096, -.2]} height={.21} />
    <Body size={[.2, .04, .17]} position={[.22, .13, -.12]} radius={.003} />
    <Led position={[.4, .125, .19]} lit={lit} />
  </Board>;
}

function PowerBattery({ lit }: { lit: boolean }) {
  return <group><Body size={[1.45, .8, .98]} position={[0, .42, 0]} color="#20323e" radius={.07} roughness={.42} /><Body size={[1.5, .09, 1.02]} position={[0, .84, 0]} color="#314754" radius={.04} roughness={.3} />
    {Array.from({ length: 10 }, (_, i) => <Body key={i} size={[.025, .52, 1.005]} position={[-.59 + i * .13, .38, 0]} color="#263a47" radius={.006} roughness={.54} />)}
    {[-1, 1].map((sign) => <group key={sign} position={[sign * .48, .93, -.22]}><mesh><cylinderGeometry args={[.085, .085, .13, 12]} /><meshStandardMaterial color={sign === -1 ? '#a54636' : '#264b6c'} metalness={.4} roughness={.37} /></mesh><Screw position={[0, .078, 0]} scale={1.25} /></group>)}
    <Body size={[.65, .035, .3]} position={[0, .897, .17]} color="#a7b1ac" radius={.008} roughness={.7} />
    <Body size={[.55, .038, .18]} position={[0, .923, .17]} color="#203b3e" radius={.008} />
    <Led position={[.22, .95, .2]} lit={lit} />
    {[-1, 1].map(x => <Body key={x} size={[.18, .08, .28]} position={[x * .67, .78, .09]} radius={.028} color="#172c36" />)}
  </group>;
}

function Distribution() {
  return <group><Body size={[1.32, .065, .88]} position={[0, .04, 0]} color="#75828c" metalness={.86} radius={.018} />
    {[-1, 1].map(sign => <group key={sign} position={[0, .08, sign * .2]}><Body size={[1.18, .21, .28]} position={[0, .1, 0]} color={sign === -1 ? '#723933' : '#22485f'} radius={.022} />
      <Body size={[1.06, .025, .08]} position={[0, .23, 0]} color="#bd9a58" metalness={.9} radius={.009} />
      {Array.from({ length: 5 }, (_, i) => <Screw key={i} position={[-.42 + i * .21, .265, 0]} scale={1.05} />)}
    </group>)}
  </group>;
}

function Fuse({ lit }: { lit: boolean }) {
  return <group><Body size={[.62, .43, .73]} position={[0, .23, 0]} color="#b8c2c5" radius={.028} />
    <Body size={[.42, .06, .56]} position={[0, .46, 0]} color="#3b4953" radius={.01} />
    <mesh position={[0, .55, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[.085, .085, .4, 14]} /><meshPhysicalMaterial color="#d4e6e0" metalness={0} roughness={.12} transmission={.3} transparent opacity={.6} /></mesh>
    {[-.21, .21].map(z => <mesh key={z} position={[0, .55, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.091, .091, .08, 12]} /><meshStandardMaterial color={METAL} metalness={.9} roughness={.3} /></mesh>)}
    <Body size={[.018, .014, .3]} position={[0, .55, 0]} color="#d9b371" metalness={.9} radius={.003} />
    <Terminal position={[0, .1, -.39]} color="#8b989c" /><Terminal position={[0, .1, .39]} color="#8b989c" />
    <Led position={[.19, .5, .21]} lit={lit} color="#eebd76" />
  </group>;
}

function Monitor({ lit }: { lit: boolean }) {
  return <Board label="V/I MEASURE · TBD"><Terminal position={[-.35, .095, .15]} color="#549b80" /><Terminal position={[.35, .095, .15]} color="#549b80" />
    <Body size={[.38, .055, .14]} position={[0, .15, .17]} color="#8d715b" metalness={.62} radius={.008} />
    <Body size={[.23, .045, .23]} position={[0, .125, -.12]} radius={.005} />
    <Pins count={4} spacing={.08} along="x" z={-.29} /><Led position={[.32, .12, -.14]} lit={lit} />
  </Board>;
}

function Driver({ lit, dataOnline }: { lit: boolean; dataOnline: boolean }) {
  return <Board label="EN DRIVER · DC SWITCH TBD"><Terminal position={[-.31, .095, .22]} color="#51777a" /><Terminal position={[.31, .095, .22]} color="#51777a" />
    <Body size={[.5, .045, .33]} position={[.16, .145, -.07]} color="#9aa6ae" metalness={.89} radius={.007} />
    {Array.from({ length: 6 }, (_, i) => <Body key={i} size={[.025, .28, .33]} position={[-.04 + i * .078, .3, -.07]} color="#77919b" metalness={.9} roughness={.27} radius={.005} />)}
    <Body size={[.18, .09, .16]} position={[-.29, .145, -.11]} radius={.004} />
    <Body size={[.13, .08, .21]} position={[-.08, .14, -.11]} color="#233844" radius={.007} />
    <Pins count={3} spacing={.09} x={-.28} z={-.3} along="x" /><Led position={[-.4, .12, .1]} lit={lit} />
  </Board>;
}

function Charger({ lit }: { lit: boolean }) {
  return <Board width={1.2} depth={.83} label="POWER PATH / BMS · TBD"><Terminal position={[-.39, .095, -.23]} count={3} color="#475f67" />
    <Terminal position={[.32, .095, .23]} count={3} color="#477b6f" />
    <Body size={[.25, .045, .28]} position={[.25, .126, -.14]} radius={.005} />
    <Capacitor position={[-.11, .098, -.19]} height={.18} radius={.065} />
    {Array.from({ length: 4 }, (_, i) => <Body key={i} size={[.105, .035, .18]} position={[-.41 + i * .17, .115, .13]} radius={.003} />)}
    <Pins count={5} spacing={.07} x={-.28} z={.32} along="x" /><Led position={[.47, .125, -.19]} lit={lit} />
  </Board>;
}

function Probe({ temperature = false, lit }: { temperature?: boolean; lit: boolean }) {
  return <group><Board width={.91} depth={.55} label={temperature ? 'TEMP INTERFACE TBD' : 'EC INTERFACE TBD'}><Body size={[.22, .035, .16]} position={[-.08, .11, 0]} radius={.005} /><Pins count={3} spacing={.09} x={-.27} z={-.17} along="x" /><Led position={[.29, .12, -.12]} lit={lit} /></Board>
    <mesh position={[.36, .16, .31]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.052, .052, .2, 12]} /><meshStandardMaterial color={METAL} metalness={.91} roughness={.23} /></mesh>
    <mesh position={[.36, .14, .47]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.027, .027, .23, 10]} /><meshStandardMaterial color="#182c34" roughness={.66} /></mesh>
    <group position={[-.16, .16, .55]} rotation={[Math.PI / 2, 0, Math.PI / 2]}><mesh castShadow><cylinderGeometry args={[temperature ? .045 : .07, temperature ? .045 : .07, .52, 16]} /><meshStandardMaterial color={temperature ? '#bdc9ca' : '#6c8792'} metalness={temperature ? .95 : .4} roughness={.23} /></mesh>
      {!temperature && [-.038, .038].map(x => <mesh key={x} position={[x, .31, 0]}><cylinderGeometry args={[.014, .014, .2, 8]} /><meshStandardMaterial color="#bcbdb5" metalness={.92} roughness={.3} /></mesh>)}
    </group>
  </group>;
}

export function CircuitEquipment({ id, lit, dataOnline }: { id: string; lit: boolean; dataOnline: boolean }) {
  switch (id) {
    case 'esp32': return <Controller lit={lit} dataOnline={dataOnline} />;
    case 'buck': return <Buck lit={lit} />;
    case 'battery': return <PowerBattery lit={lit} />;
    case 'bus': return <Distribution />;
    case 'fuse': return <Fuse lit={lit} />;
    case 'sense': return <Monitor lit={lit} />;
    case 'driver': return <Driver lit={lit} dataOnline={dataOnline} />;
    case 'charger': return <Charger lit={lit} />;
    case 'salinity': return <Probe lit={lit && dataOnline} />;
    case 'temp': return <Probe temperature lit={lit && dataOnline} />;
    default: return <group><Body size={[.94, .3, .69]} position={[0, .17, 0]} color="#425967" radius={.04} /><Terminal position={[0, .3, .12]} count={2} color="#546c76" />
      <mesh position={[0, .17, -.4]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.1, .1, .2, 16]} /><meshStandardMaterial color={METAL} metalness={.88} roughness={.27} /></mesh><Led position={[.32, .35, -.17]} lit={lit} color="#eebd76" /></group>;
  }
}
