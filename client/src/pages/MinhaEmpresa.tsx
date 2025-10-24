import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Phone, Mail, MapPin, FileText, Briefcase, Globe, User, X, ChevronRight, Edit2, Plus, Trash2, Info, Users, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertCompanySchema, type Company } from "@shared/schema";
import type { InsertCompany } from "@shared/schema";
import { TeamTab } from "@/components/TeamTab";
import CobrancaTab from "@/components/CobrancaTab";
import { formatCompanyCode } from "@/lib/formatters";

const SELECTED_COMPANY_KEY = "fincontrol_selected_company_id";

// Zod schema para criação de empresa (campos obrigatórios)
const createCompanySchema = insertCompanySchema.omit({ 
  tenantId: true,
  isActive: true,
  code: true,
}).extend({
  tradeName: z.string().min(2, "Nome fantasia deve ter no mínimo 2 caracteres"),
  legalName: z.string().min(2, "Razão social deve ter no mínimo 2 caracteres"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  phone: z.string().min(10, "Telefone inválido"),
});

type CreateCompanyFormData = z.infer<typeof createCompanySchema>;

export default function MinhaEmpresa() {
  const { toast } = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(() => {
    return localStorage.getItem(SELECTED_COMPANY_KEY);
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Company>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: selectedCompany } = useQuery<Company>({
    queryKey: ["/api/companies", selectedCompanyId],
    enabled: !!selectedCompanyId,
  });

  // Form para criação
  const form = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      tradeName: "",
      legalName: "",
      cnpj: "",
      phone: "",
      status: "Ativa",
    },
  });

  // Mutation para criar empresa
  const createMutation = useMutation({
    mutationFn: async (data: CreateCompanyFormData) => {
      return await apiRequest("POST", "/api/companies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a empresa.",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar empresa
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setSelectedCompanyId(null);
      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a empresa.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (selectedCompanyId) {
      localStorage.setItem(SELECTED_COMPANY_KEY, selectedCompanyId);
    } else {
      localStorage.removeItem(SELECTED_COMPANY_KEY);
    }
  }, [selectedCompanyId]);

  const handleCloseDetails = () => {
    setSelectedCompanyId(null);
  };

  const handleStartEdit = () => {
    if (selectedCompany) {
      setEditFormData(selectedCompany);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const handleEditChange = (field: keyof Company, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!selectedCompanyId) return;

    try {
      await apiRequest("PATCH", `/api/companies/${selectedCompanyId}`, editFormData);

      await queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/companies", selectedCompanyId] });

      setIsEditing(false);
      toast({
        title: "Sucesso",
        description: "Dados da empresa atualizados com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados da empresa.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSubmit = (data: CreateCompanyFormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = () => {
    if (selectedCompanyId) {
      deleteMutation.mutate(selectedCompanyId);
    }
  };

  return (
    <div className="h-full overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 h-full p-6">
        {/* Lista de empresas - Esquerda */}
        <div 
          className={`flex-shrink-0 transition-all duration-300 ${
            selectedCompanyId ? 'w-[360px]' : 'w-full'
          }`}
        >
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Empresas do Grupo
                </CardTitle>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-create-company">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Empresa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nova Empresa</DialogTitle>
                      <DialogDescription>
                        Preencha os dados da nova empresa. Campos obrigatórios estão marcados com *.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ativa" data-testid="input-create-status" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tradeName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Fantasia *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Minha Empresa" data-testid="input-create-tradeName" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="legalName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Razão Social *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Minha Empresa LTDA" data-testid="input-create-legalName" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="cnpj"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CNPJ *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="00.000.000/0000-00" data-testid="input-create-cnpj" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="(11) 98888-8888" data-testid="input-create-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="ie"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Inscrição Estadual</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="123.456.789.012" data-testid="input-create-ie" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="im"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Inscrição Municipal</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="123456789" data-testid="input-create-im" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" placeholder="contato@empresa.com" data-testid="input-create-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="www.empresa.com" data-testid="input-create-website" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

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
                            {createMutation.isPending ? "Criando..." : "Criar Empresa"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  Carregando empresas...
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma empresa cadastrada
                </div>
              ) : (
                <div className={`grid gap-4 ${selectedCompanyId ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      data-testid={`row-company-${company.id}`}
                      onClick={() => setSelectedCompanyId(company.id)}
                      className={`group relative rounded-xl border transition-all duration-200 cursor-pointer hover-elevate active-elevate-2 overflow-hidden ${
                        selectedCompanyId === company.id 
                          ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-md' 
                          : 'bg-card border-border hover:border-primary/20 hover:shadow-sm'
                      }`}
                    >
                      {/* Header do Card */}
                      <div className="p-4 pb-3 border-b border-border/50">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-sm">
                              <AvatarImage src="" alt={company.tradeName} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                                {company.tradeName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 
                                className="font-bold text-base text-foreground truncate"
                                data-testid={`text-name-${company.id}`}
                              >
                                {company.tradeName}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                {company.legalName}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-all ${
                            selectedCompanyId === company.id ? 'text-primary rotate-90' : 'group-hover:translate-x-1'
                          }`} />
                        </div>
                      </div>

                      {/* Body do Card - Grid de informações */}
                      {!selectedCompanyId && (
                        <div className="p-4 pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            {/* Código */}
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Código</p>
                              <p 
                                className="text-sm font-semibold font-mono text-foreground"
                                data-testid={`text-code-${company.id}`}
                              >
                                {formatCompanyCode(company.code)}
                              </p>
                            </div>

                            {/* Status */}
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge 
                                variant={company.status === "Ativa" ? "default" : "secondary"}
                                className="text-xs w-fit"
                                data-testid={`text-status-${company.id}`}
                              >
                                {company.status}
                              </Badge>
                            </div>

                            {/* CNPJ */}
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                CNPJ
                              </p>
                              <p 
                                className="text-sm font-medium text-foreground"
                                data-testid={`text-cnpj-${company.id}`}
                              >
                                {company.cnpj}
                              </p>
                            </div>

                            {/* Telefone */}
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                Telefone
                              </p>
                              <p 
                                className="text-sm font-medium text-foreground"
                                data-testid={`text-phone-${company.id}`}
                              >
                                {company.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Indicador de seleção */}
                      {selectedCompanyId === company.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-primary to-primary/50" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Card de detalhes - Direita */}
        {selectedCompanyId && selectedCompany && (
          <div className="flex-1 overflow-auto">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="" alt={selectedCompany.tradeName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {selectedCompany.tradeName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editFormData.tradeName || ''}
                            onChange={(e) => handleEditChange('tradeName', e.target.value)}
                            placeholder="Nome Fantasia"
                            className="h-8 text-lg font-bold"
                            data-testid="input-edit-tradeName"
                          />
                          <Input
                            value={editFormData.legalName || ''}
                            onChange={(e) => handleEditChange('legalName', e.target.value)}
                            placeholder="Razão Social"
                            className="h-8 text-sm"
                            data-testid="input-edit-legalName"
                          />
                        </div>
                      ) : (
                        <>
                          <CardTitle className="text-2xl" data-testid="text-detail-trade-name">
                            {selectedCompany.tradeName}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground" data-testid="text-detail-legal-name">
                            {selectedCompany.legalName}
                          </p>
                        </>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{selectedCompany.status}</Badge>
                        {selectedCompany.porte && (
                          <Badge variant="outline">{selectedCompany.porte}</Badge>
                        )}
                        {selectedCompany.isActive && (
                          <Badge className="bg-green-500">Empresa Ativa</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid="button-delete-company"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A empresa "{selectedCompany.tradeName}" será permanentemente excluída.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDelete}
                                data-testid="button-confirm-delete"
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStartEdit}
                          data-testid="button-edit-company"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCloseDetails}
                          data-testid="button-close-details"
                          className="flex-shrink-0"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                    <TabsTrigger 
                      value="info" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                      data-testid="tab-info"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Informações
                    </TabsTrigger>
                    <TabsTrigger 
                      value="team" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                      data-testid="tab-team"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Equipe
                    </TabsTrigger>
                    <TabsTrigger 
                      value="billing" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                      data-testid="tab-billing"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Cobrança
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="p-6 space-y-6 mt-0">
                    {/* Dados Fiscais */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText className="h-5 w-5" />
                    <h3 className="font-semibold">Dados Fiscais</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                    <div>
                      <p className="text-xs text-muted-foreground">CNPJ</p>
                      {isEditing ? (
                        <Input
                          value={editFormData.cnpj || ''}
                          onChange={(e) => handleEditChange('cnpj', e.target.value)}
                          placeholder="CNPJ"
                          className="h-8"
                          data-testid="input-edit-cnpj"
                        />
                      ) : (
                        <p className="font-medium" data-testid="text-detail-cnpj">{selectedCompany.cnpj}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Inscrição Estadual</p>
                      {isEditing ? (
                        <Input
                          value={editFormData.ie || ''}
                          onChange={(e) => handleEditChange('ie', e.target.value)}
                          placeholder="IE"
                          className="h-8"
                          data-testid="input-edit-ie"
                        />
                      ) : (
                        selectedCompany.ie && <p className="font-medium" data-testid="text-detail-ie">{selectedCompany.ie}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Inscrição Municipal</p>
                      {isEditing ? (
                        <Input
                          value={editFormData.im || ''}
                          onChange={(e) => handleEditChange('im', e.target.value)}
                          placeholder="IM"
                          className="h-8"
                          data-testid="input-edit-im"
                        />
                      ) : (
                        selectedCompany.im && <p className="font-medium" data-testid="text-detail-im">{selectedCompany.im}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Abertura</p>
                      {isEditing ? (
                        <Input
                          value={editFormData.dataAbertura || ''}
                          onChange={(e) => handleEditChange('dataAbertura', e.target.value)}
                          placeholder="DD/MM/AAAA"
                          className="h-8"
                          data-testid="input-edit-dataAbertura"
                        />
                      ) : (
                        selectedCompany.dataAbertura && (
                          <p className="font-medium" data-testid="text-detail-data-abertura">
                            {selectedCompany.dataAbertura}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Atividade Econômica */}
                {selectedCompany.cnaePrincipal && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Briefcase className="h-5 w-5" />
                      <h3 className="font-semibold">Atividade Econômica</h3>
                    </div>
                    <div className="pl-7">
                      <p className="text-xs text-muted-foreground">CNAE Principal</p>
                      <p className="font-medium" data-testid="text-detail-cnae">{selectedCompany.cnaePrincipal}</p>
                    </div>
                  </div>
                )}

                {/* Endereço */}
                {(selectedCompany.logradouro || isEditing) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <MapPin className="h-5 w-5" />
                      <h3 className="font-semibold">Endereço</h3>
                    </div>
                    <div className="pl-7 space-y-3">
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground">Logradouro</p>
                            <Input
                              value={editFormData.logradouro || ''}
                              onChange={(e) => handleEditChange('logradouro', e.target.value)}
                              placeholder="Rua, Avenida..."
                              className="h-8"
                              data-testid="input-edit-logradouro"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Número</p>
                            <Input
                              value={editFormData.numero || ''}
                              onChange={(e) => handleEditChange('numero', e.target.value)}
                              placeholder="Nº"
                              className="h-8"
                              data-testid="input-edit-numero"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Complemento</p>
                            <Input
                              value={editFormData.complemento || ''}
                              onChange={(e) => handleEditChange('complemento', e.target.value)}
                              placeholder="Apto, Sala..."
                              className="h-8"
                              data-testid="input-edit-complemento"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Bairro</p>
                            <Input
                              value={editFormData.bairro || ''}
                              onChange={(e) => handleEditChange('bairro', e.target.value)}
                              placeholder="Bairro"
                              className="h-8"
                              data-testid="input-edit-bairro"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Cidade</p>
                            <Input
                              value={editFormData.cidade || ''}
                              onChange={(e) => handleEditChange('cidade', e.target.value)}
                              placeholder="Cidade"
                              className="h-8"
                              data-testid="input-edit-cidade"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">UF</p>
                            <Input
                              value={editFormData.uf || ''}
                              onChange={(e) => handleEditChange('uf', e.target.value)}
                              placeholder="UF"
                              className="h-8"
                              data-testid="input-edit-uf"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">CEP</p>
                            <Input
                              value={editFormData.cep || ''}
                              onChange={(e) => handleEditChange('cep', e.target.value)}
                              placeholder="CEP"
                              className="h-8"
                              data-testid="input-edit-cep"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium" data-testid="text-detail-address">
                            {selectedCompany.logradouro}
                            {selectedCompany.numero && `, ${selectedCompany.numero}`}
                            {selectedCompany.complemento && ` - ${selectedCompany.complemento}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedCompany.bairro && `${selectedCompany.bairro}, `}
                            {selectedCompany.cidade}/{selectedCompany.uf}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            CEP: {selectedCompany.cep}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Contato */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Phone className="h-5 w-5" />
                    <h3 className="font-semibold">Contato</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Telefone</p>
                      </div>
                      {isEditing ? (
                        <Input
                          value={editFormData.phone || ''}
                          onChange={(e) => handleEditChange('phone', e.target.value)}
                          placeholder="Telefone"
                          className="h-8"
                          data-testid="input-edit-phone"
                        />
                      ) : (
                        <p className="font-medium" data-testid="text-detail-phone">{selectedCompany.phone}</p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Email</p>
                      </div>
                      {isEditing ? (
                        <Input
                          value={editFormData.email || ''}
                          onChange={(e) => handleEditChange('email', e.target.value)}
                          placeholder="Email"
                          className="h-8"
                          data-testid="input-edit-email"
                        />
                      ) : (
                        selectedCompany.email && <p className="font-medium" data-testid="text-detail-email">{selectedCompany.email}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Website</p>
                      </div>
                      {isEditing ? (
                        <Input
                          value={editFormData.website || ''}
                          onChange={(e) => handleEditChange('website', e.target.value)}
                          placeholder="Website"
                          className="h-8"
                          data-testid="input-edit-website"
                        />
                      ) : (
                        selectedCompany.website && (
                          <a 
                            href={selectedCompany.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                            data-testid="link-detail-website"
                          >
                            {selectedCompany.website}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Responsável */}
                {(selectedCompany.responsavelNome || isEditing) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <User className="h-5 w-5" />
                      <h3 className="font-semibold">Responsável</h3>
                    </div>
                    <div className="pl-7 space-y-3">
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Nome</p>
                            <Input
                              value={editFormData.responsavelNome || ''}
                              onChange={(e) => handleEditChange('responsavelNome', e.target.value)}
                              placeholder="Nome do responsável"
                              className="h-8"
                              data-testid="input-edit-responsavelNome"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Cargo</p>
                            <Input
                              value={editFormData.responsavelCargo || ''}
                              onChange={(e) => handleEditChange('responsavelCargo', e.target.value)}
                              placeholder="Cargo"
                              className="h-8"
                              data-testid="input-edit-responsavelCargo"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Telefone</p>
                            <Input
                              value={editFormData.responsavelTelefone || ''}
                              onChange={(e) => handleEditChange('responsavelTelefone', e.target.value)}
                              placeholder="Telefone"
                              className="h-8"
                              data-testid="input-edit-responsavelTelefone"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <Input
                              value={editFormData.responsavelEmail || ''}
                              onChange={(e) => handleEditChange('responsavelEmail', e.target.value)}
                              placeholder="Email"
                              className="h-8"
                              data-testid="input-edit-responsavelEmail"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium" data-testid="text-detail-responsavel-nome">
                            {selectedCompany.responsavelNome || ''}
                            {selectedCompany.responsavelCargo && ` - ${selectedCompany.responsavelCargo}`}
                          </p>
                          {selectedCompany.responsavelTelefone && (
                            <p className="text-sm text-muted-foreground" data-testid="text-detail-responsavel-telefone">
                              Tel: {selectedCompany.responsavelTelefone}
                            </p>
                          )}
                          {selectedCompany.responsavelEmail && (
                            <p className="text-sm text-muted-foreground" data-testid="text-detail-responsavel-email">
                              Email: {selectedCompany.responsavelEmail}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                  </TabsContent>

                  <TabsContent value="team" className="p-6 mt-0">
                    <TeamTab companyId={selectedCompany.id} companyName={selectedCompany.tradeName} />
                  </TabsContent>

                  <TabsContent value="billing" className="p-6 mt-0">
                    <CobrancaTab companyId={selectedCompany.id} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
