/* ===== Modos de jogo e CARREIRA =====
   Título → ESCOLHA O MODO:
     CONTRARRELÓGIO: 50 km sozinho, mecânica original, vale ranking (nada muda aqui).
     CARREIRA (sem ranking): ficha do ciclista + TREINAR ou CORRER.
       TREINO: 30/50/80/100 km com outros ciclistas na estrada (dá para pegar vácuo). XP por km, recorde e medalhas de tempo.
       CORRIDA: largada em massa com 15 ciclistas (corrida.js). XP pela colocação; VENCER sobe a patente.
     Cada nível dá 1 ponto de atributo. Distâncias de treino liberadas pela patente.
   Prova mais longa que no contrarrelógio: SCALE menor (30 km do iniciante ≈ 2 min reais); fadiga reescalada por km.
   Progresso salvo no navegador (localStorage 'tt2_car'). */
const AJ0=JSON.parse(JSON.stringify(AJ)),CLIMBS50=JSON.parse(JSON.stringify(climbs));
const CAR={
 ftp:180,ftpNivel:6.5,ftpMotor:4,peso:74,fad:1.5,   // nível 25 + motor 10 ≈ 376 W (pro de ~66 kg, ≈5,8 W/kg)
                  // iniciante: fadiga ×1,5 em relação ao contrarrelógio
 cruise:.42,                               // sem apertar: só 42% do FTP (no contrarrelógio é 70%) → na Carreira é preciso pedalar sempre
 prova:{
  livre:{scale:40,agua:5,gel:0,climbs:[]},   // Pedal Livre: estrada sem fim (subidas geradas em livre.js)
  30:{scale:32,agua:5,gel:1,climbs:[{start:6,end:7.5,peak:5,descentEnd:9},{start:14,end:16,peak:6,descentEnd:18},{start:22,end:26,peak:7,descentEnd:28.5}]},
  50:{scale:48,agua:5,gel:2,climbs:CLIMBS50},
  80:{scale:62,agua:5,gel:3,climbs:[{start:10,end:12,peak:5,descentEnd:14},{start:24,end:27,peak:6,descentEnd:30},{start:40,end:43,peak:5.5,descentEnd:46},{start:57,end:63,peak:7,descentEnd:66},{start:71,end:75,peak:6.5,descentEnd:77.5}]},
  100:{scale:70,agua:5,gel:4,climbs:[{start:12,end:14,peak:5,descentEnd:16},{start:28,end:31,peak:6,descentEnd:34},{start:45,end:48,peak:6.5,descentEnd:51},{start:62,end:66,peak:6,descentEnd:69},{start:79,end:85,peak:7.5,descentEnd:88},{start:91,end:95,peak:6.5,descentEnd:97.5}]}},
 // medalhas do treino: média mínima (km/h) para bronze, prata, ouro
 med:{30:[27.5,31,34.5],50:[29.5,32.5,35.5],80:[30,33,36],100:[30.5,33.5,36.5]},
 libera:{30:0,50:2,80:4,100:6},           // patente que libera cada distância de treino
 patentes:[{n:'INICIANTE',km:30,forca:190},{n:'INTERMEDIÁRIO',km:30,forca:205},{n:'ESPORTE',km:50,forca:220},{n:'ELITE',km:50,forca:235},
           {n:'SEMIPROFISSIONAL',km:80,forca:250},{n:'ESTRELA NACIONAL',km:80,forca:265},{n:'NÍVEL MUNDIAL',km:100,forca:285}],
 xpKm:1,xpRecorde:15,xpMed:[25,45,80],xpPos:[150,100,75,45,45,45,30,30,30,30,20,20,20,20,20],
 max:10,nivelMax:25,
 aposta:{op:[100,250,500],mult:{1:5,2:2,3:1}},   // 17/11: RACHÃO = APOSTA (paga ao largar; 1º 5× · 2º 2× · 3º devolve · resto perde)
 moedas:{rachaoKm:1,med:[20,40,80],pos:[50,35,25,15,15,15,10,10,10,10,6,6,6,6,6]},   // 16/11: era 80·50·35·20… (quem vence sempre fazia ~3.000/h; meta ~1.000/h)
 loja:[{id:'banana',n:'BANANA',d:['−fadiga e +stamina','leva até 5 por pedalada'],p:20},
  {id:'gel',n:'GEL',d:['−40% da fadiga (o 2º rende','menos) · até 3 por pedalada'],p:60},
  {id:'iso',n:'ISOTÔNICO',d:['5 goles, um pouco melhor','que a água · vale 1 pedalada'],p:40},
  {id:'azul',n:'GEL AZUL',d:['zera a fadiga: vida extra','máximo 1 por pedalada'],p:1000},
  {id:'reset',n:'RESETAR PONTOS',d:['devolve todos os pontos','para refazer a build'],p:250}],
 builds:[{n:'ESCALADOR',a:'Escalada · Fôlego · Recuperação',d:'Sofre no plano, voa nas subidas.',c:'#a8ffb4'},
  {n:'SPRINTER',a:'Sprint · Motor · Recuperação',d:'Esconde no vácuo e explode no fim.',c:'#ffb36b'},
  {n:'CLÁSSICO',a:'Motor · Sprint · Recuperação',d:'Ataca na subida curta e segura o ritmo.',c:'#7ee0ff'},
  {n:'ROLADOR',a:'Motor · Fôlego',d:'Ritmo alto e constante, foge no plano.',c:'#ffe27a'}]};
const xpNec=n=>60+20*n+2*n*n;   // 17/11: era 40+15n (subia ~1 nível por corrida). Nível 10→11 = 460 · 20→21 = 1.260 · total até o 25 ≈ 17.240 (~10 h)
const ftpDe=(nivel,motor)=>Math.round(CAR.ftp+CAR.ftpNivel*(nivel-1)+CAR.ftpMotor*motor);   // FTP cresce com o nível (e um pouco com o motor)                   // XP para ir do nível n ao n+1
const ATR=[
 {k:'motor',n:'MOTOR',d:'+4 W de FTP (o nível dá +6,5 W)',ef:l=>`FTP ${ftpDe(CS.nivel,l)} W`},
 {k:'folego',n:'FÔLEGO',d:'−5% de fadiga',ef:l=>`fadiga ${Math.round(CAR.fad*(1-.05*l)*100)}%`},
 {k:'recup',n:'RECUPERAÇÃO',d:'stamina volta +6%',ef:l=>`+${6*l}%`},
 {k:'escalada',n:'ESCALADA',d:'−1 kg, sobe melhor',ef:l=>`${CAR.peso-l} kg`},
 {k:'sprint',n:'SPRINT',d:'+40 W de pico e +5% de explosão',ef:l=>`pico ${700+40*l} W`}];
const MEDN=['BRONZE','PRATA','OURO'],MEDC=['#d08a4a','#d9e2ea','#ffd23a'];
let CS=carLer(),carTipo='treino',carProva=30,carRes=null,carZerar=0,modoSel=1;
function carNovo(){return{v:2,nivel:1,xp:0,pontos:1,moedas:0,inv:{banana:0,gel:0,iso:0,azul:0,agua7:0},mochila:[],up:{},camp:null,skin:'branco',gar:{tem:{},uso:{}},recLivre:0,sk:{motor:0,folego:0,recup:0,escalada:0,sprint:0},pat:0,rec:{},med:{},treinos:0,corridas:0,vitorias:0,
 cq:{km:0,elev:0,banana:0,agua:0,iso:0,gel:0,moedas:0,vitR:0,podR:0,seqR:0,cr:0,crRec:0}}}   // cq: contadores das conquistas (conquistas.js)
function carLer(){try{const j=JSON.parse(localStorage.getItem('tt2_car')||'null');if(j&&j.v===2&&j.sk)return Object.assign(carNovo(),j)}catch(e){}return carNovo()}
function carSalvar(){try{localStorage.setItem('tt2_car',JSON.stringify(CS))}catch(e){}}
const pat=()=>CAR.patentes[Math.min(CS.pat,CAR.patentes.length-1)];
const liberado=km=>CS.pat>=CAR.libera[km];
function ganharXP(x){if(CS.nivel>=CAR.nivelMax){CS.xp=0;return 0}CS.xp+=x;let up=0;while(CS.nivel<CAR.nivelMax&&CS.xp>=xpNec(CS.nivel)){CS.xp-=xpNec(CS.nivel);CS.nivel++;CS.pontos++;up++}if(CS.nivel>=CAR.nivelMax)CS.xp=0;return up}
// ---------- aplicar o modo antes de cada largada ----------
function aplicarModo(){
 Object.keys(AJ0).forEach(k=>AJ[k]=JSON.parse(JSON.stringify(AJ0[k])));
 if(MODO!=='carreira'){SCALE=75;GOAL=50;climbs=CLIMBS50;rampas=[];FTP=AJ.ftp;ROTEIRO=[];PERFIL=null;return}
 const cg=carTipo==='corrida'&&typeof campAtivo==='function'&&campAtivo();   // corrida = etapa do campeonato (mapa fixo, campeonato.js)
 const km=cg?cg.km:carTipo==='corrida'?pat().km:carTipo==='livre'?'livre':carProva,P=CAR.prova[km],s=CS.sk,f=CAR.fad*(1-.05*s.folego),ts=P.scale/75;
 SCALE=P.scale;GOAL=km==='livre'?9999:km;climbs=km==='livre'?[]:cg?campClimbs(cg):P.climbs;rampas=[];PERFIL=null;
 AJ.ftp=ftpDe(CS.nivel,s.motor);AJ.peso=CAR.peso-s.escalada;FTP=AJ.ftp;AJ.cruise=CAR.cruise;
 // fadiga é por segundo real: com a prova mais longa, reescala para a mesma fadiga por km
 AJ.fadResist=AJ0.fadResist*f*ts;AJ.fadInt=AJ0.fadInt.map(([x,y])=>[x,y*f*ts]);AJ.fadExausto=AJ0.fadExausto*ts;
 AJ.staRecupera=AJ0.staRecupera*(1+.06*s.recup);
 AJ.pMax=700+40*s.sprint;AJ.staGasto=AJ0.staGasto.map(([x,y])=>[x,x>=1.6?y*(1-.05*s.sprint):y]);
 // acelerador (igual ao Contrarrelógio, desde 16/11): fadiga pela mesma regra de km (f·ts); sem apertar não pedala
 AJ.empFad=AJ0.empFad.map(([x,y])=>[x,y*f*ts]);AJ.empLivre=0;
 AJ.empRecupera=AJ0.empRecupera*(1+.06*s.recup);   // RECUPERAÇÃO: a barra volta +6% por nível
 AJ.empWp=AJ0.empWp*(1+.05*s.sprint);              // SPRINT: +40 W de pico (pMax) e bateria acima do FTP +5% por nível
 AJ.aguaQtd=5;AJ.gelQtd=P.gel;   // água: 5 goles (7 com a garrafa de 700 ml da loja)
 // treino: ciclistas na estrada (lentos à frente, rápidos que passam, um grupo) com km reescalados
 ROTEIRO=[]}
const _carReset=reset;
reset=function(){corridaParar();aplicarModo();_carReset();carRes=null;if(MODO==='carreira'&&carTipo!=='livre'){const cg=carTipo==='corrida'&&typeof campAtivo==='function'&&campAtivo();
 corridaIniciar(cg?cg.forca:Math.max(pat().forca,FTP),carTipo==='corrida',cg?cg.grade:null)}};   // a categoria acompanha você: o pelotão tem a força da patente ou a sua, a maior
// ---------- resultado ----------
const _carFinish=finish;
finish=function(w){_carFinish(w);if(MODO!=='carreira')return;
 const km=GOAL,t=elapsed*SCALE,avg=dist*3600/Math.max(1,t),r={moedas:0,tipo:carTipo,km,t,avg,linhas:[],ganho:0,sobe:null,libera:[],med:-1,pos:0,venc:null,niveis:0};
 const add=(n,s)=>{n=Math.round(n);if(n>0){r.linhas.push([s,n]);r.ganho+=n}};
 const aband=typeof LV!=='undefined'&&LV&&LV.encerrou;
 if(carTipo==='livre'){livreFim(r,add)}
 else if(aband){devolverItens();r.moedas=Math.floor(dist*CAR.moedas.rachaoKm*.8);r.aband=true}
 else if(carTipo==='treino'){CS.treinos++;devolverItens();   // rachão: vale a colocação (não sobe patente)
  if(w){r.pos=corridaPos();add(CAR.xpPos[Math.min(r.pos,15)-1]*.7,`${r.pos}º lugar no rachão`);const ap=(LV&&LV.aposta)||0;r.aposta=ap;r.premio=Math.round(ap*(CAR.aposta.mult[r.pos]||0));r.moedas+=r.premio;
   CS.melhorPos=CS.melhorPos||{};if(!CS.melhorPos[km]||r.pos<CS.melhorPos[km]){CS.melhorPos[km]=r.pos}
   const rec=CS.rec[km];if(rec==null||t<rec){add(CAR.xpRecorde,rec==null?'primeira chegada':'novo recorde pessoal');CS.rec[km]=t}}
  else add(dist*CAR.xpKm,`${Math.floor(dist)} km pedalados`);
  const lid=CORR.riders.filter(x=>x.fim!=null).sort((a,b)=>a.fim-b.fim)[0];if(r.pos!==1&&lid)r.venc=`${lid.nome} (${lid.tipo})`}
 else{CS.corridas++;devolverItens();const cg=typeof campAtivo==='function'&&campAtivo(),kx=cg?CAMP.xpEt:1,km_=cg?CAMP.moedaEt:1;   // etapa de campeonato: XP e moedas reduzidos; a patente só sobe vencendo a GERAL
  if(w){r.pos=corridaPos();add(CAR.xpPos[Math.min(r.pos,15)-1]*kx,`${r.pos}º lugar${cg?' na etapa':''}`);r.moedas+=Math.round(CAR.moedas.pos[Math.min(r.pos,15)-1]*km_)}else add(dist*CAR.xpKm,`${Math.floor(dist)} km pedalados`);
  const lid=CORR.riders.filter(x=>x.fim!=null).sort((a,b)=>a.fim-b.fim)[0]||CORR.riders.slice().sort((a,b)=>b.dist-a.dist)[0];
  if(r.pos!==1&&lid)r.venc=`${lid.nome} (${lid.tipo})`;
  if(r.pos===1){CS.vitorias++;if(!cg&&CS.pat<CAR.patentes.length-1){const antes=[30,50,80,100].filter(liberado);CS.pat++;r.sobe=pat().n;r.libera=[30,50,80,100].filter(k=>liberado(k)&&!antes.includes(k))}}}
 if(carTipo!=='livre'&&CORR.riders.length){r.classif=classifMontar(!!w&&!aband,aband);const v=r.classif[0];if(v&&!v.eu&&v.t!=null)r.venc=`${v.nome} (${v.tipo})`}CLASSIF=false;   // vencedor de verdade (a prova termina mesmo se você quebrou)
 r.niveis=ganharXP(r.ganho);CS.moedas+=r.moedas;carSalvar();carRes=r};
// ---------- navegação ----------
function devolverSaindo(){if(typeof LV!=='undefined'&&LV&&typeof devolverItens==='function'){devolverItens();carSalvar()}}   // saiu no meio da prova: itens não usados voltam
function toModo(){devolverSaindo();corridaParar();state='modo';boost=false;speed=0;grade=0;nickEl.blur()}
// 18/11 (pedido do dono): sem a tela ESCOLHA O MODO — o jogo entra direto na Carreira. O Contrarrelógio fica só como teste
// interno: abra com ?teste=crono no endereço para ver a tela de modos de novo.
const TESTE_CRONO=typeof location!=='undefined'&&/[?&]teste=crono/.test(location.search);
const _toModo=toModo;
toModo=function(){if(TESTE_CRONO){_toModo();return}
 if(state==='carreira'||state==='nome'){devolverSaindo();corridaParar();state='title';boost=false;speed=0;grade=0;nickEl.blur();return}   // voltar do hub = tela inicial
 devolverSaindo();corridaParar();boost=false;speed=0;grade=0;nickEl.blur();MODO='carreira';if(CS.nome)toHub();else editarNome()};
function toHub(){devolverSaindo();corridaParar();state='carreira';boost=false;speed=0;grade=0;carZerar=0;nickEl.blur()}
const _carToSelect=toSelect;
toSelect=function(){if(state==='title'){toModo();return}if(MODO==='carreira'){toHub();return}_carToSelect()};
function escolherModo(m){if(m===0){MODO='crono';_carToSelect()}else{MODO='carreira';if(CS.nome)toHub();else editarNome()}}
// nome do jogador na Carreira (os nomes dos personagens são internos e não aparecem)
function editarNome(){state='nome';nickEl.value=CS.nome||'';nickEl.placeholder='Seu nome...';setTimeout(()=>{try{nickEl.focus()}catch(e){}},50)}
function confirmarNome(){const v=nickEl.value.trim().slice(0,12);if(!v)return;CS.nome=v;carSalvar();nickEl.blur();nickEl.value=nick||'';nickEl.placeholder='Digite seu nick...';toHub()}
function drawNome(){fundo();cardMenu(W/2-420,200,840,460,MN.borda,6,30);
 tx('CARREIRA',W/2,290,60,'center',MN.tit);tx('Como você quer ser chamado?',W/2,340,26,'center','#fff');
 caixaNome(W/2-300,380,600,84);btn('CONFIRMAR',W/2-300,510,600,96,confirmarNome,true,44);
 btnVoltar('VOLTAR',()=>{nickEl.blur();nickEl.value=nick||'';nickEl.placeholder='Digite seu nick...';toModo()})}
let MOCH_DEST={t:'livre'};
function irMochila(t,km){MOCH_DEST={t,km};state='mochila'}
function correr(tipo,km){carTipo=tipo;carProva=km||pat().km;sel=0;reset()}
addEventListener('keydown',e=>{if(pnl||e.target===nickEl||e.defaultPrevented)return;
 if(state==='modo'){if(e.code==='ArrowLeft'||e.code==='ArrowRight')modoSel=1-modoSel;else if(e.code==='Enter'||e.code==='Space'){e.preventDefault();escolherModo(modoSel)}else if(e.code==='Escape')state='title'}
 else if(state==='carreira'){if(e.code==='Escape')toModo();else if(e.code==='ArrowLeft')trocarSkin(-1);else if(e.code==='ArrowRight')trocarSkin(1)}
 else if(state==='treino'||state==='mochila'){if(e.code==='Escape')state=state==='mochila'?mochVolta():'pedalar'}
 else if(state==='habil'||state==='loja'||state==='pedalar'||state==='conquistas'){if(e.code==='Escape')toHub()}});
// ---------- desenho ----------
const _carDraw=draw;
// menus da Carreira: tema escuro das maquetes (CLARO fica falso; o _carDraw original zera no começo)
draw=function(){CLARO=false;
 if(state==='nome'){btns=[];drawNome();if(pnl)drawPanel();return}
 if(state==='mochila'){btns=[];drawMochila();if(pnl)drawPanel();return}
 if(state==='conquistas'){btns=[];drawConquistas();if(pnl)drawPanel();return}
 if(state==='modo'){btns=[];drawModo();if(pnl)drawPanel();return}
 if(state==='carreira'){btns=[];drawHub();if(pnl)drawPanel();return}
 if(state==='treino'){btns=[];drawTreino();if(pnl)drawPanel();return}
 if(state==='habil'){btns=[];drawHabil();if(pnl)drawPanel();return}
 if(state==='loja'){btns=[];drawLoja();if(pnl)drawPanel();return}
 if(state==='pedalar'){btns=[];drawPedalar();if(pnl)drawPanel();return}
 _carDraw()};
const _carOverlay=overlay;
overlay=function(){if(MODO==='carreira'&&state==='over'&&carRes){carOverlay();return}_carOverlay()};
const _carHud=npcHud;
npcHud=function(){_carHud();if(MODO!=='carreira'||GOAL>=9999||(state!=='run'&&state!=='paused'))return;
 let s,col;
 if(CORR.on){const p=corridaPos(),lid=CORR.riders.filter(r=>!r.dnf).concat([{dist,eu:1}]).sort((a,b)=>b.dist-a.dist)[0];
  s=`POSIÇÃO ${p}/${CORR.riders.length+1}`+(p>1&&lid&&!lid.eu?`  ·  LÍDER: ${lid.nome.toUpperCase()}`:'');col=p===1?'#a8ffb4':p<=3?'#ffe27a':'#fff'}
 else{const avg=elapsed>0?dist*3600/(elapsed*SCALE):0,M=CAR.med[GOAL];let m=-1;M.forEach((v,i)=>{if(avg>=v)m=i});
  s=m<0?`RITMO: SEM MEDALHA (bronze ${f1(M[0])} km/h)`:`RITMO DE ${MEDN[m]}`+(m<2?` · ${MEDN[m+1].toLowerCase()} ${f1(M[m+1])} km/h`:'');col=m<0?'#cfe3f1':MEDC[m]}
 ctx.font='italic 800 22px Exo2,system-ui,sans-serif';const w=ctx.measureText(s).width+34;rr(W/2-w/2,226,w,38,19);ctx.fillStyle='#0a1a2cd8';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=col;ctx.stroke();tx(s,W/2,253,22,'center',col)};
function fundo(img){if(img)ctx.drawImage(img,0,0,W,H);else menuFundo()}
// card dos menus: marinho com borda ciano; selecionado = borda amarela; hover = borda mais grossa
function card(x,y,w,h,on,hv){cardMenu(x,y,w,h,on?MN.ama:MN.borda,on||hv?8:5,26)}
function medalha(x,y,i,on,r=15){ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fillStyle=on?MEDC[i]:'#d4dbe2';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#14161c';ctx.stroke()}
// ESCOLHA O MODO (layout do mockup): ícone grande + título amarelo + linhas pretas
// ESCOLHA O MODO (maquete): ilustração no topo do card, faixa amarela com o nome, textos embaixo
function drawModo(){fundo();
 const M=[{ic:IMG.modo_crono,t:'CONTRARRELÓGIO',a:'50 km sozinho contra o relógio',b:'Mecânica completa · FTP 250 W',c:['RANKEADO']},
  {ic:IMG.modo_carreira,t:'CARREIRA',a:`${pat().n} · NÍVEL ${CS.nivel}`,b:'Treine, participe de corridas e evolua',c:['XP E ATRIBUTOS','SEM RANKING']}];
 M.forEach((m,i)=>{const w=622,h=656,cx=W/2+(i?342:-342),x=cx-w/2,y=150,b={x,y,w,h},hv=hit(b,mx,my);if(hv)modoSel=i;btns.push({...b,act:()=>escolherModo(i)});
  const on=modoSel===i,s=on?1+.012*(1+Math.sin(T*3)):1;ctx.save();ctx.translate(cx,y+h/2);ctx.scale(s,s);ctx.translate(-cx,-y-h/2);
  cardMenu(x,y,w,h,on?MN.ama:MN.borda,on?9:7,34);
  const ix=x+14,iy=y+14,iw=w-28,ih=m.ic&&m.ic.width?iw*m.ic.height/m.ic.width:300;
  if(m.ic&&m.ic.width){ctx.save();rr(ix,iy,iw,ih+40,24);ctx.clip();ctx.drawImage(m.ic,ix,iy,iw,ih);ctx.restore()}
  const by=iy+ih-34;rr(x+10,by,w-20,96,34);ctx.fillStyle=MN.ama;ctx.fill();ctx.lineWidth=6;ctx.strokeStyle=MN.esc;ctx.stroke();
  ctx.font=FT(900,i?70:62);ctx.fillStyle=MN.esc;ctx.textAlign='center';ctx.fillText(m.t,cx,by+70);
  txFit(m.a,cx,by+152,30,w-60,'center',MN.tit);txFit(m.b,cx,by+196,26,w-60,'center','#fff');
  m.c.forEach((t,j)=>tx(t,cx,by+(m.c.length>1?256:262)+j*48,m.c.length>1?44:50,'center',MN.tit));ctx.restore()});
 btnVoltar('VOLTAR',()=>{state='title'});tituloFaixa('ESCOLHA O MODO',W/2-40,64);drawIcons()}
function ficha(){const p=pat(),s=CS.sk;card(40,112,760,724,false,false);
 tx(p.n,80,166,38,'left','#a8ffb4');
 CAR.patentes.forEach((q,i)=>{ctx.beginPath();ctx.arc(90+i*36,192,11,0,7);ctx.fillStyle=i<CS.pat?'#a8ffb4':i===CS.pat?'#ffd800':'#1c3550';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#06121e';ctx.stroke()});
 // nível e barra de XP
 tx(`NÍVEL ${CS.nivel}/${CAR.nivelMax}`,400,166,30,'left','#fff');const xb=400,yb=180,wb=360,nec=xpNec(CS.nivel);
 rr(xb,yb,wb,20,10);ctx.fillStyle='#1c3550';ctx.fill();if(CS.xp>0){rr(xb,yb,Math.max(20,wb*CS.xp/nec),20,10);ctx.fillStyle='#7ee0ff';ctx.fill()}
 tx(CS.nivel>=CAR.nivelMax?'NÍVEL MÁXIMO':`${CS.xp} / ${nec} XP`,xb+wb,yb+44,18,'right','#cfe3f1');
 const ftp=ftpDe(CS.nivel,s.motor),kg=CAR.peso-s.escalada;
 tx(`FTP ${ftp} W  ·  ${kg} kg  ·  ${(ftp/kg).toFixed(1).replace('.',',')} W/kg`,80,262,26,'left','#fff');
 if(CS.pontos>0){const pw=`${CS.pontos} PONTO${CS.pontos>1?'S':''} PARA DISTRIBUIR`;ctx.font='italic 800 20px Exo2,system-ui,sans-serif';const cw=ctx.measureText(pw).width+30;
  rr(80,280,cw,36,12);ctx.fillStyle='#ffd800';ctx.fill();ctx.fillStyle='#0f1a3a';ctx.textAlign='left';ctx.fillText(pw,95,305)}
 ATR.forEach((a,i)=>{const y=326+i*100,l=s[a.k],pode=l<CAR.max&&CS.pontos>0;
  tx(a.n,80,y+34,28,'left','#fff');tx(a.d,80,y+62,18,'left','#cfe3f1');tx(a.ef(l),80,y+86,18,'left','#ffe27a');
  for(let j=0;j<CAR.max;j++){rr(368+j*25,y+18,20,30,5);ctx.fillStyle=j<l?'#ffd800':'#1c3550';ctx.fill()}
  tx(`NÍVEL ${l}`,368,y+80,18,'left','#cfe3f1');
  const bx=640,by=y+14,bw=130,bh=56,hv=pode&&hit({x:bx,y:by,w:bw,h:bh},mx,my);
  if(pode)btns.push({x:bx,y:by,w:bw,h:bh,act:()=>{if(CS.pontos>0&&CS.sk[a.k]<CAR.max){CS.pontos--;CS.sk[a.k]++;carSalvar()}}});
  ctx.globalAlpha=pode?1:.35;rr(bx,by,bw,bh,16);ctx.fillStyle=pode?(hv?'#ffe45c':'#ffd800'):'#3a4656';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#0f1a3a';ctx.stroke();
  ctx.fillStyle='#0f1a3a';ctx.font='italic 800 26px Exo2,system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(l>=CAR.max?'MÁX':'+',bx+bw/2,by+38);ctx.globalAlpha=1})}
// ---------- tela principal da Carreira: ciclista escolhido + HABILIDADES / LOJA / PEDALAR ----------
const SKINS=['branco','azul','vinho'];
function moedaIc(x,y,s){if(IMG.it_moeda)ctx.drawImage(IMG.it_moeda,x,y,s,s*IMG.it_moeda.height/IMG.it_moeda.width)}
function moedasChip(){const s=`${CS.moedas}`;ctx.font='italic 800 34px Exo2,system-ui,sans-serif';const w=ctx.measureText(s).width+96;
 rr(W-30-w,24,w,62,31);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=MN.esc;ctx.stroke();moedaIc(W-30-w+10,29,52);tx(s,W-48,68,36,'right',MN.tit)}
function nivelChip(x,y){const w=330;rr(x,y,w,62,31);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=MN.esc;ctx.stroke();
 ctx.font=FT(900,28);ctx.fillStyle=MN.esc;ctx.textAlign='left';ctx.fillText(`NÍVEL ${CS.nivel}`,x+24,y+42);const bx=x+168,bw=w-192,nec=xpNec(CS.nivel),f=CS.nivel>=CAR.nivelMax?1:CS.xp/nec;
 rr(bx,y+20,bw,22,11);ctx.fillStyle=MN.bg;ctx.fill();if(f>0){rr(bx+3,y+23,Math.max(16,(bw-6)*f),16,8);ctx.fillStyle=MN.borda;ctx.fill()}}
function ciclistaEmPe(id,cx,pe,alt){const m=META.idle[id],fr=Math.floor(T*8)%12,k=alt/(m.ch*m.sy),dw=m.cw*m.sx*k,dh=alt;
 ctx.drawImage(IMG['idle_'+id],(fr%4)*m.cw,Math.floor(fr/4)*m.ch,m.cw,m.ch,cx-dw/2,pe-dh,dw,dh)}
function seta(x,y,dir,act){const r=34,hv=d2(mx,my,x,y)<(r*1.3)**2;btns.push({x:x-r,y:y-r,w:2*r,h:2*r,act});ctx.save();ctx.translate(x,y);ctx.scale(hv?1.1:1,hv?1.1:1);
 ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fillStyle='#ffd800';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#0f1a3a';ctx.stroke();
 ctx.beginPath();ctx.moveTo(dir*12,0);ctx.lineTo(-dir*8,-13);ctx.lineTo(-dir*8,13);ctx.closePath();ctx.fillStyle='#0f1a3a';ctx.fill();ctx.restore()}
function botaoGrande(t,x,y,w,h,act,extra){const hv=hit({x,y,w,h},mx,my);btns.push({x,y,w,h,act});
 rr(x,y+8,w,h,30);ctx.fillStyle='#0f1a3a';ctx.fill();rr(x,y,w,h,30);ctx.fillStyle=hv?'#ffe45c':'#ffcc00';ctx.fill();ctx.lineWidth=8;ctx.strokeStyle='#0f1a3a';ctx.stroke();
 ctx.fillStyle='#0f1a3a';ctx.font='italic 900 58px Exo2,system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(t,x+w/2,y+h/2+21);
 if(extra){ctx.font='italic 800 26px Exo2,system-ui,sans-serif';const ew=ctx.measureText(extra).width+30;rr(x+w-ew-14,y-18,ew,40,20);ctx.fillStyle='#e8402a';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#0f1a3a';ctx.stroke();ctx.fillStyle='#fff';ctx.fillText(extra,x+w-ew/2-14,y+11)}}
function trocarSkin(d){const i=SKINS.indexOf(CS.skin);CS.skin=SKINS[(i+d+SKINS.length)%SKINS.length];carSalvar()}
// selo vermelho no canto do botão (+N PONTOS, N NOVAS)
function seloBotao(x,y,w,extra){if(!extra)return;ctx.font=FT(800,26);const ew=ctx.measureText(extra).width+30;rr(x+w-ew-14,y-18,ew,40,20);ctx.fillStyle='#e8402a';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=MN.esc;ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(extra,x+w-ew/2-14,y+11)}
const hoverZoom=(x,y,w,h,k)=>{ctx.translate(x+w/2,y+h/2);ctx.scale(k,k);ctx.translate(-x-w/2,-y-h/2)};
// PEDALAR: amarelo, ▶ + divisória
function botaoPrincipal(t,x,y,w,h,act){const hv=hit({x,y,w,h},mx,my);btns.push({x,y,w,h,act});ctx.save();if(hv)hoverZoom(x,y,w,h,1.03);
 rr(x,y+9,w,h,34);ctx.fillStyle='#d99a00';ctx.fill();rr(x,y,w,h,34);ctx.fillStyle=hv?'#ffe45c':MN.ama;ctx.fill();ctx.lineWidth=6;ctx.strokeStyle=MN.esc;ctx.stroke();
 ctx.fillStyle=MN.esc;const tx0=x+82,ty=y+h/2;ctx.beginPath();ctx.moveTo(tx0-22,ty-36);ctx.lineTo(tx0+34,ty);ctx.lineTo(tx0-22,ty+36);ctx.closePath();ctx.fill();
 ctx.lineWidth=5;ctx.strokeStyle=MN.esc;ctx.beginPath();ctx.moveTo(x+170,y+34);ctx.lineTo(x+162,y+h-34);ctx.stroke();
 ctx.font=FT(900,92);ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(t,x+170+(w-170)/2,ty+33);ctx.restore()}
// HABILIDADES / LOJA / CONQUISTAS: marinho, borda ciano, ícone + divisória
function botaoMenu(t,ic,x,y,w,h,act,extra){const hv=hit({x,y,w,h},mx,my);btns.push({x,y,w,h,act});ctx.save();if(hv)hoverZoom(x,y,w,h,1.03);
 cardMenu(x,y,w,h,MN.borda,hv?8:6,30);
 if(ic&&ic.width){const ih=h*.62,iw=ic.width*ih/ic.height;ctx.drawImage(ic,x+92-iw/2,y+h/2-ih/2,iw,ih)}
 ctx.lineWidth=4;ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(x+182,y+30);ctx.lineTo(x+176,y+h-30);ctx.stroke();
 tx(t,x+214,y+h/2+22,62,'left','#fff');ctx.restore();seloBotao(x,y,w,extra)}
// lápis (editar nome)
function lapis(cx,cy){ctx.save();rr(cx-24,cy-24,48,48,12);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=MN.esc;ctx.stroke();
 ctx.translate(cx,cy);ctx.rotate(-Math.PI/4);ctx.fillStyle=MN.esc;ctx.fillRect(-12,-4,20,8);ctx.beginPath();ctx.moveTo(8,-4);ctx.lineTo(15,0);ctx.lineTo(8,4);ctx.closePath();ctx.fill();ctx.restore()}
function drawHub(){fundo();
 // metade esquerda: painel escuro na diagonal com luz ciano, pódio e o retrato do ciclista escolhido (setas trocam)
 const D0=826,D1=672,cx=404,sk=SKINS.includes(CS.skin)?CS.skin:'branco',im=IMG['ret_'+sk];
 ctx.save();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(D0,0);ctx.lineTo(D1,H);ctx.lineTo(0,H);ctx.closePath();ctx.clip();
 ctx.fillStyle='#000a1ccc';ctx.fillRect(0,0,D0,H);
 let g=ctx.createRadialGradient(cx,520,40,cx,520,460);g.addColorStop(0,'#27d3f066');g.addColorStop(.55,'#1a6fd833');g.addColorStop(1,'#27d3f000');ctx.fillStyle=g;ctx.fillRect(0,0,D0,H);
 // pódio
 ctx.beginPath();ctx.ellipse(cx,812,250,40,0,0,7);ctx.fillStyle='#02234d';ctx.fill();ctx.lineWidth=6;ctx.strokeStyle=MN.borda;ctx.shadowColor=MN.borda;ctx.shadowBlur=18;ctx.stroke();ctx.shadowBlur=0;
 if(im&&im.width){const h=574,w=im.width*h/im.height,b=1+.006*Math.sin(T*2);ctx.save();ctx.translate(cx,822);ctx.scale(b,b);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore()}
 ctx.restore();
 seta(104,540,-1,()=>trocarSkin(-1));seta(676,540,1,()=>trocarSkin(1));
 SKINS.forEach((s,i)=>{ctx.beginPath();ctx.arc(cx-30+i*30,850,s===sk?8:6,0,7);ctx.fillStyle=s===sk?MN.ama:'#5a6f8a';ctx.fill()});
 ctx.save();ctx.lineCap='butt';ctx.strokeStyle=MN.esc;ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(D0+4,0);ctx.lineTo(D1+4,H);ctx.stroke();
 ctx.shadowColor=MN.borda;ctx.shadowBlur=14;ctx.strokeStyle=MN.borda;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(D0+1,0);ctx.lineTo(D1+1,H);ctx.stroke();ctx.restore();
 btnVoltar('MENU',toModo);moedasChip();nivelChip(918,24);
 // nome (toque para editar), patente · FTP, título
 {const nm=CS.nome||'SEU NOME',cx=404;ctx.font=FT(900,66);const nw=ctx.measureText(nm).width;btns.push({x:cx-nw/2-20,y:88,w:nw+100,h:72,act:editarNome});
  tx(nm,cx,148,66,'center',MN.tit);lapis(cx+nw/2+40,124);
  const sub=`${pat().n.toUpperCase()}  ·  FTP ${ftpDe(CS.nivel,CS.sk.motor)} W`;ctx.font=FT(900,28);const sw=ctx.measureText(sub).width+56;
  rr(cx-sw/2,166,sw,52,26);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=MN.esc;ctx.stroke();ctx.fillStyle=MN.esc;ctx.textAlign='center';ctx.fillText(sub,cx,203);
  if(CS.titulo)tx(`« ${CS.titulo} »`,cx,256,26,'center',MN.tit)}
 // botões (ordem da maquete)
 botaoPrincipal('PEDALAR',834,128,676,164,()=>{state='pedalar'});
 botaoMenu('HABILIDADES',IMG.hub_ic_habil,820,330,676,120,()=>{state='habil'},CS.pontos>0?`+${CS.pontos} PONTO${CS.pontos>1?'S':''}`:'');
 botaoMenu('LOJA',IMG.hub_ic_loja,804,480,692,120,()=>{state='loja'});
 botaoMenu('CONQUISTAS',IMG.hub_ic_conq,788,630,708,120,()=>{state='conquistas'},conqNovas()?`${conqNovas()} NOVA${conqNovas()>1?'S':''}`:'');
 const zx=1300,zy=784,zw=196,zh=48,z=carZerar&&T-carZerar<3;btns.push({x:zx,y:zy,w:zw,h:zh,act:()=>{if(z){CS=carNovo();carSalvar();carZerar=0}else carZerar=T}});
 tx(z?'TOQUE DE NOVO':'Zerar carreira',zx+zw,zy+30,22,'right',z?'#ff8a80':'#fff');ctx.fillStyle=z?'#ff8a80':MN.borda;ctx.fillRect(zx+10,zy+40,zw-10,4)}
// ---------- HABILIDADES: ficha com os atributos + builds sugeridas ----------
function drawHabil(){fundo();tituloGrande('HABILIDADES',84,62);btnVoltar('VOLTAR',toHub);ficha();
 card(830,112,666,724,false,false);tx('BUILDS',870,170,36,'left','#fff');
 const usados=Object.values(CS.sk).reduce((a,b)=>a+b,0);
 tx(`Pontos usados ${usados} · livres ${CS.pontos} · máximo ${CAR.nivelMax} (nível ${CAR.nivelMax})`,870,206,19,'left','#cfe3f1');
 tx('Não dá para ter tudo: escolha o seu tipo de ciclista.',870,234,19,'left','#cfe3f1');
 CAR.builds.forEach((b,i)=>{const y=262+i*136;rr(870,y,586,120,18);ctx.fillStyle='#062452';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=MN.borda;ctx.stroke();rr(874,y+4,14,112,7);ctx.fillStyle=b.c;ctx.fill();
  tx(b.n,894,y+42,30,'left',b.c);tx(b.a,894,y+76,21,'left','#fff');tx(b.d,894,y+104,19,'left','#cfe3f1')});
 tx('Mudou de ideia? Resete os pontos na LOJA.',870,822,18,'left','#7f93a6')}
// ---------- LOJA ----------
function itemIc(id,cx,cy,h){let img=null,bx=null;
 if(id==='banana')img=IMG.it_banana;else if(id==='azul')img=IMG.it_gelazul;
 else if(id==='gel'){img=IMG.nutr;bx=NUT[6]}else if(id==='agua7'){img=IMG.nutr;bx=NUT[0]}else if(id==='iso'||id==='iso7'){img=IMG.iso;bx=NUT[0]}
 if(!img){ctx.save();ctx.translate(cx,cy);ctx.lineWidth=12;ctx.strokeStyle='#7ee0ff';ctx.beginPath();ctx.arc(0,0,h*.36,.6,Math.PI*2-.2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(h*.36,-h*.2);ctx.lineTo(h*.48,h*.06);ctx.lineTo(h*.2,h*.02);ctx.closePath();ctx.fillStyle='#7ee0ff';ctx.fill();ctx.restore();return}
 if(bx){const s=h/bx[3];ctx.drawImage(img,bx[0],bx[1],bx[2],bx[3],cx-bx[2]*s/2,cy-h/2,bx[2]*s,h)}
 else{const s=h/img.height;ctx.drawImage(img,cx-img.width*s/2,cy-h/2,img.width*s,h)}}
function lojaTem(it){if(it.id==='reset'){const u=Object.values(CS.sk).reduce((a,b)=>a+b,0);return u?`${u} pontos usados`:'nenhum ponto usado'}
 return `você tem: ${CS.inv[it.id]||0}`}
function lojaPode(it){if(CS.moedas<it.p)return false;if(it.id==='reset')return Object.values(CS.sk).some(v=>v>0);return true}
function comprar(it){if(!lojaPode(it))return;CS.moedas-=it.p;
 if(it.id==='reset'){let u=0;for(const k in CS.sk){u+=CS.sk[k];CS.sk[k]=0}CS.pontos+=u}
 else CS.inv[it.id]=(CS.inv[it.id]||0)+1;carSalvar()}
// LOJA (maquete): 3×2; arte à esquerda, divisória, textos, barra de preço (amarela = dá para comprar; cinza = não dá)
function drawLoja(){fundo();if(typeof lojaAbas==='function')lojaAbas(0);else tituloGrande('LOJA',88,84);btnVoltar('VOLTAR',toHub);moedasChip();   // abas ITENS / GARAGEM (garagem.js)
 CAR.loja.forEach((it,i)=>{const cw=482,chh=294,x=28+(i%3)*(cw+14),y=142+Math.floor(i/3)*(chh+18);card(x,y,cw,chh,false,false);
  const art=IMG['loja_'+it.id];if(art&&art.width){const ah=164,aw=art.width*ah/art.height;ctx.drawImage(art,x+102-aw/2,y+22,aw,ah)}else itemIc(it.id,x+102,y+104,140);
  ctx.lineWidth=4;ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(x+196,y+24);ctx.lineTo(x+190,y+186);ctx.stroke();
  txFit(it.n,x+214,y+58,36,cw-230,'left',it.id==='azul'?'#7ee0ff':'#fff');
  it.d.forEach((t,j)=>txFit(t,x+214,y+94+j*28,21,cw-230,'left','#fff'));txFit(lojaTem(it).replace(/^v/,'V'),x+214,y+170,24,cw-230,'left',MN.verde);
  const ok=lojaPode(it),bx=x+40,by=y+206,bw=cw-80,bh=64,hv=ok&&hit({x:bx,y:by,w:bw,h:bh},mx,my);if(ok)btns.push({x:bx,y:by,w:bw,h:bh,act:()=>comprar(it)});
  ctx.save();if(hv)hoverZoom(bx,by,bw,bh,1.04);rr(bx,by,bw,bh,bh/2);ctx.fillStyle=ok?(hv?'#ffe45c':MN.ama):'#c9d1da';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=MN.esc;ctx.stroke();
  moedaIc(bx+bw/2-92,by+6,52);ctx.font=FT(900,46);ctx.fillStyle=ok?MN.esc:'#5a6472';ctx.textAlign='center';ctx.fillText(`${it.p}`,bx+bw/2+36,by+48);ctx.restore()});
 const rod='Itens são gastos ao usar. Escolha o que levar no BOLSO antes de pedalar.';tx(rod,W/2,822,26,'center','#fff');
 ctx.font=FT(800,26);const rw=ctx.measureText(rod).width;ctx.fillStyle=MN.borda;ctx.fillRect(W/2-rw/2,836,rw,4)}
// ---------- PEDALAR: escolha do modo ----------
// MOCHILA (antes do Pedal Livre): água básica sempre vai; escolha até 3 itens do seu estoque
const MOCH_OP=[{id:'iso',n:'ISOTÔNICO',q:()=>Math.min(1,CS.inv.iso||0),u:'garrafa (5 goles)'},{id:'banana',n:'BANANA',q:()=>Math.min(5,CS.inv.banana||0),u:'até 5'},
 {id:'gel',n:'GEL',q:()=>Math.min(3,CS.inv.gel||0),u:'até 3'}];   // água 700 ml saiu (16/11: "só 500 ml por enquanto"); quem tem no estoque guarda, mas não leva
// bolso = água básica + até 3 escolhidos = 4 itens no Pedal Livre e no Rachão (pedido do dono, 16/11);
//   na Corrida o regulamento proíbe a banana → água + iso + gel
const mochMax=()=>3;
function mochTog(id){const M=CS.mochila||(CS.mochila=[]),i=M.indexOf(id);if(i>=0)M.splice(i,1);else if(M.length<mochMax())M.push(id);carSalvar()}
const mochVolta=()=>MOCH_DEST.t==='treino'?'treino':MOCH_DEST.t==='corrida'?'camp':'pedalar';
function drawMochila(){fundo();tituloGrande('BOLSO',84,66);btnVoltar('VOLTAR',()=>{state=mochVolta()});moedasChip();
 const MX=mochMax(),M=(CS.mochila||[]).filter(id=>{const o=MOCH_OP.find(o=>o.id===id);return o&&o.q()>0}).slice(0,MX);CS.mochila=M;
 tx(`Água básica (5 goles) sempre vai. Escolha mais ${MX-M.length} ite${MX-M.length===1?'m':'ns'} (${M.length}/${MX}).`,W/2,128,24,'center','#fff');
 card(70,160,250,330,true,false);itemIc('agua7',195,270,140);tx('ÁGUA',195,388,30,'center','#fff');tx('kit básico',195,422,20,'center','#cfe3f1');tx('SEMPRE',195,466,24,'center',MN.verde);
 MOCH_OP.forEach((o,i)=>{const x=420+i*330,y=160,w=290,h=330,q=o.q(),on=M.includes(o.id),b={x,y,w,h},hv=q>0&&hit(b,mx,my);
  const proib=MOCH_DEST.t==='corrida'&&!REGRA_CORRIDA.includes(o.id);
  if(q>0&&!proib)btns.push({...b,act:()=>mochTog(o.id)});ctx.globalAlpha=q>0&&!proib?1:.45;card(x,y,w,h,on&&!proib,hv&&!proib);
  itemIc(o.id,x+w/2,y+110,140);tx(o.n,x+w/2,y+228,26,'center','#fff');tx(`estoque: ${CS.inv[o.id]||0}`,x+w/2,y+262,20,'center','#cfe3f1');
  tx(proib?'PROIBIDO NA CORRIDA':q>0?(on?`LEVANDO ${o.id==='banana'||o.id==='gel'?q:''}`.trim():o.u):'COMPRE NA LOJA',x+w/2,y+306,22,'center',proib?'#ff6a55':on?MN.verde:q>0?'#cfe3f1':'#ff6a55');ctx.globalAlpha=1});
 if(MOCH_DEST.t==='corrida')tx('REGULAMENTO DA CORRIDA: água, isotônico e gel. Banana e gel azul ficam em casa.',W/2,640,22,'center','#ffcc00');
 const az=MOCH_DEST.t==='corrida'?0:CS.inv.azul||0;if(MOCH_DEST.t==='corrida'){}else if(az){itemIc('azul',150,590,110);tx(`GEL AZUL: ${az} no estoque · usa 1 nesta pedalada (fica acima do raio)`,210,600,22,'left','#fff')}
 else tx('Gel azul: compre na LOJA (vida extra, 1 por pedalada).',90,600,22,'left','#cfe3f1');
 if(MOCH_DEST.t==='treino'){const A=CAR.aposta.op;if(!A.includes(CS.aposta))CS.aposta=A[0];tx('APOSTA',830,604,26,'left','#ffd23a');
  A.forEach((v,i)=>{const x=970+i*170,b={x,y:566,w:150,h:60},ok=CS.moedas>=v;if(ok)btns.push({...b,act:()=>{CS.aposta=v;carSalvar()}});ctx.globalAlpha=ok?1:.4;
   card(b.x,b.y,b.w,b.h,CS.aposta===v,ok&&hit(b,mx,my));tx(`${v}`,x+75,606,30,'center','#fff');ctx.globalAlpha=1});
  tx(`1º leva ${CS.aposta*5} · 2º ${CS.aposta*2} · 3º devolve · do 4º para trás perde`,1210,654,20,'center','#cfe3f1')}
 const semGrana=MOCH_DEST.t==='treino'&&CS.moedas<(CS.aposta||CAR.aposta.op[0]);
 btn('LOJA',70,680,300,96,()=>{state='loja'},false,40);btn(semGrana?'SEM MOEDAS':MOCH_DEST.t==='livre'?'PEDALAR':MOCH_DEST.t==='treino'?`APOSTAR ${CS.aposta} E LARGAR`:'LARGAR',W/2-200,680,560,110,()=>{if(!semGrana)correr(MOCH_DEST.t,MOCH_DEST.km)},!semGrana,MOCH_DEST.t==='treino'?40:54)}
function drawPedalar(){fundo();tituloGrande('PEDALAR',84,66);btnVoltar('VOLTAR',toHub);moedasChip();
 const C=[{t:'PEDAL LIVRE',c:'#ffe27a',l:['Estrada sem fim, até quebrar',`Seu recorde: ${f1(CS.recLivre||0)} km`,'Itens, caminhão, furgão e moedas'],a:()=>irMochila('livre')},
  {t:'RACHÃO',c:'#7ee0ff',l:['30 · 50 · 80 · 100 km','Bata seus tempos e ganhe medalhas','Com a galera na estrada'],a:()=>{state='treino'}},
  {t:'CORRIDA',c:'#a8ffb4',l:[CS.camp?`${campDef(CS.camp.id).n.replace('VUELTA DE ','')} · etapa ${CS.camp.etapa+1}/5`:`Campeonatos de 5 etapas · ${pat().km} km`,'Vença a GERAL para subir de patente',`Patente: ${pat().n}`],a:()=>{state='camp'}}];
 C.forEach((c,i)=>{const w=440,h=470,x=W/2-w*1.5-30+i*(w+30),y=170,b={x,y,w,h},hv=hit(b,mx,my);btns.push({...b,act:c.a});card(x,y,w,h,i===0,hv);
  tx(c.t,x+w/2,y+110,50,'center',c.c);c.l.forEach((t,j)=>tx(t,x+w/2,y+200+j*52,j===0?26:22,'center',j===0?'#fff':'#cfe3f1'));
  if(i===0){rr(x+w/2-110,y+h-90,220,56,28);ctx.fillStyle='#ffcc00';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#0f1a3a';ctx.stroke();ctx.font=FT(900,28);ctx.fillStyle=MN.esc;ctx.textAlign='center';ctx.fillText('NOVO',x+w/2,y+h-50)}})}
function drawTreino(){fundo();tituloGrande('RACHÃO',84,66);btnVoltar('VOLTAR',()=>{state='pedalar'});moedasChip();
 [30,50,80,100].forEach((km,i)=>{const w=680,h=300,x=W/2-w-16+(i%2)*(w+32),y=130+Math.floor(i/2)*(h+30),ok=liberado(km),b={x,y,w,h},hv=ok&&hit(b,mx,my);
  if(ok)btns.push({...b,act:()=>irMochila('treino',km)});ctx.globalAlpha=ok?1:.45;card(x,y,w,h,false,hv);
  tx(`${km} KM`,x+40,y+80,64,'left',ok?'#fff':'#9fb0c0');
  const mp=(CS.melhorPos||{})[km];tx('Corrida clandestina com a galera · vale a colocação',x+40,y+126,20,'left','#cfe3f1');
  tx(mp?`Melhor colocação: ${mp}º`:'Ainda sem colocação',x+40,y+172,28,'left',mp===1?MN.verde:'#ffcc00');
  if(ok){tx(CS.rec[km]!=null?`Recorde: ${hms(CS.rec[km])}  (${f1(km*3600/CS.rec[km])} km/h)`:'Sem recorde ainda',x+40,y+220,26,'left','#ffe27a');
   tx(`${CAR.prova[km].climbs.length} subidas · ${CAR.prova[km].agua} águas · ${CAR.prova[km].gel} ${CAR.prova[km].gel>1?'géis':'gel'}`,x+40,y+262,20,'left','#cfe3f1')}
  else tx(`BLOQUEADO · libera em ${CAR.patentes[CAR.libera[km]].n}`,x+40,y+232,26,'left','#ff8a80');
  ctx.globalAlpha=1})}
function carOverlay(){const r=carRes,X=588,BW=360;if(CLASSIF&&r.classif){drawClassif(r);return}ctx.fillStyle='#06121cd6';ctx.fillRect(0,0,W,H);fimArte();
 let tit,col;
 if(r.aband){tit=r.tipo==='livre'?'PEDAL ENCERRADO':'VOCÊ ABANDONOU';col='#ffe27a'}
 else if(r.tipo==='livre'){tit=r.recorde?'NOVO RECORDE!':r.encerrou?'PEDAL ENCERRADO':'VOCÊ QUEBROU!';col=r.recorde?'#a8ffb4':r.encerrou?'#ffe27a':'#ffad9d'}
 else if(!won){tit='VOCÊ QUEBROU!';col='#ffad9d'}
 else if(r.tipo==='treino'&&!r.pos){tit=r.med>=0?`MEDALHA DE ${MEDN[r.med]}!`:'RACHÃO CONCLUÍDO';col=r.med>=0?MEDC[r.med]:'#a8ffb4'}
 else{tit=r.pos===1?'VOCÊ VENCEU A CORRIDA!':`${r.pos}º LUGAR`;col=r.pos===1?'#a8ffb4':r.pos<=3?'#ffe27a':'#fff'}
 tx(tit,W/2,140,60,'center',col);
 const avg=f1(elapsed>0?dist*3600/(elapsed*SCALE):0);
 tx(r.tipo==='livre'?`${f1(dist)} km em ${hms(r.t)}  ·  média ${avg} km/h`:won?`${r.km} km em ${hms(r.t)}  ·  média ${avg} km/h`:`${f1(dist)} de ${r.km} km  ·  média ${avg} km/h`,W/2,194,28,'center');
 let y=236;
 if(r.venc){tx(`Vencedor: ${r.venc}`,W/2,y,24,'center','#cfe3f1');y+=34}
 if(r.patPedal){tx(`PATENTE DO PEDAL: ${r.patPedal.n}  (×${String(r.patPedal.m).replace('.',',')})`,W/2,y,28,'center','#ffcc00');y+=36;if(r.vacKm>=.1){tx(`Vácuo: ${f1(r.vacKm)} km`,W/2,y,22,'center','#7ee0ff');y+=30}}
 if(r.aband){tx('Abandono: sem XP e −20% das moedas do pedal',W/2,y,22,'center','#ff8a80');y+=30}
 if(r.tipo==='livre'){tx(`Recorde: ${f1(CS.recLivre||0)} km  ·  itens: ${r.itens.agua} água · ${r.itens.banana} banana · ${r.itens.gel} gel`,W/2,y,24,'center','#cfe3f1');y+=34}
 if(r.tipo==='treino'&&won&&!r.pos&&r.med<2){const M=CAR.med[r.km];tx(`Próxima medalha: ${MEDN[r.med+1].toLowerCase()} a ${f1(M[r.med+1])} km/h de média`,W/2,y,22,'center','#cfe3f1');y+=34}
 y+=14;r.linhas.forEach(([s,n])=>{tx(s,W/2-220,y,25,'left','#fff');tx(`+${n} XP`,W/2+220,y,25,'right','#7ee0ff');y+=34});
 tx('TOTAL',W/2-220,y+4,28,'left','#7ee0ff');tx(`+${r.ganho} XP`,W/2+220,y+4,30,'right','#7ee0ff');y+=44;
 if(r.aposta){tx(`APOSTA ${r.aposta} → ${r.premio?'PRÊMIO '+r.premio:'perdeu'}`,W/2,y,26,'center',r.premio>r.aposta?MN.verde:r.premio?'#fff':'#ff8a80');y+=40}
 if(r.moedas>0){moedaIc(W/2-220,y-28,34);tx('MOEDAS',W/2-178,y,26,'left','#ffd23a');tx(`+${r.moedas}`,W/2+220,y,28,'right','#ffd23a');y+=42}
 if(r.niveis){tx(`NÍVEL ${CS.nivel}!  +${r.niveis} ponto${r.niveis>1?'s':''} de atributo`,W/2,y,30,'center','#ffe27a');y+=40}
 if(r.sobe){tx(`NOVA PATENTE: ${r.sobe}!`,W/2,y,32,'center','#a8ffb4');y+=40;if(r.libera.length){tx(`Treino de ${r.libera.join(', ')} km liberado!`,W/2,y,26,'center','#7ee0ff');y+=36}}
 const by=Math.max(y+10,570);btn('CARREIRA',X,by,BW,74,toHub,true,34);btn(r.tipo==='treino'?'RACHÃO DE NOVO':r.tipo==='livre'?'PEDALAR DE NOVO':r.camp?(r.camp.fim?'CAMPEONATOS':'PRÓXIMA ETAPA'):'CORRER DE NOVO',X,by+86,BW,60,
  r.camp?()=>{GERAL=false;if(r.camp.fim)state='camp';else irMochila('corrida')}:reset,false,26);   // campeonato: a próxima etapa passa pelo BOLSO
 if(r.classif)btn('CLASSIFICAÇÃO',W-30-330,24,330,64,()=>{CLASSIF=true},'share',28)}
