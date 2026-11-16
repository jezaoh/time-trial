/* ===== CONQUISTAS — lote da planilha Time_Trial_V2_Conquistas_100.xlsx =====
   As 6 originais (extras.js) continuam iguais. Aqui entram as sugestões que dá para medir com o que o jogo já tem.
   Ficaram de fora (dependem de mecânica que não existe ou de definição do dono): TT-020, 021, 025–028, 033–036, 045, 049,
   073, 092, 097–099. Ver PENDENCIAS.md.
   Contadores permanentes em CS.cq (salvo em tt2_car); estatísticas da pedalada atual em CQS (zerado a cada largada).
   "Pedalada" = qualquer saída da Carreira (Pedal Livre, Rachão, Corrida). O Contrarrelógio só conta nas conquistas dele.
   Tempo em horas = relógio da prova (o do HUD). */
const CQ_CAT=[{k:'dist',n:'DISTÂNCIA E RESISTÊNCIA',ab:'KM'},{k:'vel',n:'VELOCIDADE E POTÊNCIA',ab:'KM/H'},{k:'sub',n:'SUBIDAS E MONTANHAS',ab:'%'},
 {k:'pel',n:'PELOTÃO E VÁCUO',ab:'VÁC'},{k:'sta',n:'STAMINA E FADIGA',ab:'STA'},{k:'ali',n:'ALIMENTAÇÃO',ab:'GEL'},{k:'rac',n:'RACHÃO E COMPETIÇÃO',ab:'1º'},
 {k:'cr',n:'CONTRARRELÓGIO',ab:'CR'},{k:'moe',n:'MOEDAS',ab:'$'}];
// dificuldade → recompensa padrão da planilha e cor da medalha provisória
// 16/11 (dono aprovou): conquista paga reconhecimento e acesso, não dinheiro. Muito fácil = só a medalha; difícil = libera peça
// da GARAGEM para compra; lendária = peça exclusiva + título (garagem.js, GAR_LIB/GAR_LEND). Antes: 15 · 25+banana · 50+banana+iso ·
// 100+iso+2 géis · 250+3 géis (~6.600 moedas no total; agora ~1.900).
const CQ_DIF={mf:{rec:{},c:'#d08a4a'},f:{rec:{moedas:10},c:'#d08a4a'},m:{rec:{moedas:25},c:'#d9e2ea'},
 d:{rec:{moedas:50},c:'#ffd23a'},l:{rec:{},c:'#c07cff'}};
// texto da recompensa: moedas/itens + peça da garagem (liberada ou exclusiva) + título
function cqRecTxt(c){const L=[],r=recTxt(c.rec||{});if(r)L.push(r);if(typeof garConqTxt==='function'){const g=garConqTxt(c.id);if(g)L.push(g)}
 if(c.titulo)L.push(`título "${c.titulo}"`);return L.join(' · ')||'só a medalha'}
let CQS=null,CQF=null;   // CQS: pedalada atual · CQF: dados do fim de prova (só durante a checagem do fim)
const cqQ=k=>(CS.cq&&CS.cq[k])||0;
const cqVivo=()=>MODO==='carreira'&&(state==='run'||state==='over')&&CQS&&CQS.ok;
const cqDist=()=>cqVivo()?Math.max(0,dist):0;
const cqKm=()=>cqQ('km')+(cqVivo()&&!CQS.fim?Math.max(0,dist):0);
const cqElev=()=>cqQ('elev')+(cqVivo()&&!CQS.fim?elevG:0);
const cqPedais=()=>(CS.livres||0)+(CS.treinos||0)+(CS.corridas||0);
const cqVac=()=>cqVivo()&&LV?LV.vacKm:0;
const cqRace=()=>CQF&&(CQF.tipo==='treino'||CQF.tipo==='corrida');
const cqVenceu=()=>cqRace()&&CQF.venceu;
const cqRachaoV=()=>CQF&&CQF.tipo==='treino'&&CQF.venceu;
// [id, categoria, nome, condição, dificuldade, teste, recompensa (se diferente do padrão)]
const CQ_NOVAS=[
 ['t001','dist','PRIMEIRAS PEDALADAS','Pedal Livre: 5 km','mf',()=>(cqVivo()&&LV&&LV.livre&&dist>=5)||(CS.recLivre||0)>=5],
 ['t002','dist','AQUECIMENTO CONCLUÍDO','10 km em uma pedalada','f',()=>cqDist()>=10||(CS.recLivre||0)>=10||Object.keys(CS.rec||{}).length>0],
 ['t003','dist','A ESTRADA É MINHA','150 km em uma pedalada','m',()=>cqDist()>=150||(CS.recLivre||0)>=150],
 ['t004','dist','ULTRA CICLISTA','200 km em uma pedalada','d',()=>cqDist()>=200||(CS.recLivre||0)>=200],
 ['t005','dist','SEM HORA PRA VOLTAR','3 horas numa pedalada (relógio da prova)','d',()=>cqVivo()&&elapsed*SCALE>=3*3600],
 ['t006','dist','DIA INTEIRO NO SELIM','5 horas numa pedalada (relógio da prova)','d',()=>cqVivo()&&elapsed*SCALE>=5*3600],
 ['t007','dist','QUILOMETRAGEM DE RESPEITO','Acumule 500 km','f',()=>cqKm()>=500],
 ['t008','dist','DE CIDADE EM CIDADE','Acumule 1.000 km','m',()=>cqKm()>=1000],
 ['t009','dist','RODADOR INCANSÁVEL','Acumule 2.500 km','m',()=>cqKm()>=2500],
 ['t010','dist','LENDA DO ASFALTO','Acumule 5.000 km','d',()=>cqKm()>=5000],
 ['t011','dist','O MUNDO É PEQUENO','Acumule 10.000 km','l',()=>cqKm()>=10000],
 ['t012','dist','MAIS UMA VOLTA','Complete 10 pedaladas','m',()=>cqPedais()>=10],
 ['t013','dist','FREQUENTADOR DA ESTRADA','Complete 50 pedaladas','f',()=>cqPedais()>=50],
 ['t014','dist','VETERANO DO PEDAL','Complete 100 pedaladas','f',()=>cqPedais()>=100],
 ['t015','dist','MORADOR DA RODOVIA','Complete 250 pedaladas','l',()=>cqPedais()>=250],
 ['t016','vel','PASSOU VOANDO','Alcance 40 km/h','mf',()=>cqVivo()&&CQS.maxV>=40],
 ['t017','vel','BALA DE PRATA','Alcance 50 km/h','f',()=>cqVivo()&&CQS.maxV>=50],
 ['t018','vel','SEM FREIOS','Alcance 60 km/h','m',()=>cqVivo()&&CQS.maxV>=60],
 ['t019','vel','FOGUETE HUMANO','Alcance 70 km/h','d',()=>cqVivo()&&CQS.maxV>=70],
 ['t022','vel','PÉ DE CHUMBO','Atinja 500 W','f',()=>cqVivo()&&CQS.maxW>=500],
 ['t023','vel','EXPLOSÃO DE POTÊNCIA','Atinja 800 W','f',()=>cqVivo()&&CQS.maxW>=800],
 ['t024','vel','MIL WATTS DE FÚRIA','Atinja 1.000 W','d',()=>cqVivo()&&CQS.maxW>=1000],
 ['t029','sub','COMEÇOU A SOFRER','Vença uma subida de 5%','mf',()=>cqVivo()&&CQS.subMax>=5],
 ['t030','sub','PERNA DE ESCALADOR','Vença uma subida de 8%','d',()=>cqVivo()&&CQS.subMax>=8],
 ['t031','sub','PAREDE DE CONCRETO','Vença uma subida de 12%','f',()=>cqVivo()&&CQS.subMax>=12],
 ['t032','sub','ISSO É UMA RUA?','Vença uma subida de 15%','m',()=>cqVivo()&&CQS.subMax>=15],
 ['t037','sub','SOFRIMENTO VOLUNTÁRIO','Chegue ao topo com menos de 10% de stamina','f',()=>cqVivo()&&CQS.subSta],
 ['t038','sub','ÚLTIMA MARCHA','Vença uma subida passando abaixo de 8 km/h','f',()=>cqVivo()&&CQS.subLenta],
 ['t039','sub','QUANTO MAIS SOBE...','Acumule 5.000 m de subida','m',()=>cqElev()>=5000],
 ['t040','sub','...MAIS ALTO CHEGA','Acumule 20.000 m de subida','l',()=>cqElev()>=20000],
 ['t041','pel','PEGUEI A RODA','Entre no vácuo de um ciclista','mf',()=>cqVivo()&&CQS.teveVac],
 ['t042','pel','PASSAGEIRO VIP','5 km no vácuo em uma pedalada','m',()=>cqVac()>=5],
 ['t043','pel','NA SOMBRA DOS GIGANTES','25 km no vácuo em uma pedalada','d',()=>cqVac()>=25],
 ['t044','pel','RODA DE CONFIANÇA','50 km no vácuo em uma pedalada','d',()=>cqVac()>=50],
 ['t046','pel','NÃO ME DEIXA!','Perca a roda (3 s) e volte para ela','f',()=>cqVivo()&&CQS.voltouRoda],
 ['t047','pel','PUXADOR DE PELOTÃO','5 km na frente de um grupo','f',()=>cqVivo()&&CQS.frenteKm>=5],
 ['t048','pel','MOTOR DO GRUPO','20 km na frente de um grupo','m',()=>cqVivo()&&CQS.frenteKm>=20],
 ['t050','pel','FUGA SOLITÁRIA','Rachão/Corrida: 5 km sozinho na liderança','d',()=>cqVivo()&&CQS.soloMax>=5],
 ['t051','pel','NINGUÉM ME SEGURA','Vença um Rachão sem pegar vácuo','m',()=>cqRachaoV()&&CQF.vacKm<.1],
 ['t052','pel','OPORTUNISTA','Vença um Rachão com metade da prova no vácuo','l',()=>cqRachaoV()&&CQF.vacKm>=CQF.km/2],
 ['t053','sta','NA RESERVA','Fique com menos de 10% de stamina','mf',()=>cqVivo()&&CQS.minSta<10],
 ['t054','sta','QUEBROU!','Zere a stamina','m',()=>cqVivo()&&CQS.zerou],
 ['t055','sta','RESSUSCITADO','Zere a stamina e volte a 50%','d',()=>cqVivo()&&CQS.ressus],
 ['t056','sta','VOLTOU DOS MORTOS','Vença um Rachão depois de zerar a stamina','m',()=>cqRachaoV()&&CQF.zerou],
 ['t057','sta','GESTÃO DE ENERGIA','30 km sem zerar a stamina','m',()=>cqVivo()&&!CQS.zerou&&dist>=30],
 ['t058','sta','DOSAGEM PERFEITA','70 km sem zerar a stamina','d',()=>cqVivo()&&!CQS.zerou&&dist>=70],
 ['t059','sta','MOTOR DIESEL','100 km sem zerar a stamina','d',()=>cqVivo()&&!CQS.zerou&&dist>=100],
 ['t060','sta','SOBREVIVENTE','Termine um Rachão com menos de 5% de stamina','d',()=>CQF&&CQF.tipo==='treino'&&CQF.chegou&&CQF.sta<5],
 ['t061','sta','NO LIMITE','Termine Rachão ou Corrida com fadiga acima de 90%','d',()=>cqRace()&&CQF.chegou&&CQF.fad>90],
 ['t062','sta','RECUPERAÇÃO MILAGROSA','Baixe a fadiga de 90% para menos de 30%','f',()=>cqVivo()&&CQS.fadRec],
 ['t063','sta','SEM SUPLEMENTOS','50 km sem itens (só a água básica)','m',()=>cqVivo()&&!CQS.usou&&dist>=50],
 ['t064','sta','SÓ NA RAÇA','100 km sem itens (só a água básica)','l',()=>cqVivo()&&!CQS.usou&&dist>=100],
 ['t065','ali','HORA DO LANCHE','Coma sua primeira banana','mf',()=>cqQ('banana')>=1],
 ['t066','ali','BANANA É VIDA','Coma 25 bananas','m',()=>cqQ('banana')>=25],
 ['t067','ali','REI DAS BANANAS','Coma 100 bananas','f',()=>cqQ('banana')>=100],
 ['t068','ali','HIDRATAÇÃO EM DIA','Tome 25 goles de água','m',()=>cqQ('agua')>=25],
 ['t069','ali','SEDE INFINITA','Tome 100 goles de água','m',()=>cqQ('agua')>=100],
 ['t070','ali','ENERGIA LÍQUIDA','Tome 25 goles de isotônico','d',()=>cqQ('iso')>=25],
 ['t071','ali','GELZINHO SALVOU','Tome 10 géis','f',()=>cqQ('gel')>=10],
 ['t072','ali','FARMÁCIA AMBULANTE','Tome 100 géis','d',()=>cqQ('gel')>=100],
 ['t074','ali','CARDÁPIO COMPLETO','Água, isotônico, banana e gel na mesma pedalada','f',()=>cqVivo()&&CQS.cons.agua&&CQS.cons.iso&&CQS.cons.banana&&CQS.cons.gel],
 ['t075','rac','ESTREIA VITORIOSA','Vença seu primeiro Rachão','mf',()=>cqQ('vitR')>=1],
 ['t076','rac','TÁ GOSTANDO DE GANHAR','Vença 5 Rachões','m',()=>cqQ('vitR')>=5],
 ['t077','rac','COLECIONADOR DE VITÓRIAS','Vença 25 Rachões','f',()=>cqQ('vitR')>=25],
 ['t078','rac','IMBATÍVEL','Vença 100 Rachões','l',()=>cqQ('vitR')>=100],
 ['t079','rac','PÓDIO GARANTIDO','Pódio (top 3) em 10 Rachões','f',()=>cqQ('podR')>=10],
 ['t080','rac','QUASE LÁ','Termine um Rachão em 2º lugar','d',()=>CQF&&CQF.tipo==='treino'&&CQF.chegou&&CQF.pos===2],
 ['t081','rac','FOTOFINISH','Rachão/Corrida: vença por menos de 1 s','d',()=>cqVenceu()&&CQF.gap<1],
 ['t082','rac','DE ÚLTIMO A PRIMEIRO','Rachão/Corrida: vença depois de estar em último','d',()=>cqVenceu()&&CQF.foiUlt],
 ['t083','rac','REMONTADA ÉPICA','Rachão/Corrida: ganhe 5 posições nos últimos 2 km','d',()=>cqRace()&&CQF.chegou&&CQF.pos2-CQF.pos>=5],
 ['t084','rac','VITÓRIA SOLITÁRIA','Rachão/Corrida: vença por mais de 1 min','d',()=>cqVenceu()&&CQF.gap>60&&CQF.gap<1e8],
 ['t085','rac','SEM DAR CHANCE','Rachão/Corrida: lidere do km 1 até a chegada','d',()=>cqVenceu()&&!CQF.perdeuLid],
 ['t086','rac','CASCA-GROSSA','Vença 5 Rachões seguidos','l',()=>cqQ('seqR')>=5],
 ['t087','cr','CONTRA O RELÓGIO','Complete seu primeiro contrarrelógio','mf',()=>cqQ('cr')>=1],
 ['t088','cr','MELHOR QUE ONTEM','Bata seu recorde no contrarrelógio','m',()=>CQF&&CQF.tipo==='crono'&&CQF.crMel>0],
 ['t089','cr','CADA SEGUNDO CONTA','Melhore o recorde do CR em 10 s ou mais','f',()=>CQF&&CQF.tipo==='crono'&&CQF.crMel>=10],
 ['t090','cr','ESPECIALISTA EM CR','Complete 25 contrarrelógios','d',()=>cqQ('cr')>=25],
 ['t091','cr','MÁQUINA DE PRECISÃO','Contrarrelógio sem zerar a stamina','f',()=>CQF&&CQF.tipo==='crono'&&CQF.chegou&&!CQF.zerou],
 ['t093','cr','CONTRA O VENTO','Complete 50 contrarrelógios','l',()=>cqQ('cr')>=50],
 ['t094','moe','PRIMEIRO TROCADO','Pegue sua primeira moeda na pista','mf',()=>cqVivo()&&LV&&LV.pegos.moeda>=1],
 ['t095','moe','COFRINHO CHEIO','Ganhe 1.000 moedas pedalando','d',()=>cqQ('moedas')>=1000],
 ['t096','moe','MAGNATA DO PEDAL','Ganhe 10.000 moedas pedalando','l',()=>cqQ('moedas')>=10000],
 ['t100','moe','CICLISTA COMPLETO','Uma conquista de cada categoria','l',()=>CQ_CAT.every(g=>CONQ.some(c=>c.cat===g.k&&c.id!=='t100'&&CS.conq&&CS.conq[c.id]))]];
// as 6 originais ganham categoria; as novas entram na mesma lista (aviso, NOVA, recompensa e salvamento são os de extras.js)
for(const c of CONQ)c.cat=c.id==='vac10'?'pel':'dist';
for(const[id,cat,n,d,dif,ok,rec]of CQ_NOVAS)CONQ.push({id,cat,n,d,dif,ok,rec:rec||CQ_DIF[dif].rec});
function cqChecar(mudo){if(typeof CS==='undefined')return;CS.conq=CS.conq||{};for(const c of CONQ){if(!c.ok||CS.conq[c.id])continue;let v=false;try{v=c.ok()}catch(e){}if(v)conqDar(c,mudo)}}
// retroativo (só com o que já estava salvo): distâncias (recLivre, Rachão concluído), nº de pedaladas e 1ª vitória no Rachão
function cqRetro(){CS.cq=Object.assign(carNovo().cq,CS.cq||{});
 if(!CS.cq.ini){const v=Object.values(CS.melhorPos||{}).filter(p=>p===1).length;CS.cq.vitR=Math.max(CS.cq.vitR,v);CS.cq.ini=1;carSalvar()}   // vitórias: o mínimo comprovado (1 por distância vencida)
 cqChecar(true)}
cqRetro();
// ---------- largada: zera as estatísticas da pedalada ----------
const _cqReset=reset;
reset=function(){_cqReset();CQS={ok:true,fim:false,maxV:0,maxW:0,minSta:100,zerou:false,ressus:false,fad90:false,fadRec:false,usou:false,cons:{agua:false,iso:false,banana:false,gel:false},
 subMax:0,sub:null,subSta:false,subLenta:false,teveVac:false,semVac:0,voltouRoda:false,frenteKm:0,soloKm:0,soloMax:0,foiUlt:false,perdeuLid:false,pos2:0,ant:null};
 if(typeof CS!=='undefined')CS.cq=Object.assign(carNovo().cq,CS.cq||{})};
// itens consumidos: o que DIMINUIU entre um quadro e outro (pegar na pista só aumenta; os botões chamam as funções direto)
function cqItens(){return{agua:water+(LV?LV.agua7:0),iso:LV?LV.iso:0,banana:LV?LV.banana:0,gel:gel,azul:LV&&LV.azulUsou?1:0}}
const _cqUpd=update;
update=function(dt){const S=CQS,on=S&&state==='run'&&!(typeof CONT!=='undefined'&&CONT>0);
 if(on&&S.ant){const a=S.ant,b=cqItens(),car=MODO==='carreira';
  for(const k of['agua','iso','banana','gel']){const n=a[k]-b[k];if(n>0){S.cons[k]=true;if(k!=='agua')S.usou=true;if(car)CS.cq[k]=(CS.cq[k]||0)+n}}
  if(b.azul>a.azul)S.usou=true}
 const d0=dist;_cqUpd(dt);
 if(!on||state!=='run'){if(S&&state==='run')S.ant=cqItens();return}
 const dd=Math.max(0,dist-Math.max(0,d0));
 S.maxV=Math.max(S.maxV,speed);S.maxW=Math.max(S.maxW,power);S.minSta=Math.min(S.minSta,stamina);
 if(stamina<=.5)S.zerou=true;else if(S.zerou&&stamina>=50)S.ressus=true;
 if(fatigue>=90)S.fad90=true;else if(S.fad90&&fatigue<30)S.fadRec=true;
 // subida: começa acima de 2%, termina no topo (≤ 0,5%); vale o pico do trecho
 const g=terrain(dist);if(!S.sub&&g>2)S.sub={pk:g,minV:speed};
 if(S.sub){S.sub.pk=Math.max(S.sub.pk,g);S.sub.minV=Math.min(S.sub.minV,speed);if(g<=.5){S.subMax=Math.max(S.subMax,S.sub.pk);if(stamina<10)S.subSta=true;if(S.sub.minV<8)S.subLenta=true;S.sub=null}}
 // vácuo de um ciclista (não conta o do caminhão); perdeu por 3 s e voltou
 const vacNpc=vacuo>.05&&!(LV&&LV.vacV>.05);
 if(vacNpc){if(S.teveVac&&S.semVac>=3)S.voltouRoda=true;S.teveVac=true;S.semVac=0}else if(S.teveVac)S.semVac+=dt;
 // na frente de um grupo: 2+ ciclistas logo atrás e ninguém à frente dando vácuo
 if(dd>0&&vacuo<.05&&typeof NPCS!=='undefined'){let n=0;for(const r of NPCS){if(r.sentado||r.dnf)continue;const gp=(dist-r.dist)*PX_KM;if(gp>0&&gp<600)n++}if(n>=2)S.frenteKm+=dd}
 // Rachão/Corrida: posição
 if(CORR.on&&dist>0){const p=corridaPos(),N=CORR.riders.filter(r=>!r.dnf).length+1;
  if(dist>.2&&p===N)S.foiUlt=true;if(dist>=1&&p!==1)S.perdeuLid=true;if(!S.pos2&&dist>=GOAL-2)S.pos2=p;
  const perto=CORR.riders.some(r=>!r.dnf&&(dist-r.dist)*PX_KM>=0&&(dist-r.dist)*PX_KM<700);
  if(p===1&&!perto){S.soloKm+=dd;S.soloMax=Math.max(S.soloMax,S.soloKm)}else S.soloKm=0}
 S.ant=cqItens();
 if(MODO==='carreira')cqChecar(false)};
// ---------- fim de prova: contadores permanentes e conquistas de resultado ----------
const _cqFin=finish;
finish=function(w){_cqFin(w);const S=CQS;if(!S||S.fim)return;S.fim=true;if(typeof CS==='undefined')return;const Q=CS.cq;
 if(MODO==='crono'){if(!w)return;const t=elapsed*SCALE,old=Q.crRec||0;Q.cr=(Q.cr||0)+1;
  CQF={tipo:'crono',chegou:true,zerou:S.zerou,crMel:old?old-t:0};if(!old||t<old)Q.crRec=t;carSalvar();cqChecar(false);CQF=null;return}
 if(MODO!=='carreira'||!carRes)return;const r=carRes,aband=!!r.aband,chegou=!!w&&!aband&&r.tipo!=='livre';
 Q.km=(Q.km||0)+Math.max(0,dist);Q.elev=(Q.elev||0)+elevG;Q.moedas=(Q.moedas||0)+(r.moedas||0);
 let gap=1e9;if(chegou&&r.pos===1){const o=CORR.riders.filter(x=>!x.dnf&&x.fim==null).sort((a,b)=>b.dist-a.dist)[0];if(o)gap=Math.max(0,GOAL-o.dist)/Math.max(5,o.v*3.6)*3600}
 if(r.tipo==='treino'){if(chegou&&r.pos===1){Q.vitR=(Q.vitR||0)+1;Q.seqR=(Q.seqR||0)+1}else Q.seqR=0;if(chegou&&r.pos<=3)Q.podR=(Q.podR||0)+1}
 CQF={tipo:r.tipo,chegou,venceu:chegou&&r.pos===1,pos:r.pos,km:GOAL,gap,vacKm:LV?LV.vacKm:0,zerou:S.zerou,sta:stamina,fad:fatigue,foiUlt:S.foiUlt,perdeuLid:S.perdeuLid,pos2:S.pos2||r.pos};
 carSalvar();cqChecar(false);CQF=null};
// zerar a Carreira: recomeça os contadores também (carNovo já traz cq zerado); confere o retroativo de novo
const _cqHub=drawHub;drawHub=function(){if(CS.cq&&!CS.cq.ini)cqRetro();_cqHub()};
// aviso de conquista também por cima da tela de resultado (e no Contrarrelógio)
const _cqOv=overlay;overlay=function(){_cqOv();if(state==='over'&&TOAST.length)conqToast()};
// ---------- tela CONQUISTAS: uma categoria por página (10 cartões), setas ◀ ▶ ----------
let CQ_PAG=0;
function cqPaginas(){const P=[];for(const g of CQ_CAT){const L=CONQ.filter(c=>c.cat===g.k);for(let i=0;i<L.length;i+=10)P.push({g,L:L.slice(i,i+10),i:Math.floor(i/10)+1,n:Math.ceil(L.length/10)})}return P}
function cqMedalha(c,cx,cy,r,ok){const g=CQ_CAT.find(x=>x.k===c.cat),cor=c.dif?CQ_DIF[c.dif].c:MN.ama;ctx.save();if(!ok)ctx.globalAlpha=.45;
 ctx.fillStyle='#e8402a';ctx.beginPath();ctx.moveTo(cx-r*.7,cy+r*.3);ctx.lineTo(cx-r*.95,cy+r*1.35);ctx.lineTo(cx-r*.5,cy+r*1.1);ctx.lineTo(cx-r*.2,cy+r*1.4);ctx.lineTo(cx,cy+r*.4);ctx.fill();
 ctx.fillStyle='#1b6fd1';ctx.beginPath();ctx.moveTo(cx+r*.7,cy+r*.3);ctx.lineTo(cx+r*.95,cy+r*1.35);ctx.lineTo(cx+r*.5,cy+r*1.1);ctx.lineTo(cx+r*.2,cy+r*1.4);ctx.lineTo(cx,cy+r*.4);ctx.fill();
 ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fillStyle=ok?cor:'#9aa8b8';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=MN.esc;ctx.stroke();
 ctx.beginPath();ctx.arc(cx,cy,r*.74,0,7);ctx.lineWidth=3;ctx.strokeStyle='#0a142688';ctx.stroke();
 ctx.font=FT(900,g.ab.length>2?Math.round(r*.5):Math.round(r*.72));ctx.fillStyle=MN.esc;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(g.ab,cx,cy+2);ctx.textBaseline='alphabetic';ctx.restore()}
drawConquistas=function(){fundo();tituloGrande('CONQUISTAS',84,72);btnVoltar('VOLTAR',()=>{CS.conqNovas=[];carSalvar();toHub()});moedasChip();
 CS.conq=CS.conq||{};const nv=CS.conqNovas||[],tem=CONQ.filter(c=>CS.conq[c.id]).length,P=cqPaginas();CQ_PAG=(CQ_PAG+P.length)%P.length;const pg=P[CQ_PAG];
 // categoria + setas
 seta(70,146,-1,()=>{CQ_PAG--});seta(842,146,1,()=>{CQ_PAG++});
 const temG=CONQ.filter(c=>c.cat===pg.g.k&&CS.conq[c.id]).length,totG=CONQ.filter(c=>c.cat===pg.g.k).length;
 txFit(pg.g.n+(pg.n>1?` (${pg.i}/${pg.n})`:''),456,140,32,640,'center',MN.tit);tx(`${temG} de ${totG} · página ${CQ_PAG+1} de ${P.length}`,456,172,20,'center','#fff');
 if(P.some((p,i)=>i!==CQ_PAG&&p.L.some(c=>nv.includes(c.id)))){const L=P.map((p,i)=>p.L.some(c=>nv.includes(c.id))?i+1:0).filter(Boolean);tx(`NOVAS na página ${L.join(', ')}`,456,196,18,'center',MN.ama)}
 // progresso geral
 tx(`${tem} DE ${CONQ.length}`,1170,158,30,'right','#fff');const px=1186,pw=316,ph=36,py=130;rr(px,py,pw,ph,ph/2);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=MN.esc;ctx.stroke();
 if(tem){rr(px+6,py+6,Math.max(ph-12,(pw-12)*tem/CONQ.length),ph-12,(ph-12)/2);ctx.fillStyle=MN.ama;ctx.fill()}
 pg.L.forEach((c,i)=>{const w=728,h=120,x=32+(i%2)*(w+16),y=210+Math.floor(i/2)*(h+10),ok=!!CS.conq[c.id],nova=nv.includes(c.id);
  cardMenu(x,y,w,h,nova?MN.ama:ok?MN.borda:MN.cinza,nova?7:4,20);
  // conquista NOVA: borda amarela pulsando com brilho (some quando você sai da tela pelo VOLTAR)
  if(nova){const p=.5+.5*Math.sin(T*5);ctx.save();ctx.shadowColor=MN.ama;ctx.shadowBlur=12+26*p;ctx.globalAlpha=.55+.45*p;ctx.lineWidth=5+4*p;ctx.strokeStyle=MN.ama;rr(x,y,w,h,20);ctx.stroke();ctx.restore()}
  const art=IMG[CONQ_ARTE[c.id]];if(art&&art.width){const ah=h-12,aw=art.width*ah/art.height;ctx.save();if(!ok){ctx.filter='grayscale(1) brightness(.85)';ctx.globalAlpha=.8}ctx.drawImage(art,x+60-aw/2,y+6,aw,ah);ctx.restore()}
  else cqMedalha(c,x+62,y+50,36,ok);
  ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(x+128,y+18);ctx.lineTo(x+124,y+h-18);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+w-132,y+18);ctx.lineTo(x+w-136,y+h-18);ctx.stroke();
  const tw=w-128-150;txFit(c.n,x+142,y+38,28,tw,'left',MN.tit);txFit(c.d,x+142,y+70,21,tw,'left','#fff');
  txFit(cqRecTxt(c),x+142,y+100,19,tw,'left',c.dif==='l'?'#e0b8ff':'#cfe3f1');
  const sx=x+w-66;if(ok){visto(sx,y+50,.75);tx(nova?'NOVA!':'CONQUISTADA',sx,y+102,nova?24:17,'center',nova?MN.tit:MN.verde)}
  else{ctx.save();ctx.translate(sx,y+44);ctx.scale(.8,.8);cadeado(0,0);ctx.restore();tx('BLOQUEADA',sx,y+102,17,'center','#fff')}})};
addEventListener('keydown',e=>{if(state!=='conquistas'||pnl||e.defaultPrevented)return;if(e.code==='ArrowLeft')CQ_PAG--;else if(e.code==='ArrowRight')CQ_PAG++});
