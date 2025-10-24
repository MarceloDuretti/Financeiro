import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Building2, 
  CreditCard, 
  Plus, 
  X, 
  Edit2, 
  Trash2, 
  Wallet, 
  Key,
  ChevronRight,
  DollarSign,
  Calendar,
  Info,
  Check,
  Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertBankAccountSchema, insertPixKeySchema, type BankAccount, type PixKey } from "@shared/schema";
import type { InsertBankAccount, InsertPixKey } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SELECTED_ACCOUNT_KEY = "fincontrol_selected_bank_account_id";

// Schema para criar conta bancária
const createBankAccountSchema = insertBankAccountSchema;

// Schema para criar chave PIX
const createPixKeySchema = insertPixKeySchema;

type CreateBankAccountFormData = z.infer<typeof createBankAccountSchema>;
type CreatePixKeyFormData = z.infer<typeof createPixKeySchema>;

export default function ContasBancarias() {
  const { toast } = useToast();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(() => {
    return localStorage.getItem(SELECTED_ACCOUNT_KEY);
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<BankAccount>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatePixDialogOpen, setIsCreatePixDialogOpen] = useState(false);

  const { data: accounts = [], isLoading } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const { data: selectedAccount } = useQuery<BankAccount>({
    queryKey: ["/api/bank-accounts", selectedAccountId],
    enabled: !!selectedAccountId,
  });

  const { data: pixKeys = [] } = useQuery<PixKey[]>({
    queryKey: ["/api/bank-accounts", selectedAccountId, "pix-keys"],
    enabled: !!selectedAccountId,
  });

  // Form para criação de conta bancária
  const form = useForm<CreateBankAccountFormData>({
    resolver: zodResolver(createBankAccountSchema),
    defaultValues: {
      description: "",
      bankName: "",
      accountNumber: "",
      agencyNumber: "",
      holderName: "",
      holderDocument: "",
      initialBalance: "0",
      initialBalanceDate: new Date(),
      accountType: "corrente",
      allowsNegativeBalance: false,
      creditLimit: "0",
      autoSyncEnabled: false,
    },
  });

  // Form para criação de chave PIX
  const pixForm = useForm<CreatePixKeyFormData>({
    resolver: zodResolver(createPixKeySchema),
    defaultValues: {
      keyType: "cpf",
      keyValue: "",
      isDefault: false,
    },
  });

  // Mutation para criar conta bancária
  const createMutation = useMutation({
    mutationFn: async (data: CreateBankAccountFormData) => {
      return await apiRequest("POST", "/api/bank-accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Conta bancária criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a conta bancária.",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar conta bancária
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/bank-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      setSelectedAccountId(null);
      toast({
        title: "Sucesso",
        description: "Conta bancária excluída com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a conta bancária.",
        variant: "destructive",
      });
    },
  });

  // Mutation para criar chave PIX
  const createPixMutation = useMutation({
    mutationFn: async (data: CreatePixKeyFormData) => {
      if (!selectedAccountId) throw new Error("Nenhuma conta selecionada");
      return await apiRequest("POST", `/api/bank-accounts/${selectedAccountId}/pix-keys`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts", selectedAccountId, "pix-keys"] });
      setIsCreatePixDialogOpen(false);
      pixForm.reset();
      toast({
        title: "Sucesso",
        description: "Chave PIX criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a chave PIX.",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar chave PIX
  const deletePixMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/pix-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts", selectedAccountId, "pix-keys"] });
      toast({
        title: "Sucesso",
        description: "Chave PIX excluída com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a chave PIX.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (selectedAccountId) {
      localStorage.setItem(SELECTED_ACCOUNT_KEY, selectedAccountId);
    } else {
      localStorage.removeItem(SELECTED_ACCOUNT_KEY);
    }
  }, [selectedAccountId]);

  const handleCloseDetails = () => {
    setSelectedAccountId(null);
  };

  const handleStartEdit = () => {
    if (selectedAccount) {
      setEditFormData(selectedAccount);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const handleEditChange = (field: keyof BankAccount, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!selectedAccountId) return;

    try {
      await apiRequest("PATCH", `/api/bank-accounts/${selectedAccountId}`, editFormData);

      await queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts", selectedAccountId] });

      setIsEditing(false);
      toast({
        title: "Sucesso",
        description: "Dados da conta atualizados com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados da conta.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSubmit = (data: CreateBankAccountFormData) => {
    createMutation.mutate(data);
  };

  const handleCreatePixSubmit = (data: CreatePixKeyFormData) => {
    createPixMutation.mutate(data);
  };

  const handleDelete = () => {
    if (selectedAccountId) {
      deleteMutation.mutate(selectedAccountId);
    }
  };

  const handleDeletePix = (pixId: string) => {
    deletePixMutation.mutate(pixId);
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const formatPixKey = (type: string) => {
    const labels: Record<string, string> = {
      cpf: "CPF",
      cnpj: "CNPJ",
      email: "E-mail",
      phone: "Telefone",
      random: "Aleatória",
    };
    return labels[type] || type;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Chave PIX copiada para a área de transferência.",
    });
  };

  return (
    <div className="flex h-full gap-4 px-6 py-4">
      {/* Lista de contas - lado esquerdo */}
      <div className={`${selectedAccountId ? 'w-1/3' : 'w-full'} transition-all duration-300 space-y-4`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Contas Bancárias</h1>
            <p className="text-sm text-muted-foreground">Gerencie suas contas e chaves PIX</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              data-testid="button-create-account"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Conta Bancária</DialogTitle>
                <DialogDescription>
                  Cadastre uma nova conta bancária no sistema
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Ex: Conta Corrente Principal" 
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banco</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Ex: Banco do Brasil" 
                              data-testid="input-bank-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Conta</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-account-type">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="corrente">Conta Corrente</SelectItem>
                              <SelectItem value="poupanca">Conta Poupança</SelectItem>
                              <SelectItem value="investimento">Investimento</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="holderDocument"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ do Titular</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Ex: 123.456.789-00" 
                            data-testid="input-holder-document"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="agencyNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agência</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Ex: 1234" 
                              data-testid="input-agency"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número da Conta</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Ex: 12345-6" 
                              data-testid="input-account-number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="initialBalance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Saldo Inicial</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="0.00" 
                              data-testid="input-initial-balance"
                            />
                          </FormControl>
                          <FormDescription>Saldo da conta na data informada</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="initialBalanceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data do Saldo Inicial</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              {...field} 
                              value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                              data-testid="input-initial-balance-date"
                            />
                          </FormControl>
                          <FormDescription>Data base para conciliação</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="allowsNegativeBalance"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-allows-negative"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">
                          Permite saldo negativo
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {form.watch("allowsNegativeBalance") && (
                    <FormField
                      control={form.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limite de Crédito</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              {...field} 
                              value={field.value || "0"}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="0.00" 
                              data-testid="input-credit-limit"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      data-testid="button-cancel-create"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                      data-testid="button-submit-create"
                    >
                      {createMutation.isPending ? "Criando..." : "Criar Conta"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de cards */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando contas...
          </div>
        ) : accounts.length === 0 ? (
          <Card className="p-8">
            <div className="text-center space-y-2">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="font-medium">Nenhuma conta cadastrada</h3>
              <p className="text-sm text-muted-foreground">
                Comece criando sua primeira conta bancária
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <Card 
                key={account.id}
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedAccountId === account.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedAccountId(account.id)}
                data-testid={`card-account-${account.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span className="font-medium" data-testid={`text-description-${account.id}`}>
                          {account.description}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {account.bankName} • {account.accountType === "corrente" ? "C/C" : account.accountType === "poupanca" ? "Poupança" : "Investimento"}
                      </div>
                      <div className="text-lg font-semibold mt-2" data-testid={`text-balance-${account.id}`}>
                        {formatCurrency(account.currentBalance)}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detalhes da conta - lado direito */}
      {selectedAccountId && selectedAccount && (
        <div className="w-2/3 transition-all duration-300">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle data-testid="text-detail-title">{selectedAccount.description}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedAccount.bankName} • Ag: {selectedAccount.agencyNumber || "N/A"} • Conta: {selectedAccount.accountNumber}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleCloseDetails}
                  data-testid="button-close-details"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-auto p-4">
              <Tabs defaultValue="details" className="h-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details" data-testid="tab-details">
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger value="pix" data-testid="tab-pix-keys">
                    Chaves PIX
                  </TabsTrigger>
                </TabsList>

                {/* Tab Detalhes */}
                <TabsContent value="details" className="space-y-3 mt-3">
                  {!isEditing ? (
                    <>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleStartEdit}
                          data-testid="button-start-edit"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid="button-delete-trigger"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta conta bancária? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDelete}
                                data-testid="button-confirm-delete"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Informações Gerais</h3>
                          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                            <div>
                              <span className="text-xs text-muted-foreground">Descrição</span>
                              <p className="text-sm font-medium">{selectedAccount.description}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Banco</span>
                              <p className="text-sm font-medium">{selectedAccount.bankName}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Tipo</span>
                              <Badge variant="secondary" className="mt-1">
                                {selectedAccount.accountType === "corrente" ? "Conta Corrente" : 
                                 selectedAccount.accountType === "poupanca" ? "Poupança" : "Investimento"}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Agência</span>
                              <p className="text-sm font-medium">{selectedAccount.agencyNumber || "N/A"}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Conta</span>
                              <p className="text-sm font-medium">{selectedAccount.accountNumber}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Data Saldo Inicial</span>
                              <p className="text-sm font-medium">
                                {selectedAccount.initialBalanceDate ? format(new Date(selectedAccount.initialBalanceDate), 'dd/MM/yyyy', { locale: ptBR }) : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                          <div>
                            <span className="text-xs text-muted-foreground">Saldo Atual</span>
                            <p className="text-lg font-semibold">{formatCurrency(selectedAccount.currentBalance)}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Saldo Inicial</span>
                            <p className="text-sm font-medium">{formatCurrency(selectedAccount.initialBalance)}</p>
                          </div>
                          {selectedAccount.allowsNegativeBalance && (
                            <div>
                              <span className="text-xs text-muted-foreground">Limite de Crédito</span>
                              <p className="text-sm font-medium">{formatCurrency(selectedAccount.creditLimit || 0)}</p>
                            </div>
                          )}
                        </div>

                        <Separator />

                        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                          <div>
                            <span className="text-xs text-muted-foreground">Permite Saldo Negativo</span>
                            <div className="mt-1">
                              {selectedAccount.allowsNegativeBalance ? (
                                <Badge variant="default">Sim</Badge>
                              ) : (
                                <Badge variant="secondary">Não</Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Status</span>
                            <div className="mt-1">
                              <Badge variant="default">{selectedAccount.status || "Ativa"}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCancelEdit}
                          data-testid="button-cancel-edit"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleSaveEdit}
                          data-testid="button-save-edit"
                        >
                          Salvar
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Descrição</label>
                          <Input
                            value={editFormData.description || ""}
                            onChange={(e) => handleEditChange("description", e.target.value)}
                            data-testid="input-edit-description"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Banco</label>
                            <Input
                              value={editFormData.bankName || ""}
                              onChange={(e) => handleEditChange("bankName", e.target.value)}
                              data-testid="input-edit-bank-name"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Tipo de Conta</label>
                            <Select 
                              value={editFormData.accountType || "corrente"}
                              onValueChange={(value) => handleEditChange("accountType", value)}
                            >
                              <SelectTrigger data-testid="select-edit-account-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="corrente">Conta Corrente</SelectItem>
                                <SelectItem value="poupanca">Poupança</SelectItem>
                                <SelectItem value="investimento">Investimento</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Agência</label>
                            <Input
                              value={editFormData.agencyNumber || ""}
                              onChange={(e) => handleEditChange("agencyNumber", e.target.value)}
                              data-testid="input-edit-agency"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Número da Conta</label>
                            <Input
                              value={editFormData.accountNumber || ""}
                              onChange={(e) => handleEditChange("accountNumber", e.target.value)}
                              data-testid="input-edit-account-number"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Tab Chaves PIX */}
                <TabsContent value="pix" className="space-y-3 mt-3">
                  <div className="flex justify-end">
                    <Dialog open={isCreatePixDialogOpen} onOpenChange={setIsCreatePixDialogOpen}>
                      <Button 
                        size="sm"
                        onClick={() => setIsCreatePixDialogOpen(true)}
                        data-testid="button-create-pix"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Chave PIX
                      </Button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nova Chave PIX</DialogTitle>
                          <DialogDescription>
                            Adicione uma nova chave PIX para esta conta
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...pixForm}>
                          <form onSubmit={pixForm.handleSubmit(handleCreatePixSubmit)} className="space-y-4">
                            <FormField
                              control={pixForm.control}
                              name="keyType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tipo de Chave</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-pix-type">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="cpf">CPF</SelectItem>
                                      <SelectItem value="cnpj">CNPJ</SelectItem>
                                      <SelectItem value="email">E-mail</SelectItem>
                                      <SelectItem value="phone">Telefone</SelectItem>
                                      <SelectItem value="random">Aleatória</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={pixForm.control}
                              name="keyValue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Valor da Chave</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="Digite a chave PIX" 
                                      data-testid="input-pix-value"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={pixForm.control}
                              name="isDefault"
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                  <FormControl>
                                    <Checkbox 
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      data-testid="checkbox-pix-default"
                                    />
                                  </FormControl>
                                  <FormLabel className="cursor-pointer">
                                    Definir como chave padrão
                                  </FormLabel>
                                </FormItem>
                              )}
                            />

                            <DialogFooter>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsCreatePixDialogOpen(false)}
                                data-testid="button-cancel-pix"
                              >
                                Cancelar
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={createPixMutation.isPending}
                                data-testid="button-submit-pix"
                              >
                                {createPixMutation.isPending ? "Criando..." : "Criar Chave"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {pixKeys.length === 0 ? (
                    <Card className="p-8">
                      <div className="text-center space-y-2">
                        <Key className="h-12 w-12 mx-auto text-muted-foreground" />
                        <h3 className="font-medium">Nenhuma chave PIX cadastrada</h3>
                        <p className="text-sm text-muted-foreground">
                          Adicione chaves PIX para facilitar transferências
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {pixKeys.map((pixKey) => (
                        <Card 
                          key={pixKey.id}
                          className="hover-elevate"
                          data-testid={`card-pix-${pixKey.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Key className="h-4 w-4 text-primary" />
                                  <Badge variant="secondary">{formatPixKey(pixKey.keyType)}</Badge>
                                  {pixKey.isDefault && (
                                    <Badge variant="default">
                                      <Check className="h-3 w-3 mr-1" />
                                      Padrão
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm font-medium font-mono">
                                  {pixKey.keyValue}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(pixKey.keyValue)}
                                  data-testid={`button-copy-pix-${pixKey.id}`}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      data-testid={`button-delete-pix-${pixKey.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir esta chave PIX?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeletePix(pixKey.id)}>
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
