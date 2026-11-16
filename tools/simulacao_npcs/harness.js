window.SIM=function(cfg){
 // cfg: {riders:[{nivel|ftp..., opts}], km:100, terreno:'livre'|'100', itens:bool, jogador:{ftp?}|null, dt}
 MODO='carreira';CS=carNovo();CS.mochila=[];carTipo=cfg.terreno==='livre'?'livre':'treino';carProva=100;reset();CONT=-1;state='run';
 const km=cfg.km||100;FIS.longe=[-1e5,1e5];
 if(cfg.terreno==='livre'){const sd=cfg.seed||0;window._RP=window._RP||{};if(!_RP[sd]){const d0=dist;LV.proxSubida=2.5;rampas=[];for(let k=0;k<140;k+=5){dist=k;gerarSubidas()}dist=d0;_RP[sd]=rampas.slice()}rampas=_RP[sd].slice();ALTT=null}
 CORR.on=false;CORR.riders=[];NPCS=[];LV.veic=null;LV.eventos=false;LV.livre=false;GOAL=9999;
 const R=cfg.riders.map((o,i)=>{const r=o.nivel?ciclDoNivel(o.nivel,Object.assign({dist:-(i*(FIS.espaco+40))/PX_KM,kmPlano:km,fad:0},o)):ciclNovo(Object.assign({dist:-(i*(FIS.espaco+40))/PX_KM,kmPlano:km,fad:0},o));
  r.v=8;r.vEma=28;if(o.inv)Object.assign(r.inv,o.inv);if(o.Fend)r.Fend=o.Fend;if(o.agr!=null)r.agr=o.agr;r.lab=o.lab||r.nivel;r.t100=null;r.tq=null;r.maxFad=0;r.hist=[];NPCS.push(r);return r});
 // jogador: fica longe (não interfere) a menos que cfg.jogador
 dist=cfg.jogador?0:-1e4;speed=cfg.jogador?28:0;
 const dt=cfg.dt||1/20;let t=0,ataques=0;const mod={};
 for(let s=0;s<4e6;s++){
  if(cfg.jogador){ // jogador "bot": segura uma potência fixa
   const P=cfg.jogador.w;const m=AJ.peso+AJ.bike;let v=speed/3.6;for(let i=0;i<4;i++){const a=(AJ.eta*P/Math.max(v,AJ.vmin)-resist(v))/m;v=clamp(v+a*dt*AJ.kin/4,1.1,AJ.vmax/3.6)}speed=v*3.6;dist+=speed*dt/3600*SCALE;grade=terrain(dist)}
  if(cfg.evento)cfg.evento(t,R);
  ciclPasso(dt);t+=dt*SCALE;
  for(const r of R){if(r.modo==='ataque'&&!mod[r.nome+r.atT0]){} if(r.modo==='ataque'&&r._m!=='ataque')r.nAt=(r.nAt||0)+1;r._m=r.modo;
   r.maxFad=Math.max(r.maxFad,r.fad);if(r.tq==null&&r.est==='quebrado')r.tq=r.dist;if(r.t100==null&&r.dist>=km)r.t100=t;
   if(s%Math.round(600/(dt*SCALE))===0)r.hist.push([+r.dist.toFixed(1),Math.round(r.fad),Math.round(r.res)])}
  if(R.every(r=>r.t100!=null||r.sentado))break;if(t>12*3600)break}
 return R.map(r=>({lab:r.lab,ftp:r.ftp,m:Math.round(r.m),end:+r.end.toFixed(2),Fend:Math.round(r.Fend),
  media:r.t100?+(km/(r.t100/3600)).toFixed(1):null,km:+r.dist.toFixed(1),fadFinal:Math.round(r.fad),quebrou:r.tq!=null?+r.tq.toFixed(1):null,abandonou:r.sentado,ataques:r.nAt||0,itensRest:{...r.inv},hist:r.hist}))};
