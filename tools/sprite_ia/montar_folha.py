#!/usr/bin/env python3
"""Folha de pedalada a partir do VÍDEO do AutoSprite (fundo cinza liso): recorta o fundo (recorte.py, sem as partes
transparentes da remoção de fundo do site), pega UMA volta do pedal, recorta a caixa comum, reduz e monta em grade 5 colunas.
Uso: python3 tools/sprite_ia/montar_folha.py video.mp4 inicio periodo escala saida.webp ['[[cx,cy,r],[cx,cy,r]]']  → imprime o JSON de medidas"""
import sys,os,json,subprocess,tempfile,glob,numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));from recorte import recorta,RODAS_V
vid,ini,per,esc,out=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),float(sys.argv[4]),sys.argv[5]
RODAS=json.loads(sys.argv[6]) if len(sys.argv)>6 else RODAS_V   # pneus no vídeo [[cx,cy,r],[cx,cy,r]]
t=tempfile.mkdtemp();subprocess.run(['ffmpeg','-v','error','-i',vid,os.path.join(t,'f%03d.png')],check=True)
fs=sorted(glob.glob(os.path.join(t,'f*.png')))[ini:ini+per];Q=[recorta(np.array(Image.open(f).convert('RGB')),RODAS) for f in fs]
al=np.max([q[...,3] for q in Q],0);ys,xs=np.where(al>8);x0,y0,x1,y1=xs.min()-2,ys.min()-2,xs.max()+3,ys.max()+3
fw,fh=round((x1-x0)*esc),round((y1-y0)*esc);C=5;L=-(-per//C);sheet=Image.new('RGBA',(fw*C,fh*L),(0,0,0,0))
for i,q in enumerate(Q):sheet.paste(Image.fromarray(q).crop((x0,y0,x1,y1)).resize((fw,fh),Image.LANCZOS),((i%C)*fw,(i//C)*fh))
sheet.save(out,quality=88,method=6)
rod=[[round((cx-x0)*esc,1),round((cy-y0)*esc,1),round(r*esc,1)] for cx,cy,r in RODAS]
print(json.dumps({'fw':fw,'fh':fh,'n':per,'cols':C,'rodas':rod,'kb':os.path.getsize(out)//1000}))
