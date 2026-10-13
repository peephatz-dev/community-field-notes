'use client';

import { Environment, Line, OrbitControls, RoundedBox } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { NODE_DEFINITIONS, activeLoad, type GridMode, type NodeId } from '@/lib/model';
import { DetailedHouse, DistantTreeLine, FishingBoat, LicensedModel, PalmTree, RectangularCage, RepeatedParts, TextureMaterials, TimberJetty, useVillageMaterials, villageAsset, type Placement, type VillageMaterials } from './three/VillageAssets';
import { LakeWater } from './three/VillageWater';
import { SpatialHtml as Html } from './three/SpatialHtml';

export type SceneProps = { mode: GridMode; batterySoc: number; offline: NodeId | null; selectedNode: NodeId; selectNode: (id: NodeId) => void; cameraMode: string; quality?: 'balanced' | 'high'; reducedMotion?: boolean };
type ViewPreset = { position: [number, number, number]; target: [number, number, number]; fov: number };
const PRESETS: Record<string, ViewPreset> = {
  aerial: { position: [12.7, 9.6, -13.3], target: [.1, .5, 1], fov: 43 },
  walk: { position: [7, 2.8, -5.7], target: [-.4, 1, .1], fov: 51 },
  aquaculture: { position: [10, 5.6, -12], target: [4, .5, -3.1], fov: 43 },
  power: { position: [-6.6, 4.8, -7.5], target: [-.9, 1, -.2], fov: 42 },
  circuit: { position: [2.7, 2.1, -3.2], target: [0, .85, 0], fov: 43 },
};

class AssetBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <SceneFallback /> : this.props.children; }
}

function SceneFallback() {
  return <div className="scene-webgl-fallback" role="status"><strong>มุมมอง 3D ไม่พร้อมบนอุปกรณ์นี้</strong><span>ข้อมูล โหนด สถานการณ์จำลอง และกราฟยังใช้ได้จากแผงควบคุม</span><small>ลองเปิด WebGL หรือใช้เบราว์เซอร์ที่รองรับกราฟิก 3D</small></div>;
}

function CameraRig({ cameraMode, reducedMotion }: { cameraMode: string; reducedMotion: boolean }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const moving = useRef(true);
  const { camera, size } = useThree();
  const preset = PRESETS[cameraMode] ?? PRESETS.aerial;
  const target = useMemo(() => new THREE.Vector3(...preset.target), [preset]);
  // Keep the desktop composition; portrait viewports need more distance for the
  // same horizontal field of view. Deriving this from the actual Canvas also
  // handles mobile fullscreen and narrow split views without remounting it.
  const aspect = size.width / Math.max(1, size.height);
  const framingScale = aspect < 1 ? Math.min(1.7, Math.sqrt(1.6 / aspect)) : 1;
  const destination = useMemo(() => new THREE.Vector3(...preset.position).sub(target).multiplyScalar(framingScale).add(target), [preset, target, framingScale]);
  const maxDistance = Math.max(33, destination.distanceTo(target) + 2);
  useEffect(() => { moving.current = true; }, [cameraMode, framingScale]);
  useFrame((_, delta) => {
    if (!controls.current || !moving.current) return;
    const factor = reducedMotion ? 1 : 1 - Math.exp(-delta * 3.6);
    camera.position.lerp(destination, factor); controls.current.target.lerp(target, factor);
    if (camera instanceof THREE.PerspectiveCamera) { camera.fov = THREE.MathUtils.lerp(camera.fov, preset.fov, factor); camera.updateProjectionMatrix(); }
    controls.current.update();
    if (camera.position.distanceToSquared(destination) < .002 && controls.current.target.distanceToSquared(target) < .002) moving.current = false;
  });
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.085} onStart={() => { moving.current = false; }} minDistance={2.5} maxDistance={maxDistance} maxPolarAngle={Math.PI * .485} minPolarAngle={.1} target={PRESETS.aerial.target} />;
}

function PowerStream({ from, to, active, reducedMotion, color = '#69dcca' }: { from: [number, number, number]; to: [number, number, number]; active: boolean; reducedMotion: boolean; color?: string }) {
  const mesh = useRef<THREE.Mesh>(null);
  const start = useMemo(() => new THREE.Vector3(...from), [from[0],from[1],from[2]]);
  const finish = useMemo(() => new THREE.Vector3(...to), [to[0],to[1],to[2]]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3([start, start.clone().lerp(finish,.45).add(new THREE.Vector3(0,.18,0)), finish]), [start,finish]);
  const linePoints=useMemo(()=>curve.getPoints(24),[curve]);
  useFrame(({ clock }) => { if (mesh.current && active && !reducedMotion) curve.getPoint((clock.elapsedTime * .22) % 1, mesh.current.position); });
  return <group><Line points={linePoints} color={active ? color : '#38504b'} lineWidth={active ? 1.05 : .55} transparent opacity={active ? .66 : .35} />{active && <mesh ref={mesh} position={start} visible={!reducedMotion}><sphereGeometry args={[.032,8,6]} /><meshBasicMaterial color={color} toneMapped={false}/></mesh>}</group>;
}

function Cable({ from, to, materials }: { from: [number,number,number]; to: [number,number,number]; materials: VillageMaterials }) {
  const geometry = useMemo(() => { const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to); return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,a.clone().lerp(b,.5).add(new THREE.Vector3(0,-.36,0)),b]),16,.011,5,false); }, [from[0],from[1],from[2],to[0],to[1],to[2]]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={materials.rubber} />;
}

function UtilityPole({ position, materials }: { position: [number,number,number]; materials: VillageMaterials }) {
  return <group position={position}>
    <mesh position={[0,1.7,0]} material={materials.concrete} castShadow><cylinderGeometry args={[.08,.125,3.6,12]} /></mesh>
    <mesh position={[0,3.25,0]} material={materials.steel} castShadow><boxGeometry args={[1.3,.065,.075]} /></mesh>
    {[-.5,0,.5].map(x=><group key={x} position={[x,3.31,0]}><mesh material={materials.paint}><cylinderGeometry args={[.04,.045,.15,10]} /></mesh>{[-.05,0,.05].map(y=><mesh key={y} position={[0,y,0]} material={materials.paint}><torusGeometry args={[.051,.008,5,10]} /></mesh>)}</group>)}
    <mesh position={[.105,1.3,0]} material={materials.steel}><boxGeometry args={[.08,.7,.28]} /></mesh>
  </group>;
}

function FallbackCabinet({ materials }: { materials:VillageMaterials }) {
  return <group><RoundedBox args={[.58,1.03,.42]} radius={.035} smoothness={2} position={[0,.515,0]} material={materials.paint} castShadow/><RoundedBox args={[.52,.91,.025]} radius={.018} smoothness={2} position={[0,.53,.221]} material={materials.paint} castShadow/>{[-.24,.24].map(x=><mesh key={x} position={[x,.52,.244]} material={materials.steel}><cylinderGeometry args={[.014,.014,.12,8]} /></mesh>)}<mesh position={[.17,.47,.245]} material={materials.rubber}><boxGeometry args={[.035,.13,.025]} /></mesh><mesh position={[0,1.048,0]} material={materials.steel}><boxGeometry args={[.66,.026,.5]} /></mesh></group>;
}

function NodeEquipment({ id, position, selected, active, offline, selectNode, materials, mode, batterySoc }: { id:NodeId;position:[number,number,number];selected:boolean;active:boolean;offline:boolean;selectNode:(id:NodeId)=>void;materials:VillageMaterials;mode:GridMode;batterySoc:number }) {
  const node = NODE_DEFINITIONS.find(n=>n.id===id)!;
  const color = !active ? '#b9a485' : mode === 'outage' ? '#e4b468' : '#68d7b7';
  const [hovered,setHovered] = useState(false);
  const isReserve = mode==='outage'&&active;
  const labelOffset:Record<NodeId,[number,number]>={P0:[27,-18],P1:[-18,22],P2:[23,-20],P3:[-39,-23]};
  const [labelX,labelY]=labelOffset[id];
  return <group position={position}>
    <mesh position={[0,-.04,0]} material={materials.concrete} receiveShadow><boxGeometry args={[.87,.12,.75]} /></mesh>
    <group rotation={[0,Math.PI,0]} onPointerOver={e=>{e.stopPropagation();setHovered(true);}} onPointerOut={()=>setHovered(false)} onClick={e=>{e.stopPropagation();if(e.delta<5) selectNode(id);}}>
      <AssetBoundary fallback={<FallbackCabinet materials={materials}/>}><Suspense fallback={<FallbackCabinet materials={materials}/>}><LicensedModel path="utility-box.glb" height={id==='P0'?1.1:.95}/></Suspense></AssetBoundary>
      <mesh position={[0,id==='P0'?.79:.69,.245]}><planeGeometry args={[.22,.095]}/><meshStandardMaterial color={active?'#154944':'#1c282a'} emissive={active?'#237967':'#000000'} emissiveIntensity={active?.55:0} roughness={.3}/></mesh>
      <mesh position={[-.17,id==='P0'?.98:.85,.237]}><sphereGeometry args={[.018,10,8]}/><meshStandardMaterial color={color} emissive={active?color:'#000000'} emissiveIntensity={active?2.4:0} toneMapped={false}/></mesh>
      <mesh position={[.17,id==='P0'?.98:.85,.239]}><sphereGeometry args={[.017,10,8]}/><meshStandardMaterial color={offline?'#e6a765':'#63a6b7'} emissive={active?(offline?'#e6a765':'#63a6b7'):'#000000'} emissiveIntensity={active?1.7:0} toneMapped={false}/></mesh>
      <mesh position={[.25,1.18,.07]} material={materials.rubber}><cylinderGeometry args={[.014,.019,.37,8]}/></mesh>
      {[-.16,.16].map(x=><mesh key={x} position={[x,.09,.04]} material={materials.rubber}><cylinderGeometry args={[.025,.025,.13,8]}/></mesh>)}
    </group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.028,0]}><ringGeometry args={[.53,selected?.564:.539,48]}/><meshBasicMaterial color={selected||hovered?'#8be4d0':'#6aa399'} transparent opacity={selected? .75:.25} toneMapped={false}/></mesh>
    <Html position={[0,1.45,0]} center distanceFactor={13} zIndexRange={[20,0]}><div style={{position:'relative'}}><svg aria-hidden="true" width="160" height="130" viewBox="-80 -65 160 130" style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%, -50%)',overflow:'visible',pointerEvents:'none'}}><line x1="0" y1="0" x2={labelX} y2={labelY} stroke={selected?'#a5dfcf':'#a2b6b6'} strokeWidth="1" opacity=".7"/><circle cx="0" cy="0" r="2" fill={color}/></svg><button className={`scene-node-tag ${selected?'selected':''}`} style={{transform:`translate(${labelX}px, ${labelY}px)`,minWidth:selected||hovered?72:52,minHeight:44,padding:selected||hovered?'7px 10px':'5px 7px',fontSize:selected||hovered?13:11}} aria-pressed={selected} aria-label={`${id} ${node.name} · ${active?'มีไฟ':'ตัดโหลด'} · ${offline?'ข้อมูลออฟไลน์':'ส่งข้อมูล'}`} onClick={()=>selectNode(id)} onFocus={()=>setHovered(true)} onBlur={()=>setHovered(false)} title={`${node.name} — ${node.description}`}><span>{id}</span><small style={{fontSize:selected||hovered?9:8}}>{active?isReserve?'BACKUP':selected||hovered?'POWER ON':'ON':'SHED'}{offline?' · NO DATA':''}</small>{(selected||hovered)&&<em style={{display:'block',fontStyle:'normal',fontSize:'10px',marginTop:'4px',opacity:.85,whiteSpace:'nowrap'}}>{node.name}</em>}</button></div></Html>
    {id==='P0'&&<group position={[.8,0,.12]}><RoundedBox args={[.48,.57,.34]} radius={.03} smoothness={2} position={[0,.3,0]} material={materials.rubber} castShadow/>{[-.13,.13].map(x=><mesh key={x} position={[x,.6,0]} material={materials.steel}><cylinderGeometry args={[.026,.026,.065,8]}/></mesh>)}<mesh position={[0,.35,-.179]}><planeGeometry args={[.31,.24]}/><meshStandardMaterial color="#d1cba9" roughness={.75}/></mesh><mesh position={[0,.49,-.185]}><planeGeometry args={[.26,.024]}/><meshStandardMaterial color="#4d8675" emissive="#5faa85" emissiveIntensity={batterySoc*.6}/></mesh></group>}
  </group>;
}

function SolarDemonstrator({ materials }: { materials:VillageMaterials }) {
  const cellGeometry=useMemo(()=>new THREE.BoxGeometry(1,1,1),[]);
  const cells=useMemo<Placement[]>(()=>Array.from({length:32},(_,i)=>({position:[-.64+(i%4)*.43,.035,-.7+Math.floor(i/4)*.2],scale:[.39,.026,.18]})),[]);
  useEffect(()=>()=>cellGeometry.dispose(),[cellGeometry]);
  return <group position={[-1.8,.45,-.8]}><group rotation={[-.3,0,0]}><mesh material={materials.steel} castShadow><boxGeometry args={[1.86,.055,1.7]}/></mesh><RepeatedParts geometry={cellGeometry} material={materials.glass} items={cells}/>{[-.87,.87].map(x=><mesh key={x} position={[x,.026,0]} material={materials.steel}><boxGeometry args={[.025,.045,1.68]}/></mesh>)}</group>{[-.75,.75].map(x=><mesh key={x} position={[x,-.13,.45]} material={materials.steel} castShadow><cylinderGeometry args={[.025,.025,.6,8]}/></mesh>)}</group>;
}

function WaterProbe({ materials }: { materials:VillageMaterials }) {
  return <group position={[4.03,0,-1.9]}><mesh position={[0,.58,0]} material={materials.steel}><cylinderGeometry args={[.029,.035,1.4,10]}/></mesh><RoundedBox args={[.17,.22,.1]} radius={.016} smoothness={2} position={[0,.98,.02]} material={materials.paint}/><mesh position={[0,-.25,0]} material={materials.steel}><cylinderGeometry args={[.058,.04,.36,12]}/></mesh><Cable from={[0,.84,0]} to={[-.6,.4,.4]} materials={materials}/></group>;
}

function WorkLight({ active, materials }: { active:boolean;materials:VillageMaterials }) {
  return <group position={[-3.8,0,-1.35]}><mesh position={[0,1.35,0]} material={materials.steel} castShadow><cylinderGeometry args={[.025,.035,2.7,10]}/></mesh><group position={[.24,2.65,0]} rotation={[-.26,0,0]}><RoundedBox args={[.38,.12,.22]} radius={.025} smoothness={2} material={materials.rubber}/><mesh position={[0,-.068,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.29,.14]}/><meshStandardMaterial color={active?'#ffe5b1':'#7a827b'} emissive={active?'#ffc76b':'#000000'} emissiveIntensity={active?2.4:0} toneMapped={false}/></mesh></group>{active&&<pointLight position={[.2,2.5,0]} color="#f3c887" intensity={6} distance={5} decay={2}/>}</group>;
}

function Shoreline({ materials }: { materials:VillageMaterials }) {
  const terrain=useMemo(()=>{const shape=new THREE.Shape();shape.moveTo(-200,-5.7);shape.bezierCurveTo(-22,-3.4,-9,-4.8,-2,-4);shape.bezierCurveTo(9,-3,20,-5.3,200,-5.7);shape.lineTo(200,-200);shape.lineTo(-200,-200);shape.closePath();const geometry=new THREE.ShapeGeometry(shape,24);geometry.rotateX(-Math.PI/2);return geometry;},[]);
  useEffect(()=>()=>terrain.dispose(),[terrain]);
  return <mesh geometry={terrain} position={[0,.03,0]} material={materials.sand} receiveShadow/>;
}

function VillageWorld({ materials, ...props }: SceneProps & {materials:VillageMaterials;mobile:boolean}) {
  const reducedMotion=props.reducedMotion??false;
  const nodes=NODE_DEFINITIONS.map(node=>({...node,active:activeLoad(node.id,props.mode,props.batterySoc,props.offline)}));
  const houses=useMemo(()=>[
    {position:[-6.2,.03,6.1] as [number,number,number],rotation:.04,size:.85},
    {position:[-10.5,.03,6.8] as [number,number,number],rotation:.09,size:.94},
    {position:[-2.2,.03,7.2] as [number,number,number],rotation:-.06,size:.82},
    {position:[2.3,.03,7.3] as [number,number,number],rotation:.07,size:.98},
    {position:[6.8,.03,6.5] as [number,number,number],rotation:-.14,size:.89},
    {position:[11.2,.03,7.2] as [number,number,number],rotation:-.1,size:.84},
    {position:[-6.5,.03,11.3] as [number,number,number],rotation:.2,size:.85},
    {position:[4.9,.03,11.8] as [number,number,number],rotation:-.2,size:.88},
  ],[]);
  return <>
    <LakeWater reducedMotion={reducedMotion} mobile={props.mobile}/><Shoreline materials={materials}/><DistantTreeLine/>
    {houses.map((house,i)=><DetailedHouse key={i} {...house} tone={['#cad7c3','#d8c9b2','#cbb4a5','#c4d4cb','#d3cfb3','#c9c3b3'][i%6]} materials={materials} lightsOn={activeLoad('P3',props.mode,props.batterySoc,props.offline)}/>)}
    {[[-13,0,8,1.25],[-8.9,0,10,.9],[-.5,0,11.1,1.02],[8.8,0,10.5,1.15],[14.3,0,8.5,1.1],[-18,0,12,1.05],[17.2,0,14.2,1.4]].map(([x,y,z,scale],i)=><PalmTree key={i} position={[x,y,z]} scale={scale} rotation={i*.8} materials={materials}/>)}
    <TimberJetty z={2.5} length={8.5} width={1.85} materials={materials}/>
    <TimberJetty z={-1.5} length={11.2} width={1.4} cross materials={materials}/>
    <TimberJetty x={4.5} z={-4.5} length={6.8} width={.6} materials={materials}/>
    <TimberJetty x={-3.4} z={.7} length={4.7} width={1} materials={materials}/>
    {[[2.9,-.03,-3.7],[6.05,-.03,-3.7],[2.9,-.03,-6.5],[6.05,-.03,-6.5],[8.9,-.03,-6.5],[8.9,-.03,-9.2]].map((position,i)=><RectangularCage key={i} position={position as [number,number,number]} materials={materials} reducedMotion={reducedMotion} scale={i===5?.92:1}/>)}
    <FishingBoat position={[-3.1,-.03,-5.6]} rotation={.2} materials={materials} reducedMotion={reducedMotion}/>
    <FishingBoat position={[1.05,-.03,-7.9]} rotation={.6} materials={materials} reducedMotion={reducedMotion} blue={false}/>
    <FishingBoat position={[9.2,-.03,-3.5]} rotation={-.22} materials={materials} reducedMotion={reducedMotion}/>
    <SolarDemonstrator materials={materials}/><WaterProbe materials={materials}/><WorkLight active={nodes.find(n=>n.id==='P2')!.active} materials={materials}/>
    {nodes.map(node=><NodeEquipment key={node.id} id={node.id} position={node.position} selected={props.selectedNode===node.id} active={node.active} offline={props.offline===node.id} selectNode={props.selectNode} materials={materials} mode={props.mode} batterySoc={props.batterySoc}/>)}
    <AssetBoundary fallback={null}><Suspense fallback={null}><LicensedModel path="portable-generator.glb" position={[1.35,.25,.58]} rotation={Math.PI*.25} height={.45}/></Suspense></AssetBoundary>
    {[[-5.5,0,1.35],[-.2,0,3.55],[5.15,0,3.5],[9.5,0,4.35]].map((position,i)=><UtilityPole key={i} position={position as [number,number,number]} materials={materials}/>)}
    <Cable from={[-5.5,3.39,1.35]} to={[-.2,3.39,3.55]} materials={materials}/><Cable from={[-.2,3.39,3.55]} to={[5.15,3.39,3.5]} materials={materials}/><Cable from={[5.15,3.39,3.5]} to={[9.5,3.39,4.35]} materials={materials}/>
    <PowerStream from={[0,.45,0]} to={[3.3,.45,-1.4]} active={nodes[1].active} reducedMotion={reducedMotion}/><PowerStream from={[0,.45,0]} to={[-3.4,.45,-1.4]} active={nodes[2].active} reducedMotion={reducedMotion} color="#f2c383"/><PowerStream from={[0,.45,0]} to={[-1.6,.45,2.4]} active={nodes[3].active} reducedMotion={reducedMotion} color="#b6c8c8"/>
  </>;
}

function FallbackWorld(props:SceneProps&{mobile:boolean}) {const materials=useVillageMaterials();return <VillageWorld {...props} materials={materials}/>;}

function RenderScene(props:SceneProps&{mobile:boolean;onContextLoss:()=>void}) {
  const {gl,scene}=useThree();
  useEffect(()=>{const canvas=gl.domElement;const lost=(event:Event)=>{event.preventDefault();props.onContextLoss();};canvas.addEventListener('webglcontextlost',lost,false);return ()=>canvas.removeEventListener('webglcontextlost',lost);},[gl,props.onContextLoss]);
  useEffect(()=>{scene.background=new THREE.Color('#a7bab5');scene.fog=new THREE.Fog('#a7bab5',34,93);return ()=>{scene.fog=null;};},[scene]);
  const post=props.quality==='high'&&!props.mobile;
  return <>
    <hemisphereLight args={['#b4cbd1','#665f49',.86]}/><ambientLight intensity={.12}/>
    <directionalLight color="#ffe5b3" position={[-16,18,-11]} intensity={3.15} castShadow shadow-mapSize={[props.mobile?1024:2048,props.mobile?1024:2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-camera-near={1} shadow-camera-far={65} shadow-bias={-.0003} shadow-normalBias={.035}/>
    <AssetBoundary fallback={null}><Suspense fallback={null}><Environment files={villageAsset('sky/kloppenheim_06_puresky_1k.hdr')} background environmentIntensity={.7} backgroundIntensity={.66} backgroundBlurriness={.035} environmentRotation={[0,.65,0]}/></Suspense></AssetBoundary>
    <AssetBoundary fallback={<FallbackWorld {...props}/>}><Suspense fallback={null}><TextureMaterials>{materials=><VillageWorld {...props} materials={materials}/>}</TextureMaterials></Suspense></AssetBoundary>
    <CameraRig cameraMode={props.cameraMode} reducedMotion={props.reducedMotion??false}/>
    {post&&<EffectComposer multisampling={0}><Bloom intensity={.16} luminanceThreshold={1.1} luminanceSmoothing={.25} mipmapBlur/><Vignette eskil={false} offset={.25} darkness={.22}/></EffectComposer>}
  </>;
}

export default function Scene3D(props:SceneProps) {
  const [mobile,setMobile]=useState(false),[contextLost,setContextLost]=useState(false);
  useEffect(()=>{const media=window.matchMedia('(max-width: 760px)');const update=()=>setMobile(media.matches);update();media.addEventListener('change',update);return ()=>media.removeEventListener('change',update);},[]);
  const loss=useMemo(()=>()=>setContextLost(true),[]);
  if(contextLost) return <SceneFallback/>;
  return <CanvasBoundary><Canvas shadows dpr={mobile?[.75,1]:[1,props.quality==='high'?1.5:1.25]} camera={{position:PRESETS.aerial.position,fov:43,near:.1,far:150}} gl={{antialias:true,powerPreference:mobile?'low-power':'high-performance',alpha:false}} fallback={<SceneFallback/>} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=.95;gl.outputColorSpace=THREE.SRGBColorSpace;gl.shadowMap.type=THREE.PCFShadowMap;}}><RenderScene {...props} mobile={mobile} onContextLoss={loss}/></Canvas></CanvasBoundary>;
}
