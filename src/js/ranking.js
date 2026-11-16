/* ===== Cliente do ranking (opcional) =====
   RANK_API vazio = ranking desligado. Com RANK_API preenchido (ex.: /?rest_route=/timetrial/v1) liga troféu, painel Top 10 e envio do tempo. Ver docs/RANKING_WORDPRESS.md.
*/
const RANK_API=''; // vazio = ranking desligado. A versão do WordPress é montada com --rank-api "/?rest_route=/timetrial2/v1"
const RK={top:[],me:null,total:0,load:0,res:null,tok:null,uid:''};
try{RK.uid=localStorage.getItem('tt2_uid')||'';if(!/^[a-f0-9-]{36}$/.test(RK.uid)){RK.uid=(crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,k=>{const r=Math.random()*16|0;return(k=='x'?r:r&3|8).toString(16)}));localStorage.setItem('tt2_uid',RK.uid)}}catch(e){if(!RK.uid)RK.uid='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,k=>{const r=Math.random()*16|0;return(k=='x'?r:r&3|8).toString(16)})}
function rkUrl(r){return RANK_API+'/'+r}
async function rkCall(r,body){const b=rkUrl(r),u=body?b:b+(b.indexOf('?')>=0?'&':'?')+'uid='+RK.uid+'&_='+Date.now();
 const o=body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'}:{cache:'no-store'};
 const res=await fetch(u,o);return res.json()}
async function rkLoad(){if(!RANK_API)return;RK.load=1;try{const j=await rkCall('ranking');if(!j.ok)throw 0;RK.top=j.top;RK.me=j.me;RK.total=j.total;RK.load=2}catch(e){RK.load=3}}
async function rkStart(){RK.tok=null;if(!RANK_API)return;try{const j=await rkCall('start',{uid:RK.uid});if(j.ok)RK.tok=j.token}catch(e){}}
async function rkSend(t,ch){RK.res={s:'send'};if(!RANK_API)return;
 if(!nick){RK.res={s:'nonick'};return}
 try{if(!RK.tok)throw 0;const j=await rkCall('score',{uid:RK.uid,token:RK.tok,nick:nick,t:t,ch:ch});
  if(j.ok){RK.res={s:'ok',pos:j.pos,best:j.best,imp:j.improved,total:j.total}}else RK.res={s:'err',e:j.error}}catch(e){RK.res={s:'err',e:'rede'}}}
