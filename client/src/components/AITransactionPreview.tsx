import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, AlertCircle, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartAccountPicker } from "@/components/ChartAccountPicker";
import { TransactionCostCenterPicker, type CostCenterDistribution } from "@/components/TransactionCostCenterPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SELECTED_COMPANY_KEY = "fincontrol_selected_company_id";

interface TransactionPreviewData {
  type: "revenue" | "expense";
  amount: string;
  title: string;
  description?: string;
  personName?: string;
  issueDate?: string;
  dueDate: string;
  personId?: string;
  chartAccountId?: string;
  costCenterId?: string;
  paymentMethodId?: string;
  bankAccountId?: string;
}

interface AITransactionPreviewProps {
  transactions: TransactionPreviewData[];
  clonePeriod?: {
    type: "month" | "semester" | "year" | "custom";
    count?: number;
  };
  onConfirm: (updatedTransactions: TransactionPreviewData[]) => void;
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
  const selectedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY);
  
  // State for editable fields
  const [transactionType, setTransactionType] = useState<"revenue" | "expense">("revenue");
  const [chartAccountId, setChartAccountId] = useState<string>("");
  const [costCenterDistributions, setCostCenterDistributions] = useState<CostCenterDistribution[]>([]);
  const [typeManuallyChanged, setTypeManuallyChanged] = useState(false);

  // Get personId from first transaction (they should all have the same person in batch)
  const personId = transactions[0]?.personId;
  
  // Initialize transaction type from first transaction and reset manual change flag
  useEffect(() => {
    if (transactions.length > 0 && transactions[0]?.type) {
      setTransactionType(transactions[0].type);
      // Reset manual change flag for new batch
      setTypeManuallyChanged(false);
      // Reset chart account to allow fresh suggestion
      setChartAccountId("");
    }
  }, [transactions]);

  // Load company data
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['/api/companies'],
  });

  const selectedCompany = companies.find((c: any) => c.id === selectedCompanyId);

  // Load chart accounts
  const { data: chartAccounts = [] } = useQuery<any[]>({
    queryKey: ['/api/chart-of-accounts'],
  });

  // Load the customer/supplier details (includes defaultChartAccountId)
  const { data: personDetails } = useQuery<any>({
    queryKey: [`/api/customers-suppliers/${personId}`],
    enabled: !!personId,
  });

  // Load cost centers for the selected person (customer/supplier)
  const { data: personCostCenters = [] } = useQuery<Array<{ id: string; code: number; name: string }>>({
    queryKey: [`/api/customers-suppliers/${personId}/cost-centers`],
    enabled: !!personId,
  });

  // Find appropriate chart account and pre-fill
  useEffect(() => {
    if (chartAccountId || chartAccounts.length === 0) return;
    
    // If type was manually changed, skip AI suggestion and go directly to type-based lookup
    if (!typeManuallyChanged) {
      // First, check if AI already suggested a chartAccountId
      const aiSuggestedId = transactions[0]?.chartAccountId;
      if (aiSuggestedId) {
        setChartAccountId(aiSuggestedId);
        return;
      }
      
      // Second, check if the customer/supplier has a default chart account
      if (personDetails?.defaultChartAccountId) {
        setChartAccountId(personDetails.defaultChartAccountId);
        return;
      }
    }
    
    // Otherwise, find account based on current transaction type state
    if (transactionType) {
      const accountType = transactionType === "revenue" ? "receita" : "despesa";
      // Find first analytical account of the matching type
      const matchingAccount = chartAccounts.find((acc: any) => 
        acc.type === accountType && acc.isAnalytical === true
      );
      
      if (matchingAccount) {
        setChartAccountId(matchingAccount.id);
      }
    }
  }, [chartAccounts, chartAccountId, transactionType, personDetails, typeManuallyChanged]);

  // Pre-fill cost center distributions based on person's cost centers
  useEffect(() => {
    if (personCostCenters.length > 0 && costCenterDistributions.length === 0) {
      // Distribute equally among all cost centers
      const percentage = Math.floor(100 / personCostCenters.length);
      const remainder = 100 - (percentage * personCostCenters.length);
      
      const distributions = personCostCenters.map((cc, index) => ({
        costCenterId: cc.id,
        percentage: index === 0 ? percentage + remainder : percentage, // Add remainder to first
      }));
      
      setCostCenterDistributions(distributions);
    }
  }, [personCostCenters, costCenterDistributions.length]);

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

  const handleConfirm = () => {
    // Apply edited fields to all transactions, including type, cost center distributions
    const updatedTransactions = transactions.map(t => {
      const transaction: any = {
        ...t,
        type: transactionType, // Apply the edited type to all transactions
        chartAccountId: chartAccountId || t.chartAccountId,
        // Include the full cost center distributions array with percentages
        costCenterDistributions: costCenterDistributions.length > 0 
          ? costCenterDistributions 
          : (t.costCenterId ? [{ costCenterId: t.costCenterId, percentage: 100 }] : []),
      };
      
      // Remove costCenterId field as we're using costCenterDistributions now
      delete transaction.costCenterId;
      
      // Remove empty string fields to avoid foreign key violations
      if (transaction.paymentMethodId === "") delete transaction.paymentMethodId;
      if (transaction.bankAccountId === "") delete transaction.bankAccountId;
      
      return transaction;
    });
    onConfirm(updatedTransactions);
  };

  // Validation
  const totalPercentage = costCenterDistributions.reduce((sum, d) => sum + d.percentage, 0);
  const isValid = !!(chartAccountId && costCenterDistributions.length > 0 && totalPercentage === 100);

  const getMissingFields = () => {
    const missing: string[] = [];
    if (!chartAccountId) missing.push("Plano de Contas");
    if (costCenterDistributions.length === 0) missing.push("Centro de Custo");
    else if (totalPercentage !== 100) missing.push("Distribuição de 100%");
    return missing;
  };

  const missingFields = getMissingFields();

  return (
    <div className="space-y-3">
      {/* Company Header */}
      {selectedCompany && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
          <Building2 className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            {selectedCompany.name}
          </p>
        </div>
      )}

      {/* Header */}
      <div>
        <h3 className="text-base font-semibold">Revisão Final</h3>
        <p className="text-xs text-muted-foreground">
          Confira todos os dados antes de criar os lançamentos
        </p>
      </div>

      {/* Summary - 3 Cards in Same Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-md bg-muted/50">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Fornecedor</p>
          <p className="text-xs font-semibold truncate" title={personDetails?.name || transactions[0]?.personName || "Não informado"}>
            {personDetails?.name || transactions[0]?.personName || "Não informado"}
          </p>
        </div>
        <div className="p-2 rounded-md bg-muted/50">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Lançamentos</p>
          <p className="text-xs font-semibold">{transactions.length}</p>
        </div>
        <div className="p-2 rounded-md bg-muted/50">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Valor Total</p>
          <p className="text-xs font-semibold">
            {formatCurrency(totalAmount.toString())}
          </p>
        </div>
      </div>

      {/* Clone Period Info - Compact */}
      {clonePeriod && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-blue-500/10 border border-blue-500/20">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
          <p className="text-[11px] font-medium text-blue-900 dark:text-blue-100">
            {clonePeriod.type === "year" && "Lançamento mensal - ano todo"}
            {clonePeriod.type === "semester" && "Lançamento mensal - semestre"}
            {clonePeriod.type === "month" && `${clonePeriod.count || 1} meses`}
            {clonePeriod.type === "custom" && `${clonePeriod.count || 1} lançamentos`}
          </p>
        </div>
      )}

      {/* Missing Fields Warning */}
      {missingFields.length > 0 && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[11px] font-medium text-yellow-900 dark:text-yellow-100">
              {missingFields.join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Editable Fields - Compact */}
      <div className="space-y-1 p-2.5 rounded-md border bg-card">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold">Campos Obrigatórios</h4>
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            {transactions.length}x
          </Badge>
        </div>

        {/* Transaction Type */}
        <div className="space-y-1">
          <label className="text-xs font-medium flex items-center gap-1">
            Tipo de Lançamento
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-blue-500/10 border-blue-500/20 text-blue-700">
              {transactionType === "revenue" ? "Receita" : "Despesa"}
            </Badge>
          </label>
          <Select
            value={transactionType}
            onValueChange={(value) => {
              setTransactionType(value as "revenue" | "expense");
              // Mark that type was manually changed by user
              setTypeManuallyChanged(true);
              // Reset chart account when type changes to find appropriate account
              setChartAccountId("");
            }}
          >
            <SelectTrigger data-testid="select-transaction-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Receita</SelectItem>
              <SelectItem value="expense">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chart Account */}
        <div className="space-y-1">
          <label className="text-xs font-medium flex items-center gap-1">
            Plano de Contas
            {!chartAccountId && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-yellow-500/10 border-yellow-500/20 text-yellow-700">
                Obrigatório
              </Badge>
            )}
            {chartAccountId && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-green-500/10 border-green-500/20 text-green-700">
                <Check className="w-2.5 h-2.5 mr-0.5" />
                OK
              </Badge>
            )}
          </label>
          <ChartAccountPicker
            accounts={chartAccounts}
            value={chartAccountId || null}
            onChange={(id) => setChartAccountId(id || "")}
            placeholder="Selecione uma conta contábil"
          />
        </div>

        {/* Cost Center */}
        <div className="space-y-1">
          <label className="text-xs font-medium flex items-center gap-1">
            Centro de Custo (Rateio)
            {costCenterDistributions.length === 0 && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-yellow-500/10 border-yellow-500/20 text-yellow-700">
                Obrigatório
              </Badge>
            )}
            {costCenterDistributions.length > 0 && totalPercentage === 100 && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-green-500/10 border-green-500/20 text-green-700">
                <Check className="w-2.5 h-2.5 mr-0.5" />
                100%
              </Badge>
            )}
            {costCenterDistributions.length > 0 && totalPercentage !== 100 && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-yellow-500/10 border-yellow-500/20 text-yellow-700">
                {totalPercentage}%
              </Badge>
            )}
          </label>
          <TransactionCostCenterPicker
            value={costCenterDistributions}
            onChange={setCostCenterDistributions}
            companyId={selectedCompanyId || undefined}
          />
        </div>
      </div>

      {/* Transactions List - Compact */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Lançamentos ({transactions.length}):</p>
        <div className="space-y-1 max-h-[100px] overflow-y-auto">
          {transactions.map((transaction, index) => (
            <div
              key={index}
              className="p-2 rounded border bg-card/50 hover-elevate"
              data-testid={`preview-transaction-${index}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={transactionType === "revenue" ? "default" : "destructive"}
                      className="text-[9px] h-4 px-1"
                    >
                      {transactionType === "revenue" ? "Receita" : "Despesa"}
                    </Badge>
                    <p className="text-xs font-medium truncate">
                      {transaction.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                    <span>{formatDate(transaction.dueDate)}</span>
                    {transaction.personName && (
                      <>
                        <span>•</span>
                        <span className="truncate">{transaction.personName}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-semibold ${
                      transactionType === "revenue"
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
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
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
          onClick={handleConfirm}
          disabled={isSubmitting || transactions.length === 0 || !isValid}
          data-testid="button-confirm"
        >
          {isSubmitting ? "Criando..." : `Confirmar ${transactions.length}`}
        </Button>
      </div>
    </div>
  );
}
