/* ===== TESTE: ciclista gerado no AutoSprite (17/11) — só no Contrarrelógio; tecla N alterna; IA.on=false desliga =====
   Folhas feitas por tools/sprite_ia/montar_folha.py a partir dos VÍDEOS (recorte próprio do fundo cinza: a remoção de
   fundo do site deixava partes da camisa transparentes). Cada folha = 1 volta do pedal, 5 colunas.
   17/11 (tarde): personagem refeito pelo dono ("Ciclista sentado HQ") = `ia_normal` em TODAS as poses por enquanto (o bravo
   era do personagem antigo, com outra bike). Efeito de sprint (inclinação + rastro) removido a pedido do dono: fica só o vento.
   Quando vierem bravo/em pé do personagem novo, é só pôr em IA.P e mapear em iaPose().
   Troca de pose com fusão de 0,15 s. Mesmo tamanho de roda do sprite atual; roda de trás no mesmo lugar, pneu no chão. */
const IA={on:true,
 P:{normal:{img:'ia_normal',fw:368,fh:373,n:23,cols:5,roda:[79.5,294.2,66.9]}},
 funde:.15};                        // s para trocar de pose
let IA_atual='normal',IA_ant=null,IA_t=1,IA_T=-1;
function iaPose(st){return 'normal'}
function iaFolha(k,pdx,a,dx){const P=IA.P[k],im=IMG[P.img];if(!im||!im.width||a<=0)return;
 const R0=RODAS.branco[0][0],s=R0[2]*KS/P.roda[2],fi=Math.floor(pedal*P.n/10)%P.n,[rx,ry]=P.roda;
 const xT=-150-pdx*KS+R0[0]*KS+(dx||0),yC=-(R0[2]*KS)-2*KS;   // centro da roda de trás (sistema do ciclista)
 ctx.globalAlpha=a;ctx.drawImage(im,(fi%P.cols)*P.fw,Math.floor(fi/P.cols)*P.fh,P.fw,P.fh,xT-rx*s,yC-ry*s,P.fw*s,P.fh*s)}
function iaDesenha(id,st,pdx){if(!IA.on||MODO!=='crono')return false;if(!IMG.ia_normal||!IMG.ia_normal.width)return false;
 const dt=IA_T<0?0:clamp(T-IA_T,0,.1);IA_T=T;
 const k=iaPose(st);if(k!==IA_atual){IA_ant=IA_atual;IA_atual=k;IA_t=0}IA_t=Math.min(1,IA_t+dt/IA.funde);
 ctx.save();
 if(IA_ant&&IA_t<1)iaFolha(IA_ant,pdx,1-IA_t);
 iaFolha(IA_atual,pdx,IA_ant&&IA_t<1?IA_t:1);
 ctx.restore();ctx.globalAlpha=1;return true}
addEventListener('keydown',e=>{if(e.code==='KeyN'&&e.target!==nickEl&&MODO==='crono')IA.on=!IA.on});
