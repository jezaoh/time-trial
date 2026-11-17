/* ===== RITMO (ou MARCHAS), RPM E FC NA TELA — teste só no Contrarrelógio (17/11) =====
   MAR.modo 'ritmo' (atual): sem marchas; a régua de RPM tem as zonas verde (PERFEITO), amarela (ATAQUE) e vermelha (SPRINT);
   na verde o quadro do RPM brilha. Itens nas bagzinhas no canto esquerdo. O texto abaixo vale para MAR.modo 'marcha'.
   A mecânica está em mecanica.js (bloco MAR). Aqui: HUD e controles.
   Mão ESQUERDA: marchas (▲ pesada / ▼ leve) e os itens em "bagzinhas". Mão DIREITA: o raio (cada toque = uma perna, MAR.volta).
   Direita, acima do raio: RPM com a faixa verde, FC com a zona e W' em kJ.
   Setinha: se o RPM ficar fora da faixa por 0,7 s, o botão certo pisca amarelo.
   Teclado: Espaço = pedalada · ↑/↓ = marcha. Controle: A = pedalada · direcional ↑/↓ = marcha. */
const MARH={
 sobe:{x:18,y:470,w:136,h:118},meio:{x:18,y:596,w:136,h:82},desce:{x:18,y:686,w:136,h:118},   // coluna das marchas
 slotX:172,slotPasso:104,                                        // bagzinhas dos itens
 rpm:{x:1160,y:224,w:346,h:96,min:30,max:140},fc:{x:1160,y:328,w:346,h:64},wp:{x:1160,y:400,w:346,h:50},
 zonas:[[.6,'#9fb3c8','Z1'],[.7,'#4fc3ff','Z2'],[.8,'#35f21c','Z3'],[.9,'#ffd83a','Z4'],[9,'#ff3b2a','Z5']]};
HB_IDS.push('m_sobe','m_desce');   // somem junto com os botões dos itens fora da prova
const marSlotX=i=>(MAR.modo==='marcha'?MARH.slotX:36)+i*MARH.slotPasso;
const friOn=()=>MAR.modo==='friccao';
const marTela=()=>marOn()&&(state==='run'||state==='paused');
// botões de toque (DOM, por cima do canvas, como os dos itens)
(function(){const st=$('stage');if(!st)return;[['m_sobe',1],['m_desce',-1]].forEach(([id,d])=>{const b=document.createElement('button');
 b.id=id;b.setAttribute('aria-label',d>0?'Marcha mais pesada':'Marcha mais leve');b.style.display='none';st.appendChild(b);
 b.addEventListener('pointerdown',e=>{marTroca(d);e.preventDefault()})})})();
addEventListener('keydown',e=>{if(state!=='run'||!marOn()||e.target===nickEl)return;
 if(e.code==='ArrowUp'||e.code==='KeyW'){marTroca(1);e.preventDefault()}else if(e.code==='ArrowDown'||e.code==='KeyS'){marTroca(-1);e.preventDefault()}});
function marBotao(r,d,alerta){const pul=alerta?.5+.5*Math.sin(T*12):0;
 rr(r.x,r.y,r.w,r.h,22);ctx.fillStyle=alerta?`rgba(255,216,58,${.25+.25*pul})`:'rgba(10,26,44,.72)';ctx.fill();
 ctx.lineWidth=alerta?6:4;ctx.strokeStyle=alerta?'#ffd83a':'rgba(207,216,225,.85)';ctx.stroke();
 const cx=r.x+r.w/2,cy=r.y+r.h/2-12,s=30;ctx.beginPath();if(d>0){ctx.moveTo(cx,cy-s);ctx.lineTo(cx+s*1.1,cy+s*.7);ctx.lineTo(cx-s*1.1,cy+s*.7)}else{ctx.moveTo(cx,cy+s);ctx.lineTo(cx+s*1.1,cy-s*.7);ctx.lineTo(cx-s*1.1,cy-s*.7)}
 ctx.closePath();ctx.fillStyle=alerta?'#ffd83a':'#fff';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#06121e';ctx.stroke();
 tx(d>0?'PESADA':'LEVE',cx,r.y+r.h-14,20,'center',alerta?'#ffd83a':'#fff')}
function marHud(){const H0=MARH,[co,pi]=MAR.marchas[marG],rit=MAR.modo==='ritmo';
 if(friOn())friHud();
 // coluna das marchas (só no modo marcha)
 if(!rit){marBotao(H0.sobe,1,marDica>0);marBotao(H0.desce,-1,marDica<0);
 const m=H0.meio;rr(m.x,m.y,m.w,m.h,18);ctx.fillStyle='rgba(222,240,255,.82)';ctx.fill();
 tx(`${marG+1}`,m.x+m.w/2,m.y+46,44,'center','#fff');tx(`${co}×${pi}`,m.x+m.w/2,m.y+72,20,'center','#fff');
 if(marDica&&state==='run')tx(marDica>0?'TROQUE ▲':'TROQUE ▼',H0.sobe.x+H0.sobe.w/2,H0.sobe.y-14,22,'center','#ffd83a')}
 // RPM: número + régua com a faixa verde
 if(friOn()){const R=H0.rpm;pilula(R.x,R.y,R.w,R.h);tx('RPM',R.x+24,R.y+40,22,'left','#fff');tx('50×17',R.x+24,R.y+70,20,'left','#fff');tx(`${Math.round(marRpm)}`,R.x+R.w-24,R.y+62,56,'right','#fff')}
 else{const R=H0.rpm,rv=Math.round(marRpm),G=rit?MAR.ritmo.verde:MAR.faixa,A=MAR.ritmo.amarela,dentro=rv>=G[0]&&rv<=G[1];
 const zn=!rv?['','#fff']:rv<G[0]?['FRACO','#9fb3c8']:dentro?[marEmb?'EMBALO':'PERFEITO','#35f21c']:rit&&rv<=A?['ATAQUE','#ffd83a']:rit?['SPRINT','#ff3b2a']:['','#ffd83a'];
 pilula(R.x,R.y,R.w,R.h);
 if(dentro&&state==='run'){rr(R.x-3,R.y-3,R.w+6,R.h+6,(R.h+6)/2);ctx.lineWidth=5;ctx.strokeStyle=`rgba(53,242,28,${.55+.45*Math.sin(T*10)})`;ctx.stroke()}
 tx('RPM',R.x+24,R.y+34,22,'left','#fff');if(rit&&zn[0])tx(zn[0],R.x+24,R.y+58,20,'left',zn[1]);
 tx(`${rv}`,R.x+R.w-24,R.y+50,50,'right',zn[1]);
 const bx=R.x+24,bw=R.w-48,by=R.y+66,bh=16,X=v=>bx+bw*clamp((v-R.min)/(R.max-R.min),0,1);
 rr(bx,by,bw,bh,8);ctx.fillStyle='#0a1a2c';ctx.fill();
 if(rit){ctx.fillStyle='#ffd83a';rr(X(G[1]),by+2,X(A)-X(G[1]),bh-4,4);ctx.fill();ctx.fillStyle='#ff3b2a';rr(X(A),by+2,X(R.max)-X(A)-2,bh-4,4);ctx.fill()}
 ctx.fillStyle='#35f21c';rr(X(G[0]),by+2,X(G[1])-X(G[0]),bh-4,6);ctx.fill();
 if(rv>0){const x=X(rv);ctx.beginPath();ctx.moveTo(x,by-2);ctx.lineTo(x-9,by-14);ctx.lineTo(x+9,by-14);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#06121e';ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(x-2,by,4,bh)}}

 // FC com a zona
 const F=H0.fc,fc=Math.round(marFC),pz=fc/MAR.fc.max,z=H0.zonas.find(q=>pz<q[0]);pilula(F.x,F.y,F.w,F.h);
 tx('♥',F.x+24,F.y+46,34,'left','#ff3b5c');tx(`${fc}`,F.x+70,F.y+47,40,'left','#fff');tx('bpm',F.x+70+ctx.measureText(`${fc}`).width+8,F.y+46,20,'left','#fff');
 rr(F.x+F.w-82,F.y+12,62,40,12);ctx.fillStyle=z[1];ctx.fill();ctx.font=FT(900,26);ctx.textAlign='center';ctx.fillStyle='#06121e';ctx.fillText(z[2],F.x+F.w-51,F.y+42);
 // W' em kJ (a stamina em energia)
 const P=H0.wp;pilula(P.x,P.y,P.w,P.h);tx("W'",P.x+24,P.y+35,22,'left','#fff');tx(`${(stamina/100*MAR.wpKJ).toFixed(1).replace('.',',')} kJ`,P.x+P.w-24,P.y+36,28,'right','#fff')}
// bagzinhas dos itens (atrás das garrafas)
function marBags(){const n=slotsHUD().length;for(let i=0;i<n;i++){const x=marSlotX(i);rr(x-14,676,104,156,18);ctx.fillStyle='rgba(10,26,44,.55)';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='rgba(207,216,225,.7)';ctx.stroke()}}
const _marHud=hud;hud=function(){const on=marTela();if(on)marBags();_marHud();
 if(on)marHud();
 const vis=on&&state==='run'&&MAR.modo==='marcha';botaoDOM('m_sobe',vis?MARH.sobe:null);botaoDOM('m_desce',vis?MARH.desce:null)};

// ===== FRICÇÃO: medidor de pressão em volta do raio, aviso da pedalada, vibração e som de "carrinho de fricção" =====
const FRIH={cx:1346,cy:678,r:136,lw:16,a0:Math.PI*.75,a1:Math.PI*2.25,   // arco de 270°, começando embaixo à esquerda
 cor:{cinza:'#4a5b6e',verde:'#35f21c',laranja:'#ff9a1f',vermelho:'#ff3b2a'},
 txt:{cinza:'FRACA',verde:'PERFEITA!',laranja:'GÁS!',vermelho:'PATINOU!'}};
function friArco(q0,q1,cor,lw){const F=FRIH,a=q=>F.a0+(F.a1-F.a0)*q;ctx.beginPath();ctx.arc(F.cx,F.cy,F.r,a(q0),a(q1));ctx.strokeStyle=cor;ctx.lineWidth=lw;ctx.lineCap='butt';ctx.stroke()}
function friHud(){const F=FRIH,g=friVerde(),M=MAR.fric;ctx.save();
 friArco(0,1,'rgba(6,18,30,.75)',F.lw+8);
 friArco(0,g[0],F.cor.cinza,F.lw);friArco(g[0],g[1],F.cor.verde,F.lw);friArco(g[1],M.laranja,F.cor.laranja,F.lw);friArco(M.laranja,1,F.cor.vermelho,F.lw);
 if(friSeg||friQ>0&&marT-friZT<.25){const q=friQ,z=friZona(q),a=F.a0+(F.a1-F.a0)*q;friArco(0,q,'#fff',F.lw*.45);
  ctx.beginPath();ctx.arc(F.cx+Math.cos(a)*F.r,F.cy+Math.sin(a)*F.r,13,0,7);ctx.fillStyle=F.cor[z];ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#fff';ctx.stroke()}
 ctx.restore();
 // aviso da última pedalada (sobe e some em 0,9 s)
 const dt=marT-friZT;if(friZ&&dt<.9){ctx.globalAlpha=clamp(1.6-dt*1.8,0,1);const t=F.txt[friZ]+(friZ==='verde'&&friSeq>1?` ×${friSeq}`:'');
  tx(t,F.cx,F.cy-F.r-26-dt*40,friZ==='verde'?34:28,'center',F.cor[friZ]);ctx.globalAlpha=1}}
// vibração: pulsos cada vez mais fortes enquanto segura; um "toc" ao soltar no verde (só Android)
let friVibT=0,friVibZ=-9;
function friVibra(){if(!friOn()||state!=='run'||typeof vibrar!=='function')return;
 if(friSeg&&marT-friVibT>.11){friVibT=marT;vibrar(Math.round(6+22*friQ))}
 if(friZT!==friVibZ){friVibZ=friZT;if(friZ==='verde')vibrar(35);else if(friZ==='vermelho')vibrar(70)}}
// som: motor de fricção (dente de serra filtrado) — sobe de tom com a pressão enquanto segura; solto, zumbe pela velocidade
let FRS=null;
function friSom(){if(typeof AC==='undefined'||!AC||!gSfx)return;
 if(!FRS){try{const o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';f.type='lowpass';f.frequency.value=900;g.gain.value=0;
  o.connect(f);f.connect(g);g.connect(gSfx);o.start();FRS={o,f,g}}catch(e){return}}
 const t=AC.currentTime,on=friOn()&&marTela()&&state==='run',hz=on?(friSeg?140+420*friQ:90+speed*4.5):80,
  vol=on?(friSeg?.05+.07*friQ:clamp(power/600,0,.05)):0;
 FRS.o.frequency.setTargetAtTime(hz,t,.05);FRS.f.frequency.setTargetAtTime(500+hz*2,t,.08);FRS.g.gain.setTargetAtTime(vol,t,.06)}
const _friHud=hud;hud=function(){_friHud();friVibra()};
// o som é atualizado em todo quadro (também nos menus, para calar)
const _friAud=audioTick;audioTick=function(dt){_friAud(dt);friSom()};
