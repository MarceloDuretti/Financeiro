Backup – Reversão da atualização de status na visualização Lista

Data: 2025-11-06

Objetivo: Reverter `client/src/pages/Lancamentos.tsx` na visualização "Lista" para o estilo anterior (sem borda por status, sem ícones de status, mantendo o ponto colorido do valor e cores anteriores de fundo e texto).

Estado revertido esperado:
- Container: `bg-red-50`/`bg-blue-100` para pagos (despesa/receita) e `bg-muted` para não pagos; sem borda colorida.
- "Pago em": vermelho/azul conforme tipo, sem verde específico.
- Valor: recolocar o ponto colorido e voltar cores (`text-destructive` para despesa paga, `text-blue-600` para receita paga, `text-muted-foreground` para não pago).
- Badge de status: sem ícones; cores anteriores (`blue` para pago, `orange` para atraso, cinza para pendente).

Pós-reversão:
- Rodar `npm run check`.
- Validar no preview.