/* ===== PEDALADA VISÍVEL — todos os modos =====
   17/11 (pedido do dono, "a pedalada tem que ser arcade"): a perna NÃO segue mais o dedo (antes cada aperto = meia volta
   seca, e girava rápido demais). Agora tem cadência própria pela força: 60 rpm com pouca força → 110 rpm no sprint,
   mudando suave; sem força (watts quase zero) desacelera até parar, como na roda livre.
   Só visual: não mexe em potência, stamina, fadiga nem ranking. A folha tem 10 quadros por volta (variável global `pedal`).
*/
const PEDK={rpmMin:60,rpmMax:110,livre:15,suave:2.5,quadros:10};
let pdRpm=0;
function pedalCrono(){return state==='run'}   // principal.js: durante a prova o giro é daqui (a cadência), não o antigo pela velocidade
const _pdUpdate=update;
update=function(dt){_pdUpdate(dt);if(state!=='run')return;
 if(typeof friOn==='function'&&friOn()){pedal+=friRpm/60*PEDK.quadros*dt;return}   // teste de fricção (desligado)
 const K=PEDK,r=power/FTP,alvo=power<K.livre?0:clamp(K.rpmMin+(K.rpmMax-K.rpmMin)*clamp((r-.4)/1.4,0,1),K.rpmMin,K.rpmMax);
 pdRpm+=(alvo-pdRpm)*Math.min(1,dt*K.suave);pedal+=pdRpm/60*K.quadros*dt};
