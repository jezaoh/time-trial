// Renderiza o decalque no quadro 0 (pose da referência) para a medição: tudo junto + cada parte sozinha, fundo transparente.
// Uso: node tools/ciclista_decalque/medir_render.js teste/ciclista_decalque.html PASTA_SAIDA
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const [pag,out]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1376,height:900}});
 await p.goto('file://'+path.resolve(pag));await p.waitForTimeout(700);
 const imgs=await p.evaluate(()=>{window.requestAnimationFrame=()=>0;
  const c=document.createElement('canvas');c.width=1376;c.height=768;const x=c.getContext('2d');const res={};
  const TH0=Math.atan2(DECAL.J.pedal[1]-DECAL.J.mov[1],DECAL.J.pedal[0]-DECAL.J.mov[0]);
  x.clearRect(0,0,1376,768);cicDecal(x,{th:TH0,roda:0,kit:null});res.tudo=c.toDataURL();
  for(const n in DECAL.partes){x.clearRect(0,0,1376,768);for(const l of DECAL.partes[n].cam){x.fillStyle=l.c;x.fill(l.path)}res[n]=c.toDataURL()}
  return res});
 for(const k in imgs)fs.writeFileSync(path.join(out,k+'.png'),Buffer.from(imgs[k].split(',')[1],'base64'));
 await b.close()})();
