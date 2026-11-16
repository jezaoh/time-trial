> **Documento histórico (13/11/2026).** Descreve o Contrarrelógio V2 original. O botão mudou em 15/11/2026 para o modelo de *pedalada por toque* — o estado atual está em `CONTEXTO_PROJETO.md` §5 e os valores em `BALANCEAMENTO.md`.

# Mecânica V2 — acelerador, stamina e fadiga

Parâmetros no bloco `AJ` (AJUSTES), no topo de `src/js/mecanica.js`. Curvas = tabelas `[intensidade, valor]` com interpolação
linear (intensidade = potência / FTP). Tempos em **segundos reais**; distância e relógio ×75.

## 1. Acelerador
- Pressionado: a potência sobe **320 W/s, linear, desde o 1º quadro**, a partir do valor atual (+32 W em 0,1 s · +64 em 0,2 s ·
  +160 em 0,5 s · +320 em 1 s). Segurando, chega a ~970 W em ~2,5 s, quando a stamina acaba.
- Solto: começa a cair no mesmo quadro, suave, até 175 W (constante de 1,2 s). Teto fixo de 1.000 W.
- Teclado e botão de toque ligam a mesma variável (`boost`) no próprio evento; não há filtro nem tempo mínimo entre toques.
- O número do HUD e o sprite usam suavização de ~0,05 s; a física usa a potência real.

## 2. Stamina (barra verde)
Energia de curto prazo. **Pressionado:** gasta conforme a potência (`staGasto`: 20/s a 250 W, 36/s a 400 W, 55/s a 1.000 W).
**Solto:** recupera 11,6/s na hora (V1), até o teto `100 − fadiga`. Com stamina ≤ 0,5 o botão não funciona (V1).
Barra: **verde = stamina atual, vermelho = 100 − stamina**, sempre encostados.

## 3. Fadiga (interna) — nunca diminui sozinha
`fadiga/s = 1,35 (sempre) + esforço(potência real) × tanque + 1,5 se pressiona com stamina < 4`
- Esforço (`fadInt`): 0 até 175 W · 0,6 no FTP · 1,3 a 300 W · 2,8 a 375 W · 5 a 500 W · 7 a 1.000 W. Depois de soltar ele cai junto
  com a potência ("aumenta mais lentamente").
- Tanque: ×1 com stamina cheia → ×1,5 com stamina vazia. Sprint curto deixa pouco desgaste; esforço prolongado, mais.
  Ex.: 1 s pressionado gasta ~29 de stamina e deixa ~9 de fadiga; 2 s gastam ~75 e deixam ~21.
- Só água (−8 em 2 s, sem acumular; 5 garrafas) e gel (−40% na hora; **2 géis**) reduzem a fadiga.
- Resistência 1,35/s: quem nunca acelera precisa de **3 águas** para não quebrar. Quem administra bem chega ao km 48 com ~50–55% de fadiga e tem sprint final.

## 4. Sprites e telas finais
Sprite por potência (`SPR` em `desenho.js`): normal < 108% FTP · esforço 108–160% · **sprint** (`p_b3.webp`, com linhas de
velocidade) ≥ 160% · em pé em subida > 3% com ≥ 130%. Histerese de 6 pontos para não piscar.

Ilustrações `fim_venceu.webp` e `fim_quebrou.webp` (fundo transparente) à direita do texto, com entrada suave de 0,45 s.

## 5. Simulações (`node tools/balanceamento/sim_v2.js`) — recursos = água quando fadiga > 40, gel > 75
| # | Estratégia | Distância | Tempo | Média | Fadiga final | Água | Gel | Resultado |
|---|---|---|---|---|---|---|---|---|
| 1 | Nunca acelerar, sem água/gel | 41.0 km | 01:32:29 (parou) | 26.6 km/h | 100 | 0/5 | 0/2 | **quebrou** |
| 2 | Nunca acelerar, com água e gel | 50.0 km | 01:50:17 | 27.2 km/h | 49 | 5/5 | 1/2 | chegou |
| 3 | Segurar o acelerador sempre, sem recursos | 12.1 km | 00:16:32 (parou) | 43.9 km/h | 100 | 0/5 | 0/2 | **quebrou** |
| 4 | Segurar o acelerador sempre + todos os recursos | 26.4 km | 00:38:05 (parou) | 41.6 km/h | 100 | 5/5 | 2/2 | **quebrou** |
| 5 | Toques curtos e frequentes (0,1 s a cada 0,3 s) + recursos | 39.4 km | 00:59:29 (parou) | 39.8 km/h | 100 | 5/5 | 2/2 | **quebrou** |
| 5b | Toques 0,2 s a cada 0,4 s + recursos | 35.1 km | 00:51:36 (parou) | 40.8 km/h | 100 | 5/5 | 2/2 | **quebrou** |
| 6 | Moderado com recuperação (250 W, descansa com stamina < 25) + recursos | 50.0 km | 01:33:22 | 32.1 km/h | 73 | 5/5 | 1/2 | chegou |
| 7 | Ataques nas subidas (200 W plano, 400 W subida) + recursos | 50.0 km | 01:26:44 | 34.6 km/h | 93 | 5/5 | 2/2 | chegou |
| 8 | Sprints de 3 s a cada 8 s + recursos | 36.2 km | 00:53:40 (parou) | 40.5 km/h | 100 | 5/5 | 2/2 | **quebrou** |
| 8b | Sprints de 2 s a cada 12 s + recursos | 48.4 km | 01:28:49 (parou) | 32.7 km/h | 100 | 5/5 | 2/2 | **quebrou** |
| — | FTP (250 W) o tempo todo + recursos | 50.0 km | 01:28:04 | 34.1 km/h | 55 | 5/5 | 2/2 | chegou |
| — | FTP o tempo todo, água e gel cedo (fadiga > 15 / 35) | 50.0 km | 01:28:04 | 34.1 km/h | 85 | 5/5 | 2/2 | chegou |
| — | 300 W o tempo todo + recursos | 49.5 km | 01:20:47 (parou) | 36.8 km/h | 100 | 5/5 | 2/2 | **quebrou** |

### Estratégias otimizadas (busca)
4608 estratégias testadas · 4364 chegam (95%) · média máxima 36.51 km/h
distribuição das que chegam: 0–29 km/h: 247 · 29–31 km/h: 899 · 31–33 km/h: 1783 · 33–33.5 km/h: 309 · 33.5–34 km/h: 270 · 34–+ km/h: 856

| # | Estratégia | Distância | Tempo | Média | Fadiga final | Água | Gel | Resultado |
|---|---|---|---|---|---|---|---|---|
| 9 (29) | 205 W plano · 175 W subida · 0 W descida · sprint final 1.5 km · água > 30, gel > 85 | 50.0 km | 01:43:22 | 29.0 km/h | 63 | 5/5 | 1/2 | chegou |
| 9 (30) | 220 W plano · 420 W subida · 0 W descida · descansa com stamina < 20 · água > 50, gel > 85 | 50.0 km | 01:39:59 | 30.0 km/h | 70 | 5/5 | 1/2 | chegou |
| 9 (31) | 190 W plano · 220 W subida · 175 W descida · alivia com fadiga > 75 · água > 30, gel > 85 | 50.0 km | 01:36:44 | 31.0 km/h | 54 | 5/5 | 1/2 | chegou |
| 9 (33) | 205 W plano · 350 W subida · 0 W descida · descansa com stamina < 20 · água > 30, gel > 60 | 50.0 km | 01:30:49 | 33.0 km/h | 67 | 5/5 | 2/2 | chegou |
| 9 (33.5) | 205 W plano · 350 W subida · 175 W descida · alivia com fadiga > 75 · água > 70, gel > 85 | 50.0 km | 01:29:32 | 33.5 km/h | 60 | 5/5 | 2/2 | chegou |
| 9 (34) | 235 W plano · 420 W subida · 175 W descida · sprint final 1.5 km · alivia com fadiga > 75 · água > 30, gel > 85 | 50.0 km | 01:28:12 | 34.0 km/h | 78 | 5/5 | 2/2 | chegou |
| 9 (máx.) | 265 W plano · 350 W subida · 175 W descida · água > 30, gel > 60 | 50.0 km | 01:22:09 | 36.5 km/h | 99 | 5/5 | 2/2 | chegou |
