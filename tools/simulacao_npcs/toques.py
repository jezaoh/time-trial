#!/usr/bin/env python3
"""Botão de pedalada: watts médios e stamina para 0–3 toques por segundo (Carreira e Contrarrelógio), sem eventos de estrada
e com a fadiga zerada a cada quadro (mede só a stamina). Também mede o pico segurando 3 s (sprint).
Uso: python3 tools/simulacao_npcs/toques.py /tmp/tt.html"""
import asyncio, os, sys
from playwright.async_api import async_playwright
async def main():
    alvo = sys.argv[1]; url = alvo if alvo.startswith('http') else 'file://' + os.path.abspath(alvo)
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.goto(url); await pg.wait_for_timeout(2500)
        print(await pg.evaluate("""(()=>{requestAnimationFrame=()=>0;const out=[];for(const modo of ['carreira','crono'])for(const f of [0,1,1.5,2,2.5,3]){MODO=modo;CS=carNovo();CS.mochila=[];carTipo='livre';reset();CONT=-1;state='run';NPCS=[];rampas=[];if(modo==='crono')climbs=[];if(LV){LV.eventos=false;LV.livre=false}draw();
          let t=0,sw=0,n=0,st0=null;const P=f?1/f:1e9;for(let i=0;i<60*40;i++){boost=f>0&&(t%P)<.08;fatigue=0;update(1/60);t+=1/60;if(t>10){sw+=power;n++;if(st0==null)st0=stamina}}
          out.push([modo,f+' toques/s',Math.round(sw/n/FTP*100)+'% FTP',Math.round(sw/n)+' W','stamina '+Math.round(st0)+'→'+Math.round(stamina)+' em 30 s',speed.toFixed(1)+' km/h'])}
         MODO='carreira';reset();CONT=-1;state='run';NPCS=[];LV.eventos=false;LV.livre=false;let pk=0;for(let i=0;i<60*3;i++){boost=true;update(1/60);pk=Math.max(pk,power)}
         out.push(['segurar 3 s','pico '+Math.round(pk)+' W','stamina '+Math.round(stamina)]);return out.map(x=>x.join(' | ')).join('\\n')})()"""))
        await b.close()
asyncio.run(main())
