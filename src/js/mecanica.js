/* ===== MECÂNICA DO JOGO — V2: POTÊNCIA, STAMINA, FADIGA =====
   Sem dependência de DOM/canvas: roda no Node (tools/balanceamento/sim_v2.js).
   Cadeia por quadro:  botão → potência (W) → stamina (botão × intensidade) → fadiga (potência real) → velocidade → distância.
   Tempos de jogabilidade são em SEGUNDOS REAIS; distância e relógio continuam em tempo de jogo (×SCALE), como na V1.
   TODOS OS PARÂMETROS AJUSTÁVEIS ESTÃO NO BLOCO "AJUSTES" LOGO ABAIXO.
*/
let SCALE=75,GOAL=50;   // SCALE: 1 s real = SCALE s de prova (Carreira usa menos, prova mais longa)   // GOAL e climbs mudam na Carreira (30/50 km)

// =====================================================================================================================
// AJUSTES — tudo que define o equilíbrio do jogo
//   As curvas são tabelas [intensidade, valor], com interpolação linear entre os pontos (sem degraus).
//   Intensidade = potência / FTP  (1,0 = 250 W · 2,0 = 500 W · 4,0 = 1000 W).
// =====================================================================================================================
const AJ={
 // ---- atleta ----
 ftp:250,peso:70,bike:8,                 // FTP fixo durante a corrida (W) · peso do ciclista e da bike (kg)

 // ---- botão → potência ----
 cruise:.70,                             // sem apertar: 70% do FTP = 175 W
 cruiseExausto:.83,                      // stamina < 1,5 (exausto, como na V1): cruzeiro ×0,83
 coastA:-2.5,coastB:-5,                  // descida: o cruzeiro cai suave até 0 entre −2,5% e −5% (roda livre)
 rampa:320,                              // pressionado: sobe 320 W por segundo, desde o 1º quadro, a partir do valor atual (linear)
                                         //   → +32 W em 0,1 s · +64 W em 0,2 s · +160 W em 0,5 s · +320 W em 1 s · 1000 W em ~2,6 s
 hudSuave:20,                            // suavização só do número no HUD e do sprite (≈0,05 s); a física usa a potência real
 tau:2,                                  // (antigo) solto: desce suave até o cruzeiro
 // ---- botão = PEDALADA: cada toque é uma perna; o ritmo dos toques define os watts; segurar = sprint ----
 tapFtp:2,                               // toques por segundo para manter o FTP (1/s ≈ 70%, 3/s ≈ 130% na Carreira)
 tapTau:1.0,                             // cada pedalada some em ~1 s (por isso é preciso manter o ritmo)
 tapSuave:8,                             // a potência acompanha as pedaladas em ~0,12 s
 tapSegura:.25,                          // apertou e segurou mais que isso: SPRINT (sobe 320 W/s como antes)
 staTap:[[.5,4],[.7,5.5],[.85,7],[1,7],[1.15,8],[1.3,9],[1.6,12],[2,15]],   // stamina gasta POR TOQUE conforme a intensidade
                                         //   com a recuperação entre os toques: ~85% se mantém; no FTP desce devagar; 130% despenca
 pMax:1150,                              // teto fixo de potência (W) — só vale no Contrarrelógio (a Carreira define o dela)
 // ---- CONTRARRELÓGIO: "acelerador" BRUUM–uuuum (substitui toque/sprint só nesse modo) ----
 //   Apertado = os watts sobem (quanto mais tempo, mais watts; segurando muito vira sprint naturalmente).
 //   Solto = os watts descem devagar até o cruzeiro (~1 s), a bike segue embalada. Dosando, dá para manter 200, 300 W…
 //   Calibrado pelo perfil do dono (FTP 245 W): 15 s 1116 W · 30 s 775 W · 1 min 495 W · 5 min 343 W · 1 h ~215 W.
 empLivre:0,                             // sem apertar NÃO pedala: os watts caem até 0 (roda livre) — quem não pedala, para
 empSobe:150,                            // apertado: sobe 150 W/s (segurar 1 s ≈ +150 W) — dá para dosar 200, 250, 300 W
 empSegura:1.2,empAcel:1.5,              // segurando mais que 1,2 s: a subida acelera +150%/s → vira sprint (máximo em ~3,7 s)
 empSolta:.5,                            // solto: os watts caem ~40% por segundo até 0 — o "uuuum" (200 W ≈ 40% do tempo apertado; meio a meio ≈ 300 W)
 // stamina = bateria de explosão (W'): só esvazia ACIMA do FTP, proporcional ao excesso; abaixo do FTP recarrega.
 //   ~15 kJ no real comprimido para segundos de jogo: 1116 W ≈ 4 s · 775 W ≈ 7 s · 495 W ≈ 14 s · 343 W ≈ 37 s
 empWp:4000,                             // W·s de jogo para esvaziar 100% (excesso de 866 W esvazia ~22%/s)
 // teto de watts pela stamina: barra cheia = pMax; vazia = 1,2×FTP. Sprint de 1000 W de novo só com a barra quase cheia,
 //   e durante o sprint os watts caem junto com a barra (o sprint "morre" sozinho)
 //   como a fadiga limita o teto da barra (100 − fadiga), depois de um sprint o 2º só chega a ~400 W — a não ser que beba água
 empTetoMin:1.2,empTetoExp:1.5,empTetoCheia:60,   // teto = 1,2·FTP + (pMax − 1,2·FTP)·(stamina/60)^1,5 → ≥60% = 1150 W · 40% ≈ 760 W · 20% ≈ 460 W
 // barra que RESPIRA com o ritmo: apertado sempre gasta (por intensidade) + a bateria acima do FTP; solto recupera
 empAperta:[[.7,24],[1,24],[2,12],[4.6,4]],    // stamina por segundo APERTADO (além da bateria acima do FTP; no sprint quem pesa é a bateria)
 empRecupera:20,                         // stamina por segundo SOLTO (enquanto os watts ainda estão acima do FTP, a bateria desconta)
 // fadiga (só Contrarrelógio): pela potência real, calibrada pela 1 h do dono. Prova ≈ 72 s reais.
 //   175 W chega folgado · 200 W quase chega sem beber · 215 W só com os itens · 230 W+ quebra
 //   acima do FTP quase plana: quem cobra o sprint é a stamina (bateria); sem o multiplicador de "tanque vazio" neste modo
 empFad:[[0,.25],[.7,.55],[.8,1.25],[.86,1.95],[.92,2.7],[1,3.2],[1.5,5],[2,7],[3,10],[4.6,14]],   // sprint deixa marca: 5 s de sprint cheio ≈ +35 de fadiga

 // ---- stamina (barra verde = stamina atual; vermelho = o resto) ----
 // Energia de curto prazo. Gasta SÓ com o botão pressionado, mais rápido quanto maior a potência. Solto: recupera na hora
 // (V1: 11,6/s), até o teto 100 − fadiga. Com stamina ≤ 0,5 o botão não funciona (V1) e a potência desce suave.
 staGasto:[[.7,14],[1,20],[1.2,25],[1.6,36],[2,42],[3,48],[4,55]],     // por segundo pressionado (1 s de pressão ≈ −30; segurando, zera em ~2,5 s, perto de 1000 W)
 staRecupera:11.6,                       // por segundo solto (valor da V1 para o branco)

 // ---- fadiga (interna) — NUNCA diminui sozinha: só água e gel reduzem. Limita o teto da stamina (100 − fadiga) ----
 fadResist:1.35,                         // resistência: + por segundo SEMPRE (pedalando, soltando, em descida) — quem nunca acelera precisa de 3 águas
 fadInt:[[.7,0],[1,.6],[1.2,1.3],[1.5,2.8],[2,5],[3,6],[4,7]],  // esforço: + por segundo conforme a POTÊNCIA REAL (moderado 250–375 W mais barato; sprint igual)
                                         //   (0 até o cruzeiro; depois de soltar, cai junto com a potência → "mais lentamente")
 fadTanque:.5,fadTanqueExp:2,            // multiplica o esforço por 1 + 0,5·(1 − stamina)^2: com stamina cheia ×1, vazia ×1,5.
                                         //   Sprint curto (stamina alta) deixa pouco desgaste; esforço prolongado (stamina baixa) deixa muito.
 fadExausto:1.5,                         // + por segundo só quando PRESSIONA com stamina < 4 (insistir de tanque vazio)

 // ---- água e gel ----
 aguaQtd:5,aguaFad:8,aguaSeg:2,          // 5 garrafas · cada uma tira até 8 de fadiga, aos poucos, em 2 s
                                         //   (não acumula: enquanto uma está fazendo efeito, a próxima não é aberta)
 gelQtd:2,gelFrac:.40,                   // 2 géis · cada um tira na hora 40% da fadiga acumulada (80 → 48)

 // ---- física ----
 cda:.30,crr:.004,rho:1.2,eta:.976,g:9.81,
 vmin:2,                                 // m/s: limita a força P/v em baixa velocidade
 kin:6,                                  // inércia: física integrada a dt_real·6 (≈2,3 s reais para 63% da resposta)
 vmax:80                                 // km/h, teto de segurança
};
// =====================================================================================================================
// FRICÇÃO NA BARRA DE STAMINA — TESTE só no Contrarrelógio (17/11; FRI.liga=false volta ao acelerador BRUUM–uuuum)
//   Testados e descartados no mesmo dia: marchas (12, toque = pedalada) e ritmo por toques/embalo — estão no histórico do Git.
//   Segurar o raio = empurrar o "carrinho de fricção": come a stamina (a ponta do verde anda para a esquerda), os watts
//   sobem e a fadiga cresce pela potência. Na barra há uma JANELA logo à esquerda da ponta do verde: soltou com a ponta
//   dentro dela = PERFEITA (o volante guarda a força mais tempo, fadiga ×0,95); antes = FRACA; depois = GÁS (mais força,
//   mais stamina); longe demais ou stamina zerada = PATINOU (perde 45% da força, +3 de fadiga).
//   A janela é mais funda quanto mais rápido (ir rápido pede empurrada maior) e encolhe com pouca stamina.
//   Solto: a stamina volta (20/s, menos o W' acima do FTP) e a força cai devagar. Stamina < 5: teto 85% do FTP.
// =====================================================================================================================
const FRI={liga:true,
 gasto:30,                               // stamina comida por segundo segurando
 sobe:240,                               // W/s somados enquanto segura
 janela:{v0:20,v1:50,a0:9,a1:18,larg:6}, // a janela começa depois de 9 de stamina comida (20 km/h) → 18 (50 km/h); largura 6
 laranja:12,                             // depois da janela, mais 12 = gás; além disso = patinou
 tau:{fraca:.5,perfeita:1.4,gas:.9,patinou:.4},   // s reais para a força guardada cair ~63% depois de soltar
 fad:{fraca:1,perfeita:.95,gas:1.1,patinou:1.3},  // fadiga pela última empurrada
 patina:{perde:.45,fad:3},
 recupera:20,                            // stamina por segundo solto (menos o W' acima do FTP)
 tetoZero:.85,zona:5,exausto:1.3,        // stamina < 5: teto vai a 85% do FTP; fadiga ×1,3
 gravSub:.7,                             // subida "arcade": a gravidade conta 70% na subida
 dev:6.18,                               // uma marcha só (50×17): só para a perna girar
 fc:{rep:55,max:190,tau:1.5,             // FC (só informação): repouso, máxima, atraso (s reais)
  curva:[[0,.33],[.5,.58],[.75,.72],[.9,.82],[1,.88],[1.2,.95],[1.5,1]],   // %FCmáx pela intensidade (P/FTP)
  drift:.12},                            // +0,12 bpm por ponto de fadiga
 wpKJ:20};                               // W' mostrado no HUD: stamina 100% = 20 kJ
let friS0=100,friG=0,friSeg=false,friTrava=false,friTau=1,friZ='',friZT=-9,friSeq=0,friT=0,friRpm=0,friFC=FRI.fc.rep;
const friOn=()=>FRI.liga&&MODO==='crono';
function friZera(){friS0=100;friG=0;friSeg=false;friTrava=false;friTau=1;friZ='';friZT=-9;friSeq=0;friT=0;friRpm=0;friFC=FRI.fc.rep+25}
// janela (em stamina comida nesta empurrada), a partir da stamina do começo da empurrada
function friJanela(s0){const J=FRI.janela,a=J.a0+(J.a1-J.a0)*clamp((speed-J.v0)/(J.v1-J.v0),0,1);return[Math.min(a,s0*.55),Math.min(J.larg,s0*.3)]}
function friZona(g,s0){const[a,l]=friJanela(s0);return g<a?'fraca':g<=a+l?'perfeita':g<=a+l+FRI.laranja?'gas':'patinou'}
function friSolta(z){friSeg=false;friZ=z;friZT=friT;friTau=FRI.tau[z];friSeq=z==='perfeita'?friSeq+1:0;
 if(z==='patinou'){power*=1-FRI.patina.perde;fatigue=Math.min(100,fatigue+FRI.patina.fad)}}
function friPasso(dt){friT+=dt;
 if(boost&&!friTrava){if(!friSeg){friSeg=true;friS0=stamina;friG=0}
  friG+=FRI.gasto*dt;power+=FRI.sobe*dt;
  if(stamina<=.5||friZona(friG,friS0)==='patinou'&&friG>friJanela(friS0)[0]+friJanela(friS0)[1]+FRI.laranja+8){friSolta('patinou');friTrava=true}}   // passou muito do ponto: patina sozinho
 else{if(!boost)friTrava=false;if(friSeg)friSolta(friZona(friG,friS0));power*=Math.exp(-dt/friTau)}}
function friDepois(dt){friRpm=power>15?speed/3.6*60/FRI.dev:0;
 const F=FRI.fc,alvo=F.max*curva(F.curva,power/FTP)+F.drift*fatigue;friFC+=(Math.min(F.max,alvo)-friFC)*Math.min(1,dt/F.tau)}

let climbs=[{start:8,end:9.5,peak:5.5,descentEnd:11.5},{start:23,end:26.5,peak:6.5,descentEnd:29.5},{start:36,end:42,peak:7.5,descentEnd:45}];
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)},lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// rampas: trechos livres {a,b,g} (km, km, %), só no Pedal Livre; nos outros modos a lista é vazia
let rampas=[];
function terrain(km){for(const h of climbs){if(km<h.start||km>h.descentEnd)continue;const up=h.end-h.start;
 if(km<h.start+up*.28)return h.peak*smooth((km-h.start)/(up*.28));if(km<h.end-up*.2)return h.peak;
 if(km<h.end)return h.peak*(1-smooth((km-(h.end-up*.2))/(up*.2)));const dn=h.descentEnd-h.end,d=-Math.min(6,h.peak);
 if(km<h.end+dn*.25)return d*smooth((km-h.end)/(dn*.25));if(km<h.descentEnd-dn*.25)return d;return d*(1-smooth((km-(h.descentEnd-dn*.25))/(dn*.25)))}for(const r of rampas){if(km<r.a||km>r.b)continue;const e=Math.min(.4,(r.b-r.a)*.3),t=Math.min(1,(km-r.a)/e,(r.b-km)/e);return r.g*smooth(clamp(t,0,1))}return 0}
// curva por tabela, interpolação linear; fora da tabela continua a última inclinação
function curva(T,x){if(x<=T[0][0])return T[0][1];for(let i=1;i<T.length;i++)if(x<=T[i][0]){const[a,va]=T[i-1],[b,vb]=T[i];return va+(vb-va)*(x-a)/(b-a)}
 const[a,va]=T[T.length-2],[b,vb]=T[T.length-1];return vb+(vb-va)*(x-b)/(b-a)}

// ---------- Atleta (V2: só o ciclista branco) ----------
const CH=[{id:'branco',nome:'BRANCO'}];
let FTP=AJ.ftp;let MODO='crono';   // 'crono' = contrarrelógio (ranking) · 'carreira'

// ---------- Estado ----------
let sel=0,state='title',stamina=100,fatigue=0,water=5,gel=1,speed=0,dist=0,elapsed=0,scroll=0,pedal=0,boost=false,waterEffect=0,grade=0,won=false;
let power=0,pShow=0,holdT=0,aguaResta=0,pTap=0,boostAnt=false;
let vacuo=0,wHud=0,elevG=0,elevD=0,pSoma=0,pTempo=0;   // pSoma/pTempo: potência média do pedal (W), mostrada no HUD;   // elevG: subida acumulada (m)   // 0–0,4: fração do arrasto aerodinâmico poupada atrás de outro ciclista (calculada em npc.js)   // power = W atuais; pShow = suavizado p/ HUD e sprite; aguaResta = fadiga que a água ainda vai tirar
function cruiseW(){const k=clamp((grade-AJ.coastB)/(AJ.coastA-AJ.coastB),0,1);return FTP*AJ.cruise*k*(stamina<1.5?AJ.cruiseExausto:1)}
function resist(v){const th=Math.atan(grade/100),m=AJ.peso+AJ.bike,gs=grade>0&&friOn()?FRI.gravSub:1;   // fricção: subida "arcade"
 return m*AJ.g*(Math.sin(th)*gs+AJ.crr*Math.cos(th))+.5*AJ.rho*AJ.cda*(1-vacuo)*v*v}
function vEq(P,gr){const g0=grade;grade=gr;let lo=.3,hi=40;for(let i=0;i<60;i++){const v=(lo+hi)/2;if(AJ.eta*P>v*resist(v))lo=v;else hi=v}grade=g0;return lo*3.6}

function reset(){RK.res=null;if(MODO==='crono')rkStart();stamina=100;fatigue=0;water=AJ.aguaQtd;gel=AJ.gelQtd;speed=21;dist=0;elapsed=0;scroll=0;boost=false;waterEffect=0;grade=0;won=false;
 holdT=0;aguaResta=0;pTap=0;boostAnt=false;pSoma=0;pTempo=0;power=FTP*AJ.cruise;pShow=power;state='run';friZera();if(friOn()){power=0;pShow=0}}
function finish(w){won=w;state='over';boost=false;speed=0;power=0;pShow=0;if(w&&MODO==='crono')rkSend(Math.floor(elapsed*SCALE),CH[sel].id)}
// água: só abre outra garrafa quando a anterior terminou o efeito (evita recuperação exagerada em sequência)
function drink(){if(state==='run'&&water>0&&waterEffect<=0){water--;waterEffect=AJ.aguaSeg;aguaResta=AJ.aguaFad}}
function eat(){if(state==='run'&&gel>0){gel--;fatigue=fatigue*(1-AJ.gelFrac)}}

function update(dt){
 elapsed+=dt;
 grade=lerp(grade,terrain(dist),Math.min(1,dt*1.4));
 // 1) botão → potência: contínua, sempre a partir do valor atual; responde no mesmo quadro em que o botão muda
 const mar=friOn(),active=boost&&(mar||stamina>.5),base=cruiseW(),emp=!mar;   // emp: acelerador BRUUM–uuuum em TODOS os modos (16/11; antes só no Contrarrelógio — o código de toque/sprint abaixo ficou sem uso)
 const toque=boost&&!boostAnt&&(mar||stamina>.5);boostAnt=boost;   // cada novo toque = uma pedalada
 if(active)holdT+=dt;else holdT=0;
 const sprint=!emp&&active&&holdT>=AJ.tapSegura;
 if(mar)friPasso(dt);
 else if(emp){pTap=0;const livre=Math.min(base,FTP*AJ.empLivre);   // sem apertar: sem pedalar
  if(active)power=Math.max(power,livre)+AJ.empSobe*(1+AJ.empAcel*Math.max(0,holdT-AJ.empSegura))*dt;   // mesmo ritmo = mesmos watts no plano e na subida (na subida a física é que pesa)
  else power+=(livre-power)*Math.min(1,dt*AJ.empSolta)}
 else{
 // a pedalada rende o que a stamina paga: sem stamina, a perna não empurra (ritmo sustentável ≈ 85% do FTP)
 let kTap=0;if(toque){const c=curva(AJ.staTap,(base+pTap)/FTP);kTap=Math.min(1,stamina/c);pTap+=(1-AJ.cruise)*FTP/(AJ.tapFtp*AJ.tapTau)*kTap;stamina=Math.max(0,stamina-c*kTap)}
 if(sprint){power=Math.max(power,0)+AJ.rampa*dt;pTap=Math.max(0,power-base)}
 else{pTap*=Math.exp(-dt/AJ.tapTau);power+=(base+pTap-power)*Math.min(1,dt*AJ.tapSuave)}}
 power=clamp(power,0,AJ.pMax);
 if(emp||mar){const t0=FTP*AJ.empTetoMin;let teto=t0+(AJ.pMax-t0)*Math.pow(clamp(stamina/AJ.empTetoCheia,0,1),AJ.empTetoExp);
  if(mar&&stamina<FRI.zona)teto=lerp(FTP*FRI.tetoZero,teto,stamina/FRI.zona);   // stamina zerada: ainda pedala, a 85% do FTP
  power=Math.min(power,mar?teto:Math.max(Math.min(base,FTP*AJ.empLivre),teto))}
 pShow=lerp(pShow,power,Math.min(1,dt*AJ.hudSuave));wHud=lerp(wHud,power,Math.min(1,dt*3.5));   // número de watts do HUD: mais suave, dá para segurar um valor
 const r=power/FTP;pSoma+=power*dt;pTempo+=dt;
 // 2) fadiga: resistência (sempre) + esforço pela potência real × tanque + insistir exausto; só água e gel reduzem
 const tanque=1+AJ.fadTanque*Math.pow(1-clamp(stamina/100,0,1),AJ.fadTanqueExp);
 let df=(mar?curva(AJ.empFad,r)*(FRI.fad[friZ]||1)*(stamina<FRI.zona?FRI.exausto:1)
  :(emp?curva(AJ.empFad,r):AJ.fadResist+curva(AJ.fadInt,r)*tanque)+(boost&&stamina<4?AJ.fadExausto:0))*dt;
 if(waterEffect>0){const q=Math.min(aguaResta,AJ.aguaFad/AJ.aguaSeg*dt);aguaResta-=q;df-=q;waterEffect=Math.max(0,waterEffect-dt)}
 fatigue=clamp(fatigue+df,0,100);
 const cap=100-fatigue;
 // 3) stamina: pressionado gasta conforme a intensidade; solto recupera na hora; teto 100 − fadiga
 // Contrarrelógio: apertado gasta (por intensidade), solto recupera; acima do FTP a bateria de explosão desconta sempre
 if(mar){const wp=Math.max(0,power-FTP)/AJ.empWp*100;stamina=clamp(stamina+((friSeg?-FRI.gasto:FRI.recupera)-wp)*dt,0,cap)}   // fricção: segurando come a stamina; solto recupera
 else if(emp){const wp=Math.max(0,power-FTP)/AJ.empWp*100;stamina=clamp(stamina+((active?(holdT<AJ.empSegura?-curva(AJ.empAperta,r):0):AJ.empRecupera)-wp)*dt,0,cap)}   // no sprint (segurando > empSegura) só a bateria gasta
 else if(!emp)stamina=sprint?Math.max(0,stamina-curva(AJ.staGasto,r)*dt):active?stamina:Math.min(cap,stamina+AJ.staRecupera*dt);stamina=Math.min(stamina,cap);
 if(fatigue>=99.9){finish(false);return}
 // 4) física (velocidade com inércia): m·dv/dt = η·P/v − resistências (integrada em dt·kin, 4 subpassos)
 const m=AJ.peso+AJ.bike,h=dt*AJ.kin/4;let v=speed/3.6;
 for(let i=0;i<4;i++){const a=(AJ.eta*power/Math.max(v,AJ.vmin)-resist(v))/m;v=clamp(v+a*h,1.1,AJ.vmax/3.6)}
 speed=v*3.6;if(mar)friDepois(dt);
 // 5) distância (tempo de jogo)
 {const d0=dist;dist+=speed*dt/3600*SCALE;if(grade>0&&dist>0)elevG+=grade/100*(dist-Math.max(0,d0))*1000}if(dist>=GOAL){dist=GOAL;finish(true)}
}
