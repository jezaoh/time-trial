#!/usr/bin/env python3
"""Alinha uma referência nova (PNG com transparência) ao enquadramento da referência antiga, para reaproveitar
as articulações e sementes medidas em decalque.py.
Uso: python3 tools/ciclista_decalque/alinhar.py teste/ref_ciclista.jpg teste/ref_ciclista2.png teste/ref_ciclista2_alinhada.png [teste/ref_bike.png ...]
Chute inicial pelos eixos das rodas; refino com ECC (afim) do OpenCV sobre o desenho das linhas."""
import sys, cv2, numpy as np
old = cv2.imread(sys.argv[1]); new = cv2.imread(sys.argv[2], cv2.IMREAD_UNCHANGED)
hsv = cv2.cvtColor(old, cv2.COLOR_BGR2HSV).astype(int)
bg = (hsv[..., 1] > 55) & (hsv[..., 0] > 80) & (hsv[..., 0] < 150) & (hsv[..., 2] > 40)
go = cv2.cvtColor(old, cv2.COLOR_BGR2GRAY).astype(np.float32); go[bg] = 255
ref = cv2.GaussianBlur(255 - go, (0, 0), 2)
al = new[..., 3:4] / 255.; comp = (new[..., :3] * al + 255 * (1 - al)).astype(np.uint8)
mov = cv2.GaussianBlur(255 - cv2.cvtColor(comp, cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 3)
s = 380 / 600.; M0 = np.float32([[s, 0, 517 - 472 * s], [0, s, 587 - 812 * s]])   # eixos velho -> novo (medidos)
crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6)
cc, W = cv2.findTransformECC(ref, mov, cv2.invertAffineTransform(M0).astype(np.float32), cv2.MOTION_AFFINE, crit, None, 5)
M = cv2.invertAffineTransform(W)
out = cv2.warpAffine(new, M, (old.shape[1], old.shape[0]), flags=cv2.INTER_AREA, borderValue=(0, 0, 0, 0))
cv2.imwrite(sys.argv[3], out)
# versão 2x (mesmo enquadramento, o dobro de pixels): o decalque tira traço e cor dela
M2 = M * 2
out2 = cv2.warpAffine(new, M2, (old.shape[1] * 2, old.shape[0] * 2), flags=cv2.INTER_AREA, borderValue=(0, 0, 0, 0))
cv2.imwrite(sys.argv[3].replace('.png', '_2x.png'), out2)
print('correlação ECC %.3f' % cc)
# imagens extras no MESMO enquadramento da referência nova (ex.: a bike sem o ciclista): mesma transformação
for extra in sys.argv[4:]:
    e = cv2.imread(extra, cv2.IMREAD_UNCHANGED)
    base = sys.argv[3].replace('.png', '')
    nome = base + '_' + extra.split('/')[-1].replace('.png', '')
    cv2.imwrite(nome + '.png', cv2.warpAffine(e, M, (old.shape[1], old.shape[0]), flags=cv2.INTER_AREA, borderValue=(0, 0, 0, 0)))
    cv2.imwrite(nome + '_2x.png', cv2.warpAffine(e, M * 2, (old.shape[1] * 2, old.shape[0] * 2), flags=cv2.INTER_AREA, borderValue=(0, 0, 0, 0)))
    print('extra:', nome)
