import { useState, useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
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
  Power,
  Edit2,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Copy,
  Printer,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { AIEntityInput } from "@/components/AIEntityInput";
import { AIPreviewDialog } from "@/components/AIPreviewDialog";
import { AIReportDialog } from "@/components/AIReportDialog";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { ChartAccountPicker } from "@/components/ChartAccountPicker";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

type EntityWithStats = CustomerSupplier & {
  revenuePercentage: number | null;
  expensePercentage: number | null;
};

interface ProcessedEntity {
  name: string;
  documentType?: "cpf" | "cnpj" | "foreign" | "none";
  document?: string;
  phone?: string;
  email?: string;
  website?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  confidence: number;
  source: "ai" | "cnpj_api" | "hybrid";
}

export default function ClientesFornecedores() {
  const { toast } = useToast();
  const [selectedEntity, setSelectedEntity] = useState<EntityWithStats | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntityWithStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // AI Assistant states
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiPreviewData, setAiPreviewData] = useState<ProcessedEntity | null>(null);
  const [showAiPreview, setShowAiPreview] = useState(false);
  
  // AI Report Dialog state
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  
  // View mode and search
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
    const saved = localStorage.getItem('fincontrol_customers_view_mode');
    return saved === 'list' ? 'list' : 'cards';
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use ref for synchronous submission lock to prevent race conditions
  const isSubmittingRef = useRef(false);

  // Fetch entities with real-time updates
  const { data: entities = [], isLoading } = useRealtimeQuery<EntityWithStats[]>({
    queryKey: ["/api/customers-suppliers"],
    resource: "customers-suppliers",
  });

  // Fetch chart of accounts for the default account selector
  const { data: chartAccounts = [] } = useRealtimeQuery<any[]>({
    queryKey: ["/api/chart-of-accounts"],
    resource: "chart-of-accounts",
  });

  // Fetch statistics for selected customer/supplier
  const { data: entityStats = null } = useRealtimeQuery<{
    totalRevenue: number;
    totalExpense: number;
    transactionCount: number;
    totalGlobalRevenue: number;
    totalGlobalExpense: number;
    monthlyTrend: Array<{ month: string; revenue: number; expense: number }>;
  } | null>({
    queryKey: ["/api/customers-suppliers", selectedEntity?.id || "", "stats"],
    resource: "customers-suppliers-stats",
    enabled: !!selectedEntity,
  });

  // Filter entities based on search query
  const filteredEntities = entities.filter((entity) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      entity.name?.toLowerCase().includes(q) ||
      entity.document?.toLowerCase().includes(q) ||
      entity.email?.toLowerCase().includes(q) ||
      entity.phone?.toLowerCase().includes(q)
    );
  });

  // Handle view mode change
  const handleViewModeChange = (mode: 'cards' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('fincontrol_customers_view_mode', mode);
  };

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
      defaultChartAccountId: undefined,
      isActive: true,
    },
  });

  const handleCardClick = (entity: EntityWithStats) => {
    setSelectedEntity(entity);
    setIsDrawerOpen(true);
  };

  const handleCreateNew = () => {
    setEditingEntity(null);
    // Reset form to clean default values
    form.reset({
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
      defaultChartAccountId: undefined,
      isActive: true,
    });
    setWizardStep(1);
    isSubmittingRef.current = false; // Reset submission lock
    setIsSubmitting(false);
    setIsWizardOpen(true);
  };

  const handleEdit = () => {
    if (!selectedEntity) return;
    
    // Populate form with current values for inline editing
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
      defaultChartAccountId: selectedEntity.defaultChartAccountId || undefined,
      isActive: selectedEntity.isActive,
    });
    
    // Enable inline editing mode
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.reset();
  };

  const handleSaveEdit = async () => {
    if (!selectedEntity) return;

    try {
      setIsSaving(true);
      const formData = form.getValues();
      
      await apiRequest("PATCH", `/api/customers-suppliers/${selectedEntity.id}`, {
        ...formData,
        version: selectedEntity.version,
      });

      toast({
        title: "Sucesso",
        description: "Cliente/Fornecedor atualizado com sucesso",
      });

      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/customers-suppliers"] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWizardNext = () => {
    setWizardStep((prev) => Math.min(prev + 1, 5));
  };

  const handleWizardPrev = () => {
    setWizardStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: InsertCustomerSupplier) => {
    // Prevent multiple submissions using ref for synchronous check
    if (isSubmittingRef.current) {
      console.log('[Submit] Blocked - already submitting');
      return;
    }
    
    console.log('[Submit] Starting submission');
    isSubmittingRef.current = true;
    setIsSubmitting(true);
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
      setWizardStep(1);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || `Não foi possível ${editingEntity ? "atualizar" : "criar"} o registro`,
        variant: "destructive",
      });
    } finally {
      console.log('[Submit] Finished - resetting locks');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
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

  const [isTogglingActive, setIsTogglingActive] = useState(false);
  
  const handleToggleActive = async (entity?: EntityWithStats) => {
    const targetEntity = entity || selectedEntity;
    if (!targetEntity) return;

    setIsTogglingActive(true);
    try {
      await apiRequest("PATCH", `/api/customers-suppliers/${targetEntity.id}/toggle-active`, {});

      queryClient.invalidateQueries({ queryKey: ["/api/customers-suppliers"] });

      toast({
        title: "Sucesso!",
        description: `Cliente/Fornecedor ${targetEntity.isActive ? "desativado" : "ativado"} com sucesso`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar o status",
        variant: "destructive",
      });
    } finally {
      setIsTogglingActive(false);
    }
  };

  const formatCode = (code: number) => `CLI${code.toString().padStart(3, "0")}`;
  
  const formatDocument = (document: string | null | undefined, type?: string | null) => {
    if (!document) return null;
    
    // Remove todos os caracteres não numéricos
    const numbers = document.replace(/\D/g, '');
    
    // CNPJ: 00.000.000/0000-00
    if (type === 'cnpj' || numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    // CPF: 000.000.000-00
    if (type === 'cpf' || numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    // Retorna o documento original se não for CNPJ ou CPF
    return document;
  };
  
  const formatPhone = (phone: string | null | undefined, firstOnly: boolean = false) => {
    if (!phone) return null;
    
    // Se firstOnly=true, pega apenas o primeiro telefone antes da barra
    let phoneToFormat = phone;
    if (firstOnly && phone.includes('/')) {
      phoneToFormat = phone.split('/')[0].trim();
    }
    
    // Remove todos os caracteres não numéricos
    const numbers = phoneToFormat.replace(/\D/g, '');
    
    // Celular com 9 dígitos: (00) 90000-0000
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    // Telefone fixo com 8 dígitos: (00) 0000-0000
    if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    // Retorna o telefone original se não tiver formato padrão
    return phoneToFormat;
  };
  
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

  const getTypeBadgeBorderColor = (entity: CustomerSupplier) => {
    if (entity.isCustomer && entity.isSupplier) return "border-purple-500 text-purple-700 dark:text-purple-400";
    if (entity.isCustomer) return "border-blue-500 text-blue-700 dark:text-blue-400";
    if (entity.isSupplier) return "border-orange-500 text-orange-700 dark:text-orange-400";
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

  // AI Assistant functions
  const handleProcessAI = async (input: string) => {
    setIsProcessingAI(true);
    try {
      const response = await apiRequest("POST", "/api/ai/process-entity", { input });
      const data = await response.json();
      setAiPreviewData(data as ProcessedEntity);
      setShowAiPreview(true);
    } catch (error: any) {
      console.error("[ClientesFornecedores] AI API Error:", error);
      toast({
        title: "Erro ao processar",
        description: error.message || "Não foi possível processar as informações",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleEnrichWithCNPJ = async (cnpj: string) => {
    try {
      // Re-process with the original name + CNPJ
      const originalName = aiPreviewData?.name || "";
      const enrichedInput = `${originalName}, CNPJ ${cnpj}`;
      
      const response = await apiRequest("POST", "/api/ai/process-entity", { input: enrichedInput });
      const enrichedData = await response.json();
      
      // Update preview with enriched data
      setAiPreviewData(enrichedData as ProcessedEntity);
      
      toast({
        title: "Dados enriquecidos com sucesso!",
        description: "Informações completas obtidas da Receita Federal",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enriquecer dados",
        description: error.message || "Não foi possível buscar os dados do CNPJ",
        variant: "destructive",
      });
      throw error; // Re-throw to stop loading state
    }
  };

  const handleConfirmAIData = (data: ProcessedEntity) => {
    // Populate form with AI data
    form.reset({
      ...form.getValues(),
      name: data.name,
      documentType: data.documentType || "none",
      document: data.document || "",
      phone: data.phone || "",
      email: data.email || "",
      website: data.website || "",
      zipCode: data.zipCode || "",
      street: data.street || "",
      number: data.number || "",
      complement: data.complement || "",
      neighborhood: data.neighborhood || "",
      city: data.city || "",
      state: data.state || "",
      country: data.country || "Brasil",
      // Auto-mark as both customer and supplier when using AI
      isCustomer: true,
      isSupplier: true,
    });

    setShowAiPreview(false);
    setAiPreviewData(null);

    toast({
      title: "Dados importados!",
      description: "As informações foram preenchidas automaticamente",
    });
  };

  const handleDiscardAIData = () => {
    setShowAiPreview(false);
    setAiPreviewData(null);
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
            {filteredEntities.length} {filteredEntities.length === 1 ? "registro" : "registros"}
            {searchQuery && ` (filtrado de ${entities.length})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsReportDialogOpen(true)}
            data-testid="button-ai-report"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Relatório com IA
          </Button>
          <Button onClick={handleCreateNew} data-testid="button-create-new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cadastro
          </Button>
        </div>
      </div>

      {/* Toolbar: Search + View Toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="icon"
            onClick={() => handleViewModeChange('cards')}
            data-testid="button-view-cards"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => handleViewModeChange('list')}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid/List View */}
      {filteredEntities.length === 0 ? (
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
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntities.map((entity) => {
            const percentage = entity.isCustomer ? entity.revenuePercentage : entity.expensePercentage;
            
            return (
              <Card
                key={entity.id}
                className="hover-elevate cursor-pointer bg-white/75 dark:bg-gray-900/75"
                onClick={() => handleCardClick(entity)}
                data-testid={`card-entity-${entity.id}`}
              >
                <CardContent className="p-2 space-y-1">
                  {/* Code - Type - Status */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono border-slate-400 text-slate-700 dark:text-slate-300">
                      {formatCode(entity.code)}
                    </Badge>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${getTypeBadgeBorderColor(entity)}`}>
                      {getTypeLabel(entity)}
                    </Badge>
                    {entity.isActive && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Badge className="text-[10px] h-5 px-1.5 bg-green-600 text-white">
                          Ativo
                        </Badge>
                      </>
                    )}
                    {percentage !== null && percentage > 0 && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {percentage.toFixed(1)}%
                        </Badge>
                      </>
                    )}
                  </div>

                  {/* Name */}
                  <div className="text-xs font-medium truncate uppercase" data-testid={`text-name-${entity.id}`}>
                    {entity.name}
                  </div>

                  {/* Document */}
                  {entity.document && (
                    <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <FileText className="h-3 w-3 flex-shrink-0" />
                      <span>{formatDocument(entity.document, entity.documentType)}</span>
                    </div>
                  )}

                  {/* Phone - Email */}
                  {(entity.phone || entity.email) && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {entity.phone && (
                        <>
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{formatPhone(entity.phone, true)}</span>
                        </>
                      )}
                      {entity.phone && entity.email && (
                        <span className="mx-1">-</span>
                      )}
                      {entity.email && (
                        <>
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{entity.email}</span>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEntities.map((entity) => {
            const percentage = entity.isCustomer ? entity.revenuePercentage : entity.expensePercentage;
            
            return (
              <Card
                key={entity.id}
                className="hover-elevate cursor-pointer bg-white/75 dark:bg-gray-900/75"
                onClick={() => handleCardClick(entity)}
                data-testid={`card-entity-${entity.id}`}
              >
                <CardContent className="p-2">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={entity.imageUrl || undefined} alt={entity.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {getInitials(entity.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info Section */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                      {/* Name and Code */}
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate uppercase">{entity.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{formatCode(entity.code)}</div>
                      </div>

                      {/* Document */}
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {entity.document || '-'}
                      </div>

                      {/* Contact */}
                      <div className="text-[10px] text-muted-foreground truncate">
                        {entity.phone ? formatPhone(entity.phone, true) : (entity.email || '-')}
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${getTypeBadgeBorderColor(entity)}`}>
                          {getTypeLabel(entity)}
                        </Badge>
                        {entity.isActive && (
                          <Badge className="text-[10px] h-5 px-1.5 bg-green-600 text-white">
                            Ativo
                          </Badge>
                        )}
                        {percentage !== null && percentage > 0 && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            {percentage.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Drawer - Implementation continues... */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen} modal={true}>
        <SheetContent className={`w-full flex flex-col ${isEditing ? 'sm:max-w-6xl' : 'sm:max-w-4xl'} max-h-[100vh]`}>
          {selectedEntity && (
            <Form {...form}>
              <div className="flex h-full flex-col">
              <SheetHeader className="flex-shrink-0">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedEntity.imageUrl || undefined} alt={selectedEntity.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                      {getInitials(selectedEntity.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <SheetTitle className="text-2xl">
                      {isEditing ? "Editando" : selectedEntity.name}
                    </SheetTitle>
                    <SheetDescription>
                      {formatCode(selectedEntity.code)} • {getTypeLabel(selectedEntity)}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className={`flex-1 overflow-y-auto mt-2 ${isEditing ? 'space-y-1.5 [@media(min-height:700px)]:space-y-2' : 'space-y-1 [@media(min-height:700px)]:space-y-1.5'}`}>
                {/* Main Content Layout - 2 Columns when Editing */}
                {isEditing ? (
                  <div className="grid grid-cols-[300px_1fr] gap-4">
                    {/* Left Column: Compact Info Card */}
                    <div className="space-y-1.5">
                      <Card className="p-2 bg-gradient-to-br from-card to-muted/30">
                        <div className="space-y-1.5">
                          <div className="border rounded-md px-3 py-2 bg-muted/20">
                            <span className="text-[10px] text-muted-foreground">Código</span>
                            <p className="text-sm font-medium font-mono">{formatCode(selectedEntity.code)}</p>
                          </div>
                          
                          {/* Checkboxes in horizontal layout */}
                          <div className="flex items-center gap-3">
                            <FormField
                              control={form.control}
                              name="isCustomer"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex items-center space-x-1.5">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        data-testid="checkbox-is-customer"
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs cursor-pointer">Cliente</FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="isSupplier"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex items-center space-x-1.5">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        data-testid="checkbox-is-supplier"
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs cursor-pointer">Fornecedor</FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex items-center space-x-1.5">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        data-testid="checkbox-is-active"
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs cursor-pointer">Ativo</FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </Card>

                      {/* Transaction Trend Chart */}
                      {entityStats?.monthlyTrend && entityStats.monthlyTrend.length > 0 && (
                        <Card className="p-2 bg-gradient-to-br from-card to-muted/30">
                          <div className="space-y-1">
                            <h4 className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              Tendência (6 meses)
                            </h4>
                            <div className="h-20">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={entityStats.monthlyTrend}>
                                  <XAxis 
                                    dataKey="month" 
                                    tick={{ fontSize: 9 }}
                                    axisLine={false}
                                    tickLine={false}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      fontSize: '11px',
                                      backgroundColor: 'hsl(var(--card))',
                                      border: '1px solid hsl(var(--border))',
                                      borderRadius: '6px',
                                    }}
                                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                  />
                                  {selectedEntity.isCustomer && (
                                    <Line 
                                      type="monotone" 
                                      dataKey="revenue" 
                                      stroke="hsl(142, 76%, 36%)"
                                      strokeWidth={2}
                                      dot={false}
                                    />
                                  )}
                                  {selectedEntity.isSupplier && (
                                    <Line 
                                      type="monotone" 
                                      dataKey="expense" 
                                      stroke="hsl(var(--destructive))"
                                      strokeWidth={2}
                                      dot={false}
                                    />
                                  )}
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Banking & Financial Info */}
                      <Card className="p-2 bg-gradient-to-br from-card to-muted/30">
                        <div className="space-y-1">
                          {/* Default Chart Account */}
                          <FormField
                            control={form.control}
                            name="defaultChartAccountId"
                            render={({ field }) => (
                              <FormItem className="space-y-0.5">
                                <FormLabel className="text-[9px] text-muted-foreground">Plano de Contas Padrão</FormLabel>
                                <FormControl>
                                  <ChartAccountPicker
                                    accounts={chartAccounts}
                                    value={field.value || null}
                                    onChange={field.onChange}
                                    placeholder="Selecione (opcional)"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </Card>

                      {/* Notes Card */}
                      <Card className="p-2 bg-gradient-to-br from-card to-muted/30">
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Observações</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} rows={5} placeholder="Adicione observações..." className="text-xs resize-none" data-testid="input-notes" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </Card>
                    </div>

                    {/* Right Column: Detailed Form Fields in 2-column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* Left Sub-column: Basic Info & Contact */}
                      <div className="space-y-1.5">
                        {/* Nome */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs text-muted-foreground">Nome / Razão Social *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ex: João da Silva" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Document Type + Number */}
                        <div className="grid grid-cols-4 gap-2 mt-1.5">
                          <FormField
                            control={form.control}
                            name="documentType"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Tipo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "none"}>
                                  <FormControl>
                                    <SelectTrigger className="bg-muted/20 rounded-sm border-muted/40" data-testid="select-document-type">
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
                              <FormItem className="col-span-3 space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Número do Documento</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="000.000.000-00" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-document" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Contact Fields */}
                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Telefone</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="(11) 99999-9999" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="whatsapp"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">WhatsApp</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="(11) 99999-9999" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-whatsapp" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Email</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} type="email" placeholder="exemplo@email.com" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Website</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="https://exemplo.com.br" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-website" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Right Sub-column: Address */}
                      <div className="space-y-1.5">
                        {/* Address Fields */}
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">CEP</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="00000-000" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-zipcode" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">País</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="Brasil" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-country" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="mt-1.5">
                          <FormField
                            control={form.control}
                            name="street"
                            render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs text-muted-foreground">Logradouro</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="Rua, Avenida, etc" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-street" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-1.5">
                          <FormField
                            control={form.control}
                            name="number"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Número</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="123" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="complement"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Complemento</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="Apto, Bloco, etc" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-complement" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="neighborhood"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Bairro</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="Centro" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-neighborhood" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-1.5">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem className="col-span-2 space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Cidade</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="São Paulo" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-city" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">UF</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} maxLength={2} placeholder="SP" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-state" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Financial Information - Horizontal Section in 2 rows - spans full width */}
                      <div className="lg:col-span-2 space-y-1.5">
                        <h4 className="text-xs font-medium text-muted-foreground">Informações Financeiras</h4>
                        
                        {/* Row 1: Bank Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1.5">
                          <FormField
                            control={form.control}
                            name="bankName"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Banco</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="Ex: Banco do Brasil" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-bank-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="accountAgency"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Agência</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="0000" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-account-agency" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="accountNumber"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Conta</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="00000-0" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-account-number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Row 2: PIX Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5">
                          <FormField
                            control={form.control}
                            name="pixKeyType"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Tipo PIX</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "cpf"}>
                                  <FormControl>
                                    <SelectTrigger className="bg-muted/20 rounded-sm border-muted/40" data-testid="select-pix-key-type">
                                      <SelectValue placeholder="Selecione" />
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
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Chave PIX</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="Digite a chave PIX" className="bg-muted/20 rounded-sm border-muted/40" data-testid="input-pix-key" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* View Mode - Original Layout */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="border rounded-md p-2">
                          <span className="text-xs text-muted-foreground">Nome / Razão Social</span>
                          <p className="text-sm font-medium mt-0.5" data-testid="text-name">{selectedEntity.name}</p>
                        </div>
                        {selectedEntity.document && (
                          <div className="border rounded-md p-2">
                            <span className="text-xs text-muted-foreground">
                              {selectedEntity.documentType?.toUpperCase() || "Documento"}
                            </span>
                            <p className="text-sm font-medium font-mono mt-0.5" data-testid="text-document">{selectedEntity.document}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* View Mode - 2-Column Layout */}
                {!isEditing && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {/* LEFT COLUMN - Relationship Stats */}
                    <Card className="border-0 bg-gradient-to-br from-card to-muted/30 shadow-md flex-1">
                      <CardContent className="p-2.5 [@media(min-height:700px)]:p-3 space-y-1.5 [@media(min-height:700px)]:space-y-2">
                        {/* Type & Status Badges */}
                        <div className="flex gap-2 flex-wrap mb-2">
                          <Badge className={getTypeBadgeColor(selectedEntity)}>
                            {getTypeLabel(selectedEntity)}
                          </Badge>
                          <Badge variant={selectedEntity.isActive ? "default" : "secondary"}>
                            {selectedEntity.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>

                        {/* Title */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Relacionamento Comercial
                          </h3>
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            Últimos 6 Meses
                          </Badge>
                        </div>

                        {/* Main Metric */}
                        <div>
                          {entityStats ? (
                            <div
                              className={`text-xl [@media(min-height:700px)]:text-2xl font-bold tabular-nums ${
                                selectedEntity.isCustomer ? "text-green-600" : "text-destructive"
                              }`}
                            >
                              {selectedEntity.isCustomer ? "+" : "-"} R${" "}
                              {(selectedEntity.isCustomer 
                                ? entityStats.totalRevenue 
                                : entityStats.totalExpense
                              ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                          ) : (
                            <div className="text-xl [@media(min-height:700px)]:text-2xl font-bold text-muted-foreground">
                              Carregando...
                            </div>
                          )}
                        </div>

                        {/* Percentage Bar */}
                        {entityStats && (
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between text-[11px] [@media(min-height:700px)]:text-xs">
                              <span className="text-muted-foreground">
                                Representa{" "}
                                {(
                                  (selectedEntity.isCustomer
                                    ? (entityStats.totalRevenue / (entityStats.totalGlobalRevenue || 1)) * 100
                                    : (entityStats.totalExpense / (entityStats.totalGlobalExpense || 1)) * 100)
                                ).toFixed(1)}
                                % do total
                              </span>
                            </div>
                            <div className="h-1.5 [@media(min-height:700px)]:h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  selectedEntity.isCustomer ? "bg-green-600" : "bg-destructive"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    (selectedEntity.isCustomer
                                      ? (entityStats.totalRevenue / (entityStats.totalGlobalRevenue || 1)) * 100
                                      : (entityStats.totalExpense / (entityStats.totalGlobalExpense || 1)) * 100),
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <Separator className="my-1.5" />

                        {/* Secondary Metrics */}
                        {entityStats && (
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                Transações
                              </p>
                              <p className="text-xs [@media(min-height:700px)]:text-sm font-bold tabular-nums">
                                {entityStats.transactionCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                Média Mensal
                              </p>
                              <p className="text-xs [@media(min-height:700px)]:text-sm font-bold tabular-nums">
                                R${" "}
                                {(
                                  (selectedEntity.isCustomer
                                    ? entityStats.totalRevenue
                                    : entityStats.totalExpense) / 6
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}

                        <Separator className="my-1.5" />

                        {/* Default Chart Account */}
                        <div>
                          <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Plano de Contas Padrão
                          </p>
                          <p className="text-xs [@media(min-height:700px)]:text-sm font-medium">
                            {selectedEntity.defaultChartAccountId 
                              ? (chartAccounts.find(ca => ca.id === selectedEntity.defaultChartAccountId)?.fullName || "Não encontrado")
                              : "Não configurado"}
                          </p>
                        </div>

                        <Separator className="my-1.5" />

                        {/* Line Chart */}
                        {entityStats && entityStats.monthlyTrend && entityStats.monthlyTrend.length > 0 && (
                          <div>
                            <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground uppercase tracking-wide mb-1">
                              Evolução Mensal
                            </p>
                            <div className="h-[50px] [@media(min-height:700px)]:h-[80px]">
                              <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={entityStats.monthlyTrend}
                                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                              >
                                <XAxis
                                  dataKey="month"
                                  tick={{ fontSize: 10 }}
                                  stroke="hsl(var(--muted-foreground))"
                                  tickLine={false}
                                  axisLine={false}
                                  tickFormatter={(value) => {
                                    try {
                                      return format(new Date(value), "MMM/yy", { locale: pt });
                                    } catch {
                                      return value;
                                    }
                                  }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    fontSize: "11px",
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "6px",
                                  }}
                                  labelFormatter={(value) => {
                                    try {
                                      return format(new Date(value), "MMM/yy", { locale: pt });
                                    } catch {
                                      return value;
                                    }
                                  }}
                                />
                                {selectedEntity.isCustomer && (
                                  <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="hsl(142 76% 36%)"
                                    strokeWidth={2}
                                    dot={false}
                                  />
                                )}
                                {selectedEntity.isSupplier && (
                                  <Line
                                    type="monotone"
                                    dataKey="expense"
                                    stroke="hsl(var(--destructive))"
                                    strokeWidth={2}
                                    dot={false}
                                  />
                                )}
                              </LineChart>
                            </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* RIGHT COLUMN - Entity Details */}
                    <div className="space-y-1.5 [@media(min-height:700px)]:space-y-2">
                      {/* Phone (mostra phone ou whatsapp, prioriza phone) */}
                      {(selectedEntity.phone || selectedEntity.whatsapp) && (
                        <div>
                          <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">Telefone</p>
                          <div className="flex items-center gap-2">
                            <div className="border rounded-md px-3 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium flex-1" data-testid="text-phone">
                              {formatPhone(selectedEntity.phone || selectedEntity.whatsapp)}
                            </div>
                            {(selectedEntity.whatsapp || selectedEntity.phone) && (
                              <a
                                href={formatWhatsAppLink((selectedEntity.whatsapp || selectedEntity.phone)!)}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid="link-whatsapp-detail"
                              >
                                <SiWhatsapp className="h-4 w-4 text-green-500 hover:text-green-600" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Email */}
                      {selectedEntity.email && (
                        <div>
                          <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">Email</p>
                          <div className="border rounded-md px-3 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium" data-testid="text-email">
                            {selectedEntity.email || "-"}
                          </div>
                        </div>
                      )}

                      {/* Website */}
                      {selectedEntity.website && (
                        <div>
                          <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">Website</p>
                          <div className="border rounded-md px-3 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium">
                            <a
                              href={selectedEntity.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              data-testid="text-website"
                            >
                              {selectedEntity.website}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Address Fields */}
                      {selectedEntity.zipCode && (
                        <div>
                          <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">CEP</p>
                          <div className="border rounded-md px-3 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium">
                            {selectedEntity.zipCode || "-"}
                          </div>
                        </div>
                      )}

                      {selectedEntity.street && (
                        <div>
                          <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">Endereço</p>
                          <div className="border rounded-md px-3 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium" data-testid="text-address">
                            {selectedEntity.street}
                            {selectedEntity.number && `, ${selectedEntity.number}`}
                          </div>
                        </div>
                      )}

                      {selectedEntity.complement && (
                        <div>
                          <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">Complemento</p>
                          <div className="border rounded-md px-3 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium">
                            {selectedEntity.complement || "-"}
                          </div>
                        </div>
                      )}

                      {selectedEntity.neighborhood && (
                        <div>
                          <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">Bairro</p>
                          <div className="border rounded-md px-3 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium">
                            {selectedEntity.neighborhood || "-"}
                          </div>
                        </div>
                      )}

                      {(selectedEntity.city || selectedEntity.state) && (
                        <div>
                          <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">Cidade/Estado</p>
                          <div className="border rounded-md px-3 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium">
                            {selectedEntity.city}
                            {selectedEntity.city && selectedEntity.state && " - "}
                            {selectedEntity.state}
                          </div>
                        </div>
                      )}

                      {/* Banking Info - 3 Column Grid */}
                      {(selectedEntity.bankName || selectedEntity.accountAgency || selectedEntity.accountNumber) && (
                        <div className="grid grid-cols-3 gap-2">
                          {selectedEntity.bankName && (
                            <div>
                              <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">Banco</p>
                              <div className="border rounded-md px-2 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium truncate" data-testid="text-bank">
                                {selectedEntity.bankName}
                              </div>
                            </div>
                          )}
                          {selectedEntity.accountAgency && (
                            <div>
                              <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">Agência</p>
                              <div className="border rounded-md px-2 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium truncate">
                                {selectedEntity.accountAgency}
                              </div>
                            </div>
                          )}
                          {selectedEntity.accountNumber && (
                            <div>
                              <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">Conta</p>
                              <div className="border rounded-md px-2 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium truncate">
                                {selectedEntity.accountNumber}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Default Chart Account */}
                      {selectedEntity.defaultChartAccountId && (
                        <div>
                          <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">Plano de Contas Padrão</p>
                          <div className="border rounded-md px-3 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium" data-testid="text-default-chart-account">
                            {chartAccounts.find(ca => ca.id === selectedEntity.defaultChartAccountId)?.fullName || 
                             selectedEntity.defaultChartAccountId}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {selectedEntity.notes && (
                        <div>
                          <p className="text-[11px] [@media(min-height:700px)]:text-xs text-muted-foreground mb-1">Observações</p>
                          <div className="border rounded-md px-3 py-2 bg-muted/20 text-[13px] [@media(min-height:700px)]:text-sm font-medium whitespace-pre-wrap" data-testid="text-notes">
                            {selectedEntity.notes || "-"}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-3 mt-2">
                        <div className="flex justify-between gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleEdit}
                            data-testid="button-edit"
                          >
                            <Edit2 className="h-4 w-4 mr-1.5" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive()}
                            disabled={isTogglingActive}
                            data-testid="button-toggle-active"
                          >
                            {isTogglingActive ? (
                              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-1.5" />
                                {selectedEntity.isActive ? "Desativar" : "Ativar"}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Imprimir",
                                description: "Funcionalidade em desenvolvimento",
                              });
                            }}
                            data-testid="button-print"
                          >
                            <Printer className="h-4 w-4 mr-1.5" />
                            Imprimir
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                data-testid="button-delete-trigger"
                              >
                                <Trash2 className="h-4 w-4 mr-1.5" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir "{selectedEntity.name}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDelete}
                                  disabled={isDeleting}
                                  data-testid="button-confirm-delete"
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Excluir"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer for Edit Mode */}
              {isEditing && (
                <div className="flex justify-start gap-2 pt-4 border-t flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    data-testid="button-cancel-edit"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    data-testid="button-save-edit"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Salvar
                  </Button>
                </div>
              )}
              </div>
            </Form>
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
                  
                  {/* AI Assistant - Only show in creation mode */}
                  {!editingEntity && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <span className="text-primary">🤖</span>
                        Assistente Inteligente
                      </h4>
                      <AIEntityInput 
                        onProcess={handleProcessAI}
                        isProcessing={isProcessingAI}
                      />
                    </div>
                  )}
                  
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
                        <Select onValueChange={field.onChange} value={field.value || "none"}>
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
                    name="defaultChartAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plano de Contas Padrão</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-default-chart-account-wizard">
                              <SelectValue placeholder="Selecione (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {chartAccounts.map((account: any) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || form.formState.isSubmitting} 
                    data-testid="button-wizard-submit"
                  >
                    {(isSubmitting || form.formState.isSubmitting) ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {(isSubmitting || form.formState.isSubmitting) ? "Salvando..." : "Salvar"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* AI Preview Dialog */}
      <AIPreviewDialog
        open={showAiPreview}
        onOpenChange={setShowAiPreview}
        data={aiPreviewData}
        onConfirm={handleConfirmAIData}
        onDiscard={handleDiscardAIData}
        onEnrich={handleEnrichWithCNPJ}
      />

      {/* AI Report Dialog */}
      <AIReportDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
      />
    </div>
  );
}
