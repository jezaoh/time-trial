> **Diário cronológico de desenvolvimento** (antes chamado CONTEXTO.md). Entradas mais novas prevalecem sobre as antigas; partes do início (ex.: "plugin 2.2.0", "Treino com medalhas", botão τ 1,2 s, NPC de potência fixa, máx. 24 NPCs) estão superadas. O estado atual está em `CONTEXTO_PROJETO.md`.

# CONTEXTO — leia primeiro

Resumo do projeto **Time Trial V2** (jogo 2D de ciclismo em HTML, de Jefferson / Castelo Comunicação) e das ideias para um
**jogo novo**. Escrito ao fim da conversa de desenvolvimento, para continuar em outro chat.

## 1. Estado atual (publicado)

- No ar em **agenciacastelo.com.br/timetrial/** pelo plugin WordPress **Time Trial V2 Ranking 2.2.0**
  (`wordpress/time-trial-v2-ranking.zip`). O plugin da V1 está desativado. O ranking da V2 já tem tempos reais
  (ex.: 1:25:33 · 1:28:55 · 1:29:07 · 1:37:31).
- Este pacote é idêntico ao que está no site. Os sprites são os do site (o dono preferiu esses aos redesenhados).
- A V1 original (outro pacote, `time-trial-pacote`) e o ranking oficial da V1 **não foram alterados**.
- Um só ciclista: **branco** (FTP 250 W, 70 kg + bike 8 kg). Percurso de 50 km com 3 subidas (5,5% · 6,5% · 7,5%).
- O dono está muito satisfeito com: o acelerador ("cada toque é uma pedalada"; dá para manter ~300 W no ritmo dos toques),
  a barra de stamina/fadiga, a água e o gel, e o sprint final.

## 2. Mecânica (tudo no bloco `AJ`, no topo de `src/js/mecanica.js`)

| Parte | Regra |
|---|---|
| Acelerador | pressionado: +320 W/s, linear, desde o 1º quadro, a partir do valor atual · solto: desce suave até 175 W (τ 1,2 s) · teto 1.000 W |
| Stamina (barra verde) | gasta **só pressionado**, conforme a potência (`staGasto`: 20/s a 250 W … 55/s a 1.000 W) · solto: recupera 11,6/s na hora · teto = 100 − fadiga · com stamina ≤ 0,5 o botão não funciona |
| Fadiga (interna) | **nunca diminui sozinha**: 1,35/s sempre + esforço pela potência real (`fadInt`) × tanque (até ×1,5 com stamina vazia) + 1,5/s se aperta com stamina < 4 · 100 = "VOCÊ QUEBROU!" |
| Água | 5 · −8 de fadiga em 2 s, sem acumular (brilho azul na barra) |
| Gel | 2 · −40% da fadiga na hora |
| Física | m·dv/dt = η·P/v − m·g·(sen θ + Crr·cos θ) − ½ρ·CdA·v² (CdA 0,30, Crr 0,004), integrada a dt×6 (inércia ~2 s); distância/relógio ×75 |
| Sprites | por potência (`SPR` em `desenho.js`): normal < 108% FTP · esforço 108–160% · sprint (`p_b3`) ≥ 160% · em pé em subida > 3% |
| Barra | verde = stamina atual, vermelho = 100 − stamina, sempre encostados |
| HUD | `FTP 250 W · 160% (400 W)`, % verde → amarelo → laranja → vermelho |

**Decisões e porquês (não desfazer sem motivo):**
- Stamina por botão e fadiga por potência real: cobrar fadiga só com o botão apertado deixava "toques" baratos demais
  (média máx. ia a 38 km/h).
- Fadiga de resistência 1,35/s: quem nunca acelera precisa de 3 águas para não quebrar (regra do dono).
- Esforço moderado (250–375 W) barato, sprint caro: quem administra bem chega ao km 48 com ~50–55% de fadiga e tem sprint final.
- Sem reservas de energia invisíveis (o dono quer regras transparentes).
- Metas de média nos 50 km: dosando ~30–31 km/h · bom ~33–34 · excelente 34–35 (melhor humano até agora: 35,1).

## 3. Outras funções

- **Compartilhar** (`src/js/compartilhar.js`): botão na tela final (vitória e quebra), mensagem automática e card
  1080×1920 (stories) com a ilustração `fim_venceu` / `fim_quebrou`; celular usa o compartilhamento nativo, computador
  abre painel (baixar / copiar / WhatsApp).
- **Ranking** (plugin): API `timetrial2/v1`, tabela `wp_timetrial2_scores`, Top 10, melhor tempo por jogador, só vitórias
  com apelido, piso de 4.500 s. Atualizar = enviar o zip e "Substituir a atual pela enviada" (o ranking é mantido).
- Tela cheia não existe no iPhone (limitação da Apple) — assunto encerrado pelo dono.

## 4. Como trabalhar no projeto

| Tarefa | Comando |
|---|---|
| Jogar | abrir `time_trial_v2.html` |
| Montar HTML único | `python3 tools/montar_arquivo_unico.py --saida time_trial_v2.html` |
| Montar o jogo do plugin | `... --rank-api "/?rest_route=/timetrial2/v1" --saida wordpress/plugin-fonte/game/index.html` e compactar `plugin-fonte/` como pasta `time-trial-v2-ranking/` |
| Simular o equilíbrio | `node tools/balanceamento/sim_v2.js` (botão, água/gel, estratégias, busca de 4.608 estratégias) |
| Testar no navegador | `python3 tools/testes/teste_v2.py time_trial_v2.html /tmp` (Playwright) |
| Testar o ranking (PHP) | `php wordpress/testes/core_test.php` · ponta a ponta: `wordpress/testes/mock.php` |

Detalhes: `README.md`, `docs/MECANICA_V2.md`, `docs/RANKING_WORDPRESS_V2.md`.

**Jeito de trabalhar que o dono prefere:** português do Brasil, direto e analítico; conversar e mostrar números antes de
gerar arquivos finais; entregar uma versão de teste para ele jogar antes do plugin; nunca perder o ranking.

## 5. Ideias para o JOGO NOVO (próxima conversa)

O dono quer um jogo novo, mais interativo, reaproveitando o motor do Time Trial.

- **Desafios de distância:** 30, 50, 70 e 100 km.
- **Categoria pelo resultado** (média de velocidade; faixas um pouco menores nas provas longas), da melhor para a pior:
  Nível mundial · Estrela nacional · Semiprofissional · Elite · Esporte · Intermediário · Iniciante.
  Proposta inicial para os 50 km: ≥ 35,0 · 34–35 · 33–34 · 32–33 · 30,5–32 · 29–30,5 · abaixo de 29 (completou).
- **Moedas:** quanto melhor a categoria, mais moedas; provas longas multiplicam; quem quebra ganha algumas pelos km feitos.
  Uso pensado: garagem (rodas aero, quadro leve, capacete aero, caramanhola maior — cada peça mexe na física) e uniformes.
- **Ranking por distância** (um Top 10 para cada), com o selo da categoria. No plugin: guardar a distância junto do tempo.
- **Outros ciclistas no percurso e vácuo:** grudar atrás de alguém reduz o arrasto (mexer no CdA); atacar para trocar de
  grupo gasta stamina; no vácuo se recupera.
- **Mapa / perfil do percurso** no HUD, mostrando as subidas que vêm pela frente — esquema do dono em
  `docs/novo_jogo/esquema_mapa_percurso.png`. O perfil pode ser desenhado direto da função `terrain()` de `mecanica.js`.
- **Uniformes de outras cores sem sprites novos:** teste em `docs/novo_jogo/teste_troca_cor_uniforme.png`
  (script `prototipo_troca_cor_uniforme.py`). Funciona bem na pedalada normal; no sprint pintou linhas de velocidade,
  rodas, dentes e meias. Correção planejada: pintar a partir do centro do tronco só as áreas brancas ligadas a ele
  (camisa + bermuda), e no jogo guardar uma máscara e colorir ao carregar (qualquer cor, sem aumentar o tamanho).
- **Ponto crítico de equilíbrio:** a fadiga de resistência está calibrada para ~70 s reais (50 km). Para 70 e 100 km é
  preciso escalar recursos (mais água/gel ou zonas de abastecimento) e recalibrar cada distância no simulador.
- Ideias que ficaram de fora por ora: carro-vassoura (pressão contínua), modo Carreira com evolução de FTP, azul e vinho
  com perfis próprios (FTP, peso, sprint, recuperação).

Perguntas em aberto para o dono: o vácuo é só por trás (vista lateral) ou com troca de faixa? As categorias valem igual
para todas as distâncias? Recursos fixos por prova ou zonas de abastecimento? Progresso salvo no WordPress?

## Modos de jogo e Carreira (teste, ainda não está no plugin)
- Título → **ESCOLHA O MODO** (`state='modo'`). `MODO` em mecanica.js: `'crono'` | `'carreira'`. Botão TROCAR MODO na seleção, pausa e fim.
- **Contrarrelógio**: igual ao do site (50 km, FTP 250, SCALE 75, sem outros ciclistas); único modo que envia ao ranking.
- **Carreira** (`src/js/carreira.js`): hub (`state='carreira'`) com ficha (patente, nível/XP, 5 atributos, 1 ponto por nível) + TREINAR / CORRIDA.
  - Treino (`state='treino'`): 30/50/80/100 km (liberados nas patentes 0/2/4/6), ciclistas na estrada do `ROTEIRO_BASE` (npc.js) com potência relativa ao FTP.
    XP: 1/km, +15 recorde, medalhas de média (CAR.med) +25/+45/+80 na 1ª vez.
  - Corrida (`src/js/corrida.js`): 14 NPCs + você, largada em massa. Perfis escalador/sprinter/rolador/fraco; seguem roda (foto das posições antes de mover),
    quem está na frente puxa a 86% do FTP médio do grupo, reserva/desgaste, fuga de rolador, escaladores atacam na subida final, sprint no último km.
    XP por colocação (CAR.xpPos); 1º lugar sobe a patente. Força do pelotão por patente (CAR.patentes[].forca).
  - SCALE por distância (30:32, 50:48, 80:62, 100:70) → 30 km do iniciante ≈ 2 min reais; fadiga reescalada por km (×SCALE/75).
  - Início 180 W / 74 kg / fadiga ×1,5 / ritmo automático 42% do FTP (contrarrelógio: 70%). Treino aparece como RACHÃO. Progresso em localStorage `tt2_car` (v:2). xpNec(n)=40+15n.
- NPCs desenhados em 3 faixas (lane) com cache de quadros tingidos (96).
- **Pedal Livre** (`src/js/livre.js`, carTipo `'livre'`, GOAL=9999, SCALE 40): estrada sem fim com subidas geradas (mais duras com a distância),
  encontros aleatórios (lento, forte sozinho, grupo 2–5, pelotão de 7) e itens na pista (provisórios): água +1 gole (máx 5), banana −4 fadiga +20 stamina, gel +1 (máx 2).
  Começa com 5 goles e 0 gel. Fim só quebrando ou ENCERRAR PEDAL (pausa). Recorde pessoal `CS.recLivre`; XP 0,6/km + 20 por recorde.
  HUD: "x km · recorde y" e perfil em janela (3 km atrás, 9 à frente). Água = 5 goles em todos os modos da Carreira.

### Pedal Livre v2 (itens, veículos, loja)
- Carreira: tela principal com ciclista escolhido (skin branco/azul/vinho, só visual) + HABILIDADES (`state='habil'`), LOJA (`'loja'`), PEDALAR (`'pedalar'` → Pedal Livre, Rachão, Corrida).
- Nível máximo 25 (1 ponto por nível, começa com 1) → builds. Builds sugeridas em `CAR.builds`. Reset de pontos na loja.
- Moedas (`CS.moedas`): Pedal Livre 1/km + moedas na pista + 20 por recorde; Rachão 1/km + medalhas; Corrida por colocação.
- Loja (`CAR.loja`): banana 20, gel 60, isotônico 40 (garrafa), gel azul 600 (zera fadiga, 1 por pedalada), garrafas 700 ml (7 goles) 300, reset 250. Inventário `CS.inv`, upgrades `CS.up`.
- `livre.js`: torcedor com água (passou perto = +1 gole), caminhão de banana (vácuo 50%, barra de 5 s → 3 bananas), furgão (1×, km 2–30, derruba gel), fileiras de moedas.
  Botões extras (isotônico I, banana B, gel azul Z) acima do raio. Vácuo de veículos entra via `vacExtra()` em npc.js. Sons `caminhao`/`furgao` em loop por proximidade.
- Subidas desenhadas mais íngremes (todos os modos, só visual): `VIS_INC=.027` em desenho.js (antes .0115) — 7% ≈ 11° na tela.
- Caminhão v2: usa a rampa do jogador, acompanha se você encosta, barra enche estando PERTO (atrás ou do lado) por 5 s → pula 1 banana até o ciclista (bônus na hora + brilho).
  Furgão derruba ENERGÉTICO (stamina cheia + 4 s de gás; latinha provisória). Isotônico também dá 3 s de gás. Torcedor novo. Arte de fim por skin (`fim_venceu_azul` etc.).
- **Protótipo de ciclista por peças — DESLIGADO (usuário não gostou; ver depois com calma)** (`src/js/rig.js`, imagens `rig_*`): só no contrarrelógio, tecla R alterna com o sprite. Quadro Marvac + rodas giratórias,
  pé de vela contínuo, IK de perna/braço, canote levantado (`RIG.corpo` 1,22), postura em pé por blend `RS.s`. Pivôs medidos à mão nos recortes (RIG.P).

### Visual novo (pacote "arquivos jogo time trail", 14/11/2026)
- Versão: `VERSAO` (base.js) é preenchida com data/hora de Brasília na montagem; aparece no canto da tela inicial e num comentário no <head>.
- Fonte Exo 2 itálico (900/800) embutida (src/assets/fontes, `FT(peso,tam)`). Tema claro nos menus (`CLARO` em tx(): textos brancos/cinza viram escuros).
- Mundo com zoom (desenho.js: `ZOOM=.65, BXS=370, RYS=686`, faixa visível `WX0..WX1`; `mundoT()`, `scrX/scrY`). Cenário em camadas com emenda em degradê
  (`camada()`, `morros()` com igreja 1 a cada 5), aterro embaixo da estrada (`aterro()`), mato desfocado na frente (`cen_veg`).
- HUD novo (hud(): pausa+cronômetro, distância, velocímetro com ponteiro, watts/%/FTP, rampa, itens com contador e botões HTML posicionados por `botaoDOM`,
  gel azul acima do raio, barra de stamina em peças `staminaBar`). Sprints novos p_a3/p_v3, p_b3 refeito.
- Carreira: jogador digita o nome (`CS.nome`, state 'nome'); personagens (Jeff=branco, Luiz=azul, Roni=vinho) são nomes internos.
- Estrada com perfil FIXO no mundo (`alt(km)`, `vsl(g)` em desenho.js; 9·3600/SCALE px por km), câmera acompanha a altura do ciclista; fundo desce um pouco ao subir.
  Guard-rail e mato (`veg_borda`) também do lado de cá. Pedal Livre: relevo por `rampas` {a,b,g} (mecanica.js; vazio nos outros modos) — curta/longa/dupla/degraus.
  Caminhão: banana vai para o inventário. Furgão: 1 vez por janela de 30 km, gel pula e cai no asfalto. Moeda da pista parada (frente).
- Câmera vertical com mola amortecida (camPasso, EYB ±160); fundo sem paralaxe vertical; árvores/arbustos em pé (só sobem com o chão); veg_borda com degradê para o aterro.
- Câmera v3: travada no ciclista; só baixa antes de descidas (EYB = 1,15 × queda média nos próximos 1000 px, máx 210), função da posição, sem mola.
- Contagem regressiva 3-2-1-VAI com bipes (contagem.js) em toda largada. Bug corrigido: btns não era limpo em drawSelect (JOGAR abria a Carreira). Jeff (branco) com os sprites novos do zip (p_b0..2).
- Estrada estilo referência (guard-rail de trás na borda de cima, da frente na de baixo, veg_topo + aterro preso ao mundo). NPCs na escala do chão (PX_KM 1×). Máscaras pshwb (uniforme, detalhe, capacete, meia/sapatilha, bike) para a/v/b; branco também como NPC (multiply). Corrida 25. Pedal Livre: encontros fraco/médio/forte, muros até ~18% e descidas longas (~60 km/h). Watts do HUD suavizados (wHud). Moedas 84 px.
- 2.3.1: Pedal Livre casual (máx 6 NPCs, encontros a cada 3–6 km). Itens consumíveis; MOCHILA (state 'mochila') com água básica + até 3 itens (iso, banana ≤5, gel ≤3, água 700 ml); gel azul separado. Fugas: até 2 por corrida (rolador/escalador, às vezes com parceiro). Pórticos LARGADA/CHEGADA + cones na corrida. Cache de NPC em 72% (240 quadros).
- Pórticos em 2 partes (arco_*_tras atrás, arco_*_frente por cima do jogador); corrida 15; Rachão = corrida sem pórticos (faixa branca), XP por colocação ×0,7, CS.melhorPos; mochila antes de qualquer modo da Carreira (irMochila/MOCH_DEST, LV.livre separa estrada do kit); Pedal Livre ≤3–4 NPCs; máscaras sem dentes/olhos.
- Largada rolando: na corrida/rachão o pelotão começa VROLL·3 s antes da linha (dist<0) e rola até ela na contagem. Guard-rail da frente desenhado depois dos ciclistas (pistaFrente). Árvores afundadas no lado baixo; arbustos com inclinação contínua. Elevação acumulada (elevG) abaixo da rampa.

## 15/11/2026 — moedas girando, sons, efeitos, patente do pedal, abandono, CONQUISTAS
- Novo src/js/extras.js (após livre.js): tocar(k) one-shot; efeito(cor) brilho colorido no ciclista + barra de stamina (água azul, iso verde, banana amarelo, gel laranja, azul ciano, energético dourado); moeda_gira.webp (4x4) com sombra; pílula de moedas (+ganho do pedal) sob o tempo; LV.vacKm; CONQUISTAS (CS.conq, CS.conqNovas, CS.titulo) com tela no hub.
- Sons novos: moeda, buzina (caminhão), bonus (coletas; banana do caminhão sem som).
- Textos de veículos/grupo e dica de início removidos (aviso de FUGA mantido). Mochila→BOLSO. bg_swirl em todas as telas.
- Banana: −6 fadiga, +40 stamina. Encontros 'igual'/'igualG' (100–106% FTP).
- Pedal Livre: moedas/XP × patente do pedal pela média (PAT_PEDAL); vácuo +1 moeda e +0,5 XP/km.
- Abandono (todos os modos, botão na pausa): sem XP, 80% das moedas do pedal.

## 15/11/2026 12:41 — NPCs com fisiologia (src/js/ciclistas.js)
- Cérebro único para Pedal Livre, Rachão e Corrida: ftp, m, Wp (reserva), pico, atq, end, rec, agr, vacEf, Fend (>100 = afoito).
  Estado res (stamina) e fad (acumula). Estágios: cansado 55, fadigado 72, quebrado 86 (pedala ≤85% do FTP efetivo), abandona 100 ou quebrado há muito tempo (desiste).
  FTP efetivo cai com a fadiga (capF). Ritmo pelo "orçamento" de fadiga até o fim (hInv). Tempos em segundos de prova (dt×SCALE).
- Seguir roda / passar / revezar (turno e 'sai') / ataque / fuga; corrida mantém diretor de fugas em corrida.js e o ritmo de grupo (med×CORR.ritmo) e curva de vácuo antiga (balanço preservado).
- Pedal Livre: população ABSOLUTA (FIS.niveis) + 'seu' (relativo à sua média), persistente até −9/+16 km (FIS.longe), máx. 24. Spawn em ciclPopular (substituiu encontro()).
- Recursos compartilhados: LV.rec (água do torcedor, gel do furgão) e banana do caminhão (r.pegou por evento). Rachão agora tem caminhão, furgão e torcedor (LV.eventos).
- Itens NPC na escala da fadiga deles: água −3, gel −15%, banana −2,2 (+40 reserva).
- Parado: imagem fim_quebrou(_azul/_vinho) na beira + balão de fala (nomes BR ~65% e gringos ~35%).
- Testes de simulação: /tmp/sim (harness.js, testes.js) — não fazem parte do jogo.

## 15/11/2026 tarde — acelerador, regulamento, perseguição, moedas
- Botão (todos os modos, inclusive contrarrelógio — liberado pelo usuário): AJ.tau 1.2→3.5 s; stamina solta só recupera com watts ≤70% FTP (0% a ≥105%) — AJ.staLivre.
- Corrida oficial: bolso só isotônico e gel (REGRA_CORRIDA), sem gel azul. Isotônico: −9 fadiga, +12 stamina, sem gás. Gel decrescente na Carreira (LIV.gelRende). Fadiga extra após 2 h de pedal (+15%/h da resistência, até +45%).
- NPCs: perseguição em corrida/rachão (FIS.perseguir), NPC leva isotônico (5) e no rachão gel; Pedal Livre popMax 10, fila máx 5 (grupoMax), quebrado é definitivo, fadigados/quebrados à frente ficam até 30 km; falas com nome (ataque, soltar, quebrar).
- Moedas Pedal Livre: 0,35/km + 0,2/km de vácuo, × patente 1,0–1,6 (mm); moedas na pista a cada 6–10 km. Caminhão a cada 25–40 km, torcedor 9–15 km.
- 15/11 14:08: botão opção B — tau 2 s, stamina volta na hora ao soltar (trava staLivre removida).

## 15/11/2026 15:30 — botão de pedalada, FTP orgânico, pelotão com a sua força
- Botão (todos os modos): cada toque = pedalada (pTap += (1−cruise)·FTP/(tapFtp·tapTau), some com tapTau 1 s); 2 toques/s ≈ FTP, 1/s ≈ 70% (Carreira).
  Segurar > tapSegura (0,25 s) = sprint (rampa 320 W/s). Cada toque gasta AJ.staTap (por intensidade) e só rende o que a stamina paga (kTap) → ritmo sustentável ≈ 85–90% FTP.
- FTP Carreira: ftpDe(nivel,motor) = 180 + 6,5·(nível−1) + 4·motor (nível 25 + motor 10 ≈ 376 W).
- Corrida/rachão: força = max(patente, seu FTP); rachão com 3–4 cascudos ×1,10–1,15. Pedal Livre: nível 'pro' (350–420 W) raro.
- Simulação (nível 9, FTP 264, atacando com itens): termina 4º–8º (antes vencia sempre).
