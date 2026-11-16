# BALANCEAMENTO — parâmetros e onde mudar

Todos os números abaixo são os valores **atuais** do código. Depois de mudar qualquer um:
1. monte o HTML (`python3 tools/montar_arquivo_unico.py --saida /tmp/tt.html`);
2. rode as simulações relevantes (`tools/simulacao_npcs/`, `tools/balanceamento/`);
3. compare com as referências ao fim deste arquivo.

Regra do dono: **não mudar o balanceamento do jogador para compensar problemas dos NPCs**.

## 1. Jogador — `src/js/mecanica.js`, bloco `AJ`
Valores-base (são os do Contrarrelógio). A Carreira sobrescreve alguns em `aplicarModo()` (carreira.js).

| Parâmetro | Valor | Efeito |
|---|---|---|
| `ftp`, `peso`, `bike` | 250 W, 70 kg, 8 kg | Contrarrelógio (Carreira: `ftpDe()`, 74 − escalada) |
| `cruise` | 0,70 | potência sem apertar (Carreira: `CAR.cruise` 0,42) |
| `cruiseExausto` | 0,83 | multiplica o cruzeiro com stamina < 1,5 |
| `coastA`, `coastB` | −2,5%, −5% | o cruzeiro cai até 0 nessa faixa de descida |
| `tapFtp` | 2 | toques por segundo para manter o FTP |
| `tapTau` | 1,0 s | duração de cada pedalada |
| `tapSuave` | 8 | rapidez com que a potência acompanha os toques |
| `tapSegura` | 0,25 s | segurar mais que isso = sprint |
| `staTap` | [[.5,4],[.7,5.5],[.85,7],[1,7],[1.15,8],[1.3,9],[1.6,12],[2,15]] | stamina por toque × intensidade |
| `rampa` | 320 W/s | subida no sprint |
| `pMax` | 1000 W | teto (Carreira: 700 + 40·sprint) |
| `staGasto` | [[.7,14],[1,20],[1.2,25],[1.6,36],[2,42],[3,48],[4,55]] /s | stamina por segundo segurando (sprint) |
| `staRecupera` | 11,6/s | recuperação solto (Carreira ×(1+0,06·recuperação)) |
| `fadResist` | 1,35/s | fadiga sempre (Carreira ×1,5 ×(1−0,05·fôlego) ×SCALE/75) |
| `fadInt` | [[.7,0],[1,.6],[1.2,1.3],[1.5,2.8],[2,5],[3,6],[4,7]] /s | fadiga pela potência real |
| `fadTanque`, `fadTanqueExp` | 0,5, 2 | esforço com stamina vazia custa até ×1,5 |
| `fadExausto` | 1,5/s | apertar com stamina < 4 |
| `aguaQtd`, `aguaFad`, `aguaSeg` | 5, 8, 2 s | água |
| `gelQtd`, `gelFrac` | 2, 0,40 | gel (Carreira: gel vem do bolso; rendimento decrescente `LIV.gelRende`) |
| `cda`, `crr`, `rho`, `eta` | 0,30, 0,004, 1,2, 0,976 | física |
| `kin` | 6 | inércia |
| `tau` | 2 | **(antigo) não é mais usado pela potência** |

Medição do botão (Carreira, sem fadiga; `tools/simulacao_npcs/toques.py`):

| Toques | Potência | Stamina |
|---|---|---|
| 0/s | 42% | — |
| 1/s | 71% | estável |
| 1,5/s | 85% | estável |
| 2/s | ~95% | acaba em ~40 s |
| 3/s | ~86% | sem stamina, não rende mais |
| Segurar 3 s | pico 700 W | — |

## 2. Carreira — `src/js/carreira.js`, objeto `CAR`

| Parâmetro | Valor |
|---|---|
| `ftp`, `ftpNivel`, `ftpMotor` | 180 + 6,5·(nível−1) + 4·motor (`ftpDe`) |
| `peso`, `fad`, `cruise` | 74 kg, 1,5, 0,42 |
| `prova` | SCALE e subidas por distância: livre 40 · 30 km 32 · 50 km 48 · 80 km 62 · 100 km 70 |
| `patentes` | Iniciante 190 · Intermediário 205 · Esporte 220 · Elite 235 · Semiprofissional 250 · Estrela Nacional 265 · Nível Mundial 285 (força) + distância da corrida |
| `libera` | distâncias do Rachão por patente {30:0, 50:2, 80:4, 100:6} |
| `xpPos` | 150, 100, 75, 45, 45, 45, 30, 30, 30, 30, 20… (Rachão ×0,7) |
| `moedas.pos` | 80, 50, 35, 20, 20, 20, 12, 12, 12, 12, 8… |
| `moedas.rachaoKm` | 1 (usada no abandono: 80% de km×1) |
| `xpKm`, `xpRecorde` | 1, 15 |
| `max`, `nivelMax` | 10 pontos por atributo, nível 25 |
| `loja` | banana 20 · gel 60 · isotônico 40 · gel azul 600 · água 700 ml 50 · reset 250 |
| `xpNec(n)` | 40 + 15n |
| `med`, `xpMed` | medalhas de média do antigo "treino" (sem uso no fluxo atual; ver PENDENCIAS) |

Força do pelotão: `reset` em carreira.js → `corridaIniciar(Math.max(pat().forca, FTP), …)`.
Cascudos do Rachão em `corridaIniciar` (corrida.js): 3–4 riders ×1,10–1,15.

## 3. Pedal Livre e itens — `src/js/livre.js`, objeto `LIV`

| Parâmetro | Valor |
|---|---|
| `xpKm`, `xpRec` | 0,6/km, 20 |
| `moedaKm`, `moedaVac`, `moedaRec` | 0,35/km, 0,2/km de vácuo, 20 |
| `bananaFad`, `bananaSta` | 6, 40 |
| `isoFad`, `isoSta`, `isoSeg`, `isoGas` | 9, 12, 1,5 s, 0 (sem gás) |
| `energGas`, `gasSta` | 4 s, +12/s (energético, hoje sem fonte) |
| `gelRende` | [1, .75, .55, .4] |
| `vacVeic`, `vacSeg` | 50% de vácuo do caminhão, 5 s perto = banana |
| `caminhaoRitmo`, `caminhaoTempo`, `furgaoExtra` | 105% do seu FTP, 16 s seguindo, +26 km/h |
| `PAT_PEDAL` | médias 0/24/27/30/33/36 · XP ×1/1,2/1,4/1,7/2/2,5 · moedas ×1/1,1/1,2/1,35/1,5/1,6 |
| `MOCH` | banana ≤5, gel ≤3 por pedalada |
| `REGRA_CORRIDA` | ['iso','gel'] |

Frequências (em `livreNovo`/`livrePasso`):
- caminhão: primeiro aos 6–12 km, depois a cada 25–40 km;
- furgão: 1 por janela de 30 km;
- torcedor: a cada 9–15 km × (1 + km/30);
- moedas: a cada 6–10 km, 3–4 por fileira.

Pedal longo: fim de livre.js, +15% da resistência por hora depois de 2 h (máx. +45%).

## 4. NPCs — `src/js/ciclistas.js`, objeto `FIS` (+ `SABOR`)

| Parâmetro | Valor | Efeito |
|---|---|---|
| `H` | [[.4,4],[.5,7],[.6,11],[.7,17],[.8,27],[.9,45],[1,75],[1.1,120],[1.3,250],[1.6,500],[2.2,900],[3,1400]] | fadiga por **hora** × P/FTP |
| `capIni`, `capQueda`, `capExp` | 40, 0,5, 1,6 | queda do FTP efetivo com a fadiga |
| `recup` | 240 s de prova | recuperação da reserva |
| `exausto` | 60/h | insistir no limite (reserva vazia, ou afoito fadigado) |
| `est` | cansado 55 · fadigado 72 · quebrado 86 · abandona 100 | estágios |
| `vac`, `vacCurva` | 0,30, [[0,.6],[45,1],[440,1],[660,0]] | vácuo entre NPCs no Pedal Livre (na corrida usa `NPCK.vac`) |
| `seguirMax`, `espaco` | 900 px, 72 px | |
| `turno` | 100–260 s | revezamento |
| `ataquesH` | 1,6/h × agr | afoito ×3 |
| `agua`, `iso`, `gel`, `bananaFad`, `bananaRes` | 3, 3,4, 15%, 2,2, 40 | itens dos NPCs |
| `niveis` (FTP W / kg) | recreativo 178–204 / 72–86 · intermediário 205–232 / 70–82 · forte 228–250 / 66–76 · muito forte 250–268 / 64–72 · elite 274–310 / 60–70 · pro 350–420 / 62–72 | população absoluta |
| `encontros` | probabilidades por tipo/tamanho de grupo | |
| `popMax`, `grupoMax` | 10, 5 | |
| `perseguir` | 7000 px | caça na corrida/rachão |
| `longe` | −9 / +16 / +30 km | sai da simulação (o último vale para fadigado/quebrado à frente) |

Também em ciclistas.js:
- `ciclNovo`: afoito 14% (Pedal Livre 22% em `ciclPopular`); `Fend` normal 72–84, afoito 104–122; `ritEx` 0,92–1,0;
  `desiste` 300–1500 s; itens iniciais.
- `ciclDoNivel('seu')`: 105% da sua média, FTP = P/0,68.
- `ciclPopular`: encontros a cada 3,5–6 km; fadiga inicial de 0 a 55 (afoito 45–70).

Corrida (`corrida.js`, `CORR`): tipos (peso, ×força, pico, end), grade, `ritmo` 0,86, `espaco` 72, `vac` 0,30;
`Fend` dos fracos (40% afoitos) e itens em `corridaIniciar`.
Vácuo do jogador (`npc.js`, `NPCK`): `vacSolo` 0,25, `vacPel` 0,30, curva [[50,0],[120,1],[440,1],[660,0]] px.

## 5. Referências de calibração (simulações de 15/11/2026)

### Pedal Livre, 100 km sozinho, relevo do Pedal Livre (`TESTES()`)

| Nível | Média (km/h) | Meta do dono |
|---|---|---|
| Recreativo | ~24,7 | 24–27 |
| Intermediário | ~27,4 | 27–30 |
| Muito forte | ~31,9 | 32–33 |
| Pelotão de 4 muito fortes | ~32–34 | ~33 em grupo, exceção e não regra |

Outros resultados:
- Intermediário tentando seguir os muito fortes: solta entre os km 25 e 45.
- Atacante compulsivo: quebra entre os km 42 e 50 e abandona.
- Afoito: sem itens quebra no km ~50; com itens, no km ~80.
- Dupla revezando: mesma velocidade, ~10% menos fadiga.

### Corridas
- Força 205 com robô constante a 95% do FTP: 4º–6º (igual à versão anterior aos NPCs novos).
- Nível 9, FTP 264, atacando com isotônico e gel: 4º–8º (antes vencia sempre).
- 100 km: ~2 quebrados e 1 abandono por prova.

### Pedal Livre no jogo, 90 km (`pedal_livre.py`)
~5 ciclistas na tela em média (pico 9–13), 15–26 vistos, ~100 moedas.
