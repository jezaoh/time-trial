#!/usr/bin/env python3
"""Recorta as artes dos menus a partir das maquetes (1672x941) e grava webp em src/assets/imagens/.

Uso:
  python3 tools/recortar_menu.py "D:/pessoal/TIME TRAIL/Teste imagem interface menu"
  (sem argumento usa docs/maquetes_menu/)

As maquetes originais são copiadas para docs/maquetes_menu/ (para poder refazer os recortes).
Coordenadas em pixels da maquete (x0, y0, x1, y1). Ajuste aqui e rode de novo.
Requer Pillow.
"""
import os, shutil, sys
from PIL import Image, ImageDraw, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.join(AQUI, '..')
OUT = os.path.join(RAIZ, 'src', 'assets', 'imagens')
GUARDA = os.path.join(RAIZ, 'docs', 'maquetes_menu')

ARQ = {'home': 'home.png', 'bg': 'background.png', 'modo': 'escolha o modo.png',
       'hub': 'Menu pedalar, habilidades, loja e conquistas.png', 'loja': 'loja.png', 'conq': 'conquistas.png'}

# ---------- coordenadas ----------
# áreas a apagar (texto/ícones gravados): preenchidas linha a linha interpolando as cores das bordas esquerda/direita
APAGA_HOME = [(1282, 12, 1668, 128)]
APAGA_HUB = [(22, 22, 268, 108), (360, 62, 600, 165), (250, 160, 670, 226)]
# setas gravadas no hub: cobertas com um pedaço vizinho do cenário (caixa, deslocamento dx, dy), bordas suaves
CLONA_HUB = [((100, 420, 222, 538), 112, 0), ((654, 420, 776, 538), -442, 0)]
HUB_CORTE = (0, 0, 960, 941)            # metade esquerda do hub (a diagonal é recortada no jogo)
MODO = {'modo_crono': (162, 194, 774, 512), 'modo_carreira': (898, 194, 1516, 512)}
HUB_IC = {'hub_ic_habil': (955, 400, 1050, 492), 'hub_ic_loja': (950, 560, 1055, 652), 'hub_ic_conq': (930, 715, 1038, 810)}
LOJA = {'loja_banana': (40, 180, 222, 365), 'loja_gel': (605, 178, 745, 372), 'loja_iso': (1160, 178, 1268, 368),
        'loja_azul': (68, 515, 212, 715), 'loja_agua7': (618, 510, 728, 715), 'loja_reset': (1128, 540, 1296, 695)}
RETRATOS = {'azul': os.path.join('Luiz', 'sprits menu', 'menu 1.png'), 'vinho': os.path.join('Roni', 'sprites menu', 'menu 2.png'),
            'branco': os.path.join('Jeff', 'sprites menu', 'menu 3.png')}
CONQ = {'conq_l30': (44, 220, 256, 415), 'conq_l50': (854, 220, 1066, 415), 'conq_l70': (44, 455, 256, 650),
        'conq_l100': (854, 455, 1066, 650), 'conq_vac': (44, 690, 256, 890), 'conq_senhor': (854, 690, 1066, 890)}


def apagar(im, caixa):
    x0, y0, x1, y1 = caixa
    px = im.load()
    w, h = im.size
    for y in range(y0, y1):
        a = px[max(0, x0 - 4), y]
        b = px[min(w - 1, x1 + 4), y]
        for x in range(x0, x1):
            t = (x - x0) / max(1, x1 - x0)
            px[x, y] = tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))
    # suaviza a área apagada para esconder a emenda
    reg = im.crop(caixa).filter(ImageFilter.GaussianBlur(3))
    im.paste(reg, caixa[:2])


def clonar(im, caixa, dx, dy, fade=14):
    x0, y0, x1, y1 = caixa
    pedaco = im.crop((x0 + dx, y0 + dy, x1 + dx, y1 + dy))
    m = Image.new('L', pedaco.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((fade // 2, fade // 2, pedaco.width - fade // 2, pedaco.height - fade // 2), radius=fade * 2, fill=255)
    im.paste(pedaco, (x0, y0), m.filter(ImageFilter.GaussianBlur(fade / 3)))


def borda_suave(im, fade=10):
    """máscara com as bordas em degradê (o recorte se mistura ao card do jogo)."""
    w, h = im.size
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((fade, fade, w - fade, h - fade), radius=fade * 2, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(fade / 2))
    im = im.convert('RGBA')
    im.putalpha(m)
    return im


def icone_branco(im):
    """ícone de linha branca sobre fundo escuro -> branco com transparência pela luminância."""
    g = im.convert('L')
    v = sorted(g.tobytes())
    fundo = v[len(v) // 4]
    a = g.point(lambda v: max(0, min(255, int((v - fundo - 25) * 255 / max(1, 230 - fundo)))))
    out = Image.new('RGBA', im.size, (255, 255, 255, 0))
    out.putalpha(a)
    return out


def salvar(im, nome, q=88):
    """q=None = sem perda (lossless)."""
    p = os.path.join(OUT, nome + '.webp')
    if q is None:
        im.save(p, 'WEBP', lossless=True, quality=100, method=6)
    else:
        im.save(p, 'WEBP', quality=q, method=6)
    print(f'{nome:16s} {im.size[0]}x{im.size[1]}  {os.path.getsize(p) // 1024} KB')


def main():
    pasta = sys.argv[1] if len(sys.argv) > 1 else GUARDA
    os.makedirs(GUARDA, exist_ok=True)
    M = {}
    for k, f in ARQ.items():
        src = os.path.join(pasta, f)
        if os.path.abspath(pasta) != os.path.abspath(GUARDA):
            shutil.copy2(src, os.path.join(GUARDA, f))
        M[k] = Image.open(src).convert('RGB')

    # fundo e home em resolução cheia (1672×941), sem perda / quase sem perda: o jogo reduz na hora de desenhar
    salvar(M['bg'], 'menu_bg', None)

    home = M['home'].copy()
    for c in APAGA_HOME:
        apagar(home, c)
    salvar(home, 'menu_home', 95)

    hub = M['hub'].copy()
    for c in APAGA_HUB:
        apagar(hub, c)
    for c, dx, dy in CLONA_HUB:
        clonar(hub, c, dx, dy)
    salvar(hub.crop(HUB_CORTE), 'hub_ciclista', 86)

    for n, c in MODO.items():
        salvar(M['modo'].crop(c), n)
    for n, c in HUB_IC.items():
        salvar(icone_branco(M['hub'].crop(c)), n, 92)
    for n, c in LOJA.items():
        salvar(borda_suave(M['loja'].crop(c)), n, 90)
    for n, c in CONQ.items():
        salvar(borda_suave(M['conq'].crop(c)), n, 90)

    # retratos do hub (escolha do ciclista): ciclistas/<nome>/sprite(s) menu/menu N.png, cortados no conteúdo
    for skin, arq in RETRATOS.items():
        p = os.path.join(RAIZ, 'ciclistas', arq)
        im = Image.open(p).convert('RGBA')
        im = im.crop(im.getbbox())
        salvar(im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS), 'ret_' + skin, 90)

    # cores de fundo dos cards (para o jogo desenhar igual)
    for k, im, xy in [('loja card', M['loja'], (40 + 12, 180 + 12)), ('conq card', M['conq'], (44 + 14, 220 + 14)),
                      ('hub botão', M['hub'], (1100, 500))]:
        print(k, '#%02x%02x%02x' % im.getpixel(xy))


if __name__ == '__main__':
    main()
