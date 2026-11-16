/* ===== Efeitos de itens, sons de coleta, moedas girando, moedas no HUD, vácuo contado e CONQUISTAS ===== */
// ---------- efeito colorido ao usar/pegar itens (ciclista e barra de stamina) ----------
const EFX={t:0,cor:[255,235,120]},EFXC={agua:[70,170,255],iso:[130,255,60],banana:[255,215,40],gel:[255,130,30],azul:[50,200,255],energ:[255,205,40],bonus:[255,240,150]};
function efeito(k,dur=1.5){EFX.cor=EFXC[k]||EFXC.bonus;EFX.t=dur}
function tocar(k,vol=1){try{if(!AC||!BUF[k])return;const s=AC.createBufferSource(),g=AC.createGain();s.buffer=BUF[k];g.gain.value=vol;s.connect(g);g.connect(gSfx);s.start()}catch(e){}}
const _exDrink=drink;drink=function(){const w0=water;_exDrink();if(water<w0)efeito('agua',1.6)};
const _exEat=eat;eat=function(){const g0=gel;_exEat();if(gel<g0)efeito('gel',1.8)};
const _exSB=staminaBar;
staminaBar=function(x,y,w){_exSB(x,y,w);if(EFX.t<=0)return;const A=IMG.st_aro;if(!A||!A.width)return;const k=w/A.width,h=A.height*k,a=clamp(EFX.t,0,1)*(.55+.25*Math.sin(T*12)),[R,G,B]=EFX.cor;
 ctx.save();ctx.globalCompositeOperation='lighter';rr(x+14*k,y+24*k,1172*k,62*k,31*k);ctx.fillStyle=`rgba(${R},${G},${B},${.45*a})`;ctx.fill();
 ctx.lineWidth=10;ctx.strokeStyle=`rgba(${R},${G},${B},${.7*a})`;rr(x-2,y-2,w+4,h+4,h/2);ctx.stroke();ctx.restore()};
// ---------- vácuo percorrido (km) e tempo dos efeitos ----------
const _exUpd=update;
update=function(dt){const d0=dist;_exUpd(dt);if(state==='run'||state==='over'){if(EFX.t>0)EFX.t-=dt;if(typeof LV!=='undefined'&&LV&&vacuo>.05&&dist>d0&&d0>=0)LV.vacKm+=dist-d0;if(LV&&MODO==='carreira')conqAoVivo()}};
// ---------- moedas da pista girando, com sombra ----------
const _exIA=itemArte;
itemArte=function(t,x,y){if(t!=='moeda'){_exIA(t,x,y);return}const im=IMG.moeda_gira;if(!im||!im.width){_exIA(t,x,y);return}
 const s=86,fi=Math.floor(T*14+x*.004)%16,c=im.width/4,fl=Math.sin(T*4+x*.02)*4;
 ctx.save();ctx.globalAlpha=.28;ctx.beginPath();ctx.ellipse(x,y+6,s*.36,s*.09,0,0,7);ctx.fillStyle='#000';ctx.fill();ctx.restore();
 ctx.drawImage(im,(fi%4)*c,Math.floor(fi/4)*c,c,c,x-s/2,y-34-s/2+fl,s,s)};
// ---------- HUD: moedas (saldo + o que este pedal está rendendo) embaixo do tempo ----------
const _exHud=hud;
hud=function(){_exHud();if(MODO!=='carreira'||typeof CS==='undefined')return;
 const est=typeof LV!=='undefined'&&LV&&LV.livre?moedasPedal():Math.floor(Math.max(0,dist)*CAR.moedas.rachaoKm);
 pilula(104,104,262,56);moedaIc(112,108,48);tx(`${CS.moedas}`,170,145,30);ctx.font=FT(900,30);const w=ctx.measureText(`${CS.moedas}`).width;tx(`+${est}`,180+w,145,26,'left','#ffd23a');
 conqToast()};
// ---------- CONQUISTAS (estilo WoW): marcos com recompensa; todas as de distância dão um título ----------
const CONQ=[
 {id:'l30',n:'PRIMEIRO GIRO',d:'Pedal Livre: 30 km',km:30,rec:{banana:1}},
 {id:'l50',n:'MEIO CENTENÁRIO',d:'Pedal Livre: 50 km',km:50,rec:{banana:2}},
 {id:'l70',n:'PERNAS DE AÇO',d:'Pedal Livre: 70 km',km:70,rec:{banana:3}},
 {id:'l100',n:'CENTURIÃO',d:'Pedal Livre: 100 km',km:100,rec:{gel:2}},
 {id:'vac10',n:'PAPA-VÁCUO',d:'10 km no vácuo em um pedal',vac:10,rec:{iso:1}},
 {id:'meta_dist',n:'SENHOR DA ESTRADA',d:'Todas as conquistas de distância',meta:['l30','l50','l70','l100'],rec:{gel:3},titulo:'Senhor da Estrada'}];
const RECN={moedas:['moeda','moedas'],banana:['banana','bananas'],gel:['gel','géis'],iso:['isotônico','isotônicos'],azul:['gel azul','géis azuis'],agua7:['água 700 ml','águas 700 ml']};
const recTxt=r=>Object.entries(r).map(([k,n])=>`+${n} ${RECN[k][n>1?1:0]}`).join(' · ');
let TOAST=[];
function conqNovas(){return (CS.conqNovas||[]).length}
// mudo: conquista retroativa (dados já salvos) — marca NOVA no hub, sem aviso nem som
function conqDar(c,mudo){CS.conq=CS.conq||{};if(CS.conq[c.id])return;CS.conq[c.id]=Date.now();for(const[k,n]of Object.entries(c.rec||{})){if(k==='moedas')CS.moedas+=n;else CS.inv[k]=(CS.inv[k]||0)+n}
 if(c.titulo)CS.titulo=c.titulo;(CS.conqNovas=CS.conqNovas||[]).push(c.id);if(!mudo){TOAST.push({c,t:0});tocar('bonus')}carSalvar();
 for(const m of CONQ)if(m.meta&&!CS.conq[m.id]&&m.meta.every(id=>CS.conq[id]))conqDar(m,mudo)}
function conqAoVivo(){if(!LV||!LV.livre||state!=='run')return;CS.conq=CS.conq||{};for(const c of CONQ){if(CS.conq[c.id])continue;if((c.km&&dist>=c.km)||(c.vac&&LV.vacKm>=c.vac))conqDar(c)}}
function conqToast(){if(!TOAST.length)return;const o=TOAST[0];if(o.lt!==T){o.t+=1/60;o.lt=T}   // pode ser desenhado 2× no mesmo quadro (HUD e tela de resultado)if(o.t>4.2){TOAST.shift();return}
 const a=clamp(Math.min(o.t*3,(4.2-o.t)*2),0,1),y=250-(1-a)*30,w=640;ctx.save();ctx.globalAlpha=a;rr(W/2-w/2,y,w,110,22);ctx.fillStyle='#14161cf0';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#ffcc00';ctx.stroke();
 tx('CONQUISTA DESBLOQUEADA',W/2,y+32,20,'center','#ffcc00');tx(o.c.n,W/2,y+72,38,'center','#fff');tx(typeof cqRecTxt==='function'?cqRecTxt(o.c):recTxt(o.c.rec)+(o.c.titulo?` · título "${o.c.titulo}"`:''),W/2,y+100,19,'center','#a8ffb4');ctx.restore()}
// CONQUISTAS (maquete): progresso em segmentos + cards 2×3 com medalha, textos e situação
const CONQ_ARTE={l30:'conq_l30',l50:'conq_l50',l70:'conq_l70',l100:'conq_l100',vac10:'conq_vac',meta_dist:'conq_senhor'};
function visto(cx,cy,s){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';const p=()=>{ctx.beginPath();ctx.moveTo(cx-26*s,cy);ctx.lineTo(cx-8*s,cy+18*s);ctx.lineTo(cx+28*s,cy-22*s);ctx.stroke()};
 ctx.strokeStyle=MN.esc;ctx.lineWidth=20*s;p();ctx.strokeStyle=MN.verde;ctx.lineWidth=11*s;p();ctx.restore()}
function cadeado(cx,cy){ctx.save();ctx.lineWidth=7;ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(cx,cy-10,15,Math.PI,0);ctx.lineTo(cx+15,cy);ctx.moveTo(cx-15,cy);ctx.lineTo(cx-15,cy-10);ctx.stroke();
 rr(cx-24,cy-2,48,38,8);ctx.fillStyle='#fff';ctx.fill();ctx.fillStyle=MN.bg;ctx.beginPath();ctx.arc(cx,cy+14,6,0,7);ctx.fill();ctx.fillRect(cx-2.5,cy+14,5,12);ctx.restore()}
function drawConquistas(){fundo();tituloGrande('CONQUISTAS',84,72);btnVoltar('VOLTAR',()=>{CS.conqNovas=[];carSalvar();toHub()});moedasChip();
 CS.conq=CS.conq||{};const nv=CS.conqNovas||[],tem=CONQ.filter(c=>CS.conq[c.id]).length;
 // progresso
 tx(`${tem} DE ${CONQ.length} CONQUISTAS`,692,154,30,'right','#fff');
 const px=712,pw=430,ph=40,py=124;rr(px,py,pw,ph,ph/2);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=MN.esc;ctx.stroke();
 const sg=(pw-16-(CONQ.length-1)*4)/CONQ.length;CONQ.forEach((c,i)=>{rr(px+8+i*(sg+4),py+7,sg,ph-14,(ph-14)/2);ctx.fillStyle=i<tem?MN.ama:'#9aa8b8';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=MN.esc;ctx.stroke()});
 ctx.fillStyle=MN.borda;ctx.fillRect(180,142,180,5);ctx.fillRect(1176,142,180,5);
 CONQ.forEach((c,i)=>{const w=728,h=198,x=32+(i%2)*(w+16),y=186+Math.floor(i/2)*(h+16),ok=!!CS.conq[c.id],nova=nv.includes(c.id);
  cardMenu(x,y,w,h,nova?MN.ama:ok?MN.borda:MN.cinza,nova?8:5,26);
  const art=IMG[CONQ_ARTE[c.id]];if(art&&art.width){const ah=182,aw=art.width*ah/art.height;ctx.save();if(!ok){ctx.filter='grayscale(1) brightness(.85)';ctx.globalAlpha=.8}ctx.drawImage(art,x+8,y+8,aw,ah);ctx.restore()}
  ctx.lineWidth=4;ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(x+232,y+28);ctx.lineTo(x+226,y+h-28);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+w-176,y+28);ctx.lineTo(x+w-182,y+h-28);ctx.stroke();
  const tw=w-226-224;txFit(c.n,x+246,y+60,38,tw,'left',MN.tit);txFit(c.d,x+246,y+104,26,tw,'left','#fff');txFit(recTxt(c.rec),x+246,y+144,26,tw,'left','#fff');
  if(c.titulo)txFit(`título "${c.titulo}"`,x+246,y+178,20,tw,'left','#cfe3f1');
  const sx=x+w-88;if(ok){visto(sx,y+78,1.1);tx(nova?'NOVA!':'CONQUISTADA',sx,y+150,nova?28:21,'center',nova?MN.tit:MN.verde)}
  else{cadeado(sx,y+74);tx('BLOQUEADA',sx,y+150,21,'center','#fff')}})}
// fim de prova: conquistas de vácuo também valem se o pedal terminou
const _exFin=finish;finish=function(w){if(typeof LV!=='undefined'&&LV&&LV.livre&&MODO==='carreira'&&!LV.encerrou)conqAoVivo();_exFin(w)};
