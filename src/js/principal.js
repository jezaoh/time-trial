/* ===== Loop principal =====
   frame(): atualiza o jogo, mostra/esconde botões HTML, áudio, desenha; pré-carrega imagens e inicia.
*/
let vis='',nvis='';
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;T+=dt;
 if(state==='run'&&!pnl)update(dt);if(state==='over')speed=0;audioTick(dt);
 const v=state==='run'?'block':'none';if(v!==vis){vis=v;$('bolt').style.display=v;if(v==='none')esconderBotoesHUD()}   // água, gel e itens: posicionados pelo hud()
 const nv=(state==='select'||state==='nome')&&!pnl?'block':'none';if(nv!==nvis){nvis=nv;nickEl.style.display=nv}
 if(state==='run'||state==='over'){scroll+=speed*dt*9;if(!pedalCrono())pedal+=speed*dt*.5*(state==='run'?clamp(power/40,0,1):1)}
 if(state!=='over')fimT=-1;draw();requestAnimationFrame(frame)}
Promise.all(Object.keys(SRC).map(n=>new Promise(r=>{const i=new Image();i.onload=r;i.onerror=r;i.src=SRC[n];IMG[n]=i})).concat(document.fonts?[FT(900,20),FT(800,20),'20px LuckiestGuy'].map(f=>document.fonts.load(f).catch(()=>{})):[])).then(()=>requestAnimationFrame(frame));
