import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Edit2,
  X,
  Trash2,
  Info,
  Users,
  Receipt,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Briefcase,
  Globe,
  Loader2,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Company, InsertCompany } from "@shared/schema";
import { insertCompanySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCompanyCode } from "@/lib/formatters";
import { TeamTab } from "@/components/TeamTab";
import CobrancaTab from "@/components/CobrancaTab";
import { CompanyDashboard } from "@/components/CompanyDashboard";

// Simple formatters for display and input masks
function formatCNPJ(value?: string) {
  const v = (value || '').replace(/\D/g, '').slice(0, 14);
  return v
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhoneBR(value?: string) {
  const d = (value || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

interface CompanyDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
}

const updateCompanySchema = insertCompanySchema.omit({
  tenantId: true,
  code: true,
});

export function CompanyDetailSheet({
  open,
  onOpenChange,
  company,
}: CompanyDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const { toast } = useToast();

  // Form setup
  const form = useForm<InsertCompany>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      tradeName: "",
      legalName: "",
      cnpj: "",
      phone: "",
      status: "Ativa",
    },
  });

  // Handle edit mode
  const handleEdit = () => {
    if (!company) return;

    form.reset({
      tradeName: company.tradeName,
      legalName: company.legalName,
      cnpj: company.cnpj,
      ie: company.ie || "",
      im: company.im || "",
      phone: company.phone,
      email: company.email || "",
      website: company.website || "",
      cep: company.cep || "",
      logradouro: company.logradouro || "",
      numero: company.numero || "",
      complemento: company.complemento || "",
      bairro: company.bairro || "",
      cidade: company.cidade || "",
      uf: company.uf || "",
      cnaePrincipal: company.cnaePrincipal || "",
      dataAbertura: company.dataAbertura || "",
      porte: company.porte || "",
      status: company.status,
      isActive: company.isActive,
    });

    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.reset();
  };

  const handleSaveEdit = async () => {
    if (!company) return;

    try {
      setIsSaving(true);
      const formData = form.getValues();

      await apiRequest("PATCH", `/api/companies/${company.id}`, {
        ...formData,
        version: company.version,
      });

      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso",
      });

      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", company.id] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar empresa",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!company) return;

    try {
      setIsDeleting(true);
      await apiRequest("DELETE", `/api/companies/${company.id}`);

      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso",
      });

      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir empresa",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!company) return null;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Ativa":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "Inativa":
        return "bg-gray-500 hover:bg-gray-600 text-white";
      case "Pendente":
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
      default:
        return "";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={true}>
      <SheetContent className={`w-full ${isEditing ? 'sm:max-w-6xl' : 'sm:max-w-4xl'} overflow-y-auto`}>
        <Form {...form}>
          <SheetHeader>
            <SheetTitle className="text-xl">
              {isEditing ? "Editando Empresa" : "Detalhes da Empresa"}
            </SheetTitle>
          </SheetHeader>

          <div className={`mt-3 ${isEditing ? 'space-y-1.5' : 'space-y-2'}`}>
            {/* Top Section: Info Card + Main Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Info Card - Company Dashboard */}
              <Card className="border-0 bg-gradient-to-br from-card to-muted/30 shadow-md">
                <CardContent className={isEditing ? "p-3 space-y-1.5" : "p-4 space-y-2"}>
                  {/* Company Avatar e Nome */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="" alt={company.tradeName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {company.tradeName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-1">
                          <FormField
                            control={form.control}
                            name="tradeName"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Nome Fantasia"
                                    className="h-7 text-base font-bold"
                                    data-testid="input-tradeName"
                                  />
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
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Razão Social"
                                    className="h-7 text-xs"
                                    data-testid="input-legalName"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="font-bold text-lg truncate">{company.tradeName}</h3>
                          <p className="text-xs text-muted-foreground truncate">{company.legalName}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Código */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatCompanyCode(company.code)}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`text-[10px] ${getStatusBadgeClass(company.status as string)}`}>
                        {company.status}
                      </Badge>
                      {company.porte && (
                        <Badge variant="outline" className="text-[10px]">
                          {company.porte}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Info + Chart */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Quick Info */}
                    <div className="space-y-2">
                      {company.cnpj && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">CNPJ</p>
                          <p className="text-xs font-medium font-mono">{formatCNPJ(company.cnpj)}</p>
                        </div>
                      )}
                      {company.phone && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Telefone</p>
                          <p className="text-xs font-medium">{formatPhoneBR(company.phone)}</p>
                        </div>
                      )}
                      {company.email && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p>
                          <p className="text-xs font-medium truncate">{company.email}</p>
                        </div>
                      )}
                    </div>

                    {/* Financial Chart - Participação da Empresa no Grupo */}
                    {!isEditing && (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="w-32 h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: company.tradeName, value: 65, isCurrentCompany: true, fill: 'hsl(var(--chart-1))' },
                                  { name: 'Outras Empresas', value: 35, isCurrentCompany: false, fill: 'hsl(var(--chart-2))' },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {[
                                  { name: company.tradeName, value: 65, isCurrentCompany: true, fill: 'hsl(var(--chart-1))' },
                                  { name: 'Outras Empresas', value: 35, isCurrentCompany: false, fill: 'hsl(var(--chart-2))' },
                                ].map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.fill} 
                                    fillOpacity={entry.isCurrentCompany ? 1 : 0.3}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                                        <div className="grid gap-2">
                                          <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-muted-foreground">{payload[0].name}</span>
                                            <span className="text-xs font-bold">{payload[0].value}%</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-[9px] text-muted-foreground text-center">Participação no Grupo</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Main Fields (Vertical) */}
              <div className={isEditing ? "space-y-1.5" : "space-y-2"}>
                {/* Status */}
                <div>
                  {!isEditing ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                      <div className="border rounded-md px-3 py-2 bg-muted/20">
                        <Badge className={getStatusBadgeClass(company.status as string)}>
                          {company.status}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status" className="h-8">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Ativa">Ativa</SelectItem>
                              <SelectItem value="Inativa">Inativa</SelectItem>
                              <SelectItem value="Pendente">Pendente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* CNPJ */}
                <div>
                  {!isEditing ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">CNPJ</p>
                      <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium font-mono">
                        {formatCNPJ(company.cnpj)}
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">CNPJ</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="00.000.000/0000-00"
                              className="h-8"
                              data-testid="input-cnpj"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Telefone */}
                <div>
                  {!isEditing ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Telefone</p>
                      <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium">
                        {formatPhoneBR(company.phone)}
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Telefone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="(00) 00000-0000"
                              className="h-8"
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Email */}
                <div>
                  {!isEditing ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Email</p>
                      <div className="border rounded-md px-3 py-2 bg-muted/20 text-sm font-medium">
                        {company.email || "-"}
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              type="email"
                              placeholder="contato@empresa.com"
                              className="h-8"
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Grid de 4 colunas quando editando: IE, IM, Data Abertura, Porte */}
            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">
                {/* IE */}
                <FormField
                  control={form.control}
                  name="ie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">IE</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="IE"
                          className="h-8"
                          data-testid="input-ie"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* IM */}
                <FormField
                  control={form.control}
                  name="im"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">IM</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="IM"
                          className="h-8"
                          data-testid="input-im"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data de Abertura */}
                <FormField
                  control={form.control}
                  name="dataAbertura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Data Abertura</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="DD/MM/AAAA"
                          className="h-8"
                          data-testid="input-dataAbertura"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Porte */}
                <FormField
                  control={form.control}
                  name="porte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Porte</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-porte" className="h-8">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MEI">MEI</SelectItem>
                          <SelectItem value="ME">ME</SelectItem>
                          <SelectItem value="EPP">EPP</SelectItem>
                          <SelectItem value="Médio">Médio</SelectItem>
                          <SelectItem value="Grande">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Tabs */}
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

              <TabsContent value="info" className={`${isEditing ? 'p-3 space-y-2' : 'p-4 space-y-4'} mt-0`}>
                {/* Grid quando editando */}
                {isEditing ? (
                  <div className="space-y-2">
                    {/* Website e CNAE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Website</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="www.empresa.com"
                                className="h-8"
                                data-testid="input-website"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cnaePrincipal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">CNAE Principal</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="0000-0/00"
                                className="h-8"
                                data-testid="input-cnae"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Endereço - Grid 4 colunas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">
                      <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">CEP</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="00000-000"
                                className="h-8"
                                data-testid="input-cep"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="logradouro"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-xs">Logradouro</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="Rua, Avenida..."
                                className="h-8"
                                data-testid="input-logradouro"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="numero"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Número</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="123"
                                className="h-8"
                                data-testid="input-numero"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">
                      <FormField
                        control={form.control}
                        name="complemento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Complemento</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="Apto, Sala..."
                                className="h-8"
                                data-testid="input-complemento"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bairro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Bairro</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="Bairro"
                                className="h-8"
                                data-testid="input-bairro"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Cidade</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="Cidade"
                                className="h-8"
                                data-testid="input-cidade"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="uf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">UF</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="SP"
                                maxLength={2}
                                className="h-8"
                                data-testid="input-uf"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Grid 3 Colunas: Inscrição Estadual, Municipal, Website */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Inscrição Estadual */}
                      {company.ie && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <h3 className="font-semibold text-xs text-primary">Inscrição Estadual</h3>
                          </div>
                          <div className="pl-5">
                            <p className="text-xs font-medium">{company.ie}</p>
                          </div>
                        </div>
                      )}

                      {/* Inscrição Municipal */}
                      {company.im && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <h3 className="font-semibold text-xs text-primary">Inscrição Municipal</h3>
                          </div>
                          <div className="pl-5">
                            <p className="text-xs font-medium">{company.im}</p>
                          </div>
                        </div>
                      )}

                      {/* Website */}
                      {company.website && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-primary" />
                            <h3 className="font-semibold text-xs text-primary">Website</h3>
                          </div>
                          <div className="pl-5">
                            <a
                              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-primary hover:underline break-all"
                            >
                              {company.website}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Data de Abertura (linha separada se existir) */}
                    {company.dataAbertura && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <h3 className="font-semibold text-xs text-primary">Data de Abertura</h3>
                        </div>
                        <div className="pl-5">
                          <p className="text-xs font-medium">{company.dataAbertura}</p>
                        </div>
                      </div>
                    )}

                    {/* Atividade Econômica */}
                    {company.cnaePrincipal && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-primary" />
                          <h3 className="font-semibold text-xs text-primary">Atividade Econômica</h3>
                        </div>
                        <div className="pl-5">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">CNAE Principal</p>
                          <p className="text-xs font-medium">{company.cnaePrincipal}</p>
                        </div>
                      </div>
                    )}

                    {/* Endereço */}
                    {company.logradouro && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <h3 className="font-semibold text-xs text-primary">Endereço</h3>
                        </div>
                        <div className="pl-5">
                          <p className="text-xs font-medium">
                            {company.logradouro}, {company.numero}
                            {company.complemento && ` - ${company.complemento}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {company.bairro} - {company.cidade}/{company.uf}
                          </p>
                          {company.cep && (
                            <p className="text-xs text-muted-foreground">CEP: {company.cep}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="team" className="p-0 mt-0">
                <TeamTab companyId={company.id} companyName={company.tradeName} />
              </TabsContent>

              <TabsContent value="billing" className="p-0 mt-0">
                <CobrancaTab companyId={company.id} />
              </TabsContent>
            </Tabs>

            {/* Company Dashboard - Collapsible */}
            {!isEditing && (
              <div className="py-4 border-t">
                <Collapsible
                  open={isDashboardOpen}
                  onOpenChange={setIsDashboardOpen}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full rounded-lg justify-between hover-elevate"
                      data-testid="button-toggle-dashboard"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="font-medium">Painel Executivo</span>
                      </div>
                      {isDashboardOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <CompanyDashboard companyId={company.id} />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        </Form>

        {/* Action Buttons Footer - Apple Style */}
        <SheetFooter className={isEditing ? "pt-3 mt-3" : "pt-6 mt-6 border-t"}>
          {!isEditing ? (
            <div className="flex flex-wrap gap-3 w-full">
              <Button
                variant="default"
                onClick={handleEdit}
                className="rounded-xl px-6 py-3 h-auto font-semibold text-base flex-1 min-w-[140px]"
                data-testid="button-edit-company"
              >
                <Edit2 className="h-5 w-5 mr-2" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="rounded-xl px-6 py-3 h-auto font-semibold text-base flex-1 min-w-[140px]"
                    data-testid="button-delete-company"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. A empresa "{company.tradeName}" será permanentemente excluída.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl px-5 py-2.5" data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="rounded-xl px-5 py-2.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid="button-confirm-delete"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        "Excluir"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="rounded-xl px-6 py-3 h-auto font-semibold text-base flex-1"
                data-testid="button-cancel-edit"
              >
                <X className="h-5 w-5 mr-2" />
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="rounded-xl px-6 py-3 h-auto font-semibold text-base flex-1"
                data-testid="button-save-edit"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Edit2 className="h-5 w-5 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
