#!/usr/bin/env python3
"""Gera UM unico arquivo HTML (imagens e sons embutidos em base64) a partir de src/.

Uso:
  python3 tools/montar_arquivo_unico.py                         # ranking desligado (igual ao jogo-final)
  python3 tools/montar_arquivo_unico.py --rank-api "/?rest_route=/timetrial/v1"   # versao para o WordPress
  python3 tools/montar_arquivo_unico.py --saida meu_jogo.html

Requer apenas Python 3. O resultado funciona abrindo o arquivo direto no navegador (inclusive som).
"""
import argparse, base64, json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(AQUI, '..', 'src')

ap = argparse.ArgumentParser()
ap.add_argument('--rank-api', default='', help="URL base da API do ranking; vazio = ranking desligado")
ap.add_argument('--saida', default=os.path.join(AQUI, '..', 'time_trial_montado.html'))
a = ap.parse_args()

def ler(p): return open(os.path.join(SRC, p), encoding='utf-8').read()

html = ler('index.html')
css = ler('css/style.css').rstrip('\n')
# fontes embutidas (url(../assets/fontes/X.ttf) -> data URI)
css = re.sub(r"url\(\.\./assets/fontes/([^)]+)\)", lambda m: 'url(data:font/ttf;base64,' + base64.b64encode(open(os.path.join(SRC, 'assets', 'fontes', m.group(1)), 'rb').read()).decode() + ')', css)
# 17/11: o CSS (com as fontes, ~480 KB) vai DEPOIS da tela de carregamento (<!--CSS-->), para ela aparecer logo no início do download
html = html.replace('<link rel="stylesheet" href="css/style.css">', '')
html = html.replace('<!--CSS-->', '<style>\n' + css + '\n</style>') if '<!--CSS-->' in html else html.replace('</head>', '<style>\n' + css + '\n</style>\n</head>')
# carimbo de versão (data e hora da montagem, horário de Brasília) em VERSAO
import datetime
VERSAO = (datetime.datetime.utcnow() - datetime.timedelta(hours=3)).strftime('%d/%m/%Y %H:%M')

# assets embutidos (substituem js/assets.js)
meta = json.load(open(os.path.join(SRC, 'assets', 'meta.json')))
def b64(p, mime): return f'data:{mime};base64,' + base64.b64encode(open(os.path.join(SRC, p), 'rb').read()).decode()
trecho = ler('js/assets.js')
nomes_img = re.findall(r'"([^"]+)": "assets/imagens/', trecho)
nomes_snd = re.findall(r'"([^"]+)": "assets/sons/', trecho)
SRCD = {n: b64(f'assets/imagens/{n}.webp', 'image/webp') for n in nomes_img}
SNDD = {n: b64(f'assets/sons/{n}.mp3', 'audio/mpeg') for n in nomes_snd}
assets_js = 'const SRC=' + json.dumps(SRCD) + ';const SND=' + json.dumps(SNDD) + ';\nconst META=' + json.dumps(meta) + ';\n'

# junta todos os scripts na ordem do index.html num unico <script> (mesmo escopo global do original)
ordem = re.findall(r'<script src="(js/[^"]+)"></script>', html)
partes = []
for p in ordem:
    partes.append(assets_js if p == 'js/assets.js' else ler(p))
js = '\n'.join(partes)
js = js.replace("const RANK_API='';", 'const RANK_API=' + json.dumps(a.rank_api) + ';')
js = js.replace("const VERSAO='dev';", 'const VERSAO=' + json.dumps(VERSAO) + ';')
html = html.replace('<head>', '<head>\n<!-- Time Trial V2 · versão ' + VERSAO + ' -->', 1)
html = re.sub(r'(<script src="js/[^"]+"></script>\n?)+', lambda m: '<script>\n' + js + '\n</script>\n', html, count=1)
open(a.saida, 'w', encoding='utf-8').write(html)
print('ok:', os.path.abspath(a.saida), len(html) // 1024, 'KB', '| ranking:', a.rank_api or 'desligado')
