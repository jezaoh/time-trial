import sys,numpy as np
from PIL import Image
from scipy import ndimage as ndi
RODAS_V=[(206.4,551.3,106.9),(548.0,550.3,106.0)]   # pneus no vídeo de 768 px
def recorta(a,rodas=RODAS_V):
  a=a.astype(float);borda=np.concatenate([a[:6].reshape(-1,3),a[-6:].reshape(-1,3),a[:,:6].reshape(-1,3),a[:,-6:].reshape(-1,3)]);bg=np.median(borda,0)
  d=np.sqrt(((a-bg)**2).sum(2));sat=a.max(2)-a.min(2)
  cand=(d<16)&(sat<10)                                   # cinza do fundo (neutro e perto do 158)
  lab,k=ndi.label(cand);H,W=cand.shape
  borda_lab=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
  area=ndi.sum(cand,lab,range(1,k+1));dm=ndi.mean(d,lab,range(1,k+1))
  fundo=np.zeros_like(cand)
  for i in range(1,k+1):
    if i in borda_lab or (area[i-1]>90 and dm[i-1]<11):fundo|=lab==i
  # dentro das rodas: todo cinza neutro do fundo é fundo (os raios são escuros e ficam)
  yy0,xx0=np.mgrid[0:H,0:W]
  for cx,cy,r in rodas:fundo|=cand&(np.hypot(xx0-cx,yy0-cy)<r*.88)
  # sombra no chão (cinza mais escuro, embaixo): também é fundo
  lum=a.mean(2);yy=np.arange(H)[:,None];fundo|=(sat<10)&(lum<bg.mean()+4)&(lum>bg.mean()-55)&(yy>H*.83)
  # halo: cinza um pouco mais escuro colado no fundo também sai (2 passes)
  for _ in range(2):fundo|=(d<26)&(sat<12)&ndi.binary_dilation(fundo)
  # borda suave: 1 px de transição, cor desmisturada
  al=1-ndi.uniform_filter(fundo.astype(float),3);al=np.where(fundo&(al<.5),0,al)
  rgb=np.clip(np.where(al[...,None]>0,(a-bg*(1-al[...,None]))/np.maximum(al[...,None],1e-3),0),0,255)
  return np.dstack([rgb,al*255]).astype(np.uint8)
if __name__=='__main__':
  S=sys.argv[1];im=Image.fromarray(recorta(np.array(Image.open(S+'/vidB/f011.png').convert('RGB'))))
  im.save(S+'/vidB/k2.png')
  o=Image.new('RGB',(1536,768))
  for i,cor in enumerate([(255,0,255,255),(124,189,51,255)]):
    b=Image.new('RGBA',im.size,cor);b.alpha_composite(im);o.paste(b.convert('RGB'),(768*i,0))
  o.resize((1152,576)).save(S+'/vidB/key2.png')
