// Simulador da CARREIRA: mesma mecânica do jogo (mecanica.js), com atributos, percurso de 30 km e pelotão "chefe".
// Uso: node tools/balanceamento/sim_carreira.js
const fs=require('fs'),path=require('path');
const J=f=>fs.readFileSync(path.join(__dirname,'../../src/js',f),'utf8');
const PERCURSO={
 30:[{start:6,end:7.5,peak:5,descentEnd:9},{start:14,end:16,peak:6,descentEnd:18},{start:22,end:26,peak:7,descentEnd:28.5}],
 50:[{start:8,end:9.5,peak:5.5,descentEnd:11.5},{start:23,end:26.5,peak:6.5,descentEnd:29.5},{start:36,end:42,peak:7.5,descentEnd:45}]};
function mk(km){let src=J('mecanica.js').replace('const SCALE=75,GOAL=50;',`const SCALE=75,GOAL=${km};`)
  .replace(/const climbs=\[.*\];/,'const climbs='+JSON.stringify(PERCURSO[km])+';').replace('const FTP=AJ.ftp;','let FTP=AJ.ftp;');
 return new Function(J('ranking.js')+'\n'+src+`;return{AJ,reset,update,drink,eat,terrain,curva,
  set:o=>{for(const k in o)eval(k+'=o[k]')},
  g:()=>({state,stamina,fatigue,water,gel,speed,dist,elapsed,won,grade,waterEffect,power,FTP})}`)()}
// ---------- atributos ----------
const BASE={ftp:180,peso:74,fad:1.5,folegoPasso:.05,recupPasso:.06,sprintW:40,sprintPasso:.05,vacPel:.30};   // fad: multiplicador de fadiga do iniciante; cada nível de Fôlego tira folegoPasso
function aplicar(S,sk,km){const A=S.AJ,b=JSON.parse(JSON.stringify(A));
 const f=BASE.fad*(1-BASE.folegoPasso*sk.folego);
 A.ftp=BASE.ftp+10*sk.motor;A.peso=BASE.peso-sk.escalada;
 A.fadResist=b.fadResist*f;A.fadInt=b.fadInt.map(([x,y])=>[x,y*f]);
 A.staRecupera=b.staRecupera*(1+BASE.recupPasso*sk.recup);
 A.pMax=700+BASE.sprintW*sk.sprint;A.staGasto=b.staGasto.map(([x,y])=>[x,x>=1.6?y*(1-BASE.sprintPasso*sk.sprint):y]);
 A.aguaQtd=km<=30?3:5;A.gelQtd=km<=30?1:2;S.set({FTP:A.ftp})}
// ---------- pelotão (potência constante, sem vácuo entre eles) ----------
const PX=2.5*9*3600/75,VAC=[[200,0],[292,1],[440,1],[660,0]];
function corrida(km,sk,pBoss,pol,res,dt=1/30){const S=mk(km);aplicar(S,sk,km);S.reset();S.set({FTP:S.AJ.ftp});
 const A=S.AJ,m=A.peso+A.bike;
 const R=(v,gr,vac)=>{const th=Math.atan(gr/100);return m*A.g*(Math.sin(th)+A.crr*Math.cos(th))+.5*A.rho*A.cda*(1-vac)*v*v};
 let pel={dist:360/PX,v:S.g().speed/3.6,gr:0,fim:null},n=0,mem={},b=false;const W0=A.aguaQtd,G0=A.gelQtd;
 while(S.g().state==='run'&&n<400/dt){const g=S.g();
  // vácuo do jogador atrás do pelotão
  const gap=(pel.dist-g.dist)*PX;let vac=0;for(const[x0,y0]of[[0,0]]){}const cv=(T,x)=>S.curva(T,x);
  if(gap>150&&gap<700)vac=cv(VAC,gap)*BASE.vacPel;S.set({vacuo:vac});
  b=pol(g,gap,mem,A.ftp);S.set({boost:b});
  if(g.fatigue>res.w&&g.waterEffect<=0&&g.water>0)S.drink();if(g.fatigue>res.gl&&g.gel>0)S.eat();
  S.update(dt);n++;
  if(pel.fim==null){pel.gr+= (S.terrain(Math.min(km,pel.dist))-pel.gr)*Math.min(1,dt*1.4);let v=pel.v;const h=dt*A.kin/4;
   const pb=pBoss*(pel.dist>=km-1?1.4:pel.dist>=PERCURSO[km][2].start?1.1:1);for(let i=0;i<4;i++){const a=(A.eta*pb/Math.max(v,A.vmin)-R(v,pel.gr,0))/(70+A.bike);v=Math.max(1.1,v+a*h)}
   pel.v=v;pel.dist+=v*3.6*dt/3600*75;if(pel.dist>=km)pel.fim=n*dt}}
 while(pel.fim==null){ // pelotão termina sozinho
  pel.gr+=(S.terrain(Math.min(km,pel.dist))-pel.gr)*Math.min(1,dt*1.4);let v=pel.v;const h=dt*A.kin/4;
  const pb=pBoss*(pel.dist>=km-1?1.4:pel.dist>=PERCURSO[km][2].start?1.1:1);for(let i=0;i<4;i++){const a=(A.eta*pb/Math.max(v,A.vmin)-R(v,pel.gr,0))/(70+A.bike);v=Math.max(1.1,v+a*h)}
  pel.v=v;pel.dist+=v*3.6*dt/3600*75;n++;if(pel.dist>=km)pel.fim=n*dt}
 const g=S.g();return{chegou:g.won,dist:g.dist,t:g.elapsed*75,tPel:pel.fim*75,venceu:g.won&&g.elapsed<pel.fim,f:g.fatigue,agua:W0-g.water,gel:G0-g.gel}}
// políticas: alvo em % do FTP por terreno; "roda" = fica no vácuo do pelotão até o km do ataque
function politica(p,km){return(g,gap,m,ftp)=>{const fim=g.dist>=km-(p.sprintKm||.6),ataque=g.dist>=p.ataque;
 let a;
 if(fim)a=1e9;
 else if(ataque)a=p.pA*ftp;
 else if(p.roda&&gap>150&&gap<700)a=gap>360?ftp*1.6:0;          // segura a roda: acelera se abriu, alivia se encostou
 else a=(g.grade>=1.5?p.cW:g.grade<=-1.5?p.dW:p.pW)*ftp;
 if(g.stamina<p.stLo&&!fim)m.d=true;if(g.stamina>p.stHi)m.d=false;if(m.d&&!fim)a=0;
 return g.power<a}}
const hms=s=>[s/3600,s/60%60,s%60].map(v=>String(Math.floor(v)).padStart(2,'0')).join(':');
// melhor resultado possível para um atributo (busca de estratégias = jogador que joga bem)
function melhor(km,sk,pBoss,soRoda){let best=null;
 const ataques=[km*.35,km*.6,PERCURSO[km][2].start-.3,PERCURSO[km][2].end-.5,km-1.5];
 for(const roda of soRoda==null?[true,false]:[soRoda])for(const pW of(roda?[1]:[.85,1,1.1,1.2]))for(const cW of(roda?[1]:[1,1.2,1.4]))
  for(const ataque of(roda?ataques:[km+1]))for(const pA of(roda?[1,1.15,1.3,1.6]:[1]))for(const res of[{w:30,gl:55},{w:45,gl:75}])for(const st of[[15,60],[30,80]]){
   const r=corrida(km,sk,pBoss,politica({roda,pW,cW,dW:.5,ataque,pA,stLo:st[0],stHi:st[1]},km),res);
   const sc=r.chegou?(r.venceu?2e5:1e5)-r.t:r.dist;if(!best||sc>best.sc)best={...r,sc,roda,pW,cW,ataque,pA}}
 return best}
module.exports={BASE,mk,aplicar,corrida,politica,melhor,PERCURSO,hms};
if(require.main===module){
 const sk0={motor:0,folego:0,recup:0,escalada:0,sprint:0};
 const fmt=r=>`${r.chegou?'chegou '+hms(r.t):'quebrou km '+r.dist.toFixed(1)} | pelotão ${hms(r.tPel)} | ${r.venceu?'VENCEU':'perdeu'} | água ${r.agua} gel ${r.gel}`;
 const arg=process.argv[2]||'base';
 if(arg==='base'){
  console.log('== Iniciante zerado (180 W, 74 kg), 30 km: melhor jogo possível, solo ==');
  console.log(fmt(melhor(30,sk0,1,false)));
  for(const pb of[170,185,200,215,230]){const r=melhor(30,sk0,pb,null);console.log(`chefe ${pb} W: ${fmt(r)} | ${r.roda?`roda até km ${r.ataque.toFixed(1)} e ataca a ${Math.round(r.pA*100)}%`:'solo'}`)}
  console.log('\n== mesmo iniciante zerado nos 50 km ==');console.log(fmt(melhor(50,sk0,1,false)));
 }
}
