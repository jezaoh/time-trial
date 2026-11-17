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
// ---------- tela de carregamento (17/11): barra de progresso enquanto as imagens e as fontes carregam ----------
const CARREGA={n:0,tot:Object.keys(SRC).length,dicas:['Segure o raio para acelerar; solte para recuperar a stamina.','Itens que você não usar voltam para o estoque.',
 'No vácuo de outro ciclista você gasta menos.','Água tira fadiga aos poucos; o gel tira na hora.','No Rachão vale tudo — até apostar.'],d:Math.floor(Math.random()*5)};
// a tela é o #carga do index.html (aparece já durante o download); aqui só mostra o % das imagens e some no fim
function carregaTela(){const t=$('cargaTxt'),b=$('cargaBarra');if(!t)return;const p=CARREGA.n/CARREGA.tot;
 if(b){b.style.animation='none';b.style.marginLeft='0';b.style.width=Math.max(8,p*100)+'%'}t.textContent=`CARREGANDO… ${Math.round(p*100)}%  ·  ${CARREGA.dicas[CARREGA.d]}`}
function carregaFim(){const c=$('carga');if(c)c.remove()}
carregaTela();
Promise.all(Object.keys(SRC).map(n=>new Promise(r=>{const i=new Image();i.onload=i.onerror=()=>{CARREGA.n++;carregaTela();r()};i.src=SRC[n];IMG[n]=i})).concat(document.fonts?[FT(900,20),FT(800,20),'20px LuckiestGuy'].map(f=>document.fonts.load(f).catch(()=>{})):[])).then(()=>{carregaFim();requestAnimationFrame(frame)});
