import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Check, AlertCircle, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  type: z.enum(["revenue", "expense"]),
  amount: z.string().min(1, "Valor é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  personName: z.string().optional(),
  issueDate: z.string().min(1, "Data de emissão é obrigatória"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  personId: z.string().optional(),
  chartAccountId: z.string().optional(),
  costCenterId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  count: z.coerce.number().min(1, "Mínimo 1").max(50, "Máximo 50").optional(), // Coerce string to number
});

type FormData = z.infer<typeof formSchema>;

interface SingleTransaction {
  type?: "revenue" | "expense";
  amount?: string;
  title?: string;
  description?: string;
  personName?: string;
  dueDate?: string;
  personId?: string;
  chartAccountId?: string;
  costCenterId?: string;
  paymentMethodId?: string;
}

interface BatchTransactionCommand {
  operation: "create_multiple" | "clone_by_code" | "clone_period" | "unknown";
  transactions: SingleTransaction[];
  cloneConfig?: {
    sourceCode?: string;
    periodType?: "daily" | "weekly" | "monthly" | "yearly";
    count?: number;
    overrides?: {
      personName?: string;
      amount?: string;
      title?: string;
      description?: string;
      type?: "revenue" | "expense";
    };
  };
  missingFields: string[];
  needsCountInput: boolean;
  validationIssues: string[];
  confidence: number;
}

interface AITransactionFormProps {
  command: BatchTransactionCommand;
  onSubmit: (data: FormData & { transactionCount: number }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AITransactionForm({
  command,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AITransactionFormProps) {
  const [showTransactionList, setShowTransactionList] = useState(false);
  const transactionCount = command.transactions.length;
  const firstTransaction = command.transactions[0] || {};

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: firstTransaction.type || "expense",
      amount: firstTransaction.amount || "",
      title: firstTransaction.title || "",
      description: firstTransaction.description || "",
      personName: firstTransaction.personName || "",
      issueDate: firstTransaction.dueDate || format(new Date(), "yyyy-MM-dd"),
      dueDate: firstTransaction.dueDate || "",
      personId: firstTransaction.personId || "",
      chartAccountId: firstTransaction.chartAccountId || "",
      costCenterId: firstTransaction.costCenterId || "",
      paymentMethodId: firstTransaction.paymentMethodId || "",
      count: command.needsCountInput ? undefined : transactionCount,
    },
  });

  const hasValue = (field: keyof FormData) => {
    const value = form.getValues(field);
    return value !== undefined && value !== "";
  };

  const isMissing = (field: string) => {
    return command.missingFields.includes(field);
  };

  const wasFilledByAI = (field: keyof FormData): boolean => {
    const aiFilledFields = ['type', 'amount', 'title', 'description', 'personName', 'issueDate', 'dueDate'] as const;
    if (aiFilledFields.includes(field as any)) {
      const commandValue = firstTransaction[field as keyof typeof firstTransaction];
      return commandValue !== undefined && commandValue !== "";
    }
    return false;
  };

  const getFieldStatus = (field: keyof FormData): "filled" | "missing" | "suggested" | null => {
    const currentHasValue = hasValue(field);
    
    if (isMissing(field)) {
      return "missing";
    }
    
    if (currentHasValue) {
      if (wasFilledByAI(field)) {
        return "filled";
      }
    }
    
    return null;
  };

  const handleSubmit = (data: FormData) => {
    const finalCount = command.needsCountInput 
      ? (data.count || transactionCount) 
      : transactionCount;
    
    onSubmit({
      ...data,
      transactionCount: finalCount,
    });
  };

  return (
    <div className="space-y-2">
      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Complementar Informações</h3>
          <p className="text-[10px] text-muted-foreground">
            {transactionCount === 1 ? "Complete os campos" : `${transactionCount} lançamentos`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="font-mono text-[9px] h-4 px-1">
            {transactionCount}x
          </Badge>
          <Badge variant={command.confidence > 0.7 ? "default" : "secondary"} className="text-[9px] h-4 px-1">
            {(command.confidence * 100).toFixed(0)}%
          </Badge>
        </div>
      </div>

      {/* Validation issues alert - Compact */}
      {command.validationIssues && command.validationIssues.length > 0 && (
        <div className="flex items-start gap-1.5 p-1.5 rounded-md bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-[10px] font-medium text-red-900 dark:text-red-100">
              Problemas: {command.validationIssues.join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Missing fields alert - Compact */}
      {command.missingFields.length > 0 && (
        <div className="flex items-start gap-1.5 p-1.5 rounded-md bg-yellow-500/10 border border-yellow-500/20">
          <AlertCircle className="w-3 h-3 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <p className="text-[10px] font-medium text-yellow-900 dark:text-yellow-100">
            Faltantes: {command.missingFields.join(", ")}
          </p>
        </div>
      )}

      {/* Clone config info - Compact */}
      {command.cloneConfig && (
        <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
          <p className="text-[10px] font-medium text-blue-900 dark:text-blue-100">
            {command.operation === 'clone_by_code' && command.cloneConfig.sourceCode && (
              <>Clone: <span className="font-mono">{command.cloneConfig.sourceCode}</span></>
            )}
            {command.operation === 'clone_period' && (
              <>Clone {command.cloneConfig.periodType === 'monthly' ? 'mensal' : 
                         command.cloneConfig.periodType === 'weekly' ? 'semanal' :
                         command.cloneConfig.periodType === 'yearly' ? 'anual' : 'diário'}</>
            )}
            {command.cloneConfig.count && ` - ${command.cloneConfig.count}x`}
          </p>
        </div>
      )}

      {/* Transaction list preview - Very Compact */}
      {transactionCount > 1 && (
        <Collapsible open={showTransactionList} onOpenChange={setShowTransactionList}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between h-7 text-[10px]"
              size="sm"
              data-testid="button-toggle-transaction-list"
            >
              <span>Ver lista ({transactionCount})</span>
              {showTransactionList ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <ScrollArea className="h-[80px] rounded-md border p-1.5">
              <div className="space-y-0.5">
                {command.transactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-1.5 p-1 rounded-md bg-muted/30 text-[9px]"
                    data-testid={`transaction-preview-${index}`}
                  >
                    <Badge
                      variant={transaction.type === 'expense' ? 'destructive' : 'default'}
                      className={`text-[8px] h-3 px-0.5 ${
                        transaction.type === 'revenue' ? 'bg-blue-600 hover:bg-blue-700' : ''
                      }`}
                    >
                      {transaction.type === 'expense' ? 'D' : 'R'}
                    </Badge>
                    <span className="flex-1 truncate font-medium">
                      {transaction.title || 'Sem título'}
                    </span>
                    <span className="text-muted-foreground">
                      {transaction.dueDate ? format(parse(transaction.dueDate, 'yyyy-MM-dd', new Date()), 'dd/MM') : '-'}
                    </span>
                    <span className={cn(
                      "font-semibold",
                      transaction.type === 'expense' ? 'text-destructive' : 'text-blue-600'
                    )}>
                      {transaction.amount}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Form - Compact */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-1.5">
          {transactionCount > 1 && (
            <div className="flex items-center gap-1.5 p-1 rounded-md bg-blue-500/10 border border-blue-500/20">
              <Copy className="w-3 h-3 text-blue-600" />
              <p className="text-[9px] text-blue-800 dark:text-blue-200">
                Referência - alterações aplicadas a todos {transactionCount} lançamentos
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Type - Compact */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] flex items-center gap-1">
                    Tipo
                    {getFieldStatus("type") === "filled" && (
                      <Check className="w-2.5 h-2.5 text-green-600" />
                    )}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger
                        data-testid="select-transaction-type"
                        className={cn(
                          "h-8",
                          getFieldStatus("type") === "filled" &&
                            "border-green-500 bg-green-500/5"
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="revenue">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount - Compact */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] flex items-center gap-1">
                    Valor
                    {getFieldStatus("amount") === "filled" && (
                      <Check className="w-2.5 h-2.5 text-green-600" />
                    )}
                    {getFieldStatus("amount") === "missing" && (
                      <AlertCircle className="w-2.5 h-2.5 text-yellow-600" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      data-testid="input-amount"
                      placeholder="0,00"
                      className={cn(
                        "h-8",
                        getFieldStatus("amount") === "filled" &&
                          "border-green-500 bg-green-500/5",
                        getFieldStatus("amount") === "missing" &&
                          "border-yellow-500 bg-yellow-500/5"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Title - Compact */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] flex items-center gap-1">
                  Título
                  {getFieldStatus("title") === "filled" && (
                    <Check className="w-2.5 h-2.5 text-green-600" />
                  )}
                  {getFieldStatus("title") === "missing" && (
                    <AlertCircle className="w-2.5 h-2.5 text-yellow-600" />
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    data-testid="input-title"
                    placeholder="Ex: Pagamento fornecedor"
                    className={cn(
                      "h-8",
                      getFieldStatus("title") === "filled" &&
                        "border-green-500 bg-green-500/5",
                      getFieldStatus("title") === "missing" &&
                        "border-yellow-500 bg-yellow-500/5"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description - Compact */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] flex items-center gap-1">
                  Descrição
                  {getFieldStatus("description") === "filled" && (
                    <Check className="w-2.5 h-2.5 text-green-600" />
                  )}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    data-testid="input-description"
                    placeholder="Detalhes..."
                    rows={2}
                    className={cn(
                      "text-xs",
                      getFieldStatus("description") === "filled" &&
                        "border-green-500 bg-green-500/5"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Person Name - Compact */}
            <FormField
              control={form.control}
              name="personName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] flex items-center gap-1">
                    Cliente/Fornecedor
                    {getFieldStatus("personName") === "filled" && (
                      <Check className="w-2.5 h-2.5 text-green-600" />
                    )}
                    {getFieldStatus("personName") === "missing" && (
                      <AlertCircle className="w-2.5 h-2.5 text-yellow-600" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      data-testid="input-person-name"
                      placeholder="Nome"
                      className={cn(
                        "h-8",
                        getFieldStatus("personName") === "filled" &&
                          "border-green-500 bg-green-500/5",
                        getFieldStatus("personName") === "missing" &&
                          "border-yellow-500 bg-yellow-500/5"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date - Compact */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] flex items-center gap-1">
                    {transactionCount > 1 ? 'Data Inicial' : 'Data'}
                    {getFieldStatus("dueDate") === "filled" && (
                      <Check className="w-2.5 h-2.5 text-green-600" />
                    )}
                    {getFieldStatus("dueDate") === "missing" && (
                      <AlertCircle className="w-2.5 h-2.5 text-yellow-600" />
                    )}
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          data-testid="button-due-date"
                          className={cn(
                            "w-full justify-start text-left font-normal h-8 text-xs",
                            !field.value && "text-muted-foreground",
                            getFieldStatus("dueDate") === "filled" &&
                              "border-green-500 bg-green-500/5",
                            getFieldStatus("dueDate") === "missing" &&
                              "border-yellow-500 bg-yellow-500/5"
                          )}
                        >
                          <CalendarIcon className="mr-1.5 h-3 w-3" />
                          {field.value
                            ? format(
                                parse(field.value, "yyyy-MM-dd", new Date()),
                                "dd/MM/yyyy",
                                { locale: ptBR }
                              )
                            : "Selecione"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value
                            ? parse(field.value, "yyyy-MM-dd", new Date())
                            : undefined
                        }
                        onSelect={(date) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Count input - Compact */}
          {command.needsCountInput && (
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] flex items-center gap-1">
                    Quantidade
                    <AlertCircle className="w-2.5 h-2.5 text-yellow-600" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      max="50"
                      data-testid="input-count"
                      placeholder="Máx: 50"
                      className="h-8 border-yellow-500 bg-yellow-500/5"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    Quantos lançamentos criar (limite: 50)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Actions - Compact */}
          <div className="flex justify-end gap-1.5 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              data-testid="button-cancel"
              size="sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-submit"
              size="sm"
            >
              {isSubmitting ? "Processando..." : "Continuar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
