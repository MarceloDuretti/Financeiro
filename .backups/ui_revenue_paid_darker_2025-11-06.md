Resumo: Tornar o fundo dos cards de receitas pagas um pouco mais escuro.

Motivação
- Usuário solicitou que receitas quando pagas tenham um fundo mais escuro para melhorar distinção visual.

Plano
1) Em `client/src/pages/Lancamentos.tsx`, atualizar os três pontos onde `isPaid && type === 'revenue'` definem o fundo:
   - Trocar `bg-blue-50 dark:bg-blue-950/30` por `bg-blue-100 dark:bg-blue-950/50` para escurecer levemente em claro e escuro.
2) Manter estilos existentes para despesas pagas e cards não pagos.
3) Rodar `npm run check` e validar no preview de Lançamentos.

Validação esperada
- Cartões de receitas pagas com azul mais perceptível, sem bordas, mantendo demais indicadores (dot, textos, "Pago em").

Data: 2025-11-06