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
    <div className="space-y-6">
      {/* Header with confidence and transaction count */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Complementar Informações</h3>
          <p className="text-sm text-muted-foreground">
            {transactionCount === 1 
              ? "Preencha os campos faltantes e revise as informações"
              : `${transactionCount} lançamentos detectados - revise e complete`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {transactionCount} {transactionCount === 1 ? 'lançamento' : 'lançamentos'}
          </Badge>
          <Badge variant={command.confidence > 0.7 ? "default" : "secondary"}>
            Confiança: {(command.confidence * 100).toFixed(0)}%
          </Badge>
        </div>
      </div>

      {/* Validation issues alert */}
      {command.validationIssues && command.validationIssues.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Problemas de validação detectados
            </p>
            <ul className="text-xs text-red-800 dark:text-red-200 mt-1 list-disc list-inside">
              {command.validationIssues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Missing fields alert */}
      {command.missingFields.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Campos faltantes detectados
            </p>
            <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
              {command.missingFields.join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Clone config info */}
      {command.cloneConfig && (
        <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {command.operation === 'clone_by_code' && command.cloneConfig.sourceCode && (
              <>Clonando a partir de: <span className="font-mono">{command.cloneConfig.sourceCode}</span></>
            )}
            {command.operation === 'clone_period' && (
              <>Clonagem {command.cloneConfig.periodType === 'monthly' ? 'mensal' : 
                         command.cloneConfig.periodType === 'weekly' ? 'semanal' :
                         command.cloneConfig.periodType === 'yearly' ? 'anual' : 'diária'}</>
            )}
          </p>
          {command.cloneConfig.count && (
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
              {command.cloneConfig.count} ocorrências
            </p>
          )}
        </div>
      )}

      {/* Transaction list preview (collapsible) */}
      {transactionCount > 1 && (
        <Collapsible open={showTransactionList} onOpenChange={setShowTransactionList}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              data-testid="button-toggle-transaction-list"
            >
              <span>Ver lista de lançamentos ({transactionCount})</span>
              {showTransactionList ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <ScrollArea className="h-[200px] rounded-md border p-3">
              <div className="space-y-2">
                {command.transactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30 text-xs"
                    data-testid={`transaction-preview-${index}`}
                  >
                    <Badge
                      variant={transaction.type === 'expense' ? 'destructive' : 'default'}
                      className={`text-[10px] h-5 px-1.5 ${
                        transaction.type === 'revenue' ? 'bg-blue-600 hover:bg-blue-700' : ''
                      }`}
                    >
                      {transaction.type === 'expense' ? 'DES' : 'REC'}
                    </Badge>
                    <span className="flex-1 truncate font-medium">
                      {transaction.title || 'Sem título'}
                    </span>
                    <span className="text-muted-foreground">
                      {transaction.dueDate ? format(parse(transaction.dueDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yy') : '-'}
                    </span>
                    <span className={cn(
                      "font-semibold",
                      transaction.type === 'expense' ? 'text-destructive' : 'text-blue-600'
                    )}>
                      R$ {transaction.amount || '0,00'}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Form - Editing first transaction as template */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {transactionCount > 1 && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
              <Copy className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Editando lançamento de referência. As alterações serão aplicadas a todos os {transactionCount} lançamentos.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Tipo
                    {getFieldStatus("type") === "filled" && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger
                        data-testid="select-transaction-type"
                        className={cn(
                          getFieldStatus("type") === "filled" &&
                            "border-green-500 bg-green-500/5"
                        )}
                      >
                        <SelectValue placeholder="Selecione o tipo" />
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

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Valor
                    {getFieldStatus("amount") === "filled" && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                    {getFieldStatus("amount") === "missing" && (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      data-testid="input-amount"
                      placeholder="0,00"
                      className={cn(
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

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Título
                  {getFieldStatus("title") === "filled" && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                  {getFieldStatus("title") === "missing" && (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    data-testid="input-title"
                    placeholder="Ex: Pagamento de fornecedor"
                    className={cn(
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

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Descrição
                  {getFieldStatus("description") === "filled" && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    data-testid="input-description"
                    placeholder="Detalhes adicionais..."
                    className={cn(
                      getFieldStatus("description") === "filled" &&
                        "border-green-500 bg-green-500/5"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Person Name */}
            <FormField
              control={form.control}
              name="personName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Cliente/Fornecedor
                    {getFieldStatus("personName") === "filled" && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                    {getFieldStatus("personName") === "missing" && (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      data-testid="input-person-name"
                      placeholder="Nome da pessoa"
                      className={cn(
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

            {/* Due Date - Only show first transaction date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    {transactionCount > 1 ? 'Data Inicial' : 'Data de Vencimento'}
                    {getFieldStatus("dueDate") === "filled" && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                    {getFieldStatus("dueDate") === "missing" && (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          data-testid="button-due-date"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                            getFieldStatus("dueDate") === "filled" &&
                              "border-green-500 bg-green-500/5",
                            getFieldStatus("dueDate") === "missing" &&
                              "border-yellow-500 bg-yellow-500/5"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(
                                parse(field.value, "yyyy-MM-dd", new Date()),
                                "dd/MM/yyyy",
                                { locale: ptBR }
                              )
                            : "Selecione a data"}
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

          {/* Count input (when needsCountInput is true) */}
          {command.needsCountInput && (
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Quantidade de Lançamentos
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      max="50"
                      data-testid="input-count"
                      placeholder="Ex: 12 (máximo 50)"
                      className="border-yellow-500 bg-yellow-500/5"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Especifique quantos lançamentos devem ser criados (limite: 50)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              type="submit"
              disabled={isSubmitting}
              data-testid="button-submit"
            >
              {isSubmitting ? "Processando..." : "Continuar para Preview"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
