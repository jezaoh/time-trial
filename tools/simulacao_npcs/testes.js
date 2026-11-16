window.TESTES=function(){const O={};const md=a=>+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);
 // 1-3 solo
 for(const nv of ['recreativo','intermediario','muitoForte']){const L=[];for(let k=0;k<6;k++){const R=SIM({riders:[{nivel:nv,Fend:rnd(72,84)}],terreno:'livre',seed:k%4})[0];L.push(R)}
  O['solo_'+nv]={media:md(L.map(r=>r.media||0)),faixa:[Math.min(...L.map(r=>r.media||0)),Math.max(...L.map(r=>r.media||0))],fadFinal:md(L.map(r=>r.fadFinal)),quebras:L.filter(r=>r.quebrou).length+'/6',exemplo_fadiga_km:L[0].hist.map(h=>h[0]+'km:'+h[1]).filter((_,i)=>i%2==0).join(' ')}}
 // 4 pelotão de 4 muito fortes
 {const L=[];for(let k=0;k<4;k++){const R=SIM({riders:[0,1,2,3].map(i=>({nivel:'muitoForte',Fend:84})),terreno:'livre',seed:k});L.push(R)}
  const solo=[];for(let k=0;k<4;k++)solo.push(SIM({riders:[{nivel:'muitoForte',Fend:84}],terreno:'livre',seed:k})[0].media);
  O.pelotao4_muitoFortes={media_grupo:md(L.flat().map(r=>r.media||0)),por_rodada:L.map(R=>R.map(r=>r.media)),fadFinal:md(L.flat().map(r=>r.fadFinal)),media_solo_mesmo_terreno:md(solo)}}
 // 5 intermediário tentando acompanhar pelotão forte
 {const res=[];for(let k=0;k<4;k++){let solto=null;const R=SIM({riders:[{nivel:'muitoForte',Fend:84},{nivel:'muitoForte',Fend:84},{nivel:'muitoForte',Fend:84},{nivel:'muitoForte',Fend:84},{nivel:'intermediario',Fend:84,agr:1,lab:'inter'}],terreno:'livre',seed:k,
   evento:(t,R)=>{if(solto==null&&t>600){const g=R.slice(0,4).filter(r=>!r.sentado),u=Math.min(...g.map(r=>r.dist));if((u-R[4].dist)>1.5)solto=+R[4].dist.toFixed(1)}}});
   res.push({ftp_inter:R[4].ftp,ftp_fortes:R.slice(0,4).map(r=>r.ftp),soltou_no_km:solto,fad_quando_terminou:R[4].fadFinal,media_inter:R[4].media,media_fortes:md(R.slice(0,4).map(r=>r.media||0)),quebrou_km:R[4].quebrou})}
  O.inter_vs_pelotao_muitoForte=res}
 // 6 ataques repetidos até quebrar
 {const a0=FIS.ataquesH;FIS.ataquesH=12;const res=[];for(let k=0;k<3;k++){const R=SIM({riders:[{nivel:'forte',Fend:115,agr:1,lab:'atacante',inv:{agua:2,gel:0,banana:0}},{nivel:'forte',Fend:84,agr:0},{nivel:'forte',Fend:84,agr:0},{nivel:'forte',Fend:84,agr:0}],terreno:'livre',seed:k});
   res.push({ataques:R[0].ataques,quebrou_km:R[0].quebrou,abandonou:R[0].abandonou,km:R[0].km,fad:R[0].fadFinal,media_atacante:R[0].media,media_outros:md(R.slice(1).map(r=>r.media||0))})}FIS.ataquesH=a0;O.atacante_compulsivo=res}
 // 7 economia no vácuo: mesmo ciclista sozinho x em dupla revezando (fadiga aos 50 km)
 {const a=[],b=[];for(let k=0;k<4;k++){const base={ftp:230,m:72,end:1,Fend:84,tipo:'rolador',agr:0};
   a.push(SIM({riders:[base],terreno:'livre',seed:k,km:50})[0]);b.push(SIM({riders:[base,Object.assign({},base)],terreno:'livre',seed:k,km:50}))}
  O.vacuo_50km={sozinho:a.map(r=>[r.media,r.fadFinal]),dupla:b.map(R=>[R[0].media,R.map(r=>r.fadFinal)])}}
 // 8 itens de recuperação
 {const c=[],s=[];for(let k=0;k<4;k++){const r1=SIM({riders:[{nivel:'forte',Fend:112,inv:{agua:0,gel:0,banana:0}}],terreno:'livre',seed:k})[0];const r2=SIM({riders:[{nivel:'forte',Fend:112,inv:{agua:5,gel:2,banana:2}}],terreno:'livre',seed:k})[0];
   s.push([r1.quebrou,r1.fadFinal,r1.media]);c.push([r2.quebrou,r2.fadFinal,r2.media,JSON.stringify(r2.itensRest)])}O.itens={sem_itens_quebrou_fad_media:s,com_5aguas_2geis_2bananas:c}}
 // 9 NPC exagerado passa o jogador, quebra e é alcançado
 {const res=[];for(let k=0;k<3;k++){let ev=[],ult=null;const R=SIM({riders:[{nivel:'forte',Fend:120,agr:0,lab:'exagerado',inv:{agua:1,gel:0,banana:0}}],terreno:'livre',seed:k,km:100,jogador:{w:200},
   evento:(t,R)=>{const r=R[0],fr=r.dist>dist;if(ult!==null&&fr!==ult)ev.push((fr?'NPC passou você':'você passou o NPC')+' no km '+dist.toFixed(1)+' (fadiga NPC '+Math.round(r.fad)+', '+r.est+')');ult=fr}});
   res.push({eventos:ev.slice(0,5),npc_quebrou_km:R[0].quebrou,npc_abandonou_km:R[0].abandonou?R[0].km:null})}O.exagerado_x_jogador_200W=res}
 return JSON.stringify(O,null,1)};
// 10, 11, 12 rodam no jogo de verdade
window.TESTE_CORRIDA=function(km,nRod){const out=[];for(let k=0;k<nRod;k++){MODO='carreira';CS=carNovo();CS.mochila=[];CS.pat=k%2?4:1;carTipo='treino';carProva=km;reset();CONT=-1;state='run';draw();
 let t0=performance.now(),fr=0,maxMs=0;const pw=FTP*.95;
 while(state==='run'&&fr<6e5){const a=performance.now();boost=power<pw;fatigue=Math.min(fatigue,60);update(1/60);T+=1/60;fr++;if(fr%10==0)draw();maxMs=Math.max(maxMs,performance.now()-a)}
 const R=CORR.riders;out.push({km,forca:pat().forca,frames:fr,ms_medio:+((performance.now()-t0)/fr).toFixed(3),ms_pior:+maxMs.toFixed(2),pos_jogador:carRes&&carRes.pos,
  tempo_vencedor_min:Math.round(Math.min(...R.filter(r=>r.fim!=null).map(r=>r.fim))*SCALE/60),media_venc:+(km/(Math.min(...R.filter(r=>r.fim!=null).map(r=>r.fim))*SCALE/3600)).toFixed(1),
  terminaram:R.filter(r=>r.fim!=null).length,abandonos:R.filter(r=>r.dnf).map(r=>r.nome+' ('+r.tipo+') km '+r.dist.toFixed(0)),quebrados:R.filter(r=>r.est==='quebrado').length,max_fad:Math.round(Math.max(...R.map(r=>r.fad||0))),ataques_afoitos:window._AT||0,
  nan:R.some(r=>!isFinite(r.dist)||(r.fad!=null&&!isFinite(r.fad))),fad_media:Math.round(R.reduce((a,r)=>a+(r.fad||0),0)/R.length),
  bananas_pegas:R.reduce((a,r)=>a+Object.keys(r.pegou||{}).length,0),aguas_do_torcedor:(LV.rec||[]).filter(i=>i.t==='agua').reduce((a,i)=>a+i.peg.size,0)})}return JSON.stringify(out)};
window.TESTE_RECURSOS=function(){MODO='carreira';CS=carNovo();CS.mochila=[];carTipo='livre';reset();CONT=-1;state='run';NPCS=[];speed=30;draw();
 const G=[];for(let i=0;i<6;i++){/*seis em volta de você*/const r=ciclDoNivel('forte',{dist:dist-(i+1)*(FIS.espaco+40)/PX_KM+.02,fad:30});r.v=speed/3.6;r.inv={agua:1,gel:0,banana:0};G.push(r);NPCS.push(r)}
 const longe=ciclDoNivel('forte',{dist:dist+6,fad:30});longe.inv={agua:1,gel:0,banana:0};NPCS.push(longe);
 veicNovo('caminhao');let banJ=0;const b0=LV.banana;
 for(let i=0;i<60*25;i++){boost=power<FTP*.9;fatigue=Math.min(fatigue,40);for(const r of G){const c=LV.veic;r.dist=c&&c.fase==='segue'?c.rear-(150+[-380,-250,-120,0,150,300][G.indexOf(r)])/PX_KM:dist-.1;r.v=speed/3.6;r.fad=30}update(1/60);T+=1/60;if(i%5==0)draw();if(!LV.veic)break}
 const cam={jogador_banana:LV.banana-b0+(LV.pulo?1:0),npcs_perto:G.map(r=>r.inv.banana),npc_a_6km:longe.inv.banana};
 // furgão (gel no asfalto) + torcedor (água): todos passam pelo mesmo ponto
 recNovo('gel',dist+.5);recNovo('agua',dist+.6);LV.itens.push({t:'gel',dist:dist+.5});const g0=gel;
 for(let i=0;i<60*20;i++){boost=power<FTP*.9;fatigue=Math.min(fatigue,40);for(const r of G){r.dist=dist+[-250,-150,-60,60,150,250][G.indexOf(r)]/PX_KM;r.v=speed/3.6;r.fad=30}update(1/60);T+=1/60;if(i%5==0)draw()}
 return JSON.stringify({caminhao:cam,gel_furgao:{jogador:gel-g0,npcs:G.map(r=>r.inv.gel)},agua_torcedor_npcs:G.map(r=>r.inv.agua),npc_longe_gel:longe.inv.gel})};
// fuga do jogador: anda no vácuo até X% da prova e ataca com isotônico e géis (fadiga não travada)
window.TESTE_FUGA=function(km,n,forte){const out=[];for(let k=0;k<n;k++){MODO='carreira';CS=carNovo();CS.sk.motor=forte||0;CS.inv={iso:1,gel:3,banana:5,azul:1,agua7:1};CS.mochila=['iso','gel','banana'];CS.pat=1;carTipo=window._TIPO||'corrida';carProva=km;
 reset();CONT=-1;state='run';draw();let fr=0,atk=false,kmAt=null;
 while(state==='run'&&fr<6e5){const aFr=dist>GOAL*(window._AT||.45);if(aFr&&!atk){atk=true;kmAt=dist}
  boost=atk?(power<FTP*1.25&&stamina>15):power<FTP*.9;if(atk&&fatigue>45&&gel>0)eat();if(atk&&LV.iso>0&&LV.isoT<=0&&stamina<40)tomarIso();if(fatigue>35&&water>0&&waterEffect<=0)drink();if(LV.banana>0&&fatigue>50)comerBanana();
  update(1/60);T+=1/60;fr++;if(fr%10==0)draw()}
 out.push({tipo:carTipo,km,ftp:FTP,ganhou:won,pos:carRes&&carRes.pos,fadiga_fim:Math.round(fatigue)})}return JSON.stringify(out)};
// tático: roda no vácuo (cola na roda), usa itens com calma e só ataca no último 1,5 km
window.TESTE_TATICO=function(km,n,motor){const out=[];for(let k=0;k<n;k++){MODO='carreira';CS=carNovo();CS.sk.motor=motor||0;CS.inv={iso:1,gel:3,banana:0,azul:0,agua7:0};CS.mochila=['iso','gel'];CS.pat=1;carTipo=window._TIPO||'corrida';carProva=km;
 reset();CONT=-1;state='run';draw();let fr=0;
 while(state==='run'&&fr<6e5){const fim=dist>GOAL-1.5;let ah=null,g=1e9;for(const r of CORR.riders){const d=(r.dist-dist)*PX_KM;if(d>0&&d<g){g=d;ah=r}}
  boost=fim?(power<FTP*1.8&&stamina>1):(ah&&g<1500?(g>230&&power<FTP*1.3&&stamina>10):(power<FTP*.95&&stamina>20));
  if(fatigue>55&&gel>0)eat();if(LV.iso>0&&LV.isoT<=0&&fatigue>30)tomarIso();if(fatigue>30&&water>0&&waterEffect<=0)drink();
  update(1/60);T+=1/60;fr++;if(fr%10==0)draw()}
 out.push({tipo:carTipo,ftp:FTP,ganhou:won,pos:carRes&&carRes.pos,fad:Math.round(fatigue)})}return JSON.stringify(out)};
window.TESTE_TAP=function(tipo,n,atk,nivel,motor){const out=[];for(let k=0;k<n;k++){MODO='carreira';CS=carNovo();CS.nivel=nivel;CS.sk.motor=motor;CS.inv={iso:1,gel:3,banana:5,azul:1,agua7:1};CS.mochila=['iso','gel','banana'];CS.pat=1;carTipo=tipo;carProva=30;
 reset();CONT=-1;state='run';draw();let fr=0,t=0;
 while(state==='run'&&fr<6e5){const fim=dist>GOAL-.6,at=dist>GOAL*atk;const f=fim?0:at?2.6:1.6;boost=fim?stamina>1:(t%(1/f))<.08;
  if(at&&fatigue>45&&gel>0)eat();if(at&&LV.iso>0&&LV.isoT<=0&&fatigue>25)tomarIso();if(fatigue>35&&water>0&&waterEffect<=0)drink();if(LV.banana>0&&fatigue>50)comerBanana();
  update(1/60);t+=1/60;T+=1/60;fr++;if(fr%10==0)draw()}
 out.push([tipo,'FTP '+FTP,'força '+Math.round(CORR.riders.reduce((a,r)=>a+r.ftp,0)/CORR.riders.length),won?'pos '+(carRes&&carRes.pos):'quebrou'])}return JSON.stringify(out)};
