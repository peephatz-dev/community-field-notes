'use client';

import { useId, type KeyboardEvent } from 'react';
import type { Sample } from '@/lib/model';
import {NODE_NAMES} from '@/lib/powerguard-model';
import {
  BOATS, BUILDINGS, CAGE_CELLS, CANDIDATE_NODES, LANDMARKS, LAND_POLYGON,
  MONITORING_ZONES, OCCLUSIONS, PIERS, ROADS, SHORELINE, SITE_REFERENCE,
  VEGETATION, WATER_TRANSITION, footprintCorners, type SiteNodeId, type SitePoint,
} from '@/lib/site-layout';

const W = SITE_REFERENCE.crop.width, H = SITE_REFERENCE.crop.height;
const px = (point:SitePoint):[number,number] => [point[0] * W, point[1] * H];
const points = (list:readonly SitePoint[]) => list.map(point => px(point).map(n => n.toFixed(2)).join(',')).join(' ');
const linePath = (list:readonly SitePoint[]) => list.map((point,i) => `${i ? 'L' : 'M'}${px(point).join(' ')}`).join(' ');
const roofColors:Record<string,string> = { metal:'#96a4a1', pale:'#c6c7ae', red:'#ae7768', blue:'#789eb2' };
const nodeColors:Record<SiteNodeId,string> = {P0:'#FBC642',P1:'#5EC6E8',P2:'#2F7DD3',P3:'#FF7A3C'};
const nodeIds:SiteNodeId[] = ['P0','P1','P2','P3'];

export type SitePlanProps = {
  selectedNode:SiteNodeId;
  onSelectNode:(id:SiteNodeId)=>void;
  onLandmarkSelect?:(id:typeof LANDMARKS[number]['id'])=>void;
  communityLabels?:boolean;
  showZones?:boolean;
  showOcclusions?:boolean;
};

/** Original SVG trace; it never serves the Google Maps screenshot. */
export function SitePlan({ selectedNode, onSelectNode, onLandmarkSelect, showZones = true, showOcclusions = false,communityLabels=false }:SitePlanProps) {
  const id = useId().replace(/:/g,'');
  const activate = (event:KeyboardEvent<SVGGElement>, node:SiteNodeId) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectNode(node); }
  };
  const outerWater = [...WATER_TRANSITION.line, [1,1] as SitePoint, [0,1] as SitePoint, [0,.77] as SitePoint];
  return <figure className="site-plan">
    <div className="site-plan-heading"><div><h3>ผังพื้นที่จากภาพอ้างอิง</h3><p>แนวฝั่ง ถนน ท่า และกลุ่มกระชังวาดใหม่ตามสัดส่วนภาพ</p></div><span className="site-plan-badge">ตำแหน่งเสนอ</span></div>
    <div className="site-plan-stage">
      <svg className="site-plan-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>ผังพื้นที่ท่าเรือลุงทองและกระชังบ้านศาลาหุม วาดใหม่จากภาพอ้างอิง</title>
        <desc id={`${id}-desc`}>ฝั่งและถนนอยู่ด้านซ้าย แนวบ้านเลียบฝั่ง กลุ่มกระชังหลายแนวยื่นไปทางขวาบน มีท่าเรือยาวช่วงล่าง และแนวสีเขียวถึงฟ้าของน้ำ {communityLabels?'ตำแหน่งอุปกรณ์':'ตำแหน่ง P0 ถึง P3'} เสนอเพื่อการทดลอง ทุกจุดรอสำรวจ ไม่ใช่แผนที่ระยะจริง ใช้ Tab เพื่อเลือกจุดแล้วกด Enter หรือ Space</desc>
        <defs>
          <linearGradient id={`${id}-water`} x1="0" y1="0" x2=".15" y2="1"><stop offset="0%" stopColor="#315f51"/><stop offset="65%" stopColor="#315f51"/><stop offset="100%" stopColor="#234d59"/></linearGradient>
          <pattern id={`${id}-grid`} width="59.1" height="92.2" patternUnits="userSpaceOnUse"><path d="M 59.1 0 L 0 0 0 92.2" fill="none" stroke="#a3cfc3" strokeOpacity=".09" strokeWidth="1"/></pattern>
          <pattern id={`${id}-unknown`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="12" stroke="#aec0c7" strokeOpacity=".6" strokeWidth="2"/></pattern>
          <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#08141f" floodOpacity=".55"/></filter>
          <clipPath id={`${id}-extent`}><rect width={W} height={H} rx="8"/></clipPath>
        </defs>
        <g clipPath={`url(#${id}-extent)`}>
          <rect width={W} height={H} fill={`url(#${id}-water)`}/>
          <polygon points={points(outerWater)} fill={WATER_TRANSITION.lowerColor} opacity=".44"/>
          <rect width={W} height={H} fill={`url(#${id}-grid)`}/>
          <polygon points={points(LAND_POLYGON)} fill="#626b57"/>
          <polyline points={points(SHORELINE)} fill="none" stroke="#b2baa2" strokeWidth="3" strokeOpacity=".65"/>
          {VEGETATION.map(patch => <g key={patch.id} transform={`translate(${px(patch.center).join(' ')}) rotate(${patch.angleDeg})`}>
            <title>กลุ่มพืชพรรณตัวแทนตามภาพ</title>
            <ellipse rx={patch.size[0]*W/2} ry={patch.size[1]*H/2} fill="#3b5845" opacity=".85"/>
            {[-1,0,1].map((step,i) => <ellipse key={i} cx={step*patch.size[0]*W*.2} cy={(i%2 ? -.12:.13)*patch.size[1]*H} rx={patch.size[0]*W*.2} ry={patch.size[1]*H*.32} fill={i===1?'#688063':'#49684f'}/>)}
          </g>)}
          {ROADS.map(road => <g key={road.id}><title>{road.label} · แนวโดยประมาณ</title><polyline points={points(road.points)} fill="none" stroke="#bbbcb0" strokeWidth={road.width*W} strokeLinejoin="round"/><polyline points={points(road.points)} fill="none" stroke="#6f776b" strokeWidth="1.5" strokeDasharray="8 10"/></g>)}
          {BUILDINGS.map(roof => <g key={roof.id}><title>หลังคาตัวแทน · ไม่ใช่จำนวนครัวเรือน</title><polygon points={points(footprintCorners(roof))} fill={roofColors[roof.kind??'metal']} stroke="#273934" strokeWidth="1.7"/><line x1={px(roof.center)[0]-Math.cos(roof.angleDeg*Math.PI/180)*roof.size[0]*W*.4} y1={px(roof.center)[1]-Math.sin(roof.angleDeg*Math.PI/180)*roof.size[0]*W*.4} x2={px(roof.center)[0]+Math.cos(roof.angleDeg*Math.PI/180)*roof.size[0]*W*.4} y2={px(roof.center)[1]+Math.sin(roof.angleDeg*Math.PI/180)*roof.size[0]*W*.4} stroke="#d3d7cd" strokeOpacity=".42"/></g>)}
          {PIERS.map(pier => <g key={pier.id}><title>{pier.label??'ทางขึ้นท่า / ทางเดินตัวแทน'} · ตำแหน่งสัมพัทธ์</title><polyline points={points(pier.points)} fill="none" stroke="#d6cfb6" strokeWidth={pier.width*W} strokeLinejoin="round"/><polyline points={points(pier.points)} fill="none" stroke="#716e5c" strokeWidth="1"/></g>)}
          {CAGE_CELLS.map(cell => <polygon key={cell.id} points={points(footprintCorners(cell))} fill="#163d34" fillOpacity=".7" stroke="#bac6a6" strokeWidth="1.7"><title>ช่องกระชังสร้างใหม่ตามแนวกลุ่มที่เห็น · ไม่ใช่จำนวนกระชังจริง</title></polygon>)}
          {BOATS.map(boat => {const length=boat.size[0]*W, halfWidth=boat.size[1]*H/2;return <path key={boat.id} transform={`translate(${px(boat.center).join(' ')}) rotate(${boat.angleDeg})`} d={`M ${-length/2} 0 Q ${-length*.42} ${-halfWidth} ${length*.25} ${-halfWidth} L ${length/2} 0 L ${length*.25} ${halfWidth} Q ${-length*.42} ${halfWidth} ${-length/2} 0 Z`} fill="#d5ddce" stroke="#25444a" strokeWidth="1.5"><title>เรือตัวแทน · ตำแหน่งตามภาพโดยประมาณ</title></path>;})}
          <path d={linePath(WATER_TRANSITION.line)} fill="none" stroke="#adc9b1" strokeWidth="4" strokeDasharray="7 10" opacity=".65" className="site-plan-transition"><title>แนวสีที่สังเกต · ไม่ยืนยันประเภทความเค็ม</title></path>
          {showZones && <g className="site-plan-zones" pointerEvents="none">
            <g transform="translate(487 295)"><circle r="19" fill="#17392e" stroke="#83c5a6"/><text textAnchor="middle" dy="7" fill="#cde8d7" fontSize="22" fontWeight="600">A</text><text y="41" textAnchor="middle" fill="#d0e4d9" fontSize="16">กลุ่มกระชัง</text></g>
            {MONITORING_ZONES.filter(zone=>zone.id!=='A').map(zone => <g key={zone.id} transform={`translate(${px(zone.point).join(' ')})`}><circle r="17" fill="#17313c" stroke="#b2cad7" strokeDasharray="4 4"/><text textAnchor="middle" dy="6" fill="#e0ebef" fontSize="20" fontWeight="600">{zone.id}</text><text y="37" textAnchor="middle" fill="#d6e5e9" fontSize="15">จุดอ้างอิงเสนอ</text></g>)}
          </g>}
          {showOcclusions && OCCLUSIONS.map(area => <rect key={area.id} x={area.bounds[0]*W} y={area.bounds[1]*H} width={area.bounds[2]*W} height={area.bounds[3]*H} fill={`url(#${id}-unknown)`} opacity=".65"><title>{area.label}</title></rect>)}
          <text x="566" y="29" textAnchor="end" fill="#b8d3ce" fontSize="13">บนภาพ ≠ ทิศเหนือที่ยืนยัน</text>
          {nodeIds.map(node => {
            const [x,y]=px(CANDIDATE_NODES[node].uv), selected=selectedNode===node;
            const labelX=x+29, labelY=y-37, color=nodeColors[node];
            return <g key={node} role="button" tabIndex={0} aria-label={`${communityLabels?NODE_NAMES[node]:node+' '+CANDIDATE_NODES[node].title} · จุดเสนอ รอสำรวจพื้นที่`} aria-pressed={selected} onClick={()=>onSelectNode(node)} onKeyDown={event=>activate(event,node)} className={`site-plan-node${selected?' is-selected':''}`}>
              <title>{`${communityLabels?NODE_NAMES[node]:node}: ${CANDIDATE_NODES[node].title}. ${CANDIDATE_NODES[node].rationale}. PROPOSED`}</title>
              <circle cx={x} cy={y} r="37" fill="transparent"/>
              <circle cx={x} cy={y} r={selected?20:15} fill="#0b1926" stroke={color} strokeWidth={selected?4:2}/>
              <circle cx={x} cy={y} r="5" fill={color}/>
              <path d={`M${x+14} ${y-10} L${labelX} ${labelY+24}`} stroke={color} strokeWidth="2" fill="none"/>
              <rect x={labelX} y={labelY} width="120" height="57" rx="5" fill={selected?'#163444':'#0b1926'} stroke={color} strokeWidth={selected?2:1} filter={`url(#${id}-shadow)`}/>
              <text x={labelX+13} y={labelY+25} fill="#e5edf1" fontSize={communityLabels?15:24} fontWeight="700">{communityLabels?({P0:'ศูนย์ไฟ',P1:'กระชัง',P2:'บ้านริมน้ำ',P3:'เครื่องทั่วไป'}[node]):node}</text>
              <text x={labelX+13} y={labelY+44} fill={color} fontSize="14" fontWeight="500">PROPOSED</text>
            </g>;
          })}
        </g>
      </svg>
    </div>
    <div className="site-plan-node-controls" aria-label="เลือกตำแหน่งโหนดที่เสนอ">{nodeIds.map(node => <button key={node} className={`site-plan-node-control${selectedNode===node?' is-selected':''}`} aria-pressed={selectedNode===node} onClick={()=>onSelectNode(node)}><strong style={{color:nodeColors[node]}}>{communityLabels?NODE_NAMES[node]:node}</strong><span>{CANDIDATE_NODES[node].title}</span><small>PROPOSED · รอสำรวจ</small></button>)}</div>
    <div className="site-plan-legend"><span><i style={{background:'#96a4a1'}}/>อาคารตัวแทน</span><span><i style={{background:'#163d34',border:'1px solid #bac6a6'}}/>แนวกลุ่มกระชัง</span><span><i style={{background:'#d6cfb6'}}/>ท่า / ทางขึ้น</span><span><i style={{background:'#adc9b1'}}/>แนวเปลี่ยนสีที่สังเกต</span>{showZones&&<span><i style={{background:'transparent',border:'1px dashed #b2cad7'}}/>B / C จุดอ้างอิงเสนอ · ไม่มีเครื่องมือ</span>}</div>
    {onLandmarkSelect && <div className="site-plan-landmarks" aria-label="โฟกัสสถานที่ในฉาก 3D">{LANDMARKS.map(mark => <button key={mark.id} onClick={()=>onLandmarkSelect(mark.id)}>{mark.label}</button>)}</div>}
    <figcaption className="site-plan-caption">ผังวาดใหม่จากภาพอ้างอิง ไม่ใช่แผนที่สำรวจหรือจำนวนกระชังที่ยืนยัน · ตำแหน่งทุกโหนดเสนอเพื่อทดลอง · <a href={SITE_REFERENCE.mapsUrl} target="_blank" rel="noreferrer">ดูสถานที่จากลิงก์ที่ผู้ใช้ให้</a></figcaption>
  </figure>;
}

export type SiteWaterPanelProps = {
  compact?:boolean;
  waterShift?:boolean;
  sensorFault?:boolean;
  latestSample?:Pick<Sample,'minute'|'salinity'|'temperature'> | null;
  nodeOffline?:boolean;
  powered?:boolean;
};

/** P1 gets the shared simulator sample; conceptual B/C never receive invented values. */
export function SiteWaterPanel({compact=false,waterShift=false,sensorFault=false,latestSample=null,nodeOffline=false,powered=true}:SiteWaterPanelProps) {
  const headingId = useId();
  const usable = powered && !nodeOffline;
  const salinity = usable && !sensorFault && latestSample?.salinity!=null ? `${latestSample.salinity.toFixed(1)} ppt` : 'ไม่มีค่าที่ใช้ได้';
  const temperature = usable && latestSample?.temperature != null ? `${latestSample.temperature.toFixed(1)} °C` : 'ไม่มีค่าที่ใช้ได้';
  const quality = !powered?'P1 ไม่มีไฟ · ไม่มีข้อมูลใหม่':nodeOffline?'P1 ขาดการสื่อสาร · ไม่มีข้อมูลใหม่':sensorFault?'ความเค็มผิดปกติ · ต้องตรวจเซนเซอร์':waterShift?'จำลองค่าความเค็มเปลี่ยน · รอยืนยันด้วยการวัด':'ข้อมูลจากเครื่องจำลอง · ไม่มีอุปกรณ์จริง';
  return <section className={`site-water-panel${compact?' is-compact':''}`} aria-labelledby={headingId}>
    <header className="site-water-heading"><div><h3 id={headingId}>กลยุทธ์ติดตามน้ำตามพื้นที่</h3><p>แยกจุดหลักใกล้กระชังและจุดอ้างอิงที่เสนอ</p></div><span className="site-plan-badge">แนวคิดเฝ้าติดตาม</span></header>
    <div className="site-water-zones">{MONITORING_ZONES.map(zone => <article key={zone.id} className={`site-water-zone zone-${zone.id.toLowerCase()}`}>
      <div className="site-water-zone-title"><span>{zone.id}</span><h4>{zone.title}</h4></div>
      <p>{zone.description}</p>
      {zone.id==='A'?<><dl className="site-water-readings"><div><dt>ความเค็ม P1 · จำลอง</dt><dd>{salinity}</dd></div><div><dt>อุณหภูมิ P1 · จำลอง</dt><dd>{temperature}</dd></div></dl><span className={`site-water-quality${waterShift||sensorFault||!usable?' is-warning':''}`}>{quality}</span>{latestSample&&<small>เวลาตัวอย่างในเครื่องจำลอง T+{latestSample.minute} นาที</small>}</>:<div className="site-water-no-data"><strong>จุดอ้างอิงเสนอ · ยังไม่มีเครื่องมือ</strong><span>ไม่มีค่าความเค็มหรืออุณหภูมิของจุด {zone.id}</span></div>}
    </article>)}</div>
    <div className="site-water-caveat"><strong>สีของน้ำเป็นข้อสังเกต ไม่ใช่ค่าความเค็ม</strong><p>แนวสีที่ต่างกันอาจเป็นจุดที่ควรเก็บข้อมูลเพิ่ม ยังไม่ยืนยันว่าน้ำจืด น้ำกร่อย หรือน้ำทะเล ต้องวัดความเค็ม/การนำไฟฟ้าพร้อมอุณหภูมิ เวลา และระดับน้ำ · DO ยังไม่มีเครื่องวัด</p>{!compact&&<a href={SITE_REFERENCE.mapsUrl} target="_blank" rel="noreferrer">ดูตำแหน่งอ้างอิงท่าเรือลุงทอง</a>}</div>
  </section>;
}
