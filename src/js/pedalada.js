/* ===== PEDALADA VISÍVEL — todos os modos (até 15/11 era só no Contrarrelógio) =====
   Liga o dedo ao boneco: cada aperto no raio = a perna desce empurrando (meia volta do pé de vela, com "soco" no início).
   Sem apertar, o giro é leve (cruzeiro). Segurando muito (sprint), as pernas giram rápido.
   Só visual: não mexe em potência, stamina, fadiga nem ranking. Nos outros modos a animação continua como antes.
   A folha de sprite tem 10 quadros por volta → meia volta = 5 quadros (variável global `pedal`).
*/
const PEDK={
 meia:5,                // quadros por pedalada (meia volta)
 soco:16,               // rapidez com que a perna completa a pedalada (maior = mais seco); ~0,15 s
 fila:2,                // no máximo 2 pedaladas acumuladas (toques muito rápidos não deixam a perna "atrasada")
 lento:.45,             // giro de cruzeiro sem apertar (× giro antigo, que era pela velocidade)
 sprint:1.3,            // giro no sprint (× giro antigo)
 segura:1.2             // segurando mais que isso = sprint (igual a AJ.empSegura): as pernas giram sem parar
};
let pdAlvo=0,pdAnt=false;
function pedalCrono(){return state==='run'}   // desde 16/11 vale em todos os modos (o acelerador também)
// mesma regra de toque da mecânica (lida ANTES do update, com os mesmos valores)
const _pdUpdate=update;
update=function(dt){
 if(!pedalCrono()){_pdUpdate(dt);pdAnt=boost;pdAlvo=pedal;return}
 // marchas (17/11, Contrarrelógio): a perna gira no RPM de verdade (10 quadros por volta), sem tranco
 if(typeof marOn==='function'&&marOn()){pdAnt=boost;_pdUpdate(dt);if(state==='run')pedal+=marRpm/60*10*dt;pdAlvo=pedal;return}
 const toque=boost&&!pdAnt&&stamina>.5&&!(typeof CONT!=='undefined'&&CONT>0);pdAnt=boost;
 _pdUpdate(dt);if(!pedalCrono())return;
 const g0=speed*dt*.5,sprint=boost&&stamina>.5&&holdT>=PEDK.segura;
 if(sprint){pedal+=g0*PEDK.sprint;pdAlvo=pedal;return}
 const giro=g0*PEDK.lento*clamp(power/40,0,1);pedal+=giro;pdAlvo+=giro;
 if(toque)pdAlvo=Math.min(Math.max(pdAlvo,pedal)+PEDK.meia,pedal+PEDK.meia*PEDK.fila);
 if(pdAlvo>pedal)pedal+=(pdAlvo-pedal)*Math.min(1,dt*PEDK.soco)};
