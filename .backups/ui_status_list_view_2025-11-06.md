Backup – Atualização de cards na visualização Lista (status padronizados)

Data: 2025-11-06

Escopo: Atualizar os cards da visualização "Lista" em `client/src/pages/Lancamentos.tsx` para usar o novo sistema por Status com cores, bordas, ícones e cores de valores:

- Pago/Recebido: fundo `#E7F9ED`, borda `#2E7D32`, badge com ícone CheckCircle, texto "Pago"/"Recebido", valores em verde-escuro.
- Pendente/A vencer: fundo `#FFF7E0`, borda `#F9A825`, badge com ícone Clock, texto "Pendente", valores em cinza-escuro.
- Em atraso: fundo `#FDECEA`, borda `#C62828`, badge com ícone AlertTriangle, texto "Em atraso", valores em vermelho-escuro.
- Agendado/Futuro: fundo `#E8F0FE`, borda `#1976D2`, badge com ícone CalendarCheck, texto "Agendado", valores em azul.

Também:
- Remover o ponto colorido antes do valor.
- "Pago em" passa a usar verde `#2E7D32` quando houver `paidDate`.
- Manter demais colunas (Código, Tipo, Pessoa, Descrição, % do mês) como estão.

Validação pós-alteração:
- Rodar `npm run check`.
- Abrir preview e validar nas três visões (Semana, Cards, Lista).