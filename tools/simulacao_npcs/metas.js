// METAS DE BALANCEAMENTO (16/11) — o "SimulationCraft caseiro": roda robôs e confere se cada número ficou dentro da faixa
// combinada com o dono. Rode com:  python tools/simulacao_npcs/metas.py dist/time_trial_v2.html
// Para mudar uma meta: edite a lista METAS_LISTA (descrição, robô, campo, mínimo, máximo). Cada robô roda n vezes; TODAS
// as rodadas precisam ficar na faixa. Os robôs são simples (não caçam vácuo como gente): servem para comparar versões.
window.CRONO=function(w,itens){MODO='crono';reset();corridaParar();NPCS=[];CONT=-1;state='run';let fr=0;
 while(state==='run'&&fr<1e6){boost=power<w;if(itens){if(fatigue>35&&water>0&&waterEffect<=0)drink();if(fatigue>55&&gel>0)eat()}update(1/60);T+=1/60;fr++}
 return{chegou:!!won,fad_fim:Math.round(fatigue),km:+dist.toFixed(1),W_medio:Math.round(pSoma/Math.max(1e-9,pTempo))}};
const ok=(x,a,b)=>x!=null&&x>=a&&x<=b;
// [descrição, função que roda 1 vez e devolve um objeto, campo, mín, máx, rodadas]
window.METAS_LISTA=[
 ['Contrarrelógio 175 W com itens: chega folgado (fadiga ≤ 85)',()=>CRONO(175,true),'fad_fim',0,85,1],
 ['Contrarrelógio 200 W com itens: chega',()=>CRONO(200,true),'chegou',1,1,1],
 ['Contrarrelógio 230 W com itens: quebra',()=>CRONO(230,true),'chegou',0,0,1],
 ['Treino solo iniciante sem kit 150 W (30 km): chega',()=>JSON.parse(ACEL({tipo:'treino',km:30,nivel:1,solo:true,w:150})),'chegou',1,1,2],
 ['Treino solo iniciante sem kit 165 W (30 km): quebra',()=>JSON.parse(ACEL({tipo:'treino',km:30,nivel:1,solo:true,w:165})),'chegou',0,0,2],
 ['Corrida iniciante 90% FTP com kit: chega',()=>JSON.parse(ACEL({tipo:'corrida',km:30,nivel:1,kit:true,rel:.9})),'chegou',1,1,3],
 ['Corrida iniciante 90% FTP com kit: colocação ≤ 11',()=>JSON.parse(ACEL({tipo:'corrida',km:30,nivel:1,kit:true,rel:.9})),'pos',1,11,2],
 ['Rachão (dopado) iniciante 90% FTP com kit: chega',()=>JSON.parse(ACEL({tipo:'treino',km:30,nivel:1,kit:true,rel:.9})),'chegou',1,1,2],
 ['Rachão (dopado) nível 10 no máximo (kit+azul, caça roda): média do vencedor 36–42 km/h',()=>JSON.parse(ACEL({tipo:'treino',km:30,nivel:10,kit:true,azul:true,roda:true,w:400})),'media_venc',36,42,2],
 ['Rachão (dopado) nível 10 no máximo: não vence fácil (colocação 2–12)',()=>JSON.parse(ACEL({tipo:'treino',km:30,nivel:10,kit:true,azul:true,roda:true,w:400})),'pos',2,12,2],
 ['Rachão (dopado) nível 10 com tudo: segura ≤ 140% do FTP de média',()=>{const r=JSON.parse(ACEL({tipo:'treino',km:30,nivel:10,kit:true,azul:true,roda:true,w:450}));r.pct=Math.round(r.W_medio/r.FTP*100);return r},'pct',0,140,1],
 ['Pedal Livre iniciante 140 W: 55–110 km',()=>JSON.parse(ACEL({tipo:'livre',nivel:1,w:140,ate:200})),'km',55,110,1],
 ['Pedal Livre iniciante 160 W: 25–55 km',()=>JSON.parse(ACEL({tipo:'livre',nivel:1,w:160,ate:200})),'km',25,55,1],
];
window.METAS=function(i){const L=i==null?METAS_LISTA:[METAS_LISTA[i]],out=[];
 for(const[d,f,c,a,b,n]of L){const vals=[];let tudo=true;for(let k=0;k<n;k++){let v=f()[c];if(typeof v==='boolean')v=v?1:0;vals.push(v);if(!ok(v,a,b))tudo=false}
  out.push({ok:tudo,meta:d,campo:c,faixa:a===b?String(a):`${a}–${b}`,valores:vals})}
 return JSON.stringify(out)};
