# Backup de UI – Lançamentos (degradê verde suave e badge código)

Data: 2025-11-06

Arquivos afetados:
- `client/src/pages/Lancamentos.tsx`

Resumo das mudanças:
- Cartões de receitas pagas (verde): alterado para degradê sutil `from-emerald-600 to-emerald-500` e em dark `dark:from-emerald-700 dark:to-emerald-600`.
- Ícone de recebido pago (`CheckCircle`): mantido em branco para melhor contraste.
- Badge do código (receitas pagas): atualizado para `bg-transparent text-black font-bold border-0` (weekly e grid).

Trechos relevantes:
- Weekly: `bg-gradient-to-br ... from-emerald-600 to-emerald-500 ...` e Badge `bg-transparent text-black font-bold border-0`.
- Grid: `bg-gradient-to-br ... from-emerald-600 to-emerald-500 ...` e Badge `bg-transparent text-black font-bold border-0`.

Motivação:
- Solicitação do usuário para código com fonte preta, fundo transparente e sem borda.
- Suavização do degradê do cartão verde forte para um visual mais leve.

Validação:
- `npm run check` sem erros.
- Preview em `http://localhost:5002/dashboard/lancamentos` (servidor dev ativo).