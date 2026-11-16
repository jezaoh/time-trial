# Converte folhas 5×2 de pedalada no padrão do jogo, alinhando pela BIKE (não pela caixa da imagem):
#  - escala da folha: comprimento da bike rente ao chão (roda traseira → dianteira) = 263 px (igual aos sprites atuais)
#  - cada quadro: centro da bike (média das duas rodas) fixo e chão na última linha do quadro (evita tremor)
#  - o que passa à esquerda (linhas de velocidade) vira uma margem dx, compensada no desenho (META.pedalDx)
# Uso: python3 prep_folhas.py origem.png saida.webp   → imprime {"frame":[w,h],"dx":n}
import numpy as np, json, sys
from PIL import Image
from scipy import ndimage as ndi
REF_LEN, REF_LEFT = 263, 1
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA'); A = np.array(im)[..., 3]; H, W = A.shape
ph = (A > 60).sum(1); ym = H//2-60 + int(np.argmin(ph[H//2-60:H//2+60]))
cells = []
for y0, y1 in [(0, ym), (ym, H)]:
    pc = (A[y0:y1] > 60).sum(0); cx = [0]
    vazias = np.where(pc == 0)[0]                       # colunas totalmente transparentes (vãos reais entre quadros)
    for c in range(1, 5):
        g = int(c*W/5); perto = vazias[np.abs(vazias-g) < 130]
        cx.append(int(perto[np.argmin(np.abs(perto-g))]) if len(perto) else g-50 + int(np.argmin(pc[g-50:g+50])))
    cx.append(W)
    for c in range(5): cells.append((cx[c], y0, cx[c+1], y1))
frames = []
for box in cells:
    c = np.array(im.crop(box)); m = c[..., 3] > 25
    lab, k = ndi.label(ndi.binary_dilation(m, iterations=3)); sizes = ndi.sum(m, lab, range(1, k+1))
    big = 1+int(np.argmax(sizes)); keep = np.zeros_like(m)
    for i, s in enumerate(sizes, 1):
        if i == big or s > 150: keep |= lab == i
    c[..., 3] = np.where(keep, c[..., 3], 0); ys, xs = np.where(c[..., 3] > 25)
    fr = Image.fromarray(c).crop((xs.min(), ys.min(), xs.max()+1, ys.max()+1))
    a = np.array(fr)[..., 3] > 120; yy, xx = np.where(a); b, t = yy.max(), yy.min()
    band = a[int(b-(b-t)*.22):b+1]; cols = np.where(band.any(0))[0]
    frames.append((fr, cols.min(), cols.max(), b))
lens = [r-l for _, l, r, _ in frames]; s = REF_LEN/np.median(lens)
placed = []
for fr, l, r, b in frames:
    w2, h2 = round(fr.width*s), round(fr.height*s); fr2 = fr.resize((w2, h2), Image.LANCZOS)
    placed.append((fr2, round(REF_LEFT + REF_LEN/2 - (l+r)/2*s), -round(b*s)))   # centro da bike fixo; y relativo ao chão (chão = 0)
dx = max(0, -min(x for _, x, _ in placed))
fw = max(x+dx+f.width for f, x, _ in placed); fh = max(-y for _, _, y in placed)+1
sheet = Image.new('RGBA', (fw*5, fh*2))
for k, (f, x, y) in enumerate(placed):
    cell = Image.new('RGBA', (fw, fh)); cell.alpha_composite(f, (x+dx, fh-1+y)); sheet.alpha_composite(cell, ((k % 5)*fw, (k//5)*fh))
sheet.save(out, 'WEBP', quality=82, method=6)
print(json.dumps({'frame': [fw, fh], 'dx': dx, 'escala': round(float(s), 4), 'comprimentos': [int(v) for v in lens]}))
