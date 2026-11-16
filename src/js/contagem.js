/* ===== Contagem regressiva antes de toda largada: 3 · 2 · 1 · VAI! (pi, pi, piiiii) =====
   Durante a contagem o jogo fica parado (sem física, sem relógio) e o botão de potência não conta. */
let CONT=0,CONTN=0;
function bip(freq,dur){try{if(!AC)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.value=freq;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.01);g.gain.setValueAtTime(.18,t+dur-.04);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(g);g.connect(gSfx);o.start(t);o.stop(t+dur+.02)}catch(e){}}
const _contReset=reset;
// na corrida/rachão o pelotão rola até a linha de largada durante a contagem (a largada fica parada no chão)
const VROLL=16;
reset=function(){_contReset();CONT=3;CONTN=4;elevG=0;
 if(typeof CORR!=='undefined'&&CORR.on){const d=VROLL*3/3600*SCALE;dist=-d;for(const r of CORR.riders){r.dist-=d;r.v=VROLL/3.6}speed=VROLL}};
const _contUpdate=update;
update=function(dt){if(CONT>0){for(const n of NPCS)n.ped+=dt*speed*.5;   // todos pedalando na largada
 if(CORR.on){speed=VROLL;const dd=VROLL*dt/3600*SCALE;dist=Math.min(0,dist+dd);for(const r of CORR.riders)r.dist+=dd;pedal+=dt*speed*.5}
 const n=Math.ceil(CONT);if(n<CONTN){CONTN=n;bip(880,.14)}CONT-=dt;boost=false;
  if(CONT<=0){CONT=-.001;bip(1320,.55)}return}
 if(CONT<0)CONT=Math.max(-.8,CONT-dt);_contUpdate(dt)};
const _contDraw=draw;
draw=function(){_contDraw();if(state!=='run'||pnl)return;if(CONT===0||CONT<=-.8)return;
 const vai=CONT<0,s=vai?'VAI!':String(Math.ceil(CONT)),f=vai?(-CONT/.8):(1-(CONT-Math.floor(CONT))),k=1.35-.35*Math.min(1,f*3);
 ctx.save();ctx.globalAlpha=vai?1-f:1;ctx.translate(W/2,H*.47);ctx.scale(k,k);ctx.font=FT(900,170);ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.lineJoin='round';ctx.lineWidth=26;ctx.strokeStyle='#14161c';ctx.strokeText(s,0,0);ctx.fillStyle=vai?'#3bdc1f':'#ffcc00';ctx.fillText(s,0,0);ctx.restore()};
