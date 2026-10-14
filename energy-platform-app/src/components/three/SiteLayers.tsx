'use client';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { CAGE_CELLS, BUILDINGS, LANDMARKS, PIERS, ROADS, SHORELINE, WATER_TRANSITION, SITE_MONITORING_MARKERS, footprintCorners, siteToWorld, type SitePoint } from '@/lib/site-layout';
import { SpatialHtml } from './SpatialHtml';

function lineGeometry(lines:readonly (readonly SitePoint[])[], closed=false) {
 const vertices:number[]=[];
 for(const line of lines){const count=closed?line.length:line.length-1;for(let i=0;i<count;i++){vertices.push(...siteToWorld(...line[i],.32),...siteToWorld(...line[(i+1)%line.length],.32));}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));return geometry;
}
const cameraFor:Record<string,string>={pier:'pier',waterfront:'walk',cages:'aquaculture',road:'walk',channel:'transition'};
export function SiteLayers({overlay,opacity,landmarks,zones,onCameraSelect}:{overlay:boolean;opacity:number;landmarks:boolean;zones:boolean;onCameraSelect?:(mode:string)=>void}){
 const geometry=useMemo(()=>({cages:lineGeometry(CAGE_CELLS.map(footprintCorners),true),buildings:lineGeometry(BUILDINGS.map(footprintCorners),true),bank:lineGeometry([SHORELINE]),roads:lineGeometry(ROADS.map(r=>r.points)),piers:lineGeometry(PIERS.map(p=>p.points)),water:lineGeometry([WATER_TRANSITION.line])}),[]);
 useEffect(()=>()=>Object.values(geometry).forEach(g=>g.dispose()),[geometry]);
 return <group>{overlay&&Object.entries(geometry).map(([key,g])=><lineSegments key={key} geometry={g} renderOrder={30}><lineBasicMaterial color={key==='water'?'#e3c586':key==='roads'?'#f1d8a5':key==='buildings'?'#f1f4e4':'#7be2d2'} transparent opacity={opacity} depthTest={false} toneMapped={false}/></lineSegments>)}
 {landmarks&&LANDMARKS.map(mark=><SpatialHtml key={mark.id} position={siteToWorld(...mark.point,2.2)} center zIndexRange={[12,0]}><button className="site-landmark-tag" onClick={()=>onCameraSelect?.(cameraFor[mark.id])}>{mark.label}</button></SpatialHtml>)}
 {zones&&SITE_MONITORING_MARKERS.map(mark=><SpatialHtml key={mark.id} position={siteToWorld(...mark.uv,.5)} center zIndexRange={[14,0]}><button className="site-reference-tag" onClick={()=>onCameraSelect?.('transition')}><strong>{mark.id}</strong><span>จุดอ้างอิงเสนอ</span></button></SpatialHtml>)}
 </group>;
}
