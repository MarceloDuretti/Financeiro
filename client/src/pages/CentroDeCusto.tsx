import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Lightbulb,
  Target,
  BarChart3,
  Building2,
} from "lucide-react";
import type { CostCenter } from "@shared/schema";
import { formatCostCenterCode } from "@/lib/formatters";

const costCenterSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor inválida"),
});

type CostCenterFormData = z.infer<typeof costCenterSchema>;

const PRESET_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
];

export default function CentroDeCusto() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<CostCenterFormData>({
    resolver: zodResolver(costCenterSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3B82F6",
    },
  });

  const { data: costCenters = [], isLoading } = useRealtimeQuery<CostCenter[]>({
    queryKey: ['/api/cost-centers'],
    resource: 'cost-centers',
  });

  const createMutation = useMutation({
    mutationFn: async (data: CostCenterFormData) => {
      return await apiRequest('POST', '/api/cost-centers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-centers'] });
      toast({
        title: "Centro de Custo criado",
        description: "O centro de custo foi criado com sucesso.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro ao criar centro de custo",
        description: "Ocorreu um erro ao criar o centro de custo.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CostCenterFormData }) => {
      return await apiRequest('PATCH', `/api/cost-centers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-centers'] });
      toast({
        title: "Centro de Custo atualizado",
        description: "O centro de custo foi atualizado com sucesso.",
      });
      setIsDialogOpen(false);
      setEditingCostCenter(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar centro de custo",
        description: "Ocorreu um erro ao atualizar o centro de custo.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/cost-centers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-centers'] });
      toast({
        title: "Centro de Custo excluído",
        description: "O centro de custo foi excluído com sucesso.",
      });
      setDeletingId(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir centro de custo",
        description: "Ocorreu um erro ao excluir o centro de custo.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter);
    form.reset({
      name: costCenter.name,
      description: costCenter.description || "",
      color: costCenter.color,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCostCenter(null);
    form.reset();
  };

  const onSubmit = (data: CostCenterFormData) => {
    if (editingCostCenter) {
      updateMutation.mutate({ id: editingCostCenter.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredCostCenters = costCenters.filter((cc) => {
    const formattedCode = formatCostCenterCode(cc.code);
    const matchesSearch = cc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formattedCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Centro de Custo</h1>
        <p className="text-muted-foreground">
          Organize despesas e receitas por departamento, projeto ou filial
        </p>
      </div>

      {/* Educational Section - Compact */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="hover-elevate">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600">
                <Lightbulb className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">Rastreie custos por área ou projeto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-green-500 to-emerald-600">
                <Target className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">Ex: Marketing, Vendas, Projetos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-violet-600">
                <Building2 className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">Total: <span className="font-bold text-sm">{costCenters.length}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-cost-center"
            />
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            {costCenters.length > 0 && (
              <Button data-testid="button-create-cost-center">
                <Plus className="mr-2 h-4 w-4" />
                Novo Centro de Custo
              </Button>
            )}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCostCenter ? "Editar Centro de Custo" : "Novo Centro de Custo"}
              </DialogTitle>
              <DialogDescription>
                {editingCostCenter
                  ? "Atualize as informações do centro de custo."
                  : "Preencha os dados para criar um novo centro de custo."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Centro de Custo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Departamento de Marketing"
                          data-testid="input-cost-center-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descreva o uso deste centro de custo..."
                          rows={3}
                          data-testid="input-cost-center-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor do Badge</FormLabel>
                      <div className="flex gap-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => field.onChange(color)}
                            className={`h-8 w-8 rounded-md border-2 transition-all hover-elevate ${
                              field.value === color
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border"
                            }`}
                            style={{ backgroundColor: color }}
                            data-testid={`color-${color}`}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel-cost-center"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-cost-center"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Salvando..."
                      : editingCostCenter
                      ? "Atualizar"
                      : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cost Centers Grid */}
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">Carregando centros de custo...</p>
        </div>
      ) : filteredCostCenters.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-2">
            <p className="text-muted-foreground">
              {searchTerm
                ? "Nenhum centro de custo encontrado com os filtros aplicados."
                : "Nenhum centro de custo cadastrado ainda."}
            </p>
            {!searchTerm && (
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(true)}
                data-testid="button-create-first-cost-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro centro de custo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCostCenters.map((costCenter) => (
            <Card
              key={costCenter.id}
              className="hover-elevate"
              data-testid={`card-cost-center-${costCenter.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <Badge
                      style={{ backgroundColor: costCenter.color }}
                      className="text-white shrink-0"
                    >
                      {formatCostCenterCode(costCenter.code)}
                    </Badge>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CardTitle className="text-base truncate">
                        {costCenter.name}
                      </CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(costCenter)}
                      data-testid={`button-edit-cost-center-${costCenter.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(costCenter.id)}
                      data-testid={`button-delete-cost-center-${costCenter.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {costCenter.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {costCenter.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este centro de custo? Esta ação não pode ser
              desfeita.
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
