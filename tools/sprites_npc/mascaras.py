# Máscaras de uniforme (camisa) para trocar a cor dos ciclistas no jogo.
# Para cada folha: máscara da cor principal e da cor de detalhe, em 50% da resolução, como imagem branca com alfa.
# Uso: python3 mascaras.py folha.webp largura altura kit(a|v) saida_prefixo
import numpy as np, sys
from PIL import Image
from scipy import ndimage as ndi
folha, fw, fh, kit, pref = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
im = np.array(Image.open(folha).convert('RGBA')).astype(float)/255
r, g, b, a = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); d = mx-mn+1e-6
sat = d/np.maximum(mx, 1e-6)
hue = np.where(mx == r, ((g-b)/d) % 6, np.where(mx == g, (b-r)/d+2, (r-g)/d+4))*60
if kit == 'a':   # azul + verde-limão
    prim = (hue > 195) & (hue < 255) & (sat > .35) & (mx > .18)
    sec = (hue > 50) & (hue < 110) & (sat > .35) & (mx > .3)
else:            # vinho + dourado (cuidado com a pele marrom: matiz 15–30)
    prim = ((hue > 318) | (hue < 9)) & (sat > .42) & (mx > .12)
    sec = (hue > 34) & (hue < 58) & (sat > .5) & (mx > .45)
op = a > .5
P = np.zeros_like(a, bool); S = np.zeros_like(a, bool)
for k in range(10):
    x0, y0 = (k % 5)*fw, (k//5)*fh; sl = (slice(y0, y0+fh), slice(x0, x0+fw))
    ys, xs = np.where(op[sl]); top, bot = ys.min(), ys.max(); hgt = bot-top
    lim = top + hgt*.56                                 # metade de cima do corpo (camisa); o quadro da bike fica abaixo
    kit_px = (prim[sl] | sec[sl]) & op[sl]
    lab, n = ndi.label(ndi.binary_closing(kit_px, iterations=1), structure=np.ones((3, 3)))
    keep = np.zeros_like(kit_px)
    for i in range(1, n+1):
        yy, xx = np.where(lab == i)
        if len(yy) >= 25 and yy.mean() < lim: keep |= lab == i
    P[sl] = keep & prim[sl]; S[sl] = keep & sec[sl]
def salva(m, nome):
    m = ndi.binary_dilation(m, iterations=1) & op       # cobre a borda antisserrilhada
    al = Image.fromarray((m*255).astype('uint8')).resize((m.shape[1]//2, m.shape[0]//2), Image.BILINEAR)
    out = Image.new('RGBA', al.size, (255, 255, 255, 0)); out.putalpha(al); out.save(nome, 'WEBP', lossless=True)
salva(P, pref+'_p.webp'); salva(S, pref+'_s.webp')
print(pref, 'principal', int(P.sum()), 'detalhe', int(S.sum()))
