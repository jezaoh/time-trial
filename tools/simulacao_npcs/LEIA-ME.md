# Simulações aceleradas (NPCs, corridas, recursos, botão)

Rodam dentro do jogo montado (Chromium/Playwright), chamando `update()` direto, sem esperar o relógio.

- `harness.js` — `SIM(cfg)`: simula ciclistas sozinhos/em grupo por N km no relevo do Pedal Livre (terreno com semente) ou de 100 km.
- `testes.js` — baterias:
  - `TESTES()`: testes 1–9 do pedido de NPCs (solo por nível, pelotão de 4, intermediário x pelotão, ataques até quebrar, vácuo, itens, afoito x jogador).
  - `TESTE_CORRIDA(km, n)`: rachão com robô a 95% do FTP.
  - `TESTE_RECURSOS()`: caminhão/furgão/torcedor com 6 NPCs.
  - `TESTE_TAP(tipo, n, kmAtaque, nível, motor)`: robô de toques atacando com itens.
  - `TESTE_FUGA` e `TESTE_TATICO`: robôs antigos de "segurar", pouco confiáveis.
- `rodar.py HTML "expr" ...` — executa expressões e imprime.
- `pedal_livre.py HTML` — Pedal Livre de 90 km no jogo de verdade (aglomeração, quebrados, falas, moedas).
- `toques.py HTML` — watts e stamina por toques por segundo.

Os robôs não pegam vácuo com inteligência: use os números para **comparar versões**, não como o desempenho de um jogador real.
