# Máscaras por folha 5x2 (50% de resolução, só alfa): p = cor principal do uniforme, s = detalhe, h = capacete,
# w = meias + sapatilhas, b = quadro da bike. Uso: python3 mascaras2.py folha.webp fw fh kit(a|v|b) prefixo
import numpy as np, sys
from PIL import Image
from scipy import ndimage as ndi
folha,fw,fh,kit,pref=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4],sys.argv[5]
im=np.array(Image.open(folha).convert('RGBA')).astype(float)/255
r,g,b,a=im[...,0],im[...,1],im[...,2],im[...,3]
mx=np.maximum(np.maximum(r,g),b);mn=np.minimum(np.minimum(r,g),b);d=mx-mn+1e-6;sat=d/np.maximum(mx,1e-6)
hue=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
op=a>.5
branco=(mx>.62)&(sat<.16)
navy=(hue>200)&(hue<250)&(sat>.3)&(mx>.1)&(mx<.62)
if kit=='a':prim=(hue>195)&(hue<255)&(sat>.35)&(mx>.18);sec=(hue>50)&(hue<110)&(sat>.35)&(mx>.3)
elif kit=='v':prim=((hue>318)|(hue<9))&(sat>.42)&(mx>.12);sec=(hue>34)&(hue<58)&(sat>.5)&(mx>.45)
else:prim=(mx>.55)&(sat<.18);sec=np.zeros_like(op)
M={k:np.zeros_like(op) for k in 'pshwb'}
def comp(mask,cond,minsz=20):
    lab,n=ndi.label(mask,structure=np.ones((3,3)));keep=np.zeros_like(mask)
    for i in range(1,n+1):
        yy,xx=np.where(lab==i)
        if len(yy)>=minsz and cond(yy.mean(),xx.mean()):keep|=lab==i
    return keep
for k in range(10):
    x0,y0=(k%5)*fw,(k//5)*fh;sl=(slice(y0,y0+fh),slice(x0,x0+fw));o=op[sl]
    ys,xs=np.where(o);top,bot=ys.min(),ys.max();H=bot-top;L,Rr=xs.min(),xs.max();Wd=Rr-L
    hz=top+H*.17;kz=top+H*.60;fz=top+H*.62
    M['h'][sl]=comp(branco[sl]&o,lambda y,x:y<top+H*.10,10)&(np.arange(fh)[:,None]<top+H*.15)   # só o casco (dentes e olhos ficam de fora)
    kitpx=(prim[sl]|sec[sl])&o
    if kit=='b':kitpx=prim[sl]&o
    keep=comp(ndi.binary_closing(kitpx,iterations=1),lambda y,x:hz-H*.02<y<kz)
    M['p'][sl]=keep&prim[sl];M['s'][sl]=keep&sec[sl]&~prim[sl] if kit!='b' else False
    if kit=='b':M['p'][sl]&=~M['h'][sl];M['p'][sl]&=~((np.arange(fh)[:,None]<top+H*.32)&(np.arange(fw)[None,:]>L+Wd*.56))   # nada do rosto (cabeça fica na frente, em cima)
    # meias e sapatilhas: branco na metade de baixo, perto do pé de vela (centro horizontal da bike)
    M['w'][sl]=comp(branco[sl]&o,lambda y,x:y>fz and abs(x-(L+Wd*.5))<Wd*.28,8)
    bk=navy[sl]&o
    M['b'][sl]=comp(bk,lambda y,x:y>top+H*.42,30)&~M['p'][sl]
for c,m in M.items():
    m=ndi.binary_dilation(m,iterations=1)&op
    al=Image.fromarray((m*255).astype('uint8')).resize((m.shape[1]//2,m.shape[0]//2),Image.BILINEAR)
    out=Image.new('RGBA',al.size,(255,255,255,0));out.putalpha(al);out.save(f'{pref}_{c}.webp','WEBP',lossless=True)
print(pref,{c:int(m.sum()) for c,m in M.items()})
