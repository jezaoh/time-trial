import numpy as np, json, colorsys
from PIL import Image
def blend_color(base, mask, rgb):
    # emula globalCompositeOperation='color' (W3C): cor da fonte com a luminosidade do destino
    b = np.array(base).astype(float)/255; m = np.array(mask.resize(base.size, Image.BILINEAR))[..., 3:4].astype(float)/255
    c = np.array(rgb, float)/255
    lum = lambda x: .3*x[..., 0]+.59*x[..., 1]+.11*x[..., 2]
    L = lum(b[..., :3]); d = L - (.3*c[0]+.59*c[1]+.11*c[2]); out = c[None, None, :] + d[..., None]
    l = lum(out); n = out.min(-1); x = out.max(-1)
    out = np.where((n < 0)[..., None], l[..., None]+(out-l[..., None])*l[..., None]/np.maximum(l-n, 1e-6)[..., None], out)
    out = np.where((x > 1)[..., None], l[..., None]+(out-l[..., None])*(1-l[..., None])/np.maximum(x-l, 1e-6)[..., None], out)
    b[..., :3] = b[..., :3]*(1-m) + np.clip(out, 0, 1)*m
    return Image.fromarray((b*255).astype('uint8'))
cores = [None, ((220, 30, 30), (255, 255, 255)), ((20, 150, 60), (255, 215, 0)), ((255, 120, 0), (30, 30, 30)), ((110, 40, 170), (40, 220, 255))]
linhas = []
for n in ['a0', 'a1', 'a2', 'v0', 'v1', 'v2']:
    fw, fh = json.load(open(f'npc_p_{n}.json'))['frame']; sh = Image.open(f'npc_p_{n}.webp').convert('RGBA')
    P = Image.open(f'm_{n}_p.webp'); S = Image.open(f'm_{n}_s.webp')
    k = 3; fr = sh.crop(((k % 5)*fw, (k//5)*fh, (k % 5+1)*fw, (k//5+1)*fh))
    sc = sh.size[0]/P.size[0]
    mp = P.crop(((k % 5)*fw/sc, (k//5)*fh/sc, (k % 5+1)*fw/sc, (k//5+1)*fh/sc)); ms = S.crop(((k % 5)*fw/sc, (k//5)*fh/sc, (k % 5+1)*fw/sc, (k//5+1)*fh/sc))
    row = Image.new('RGBA', (5*280, 300), (143, 227, 255, 255))
    for j, c in enumerate(cores):
        f = fr if c is None else blend_color(blend_color(fr, mp, c[0]), ms, c[1])
        row.alpha_composite(f, (j*280+5, 300-fh))
    linhas.append(row)
out = Image.new('RGB', (5*280, 300*6)); [out.paste(r, (0, i*300)) for i, r in enumerate(linhas)]
out.resize((5*280*2//3, 300*6*2//3)).save('previa_uniformes.png')
