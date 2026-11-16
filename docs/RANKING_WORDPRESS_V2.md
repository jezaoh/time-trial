> Nota (15/11/2026): o plugin atual é a **2.4.0** (`wordpress/time-trial-v2-ranking.zip`), com o jogo montado em 14/11/2026 22:09. As regras de ranking abaixo continuam valendo. Ver `PENDENCIAS.md` (ranking × botão novo).

# Ranking da V2 no WordPress

Plugin **Time Trial V2 Ranking 2.2.0** (`wordpress/time-trial-v2-ranking.zip`), derivado do plugin da V1, com tudo próprio:

| | V1 (oficial) | V2 |
|---|---|---|
| Endereço do jogo | `/timetrial/` | `/timetrial-v2/` e, com o plugin da V1 desativado, também `/timetrial/` |
| API REST | `timetrial/v1` | `timetrial2/v1` |
| Tabela | `wp_timetrial_scores` | `wp_timetrial2_scores` |
| Opções | `tt_secret`, `tt_db_ver` | `tt2_secret`, `tt2_db_ver` |
| Admin | Ferramentas › Time Trial Ranking | Ferramentas › Time Trial V2 Ranking |
| Ciclistas aceitos | azul, vinho, branco | branco |
| Tempo mínimo aceito | 3.900 s (46 km/h) | 4.500 s (40 km/h; o melhor simulado é ~34,2 km/h) |

Os dois plugins podem ficar ativos ao mesmo tempo (classes, funções e tabelas com nomes diferentes).
Regras iguais às da V1: só vitórias com apelido (até 8 caracteres, filtro de palavrões), melhor tempo por jogador, Top 10,
token assinado por corrida, tempo real mínimo coerente com o tempo de jogo, limite de requisições por IP.

## Atualizar sem perder o ranking
Plugins › Adicionar novo › Enviar plugin › `time-trial-v2-ranking.zip` › **Substituir a atual pela enviada**. Só os arquivos são trocados;
a tabela `wp_timetrial2_scores` e a chave `tt2_secret` ficam (o plugin não tem rotina de desinstalação e a ativação só cria o que falta).
Não use "Excluir" no plugin.

## Substituir a V1 no site
1. Plugins › Plugins instalados › **Time Trial Ranking** (V1) › **Desativar** (não precisa excluir; o ranking antigo fica no banco).
2. Plugins › Adicionar novo › Enviar plugin › `time-trial-v2-ranking.zip` › Instalar › Ativar
   (se já tinha enviado uma versão anterior da V2, escolha **Substituir a atual pela enviada**).
3. O jogo abre em `https://SEUSITE/timetrial/` (mesmo link de antes) e também em `/timetrial-v2/`.
4. Moderar: Ferramentas › Time Trial V2 Ranking. O ranking da V2 começa vazio.
Para voltar à V1: desative a V2 e reative a V1 (cada uma tem seu próprio ranking guardado).

## Regerar o jogo do plugin
`python3 tools/montar_arquivo_unico.py --rank-api "/?rest_route=/timetrial2/v1" --saida wordpress/plugin-fonte/game/index.html`
e compacte `wordpress/plugin-fonte/` como pasta `time-trial-v2-ranking/`.

## Testado
- `php wordpress/testes/core_test.php`: 17 regras (inclui: só o branco, piso de 4.500 s, 34 km/h aceito).
- Endereço: com a V1 ativa a V2 abre só em `/timetrial-v2/`; com a V1 desativada, também em `/timetrial/` (testado com um WordPress simulado em PHP).
- Ponta a ponta com `wordpress/testes/mock.php` (mesmo `core.php`): corrida completa de 50 km no navegador, tempo enviado,
  "NOVO RECORDE! 1º lugar" e painel Top 10.
- Não testado num WordPress real (tabela, REST em produção, plugins de cache) — faça uma corrida com apelido depois de instalar e
  confira em Ferramentas › Time Trial V2 Ranking.
