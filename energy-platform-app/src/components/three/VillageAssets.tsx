'use client';

import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { BASE_PATH } from '@/lib/urls';

export const villageAsset = (path: string) => `${BASE_PATH}/assets/${path}`;
export type Placement = { position: [number, number, number]; scale?: [number, number, number]; rotation?: [number, number, number] };
export type VillageMaterials = Record<'wood' | 'darkWood' | 'roof' | 'sand' | 'steel' | 'paint' | 'rubber' | 'net' | 'blue' | 'leaf' | 'leafLight' | 'glass' | 'concrete', THREE.MeshStandardMaterial>;

export function useVillageMaterials(textured = false): VillageMaterials {
  const materials = useMemo(() => ({
    wood: new THREE.MeshStandardMaterial({ color: '#ddd0b8', roughness: .88 }),
    darkWood: new THREE.MeshStandardMaterial({ color: '#928779', roughness: .95 }),
    roof: new THREE.MeshStandardMaterial({ color: '#bbbdb3', metalness: .55, roughness: .65 }),
    sand: new THREE.MeshStandardMaterial({ color: '#c2b7a0', roughness: 1 }),
    steel: new THREE.MeshStandardMaterial({ color: '#a4b2b1', metalness: .86, roughness: .36 }),
    paint: new THREE.MeshStandardMaterial({ color: '#c6cdc7', metalness: .25, roughness: .42 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#202c2b', roughness: .92 }),
    net: new THREE.MeshStandardMaterial({ color: '#172b27', roughness: .88, side: THREE.DoubleSide, transparent: true, opacity: .62 }),
    blue: new THREE.MeshStandardMaterial({ color: '#35758a', roughness: .58, metalness: .02 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#354c3d', roughness: .94, side: THREE.DoubleSide }),
    leafLight: new THREE.MeshStandardMaterial({ color: '#62714d', roughness: .96, side: THREE.DoubleSide }),
    glass: new THREE.MeshStandardMaterial({ color: '#173838', metalness: .22, roughness: .15 }),
    concrete: new THREE.MeshStandardMaterial({ color: '#aaa99a', roughness: .92 }),
  }), []);
  useEffect(() => () => Object.values(materials).forEach(material => material.dispose()), [materials]);
  void textured;
  return materials;
}

export function TextureMaterials({ children }: { children: (materials: VillageMaterials) => ReactNode }) {
  const materials = useVillageMaterials();
  const { gl } = useThree();
  const textures = useTexture([
    villageAsset('textures/wood-planks-diffuse.jpg'), villageAsset('textures/wood-planks-normal.jpg'), villageAsset('textures/wood-planks-arm.jpg'),
    villageAsset('textures/corrugated-iron-diffuse.jpg'), villageAsset('textures/corrugated-iron-normal.jpg'), villageAsset('textures/corrugated-iron-arm.jpg'),
    villageAsset('textures/coastal-sand-diffuse.jpg'), villageAsset('textures/coastal-sand-normal.jpg'), villageAsset('textures/coastal-sand-arm.jpg'),
  ]);
  useMemo(() => {
    textures.forEach((texture, index) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
      texture.colorSpace = index % 3 === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    });
    [materials.wood, materials.darkWood].forEach(material => {
      material.map = textures[0]; material.normalMap = textures[1]; material.roughnessMap = textures[2];
      material.normalScale.set(.45, .45); material.needsUpdate = true;
    });
    materials.roof.map = textures[3]; materials.roof.normalMap = textures[4]; materials.roof.roughnessMap = textures[5]; materials.roof.metalnessMap = textures[5]; materials.roof.normalScale.set(.65, .65); materials.roof.needsUpdate = true;
    materials.sand.map = textures[6]; materials.sand.normalMap = textures[7]; materials.sand.roughnessMap = textures[8]; materials.sand.normalScale.set(.6, .6); materials.sand.needsUpdate = true;
    textures.slice(6).forEach(texture => texture.repeat.set(18, 18));
  }, [textures, materials, gl]);
  return children(materials);
}

/** One draw call for repeating timber, framing or floating drums. */
export function RepeatedParts({ geometry, material, items, castShadow = true }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: Placement[]; castShadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const transform = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((item, index) => {
      transform.position.set(...item.position);
      transform.rotation.set(...(item.rotation ?? [0, 0, 0]));
      transform.scale.set(...(item.scale ?? [1, 1, 1]));
      transform.updateMatrix(); mesh.setMatrixAt(index, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
  }, [items, transform]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow dispose={null} />;
}

export function DetailedHouse({ position, rotation = 0, size = 1, materials, lightsOn, tone = '#d2cdb9' }: { position: [number, number, number]; rotation?: number; size?: number; materials: VillageMaterials; lightsOn: boolean; tone?:string }) {
  const unit = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const roofGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([-1.9, 2.55, -1.65, 0, 3.6, -1.65, -1.9, 2.55, 1.65, 0, 3.6, -1.65, 0, 3.6, 1.65, -1.9, 2.55, 1.65, 0, 3.6, -1.65, 1.9, 2.55, -1.65, 0, 3.6, 1.65, 1.9, 2.55, -1.65, 1.9, 2.55, 1.65, 0, 3.6, 1.65]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,0,1,1,0,1,1,0,1]),2));
    geometry.setIndex([0,2,1,3,5,4,6,8,7,9,11,10]); geometry.computeVertexNormals(); return geometry;
  }, []);
  const timber = useMemo<Placement[]>(() => {
    const items: Placement[] = [];
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 10; i++) items.push({ position: [side * 1.52, 1.05 + i * .145, 0], scale: [.12, .137, 2.7] });
      for (let i = 0; i < 20; i++) {
        const x = -1.43 + i * .15;
        if (side === -1 && Math.abs(x) < .45) continue;
        items.push({ position: [x, 1.68, side * 1.35], scale: [.14, 1.45, .12] });
      }
    }
    for (let i = 0; i < 20; i++) items.push({ position: [-1.62 + i * .17, .86, .38], scale: [.158, .14, 3.6] });
    return items;
  }, []);
  const posts = useMemo<Placement[]>(() => [-1.38, 1.38].flatMap(x => [-1.15, 1.15].map(z => ({ position: [x, .49, z] as [number,number,number], scale: [.16, 1.1, .16] as [number,number,number] }))), []);
  const siding=useMemo(()=>{const material=materials.wood.clone();material.color.set(tone);return material;},[materials,tone]);
  useEffect(() => () => { unit.dispose(); roofGeometry.dispose(); siding.dispose(); }, [unit, roofGeometry,siding]);
  return <group position={position} rotation={[0, rotation, 0]} scale={size}>
    <RepeatedParts geometry={unit} material={siding} items={timber} />
    <RepeatedParts geometry={unit} material={materials.darkWood} items={posts} />
    <mesh geometry={roofGeometry} material={materials.roof} castShadow receiveShadow />
    <mesh position={[0, 3.58, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.steel}><cylinderGeometry args={[.06, .06, 3.38, 10]} /></mesh>
    {[-.86, .86].map(x => <group key={x} position={[x, 1.76, -1.426]}>
      <mesh material={materials.darkWood}><boxGeometry args={[.68, .84, .08]} /></mesh>
      <mesh position={[0, 0, -.05]}><planeGeometry args={[.53, .69]} /><meshStandardMaterial color={lightsOn ? '#d6ad6c' : '#183034'} emissive={lightsOn ? '#e7a653' : '#000000'} emissiveIntensity={lightsOn ? .9 : 0} roughness={.35} /></mesh>
      <mesh position={[0, 0, -.058]} material={materials.wood}><boxGeometry args={[.028, .72, .018]} /></mesh>
      <mesh position={[0, 0, -.06]} material={materials.wood}><boxGeometry args={[.55, .035, .018]} /></mesh>
    </group>)}
    <mesh position={[0, 1.31, -1.43]} material={materials.darkWood}><boxGeometry args={[.62, .9, .04]} /></mesh>
    {[0, 1, 2, 3].map(i => <mesh key={i} position={[0, .16 + .18 * i, -2.13 + .19 * i]} material={materials.wood} receiveShadow><boxGeometry args={[.88, .17, .28]} /></mesh>)}
    <mesh position={[-1.35, 1.26, -1.66]} material={materials.blue}><cylinderGeometry args={[.22, .24, .7, 16]} /></mesh>
    <mesh position={[1.65, 1.46, .48]} material={materials.paint}><boxGeometry args={[.24, .49, .38]} /></mesh>
  </group>;
}

export function TimberJetty({ x = 0, z = 0, length = 8, width = 1.5, cross = false, materials }: { x?: number; z?: number; length?: number; width?: number; cross?: boolean; materials: VillageMaterials }) {
  const unit = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const boards = useMemo<Placement[]>(() => Array.from({ length: Math.ceil(length / .25) }, (_, i) => ({ position: [0, .2, -length / 2 + i * .25], scale: [width, .1, .238] })), [length, width]);
  const supports = useMemo<Placement[]>(() => Array.from({ length: Math.ceil(length / 2) + 1 }, (_, i) => [-width * .4, width * .4].map(px => ({ position: [px, -.08, -length / 2 + i * 2] as [number,number,number], scale: [.14, .72, .14] as [number,number,number] }))).flat(), [length, width]);
  useEffect(() => () => unit.dispose(), [unit]);
  return <group position={[x, 0, z]} rotation={[0, cross ? Math.PI / 2 : 0, 0]}>
    <RepeatedParts geometry={unit} material={materials.wood} items={boards} />
    <RepeatedParts geometry={unit} material={materials.darkWood} items={supports} />
    {[-width * .38, width * .38].map(px => <mesh key={px} position={[px, .12, 0]} material={materials.darkWood} receiveShadow><boxGeometry args={[.14, .16, length + .1]} /></mesh>)}
  </group>;
}

export function RectangularCage({ position, materials, reducedMotion = false, scale = 1 }: { position: [number,number,number]; materials: VillageMaterials; reducedMotion?: boolean; scale?: number }) {
  const group = useRef<THREE.Group>(null);
  const unit = useMemo(() => new THREE.BoxGeometry(1,1,1), []);
  const barrel = useMemo(() => new THREE.CylinderGeometry(.21,.21,.68,16), []);
  const meshNet = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d')!; context.clearRect(0,0,64,64); context.strokeStyle = '#b6c4b8'; context.lineWidth = 2.5;
    for (let n = -64; n < 128; n += 16) { context.beginPath(); context.moveTo(n,0); context.lineTo(n+64,64); context.moveTo(n,64); context.lineTo(n+64,0); context.stroke(); }
    const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(8,4);
    return texture;
  }, []);
  const rails = useMemo<Placement[]>(() => [-1.1,1.1].flatMap(s => [{position:[s,.23,0] as [number,number,number],scale:[.12,.12,2.36] as [number,number,number]}, {position:[0,.23,s] as [number,number,number],scale:[2.36,.12,.12] as [number,number,number]}]), []);
  const drums = useMemo<Placement[]>(() => [-1.16,1.16].flatMap(x => [-.68,.68].map(z => ({position:[x,-.04,z] as [number,number,number], rotation:[Math.PI/2,0,0] as [number,number,number]}))), []);
  const posts = useMemo<Placement[]>(() => [-1.1,1.1].flatMap(x => [-1.1,1.1].map(z => ({position:[x,.46,z] as [number,number,number],scale:[.055,.7,.055] as [number,number,number]}))), []);
  useEffect(() => () => { unit.dispose(); barrel.dispose(); meshNet.dispose(); }, [unit,barrel,meshNet]);
  useFrame(({ clock }) => { if(group.current && !reducedMotion) {group.current.position.y = position[1] + Math.sin(clock.elapsedTime*.7+position[0])*.022; group.current.rotation.z = Math.sin(clock.elapsedTime*.6+position[2])*.008; } });
  return <group ref={group} position={position} scale={scale}>
    <RepeatedParts geometry={unit} material={materials.wood} items={rails} />
    <RepeatedParts geometry={unit} material={materials.darkWood} items={posts} />
    <RepeatedParts geometry={barrel} material={materials.blue} items={drums} castShadow={false} />
    {[-1.08,1.08].map(s => <group key={s}>
      <mesh position={[s,-.27,0]} rotation={[0,Math.PI/2,0]}><planeGeometry args={[2.15,.9]} /><meshStandardMaterial color="#132820" transparent opacity={.85} alphaMap={meshNet} side={THREE.DoubleSide} roughness={1} depthWrite={false}/></mesh>
      <mesh position={[0,-.27,s]}><planeGeometry args={[2.15,.9]} /><meshStandardMaterial color="#132820" transparent opacity={.85} alphaMap={meshNet} side={THREE.DoubleSide} roughness={1} depthWrite={false}/></mesh>
    </group>)}
    <mesh position={[0,-.69,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[2.14,2.14]} /><meshStandardMaterial color="#132820" transparent opacity={.6} alphaMap={meshNet} side={THREE.DoubleSide} roughness={1} depthWrite={false}/></mesh>
  </group>;
}

function hullWidth(t: number) { return Math.pow(Math.sin(t*Math.PI), .62) * .63; }
export function FishingBoat({ position, rotation = 0, materials, reducedMotion = false, blue = true }: { position: [number,number,number]; rotation?: number; materials: VillageMaterials; reducedMotion?: boolean; blue?: boolean }) {
  const boat = useRef<THREE.Group>(null);
  const hull = useMemo(() => {
    const vertices:number[] = [], uvs:number[] = [], indices:number[] = [];
    const lengthSteps = 26, curveSteps = 14;
    for(let i=0;i<=lengthSteps;i++) { const t=i/lengthSteps; const width=hullWidth(Math.min(.999,Math.max(.001,t))); const lift=.23*Math.pow(Math.abs(t-.5)*2,3);
      for(let j=0;j<=curveSteps;j++) { const a=j/curveSteps*Math.PI; vertices.push(Math.cos(a)*width,.38-Math.sin(a)*.4+lift,(t-.5)*3.9); uvs.push(j/curveSteps,t*2); }
    }
    for(let i=0;i<lengthSteps;i++) for(let j=0;j<curveSteps;j++) { const a=i*(curveSteps+1)+j,b=a+curveSteps+1; indices.push(a,b,a+1,b,b+1,a+1); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  }, []);
  const rail = useMemo(() => [-1,1].map(side => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length:27},(_,i)=> {const t=i/26;return new THREE.Vector3(side*hullWidth(Math.min(.999,Math.max(.001,t))),.4+.23*Math.pow(Math.abs(t-.5)*2,3),(t-.5)*3.9);})),40,.04,6,false)), []);
  const hullMat = useMemo(() => { const mat = materials.wood.clone(); mat.color.set(blue ? '#486c74' : '#99794f');mat.side = THREE.DoubleSide; mat.roughness=.7; return mat; }, [materials,blue]);
  useEffect(() => () => { hull.dispose(); rail.forEach(g=>g.dispose()); hullMat.dispose(); }, [hull,rail,hullMat]);
  useFrame(({clock})=> { if(boat.current && !reducedMotion) {boat.current.position.y=position[1]+Math.sin(clock.elapsedTime*.65+position[0])*.028;boat.current.rotation.z=Math.sin(clock.elapsedTime*.45+position[2])*.024;} });
  return <group ref={boat} position={position} rotation={[0,rotation,0]}>
    <mesh geometry={hull} material={hullMat} castShadow receiveShadow />
    {rail.map((geometry,i)=><mesh key={i} geometry={geometry} material={materials.darkWood} castShadow />)}
    {[-1.1,-.4,.35,1].map(z=><mesh key={z} position={[0,.33,z]} material={materials.wood} castShadow><boxGeometry args={[hullWidth((z+1.95)/3.9)*1.82,.065,.18]}/></mesh>)}
    <mesh position={[0,.13,0]} material={materials.darkWood}><boxGeometry args={[.55,.055,2.7]}/></mesh>
    <group position={[0,.55,1.28]} rotation={[.2,0,0]}>
      <mesh material={materials.rubber}><boxGeometry args={[.28,.31,.36]}/></mesh>
      <mesh position={[.19,.1,0]} rotation={[0,0,Math.PI/2]} material={materials.steel}><cylinderGeometry args={[.065,.065,.21,12]}/></mesh>
      <mesh position={[0,-.18,.91]} rotation={[Math.PI/2-.23,0,0]} material={materials.steel}><cylinderGeometry args={[.025,.025,1.85,8]}/></mesh>
      <mesh position={[0,-.42,1.77]} rotation={[0,.3,0]} material={materials.steel}><boxGeometry args={[.34,.045,.12]}/></mesh>
    </group>
    <mesh position={[.16,.44,.38]} material={materials.paint}><cylinderGeometry args={[.12,.1,.23,12]}/></mesh>
    <mesh position={[-.19,.45,-.6]} material={materials.blue}><boxGeometry args={[.32,.3,.4]}/></mesh>
  </group>;
}

export function PalmTree({ position, scale=1, rotation=0, materials }: {position:[number,number,number];scale?:number;rotation?:number;materials:VillageMaterials}) {
  const trunk = useMemo(()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.08,1.8,0),new THREE.Vector3(.4,3.9,.04),new THREE.Vector3(.74,5.6,.12)]),12,.16,7,false),[]);
  const frond = useMemo(()=>{
    const positions:number[]=[],indices:number[]=[];
    const curve=(t:number)=>.75*Math.sin(t*Math.PI)-t*.65;
    const leaf=(points:number[][])=>{const index=positions.length/3;points.forEach(point=>positions.push(...point));indices.push(index,index+1,index+2,index,index+2,index+3);};
    for(let i=0;i<30;i++){const t=i/30,next=(i+1)/30;leaf([[t*2.45,curve(t),-.014],[t*2.45,curve(t),.014],[next*2.45,curve(next),.011],[next*2.45,curve(next),-.011]]);}
    for(let i=2;i<29;i++){const t=i/30,width=Math.pow(Math.sin(Math.PI*t),.7)*.42;for(const side of [-1,1]){const x=t*2.45,y=curve(t);leaf([[x,y,0],[x+.02,y,.035*side],[x+.16,y-.09,width*side],[x+.1,y-.065,width*.97*side]]);}}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  },[]);
  const fruit=useMemo(()=>new THREE.SphereGeometry(.15,7,6),[]);
  const leaves=useMemo<Placement[]>(()=>Array.from({length:8},(_,i)=>({position:[0,0,0],rotation:[i%2*.09,i*Math.PI/4,-.12+(i%3)*.13]})),[]);
  const coconuts=useMemo<Placement[]>(()=>[0,1,2].map(i=>({position:[.1*Math.cos(i*2),-.14,.1*Math.sin(i*2)]})),[]);
  useEffect(()=>()=>{trunk.dispose();frond.dispose();fruit.dispose();},[trunk,frond,fruit]);
  return <group position={position} scale={scale} rotation={[0,rotation,0]}><mesh geometry={trunk} material={materials.darkWood} castShadow/><group position={[.74,5.6,.12]}><RepeatedParts geometry={frond} material={materials.leaf} items={leaves.filter((_,i)=>i%3!==0)}/><RepeatedParts geometry={frond} material={materials.leafLight} items={leaves.filter((_,i)=>i%3===0)}/><RepeatedParts geometry={fruit} material={materials.darkWood} items={coconuts} castShadow={false}/></group></group>;
}

/** Low-cost crossed foliage cards screen the distant village edge; these are procedural context rather than surveyed trees. */
export function DistantTreeLine() {
  const assets=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const context=canvas.getContext('2d')!;let seed=1793;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<1300;i++){const angle=random()*Math.PI*2,radius=Math.sqrt(random());const x=128+Math.cos(angle)*radius*105,y=110+Math.sin(angle)*radius*91;context.fillStyle=`rgb(${58+Math.floor(random()*42)},${76+Math.floor(random()*46)},${48+Math.floor(random()*37)})`;context.beginPath();context.ellipse(x,y,3+random()*7,2+random()*5,random()*Math.PI,0,Math.PI*2);context.fill();}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshStandardMaterial({map:texture,roughness:1,alphaTest:.45,side:THREE.DoubleSide,color:'#b3b8a3'});
    const geometry=new THREE.PlaneGeometry(1,1);
    const items:Placement[]=[];
    for(let row=0;row<3;row++)for(let i=0;i<21;i++){const width=4+random()*3,height=3.9+random()*2.4;const position:[number,number,number]=[-43+i*4.3+(random()-.5)*2,height*.53,16.5+row*5+random()*2];for(let side=0;side<2;side++)items.push({position,scale:[width,height,1],rotation:[0,side*Math.PI/2+(random()-.5)*.45,0]});}
    return {texture,material,geometry,items};
  },[]);
  useEffect(()=>()=>{assets.texture.dispose();assets.material.dispose();assets.geometry.dispose();},[assets]);
  return <RepeatedParts geometry={assets.geometry} material={assets.material} items={assets.items} castShadow={false}/>;
}

export function LicensedModel({ path, position=[0,0,0], height=1, rotation=0 }: { path:string;position?:[number,number,number];height?:number;rotation?:number }) {
  const {scene} = useGLTF(villageAsset(`models/${path}`));
  const model = useMemo(()=> {const cloned=scene.clone(true);cloned.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}});const bounds=new THREE.Box3().setFromObject(cloned);const size=bounds.getSize(new THREE.Vector3());const center=bounds.getCenter(new THREE.Vector3());return {cloned,scale:height/Math.max(size.y,.01),offset:[-center.x,-bounds.min.y,-center.z] as [number,number,number]};},[scene,height]);
  return <group position={position} rotation={[0,rotation,0]} scale={model.scale}><primitive object={model.cloned} position={model.offset} dispose={null}/></group>;
}
