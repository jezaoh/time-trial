#!/usr/bin/env python3
# Gera o GABARITO da pedalada (12 quadros, folha 4x3 de 362 px, o mesmo formato que o jogo lê) para desenhar por cima.
# Uso: python3 tools/gabarito_pedalada.py docs/gabarito_pedalada_12.png
import math,sys
from PIL import Image,ImageDraw,ImageFont
C=362;K=2;Z=C*K            # desenha em 2x e reduz (linhas lisas)
H=(118,188);BB=(166,300);L=42;T=88;SH=86   # quadril, movimento central, pedivela, coxa, canela (px do quadro)
OMB=(214,118);MAO=(268,192);CAB=(232,82)
def ik(h,a,t,s):   # joelho (para a frente) entre quadril h e tornozelo a
  dx,dy=a[0]-h[0],a[1]-h[1];d=min(math.hypot(dx,dy),t+s-.01);ang=math.atan2(dy,dx);c=(t*t+d*d-s*s)/(2*t*d);b=math.acos(max(-1,min(1,c)))
  return (h[0]+t*math.cos(ang-b),h[1]+t*math.sin(ang-b))
def perna(th):
  p=(BB[0]+L*math.cos(th),BB[1]+L*math.sin(th))          # pedal (bola do pé)
  tor=(p[0]-18,p[1]-12)                                   # tornozelo: atrás e acima do pedal
  return p,tor,ik(H,tor,T,SH)
try:F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',13*K);F2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',10*K)
except:F=F2=ImageFont.load_default()
img=Image.new('RGB',(4*Z,3*Z),'white');d=ImageDraw.Draw(img)
s=lambda q,ox,oy:(ox+q[0]*K,oy+q[1]*K)
for k in range(12):
  ox,oy=(k%4)*Z,(k//4)*Z;th=math.radians(k*30)
  for g in range(0,C,20):d.line([s((g,0),ox,oy),s((g,C),ox,oy)],fill=(238,242,248));d.line([s((0,g),ox,oy),s((C,g),ox,oy)],fill=(238,242,248))
  d.rectangle([ox,oy,ox+Z-1,oy+Z-1],outline=(180,190,205),width=2)
  # referência da bike (só pista): selim, tubo superior, guidão, chão
  d.line([s((96,182),ox,oy),s((138,182),ox,oy)],fill=(170,170,170),width=6*K)
  d.line([s((128,200),ox,oy),s((262,206),ox,oy),s((272,192),ox,oy)],fill=(205,205,205),width=3*K)
  d.line([s((128,200),ox,oy),s(BB,ox,oy)],fill=(205,205,205),width=3*K);d.line([s((262,206),ox,oy),s(BB,ox,oy)],fill=(205,205,205),width=3*K)
  # círculo do pedal (tracejado) e marcas de 30°
  for a in range(0,360,6):
    if a%12<6:d.arc([s((BB[0]-L,BB[1]-L),ox,oy),s((BB[0]+L,BB[1]+L),ox,oy)],a,a+6,fill=(120,150,200),width=2*K)
  for a in range(0,360,30):
    r=math.radians(a);d.line([s((BB[0]+(L-5)*math.cos(r),BB[1]+(L-5)*math.sin(r)),ox,oy),s((BB[0]+(L+5)*math.cos(r),BB[1]+(L+5)*math.sin(r)),ox,oy)],fill=(120,150,200),width=K)
  # perna de TRÁS (esquerda): meia volta de diferença, clara
  pT,tT,jT=perna(th+math.pi)
  d.line([s(BB,ox,oy),s(pT,ox,oy)],fill=(170,170,170),width=4*K)
  for a,b in[(H,jT),(jT,tT),(tT,pT)]:d.line([s(a,ox,oy),s(b,ox,oy)],fill=(150,185,235),width=7*K)
  d.ellipse([s((jT[0]-5,jT[1]-5),ox,oy),s((jT[0]+5,jT[1]+5),ox,oy)],fill=(150,185,235))
  # corpo fixo (igual em todos os quadros)
  d.line([s(H,ox,oy),s(OMB,ox,oy)],fill=(60,60,60),width=8*K);d.line([s(OMB,ox,oy),s(MAO,ox,oy)],fill=(60,60,60),width=5*K)
  d.ellipse([s((CAB[0]-20,CAB[1]-20),ox,oy),s((CAB[0]+20,CAB[1]+20),ox,oy)],outline=(60,60,60),width=4*K)
  # pedivela e perna da FRENTE (direita): escura
  p,t,j=perna(th)
  d.line([s(BB,ox,oy),s(p,ox,oy)],fill=(30,30,30),width=5*K)
  for a,b in[(H,j),(j,t),(t,p)]:d.line([s(a,ox,oy),s(b,ox,oy)],fill=(220,60,40),width=8*K)
  for q,r,c in[(H,7,(30,30,30)),(j,6,(220,60,40)),(BB,6,(30,30,30)),(p,6,(255,200,0))]:d.ellipse([s((q[0]-r,q[1]-r),ox,oy),s((q[0]+r,q[1]+r),ox,oy)],fill=c,outline=(30,30,30),width=K)
  d.text(s((8,6),ox,oy),f'{k+1}',font=F,fill=(30,30,30));d.text(s((8,26),ox,oy),f'pedivela {k*30}°',font=F2,fill=(90,90,90))
  d.text(s((8,C-20),ox,oy),f'perna de trás = quadro {(k+6)%12+1}',font=F2,fill=(110,140,190))
img=img.resize((4*C,3*C),Image.LANCZOS);img.save(sys.argv[1]);print(img.size)
