/* ===== TESTE: ciclista gerado no AutoSprite (17/11) — só no Contrarrelógio; tecla N alterna; IA.on=false desliga =====
   Folha `ia_sent` (5 colunas, 20 quadros = 1 volta do pedal, 363 px) feita por tools/sprite_ia/montar_folha.py a partir do
   VÍDEO (recorte próprio do fundo cinza: a remoção de fundo do site deixava partes da camisa transparentes).
   Mesmo tamanho de roda do sprite atual; a roda de trás fica no mesmo lugar e o pneu encosta no chão. */
const IA={on:true,img:'ia_sent',fw:363,fh:363,n:20,cols:5,rodas:[[75.9,287.9,66.3],[287.7,287.2,65.7]]};
function iaDesenha(id,st,pdx){if(!IA.on||MODO!=='crono')return false;const im=IMG[IA.img];if(!im||!im.width)return false;
 const R0=RODAS.branco[0][0],s=R0[2]*KS/IA.rodas[0][2],fi=Math.floor(pedal*IA.n/10)%IA.n,[rx,ry,rr]=IA.rodas[0];
 const xT=-150-pdx*KS+R0[0]*KS,yC=-(R0[2]*KS)-2*KS;   // centro da roda de trás na tela (sistema do ciclista)
 ctx.drawImage(im,(fi%IA.cols)*IA.fw,Math.floor(fi/IA.cols)*IA.fh,IA.fw,IA.fh,xT-rx*s,yC-ry*s,IA.fw*s,IA.fh*s);return true}
addEventListener('keydown',e=>{if(e.code==='KeyN'&&e.target!==nickEl&&MODO==='crono')IA.on=!IA.on});
