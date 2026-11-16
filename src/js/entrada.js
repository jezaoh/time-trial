/* ===== Entrada do usuário =====
   Mouse/toque (pointer events), teclado e pausa automática ao trocar de aba.
*/
c.addEventListener('pointerdown',e=>{audioUnlock();const[x,y]=pt(e);mx=x;my=y;
 if(pnl){panelDown(x,y,e);return}
 if((state==='title'||state==='select'||state==='modo')&&iconHit(x,y))return;
 if(state==='title'){toSelect();return}
 if(state==='select'||state==='nome'){const bb=btns.find(b=>hit(b,x,y));if(bb){bb.act();return}const u=x/SS,v=y/SS;for(const a of ARW)if(d2(u,v,a[0],a[1])<2500){swap(a[2]);return}if(hit(PLAYR,u,v))play();return}
 const b=btns.find(b=>hit(b,x,y));if(b)b.act()});
c.addEventListener('pointermove',e=>{[mx,my]=pt(e);if(drag)setSlider(drag,mx);c.style.cursor=hot(mx,my)?'pointer':'default'});
c.addEventListener('pointerleave',()=>{if(!drag)mx=my=-1});['pointerup','pointercancel'].forEach(t=>c.addEventListener(t,()=>{drag=null}));
addEventListener('keydown',e=>{
 audioUnlock();
 if(e.code==='KeyM'&&e.target!==nickEl){SET.on=!SET.on;saveSet();return}
 if(pnl){if(e.code==='Escape'||e.code==='Enter'){pnl=null;e.preventDefault()}return}
 if(e.target===nickEl){if(e.code==='Enter'||e.code==='NumpadEnter'){e.preventDefault();if(state==='nome')confirmarNome();else play()}else if(e.code==='Escape')nickEl.blur();return}
 if(state==='title'){if(e.code==='Enter'||e.code==='Space'){e.preventDefault();toSelect()}return}
 if(state==='select'){if(e.code==='ArrowLeft')swap(-1);else if(e.code==='ArrowRight')swap(1);else if(e.code==='Enter'){e.preventDefault();play()}else if(e.code==='Escape')toModo();return}
 if(e.code==='Space'){if(state==='run')boost=true;e.preventDefault()}
 if((e.code==='Escape'||e.code==='KeyP')&&!e.repeat)togglePause();
 if(e.code==='KeyA')drink();if(e.code==='KeyG')eat();
 if(state==='over'&&e.code==='Enter')reset()});
addEventListener('keyup',e=>{if(e.code==='Space')boost=false});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='run')togglePause();if(AC){if(document.hidden)AC.suspend();else AC.resume()}});
