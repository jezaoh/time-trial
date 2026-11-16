// Simulador V2: roda a MESMA mecânica do jogo (src/js/mecanica.js) no Node, sem navegador.
// Uso: node tools/balanceamento/sim_v2.js          -> relatório completo (botão, água/gel, 8 estratégias, busca)
//      node tools/balanceamento/sim_v2.js rapido   -> sem a busca de estratégias
const fs=require('fs'),path=require('path');
const J=f=>fs.readFileSync(path.join(__dirname,'../../src/js',f),'utf8');
const mk=()=>new Function(J('ranking.js')+'\n'+J('mecanica.js')+`;return{AJ,FTP,reset,update,drink,eat,vEq,curva,
 set:o=>{for(const k in o)eval(k+'=o[k]')},
 g:()=>({state,stamina,fatigue,water,gel,speed,dist,elapsed,won,grade,waterEffect,power,aguaResta})}`)();
const DT=1/60;
const hms=s=>[s/3600,s/60%60,s%60].map(v=>String(Math.floor(v)).padStart(2,'0')).join(':');

// ---------- botão em terreno plano ----------
function serie(S,secs,btn,ini){S.reset();S.set({speed:S.vEq(175,0),...(ini||{})});const out=[];
 for(let i=0;i<secs/DT;i++){const t=i*DT;S.set({boost:btn(t),grade:0,dist:1});S.update(DT);out.push({t:t+DT,b:btn(t),...S.g()});if(S.g().state!=='run')break}return out}
function testesBotao(S){
 console.log('\n== BOTÃO (plano, descansado). Δmáx = maior variação de potência entre quadros a 60 fps ==');
 console.log('caso'.padEnd(30),'pico W'.padStart(7),'Δmáx'.padStart(6),'stamina gasta'.padStart(14),'fadiga +'.padStart(9),'km/h'.padStart(12),' | stamina cai só pressionado?');
 const C=[['toque 0,2 s',t=>t<.2,4],['toque 0,5 s',t=>t<.5,4],['pressão 1 s',t=>t<1,5],['pressão 2 s',t=>t<2,6],['pressão 3 s',t=>t<3,7],['pressão 5 s',t=>t<5,9],
  ['toques 0,15/0,25 s por 10 s',t=>(t%.4)<.15,10],['1 s / 1 s por 10 s',t=>(t%2)<1,10]];
 for(const[n,btn,secs]of C){const r=serie(S,secs,btn);let pk=0,dm=0,vm=0,mn=100,ok=true;
  r.forEach((x,i)=>{pk=Math.max(pk,x.power);vm=Math.max(vm,x.speed);mn=Math.min(mn,x.stamina);if(i){dm=Math.max(dm,Math.abs(x.power-r[i-1].power));
   const p=r[i-1];if(x.b&&p.b&&p.stamina>.5&&x.stamina>p.stamina+1e-9)ok=false;if(!x.b&&!p.b&&x.stamina<p.stamina-1e-9&&x.stamina<100-x.fatigue-1e-6)ok=false}});
  const e=r[r.length-1];console.log(n.padEnd(30),String(pk|0).padStart(7),dm.toFixed(1).padStart(6),(100-mn).toFixed(1).padStart(14),e.fatigue.toFixed(1).padStart(9),`${r[0].speed.toFixed(0)}→${vm.toFixed(0)}`.padStart(12),' |',ok?'sim':'NÃO')}
 console.log('\ncusto por segundo — stamina pressionado / fadiga com stamina cheia…vazia (resistência '+S.AJ.fadResist+'/s sempre incluída)');
 console.log([175,250,300,400,500,750,1000].map(P=>{const g=S.curva(S.AJ.staGasto,P/250),f=S.curva(S.AJ.fadInt,P/250);return `${P} W: −${g.toFixed(1)} / +${(S.AJ.fadResist+f).toFixed(1)}…${(S.AJ.fadResist+f*(1+S.AJ.fadTanque)).toFixed(1)}`}).join(' · '));
 // segurar até zerar
 const r=serie(S,40,()=>true);console.log('\nsegurar sem parar: '+[1,2,3,4,5,6,8,10,15,20].map(s=>{const x=r[Math.min(r.length-1,Math.round(s/DT)-1)];return `${s}s ${x.power|0}W st${x.stamina|0} fad${x.fatigue|0}`}).join(' | ')+(r[r.length-1].state==='over'?` | QUEBROU em ${r[r.length-1].t.toFixed(1)} s`:''));
}
function testesRecursos(S){
 console.log('\n== ÁGUA E GEL ==');
 // água parado no cruzeiro com fadiga 60
 let r=serie(S,3,()=>false,{fatigue:60,stamina:20});S.reset();S.set({fatigue:60,stamina:20,speed:33});S.drink();const w=[];
 for(let i=0;i<3/DT;i++){S.set({grade:0,dist:1});S.update(DT);if(i%15==14)w.push(`${((i+1)*DT).toFixed(2)}s fad ${S.g().fatigue.toFixed(1)} st ${S.g().stamina.toFixed(1)}`)}
 console.log('água (solto, fadiga 60):  '+w.join(' | '));
 S.reset();S.set({fatigue:60,stamina:30,speed:33});S.drink();const f0=60;for(let i=0;i<2/DT;i++){S.set({boost:true,grade:0,dist:1});S.update(DT)}
 console.log(`água segurando o botão 2 s a partir de 175 W: fadiga 60 → ${S.g().fatigue.toFixed(1)} (potência chegou a ${S.g().power|0} W)`);
 S.reset();S.set({fatigue:60,speed:33});S.drink();S.drink();S.drink();console.log(`3 cliques seguidos na água: abriu ${5-S.g().water} garrafa(s)`);
 S.reset();S.set({fatigue:80,stamina:20});S.eat();console.log(`gel com fadiga 80 → ${S.g().fatigue.toFixed(1)} (stamina continua ${S.g().stamina})`);
 console.log(`total que as 5 águas podem tirar: ${S.AJ.aguaQtd*S.AJ.aguaFad} pontos`);
}
// ---------- corrida completa ----------
// pol(g,t,mem) → {boost}, decidida a cada `dec` segundos (0 = a cada quadro). Recursos: água quando fadiga > w, gel quando > gl.
function corrida(S,pol,res={w:35,gl:70},dec=.1,dt=1/30){S.reset();let n=0,sumP=0,next=0,b=false,mem={},minSt=100,maxF=0;const W0=S.g().water;
 while(S.g().state==='run'&&n<300/dt){const g=S.g(),t=n*dt;
  if(t>=next-1e-9){b=pol(g,t,mem);next=t+dec}
  S.set({boost:b});
  if(res&&g.fatigue>res.w&&g.waterEffect<=0&&g.water>0)S.drink();
  if(res&&g.fatigue>res.gl&&g.gel>0)S.eat();
  S.update(dt);n++;const h=S.g();sumP+=h.power;minSt=Math.min(minSt,h.stamina);maxF=Math.max(maxF,h.fatigue)}
 const g=S.g();return{won:g.won,t:g.elapsed*75,dist:g.dist,f:g.fatigue,pm:sumP/n,agua:W0-g.water,gel:S.AJ.gelQtd-g.gel,maxF}}
// política "alvo de potência": aperta quando abaixo do alvo do terreno; respeita guardas de stamina e de fadiga
function alvo(p){return(g,t,m)=>{const climb=g.grade>=1.5,desc=g.grade<=-1.5,fim=g.dist>=50-(p.fimKm||0);
 let a=fim?1e9:climb?p.cW:desc?p.dW:p.pW;
 if(p.stLo!=null){if(g.stamina<p.stLo)m.desc=true;if(g.stamina>p.stHi)m.desc=false;if(m.desc&&!fim)a=0}   // descansa até a stamina voltar
 if(p.fadMax!=null&&g.fatigue>p.fadMax&&!fim)a=Math.min(a,p.fadW||200);                                 // fadiga alta: alivia
 return g.power<a}}
const kmh=r=>50/(r.t/3600);
let S;function tabela(linhas){
 console.log('| # | Estratégia | Distância | Tempo | Média | Fadiga final | Água | Gel | Resultado |');
 console.log('|---|---|---|---|---|---|---|---|---|');
 for(const[n,e,r]of linhas)console.log(`| ${n} | ${e} | ${r.dist.toFixed(1)} km | ${r.won?hms(r.t):hms(r.t)+' (parou)'} | ${(r.dist/(r.t/3600)).toFixed(1)} km/h | ${r.f.toFixed(0)} | ${r.agua}/${S.AJ.aguaQtd} | ${r.gel}/${S.AJ.gelQtd} | ${r.won?'chegou':'**quebrou**'} |`)}
function estrategias(S0){S=S0;
 console.log('\n== ESTRATÉGIAS (50 km) ==');
 const R={w:40,gl:75};                                   // "usar recursos": água quando fadiga > 40, gel > 75
 const L=[
  ['1','Nunca acelerar, sem água/gel',corrida(S,()=>false,null)],
  ['2','Nunca acelerar, com água e gel',corrida(S,()=>false,R)],
  ['3','Segurar o acelerador sempre, sem recursos',corrida(S,()=>true,null)],
  ['4','Segurar o acelerador sempre + todos os recursos',corrida(S,()=>true,R)],
  ['5','Toques curtos e frequentes (0,1 s a cada 0,3 s) + recursos',corrida(S,(g,t)=>(t%.3)<.1,R,0,1/60)],
  ['5b','Toques 0,2 s a cada 0,4 s + recursos',corrida(S,(g,t)=>(t%.4)<.2,R,0,1/60)],
  ['6','Moderado com recuperação (250 W, descansa com stamina < 25) + recursos',corrida(S,alvo({pW:250,cW:250,dW:175,stLo:25,stHi:70}),R)],
  ['7','Ataques nas subidas (200 W plano, 400 W subida) + recursos',corrida(S,alvo({pW:200,cW:400,dW:0}),R)],
  ['8','Sprints de 3 s a cada 8 s + recursos',corrida(S,(g,t)=>(t%8)<3,R)],
  ['8b','Sprints de 2 s a cada 12 s + recursos',corrida(S,(g,t)=>(t%12)<2,R)],
  ['—','FTP (250 W) o tempo todo + recursos',corrida(S,alvo({pW:250,cW:250,dW:250}),R)],
  ['—','FTP o tempo todo, água e gel cedo (fadiga > 15 / 35)',corrida(S,alvo({pW:250,cW:250,dW:250}),{w:15,gl:35})],
  ['—','300 W o tempo todo + recursos',corrida(S,alvo({pW:300,cW:300,dW:300}),R)]];
 tabela(L);return L}
function busca(S0,alvos=[29,30,31,33,33.5,34]){S=S0;
 console.log('\n== 9. BUSCA de estratégias (alvos de potência por terreno, guardas de stamina/fadiga, momento de água/gel; decisões a cada 0,1 s) ==');
 const top=[];let cnt=0;
 for(const pW of [175,190,205,220,235,250,265,280])for(const cW of [175,220,260,300,350,420])for(const dW of [0,175])for(const fimKm of [0,1.5])
 for(const st of [null,[20,60]])for(const fm of [null,[75,175]])for(const w of [30,50,70])for(const gl of [60,85]){
  const p={pW,cW,dW,fimKm,stLo:st&&st[0],stHi:st&&st[1],fadMax:fm&&fm[0],fadW:fm&&fm[1]};const r=corrida(S,alvo(p),{w,gl});cnt++;top.push({...r,p,w,gl,v:r.won?kmh(r):0})}
 const ok=top.filter(x=>x.won).sort((a,b)=>b.v-a.v);
 console.log(`${cnt} estratégias testadas · ${ok.length} chegam (${(ok.length/cnt*100).toFixed(0)}%) · média máxima ${ok[0].v.toFixed(2)} km/h`);
 const faixas=[[0,29],[29,31],[31,33],[33,33.5],[33.5,34],[34,99]];
 console.log('distribuição das que chegam: '+faixas.map(([a,b])=>`${a}–${b===99?'+':b} km/h: ${ok.filter(x=>x.v>=a&&x.v<b).length}`).join(' · '));
 const L=[];for(const a of alvos){const c=ok.filter(x=>x.v>=a).sort((x,y)=>x.v-y.v)[0];
  if(!c){L.push(['9',`busca ${a} km/h: nenhuma estratégia chega`,{dist:0,t:1,won:false,f:0,agua:0,gel:0}]);continue}
  const p=c.p,d=`${p.pW} W plano · ${p.cW} W subida · ${p.dW} W descida${p.fimKm?' · sprint final '+p.fimKm+' km':''}${p.stLo!=null?' · descansa com stamina < '+p.stLo:''}${p.fadMax!=null?' · alivia com fadiga > '+p.fadMax:''} · água > ${c.w}, gel > ${c.gl}`;
  L.push([`9 (${a})`,d,c])}
 const b=ok[0],p=b.p;L.push(['9 (máx.)',`${p.pW} W plano · ${p.cW} W subida · ${p.dW} W descida${p.fimKm?' · sprint final '+p.fimKm+' km':''}${p.stLo!=null?' · descansa com stamina < '+p.stLo:''}${p.fadMax!=null?' · alivia com fadiga > '+p.fadMax:''} · água > ${b.w}, gel > ${b.gl}`,b]);
 tabela(L);
 const r0=corrida(S,alvo(b.p),{w:b.w,gl:b.gl},0,1/60);console.log(`\nmelhor decidindo a cada quadro (robô): ${r0.won?kmh(r0).toFixed(2)+' km/h':'QUEBROU'} · a cada 0,1 s: ${b.v.toFixed(2)} km/h`);
 // sensibilidade: o quanto um erro de recurso custa à melhor estratégia
 const sem=corrida(S,alvo(b.p),null),cedo=corrida(S,alvo(b.p),{w:10,gl:30});
 console.log(`melhor estratégia sem água/gel: ${sem.won?'chega '+kmh(sem).toFixed(1):'QUEBRA no km '+sem.dist.toFixed(1)} · com água/gel cedo demais (10/30): ${cedo.won?'chega '+kmh(cedo).toFixed(1):'QUEBRA no km '+cedo.dist.toFixed(1)}`);
 return ok}
module.exports={mk,corrida,alvo,serie,hms,estrategias,busca,kmh};
if(require.main===module){S=mk();if(process.argv[2]!=='corrida'){testesBotao(S);testesRecursos(S)}estrategias(S);if(process.argv[2]!=='rapido')busca(S)}
