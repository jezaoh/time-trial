#!/usr/bin/env python3
"""Metas de balanceamento (16/11): roda os robôs de metas.js no jogo montado e mostra OK / FORA para cada meta.
Termina com código 1 se alguma meta ficou fora — rode depois de QUALQUER mudança em números de jogo (AJ, CAR, LIV, FIS, CORR...).

Uso:  python3 tools/simulacao_npcs/metas.py dist/time_trial_v2.html          # todas (alguns minutos)
      python3 tools/simulacao_npcs/metas.py dist/time_trial_v2.html 8        # só a meta nº 8
"""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
AQUI = os.path.dirname(os.path.abspath(__file__))
async def main():
    alvo = sys.argv[1]; url = alvo if alvo.startswith('http') else 'file://' + os.path.abspath(alvo)
    so = sys.argv[2] if len(sys.argv) > 2 else None
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1536, 'height': 864})
        err = []; pg.on('pageerror', lambda e: err.append(str(e)))
        await pg.goto(url); await pg.wait_for_timeout(2500)
        await pg.evaluate("requestAnimationFrame=()=>0")
        for js in ('harness.js', 'testes.js', 'acelerador.js', 'metas.js'):
            await pg.add_script_tag(path=os.path.join(AQUI, js))
        n = await pg.evaluate('METAS_LISTA.length')
        fora = 0
        for i in ([int(so)] if so else range(n)):
            r = json.loads(await pg.evaluate(f'METAS({i})'))[0]
            if not r['ok']: fora += 1
            print(f"{'OK  ' if r['ok'] else 'FORA'} {i:2d}. {r['meta']}  →  {r['campo']} {r['valores']} (faixa {r['faixa']})", flush=True)
        print(f'\nmetas fora: {fora}' + (f' · erros na página: {err[:3]}' if err else ''))
        await b.close()
        sys.exit(1 if fora or err else 0)
asyncio.run(main())
