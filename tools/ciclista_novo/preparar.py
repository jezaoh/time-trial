#!/usr/bin/env python3
"""Ciclista novo em camadas (teste no Contrarrelógio, 17/11): limpa as folhas do dono e mede os pontos.
Entrada: folhas 4×3 (362 px por quadro): pe.webp (em pé), sentado.webp (corpo + perna direita), perna.webp (perna esquerda),
e bike.webp (quadro + peças soltas). Saída: src/assets/imagens/nc_*.webp e src/assets/nc.json (pontos medidos).
Uso: python3 tools/ciclista_novo/preparar.py pasta_das_folhas"""
import sys,json,numpy as np
from PIL import Image
from scipy import ndimage as ndi
E=sys.argv[1].rstrip('/')+'/';OUT='src/assets/imagens/';C=362
def limpa(im):
  a=np.array(im.convert('RGBA'));W,H=a.shape[1],a.shape[0]
  for r in range(H//C):
    for c in range(W//C):
      q=a[r*C:(r+1)*C,c*C:(c+1)*C];m=q[...,3]>140;lab,k=ndi.label(m)
      if not k:continue
      s=ndi.sum(m,lab,range(1,k+1));keep=ndi.binary_dilation(lab==1+int(np.argmax(s)),iterations=2)
      q[...,3]=np.where(keep,q[...,3],0)
  return Image.fromarray(a)
def sapato(q):   # centro do sapato (bolha branca mais baixa) = onde fica o pedal
  r,g,b,al=[q[...,i].astype(int) for i in range(4)];w=(r>190)&(g>190)&(b>190)&(al>200)&(abs(r-b)<40)
  lab,k=ndi.label(w);best=None
  for i in range(1,k+1):
    ys,xs=np.where(lab==i)
    if len(ys)<60:continue
    if best is None or ys.max()>best[0]:best=(ys.max(),xs.mean(),ys.mean()+.25*(ys.max()-ys.mean()))
  return [round(best[1],1),round(best[2],1)]
def luvas(q):
  r,g,b,al=[q[...,i].astype(int) for i in range(4)];d=(r<70)&(g<70)&(b<70)&(al>200);d[:150]=False
  lab,k=ndi.label(d);s=ndi.sum(d,lab,range(1,k+1));ys,xs=np.where(lab==1+int(np.argmax(s)));return [round(xs.mean(),1),round(ys.mean(),1)]
J={}
for nome,arq in [('sent','sentado'),('pe','pe'),('perna','perna')]:
  im=limpa(Image.open(E+arq+'.webp'));im.save(OUT+'nc_'+nome+'.webp',quality=88);a=np.array(im)
  Q=[a[r*C:(r+1)*C,c*C:(c+1)*C] for r in range(3) for c in range(4)]
  J[nome]={'pes':[sapato(q) for q in Q]}
  if nome!='perna':J[nome]['luvas']=[luvas(q) for q in Q]
# bike: peças pelas caixas medidas na folha (px da folha original)
b=Image.open(E+'bike.webp').convert('RGBA')
P={'quadro':(726,199,1925,992),'coroa':(119,501,360,826),'pedivela':(250,276,350,477),'pedal':(97,884,239,979),'cassete':(542,212,727,403),'cambio':(463,461,625,663)}
for k,bx in P.items():b.crop(bx).save(OUT+'nc_'+k+'.webp',quality=90)
J['bike']={'caixa':P,'traseira':[750,898],'dianteira':[1788,925],'mc':[1180,955],'selim':[940,222],'manete':[1840,265],
 'coroa_c':[231,613],'coroa_pedal':[188,798],'pedivela_eixo':[280,455],'pedivela_pedal':[320,305],'pedal_c':[168,931],'cassete_c':[634,307],'cambio_topo':[520,470],'raio_roda':350}
J['quadril_sent']=[110,195]
json.dump(J,open('src/assets/nc.json','w'),indent=1);print(json.dumps({k:J[k] for k in ['sent','pe']})[:900])
