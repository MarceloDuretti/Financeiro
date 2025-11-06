Backup de UI – Diminuir destaque de cards não pagos

Data: 2025-11-06

Escopo:
- Tornar cards não pagos mais apagados (menos saturação/contraste) nas três visualizações de Lançamentos.

Mudanças propostas:
- Containers de não pagos: usar `bg-muted` com leve opacidade e borda mais sutil.
- Texto de valores em não pagos: `text-muted-foreground` nas três visualizações.
- Manter cards pagos com azul claro e borda (como revertido).

Validação:
- Rodar `npm run check` e inspecionar preview em `/dashboard/lancamentos`.