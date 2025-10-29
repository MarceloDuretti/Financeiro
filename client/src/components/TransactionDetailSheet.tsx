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
} from "lucide-react";
import type { Transaction, InsertTransaction } from "@shared/schema";
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
      await apiRequest("DELETE", `/api/transactions/${transaction.id}`);

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

  const amount = parseFloat(transaction.amount || "0");
  const total = transaction.type === "revenue" ? monthlyTotals.totalRevenues : monthlyTotals.totalExpenses;
  const percentage = total > 0 ? (amount / total) * 100 : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <Form {...form}>
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <SheetTitle className="text-2xl flex items-center gap-3">
                  {isEditing ? "Editando Lançamento" : "Detalhes do Lançamento"}
                  <Badge
                    variant={transaction.type === "expense" ? "destructive" : "default"}
                    className={transaction.type === "revenue" ? "bg-blue-600" : ""}
                  >
                    {transaction.type === "expense" ? "Despesa" : "Receita"}
                  </Badge>
                </SheetTitle>
                <SheetDescription className="mt-1">
                  {transaction.createdAt && format(new Date(transaction.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Amount Card */}
            <Card className="border-0 bg-gradient-to-br from-card to-muted/30 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {!isEditing ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Valor</p>
                        <div
                          className={`text-4xl font-bold tabular-nums tracking-tight ${
                            transaction.type === "expense" ? "text-destructive" : "text-blue-600"
                          }`}
                        >
                          {transaction.type === "expense" ? "-" : "+"} R${" "}
                          {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Representa {percentage.toFixed(1)}% do total do mês
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              transaction.type === "expense" ? "bg-destructive" : "bg-blue-600"
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              placeholder="0.00"
                              data-testid="input-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                📋 Informações Básicas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  {!isEditing ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                      <Badge variant="outline">
                        {transaction.status === "paid"
                          ? "Pago"
                          : transaction.status === "cancelled"
                          ? "Cancelado"
                          : "Pendente"}
                      </Badge>
                    </>
                  ) : (
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
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

                {/* Vencimento */}
                <div>
                  {!isEditing ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-1.5">Vencimento</p>
                      <p className="text-sm font-medium">
                        {transaction.dueDate ? format(new Date(transaction.dueDate), "dd/MM/yyyy") : "-"}
                      </p>
                    </>
                  ) : (
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vencimento</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
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

                {/* Emissão */}
                <div>
                  {!isEditing ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-1.5">Emissão</p>
                      <p className="text-sm font-medium">
                        {transaction.issueDate ? format(new Date(transaction.issueDate), "dd/MM/yyyy") : "-"}
                      </p>
                    </>
                  ) : (
                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emissão</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
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
              </div>

              {/* Título */}
              <div>
                {!isEditing ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-1.5">Título</p>
                    <p className="text-sm font-medium">{transaction.title}</p>
                  </>
                ) : (
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Título do lançamento" data-testid="input-title" />
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
                  <>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      {transaction.type === "expense" ? "Fornecedor" : "Cliente"}
                    </p>
                    <p className="text-sm font-medium">{person?.name || "-"}</p>
                  </>
                ) : (
                  <FormField
                    control={form.control}
                    name="personId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{transaction.type === "expense" ? "Fornecedor" : "Cliente"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-person">
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

            <Separator />

            {/* Categorização */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                🏷️ Categorização
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Centro de Custo */}
                <div>
                  {!isEditing ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-1.5">Centro de Custo</p>
                      <p className="text-sm font-medium">{costCenter?.name || "-"}</p>
                    </>
                  ) : (
                    <FormField
                      control={form.control}
                      name="costCenterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Centro de Custo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-cost-center">
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
                    <>
                      <p className="text-xs text-muted-foreground mb-1.5">Conta Contábil</p>
                      <p className="text-sm font-medium">{chartAccount?.name || "-"}</p>
                    </>
                  ) : (
                    <FormField
                      control={form.control}
                      name="chartAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conta Contábil</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-chart-account">
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
              </div>
            </div>

            <Separator />

            {/* Pagamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                💳 Pagamento
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Forma de Pagamento */}
                <div>
                  {!isEditing ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-1.5">Forma de Pagamento</p>
                      <p className="text-sm font-medium">{paymentMethod?.name || "-"}</p>
                    </>
                  ) : (
                    <FormField
                      control={form.control}
                      name="paymentMethodId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forma de Pagamento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-payment-method">
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
                  )}
                </div>

                {/* Conta Bancária */}
                <div>
                  {!isEditing ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-1.5">Conta Bancária</p>
                      <p className="text-sm font-medium">{bankAccount?.accountNumber || "-"}</p>
                    </>
                  ) : (
                    <FormField
                      control={form.control}
                      name="bankAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conta Bancária</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-bank-account">
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
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Observações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                📝 Observações
              </h3>

              <div>
                {!isEditing ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-1.5">Descrição</p>
                    <p className="text-sm whitespace-pre-wrap">{transaction.description || "Sem observações"}</p>
                  </>
                ) : (
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Observações adicionais..."
                            className="min-h-[100px]"
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleEdit}
                    data-testid="button-edit"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex-1" data-testid="button-delete-trigger">
                        <Trash2 className="h-4 w-4 mr-2" />
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
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    data-testid="button-cancel"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
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
                </>
              )}
            </div>
          </div>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
