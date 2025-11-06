Resumo: Remover a barrinha lateral colorida (azul/vermelho) dos cards em Lançamentos.

Contexto
- Atualmente os cards têm uma faixa lateral (border-l) por tipo: receita (azul) e despesa (vermelho).
- O usuário solicitou retirar essa barrinha, mantendo as demais distinções (fundo por tipo quando pago, dot colorido, valores e "Pago em" com cores por tipo, e estilo discreto para não pagos).

Plano
1) Remover classes de `border-l-*` e qualquer lógica CSS associada à faixa lateral nos containers das três visualizações (semana, cards e lista) em `client/src/pages/Lancamentos.tsx`.
2) Preservar os demais indicadores visuais: 
   - Fundo por tipo para pagos (despesa avermelhado, receita azul).
   - Dot colorido antes do valor (vermelho para despesa, azul para receita).
   - Texto "Pago em" com cor correspondente ao tipo.
   - Manter estilo discreto para não pagos.
3) Rodar `npm run check` para garantir ausência de erros de tipo/compilação.
4) Validar no preview de Lançamentos se a barrinha foi removida e o restante permanece correto.

Validação esperada
- Cards sem qualquer faixa lateral colorida.
- Diferenciação por tipo permanece via dot e cores de fundo/texto.

Data: 2025-11-06