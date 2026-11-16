/* ===== Painéis, ícones, tela cheia, pausa =====
   Painéis de Som/Controles/Ranking, ícones redondos, tela cheia + trava horizontal, botões de segurar (raio/água/gel), mapa de áreas clicáveis.
*/
// ---------- painéis de som e controles ----------
const SLD=[{k:'mus',y:420,label:'MÚSICA'},{k:'sfx',y:520,label:'SONS DO JOGO'}],SX0=700,SX1=1000;
function openPanel(p){pnl=p;drag=null;nickEl.blur();if(p==='rank')rkLoad()}
function setSlider(k,x){SET[k]=clamp((x-SX0)/(SX1-SX0),0,1);saveSet()}
function panelDown(x,y,e){const b=pbtns.find(b=>hit(b,x,y));if(b){b.act();return}
 if(pnl==='som')for(const s of SLD)if(x>=SX0-30&&x<=SX1+30&&Math.abs(y-s.y)<36){drag=s.k;setSlider(s.k,x);try{c.setPointerCapture(e.pointerId)}catch(_){}return}}
const ICN=[{x:1618,y:62,k:'som'},{x:1618,y:140,k:'ctrl'}];if(RANK_API)ICN.push({x:1618,y:218,k:'rank'});
const FSE=document.documentElement,FSOK=!!(FSE.requestFullscreen||FSE.webkitRequestFullscreen);
const inFS=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
function toggleFS(){try{if(inFS()){(document.exitFullscreen||document.webkitExitFullscreen).call(document)}else{const r=FSE.requestFullscreen||FSE.webkitRequestFullscreen;const pr=r.call(FSE,{navigationUI:'hide'});const lock=()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}};if(pr&&pr.then)pr.then(lock).catch(()=>{});else lock()}}catch(e){}}
if(FSOK){ICN.push({x:1618,y:RANK_API?296:218,k:'fs'});
 let tried=0;addEventListener('pointerup',e=>{if(e.pointerType==='touch'&&!tried&&!inFS()){tried=1;toggleFS()}},true);
 addEventListener('keydown',e=>{if(e.code==='KeyF'&&e.target!==nickEl){toggleFS()}})}
// ícones em linha no topo direito (como nas maquetes): som, controles, ranking, tela cheia
const ICN_R=46;ICN.forEach((a,i)=>{a.x=1592-(ICN.length-1-i)*125;a.y=70});
function iconHit(x,y){for(const a of ICN)if(d2(x,y,a.x*SS,a.y*SS)<((ICN_R+6)*SS)**2){if(a.k==='fs')toggleFS();else openPanel(a.k);return true}return false}
function toSelect(){state='select';grade=0;boost=false;speed=0;swT=-9}
function swap(d){if(CH.length<2)return;sel=(sel+d+CH.length)%CH.length;swT=T;swDir=d}
function play(){nick=nickEl.value.trim().slice(0,8);nickEl.blur();reset()}
function togglePause(){if(state==='run'){state='paused';boost=false}else if(state==='paused')state='run'}
const hold=(id,on,off)=>{const b=$(id);b.addEventListener('pointerdown',e=>{on();b.setPointerCapture(e.pointerId);e.preventDefault()});['pointerup','pointercancel','lostpointercapture'].forEach(t=>b.addEventListener(t,off))};
hold('bolt',()=>boost=true,()=>boost=false);hold('water',drink,()=>{});hold('gel',eat,()=>{});
const pt=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]};
const hit=(b,x,y)=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h,d2=(a,b,x,y)=>(a-x)*(a-x)+(b-y)*(b-y);
const ARW=CH.length<2?[]:[[112,470,-1],[805,470,1]],PLAYR={x:-9999,y:-9999,w:1,h:1};   // (antigo botão desenhado na imagem; agora o JOGAR é um btn do canvas)
function hot(x,y){if(pnl)return pbtns.some(b=>hit(b,x,y))||(pnl==='som'&&SLD.some(s=>x>=SX0-30&&x<=SX1+30&&Math.abs(y-s.y)<36));if(ICN.some(a=>d2(x,y,a.x*SS,a.y*SS)<((ICN_R+6)*SS)**2)&&(state==='title'||state==='select'||state==='modo'))return true;if(state==='title')return true;if(state==='select'){const u=x/SS,v=y/SS;return btns.some(b=>hit(b,x,y))||ARW.some(a=>d2(u,v,a[0],a[1])<2500)||hit(PLAYR,u,v)}return btns.some(b=>hit(b,x,y))}
