#!/usr/bin/env python3
"""Mede decalque x referência por parte (quadro 0).
Uso: python3 tools/ciclista_decalque/medir.py REF_ALINHADA.png PASTA (PASTA tem rotulos.npy, partes.json e os PNGs do medir_render.js)
Colunas: cobertura = IoU entre a silhueta desenhada da parte e a região dela na referência;
ΔE = diferença média de cor (CIELAB) dentro da região, com o ciclista inteiro desenhado; >10 = % de pixels com ΔE > 10."""
import sys, json, cv2, numpy as np
ref = cv2.imread(sys.argv[1], cv2.IMREAD_UNCHANGED); D = sys.argv[2]
rot = np.load(D + '/rotulos.npy'); PARTES = json.load(open(D + '/partes.json'))
cinza = np.array([128, 128, 128], np.float32)
def sobre(a):
    al = a[..., 3:4] / 255.; return (a[..., :3] * al + cinza * (1 - al)).astype(np.uint8)
R = cv2.cvtColor(sobre(ref), cv2.COLOR_BGR2LAB).astype(np.float32)
T = cv2.cvtColor(sobre(cv2.imread(D + '/tudo.png', cv2.IMREAD_UNCHANGED)), cv2.COLOR_BGR2LAB).astype(np.float32)
# Lab do OpenCV em 8 bits: L*255/100, a,b +128 -> volta para escala real
def real(L): L = L.copy(); L[..., 0] *= 100 / 255.; L[..., 1:] -= 128; return L
dE = np.linalg.norm(real(R) - real(T), axis=-1)
linhas = []
for i, p in enumerate(PARTES):
    if p in ('pe_tras', 'perna_tras'): continue
    m = rot == i
    if m.sum() == 0: continue
    a = cv2.imread(f'{D}/{p}.png', cv2.IMREAD_UNCHANGED)[..., 3] > 127
    iou = (a & m).sum() / max(1, (a | m).sum())
    linhas.append((p, int(m.sum()), 100 * iou, float(dE[m].mean()), 100 * float((dE[m] > 10).mean())))
linhas.sort(key=lambda l: l[3] + (100 - l[2]) * .5, reverse=True)
print(f"{'parte':10} {'px':>6} {'cobert.':>8} {'ΔE':>6} {'>10':>6}")
for l in linhas: print(f'{l[0]:10} {l[1]:6d} {l[2]:7.1f}% {l[3]:6.1f} {l[4]:5.1f}%')
m = rot >= 0
print(f"{'TOTAL':10} {int(m.sum()):6d} {'':8} {dE[m].mean():6.1f} {100 * (dE[m] > 10).mean():5.1f}%")
# mapa de calor da diferença
h = cv2.applyColorMap(np.clip(dE * 6, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO); h[~(rot >= 0)] = 0
cv2.imwrite(D + '/calor.png', h)
