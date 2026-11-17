/* ===== Desenho (canvas) =====
   Funções de desenho: título, seleção de personagem (animação idle), corrida (parallax, rampa, sprites de pedalada), HUD, painéis e telas de pausa/resultado.
*/
// ---------- desenho ----------
function tiles(img,off,y,w,h,mirror,ext){const i0=Math.floor(off/w);for(let i=i0;i*w-off<W;i++){const x=Math.floor(i*w-off);
 if(mirror&&((i%2)+2)%2){ctx.save();ctx.translate(x+w+1,y);ctx.scale(-1,1);ctx.drawImage(img,0,0,w+1,h);ctx.restore()}else ctx.drawImage(img,x,y,w+1,h);
 if(ext)ctx.drawImage(img,0,img.height-1,img.width,1,x,y+h-1,w+1,ext)}}
function loopSpr(img,items,period,off,base,h){const o=off%period,w=h*img.width/img.height;for(const it of items)for(let k=-1;k<3;k++){const x=it[0]-o+k*period;if(x+w>0&&x<W)ctx.drawImage(img,x,base-h*(it[1]||1),w*(it[1]||1),h*(it[1]||1))}}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
// tema claro (menus): textos brancos/cinza viram escuros e sem contorno; cores de destaque mantêm o contorno preto
let CLARO=false;const ESCURAS={'#fff':'#14161c','#ffffff':'#14161c','#cfe3f1':'#3a4352','#cfd8e1':'#3a4352','#d4e9f5':'#3a4352','#7f93a6':'#5a6472','#9fb0c0':'#7a8494','#0f1a3a':'#14161c','#3a4352':'#3a4352','#14161c':'#14161c','#5a6472':'#5a6472'};
function tx(s,x,y,size,al='left',col='#fff'){ctx.font=FT(size>=28?900:800,size);ctx.textAlign=al;ctx.textBaseline='alphabetic';
 if(CLARO&&ESCURAS[col]){ctx.fillStyle=ESCURAS[col];ctx.fillText(s,x,y);return}
 if(CLARO&&size<26){if(col==='#ffe27a')col='#ffcc00';ctx.lineJoin='round';ctx.lineWidth=size*.12;ctx.strokeStyle='#14161c';ctx.strokeText(s,x,y);ctx.fillStyle=col;ctx.fillText(s,x,y);return}ctx.lineJoin='round';ctx.lineWidth=size*.2;ctx.strokeStyle='#06121e';ctx.strokeText(s,x,y);ctx.fillStyle=col;ctx.fillText(s,x,y)}
function panel(x,y,w,h){rr(x,y,w,h,16);ctx.fillStyle='#0a1a2cee';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#cfd8e1';ctx.stroke()}
function ic(n,x,y,s){ctx.drawImage(IMG.icons,ICON[n]*150,0,150,150,x,y,s,s)}
const f1=v=>v.toFixed(1).replace('.',','),hms=s=>[s/3600,s/60%60,s%60].map(v=>String(Math.floor(v)).padStart(2,'0')).join(':');
const bikeX=440,roadY=676,KS=300/266;
// ---------- tema dos menus (maquetes de 15/11/2026): marinho + corrente, borda ciano, amarelo ----------
const MN={bg:'#001638',borda:'#27d3f0',ama:'#ffd200',tit:'#ffe600',esc:'#0a1426',cinza:'#9fb0c0',verde:'#5cf03f'};
// imagens de tela cheia vêm em 1672×941 (resolução da maquete): redução de alta qualidade na hora de desenhar
function telaCheia(im){ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,W,H);ctx.restore()}
function menuFundo(){const b=IMG.menu_bg;if(b&&b.width)telaCheia(b);else{ctx.fillStyle='#04142e';ctx.fillRect(0,0,W,H)}}
// (o fundo do card é sempre opaco, mesmo com globalAlpha baixo de item bloqueado; só a borda e o conteúdo apagam)
function cardMenu(x,y,w,h,borda=MN.borda,lw=5,r=24){ctx.save();const a=ctx.globalAlpha;ctx.globalAlpha=1;if(borda===MN.borda&&a>=1){ctx.shadowColor=MN.borda;ctx.shadowBlur=12}
 rr(x,y,w,h,r);ctx.fillStyle=MN.bg;ctx.fill();ctx.globalAlpha=a;ctx.shadowBlur=0;ctx.lineWidth=lw;ctx.strokeStyle=borda;ctx.stroke();ctx.restore()}
// texto que encolhe até caber em maxW
function txFit(s,x,y,size,maxW,al,col){ctx.font=FT(size>=28?900:800,size);while(size>12&&ctx.measureText(s).width>maxW){size--;ctx.font=FT(size>=28?900:800,size)}tx(s,x,y,size,al,col)}
// pílula branca "← VOLTAR" (canto superior esquerdo)
function btnVoltar(label,act,x=26,y=24){ctx.font=FT(900,30);const w=ctx.measureText(label).width+92,h=64,hv=hit({x,y,w,h},mx,my);btns.push({x,y,w,h,act});ctx.save();
 if(hv){ctx.translate(x+w/2,y+h/2);ctx.scale(1.05,1.05);ctx.translate(-x-w/2,-y-h/2)}
 rr(x,y,w,h,h/2);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=MN.esc;ctx.stroke();
 const ax=x+26,ay=y+h/2;ctx.fillStyle=MN.esc;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax+16,ay-14);ctx.lineTo(ax+16,ay-5);ctx.lineTo(ax+34,ay-5);ctx.lineTo(ax+34,ay+5);ctx.lineTo(ax+16,ay+5);ctx.lineTo(ax+16,ay+14);ctx.closePath();ctx.fill();
 ctx.font=FT(900,30);ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(label,x+70,y+h/2+11);ctx.restore()}
function tituloGrande(t,y=88,size=72){tx(t,W/2,y,size,'center',MN.tit)}
// faixa amarela inclinada (ESCOLHA O MODO)
function tituloFaixa(t,cx=W/2,cy=62,size=56){ctx.font=FT(900,size);const w=ctx.measureText(t).width+120,h=84,k=16;ctx.save();
 ctx.beginPath();ctx.moveTo(cx-w/2+k,cy-h/2);ctx.lineTo(cx+w/2+k,cy-h/2);ctx.lineTo(cx+w/2-k,cy+h/2);ctx.lineTo(cx-w/2-k,cy+h/2);ctx.closePath();
 ctx.fillStyle=MN.ama;ctx.fill();ctx.lineWidth=6;ctx.lineJoin='round';ctx.strokeStyle=MN.esc;ctx.stroke();
 ctx.fillStyle=MN.esc;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(t,cx,cy+size*.36);ctx.restore()}
function drawTitle(){CLARO=false;
 const im=IMG.menu_home;if(im&&im.width)telaCheia(im);else menuFundo();
 // brilho pulsando em volta do START (o botão faz parte da imagem; tocar em qualquer lugar começa)
 const a=.35+.35*Math.sin(T*3.2);ctx.save();ctx.shadowColor=MN.borda;ctx.shadowBlur=26;ctx.globalAlpha=Math.max(0,a);rr(104,500,668,190,62);ctx.lineWidth=6;ctx.strokeStyle=MN.borda;ctx.stroke();ctx.restore();
 ctx.font=FT(800,16);ctx.textAlign='left';ctx.fillStyle='#9fb0c0';ctx.fillText('versão '+VERSAO,18,H-14);drawIcons()}
// caixa do nick/nome: desenhada no canvas; o <input> HTML fica posicionado por cima
let NICKBOX='';function caixaNome(x,y,w,h){rr(x,y,w,h,18);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#14161c';ctx.stroke();
 const k=`${x},${y},${w},${h}`;if(k!==NICKBOX){NICKBOX=k;const s=nickEl.style;s.left=((x+14)/W*100)+'%';s.top=((y+4)/H*100)+'%';s.width=((w-28)/W*100)+'%';s.height=((h-8)/H*100)+'%'}}
function drawSelect(){CLARO=false;menuFundo();
 ctx.save();ctx.globalAlpha=.3;ctx.beginPath();ctx.ellipse(400,800,240,28,0,0,7);ctx.fillStyle='#000';ctx.fill();ctx.restore();
 if(typeof ciclistaEmPe==='function')ciclistaEmPe(CH[sel].id,400,804,600);
 cardMenu(760,150,640,560,MN.borda,6,30);
 if(IMG.ic_crono)ctx.drawImage(IMG.ic_crono,800,176,IMG.ic_crono.width*.42,126);
 tx('CONTRARRELÓGIO',880+40,250,50,'left','#ffd23a');tx('50 km sozinho contra o relógio',920,290,22,'left','#fff');
 tx('SEU NICK (vale para o ranking)',806,380,24,'left','#fff');caixaNome(806,396,548,82);
 btn('JOGAR',806,520,548,104,play,true,52);
 tx('Enter = jogar',W-260,690,18,'right','#7f93a6');
 btnVoltar('TROCAR MODO',toModo);drawIcons()}
function drawRace(){
 // ---- fundo (tela): céu, montanhas e morros em paralaxe; a igreja aparece só de vez em quando ----
 const sp=scroll*ZOOM;camPasso();
 if(typeof sensCamIni==='function')sensCamIni();   // tremor de câmera (sensacao.js): fundo + mundo, não o HUD
 ctx.save();
 ctx.fillStyle='#3db4ff';ctx.fillRect(0,0,W,H);
 tiles(IMG.cen_ceu,sp*.02,-170,1900,634);ctx.fillStyle='#3db4ff';ctx.fillRect(0,-200,W,40);
 camada(IMG.cen_mont,sp*.04,312,140);
 morros(sp*.09);
 ctx.fillStyle=cenChao();ctx.fillRect(0,600,W,H);   // chão por trás (aparece se a estrada desce muito): grama ou água
 ctx.restore();
 // ---- mundo (com zoom: campo de visão maior) ----
 ctx.save();mundoT();
 pistaCurva();if(typeof npcDesenhar==='function')npcDesenhar();
 const sk=vsl(terrain(dist));
 const id=jogadorSkin(),st=spriteSt(),[fw,fh]=META.pedal[id][st],bw=fw*KS,bh=fh*KS,fi=Math.floor(pedal)%10;
 ctx.save();ctx.translate(bikeX,roadY-EYB+(typeof GF!=='undefined'?GF.tranco:0));ctx.rotate(-Math.atan(sk));
 const pdx=((META.pedalDx||{})[id]||[])[st]||0,gq=typeof garQuadro==='function'?garQuadro(id,st,fi):null;   // garagem.js: quadro com as peças (só Carreira)
 if(gq)ctx.drawImage(gq,0,0,fw,fh,-150-pdx*KS,-bh,bw,bh);else ctx.drawImage(IMG['p_'+id[0]+st],(fi%5)*fw,Math.floor(fi/5)*fh,fw,fh,-150-pdx*KS,-bh,bw,bh);if(typeof sensRodas==='function')sensRodas(id,st,-150-pdx*KS,-bh,KS);ctx.restore();
 if(typeof porticosFrente==='function')porticosFrente();
 pistaFrente();
 ctx.restore();
 // ---- mato desfocado na frente ----
 camada(IMG.cen_veg,sp*1.35,H-150,120);
 if(typeof sensCamFim==='function'){sensCamFim();sensVento()}   // linhas de vento: por cima do mato, por baixo do HUD
 btns=[];hud();if(typeof npcHud==='function')npcHud();
 if(typeof sensParticulas==='function')sensParticulas();   // faíscas dos itens e aviso de quem atacou (sensacao.js)
 if(false&&state==='run'&&elapsed<8&&!(typeof CONT!=='undefined'&&CONT>0)){ctx.globalAlpha=clamp(8-elapsed,0,1);rr(W/2-430,236,860,92,18);ctx.fillStyle='#0a1a2ccc';ctx.fill();tx('Toque ou segure o raio para aumentar a potência.',W/2,280,28,'center');tx('Espaço = potência · A = água · G = gel · Esc = pausa',W/2,314,22,'center','#cfe3f1');ctx.globalAlpha=1}
 if(state!=='run')overlay();
}
// ---------- campo de visão: o mundo é desenhado com zoom (ZOOM) em volta do ciclista ----------
// mundo → tela: x' = (x − bikeX)·ZOOM + BXS ; y' = (y − roadY)·ZOOM + RYS. WX0..WX1 = faixa do mundo visível na tela.
const ZOOM=.65,BXS=370,RYS=686,WX0=bikeX-BXS/ZOOM,WX1=bikeX+(W-BXS)/ZOOM;
function mundoT(){ctx.translate(BXS,RYS);ctx.scale(ZOOM,ZOOM);ctx.translate(-bikeX,-roadY)}
const scrX=x=>(x-bikeX)*ZOOM+BXS,scrY=y=>(y-roadY)*ZOOM+RYS;
// camada repetida com emenda suave: cada cópia tem a borda esquerda em degradê (fade px) e se sobrepõe à anterior
function camada(img,off,y,fade){if(!img||!img.width)return;const w=img.width,st=w-fade,i0=Math.floor(off/st)-1;
 for(let i=i0;i*st-off<W;i++)ctx.drawImage(img,Math.floor(i*st-off),y)}
// ---------- CENÁRIO (17/11): campo ↔ mar ----------
// Campo e mar são tiras "infinitas" (a ponta direita emenda na esquerda: sem sobreposição, sem árvore fantasma na emenda).
// O campo tem a igreja rara (1 tira a cada 5). O mar aparece em trechos, com transição suave (um some, o outro aparece):
//   Pedal Livre: campo por 10–20 km, mar por 4–8 km, alternando (sorteado a cada pedalada).
//   Provas (todos os outros modos): começa no campo; a orla vai de 40% a 60% da distância.
const CEN={trans:1.5,igreja:5,livreCampo:[10,20],livreMar:[4,8],prova:[.4,.6],chao:['#8cc83c','#3fd8d2']};
let CENZ=null;   // trechos de mar [[início, fim], …] em km
function cenZonas(){const Z=[];if(GOAL>=9999){let k=0;while(k<3000){const r=(a,b)=>a+Math.random()*(b-a);k+=r(CEN.livreCampo[0],CEN.livreCampo[1]);const m=r(CEN.livreMar[0],CEN.livreMar[1]);Z.push([k,k+m]);k+=m}}
 else Z.push([GOAL*CEN.prova[0],GOAL*CEN.prova[1]]);return Z}
function cenMar(km){if(!CENZ)CENZ=cenZonas();for(const[a,b]of CENZ){if(km<a-CEN.trans)break;if(km<=b+CEN.trans)return smooth(Math.min((km-a)/CEN.trans+1,(b-km)/CEN.trans+1))}return 0}
const _cenReset=reset;reset=function(){CENZ=null;_cenReset()};
function cenTiras(A,B,off,base,a){if(a<=0||!A||!A.width)return;const st=A.width,i0=Math.floor(off/st)-1;ctx.globalAlpha=a;
 for(let i=i0;i*st-off<W;i++){const im=B&&(((i%CEN.igreja)+CEN.igreja)%CEN.igreja===2)?B:A;ctx.drawImage(im,Math.floor(i*st-off),base-im.height,im.width+1,im.height)}ctx.globalAlpha=1}
function morros(off){const f=state==='run'||state==='paused'||state==='over'?cenMar(dist):0;
 cenTiras(IMG.cen_campo,IMG.cen_campo_i,off,640,1-f);cenTiras(IMG.cen_mar,null,off,640,f)}
// cor do chão por trás dos morros (aparece se a estrada desce muito): grama no campo, água no mar
function cenChao(){const f=state==='run'||state==='paused'||state==='over'?cenMar(dist):0;if(f<=0)return CEN.chao[0];
 const c=CEN.chao.map(h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16)));return`rgb(${c[0].map((v,i)=>Math.round(v+(c[1][i]-v)*f)).join(',')})`}
function drawIcons(){for(const a of ICN){const x=a.x*SS,y=a.y*SS,r=ICN_R*SS,u=r/34,hv=!pnl&&d2(mx,my,x,y)<(r*1.3)**2;ctx.save();ctx.translate(x,y);ctx.scale(hv?1.1:1,hv?1.1:1);
 ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fillStyle='#ffd800';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#0f1a3a';ctx.stroke();
 ctx.strokeStyle='#0f1a3a';ctx.fillStyle='#0f1a3a';ctx.lineWidth=5*u;ctx.lineCap='round';ctx.lineJoin='round';
 if(a.k==='som'){ctx.beginPath();ctx.moveTo(-14*u,-6*u);ctx.lineTo(-6*u,-6*u);ctx.lineTo(4*u,-15*u);ctx.lineTo(4*u,15*u);ctx.lineTo(-6*u,6*u);ctx.lineTo(-14*u,6*u);ctx.closePath();ctx.fill();
  if(SET.on){ctx.beginPath();ctx.arc(4*u,0,10*u,-.9,.9);ctx.stroke();ctx.beginPath();ctx.arc(4*u,0,18*u,-.9,.9);ctx.stroke()}else{ctx.beginPath();ctx.moveTo(12*u,-8*u);ctx.lineTo(24*u,8*u);ctx.moveTo(24*u,-8*u);ctx.lineTo(12*u,8*u);ctx.stroke()}}
 else if(a.k==='fs'){const e=inFS();ctx.beginPath();for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const cx=sx*(e?5:15)*u,cy=sy*(e?5:15)*u,d=(e?-1:1);ctx.moveTo(cx,cy-sy*8*u*d);ctx.lineTo(cx,cy);ctx.lineTo(cx-sx*8*u*d,cy)}ctx.stroke()}
 else if(a.k==='rank'){ctx.beginPath();ctx.moveTo(-13*u,-14*u);ctx.lineTo(13*u,-14*u);ctx.lineTo(11*u,2*u);ctx.quadraticCurveTo(0,13*u,-11*u,2*u);ctx.closePath();ctx.fill();ctx.beginPath();ctx.arc(-14*u,-6*u,7*u,Math.PI*.5,Math.PI*1.5);ctx.stroke();ctx.beginPath();ctx.arc(14*u,-6*u,7*u,-Math.PI*.5,Math.PI*.5);ctx.stroke();ctx.fillRect(-2*u,8*u,4*u,7*u);ctx.fillRect(-9*u,15*u,18*u,4*u)}
 else{rr(-20*u,-11*u,40*u,24*u,11*u);ctx.fill();ctx.fillStyle='#ffd800';ctx.fillRect(-14*u,-2*u,10*u,3*u);ctx.fillRect(-10.5*u,-5.5*u,3*u,10*u);ctx.beginPath();ctx.arc(9*u,-1*u,2.6*u,0,7);ctx.fill();ctx.beginPath();ctx.arc(15*u,3*u,2.6*u,0,7);ctx.fill()}
 ctx.restore()}}
function chip(s,x,y){ctx.font='italic 800 24px Exo2,system-ui,sans-serif';const w=ctx.measureText(s).width+28;rr(x,y-30,w,42,10);ctx.fillStyle='#ffd800';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#0f1a3a';ctx.stroke();ctx.fillStyle='#0f1a3a';ctx.textAlign='left';ctx.fillText(s,x+14,y);return w}
function drawPanel(){pbtns=[];ctx.fillStyle='#06121cb0';ctx.fillRect(0,0,W,H);const X=588;CLARO=true;
 const box=(x,y,w,h)=>{rr(x,y,w,h,26);ctx.fillStyle='#fffffff5';ctx.fill();ctx.lineWidth=6;ctx.strokeStyle='#14161c';ctx.stroke()};
 if(pnl==='som'){box(388,152,760,610);tx('SOM',W/2,232,60,'center','#ffe27a');
  tx('SOM',430,334,32);const on=SET.on,sx=858,sy=296,sw=240,sh=68,hv=hit({x:sx,y:sy,w:sw,h:sh},mx,my);
  pbtns.push({x:sx,y:sy,w:sw,h:sh,act:()=>{SET.on=!SET.on;saveSet()}});rr(sx,sy,sw,sh,34);ctx.fillStyle=on?'#2ad415':'#5b6572';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=hv?'#fff':'#cfd8e1';ctx.stroke();
  ctx.beginPath();ctx.arc(on?sx+sw-34:sx+34,sy+34,24,0,7);ctx.fillStyle='#fff';ctx.fill();tx(on?'LIGADO':'DESLIGADO',on?sx+82:sx+sw-82,sy+45,26,'center');
  for(const s of SLD){const v=SET[s.k];ctx.globalAlpha=SET.on?1:.4;tx(s.label,430,s.y+10,28);
   rr(SX0,s.y-8,SX1-SX0,16,8);ctx.fillStyle='#1c3550';ctx.fill();if(v>0){rr(SX0,s.y-8,(SX1-SX0)*v,16,8);ctx.fillStyle='#ffd800';ctx.fill()}
   const kx=SX0+(SX1-SX0)*v;ctx.beginPath();ctx.arc(kx,s.y,22,0,7);ctx.fillStyle='#ffd800';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#0f1a3a';ctx.stroke();
   tx(Math.round(v*100)+'%',1118,s.y+10,26,'right');ctx.globalAlpha=1}
  btn('VOLTAR',X,640,360,76,()=>{pnl=null},true,36,pbtns)}
 else if(pnl==='rank'){box(318,80,900,704);tx('RANKING',W/2,160,60,'center','#ffe27a');
  const CC={azul:'#3aa0ff',vinho:'#c23a5a',branco:'#f2f2f2'};
  if(RK.load===1)tx('Carregando...',W/2,420,32,'center');
  else if(RK.load===3)tx('Não foi possível carregar o ranking.',W/2,420,30,'center','#ffad9d');
  else if(RK.load===2){
   if(!RK.top.length)tx('Ninguém no ranking ainda. Seja o primeiro!',W/2,420,30,'center');
   const row=(r,y)=>{const col=r.me?'#ffe27a':'#fff';if(r.me){rr(352,y-30,832,40,10);ctx.fillStyle='#ffd80033';ctx.fill()}
    tx(r.pos+'º',410,y,28,'right',col);ctx.beginPath();ctx.arc(450,y-10,11,0,7);ctx.fillStyle=CC[r.ch]||'#fff';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#06121e';ctx.stroke();
    tx(r.nick.toUpperCase(),480,y,28,'left',col);tx(hms(r.t),1150,y,28,'right',col)};
   RK.top.forEach((r,i)=>row(r,222+i*40));
   if(RK.me&&!RK.top.some(r=>r.me)){tx('···',W/2,628,28,'center');row(RK.me,668)}}
  btn('VOLTAR',X,700,360,64,()=>{pnl=null},true,34,pbtns)}
 else if(pnl==='share')drawSharePanel(box,X);
 else{box(70,92,1396,690);tx('CONTROLES',W/2,176,60,'center','#ffe27a');
  // 3 colunas: teclado · toque · controle (gamepad, controle.js — vale para qualquer controle, pela posição do botão)
  tx('TECLADO',120,250,32,'left','#a8ffb4');tx('TOQUE / CELULAR',590,250,32,'left','#a8ffb4');tx('CONTROLE',1010,250,32,'left','#a8ffb4');
  const K=[['ESPAÇO','potência'],['A','água'],['I','isotônico'],['B','banana'],['G','gel'],['Z','gel azul'],['ESC / P','pausar'],['M','som']],
   Tq=[['RAIO','potência'],['GARRAFA','água'],['GEL','gel'],['ITENS','tocar no item'],['II','pausar']],
   Gp=[['A','potência (segurar)'],['X','água'],['Y','isotônico'],['B','banana'],['RB','gel'],['LB','gel azul'],['START','pausar'],['ANALÓGICO','cursor · A clica']];
  const col=(L,x)=>L.forEach((r,i)=>{const y=306+i*50,w=chip(r[0],x,y);txFit(r[1],x+w+14,y,22,400-w,'left','#fff')});col(K,120);col(Tq,590);col(Gp,1010);
  btn('VOLTAR',X,684,360,72,()=>{pnl=null},true,36,pbtns)}}
function draw(){CLARO=false;btns=[];if(state==='title')drawTitle();else if(state==='select')drawSelect();else drawRace();if(pnl)drawPanel()}
// ---------- HUD (mesmo layout no Contrarrelógio e na Carreira) ----------
// topo: pausa + cronômetro (esq.) · distância e barra (centro) · velocímetro, velocidade e média · watts, % e FTP · rampa (dir.)
// baixo: itens com contador (esq.) · mini perfil · barra de stamina · botão do raio (dir.); gel azul acima do raio quando houver
const pilula=(x,y,w,h)=>{rr(x,y,w,h,h/2);ctx.fillStyle='rgba(222,240,255,.82)';ctx.fill()};
function velocimetro(cx,cy,r){const f=IMG.vel_face;if(!f||!f.width)return;ctx.drawImage(f,cx-r,cy-r,2*r,2*r);
 const a=Math.PI*.75+clamp(speed/70,0,1)*Math.PI*1.25,L=r*.7;ctx.save();ctx.translate(cx,cy);ctx.rotate(a);ctx.lineCap='round';
 ctx.strokeStyle='#14161c';ctx.lineWidth=r*.17;ctx.beginPath();ctx.moveTo(-r*.08,0);ctx.lineTo(L,0);ctx.stroke();
 ctx.strokeStyle='#ff2a1a';ctx.lineWidth=r*.1;ctx.beginPath();ctx.moveTo(-r*.08,0);ctx.lineTo(L,0);ctx.stroke();ctx.restore();
 const hb=IMG.vel_hub;if(hb&&hb.width)ctx.drawImage(hb,cx-r*.22,cy-r*.22,r*.44,r*.44)}
// itens da fileira de baixo (só os que existem no modo); devolve os retângulos de toque
function slotsHUD(){const L=[],lv=typeof LV!=='undefined'&&LV;
 if(!lv){L.push('agua','gel');return L}L.push('agua');if(LV.a7Lev)L.push('agua7');if(LV.isoLev)L.push('iso');if(LV.gLev||gel>0)L.push('gel');if(LV.bLev||LV.banana>0)L.push('banana');return L}
function itemHUD(id,x,yb){const h=104;   // 17/11: bolso menor (era 124)let n=0,on=true;
 if(id==='agua'){const nb=NUT[clamp(Math.round(5-water/AJ.aguaQtd*5),0,5)],s=h/nb[3];ctx.drawImage(IMG.nutr,nb[0],nb[1],nb[2],nb[3],x,yb-h,nb[2]*s,h);n=water}
 else if(id==='agua7'){const hh=h*1.12,nb=NUT[clamp(Math.round(5-LV.agua7/7*5),0,5)],s=hh/nb[3];ctx.globalAlpha=LV.agua7?1:.35;ctx.drawImage(IMG.nutr,nb[0],nb[1],nb[2],nb[3],x,yb-hh,nb[2]*s,hh);n=LV.agua7}
 else if(id==='iso'){const nb=NUT[clamp(Math.round(5-LV.iso/isoCap()*5),0,5)],s=h/nb[3];ctx.globalAlpha=LV.iso?1:.35;ctx.drawImage(IMG.iso,nb[0],nb[1],nb[2],nb[3],x,yb-h,nb[2]*s,h);n=LV.iso}
 else if(id==='gel'){const ng=NUT[6],s=h*.92/ng[3];ctx.globalAlpha=gel?1:.35;ctx.drawImage(IMG.nutr,ng[0],ng[1],ng[2],ng[3],x-2,yb-h*.92,ng[2]*s,h*.92);n=gel}
 else if(id==='banana'){const b=IMG.it_banana,bh=h*.82;ctx.globalAlpha=LV.banana?1:.35;ctx.drawImage(b,x-6,yb-bh,bh*b.width/b.height,bh);n=LV.banana}
 ctx.globalAlpha=1;badge(x+52,yb-h+4,n);return{x:x-8,y:yb-h-10,w:74,h:h+20}}
const HB_IDS=['water','gel','b_iso','b_banana','b_azul','b_agua7'],HB_DOM={agua:'water',gel:'gel',iso:'b_iso',banana:'b_banana',azul:'b_azul',agua7:'b_agua7'};let HB_CACHE={};
function botaoDOM(id,r){const e=$(id);if(!e)return;const k=r?`${r.x|0},${r.y|0},${r.w|0},${r.h|0}`:'off';if(HB_CACHE[id]===k)return;HB_CACHE[id]=k;
 if(!r){e.style.display='none';return}e.style.display='block';e.style.left=(r.x/W*100)+'%';e.style.top=(r.y/H*100)+'%';e.style.width=(r.w/W*100)+'%';e.style.height=(r.h/H*100)+'%'}
function esconderBotoesHUD(){for(const id of HB_IDS)botaoDOM(id,null)}
function hud(){
 // topo esquerdo: pausa + cronômetro
 if(state!=='over'){const px=26,py=28,ps=66;btns.push({x:px,y:py,w:ps,h:ps,act:togglePause});pilula(px,py,ps,ps);ctx.fillStyle='#14161c';
  if(state==='run'){rr(px+20,py+17,10,32,3);ctx.fill();rr(px+36,py+17,10,32,3);ctx.fill()}else{ctx.beginPath();ctx.moveTo(px+24,py+16);ctx.lineTo(px+24,py+50);ctx.lineTo(px+50,py+33);ctx.closePath();ctx.fill()}}
 pilula(104,28,262,66);ic('clock',114,32,58);tx(hms(elapsed*SCALE),180,77,38);
 // distância e barra
 const sf=GOAL>=9999,alvo=sf?Math.max(1,(typeof CS!=='undefined'&&CS.recLivre)||0):GOAL;
 tx(sf?(alvo>1?`${f1(dist)} km  ·  recorde ${f1(alvo)}`:`${f1(dist)} km  ·  sem recorde`):`${f1(Math.max(0,dist))} / ${GOAL} km`,W/2,46,34,'center');
 const bx=492,by=60,bw=552,bh=30;rr(bx-8,by-8,bw+16,bh+16,23);ctx.fillStyle='#14161c';ctx.fill();rr(bx-5,by-5,bw+10,bh+10,20);ctx.fillStyle='#cfd8e1';ctx.fill();rr(bx-1,by-1,bw+2,bh+2,16);ctx.fillStyle='#0a1a2c';ctx.fill();
 if(dist>0){const g=ctx.createLinearGradient(0,by,0,by+bh);g.addColorStop(0,'#ffd83a');g.addColorStop(1,'#f0a500');rr(bx,by,Math.max(bh,bw*Math.min(1,dist/alvo)),bh,15);ctx.fillStyle=g;ctx.fill()}
 ic('flag',bx+bw-42,by-3,36);
 // velocímetro, velocidade e média
 velocimetro(471,166,50);const v=`${Math.round(speed)}`;ctx.font=FT(900,58);const wv=ctx.measureText(v).width;tx(v,533,184,58);tx('km/h',541+wv,184,30);
 ic('avg',533,192,26);tx(`Média ${f1(elapsed>0?dist*3600/(elapsed*SCALE):0)} km/h`,565,214,21);
 // watts, % e FTP
 const w=Math.round(wHud),p=Math.round(w/FTP*100),sw=`${w} w`,spc=` ${p}%`;ctx.font=FT(900,58);const ww=ctx.measureText(sw).width,wp=ctx.measureText(spc).width,x0=945-(ww+wp)/2;
 tx(sw,x0,184,58,'left','#ffd23a');tx(spc,x0+ww,184,58,'left',pctCor(p));tx(`FTP: ${FTP} w`,945,214,24,'center');
 // em cima: potência MÉDIA do pedal (não é o FTP do ciclista), com a mesma cor de esforço
 {const m=pTempo>0?Math.round(pSoma/pTempo):0,pm=Math.round(m/FTP*100),a=`MÉDIA ${m} w `,b=`${pm}%`;ctx.font=FT(800,24);
  const wa=ctx.measureText(a).width,wb=ctx.measureText(b).width,xa=945-(wa+wb)/2;tx(a,xa,128,24,'left','#fff');tx(b,xa+wa,128,24,'left',pctCor(pm))}
 // rampa
 pilula(1160,38,346,108);pilula(1250,154,256,52);tx(`▲ ${Math.round(elevG)} m`,1488,192,30,'right','#fff');tx('ELEV.',1272,190,20,'left','#fff');const gi=grade>1?'up':grade<-1?'down':'flat';ic(gi,1180,52,82);tx(`${grade<0?'−':''}${f1(Math.abs(grade))}%`,1488,118,56,'right',grade>1?'#ffe16c':'#fff');
 // itens (esquerda, embaixo)
 const SL=slotsHUD(),R={},mrc=typeof marTela==='function'&&marTela();SL.forEach((id,i)=>{R[id]=itemHUD(id,mrc?marSlotX(i):22+i*74,820)});   // marchas (marcha.js): itens nas bagzinhas, à direita da coluna das marchas
 // gel azul acima do raio
 const azul=typeof LV!=='undefined'&&LV&&LV.azul>0&&!LV.azulUsou;
 // 16/11: maior (118 → 165) e mais alto, com folga de ~50 px até o raio (que começa em y≈564)
 if(azul){const a=IMG.it_gelazul,ah=165,aw=ah*a.width/a.height,ay=345;ctx.drawImage(a,1346-aw/2,ay,aw,ah);badge(1346+aw/2+4,ay+6,1);R.azul={x:1346-Math.max(aw,100)/2-10,y:ay-12,w:Math.max(aw,100)+20,h:ah+24}}
 if(state==='run')for(const k in HB_DOM)botaoDOM(HB_DOM[k],R[k]||null);
 // mini perfil e barra de stamina
 perfilMini(768,714);staminaBar(386,728,763);
 // raio
 const act=boost&&state==='run',bimg=IMG.bolt2&&IMG.bolt2.width?IMG.bolt2:IMG.bolt,bs=act?212:228,cx=1346,cy=678;ctx.globalAlpha=stamina>.5?1:.45;
 if(typeof sensRaio==='function')sensRaio(bimg,act,cx,cy);   // mola a cada pedalada + brilho pronto (sem shadowBlur por quadro)
 else{if(act){ctx.shadowColor='#ffe13a';ctx.shadowBlur=34}ctx.drawImage(bimg,cx-bs/2,cy-bs/2,bs,bs);ctx.shadowBlur=0}ctx.globalAlpha=1}
// barra: vermelho (fadiga) inteiro + verde (stamina) por cima, recortados no miolo do aro; raio e fogo nas pontas
function staminaBar(x,y,w){const A=IMG.st_aro;if(!A||!A.width)return;const k=w/A.width,h=A.height*k,ix=x+14*k,iy=y+24*k,iw=1172*k,ih=62*k,gw=iw*clamp(stamina/100,0,1);
 ctx.save();rr(ix,iy,iw,ih,ih/2);ctx.clip();ctx.drawImage(IMG.st_vermelha,ix,iy,iw,ih);if(gw>0)ctx.drawImage(IMG.st_verde,0,0,IMG.st_verde.width*gw/iw,IMG.st_verde.height,ix,iy,gw,ih);
 if(waterEffect>0&&state==='run'){const fl=ix+gw,a=Math.min(1,waterEffect*2)*(.6+.4*Math.sin(T*14)),g=ctx.createLinearGradient(fl-26,0,fl+26,0);g.addColorStop(0,'#4fc3ff00');g.addColorStop(.5,'#8fe0ff');g.addColorStop(1,'#4fc3ff00');ctx.globalAlpha=a;ctx.fillStyle=g;ctx.fillRect(fl-26,iy,52,ih);ctx.globalAlpha=1}
 ctx.restore();ctx.drawImage(A,x,y,w,h);
 // 17/11: raio e fogo FORA da barra (antes ficavam por cima e escondiam as pontas)
 const r=IMG.st_raio,rh=h*.95,rw=rh*r.width/r.height;ctx.drawImage(r,x-rw+10,y+h/2-rh/2,rw,rh);
 const f=IMG.st_fogo,fh=h*1.02,fw2=fh*f.width/f.height;ctx.drawImage(f,x+w-8,y+h/2-fh*.58,fw2,fh);
 tx('STAMINA',x+30,y+h/2+11,30);tx('FADIGA',x+w-30,y+h/2+10,26,'right')}
function badge(x,y,n){ctx.beginPath();ctx.arc(x,y,17,0,7);ctx.fillStyle='#0a1a2c';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#fff';ctx.stroke();ctx.fillStyle='#fff';ctx.font='italic 800 20px Exo2,system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(n,x,y+7)}
// botão no estilo novo: amarelo (principal), verde (compartilhar) ou branco; contorno preto, texto escuro
function btn(label,x,y,w,h,act,primary,size=36,list=btns){list.push({x,y,w,h,act});const hv=hit({x,y,w,h},mx,my);ctx.save();
 if(hv){ctx.translate(x+w/2,y+h/2);ctx.scale(1.04,1.04);ctx.translate(-x-w/2,-y-h/2)}
 const r=Math.min(22,h/2.6);rr(x,y+6,w,h,r);ctx.fillStyle='#14161c';ctx.fill();
 rr(x,y,w,h,r);ctx.fillStyle=primary==='share'?(hv?'#5cf03f':'#3bdc1f'):primary?(hv?'#ffe45c':'#ffcc00'):(hv?'#f2f5f8':'#ffffff');ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#14161c';ctx.stroke();
 ctx.font=FT(900,size);ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillStyle='#14161c';ctx.fillText(label,x+w/2,y+h/2+size*.35);ctx.restore()}
function pbtn(){const x=336,y=18;btns.push({x,y,w:64,h:64,act:togglePause});panel(x,y,64,64);ctx.fillStyle='#fff';
 if(state==='run'){ctx.fillRect(x+19,y+16,9,32);ctx.fillRect(x+36,y+16,9,32)}else{ctx.beginPath();ctx.moveTo(x+22,y+16);ctx.lineTo(x+22,y+48);ctx.lineTo(x+48,y+32);ctx.fill()}}
function overlay(){
 const X=588,BW=360,avg=f1(elapsed>0?dist*3600/(elapsed*SCALE):0);
 if(state==='paused'){
  ctx.fillStyle='#06121cc8';ctx.fillRect(0,0,W,H);tx('PAUSADO',W/2,290,80,'center','#ffe27a');
  btn('CONTINUAR',X,340,BW,80,togglePause,true,38);btn('REINICIAR',X,440,BW,70,reset,false,30);btn('MENU',X,530,BW,70,toSelect,false,30);btn('SOM',X,620,172,62,()=>openPanel('som'),false,26);btn('CONTROLES',X+188,620,172,62,()=>openPanel('ctrl'),false,22);btn('TROCAR MODO',X,698,BW,58,toModo,false,26);
 }else{
  ctx.fillStyle='#06121cd0';ctx.fillRect(0,0,W,H);
  if(nick)tx(nick.toUpperCase(),W/2,230,36,'center','#d4e9f5');
  tx(won?'50 KM CONCLUÍDOS!':'VOCÊ QUEBROU!',W/2,310,won?68:76,'center',won?'#a8ffb4':'#ffad9d');
  tx(`${f1(dist)} km  ·  Média ${avg} km/h  ·  ${hms(elapsed*SCALE)}`,W/2,380,32,'center');fimArte();
  let by=450,bh=84,gap=102;
  if(RANK_API){const R=RK.res;let m='',col='#fff';
   if(won){if(!R||R.s==='send')m='Enviando seu tempo...';else if(R.s==='ok'){m=R.imp?(R.pos===1?'NOVO RECORDE! 1º lugar':`Você está em ${R.pos}º lugar no ranking`):`Seu melhor continua ${R.pos}º (${hms(R.best)})`;col='#ffe27a'}
    else if(R.s==='nonick'){m='Sem apelido, seu tempo não entra no ranking';col='#cfe3f1'}else{m='Não foi possível enviar ao ranking';col='#ffad9d'}}
   if(m)tx(m,W/2,424,28,'center',col);
   by=450;bh=70;btn('JOGAR DE NOVO',X,by,BW,bh,reset,true,34);btn('COMPARTILHAR',X,by+82,BW,64,doShare,'share',30);btn('RANKING',X,by+82+76,172,60,()=>openPanel('rank'),false,26);btn('MENU',X+188,by+82+76,172,60,toSelect,false,26);btn('TROCAR MODO',X,by+82+76+72,BW,54,toModo,false,24)}
  else{btn('JOGAR DE NOVO',X,450,BW,84,reset,true,36);btn('COMPARTILHAR',X,548,BW,70,doShare,'share',32);btn('MENU',X,632,BW,64,toSelect,false,30);btn('TROCAR MODO',X,708,BW,56,toModo,false,24)}
 }
}

// ---------- V2: potência ----------
// Sprite pela potência (com histerese para não piscar):
//   0 normal (< 108% FTP) · 1 esforço "bravo" (108–160%) · 3 SPRINT "bravo em pé sprintando" (≥ 160%) · 2 em pé (subida > 3% com ≥ 130%)
const SPR={bravo:1.08,sprint:1.6,subida:3,subidaPct:1.3,hist:.06};
let stV=0;
// skin do jogador: na Carreira é a escolhida na tela da Carreira; no contrarrelógio, o ciclista selecionado
function jogadorSkin(){return MODO==='carreira'&&typeof CS!=='undefined'&&CS.skin?CS.skin:CH[sel].id}
function spriteSt(){if(state!=='run')return 0;const r=pShow/FTP,h=k=>stV===k?SPR.hist:0;
 if(grade>SPR.subida&&r>=SPR.subidaPct-h(2))return stV=2;
 if(r>=SPR.sprint-h(3))return stV=3;
 return stV=r>=SPR.bravo-(stV?SPR.hist:0)?1:0}
// Cor da porcentagem: verde até o FTP → amarelo (160%) → laranja (250%) → vermelho (≥350%)
function pctCor(p){const K=[[100,[53,242,28]],[160,[255,216,58]],[250,[255,138,31]],[350,[255,42,26]]];
 if(p<=K[0][0])return'rgb('+K[0][1]+')';for(let i=1;i<K.length;i++)if(p<=K[i][0]){const[a,ca]=K[i-1],[b,cb]=K[i],t=(p-a)/(b-a);return'rgb('+ca.map((v,j)=>Math.round(v+(cb[j]-v)*t))+')'}return'rgb('+K[3][1]+')'}
// "FTP 250 W · 160% (400 W)" centralizado em (cx, base)
function powerLine(cx,y){const w=Math.round(pShow),p=Math.round(w/FTP*100),sz=30;
 const a=`FTP ${FTP} W · `,b=`${p}%`,d=` (${w} W)`;ctx.font=`italic 800 ${sz}px Exo2,system-ui,sans-serif`;
 const wa=ctx.measureText(a).width,wb=ctx.measureText(b).width,wd=ctx.measureText(d).width,tw=wa+wb+wd;
 rr(cx-tw/2-20,y-sz-6,tw+40,sz+18,14);ctx.fillStyle='#0a1a2cd0';ctx.fill();
 const x=cx-tw/2;tx(a,x,y,sz);tx(b,x+wa,y,sz,'left',pctCor(p));tx(d,x+wa+wb,y,sz)}

// Ilustração da tela final (vitória / quebra), à direita do texto (fora do ciclista e dos botões), com entrada suave
let fimT=-1;
function fimArte(){if(fimT<0)fimT=T;const sk=jogadorSkin(),base=won?'fim_venceu':'fim_quebrou',im=IMG[sk!=='branco'&&IMG[base+'_'+sk]?base+'_'+sk:base];if(!im||!im.width)return;
 const e=1-Math.pow(1-clamp((T-fimT)/.45,0,1),3),k=won?480/im.height:520/im.width,w=im.width*k,h=im.height*k,x=W-36-w+(1-e)*60,y=812-h;
 ctx.globalAlpha=e;ctx.drawImage(im,x,y,w,h);ctx.globalAlpha=1}

// ---------- V2: pista em curva (pé da subida, topo arredondado, descida) ----------
// O percurso (≈1,6 km à frente e 0,7 km atrás) vira uma linha de trechos de 48 px, cada um com altura e inclinação próprias.
// Grama, grade e asfalto são desenhados pedaço a pedaço (sem recorte); árvores e arbustos inteiros, na inclinação do trecho
// onde estão. No ciclista a inclinação é a de antes.
// VIS_INC: inclinação desenhada por 1% de rampa (exagerada de propósito: 7% de rampa ≈ 11° na tela, para a subida parecer o esforço que ela cobra)
const TRECHO=48,KM_PX=.0015,VIS_INC=.027;let SEG=[];
// Altura desenhada da estrada: perfil FIXO no mundo (integral da inclinação desenhada ao longo do percurso, na mesma escala
// do chão que rola: 9·3600/SCALE px por km). A estrada não se deforma; só anda e a câmera acompanha a altura do ciclista.
// vsl(): inclinação desenhada (exagerada, com teto): 3% ≈ 11°, 5% ≈ 18°, 8% ≈ 23°.
function vsl(g){const a=Math.abs(g);return Math.sign(g)*(a<=6?.065*a:.39+.02*(a-6))}
let ALTT=null;
function alt(km){const K=9*3600/SCALE,st=.005;if(!ALTT||ALTT.K!==K||ALTT.c!==climbs||ALTT.r!==rampas)ALTT={K,c:climbs,r:rampas,v:[0]};
 if(km<0)return vsl(terrain(0))*km*K;const v=ALTT.v,i=km/st,n=Math.ceil(i)+1;while(v.length<=n){const j=v.length;v.push(v[j-1]+vsl(terrain((j-.5)*st))*st*K)}
 const i0=Math.floor(i);return v[i0]+(v[i0+1]-v[i0])*(i-i0)}
// Câmera vertical: travada no ciclista (ele fica sempre no mesmo lugar da tela). Única exceção: quando a estrada à frente DESCE,
// a câmera baixa um pouco (o ciclista sobe na tela) para quem vai na frente não passar por trás da barra de stamina.
// É uma função da posição na estrada (média da altura nos próximos ~1000 px), sem mola nem atraso → não balança.
let CAMY=null,EYB=0;
function camPasso(){const a=alt(dist),K=9*3600/SCALE;let m=0;for(let i=1;i<=20;i++)m+=alt(dist+i*50/K)-a;
 EYB=clamp(-(m/20)*1.15,0,210);CAMY=a-EYB}
function curvaCalc(){const K=9*3600/SCALE,a0=CAMY===null?alt(dist):CAMY;
 const xs=[];for(let x=bikeX;x>WX0-TRECHO;x-=TRECHO)xs.unshift(x);for(let x=bikeX+TRECHO;x<WX1+TRECHO;x+=TRECHO)xs.push(x);
 const e=xs.map(x=>alt(dist+(x-bikeX)/K)-a0);
 SEG=[];for(let k=0;k<xs.length-1;k++)SEG.push({xa:xs[k],xb:xs[k+1],e:e[k],m:(e[k+1]-e[k])/(xs[k+1]-xs[k])})}
function segEm(x){for(const s of SEG)if(x<s.xb)return s;return SEG[SEG.length-1]}
function alturaEm(x){const s=segEm(x);return s.e+s.m*(x-s.xa)}
function noTrecho(s,f){ctx.save();ctx.transform(1,-s.m,0,1,0,s.m*s.xa-s.e);f();ctx.restore()}
// faixa contínua (grade, asfalto) só entre xa e xb, recortando a própria imagem (mesmo desenho de tiles())
function tiraTrecho(img,off,y,w,h,mirror,ext,xa,xb){const iw=img.width,ih=img.height,k=iw/(w+1),i0=Math.floor((off+xa)/w)-1;
 for(let i=i0;i*w-off<xb;i++){const x=Math.floor(i*w-off),d0=Math.max(x,xa),d1=Math.min(x+w+1,xb+1);if(d1<=d0)continue;
  if(mirror&&((i%2)+2)%2){const u0=x+w+1-d1,u1=x+w+1-d0;ctx.save();ctx.translate(x+w+1,y);ctx.scale(-1,1);
   ctx.drawImage(img,u0*k,0,(u1-u0)*k,ih,u0,0,u1-u0,h);if(ext)ctx.drawImage(img,u0*k,ih-1,(u1-u0)*k,1,u0,h-1,u1-u0,ext);ctx.restore()}
  else{ctx.drawImage(img,(d0-x)*k,0,(d1-d0)*k,ih,d0,y,d1-d0,h);if(ext)ctx.drawImage(img,(d0-x)*k,ih-1,(d1-d0)*k,1,d0,y+h-1,d1-d0,ext)}}}
function objetos(img,items,period,off,base,h){const o=off%period,w=h*img.width/img.height;
 for(const it of items)for(let k=-1;k<3;k++){const sc=it[1]||1,x=it[0]-o+k*period;if(x+w*sc>WX0-40&&x<WX1+40)
  {const a=Math.min(alturaEm(x+w*sc*.3),alturaEm(x+w*sc*.5),alturaEm(x+w*sc*.7));ctx.drawImage(img,x,base+18-h*sc-a,w*sc,h*sc)}}}
// Estrada no estilo da referência: árvores e arbustos atrás · guard-rail de trás na borda de cima do asfalto · asfalto ·
// guard-rail da frente na borda de baixo · logo abaixo, o mato (veg_topo) acompanhando a inclinação · e o aterro preso ao chão.
function pistaCurva(){curvaCalc();const vis=SEG.filter(s=>s.xb>=WX0&&s.xa<=WX1);
 for(const s of vis)noTrecho(s,()=>{ctx.fillStyle='#7cbd33';ctx.fillRect(s.xa,560,s.xb-s.xa+1,300)});
 objetos(IMG.bigtree,[[110,1],[1650,1]],3072,scroll*.8,600,430);
 objetos(IMG.smalltree,[[780,1],[1180,1],[2330,1],[2790,1]],3072,scroll*.8,600,300);
 objetosInc(IMG.bush,[[300,1],[950,.8],[1700,1],[2250,.85]],2574,scroll,612,95);
 for(const s of vis)noTrecho(s,()=>tiraTrecho(IMG.rail,scroll,522,1287,114,false,0,s.xa,s.xb));
 aterro(vis);
 for(const s of vis)noTrecho(s,()=>tiraTrecho(IMG.asph,scroll,628,555,185,true,0,s.xa,s.xb));
 if(typeof sensMarcas==='function')sensMarcas(vis);   // tachas e remendos (sensacao.js)
 const vt=IMG.veg_topo,vh=170,vw=vt&&vt.width?vt.width*vh/vt.height:0;
 }
function pistaFrente(){const vis=SEG.filter(s=>s.xb>=WX0&&s.xa<=WX1),vt=IMG.veg_topo,vh=170,vw=vt&&vt.width?vt.width*vh/vt.height:0;
 for(const s of vis)noTrecho(s,()=>{tiraTrecho(IMG.rail,scroll,706,1287,114,false,0,s.xa,s.xb);if(vw)tiraTrecho(vt,scroll,800,vw,vh,true,0,s.xa,s.xb)})}
// arbustos baixos: inclinam junto com a estrada
function objetosInc(img,items,period,off,base,h){const o=off%period,w=h*img.width/img.height;
 for(const it of items)for(let k=-1;k<3;k++){const sc=it[1]||1,x=it[0]-o+k*period;if(x+w*sc>WX0-40&&x<WX1+40)
  {const ww=w*sc,a0=alturaEm(x),m=(alturaEm(x+ww)-a0)/ww;ctx.save();ctx.transform(1,-m,0,1,0,m*x-a0);ctx.drawImage(img,x,base-h*sc,ww,h*sc);ctx.restore()}}}
// aterro: mato que preenche tudo embaixo da estrada (nas subidas a estrada fica "em cima" dele, como num barranco)
let ATP=null;
function aterro(vis){if(!IMG.cen_aterro||!IMG.cen_aterro.width)return;if(!ATP)ATP=ctx.createPattern(IMG.cen_aterro,'repeat');
 const yb=s=>[880-s.e,880-s.e-s.m*(s.xb-s.xa)];ctx.beginPath();ctx.moveTo(vis[0].xa,1600);
 for(const s of vis){const[a,b]=yb(s);ctx.lineTo(s.xa,a);ctx.lineTo(s.xb,b)}ctx.lineTo(vis[vis.length-1].xb,1600);ctx.closePath();
 ATP.setTransform(new DOMMatrix().translate(-(scroll%640),((CAMY||0)%640+640)%640));ctx.fillStyle=ATP;ctx.fill()}

// ---------- V2: perfil de altimetria (miniatura acima da linha de watts) ----------
// Altitude calculada do próprio percurso (integral da inclinação de terrain()); amarelo = já percorrido; ponto = ciclista.
let PERFIL=null;
function perfilCalc(){const n=250,h=new Float32Array(n+1);let alt=0;const dk=GOAL/n;
 for(let i=1;i<=n;i++){alt+=terrain((i-.5)*dk)/100*dk*1000;h[i]=alt}
 let mx=0;for(const v of h)mx=Math.max(mx,v);return{n,h,mx}}
// Pedal Livre: janela que anda junto (3 km atrás, 10 km à frente)
function perfilJanela(){const n=130,a=Math.max(0,dist-3),b=a+13,dk=(b-a)/n,h=new Float32Array(n+1);let alt=0;for(let i=1;i<=n;i++){alt+=terrain(a+(i-.5)*dk)/100*dk*1000;h[i]=alt}
 let mn=1e9,mx=-1e9;for(const v of h){mn=Math.min(mn,v);mx=Math.max(mx,v)}for(let i=0;i<=n;i++)h[i]-=mn;return{n,h,mx:Math.max(60,mx-mn),k:Math.round((dist-a)/dk),livre:true}}
function perfilMini(cx,yb){if(state!=='run'&&state!=='paused')return;if(GOAL>=9999)PERFIL=perfilJanela();else if(!PERFIL)PERFIL=perfilCalc();
 const P=PERFIL,w=360,hh=66,x0=cx-w/2,pad=12,gx=x0+pad,gw=w-pad*2,gy=yb-8,gh=hh-18,X=i=>gx+gw*i/P.n,Y=i=>gy-gh*P.h[i]/P.mx;
 rr(x0,yb-hh,w,hh,12);ctx.fillStyle='#0a1a2cb8';ctx.fill();
 const k=P.livre?P.k:Math.min(P.n,Math.max(0,Math.round(dist/GOAL*P.n)));
 // área e linha do percurso inteiro (claro) e do trecho feito (amarelo)
 const area=(a,b,col)=>{ctx.beginPath();ctx.moveTo(X(a),gy);for(let i=a;i<=b;i++)ctx.lineTo(X(i),Y(i));ctx.lineTo(X(b),gy);ctx.closePath();ctx.fillStyle=col;ctx.fill()};
 const linha=(a,b,col,lw)=>{ctx.beginPath();ctx.moveTo(X(a),Y(a));for(let i=a+1;i<=b;i++)ctx.lineTo(X(i),Y(i));ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineJoin='round';ctx.stroke()};
 area(0,P.n,'#cfe3f12a');linha(0,P.n,'#cfe3f1aa',2.5);
 if(k>0){area(0,k,'#ffd83a55');linha(0,k,'#ffd83a',3.5)}
 // bandeira de chegada e ciclista
 if(!P.livre){ctx.fillStyle='#fff';ctx.fillRect(X(P.n)-1,Y(P.n)-14,2,14);ctx.fillStyle='#fff';ctx.fillRect(X(P.n)+1,Y(P.n)-14,8,5)}
 if(typeof PEL!=='undefined'&&PEL.lider){const kp=Math.min(P.n,Math.max(0,Math.round(PEL.lider.dist/GOAL*P.n)));ctx.beginPath();ctx.arc(X(kp),Y(kp),6,0,Math.PI*2);ctx.fillStyle='#ff4a3d';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#06121e';ctx.stroke()}
 ctx.beginPath();ctx.arc(X(k),Y(k),6,0,Math.PI*2);ctx.fillStyle='#ffd83a';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#06121e';ctx.stroke();
 ctx.font='italic 700 14px Exo2,system-ui,sans-serif';ctx.textAlign='left';ctx.fillStyle='#cfe3f1';ctx.fillText(P.livre?'próximos 10 km':Math.round(P.h[k])+' m',x0+pad,yb-hh+18)}
