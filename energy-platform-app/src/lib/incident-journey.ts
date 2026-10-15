import type {SimEvent,GridMode} from './model';
export const INCIDENT_STEPS=['ไฟปกติ','ไฟตก','ไฟดับ','ใช้ไฟสำรอง','พักโหลด','คืนระบบ'] as const;
/** A journey reports recorded transitions, never manufactures a full incident. */
export function incidentJourney(events:SimEvent[],mode:GridMode,battery:number,recovery:0|1|2){
 const chronological=[...events].reverse();
 const types=[['sim-start','reset-normal'],['power-sag'],['power-outage','extended-outage'],['power-outage','extended-outage'],['power-outage','extended-outage','load-shed','battery-critical'],['recovery-start','power-normal','recovery-p3']];
 return INCIDENT_STEPS.map((label,index)=>{
  const event=[...chronological].reverse().find(e=>types[index].includes(e.type));
  const seen=index===3?!!event&&battery>0:!!event;
  const active=index===0?mode==='normal'&&recovery===2:index===1?mode==='sag':index===2?mode==='outage':index===3?mode==='outage'&&battery>0:index===4?mode==='outage':mode==='normal'&&recovery<2;
  return {label,seen,active,eventId:seen?event?.id??null:null,minute:seen?event?.minute??null:null};
 });
}
