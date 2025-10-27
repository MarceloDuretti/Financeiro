import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  CreditCard,
} from "lucide-react";
import type { CashRegister } from "@shared/schema";

const SELECTED_COMPANY_KEY = "fincontrol_selected_company_id";

const cashRegisterSchema = z.object({
  companyId: z.string().min(1, "Empresa é obrigatória"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
});

type CashRegisterFormData = z.infer<typeof cashRegisterSchema>;

function formatCashRegisterCode(code: number): string {
  return `CX${code.toString().padStart(3, '0')}`;
}

export default function Caixas() {
  const { toast } = useToast();
  const selectedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCashRegister, setEditingCashRegister] = useState<CashRegister | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<CashRegisterFormData>({
    resolver: zodResolver(cashRegisterSchema),
    defaultValues: {
      companyId: selectedCompanyId || "",
      name: "",
    },
  });

  const { data: cashRegisters = [], isLoading } = useRealtimeQuery<CashRegister[]>({
    queryKey: ['/api/cash-registers', { companyId: selectedCompanyId }],
    resource: 'cash-registers',
    enabled: !!selectedCompanyId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CashRegisterFormData) => {
      return await apiRequest('POST', '/api/cash-registers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cash-registers'] });
      toast({
        title: "Caixa criado",
        description: "O caixa foi criado com sucesso.",
      });
      setIsDialogOpen(false);
      form.reset({ companyId: selectedCompanyId || "", name: "" });
    },
    onError: () => {
      toast({
        title: "Erro ao criar caixa",
        description: "Ocorreu um erro ao criar o caixa.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CashRegisterFormData }) => {
      return await apiRequest('PATCH', `/api/cash-registers/${id}?companyId=${selectedCompanyId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cash-registers'] });
      toast({
        title: "Caixa atualizado",
        description: "O caixa foi atualizado com sucesso.",
      });
      setIsDialogOpen(false);
      setEditingCashRegister(null);
      form.reset({ companyId: selectedCompanyId || "", name: "" });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar caixa",
        description: "Ocorreu um erro ao atualizar o caixa.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/cash-registers/${id}?companyId=${selectedCompanyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cash-registers'] });
      toast({
        title: "Caixa excluído",
        description: "O caixa foi excluído com sucesso.",
      });
      setDeletingId(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir caixa",
        description: "Ocorreu um erro ao excluir o caixa.",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('PATCH', `/api/cash-registers/${id}/toggle-active?companyId=${selectedCompanyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cash-registers'] });
      toast({
        title: "Status alterado",
        description: "O status do caixa foi alterado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao alterar status",
        description: "Ocorreu um erro ao alterar o status do caixa.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (cashRegister: CashRegister) => {
    setEditingCashRegister(cashRegister);
    form.reset({
      companyId: cashRegister.companyId,
      name: cashRegister.name,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCashRegister(null);
    form.reset({ companyId: selectedCompanyId || "", name: "" });
  };

  const onSubmit = (data: CashRegisterFormData) => {
    if (editingCashRegister) {
      updateMutation.mutate({ id: editingCashRegister.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredCashRegisters = cashRegisters.filter((cashRegister) =>
    cashRegister.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatCashRegisterCode(cashRegister.code).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCashRegisters = filteredCashRegisters.filter(r => r.isActive);
  const inactiveCashRegisters = filteredCashRegisters.filter(r => !r.isActive);

  if (!selectedCompanyId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center gap-4 p-8">
            <CreditCard className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Selecione uma empresa</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Para gerenciar caixas, você precisa selecionar uma empresa primeiro.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Caixas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os pontos de caixa da empresa
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-cash-register">
              <Plus className="mr-2 h-4 w-4" />
              Novo Caixa
            </Button>
            <DialogContent data-testid="dialog-cash-register-form">
              <DialogHeader>
                <DialogTitle>
                  {editingCashRegister ? "Editar Caixa" : "Novo Caixa"}
                </DialogTitle>
                <DialogDescription>
                  {editingCashRegister
                    ? "Atualize as informações do caixa."
                    : "Preencha os dados para criar um novo caixa."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Caixa *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: Caixa Principal, Loja Shopping..."
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-submit"
                    >
                      {editingCashRegister ? "Atualizar" : "Criar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar caixas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Cash Registers Grid */}
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">Carregando caixas...</p>
        </div>
      ) : filteredCashRegisters.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-2">
            <p className="text-muted-foreground">
              {searchTerm
                ? "Nenhum caixa encontrado com os filtros aplicados."
                : "Nenhum caixa cadastrado ainda."}
            </p>
            {!searchTerm && (
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(true)}
                data-testid="button-create-first-cash-register"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro caixa
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Cash Registers */}
          {activeCashRegisters.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Ativos</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeCashRegisters.map((cashRegister) => (
                  <Card
                    key={cashRegister.id}
                    className="hover-elevate"
                    data-testid={`card-cash-register-${cashRegister.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-2">
                        {/* Linha 1: Código + Ações */}
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="default" className="shrink-0">
                            {formatCashRegisterCode(cashRegister.code)}
                          </Badge>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(cashRegister)}
                              data-testid={`button-edit-cash-register-${cashRegister.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingId(cashRegister.id)}
                              data-testid={`button-delete-cash-register-${cashRegister.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Linha 2: Nome */}
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground flex-1">
                            {cashRegister.name}
                          </h3>
                          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>

                        {/* Linha 3: Toggle Status */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActiveMutation.mutate(cashRegister.id)}
                            data-testid={`button-toggle-status-${cashRegister.id}`}
                          >
                            <Badge variant="default">Ativo</Badge>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Cash Registers */}
          {inactiveCashRegisters.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">Inativos</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactiveCashRegisters.map((cashRegister) => (
                  <Card
                    key={cashRegister.id}
                    className="hover-elevate opacity-60"
                    data-testid={`card-cash-register-${cashRegister.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-2">
                        {/* Linha 1: Código + Ações */}
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="shrink-0">
                            {formatCashRegisterCode(cashRegister.code)}
                          </Badge>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(cashRegister)}
                              data-testid={`button-edit-cash-register-${cashRegister.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingId(cashRegister.id)}
                              data-testid={`button-delete-cash-register-${cashRegister.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Linha 2: Nome */}
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground flex-1">
                            {cashRegister.name}
                          </h3>
                          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>

                        {/* Linha 3: Toggle Status */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActiveMutation.mutate(cashRegister.id)}
                            data-testid={`button-toggle-status-${cashRegister.id}`}
                          >
                            <Badge variant="secondary">Inativo</Badge>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este caixa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              data-testid="button-confirm-delete"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
