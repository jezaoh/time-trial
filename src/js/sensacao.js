/* ===== SENSAÇÃO (game feel, 16/11) — só visual e vibração: NÃO mexe em potência, stamina, fadiga, NPC nem ranking =====
   1 · cada pedalada (toque no raio): o raio afunda e volta com um quique, o ciclista dá um tranco para baixo e o celular
       vibra curtinho (Android; iPhone/iPad não têm vibração no navegador). Sem som (o "tum" foi recusado pelo dono).
   2 · linhas de vento na tela acima de ~35 km/h (≈28 km/h em descida) e tachas/remendos no asfalto (dão referência de
       velocidade mesmo no plano: o asfalto original só tem faixas contínuas).
   3 · câmera com "trauma" (GDC, Squirrel Eiserloh): o tremor é trauma², em onda suave (soma de senos, nada de aleatório);
       treme o mundo e o fundo, nunca o HUD. Fontes: descida rápida (contínuo, leve), início do sprint, largada e chegada.
   8 · desempenho: o brilho do raio apertado é desenhado uma vez numa tela de apoio (antes era shadowBlur a cada quadro).
   — 2º pacote (16/11, tarde) —
   7 · som: cada efeito varia ±5% de tom; moedas seguidas sobem de tom; "vush" (ruído filtrado, sem arquivo) quando você
       passa alguém ou é passado.            13 · som de vento contínuo que cresce com a velocidade (ruído, sem arquivo).
   8 · partículas: usar item = anel + faíscas na cor do item saindo do ciclista; pegar item = faíscas voam até o espaço dele
       no HUD, que pulsa. Pool fixo (sem criar objetos a cada quadro). Tudo detectado pela mudança do estado (vale toque,
       teclado e controle).
   9 · ataque/fuga de NPC: ele fica em pé, risca vento atrás, tranco leve de câmera e "+12 s" em cima dele (ou na borda
       da tela, se já sumiu à frente).      12 · zoom: devagar a câmera fica ~4% mais perto; rápido volta ao normal (só ≥1, sem borda).
   14 · rodas: acima de ~25 km/h um borrão translúcido gira sobre o miolo das rodas (jogador e NPCs; centros medidos nas folhas).
   Ganchos: desenho.js chama sensCamIni/sensCamFim, sensVento, sensMarcas, sensRaio, sensRodas, sensParticulas e usa GF.tranco
   (todos com typeof).
*/
const SENS={
 // 1 · pedalada
 raioAfunda:.86,   // escala do raio no instante do toque (volta com mola)
 raioMola:600,     // rigidez da mola do raio (maior = volta mais rápido)
 raioAmort:24,     // amortecimento (menor = quica mais): passa ~3% do tamanho normal e assenta em ~0,2 s
 tranco:0,         // px de mundo que o ciclista desce a cada pedalada — 16/11: dono não gostou do balanço, desligado (era 6)
 trancoDur:.16,    // s
 vibra:12,         // ms por pedalada (0 = desliga)
 vibraSprint:28,   // ms ao entrar no sprint
 // 2 · vento e asfalto
 ventoV:35,        // km/h em que as linhas começam a aparecer
 ventoVDesce:28,   // idem em descida (rampa < −1,5%)
 ventoCheio:52,    // km/h com o vento no máximo
 ventoN:12,        // linhas no máximo (pool fixo)
 ventoMult:2.6,    // linhas andam 2,6× mais rápido que o chão
 ventoAlfa:.6,
 ventoY:[250,640], // faixa da tela (fora do HUD de cima)
 tachaP:240,       // px de mundo entre tachas na faixa amarela
 remendoP:2600,    // período dos bueiros (px de mundo); só ~40% deles aparecem → ~1 a cada 6500 px (≈ 25 s a 30 km/h)
 bueiroChance:.4,bueiroR:44,
 // 3 · câmera
 camX:6,camY:5,    // px de tela no trauma máximo
 camDecai:1.6,     // trauma perdido por segundo
 camSprint:.38,camLargada:.5,camChegada:.65,
 camDesceV:45,camDesceFaixa:20,camDesceMax:.6,  // descida: de 45 a 65 km/h o trauma mínimo sobe até .6 (tremor .36 ≈ 2 px)
 camAtaque:.3,     // tranco quando um NPC ataca perto de você
 // 12 · zoom
 zoomMax:.04,zoomV:[22,50],zoomSuave:1.2,   // até 22 km/h: 4% mais perto · a partir de 50 km/h: normal
 // 7 · som
 somVaria:.05,moedaSobe:.06,moedaMax:8,moedaJanela:1.6,vushVol:.55,
 // 13 · vento (som)
 ventoSomV:[18,60],ventoSomVol:.5,
 // 8 · partículas
 partN:90,
 // 14 · rodas
 rodaV:[25,55],rodaAlfa:.34
};
// centros das rodas (px da folha, quadro 0) por uniforme e postura [traseira, dianteira] = [x, y, raio] — medidos pelo pneu
const RODAS={branco:[[[56.5,252.5,52.5],[210.9,252.9,53.1]],[[57.3,252.7,53.3],[210,253,53]],[[59.4,257.6,54.4],[212.5,258.5,53.5]],[[59,256,53],[210.3,253.3,55.7]]],
 azul:[[[54,218,52],[210,216,54]],[[53.2,219.8,52.2],[208.4,217.4,54.6]],[[55.5,231.5,52.5],[210,229,55]],[[71.8,241.2,52.8],[223.5,238.5,55.5]]],
 vinho:[[[56.2,238.8,53.2],[208.3,238.3,54.7]],[[56.5,239.5,52.5],[208.5,238.5,53.5]],[[58,233,53],[209.5,231.5,55.5]],[[70.2,243.8,52.2],[223.5,242.5,55.5]]]};
const GF={raio:1,raioV:0,tranco:0,trT:9,trauma:0,dx:0,dy:0,cam:false,t0:-1,ant:false,hold0:0,zoom:1,vushT:-9,pulso:{},est:null};
function vibrar(ms){try{if(ms>0&&navigator.vibrate)navigator.vibrate(ms)}catch(e){}}
// ---------- eventos (lidos no update, que só roda com a prova andando) ----------
const _gfUpdate=update;
update=function(dt){
 const c0=typeof CONT!=='undefined'?CONT:0,toque=boost&&!GF.ant&&stamina>.5&&!(c0>0);GF.ant=boost;
 _gfUpdate(dt);
 if(toque){GF.raio=SENS.raioAfunda;GF.raioV=0;GF.trT=0;vibrar(SENS.vibra)}
 const seg=typeof PEDK!=='undefined'?PEDK.segura:1.2;
 if(boost&&stamina>.5&&holdT>=seg&&GF.hold0<seg){GF.trauma=Math.min(1,GF.trauma+SENS.camSprint);vibrar(SENS.vibraSprint)}
 GF.hold0=holdT;
 if(c0>0&&typeof CONT!=='undefined'&&CONT<=0)GF.trauma=Math.min(1,GF.trauma+SENS.camLargada);
 if(state==='over'&&won){GF.trauma=Math.min(1,GF.trauma+SENS.camChegada);vibrar(40)}
 sensItensEventos();sensNpcEventos(!(c0>0))};
// ---------- relógio visual (roda no desenho, também na pausa/fim) ----------
function sensPasso(){const dt=GF.t0<0?0:clamp(T-GF.t0,0,.05);GF.t0=T;if(!dt)return 0;
 GF.raioV+=((1-GF.raio)*SENS.raioMola-GF.raioV*SENS.raioAmort)*dt;GF.raio+=GF.raioV*dt;
 GF.trT+=dt;GF.tranco=GF.trT<SENS.trancoDur?SENS.tranco*Math.sin(Math.PI*GF.trT/SENS.trancoDur):0;
 GF.trauma=Math.max(0,GF.trauma-SENS.camDecai*dt);
 if(state==='run'&&grade<-1.5&&speed>SENS.camDesceV)GF.trauma=Math.max(GF.trauma,clamp((speed-SENS.camDesceV)/SENS.camDesceFaixa,0,1)*SENS.camDesceMax);
 return dt}
// ---------- 3 · câmera: começa antes do céu e termina antes do HUD ----------
function sensCamIni(){const dt=sensPasso();if(state!=='run'&&state!=='over'&&state!=='paused'){GF.cam=false;GF.zoom=1;return}
 // 12 · zoom pela velocidade (sempre ≥ 1, em volta do ciclista: a borda nunca aparece)
 if(state==='run'){const az=1+SENS.zoomMax*(1-clamp((speed-SENS.zoomV[0])/(SENS.zoomV[1]-SENS.zoomV[0]),0,1));GF.zoom+=(az-GF.zoom)*Math.min(1,dt*SENS.zoomSuave)}
 const s=GF.trauma*GF.trauma,zc=GF.zoom>1.0005;if(s<.002&&!zc){GF.cam=false;return}
 const t=state==='paused'?GF.tp||T:T;GF.tp=t;   // na pausa congela
 GF.dx=s<.002?0:SENS.camX*s*(Math.sin(t*23.1)*.6+Math.sin(t*37.7+1.3)*.3+Math.sin(t*61.3+2.1)*.1);
 GF.dy=s<.002?0:SENS.camY*s*(Math.sin(t*19.7+.7)*.6+Math.sin(t*41.3+2.9)*.3+Math.sin(t*57.1+.4)*.1);
 const k=1+Math.max(2*Math.abs(GF.dx)/W,2*Math.abs(GF.dy)/H)+(s<.002?0:.002);   // zoom mínimo para a borda não aparecer no tremor
 ctx.save();ctx.translate(W/2+GF.dx,H/2+GF.dy);ctx.scale(k,k);ctx.translate(-W/2,-H/2);
 if(zc){const cx=BXS,cy=RYS-130;ctx.translate(cx,cy);ctx.scale(GF.zoom,GF.zoom);ctx.translate(-cx,-cy)}
 GF.cam=true}
// ponto da tela → como fica depois da câmera (para o que é desenhado fora dela acompanhar: partículas, "+12 s")
function camPt(x,y){if(!GF.cam&&GF.zoom<=1.0005)return[x,y];const cx=BXS,cy=RYS-130;let X=cx+(x-cx)*GF.zoom,Y=cy+(y-cy)*GF.zoom;return[X+GF.dx,Y+GF.dy]}
function sensCamFim(){if(GF.cam){ctx.restore();GF.cam=false}}
// ---------- 2 · linhas de vento (tela, por cima do mato da frente e por baixo do HUD) ----------
const VENTO=[];
function ventoNovo(o,x){o.x=x;o.y=SENS.ventoY[0]+Math.random()*(SENS.ventoY[1]-SENS.ventoY[0]);o.l=.5+Math.random();o.v=.75+Math.random()*.6}
for(let i=0;i<SENS.ventoN;i++){const o={};ventoNovo(o,Math.random()*W);VENTO.push(o)}
let VENTO_T=-1;
function sensVento(){const dt=VENTO_T<0?0:clamp(T-VENTO_T,0,.05);VENTO_T=T;if(state!=='run'&&state!=='over')return;
 const lim=grade<-1.5?SENS.ventoVDesce:SENS.ventoV,I=clamp((speed-lim)/(SENS.ventoCheio-lim),0,1);if(I<.02)return;
 const px=speed*9*ZOOM*SENS.ventoMult*dt,n=Math.round(SENS.ventoN*(.35+.65*I)),L=60+170*I;
 ctx.save();ctx.globalAlpha=I*SENS.ventoAlfa;ctx.strokeStyle='#fff';ctx.lineWidth=3.5;ctx.lineCap='round';ctx.beginPath();
 for(let i=0;i<n;i++){const o=VENTO[i];o.x-=px*o.v;const l=L*o.l;if(o.x+l<0)ventoNovo(o,W+Math.random()*300);
  ctx.moveTo(Math.round(o.x),Math.round(o.y));ctx.lineTo(Math.round(o.x+l),Math.round(o.y))}
 ctx.stroke();ctx.restore()}
// ---------- 2 · tachas na faixa amarela e remendos no asfalto (mundo, logo depois do asfalto) ----------
// tampa de bueiro em perspectiva (elipse achatada): sombra do buraco, aro claro, tampa escura com ranhuras
function bueiro(x,y){const rx=SENS.bueiroR,ry=rx*.2;ctx.save();
 ctx.fillStyle='rgba(20,14,28,.55)';ctx.beginPath();ctx.ellipse(x,y+2,rx+4,ry+3,0,0,7);ctx.fill();                 // sombra/buraco
 ctx.fillStyle='#8d8794';ctx.beginPath();ctx.ellipse(x,y,rx+2,ry+1.5,0,0,7);ctx.fill();                              // aro
 ctx.fillStyle='#4a4452';ctx.beginPath();ctx.ellipse(x,y,rx-2,ry-1,0,0,7);ctx.fill();                                // tampa
 ctx.strokeStyle='#2c2733';ctx.lineWidth=2;ctx.beginPath();for(let k=-3;k<=3;k++){const xx=x+k*rx*.24,h=(ry-2)*Math.sqrt(1-(k*.24)**2);ctx.moveTo(xx,y-h);ctx.lineTo(xx,y+h)}ctx.stroke();
 ctx.restore()}
function hashN(i){const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s)}
function sensMarcas(vis){if(!vis||!vis.length)return;const P=SENS.tachaP,R=SENS.remendoP;
 for(const s of vis)noTrecho(s,()=>{
  // bueiros (16/11: no lugar dos remendos retangulares — "n toda hora"): tampa de ferro vista de lado, só em ~40% dos períodos
  for(let i=Math.floor((scroll+s.xa)/R)-1;i*R-scroll<s.xb;i++){if(hashN(i+11)>SENS.bueiroChance)continue;
   const x=i*R-scroll+hashN(i)*R*.6;if(x<s.xa||x>=s.xb)continue;bueiro(x,hashN(i+5)<.5?660:704)}
  })
 // tachas (olho de gato) entre as faixas amarelas: pílulas alinhadas à rampa, fora do "cisalhamento" do trecho (17/11: antes saíam em itálico)
 ctx.fillStyle='#f7f3e6';const v0=vis[0].xa,v1=vis[vis.length-1].xb;
 for(let i=Math.floor((scroll+v0)/P);i*P-scroll<v1;i++){const x=i*P-scroll+11;if(x<v0||x>=v1)continue;const s=segEm(x);
  ctx.save();ctx.translate(x,687-alturaEm(x));ctx.rotate(Math.atan(-s.m));rr(-11,-3,22,6,3);ctx.fill();ctx.restore()}}
// ---------- 1 · raio com mola + 8 · brilho pronto ----------
const RAIO_BR={img:null,cv:null},RAIO_PAD=60,RAIO_REF=212;
function raioBrilho(img){if(!img||!img.width)return null;if(RAIO_BR.img===img)return RAIO_BR.cv;
 const cv=document.createElement('canvas');cv.width=cv.height=RAIO_REF+2*RAIO_PAD;const g=cv.getContext('2d');
 g.shadowColor='#ffe13a';g.shadowBlur=34;g.drawImage(img,RAIO_PAD,RAIO_PAD,RAIO_REF,RAIO_REF);RAIO_BR.img=img;RAIO_BR.cv=cv;return cv}
function sensRaio(img,act,cx,cy){const bs=(act?212:228)*GF.raio;
 if(act){const g=raioBrilho(img);if(g){const k=bs/RAIO_REF,w=g.width*k;ctx.drawImage(g,cx-w/2,cy-w/2,w,w);return}}
 ctx.drawImage(img,cx-bs/2,cy-bs/2,bs,bs)}

// ================================ 2º PACOTE (16/11, tarde) ================================
// ---------- 7 e 13 · som (Web Audio, sem arquivos novos) ----------
let RB=null,RM=null;   // ruído branco (vush) e marrom (vento)
function ruidos(){if(RB||!AC)return;const n=AC.sampleRate*2;RB=AC.createBuffer(1,n,AC.sampleRate);RM=AC.createBuffer(1,n,AC.sampleRate);
 const b=RB.getChannelData(0),m=RM.getChannelData(0);let u=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;b[i]=w;u=(u+.02*w)/1.02;m[i]=u*3.5}}
const MOEDA={t:-9,n:0};
// tocar com variação de tom (substitui o de extras.js; mesma assinatura + rate opcional)
tocar=function(k,vol=1,rate){try{if(!AC||!BUF[k])return;
 if(rate==null){if(k==='moeda'){MOEDA.n=T-MOEDA.t<SENS.moedaJanela?Math.min(MOEDA.n+1,SENS.moedaMax):0;MOEDA.t=T;rate=1+SENS.moedaSobe*MOEDA.n}
  else rate=1+(Math.random()*2-1)*SENS.somVaria}
 const s=AC.createBufferSource(),g=AC.createGain();s.buffer=BUF[k];s.playbackRate.value=rate;g.gain.value=vol;s.connect(g);g.connect(gSfx);s.start()}catch(e){}};
// "vush": ruído num filtro que varre o agudo e volta (força 0–1 = diferença de velocidade)
function vush(f){try{if(!AC)return;ruidos();const t=AC.currentTime,s=AC.createBufferSource(),bp=AC.createBiquadFilter(),g=AC.createGain();
 s.buffer=RB;bp.type='bandpass';bp.Q.value=1.4;bp.frequency.setValueAtTime(380,t);bp.frequency.exponentialRampToValueAtTime(1500+900*f,t+.17);bp.frequency.exponentialRampToValueAtTime(520,t+.48);
 const v=SENS.vushVol*(.35+.65*f);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.12);g.gain.exponentialRampToValueAtTime(.0001,t+.5);
 s.connect(bp);bp.connect(g);g.connect(gSfx);s.start(t,Math.random());s.stop(t+.55)}catch(e){}}
let VSOM=null;
const _gfTick=audioTick;
audioTick=function(dt){_gfTick(dt);if(!AC)return;
 if(!VSOM){ruidos();const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=RM;s.loop=true;f.type='lowpass';f.frequency.value=300;g.gain.value=0;
  s.connect(f);f.connect(g);g.connect(gSfx);s.start();VSOM={s,f,g}}
 const t=AC.currentTime,I=state==='run'?clamp((speed-SENS.ventoSomV[0])/(SENS.ventoSomV[1]-SENS.ventoSomV[0]),0,1):0;
 VSOM.g.gain.setTargetAtTime(I*I*SENS.ventoSomVol,t,.3);VSOM.f.frequency.setTargetAtTime(260+1500*I,t,.3)};
// ---------- eventos de NPC: ultrapassagem (vush) e ataque (tranco) ----------
function sensNpcEventos(ativo){if(typeof NPCS==='undefined')return;
 for(const n of NPCS){if(n.sentado)continue;const rel=(n.dist-dist)*PX_KM,ant=n._gfRel;n._gfRel=rel;
  if(ativo&&ant!=null&&(ant>0)!==(rel>0)&&Math.abs(rel)<500&&T-GF.vushT>.25){GF.vushT=T;vush(clamp(Math.abs((n.v||speed/3.6)*3.6-speed)/12,0,1))}
  if(n.ia){const m=n.modo;if(ativo&&n._gfModo!==undefined&&m!==n._gfModo&&(m==='ataque'||m==='fuga')){const x=bikeX+rel;if(x>WX0&&x<WX1+400)GF.trauma=Math.min(1,GF.trauma+SENS.camAtaque)}n._gfModo=m}}}
// ---------- 9 · ataque visível: em pé, vento atrás e "+12 s" ----------
const _gfNpcSt=npcSt;
npcSt=function(n){const s=_gfNpcSt(n);if(n.ia&&(n.modo==='ataque'||n.modo==='sprint')){const P=META.pedal[FID[n.f]],im=IMG['p_'+n.f+'2'];if(P&&P[2]&&im&&im.width)return 2}return s};
function atacando(n){return n.ia&&!n.sentado&&(n.modo==='ataque'||n.modo==='fuga')}
const _gfNpcDes=npcDesenhar;
npcDesenhar=function(){_gfNpcDes();if(typeof NPCS==='undefined')return;
 for(const n of NPCS){if(!atacando(n))continue;const x=bikeX+(n.dist-dist)*PX_KM;if(x<WX0-200||x>WX1+200)continue;
  const s=segEm(x),ey=s.e+s.m*(x-s.xa),y0=roadY+NPCK.faixa-(n.lane||0)*17-ey;
  ctx.save();ctx.globalAlpha=.85;ctx.strokeStyle='#fff';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();
  for(let i=0;i<5;i++){const ph=(T*2.6+i*.29)%1,xx=x-140-ph*260,yy=y0-50-i*42,l=(110+90*(1-ph));ctx.moveTo(xx,yy);ctx.lineTo(xx-l,yy)}ctx.stroke();ctx.restore();
  const gap=(n.dist-dist)*3600/Math.max(8,speed);if(gap>=1)tx(`+${Math.round(gap)} s`,x-20,y0-345,46,'center','#ffd23a')}};
// ---------- 8 · partículas (tela) ----------
const PART=[],ANEL=[];for(let i=0;i<SENS.partN;i++)PART.push({on:false});for(let i=0;i<8;i++)ANEL.push({on:false});
function partNova(x,y,vx,vy,vida,cor,tam,alvo){for(const p of PART)if(!p.on){p.on=true;p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.t=0;p.vida=vida;p.cor=cor;p.tam=tam;p.alvo=alvo||null;return}}
function anelNovo(x,y,cor,r1){for(const a of ANEL)if(!a.on){a.on=true;a.x=x;a.y=y;a.t=0;a.cor=cor;a.r1=r1;return}}
function gfCiclista(){return camPt(BXS+10,RYS+(-EYB-175)*ZOOM)}
function slotCentro(id){if(typeof slotsHUD!=='function')return null;const i=slotsHUD().indexOf(id);return i<0?null:{x:22+i*86+36,y:820-62}}
function gfUsar(tipo){const c=EFXC[tipo]||EFXC.bonus,[x,y]=gfCiclista();anelNovo(x,y,c,150);
 for(let i=0;i<16;i++){const a=Math.random()*Math.PI*2,v=200+Math.random()*260;partNova(x,y,Math.cos(a)*v,Math.sin(a)*v-140,.55+Math.random()*.35,c,5+Math.random()*4)}}
function gfPegar(tipo,guardou){const[x,y]=gfCiclista();
 if(tipo==='moeda'){const c=[255,215,60];for(let i=0;i<8;i++){const a=Math.random()*Math.PI*2,v=120+Math.random()*160;partNova(x+40,y-20,Math.cos(a)*v,Math.sin(a)*v-160,.45,c,4+Math.random()*3)}return}
 if(tipo==='energetico'){gfUsar('energ');return}
 const sl=guardou?slotCentro(tipo):null;if(!sl){gfUsar(tipo);return}
 const c=EFXC[tipo]||EFXC.bonus,alvo={x:sl.x,y:sl.y,id:tipo,n:10,cor:c};anelNovo(x,y,c,90);
 for(let i=0;i<10;i++){const a=-Math.PI/2+(Math.random()-.5)*2.2,v=260+Math.random()*200;partNova(x,y,Math.cos(a)*v,Math.sin(a)*v,9,c,6+Math.random()*3,alvo)}}
// estado anterior → o que mudou neste quadro (funciona com toque, teclado, controle e torcedor/caminhão/furgão)
function sensItensEventos(){const L=typeof LV!=='undefined'&&LV?LV:null,e={w:water,g:gel,i:L?L.iso:0,b:L?L.banana:0,az:L?!!L.azulUsou:false,p:L?Object.assign({},L.pegos):null,lv:L,el:elapsed},a=GF.est;GF.est=e;
 if(!a||a.lv!==e.lv||e.el<a.el)return;
 const pg=k=>e.p&&a.p&&e.p[k]>(a.p[k]||0);
 if(e.w<a.w)gfUsar('agua');else if(pg('agua'))gfPegar('agua',e.w>a.w);
 if(e.i<a.i)gfUsar('iso');
 if(e.b<a.b)gfUsar('banana');else if(pg('banana'))gfPegar('banana',true);
 if(e.g<a.g)gfUsar('gel');else if(pg('gel'))gfPegar('gel',true);
 if(e.az&&!a.az)gfUsar('azul');
 if(pg('energetico'))gfPegar('energetico');if(pg('moeda'))gfPegar('moeda')}
let PART_T=-1;
function sensParticulas(){const dt=PART_T<0?0:clamp(T-PART_T,0,.05);PART_T=T;
 for(const k in GF.pulso)GF.pulso[k]=Math.max(0,GF.pulso[k]-dt*2.8);
 ctx.save();
 for(const a of ANEL){if(!a.on)continue;a.t+=dt;const f=a.t/.45;if(f>=1){a.on=false;continue}
  ctx.globalAlpha=1-f;ctx.strokeStyle=`rgb(${a.cor[0]},${a.cor[1]},${a.cor[2]})`;ctx.lineWidth=10*(1-f)+2;ctx.beginPath();ctx.arc(a.x,a.y,a.r1*(1-(1-f)*(1-f)),0,7);ctx.stroke()}
 for(const p of PART){if(!p.on)continue;p.t+=dt;
  if(p.alvo){if(p.t>.14){const ax=p.alvo.x-p.x,ay=p.alvo.y-p.y;p.vx+=ax*22*dt;p.vy+=ay*22*dt;p.vx*=1-Math.min(1,4*dt);p.vy*=1-Math.min(1,4*dt);
    if(ax*ax+ay*ay<26*26||p.t>1.6){p.on=false;if(--p.alvo.n===0){anelNovo(p.alvo.x,p.alvo.y,p.alvo.cor,70);GF.pulso[p.alvo.id]=1}continue}}}
  else{p.vy+=900*dt;if(p.t>p.vida){p.on=false;continue}}
  p.x+=p.vx*dt;p.y+=p.vy*dt;const al=p.alvo?1:1-p.t/p.vida;ctx.globalAlpha=Math.max(0,al);ctx.fillStyle=`rgb(${p.cor[0]},${p.cor[1]},${p.cor[2]})`;
  const s=p.tam;ctx.fillRect(p.x-s/2,p.y-s/2,s,s)}
 ctx.restore();
 // 9 · quem atacou e já sumiu na frente: aviso na borda direita
 if(state==='run'&&typeof NPCS!=='undefined'){let k=0;for(const n of NPCS){if(!atacando(n))continue;const x=bikeX+(n.dist-dist)*PX_KM;if(x<=WX1)continue;
   const gap=(n.dist-dist)*3600/Math.max(8,speed);if(gap>180||k>=3)continue;tx(`${n.nome.toUpperCase()} +${Math.round(gap)} s ▶`,W-24,330+k*40,26,'right','#ffd23a');k++}}}
// o espaço do item no HUD pulsa quando o item chega
const _gfItemHUD=itemHUD;
itemHUD=function(id,x,yb){const p=GF.pulso[id]||0;if(p<=0)return _gfItemHUD(id,x,yb);const s=1+.28*Math.sin(Math.PI*p),cx=x+36,cy=yb-62;
 ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);ctx.translate(-cx,-cy);const r=_gfItemHUD(id,x,yb);ctx.restore();return r};
// ---------- 14 · rodas: borrão girando sobre o miolo (chamado dentro da transformação do sprite) ----------
function sensRodas(id,st,ox,oy,k,v){if(v==null)v=speed;const I=clamp((v-SENS.rodaV[0])/(SENS.rodaV[1]-SENS.rodaV[0]),0,1);if(I<.02)return;
 const R=RODAS[id]&&RODAS[id][st];if(!R)return;const ang=T*v*.45;
 ctx.save();for(const[cx,cy,r]of R){const X=ox+cx*k,Y=oy+cy*k,rr=r*k*.8;
  ctx.globalAlpha=SENS.rodaAlfa*I;ctx.fillStyle='#dcdce2';ctx.beginPath();ctx.arc(X,Y,rr,0,7);ctx.arc(X,Y,rr*.2,0,7,true);ctx.fill('evenodd');
  ctx.globalAlpha=SENS.rodaAlfa*.9*I;ctx.strokeStyle='#fff';ctx.lineWidth=rr*.16;
  for(const b of[0,Math.PI]){ctx.beginPath();ctx.arc(X,Y,rr*.62,ang+b,ang+b+1.1);ctx.stroke()}}
 ctx.restore()}
