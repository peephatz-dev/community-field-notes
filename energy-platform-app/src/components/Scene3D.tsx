'use client';

import { Environment, Line, OrbitControls, OrthographicCamera, PerspectiveCamera, PerformanceMonitor, RoundedBox } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { NODE_DEFINITIONS, activeLoad, type GridMode, type NodeId } from '@/lib/model';
import { CANDIDATE_NODES, SITE_WIDTH, SITE_DEPTH, siteToWorld } from '@/lib/site-layout';
import { LicensedModel, TextureMaterials, useVillageMaterials, villageAsset, type VillageMaterials } from './three/VillageAssets';
import { SiteEnvironment } from './three/SiteEnvironment';
import { SiteWater } from './three/VillageWater';
import { SiteLayers } from './three/SiteLayers';
import { SpatialHtml as Html } from './three/SpatialHtml';

export type SceneProps = {
 mode:GridMode; batterySoc:number; offline:NodeId|null; selectedNode:NodeId; selectNode:(id:NodeId)=>void;
 cameraMode:string; quality?:'balanced'|'high'; reducedMotion?:boolean; recoveryStage?:0|1|2;
 sensorFault?:boolean; waterShift?:boolean; cameraReset?:number;
 showOverlay?:boolean; overlayOpacity?:number; showLandmarks?:boolean; showZones?:boolean; showTopology?:boolean;
 onCameraSelect?:(mode:string)=>void;
};
type ViewPreset={position:[number,number,number];target:[number,number,number];fov:number};
const center=siteToWorld(.43,.5,0);
const around=(uv:readonly[number,number],offset:[number,number,number],height=.7,fov=44):ViewPreset=>{
 const target=siteToWorld(uv[0],uv[1],height);
 return {target,position:[target[0]+offset[0],target[1]+offset[1],target[2]+offset[2]],fov};
};
const PRESETS:Record<string,ViewPreset>={
 aerial:around([.37,.49],[54,40,15],0,40),
 top:around([.5,.5],[0,105,.001],0,43),
 pier:around([.46,.71],[12,9,15]),
 walk:around([.16,.48],[12,10,16]),
 aquaculture:around([.5,.33],[18,16,26]),
 transition:around([.65,.66],[15,13,17]),
 power:around([.35,.54],[31,31,40],.4,43),
 circuit:around(CANDIDATE_NODES.P0.uv,[3.6,3.2,4.7],.85,44),
 p1:around(CANDIDATE_NODES.P1.uv,[4.3,3.8,5.2],.85,44),
};
for(const id of ['P0','P1','P2','P3'] as NodeId[])PRESETS['focus-'+id]=around(CANDIDATE_NODES[id].uv,[4,3.4,5],.9);

class AssetBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return{failed:true};}
 render(){return this.state.failed?this.props.fallback:this.props.children;}
}
class CanvasBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return{failed:true};}
 render(){return this.state.failed?<SceneFallback/>:this.props.children;}
}
function SceneFallback(){return <div className="scene-webgl-fallback" role="status"><strong>มุมมอง 3D ไม่พร้อมบนอุปกรณ์นี้</strong><span>ใช้ผัง 2D เลือกโหนด หรือเปิดกราฟและสถานการณ์จำลองได้ต่อ</span><small>ลองเปิด WebGL หรือใช้เบราว์เซอร์ที่รองรับกราฟิก 3D</small></div>;}

function CameraRig({cameraMode,reducedMotion,reset=0}:{cameraMode:string;reducedMotion:boolean;reset?:number}){
 const controls=useRef<ComponentRef<typeof OrbitControls>>(null),moving=useRef(true);
 const {camera,size}=useThree();const top=cameraMode==='top';
 const aspect=size.width/Math.max(1,size.height);
 const preset=useMemo(()=>cameraMode==='aerial'&&aspect<1?around([.36,.48],[14,70,55],0,43):(PRESETS[cameraMode]??PRESETS.aerial),[cameraMode,aspect<1]);
 const target=useMemo(()=>new THREE.Vector3(...preset.target),[preset]);
 const framing=cameraMode==='aerial'&&aspect<1?1.06:aspect<1?Math.min(1.65,Math.sqrt(1.2/aspect)):1;
 const destination=useMemo(()=>new THREE.Vector3(...preset.position).sub(target).multiplyScalar(top?1:framing).add(target),[preset,target,framing,top]);
 const zoom=Math.min(size.width/(SITE_WIDTH*1.12),size.height/(SITE_DEPTH*1.12));
 useEffect(()=>{moving.current=true;},[cameraMode,reset,camera,framing]);
 useFrame((_,delta)=>{
  if(!controls.current||!moving.current)return;
  const factor=reducedMotion?1:1-Math.exp(-delta*2.5);
  camera.position.lerp(destination,factor);controls.current.target.lerp(target,factor);
  if(camera instanceof THREE.PerspectiveCamera)camera.fov=THREE.MathUtils.lerp(camera.fov,preset.fov,factor);
  if(camera instanceof THREE.OrthographicCamera)camera.zoom=THREE.MathUtils.lerp(camera.zoom,zoom,factor);
  camera.updateProjectionMatrix();controls.current.update();
  if(camera.position.distanceToSquared(destination)<.005&&controls.current.target.distanceToSquared(target)<.005)moving.current=false;
 });
 return <><PerspectiveCamera makeDefault={!top} position={PRESETS.aerial.position} fov={43} near={.08} far={400}/><OrthographicCamera makeDefault={top} position={PRESETS.top.position} up={[0,0,-1]} zoom={zoom} near={.1} far={350}/><OrbitControls ref={controls} makeDefault enableRotate={!top} enableDamping dampingFactor={.08} onStart={()=>{moving.current=false;}} minDistance={2} maxDistance={220} minZoom={.3} maxZoom={18} maxPolarAngle={top?Math.PI:Math.PI*.487} minPolarAngle={top?0:.02} target={center}/></>;
}
function PowerStream({from,to,active,reducedMotion,color='#69dcca'}:{from:[number,number,number];to:[number,number,number];active:boolean;reducedMotion:boolean;color?:string}){
 const mesh=useRef<THREE.Mesh>(null);
 const curve=useMemo(()=>{const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to);return new THREE.CatmullRomCurve3([a,a.clone().lerp(b,.5).add(new THREE.Vector3(0,2.2,0)),b]);},[from[0],from[1],from[2],to[0],to[1],to[2]]);
 const points=useMemo(()=>curve.getPoints(32),[curve]);
 useFrame(({clock})=>{if(mesh.current&&active&&!reducedMotion)curve.getPoint((clock.elapsedTime*.14)%1,mesh.current.position);});
 return <group><Line points={points} color={active?color:'#758078'} lineWidth={active?1.5:1} transparent opacity={active?.8:.45}/>{active&&<mesh ref={mesh} visible={!reducedMotion}><sphereGeometry args={[.08,8,6]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh>}</group>;
}
function FallbackCabinet({ materials }: { materials:VillageMaterials }) {
  return <group><RoundedBox args={[.58,1.03,.42]} radius={.035} smoothness={2} position={[0,.515,0]} material={materials.paint} castShadow/><RoundedBox args={[.52,.91,.025]} radius={.018} smoothness={2} position={[0,.53,.221]} material={materials.paint} castShadow/>{[-.24,.24].map(x=><mesh key={x} position={[x,.52,.244]} material={materials.steel}><cylinderGeometry args={[.014,.014,.12,8]} /></mesh>)}<mesh position={[.17,.47,.245]} material={materials.rubber}><boxGeometry args={[.035,.13,.025]} /></mesh><mesh position={[0,1.048,0]} material={materials.steel}><boxGeometry args={[.66,.026,.5]} /></mesh></group>;
}

function NodeEquipment({ id, position, selected, active, offline, selectNode, materials, mode, batterySoc, sensorFault=false, waterShift=false }: { id:NodeId;position:[number,number,number];selected:boolean;active:boolean;offline:boolean;selectNode:(id:NodeId)=>void;materials:VillageMaterials;mode:GridMode;batterySoc:number;sensorFault?:boolean;waterShift?:boolean }) {
  const node = NODE_DEFINITIONS.find(n=>n.id===id)!;
  const color = !active ? '#b9a485' : id==='P1'&&(sensorFault||waterShift)?'#e8b873':mode === 'outage' ? '#e4b468' : '#68d7b7';
  const [hovered,setHovered] = useState(false);
  const isReserve = mode==='outage'&&active;
  const labelOffset:Record<NodeId,[number,number]>={P0:[24,35],P1:[8,-35],P2:[12,-50],P3:[38,20]};
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
    <Html position={[0,1.45,0]} center  zIndexRange={[20,0]}><div style={{position:'relative'}}><svg aria-hidden="true" width="160" height="130" viewBox="-80 -65 160 130" style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%, -50%)',overflow:'visible',pointerEvents:'none'}}><line x1="0" y1="0" x2={labelX} y2={labelY} stroke={selected?'#a5dfcf':'#a2b6b6'} strokeWidth="1" opacity=".7"/><circle cx="0" cy="0" r="2" fill={color}/></svg><button className={`scene-node-tag ${selected?'selected':''}`} style={{transform:`translate(${labelX}px, ${labelY}px)`,minWidth:selected||hovered?96:76,minHeight:44,padding:selected||hovered?'7px 10px':'5px 7px',fontSize:selected||hovered?13:11}} aria-pressed={selected} aria-label={`${id} PROPOSED ${node.name} · ${active?'มีไฟ':'ตัดโหลด'} · ${offline?'ข้อมูลออฟไลน์':'ส่งข้อมูล'}`} onClick={()=>selectNode(id)} onFocus={()=>setHovered(true)} onBlur={()=>setHovered(false)} title={`${node.name} — ${node.description}`}><span>{id}</span><i className="node-proposed">PROPOSED</i><small style={{fontSize:selected||hovered?9:8}}>{id==='P1'&&active&&sensorFault?'SENSOR FAULT':id==='P1'&&active&&waterShift?'WATER DEMO':active?isReserve?'BACKUP':selected||hovered?'POWER ON':'ON':'SHED'}{offline?' · NO DATA':''}</small>{(selected||hovered)&&<em style={{display:'block',fontStyle:'normal',fontSize:'10px',marginTop:'4px',opacity:.85,whiteSpace:'normal',maxWidth:'126px'}}>{node.name}</em>}</button></div></Html>
    {id==='P1'&&<group position={[.72,0,.1]}><mesh position={[0,.4,0]} material={materials.steel}><cylinderGeometry args={[.018,.024,1.4,12]}/></mesh><RoundedBox position={[0,.94,0]} args={[.18,.24,.14]} radius={.02} smoothness={3} material={materials.paint}/><mesh position={[0,-.29,0]} material={materials.steel}><cylinderGeometry args={[.045,.035,.35,16]}/></mesh><mesh position={[.17,-.25,0]} material={materials.rubber}><cylinderGeometry args={[.035,.035,.28,12]}/></mesh></group>}
    {id==='P0'&&<group position={[.8,0,.12]}><RoundedBox args={[.48,.57,.34]} radius={.03} smoothness={2} position={[0,.3,0]} material={materials.rubber} castShadow/>{[-.13,.13].map(x=><mesh key={x} position={[x,.6,0]} material={materials.steel}><cylinderGeometry args={[.026,.026,.065,8]}/></mesh>)}<mesh position={[0,.35,-.179]}><planeGeometry args={[.31,.24]}/><meshStandardMaterial color="#d1cba9" roughness={.75}/></mesh><mesh position={[0,.49,-.185]}><planeGeometry args={[.26,.024]}/><meshStandardMaterial color="#4d8675" emissive="#5faa85" emissiveIntensity={batterySoc*.6}/></mesh></group>}
  </group>;
}


function SiteWorld({materials,...props}:SceneProps&{materials:VillageMaterials;mobile:boolean}){
 const nodeOn=(id:NodeId)=>activeLoad(id,props.mode,props.batterySoc,props.offline,props.recoveryStage??2);
 const height=(id:NodeId):[number,number,number]=>{const p=CANDIDATE_NODES[id].position;return [p[0],p[1]+.65,p[2]];};
 return <><SiteWater reducedMotion={props.reducedMotion} mobile={props.mobile} quality={props.quality}/><SiteEnvironment materials={materials} mobile={props.mobile} quality={props.quality} reducedMotion={props.reducedMotion} householdLightsOn={nodeOn('P3')}/>
 {NODE_DEFINITIONS.map(node=><NodeEquipment key={node.id} id={node.id} position={CANDIDATE_NODES[node.id].position} selected={props.selectedNode===node.id} active={nodeOn(node.id)} offline={props.offline===node.id} selectNode={props.selectNode} materials={materials} mode={props.mode} batterySoc={props.batterySoc} sensorFault={props.sensorFault} waterShift={props.waterShift}/>)}
 {props.showTopology&&(['P1','P2','P3'] as NodeId[]).map(id=><PowerStream key={id} from={height('P0')} to={height(id)} active={nodeOn(id)} reducedMotion={!!props.reducedMotion} color={props.mode==='outage'?'#edbd78':id==='P1'?'#6de0c4':id==='P2'?'#9fbfeb':'#b5c6c2'}/>)}
 <SiteLayers overlay={!!props.showOverlay} opacity={props.overlayOpacity??.6} landmarks={!!props.showLandmarks} zones={!!props.showZones} onCameraSelect={props.onCameraSelect}/>
 </>;
}
function FallbackWorld(props:SceneProps&{mobile:boolean}){const materials=useVillageMaterials();return <SiteWorld {...props} materials={materials}/>;}
function RenderScene(props:SceneProps&{mobile:boolean;degraded:boolean;onContextLoss:()=>void;onDecline:()=>void}){
 const {gl,scene}=useThree();
 useEffect(()=>{const canvas=gl.domElement;const lost=(event:Event)=>{event.preventDefault();props.onContextLoss();};canvas.addEventListener('webglcontextlost',lost);return()=>canvas.removeEventListener('webglcontextlost',lost);},[gl,props.onContextLoss]);
 useEffect(()=>{scene.fog=new THREE.Fog('#adbdba',85,240);scene.background=new THREE.Color('#adbdba');return()=>{scene.fog=null;};},[scene]);
 const post=props.quality==='high'&&!props.mobile&&!props.degraded;
 return <><hemisphereLight args={['#d1e0dd','#756953',.75]}/><ambientLight intensity={.1}/><directionalLight color="#fff0d3" position={[-45,65,-25]} intensity={3} castShadow shadow-mapSize={[props.mobile||props.degraded?1024:2048,props.mobile||props.degraded?1024:2048]} shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={48} shadow-camera-bottom={-48} shadow-camera-near={1} shadow-camera-far={150} shadow-bias={-.00015} shadow-normalBias={.03} shadow-radius={3}/>
 <AssetBoundary fallback={null}><Suspense fallback={null}><Environment files={villageAsset('sky/kloppenheim_06_puresky_1k.hdr')} background environmentIntensity={.7} backgroundIntensity={.68} backgroundBlurriness={.055}/></Suspense></AssetBoundary>
 <AssetBoundary fallback={<FallbackWorld {...props}/>}><Suspense fallback={null}><TextureMaterials>{materials=><SiteWorld {...props} materials={materials}/>}</TextureMaterials></Suspense></AssetBoundary>
 <CameraRig cameraMode={props.cameraMode} reducedMotion={!!props.reducedMotion} reset={props.cameraReset}/>
 <PerformanceMonitor bounds={()=>[24,50]} iterations={6} ms={300} flipflops={2} onDecline={props.onDecline} onFallback={props.onDecline}/>
 {post&&<EffectComposer multisampling={0}><Bloom intensity={.14} luminanceThreshold={1.2} mipmapBlur/><Vignette eskil={false} offset={.2} darkness={.15}/></EffectComposer>}
 </>;
}
export default function Scene3D(props:SceneProps){
 const [mobile,setMobile]=useState(false),[lost,setLost]=useState(false),[degraded,setDegraded]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(max-width:760px)');const update=()=>setMobile(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 const loss=useMemo(()=>()=>setLost(true),[]),decline=useMemo(()=>()=>setDegraded(true),[]);
 if(lost)return <SceneFallback/>;
 return <CanvasBoundary><Canvas shadows dpr={mobile?[.75,1]:degraded?1:[1,props.quality==='high'?1.5:1.25]} camera={{position:PRESETS.aerial.position,fov:43,near:.08,far:400}} gl={{antialias:true,powerPreference:mobile?'low-power':'high-performance',alpha:false}} fallback={<SceneFallback/>} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1;gl.outputColorSpace=THREE.SRGBColorSpace;gl.shadowMap.type=THREE.PCFShadowMap;}}><RenderScene {...props} mobile={mobile} degraded={degraded} onContextLoss={loss} onDecline={decline}/></Canvas></CanvasBoundary>;
}
