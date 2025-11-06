# UI – Ajuste de Separadores, Espaçamento do Cliente e Destaque do Valor

Data: 2025-11-06

Arquivos afetados:
- `client/src/pages/Lancamentos.tsx`

Mudanças aplicadas:
- Separador realocado: primeira linha separadora agora fica entre o rótulo "Cliente" e a linha com ícone + código (semanal e grade).
- Remoção da linha antes do valor: excluído o separador logo abaixo do nome do cliente para aproximar visualmente do valor.
- Espaçamento entre rótulo e nome: reduzido para um espaço pequeno (`space-y-[2px]` e `leading-tight`), ficando "bem próximo" ao rótulo.
- Valor com maior destaque:
  - Semana: `text-[14px]` e, para receitas pagas, `font-extrabold drop-shadow-sm`.
  - Grade: `text-[16px]` e, para receitas pagas, `font-extrabold drop-shadow-sm`.
  - Despesas pagas permanecem em vermelho forte (`text-red-600 font-bold`).

Motivação:
- Atender ao pedido de melhorar a hierarquia visual: rótulo "Cliente" próximo ao nome, reduzir elementos de distração antes do valor e aumentar a legibilidade e destaque dos montantes.

Validação:
- `npm run check` para garantir ausência de erros de TypeScript.
- Preview em `http://localhost:5002/dashboard/lancamentos` para validação visual das duas views.

Observações:
- Mantida a linha separadora entre o bloco de ícone+código e o rótulo "Cliente" conforme orientação anterior.