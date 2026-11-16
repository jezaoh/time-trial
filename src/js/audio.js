/* ===== Som: ajustes e motor Web Audio =====
   SET (liga/desliga, volumes, salvo em localStorage tt_set), carregamento dos MP3, música de menu/jogo com crossfade, loops de pedalada e roda livre.
*/
// ---------- ajustes de som ----------
const SET={on:true,mus:.6,sfx:.8};
try{const s=JSON.parse(localStorage.getItem('tt2_set')||'null');if(s){SET.on=s.on!==false;if(Number.isFinite(+s.mus))SET.mus=clamp(+s.mus,0,1);if(Number.isFinite(+s.sfx))SET.sfx=clamp(+s.sfx,0,1)}}catch(e){}
function saveSet(){try{localStorage.setItem('tt2_set',JSON.stringify(SET))}catch(e){}}
// ---------- áudio (Web Audio: loops sem emenda) ----------
let AC=null,gM,gMus,gSfx,BUF={},MUS=null,LP={},duck=1;
function audioUnlock(){
 if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return}
  gM=AC.createGain();gMus=AC.createGain();gSfx=AC.createGain();gMus.connect(gM);gSfx.connect(gM);gM.connect(AC.destination);
  for(const k in SND)fetch(SND[k]).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,no)=>AC.decodeAudioData(b,ok,no))).then(d=>{BUF[k]=d;if(k==='pedal'||k==='freewheel'||k==='caminhao'||k==='furgao')startSfx(k)}).catch(()=>{})}
 if(AC.state==='suspended')AC.resume()}
function startSfx(k){const s=AC.createBufferSource();s.buffer=BUF[k];s.loop=true;const g=AC.createGain();g.gain.value=0;s.connect(g);g.connect(gSfx);s.start();LP[k]={s,g}}
function musicTo(k){if(!BUF[k]||(MUS&&MUS.k===k))return;const t=AC.currentTime;
 if(MUS){const o=MUS;o.g.gain.setTargetAtTime(0,t,.25);o.s.stop(t+1.8)}
 const s=AC.createBufferSource();s.buffer=BUF[k];s.loop=true;const g=AC.createGain();g.gain.value=0;s.connect(g);g.connect(gMus);s.start();g.gain.setTargetAtTime(1,t,.3);MUS={k,s,g}}
function audioTick(dt){if(!AC)return;const t=AC.currentTime;
 duck=lerp(duck,(state==='paused'||state==='over'||pnl)?.4:1,Math.min(1,dt*4));
 gM.gain.setTargetAtTime(SET.on?1:0,t,.05);gMus.gain.setTargetAtTime(SET.mus*.5*duck,t,.08);gSfx.gain.setTargetAtTime(SET.sfx,t,.08);
 musicTo(state==='title'||state==='select'||state==='modo'||state==='carreira'||state==='treino'||state==='habil'||state==='loja'||state==='garagem'||state==='pedalar'||state==='mochila'||state==='conquistas'||state==='nome'?'menu':'game');
 const run=state==='run',coast=run&&power<25,pv=run&&!coast?clamp(.3+speed/45*.7,0,1):0,cv=coast?clamp(.35+speed/50*.65,0,1)*1.4:0;
 if(LP.pedal){LP.pedal.g.gain.setTargetAtTime(pv*.85,t,.12);LP.pedal.s.playbackRate.setTargetAtTime(clamp(.75+speed/40*.55,.7,1.5),t,.15)}
 if(LP.freewheel){LP.freewheel.g.gain.setTargetAtTime(cv,t,.12);LP.freewheel.s.playbackRate.setTargetAtTime(clamp(.8+speed/50*.5,.7,1.4),t,.15)}}
