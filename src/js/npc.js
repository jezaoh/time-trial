/* ===== Outros ciclistas (NPCs) e vácuo =====
   Cada NPC tem potência constante e roda a mesma física do jogador (sem vácuo para eles).
   Posição na tela: bikeX + (npc.dist − dist) × PX_KM (mesma escala do cenário: scroll += speed·dt·9).
   Vácuo: logo atrás da roda traseira de um NPC, o arrasto do jogador cai até 30% (pelotão 40%).
   Só existem na CARREIRA (o contrarrelógio é solo, para o ranking continuar comparável).
   Roteiro por km do jogador: lentos à frente (a gente passa) e rápidos que vêm de trás (passam a gente);
   o PELOTÃO CHEFE (4 ciclistas em bloco) larga junto com você e precisa ser vencido na chegada. */
// o cenário anda 432 px por km de jogo; a posição RELATIVA dos ciclistas usa 2,5× isso, senão uma ultrapassagem levaria
// ~20 s reais (a prova inteira dura ~70 s reais). Arcade: quem é mais rápido passa em poucos segundos.
let PX_KM=9*3600/SCALE;   // mesma escala do chão (senão, na subida, quem é mais lento parece andar de ré)   // recalculado a cada largada (SCALE muda na Carreira)
const NPCK={escala:.95,faixa:-14,     // um pouco menor e numa faixa mais ao fundo
 vacSolo:.25,vacPel:.30,              // redução máxima do arrasto
 vac:[[50,0],[120,1],[440,1],[660,0]]};   // distância entre centros (px) → fração do vácuo
// uniformes: p = cor principal, s = detalhe, h = capacete, w = meias e sapatilhas, b = quadro da bike (null = mantém o original)
const KITS=[null,
 {p:[220,30,30],s:[255,255,255],h:[230,40,40],w:null,b:[40,40,46]},
 {p:[20,150,60],s:[255,215,0],h:null,w:[255,215,0],b:[200,40,40]},
 {p:[255,120,0],s:[30,30,30],h:[40,40,46],w:[40,40,46],b:[255,140,20]},
 {p:[110,40,170],s:[40,220,255],h:[40,220,255],w:null,b:null},
 {p:[25,60,200],s:[230,30,40],h:[230,30,40],w:[230,30,40],b:[230,40,40]},
 {p:[10,90,70],s:[240,240,240],h:null,w:null,b:[20,120,70]},
 {p:[30,30,35],s:[255,90,170],h:[255,90,170],w:[30,30,35],b:[255,90,170]},
 {p:[255,210,0],s:[20,20,24],h:[20,20,24],w:[255,210,0],b:[20,20,24]},
 {p:[0,170,200],s:[255,255,255],h:null,w:null,b:[0,150,190]},
 {p:[150,20,40],s:[255,190,0],h:[255,190,0],w:null,b:[150,20,40]},
 {p:[90,200,40],s:[20,60,20],h:[90,200,40],w:[20,60,20],b:[60,60,66]},
 {p:[250,250,250],s:[220,0,40],h:[220,0,40],w:null,b:[220,0,40]},
 {p:[60,70,90],s:[255,120,0],h:[255,120,0],w:[255,120,0],b:[255,120,0]}];
const FS=['a','v','b'],FID={a:'azul',v:'vinho',b:'branco'},fRnd=()=>FS[Math.floor(Math.random()*3)];
// at: km do jogador · tipo: frente (já está lá adiante) | tras (vem de trás e passa) | pelotao
const ROTEIRO_BASE=[{at:1,tipo:'frente',w:120,f:'a',k:2},{at:3.5,tipo:'tras',w:275,f:'v',k:1},{at:6.8,tipo:'frente',w:125,f:'v',k:0},
 {at:13,tipo:'frente',w:115,f:'a',k:6},{at:17,tipo:'tras',w:280,f:'a',k:0},{at:21,tipo:'frente',w:130,f:'v',k:3},
 {at:27.5,tipo:'frente',w:120,f:'a',k:4},{at:31.5,tipo:'pelotao',w:300,k:5},{at:43,tipo:'frente',w:125,f:'v',k:7}];
let ROTEIRO=[];   // montado em carreira.js para cada prova (km reescalados)
const NPC_GAP=270,NPC_CHASE=10,NPC_M=70;   // espaço entre ciclistas do pelotão (px) · quem vem de trás chega a +10 km/h até passar
let NPCS=[],npcI=0,pEma=175,aviso={t:0,s:''},PEL={lider:null,fim:null};
function markVis(n){const x=bikeX+(n.dist-dist)*PX_KM;if(x>WX0-200&&x<WX1+200)n.visto=true;
 const xt=n.cauda?x-n.cauda.ord*NPC_GAP:x;   // grupo: só sai pela direita quando o último sair
 n.fora=!n.chefe&&!n.fixo&&((x<WX0-260&&!n.chase&&(n.visto||x<WX0-3000))||(xt>WX1+260&&n.visto&&!n.lider)||n.dist>GOAL+.5)}
function npcR(v,gr){const th=Math.atan(gr/100),m=NPC_M+AJ.bike;return m*AJ.g*(Math.sin(th)+AJ.crr*Math.cos(th))+.5*AJ.rho*AJ.cda*v*v}
function npcVeq(P,gr){let lo=.3,hi=40;for(let i=0;i<50;i++){const v=(lo+hi)/2;if(AJ.eta*P>v*npcR(v,gr))lo=v;else hi=v}return lo}
function npcNovo(o,gapPx){const gr=terrain(dist),n={dist:dist+gapPx/PX_KM,w:o.w,v:npcVeq(o.w,gr),gr,f:o.f,k:o.k,pel:!!o.pel,lider:o.lider||null,
  ped:Math.random()*10,visto:false,chase:gapPx<0};if(n.chase)n.v=Math.max(n.v,speed/3.6+NPC_CHASE/3.6);NPCS.push(n);return n}
function npcGerar(o){
 if(o.tipo==='frente')npcNovo(o,WX1+170-bikeX);              // logo além da borda direita
 else if(o.tipo==='tras')npcNovo(o,WX0-bikeX-170);              // logo antes da borda esquerda
 else{let L=null;const N=o.n||4;for(let i=0;i<N;i++){const n=npcNovo({w:o.w,f:fRnd(),k:o.kits?o.kits[i%o.kits.length]:o.k,pel:true,lider:L},WX0-bikeX-170-i*NPC_GAP);if(!L)L=n;n.ord=i;n.lane=N>4?i%3:0;L.cauda=n}
  aviso={t:3.5,s:N>=6?'PELOTÃO CHEGANDO! PEGUE O VÁCUO':`GRUPO DE ${N} CHEGANDO`}}}
// pelotão chefe: larga junto, você na roda do último (360 px); ataca +10% na subida final e +40% no último km
function npcChefe(w){let L=null;for(let i=0;i<4;i++){const n=npcNovo({w,f:i%2?'v':'a',k:5,pel:true,lider:L},360+(3-i)*NPC_GAP);n.chefe=true;n.v=speed/3.6;
  if(!L)L=n;n.ord=i;L.cauda=n}PEL={lider:L,fim:null}}
function chefeW(n){const c=climbs[climbs.length-1];return n.w*(n.dist>=GOAL-1?1.4:n.dist>=c.start&&n.dist<c.end?1.1:1)}
const _npcReset=reset;
reset=function(){_npcReset();PX_KM=9*3600/SCALE;NPCS=[];npcI=0;pEma=FTP*AJ.cruise;vacuo=0;aviso={t:0,s:''};PEL={lider:null,fim:null}};
const _npcUpdate=update;
update=function(dt){
 // vácuo do jogador: o NPC mais favorável à frente
 let alvo=0;for(const n of NPCS){const g=(n.dist-dist)*PX_KM;if(g<150||g>700||n.sentado)continue;alvo=Math.max(alvo,curva(NPCK.vac,g)*(n.pel?NPCK.vacPel:NPCK.vacSolo))}
 if(typeof vacExtra==='function')alvo=Math.max(alvo,vacExtra());   // vácuo de veículos (Pedal Livre)
 vacuo=lerp(vacuo,alvo,Math.min(1,dt*3));if(vacuo<.003)vacuo=0;
 _npcUpdate(dt);if(state!=='run')return;
 pEma=lerp(pEma,power,Math.min(1,dt/20));
 while(npcI<ROTEIRO.length&&dist>=ROTEIRO[npcI].at){const o=ROTEIRO[npcI++];if(dist-o.at<.6)npcGerar(o)}
 const m=NPC_M+AJ.bike,h=dt*AJ.kin/4;
 for(const n of NPCS){n.gr=lerp(n.gr,terrain(Math.min(GOAL,n.dist)),Math.min(1,dt*1.4));let v=n.v;
  if(n.lider){n.v=n.lider.v;n.dist=n.lider.dist-n.ord*NPC_GAP/PX_KM;n.ped+=n.v*3.6*dt*.5;markVis(n);continue}   // pelotão anda em bloco atrás do líder
  if(n.ia){markVis(n);continue}   // ciclistas da corrida: física e decisões em corrida.js
  n.wEf=n.chefe?chefeW(n):n.w;
  for(let i=0;i<4;i++){const a=(AJ.eta*n.wEf/Math.max(v,AJ.vmin)-npcR(v,n.gr))/m;v=clamp(v+a*h,1.1,AJ.vmax/3.6)}
  const ult=n.cauda||n;if(n.chase&&(ult.dist-dist)*PX_KM>330)n.chase=false;   // terminou de passar (o último do grupo já está à frente)
  if(n.chase)v=Math.max(v,lerp(n.v,speed/3.6+NPC_CHASE/3.6,Math.min(1,dt*2)));
  n.v=v;n.dist+=v*3.6*dt/3600*SCALE;n.ped+=v*3.6*dt*.5;
  if(n===PEL.lider&&PEL.fim==null&&n.dist>=GOAL)PEL.fim=elapsed;
  markVis(n)}
 for(const n of NPCS)if(n.lider)n.fora=n.lider.fora;     // o pelotão some junto
 NPCS=NPCS.filter(n=>!n.fora);if(aviso.t>0)aviso.t-=dt};
// sprite tingido: quadro → canvas temporário; máscara da cor principal e do detalhe aplicadas com mistura 'color' (mantém sombras)
const npcCv=document.createElement('canvas'),npcCx=npcCv.getContext('2d'),npcMv=document.createElement('canvas'),npcMx=npcMv.getContext('2d');
// cache dos quadros já tingidos (cada um ~300 KB; no máximo 48 guardados → ~15 MB)
const npcCache=new Map(),NPC_CACHE=240;
function npcQuadroC(f,st,fi,k){const ch=f+st+'_'+fi+'_'+k;let c=npcCache.get(ch);
 if(c){npcCache.delete(ch);npcCache.set(ch,c);return c}
 const[cv,fw,fh]=npcQuadro(f,st,fi,KITS[k]),o=document.createElement('canvas');o.width=Math.round(fw*.72);o.height=Math.round(fh*.72);o.getContext('2d').drawImage(cv,0,0,o.width,o.height);
 c=[o,fw,fh];npcCache.set(ch,c);if(npcCache.size>NPC_CACHE)npcCache.delete(npcCache.keys().next().value);return c}
function npcQuadro(f,st,fi,kit){const id=FID[f],[fw,fh]=META.pedal[id][st],img=IMG['p_'+f+st];
 if(npcCv.width!==fw||npcCv.height!==fh){npcCv.width=fw;npcCv.height=fh}else npcCx.clearRect(0,0,fw,fh);
 const sx=(fi%5)*fw,sy=Math.floor(fi/5)*fh;npcCx.globalCompositeOperation='source-over';npcCx.drawImage(img,sx,sy,fw,fh,0,0,fw,fh);
 // peças brancas (capacete, meia/sapatilha, uniforme do branco): multiplicação; peças coloridas: mistura 'color'
 if(kit)for(const c of['p','s','h','w','b']){const col=kit[c];if(!col)continue;const mk=IMG['m_'+f+st+'_'+c];if(!mk||!mk.width)continue;const k=img.width/mk.width;
  if(npcMv.width!==fw||npcMv.height!==fh){npcMv.width=fw;npcMv.height=fh}
  npcMx.globalCompositeOperation='copy';npcMx.drawImage(mk,sx/k,sy/k,fw/k,fh/k,0,0,fw,fh);
  npcMx.globalCompositeOperation='source-in';npcMx.fillStyle='rgb('+col+')';npcMx.fillRect(0,0,fw,fh);
  npcCx.globalCompositeOperation=(c==='h'||c==='w'||(f==='b'&&c==='p'))?'multiply':'color';npcCx.drawImage(npcMv,0,0)}
 npcCx.globalCompositeOperation='source-over';return[npcCv,fw,fh]}
function npcSt(n){const r=n.ia?n.w/n.ftp:(n.lider?n.lider.wEf:n.wEf||n.w)/250,g=n.gr;return g>SPR.subida&&r>=SPR.subidaPct?2:r>=SPR.bravo?1:0}
let NPC_DES=null;   // NPC sendo desenhado agora (luz.js usa para a lanterna de cada um)
function npcDesenhar(){if(typeof porticosArte==='function')porticosArte();if(!NPCS.length)return;
 const lista=NPCS.map(n=>({n,x:bikeX+(n.dist-dist)*PX_KM})).filter(o=>!o.n.sentado&&o.x>WX0-200&&o.x<WX1+200).sort((a,b)=>((b.n.lane||0)-(a.n.lane||0))||(b.x-a.x));
 for(const{n,x}of lista){NPC_DES=n;const id=FID[n.f],st=npcSt(n),fi=Math.floor(n.ped)%10,s=segEm(x),ey=s.e+s.m*(x-s.xa);
  const ln=n.lane||0,esc=NPCK.escala-ln*.045,[cv,fw,fh]=npcQuadroC(n.f,st,fi,n.k),k=KS*esc,pdx=(META.pedalDx[id]||[])[st]||0;
  ctx.save();ctx.translate(x,roadY+NPCK.faixa-ln*17-ey);ctx.rotate(-Math.atan(s.m));
  ctx.drawImage(cv,0,0,cv.width,cv.height,-150*esc-pdx*k,-fh*k,fw*k,fh*k);if(typeof sensRodas==='function')sensRodas(id,st,-150*esc-pdx*k,-fh*k,k,(n.v||0)*3.6);ctx.restore()}}
function npcHud(){
 if(vacuo>.04&&state==='run'){const a=clamp(vacuo/.1,0,1);ctx.globalAlpha=a;const s=`VÁCUO −${Math.round(vacuo*100)}% ARRASTO`;
  ctx.font='italic 800 22px Exo2,system-ui,sans-serif';const w=ctx.measureText(s).width+30;rr(BXS-w/2,404-EYB*ZOOM,w,38,19);ctx.fillStyle='#0a1a2ccc';ctx.fill();
  ctx.lineWidth=3;ctx.strokeStyle='#7ee0ff';ctx.stroke();tx(s,BXS,431-EYB*ZOOM,22,'center','#7ee0ff');ctx.globalAlpha=1}
 if(aviso.t>0&&state==='run'&&(aviso.s.startsWith('FUGA')||aviso.s.startsWith('ATAQUE'))){ctx.globalAlpha=clamp(aviso.t,0,1);const w=640;rr(W/2-w/2,282,w,62,18);ctx.fillStyle='#0a1a2cdd';ctx.fill();
  ctx.lineWidth=3;ctx.strokeStyle='#ffd800';ctx.stroke();tx(aviso.s,W/2,324,28,'center','#ffd800');ctx.globalAlpha=1}
 // distância para o pelotão chefe, em tempo de prova
 if(PEL.lider&&(state==='run'||state==='paused')){const L=PEL.lider,c=L.cauda||L,dk=c.dist-dist,fr=dk>0,v=Math.max(5,(fr?c.v*3.6:speed)),sg=Math.abs(dk)/v*3600;
  const s=Math.abs(dk*PX_KM)<440&&fr?'NA RODA DO PELOTÃO':fr?`PELOTÃO ${Math.floor(sg/60)}:${String(Math.floor(sg%60)).padStart(2,'0')} À FRENTE`:`VOCÊ ${Math.floor(sg/60)}:${String(Math.floor(sg%60)).padStart(2,'0')} À FRENTE DO PELOTÃO`;
  const col=!fr?'#a8ffb4':Math.abs(dk*PX_KM)<440?'#7ee0ff':'#ff8a80';ctx.font='italic 800 22px Exo2,system-ui,sans-serif';const w=ctx.measureText(s).width+34;
  rr(W/2-w/2,226,w,38,19);ctx.fillStyle='#0a1a2cd8';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=col;ctx.stroke();tx(s,W/2,253,22,'center',col)}}
