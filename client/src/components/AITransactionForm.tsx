import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
});

type FormData = z.infer<typeof formSchema>;

interface TransactionCommand {
  operation: "create" | "clone" | "pay" | "unknown";
  type?: "revenue" | "expense";
  amount?: string;
  title?: string;
  description?: string;
  personName?: string;
  dueDate?: string;
  clonePeriod?: {
    type: "month" | "semester" | "year" | "custom";
    count?: number;
  };
  missingFields: string[];
  suggestions?: {
    personId?: string;
    chartAccountId?: string;
    costCenterId?: string;
    paymentMethodId?: string;
  };
  confidence: number;
}

interface AITransactionFormProps {
  command: TransactionCommand;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AITransactionForm({
  command,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AITransactionFormProps) {
  const [showSuggestions, setShowSuggestions] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: command.type || "expense",
      amount: command.amount || "",
      title: command.title || "",
      description: command.description || "",
      personName: command.personName || "",
      issueDate: command.dueDate || format(new Date(), "yyyy-MM-dd"),
      dueDate: command.dueDate || "",
      personId: command.suggestions?.personId || "",
      chartAccountId: command.suggestions?.chartAccountId || "",
      costCenterId: command.suggestions?.costCenterId || "",
      paymentMethodId: command.suggestions?.paymentMethodId || "",
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
    // Check if this field was filled by the AI in the command
    const aiFilledFields = ['type', 'amount', 'title', 'description', 'personName', 'issueDate', 'dueDate'] as const;
    if (aiFilledFields.includes(field as any)) {
      const commandValue = command[field as keyof typeof command];
      return commandValue !== undefined && commandValue !== "";
    }
    return false;
  };

  const getFieldStatus = (field: keyof FormData): "filled" | "missing" | "suggested" | null => {
    const currentHasValue = hasValue(field);
    
    // If field is missing (required but not filled by AI)
    if (isMissing(field)) {
      return "missing";
    }
    
    // If field has a value
    if (currentHasValue) {
      // Check if it's a suggestion field
      if (command.suggestions && field in command.suggestions) {
        return "suggested";
      }
      // Check if it was filled by AI
      if (wasFilledByAI(field)) {
        return "filled";
      }
    }
    
    // Field is optional and empty, or user-filled (no special status)
    return null;
  };

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      {/* Header with confidence */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Complementar Informações</h3>
          <p className="text-sm text-muted-foreground">
            Preencha os campos faltantes e revise as informações
          </p>
        </div>
        <Badge variant={command.confidence > 0.7 ? "default" : "secondary"}>
          Confiança: {(command.confidence * 100).toFixed(0)}%
        </Badge>
      </div>

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

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Data de Vencimento
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

          {/* Clone Period Info */}
          {command.clonePeriod && (
            <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Clonagem detectada
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                Este lançamento será clonado para:{" "}
                {command.clonePeriod.type === "year" && "o ano todo"}
                {command.clonePeriod.type === "semester" && "o semestre"}
                {command.clonePeriod.type === "month" && "os próximos meses"}
                {command.clonePeriod.count && ` (${command.clonePeriod.count} vezes)`}
              </p>
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
              type="submit"
              disabled={isSubmitting}
              data-testid="button-submit"
            >
              {isSubmitting ? "Processando..." : "Continuar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
