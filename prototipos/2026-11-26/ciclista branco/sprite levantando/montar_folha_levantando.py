# recorta os quadros do vídeo de fundo preto e monta a folha de transição (mesma grade da folha em pé)
import sys,numpy as np
from PIL import Image
from scipy import ndimage
src,ini,fim,saida=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]
S=180/194.5; FW,FH=314,326; MX_V,BY_V=383,550; MX_S,BY_S=157.5,317
fr=[]
for i in range(ini,fim+1):
    a=np.array(Image.open(f'{src}/f{i:02d}.png').convert('RGB')).astype(float)
    m=a.max(axis=2)
    escuro=m<10
    lab,n=ndimage.label(escuro)
    borda=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
    tam=ndimage.sum(np.ones_like(m),lab,range(1,n+1))
    fundo=np.isin(lab,[k for k in range(1,n+1) if k in borda or tam[k-1]>250])   # fundo + miolo das rodas
    perto=ndimage.binary_dilation(fundo,iterations=2)&~fundo
    al=np.ones_like(m);al[fundo]=0
    al[perto]=np.clip(m[perto]/45,0,1)                                            # borda suave
    c=a.copy();k=perto&(al>0);c[k]=np.clip(a[k]/al[k,None],0,255)                 # desfaz a mistura com o preto
    rgba=np.dstack([c,al*255]).astype(np.uint8)
    im=Image.fromarray(rgba,'RGBA')
    W=round(768*S);im=im.resize((W,W),Image.LANCZOS)
    ox=round(MX_S-MX_V*S);oy=round(BY_S-BY_V*S)
    q=Image.new('RGBA',(FW,FH),(0,0,0,0));q.paste(im,(ox,oy),im);fr.append(q)
folha=Image.new('RGBA',(FW*len(fr),FH),(0,0,0,0))
for j,q in enumerate(fr):folha.paste(q,(j*FW,0))
folha.save(saida,'WEBP',quality=88,method=6)
# conferência em fundo cinza
conf=Image.new('RGBA',folha.size,(120,140,120,255));conf.alpha_composite(folha);conf.convert('RGB').save(saida.replace('.webp','_conf.png'))
print(len(fr),'quadros',folha.size)
