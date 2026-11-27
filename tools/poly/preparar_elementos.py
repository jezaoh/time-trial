"""Prepara os elementos low poly do dono (pasta elementos/ e logo novo/) para o poly.
Saída: prototipos/2026-11-26/elementos/*.webp e prototipos/2026-11-26/sons/{macaco,buzina,caminhao,moeda}.mp3
Rodar da raiz do repositório:  python3 tools/poly/preparar_elementos.py"""
import os, subprocess, shutil, colorsys
from PIL import Image
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EL = os.path.join(RAIZ, 'elementos'); OUT = os.path.join(RAIZ, 'prototipos/2026-11-26/elementos')
SONS = os.path.join(RAIZ, 'prototipos/2026-11-26/sons')
os.makedirs(OUT, exist_ok=True)

def apara(im):
    return im.crop(im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox())

def salva(im, nome, alt=None, larg=None):
    im = apara(im)
    if alt: im = im.resize((round(im.width * alt / im.height), alt), Image.LANCZOS)
    if larg: im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, nome + '.webp'), quality=88, method=6)
    print(nome, im.size)

def garrafas(arq, nome):
    im = Image.open(os.path.join(EL, arq)).convert('RGBA'); a = im.getchannel('A').load()
    cols = [any(a[x, y] > 8 for y in range(0, im.height, 2)) for x in range(im.width)]
    tr, x = [], 0
    while x < im.width:
        if cols[x]:
            x0 = x
            while x < im.width and cols[x]: x += 1
            if x - x0 > 30: tr.append((x0, x))
        x += 1
    assert len(tr) == 6, (arq, tr)
    for i, (x0, x1) in enumerate(tr):           # da esquerda: cheia (5 goles) → vazia (0)
        salva(im.crop((x0, 0, x1, im.height)), f'{nome}_{5 - i}', alt=160)

garrafas('água low poly.png', 'agua'); garrafas('isotonico low poly.png', 'iso')
salva(Image.open(os.path.join(EL, 'banana low poly.png')).convert('RGBA'), 'banana', alt=160)
gel = Image.open(os.path.join(EL, 'gel-low poly.png')).convert('RGBA'); salva(gel, 'gel', alt=160)
# gel azul: o mesmo gel com o laranja virado para azul (até ter arte própria)
px = gel.load()
for y in range(gel.height):
    for x in range(gel.width):
        r, g, b, a = px[x, y]
        if a:
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > .25: h = (h + .53) % 1
            r, g, b = (round(c * 255) for c in colorsys.hsv_to_rgb(h, s, v)); px[x, y] = (r, g, b, a)
salva(gel, 'azul', alt=160)
salva(Image.open(os.path.join(EL, 'macaco.png')).convert('RGBA'), 'macaco', alt=320)
salva(Image.open(os.path.join(EL, 'caminhão banana.png')).convert('RGBA'), 'caminhao', larg=900)
salva(Image.open(os.path.join(EL, 'furgão low poly.png')).convert('RGBA'), 'furgao', larg=900)
salva(Image.open(os.path.join(RAIZ, 'logo novo/logo novo time trial.png')).convert('RGBA'), 'logo', larg=1400)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(RAIZ, 'sound/mixkit-monkey-excited-screech-105.wav'),
                '-ac', '1', '-b:a', '96k', os.path.join(SONS, 'macaco.mp3')], check=True)
for s in ('buzina', 'caminhao', 'moeda'):
    shutil.copy(os.path.join(RAIZ, 'src/assets/sons', s + '.mp3'), os.path.join(SONS, s + '.mp3'))
print('ok')
