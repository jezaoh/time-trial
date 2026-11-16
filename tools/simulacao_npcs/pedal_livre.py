#!/usr/bin/env python3
"""Pedal Livre de 90 km no jogo de verdade, com um jogador-robô (~95% do FTP, fadiga travada em 50).
Mede: ciclistas vistos, quantos na tela (máx/média), quebrados que você passou, falas e moedas do pedal.
Uso: python3 tools/simulacao_npcs/pedal_livre.py /tmp/tt.html"""
import asyncio, os, sys
from playwright.async_api import async_playwright
async def main():
    alvo = sys.argv[1]; url = alvo if alvo.startswith('http') else 'file://' + os.path.abspath(alvo)
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1536, 'height': 864})
        err = []; pg.on('pageerror', lambda e: err.append(str(e)))
        await pg.goto(url); await pg.wait_for_timeout(2500)
        await pg.evaluate("requestAnimationFrame=()=>0;MODO='carreira';CS=carNovo();CS.sk.motor=4;CS.mochila=[];carTipo='livre';reset();CONT=-1;draw()")
        r = await pg.evaluate("""(()=>{let fr=0,maxT=0,somaT=0,am=0;const passQ=new Set(),vist=new Set(),falas=new Set(),ord=new Map();
          while(state==='run'&&dist<90&&fr<60*900){boost=power<FTP*.95&&stamina>20;fatigue=Math.min(fatigue,50);update(1/60);T+=1/60;fr++;if(fr%3==0)draw();
           let nt=0;for(const n of NPCS){if(!n.ia)continue;const x=bikeX+(n.dist-dist)*PX_KM,v=x>WX0&&x<WX1;if(v){nt++;vist.add(n)}if(n.fala&&v)falas.add(n.fala.s);
            const f2=n.dist>dist,o=ord.get(n);if(o===true&&!f2&&(n.est==='quebrado'||n.sentado))passQ.add(n.nome+(n.sentado?' (sentado)':' (quebrado)'));ord.set(n,f2)}
           if(fr%30==0){maxT=Math.max(maxT,nt);somaT+=nt;am++}}
          return JSON.stringify({km:dist.toFixed(0),media:(dist*3600/(elapsed*SCALE)).toFixed(1),vistos:vist.size,na_tela_max:maxT,na_tela_media:(somaT/am).toFixed(1),
           passou_quebrados:[...passQ],falas:[...falas].slice(0,14),moedas_do_pedal:moedasPedal()},null,1)})()""")
        print(r); print('erros', err[:3]); await b.close()
asyncio.run(main())
