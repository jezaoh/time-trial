# mede, em cada quadro já no padrão do jogo, a bike rente ao chão: borda esquerda (roda traseira), direita (roda dianteira) e chão
import numpy as np,sys
from PIL import Image
def quadros(path,fw,fh):
    im=Image.open(path).convert('RGBA');return [im.crop(((k%5)*fw,(k//5)*fh,(k%5+1)*fw,(k//5+1)*fh)) for k in range(10)]
def bike(fr,frac=.22):
    a=np.array(fr)[...,3]>120;ys,xs=np.where(a);b=ys.max();t=ys.min();band=a[int(b-(b-t)*frac):b+1]
    cols=np.where(band.any(0))[0];return cols.min(),cols.max(),b
if __name__=='__main__':
    for k,f in enumerate(quadros(sys.argv[1],int(sys.argv[2]),int(sys.argv[3]))):l,r,b=bike(f);print(k,'esq',l,'dir',r,'chão',b,'compr',r-l)
