import { useState, useEffect, useRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, UseMutationResult } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, TrendingDown, TrendingUp, CheckCircle2, ChevronRight, AlertTriangle, TrendingDownIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertTransactionSchema, type Transaction } from "@shared/schema";
import { TransactionCostCenterPicker, type CostCenterDistribution } from "@/components/TransactionCostCenterPicker";
import { ChartAccountPicker } from "@/components/ChartAccountPicker";

const SELECTED_COMPANY_KEY = "fincontrol_selected_company_id";

const formSchema = insertTransactionSchema.extend({
  issueDate: z.date(),
  dueDate: z.date(),
  paidDate: z.date().optional().nullable(),
  costCenterDistributions: z.array(z.object({
    costCenterId: z.string(),
    percentage: z.number(),
  })).optional(),
}).refine(
  (data) => {
    if (!data.costCenterDistributions || data.costCenterDistributions.length === 0) {
      return true;
    }
    const total = data.costCenterDistributions.reduce((sum, d) => sum + d.percentage, 0);
    return total === 100;
  },
  {
    message: "A soma das porcentagens dos centros de custo deve ser exatamente 100%",
    path: ["costCenterDistributions"],
  }
);

type FormValues = z.infer<typeof formSchema>;

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  defaultType?: "expense" | "revenue";
}

const STEPS = [
  { id: 1, title: "Dados Básicos" },
  { id: 2, title: "Fornecedor" },
  { id: 3, title: "Categorização" },
  { id: 4, title: "Forma de Pagamento" },
  { id: 5, title: "Revisão Final" },
];

interface ProgressStepperProps {
  currentStep: number;
  transactionType: "expense" | "revenue";
}

const ProgressStepper = ({ currentStep, transactionType }: ProgressStepperProps) => (
  <div className="mb-6">
    <div className="flex items-center justify-between">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                currentStep >= step.id
                  ? transactionType === "expense"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.id ? <CheckCircle2 className="h-4 w-4" /> : step.id}
            </div>
            <p className={cn(
              "text-xs mt-1 text-center hidden md:block",
              currentStep >= step.id ? "font-medium" : "text-muted-foreground"
            )}>
              {step.title}
            </p>
          </div>
          {index < STEPS.length - 1 && (
            <div className={cn(
              "h-0.5 flex-1 mx-2",
              currentStep > step.id 
                ? transactionType === "expense"
                  ? "bg-destructive"
                  : "bg-blue-600"
                : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
    <p className="text-xs text-center mt-2 text-muted-foreground md:hidden">
      Etapa {currentStep} de {STEPS.length}: {STEPS[currentStep - 1].title}
    </p>
  </div>
);

interface StepSummaryProps {
  step: number;
  form: UseFormReturn<FormValues>;
  customersSuppliers: any[];
  costCenters: any[];
  chartAccounts: any[];
  paymentMethods: any[];
  bankAccounts: any[];
}

const StepSummary = ({ 
  step, 
  form, 
  customersSuppliers, 
  costCenters, 
  chartAccounts, 
  paymentMethods, 
  bankAccounts 
}: StepSummaryProps) => {
  const values = form.getValues();

  if (step < 1) return null;

  return (
    <Card className="mb-2">
      <CardContent className="p-2 space-y-1">
        <div className="flex items-center gap-1.5 mb-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          <h3 className="text-[10px] font-semibold">Resumo</h3>
        </div>
        <div className="text-[10px] grid grid-cols-2 gap-x-3 gap-y-0.5">
          {step >= 2 && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge variant={values.type === "expense" ? "destructive" : "default"} className={cn(
                  "text-[9px] h-4 px-1.5",
                  values.type === "revenue" && "bg-blue-600 hover:bg-blue-700"
                )}>
                  {values.type === "expense" ? "Despesa" : "Receita"}
                </Badge>
              </div>
              <p><span className="text-muted-foreground">Valor:</span> R$ {parseFloat(values.amount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="truncate"><span className="text-muted-foreground">Título:</span> {values.title || "-"}</p>
              <p><span className="text-muted-foreground">Venc.:</span> {format(values.dueDate, "dd/MM/yyyy")}</p>
            </>
          )}

          {step >= 3 && (
            <>
              <p className="truncate"><span className="text-muted-foreground">Pessoa:</span> {customersSuppliers.find(p => p.id === values.personId)?.name || "-"}</p>
              <p className="truncate"><span className="text-muted-foreground">Plano:</span> {chartAccounts.find(c => c.id === values.chartAccountId)?.name || "-"}</p>
              {values.costCenterDistributions && values.costCenterDistributions.length > 0 && (
                <p className="col-span-2 truncate">
                  <span className="text-muted-foreground">CCs:</span> {values.costCenterDistributions.map(dist => {
                    const cc = costCenters.find(c => c.id === dist.costCenterId);
                    return `${cc?.name} (${dist.percentage}%)`;
                  }).join(", ")}
                </p>
              )}
            </>
          )}

          {step >= 4 && (
            <>
              <p><span className="text-muted-foreground">Status:</span> {values.status === "pending" ? "Pendente" : values.status === "paid" ? "Pago" : "Cancelado"}</p>
              <p className="truncate"><span className="text-muted-foreground">Pgto:</span> {paymentMethods.find(p => p.id === values.paymentMethodId)?.name || "-"}</p>
            </>
          )}

          {step >= 5 && values.description && (
            <p className="col-span-2 truncate"><span className="text-muted-foreground">Obs:</span> {values.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface Step1ContentProps {
  form: UseFormReturn<FormValues>;
}

const Step1Content = ({ form }: Step1ContentProps) => (
  <div className="space-y-4">
    <FormField
      control={form.control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tipo de Lançamento *</FormLabel>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={field.value === "expense" ? "destructive" : "outline"}
              className="flex-1"
              onClick={() => field.onChange("expense")}
              data-testid="button-type-expense"
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              Despesa
            </Button>
            <Button
              type="button"
              variant={field.value === "revenue" ? "default" : "outline"}
              className={cn(
                "flex-1",
                field.value === "revenue" && "bg-blue-600 hover:bg-blue-700 text-white"
              )}
              onClick={() => field.onChange("revenue")}
              data-testid="button-type-revenue"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Receita
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Título *</FormLabel>
          <FormControl>
            <Input placeholder="Ex: Venda de produto" {...field} data-testid="input-title" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Valor *</FormLabel>
          <FormControl>
            <Input type="number" step="0.01" placeholder="0,00" {...field} data-testid="input-amount" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="issueDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Data de Emissão *</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                    data-testid="button-issue-date"
                  >
                    {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione"}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="dueDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Data de Vencimento *</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                    data-testid="button-due-date"
                  >
                    {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione"}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
);

interface SupplierAnalyticsProps {
  supplierId: string;
  companyId: string;
  transactionType: "expense" | "revenue";
}

const SupplierAnalytics = ({ supplierId, companyId, transactionType }: SupplierAnalyticsProps) => {
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", companyId, supplierId],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?companyId=${companyId}&personId=${supplierId}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
    enabled: !!supplierId && !!companyId,
  });

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">Carregando análise...</p>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">Nenhum histórico encontrado com este fornecedor</p>
        </CardContent>
      </Card>
    );
  }

  // Filter by type
  const relevantTransactions = transactions.filter(t => t.type === transactionType);
  
  if (relevantTransactions.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Nenhum histórico de {transactionType === "expense" ? "despesas" : "receitas"} com este fornecedor
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate metrics
  const total = relevantTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const average = total / relevantTransactions.length;
  const count = relevantTransactions.length;

  // Prepare chart data (last 6 months)
  const chartData = relevantTransactions
    .slice(-6)
    .map(t => ({
      date: format(new Date(t.issueDate), "dd/MM"),
      valor: parseFloat(t.amount),
    }));

  // Check for alerts (above average spending)
  const lastTransaction = relevantTransactions[relevantTransactions.length - 1];
  const lastAmount = parseFloat(lastTransaction.amount);
  const hasAlert = lastAmount > average * 1.5; // 50% above average

  return (
    <Card className={cn("border-2", transactionType === "expense" ? "border-red-200" : "border-blue-200")}>
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold">Análise do Fornecedor</h4>
            {hasAlert && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Alerta
              </Badge>
            )}
          </div>

          <Separator />

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground">Total Gasto</p>
              <p className="text-sm font-semibold">
                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground">Média</p>
              <p className="text-sm font-semibold">
                R$ {average.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground">Lançamentos</p>
              <p className="text-sm font-semibold">{count}</p>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 1 && (
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke={transactionType === "expense" ? "#ef4444" : "#3b82f6"} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Alert Message */}
          {hasAlert && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2">
              <p className="text-[10px] text-destructive font-medium">
                ⚠️ Último lançamento (R$ {lastAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}) está 50% acima da média
              </p>
            </div>
          )}

          {/* Recent Transactions */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Últimos 3 Lançamentos</p>
            <div className="space-y-1">
              {relevantTransactions.slice(-3).reverse().map((t) => (
                <div key={t.id} className="flex items-center justify-between text-[10px] py-0.5">
                  <span className="truncate flex-1">{t.title}</span>
                  <span className="font-medium ml-2">
                    R$ {parseFloat(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface Step2ContentProps {
  form: UseFormReturn<FormValues>;
  customersSuppliers: any[];
  costCenters: any[];
  chartAccounts: any[];
  paymentMethods: any[];
  bankAccounts: any[];
}

const Step2Content = ({ 
  form, 
  customersSuppliers, 
  costCenters, 
  chartAccounts,
  paymentMethods,
  bankAccounts
}: Step2ContentProps) => {
  const companyId = form.watch("companyId");
  const personId = form.watch("personId");
  const transactionType = form.watch("type");

  return (
    <div className="space-y-3">
      <StepSummary 
        step={2} 
        form={form} 
        customersSuppliers={customersSuppliers}
        costCenters={costCenters}
        chartAccounts={chartAccounts}
        paymentMethods={paymentMethods}
        bankAccounts={bankAccounts}
      />

      <FormField
        control={form.control}
        name="personId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cliente/Fornecedor</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-person">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {customersSuppliers.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name} ({person.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Show analytics when supplier is selected */}
      {personId && companyId && (
        <SupplierAnalytics 
          supplierId={personId} 
          companyId={companyId} 
          transactionType={transactionType}
        />
      )}
    </div>
  );
};

interface Step3ContentProps {
  form: UseFormReturn<FormValues>;
  customersSuppliers: any[];
  costCenters: any[];
  chartAccounts: any[];
  paymentMethods: any[];
  bankAccounts: any[];
}

const Step3Content = ({ 
  form,
  customersSuppliers,
  costCenters,
  chartAccounts,
  paymentMethods,
  bankAccounts
}: Step3ContentProps) => {
  const companyId = form.watch("companyId");
  const costCenterDistributions = form.watch("costCenterDistributions") || [];
  const chartAccountId = form.watch("chartAccountId");

  return (
    <div className="space-y-3">
      <StepSummary 
        step={3} 
        form={form} 
        customersSuppliers={customersSuppliers}
        costCenters={costCenters}
        chartAccounts={chartAccounts}
        paymentMethods={paymentMethods}
        bankAccounts={bankAccounts}
      />

      <FormField
        control={form.control}
        name="costCenterDistributions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Centros de Custo (Distribuição)</FormLabel>
            <FormControl>
              <TransactionCostCenterPicker
                value={costCenterDistributions}
                onChange={(value) => form.setValue("costCenterDistributions", value)}
                companyId={companyId}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="chartAccountId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Plano de Contas</FormLabel>
            <FormControl>
              <ChartAccountPicker
                accounts={chartAccounts}
                value={chartAccountId || null}
                onChange={(value) => form.setValue("chartAccountId", value)}
                placeholder="Selecione uma conta (opcional)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

interface Step4ContentProps {
  form: UseFormReturn<FormValues>;
  watchStatus: string | undefined;
  paymentMethods: any[];
  bankAccounts: any[];
  customersSuppliers: any[];
  costCenters: any[];
  chartAccounts: any[];
}

const Step4Content = ({ 
  form, 
  watchStatus, 
  paymentMethods, 
  bankAccounts,
  customersSuppliers,
  costCenters,
  chartAccounts
}: Step4ContentProps) => (
  <div className="space-y-3">
    <StepSummary 
      step={4} 
      form={form} 
      customersSuppliers={customersSuppliers}
      costCenters={costCenters}
      chartAccounts={chartAccounts}
      paymentMethods={paymentMethods}
      bankAccounts={bankAccounts}
    />

    <FormField
      control={form.control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Status *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="paymentMethodId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Forma de Pagamento</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {paymentMethods.map((pm) => (
                <SelectItem key={pm.id} value={pm.id}>
                  {pm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />

    {watchStatus === "paid" && (
      <>
        <FormField
          control={form.control}
          name="bankAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta Bancária</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-bank-account">
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bankAccounts.map((ba) => (
                    <SelectItem key={ba.id} value={ba.id}>
                      {ba.name} ({ba.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paidDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Pagamento</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      data-testid="button-paid-date"
                    >
                      {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione (opcional)"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    )}
  </div>
);

interface Step5ContentProps {
  form: UseFormReturn<FormValues>;
  customersSuppliers: any[];
  costCenters: any[];
  chartAccounts: any[];
  paymentMethods: any[];
  bankAccounts: any[];
}

const Step5Content = ({ 
  form, 
  customersSuppliers, 
  costCenters, 
  chartAccounts, 
  paymentMethods, 
  bankAccounts 
}: Step5ContentProps) => {
  const values = form.getValues();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <h3 className="text-base font-semibold">Revisão Final</h3>
      </div>

      <Card>
        <CardContent className="p-3 space-y-2">
          {/* Grid 2 colunas - Dados Básicos */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="col-span-2 flex items-center gap-2 mb-1">
              <span className="text-muted-foreground font-medium">Tipo:</span>
              <Badge variant={values.type === "expense" ? "destructive" : "default"} className={cn(
                "text-xs",
                values.type === "revenue" && "bg-blue-600 hover:bg-blue-700"
              )}>
                {values.type === "expense" ? "Despesa" : "Receita"}
              </Badge>
            </div>
            
            <div className="col-span-2">
              <span className="text-muted-foreground">Título:</span> <span className="font-medium">{values.title}</span>
            </div>
            
            <div className="col-span-2">
              <span className="text-muted-foreground">Valor:</span> <span className="font-bold text-base">R$ {parseFloat(values.amount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div>
              <span className="text-muted-foreground">Emissão:</span> {format(values.issueDate, "dd/MM/yyyy")}
            </div>
            
            <div>
              <span className="text-muted-foreground">Vencimento:</span> {format(values.dueDate, "dd/MM/yyyy")}
            </div>
          </div>

          <Separator className="my-2" />

          {/* Grid 2 colunas - Categorização */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="col-span-2">
              <span className="text-muted-foreground">Pessoa:</span> {customersSuppliers.find(p => p.id === values.personId)?.name || "Não informado"}
            </div>
            
            {values.costCenterDistributions && values.costCenterDistributions.length > 0 ? (
              <div className="col-span-2">
                <span className="text-muted-foreground">Centros de Custo:</span>
                <div className="mt-1 space-y-0.5">
                  {values.costCenterDistributions.map((dist) => {
                    const cc = costCenters.find(c => c.id === dist.costCenterId);
                    return (
                      <div key={dist.costCenterId} className="text-xs flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {dist.percentage}%
                        </Badge>
                        <span>{cc?.name || "?"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <span className="text-muted-foreground">Centro:</span> {costCenters.find(c => c.id === values.costCenterId)?.name || "Não informado"}
              </div>
            )}
            
            <div className={values.costCenterDistributions && values.costCenterDistributions.length > 0 ? "col-span-2" : ""}>
              <span className="text-muted-foreground">Conta:</span> {chartAccounts.find(c => c.id === values.chartAccountId)?.name || "Não informado"}
            </div>
          </div>

          <Separator className="my-2" />

          {/* Grid 2 colunas - Pagamento */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className="text-xs">
                {values.status === "pending" ? "Pendente" : values.status === "paid" ? "Pago" : "Cancelado"}
              </Badge>
            </div>
            
            <div>
              <span className="text-muted-foreground">Forma:</span> {paymentMethods.find(p => p.id === values.paymentMethodId)?.name || "Não informado"}
            </div>
            
            {values.status === "paid" && (
              <>
                <div>
                  <span className="text-muted-foreground">Conta Bancária:</span> {bankAccounts.find(b => b.id === values.bankAccountId)?.name || "Não informado"}
                </div>
                {values.paidDate && (
                  <div>
                    <span className="text-muted-foreground">Data Pgto:</span> {format(values.paidDate, "dd/MM/yyyy")}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Informações Adicionais */}
          {(values.description || parseFloat(values.discount || "0") > 0 || parseFloat(values.interest || "0") > 0 || parseFloat(values.fees || "0") > 0) && (
            <>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {values.description && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Descrição:</span> {values.description}
                  </div>
                )}
                {parseFloat(values.discount || "0") > 0 && (
                  <div>
                    <span className="text-muted-foreground">Desconto:</span> R$ {parseFloat(values.discount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                )}
                {parseFloat(values.interest || "0") > 0 && (
                  <div>
                    <span className="text-muted-foreground">Juros:</span> R$ {parseFloat(values.interest || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                )}
                {parseFloat(values.fees || "0") > 0 && (
                  <div>
                    <span className="text-muted-foreground">Taxas:</span> R$ {parseFloat(values.fees || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-2.5">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          ✓ Revise os dados acima e clique em <strong>"Salvar"</strong> para confirmar.
        </p>
      </div>
    </div>
  );
};

interface FormContentProps {
  form: UseFormReturn<FormValues>;
  currentStep: number;
  handleNext: () => void;
  handlePrevious: () => void;
  onSubmit: (data: FormValues) => void;
  isSubmitting: boolean;
  watchStatus: string | undefined;
  customersSuppliers: any[];
  costCenters: any[];
  chartAccounts: any[];
  paymentMethods: any[];
  bankAccounts: any[];
}

const FormContent = ({ 
  form, 
  currentStep, 
  handleNext, 
  handlePrevious, 
  onSubmit,
  isSubmitting,
  watchStatus,
  customersSuppliers,
  costCenters,
  chartAccounts,
  paymentMethods,
  bankAccounts
}: FormContentProps) => {
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Content form={form} />;
      case 2:
        return (
          <Step2Content 
            form={form} 
            customersSuppliers={customersSuppliers}
            costCenters={costCenters}
            chartAccounts={chartAccounts}
            paymentMethods={paymentMethods}
            bankAccounts={bankAccounts}
          />
        );
      case 3:
        return (
          <Step3Content 
            form={form} 
            customersSuppliers={customersSuppliers}
            costCenters={costCenters}
            chartAccounts={chartAccounts}
            paymentMethods={paymentMethods}
            bankAccounts={bankAccounts}
          />
        );
      case 4:
        return (
          <Step4Content 
            form={form}
            watchStatus={watchStatus}
            paymentMethods={paymentMethods}
            bankAccounts={bankAccounts}
            customersSuppliers={customersSuppliers}
            costCenters={costCenters}
            chartAccounts={chartAccounts}
          />
        );
      case 5:
        return (
          <Step5Content 
            form={form} 
            customersSuppliers={customersSuppliers}
            costCenters={costCenters}
            chartAccounts={chartAccounts}
            paymentMethods={paymentMethods}
            bankAccounts={bankAccounts}
          />
        );
      default:
        return null;
    }
  };

  const handleSaveClick = () => {
    // Valida e submete apenas quando usuário clica explicitamente no botão
    form.handleSubmit(onSubmit)();
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          // BLOQUEIA completamente qualquer submit automático (Enter key)
          e.preventDefault();
          e.stopPropagation();
        }} 
        className="space-y-4"
      >
        <ProgressStepper currentStep={currentStep} transactionType={form.getValues().type} />
        {renderStepContent()}

        <div className="flex gap-2 pt-4">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
              data-testid="button-previous"
            >
              Anterior
            </Button>
          )}
          
          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-foreground text-background hover:bg-foreground/90"
              data-testid="button-next"
            >
              Próximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSaveClick}
              className="flex-1 bg-foreground text-background hover:bg-foreground/90"
              disabled={isSubmitting || form.formState.isSubmitting}
              data-testid="button-save"
            >
              {(isSubmitting || form.formState.isSubmitting) ? "Salvando..." : "Salvar Lançamento"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  defaultType = "expense",
}: TransactionDialogProps) {
  const { toast } = useToast();
  const selectedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY);
  const [isMobile, setIsMobile] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const chartAccountAutoFilledRef = useRef(false);
  const isAutoFillingRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: selectedCompanyId || "",
      type: (transaction?.type as "expense" | "revenue") || defaultType,
      title: transaction?.title || "",
      description: transaction?.description || "",
      personId: transaction?.personId || undefined,
      costCenterId: transaction?.costCenterId || undefined,
      chartAccountId: transaction?.chartAccountId || undefined,
      costCenterDistributions: (transaction as any)?.costCenterDistributions || [],
      issueDate: transaction?.issueDate ? new Date(transaction.issueDate) : new Date(),
      dueDate: transaction?.dueDate ? new Date(transaction.dueDate) : new Date(),
      paidDate: transaction?.paidDate ? new Date(transaction.paidDate) : null,
      amount: transaction?.amount || "",
      paidAmount: transaction?.paidAmount || undefined,
      discount: transaction?.discount || "0",
      interest: transaction?.interest || "0",
      fees: transaction?.fees || "0",
      status: (transaction?.status as "pending" | "paid" | "overdue" | "cancelled") || "pending",
      bankAccountId: transaction?.bankAccountId || undefined,
      paymentMethodId: transaction?.paymentMethodId || undefined,
      cashRegisterId: transaction?.cashRegisterId || undefined,
      tags: transaction?.tags || [],
      attachmentsCount: transaction?.attachmentsCount || 0,
      isRecurring: transaction?.isRecurring || false,
      isReconciled: transaction?.isReconciled || false,
    },
  });

  const watchStatus = form.watch("status");

  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      form.reset({
        companyId: selectedCompanyId || "",
        type: (transaction?.type as "expense" | "revenue") || defaultType,
        title: transaction?.title || "",
        description: transaction?.description || "",
        personId: transaction?.personId || undefined,
        costCenterId: transaction?.costCenterId || undefined,
        chartAccountId: transaction?.chartAccountId || undefined,
        costCenterDistributions: (transaction as any)?.costCenterDistributions || [],
        issueDate: transaction?.issueDate ? new Date(transaction.issueDate) : new Date(),
        dueDate: transaction?.dueDate ? new Date(transaction.dueDate) : new Date(),
        paidDate: transaction?.paidDate ? new Date(transaction.paidDate) : null,
        amount: transaction?.amount || "",
        paidAmount: transaction?.paidAmount || undefined,
        discount: transaction?.discount || "0",
        interest: transaction?.interest || "0",
        fees: transaction?.fees || "0",
        status: (transaction?.status as "pending" | "paid" | "overdue" | "cancelled") || "pending",
        bankAccountId: transaction?.bankAccountId || undefined,
        paymentMethodId: transaction?.paymentMethodId || undefined,
        cashRegisterId: transaction?.cashRegisterId || undefined,
        tags: transaction?.tags || [],
        attachmentsCount: transaction?.attachmentsCount || 0,
        isRecurring: transaction?.isRecurring || false,
        isReconciled: transaction?.isReconciled || false,
      });
    }
  }, [open, transaction, defaultType, selectedCompanyId, form]);

  const { data: customersSuppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers-suppliers", { companyId: selectedCompanyId }],
    enabled: !!selectedCompanyId && open,
  });

  const { data: costCenters = [] } = useQuery<any[]>({
    queryKey: ["/api/cost-centers", { companyId: selectedCompanyId }],
    enabled: !!selectedCompanyId && open,
  });

  const { data: chartAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/chart-of-accounts", { companyId: selectedCompanyId }],
    enabled: !!selectedCompanyId && open,
  });

  const { data: bankAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/bank-accounts", { companyId: selectedCompanyId }],
    enabled: !!selectedCompanyId && open,
  });

  const { data: paymentMethods = [] } = useQuery<any[]>({
    queryKey: ["/api/payment-methods", { companyId: selectedCompanyId }],
    enabled: !!selectedCompanyId && open,
  });

  // Auto-fill chart account when person with default chart account is selected
  const watchPersonId = form.watch("personId");
  const watchChartAccountId = form.watch("chartAccountId");
  
  // Reset auto-filled flag when form opens
  useEffect(() => {
    if (open) {
      chartAccountAutoFilledRef.current = false;
      isAutoFillingRef.current = false;
    }
  }, [open]);
  
  // Detect manual chart account changes
  useEffect(() => {
    // If chart account changed and we're not currently auto-filling, it was manual
    if (!isAutoFillingRef.current && watchChartAccountId !== undefined) {
      chartAccountAutoFilledRef.current = false;
    }
  }, [watchChartAccountId]);
  
  // Auto-fill or clear chart account based on selected person's default
  useEffect(() => {
    if (!watchPersonId || !customersSuppliers.length) return;
    
    const selectedPerson = customersSuppliers.find((p: any) => p.id === watchPersonId);
    const currentChartAccountId = form.getValues("chartAccountId");
    
    if (selectedPerson?.defaultChartAccountId) {
      // Person has a default - auto-fill only if it was previously auto-filled or empty
      if (chartAccountAutoFilledRef.current || !currentChartAccountId) {
        isAutoFillingRef.current = true;
        form.setValue("chartAccountId", selectedPerson.defaultChartAccountId);
        chartAccountAutoFilledRef.current = true;
        setTimeout(() => {
          isAutoFillingRef.current = false;
        }, 0);
      }
      // If user manually selected a different chart account, don't override it
    } else {
      // Person has no default - clear only if it was auto-filled
      if (chartAccountAutoFilledRef.current) {
        isAutoFillingRef.current = true;
        form.setValue("chartAccountId", undefined);
        chartAccountAutoFilledRef.current = false;
        setTimeout(() => {
          isAutoFillingRef.current = false;
        }, 0);
      }
      // If user manually selected a chart account, leave it as is
    }
  }, [watchPersonId, customersSuppliers, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Sanitize data - remove undefined values and convert dates
      const sanitizedData = Object.entries({
        ...data,
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        paidDate: data.paidDate ? data.paidDate.toISOString() : null,
      }).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      return apiRequest("POST", "/api/transactions", sanitizedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dre-hierarchical"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/yearly-evolution"] });
      toast({
        title: "Sucesso!",
        description: "Lançamento criado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar lançamento.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!transaction?.id) {
        throw new Error("ID da transação não encontrado");
      }
      
      // CRITICAL FIX: Always use selectedCompanyId from localStorage
      // This is the most reliable and always available
      const companyIdToUse = selectedCompanyId || data.companyId;
      
      const finalUrl = `/api/transactions/${transaction.id}?companyId=${companyIdToUse}`;
      
      console.log("🔴 DEBUG 3 - Botão Salvar clicado:", {
        transactionId: transaction.id,
        selectedCompanyId,
        dataCompanyId: data.companyId,
        transactionCompanyId: transaction.companyId,
        companyIdToUse,
        finalUrl,
        willSendTo: finalUrl
      });
      
      if (!companyIdToUse) {
        throw new Error("Erro: Nenhuma empresa selecionada");
      }
      
      // Sanitize data - remove undefined values and convert dates
      const sanitizedData = Object.entries({
        ...data,
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        paidDate: data.paidDate ? data.paidDate.toISOString() : null,
      }).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      return apiRequest("PATCH", finalUrl, sanitizedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dre-hierarchical"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/yearly-evolution"] });
      toast({
        title: "Sucesso!",
        description: "Lançamento atualizado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar lançamento.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    // Validate cost center distributions total = 100%
    const distributions = data.costCenterDistributions || [];
    if (distributions.length > 0) {
      const total = distributions.reduce((sum, d) => sum + d.percentage, 0);
      if (total !== 100) {
        toast({
          title: "Erro de Validação",
          description: `A distribuição dos centros de custo deve somar 100%. Total atual: ${total}%`,
          variant: "destructive",
        });
        return;
      }
    }

    if (transaction) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {transaction ? "Editar Lançamento" : "Novo Lançamento"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FormContent 
              form={form}
              currentStep={currentStep}
              handleNext={handleNext}
              handlePrevious={handlePrevious}
              onSubmit={onSubmit}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
              watchStatus={watchStatus}
              customersSuppliers={customersSuppliers}
              costCenters={costCenters}
              chartAccounts={chartAccounts}
              paymentMethods={paymentMethods}
              bankAccounts={bankAccounts}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar Lançamento" : "Novo Lançamento"}
          </DialogTitle>
        </DialogHeader>
        <FormContent 
          form={form}
          currentStep={currentStep}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          onSubmit={onSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          watchStatus={watchStatus}
          customersSuppliers={customersSuppliers}
          costCenters={costCenters}
          chartAccounts={chartAccounts}
          paymentMethods={paymentMethods}
          bankAccounts={bankAccounts}
        />
      </DialogContent>
    </Dialog>
  );
}
