"""Máscaras para recolorir o ciclista branco (NPCs e Garagem do jogador).
Folhas: sprite pedalando (17×320×292, pneu 284), sprite em pe (18×314×326, pneu 315) e sprite levantando (12×314×326).
A bike é a mesma nas três (mesma escala); na folha em pé ela está deslocada (−4,5; +31) em relação à pedalando.
Saída (resolução cheia, na pasta de cada folha): m_roupa.webp, m_pele.webp, m_quadro.webp (branco com alfa).
O jogo monta o "base" (pele em cinza) na hora, com filtro de canvas.
Rodar da raiz:  python3 tools/poly/mascaras_npc.py [--previa pasta]"""
import os, sys, colorsys, math
from PIL import Image
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CB = os.path.join(RAIZ, 'prototipos/2026-11-26/ciclista branco')
FOLHAS = [('sprite pedalando', 'pedalando_sheet.webp', 320, 0, 0, False),
          ('sprite em pe', 'em_pe_sheet.webp', 314, -4.5, 31, True),
          ('sprite levantando', 'levantando_sheet.webp', 314, -4.5, 31, True)]
def perto_linha(x, y, a, b, tol):
    (x1, y1), (x2, y2) = a, b; dx, dy = x2 - x1, y2 - y1
    t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return math.hypot(x - x1 - t * dx, y - y1 - t * dy) < tol
def faz(pasta, arq, FW, ox, oy, empe):
    im = Image.open(os.path.join(CB, pasta, arq)).convert('RGBA'); W, H = im.size; src = im.load()
    mk = {k: Image.new('L', im.size, 0) for k in ('roupa', 'pele', 'quadro')}; mp = {k: v.load() for k, v in mk.items()}
    S = lambda p: (p[0] + ox, p[1] + oy)
    BB = S((147, 234)); RODAS = [S((72, 228)), S((252, 228))]
    TUBOS = [(BB, RODAS[0]), (BB, S((118, 150))), (BB, S((232, 152))), (S((118, 150)), S((232, 152))), (S((118, 150)), RODAS[0]), (S((232, 152)), RODAS[1])]
    topo = 150 + oy; barra = 185 + oy
    for y in range(H):
        for x in range(W):
            r, g, b, a = src[x, y]
            if a < 10: continue
            lx = x % FW
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if .015 < h < .125 and s > .22 and v > .25: mp['pele'][x, y] = a; continue
            if s > .2 or v < .5: continue
            if any(44 < math.hypot(lx - cx, y - cy) < 60 for cx, cy in RODAS): continue
            if y < 42 + (12 if empe else 0) and lx > 200 + ox: continue          # capacete branco
            if 165 + ox < lx < 198 + ox and 168 + oy < y < 210 + oy: continue   # caramanhola
            tubo = any(perto_linha(lx, y, A, B, 6) for A, B in TUBOS) or perto_linha(lx, y, BB, S((118, 150)), 13)
            if y < topo and not (empe and tubo and y > topo - 12): mp['roupa'][x, y] = a; continue
            if tubo: mp['quadro'][x, y] = a
            elif lx < 170 + ox and y < barra: mp['roupa'][x, y] = a
    for k, m in mk.items():
        o = Image.new('RGBA', im.size, (255, 255, 255, 0)); o.putalpha(m); o.save(os.path.join(CB, pasta, f'm_{k}.webp'), quality=88, method=6)
    if '--previa' in sys.argv:
        cores = {'roupa': (220, 40, 40), 'pele': (110, 70, 40), 'quadro': (30, 90, 220)}
        out = im.copy(); op = out.load(); n = min(4, W // FW)
        for k, c in cores.items():
            m = mp[k]
            for y in range(H):
                for x in range(0, FW * n):
                    if m[x, y]:
                        r, g, b, a = op[x, y]
                        if k == 'pele': L = min(255, (.299 * r + .587 * g + .114 * b) * 1.75); r = g = b = L
                        op[x, y] = (int(r * c[0] / 255), int(g * c[1] / 255), int(b * c[2] / 255), a)
        f = Image.new('RGBA', (FW * n, H), (60, 150, 80, 255)); f.alpha_composite(out.crop((0, 0, FW * n, H)))
        f.save(os.path.join(sys.argv[sys.argv.index('--previa') + 1], pasta.replace(' ', '_') + '_previa.png'))
for F in FOLHAS: faz(*F)
for k in ('base', 'roupa', 'pele', 'quadro'):   # máscaras antigas (meia resolução) não são mais usadas
    p = os.path.join(CB, 'sprite pedalando', f'npc_{k}.webp')
    if os.path.exists(p): os.remove(p)
print('ok')
