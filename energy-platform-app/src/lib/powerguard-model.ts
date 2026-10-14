import type { GridMode, NodeId, SimEvent } from './model';

export type NoticeKind = 'MAIN_POWER_OUTAGE'|'VOLTAGE_SAG_DETECTED'|'BACKUP_POWER_ENGAGED'|'BATTERY_LOW'|'SOURCE_RESTORED'|'NODE_OFFLINE'|'NODE_RECOVERED'|'SENSOR_FAULT'|'SENSOR_RECOVERED'|'POWER_NORMAL'|'WATER_CHANGE'|'USER_REPORT';
export type Notice = {id:string;kind:NoticeKind;title:string;detail:string;severity:'info'|'warning'|'critical'|'success';nodeId:NodeId|'SYSTEM';minute:number;createdAt:string;source:'simulation'|'local-report';acknowledgedAt:string|null;resolution:string};
export const NODE_NAMES:Record<NodeId,string>={P0:'ศูนย์ไฟ',P1:'จุดกระชัง',P2:'บ้านและอุปกรณ์จำเป็น',P3:'เครื่องใช้ทั่วไป'};
export function simpleText(text:string){return text.replace(/\bP[0-3]\b/g,id=>NODE_NAMES[id as NodeId]);}
export function eventKinds(event:SimEvent):NoticeKind[]{
 if(event.type==='power-outage'||event.type==='extended-outage')return ['MAIN_POWER_OUTAGE'];
 if(event.type==='power-sag')return ['VOLTAGE_SAG_DETECTED'];
 if(event.type==='battery-low'||event.type==='battery-critical'||event.type==='battery-depleted'||event.type==='load-shed')return ['BATTERY_LOW'];
 if(event.type==='power-normal'||event.type==='recovery-start'||event.type==='recovery-p3')return ['SOURCE_RESTORED'];
 if(event.type==='reset-normal'||event.type==='sim-start')return ['POWER_NORMAL'];
 if(event.type==='node-offline')return ['NODE_OFFLINE'];
 if(event.type==='node-recovered')return ['NODE_RECOVERED'];
 if(event.type==='sensor-fault')return ['SENSOR_FAULT'];
 if(event.type==='sensor-recovered')return ['SENSOR_RECOVERED'];
 if(event.type==='water-change')return ['WATER_CHANGE'];
 return [];
}
export function noticesFromEvent(event:SimEvent,episode:string,hasBackup:boolean,createdAt:string):Notice[]{
 const kinds=eventKinds(event);
 if(kinds.includes('MAIN_POWER_OUTAGE')&&hasBackup)kinds.push('BACKUP_POWER_ENGAGED');
 const titles:Record<NoticeKind,string>={MAIN_POWER_OUTAGE:'ไฟดับ',VOLTAGE_SAG_DETECTED:'ไฟตก',BACKUP_POWER_ENGAGED:'ใช้ไฟสำรอง',BATTERY_LOW:event.type==='battery-depleted'?'ไฟสำรองหมดแล้ว':event.type==='battery-critical'?'แบตเหลือน้อยมาก':'แบตใกล้หมด',SOURCE_RESTORED:'ไฟกลับมาแล้ว',NODE_OFFLINE:'อุปกรณ์ขาดการเชื่อมต่อ',NODE_RECOVERED:'เชื่อมต่อกลับแล้ว',SENSOR_FAULT:'เซนเซอร์ต้องตรวจสอบ',SENSOR_RECOVERED:'เซนเซอร์กลับมาแล้ว',POWER_NORMAL:'ไฟปกติ',WATER_CHANGE:'ค่าน้ำทดลองเปลี่ยน',USER_REPORT:'บันทึกปัญหา'};
 return kinds.map(kind=>({id:`${episode}:${event.id}:${kind}`,kind,title:titles[kind],detail:event.action,severity:kind==='MAIN_POWER_OUTAGE'?'critical':['BACKUP_POWER_ENGAGED','SOURCE_RESTORED','NODE_RECOVERED','SENSOR_RECOVERED'].includes(kind)?'success':event.severity,nodeId:event.nodeId,minute:event.minute,createdAt,source:'simulation',acknowledgedAt:null,resolution:''}));
}
/** Deduplicate exact source IDs. Critical records are never truncated. */
export function mergeNotices(history:Notice[],incoming:Notice[]):{history:Notice[];added:Notice[]}{
 const ids=new Set(history.map(n=>n.id)),added=incoming.filter(n=>{if(ids.has(n.id))return false;ids.add(n.id);return true;});
 const merged=[...added.reverse(),...history];let ordinary=0;
 return {history:merged.filter(n=>n.severity==='critical'||++ordinary<=300),added:[...added].reverse()};
}
export function validNotice(value:unknown):value is Notice{
 if(!value||typeof value!=='object')return false;const n=value as Notice;
 return typeof n.id==='string'&&typeof n.title==='string'&&typeof n.detail==='string'&&typeof n.createdAt==='string'&&Number.isFinite(Date.parse(n.createdAt))&&Number.isFinite(n.minute)&&n.minute>=0&&['info','warning','critical','success'].includes(n.severity)&&['simulation','local-report'].includes(n.source)&&['P0','P1','P2','P3','SYSTEM'].includes(n.nodeId)&&['MAIN_POWER_OUTAGE','VOLTAGE_SAG_DETECTED','BACKUP_POWER_ENGAGED','BATTERY_LOW','SOURCE_RESTORED','NODE_OFFLINE','NODE_RECOVERED','SENSOR_FAULT','SENSOR_RECOVERED','POWER_NORMAL','WATER_CHANGE','USER_REPORT'].includes(n.kind);
}
export function powerStatus(mode:GridMode){return mode==='outage'?'ไฟดับ':mode==='sag'?'ไฟตก':'ไฟปกติ';}
export type BackupPlan={loads:{name:string;watts:number;selected:boolean}[];hours:number;efficiency:number;usable:number;unitPrice:number|null;installation:number|null;upsWatts:number;upsVA:number;upsWh:number;upsPrice:number|null;powerFactor:number};
export const INITIAL_PLAN:BackupPlan={loads:[{name:'ศูนย์ไฟ',watts:30,selected:true},{name:'จุดกระชัง',watts:120,selected:true},{name:'ไฟและการสื่อสาร',watts:80,selected:false},{name:'เครื่องใช้ทั่วไป',watts:260,selected:false}],hours:2,efficiency:.8,usable:.8,unitPrice:null,installation:null,upsWatts:300,upsVA:500,upsWh:500,upsPrice:null,powerFactor:.8};
export function validPlan(value:unknown):value is BackupPlan{
 if(!value||typeof value!=='object')return false;const p=value as BackupPlan;
 return Array.isArray(p.loads)&&p.loads.length>0&&p.loads.length<=24&&p.loads.every(n=>typeof n.name==='string'&&Number.isFinite(n.watts)&&n.watts>=0&&n.watts<=100000&&typeof n.selected==='boolean')&&Number.isFinite(p.hours)&&p.hours>=0&&p.hours<=72&&[p.efficiency,p.usable,p.powerFactor].every(n=>Number.isFinite(n)&&n>=.1&&n<=1)&&[p.upsWatts,p.upsVA,p.upsWh].every(n=>Number.isFinite(n)&&n>=0)&&[p.unitPrice,p.installation,p.upsPrice].every(n=>n===null||Number.isFinite(n)&&n>=0);
}
export function calculatePlan(plan:BackupPlan){
 const safe=(n:number,min:number,max:number)=>Number.isFinite(n)?Math.min(max,Math.max(min,n)):min;
 const watts=plan.loads.filter(n=>n.selected).reduce((sum,n)=>sum+safe(n.watts,0,100000),0),hours=safe(plan.hours,0,72),eff=safe(plan.efficiency,.1,1),usable=safe(plan.usable,.1,1);
 const requiredWh=watts*hours/eff/usable,requiredVA=watts/safe(plan.powerFactor,.1,1);
 const cost=plan.unitPrice!==null&&plan.installation!==null?requiredWh*Math.max(0,plan.unitPrice)+Math.max(0,plan.installation):null;
 return {watts,requiredWh,requiredVA,cost,upsRuntime:watts>0?Math.max(0,plan.upsWh)*eff*usable/watts:null,upsLoadFits:plan.upsWatts>=watts&&plan.upsVA>=requiredVA};
}
