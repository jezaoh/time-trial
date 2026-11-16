import numpy as np, sys
from PIL import Image
def frames(path,fw,fh):
    im=Image.open(path).convert('RGBA');return [im.crop(((k%5)*fw,(k//5)*fh,(k%5+1)*fw,(k//5+1)*fh)) for k in range(10)]
def met(fr):
    a=np.array(fr)[...,3]>100;ys,xs=np.where(a)
    bottom=ys.max();right=xs.max()
    # topo do capacete: menor y nas colunas do terço direito
    cols=a[:, int(right*0.55):right+1];ty=np.where(cols.any(1))[0].min()
    # roda dianteira: linha a 20% da altura da roda acima do chão, pixels mais à direita/esquerda opacos no terço direito
    return dict(bottom=int(bottom),right=int(right),top=int(ty),h=int(bottom-ty))
if __name__=='__main__':
    for k,f in enumerate(frames(sys.argv[1],int(sys.argv[2]),int(sys.argv[3]))):print(k,met(f))
