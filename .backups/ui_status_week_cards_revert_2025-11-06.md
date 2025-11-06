Backup – Reversão das visões Semana e Cards para visual anterior

Data: 2025-11-06

Arquivos: `client/src/pages/Lancamentos.tsx`

Reversões aplicadas:
- Semana (DroppableDayColumn):
  - Container volta para tipo-based: pagos receita `bg-blue-100 dark:bg-blue-950/50`, pagos despesa `bg-red-50 dark:bg-red-950/30`, não pagos `bg-muted` sem borda colorida.
  - Badge de status sem ícones, cores anteriores: pago (azul), atraso (laranja), pendente (cinza).
  - Valor volta a usar cores por tipo para pagos e `text-muted-foreground` para não pagos.
- Cards:
  - `Card` volta para `bg-white/75 dark:bg-gray-900/75` sem bordas coloridas por status.
  - Removido badge de status com ícones; volta apenas o badge "Atraso" quando aplicável.
  - "Pago em" volta a cor azul padrão.
  - Badge de status simples (Pago/Pendente/Cancelado) sem ícones e com bordas azuis/laranja/cinza.

Validação:
- Rodar `npm run check`.
- Validar no preview nas três visões.