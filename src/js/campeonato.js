/* ===== CAMPEONATOS (Corrida da Carreira) — desde 16/11/2026 =====
   PEDALAR › CORRIDA abre a tela CAMPEONATOS. Três campeonatos de 5 etapas, com mapas FIXOS (perfis desenhados à mão,
   em frações da distância — a distância é a da sua patente: 30/50/80/100 km, "o que o ciclista aguenta"):
     TOUR SAN LUIZ (escalador) · VUELTA DE SAN MARIA (sprinter) · GIRO DE ESTRADA (clássico).
   - Inscrição paga em moedas (pela patente). Os MESMOS 14 rivais correm as 5 etapas (sorteados na inscrição).
   - Classificação GERAL por tempo somado. Quebrou/abandonou a etapa (você ou NPC): tempo do último que chegou + penalidade.
   - Vencer a GERAL sobe a patente e paga o prêmio (× inscrição). Etapa paga XP e moedas pela colocação (reduzidos).
   - Desistir do campeonato: devolve só parte da inscrição.
   Itens: como sempre, o que você leva no BOLSO sai do seu estoque (regulamento: água, isotônico e gel).
   Salvo em CS.camp (localStorage tt2_car). TODOS OS NÚMEROS NO BLOCO CAMP. */
const CAMP={
 insc:[100,150,200,280,360,450,600],      // inscrição por patente (Iniciante → Nível Mundial)
 premio:[5,3,2,1,.5],                     // prêmio na geral × inscrição: 1º 5×, 2º 3×, 3º 2×, 4º devolve, 5º metade (16/11: era 10·5·3·1,5·1)
 devolve:.3,                              // desistir: devolve 30% da inscrição (perde 70%)
 penal:.08,                               // quebrou/abandonou a etapa: tempo do último que chegou + 8% do tempo do vencedor
 xpEt:.6,moedaEt:.5,                      // por etapa: × XP e × moedas da colocação da corrida avulsa (CAR.xpPos, CAR.moedas.pos)
 etapas:5,
 // perfis: [início, fim da subida, % no topo, fim da descida] em FRAÇÕES da distância (fim > 1 = chegada no alto)
 lista:[
  {id:'tsl',n:'TOUR SAN LUIZ',esp:'Escalador',d:'Montanha: subidas longas e chegadas no alto',c:'#a8ffb4',
   grade:{escalador:6,rolador:3,sprinter:1,fraco:4},
   et:[{n:'Colinas de abertura',cl:[[.2,.28,5,.33],[.5,.6,6,.66],[.8,.9,6.5,.95]]},
       {n:'Chegada no alto',cl:[[.3,.38,5.5,.44],[.82,1,7,1.05]]},
       {n:'Etapa rainha',cl:[[.15,.27,7,.33],[.45,.58,8,.65],[.8,1,8.5,1.05]]},
       {n:'Serra do meio',cl:[[.25,.35,6,.42],[.6,.72,7,.8]]},
       {n:'Final na serra',cl:[[.35,.45,6,.5],[.7,1,7.5,1.05]]}]},
  {id:'vsm',n:'VUELTA DE SAN MARIA',esp:'Sprinter',d:'Plana: pelotão junto e chegada no sprint',c:'#ffb36b',
   grade:{sprinter:6,rolador:4,escalador:1,fraco:3},
   et:[{n:'Plano total',cl:[[.5,.53,2.5,.56]]},
       {n:'Ondulada',cl:[[.3,.34,3,.38],[.7,.73,2.5,.76]]},
       {n:'Reta longa',cl:[[.4,.45,3.5,.5]]},
       {n:'Duas lombas',cl:[[.2,.24,3,.28],[.55,.6,4,.65]]},
       {n:'Grande final',cl:[[.6,.63,3,.66]]}]},
  {id:'gde',n:'GIRO DE ESTRADA',esp:'Clássico',d:'Subidas curtas e fortes, a última perto da chegada',c:'#7ee0ff',
   grade:{rolador:4,escalador:3,sprinter:3,fraco:4},
   et:[{n:'Os muros',cl:[[.2,.23,8,.27],[.45,.48,9,.52],[.85,.88,9,.93]]},
       {n:'Sobe e desce',cl:[[.15,.19,7,.23],[.35,.39,8,.43],[.55,.59,8,.63],[.8,.84,9,.9]]},
       {n:'Paredões',cl:[[.3,.34,10,.39],[.6,.64,9,.69],[.88,.92,10,.97]]},
       {n:'Colinas',cl:[[.25,.3,7,.35],[.5,.55,8,.6],[.75,.8,8,.86]]},
       {n:'Final explosivo',cl:[[.2,.24,9,.29],[.45,.49,9,.54],[.7,.74,10,.79],[.9,.94,10,.99]]}]}]};
const campDef=id=>CAMP.lista.find(c=>c.id===id);
const campInsc=()=>CAMP.insc[Math.min(CS.pat,CAMP.insc.length-1)];
function campAtivo(){return CS.camp&&campDef(CS.camp.id)?CS.camp:null}
// subidas da etapa em km (formato de `climbs`)
function campClimbs(C,i){const km=C.km,E=campDef(C.id).et[i==null?C.etapa:i];return E.cl.map(([s,e,p,d])=>({start:s*km,end:e*km,peak:p,descentEnd:d*km}))}
// ---------- inscrição: paga, sorteia os 14 rivais (mesmos nas 5 etapas) com a força da categoria ----------
function campInscrever(id){const D=campDef(id),p=campInsc();if(CS.moedas<p||campAtivo())return;CS.moedas-=p;
 const forca=Math.max(pat().forca,ftpDe(CS.nivel,CS.sk.motor)),us=new Set(),G=[];
 for(const[t,q]of Object.entries(D.grade))for(let k=0;k<q;k++){const T=CORR.tipos[t],nm=nomeNovo(us);
  G.push({tipo:t,nome:nm.n,gr:nm.gr,ftp:Math.round(forca*T.ftp*(.93+Math.random()*.14)),m:T.m,end:+(T.end*rnd(.92,1.08)).toFixed(3),
   Fend:t==='fraco'&&Math.random()<.4?rnd(100,115):rnd(76,84),pico:T.pico*rnd(.95,1.05),k:1+Math.floor(Math.random()*(KITS.length-1)),
   prep:corridaSortPrep()})}   // bolso do campeonato inteiro: quem tem dinheiro vem completo em todas as etapas
 CS.camp={id,km:pat().km,forca,insc:p,etapa:0,grade:G,tot:{eu:0},pos:[]};G.forEach((g,i)=>CS.camp.tot[i]=0);carSalvar()}
function campDesistir(){const C=campAtivo();if(!C)return;CS.moedas+=Math.floor(C.insc*CAMP.devolve);CS.camp=null;carSalvar()}
// classificação geral (tempo somado), da frente para trás
function campGeral(C){const L=C.grade.map((g,i)=>({nome:g.nome,pais:g.gr?PAIS_GR[g.nome]||'EUR':'BRA',tipo:g.tipo,ftp:g.ftp,kg:Math.round(g.m),tot:C.tot[i]}));
 L.push({eu:true,nome:CS.nome||'VOCÊ',pais:'BRA',tipo:'voce',ftp:ftpDe(CS.nivel,CS.sk.motor),kg:CAR.peso-CS.sk.escalada,tot:C.tot.eu});
 L.sort((a,b)=>a.tot-b.tot||(a.eu?1:b.eu?-1:0));const t1=L[0].tot;L.forEach((x,i)=>{x.pos=i+1;x.gap=x.tot-t1});return L}
// ---------- fim de cada etapa (chamado depois do finish da Carreira, com a classificação completa já montada) ----------
function campEtapaFim(r){const C=campAtivo();if(!C||!r.classif)return;const L=r.classif,ch=L.filter(c=>c.t!=null);
 const t1=ch.length?Math.min(...ch.map(c=>c.t)):GOAL/25*3600,ult=ch.length?Math.max(...ch.map(c=>c.t)):t1,pen=ult+t1*CAMP.penal;
 for(const c of L){const id=c.eu?'eu':c.cid;if(id==null||C.tot[id]==null)continue;C.tot[id]+=c.t!=null?c.t:pen}
 const me=L.find(c=>c.eu);C.pos.push(me&&me.t!=null?me.pos:0);C.etapa++;
 const G=campGeral(C),D=campDef(C.id),eu=G.find(x=>x.eu);
 r.camp={n:D.n,c:D.c,etapa:C.etapa,geral:G,posG:eu.pos,gapG:eu.gap,fim:C.etapa>=CAMP.etapas,pen:!(me&&me.t!=null)};
 if(r.camp.fim){const k=CAMP.premio[eu.pos-1]||0,pr=Math.round(C.insc*k);r.camp.premio=pr;CS.moedas+=pr;
  CS.campVit=CS.campVit||{};if(eu.pos===1){CS.campVit[C.id]=(CS.campVit[C.id]||0)+1;
   if(CS.pat<CAR.patentes.length-1){const antes=[30,50,80,100].filter(liberado);CS.pat++;r.sobe=pat().n;r.libera=[30,50,80,100].filter(k=>liberado(k)&&!antes.includes(k))}}
  CS.campUlt={n:D.n,pos:eu.pos,premio:pr};CS.camp=null}
 carSalvar()}
const _campFinish=finish;
finish=function(w){_campFinish(w);if(MODO==='carreira'&&carTipo==='corrida'&&carRes&&campAtivo())campEtapaFim(carRes)};
// ---------- telas ----------
let GERAL=false,campZerar=0;
// mini perfil de uma etapa (mesma conta do relevo do jogo)
function campPerfil(cl,km,x,y,w,h,cor){const c0=climbs,r0=rampas;climbs=cl;rampas=[];const n=80,H=[0];let a=0;
 for(let i=1;i<=n;i++){a+=terrain((i-.5)*km/n)/100*km/n*1000;H.push(a)}climbs=c0;rampas=r0;const mx=Math.max(60,...H);
 ctx.save();ctx.beginPath();ctx.moveTo(x,y+h);H.forEach((v,i)=>ctx.lineTo(x+w*i/n,y+h-h*v/mx));ctx.lineTo(x+w,y+h);ctx.closePath();ctx.fillStyle=cor+'44';ctx.fill();
 ctx.beginPath();H.forEach((v,i)=>{const px=x+w*i/n,py=y+h-h*v/mx;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.strokeStyle=cor;ctx.lineWidth=3;ctx.stroke();ctx.restore();return Math.round(mx)}
function drawCamp(){fundo();tituloGrande('CAMPEONATOS',84,66);btnVoltar('VOLTAR',()=>{GERAL=false;state='pedalar'});moedasChip();
 const C=campAtivo();
 if(!C){const p=campInsc();
  tx(`${pat().n} · etapas de ${pat().km} km · inscrição ${p} moedas · vença a GERAL para subir de patente`,W/2,128,22,'center','#fff');
  CAMP.lista.forEach((D,i)=>{const w=470,h=640,x=W/2-w*1.5-24+i*(w+24),y=160;card(x,y,w,h,false,false);
   tx(D.n,x+w/2,y+70,txLarg(D.n,w-40,42),'center',D.c);tx(`PARA ${D.esp.toUpperCase()}`,x+w/2,y+110,24,'center','#fff');
   txFit(D.d,x+w/2,y+146,20,w-40,'center','#cfe3f1');
   D.et.forEach((E,j)=>{const ey=y+176+j*58;tx(`${j+1}`,x+34,ey+36,26,'center',D.c);campPerfil(campClimbs({id:D.id,km:pat().km},j),pat().km,x+60,ey+6,170,40,D.c);txFit(E.n,x+246,ey+34,20,w-266,'left','#fff')});
   const pr=Math.round(p*CAMP.premio[0]);tx(`Campeão: +${pr} moedas`,x+w/2,y+500,24,'center',MN.ama);
   const vit=(CS.campVit||{})[D.id];if(vit)tx(`Você já venceu ${vit}×`,x+w/2,y+530,20,'center',MN.verde);
   const ok=CS.moedas>=p,bx=x+40,by=y+h-96,bw=w-80,bh=70;
   if(ok)btn(`INSCREVER · ${p}`,bx,by,bw,bh,()=>campInscrever(D.id),true,30);
   else{rr(bx,by,bw,bh,22);ctx.fillStyle='#c9d1da';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=MN.esc;ctx.stroke();tx(`FALTAM ${p-CS.moedas} MOEDAS`,x+w/2,by+46,26,'center','#5a6472')}});
  if(CS.campUlt)tx(`Último campeonato: ${CS.campUlt.n} · ${CS.campUlt.pos}º na geral${CS.campUlt.premio?` · +${CS.campUlt.premio} moedas`:''}`,W/2,836,20,'center','#cfe3f1');
  return}
 // campeonato em andamento: próxima etapa (esquerda) + geral (direita)
 const D=campDef(C.id),E=D.et[C.etapa],G=campGeral(C);
 card(30,120,640,700,false,false);tx(D.n,350,182,txLarg(D.n,600,40),'center',D.c);tx(`ETAPA ${C.etapa+1} DE ${CAMP.etapas}`,350,232,34,'center','#fff');
 tx(E.n.toUpperCase(),350,276,28,'center',MN.ama);const mx=campPerfil(campClimbs(C),C.km,70,300,560,150,D.c);
 tx(`${C.km} km · ${E.cl.length} subida${E.cl.length>1?'s':''} · ${mx} m de subida acumulada`,350,488,22,'center','#cfe3f1');
 C.pos.forEach((p,j)=>tx(`E${j+1}: ${p?p+'º':'quebrou'}`,90+j*110,530,20,'left',p===1?MN.verde:'#fff'));
 btn(`CORRER ETAPA ${C.etapa+1}`,70,560,560,100,()=>{GERAL=false;irMochila('corrida')},true,44);
 const z=campZerar&&T-campZerar<3,dv=Math.floor(C.insc*CAMP.devolve);
 btn(z?'TOQUE DE NOVO PARA DESISTIR':`DESISTIR (devolve ${dv} de ${C.insc})`,70,688,560,76,()=>{if(z){campDesistir();campZerar=0}else campZerar=T},false,z?24:26);
 tabelaGeral(G,700,120,806,700,'GERAL')}
// tabela da classificação geral (também no resultado da etapa)
function tabelaGeral(G,x,y,w,h,tit){const z=G.every(c=>!c.tot);if(z&&tit)tit='INSCRITOS';card(x,y,w,h,false,false);tx(tit,x+30,y+48,30,'left',MN.tit);
 const rh=Math.min(40,(h-80)/G.length),C={pos:x+70,pais:x+86,nome:x+150,tipo:x+w-330,tempo:x+w-30};
 G.forEach((c,i)=>{const yy=y+72+i*rh,ym=yy+rh/2+8;if(c.eu){rr(x+12,yy+2,w-24,rh-4,10);ctx.fillStyle='#ffd20038';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=MN.ama;ctx.stroke()}
  tx(z?'·':`${c.pos}º`,C.pos,ym,22,'right',!z&&c.pos<=3?['#ffd200','#d6dde6','#e0904a'][c.pos-1]:'#fff');bandeira(c.pais,C.pais,yy+rh/2-11,34,22);
  txFit(c.eu?(c.nome+' (VOCÊ)').toUpperCase():c.nome.toUpperCase(),C.nome,ym,22,C.tipo-C.nome-14,'left',c.eu?MN.tit:'#fff');
  tx(TIPO_N[c.tipo],C.tipo,ym,20,'left','#cfe3f1');tx(z?`${c.ftp} W`:c.pos===1?hms(c.tot):difTxt(c.gap),C.tempo,ym,22,'right',!z&&c.pos===1?MN.verde:'#fff')})}   // antes da 1ª etapa: lista de inscritos com o FTP
// tamanho de fonte que cabe na largura
function txLarg(s,w,max){ctx.font=FT(900,max);const m=ctx.measureText(s).width;return m<=w?max:Math.floor(max*w/m)}
const _campDraw=draw;
draw=function(){if(state==='camp'){CLARO=false;btns=[];drawCamp();if(pnl)drawPanel();return}_campDraw()};
addEventListener('keydown',e=>{if(state==='camp'&&!pnl&&e.code==='Escape')state='pedalar'});
// resultado da etapa: faixa do campeonato + botão GERAL (abre a geral no lugar do resultado)
const _campOv=carOverlay;
carOverlay=function(){const r=carRes;
 if(r&&r.camp&&GERAL){ctx.fillStyle='#020c1ef2';ctx.fillRect(0,0,W,H);tituloGrande(r.camp.fim?'GERAL FINAL':'CLASSIFICAÇÃO GERAL',74,56);
  tx(`${r.camp.n} · depois da etapa ${r.camp.etapa} de ${CAMP.etapas}`,W/2,112,24,'center','#cfe3f1');btnVoltar('RESULTADO',()=>{GERAL=false});
  tabelaGeral(r.camp.geral,200,130,W-400,710,'');return}
 _campOv();if(!r||!r.camp||CLASSIF)return;const c=r.camp;
 tx(`${c.n} · ETAPA ${c.etapa}/${CAMP.etapas}`,40,58,26,'left',c.c);
 tx(c.fim?(c.posG===1?`CAMPEÃO! +${c.premio} moedas`:`GERAL FINAL: ${c.posG}º${c.premio?` · +${c.premio} moedas`:''}`):`GERAL: ${c.posG}º${c.gapG>0?' a '+difTxt(c.gapG):' · LÍDER'}`,40,92,26,'left',c.fim&&c.posG===1?MN.verde:'#fff');
 if(c.pen)tx('tempo do último + penalidade',40,122,20,'left','#ff8a80');
 btn('GERAL',W-30-330,100,330,64,()=>{GERAL=true},'share',28)};
