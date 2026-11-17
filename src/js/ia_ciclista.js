/* ===== TESTE: ciclista gerado no AutoSprite (17/11) — só no Contrarrelógio; tecla N alterna; IA.on=false desliga =====
   Folhas feitas por tools/sprite_ia/montar_folha.py a partir dos VÍDEOS (recorte próprio do fundo cinza: a remoção de
   fundo do site deixava partes da camisa transparentes). Cada folha = 1 volta do pedal, 5 colunas.
   Poses (pelo spriteSt do jogo): 0 normal → `ia_normal` (rosto tranquilo) · 1 forçando e 2 subida forte → `ia_bravo`
   (rosto bravo, ainda sentado: não há arte em pé) · 3 sprint → `ia_bravo` + efeito: inclina para a frente e deixa rastro.
   Troca de pose com fusão de 0,15 s. Mesmo tamanho de roda do sprite atual; roda de trás no mesmo lugar, pneu no chão. */
const IA={on:true,
 P:{normal:{img:'ia_normal',fw:365,fh:367,n:25,cols:5,roda:[77.2,286.4,66.5]},
    bravo:{img:'ia_bravo',fw:363,fh:363,n:20,cols:5,roda:[75.9,287.9,66.3]}},
 funde:.15,                         // s para trocar de pose
 sprint:{inclina:.13,rastro:[[-26,.32],[-52,.16]]}};   // inclinação para a frente (cisalhamento: rodas ficam no chão) · cópias atrás [px, opacidade]
let IA_atual='normal',IA_ant=null,IA_t=1,IA_spr=0,IA_T=-1;
function iaPose(st){return st===0?'normal':'bravo'}
function iaFolha(k,pdx,a,dx){const P=IA.P[k],im=IMG[P.img];if(!im||!im.width||a<=0)return;
 const R0=RODAS.branco[0][0],s=R0[2]*KS/P.roda[2],fi=Math.floor(pedal*P.n/10)%P.n,[rx,ry]=P.roda;
 const xT=-150-pdx*KS+R0[0]*KS+(dx||0),yC=-(R0[2]*KS)-2*KS;   // centro da roda de trás (sistema do ciclista)
 ctx.globalAlpha=a;ctx.drawImage(im,(fi%P.cols)*P.fw,Math.floor(fi/P.cols)*P.fh,P.fw,P.fh,xT-rx*s,yC-ry*s,P.fw*s,P.fh*s)}
function iaDesenha(id,st,pdx){if(!IA.on||MODO!=='crono')return false;if(!IMG.ia_normal||!IMG.ia_normal.width)return false;
 const dt=IA_T<0?0:clamp(T-IA_T,0,.1);IA_T=T;
 const k=iaPose(st);if(k!==IA_atual){IA_ant=IA_atual;IA_atual=k;IA_t=0}IA_t=Math.min(1,IA_t+dt/IA.funde);
 IA_spr+=((st===3?1:0)-IA_spr)*Math.min(1,dt*6);   // efeito de sprint entra e sai suave
 ctx.save();
 if(IA_spr>.01){const S=IA.sprint;ctx.transform(1,0,-S.inclina*IA_spr,1,0,0);   // o topo vai para a frente, o chão (y=0) fica
  for(const[dx,a]of S.rastro)iaFolha(IA_atual,pdx,a*IA_spr,dx)}
 if(IA_ant&&IA_t<1)iaFolha(IA_ant,pdx,1-IA_t);
 iaFolha(IA_atual,pdx,IA_ant&&IA_t<1?IA_t:1);
 ctx.restore();ctx.globalAlpha=1;return true}
addEventListener('keydown',e=>{if(e.code==='KeyN'&&e.target!==nickEl&&MODO==='crono')IA.on=!IA.on});
