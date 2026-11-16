/* ===== Estado de interface =====
   Variáveis de estado da UI (mouse, botões, nick, painel aberto, seleção).
*/
let last=performance.now(),T=0,mx=-1,my=-1,btns=[],pbtns=[],nick='',swT=-9,swDir=1,pnl=null,drag=null;
