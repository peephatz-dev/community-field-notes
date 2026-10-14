export function thaiVoice(voices:SpeechSynthesisVoice[]){return voices.find(v=>v.lang.toLowerCase().startsWith('th')&&v.localService)||voices.find(v=>v.lang.toLowerCase().startsWith('th'))||null;}
let cancelActive:(()=>void)|null=null;
export function speakThai(text:string,callbacks:{start:()=>void;end:()=>void;error:()=>void}):boolean{
 if(typeof window==='undefined'||!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined')return false;
 stopThai();
 const voice=thaiVoice(window.speechSynthesis.getVoices());if(!voice)return false;
 let cancelled=false;const utterance=new SpeechSynthesisUtterance(text);utterance.lang='th-TH';utterance.voice=voice;utterance.rate=.98;utterance.pitch=1.05;
 cancelActive=()=>{cancelled=true;callbacks.end();};
 utterance.onstart=()=>{if(!cancelled)callbacks.start();};utterance.onend=()=>{if(!cancelled){cancelActive=null;callbacks.end();}};utterance.onerror=()=>{if(!cancelled){cancelActive=null;callbacks.error();}};
 window.speechSynthesis.speak(utterance);return true;
}
export function stopThai(){const cancel=cancelActive;cancelActive=null;cancel?.();if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel();}
