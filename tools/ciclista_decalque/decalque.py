#!/usr/bin/env python3
"""Decalque da referência do ciclista em partes vetoriais (Path2D) para o teste teste/ciclista_decalque.html.

Uso: python3 tools/ciclista_decalque/decalque.py teste/ref_ciclista2_alinhada.png teste/decalque_dados.js [pasta_debug]
(a referência PNG nova é alinhada antes por alinhar.py; a JPG antiga também funciona)

Método:
 1. fundo = pixels saturados azul/roxo/verde-água (céu e chão da referência) -> transparente;
 2. cada parte recebe sementes (polilinhas em coordenadas da referência) e o watershed do OpenCV
    espalha as sementes até as bordas (os contornos pretos separam as regiões);
 3. pares que continuam sem contorno entre si (coxa/canela no joelho, braço/antebraço, tronco/coxa)
    são cortados por linhas nas articulações;
 4. pixel de contorno (escuro) fica com a parte MAIS DA FRENTE que encosta nele (o contorno é de quem está na frente);
 5. cada parte é quantizada em camadas de cor (paleta global, k-means) e cada camada vira contorno
    vetorial (findContours em 3x, suavizado, approxPolyDP) -> string SVG para Path2D.
Coordenadas de saída = pixels da referência (1376x768).
"""
import sys, json, cv2, numpy as np

REF, SAIDA = sys.argv[1], sys.argv[2]
DBG = sys.argv[3] if len(sys.argv) > 3 else None
im = cv2.imread(REF, cv2.IMREAD_UNCHANGED); Hh, Ww = im.shape[:2]
ALFA = None
if im.ndim == 3 and im.shape[2] == 4:      # PNG com transparência (ref. nova, alinhada por alinhar.py): o alfa é o fundo
    ALFA = im[..., 3]; im = (im[..., :3] * (ALFA[..., None] / 255.)).astype(np.uint8)   # borda sobre preto = contorno
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(int)
H, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]

# ---------------- articulações (medidas na referência) ----------------
J = {
 'eixoT': (517, 587), 'eixoD': (897, 587), 'mov': (677, 613), 'pedal': (682, 556),
 'quadril': (600, 322), 'joelho': (738, 383), 'tornozelo': (668, 478),
 'ombro': (752, 228), 'cotovelo': (790, 315), 'punho': (838, 360), 'pescoco': (790, 205),
}
RODA = 127

# ---------------- partes (ordem = de trás para a frente) ----------------
PARTES = ['roda_t', 'roda_d', 'pe_tras', 'perna_tras', 'quadro', 'coroa', 'canela', 'sapatilha', 'coxa', 'tronco', 'cabeca',
          'braco', 'antebraco', 'luva']
Z = {p: i for i, p in enumerate(PARTES)}

def arco(c, r, a0, a1, n=40):
    return [(c[0] + r * np.cos(np.radians(a)), c[1] + r * np.sin(np.radians(a))) for a in np.linspace(a0, a1, n)]

SEM = {   # polilinhas de semente
 'roda_t': [arco(J['eixoT'], 121, 95, 330), arco(J['eixoT'], 108, 100, 320), [J['eixoT'], (505, 590)],
            arco(J['eixoT'], 80, 110, 300), arco(J['eixoT'], 60, 120, 200)],
 'roda_d': [arco(J['eixoD'], 121, -95, 175), arco(J['eixoD'], 108, -80, 170), [(897, 600), (897, 620)],
            arco(J['eixoD'], 80, -60, 160)],
 'pe_tras': [[(712, 646), (735, 648)], [(700, 660), (704, 668)]],
 'perna_tras': [[(612, 410), (632, 448)], [(688, 480), (692, 540)], [(600, 400), (640, 420)]],
 'quadro': [[(610, 440), (830, 414)], [(835, 448), (700, 590)], [(530, 590), (630, 606)], [(527, 576), (595, 452)],
            [(845, 445), (890, 580)], [(565, 360), (590, 430)], [(530, 348), (590, 350)], [(805, 382), (845, 377)],
            [(890, 385), (872, 432)], [(918, 362), (925, 372)], [(930, 400), (935, 410)], [(505, 630), (522, 642)],
            [(722, 510), (736, 524)], [(500, 600), (507, 610)], [(545, 556), (630, 562)], [(535, 645), (630, 650)]],
 'coroa': [arco(J['mov'], 30, 0, 360), arco(J['mov'], 14, 0, 360)],
 'canela': [[(735, 395), (712, 425), (690, 450)], [(726, 388), (699, 419), (678, 450)], [(752, 398), (727, 430), (700, 460)],
            [(675, 460), (668, 466)], [(745, 385), (735, 410)]],
 'sapatilha': [[(645, 500), (680, 545)], [(632, 480), (640, 500)]],
 'coxa': [[(640, 335), (725, 372)], [(700, 350), (745, 375)], [(620, 345), (680, 380)], [(650, 352), (690, 372)],
          [(690, 340), (700, 378)], [(745, 365), (758, 378)]],
 'tronco': [[(600, 260), (740, 200)], [(570, 320), (600, 290)], [(650, 300), (700, 260)], [(560, 340), (585, 345)]],
 'cabeca': [[(790, 120), (830, 110)], [(800, 160), (815, 200)], [(820, 150), (840, 150)], [(785, 205), (800, 215)],
            [(765, 172), (785, 195)], [(775, 165), (790, 185)]],
 'braco': [[(760, 250), (785, 300)], [(745, 245), (775, 255)]],
 'antebraco': [[(800, 325), (830, 352)]],
 'luva': [[(850, 370), (870, 380)], [(860, 360), (880, 375)]],
}

# ---------------- fundo ----------------
fundo = (S > 55) & (H > 80) & (H < 150) & (V > 40)
sujeito = ~fundo
yy, xx = np.mgrid[0:Hh, 0:Ww]
if ALFA is not None:
    sujeito = ALFA > 100
else:
    # só o que encosta no ciclista/bike (tira riscos do chão); dentro das rodas fica tudo
    n, lab, st, _ = cv2.connectedComponentsWithStats(sujeito.astype(np.uint8), 8)
    maior = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    yy, xx = np.mgrid[0:Hh, 0:Ww]
    dentro_rodas = ((xx - J['eixoT'][0]) ** 2 + (yy - J['eixoT'][1]) ** 2 < (RODA + 4) ** 2) | \
                   ((xx - J['eixoD'][0]) ** 2 + (yy - J['eixoD'][1]) ** 2 < (RODA + 4) ** 2)
    sujeito = (lab == maior) | (sujeito & dentro_rodas)
    # contorno misturado com o céu (azulado e escuro) volta a ser do ciclista: anel de 3 px em volta do sujeito
    anel = cv2.dilate(sujeito.astype(np.uint8), np.ones((7, 7))) > 0
    sujeito = sujeito | (anel & (V < 95))
fundo = ~sujeito
escuro = (V < 80) & sujeito

# ---------------- watershed ----------------
mk = np.zeros((Hh, Ww), np.int32)
mk[cv2.erode(fundo.astype(np.uint8), np.ones((3, 3))) > 0] = 1   # 1 = fundo
for p, pls in SEM.items():
    for pl in pls:
        cv2.polylines(mk, [np.int32(np.round(pl))], False, 2 + Z[p], 3)
ws = cv2.watershed(cv2.GaussianBlur(im, (3, 3), 0), mk.copy())
ws[ws == -1] = 0
# preenche as linhas -1 com o vizinho
for _ in range(2):
    z = ws == 0
    if not z.any(): break
    dil = cv2.dilate(ws.astype(np.float32), np.ones((3, 3))).astype(np.int32)
    ws[z] = dil[z]
parte = ws - 2               # -1 = fundo
parte[~sujeito] = -1
parte[sujeito & (parte < 0)] = Z['quadro']

# ---------------- cortes nas articulações ----------------
def lado(p0, p1, x, y):   # >0 à esquerda do vetor p0->p1
    return (p1[0] - p0[0]) * (y - p0[1]) - (p1[1] - p0[1]) * (x - p0[0])
def corta(a, b, cut0, cut1, quem_pos):
    """pixels rotulados a ou b: lado positivo da linha cut0->cut1 vira quem_pos, o outro vira o outro."""
    m = (parte == Z[a]) | (parte == Z[b])
    pos = lado(cut0, cut1, xx, yy) > 0
    outro = b if quem_pos == a else a
    parte[m & pos] = Z[quem_pos]; parte[m & ~pos] = Z[outro]
def perp(c, a, b, L=60):  # linha por c perpendicular a a->b
    d = np.array(b, float) - np.array(a, float); d /= np.linalg.norm(d); n = np.array([-d[1], d[0]])
    return tuple(np.array(c) - n * L), tuple(np.array(c) + n * L)
# joelho: entre coxa e canela, perpendicular ao meio dos dois ossos
k0, k1 = perp(J['joelho'], J['quadril'], J['tornozelo'], 50)
s = lado(k0, k1, *J['quadril']); corta('coxa', 'canela', k0, k1, 'coxa' if s > 0 else 'canela')
# joelho redondo: o disco em volta da articulação fica com a coxa (desenhada por cima) -> a ponta não vira espinho ao girar
disco = (xx - J['joelho'][0]) ** 2 + (yy - J['joelho'][1]) ** 2 < 27 ** 2
parte[disco & (parte == Z['canela'])] = Z['coxa']
# cotovelo
e0, e1 = perp(J['cotovelo'], J['ombro'], J['punho'], 40)
s = lado(e0, e1, *J['ombro']); corta('braco', 'antebraco', e0, e1, 'braco' if s > 0 else 'antebraco')
disco = (xx - J['cotovelo'][0]) ** 2 + (yy - J['cotovelo'][1]) ** 2 < 19 ** 2
parte[disco & (parte == Z['antebraco'])] = Z['braco']
# quadril: coxa x tronco. A coxa é o que fica do lado do joelho da linha pelo quadril perpendicular à coxa,
# e também um círculo em volta do quadril (tampa redonda: a coxa gira sem abrir buraco).
h0, h1 = perp(J['quadril'], J['quadril'], J['joelho'], 70)
s = lado(h0, h1, *J['joelho'])
m = (parte == Z['coxa']) | (parte == Z['tronco'])
ladoJ = (lado(h0, h1, xx, yy) > 0) == (s > 0)
tampa = (xx - J['quadril'][0]) ** 2 + (yy - J['quadril'][1]) ** 2 < 36 ** 2
abaixo_cint = yy > 300     # a camisa não desce para a coxa
parte[m & (ladoJ | tampa) & abaixo_cint & (xx > 560)] = Z['coxa']
parte[m & ~((ladoJ | tampa) & abaixo_cint & (xx > 560))] = Z['tronco']

# ---------------- contorno escuro fica com quem está na frente ----------------
zz = parte.copy().astype(np.int32); zz[zz < 0] = -1
frente = cv2.dilate(zz.astype(np.float32), np.ones((7, 7))).astype(np.int32)
linha_fina = escuro & (cv2.erode(escuro.astype(np.uint8), np.ones((9, 9))) == 0)   # não mexe em áreas escuras grandes
parte[linha_fina & (frente >= 0)] = frente[linha_fina & (frente >= 0)]
# rodas/coroa: só ficam com o que está no disco delas
for r, e, rr in (('roda_t', 'eixoT', RODA + 3), ('roda_d', 'eixoD', RODA + 3), ('coroa', 'mov', 41)):
    fora = ((xx - J[e][0]) ** 2 + (yy - J[e][1]) ** 2) > rr ** 2
    parte[(parte == Z[r]) & fora] = Z['quadro']

# restos de perna dentro do quadro (pele, ou qualquer coisa na zona da perna fora dos tubos) -> perna de trás (não desenhada)
def dist_seg(a, b):
    a = np.array(a, float); b = np.array(b, float); d = b - a
    t = np.clip(((xx - a[0]) * d[0] + (yy - a[1]) * d[1]) / (d @ d), 0, 1)
    return np.hypot(xx - (a[0] + t * d[0]), yy - (a[1] + t * d[1]))
pele = (H >= 4) & (H <= 22) & (S > 60) & (V > 90)
tubos = (dist_seg((612, 436), (800, 422)) < 13) | (dist_seg((845, 450), (680, 610)) < 22) | \
        ((xx > 703) & (xx < 750) & (yy > 495) & (yy < 548))
zona = (xx > 630) & (xx < 765) & (yy > 380) & (yy < 575)
resto = (parte == Z['quadro']) & ((pele & (yy > 330) & (xx < 800)) | (zona & ~tubos))
# pele que sobrou no quadro perto da mão (nós dos dedos) é da luva
parte[(parte == Z['quadro']) & pele & (xx >= 800) & (yy < 420)] = Z['luva']
na_canela = dist_seg(J['joelho'], J['tornozelo']) < 22
parte[resto & na_canela] = Z['canela']
parte[resto & ~na_canela] = Z['perna_tras']

# peças da perna da frente só perto do osso (contornos de tubo que vazaram voltam para o quadro)
for nome, a_, b_, r_ in (('canela', 'joelho', 'tornozelo', 27), ('coxa', 'quadril', 'joelho', 56)):  # o disco do joelho (r 27) fica dentro
    longe = (parte == Z[nome]) & (dist_seg(J[a_], J[b_]) > r_)
    parte[longe & tubos] = Z['quadro']; parte[longe & ~tubos] = Z['perna_tras']
# braço: camisa longe do osso fica no tronco
parte[(parte == Z['braco']) & (dist_seg(J['ombro'], J['cotovelo']) > 24) & (yy < 270)] = Z['tronco']

# membros: só o pedaço principal (lascas finas giram junto e aparecem como espinhos)
for nome in ('canela', 'coxa', 'sapatilha', 'braco', 'antebraco'):
    m = (parte == Z[nome]).astype(np.uint8)
    k_ = 5 if nome in ('coxa', 'canela') else 3       # fios de contorno pendurados (3-4 px) somem
    ab = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_, k_)))
    n_, lb_, st_, _ = cv2.connectedComponentsWithStats(ab, 8)
    if n_ < 2: continue
    fica = lb_ == (1 + np.argmax(st_[1:, cv2.CC_STAT_AREA]))
    fica = cv2.morphologyEx(fica.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)) > 0
    sai = (m > 0) & ~fica
    parte[sai & tubos] = Z['quadro']; parte[sai & ~tubos] = Z['perna_tras' if nome in ('canela', 'coxa', 'sapatilha') else 'tronco']
    parte[fica & (parte != Z[nome]) & (parte >= Z['canela']) & (parte < Z['tronco'])] = parte[fica & (parte != Z[nome]) & (parte >= Z['canela']) & (parte < Z['tronco'])]

# pneu: o anel do pneu que ficou com o quadro (atrás da coroa/sapatilha) volta para a roda
for r, e in (('roda_t', 'eixoT'), ('roda_d', 'eixoD')):
    dd2 = np.sqrt((xx - J[e][0]) ** 2 + (yy - J[e][1]) ** 2)
    branco_q = cv2.dilate(((parte == Z['quadro']) & (V > 150)).astype(np.uint8), np.ones((9, 9))) > 0   # garfo/tubos que cruzam o pneu
    parte[(parte == Z['quadro']) & (dd2 > RODA - 28) & (dd2 < RODA + 4) & (V < 130) & ~branco_q] = Z[r]
    # miolo da roda: fica só o escuro (riscos de giro), some o chuvisco claro
    parte[(parte == Z[r]) & (dd2 > 45) & (dd2 < RODA - 16) & (V > 85)] = -1
    parte[(parte == Z[r]) & (dd2 > 45) & (V > 110)] = -1

# rodas: o pneu é desenhado em código (anel liso, medido abaixo); do decalque fica só o miolo que gira (cubo, disco, cassete)
for r, e in (('roda_t', 'eixoT'), ('roda_d', 'eixoD')):
    dd2 = np.sqrt((xx - J[e][0]) ** 2 + (yy - J[e][1]) ** 2)
    parte[(parte == Z[r]) & (dd2 > 46)] = -1
# braço do pedivela da referência dentro do decalque da coroa: aponta para o pé de baixo (que não é desenhado).
# Direção = média dos pixels escuros do 'pé de trás' logo fora da coroa; o braço some do decalque (o código desenha os pedivelas).
dm = np.hypot(xx - J['mov'][0], yy - J['mov'][1])
anel_pe = (parte == Z['pe_tras']) & (dm > 38) & (dm < 70) & (V < 90)
if anel_pe.sum() > 20:
    ang_pe = np.arctan2((yy[anel_pe] - J['mov'][1]).mean(), (xx[anel_pe] - J['mov'][0]).mean())
    fim = (J['mov'][0] + 42 * np.cos(ang_pe), J['mov'][1] + 42 * np.sin(ang_pe))
    braco_ref = (parte == Z['coroa']) & (dist_seg(J['mov'], fim) < 9) & (dm > 9)
    parte[braco_ref] = -1
    print('braço do pedivela da ref: %.0f°, %d px tirados' % (np.degrees(ang_pe), braco_ref.sum()))
# restos claros do pé de baixo da referência (ficaram no quadro) -> fora
caixa_pe = (xx > 690) & (xx < 760) & (yy > 625) & (yy < 680)
parte[caixa_pe & (parte == Z['quadro'])] = -1   # pedal e sapato de baixo da ref (o código desenha os nossos)

# ---------------- paleta ----------------
lab3 = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
sel = sujeito.reshape(-1)
K = 14
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, .5)
_, lb, cen = cv2.kmeans(lab3[sel][::3], K, None, crit, 3, cv2.KMEANS_PP_CENTERS)
d = ((lab3[:, None, :] - cen[None]) ** 2).sum(-1)
cls = d.argmin(1).reshape(Hh, Ww)
cls = cv2.medianBlur(cls.astype(np.uint8), 3).astype(int)
CEN_V = [cv2.cvtColor(np.uint8([[c]]), cv2.COLOR_LAB2BGR)[0, 0].max() for c in np.clip(cen, 0, 255).astype(np.uint8)]
# todos os tons escuros viram UMA camada de linha (traço contínuo, sem pontilhado)
ESC_IDS = [c for c in range(K) if CEN_V[c] < 52]
if ESC_IDS: cls[np.isin(cls, ESC_IDS)] = ESC_IDS[0]

def papel(p, rgb, x, y):
    """que cor do kit esta camada representa (para trocar o kit)."""
    r, g, b = rgb; h, s, v = cv2.cvtColor(np.uint8([[rgb[::-1]]]), cv2.COLOR_BGR2HSV)[0, 0]
    if v < 70: return None                                     # contorno/preto: fixo
    pele = (5 <= h <= 22 and s > 60)
    if p in ('coxa', 'canela', 'braco', 'antebraco', 'tronco', 'cabeca') and pele: return 'pele'
    claro = s < 50 and v > 85
    if not claro: return None
    if p == 'cabeca': return 'capacete' if y < 150 else None
    if p == 'tronco': return 'camisa'          # o JS divide camisa/bermuda pela linha da cintura
    if p == 'coxa': return 'bermuda'
    if p == 'braco': return 'camisa'
    if p == 'canela': return 'meia'
    if p == 'sapatilha': return 'sapatilha'
    if p in ('quadro',): return 'quadro'
    return None

# ---------------- vetorização (na versão 2x, se existir) ----------------
import os
HI = REF.replace('.png', '_2x.png')
F = 1
imH = im
if REF.endswith('.png') and os.path.exists(HI):
    a4 = cv2.imread(HI, cv2.IMREAD_UNCHANGED); F = a4.shape[1] // Ww
    imH = (a4[..., :3] * (a4[..., 3:4] / 255.)).astype(np.uint8)
    alfaH = a4[..., 3]
else:
    alfaH = np.where(sujeito, 255, 0).astype(np.uint8)
labH = cv2.cvtColor(imH, cv2.COLOR_BGR2LAB).astype(np.float32)
best = np.full(imH.shape[:2], 1e12, np.float32); clsH = np.zeros(imH.shape[:2], np.uint8)
for c in range(K):
    dc = ((labH - cen[c]) ** 2).sum(-1); m = dc < best; best[m] = dc[m]; clsH[m] = c
clsH = cv2.medianBlur(clsH, 5).astype(int)
cinzaH = cv2.cvtColor(imH, cv2.COLOR_BGR2GRAY)
# traço ADAPTATIVO: linha = quase preto, ou bem mais escuro que a vizinhança. Enchimento escuro (luva, pneu, coroa,
# fita do guidão) não vira traço só por ser escuro.
vizH = cv2.medianBlur(cinzaH, 2 * (7 * F) + 1).astype(np.float32)
LIM_H = np.minimum(np.maximum(72., 72. + (vizH - 150.) * .3), np.maximum(34., vizH - 20.))   # limite por pixel (sobe em área clara: pega a borda antialiasada)
linhaH = cinzaH < LIM_H
# borda da silhueta (perto do transparente) também é traço: contorno externo nítido, sem halo claro por fora
distT = cv2.distanceTransform((alfaH > 100).astype(np.uint8), cv2.DIST_L2, 3)
bordaH = (alfaH > 40) & (distT < 2.2 * F)
ESC = 2            # superamostragem extra na hora de achar os contornos
LINHA = '#17171b'

def vetor(mask_hi, thr=.5, area_min=4, suave=1.0, src=None):
    """máscara (0..1, resolução F) -> string SVG em coordenadas da referência."""
    big = cv2.resize(mask_hi.astype(np.float32) if src is None else src, None, fx=ESC, fy=ESC, interpolation=cv2.INTER_CUBIC)
    if suave: big = cv2.GaussianBlur(big, (0, 0), suave)
    bm = (big > thr).astype(np.uint8)
    cs, _ = cv2.findContours(bm, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    dd = []
    for ct in cs:
        if cv2.contourArea(ct) < area_min * ESC * ESC * F * F: continue
        ap = cv2.approxPolyDP(ct, .8, True).reshape(-1, 2) / (ESC * F)
        if len(ap) < 3: continue
        dd.append('M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in ap) + 'Z')
    return ''.join(dd)

EMENDA = {'coxa': ('tronco', 'canela'), 'canela': ('coxa', 'sapatilha'), 'sapatilha': ('canela',),
          'braco': ('tronco', 'antebraco'), 'antebraco': ('braco', 'luva')}
dados = {'J': J, 'R': RODA, 'tam': [Ww, Hh], 'partes': {}}
# juntas: a peça de baixo (canela/antebraço) ganha o disco inteiro da junta; a de cima (coxa/braço) fica só com a metade
# do lado dela. Assim, ao dobrar diferente da referência, não sobra arco de contorno sobre a outra peça nem abre buraco.
def lado_junta(jc, a_, b_):
    ua = np.array(J[a_], float) - J[jc]; ub = np.array(J[b_], float) - J[jc]
    u = ub / np.linalg.norm(ub) - ua / np.linalg.norm(ua); u /= np.linalg.norm(u)
    return ((xx - J[jc][0]) * u[0] + (yy - J[jc][1]) * u[1]) > 0           # True = lado da peça de baixo
JUNTAS = {('joelho', 'quadril', 'tornozelo', 27, 'coxa', 'canela'), ('cotovelo', 'ombro', 'punho', 19, 'braco', 'antebraco')}
MASCARA = {}
for jc, a_, b_, r_, cima, baixo in JUNTAS:
    # fora do disco: cada pixel da dupla fica com a peça do lado dele da linha da junta (tira lascas da dobra)
    par = (parte == Z[cima]) | (parte == Z[baixo])
    ld = lado_junta(jc, a_, b_); fora = np.hypot(xx - J[jc][0], yy - J[jc][1]) >= r_
    perto = np.hypot(xx - J[jc][0], yy - J[jc][1]) < r_ * 2.2
    parte[par & fora & perto & ld] = Z[baixo]; parte[par & fora & perto & ~ld] = Z[cima]
    disco = (np.hypot(xx - J[jc][0], yy - J[jc][1]) < r_) & ((parte == Z[cima]) | (parte == Z[baixo]))
    meia = disco & lado_junta(jc, a_, b_)
    # frente da junta (patela/ponta do cotovelo) = contrário da bissetriz (que aponta para a dobra)
    ua = np.array(J[a_], float) - J[jc]; ub = np.array(J[b_], float) - J[jc]
    bis = ua / np.linalg.norm(ua) + ub / np.linalg.norm(ub); bis /= np.linalg.norm(bis)
    frente = ((xx - J[jc][0]) * -bis[0] + (yy - J[jc][1]) * -bis[1]) > 4
    MASCARA[baixo] = (parte == Z[baixo]) | (disco & (meia | frente))   # a parte de trás do disco ficaria saindo como lasca
    MASCARA[cima] = (parte == Z[cima]) & ~meia
for p in PARTES:
    mp = MASCARA.get(p, parte == Z[p])
    if mp.sum() < 20: continue
    mpH = cv2.resize(mp.astype(np.uint8), None, fx=F, fy=F, interpolation=cv2.INTER_NEAREST) > 0
    escH = linhaH
    # paleta PRÓPRIA da parte (k-means só nos pixels dela): tons pequenos (nós dos dedos) não se perdem na paleta global
    sel_ = mpH & ~escH & (alfaH > 200)
    clsP = np.full(mpH.shape, -1, np.int32)
    if sel_.sum() > 50:
        kp = int(min(7, max(2, sel_.sum() // (300 * F * F))))
        _, _, cenP = cv2.kmeans(labH[sel_][::2].astype(np.float32), kp, None, crit, 3, cv2.KMEANS_PP_CENTERS)
        ys_, xs_ = np.nonzero(mpH)
        dP = ((labH[ys_, xs_][:, None, :] - cenP[None]) ** 2).sum(-1)
        clsP[ys_, xs_] = dP.argmin(1)
        tmp = (clsP + 1).astype(np.uint8); tmp = cv2.medianBlur(tmp, 5); clsP = np.where(mpH, tmp.astype(np.int32) - 1, -1)
        # transição do antialias junto do traço (cinza a meio caminho) -> cor de enchimento mais próxima
        perto = (cv2.dilate(escH.astype(np.uint8), np.ones((5, 5))) > 0) & ~escH & mpH
        conhec = (mpH & ~perto & ~escH & (clsP >= 0)).astype(np.uint8)
        if conhec.any() and perto.any():
            _, lbl = cv2.distanceTransformWithLabels(1 - conhec, cv2.DIST_L2, 3, labelType=cv2.DIST_LABEL_PIXEL)
            ys0, xs0 = np.nonzero(conhec)
            cls_por_lbl = np.zeros(lbl.max() + 1, np.int32) - 1
            cls_por_lbl[lbl[ys0, xs0]] = clsP[ys0, xs0]
            clsP[perto] = cls_por_lbl[lbl[perto]]
    clsH_ = clsH; clsH = clsP
    claros = [c for c in range(7) if (mpH & (clsH == c) & ~escH).sum() > 4 * F * F]   # pequenas contam (nós dos dedos)
    claros.sort(key=lambda c: -(mpH & (clsH == c)).sum())
    mpH5 = cv2.dilate(mpH.astype(np.uint8), np.ones((5, 5))) > 0
    camadas = []
    # base: silhueta inteira na cor mais comum (fecha frestas)
    if claros:
        px = imH[mpH & (clsH == claros[0]) & ~escH]; bgr = np.median(px, 0); rgb = tuple(int(v) for v in bgr[::-1])
    else:
        rgb = (23, 23, 27)
    camadas.append({'c': '#%02x%02x%02x' % rgb, 'p': papel(p, rgb, *np.mean(np.nonzero(mp)[::-1], 1)), 'd': vetor(mpH, .5, 1, 1.2)})
    for c in claros[1:]:
        mm = mpH & (clsH == c) & ~escH
        # 1-2 px além da parte, na própria cor: cobre a fresta da emenda sem pintar a vizinha de outra cor
        mm = (cv2.dilate(mm.astype(np.uint8), np.ones((5, 5))) > 0) & mpH5 & (alfaH > 100)
        px = imH[mpH & (clsH == c) & ~escH]; bgr = np.median(px, 0); rgb = tuple(int(v) for v in bgr[::-1])
        cy, cx = np.mean(np.nonzero(mm), 1) / F
        d = vetor(mm, .5, 3, 1.0)
        if d: camadas.append({'c': '#%02x%02x%02x' % rgb, 'p': papel(p, rgb, cx, cy), 'd': d})
    # traço: direto do tom de cinza (contínuo, sem k-means), dentro da parte
    # 'escuridão relativa' ao limite local: >0.5 = traço (contorno suave, alcança a borda antialiasada)
    src = np.where(mpH5 & (alfaH > 40), .5 + (LIM_H - cinzaH.astype(np.float32)) / 40., 0)
    src = np.where(mpH5 & bordaH, np.maximum(src, 1.), src)
    # membros: contorno próprio em toda a borda da peça, menos na emenda com a peça vizinha (quadril, joelho, cotovelo...)
    # -> a peça girada (e a perna de trás, que é cópia) nunca fica sem contorno onde a referência encostava em outra coisa
    if p in EMENDA:
        viz = np.zeros_like(mpH)
        for q in EMENDA[p]: viz |= cv2.resize(MASCARA.get(q, parte == Z[q]).astype(np.uint8), None, fx=F, fy=F, interpolation=cv2.INTER_NEAREST) > 0
        viz = cv2.dilate(viz.astype(np.uint8), np.ones((5, 5))) > 0
        anelP = (cv2.dilate(mpH.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * F + 3, 2 * F + 3))) > 0) & ~viz
        anelP &= ~(cv2.erode(mpH.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * F + 1, 2 * F + 1))) > 0)
        src = np.where(anelP, np.maximum(src, 1.), src)
    d = vetor(None, .5, 3, .6, src=src)
    if d: camadas.append({'c': LINHA, 'p': None, 'd': d})
    dados['partes'][p] = {'z': Z[p], 'cam': camadas}
    clsH = clsH_

# divide camisa/bermuda no tronco por clip (feito no JS com a linha da cintura)
dados['cintura'] = [(540, 272), (700, 310)]
# pneus: elipses ajustadas nas bordas externa e interna de cada pneu (a arte não é um círculo perfeito: raio 125-131).
# O pneu dianteiro não é concêntrico com o cubo na arte (~7 px). O JS desenha as faixas interpolando entre as duas elipses.
def elipses_pneu(c):
    ex, inn = [], []
    for ag in np.arange(0, 360, 2):
        rr = np.arange(95, 140, .25); x = c[0] + rr * np.cos(np.radians(ag)); y = c[1] + rr * np.sin(np.radians(ag))
        v = alfaH[(y * F).astype(int).clip(0, alfaH.shape[0] - 1), (x * F).astype(int).clip(0, alfaH.shape[1] - 1)] > 128
        idx = np.nonzero(v)[0]
        if len(idx) < 10: continue
        seg = np.split(idx, np.nonzero(np.diff(idx) > 1)[0] + 1)[0]
        if len(seg) < 40 or len(seg) > 130: continue          # bloqueado por tubo/sapato: ignora o raio
        ex.append((x[seg[-1]], y[seg[-1]])); inn.append((x[seg[0]], y[seg[0]]))
    def el(P):
        P = np.float32(P)
        for _ in range(3):                                    # tira os pontos que fogem (encostos)
            (cx, cy), (w, h), ang = cv2.fitEllipse(P)
            t = np.radians(ang); dx = P[:, 0] - cx; dy = P[:, 1] - cy
            u = (dx * np.cos(t) + dy * np.sin(t)) / (w / 2); v_ = (-dx * np.sin(t) + dy * np.cos(t)) / (h / 2)
            res = np.abs(np.hypot(u, v_) - 1) * (w + h) / 4
            P = P[res < max(1.2, np.percentile(res, 75))]
        (cx, cy), (w, h), ang = cv2.fitEllipse(P)
        return [round(float(cx), 2), round(float(cy), 2), round(float(w) / 2, 2), round(float(h) / 2, 2), round(float(np.radians(ang)), 4)]
    e, i = el(ex), el(inn)
    # mesma elipse tem várias formas (ângulo ±180°, eixos trocados com ±90°): deixa a interna perto da externa p/ interpolar
    best = None
    for k in range(-2, 3):
        for troca in (0, 1):
            ang = i[4] + k * np.pi / 2
            if (k % 2 == 1) != bool(troca): continue
            ax, ay = (i[3], i[2]) if troca else (i[2], i[3])
            d = abs(ang - e[4])
            if best is None or d < best[0]: best = (d, [i[0], i[1], ax, ay, round(float(ang), 4)])
    return {'ext': e, 'int': best[1]}
dados['pneu'] = {'T': elipses_pneu((517.5, 587.0)), 'D': elipses_pneu((889.8, 587.2))}
print('pneus:', dados['pneu'])
def cor_med(m):
    bgr = np.median(im[m], 0); return '#%02x%02x%02x' % tuple(int(v) for v in bgr[::-1])
mq = parte == Z['quadro']
dados['cores'] = {
 'quadro': cor_med(mq & (V > 200) & (S < 40)), 'quadroS': cor_med(mq & (V > 120) & (V < 190) & (S < 50)),
 'pneu': cor_med((parte == Z['roda_t']) & (V > 45) & (V < 85)), 'coroa': cor_med((parte == Z['coroa']) & (V > 30) & (V < 70)),
}
open(SAIDA, 'w').write('// gerado por tools/ciclista_decalque/decalque.py — não editar à mão\nconst DECAL=' +
                       json.dumps(dados, separators=(',', ':')) + ';\n')
print('partes:', {p: (len(v['cam']), int((parte == Z[p]).sum())) for p, v in dados['partes'].items()})
print('tamanho:', len(open(SAIDA).read()) // 1024, 'KB')

if DBG:
    np.save(DBG + '/rotulos.npy', parte.astype(np.int8)); json.dump(PARTES, open(DBG + '/partes.json', 'w'))
    cores = np.random.RandomState(3).randint(40, 255, (len(PARTES), 3))
    vis = (im * .35).astype(np.uint8)
    for p in PARTES:
        m = parte == Z[p]; vis[m] = (im[m] * .45 + cores[Z[p]] * .55).astype(np.uint8)
        ys, xs = np.nonzero(m)
        if len(xs): cv2.putText(vis, p, (int(np.median(xs)) - 20, int(np.median(ys))), 0, .45, (255, 255, 255), 1)
    for p, pls in SEM.items():
        for pl in pls: cv2.polylines(vis, [np.int32(np.round(pl))], False, (255, 255, 255), 1)
    for k, v in J.items(): cv2.circle(vis, v, 4, (0, 0, 255), -1)
    cv2.imwrite(DBG + '/partes.png', cv2.resize(vis[60:730, 380:1040], None, fx=1.4, fy=1.4))
