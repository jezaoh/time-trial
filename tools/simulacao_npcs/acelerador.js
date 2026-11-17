// Robô do ACELERADOR (desde 16/11 vale em todos os modos): aperta quando os watts estão abaixo do alvo, solta acima.
// Uso: rodar.py HTML "ACEL({tipo:'treino',km:30,w:180,nivel:1})"  — devolve JSON com média, fadiga, colocação etc.
//   tipo: 'treino' (Rachão) · 'corrida' · 'livre' · solo:true tira os NPCs (para medir "sozinho")
//   w: alvo em W · rel: alvo em fração do FTP (no lugar de w) · kit:true leva iso, 3 géis e 5 bananas
//   roda:true = robô "tático": cola na roda de quem está à frente (vácuo), ataca no último km
// Uso de itens: água com fadiga > 35, isotônico > 30, banana > 50, gel > 55 (gel azul se fadiga > 90 e tiver).
window.ACEL=function(o){o=Object.assign({tipo:'treino',km:30,nivel:1,motor:0,folego:0,recup:0,escalada:0,sprint:0,pat:0,kit:false,solo:false,roda:false,n:1},o);const out=[];
 for(let k=0;k<o.n;k++){MODO='carreira';CS=carNovo();CS.nivel=o.nivel;Object.assign(CS.sk,{motor:o.motor,folego:o.folego,recup:o.recup,escalada:o.escalada,sprint:o.sprint});CS.pat=o.pat;
  CS.inv=o.kit?{iso:1,gel:3,banana:5,azul:o.azul?1:0}:{iso:0,gel:0,banana:0,azul:0};CS.mochila=o.kit?['iso','gel','banana']:[];carTipo=o.tipo;carProva=o.km;
  reset();if(o.solo){corridaParar();NPCS=[]}CONT=-1;state='run';draw();
  const alvo=o.w||FTP*(o.rel||.9);let fr=0,vac=0,pres=0,minSta=100;const vistos={km1:null,s:new Set()};
  while(state==='run'&&fr<1e6){let w=alvo;
   if(o.roda){const fim=GOAL<9999&&dist>GOAL-1;let g=1e9;for(const r of (CORR.on?CORR.riders:NPCS.filter(n=>n.ia&&!n.sentado))){if(r.dnf)continue;const d=(r.dist-dist)*PX_KM;if(d>0&&d<g)g=d}
    w=fim?9999:g<1500?(g>230?alvo*1.25:alvo*.9):alvo}
   // 18/11 (pedalada "o dedo é a força" em todos os modos): o robô TOCA como gente — toque de 0,2 s quando cai do alvo;
   // só continua segurando se o toque não bastou (antes segurava direto: com CRN isso seca a barra, o que ninguém faz)
   if(w>=9999)boost=stamina>1;else if(typeof CRN!=='undefined'&&CRN.on){const L=clamp((w*1.06-CRN.base*FTP)/(CRN.porSeg*FTP/250),.15,3);boost=boost?holdT<L:power<w}else boost=power<w;if(boost)pres++;
   if(fatigue>35&&water>0&&waterEffect<=0)drink();if(LV&&LV.iso>0&&LV.isoT<=0&&fatigue>30)tomarIso();if(LV&&LV.banana>0&&fatigue>50)comerBanana();if(fatigue>55&&gel>0)eat();
   if(LV&&LV.azul>0&&!LV.azulUsou&&fatigue>90)gelAzul();
   update(1/60);T+=1/60;fr++;if(vacuo>.05)vac++;
   if(o.tipo==='livre'&&fr%10==0)for(const n of NPCS){if(!n.ia)continue;const x=bikeX+(n.dist-dist)*PX_KM;if(x>WX0&&x<WX1){if(vistos.km1==null)vistos.km1=+dist.toFixed(1);vistos.s.add(n)}}minSta=Math.min(minSta,stamina);if(fr%20==0)draw();if(o.tipo==='livre'&&dist>=(o.ate||400))break}
  const t=elapsed*SCALE,R=CORR.riders||[];
  out.push({tipo:o.tipo,km:o.tipo==='livre'?+dist.toFixed(1):GOAL,FTP,alvo:Math.round(alvo),W_medio:Math.round(pSoma/Math.max(1e-9,pTempo)),chegou:o.tipo==='livre'?null:!!won,
   media:+(dist*3600/Math.max(1,t)).toFixed(1),tempo_min:+(t/60).toFixed(1),seg_reais:Math.round(fr/60),fad_fim:Math.round(fatigue),sta_min:Math.round(minSta),
   pct_vacuo:Math.round(vac/fr*100),pct_apertado:Math.round(pres/fr*100),pos:carRes&&carRes.pos||null,
   media_venc:R.some(r=>r.fim!=null)?+(GOAL/(Math.min(...R.filter(r=>r.fim!=null).map(r=>r.fim))*SCALE/3600)).toFixed(1):null,
   agua:water,gel,iso:LV?LV.iso:0,...(o.tipo==='livre'?{km_1o_ciclista:vistos.km1,ciclistas_vistos:vistos.s.size,passeio:[...vistos.s].filter(n=>n.passeio).length}:{})})}
 return JSON.stringify(out.length===1?out[0]:out)};
// potência média que cada RITMO de toque produz (apertado a s, solto b s) — confere que vale igual em todos os modos
window.RITMO=function(tipo,a,b){MODO=tipo==='crono'?'crono':'carreira';CS=carNovo();carTipo=tipo==='crono'?'treino':tipo;carProva=30;reset();corridaParar();NPCS=[];CONT=-1;state='run';
 let t=0,s=0,n=0;for(let i=0;i<60*12;i++){boost=(t%(a+b))<a;update(1/60);t+=1/60;if(t>4){s+=power;n++}fatigue=0}return `${tipo} ${a}/${b}s: ${Math.round(s/n)} W (FTP ${FTP})`};
