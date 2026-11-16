/* ===== Compartilhar o resultado =====
   Botão COMPARTILHAR na tela final (vitória ou quebra): mensagem automática + card 1080×1920 (formato stories)
   com a ilustração do ciclista (vencedor ou quebrado).
   Celular: abre a tela de compartilhamento do aparelho (imagem + mensagem).
   Sem compartilhamento nativo: painel com prévia do card, BAIXAR IMAGEM, COPIAR MENSAGEM e WHATSAPP.
*/
const SHARE_URL='agenciacastelo.com.br/timetrial/';     // link que vai na mensagem e no card
const SHR={key:'',cv:null,url:'',file:null,msg:'',aviso:'',avisoT:-9};

function shareRank(){const R=RK.res;return RANK_API&&won&&R&&R.s==='ok'?R:null}
function shareMsg(){
 if(won){const R=shareRank();
  return `🚴 Completei os 50 km do Time Trial em ${hms(elapsed*SCALE)} (média de ${f1(dist*3600/(elapsed*SCALE))} km/h)!`+
   (R?`\n🏆 ${R.imp?'Fiquei':'Estou'} em ${R.pos}º lugar no ranking!`:'')+
   `\nConsegue bater meu tempo? 👉 ${SHARE_URL}`}
 return `😵 Quebrei no km ${f1(dist)} do Time Trial… Duvido você chegar aos 50 km! 👉 ${SHARE_URL}`}

// texto com contorno, no mesmo estilo do jogo, num contexto qualquer
function ctx2Tx(g,s,x,y,size,al='center',col='#fff'){g.font=`italic 800 ${size}px Exo2,system-ui,sans-serif`;g.textAlign=al;g.textBaseline='alphabetic';
 g.lineJoin='round';g.lineWidth=size*.2;g.strokeStyle='#06121e';g.strokeText(s,x,y);g.fillStyle=col;g.fillText(s,x,y)}
function ctx2Fit(g,s,maxW,size){g.font=`italic 800 ${size}px Exo2,system-ui,sans-serif`;const w=g.measureText(s).width;return w>maxW?Math.floor(size*maxW/w):size}

// logo "TIME TRIAL" sem o botão START (que vem na mesma imagem da tela de título)
let SHR_LOGO=null;
function shareLogo(){if(SHR_LOGO)return SHR_LOGO;const lg=IMG.logo,k=lg.width/1100,c=document.createElement('canvas');c.width=lg.width;c.height=Math.round(380*k);
 const g=c.getContext('2d');g.drawImage(lg,0,0);g.clearRect(330*k,306*k,440*k,c.height);return SHR_LOGO=c}
// gera (ou reaproveita) o card do resultado atual
function shareCard(){
 const R=shareRank(),key=[won,f1(dist),Math.floor(elapsed*SCALE),nick,R&&R.pos].join('|');
 if(SHR.key===key&&SHR.cv)return SHR.cv;
 const CW=1080,CH=1920,cv=document.createElement('canvas');cv.width=CW;cv.height=CH;const g=cv.getContext('2d');
 // cenário do jogo: céu, montanhas, grama, guard-rail e asfalto
 const sky=IMG.sky,sh=1300,sw=sh*sky.width/sky.height;g.fillStyle='#8fe3ff';g.fillRect(0,0,CW,CH);g.drawImage(sky,(CW-sw)/2,0,sw,sh);
 const hh=420,hw=hh*IMG.hills.width/IMG.hills.height;for(let x=-hw*.3;x<CW;x+=hw)g.drawImage(IMG.hills,x,1180-hh,hw+1,hh);
 g.fillStyle='#6aa52b';g.fillRect(0,1179,CW,CH);
 const bt=IMG.bigtree,th=520;g.drawImage(bt,-120,1230-th,th*bt.width/bt.height,th);g.drawImage(bt,CW-300,1210-th*.8,th*.8*bt.width/bt.height,th*.8);
 const rh=150,rw=rh*IMG.rail.width/IMG.rail.height;for(let x=0;x<CW;x+=rw)g.drawImage(IMG.rail,x,1330,rw+1,rh);
 const ah=420,aw=ah*IMG.asph.width/IMG.asph.height;for(let x=0;x<CW;x+=aw)g.drawImage(IMG.asph,x,1460,aw+1,ah);g.fillStyle='#4a4a55';g.fillRect(0,1460+ah-2,CW,CH);
 // painel do resultado
 const lg=shareLogo(),lw=760,lh=lw*lg.height/lg.width;g.drawImage(lg,(CW-lw)/2,40,lw,lh);
 const px=70,py=60+lh,pw=CW-140,ph=R?560:500;g.beginPath();g.roundRect(px,py,pw,ph,40);g.fillStyle='#0a1a2ce6';g.fill();g.lineWidth=6;g.strokeStyle='#cfd8e1';g.stroke();
 let y=py+90;
 if(nick){ctx2Tx(g,nick.toUpperCase(),CW/2,y,ctx2Fit(g,nick.toUpperCase(),pw-80,64),'center','#d4e9f5');y+=95}else y+=20;
 if(won){
  ctx2Tx(g,'50 KM CONCLUÍDOS!',CW/2,y,ctx2Fit(g,'50 KM CONCLUÍDOS!',pw-80,76),'center','#a8ffb4');y+=170;
  ctx2Tx(g,hms(elapsed*SCALE),CW/2,y,160,'center','#ffffff');y+=95;
  ctx2Tx(g,`MÉDIA ${f1(dist*3600/(elapsed*SCALE))} KM/H`,CW/2,y,56,'center','#cfe3f1');
  if(R){y+=90;ctx2Tx(g,`${R.pos}º LUGAR NO RANKING`,CW/2,y,60,'center','#ffe27a')}
 }else{
  ctx2Tx(g,'QUEBREI!',CW/2,y,90,'center','#ffad9d');y+=170;
  ctx2Tx(g,`KM ${f1(dist)}`,CW/2,y,160,'center','#ffffff');y+=95;
  ctx2Tx(g,'DUVIDO VOCÊ CHEGAR AOS 50 KM',CW/2,y,ctx2Fit(g,'DUVIDO VOCÊ CHEGAR AOS 50 KM',pw-80,52),'center','#cfe3f1');
 }
 // ilustração do ciclista (vencedor ou quebrado), apoiada no asfalto
 const im=IMG[won?'fim_venceu':'fim_quebrou'];
 if(im&&im.width){const w=won?Math.min(760,780*im.width/im.height):980,h=w*im.height/im.width,base=won?1790:1760;g.drawImage(im,(CW-w)/2,base-h,w,h)}
 // rodapé com o link
 const fy=1800,txt=won?'CONSEGUE BATER?  '+SHARE_URL.toUpperCase():SHARE_URL.toUpperCase();
 g.beginPath();g.roundRect(60,fy,CW-120,92,46);g.fillStyle='#ffd83a';g.fill();g.lineWidth=5;g.strokeStyle='#06121e';g.stroke();
 g.font=`italic 800 ${ctx2Fit(g,txt,CW-200,40)}px Exo2,system-ui,sans-serif`;g.textAlign='center';g.fillStyle='#0f1a3a';g.fillText(txt,CW/2,fy+60);
 SHR.key=key;SHR.cv=cv;SHR.url=cv.toDataURL('image/jpeg',.9);SHR.msg=shareMsg();
 // arquivo pronto antes do clique (o compartilhamento nativo precisa ser chamado direto no toque)
 try{const b=atob(SHR.url.split(',')[1]),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);
  SHR.file=new File([a],`time-trial-${won?hms(elapsed*SCALE).replace(/:/g,'-'):'quebrei-km-'+f1(dist)}.jpg`,{type:'image/jpeg'})}catch(e){SHR.file=null}
 return cv}

function shareAviso(t){SHR.aviso=t;SHR.avisoT=T}
function doShare(){shareCard();const msg=SHR.msg;
 try{if(navigator.share&&SHR.file&&navigator.canShare&&navigator.canShare({files:[SHR.file]})){navigator.share({files:[SHR.file],text:msg}).catch(()=>{});return}}catch(e){}
 openPanel('share')}
function shareCopy(){const msg=SHR.msg;
 const ok=()=>shareAviso('Mensagem copiada!'),fallback=()=>{try{const t=document.createElement('textarea');t.value=msg;t.style.position='fixed';t.style.opacity='0';
  document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();ok()}catch(e){shareAviso('Não foi possível copiar')}};
 try{navigator.clipboard.writeText(msg).then(ok,fallback)}catch(e){fallback()}}
function shareDownload(){try{const a=document.createElement('a');a.href=SHR.url;a.download=SHR.file?SHR.file.name:'time-trial.jpg';document.body.appendChild(a);a.click();a.remove();shareAviso('Imagem baixada!')}catch(e){shareAviso('Não foi possível baixar')}}
function shareWhats(){try{window.open('https://wa.me/?text='+encodeURIComponent(SHR.msg),'_blank')}catch(e){}}

// painel (quando o aparelho não tem compartilhamento nativo)
function drawSharePanel(box,X){const cv=shareCard();
 box(268,60,1000,744);
 tx('COMPARTILHAR',W/2,136,54,'center','#ffe27a');
 const ph=600,pw=ph*cv.width/cv.height,px=330,py=172;
 ctx.drawImage(cv,px,py,pw,ph);ctx.lineWidth=3;ctx.strokeStyle='#cfd8e1';ctx.strokeRect(px,py,pw,ph);
 const bx=px+pw+60,bw=1268-60-bx;
 btn('BAIXAR IMAGEM',bx,200,bw,74,shareDownload,'share',32,pbtns);
 btn('COPIAR MENSAGEM',bx,292,bw,74,shareCopy,false,32,pbtns);
 btn('WHATSAPP',bx,384,bw,74,shareWhats,false,32,pbtns);
 ctx.font='italic 600 22px Exo2,system-ui,sans-serif';ctx.textAlign='left';ctx.fillStyle='#cfe3f1';
 SHR.msg.split('\n').reduce((yy,l)=>{let line='',out=[];for(const w of l.split(' ')){const t=line?line+' '+w:w;if(ctx.measureText(t).width>bw){out.push(line);line=w}else line=t}out.push(line);
  for(const o of out){ctx.fillText(o,bx,yy);yy+=30}return yy+6},500);
 if(T-SHR.avisoT<2.5)tx(SHR.aviso,bx+bw/2,690,30,'center','#a8ffb4');
 btn('VOLTAR',bx,720,bw,64,()=>{pnl=null},true,32,pbtns)}
