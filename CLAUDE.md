# CLAUDE.md — instruções para continuar o Time Trial V2

Leia nesta ordem: este arquivo → `CONTEXTO_PROJETO.md` → `BALANCEAMENTO.md` → `PENDENCIAS.md`.

## Quem é o dono e como trabalhar com ele
- Jefferson (Castelo Comunicação). **Responda sempre em português do Brasil**, direto e analítico, sem enrolação.
  Ele costuma ditar por voz, então interprete erros de digitação com bom senso.
- **Converse e tire dúvidas antes de gerar.** Mostre números e propostas e pergunte o que for ambíguo. Se ele disser
  "não gera nada" / "só responde", **não altere arquivos**.
- Entregue primeiro um **HTML de teste** (`dist/`) para ele jogar. O **plugin WordPress só quando ele pedir**.
- **Toda montagem carimba data e hora** (`VERSAO`, automático em `tools/montar_arquivo_unico.py`). Informe a versão na entrega.
- Ao terminar uma mudança: diga o que mudou, os números (simulação) e o que ainda não foi verificado.

## Regras invioláveis
1. **Nunca alterar a V1** (outro pacote, `time-trial-pacote`, ranking `timetrial/v1`). Ela não está neste repositório.
2. **Nunca perder o ranking:** o plugin não pode dropar/recriar `wp_timetrial2_scores` nem ter rotina de desinstalação
   que apague dados. Atualização = "Substituir a atual pela enviada". Mudanças de schema só aditivas, via `dbDelta`.
3. **Só o Contrarrelógio envia tempos ao ranking.**
4. **Não mudar o balanceamento do jogador para compensar problemas dos NPCs.**
5. **Não reescrever o jogo, não trocar a arquitetura, não adicionar framework/bundler.** Mudanças pequenas e localizadas.
6. Não inventar funcionalidade que o dono não pediu. Ideias vão para `PENDENCIAS.md` como 💡.

## Arquitetura (resumo)
- JavaScript puro, escopo global, scripts carregados **em ordem** por `src/index.html`. Módulos posteriores **embrulham**
  funções dos anteriores (`const _x=update; update=function(dt){_x(dt); …}`). Ao mudar algo, ache a camada certa;
  não duplique sistemas. Novo módulo: adicione o `<script>` na posição correta do `index.html`
  (o montador lê os scripts do index).
- `mecanica.js` não pode depender do DOM (é carregado no Node por `tools/balanceamento/`).
- Parâmetros de equilíbrio ficam em blocos nomeados: `AJ` (mecanica.js), `CAR` (carreira.js), `LIV` e `PAT_PEDAL` (livre.js),
  `FIS`, `SABOR` (ciclistas.js), `CORR` (corrida.js), `NPCK` (npc.js), `SPR` (desenho.js), `CONQ` (extras.js).
  Mude números ali, não espalhados pelo código.
- Gameplay do jogador em segundos reais; distância em tempo de prova (`×SCALE`); fisiologia dos NPCs em segundos de prova.
- Salvamento: `localStorage` `tt2_car` (Carreira, `v:2`). Ao adicionar campos, use `carNovo()` com padrão e `Object.assign`
  (já é o que `carLer()` faz) para não quebrar saves antigos. Não troque `v` sem migração.
- Imagens/sons novos: coloque em `src/assets/{imagens,sons}` (webp/mp3) e registre em `SRC`/`SND` (`assets.js`). O montador
  embute tudo o que está registrado. Sprites de pedalada têm dimensões em `assets/meta.json`.
- Desenho do mundo: `mundoT()`, zoom 0,65; posição de algo no km `k` na tela = `bikeX + (k − dist)·PX_KM`.

## Fluxo de verificação (sempre antes de entregar)
```bash
python3 tools/montar_arquivo_unico.py --saida dist/time_trial_v2.html
python3 tools/testes/teste_v2.py dist/time_trial_v2.html /tmp          # precisa terminar com "erros: nenhum"
python3 tools/simulacao_npcs/rodar.py dist/time_trial_v2.html "TESTES()" "TESTE_CORRIDA(30,4)" "TESTE_RECURSOS()"   # se mexer em NPC/corrida
python3 tools/simulacao_npcs/toques.py dist/time_trial_v2.html          # se mexer no botão/stamina
python3 tools/simulacao_npcs/metas.py dist/time_trial_v2.html           # METAS de balanceamento (13 robôs, ~5 min): "metas fora: 0"
php wordpress/testes/core_test.php                                      # se mexer no plugin
```
Para conferir a tela: abra no Playwright, rode `update()`/`draw()` manualmente (`requestAnimationFrame=()=>0`) e tire screenshot.
Para conferir mexendo só em `src/`: `cd src && python3 -m http.server`.

## Publicar no WordPress (só com pedido do dono)
1. `python3 tools/montar_arquivo_unico.py --rank-api "/?rest_route=/timetrial2/v1" --saida wordpress/plugin-fonte/game/index.html`
2. Suba `Version:` em `time-trial-v2-ranking.php` e `readme.txt` (atual: **2.7.0**, jogo de 16/11/2026 15:51 = 2º pacote game feel + Rachão dopado; dono aprovou: "ficou do caralho").
3. Compacte `wordpress/plugin-fonte/` como a pasta `time-trial-v2-ranking/` → `time-trial-v2-ranking-X.Y.Z.zip`
   (use Python `zipfile` com barras normais; o Compress-Archive do PowerShell 5.1 grava `\` e o WordPress pode rejeitar).
4. Rode `php wordpress/testes/core_test.php`.
5. Lembre o dono: Plugins › Adicionar novo › Enviar › **Substituir a atual pela enviada**. Nunca "Excluir".

Antes de publicar, resolva com o dono a pendência "Ranking × botão novo" (PENDENCIAS.md).

## Estado em que o projeto parou (15/11/2026)
- Última mudança: botão de pedalada (toques = pernas), FTP orgânico (`ftpDe`), pelotão com a força do jogador, cascudos
  no Rachão, nível "pro" no Pedal Livre. **O dono ainda não testou essa versão.**
- Depois (15/11, noite): **só no Contrarrelógio** o botão virou "segurou, empurra" (`AJ.emp*` em mecanica.js: apertado sobe
  watts e gasta stamina suave, solto volta ao cruzeiro e recupera; sem custo por toque; segurar direto zera em ~4,4 s) e a
  perna/som seguem o dedo (`pedalada.js`, bloco `PEDK`). Carreira e Pedal Livre continuam com toque/sprint.
- 16/11 00:39: Contrarrelógio virou **acelerador BRUUM–uuuum** (apertado sobe watts, solto desce em ~1 s; segurar
  muito = sprint, teto 1150 W), **stamina = W'** (só gasta acima do FTP, `empWp`) e **fadiga própria** (`empFad`), tudo
  calibrado pelo perfil real do dono (FTP 245; 15 s 1116 W · 30 s 775 · 1 min 495 · 5 min 343 · 1 h ~215 W com itens).
  Metas: 175 W chega folgado · 200 W quase sem beber · 215 W só com itens · 230 W+ quebra.
- 16/11 00:46: dono achou que "segurou, sprinta logo" e não gostou do "tum" por toque → subida 120 W/s, sprint só
  segurando > 1,2 s (`empSegura`), descida mais lenta (`empSolta` .6); "tum" removido (a perna ainda segue o toque).
- 16/11 00:51: dono quer a barra "descendo e voltando" com o ritmo → apertado gasta `empAperta` (forte em watts baixos,
  some no sprint) + bateria acima do FTP (`empWp` 4000); solto recupera 20/s. Segurar direto zera em ~5,9 s.
- 16/11 01:00: dono aprovou a barra ("ISSO MANO"), mas fez 1:08 repetindo sprints de 1000 W → punição: teto de watts pela
  stamina (`empTeto*`: ≥60% = 1150 W, 20% ≈ 460 W) + fadiga acima do FTP mais pesada (sprint 5 s ≈ +35). Simulação: abuso
  de sprint ≈ ritmo constante no limite (1:34 × 1:36) ou quebra; 2 sprints bem usados ganham ~3 min.
- 16/11 01:05: "sem encostar ele completa a 27 km/h" → sem apertar NÃO pedala (`empLivre` 0: watts caem a 0, bike rola
  até ~4 km/h). Retuning: `empSobe` 150, `empSolta` .5 → ritmo 0,4/0,6 s ≈ 214 W · 0,5/0,5 ≈ 348 W.
- 16/11 01:19: subida rendia metade dos watts (a "marcha pesada" multiplicava a subida dos watts por 0,55 abaixo de
  12 km/h e passava de 1 acima de 32) → removida: mesmo ritmo = mesmos watts em qualquer rampa (0,4/0,6 ≈ 203 W).
  HUD (todos os modos): "MÉDIA xxx w yy%" acima dos watts (`pSoma/pTempo`, média de potência do pedal, com zeros).
  💡 Em aberto (opção B): fadiga encolher menos a barra (100 − 0,6·fadiga) se a subida ainda ficar dura.
- **16/11 (tarde) — FEITO, o dono ainda não testou:** acelerador do Contrarrelógio em TODOS os modos (`emp=true` em
  mecanica.js; `aplicarModo()` reescala `empFad` por `f·ts`, `empLivre` 0, Recuperação → `empRecupera`, Sprint → `pMax` e
  `empWp`); perna segue o dedo em todos os modos (`pedalada.js`). Também: gel azul do HUD maior (165 px) e mais alto;
  **água 700 ml saiu** da loja e do bolso ("só 500 ml por enquanto"; quem tem no estoque guarda); bolso = água + 3 itens
  (= 4) no Pedal Livre/Rachão; torcedor com garrafa cheia = gole na hora (−8 de fadiga); conquista NOVA com borda amarela
  pulsando. Backup em `backup/src_2026-11-16_antes_acelerador_carreira/`. Robô novo: `tools/simulacao_npcs/acelerador.js`
  (`ACEL({...})`, `RITMO(...)`). Números: iniciante sem kit aguenta ~150 W (83%) nos 30 km, 160 W quebra; com kit 180 W
  sozinho = 27,0 km/h, 200 W chega com fadiga 71; Rachão 180 W com vácuo 27,8 km/h (5º–6º); nível 10 (FTP 259) 85% → 50 km
  a 30,2; nível 25 (FTP 376) 90% → 100 km a ~40 km/h. Pedal Livre iniciante: 140 W ≈ 80 km, 160 W ≈ 37 km.
- **16/11 — Pedal Livre com menos vácuo** (dono: 2º pedal deu 70 km a 32 km/h, "muito ciclista perto pra pegar vácuo"):
  só NPCs mudaram (`FIS.encIntervalo` 6–10 km, `encPrimeiro` 3–6 km e largada sem ninguém, "do seu nível" 26% → 10% só
  solo, `seuForca` +12%). Robô que caça roda, iniciante 85% FTP com kit: vácuo 52% → 29% (média de 5). Vale só no Pedal Livre.
  Dono testou: "sozinho demais" → largada com 1–2 tranquilos já na tela (`encLargada`, `passeio`), encontros a cada 4–7 km,
  1º sorteado no km 1,5–3; 40% dos solos são "só pedalando" (`r.passeio`: não seguem roda de ninguém). Robô: 1º ciclista
  no km 0, 8–12 vistos em ~60 km, vácuo 37–71% (o robô senta atrás dos lentos), média 31 km/h a 153 W.
  Balão de fala: branco, contorno e letras pretas, mais alto (`BALAO`, `balaoDesenhar()` em ciclistas.js; o torcedor usa o mesmo).
  Fonte dos balões: **Luckiest Guy** (Comic Neue foi testada e trocada). Dono aprovou o Pedal Livre ("ficou muito bom").
- **16/11 — Classificação completa** (Rachão/Corrida): `classifCompletar()` em corrida.js simula o resto da prova sem você
  (`CIC_SEM_EU`) até todos chegarem/abandonarem (~0,1 s), situações "CHEGOU QUEBRADO", "QUEBROU E ABANDONOU"; vencedor real
  no resultado. Altimetria do Pedal Livre: "próximos 10 km".
- **16/11 — CAMPEONATOS (feito, o dono ainda não testou):** `src/js/campeonato.js` (bloco `CAMP`). PEDALAR › CORRIDA →
  tela CAMPEONATOS (`state='camp'`): TOUR SAN LUIZ (escalador), VUELTA DE SAN MARIA (sprinter), GIRO DE ESTRADA (clássico),
  5 etapas com mapas fixos (frações da distância da patente). Decisões do dono: patente sobe só vencendo a GERAL; distância
  = a da patente (30/50/80/100); quebrou = penalidade (último + 8% do tempo do vencedor); inscrição paga; desistir perde
  parte (devolve 30%); prêmio da geral × inscrição (1º 10×, 2º 5×, 3º 3×, 4º 1,5×, 5º 1×); inscrição 100…600 por patente.
  Mesmos 14 rivais nas 5 etapas (`CS.camp.grade`), etapa paga 60% do XP e 50% das moedas da corrida avulsa.
  Robô (iniciante, 90% FTP, caça roda): Vuelta → **campeão** (venceu 3 etapas); Tour 13º; Giro 8º — a Vuelta pode estar
  fácil demais (plano = vácuo). Números de economia propostos pelo Claude, a confirmar com o dono. Dono: "ficou incrível".
- **16/11 — Controle (gamepad)**: `src/js/controle.js`, mapeamento padrão (posição do botão, qualquer controle):
  A segurar = potência · X água · Y isotônico · B banana · RB gel · LB gel azul (escolha do Claude) · START pausa;
  fora da prova, analógico/direcional move um cursor e A clica, B = voltar. Testado com controle simulado no Playwright,
  **não testado com controle real**. Painel CONTROLES ganhou a coluna CONTROLE.
- **16/11 10:01 — NPCs mais espertos (Rachão e Corrida; NÃO no plugin 2.6.0):** bloco `CORR` (corrida.js) + ciclistas.js.
  Regra do dono: **NPC nunca lê a stamina/fadiga do jogador** (só posição e velocidade). Bolso igual ao do jogador por
  "preparo" (completo 35% / médio 40% / básico 25%; no campeonato fica na ficha); itens com plano (`CORR.kmChave`: guarda
  o último gel e 2 goles de iso, toma antes do final); personalidade (agressivo/calculista/rodador) com ataques no topo das
  subidas, no meio e entre 5–3 km do fim; reação ao seu ataque (`corridaMarca`: até 2 fortes vão atrás; o grupo só caça
  forte acima de ~1500 px, e sempre nos últimos 5 km); sprint por tipo (sprinter a 800 m, outros 900–400 m), sprinter
  se esconde no revezamento e **sobe na fila nos últimos 4 km** (fila de 72 px ≈ 70 m reais: no fundo ele chegava 800 m
  atrás). Último 1,5 km: todo mundo pode ir até o teto para não perder a roda. Vencedores (20 etapas cada): Vuelta
  sprinter 9 × rolador 10; Tour escalador 19; Giro escalador 14 × rolador 6. Ataques: ~4/etapa (Vuelta) a ~10 (Giro).
  Robô esperto (iniciante): Tour 13º–15º na geral (antes 11º–15º), Vuelta 3º–10º (antes 2º–4º/campeão).
- **Plugin 2.6.0** gerado (16/11 09:23) a pedido do dono: `wordpress/time-trial-v2-ranking-2.6.0.zip` (cópia na raiz
  `D:\pessoal\TIME TRAIL\`). Sem mudança de PHP além da versão; `core_test.php` não rodou (sem PHP na máquina).
- (Histórico) Tarefa aprovada pelo dono em 16/11 01:30: levar a mecânica do Contrarrelógio para TODOS os
  modos da Carreira (Treino, Corrida, Rachão, Pedal Livre). Decisões do dono:
  1. Sem apertar NÃO pedala em todos os modos, inclusive Pedal Livre (`empLivre` 0; hoje Carreira usa `CAR.cruise` .42).
     XP/moedas já premiam média alta.
  2. Iniciante continua com fadiga ×1,5 (`CAR.fad`), "tem que sofrer" — conferir: 180 W sozinho ≈ 27–28 km/h de média
     na prova; 30 só no vácuo.
  3. Atributos: Motor (FTP) e Escalada (kg) iguais; Fôlego −5% fadiga; Recuperação +6%/nível em `empRecupera`;
     Sprint: pMax 700+40/nível **e** +5%/nível em `empWp`.
  Como fazer: em `update` trocar `emp=MODO==='crono'` por todos os modos; em `aplicarModo()` reescalar `empFad` por
  `f·ts` (como já faz com `fadInt`) e mapear os atributos acima. Itens da Carreira continuam iguais.
  NPCs NÃO usam o botão (fisiologia própria em ciclistas.js, já com reserva W' e fadiga) — não mexer neles a não ser que
  as corridas desequilibrem (regra 4: ajustar NPC, não o jogador). Adaptar o robô de `tools/simulacao_npcs` ao
  acelerador novo e simular corridas/rachão/treino antes de entregar. Fazer backup de `src/` antes de começar.
  O dono precisa ficar com a janela aberta (~30–60 min); combinar o horário.
  💡 Próximo passo combinado: "força no momento certo" (janela de força na pedivela) — só depois de ele testar.
- **16/11 14:22 — GAME FEEL, 1º pacote (itens 8·1·2·3 do PENDENCIAS; o dono ainda não testou):** módulo novo
  `src/js/sensacao.js` (bloco `SENS`, estado `GF`), carregado depois de `pedalada.js`. Só visual/vibração. Raio com mola a cada
  toque (afunda 0,86, volta em ~70 ms, passa ~2%) + ciclista desce ~4 px por pedalada + `navigator.vibrate` 12 ms (Android;
  28 ms ao entrar no sprint) — sem som. Linhas de vento acima de 35 km/h (28 em descida), tachas na faixa amarela a cada 240 px
  e remendos escuros no asfalto. Câmera com trauma (tremor = trauma², soma de senos, só fundo+mundo, nunca o HUD; zoom mínimo
  esconde a borda): sprint +.38, largada +.5, chegada +.65, descida 45→65 km/h piso até .6. Desempenho: brilho do raio pronto
  (`raioBrilho`, sem shadowBlur por quadro) e `getContext('2d',{alpha:false})`. Ganchos em desenho.js (todos com `typeof`).
  Backup em `backup/src_2026-11-16_antes_game_feel/`. `ciclistas.js:223` usa `ctx.filter='none'` (inofensivo, não mexi).
  14:43: dono gostou de tudo, MENOS do balanço do ciclista → `SENS.tranco` 0. Remendos retangulares → **bueiros** raros
  (`bueiro()`, ~40% dos períodos de 2600 px ≈ 1 a cada ~25 s a 30 km/h).
- **16/11 — Balanceamento em aberto (só diagnóstico, nada mudado):** dono venceu Rachão 30 km com FTP 257 a 44,1 km/h usando
  itens. Robôs (nível 10, FTP 239): sem itens ~95% FTP chega; com kit + gel azul ~120–140% FTP nos 30 km (fadiga removida pelos
  itens ≈ ou > fadiga da prova; gel azul zera tudo). Stamina recupera 20/s solto (≈800 J/s, 3× o máximo fisiológico do W'bal
  de Skiba), então pulsar sai quase de graça. Os 44 km/h vêm de itens + vácuo (pelotão 40%, caminhão 50%).
- **16/11 15:28 — 2º pacote (o dono ainda não testou).** Decisões do dono: **"Rachão é rachão" = doping liberado**, NPCs também.
  · Itens rendem menos a cada uso (`LIV.rende` [1,1,1,.9,.8,.72…,.4], `rendeItem()` em livre.js; NPCs `npcRende` em
    ciclistas.js) **só no Rachão e na Corrida**, só itens comprados (iso, banana, gel); **água básica/torcedor, gel azul e
    energético ficam fora**. Pedal Livre sem mudança. Gel azul igual (Pedal Livre e Rachão). Aparece "RENDEU 80%".
  · **NPCs do Rachão dopados** (`CORR.dope*`): bolso cheio + gel azul (`npcAzul`, usa com fadiga > 76), FTP efetivo ×1,2
    (`dopeFtp`), ritmo que já conta com os itens (`npcReserva`, `dopePlano` .8). Corrida oficial: não.
    Robôs: vencedor do Rachão nível 10 ~38–39 km/h (antes ~35); robô nível 10 no máximo (kit+azul) chega 7º; iniciante 90% com
    kit chega, mas em ÚLTIMO (antes 7º–10º) — Rachão ficou bem mais duro para iniciante (ajuste: `CORR.dopeFtp`).
    Corrida iniciante 90% kit: 5º–9º, fadiga final 75–80 (antes 5º–8º, 64–70).
  · Metas automáticas: `tools/simulacao_npcs/metas.js` + `metas.py` (13 metas, todas OK em 15:28).
  · sensacao.js: som com variação de tom, moedas seguidas sobem de tom, "vush" na ultrapassagem e vento contínuo (ruído Web
    Audio, sem mp3); partículas de item (usar = anel + faíscas; pegar = voam ao espaço do HUD, que pulsa) detectadas por mudança
    de estado; NPC atacando fica em pé (st 2), risca vento e mostra "+N s" (ou na borda direita); zoom até +4% devagar → 1,0
    a 50 km/h; borrão nas rodas acima de 25 km/h (`RODAS`: centros medidos nas folhas, jogador e NPCs).
  · ⚠️ Cuidado (vale sempre): editar arquivo com Get-Content/Set-Content do PowerShell 5.1 estraga os acentos (aconteceu no corrida.js,
    restaurado do backup). Use só a ferramenta de edição. Backup: `backup/src_2026-11-16_antes_pacote2/`.
- **16/11 (noite) — ECONOMIA + GARAGEM (o dono ainda não testou).** Medição (robô, moedas por hora real com ~25 s de menu):
  Pedal Livre ~1.000–1.500/h (= a meta, não mexi); Rachão/Corrida no meio do pelotão 200–600/h (e ainda gasta kit). O excesso
  vinha de conquistas (~6.600), vitória (80 por prova ≈ 3.000/h para quem vence sempre) e prêmio do campeonato (10×). Decisões
  do dono: peças **só visuais**; item mais caro ≈ **10 h** de jogo (10.000); conquistas pagam acesso, não dinheiro.
  · `CAR.moedas.pos` 50·35·25·15…; `CAMP.premio` 5·3·2·1·0,5; `CQ_DIF` mf 0 · f 10 · m 25 · d 50 · l 0 (≈1.900 no total).
  · `src/js/garagem.js` (depois de sensacao.js): LOJA com abas ITENS/GARAGEM (`lojaAbas`), provador, 6 categorias (`GAR`):
    uniforme, quadro, capacete, sapatilha, rodas (perfil 40 3.000 · perfil 60 6.000 · disco+60 10.000), cor do aro.
    `lib` = conquista difícil que libera a compra; `lend` = lendária que DÁ a peça exclusiva + título (`GAR_TIT`).
    Pinta com as máscaras dos NPCs (`npcQuadro`); máscaras do sprint (`m_?3_*`) geradas com `mascaras2.py`. Rodas desenhadas
    por cima, quadro + pé de FORA redesenhados por cima (o de dentro fica atrás do aro). Quadros prontos em `GAR_CACHE`
    (60), montados na largada (`garAquecer`). Gancho em desenho.js (`garQuadro`); **Contrarrelógio sempre original**.
    Salvo em `CS.gar={tem,uso}`. Título: toque no título do hub troca entre os ganhos. Backup: `backup/src_2026-11-16_antes_garagem/`.
    Dono definiu: perfil 60 = aro de ~24% do raio, perfil 40 = metade disso; o perfil maior foi descartado.
  · NPCs com rodas da loja (pedido do dono): `GAR_NPC` (chance pelo FTP: 20% → 85%; disco só nos fortes; aro na cor do
    uniforme), sorteio pelo nome (mesmo rival = mesmas rodas). Kit com roda fica em `GAR_KX` (índice k ≥ 1000, fora de `KITS`,
    que outros módulos sorteiam). Nos modelos azul/vinho a máscara do quadro pega a roda: `garComRoda` tira a faixa do aro.
- **16/11 18:35 — LUZ (o dono ainda não testou):** `src/js/luz.js` (depois de garagem.js). Período do dia sorteado por pedalada
  (`LUZ.P`: amanhecer, dia, tarde, anoitecer). Ganchos: `camada` (céu+sol antes das montanhas, névoa depois), `morros` (névoa leve),
  `npcDesenhar` (sombras de todos antes dos ciclistas), `sensVento` (gradação multiply + raios/vinheta antes do HUD, e as linhas de
  vento seguindo o relevo com `alturaEm`). Camadas fixas guardadas em `LZC` por período. Dono: sol só com brilho, sem disco.
  Dono NÃO quer mexer na perna agora (decidiu refazer os ciclistas depois, em camadas — ver PENDENCIAS).
- **17/11 — MARCHAS + RPM + FC só no Contrarrelógio (TESTE, "MyWhoosh arcade"; o dono ainda não testou):** bloco `MAR` em
  mecanica.js (`MAR.liga=false` volta ao acelerador) + `src/js/marcha.js` (HUD e controles). Cada toque no raio = 1 volta
  (1,5 toque/s = 90 rpm); 12 marchas 34×30…50×11 (roda 2,1 m); watts = o que a física cobra para a velocidade RPM×marcha
  (empurrão de aceleração ≤ +40% FTP); stamina = W' (gasta só acima do FTP, recupera abaixo); stamina < 5 → teto 85% FTP e
  fadiga ×1,3; RPM < 60 = mais fadiga, > 100 = mais stamina; subida "arcade" (gravidade ×0,7 só na subida, só com marchas).
  Mão esquerda: ▲ PESADA / ▼ LEVE + itens em "bagzinhas"; setinha amarela se o RPM fica fora de 72–105 por 0,7 s.
  Direita: RPM (faixa verde 75–100), FC (55/190 padrão, atraso 1,5 s, drift pela fadiga, zonas Z1–Z5), W' em kJ (100% = 20 kJ).
  Teclado ↑/↓ (ou W/S), controle direcional ↑/↓. Perna gira no RPM real (pedalada.js). Ranking: dono disse "não se preocupe".
  Robô (Node, 90 rpm, marcha automática): sem itens ~165 W médios chega (fadiga 82), ~215 W quebra; com itens ~200 W (82),
  ~210 W (91). teste_v2.py não serve mais para o Contrarrelógio (testa o acelerador antigo). Backup: `backup/src_2026-11-17_antes_marchas/`.
  Em aberto: painel CONTROLES ainda descreve o acelerador; subida arcade e marchas nos outros modos só se o teste agradar.
- 17/11 (depois): dono achou difícil com 1 volta por toque → **cada toque = uma perna** (`MAR.volta` .5: 3 toques/s = 90 rpm;
  `ivMin` .12, sem tocar por 1 s = roda livre). Para voltar: `MAR.volta=1`.
- **17/11 (noite) — RITMO POR ZONAS (proposta A; marchas saíram, código guardado em `MAR.modo='marcha'`):** `MAR.modo='ritmo'`.
  Toque = uma perna; o RPM dos toques dá os watts (`MAR.ritmo.W`): verde 65–85 rpm (2,2–2,8 toques/s, 70–90% FTP, "PERFEITO",
  fadiga ×0,9, quadro do RPM brilha) · amarela até 105 (ATAQUE, até 140%) · vermelha acima (SPRINT). Gás = bater mais rápido.
  Sem coluna de marchas; itens nas bagzinhas no canto esquerdo; FC e W' ficam. Robô 50 km: 65 rpm 174 W fadiga 40 · 75 rpm
  199 W fadiga 83 · 80 rpm 211 W quebra sem itens (com itens chega) · 85 rpm 225 W com itens fadiga 78.
