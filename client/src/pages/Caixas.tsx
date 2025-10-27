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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  CreditCard,
  Loader2,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import type { CashRegister } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SELECTED_COMPANY_KEY = "fincontrol_selected_company_id";

const cashRegisterSchema = z.object({
  companyId: z.string().min(1, "Empresa é obrigatória"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
});

type CashRegisterFormData = z.infer<typeof cashRegisterSchema>;

function formatCashRegisterCode(code: number): string {
  return `CX${code.toString().padStart(3, '0')}`;
}

function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return "R$ 0,00";
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

export default function Caixas() {
  const { toast } = useToast();
  const selectedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY);
  const [selectedCashRegister, setSelectedCashRegister] = useState<CashRegister | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const createForm = useForm<CashRegisterFormData>({
    resolver: zodResolver(cashRegisterSchema),
    defaultValues: {
      companyId: selectedCompanyId || "",
      name: "",
    },
  });

  const editForm = useForm<CashRegisterFormData>({
    resolver: zodResolver(cashRegisterSchema),
    defaultValues: {
      companyId: selectedCompanyId || "",
      name: "",
    },
  });

  const { data: cashRegisters = [], isLoading } = useRealtimeQuery<CashRegister[]>({
    queryKey: ['/api/cash-registers'],
    resource: 'cash-registers',
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const res = await fetch(`/api/cash-registers?companyId=${selectedCompanyId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch cash registers: ${res.statusText}`);
      }
      return await res.json();
    },
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
      setIsCreateDialogOpen(false);
      createForm.reset({ companyId: selectedCompanyId || "", name: "" });
    },
    onError: () => {
      toast({
        title: "Erro ao criar caixa",
        description: "Ocorreu um erro ao criar o caixa.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation<CashRegister, Error, { id: string; data: Partial<CashRegisterFormData> }>({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CashRegisterFormData> }) => {
      const response = await apiRequest('PATCH', `/api/cash-registers/${id}?companyId=${selectedCompanyId}`, data);
      return await response.json();
    },
    onSuccess: (updatedCashRegister: CashRegister) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cash-registers'] });
      setSelectedCashRegister(updatedCashRegister);
      setIsEditing(false);
      toast({
        title: "Caixa atualizado",
        description: "O caixa foi atualizado com sucesso.",
      });
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
      setIsDrawerOpen(false);
      setSelectedCashRegister(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir caixa",
        description: "Ocorreu um erro ao excluir o caixa.",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation<CashRegister, Error, string>({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/cash-registers/${id}/toggle-active?companyId=${selectedCompanyId}`);
      return await response.json();
    },
    onSuccess: (updatedCashRegister: CashRegister) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cash-registers'] });
      setSelectedCashRegister(updatedCashRegister);
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

  const handleCardClick = (cashRegister: CashRegister) => {
    setSelectedCashRegister(cashRegister);
    setIsDrawerOpen(true);
    setIsEditing(false);
    editForm.reset({
      companyId: cashRegister.companyId,
      name: cashRegister.name,
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedCashRegister) {
      editForm.reset({
        companyId: selectedCashRegister.companyId,
        name: selectedCashRegister.name,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCashRegister) return;
    
    const isValid = await editForm.trigger();
    if (!isValid) return;

    const data = editForm.getValues();
    setIsSaving(true);
    
    try {
      await updateMutation.mutateAsync({ id: selectedCashRegister.id, data });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (selectedCashRegister) {
      setDeletingId(selectedCashRegister.id);
    }
  };

  const onCreateSubmit = (data: CashRegisterFormData) => {
    createMutation.mutate(data);
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
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-cash-register">
            <Plus className="mr-2 h-4 w-4" />
            Novo Caixa
          </Button>
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
                onClick={() => setIsCreateDialogOpen(true)}
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
                    className={`hover-elevate cursor-pointer ${selectedCashRegister?.id === cashRegister.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleCardClick(cashRegister)}
                    data-testid={`card-cash-register-${cashRegister.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        {/* Header: Code + Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="default" className="shrink-0">
                            {formatCashRegisterCode(cashRegister.code)}
                          </Badge>
                          <Badge 
                            variant={cashRegister.isOpen ? "default" : "secondary"}
                            className="shrink-0"
                          >
                            {cashRegister.isOpen ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Aberto
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Fechado
                              </>
                            )}
                          </Badge>
                        </div>

                        {/* Name */}
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-foreground flex-1 truncate">
                            {cashRegister.name}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>

                        {/* Current Balance */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Saldo Atual</span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(cashRegister.currentBalance)}
                          </span>
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
                    className={`hover-elevate opacity-60 cursor-pointer ${selectedCashRegister?.id === cashRegister.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleCardClick(cashRegister)}
                    data-testid={`card-cash-register-${cashRegister.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        {/* Header: Code + Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="shrink-0">
                            {formatCashRegisterCode(cashRegister.code)}
                          </Badge>
                          <Badge 
                            variant={cashRegister.isOpen ? "default" : "secondary"}
                            className="shrink-0"
                          >
                            {cashRegister.isOpen ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Aberto
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Fechado
                              </>
                            )}
                          </Badge>
                        </div>

                        {/* Name */}
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-foreground flex-1 truncate">
                            {cashRegister.name}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>

                        {/* Current Balance */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Saldo Atual</span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(cashRegister.currentBalance)}
                          </span>
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-cash-register-form">
          <DialogHeader>
            <DialogTitle>Novo Caixa</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo caixa.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
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
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen} modal={false}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedCashRegister && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl">
                    {formatCashRegisterCode(selectedCashRegister.code)}
                  </SheetTitle>
                  <div className="flex gap-2">
                    {!isEditing && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleEdit}
                          data-testid="button-edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleDelete}
                          data-testid="button-delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <SheetDescription>
                  Visualize e edite as informações do caixa
                </SheetDescription>
              </SheetHeader>

              <Form {...editForm}>
                <div className="space-y-6 mt-6">
                  {/* Edit Mode Actions */}
                  {isEditing && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        data-testid="button-cancel-edit"
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        data-testid="button-save-edit"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Salvar
                      </Button>
                    </div>
                  )}

                  {/* Status Badges */}
                  {!isEditing && (
                    <div className="flex gap-2">
                      <Badge variant={selectedCashRegister.isActive ? "default" : "secondary"}>
                        {selectedCashRegister.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant={selectedCashRegister.isOpen ? "default" : "secondary"}>
                        {selectedCashRegister.isOpen ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Aberto
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Fechado
                          </>
                        )}
                      </Badge>
                    </div>
                  )}

                  {/* Cash Register Info */}
                  <div className="space-y-2">
                    {!isEditing ? (
                      <div className="border rounded-md p-3">
                        <span className="text-xs text-muted-foreground">Nome do Caixa</span>
                        <p className="text-sm font-medium mt-0.5" data-testid="text-name">
                          {selectedCashRegister.name}
                        </p>
                      </div>
                    ) : (
                      <FormField
                        control={editForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="form-floating">
                            <FormControl>
                              <Input {...field} placeholder=" " data-testid="input-edit-name" className="peer" />
                            </FormControl>
                            <FormLabel>Nome do Caixa *</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <Separator />

                  {/* Financial Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Informações Financeiras
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="border rounded-md p-3">
                        <span className="text-xs text-muted-foreground">Saldo Atual</span>
                        <p className="text-sm font-semibold mt-0.5" data-testid="text-current-balance">
                          {formatCurrency(selectedCashRegister.currentBalance)}
                        </p>
                      </div>
                      <div className="border rounded-md p-3">
                        <span className="text-xs text-muted-foreground">Saldo de Abertura</span>
                        <p className="text-sm font-medium mt-0.5" data-testid="text-opening-balance">
                          {formatCurrency(selectedCashRegister.openingBalance)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Operation History */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Histórico de Operações
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {selectedCashRegister.lastOpenedAt && (
                        <div className="border rounded-md p-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Última Abertura
                          </span>
                          <p className="text-sm font-medium mt-0.5" data-testid="text-last-opened">
                            {format(new Date(selectedCashRegister.lastOpenedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                      {selectedCashRegister.lastClosedAt && (
                        <div className="border rounded-md p-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Último Fechamento
                          </span>
                          <p className="text-sm font-medium mt-0.5" data-testid="text-last-closed">
                            {format(new Date(selectedCashRegister.lastClosedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                      {!selectedCashRegister.lastOpenedAt && !selectedCashRegister.lastClosedAt && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Nenhuma operação registrada ainda
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  {!isEditing && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Ações</h3>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => selectedCashRegister && toggleActiveMutation.mutate(selectedCashRegister.id)}
                        disabled={toggleActiveMutation.isPending}
                        data-testid="button-toggle-active"
                      >
                        <span>{selectedCashRegister.isActive ? "Desativar Caixa" : "Ativar Caixa"}</span>
                        <Badge variant={selectedCashRegister.isActive ? "default" : "secondary"}>
                          {selectedCashRegister.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </Button>
                    </div>
                  )}
                </div>
              </Form>
            </>
          )}
        </SheetContent>
      </Sheet>

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
