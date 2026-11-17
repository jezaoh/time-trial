/* ===== CICLISTA NOVO EM CAMADAS — TESTE só no Contrarrelógio (17/11) =====
   Arte do dono: folhas 4×3 (sentado = corpo + perna direita; em pé; perna esquerda) + folha da bike (quadro e peças soltas).
   Preparadas por tools/ciclista_novo/preparar.py (limpa o fundo, recorta as peças, mede o pé/sapato e as luvas de cada quadro).
   Montagem por quadro, de trás para a frente: perna esquerda (escurecida) → pedivela e pedal de trás → rodas (desenhadas,
   giram) → quadro → cassete, câmbio e corrente → coroa, pedivela e pedal da frente → corpo + perna direita.
   O pé de cada quadro manda: o pedal vai no pé e o pedivela aponta para ele (as folhas não giram em passos iguais; o jogo
   escolhe o quadro mais perto do ângulo do pedivela, então o giro sai contínuo). Corpo encaixado por mínimos quadrados:
   luvas → manete, centro do giro do pé → movimento central (e quadril → selim no sentado).
   Tecla N liga/desliga (para comparar com o sprite antigo). NC.on=false volta ao antigo. */
const NC_D={"sent":{"pes":[[150.3,259.4],[152.8,271.4],[174.0,292.8],[214.6,295.9],[232.9,306.8],[225.5,321.2],[178.4,342.0],[117.6,335.6],[96.8,315.3],[105.1,294.2],[124.5,267.7],[134.6,254.3]],"luvas":[[265.3,193.5],[265.3,193.4],[265.7,193.5],[265.5,193.4],[265.0,193.9],[265.1,193.9],[265.3,193.9],[265.2,194.1],[264.8,193.9],[264.9,193.7],[265.3,193.8],[265.7,193.9]]},"pe":{"pes":[[132.2,257.3],[132.0,279.0],[143.7,301.2],[172.0,307.4],[190.9,312.1],[174.9,320.9],[148.2,331.0],[103.9,312.3],[98.6,303.1],[110.9,274.4],[116.4,255.6],[122.8,239.6]],"luvas":[[262.5,188.0],[261.4,188.1],[262.4,188.2],[261.9,188.3],[262.6,188.1],[262.4,188.2],[262.6,188.0],[262.2,188.0],[262.2,188.1],[262.4,188.0],[262.4,188.4],[262.5,188.0]]},"perna":{"pes":[[151.2,261.0],[153.0,272.8],[173.3,294.2],[214.9,297.6],[231.9,307.4],[225.6,321.7],[177.4,342.3],[119.1,336.1],[95.7,315.5],[106.3,294.2],[124.6,268.5],[136.0,255.0]]},"bike":{"caixa":{"quadro":[726,199,1925,992],"coroa":[119,501,360,826],"pedivela":[250,276,350,477],"pedal":[97,884,239,979],"cassete":[542,212,727,403],"cambio":[463,461,625,663]},"traseira":[750,898],"dianteira":[1788,925],"mc":[1180,955],"selim":[940,222],"manete":[1840,265],"coroa_c":[231,613],"coroa_pedal":[188,798],"pedivela_eixo":[280,455],"pedivela_pedal":[320,305],"pedal_c":[168,931],"cassete_c":[634,307],"cambio_topo":[520,470],"raio_roda":350},"quadril_sent":[110,195]};
const NC={on:true,C:362,
 roda:{tras:[-86,-61],frente:[88,-61],r:59},   // mesmas rodas do sprite antigo (sombra, luzes e borrão continuam batendo)
 escuro:.38,
 rpm:{min:60,max:110,livre:15,suave:2.5}};   // cadência própria (não segue o dedo): 60 rpm leve → 110 rpm no sprint; sem força = roda livre                                   // perna e pedivela de trás
const NCW={};let ncTh=0,ncRpm=0;
// giro da perna: cadência pela força (P/FTP), suave; não usa a pedalada do dedo (pedal), que girava rápido demais
const _ncUpd=update;update=function(dt){_ncUpd(dt);if(MODO!=='crono'||state!=='run')return;const C=NC.rpm,r=power/FTP,
 alvo=power<C.livre?0:clamp(C.min+(C.max-C.min)*clamp((r-.4)/1.4,0,1),C.min,C.max);ncRpm+=(alvo-ncRpm)*Math.min(1,dt*C.suave);ncTh+=ncRpm/60*2*Math.PI*dt};   // geometria calculada uma vez
function ncPrep(){if(NCW.ok)return true;const need=['nc_sent','nc_pe','nc_perna','nc_quadro','nc_coroa','nc_pedivela','nc_pedal','nc_cassete','nc_cambio'];
 if(need.some(k=>!IMG[k]||!IMG[k].width))return false;const B=NC_D.bike,R=NC.roda;
 const dx=B.dianteira[0]-B.traseira[0],dy=B.dianteira[1]-B.traseira[1];NCW.kb=(R.frente[0]-R.tras[0])/Math.hypot(dx,dy);NCW.a=-Math.atan2(dy,dx);
 const ca=Math.cos(NCW.a),sa=Math.sin(NCW.a);NCW.f=p=>{const x=(p[0]-B.traseira[0])*NCW.kb,y=(p[1]-B.traseira[1])*NCW.kb;return[R.tras[0]+x*ca-y*sa,R.tras[1]+x*sa+y*ca]};
 NCW.mc=NCW.f(B.mc);
 // pose: escala + deslocamento do quadro da folha para o mundo (mínimos quadrados nos pontos de encaixe)
 for(const k of['sent','pe']){const D=NC_D[k],pes=D.pes,cx=pes.reduce((s,p)=>s+p[0],0)/pes.length,cy=pes.reduce((s,p)=>s+p[1],0)/pes.length,lu=D.luvas[0];
  const par=[[lu,NCW.f(B.manete)],[[cx,cy],NCW.mc]];if(k==='sent')par.push([NC_D.quadril_sent,NCW.f(B.selim)]);
  const mc=[0,1].map(i=>par.reduce((s,q)=>s+q[0][i],0)/par.length),mw=[0,1].map(i=>par.reduce((s,q)=>s+q[1][i],0)/par.length);
  let nu=0,de=0;for(const[c,w]of par){nu+=(c[0]-mc[0])*(w[0]-mw[0])+(c[1]-mc[1])*(w[1]-mw[1]);de+=(c[0]-mc[0])**2+(c[1]-mc[1])**2}
  const s=nu/de;NCW[k]={s,tx:mw[0]-s*mc[0],ty:mw[1]-s*mc[1],ang:pes.map(p=>Math.atan2(p[1]-cy,p[0]-cx))}}
 NCW.perna={...NCW.sent,ang:NCW.sent.ang};
 // versões escurecidas (feitas uma vez: sem ctx.filter por quadro)
 const esc=im=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-atop';g.fillStyle=`rgba(20,24,40,${NC.escuro})`;g.fillRect(0,0,c.width,c.height);return c};
 NCW.pernaE=esc(IMG.nc_perna);NCW.peE=esc(IMG.nc_pe);NCW.pedivelaE=esc(IMG.nc_pedivela);NCW.pedalE=esc(IMG.nc_pedal);NCW.ok=true;return true}
const ncQuadro=(P,th)=>{let b=0,bd=9;P.ang.forEach((a,i)=>{const d=Math.abs(Math.atan2(Math.sin(th-a),Math.cos(th-a)));if(d<bd){bd=d;b=i}});return b};
const ncPe=(k,i)=>{const P=NCW[k],p=NC_D[k==='perna'?'perna':k].pes[i];return[P.tx+P.s*p[0],P.ty+P.s*p[1]]};
function ncFolha(img,P,i){const C=NC.C,s=P.s;ctx.drawImage(img,(i%4)*C,Math.floor(i/4)*C,C,C,P.tx,P.ty,C*s,C*s)}
// peça da folha da bike: caixa (px da folha) desenhada no mundo; com giro em volta de um ponto (opcional)
function ncPeca(nome,cx,cy,giro,onde){const B=NC_D.bike,bx=B.caixa[nome],im=IMG['nc_'+nome],k=NCW.kb,[wx,wy]=onde||NCW.f([cx,cy]);ctx.save();   // onde: ponto do mundo (peças soltas da folha)
ctx.translate(wx,wy);ctx.rotate(NCW.a+(giro||0));
 ctx.drawImage(im,(bx[0]-cx)*k,(bx[1]-cy)*k,(bx[2]-bx[0])*k,(bx[3]-bx[1])*k);ctx.restore()}
// pedivela esticado do movimento central até o pé + pedal no pé
function ncPedivela(img,ped,p){const B=NC_D.bike,[ex,ey]=B.pedivela_eixo,[px,py]=B.pedivela_pedal,L0=Math.hypot(px-ex,py-ey),a0=Math.atan2(py-ey,px-ex),bx=B.caixa.pedivela,k=NCW.kb;
 const[mx,my]=NCW.mc,L=Math.hypot(p[0]-mx,p[1]-my),a=Math.atan2(p[1]-my,p[0]-mx),s=Math.max(.6,L/(L0*k));
 ctx.save();ctx.translate(mx,my);ctx.rotate(a-a0);ctx.scale(1,1);ctx.translate(0,0);
 const u=[Math.cos(a0),Math.sin(a0)];ctx.transform(1+(s-1)*u[0]*u[0],(s-1)*u[0]*u[1],(s-1)*u[0]*u[1],1+(s-1)*u[1]*u[1],0,0);   // estica só ao longo do braço
 ctx.drawImage(img,(bx[0]-ex)*k,(bx[1]-ey)*k,(bx[2]-bx[0])*k,(bx[3]-bx[1])*k);ctx.restore();
 const pc=B.pedal_c,pb=B.caixa.pedal,w=(pb[2]-pb[0])*k,h=(pb[3]-pb[1])*k;ctx.drawImage(ped,p[0]-(pc[0]-pb[0])*k,p[1]-(pc[1]-pb[1])*k*.6,w,h)}
function ncRoda(cx,cy,r,ang){ctx.save();ctx.translate(cx,cy);
 ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.lineWidth=r*.13;ctx.strokeStyle='#1d1f26';ctx.stroke();                 // pneu
 ctx.beginPath();ctx.arc(0,0,r*.9,0,7);ctx.lineWidth=r*.07;ctx.strokeStyle='#3a3e4a';ctx.stroke();               // aro
 ctx.lineWidth=1.2;ctx.strokeStyle='rgba(40,44,56,.85)';ctx.beginPath();for(let i=0;i<18;i++){const a=ang+i*Math.PI/9;ctx.moveTo(Math.cos(a)*r*.08,Math.sin(a)*r*.08);ctx.lineTo(Math.cos(a+.25)*r*.87,Math.sin(a+.25)*r*.87)}ctx.stroke();
 ctx.beginPath();ctx.arc(0,0,r*.1,0,7);ctx.fillStyle='#2a2d36';ctx.fill();ctx.restore()}
// chamado no lugar do sprite do jogador (desenho.js), já no sistema do ciclista (chão = 0)
function ncDesenha(st){if(!NC.on||MODO!=='crono'||!ncPrep())return false;
 const pose=st>=2?'pe':'sent',P=NCW[pose],th=ncTh,iD=ncQuadro(P,th),iT=ncQuadro(P,th+Math.PI),R=NC.roda,B=NC_D.bike,ang=T*speed*.45;
 const peD=ncPe(pose,iD),peT=ncPe(pose,iT);
 // perna esquerda atrás (sentado: folha da perna; em pé: a própria folha em pé, o corpo de trás fica escondido pelo da frente)
 if(pose==='sent')ncFolha(NCW.pernaE,NCW.perna,iT);else ncFolha(NCW.peE,P,iT);
 ncPedivela(NCW.pedivelaE,NCW.pedalE,peT);
 ncRoda(R.tras[0],R.tras[1],R.r,ang);ncRoda(R.frente[0],R.frente[1],R.r,ang);
 ncPeca('cassete',B.cassete_c[0],B.cassete_c[1],ang*.3,R.tras);
 ncPeca('quadro',B.caixa.quadro[0],B.caixa.quadro[1]);
 // corrente: em cima da coroa até o cassete; embaixo até o câmbio
 {const[mx,my]=NCW.mc,[rx,ry]=R.tras,k=NCW.kb,rc=104*k,rk=80*k;ctx.save();ctx.strokeStyle='#30333c';ctx.lineWidth=2.4;ctx.beginPath();
  ctx.moveTo(mx,my-rc);ctx.lineTo(rx,ry-rk);ctx.moveTo(mx,my+rc);ctx.lineTo(rx+2,ry+150*k);ctx.stroke();ctx.restore()}
 ncPeca('cambio',B.cambio_topo[0],B.cambio_topo[1],0,[R.tras[0]-2,R.tras[1]+3]);
 {const[cx,cy]=B.coroa_c,[px,py]=B.coroa_pedal,a0=Math.atan2(py-cy,px-cx),[mx,my]=NCW.mc,a=Math.atan2(peD[1]-my,peD[0]-mx),bx=B.caixa.coroa,k=NCW.kb;
  ctx.save();ctx.translate(mx,my);ctx.rotate(a-a0);ctx.drawImage(IMG.nc_coroa,(bx[0]-cx)*k,(bx[1]-cy)*k,(bx[2]-bx[0])*k,(bx[3]-bx[1])*k);ctx.restore()}
 ncPedivela(IMG.nc_pedivela,IMG.nc_pedal,peD);
 ncFolha(IMG['nc_'+pose],P,iD);
 return true}
addEventListener('keydown',e=>{if(e.code==='KeyN'&&e.target!==nickEl&&MODO==='crono')NC.on=!NC.on});
