import numpy as np, colorsys
from PIL import Image
def frames(path,fw,fh):
    im=Image.open(path).convert('RGBA');return [im.crop(((k%5)*fw,(k//5)*fh,(k%5+1)*fw,(k//5+1)*fh)) for k in range(10)]
def recolor(fr,rgb,y0=.17,y1=.80):
    a=np.array(fr).astype(float);H,W=a.shape[:2];r,g,b,al=[a[...,i]/255 for i in range(4)]
    mx=np.maximum(np.maximum(r,g),b);mn=np.minimum(np.minimum(r,g),b);sat=(mx-mn)/np.maximum(mx,1e-3)
    ys,xs=np.where(al>.5);top,bot=ys.min(),ys.max();h=bot-top
    yy=np.arange(H)[:,None]*np.ones((1,W))
    # roupa: tons claros e sem cor, entre o queixo e a canela (exclui capacete, meias e sapatos)
    m=(sat<.16)&(mx>.45)&(al>.3)&(yy>top+h*y0)&(yy<top+h*y1)
    # não pinta a caramanhola e o quadro (área da bike: metade de baixo, perto do centro)
    tr,tg,tb=[c/255 for c in rgb];L=mx  # luminância do branco original vira a luz da cor nova
    for i,t in enumerate((tr,tg,tb)):
        a[...,i]=np.where(m,np.clip(L*t*1.15+ (L-0.85).clip(0)*0.9,0,1)*255,a[...,i])
    return Image.fromarray(a.astype('uint8'))
cores={'original':None,'vermelho':(200,30,40),'preto':(40,40,48),'amarelo':(245,190,20),'azul':(30,90,200),'verde':(30,160,70)}
src='/home/claude/time-trial-v2/src/assets/imagens/'
out=Image.new('RGBA',(267*6,310*2+20),(143,227,255,255))
for j,(nome,c) in enumerate(cores.items()):
    for i,(sh,fw,fh) in enumerate([('p_b0',267,310),('p_b3',274,314)]):
        f=frames(src+sh+'.webp',fw,fh)[2];f=f if c is None else recolor(f,c);out.alpha_composite(f,(j*267,i*(310+20)))
out.save('teste_cores.png')
