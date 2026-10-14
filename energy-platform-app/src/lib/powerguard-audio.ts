export type AudioEntry={file:string;fallback:string;wav:string;loop:boolean;defaultVolume:number;category:string};
export type AudioPreferences={enabled:boolean;muted:boolean;sfxVolume:number;ambientVolume:number;musicVolume:number;ambientOn:boolean;musicOn:boolean;ambientId:string};
type Player={id:string;audio:HTMLAudioElement;category:string};
/** One ambient loop + one music loop. Construction/configuration never unlocks audio. */
export class PowerguardAudio {
 private unlocked=false;private hidden=false;private cache=new Map<string,Player>();private active=new Set<string>();
 private preferences:AudioPreferences={enabled:false,muted:false,sfxVolume:.65,ambientVolume:.6,musicVolume:.5,ambientOn:false,musicOn:false,ambientId:'ocean-waves'};
 private manifest:Record<string,AudioEntry>;private resolve:(path:string)=>string;private create:()=>HTMLAudioElement;private status:(message:string,id?:string)=>void;
 constructor(manifest:Record<string,AudioEntry>,resolve:(path:string)=>string,create:()=>HTMLAudioElement,status:(message:string,id?:string)=>void=()=>{}){this.manifest=manifest;this.resolve=resolve;this.create=create;this.status=status;}
 unlock(){this.unlocked=true;}
 private allowed(){return this.unlocked&&this.preferences.enabled&&!this.preferences.muted&&!this.hidden;}
 private player(id:string){
  const cached=this.cache.get(id);if(cached)return cached;const entry=this.manifest[id];if(!entry)return null;
  const audio=this.create();audio.preload='none';audio.loop=entry.loop;audio.src=this.resolve(audio.canPlayType('audio/ogg')?entry.file:entry.fallback);
  audio.setAttribute('data-pg-audio',id);audio.setAttribute('aria-hidden','true');audio.style.display='none';
  if(typeof document!=='undefined')document.body.appendChild(audio);
  const player={id,audio,category:entry.category};this.cache.set(id,player);audio.addEventListener('ended',()=>this.active.delete(id));return player;
 }
 private async start(player:Player){
  const entry=this.manifest[player.id];try{await player.audio.play();}
  catch{if(!this.allowed())return false;player.audio.src=this.resolve(entry.fallback);try{await player.audio.play();}catch{player.audio.src=this.resolve(entry.wav);try{await player.audio.play();}catch{this.status('เบราว์เซอร์ยังไม่เล่นเสียง ลองกดอีกครั้ง',player.id);return false;}}}
  if(!this.allowed()){player.audio.pause();return false;}this.active.add(player.id);this.status('เสียงพร้อม',player.id);return true;
 }
 async play(id:string){
  if(!this.allowed()||!this.manifest[id])return false;const player=this.player(id);if(!player)return false;
  const category=player.category;player.audio.volume=Math.max(0,Math.min(1,this.manifest[id].defaultVolume*(category==='ambient'?this.preferences.ambientVolume:category==='music'?this.preferences.musicVolume:this.preferences.sfxVolume)));
  if(category==='ui'){for(const key of this.active){const old=this.cache.get(key);if(old?.category==='ui'&&key!==id&&this.active.size>=4){old.audio.pause();this.active.delete(key);break;}}player.audio.currentTime=0;}
  return this.start(player);
 }
 configure(preferences:AudioPreferences){this.preferences=preferences;this.syncLoops();}
 private syncLoops(){
  const desired=new Set<string>();if(this.allowed()){if(this.preferences.ambientOn)desired.add(this.preferences.ambientId);if(this.preferences.musicOn)desired.add('calm-community-bg');}
  for(const player of this.cache.values()){
   const gain=player.category==='ambient'?this.preferences.ambientVolume:player.category==='music'?this.preferences.musicVolume:this.preferences.sfxVolume;
   player.audio.volume=Math.max(0,Math.min(1,this.manifest[player.id].defaultVolume*gain));
   if(player.category==='ui'){if(!this.allowed())player.audio.pause();continue;}
   if(!desired.has(player.id)){player.audio.pause();this.active.delete(player.id);}
  }
  for(const id of desired){const player=this.player(id);if(!player)continue;player.audio.volume=this.manifest[id].defaultVolume*(player.category==='ambient'?this.preferences.ambientVolume:this.preferences.musicVolume);if(player.audio.paused)void this.start(player);}
  if(!this.preferences.enabled)this.status('เสียงปิดอยู่');else if(this.preferences.muted)this.status('ปิดเสียงรวม');else if(this.hidden)this.status('พักเสียงเมื่อออกจากหน้า');
 }
 setHidden(hidden:boolean){this.hidden=hidden;this.syncLoops();}
 stop(){for(const player of this.cache.values())player.audio.pause();this.active.clear();}
 dispose(){this.stop();for(const player of this.cache.values())player.audio.remove();this.cache.clear();}
}
