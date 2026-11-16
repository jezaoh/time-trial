/* ===== LUZ, SOMBRA E VENTO NA DESCIDA (16/11) — só visual, todos os modos =====
   1 · PERÍODO DO DIA sorteado a cada pedalada (decisão do dono: "a hora vai ser aleatória"; noite não): amanhecer, dia,
       fim de tarde, anoitecer. Por camada, não uma tinta única: céu com degradê próprio, sol SÓ com brilho (sem disco de
       borda seca — pedido do dono) atrás das montanhas, névoa nas camadas do fundo (montanhas mais, morros menos),
       gradação de cor + raios + vinheta antes do HUD (o HUD fica sem filtro).
       As camadas fixas na tela são desenhadas UMA vez por período em telas guardadas (LZC) e só coladas a cada quadro.
       Se o jogo ficar lento (média > 24 ms por quadro por ~4 s) a névoa sai sozinha (LUZ.leve). LUZ.on=false desliga tudo.
   2 · SOMBRA embaixo de cada ciclista (jogador e NPCs): mancha pequena, chapada, borda dura (estilo desenho animado),
       que respira com a pedalada (LUZ_SOMBRA). Igual em todos os períodos.
   3 · LINHAS DE VENTO: as retas originais de sensacao.js (a versão que seguia o relevo foi desfeita a pedido do dono).
       Os raios do sol têm borda desfocada.
   Ganchos (todos por nome, sem mexer nos outros arquivos): camada/morros (céu e névoa), npcDesenhar (sombras),
   sensVento (gradação + vento), reset (sorteio). */
const LUZ={on:true,leve:false,p:'dia',
 peso:{amanhecer:.2,dia:.4,tarde:.25,anoitecer:.15},
 P:{
  amanhecer:{ceu:['#86a9e6','#ffd6b8'],ceuA:.55,sol:[250,262],solR:46,solCor:'#fff4dc',brilho:'#ffe6c4',brilhoA:.85,brilhoR:620,
   nevoa:'#fff4ec',nevoaA:[.5,.3],grade:['#dcdfff','#ffe0cc'],gradeA:.55,raios:.08,vinheta:.16},
  dia:{ceu:null,sol:null,nevoa:null,grade:null,raios:0,vinheta:0},
  tarde:{ceu:['#5d7fc4','#ffb36e'],ceuA:.62,sol:[1290,268],solR:50,solCor:'#fff0c4',brilho:'#ffc874',brilhoA:.95,brilhoR:760,
   nevoa:'#ffcf96',nevoaA:[.38,.2],grade:['#ffd29a','#e3946a'],gradeA:.68,raios:.13,vinheta:.26},
  anoitecer:{ceu:['#2f3a78','#ff8f5e'],ceuA:.72,sol:[1180,330],solR:54,solCor:'#ffd2a2',brilho:'#ff9a6c',brilhoA:.8,brilhoR:560,
   nevoa:'#d9a2c4',nevoaA:[.3,.16],grade:['#8f86c8','#6f5f98'],gradeA:.8,raios:.05,vinheta:.38}}};
function luzSorteia(){let r=Math.random(),acc=0;for(const[k,p]of Object.entries(LUZ.peso)){acc+=p;if(r<=acc){LUZ.p=k;break}}LZC.k=null}
const _luzReset=reset;reset=function(){_luzReset();luzSorteia()};
const luzP=()=>LUZ.on?LUZ.P[LUZ.p]:LUZ.P.dia;
// ---------- telas guardadas do período (céu, brilho, névoa, gradação, raios+vinheta) ----------
const LZC={k:null},LZC_CEU=660;   // o céu do período vai até a base dos morros
function luzTela(f){const c=document.createElement('canvas');c.width=W;c.height=H;f(c.getContext('2d'));return c}
// desempenho: céu + sol numa tela só (colada normal, só a faixa de cima); névoa colada só na faixa dela;
// raios + vinheta numa tela só. Por quadro: 4 colagens normais + 1 multiplicação (antes eram 7 de tela cheia).
function luzMontar(){const L=luzP();LZC.k=LUZ.p+(LUZ.on?1:0);
 LZC.ceu=L.ceu?luzTela(g=>{const d=g.createLinearGradient(0,0,0,600);d.addColorStop(0,L.ceu[0]);d.addColorStop(1,L.ceu[1]);g.globalAlpha=L.ceuA;g.fillStyle=d;g.fillRect(0,0,W,LZC_CEU);
   if(L.sol){const[x,y]=L.sol,r=L.brilhoR,s=g.createRadialGradient(x,y,0,x,y,r);s.addColorStop(0,'#fffef6');s.addColorStop(.05,'#fffbe8');s.addColorStop(.14,L.brilho+'dd');s.addColorStop(.42,L.brilho+'55');s.addColorStop(1,L.brilho+'00');
    g.globalAlpha=L.brilhoA;g.globalCompositeOperation='screen';g.fillStyle=s;g.fillRect(0,0,W,LZC_CEU);
    // disco do sol com borda esfumaçada (sem borda seca): cheio até 55% do raio, some até 100%
    if(L.solR){const R=L.solR,d2=g.createRadialGradient(x,y,0,x,y,R);d2.addColorStop(0,'#fffffa');d2.addColorStop(.68,L.solCor);d2.addColorStop(.84,L.solCor+'aa');d2.addColorStop(1,L.solCor+'00');
     g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle=d2;g.fillRect(x-R,y-R,2*R,2*R)}}}):null;
 const nev=(y0,y1)=>L.nevoa?luzTela(g=>{const d=g.createLinearGradient(0,y0,0,y1);d.addColorStop(0,L.nevoa+'00');d.addColorStop(.55,L.nevoa);d.addColorStop(1,L.nevoa+'00');g.fillStyle=d;g.fillRect(0,y0,W,y1-y0)}):null;
 LZC.nev0=nev(280,560);LZC.nev1=nev(380,660);
 LZC.grade=L.grade?luzTela(g=>{const d=g.createLinearGradient(0,0,0,H);d.addColorStop(0,L.grade[0]);d.addColorStop(1,L.grade[1]);g.fillStyle=d;g.fillRect(0,0,W,H)}):null;
 LZC.raios=(L.raios&&L.sol)||L.vinheta?luzTela(g=>{if(L.raios&&L.sol){const q=8,pc=document.createElement('canvas');pc.width=Math.ceil(W/q);pc.height=Math.ceil(H/q);
   const g0=g;g=pc.getContext('2d');g.scale(1/q,1/q);   // raios numa tela 8× menor e ampliados: borda desfocada (sem ctx.filter, funciona no iPhone)
   const[x,y]=L.sol,lado=x>W/2?Math.PI:0;
   for(let i=0;i<8;i++){const a=lado+(x>W/2?-1:1)*(Math.PI*(.06+i*.075)),w=.018+.016*((i*5)%3),d=g.createRadialGradient(x,y,40,x,y,1500);
    d.addColorStop(0,`rgba(255,244,214,${L.raios})`);d.addColorStop(1,'rgba(255,244,214,0)');g.fillStyle=d;
    g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a-w)*1700,y+Math.sin(a-w)*1700);g.lineTo(x+Math.cos(a+w)*1700,y+Math.sin(a+w)*1700);g.closePath();g.fill()}
   g=g0;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(pc,0,0,W,H)}
  if(L.vinheta){const d=g.createRadialGradient(W/2,H*.55,H*.42,W/2,H*.55,H*1.08);d.addColorStop(0,'rgba(0,0,0,0)');d.addColorStop(1,`rgba(28,10,20,${L.vinheta})`);g.fillStyle=d;g.fillRect(0,0,W,H)}}):null}
function luzPronta(){if(LZC.k!==LUZ.p+(LUZ.on?1:0))luzMontar();return luzP()}
// cola uma tela guardada (só a faixa y0..y1, para não gastar com o que é transparente)
function luzCola(c,op,a,y0=0,y1=H){if(!c||a<=0)return;ctx.save();ctx.globalCompositeOperation=op;ctx.globalAlpha=a;ctx.drawImage(c,0,y0,W,y1-y0,0,y0,W,y1-y0);ctx.restore()}
// céu do período + brilho do sol: logo antes das montanhas (o sol fica atrás delas)
const _luzCamada=camada;camada=function(img,off,y,fade){const mont=img&&img===IMG.cen_mont;
 if(mont){luzPronta();luzCola(LZC.ceu,'source-over',1,0,LZC_CEU)}
 _luzCamada(img,off,y,fade);
 if(mont&&!LUZ.leve){const L=luzP();if(L.nevoa)luzCola(LZC.nev0,'source-over',L.nevoaA[0],280,560)}};
const _luzMorros=morros;morros=function(off){_luzMorros(off);if(!LUZ.leve){const L=luzP();if(L.nevoa)luzCola(LZC.nev1,'source-over',L.nevoaA[1],380,660)}};
// ---------- 2 · sombras (mundo, antes de qualquer ciclista) ----------
// x0,x1: centros das rodas (local) · r: raio · cada sombra é desenhada já no sistema do ciclista (translate + rotate)
// sombra de desenho animado (16/11, pedido do dono): mancha pequena, cor chapada e borda dura embaixo da bike,
// sem degradê nem sombra comprida; "respira" um pouco com a pedalada (fase = quadro da perna, 0..10)
const LUZ_SOMBRA={cor:'#16182a',a:.6,larg:.55,alt:.16,y:.05,resp:.05};
function luzSombra(x0,x1,r,fase){const S=LUZ_SOMBRA,rx=(x1-x0)/2+r*S.larg,b=Math.sin((fase||0)/10*Math.PI*4);
 ctx.save();ctx.globalAlpha=S.a;ctx.fillStyle=S.cor;ctx.beginPath();ctx.ellipse((x0+x1)/2,r*S.y,rx*(1+S.resp*b),r*S.alt*(1-S.resp*b),0,0,Math.PI*2);ctx.fill();ctx.restore()}
function luzSombraDe(id,st,ox,k,fase){const R=RODAS[id]&&RODAS[id][st];if(!R)return;luzSombra(ox+R[0][0]*k,ox+R[1][0]*k,R[0][2]*k,fase)}
const _luzNpcDes=npcDesenhar;npcDesenhar=function(){
 if(typeof NPCS!=='undefined')for(const n of NPCS){if(n.sentado||(n.ia===false&&!n.f))continue;const x=bikeX+(n.dist-dist)*PX_KM;if(x<WX0-200||x>WX1+200)continue;
  const id=FID[n.f];if(!id||!META.pedal[id])continue;const st=npcSt(n),s=segEm(x),ey=s.e+s.m*(x-s.xa),ln=n.lane||0,esc=NPCK.escala-ln*.045,k=KS*esc,pdx=(META.pedalDx[id]||[])[st]||0;
  ctx.save();ctx.translate(x,roadY+NPCK.faixa-ln*17-ey);ctx.rotate(-Math.atan(s.m));luzSombraDe(id,st,-150*esc-pdx*k,k,n.ped%10);ctx.restore()}
 const id=jogadorSkin();if(META.pedal[id]){const st=spriteSt(),pdx=((META.pedalDx||{})[id]||[])[st]||0;
  ctx.save();ctx.translate(bikeX,roadY-EYB);ctx.rotate(-Math.atan(vsl(terrain(dist))));luzSombraDe(id,st,-150-pdx*KS,KS,pedal%10);ctx.restore()}
 _luzNpcDes()};
// ---------- 1 (fim) + 3 · gradação de cor antes do HUD e linhas de vento seguindo a estrada ----------
const LZT={t:-1,soma:0,n:0,ruim:0};
function luzDesempenho(){const t=performance.now();if(LZT.t>0){const d=t-LZT.t;if(d<200){LZT.soma+=d;LZT.n++}}LZT.t=t;
 if(LZT.n>=60){const m=LZT.soma/LZT.n;LZT.soma=0;LZT.n=0;LZT.ruim=m>24?LZT.ruim+1:0;if(LZT.ruim>=4&&!LUZ.leve)LUZ.leve=true}}
const _luzVento=sensVento;   // linhas de vento: as retas originais de sensacao.js (dono preferiu às que seguiam o relevo)
sensVento=function(){if(state==='run')luzDesempenho();const L=luzPronta();
 if(L.grade)luzCola(LZC.grade,'multiply',L.gradeA);if(!LUZ.leve||L.vinheta)luzCola(LZC.raios,'source-over',1);
 _luzVento()};
