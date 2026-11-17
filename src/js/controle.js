/* ===== CONTROLE (gamepad) — desde 16/11/2026 =====
   Qualquer controle que o navegador reconheça (Xbox, PlayStation, genéricos), pelo mapeamento PADRÃO da Gamepad API,
   que usa a POSIÇÃO do botão (não a letra): embaixo = A/✕ · direita = B/◯ · esquerda = X/▢ · em cima = Y/△.
   Na prova:  A (segurar) = pedalar/acelerar · X = água · Y = isotônico · B = banana · RB = gel · LB = gel azul · START = pausa
   Nos menus, na pausa e no resultado: analógico esquerdo ou direcional move um cursor; A = clicar; B = voltar (Esc);
   START = pausa/continuar. (Digitar o nome da Carreira na 1ª vez ainda precisa de teclado ou toque.) */
const GP={A:0,B:1,X:2,Y:3,LB:4,RB:5,BACK:8,START:9,CIMA:12,BAIXO:13,ESQ:14,DIR:15,
 morto:.25,          // zona morta do analógico
 vel:1100};          // velocidade do cursor (px lógicos por segundo)
let gpAnt=[],gpAtivo=false,gpBoost=false,gpT=0,gpUlt=0;
function gpBotao(g,i){const b=g.buttons[i];return !!b&&(b.pressed||b.value>.5)}
function gpClique(){const r=c.getBoundingClientRect(),o={clientX:r.left+mx*r.width/W,clientY:r.top+my*r.height/H,bubbles:true,pointerId:1,isPrimary:true};
 try{c.dispatchEvent(new PointerEvent('pointerdown',o));c.dispatchEvent(new PointerEvent('pointerup',o))}catch(e){}}
const gpTecla=code=>dispatchEvent(new KeyboardEvent('keydown',{code,key:code,bubbles:true}));
function gpPasso(){requestAnimationFrame(gpPasso);const agora=performance.now(),dt=Math.min(.05,(agora-(gpT||agora))/1000);gpT=agora;
 const L=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];if(!L.length){gpAnt=[];return}
 const g=L.find(x=>x.mapping==='standard')||L[0],n=Math.max(16,g.buttons.length),cur=[];for(let i=0;i<n;i++)cur[i]=gpBotao(g,i);
 const borda=i=>cur[i]&&!gpAnt[i];if(cur.some(Boolean)){gpAtivo=true;gpUlt=agora;audioUnlock()}
 const prova=state==='run'&&!pnl;
 if(prova){
  // A segurado = pedalar (o mesmo "boost" do espaço e do raio na tela)
  if(cur[GP.A]){boost=true;gpBoost=true}else if(gpBoost){boost=false;gpBoost=false}
  if(borda(GP.X)){if(water>0||typeof beber700!=='function')drink();else beber700()}
  if(borda(GP.Y)&&typeof tomarIso==='function')tomarIso();
  if(borda(GP.B)&&typeof comerBanana==='function')comerBanana();
  if(borda(GP.RB))eat();
  if(borda(GP.LB)&&typeof gelAzul==='function')gelAzul();
  if(borda(GP.START))togglePause()}
 else{if(gpBoost){boost=false;gpBoost=false}
  // cursor: analógico esquerdo + direcional
  let ax=Math.abs(g.axes[0]||0)>GP.morto?g.axes[0]:0,ay=Math.abs(g.axes[1]||0)>GP.morto?g.axes[1]:0;
  if(cur[GP.ESQ])ax=-1;if(cur[GP.DIR])ax=1;if(cur[GP.CIMA])ay=-1;if(cur[GP.BAIXO])ay=1;
  if(ax||ay){gpAtivo=true;gpUlt=agora;if(mx<0||my<0){mx=W/2;my=H/2}mx=clamp(mx+ax*GP.vel*dt,0,W);my=clamp(my+ay*GP.vel*dt,0,H)}
  if(borda(GP.A)){if(mx<0||my<0){mx=W/2;my=H/2}gpClique()}
  if(borda(GP.B))gpTecla('Escape');
  if(borda(GP.START)){if(state==='paused')togglePause();else if(state==='title')toSelect()}}   // direto (um Enter sintético seria lido pelo título E pela tela seguinte)
 gpAnt=cur}
requestAnimationFrame(gpPasso);
addEventListener('gamepadconnected',()=>{gpAtivo=true;gpUlt=performance.now()});
// cursor do controle (só fora da prova, enquanto o controle está em uso)
const _gpDraw=draw;
draw=function(){_gpDraw();if(!gpAtivo||state==='run'||mx<0||performance.now()-gpUlt>8000)return;
 ctx.save();ctx.setTransform(1,0,0,1,0,0);const k=c.width/W;ctx.scale(k,k);const p=.5+.5*Math.sin(T*6);
 ctx.beginPath();ctx.arc(mx,my,26+4*p,0,7);ctx.lineWidth=10;ctx.strokeStyle='#0a1426';ctx.stroke();ctx.lineWidth=5;ctx.strokeStyle='#fff';ctx.stroke();
 ctx.beginPath();ctx.arc(mx,my,7,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#0a1426';ctx.stroke();ctx.restore()};
