import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Phone, Mail, MapPin, FileText, Briefcase, Globe, User, X, ChevronRight, Edit2, Plus, Trash2, Info, Users, Receipt, Search, LayoutGrid, List, Star, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { CompanyDetailSheet } from "@/components/CompanyDetailSheet";

const SELECTED_COMPANY_KEY = "fincontrol_selected_company_id";
// Simple formatters for display and input masks
function formatCNPJ(value?: string) {
  const v = (value || '').replace(/\D/g, '').slice(0,14);
  return v
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}
function maskCNPJInput(v: string) { return formatCNPJ(v); }
function formatPhoneBR(value?: string) {
  const d = (value || '').replace(/\D/g, '').slice(0,11);
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}
function maskPhoneInput(v: string) { return formatPhoneBR(v); }
const FAVORITES_KEY = "fincontrol_company_favorites";

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [companiesViewMode, setCompaniesViewMode] = useState<'cards' | 'list'>(() => {
    const saved = localStorage.getItem('fincontrol_companies_view_mode');
    return saved === 'list' ? 'list' : 'cards';
  });
  const [companySearch, setCompanySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'Ativa' | 'Inativa' | 'Pendente'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'code'>('name');
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: selectedCompany } = useQuery<Company>({
    queryKey: ["/api/companies", selectedCompanyId],
    enabled: !!selectedCompanyId,
  });
  const compactCompaniesList = !!selectedCompanyId;

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

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

  useEffect(() => {
    if (selectedCompanyId) {
      localStorage.setItem(SELECTED_COMPANY_KEY, selectedCompanyId);
    } else {
      localStorage.removeItem(SELECTED_COMPANY_KEY);
    }
  }, [selectedCompanyId]);

  // Persist view preference
  useEffect(() => {
    localStorage.setItem('fincontrol_companies_view_mode', companiesViewMode);
  }, [companiesViewMode]);

  const statusCounts = useMemo(() => {
    const counts = { total: companies.length, Ativa: 0, Inativa: 0, Pendente: 0 } as Record<string, number>;
    companies.forEach(c => {
      const s = (c.status as string) || 'Ativa';
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    let list = companies;
    if (statusFilter !== 'all') {
      list = list.filter(c => (c.status as string) === statusFilter);
    }
    if (companySearch) {
      const q = companySearch.toLowerCase();
      list = list.filter(c =>
        c.tradeName?.toLowerCase().includes(q) ||
        c.legalName?.toLowerCase().includes(q) ||
        c.cnpj?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'code') return String(a.code || '').localeCompare(String(b.code || ''));
      return (a.tradeName || '').localeCompare(b.tradeName || '');
    });
    return list;
  }, [companies, companySearch, statusFilter, sortBy]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: string }) => {
      return await apiRequest("PATCH", `/api/companies/${id}`, { status: nextStatus });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      if (selectedCompanyId) {
        await queryClient.invalidateQueries({ queryKey: ["/api/companies", selectedCompanyId] });
      }
    }
  });

  const handleCreateSubmit = (data: CreateCompanyFormData) => {
    createMutation.mutate(data);
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
                                  <Input {...field} placeholder="00.000.000/0000-00" data-testid="input-create-cnpj" onChange={(e) => field.onChange(maskCNPJInput(e.target.value))} value={maskCNPJInput(field.value || "")} />
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
                                  <Input {...field} placeholder="(11) 98888-8888" data-testid="input-create-phone" onChange={(e) => field.onChange(maskPhoneInput(e.target.value))} value={maskPhoneInput(field.value || "")} />
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
                                  <Input {...field} value={field.value || ""} placeholder="123.456.789.012" data-testid="input-create-ie" />
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
                                  <Input {...field} value={field.value || ""} placeholder="123456789" data-testid="input-create-im" />
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
                                  <Input {...field} value={field.value || ""} type="email" placeholder="contato@empresa.com" data-testid="input-create-email" />
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
                                  <Input {...field} value={field.value || ""} placeholder="www.empresa.com" data-testid="input-create-website" />
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
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>Total: <span className="font-medium text-foreground">{statusCounts.total}</span></span>
                <span>Ativas: <span className="font-medium text-foreground">{statusCounts.Ativa || 0}</span></span>
                <span>Inativas: <span className="font-medium text-foreground">{statusCounts.Inativa || 0}</span></span>
                <span>Pendentes: <span className="font-medium text-foreground">{statusCounts.Pendente || 0}</span></span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4">
              {/* Toolbar: busca e alternância de visualização */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="h-8"
                    data-testid="input-search-company"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="h-8 w-[110px] text-xs" data-testid="select-company-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Inativa">Inativa</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="h-8 w-[120px] text-xs" data-testid="select-company-sort">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="code">Código</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button
                    variant={companiesViewMode === 'cards' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCompaniesViewMode('cards')}
                    data-testid="button-companies-view-cards"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant={companiesViewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCompaniesViewMode('list')}
                    data-testid="button-companies-view-list"
                  >
                    <List className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  Carregando empresas...
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {companies.length === 0 ? 'Nenhuma empresa cadastrada' : 'Nenhuma empresa encontrada'}
                </div>
              ) : (
                <div className={companiesViewMode === 'cards' ? `grid gap-2` : 'space-y-2'} style={companiesViewMode === 'cards' ? { gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' } : undefined}>
                  {filteredCompanies.map((company) => {
                    const getStatusBadgeClass = (status: string) => {
                      if (status === "Ativa") return "bg-green-600 hover:bg-green-700 text-white";
                      if (status === "Inativa") return "bg-gray-500 hover:bg-gray-600 text-white";
                      if (status === "Pendente") return "bg-yellow-600 hover:bg-yellow-700 text-white";
                      return "bg-gray-500 hover:bg-gray-600 text-white";
                    };

                    return companiesViewMode === 'cards' ? (
                      <Card
                        key={company.id}
                        className="hover-elevate cursor-pointer bg-white/75 dark:bg-gray-900/75"
                        onClick={() => setSelectedCompanyId(company.id)}
                        data-testid={`card-company-${company.id}`}
                      >
                        <CardContent className="p-2 space-y-1">
                          {/* Status Badge and Code */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge 
                              className={`text-[10px] h-5 px-1.5 ${getStatusBadgeClass(company.status as string)}`}
                            >
                              {company.status}
                            </Badge>
                            {company.porte && (
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                {company.porte}
                              </Badge>
                            )}
                          </div>

                          {/* Company Code */}
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {formatCompanyCode(company.code)}
                          </div>

                          {/* Company Name */}
                          <div className="text-sm font-medium truncate" data-testid={`text-tradename-${company.id}`}>
                            {company.tradeName}
                          </div>

                          {/* CNPJ */}
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {formatCNPJ(company.cnpj)}
                          </div>

                          {/* Phone */}
                          {company.phone && (
                            <div className="text-[10px] text-muted-foreground">
                              {formatPhoneBR(company.phone)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div
                        key={company.id}
                        className="flex items-center gap-3 px-4 py-3 border border-border/40 rounded-xl hover-elevate cursor-pointer transition-all duration-150"
                        onClick={() => setSelectedCompanyId(company.id)}
                        data-testid={`row-company-${company.id}`}
                      >
                        {/* Status */}
                        <div className="w-[80px] flex-shrink-0">
                          <Badge 
                            className={`text-[11px] h-6 px-2 ${getStatusBadgeClass(company.status as string)}`}
                          >
                            {company.status}
                          </Badge>
                        </div>

                        {/* Code */}
                        <div className="w-24 flex-shrink-0 hidden md:block">
                          <span className="text-xs text-muted-foreground font-mono">{formatCompanyCode(company.code)}</span>
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <span className="truncate font-semibold text-[13px] tracking-tight">{company.tradeName}</span>
                          </div>
                        </div>

                        {/* CNPJ */}
                        <div className="w-44 flex-shrink-0 hidden lg:block">
                          <span className="text-xs text-muted-foreground font-mono">{formatCNPJ(company.cnpj)}</span>
                        </div>

                        {/* Phone */}
                        <div className="w-36 flex-shrink-0 hidden xl:block">
                          {company.phone ? (
                            <span className="text-xs text-muted-foreground">{formatPhoneBR(company.phone)}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">-</span>
                          )}
                        </div>

                        {/* Porte */}
                        <div className="w-20 flex-shrink-0 hidden xl:block">
                          {company.porte && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                              {company.porte}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Company Detail Sheet */}
      <CompanyDetailSheet
        open={!!selectedCompanyId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCompanyId(null);
          }
        }}
        company={selectedCompany || null}
      />
    </div>
  );
}
