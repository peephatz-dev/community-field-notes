'use client';
import {useEffect,useState} from 'react';
import {Volume2,Square,MessageCircle} from 'lucide-react';
import dialogues from '@/lib/powerguard/mascot-dialogue.th.json';
import {assetUrl} from '@/lib/urls';
import {speakThai,stopThai} from '@/lib/powerguard-speech';
import {usePowerguard} from '@/store/powerguard';
export type DialogueId=keyof typeof dialogues;
export default function SeaBassAssistant({dialogueId='hello',large=false,compact=false}:{dialogueId?:DialogueId;large?:boolean;compact?:boolean}){
 const [open,setOpen]=useState(false),[speaking,setSpeaking]=useState(false),[voiceMessage,setVoiceMessage]=useState(''),muted=usePowerguard(s=>s.muted),d=dialogues[dialogueId];
 useEffect(()=>{stopThai();setSpeaking(false);setVoiceMessage('');return()=>stopThai();},[dialogueId]);
 useEffect(()=>{if(muted){stopThai();setSpeaking(false);}},[muted]);
 function listen(){setOpen(true);if(muted){setVoiceMessage('ปิดเสียงรวมอยู่');return;}
  setVoiceMessage('');const started=speakThai(d.text,{start:()=>{setSpeaking(true);setVoiceMessage('กำลังพูด');},end:()=>{setSpeaking(false);setVoiceMessage('พูดจบแล้ว');},error:()=>{setSpeaking(false);setVoiceMessage('เสียงยังไม่พร้อม อ่านข้อความได้');}});
  if(!started){setSpeaking(false);setVoiceMessage('เครื่องนี้ยังไม่มีเสียงไทย อ่านข้อความได้');}
 }
 return <div className={'pg-assistant '+(large?'large':'')+(compact?' compact-assistant':'')} data-mascot={d.mascot}>
  <button className="pg-fish-button" aria-label="แตะปลากะพงเพื่อดูคำแนะนำ" title="ผู้ช่วยปลากะพง" aria-expanded={open} onClick={()=>{if(open){stopThai();setSpeaking(false);}setOpen(v=>!v);}}><img src={assetUrl('/powerguard/mascot/'+d.mascot)} width={large?260:112} height={large?260:112} alt={'ปลากะพงสามน้ำ · '+d.text} className={speaking?'pg-mascot-speaking':''}/></button>
  {(!compact||open)&&<div className={'pg-bubble '+(open?'open':'')}><p>{d.text}</p>{open?<><div className="pg-speech-controls"><button className="pg-button secondary" onClick={listen}><Volume2 size={15}/>ฟังเสียง</button><button className="pg-button secondary" disabled={!speaking} onClick={()=>{stopThai();setSpeaking(false);setVoiceMessage('หยุดพูดแล้ว');}}><Square size={13}/>หยุดพูด</button></div><span className="pg-voice-status" role="status">{voiceMessage||'กดฟังเพื่อใช้เสียงไทยของเครื่อง'}</span></>:<button className="pg-text-button" onClick={()=>setOpen(true)}><MessageCircle size={14}/>แตะเพื่อคุย</button>}</div>}
 </div>;
}
