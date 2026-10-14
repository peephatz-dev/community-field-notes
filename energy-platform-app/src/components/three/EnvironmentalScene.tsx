'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SITE_WORLD, siteToWorld } from '@/lib/site-layout';
import { environmentReadout, seabedElevationAt, VERTICAL_SCALE, WATER_DATUM, type EnvironmentState } from '@/lib/environment-model';

export type EnvironmentalSceneProps = {
  environment:EnvironmentState;
  minute:number;
  running:boolean;
  playbackSpeed:number;
  mobile:boolean;
  reducedMotion:boolean;
};

const bounded=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

/** All geometry below is synthetic teaching geometry, not bathymetric survey data. */
function AssumedSeabed({environment,minute,mobile}:{environment:EnvironmentState;minute:number;mobile:boolean}) {
  const readout=environmentReadout(environment,minute);
  const waterLevel=environment.enabled?readout.waterLevel:0;
  const geometry=useMemo(()=>{
    const segments=mobile?32:64,positions:number[]=[],colors:number[]=[],uvs:number[]=[],indices:number[]=[];
    const shallow=new THREE.Color('#b7a978'),middle=new THREE.Color('#618d85'),deep=new THREE.Color('#264a5f'),color=new THREE.Color();
    for(let row=0;row<=segments;row++)for(let column=0;column<=segments;column++){
      const u=column/segments,v=row/segments,elevation=seabedElevationAt(u,v);
      const position=siteToWorld(u,v,WATER_DATUM+elevation*VERTICAL_SCALE);
      const depth=Math.max(0,waterLevel-elevation);
      color.copy(shallow).lerp(middle,bounded(depth/2,0,1)).lerp(deep,bounded((depth-2)/6,0,1));
      positions.push(...position);colors.push(color.r,color.g,color.b);uvs.push(u*12,v*18);
      if(row<segments&&column<segments){const a=row*(segments+1)+column,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1);}
    }
    const mesh=new THREE.BufferGeometry();mesh.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));mesh.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));mesh.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));mesh.setIndex(indices);mesh.computeVertexNormals();
    return mesh;
  },[mobile,waterLevel]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const point=siteToWorld(...environment.inspectPoint),bottom=WATER_DATUM+seabedElevationAt(...environment.inspectPoint)*VERTICAL_SCALE,top=WATER_DATUM+waterLevel*VERTICAL_SCALE;
  const line=useMemo(()=>new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(point[0],bottom,point[2]),new THREE.Vector3(point[0],top,point[2])]),[point[0],point[2],bottom,top]);
  useEffect(()=>()=>line.dispose(),[line]);
  return <group name="ASSUMED_BATHYMETRY_NOT_SURVEYED">
    <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors roughness={.98} metalness={0} side={THREE.DoubleSide}/></mesh>
    {environment.inspection&&<group>
      <lineSegments geometry={line}><lineBasicMaterial color="#f6d49b" depthTest={false} transparent opacity={.9}/></lineSegments>
      <mesh position={[point[0],bottom+.025,point[2]]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.25,.38,32]}/><meshBasicMaterial color="#f4c98b" side={THREE.DoubleSide} depthTest={false}/></mesh>
      <mesh position={[point[0],top+.035,point[2]]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.21,.28,32]}/><meshBasicMaterial color="#e8edf0" side={THREE.DoubleSide} depthTest={false}/></mesh>
    </group>}
  </group>;
}

function SyntheticWeather({environment,minute,running,playbackSpeed,mobile,reducedMotion}:EnvironmentalSceneProps) {
  const readout=environmentReadout(environment,minute),wind=readout.weather.wind,rain=readout.weather.rain;
  const windAngle=(readout.weather.windDirection-90)*Math.PI/180,windX=Math.cos(windAngle),windZ=Math.sin(windAngle);
  const cloud=bounded(readout.weather.cloud>1?readout.weather.cloud/100:readout.weather.cloud,0,1);
  const clouds=useRef<THREE.InstancedMesh>(null),drops=useRef<THREE.InstancedMesh>(null),phase=useRef(0);
  const maximumDrops=mobile?70:250,cloudCount=mobile?12:24;
  const resources=useMemo(()=>({
    cloud:new THREE.SphereGeometry(1,mobile?10:16,mobile?6:10),
    rain:new THREE.CylinderGeometry(.012,.012,1,3),
    transform:new THREE.Object3D(),
    cloudSeeds:Array.from({length:cloudCount},(_,i)=>({x:((i*17.173)%1)*SITE_WORLD.width-SITE_WORLD.width*.5,z:((i*31.781+.27)%1)*SITE_WORLD.depth-SITE_WORLD.depth*.5,y:22+(i%5)*1.7,scale:3+(i%4)*1.1})),
    rainSeeds:Array.from({length:maximumDrops},(_,i)=>({x:((i*19.827+.39)%1)*SITE_WORLD.width-SITE_WORLD.width*.45,z:((i*13.913+.21)%1)*SITE_WORLD.depth-SITE_WORLD.depth*.5,y:((i*23.431+.71)%1)*18})),
  }),[mobile,maximumDrops,cloudCount]);
  useEffect(()=>()=>{resources.cloud.dispose();resources.rain.dispose();},[resources]);
  useFrame((_,delta)=>{
    if(running&&!reducedMotion)phase.current+=Math.min(delta,.1)*Math.max(.1,playbackSpeed);
    const time=phase.current,transform=resources.transform;
    if(clouds.current){
      clouds.current.count=Math.ceil(cloudCount*cloud);
      resources.cloudSeeds.forEach((seed,index)=>{
        transform.position.set((((seed.x+time*wind*.055*windX+80)%160+160)%160)-80,seed.y,(((seed.z+time*wind*.055*windZ+90)%180+180)%180)-90);
        transform.rotation.set(0,index*.7,0);transform.scale.set(seed.scale*1.7,seed.scale*.32,seed.scale);
        transform.updateMatrix();clouds.current!.setMatrixAt(index,transform.matrix);
      });clouds.current.instanceMatrix.needsUpdate=true;
    }
    if(drops.current){
      drops.current.count=rain>0?Math.max(12,Math.ceil(maximumDrops*bounded(rain/35,.08,1))):0;
      resources.rainSeeds.forEach((seed,index)=>{
        const y=((seed.y-time*(8+wind*.1))%18+18)%18;
        transform.position.set(seed.x+(18-y)*wind*.035*windX,y,seed.z+(18-y)*wind*.035*windZ);
        transform.rotation.set(-Math.atan(wind*.035)*windZ,0,Math.atan(wind*.035)*windX);transform.scale.set(1,.55+bounded(rain/40,0,1)*.45,1);
        transform.updateMatrix();drops.current!.setMatrixAt(index,transform.matrix);
      });drops.current.instanceMatrix.needsUpdate=true;
    }
  });
  return <group name="SYNTHETIC_WEATHER_VISUALS">
    <instancedMesh ref={clouds} args={[resources.cloud,undefined,cloudCount]} frustumCulled={false}>
      <meshStandardMaterial color="#a7b2b7" roughness={1} transparent opacity={.7} depthWrite={false}/>
    </instancedMesh>
    <instancedMesh ref={drops} args={[resources.rain,undefined,maximumDrops]} frustumCulled={false}>
      <meshBasicMaterial color="#afcedd" transparent opacity={.52} depthWrite={false}/>
    </instancedMesh>
  </group>;
}

/** One line draw call; heading is relative to the diagram, not a surveyed bearing. */
function CurrentArrows({environment,minute,running,playbackSpeed,reducedMotion,mobile}:EnvironmentalSceneProps) {
  const line=useRef<THREE.LineSegments>(null),phase=useRef(0);
  const geometry=useMemo(()=>{
    const positions:number[]=[],heading=(environment.currentDirection-90)*Math.PI/180,dx=Math.cos(heading),dz=Math.sin(heading),length=.8+Math.min(1.7,environment.currentSpeed*1.4);
    const columns=mobile?4:7,rows=mobile?5:8;
    for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
      const u=.45+column/(columns-1)*.47,v=.08+row/(rows-1)*.85,point=siteToWorld(u,v);
      const endX=point[0]+dx*length,endZ=point[2]+dz*length;
      positions.push(point[0],0,point[2],endX,0,endZ,endX,0,endZ,endX-dx*.32-dz*.2,0,endZ-dz*.32+dx*.2,endX,0,endZ,endX-dx*.32+dz*.2,0,endZ-dz*.32-dx*.2);
    }
    const shape=new THREE.BufferGeometry();shape.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));return shape;
  },[environment.currentDirection,environment.currentSpeed,mobile]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const waterY=WATER_DATUM+(environment.enabled?environmentReadout(environment,minute).waterLevel:0)*VERTICAL_SCALE;
  useFrame((_,delta)=>{
    if(running&&!reducedMotion)phase.current+=Math.min(delta,.1)*playbackSpeed;
    if(line.current)line.current.position.y=waterY+.14+Math.sin(phase.current*.9)*.014;
  });
  return <lineSegments ref={line} geometry={geometry} position={[0,waterY+.14,0]} name="ASSUMED_CURRENT_DIRECTION"><lineBasicMaterial color="#9ce2ef" transparent opacity={.72} depthWrite={false}/></lineSegments>;
}

/** Rendering is opt-in so the original site reconstruction remains the default. */
export function EnvironmentalScene(props:EnvironmentalSceneProps) {
  const env = props.environment;
  const readout = environmentReadout(env, props.minute);
  const seabedVisible=env.inspection||env.layer==='depth';
  if(!env.enabled&&!seabedVisible&&!env.showCurrents)return null;
  const weatherVisible = env.enabled && (readout.rain > 0 || readout.cloud > 0.2);
  return (
    <group name="SYNTHETIC_ENVIRONMENT_SCENARIO">
      {seabedVisible ? <AssumedSeabed environment={env} minute={props.minute} mobile={props.mobile} /> : null}
      {weatherVisible ? <SyntheticWeather {...props} /> : null}
      {env.showCurrents ? <CurrentArrows {...props} /> : null}
    </group>
  );
}

export default EnvironmentalScene;
