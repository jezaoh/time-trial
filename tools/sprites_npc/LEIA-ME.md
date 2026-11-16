# Scripts de sprites dos NPCs (histórico de produção)

Usados para gerar as folhas `p_{a,v,b}{0..3}.webp` e as máscaras `m_*_{p,s,h,w,b}.webp` que estão em `src/assets/imagens/`.
As imagens-fonte (folhas originais enviadas pelo dono) **não estão no pacote**; os scripts recebem os caminhos por argumento.

- `prep_folhas.py origem.png saida.webp` — alinha folha 5×2 de pedalada pela bike (imprime frame e dx para `meta.json`).
- `prep_sprint.py` — prepara a folha do sprint (em pé).
- `mascaras2.py folha.webp fw fh kit(a|v|b) prefixo` — máscaras usadas hoje (p, s, h, w, b; 50% da resolução; exclui rosto/dentes).
- `mascaras.py` — versão anterior (só p e s).
- `medir.py`, `medir2.py` — medições de alinhamento dos quadros.
- `previa_cores.py` — gera uma prévia dos kits (`previa_uniformes.png`).
Requer numpy, Pillow, scipy.
