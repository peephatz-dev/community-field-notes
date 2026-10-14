'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RepeatedParts, type Placement, type VillageMaterials } from './VillageAssets';
import { SITE_LAYOUT, SITE_WIDTH, footprintCorners, siteToWorld, type SiteFootprint } from '@/lib/site-layout';

type XZ = [number, number];
type Footprint = { center: XZ; length: number; width: number; yaw: number };
type Batch = { geometry: THREE.BufferGeometry; material: THREE.Material; items: Placement[]; castShadow?: boolean };

const yawFromDirection = (dx: number, dz: number) => Math.atan2(-dz, dx);
const localPoint = (frame: Footprint, x: number, z: number, y = 0): [number,number,number] => [frame.center[0] + Math.cos(frame.yaw)*x + Math.sin(frame.yaw)*z, y, frame.center[1] - Math.sin(frame.yaw)*x + Math.cos(frame.yaw)*z];

function footprintFrame(corners: XZ[]): Footprint {
  const first=corners[0],edgeA=[corners[1][0]-first[0],corners[1][1]-first[1]],edgeB=[corners[3][0]-first[0],corners[3][1]-first[1]];
  const lengthA=Math.hypot(...edgeA),lengthB=Math.hypot(...edgeB);
  const lengthEdge=lengthA>=lengthB?edgeA:edgeB;
  return {center:[corners.reduce((n,p)=>n+p[0],0)/corners.length,corners.reduce((n,p)=>n+p[1],0)/corners.length],length:Math.max(lengthA,lengthB),width:Math.min(lengthA,lengthB),yaw:yawFromDirection(lengthEdge[0],lengthEdge[1])};
}

function corrugatedRoof(style:'gable'|'shed') {
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  const segments=64;
  for(let i=0;i<=segments;i++)for(const z of [-.5,0,.5]) {
    const x=i/segments-.5;
    const slope=style==='gable'?.25-Math.abs(z)*.5:.12-z*.2;
    positions.push(x,slope+Math.cos(i*Math.PI)*.008,z);uv.push(i/segments,z+.5);
  }
  for(let i=0;i<segments;i++)for(let strip=0;strip<2;strip++){const a=i*3+strip;indices.push(a,a+1,a+3,a+1,a+4,a+3);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

function fishingHull() {
  const vertices:number[]=[],uv:number[]=[],indices:number[]=[];
  const lengthSteps=24,curveSteps=12;
  for(let i=0;i<=lengthSteps;i++){const t=i/lengthSteps,width=Math.pow(Math.sin(Math.min(.999,Math.max(.001,t))*Math.PI),.62)*.63,lift=.23*Math.pow(Math.abs(t-.5)*2,3);
    for(let j=0;j<=curveSteps;j++){const a=j/curveSteps*Math.PI;vertices.push(Math.cos(a)*width,.38-Math.sin(a)*.4+lift,(t-.5)*3.9);uv.push(j/curveSteps,t*2);}
  }
  for(let i=0;i<lengthSteps;i++)for(let j=0;j<curveSteps;j++){const a=i*(curveSteps+1)+j,b=a+curveSteps+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

function netTexture() {
  // Original periodic diamond weave; no DOM canvas or borrowed photographic pixels.
  const size=64,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const forward=(x+y)%16,backward=(x-y+size)%16;
    const thread=forward<2||backward<2?255:0,index=(y*size+x)*4;
    data[index]=data[index+1]=data[index+2]=thread;data[index+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(5,2);texture.colorSpace=THREE.NoColorSpace;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
  return texture;
}

function polygonGeometry(points:XZ[]) {
  const shape=new THREE.Shape();points.forEach((point,i)=>i?shape.lineTo(point[0],-point[1]):shape.moveTo(point[0],-point[1]));shape.closePath();
  const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);
  const uv=geometry.getAttribute('uv');const positions=geometry.getAttribute('position');
  const bounds=new THREE.Box3().setFromBufferAttribute(positions as THREE.BufferAttribute);const width=Math.max(.1,bounds.max.x-bounds.min.x),depth=Math.max(.1,bounds.max.z-bounds.min.z);
  for(let i=0;i<uv.count;i++)uv.setXY(i,(positions.getX(i)-bounds.min.x)/width,(positions.getZ(i)-bounds.min.z)/depth);
  return geometry;
}

function ribbonGeometry(points:XZ[],width:number) {
  const vertices:number[]=[],uv:number[]=[],indices:number[]=[];let distance=0;
  points.forEach((point,i)=>{const prior=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-prior[0],dz=next[1]-prior[1],length=Math.max(.001,Math.hypot(dx,dz));const nx=-dz/length*width/2,nz=dx/length*width/2;
    if(i)distance+=Math.hypot(point[0]-prior[0],point[1]-prior[1]);vertices.push(point[0]+nx,0,point[1]+nz,point[0]-nx,0,point[1]-nz);uv.push(0,distance/4,1,distance/4);if(i){const a=(i-1)*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}});
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

function plankSegment(items:Placement[],a:XZ,b:XZ,width:number,quality:'balanced'|'high') {
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),yaw=yawFromDirection(dx,dz);
  const frame:Footprint={center:[(a[0]+b[0])/2,(a[1]+b[1])/2],length,width,yaw};
  const spacing=quality==='high'?.22:.32,count=Math.ceil(length/spacing);
  for(let i=0;i<count;i++)items.push({position:localPoint(frame,-length/2+(i+.5)*length/count,0,.18),rotation:[0,yaw,0],scale:[length/count*.965,.085,width]});
  return frame;
}

const worldXZ = (u:number,v:number):XZ => {const point=siteToWorld(u,v);return [point[0],point[2]];};
const tracedFrame = (footprint:SiteFootprint) => footprintFrame(footprintCorners(footprint).map(point=>worldXZ(...point)));

function palmFrond() {
  const positions:number[]=[],indices:number[]=[];
  const curve=(t:number)=>.65*Math.sin(t*Math.PI)-t*.6;
  const leaf=(points:number[][])=>{const offset=positions.length/3;points.forEach(point=>positions.push(...point));indices.push(offset,offset+1,offset+2,offset,offset+2,offset+3);};
  for(let i=0;i<24;i++){const t=i/24,next=(i+1)/24;leaf([[t*2.3,curve(t),-.014],[t*2.3,curve(t),.014],[next*2.3,curve(next),.011],[next*2.3,curve(next),-.011]]);}
  for(let i=2;i<23;i++){const t=i/24,width=Math.pow(Math.sin(Math.PI*t),.7)*.42;for(const side of [-1,1]){const x=t*2.3,y=curve(t);leaf([[x,y,0],[x+.02,y,.035*side],[x+.16,y-.08,width*side],[x+.1,y-.06,width*.97*side]]);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

function foliageTexture() {
  const size=128,data=new Uint8Array(size*size*4);let seed=1783;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<600;i++){
    const angle=random()*Math.PI*2,radius=Math.sqrt(random());
    const cx=64+Math.cos(angle)*radius*56,cy=61+Math.sin(angle)*radius*47,rx=2+random()*5,ry=2+random()*3;
    const leafAngle=random()*Math.PI,cos=Math.cos(leafAngle),sin=Math.sin(leafAngle);
    const red=62+Math.floor(random()*30),green=83+Math.floor(random()*36),blue=51+Math.floor(random()*26);
    const bound=Math.ceil(Math.max(rx,ry));
    for(let y=Math.max(0,Math.floor(cy-bound));y<=Math.min(size-1,Math.ceil(cy+bound));y++)for(let x=Math.max(0,Math.floor(cx-bound));x<=Math.min(size-1,Math.ceil(cx+bound));x++){
      const dx=x-cx,dy=y-cy,lx=(dx*cos+dy*sin)/rx,ly=(-dx*sin+dy*cos)/ry;
      if(lx*lx+ly*ly>1)continue;const index=(y*size+x)*4;
      data[index]=red;data[index+1]=green;data[index+2]=blue;data[index+3]=255;
    }
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
  return texture;
}

export type SiteEnvironmentProps = {
  materials:VillageMaterials;
  mobile?:boolean;
  quality?:'balanced'|'high';
  reducedMotion?:boolean;
  householdLightsOn?:boolean;
};

/** Placement is entirely image-relative shared trace; vertical dimensions remain reconstruction choices. */
export function SiteEnvironment({materials,mobile=false,quality='balanced',householdLightsOn=true}:SiteEnvironmentProps) {
  const detail=mobile?'balanced':quality;
  const resources=useMemo(()=>{
    const unit=new THREE.BoxGeometry(1,1,1),plane=new THREE.PlaneGeometry(1,1),post=new THREE.CylinderGeometry(1,1,1,8),barrel=new THREE.CylinderGeometry(1,1,1,12);
    const cageNet=netTexture(),foliage=foliageTexture();
    const roofMaterial=materials.roof.clone();roofMaterial.color.set('#d4d1c7');
    const sidingMaterial=materials.wood.clone();sidingMaterial.color.set('#e2d8c9');
    const hullMaterial=materials.wood.clone();hullMaterial.color.set('#dedbd1');hullMaterial.side=THREE.DoubleSide;
    const netMaterial=new THREE.MeshStandardMaterial({color:'#182b25',alphaMap:cageNet,alphaTest:.36,roughness:1,side:THREE.DoubleSide});
    const leafMaterial=new THREE.MeshStandardMaterial({color:'#d2d5bd',map:foliage,alphaTest:.45,side:THREE.DoubleSide,roughness:1});
    const roofGable=corrugatedRoof('gable'),roofShed=corrugatedRoof('shed'),hull=fishingHull();
    const trunk=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.06,1.8,0),new THREE.Vector3(.28,3.7,.09),new THREE.Vector3(.42,5.4,.12)]),10,.12,8,false);
    const frond=palmFrond();
    const gunwales=[-1,1].map(side=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length:25},(_,i)=>{const t=i/24;return new THREE.Vector3(side*Math.pow(Math.sin(Math.min(.999,Math.max(.001,t))*Math.PI),.62)*.63,.4+.23*Math.pow(Math.abs(t-.5)*2,3),(t-.5)*3.9);})),28,.025,5,false));
    const roadMaterial=new THREE.MeshStandardMaterial({color:'#988f76',roughness:.98});
    const bankMaterial=materials.sand.clone();bankMaterial.color.set('#a6ab8f');
    return {unit,plane,post,barrel,roofMaterial,sidingMaterial,hullMaterial,netMaterial,leafMaterial,roofGable,roofShed,hull,trunk,frond,gunwales,cageNet,foliage,roadMaterial,bankMaterial};
  },[materials]);

  const site=useMemo(()=>{
    const batches:Batch[]=[];
    const cageBeams:Placement[]=[],cagePosts:Placement[]=[],floatDrums:Placement[]=[],netWalls:Placement[]=[],netBottom:Placement[]=[];
    SITE_LAYOUT.cageCells.forEach((cell,index)=>{
      const frame=tracedFrame(cell),{length,width,yaw}=frame;
      for(const side of [-1,1]){
        cageBeams.push({position:localPoint(frame,0,side*width/2,.07),rotation:[0,yaw,0],scale:[length,.065,.072]});
        cageBeams.push({position:localPoint(frame,side*length/2,0,.07),rotation:[0,yaw,0],scale:[.072,.065,width]});
        netWalls.push({position:localPoint(frame,0,side*width/2,-.3),rotation:[0,yaw,0],scale:[length,.72,1]});
        netWalls.push({position:localPoint(frame,side*length/2,0,-.3),rotation:[0,yaw+Math.PI/2,0],scale:[width,.72,1]});
        for(const end of [-1,1])cagePosts.push({position:localPoint(frame,end*length/2,side*width/2,.27),scale:[.026,.55,.026]});
        // Barrel floats sit on alternating divisions; duplication is a reconstruction detail, not a verified quantity.
        if(index%2===0)floatDrums.push({position:localPoint(frame,0,side*width*.5,-.11),rotation:[Math.PI/2,yaw,0],scale:[.13,.43,.13],color:index%4?'#3c7286':'#8e9e96'});
      }
      if(!mobile)netBottom.push({position:localPoint(frame,0,0,-.66),rotation:[-Math.PI/2,0,yaw],scale:[length,width,1]});
    });
    batches.push({geometry:resources.unit,material:materials.darkWood,items:cageBeams},{geometry:resources.post,material:materials.darkWood,items:cagePosts},{geometry:resources.barrel,material:materials.blue,items:floatDrums,castShadow:false},{geometry:resources.plane,material:resources.netMaterial,items:netWalls,castShadow:false},{geometry:resources.plane,material:resources.netMaterial,items:netBottom,castShadow:false});

    const dockBoards:Placement[]=[],dockSupports:Placement[]=[],dockBeams:Placement[]=[];
    SITE_LAYOUT.piers.forEach(pier=>{const points=pier.points.map(point=>worldXZ(...point)),width=pier.width*SITE_WIDTH;
      for(let i=1;i<points.length;i++){const frame=plankSegment(dockBoards,points[i-1],points[i],width,detail),count=Math.max(2,Math.ceil(frame.length/1.35));
        for(const side of [-1,1]){dockBeams.push({position:localPoint(frame,0,side*width*.4,.12),rotation:[0,frame.yaw,0],scale:[frame.length,.11,.085]});
          for(let postIndex=0;postIndex<=count;postIndex++)dockSupports.push({position:localPoint(frame,-frame.length/2+postIndex/count*frame.length,side*width*.38,-.12),scale:[.045,.82,.045]});
        }
      }
    });
    batches.push({geometry:resources.unit,material:materials.wood,items:dockBoards},{geometry:resources.post,material:materials.darkWood,items:dockSupports},{geometry:resources.unit,material:materials.darkWood,items:dockBeams});

    const foundations:Placement[]=[],walls:Placement[]=[],wallSlats:Placement[]=[],gableRoofs:Placement[]=[],shedRoofs:Placement[]=[],roofRidges:Placement[]=[],windowFrames:Placement[]=[],windows:Placement[]=[],buildingPosts:Placement[]=[],doorSteps:Placement[]=[];
    const roofTones:Record<string,string>={metal:'#a8aaa4',pale:'#c4c4b2',red:'#a96b5b',blue:'#617a8d'};
    SITE_LAYOUT.buildings.forEach((building,index)=>{
      const frame=tracedFrame(building),height=1.05+(index%3)*.13,base=.29,top=base+height;
      foundations.push({position:localPoint(frame,0,0,.17),rotation:[0,frame.yaw,0],scale:[frame.length*1.06,.14,frame.width*1.06]});
      walls.push({position:localPoint(frame,0,0,base+height/2),rotation:[0,frame.yaw,0],scale:[frame.length*.97,height,frame.width*.97],color:['#bfc5b1','#b7c4b7','#ccbea9','#c9b2a5'][index%4]});
      const roof={position:localPoint(frame,0,0,top),rotation:[0,frame.yaw,0] as [number,number,number],scale:[frame.length*1.12,frame.width*1.45,frame.width*1.12] as [number,number,number],color:roofTones[building.kind??'metal']};
      (index%5===0?shedRoofs:gableRoofs).push(roof);
      if(index%5!==0)roofRidges.push({position:localPoint(frame,0,0,top+frame.width*.36),rotation:[0,frame.yaw,0],scale:[frame.length*1.14,.075,.065]});
      const slatCount=Math.max(4,Math.ceil(height/.15));
      if(detail==='high')for(let slat=0;slat<slatCount;slat++)for(const side of [-1,1])wallSlats.push({position:localPoint(frame,0,side*frame.width*.493,base+(slat+.5)*height/slatCount),rotation:[0,frame.yaw,0],scale:[frame.length,.02,.025]});
      for(const side of [-1,1])for(const end of [-1,1])buildingPosts.push({position:localPoint(frame,end*frame.length*.43,side*frame.width*.41,-.01),scale:[.04,.46,.04]});
      for(const side of [-1,1]){
        const position=localPoint(frame,side*frame.length*.25,-frame.width*.503,base+height*.59);
        windowFrames.push({position,rotation:[0,frame.yaw,0],scale:[Math.min(.46,frame.length*.18),.44,.035]});
        windows.push({position:localPoint(frame,side*frame.length*.25,-frame.width*.522,base+height*.59),rotation:[0,frame.yaw+Math.PI,0],scale:[Math.min(.39,frame.length*.15),.35,1]});
      }
      doorSteps.push({position:localPoint(frame,0,-frame.width*.56,.22),rotation:[0,frame.yaw,0],scale:[.47,.15,.28]});
    });
    batches.push({geometry:resources.unit,material:materials.concrete,items:foundations},{geometry:resources.unit,material:resources.sidingMaterial,items:walls},{geometry:resources.unit,material:materials.darkWood,items:wallSlats},{geometry:resources.roofGable,material:resources.roofMaterial,items:gableRoofs},{geometry:resources.roofShed,material:resources.roofMaterial,items:shedRoofs},{geometry:resources.unit,material:materials.steel,items:roofRidges},{geometry:resources.post,material:materials.darkWood,items:buildingPosts},{geometry:resources.unit,material:materials.darkWood,items:windowFrames},{geometry:resources.unit,material:materials.concrete,items:doorSteps});

    const boatHulls:Placement[]=[],gunwales:Placement[]=[],benches:Placement[]=[],boatEngines:Placement[]=[],boatBuckets:Placement[]=[];
    SITE_LAYOUT.boats.forEach((boat,index)=>{const frame=tracedFrame(boat),rotation=frame.yaw+Math.PI/2,scale:[number,number,number]=[frame.width/1.26,Math.max(.35,frame.width/1.26),frame.length/3.9];
      const item:Placement={position:localPoint(frame,0,0,-.1),rotation:[0,rotation,0],scale,color:['#466979','#837967','#697e83'][index%3]};boatHulls.push(item);gunwales.push({...item,color:undefined});
      for(const t of [-.28,0,.28])benches.push({position:localPoint(frame,frame.length*t,0,.17),rotation:[0,frame.yaw,0],scale:[.11,.04,frame.width*.86]});
      boatEngines.push({position:localPoint(frame,frame.length*.32,0,.23),rotation:[0,frame.yaw,0],scale:[.18,.19,.2]});
      boatBuckets.push({position:localPoint(frame,-frame.length*.15,frame.width*.15,.21),scale:[.065,.14,.065]});
    });
    batches.push({geometry:resources.hull,material:resources.hullMaterial,items:boatHulls},{geometry:resources.gunwales[0],material:materials.darkWood,items:gunwales},{geometry:resources.gunwales[1],material:materials.darkWood,items:gunwales},{geometry:resources.unit,material:materials.wood,items:benches},{geometry:resources.unit,material:materials.rubber,items:boatEngines},{geometry:resources.barrel,material:materials.paint,items:boatBuckets});

    const trunks:Placement[]=[],fronds:Placement[]=[],canopies:Placement[]=[];
    const offsets=[[-.32,-.28],[.24,-.18],[-.18,.28],[.33,.24],[0,0]];
    SITE_LAYOUT.vegetation.forEach((patch,patchIndex)=>{const frame=tracedFrame(patch),count=mobile?3:5;
      offsets.slice(0,count).forEach(([x,z],treeIndex)=>{const position=localPoint(frame,x*frame.length,z*frame.width,.02),scale=.54+(treeIndex%3)*.07;
        if(patch.kind==='palm-patch'){trunks.push({position,scale:[scale,scale,scale]});
          for(let leaf=0;leaf<7;leaf++)fronds.push({position:[position[0]+.42*scale,position[1]+5.4*scale,position[2]+.12*scale],rotation:[(leaf%2)*.08,leaf*Math.PI*2/7+patchIndex*.45,-.12],scale:[scale,scale,scale],color:leaf%3?'#64734d':'#88905a'});
        }else for(let side=0;side<2;side++)canopies.push({position:[position[0],1.7+treeIndex*.07,position[2]],rotation:[0,side*Math.PI/2+frame.yaw,0],scale:[2.2+treeIndex*.08,2.8,1]});
      });
    });
    batches.push({geometry:resources.trunk,material:materials.darkWood,items:trunks},{geometry:resources.frond,material:materials.leafLight,items:fronds},{geometry:resources.plane,material:resources.leafMaterial,items:canopies,castShadow:false});

    const shore=SITE_LAYOUT.shoreline.map(point=>worldXZ(...point));
    const mooringPositions:number[]=[];
    SITE_LAYOUT.boats.forEach(boat=>{const center=worldXZ(...boat.center);const anchor=shore.reduce((nearest,point)=>Math.hypot(point[0]-center[0],point[1]-center[1])<Math.hypot(nearest[0]-center[0],nearest[1]-center[1])?point:nearest,shore[0]);
      if(Math.hypot(anchor[0]-center[0],anchor[1]-center[1])<5.5)mooringPositions.push(anchor[0],.12,anchor[1],center[0],.1,center[1]);
    });
    const moorings=new THREE.BufferGeometry();moorings.setAttribute('position',new THREE.Float32BufferAttribute(mooringPositions,3));
    return {batches,windows,land:polygonGeometry(SITE_LAYOUT.land.map(point=>worldXZ(...point))),roads:SITE_LAYOUT.roads.map(road=>ribbonGeometry(road.points.map(point=>worldXZ(...point)),road.width*SITE_WIDTH)),moorings};
  },[resources,materials,mobile,detail]);

  const windowMaterial=useMemo(()=>new THREE.MeshStandardMaterial({color:householdLightsOn?'#9b9c7e':'#203934',emissive:householdLightsOn?'#b79e67':'#000000',emissiveIntensity:householdLightsOn?.25:0,roughness:.28}),[householdLightsOn]);
  useEffect(()=>()=>windowMaterial.dispose(),[windowMaterial]);
  useEffect(()=>()=>{site.land.dispose();site.roads.forEach(geometry=>geometry.dispose());site.moorings.dispose();},[site]);
  useEffect(()=>()=>{resources.unit.dispose();resources.plane.dispose();resources.post.dispose();resources.barrel.dispose();resources.roofGable.dispose();resources.roofShed.dispose();resources.hull.dispose();resources.trunk.dispose();resources.frond.dispose();resources.gunwales.forEach(geometry=>geometry.dispose());resources.cageNet.dispose();resources.foliage.dispose();[resources.roofMaterial,resources.sidingMaterial,resources.hullMaterial,resources.netMaterial,resources.leafMaterial,resources.roadMaterial,resources.bankMaterial].forEach(material=>material.dispose());},[resources]);

  return <group name="REFERENCE_TRACED_SITE_ENVIRONMENT">
    <mesh geometry={site.land} material={resources.bankMaterial} position={[0,.01,0]} receiveShadow/>
    {site.roads.map((geometry,index)=><mesh key={index} geometry={geometry} material={resources.roadMaterial} position={[0,.035,0]} receiveShadow/>)}
    {site.batches.filter(batch=>batch.items.length).map((batch,index)=><RepeatedParts key={index} {...batch}/>)}
    <RepeatedParts geometry={resources.plane} material={windowMaterial} items={site.windows} castShadow={false}/>
    <lineSegments geometry={site.moorings}><lineBasicMaterial color="#5d7268" transparent opacity={.58}/></lineSegments>
  </group>;
}
