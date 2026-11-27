"""Máscaras para recolorir o ciclista branco (NPCs e, depois, a Garagem).
Entrada: prototipos/2026-11-26/ciclista branco/sprite pedalando/pedalando_sheet.webp (17 quadros 320×292).
Saída (mesma pasta, metade da resolução): npc_base.webp (pele em tons de cinza: o jogo multiplica a cor),
npc_roupa.webp, npc_pele.webp, npc_quadro.webp (máscaras: branco com alfa).
Rodar da raiz:  python3 tools/poly/mascaras_npc.py [--previa saida.png]"""
import os, sys, colorsys, math
from PIL import Image
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = os.path.join(RAIZ, 'prototipos/2026-11-26/ciclista branco/sprite pedalando')
im = Image.open(os.path.join(P, 'pedalando_sheet.webp')).convert('RGBA')
W, H = im.size; FW = 320
src = im.load()
base = im.copy(); bp = base.load()
mk = {k: Image.new('L', im.size, 0) for k in ('roupa', 'pele', 'quadro')}
mp = {k: v.load() for k, v in mk.items()}
BB = (147, 234); RODAS = [(72, 228), (252, 228)]
def perto_linha(x, y, a, b, tol):
    (x1, y1), (x2, y2) = a, b; dx, dy = x2 - x1, y2 - y1
    t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return math.hypot(x - x1 - t * dx, y - y1 - t * dy) < tol
TUBOS = [(BB, (72, 228)), (BB, (118, 150)), (BB, (232, 152)), ((118, 150), (232, 152)), ((118, 150), (72, 228)), ((232, 152), (252, 228))]
for y in range(H):
    for x in range(W):
        r, g, b, a = src[x, y]
        if a < 10: continue
        lx = x % FW
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if .015 < h < .125 and s > .22 and v > .25:            # pele (laranja)
            mp['pele'][x, y] = a
            L = .299 * r + .587 * g + .114 * b                    # cinza claro com a luz da pele
            L = min(255, L * 1.75); bp[x, y] = (int(L), int(L), int(L), a); continue
        if s > .2 or v < .5: continue                             # só branco/cinza claro daqui pra baixo
        if any(44 < math.hypot(lx - cx, y - cy) < 60 for cx, cy in RODAS): continue   # aro/pneu
        if y < 150:
            if y < 42 and lx > 203: continue                      # capacete fica branco
            mp['roupa'][x, y] = a; continue
        if 165 < lx < 198 and 168 < y < 210: continue             # caramanhola
        if any(perto_linha(lx, y, A, B, 6) for A, B in TUBOS) or perto_linha(lx, y, BB, (118, 150), 13): mp['quadro'][x, y] = a   # tubos (tubo do selim é largo)
        elif lx < 170 and y < 185: mp['roupa'][x, y] = a          # barra da bermuda
for k in mk: mk[k] = mk[k]
def meia(img): return img.resize((W // 2, H // 2), Image.LANCZOS)
meia(base).save(os.path.join(P, 'npc_base.webp'), quality=90, method=6)
for k, m in mk.items():
    o = Image.new('RGBA', im.size, (255, 255, 255, 0)); o.putalpha(m); meia(o).save(os.path.join(P, f'npc_{k}.webp'), quality=90, method=6)
if '--previa' in sys.argv:   # 3 quadros pintados para conferir
    cores = {'roupa': (220, 40, 40), 'pele': (120, 72, 40), 'quadro': (30, 90, 220)}
    out = base.copy(); op = out.load()
    for k, c in cores.items():
        m = mp[k]
        for y in range(H):
            for x in range(0, FW * 3):
                if m[x, y]:
                    r, g, b, a = op[x, y]; op[x, y] = (r * c[0] // 255, g * c[1] // 255, b * c[2] // 255, a)
    fundo = Image.new('RGBA', (FW * 3, H), (60, 150, 80, 255)); fundo.alpha_composite(out.crop((0, 0, FW * 3, H)))
    fundo.save(sys.argv[sys.argv.index('--previa') + 1])
print('ok')
