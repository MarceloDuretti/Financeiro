import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, AlertCircle, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartAccountPicker } from "@/components/ChartAccountPicker";
import { TransactionCostCenterPicker, type CostCenterDistribution } from "@/components/TransactionCostCenterPicker";

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
  const [chartAccountId, setChartAccountId] = useState<string>("");
  const [costCenterDistributions, setCostCenterDistributions] = useState<CostCenterDistribution[]>([]);

  // Get personId from first transaction (they should all have the same person in batch)
  const personId = transactions[0]?.personId;

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
    
    // Otherwise, find account based on transaction type
    const transactionType = transactions[0]?.type; // "revenue" or "expense"
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
  }, [chartAccounts, chartAccountId, transactions, personDetails]);

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
    // Apply edited fields to all transactions, including cost center distributions
    const updatedTransactions = transactions.map(t => {
      const transaction: any = {
        ...t,
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
    <div className="space-y-2">
      {/* Ultra-compact summary */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
            {transactions.length} lançamento{transactions.length > 1 ? 's' : ''}
          </Badge>
          <span className="text-sm font-semibold">
            {formatCurrency(totalAmount.toString())}
          </span>
          {clonePeriod && (
            <Badge variant="outline" className="text-[9px] h-5 px-1.5 bg-blue-500/10 border-blue-500/20 text-blue-700">
              <Calendar className="w-2.5 h-2.5 mr-0.5" />
              {clonePeriod.type === "year" && "Ano todo"}
              {clonePeriod.type === "semester" && "Semestre"}
              {clonePeriod.type === "month" && `${clonePeriod.count}m`}
            </Badge>
          )}
        </div>
        
        {/* Missing fields warning - inline */}
        {missingFields.length > 0 && (
          <Badge variant="outline" className="text-[9px] h-5 px-1.5 bg-yellow-500/10 border-yellow-500/20 text-yellow-700">
            <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
            Preencha campos
          </Badge>
        )}
      </div>

      {/* Editable Fields - Ultra compact */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Plano de Contas</label>
          <ChartAccountPicker
            accounts={chartAccounts}
            value={chartAccountId || null}
            onChange={(id) => setChartAccountId(id || "")}
            placeholder="Selecione..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Centro de Custo</label>
          <TransactionCostCenterPicker
            value={costCenterDistributions}
            onChange={setCostCenterDistributions}
            companyId={selectedCompanyId || undefined}
          />
        </div>
      </div>

      {/* Transactions List - Ultra compact */}
      <div className="space-y-1 max-h-[120px] overflow-y-auto">
        {transactions.map((transaction, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-2 px-2 py-1 rounded border bg-muted/30 text-[11px]"
            data-testid={`preview-transaction-${index}`}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Badge
                variant={transaction.type === "revenue" ? "default" : "destructive"}
                className="text-[8px] h-4 px-1 flex-shrink-0"
              >
                {transaction.type === "revenue" ? "R" : "D"}
              </Badge>
              <span className="truncate font-medium">{transaction.title}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground flex-shrink-0">{formatDate(transaction.dueDate)}</span>
            </div>
            <span
              className={`font-semibold flex-shrink-0 ${
                transaction.type === "revenue" ? "text-blue-600" : "text-red-600"
              }`}
            >
              {formatCurrency(transaction.amount)}
            </span>
          </div>
        ))}
      </div>

      {/* Actions - Ultra compact */}
      <div className="flex justify-end gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          data-testid="button-cancel"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          disabled={isSubmitting || transactions.length === 0 || !isValid}
          data-testid="button-confirm"
        >
          {isSubmitting ? "Criando..." : `Confirmar`}
        </Button>
      </div>
    </div>
  );
}
