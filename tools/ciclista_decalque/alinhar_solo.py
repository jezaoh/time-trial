#!/usr/bin/env python3
"""Alinha a imagem do ciclista SEM a bike (mesmo desenho da referência) ao enquadramento da referência alinhada.
Uso: python3 tools/ciclista_decalque/alinhar_solo.py teste/ref_ciclista2_alinhada.png teste/ref_so_ciclista.png
Saída: <ref>_so_ciclista.png e _2x.png (o decalque usa para as partes que a bike escondia: bumbum, atrás do joelho...)."""
import sys, cv2, numpy as np
ref = cv2.imread(sys.argv[1], cv2.IMREAD_UNCHANGED); so = cv2.imread(sys.argv[2], cv2.IMREAD_UNCHANGED)
H, W = ref.shape[:2]
def gray(a):
    al = a[..., 3:4] / 255.
    return cv2.GaussianBlur(255 - cv2.cvtColor((a[..., :3] * al + 255 * (1 - al)).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 2)
ys, xs = np.nonzero(so[..., 3] > 100); ys2, xs2 = np.nonzero(ref[:330, :, 3] > 100)
# chute: topo do capacete e costas (x mínimo do tronco) coincidem, escala 1
x_ref = xs2[ys2 > 250].min(); M0 = np.float32([[1, 0, x_ref - xs.min()], [0, 1, ys2.min() - ys.min()]])
mask = np.zeros((H, W), np.uint8); mask[60:330, 520:920] = 255            # cabeça + tronco + braço (iguais nas duas)
G = gray(ref); Mv = gray(cv2.warpAffine(so, M0, (W, H), borderValue=(0, 0, 0, 0)))
cc, Wm = cv2.findTransformECC(G, Mv, np.eye(2, 3, dtype=np.float32), cv2.MOTION_AFFINE,
                              (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6), mask, 5)
M = (np.vstack([cv2.invertAffineTransform(Wm), [0, 0, 1]]) @ np.vstack([M0, [0, 0, 1]]))[:2]
base = sys.argv[1].replace('.png', '')
cv2.imwrite(base + '_so_ciclista.png', cv2.warpAffine(so, M, (W, H), flags=cv2.INTER_CUBIC, borderValue=(0, 0, 0, 0)))
cv2.imwrite(base + '_so_ciclista_2x.png', cv2.warpAffine(so, M * 2, (W * 2, H * 2), flags=cv2.INTER_CUBIC, borderValue=(0, 0, 0, 0)))
print('correlação ECC %.3f' % cc)
