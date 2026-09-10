# Contas-Vermelhas

Jogo web arcade em formato **pass-and-play** para simular o **Experimento das Contas Vermelhas** de W. Edwards Deming com 4 jogadores locais em sequência.

## Como executar

1. Abra o arquivo `/home/runner/work/Contas-Vermelhas/Contas-Vermelhas/index.html` em um navegador moderno.
2. Informe os nomes dos 4 jogadores.
3. Clique em **Iniciar Simulação**.

## Fluxo da simulação

- Rodadas sequenciais de 30 segundos por jogador.
- Blocos válidos (azul/verde) devem ser clicados; blocos corrompidos (vermelho) devem ser ignorados.
- Há uma taxa sistêmica oculta fixa de 20% que converte parte dos cliques corretos em erro de processamento.
- Ao final, o dashboard mostra:
  - **Fase 1**: ranking tradicional por falhas aparentes.
  - **Fase 2**: auditoria estatística com a revelação do fator sistêmico.