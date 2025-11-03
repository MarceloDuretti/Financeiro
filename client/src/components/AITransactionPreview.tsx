import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, AlertCircle, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TransactionPreviewData {
  type: "revenue" | "expense";
  amount: string;
  title: string;
  description?: string;
  personName?: string;
  dueDate: string;
  personId?: string;
  chartAccountId?: string;
  costCenterId?: string;
  paymentMethodId?: string;
}

interface AITransactionPreviewProps {
  transactions: TransactionPreviewData[];
  clonePeriod?: {
    type: "month" | "semester" | "year" | "custom";
    count?: number;
  };
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AITransactionPreview({
  transactions,
  clonePeriod,
  onConfirm,
  onEdit,
  onCancel,
  isSubmitting = false,
}: AITransactionPreviewProps) {
  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(",", "."));
    return num.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parse(dateStr, "yyyy-MM-dd", new Date());
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const totalAmount = transactions.reduce((sum, t) => {
    const num = parseFloat(t.amount.replace(",", "."));
    return sum + num;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Revisão Final</h3>
        <p className="text-sm text-muted-foreground">
          Revise os lançamentos que serão criados
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-md bg-muted/50">
          <p className="text-xs text-muted-foreground">Total de lançamentos</p>
          <p className="text-2xl font-semibold">{transactions.length}</p>
        </div>
        <div className="p-3 rounded-md bg-muted/50">
          <p className="text-xs text-muted-foreground">Valor total</p>
          <p className="text-2xl font-semibold">
            {formatCurrency(totalAmount.toString())}
          </p>
        </div>
      </div>

      {/* Clone Period Info */}
      {clonePeriod && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Lançamentos recorrentes
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
              {clonePeriod.type === "year" && "Lançamento mensal para o ano todo"}
              {clonePeriod.type === "semester" && "Lançamento mensal para o semestre"}
              {clonePeriod.type === "month" && `Lançamento mensal por ${clonePeriod.count || 1} meses`}
              {clonePeriod.type === "custom" && `${clonePeriod.count || 1} lançamentos`}
            </p>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Lançamentos a serem criados:</p>
        <ScrollArea className="h-[300px] rounded-md border">
          <div className="p-4 space-y-3">
            {transactions.map((transaction, index) => (
              <div
                key={index}
                className="p-3 rounded-md border bg-card hover-elevate"
                data-testid={`preview-transaction-${index}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={transaction.type === "revenue" ? "default" : "destructive"}
                        className="text-[10px] h-5 px-1.5"
                      >
                        {transaction.type === "revenue" ? "Receita" : "Despesa"}
                      </Badge>
                      <p className="text-sm font-medium truncate">
                        {transaction.title}
                      </p>
                    </div>
                    {transaction.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {transaction.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(transaction.dueDate)}
                      </span>
                      {transaction.personName && (
                        <span className="flex items-center gap-1">
                          •
                          {transaction.personName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-base font-semibold ${
                        transaction.type === "revenue"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Warning if no transactions */}
      {transactions.length === 0 && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Nenhum lançamento para criar
            </p>
            <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
              Verifique as informações fornecidas
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          data-testid="button-cancel"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onEdit}
          disabled={isSubmitting}
          data-testid="button-edit"
        >
          Editar
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting || transactions.length === 0}
          data-testid="button-confirm"
        >
          {isSubmitting ? "Criando..." : `Confirmar ${transactions.length} lançamento${transactions.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}
