#!/usr/bin/env python3
"""Peças soltas da bike (imagem da bike desmontada + roda) em vetor, para girarem limpas no teste do ciclista.

Uso: python3 tools/ciclista_decalque/pecas.py teste/ref_bike_pecas.png teste/ref_roda.webp teste/decalque_pecas.js

Cada peça: recorte na imagem, escala para o tamanho da arte do ciclista (unidade = px da referência alinhada), pivô
(eixo de giro) e pontos de encaixe medidos. Sai em camadas de cor + camada de traço (mesmo método do decalque.py),
com coordenadas relativas ao pivô.
"""
import sys, json, cv2, numpy as np

PEC, RODA, SAIDA = sys.argv[1:4]
A = cv2.imread(PEC, cv2.IMREAD_UNCHANGED); W = cv2.imread(RODA, cv2.IMREAD_UNCHANGED)
F = 4            # resolução de trabalho: 4 px por px da arte

# nome: (imagem, recorte x0,y0,x1,y1 na imagem, pivô (x,y) na imagem, escala imagem->arte, outros pontos)
PECAS = {
 # coroa + pedivela (lado de fora): pivô = centro da coroa; furo do pedal na ponta do braço
 'coroa':   (A, (115, 504, 374, 848), (115 + 126.4, 504 + 137.0), 42.1 / 124.4, {'pedal': (115 + 76, 504 + 310)}),
 # pedivela solto (o de trás): pivô = eixo do movimento; furo do pedal na outra ponta
 'braco':   (A, (248, 274, 363, 492), (248 + 37, 274 + 176), None, {'pedal': (248 + 76, 274 + 34)}),
 'pedal':   (A, (290, 141, 448, 251), (290 + 22, 141 + 56), .30, {'ponta': (290 + 150, 141 + 92)}),
 'cassete': (A, (545, 209, 753, 411), (545 + 101.0, 209 + 103.6), 30.0 / 93.3, {}),
 'disco':   (W, (510, 520, 730, 740), (620.0, 630.05), 30.0 / 107.5, {}),
}

def comprimento(p):
    a, b = np.array(p[2]), np.array(p[4]['pedal']); return float(np.hypot(*(b - a)))
L_PED = comprimento(PECAS['coroa']) * PECAS['coroa'][3]           # pedivela da coroa, em px da arte
br = PECAS['braco']; PECAS['braco'] = (br[0], br[1], br[2], L_PED / comprimento(br), br[4])   # o de trás = mesmo comprimento

def vetor(m, thr=.5, area_min=3, suave=1.0):
    big = cv2.GaussianBlur(m.astype(np.float32), (0, 0), suave) if suave else m.astype(np.float32)
    cs, _ = cv2.findContours((big > thr).astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []
    for ct in cs:
        if cv2.contourArea(ct) < area_min * F * F: continue
        ap = cv2.approxPolyDP(ct, .6, True).reshape(-1, 2)
        if len(ap) < 3: continue
        out.append(ap)
    return out

crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, .5)
dados = {}
for nome, (img, (x0, y0, x1, y1), piv, esc, pts) in PECAS.items():
    rec = img[y0:y1, x0:x1]
    k = esc * F
    rec = cv2.resize(rec, None, fx=k, fy=k, interpolation=cv2.INTER_AREA if k < 1 else cv2.INTER_CUBIC)
    al = rec[..., 3]; rgb = (rec[..., :3] * (al[..., None] / 255.)).astype(np.uint8)
    if nome == 'disco':     # só o disco: corta no raio externo (os raios da roda ficam de fora)
        yy, xx = np.mgrid[0:al.shape[0], 0:al.shape[1]]
        c = ((piv[0] - x0) * k, (piv[1] - y0) * k)
        al = np.where(np.hypot(xx - c[0], yy - c[1]) < 107.8 * k, al, 0).astype(np.uint8)
    mask = al > 100
    cinza = cv2.cvtColor(rgb, cv2.COLOR_BGR2GRAY)
    viz = cv2.medianBlur(cinza, 2 * (3 * F) + 1).astype(np.float32)
    lim = np.minimum(np.maximum(60., 60. + (viz - 150.) * .3), np.maximum(30., viz - 22.))
    linha = (cinza < lim) & mask
    lab = cv2.cvtColor(rgb, cv2.COLOR_BGR2LAB).astype(np.float32)
    sel = mask & ~linha & (al > 200)
    kp = int(min(7, max(2, sel.sum() // (250 * F * F))))
    _, _, cen = cv2.kmeans(lab[sel][::2], kp, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    ys, xs = np.nonzero(mask)
    cls = np.full(mask.shape, -1, np.int32)
    cls[ys, xs] = ((lab[ys, xs][:, None, :] - cen[None]) ** 2).sum(-1).argmin(1)
    cls = np.where(mask, cv2.medianBlur((cls + 1).astype(np.uint8), 5).astype(np.int32) - 1, -1)
    ordem = sorted(range(kp), key=lambda c: -(cls == c).sum())
    def cor(m):
        b = np.median(rgb[m], 0); return '#%02x%02x%02x' % tuple(int(v) for v in b[::-1])
    cams = []
    cams.append((cor(mask & (cls == ordem[0]) & ~linha), vetor(mask, .5, 1, 1.2)))     # base: silhueta inteira
    for c in ordem[1:]:
        m = mask & (cls == c) & ~linha
        if m.sum() < 8 * F * F: continue
        mm = (cv2.dilate(m.astype(np.uint8), np.ones((5, 5))) > 0) & mask
        cams.append((cor(m), vetor(mm, .5, 4, 1.4)))
    # traço: escuridão relativa + borda da silhueta (contorno contínuo)
    src = np.where(mask, .5 + (lim - cinza.astype(np.float32)) / 40., 0)
    borda = mask & ~(cv2.erode(mask.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * F + 1, 2 * F + 1))) > 0)
    src = np.where(borda, np.maximum(src, 1.), src)
    cams.append(('#141416', vetor(None, .5, 2, 1.4) if False else []))
    big = cv2.GaussianBlur(src.astype(np.float32), (0, 0), 1.4)
    cs, _ = cv2.findContours((big > .5).astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    cams[-1] = ('#141416', [cv2.approxPolyDP(ct, .6, True).reshape(-1, 2) for ct in cs if cv2.contourArea(ct) >= 2 * F * F])
    # coordenadas: px da arte, relativas ao pivô
    px, py = (piv[0] - x0) * k, (piv[1] - y0) * k
    def svg(polys):
        return ''.join('M' + ' L'.join(f'{(x - px) / F:.2f} {(y - py) / F:.2f}' for x, y in p) + 'Z' for p in polys if len(p) >= 3)
    camadas = [{'c': c, 'd': svg(p)} for c, p in cams if p]
    rel = {n: [round((q[0] - piv[0]) * esc, 2), round((q[1] - piv[1]) * esc, 2)] for n, q in pts.items()}
    dados[nome] = {'cam': camadas, 'pts': rel}
    print(nome, 'escala %.3f' % esc, 'camadas', len(camadas), rel)
dados['L_PED'] = round(L_PED, 2)
open(SAIDA, 'w').write('// gerado por tools/ciclista_decalque/pecas.py — não editar à mão\nconst DPECAS=' +
                       json.dumps(dados, separators=(',', ':')) + ';\n')
print('L_PED %.1f  tamanho %d KB' % (L_PED, len(open(SAIDA).read()) // 1024))
