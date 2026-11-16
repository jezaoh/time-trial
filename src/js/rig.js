/* ===== PROTÓTIPO: ciclista montado por peças (animação por recorte) =====
   Só no CONTRARRELÓGIO, para comparar com o sprite atual (tecla R alterna).
   O jogo monta o ciclista a cada quadro: pé de vela gira em ângulo contínuo, pé acompanha o pedal (com leve "ankling"),
   joelho e cotovelo calculados por cinemática inversa de 2 ossos, rodas giram de verdade, corrente desenhada.
   Coordenadas: "unidades do quadro" = pixels do recorte original do quadro (Marvac). Peças do corpo: pixels do recorte original
   de cada peça; k = escala corpo→quadro, calculada para a perna alcançar o pedal embaixo com o joelho levemente dobrado.
   Pontos (pivôs) medidos nos recortes: a = junta de origem, b = junta de destino. */
const RIG={on:true,corpo:1.22,   // corpo 22% maior que o natural para o quadro: o canote sobe para a perna alcançar

 frame:{img:'rig_frame',sc:.5,rear:[26,485],bb:[318,527],front:[725,486],saddle:[158,22],hood:[760,74]},
 wheel:{img:'rig_wheel',sc:.5,c:[222.5,228],r:228,R:242},
 crank:{img:'rig_crankset',sc:.6,c:[112,115],end:[286,115],len:126,ring:112},
 crankArm:{img:'rig_crankarm',sc:.6,a:[30,34],b:[152,34]},
 cassette:{img:'rig_cassette',sc:.6,c:[90,93],d:165,D:84},
 rd:{img:'rig_rd',sc:.6,top:[80,40],k:.42},
 pedal:{img:'rig_pedal',sc:.6,c:[140,62],k:.32},
 P:{thigh:{img:'rig_thigh',a:[64,56],b:[184,214]},shin:{img:'rig_shin',a:[64,32],b:[56,234]},shoe:{img:'rig_shoe',a:[58,30],b:[122,98]},
    torso:{img:'rig_torso',a:[48,198],b:[168,104],neck:[222,40]},uarm:{img:'rig_uarm',a:[70,34],b:[46,178]},farm:{img:'rig_farm',a:[42,52],b:[214,148]},
    head:{img:'rig_head',a:[96,196]}}};
const RS={theta:0,roda:0,pe:0,s:0,ok:false,k:1,G:.25,CX:0,GND:0,L:{},hip:[0,0],dark:{}};
const v2=(a,b)=>[a[0]+b[0],a[1]+b[1]],vs=(a,b)=>[a[0]-b[0],a[1]-b[1]],vk=(a,k)=>[a[0]*k,a[1]*k],vl=a=>Math.hypot(a[0],a[1]),vang=a=>Math.atan2(a[1],a[0]);
const vrot=(a,t)=>[a[0]*Math.cos(t)-a[1]*Math.sin(t),a[0]*Math.sin(t)+a[1]*Math.cos(t)];
function rigPronto(){if(RS.ok)return true;const all=[RIG.frame,RIG.wheel,RIG.crank,RIG.crankArm,RIG.cassette,RIG.rd,RIG.pedal,...Object.values(RIG.P)];
 for(const p of all){const im=IMG[p.img];if(!im||!im.width)return false}rigInit();return RS.ok=true}
function escuro(im){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
 x.globalCompositeOperation='source-atop';x.fillStyle='rgba(16,26,44,.40)';x.fillRect(0,0,c.width,c.height);return c}
function rigInit(){const F=RIG.frame,P=RIG.P;
 for(const n of['thigh','shin','shoe','uarm','farm'])RS.dark[n]=escuro(IMG[P[n].img]);RS.dark.crankArm=escuro(IMG[RIG.crankArm.img]);RS.dark.pedal=escuro(IMG[RIG.pedal.img]);
 const len=n=>vl(vs(P[n].b,P[n].a));
 // escala do corpo: perna (coxa+canela) = 1,04 × distância quadril→tornozelo com o pedal embaixo
 const hip0=v2(F.saddle,[-6,-38]),pe=v2(F.bb,[0,RIG.crank.len]);
 let k=1;for(let i=0;i<20;i++){const ank=v2(pe,vk(vs(P.shoe.a,P.shoe.b),k));k=1.04*vl(vs(ank,hip0))/(len('thigh')+len('shin'))}
 k*=RIG.corpo;
 // canote mais alto: quadril sobe na linha do tubo do selim até a perna caber
 const u=vk(vs(F.saddle,F.bb),1/vl(vs(F.saddle,F.bb))),ank=v2(pe,vk(vs(P.shoe.a,P.shoe.b),k));let sub=0;
 while(sub<400&&vl(vs(ank,v2(hip0,vk(u,sub))))<(len('thigh')+len('shin'))*k/1.04)sub+=2;
 RS.sub=vk(u,sub);RS.hip=v2(hip0,RS.sub);
 RS.k=k;for(const n of['thigh','shin','torso','uarm','farm'])RS.L[n]=len(n)*k;
 // enquadramento: rodas de ponta a ponta = 300 px na tela (como o sprite atual)
 const R=RIG.wheel.R,left=F.rear[0]-R,right=F.front[0]+R;RS.CX=(left+right)/2;RS.GND=Math.max(F.rear[1],F.front[1])+R;RS.G=300/(right-left)}
// cinemática inversa de 2 ossos: junta do meio para o lado "lado" (+1 = escolhe a de maior x; 'baixo' = maior y)
function ik(A,C,l1,l2,pref){let d=vs(C,A),D=vl(d);D=Math.min(D,(l1+l2)*.999);const a=vang(d),b=Math.acos(clamp((l1*l1+D*D-l2*l2)/(2*l1*D),-1,1));
 const j1=v2(A,vk([Math.cos(a-b),Math.sin(a-b)],l1)),j2=v2(A,vk([Math.cos(a+b),Math.sin(a+b)],l1));
 return pref==='frente'?(j1[0]>j2[0]?j1:j2):(j1[1]>j2[1]?j1:j2)}
// desenha uma peça levando o ponto a→JA e girando para o ponto b apontar para JB (escala k fixa)
function peca(img,sc,pa,pb,JA,JB,k){const ang=vang(vs(JB,JA))-vang(vs(pb,pa));ctx.save();ctx.translate(JA[0],JA[1]);ctx.rotate(ang);ctx.scale(k/sc,k/sc);ctx.drawImage(img,-pa[0]*sc,-pa[1]*sc);ctx.restore();
 return p=>v2(JA,vrot(vk(vs(p,pa),k),ang))}
function rigPasso(dt){if(!RS.ok)return;
 const r=pShow/FTP,coast=power<25;
 const rpm=coast?0:clamp(72+30*(r-.6),62,112)+(r>=SPR.sprint?10:0);
 RS.theta+=dt*rpm/60*2*Math.PI;
 RS.roda+=speed*9*dt/(RIG.wheel.R*RS.G);
 const alvo=(stV===2||stV===3)?1:0;RS.s+=(alvo-RS.s)*Math.min(1,dt*5)}
function desenharRig(){if(!rigPronto())return false;const F=RIG.frame,P=RIG.P,k=RS.k,th=RS.theta,s=RS.s;
 ctx.save();ctx.scale(RS.G,RS.G);ctx.translate(-RS.CX,-RS.GND);
 // quadril: sentado no selim; em pé vai para frente e para cima e balança com a pedalada
 const hip=v2(RS.hip,[s*(70+16*Math.cos(th)),s*(-80+10*Math.sin(2*th))]);
 const hood=F.hood,bb=F.bb,cl=RIG.crank.len;
 // tronco: ângulo para os braços alcançarem a manopla com cotovelo dobrado
 const reach=(RS.L.uarm+RS.L.farm)*(.80-.04*s);let best=-.6,bd=1e9;
 for(let a=-1.45;a<-.05;a+=.01){const sh=v2(hip,[Math.cos(a)*RS.L.torso,Math.sin(a)*RS.L.torso]),d=Math.abs(vl(vs(hood,sh))-reach);if(d<bd){bd=d;best=a}}
 const respira=Math.sin(T*3)*.012;const ta=best+respira,sh=v2(hip,[Math.cos(ta)*RS.L.torso,Math.sin(ta)*RS.L.torso]);
 const pedalPt=a=>v2(bb,[Math.cos(a)*cl,Math.sin(a)*cl]);
 const pePerna=(a)=>{const p=pedalPt(a),phi=.10+.16*Math.sin(a-.6),cleat=v2(p,[0,-7]),ank=v2(cleat,vrot(vk(vs(P.shoe.a,P.shoe.b),k),phi));return{p,phi,cleat,ank}};
 const perna=(a,dk)=>{const L=pePerna(a),kn=ik(hip,L.ank,RS.L.thigh,RS.L.shin,'frente');
  const im=n=>dk?RS.dark[n]:IMG[P[n].img];
  // pedal
  ctx.save();ctx.translate(L.p[0],L.p[1]);ctx.rotate(L.phi);const pk=RIG.pedal.k/RIG.pedal.sc;ctx.scale(pk,pk);ctx.drawImage(dk?RS.dark.pedal:IMG[RIG.pedal.img],-RIG.pedal.c[0]*RIG.pedal.sc,-RIG.pedal.c[1]*RIG.pedal.sc);ctx.restore();
  // sapatilha (taquinho no pedal), canela, coxa
  ctx.save();ctx.translate(L.cleat[0],L.cleat[1]);ctx.rotate(L.phi);ctx.scale(k,k);ctx.drawImage(im('shoe'),-P.shoe.b[0],-P.shoe.b[1]);ctx.restore();
  peca(im('shin'),1,P.shin.a,P.shin.b,kn,L.ank,k);peca(im('thigh'),1,P.thigh.a,P.thigh.b,hip,kn,k)};
 const braco=(off,dk)=>{const S=v2(sh,off),H=v2(hood,[0,off[1]*.3]),el=ik(S,H,RS.L.uarm,RS.L.farm,'baixo');const im=n=>dk?RS.dark[n]:IMG[P[n].img];
  peca(im('farm'),1,P.farm.a,P.farm.b,el,H,k);peca(im('uarm'),1,P.uarm.a,P.uarm.b,S,el,k)};
 const rodaAt=(c)=>{const W=RIG.wheel,ks=W.R/W.r/W.sc;ctx.save();ctx.translate(c[0],c[1]);ctx.rotate(RS.roda);ctx.scale(ks,ks);ctx.drawImage(IMG[W.img],-W.c[0]*W.sc,-W.c[1]*W.sc);ctx.restore()};
 // 1) braço de lá (atrás de tudo)
 braco([-10,6],true);
 // 2) rodas
 rodaAt(F.rear);rodaAt(F.front);
 // 3) perna de lá + pé de vela de lá
 perna(th+Math.PI,true);
 {const C=RIG.crankArm,a2=th+Math.PI;peca(RS.dark.crankArm,C.sc,C.a,C.b,bb,pedalPt(a2),cl/vl(vs(C.b,C.a)))}
 // 4) quadro
 {const im=IMG[F.img],w=im.width/F.sc,h=im.height/F.sc,sx0=30,sy0=0,sw=270,sh0=72;   // selim recortado e levantado junto com o canote
  ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.rect(sx0,sy0,sw,sh0);ctx.clip('evenodd');ctx.drawImage(im,0,0,w,h);ctx.restore();
  const t=[150,64],t2=v2(t,RS.sub);ctx.save();ctx.lineCap='round';ctx.strokeStyle='#0d0f12';ctx.lineWidth=30;ctx.beginPath();ctx.moveTo(t[0]+6,t[1]+40);ctx.lineTo(t2[0],t2[1]);ctx.stroke();
  ctx.strokeStyle='#3a3f47';ctx.lineWidth=20;ctx.stroke();ctx.restore();
  ctx.save();ctx.translate(RS.sub[0],RS.sub[1]);ctx.drawImage(im,sx0*F.sc,sy0*F.sc,sw*F.sc,sh0*F.sc,sx0,sy0,sw,sh0);ctx.restore()}
 // 5) transmissão: cassete, câmbio, corrente, coroa com pé de vela de cá
 {const C=RIG.cassette,ks=C.D/C.d/C.sc;ctx.save();ctx.translate(F.rear[0],F.rear[1]);ctx.rotate(RS.roda*.6);ctx.scale(ks,ks);ctx.drawImage(IMG[C.img],-C.c[0]*C.sc,-C.c[1]*C.sc);ctx.restore()}
 {const D=RIG.rd,ks=D.k/D.sc;ctx.save();ctx.translate(F.rear[0]-6,F.rear[1]+20);ctx.scale(ks,ks);ctx.drawImage(IMG[D.img],-D.top[0]*D.sc,-D.top[1]*D.sc);ctx.restore()}
 {const kc=cl/vl(vs(RIG.crank.end,RIG.crank.c)),rc=RIG.crank.ring*kc*.92,rs=RIG.cassette.D/2*.92;ctx.save();ctx.strokeStyle='#3b3f46';ctx.lineWidth=7;ctx.setLineDash([9,6]);ctx.lineDashOffset=-th*rc;
  ctx.beginPath();ctx.moveTo(bb[0],bb[1]-rc);ctx.lineTo(F.rear[0],F.rear[1]-rs);ctx.stroke();ctx.beginPath();ctx.moveTo(bb[0],bb[1]+rc);ctx.lineTo(F.rear[0]+4,F.rear[1]+72);ctx.stroke();ctx.restore()}
 {const C=RIG.crank;peca(IMG[C.img],C.sc,C.c,C.end,bb,pedalPt(th),cl/vl(vs(C.end,C.c)))}
 // 6) perna de cá, tronco, cabeça, braço de cá
 perna(th,false);
 const mt=peca(IMG[P.torso.img],1,P.torso.a,P.torso.b,hip,sh,k);
 {const nk=mt(P.torso.neck),hk=k*.98;ctx.save();ctx.translate(nk[0],nk[1]);ctx.rotate(ta*.25+.18+(stV===3?.08*Math.sin(th*2):0));ctx.scale(hk,hk);ctx.drawImage(IMG[P.head.img],-P.head.a[0],-P.head.a[1]);ctx.restore()}
 braco([0,0],false);
 ctx.restore();return true}
// liga no contrarrelógio; R alterna entre boneco novo e sprite
function rigAtivo(){return RIG.on&&MODO==='crono'&&rigPronto()}
const _rigUpdate=update;update=function(dt){_rigUpdate(dt);if(state==='run')rigPasso(dt)};
addEventListener('keydown',e=>{if(e.code==='KeyR'&&!e.repeat&&e.target!==nickEl){RIG.on=!RIG.on}});
