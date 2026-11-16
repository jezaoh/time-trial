# Time Trial V2

Jogo 2D de ciclismo em HTML5 canvas (JavaScript puro) com física de potência, stamina/fadiga, NPCs com fisiologia própria,
Carreira (Pedal Livre, Rachão, Corrida) e ranking em WordPress no Contrarrelógio. Feito para **agenciacastelo.com.br/timetrial/**.

**Versão empacotada: montagem de 15/11/2026 16:11** (em `dist/`).

## Documentação

| Arquivo | Para quê |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Regras para o Claude Code continuar o projeto (leia primeiro). |
| [`CONTEXTO_PROJETO.md`](CONTEXTO_PROJETO.md) | Todas as mecânicas implementadas: modos, física, botão, stamina, fadiga, NPCs, vácuo, itens, moedas, XP, builds, progressão, ranking, salvamento. |
| [`BALANCEAMENTO.md`](BALANCEAMENTO.md) | Parâmetros de equilíbrio: valores, arquivo/objeto onde ficam e resultados de referência. |
| [`PENDENCIAS.md`](PENDENCIAS.md) | Problemas conhecidos, partes incompletas, ideias futuras e decisões do dono. |
| `docs/RANKING_WORDPRESS_V2.md` | Plugin de ranking (instalar/atualizar sem perder o ranking). |
| `docs/MECANICA_V2.md` | Mecânica original do Contrarrelógio V2 (13/11; **o botão mudou**, ver CONTEXTO_PROJETO §5). |
| `docs/historico/` | Diário de desenvolvimento e README antigo (cronológico; o que vem depois prevalece). |

## Estrutura

```
time-trial-v2/
├── src/                     ← código-fonte (o jogo roda daqui)
│   ├── index.html           ← ordem dos scripts (importa!)
│   ├── css/style.css
│   ├── js/                  ← módulos (ver CONTEXTO_PROJETO §2); rig.js não é carregado
│   └── assets/              ← imagens .webp, sons .mp3, fontes .ttf, meta.json (dimensões dos sprites)
├── dist/time_trial_v2.html  ← jogo montado em 1 arquivo (sem ranking) — basta abrir no navegador
├── tools/
│   ├── montar_arquivo_unico.py      ← gera o HTML único (embute assets, carimba VERSAO)
│   ├── testes/teste_v2.py           ← teste no navegador (Playwright)
│   ├── simulacao_npcs/              ← simulações aceleradas de NPCs, corridas, recursos e botão
│   ├── balanceamento/               ← simuladores Node do Contrarrelógio/Carreira (modelo antigo do botão)
│   ├── sprites_npc/                 ← scripts usados para gerar máscaras/folhas dos NPCs (precisam das imagens-fonte)
│   └── *.py                         ← preparação de sprites (sprint, folhas, máscaras)
├── wordpress/
│   ├── plugin-fonte/                ← plugin "Time Trial V2 Ranking" (PHP) + game/index.html (jogo de 14/11)
│   ├── testes/                      ← core_test.php, mock.php
│   └── time-trial-v2-ranking.zip    ← plugin 2.4.0 (o último entregue)
└── docs/
```

## Dependências

- **Para jogar:** só um navegador moderno.
- **Para desenvolver:** Python 3 (servidor local e montagem; só biblioteca padrão).
- **Testes e simulações:** Python 3 + `playwright` (Chromium) + `Pillow`
  (`pip install playwright pillow && python3 -m playwright install chromium`).
- **Simuladores Node:** Node 18+ (sem pacotes).
- **Scripts de sprites:** `numpy`, `Pillow` e `scipy`.
- **Testes do plugin:** PHP 8 CLI.

## Como executar

| Quero… | Comando |
|---|---|
| Jogar | abrir `dist/time_trial_v2.html` |
| Desenvolver (arquivos separados) | `cd src && python3 -m http.server 8000` → http://localhost:8000/ (use o servidor: abrir `src/index.html` por `file://` não foi testado) |
| Montar o HTML único | `python3 tools/montar_arquivo_unico.py --saida dist/time_trial_v2.html` |
| Montar o jogo do plugin | `python3 tools/montar_arquivo_unico.py --rank-api "/?rest_route=/timetrial2/v1" --saida wordpress/plugin-fonte/game/index.html` e compactar `wordpress/plugin-fonte/` como pasta `time-trial-v2-ranking/` (subir `Version:` no .php e no readme.txt) |
| Teste de regressão | `python3 tools/testes/teste_v2.py dist/time_trial_v2.html /tmp` |
| Simular NPCs | `python3 tools/simulacao_npcs/rodar.py dist/time_trial_v2.html "TESTES()"` (ver docstring) |
| Pedal Livre de 90 km | `python3 tools/simulacao_npcs/pedal_livre.py dist/time_trial_v2.html` |
| Botão de pedalada | `python3 tools/simulacao_npcs/toques.py dist/time_trial_v2.html` |
| Testes do plugin | `php wordpress/testes/core_test.php` |

## Controles
- **Pedalar:** Espaço ou o raio. Cada toque é uma pedalada; segurar é sprint.
- **Itens:** A = água · G = gel · I = isotônico · B = banana · Z = gel azul.
- **Outros:** P/Esc = pausa · M = som.

No celular os botões aparecem na tela.

## Verificação do pacote (15/11/2026)
- `src/` igual ao de desenvolvimento (md5); nenhum asset, script ou fonte faltando.
- Rodando por `http.server` e pelo `dist/`: 117 imagens e 9 sons carregados, sem erros de console nem 404.
- `teste_v2.py`: "erros: nenhum" (com as ressalvas de PENDENCIAS.md).
- Simulações rodando a partir do pacote.
