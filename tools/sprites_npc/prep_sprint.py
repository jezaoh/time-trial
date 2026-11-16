# Prepara a folha "03-ciclista bravo em pé sprintando" (5×2) no mesmo padrão dos p_b*.webp:
# escala pela altura chão→capacete do sprite "bravo" (p_b1) e alinha roda dianteira + chão; as linhas de velocidade
# ficam numa margem extra à esquerda (dx), compensada no desenho.
import numpy as np, json, sys
from PIL import Image
from scipy import ndimage as ndi
src, out, ref_w, ref_h, ref_right, ref_bottom, ref_hgt = sys.argv[1], sys.argv[2], 267, 310, 264, 309, 308
im = Image.open(src).convert('RGBA'); A = np.array(im)[..., 3]; H, W = A.shape
# divisão em 2 linhas: linha horizontal com menos pixels opacos perto do meio
ph = (A > 60).sum(1); ym = H//2-60 + int(np.argmin(ph[H//2-60:H//2+60]))
cells = []
for y0, y1 in [(0, ym), (ym, H)]:
    pc = (A[y0:y1] > 60).sum(0); cx = [0]
    for c in range(1, 5):   # cortes: coluna com menos pixels perto de c·W/5
        g = int(c*W/5); cx.append(g-50 + int(np.argmin(pc[g-50:g+50])))
    cx.append(W)
    for c in range(5): cells.append((cx[c], y0, cx[c+1], y1))
frames = []
for box in cells:
    c = np.array(im.crop(box)); m = c[..., 3] > 25
    lab, k = ndi.label(ndi.binary_dilation(m, iterations=3)); sizes = ndi.sum(m, lab, range(1, k+1))
    big = 1+int(np.argmax(sizes)); keep = np.zeros_like(m)
    for i, s in enumerate(sizes, 1):                     # mantém o ciclista e as linhas de velocidade (componentes razoáveis)
        if i == big or s > 150: keep |= lab == i
    c[..., 3] = np.where(keep, c[..., 3], 0); ys, xs = np.where(c[..., 3] > 25)
    fr = Image.fromarray(c).crop((xs.min(), ys.min(), xs.max()+1, ys.max()+1)); a = np.array(fr)[..., 3] > 100
    yy, xx = np.where(a); bottom, right = yy.max(), xx.max()
    top = np.where(a[:, int(right*0.55):right+1].any(1))[0].min()    # topo do capacete (terço direito, sem as linhas)
    frames.append((fr, bottom, right, top))
hs = [b-t for _, b, _, t in frames]; s = ref_hgt/np.median(hs)
print('alturas', hs, 'escala', round(s, 4))
placed = []
for fr, b, r, t in frames:
    w2, h2 = round(fr.width*s), round(fr.height*s); fr2 = fr.resize((w2, h2), Image.LANCZOS)
    x = ref_right - round(r*s); y = ref_bottom - round(b*s)        # posição do canto sup. esq. na célula de referência
    placed.append((fr2, x, y))
dx = max(0, -min(x for _, x, _ in placed)); dy = max(0, -min(y for _, _, y in placed))
fw, fh = ref_w+dx, ref_h+dy
sheet = Image.new('RGBA', (fw*5, fh*2))
for k, (fr2, x, y) in enumerate(placed):
    cell = Image.new('RGBA', (fw, fh)); cell.alpha_composite(fr2, (x+dx, y+dy)) if x+dx >= 0 else None
    sheet.alpha_composite(cell, ((k % 5)*fw, (k//5)*fh))
sheet.save(out, 'WEBP', quality=82, method=6)
print(json.dumps({'frame': [fw, fh], 'dx': dx}))
