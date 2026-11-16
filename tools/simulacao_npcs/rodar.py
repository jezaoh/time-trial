#!/usr/bin/env python3
"""Roda as simulações aceleradas dos NPCs (harness.js + testes.js) dentro do jogo montado, no Chromium (Playwright).

Uso (a partir da raiz do projeto):
  python3 tools/montar_arquivo_unico.py --saida /tmp/tt.html
  python3 tools/simulacao_npcs/rodar.py /tmp/tt.html "TESTES()"                 # testes 1–9 (Pedal Livre, 100 km)
  python3 tools/simulacao_npcs/rodar.py /tmp/tt.html "TESTE_CORRIDA(30,4)"      # corridas/rachão com um jogador-robô
  python3 tools/simulacao_npcs/rodar.py /tmp/tt.html "TESTE_RECURSOS()"         # caminhão/furgão/torcedor compartilhados
  python3 tools/simulacao_npcs/rodar.py /tmp/tt.html "TESTE_TAP('corrida',4,.45,9,8)"  # robô de toques atacando com itens
Cada argumento depois do HTML é uma expressão JavaScript avaliada na página; o resultado é impresso.
Os "jogadores-robô" são simples (não sabem pegar vácuo direito): servem para comparar versões, não para medir o jogador real.
"""
import asyncio, os, sys
from playwright.async_api import async_playwright
AQUI = os.path.dirname(os.path.abspath(__file__))
async def main():
    alvo = sys.argv[1]; url = alvo if alvo.startswith('http') else 'file://' + os.path.abspath(alvo)
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1536, 'height': 864})
        err = []; pg.on('pageerror', lambda e: err.append(str(e)))
        await pg.goto(url); await pg.wait_for_timeout(2500)
        await pg.evaluate("requestAnimationFrame=()=>0")   # para o laço do jogo: a simulação chama update()/draw() direto
        await pg.add_script_tag(path=os.path.join(AQUI, 'harness.js')); await pg.add_script_tag(path=os.path.join(AQUI, 'testes.js')); await pg.add_script_tag(path=os.path.join(AQUI, 'acelerador.js'))
        for code in sys.argv[2:]: print(await pg.evaluate(code))
        print('erros', err[:3]); await b.close()
asyncio.run(main())
