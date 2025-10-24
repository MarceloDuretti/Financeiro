import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BankBillingConfig } from "@shared/schema";
import {
  Building2,
  Check,
  Plus,
  Loader2,
  Settings,
} from "lucide-react";

// Supported banks with their metadata
const SUPPORTED_BANKS = [
  {
    code: "001",
    name: "Banco do Brasil",
    shortName: "BB",
    color: "text-yellow-700 bg-yellow-50",
  },
  {
    code: "104",
    name: "Caixa Econômica Federal",
    shortName: "CEF",
    color: "text-blue-700 bg-blue-50",
  },
  {
    code: "237",
    name: "Bradesco",
    shortName: "Bradesco",
    color: "text-red-700 bg-red-50",
  },
  {
    code: "341",
    name: "Itaú",
    shortName: "Itaú",
    color: "text-orange-700 bg-orange-50",
  },
  {
    code: "033",
    name: "Santander",
    shortName: "Santander",
    color: "text-red-600 bg-red-50",
  },
  {
    code: "756",
    name: "Sicoob",
    shortName: "Sicoob",
    color: "text-green-700 bg-green-50",
  },
];

export default function CobrancaTab() {
  const { toast } = useToast();
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [loadingBank, setLoadingBank] = useState<string | null>(null);

  // Fetch bank billing configs with real-time updates
  const { data: configs, isLoading } = useRealtimeQuery<BankBillingConfig[]>({
    queryKey: ["/api/bank-billing-configs"],
    resource: "bank-billing-configs",
  });

  const handleConfigure = (bankCode: string) => {
    setSelectedBank(bankCode);
    // TODO: Open drawer with configuration form
    toast({
      title: "Em desenvolvimento",
      description: "Configuração de boleto em breve disponível",
    });
  };

  const handleDelete = async (bankCode: string) => {
    setLoadingBank(bankCode);
    try {
      await apiRequest("DELETE", `/api/bank-billing-configs/${bankCode}`, {});

      // Update cache
      queryClient.setQueryData<BankBillingConfig[]>(
        ["/api/bank-billing-configs"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/bank-billing-configs"] });
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
                      variant="outline"
                      size="sm"
                      className="w-full h-8"
                      onClick={() => handleConfigure(bank.code)}
                      data-testid={`button-configure-${bank.code}`}
                    >
                      <Plus className="h-3 w-3 mr-1.5" />
                      <span className="text-xs">Configurar</span>
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
    </div>
  );
}
