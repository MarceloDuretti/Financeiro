import { useState } from "react";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSupplierSchema, type CustomerSupplier, type InsertCustomerSupplier } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, 
  Plus, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  Globe,
  FileText,
  CreditCard,
  Edit,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

type EntityWithStats = CustomerSupplier & {
  revenuePercentage: number | null;
  expensePercentage: number | null;
};

export default function ClientesFornecedores() {
  const { toast } = useToast();
  const [selectedEntity, setSelectedEntity] = useState<EntityWithStats | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntityWithStats | null>(null);

  // Fetch entities with real-time updates
  const { data: entities = [], isLoading } = useRealtimeQuery<EntityWithStats[]>({
    queryKey: ["/api/customers-suppliers"],
    resource: "customers-suppliers",
  });

  // Form setup
  const form = useForm<InsertCustomerSupplier>({
    resolver: zodResolver(insertCustomerSupplierSchema),
    defaultValues: {
      isCustomer: false,
      isSupplier: false,
      name: "",
      documentType: "none",
      document: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      country: "Brasil",
      bankName: "",
      accountAgency: "",
      accountNumber: "",
      pixKey: "",
      pixKeyType: undefined,
      imageUrl: "",
      notes: "",
      isActive: true,
    },
  });

  const handleCardClick = (entity: EntityWithStats) => {
    setSelectedEntity(entity);
    setIsDrawerOpen(true);
  };

  const handleCreateNew = () => {
    setEditingEntity(null);
    form.reset();
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleEdit = () => {
    if (!selectedEntity) return;
    
    setEditingEntity(selectedEntity);
    form.reset({
      isCustomer: selectedEntity.isCustomer,
      isSupplier: selectedEntity.isSupplier,
      name: selectedEntity.name,
      documentType: (selectedEntity.documentType as "cpf" | "cnpj" | "foreign" | "none" | undefined) || "none",
      document: selectedEntity.document || "",
      phone: selectedEntity.phone || "",
      whatsapp: selectedEntity.whatsapp || "",
      email: selectedEntity.email || "",
      website: selectedEntity.website || "",
      zipCode: selectedEntity.zipCode || "",
      street: selectedEntity.street || "",
      number: selectedEntity.number || "",
      complement: selectedEntity.complement || "",
      neighborhood: selectedEntity.neighborhood || "",
      city: selectedEntity.city || "",
      state: selectedEntity.state || "",
      country: selectedEntity.country || "Brasil",
      bankName: selectedEntity.bankName || "",
      accountAgency: selectedEntity.accountAgency || "",
      accountNumber: selectedEntity.accountNumber || "",
      pixKey: selectedEntity.pixKey || "",
      pixKeyType: selectedEntity.pixKeyType || undefined,
      imageUrl: selectedEntity.imageUrl || "",
      notes: selectedEntity.notes || "",
      isActive: selectedEntity.isActive,
    });
    setWizardStep(1);
    setIsDrawerOpen(false);
    setIsWizardOpen(true);
  };

  const handleWizardNext = () => {
    setWizardStep((prev) => Math.min(prev + 1, 5));
  };

  const handleWizardPrev = () => {
    setWizardStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: InsertCustomerSupplier) => {
    try {
      if (editingEntity) {
        // Update existing entity
        await apiRequest("PATCH", `/api/customers-suppliers/${editingEntity.id}`, {
          ...data,
          version: editingEntity.version,
        });

        toast({
          title: "Sucesso!",
          description: "Cliente/Fornecedor atualizado com sucesso",
        });
      } else {
        // Create new entity
        await apiRequest("POST", "/api/customers-suppliers", data);

        toast({
          title: "Sucesso!",
          description: "Cliente/Fornecedor criado com sucesso",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/customers-suppliers"] });

      setIsWizardOpen(false);
      setEditingEntity(null);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || `Não foi possível ${editingEntity ? "atualizar" : "criar"} o registro`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedEntity) return;

    if (!confirm("Tem certeza que deseja excluir este registro?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/customers-suppliers/${selectedEntity.id}`);

      queryClient.invalidateQueries({ queryKey: ["/api/customers-suppliers"] });

      toast({
        title: "Sucesso!",
        description: "Registro excluído com sucesso",
      });

      setIsDrawerOpen(false);
      setSelectedEntity(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o registro",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCode = (code: number) => `CLI${code.toString().padStart(3, "0")}`;
  
  const getTypeLabel = (entity: CustomerSupplier) => {
    if (entity.isCustomer && entity.isSupplier) return "Ambos";
    if (entity.isCustomer) return "Cliente";
    if (entity.isSupplier) return "Fornecedor";
    return "";
  };

  const getTypeBadgeColor = (entity: CustomerSupplier) => {
    if (entity.isCustomer && entity.isSupplier) return "bg-purple-500 text-white";
    if (entity.isCustomer) return "bg-blue-500 text-white";
    if (entity.isSupplier) return "bg-orange-500 text-white";
    return "";
  };

  const getPercentageBadgeColor = (percentage: number | null) => {
    if (!percentage) return "bg-muted text-muted-foreground";
    if (percentage >= 20) return "bg-green-500 text-white";
    if (percentage >= 10) return "bg-yellow-500 text-white";
    return "bg-muted text-muted-foreground";
  };

  const formatWhatsAppLink = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return `https://wa.me/55${cleaned}`;
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold">Clientes e Fornecedores</h1>
            <p className="text-sm text-muted-foreground">
              Gerenciamento completo de clientes e fornecedores
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-muted rounded-lg"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Clientes e Fornecedores</h1>
          <p className="text-sm text-muted-foreground">
            {entities.length} {entities.length === 1 ? "registro" : "registros"}
          </p>
        </div>
        <Button onClick={handleCreateNew} data-testid="button-create-new">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cadastro
        </Button>
      </div>

      {/* Grid of Cards */}
      {entities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum registro encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comece criando seu primeiro cliente ou fornecedor
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Registro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((entity) => {
            const percentage = entity.isCustomer ? entity.revenuePercentage : entity.expensePercentage;
            
            return (
              <div key={entity.id} className="relative">
                {/* Floating Percentage Badge */}
                {percentage !== null && percentage > 0 && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Badge 
                      className={`${getPercentageBadgeColor(percentage)} shadow-lg text-xs px-2 py-0.5`}
                      data-testid={`badge-percentage-${entity.id}`}
                    >
                      {percentage.toFixed(1)}%
                    </Badge>
                  </div>
                )}

                <Card
                  className={`cursor-pointer transition-all hover-elevate active-elevate-2 ${
                    selectedEntity?.id === entity.id ? "ring-2 ring-primary" : ""
                  } ${!entity.isActive ? "opacity-60" : ""}`}
                  onClick={() => handleCardClick(entity)}
                  data-testid={`card-entity-${entity.id}`}
                >
                  <CardContent className="p-4 h-full">
                    <div className="flex flex-col h-full gap-3">
                      {/* Header: Avatar + Code + Type Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={entity.imageUrl || undefined} alt={entity.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(entity.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground" data-testid={`text-code-${entity.id}`}>
                              {formatCode(entity.code)}
                            </span>
                            <Badge className={`${getTypeBadgeColor(entity)} text-xs mt-1`}>
                              {getTypeLabel(entity)}
                            </Badge>
                          </div>
                        </div>
                        {entity.isActive ? (
                          <Badge variant="default" className="text-xs">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inativo</Badge>
                        )}
                      </div>

                      {/* Name and Document */}
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-sm" data-testid={`text-name-${entity.id}`}>
                          {entity.name}
                        </h3>
                        {entity.document && (
                          <p className="text-xs text-muted-foreground">
                            {entity.document}
                          </p>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1.5 text-xs">
                        {entity.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{entity.phone}</span>
                            {entity.whatsapp && (
                              <a
                                href={formatWhatsAppLink(entity.whatsapp)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="ml-auto"
                                data-testid={`link-whatsapp-${entity.id}`}
                              >
                                <SiWhatsapp className="h-4 w-4 text-green-500 hover:text-green-600 transition-colors" />
                              </a>
                            )}
                          </div>
                        )}
                        {entity.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{entity.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Drawer - Implementation continues... */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedEntity && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedEntity.imageUrl || undefined} alt={selectedEntity.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                      {getInitials(selectedEntity.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <SheetTitle className="text-2xl">{selectedEntity.name}</SheetTitle>
                    <SheetDescription>
                      {formatCode(selectedEntity.code)} • {getTypeLabel(selectedEntity)}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status and Type */}
                <div className="flex gap-2">
                  <Badge className={getTypeBadgeColor(selectedEntity)}>
                    {getTypeLabel(selectedEntity)}
                  </Badge>
                  <Badge variant={selectedEntity.isActive ? "default" : "secondary"}>
                    {selectedEntity.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                {/* Identification */}
                {selectedEntity.document && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Identificação</h4>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {selectedEntity.documentType?.toUpperCase() || "Documento"}
                          </div>
                          <div className="font-mono">{selectedEntity.document}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Contato</h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    {selectedEntity.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground">Telefone</div>
                          <div>{selectedEntity.phone}</div>
                        </div>
                        {selectedEntity.whatsapp && (
                          <a
                            href={formatWhatsAppLink(selectedEntity.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="link-whatsapp-detail"
                          >
                            <Button size="sm" variant="outline">
                              <SiWhatsapp className="h-4 w-4 mr-2 text-green-500" />
                              WhatsApp
                            </Button>
                          </a>
                        )}
                      </div>
                    )}
                    {selectedEntity.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Email</div>
                          <div>{selectedEntity.email}</div>
                        </div>
                      </div>
                    )}
                    {selectedEntity.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Website</div>
                          <a
                            href={selectedEntity.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {selectedEntity.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                {(selectedEntity.street || selectedEntity.city) && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Endereço</h4>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          {selectedEntity.street && (
                            <div>
                              {selectedEntity.street}
                              {selectedEntity.number && `, ${selectedEntity.number}`}
                            </div>
                          )}
                          {selectedEntity.complement && (
                            <div className="text-sm text-muted-foreground">{selectedEntity.complement}</div>
                          )}
                          {selectedEntity.neighborhood && <div className="text-sm">{selectedEntity.neighborhood}</div>}
                          <div>
                            {selectedEntity.city}
                            {selectedEntity.state && ` - ${selectedEntity.state}`}
                          </div>
                          {selectedEntity.zipCode && (
                            <div className="text-sm text-muted-foreground">CEP: {selectedEntity.zipCode}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Banking Info */}
                {(selectedEntity.bankName || selectedEntity.pixKey) && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Dados Bancários</h4>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      {selectedEntity.bankName && (
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">Banco</div>
                            <div>{selectedEntity.bankName}</div>
                            {selectedEntity.accountAgency && selectedEntity.accountNumber && (
                              <div className="text-sm text-muted-foreground">
                                Ag: {selectedEntity.accountAgency} • Conta: {selectedEntity.accountNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedEntity.pixKey && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Chave PIX ({selectedEntity.pixKeyType?.toUpperCase()})
                          </div>
                          <div className="font-mono text-sm">{selectedEntity.pixKey}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedEntity.notes && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Observações</h4>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{selectedEntity.notes}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={handleEdit} data-testid="button-edit">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    data-testid="button-delete"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Wizard Dialog - Part 2 continues in next message due to size... */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEntity ? "Editar Cliente/Fornecedor" : "Novo Cliente/Fornecedor"}</DialogTitle>
            <DialogDescription>
              Etapa {wizardStep} de 5 - Preencha as informações
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step Indicator */}
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        step === wizardStep
                          ? "bg-primary text-primary-foreground"
                          : step < wizardStep
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step < wizardStep ? <Check className="h-4 w-4" /> : step}
                    </div>
                    {step < 5 && <div className="w-8 md:w-16 h-0.5 bg-muted" />}
                  </div>
                ))}
              </div>

              {/* Step 1: Type and Identification */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Tipo e Identificação</h3>
                  
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="isCustomer"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-is-customer"
                              />
                            </FormControl>
                            <FormLabel>É Cliente?</FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isSupplier"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-is-supplier"
                              />
                            </FormControl>
                            <FormLabel>É Fornecedor?</FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome / Razão Social *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-document-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sem documento</SelectItem>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                            <SelectItem value="foreign">Estrangeiro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Documento</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-document" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Contact */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Contato</h3>
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(11) 99999-9999" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(11) 99999-9999" data-testid="input-whatsapp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-email" />
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
                          <Input {...field} value={field.value || ""} placeholder="https://" data-testid="input-website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Address */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Endereço</h3>
                  
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="00000-000" data-testid="input-zipcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Rua/Logradouro</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-street" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-complement" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-neighborhood" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado (UF)</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} maxLength={2} data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Banking */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Dados Bancários</h3>
                  <p className="text-sm text-muted-foreground">
                    Opcional - Útil para conciliação bancária futura
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-bank-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="accountAgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agência</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-account-agency" />
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
                          <FormLabel>Conta</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-account-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="pixKeyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Chave PIX</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pix-key-type">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="random">Aleatória</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pixKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chave PIX</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-pix-key" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 5: Final Details */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Informações Adicionais</h3>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} rows={4} data-testid="input-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-is-active"
                            />
                          </FormControl>
                          <FormLabel>Cadastro ativo</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Review Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-sm">Resumo</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Nome:</strong> {form.watch("name") || "-"}</div>
                      <div><strong>Tipo:</strong> {
                        form.watch("isCustomer") && form.watch("isSupplier") ? "Cliente e Fornecedor" :
                        form.watch("isCustomer") ? "Cliente" :
                        form.watch("isSupplier") ? "Fornecedor" : "-"
                      }</div>
                      {form.watch("document") && (
                        <div><strong>Documento:</strong> {form.watch("document")}</div>
                      )}
                      {form.watch("email") && (
                        <div><strong>Email:</strong> {form.watch("email")}</div>
                      )}
                      {form.watch("phone") && (
                        <div><strong>Telefone:</strong> {form.watch("phone")}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                {wizardStep > 1 ? (
                  <Button type="button" variant="outline" onClick={handleWizardPrev}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                ) : (
                  <div />
                )}

                {wizardStep < 5 ? (
                  <Button type="button" onClick={handleWizardNext} data-testid="button-wizard-next">
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" data-testid="button-wizard-submit">
                    <Check className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
