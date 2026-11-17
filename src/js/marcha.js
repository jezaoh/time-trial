/* ===== FEELING NA BARRA DE STAMINA — HUD, vibração e som (teste só no Contrarrelógio, 17/11) =====
   A mecânica está em mecanica.js (bloco FRI). Uma barra só (a de STAMINA/FADIGA, desenhada por staminaBar), sem alvo.
   Aqui: FC com a zona e W' em kJ à direita, itens nas bagzinhas no canto esquerdo, vibração e som de fricção.
   (O nome do arquivo ficou do teste das marchas, que saiu; o <script> no index.html continua o mesmo.) */
const MARH={slotX:36,slotPasso:104,                              // bagzinhas dos itens
 fc:{x:1160,y:224,w:346,h:64},wp:{x:1160,y:296,w:346,h:50},
 zonas:[[.6,'#9fb3c8','Z1'],[.7,'#4fc3ff','Z2'],[.8,'#35f21c','Z3'],[.9,'#ffd83a','Z4'],[9,'#ff3b2a','Z5']],
};
const marSlotX=i=>MARH.slotX+i*MARH.slotPasso;
const marTela=()=>friOn()&&(state==='run'||state==='paused');
function friHud(){
 // FC com a zona
 const H0=MARH,F=H0.fc,fc=Math.round(friFC),pz=fc/FRI.fc.max,z=H0.zonas.find(q=>pz<q[0]);pilula(F.x,F.y,F.w,F.h);
 tx('♥',F.x+24,F.y+46,34,'left','#ff3b5c');tx(`${fc}`,F.x+70,F.y+47,40,'left','#fff');tx('bpm',F.x+70+ctx.measureText(`${fc}`).width+8,F.y+46,20,'left','#fff');
 rr(F.x+F.w-82,F.y+12,62,40,12);ctx.fillStyle=z[1];ctx.fill();ctx.font=FT(900,26);ctx.textAlign='center';ctx.fillStyle='#06121e';ctx.fillText(z[2],F.x+F.w-51,F.y+42);
 // W' em kJ (a stamina em energia)
 const P=H0.wp;pilula(P.x,P.y,P.w,P.h);tx("W'",P.x+24,P.y+35,22,'left','#fff');tx(`${(stamina/100*FRI.wpKJ).toFixed(1).replace('.',',')} kJ`,P.x+P.w-24,P.y+36,28,'right','#fff')}
// bagzinhas dos itens (atrás das garrafas)
function marBags(){const n=slotsHUD().length;for(let i=0;i<n;i++){const x=marSlotX(i);rr(x-14,676,104,156,18);ctx.fillStyle='rgba(10,26,44,.55)';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='rgba(207,216,225,.7)';ctx.stroke()}}
// vibração: um "toc" a cada pedalada e pulsos cada vez mais fortes enquanto segura (só Android)
let friVibT=0,friVibU=-9;
function friPressao(){return friSeg?clamp((friT-friUlt-FRI.segura)/1.2,0,1):0}
function friVibra(){if(!friOn()||state!=='run'||typeof vibrar!=='function')return;
 if(friUlt!==friVibU){friVibU=friUlt;vibrar(10)}
 else if(friSeg&&friPressao()>0&&friT-friVibT>.11){friVibT=friT;vibrar(Math.round(8+22*friPressao()))}}
// som: motor de fricção (dente de serra filtrado) — sobe de tom com a pressão enquanto segura; solto, zumbe pela velocidade
let FRS=null;
function friSom(){if(typeof AC==='undefined'||!AC||!gSfx)return;
 if(!FRS){try{const o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';f.type='lowpass';f.frequency.value=900;g.gain.value=0;
  o.connect(f);f.connect(g);g.connect(gSfx);o.start();FRS={o,f,g}}catch(e){return}}
 const t=AC.currentTime,on=marTela()&&state==='run',q=friPressao(),hz=on?(q>0?160+400*q:90+speed*4.5):80,
  vol=on?(q>0?.05+.07*q:clamp(power/600,0,.05)):0;
 FRS.o.frequency.setTargetAtTime(hz,t,.05);FRS.f.frequency.setTargetAtTime(500+hz*2,t,.08);FRS.g.gain.setTargetAtTime(vol,t,.06)}
const _marHud=hud;hud=function(){const on=marTela();if(on)marBags();_marHud();if(on)friHud();friVibra()};
// o som é atualizado em todo quadro (também nos menus, para calar)
const _friAud=audioTick;audioTick=function(dt){_friAud(dt);friSom()};
