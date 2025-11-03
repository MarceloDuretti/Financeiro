import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Edit2,
  Save,
  X,
  Trash2,
  Loader2,
  Calendar as CalendarIcon,
  Copy,
  Repeat,
  Printer,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import type { Transaction, InsertTransaction, TransactionCostCenter } from "@shared/schema";
import { insertTransactionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { CustomerSupplier, CostCenter, ChartAccount, PaymentMethod, BankAccount } from "@shared/schema";

interface TransactionDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  monthlyTotals: {
    totalExpenses: number;
    totalRevenues: number;
  };
}

export function TransactionDetailSheet({
  open,
  onOpenChange,
  transaction,
  monthlyTotals,
}: TransactionDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Fetch reference data
  const { data: customersSuppliers = [] } = useQuery<CustomerSupplier[]>({
    queryKey: ["/api/customers-suppliers"],
  });

  const { data: costCenters = [] } = useQuery<CostCenter[]>({
    queryKey: ["/api/cost-centers"],
  });

  const { data: chartAccounts = [] } = useQuery<ChartAccount[]>({
    queryKey: ["/api/chart-of-accounts"],
  });

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  // Form setup
  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      companyId: "",
      type: "expense",
      title: "",
      description: "",
      personId: "",
      costCenterId: "",
      chartAccountId: "",
      issueDate: new Date(),
      dueDate: new Date(),
      paidDate: null,
      amount: "0",
      paidAmount: "",
      discount: "0",
      interest: "0",
      fees: "0",
      status: "pending",
      bankAccountId: "",
      paymentMethodId: "",
      cashRegisterId: "",
      tags: [],
      attachmentsCount: 0,
      isRecurring: false,
      seriesId: "",
      recurrenceConfig: null,
      installmentNumber: undefined,
      installmentTotal: undefined,
      isReconciled: false,
      reconciledAt: null,
    },
  });

  // Handle edit mode
  const handleEdit = () => {
    if (!transaction) return;

    console.log("🟢 DEBUG 2 - Botão Editar clicado:", {
      transactionId: transaction.id,
      transactionTitle: transaction.title,
      companyId: transaction.companyId,
      personId: transaction.personId,
      fullTransaction: transaction
    });

    form.reset({
      companyId: transaction.companyId,
      type: transaction.type as "expense" | "revenue",
      title: transaction.title,
      description: transaction.description || "",
      personId: transaction.personId || "",
      costCenterId: transaction.costCenterId || "",
      chartAccountId: transaction.chartAccountId || "",
      issueDate: transaction.issueDate ? new Date(transaction.issueDate) : new Date(),
      dueDate: transaction.dueDate ? new Date(transaction.dueDate) : new Date(),
      paidDate: transaction.paidDate ? new Date(transaction.paidDate) : null,
      amount: transaction.amount || "0",
      paidAmount: transaction.paidAmount || "",
      discount: transaction.discount || "0",
      interest: transaction.interest || "0",
      fees: transaction.fees || "0",
      status: transaction.status as "pending" | "paid" | "overdue" | "cancelled",
      bankAccountId: transaction.bankAccountId || "",
      paymentMethodId: transaction.paymentMethodId || "",
      cashRegisterId: transaction.cashRegisterId || "",
      tags: transaction.tags || [],
      attachmentsCount: transaction.attachmentsCount || 0,
      isRecurring: transaction.isRecurring || false,
      seriesId: transaction.seriesId || "",
      recurrenceConfig: transaction.recurrenceConfig || null,
      installmentNumber: transaction.installmentNumber || undefined,
      installmentTotal: transaction.installmentTotal || undefined,
      isReconciled: transaction.isReconciled || false,
      reconciledAt: transaction.reconciledAt ? new Date(transaction.reconciledAt) : null,
    });

    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.reset();
  };

  const handleSaveEdit = async () => {
    if (!transaction) return;

    try {
      setIsSaving(true);
      const formData = form.getValues();

      await apiRequest("PATCH", `/api/transactions/${transaction.id}`, {
        ...formData,
        version: transaction.version,
      });

      toast({
        title: "Sucesso",
        description: "Lançamento atualizado com sucesso",
      });

      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar lançamento",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;

    try {
      setIsDeleting(true);
      await apiRequest("DELETE", `/api/transactions/${transaction.id}?companyId=${transaction.companyId}`);

      toast({
        title: "Sucesso",
        description: "Lançamento excluído com sucesso",
      });

      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir lançamento",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!transaction) return null;

  const person = customersSuppliers.find((p) => p.id === transaction.personId);
  const costCenter = costCenters.find((c) => c.id === transaction.costCenterId);
  const chartAccount = chartAccounts.find((c) => c.id === transaction.chartAccountId);
  const paymentMethod = paymentMethods.find((p) => p.id === transaction.paymentMethodId);
  const bankAccount = bankAccounts.find((b) => b.id === transaction.bankAccountId);

  // Get cost center distributions from transaction
  const costCenterDistributions = (transaction as any).costCenterDistributions || [];
  const hasMultipleCostCenters = costCenterDistributions.length > 1;

  const amount = parseFloat(transaction.amount || "0");
  const total = transaction.type === "revenue" ? monthlyTotals.totalRevenues : monthlyTotals.totalExpenses;
  const percentage = total > 0 ? (amount / total) * 100 : 0;

  // Mock data for sparkline - simulating weekly cash flow
  // TODO: Replace with real API data from transactions
  const sparklineData = [
    { day: "Seg", value: 1200 },
    { day: "Ter", value: 2400 },
    { day: "Qua", value: 1800 },
    { day: "Qui", value: 3200 },
    { day: "Sex", value: 2800 },
    { day: "Sáb", value: 3500 },
    { day: "Dom", value: 4100 },
  ];

  // Mock cash flow metrics
  // TODO: Replace with real calculated values from API
  const accumulatedBalance = 4100.50;
  const dailyBalance = 850.25;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={true}>
      <SheetContent className={`w-full ${isEditing ? 'sm:max-w-6xl' : 'sm:max-w-4xl'} overflow-y-auto`}>
        <Form {...form}>
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <SheetTitle className="text-xl flex items-center gap-2">
                  {isEditing ? "Editando Lançamento" : "Detalhes"}
                  <Badge
                    variant={transaction.type === "expense" ? "destructive" : "default"}
                    className={transaction.type === "revenue" ? "bg-blue-600" : ""}
                  >
                    {transaction.type === "expense" ? "Despesa" : "Receita"}
                  </Badge>
                </SheetTitle>
              </div>
            </div>
          </SheetHeader>

          <div className={`mt-3 ${isEditing ? 'space-y-1.5' : 'space-y-2'}`}>
            {/* Top Section: Amount Card + All Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Amount Card - Financial Dashboard */}
              <Card className="border-0 bg-gradient-to-br from-card to-muted/30 shadow-md">
                <CardContent className={isEditing ? "p-3 space-y-1.5" : "p-4 space-y-2"}>
                  {/* Título do Módulo */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Impacto Financeiro
                    </h3>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Semana Atual
                    </Badge>
                  </div>

                  {/* Valor Principal */}
                  <div>
                    {!isEditing ? (
                      <div
                        className={`text-2xl font-bold tabular-nums ${
                          transaction.type === "expense" ? "text-destructive" : "text-blue-600"
                        }`}
                      >
                        {transaction.type === "expense" ? "-" : "+"} R${" "}
                        {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Valor do Lançamento</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                placeholder="0.00"
                                data-testid="input-amount"
                                className="h-8"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Barra de percentual */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Representa {percentage.toFixed(1)}% do total do mês
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          transaction.type === "expense" ? "bg-destructive" : "bg-blue-600"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Métricas de Fluxo de Caixa */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                        Saldo Acumulado
                      </p>
                      <p className="text-sm font-bold tabular-nums">
                        R$ {accumulatedBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                        Saldo do Dia
                      </p>
                      <p className="text-sm font-bold tabular-nums">
                        R$ {dailyBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Gráfico de Tendência Semanal */}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
                      Tendência Semanal
                    </p>
                    <ResponsiveContainer width="100%" height={80}>
                      <LineChart data={sparklineData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <XAxis 
                          dataKey="day" 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            fontSize: '11px',
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                          formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                </CardContent>
              </Card>

              {/* Status, Emissão, Vencimento, Título, Cliente (Vertical) */}
              <div className={isEditing ? "space-y-1.5" : "space-y-2"}>
                {/* Status */}
                <div>
                  {!isEditing ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                      <div className="border rounded-md px-3 py-2 bg-muted/20">
                        <Badge variant="outline" className="text-xs">
                          {transaction.status === "paid"
                            ? "Pago"
                            : transaction.status === "cancelled"
                            ? "Cancelado"
                            : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status" className="h-8">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="paid">Pago</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                              <SelectItem value="overdue">Vencido</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Emissão */}
                <div>
                  {!isEditing ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Emissão</p>
                      <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium">
                        {transaction.issueDate ? format(new Date(transaction.issueDate), "dd/MM/yyyy") : "-"}
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Emissão</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-8"
                              value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                              data-testid="input-issue-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Vencimento */}
                <div>
                  {!isEditing ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Vencimento</p>
                      <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium">
                        {transaction.dueDate ? format(new Date(transaction.dueDate), "dd/MM/yyyy") : "-"}
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Vencimento</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-8"
                              value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                              data-testid="input-due-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Título */}
                <div>
                  {!isEditing ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Título</p>
                      <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium">
                        {transaction.title}
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Título</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Título do lançamento" data-testid="input-title" className="h-8" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Pessoa (Cliente/Fornecedor) */}
                <div>
                  {!isEditing ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        {transaction.type === "expense" ? "Fornecedor" : "Cliente"}
                      </p>
                      <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium">
                        {person?.name || "-"}
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="personId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{transaction.type === "expense" ? "Fornecedor" : "Cliente"}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-person" className="h-8">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customersSuppliers.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Grid de 4 colunas quando editando: Centro de Custo, Conta Contábil, Forma de Pagamento, Conta Bancária */}
            <div className={`grid grid-cols-1 ${isEditing ? 'md:grid-cols-4' : 'md:grid-cols-2'} ${isEditing ? 'gap-1.5' : 'gap-2'}`}>
              {/* Centro de Custo */}
              <div>
                {!isEditing ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      {hasMultipleCostCenters ? "Centros de Custo" : "Centro de Custo"}
                    </p>
                    {costCenterDistributions.length > 0 ? (
                      <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm space-y-1">
                        {costCenterDistributions.map((dist: any) => {
                          const cc = costCenters.find((c) => c.id === dist.costCenterId);
                          return (
                            <div key={dist.costCenterId} className="flex items-center justify-between">
                              <span className="font-medium">{cc?.name || "-"}</span>
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                {dist.percentage}%
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium">
                        {costCenter?.name || "-"}
                      </div>
                    )}
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="costCenterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Centro de Custo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-cost-center" className="h-8">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {costCenters.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              {/* Conta Contábil */}
              <div>
                {!isEditing ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Conta Contábil</p>
                    <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium">
                      {chartAccount?.name || "-"}
                    </div>
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="chartAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Conta Contábil</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-chart-account" className="h-8">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {chartAccounts.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Forma de Pagamento - só no grid quando editando */}
              {isEditing && (
                <div>
                  <FormField
                    control={form.control}
                    name="paymentMethodId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Forma de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-method" className="h-8">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentMethods.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Conta Bancária - só no grid quando editando */}
              {isEditing && (
                <div>
                  <FormField
                    control={form.control}
                    name="bankAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Conta Bancária</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-bank-account" className="h-8">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bankAccounts.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.accountNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Grid de 2 colunas: Forma de Pagamento (quando não editando), Conta Bancária */}
            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Forma de Pagamento */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Forma de Pagamento</p>
                  <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium">
                    {paymentMethod?.name || "-"}
                  </div>
                </div>

                {/* Conta Bancária */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Conta Bancária</p>
                  <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium">
                    {bankAccount?.accountNumber || "-"}
                  </div>
                </div>
              </div>
            )}

            <Separator className={isEditing ? "my-1" : "my-2"} />

            {/* Descrição */}
            <div>
              {!isEditing ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Observações</p>
                  <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium">
                    {transaction.description || "Sem observações"}
                  </div>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Observações adicionais..."
                          rows={3}
                          className="resize-none"
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Action Buttons - com fundos coloridos */}
            <div className={isEditing ? "pt-2 mt-2" : "pt-4 mt-4"}>
              {!isEditing ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleEdit}
                    data-testid="button-edit"
                  >
                    <Edit2 className="h-4 w-4 mr-1.5" />
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Clonar Lançamento",
                        description: "Funcionalidade em desenvolvimento",
                      });
                    }}
                    data-testid="button-clone"
                  >
                    <Copy className="h-4 w-4 mr-1.5" />
                    Clonar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Recorrência",
                        description: "Funcionalidade em desenvolvimento",
                      });
                    }}
                    data-testid="button-recurring"
                  >
                    <Repeat className="h-4 w-4 mr-1.5" />
                    Recorrente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Imprimir",
                        description: "Funcionalidade em desenvolvimento",
                      });
                    }}
                    data-testid="button-print"
                  >
                    <Printer className="h-4 w-4 mr-1.5" />
                    Imprimir
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        data-testid="button-delete-trigger"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-testid="button-delete-confirm"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Excluindo...
                            </>
                          ) : (
                            "Excluir"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    data-testid="button-cancel"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    data-testid="button-save"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
