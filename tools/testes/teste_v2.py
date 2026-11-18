#!/usr/bin/env python3
"""Teste da V2 no navegador (Playwright/Chromium), com o TECLADO de verdade:
toques de 0,2 s / 0,5 s, pressões de 1 s / 3 s / 5 s e toques repetidos. Mede, a cada quadro, a potência
(maior taxa de variação em W/s: sem saltos = taxa limitada) e confere a regra da stamina da V1 (pressionado com stamina > 0,5 → só cai; solto → só sobe,
exceto quando encosta no teto 100 − fadiga). Também verifica a seleção, chegada, quebra ("VOCÊ QUEBROU!") e ranking desligado.

Uso:  python3 tools/testes/teste_v2.py time_trial_v2.html [pasta_para_prints]
"""
import asyncio, sys, os, io
from PIL import Image
from playwright.async_api import async_playwright
alvo = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else '/tmp'
url = (alvo if alvo.startswith('http') else 'file://' + os.path.abspath(alvo)) + '?teste=crono'   # 18/11: sem tela de modos; o Contrarrelógio é teste interno
LOG_ON = "window._L=[];if(!window._u0){window._u0=update;update=function(dt){_u0(dt);if(window._L)_L.push([boost,stamina,power,fatigue,speed,dt])}}"
async def caso(pg, nome, padrao):
    """padrao: lista de (pressionado_ms, solto_ms)"""
    await pg.evaluate('reset()'); await pg.wait_for_timeout(1200)
    await pg.evaluate(LOG_ON)
    for on, off in padrao:
        await pg.keyboard.down('Space'); await pg.wait_for_timeout(on); await pg.keyboard.up('Space'); await pg.wait_for_timeout(off)
    L = await pg.evaluate('(()=>{const l=_L;window._L=null;return l})()')
    # taxa de variação da potência (W/s): um salto apareceria como taxa enorme num único quadro
    dmax = max(abs(b[2]-a[2])/b[5] for a, b in zip(L, L[1:]))
    viol = sum(1 for a, b in zip(L, L[1:]) if a[0] == b[0] and (
        (a[0] and a[1] > .5 and b[1] > a[1] + 1e-6) or (not a[0] and b[1] < a[1] - 1e-6 and b[1] < 100 - b[3] - .01)))
    pk = max(x[2] for x in L); v0 = L[0][4]; vmax = max(x[4] for x in L)
    # resposta no 1º quadro: quando o botão muda, a potência já muda no mesmo quadro
    sobe = all(b[2] > a[2] for a, b in zip(L, L[1:]) if b[0] and not a[0] and b[1] > .5)
    desce = all(b[2] < a[2] for a, b in zip(L, L[1:]) if a[0] and not b[0] and a[2] > 180)
    print(f'{nome:34} pico {pk:5.0f} W | variação máx. {dmax:4.0f} W/s | {v0:4.1f}→{vmax:4.1f} km/h | stamina {L[0][1]:5.1f}→{L[-1][1]:5.1f} | 1º quadro: sobe {'sim' if sobe else 'NÃO'} / desce {'sim' if desce else 'NÃO'} | violações {viol}')
    return dmax, viol
async def barra(pg, nome, out):
    """Lê uma linha de pixels da barra: só pode haver verde e vermelho, encostados (sem faixa escura)."""
    png = await pg.screenshot(path=f'{out}/v2_barra_{nome}.png', clip={'x':330,'y':680,'width':880,'height':184})
    im = Image.open(io.BytesIO(png)).convert('RGB'); y = 752-680; x0, x1 = 421-330, 1121-330   # 17/11: meio da barra (780 era a borda escura de baixo)
    tipo = []
    for x in range(x0, x1):
        r, g, b = im.getpixel((x, y))
        tipo.append('V' if g > r and g > 120 else 'R' if r > 150 and r > g else '?')
    s = ''.join(tipo).strip('?')   # bordas do brilho/arredondamento
    trocas = sum(1 for a, b in zip(s, s[1:]) if a != b)
    escuros = s.count('?')
    if not s: return {'erro': 'barra não encontrada na linha medida'}
    return {'verde_%': round(100*s.count('V')/len(s)), 'vermelho_%': round(100*s.count('R')/len(s)), 'pixels_estranhos': escuros, 'trocas_de_cor': trocas}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1536, 'height': 864})
        erros = []; pg.on('pageerror', lambda e: erros.append(str(e)))
        pg.on('console', lambda m: erros.append(m.text) if m.type == 'error' else None)
        await pg.goto(url); await pg.wait_for_timeout(1500);await pg.evaluate('CONT=-1')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(600)
        # tela ESCOLHA O MODO → contrarrelógio (seta esquerda + Enter)
        await pg.keyboard.press('ArrowLeft'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(600)
        print('seleção:', await pg.evaluate('({state, ciclistas: CH.map(c=>c.id), setas: ARW.length})'))
        await pg.screenshot(path=f'{out}/v2_selecao.png')
        await pg.fill('#nick', 'Teste'); await pg.evaluate('play()'); await pg.wait_for_timeout(500)
        res = []
        res.append(await caso(pg, 'toque 0,1 s', [(100, 2500)]))
        res.append(await caso(pg, 'toque 0,2 s', [(200, 2500)]))
        res.append(await caso(pg, 'toque 0,5 s', [(500, 2500)]))
        res.append(await caso(pg, 'pressão 1 s', [(1000, 2500)]))
        res.append(await caso(pg, 'pressão 3 s', [(3000, 2500)]))
        res.append(await caso(pg, 'pressão contínua 5 s', [(5000, 3000)]))
        res.append(await caso(pg, 'toques 0,2 s / 0,3 s × 10', [(200, 300)] * 10))
        res.append(await caso(pg, 'toques 0,1 s / 0,1 s × 20', [(100, 100)] * 20))
        res.append(await caso(pg, '1 s pressionado / 1 s solto × 5', [(1000, 1000)] * 5))
        # capturas de HUD em potências diferentes
        await pg.evaluate('reset()'); await pg.wait_for_timeout(1500);await pg.evaluate('CONT=-1'); await pg.screenshot(path=f'{out}/v2_cruzeiro.png')
        await pg.keyboard.down('Space'); await pg.wait_for_timeout(1100); await pg.screenshot(path=f'{out}/v2_ataque.png')
        await pg.wait_for_timeout(1700); await pg.screenshot(path=f'{out}/v2_sprint.png'); await pg.keyboard.up('Space')
        await pg.evaluate('dist=38.5;grade=7.5'); await pg.wait_for_timeout(800)
        await pg.keyboard.down('Space'); await pg.wait_for_timeout(1800); await pg.screenshot(path=f'{out}/v2_subida.png'); await pg.keyboard.up('Space')
        # fadiga sobe mesmo sem apertar
        await pg.evaluate('reset()'); await pg.wait_for_timeout(300); f0 = await pg.evaluate('fatigue'); await pg.wait_for_timeout(3000)
        print('sem apertar por 3 s: fadiga', round(f0,2), '→', round(await pg.evaluate('fatigue'),2))
        # barra: durante e depois de um sprint (stamina interna baixa) — só verde e vermelho, encostados
        await pg.keyboard.down('Space'); await pg.wait_for_timeout(2500)
        print('barra durante sprint:', await barra(pg, 'sprint', out), await pg.evaluate('({stamina:+stamina.toFixed(1),fatigue:+fatigue.toFixed(1)})'))
        await pg.keyboard.up('Space'); await pg.wait_for_timeout(300)
        print('barra logo após soltar:', await barra(pg, 'soltou', out), await pg.evaluate('({stamina:+stamina.toFixed(1),fatigue:+fatigue.toFixed(1)})'))
        # água e gel: a barra precisa mostrar o vermelho diminuindo
        await pg.evaluate('reset()'); await pg.wait_for_timeout(300)
        await pg.evaluate('fatigue=60;stamina=25'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=f'{out}/v2_agua_0.png', clip={'x':330,'y':680,'width':880,'height':184})
        await pg.keyboard.press('KeyA'); await pg.wait_for_timeout(1000)
        await pg.screenshot(path=f'{out}/v2_agua_1s.png', clip={'x':330,'y':680,'width':880,'height':184})
        print('barra com água agindo:', await barra(pg, 'agua', out))
        a1 = await pg.evaluate('({fatigue:+fatigue.toFixed(1),stamina:+stamina.toFixed(1),water})')
        await pg.keyboard.press('KeyA'); await pg.wait_for_timeout(1500);await pg.evaluate('CONT=-1')   # 2º clique durante o efeito: não abre outra
        await pg.screenshot(path=f'{out}/v2_agua_2s5.png', clip={'x':330,'y':680,'width':880,'height':184})
        a2 = await pg.evaluate('({fatigue:+fatigue.toFixed(1),stamina:+stamina.toFixed(1),water})')
        print('água: fadiga 60 →', a1, '→', a2)
        await pg.evaluate('fatigue=80;stamina=10'); await pg.wait_for_timeout(100)
        await pg.screenshot(path=f'{out}/v2_gel_antes.png', clip={'x':330,'y':680,'width':880,'height':184})
        await pg.keyboard.press('KeyG'); await pg.wait_for_timeout(100)
        await pg.screenshot(path=f'{out}/v2_gel_depois.png', clip={'x':330,'y':680,'width':880,'height':184})
        print('barra depois do gel:', await barra(pg, 'gel', out))
        print('gel: fadiga 80 →', await pg.evaluate('({fatigue:+fatigue.toFixed(1),stamina:+stamina.toFixed(1),gel})'))
        # stamina baixa e fadiga alta: o botão perde efeito suavemente, sem salto de potência
        await pg.evaluate('fatigue=85;stamina=3'); await pg.evaluate(LOG_ON)
        await pg.keyboard.down('Space'); await pg.wait_for_timeout(1500);await pg.evaluate('CONT=-1'); await pg.keyboard.up('Space'); await pg.wait_for_timeout(300)
        L = await pg.evaluate('(()=>{const l=_L;window._L=null;return l})()')
        print('stamina baixa/fadiga alta:', {'pico W': round(max(x[2] for x in L)), 'variação máx W/s': round(max(abs(b[2]-a[2])/b[5] for a, b in zip(L, L[1:]))),
              'fadiga': round(L[-1][3],1), 'estado': await pg.evaluate('state')})
        await pg.screenshot(path=f'{out}/v2_exausto.png')
        # chegada
        await pg.evaluate('dist=49.97'); await pg.wait_for_timeout(1200)
        print('chegada:', await pg.evaluate('({state,won,ranking:RANK_API||"desligado"})'))
        await pg.wait_for_timeout(600); await pg.screenshot(path=f'{out}/v2_chegada.png')
        # quebra pela fadiga
        await pg.evaluate('reset()'); await pg.wait_for_timeout(500); await pg.evaluate('fatigue=99.8'); await pg.wait_for_timeout(1500);await pg.evaluate('CONT=-1')
        print('quebra:', await pg.evaluate('({state,won})'))
        await pg.wait_for_timeout(600); await pg.screenshot(path=f'{out}/v2_quebrou.png')
        print('localStorage:', await pg.evaluate('Object.keys(localStorage)'))
        print('erros:', erros or 'nenhum'); await b.close()
        sys.exit(1 if erros or any(v for _, v in res) or max(d for d, _ in res) > 750 else 0)
asyncio.run(main())
