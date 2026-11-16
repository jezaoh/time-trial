# PENDÊNCIAS

Legenda: ✅ implementado · ⚠️ implementado com problema ou não verificado · 🟡 parcial · 💡 só ideia/planejamento (não existe no código).

## 1. Problemas conhecidos e pontos a verificar

| | Item | Detalhe |
|---|---|---|
| ⚠️ | **Plugin 2.6.0 gerado (16/11 09:23)** | `wordpress/time-trial-v2-ranking-2.6.0.zip`: acelerador, campeonatos, classificação completa, controle. O dono ainda não confirmou a instalação. Controle não testado com aparelho real. O piso de 4.500 s do ranking segue seguro (abuso de sprint no Contrarrelógio dá ~1:34). |
| ⚠️ | **Plugin 2.5.0 gerado (15/11 20:47)** | `wordpress/time-trial-v2-ranking-2.5.0.zip` com o jogo montado em 15/11/2026 20:47. Gerado a pedido do dono; ele ainda não confirmou que instalou. `core_test.php` não rodou (sem PHP na máquina); o PHP só mudou o número da versão. |
| ✅ | **Ranking × botão novo** | Decisão do dono (15/11): **manter** os tempos antigos em `wp_timetrial2_scores`. Se quiser zerar, ele usa o botão do painel. **Nunca apagar a tabela sem ordem explícita.** O piso de 4.500 s (core.php) ainda não foi reavaliado com o botão novo. |
| ⚠️ | **Acelerador em todos os modos (16/11)** | Feito e simulado (`acelerador.js`), o dono **ainda não testou**. Iniciante sem kit só aguenta ~83% do FTP nos 30 km (160 W quebra); com kit, 180–200 W. Se ficar duro demais, a alavanca é `CAR.fad` (1,5) ou a tabela `AJ.empFad` — não o NPC. Robôs não vencem corridas com consistência (já era assim). |
| ⚠️ | Botão de pedalada (modelo de toque — SUBSTITUÍDO em 16/11 pelo acelerador) | Acabou de ser implementado (15/11 15:30) e o dono **ainda não testou**. Pode precisar de ajuste em `tapFtp`, `staTap`, `tapTau`. Ele quer: "cada toque é uma perna; para manter 250 W tem que ser constante e é embaçado; segurar = sprint". |
| ⚠️ | Dificuldade de Rachão/Corrida | Ficou bem mais difícil (pelotão com a sua força + perseguição + regulamento). Os robôs de teste não sabem pegar vácuo, então **não se sabe** se um jogador bom vence com vácuo e sprint. Se ficou difícil demais, a alavanca indicada é a força da perseguição (`FIS.perseguir` e o multiplicador `cap*(.95+.04*nGrp)` em ciclistas.js). |
| ⚠️ | `tools/testes/teste_v2.py` | Ainda verifica a regra antiga do botão. Com a contagem 3-2-1 ativa, os primeiros casos rodam durante a contagem ("pico 175 W"), e "1º quadro: desce NÃO" nos toques é esperado na pedalada. O resultado final ("erros: nenhum", chegada, quebra, ranking desligado) continua válido. Atualizar o teste para o modelo de pedalada. |
| ⚠️ | `tools/balanceamento/sim_v2.js` e `sim_carreira.js` | Rodam, mas as estratégias simulam "segurar o botão" (modelo antigo); os números de estratégia não representam mais o jogador. |
| ⚠️ | Desempenho no tablet | Antes da população nova, houve queda de FPS no tablet (por isso o cache a 72% e o limite de NPCs). O brilho dos itens nos NPCs custou ~1,4 ms/quadro com 20 NPCs no teste headless. O dono disse que, se pesar, prefere **sem animação**. Verificar no aparelho. |
| ⚠️ | Pedal Livre: quebrados encontrados | Varia muito: em 90 km o jogador passa de 0 a 4 quebrados. O dono quer encontrar quem atacou e quebrou à frente. Ajustes possíveis: % de afoitos (`ciclPopular`), `FIS.est.quebrado`, `desiste`. |
| ⚠️ | Pedal Livre: aglomeração | O dono reclamou de "muita gente junta" (antes de `popMax` 10 e `grupoMax` 5). A média caiu para ~5 na tela, mas há picos de 9–13 quando dois grupos se cruzam. Os veículos são desenhados por cima dos ciclistas. |
| ⚠️ | **Visual novo dos menus** (15/11 17h) | O dono ainda não testou. Pontos para ele decidir: (1) o fundo `background.png` é uma corrente grande e clara — nas maquetes aparece menor e mais escura; dá para escurecer/reduzir em `recortar_menu.py`; (2) hub refeito com o retrato do ciclista escolhido e setas (pedido do dono, 15/11 ~17h30) — a ilustração da maquete (`hub_ciclista`) saiu; (3) Centurião e Senhor da Estrada vêm **prateadas** na maquete e continuam prateadas depois de conquistadas; (4) as setas apagadas do recorte do hub deixam emendas leves no cenário. Não verificado no celular/tablet. |
| ⚠️ | **Economia + GARAGEM (16/11 noite)** | Feito, o dono ainda não testou. Detalhes no CLAUDE.md. Não verificado: celular/tablet (memória do cache ~20 MB, montagem dos 40 quadros na largada); retrato do hub (`ret_*`), tela de fim (`fim_*`) e imagem de compartilhar continuam com o visual original (sem máscaras); quadro branco/amarelo ficam escuros (técnica de cor; por isso não estão à venda); NPCs usam rodas de perfil/disco (16/11, 2ª entrega); as cores deles continuam as 12 de `KITS` (sem ouro/prata/rosa das lendárias). Preços e conquistas que liberam cada peça foram escolhas do Claude — confirmar com o dono. Os modelos azul e vinho continuam grátis nas setas do hub. |
| 🟡 | Botões antigos sem uso | `botaoGrande` (carreira.js) ficou sem chamada depois do hub novo. |
| ⚠️ | Classificação final | Nova (15/11). Testada com prova simulada (chegada, na estrada, fuga, quebrado, abandono). Quem não cruzou a linha aparece por distância ("faltava x km"), sem tempo estimado. Países dos estrangeiros escolhidos pelo Claude pelo nome (`PAIS_GR`). O dono ainda não viu. |
| 🟡 | Energético | Código e arte provisória (`latinha()`) existem, mas nada solta energético (o furgão solta gel). |
| 🟡 | Medalhas de média | `CAR.med`, `xpMed` e o HUD de medalhas são do antigo modo "Treino"; o Rachão hoje é por colocação, e esse código é praticamente inalcançável. |
| 🟡 | Código legado de NPC | `npc.js`: `ROTEIRO`, `ROTEIRO_BASE`, `npcGerar`, `npcChefe`, `chefeW` (NPC de potência fixa) não são mais usados (o cérebro é `ciclistas.js`). Não apagar sem testar: `npcDesenhar`, o vácuo e o cache continuam em npc.js. |
| 🟡 | `rig.js` + imagens `rig_*` | Protótipo de ciclista por peças, **desligado** (não está no index.html). O dono não gostou ("ficou muito ruim"). Não reativar sem pedido. |
| 🟡 | `AJ.tau` | Marcado "(antigo)", sem uso na potência. |

## 2. Implementado (resumo)
✅ Contrarrelógio 50 km com ranking (plugin) · ✅ Carreira: nome, hub, skins visuais, 5 atributos, FTP orgânico, nível 25, patentes
· ✅ Loja, inventário, bolso, regulamento da Corrida · ✅ Pedal Livre (relevo gerado, caminhão, furgão, torcedor, moedas, patente
do pedal, recorde) · ✅ Rachão (com eventos de estrada e cascudos) · ✅ Corrida (pórticos, fugas, perseguição, sprint, sobe patente)
· ✅ NPCs com fisiologia, vácuo, revezamento, ataque, quebra, abandono, falas e nomes · ✅ Recursos compartilhados
· ✅ Abandono com penalidade · ✅ Conquistas e título · ✅ Efeitos coloridos e sons de coleta · ✅ Botão de pedalada
· ✅ Contagem 3-2-1 e largada rolando · ✅ Compartilhar · ✅ Versão carimbada na montagem.

## 3. Ideias e planejamento (NÃO implementado)

| | Ideia | Origem / estado |
|---|---|---|
| 💡 | **Sensação de velocidade** | Propostas pelo Claude: primeiro plano rápido (grama/flores borradas a 1,5–2× a velocidade do chão), marcas no asfalto, linhas de vento acima de ~35 km/h e em descidas, som de vento; opcionais: raios borrados, tremor em descida, zoom dinâmico, escala maior do chão (deixa as subidas visualmente menos íngremes). Em 16/11 o dono **aprovou** o pacote "game feel" abaixo (itens 1–3 e 8 cobrem esta linha). |
| 🟡 | **Pacote "game feel" (16/11, aprovado pelo dono, ordem: 8 → 1 → 2 → 3 primeiro)** — ⚠️ 8 (só brilho do raio + `alpha:false`; qualidade adaptativa NÃO feita), 1, 2 e 3 implementados em `sensacao.js` (16/11 14:22), não testados pelo dono nem em celular real; 4–7 continuam 💡 | Só visual/som, sem barra nova, sem mexer em potência/stamina/ranking/NPC. Pesquisa: javascript-racer (MIT), Juicy Breakout (zlib), LittleJS (MIT), ZzFX (MIT), GDC "Juicing Your Cameras" (Eiserloh), Vlambeer "Art of Screenshake", MDN Optimizing canvas. **1** Raio afunda e volta (0,88 com quique ~0,12 s) + ciclista desce 2–3 px por pedalada + `navigator.vibrate` 10–15 ms (Android; iOS não vibra) — sem som ("tum" foi recusado). `pedalada.js` (`toque`) e `desenho.js:194`. **2** Linhas de vento acima de ~35 km/h/descidas (6–12 riscos, comprimento/alfa pela velocidade) + marcas no asfalto, depois de `pistaFrente()`. **3** Câmera com "trauma" (tremor = trauma², onda suave, só no mundo, não no HUD): descida rápida, início do sprint, largada/chegada; bloco `CAM`, em `mundoT()`. **4** `tocar()` com variação ±5% de tom; moedas seguidas sobem de tom; "vush" na ultrapassagem (mp3 gerado no ZzFX, sem biblioteca). **5** Partículas de item (pool fixo ~60): item voa até o slot do HUD, slot pulsa, faíscas; ao usar, anel saindo do ciclista e brilho na barra de stamina. **6** Ataque de NPC visível: em pé, riscos de vento atrás, tranco leve de câmera, "+3 s" flutuante (texto, não barra) — `ciclistas.js:123/130`, `npcDesenhar()`, só visual. **7** Quebra de NPC: suor, balanço, sprite dessaturado pré-renderizado (sem `ctx.filter` por quadro). **8** Desempenho: trocar `shadowBlur 34` do raio apertado (`desenho.js:195`) por imagem com brilho pronta; `getContext('2d',{alpha:false})`; revisar `ctx.filter` em `ciclistas.js:223`; qualidade adaptativa dos efeitos novos (> ~20 ms/quadro = metade). Fora: zoom dinâmico (grande; `ZOOM/WX0/WX1` são constantes). |
| ⚠️ | **2º pacote (16/11 15:28) — feito, o dono ainda não testou** | Itens rendendo menos (Rachão/Corrida), NPCs do Rachão dopados, metas automáticas (`metas.py`), sons (tom variado, moedas, vush, vento), partículas de item, ataque visível, zoom pela velocidade, borrão nas rodas. Detalhes no CLAUDE.md. Ainda 💡 da lista de 16/11: quebra de NPC dramática, qualidade adaptativa, recuperação W'bal, telemetria no plugin, vácuo do caminhão 50% → 35%, "força no momento certo", opção B da fadiga, chão em escala maior. |
| 💡 | **Ciclistas novos em CAMADAS (a "grande atualização visual")** | Dono (16/11): os atuais foram feitos com IA e o azul tem estilo diferente; quer refazer depois (ele mesmo faz os desenhos; personagens Luiz/Roni/Jeff ficam para depois; gabarito não precisa por enquanto). Especificação combinada: camadas no mesmo tamanho e mesma origem — perna de dentro (24 quadros/volta) · rodas (1 imagem cada, o jogo gira; raiada/perfil 40/perfil 60/disco) · quadro (3 tipos: clássica, aero, escaladora, **mesmos pontos de encaixe**: centros das rodas, eixo do pedivela, selim, guidão) · perna de fora (24) · tronco/braços/cabeça (1–3); sprint em pé = conjunto próprio. Roupa/capacete/sapatilha em branco/cinza claro + máscara por peça (camisa, detalhe, bretelle, capacete, meia/sapatilha, quadro). Caminho sugerido pelo Claude: 3D (Blender) renderizado em estilo cartoon, que exporta camadas e máscaras alinhadas; alternativa: desenho 2D sobre gabarito gerado pelo Claude. As sprites atuais continuam até a arte nova chegar. Bike de contrarrelógio fora (muda a pose). |
| ⚠️ | **Luz por período do dia + sombras + vento na descida (16/11 18:35)** | Feito em `src/js/luz.js`, o dono ainda não testou. Período sorteado a cada pedalada (dono: "a hora vai ser aleatória"): amanhecer 20%, dia 40%, fim de tarde 25%, anoitecer 15% (`LUZ.peso`; noite não). Imagens em `docs/novo_jogo/luz_*.png`. Custo headless ~+6 ms/quadro (software); não medido em celular/tablet; se ficar lento a névoa sai sozinha (`LUZ.leve`), `LUZ.on=false` desliga tudo — **não há botão no painel** ainda. Sombras ficam discretas no asfalto escuro e somem dentro do pelotão. Vale em todos os modos (inclusive Contrarrelógio; só visual). |
| 💡 | Perna "tranco e pausa" | Causa: 10 quadros/volta + perna seguindo o dedo (meia volta seca a cada toque). Solução definitiva = ciclistas novos (24 quadros). Paliativos possíveis: cadência contínua pela potência, mistura entre quadros. |
| 💡 | Modos **Profissional** e **Tour** | Citados pelo dono como "depois". Sem definição. |
| 💡 | Campeonatos / classificação geral | O prompt de NPCs pediu explicitamente para não implementar agora; a IA dos NPCs já foi pensada para isso (escalador, sprinter e rolador por perfil de percurso). |
| 💡 | Garagem (peças que mexem na física: rodas aero, quadro leve, capacete, caramanhola) | Ideia antiga do dono (ver `docs/historico`). Skins hoje são só visuais. |
| 💡 | Ranking por distância / categoria por resultado | Ideia antiga para um "jogo novo"; não está no plugin. |
| 💡 | Progresso da Carreira salvo no WordPress | Hoje só no `localStorage` do navegador. |
| 💡 | Nome do ciclista visível o tempo todo | Hoje o nome aparece só nos balões de fala (escolhido para não poluir a tela). |
| 💡 | Mais conquistas | Só existem as 6 da tabela em CONTEXTO_PROJETO.md. |
| 💡 | Personagem por peças (rig) | Desligado; "ver depois com calma". |

## 4. Decisões registradas só na conversa (para não perder)
- **V1 nunca é alterada.** O ranking nunca é apagado. O plugin nunca recria nem dropa a tabela.
- Só o Contrarrelógio envia tempo ao ranking.
- O jogador e a física não são alterados para compensar NPCs.
- Trabalho com o dono: **conversar e tirar dúvidas antes de gerar**; quando ele disser "não gera nada", não gerar; entregar
  **HTML de teste** primeiro e o **plugin só quando ele pedir**; carimbar data e hora da versão; responder em português do Brasil,
  de forma direta.
- Abandono: perde em todos os modos; a penalidade é sobre as moedas do pedal atual.
- Banana do caminhão sem som; demais coletas tocam o som de bônus.
- Skins só cosméticas. Gel azul: vida extra, 1 por pedalada, caro.
- Rachão = corrida clandestina (sem pórticos, vale tudo no bolso). Corrida = regulamento (água, isotônico, gel).
- FTP real do dono ~245 W; referência: "para mim manter 250 W é embaçado".
- Moedas: 100 km muito bom ≈ 80–110 moedas (antes ~370 era fácil demais).
