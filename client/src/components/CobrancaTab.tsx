import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BankBillingConfig, InsertBankBillingConfig, BankAccount } from "@shared/schema";
import { insertBankBillingConfigSchema, SUPPORTED_BANKS } from "@shared/schema";
import {
  Building2,
  Check,
  Plus,
  Loader2,
  Settings,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "@/components/ui/switch";

interface CobrancaTabProps {
  companyId: string;
}

export default function CobrancaTab({ companyId }: CobrancaTabProps) {
  const { toast } = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBankCode, setSelectedBankCode] = useState<string | null>(null);
  const [loadingBank, setLoadingBank] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch bank billing configs with real-time updates
  const { data: configs, isLoading } = useRealtimeQuery<BankBillingConfig[]>({
    queryKey: [`/api/bank-billing-configs?companyId=${companyId}`],
    resource: "bank-billing-configs",
  });

  // Fetch bank accounts to check which banks have accounts registered
  const { data: bankAccounts = [] } = useRealtimeQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
    resource: "bank-accounts",
  });

  // Filter bank accounts for this company and get their bank codes
  const companyBankCodes = bankAccounts
    .filter((account) => account.companyId === companyId && !account.deleted)
    .map((account) => account.bankCode);

  // Check if a bank has an account registered
  const hasBankAccount = (bankCode: string) => {
    return companyBankCodes.includes(bankCode);
  };

  // Find the selected bank
  const selectedBank = SUPPORTED_BANKS.find((b) => b.code === selectedBankCode);
  const existingConfig = configs?.find((c) => c.bankCode === selectedBankCode);

  // Form setup
  const form = useForm<InsertBankBillingConfig>({
    resolver: zodResolver(insertBankBillingConfigSchema),
    defaultValues: {
      companyId: companyId,
      bankCode: selectedBankCode || "",
      bankName: selectedBank?.name || "",
      agency: "",
      agencyDigit: "",
      account: "",
      accountDigit: "",
      covenant: "",
      wallet: "",
      walletVariation: "",
      ourNumberStart: "",
      environment: "sandbox" as "sandbox" | "production",
      isActive: false,
      notes: "",
    },
  });

  const handleConfigure = (bankCode: string) => {
    const bank = SUPPORTED_BANKS.find((b) => b.code === bankCode);
    const config = configs?.find((c) => c.bankCode === bankCode);

    setSelectedBankCode(bankCode);

    // Reset form with existing config or defaults
    if (config) {
      form.reset({
        companyId: companyId,
        bankCode: config.bankCode,
        bankName: config.bankName,
        agency: config.agency,
        agencyDigit: config.agencyDigit,
        account: config.account,
        accountDigit: config.accountDigit,
        covenant: config.covenant,
        wallet: config.wallet,
        walletVariation: config.walletVariation,
        ourNumberStart: config.ourNumberStart,
        environment: (config.environment === "production" ? "production" : "sandbox") as "sandbox" | "production",
        isActive: config.isActive,
        notes: config.notes,
      });
    } else {
      form.reset({
        companyId: companyId,
        bankCode: bankCode,
        bankName: bank?.name || "",
        agency: "",
        agencyDigit: "",
        account: "",
        accountDigit: "",
        covenant: "",
        wallet: "",
        walletVariation: "",
        ourNumberStart: "",
        environment: "sandbox" as "sandbox" | "production",
        isActive: false,
        notes: "",
      });
    }

    setIsDrawerOpen(true);
  };

  const handleSave = async (data: InsertBankBillingConfig) => {
    setIsSaving(true);
    try {
      const response = await apiRequest("POST", "/api/bank-billing-configs", data);
      const savedConfig = (await response.json()) as BankBillingConfig;

      // Update cache
      queryClient.setQueryData<BankBillingConfig[]>(
        [`/api/bank-billing-configs?companyId=${companyId}`],
        (old) => {
          if (!old) return [savedConfig];
          const exists = old.some((c) => c.bankCode === savedConfig.bankCode);
          if (exists) {
            return old.map((c) => (c.bankCode === savedConfig.bankCode ? savedConfig : c));
          }
          return [...old, savedConfig];
        }
      );

      toast({
        title: "Configuração salva",
        description: "A configuração bancária foi salva com sucesso.",
      });

      setIsDrawerOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível salvar a configuração",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/bank-billing-configs?companyId=${companyId}`] });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (bankCode: string) => {
    setLoadingBank(bankCode);
    try {
      await apiRequest("DELETE", `/api/bank-billing-configs/${bankCode}?companyId=${companyId}`, {});

      // Update cache
      queryClient.setQueryData<BankBillingConfig[]>(
        [`/api/bank-billing-configs?companyId=${companyId}`],
        (old) => {
          if (!old) return old;
          return old.filter((c) => c.bankCode !== bankCode);
        }
      );

      toast({
        title: "Configuração removida",
        description: "A configuração bancária foi excluída com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível remover a configuração",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-billing-configs", { companyId }] });
    } finally {
      setLoadingBank(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Create a lookup map for configured banks
  const configMap = new Map(configs?.map((c) => [c.bankCode, c]) || []);
  const configuredCount = configs?.length || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Configuração de Boleto Bancário</h2>
        <p className="text-muted-foreground">
          Configure os dados de cobrança para emissão de boletos bancários.
          Apenas os bancos configurados estarão disponíveis para geração de boletos.
        </p>
        {configuredCount > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="default" className="gap-1">
              <Check className="h-3 w-3" />
              {configuredCount} {configuredCount === 1 ? "banco configurado" : "bancos configurados"}
            </Badge>
          </div>
        )}
      </div>

      {/* Grid of Banks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUPPORTED_BANKS.map((bank) => {
          const config = configMap.get(bank.code);
          const isConfigured = !!config;
          const isDeleting = loadingBank === bank.code;
          const hasAccount = hasBankAccount(bank.code);

          return (
            <Card
              key={bank.code}
              className={`h-full transition-all hover-elevate ${
                isConfigured ? "bg-accent/70 shadow-lg" : ""
              }`}
              data-testid={`card-bank-${bank.code}`}
            >
              <CardContent className="p-4 h-full">
                <div className="flex flex-col h-full justify-between gap-3">
                  <div className="flex flex-col gap-3">
                    {/* Icon and Status */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          isConfigured
                            ? `${bank.color} animate-pulse`
                            : "bg-muted/50 text-muted-foreground/50"
                        }`}
                      >
                        <Building2
                          className={`h-5 w-5 transition-transform ${
                            isConfigured ? "scale-110" : ""
                          }`}
                        />
                      </div>
                      {isConfigured && (
                        <Badge variant="default" className="gap-1 text-xs px-2 py-0">
                          <Check className="h-3 w-3" />
                          Configurado
                        </Badge>
                      )}
                    </div>

                    {/* Bank Info */}
                    <div className="space-y-0.5">
                      <h3
                        className={`text-sm transition-all ${
                          isConfigured
                            ? "font-bold text-foreground"
                            : "font-semibold opacity-50"
                        }`}
                        data-testid={`text-bank-name-${bank.code}`}
                      >
                        {bank.name}
                      </h3>
                      <p
                        className={`text-xs text-muted-foreground transition-opacity ${
                          isConfigured ? "opacity-100" : "opacity-50"
                        }`}
                      >
                        Código: {bank.code}
                      </p>
                      {isConfigured && config && (
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          {config.covenant && <p>Convênio: {config.covenant}</p>}
                          {config.wallet && <p>Carteira: {config.wallet}</p>}
                          <Badge
                            variant={config.environment === "sandbox" ? "secondary" : "default"}
                            className="text-xs mt-1"
                          >
                            {config.environment === "sandbox" ? "Sandbox" : "Produção"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action - Always aligned at bottom */}
                  {isConfigured ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8"
                        onClick={() => handleConfigure(bank.code)}
                        data-testid={`button-edit-${bank.code}`}
                      >
                        <Settings className="h-3 w-3 mr-1.5" />
                        <span className="text-xs">Editar</span>
                      </Button>
                      <button
                        onClick={() => handleDelete(bank.code)}
                        disabled={isDeleting}
                        className="text-xs text-destructive underline hover:text-destructive/80 transition-colors disabled:opacity-50"
                        data-testid={`button-delete-${bank.code}`}
                      >
                        {isDeleting ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant={hasAccount ? "default" : "outline"}
                      size="sm"
                      className="w-full h-8"
                      onClick={() => handleConfigure(bank.code)}
                      disabled={!hasAccount}
                      data-testid={`button-configure-${bank.code}`}
                    >
                      <Plus className="h-3 w-3 mr-1.5" />
                      <span className="text-xs">{hasAccount ? "Configurar" : "Sem conta"}</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Sobre a Configuração de Boletos
            </h4>
            <p className="text-xs text-muted-foreground">
              Para emitir boletos bancários, você precisa configurar os dados de convênio fornecidos
              pelo seu banco. Cada banco possui campos específicos que devem ser preenchidos corretamente.
              Em caso de dúvidas, consulte seu gerente bancário ou a documentação fornecida pelo banco.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {existingConfig ? "Editar" : "Configurar"} {selectedBank?.name}
            </SheetTitle>
            <SheetDescription>
              Preencha os dados fornecidos pelo banco para emissão de boletos bancários.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6 mt-6">
              {/* Bank Info (readonly) */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bankCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código do Banco</FormLabel>
                      <FormControl>
                        <Input {...field} disabled data-testid="input-bank-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Banco</FormLabel>
                      <FormControl>
                        <Input {...field} disabled data-testid="input-bank-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Agency and Account */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="agency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agência *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0001" data-testid="input-agency" />
                      </FormControl>
                      <FormDescription>Sem dígito verificador</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agencyDigit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dígito da Agência</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="X"
                          maxLength={1}
                          data-testid="input-agency-digit"
                        />
                      </FormControl>
                      <FormDescription>Opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="account"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345" data-testid="input-account" />
                      </FormControl>
                      <FormDescription>Sem dígito verificador</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountDigit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dígito da Conta *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="6"
                          maxLength={2}
                          data-testid="input-account-digit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Boleto-specific fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="covenant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Convênio / Código Cedente</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Ex: 123456"
                          data-testid="input-covenant"
                        />
                      </FormControl>
                      <FormDescription>Fornecido pelo banco</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="wallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carteira</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Ex: 18"
                          data-testid="input-wallet"
                        />
                      </FormControl>
                      <FormDescription>Tipo de cobrança</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="walletVariation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variação da Carteira</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Ex: 019"
                          data-testid="input-wallet-variation"
                        />
                      </FormControl>
                      <FormDescription>Se aplicável</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ourNumberStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nosso Número Inicial</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Ex: 1"
                          data-testid="input-our-number-start"
                        />
                      </FormControl>
                      <FormDescription>Sequencial de boletos</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Environment */}
              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambiente *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-environment">
                          <SelectValue placeholder="Selecione o ambiente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                        <SelectItem value="production">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Use Sandbox para testes antes de ativar em Produção
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Anotações internas sobre esta configuração..."
                        rows={3}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1"
                  data-testid="button-save"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Salvar Configuração
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
