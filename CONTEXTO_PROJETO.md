# CONTEXTO DO PROJETO — Time Trial V2

Documento de referência das mecânicas **como estão implementadas** na versão empacotada (montagem de 15/11/2026).
Tudo aqui foi conferido no código-fonte de `src/js/`. Os parâmetros numéricos e onde mudá-los estão em
[`BALANCEAMENTO.md`](BALANCEAMENTO.md). O que ainda não existe está em [`PENDENCIAS.md`](PENDENCIAS.md).

Quem é o dono: **Jefferson** (Castelo Comunicação, Itu/SP). O jogo fica no site dele, em WordPress:
`agenciacastelo.com.br/timetrial/`. Ele é ciclista amador (FTP real ~245 W), conversa em português do Brasil
e quer um jogo arcade, mas com sensação de pedal de verdade.

---

## 1. Visão geral

Jogo 2D de ciclismo em **HTML5 canvas** (1536×864 lógicos, escala para a tela), **JavaScript puro** (sem framework,
sem bundler, sem dependências em tempo de execução). Funciona no celular (toque) e no computador (teclado/mouse).

Dois modos na tela "ESCOLHA O MODO":

| Modo | O que é | Ranking |
|---|---|---|
| **Contrarrelógio** (`MODO='crono'`) | 50 km sozinho, FTP fixo 250 W, 3 subidas. Herdado da V1. | **Único modo que envia tempo ao ranking** (só na versão montada com `--rank-api`, no plugin) |
| **Carreira** (`MODO='carreira'`) | Hub com ciclista, habilidades, loja, conquistas e PEDALAR → **Pedal Livre**, **Rachão**, **Corrida** | Sem ranking; progresso no navegador |

A **V1** (pacote `time-trial-pacote`, ranking oficial `timetrial/v1`) é outro jogo e **não faz parte deste pacote**;
nunca deve ser alterada.

---

## 2. Arquitetura

- `src/index.html` carrega `css/style.css` e os scripts **em ordem** (a ordem importa: módulos posteriores
  "embrulham" funções dos anteriores):

```
assets.js → base.js → ranking.js → mecanica.js → estado.js → audio.js → paineis.js → entrada.js → desenho.js
→ npc.js → corrida.js → carreira.js → livre.js → extras.js → ciclistas.js → compartilhar.js → contagem.js → principal.js
```

- Todos os scripts compartilham o **escopo global** (variáveis `let/const` de topo e funções globais).
- **Padrão de extensão por embrulho** (usado em todo o projeto): um módulo guarda a função anterior e a substitui:
  ```js
  const _livUpdate=update; update=function(dt){_livUpdate(dt); if(LV&&state==='run')livrePasso(dt)};
  ```
  Funções embrulhadas várias vezes: `update`, `reset`, `finish`, `draw`, `overlay`, `npcHud`, `npcDesenhar`, `hud`,
  `staminaBar`, `itemArte`, `eat`, `drink`, `audioTick`, `toSelect`. Para mudar um comportamento, ache a camada certa
  (geralmente o módulo mais específico) em vez de reescrever a função base.
- `src/js/rig.js` existe mas **não é carregado** (protótipo de ciclista por peças, reprovado pelo dono).
- `tools/montar_arquivo_unico.py` gera **um HTML único** com imagens, sons e fontes em base64 e carimba
  `VERSAO` (data/hora de Brasília). Em `src/` sem montar, `VERSAO='dev'`.

### Módulos

| Arquivo | Responsabilidade |
|---|---|
| `assets.js` | Mapas `SRC` (imagens), `SND` (sons), `META` (dimensões de quadros dos sprites) e carregamento em `IMG`. |
| `base.js` | Canvas, `W/H`, `VERSAO`, fonte `FT()`, recortes `NUT` (itens), ícones. |
| `ranking.js` | Cliente do ranking (`RK`); liga só se montado com `--rank-api`. `uid` em `localStorage tt2_uid`. |
| `mecanica.js` | **Física, potência, stamina, fadiga, água/gel** do jogador; bloco `AJ`; `terrain()`, `climbs`, `rampas`, `reset`, `finish`, `update`. Roda no Node (sem DOM). |
| `estado.js` | Variáveis de UI (mouse, botões, painel). |
| `audio.js` | Música/efeitos, loops (pedal, roda livre, caminhão, furgão), `SET` em `localStorage tt2_set`. |
| `paineis.js` | Painéis (configurações, ajuda). |
| `entrada.js` | Toque/mouse/teclado; pausa ao trocar de aba. |
| `desenho.js` | Telas, mundo com zoom, estrada com perfil fixo, câmera, cenário, HUD, barra de stamina, sprites do jogador (`SPR`). |
| `npc.js` | Desenho dos NPCs (sprites tingidos com máscaras + cache), vácuo do jogador, avisos. Código antigo de NPC de potência fixa (`ROTEIRO`, `npcChefe`) ainda existe, mas não é usado (`ROTEIRO=[]`). |
| `corrida.js` | Largada em massa (14 NPCs + você), tipos de ciclista, **diretor de fugas**, pórticos/cones/faixa, colocação. |
| `carreira.js` | Modos, Carreira (`CAR`, salvamento `CS`), aplicação do modo (`aplicarModo`), resultado (`finish`), telas do hub, loja, bolso, habilidades. |
| `livre.js` | Pedal Livre: kit/bolso, relevo gerado, caminhão, furgão, torcedor, moedas, itens do jogador, patente do pedal, fim do pedal. |
| `extras.js` | Efeitos coloridos ao usar itens, som one-shot `tocar()`, moeda girando, pílula de moedas no HUD, km de vácuo, **Conquistas**. |
| `ciclistas.js` | **Cérebro dos NPCs** (fisiologia, decisões, vácuo, itens, quebra, abandono, falas) para os 3 modos da Carreira; população do Pedal Livre; recursos compartilhados. |
| `compartilhar.js` | Botão COMPARTILHAR e card 1080×1920 (`SHARE_URL`). |
| `contagem.js` | Contagem 3-2-1-VAI com bipes; largada rolando (`VROLL=16` km/h) na corrida/rachão. |
| `principal.js` | Laço principal (`requestAnimationFrame`). |

---

## 3. Tempo, distância e escala

- `update(dt)` recebe **segundos reais**. Distância e relógio andam em **tempo de prova**: `dist += speed·dt/3600·SCALE`.
- `SCALE` (segundos de prova por segundo real): Contrarrelógio 75; Carreira: Pedal Livre 40, 30 km 32, 50 km 48, 80 km 62, 100 km 70
  (`CAR.prova`). Ex.: 30 km da Carreira ≈ 2 min reais.
- Gameplay do jogador (stamina, rampa do botão, decaimento) em **segundos reais**. A fadiga do jogador na Carreira é
  reescalada por `SCALE/75` para valer o mesmo **por km** em qualquer distância.
- NPCs usam **segundos de prova** (`dt·SCALE`) na fisiologia → o mesmo NPC rende igual em qualquer modo.
- Mundo: o chão anda `9·3600/SCALE` px por km (`PX_KM`, `pxCen()`); NPCs usam a mesma escala (senão "andam de ré" na subida).

---

## 4. Física (jogador e NPCs)

`m·dv/dt = η·P/v − m·g·(sen θ + Crr·cos θ) − ½·ρ·CdA·(1−vácuo)·v²`
(`resist()` em mecanica.js; `rRes()` em ciclistas.js para NPCs). CdA 0,30 · Crr 0,004 · ρ 1,2 · η 0,976.
Integrada em 4 subpassos com `dt·AJ.kin` (inércia ≈ 2 s). `v` limitada a [1,1 m/s; 80 km/h]; força P/v limitada por `vmin`.
Massa: jogador `AJ.peso + AJ.bike` (Contrarrelógio 70+8; Carreira 74 − escalada + 8); NPC `r.m + AJ.bike`.

Relevo:
- `terrain(km)` (mecanica.js) devolve a inclinação (%) a partir de `climbs` (subidas com rampa suave, platô, descida) e,
  no Pedal Livre, de `rampas` `{a,b,g}`.
- Contrarrelógio: 3 subidas (5,5% · 6,5% · 7,5%). Rachão/Corrida: perfis de `CAR.prova[km].climbs`.
- **Pedal Livre:** relevo gerado à frente por `gerarSubidas()` (livre.js): curta e forte, longa, dupla, descida em degraus
  e "muro" de até ~18% com descida longa. Fica mais duro com a distância.
- Visual: estrada com perfil fixo no mundo (`alt(km)`, `vsl(g)`), câmera travada no ciclista que só baixa antes de descidas
  (`camPasso`, `EYB`). O visual das subidas é exagerado (`VIS_INC`) sem mudar a física.

---

## 5. Botão de pedalada (potência do jogador) — TODOS os modos

> **Atualização 16/11/2026:** o modelo de toque/sprint descrito abaixo **não é mais usado**. Todos os modos usam o
> **acelerador** (bloco `AJ.emp*` em mecanica.js; ver CLAUDE.md "Estado"): apertado sobe os watts (150 W/s, segurando > 1,2 s
> vira sprint), solto descem ~50%/s até 0 (sem apertar não pedala), stamina = bateria acima do FTP + gasto por aperto,
> fadiga pela tabela `empFad` (na Carreira × `CAR.fad`·(1−0,05·fôlego)·SCALE/75). Atributos: Recuperação +6%/nível em
> `empRecupera`; Sprint +40 W de `pMax` e +5%/nível em `empWp`. Ritmo 0,4 s apertado / 0,6 s solto ≈ 190–200 W em qualquer modo.

Implementado em `update()` de `mecanica.js` (estado `pTap`, `boostAnt`, `holdT`). Decisão do dono em 15/11/2026,
inclusive para o Contrarrelógio ("não vamos nos prender ao ranking").

- **Sem apertar:** potência = cruzeiro `cruiseW()` = `FTP·AJ.cruise` (Contrarrelógio 70%, Carreira 42%), caindo a 0
  entre −2,5% e −5% de descida (roda livre). Com stamina < 1,5 o cruzeiro ×0,83.
- **Cada toque (borda de apertar) = uma pedalada:** soma `(1−cruise)·FTP/(tapFtp·tapTau)` a `pTap`, que some em
  ~`tapTau` (1 s). A potência acompanha `cruzeiro + pTap` em ~0,12 s (`tapSuave`).
  Resultado: o **ritmo dos toques** define os watts. Medido (Carreira): 1 toque/s ≈ 70% do FTP · 1,5/s ≈ 85% · 2/s ≈ 95–100%.
- **Cada toque gasta stamina** `curva(staTap, intensidade)` e **só rende o que a stamina paga** (`kTap = min(1, stamina/custo)`).
  Sem stamina a perna não empurra: o ritmo sustentável fica ~85–90% do FTP; a 2 toques/s a stamina acaba em ~40 s reais.
- **Segurar > `tapSegura` (0,25 s) = SPRINT:** sobe `AJ.rampa` (320 W/s) a partir do valor atual até `pMax`
  (Contrarrelógio 1000 W; Carreira 700 + 40·sprint), gastando stamina por segundo (`staGasto`). Ao soltar, decai como pedalada.
- **Stamina solta** (nem apertando, nem segurando) recupera `staRecupera` por segundo (11,6/s; ×(1+0,06·recuperação) na Carreira),
  até o teto `100 − fadiga`. Com o dedo apertado (antes de virar sprint) não recupera. Com stamina ≤ 0,5 o botão não funciona.
- `AJ.tau` está marcado "(antigo)" e não é mais usado pela potência.

Histórico do botão (para não repetir): (1) V1/V2 original: segurar sobe 320 W/s, soltar cai com τ 1,2 s;
(2) teste "acelerador" τ 3,5 s + stamina só recupera com watts baixos — **reprovado** ("a stamina demora a voltar");
(3) opção B: τ 2 s, stamina volta na hora — "quase"; (4) **atual: pedalada por toque** (pedido do dono: "cada toque é uma
perna; para manter 250 W tem que ser constante; segurar = sprint").

---

## 6. Stamina e fadiga do jogador

- **Barra:** verde = stamina atual; vermelho = o resto (100 − stamina). Sempre encostados, sem espaços (pedido do dono).
  Efeito colorido na barra ao usar itens (extras.js).
- **Fadiga (interna) nunca diminui sozinha;** só água, isotônico, banana, gel e gel azul tiram. Ela é o **teto** da stamina.
  Por segundo: `fadResist` (sempre) + `curva(fadInt, potência real/FTP) × tanque` (até ×1,5 com stamina vazia)
  + `fadExausto` se aperta com stamina < 4. Fadiga 100 = **"VOCÊ QUEBROU!"** (fim da prova).
- Carreira: fadiga ×1,5 no iniciante (`CAR.fad`), −5% por ponto de FÔLEGO, reescalada por `SCALE/75`.
- **Pedal longo (Carreira):** depois de 2 h de prova, +15% da resistência por hora (até +45%) (livre.js, fim do arquivo).

---

## 7. Itens do jogador

| Item | Efeito (jogador) | Onde |
|---|---|---|
| Água (5 goles; 7 com a garrafa 700 ml) | −8 de fadiga ao longo de 2 s; não acumula (uma por vez) | `drink()` mecanica.js; `beber700()` livre.js |
| Isotônico (garrafa de 5 goles) | −9 de fadiga (em 1,5 s) e +12 de stamina, **sem gás** ("um pouco melhor que a água") | `tomarIso()` livre.js, `LIV.iso*` |
| Banana (até 5 no bolso) | −6 de fadiga e +40 de stamina | `comerBanana()` |
| Gel (até 3 no bolso; Contrarrelógio 2) | −40% da fadiga na hora. **Na Carreira cada gel rende menos:** 100%, 75%, 55%, 40% do efeito | `eat()` + embrulho em livre.js (`LIV.gelRende`) |
| Gel azul (máx. 1 por pedalada) | zera a fadiga e enche a stamina ("vida extra") | `gelAzul()` |
| Energético | stamina cheia + 4 s de "gás" (+12 stamina/s). **Código existe, mas nada solta energético hoje** (o furgão solta gel) | `pegar('energetico')` |

Teclas: Espaço = pedalar/sprint · A = água (A com água básica vazia = 700 ml) · G = gel · I = isotônico · B = banana ·
Z = gel azul · P/Esc = pausa · M = som. No toque: botões na tela (raio = pedalar).

**16/11/2026:** água 700 ml fora da loja e do bolso (o código de `agua7` continua, desligado). Torcedor: com a garrafa
cheia, você bebe ali (efeito de um gole, −8 de fadiga); com espaço, +1 gole. Bolso = água + iso + banana + gel (4 itens).

**Bolso (antes de pedalar na Carreira, tela "BOLSO"):** a água básica sempre vai; escolha até 3 itens do estoque
(isotônico, banana, gel, água 700 ml). O gel azul vai à parte. Sobras de banana/gel voltam ao estoque; garrafas são gastas ao levar.
**Regulamento da Corrida oficial:** só água, isotônico e gel (banana, água 700 ml e gel azul ficam em casa; `REGRA_CORRIDA`).
O Rachão aceita tudo.

---

## 8. Carreira

### Salvamento
`localStorage['tt2_car']` (JSON, `v:2`), objeto global `CS`:
`nome, skin, nivel, xp, pontos, moedas, inv{banana,gel,iso,azul,agua7}, mochila[] (bolso), sk{motor,folego,recup,escalada,sprint},
pat (patente), rec{km:tempo}, melhorPos{km}, recLivre, livres, treinos, corridas, vitorias, conq{}, conqNovas[], titulo, up{}`.
"zerar carreira" no hub (toque duas vezes) apaga tudo. Outras chaves: `tt2_uid` (ranking), `tt2_set` (som).

### Telas (`state`)
`title` → `modo` → (Contrarrelógio: `select` → `run`) ou (Carreira: `nome` na 1ª vez → `carreira` (hub)).
Hub: `habil` (HABILIDADES), `loja`, `pedalar` (Pedal Livre / Rachão / Corrida), `conquistas`; `treino` (escolha da distância do Rachão),
`mochila` (BOLSO); na prova `run`, `paused`, `over`.

### Nível, XP e atributos
- Nível 1–25 (`CAR.nivelMax`), XP para subir `xpNec(n)=40+15n`. Cada nível dá 1 ponto; começa com 1 ponto.
- Atributos (`ATR`, máx. 10 cada): **MOTOR** (+4 W de FTP) · **FÔLEGO** (−5% de fadiga) · **RECUPERAÇÃO** (stamina volta +6%) ·
  **ESCALADA** (−1 kg) · **SPRINT** (+40 W de pico e −5% de gasto acima de 160%).
- **FTP orgânico:** `ftpDe(nível, motor) = 180 + 6,5·(nível−1) + 4·motor`. Nível 25 com motor 10 ≈ 376 W (meta do dono:
  "o nível 25 é um profissional"; ~66 kg ≈ 5,8 W/kg). Iniciante: 180 W, 74 kg.
- Builds sugeridas (texto): Escalador, Sprinter, Clássico, Rolador (`CAR.builds`). Reset de pontos na loja.
- Skins (branco/azul/vinho): **só visuais**; escolhidas no hub (retrato grande + setas).

### Patentes (`CAR.patentes`)
Iniciante (30 km, força 190) · Intermediário (30, 205) · Esporte (50, 220) · Elite (50, 235) · Semiprofissional (80, 250) ·
Estrela Nacional (80, 265) · Nível Mundial (100, 285). **Só vencer a Corrida sobe a patente.** A patente define a distância da
Corrida e libera distâncias do Rachão (`CAR.libera`: 30/50/80/100 nas patentes 0/2/4/6).

### Pedal Livre (`carTipo='livre'`)
- Estrada sem fim (`GOAL=9999`, `SCALE` 40). Acaba quebrando ou em ENCERRAR (pausa). Recorde pessoal `CS.recLivre`.
- Na estrada:
  - **caminhão de banana:** a cada 25–40 km; buzina; vácuo de 50%; fique perto 5 s → 1 banana vai para o bolso;
  - **furgão:** 1 vez por janela de 30 km; o motor fica mais alto conforme chega; derruba um gel no asfalto;
  - **torcedor com água:** a cada 9–15 km (×(1+km/30)); passou perto = +1 gole;
  - **fileiras de moedas** (sprite girando, som "plin");
  - **ciclistas NPC** (seção 9).
- **Patente do pedal** pela média (absoluta): Cicloturista <24 · Pedal de Domingo 24 · Ritmo de Grupo 27 · Treino Forte 30 ·
  Elite 33 · Pro ≥36 km/h. Multiplica XP (`m`: ×1 a ×2,5) e moedas (`mm`: ×1 a ×1,6). Aparece na tela final.
- **XP:** 0,6/km × m + 0,5/km de vácuo × m + 20 por recorde.
- **Moedas:** (0,35/km + 0,2/km de vácuo) × mm + moedas pegas na pista + 20 por recorde.
  Referência: 90 km a ~34 km/h ≈ 100 moedas.

### Rachão (`carTipo='treino'`; "corrida clandestina")
- Largada em massa com 14 NPCs, sem pórticos (faixa branca na chegada).
- Distâncias 30/50/80/100 conforme a patente; caminhão, furgão e torcedor também aparecem (`LV.eventos`).
- **Força:** `max(força da patente, seu FTP)`, mais **3–4 "cascudos" ×1,10–1,15**.
- XP pela colocação ×0,7 + recorde; moedas pela colocação. Não sobe patente. Quebrou: XP por km.

### Corrida (`carTipo='corrida'`)
- 15 ciclistas (você + 14), pórticos LARGADA/CHEGADA com cones, largada rolando + contagem.
- Distância da patente. **Força do pelotão: `max(força da patente, seu FTP)`** (a categoria acompanha você).
- Diretor de fugas (corrida.js): até 2 fugas de rolador/escalador descansado; escaladores atacam na subida final; todos
  sprintam no último km.
- HUD "POSIÇÃO x/15 · LÍDER".
- XP e moedas pela colocação (`CAR.xpPos`, `CAR.moedas.pos`); **1º lugar sobe a patente**.

### Abandono (todos os modos da Carreira)
Botão na pausa ("ENCERRAR" no Pedal Livre / "ABANDONAR" no Rachão e na Corrida): **sem XP** e só **80% das moedas
daquele pedal**.

### Conquistas (extras.js, `CONQ`)
| Conquista | Como ganha | Recompensa |
|---|---|---|
| Primeiro Giro | 30 km no Pedal Livre | +1 banana |
| Meio Centenário | 50 km | +2 bananas |
| Pernas de Aço | 70 km | +3 bananas |
| Centurião | 100 km | +2 géis |
| Papa-Vácuo | 10 km no vácuo em um pedal | +1 isotônico |
| Senhor da Estrada | todas as de distância | +3 géis e o título "Senhor da Estrada" (aparece sob o nome no hub) |

Aviso na tela com som; tela CONQUISTAS no hub (marca "NOVA").
Os nomes e as recompensas de 70/100 km e Papa-Vácuo foram escolhidos pelo Claude; o dono pediu 30 km → 1 banana,
50 km → 2 bananas, "todas as de distância" → 3 géis e um título, e 10 km de vácuo → conquista.

### Loja (`CAR.loja`)
Banana 20 · Gel 60 · Isotônico 40 · Gel azul 600 · Água 700 ml 50 · Resetar pontos 250 (moedas).

---

## 9. NPCs (ciclistas.js + corrida.js + npc.js)

### Fisiologia (cada NPC)
- `ftp` (W), `m` (kg), `Wp` (reserva acima do FTP, a "stamina", J), `pico` (sprint ×FTP), `atq` (ataque ×FTP), `end` (resistência,
  divide a fadiga), `rec` (recuperação da reserva), `agr` (vontade de atacar/seguir), `vacEf` (aproveitamento do vácuo),
  `Fend` (até que fadiga aceita chegar; **>100 = "afoito"**, sai forte demais e quebra).
- Estado: `res` (0–100, volta abaixo de 90% do FTP efetivo) e `fad` (0–100, acumula por hora conforme `FIS.H(P/FTP)/end`;
  só itens tiram).
- **FTP efetivo cai com a fadiga** (`capF`: acima de 40, até −50% em 100) → a velocidade cai suave, com inércia.
- **Estágios:** ok → cansado (55) → fadigado (72: não ataca, segura menos roda) → quebrado (86: pedala ≤85% do FTP efetivo;
  **definitivo**, item não desfaz) → abandona (100, ou quebrado há muito tempo, `desiste`).
- **Ritmo próprio:** escolhe a intensidade pelo "orçamento" de fadiga até o fim do pedal dele (corrida: até a chegada;
  Pedal Livre: `kmPlano`). Afoito força pelo menos `ritEx` (92–100% do FTP) até quebrar.
- **Nunca há velocidade fixa nem quebra por km programado.**

### Comportamento
- **Seguir roda:** calcula a potência para ficar ~72 px atrás de quem vai à frente (até 900 px) e limita ao que aguenta.
  Se não aguenta, solta ("NÃO DÁ...", "PODE IR...").
- **Passar** quem está lento para ele; **revezar:** quem puxa sai da frente após um turno ou com pouca reserva.
- **Atacar** (descansado e em grupo; afoitos atacam mais) e **fuga**.
- **Corrida/Rachão:** ritmo de grupo `média de FTP × CORR.ritmo (0,86)`; **perseguição:** se alguém (você ou um NPC) escapa
  até 7000 px, os descansados caçam a ~95–107% do FTP efetivo, revezando rápido; sprint no último 1,1 km.
- **Pedal Livre:** fila de no máximo 5 (`grupoMax`; o 6º não gruda). Quem puxa um grupo aperta +6% por seguidor.
- **Itens dos NPCs** (mesmas regras do jogador, na escala da fadiga deles, que enche ~2,7× mais devagar):
  água −3, isotônico −3,4 (+12 de reserva), gel −15%, banana −2,2 (+40 de reserva).
  Carregam 2–4 águas e 0–1 gel; na Corrida/Rachão 3 águas, 5 goles de isotônico e gel conforme a distância (no Rachão +1).
- **Falas** (balão com nome): ao atacar ("VAMO!", "QUEM VEM?"…), ao soltar, ao quebrar ("TÔ QUEBRADO...") e parado
  ("DEU CÃIBRA!", "VOU DE UBER"…). Gringos falam em inglês. Nomes: ~65% brasileiros, ~35% estrangeiros.
- **Quebrado/abandono:** o NPC para e senta na beira com a imagem `fim_quebrou` (azul/vinho/branco conforme o sprite).
- **Brilho colorido** quando um NPC visível usa um item. Custou ~1,4 ms/quadro com 20 NPCs no teste; ainda não foi medido
  num tablet real.

### Pedal Livre: população
- **Absoluta**, com níveis de FTP (`FIS.niveis`): recreativo, intermediário, forte, muito forte, elite e pro (raro).
- **"Seu nível":** potência calculada pela sua média recente (+5%), para você poder pegar vácuo.
- **Desde 16/11:** largada sozinho, 1º encontro entre o km 3 e 6, depois a cada 6–10 km (`FIS.encIntervalo`); "do seu nível"
  só solo (10%) e com +12% de potência (`FIS.seuForca`). As linhas abaixo descrevem a versão anterior.
- Encontros a cada 3,5–6 km (`FIS.encontros`: solos, duplas, grupos de 2–3, pelotão de 4 "muito fortes", mistos).
- Mais lento que você aparece à frente; mais rápido, atrás. ~22% dos sorteados são afoitos e já chegam cansados.
- Máximo de 10 simulados (`popMax`). Cada um existe até 9 km atrás / 16 km à frente; fadigados e quebrados à frente
  ficam até 30 km, para você encontrá-los.
- Quem termina o próprio pedal (`kmPlano`) sai quando está fora da tela.

### Corrida/Rachão: grade
Tipos (`CORR.tipos`):
- escalador: 61 kg, ×0,97;
- sprinter: 77 kg, ×0,95, pico 2,6;
- rolador: 73 kg, ×1,05;
- fraco: 72 kg, ×0,86 (40% afoitos).

Grade: 3 escaladores, 3 sprinters, 4 roladores e 4 fracos. Cada FTP = força × tipo × (0,93–1,07).

### Recursos compartilhados
Cada ciclista tem o próprio registro de coleta; ninguém tira de ninguém. `LV.rec` guarda a água do torcedor e o gel do furgão;
quem cruza o ponto pega o seu. Banana do caminhão: quem fica na zona de vácuo dele por 5 s ganha a sua (`r.pegou['c'+id]`).
O jogador pegar um item não o remove para os NPCs.

### Vácuo do jogador
Atrás de um NPC (150–700 px) o arrasto cai até 25% (sozinho) / 30% (grupo) — `NPCK`. Atrás do caminhão, até 50% (`vacExtra`).
O HUD mostra "VÁCUO −x% ARRASTO". Km no vácuo contam para moedas, XP e conquista.

### Visual
Sprites de pedalada `p_{a,v,b}{0..3}` (azul, vinho, branco; 0 normal, 1 esforço, 2 em pé na subida, 3 sprint), tingidos por máscaras
`m_*_{p,s,h,w,b}` (uniforme, detalhe, capacete, meia/sapatilha, quadro) com 13 kits (`KITS`). Cache de quadros tingidos (72%, 240).
3 faixas (`lane`).

---

## 10. HUD e telas

- **HUD:**
  - pausa, cronômetro e, embaixo, a pílula de moedas (saldo + o que este pedal está rendendo) na Carreira;
  - barra de distância ("x km · recorde y" no Pedal Livre);
  - velocímetro e média; watts suavizados, % do FTP e FTP;
  - rampa (%) e elevação acumulada; perfil "próximos 9 km";
  - itens com contador; raio (pedalar);
  - barra STAMINA/FADIGA;
  - aviso de FUGA/ATAQUE na corrida e "POSIÇÃO x/15".
- **Sprites do jogador pela potência** (`SPR` em desenho.js): normal < 108% FTP · esforço 108–160% · sprint ≥ 160% ·
  em pé em subida > 3% e ≥ 130%.
- **Telas finais:** ilustração de vitória/quebra, linhas de XP/moedas, patente do pedal, vácuo, abandono, "NÍVEL x!",
  COMPARTILHAR.
- **Menus (desde 15/11/2026, maquetes do dono em `docs/maquetes_menu/`):** tema escuro — fundo de corrente `menu_bg`,
  cards marinho `#001638` com borda ciano, botão principal amarelo, títulos amarelos, pílulas brancas (VOLTAR, nível, moedas),
  ícones redondos em linha no topo direito (`ICN`, `ICN_R` em paineis.js). Paleta e helpers em desenho.js (`MN`, `menuFundo`,
  `cardMenu`, `btnVoltar`, `tituloGrande`, `tituloFaixa`, `txFit`); botões do hub em carreira.js (`botaoPrincipal`, `botaoMenu`).
  Home = imagem `menu_home` inteira (START faz parte da imagem; tocar em qualquer lugar avança). Hub = painel escuro na
  diagonal com luz ciano, pódio e o **retrato do ciclista escolhido** (`ret_azul/vinho/branco`, de `ciclistas/*/sprite(s) menu/menu N.png`;
  Luiz = azul, Roni = vinho, Jeff = branco); setas ◀ ▶ ou teclas ← → trocam `CS.skin`. Loja e Conquistas usam artes recortadas (`loja_*`, `conq_*`).
  `menu_bg` e `menu_home` vão em 1672×941 (sem perda / q95) e são reduzidos na hora (`telaCheia`).
- **Classificação (Rachão e Corrida):** botão verde CLASSIFICAÇÃO no canto da tela de resultado. `classifMontar()` (corrida.js)
  congela no `finish`: chegaram (por tempo; 1º com tempo, demais +diferença) → ainda na estrada (quanto faltava) → abandonos
  (você entra aqui se quebrou/abandonou). Colunas: posição, bandeira/país, nome, tipo (★ = cascudo), FTP, kg, W/kg, tempo, situação
  (CHEGOU, NA ESTRADA, EM FUGA, QUEBRADO, ABANDONOU/QUEBROU). País: `PAIS_GR` em ciclistas.js (brasileiros = BRA); bandeiras
  desenhadas em código (`BAND`, `bandeira()` em corrida.js).
  Os recortes saem de `tools/recortar_menu.py` (coordenadas no topo do script). O `bg_swirl` não é mais usado nem embutido.
- Sons: música de menu/jogo, pedalada, roda livre, caminhão, furgão (em loop por proximidade), moeda, buzina, bônus, bipes.

---

## 11. Ranking (WordPress)

- **Plugin "Time Trial V2 Ranking"** (`wordpress/plugin-fonte/`; zip `wordpress/time-trial-v2-ranking.zip` = **2.4.0**):
  - API REST `timetrial2/v1` (`/start`, `/score`, `/ranking`), tabela `wp_timetrial2_scores`, opções `tt2_secret` e `tt2_db_ver`;
  - só o Contrarrelógio envia, só vitórias, apelido de até 8 caracteres com filtro, melhor tempo por jogador, Top 10;
  - token assinado por corrida, **piso de 4.500 s**, limite por IP.
- Jogo servido em `/timetrial/` (com o plugin da V1 desativado) e `/timetrial-v2/`.
- **Nunca perder o ranking:** o plugin não tem desinstalação que apague a tabela, e a ativação só cria o que falta.
  Atualizar = enviar o zip e escolher "Substituir a atual pela enviada". Nunca "Excluir".
- **O zip 2.4.0 contém o jogo de 14/11/2026 22:09**, sem as mudanças de 15/11 (botão de pedalada, NPCs novos etc.).
  Ver PENDENCIAS.md.
- Detalhes: `docs/RANKING_WORDPRESS_V2.md`.
