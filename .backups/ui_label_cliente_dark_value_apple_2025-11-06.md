# UI – Rótulo cinza escuro, nome preto e valor estilo Apple

Data: 2025-11-06

Arquivos afetados:
- `client/src/pages/Lancamentos.tsx`

Mudanças aplicadas:
- Rótulo do cliente/fornecedor:
  - Cor: `text-gray-700 dark:text-gray-300`.
  - Texto condicional: `Cliente` para receitas, `Fornecedor` para despesas.
- Nome do cliente/fornecedor:
  - Cor: `text-black dark:text-white` (removida variação branca em receitas pagas).
  - Tipografia: `font-medium` com `tracking-tight` e `leading-tight`.
- Valor (montante):
  - Estilo Apple: `font-sans tabular-nums tracking-tight`.
  - Peso: `font-normal` (removido `bold/extrabold` e `drop-shadow`).
  - Cor: `text-black` quando pago; `text-muted-foreground` quando não pago.

Motivação:
- Atender ao pedido de deixar o rótulo mais sóbrio (cinza escuro), o nome em preto e reduzir a força do valor, mantendo legibilidade e consistência tipográfica.

Validação:
- `npm run check` para verificar tipos.
- Preview em `http://localhost:5002/dashboard/lancamentos` para revisão visual.