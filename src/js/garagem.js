/* ===== GARAGEM (16/11) — peças SÓ VISUAIS da Carreira (decisão do dono: não mexem na física; o Contrarrelógio fica original) =====
   LOJA ganha duas abas: ITENS (a loja de sempre) e GARAGEM. Na garagem: provador à esquerda (o seu ciclista pedalando com a peça
   escolhida, antes de comprar) e a grade de peças por categoria à direita.
   Como pinta (sem arte nova): as mesmas máscaras dos NPCs (npc.js · npcQuadro: p uniforme, s detalhe, h capacete, w meia/sapatilha,
   b quadro; as do sprint — estado 3 — foram geradas em 16/11 com tools/sprites_npc/mascaras2.py). Rodas de perfil e disco são
   desenhadas por cima do sprite e o quadro + o pé de FORA são redesenhados por cima da roda (o pé de dentro fica atrás do aro).
   Os quadros prontos ficam guardados (GAR_CACHE) e são montados na largada (garAquecer), não a cada quadro.
   Conquistas: difícil (d) LIBERA a compra de uma peça (lib); lendária (l) DÁ uma peça exclusiva (lend) + título.
   Salvamento: CS.gar = {tem:{id:true}, uso:{cat:id}} (carNovo/Object.assign: saves antigos ganham o padrão). */
const GAR_CAT=[{k:'uni',n:'UNIFORME'},{k:'quadro',n:'QUADRO'},{k:'cap',n:'CAPACETE'},{k:'sap',n:'SAPATILHA'},{k:'rodas',n:'RODAS'},{k:'aro',n:'ARO'}];
// c: cor principal · s: 2ª cor (uniformes azul e vinho; o branco só tem uma) · roda: p40 | p60 | disco · p: preço · lib/lend: conquista
const GAR=[
 {id:'u_verm',cat:'uni',n:'VERMELHO',p:500,c:[220,30,30],s:[255,255,255]},
 {id:'u_verde',cat:'uni',n:'VERDE',p:500,c:[20,150,60],s:[255,215,0]},
 {id:'u_amar',cat:'uni',n:'AMARELO',p:500,c:[245,200,20],s:[30,30,30]},
 {id:'u_lar',cat:'uni',n:'LARANJA',p:500,c:[255,120,0],s:[30,30,30]},
 {id:'u_preto',cat:'uni',n:'PRETO',p:600,c:[38,38,46],s:[255,120,0]},
 {id:'u_roxo',cat:'uni',n:'ROXO',p:800,c:[110,40,170],s:[40,220,255],lib:'t095'},
 {id:'u_ciano',cat:'uni',n:'CIANO',p:800,c:[30,190,230],s:[255,255,255],lib:'t061'},
 {id:'u_ouro',cat:'uni',n:'OURO',lend:'t100',c:[230,180,40],s:[30,30,30]},
 {id:'u_prata',cat:'uni',n:'PRATA',lend:'t011',c:[190,196,206],s:[30,30,30]},
 {id:'u_rosa',cat:'uni',n:'ROSA',lend:'t040',c:[240,90,160],s:[255,255,255]},
 {id:'q_verm',cat:'quadro',n:'VERMELHO',p:1200,c:[200,30,30]},
 {id:'q_verde',cat:'quadro',n:'VERDE',p:1200,c:[20,150,60]},
 {id:'q_lar',cat:'quadro',n:'LARANJA',p:1200,c:[255,120,0]},
 {id:'q_roxo',cat:'quadro',n:'ROXO',p:1200,c:[120,50,190]},
 {id:'q_preto',cat:'quadro',n:'CARBONO',p:2000,c:[38,38,46],lib:'t030'},
 {id:'c_verm',cat:'cap',n:'VERMELHO',p:300,c:[220,40,40]},
 {id:'c_amar',cat:'cap',n:'AMARELO',p:300,c:[245,200,20]},
 {id:'c_azul',cat:'cap',n:'AZUL',p:300,c:[40,110,220]},
 {id:'c_verde',cat:'cap',n:'VERDE',p:300,c:[30,160,70]},
 {id:'c_preto',cat:'cap',n:'PRETO',p:500,c:[60,60,70],lib:'t024'},
 {id:'c_ouro',cat:'cap',n:'OURO',lend:'t078',c:[230,180,40]},
 {id:'c_prata',cat:'cap',n:'PRATA',lend:'t015',c:[190,196,206]},
 {id:'s_preta',cat:'sap',n:'PRETA',p:300,c:[60,60,70]},
 {id:'s_verm',cat:'sap',n:'VERMELHA',p:300,c:[220,40,40]},
 {id:'s_neon',cat:'sap',n:'NEON',p:600,c:[120,255,40],lib:'t043'},
 {id:'s_ouro',cat:'sap',n:'OURO',lend:'t086',c:[230,180,40]},
 {id:'s_prata',cat:'sap',n:'PRATA',lend:'t064',c:[190,196,206]},
 {id:'r_40',cat:'rodas',n:'PERFIL 40',p:3000,roda:'p40'},
 {id:'r_60',cat:'rodas',n:'PERFIL 60',p:6000,roda:'p60',lib:'t019'},
 {id:'r_disco',cat:'rodas',n:'DISCO + PERFIL 60',p:10000,roda:'disco',lib:'t090'},
 {id:'a_amar',cat:'aro',n:'AMARELO',p:400,cor:'#ffd200'},
 {id:'a_verm',cat:'aro',n:'VERMELHO',p:400,cor:'#e8402a',lib:'t055'},
 {id:'a_ciano',cat:'aro',n:'CIANO',p:400,cor:'#27d3f0'},
 {id:'a_branco',cat:'aro',n:'BRANCO',p:400,cor:'#f2f2f2'},
 {id:'a_ouro',cat:'aro',n:'OURO',lend:'t096',cor:'#e6b428'},
 {id:'a_prata',cat:'aro',n:'PRATA',lend:'t093',cor:'#c8ccd4'},
 {id:'a_rosa',cat:'aro',n:'ROSA',lend:'t052',cor:'#f05aa0'}];
const GAR_ID={};for(const i of GAR)GAR_ID[i.id]=i;
// títulos das conquistas lendárias (a peça exclusiva vem junto)
const GAR_TIT={t011:'Volta ao Mundo',t015:'Morador da Rodovia',t040:'Rei da Montanha',t052:'Oportunista',t064:'Na Raça',
 t078:'Imbatível',t086:'Casca-Grossa',t093:'Contrarrelogista',t096:'Magnata do Pedal',t100:'Ciclista Completo'};
for(const c of CONQ)if(GAR_TIT[c.id])c.titulo=GAR_TIT[c.id];
const garNum=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const garConq=id=>CONQ.find(c=>c.id===id);
function garConqTxt(id){const L=GAR.filter(i=>i.lib===id),E=GAR.filter(i=>i.lend===id),cn=i=>`${GAR_CAT.find(g=>g.k===i.cat).n.toLowerCase()} ${i.n.toLowerCase()}`;
 if(E.length)return `exclusivo: ${E.map(cn).join(', ')}`;if(L.length)return `libera na garagem: ${L.map(cn).join(', ')}`;return ''}
function garDados(){if(!CS.gar||!CS.gar.uso)CS.gar={tem:{},uso:{}};CS.gar.tem=CS.gar.tem||{};return CS.gar}
const garTem=i=>!i||(i.lend?!!(CS.conq&&CS.conq[i.lend]):!!garDados().tem[i.id]);
const garLiberado=i=>!i.lib||!!(CS.conq&&CS.conq[i.lib]);
// peças em uso (só as que você tem) → kit das máscaras + rodas
// prova: id de uma peça que entra mesmo sem ser sua (só o desenho do provador)
function garKit(uso,prova){uso=uso||garDados().uso;const q=k=>{const i=GAR_ID[uso[k]];return i&&(garTem(i)||i.id===prova)?i:null};
 const u=q('uni'),b=q('quadro'),h=q('cap'),w=q('sap'),r=q('rodas'),a=q('aro'),kit={};
 if(u){kit.p=u.c;kit.s=u.s}if(b)kit.b=b.c;if(h)kit.h=h.c;if(w)kit.w=w.c;
 const roda=r?{t:r.roda,aro:a?a.cor:null}:null;if(!Object.keys(kit).length&&!roda)return null;
 return{kit:Object.keys(kit).length?kit:null,roda,sig:[u,b,h,w,r,r&&a].map(i=>i?i.id:'-').join(',')}}
// ---------- montar o quadro do sprite ----------
function garRodas(g,id,st,R0){const R=RODAS[id]&&RODAS[id][st];if(!R)return;
 [[R[0],R0.t==='disco'?'disco':R0.t],[R[1],R0.t==='disco'?'p60':R0.t]].forEach(([[cx,cy,r],t])=>{g.save();
  if(t==='disco'){g.beginPath();g.arc(cx,cy,r*.86,0,Math.PI*2);const gr=g.createLinearGradient(cx-r,cy-r,cx+r,cy+r);gr.addColorStop(0,'#3a3a44');gr.addColorStop(.5,'#1a1a20');gr.addColorStop(1,'#2c2c34');g.fillStyle=gr;g.fill();
   g.lineWidth=r*.05;g.strokeStyle=R0.aro||'#555';g.beginPath();g.arc(cx,cy,r*.6,0,Math.PI*2);g.stroke();g.beginPath();g.arc(cx,cy,r*.1,0,Math.PI*2);g.fillStyle='#888';g.fill()}
  else{const ri=t==='p40'?.74:.62,m=(.86+ri)/2*r;g.beginPath();g.arc(cx,cy,r*.86,0,Math.PI*2);g.arc(cx,cy,r*ri,0,Math.PI*2,true);g.fillStyle='#1c1c22';g.fill('evenodd');
   if(R0.aro){g.lineWidth=r*(t==='p40'?.05:.07);g.strokeStyle=R0.aro;g.beginPath();g.arc(cx,cy,m,-.6,.9);g.stroke();g.beginPath();g.arc(cx,cy,m,2.5,4);g.stroke()}}
  g.restore()})}
// só o pé de FORA (o mais claro) da máscara w: o de dentro, sombreado, fica atrás do aro
function garPeFora(q,f,st,fi,fw,fh){const mk=IMG['m_'+f+st+'_w'],M=document.createElement('canvas');M.width=fw;M.height=fh;if(!mk||!mk.width)return M;
 const sx=(fi%5)*fw,sy=Math.floor(fi/5)*fh,kk=IMG['p_'+f+st].width/mk.width,m=M.getContext('2d');m.drawImage(mk,sx/kk,sy/kk,fw/kk,fh/kk,0,0,fw,fh);
 const md=m.getImageData(0,0,fw,fh),a=md.data,qd=q.getContext('2d').getImageData(0,0,fw,fh).data,lab=new Int32Array(fw*fh),comps=[];
 for(let i=0;i<fw*fh;i++){if(a[i*4+3]<100||lab[i])continue;const id=comps.length+1,pilha=[i];lab[i]=id;let n=0,s=0;
  while(pilha.length){const p=pilha.pop();n++;const j=p*4;s+=(.3*qd[j]+.59*qd[j+1]+.11*qd[j+2])/255;const x=p%fw,y=(p/fw)|0;
   if(x>0&&!lab[p-1]&&a[(p-1)*4+3]>=100){lab[p-1]=id;pilha.push(p-1)}if(x<fw-1&&!lab[p+1]&&a[(p+1)*4+3]>=100){lab[p+1]=id;pilha.push(p+1)}
   if(y>0&&!lab[p-fw]&&a[(p-fw)*4+3]>=100){lab[p-fw]=id;pilha.push(p-fw)}if(y<fh-1&&!lab[p+fw]&&a[(p+fw)*4+3]>=100){lab[p+fw]=id;pilha.push(p+fw)}}
  comps.push({n,l:s/n})}
 const big=comps.filter(c=>c.n>40),mx=big.length?Math.max(...big.map(c=>c.l)):1;
 for(let i=0;i<fw*fh;i++){const c=lab[i]?comps[lab[i]-1]:null;if(!c||c.n<=40||c.l<mx-.1)a[i*4+3]=0}
 m.putImageData(md,0,0);return M}
// q (sprite já pintado) → nova imagem com a roda desenhada e o quadro + pé de fora por cima dela.
// Nos modelos azul e vinho a máscara do quadro (b) também pega a roda (aro azul-escuro): ali a faixa do aro sai da máscara,
// senão a roda raiada original voltaria por cima do perfil.
function garComRoda(q,f,st,fi,fw,fh,R0){const id=FID[f],o=document.createElement('canvas');o.width=fw;o.height=fh;const g=o.getContext('2d');g.drawImage(q,0,0);garRodas(g,id,st,R0);
 const L=document.createElement('canvas');L.width=fw;L.height=fh;const l=L.getContext('2d'),mk=IMG['m_'+f+st+'_b'];
 if(mk&&mk.width){const kk=IMG['p_'+f+st].width/mk.width;l.drawImage(mk,(fi%5)*fw/kk,Math.floor(fi/5)*fh/kk,fw/kk,fh/kk,0,0,fw,fh)}
 const R=RODAS[id]&&RODAS[id][st];if(f!=='b'&&R){l.globalCompositeOperation='destination-out';R.forEach(([cx,cy,r],i)=>{const t=R0.t==='disco'?(i?'p60':'disco'):R0.t,ri=t==='disco'?0:t==='p40'?.74:.62;
  l.beginPath();l.arc(cx,cy,r*1.02,0,Math.PI*2);l.arc(cx,cy,Math.max(0,r*ri-2),0,Math.PI*2,true);l.fill('evenodd')});l.globalCompositeOperation='source-over'}
 l.drawImage(garPeFora(q,f,st,fi,fw,fh),0,0);l.globalCompositeOperation='source-in';l.drawImage(q,0,0);g.drawImage(L,0,0);return o}
function garMontar(id,st,fi,G){const f=id[0],[fw,fh]=META.pedal[id][st],[cv]=npcQuadro(f,st,fi,G.kit);
 const q=document.createElement('canvas');q.width=fw;q.height=fh;q.getContext('2d').drawImage(cv,0,0);return G.roda?garComRoda(q,f,st,fi,fw,fh,G.roda):q}
const GAR_CACHE=new Map(),GAR_CACHE_MAX=60;
function garFrame(id,st,fi,G){const ch=id+st+'_'+fi+'|'+G.sig;let c=GAR_CACHE.get(ch);if(c){GAR_CACHE.delete(ch);GAR_CACHE.set(ch,c);return c}
 c=garMontar(id,st,fi,G);GAR_CACHE.set(ch,c);if(GAR_CACHE.size>GAR_CACHE_MAX)GAR_CACHE.delete(GAR_CACHE.keys().next().value);return c}
// desenho.js chama isto para o JOGADOR: null = sprite original (Contrarrelógio, ou nada equipado)
function garQuadro(id,st,fi){if(MODO!=='carreira'||typeof CS==='undefined'||!META.pedal[id])return null;const G=garKit();return G?garFrame(id,st,fi,G):null}
function garAquecer(){if(MODO!=='carreira')return;const G=garKit();if(!G)return;const id=jogadorSkin();if(!META.pedal[id])return;
 for(let st=0;st<4;st++)for(let fi=0;fi<10;fi++)garFrame(id,st,fi,G)}
const _garReset=reset;reset=function(){_garReset();try{garAquecer()}catch(e){}};
// borrão das rodas (sensacao.js) só nas raiadas: em roda de perfil/disco o borrão clareava o aro
if(typeof sensRodas==='function'){const _garSR=sensRodas;sensRodas=function(id,st,ox,oy,k,v){if(v==null&&MODO==='carreira'&&typeof CS!=='undefined'){const G=garKit();if(G&&G.roda)return}return _garSR(id,st,ox,oy,k,v)}}
// ---------- NPCs também usam as rodas da loja (pedido do dono, 16/11) ----------
// Quanto mais forte, mais chance de roda de perfil (FTP ≤ 160 W: 20% · 230 W: ~55% · ≥ 300 W: 85%); disco só nos fortes.
// Sorteio pelo NOME (hash): o mesmo rival tem as mesmas rodas em todas as etapas. Aro colorido = cor do uniforme dele.
// O kit com roda fica numa lista própria (GAR_KX, índice 1000+), fora de KITS (outros módulos sorteiam KITS.length).
const GAR_NPC={pMin:.2,pMax:.85,ftp0:160,ftp1:300,disco:.18,aro:.45};
const GAR_KIX=new Map(),GAR_KX=[],garKitN=k=>k>=1000?GAR_KX[k-1000]:KITS[k];
function garHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967296}
function garNpcRoda(r){const u=garHash(r.nome+'|r'),v=garHash(r.nome+'|t'),w=garHash(r.nome+'|a'),f=clamp((r.ftp-GAR_NPC.ftp0)/(GAR_NPC.ftp1-GAR_NPC.ftp0),0,1);
 if(u>GAR_NPC.pMin+(GAR_NPC.pMax-GAR_NPC.pMin)*f)return null;
 const t=f>.55&&v<GAR_NPC.disco?'disco':v<.35+.4*f?'p60':'p40',K=garKitN(r.k),c=K&&(K.s||K.p);
 return{t,aro:w<GAR_NPC.aro&&c?`rgb(${c})`:null}}
function garKitIdx(k,roda){if(k>=1000)k=GAR_KX[k-1000].base;const ch=k+'|'+roda.t+'|'+roda.aro;let i=GAR_KIX.get(ch);
 if(i==null){GAR_KX.push(Object.assign({},KITS[k]||{},{roda,base:k}));i=999+GAR_KX.length;GAR_KIX.set(ch,i)}return i}
if(typeof ciclNovo==='function'){const _garCN=ciclNovo;ciclNovo=function(o){const r=_garCN(o);try{const R=garNpcRoda(r);if(R)r.k=garKitIdx(r.k,R)}catch(e){}return r}}
// quadro do NPC com roda: mesma montagem do jogador (roda por cima, quadro + pé de fora por cima da roda)
const _garNQ=npcQuadro;npcQuadro=function(f,st,fi,kit){const out=_garNQ(f,st,fi,kit);if(!kit||!kit.roda)return out;
 const[cv,fw,fh]=out,q=document.createElement('canvas');q.width=fw;q.height=fh;q.getContext('2d').drawImage(cv,0,0);return[garComRoda(q,f,st,fi,fw,fh,kit.roda),fw,fh]};
// sem borrão de raio nas rodas de perfil dos NPCs (o desenho do NPC chama npcQuadroC e logo depois sensRodas)
// kits com roda (k ≥ 1000): mesma regra de cache do npcQuadroC (npc.js), com o kit vindo de GAR_KX
let GAR_NPC_ULT=null;const _garNQC=npcQuadroC;npcQuadroC=function(f,st,fi,k){GAR_NPC_ULT=garKitN(k);if(k<1000||!GAR_NPC_ULT)return _garNQC(f,st,fi,k<1000?k:0);
 const ch=f+st+'_'+fi+'_'+k;let c=npcCache.get(ch);if(c){npcCache.delete(ch);npcCache.set(ch,c);return c}
 const[cv,fw,fh]=npcQuadro(f,st,fi,GAR_NPC_ULT),o=document.createElement('canvas');o.width=Math.round(fw*.72);o.height=Math.round(fh*.72);o.getContext('2d').drawImage(cv,0,0,o.width,o.height);
 c=[o,fw,fh];npcCache.set(ch,c);if(npcCache.size>NPC_CACHE)npcCache.delete(npcCache.keys().next().value);return c};
if(typeof sensRodas==='function'){const _garSR2=sensRodas;sensRodas=function(id,st,ox,oy,k,v){if(v!=null&&GAR_NPC_ULT&&GAR_NPC_ULT.roda)return;return _garSR2(id,st,ox,oy,k,v)}}
// ---------- abas da LOJA ----------
function lojaAbas(i){[['ITENS',()=>{state='loja'}],['GARAGEM',()=>{state='garagem'}]].forEach(([t,a],j)=>{const w=300,h=76,x=W/2-w-8+j*(w+16),y=26,on=i===j,hv=!on&&hit({x,y,w,h},mx,my);
 if(!on)btns.push({x,y,w,h,act:a});ctx.save();if(hv)hoverZoom(x,y,w,h,1.04);rr(x,y,w,h,h/2);ctx.fillStyle=on?MN.ama:MN.bg;ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=on?MN.esc:MN.borda;ctx.stroke();
 ctx.font=FT(900,40);ctx.fillStyle=on?MN.esc:'#fff';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(t,x+w/2,y+h/2+15);ctx.restore()})}
// ---------- tela GARAGEM ----------
let GAR_TAB='uni',GAR_SEL={};   // categoria aberta · item escolhido (provador) em cada categoria ('' = padrão)
const garSel=k=>GAR_SEL[k]!=null?GAR_SEL[k]:(garDados().uso[k]||'');
function garIcone(k,it,cx,cy,r){ctx.save();ctx.lineJoin='round';const col=c=>`rgb(${c})`;
 if(k==='uni'){const c=it?it.c:[242,242,242],s=it?it.s:[200,206,214];ctx.beginPath();ctx.moveTo(cx-r*.55,cy-r*.75);ctx.lineTo(cx-r,cy-r*.35);ctx.lineTo(cx-r*.75,cy);ctx.lineTo(cx-r*.5,cy-r*.15);ctx.lineTo(cx-r*.5,cy+r*.8);ctx.lineTo(cx+r*.5,cy+r*.8);ctx.lineTo(cx+r*.5,cy-r*.15);ctx.lineTo(cx+r*.75,cy);ctx.lineTo(cx+r,cy-r*.35);ctx.lineTo(cx+r*.55,cy-r*.75);ctx.lineTo(cx+r*.2,cy-r*.75);ctx.lineTo(cx,cy-r*.55);ctx.lineTo(cx-r*.2,cy-r*.75);ctx.closePath();
  ctx.fillStyle=col(c);ctx.fill();ctx.save();ctx.clip();ctx.fillStyle=col(s);ctx.fillRect(cx-r,cy+r*.15,2*r,r*.2);ctx.restore();ctx.lineWidth=4;ctx.strokeStyle=MN.esc;ctx.stroke()}
 else if(k==='quadro'){const c=it?it.c:[24,52,96];ctx.lineCap='round';ctx.lineWidth=r*.2;ctx.strokeStyle=MN.esc;const P=()=>{ctx.beginPath();ctx.moveTo(cx-r*.85,cy+r*.45);ctx.lineTo(cx-r*.2,cy-r*.5);ctx.lineTo(cx+r*.6,cy-r*.5);ctx.lineTo(cx+r*.1,cy+r*.45);ctx.closePath();ctx.moveTo(cx+r*.6,cy-r*.5);ctx.lineTo(cx+r*.9,cy+r*.45);ctx.moveTo(cx-r*.2,cy-r*.5);ctx.lineTo(cx-r*.3,cy-r*.75);ctx.stroke()};
  P();ctx.lineWidth=r*.12;ctx.strokeStyle=col(c);P()}
 else if(k==='cap'){const c=it?it.c:[242,242,242];ctx.beginPath();ctx.moveTo(cx-r*.95,cy+r*.3);ctx.bezierCurveTo(cx-r*.9,cy-r*.8,cx+r*.7,cy-r*.9,cx+r*.95,cy+r*.1);ctx.lineTo(cx+r*.95,cy+r*.3);ctx.closePath();ctx.fillStyle=col(c);ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=MN.esc;ctx.stroke();
  ctx.lineWidth=3;for(const d of[-.4,0,.4]){ctx.beginPath();ctx.moveTo(cx+d*r,cy-r*.45);ctx.lineTo(cx+d*r*1.3,cy+r*.1);ctx.stroke()}}
 else if(k==='sap'){const c=it?it.c:[242,242,242];ctx.beginPath();ctx.moveTo(cx-r*.9,cy+r*.35);ctx.lineTo(cx-r*.8,cy-r*.3);ctx.lineTo(cx-r*.2,cy-r*.35);ctx.quadraticCurveTo(cx+r*.9,cy-r*.1,cx+r*.95,cy+r*.35);ctx.closePath();ctx.fillStyle=col(c);ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=MN.esc;ctx.stroke();
  ctx.fillStyle=MN.esc;ctx.fillRect(cx-r*.95,cy+r*.35,r*1.95,r*.14)}
 else{const t=k==='rodas'?(it?it.roda:'raiada'):'p40',aro=k==='aro'?(it?it.cor:null):null;
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.lineWidth=r*.12;ctx.strokeStyle='#7a4a24';ctx.stroke();
  if(t==='raiada'){ctx.lineWidth=2;ctx.strokeStyle='#cfd8e1';for(let a=0;a<12;a++){ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a*Math.PI/6)*r*.88,cy+Math.sin(a*Math.PI/6)*r*.88);ctx.stroke()}ctx.beginPath();ctx.arc(cx,cy,r*.88,0,Math.PI*2);ctx.lineWidth=4;ctx.stroke()}
  else if(t==='disco'){ctx.beginPath();ctx.arc(cx,cy,r*.9,0,Math.PI*2);ctx.fillStyle='#22222a';ctx.fill()}
  else{const ri=t==='p40'?.74:.62;ctx.lineWidth=2;ctx.strokeStyle='#cfd8e1';for(let a=0;a<12;a++){ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a*Math.PI/6)*r*ri,cy+Math.sin(a*Math.PI/6)*r*ri);ctx.stroke()}
   ctx.beginPath();ctx.arc(cx,cy,r*.9,0,Math.PI*2);ctx.arc(cx,cy,r*ri,0,Math.PI*2,true);ctx.fillStyle='#1c1c22';ctx.fill('evenodd');
   if(aro){ctx.lineWidth=r*.08;ctx.strokeStyle=aro;ctx.beginPath();ctx.arc(cx,cy,r*(.9+ri)/2,-.7,1);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,r*(.9+ri)/2,2.4,4.1);ctx.stroke()}}
  ctx.beginPath();ctx.arc(cx,cy,r*.1,0,Math.PI*2);ctx.fillStyle='#9aa8b8';ctx.fill()}
 ctx.restore()}
function garComprar(it){if(!it||it.lend||!garLiberado(it)||garTem(it)||CS.moedas<it.p)return;CS.moedas-=it.p;const D=garDados();D.tem[it.id]=true;D.uso[it.cat]=it.id;carSalvar();if(typeof tocar==='function')tocar('moeda',1)}
function garUsar(k,id){const D=garDados();if(id){const it=GAR_ID[id];if(!garTem(it))return}D.uso[k]=id||null;carSalvar()}
function drawGaragem(){fundo();lojaAbas(1);btnVoltar('VOLTAR',toHub);moedasChip();const D=garDados(),k=GAR_TAB,L=[null,...GAR.filter(i=>i.cat===k)],selId=garSel(k),sel=selId?GAR_ID[selId]:null;
 // ---- provador ----
 const px=28,py=126,pw=600,ph=712;cardMenu(px,py,pw,ph,MN.borda,6,30);
 // o provador mostra a peça escolhida mesmo antes de comprar
 const id=SKINS.includes(CS.skin)?CS.skin:'branco',prev=Object.assign({},D.uso,{[k]:selId||null}),Gp=garKit(prev,selId);
 const cx=px+pw/2,pe=py+470;ctx.beginPath();ctx.ellipse(cx,pe+4,220,34,0,0,Math.PI*2);ctx.fillStyle='#02234d';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=MN.borda;ctx.stroke();
 const fi=Math.floor(T*12)%10,[fw,fh]=META.pedal[id][0],s=1.32,img=Gp?garFrame(id,0,fi,Gp):null;
 if(img)ctx.drawImage(img,0,0,fw,fh,cx-fw*s/2,pe-fh*s+8,fw*s,fh*s);else ctx.drawImage(IMG['p_'+id[0]+'0'],(fi%5)*fw,Math.floor(fi/5)*fh,fw,fh,cx-fw*s/2,pe-fh*s+8,fw*s,fh*s);
 tx('PROVADOR',px+28,py+52,30,'left',MN.tit);
 const cat=GAR_CAT.find(g=>g.k===k);txFit(`${cat.n} ${sel?sel.n:'PADRÃO'}`,cx,pe+76,40,pw-40,'center','#fff');
 // situação + botão
 const bx=px+60,by=pe+140,bw=pw-120,bh=76;let lab='',ok=false,act=null,sub='',cor=MN.ama;
 const emUso=(D.uso[k]||'')===(sel?sel.id:'')&&(!sel||garTem(sel));
 if(emUso){lab='EM USO';cor=MN.verde}
 else if(!sel){lab='USAR PADRÃO';ok=true;act=()=>garUsar(k,null)}
 else if(garTem(sel)){lab='USAR';ok=true;act=()=>garUsar(k,sel.id)}
 else if(sel.lend){lab='EXCLUSIVO';cor='#c07cff';const c=garConq(sel.lend);sub=`Conquista lendária: ${c?c.n:sel.lend}`}
 else if(!garLiberado(sel)){lab='BLOQUEADO';cor='#9aa8b8';const c=garConq(sel.lib);sub=`Libera com a conquista ${c?c.n:sel.lib}${c?` (${c.d})`:''}`}
 else{lab=`COMPRAR  ${garNum(sel.p)}`;ok=CS.moedas>=sel.p;act=()=>garComprar(sel);if(!ok){cor='#c9d1da';sub=`Faltam ${garNum(sel.p-CS.moedas)} moedas`}}
 if(k==='aro'&&!garTem(GAR_ID[D.uso.rodas]))sub=sub||'A cor do aro aparece com rodas de perfil ou disco.';
 const hv=ok&&hit({x:bx,y:by,w:bw,h:bh},mx,my);if(ok&&act)btns.push({x:bx,y:by,w:bw,h:bh,act});
 ctx.save();if(hv)hoverZoom(bx,by,bw,bh,1.04);rr(bx,by+7,bw,bh,bh/2);ctx.fillStyle='#0a1426';ctx.fill();rr(bx,by,bw,bh,bh/2);ctx.fillStyle=hv?'#ffe45c':cor;ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=MN.esc;ctx.stroke();
 if(lab.startsWith('COMPRAR'))moedaIc(bx+28,by+12,52);ctx.font=FT(900,40);ctx.fillStyle=MN.esc;ctx.textAlign='center';ctx.fillText(lab,bx+bw/2+(lab.startsWith('COMPRAR')?22:0),by+bh/2+14);ctx.restore();
 if(sub)txFit(sub,cx,pe+112,20,pw-50,'center','#cfe3f1');
 // ---- categorias ----
 const gx=650,gw=W-28-gx,tw=(gw-5*10)/6;GAR_CAT.forEach((g,i)=>{const x=gx+i*(tw+10),y=126,h=58,on=g.k===k,hv=!on&&hit({x,y,w:tw,h},mx,my);if(!on)btns.push({x,y,w:tw,h,act:()=>{GAR_TAB=g.k}});
  rr(x,y,tw,h,h/2);ctx.fillStyle=on?MN.ama:hv?'#06305e':MN.bg;ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=on?MN.esc:MN.borda;ctx.stroke();
  if(on){ctx.font=FT(900,22);ctx.fillStyle=MN.esc;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(g.n,x+tw/2,y+38)}else txFit(g.n,x+tw/2,y+39,22,tw-16,'center','#fff')});
 // ---- grade de peças ----
 const cols=4,cw=(gw-3*12)/cols,ch=196;L.forEach((it,i)=>{const x=gx+(i%cols)*(cw+12),y=200+Math.floor(i/cols)*(ch+12),idI=it?it.id:'',on=idI===selId,uso=(D.uso[k]||'')===idI&&(!it||garTem(it)),hv=hit({x,y,w:cw,h:ch},mx,my);
  btns.push({x,y,w:cw,h:ch,act:()=>{GAR_SEL[k]=idI}});
  cardMenu(x,y,cw,ch,on?MN.ama:it&&it.lend?'#c07cff':MN.borda,on||hv?7:4,22);
  const trav=it&&!garTem(it)&&(it.lend||!garLiberado(it));ctx.save();if(trav)ctx.globalAlpha=.55;garIcone(k,it,x+cw/2,y+70,46);ctx.restore();
  txFit(it?it.n:'PADRÃO',x+cw/2,y+142,24,cw-20,'center',it&&it.lend?'#e0b8ff':'#fff');
  let st,sc;if(uso){st='EM USO';sc=MN.verde}else if(!it||garTem(it)){st=!it?'GRÁTIS':it.lend?'CONQUISTADO':'COMPRADO';sc=it&&it.lend?'#e0b8ff':MN.borda}else if(it.lend){st='LENDÁRIO';sc='#c07cff'}else if(!garLiberado(it)){st='CONQUISTA';sc='#9aa8b8'}else{st=garNum(it.p);sc=CS.moedas>=it.p?MN.ama:'#9aa8b8'}
  if(!it||garTem(it)||it.lend||!garLiberado(it)){if(trav){ctx.save();ctx.translate(x+cw-30,y+30);ctx.scale(.55,.55);cadeado(0,0);ctx.restore()}tx(st,x+cw/2,y+178,20,'center',sc)}
  else{moedaIc(x+cw/2-56,y+156,30);tx(st,x+cw/2+14,y+180,24,'center',sc)}});
 txFit('Só visual, vale na Carreira (o Contrarrelógio usa o ciclista original) · modelo branco/azul/vinho: setas da CARREIRA',gx+gw/2,836,18,gw,'center','#9fb0c0')}
const _garDraw=draw;draw=function(){if(state==='garagem'){CLARO=false;btns=[];drawGaragem();if(pnl)drawPanel();return}_garDraw()};
addEventListener('keydown',e=>{if(state!=='garagem'||pnl||e.defaultPrevented)return;if(e.code==='Escape')toHub();
 else if(e.code==='ArrowRight'||e.code==='ArrowLeft'){const i=GAR_CAT.findIndex(g=>g.k===GAR_TAB);GAR_TAB=GAR_CAT[(i+(e.code==='ArrowRight'?1:GAR_CAT.length-1))%GAR_CAT.length].k}});
// ---------- TÍTULO: toque no título do hub para trocar entre os que você já ganhou ----------
function garTitulos(){CS.conq=CS.conq||{};return CONQ.filter(c=>c.titulo&&CS.conq[c.id]).map(c=>c.titulo)}
const _garHub=drawHub;drawHub=function(){_garHub();const L=garTitulos();if(!L.length)return;const cx=404;
 if(!CS.titulo){tx('« escolha um título »',cx,256,22,'center','#9fb0c0')}
 ctx.font=FT(800,26);const w=Math.max(260,ctx.measureText(`« ${CS.titulo||''} »`).width+60);btns.push({x:cx-w/2,y:228,w,h:40,act:()=>{const i=L.indexOf(CS.titulo);CS.titulo=L[(i+1)%L.length];carSalvar()}});
 if(L.length>1&&hit({x:cx-w/2,y:228,w,h:40},mx,my))tx(`toque para trocar (${L.length} títulos)`,cx,284,17,'center','#cfe3f1')};
