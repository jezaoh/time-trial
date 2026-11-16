/* ===== CICLISTAS (NPCs) com fisiologia própria: stamina, fadiga, vácuo, ataques, quebra e abandono =====
   Um único "cérebro" para Pedal Livre, Rachão e Corrida. Nada de velocidade fixa: cada NPC escolhe uma POTÊNCIA,
   e a velocidade sai da mesma física do jogador (peso, subida, arrasto, inércia), com o vácuo de quem está à frente.
   Tempos fisiológicos em SEGUNDOS DE PROVA (dt real × SCALE): o mesmo NPC rende igual em qualquer modo.
   Cada NPC tem:
     ftp (W) · m (kg) · Wp (reserva acima do FTP, J — "stamina") · pico (sprint, ×FTP) · ataque (×FTP)
     end (resistência: divide a fadiga) · rec (recuperação da reserva) · agr (vontade de atacar / seguir quem passa)
     vacEf (aproveitamento do vácuo) · Fend (até que fadiga ele aceita chegar: >100 = exagera e quebra)
   Estado: res (0–100, reserva de curto prazo) e fad (0–100, acumula e só item tira).
   Estágios pela fadiga: ok → cansado (55) → fadigado (75: não ataca, não segue acima do FTP) → quebrado (90) → abandona (100).
   A fadiga corta o FTP efetivo (acima de 40, até −50% em 100) — é isso que faz a velocidade cair, com inércia, sem degrau.
   TODOS OS AJUSTES NO BLOCO FIS. */
const FIS={
 H:[[.4,4],[.5,7],[.6,11],[.7,17],[.8,27],[.9,45],[1,75],[1.1,120],[1.3,250],[1.6,500],[2.2,900],[3,1400]], // fadiga por HORA conforme P/FTP (resistência 1)
 capIni:40,capQueda:.5,capExp:1.6,        // FTP efetivo = FTP × (1 − 0,5·((fad−40)/60)^1,6)
 recup:240,                               // s de prova para a reserva encher do zero (pedalando a ~60% do FTP efetivo)
 exausto:60,                              // fadiga extra por hora insistindo acima do FTP com a reserva vazia
 est:{cansado:55,fadigado:72,quebrado:86,abandona:100},
 vac:.30,vacCurva:[[0,.6],[45,1],[440,1],[660,0]],   // redução máxima do arrasto na roda de alguém (igual ao do jogador no pelotão) · px → fração
 seguirMax:900,espaco:72,                 // px: até onde tenta ficar na roda · espaço ideal atrás de quem segue
 turno:[100,260],                         // s de prova puxando antes de sair da frente (revezamento)
 ataquesH:1.6,                            // ataques por hora (×agr) quando está descansado e em grupo
 // itens: as mesmas regras do jogador, na escala da fadiga do NPC (a do jogador enche em ~40 km; a do NPC em ~100+ km, ~2,7× mais devagar)
 agua:3,iso:3.4,gel:.15,bananaFad:2.2,bananaRes:40,
 // Pedal Livre: população ABSOLUTA (não depende do seu FTP) + alguns "do seu nível" para você pegar vácuo
 niveis:{recreativo:{ftp:[178,204],m:[72,86],end:[.85,1.05]},intermediario:{ftp:[205,232],m:[70,82],end:[.9,1.1]},
         forte:{ftp:[228,250],m:[66,76],end:[.95,1.12]},muitoForte:{ftp:[250,268],m:[64,72],end:[1,1.15]},elite:{ftp:[274,310],m:[60,70],end:[1.05,1.25]},pro:{ftp:[350,420],m:[62,72],end:[1.15,1.3]}},
 // 16/11: "do seu nível" caiu de 26% (solo + grupinho) para 10% (só solo); a diferença foi repartida entre os outros (soma = 1)
 encontros:[{t:'recreativo',n:1,p:.16},{t:'recreativo',n:2,p:.07},{t:'intermediario',n:1,p:.13},{t:'intermediario',n:2,p:.09},
  {t:'forte',n:1,p:.10},{t:'forte',n:2,p:.06},{t:'muitoForte',n:1,p:.05},{t:'muitoForte',n:4,p:.06},{t:'elite',n:1,p:.04},{t:'pro',n:1,p:.02},
  {t:'seu',n:1,p:.10},{t:'misto',n:5,p:.12}],
 encIntervalo:[4,7],                      // km entre encontros no Pedal Livre (era 3,5–6; 6–10 ficou vazio demais)
 encPrimeiro:[1.5,3],                     // km do 1º encontro sorteado
 encLargada:[1,2],                        // ciclistas tranquilos (solo, "só pedalando") já na estrada à frente quando você sai
 passeio:.4,                              // solo "só pedalando": segue o próprio ritmo e não gruda em roda de ninguém (não vale para os "do seu nível")
 seuVel:1.05,seuForca:1.12,               // "do seu nível": anda ~5% mais rápido que a sua média recente, com +12% de potência por cima (antes só os 5%)
 popMax:10,grupoMax:5,                    // ciclistas simulados no Pedal Livre · máximo numa fila (o 6º não gruda)
 perseguir:7000,                          // px: corrida/rachão — quem escapou até aqui é caçado pelo grupo
 longe:[-9,16,30]                         // km em relação a você: além disso sai da simulação (fadigado/quebrado à frente fica até 30 km: você vai encontrá-lo)
};
// sabores (tipo) — mesmos tipos da corrida
const SABOR={escalador:{dm:-6,pico:1.6,Wp:17000,atq:1.35,agr:.6,vac:1},sprinter:{dm:5,pico:2.6,Wp:26000,atq:1.45,agr:.35,vac:1.08},
 rolador:{dm:2,pico:1.7,Wp:20000,atq:1.3,agr:.5,vac:1},fraco:{dm:0,pico:1.5,Wp:14000,atq:1.25,agr:.25,vac:.92}};
const NOMES_BR=['Marcão','Tiago','Rafa','Dudu','Léo','Bruno','Gui','Caio','Netinho','Juca','Paulão','Vini','Beto','Fábio','Diego','Alemão','Zé','Russo','Japa','Cadu',
 'Neguinho','Tonhão','Pardal','Biel','Magrão','Fumaça','Serginho','Toninho','Kiko','Baiano','Pedrão','Lipe','Nando','Careca','Tché','Mineiro'];
const NOMES_GR=['Lars','Mateo','Kenji','Pierre','Luca','Jonas','Sven','Tomás','Olivier','Finn','Marco','Hugo','Nils','Aleks','Joaquín','Ruben','Felix','Ivan','Yuki','Theo','Callum','Jan'];
// país de cada nome estrangeiro (brasileiros = BRA); usado na classificação final
const PAIS_GR={Lars:'NOR',Mateo:'ESP',Kenji:'JPN',Pierre:'FRA',Luca:'ITA',Jonas:'GER',Sven:'SWE','Tomás':'ARG',Olivier:'BEL',Finn:'IRL',Marco:'ITA',Hugo:'FRA',
 Nils:'DEN',Aleks:'SLO','Joaquín':'COL',Ruben:'NED',Felix:'AUT',Ivan:'CRO',Yuki:'JPN',Theo:'SUI',Callum:'GBR',Jan:'NED'};
const paisDe=r=>r.gringo?PAIS_GR[r.nome]||'EUR':'BRA';
function nomeNovo(usados){for(let i=0;i<40;i++){const gr=Math.random()<.35,L=gr?NOMES_GR:NOMES_BR,n=L[Math.floor(Math.random()*L.length)];if(!usados||!usados.has(n)){usados&&usados.add(n);return{n,gr}}}return{n:'Zé',gr:false}}
const FALA_Q=['QUEBREI!','DEU CÃIBRA!','ACABOU A PERNA','CADÊ MEU GEL?','VOU DE UBER','FOI O PASTEL...','NÃO SINTO AS PERNAS','QUEM MANDOU ATACAR...','ME DEIXA AQUI','VOU LIGAR PRA PATROA','TÁ AMARRADO!','SOCORRO, BANANA!'],
 FALA_QG=['I\'M DONE!','CRAMP!','NO LEGS!','BONK!','CALL A TAXI...'],
 FALA_A=['VAMO!','BORA!','SEGURA ESSA!','QUEM VEM?','TCHAU!'],FALA_AG=['ALLEZ!','GO GO GO!','VAMOS!'],
 FALA_S=['NÃO DÁ...','PODE IR...','VAI LÁ...','SEGURA AÍ!','TÁ PUXADO!'],FALA_SG=['TOO FAST...','GO ON...','NO NO NO...'],
 FALA_C=['TÔ QUEBRADO...','SEGURA AÍ...','ARREBENTOU','PERNA DE PAU','SÓ MAIS UM POUCO...'],FALA_CG=['EASY, EASY...','NO MORE...','OUCH!'];
const sorteiaL=L=>L[Math.floor(Math.random()*L.length)];
// ---------- fisiologia ----------
function hInv(y){const T=FIS.H;if(y<=T[0][1])return T[0][0];for(let i=1;i<T.length;i++)if(y<=T[i][1]){const[a,va]=T[i-1],[b,vb]=T[i];return a+(b-a)*(y-va)/(vb-va)}return T[T.length-1][0]}
const capF=f=>1-FIS.capQueda*Math.pow(Math.max(0,f-FIS.capIni)/(100-FIS.capIni),FIS.capExp);
function estagio(f){const E=FIS.est;return f>=E.abandona?'abandona':f>=E.quebrado?'quebrado':f>=E.fadigado?'fadigado':f>=E.cansado?'cansado':'ok'}
function rRes(r,v,gr,vac){const th=Math.atan(gr/100),m=r.m+AJ.bike;return m*AJ.g*(Math.sin(th)+AJ.crr*Math.cos(th))+.5*AJ.rho*AJ.cda*(1-vac)*v*v}
function vEq(r,P,gr,vac){let lo=.3,hi=30;for(let i=0;i<28;i++){const v=(lo+hi)/2;if(AJ.eta*P>v*rRes(r,v,gr,vac))lo=v;else hi=v}return lo}
// cria um ciclista. o: {ftp,m,end,tipo,nivel,Fend,agua,gel,fad,kmPlano,dist,v,f,k,lane,nome}
function ciclNovo(o){const S=SABOR[o.tipo||'rolador'],nm=o.nome?{n:o.nome,gr:!!o.gr}:nomeNovo();
 const r={ia:true,fixo:true,pel:true,tipo:o.tipo||'rolador',nivel:o.nivel||'',nome:nm.n,gringo:nm.gr,
  ftp:Math.round(o.ftp),m:o.m||70,Wp:S.Wp*(o.ftp/220)*rnd(.85,1.15),pico:S.pico*rnd(.92,1.08),atq:S.atq*rnd(.95,1.05),
  end:o.end||1,rec:rnd(.85,1.15),agr:clamp(S.agr+rnd(-.2,.25),0,1),vacEf:S.vac*rnd(.95,1.05),
  Fend:o.Fend||(Math.random()<.14?rnd(104,122):rnd(72,84)),ritEx:rnd(.92,1),
  inv:{agua:o.agua!=null?o.agua:2+Math.floor(Math.random()*3),gel:o.gel!=null?o.gel:Math.floor(Math.random()*2),banana:o.banana||0,iso:o.iso||0},aguaMax:5,bebeu:0,
  res:100,fad:o.fad||0,est:'ok',desiste:rnd(300,1500),modo:'grupo',turno:0,turnoMax:rnd(FIS.turno[0],FIS.turno[1]),sai:0,atT:0,
  kmFeito:0,kmPlano:o.kmPlano||rnd(50,120),dist:o.dist,v:o.v||8,vEma:(o.v||8)*3.6,vSolo:8,tSolo:0,gr:terrain(Math.max(0,o.dist)),w:0,wEf:0,
  f:o.f||fRnd(),k:o.k!=null?o.k:Math.floor(Math.random()*KITS.length),lane:o.lane!=null?o.lane:Math.floor(Math.random()*3),ped:Math.random()*10,visto:false,
  efx:{t:0,cor:[255,255,255]},fala:null,falou:{},pegou:{},camCheio:0,sentado:false,dnf:false,fim:null};
 r.est=estagio(r.fad);return r}
function npcEfeito(r,k,dur=1.4){r.efx={t:dur,cor:EFXC[k]||EFXC.bonus}}
function npcFala(r,s){r.fala={s:`${r.nome.toUpperCase()}: ${s}`,t:3.4}}
// usa os próprios itens (decisão pelo estado físico)
// 16/11 — na corrida/rachão, com PLANO: guarda o último gel e 2 goles de iso para o final; perto do momento decisivo
//   (CORR.kmChave: antes da última subida ou a 4 km da chegada) toma iso e gel ANTES, para chegar com a reserva cheia.
// 16/11: no Rachão/Corrida (CORR.on) cada item rende menos que o anterior — a MESMA fila do jogador (LIV.rende)
function npcRende(r){if(!CORR.on||typeof LIV==='undefined')return 1;const n=r.nIt||0;r.nIt=n+1;return LIV.rende[Math.min(n,LIV.rende.length-1)]}
function npcIso(r){r.inv.iso--;r.isoT=CIC_T+4;const k=npcRende(r);r.fad=Math.max(0,r.fad-FIS.iso*k);r.res=Math.min(100,r.res+12*k);npcEfeito(r,'iso')}
function npcGel(r){r.inv.gel--;r.fad*=1-FIS.gel*npcRende(r);npcEfeito(r,'gel')}
// gel azul (só no Rachão dopado): zera a fadiga uma vez, antes de quebrar
function npcAzul(r){r.inv.azul--;r.fad=0;r.res=100;npcEfeito(r,'azul',2.5);if(Math.random()<.6)npcFala(r,r.gringo?'BLUE MAGIC!':sorteiaL(['GEL AZUL!','VOLTEI!','RENASCI!','AGORA VAI!']))}
// quanto de fadiga os itens que ainda estão no bolso vão tirar (para o NPC dopado já sair num ritmo que conta com eles)
function npcReserva(r){if(!r.dope)return 0;const I=r.inv,F=FIS,n0=r.nIt||0,L=typeof LIV!=='undefined'?LIV.rende:[1];let s=0,n=n0;
 const add=v=>{s+=v*L[Math.min(n,L.length-1)];n++};
 s+=I.agua*F.agua;for(let i=0;i<I.iso;i++)add(F.iso);for(let i=0;i<I.banana;i++)add(F.bananaFad);for(let i=0;i<I.gel;i++)add(F.gel*60);
 return(s+(I.azul||0)*CORR.dopeAzul)*CORR.dopePlano}
function npcItens(r){const ex=r.Fend>100,corr=CORR.on&&CORR.kmChave!=null,fin=corr&&r.dist>=CORR.kmChave;
 if(r.inv.azul>0&&r.fad>CORR.dopeAzulFad)npcAzul(r);
 if(fin&&!r.prepF&&!ex){r.prepF=true;if(r.inv.iso>0&&!(r.isoT>CIC_T))npcIso(r);if(r.inv.gel>0&&r.fad>20)npcGel(r)}   // preparação para o final
 if(r.inv.agua>0&&r.fad>(ex?45:22)+r.bebeu*11){r.inv.agua--;r.bebeu++;r.fad=Math.max(0,r.fad-FIS.agua);npcEfeito(r,'agua')}
 if(r.inv.banana>0&&r.fad>38){r.inv.banana--;const k=npcRende(r);r.fad=Math.max(0,r.fad-FIS.bananaFad*k);r.res=Math.min(100,r.res+FIS.bananaRes*k);npcEfeito(r,'banana')}
 const guardaGel=corr&&!fin&&!ex&&r.inv.gel<=1,guardaIso=corr&&!fin&&!ex&&r.inv.iso<=2;
 if(r.inv.gel>0&&r.fad>(guardaGel?82:ex?78:62))npcGel(r);
 if(r.inv.iso>0&&(r.res<(guardaIso?20:40)||r.fad>30+(5-r.inv.iso)*9+(guardaIso?20:0))&&!(r.isoT>CIC_T))npcIso(r)}
// ---------- passo de todos os ciclistas ----------
let CIC_T=0,CIC_SEM_EU=false;   // CIC_SEM_EU: simulação depois que a sua prova acabou (você sai da estrada; ninguém segue a sua roda parada)
function ciclPasso(dt){const L=NPCS.filter(n=>n.ia);if(!L.length)return;const dtg=dt*SCALE,h=dt*AJ.kin/4,K=PX_KM,corr=CORR.on;CIC_T+=dt;
 // foto das posições antes de mover ninguém (inclui você), ordenada da frente para trás
 const todos=L.filter(o=>!o.sentado).map(o=>({o,dist:o.dist,v:o.v})).concat(CIC_SEM_EU?[]:[{eu:true,dist,v:speed/3.6}]).sort((a,b)=>b.dist-a.dist);
 const C=corr?climbs[climbs.length-1]:null,cam=typeof LV!=='undefined'&&LV&&LV.veic&&LV.veic.tipo==='caminhao'&&LV.veic.fase!=='vai'?LV.veic:null;
 for(let idx=0;idx<todos.length;idx++){const me=todos[idx];if(me.eu)continue;const r=me.o;if(r.fim!=null&&r.dist>GOAL+.5)continue;
  r.gr=lerp(r.gr,terrain(Math.max(0,Math.min(GOAL,r.dist))),Math.min(1,dt*1.4));
  // vácuo (o melhor de quem está à frente até 660 px) e a roda mais próxima
  let ah=null,gapA=1e9,vac=0;
  for(let j=idx-1;j>=0;j--){const o=todos[j],g=(o.dist-r.dist)*K;if(g>2600)break;if(g<=0)continue;vac=Math.max(vac,curva(corr?NPCK.vac:FIS.vacCurva,g));if(g<gapA){gapA=g;ah=o}}
  let nFila=0;for(let j=idx;j>0&&nFila<9;j--){if((todos[j-1].dist-todos[j].dist)*K>FIS.seguirMax)break;nFila++}
  let nGrp=0;for(let j=idx+1;j<todos.length&&nGrp<5;j++){if((todos[j-1].dist-todos[j].dist)*K>FIS.seguirMax)break;nGrp++}const atras=nGrp>0;
  vac*=FIS.vac*r.vacEf;
  if(cam){const g=(cam.rear-r.dist)*K-150;vac=Math.max(vac,curva([[-60,0],[0,1],[230,1],[470,0]],g)*LIV.vacVeic*r.vacEf)}
  vac=Math.min(vac,.55);
  const cap=r.ftp*capF(r.fad),teto=r.res>5?cap*r.pico:cap*.97;r.est=estagio(r.fad);if(r.quebrou&&r.est!=='abandona')r.est='quebrado';else if(r.est==='quebrado')r.quebrou=true;   // quebrou, ficou quebrado (item não desfaz)
  // ritmo próprio: quanto de fadiga ele aceita gastar no que falta (km que faltam ÷ velocidade média)
  const kmRem=corr?Math.max(1,GOAL-r.dist):Math.max(4,r.kmPlano-r.kmFeito),Trem=kmRem/Math.max(12,r.vEma);
  let rA=clamp(hInv((Math.max(0,r.Fend-r.fad)+npcReserva(r))*r.end/Trem),.45,r.dope?CORR.dopeTeto:.98);/* dopado (Rachão): conta com os itens do bolso */const ex=r.Fend>100;if(ex&&r.est!=='quebrado')rA=Math.max(rA,r.ritEx);   // exagerado: sai forte demais e paga depois
  if(!corr&&r.kmFeito>=r.kmPlano)rA=.5;
  let alvo=r.ftp*rA;
  if(corr&&!ex){const g=CORR.riders.filter(o=>!o.sentado&&Math.abs(o.dist-r.dist)*K<700),med=g.reduce((a,o)=>a+o.ftp,0)/Math.max(1,g.length);alvo=Math.min(alvo,med*(r.dope?CORR.dopeRitmo:CORR.ritmo))}
  if(corr)alvo*=r.gr>3?1.06:1;else if(r.gr>1.5)alvo*=1+Math.min(.3,.03*r.gr);   // na subida todo mundo aperta um pouco (no muro, bem mais)
  alvo*=clamp((r.gr-AJ.coastB)/(AJ.coastA-AJ.coastB),0,1);   // descida forte: roda livre (como o cruzeiro do jogador)
  alvo=Math.min(alvo,r.gr>6&&r.res>30?cap*1.15:cap);
  r.tSolo-=dt;if(r.tSolo<=0){r.tSolo=.25;r.vSolo=vEq(r,Math.max(alvo,1),r.gr,0)}
  // ---- decisão ----
  const ok=r.est==='ok',fresco=ex?r.res>70&&(ok||r.est==='cansado'):ok&&r.res>85&&r.fad<50,grupo=atras||(ah&&gapA<FIS.seguirMax);
  if(corr){const fimK=r.dist>=(r.kmSpr||GOAL-1.1),sub=C&&r.dist>=C.start&&r.dist<C.end;   // sprint: cada um no seu ponto (sprinter só a 250 m)
   if(r.modo==='fuga'&&(r.res<15||(!r.final&&r.dist>GOAL*.8)||r.est==='fadigado'||r.est==='quebrado'))r.modo='grupo';
   if(r.modo==='ataque'&&((!sub&&r.atT>400)||r.res<12)){r.modo=r.final&&r.res>25&&ok&&!atras?'fuga':'grupo';r.marca=false}   // ataque do final que abriu: segura até a chegada
   if(r.modo==='grupo'&&r.tipo==='escalador'&&sub&&r.res>45&&ok&&r.dist>C.start+(C.end-C.start)*.25)r.modo='ataque';
   if(r.modo==='grupo'&&ex&&fresco&&grupo&&Math.random()<r.agr*FIS.ataquesH*dtg/3600){r.modo='ataque';r.atT=0;aviso={t:3,s:`ATAQUE! ${r.nome.toUpperCase()} SAIU`}}   // o afoito ataca sem pensar
   // ---- ataques táticos (16/11): topo de subida, final pré-sorteado (5–3 km) e o agressivo no meio da prova ----
   if(r.gr>3)r.naSub=true;const topo=r.naSub&&r.gr<1;if(topo)r.naSub=false;
   if(r.modo==='grupo'&&!ex&&ok&&r.res>60&&r.nAtq<CORR.atqMax&&!fimK&&r.dist>GOAL*.15){let q=0;
    if(topo&&grupo)q=CORR.atqTopo*r.agr*(r.tipo==='escalador'?1.5:1);
    else if(r.kmAtq&&r.dist>=r.kmAtq){r.kmAtq=0;q=1}
    else if(r.perso==='agressivo'&&grupo&&r.dist<GOAL*.8)q=r.agr*FIS.ataquesH*.6*dtg/3600;
    if(q&&Math.random()<q){r.modo='ataque';r.atT=0;r.nAtq++;r.final=r.dist>=GOAL-6;aviso={t:3,s:`ATAQUE! ${r.nome.toUpperCase()} SAIU`};if(Math.random()<.5)npcFala(r,sorteiaL(r.gringo?FALA_AG:FALA_A))}}
   if(fimK&&r.est!=='quebrado')r.modo='sprint'}
  else{if(r.modo==='ataque'&&(r.res<30||r.atT>420))r.modo=r.agr>.55&&!atras?'fuga':'grupo';
   if(r.modo==='fuga'&&(r.res<15||!ok))r.modo='grupo';
   const fav=(r.tipo==='escalador'&&r.gr>3)||(r.tipo==='rolador'&&Math.abs(r.gr)<1.5)||r.tipo==='sprinter';
   if(r.modo==='grupo'&&fresco&&grupo&&Math.random()<Math.max(r.agr,ex?.7:0)*FIS.ataquesH*(fav?2:1)*(ex?3:1)*dtg/3600){r.modo='ataque';r.atT=0;if(Math.random()<.6)npcFala(r,sorteiaL(r.gringo?FALA_AG:FALA_A))}}
  if(r.modo==='ataque')r.atT+=dtg;
  let P;
  if(r.modo==='sprint')P=teto;
  else if(r.modo==='ataque')P=cap*r.atq;
  else if(r.modo==='fuga')P=Math.max(alvo,cap*1.0);
  else if(r.sai>0){r.sai-=dtg;P=alvo*.8;if(ah&&gapA<FIS.espaco*2)r.sai=0}   // saiu da frente: deixa o grupo passar e vai para a roda
  else if(ah&&gapA<FIS.seguirMax&&!r.passeio&&!(ah.o&&ah.o.sentado)&&(corr||nFila<=FIS.grupoMax)){
   const passa=ah.v<r.vSolo*(ex?1.01:.95)&&(ok||r.est==='cansado'||(ex&&r.est==='fadigado'));   // o afoito não fica na roda: quer estar na frente
   // 16/11: posicionamento — nos últimos 3 km o sprinter descansado sobe na fila (no fundo da fila ele chegava ~800 m atrás)
   const sobe=corr&&r.tipo==='sprinter'&&r.dist>=GOAL-CORR.sobeKm&&r.dist<(r.kmSpr||GOAL)&&r.res>40&&(ok||r.est==='cansado')&&nFila>CORR.sobeFila;
   if(sobe)P=Math.min(teto,Math.max(alvo*1.06,cap*.98,ah.o?ah.o.w*1.05:0));
   else if(passa)P=alvo*1.06;               // quem vai à frente está lento para ele: passa
   else{const vd=Math.max(1,ah.v+clamp((gapA-FIS.espaco)/22.5/3.6*.6,-2,1.2));
    const need=vd*rRes(r,vd,r.gr,vac)/AJ.eta+(r.m+AJ.bike)*(vd-r.v)*Math.max(r.v,2)/AJ.eta*.3;
    let lim=cap*(ok?1+.15*r.agr:r.est==='cansado'?.97:.88);if(r.res<20)lim=Math.min(lim,cap*.95);
    if(corr&&r.dist>=GOAL-1.5&&r.res>5&&r.est!=='quebrado')lim=teto;   // último 1,5 km: se mata para não perder a roda (é assim que o sprinter chega ao sprint)
    P=Math.min(need,lim);                    // não aguenta? fica para trás (perde contato)
    if(need>lim*1.03){r.tSolta=(r.tSolta||0)+dt;if(r.tSolta>2.5&&!(r.falaSolta>CIC_T)){r.falaSolta=CIC_T+90;npcFala(r,sorteiaL(r.gringo?FALA_SG:FALA_S))}}else r.tSolta=0}
   r.turno=0}
  else{P=atras&&!corr?Math.min(cap,alvo*(1+.06*Math.min(4,nGrp))):alvo;   // sozinho ou puxando o grupo (na frente puxa mais forte: depois descansa na roda)
   if(atras){r.turno+=dtg;if(r.turno>(corr&&r.tipo==='sprinter'?15:r.turnoMax)||r.res<35){/* corrida: o sprinter se esconde (puxa só ~15 s de prova e volta para a roda) */r.turno=0;r.turnoMax=rnd(FIS.turno[0],FIS.turno[1]);r.sai=60}}
   if(corr&&ah&&gapA<FIS.perseguir&&r.res>30&&(ok||r.est==='cansado')){P=Math.max(P,Math.min(cap*(gapA<CORR.perseguirPerto&&r.dist<GOAL-5?.9:.95+.04*Math.min(3,nGrp)),teto));if(r.turno>60)r.turno=r.turnoMax}   // corrida: escapou alguém → o grupo caça (forte só se a vantagem passar de ~1500 px), revezando rápido
   else if(!corr&&ah&&gapA<2600&&ok&&r.res>50&&r.agr>.5&&ah.v<r.vSolo*1.06)P=Math.max(P,cap*1.03)}   // tenta encostar em quem vai logo ali
  if(r.est==='quebrado'&&r.modo!=='sprint')P=Math.min(P,alvo,cap*.85);   // quebrado: pedala devagar
  P=clamp(P,0,teto);
  // ---- abandono ----
  if(r.est==='quebrado'){r.tQ=(r.tQ||0)+dtg;if(r.tQ>r.desiste)r.est='abandona'}   // quebrado há muito tempo: desiste e encosta
  if(r.est==='abandona'){r.sentado=true;r.dnf=corr;r.w=0;r.modo='parado';npcFala(r,sorteiaL(r.gringo?FALA_QG:FALA_Q));continue}
  if(r.est==='quebrado'&&!r.falou.q){r.falou.q=1;npcFala(r,sorteiaL(r.gringo?FALA_CG:FALA_C))}
  r.w=lerp(r.w,P,Math.min(1,dt*6));
  // ---- reserva (stamina) e fadiga ----
  if(r.w>cap)r.res=Math.max(0,r.res-(r.w-cap)*dtg/r.Wp*100);else if(r.w<cap*.9)r.res=Math.min(100,r.res+r.rec*(.9-r.w/cap)/.3*100/FIS.recup*dtg);
  let df=curva(FIS.H,r.w/r.ftp)/r.end;if((r.res<5||(ex&&r.fad>=FIS.est.fadigado))&&P>=cap*.99)df+=FIS.exausto/r.end;   // insistir no limite, vazio ou fadigado, cobra caro
  r.fad=Math.min(100,r.fad+df*dtg/3600);
  npcItens(r);
  // ---- física (igual à do jogador) ----
  let v=r.v;for(let i=0;i<4;i++){const a=(AJ.eta*r.w/Math.max(v,AJ.vmin)-rRes(r,v,r.gr,vac))/(r.m+AJ.bike);v=clamp(v+a*h,1.1,AJ.vmax/3.6)}
  const d0=r.dist;r.v=v;r.dist+=v*3.6*dt/3600*SCALE;r.kmFeito+=r.dist-d0;r.ped+=v*3.6*dt*.5;r.wEf=r.w;r.pel=grupo;r.vacAt=vac;
  r.vEma=lerp(r.vEma,v*3.6,Math.min(1,dtg/900));
  if(r.fim==null&&r.dist>=GOAL)r.fim=elapsed;
  // ---- recursos da pista (cada um pega o seu; ninguém tira de ninguém) ----
  if(typeof LV!=='undefined'&&LV){
   for(const it of LV.rec)if(d0<it.dist&&r.dist>=it.dist&&!it.peg.has(r)){
    if(it.t==='agua'){if(r.inv.agua<r.aguaMax){it.peg.add(r);r.inv.agua++;npcEfeito(r,'agua',.8)}}
    else{it.peg.add(r);r.inv.gel++;npcEfeito(r,'gel',.8)}}
   if(cam&&cam.fase==='segue'&&!r.pegou['c'+cam.id]){const g=(cam.rear-r.dist)*K-150;
    if(g>-420&&g<330)r.camCheio+=dt/LIV.vacSeg;else r.camCheio=Math.max(0,r.camCheio-dt/14);
    if(r.camCheio>=1){r.pegou['c'+cam.id]=1;r.camCheio=0;r.inv.banana++;npcEfeito(r,'banana',1)}}}}
 // parados: freiam até parar (sem degrau)
 for(const r of L){if(r.efx.t>0)r.efx.t-=dt;if(r.fala){r.fala.t-=dt;if(r.fala.t<=0)r.fala=null}
  if(r.sentado){r.v=Math.max(0,r.v-4*dt);r.dist+=r.v*3.6*dt/3600*SCALE;r.w=0}}
 if(!corr)ciclLimpar()}
// ---------- Pedal Livre: estrada com gente de verdade ----------
function ciclLimpar(){const a=dist+FIS.longe[0];
 for(const n of NPCS){if(!n.ia)continue;const x=bikeX+(n.dist-dist)*PX_KM,vis=x>WX0-300&&x<WX1+300;if(vis)n.visto=true;
  const b=dist+(n.est==='ok'||n.est==='cansado'?FIS.longe[1]:FIS.longe[2]);
  if(!vis&&(n.dist<a||n.dist>b||(n.sentado&&x<WX0)||(n.kmFeito>=n.kmPlano+3&&n.visto)))n.fora=true}
 NPCS=NPCS.filter(n=>!n.fora)}
// sorteia um ciclista de um nível; "seu": potência que o faz rodar ~3% mais rápido que a sua média recente
function ciclDoNivel(t,o){const S=['escalador','sprinter','rolador','rolador'],tipo=sorteiaL(S);
 if(t==='seu'){const vJ=Math.max(20,LV.vJ||28)*FIS.seuVel/3.6,m=rnd(68,76),q={m};const P=vJ*rRes(q,vJ,0,0)/AJ.eta*FIS.seuForca;
  return ciclNovo(Object.assign({ftp:P/.68,m,end:rnd(.95,1.1),tipo,nivel:'seu',Fend:rnd(78,92)},o))}
 const N=FIS.niveis[t];return ciclNovo(Object.assign({ftp:rnd(...N.ftp),m:rnd(...N.m)+SABOR[tipo].dm*.5,end:rnd(...N.end),tipo,nivel:t},o))}
function ciclPopular(){
 if(LV.vJ==null)LV.vJ=28;LV.vJ=lerp(LV.vJ,Math.max(15,speed),Math.min(1,1/(60*40)));
 if(dist<LV.proxEnc)return;LV.proxEnc=dist+rnd(...FIS.encIntervalo);if(NPCS.filter(n=>n.ia).length>=FIS.popMax)return;
 const E=sorteio(FIS.encontros),n=E.t==='misto'?3+Math.floor(Math.random()*2):E.n===3?2+Math.floor(Math.random()*2):E.n,
  ini=rnd(0,55),feito=ini*1.1,time=Math.floor(Math.random()*KITS.length),kit=()=>E.n>=4&&Math.random()<.6?time:Math.floor(Math.random()*KITS.length);
 const G=[];for(let i=0;i<n;i++){const t=E.t==='misto'?sorteiaL(['recreativo','intermediario','intermediario','forte','forte','muitoForte']):E.t;
  const ex=Math.random()<.22,r=ciclDoNivel(t,{dist:0,fad:ex?rnd(45,70):ini*rnd(.8,1.2),kmPlano:feito+rnd(30,90),k:kit(),Fend:ex?rnd(104,122):undefined});r.kmFeito=feito;G.push(r)}   // o afoito já vem gastando há tempo
 if(n===1&&E.t!=='seu'&&Math.random()<FIS.passeio)G[0].passeio=true;   // "só pedalando": não quer vácuo de ninguém
 // posição: mais lento que você → aparece à frente; mais rápido → vem de trás
 const ref=G.reduce((a,r)=>a+r.ftp,0)/n,vS=vEq(G[0],ref*.72,0,n>1?.12:0)*3.6,frente=vS<LV.vJ;
 const base=frente?dist+(WX1-bikeX+250)/PX_KM+rnd(0,1.2):dist-(bikeX-WX0+250)/PX_KM-rnd(0,E.t==='seu'?.3:1.5);
 G.forEach((r,i)=>{r.dist=base-i*(FIS.espaco+40)/PX_KM;r.v=vS/3.6;r.vEma=vS;r.lane=n>1?i%3:Math.floor(Math.random()*2);NPCS.push(r)})}
// largada do Pedal Livre: 1–2 ciclistas tranquilos (recreativo/intermediário, "só pedalando") logo à frente, para a estrada
//   não começar vazia sem entregar vácuo de graça; depois os encontros sorteados (o 1º entre o km 1,5 e 3)
function ciclInicio(){const q=Math.round(rnd(...FIS.encLargada));
 for(let i=0;i<q;i++){const r=ciclDoNivel(sorteiaL(['recreativo','recreativo','intermediario']),{dist:dist+rnd(.35,.8)*(WX1-bikeX)/PX_KM+i*rnd(.5,1.1),/* o 1º já na tela, à frente; o 2º um pouco adiante */fad:rnd(0,20),kmPlano:rnd(30,90),k:Math.floor(Math.random()*KITS.length)});
  const vS=vEq(r,r.ftp*.72,0,0)*3.6;r.kmFeito=0;r.passeio=true;r.v=vS/3.6;r.vEma=vS;r.lane=Math.floor(Math.random()*2);NPCS.push(r)}
 LV.proxEnc=rnd(...FIS.encPrimeiro)}
// recursos compartilhados: água do torcedor e gel do furgão (cada ciclista pega o seu)
function recNovo(t,km){LV.rec.push({t,dist:km,peg:new Set()})}
// ---------- desenho: parados na beira da estrada, brilho dos itens e falas ----------
function npcParadoArte(r,x){const id=FID[r.f],im=IMG[id==='branco'?'fim_quebrou':'fim_quebrou_'+id]||IMG.fim_quebrou;if(!im||!im.width)return;
 const s=segEm(x),ey=s.e+s.m*(x-s.xa),w=330,h=im.height*w/im.width;ctx.drawImage(im,x-w/2,roadY+NPCK.faixa-44-ey-h,w,h)}
function npcBrilho(r,x){const a=clamp(r.efx.t,0,1),[R,G,B]=r.efx.cor,s=segEm(x),ey=s.e+s.m*(x-s.xa),cy=roadY-150-ey-(r.lane||0)*17;
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a*.85;ctx.fillStyle=`rgb(${R},${G},${B})`;ctx.beginPath();ctx.ellipse(x+10,cy,150,135,0,0,7);ctx.filter='none';
 const g=ctx.createRadialGradient(x+10,cy,10,x+10,cy,160);g.addColorStop(0,`rgba(${R},${G},${B},.8)`);g.addColorStop(1,`rgba(${R},${G},${B},0)`);ctx.fillStyle=g;ctx.fill();ctx.restore()}
// balão de fala (16/11): branco, contorno preto, letras pretas em Luckiest Guy — vale para TODOS que falam (ciclistas e torcedor);
//   mais alto (360 → 470) para não ficar atrás do aviso "VÁCUO −x% ARRASTO"
const BALAO={alto:470,altoSentado:250,f:"34px LuckiestGuy,system-ui,sans-serif"};
// x = ponta do rabinho; y = base do balão; t = texto ("NOME: frase" ou só a frase); a = opacidade
function balaoDesenhar(x,y,t,a=1){ctx.save();ctx.globalAlpha=a;ctx.font=BALAO.f;const w=ctx.measureText(t).width+40;
 rr(x-w/2,y-56,w,68,30);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#000';ctx.stroke();
 // rabinho: contorno preto e miolo branco cobrindo a borda do balão
 ctx.beginPath();ctx.moveTo(x-13,y+12);ctx.lineTo(x-4,y+34);ctx.lineTo(x+15,y+12);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();
 ctx.fillRect(x-11,y+8,24,6);
 ctx.fillStyle='#000';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(t,x,y-8);ctx.restore()}
function npcBalao(r,x){if(!r.fala)return;const s=segEm(x),ey=s.e+s.m*(x-s.xa),y=roadY-(r.sentado?BALAO.altoSentado:BALAO.alto)-ey-(r.lane||0)*17;
 balaoDesenhar(x,y,r.fala.s,clamp(r.fala.t*2,0,1))}
const _cicDes=npcDesenhar;
npcDesenhar=function(){const vis=[];for(const n of NPCS){if(!n.ia)continue;const x=bikeX+(n.dist-dist)*PX_KM;if(x>WX0-260&&x<WX1+260)vis.push([n,x])}
 for(const[n,x]of vis)if(n.sentado)npcParadoArte(n,x);
 for(const[n,x]of vis)if(!n.sentado&&n.efx.t>0)npcBrilho(n,x);
 _cicDes();
 for(const[n,x]of vis){if(n.fala)npcBalao(n,x);else if(n.sentado&&!n.falou.v&&x<WX1-200){n.falou.v=1;npcFala(n,sorteiaL(n.gringo?FALA_QG:FALA_Q))}
  else if(!n.sentado&&n.est==='quebrado'&&!n.falou.vq&&x<WX1-200){n.falou.vq=1;npcFala(n,sorteiaL(n.gringo?FALA_CG:FALA_C))}}};   // você chegou nele: ele conta que quebrou
// ---------- liga no jogo ----------
const _cicUpd=update;
update=function(dt){_cicUpd(dt);if(state==='run'&&!(typeof CONT!=='undefined'&&CONT>0))ciclPasso(dt)};
