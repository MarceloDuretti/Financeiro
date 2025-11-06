Backup rápido de UI – Lançamentos

Data: 2025-11-06

Escopo:
- Reversão dos estilos dos cards pagos em `client/src/pages/Lancamentos.tsx`.

Alterações revertidas:
- Remoção do `bg-blue-600 text-white dark:bg-blue-700` para cards pagos.
- Restauração do `bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800` nos modos semana, cards e lista.
- Restauração das cores de texto padrões (valores e "Pago em:" voltam a `text-blue-600` ou conforme tipo).

Motivo:
- Solicitação do usuário para voltar ao estilo anterior.

Notas:
- Validação realizada com `npm run check` e preview em `/dashboard/lancamentos`.