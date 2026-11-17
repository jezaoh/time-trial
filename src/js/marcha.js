/* ===== FRICÇÃO NA BARRA DE STAMINA — HUD, vibração e som (teste só no Contrarrelógio, 17/11) =====
   A mecânica está em mecanica.js (bloco FRI). Uma barra só: a de STAMINA/FADIGA.
   Na barra: a JANELA branca (onde soltar = PERFEITA) fica logo à esquerda da ponta do verde; a faixa laranja depois dela é o
   GÁS. Segurando, a ponta do verde anda para a esquerda até a janela. Aviso da empurrada logo acima da barra.
   Direita: FC com a zona e W' em kJ. Itens nas bagzinhas no canto esquerdo.
   (O nome do arquivo ficou do teste das marchas, que saiu; o <script> no index.html continua o mesmo.) */
const MARH={slotX:36,slotPasso:104,                              // bagzinhas dos itens
 fc:{x:1160,y:224,w:346,h:64},wp:{x:1160,y:296,w:346,h:50},
 zonas:[[.6,'#9fb3c8','Z1'],[.7,'#4fc3ff','Z2'],[.8,'#35f21c','Z3'],[.9,'#ffd83a','Z4'],[9,'#ff3b2a','Z5']],
 cor:{fraca:'#cfd8e1',perfeita:'#35f21c',gas:'#ff9a1f',patinou:'#ff3b2a'},
 txt:{fraca:'FRACA',perfeita:'PERFEITA!',gas:'GÁS!',patinou:'PATINOU!'},
 barra:[386,728,763]};                                           // mesma posição de staminaBar() no hud()
const marSlotX=i=>MARH.slotX+i*MARH.slotPasso;
const marTela=()=>friOn()&&(state==='run'||state==='paused');
// miolo da barra de stamina (mesma conta de staminaBar em desenho.js)
function friBarra(){const A=IMG.st_aro;if(!A||!A.width)return null;const[x,y,w]=MARH.barra,k=w/A.width;return{ix:x+14*k,iy:y+24*k,iw:1172*k,ih:62*k,x,y,w,h:A.height*k}}
function friHud(){const B=friBarra();if(!B)return;const s0=friSeg?friS0:stamina,[a,l]=friJanela(s0),X=v=>B.ix+B.iw*clamp(v,0,100)/100;
 const p1=s0-a,p0=p1-l,g0=p0-FRI.laranja,dentro=friSeg&&stamina<=p1&&stamina>=p0;
 ctx.save();rr(B.ix,B.iy,B.iw,B.ih,B.ih/2);ctx.clip();
 // gás (laranja) entre o fim da janela e o limite; a janela (branca) onde soltar
 if(p0>0){ctx.fillStyle='rgba(255,154,31,.55)';ctx.fillRect(X(g0),B.iy,X(p0)-X(g0),B.ih)}
 const jx=X(p0),jw=Math.max(6,X(p1)-X(p0));ctx.fillStyle=dentro?`rgba(255,255,255,${.55+.35*Math.sin(T*30)})`:'rgba(255,255,255,.35)';ctx.fillRect(jx,B.iy,jw,B.ih);
 ctx.lineWidth=4;ctx.strokeStyle='#fff';ctx.strokeRect(jx+2,B.iy+2,jw-4,B.ih-4);
 ctx.restore();
 // aviso da última empurrada (sobe e some em 0,9 s)
 const dt=friT-friZT;if(friZ&&dt<.9){ctx.globalAlpha=clamp(1.6-dt*1.8,0,1);const t=MARH.txt[friZ]+(friZ==='perfeita'&&friSeq>1?` ×${friSeq}`:'');
  tx(t,B.x+B.w/2,B.y-14-dt*40,friZ==='perfeita'?36:30,'center',MARH.cor[friZ]);ctx.globalAlpha=1}
 // FC com a zona
 const H0=MARH,F=H0.fc,fc=Math.round(friFC),pz=fc/FRI.fc.max,z=H0.zonas.find(q=>pz<q[0]);pilula(F.x,F.y,F.w,F.h);
 tx('♥',F.x+24,F.y+46,34,'left','#ff3b5c');tx(`${fc}`,F.x+70,F.y+47,40,'left','#fff');tx('bpm',F.x+70+ctx.measureText(`${fc}`).width+8,F.y+46,20,'left','#fff');
 rr(F.x+F.w-82,F.y+12,62,40,12);ctx.fillStyle=z[1];ctx.fill();ctx.font=FT(900,26);ctx.textAlign='center';ctx.fillStyle='#06121e';ctx.fillText(z[2],F.x+F.w-51,F.y+42);
 // W' em kJ (a stamina em energia)
 const P=H0.wp;pilula(P.x,P.y,P.w,P.h);tx("W'",P.x+24,P.y+35,22,'left','#fff');tx(`${(stamina/100*FRI.wpKJ).toFixed(1).replace('.',',')} kJ`,P.x+P.w-24,P.y+36,28,'right','#fff')}
// bagzinhas dos itens (atrás das garrafas)
function marBags(){const n=slotsHUD().length;for(let i=0;i<n;i++){const x=marSlotX(i);rr(x-14,676,104,156,18);ctx.fillStyle='rgba(10,26,44,.55)';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='rgba(207,216,225,.7)';ctx.stroke()}}
// vibração: pulsos cada vez mais fortes enquanto segura; um "toc" ao soltar na janela (só Android)
let friVibT=0,friVibZ=-9;
function friPressao(){const[a,l]=friJanela(friS0);return clamp(friG/(a+l+FRI.laranja),0,1)}
function friVibra(){if(!friOn()||state!=='run'||typeof vibrar!=='function')return;
 if(friSeg&&friT-friVibT>.11){friVibT=friT;vibrar(Math.round(6+22*friPressao()))}
 if(friZT!==friVibZ){friVibZ=friZT;if(friZ==='perfeita')vibrar(35);else if(friZ==='patinou')vibrar(70)}}
// som: motor de fricção (dente de serra filtrado) — sobe de tom com a pressão enquanto segura; solto, zumbe pela velocidade
let FRS=null;
function friSom(){if(typeof AC==='undefined'||!AC||!gSfx)return;
 if(!FRS){try{const o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';f.type='lowpass';f.frequency.value=900;g.gain.value=0;
  o.connect(f);f.connect(g);g.connect(gSfx);o.start();FRS={o,f,g}}catch(e){return}}
 const t=AC.currentTime,on=marTela()&&state==='run',q=friSeg?friPressao():0,hz=on?(friSeg?140+420*q:90+speed*4.5):80,
  vol=on?(friSeg?.05+.07*q:clamp(power/600,0,.05)):0;
 FRS.o.frequency.setTargetAtTime(hz,t,.05);FRS.f.frequency.setTargetAtTime(500+hz*2,t,.08);FRS.g.gain.setTargetAtTime(vol,t,.06)}
const _marHud=hud;hud=function(){const on=marTela();if(on)marBags();_marHud();if(on)friHud();friVibra()};
// o som é atualizado em todo quadro (também nos menus, para calar)
const _friAud=audioTick;audioTick=function(dt){_friAud(dt);friSom()};
