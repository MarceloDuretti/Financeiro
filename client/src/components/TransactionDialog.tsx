import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { CalendarIcon, TrendingDown, TrendingUp, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertTransactionSchema, type Transaction } from "@shared/schema";

const SELECTED_COMPANY_KEY = "fincontrol_selected_company_id";

// Schema para o formulário (adapta dates para compatibilidade)
const formSchema = insertTransactionSchema.extend({
  issueDate: z.date(),
  dueDate: z.date(),
  paidDate: z.date().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  defaultType?: "expense" | "revenue";
}

const STEPS = [
  { id: 1, title: "Tipo e Dados Básicos" },
  { id: 2, title: "Categorização" },
  { id: 3, title: "Forma de Pagamento" },
  { id: 4, title: "Informações Adicionais" },
  { id: 5, title: "Revisão Final" },
];

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

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: selectedCompanyId || "",
      type: transaction?.type || defaultType,
      title: transaction?.title || "",
      description: transaction?.description || "",
      personId: transaction?.personId || undefined,
      costCenterId: transaction?.costCenterId || undefined,
      chartAccountId: transaction?.chartAccountId || undefined,
      issueDate: transaction?.issueDate ? new Date(transaction.issueDate) : new Date(),
      dueDate: transaction?.dueDate ? new Date(transaction.dueDate) : new Date(),
      paidDate: transaction?.paidDate ? new Date(transaction.paidDate) : null,
      amount: transaction?.amount || "",
      paidAmount: transaction?.paidAmount || undefined,
      discount: transaction?.discount || "0",
      interest: transaction?.interest || "0",
      fees: transaction?.fees || "0",
      status: transaction?.status || "pending",
      bankAccountId: transaction?.bankAccountId || undefined,
      paymentMethodId: transaction?.paymentMethodId || undefined,
      cashRegisterId: transaction?.cashRegisterId || undefined,
      tags: transaction?.tags || [],
      attachmentsCount: transaction?.attachmentsCount || 0,
      isRecurring: transaction?.isRecurring || false,
      isReconciled: transaction?.isReconciled || false,
    },
  });

  // Watch fields
  const watchType = form.watch("type");
  const watchStatus = form.watch("status");
  const watchTitle = form.watch("title");
  const watchAmount = form.watch("amount");
  const watchIssueDate = form.watch("issueDate");
  const watchDueDate = form.watch("dueDate");

  // Reset form when dialog opens or transaction changes
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      form.reset({
        companyId: selectedCompanyId || "",
        type: transaction?.type || defaultType,
        title: transaction?.title || "",
        description: transaction?.description || "",
        personId: transaction?.personId || undefined,
        costCenterId: transaction?.costCenterId || undefined,
        chartAccountId: transaction?.chartAccountId || undefined,
        issueDate: transaction?.issueDate ? new Date(transaction.issueDate) : new Date(),
        dueDate: transaction?.dueDate ? new Date(transaction.dueDate) : new Date(),
        paidDate: transaction?.paidDate ? new Date(transaction.paidDate) : null,
        amount: transaction?.amount || "",
        paidAmount: transaction?.paidAmount || undefined,
        discount: transaction?.discount || "0",
        interest: transaction?.interest || "0",
        fees: transaction?.fees || "0",
        status: transaction?.status || "pending",
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

  // Queries for select options
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/transactions", {
        ...data,
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        paidDate: data.paidDate ? data.paidDate.toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
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

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
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

  // Summary Component - Shows what was filled in previous steps
  const StepSummary = ({ step }: { step: number }) => {
    const values = form.getValues();

    if (step < 1) return null;

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-semibold">Resumo das Etapas Anteriores</h3>
          </div>
          <Separator className="mb-3" />
          <div className="space-y-2 text-sm">
            {step >= 2 && (
              <div>
                <p className="font-medium text-muted-foreground mb-1">Etapa 1: Dados Básicos</p>
                <div className="space-y-1 pl-4">
                  <p>
                    <span className="text-muted-foreground">Tipo:</span>{" "}
                    <Badge variant={values.type === "expense" ? "destructive" : "default"} className="ml-1">
                      {values.type === "expense" ? "Despesa" : "Receita"}
                    </Badge>
                  </p>
                  <p><span className="text-muted-foreground">Título:</span> {values.title || "-"}</p>
                  <p><span className="text-muted-foreground">Valor:</span> R$ {parseFloat(values.amount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p><span className="text-muted-foreground">Data Emissão:</span> {format(values.issueDate, "dd/MM/yyyy")}</p>
                  <p><span className="text-muted-foreground">Vencimento:</span> {format(values.dueDate, "dd/MM/yyyy")}</p>
                </div>
              </div>
            )}

            {step >= 3 && (
              <div>
                <Separator className="my-2" />
                <p className="font-medium text-muted-foreground mb-1">Etapa 2: Categorização</p>
                <div className="space-y-1 pl-4">
                  <p><span className="text-muted-foreground">Pessoa:</span> {customersSuppliers.find(p => p.id === values.personId)?.name || "-"}</p>
                  <p><span className="text-muted-foreground">Centro de Custo:</span> {costCenters.find(c => c.id === values.costCenterId)?.name || "-"}</p>
                  <p><span className="text-muted-foreground">Plano de Contas:</span> {chartAccounts.find(c => c.id === values.chartAccountId)?.name || "-"}</p>
                </div>
              </div>
            )}

            {step >= 4 && (
              <div>
                <Separator className="my-2" />
                <p className="font-medium text-muted-foreground mb-1">Etapa 3: Forma de Pagamento</p>
                <div className="space-y-1 pl-4">
                  <p><span className="text-muted-foreground">Status:</span> {values.status === "pending" ? "Pendente" : values.status === "paid" ? "Pago" : "Cancelado"}</p>
                  <p><span className="text-muted-foreground">Forma de Pagamento:</span> {paymentMethods.find(p => p.id === values.paymentMethodId)?.name || "-"}</p>
                  <p><span className="text-muted-foreground">Conta Bancária:</span> {bankAccounts.find(b => b.id === values.bankAccountId)?.name || "-"}</p>
                </div>
              </div>
            )}

            {step >= 5 && (
              <div>
                <Separator className="my-2" />
                <p className="font-medium text-muted-foreground mb-1">Etapa 4: Informações Adicionais</p>
                <div className="space-y-1 pl-4">
                  <p><span className="text-muted-foreground">Descrição:</span> {values.description || "-"}</p>
                  <p><span className="text-muted-foreground">Tags:</span> {values.tags?.length || 0} tag(s)</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Step Content Components
  const Step1Content = () => (
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

  const Step2Content = () => (
    <div className="space-y-4">
      <StepSummary step={2} />

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

      <FormField
        control={form.control}
        name="costCenterId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Centro de Custo</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-cost-center">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {costCenters.map((cc) => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.name} ({cc.code})
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
        name="chartAccountId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Plano de Contas</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-chart-account">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {chartAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const Step3Content = () => (
    <div className="space-y-4">
      <StepSummary step={3} />

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

  const Step4Content = () => (
    <div className="space-y-4">
      <StepSummary step={4} />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição/Observações</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Informações adicionais (opcional)"
                className="resize-none"
                rows={4}
                {...field}
                data-testid="input-description"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="discount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Desconto</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0,00" {...field} data-testid="input-discount" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Juros</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0,00" {...field} data-testid="input-interest" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taxas</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0,00" {...field} data-testid="input-fees" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const Step5Content = () => {
    const values = form.getValues();

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Revisão Final - Confirme os Dados</h3>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Tipo e Valores</p>
              <div className="pl-4 space-y-1">
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">Tipo:</span>
                  <Badge variant={values.type === "expense" ? "destructive" : "default"} className={cn(
                    values.type === "revenue" && "bg-blue-600 hover:bg-blue-700"
                  )}>
                    {values.type === "expense" ? "Despesa" : "Receita"}
                  </Badge>
                </p>
                <p><span className="text-muted-foreground">Título:</span> <span className="font-medium">{values.title}</span></p>
                <p><span className="text-muted-foreground">Valor:</span> <span className="font-bold text-lg">R$ {parseFloat(values.amount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></p>
                <p><span className="text-muted-foreground">Data Emissão:</span> {format(values.issueDate, "dd/MM/yyyy")}</p>
                <p><span className="text-muted-foreground">Vencimento:</span> {format(values.dueDate, "dd/MM/yyyy")}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Categorização</p>
              <div className="pl-4 space-y-1">
                <p><span className="text-muted-foreground">Pessoa:</span> {customersSuppliers.find(p => p.id === values.personId)?.name || "Não informado"}</p>
                <p><span className="text-muted-foreground">Centro de Custo:</span> {costCenters.find(c => c.id === values.costCenterId)?.name || "Não informado"}</p>
                <p><span className="text-muted-foreground">Plano de Contas:</span> {chartAccounts.find(c => c.id === values.chartAccountId)?.name || "Não informado"}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Pagamento</p>
              <div className="pl-4 space-y-1">
                <p><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{values.status === "pending" ? "Pendente" : values.status === "paid" ? "Pago" : "Cancelado"}</Badge></p>
                <p><span className="text-muted-foreground">Forma de Pagamento:</span> {paymentMethods.find(p => p.id === values.paymentMethodId)?.name || "Não informado"}</p>
                {values.status === "paid" && (
                  <>
                    <p><span className="text-muted-foreground">Conta Bancária:</span> {bankAccounts.find(b => b.id === values.bankAccountId)?.name || "Não informado"}</p>
                    {values.paidDate && <p><span className="text-muted-foreground">Data Pagamento:</span> {format(values.paidDate, "dd/MM/yyyy")}</p>}
                  </>
                )}
              </div>
            </div>

            {(values.description || parseFloat(values.discount || "0") > 0 || parseFloat(values.interest || "0") > 0 || parseFloat(values.fees || "0") > 0) && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Informações Adicionais</p>
                  <div className="pl-4 space-y-1">
                    {values.description && <p><span className="text-muted-foreground">Descrição:</span> {values.description}</p>}
                    {parseFloat(values.discount || "0") > 0 && <p><span className="text-muted-foreground">Desconto:</span> R$ {parseFloat(values.discount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}
                    {parseFloat(values.interest || "0") > 0 && <p><span className="text-muted-foreground">Juros:</span> R$ {parseFloat(values.interest || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}
                    {parseFloat(values.fees || "0") > 0 && <p><span className="text-muted-foreground">Taxas:</span> R$ {parseFloat(values.fees || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            Revise todas as informações acima. Ao clicar em <strong>"Salvar"</strong>, o lançamento será criado e não poderá ser desfeito.
          </p>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Content />;
      case 2:
        return <Step2Content />;
      case 3:
        return <Step3Content />;
      case 4:
        return <Step4Content />;
      case 5:
        return <Step5Content />;
      default:
        return null;
    }
  };

  // Progress Stepper
  const ProgressStepper = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
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
                currentStep > step.id ? "bg-primary" : "bg-muted"
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

  const FormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ProgressStepper />
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
              className="flex-1"
              data-testid="button-next"
            >
              Próximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending}
              data-testid="button-save"
            >
              {createMutation.isPending ? "Salvando..." : "Salvar Lançamento"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );

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
            <FormContent />
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
        <FormContent />
      </DialogContent>
    </Dialog>
  );
}
