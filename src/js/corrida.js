/* ===== Corrida da Carreira: largada em massa com 14 ciclistas + você =====
   Cada ciclista tem perfil (escalador, sprinter, rolador, fraco), FTP, peso, RESERVA (esforço acima do FTP)
   e DESGASTE (vai baixando o FTP efetivo ao longo da prova). Regras de cada um, a cada quadro:
   - segue a roda de quem está logo à frente (inclusive você), com vácuo de quem está até ~600 px à frente;
   - quem está na frente (sem ninguém perto) dita o ritmo a ~78% do próprio FTP;
   - se para seguir precisa de mais do que aguenta, fica para trás (é assim que o grupo se parte nas subidas);
   - eventos: fuga de um rolador no 1º terço; escaladores atacam na subida final; todo mundo sprinta no último km.
   Física igual à do jogador (mesma resistência e vácuo). Posições na tela: npc.js (PX_KM, faixas lane 0–2). */
const CORR={on:false,riders:[],fugaKm:0,
 tipos:{escalador:{m:61,ftp:.97,pico:1.55,end:1},sprinter:{m:77,ftp:.95,pico:2.6,end:.92},
        rolador:{m:73,ftp:1.05,pico:1.7,end:1.12},fraco:{m:72,ftp:.86,pico:1.5,end:.85}},
 grade:['escalador','escalador','escalador','sprinter','sprinter','sprinter','rolador','rolador','rolador','rolador','fraco','fraco','fraco','fraco'],   // 14 + você = 15
 espaco:72,          // px entre um ciclista e o da frente quando seguem roda
 ritmo:.86,          // quem está na frente puxa a ~86% do FTP médio do grupo (limitado ao que ele aguenta)
 vac:.30,
 // ---- 16/11: NPCs mais espertos (Rachão e Corrida). Eles NÃO leem a sua stamina/fadiga: só veem posição e velocidade ----
 // bolso: as MESMAS regras do jogador (água 5 goles + até 3 itens; iso 5 goles; gel até 3; banana só no Rachão).
 //   Uns vêm completos (têm dinheiro), outros com o básico.
 prep:[['completo',.35],['medio',.4],['basico',.25]],
 bolso:{completo:{agua:5,iso:5,gel:3,banana:3},medio:{agua:5,iso:5,gel:1,banana:0},basico:{agua:5,iso:0,gel:0,banana:0}},
 // personalidade: agressivo ataca no meio e no final · calculista guarda para o final · rodador quase não ataca
 atqFinal:{agressivo:.65,calculista:.55,rodador:.15},atqFinalKm:[3,5],   // chance de atacar entre 5 e 3 km do fim
 atqTopo:.3,         // chance (× vontade de atacar) de atacar ao passar o topo de uma subida
 atqMax:2,           // ataques por ciclista por prova
 kmPlano:1.5,        // itens com plano: 1,5 km antes da última subida (se ela estiver no fim) ou a 4 km da chegada
 // reagir ao seu ataque: até 2 dos mais fortes e descansados vão atrás; o grupo só caça forte se você abrir muito
 marcaGap:220,marcaN:2,marcaPausa:25,perseguirPerto:1500,
 // sprint: o tempo é comprimido (800 m ≈ 2 s reais) e a bike leva ~2 s para embalar: o sprinter arranca a 800 m, com o pico
 //   alto dele; os outros entre 900 e 400 m (antes: todos a 1,1 km → o rolador ganhava as etapas planas)
 sprintSprinter:.8,sprintOutros:[.4,.9],
 sobeKm:4,sobeFila:1,    // posicionamento: a partir de 4 km do fim o sprinter sobe até ser o 2º da fila
 // 16/11 — RACHÃO = DOPING LIBERADO (decisão do dono): todos levam bolso cheio + gel azul e já saem num ritmo que conta com os
 //   itens (npcReserva em ciclistas.js). Os itens rendem cada vez menos (LIV.rende), igual ao jogador. Corrida oficial: não.
 dope:{agua:5,iso:5,gel:3,banana:5,azul:1},
 dopePlano:.8,       // quanto da fadiga que os itens vão tirar o NPC já "gasta" no ritmo desde o começo (1 = tudo)
 dopeAzul:60,        // valor do gel azul no plano (fadiga) · usa quando a fadiga passa de dopeAzulFad
 dopeAzulFad:76,
 dopeFtp:1.2,        // o "doping": FTP efetivo ×1,2 durante o Rachão (o jogador com itens segura ~125% do FTP)
 dopeTeto:1.08,      // teto do ritmo do dopado (× FTP dopado; normal .98)
 dopeRitmo:1.0};     // quem puxa o grupo dopado vai a até 100% do FTP médio (dopado) do grupo (normal: ritmo .86)
// bolso e personalidade de um ciclista da corrida (prep: o que ele levou; no campeonato fica salvo na ficha)
function corridaSortPrep(){let x=Math.random();for(const[n,p]of CORR.prep){if(x<p)return n;x-=p}return'medio'}
function corridaTatica(r,prep){const B=CORR.bolso[prep]||CORR.bolso.medio,clan=carTipo!=='corrida';
 r.prep=prep;r.inv={agua:B.agua,iso:B.iso,gel:B.gel,banana:clan?B.banana:0};r.aguaMax=5;
 r.perso=r.agr>.62?'agressivo':Math.random()<.55?'calculista':'rodador';
 r.kmAtq=r.tipo!=='sprinter'&&Math.random()<CORR.atqFinal[r.perso]?GOAL-rnd(...CORR.atqFinalKm):0;
 r.kmSpr=GOAL-(r.tipo==='sprinter'?CORR.sprintSprinter:rnd(...CORR.sprintOutros));r.nAtq=0}
function corridaIniciar(forca,arcos=true,G){CORR.on=true;CORR.arcos=arcos;CORR.riders=[];
 // campeonato: os mesmos 14 rivais em todas as etapas (G = ficha salva na inscrição, campeonato.js); a ordem na largada muda
 if(G){const ord=G.map((g,i)=>i).sort(()=>Math.random()-.5);
  ord.forEach((gi,i)=>{const g=G[gi],pos=(i<7?(i+1):-(i-6))*CORR.espaco*.5;
   const r=ciclNovo({tipo:g.tipo,nivel:'corrida',nome:g.nome,gr:g.gr,ftp:g.ftp,m:g.m,end:g.end,Fend:g.Fend,dist:pos/PX_KM,v:speed/3.6,lane:i%3,f:FS[i%3],k:g.k,agua:3,gel:GOAL>=50?1:0,iso:5});
   r.pico=g.pico;r.visto=true;r.cid=gi;corridaTatica(r,g.prep||corridaSortPrep());CORR.riders.push(r);NPCS.push(r)});
  CORR.fugaKm=GOAL*(.18+Math.random()*.14);CORR.fugas=0;corridaPlano();return}
 const L=CORR.grade.slice().sort(()=>Math.random()-.5),us=new Set();
 L.forEach((t,i)=>{const T=CORR.tipos[t],pos=(i<7?(i+1):-(i-6))*CORR.espaco*.5,nm=nomeNovo(us);   // metade à frente, metade atrás de você
  const r=ciclNovo({tipo:t,nivel:'corrida',nome:nm.n,gr:nm.gr,ftp:forca*T.ftp*(.93+Math.random()*.14),m:T.m,end:T.end*rnd(.92,1.08),
   Fend:t==='fraco'&&Math.random()<.4?rnd(100,115):rnd(76,84),dist:pos/PX_KM,v:speed/3.6,lane:i%3,f:FS[i%3],k:1+Math.floor(Math.random()*(KITS.length-1)),agua:3,gel:(carTipo==='treino'?1:0)+(GOAL>=50?1:0),iso:5});   // rachão: vale tudo, eles também levam gel
  r.pico=T.pico*rnd(.95,1.05);r.visto=true;corridaTatica(r,corridaSortPrep());CORR.riders.push(r);NPCS.push(r)});
 if(!arcos)CORR.riders.slice().sort(()=>Math.random()-.5).slice(0,3+Math.floor(Math.random()*2)).forEach(r=>{r.ftp=Math.round(r.ftp*rnd(1.1,1.15));r.cascudo=true;corridaTatica(r,'completo')});   // rachão: 3–4 cascudos bem mais fortes (e bem equipados)
 if(!arcos)for(const r of CORR.riders){r.inv=Object.assign({},CORR.dope);r.dope=true;r.nIt=0;r.ftp=Math.round(r.ftp*CORR.dopeFtp);r.Wp*=CORR.dopeFtp}   // rachão: todo mundo dopado (bolso cheio + gel azul)
 CORR.fugaKm=GOAL*(.18+Math.random()*.14);CORR.fugas=0;corridaPlano()}
// km a partir do qual os NPCs "se preparam" (tomam iso/gel com antecedência): antes da última subida, se ela estiver no fim
function corridaPlano(){const C=climbs[climbs.length-1];CORR.kmChave=C&&C.start>GOAL*.6?Math.min(C.start-CORR.kmPlano,GOAL-3):GOAL-4;CORR.marcaT=0}
function corridaParar(){CORR.on=false;CORR.riders=[]}
// diretor da corrida: só decide QUEM ataca e QUANDO (a física, a fadiga e o seguir-roda são de ciclistas.js)
function corridaPasso(dt){if(!CORR.on)return;
 // fuga: no km sorteado, o rolador mais descansado que está no grupo da frente ataca
 if(CORR.fugaKm&&CORR.riders.some(r=>r.dist>=CORR.fugaKm)){const c=CORR.riders.filter(r=>(r.tipo==='rolador'||r.tipo==='escalador')&&r.modo==='grupo'&&r.res>55&&r.est==='ok'&&!r.sentado).sort((a,b)=>b.dist-a.dist)[0];
  if(c){c.modo='fuga';CORR.fugas++;aviso={t:3,s:`FUGA! ${c.nome.toUpperCase()} ATACOU`};
   const p=CORR.riders.filter(r=>r!==c&&r.tipo==='rolador'&&r.modo==='grupo'&&r.res>55&&r.est==='ok'&&!r.sentado&&Math.abs(r.dist-c.dist)*PX_KM<400)[0];if(p&&Math.random()<.6)p.modo='fuga';   // às vezes vai um parceiro junto
   CORR.fugaKm=CORR.fugas<2&&Math.random()<.6?c.dist+GOAL*rnd(.15,.25):0}
  else CORR.fugaKm+=.5;if(CORR.fugaKm>GOAL*.7)CORR.fugaKm=0}
 corridaMarca()}
// 16/11 — você atacou? Só pela POSIÇÃO (abriu mais de ~220 px do grupo em que estava, sem ninguém logo à frente):
//   até 2 dos mais fortes e descansados do grupo vão atrás (ataque para pegar a sua roda). O resto do grupo só caça forte
//   se a vantagem passar de ~1500 px (ciclistas.js). Eles NÃO sabem a sua stamina nem a sua fadiga.
function corridaMarca(){if(state!=='run'||dist>=GOAL-1||CIC_T<CORR.marcaT)return;
 const atras=CORR.riders.filter(r=>!r.sentado&&!r.dnf&&r.dist<=dist&&(dist-r.dist)*PX_KM<2500),frente=CORR.riders.some(r=>!r.sentado&&!r.dnf&&r.dist>dist&&(r.dist-dist)*PX_KM<400);
 if(!atras.length||frente)return;const g=(dist-Math.max(...atras.map(r=>r.dist)))*PX_KM;if(g<CORR.marcaGap)return;
 const C=atras.filter(r=>r.modo==='grupo'&&r.est==='ok'&&r.res>50&&!(r.Fend>100)).sort((a,b)=>b.ftp*capF(b.fad)-a.ftp*capF(a.fad)).slice(0,CORR.marcaN);
 if(!C.length)return;CORR.marcaT=CIC_T+CORR.marcaPausa;
 C.forEach((r,i)=>{r.modo='ataque';r.atT=0;r.marca=true;r.nAtq=(r.nAtq||0)+1;if(!i)npcFala(r,r.gringo?'FOLLOW HIM!':sorteiaL(['VOU NA RODA!','NÃO VAI SOZINHO!','SEGURA ELE!']))})}
// colocação ao vivo (1 = primeiro)
function corridaPos(){let p=1;for(const r of CORR.riders)if(!r.dnf&&r.fim!=null?r.fim<=elapsed:r.dist>dist)p++;return p}
// ---------- classificação final (Rachão e Corrida), montada no fim da prova ----------
// Ordem: quem cruzou a chegada (por tempo; empate = você atrás, igual a corridaPos) → quem ainda estava na estrada
// (por distância; mostra quanto faltava) → quem abandonou (você, se quebrou ou abandonou, entra aqui).
// 16/11: classificação COMPLETA — quando a sua prova acaba, os outros continuam (simulação rápida, sem desenhar, você fora da
//   estrada) até todo mundo cruzar a chegada ou abandonar. Assim cada um tem tempo de verdade ou o km em que parou.
//   Teto de segurança: 4 h de prova. O seu tempo e o relógio voltam ao que eram.
function classifCompletar(){const e0=elapsed,a0=aviso,dt=1/20,lim=e0+4*3600/SCALE;CIC_SEM_EU=true;
 try{while(elapsed<lim&&CORR.riders.some(r=>r.fim==null&&!r.dnf)){elapsed+=dt;ciclPasso(dt)}}
 finally{CIC_SEM_EU=false;elapsed=e0;aviso=a0;for(const r of CORR.riders)r.fala=null}}
function classifMontar(chegou,aband){classifCompletar();
 const L=CORR.riders.map(r=>({cid:r.cid,nome:r.nome,pais:paisDe(r),tipo:r.tipo,cascudo:!!r.cascudo,ftp:Math.round(r.ftp),kg:Math.round(r.m),
  t:r.fim!=null?r.fim*SCALE:null,dist:r.dist,dnf:!!r.dnf,
  sit:r.dnf?(r.quebrou?'QUEBROU E ABANDONOU':'ABANDONOU'):r.fim!=null?(r.quebrou?'CHEGOU QUEBRADO':''):r.est==='quebrado'?'QUEBRADO':r.modo==='fuga'?'EM FUGA':''}));
 L.push({eu:true,nome:(typeof CS!=='undefined'&&CS.nome)||'VOCÊ',pais:'BRA',tipo:'voce',ftp:FTP,kg:AJ.peso,t:chegou?elapsed*SCALE:null,dist,dnf:!chegou,sit:chegou?'':aband?'ABANDONOU':'QUEBROU'});
 const g=x=>x.t!=null?0:x.dnf?2:1;
 L.sort((a,b)=>g(a)-g(b)||(g(a)===0?a.t-b.t||(a.eu?1:b.eu?-1:0):b.dist-a.dist));
 const t1=L[0].t;L.forEach((x,i)=>{x.pos=i+1;x.gap=x.t!=null&&t1!=null?x.t-t1:null;x.falta=x.t==null?Math.max(0,GOAL-x.dist):0});return L}
// bandeiras desenhadas (sem imagem): listras, cruz nórdica e casos especiais
const BAND={BRA:'bra',NOR:['n','#ba0c2f','#fff','#00205b'],SWE:['n','#006aa7','#fecc00'],DEN:['n','#c8102e','#fff'],JPN:'jpn',SUI:'sui',GBR:'gbr',
 GER:['h','#000','#dd0000','#ffce00'],NED:['h','#ae1c28','#fff','#21468b'],AUT:['h','#ed2939','#fff','#ed2939'],SLO:['h','#fff','#0057b8','#ed1c24'],CRO:['h','#ff0000','#fff','#171796'],
 ARG:['h','#74acdf','#fff','#74acdf'],COL:['h','#fcd116','#fcd116','#003893','#ce1126'],ESP:['h','#aa151b','#f1bf00','#f1bf00','#aa151b'],
 FRA:['v','#0055a4','#fff','#ef4135'],ITA:['v','#009246','#fff','#ce2b37'],BEL:['v','#000','#fdda24','#ef3340'],IRL:['v','#169b62','#fff','#ff883e']};
function bandeira(c,x,y,w,h){const b=BAND[c];ctx.save();rr(x,y,w,h,4);ctx.clip();ctx.fillStyle='#ccc';ctx.fillRect(x,y,w,h);
 if(Array.isArray(b)){const k=b[0],C=b.slice(1),n=C.length;
  if(k==='h')C.forEach((cor,i)=>{ctx.fillStyle=cor;ctx.fillRect(x,y+h*i/n,w,h/n+1)});
  else if(k==='v')C.forEach((cor,i)=>{ctx.fillStyle=cor;ctx.fillRect(x+w*i/n,y,w/n+1,h)});
  else{ctx.fillStyle=C[0];ctx.fillRect(x,y,w,h);const cx=x+w*.36,t=h*.26;ctx.fillStyle=C[1];ctx.fillRect(cx-t/2,y,t,h);ctx.fillRect(x,y+h/2-t/2,w,t);
   if(C[2]){const t2=t*.5;ctx.fillStyle=C[2];ctx.fillRect(cx-t2/2,y,t2,h);ctx.fillRect(x,y+h/2-t2/2,w,t2)}}
  if(c==='ARG'){ctx.beginPath();ctx.arc(x+w/2,y+h/2,h*.12,0,7);ctx.fillStyle='#f6b40e';ctx.fill()}}
 else if(b==='bra'){ctx.fillStyle='#009c3b';ctx.fillRect(x,y,w,h);ctx.beginPath();ctx.moveTo(x+w/2,y+h*.12);ctx.lineTo(x+w*.92,y+h/2);ctx.lineTo(x+w/2,y+h*.88);ctx.lineTo(x+w*.08,y+h/2);ctx.closePath();ctx.fillStyle='#ffdf00';ctx.fill();
  ctx.beginPath();ctx.arc(x+w/2,y+h/2,h*.24,0,7);ctx.fillStyle='#002776';ctx.fill()}
 else if(b==='jpn'){ctx.fillStyle='#fff';ctx.fillRect(x,y,w,h);ctx.beginPath();ctx.arc(x+w/2,y+h/2,h*.3,0,7);ctx.fillStyle='#bc002d';ctx.fill()}
 else if(b==='sui'){ctx.fillStyle='#da291c';ctx.fillRect(x,y,w,h);ctx.fillStyle='#fff';ctx.fillRect(x+w/2-h*.1,y+h*.2,h*.2,h*.6);ctx.fillRect(x+w/2-h*.3,y+h*.4,h*.6,h*.2)}
 else if(b==='gbr'){ctx.fillStyle='#012169';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#fff';ctx.lineWidth=h*.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y+h);ctx.moveTo(x+w,y);ctx.lineTo(x,y+h);ctx.stroke();
  ctx.strokeStyle='#c8102e';ctx.lineWidth=h*.08;ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(x+w/2-h*.17,y,h*.34,h);ctx.fillRect(x,y+h/2-h*.17,w,h*.34);ctx.fillStyle='#c8102e';ctx.fillRect(x+w/2-h*.1,y,h*.2,h);ctx.fillRect(x,y+h/2-h*.1,w,h*.2)}
 ctx.restore();rr(x,y,w,h,4);ctx.lineWidth=2;ctx.strokeStyle='#ffffff88';ctx.stroke()}
const TIPO_N={escalador:'Escalador',sprinter:'Sprinter',rolador:'Rolador',fraco:'Fraco',voce:'Você'};
const difTxt=s=>{s=Math.round(s);return s<3600?`+${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`:'+'+hms(s)};
let CLASSIF=false;
// tela de classificação (abre pelo botão CLASSIFICAÇÃO no resultado)
function drawClassif(r){ctx.fillStyle='#020c1ef2';ctx.fillRect(0,0,W,H);
 tituloGrande('CLASSIFICAÇÃO',74,56);tx(`${r.tipo==='corrida'?'CORRIDA':'RACHÃO'} · ${r.km} KM`,W/2,112,24,'center','#cfe3f1');
 btnVoltar('RESULTADO',()=>{CLASSIF=false});
 const L=r.classif,X0=40,WW=W-80,y0=130,rh=42;cardMenu(X0,y0,WW,58+L.length*rh+12,MN.borda,5,24);
 const C={pos:96,pais:126,nome:262,tipo:548,ftp:806,kg:892,wkg:990,tempo:1180,sit:1220};
 const hy=y0+40;[['POS',C.pos,'right'],['PAÍS',C.pais,'left'],['NOME',C.nome,'left'],['TIPO',C.tipo,'left'],['FTP',C.ftp,'right'],['KG',C.kg,'right'],['W/KG',C.wkg,'right'],['TEMPO',C.tempo,'right'],['SITUAÇÃO',C.sit,'left']]
  .forEach(([s,x,a])=>tx(s,x,hy,20,a,MN.borda));
 const MED=['#ffd200','#d6dde6','#e0904a'];
 L.forEach((c,i)=>{const y=y0+58+i*rh,ym=y+rh/2+9;
  if(c.eu){rr(X0+10,y+2,WW-20,rh-4,12);ctx.fillStyle='#ffd20038';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=MN.ama;ctx.stroke()}
  else if(i%2){ctx.fillStyle='#ffffff0b';ctx.fillRect(X0+10,y+2,WW-20,rh-4)}
  const fora=c.t==null;tx(fora&&c.dnf?'—':`${c.pos}º`,C.pos,ym,26,'right',!fora&&c.pos<=3?MED[c.pos-1]:'#fff');
  bandeira(c.pais,C.pais,y+8,40,26);tx(c.pais,C.pais+54,ym,18,'left','#cfe3f1');
  txFit((c.eu?c.nome.toUpperCase()+' (VOCÊ)':c.nome.toUpperCase()),C.nome,ym,26,C.tipo-C.nome-20,'left',c.eu?MN.tit:'#fff');
  tx(TIPO_N[c.tipo]+(c.cascudo?' ★':''),C.tipo,ym,22,'left',c.cascudo?'#ffb36b':'#cfe3f1');
  tx(`${c.ftp} W`,C.ftp,ym,22,'right','#fff');tx(`${c.kg}`,C.kg,ym,22,'right','#fff');tx((c.ftp/c.kg).toFixed(1).replace('.',','),C.wkg,ym,22,'right','#fff');
  tx(c.t!=null?(c.gap?difTxt(c.gap):hms(c.t)):c.dnf?`${f1(c.dist)} km`:`faltava ${f1(c.falta)} km`,C.tempo,ym,22,'right',c.t!=null&&!c.gap?MN.verde:'#fff');
  const sc={ABANDONOU:'#ff6a55',QUEBROU:'#ff6a55','QUEBROU E ABANDONOU':'#ff6a55',QUEBRADO:'#ffb36b','CHEGOU QUEBRADO':'#ffb36b','EM FUGA':'#7ee0ff'}[c.sit]||'#fff';tx(c.sit||(c.t!=null?'CHEGOU':'NA ESTRADA'),C.sit,ym,20,'left',c.sit?sc:c.t!=null?MN.verde:'#cfe3f1')});
 if(L.some(c=>c.cascudo))tx('★ cascudo: bem mais forte que o resto da turma',X0+20,H-14,18,'left','#ffb36b')}
// pórtico de LARGADA (logo à frente do pelotão) e de CHEGADA, com cones; desenhados atrás dos ciclistas, no mundo
// Pórtico em 2 partes (mesmo recorte): TRÁS (perna do lado de lá + topo) atrás dos ciclistas, pé na borda de cima do asfalto;
// FRENTE (perna do lado de cá) por cima dos ciclistas, pé na borda de baixo. Rachão (corrida clandestina): só uma faixa branca na chegada.
const PORT={pe:799,y:738};
const PORTICOS=()=>!CORR.on?[]:CORR.arcos?[{n:'largada',km:8.5*CORR.espaco*.5/PX_KM},{n:'chegada',km:GOAL}]:[{n:'faixa',km:GOAL}];
function porticoParte(parte){const K=9*3600/SCALE;for(const p of PORTICOS()){const x=bikeX+(p.km-dist)*K;if(x<WX0-500||x>WX1+500)continue;const a=alturaEm(x);
 if(p.n==='faixa'){if(parte==='tras'){noTrecho(segEm(x),()=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x-14,632);ctx.lineTo(x+14,632);ctx.lineTo(x+34,810);ctx.lineTo(x+6,810);ctx.closePath();ctx.fill()})}continue}
 const im=IMG['arco_'+p.n+'_'+parte];if(!im||!im.width)continue;ctx.drawImage(im,x-im.width/2,PORT.y-PORT.pe-a);
 const c=IMG.cone;if(!c||!c.width)continue;const cw=n=>n*c.width/c.height;
 const L=parte==='tras'?[[-300,62,650],[-245,62,650],[150,62,650]]:[[-120,80,736],[175,80,736],[235,80,736]];
 for(const[dx,h,yb]of L){const cx=x+dx,ay=alturaEm(cx);ctx.drawImage(c,cx-cw(h)/2,yb-ay-h,cw(h),h)}}}
function porticosArte(){porticoParte('tras')}
function porticosFrente(){porticoParte('frente')}
function porticosArteVelho(){const K=9*3600/SCALE;for(const p of PORTICOS()){const x=bikeX+(p.km-dist)*K;if(x<WX0-400||x>WX1+400||!p.img||!p.img.width)continue;
 const h=520,w=p.img.width*h/p.img.height,y=812-alturaEm(x);ctx.drawImage(p.img,x-w/2,y-h,w,h);
 const c=IMG.cone;if(c&&c.width)for(const[dx,dy]of[[-w/2-40,-188],[-w/2-95,-188],[w/2+30,-188],[-w/2+30,0],[w/2-50,0],[w/2+10,0],[w/2+70,0]]){const cx=x+dx,ch=dy?72:90,cy=812-alturaEm(cx)+dy;ctx.drawImage(c,cx-ch*c.width/c.height/2,cy-ch,ch*c.width/c.height,ch)}}}
const _corrUpdate=update;
update=function(dt){_corrUpdate(dt);if(state==='run')corridaPasso(dt)};
