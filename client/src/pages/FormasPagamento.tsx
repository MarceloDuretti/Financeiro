import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PaymentMethod } from "@shared/schema";
import {
  Banknote,
  Zap,
  CreditCard,
  FileText,
  Receipt,
  ArrowRightLeft,
  Coins,
  Smartphone,
  RefreshCw,
  Store,
  Check,
  Plus,
  Loader2,
} from "lucide-react";

// Map icon names to Lucide components
const iconMap: Record<string, any> = {
  Banknote,
  Zap,
  CreditCard,
  FileText,
  Receipt,
  ArrowRightLeft,
  Coins,
  Smartphone,
  RefreshCw,
  Store,
};

// Color schemes for different payment methods
const getColorScheme = (code: number) => {
  const schemes = [
    "text-green-600 bg-green-50", // Dinheiro
    "text-purple-600 bg-purple-50", // Pix
    "text-blue-600 bg-blue-50", // Cartão de Crédito
    "text-indigo-600 bg-indigo-50", // Cartão de Débito
    "text-amber-600 bg-amber-50", // Cheque
    "text-orange-600 bg-orange-50", // Boleto
    "text-teal-600 bg-teal-50", // TED
    "text-cyan-600 bg-cyan-50", // DOC
    "text-violet-600 bg-violet-50", // DREX
    "text-pink-600 bg-pink-50", // Carteira Digital
    "text-emerald-600 bg-emerald-50", // Débito Automático
    "text-rose-600 bg-rose-50", // Crédito em Loja
  ];
  return schemes[(code - 1) % schemes.length];
};

export default function FormasPagamento() {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Fetch payment methods with real-time updates
  const { data: methods, isLoading } = useRealtimeQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
    resource: "payment-methods",
  });

  const handleToggle = async (method: PaymentMethod) => {
    setLoadingId(method.id);
    try {
      const response = await apiRequest("PATCH", `/api/payment-methods/${method.id}/toggle`, {
        isActive: !method.isActive,
      });
      const updatedMethod = await response.json() as PaymentMethod;

      // Update cache with server response (optimistic)
      queryClient.setQueryData<PaymentMethod[]>(["/api/payment-methods"], (old) => {
        if (!old) return old;
        return old.map((m) => (m.id === updatedMethod.id ? updatedMethod : m));
      });

      toast({
        title: updatedMethod.isActive ? "Forma ativada" : "Forma desativada",
        description: `${updatedMethod.name} foi ${updatedMethod.isActive ? "ativado" : "desativado"} com sucesso.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível atualizar a forma de pagamento",
      });
      // Invalidate on error to refetch correct state
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    } finally {
      setLoadingId(null);
    }
  };

  const renderIcon = (iconName: string, isActive: boolean, colorScheme: string) => {
    const IconComponent = iconMap[iconName] || Coins;
    const baseColorClass = colorScheme.split(" ")[0]; // Extract text-color class
    
    return (
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
          isActive ? colorScheme : "bg-muted text-muted-foreground"
        }`}
      >
        <IconComponent className="h-7 w-7" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Formas de Pagamento</h1>
          <p className="text-muted-foreground">
            Selecione os meios de pagamento que você utiliza para receber e pagar suas contas
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const activeMethods = methods?.filter((m) => m.isActive) || [];
  const inactiveMethods = methods?.filter((m) => !m.isActive) || [];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Formas de Pagamento</h1>
        <p className="text-muted-foreground">
          Selecione os meios de pagamento que você utiliza para receber e pagar suas contas.
          Apenas as formas ativas estarão disponíveis no lançamento de movimentações financeiras.
        </p>
        {activeMethods.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="default" className="gap-1">
              <Check className="h-3 w-3" />
              {activeMethods.length} {activeMethods.length === 1 ? "forma ativa" : "formas ativas"}
            </Badge>
          </div>
        )}
      </div>

      {/* Grid of Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {methods?.map((method) => {
          const colorScheme = getColorScheme(method.code);
          const isToggling = loadingId === method.id;

          return (
            <Card
              key={method.id}
              className={`h-full transition-all hover-elevate ${
                method.isActive ? "ring-2 ring-primary/20 bg-accent/30" : ""
              }`}
              data-testid={`card-payment-method-${method.id}`}
            >
              <CardContent className="p-5 h-full">
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="flex flex-col gap-4">
                    {/* Icon and Status */}
                    <div className="flex items-start justify-between">
                      {renderIcon(method.icon, method.isActive, colorScheme)}
                      {method.isActive && (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          Ativo
                        </Badge>
                      )}
                    </div>

                    {/* Name and Description */}
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base" data-testid={`text-method-name-${method.id}`}>
                        {method.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {method.description}
                      </p>
                    </div>
                  </div>

                  {/* Action Button - Always aligned at bottom */}
                  <Button
                    variant={method.isActive ? "destructive" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => handleToggle(method)}
                    disabled={isToggling}
                    data-testid={`button-toggle-${method.id}`}
                  >
                    {isToggling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {method.isActive ? "Desativando..." : "Ativando..."}
                      </>
                    ) : (
                      <>
                        {method.isActive ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {(!methods || methods.length === 0) && (
        <Card className="p-8">
          <div className="text-center space-y-2">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-medium">Nenhuma forma de pagamento encontrada</h3>
            <p className="text-sm text-muted-foreground">
              As formas de pagamento padrão serão carregadas automaticamente
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
