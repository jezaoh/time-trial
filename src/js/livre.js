/* ===== PEDAL LIVRE (dentro da Carreira) =====
   Estrada sem fim, estilo "Estrada dos Romeiros num sábado": subidas geradas aleatoriamente (cada vez mais duras),
   ciclistas aparecendo (lentos que você passa, fortes sozinhos, grupinhos de 2–5, de vez em quando um pelotão de 7).
   Na estrada:
   - TORCEDOR na beira da pista oferecendo água ("ÁGUA! ÁGUA!"): passou perto, +1 gole (até encher a garrafa).
   - CAMINHÃO DE BANANA: passa você e segue num ritmo que você faria sozinho a ~105% do FTP (no vácuo dele, 50% menos
     arrasto, ~70%). Não deixa você passar por ele (se você encosta, ele acompanha). Fique PERTO dele (atrás ou do lado)
     até a barra encher (5 s): pula uma banana, o ciclista brilha e ganha o bônus na hora.
   - FURGÃO DO RAIO: raro, 1 vez por pedalada num km sorteado entre 2 e 30. Passa rápido e derruba um ENERGÉTICO:
     pegou, stamina cheia + 4 s de gás.
   - MOEDAS em fileiras na pista.
   Itens do jogador (comprados na LOJA ou pegos na pista): água (5 goles, 7 com a garrafa de 700 ml), isotônico (garrafa
   de 5/7 goles: alivia a fadiga mais rápido e enche stamina), gel (−40% da fadiga), banana (−fadiga, +stamina),
   gel azul (zera a fadiga, máx. 1 por pedalada). O que sobrar volta para o inventário.
   A fadiga é o teto: quebrou, acabou. Placar = distância (recorde pessoal). XP 0,6/km + 20 por recorde; moedas 1/km + pista + 20 por recorde. */
const LIV={xpKm:.6,xpRec:20,moedaKm:.35,moedaVac:.2,moedaRec:20,
 bananaFad:6,bananaSta:40,isoFad:9,isoSta:12,isoSeg:1.5,isoGas:0,energGas:4,gasSta:12,   // isotônico: gole de água (−8) um pouco melhor (−9 e +12 de stamina, sem gás)
 gelRende:[1,.75,.55,.4],                // 1º gel −40% da fadiga, 2º −30%, 3º −22%, depois −16%   // gás: +12 de stamina por segundo
 vacVeic:.5,vacSeg:5,caminhaoRitmo:1.05,caminhaoTempo:16,furgaoExtra:26,
 // 16/11 — RACHÃO e CORRIDA (não no Pedal Livre): cada item COMPRADO rende menos que o anterior (iso, banana, gel).
 //   A água básica (bolso e torcedor), o gel azul e o energético ficam de fora. Vale igual para os NPCs (ciclistas.js).
 rende:[1,1,1,.9,.8,.72,.65,.58,.52,.47,.43,.4],
};
// fator do PRÓXIMO item (e conta o uso). Fora do Rachão/Corrida = 1 sempre.
function rendeVale(){return!!(LV&&MODO==='carreira'&&!LV.livre&&(carTipo==='treino'||carTipo==='corrida'))}
function rendeItem(){if(!rendeVale())return 1;const n=LV.nIt||0;LV.nIt=n+1;const k=LIV.rende[Math.min(n,LIV.rende.length-1)];if(k<1)fx(`RENDEU ${Math.round(k*100)}%`,'#cfd8e1');return k}
let LV=null;
const rnd=(a,b)=>a+Math.random()*(b-a);
function sorteio(L){let r=Math.random(),acc=0;for(const o of L){acc+=o.p;if(r<=acc)return o}return L[L.length-1]}
const pxCen=()=>9*3600/SCALE;            // px por km do CENÁRIO (o que está parado na pista anda junto com o chão)
const isoCap=()=>5,MOCH={banana:5,gel:3};   // limite que cabe no bolso por pedalada
// Kit: água básica (5 goles, grátis) + até 3 itens escolhidos na MOCHILA (isotônico, banana, gel, água 700 ml).
// Garrafas (isotônico, água 700 ml) são gastas ao levar; bananas e géis voltam pro estoque se sobrarem. Gel azul: separado (1 por pedalada).
const REGRA_CORRIDA=['iso','gel'];   // corrida oficial: só água (sempre), isotônico e gel
function livreNovo(livre){const I=CS.inv,corr=carTipo==='corrida',M=(CS.mochila||[]).filter(k=>!corr||REGRA_CORRIDA.includes(k)),tem=k=>M.includes(k)&&(I[k]||0)>0;
 const lev={iso:tem('iso'),agua7:false,   // água 700 ml fora do jogo desde 16/11 (só 500 ml)
banana:tem('banana')?Math.min(I.banana,MOCH.banana):0,gel:tem('gel')?Math.min(I.gel,MOCH.gel):0};
 if(lev.iso)I.iso--;if(lev.agua7)I.agua7--;I.banana-=lev.banana;I.gel-=lev.gel;carSalvar();
 LV={vacKm:0,proxSubida:rnd(2.5,4),proxEnc:rnd(.8,1.6),proxTorc:rnd(3,5),proxMoeda:rnd(.5,1.2),proxCaminhao:rnd(6,12),furgaoKm:rnd(1,30),furgaoJan:0,pulos:[],
  veic:null,vid:0,rec:[],vacV:0,itens:[],torcs:[],fx:[],encerrou:false,pegos:{agua:0,banana:0,gel:0,moeda:0,energetico:0},gas:0,brilho:0,pulo:null,
  iso:lev.iso?5:0,isoLev:lev.iso,agua7:lev.agua7?7:0,a7Lev:lev.agua7,isoUsou:false,isoT:0,isoResta:0,banana:lev.banana,bLev:lev.banana>0,gLev:lev.gel>0,azul:corr?0:Math.min(1,I.azul||0),azulUsou:false,geis:0};
 gel=lev.gel;LV.livre=livre;LV.eventos=livre||carTipo==='treino';if(livre){climbs=[];rampas=[];gerarSubidas();ciclInicio()}}
// o que sobrou na mochila volta pro estoque (bananas, géis); gel azul usado sai do estoque
// 17/11 (dono): o que não foi usado nunca se perde — volta também ao REINICIAR ou SAIR no meio; isotônico intacto (5 goles) volta inteiro
function devolverItens(){if(!LV)return;CS.inv.gel=(CS.inv.gel||0)+gel;CS.inv.banana=(CS.inv.banana||0)+LV.banana;if(LV.isoLev&&LV.iso>=isoCap()){CS.inv.iso=(CS.inv.iso||0)+1;LV.iso=0;LV.isoLev=false}if(LV.azulUsou)CS.inv.azul=Math.max(0,(CS.inv.azul||0)-1);gel=0;LV.banana=0;LV.azulUsou=false}
// subidas: começam suaves e vão ficando mais longas e íngremes conforme a distância
// relevo variado (rampas {a,b,g}): subida curta e forte, subida longa, duas elevações seguidas, descida em degraus.
// Vai ficando mais duro com a distância (f). Cada trecho volta a 0% suavemente nas pontas.
function gerarSubidas(){while(LV.proxSubida<dist+16){let d=LV.proxSubida;const f=Math.min(1,d/100),r=Math.random();
  const ramp=(len,g)=>{rampas.push({a:d,b:d+len,g:+g.toFixed(1)});d+=len},plano=len=>{d+=len};
  if(r<.3){const len=rnd(.5,1);ramp(len,rnd(6,9)+f*4);plano(rnd(.1,.3));ramp(len*rnd(.8,1.3),-rnd(5,7))}                       // curta e forte
  else if(r<.55){const len=rnd(2,3.2)+f*2;ramp(len,rnd(3.5,5.5)+f*1.5);plano(rnd(.2,.5));ramp(len*rnd(.6,.9),-rnd(4,6))}        // longa
  else if(r<.8){const g=rnd(4.5,6.5)+f*1.5;ramp(rnd(.7,1.2),g);ramp(rnd(.3,.5),-rnd(2,4));plano(rnd(.15,.3));ramp(rnd(.7,1.2),g+rnd(0,1.5));plano(.2);ramp(rnd(1.2,1.8),-rnd(5,6))} // duas elevações
  else if(r<.9){ramp(rnd(1.2,2),rnd(4,6)+f);plano(rnd(.2,.4));ramp(rnd(.5,.8),-rnd(5,7));plano(rnd(.4,.7));ramp(rnd(.5,.8),-rnd(5,7))}  // descida em degraus
  else{ramp(rnd(.3,.6),rnd(10,13)+f*5);plano(rnd(.1,.2));ramp(rnd(2,3.5),-rnd(7,9.5))}                                            // muro (até 18%) e descida longa e rápida
  LV.proxSubida=d+rnd(1.2,3.5)*(1-f*.5)}}
const noChao=x=>dist+(x-bikeX)/pxCen();   // posição na pista (km) de um ponto da tela
function fx(s,cor){LV.fx.push({s,cor,t:0})}
// ---------- veículos ----------
const VEIC={caminhao:{img:'v_caminhao',w:760},furgao:{img:'v_furgao',w:720}};
function veicNovo(tipo){const V=VEIC[tipo];LV.veic={id:++LV.vid,tipo,rear:dist+(WX0-bikeX-V.w-40)/PX_KM,v:speed/3.6+(tipo==='furgao'?LIV.furgaoExtra:16)/3.6,fase:'passa',t:0,cheio:0,solto:false,gr:terrain(dist)};
 if(tipo==='caminhao')tocar('buzina',1)}
function veicPasso(dt){const c=LV.veic;if(!c){LV.vacV=0;return}
 const rx=bikeX+(c.rear-dist)*PX_KM;c.gr=lerp(c.gr,terrain(c.rear),Math.min(1,dt*1.4));
 if(c.tipo==='caminhao'){
  const vT=npcVeq(FTP*LIV.caminhaoRitmo,grade);   // usa a rampa onde VOCÊ está (ele está do seu lado; senão some na descida enquanto você ainda sobe)
  if(c.fase==='passa'){c.v=Math.max(vT,speed/3.6+16/3.6);if(rx>bikeX+170)c.fase='segue'}
  else if(c.fase==='segue'){const g=rx-(bikeX+150);
   // não deixa o jogador passar: se ele encosta (subida, sprint), o caminhão acompanha
   c.v=g<40?Math.max(vT,speed/3.6+1.5/3.6):lerp(c.v,vT,Math.min(1,dt*1.5));c.t+=dt;
   c.perto=g>-420&&g<330;   // atrás dele ou do lado
   if(c.perto)c.cheio+=dt/LIV.vacSeg;else c.cheio=Math.max(0,c.cheio-dt/14);
   if(c.cheio>=1){c.fase='vai';LV.pulo={t:0,x0:rx+120,y0:roadY-260-alturaEm(rx+120)}}
   else if(c.t>LIV.caminhaoTempo){c.fase='vai'}}
  else c.v+=2.5*dt}
 else{ // furgão: passa rápido e derruba um energético à sua frente
  if(!c.solto&&rx>bikeX+460){c.solto=true;LV.pulos.push({t:0,x0:rx+40,y0:roadY-230-alturaEm(rx+40),land:noChao(bikeX+620)})}}
 c.rear+=c.v*3.6*dt/3600*SCALE;
 // vácuo: logo atrás da traseira do veículo (50% menos arrasto)
 const g=bikeX+(c.rear-dist)*PX_KM-(bikeX+150);LV.vacV=c.fase==='vai'&&c.tipo==='caminhao'?0:curva([[-60,0],[0,1],[230,1],[470,0]],g)*LIV.vacVeic;
 if(rx>WX1+120&&(c.fase==='vai'||c.tipo==='furgao'))LV.veic=null}
function vacExtra(){return LV&&state==='run'?LV.vacV:0}
// ---------- passo do Pedal Livre ----------
function livrePasso(dt){if(LV.livre){gerarSubidas();ciclPopular()}
 if(LV.eventos){
 if(!LV.veic&&dist>=LV.proxCaminhao){veicNovo('caminhao');LV.proxCaminhao=dist+rnd(25,40)}
 if(!LV.veic&&dist>=LV.furgaoKm){veicNovo('furgao');LV.furgaoJan++;LV.furgaoKm=Math.max(dist+5,rnd(30*LV.furgaoJan,30*LV.furgaoJan+30))}
 veicPasso(dt);
 if(dist>=LV.proxTorc){LV.torcs.push({dist:noChao(WX1+120),ok:false,fase:Math.random()*6});recNovo('agua',noChao(WX1+120));LV.proxTorc=dist+rnd(9,15)*(1+dist/30)}
 if(LV.livre&&dist>=LV.proxMoeda){const n=3+Math.floor(Math.random()*2);for(let k=0;k<n;k++)LV.itens.push({t:'moeda',dist:noChao(WX1+80+k*150)});LV.proxMoeda=dist+rnd(6,10)}
 // pegar: passou por cima (itens) ou perto (torcedor)
 for(const it of LV.itens){const x=bikeX+(it.dist-dist)*pxCen();if(!it.ok&&x<bikeX+120&&x>bikeX-60){it.ok=true;pegar(it.t)}}
 LV.itens=LV.itens.filter(it=>!it.ok&&bikeX+(it.dist-dist)*pxCen()>-100);
 // torcedor: garrafa com espaço = +1 gole; garrafa cheia = você bebe ali mesmo (efeito de um gole na hora)
 for(const o of LV.torcs){const x=bikeX+(o.dist-dist)*pxCen();if(!o.ok&&x<bikeX+130&&x>bikeX-50){o.ok=true;tocar('bonus');LV.pegos.agua++;
  if(water<AJ.aguaQtd){water++;efeito('bonus',.8);fx('+1 GOLE DE ÁGUA','#7ee0ff')}
  else{aguaResta+=AJ.aguaFad;waterEffect+=AJ.aguaSeg;efeito('agua',1.6);fx('ÁGUA DO TORCEDOR! −FADIGA','#7ee0ff')}}}
 LV.torcs=LV.torcs.filter(o=>bikeX+(o.dist-dist)*pxCen()>-200);LV.rec=LV.rec.filter(it=>it.dist>dist-25)}
 // efeitos com duração: isotônico
 if(LV.isoT>0)LV.isoT-=dt;
 if(LV.isoResta>0){const d=Math.min(LV.isoResta,LIV.isoFad/LIV.isoSeg*dt);fatigue=Math.max(0,fatigue-d);LV.isoResta-=d}
 // gás (isotônico / energético): stamina sobe sozinha por alguns segundos; brilho do ciclista
 if(LV.gas>0){LV.gas-=dt;stamina=Math.min(100-fatigue,stamina+LIV.gasSta*dt)}
 if(LV.brilho>0)LV.brilho-=dt;
 // banana que pula do caminhão até o ciclista
 if(LV.pulo){LV.pulo.t+=dt;if(LV.pulo.t>=.7){LV.pulo=null;LV.pegos.banana++;LV.banana++;efeito('bonus',1);fx('+1 BANANA NO BOLSO!','#ffe27a')}}
 // gel que pula do furgão e cai no asfalto à frente
 for(const p of LV.pulos){p.t+=dt;if(p.t>=.8){p.ok=true;LV.itens.push({t:'gel',dist:p.land});recNovo('gel',p.land)}}LV.pulos=LV.pulos.filter(p=>!p.ok);
 for(const f of LV.fx)f.t+=dt;LV.fx=LV.fx.filter(f=>f.t<1.4)}
function pegar(t){LV.pegos[t]++;
 if(t==='moeda'){fx('+1','#ffd23a');tocar('moeda',.8)}
 else if(t==='gel'){gel++;tocar('bonus');efeito('bonus',.8);fx('+1 GEL','#ffb36b')}
 else if(t==='energetico'){stamina=100-fatigue;LV.gas=LIV.energGas;efeito('energ',LIV.energGas);tocar('bonus');fx('ENERGÉTICO! GÁS!','#ffd23a')}
 else if(t==='banana'){LV.banana++;fx('+1 BANANA','#ffe27a')}}
// ---------- usar itens ----------
function tomarIso(){if(!LV||state!=='run'||LV.iso<=0||LV.isoT>0)return;LV.iso--;LV.isoUsou=true;LV.isoT=LIV.isoSeg;const k=rendeItem();LV.isoResta=LIV.isoFad*k;
 stamina=Math.min(100-fatigue,stamina+LIV.isoSta*k);if(LIV.isoGas)LV.gas=Math.max(LV.gas,LIV.isoGas);efeito('iso',2);fx('ISOTÔNICO','#a8ff5a')}
function beber700(){if(!LV||state!=='run'||LV.agua7<=0||waterEffect>0)return;LV.agua7--;waterEffect=AJ.aguaSeg;aguaResta=AJ.aguaFad;efeito('agua',1.6)}
function comerBanana(){if(!LV||state!=='run'||LV.banana<=0)return;LV.banana--;const k=rendeItem();fatigue=Math.max(0,fatigue-LIV.bananaFad*k);stamina=Math.min(100-fatigue,stamina+LIV.bananaSta*k);efeito('banana',1.6);fx('BANANA! −FADIGA','#ffe27a')}
function gelAzul(){if(!LV||state!=='run'||LV.azul<=0||LV.azulUsou)return;LV.azul--;LV.azulUsou=true;fatigue=0;stamina=100;efeito('azul',2.5);fx('GEL AZUL: VIDA EXTRA!','#7ee0ff')}
// ---------- fim: placar, XP, moedas e o que sobrou volta para o inventário ----------
// patente do pedal pela média (absoluta, como no mundo real): multiplica XP e moedas da distância e do vácuo
const PAT_PEDAL=[{n:'CICLOTURISTA',v:0,m:1,mm:1},{n:'PEDAL DE DOMINGO',v:24,m:1.2,mm:1.1},{n:'RITMO DE GRUPO',v:27,m:1.4,mm:1.2},{n:'TREINO FORTE',v:30,m:1.7,mm:1.35},{n:'ELITE',v:33,m:2,mm:1.5},{n:'PRO',v:36,m:2.5,mm:1.6}];   // m: XP · mm: moedas
function patPedal(avg){let p=PAT_PEDAL[0];for(const q of PAT_PEDAL)if(avg>=q.v)p=q;return p}
function moedasPedal(){if(!LV)return 0;const avg=elapsed>0?dist*3600/(elapsed*SCALE):0,m=patPedal(avg).mm;return Math.floor((Math.max(0,dist)*LIV.moedaKm+LV.vacKm*LIV.moedaVac)*m)+LV.pegos.moeda}
function livreFim(r,add){CS.livres=(CS.livres||0)+1;const rec=CS.recLivre||0,avg=elapsed>0?dist*3600/(elapsed*SCALE):0,P=patPedal(avg);r.patPedal=P;r.vacKm=LV.vacKm;
 if(LV.encerrou){r.moedas+=Math.floor(moedasPedal()*.8);r.aband=true}
 else{add(dist*LIV.xpKm*P.m,`${f1(dist)} km · ${P.n} ×${String(P.m).replace('.',',')}`);if(LV.vacKm>=.5)add(LV.vacKm*.5*P.m,`${f1(LV.vacKm)} km no vácuo`);
  r.moedas+=moedasPedal();
  if(dist>rec&&dist>.5){add(LIV.xpRec,rec?'novo recorde pessoal':'primeiro recorde');r.moedas+=LIV.moedaRec;CS.recLivre=+dist.toFixed(2);r.recorde=true}}
 devolverItens();
 r.encerrou=LV.encerrou;r.itens={...LV.pegos}}
const _livReset=reset;
reset=function(){if(LV&&MODO==='carreira'){devolverItens();carSalvar()}_livReset();LV=null;if(MODO==='carreira'){livreNovo(carTipo==='livre');PERFIL=null;
  // Rachão = aposta: paga ao largar (reiniciar = nova largada, nova aposta; a anterior fica perdida)
  if(carTipo==='treino'){const ap=CS.aposta||CAR.aposta.op[0];LV.aposta=CS.moedas>=ap?ap:0;CS.moedas-=LV.aposta;carSalvar()}}};
const _livUpdate=update;
update=function(dt){_livUpdate(dt);if(LV&&state==='run')livrePasso(dt)};
// ---------- desenho ----------
// itens na pista (banana, gel, moeda) com brilho
function itemArte(t,x,y){const p=.5+.5*Math.sin(T*6);ctx.save();
 if(t==='moeda'){const s=84;moedaIc(x-s/2,y-30-s/2+Math.sin(T*4+x*.02)*3,s);ctx.restore();return}
 ctx.globalAlpha=.25+.2*p;ctx.beginPath();ctx.ellipse(x,y+4,46,16,0,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.globalAlpha=1;
 if(t==='gel'){const nb=NUT[6],s=120/nb[3];ctx.drawImage(IMG.nutr,nb[0],nb[1],nb[2],nb[3],x-nb[2]*s/2,y-120,nb[2]*s,120)}
 else if(t==='energetico')latinha(x,y-38,1)
 else{const im=IMG.it_banana,h=62,w=im.width*h/im.height;ctx.drawImage(im,x-w/2,y-h,w,h)}
 ctx.restore()}
// energético (provisório, até ter a ilustração): latinha preta com raio amarelo
function latinha(cx,cy,k){ctx.save();ctx.translate(cx,cy);ctx.scale(k,k);const w=40,h=70;
 rr(-w/2,-h/2,w,h,9);ctx.fillStyle='#14161c';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#0a0b0e';ctx.stroke();
 ctx.fillStyle='#c9ced6';ctx.fillRect(-w/2+3,-h/2+3,w-6,7);ctx.fillRect(-w/2+3,h/2-10,w-6,7);
 ctx.beginPath();ctx.moveTo(4,-22);ctx.lineTo(-10,4);ctx.lineTo(0,4);ctx.lineTo(-5,24);ctx.lineTo(11,-4);ctx.lineTo(1,-4);ctx.closePath();ctx.fillStyle='#ffd23a';ctx.fill();ctx.restore()}
function torcedorArte(o,x){const im=IMG.torcedor,h=300,w=im.width*h/im.height,pe=roadY-46-alturaEm(x),bal=Math.sin(T*7+o.fase);
 ctx.save();ctx.translate(x,pe);ctx.rotate(bal*.04);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore();
 if(!o.ok)balaoDesenhar(x+10,pe-h-30+Math.sin(T*5+o.fase)*4,'ÁGUA! ÁGUA!')}   // mesmo balão dos ciclistas (ciclistas.js)
function veicArte(){const c=LV.veic;if(!c)return;const V=VEIC[c.tipo],im=IMG[V.img],x=bikeX+(c.rear-dist)*PX_KM,h=V.w*im.height/im.width,s=segEm(x+V.w/2),ey=s.e+s.m*(x+V.w/2-s.xa);
 if(x>WX1+40||x+V.w<WX0-40)return;ctx.save();ctx.translate(x+V.w/2,roadY+10-ey);ctx.rotate(-Math.atan(s.m));ctx.drawImage(im,-V.w/2,-h,V.w,h);ctx.restore();
 if(c.tipo==='caminhao'&&c.fase==='segue'){const bx=x+V.w/2-150,by=roadY-ey-h-70;rr(bx,by,300,50,25);ctx.fillStyle='#0a1a2ce0';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=c.perto?'#ffe27a':'#7f93a6';ctx.stroke();
  const im2=IMG.it_banana;ctx.drawImage(im2,bx+10,by+6,38,38*im2.height/im2.width);rr(bx+58,by+16,226,18,9);ctx.fillStyle='#1c3550';ctx.fill();
  if(c.cheio>0){rr(bx+58,by+16,Math.max(18,226*Math.min(1,c.cheio)),18,9);ctx.fillStyle='#ffe27a';ctx.fill()}}}
const _livDes=npcDesenhar;
// brilho atrás do ciclista (bônus da banana do caminhão, isotônico, energético)
function brilhoArte(){if(EFX.t<=0)return;const a=clamp(EFX.t,0,1)*(.8+.2*Math.sin(T*14)),cx=bikeX+10,cy=roadY-170-EYB,[R,G,B]=EFX.cor;
 ctx.save();ctx.globalCompositeOperation='lighter';
 const g=ctx.createRadialGradient(cx,cy,20,cx,cy,250);g.addColorStop(0,`rgba(${R},${G},${B},${.95*a})`);g.addColorStop(.55,`rgba(${R},${G},${B},${.5*a})`);g.addColorStop(1,`rgba(${R},${G},${B},0)`);
 ctx.fillStyle=g;ctx.fillRect(cx-260,cy-260,520,520);ctx.restore()}
// faíscas por cima do ciclista
function faiscas(){if(EFX.t<=0)return;const a=clamp(EFX.t,0,1);ctx.save();mundoT();ctx.globalAlpha=a;ctx.fillStyle=`rgb(${EFX.cor.map(v=>Math.min(255,v+90)).join(',')})`;
 for(let i=0;i<9;i++){const ang=i*.7+T*2.2,r=150+30*Math.sin(T*5+i),x=bikeX+10+Math.cos(ang)*r,y=roadY-170-EYB+Math.sin(ang)*r*.9,s=7+4*Math.sin(T*9+i);
  ctx.beginPath();ctx.moveTo(x,y-s*2);ctx.lineTo(x+s*.5,y-s*.5);ctx.lineTo(x+s*2,y);ctx.lineTo(x+s*.5,y+s*.5);ctx.lineTo(x,y+s*2);ctx.lineTo(x-s*.5,y+s*.5);ctx.lineTo(x-s*2,y);ctx.lineTo(x-s*.5,y-s*.5);ctx.closePath();ctx.fill()}
 ctx.restore()}
npcDesenhar=function(){if(!LV){_livDes();brilhoArte();return}
 for(const o of LV.torcs){const x=bikeX+(o.dist-dist)*pxCen();if(x>WX0-160&&x<WX1+160)torcedorArte(o,x)}
 _livDes();veicArte();
 for(const it of LV.itens){const x=bikeX+(it.dist-dist)*pxCen();if(x>WX0-80&&x<WX1+80)itemArte(it.t,x,roadY+34-alturaEm(x))}
 for(const p of LV.pulos){const f=Math.min(1,p.t/.8),xl=bikeX+(p.land-dist)*pxCen(),yl=roadY-30-alturaEm(xl),x=lerp(p.x0,xl,f),y=lerp(p.y0,yl,f)-Math.sin(f*Math.PI)*200,nb=NUT[6],h=110;
  ctx.save();ctx.translate(x,y);ctx.rotate(f*7);ctx.drawImage(IMG.nutr,nb[0],nb[1],nb[2],nb[3],-nb[2]*h/nb[3]/2,-h/2,nb[2]*h/nb[3],h);ctx.restore()}
 if(LV.pulo){const p=LV.pulo,f=p.t/.7,x=lerp(p.x0,bikeX+20,f),y=lerp(p.y0,roadY-200-EYB,f)-Math.sin(f*Math.PI)*180,im=IMG.it_banana,h=70;
  ctx.save();ctx.translate(x,y);ctx.rotate(f*6);ctx.drawImage(im,-h*im.width/im.height/2,-h/2,h*im.width/im.height,h);ctx.restore()}
 brilhoArte()};
// HUD: isotônico, banana e gel azul ao lado da água e do gel (+ textos que sobem ao pegar/usar)
// acima do botão do raio, no canto direito (o canto esquerdo de baixo já tem água e gel)
const SLOT={iso:{x:1190,y:536},banana:{x:1301,y:536},azul:{x:1412,y:536}};
function slotHud(){const s=130/240;
 const ni=NUT[clamp(Math.round(5-LV.iso/isoCap()*5),0,5)];ctx.globalAlpha=LV.iso?1:.3;ctx.drawImage(IMG.iso,ni[0],ni[1],ni[2],ni[3],SLOT.iso.x+2,SLOT.iso.y+12,ni[2]*s,ni[3]*s);ctx.globalAlpha=1;badge(SLOT.iso.x+60,SLOT.iso.y+12,LV.iso);
 const b=IMG.it_banana,bh=96;ctx.globalAlpha=LV.banana?1:.3;ctx.drawImage(b,SLOT.banana.x,SLOT.banana.y+30,bh*b.width/b.height,bh);ctx.globalAlpha=1;badge(SLOT.banana.x+60,SLOT.banana.y+12,LV.banana);
 const a=IMG.it_gelazul,ah=110;ctx.globalAlpha=LV.azul&&!LV.azulUsou?1:.3;ctx.drawImage(a,SLOT.azul.x+14,SLOT.azul.y+22,ah*a.width/a.height,ah);ctx.globalAlpha=1;badge(SLOT.azul.x+60,SLOT.azul.y+12,LV.azulUsou?0:Math.min(1,LV.azul))}
const _livHud=npcHud;
npcHud=function(){_livHud();if(state==='run'||state==='paused')faiscas();if(!LV)return;
 LV.fx.forEach((f,i)=>{ctx.globalAlpha=clamp(1.4-f.t,0,1);tx(f.s,BXS,390-EYB*ZOOM-f.t*60-i*6,30,'center',f.cor);ctx.globalAlpha=1})};
// pausa: encerrar o pedal e guardar a distância
const _livOv=overlay;
overlay=function(){_livOv();if(LV&&state==='paused')btn(LV.livre?'ENCERRAR (−20%, SEM XP)':carTipo==='corrida'&&CS.camp?'ABANDONAR ETAPA (PENALIDADE)':'ABANDONAR (−20%, SEM XP)',588,770,360,56,()=>{LV.encerrou=true;state='run';finish(false)},false,20)};
// botões de toque e teclas (I = isotônico, B = banana, Z = gel azul)
(function(){const st=$('stage');if(!st)return;[['iso',77.5,tomarIso],['banana',84.7,comerBanana],['azul',91.9,gelAzul],['agua7',70,beber700]].forEach(([id,l,fn])=>{const b=document.createElement('button');
  b.id='b_'+id;b.setAttribute('aria-label',id);b.style.cssText=`position:absolute;left:${l}%;top:62%;width:6.4%;height:17%;background:transparent;border:0;display:none;touch-action:none`;st.appendChild(b);hold('b_'+id,fn,()=>{})})})();
let livVis='';
const _livTick=audioTick;
audioTick=function(dt){_livTick(dt);
  if(!AC)return;const t=AC.currentTime;for(const k of['caminhao','furgao']){if(!LP[k])continue;let g=0;
  if(LV&&LV.veic&&LV.veic.tipo===k&&(state==='run')){const V=VEIC[k],cx=bikeX+(LV.veic.rear-dist)*PX_KM+V.w/2;g=k==='furgao'?clamp(1-Math.abs(cx-bikeX)/2800,0,1)*1.9:clamp(1-Math.abs(cx-bikeX)/1500,0,1)*.9}
  LP[k].g.gain.setTargetAtTime(g,t,.15)}};
addEventListener('keydown',e=>{if(!LV||state!=='run'||e.repeat)return;if(e.code==='KeyA'&&water<=0)beber700();if(e.code==='KeyI')tomarIso();if(e.code==='KeyB')comerBanana();if(e.code==='KeyZ')gelAzul()});

// gel: cada um rende menos que o anterior na mesma pedalada (só na Carreira; o contrarrelógio fica como era)
// 16/11: no Rachão/Corrida o gel também entra na fila de itens (vale o MENOR dos dois fatores: o do gel e o da fila)
const _livEat=eat;eat=function(){if(!LV||MODO!=='carreira'){_livEat();return}if(state!=='run'||gel<=0)return;const k=Math.min(LIV.gelRende[Math.min(LV.geis,LIV.gelRende.length-1)],rendeItem());gel--;LV.geis++;fatigue=fatigue*(1-AJ.gelFrac*k)};
// pedal longo: depois de 2 h de pedal a resistência cansa um pouco mais (+15% por hora, até +45%)
const _livLongo=update;update=function(dt){_livLongo(dt);if(MODO==='carreira'&&state==='run'&&LV){const h=elapsed*SCALE/3600-2;if(h>0)fatigue=Math.min(100,fatigue+AJ.fadResist*.15*Math.min(3,h)*dt)}};
